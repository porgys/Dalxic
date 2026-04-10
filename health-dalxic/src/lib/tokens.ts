import { db } from "./db";

/** Generate next queue token for a hospital today: #001, #002, etc. */
export async function generateQueueToken(hospitalId: string, bookId: string): Promise<string> {
  const count = await db.patientRecord.count({
    where: {
      hospitalId,
      bookId,
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });
  return `#${String(count + 1).padStart(3, "0")}`;
}

/** Generate emergency token: ER-KBH-001 */
export async function generateERToken(hospitalCode: string): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = await db.patientRecord.count({
    where: {
      hospital: { code: hospitalCode },
      createdAt: { gte: today },
      visit: { path: ["emergencyFlag"], equals: true },
    },
  });
  return `ER-${hospitalCode}-${String(count + 1).padStart(3, "0")}`;
}

/** Generate lab sub-token: LAB-KBH-001 */
export async function generateLabToken(hospitalCode: string): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = await db.labOrder.count({
    where: {
      labToken: { startsWith: `LAB-${hospitalCode}` },
      orderedAt: { gte: today },
    },
  });
  return `LAB-${hospitalCode}-${String(count + 1).padStart(3, "0")}`;
}

/** Generate referral sub-token for any station */
export async function generateReferralToken(
  hospitalCode: string,
  prefix: string // INJ, CT, RAD, etc.
): Promise<string> {
  const num = Math.floor(Math.random() * 900) + 100;
  return `${prefix}-${hospitalCode}-${num}`;
}

/** Generate device code: KBH-FD-001 */
export function generateDeviceCode(
  hospitalCode: string,
  rolePrefix: string,
  sequence: number
): string {
  return `${hospitalCode}-${rolePrefix}-${String(sequence).padStart(3, "0")}`;
}

export const ROLE_PREFIXES: Record<string, string> = {
  front_desk: "FD",
  waiting_room: "WR",
  doctor: "DR",
  pharmacy: "PH",
  lab: "LB",
  injection: "INJ",
  nurse: "NS",
  radiology: "RAD",
  ward: "WD",
  billing: "BL",
  ultrasound: "US",
  emergency: "ER",
  icu: "ICU",
  maternity: "MT",
  blood_bank: "BB",
};
