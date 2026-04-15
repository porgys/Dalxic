import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { createBillableItem } from "@/lib/billing";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

/**
 * Runtime validators for imaging order payloads. These match the *legacy*
 * imaging shape stored in existing PatientRecord rows (ct_radiology modality,
 * "completed" status, examType field) — distinct from @/types/patient-record
 * which is the canonical forward-looking schema.
 */
const ImagingOrderInputSchema = z.object({
  modality: z.enum(["ct_radiology", "ultrasound"]),
  examType: z.string().min(1).max(120),
  bodyPart: z.string().min(1).max(120),
  clinicalIndication: z.string().max(2000).optional(),
  urgency: z.enum(["routine", "urgent", "stat"]).default("routine"),
  orderedBy: z.string().max(120).optional(),
});

const ImagingReportInputSchema = z.object({
  findings: z.string().max(10000).optional(),
  impression: z.string().max(4000).optional(),
  imageData: z.string().optional(), // base64, size-gated on the client
  reportedBy: z.string().max(120).optional(),
});
// GET: Get imaging orders (CT/Radiology or Ultrasound)
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const modality = searchParams.get("modality"); // "ct_radiology" | "ultrasound"
  const status = searchParams.get("status"); // pending | completed | all

  if (!hospitalCode) {
    return Response.json({ error: "hospitalCode required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const records = await db.patientRecord.findMany({
    where: { hospitalId: hospital.id },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  type ImagingOrder = {
    id: string;
    modality: string;
    examType: string;
    bodyPart: string;
    clinicalIndication: string;
    status: string;
    orderedBy: string;
    orderedAt: string;
    reportedBy?: string;
    reportedAt?: string;
    findings?: string;
    impression?: string;
    imageData?: string; // base64
    urgency: string;
  };

  const orders = records.flatMap((r) => {
    const treatment = r.treatment as { imagingOrders?: ImagingOrder[] };
    const patient = r.patient as { fullName: string };
    const visit = r.visit as { queueToken: string; department: string };
    if (!treatment.imagingOrders || treatment.imagingOrders.length === 0) return [];
    return treatment.imagingOrders
      .filter((img) => !modality || img.modality === modality)
      .map((img) => ({
        ...img,
        recordId: r.id,
        patientName: patient.fullName,
        queueToken: visit.queueToken,
        department: visit.department,
      }));
  });

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

// POST: Create or update imaging orders
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { hospitalCode, action } = body;

  if (!hospitalCode || !action) {
    return Response.json({ error: "hospitalCode and action required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // Doctor orders imaging
  if (action === "order") {
    const { recordId } = body;
    if (!recordId) {
      return Response.json({ error: "recordId required" }, { status: 400 });
    }

    const parsed = ImagingOrderInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid imaging order", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
        { status: 400 },
      );
    }
    const { modality, examType, bodyPart, clinicalIndication, urgency, orderedBy } = parsed.data;

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const treatment = record.treatment as { imagingOrders?: unknown[]; [key: string]: unknown };
    const orders = treatment.imagingOrders || [];
    const newOrder = {
      id: `IMG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      modality,
      examType,
      bodyPart,
      clinicalIndication: clinicalIndication || "",
      status: "pending",
      urgency: urgency || "routine",
      orderedBy: orderedBy || "doctor",
      orderedAt: new Date().toISOString(),
    };

    orders.push(newOrder);

    await db.patientRecord.update({
      where: { id: recordId },
      data: { treatment: JSON.parse(JSON.stringify({ ...treatment, imagingOrders: orders })) },
    });

    // Emit IMAGING billable item
    const now = new Date();
    const book = await db.monthlyBook.findFirst({
      where: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" },
    });
    if (book) {
      await createBillableItem({
        hospitalId: hospital.id,
        patientId: recordId,
        bookId: book.id,
        serviceType: "IMAGING",
        description: examType,
        unitCost: modality === "ultrasound" ? 80 : 200,
        renderedBy: orderedBy || "doctor",
        departmentId: modality === "ultrasound" ? "ultrasound" : "imaging",
      });
    }

    await logAudit({
      actorType: "device_operator",
      actorId: orderedBy || "doctor",
      hospitalId: hospital.id,
      action: "imaging.ordered",
      metadata: { recordId, modality, examType, bodyPart, orderId: newOrder.id },
      ipAddress: getClientIP(request),
    });

    return Response.json(newOrder, { status: 201 });
  }

  // Radiologist/Sonographer reports findings
  if (action === "report") {
    const { recordId, imagingId } = body;
    if (!recordId || !imagingId) {
      return Response.json({ error: "recordId and imagingId required" }, { status: 400 });
    }

    const parsed = ImagingReportInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid imaging report", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
        { status: 400 },
      );
    }
    const { findings, impression, imageData, reportedBy } = parsed.data;

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const treatment = record.treatment as { imagingOrders?: Array<{ id: string; status: string; findings?: string; impression?: string; imageData?: string; reportedBy?: string; reportedAt?: string }>; [key: string]: unknown };
    const orders = treatment.imagingOrders || [];
    const idx = orders.findIndex((o) => o.id === imagingId);
    if (idx === -1) return Response.json({ error: "Imaging order not found" }, { status: 404 });

    orders[idx].status = "completed";
    orders[idx].findings = findings || "";
    orders[idx].impression = impression || "";
    orders[idx].imageData = imageData || undefined; // base64 image
    orders[idx].reportedBy = reportedBy || "radiologist";
    orders[idx].reportedAt = new Date().toISOString();

    await db.patientRecord.update({
      where: { id: recordId },
      data: { treatment: JSON.parse(JSON.stringify({ ...treatment, imagingOrders: orders })) },
    });

    await logAudit({
      actorType: "device_operator",
      actorId: reportedBy || "radiologist",
      hospitalId: hospital.id,
      action: "imaging.reported",
      metadata: { recordId, imagingId, hasImage: !!imageData },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true, order: orders[idx] });
  }

  // Start scan (mark in-progress)
  if (action === "start") {
    const { recordId, imagingId } = body;
    if (!recordId || !imagingId) {
      return Response.json({ error: "recordId and imagingId required" }, { status: 400 });
    }

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const treatment = record.treatment as { imagingOrders?: Array<{ id: string; status: string }>; [key: string]: unknown };
    const orders = treatment.imagingOrders || [];
    const idx = orders.findIndex((o) => o.id === imagingId);
    if (idx === -1) return Response.json({ error: "Imaging order not found" }, { status: 404 });

    orders[idx].status = "in_progress";

    await db.patientRecord.update({
      where: { id: recordId },
      data: { treatment: JSON.parse(JSON.stringify({ ...treatment, imagingOrders: orders })) },
    });

    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
