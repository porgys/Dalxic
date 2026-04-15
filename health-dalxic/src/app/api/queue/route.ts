import { db } from "@/lib/db";
import { generateQueueToken, generateERToken } from "@/lib/tokens";
import { logAudit, getClientIP } from "@/lib/audit";
import { getPusher, hospitalChannel } from "@/lib/pusher-server";
import { sendWhatsApp } from "@/lib/whatsapp";
import type { Patient } from "@/types";
import { rateLimit } from "@/lib/rate-limit";
/**
 * Tighter rate limit for patient intake — covers both kiosk self-service and
 * front-desk registration. 12 registrations/minute/IP is well above real-world
 * staff pace and blocks abusive bursts from compromised kiosk tablets.
 */
const INTAKE_RATE_LIMIT = { limit: 12, windowSeconds: 60 };

// POST: Register patient and assign queue token
export async function POST(request: Request) {
  const blocked = rateLimit(request, INTAKE_RATE_LIMIT); if (blocked) return blocked;  const body = await request.json();
  const { hospitalCode, patient, chiefComplaint, department, symptomSeverity, symptomDuration, operatorId, entryPoint: requestedEntryPoint } = body as {
    hospitalCode: string;
    patient: Patient;
    chiefComplaint: string;
    department: string;
    symptomSeverity?: number;
    symptomDuration?: string;
    operatorId?: string;
    entryPoint?: string;
  };

  if (!hospitalCode || !patient?.fullName || !chiefComplaint) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) {
    return Response.json({ error: "Hospital not found" }, { status: 404 });
  }

  // Find or create active book for current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let book = await db.monthlyBook.findUnique({
    where: { hospitalId_year_month: { hospitalId: hospital.id, year, month } },
  });

  if (!book) {
    book = await db.monthlyBook.create({
      data: { hospitalId: hospital.id, year, month, status: "active" },
    });
  }

  if (book.status === "closed") {
    return Response.json({ error: "Current month book is closed" }, { status: 409 });
  }

  // Direct Treatment: walk-in petty care (no doctor consultation) — routes straight to nurse station
  const isDirectTreatment = requestedEntryPoint === "direct_treatment" || department === "direct_treatment";

  // Auto-flag emergency for severity >= 8 — also reroutes to emergency department (overrides direct_treatment for safety)
  const severity = symptomSeverity ?? 5;
  const emergencyFlag = severity >= 8;
  const finalDepartment = emergencyFlag ? "emergency" : isDirectTreatment ? "direct_treatment" : department;
  const finalEntryPoint = emergencyFlag ? "front_desk" : isDirectTreatment ? "direct_treatment" : (requestedEntryPoint || "front_desk");
  const queueToken = emergencyFlag
    ? await generateERToken(hospitalCode)
    : await generateQueueToken(hospital.id, book.id, finalDepartment, hospitalCode);

  // Generate patient checkout PIN — 4 digits, given to patient on ticket/WhatsApp
  // Patient returns this PIN to front desk to close visit (they don't know it's for security)
  const checkoutPin = String(Math.floor(1000 + Math.random() * 9000));

  // Create patient record
  const record = await db.patientRecord.create({
    data: {
      bookId: book.id,
      hospitalId: hospital.id,
      patient: JSON.parse(JSON.stringify(patient)),
      visit: JSON.parse(JSON.stringify({
        date: now.toISOString(),
        chiefComplaint,
        department: finalDepartment,
        assignedDoctor: null,
        queueToken,
        entryPoint: finalEntryPoint,
        symptomSeverity: severity,
        symptomDuration: symptomDuration || null,
        emergencyFlag,
        emergencyReason: emergencyFlag ? "severity_auto" : null,
        checkoutPin,
        visitStatus: "queued",
      })),
      diagnosis: JSON.parse(JSON.stringify({ primary: null, secondary: [], icdCodes: [], notes: null })),
      treatment: JSON.parse(JSON.stringify({ prescriptions: [], procedures: [], followUp: null, nextAppointment: null })),
      entryPoint: finalEntryPoint === "direct_treatment" ? "direct_treatment" : "manual",
      createdBy: operatorId || "device",
    },
  });

  // Broadcast to waiting room via Pusher
  try {
    const pusher = getPusher();
    await pusher.trigger(hospitalChannel(hospitalCode, "queue"), "patient-added", {
      queueToken,
      patientName: patient.fullName,
      chiefComplaint,
      department: finalDepartment,
      recordId: record.id,
      emergencyFlag,
      symptomSeverity: severity,
      timestamp: now.toISOString(),
    });

    // Broadcast emergency alert on dedicated channel
    if (emergencyFlag) {
      await pusher.trigger(hospitalChannel(hospitalCode, "emergency"), "emergency-admission", {
        queueToken,
        patientName: patient.fullName,
        chiefComplaint,
        severity,
        recordId: record.id,
        reason: "severity_auto",
        timestamp: now.toISOString(),
      });
    }
  } catch {
    // Pusher not configured — continue without real-time
  }

  await logAudit({
    actorType: "device_operator",
    actorId: operatorId || "device",
    hospitalId: hospital.id,
    action: emergencyFlag ? "patient.emergency_registered" : "patient.registered",
    metadata: { queueToken, patientName: patient.fullName, severity, emergencyFlag },
    ipAddress: getClientIP(request),
  });

  // WhatsApp notification — non-blocking, includes checkout PIN
  if (patient.phone) {
    sendWhatsApp(patient.phone, emergencyFlag ? "emergency_alert" : "queue_registered", {
      patientName: patient.fullName,
      hospitalName: hospital.name,
      token: queueToken,
      checkoutPin,
    }).catch(() => {});
  }

  return Response.json({ queueToken, recordId: record.id, emergencyFlag, checkoutPin }, { status: 201 });
}

// GET: Get active queue for a hospital (no date filter — patients persist until discharged)
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");

  if (!hospitalCode) {
    return Response.json({ error: "hospitalCode required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) {
    return Response.json({ error: "Hospital not found" }, { status: 404 });
  }

  // Show open visits only — terminal states (closed/admitted/lwbs/deceased) are excluded.
  // 12h recency window (≈ one shift) prevents zombie records — patients stuck in
  // with_doctor / awaiting_* because staff never closed them, or leftovers from
  // load/seed runs. Any patient legitimately persisting past one shift should
  // be in `admitted` status, which is already excluded.
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const records = await db.patientRecord.findMany({
    where: {
      hospitalId: hospital.id,
      entryPoint: { not: "blood_donation" },
      createdAt: { gte: cutoff },
      AND: [
        { NOT: { visit: { path: ["visitStatus"], equals: "closed" } } },
        { NOT: { visit: { path: ["visitStatus"], equals: "admitted" } } },
        { NOT: { visit: { path: ["visitStatus"], equals: "lwbs" } } },
        { NOT: { visit: { path: ["visitStatus"], equals: "deceased" } } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  const queue = records.map((r) => {
    const visit = r.visit as {
      queueToken?: string; chiefComplaint?: string; department?: string;
      symptomSeverity?: number; emergencyFlag?: boolean; emergencyReason?: string;
      referrals?: unknown[]; visitStatus?: string; priorityReturn?: boolean;
    };
    const patient = r.patient as { fullName?: string; phone?: string; dateOfBirth?: string; gender?: string; insuranceId?: string };
    const treatment = r.treatment as { prescriptions?: unknown[]; procedures?: unknown[]; [key: string]: unknown };
    const diagnosis = r.diagnosis as { primary?: string; notes?: string; [key: string]: unknown };
    return {
      id: r.id,
      token: visit.queueToken ?? "—",
      patientName: patient.fullName ?? "Unknown",
      phone: patient.phone ?? null,
      chiefComplaint: visit.chiefComplaint ?? "",
      department: visit.department ?? "",
      symptomSeverity: visit.symptomSeverity ?? null,
      emergencyFlag: visit.emergencyFlag ?? false,
      emergencyReason: visit.emergencyReason ?? null,
      visitStatus: visit.visitStatus ?? "active",
      priorityReturn: visit.priorityReturn ?? false,
      treatment: treatment ?? {},
      diagnosis: diagnosis ?? {},
      referrals: visit.referrals ?? [],
      createdAt: r.createdAt,
    };
  });

  return Response.json(queue);
}

// PATCH: Escalate patient to emergency (doctor escalation)
export async function PATCH(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { recordId, hospitalCode, escalationReason, escalatedBy } = body as {
    recordId: string;
    hospitalCode: string;
    escalationReason?: string;
    escalatedBy?: string;
  };

  if (!recordId || !hospitalCode) {
    return Response.json({ error: "recordId and hospitalCode required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) {
    return Response.json({ error: "Hospital not found" }, { status: 404 });
  }

  const record = await db.patientRecord.findUnique({ where: { id: recordId } });
  if (!record) {
    return Response.json({ error: "Record not found" }, { status: 404 });
  }

  const visit = record.visit as Record<string, unknown>;
  if (visit.emergencyFlag) {
    return Response.json({ error: "Patient is already flagged as emergency" }, { status: 409 });
  }

  // Generate ER token and update visit
  const erToken = await generateERToken(hospitalCode);
  const updatedVisit = {
    ...visit,
    emergencyFlag: true,
    emergencyReason: "doctor_escalation",
    escalatedBy: escalatedBy || "doctor",
    escalatedAt: new Date().toISOString(),
    escalationNote: escalationReason || null,
    queueToken: erToken,
  };

  await db.patientRecord.update({
    where: { id: recordId },
    data: { visit: JSON.parse(JSON.stringify(updatedVisit)) },
  });

  // Broadcast emergency event
  try {
    const pusher = getPusher();
    const patient = record.patient as { fullName?: string };
    await pusher.trigger(hospitalChannel(hospitalCode, "emergency"), "emergency-escalation", {
      queueToken: erToken,
      patientName: patient.fullName ?? "Unknown",
      chiefComplaint: visit.chiefComplaint ?? "",
      severity: visit.symptomSeverity ?? null,
      recordId,
      reason: "doctor_escalation",
      escalatedBy: escalatedBy || "doctor",
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Pusher not configured
  }

  await logAudit({
    actorType: "doctor",
    actorId: escalatedBy || "doctor",
    hospitalId: hospital.id,
    action: "patient.emergency_escalated",
    metadata: { recordId, erToken, escalationReason },
    ipAddress: getClientIP(request),
  });

  return Response.json({ erToken, recordId, emergencyFlag: true });
}
