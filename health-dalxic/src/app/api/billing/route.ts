import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { assembleBill, getUnbilledItems, generateBillNumber, createBillableItem } from "@/lib/billing";

// GET: Get billing data — unbilled items, bills, or patient bill history
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const patientId = searchParams.get("patientId");
  const view = searchParams.get("view"); // "unbilled" | "bills" | "summary"

  if (!hospitalCode) {
    return Response.json({ error: "hospitalCode required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // Patient-specific views
  if (patientId) {
    if (view === "unbilled") {
      const items = await getUnbilledItems(hospital.id, patientId);
      const total = items.reduce((s, i) => s + i.totalCost, 0);
      return Response.json({ items, total });
    }

    if (view === "bills") {
      const bills = await db.bill.findMany({
        where: { hospitalId: hospital.id, patientId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      return Response.json(bills);
    }
  }

  // Summary view — today's billing stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayItems, todayBills, unpaidBills] = await Promise.all([
    db.billableItem.count({ where: { hospitalId: hospital.id, renderedAt: { gte: today } } }),
    db.bill.findMany({ where: { hospitalId: hospital.id, createdAt: { gte: today } } }),
    db.bill.findMany({ where: { hospitalId: hospital.id, status: { in: ["DRAFT", "ISSUED", "PART_PAID"] } } }),
  ]);

  const todayRevenue = todayBills.filter((b) => b.status === "PAID").reduce((s, b) => s + b.total, 0);
  const pendingAmount = unpaidBills.reduce((s, b) => s + b.total, 0);

  return Response.json({
    todayItemsCount: todayItems,
    todayBillsCount: todayBills.length,
    todayRevenue,
    pendingBillsCount: unpaidBills.length,
    pendingAmount,
  });
}

// POST: Create a bill from unbilled items, or record payment
export async function POST(request: Request) {
  const body = await request.json();
  const { hospitalCode, action } = body;

  if (!hospitalCode || !action) {
    return Response.json({ error: "hospitalCode and action required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // Assemble a bill from unbilled items
  if (action === "assemble_bill") {
    const { patientId, discount, createdBy } = body;
    if (!patientId) return Response.json({ error: "patientId required" }, { status: 400 });

    // Find active book
    const now = new Date();
    const book = await db.monthlyBook.findFirst({
      where: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" },
    });
    if (!book) return Response.json({ error: "No active book" }, { status: 409 });

    const bill = await assembleBill({
      hospitalId: hospital.id,
      hospitalCode: hospital.code,
      patientId,
      bookId: book.id,
      discount: discount || 0,
      createdBy: createdBy || "billing_officer",
    });

    if (!bill) return Response.json({ error: "No unbilled items for this patient" }, { status: 404 });

    await logAudit({
      actorType: "device_operator",
      actorId: createdBy || "billing_officer",
      hospitalId: hospital.id,
      action: "billing.bill_created",
      metadata: { billNumber: bill.billNumber, total: bill.total, itemCount: bill.items.length },
      ipAddress: getClientIP(request),
    });

    return Response.json(bill, { status: 201 });
  }

  // Record payment on a bill
  if (action === "record_payment") {
    const { billId, paymentMethod, paidAmount } = body;
    if (!billId || !paymentMethod) return Response.json({ error: "billId and paymentMethod required" }, { status: 400 });

    const bill = await db.bill.findUnique({ where: { id: billId } });
    if (!bill) return Response.json({ error: "Bill not found" }, { status: 404 });

    const newStatus = (paidAmount && paidAmount < bill.total) ? "PART_PAID" : "PAID";

    const updated = await db.bill.update({
      where: { id: billId },
      data: {
        status: newStatus,
        paymentMethod,
        paidAt: newStatus === "PAID" ? new Date() : null,
        issuedAt: bill.issuedAt || new Date(),
      },
    });

    await logAudit({
      actorType: "device_operator",
      actorId: body.recordedBy || "billing_officer",
      hospitalId: hospital.id,
      action: "billing.payment_recorded",
      metadata: { billNumber: bill.billNumber, paymentMethod, status: newStatus },
      ipAddress: getClientIP(request),
    });

    return Response.json(updated);
  }

  // Set service prices
  if (action === "set_price") {
    const { serviceType, name, unitCost } = body;
    if (!serviceType || !name || unitCost == null) return Response.json({ error: "serviceType, name, unitCost required" }, { status: 400 });

    const price = await db.servicePrice.upsert({
      where: { hospitalId_serviceType_name: { hospitalId: hospital.id, serviceType, name } },
      update: { unitCost, isActive: true },
      create: { hospitalId: hospital.id, serviceType, name, unitCost },
    });

    return Response.json(price);
  }

  // Emit a billable item from any module (universal connector)
  if (action === "emit_billable") {
    const { recordId, serviceType, description, unitCost, quantity, renderedBy } = body;
    if (!recordId || !serviceType || !description) {
      return Response.json({ error: "recordId, serviceType, description required" }, { status: 400 });
    }

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const item = await createBillableItem({
      hospitalId: hospital.id,
      patientId: recordId,
      bookId: record.bookId,
      serviceType,
      description,
      unitCost: unitCost || 50,
      quantity: quantity || 1,
      renderedBy: renderedBy || "system",
    });

    return Response.json(item, { status: 201 });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
