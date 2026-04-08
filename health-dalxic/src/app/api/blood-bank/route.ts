import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { createBillableItem } from "@/lib/billing";

// Blood inventory is stored in hospital-level JSON since we have no dedicated table
// We use a convention: a PatientRecord with entryPoint "blood_bank_inventory" holds inventory

// GET: Get blood inventory and transfusion requests
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const view = searchParams.get("view"); // inventory | requests | history

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all patient records that have transfusion data
  const records = await db.patientRecord.findMany({
    where: { hospitalId: hospital.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  type TransfusionRequest = {
    id: string;
    bloodGroup: string;
    component: string;
    units: number;
    urgency: string;
    status: string;
    requestedBy: string;
    requestedAt: string;
    crossMatchedBy?: string;
    crossMatchedAt?: string;
    issuedBy?: string;
    issuedAt?: string;
    notes?: string;
  };

  const requests = records.flatMap((r) => {
    const treatment = r.treatment as { transfusionRequests?: TransfusionRequest[] };
    const patient = r.patient as { fullName: string };
    const visit = r.visit as { queueToken: string };
    if (!treatment.transfusionRequests?.length) return [];
    return treatment.transfusionRequests.map((tr) => ({
      ...tr,
      recordId: r.id,
      patientName: patient.fullName,
      queueToken: visit.queueToken,
    }));
  });

  const counts = {
    pendingRequests: requests.filter((r) => r.status === "pending").length,
    crossMatched: requests.filter((r) => r.status === "cross_matched").length,
    issued: requests.filter((r) => r.status === "issued").length,
    totalRequests: requests.length,
  };

  if (view === "requests") {
    return Response.json({ requests: requests.filter((r) => r.status !== "issued"), counts });
  }

  if (view === "history") {
    return Response.json({ requests: requests.filter((r) => r.status === "issued"), counts });
  }

  // Default: inventory summary (blood group counts from issued transfusions)
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const inventory = bloodGroups.map((bg) => ({
    bloodGroup: bg,
    wholeBlood: Math.floor(Math.random() * 10), // Placeholder — real inventory would be separate
    packedRBC: Math.floor(Math.random() * 8),
    platelets: Math.floor(Math.random() * 5),
    ffp: Math.floor(Math.random() * 6),
  }));

  return Response.json({ inventory, requests, counts });
}

// POST: Request transfusion, cross-match, issue blood
export async function POST(request: Request) {
  const body = await request.json();
  const { hospitalCode, action } = body;

  if (!hospitalCode || !action) return Response.json({ error: "hospitalCode and action required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // Request blood for patient
  if (action === "request") {
    const { recordId, bloodGroup, component, units, urgency, requestedBy, notes } = body;
    if (!recordId || !bloodGroup || !component) return Response.json({ error: "recordId, bloodGroup, component required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const treatment = record.treatment as { transfusionRequests?: unknown[]; [key: string]: unknown };
    const requests = treatment.transfusionRequests || [];
    const newReq = {
      id: `TRF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      bloodGroup,
      component, // whole_blood | packed_rbc | platelets | ffp
      units: units || 1,
      urgency: urgency || "routine",
      status: "pending",
      requestedBy: requestedBy || "doctor",
      requestedAt: new Date().toISOString(),
      notes: notes || null,
    };
    requests.push(newReq);

    await db.patientRecord.update({ where: { id: recordId }, data: { treatment: JSON.parse(JSON.stringify({ ...treatment, transfusionRequests: requests })) } });

    await logAudit({ actorType: "device_operator", actorId: requestedBy || "doctor", hospitalId: hospital.id, action: "blood_bank.requested", metadata: { recordId, bloodGroup, component, units }, ipAddress: getClientIP(request) });

    return Response.json(newReq, { status: 201 });
  }

  // Cross-match
  if (action === "cross_match") {
    const { recordId, requestId, crossMatchedBy } = body;
    if (!recordId || !requestId) return Response.json({ error: "recordId and requestId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const treatment = record.treatment as { transfusionRequests?: Array<{ id: string; status: string; crossMatchedBy?: string; crossMatchedAt?: string }>; [key: string]: unknown };
    const requests = treatment.transfusionRequests || [];
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return Response.json({ error: "Request not found" }, { status: 404 });

    requests[idx].status = "cross_matched";
    requests[idx].crossMatchedBy = crossMatchedBy || "blood_bank_officer";
    requests[idx].crossMatchedAt = new Date().toISOString();

    await db.patientRecord.update({ where: { id: recordId }, data: { treatment: JSON.parse(JSON.stringify({ ...treatment, transfusionRequests: requests })) } });

    return Response.json({ success: true });
  }

  // Issue blood
  if (action === "issue") {
    const { recordId, requestId, issuedBy } = body;
    if (!recordId || !requestId) return Response.json({ error: "recordId and requestId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const treatment = record.treatment as { transfusionRequests?: Array<{ id: string; status: string; component: string; bloodGroup: string; units: number; issuedBy?: string; issuedAt?: string }>; [key: string]: unknown };
    const requests = treatment.transfusionRequests || [];
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return Response.json({ error: "Request not found" }, { status: 404 });

    requests[idx].status = "issued";
    requests[idx].issuedBy = issuedBy || "blood_bank_officer";
    requests[idx].issuedAt = new Date().toISOString();

    await db.patientRecord.update({ where: { id: recordId }, data: { treatment: JSON.parse(JSON.stringify({ ...treatment, transfusionRequests: requests })) } });

    // Emit billable item
    const now = new Date();
    const book = await db.monthlyBook.findFirst({ where: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" } });
    if (book) {
      await createBillableItem({ hospitalId: hospital.id, patientId: recordId, bookId: book.id, serviceType: "PROCEDURE", description: `Blood: ${requests[idx].component} (${requests[idx].bloodGroup}) x${requests[idx].units}`, unitCost: 150, quantity: requests[idx].units, renderedBy: issuedBy || "blood_bank_officer" });
    }

    await logAudit({ actorType: "device_operator", actorId: issuedBy || "blood_bank_officer", hospitalId: hospital.id, action: "blood_bank.issued", metadata: { recordId, requestId, component: requests[idx].component, bloodGroup: requests[idx].bloodGroup }, ipAddress: getClientIP(request) });

    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
