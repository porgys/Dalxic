import { db } from "./db";

/** Department prefix map — matches front desk DEPARTMENTS array */
export const DEPT_PREFIXES: Record<string, string> = {
  general: "GR",
  cardiology: "CD",
  neurology: "NR",
  oncology: "ON",
  gastroenterology: "GI",
  endocrinology: "ED",
  nephrology: "NP",
  pulmonology: "PL",
  hematology: "HM",
  rheumatology: "RH",
  geriatrics: "GT",
  dermatology: "DM",
  emergency: "ER",
  pediatrics: "PD",
  obstetrics: "OB",
  surgery: "SG",
  orthopedics: "OR",
  neurosurgery: "NS",
  cardiothoracic: "CT",
  plastic_surgery: "PS",
  urology: "UR",
  dental: "DN",
  eye: "EY",
  ent: "EN",
  psychiatry: "PY",
  radiology: "RD",
  anesthesiology: "AN",
  pathology: "PT",
  direct_treatment: "DT",
};

/** Generate department-coded queue token: GR-KBH-001, PD-KBH-002 */
export async function generateQueueToken(
  hospitalId: string,
  bookId: string,
  department?: string,
  hospitalCode?: string
): Promise<string> {
  const dept = (department || "general").toLowerCase();
  const prefix = DEPT_PREFIXES[dept] || "GR";
  const code = hospitalCode || "KBH";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Count today's records in the same department for per-department sequencing
  const allRecords = await db.patientRecord.findMany({
    where: {
      hospitalId,
      bookId,
      createdAt: { gte: today },
    },
    select: { visit: true },
  });

  const deptCount = allRecords.filter((r) => {
    const visit = r.visit as { department?: string } | null;
    const d = (visit?.department || "general").toLowerCase();
    return d === dept;
  }).length;

  return `${prefix}-${code}-${String(deptCount + 1).padStart(3, "0")}`;
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
  bookkeeping: "BK",
};
