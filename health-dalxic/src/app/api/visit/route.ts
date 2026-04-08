import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { getPusher, hospitalChannel } from "@/lib/pusher-server";
import { notifyPatient } from "@/lib/whatsapp";

/**
 * Visit lifecycle management.
 *
 * States:
 *   active              — patient is being seen (default on registration)
 *   paused_for_lab      — doctor sent patient to lab, awaiting results
 *   lab_results_ready   — lab done, patient auto-re-queued to same doctor with priority
 *   paused_for_pharmacy — consultation complete, sent to pharmacy for dispensing
 *   awaiting_close      — all services done, needs front desk PIN checkout
 *   closed              — front desk confirmed close
 *   lwbs                — left without being seen
 *   deceased            — doctor recorded death
 */

// GET: Get patients by visit status (for front desk close queue, etc.)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const status = searchParams.get("status"); // awaiting_close | active | paused_for_lab | lwbs | all
  const view = searchParams.get("view"); // close_queue (front desk closing view)

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const records = await db.patientRecord.findMany({
    where: { hospitalId: hospital.id, createdAt: { gte: today } },
    orderBy: { createdAt: "desc" },
  });

  type VisitData = {
    queueToken?: string; department?: string; chiefComplaint?: string;
    visitStatus?: string; emergencyFlag?: boolean;
    pausedForLabAt?: string; pausedByDoctor?: string;
    labResultsReadyAt?: string; closedAt?: string; closedBy?: string;
    closePin?: string; visitOutcome?: string;
    services?: string[]; visitSummary?: Record<string, unknown>;
  };

  const patients = records.map((r) => {
    const visit = r.visit as VisitData;
    const patient = r.patient as { fullName: string; phone?: string };
    const treatment = r.treatment as { prescriptions?: unknown[] };
    return {
      recordId: r.id,
      patientName: patient.fullName,
      queueToken: visit.queueToken ?? "—",
      department: visit.department ?? "",
      chiefComplaint: visit.chiefComplaint ?? "",
      visitStatus: visit.visitStatus ?? "active",
      emergencyFlag: visit.emergencyFlag ?? false,
      hasPrescriptions: (treatment.prescriptions?.length ?? 0) > 0,
      services: visit.services ?? [],
      closedAt: visit.closedAt ?? null,
      closedBy: visit.closedBy ?? null,
      visitOutcome: visit.visitOutcome ?? null,
      createdAt: r.createdAt,
    };
  });

  let filtered = patients;
  if (status && status !== "all") {
    filtered = patients.filter((p) => p.visitStatus === status);
  }
  if (view === "close_queue") {
    filtered = patients.filter((p) => p.visitStatus === "awaiting_close");
  }

  const counts = {
    active: patients.filter((p) => p.visitStatus === "active").length,
    pausedForLab: patients.filter((p) => p.visitStatus === "paused_for_lab").length,
    labResultsReady: patients.filter((p) => p.visitStatus === "lab_results_ready").length,
    awaitingClose: patients.filter((p) => p.visitStatus === "awaiting_close").length,
    closed: patients.filter((p) => p.visitStatus === "closed").length,
    lwbs: patients.filter((p) => p.visitStatus === "lwbs").length,
    total: patients.length,
  };

  return Response.json({ patients: filtered, counts });
}

// POST: Visit lifecycle transitions
export async function POST(request: Request) {
  const body = await request.json();
  const { hospitalCode, action } = body;

  if (!hospitalCode || !action) return Response.json({ error: "hospitalCode and action required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // ─── PAUSE FOR LAB: Doctor sends patient to lab ───
  if (action === "pause_for_lab") {
    const { recordId, doctorId, labTests, clinicalNotes } = body;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as Record<string, unknown>;
    visit.visitStatus = "paused_for_lab";
    visit.pausedForLabAt = new Date().toISOString();
    visit.pausedByDoctor = doctorId || "doctor";
    visit.returnToDoctorId = doctorId || null; // Track which doctor to re-queue to

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(visit)) },
    });

    // Create lab order if tests provided
    if (labTests?.length) {
      await fetch(new URL("/api/lab-orders", request.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: recordId, hospitalCode,
          tests: labTests.map((t: string) => ({ testName: t, category: "other" })),
          clinicalNotes: clinicalNotes || null,
        }),
      });
    }

    await logAudit({
      actorType: "doctor", actorId: doctorId || "doctor", hospitalId: hospital.id,
      action: "visit.paused_for_lab", metadata: { recordId, labTests },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true, visitStatus: "paused_for_lab" });
  }

  // ─── LAB RESULTS READY: Auto-re-queue patient to same doctor with priority ───
  if (action === "lab_results_ready") {
    const { recordId } = body;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as Record<string, unknown>;
    if (visit.visitStatus !== "paused_for_lab") {
      return Response.json({ error: "Patient is not paused for lab" }, { status: 400 });
    }

    visit.visitStatus = "lab_results_ready";
    visit.labResultsReadyAt = new Date().toISOString();
    visit.priorityReturn = true; // Flag for priority queue placement

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(visit)) },
    });

    // Broadcast re-queue event so doctor sees "Returning — Lab Results Ready"
    try {
      const pusher = getPusher();
      const patient = record.patient as { fullName?: string };
      await pusher.trigger(hospitalChannel(hospitalCode, "queue"), "patient-requeued", {
        queueToken: visit.queueToken as string,
        patientName: patient.fullName ?? "Unknown",
        recordId,
        reason: "lab_results_ready",
        returnToDoctorId: visit.returnToDoctorId ?? null,
        priority: true,
        timestamp: new Date().toISOString(),
      });
    } catch { /* Pusher not configured */ }

    // WhatsApp: tell patient to return to doctor
    notifyPatient(recordId, "lab_results_ready", { tests: "your requested tests" }).catch(() => {});

    await logAudit({
      actorType: "device_operator", actorId: "lab", hospitalId: hospital.id,
      action: "visit.lab_results_ready_requeued", metadata: { recordId },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true, visitStatus: "lab_results_ready" });
  }

  // ─── COMPLETE CONSULTATION: Doctor done, advance to pharmacy or awaiting_close ───
  if (action === "complete_consultation") {
    const { recordId, doctorId: docId, hasPrescriptions } = body;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as Record<string, unknown>;
    const nextStatus = hasPrescriptions ? "paused_for_pharmacy" : "awaiting_close";
    visit.visitStatus = nextStatus;
    visit.consultationCompletedAt = new Date().toISOString();
    visit.consultationCompletedBy = docId || "doctor";

    // Track services rendered
    const services = (visit.services as string[]) || [];
    if (!services.includes("consultation")) services.push("consultation");
    visit.services = services;

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(visit)) },
    });

    await logAudit({
      actorType: "doctor", actorId: docId || "doctor", hospitalId: hospital.id,
      action: "visit.consultation_completed", metadata: { recordId, nextStatus },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true, visitStatus: nextStatus });
  }

  // ─── PHARMACY COMPLETE: Meds dispensed, advance to awaiting_close ───
  if (action === "pharmacy_complete") {
    const { recordId } = body;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as Record<string, unknown>;
    visit.visitStatus = "awaiting_close";
    visit.pharmacyCompletedAt = new Date().toISOString();

    const services = (visit.services as string[]) || [];
    if (!services.includes("pharmacy")) services.push("pharmacy");
    visit.services = services;

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(visit)) },
    });

    return Response.json({ success: true, visitStatus: "awaiting_close" });
  }

  // ─── CLOSE VISIT: Front desk PIN checkout ───
  if (action === "close") {
    const { recordId, pin, closedBy, outcome } = body;
    if (!recordId || !pin) return Response.json({ error: "recordId and pin required" }, { status: 400 });

    // Validate PIN format: 4 digits
    if (!/^\d{4}$/.test(pin)) {
      return Response.json({ error: "PIN must be 4 digits" }, { status: 400 });
    }

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as Record<string, unknown>;

    // Validate PIN matches the one issued to this patient at registration
    if (visit.checkoutPin && visit.checkoutPin !== pin) {
      return Response.json({ error: "Incorrect checkout code. Ask the patient for the code from their ticket or WhatsApp message." }, { status: 403 });
    }

    const now = new Date();

    // Build visit summary
    const checkInTime = record.createdAt;
    const durationMs = now.getTime() - new Date(checkInTime).getTime();
    const durationMins = Math.round(durationMs / 60000);

    const diagnosis = record.diagnosis as { primary?: string; notes?: string };
    const treatment = record.treatment as { prescriptions?: unknown[] };
    const services = (visit.services as string[]) || [];

    visit.visitStatus = "closed";
    visit.closedAt = now.toISOString();
    visit.closedBy = closedBy || "front_desk";
    visit.closePin = pin; // Audit trail — who entered the PIN
    visit.visitOutcome = outcome || "complete";
    visit.visitSummary = {
      checkInTime: checkInTime.toISOString(),
      closeTime: now.toISOString(),
      durationMinutes: durationMins,
      services,
      diagnosis: diagnosis.primary || null,
      prescriptionCount: treatment.prescriptions?.length ?? 0,
      outcome: outcome || "complete",
      closedBy: closedBy || "front_desk",
      pin,
    };

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(visit)) },
    });

    // WhatsApp discharge notification
    notifyPatient(recordId, "discharge_summary", {
      followUp: (visit.followUp as string) || undefined,
    }).catch(() => {});

    await logAudit({
      actorType: "device_operator", actorId: closedBy || "front_desk", hospitalId: hospital.id,
      action: "visit.closed", metadata: { recordId, pin, outcome: outcome || "complete", durationMinutes: durationMins },
      ipAddress: getClientIP(request),
    });

    return Response.json({
      success: true,
      visitStatus: "closed",
      summary: visit.visitSummary,
    });
  }

  // ─── LWBS: Left without being seen ───
  if (action === "mark_lwbs") {
    const { recordId, markedBy } = body;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as Record<string, unknown>;
    visit.visitStatus = "lwbs";
    visit.lwbsAt = new Date().toISOString();
    visit.lwbsBy = markedBy || "front_desk";

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(visit)) },
    });

    await logAudit({
      actorType: "device_operator", actorId: markedBy || "front_desk", hospitalId: hospital.id,
      action: "visit.lwbs", metadata: { recordId },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true, visitStatus: "lwbs" });
  }

  // ─── DECEASED: Doctor records death ───
  if (action === "record_death") {
    const { recordId, timeOfDeath, causeOfDeath, recordedBy, confirmation } = body;
    if (!recordId || !causeOfDeath || !recordedBy) {
      return Response.json({ error: "recordId, causeOfDeath, and recordedBy required" }, { status: 400 });
    }
    // Require typed CONFIRM
    if (confirmation !== "CONFIRM") {
      return Response.json({ error: "You must type CONFIRM to record a death" }, { status: 400 });
    }

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as Record<string, unknown>;
    visit.visitStatus = "deceased";
    visit.timeOfDeath = timeOfDeath || new Date().toISOString();
    visit.causeOfDeath = causeOfDeath;
    visit.deathRecordedBy = recordedBy;
    visit.deathRecordedAt = new Date().toISOString();
    visit.visitOutcome = "deceased";

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(visit)) },
    });

    await logAudit({
      actorType: "doctor", actorId: recordedBy, hospitalId: hospital.id,
      action: "visit.death_recorded",
      metadata: { recordId, causeOfDeath, timeOfDeath: timeOfDeath || new Date().toISOString() },
      ipAddress: getClientIP(request),
    });

    // No WhatsApp for deceased — handled by bereavement process

    return Response.json({ success: true, visitStatus: "deceased" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
