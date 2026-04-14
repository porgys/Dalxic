import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { createBillableItem } from "@/lib/billing";
import { rateLimit } from "@/lib/rate-limit";
// GET: Get injection orders for a hospital
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const status = searchParams.get("status"); // pending | in_progress | completed | all

  if (!hospitalCode) {
    return Response.json({ error: "hospitalCode required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // Injection orders are stored in PatientRecord treatment.injectionOrders
  const records = await db.patientRecord.findMany({
    where: { hospitalId: hospital.id },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  type InjectionOrder = {
    id: string;
    drug: string;
    route: string;
    dose: string;
    frequency: string;
    status: string;
    orderedBy: string;
    orderedAt: string;
    administeredBy?: string;
    administeredAt?: string;
    notes?: string;
  };

  const orders = records.flatMap((r) => {
    const treatment = r.treatment as { injectionOrders?: InjectionOrder[] };
    const patient = r.patient as { fullName: string };
    const visit = r.visit as { queueToken: string; department: string };
    if (!treatment.injectionOrders || treatment.injectionOrders.length === 0) return [];
    return treatment.injectionOrders.map((inj: InjectionOrder) => ({
      ...inj,
      recordId: r.id,
      patientName: patient.fullName,
      queueToken: visit.queueToken,
      department: visit.department,
    }));
  });

  // Filter by status
  const filtered = status && status !== "all"
    ? orders.filter((o) => o.status === status)
    : orders;

  const counts = {
    pending: orders.filter((o) => o.status === "pending").length,
    in_progress: orders.filter((o) => o.status === "in_progress").length,
    completed: orders.filter((o) => o.status === "completed").length,
    total: orders.length,
  };

  return Response.json({ orders: filtered, counts });
}

// POST: Create injection order (from doctor)
// PATCH: Update injection status (administered by nurse)
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { hospitalCode, action } = body;

  if (!hospitalCode || !action) {
    return Response.json({ error: "hospitalCode and action required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // Doctor orders an injection
  if (action === "order_injection") {
    const { recordId, drug, route, dose, frequency, orderedBy, notes } = body;
    if (!recordId || !drug || !route || !dose) {
      return Response.json({ error: "recordId, drug, route, dose required" }, { status: 400 });
    }

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const treatment = record.treatment as { injectionOrders?: unknown[]; [key: string]: unknown };
    const orders = treatment.injectionOrders || [];
    const newOrder = {
      id: `INJ-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      drug, route, dose, frequency: frequency || "stat",
      status: "pending",
      orderedBy: orderedBy || "doctor",
      orderedAt: new Date().toISOString(),
      notes: notes || null,
    };

    orders.push(newOrder);

    await db.patientRecord.update({
      where: { id: recordId },
      data: { treatment: JSON.parse(JSON.stringify({ ...treatment, injectionOrders: orders })) },
    });

    await logAudit({
      actorType: "device_operator",
      actorId: orderedBy || "doctor",
      hospitalId: hospital.id,
      action: "injection.ordered",
      metadata: { recordId, drug, route, dose, orderId: newOrder.id },
      ipAddress: getClientIP(request),
    });

    return Response.json(newOrder, { status: 201 });
  }

  // Nurse administers injection
  if (action === "administer") {
    const { recordId, injectionId, administeredBy, notes } = body;
    if (!recordId || !injectionId) {
      return Response.json({ error: "recordId and injectionId required" }, { status: 400 });
    }

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const treatment = record.treatment as { injectionOrders?: Array<{ id: string; drug: string; status: string; administeredBy?: string; administeredAt?: string; notes?: string }>; [key: string]: unknown };
    const orders = treatment.injectionOrders || [];
    const idx = orders.findIndex((o) => o.id === injectionId);
    if (idx === -1) return Response.json({ error: "Injection order not found" }, { status: 404 });

    orders[idx].status = "completed";
    orders[idx].administeredBy = administeredBy || "nurse";
    orders[idx].administeredAt = new Date().toISOString();
    if (notes) orders[idx].notes = (orders[idx].notes || "") + ` | Nurse: ${notes}`;

    await db.patientRecord.update({
      where: { id: recordId },
      data: { treatment: JSON.parse(JSON.stringify({ ...treatment, injectionOrders: orders })) },
    });

    // Emit billable item for the injection
    const now = new Date();
    const book = await db.monthlyBook.findFirst({
      where: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" },
    });

    if (book) {
      const patient = record.patient as { fullName: string };
      await createBillableItem({
        hospitalId: hospital.id,
        patientId: record.id,
        bookId: book.id,
        serviceType: "PROCEDURE",
        description: `Injection: ${orders[idx].drug}`,
        unitCost: 15, // Default injection fee, overridden by ServicePrice if configured
        renderedBy: administeredBy || "nurse",
      });

      await logAudit({
        actorType: "device_operator",
        actorId: administeredBy || "nurse",
        hospitalId: hospital.id,
        action: "injection.administered",
        metadata: { recordId, injectionId, drug: orders[idx].drug, patientName: patient.fullName },
        ipAddress: getClientIP(request),
      });
    }

    return Response.json({ success: true, injection: orders[idx] });
  }

  // Mark as in-progress
  if (action === "start") {
    const { recordId, injectionId, administeredBy } = body;
    if (!recordId || !injectionId) {
      return Response.json({ error: "recordId and injectionId required" }, { status: 400 });
    }

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const treatment = record.treatment as { injectionOrders?: Array<{ id: string; status: string; administeredBy?: string }>; [key: string]: unknown };
    const orders = treatment.injectionOrders || [];
    const idx = orders.findIndex((o) => o.id === injectionId);
    if (idx === -1) return Response.json({ error: "Injection order not found" }, { status: 404 });

    orders[idx].status = "in_progress";
    orders[idx].administeredBy = administeredBy || "nurse";

    await db.patientRecord.update({
      where: { id: recordId },
      data: { treatment: JSON.parse(JSON.stringify({ ...treatment, injectionOrders: orders })) },
    });

    return Response.json({ success: true, injection: orders[idx] });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
