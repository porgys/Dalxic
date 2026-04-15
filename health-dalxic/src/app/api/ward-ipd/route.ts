import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { createBillableItem, resolveWardNightly } from "@/lib/billing";
import { rateLimit } from "@/lib/rate-limit";
import { isValidVisitState, isValidTransition, type VisitState } from "@/lib/visit-state";
// GET: Get inpatients for a hospital
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const { searchParams } = new URL(request.url);
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
    bedId?: string;
    admissionReason?: string;
    assignedDoctor?: string;
    assignedDoctorName?: string;
    visitingHours?: string;
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
      const patient = r.patient as { fullName: string; age?: number; gender?: string; phone?: string };
      const visit = r.visit as { queueToken: string; department: string; chiefComplaint?: string; admission: AdmissionData };
      const treatment = r.treatment as { prescriptions?: Array<{ medication: string; dosage: string; frequency: string; duration: string }> } | null;
      const diagnosis = r.diagnosis as { primary?: string; notes?: string } | null;
      const admission = visit.admission;
      const dayCount = admission.admittedAt
        ? Math.ceil((Date.now() - new Date(admission.admittedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        recordId: r.id,
        patientName: patient.fullName,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        queueToken: visit.queueToken,
        department: visit.department,
        chiefComplaint: visit.chiefComplaint,
        wardName: admission.wardName || "Unassigned",
        bedLabel: admission.bedLabel || "—",
        bedId: admission.bedId || null,
        admittedAt: admission.admittedAt,
        admittedBy: admission.admittedBy,
        admissionReason: admission.admissionReason,
        assignedDoctor: admission.assignedDoctor || null,
        assignedDoctorName: admission.assignedDoctorName || null,
        visitingHours: admission.visitingHours || null,
        discharged: admission.discharged || false,
        dischargedAt: admission.dischargedAt,
        dayCount,
        roundsCount: (admission.dailyRounds || []).length,
        lastRound: admission.dailyRounds?.length ? admission.dailyRounds[admission.dailyRounds.length - 1] : null,
        prescriptions: treatment?.prescriptions || [],
        diagnosis: diagnosis?.primary || null,
        diagnosisNotes: diagnosis?.notes || null,
      };
    });

  // Pending admission orders — doctors ordered admission but nurse hasn't executed yet
  if (status === "pending_orders") {
    const pendingOrders = records
      .filter((r) => {
        const visit = r.visit as { admissionOrdered?: boolean; admission?: { admitted?: boolean } };
        return visit.admissionOrdered && !visit.admission?.admitted;
      })
      .map((r) => {
        const patient = r.patient as { fullName: string; age?: number; gender?: string; phone?: string };
        const visit = r.visit as { queueToken: string; department: string; chiefComplaint?: string; admissionReason?: string; admissionOrderedBy?: string; admissionOrderedByName?: string; admissionOrderedAt?: string };
        const diagnosis = r.diagnosis as { primary?: string; notes?: string } | null;
        return {
          recordId: r.id,
          patientName: patient.fullName,
          age: patient.age,
          gender: patient.gender,
          queueToken: visit.queueToken,
          department: visit.department,
          chiefComplaint: visit.chiefComplaint,
          admissionReason: visit.admissionReason || "",
          orderedByName: visit.admissionOrderedByName || "Doctor",
          orderedAt: visit.admissionOrderedAt,
          diagnosis: diagnosis?.primary || null,
        };
      });
    return Response.json({ pendingOrders, counts: { pendingOrders: pendingOrders.length } });
  }

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
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { hospitalCode, action } = body;

  if (!hospitalCode || !action) {
    return Response.json({ error: "hospitalCode and action required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // Admit patient
  if (action === "admit") {
    const { recordId, wardName, bedLabel, bedId, admissionReason, admittedBy, assignedDoctor, assignedDoctorName } = body;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    // If bedId provided, mark it as OCCUPIED in bed management
    if (bedId) {
      try {
        const bed = await db.bed.findUnique({ where: { id: bedId } });
        if (bed && ["AVAILABLE", "RESERVED"].includes(bed.status)) {
          await db.bed.update({ where: { id: bedId }, data: { status: "OCCUPIED", patientId: recordId, reservedUntil: null } });
          await db.bedTransition.create({ data: { bedId, fromStatus: bed.status, toStatus: "OCCUPIED", triggeredBy: admittedBy || "ward_nurse", patientId: recordId } });
        }
      } catch { /* bed sync non-blocking */ }
    }

    const visit = record.visit as Record<string, unknown>;

    // Advance visit lifecycle to "admitted" — but only if current state legally transitions there.
    // Legacy records without a valid visitStatus are auto-healed by setting admitted directly.
    const current = visit.visitStatus;
    let nextStatus: VisitState = "admitted";
    if (isValidVisitState(current)) {
      if (current !== "admitted" && !isValidTransition(current as VisitState, "admitted")) {
        return Response.json(
          { error: `Cannot admit from ${current}` },
          { status: 409 },
        );
      }
      nextStatus = current === "admitted" ? "admitted" : nextStatus;
    }

    const updatedVisit = {
      ...visit,
      visitStatus: nextStatus,
      admission: {
        admitted: true,
        admittedAt: new Date().toISOString(),
        admittedBy: admittedBy || "ward_nurse",
        wardName: wardName || "General Ward",
        bedLabel: bedLabel || "",
        bedId: bedId || null,
        admissionReason: admissionReason || "",
        assignedDoctor: assignedDoctor || null,
        assignedDoctorName: assignedDoctorName || null,
        discharged: false,
        dailyRounds: [],
      },
    };

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(updatedVisit)) },
    });

    // First-night WARD_DAY charge on admission. daily_round emits additional
    // WARD_DAY lines each day; without this line, same-day discharges leave no
    // bed charge at all.
    const nowAdmit = new Date();
    const admitBook = await db.monthlyBook.findFirst({
      where: { hospitalId: hospital.id, year: nowAdmit.getFullYear(), month: nowAdmit.getMonth() + 1, status: "active" },
    });
    if (admitBook) {
      const wardLabel = wardName || "General Ward";
      const nightly = await resolveWardNightly({
        hospitalId: hospital.id,
        wardName: wardLabel,
        fallback: 100,
      });
      await createBillableItem({
        hospitalId: hospital.id,
        patientId: recordId,
        bookId: admitBook.id,
        serviceType: "WARD_DAY",
        description: `Admission — ${wardLabel}`,
        unitCost: nightly,
        renderedBy: admittedBy || "ward_nurse",
        departmentId: "ward",
        overrideUnitCost: nightly,
      });
    }

    await logAudit({
      actorType: "device_operator",
      actorId: admittedBy || "ward_nurse",
      hospitalId: hospital.id,
      action: "ward.patient_admitted",
      metadata: { recordId, wardName, bedLabel, bedId, assignedDoctor },
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
        departmentId: "ward",
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

    const visit = record.visit as { admission?: { bedId?: string; [key: string]: unknown }; [key: string]: unknown };
    if (!visit.admission) return Response.json({ error: "Patient not admitted" }, { status: 400 });

    // Free the bed in bed management
    if (visit.admission.bedId) {
      try {
        const bed = await db.bed.findUnique({ where: { id: visit.admission.bedId as string } });
        if (bed && bed.status === "OCCUPIED") {
          await db.bed.update({ where: { id: bed.id }, data: { status: "CLEANING", patientId: null } });
          await db.bedTransition.create({ data: { bedId: bed.id, fromStatus: "OCCUPIED", toStatus: "CLEANING", triggeredBy: dischargedBy || "ward_nurse", patientId: recordId } });
        }
      } catch { /* bed sync non-blocking */ }
    }

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

  // Assign doctor to ward patient
  if (action === "assign_doctor") {
    const { recordId, assignedDoctor, assignedDoctorName, assignedBy } = body;
    if (!recordId || !assignedDoctorName) return Response.json({ error: "recordId and assignedDoctorName required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as { admission?: { [key: string]: unknown }; [key: string]: unknown };
    if (!visit.admission) return Response.json({ error: "Patient not admitted" }, { status: 400 });

    visit.admission.assignedDoctor = assignedDoctor || null;
    visit.admission.assignedDoctorName = assignedDoctorName;

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(visit)) },
    });

    await logAudit({
      actorType: "doctor",
      actorId: assignedBy || assignedDoctor || "doctor",
      hospitalId: hospital.id,
      action: "ward.doctor_assigned",
      metadata: { recordId, assignedDoctorName },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true });
  }

  // Set visiting hours for a patient
  if (action === "set_visiting_hours") {
    const { recordId, visitingHours } = body;
    if (!recordId || !visitingHours) return Response.json({ error: "recordId and visitingHours required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as { admission?: { [key: string]: unknown }; [key: string]: unknown };
    if (!visit.admission) return Response.json({ error: "Patient not admitted" }, { status: 400 });

    visit.admission.visitingHours = visitingHours;

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(visit)) },
    });

    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
