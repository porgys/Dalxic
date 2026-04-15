/**
 * KBH Yesterday Seed — closed cohort with shift changes.
 *
 * - ~220 patients all processed yesterday (closed / admitted-and-discharged / lwbs)
 * - Two shift blocks yesterday: morning (7–15) and afternoon (15–23)
 *   Both doctors cover both blocks (we only have 2 doctors). Morning shifts clocked in at 07:30,
 *   clocked out at 15:00; afternoon shifts clocked in at 15:00, clocked out at 22:30.
 * - ShiftHandover record at 15:00 linking outgoing→incoming with patient list.
 * - Operators map to what KBH has (1 per role): their login becomes the shift identity.
 * - Canonical DEPT_PREFIXES tokens with per-dept sequencing for yesterday's book.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { DEPT_PREFIXES } from "../src/lib/tokens";

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
const SEED_TAG = "kbh_yest_2026_04_14";
const HOSPITAL_CODE = "KBH";

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const chance = (p: number) => Math.random() < p;

const FIRST_M = ["Kwame","Kofi","Yaw","Kwesi","Kojo","Kwabena","Akwasi","Ebo","Fiifi","Nana","Abdul","Ibrahim","Daniel","Emmanuel","Samuel","Joseph","Prince","Michael","Eric","Isaac"];
const FIRST_F = ["Ama","Adwoa","Akosua","Afua","Abena","Akua","Yaa","Esi","Efua","Araba","Aisha","Fatima","Grace","Mary","Joyce","Dora","Linda","Gifty","Mabel","Agnes"];
const LAST = ["Mensah","Asante","Owusu","Boateng","Adjei","Addo","Ankomah","Amoah","Osei","Sarpong","Agyeman","Danso","Ofori","Anane","Donkor","Poku","Tetteh","Aidoo","Quaye","Nkrumah"];

const CHIEF: Record<string, string[]> = {
  general: ["Fever x 3 days","Cough","Headache","Abdominal pain","Malaria-like","Chest discomfort","Hypertension follow-up","Diabetes review","Skin rash","Diarrhoea"],
  pediatrics: ["Infant fever","Cough 5 days","Vomiting","Ear pain","Rash","Poor feeding","Immunisation due"],
  obstetrics: ["ANC visit 28wk","ANC visit 36wk","Early bleeding","Post-delivery check","Family planning","Labour pains"],
  surgery: ["Appendicitis","Hernia","Post-op check","Wound dressing"],
  emergency: ["RTA","Severe bleeding","Acute asthma","High-grade fever"],
};

const INS = ["NHIS","Apex","Glico","Acacia","PhoenixLife"];
const LAB_TESTS = ["FBC","Malaria RDT","Urinalysis","Blood Sugar","HIV Test","Widal Test","LFT","KFT","ESR","Pregnancy Test","Hep B","Stool R/E"];
const DRUGS = [
  { name: "Paracetamol 500mg", price: 3 },
  { name: "Amoxicillin 500mg", price: 8 },
  { name: "Artemether-Lumefantrine", price: 25 },
  { name: "ORS sachet", price: 2 },
  { name: "Metronidazole 400mg", price: 5 },
  { name: "Ibuprofen 400mg", price: 4 },
  { name: "Amlodipine 5mg", price: 10 },
  { name: "Metformin 500mg", price: 7 },
];

function yAt(h: number, m = 0): Date {
  const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(h, m, 0, 0); return d;
}

type Plan = {
  dept: "general"|"pediatrics"|"obstetrics"|"surgery"|"emergency";
  status: "closed"|"lwbs"|"deceased";
  arrivedAt: Date;
  shift: "morning"|"afternoon";
  seq: number;
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
  const ops = await db.deviceOperator.findMany({ where: { hospitalId: h.id, isActive: true } });
  const byRole = (r: string) => ops.find(o => o.role === r);
  const frontDesk = byRole("front_desk");
  const nurse = byRole("nurse");
  const pharm = byRole("pharmacy");
  const labOp = byRole("lab");
  const billOp = byRole("billing");

  // ── Yesterday's shifts: morning + afternoon, both closed out ──
  const morningShifts: Record<string, string> = {};
  const afternoonShifts: Record<string, string> = {};
  for (const d of doctors) {
    const m = await db.doctorShift.create({
      data: {
        hospitalId: h.id, doctorId: d.id, shiftType: "morning",
        clockInAt: yAt(7, 30), clockOutAt: yAt(15, 0),
        notes: "Yesterday morning shift — closed",
        patientCount: 0, grossRevenue: 0,
      },
    });
    morningShifts[d.id] = m.id;
    const a = await db.doctorShift.create({
      data: {
        hospitalId: h.id, doctorId: d.id, shiftType: "afternoon",
        clockInAt: yAt(15, 0), clockOutAt: yAt(22, 30),
        notes: "Yesterday afternoon shift — closed",
        patientCount: 0, grossRevenue: 0,
      },
    });
    afternoonShifts[d.id] = a.id;
  }
  console.log(`Created ${doctors.length * 2} DoctorShifts (morning+afternoon, both closed)`);

  const prices = await db.servicePrice.findMany({ where: { hospitalId: h.id, isActive: true } });
  const consultPrice = prices.find(p => p.serviceType === "consultation")?.unitCost ?? 30;

  const deptSeq: Record<string, number> = {};
  const nextSeq = (d: string) => (deptSeq[d] = (deptSeq[d] ?? 0) + 1);
  const deptPick = (): Plan["dept"] => {
    const r = Math.random();
    if (r < 0.68) return "general";
    if (r < 0.87) return "pediatrics";
    if (r < 0.94) return "obstetrics";
    if (r < 0.98) return "surgery";
    return "emergency";
  };

  // Arrivals: 18 buckets 7am–11pm, ~13–17 each → ~220 total
  const plans: Plan[] = [];
  for (let hr = 7; hr <= 22; hr++) {
    const cnt = hr < 12 ? rnd(15, 20) : hr < 16 ? rnd(14, 18) : hr < 20 ? rnd(11, 14) : rnd(5, 8);
    for (let i = 0; i < cnt; i++) {
      const arrivedAt = yAt(hr, rnd(0, 59));
      const dept = deptPick();
      const status: Plan["status"] = chance(0.02) ? "lwbs" : chance(0.005) ? "deceased" : "closed";
      plans.push({ dept, status, arrivedAt, shift: hr < 15 ? "morning" : "afternoon", seq: 0 });
    }
  }
  plans.sort((a, b) => a.arrivedAt.getTime() - b.arrivedAt.getTime());
  for (const p of plans) p.seq = nextSeq(p.dept);
  console.log(`Planned ${plans.length} patients`);

  const handoverPatientIds: string[] = [];
  const summary: Record<string, number> = {};
  const doctorRevenue: Record<string, Record<string, number>> = { morning: {}, afternoon: {} };

  let idx = 0;
  for (const plan of plans) {
    const female = plan.dept === "obstetrics" || Math.random() > 0.5;
    const first = pick(female ? FIRST_F : FIRST_M);
    const last = pick(LAST);
    const fullName = `${first} ${last}`;
    const age = plan.dept === "pediatrics" ? rnd(1, 14) : plan.dept === "obstetrics" ? rnd(18, 42) : rnd(18, 80);
    const hasIns = chance(0.4);
    const provider = hasIns ? pick(INS) : null;
    const chiefComplaint = pick(CHIEF[plan.dept] ?? CHIEF.general);

    const deptCode = DEPT_PREFIXES[plan.dept] || "GR";
    const token = plan.dept === "emergency"
      ? `ER-${HOSPITAL_CODE}-${String(plan.seq).padStart(3, "0")}`
      : `${deptCode}-${HOSPITAL_CODE}-${String(plan.seq).padStart(3, "0")}`;

    const doctor = plan.dept === "pediatrics" && peds ? peds : gen;
    const shiftId = plan.shift === "morning" ? morningShifts[doctor.id] : afternoonShifts[doctor.id];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visit: any = {
      queueToken: token, department: plan.dept, chiefComplaint,
      visitStatus: plan.status,
      assignedDoctorId: plan.status === "closed" ? doctor.id : null,
      assignedDoctorName: plan.status === "closed" ? doctor.name : null,
      checkedInBy: frontDesk?.name ?? "Front Desk",
      checkedInById: frontDesk?.id,
      emergencyFlag: plan.dept === "emergency",
      arrivedAt: plan.arrivedAt.toISOString(),
      closedAt: plan.status === "closed" ? new Date(plan.arrivedAt.getTime() + rnd(60, 180) * 60 * 1000).toISOString() : null,
      shiftType: plan.shift,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patient: any = {
      fullName, age, gender: female ? "female" : "male",
      phone: `02${rnd(10000000, 99999999)}`,
      insuranceId: hasIns ? `${provider}-${rnd(100000, 999999)}` : null,
      insuranceScheme: provider,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diagnosis: any = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const treatment: any = { prescriptions: [] };

    if (plan.status === "closed") {
      const dxMap: Record<string, string[]> = {
        general: ["Malaria","URI","Hypertension","T2DM","Gastritis","UTI","Pneumonia"],
        pediatrics: ["Malaria","URI","Gastroenteritis","Otitis Media"],
        obstetrics: ["Normal pregnancy","UTI in pregnancy","Anaemia in pregnancy"],
        surgery: ["Appendicitis","Inguinal hernia"],
        emergency: ["Severe malaria","Asthma exacerbation"],
      };
      diagnosis.primary = pick(dxMap[plan.dept] ?? dxMap.general);
      diagnosis.notes = `${fullName}, age ${age}, ${chiefComplaint.toLowerCase()}. Treated and discharged.`;
      const nRx = rnd(1, 3);
      for (let k = 0; k < nRx; k++) {
        const drug = pick(DRUGS);
        treatment.prescriptions.push({ drug: drug.name, dose: pick(["1 tab TDS","1 tab BD","1 tab OD"]), duration: "5 days", price: drug.price });
      }
    }

    const record = await db.patientRecord.create({
      data: {
        bookId: book.id, hospitalId: h.id,
        patient, visit, diagnosis, treatment,
        entryPoint: "manual", createdBy: SEED_TAG,
        createdAt: plan.arrivedAt,
      },
    });

    // Handover sample — a few patients near shift change
    const arrHr = plan.arrivedAt.getHours();
    if (plan.status === "closed" && arrHr >= 13 && arrHr <= 15 && handoverPatientIds.length < 8) {
      handoverPatientIds.push(record.id);
    }

    // Consultation item
    const items: { serviceType: string; description: string; unitCost: number; qty: number; renderedAt: Date; renderedBy: string; deptId: string; doctorId?: string; shiftId?: string }[] = [];
    if (plan.status === "closed") {
      items.push({
        serviceType: "CONSULTATION", description: `Consultation — ${doctor.name}`,
        unitCost: consultPrice, qty: 1,
        renderedAt: new Date(plan.arrivedAt.getTime() + 30 * 60 * 1000),
        renderedBy: doctor.name, deptId: plan.dept, doctorId: doctor.id, shiftId,
      });

      if (chance(0.45) && labOp) {
        const testCount = rnd(1, 2);
        const tests: { testName: string; category: string }[] = [];
        for (let k = 0; k < testCount; k++) tests.push({ testName: pick(LAB_TESTS), category: "HAEMATOLOGY" });
        const labOrder = await db.labOrder.create({
          data: {
            patientId: record.id, hospitalId: h.id, bookId: book.id,
            orderedBy: doctor.name,
            orderedAt: new Date(plan.arrivedAt.getTime() + 40 * 60 * 1000),
            tests, status: "complete",
            labToken: `LAB-${HOSPITAL_CODE}-Y${String(plan.seq).padStart(3, "0")}-${record.id.slice(-4)}`,
          },
        });
        for (const t of tests) {
          items.push({
            serviceType: "LAB", description: t.testName,
            unitCost: prices.find(p => p.serviceType === "lab" && p.name === t.testName)?.unitCost ?? 25, qty: 1,
            renderedAt: new Date(plan.arrivedAt.getTime() + 55 * 60 * 1000),
            renderedBy: labOp.name, deptId: "lab",
          });
          await db.labResult.create({
            data: {
              labOrderId: labOrder.id, patientId: record.id, testName: t.testName,
              resultValue: pick(["12.5","Negative","Normal","4.8","Non-reactive"]),
              unit: pick(["g/dL","","mmol/L"]), referenceRange: "See range",
              flag: chance(0.8) ? "normal" : pick(["high","low"]),
              enteredBy: labOp.name,
              enteredAt: new Date(plan.arrivedAt.getTime() + 90 * 60 * 1000),
            },
          });
        }
      }

      if (treatment.prescriptions.length && pharm) {
        for (const rx of treatment.prescriptions) {
          items.push({
            serviceType: "DRUG", description: rx.drug,
            unitCost: rx.price, qty: rnd(1, 3),
            renderedAt: new Date(plan.arrivedAt.getTime() + 80 * 60 * 1000),
            renderedBy: pharm.name, deptId: "pharmacy",
          });
        }
      }
    }

    const createdIds: string[] = [];
    let subtotal = 0;
    for (const it of items) {
      const total = it.unitCost * it.qty;
      subtotal += total;
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
      createdIds.push(bi.id);
    }

    if (items.length) {
      const billStatus = plan.status === "closed" ? "PAID" : plan.status === "lwbs" ? "WAIVED" : "WAIVED";
      const paid = billStatus === "PAID";
      const bill = await db.bill.create({
        data: {
          hospitalId: h.id, patientId: record.id, bookId: book.id,
          billNumber: `B-${HOSPITAL_CODE}-${yAt(plan.arrivedAt.getHours()).getTime().toString().slice(-6)}-${record.id.slice(-4)}`,
          subtotal, discount: 0, total: subtotal,
          status: billStatus,
          paymentMethod: paid ? (hasIns ? "NHIS" : pick(["CASH","MOBILE_MONEY"])) : null,
          issuedAt: new Date(plan.arrivedAt.getTime() + 60 * 60 * 1000),
          paidAt: paid ? new Date(plan.arrivedAt.getTime() + 65 * 60 * 1000) : null,
          createdBy: billOp?.name ?? "Billing",
          createdAt: new Date(plan.arrivedAt.getTime() + 60 * 60 * 1000),
        },
      });
      await db.billableItem.updateMany({ where: { id: { in: createdIds } }, data: { billId: bill.id, isBilled: true } });
      if (paid && shiftId) {
        doctorRevenue[plan.shift][doctor.id] = (doctorRevenue[plan.shift][doctor.id] ?? 0) + subtotal;
      }
    }

    summary[plan.status] = (summary[plan.status] ?? 0) + 1;
    idx++;
    if (idx % 25 === 0) process.stdout.write(`·${idx} `);
  }

  // ── Update shift rollups ──
  for (const [shiftKind, revMap] of Object.entries(doctorRevenue)) {
    const shifts = shiftKind === "morning" ? morningShifts : afternoonShifts;
    for (const [docId, rev] of Object.entries(revMap)) {
      const sid = shifts[docId];
      const count = plans.filter(p => p.shift === shiftKind && p.status === "closed" && (p.dept === "pediatrics" && peds?.id === docId || p.dept !== "pediatrics" && gen?.id === docId)).length;
      await db.doctorShift.update({ where: { id: sid }, data: { grossRevenue: rev, patientCount: count } });
    }
  }

  // ── Handover at 15:00 ──
  if (handoverPatientIds.length >= 2) {
    const outgoing = gen!;
    const incoming = peds ?? gen!;
    await db.shiftHandover.create({
      data: {
        hospitalId: h.id,
        outgoingDoctorId: outgoing.id,
        incomingDoctorId: incoming.id,
        patientIds: handoverPatientIds,
        notes: `Shift change 15:00 — ${handoverPatientIds.length} patients pending follow-up.`,
        handoverAt: yAt(15, 0),
      },
    });
    console.log(`\nCreated ShiftHandover: ${outgoing.name} → ${incoming.name} with ${handoverPatientIds.length} patients`);
  }

  console.log("\n\n✅ Yesterday seed complete");
  console.log("State breakdown:", summary);
  console.log("Token per-dept last seq:", deptSeq);
  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
