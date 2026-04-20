import { PrismaClient } from "../../src/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { hash } from "@node-rs/argon2"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

const ARGON2_OPTIONS = { memoryCost: 65536, timeCost: 3, parallelism: 1, hashLength: 32 }

async function hashPin(pin: string): Promise<string> {
  return hash(pin, ARGON2_OPTIONS)
}

async function main() {
  const kbh = await db.organization.findUnique({ where: { code: "KBH" } })
  if (!kbh) { console.error("KBH org not found. Run base seed first."); process.exit(1) }

  const orgId = kbh.id
  const branchId = "kbh-main"
  const pin = await hashPin("1234")

  // ── Operators ──
  const operators = [
    { name: "Dr. Kwaku Mensah", role: "doctor", phone: "024 200 1001" },
    { name: "Dr. Ama Owusu", role: "doctor", phone: "024 200 1002" },
    { name: "Nurse Abena Serwaa", role: "nurse", phone: "024 200 2001" },
    { name: "Nurse Kofi Tetteh", role: "icu_nurse", phone: "024 200 2002" },
    { name: "Midwife Esi Nyarko", role: "midwife", phone: "024 200 2003" },
    { name: "Pharm. Yaw Boateng", role: "pharmacist", phone: "024 200 3001" },
    { name: "Lab Tech Akua Mensah", role: "lab_tech", phone: "024 200 4001" },
    { name: "Rad. Tech Kwesi Pratt", role: "radiologist", phone: "024 200 4002" },
    { name: "Front Desk Efua Appiah", role: "front_desk", phone: "024 200 5001" },
    { name: "Billing Clerk Nana Addo", role: "billing_clerk", phone: "024 200 6001" },
    { name: "Blood Bank Tech Araba Quaye", role: "blood_bank_tech", phone: "024 200 7001" },
    { name: "Triage Nurse Maame Serwaa", role: "triage_nurse", phone: "024 200 2004" },
  ]

  for (const op of operators) {
    const existing = await db.operator.findFirst({ where: { orgId, name: op.name } })
    if (!existing) {
      const opPin = await hashPin("1234")
      await db.operator.create({ data: { orgId, name: op.name, phone: op.phone, pin: opPin, role: op.role } })
    }
  }
  console.log(`  ✓ ${operators.length} operators`)

  // ── Service Categories ──
  const categories = [
    { name: "Consultations", sortOrder: 1 },
    { name: "Laboratory Tests", sortOrder: 2 },
    { name: "Imaging & Radiology", sortOrder: 3 },
    { name: "Drugs & Medication", sortOrder: 4 },
    { name: "Procedures", sortOrder: 5 },
    { name: "Ward & ICU", sortOrder: 6 },
    { name: "Blood Products", sortOrder: 7 },
    { name: "Maternity", sortOrder: 8 },
  ]

  const catIds: Record<string, string> = {}
  for (const cat of categories) {
    const existing = await db.serviceCategory.findFirst({ where: { orgId, name: cat.name } })
    if (existing) { catIds[cat.name] = existing.id; continue }
    const created = await db.serviceCategory.create({ data: { orgId, ...cat } })
    catIds[cat.name] = created.id
  }
  console.log(`  ✓ ${categories.length} service categories`)

  // ── Service Items ──
  const items = [
    // Consultations
    { categoryId: catIds["Consultations"], name: "General Consultation", behaviour: "consultation", stockType: "service", sellingPrice: 80_00 },
    { categoryId: catIds["Consultations"], name: "Follow-Up Consultation", behaviour: "consultation", stockType: "service", sellingPrice: 50_00 },
    { categoryId: catIds["Consultations"], name: "Emergency Consultation", behaviour: "consultation", stockType: "service", sellingPrice: 150_00 },
    { categoryId: catIds["Consultations"], name: "Specialist Consultation", behaviour: "consultation", stockType: "service", sellingPrice: 120_00 },
    // Lab Tests
    { categoryId: catIds["Laboratory Tests"], name: "Full Blood Count (FBC)", behaviour: "procedure", stockType: "service", sellingPrice: 35_00 },
    { categoryId: catIds["Laboratory Tests"], name: "Malaria RDT", behaviour: "procedure", stockType: "service", sellingPrice: 25_00 },
    { categoryId: catIds["Laboratory Tests"], name: "Urinalysis", behaviour: "procedure", stockType: "service", sellingPrice: 20_00 },
    { categoryId: catIds["Laboratory Tests"], name: "Random Blood Sugar", behaviour: "procedure", stockType: "service", sellingPrice: 15_00 },
    { categoryId: catIds["Laboratory Tests"], name: "HbA1c", behaviour: "procedure", stockType: "service", sellingPrice: 65_00 },
    { categoryId: catIds["Laboratory Tests"], name: "Lipid Profile", behaviour: "procedure", stockType: "service", sellingPrice: 55_00 },
    { categoryId: catIds["Laboratory Tests"], name: "Liver Function Tests", behaviour: "procedure", stockType: "service", sellingPrice: 45_00 },
    { categoryId: catIds["Laboratory Tests"], name: "Urea & Electrolytes", behaviour: "procedure", stockType: "service", sellingPrice: 45_00 },
    { categoryId: catIds["Laboratory Tests"], name: "Widal Test", behaviour: "procedure", stockType: "service", sellingPrice: 30_00 },
    { categoryId: catIds["Laboratory Tests"], name: "Blood Culture", behaviour: "procedure", stockType: "service", sellingPrice: 80_00 },
    { categoryId: catIds["Laboratory Tests"], name: "G6PD Screen", behaviour: "procedure", stockType: "service", sellingPrice: 40_00 },
    { categoryId: catIds["Laboratory Tests"], name: "Troponin I", behaviour: "procedure", stockType: "service", sellingPrice: 85_00 },
    // Imaging
    { categoryId: catIds["Imaging & Radiology"], name: "Chest X-Ray", behaviour: "procedure", stockType: "service", sellingPrice: 80_00 },
    { categoryId: catIds["Imaging & Radiology"], name: "Abdominal Ultrasound", behaviour: "procedure", stockType: "service", sellingPrice: 120_00 },
    { categoryId: catIds["Imaging & Radiology"], name: "CT Scan (Head)", behaviour: "procedure", stockType: "service", sellingPrice: 350_00 },
    { categoryId: catIds["Imaging & Radiology"], name: "CT Scan (Chest)", behaviour: "procedure", stockType: "service", sellingPrice: 350_00 },
    { categoryId: catIds["Imaging & Radiology"], name: "ECG", behaviour: "procedure", stockType: "service", sellingPrice: 60_00 },
    { categoryId: catIds["Imaging & Radiology"], name: "Obstetric Ultrasound", behaviour: "procedure", stockType: "service", sellingPrice: 100_00 },
    // Drugs
    { categoryId: catIds["Drugs & Medication"], name: "Artemether-Lumefantrine 80/480mg", behaviour: "product", stockType: "physical", sellingPrice: 45_00, costPrice: 28_00, stock: 200, minStock: 50, unit: "course" },
    { categoryId: catIds["Drugs & Medication"], name: "Paracetamol 1g", behaviour: "product", stockType: "physical", sellingPrice: 2_00, costPrice: 1_00, stock: 500, minStock: 100, unit: "tablet" },
    { categoryId: catIds["Drugs & Medication"], name: "Amoxicillin 500mg", behaviour: "product", stockType: "physical", sellingPrice: 3_00, costPrice: 1_50, stock: 45, minStock: 50, unit: "capsule" },
    { categoryId: catIds["Drugs & Medication"], name: "Ciprofloxacin 500mg", behaviour: "product", stockType: "physical", sellingPrice: 5_00, costPrice: 3_00, stock: 150, minStock: 30, unit: "tablet" },
    { categoryId: catIds["Drugs & Medication"], name: "Metformin 500mg", behaviour: "product", stockType: "physical", sellingPrice: 2_50, costPrice: 1_20, stock: 300, minStock: 60, unit: "tablet" },
    { categoryId: catIds["Drugs & Medication"], name: "Amlodipine 10mg", behaviour: "product", stockType: "physical", sellingPrice: 3_00, costPrice: 1_80, stock: 250, minStock: 50, unit: "tablet" },
    { categoryId: catIds["Drugs & Medication"], name: "Losartan 50mg", behaviour: "product", stockType: "physical", sellingPrice: 4_00, costPrice: 2_50, stock: 180, minStock: 40, unit: "tablet" },
    { categoryId: catIds["Drugs & Medication"], name: "Salbutamol Inhaler 100mcg", behaviour: "product", stockType: "physical", sellingPrice: 25_00, costPrice: 15_00, stock: 30, minStock: 10, unit: "inhaler" },
    { categoryId: catIds["Drugs & Medication"], name: "Insulin (Mixtard) 100IU/ml", behaviour: "product", stockType: "physical", sellingPrice: 60_00, costPrice: 40_00, stock: 20, minStock: 10, unit: "vial" },
    { categoryId: catIds["Drugs & Medication"], name: "Ferrous Sulphate 200mg", behaviour: "product", stockType: "physical", sellingPrice: 100, costPrice: 50, stock: 400, minStock: 100, unit: "tablet" },
    { categoryId: catIds["Drugs & Medication"], name: "Folic Acid 5mg", behaviour: "product", stockType: "physical", sellingPrice: 100, costPrice: 30, stock: 500, minStock: 100, unit: "tablet" },
    { categoryId: catIds["Drugs & Medication"], name: "ORS Sachets", behaviour: "product", stockType: "physical", sellingPrice: 3_00, costPrice: 1_50, stock: 100, minStock: 30, unit: "sachet" },
    // Procedures
    { categoryId: catIds["Procedures"], name: "IV Cannulation", behaviour: "procedure", stockType: "service", sellingPrice: 20_00 },
    { categoryId: catIds["Procedures"], name: "IM Injection", behaviour: "procedure", stockType: "service", sellingPrice: 10_00 },
    { categoryId: catIds["Procedures"], name: "Wound Dressing", behaviour: "procedure", stockType: "service", sellingPrice: 30_00 },
    { categoryId: catIds["Procedures"], name: "Catheterisation", behaviour: "procedure", stockType: "service", sellingPrice: 50_00 },
    // Ward & ICU
    { categoryId: catIds["Ward & ICU"], name: "Ward Bed (per day)", behaviour: "admission", stockType: "capacity", sellingPrice: 150_00, capacityTotal: 12 },
    { categoryId: catIds["Ward & ICU"], name: "ICU Bed (per day)", behaviour: "admission", stockType: "capacity", sellingPrice: 500_00, capacityTotal: 4 },
    { categoryId: catIds["Ward & ICU"], name: "Private Ward (per day)", behaviour: "admission", stockType: "capacity", sellingPrice: 300_00, capacityTotal: 4 },
    // Maternity
    { categoryId: catIds["Maternity"], name: "ANC Visit", behaviour: "consultation", stockType: "service", sellingPrice: 50_00 },
    { categoryId: catIds["Maternity"], name: "Normal Delivery", behaviour: "procedure", stockType: "service", sellingPrice: 800_00 },
    { categoryId: catIds["Maternity"], name: "Caesarean Section", behaviour: "procedure", stockType: "service", sellingPrice: 3000_00 },
    { categoryId: catIds["Maternity"], name: "Maternity Bed (per day)", behaviour: "admission", stockType: "capacity", sellingPrice: 200_00, capacityTotal: 6 },
    // Blood Products
    { categoryId: catIds["Blood Products"], name: "O+ Whole Blood", behaviour: "product", stockType: "physical", sellingPrice: 120_00, costPrice: 80_00, stock: 12, minStock: 5, unit: "unit", meta: { bloodGroup: "O+", bloodComponent: "Whole Blood" } },
    { categoryId: catIds["Blood Products"], name: "O+ Packed RBC", behaviour: "product", stockType: "physical", sellingPrice: 150_00, costPrice: 100_00, stock: 8, minStock: 3, unit: "unit", meta: { bloodGroup: "O+", bloodComponent: "Packed RBC" } },
    { categoryId: catIds["Blood Products"], name: "O+ Platelets", behaviour: "product", stockType: "physical", sellingPrice: 200_00, costPrice: 140_00, stock: 4, minStock: 2, unit: "unit", meta: { bloodGroup: "O+", bloodComponent: "Platelets" } },
    { categoryId: catIds["Blood Products"], name: "O+ Plasma", behaviour: "product", stockType: "physical", sellingPrice: 100_00, costPrice: 60_00, stock: 6, minStock: 3, unit: "unit", meta: { bloodGroup: "O+", bloodComponent: "Plasma" } },
    { categoryId: catIds["Blood Products"], name: "O- Whole Blood", behaviour: "product", stockType: "physical", sellingPrice: 150_00, costPrice: 100_00, stock: 3, minStock: 3, unit: "unit", meta: { bloodGroup: "O-", bloodComponent: "Whole Blood" } },
    { categoryId: catIds["Blood Products"], name: "O- Packed RBC", behaviour: "product", stockType: "physical", sellingPrice: 180_00, costPrice: 120_00, stock: 2, minStock: 2, unit: "unit", meta: { bloodGroup: "O-", bloodComponent: "Packed RBC" } },
    { categoryId: catIds["Blood Products"], name: "A+ Whole Blood", behaviour: "product", stockType: "physical", sellingPrice: 120_00, costPrice: 80_00, stock: 9, minStock: 4, unit: "unit", meta: { bloodGroup: "A+", bloodComponent: "Whole Blood" } },
    { categoryId: catIds["Blood Products"], name: "A+ Packed RBC", behaviour: "product", stockType: "physical", sellingPrice: 150_00, costPrice: 100_00, stock: 5, minStock: 2, unit: "unit", meta: { bloodGroup: "A+", bloodComponent: "Packed RBC" } },
    { categoryId: catIds["Blood Products"], name: "A+ Platelets", behaviour: "product", stockType: "physical", sellingPrice: 200_00, costPrice: 140_00, stock: 3, minStock: 2, unit: "unit", meta: { bloodGroup: "A+", bloodComponent: "Platelets" } },
    { categoryId: catIds["Blood Products"], name: "B+ Whole Blood", behaviour: "product", stockType: "physical", sellingPrice: 120_00, costPrice: 80_00, stock: 7, minStock: 3, unit: "unit", meta: { bloodGroup: "B+", bloodComponent: "Whole Blood" } },
    { categoryId: catIds["Blood Products"], name: "B+ Packed RBC", behaviour: "product", stockType: "physical", sellingPrice: 150_00, costPrice: 100_00, stock: 4, minStock: 2, unit: "unit", meta: { bloodGroup: "B+", bloodComponent: "Packed RBC" } },
    { categoryId: catIds["Blood Products"], name: "AB+ Whole Blood", behaviour: "product", stockType: "physical", sellingPrice: 130_00, costPrice: 90_00, stock: 4, minStock: 2, unit: "unit", meta: { bloodGroup: "AB+", bloodComponent: "Whole Blood" } },
    { categoryId: catIds["Blood Products"], name: "AB+ Plasma", behaviour: "product", stockType: "physical", sellingPrice: 100_00, costPrice: 60_00, stock: 5, minStock: 2, unit: "unit", meta: { bloodGroup: "AB+", bloodComponent: "Plasma" } },
    { categoryId: catIds["Blood Products"], name: "B- Whole Blood", behaviour: "product", stockType: "physical", sellingPrice: 150_00, costPrice: 100_00, stock: 1, minStock: 2, unit: "unit", meta: { bloodGroup: "B-", bloodComponent: "Whole Blood" } },
    { categoryId: catIds["Blood Products"], name: "AB- Whole Blood", behaviour: "product", stockType: "physical", sellingPrice: 160_00, costPrice: 110_00, stock: 1, minStock: 2, unit: "unit", meta: { bloodGroup: "AB-", bloodComponent: "Whole Blood" } },
    { categoryId: catIds["Blood Products"], name: "A- Whole Blood", behaviour: "product", stockType: "physical", sellingPrice: 150_00, costPrice: 100_00, stock: 2, minStock: 2, unit: "unit", meta: { bloodGroup: "A-", bloodComponent: "Whole Blood" } },
  ]

  let itemCount = 0
  for (const item of items) {
    const existing = await db.serviceItem.findFirst({ where: { orgId, name: item.name } })
    if (existing) continue
    await db.serviceItem.create({ data: { orgId, ...item } as any })
    itemCount++
  }
  console.log(`  ✓ ${itemCount} service items (${items.length - itemCount} already existed)`)

  // ── Patients (Contacts) ──
  const patients = [
    { name: "Kwame Asante", phone: "+233 24 111 0001", gender: "male", dateOfBirth: "1985-03-12", bloodGroup: "O+", allergies: ["Penicillin"], insuranceType: "NHIS", emergencyContact: "Ama Asante", emergencyPhone: "+233 24 111 0050" },
    { name: "Ama Mensah", phone: "+233 20 111 0002", gender: "female", dateOfBirth: "1990-07-22", bloodGroup: "A+", insuranceType: "Private", emergencyContact: "Kofi Mensah", emergencyPhone: "+233 20 111 0051" },
    { name: "Kofi Darkwa", phone: "+233 26 111 0003", gender: "male", dateOfBirth: "1968-09-14", bloodGroup: "O+", allergies: ["Aspirin"], insuranceType: "NHIS", emergencyContact: "Yaa Darkwa", emergencyPhone: "+233 26 111 0052" },
    { name: "Yaa Boateng", phone: "+233 54 111 0004", gender: "female", dateOfBirth: "2001-10-30", bloodGroup: "B+", insuranceType: "NHIS", emergencyContact: "Kwaku Boateng", emergencyPhone: "+233 54 111 0053" },
    { name: "Kweku Pratt", phone: "+233 27 111 0005", gender: "male", dateOfBirth: "1982-01-14", bloodGroup: "A-", insuranceType: "None", emergencyContact: "Esi Pratt", emergencyPhone: "+233 27 111 0054" },
    { name: "Abena Osei", phone: "+233 50 111 0006", gender: "female", dateOfBirth: "1988-04-18", bloodGroup: "B+", allergies: ["Sulfa drugs"], insuranceType: "NHIS", emergencyContact: "Kojo Osei", emergencyPhone: "+233 50 111 0055" },
    { name: "Nana Addo", phone: "+233 24 111 0007", gender: "male", dateOfBirth: "1962-06-08", bloodGroup: "A+", insuranceType: "Private", emergencyContact: "Akua Addo", emergencyPhone: "+233 24 111 0056" },
    { name: "Efua Appiah", phone: "+233 55 111 0008", gender: "female", dateOfBirth: "2005-12-25", bloodGroup: "O+", insuranceType: "NHIS", emergencyContact: "Nana Appiah", emergencyPhone: "+233 55 111 0057" },
    { name: "Kojo Bonsu", phone: "+233 24 111 0009", gender: "male", dateOfBirth: "1975-02-20", bloodGroup: "AB+", insuranceType: "None", emergencyContact: "Adwoa Bonsu", emergencyPhone: "+233 24 111 0058" },
    { name: "Akosua Frimpong", phone: "+233 20 111 0010", gender: "female", dateOfBirth: "1993-08-07", bloodGroup: "O-", insuranceType: "Private", emergencyContact: "Kojo Frimpong", emergencyPhone: "+233 20 111 0059" },
    { name: "Kwabena Fosu", phone: "+233 27 111 0011", gender: "male", dateOfBirth: "1978-07-19", bloodGroup: "B-", insuranceType: "NHIS", emergencyContact: "Esi Fosu", emergencyPhone: "+233 27 111 0060" },
    { name: "Esi Gyamfi", phone: "+233 50 111 0012", gender: "female", dateOfBirth: "2003-03-03", bloodGroup: "A+", insuranceType: "NHIS", emergencyContact: "Fiifi Gyamfi", emergencyPhone: "+233 50 111 0061" },
    { name: "Akua Mensah", phone: "+233 55 111 0013", gender: "female", dateOfBirth: "1984-11-15", bloodGroup: "AB-", insuranceType: "NHIS", emergencyContact: "Kwame Mensah", emergencyPhone: "+233 55 111 0062", meta: { isDonor: true, donorStatus: "deferred", donationCount: 5, lastDonation: "2025-11-22", deferReason: "Low haemoglobin at last screening" } },
    { name: "Yaw Osei", phone: "+233 24 111 0014", gender: "male", dateOfBirth: "1970-05-28", bloodGroup: "O-", insuranceType: "NHIS", emergencyContact: "Aba Osei", emergencyPhone: "+233 24 111 0063", meta: { isDonor: true, donorStatus: "eligible", donationCount: 15, lastDonation: "2026-04-02" } },
    { name: "Araba Quaye", phone: "+233 55 111 0015", gender: "female", dateOfBirth: "1997-09-26", bloodGroup: "O+", insuranceType: "None", emergencyContact: "Papa Quaye", emergencyPhone: "+233 55 111 0064", meta: { isDonor: true, donorStatus: "eligible", donationCount: 6, lastDonation: "2026-03-05" } },
    { name: "Papa Ankrah", phone: "+233 24 111 0016", gender: "male", dateOfBirth: "1956-01-14", bloodGroup: "A+", insuranceType: "Private", emergencyContact: "Maame Ankrah", emergencyPhone: "+233 24 111 0065", meta: { isDonor: true, donorStatus: "eligible", donationCount: 8, lastDonation: "2026-02-14" } },
    { name: "Maame Serwaa", phone: "+233 20 111 0017", gender: "female", dateOfBirth: "1991-06-02", bloodGroup: "B+", insuranceType: "NHIS", emergencyContact: "Yaa Serwaa", emergencyPhone: "+233 20 111 0066", meta: { isDonor: true, donorStatus: "eligible", donationCount: 12, lastDonation: "2026-01-10" } },
    { name: "Esi Nyarko", phone: "+233 26 111 0018", gender: "female", dateOfBirth: "1995-08-14", bloodGroup: "O+", insuranceType: "NHIS", emergencyContact: "Kwame Nyarko", emergencyPhone: "+233 26 111 0067" },
    { name: "Adwoa Owusu", phone: "+233 20 111 0019", gender: "female", dateOfBirth: "1999-05-28", bloodGroup: "AB+", insuranceType: "Private", emergencyContact: "Kojo Owusu", emergencyPhone: "+233 20 111 0068" },
    { name: "Kofi Annan Jr", phone: "+233 54 111 0020", gender: "male", dateOfBirth: "1980-04-08", bloodGroup: "B+", insuranceType: "NHIS", emergencyContact: "Nane Annan", emergencyPhone: "+233 54 111 0069" },
  ]

  const contactIds: Record<string, string> = {}
  for (const p of patients) {
    const existing = await db.contact.findFirst({ where: { orgId, phone: p.phone } })
    if (existing) { contactIds[p.name] = existing.id; continue }
    const created = await db.contact.create({ data: { orgId, type: "patient", ...p } as any })
    contactIds[p.name] = created.id
  }
  console.log(`  ✓ ${patients.length} patients`)

  // ── Queue Entries (today's queue) ──
  const today = new Date()
  const prefix = `${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`

  const queueEntries = [
    { contact: "Kwame Asante", complaint: "Fever and chills, 3 days", severity: 7, status: "waiting", emergency: false },
    { contact: "Ama Mensah", complaint: "Persistent headache", severity: 4, status: "in_consultation", emergency: false },
    { contact: "Kofi Darkwa", complaint: "Chest pain, shortness of breath", severity: 9, status: "waiting", emergency: true },
    { contact: "Yaa Boateng", complaint: "ANC checkup, 28 weeks", severity: 2, status: "waiting", emergency: false },
    { contact: "Kweku Pratt", complaint: "Lower back pain, 1 week", severity: 3, status: "waiting", emergency: false },
    { contact: "Abena Osei", complaint: "Cough with blood in sputum", severity: 6, status: "waiting", emergency: false },
    { contact: "Nana Addo", complaint: "Follow-up diabetes check", severity: 2, status: "closed", emergency: false },
    { contact: "Efua Appiah", complaint: "Skin rash and itching", severity: 3, status: "in_consultation", emergency: false },
    { contact: "Kojo Bonsu", complaint: "Chronic joint pain", severity: 4, status: "waiting", emergency: false },
    { contact: "Akosua Frimpong", complaint: "Dizziness and blurred vision", severity: 5, status: "waiting", emergency: false },
  ]

  const existingQueue = await db.queueEntry.count({ where: { orgId, queuedAt: { gte: new Date(today.toDateString()) } } })
  if (existingQueue === 0) {
    for (let i = 0; i < queueEntries.length; i++) {
      const q = queueEntries[i]
      const cid = contactIds[q.contact]
      if (!cid) continue
      const offset = (queueEntries.length - i) * 5 * 60 * 1000
      await db.queueEntry.create({
        data: {
          orgId, contactId: cid, token: `${prefix}-${String(i + 1).padStart(3, "0")}`,
          department: "General", chiefComplaint: q.complaint, symptomSeverity: q.severity,
          emergencyFlag: q.emergency, visitStatus: q.status, priority: q.emergency ? 100 : 0,
          queuedAt: new Date(Date.now() - offset),
          calledAt: q.status === "in_consultation" ? new Date(Date.now() - offset + 300000) : undefined,
          completedAt: q.status === "closed" ? new Date(Date.now() - offset + 600000) : undefined,
        },
      })
    }
    console.log(`  ✓ ${queueEntries.length} queue entries`)
  } else {
    console.log(`  ○ Queue entries already exist for today (${existingQueue})`)
  }

  // ── Clinical Records (sample consultations) ──
  const doctor = await db.operator.findFirst({ where: { orgId, role: "doctor" } })
  if (doctor && contactIds["Nana Addo"]) {
    const existing = await db.clinicalRecord.findFirst({ where: { orgId, contactId: contactIds["Nana Addo"], type: "consultation" } })
    if (!existing) {
      await db.clinicalRecord.create({
        data: {
          orgId, contactId: contactIds["Nana Addo"], type: "consultation", status: "completed",
          performedBy: doctor.id, performedByName: doctor.name,
          data: {
            subjective: "Known T2DM, follow-up. Reports polyuria improving. Compliant with Metformin.",
            objective: "BP 132/82, RBS 8.2 mmol/L, BMI 29.1. No foot ulcers.",
            assessment: "T2DM — improving glycaemic control",
            plan: "Continue Metformin 500mg BD. Review HbA1c in 3 months. Dietary counselling reinforced.",
            diagnosis: "Type 2 Diabetes Mellitus",
          },
        },
      })
      await db.clinicalRecord.create({
        data: {
          orgId, contactId: contactIds["Nana Addo"], type: "lab_result", status: "completed",
          performedBy: doctor.id, performedByName: "Lab Tech",
          data: { testName: "HbA1c", result: "7.8%", normalRange: "<5.6%", abnormalFlag: true, notes: "Elevated — suggestive of suboptimal control over past 3 months" },
        },
      })
    }
  }
  console.log("  ✓ Sample clinical records")

  // ── Admissions (ward + ICU) ──
  const wardItem = await db.serviceItem.findFirst({ where: { orgId, name: "Ward Bed (per day)" } })
  const icuItem = await db.serviceItem.findFirst({ where: { orgId, name: "ICU Bed (per day)" } })

  if (wardItem && contactIds["Kwame Asante"]) {
    const existing = await db.admission.findFirst({ where: { orgId, contactId: contactIds["Kwame Asante"], status: "active" } })
    if (!existing) {
      await db.admission.create({ data: { orgId, contactId: contactIds["Kwame Asante"], serviceItemId: wardItem.id, type: "ward", identifier: "W1-A", status: "active", notes: "Malaria — responding to treatment. Fever subsiding.", admittedAt: new Date(Date.now() - 2 * 86400000) } })
    }
  }
  if (wardItem && contactIds["Abena Osei"]) {
    const existing = await db.admission.findFirst({ where: { orgId, contactId: contactIds["Abena Osei"], status: "active" } })
    if (!existing) {
      await db.admission.create({ data: { orgId, contactId: contactIds["Abena Osei"], serviceItemId: wardItem.id, type: "ward", identifier: "W2-A", status: "active", notes: "Pneumonia — IV antibiotics started. SpO2 improving.", admittedAt: new Date(Date.now() - 1 * 86400000) } })
    }
  }
  if (icuItem && contactIds["Kofi Darkwa"]) {
    const existing = await db.admission.findFirst({ where: { orgId, contactId: contactIds["Kofi Darkwa"], status: "active" } })
    if (!existing) {
      await db.admission.create({ data: { orgId, contactId: contactIds["Kofi Darkwa"], serviceItemId: icuItem.id, type: "icu", identifier: "ICU-1", status: "active", notes: "Acute MI — SOFA 8. Intubated. Dobutamine infusion.", admittedAt: new Date(Date.now() - 1 * 86400000) } })
    }
  }
  console.log("  ✓ Sample admissions")

  // ── Cross-match records ──
  if (contactIds["Kofi Darkwa"] && doctor) {
    const existing = await db.clinicalRecord.findFirst({ where: { orgId, contactId: contactIds["Kofi Darkwa"], type: "cross_match" } })
    if (!existing) {
      await db.clinicalRecord.create({
        data: {
          orgId, contactId: contactIds["Kofi Darkwa"], type: "cross_match", status: "matched",
          performedBy: doctor.id, performedByName: doctor.name,
          data: { patientName: "Kofi Darkwa", patientGroup: "O+", requestedComponent: "Packed RBC", units: 2 },
        },
      })
    }
  }
  console.log("  ✓ Sample cross-match records")

  console.log("\n✓ Health seed complete for KBH")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
