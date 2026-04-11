/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Read DATABASE_URL from .env
const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf8");
const dbUrl = envContent.match(/DATABASE_URL="([^"]+)"/)?.[1];
if (!dbUrl) { console.error("No DATABASE_URL in .env"); process.exit(1); }

// ─── Tier defaults ───
const TIERS: Record<string, { modules: string[]; maxDevices: number; whatsapp: number }> = {
  T1: { modules: ["front_desk","waiting_room","doctor","pharmacy","billing"], maxDevices: 6, whatsapp: 500 },
  T2: { modules: ["front_desk","waiting_room","doctor","pharmacy","billing","chat","lab","injection_room","nurse_station"], maxDevices: 15, whatsapp: 2000 },
  T3: { modules: ["front_desk","waiting_room","doctor","pharmacy","billing","chat","bookkeeping","lab","injection_room","nurse_station","ct_radiology","ward_ipd","ultrasound"], maxDevices: 35, whatsapp: 5000 },
  T4: { modules: ["front_desk","waiting_room","doctor","pharmacy","billing","chat","bookkeeping","lab","injection_room","nurse_station","ct_radiology","ward_ipd","ultrasound","emergency","icu","maternity","blood_bank"], maxDevices: 999, whatsapp: 20000 },
};

// ─── Hospital definitions ───
const HOSPITALS = [
  { code: "KBH", name: "Korle Bu Teaching Hospital", tier: "T4", subdomain: "korlebu", tagline: "Ghanas Premier Teaching Hospital", group: true },
  { code: "RH",  name: "Ridge Hospital", tier: "T3", subdomain: "ridge", tagline: "Excellence In Healthcare", group: true },
  { code: "LKC", name: "La General Clinic", tier: "T2", subdomain: "lageneral", tagline: "Community Health First", group: true },
  { code: "MPC", name: "Madina Polyclinic", tier: "T1", subdomain: "madina", tagline: "Quality Care Close To Home", group: true },
  { code: "TDC", name: "Tema Dental Clinic", tier: "T1", subdomain: "temadental", tagline: "Smile With Confidence", group: true },
  { code: "KSI", name: "Komfo Anokye Teaching Hospital", tier: "T4", subdomain: "komfoanokye", tagline: "Northern Ghanas Medical Hub", group: false },
  { code: "TAH", name: "Tamale Teaching Hospital", tier: "T3", subdomain: "tamale", tagline: "Serving The North", group: false },
  { code: "CCH", name: "Cape Coast Hospital", tier: "T2", subdomain: "capecoast", tagline: "Coastal Healthcare", group: false },
];

// ─── Ghanaian names for operators ───
const OP_NAMES: Record<string, string> = {
  KBH_front_desk: "Abena Mensah", KBH_doctor: "Dr. Kwame Asante", KBH_pharmacist: "Akosua Boateng",
  KBH_lab_tech: "Kofi Owusu", KBH_nurse: "Ama Darko", KBH_billing: "Yaw Adjei",
  KBH_admin: "Nana Agyeman", KBH_radiologist: "Efua Tetteh", KBH_super_admin: "Kwesi Appiah",
  RH_front_desk: "Adwoa Amponsah", RH_doctor: "Dr. Kojo Mensah", RH_pharmacist: "Akua Ofori",
  RH_lab_tech: "Kwabena Asare", RH_nurse: "Afua Osei", RH_billing: "Yaa Bempong",
  RH_admin: "Kofi Antwi", RH_radiologist: "Esi Quaye", RH_super_admin: "Kweku Frimpong",
  LKC_front_desk: "Adjoa Bonsu", LKC_doctor: "Dr. Ebo Acquah", LKC_pharmacist: "Afia Larbi",
  LKC_lab_tech: "Kwesi Donkor", LKC_nurse: "Ama Sarpong", LKC_billing: "Yaw Gyamfi",
  LKC_admin: "Kojo Nkrumah", LKC_super_admin: "Efua Mensah",
  MPC_front_desk: "Akosua Opoku", MPC_doctor: "Dr. Kofi Badu", MPC_pharmacist: "Adwoa Amoah",
  MPC_billing: "Kwabena Poku", MPC_admin: "Yaa Asantewaa", MPC_super_admin: "Nana Ofosu",
  TDC_front_desk: "Esi Nyarko", TDC_doctor: "Dr. Kwame Addo", TDC_pharmacist: "Afua Dankwa",
  TDC_billing: "Kojo Aidoo", TDC_admin: "Abena Konadu", TDC_super_admin: "Kwesi Boadu",
  KSI_front_desk: "Adwoa Sekyere", KSI_doctor: "Dr. Yaw Mensah", KSI_pharmacist: "Akua Ansah",
  KSI_lab_tech: "Kofi Brenya", KSI_nurse: "Ama Oforiwaa", KSI_billing: "Kwabena Takyi",
  KSI_admin: "Yaa Poku", KSI_radiologist: "Kojo Asem", KSI_super_admin: "Efua Ankrah",
  TAH_front_desk: "Fati Abdulai", TAH_doctor: "Dr. Ibrahim Yakubu", TAH_pharmacist: "Amina Salifu",
  TAH_lab_tech: "Alhassan Mumuni", TAH_nurse: "Rashida Alidu", TAH_billing: "Abdul-Razak Issaka",
  TAH_admin: "Memuna Dramani", TAH_radiologist: "Bashiru Mohammed", TAH_super_admin: "Safia Iddrisu",
  CCH_front_desk: "Ama Quansah", CCH_doctor: "Dr. Ekow Essien", CCH_pharmacist: "Araba Mills",
  CCH_lab_tech: "Kwesi Koomson", CCH_nurse: "Efua Abban", CCH_billing: "Kojo Brew",
  CCH_admin: "Adwoa Eduful", CCH_super_admin: "Yaw Otoo",
};

// ─── Doctor definitions ───
const DOCTORS: Record<string, { name: string; specialty: string }[]> = {
  KBH: [
    { name: "Dr. Kwame Asante", specialty: "general" }, { name: "Dr. Aba Mensah", specialty: "general" },
    { name: "Dr. Nii Laryea", specialty: "cardiology" }, { name: "Dr. Efua Dadzie", specialty: "pediatrics" },
    { name: "Dr. Kojo Sackey", specialty: "surgery" }, { name: "Dr. Akosua Baidoo", specialty: "obstetrics" },
    { name: "Dr. Yaw Oppong", specialty: "emergency" }, { name: "Dr. Esi Quartey", specialty: "dental" },
  ],
  KSI: [
    { name: "Dr. Yaw Mensah", specialty: "general" }, { name: "Dr. Akua Serwaa", specialty: "general" },
    { name: "Dr. Kofi Acheampong", specialty: "surgery" }, { name: "Dr. Ama Foriwaa", specialty: "obstetrics" },
    { name: "Dr. Kwabena Nyantakyi", specialty: "emergency" }, { name: "Dr. Afua Kyei", specialty: "pediatrics" },
  ],
  RH: [
    { name: "Dr. Kojo Mensah", specialty: "general" }, { name: "Dr. Abena Safo", specialty: "general" },
    { name: "Dr. Kweku Amoako", specialty: "surgery" }, { name: "Dr. Afia Pokua", specialty: "pediatrics" },
  ],
  TAH: [
    { name: "Dr. Ibrahim Yakubu", specialty: "general" }, { name: "Dr. Alhassan Tanko", specialty: "surgery" },
    { name: "Dr. Memuna Issah", specialty: "obstetrics" },
  ],
  LKC: [
    { name: "Dr. Ebo Acquah", specialty: "general" }, { name: "Dr. Adjoa Kyere", specialty: "pediatrics" },
  ],
  CCH: [
    { name: "Dr. Ekow Essien", specialty: "general" }, { name: "Dr. Araba Hayford", specialty: "surgery" },
  ],
};

// ─── Ward definitions ───
const WARDS: Record<string, { name: string; type: string; beds: number }[]> = {
  KBH: [
    { name: "General Ward A", type: "general", beds: 6 },
    { name: "ICU Ward", type: "icu", beds: 4 },
    { name: "Maternity Ward", type: "maternity", beds: 4 },
    { name: "Surgical Ward", type: "surgical", beds: 4 },
  ],
  KSI: [
    { name: "General Ward", type: "general", beds: 6 },
    { name: "ICU Ward", type: "icu", beds: 3 },
    { name: "Maternity Ward", type: "maternity", beds: 3 },
  ],
  RH: [
    { name: "General Ward", type: "general", beds: 4 },
    { name: "Maternity Ward", type: "maternity", beds: 3 },
  ],
  TAH: [
    { name: "General Ward", type: "general", beds: 4 },
  ],
};

async function main() {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  console.log("Connected to Neon");

  // ─── 1A: WIPE ALL DATA ───
  console.log("\n--- WIPING ALL DATA ---");
  const deleteTables = [
    "emergency_record_access", "emergency_override_sessions",
    "bed_transitions", "beds", "rooms", "wards",
    "lab_results", "lab_orders",
    "billable_items", "bills", "service_prices",
    "shift_handovers", "doctors",
    "chat_messages", "audit_log",
    "patient_records", "monthly_books",
    "blood_inventory", "patient_cards",
    "devices", "device_operators",
    "access_grants", "hospital_emergency_contacts",
    "hospitals", "hospital_groups", "dalxic_staff",
  ];
  for (const t of deleteTables) {
    try {
      await client.query(`DELETE FROM ${t}`);
      console.log(`  Cleared ${t}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  Skip ${t}: ${msg.slice(0, 60)}`);
    }
  }

  // ─── 1B: CREATE GROUP + HOSPITALS ───
  console.log("\n--- CREATING HOSPITAL GROUP ---");
  const groupId = `grp_${Date.now()}`;
  await client.query(
    `INSERT INTO hospital_groups (id, group_code, name, owner_name, owner_pin, subscription_tier, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [groupId, "GAHN", "Greater Accra Health Network", "Dalxic Admin", "9999", "GROUP_PREMIUM", true]
  );
  console.log("  Created group: GAHN");

  console.log("\n--- CREATING HOSPITALS ---");
  const hospitalIds: Record<string, string> = {};
  for (const h of HOSPITALS) {
    const id = `hosp_${h.code.toLowerCase()}_${Date.now()}`;
    hospitalIds[h.code] = id;
    const tier = TIERS[h.tier];
    await client.query(
      `INSERT INTO hospitals (id, code, name, tier, subdomain, tagline, active_modules, max_devices, whatsapp_bundle, active, group_id, group_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [id, h.code, h.name, h.tier, h.subdomain, h.tagline,
       `{${tier.modules.join(",")}}`, tier.maxDevices, tier.whatsapp,
       true, h.group ? groupId : null, h.group ? "GAHN" : null]
    );
    console.log(`  ${h.code} — ${h.name} (${h.tier})`);
  }

  // ─── 1C: CREATE OPERATORS ───
  console.log("\n--- CREATING OPERATORS ---");
  const allRoles = ["front_desk", "doctor", "pharmacist", "lab_tech", "nurse", "billing", "admin", "radiologist", "super_admin"];
  // Master operators — survive every re-seed, same PINs always
  const MASTER_OPS = [
    { code: "KBH", name: "System Administrator", role: "super_admin", pin: "8833", phone: "0200000001" },
    { code: "KBH", name: "The Creator", role: "admin", pin: "7241", phone: "0200000002" },
    { code: "KBH", name: "Dr. Mensah", role: "doctor", pin: "4401", phone: "0200000003" },
    { code: "KBH", name: "Dr. Adjei", role: "doctor", pin: "4402", phone: "0200000004" },
    { code: "KBH", name: "Front Desk", role: "front_desk", pin: "1100", phone: "0200000005" },
    { code: "KBH", name: "Pharmacist", role: "pharmacist", pin: "2200", phone: "0200000006" },
    { code: "KBH", name: "Billing Officer", role: "billing", pin: "3300", phone: "0200000007" },
  ];

  // Insert master operators first
  for (const m of MASTER_OPS) {
    const opId = `op_master_${m.pin}_${Date.now()}`;
    await client.query(
      `INSERT INTO device_operators (id, hospital_id, name, phone, pin, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [opId, hospitalIds[m.code], m.name, m.phone, m.pin, m.role, true]
    );
  }
  console.log(`  Created ${MASTER_OPS.length} master operators (PINs preserved)`);

  let totalOps = MASTER_OPS.length;
  const masterPins = new Set(MASTER_OPS.map(m => m.pin));
  for (const h of HOSPITALS) {
    const tierNum = parseInt(h.tier[1]);
    let pin = 1001;
    for (const role of allRoles) {
      // Skip tier-gated roles
      if (role === "lab_tech" && tierNum < 2) continue;
      if (role === "nurse" && tierNum < 2) continue;
      if (role === "radiologist" && tierNum < 3) continue;

      // Skip if this PIN conflicts with a master operator
      while (masterPins.has(String(pin))) pin++;

      const nameKey = `${h.code}_${role}`;
      const opName = OP_NAMES[nameKey] || `${role.replace("_", " ")} - ${h.code}`;
      const opId = `op_${h.code.toLowerCase()}_${role}_${Date.now()}`;
      await client.query(
        `INSERT INTO device_operators (id, hospital_id, name, phone, pin, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [opId, hospitalIds[h.code], opName, `024${String(Math.floor(1000000 + Math.random() * 9000000))}`, String(pin), role, true]
      );
      pin++;
      totalOps++;
    }
  }
  console.log(`  Created ${totalOps} operators across ${HOSPITALS.length} hospitals`);

  // ─── 1D: CREATE MONTHLY BOOKS ───
  console.log("\n--- CREATING MONTHLY BOOKS ---");
  const bookIds: Record<string, string> = {};
  for (const h of HOSPITALS) {
    const bookId = `book_${h.code.toLowerCase()}_${Date.now()}`;
    bookIds[h.code] = bookId;
    await client.query(
      `INSERT INTO monthly_books (id, hospital_id, year, month, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [bookId, hospitalIds[h.code], 2026, 4, "active"]
    );
  }
  console.log(`  Created ${HOSPITALS.length} monthly books (April 2026)`);

  // ─── 1E: CREATE DOCTORS ───
  console.log("\n--- CREATING DOCTORS ---");
  let totalDocs = 0;
  for (const [code, docs] of Object.entries(DOCTORS)) {
    for (const d of docs) {
      const docId = `doc_${code.toLowerCase()}_${totalDocs}_${Date.now()}`;
      await client.query(
        `INSERT INTO doctors (id, hospital_id, name, specialty, status, max_concurrent_patients, active_patient_count, role, shift_start, shift_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [docId, hospitalIds[code], d.name, d.specialty, "AVAILABLE", 10, 0, "attending", "08:00", "17:00"]
      );
      totalDocs++;
    }
  }
  console.log(`  Created ${totalDocs} doctors`);

  // ─── 1F: SEED BLOOD INVENTORY ───
  console.log("\n--- SEEDING BLOOD INVENTORY ---");
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const components = ["whole_blood", "packed_rbc", "platelets", "ffp"];
  const baseUnits: Record<string, number> = { "O+": 12, "A+": 10, "B+": 8, "O-": 6, "A-": 5, "B-": 4, "AB+": 3, "AB-": 2 };
  const compMult: Record<string, number> = { whole_blood: 1, packed_rbc: 0.8, platelets: 0.5, ffp: 0.6 };

  for (const code of ["KBH", "KSI"]) {
    for (const bt of bloodTypes) {
      for (const comp of components) {
        const units = Math.round((baseUnits[bt] || 4) * (compMult[comp] || 1));
        await client.query(
          `INSERT INTO blood_inventory (id, hospital_id, blood_type, component, units)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
           ON CONFLICT (hospital_id, blood_type, component) DO UPDATE SET units = $4`,
          [hospitalIds[code], bt, comp, units]
        );
      }
    }
    console.log(`  ${code}: 32 inventory rows`);
  }

  // ─── 1G: CREATE WARDS, ROOMS, BEDS ───
  console.log("\n--- CREATING WARDS, ROOMS & BEDS ---");
  let totalBeds = 0;
  for (const [code, wardList] of Object.entries(WARDS)) {
    for (const w of wardList) {
      const wardId = `ward_${code.toLowerCase()}_${w.type}_${Date.now()}`;
      await client.query(
        `INSERT INTO wards (id, hospital_id, name, type, floor, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [wardId, hospitalIds[code], w.name, w.type, 1, true]
      );
      const roomId = `room_${code.toLowerCase()}_${w.type}_${Date.now()}`;
      await client.query(
        `INSERT INTO rooms (id, ward_id, name) VALUES ($1, $2, $3)`,
        [roomId, wardId, `${w.name} - Room 1`]
      );
      for (let b = 1; b <= w.beds; b++) {
        const bedId = `bed_${code.toLowerCase()}_${w.type}_${b}_${Date.now()}`;
        await client.query(
          `INSERT INTO beds (id, room_id, label, status) VALUES ($1, $2, $3, $4)`,
          [bedId, roomId, `Bed ${b}`, "AVAILABLE"]
        );
        totalBeds++;
      }
    }
    console.log(`  ${code}: ${wardList.length} wards, ${wardList.reduce((s, w) => s + w.beds, 0)} beds`);
  }
  console.log(`  Total: ${totalBeds} beds`);

  // ─── 1H: CREATE DALXIC STAFF ───
  console.log("\n--- CREATING DALXIC STAFF ---");
  await client.query(
    `INSERT INTO dalxic_staff (id, name, email, role)
     VALUES ($1, $2, $3, $4)`,
    [`staff_master_${Date.now()}`, "Dalxic Master Admin", "admin@dalxic.com", "super_admin"]
  );
  console.log("  Created: Dalxic Master Admin (admin@dalxic.com)");

  await client.end();

  console.log("\n========================================");
  console.log("FRESH SEED COMPLETE");
  console.log("========================================");
  console.log(`Hospitals: ${HOSPITALS.length}`);
  console.log(`Group: GAHN (${HOSPITALS.filter(h => h.group).length} hospitals)`);
  console.log(`Standalone: ${HOSPITALS.filter(h => !h.group).length}`);
  console.log(`Operators: ${totalOps}`);
  console.log(`Doctors: ${totalDocs}`);
  console.log(`Beds: ${totalBeds}`);
  console.log(`Blood Inventory: 64 rows (KBH + KSI)`);
  console.log("========================================");

  // Export hospital & book IDs for seed-patients.ts
  const idsPath = path.resolve(__dirname, "seed-ids.json");
  fs.writeFileSync(idsPath, JSON.stringify({ hospitalIds, bookIds }, null, 2));
  console.log(`\nIDs saved to ${idsPath}`);
}

main().catch((e) => { console.error("FAILED:", e); process.exit(1); });
