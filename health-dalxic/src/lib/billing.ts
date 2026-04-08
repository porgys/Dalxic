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

/**
 * Create a BillableItem — called by any module after rendering a service.
 * This is the universal billing connector. Modules don't know about billing UI.
 * They just emit items. Billing station aggregates them.
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
}) {
  const { hospitalId, patientId, bookId, serviceType, description, unitCost, quantity = 1, renderedBy } = params;

  // Try to find hospital-configured price first
  const configuredPrice = await db.servicePrice.findFirst({
    where: { hospitalId, serviceType, isActive: true },
  });

  const finalUnitCost = configuredPrice ? configuredPrice.unitCost : unitCost;
  const totalCost = finalUnitCost * quantity;

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
