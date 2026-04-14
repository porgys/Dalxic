import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { createBillableItem } from "@/lib/billing";
import { notifyPatient } from "@/lib/whatsapp";
import { rateLimit } from "@/lib/rate-limit";
// GET: Get patients with prescriptions for today
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const view = searchParams.get("view"); // pending | dispensed | all

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const records = await db.patientRecord.findMany({
    where: { hospitalId: hospital.id },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  type Rx = { medication: string; dosage: string; frequency: string; duration: string; dispensed?: boolean; dispensedAt?: string; dispensedBy?: string };

  const patients = records
    .filter((r) => {
      const treatment = r.treatment as { prescriptions?: Rx[] };
      return treatment.prescriptions && treatment.prescriptions.length > 0;
    })
    .map((r) => {
      const patient = r.patient as { fullName: string };
      const visit = r.visit as { queueToken: string; department: string; emergencyFlag?: boolean };
      const treatment = r.treatment as { prescriptions: Rx[] };
      const allDispensed = treatment.prescriptions.every((rx) => rx.dispensed);
      return {
        recordId: r.id,
        patientName: patient.fullName,
        queueToken: visit.queueToken,
        department: visit.department,
        emergencyFlag: visit.emergencyFlag ?? false,
        prescriptions: treatment.prescriptions,
        allDispensed,
        createdAt: r.createdAt,
      };
    });

  const filtered = view === "pending" ? patients.filter((p) => !p.allDispensed)
    : view === "dispensed" ? patients.filter((p) => p.allDispensed)
    : patients;

  const counts = {
    total: patients.length,
    pending: patients.filter((p) => !p.allDispensed).length,
    dispensed: patients.filter((p) => p.allDispensed).length,
  };

  return Response.json({ patients: filtered, counts });
}

// POST: Dispense prescriptions
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { hospitalCode, recordId, dispensedBy } = body as {
    hospitalCode: string;
    recordId: string;
    dispensedBy?: string;
  };

  if (!hospitalCode || !recordId) {
    return Response.json({ error: "hospitalCode and recordId required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const record = await db.patientRecord.findUnique({ where: { id: recordId } });
  if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

  const treatment = record.treatment as { prescriptions?: Array<{ medication: string; dispensed?: boolean; dispensedAt?: string; dispensedBy?: string }>; [key: string]: unknown };
  if (!treatment.prescriptions?.length) {
    return Response.json({ error: "No prescriptions to dispense" }, { status: 400 });
  }

  // Mark all prescriptions as dispensed
  const now = new Date();
  const operator = dispensedBy || "pharmacist";
  let dispensedCount = 0;
  treatment.prescriptions.forEach((rx) => {
    if (!rx.dispensed) {
      rx.dispensed = true;
      rx.dispensedAt = now.toISOString();
      rx.dispensedBy = operator;
      dispensedCount++;
    }
  });

  await db.patientRecord.update({
    where: { id: recordId },
    data: { treatment: JSON.parse(JSON.stringify(treatment)) },
  });

  // Emit billable item for dispensing
  const book = await db.monthlyBook.findFirst({
    where: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" },
  });
  if (book && dispensedCount > 0) {
    const rxNames = treatment.prescriptions.map((rx) => rx.medication).filter(Boolean).join(", ");
    await createBillableItem({
      hospitalId: hospital.id,
      patientId: recordId,
      bookId: book.id,
      serviceType: "DRUG",
      description: `Pharmacy: ${rxNames || "Medications"}`,
      unitCost: 15,
      quantity: dispensedCount,
      renderedBy: operator,
      departmentId: "pharmacy",
    });
  }

  await logAudit({
    actorType: "device_operator",
    actorId: operator,
    hospitalId: hospital.id,
    action: "pharmacy.dispensed",
    metadata: { recordId, dispensedCount, medications: treatment.prescriptions.map((rx) => rx.medication) },
    ipAddress: getClientIP(request),
  });

  // Advance visit status to awaiting_close
  try {
    const visitUrl = new URL("/api/visit", request.url);
    await fetch(visitUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalCode, action: "pharmacy_complete", recordId }),
    });
  } catch { /* non-blocking */ }

  // WhatsApp notification — non-blocking
  const rxNames = treatment.prescriptions.map((rx) => rx.medication).filter(Boolean).join(", ");
  notifyPatient(recordId, "prescription_ready", { medications: rxNames }).catch(() => {});

  return Response.json({ success: true, dispensedCount });
}
