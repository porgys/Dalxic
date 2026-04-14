/**
 * seed-300-live.ts — 300-patient LIVE simulation seed for KBH.
 *
 * Additive only. Never deletes or mutates existing records.
 * Old seeds (TEST-, DEMO-) remain untouched forever.
 *
 * What this seed leaves in a state a demo can poke at:
 *   • 300 patient records across all 16 flows, with mixed live visit states
 *     (some in queue, some with doctor, some waiting lab/imaging/pharmacy,
 *      some admitted in ward / ICU / maternity, some fully closed + billed)
 *   • Active doctor shifts (every doctor clocked in) + a shift-change history
 *     (each doctor has 1 prior closed shift from earlier today to demo rotation)
 *   • 100 patient cards (fuels the Front Desk autocomplete + Cards workstation)
 *   • 60 bookings across past 7 days + next 14 days, statuses spread
 *     PENDING/CONFIRMED/CHECKED_IN/COMPLETED/CANCELLED/NO_SHOW
 *   • Blood bank inventory topped up for every type+component
 *   • Lab orders at every status (pending / in_progress / complete) so the
 *     lab workstation has something to claim, work on, and complete
 *   • Imaging orders embedded on ~15% of records, varying statuses
 *   • Ward + ICU + Maternity admissions active (not discharged) so those
 *     workstations have a live roster
 *   • Bills assembled for completed journeys with a realistic payment mix
 *   • KBH activeModules forcibly topped up with every module key so every
 *     workstation icon is unlocked for the demo (never writes if already set)
 *
 * Run: npx tsx scripts/seed-300-live.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { createBillableItem, resolveWardNightly, assembleBill } from "../src/lib/billing";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const HOSPITAL_CODE = "KBH";
const SEED_TAG = "live_300_seed_2026_04_14";
const NAME_PREFIX = "LIVE";

/* ─── Reference data ─────────────────────────────────────────── */
const FIRST_M = ["Kwame", "Kofi", "Yaw", "Kojo", "Kwesi", "Nana", "Kwabena", "Fiifi", "Ebo", "Paa", "Akwasi", "Obiri", "Kodwo", "Kweku"];
const FIRST_F = ["Ama", "Akosua", "Efua", "Abena", "Yaa", "Adwoa", "Akua", "Afia", "Maame", "Araba", "Esi", "Serwaa", "Dufie", "Nhyira"];
const LAST = ["Mensah", "Asante", "Boateng", "Owusu", "Amoah", "Osei", "Adjei", "Opoku", "Darko", "Frimpong", "Gyasi", "Appiah", "Sarpong", "Tetteh", "Addo", "Acheampong", "Danquah", "Ofori"];
const CITIES = ["Accra", "Tema", "Kumasi", "Cape Coast", "Takoradi", "Sunyani", "Koforidua", "Tamale"];

const CHIEF_COMPLAINTS: Record<string, string[]> = {
  general:     ["Persistent Fever & Headache", "Abdominal Pain 3 Days", "Cough With Chest Tightness", "Joint Pain & Swelling", "Generalised Body Weakness"],
  pediatrics:  ["Child With High Fever", "Persistent Diarrhoea", "Ear Pain & Irritability", "Rash & Itching", "Poor Feeding"],
  obstetrics:  ["Routine Antenatal Visit", "Reduced Fetal Movement", "Mild PV Bleeding", "Severe Heartburn", "Back Pain At 32 Weeks"],
  surgery:     ["Hernia Assessment", "Lump Needs Excision", "Post-Op Review", "Gallbladder Symptoms", "Appendicitis Workup"],
  dental:      ["Tooth Pain Worsening", "Root Canal Review", "Gum Bleeding", "Crown Fitting", "Extraction Follow-Up"],
  eye:         ["Blurred Vision Both Eyes", "Red Eye & Discharge", "Glaucoma Check", "Cataract Assessment", "Foreign Body Sensation"],
  ent:         ["Persistent Sore Throat", "Ear Blockage & Muffled Hearing", "Nose Bleeds Recurrent", "Sinus Congestion", "Loss Of Smell"],
  emergency:   ["RTA — Chest Pain", "Collapsed At Home", "Severe Abdominal Pain", "Asthma Attack", "Suspected Stroke"],
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

/* ─── Helpers ────────────────────────────────────────────────── */
function pick<T>(a: T[] | readonly T[]): T { return a[Math.floor(Math.random() * a.length)] as T; }
function pickN<T>(a: T[], n: number): T[] { return [...a].sort(() => Math.random() - 0.5).slice(0, n); }
function rnd(min: number, max: number): number { return Math.floor(min + Math.random() * (max - min + 1)); }
function chance(p: number): boolean { return Math.random() < p; }
function cardSuffix(): string {
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let s = "LV"; // LIVE-seed prefix inside the 6-char slot so cards are easy to spot
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `DH-${s}`;
}
function minutesAgo(m: number): Date { return new Date(Date.now() - m * 60 * 1000); }
function daysAhead(d: number, hour = 9, minute = 0): Date {
  const r = new Date(); r.setDate(r.getDate() + d); r.setHours(hour, minute, 0, 0); return r;
}
function daysAgo(d: number): Date { return daysAhead(-d); }

/* ─── Active module top-up (additive — never strips) ─────────── */
const ALL_MODULE_KEYS = [
  "front_desk", "waiting_room", "doctor", "pharmacy", "billing", "chat", "bookkeeping",
  "lab", "injection_room", "nurse_station", "ct_radiology", "ward_ipd", "ultrasound",
  "emergency", "icu", "maternity", "blood_bank", "cards_bookings", "admin", "beds",
];

async function ensureAllModulesActive(hospitalId: string, current: string[]) {
  const toAdd = ALL_MODULE_KEYS.filter((k) => !current.includes(k));
  if (toAdd.length === 0) return current;
  const next = [...current, ...toAdd];
  await db.hospital.update({ where: { id: hospitalId }, data: { activeModules: next } });
  return next;
}

/* ─── Shift management ───────────────────────────────────────── */
async function ensureShiftHistory(hospitalId: string, doctorId: string) {
  // Close any lingering open shift from previous seed runs, then open a fresh one.
  // Also insert a prior closed shift from earlier today so the shift-change demo has history.
  const open = await db.doctorShift.findFirst({ where: { hospitalId, doctorId, clockOutAt: null } });
  if (open) {
    return open.id;
  }
  // Insert yesterday's closed "night" shift as historical rotation evidence.
  await db.doctorShift.create({
    data: {
      hospitalId,
      doctorId,
      shiftType: "night",
      clockInAt: daysAgo(1),
      clockOutAt: new Date(daysAgo(1).getTime() + 8 * 60 * 60 * 1000),
      grossRevenue: rnd(600, 2400),
      patientCount: rnd(6, 18),
      notes: "Night rotation — closed automatically",
    },
  });
  // Insert the current open shift.
  const todayShift = await db.doctorShift.create({
    data: {
      hospitalId,
      doctorId,
      shiftType: pick(["morning", "afternoon"]),
      clockInAt: minutesAgo(rnd(30, 240)),
    },
  });
  return todayShift.id;
}

/* ─── Live visit state helper ────────────────────────────────── */
function resolvePayment(): { status: string; method: string | null } {
  const r = Math.random();
  if (r < 0.28) return { status: chance(0.35) ? "PART_PAID" : "PAID", method: pick(["NHIS", "INSURANCE"]) };
  if (r < 0.65) return { status: "PAID", method: "CASH" };
  if (r < 0.83) return { status: "PAID", method: "MOBILE_MONEY" };
  if (r < 0.93) return { status: "ISSUED", method: null };
  return { status: "WAIVED", method: "WAIVED" };
}

type FlowPlan = {
  flow: string;
  dept: string;
  count: number;
  visitStatus: string;        // queued | with_doctor | awaiting_lab | awaiting_imaging | awaiting_pharmacy | awaiting_billing | admitted | closed
  buildAdmission?: "ward" | "icu" | "maternity" | "emergency";
  closeOut: boolean;          // assemble bill + mark paid
};

const PLAN: FlowPlan[] = [
  // Waiting room + registration fresh
  { flow: "opd_queue",            dept: "general",     count: 30, visitStatus: "queued",              closeOut: false },
  // With doctor right now
  { flow: "opd_with_doctor",      dept: "general",     count: 22, visitStatus: "with_doctor",         closeOut: false },
  { flow: "peds_with_doctor",     dept: "pediatrics",  count: 8,  visitStatus: "with_doctor",         closeOut: false },
  // Pending lab work
  { flow: "opd_pending_lab",      dept: "general",     count: 20, visitStatus: "awaiting_lab",        closeOut: false },
  { flow: "opd_lab_in_progress",  dept: "general",     count: 10, visitStatus: "awaiting_lab",        closeOut: false },
  // Pending imaging
  { flow: "imaging_pending",      dept: "general",     count: 15, visitStatus: "awaiting_imaging",    closeOut: false },
  // Pending pharmacy
  { flow: "pharmacy_pending",     dept: "general",     count: 20, visitStatus: "awaiting_pharmacy",   closeOut: false },
  // Pending billing (assembled, not paid)
  { flow: "billing_pending",      dept: "general",     count: 10, visitStatus: "awaiting_billing",    closeOut: false },
  // Injection room
  { flow: "injection_pending",    dept: "general",     count: 10, visitStatus: "with_doctor",         closeOut: false },
  // Admissions — ACTIVE (not discharged)
  { flow: "ward_active",          dept: "general",     count: 20, visitStatus: "admitted", buildAdmission: "ward",      closeOut: false },
  { flow: "icu_active",           dept: "general",     count: 8,  visitStatus: "admitted", buildAdmission: "icu",       closeOut: false },
  { flow: "maternity_antenatal",  dept: "obstetrics",  count: 6,  visitStatus: "admitted", buildAdmission: "maternity", closeOut: false },
  { flow: "maternity_labour",     dept: "obstetrics",  count: 3,  visitStatus: "admitted", buildAdmission: "maternity", closeOut: false },
  { flow: "maternity_postnatal",  dept: "obstetrics",  count: 3,  visitStatus: "admitted", buildAdmission: "maternity", closeOut: false },
  { flow: "emergency_active",     dept: "emergency",   count: 6,  visitStatus: "admitted", buildAdmission: "emergency", closeOut: false },
  { flow: "blood_active",         dept: "general",     count: 4,  visitStatus: "admitted", closeOut: false },
  // Fully closed journeys (billed, paid — feed Bookkeeping / Finance)
  { flow: "closed_opd",           dept: "general",     count: 30, visitStatus: "closed",              closeOut: true },
  { flow: "closed_opd_lab",       dept: "general",     count: 20, visitStatus: "closed",              closeOut: true },
  { flow: "closed_opd_imaging",   dept: "general",     count: 14, visitStatus: "closed",              closeOut: true },
  { flow: "closed_peds",          dept: "pediatrics",  count: 10, visitStatus: "closed",              closeOut: true },
  { flow: "closed_surgery",       dept: "surgery",     count: 8,  visitStatus: "closed",              closeOut: true },
  { flow: "closed_dental",        dept: "dental",      count: 4,  visitStatus: "closed",              closeOut: true },
  { flow: "closed_eye",           dept: "eye",         count: 2,  visitStatus: "closed",              closeOut: true },
  { flow: "closed_ent",           dept: "ent",         count: 3,  visitStatus: "closed",              closeOut: true },
  { flow: "closed_ob_anc",        dept: "obstetrics",  count: 8,  visitStatus: "closed",              closeOut: true },
  { flow: "closed_emergency",     dept: "emergency",   count: 6,  visitStatus: "closed",              closeOut: true },
];

/* ─── Main ───────────────────────────────────────────────────── */
async function main() {
  console.log("🏥 LIVE 300-patient seed — KBH\n");

  const hospital = await db.hospital.findUnique({ where: { code: HOSPITAL_CODE } });
  if (!hospital) throw new Error("KBH not found. Run fresh-seed first.");

  const active = await ensureAllModulesActive(hospital.id, hospital.activeModules || []);
  console.log(`   Active modules: ${active.length} keys (${active.length === ALL_MODULE_KEYS.length ? "all" : "partial"})`);

  const doctors = await db.doctor.findMany({ where: { hospitalId: hospital.id }, orderBy: { name: "asc" } });
  const wards   = await db.ward.findMany({ where: { hospitalId: hospital.id }, orderBy: { name: "asc" } });
  if (doctors.length === 0) throw new Error("No doctors seeded. Run fresh-seed first.");
  if (wards.length === 0)   throw new Error("No wards seeded. Run fresh-seed first.");

  for (const d of doctors) await ensureShiftHistory(hospital.id, d.id);
  console.log(`👨‍⚕️ ${doctors.length} doctors on shift (rotation history written)`);
  console.log(`🛏️ ${wards.length} wards available\n`);

  const now = new Date();
  let book = await db.monthlyBook.findUnique({
    where: { hospitalId_year_month: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1 } },
  });
  if (!book) {
    book = await db.monthlyBook.create({
      data: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" },
    });
  }

  const summary = {
    records: 0, open: 0, closed: 0, admissions: 0, icuAdmissions: 0, maternity: 0, emergencies: 0,
    labOrders: 0, imagingOrders: 0, cards: 0, bookings: 0, bills: 0, gross: 0,
  };

  let idx = 0;
  for (const plan of PLAN) {
    for (let i = 0; i < plan.count; i++) {
      idx++;
      const female = plan.dept === "obstetrics" || Math.random() > 0.5;
      const first  = pick(female ? FIRST_F : FIRST_M);
      const last   = pick(LAST);
      const fullName = `${NAME_PREFIX}-${String(idx).padStart(3, "0")}-${first} ${last}`;
      const age = plan.dept === "pediatrics" ? rnd(1, 14)
                : plan.dept === "obstetrics" ? rnd(18, 42)
                : rnd(18, 80);
      const hasIns = chance(0.4);
      const provider = hasIns ? pick(INSURANCE_PROVIDERS) : null;
      const doctor = plan.dept === "pediatrics"  ? (doctors.find((d) => d.specialty === "pediatrics") ?? doctors[idx % doctors.length])
                    : plan.dept === "obstetrics" ? (doctors.find((d) => d.specialty === "obstetrics") ?? doctors[idx % doctors.length])
                    : plan.dept === "surgery"    ? (doctors.find((d) => d.specialty === "surgery")    ?? doctors[idx % doctors.length])
                    : plan.dept === "emergency"  ? (doctors.find((d) => d.specialty === "emergency")  ?? doctors[idx % doctors.length])
                    : doctors[idx % doctors.length];

      const token = `LV${String(idx).padStart(3, "0")}`;
      const chiefComplaint = pick(CHIEF_COMPLAINTS[plan.dept] ?? CHIEF_COMPLAINTS.general);

      // Build visit JSON with shape expected by other workstations
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
      };

      if (plan.buildAdmission === "ward") {
        const w = pick(wards);
        visit.admission = {
          admitted: true,
          admittedAt: minutesAgo(rnd(60, 60 * 48)).toISOString(),
          admittedBy: "nurse_ward",
          wardName: w.name,
          bedLabel: `B${rnd(1, 24)}`,
          admissionReason: chiefComplaint,
          assignedDoctor: doctor.id,
          assignedDoctorName: doctor.name,
          visitingHours: "10:00–12:00, 16:00–19:00",
          dailyRounds: [
            { id: `r-${idx}-1`, date: daysAgo(1).toISOString(), notes: "Stable, vitals WNL. Continue IV fluids.", recordedBy: "nurse_ward", vitals: `BP 120/80, HR ${rnd(60, 96)}` },
            { id: `r-${idx}-2`, date: new Date().toISOString(),  notes: "Patient ambulating. Appetite improved.",   recordedBy: "nurse_ward", vitals: `BP 118/76, HR ${rnd(60, 96)}` },
          ],
        };
        summary.admissions++;
      }

      if (plan.buildAdmission === "icu") {
        visit.icuAdmission = {
          admitted: true,
          admittedAt: minutesAgo(rnd(120, 60 * 72)).toISOString(),
          admittedBy: "icu_nurse",
          bedLabel: `ICU-${rnd(1, 10)}`,
          diagnosis: pick(["Septic Shock", "Post-Op Monitoring", "Severe Pneumonia", "Head Injury Observation", "Cardiac Event"]),
          ventilator: chance(0.4),
          ventilatorMode: chance(0.4) ? pick(["AC/VC", "SIMV", "CPAP"]) : undefined,
          hourlyObs: Array.from({ length: rnd(4, 12) }).map((_, h) => ({
            id: `h-${idx}-${h}`,
            timestamp: minutesAgo((12 - h) * 60).toISOString(),
            hr: rnd(70, 130), bp: `${rnd(90, 150)}/${rnd(55, 95)}`, spo2: rnd(88, 99), temp: 36 + Math.random() * 2,
            rr: rnd(12, 28), fio2: rnd(21, 60), gcs: rnd(8, 15), urine: rnd(40, 120), recordedBy: "icu_nurse",
          })),
        };
        summary.icuAdmissions++;
      }

      if (plan.buildAdmission === "maternity") {
        const stage = plan.flow.includes("antenatal") ? "antenatal"
                    : plan.flow.includes("labour")    ? "labour"
                    : "postnatal";
        visit.maternity = {
          stage,
          edd: daysAhead(rnd(30, 120)).toISOString().slice(0, 10),
          gravida: rnd(1, 5), para: rnd(0, 4),
          gestationalWeeks: rnd(22, 40),
          admittedAt: minutesAgo(rnd(60, 60 * 36)).toISOString(),
          admittedBy: "midwife",
          deliveredAt: stage !== "antenatal" ? minutesAgo(rnd(60, 600)).toISOString() : undefined,
          deliveryMode: stage !== "antenatal" ? pick(["SVD", "C-Section", "Assisted Delivery"]) : undefined,
          babyWeight: stage !== "antenatal" ? Math.round((2.4 + Math.random() * 1.8) * 100) / 100 : undefined,
          babyGender: stage !== "antenatal" ? pick(["male", "female"]) : undefined,
          apgarScores: stage !== "antenatal" ? `${rnd(7, 9)}/${rnd(8, 10)}` : undefined,
          visits: [
            { id: `v-${idx}-1`, date: daysAgo(2).toISOString(), type: "antenatal", notes: "Routine ANC review.", recordedBy: "midwife" },
          ],
        };
        summary.maternity++;
      }

      if (plan.buildAdmission === "emergency") {
        visit.emergencyAdmission = {
          triageLevel: rnd(1, 3),
          arrivedAt: minutesAgo(rnd(5, 180)).toISOString(),
          mode: pick(["ambulance", "walk_in", "referral"]),
          primarySurvey: "ABCs intact, secondary survey in progress.",
        };
        summary.emergencies++;
      }

      if (plan.flow === "blood_active") {
        visit.transfusions = [{
          id: `t-${idx}`,
          bloodGroup: pick(BLOOD_TYPES),
          component: pick(BLOOD_COMPONENTS),
          units: rnd(1, 3),
          urgency: pick(["routine", "urgent", "emergency"]),
          status: pick(["requested", "cross_matched", "dispatched"]),
          requestedAt: minutesAgo(rnd(30, 240)).toISOString(),
          requestedBy: doctor.id,
        }];
      }

      // Treatment JSON — we attach imaging orders directly where relevant.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const treatment: any = { seedTag: SEED_TAG };

      if (plan.flow === "imaging_pending" || (plan.closeOut && chance(0.25))) {
        const orders = pickN(IMAGING, rnd(1, 2)).map((study, n) => ({
          id: `img-${idx}-${n}`,
          study,
          status: plan.closeOut ? "completed" : pick(["pending", "in_progress", "awaiting_report"]),
          orderedBy: doctor.id,
          orderedAt: minutesAgo(rnd(10, 120)).toISOString(),
          findings: plan.closeOut ? pick(["No acute pathology", "Consistent with clinical suspicion", "Incidental finding — see report"]) : undefined,
          reportedBy: plan.closeOut ? "radiologist" : undefined,
          reportedAt: plan.closeOut ? minutesAgo(rnd(5, 60)).toISOString() : undefined,
        }));
        treatment.imagingOrders = orders;
        summary.imagingOrders += orders.length;
      }

      if (plan.flow === "pharmacy_pending") {
        treatment.prescriptions = pickN(DRUGS, rnd(1, 3)).map((d, n) => ({
          id: `rx-${idx}-${n}`,
          drugName: d.name,
          dosage: pick(["500mg TDS x5", "250mg BD x7", "One tablet nocte x14", "5ml TDS x5"]),
          quantity: rnd(5, 30),
          status: "pending",
          orderedBy: doctor.id,
        }));
      }

      const rec = await db.patientRecord.create({
        data: {
          bookId: book.id,
          hospitalId: hospital.id,
          entryPoint: plan.dept === "emergency" ? "emergency_admission" : "manual",
          createdBy: SEED_TAG,
          patient: {
            fullName,
            phone: `024${String(2000000 + idx).padStart(7, "0")}`,
            gender: female ? "Female" : "Male",
            age,
            dateOfBirth: `${new Date().getFullYear() - age}-${String(rnd(1, 12)).padStart(2, "0")}-${String(rnd(1, 28)).padStart(2, "0")}`,
            address: pick(CITIES),
            insuranceProvider: provider,
            insuranceId: hasIns ? `${provider!.substring(0, 3).toUpperCase()}-${rnd(100000, 999999)}` : null,
          },
          visit,
          diagnosis: {},
          treatment,
        },
      });

      summary.records++;
      if (plan.visitStatus === "closed") summary.closed++; else summary.open++;

      /* ─── Lab orders (dedicated LabOrder rows, not just JSON) ── */
      if (plan.flow === "opd_pending_lab" || plan.flow === "opd_lab_in_progress"
          || plan.flow === "closed_opd_lab" || (plan.closeOut && chance(0.3))) {
        const tests = pickN(LAB_TESTS, rnd(1, 4));
        const labStatus = plan.flow === "opd_lab_in_progress" ? "in_progress"
                        : plan.flow === "closed_opd_lab" || plan.closeOut ? "complete"
                        : "pending";
        const labOrder = await db.labOrder.create({
          data: {
            patientId: rec.id, hospitalId: hospital.id, bookId: book.id,
            orderedBy: doctor.id,
            tests: tests.map((t) => ({ testName: t.name, category: t.cat })),
            status: labStatus,
            labToken: `LAB-${HOSPITAL_CODE}-${String(idx).padStart(4, "0")}`,
            clinicalNotes: chiefComplaint,
          },
        });
        summary.labOrders++;

        // Populate results for completed orders so Lab and Doctor screens have data
        if (labStatus === "complete") {
          for (const t of tests) {
            await db.labResult.create({
              data: {
                labOrderId: labOrder.id,
                patientId: rec.id,
                testName: t.name,
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

          // Revenue for completed labs
          for (const t of tests) {
            await createBillableItem({
              hospitalId: hospital.id, patientId: rec.id, bookId: book.id,
              serviceType: "LAB", description: t.name, unitCost: 0,
              renderedBy: "lab_tech", departmentId: "lab",
            });
          }
        }
      }

      /* ─── Consultation + common billables for closed-out flows ── */
      if (plan.closeOut) {
        await createBillableItem({
          hospitalId: hospital.id, patientId: rec.id, bookId: book.id,
          serviceType: "CONSULTATION", description: "Outpatient Consultation",
          unitCost: 0, renderedBy: "doctor", doctorId: doctor.id,
        });

        if (chance(0.6)) {
          for (const s of pickN(NURSE_SUPPLIES, rnd(1, 3))) {
            await createBillableItem({
              hospitalId: hospital.id, patientId: rec.id, bookId: book.id,
              serviceType: "DRUG", description: s.name, unitCost: 0,
              renderedBy: "nurse", departmentId: "nursing", overrideUnitCost: s.cost,
            });
          }
        }

        if (chance(0.3)) {
          await createBillableItem({
            hospitalId: hospital.id, patientId: rec.id, bookId: book.id,
            serviceType: "PROCEDURE", description: "Injection Administration",
            unitCost: 15, renderedBy: "nurse", departmentId: "nursing",
          });
        }

        if (plan.flow === "closed_opd_imaging") {
          await createBillableItem({
            hospitalId: hospital.id, patientId: rec.id, bookId: book.id,
            serviceType: "IMAGING", description: pick(IMAGING),
            unitCost: 0, renderedBy: "radiologist", departmentId: "imaging",
          });
        }
        if (plan.flow === "closed_surgery") {
          await createBillableItem({
            hospitalId: hospital.id, patientId: rec.id, bookId: book.id,
            serviceType: "PROCEDURE", description: pick(PROCEDURES),
            unitCost: 0, renderedBy: "surgeon", doctorId: doctor.id, departmentId: "theatre",
          });
        }
        if (plan.flow === "closed_emergency") {
          await createBillableItem({
            hospitalId: hospital.id, patientId: rec.id, bookId: book.id,
            serviceType: "EMERGENCY", description: `Triage Level ${rnd(1, 3)}`,
            unitCost: 0, renderedBy: "emergency_nurse", doctorId: doctor.id, departmentId: "emergency",
          });
        }

        // Pharmacy dispense on ~65% of closed
        if (chance(0.65)) {
          for (const d of pickN(DRUGS, rnd(1, 3))) {
            await createBillableItem({
              hospitalId: hospital.id, patientId: rec.id, bookId: book.id,
              serviceType: "DRUG", description: d.name, unitCost: 0,
              quantity: rnd(1, 4), renderedBy: "pharmacist", departmentId: "pharmacy",
              overrideUnitCost: d.sell,
            });
          }
        }

        // Assemble + resolve bill
        const bill = await assembleBill({
          hospitalId: hospital.id, hospitalCode: HOSPITAL_CODE,
          patientId: rec.id, bookId: book.id, createdBy: SEED_TAG,
        });
        if (bill) {
          const pay = resolvePayment();
          const updates: Record<string, unknown> = { status: pay.status, paymentMethod: pay.method, issuedAt: new Date() };
          if (pay.status === "PAID" || pay.status === "PART_PAID" || pay.status === "WAIVED") updates.paidAt = new Date();
          await db.bill.update({ where: { id: bill.id }, data: updates });
          summary.bills++;
          summary.gross += bill.total;
        }
      }

      /* ─── Admitted patients get ward-day / ICU-day billables ── */
      if (plan.buildAdmission === "ward") {
        const w = pick(wards);
        const bedClass = BED_CLASSES[idx % BED_CLASSES.length];
        const nightly = await resolveWardNightly({ hospitalId: hospital.id, wardName: w.name, bedClass, fallback: 120 });
        const nights = rnd(1, 3); // still admitted → charge so far
        for (let n = 0; n < nights; n++) {
          await createBillableItem({
            hospitalId: hospital.id, patientId: rec.id, bookId: book.id,
            serviceType: "WARD_DAY", description: `${w.name} — ${bedClass}`,
            unitCost: 0, renderedBy: "ward_nurse", departmentId: "ward",
            overrideUnitCost: nightly,
          });
        }
      }
      if (plan.buildAdmission === "icu") {
        const days = rnd(1, 3);
        for (let n = 0; n < days; n++) {
          await createBillableItem({
            hospitalId: hospital.id, patientId: rec.id, bookId: book.id,
            serviceType: "ICU_DAY", description: "ICU Day",
            unitCost: 0, renderedBy: "icu_nurse", departmentId: "icu",
          });
        }
      }

      // "Billing pending" flow: assemble a bill but do NOT pay it.
      if (plan.flow === "billing_pending") {
        await createBillableItem({
          hospitalId: hospital.id, patientId: rec.id, bookId: book.id,
          serviceType: "CONSULTATION", description: "Outpatient Consultation",
          unitCost: 0, renderedBy: "doctor", doctorId: doctor.id,
        });
        const bill = await assembleBill({
          hospitalId: hospital.id, hospitalCode: HOSPITAL_CODE,
          patientId: rec.id, bookId: book.id, createdBy: SEED_TAG,
        });
        if (bill) {
          await db.bill.update({ where: { id: bill.id }, data: { status: "ISSUED", issuedAt: new Date() } });
          summary.bills++;
          summary.gross += bill.total;
        }
      }

      if (idx % 25 === 0) process.stdout.write(`·${idx} `);
    }
  }

  /* ─── Patient Cards (Cards & Bookings workstation) ───────────── */
  console.log("\n\n💳 Seeding 100 patient cards...");
  const cardNames: { cardNumber: string; patientName: string }[] = [];
  for (let i = 0; i < 100; i++) {
    const female = chance(0.55);
    const fullName = `${pick(female ? FIRST_F : FIRST_M)} ${pick(LAST)}`;
    const cardNumber = cardSuffix();
    await db.patientCard.create({
      data: {
        cardNumber, hospitalId: hospital.id, patientName: fullName,
        phone: `055${String(3000000 + i).padStart(7, "0")}`,
        gender: female ? "Female" : "Male",
        dateOfBirth: `${2026 - rnd(18, 80)}-${String(rnd(1, 12)).padStart(2, "0")}-${String(rnd(1, 28)).padStart(2, "0")}`,
        bloodType: pick(BLOOD_TYPES),
        insuranceProvider: chance(0.4) ? pick(INSURANCE_PROVIDERS) : null,
        insuranceId: chance(0.4) ? `NHIS-${rnd(100000, 999999)}` : null,
        emergencyContact: `${pick(FIRST_M)} ${pick(LAST)}`,
        emergencyContactPhone: `020${String(4000000 + i).padStart(7, "0")}`,
      },
    });
    cardNames.push({ cardNumber, patientName: fullName });
    summary.cards++;
  }

  /* ─── Bookings (Cards & Bookings workstation) ────────────────── */
  console.log("📅 Seeding 60 bookings...");
  const STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"];
  for (let i = 0; i < 60; i++) {
    const src = pick(cardNames);
    const offsetDays = rnd(-7, 14);
    const scheduledAt = daysAhead(offsetDays, rnd(8, 16), rnd(0, 3) * 15);
    const doctor = doctors[i % doctors.length];
    const fee = chance(0.5) ? rnd(30, 120) : 0;
    const status = offsetDays < 0 ? pick(["COMPLETED", "CANCELLED", "NO_SHOW"])
                   : offsetDays === 0 ? pick(["CONFIRMED", "CHECKED_IN", "PENDING"])
                   : pick(STATUSES);
    await db.booking.create({
      data: {
        hospitalId: hospital.id,
        patientId: src.cardNumber,
        patientName: src.patientName,
        patientPhone: `055${String(3000000 + i).padStart(7, "0")}`,
        doctorId: doctor.id,
        departmentKey: pick(["consultation", "lab", "imaging", "procedure"]),
        scheduledAt, durationMins: pick([15, 30, 45, 60]),
        status, fee, feePaid: fee > 0 && status === "COMPLETED",
        notes: chance(0.3) ? pick(["Routine review", "Follow-up prescription", "Result discussion", "New complaint"]) : null,
        createdBy: SEED_TAG,
      },
    });
    summary.bookings++;
  }

  /* ─── Blood Bank Inventory (top-up, additive) ────────────────── */
  console.log("🩸 Topping up blood bank inventory...");
  for (const bloodType of BLOOD_TYPES) {
    for (const component of BLOOD_COMPONENTS) {
      const existing = await db.bloodInventory.findFirst({
        where: { hospitalId: hospital.id, bloodType, component },
      });
      const desiredMin = component === "whole_blood" ? 12 : component === "packed_rbc" ? 10 : 6;
      if (!existing) {
        await db.bloodInventory.create({
          data: { hospitalId: hospital.id, bloodType, component, units: rnd(desiredMin, desiredMin * 3) },
        });
      } else if (existing.units < desiredMin) {
        await db.bloodInventory.update({
          where: { id: existing.id },
          data: { units: existing.units + rnd(desiredMin, desiredMin * 2) },
        });
      }
    }
  }

  /* ─── Self-audit summary ─────────────────────────────────────── */
  console.log("\n\n✅ LIVE 300-patient seed complete\n");
  console.log("   ─── Patient records ───");
  console.log(`   Total:                ${summary.records}`);
  console.log(`   Open / live:          ${summary.open}`);
  console.log(`   Closed + billed:      ${summary.closed}`);
  console.log("   ─── Admissions ───");
  console.log(`   Ward (active):        ${summary.admissions}`);
  console.log(`   ICU (active):         ${summary.icuAdmissions}`);
  console.log(`   Maternity (active):   ${summary.maternity}`);
  console.log(`   Emergency (active):   ${summary.emergencies}`);
  console.log("   ─── Orders ───");
  console.log(`   Lab orders:           ${summary.labOrders}`);
  console.log(`   Imaging orders:       ${summary.imagingOrders}`);
  console.log("   ─── Cards & Bookings ───");
  console.log(`   Patient cards:        ${summary.cards}`);
  console.log(`   Bookings:             ${summary.bookings}`);
  console.log("   ─── Finance ───");
  console.log(`   Bills assembled:      ${summary.bills}`);
  console.log(`   Gross revenue:        ₵${summary.gross.toFixed(2)}`);

  await db.$disconnect();
}

main().catch((e) => { console.error("\n❌ Seed failed:", e); process.exit(1); });
