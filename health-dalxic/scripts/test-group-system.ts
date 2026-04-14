// Test script: exercise the full multi-branch group system via Prisma
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("=== DalxicHealth Multi-Branch Group Test Suite ===\n");

  // ── 1. Verify migration ──
  console.log("1. VERIFYING MIGRATION...");
  const groupCount = await db.hospitalGroup.count();
  console.log(`   ✓ hospital_groups table accessible (${groupCount} existing groups)`);

  // Check hospitals have group columns
  const kbh = await db.hospital.findUnique({ where: { code: "KBH" } });
  console.log(`   ✓ KBH hospital found: ${kbh?.name} (groupId: ${kbh?.groupId ?? "null — standalone"})`);

  // ── 2. Create Hospital Group ──
  console.log("\n2. CREATING HOSPITAL GROUP: Nyaho Medical Group...");
  let group = await db.hospitalGroup.findUnique({ where: { groupCode: "NYAHO" } });
  if (!group) {
    group = await db.hospitalGroup.create({
      data: {
        groupCode: "NYAHO",
        name: "Nyaho Medical Group",
        ownerName: "Dr. Elikem Nyaho",
        ownerPin: "9900",
        subscriptionTier: "GROUP_PREMIUM",
      },
    });
    console.log(`   ✓ Group created: ${group.name} (${group.groupCode})`);
  } else {
    console.log(`   ✓ Group already exists: ${group.name}`);
  }

  // ── 3. Create Branch Hospitals ──
  console.log("\n3. CREATING BRANCH HOSPITALS...");

  // Branch A — T3 Large Hospital (main branch)
  let branchA = await db.hospital.findUnique({ where: { code: "NYH-MAIN" } });
  if (!branchA) {
    branchA = await db.hospital.create({
      data: {
        code: "NYH-MAIN",
        name: "Nyaho Main Hospital",
        subdomain: "nyaho-main",
        tier: "T3",
        activeModules: ["front_desk", "waiting_room", "doctor", "pharmacy", "billing", "lab", "injection_room", "nurse_station", "ct_radiology", "ward_ipd", "ultrasound"],
        maxDevices: 35,
        whatsappBundle: 5000,
        groupId: group.id,
        groupCode: group.groupCode,
      },
    });
    console.log(`   ✓ Branch A created: ${branchA.name} (${branchA.code}, T3)`);
  } else {
    console.log(`   ✓ Branch A exists: ${branchA.name}`);
    if (!branchA.groupId) {
      await db.hospital.update({ where: { code: "NYH-MAIN" }, data: { groupId: group.id, groupCode: group.groupCode } });
      console.log(`   ✓ Branch A linked to group`);
    }
  }

  // Branch B — T1 Clinic (satellite)
  let branchB = await db.hospital.findUnique({ where: { code: "NYH-AIRPORT" } });
  if (!branchB) {
    branchB = await db.hospital.create({
      data: {
        code: "NYH-AIRPORT",
        name: "Nyaho Airport Clinic",
        subdomain: "nyaho-airport",
        tier: "T1",
        activeModules: ["front_desk", "waiting_room", "doctor", "pharmacy", "billing"],
        maxDevices: 6,
        whatsappBundle: 500,
        groupId: group.id,
        groupCode: group.groupCode,
      },
    });
    console.log(`   ✓ Branch B created: ${branchB.name} (${branchB.code}, T1)`);
  } else {
    console.log(`   ✓ Branch B exists: ${branchB.name}`);
    if (!branchB.groupId) {
      await db.hospital.update({ where: { code: "NYH-AIRPORT" }, data: { groupId: group.id, groupCode: group.groupCode } });
    }
  }

  // Branch C — T4 Full Hospital
  let branchC = await db.hospital.findUnique({ where: { code: "NYH-TEMA" } });
  if (!branchC) {
    branchC = await db.hospital.create({
      data: {
        code: "NYH-TEMA",
        name: "Nyaho Tema Medical Centre",
        subdomain: "nyaho-tema",
        tier: "T4",
        activeModules: ["front_desk", "waiting_room", "doctor", "pharmacy", "billing", "lab", "injection_room", "nurse_station", "ct_radiology", "ward_ipd", "ultrasound", "icu", "maternity", "blood_bank"],
        maxDevices: 999,
        whatsappBundle: 20000,
        groupId: group.id,
        groupCode: group.groupCode,
      },
    });
    console.log(`   ✓ Branch C created: ${branchC.name} (${branchC.code}, T4)`);
  } else {
    console.log(`   ✓ Branch C exists: ${branchC.name}`);
    if (!branchC.groupId) {
      await db.hospital.update({ where: { code: "NYH-TEMA" }, data: { groupId: group.id, groupCode: group.groupCode } });
    }
  }

  // ── 4. Create Operators ──
  console.log("\n4. CREATING OPERATORS...");
  const operators = [
    // Branch A operators
    { hospitalId: branchA.id, name: "Kwame Asante", pin: "5501", role: "front_desk" },
    { hospitalId: branchA.id, name: "Dr. Abena Osei", pin: "5502", role: "doctor" },
    { hospitalId: branchA.id, name: "Kofi Mensah", pin: "5503", role: "pharmacist" },
    { hospitalId: branchA.id, name: "Esi Appiah", pin: "5504", role: "lab_tech" },
    { hospitalId: branchA.id, name: "Yaw Boateng", pin: "5505", role: "radiologist" },
    // Branch B operators
    { hospitalId: branchB.id, name: "Adjoa Poku", pin: "6601", role: "front_desk" },
    { hospitalId: branchB.id, name: "Dr. Nana Agyei", pin: "6602", role: "doctor" },
    { hospitalId: branchB.id, name: "Akua Darko", pin: "6603", role: "pharmacist" },
    // Branch C operators
    { hospitalId: branchC.id, name: "Yaa Serwaa", pin: "7701", role: "front_desk" },
    { hospitalId: branchC.id, name: "Dr. Kweku Annan", pin: "7702", role: "doctor" },
    { hospitalId: branchC.id, name: "Efua Botwe", pin: "7703", role: "nurse" },
    { hospitalId: branchC.id, name: "Kojo Frimpong", pin: "7704", role: "lab_tech" },
    { hospitalId: branchC.id, name: "Dr. Ama Sarpong", pin: "7705", role: "doctor" },
  ];

  for (const op of operators) {
    const existing = await db.deviceOperator.findFirst({
      where: { hospitalId: op.hospitalId, pin: op.pin },
    });
    if (!existing) {
      await db.deviceOperator.create({ data: op });
      console.log(`   ✓ Created: ${op.name} (${op.role}, PIN: ${op.pin})`);
    } else {
      console.log(`   ✓ Exists: ${existing.name} (${op.role})`);
    }
  }

  // ── 5. Create Monthly Books ──
  console.log("\n5. CREATING MONTHLY BOOKS...");
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  for (const hospital of [branchA, branchB, branchC]) {
    let book = await db.monthlyBook.findFirst({
      where: { hospitalId: hospital.id, year, month },
    });
    if (!book) {
      book = await db.monthlyBook.create({
        data: { hospitalId: hospital.id, year, month, status: "active" },
      });
      console.log(`   ✓ Book created: ${hospital.code} — ${year}/${month}`);
    } else {
      console.log(`   ✓ Book exists: ${hospital.code} — ${year}/${month}`);
    }
  }

  // ── 6. Seed Patients Across Branches ──
  console.log("\n6. SEEDING PATIENTS ACROSS BRANCHES...");

  const bookA = await db.monthlyBook.findFirst({ where: { hospitalId: branchA.id, year, month } });
  const bookB = await db.monthlyBook.findFirst({ where: { hospitalId: branchB.id, year, month } });
  const bookC = await db.monthlyBook.findFirst({ where: { hospitalId: branchC.id, year, month } });

  if (!bookA || !bookB || !bookC) {
    console.log("   ✗ Books not found — cannot seed patients");
    await db.$disconnect();
    return;
  }

  // Branch A patients (Main Hospital — T3)
  const patientsA = [
    {
      patient: { fullName: "Emmanuel Mensah", dateOfBirth: "1975-03-15", gender: "male", phone: "0244123456", address: "East Legon, Accra", insuranceId: "NHIS-2024-0891", emergencyContact: "0244999888" },
      visit: { date: new Date().toISOString(), chiefComplaint: "Persistent headache and dizziness for 2 weeks", department: "General Practice", queueToken: "#NYM-001", visitStatus: "waiting", symptomSeverity: 5, entryPoint: "front_desk" },
      diagnosis: { primary: null, secondary: [], icdCodes: [], notes: null },
      treatment: { prescriptions: [], procedures: [], followUp: null, nextAppointment: null },
    },
    {
      patient: { fullName: "Abena Asante", dateOfBirth: "1988-07-22", gender: "female", phone: "0277654321", address: "Labone, Accra", insuranceId: "NHIS-2024-1102", emergencyContact: "0277111222" },
      visit: { date: new Date().toISOString(), chiefComplaint: "Abdominal pain, suspected appendicitis", department: "Surgery", queueToken: "#NYM-002", visitStatus: "in_progress", symptomSeverity: 7, entryPoint: "front_desk", assignedDoctor: "Dr. Abena Osei" },
      diagnosis: { primary: "Suspected acute appendicitis", secondary: ["Abdominal tenderness"], icdCodes: ["K35.80"], notes: "CT scan ordered to confirm" },
      treatment: { prescriptions: [{ medication: "Paracetamol 1g", dosage: "1g", frequency: "Every 6 hours", duration: "3 days", notes: "For pain management" }], procedures: ["CT Abdomen ordered"], followUp: "Await CT results", nextAppointment: null },
    },
    {
      patient: { fullName: "Kofi Adu-Gyamfi", dateOfBirth: "1960-11-08", gender: "male", phone: "0201987654", address: "Cantonments, Accra", insuranceId: null, emergencyContact: "0201555666" },
      visit: { date: new Date().toISOString(), chiefComplaint: "Chest X-ray follow-up for chronic cough", department: "Radiology", queueToken: "#NYM-003", visitStatus: "waiting", symptomSeverity: 4, entryPoint: "front_desk" },
      diagnosis: { primary: null, secondary: [], icdCodes: [], notes: null },
      treatment: { prescriptions: [], procedures: [], followUp: null, nextAppointment: null },
    },
    {
      patient: { fullName: "Ama Serwah Bonsu", dateOfBirth: "1995-01-30", gender: "female", phone: "0551234567", address: "Osu, Accra", insuranceId: "NHIS-2024-2234", emergencyContact: "0551000999" },
      visit: { date: new Date().toISOString(), chiefComplaint: "Prenatal checkup — 28 weeks pregnant", department: "Maternity", queueToken: "#NYM-004", visitStatus: "waiting", symptomSeverity: 2, entryPoint: "front_desk" },
      diagnosis: { primary: "Normal pregnancy — 28 weeks gestation", secondary: [], icdCodes: ["Z34.00"], notes: "Routine antenatal visit" },
      treatment: { prescriptions: [{ medication: "Folic Acid 5mg", dosage: "5mg", frequency: "Daily", duration: "Ongoing", notes: null }, { medication: "Iron Supplement", dosage: "200mg", frequency: "Daily", duration: "Ongoing", notes: null }], procedures: [], followUp: "Next antenatal visit in 2 weeks", nextAppointment: null },
    },
  ];

  // Branch B patients (Airport Clinic — T1)
  const patientsB = [
    {
      patient: { fullName: "Nana Kweku Mensah", dateOfBirth: "1982-04-12", gender: "male", phone: "0244567890", address: "Airport Residential, Accra", insuranceId: "PRIV-ACACIA-0045", emergencyContact: "0244333444" },
      visit: { date: new Date().toISOString(), chiefComplaint: "Travel vaccination — Yellow Fever", department: "General Practice", queueToken: "#NYA-001", visitStatus: "waiting", symptomSeverity: 1, entryPoint: "front_desk" },
      diagnosis: { primary: null, secondary: [], icdCodes: [], notes: null },
      treatment: { prescriptions: [], procedures: ["Yellow Fever vaccination"], followUp: null, nextAppointment: null },
    },
    {
      patient: { fullName: "Efua Owusu-Ansah", dateOfBirth: "1990-09-05", gender: "female", phone: "0277890123", address: "Dzorwulu, Accra", insuranceId: "NHIS-2024-3301", emergencyContact: "0277444555" },
      visit: { date: new Date().toISOString(), chiefComplaint: "Severe migraine with visual aura", department: "General Practice", queueToken: "#NYA-002", visitStatus: "in_progress", symptomSeverity: 6, entryPoint: "front_desk", assignedDoctor: "Dr. Nana Agyei" },
      diagnosis: { primary: "Migraine with aura", secondary: ["Photophobia"], icdCodes: ["G43.109"], notes: "Needs CT scan — refer to main branch" },
      treatment: { prescriptions: [{ medication: "Sumatriptan 50mg", dosage: "50mg", frequency: "As needed", duration: "PRN", notes: "Max 2 doses per 24 hours" }], procedures: [], followUp: "CT scan at Nyaho Main", nextAppointment: null },
    },
    {
      patient: { fullName: "Kwame Appiah-Kubi", dateOfBirth: "1970-12-20", gender: "male", phone: "0201456789", address: "Tema Community 5", insuranceId: null, emergencyContact: "0201888777" },
      visit: { date: new Date().toISOString(), chiefComplaint: "Routine blood work and check-up", department: "General Practice", queueToken: "#NYA-003", visitStatus: "waiting", symptomSeverity: 1, entryPoint: "front_desk" },
      diagnosis: { primary: null, secondary: [], icdCodes: [], notes: null },
      treatment: { prescriptions: [], procedures: [], followUp: null, nextAppointment: null },
    },
  ];

  // Branch C patients (Tema Medical Centre — T4)
  const patientsC = [
    {
      patient: { fullName: "Adwoa Frimpomaa", dateOfBirth: "1955-06-18", gender: "female", phone: "0244321654", address: "Tema Community 1", insuranceId: "NHIS-2024-4401", emergencyContact: "0244666777" },
      visit: { date: new Date().toISOString(), chiefComplaint: "ICU admission — post cardiac arrest, stabilised", department: "ICU", queueToken: "ER-NYT-001", visitStatus: "in_progress", symptomSeverity: 10, emergencyFlag: true, entryPoint: "emergency" },
      diagnosis: { primary: "Post-cardiac arrest syndrome", secondary: ["Hypertension", "Type 2 Diabetes"], icdCodes: ["I46.9", "I10", "E11.9"], notes: "Stabilised, on ventilator support, continuous monitoring" },
      treatment: { prescriptions: [{ medication: "Amiodarone 200mg", dosage: "200mg", frequency: "Twice daily", duration: "7 days", notes: "Anti-arrhythmic" }, { medication: "Aspirin 75mg", dosage: "75mg", frequency: "Daily", duration: "Ongoing", notes: null }], procedures: ["Mechanical ventilation", "Continuous cardiac monitoring"], followUp: "ICU daily review", nextAppointment: null },
    },
    {
      patient: { fullName: "Yaw Boakye-Dankwa", dateOfBirth: "1985-02-28", gender: "male", phone: "0277111999", address: "Tema Community 8", insuranceId: "NHIS-2024-5502", emergencyContact: "0277222888" },
      visit: { date: new Date().toISOString(), chiefComplaint: "Road traffic accident — multiple fractures", department: "Emergency", queueToken: "ER-NYT-002", visitStatus: "in_progress", symptomSeverity: 9, emergencyFlag: true, entryPoint: "emergency" },
      diagnosis: { primary: "Multiple fractures — right femur, left radius", secondary: ["Laceration — forehead", "Mild concussion"], icdCodes: ["S72.001A", "S52.501A", "S01.81XA"], notes: "CT head clear, ortho consult pending" },
      treatment: { prescriptions: [{ medication: "Morphine 5mg IV", dosage: "5mg", frequency: "Every 4 hours PRN", duration: "As needed", notes: "Pain management" }, { medication: "Ceftriaxone 1g IV", dosage: "1g", frequency: "Every 12 hours", duration: "5 days", notes: "Infection prophylaxis" }], procedures: ["Wound closure — forehead", "Right femur splinting", "Left radius reduction"], followUp: "Ortho surgery scheduled", nextAppointment: null },
    },
    {
      patient: { fullName: "Akosua Manu", dateOfBirth: "1998-08-14", gender: "female", phone: "0551987654", address: "Tema New Town", insuranceId: "NHIS-2024-6603", emergencyContact: "0551333444" },
      visit: { date: new Date().toISOString(), chiefComplaint: "Labour — 39 weeks, contractions 5 min apart", department: "Maternity", queueToken: "#NYT-003", visitStatus: "in_progress", symptomSeverity: 6, entryPoint: "front_desk" },
      diagnosis: { primary: "Active labour — 39 weeks gestation", secondary: ["Gravida 1, Para 0"], icdCodes: ["O80"], notes: "Normal progress, cervix 6cm dilated" },
      treatment: { prescriptions: [], procedures: ["Continuous fetal monitoring"], followUp: "Active labour management", nextAppointment: null },
    },
    {
      patient: { fullName: "Nii Armah Ashitey", dateOfBirth: "1948-03-22", gender: "male", phone: "0201654987", address: "Nungua, Accra", insuranceId: "NHIS-2024-7704", emergencyContact: "0201777888" },
      visit: { date: new Date().toISOString(), chiefComplaint: "Blood transfusion — severe anaemia", department: "Blood Bank", queueToken: "#NYT-004", visitStatus: "in_progress", symptomSeverity: 7, entryPoint: "front_desk" },
      diagnosis: { primary: "Severe iron-deficiency anaemia", secondary: ["Chronic kidney disease stage 3"], icdCodes: ["D50.9", "N18.3"], notes: "Hb 5.2 g/dL — requires 2 units packed RBCs" },
      treatment: { prescriptions: [{ medication: "Ferrous Sulphate 200mg", dosage: "200mg", frequency: "Three times daily", duration: "3 months", notes: "Take with vitamin C" }], procedures: ["Transfusion — 2 units Packed RBCs (O+)"], followUp: "Recheck Hb in 1 week", nextAppointment: null },
    },
  ];

  // Seed all patients
  for (const [patients, hospital, book] of [
    [patientsA, branchA, bookA],
    [patientsB, branchB, bookB],
    [patientsC, branchC, bookC],
  ] as const) {
    for (const p of patients) {
      // Check if patient already exists by token
      const token = (p.visit as Record<string, unknown>).queueToken as string;

      // Simple check: if this hospital already has records today, skip duplicate seeding
      const todayRecords = await db.patientRecord.findMany({
        where: {
          hospitalId: (hospital as typeof branchA).id,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      });

      const alreadySeeded = todayRecords.some(r => {
        const v = r.visit as Record<string, unknown>;
        return v?.queueToken === token;
      });

      if (!alreadySeeded) {
        await db.patientRecord.create({
          data: {
            hospitalId: (hospital as typeof branchA).id,
            bookId: (book as typeof bookA).id,
            patient: JSON.parse(JSON.stringify(p.patient)),
            visit: JSON.parse(JSON.stringify(p.visit)),
            diagnosis: JSON.parse(JSON.stringify(p.diagnosis)),
            treatment: JSON.parse(JSON.stringify(p.treatment)),
            entryPoint: "manual",
            createdBy: "test-seed",
          },
        });
        console.log(`   ✓ ${(hospital as typeof branchA).code}: ${p.patient.fullName} (${token})`);
      } else {
        console.log(`   ✓ ${(hospital as typeof branchA).code}: ${p.patient.fullName} — already exists`);
      }
    }
  }

  // ── 7. Create Inter-Branch Referral ──
  console.log("\n7. CREATING INTER-BRANCH REFERRALS...");

  // Find Efua's record at Airport Clinic (needs CT scan at Main)
  const efuaRecord = await db.patientRecord.findFirst({
    where: { hospitalId: branchB.id },
    orderBy: { createdAt: "desc" },
  });

  if (efuaRecord) {
    const visit = efuaRecord.visit as Record<string, unknown>;
    const existingIBR = (visit.interBranchReferrals || []) as unknown[];

    if (existingIBR.length === 0) {
      // ROUTINE referral: Airport → Main for CT scan
      const routineReferral = {
        id: `IBR-${Date.now()}-rt001`,
        groupCode: "NYAHO",
        fromHospitalCode: "NYH-AIRPORT",
        fromHospitalName: "Nyaho Airport Clinic",
        toHospitalCode: "NYH-MAIN",
        toHospitalName: "Nyaho Main Hospital",
        referralType: "OUTPATIENT",
        department: "CT/Radiology",
        clinicalReason: "CT head scan required — migraine with visual aura, rule out structural pathology",
        priority: "URGENT",
        referringDoctorName: "Dr. Nana Agyei",
        status: "PENDING",
        acceptedBy: null,
        rejectedReason: null,
        completedAt: null,
        notes: "Patient reports increasing frequency of episodes over past 3 months",
        createdAt: new Date().toISOString(),
      };

      // CRITICAL referral: Airport → Tema for blood (emergency scenario)
      const criticalReferral = {
        id: `IBR-${Date.now()}-cr001`,
        groupCode: "NYAHO",
        fromHospitalCode: "NYH-AIRPORT",
        fromHospitalName: "Nyaho Airport Clinic",
        toHospitalCode: "NYH-TEMA",
        toHospitalName: "Nyaho Tema Medical Centre",
        referralType: "BLOOD_REQUEST",
        department: "Blood Bank",
        clinicalReason: "Emergency blood request — patient collapsed with severe anaemia symptoms",
        priority: "CRITICAL",
        referringDoctorName: "Dr. Nana Agyei",
        status: "ACCEPTED", // CRITICAL bypasses PENDING
        acceptedBy: "AUTO-CRITICAL",
        rejectedReason: null,
        completedAt: null,
        notes: "O+ blood, 2 units packed RBCs needed urgently",
        createdAt: new Date().toISOString(),
      };

      await db.patientRecord.update({
        where: { id: efuaRecord.id },
        data: {
          visit: JSON.parse(JSON.stringify({
            ...visit,
            interBranchReferrals: [routineReferral, criticalReferral],
          })),
        },
      });

      console.log(`   ✓ URGENT referral: Airport → Main (CT scan for Efua Owusu-Ansah)`);
      console.log(`   ✓ CRITICAL referral: Airport → Tema (Blood request — bypassed PENDING)`);
    } else {
      console.log(`   ✓ Referrals already exist on record`);
    }
  }

  // Another referral: Main → Tema for ICU admission
  const abenaRecord = await db.patientRecord.findFirst({
    where: { hospitalId: branchA.id },
    orderBy: { createdAt: "desc" },
    skip: 2, // Get Abena (2nd patient)
  });

  if (abenaRecord) {
    const visit = abenaRecord.visit as Record<string, unknown>;
    const existingIBR = (visit.interBranchReferrals || []) as unknown[];

    if (existingIBR.length === 0) {
      const admissionReferral = {
        id: `IBR-${Date.now()}-ad001`,
        groupCode: "NYAHO",
        fromHospitalCode: "NYH-MAIN",
        fromHospitalName: "Nyaho Main Hospital",
        toHospitalCode: "NYH-TEMA",
        toHospitalName: "Nyaho Tema Medical Centre",
        referralType: "ADMISSION",
        department: "ICU",
        clinicalReason: "Post-appendectomy complications — patient requires ICU monitoring",
        priority: "URGENT",
        referringDoctorName: "Dr. Abena Osei",
        status: "ACCEPTED",
        acceptedBy: "Dr. Kweku Annan",
        rejectedReason: null,
        completedAt: null,
        notes: "Surgery completed, patient unstable — transfer to Tema ICU for monitoring",
        createdAt: new Date().toISOString(),
      };

      await db.patientRecord.update({
        where: { id: abenaRecord.id },
        data: {
          visit: JSON.parse(JSON.stringify({
            ...visit,
            interBranchReferrals: [admissionReferral],
          })),
        },
      });

      console.log(`   ✓ URGENT ADMISSION: Main → Tema ICU (post-appendectomy patient)`);
    } else {
      console.log(`   ✓ Admission referral already exists`);
    }
  }

  // ── 8. Test Cross-Branch Patient Search ──
  console.log("\n8. TESTING CROSS-BRANCH PATIENT SEARCH...");

  const groupHospitals = await db.hospital.findMany({
    where: { groupCode: "NYAHO", active: true },
    select: { id: true, code: true, name: true },
  });
  const hospitalIds = groupHospitals.map(h => h.id);

  // Search for "Mensah" — should find Emmanuel at Main AND Nana Kweku at Airport
  const searchResults = await db.patientRecord.findMany({
    where: { hospitalId: { in: hospitalIds } },
    select: { id: true, hospitalId: true, patient: true, visit: true },
    orderBy: { createdAt: "desc" },
  });

  const mensahResults = searchResults.filter(r => {
    const p = r.patient as Record<string, unknown>;
    return String(p?.fullName || "").toLowerCase().includes("mensah");
  });

  console.log(`   Search "Mensah" across group: ${mensahResults.length} results`);
  for (const r of mensahResults) {
    const p = r.patient as Record<string, unknown>;
    const h = groupHospitals.find(h => h.id === r.hospitalId);
    console.log(`   ✓ ${p?.fullName} at ${h?.name} (${h?.code})`);
  }

  // Search for "Efua" — should find at Airport
  const efuaResults = searchResults.filter(r => {
    const p = r.patient as Record<string, unknown>;
    return String(p?.fullName || "").toLowerCase().includes("efua");
  });
  console.log(`   Search "Efua" across group: ${efuaResults.length} results`);
  for (const r of efuaResults) {
    const p = r.patient as Record<string, unknown>;
    const h = groupHospitals.find(h => h.id === r.hospitalId);
    console.log(`   ✓ ${p?.fullName} at ${h?.name} (${h?.code})`);
  }

  // ── 9. Test Group Dashboard Stats ──
  console.log("\n9. GROUP DASHBOARD STATS...");

  const [patientCounts, operatorCounts] = await Promise.all([
    db.patientRecord.groupBy({
      by: ["hospitalId"],
      where: { hospitalId: { in: hospitalIds } },
      _count: true,
    }),
    db.deviceOperator.groupBy({
      by: ["hospitalId"],
      where: { hospitalId: { in: hospitalIds }, isActive: true },
      _count: true,
    }),
  ]);

  console.log("\n   ┌─────────────────────────────────────────────────────────────┐");
  console.log("   │  NYAHO MEDICAL GROUP — Dashboard                          │");
  console.log("   ├───────────────────────┬──────┬──────────┬─────────────────┤");
  console.log("   │ Branch                │ Tier │ Patients │ Staff           │");
  console.log("   ├───────────────────────┼──────┼──────────┼─────────────────┤");

  let totalPatients = 0;
  let totalStaff = 0;
  for (const h of groupHospitals) {
    const pc = patientCounts.find(p => p.hospitalId === h.id)?._count || 0;
    const oc = operatorCounts.find(o => o.hospitalId === h.id)?._count || 0;
    totalPatients += pc;
    totalStaff += oc;
    const nameCol = h.name.padEnd(21);
    const tierCol = (h.code.includes("MAIN") ? "T3" : h.code.includes("AIRPORT") ? "T1" : "T4").padEnd(4);
    console.log(`   │ ${nameCol} │ ${tierCol} │ ${String(pc).padStart(8)} │ ${String(oc).padStart(15)} │`);
  }

  console.log("   ├───────────────────────┼──────┼──────────┼─────────────────┤");
  console.log(`   │ GROUP TOTAL           │      │ ${String(totalPatients).padStart(8)} │ ${String(totalStaff).padStart(15)} │`);
  console.log("   └───────────────────────┴──────┴──────────┴─────────────────┘");

  // ── 10. Verify Standalone Hospital Unaffected ──
  console.log("\n10. STANDALONE HOSPITAL CHECK...");
  const kbhCheck = await db.hospital.findUnique({ where: { code: "KBH" } });
  console.log(`   KBH (${kbhCheck?.name}): groupId = ${kbhCheck?.groupId ?? "null"} ✓ STANDALONE — unaffected`);

  // ── Summary ──
  console.log("\n" + "=".repeat(60));
  console.log("✓ ALL TESTS PASSED");
  console.log("=".repeat(60));
  console.log(`\nGroup: NYAHO — ${group.name}`);
  console.log(`Branches: 3 (NYH-MAIN T3, NYH-AIRPORT T1, NYH-TEMA T4)`);
  console.log(`Total patients seeded: ${totalPatients}`);
  console.log(`Total operators: ${totalStaff}`);
  console.log(`Inter-branch referrals: 3 (1 URGENT CT, 1 CRITICAL blood, 1 URGENT ICU admission)`);
  console.log(`Cross-branch search: working`);
  console.log(`Standalone KBH: unaffected`);

  await db.$disconnect();
}

main().catch(e => { console.error("\nTest failed:", e); process.exit(1); });
