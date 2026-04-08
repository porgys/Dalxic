import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { createBillableItem } from "@/lib/billing";

// GET: Get inpatients for a hospital
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const status = searchParams.get("status"); // admitted | discharged | all

  if (!hospitalCode) {
    return Response.json({ error: "hospitalCode required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // Query all records that have admission data in their visit JSON
  const records = await db.patientRecord.findMany({
    where: { hospitalId: hospital.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  type AdmissionData = {
    admitted: boolean;
    admittedAt?: string;
    admittedBy?: string;
    wardName?: string;
    bedLabel?: string;
    admissionReason?: string;
    discharged?: boolean;
    dischargedAt?: string;
    dischargedBy?: string;
    dischargeSummary?: string;
    dailyRounds?: Array<{ id: string; date: string; notes: string; recordedBy: string; vitals?: string }>;
  };

  const inpatients = records
    .filter((r) => {
      const visit = r.visit as { admission?: AdmissionData };
      return visit.admission?.admitted;
    })
    .map((r) => {
      const patient = r.patient as { fullName: string; age?: number; gender?: string };
      const visit = r.visit as { queueToken: string; department: string; chiefComplaint?: string; admission: AdmissionData };
      const admission = visit.admission;
      const dayCount = admission.admittedAt
        ? Math.ceil((Date.now() - new Date(admission.admittedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        recordId: r.id,
        patientName: patient.fullName,
        age: patient.age,
        gender: patient.gender,
        queueToken: visit.queueToken,
        department: visit.department,
        chiefComplaint: visit.chiefComplaint,
        wardName: admission.wardName || "Unassigned",
        bedLabel: admission.bedLabel || "—",
        admittedAt: admission.admittedAt,
        admittedBy: admission.admittedBy,
        admissionReason: admission.admissionReason,
        discharged: admission.discharged || false,
        dischargedAt: admission.dischargedAt,
        dayCount,
        roundsCount: (admission.dailyRounds || []).length,
        lastRound: admission.dailyRounds?.length ? admission.dailyRounds[admission.dailyRounds.length - 1] : null,
      };
    });

  const filtered = status === "discharged"
    ? inpatients.filter((p) => p.discharged)
    : status === "admitted"
    ? inpatients.filter((p) => !p.discharged)
    : inpatients;

  const counts = {
    admitted: inpatients.filter((p) => !p.discharged).length,
    discharged: inpatients.filter((p) => p.discharged).length,
    total: inpatients.length,
  };

  return Response.json({ inpatients: filtered, counts });
}

// POST: Admit, discharge, or record daily rounds
export async function POST(request: Request) {
  const body = await request.json();
  const { hospitalCode, action } = body;

  if (!hospitalCode || !action) {
    return Response.json({ error: "hospitalCode and action required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // Admit patient
  if (action === "admit") {
    const { recordId, wardName, bedLabel, admissionReason, admittedBy } = body;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as Record<string, unknown>;
    const updatedVisit = {
      ...visit,
      admission: {
        admitted: true,
        admittedAt: new Date().toISOString(),
        admittedBy: admittedBy || "ward_nurse",
        wardName: wardName || "General Ward",
        bedLabel: bedLabel || "",
        admissionReason: admissionReason || "",
        discharged: false,
        dailyRounds: [],
      },
    };

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(updatedVisit)) },
    });

    await logAudit({
      actorType: "device_operator",
      actorId: admittedBy || "ward_nurse",
      hospitalId: hospital.id,
      action: "ward.patient_admitted",
      metadata: { recordId, wardName, bedLabel },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true }, { status: 201 });
  }

  // Record daily round
  if (action === "daily_round") {
    const { recordId, notes, recordedBy, vitals } = body;
    if (!recordId || !notes) return Response.json({ error: "recordId and notes required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as { admission?: { dailyRounds?: unknown[]; [key: string]: unknown }; [key: string]: unknown };
    if (!visit.admission) return Response.json({ error: "Patient not admitted" }, { status: 400 });

    const rounds = visit.admission.dailyRounds || [];
    rounds.push({
      id: `RND-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: new Date().toISOString(),
      notes,
      recordedBy: recordedBy || "ward_nurse",
      vitals: vitals || null,
    });

    visit.admission.dailyRounds = rounds;

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(visit)) },
    });

    // Emit WARD_DAY billable item
    const now = new Date();
    const book = await db.monthlyBook.findFirst({
      where: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" },
    });
    if (book) {
      await createBillableItem({
        hospitalId: hospital.id,
        patientId: recordId,
        bookId: book.id,
        serviceType: "WARD_DAY",
        description: `Ward Day — ${visit.admission.wardName || "General"}`,
        unitCost: 100,
        renderedBy: recordedBy || "ward_nurse",
      });
    }

    return Response.json({ success: true, roundsCount: rounds.length });
  }

  // Discharge patient
  if (action === "discharge") {
    const { recordId, dischargeSummary, dischargedBy } = body;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as { admission?: { [key: string]: unknown }; [key: string]: unknown };
    if (!visit.admission) return Response.json({ error: "Patient not admitted" }, { status: 400 });

    visit.admission.discharged = true;
    visit.admission.dischargedAt = new Date().toISOString();
    visit.admission.dischargedBy = dischargedBy || "ward_nurse";
    visit.admission.dischargeSummary = dischargeSummary || "";

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(visit)) },
    });

    await logAudit({
      actorType: "device_operator",
      actorId: dischargedBy || "ward_nurse",
      hospitalId: hospital.id,
      action: "ward.patient_discharged",
      metadata: { recordId },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
