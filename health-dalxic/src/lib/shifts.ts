import { db } from "./db";

export type ShiftType = "morning" | "afternoon" | "evening" | "night" | "custom";

/**
 * Open a new DoctorShift session. Rejects if the doctor already has an open shift.
 */
export async function clockIn(params: {
  hospitalId: string;
  doctorId: string;
  shiftType: ShiftType;
  notes?: string;
}) {
  const { hospitalId, doctorId, shiftType, notes } = params;

  const open = await db.doctorShift.findFirst({
    where: { hospitalId, doctorId, clockOutAt: null },
  });
  if (open) {
    throw new Error(`Doctor already has an open shift (id: ${open.id}, started ${open.clockInAt.toISOString()})`);
  }

  return db.doctorShift.create({
    data: { hospitalId, doctorId, shiftType, notes: notes ?? null },
  });
}

/**
 * Close a shift session and roll up revenue + patient count from attached billables.
 * Idempotent-ish: if already closed, returns current row without re-rolling.
 */
export async function clockOut(shiftId: string) {
  const shift = await db.doctorShift.findUnique({ where: { id: shiftId } });
  if (!shift) throw new Error("Shift not found");
  if (shift.clockOutAt) return shift;

  // Roll up from billable_items attached to this shift
  const items = await db.billableItem.findMany({
    where: { shiftId },
    select: { totalCost: true, patientId: true },
  });
  const grossRevenue = items.reduce((s, i) => s + i.totalCost, 0);
  const patientCount = new Set(items.map((i) => i.patientId)).size;

  return db.doctorShift.update({
    where: { id: shiftId },
    data: {
      clockOutAt: new Date(),
      grossRevenue,
      patientCount,
    },
  });
}

/**
 * Get the currently-open shift for a doctor, or null.
 */
export async function getActiveShift(hospitalId: string, doctorId: string) {
  return db.doctorShift.findFirst({
    where: { hospitalId, doctorId, clockOutAt: null },
    orderBy: { clockInAt: "desc" },
  });
}

/**
 * List shifts for reporting. Both open and closed.
 */
export async function listShifts(params: {
  hospitalId: string;
  from?: Date;
  to?: Date;
  doctorId?: string;
}) {
  const { hospitalId, from, to, doctorId } = params;
  return db.doctorShift.findMany({
    where: {
      hospitalId,
      ...(doctorId ? { doctorId } : {}),
      ...(from || to
        ? {
            clockInAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    orderBy: { clockInAt: "desc" },
    take: 200,
  });
}

/**
 * Live totals for an open shift — sums current billables without rolling them into the shift row.
 * Used by the doctor UI to show earnings-in-progress.
 */
export async function getShiftLiveTotals(shiftId: string) {
  const items = await db.billableItem.findMany({
    where: { shiftId },
    select: { totalCost: true, staffCutCost: true, patientId: true },
  });
  const grossRevenue = items.reduce((s, i) => s + i.totalCost, 0);
  const staffCut = items.reduce((s, i) => s + (i.staffCutCost ?? 0), 0);
  const patientCount = new Set(items.map((i) => i.patientId)).size;
  return { grossRevenue, staffCut, patientCount, itemCount: items.length };
}
