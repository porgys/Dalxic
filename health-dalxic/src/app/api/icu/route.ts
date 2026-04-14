import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { createBillableItem } from "@/lib/billing";
import { rateLimit } from "@/lib/rate-limit";
// GET: Get ICU patients
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const records = await db.patientRecord.findMany({
    where: { hospitalId: hospital.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  type ICUData = {
    admitted: boolean;
    admittedAt?: string;
    admittedBy?: string;
    bedLabel?: string;
    diagnosis?: string;
    ventilator?: boolean;
    ventilatorMode?: string;
    discharged?: boolean;
    dischargedAt?: string;
    hourlyObs?: Array<{ id: string; timestamp: string; hr?: number; bp?: string; spo2?: number; temp?: number; rr?: number; fio2?: number; gcs?: number; urine?: number; notes?: string; recordedBy: string }>;
  };

  const icuPatients = records
    .filter((r) => {
      const visit = r.visit as { icuAdmission?: ICUData };
      return visit.icuAdmission?.admitted && !visit.icuAdmission?.discharged;
    })
    .map((r) => {
      const patient = r.patient as { fullName: string; age?: number; gender?: string };
      const visit = r.visit as { queueToken: string; department: string; icuAdmission: ICUData };
      const icu = visit.icuAdmission;
      const dayCount = icu.admittedAt ? Math.ceil((Date.now() - new Date(icu.admittedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const obs = icu.hourlyObs || [];
      return {
        recordId: r.id,
        patientName: patient.fullName,
        age: patient.age,
        gender: patient.gender,
        queueToken: visit.queueToken,
        bedLabel: icu.bedLabel || "—",
        diagnosis: icu.diagnosis || "",
        ventilator: icu.ventilator || false,
        ventilatorMode: icu.ventilatorMode || "",
        admittedAt: icu.admittedAt,
        dayCount,
        latestObs: obs.length > 0 ? obs[obs.length - 1] : null,
        obsCount: obs.length,
      };
    });

  return Response.json({ patients: icuPatients, count: icuPatients.length });
}

// POST: ICU admit, hourly obs, discharge
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { hospitalCode, action } = body;

  if (!hospitalCode || !action) return Response.json({ error: "hospitalCode and action required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  if (action === "admit") {
    const { recordId, bedLabel, diagnosis, ventilator, ventilatorMode, admittedBy } = body;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as Record<string, unknown>;
    visit.icuAdmission = {
      admitted: true,
      admittedAt: new Date().toISOString(),
      admittedBy: admittedBy || "icu_nurse",
      bedLabel: bedLabel || "",
      diagnosis: diagnosis || "",
      ventilator: ventilator || false,
      ventilatorMode: ventilatorMode || "",
      discharged: false,
      hourlyObs: [],
    };

    await db.patientRecord.update({ where: { id: recordId }, data: { visit: JSON.parse(JSON.stringify(visit)) } });

    await logAudit({ actorType: "device_operator", actorId: admittedBy || "icu_nurse", hospitalId: hospital.id, action: "icu.patient_admitted", metadata: { recordId, bedLabel }, ipAddress: getClientIP(request) });

    return Response.json({ success: true }, { status: 201 });
  }

  if (action === "hourly_obs") {
    const { recordId, hr, bp, spo2, temp, rr, fio2, gcs, urine, notes, recordedBy } = body;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as { icuAdmission?: { hourlyObs?: unknown[]; [key: string]: unknown }; [key: string]: unknown };
    if (!visit.icuAdmission) return Response.json({ error: "Not an ICU patient" }, { status: 400 });

    const obs = visit.icuAdmission.hourlyObs || [];
    obs.push({
      id: `OBS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      hr, bp, spo2, temp, rr, fio2, gcs, urine, notes,
      recordedBy: recordedBy || "icu_nurse",
    });
    visit.icuAdmission.hourlyObs = obs;

    await db.patientRecord.update({ where: { id: recordId }, data: { visit: JSON.parse(JSON.stringify(visit)) } });

    // Emit ICU_DAY billable item (once per 24h worth of observations)
    if (obs.length % 24 === 0 || obs.length === 1) {
      const now = new Date();
      const book = await db.monthlyBook.findFirst({ where: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" } });
      if (book) {
        await createBillableItem({ hospitalId: hospital.id, patientId: recordId, bookId: book.id, serviceType: "ICU_DAY", description: `ICU Day — Bed ${visit.icuAdmission.bedLabel || "ICU"}`, unitCost: 500, renderedBy: recordedBy || "icu_nurse", departmentId: "icu" });
      }
    }

    return Response.json({ success: true, obsCount: obs.length });
  }

  if (action === "discharge") {
    const { recordId, dischargedBy } = body;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as { icuAdmission?: { [key: string]: unknown }; [key: string]: unknown };
    if (!visit.icuAdmission) return Response.json({ error: "Not an ICU patient" }, { status: 400 });

    visit.icuAdmission.discharged = true;
    visit.icuAdmission.dischargedAt = new Date().toISOString();
    visit.icuAdmission.dischargedBy = dischargedBy || "icu_nurse";

    await db.patientRecord.update({ where: { id: recordId }, data: { visit: JSON.parse(JSON.stringify(visit)) } });

    await logAudit({ actorType: "device_operator", actorId: dischargedBy || "icu_nurse", hospitalId: hospital.id, action: "icu.patient_discharged", metadata: { recordId }, ipAddress: getClientIP(request) });

    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
