import { db } from "@/lib/db";
import { generateERToken } from "@/lib/tokens";
import { logAudit, getClientIP } from "@/lib/audit";
import { getPusher, hospitalChannel } from "@/lib/pusher-server";
import { rateLimit } from "@/lib/rate-limit";
// POST: Emergency admission — ambulance/walk-in/transfer intake (bypasses normal registration)
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { hospitalCode, patientName, severity, chiefComplaint, arrivalMode } = body as {
    hospitalCode: string;
    patientName: string;
    severity?: number;
    chiefComplaint: string;
    arrivalMode?: "ambulance" | "walk_in" | "transfer";
  };

  if (!hospitalCode || !patientName?.trim() || !chiefComplaint?.trim()) {
    return Response.json({ error: "hospitalCode, patientName, and chiefComplaint required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) {
    return Response.json({ error: "Hospital not found" }, { status: 404 });
  }

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

  const erToken = await generateERToken(hospitalCode);
  const effectiveSeverity = severity ?? 10;
  const checkoutPin = String(Math.floor(1000 + Math.random() * 9000));

  const record = await db.patientRecord.create({
    data: {
      bookId: book.id,
      hospitalId: hospital.id,
      patient: JSON.parse(JSON.stringify({
        fullName: patientName.trim(),
      })),
      visit: JSON.parse(JSON.stringify({
        date: now.toISOString(),
        chiefComplaint: chiefComplaint.trim(),
        department: "emergency",
        assignedDoctor: null,
        queueToken: erToken,
        entryPoint: "emergency_intake",
        arrivalMode: arrivalMode || "walk_in",
        symptomSeverity: effectiveSeverity,
        emergencyFlag: true,
        emergencyReason: "emergency_admit",
        checkoutPin,
      })),
      diagnosis: JSON.parse(JSON.stringify({ primary: null, secondary: [], icdCodes: [], notes: null })),
      treatment: JSON.parse(JSON.stringify({ prescriptions: [], procedures: [], followUp: null, nextAppointment: null })),
      entryPoint: "emergency_intake",
      createdBy: "device",
    },
  });

  // Broadcast emergency event
  try {
    const pusher = getPusher();
    await pusher.trigger(hospitalChannel(hospitalCode, "emergency"), "emergency-admission", {
      queueToken: erToken,
      patientName: patientName.trim(),
      chiefComplaint: chiefComplaint.trim(),
      severity: effectiveSeverity,
      arrivalMode: arrivalMode || "walk_in",
      recordId: record.id,
      reason: "emergency_admit",
      timestamp: now.toISOString(),
    });
    await pusher.trigger(hospitalChannel(hospitalCode, "queue"), "patient-added", {
      queueToken: erToken,
      patientName: patientName.trim(),
      chiefComplaint: chiefComplaint.trim(),
      department: "emergency",
      recordId: record.id,
      emergencyFlag: true,
      symptomSeverity: effectiveSeverity,
      timestamp: now.toISOString(),
    });
  } catch {
    // Pusher not configured
  }

  await logAudit({
    actorType: "device_operator",
    actorId: "device",
    hospitalId: hospital.id,
    action: "patient.emergency_admitted",
    metadata: { erToken, patientName, severity: effectiveSeverity, arrivalMode: arrivalMode || "walk_in" },
    ipAddress: getClientIP(request),
  });

  return Response.json({ erToken, recordId: record.id, emergencyFlag: true, checkoutPin }, { status: 201 });
}
