/**
 * Seed pricing blob into KBH hospital.settings.
 * Deterministic: given the same doctor/ward list, output is reproducible.
 * Run: npx tsx scripts/seed-pricing-test.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const HOSPITAL_CODE = "KBH";

const DEFAULTS = { consultationFee: 50, wardNightly: 120, injectionFee: 15, vitalsFee: 5 };

const DOCTOR_FEE_CYCLE = [40, 60, 80, 100, 150];
const DOCTOR_COMMISSION_CYCLE = [10, 15, 20, 25, 30];

const BED_CLASS_RATES = { General: 80, "Semi-Private": 150, Private: 250, ICU: 400, VIP: 600 };

const SERVICES: Record<string, Record<string, number>> = {
  LAB: { "Full Blood Count": 25, "Malaria Parasite": 15, "Random Blood Sugar": 10, "Urinalysis": 12, "Widal Test": 20 },
  IMAGING: { "Chest X-Ray": 80, "Abdominal Ultrasound": 120, "CT Head": 400, "CT Abdomen": 450 },
  PROCEDURE: { "Wound Dressing": 30, "Suturing Minor": 60, "IV Fluids": 20, "Delivery Normal": 500, "Blood Transfusion": 150 },
  DRUG: { "Paracetamol 500mg": 2, "Amoxicillin 500mg": 5, "Artemether-Lumefantrine": 18 },
  EMERGENCY: { "Triage Level 1": 100, "Triage Level 2": 70, "Triage Level 3": 40 },
  ICU_DAY: { "ICU Day": 400, "Ventilator Day": 250 },
};

async function main() {
  const hospital = await db.hospital.findUnique({ where: { code: HOSPITAL_CODE } });
  if (!hospital) { console.error("KBH not found"); process.exit(1); }

  const doctors = await db.doctor.findMany({ where: { hospitalId: hospital.id }, orderBy: { name: "asc" } });
  const wards = await db.ward.findMany({ where: { hospitalId: hospital.id }, orderBy: { name: "asc" } });

  const doctorBlob: Record<string, { fee: number; commission: number; department: string }> = {};
  doctors.forEach((doc, i) => {
    doctorBlob[doc.id] = {
      fee: DOCTOR_FEE_CYCLE[i % DOCTOR_FEE_CYCLE.length],
      commission: DOCTOR_COMMISSION_CYCLE[i % DOCTOR_COMMISSION_CYCLE.length],
      department: doc.specialty,
    };
  });

  const wardBlob: Record<string, Record<string, number>> = {};
  wards.forEach((w) => { wardBlob[w.name] = { ...BED_CLASS_RATES }; });

  const pricing = { defaults: DEFAULTS, doctors: doctorBlob, wards: wardBlob, services: SERVICES };

  const currentSettings = (hospital.settings ?? {}) as Record<string, unknown>;
  const newSettings = { ...currentSettings, pricing };

  await db.hospital.update({
    where: { id: hospital.id },
    data: { settings: JSON.parse(JSON.stringify(newSettings)) },
  });

  console.log("✅ Pricing seeded for KBH");
  console.log(`   Defaults: consultation=${DEFAULTS.consultationFee}, ward=${DEFAULTS.wardNightly}, injection=${DEFAULTS.injectionFee}, vitals=${DEFAULTS.vitalsFee}`);
  console.log(`   Doctors configured: ${doctors.length}`);
  doctors.forEach((doc) => {
    const b = doctorBlob[doc.id];
    console.log(`     ${doc.name.padEnd(22)} fee=${String(b.fee).padStart(3)}  commission=${b.commission}%  dept=${b.department}`);
  });
  console.log(`   Wards configured: ${wards.length} × 5 bed classes`);
  wards.forEach((w) => console.log(`     ${w.name}`));
  console.log(`   Service catalog: ${Object.keys(SERVICES).length} types, ${Object.values(SERVICES).reduce((s, o) => s + Object.keys(o).length, 0)} prices`);

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
