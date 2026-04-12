/**
 * Seed 100 realistic test patients into KBH hospital.
 * Run: npx tsx scripts/seed-100-patients.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 5,
});
const db = new PrismaClient({ adapter });

const HOSPITAL_CODE = "KBH";

// ─── Ghanaian Names ───
const FIRST_NAMES_M = ["Kwame", "Kofi", "Kwesi", "Yaw", "Kwaku", "Kojo", "Kwabena", "Nana", "Ebo", "Fiifi", "Paa", "Papa", "Akwasi", "Obiri", "Mensah", "Osei", "Adjei", "Boateng", "Asante", "Darko"];
const FIRST_NAMES_F = ["Ama", "Abena", "Akosua", "Yaa", "Efua", "Akua", "Afia", "Adwoa", "Nana", "Maame", "Araba", "Adjoa", "Serwaa", "Abenaa", "Fosua", "Gifty", "Dede", "Awurama", "Esi", "Baaba"];
const LAST_NAMES = ["Mensah", "Asante", "Boateng", "Owusu", "Amoah", "Osei", "Agyemang", "Adjei", "Amponsah", "Opoku", "Antwi", "Bonsu", "Darko", "Frimpong", "Gyasi", "Kusi", "Appiah", "Sarpong", "Tetteh", "Quaye", "Addo", "Baidoo", "Danso", "Fosu", "Gyamfi"];

const INSURANCE = ["NHIS", "Acacia Health", "Star Assurance", "Glico Health", "Metropolitan Health", null, null, null, null, null, null, null]; // ~30% insured

const COMPLAINTS: Record<string, string[]> = {
  general: ["Headache and dizziness for 3 days", "Persistent cough for 2 weeks", "Body pains and fatigue", "Abdominal pain since yesterday", "Skin rash spreading on arms", "Fever and chills for 1 week", "Lower back pain for 1 month", "Chest tightness on exertion", "Joint pain in both knees", "Difficulty sleeping for 2 weeks", "Frequent urination and thirst", "Loss of appetite for 5 days", "Sore throat and runny nose", "Unexplained weight loss", "Chronic constipation"],
  emergency: ["Severe chest pain radiating to left arm", "High fever 40°C with convulsions", "Road traffic accident — multiple injuries", "Severe asthma attack — cannot breathe", "Acute abdominal pain with vomiting blood", "Unconscious patient brought by NADMO", "Snake bite on left ankle", "Burns on torso and arms — cooking gas explosion", "Severe allergic reaction — swelling throat", "Stab wound to abdomen"],
  pediatrics: ["Child not feeding for 2 days", "High fever and crying constantly", "Diarrhea and vomiting since morning", "Rash all over body with itching", "Difficulty breathing — wheezing at night", "Fall from height — limping", "Seizure episode at school", "Ear pain and discharge"],
  obstetrics: ["Routine antenatal visit — 28 weeks", "Labour pains every 5 minutes", "Bleeding in first trimester", "Swollen feet and headache — 34 weeks", "Routine postnatal checkup", "Missed period — pregnancy test", "Severe morning sickness", "Baby not moving — 36 weeks"],
  surgery: ["Hernia repair consultation", "Appendicitis — right lower quadrant pain", "Abscess drainage needed", "Fracture right forearm from fall", "Lipoma removal on neck"],
  dental: ["Toothache for 1 week", "Wisdom tooth extraction needed", "Bleeding gums when brushing"],
  eye: ["Blurry vision getting worse", "Red eye with discharge", "Eye pain after welding"],
  ent: ["Hearing loss in right ear", "Chronic sinusitis — facial pain", "Foreign body in nose — child"],
};

const DIAGNOSES: Record<string, string[]> = {
  general: ["Malaria (uncomplicated)", "Upper Respiratory Tract Infection", "Peptic Ulcer Disease", "Hypertension Stage 1", "Type 2 Diabetes Mellitus", "Urinary Tract Infection", "Gastroenteritis", "Tension Headache", "Osteoarthritis", "Anemia"],
  emergency: ["Acute Myocardial Infarction", "Severe Malaria with Complications", "Polytrauma — RTA", "Status Asthmaticus", "Upper GI Bleeding", "Head Injury — GCS 8", "Envenomation — Snake Bite", "Major Burns 30% TBSA", "Anaphylaxis", "Penetrating Abdominal Trauma"],
  pediatrics: ["Acute Malaria", "Bronchopneumonia", "Acute Gastroenteritis with Dehydration", "Measles", "Sickle Cell Crisis"],
  obstetrics: ["Normal Pregnancy — ANC Visit", "Active Labour", "Threatened Abortion", "Pre-eclampsia", "Postpartum Check"],
  surgery: ["Inguinal Hernia", "Acute Appendicitis", "Perianal Abscess", "Distal Radius Fracture", "Subcutaneous Lipoma"],
};

const MEDICATIONS: Array<{ medication: string; dosage: string; frequency: string; duration: string }> = [
  { medication: "Artemether-Lumefantrine", dosage: "80/480mg", frequency: "Twice daily", duration: "3 days" },
  { medication: "Paracetamol", dosage: "1000mg", frequency: "Three times daily", duration: "5 days" },
  { medication: "Amoxicillin", dosage: "500mg", frequency: "Three times daily", duration: "7 days" },
  { medication: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "Ongoing" },
  { medication: "Amlodipine", dosage: "5mg", frequency: "Once daily", duration: "Ongoing" },
  { medication: "Omeprazole", dosage: "20mg", frequency: "Once daily", duration: "14 days" },
  { medication: "Ibuprofen", dosage: "400mg", frequency: "Three times daily", duration: "5 days" },
  { medication: "Ciprofloxacin", dosage: "500mg", frequency: "Twice daily", duration: "5 days" },
  { medication: "Diclofenac", dosage: "50mg", frequency: "Twice daily", duration: "3 days" },
  { medication: "ORS + Zinc", dosage: "1 sachet", frequency: "After each stool", duration: "3 days" },
  { medication: "Salbutamol Inhaler", dosage: "2 puffs", frequency: "As needed", duration: "Ongoing" },
  { medication: "Ferrous Sulphate", dosage: "200mg", frequency: "Three times daily", duration: "30 days" },
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] { const s = [...arr].sort(() => Math.random() - 0.5); return s.slice(0, n); }
function phone(): string { return `02${Math.floor(Math.random() * 10)}${Math.floor(10000000 + Math.random() * 90000000)}`; }
function age(min: number, max: number): number { return Math.floor(min + Math.random() * (max - min)); }
function randTime(hoursAgo: number): Date { return new Date(Date.now() - Math.random() * hoursAgo * 3600 * 1000); }

interface PatientConfig {
  department: string;
  severityRange: [number, number];
  visitStatus: string;
  emergency?: boolean;
  withPrescriptions?: boolean;
  withLabOrders?: boolean;
  withAdmission?: boolean;
  withAdmissionOrder?: boolean;
  ageRange?: [number, number];
}

async function main() {
  console.log("🏥 Seeding 100 patients for KBH...\n");

  const hospital = await db.hospital.findUnique({ where: { code: HOSPITAL_CODE } });
  if (!hospital) { console.error("Hospital KBH not found!"); process.exit(1); }

  // Clean up any previous seed data
  console.log("🧹 Cleaning previous seed data...");
  const prevSeeded = await db.patientRecord.findMany({ where: { hospitalId: hospital.id, createdBy: "seed_script" }, select: { id: true } });
  if (prevSeeded.length > 0) {
    const ids = prevSeeded.map(r => r.id);
    await db.labOrder.deleteMany({ where: { OR: [{ patientId: { in: ids } }, { labToken: { startsWith: "SEED-LAB-" } }] } });
    await db.billableItem.deleteMany({ where: { patientId: { in: ids } } });
    await db.patientRecord.deleteMany({ where: { id: { in: ids } } });
    console.log(`   Removed ${prevSeeded.length} previous seed records`);
  }

  const now = new Date();
  let book = await db.monthlyBook.findUnique({
    where: { hospitalId_year_month: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1 } },
  });
  if (!book) {
    book = await db.monthlyBook.create({
      data: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" },
    });
  }

  // Patient distribution
  const configs: PatientConfig[] = [
    // 25 General OPD — active, waiting to be seen
    ...Array(15).fill({ department: "general", severityRange: [2, 5] as [number, number], visitStatus: "active" }),
    // 10 General — already consulted, heading to pharmacy
    ...Array(10).fill({ department: "general", severityRange: [3, 6] as [number, number], visitStatus: "pharmacy", withPrescriptions: true }),
    // 12 Emergency patients
    ...Array(12).fill({ department: "emergency", severityRange: [8, 10] as [number, number], visitStatus: "active", emergency: true }),
    // 8 Pediatrics
    ...Array(8).fill({ department: "pediatrics", severityRange: [3, 7] as [number, number], visitStatus: "active", ageRange: [1, 14] as [number, number] }),
    // 8 Obstetrics
    ...Array(8).fill({ department: "obstetrics", severityRange: [3, 6] as [number, number], visitStatus: "active", ageRange: [18, 42] as [number, number] }),
    // 5 Surgery
    ...Array(5).fill({ department: "surgery", severityRange: [4, 7] as [number, number], visitStatus: "active" }),
    // 5 Dental
    ...Array(5).fill({ department: "dental", severityRange: [3, 5] as [number, number], visitStatus: "active" }),
    // 4 Eye
    ...Array(4).fill({ department: "eye", severityRange: [2, 4] as [number, number], visitStatus: "active" }),
    // 3 ENT
    ...Array(3).fill({ department: "ent", severityRange: [3, 5] as [number, number], visitStatus: "active" }),
    // 8 Lab patients — paused for lab
    ...Array(8).fill({ department: "general", severityRange: [4, 7] as [number, number], visitStatus: "paused_for_lab", withLabOrders: true }),
    // 7 Ward patients — admitted
    ...Array(7).fill({ department: "general", severityRange: [6, 8] as [number, number], visitStatus: "admitted", withAdmission: true }),
    // 5 Admission ordered — waiting for ward nurse
    ...Array(5).fill({ department: "general", severityRange: [5, 7] as [number, number], visitStatus: "in_consultation", withAdmissionOrder: true }),
    // 5 Completed / discharged
    ...Array(5).fill({ department: "general", severityRange: [2, 5] as [number, number], visitStatus: "closed", withPrescriptions: true }),
    // 5 Billing patients — awaiting payment
    ...Array(5).fill({ department: "general", severityRange: [3, 5] as [number, number], visitStatus: "awaiting_payment", withPrescriptions: true }),
  ];

  // Department counters for tokens
  const deptCounters: Record<string, number> = {};

  let created = 0;
  for (let i = 0; i < configs.length; i++) {
    const cfg = configs[i];
    const isFemale = Math.random() > 0.5;
    const firstName = pick(isFemale ? FIRST_NAMES_F : FIRST_NAMES_M);
    const lastName = pick(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const gender = isFemale ? "Female" : "Male";
    const patientAge = cfg.ageRange ? age(cfg.ageRange[0], cfg.ageRange[1]) : age(18, 75);
    const insurance = pick(INSURANCE);
    const severity = age(cfg.severityRange[0], cfg.severityRange[1]);
    const emergencyFlag = cfg.emergency || severity >= 8;

    // Token
    const dept = cfg.department;
    const prefix = emergencyFlag ? "ER" : ({ general: "GR", emergency: "ER", pediatrics: "PD", obstetrics: "OB", surgery: "SG", dental: "DN", eye: "EY", ent: "EN" }[dept] || "GR");
    const counterKey = prefix;
    deptCounters[counterKey] = (deptCounters[counterKey] || 0) + 1;
    const queueToken = `${prefix}-${HOSPITAL_CODE}-${String(deptCounters[counterKey]).padStart(3, "0")}`;

    // Complaint & diagnosis
    const complaints = COMPLAINTS[dept] || COMPLAINTS.general;
    const diagnoses = DIAGNOSES[dept] || DIAGNOSES.general;
    const chiefComplaint = pick(complaints);
    const primaryDiagnosis = cfg.visitStatus !== "active" ? pick(diagnoses) : null;

    // Prescriptions
    const prescriptions = cfg.withPrescriptions ? pickN(MEDICATIONS, age(1, 4)) : [];

    // Checkout PIN
    const checkoutPin = String(Math.floor(1000 + Math.random() * 9000));

    // Visit JSON
    const visitDate = randTime(8); // within last 8 hours
    const visit: Record<string, unknown> = {
      date: visitDate.toISOString(),
      chiefComplaint,
      department: dept,
      assignedDoctor: null,
      queueToken,
      entryPoint: "front_desk",
      symptomSeverity: severity,
      symptomDuration: pick(["1 day", "2 days", "3 days", "1 week", "2 weeks", "1 month"]),
      emergencyFlag,
      emergencyReason: emergencyFlag ? (severity >= 8 ? "severity_auto" : null) : null,
      checkoutPin,
      visitStatus: cfg.visitStatus,
    };

    // Admission order (doctor ordered, waiting for ward nurse)
    if (cfg.withAdmissionOrder) {
      visit.admissionOrdered = true;
      visit.admissionReason = primaryDiagnosis || chiefComplaint;
      visit.admissionOrderedBy = "doctor";
      visit.admissionOrderedByName = pick(["Dr. Kwame Mensah", "Dr. Ama Asante", "Dr. Kofi Boateng"]);
      visit.admissionOrderedAt = randTime(2).toISOString();
    }

    // Ward admission
    if (cfg.withAdmission) {
      const wardNames = ["Male Medical Ward", "Female Medical Ward", "Surgical Ward", "Pediatric Ward", "Emergency Ward"];
      const wardName = pick(wardNames);
      visit.admission = {
        admitted: true,
        admittedAt: randTime(48).toISOString(),
        admittedBy: "ward_nurse",
        wardName,
        bedLabel: `${pick(["A", "B", "C", "D"])}${age(1, 12)}`,
        bedId: null,
        admissionReason: primaryDiagnosis || chiefComplaint,
        assignedDoctor: null,
        assignedDoctorName: pick(["Dr. Kwame Mensah", "Dr. Ama Asante", "Dr. Kofi Boateng", "Dr. Yaw Frimpong"]),
        discharged: false,
        dailyRounds: Array.from({ length: age(1, 4) }, (_, ri) => ({
          id: `ROUND-${i}-${ri}`,
          date: randTime(24 * (ri + 1)).toISOString(),
          notes: pick(["Patient improving, vitals stable", "Mild fever persists, continue antibiotics", "Good recovery, plan discharge tomorrow", "Pain controlled, wound healing well"]),
          recordedBy: "ward_nurse",
        })),
      };
    }

    // Patient JSON
    const patient: Record<string, unknown> = {
      fullName,
      phone: phone(),
      dateOfBirth: `${2024 - patientAge}-${String(age(1, 12)).padStart(2, "0")}-${String(age(1, 28)).padStart(2, "0")}`,
      gender,
      age: patientAge,
      insuranceId: insurance ? `${insurance.substring(0, 3).toUpperCase()}-${age(100000, 999999)}` : null,
      insuranceProvider: insurance,
      address: pick(["Accra", "Tema", "Kumasi", "Cape Coast", "Takoradi", "Tamale", "Osu", "Madina", "Spintex", "East Legon", "Dansoman", "Kasoa"]),
    };

    // Obstetrics extras
    if (dept === "obstetrics") {
      patient.gravida = age(1, 5);
      patient.para = age(0, 3);
    }

    // Diagnosis JSON
    const diagnosis = {
      primary: primaryDiagnosis,
      secondary: [],
      icdCodes: [],
      notes: primaryDiagnosis ? pick(["Stable condition", "Needs follow-up in 2 weeks", "Monitor closely", "Improving on treatment"]) : null,
    };

    // Treatment JSON
    const treatment: Record<string, unknown> = {
      prescriptions,
      procedures: [],
      followUp: cfg.visitStatus === "closed" ? "2 weeks" : null,
      nextAppointment: null,
    };

    // Create record
    const record = await db.patientRecord.create({
      data: {
        bookId: book.id,
        hospitalId: hospital.id,
        patient: JSON.parse(JSON.stringify(patient)),
        visit: JSON.parse(JSON.stringify(visit)),
        diagnosis: JSON.parse(JSON.stringify(diagnosis)),
        treatment: JSON.parse(JSON.stringify(treatment)),
        entryPoint: "manual",
        createdBy: "seed_script",
        createdAt: visitDate,
      },
    });

    // Lab orders for paused_for_lab patients
    if (cfg.withLabOrders) {
      const labTests = pickN(["fbc", "mp", "rbs", "lfts", "rfts", "urinalysis", "widal", "hiv"], age(1, 4));
      const labCounter = (deptCounters["LAB"] = (deptCounters["LAB"] || 0) + 1);
      const labToken = `SEED-LAB-${HOSPITAL_CODE}-${String(labCounter).padStart(3, "0")}`;
      try {
        await db.labOrder.create({
          data: {
            patientId: record.id,
            hospital: { connect: { id: hospital.id } },
            book: { connect: { id: book.id } },
            labToken,
            tests: JSON.parse(JSON.stringify(labTests.map(t => ({ testName: t, category: "hematology", status: "pending" })))),
            clinicalNotes: chiefComplaint,
            orderedBy: pick(["Dr. Mensah", "Dr. Asante", "Dr. Boateng"]),
            status: "pending",
          },
        });
      } catch { /* lab order non-blocking */ }
    }

    // Billing items for pharmacy/closed/awaiting_payment patients
    if (cfg.withPrescriptions || cfg.visitStatus === "awaiting_payment") {
      try {
        await db.billableItem.create({
          data: {
            hospitalId: hospital.id,
            patientId: record.id,
            bookId: book.id,
            serviceType: "CONSULTATION",
            description: `Consultation: ${primaryDiagnosis || "General"}`,
            unitCost: pick([50, 80, 100, 120, 150]),
            quantity: 1,
            totalCost: pick([50, 80, 100, 120, 150]),
            renderedBy: "doctor",
          },
        });
        if (prescriptions.length > 0) {
          await db.billableItem.create({
            data: {
              hospitalId: hospital.id,
              patientId: record.id,
              bookId: book.id,
              serviceType: "MEDICATION",
              description: `Pharmacy: ${prescriptions.map(p => p.medication).join(", ")}`,
              unitCost: pick([20, 35, 50, 75, 100]),
              quantity: prescriptions.length,
              totalCost: pick([20, 35, 50, 75, 100]) * prescriptions.length,
              renderedBy: "pharmacist",
            },
          });
        }
      } catch { /* billable non-blocking */ }
    }

    created++;
    const statusIcon = emergencyFlag ? "🚨" : cfg.withAdmission ? "🏥" : cfg.withLabOrders ? "🔬" : cfg.withPrescriptions ? "💊" : "👤";
    console.log(`  ${statusIcon} ${String(created).padStart(3)} ${queueToken.padEnd(14)} ${fullName.padEnd(22)} ${dept.padEnd(12)} sev:${severity} ${cfg.visitStatus}`);
  }

  console.log(`\n✅ Created ${created} patients for KBH`);
  console.log(`   Tokens: ${Object.entries(deptCounters).map(([k, v]) => `${k}:${v}`).join(", ")}`);

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
