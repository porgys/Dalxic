import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { createHash } from "crypto";
import { rateLimit } from "@/lib/rate-limit";
// POST: Trigger emergency override session
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { hospitalId, userId, pin, reason } = body;

  if (!hospitalId || !userId || !pin || !reason?.trim()) {
    return Response.json({ error: "All fields required. Reason cannot be blank." }, { status: 400 });
  }

  const contact = await db.hospitalEmergencyContact.findFirst({
    where: { hospitalId, userId, isActive: true },
  });

  if (!contact) {
    return Response.json({ error: "Not authorized for emergency override" }, { status: 403 });
  }

  const pinHash = createHash("sha256").update(pin).digest("hex");
  const ip = getClientIP(request);

  if (pinHash !== contact.overridePinHash) {
    // Log failed attempt but DO NOT lock account (patient safety priority)
    await logAudit({
      actorType: "emergency_override",
      actorId: userId,
      hospitalId,
      action: "emergency.pin_failed",
      metadata: { designation: contact.designation },
      ipAddress: ip,
    });

    return Response.json({ error: "Invalid emergency PIN" }, { status: 401 });
  }

  // Create session (max 4 hours)
  const session = await db.emergencyOverrideSession.create({
    data: {
      hospitalId,
      triggeredBy: userId,
      statedReason: reason,
      ipAddress: ip,
      dalxicNotifiedAt: new Date(), // Notification fires immediately
    },
  });

  // Audit: permanent EMERGENCY_OVERRIDE flag
  await logAudit({
    actorType: "emergency_override",
    actorId: userId,
    hospitalId,
    action: "emergency.session_started",
    metadata: {
      sessionId: session.id,
      designation: contact.designation,
      reason,
      EMERGENCY_OVERRIDE: true,
    },
    ipAddress: ip,
  });

  return Response.json({
    sessionId: session.id,
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
    message: "Emergency override active. All record access will be logged.",
  }, { status: 201 });
}

// PATCH: End emergency session
export async function PATCH(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { sessionId, endReason } = body as { sessionId: string; endReason: "manual" | "auto_expired" };

  const session = await db.emergencyOverrideSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.endedAt) {
    return Response.json({ error: "Session already ended" }, { status: 409 });
  }

  const ended = await db.emergencyOverrideSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date(), endReason: endReason ?? "manual" },
  });

  // Log access summary
  const accessCount = await db.emergencyRecordAccess.count({
    where: { sessionId },
  });

  await logAudit({
    actorType: "emergency_override",
    actorId: session.triggeredBy,
    hospitalId: session.hospitalId,
    action: "emergency.session_ended",
    metadata: {
      sessionId,
      endReason,
      recordsAccessed: accessCount,
      duration: Math.round((Date.now() - session.triggeredAt.getTime()) / 60000),
      EMERGENCY_OVERRIDE: true,
    },
    ipAddress: getClientIP(request),
  });

  return Response.json(ended);
}

// GET: Log record access during emergency session
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const recordId = searchParams.get("recordId");

  if (!sessionId) {
    return Response.json({ error: "sessionId required" }, { status: 400 });
  }

  const session = await db.emergencyOverrideSession.findUnique({ where: { id: sessionId } });
  if (!session || session.endedAt) {
    return Response.json({ error: "No active session" }, { status: 403 });
  }

  // Check 4-hour expiry
  const elapsed = Date.now() - session.triggeredAt.getTime();
  if (elapsed > 4 * 60 * 60 * 1000) {
    await db.emergencyOverrideSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date(), endReason: "auto_expired" },
    });
    return Response.json({ error: "Session expired (4-hour limit)" }, { status: 403 });
  }

  // If recordId provided, log this access
  if (recordId) {
    await db.emergencyRecordAccess.create({
      data: {
        sessionId,
        patientId: recordId,
        recordType: "patient_record",
        recordId,
      },
    });

    await logAudit({
      actorType: "emergency_override",
      actorId: session.triggeredBy,
      hospitalId: session.hospitalId,
      action: "emergency.record_accessed",
      metadata: { sessionId, recordId, EMERGENCY_OVERRIDE: true },
      ipAddress: getClientIP(request),
    });
  }

  // Return all records for this hospital (read-only)
  const records = await db.patientRecord.findMany({
    where: { hospitalId: session.hospitalId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json({ records, sessionId, expiresIn: Math.round((4 * 60 * 60 * 1000 - elapsed) / 60000) });
}
