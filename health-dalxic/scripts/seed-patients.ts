/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf8");
const dbUrl = envContent.match(/DATABASE_URL="([^"]+)"/)?.[1];
if (!dbUrl) { console.error("No DATABASE_URL"); process.exit(1); }

// Load IDs from fresh-seed
const idsPath = path.resolve(__dirname, "seed-ids.json");
const { hospitalIds, bookIds } = JSON.parse(fs.readFileSync(idsPath, "utf8"));

// ─── Name pools ───
const MALE_FIRST = ["Kofi","Kwame","Kwesi","Yaw","Kojo","Kwabena","Kweku","Nii","Ebo","Ekow","Ibrahim","Alhassan","Abdul","Bashiru","Issaka"];
const FEMALE_FIRST = ["Ama","Akosua","Adwoa","Yaa","Adjoa","Abena","Efua","Esi","Afua","Akua","Fati","Amina","Rashida","Memuna","Araba"];
const LAST = ["Mensah","Asante","Boateng","Owusu","Darko","Adjei","Agyeman","Tetteh","Appiah","Amponsah","Ofori","Asare","Osei","Bonsu","Acquah","Larbi","Donkor","Sarpong","Gyamfi","Nkrumah","Opoku","Badu","Amoah","Poku","Nyarko","Quansah","Essien","Mills","Koomson","Otoo","Yakubu","Salifu","Mumuni","Alidu","Issah"];
const DEPARTMENTS = ["General OPD","Pediatrics","Surgery","Internal Medicine","ENT","Dental","Obstetrics & Gynaecology"];
const COMPLAINTS = ["Headache and fever for 3 days","Severe abdominal pain","Persistent cough for 2 weeks","High blood pressure check","Chest pain and shortness of breath","Malaria symptoms","Pregnancy check-up","Broken arm from fall","Difficulty breathing","Toothache","Back pain","Skin rash","Diarrhea and vomiting","Eye irritation","Sore throat","Joint pain","Urinary tract infection","Dizziness and fatigue","Burn injury","Allergic reaction"];
const INSURANCE = ["NHIS","Acacia","Metropolitan","Glico","Enterprise","self_pay"];
const PRESCRIPTIONS = [
  { drug: "Paracetamol 500mg", dosage: "1 tab 3x daily", duration: "5 days", quantity: 15 },
  { drug: "Amoxicillin 500mg", dosage: "1 cap 3x daily", duration: "7 days", quantity: 21 },
  { drug: "Artemether-Lumefantrine", dosage: "4 tabs 2x daily", duration: "3 days", quantity: 24 },
  { drug: "Omeprazole 20mg", dosage: "1 cap daily", duration: "14 days", quantity: 14 },
  { drug: "Metformin 500mg", dosage: "1 tab 2x daily", duration: "30 days", quantity: 60 },
  { drug: "Ibuprofen 400mg", dosage: "1 tab 3x daily", duration: "5 days", quantity: 15 },
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randPhone(): string { return `02${Math.floor(10000000 + Math.random() * 90000000)}`; }
function randAge(min: number, max: number): string {
  const age = min + Math.floor(Math.random() * (max - min));
  const y = 2026 - age;
  const m = String(1 + Math.floor(Math.random() * 12)).padStart(2, "0");
  const d = String(1 + Math.floor(Math.random() * 28)).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ─── Patient distribution ───
interface PatientSpec {
  hospital: string;
  type: string; // opd, er, maternity, lab, pharmacy, ward, icu, blood_bank, imaging, injection, billing
}

const DISTRIBUTION: PatientSpec[] = [
  // KBH (35)
  ...Array(10).fill(null).map(() => ({ hospital: "KBH", type: "opd" })),
  ...Array(5).fill(null).map(() => ({ hospital: "KBH", type: "er" })),
  ...Array(5).fill(null).map(() => ({ hospital: "KBH", type: "maternity" })),
  ...Array(5).fill(null).map(() => ({ hospital: "KBH", type: "lab" })),
  ...Array(3).fill(null).map(() => ({ hospital: "KBH", type: "pharmacy" })),
  ...Array(3).fill(null).map(() => ({ hospital: "KBH", type: "ward" })),
  ...Array(2).fill(null).map(() => ({ hospital: "KBH", type: "icu" })),
  ...Array(2).fill(null).map(() => ({ hospital: "KBH", type: "blood_bank" })),
  // KSI (20)
  ...Array(8).fill(null).map(() => ({ hospital: "KSI", type: "opd" })),
  ...Array(4).fill(null).map(() => ({ hospital: "KSI", type: "er" })),
  ...Array(3).fill(null).map(() => ({ hospital: "KSI", type: "maternity" })),
  ...Array(3).fill(null).map(() => ({ hospital: "KSI", type: "lab" })),
  ...Array(2).fill(null).map(() => ({ hospital: "KSI", type: "pharmacy" })),
  // RH (15)
  ...Array(6).fill(null).map(() => ({ hospital: "RH", type: "opd" })),
  ...Array(3).fill(null).map(() => ({ hospital: "RH", type: "lab" })),
  ...Array(2).fill(null).map(() => ({ hospital: "RH", type: "pharmacy" })),
  ...Array(2).fill(null).map(() => ({ hospital: "RH", type: "ward" })),
  ...Array(2).fill(null).map(() => ({ hospital: "RH", type: "imaging" })),
  // TAH (10)
  ...Array(5).fill(null).map(() => ({ hospital: "TAH", type: "opd" })),
  ...Array(2).fill(null).map(() => ({ hospital: "TAH", type: "lab" })),
  ...Array(2).fill(null).map(() => ({ hospital: "TAH", type: "pharmacy" })),
  ...Array(1).fill(null).map(() => ({ hospital: "TAH", type: "ward" })),
  // LKC (8)
  ...Array(4).fill(null).map(() => ({ hospital: "LKC", type: "opd" })),
  ...Array(2).fill(null).map(() => ({ hospital: "LKC", type: "lab" })),
  ...Array(2).fill(null).map(() => ({ hospital: "LKC", type: "injection" })),
  // CCH (6)
  ...Array(3).fill(null).map(() => ({ hospital: "CCH", type: "opd" })),
  ...Array(2).fill(null).map(() => ({ hospital: "CCH", type: "lab" })),
  ...Array(1).fill(null).map(() => ({ hospital: "CCH", type: "injection" })),
  // MPC (4)
  ...Array(3).fill(null).map(() => ({ hospital: "MPC", type: "opd" })),
  ...Array(1).fill(null).map(() => ({ hospital: "MPC", type: "pharmacy" })),
  // TDC (2)
  ...Array(2).fill(null).map(() => ({ hospital: "TDC", type: "opd" })),
];

async function main() {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  console.log("Connected to Neon");

  // Track token counters per hospital
  const tokenCounters: Record<string, number> = {};
  const erCounters: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (let i = 0; i < DISTRIBUTION.length; i++) {
    const spec = DISTRIBUTION[i];
    const code = spec.hospital;
    const hid = hospitalIds[code];
    const bid = bookIds[code];

    if (!hid || !bid) { console.log(`Skip: no IDs for ${code}`); continue; }

    tokenCounters[code] = (tokenCounters[code] || 0) + 1;
    counts[code] = (counts[code] || 0) + 1;

    const isMale = Math.random() > 0.5;
    const firstName = pick(isMale ? MALE_FIRST : FEMALE_FIRST);
    const lastName = pick(LAST);
    const fullName = `${firstName} ${lastName}`;
    const gender = spec.type === "maternity" ? "female" : (isMale ? "male" : "female");
    const phone = randPhone();
    const dob = spec.type === "maternity" ? randAge(18, 40) : randAge(1, 80);
    const hasInsurance = Math.random() < 0.3;

    // Token
    const isER = spec.type === "er";
    let queueToken: string;
    if (isER) {
      erCounters[code] = (erCounters[code] || 0) + 1;
      queueToken = `ER-${code}-${String(erCounters[code]).padStart(3, "0")}`;
    } else {
      queueToken = `${code}-${String(tokenCounters[code]).padStart(3, "0")}`;
    }

    const severity = isER ? (8 + Math.floor(Math.random() * 3)) : (1 + Math.floor(Math.random() * 7));
    const checkoutPin = String(1000 + Math.floor(Math.random() * 9000));
    const complaint = pick(COMPLAINTS);
    const dept = spec.type === "maternity" ? "Obstetrics & Gynaecology"
      : spec.type === "er" ? "Emergency"
      : code === "TDC" ? "Dental"
      : pick(DEPARTMENTS);

    // Visit status by type
    let visitStatus = "active";
    if (spec.type === "lab") visitStatus = "paused_for_lab";
    else if (spec.type === "pharmacy") visitStatus = "pharmacy";
    else if (spec.type === "ward" || spec.type === "icu") visitStatus = "admitted";

    const patient = {
      fullName, dateOfBirth: dob, gender, phone,
      insuranceId: hasInsurance ? `INS-${Math.floor(100000 + Math.random() * 900000)}` : null,
      insuranceProvider: hasInsurance ? pick(INSURANCE) : null,
      address: `${Math.floor(1 + Math.random() * 200)} ${pick(["Accra","Kumasi","Tamale","Cape Coast","Tema","Madina","Osu","Dansoman","Spintex","Kasoa"])} Road`,
      emergencyContact: `${pick(MALE_FIRST)} ${pick(LAST)} (${pick(["Mother","Father","Spouse","Sibling"])}) ${randPhone()}`,
    };

    const visit: Record<string, unknown> = {
      date: new Date().toISOString(),
      chiefComplaint: complaint,
      department: dept,
      assignedDoctor: null,
      queueToken,
      entryPoint: isER ? "emergency" : "front_desk",
      symptomSeverity: severity,
      emergencyFlag: isER,
      emergencyReason: isER ? "severity_auto" : null,
      checkoutPin,
      visitStatus,
      arrivalMode: isER ? pick(["ambulance","walk_in","transfer"]) : "walk_in",
      queuedAt: new Date().toISOString(),
    };

    // Maternity data
    if (spec.type === "maternity") {
      visit.maternity = {
        gravida: 1 + Math.floor(Math.random() * 4),
        para: Math.floor(Math.random() * 3),
        gestationalWeeks: 8 + Math.floor(Math.random() * 32),
        lastMenstrualPeriod: new Date(Date.now() - (8 + Math.floor(Math.random() * 32)) * 7 * 86400000).toISOString().split("T")[0],
        stage: pick(["antenatal","labour","postnatal"]),
      };
    }

    // Ward admission data (matches ward-ipd API: visit.admission.admitted)
    if (spec.type === "ward") {
      visit.admission = {
        admitted: true,
        admittedAt: new Date().toISOString(),
        admittedBy: "seed_script",
        wardType: "general",
        wardName: pick(["Male Ward","Female Ward","Surgical Ward","Pediatric Ward"]),
        bedLabel: `B-${1 + Math.floor(Math.random() * 20)}`,
        admissionReason: complaint,
        discharged: false,
        dailyRounds: [],
      };
    }

    // ICU admission data (matches icu API: visit.icuAdmission.admitted)
    if (spec.type === "icu") {
      visit.icuAdmission = {
        admitted: true,
        admittedAt: new Date().toISOString(),
        admittedBy: "seed_script",
        bedLabel: `ICU-${1 + Math.floor(Math.random() * 8)}`,
        diagnosis: complaint,
        ventilator: Math.random() > 0.5,
        ventilatorMode: pick(["SIMV","CPAP","BiPAP","none"]),
        discharged: false,
        hourlyObs: [],
      };
    }

    const treatment: Record<string, unknown> = {
      prescriptions: [],
      procedures: [],
      followUp: null,
      nextAppointment: null,
    };

    // Pharmacy patients get prescriptions
    if (spec.type === "pharmacy") {
      treatment.prescriptions = [pick(PRESCRIPTIONS), pick(PRESCRIPTIONS)];
    }

    // Blood bank patients get transfusion requests
    if (spec.type === "blood_bank") {
      treatment.transfusionRequests = [{
        id: `TRF-${Date.now()}-${i}`,
        bloodGroup: pick(["A+","B+","O+","AB+"]),
        component: pick(["whole_blood","packed_rbc"]),
        units: 1 + Math.floor(Math.random() * 2),
        urgency: pick(["routine","urgent","emergency"]),
        status: "pending",
        requestedBy: "doctor",
        requestedAt: new Date().toISOString(),
      }];
    }

    // Injection patients
    if (spec.type === "injection") {
      treatment.injections = [{
        id: `INJ-${Date.now()}-${i}`,
        medication: pick(["Diclofenac 75mg IM","Ceftriaxone 1g IV","Metoclopramide 10mg IM","Tramadol 50mg IM"]),
        route: pick(["intramuscular","intravenous"]),
        status: "pending",
        orderedBy: "doctor",
        orderedAt: new Date().toISOString(),
      }];
    }

    const diagnosis = {
      primary: spec.type === "opd" && Math.random() > 0.5 ? pick(["Malaria","Upper Respiratory Tract Infection","Hypertension","Type 2 Diabetes","Gastritis"]) : null,
      secondary: [],
      icdCodes: [],
      notes: null,
    };

    // Insert patient record
    const recId = `rec_${code.toLowerCase()}_${i}_${Date.now()}`;
    await client.query(
      `INSERT INTO patient_records (id, book_id, hospital_id, patient, visit, diagnosis, treatment, entry_point, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [recId, bid, hid, JSON.stringify(patient), JSON.stringify(visit), JSON.stringify(diagnosis), JSON.stringify(treatment),
       isER ? "emergency" : "manual", "seed_script"]
    );

    // Create lab orders for lab patients
    if (spec.type === "lab") {
      const labToken = `LAB-${code}-${String(tokenCounters[code]).padStart(3, "0")}`;
      const tests = [
        { testName: "Full Blood Count (CBC)", category: "haematology" },
        { testName: pick(["Malaria Parasite","Blood Film"]), category: "haematology" },
        { testName: pick(["Urinalysis","Urine Culture"]), category: "urine_stool" },
      ];
      await client.query(
        `INSERT INTO lab_orders (id, patient_id, hospital_id, book_id, ordered_by, tests, status, lab_token)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [`lab_${code.toLowerCase()}_${i}_${Date.now()}`, recId, hid, bid, "doctor", JSON.stringify(tests), "pending", labToken]
      );
    }

    // Create billable items for some patients
    if (spec.type === "pharmacy" || spec.type === "ward" || spec.type === "icu") {
      await client.query(
        `INSERT INTO billable_items (id, hospital_id, patient_id, book_id, service_type, description, unit_cost, quantity, total_cost, rendered_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [`bi_${code.toLowerCase()}_${i}_${Date.now()}`, hid, recId, bid,
         spec.type === "ward" ? "WARD_DAY" : spec.type === "icu" ? "ICU_DAY" : "CONSULTATION",
         spec.type === "ward" ? "Ward Day Charge" : spec.type === "icu" ? "ICU Day Charge" : "Consultation Fee",
         spec.type === "icu" ? 500 : spec.type === "ward" ? 200 : 80,
         1, spec.type === "icu" ? 500 : spec.type === "ward" ? 200 : 80,
         "system"]
      );
    }
  }

  await client.end();

  console.log("\n========================================");
  console.log("100 PATIENTS SEEDED");
  console.log("========================================");
  for (const [code, count] of Object.entries(counts).sort((a, b) => (b[1] as number) - (a[1] as number))) {
    console.log(`  ${code}: ${count} patients`);
  }
  console.log(`  ER tokens: ${Object.values(erCounters).reduce((a: number, b: unknown) => a + (b as number), 0)}`);
  console.log("========================================");
}

main().catch((e) => { console.error("FAILED:", e); process.exit(1); });
