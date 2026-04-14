/**
 * Seed 100 TEST- prefixed patients and exercise every billing path.
 * Uses createBillableItem from lib/billing.ts (same function the APIs call)
 * so snapshot + priority-chain resolution fires identically.
 *
 * Distribution:
 *   15 → outpatient consultation only
 *   15 → consultation + lab
 *   15 → consultation + imaging (CT/Ultrasound)
 *   10 → pharmacy dispense (uses overrideUnitCost — batch sellPrice wins)
 *   10 → injection room (uses default injectionFee)
 *   10 → ward/IPD admission (mixed bed classes, 3 nights each)
 *   10 → ICU (ICU_DAY billable)
 *    5 → maternity (delivery PROCEDURE)
 *    5 → emergency triage
 *    5 → blood bank transfusion
 *
 * Run: npx tsx scripts/seed-100-test-patients.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { createBillableItem, resolveWardNightly } from "../src/lib/billing";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const HOSPITAL_CODE = "KBH";
const SEED_TAG = "pricing_sync_test";

const FIRST = ["Kwame", "Ama", "Kofi", "Akosua", "Yaw", "Efua", "Kojo", "Abena", "Kwesi", "Yaa", "Nana", "Adwoa", "Kwabena", "Akua", "Fiifi"];
const LAST = ["Mensah", "Asante", "Boateng", "Owusu", "Amoah", "Osei", "Adjei", "Opoku", "Darko", "Frimpong", "Gyasi", "Appiah"];

const LAB_TESTS = ["Full Blood Count", "Malaria Parasite", "Random Blood Sugar", "Urinalysis", "Widal Test"];
const IMAGING_STUDIES = ["Chest X-Ray", "Abdominal Ultrasound", "CT Head", "CT Abdomen"];
const DRUGS = [
  { name: "Paracetamol 500mg", batchSell: 3 },       // override; pricing blob has 2
  { name: "Amoxicillin 500mg", batchSell: 6 },        // override; pricing blob has 5
  { name: "Artemether-Lumefantrine", batchSell: 20 }, // override; pricing blob has 18
];
const BED_CLASSES = ["General", "Semi-Private", "Private", "ICU", "VIP"];

function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

async function ensureActiveShift(hospitalId: string, doctorId: string): Promise<string> {
  const existing = await db.doctorShift.findFirst({ where: { hospitalId, doctorId, clockOutAt: null } });
  if (existing) return existing.id;
  const shift = await db.doctorShift.create({
    data: { hospitalId, doctorId, shiftType: "morning", clockInAt: new Date() },
  });
  return shift.id;
}

async function createTestPatient(opts: {
  hospitalId: string;
  bookId: string;
  index: number;
  department: string;
}) {
  const firstName = pick(FIRST);
  const lastName = pick(LAST);
  const fullName = `TEST-${String(opts.index).padStart(3, "0")}-${firstName} ${lastName}`;
  const gender = Math.random() > 0.5 ? "Female" : "Male";
  const age = 18 + Math.floor(Math.random() * 50);
  const token = `TST-${String(opts.index).padStart(3, "0")}`;

  const record = await db.patientRecord.create({
    data: {
      bookId: opts.bookId,
      hospitalId: opts.hospitalId,
      entryPoint: "manual",
      createdBy: SEED_TAG,
      patient: { fullName, phone: `024${String(1000000 + opts.index).padStart(7, "0")}`, gender, age, dateOfBirth: `${2026 - age}-01-01`, address: "Accra" },
      visit: { queueToken: token, chiefComplaint: "Test patient for pricing verification", department: opts.department, visitStatus: "active", entryPoint: "front_desk", symptomSeverity: 3, emergencyFlag: false, checkoutPin: "1234" },
      diagnosis: {},
      treatment: {},
    },
  });
  return record;
}

async function main() {
  console.log("🏥 Seeding 100 TEST- patients for KBH...\n");
  const hospital = await db.hospital.findUnique({ where: { code: HOSPITAL_CODE } });
  if (!hospital) throw new Error("KBH not found");

  const doctors = await db.doctor.findMany({ where: { hospitalId: hospital.id }, orderBy: { name: "asc" } });
  const wards = await db.ward.findMany({ where: { hospitalId: hospital.id }, orderBy: { name: "asc" } });
  if (doctors.length === 0) throw new Error("No doctors seeded — run fresh-seed first");
  if (wards.length === 0) throw new Error("No wards seeded — run fresh-seed first");

  const now = new Date();
  let book = await db.monthlyBook.findUnique({
    where: { hospitalId_year_month: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1 } },
  });
  if (!book) {
    book = await db.monthlyBook.create({
      data: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" },
    });
  }

  // Ensure every doctor has an open shift so shift auto-attach fires
  const shiftIds: Record<string, string> = {};
  for (const doc of doctors) shiftIds[doc.id] = await ensureActiveShift(hospital.id, doc.id);
  console.log(`👨‍⚕️ ${doctors.length} doctors on shift\n`);

  let idx = 0;
  const summary = { consult: 0, lab: 0, imaging: 0, drug: 0, injection: 0, ward: 0, icu: 0, maternity: 0, emergency: 0, blood: 0 };
  const billableIds: string[] = [];

  async function emit(params: Parameters<typeof createBillableItem>[0]) {
    const b = await createBillableItem(params);
    billableIds.push(b.id);
    return b;
  }

  // 15 — consultation only
  for (let i = 0; i < 15; i++) {
    idx++;
    const doctor = doctors[idx % doctors.length];
    const rec = await createTestPatient({ hospitalId: hospital.id, bookId: book.id, index: idx, department: "general" });
    await emit({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "CONSULTATION", description: "Outpatient Consultation", unitCost: 0, renderedBy: "doctor", doctorId: doctor.id });
    summary.consult++;
    process.stdout.write(".");
  }

  // 15 — consultation + lab
  for (let i = 0; i < 15; i++) {
    idx++;
    const doctor = doctors[idx % doctors.length];
    const rec = await createTestPatient({ hospitalId: hospital.id, bookId: book.id, index: idx, department: "general" });
    await emit({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "CONSULTATION", description: "Outpatient Consultation", unitCost: 0, renderedBy: "doctor", doctorId: doctor.id });
    const test = pick(LAB_TESTS);
    await emit({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "LAB", description: test, unitCost: 0, renderedBy: "lab_tech", departmentId: "lab" });
    summary.consult++; summary.lab++;
    process.stdout.write(".");
  }

  // 15 — consultation + imaging
  for (let i = 0; i < 15; i++) {
    idx++;
    const doctor = doctors[idx % doctors.length];
    const rec = await createTestPatient({ hospitalId: hospital.id, bookId: book.id, index: idx, department: "general" });
    await emit({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "CONSULTATION", description: "Outpatient Consultation", unitCost: 0, renderedBy: "doctor", doctorId: doctor.id });
    const study = pick(IMAGING_STUDIES);
    await emit({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "IMAGING", description: study, unitCost: 0, renderedBy: "radiologist", departmentId: "imaging" });
    summary.consult++; summary.imaging++;
    process.stdout.write(".");
  }

  // 10 — pharmacy (overrideUnitCost = batch sellPrice wins over pricing blob)
  for (let i = 0; i < 10; i++) {
    idx++;
    const rec = await createTestPatient({ hospitalId: hospital.id, bookId: book.id, index: idx, department: "general" });
    const drug = pick(DRUGS);
    await emit({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "DRUG", description: drug.name, unitCost: 0, quantity: 3, renderedBy: "pharmacist", departmentId: "pharmacy", overrideUnitCost: drug.batchSell });
    summary.drug++;
    process.stdout.write(".");
  }

  // 10 — injection room (default injectionFee)
  for (let i = 0; i < 10; i++) {
    idx++;
    const rec = await createTestPatient({ hospitalId: hospital.id, bookId: book.id, index: idx, department: "general" });
    // Use pricing default — no override, no service catalog match, falls to default
    await emit({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "PROCEDURE", description: "Injection Administration", unitCost: 15, renderedBy: "nurse", departmentId: "nursing" });
    summary.injection++;
    process.stdout.write(".");
  }

  // 10 — ward/IPD (3 nights each, mixed bed classes)
  for (let i = 0; i < 10; i++) {
    idx++;
    const rec = await createTestPatient({ hospitalId: hospital.id, bookId: book.id, index: idx, department: "general" });
    const ward = pick(wards);
    const bedClass = BED_CLASSES[i % BED_CLASSES.length];
    const nightly = await resolveWardNightly({ hospitalId: hospital.id, wardName: ward.name, bedClass, fallback: 120 });
    for (let n = 0; n < 3; n++) {
      await emit({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "WARD_DAY", description: `${ward.name} — ${bedClass}`, unitCost: 0, renderedBy: "ward_nurse", departmentId: "ward", overrideUnitCost: nightly });
    }
    summary.ward++;
    process.stdout.write(".");
  }

  // 10 — ICU (3 days each)
  for (let i = 0; i < 10; i++) {
    idx++;
    const rec = await createTestPatient({ hospitalId: hospital.id, bookId: book.id, index: idx, department: "general" });
    for (let n = 0; n < 3; n++) {
      await emit({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "ICU_DAY", description: "ICU Day", unitCost: 0, renderedBy: "icu_nurse", departmentId: "icu" });
    }
    summary.icu++;
    process.stdout.write(".");
  }

  // 5 — maternity (delivery PROCEDURE)
  for (let i = 0; i < 5; i++) {
    idx++;
    const doctor = doctors.find(d => d.specialty === "obstetrics") || doctors[0];
    const rec = await createTestPatient({ hospitalId: hospital.id, bookId: book.id, index: idx, department: "obstetrics" });
    await emit({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "PROCEDURE", description: "Delivery Normal", unitCost: 0, renderedBy: "midwife", doctorId: doctor.id, departmentId: "maternity" });
    summary.maternity++;
    process.stdout.write(".");
  }

  // 5 — emergency triage
  for (let i = 0; i < 5; i++) {
    idx++;
    const doctor = doctors.find(d => d.specialty === "emergency") || doctors[0];
    const rec = await createTestPatient({ hospitalId: hospital.id, bookId: book.id, index: idx, department: "emergency" });
    await emit({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "EMERGENCY", description: `Triage Level ${1 + (i % 3)}`, unitCost: 0, renderedBy: "emergency_nurse", doctorId: doctor.id, departmentId: "emergency" });
    summary.emergency++;
    process.stdout.write(".");
  }

  // 5 — blood bank transfusion
  for (let i = 0; i < 5; i++) {
    idx++;
    const rec = await createTestPatient({ hospitalId: hospital.id, bookId: book.id, index: idx, department: "general" });
    await emit({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "PROCEDURE", description: "Blood Transfusion", unitCost: 0, renderedBy: "blood_bank_officer", departmentId: "blood_bank" });
    summary.blood++;
    process.stdout.write(".");
  }

  console.log(`\n\n✅ Seeded ${idx} TEST- patients, ${billableIds.length} billables`);
  console.log(`   ${JSON.stringify(summary)}`);
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
