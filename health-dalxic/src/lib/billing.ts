import { db } from "./db";

/**
 * Service types that generate BillableItems.
 * Every module emits one of these when rendering a service.
 */
export type ServiceType =
  | "CONSULTATION"
  | "LAB"
  | "IMAGING"
  | "DRUG"
  | "WARD_DAY"
  | "PROCEDURE"
  | "EMERGENCY"
  | "ICU_DAY";

type PricingBlob = {
  defaults?: {
    consultationFee?: number;
    wardNightly?: number;
    injectionFee?: number;
    vitalsFee?: number;
    [key: string]: number | undefined;
  };
  doctors?: Record<string, { fee?: number; commission?: number; department?: string }>;
  wards?: Record<string, Record<string, number>>;
  services?: Record<string, Record<string, number>>;
};

async function loadPricing(hospitalId: string): Promise<PricingBlob | null> {
  const h = await db.hospital.findUnique({ where: { id: hospitalId }, select: { settings: true } });
  const s = (h?.settings ?? null) as { pricing?: PricingBlob } | null;
  return s?.pricing ?? null;
}

/**
 * Resolve the unit cost for a service.
 * Priority:
 *   1. overrideUnitCost (explicit caller override — e.g. pharmacy passes batch sellPrice)
 *   2. pricing.doctors[doctorId].fee (CONSULTATION only, from pricing blob)
 *   3. pricing.services[serviceType][description] (pricing blob)
 *   4. pricing.defaults.consultationFee (CONSULTATION only, in-house default)
 *   5. doctor.consultationFee (legacy column)
 *   6. ServicePrice table matched on (hospitalId, serviceType, name) (legacy)
 *   7. caller-provided unitCost fallback
 */
async function resolveUnitCost(params: {
  hospitalId: string;
  serviceType: ServiceType;
  description: string;
  unitCost: number;
  doctorId?: string;
  overrideUnitCost?: number;
}): Promise<number> {
  const { hospitalId, serviceType, description, unitCost, doctorId, overrideUnitCost } = params;

  if (overrideUnitCost !== undefined && overrideUnitCost !== null) return overrideUnitCost;

  const pricing = await loadPricing(hospitalId);

  // 2. Per-doctor override from pricing blob
  if (serviceType === "CONSULTATION" && doctorId && pricing?.doctors?.[doctorId]?.fee != null) {
    return pricing.doctors[doctorId].fee as number;
  }

  // 3. Service catalog from pricing blob
  const blobPrice = pricing?.services?.[serviceType]?.[description];
  if (blobPrice != null) return blobPrice;

  // 4. In-house consultation default
  if (serviceType === "CONSULTATION" && pricing?.defaults?.consultationFee != null) {
    return pricing.defaults.consultationFee;
  }

  // 5. Legacy Doctor.consultationFee
  if (serviceType === "CONSULTATION" && doctorId) {
    const doc = await db.doctor.findUnique({ where: { id: doctorId } });
    if (doc?.consultationFee != null) return doc.consultationFee;
  }

  // 6. Legacy ServicePrice table
  const configured = await db.servicePrice.findFirst({
    where: { hospitalId, serviceType, name: description, isActive: true },
  });
  if (configured) return configured.unitCost;

  return unitCost;
}

/**
 * Resolve the commission % for a doctor. Priority: pricing blob → legacy Doctor.commissionRate.
 */
async function resolveCommissionPct(hospitalId: string, doctorId: string): Promise<number | null> {
  const pricing = await loadPricing(hospitalId);
  const blobPct = pricing?.doctors?.[doctorId]?.commission;
  if (blobPct != null) return blobPct;
  const doc = await db.doctor.findUnique({ where: { id: doctorId } });
  if (doc?.commissionRate != null && doc.commissionRate > 0) return doc.commissionRate;
  return null;
}

/**
 * Resolve ward nightly rate for a ward / bed-class combination.
 * Priority: pricing.wards[wardName][bedClass] → pricing.defaults.wardNightly → fallback.
 */
export async function resolveWardNightly(params: {
  hospitalId: string;
  wardName: string;
  bedClass?: string;
  fallback: number;
}): Promise<number> {
  const { hospitalId, wardName, bedClass, fallback } = params;
  const pricing = await loadPricing(hospitalId);
  const cls = bedClass || "General";
  const byClass = pricing?.wards?.[wardName];
  if (byClass?.[cls] != null) return byClass[cls] as number;
  if (byClass?.["General"] != null) return byClass["General"] as number;
  if (pricing?.defaults?.wardNightly != null) return pricing.defaults.wardNightly;
  return fallback;
}

/**
 * Find the currently-open DoctorShift for a doctor, or null.
 */
async function getActiveShiftId(hospitalId: string, doctorId: string): Promise<string | null> {
  const shift = await db.doctorShift.findFirst({
    where: { hospitalId, doctorId, clockOutAt: null },
    orderBy: { clockInAt: "desc" },
  });
  return shift?.id ?? null;
}

/**
 * Create a BillableItem — called by any module after rendering a service.
 *
 * Attribution fields (all optional):
 *  - doctorId:     FK to Doctor — enables per-doctor revenue + commission payouts
 *  - departmentId: freeform code ("lab" | "imaging" | "pharmacy" | "nursing" | "ward" | "icu")
 *  - shiftId:      explicit shift FK (otherwise auto-attached from doctor's open shift)
 *  - overrideUnitCost: bypass fee resolution (pharmacy uses this for batch sellPrice)
 *
 * Snapshots commissionPct + staffCutCost at insert time so later rate changes don't rewrite history.
 */
export async function createBillableItem(params: {
  hospitalId: string;
  patientId: string;
  bookId: string;
  serviceType: ServiceType;
  description: string;
  unitCost: number;
  quantity?: number;
  renderedBy: string;
  doctorId?: string;
  departmentId?: string;
  shiftId?: string;
  overrideUnitCost?: number;
}) {
  const {
    hospitalId, patientId, bookId, serviceType, description,
    unitCost, quantity = 1, renderedBy,
    doctorId, departmentId, shiftId, overrideUnitCost,
  } = params;

  const finalUnitCost = await resolveUnitCost({
    hospitalId, serviceType, description, unitCost, doctorId, overrideUnitCost,
  });
  const totalCost = finalUnitCost * quantity;

  // Auto-attach shift if doctorId set and caller didn't supply one
  let finalShiftId: string | null = shiftId ?? null;
  if (!finalShiftId && doctorId) {
    finalShiftId = await getActiveShiftId(hospitalId, doctorId);
  }

  // Commission snapshot — only makes sense when a doctor is attributed
  let commissionPct: number | null = null;
  let staffCutCost: number | null = null;
  if (doctorId) {
    const pct = await resolveCommissionPct(hospitalId, doctorId);
    if (pct != null && pct > 0) {
      commissionPct = pct;
      staffCutCost = Math.round((totalCost * pct) / 100 * 100) / 100;
    }
  }

  return db.billableItem.create({
    data: {
      hospitalId,
      patientId,
      bookId,
      serviceType,
      description,
      unitCost: finalUnitCost,
      quantity,
      totalCost,
      renderedBy,
      doctorId: doctorId ?? null,
      departmentId: departmentId ?? null,
      shiftId: finalShiftId,
      commissionPct,
      staffCutCost,
    },
  });
}

/**
 * Get all unbilled items for a patient at a hospital.
 * Billing station uses this to assemble a bill.
 */
export async function getUnbilledItems(hospitalId: string, patientId: string) {
  return db.billableItem.findMany({
    where: { hospitalId, patientId, isBilled: false },
    orderBy: { renderedAt: "asc" },
  });
}

/**
 * Generate next bill number: BILL-KBH-2026-001
 */
export async function generateBillNumber(hospitalCode: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.bill.count({
    where: { billNumber: { startsWith: `BILL-${hospitalCode}-${year}` } },
  });
  return `BILL-${hospitalCode}-${year}-${String(count + 1).padStart(3, "0")}`;
}

/**
 * Assemble a bill from unbilled items for a patient.
 */
export async function assembleBill(params: {
  hospitalId: string;
  hospitalCode: string;
  patientId: string;
  bookId: string;
  discount?: number;
  createdBy: string;
}) {
  const { hospitalId, hospitalCode, patientId, bookId, discount = 0, createdBy } = params;

  const items = await getUnbilledItems(hospitalId, patientId);
  if (items.length === 0) return null;

  const subtotal = items.reduce((sum, item) => sum + item.totalCost, 0);
  const total = Math.max(0, subtotal - discount);

  const billNumber = await generateBillNumber(hospitalCode);

  const bill = await db.bill.create({
    data: {
      hospitalId,
      patientId,
      bookId,
      billNumber,
      subtotal,
      discount,
      total,
      status: "DRAFT",
      createdBy,
    },
  });

  // Link items to bill
  await db.billableItem.updateMany({
    where: { id: { in: items.map((i) => i.id) } },
    data: { isBilled: true, billId: bill.id },
  });

  return { ...bill, items };
}
