import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { clockIn, clockOut, getActiveShift, listShifts, getShiftLiveTotals } from "@/lib/shifts";

const VALID_SHIFT_TYPES = ["morning", "afternoon", "evening", "night", "custom"] as const;

// GET: list shifts OR get a single shift's live totals
//   ?hospitalCode=KBH                             → recent shifts
//   ?hospitalCode=KBH&doctorId=X&active=true      → single active shift (or null)
//   ?hospitalCode=KBH&shiftId=X                   → live totals for a shift
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const doctorId = searchParams.get("doctorId");
  const active = searchParams.get("active");
  const shiftId = searchParams.get("shiftId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  if (shiftId) {
    const shift = await db.doctorShift.findUnique({ where: { id: shiftId } });
    if (!shift || shift.hospitalId !== hospital.id) {
      return Response.json({ error: "Shift not found" }, { status: 404 });
    }
    const live = await getShiftLiveTotals(shiftId);
    return Response.json({ shift, live });
  }

  if (doctorId && active === "true") {
    const shift = await getActiveShift(hospital.id, doctorId);
    if (!shift) return Response.json({ shift: null });
    const live = await getShiftLiveTotals(shift.id);
    return Response.json({ shift, live });
  }

  const shifts = await listShifts({
    hospitalId: hospital.id,
    doctorId: doctorId || undefined,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });
  return Response.json(shifts);
}

// POST: clockIn or clockOut
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { action, hospitalCode, doctorId, shiftType, shiftId, notes } = body;

  if (!hospitalCode || !action) {
    return Response.json({ error: "hospitalCode and action required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  if (action === "clock_in") {
    if (!doctorId || !shiftType) {
      return Response.json({ error: "doctorId and shiftType required" }, { status: 400 });
    }
    if (!VALID_SHIFT_TYPES.includes(shiftType)) {
      return Response.json({ error: `Invalid shiftType. Valid: ${VALID_SHIFT_TYPES.join(", ")}` }, { status: 400 });
    }
    const doctor = await db.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return Response.json({ error: "Doctor not found" }, { status: 404 });
    }
    if (doctor.hospitalId !== hospital.id) {
      return Response.json({ error: "Doctor does not belong to this hospital" }, { status: 403 });
    }
    const noEarningConfig =
      (doctor.commissionRate == null || doctor.commissionRate <= 0) &&
      (doctor.consultationFee == null || doctor.consultationFee <= 0);
    if (noEarningConfig) {
      return Response.json({
        error: "Doctor has no earning configuration. Set commissionRate or consultationFee before starting a shift.",
      }, { status: 409 });
    }
    try {
      const shift = await clockIn({ hospitalId: hospital.id, doctorId, shiftType, notes });
      await logAudit({
        actorType: "doctor",
        actorId: doctorId,
        hospitalId: hospital.id,
        action: "shift.clock_in",
        metadata: { shiftId: shift.id, shiftType },
        ipAddress: getClientIP(request),
      });
      return Response.json(shift, { status: 201 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to clock in";
      return Response.json({ error: msg }, { status: 409 });
    }
  }

  if (action === "clock_out") {
    if (!shiftId) return Response.json({ error: "shiftId required" }, { status: 400 });
    try {
      const shift = await clockOut(shiftId);
      await logAudit({
        actorType: "doctor",
        actorId: shift.doctorId,
        hospitalId: hospital.id,
        action: "shift.clock_out",
        metadata: { shiftId, grossRevenue: shift.grossRevenue, patientCount: shift.patientCount },
        ipAddress: getClientIP(request),
      });
      return Response.json(shift);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to clock out";
      return Response.json({ error: msg }, { status: 400 });
    }
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
