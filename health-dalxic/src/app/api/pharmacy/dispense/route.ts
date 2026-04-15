import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { createBillableItem } from "@/lib/billing";
import { notifyPatient } from "@/lib/whatsapp";
import { rateLimit } from "@/lib/rate-limit";

// POST: Dispense hospital prescription with FEFO stock deduction
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { hospitalCode, recordId, dispensedBy } = body;

  if (!hospitalCode || !recordId) {
    return Response.json({ error: "hospitalCode and recordId required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const record = await db.patientRecord.findUnique({ where: { id: recordId } });
  if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

  const treatment = record.treatment as {
    prescriptions?: Array<{ medication: string; dosage: string; frequency: string; duration: string; dispensed?: boolean; dispensedAt?: string; dispensedBy?: string }>;
    [key: string]: unknown;
  };
  if (!treatment.prescriptions?.length) {
    return Response.json({ error: "No prescriptions to dispense" }, { status: 400 });
  }

  const now = new Date();
  const operator = dispensedBy || "pharmacist";
  let dispensedCount = 0;
  const stockDeductions: Array<{ drugName: string; quantity: number; batchId: string | null; matched: boolean }> = [];

  for (const rx of treatment.prescriptions) {
    if (rx.dispensed) continue;

    // Try to match prescription to catalog by medication name
    const drug = await db.drugCatalog.findFirst({
      where: { hospitalId: hospital.id, name: { contains: rx.medication, mode: "insensitive" }, isActive: true },
    });

    if (drug) {
      // FEFO: get earliest-expiring batch with enough stock
      const batch = await db.drugStock.findFirst({
        where: { drugCatalogId: drug.id, hospitalId: hospital.id, status: "ACTIVE", quantityRemaining: { gt: 0 } },
        orderBy: { expiryDate: "asc" },
      });

      if (batch) {
        // Parse quantity from dosage/duration (default to 1 if can't parse)
        const qty = parseDispenseQuantity(rx);
        const deductQty = Math.min(qty, batch.quantityRemaining);
        const newRemaining = batch.quantityRemaining - deductQty;

        await db.drugStock.update({
          where: { id: batch.id },
          data: { quantityRemaining: newRemaining, status: newRemaining === 0 ? "DEPLETED" : "ACTIVE" },
        });

        await db.stockMovement.create({
          data: {
            hospitalId: hospital.id, drugStockId: batch.id, drugCatalogId: drug.id,
            type: "DISPENSED_HOSPITAL", quantity: deductQty,
            balanceBefore: batch.quantityRemaining, balanceAfter: newRemaining,
            reference: recordId, performedBy: operator,
            notes: `Rx: ${rx.medication} — ${rx.dosage} ${rx.frequency}`,
          },
        });

        stockDeductions.push({ drugName: rx.medication, quantity: deductQty, batchId: batch.id, matched: true });
      } else {
        stockDeductions.push({ drugName: rx.medication, quantity: 0, batchId: null, matched: false });
      }
    } else {
      stockDeductions.push({ drugName: rx.medication, quantity: 0, batchId: null, matched: false });
    }

    rx.dispensed = true;
    rx.dispensedAt = now.toISOString();
    rx.dispensedBy = operator;
    dispensedCount++;
  }

  await db.patientRecord.update({
    where: { id: recordId },
    data: { treatment: JSON.parse(JSON.stringify(treatment)) },
  });

  // Emit billable item
  const book = await db.monthlyBook.findFirst({
    where: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" },
  });
  if (book && dispensedCount > 0) {
    const rxNames = treatment.prescriptions.map((rx) => rx.medication).filter(Boolean).join(", ");

    // Calculate total cost from matched stock deductions
    let totalDrugCost = 0;
    for (const d of stockDeductions) {
      if (d.matched && d.batchId) {
        const batch = await db.drugStock.findUnique({ where: { id: d.batchId } });
        if (batch) totalDrugCost += batch.sellPrice * d.quantity;
      }
    }

    await createBillableItem({
      hospitalId: hospital.id,
      patientId: recordId,
      bookId: book.id,
      serviceType: "DRUG",
      description: `Pharmacy: ${rxNames || "Medications"}`,
      unitCost: totalDrugCost > 0 ? totalDrugCost : 15,
      quantity: 1,
      renderedBy: operator,
      departmentId: "pharmacy",
      overrideUnitCost: totalDrugCost > 0 ? totalDrugCost : undefined,
    });
  }

  await logAudit({
    actorType: "device_operator",
    actorId: operator,
    hospitalId: hospital.id,
    action: "pharmacy.dispensed",
    metadata: { recordId, dispensedCount, stockDeductions },
    ipAddress: getClientIP(request),
  });

  // Advance visit status
  try {
    const visitUrl = new URL("/api/visit", request.url);
    await fetch(visitUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalCode, action: "pharmacy_complete", recordId }),
    });
  } catch { /* non-blocking */ }

  // WhatsApp notification
  const rxNames = treatment.prescriptions.map((rx) => rx.medication).filter(Boolean).join(", ");
  notifyPatient(recordId, "prescription_ready", { medications: rxNames }).catch(() => {});

  return Response.json({ success: true, dispensedCount, stockDeductions });
}

/**
 * Parse a reasonable dispense quantity from prescription fields.
 * dosage is usually a strength ("500mg", "5ml") — NOT a unit count — so we only
 * treat it as a tablet count when the text explicitly says "tab/cap/pill/unit/piece".
 * Otherwise dosagePerTake defaults to 1.
 */
function parseDispenseQuantity(rx: { dosage: string; frequency: string; duration: string }): number {
  const dosageText = (rx.dosage || "").toLowerCase();
  const freqText = (rx.frequency || "").toLowerCase();
  const durationText = (rx.duration || "").toLowerCase();

  // Units per take — only trust an explicit tablet/capsule count
  const unitMatch = dosageText.match(/(\d+)\s*(tab|cap|pill|unit|piece|drop|puff|spray)/);
  const dosagePerTake = unitMatch ? parseInt(unitMatch[1], 10) : 1;

  // Times per day — handle digits, Latin abbreviations, and common English phrases
  let timesPerDay = 1;
  const freqDigit = freqText.match(/(\d+)\s*(x|times|\/)/);
  if (freqDigit) timesPerDay = parseInt(freqDigit[1], 10);
  else if (/\b(qid|four\s+times)\b/.test(freqText)) timesPerDay = 4;
  else if (/\b(tid|three\s+times|thrice)\b/.test(freqText)) timesPerDay = 3;
  else if (/\b(bid|twice|two\s+times)\b/.test(freqText)) timesPerDay = 2;
  else if (/\b(od|once|daily|qd)\b/.test(freqText)) timesPerDay = 1;

  // Duration in days — parse leading number; treat "1 week" as 7
  let days = parseInt(durationText, 10) || 1;
  if (/\bweek/.test(durationText)) days = (parseInt(durationText, 10) || 1) * 7;

  const total = dosagePerTake * timesPerDay * days;
  // Safety cap: reject any single-prescription dispense above 120 units
  return Math.max(1, Math.min(total, 120));
}
