/**
 * KBH Today-Live Seed — fresh insert after _reset_kbh_seed.ts cleared the slate.
 *
 * What this creates (all dated to TODAY, timed across the working day):
 *   • ~150 PatientRecords staged across realistic arrival buckets 7am–now
 *   • Queue state mix that mirrors mid-afternoon reality at a T1 clinic:
 *       queued • with_doctor (capped 2/doctor) • paused_for_lab/pharmacy/imaging/procedure
 *       awaiting_close • admitted (with actual bed assignment) • closed • lwbs • deceased
 *   • Bills per patient (PAID for closed, ISSUED for admitted, DRAFT otherwise)
 *   • BillableItems: consultation + service-specific (lab, drug, ward_day, etc.)
 *   • LabOrders + LabResults for paused_for_lab and completed patients
 *   • DoctorShift rows: both doctors clocked in this morning (active)
 *   • BedTransitions + Bed occupancy for admitted patients
 *
 * Shift/operator mapping:
 *   - All front-desk/nurse/pharmacy/lab/billing actions logged under the
 *     single active operator for that role (KBH has 1 per role right now).
 *   - Both doctors active on a morning-through-afternoon DoctorShift.
 *   - When more operators exist per role, add shift-hour logic here.
 *
 * Tokens use canonical DEPT_PREFIXES from src/lib/tokens.ts (GR/PD/OB/ER/SG…)
 * so front-desk bookings made after this seed continue numbering cleanly.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { DEPT_PREFIXES } from "../src/lib/tokens";

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
const SEED_TAG = "kbh_live_2026_04_15";
const HOSPITAL_CODE = "KBH";

// ── Helpers ──
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const chance = (p: number) => Math.random() < p;

const FIRST_M = ["Kwame","Kofi","Yaw","Kwesi","Kojo","Kwabena","Akwasi","Ebo","Fiifi","Nana","Abdul","Ibrahim","Mohammed","Daniel","Emmanuel","Samuel","Joseph","Prince","Michael","Eric","Isaac","Francis","Felix","Bernard","Solomon"];
const FIRST_F = ["Ama","Adwoa","Akosua","Afua","Abena","Akua","Yaa","Esi","Efua","Araba","Aisha","Fatima","Mariam","Grace","Mary","Joyce","Dora","Linda","Gifty","Mabel","Agnes","Patience","Comfort","Vida","Charity"];
const LAST = ["Mensah","Asante","Owusu","Boateng","Adjei","Addo","Ankomah","Amoah","Osei","Sarpong","Agyeman","Danso","Ofori","Anane","Donkor","Poku","Tetteh","Aidoo","Quaye","Nkrumah","Dankwa","Appiah","Bonsu","Yeboah","Opoku"];

const CHIEF: Record<string, string[]> = {
  general: ["Fever x 3 days","Cough and sore throat","Headache, dizziness","Abdominal pain","Body pains","Malaria-like symptoms","Persistent cough","Chest discomfort","Hypertension follow-up","Diabetes review","Skin rash","Diarrhoea","Vomiting","Fatigue","Painful urination"],
  pediatrics: ["Infant fever","Cough 5 days","Vomiting + diarrhoea","Ear pain","Rash","Febrile convulsion","Weight concern","Poor feeding","Cold symptoms","Immunisation due"],
  obstetrics: ["ANC visit 28wk","ANC visit 36wk","Early bleeding","Braxton-Hicks","Post-delivery check","Family planning","Abnormal discharge","Abdominal pain in pregnancy","Labour pains"],
  surgery: ["Appendicitis suspected","Hernia","Post-op check","Incision drainage","Wound dressing"],
  emergency: ["RTA victim","Severe bleeding","Acute asthma","Suspected MI","Anaphylaxis","Severe dehydration","High-grade fever unresponsive"],
};

const INSURANCE_PROVIDERS = ["NHIS","Apex","Glico","Acacia","PhoenixLife"];
const LAB_TESTS = ["FBC","Malaria RDT","Urinalysis","Blood Sugar","HIV Test","Widal Test","Liver Function","Kidney Function","ESR","Pregnancy Test","Hepatitis B","Stool R/E"];
const DRUGS = [
  { name: "Paracetamol 500mg", price: 3 },
  { name: "Amoxicillin 500mg", price: 8 },
  { name: "Artemether-Lumefantrine", price: 25 },
  { name: "ORS sachet", price: 2 },
  { name: "Metronidazole 400mg", price: 5 },
  { name: "Ibuprofen 400mg", price: 4 },
  { name: "Amlodipine 5mg", price: 10 },
  { name: "Metformin 500mg", price: 7 },
  { name: "Ciprofloxacin 500mg", price: 12 },
  { name: "Omeprazole 20mg", price: 9 },
];

// Returns a Date today at given hour+min (local machine time — seed runs from dev machine)
function todayAt(h: number, m = 0): Date {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

type PatientPlan = {
  dept: "general" | "pediatrics" | "obstetrics" | "surgery" | "emergency";
  visitStatus: "active" | "with_doctor" | "paused_for_lab" | "paused_for_pharmacy" | "paused_for_imaging" | "paused_for_procedure" | "awaiting_close" | "admitted" | "closed" | "lwbs" | "deceased";
  arrivedAt: Date;
  seq: number;
  emergencyFlag?: boolean;
};

async function main() {
  const h = await db.hospital.findUnique({ where: { code: HOSPITAL_CODE } });
  if (!h) throw new Error("no KBH");

  const book = await db.monthlyBook.findFirst({
    where: { hospitalId: h.id },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  if (!book) throw new Error("no book");

  const doctors = await db.doctor.findMany({ where: { hospitalId: h.id } });
  const peds = doctors.find(d => d.specialty.toLowerCase().includes("ped"));
  const gen = doctors.find(d => !d.specialty.toLowerCase().includes("ped")) || doctors[0];
  if (!gen) throw new Error("no doctors at KBH");

  const ops = await db.deviceOperator.findMany({ where: { hospitalId: h.id, isActive: true } });
  const byRole = (r: string) => ops.find(o => o.role === r);
  const frontDesk = byRole("front_desk");
  const nurse = byRole("nurse");
  const pharm = byRole("pharmacy");
  const labOp = byRole("lab");
  const billOp = byRole("billing");

  const wards = await db.ward.findMany({
    where: { hospitalId: h.id, isActive: true },
    include: { rooms: { include: { beds: true } } },
  });
  const wardFor = (dept: string): { id: string; name: string; beds: { id: string; roomId: string }[] } | null => {
    const match = wards.find(w => {
      if (dept === "pediatrics") return w.type === "pediatric";
      if (dept === "obstetrics") return w.type === "maternity";
      if (dept === "emergency")  return w.type === "emergency";
      if (dept === "surgery")    return w.type === "surgical";
      return w.type === "general";
    });
    if (!match) return null;
    const beds = match.rooms.flatMap(r => r.beds.filter(b => b.status === "available").map(b => ({ id: b.id, roomId: r.id })));
    return { id: match.id, name: match.name, beds };
  };

  const prices = await db.servicePrice.findMany({ where: { hospitalId: h.id, isActive: true } });
  const consultPrice = prices.find(p => p.serviceType === "consultation")?.unitCost ?? 30;
  const wardDayPrice = prices.find(p => p.serviceType === "ward")?.unitCost ?? 80;

  console.log(`KBH ready: ${doctors.length} docs, ${ops.length} ops, ${wards.length} wards`);

  // ── DoctorShifts: both doctors clocked in this morning, still active ──
  const shifts: Record<string, string> = {}; // doctorId -> shiftId
  for (const d of doctors) {
    const sh = await db.doctorShift.create({
      data: {
        hospitalId: h.id,
        doctorId: d.id,
        shiftType: "morning",
        clockInAt: todayAt(7, 30),
        notes: "Morning shift — on duty",
      },
    });
    shifts[d.id] = sh.id;
  }
  console.log(`Created ${Object.keys(shifts).length} active DoctorShifts`);

  // ── Patient plan: distribute across day buckets & states ──
  const plans: PatientPlan[] = [];
  const deptSeq: Record<string, number> = {};
  const nextSeq = (dept: string) => (deptSeq[dept] = (deptSeq[dept] ?? 0) + 1);
  const deptPick = (): PatientPlan["dept"] => {
    const r = Math.random();
    if (r < 0.68) return "general";
    if (r < 0.87) return "pediatrics";
    if (r < 0.94) return "obstetrics";
    if (r < 0.98) return "surgery";
    return "emergency";
  };

  // Arrival buckets (hours, count)
  const arrivals: [number, number][] = [
    [7, 18], [8, 24], [9, 22], [10, 20], [11, 18], [12, 14], [13, 16], [14, 14],
  ];

  // State distribution targets (total ~146)
  const targets: Record<PatientPlan["visitStatus"], number> = {
    closed: 72, admitted: 11, awaiting_close: 5,
    paused_for_lab: 8, paused_for_pharmacy: 6, paused_for_imaging: 4, paused_for_procedure: 2,
    with_doctor: 4, active:28, lwbs: 2, deceased: 1,
  };
  // Flatten to a queue of states, then assign in arrival order (earliest → most completed)
  const stateQueue: PatientPlan["visitStatus"][] = [];
  // Arrived earliest → closed first; admitted in mid-morning; paused mid-day; with_doctor & queued recent
  const orderedStates: [PatientPlan["visitStatus"], number][] = [
    ["closed", targets.closed], ["deceased", targets.deceased], ["lwbs", targets.lwbs],
    ["admitted", targets.admitted], ["awaiting_close", targets.awaiting_close],
    ["paused_for_imaging", targets.paused_for_imaging], ["paused_for_procedure", targets.paused_for_procedure],
    ["paused_for_lab", targets.paused_for_lab], ["paused_for_pharmacy", targets.paused_for_pharmacy],
    ["with_doctor", targets.with_doctor], ["active", targets.active],
  ];
  for (const [s, n] of orderedStates) for (let i = 0; i < n; i++) stateQueue.push(s);

  let idx = 0;
  for (const [hr, count] of arrivals) {
    for (let i = 0; i < count; i++) {
      const arrivedAt = new Date();
      arrivedAt.setHours(hr, rnd(0, 59), rnd(0, 59), 0);
      const dept = deptPick();
      const status = stateQueue[idx] || "active";
      idx++;
      plans.push({
        dept,
        visitStatus: status,
        arrivedAt,
        seq: nextSeq(dept),
        emergencyFlag: dept === "emergency",
      });
    }
  }
  console.log(`Planned ${plans.length} patients`);

  // Sort by arrival so tokens increment naturally
  plans.sort((a, b) => a.arrivedAt.getTime() - b.arrivedAt.getTime());

  // Re-number seq in true arrival order
  const reSeq: Record<string, number> = {};
  for (const p of plans) p.seq = (reSeq[p.dept] = (reSeq[p.dept] ?? 0) + 1);

  const summary: Record<string, number> = {};

  for (const plan of plans) {
    const female = plan.dept === "obstetrics" || Math.random() > 0.5;
    const first = pick(female ? FIRST_F : FIRST_M);
    const last = pick(LAST);
    const fullName = `${first} ${last}`;
    const age = plan.dept === "pediatrics" ? rnd(1, 14) : plan.dept === "obstetrics" ? rnd(18, 42) : rnd(18, 80);
    const hasIns = chance(0.4);
    const provider = hasIns ? pick(INSURANCE_PROVIDERS) : null;
    const chiefComplaint = pick(CHIEF[plan.dept] ?? CHIEF.general);

    const deptCode = DEPT_PREFIXES[plan.dept] || "GR";
    const token = plan.emergencyFlag
      ? `ER-${HOSPITAL_CODE}-${String(plan.seq).padStart(3, "0")}`
      : `${deptCode}-${HOSPITAL_CODE}-${String(plan.seq).padStart(3, "0")}`;

    const doctor = plan.dept === "pediatrics" && peds ? peds : gen;
    const assignStatuses = ["with_doctor","paused_for_lab","paused_for_pharmacy","paused_for_imaging","paused_for_procedure","awaiting_close","admitted","closed"];
    const hasDoc = assignStatuses.includes(plan.visitStatus);
    const assigned = hasDoc
      ? { assignedDoctorId: doctor.id, assignedDoctorName: doctor.name }
      : { assignedDoctorId: null as string | null, assignedDoctorName: null as string | null };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visit: any = {
      queueToken: token,
      department: plan.dept,
      chiefComplaint,
      visitStatus: plan.visitStatus,
      ...assigned,
      checkedInBy: frontDesk?.name ?? "Front Desk",
      checkedInById: frontDesk?.id,
      emergencyFlag: plan.emergencyFlag ?? false,
      arrivedAt: plan.arrivedAt.toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patient: any = {
      fullName,
      age,
      gender: female ? "female" : "male",
      phone: `02${rnd(10000000, 99999999)}`,
      insuranceId: hasIns ? `${provider}-${rnd(100000, 999999)}` : null,
      insuranceScheme: provider,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diagnosis: any = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const treatment: any = { prescriptions: [] };

    // Closed / awaiting_close / admitted → full diagnosis + prescriptions
    const wasSeen = ["closed","awaiting_close","admitted","paused_for_pharmacy","paused_for_imaging","paused_for_procedure"].includes(plan.visitStatus);
    if (wasSeen) {
      const dxMap: Record<string, string[]> = {
        general: ["Malaria","Upper Respiratory Infection","Hypertension","Type 2 Diabetes","Gastritis","UTI","Pneumonia"],
        pediatrics: ["Malaria","URI","Gastroenteritis","Otitis Media","Febrile illness"],
        obstetrics: ["Normal pregnancy","UTI in pregnancy","Anaemia in pregnancy"],
        surgery: ["Appendicitis","Inguinal hernia","Wound infection"],
        emergency: ["Head injury — stable","Severe malaria","Asthma exacerbation"],
      };
      diagnosis.primary = pick(dxMap[plan.dept] ?? dxMap.general);
      diagnosis.notes = `Clinical notes: patient ${first} ${last}, age ${age}, presenting with ${chiefComplaint.toLowerCase()}. Vitals stable.`;
      const nRx = rnd(2, 4);
      for (let k = 0; k < nRx; k++) {
        const drug = pick(DRUGS);
        treatment.prescriptions.push({ drug: drug.name, dose: pick(["1 tab TDS","1 tab BD","2 tabs stat","1 tab OD"]), duration: pick(["5 days","3 days","7 days"]), price: drug.price });
      }
    }

    const record = await db.patientRecord.create({
      data: {
        bookId: book.id,
        hospitalId: h.id,
        patient, visit, diagnosis, treatment,
        entryPoint: "manual",
        createdBy: SEED_TAG,
        createdAt: plan.arrivedAt,
      },
    });

    // ── Billable items + Bill ──
    const items: { serviceType: string; description: string; unitCost: number; qty: number; renderedAt: Date; renderedBy: string; deptId: string; doctorId?: string; shiftId?: string; }[] = [];

    if (wasSeen || plan.visitStatus === "with_doctor") {
      items.push({
        serviceType: "CONSULTATION",
        description: `Consultation — Dr. ${doctor.name.replace(/^Dr\. /, "")}`,
        unitCost: consultPrice, qty: 1,
        renderedAt: new Date(plan.arrivedAt.getTime() + 30 * 60 * 1000),
        renderedBy: doctor.name, deptId: plan.dept, doctorId: doctor.id, shiftId: shifts[doctor.id],
      });
    }

    // Lab orders for paused_for_lab + some closed
    const orderedLab = plan.visitStatus === "paused_for_lab" || (wasSeen && chance(0.35));
    if (orderedLab && labOp) {
      const testCount = rnd(1, 3);
      const tests: { testName: string; category: string }[] = [];
      for (let k = 0; k < testCount; k++) tests.push({ testName: pick(LAB_TESTS), category: "HAEMATOLOGY" });
      const labTokenSeq = plan.seq + (plan.dept === "general" ? 100 : plan.dept === "pediatrics" ? 200 : 300);
      const labOrder = await db.labOrder.create({
        data: {
          patientId: record.id, hospitalId: h.id, bookId: book.id,
          orderedBy: doctor.name,
          orderedAt: new Date(plan.arrivedAt.getTime() + 45 * 60 * 1000),
          tests, clinicalNotes: `Please run ${tests.map(t => t.testName).join(", ")}`,
          status: plan.visitStatus === "paused_for_lab" ? "pending" : "complete",
          labToken: `LAB-${HOSPITAL_CODE}-${String(labTokenSeq).padStart(3, "0")}-${record.id.slice(-4)}`,
        },
      });
      for (const t of tests) {
        items.push({
          serviceType: "LAB", description: t.testName,
          unitCost: prices.find(p => p.serviceType === "lab" && p.name === t.testName)?.unitCost ?? 25, qty: 1,
          renderedAt: new Date(plan.arrivedAt.getTime() + 50 * 60 * 1000),
          renderedBy: labOp.name, deptId: "lab",
        });
        if (plan.visitStatus !== "paused_for_lab") {
          await db.labResult.create({
            data: {
              labOrderId: labOrder.id, patientId: record.id, testName: t.testName,
              resultValue: pick(["12.5","Negative","Normal","4.8","6.2","Non-reactive"]),
              unit: pick(["g/dL","","mmol/L"]), referenceRange: "See range",
              flag: chance(0.8) ? "normal" : pick(["high","low"]),
              enteredBy: labOp.name,
              enteredAt: new Date(plan.arrivedAt.getTime() + 90 * 60 * 1000),
            },
          });
        }
      }
    }

    // Prescriptions → drug items
    if (treatment.prescriptions.length && (wasSeen || plan.visitStatus === "paused_for_pharmacy") && pharm) {
      for (const rx of treatment.prescriptions) {
        items.push({
          serviceType: "DRUG", description: rx.drug,
          unitCost: rx.price, qty: rnd(1, 3),
          renderedAt: new Date(plan.arrivedAt.getTime() + 75 * 60 * 1000),
          renderedBy: pharm.name, deptId: "pharmacy",
        });
      }
    }

    // Ward day for admitted
    let bedAssignment: { bedId: string; wardName: string } | null = null;
    if (plan.visitStatus === "admitted") {
      const w = wardFor(plan.dept);
      if (w && w.beds.length > 0) {
        const bedSlot = w.beds.shift()!;
        await db.bed.update({
          where: { id: bedSlot.id },
          data: { status: "occupied", patientId: record.id },
        });
        await db.bedTransition.create({
          data: {
            bedId: bedSlot.id, fromStatus: "available", toStatus: "occupied",
            triggeredBy: nurse?.name ?? "Ward Nurse", patientId: record.id,
            timestamp: new Date(plan.arrivedAt.getTime() + 3 * 60 * 60 * 1000),
          },
        });
        bedAssignment = { bedId: bedSlot.id, wardName: w.name };
        // persist ward in visit
        visit.wardName = w.name;
        visit.bedId = bedSlot.id;
        await db.patientRecord.update({ where: { id: record.id }, data: { visit } });

        items.push({
          serviceType: "WARD_DAY", description: `Ward admission — ${w.name}`,
          unitCost: wardDayPrice, qty: 1,
          renderedAt: new Date(plan.arrivedAt.getTime() + 3 * 60 * 60 * 1000),
          renderedBy: nurse?.name ?? "Ward Nurse", deptId: "ward",
        });
      }
    }

    // Create BillableItems
    const createdItems: { id: string; totalCost: number; }[] = [];
    for (const it of items) {
      const total = it.unitCost * it.qty;
      const bi = await db.billableItem.create({
        data: {
          hospitalId: h.id, patientId: record.id, bookId: book.id,
          serviceType: it.serviceType, description: it.description,
          unitCost: it.unitCost, quantity: it.qty, totalCost: total,
          renderedAt: it.renderedAt, renderedBy: it.renderedBy,
          doctorId: it.doctorId ?? null, departmentId: it.deptId,
          shiftId: it.shiftId ?? null,
          commissionPct: 0, staffCutCost: 0, isBilled: false,
        },
      });
      createdItems.push({ id: bi.id, totalCost: total });
    }

    // Bill for any patient past arrival
    if (items.length) {
      const subtotal = createdItems.reduce((s, x) => s + x.totalCost, 0);
      const billStatus =
        plan.visitStatus === "closed" ? "PAID" :
        plan.visitStatus === "admitted" ? "ISSUED" :
        plan.visitStatus === "awaiting_close" ? "ISSUED" :
        plan.visitStatus === "deceased" ? "WAIVED" :
        plan.visitStatus === "lwbs" ? "WAIVED" : "DRAFT";
      const paid = billStatus === "PAID";
      const bill = await db.bill.create({
        data: {
          hospitalId: h.id, patientId: record.id, bookId: book.id,
          billNumber: `B-${HOSPITAL_CODE}-${Date.now().toString().slice(-6)}-${record.id.slice(-4)}`,
          subtotal, discount: 0, total: subtotal,
          status: billStatus,
          paymentMethod: paid ? (hasIns ? "NHIS" : pick(["CASH","MOBILE_MONEY"])) : null,
          issuedAt: paid || billStatus === "ISSUED" ? new Date(plan.arrivedAt.getTime() + 60 * 60 * 1000) : null,
          paidAt: paid ? new Date(plan.arrivedAt.getTime() + 65 * 60 * 1000) : null,
          createdBy: billOp?.name ?? "Billing",
          createdAt: new Date(plan.arrivedAt.getTime() + 60 * 60 * 1000),
        },
      });
      // Link items to bill
      await db.billableItem.updateMany({
        where: { id: { in: createdItems.map(i => i.id) } },
        data: { billId: bill.id, isBilled: true },
      });
    }

    summary[plan.visitStatus] = (summary[plan.visitStatus] ?? 0) + 1;
    if (bedAssignment) summary["beds_occupied"] = (summary["beds_occupied"] ?? 0) + 1;
    process.stdout.write(".");
    if ((summary[plan.visitStatus] ?? 0) % 20 === 0) process.stdout.write(" ");
  }

  console.log("\n\n✅ Today-Live seed complete.");
  console.log("State breakdown:");
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k}: ${v}`);
  console.log("\nToken per-dept last seq:");
  for (const [d, n] of Object.entries(reSeq)) console.log(`  ${d}: ${n}`);
  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
