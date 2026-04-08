import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { getPusher, hospitalChannel } from "@/lib/pusher-server";

const VALID_STATUSES = ["AVAILABLE", "ON_BREAK", "IN_CONSULTATION", "IN_SURGERY", "OFF_DUTY", "ON_CALL"] as const;
const VALID_ROLES = ["attending", "resident", "intern"] as const;

// GET: List doctors for a hospital (optionally filter by specialty/status)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const specialty = searchParams.get("specialty");
  const status = searchParams.get("status");
  const available = searchParams.get("available"); // "true" = AVAILABLE + under capacity

  if (!hospitalCode) {
    return Response.json({ error: "hospitalCode required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) {
    return Response.json({ error: "Hospital not found" }, { status: 404 });
  }

  const where: Record<string, unknown> = { hospitalId: hospital.id };
  if (specialty) where.specialty = specialty;
  if (status) where.status = status;
  if (available === "true") {
    where.status = "AVAILABLE";
    // Will filter by capacity in code after fetch
  }

  const doctors = await db.doctor.findMany({
    where,
    include: { supervisor: { select: { id: true, name: true } } },
    orderBy: [{ activePatientCount: "asc" }, { name: "asc" }],
  });

  // Filter by capacity if requested
  const result = available === "true"
    ? doctors.filter((d) => d.activePatientCount < d.maxConcurrentPatients)
    : doctors;

  return Response.json(result);
}

// POST: Create a new doctor profile
export async function POST(request: Request) {
  const body = await request.json();
  const { hospitalCode, name, specialty, role, maxConcurrentPatients, supervisorId, shiftStart, shiftEnd } = body;

  if (!hospitalCode || !name || !specialty) {
    return Response.json({ error: "hospitalCode, name, and specialty required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) {
    return Response.json({ error: "Hospital not found" }, { status: 404 });
  }

  if (role && !VALID_ROLES.includes(role)) {
    return Response.json({ error: `Invalid role. Valid: ${VALID_ROLES.join(", ")}` }, { status: 400 });
  }

  const doctor = await db.doctor.create({
    data: {
      hospitalId: hospital.id,
      name,
      specialty,
      role: role || "attending",
      maxConcurrentPatients: maxConcurrentPatients || 10,
      supervisorId: supervisorId || null,
      shiftStart: shiftStart || null,
      shiftEnd: shiftEnd || null,
    },
  });

  await logAudit({
    actorType: "hospital_admin",
    actorId: "admin",
    hospitalId: hospital.id,
    action: "doctor.created",
    metadata: { doctorId: doctor.id, name, specialty, role: role || "attending" },
    ipAddress: getClientIP(request),
  });

  return Response.json(doctor, { status: 201 });
}

// PATCH: Update doctor status, patient count, or profile
export async function PATCH(request: Request) {
  const body = await request.json();
  const { doctorId, status, activePatientCount, breakReason, meta } = body;

  if (!doctorId) {
    return Response.json({ error: "doctorId required" }, { status: 400 });
  }

  const doctor = await db.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    return Response.json({ error: "Doctor not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (status) {
    if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      return Response.json({ error: `Invalid status. Valid: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }
    data.status = status;

    // Track break start in meta
    if (status === "ON_BREAK") {
      const currentMeta = (doctor.meta as Record<string, unknown>) || {};
      data.meta = { ...currentMeta, breakStartedAt: new Date().toISOString(), breakReason: breakReason || null };
    }
    if (doctor.status === "ON_BREAK" && status !== "ON_BREAK") {
      const currentMeta = (doctor.meta as Record<string, unknown>) || {};
      data.meta = { ...currentMeta, breakStartedAt: null, breakReason: null, lastBreakEndedAt: new Date().toISOString() };
    }
  }

  if (typeof activePatientCount === "number") {
    data.activePatientCount = activePatientCount;
  }

  if (meta) {
    const currentMeta = (doctor.meta as Record<string, unknown>) || {};
    data.meta = { ...currentMeta, ...meta };
  }

  const updated = await db.doctor.update({ where: { id: doctorId }, data });

  // Broadcast status change
  if (status && status !== doctor.status) {
    const hospital = await db.hospital.findUnique({ where: { id: doctor.hospitalId } });
    if (hospital) {
      try {
        const pusher = getPusher();
        await pusher.trigger(hospitalChannel(hospital.code, "doctors"), "doctor-status-changed", {
          doctorId: doctor.id,
          name: doctor.name,
          previousStatus: doctor.status,
          newStatus: status,
          timestamp: new Date().toISOString(),
        });
      } catch { /* Pusher not configured */ }

      await logAudit({
        actorType: "doctor",
        actorId: doctorId,
        hospitalId: hospital.id,
        action: "doctor.status_changed",
        metadata: { from: doctor.status, to: status, breakReason },
        ipAddress: getClientIP(request),
      });

      // If break > 30 min, flag for redistribution
      if (status === "ON_BREAK") {
        // Schedule check is client-side — we just mark the timestamp
      }
    }
  }

  return Response.json(updated);
}
