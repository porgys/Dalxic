/**
 * seed-kbh-yesterday-today.ts — repopulate KBH with realistic two-day activity.
 *
 * Yesterday (721 patients): mostly closed + billed, some still admitted carrying
 *   over to today, a handful LWBS / deceased / transferred.
 * Today   (630 patients): live mix — closed, with_doctor, queued, awaiting_*,
 *   fresh admissions — so every workstation has something live to work on.
 *
 * Also writes shift history (last night closed, morning/afternoon open), tops
 * up blood inventory, seeds cards + bookings, and exercises lab/imaging/pharmacy
 * orders across every state.
 *
 * Additive only. Never deletes. Older seeds remain untouched.
 *
 * Run: npx tsx scripts/seed-kbh-yesterday-today.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const HOSPITAL_CODE = "KBH";
const SEED_TAG = "kbh_yt_seed_2026_04_15";
const NAME_PREFIX = "KBH";
const CONCURRENCY = 3;
const MAX_RETRIES = 4;

const YESTERDAY_COUNT = 721;
const TODAY_COUNT = 630;

/* ─── Names & refs ─────────────────────────────────────────────── */
const FIRST_M = ["Kwame", "Kofi", "Yaw", "Kojo", "Kwesi", "Nana", "Kwabena", "Fiifi", "Ebo", "Paa", "Akwasi", "Obiri", "Kodwo", "Kweku", "Nuru", "Samuel", "Daniel", "Emmanuel"];
const FIRST_F = ["Ama", "Akosua", "Efua", "Abena", "Yaa", "Adwoa", "Akua", "Afia", "Maame", "Araba", "Esi", "Serwaa", "Dufie", "Nhyira", "Grace", "Mary", "Joyce", "Rita"];
const LAST = ["Mensah", "Asante", "Boateng", "Owusu", "Amoah", "Osei", "Adjei", "Opoku", "Darko", "Frimpong", "Gyasi", "Appiah", "Sarpong", "Tetteh", "Addo", "Acheampong", "Danquah", "Ofori", "Agyeman", "Nkrumah"];
const CITIES = ["Accra", "Tema", "Kumasi", "Cape Coast", "Takoradi", "Sunyani", "Koforidua", "Tamale", "Ho", "Wa"];

const CHIEF: Record<string, string[]> = {
  general:    ["Persistent Fever & Headache", "Abdominal Pain 3 Days", "Cough With Chest Tightness", "Joint Pain & Swelling", "Generalised Body Weakness", "Dizziness On Standing"],
  pediatrics: ["Child With High Fever", "Persistent Diarrhoea", "Ear Pain & Irritability", "Rash & Itching", "Poor Feeding", "Vomiting"],
  obstetrics: ["Routine Antenatal Visit", "Reduced Fetal Movement", "Mild PV Bleeding", "Severe Heartburn", "Back Pain At 32 Weeks", "Labour Pains"],
  surgery:    ["Hernia Assessment", "Lump Needs Excision", "Post-Op Review", "Gallbladder Symptoms", "Appendicitis Workup"],
  dental:     ["Tooth Pain Worsening", "Root Canal Review", "Gum Bleeding", "Crown Fitting", "Extraction Follow-Up"],
  eye:        ["Blurred Vision Both Eyes", "Red Eye & Discharge", "Glaucoma Check", "Cataract Assessment"],
  ent:        ["Persistent Sore Throat", "Ear Blockage", "Recurrent Nose Bleeds", "Sinus Congestion"],
  emergency:  ["RTA — Chest Pain", "Collapsed At Home", "Severe Abdominal Pain", "Asthma Attack", "Suspected Stroke", "Gunshot Wound"],
};

const LAB_TESTS = [
  { name: "Full Blood Count",     cat: "haematology" },
  { name: "Malaria Parasite",     cat: "microbiology_serology" },
  { name: "Random Blood Sugar",   cat: "biochemistry" },
  { name: "Urinalysis",           cat: "urine_stool" },
  { name: "Widal Test",           cat: "microbiology_serology" },
  { name: "Lipid Profile",        cat: "biochemistry" },
  { name: "Liver Function Test",  cat: "biochemistry" },
  { name: "Kidney Function Test", cat: "biochemistry" },
];
const IMAGING = ["Chest X-Ray", "Abdominal Ultrasound", "CT Head", "CT Abdomen", "MRI Lumbar Spine", "Pelvic Ultrasound"];
const DRUGS = [
  { name: "Paracetamol 500mg", sell: 3 },
  { name: "Amoxicillin 500mg", sell: 6 },
  { name: "Artemether-Lumefantrine", sell: 20 },
  { name: "Metformin 500mg", sell: 4 },
  { name: "Amlodipine 5mg", sell: 5 },
  { name: "Omeprazole 20mg", sell: 7 },
  { name: "Cetirizine 10mg", sell: 3 },
  { name: "ORS Sachet", sell: 2 },
];
const NURSE_SUPPLIES = [
  { name: "Adhesive Plaster", cost: 2 },
  { name: "Sterile Gauze Dressing", cost: 5 },
  { name: "IV Cannula + Line", cost: 18 },
  { name: "Antiseptic Ointment", cost: 8 },
  { name: "Alcohol Wipes Pack", cost: 4 },
];
const PROCEDURES = ["Wound Dressing", "Suturing Minor", "IV Fluids", "Blood Transfusion", "Nebulisation"];
const BED_CLASSES = ["General", "Semi-Private", "Private", "ICU", "VIP"];
const INSURANCE_PROVIDERS = ["NHIS", "Acacia Health", "Star Assurance", "Glico Health", "Metropolitan Health"];
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const BLOOD_COMPONENTS = ["whole_blood", "packed_rbc", "platelets", "ffp"];

/* ─── Helpers ──────────────────────────────────────────────────── */
function pick<T>(a: T[] | readonly T[]): T { return a[Math.floor(Math.random() * a.length)] as T; }
function pickN<T>(a: T[], n: number): T[] { return [...a].sort(() => Math.random() - 0.5).slice(0, n); }
function rnd(min: number, max: number): number { return Math.floor(min + Math.random() * (max - min + 1)); }
function chance(p: number): boolean { return Math.random() < p; }
function cardSuffix(): string {
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let s = "KY";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `DH-${s}`;
}

/** Yesterday morning 7am through yesterday 11pm, spread across 721 slots. */
function yesterdayStamp(slot: number, total: number): Date {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(7, 0, 0, 0);
  const windowMs = 16 * 60 * 60 * 1000; // 7am → 11pm
  return new Date(start.getTime() + (slot / total) * windowMs + rnd(0, 60 * 60 * 1000));
}

/** Today 6am through now, spread across slots. */
function todayStamp(slot: number, total: number): Date {
  const start = new Date();
  start.setHours(6, 0, 0, 0);
  const nowMs = Date.now();
  const windowMs = Math.max(60 * 60 * 1000, nowMs - start.getTime());
  return new Date(start.getTime() + (slot / total) * windowMs - rnd(0, 10 * 60 * 1000));
}

function minutesBefore(d: Date, m: number): Date { return new Date(d.getTime() - m * 60 * 1000); }

async function retry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      const msg = String((e as Error)?.message || e);
      const retriable = /Connection terminated|ECONNRESET|ETIMEDOUT|socket hang up|fetch failed|Engine is not yet connected/i.test(msg);
      if (!retriable || attempt === MAX_RETRIES) throw e;
      const backoff = 500 * Math.pow(2, attempt - 1);
      console.warn(`\n  ⚠ ${label} attempt ${attempt} failed (${msg.slice(0, 80)}) — retrying in ${backoff}ms`);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

async function runInBatches<T>(items: T[], worker: (item: T, idx: number) => Promise<void>) {
  let cursor = 0;
  async function pumpWorker() {
    while (true) {
      const my = cursor++;
      if (my >= items.length) return;
      await retry(`slot ${my}`, () => worker(items[my], my));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }).map(() => pumpWorker()));
}

/* ─── Visit shape builder ──────────────────────────────────────── */
type Cohort = "yesterday" | "today";
type PatientPlan = {
  cohort: Cohort;
  seq: number;
  dept: string;
  flow: string;
  visitStatus: string;
  closeOut: boolean;
  admission?: "ward" | "icu" | "maternity" | "emergency";
  // terminal markers for yesterday only
  terminal?: "lwbs" | "deceased" | "transferred";
  createdAt: Date;
  billPayStatus?: "PAID" | "PART_PAID" | "ISSUED" | "WAIVED";
  paymentMethod?: string | null;
};

/* ─── Resolve prices once, cache in-memory ─────────────────────── */
const priceCache: Record<string, number> = {};
async function priceFor(hospitalId: string, serviceType: string, description: string, fallback: number): Promise<number> {
  const key = `${serviceType}::${description}`;
  if (priceCache[key] != null) return priceCache[key];
  const sp = await db.servicePrice.findFirst({ where: { hospitalId, serviceType, name: description, isActive: true } });
  const v = sp?.unitCost ?? fallback;
  priceCache[key] = v;
  return v;
}

/* ─── Commission snapshot — pull from doctor.commissionRate cache ─ */
const commissionCache: Record<string, number> = {};
async function commissionPctFor(doctorId: string): Promise<number> {
  if (commissionCache[doctorId] != null) return commissionCache[doctorId];
  const doc = await db.doctor.findUnique({ where: { id: doctorId } });
  const v = (doc?.commissionRate ?? 0);
  commissionCache[doctorId] = v;
  return v;
}

/* ─── Bill number sequencer (in-script) ────────────────────────── */
let billCounter = 0;
async function initBillCounter(hospitalId: string) {
  const year = new Date().getFullYear();
  billCounter = await db.bill.count({ where: { hospitalId, billNumber: { startsWith: `BILL-${HOSPITAL_CODE}-${year}` } } });
}
function nextBillNumber(): string {
  billCounter++;
  return `BILL-${HOSPITAL_CODE}-${new Date().getFullYear()}-${String(billCounter).padStart(3, "0")}`;
}

/* ─── Main ─────────────────────────────────────────────────────── */
async function main() {
  console.log("🏥 KBH yesterday + today seed (721 + 630)\n");
  const hospital = await db.hospital.findUnique({ where: { code: HOSPITAL_CODE } });
  if (!hospital) throw new Error("KBH not found");
  const doctors = await db.doctor.findMany({ where: { hospitalId: hospital.id }, orderBy: { name: "asc" } });
  const wards = await db.ward.findMany({ where: { hospitalId: hospital.id }, orderBy: { name: "asc" } });
  if (doctors.length === 0 || wards.length === 0) throw new Error("Run fresh-seed first — no doctors/wards");

  const now = new Date();
  let book = await db.monthlyBook.findUnique({
    where: { hospitalId_year_month: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1 } },
  });
  if (!book) {
    book = await db.monthlyBook.create({
      data: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" },
    });
  }

  await initBillCounter(hospital.id);
  console.log(`📕 Month book #${book.id} — bills so far ${billCounter}`);

  /* ─── Shift rotation history (idempotent) ──────────────────── */
  const existingSeedShifts = await db.doctorShift.count({ where: { hospitalId: hospital.id, notes: { in: ["Morning rotation — closed", "Night rotation — closed"] } } });
  if (existingSeedShifts >= doctors.length * 2) {
    console.log("⏰ Shift history already present — skipping");
  } else {
  console.log("⏰ Writing shift history (yesterday night → today morning)...");
  for (const d of doctors) {
    // Close any lingering open shift
    const open = await db.doctorShift.findFirst({ where: { hospitalId: hospital.id, doctorId: d.id, clockOutAt: null } });
    if (open) {
      await db.doctorShift.update({ where: { id: open.id }, data: { clockOutAt: minutesBefore(now, rnd(60 * 10, 60 * 20)) } });
    }
    // Yesterday morning shift (closed)
    const yMorning = yesterdayStamp(0, 1);
    yMorning.setHours(7, 0, 0, 0);
    await db.doctorShift.create({
      data: {
        hospitalId: hospital.id, doctorId: d.id, shiftType: "morning",
        clockInAt: yMorning,
        clockOutAt: new Date(yMorning.getTime() + 8 * 60 * 60 * 1000),
        grossRevenue: rnd(800, 3200), patientCount: rnd(8, 26),
        notes: "Morning rotation — closed",
      },
    });
    // Yesterday night shift (closed)
    const yNight = new Date(yMorning.getTime() + 15 * 60 * 60 * 1000);
    await db.doctorShift.create({
      data: {
        hospitalId: hospital.id, doctorId: d.id, shiftType: "night",
        clockInAt: yNight,
        clockOutAt: new Date(yNight.getTime() + 8 * 60 * 60 * 1000),
        grossRevenue: rnd(400, 1800), patientCount: rnd(4, 14),
        notes: "Night rotation — closed",
      },
    });
    // Today's open shift
    await db.doctorShift.create({
      data: {
        hospitalId: hospital.id, doctorId: d.id,
        shiftType: now.getHours() < 14 ? "morning" : "afternoon",
        clockInAt: minutesBefore(now, rnd(60, 300)),
      },
    });
  }
  }

  /* ─── Build cohort plans ───────────────────────────────────── */
  const plans: PatientPlan[] = [];

  // Yesterday 721: distribution
  //  ~540 closed + paid OPD mix (general/peds/ob/surgery/dental/eye/ent)
  //  ~80 still admitted (carry over → ward/icu/maternity)
  //  ~45 ISSUED unpaid
  //  ~20 WAIVED
  //  ~20 transferred
  //  ~12 LWBS
  //  ~4  deceased
  const yDepts = [
    { dept: "general", n: 230 }, { dept: "pediatrics", n: 95 }, { dept: "obstetrics", n: 70 },
    { dept: "surgery", n: 55 }, { dept: "dental", n: 25 }, { dept: "eye", n: 15 },
    { dept: "ent", n: 20 }, { dept: "emergency", n: 30 },
  ];
  let ySeq = 0;
  const totalClosedY = yDepts.reduce((s, d) => s + d.n, 0); // 540
  for (const g of yDepts) {
    for (let i = 0; i < g.n; i++) {
      ySeq++;
      const r = Math.random();
      let billPay: PatientPlan["billPayStatus"] = "PAID";
      let method: string | null = "CASH";
      if (r < 0.28) { billPay = chance(0.35) ? "PART_PAID" : "PAID"; method = pick(["NHIS", "INSURANCE"]); }
      else if (r < 0.62) { billPay = "PAID"; method = "CASH"; }
      else if (r < 0.82) { billPay = "PAID"; method = "MOBILE_MONEY"; }
      else if (r < 0.93) { billPay = "ISSUED"; method = null; }
      else { billPay = "WAIVED"; method = "WAIVED"; }

      plans.push({
        cohort: "yesterday", seq: ySeq, dept: g.dept, flow: `closed_${g.dept}`,
        visitStatus: "closed", closeOut: true,
        createdAt: yesterdayStamp(ySeq, YESTERDAY_COUNT),
        billPayStatus: billPay, paymentMethod: method,
      });
    }
  }
  // Admitted-carry-over (80)
  for (let i = 0; i < 80; i++) {
    ySeq++;
    const adm: PatientPlan["admission"] = i < 50 ? "ward" : i < 68 ? "icu" : "maternity";
    plans.push({
      cohort: "yesterday", seq: ySeq, dept: adm === "maternity" ? "obstetrics" : "general",
      flow: `${adm}_carry`, visitStatus: "admitted", closeOut: false, admission: adm,
      createdAt: yesterdayStamp(ySeq, YESTERDAY_COUNT),
    });
  }
  // Transferred (20)
  for (let i = 0; i < 20; i++) {
    ySeq++;
    plans.push({
      cohort: "yesterday", seq: ySeq, dept: pick(["general", "surgery", "emergency"]),
      flow: "transferred", visitStatus: "closed", closeOut: true, terminal: "transferred",
      createdAt: yesterdayStamp(ySeq, YESTERDAY_COUNT),
      billPayStatus: "PAID", paymentMethod: pick(["CASH", "INSURANCE"]),
    });
  }
  // LWBS (12)
  for (let i = 0; i < 12; i++) {
    ySeq++;
    plans.push({
      cohort: "yesterday", seq: ySeq, dept: "general", flow: "lwbs",
      visitStatus: "lwbs", closeOut: false, terminal: "lwbs",
      createdAt: yesterdayStamp(ySeq, YESTERDAY_COUNT),
    });
  }
  // Deceased (4)
  for (let i = 0; i < 4; i++) {
    ySeq++;
    plans.push({
      cohort: "yesterday", seq: ySeq, dept: pick(["emergency", "general"]), flow: "deceased",
      visitStatus: "deceased", closeOut: true, terminal: "deceased", admission: "emergency",
      createdAt: yesterdayStamp(ySeq, YESTERDAY_COUNT),
      billPayStatus: "WAIVED", paymentMethod: "WAIVED",
    });
  }
  // Final slack to hit 721
  while (ySeq < YESTERDAY_COUNT) {
    ySeq++;
    plans.push({
      cohort: "yesterday", seq: ySeq, dept: "general", flow: "closed_general",
      visitStatus: "closed", closeOut: true, createdAt: yesterdayStamp(ySeq, YESTERDAY_COUNT),
      billPayStatus: "PAID", paymentMethod: "CASH",
    });
  }
  void totalClosedY;

  // Today 630: live mix
  type TodayPlan = { dept: string; flow: string; visitStatus: string; closeOut: boolean; admission?: PatientPlan["admission"]; count: number };
  const todayMix: TodayPlan[] = [
    // Live queue
    { dept: "general", flow: "opd_queue", visitStatus: "queued", closeOut: false, count: 32 },
    { dept: "general", flow: "opd_with_doctor", visitStatus: "with_doctor", closeOut: false, count: 28 },
    { dept: "pediatrics", flow: "peds_with_doctor", visitStatus: "with_doctor", closeOut: false, count: 14 },
    { dept: "obstetrics", flow: "ob_with_doctor", visitStatus: "with_doctor", closeOut: false, count: 8 },
    // Awaiting workstations
    { dept: "general", flow: "awaiting_lab", visitStatus: "paused_for_lab", closeOut: false, count: 28 },
    { dept: "general", flow: "awaiting_imaging", visitStatus: "paused_for_imaging", closeOut: false, count: 22 },
    { dept: "general", flow: "awaiting_pharmacy", visitStatus: "paused_for_pharmacy", closeOut: false, count: 30 },
    { dept: "general", flow: "injection_pending", visitStatus: "paused_for_procedure", closeOut: false, count: 16 },
    { dept: "general", flow: "awaiting_close", visitStatus: "awaiting_close", closeOut: false, count: 14 },
    // Billing pending (assembled, not paid)
    { dept: "general", flow: "billing_pending", visitStatus: "awaiting_close", closeOut: false, count: 18 },
    // Fresh admissions today
    { dept: "general", flow: "ward_new", visitStatus: "admitted", closeOut: false, admission: "ward", count: 24 },
    { dept: "general", flow: "icu_new", visitStatus: "admitted", closeOut: false, admission: "icu", count: 8 },
    { dept: "obstetrics", flow: "maternity_labour", visitStatus: "admitted", closeOut: false, admission: "maternity", count: 10 },
    { dept: "emergency", flow: "er_active", visitStatus: "admitted", closeOut: false, admission: "emergency", count: 12 },
    // Closed already today
    { dept: "general", flow: "closed_opd", visitStatus: "closed", closeOut: true, count: 150 },
    { dept: "general", flow: "closed_opd_lab", visitStatus: "closed", closeOut: true, count: 70 },
    { dept: "general", flow: "closed_opd_imaging", visitStatus: "closed", closeOut: true, count: 40 },
    { dept: "pediatrics", flow: "closed_peds", visitStatus: "closed", closeOut: true, count: 35 },
    { dept: "surgery", flow: "closed_surgery", visitStatus: "closed", closeOut: true, count: 18 },
    { dept: "obstetrics", flow: "closed_ob_anc", visitStatus: "closed", closeOut: true, count: 22 },
    { dept: "emergency", flow: "closed_emergency", visitStatus: "closed", closeOut: true, count: 16 },
    { dept: "dental", flow: "closed_dental", visitStatus: "closed", closeOut: true, count: 10 },
    { dept: "eye", flow: "closed_eye", visitStatus: "closed", closeOut: true, count: 4 },
    { dept: "ent", flow: "closed_ent", visitStatus: "closed", closeOut: true, count: 4 },
  ];
  let tSeq = 0;
  for (const t of todayMix) {
    for (let i = 0; i < t.count; i++) {
      tSeq++;
      let billPay: PatientPlan["billPayStatus"] | undefined;
      let method: string | null | undefined;
      if (t.closeOut) {
        const r = Math.random();
        if (r < 0.28) { billPay = chance(0.35) ? "PART_PAID" : "PAID"; method = pick(["NHIS", "INSURANCE"]); }
        else if (r < 0.65) { billPay = "PAID"; method = "CASH"; }
        else if (r < 0.85) { billPay = "PAID"; method = "MOBILE_MONEY"; }
        else if (r < 0.93) { billPay = "ISSUED"; method = null; }
        else { billPay = "WAIVED"; method = "WAIVED"; }
      }
      plans.push({
        cohort: "today", seq: tSeq, dept: t.dept, flow: t.flow,
        visitStatus: t.visitStatus, closeOut: t.closeOut, admission: t.admission,
        createdAt: todayStamp(tSeq, TODAY_COUNT),
        billPayStatus: billPay, paymentMethod: method,
      });
    }
  }
  // Slack to hit 630
  while (tSeq < TODAY_COUNT) {
    tSeq++;
    plans.push({
      cohort: "today", seq: tSeq, dept: "general", flow: "closed_opd",
      visitStatus: "closed", closeOut: true, createdAt: todayStamp(tSeq, TODAY_COUNT),
      billPayStatus: "PAID", paymentMethod: "CASH",
    });
  }

  /* ─── Reorder: today's live first so the board fills up immediately ── */
  plans.sort((a, b) => {
    const aLive = a.cohort === "today" && !a.closeOut;
    const bLive = b.cohort === "today" && !b.closeOut;
    if (aLive !== bLive) return aLive ? -1 : 1;
    const aToday = a.cohort === "today";
    const bToday = b.cohort === "today";
    if (aToday !== bToday) return aToday ? -1 : 1;
    return 0;
  });

  console.log(`📋 Planned: ${plans.length} patients (${YESTERDAY_COUNT} yesterday + ${TODAY_COUNT} today) — today live first`);

  /* ─── Resume support disabled: today-live cohort must always run ── */
  const alreadySeeded = await db.patientRecord.count({ where: { hospitalId: hospital.id, createdBy: SEED_TAG } });
  if (alreadySeeded > 0) {
    console.log(`ℹ  ${alreadySeeded} patients already seeded under this tag from a prior run — ignoring; new records will append (no dedupe)`);
  }

  /* ─── Summary ──────────────────────────────────────────────── */
  const summary = {
    records: 0, yesterday: 0, today: 0,
    closed: 0, admitted: 0, queued: 0, withDoctor: 0, pausedLab: 0, pausedImg: 0, pausedRx: 0,
    lwbs: 0, deceased: 0, transferred: 0,
    labOrders: 0, imagingOrders: 0, billables: 0, bills: 0, gross: 0,
  };

  /* ─── Worker ──────────────────────────────────────────────── */
  let doctorIdx = 0;
  const pickDoctor = (dept: string) => {
    doctorIdx++;
    return dept === "pediatrics" ? (doctors.find(d => d.specialty === "pediatrics") ?? doctors[doctorIdx % doctors.length])
         : dept === "obstetrics" ? (doctors.find(d => d.specialty === "obstetrics") ?? doctors[doctorIdx % doctors.length])
         : dept === "surgery"    ? (doctors.find(d => d.specialty === "surgery")    ?? doctors[doctorIdx % doctors.length])
         : dept === "emergency"  ? (doctors.find(d => d.specialty === "emergency")  ?? doctors[doctorIdx % doctors.length])
         : doctors[doctorIdx % doctors.length];
  };

  let processed = 0;
  let failures = 0;
  await runInBatches(plans, async (plan) => {
    try {
      await seedPatient(hospital.id, book.id, plan, pickDoctor(plan.dept), wards, summary);
    } catch (e) {
      failures++;
      console.warn(`\n  ✖ slot ${plan.cohort}-${plan.seq} gave up: ${(e as Error).message?.slice(0, 80)}`);
    }
    processed++;
    if (processed % 50 === 0) process.stdout.write(`·${processed} `);
  });
  if (failures > 0) console.log(`\n  ⚠ ${failures} patient slots failed after retries`);

  /* ─── Blood bank top-up ───────────────────────────────────── */
  console.log("\n🩸 Topping up blood bank...");
  for (const bt of BLOOD_TYPES) {
    for (const comp of BLOOD_COMPONENTS) {
      const existing = await db.bloodInventory.findFirst({ where: { hospitalId: hospital.id, bloodType: bt, component: comp } });
      const desiredMin = comp === "whole_blood" ? 14 : comp === "packed_rbc" ? 10 : 6;
      if (!existing) {
        await db.bloodInventory.create({ data: { hospitalId: hospital.id, bloodType: bt, component: comp, units: rnd(desiredMin, desiredMin * 3) } });
      } else if (existing.units < desiredMin) {
        await db.bloodInventory.update({ where: { id: existing.id }, data: { units: existing.units + rnd(desiredMin, desiredMin * 2) } });
      }
    }
  }

  /* ─── Cards + bookings ────────────────────────────────────── */
  console.log("💳 Seeding 120 patient cards + 80 bookings...");
  const cardNames: { cardNumber: string; patientName: string; phone: string }[] = [];
  for (let i = 0; i < 120; i++) {
    const female = chance(0.55);
    const fullName = `${pick(female ? FIRST_F : FIRST_M)} ${pick(LAST)}`;
    const cardNumber = cardSuffix();
    const phone = `055${String(3000000 + i).padStart(7, "0")}`;
    try {
      await db.patientCard.create({
        data: {
          cardNumber, hospitalId: hospital.id, patientName: fullName, phone,
          gender: female ? "Female" : "Male",
          dateOfBirth: `${2026 - rnd(18, 80)}-${String(rnd(1, 12)).padStart(2, "0")}-${String(rnd(1, 28)).padStart(2, "0")}`,
          bloodType: pick(BLOOD_TYPES),
          insuranceProvider: chance(0.4) ? pick(INSURANCE_PROVIDERS) : null,
          insuranceId: chance(0.4) ? `NHIS-${rnd(100000, 999999)}` : null,
          emergencyContact: `${pick(FIRST_M)} ${pick(LAST)}`,
          emergencyContactPhone: `020${String(4000000 + i).padStart(7, "0")}`,
        },
      });
      cardNames.push({ cardNumber, patientName: fullName, phone });
    } catch { /* duplicate cardNumber — skip */ }
  }
  const STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"];
  for (let i = 0; i < 80; i++) {
    if (cardNames.length === 0) break;
    const src = pick(cardNames);
    const offsetDays = rnd(-7, 14);
    const scheduled = new Date(); scheduled.setDate(scheduled.getDate() + offsetDays); scheduled.setHours(rnd(8, 16), rnd(0, 3) * 15, 0, 0);
    const doctor = doctors[i % doctors.length];
    const fee = chance(0.5) ? rnd(30, 120) : 0;
    const status = offsetDays < 0 ? pick(["COMPLETED", "CANCELLED", "NO_SHOW"])
                  : offsetDays === 0 ? pick(["CONFIRMED", "CHECKED_IN", "PENDING"])
                  : pick(STATUSES);
    await db.booking.create({
      data: {
        hospitalId: hospital.id, patientId: src.cardNumber,
        patientName: src.patientName, patientPhone: src.phone,
        doctorId: doctor.id, departmentKey: pick(["consultation", "lab", "imaging", "procedure"]),
        scheduledAt: scheduled, durationMins: pick([15, 30, 45, 60]),
        status, fee, feePaid: fee > 0 && status === "COMPLETED",
        notes: chance(0.3) ? pick(["Routine review", "Follow-up prescription", "Result discussion", "New complaint"]) : null,
        createdBy: SEED_TAG,
      },
    });
  }

  /* ─── Summary ──────────────────────────────────────────────── */
  console.log("\n\n✅ KBH yesterday + today seed complete");
  console.log(`   Patients:       ${summary.records}  (yesterday=${summary.yesterday}, today=${summary.today})`);
  console.log(`   Visit states:   closed=${summary.closed}, admitted=${summary.admitted}, queued=${summary.queued}, with_doctor=${summary.withDoctor}`);
  console.log(`                   paused_lab=${summary.pausedLab}, paused_imaging=${summary.pausedImg}, paused_pharmacy=${summary.pausedRx}`);
  console.log(`                   lwbs=${summary.lwbs}, deceased=${summary.deceased}, transferred=${summary.transferred}`);
  console.log(`   Orders:         lab=${summary.labOrders}, imaging=${summary.imagingOrders}`);
  console.log(`   Billing:        billables=${summary.billables}, bills=${summary.bills}, gross=₵${summary.gross.toFixed(2)}`);

  await db.$disconnect();
}

/* ─── Seed one patient ─────────────────────────────────────────── */
async function seedPatient(
  hospitalId: string,
  bookId: string,
  plan: PatientPlan,
  doctor: { id: string; name: string; specialty: string },
  wards: { id: string; name: string; type: string }[],
  summary: Record<string, number>,
) {
  const female = plan.dept === "obstetrics" || Math.random() > 0.5;
  const first = pick(female ? FIRST_F : FIRST_M);
  const last = pick(LAST);
  const cohortTag = plan.cohort === "yesterday" ? "Y" : "T";
  const fullName = `${NAME_PREFIX}-${cohortTag}${String(plan.seq).padStart(3, "0")}-${first} ${last}`;
  const age = plan.dept === "pediatrics" ? rnd(1, 14) : plan.dept === "obstetrics" ? rnd(18, 42) : rnd(18, 80);
  const hasIns = chance(0.4);
  const provider = hasIns ? pick(INSURANCE_PROVIDERS) : null;
  const chiefComplaint = pick(CHIEF[plan.dept] ?? CHIEF.general);
  const token = `${cohortTag}${String(plan.seq).padStart(3, "0")}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visit: any = {
    queueToken: token,
    chiefComplaint,
    department: plan.dept,
    visitStatus: plan.visitStatus,
    entryPoint: plan.dept === "emergency" ? "emergency_admission" : "front_desk",
    symptomSeverity: plan.dept === "emergency" ? rnd(8, 10) : rnd(2, 7),
    emergencyFlag: plan.dept === "emergency",
    checkoutPin: String(rnd(1000, 9999)),
    assignedDoctorId: doctor.id,
    assignedDoctorName: doctor.name,
    arrivedAt: plan.createdAt.toISOString(),
  };

  if (plan.admission === "ward") {
    const w = pick(wards);
    visit.admission = {
      admitted: true,
      admittedAt: plan.createdAt.toISOString(),
      admittedBy: "nurse_ward",
      wardName: w.name,
      bedLabel: `B${rnd(1, 24)}`,
      admissionReason: chiefComplaint,
      assignedDoctor: doctor.id,
      assignedDoctorName: doctor.name,
      visitingHours: "10:00–12:00, 16:00–19:00",
      dailyRounds: [
        { id: `r-${plan.seq}-1`, date: plan.createdAt.toISOString(), notes: "Admitted. Plan: observe + IV fluids.", recordedBy: "nurse_ward", vitals: `BP 120/80, HR ${rnd(60, 96)}` },
        { id: `r-${plan.seq}-2`, date: new Date().toISOString(), notes: "Stable. Plan reviewed.", recordedBy: "nurse_ward", vitals: `BP 118/76, HR ${rnd(60, 96)}` },
      ],
    };
  }
  if (plan.admission === "icu") {
    visit.icuAdmission = {
      admitted: true,
      admittedAt: plan.createdAt.toISOString(),
      admittedBy: "icu_nurse",
      bedLabel: `ICU-${rnd(1, 10)}`,
      diagnosis: pick(["Septic Shock", "Post-Op Monitoring", "Severe Pneumonia", "Head Injury Observation", "Cardiac Event"]),
      ventilator: chance(0.5),
      ventilatorMode: chance(0.5) ? pick(["AC/VC", "SIMV", "CPAP"]) : undefined,
      hourlyObs: Array.from({ length: rnd(6, 14) }).map((_, h) => ({
        id: `h-${plan.seq}-${h}`,
        timestamp: minutesBefore(new Date(), (14 - h) * 60).toISOString(),
        hr: rnd(70, 130), bp: `${rnd(90, 150)}/${rnd(55, 95)}`, spo2: rnd(88, 99),
        temp: 36 + Math.random() * 2, rr: rnd(12, 28), fio2: rnd(21, 60),
        gcs: rnd(8, 15), urine: rnd(40, 120), recordedBy: "icu_nurse",
      })),
    };
  }
  if (plan.admission === "maternity") {
    const stage = plan.flow.includes("labour") ? "labour" : plan.flow.includes("antenatal") ? "antenatal" : "postnatal";
    visit.maternity = {
      stage,
      edd: new Date(Date.now() + rnd(30, 120) * 86400000).toISOString().slice(0, 10),
      gravida: rnd(1, 5), para: rnd(0, 4), gestationalWeeks: rnd(22, 40),
      admittedAt: plan.createdAt.toISOString(),
      admittedBy: "midwife",
      deliveredAt: stage !== "antenatal" ? new Date(plan.createdAt.getTime() + rnd(60, 600) * 60000).toISOString() : undefined,
      deliveryMode: stage !== "antenatal" ? pick(["SVD", "C-Section", "Assisted Delivery"]) : undefined,
      babyWeight: stage !== "antenatal" ? Math.round((2.4 + Math.random() * 1.8) * 100) / 100 : undefined,
      babyGender: stage !== "antenatal" ? pick(["male", "female"]) : undefined,
      apgarScores: stage !== "antenatal" ? `${rnd(7, 9)}/${rnd(8, 10)}` : undefined,
      visits: [{ id: `v-${plan.seq}-1`, date: plan.createdAt.toISOString(), type: "antenatal", notes: "Routine ANC review.", recordedBy: "midwife" }],
    };
  }
  if (plan.admission === "emergency") {
    visit.emergencyAdmission = {
      triageLevel: rnd(1, 3),
      arrivedAt: plan.createdAt.toISOString(),
      mode: pick(["ambulance", "walk_in", "referral"]),
      primarySurvey: "ABCs intact, secondary survey in progress.",
    };
  }
  if (plan.terminal === "lwbs") {
    visit.lwbsAt = new Date(plan.createdAt.getTime() + rnd(30, 240) * 60000).toISOString();
    visit.lwbsReason = pick(["Wait too long", "Left to eat", "Changed mind", "Taxi arrived"]);
  }
  if (plan.terminal === "deceased") {
    visit.deceasedAt = new Date(plan.createdAt.getTime() + rnd(60, 600) * 60000).toISOString();
    visit.causeOfDeath = pick(["Septic shock", "Cardiac arrest", "Severe head injury", "Respiratory failure"]);
  }
  if (plan.terminal === "transferred") {
    visit.transferredAt = new Date(plan.createdAt.getTime() + rnd(60, 360) * 60000).toISOString();
    visit.transferredTo = pick(["Ridge Hospital", "Korle Bu Teaching Hospital", "37 Military Hospital"]);
    visit.transferReason = pick(["Specialist care required", "ICU bed unavailable", "Advanced imaging needed"]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const diagnosis: any = plan.closeOut ? {
    primary: pick(["Malaria", "Upper Respiratory Infection", "Gastritis", "Hypertension", "Type 2 Diabetes", "Pharyngitis", "Urinary Tract Infection", "Anaemia"]),
    icd10: pick(["B54", "J06.9", "K29.7", "I10", "E11.9"]),
    notes: "Managed per protocol. Discharged stable.",
    recordedBy: doctor.id,
  } : {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const treatment: any = { seedTag: SEED_TAG };

  // Pharmacy prescriptions embedded on awaiting_pharmacy + closeOut pharmacy
  if (plan.flow === "awaiting_pharmacy" || (plan.closeOut && chance(0.7))) {
    treatment.prescriptions = pickN(DRUGS, rnd(1, 3)).map((d, n) => ({
      id: `rx-${plan.cohort}-${plan.seq}-${n}`,
      medication: d.name,
      dosage: pick(["500mg TDS x5", "250mg BD x7", "One tablet nocte x14", "5ml TDS x5"]),
      quantity: rnd(5, 30),
      status: plan.closeOut ? "dispensed" : "pending",
      orderedBy: doctor.id,
    }));
  }

  // Imaging embedded
  if (plan.flow === "awaiting_imaging" || plan.flow === "closed_opd_imaging" || (plan.closeOut && chance(0.25))) {
    treatment.imagingOrders = pickN(IMAGING, rnd(1, 2)).map((study, n) => ({
      id: `img-${plan.cohort}-${plan.seq}-${n}`,
      study,
      status: plan.closeOut ? "completed" : pick(["pending", "in_progress", "awaiting_report"]),
      orderedBy: doctor.id,
      orderedAt: plan.createdAt.toISOString(),
      findings: plan.closeOut ? pick(["No acute pathology", "Consistent with clinical suspicion", "Incidental finding — see report"]) : undefined,
      reportedBy: plan.closeOut ? "radiologist" : undefined,
      reportedAt: plan.closeOut ? new Date(plan.createdAt.getTime() + 40 * 60000).toISOString() : undefined,
    }));
    summary.imagingOrders += treatment.imagingOrders.length;
  }

  // ─── Insert patient record ─────────────────────────────────
  const rec = await db.patientRecord.create({
    data: {
      bookId, hospitalId,
      entryPoint: plan.dept === "emergency" ? "emergency_admission" : "manual",
      createdBy: SEED_TAG,
      createdAt: plan.createdAt,
      patient: {
        fullName,
        phone: `024${String(5000000 + plan.seq).padStart(7, "0")}`,
        gender: female ? "Female" : "Male",
        age,
        dateOfBirth: `${new Date().getFullYear() - age}-${String(rnd(1, 12)).padStart(2, "0")}-${String(rnd(1, 28)).padStart(2, "0")}`,
        address: pick(CITIES),
        insuranceProvider: provider,
        insuranceId: hasIns ? `${provider!.substring(0, 3).toUpperCase()}-${rnd(100000, 999999)}` : null,
      },
      visit,
      diagnosis,
      treatment,
    },
  });

  summary.records++;
  if (plan.cohort === "yesterday") summary.yesterday++; else summary.today++;
  if (plan.visitStatus === "closed") summary.closed++;
  else if (plan.visitStatus === "admitted") summary.admitted++;
  else if (plan.visitStatus === "queued") summary.queued++;
  else if (plan.visitStatus === "with_doctor") summary.withDoctor++;
  else if (plan.visitStatus === "paused_for_lab") summary.pausedLab++;
  else if (plan.visitStatus === "paused_for_imaging") summary.pausedImg++;
  else if (plan.visitStatus === "paused_for_pharmacy") summary.pausedRx++;
  if (plan.terminal === "lwbs") summary.lwbs++;
  if (plan.terminal === "deceased") summary.deceased++;
  if (plan.terminal === "transferred") summary.transferred++;

  if (plan.terminal === "lwbs") return; // LWBS: no billing

  // ─── Lab order row (separate table) ─────────────────────────
  const wantsLab = plan.flow === "awaiting_lab" || plan.flow === "closed_opd_lab" || (plan.closeOut && chance(0.3));
  if (wantsLab) {
    const tests = pickN(LAB_TESTS, rnd(1, 4));
    const labStatus = plan.flow === "awaiting_lab" ? pick(["pending", "in_progress"]) : "complete";
    const labOrder = await db.labOrder.create({
      data: {
        patientId: rec.id, hospitalId, bookId,
        orderedBy: doctor.id,
        tests: tests.map(t => ({ testName: t.name, category: t.cat })),
        status: labStatus,
        labToken: `LAB-${HOSPITAL_CODE}-${plan.cohort[0]}${String(plan.seq).padStart(4, "0")}`,
        clinicalNotes: chiefComplaint,
      },
    });
    summary.labOrders++;

    if (labStatus === "complete") {
      for (const t of tests) {
        await db.labResult.create({
          data: {
            labOrderId: labOrder.id, patientId: rec.id, testName: t.name,
            resultValue: t.name === "Malaria Parasite" ? pick(["Negative", "Positive +"])
                       : t.name === "Random Blood Sugar" ? `${rnd(70, 220)} mg/dL`
                       : t.name === "Widal Test" ? pick(["Reactive", "Non-Reactive"])
                       : `${rnd(4, 18)}.${rnd(0, 9)}`,
            unit: t.name === "Random Blood Sugar" ? "mg/dL" : undefined,
            referenceRange: t.name === "Random Blood Sugar" ? "70–140" : undefined,
            flag: pick(["normal", "normal", "normal", "high", "low"]),
            enteredBy: "lab_tech",
          },
        });
      }
    }
  }

  // ─── Build billable items ───────────────────────────────────
  const items: Array<{ serviceType: string; description: string; unitCost: number; qty?: number; overrideUnit?: number; renderedBy: string; doctorId?: string; departmentId?: string }> = [];

  // Consultation (almost all seen patients)
  if (plan.visitStatus !== "queued" && plan.visitStatus !== "lwbs") {
    items.push({ serviceType: "CONSULTATION", description: "Outpatient Consultation", unitCost: 50, renderedBy: "doctor", doctorId: doctor.id });
  }

  // Nurse supplies — ~60%
  if (chance(0.6)) {
    for (const s of pickN(NURSE_SUPPLIES, rnd(1, 3))) {
      items.push({ serviceType: "DRUG", description: s.name, unitCost: s.cost, overrideUnit: s.cost, renderedBy: "nurse", departmentId: "nursing" });
    }
  }

  // Injection — ~30%
  if (chance(0.3) && plan.visitStatus !== "queued" && plan.visitStatus !== "lwbs") {
    items.push({ serviceType: "PROCEDURE", description: "Injection Administration", unitCost: 15, renderedBy: "nurse", departmentId: "nursing" });
  }

  // Lab billables if completed
  if (wantsLab && (plan.closeOut || plan.flow === "closed_opd_lab")) {
    for (const t of pickN(LAB_TESTS, rnd(1, 3))) {
      items.push({ serviceType: "LAB", description: t.name, unitCost: 30, renderedBy: "lab_tech", departmentId: "lab" });
    }
  }

  // Imaging billables
  if (plan.flow === "closed_opd_imaging" || (plan.closeOut && chance(0.25))) {
    items.push({ serviceType: "IMAGING", description: pick(IMAGING), unitCost: 120, renderedBy: "radiologist", departmentId: "imaging" });
  }

  // Emergency
  if (plan.dept === "emergency") {
    items.push({ serviceType: "EMERGENCY", description: `Triage Level ${rnd(1, 3)}`, unitCost: 80, renderedBy: "emergency_nurse", doctorId: doctor.id, departmentId: "emergency" });
  }

  // Surgery
  if (plan.flow === "closed_surgery") {
    items.push({ serviceType: "PROCEDURE", description: pick(PROCEDURES), unitCost: 350, renderedBy: "surgeon", doctorId: doctor.id, departmentId: "theatre" });
  }

  // Pharmacy — ~65% on closed or awaiting_pharmacy
  if ((plan.closeOut || plan.flow === "awaiting_pharmacy") && chance(0.65)) {
    for (const d of pickN(DRUGS, rnd(1, 3))) {
      items.push({ serviceType: "DRUG", description: d.name, unitCost: d.sell, overrideUnit: d.sell, qty: rnd(1, 4), renderedBy: "pharmacist", departmentId: "pharmacy" });
    }
  }

  // Ward days — count full days for carry-over (yesterday → today = 1-2)
  if (plan.admission === "ward") {
    const w = pick(wards);
    const bedClass = BED_CLASSES[plan.seq % BED_CLASSES.length];
    const nights = plan.cohort === "yesterday" ? rnd(1, 2) : 1;
    for (let n = 0; n < nights; n++) {
      items.push({ serviceType: "WARD_DAY", description: `${w.name} — ${bedClass}`, unitCost: 120, overrideUnit: 120, renderedBy: "ward_nurse", departmentId: "ward" });
    }
  }
  if (plan.admission === "icu") {
    const days = plan.cohort === "yesterday" ? rnd(1, 2) : 1;
    for (let n = 0; n < days; n++) {
      items.push({ serviceType: "ICU_DAY", description: "ICU Day", unitCost: 400, overrideUnit: 400, renderedBy: "icu_nurse", departmentId: "icu" });
    }
  }
  if (plan.admission === "maternity") {
    items.push({ serviceType: "PROCEDURE", description: plan.flow.includes("labour") ? "Delivery Normal" : "Antenatal Review", unitCost: 200, renderedBy: "midwife", doctorId: doctor.id, departmentId: "maternity" });
  }

  if (items.length === 0) return;

  // ─── Insert billable items with correct renderedAt ──────────
  const baseTime = plan.createdAt;
  const createdRows: { id: string; totalCost: number }[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const qty = item.qty ?? 1;
    const unit = item.overrideUnit ?? (await priceFor(hospitalId, item.serviceType, item.description, item.unitCost));
    const total = unit * qty;
    const doctorId = item.doctorId ?? null;
    let commissionPct: number | null = null;
    let staffCutCost: number | null = null;
    if (doctorId) {
      const pct = await commissionPctFor(doctorId);
      if (pct > 0) {
        commissionPct = pct;
        staffCutCost = Math.round((total * pct) / 100 * 100) / 100;
      }
    }
    const row = await db.billableItem.create({
      data: {
        hospitalId, patientId: rec.id, bookId,
        serviceType: item.serviceType, description: item.description,
        unitCost: unit, quantity: qty, totalCost: total,
        renderedBy: item.renderedBy, doctorId,
        departmentId: item.departmentId ?? null,
        renderedAt: new Date(baseTime.getTime() + i * 5 * 60 * 1000),
        commissionPct, staffCutCost,
      },
    });
    createdRows.push({ id: row.id, totalCost: total });
  }
  summary.billables += createdRows.length;

  // ─── Assemble bill if closeOut or billing_pending ───────────
  if (plan.closeOut || plan.flow === "billing_pending") {
    const subtotal = createdRows.reduce((s, r) => s + r.totalCost, 0);
    if (subtotal > 0) {
      const billNumber = nextBillNumber();
      const billStatus = plan.closeOut ? (plan.billPayStatus ?? "PAID") : "ISSUED";
      const issuedAt = baseTime;
      const paidAt = billStatus === "PAID" || billStatus === "PART_PAID" || billStatus === "WAIVED"
        ? new Date(baseTime.getTime() + 20 * 60 * 1000) : null;
      const bill = await db.bill.create({
        data: {
          hospitalId, patientId: rec.id, bookId, billNumber,
          subtotal, discount: 0, total: subtotal,
          status: billStatus, paymentMethod: plan.paymentMethod ?? null,
          issuedAt, paidAt, createdBy: SEED_TAG,
          createdAt: baseTime,
        },
      });
      await db.billableItem.updateMany({
        where: { id: { in: createdRows.map(r => r.id) } },
        data: { isBilled: true, billId: bill.id },
      });
      summary.bills++;
      summary.gross += subtotal;
    }
  }
}

main().catch((e) => { console.error("\n❌ Seed failed:", e); process.exit(1); });
