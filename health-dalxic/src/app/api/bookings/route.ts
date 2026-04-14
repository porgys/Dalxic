import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit, getClientIP } from "@/lib/audit";
import { createBillableItem } from "@/lib/billing";

// GET: List bookings for a hospital (optional filters: from, to, status, doctorId)
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  const doctorId = searchParams.get("doctorId");

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { hospitalId: hospital.id };
  if (status) where.status = status;
  if (doctorId) where.doctorId = doctorId;
  if (from || to) {
    where.scheduledAt = {};
    if (from) where.scheduledAt.gte = new Date(from);
    if (to) where.scheduledAt.lte = new Date(to);
  }

  const bookings = await db.booking.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    take: 200,
  });

  return Response.json(bookings);
}

// POST: Create a booking. If fee > 0, writes a BillableItem with serviceType=BOOKING_FEE.
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const {
    hospitalCode,
    patientId,
    patientName,
    patientPhone,
    doctorId,
    departmentKey,
    scheduledAt,
    durationMins = 30,
    fee = 0,
    notes,
    createdBy,
    bookId, // MonthlyBook id — required if fee > 0 so BillableItem can be attached
  } = body;

  if (!hospitalCode || !patientName || !scheduledAt || !createdBy) {
    return Response.json({ error: "hospitalCode, patientName, scheduledAt, createdBy required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  if (!hospital.activeModules.includes("cards_bookings")) {
    return Response.json({ error: "Cards & Bookings module is not active for this hospital" }, { status: 403 });
  }

  const resolvedPatientId = patientId || `walk-in-${Date.now()}`;

  const booking = await db.booking.create({
    data: {
      hospitalId: hospital.id,
      patientId: resolvedPatientId,
      patientName,
      patientPhone: patientPhone || null,
      doctorId: doctorId || null,
      departmentKey: departmentKey || null,
      scheduledAt: new Date(scheduledAt),
      durationMins,
      fee,
      feePaid: false,
      notes: notes || null,
      createdBy,
    },
  });

  // Fee → BillableItem (only if fee > 0 and bookId provided)
  if (fee > 0 && bookId) {
    const item = await createBillableItem({
      hospitalId: hospital.id,
      patientId: resolvedPatientId,
      bookId,
      serviceType: "BOOKING_FEE",
      description: `Booking — ${patientName} (${new Date(scheduledAt).toLocaleString()})`,
      unitCost: fee,
      quantity: 1,
      renderedBy: createdBy,
      doctorId: doctorId || undefined,
    });
    await db.booking.update({
      where: { id: booking.id },
      data: { billableItemId: item.id, feePaid: true },
    });
  }

  await logAudit({
    actorType: "device_operator",
    actorId: createdBy,
    hospitalId: hospital.id,
    action: "booking.created",
    metadata: { patientName, scheduledAt, fee },
    ipAddress: getClientIP(request),
  });

  return Response.json(booking, { status: 201 });
}

// PATCH: Update booking status or details (confirm, cancel, check-in, complete)
export async function PATCH(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { bookingId, status, notes, scheduledAt, actorId } = body;

  if (!bookingId || !actorId) {
    return Response.json({ error: "bookingId and actorId required" }, { status: 400 });
  }

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });

  const allowedStatuses = ["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (status && allowedStatuses.includes(status)) data.status = status;
  if (notes !== undefined) data.notes = notes;
  if (scheduledAt) data.scheduledAt = new Date(scheduledAt);

  const updated = await db.booking.update({ where: { id: bookingId }, data });

  await logAudit({
    actorType: "device_operator",
    actorId,
    hospitalId: booking.hospitalId,
    action: `booking.${status?.toLowerCase() ?? "updated"}`,
    metadata: { bookingId, previousStatus: booking.status },
    ipAddress: getClientIP(request),
  });

  return Response.json(updated);
}
