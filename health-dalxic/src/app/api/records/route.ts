import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";

// GET: Fetch a single patient record by ID
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get("recordId");

  if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

  const record = await db.patientRecord.findUnique({ where: { id: recordId } });
  if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

  return Response.json({
    id: record.id,
    patient: record.patient,
    visit: record.visit,
    diagnosis: record.diagnosis,
    treatment: record.treatment,
    createdAt: record.createdAt,
    updatedAt: record.createdAt,
  });
}

// PATCH: Update patient record — diagnosis, treatment, referrals, notes
export async function PATCH(request: Request) {
  const body = await request.json();
  const { recordId, hospitalCode, diagnosis, treatment, referral, addReferral } = body as {
    recordId: string;
    hospitalCode: string;
    diagnosis?: { primary: string | null; secondary: string[]; icdCodes: string[]; notes: string | null };
    treatment?: { prescriptions: unknown[]; procedures: unknown[]; followUp: string | null; nextAppointment: string | null };
    referral?: unknown;
    addReferral?: { targetStation: string; reason: string; urgency: string; referredBy: string; notes?: string };
  };

  if (!recordId || !hospitalCode) {
    return Response.json({ error: "recordId and hospitalCode required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const record = await db.patientRecord.findUnique({ where: { id: recordId } });
  if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};

  // Update diagnosis
  if (diagnosis) {
    updates.diagnosis = JSON.parse(JSON.stringify(diagnosis));
  }

  // Update treatment
  if (treatment) {
    // Merge with existing treatment to preserve injection orders, transfusion requests, etc.
    const existing = record.treatment as Record<string, unknown>;
    updates.treatment = JSON.parse(JSON.stringify({ ...existing, ...treatment }));
  }

  // Add a referral to the visit JSON
  if (addReferral) {
    const visit = record.visit as Record<string, unknown>;
    const referrals = (visit.referrals as unknown[]) || [];
    referrals.push({
      id: `REF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      targetStation: addReferral.targetStation,
      reason: addReferral.reason,
      urgency: addReferral.urgency || "routine",
      referredBy: addReferral.referredBy || "doctor",
      referredAt: new Date().toISOString(),
      notes: addReferral.notes || null,
      status: "pending", // pending | accepted | completed
    });
    updates.visit = JSON.parse(JSON.stringify({ ...visit, referrals }));
  }

  // Direct referral field override
  if (referral && !addReferral) {
    const visit = record.visit as Record<string, unknown>;
    updates.visit = JSON.parse(JSON.stringify({ ...visit, referral }));
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No update fields provided" }, { status: 400 });
  }

  await db.patientRecord.update({ where: { id: recordId }, data: updates });

  await logAudit({
    actorType: "doctor",
    actorId: "doctor",
    hospitalId: hospital.id,
    action: "record.updated",
    metadata: { recordId, fields: Object.keys(updates) },
    ipAddress: getClientIP(request),
  });

  return Response.json({ success: true, updatedFields: Object.keys(updates) });
}
