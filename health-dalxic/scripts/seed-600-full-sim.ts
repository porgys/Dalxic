/**
 * Full hospital simulation — 600 TEST- patients with complete journeys.
 *
 * Every patient is closed out:
 *   - visit marked "closed"
 *   - admissions discharged
 *   - bill assembled via assembleBill()
 *   - payment resolved: CASH / MOBILE_MONEY / INSURANCE / NHIS / WAIVED
 *
 * Billing components exercised:
 *   - Consultation (every patient)
 *   - Nurse supplies (plasters, dressings, IV lines, ointments — ~half)
 *   - Injections (default injectionFee)
 *   - Pharmacy drugs with batch sellPrice override (~2/3)
 *   - Lab, Imaging, Procedure, Ward days, ICU days, Emergency triage, Blood transfusion
 *   - ~28% INSURANCE claims (NHIS + private), ~55% CASH / MOMO, ~10% ISSUED, ~7% WAIVED
 *
 * Run: npx tsx scripts/seed-600-full-sim.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { createBillableItem, resolveWardNightly, assembleBill } from "../src/lib/billing";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const HOSPITAL_CODE = "KBH";
const SEED_TAG = "pricing_sync_test";

const FIRST_M = ["Kwame", "Kofi", "Yaw", "Kojo", "Kwesi", "Nana", "Kwabena", "Fiifi", "Ebo", "Paa", "Akwasi", "Obiri"];
const FIRST_F = ["Ama", "Akosua", "Efua", "Abena", "Yaa", "Adwoa", "Akua", "Afia", "Maame", "Araba", "Esi", "Serwaa"];
const LAST = ["Mensah", "Asante", "Boateng", "Owusu", "Amoah", "Osei", "Adjei", "Opoku", "Darko", "Frimpong", "Gyasi", "Appiah", "Sarpong", "Tetteh", "Addo"];

const LAB_TESTS = ["Full Blood Count", "Malaria Parasite", "Random Blood Sugar", "Urinalysis", "Widal Test"];
const IMAGING = ["Chest X-Ray", "Abdominal Ultrasound", "CT Head", "CT Abdomen"];
const DRUGS = [
  { name: "Paracetamol 500mg", sell: 3 },
  { name: "Amoxicillin 500mg", sell: 6 },
  { name: "Artemether-Lumefantrine", sell: 20 },
  { name: "Metformin 500mg", sell: 4 },
  { name: "Amlodipine 5mg", sell: 5 },
  { name: "Omeprazole 20mg", sell: 7 },
];
const NURSE_SUPPLIES = [
  { name: "Adhesive Plaster", cost: 2 },
  { name: "Sterile Gauze Dressing", cost: 5 },
  { name: "IV Cannula + Line", cost: 18 },
  { name: "Antiseptic Ointment", cost: 8 },
  { name: "Cotton Swabs Pack", cost: 3 },
  { name: "Alcohol Wipes Pack", cost: 4 },
];
const PROCEDURES = ["Wound Dressing", "Suturing Minor", "IV Fluids", "Blood Transfusion"];
const BED_CLASSES = ["General", "Semi-Private", "Private", "ICU", "VIP"];

const INSURANCE_PROVIDERS = ["NHIS", "Acacia Health", "Star Assurance", "Glico Health", "Metropolitan Health"];

function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
function pickN<T>(a: T[], n: number): T[] { return [...a].sort(() => Math.random() - 0.5).slice(0, n); }
function rnd(min: number, max: number): number { return Math.floor(min + Math.random() * (max - min + 1)); }
function chance(p: number): boolean { return Math.random() < p; }

type Flow = "opd" | "opd_lab" | "opd_imaging" | "pediatric" | "obstetric_anc" | "surgery" | "dental" | "eye" | "ent" | "ward" | "icu" | "maternity_delivery" | "emergency" | "blood_bank";

const DISTRIBUTION: { flow: Flow; dept: string; count: number }[] = [
  { flow: "opd",                 dept: "general",     count: 100 },
  { flow: "opd_lab",             dept: "general",     count: 80 },
  { flow: "opd_imaging",         dept: "general",     count: 70 },
  { flow: "pediatric",           dept: "pediatrics",  count: 60 },
  { flow: "obstetric_anc",       dept: "obstetrics",  count: 50 },
  { flow: "surgery",             dept: "surgery",     count: 40 },
  { flow: "dental",              dept: "dental",      count: 30 },
  { flow: "eye",                 dept: "eye",         count: 20 },
  { flow: "ent",                 dept: "ent",         count: 20 },
  { flow: "ward",                dept: "general",     count: 50 },
  { flow: "icu",                 dept: "general",     count: 30 },
  { flow: "maternity_delivery",  dept: "obstetrics",  count: 20 },
  { flow: "emergency",           dept: "emergency",   count: 15 },
  { flow: "blood_bank",          dept: "general",     count: 15 },
];

async function ensureShift(hospitalId: string, doctorId: string) {
  const existing = await db.doctorShift.findFirst({ where: { hospitalId, doctorId, clockOutAt: null } });
  if (existing) return existing.id;
  return (await db.doctorShift.create({ data: { hospitalId, doctorId, shiftType: "morning", clockInAt: new Date() } })).id;
}

function resolvePayment(): { status: string; method: string | null } {
  const r = Math.random();
  if (r < 0.28) return { status: chance(0.35) ? "PART_PAID" : "PAID", method: pick(["NHIS", "INSURANCE"]) };
  if (r < 0.65) return { status: "PAID", method: "CASH" };
  if (r < 0.83) return { status: "PAID", method: "MOBILE_MONEY" };
  if (r < 0.93) return { status: "ISSUED", method: null };
  return { status: "WAIVED", method: "WAIVED" };
}

async function main() {
  console.log("🏥 Full hospital simulation — 600 TEST- patients for KBH\n");
  const hospital = await db.hospital.findUnique({ where: { code: HOSPITAL_CODE } });
  if (!hospital) throw new Error("KBH not found");

  const doctors = await db.doctor.findMany({ where: { hospitalId: hospital.id }, orderBy: { name: "asc" } });
  const wards = await db.ward.findMany({ where: { hospitalId: hospital.id }, orderBy: { name: "asc" } });
  if (doctors.length === 0 || wards.length === 0) throw new Error("Missing doctors/wards — run fresh-seed");

  for (const d of doctors) await ensureShift(hospital.id, d.id);
  console.log(`👨‍⚕️ ${doctors.length} doctors on shift, ${wards.length} wards available\n`);

  const now = new Date();
  let book = await db.monthlyBook.findUnique({
    where: { hospitalId_year_month: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1 } },
  });
  if (!book) book = await db.monthlyBook.create({ data: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" } });

  const summary = {
    total: 0,
    billables: 0,
    bills: 0,
    paid: 0, partPaid: 0, issued: 0, waived: 0,
    cash: 0, momo: 0, insurance: 0, nhis: 0,
    grossRevenue: 0, totalStaffCut: 0,
  };

  let idx = 0;
  for (const { flow, dept, count } of DISTRIBUTION) {
    for (let i = 0; i < count; i++) {
      idx++;
      const female = flow === "maternity_delivery" || flow === "obstetric_anc" || Math.random() > 0.5;
      const fullName = `TEST-${String(idx).padStart(3, "0")}-${pick(female ? FIRST_F : FIRST_M)} ${pick(LAST)}`;
      const age = flow === "pediatric" ? rnd(1, 14) : flow === "obstetric_anc" || flow === "maternity_delivery" ? rnd(18, 42) : rnd(18, 80);
      const hasInsurance = chance(0.35);
      const insuranceProvider = hasInsurance ? pick(INSURANCE_PROVIDERS) : null;
      const token = `TST-${String(idx).padStart(3, "0")}`;
      const doctor = flow === "obstetric_anc" || flow === "maternity_delivery" ? doctors.find(d => d.specialty === "obstetrics") ?? doctors[idx % doctors.length]
                   : flow === "pediatric" ? doctors.find(d => d.specialty === "pediatrics") ?? doctors[idx % doctors.length]
                   : flow === "emergency" ? doctors.find(d => d.specialty === "emergency") ?? doctors[idx % doctors.length]
                   : flow === "surgery" ? doctors.find(d => d.specialty === "surgery") ?? doctors[idx % doctors.length]
                   : doctors[idx % doctors.length];

      const rec = await db.patientRecord.create({
        data: {
          bookId: book.id,
          hospitalId: hospital.id,
          entryPoint: "manual",
          createdBy: SEED_TAG,
          patient: { fullName, phone: `024${String(1000000 + idx).padStart(7, "0")}`, gender: female ? "Female" : "Male", age, dateOfBirth: `${2026 - age}-01-01`, address: pick(["Accra", "Tema", "Kumasi", "Cape Coast"]), insuranceProvider, insuranceId: hasInsurance ? `${insuranceProvider!.substring(0, 3).toUpperCase()}-${rnd(100000, 999999)}` : null },
          visit: { queueToken: token, chiefComplaint: `${flow} presentation`, department: dept, visitStatus: "closed", entryPoint: "front_desk", symptomSeverity: flow === "emergency" ? rnd(8, 10) : rnd(2, 6), emergencyFlag: flow === "emergency", checkoutPin: "1234" },
          diagnosis: {},
          treatment: {},
        },
      });

      // ── Consultation (almost all patients) ──
      if (flow !== "blood_bank" && flow !== "ward" && flow !== "icu") {
        await createBillableItem({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "CONSULTATION", description: "Outpatient Consultation", unitCost: 0, renderedBy: "doctor", doctorId: doctor.id });
        summary.billables++;
      }

      // ── Nurse supplies (plaster/ointment/etc.) — ~60% of patients ──
      if (chance(0.6)) {
        const supplies = pickN(NURSE_SUPPLIES, rnd(1, 3));
        for (const s of supplies) {
          await createBillableItem({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "DRUG", description: s.name, unitCost: 0, renderedBy: "nurse", departmentId: "nursing", overrideUnitCost: s.cost });
          summary.billables++;
        }
      }

      // ── Injection — ~30% ──
      if (chance(0.3)) {
        await createBillableItem({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "PROCEDURE", description: "Injection Administration", unitCost: 15, renderedBy: "nurse", departmentId: "nursing" });
        summary.billables++;
      }

      // ── Flow-specific billables ──
      if (flow === "opd_lab" || chance(0.25)) {
        const tests = pickN(LAB_TESTS, rnd(1, 3));
        for (const t of tests) {
          await createBillableItem({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "LAB", description: t, unitCost: 0, renderedBy: "lab_tech", departmentId: "lab" });
          summary.billables++;
        }
      }
      if (flow === "opd_imaging" || flow === "surgery" && chance(0.6)) {
        const study = pick(IMAGING);
        await createBillableItem({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "IMAGING", description: study, unitCost: 0, renderedBy: "radiologist", departmentId: "imaging" });
        summary.billables++;
      }
      if (flow === "emergency") {
        await createBillableItem({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "EMERGENCY", description: `Triage Level ${rnd(1, 3)}`, unitCost: 0, renderedBy: "emergency_nurse", doctorId: doctor.id, departmentId: "emergency" });
        summary.billables++;
      }
      if (flow === "surgery") {
        await createBillableItem({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "PROCEDURE", description: pick(PROCEDURES), unitCost: 0, renderedBy: "surgeon", doctorId: doctor.id, departmentId: "theatre" });
        summary.billables++;
      }
      if (flow === "maternity_delivery") {
        await createBillableItem({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "PROCEDURE", description: "Delivery Normal", unitCost: 0, renderedBy: "midwife", doctorId: doctor.id, departmentId: "maternity" });
        summary.billables++;
      }
      if (flow === "blood_bank") {
        await createBillableItem({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "PROCEDURE", description: "Blood Transfusion", unitCost: 0, renderedBy: "blood_bank_officer", departmentId: "blood_bank" });
        summary.billables++;
      }

      // ── Ward admission — 3-5 nights closed out ──
      if (flow === "ward" || (flow === "surgery" && chance(0.5)) || (flow === "maternity_delivery" && chance(0.8))) {
        const ward = flow === "maternity_delivery" ? wards.find(w => w.type === "maternity") ?? wards[0] : pick(wards);
        const bedClass = BED_CLASSES[idx % BED_CLASSES.length];
        const nightly = await resolveWardNightly({ hospitalId: hospital.id, wardName: ward.name, bedClass, fallback: 120 });
        const nights = rnd(3, 5);
        for (let n = 0; n < nights; n++) {
          await createBillableItem({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "WARD_DAY", description: `${ward.name} — ${bedClass}`, unitCost: 0, renderedBy: "ward_nurse", departmentId: "ward", overrideUnitCost: nightly });
          summary.billables++;
        }
      }

      // ── ICU — 3-5 days closed out ──
      if (flow === "icu") {
        const days = rnd(3, 5);
        for (let n = 0; n < days; n++) {
          await createBillableItem({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "ICU_DAY", description: "ICU Day", unitCost: 0, renderedBy: "icu_nurse", departmentId: "icu" });
          summary.billables++;
        }
      }

      // ── Pharmacy — ~65% get meds dispensed (batch sellPrice override) ──
      if (chance(0.65)) {
        const rxs = pickN(DRUGS, rnd(1, 3));
        for (const d of rxs) {
          await createBillableItem({ hospitalId: hospital.id, patientId: rec.id, bookId: book.id, serviceType: "DRUG", description: d.name, unitCost: 0, quantity: rnd(1, 4), renderedBy: "pharmacist", departmentId: "pharmacy", overrideUnitCost: d.sell });
          summary.billables++;
        }
      }

      // ── Assemble bill ──
      const pay = resolvePayment();
      const bill = await assembleBill({
        hospitalId: hospital.id,
        hospitalCode: HOSPITAL_CODE,
        patientId: rec.id,
        bookId: book.id,
        createdBy: SEED_TAG,
      });
      if (bill) {
        summary.bills++;
        summary.grossRevenue += bill.total;
        const updates: Record<string, unknown> = { status: pay.status, paymentMethod: pay.method, issuedAt: new Date() };
        if (pay.status === "PAID" || pay.status === "PART_PAID" || pay.status === "WAIVED") updates.paidAt = new Date();
        await db.bill.update({ where: { id: bill.id }, data: updates });

        if (pay.status === "PAID") summary.paid++;
        else if (pay.status === "PART_PAID") summary.partPaid++;
        else if (pay.status === "ISSUED") summary.issued++;
        else if (pay.status === "WAIVED") summary.waived++;

        if (pay.method === "CASH") summary.cash++;
        else if (pay.method === "MOBILE_MONEY") summary.momo++;
        else if (pay.method === "INSURANCE") summary.insurance++;
        else if (pay.method === "NHIS") summary.nhis++;
      }

      summary.total++;
      if (idx % 25 === 0) process.stdout.write(`·${idx} `);
    }
  }

  // ── Aggregate commission snapshot ──
  const allBillables = await db.billableItem.findMany({
    where: { patientId: { in: (await db.patientRecord.findMany({ where: { hospitalId: hospital.id, createdBy: SEED_TAG }, select: { id: true } })).map(r => r.id) } },
    select: { staffCutCost: true },
  });
  summary.totalStaffCut = allBillables.reduce((s, b) => s + (b.staffCutCost ?? 0), 0);

  console.log(`\n\n✅ Seeded ${summary.total} TEST- patients`);
  console.log(`   Billables emitted: ${summary.billables}`);
  console.log(`   Bills assembled:   ${summary.bills}`);
  console.log(`   Gross revenue:     ₵${summary.grossRevenue.toFixed(2)}`);
  console.log(`   Doctor payouts:    ₵${summary.totalStaffCut.toFixed(2)}`);
  console.log(`   Payment mix:       PAID=${summary.paid} PART_PAID=${summary.partPaid} ISSUED=${summary.issued} WAIVED=${summary.waived}`);
  console.log(`   Methods:           CASH=${summary.cash} MOMO=${summary.momo} INSURANCE=${summary.insurance} NHIS=${summary.nhis}`);

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
