import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { computeDue, createPayout, markPaid, listPayouts } from "@/lib/payouts";

// GET: list payouts OR preview an un-materialized period for a doctor
//   ?hospitalCode=KBH                          → all payouts
//   ?hospitalCode=KBH&doctorId=X               → payouts for one doctor
//   ?hospitalCode=KBH&doctorId=X&preview=true&from=...&to=...  → gross/due for period, no row created
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const doctorId = searchParams.get("doctorId");
  const status = searchParams.get("status") as "PENDING" | "PAID" | "CANCELLED" | null;
  const preview = searchParams.get("preview");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  if (preview === "true") {
    if (!doctorId || !from || !to) {
      return Response.json({ error: "doctorId, from, to required for preview" }, { status: 400 });
    }
    const result = await computeDue({
      hospitalId: hospital.id,
      doctorId,
      from: new Date(from),
      to: new Date(to),
    });
    return Response.json(result);
  }

  const payouts = await listPayouts({
    hospitalId: hospital.id,
    doctorId: doctorId || undefined,
    status: status || undefined,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });

  // Join doctor names for UI
  const doctorIds = Array.from(new Set(payouts.map((p) => p.doctorId)));
  const doctors = await db.doctor.findMany({
    where: { id: { in: doctorIds } },
    select: { id: true, name: true, specialty: true },
  });
  const byId = new Map(doctors.map((d) => [d.id, d]));

  return Response.json(payouts.map((p) => ({
    ...p,
    doctorName: byId.get(p.doctorId)?.name ?? "Unknown",
    doctorSpecialty: byId.get(p.doctorId)?.specialty ?? null,
  })));
}

// POST: materialize or mark paid
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { action, hospitalCode } = body;

  if (!hospitalCode || !action) {
    return Response.json({ error: "hospitalCode and action required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  if (action === "create") {
    const { doctorId, from, to, createdBy, notes } = body;
    if (!doctorId || !from || !to || !createdBy) {
      return Response.json({ error: "doctorId, from, to, createdBy required" }, { status: 400 });
    }
    const payout = await createPayout({
      hospitalId: hospital.id,
      doctorId,
      from: new Date(from),
      to: new Date(to),
      createdBy,
      notes,
    });
    await logAudit({
      actorType: "hospital_admin",
      actorId: createdBy,
      hospitalId: hospital.id,
      action: "payout.created",
      metadata: { payoutId: payout.id, doctorId, grossRevenue: payout.grossRevenue, amountDue: payout.amountDue },
      ipAddress: getClientIP(request),
    });
    return Response.json(payout, { status: 201 });
  }

  if (action === "mark_paid") {
    const { payoutId, paidBy, paymentMethod, paymentRef, notes } = body;
    if (!payoutId || !paidBy || !paymentMethod) {
      return Response.json({ error: "payoutId, paidBy, paymentMethod required" }, { status: 400 });
    }
    if (!["CASH", "MOMO", "BANK"].includes(paymentMethod)) {
      return Response.json({ error: "paymentMethod must be CASH|MOMO|BANK" }, { status: 400 });
    }
    try {
      const payout = await markPaid({ payoutId, paidBy, paymentMethod, paymentRef, notes });
      await logAudit({
        actorType: "hospital_admin",
        actorId: paidBy,
        hospitalId: hospital.id,
        action: "payout.marked_paid",
        metadata: { payoutId, paymentMethod, paymentRef, amountDue: payout.amountDue },
        ipAddress: getClientIP(request),
      });
      return Response.json(payout);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to mark paid";
      return Response.json({ error: msg }, { status: 400 });
    }
  }

  if (action === "cancel") {
    const { payoutId, cancelledBy } = body;
    if (!payoutId) return Response.json({ error: "payoutId required" }, { status: 400 });
    const payout = await db.staffPayout.update({
      where: { id: payoutId },
      data: { status: "CANCELLED" },
    });
    await logAudit({
      actorType: "hospital_admin",
      actorId: cancelledBy || "admin",
      hospitalId: hospital.id,
      action: "payout.cancelled",
      metadata: { payoutId },
      ipAddress: getClientIP(request),
    });
    return Response.json(payout);
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
