/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Live Demo Seed — registers patients through the API (not direct DB)
 * so Pusher real-time events fire on the waiting room and all stations.
 *
 * Usage: npx tsx scripts/live-demo-seed.ts
 * Uses localhost:3000 by default, or pass URL: npx tsx scripts/live-demo-seed.ts https://health.dalxic.com
 */

const BASE = process.argv[2] || "http://localhost:3000";

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randPhone(): string { return `02${Math.floor(10000000 + Math.random() * 90000000)}`; }
function randDob(minAge: number, maxAge: number): string {
  const age = minAge + Math.floor(Math.random() * (maxAge - minAge));
  const y = 2026 - age;
  const m = String(1 + Math.floor(Math.random() * 12)).padStart(2, "0");
  const d = String(1 + Math.floor(Math.random() * 28)).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const MALE = ["Kofi","Kwame","Kwesi","Yaw","Kojo","Kwabena","Kweku","Nii","Ebo","Ekow","Ibrahim","Alhassan","Abdul"];
const FEMALE = ["Ama","Akosua","Adwoa","Yaa","Adjoa","Abena","Efua","Esi","Afua","Akua","Fati","Amina","Rashida"];
const LAST = ["Mensah","Asante","Boateng","Owusu","Darko","Adjei","Agyeman","Tetteh","Appiah","Amponsah","Ofori","Asare","Osei","Bonsu","Acquah","Donkor","Sarpong","Gyamfi","Nkrumah","Opoku"];
const COMPLAINTS = [
  "Headache and fever for 3 days","Severe abdominal pain","Persistent cough for 2 weeks",
  "High blood pressure check","Chest pain and shortness of breath","Malaria symptoms",
  "Broken arm from fall","Difficulty breathing","Toothache","Back pain",
  "Skin rash","Diarrhea and vomiting","Eye irritation","Sore throat",
  "Joint pain","Dizziness and fatigue","Burn injury","Allergic reaction",
];
const DEPARTMENTS = ["General OPD","Pediatrics","Surgery","Internal Medicine","ENT","Dental","Obstetrics & Gynaecology"];
const INSURANCE = ["NHIS","Acacia","Metropolitan","Glico","Enterprise"];

// Patients to register via API — spread across hospitals with realistic delays
interface DemoPatient {
  hospitalCode: string;
  delay: number; // seconds after start
}

const DEMO_QUEUE: DemoPatient[] = [
  // KBH — busy T4 hospital, patients arriving fast
  { hospitalCode: "KBH", delay: 0 },
  { hospitalCode: "KBH", delay: 2 },
  { hospitalCode: "KBH", delay: 4 },
  { hospitalCode: "KBH", delay: 7 },
  { hospitalCode: "KBH", delay: 10 },
  { hospitalCode: "KBH", delay: 14 },
  { hospitalCode: "KBH", delay: 18 },
  { hospitalCode: "KBH", delay: 22 },
  // KSI — second busy hospital
  { hospitalCode: "KSI", delay: 3 },
  { hospitalCode: "KSI", delay: 8 },
  { hospitalCode: "KSI", delay: 13 },
  { hospitalCode: "KSI", delay: 19 },
  { hospitalCode: "KSI", delay: 24 },
  // RH — moderate flow
  { hospitalCode: "RH", delay: 5 },
  { hospitalCode: "RH", delay: 12 },
  { hospitalCode: "RH", delay: 20 },
  // TAH
  { hospitalCode: "TAH", delay: 6 },
  { hospitalCode: "TAH", delay: 16 },
  // LKC — clinic pace
  { hospitalCode: "LKC", delay: 9 },
  { hospitalCode: "LKC", delay: 21 },
  // CCH
  { hospitalCode: "CCH", delay: 11 },
  // MPC — small clinic
  { hospitalCode: "MPC", delay: 15 },
  // TDC — dental
  { hospitalCode: "TDC", delay: 17 },
  // More KBH arrivals — second wave
  { hospitalCode: "KBH", delay: 26 },
  { hospitalCode: "KBH", delay: 29 },
  { hospitalCode: "KBH", delay: 32 },
  // Emergency cases — high severity
  { hospitalCode: "KBH", delay: 35 },
  { hospitalCode: "KSI", delay: 37 },
];

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function registerPatient(hospitalCode: string, index: number, isEmergency = false) {
  const isMale = Math.random() > 0.5;
  const firstName = pick(isMale ? MALE : FEMALE);
  const lastName = pick(LAST);
  const hasInsurance = Math.random() < 0.35;
  const severity = isEmergency ? (8 + Math.floor(Math.random() * 3)) : (1 + Math.floor(Math.random() * 7));

  const body = {
    hospitalCode,
    patient: {
      fullName: `${firstName} ${lastName}`,
      dateOfBirth: randDob(1, 75),
      gender: isMale ? "male" : "female",
      phone: randPhone(),
      insuranceId: hasInsurance ? `INS-${Math.floor(100000 + Math.random() * 900000)}` : null,
      insuranceProvider: hasInsurance ? pick(INSURANCE) : null,
      address: `${Math.floor(1 + Math.random() * 200)} ${pick(["Accra","Kumasi","Tamale","Cape Coast","Tema","Madina","Osu","Dansoman"])} Road`,
      emergencyContact: `${pick(MALE)} ${pick(LAST)} (${pick(["Mother","Father","Spouse","Sibling"])}) ${randPhone()}`,
    },
    chiefComplaint: pick(COMPLAINTS),
    department: hospitalCode === "TDC" ? "Dental" : pick(DEPARTMENTS),
    symptomSeverity: severity,
    operatorId: "demo_operator",
    operatorName: "Demo Operator",
  };

  try {
    const res = await fetch(`${BASE}/api/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const flag = data.emergencyFlag ? " 🚨 EMERGENCY" : "";
    console.log(`  [${String(index + 1).padStart(2, "0")}] ${hospitalCode} → ${data.queueToken} — ${body.patient.fullName} (severity ${severity})${flag}`);
  } catch (err) {
    console.error(`  [${String(index + 1).padStart(2, "0")}] ${hospitalCode} — FAILED:`, err);
  }
}

async function main() {
  console.log(`\n🏥 DALXICHEALTH LIVE DEMO`);
  console.log(`   Target: ${BASE}`);
  console.log(`   Patients: ${DEMO_QUEUE.length}`);
  console.log(`   Duration: ~40 seconds\n`);
  console.log(`   Open the waiting room to watch patients appear in real time!\n`);
  console.log("─".repeat(60));

  const start = Date.now();

  for (let i = 0; i < DEMO_QUEUE.length; i++) {
    const entry = DEMO_QUEUE[i];
    const elapsed = (Date.now() - start) / 1000;
    const waitFor = entry.delay - elapsed;
    if (waitFor > 0) await sleep(waitFor * 1000);

    // Last 2 entries are emergency cases
    const isEmergency = i >= DEMO_QUEUE.length - 2;
    await registerPatient(entry.hospitalCode, i, isEmergency);
  }

  console.log("─".repeat(60));
  console.log(`\n✅ Demo complete — ${DEMO_QUEUE.length} patients registered across 8 hospitals\n`);
}

main().catch(e => { console.error("FAILED:", e); process.exit(1); });
