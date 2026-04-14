import { db } from "./db";

/**
 * Sum of BillableItem.totalCost attributed to a doctor over a period.
 */
export async function computeGross(params: {
  hospitalId: string;
  doctorId: string;
  from: Date;
  to: Date;
}): Promise<number> {
  const { hospitalId, doctorId, from, to } = params;
  const agg = await db.billableItem.aggregate({
    where: { hospitalId, doctorId, renderedAt: { gte: from, lte: to } },
    _sum: { totalCost: true, staffCutCost: true },
  });
  return agg._sum.totalCost ?? 0;
}

/**
 * Staff cut snapshot sum for the period — prefers the per-row staffCutCost snapshot.
 * Falls back to recomputing against current commission rate if no snapshot is set.
 */
export async function computeDue(params: {
  hospitalId: string;
  doctorId: string;
  from: Date;
  to: Date;
}): Promise<{ gross: number; due: number; commissionRate: number }> {
  const { hospitalId, doctorId, from, to } = params;

  const items = await db.billableItem.findMany({
    where: { hospitalId, doctorId, renderedAt: { gte: from, lte: to } },
    select: { totalCost: true, staffCutCost: true, commissionPct: true },
  });

  const gross = items.reduce((s, i) => s + i.totalCost, 0);

  // Prefer snapshotted cut. If any row is missing the snapshot, recompute from current rate.
  const hasAllSnapshots = items.length > 0 && items.every((i) => i.staffCutCost != null);
  if (hasAllSnapshots) {
    const due = items.reduce((s, i) => s + (i.staffCutCost ?? 0), 0);
    // Return the average commission pct observed (for display)
    const rate = items.length
      ? items.reduce((s, i) => s + (i.commissionPct ?? 0), 0) / items.length
      : 0;
    return { gross, due, commissionRate: rate };
  }

  const doc = await db.doctor.findUnique({ where: { id: doctorId } });
  const rate = doc?.commissionRate ?? 0;
  const due = Math.round((gross * rate) / 100 * 100) / 100;
  return { gross, due, commissionRate: rate };
}

/**
 * Materialize a StaffPayout row for a doctor/period. Does NOT mark paid.
 */
export async function createPayout(params: {
  hospitalId: string;
  doctorId: string;
  from: Date;
  to: Date;
  createdBy: string;
  notes?: string;
}) {
  const { hospitalId, doctorId, from, to, createdBy, notes } = params;
  const { gross, due, commissionRate } = await computeDue({ hospitalId, doctorId, from, to });

  return db.staffPayout.create({
    data: {
      hospitalId,
      doctorId,
      periodStart: from,
      periodEnd: to,
      grossRevenue: gross,
      commissionRate,
      amountDue: due,
      status: "PENDING",
      createdBy,
      notes: notes ?? null,
    },
  });
}

/**
 * Mark a payout as paid.
 */
export async function markPaid(params: {
  payoutId: string;
  paidBy: string;
  paymentMethod: "CASH" | "MOMO" | "BANK";
  paymentRef?: string;
  notes?: string;
}) {
  const { payoutId, paidBy, paymentMethod, paymentRef, notes } = params;

  const existing = await db.staffPayout.findUnique({ where: { id: payoutId } });
  if (!existing) throw new Error("Payout not found");
  if (existing.status === "PAID") return existing;
  if (existing.status === "CANCELLED") throw new Error("Cannot pay a cancelled payout");

  return db.staffPayout.update({
    where: { id: payoutId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paidBy,
      paymentMethod,
      paymentRef: paymentRef ?? null,
      notes: notes ?? existing.notes,
    },
  });
}

/**
 * List payouts with optional filters.
 */
export async function listPayouts(params: {
  hospitalId: string;
  doctorId?: string;
  status?: "PENDING" | "PAID" | "CANCELLED";
  from?: Date;
  to?: Date;
}) {
  const { hospitalId, doctorId, status, from, to } = params;
  return db.staffPayout.findMany({
    where: {
      hospitalId,
      ...(doctorId ? { doctorId } : {}),
      ...(status ? { status } : {}),
      ...(from || to
        ? { periodStart: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
