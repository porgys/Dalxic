import { PrismaClient } from "../src/generated/prisma"
import { PrismaNeon } from "@prisma/adapter-neon"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

const GH_TAX = { vat: 15, nhil: 2.5, getfund: 2.5, covid: 1 }

async function main() {
  console.log("Seeding 3 demo organizations...")

  // ═══════════════════════════════════════════════════════════
  // 1. DEMO STORE — Trade vertical
  // ═══════════════════════════════════════════════════════════

  const store = await db.organization.create({
    data: {
      code: "DEMO",
      name: "Demo Store",
      type: "trade",
      tier: "T2",
      activeBehaviours: ["product", "admin"],
      activeModules: ["pos", "inventory", "stock", "customers", "receipts", "returns", "shifts", "reports", "expenses", "suppliers", "purchase-orders", "labels", "loyalty", "payroll", "branches", "roles", "audit", "reconciliation", "accounting", "tax"],
      paymentGate: "pay_after",
      taxConfig: GH_TAX,
      maxOperators: 10,
      maxBranches: 3,
    },
  })

  const storeBranch = await db.branch.create({ data: { orgId: store.id, name: "Main Branch", address: "Accra Mall, Tetteh Quarshie", phone: "0302-123456", isDefault: true } })

  const storeOps = await Promise.all([
    db.operator.create({ data: { orgId: store.id, name: "Kwame Asante", pin: "1234", role: "owner", permissions: ["*"] } }),
    db.operator.create({ data: { orgId: store.id, name: "Ama Mensah", pin: "5678", role: "manager" } }),
    db.operator.create({ data: { orgId: store.id, name: "Yaw Boateng", pin: "9012", role: "cashier" } }),
    db.operator.create({ data: { orgId: store.id, name: "Abena Osei", pin: "3456", role: "accountant" } }),
  ])

  const storeCats = await Promise.all([
    db.serviceCategory.create({ data: { orgId: store.id, name: "Electronics", sortOrder: 1 } }),
    db.serviceCategory.create({ data: { orgId: store.id, name: "Groceries", sortOrder: 2 } }),
    db.serviceCategory.create({ data: { orgId: store.id, name: "Beverages", sortOrder: 3 } }),
  ])

  const storeItems = await Promise.all([
    db.serviceItem.create({ data: { orgId: store.id, categoryId: storeCats[0].id, name: "Samsung Galaxy A15", behaviour: "product", stockType: "physical", costPrice: 150000, sellingPrice: 220000, stock: 25, minStock: 5, unit: "piece" } }),
    db.serviceItem.create({ data: { orgId: store.id, categoryId: storeCats[0].id, name: "iPhone Charger", behaviour: "product", stockType: "physical", costPrice: 3500, sellingPrice: 6000, stock: 50, minStock: 10, unit: "piece" } }),
    db.serviceItem.create({ data: { orgId: store.id, categoryId: storeCats[0].id, name: "Bluetooth Speaker", behaviour: "product", stockType: "physical", costPrice: 8000, sellingPrice: 15000, stock: 15, minStock: 3, unit: "piece" } }),
    db.serviceItem.create({ data: { orgId: store.id, categoryId: storeCats[0].id, name: "USB Flash Drive 32GB", behaviour: "product", stockType: "physical", costPrice: 2000, sellingPrice: 4500, stock: 40, minStock: 10, unit: "piece" } }),
    db.serviceItem.create({ data: { orgId: store.id, categoryId: storeCats[1].id, name: "Indomie Noodles (Pack)", behaviour: "product", stockType: "physical", costPrice: 800, sellingPrice: 1200, stock: 200, minStock: 50, unit: "pack" } }),
    db.serviceItem.create({ data: { orgId: store.id, categoryId: storeCats[1].id, name: "Golden Tree Chocolate", behaviour: "product", stockType: "physical", costPrice: 500, sellingPrice: 800, stock: 100, minStock: 20, unit: "piece" } }),
    db.serviceItem.create({ data: { orgId: store.id, categoryId: storeCats[1].id, name: "Ideal Milk Tin", behaviour: "product", stockType: "physical", costPrice: 600, sellingPrice: 950, stock: 150, minStock: 30, unit: "tin" } }),
    db.serviceItem.create({ data: { orgId: store.id, categoryId: storeCats[1].id, name: "Rice (5kg bag)", behaviour: "product", stockType: "physical", costPrice: 4500, sellingPrice: 6500, stock: 30, minStock: 10, unit: "bag" } }),
    db.serviceItem.create({ data: { orgId: store.id, categoryId: storeCats[2].id, name: "Coca-Cola 500ml", behaviour: "product", stockType: "physical", costPrice: 300, sellingPrice: 500, stock: 120, minStock: 24, unit: "bottle" } }),
    db.serviceItem.create({ data: { orgId: store.id, categoryId: storeCats[2].id, name: "Voltic Water 1.5L", behaviour: "product", stockType: "physical", costPrice: 200, sellingPrice: 350, stock: 200, minStock: 48, unit: "bottle" } }),
    db.serviceItem.create({ data: { orgId: store.id, categoryId: storeCats[2].id, name: "Malta Guinness", behaviour: "product", stockType: "physical", costPrice: 350, sellingPrice: 600, stock: 80, minStock: 24, unit: "bottle" } }),
    db.serviceItem.create({ data: { orgId: store.id, categoryId: storeCats[2].id, name: "Bel-Aqua Sachet Water", behaviour: "product", stockType: "physical", costPrice: 30, sellingPrice: 50, stock: 500, minStock: 100, unit: "sachet" } }),
  ])

  const storeCustomers = await Promise.all([
    db.contact.create({ data: { orgId: store.id, name: "Kofi Mensah", phone: "0244123456", type: "customer", loyaltyTier: "gold", loyaltyPoints: 520, totalSpent: 450000, visitCount: 15 } }),
    db.contact.create({ data: { orgId: store.id, name: "Efua Darko", phone: "0201987654", type: "customer", loyaltyTier: "silver", loyaltyPoints: 180, totalSpent: 120000, visitCount: 8 } }),
    db.contact.create({ data: { orgId: store.id, name: "Nana Agyemang", phone: "0551234567", type: "customer", totalSpent: 35000, visitCount: 3 } }),
    db.contact.create({ data: { orgId: store.id, name: "Adwoa Poku", phone: "0277654321", type: "customer", totalSpent: 80000, visitCount: 6 } }),
    db.contact.create({ data: { orgId: store.id, name: "Kweku Frimpong", phone: "0208765432", type: "customer", totalSpent: 15000, visitCount: 2 } }),
  ])

  console.log(`  Demo Store: ${storeItems.length} items, ${storeCustomers.length} customers`)

  // ═══════════════════════════════════════════════════════════
  // 2. KORLE BU HOSPITAL — Health vertical
  // ═══════════════════════════════════════════════════════════

  const hospital = await db.organization.create({
    data: {
      code: "KBH",
      name: "Korle Bu Hospital",
      type: "health",
      tier: "T2",
      activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"],
      activeModules: ["front-desk", "doctor", "nurse-station", "waiting-room", "lab", "pharmacy", "radiology", "ultrasound", "ward", "icu", "maternity", "blood-bank", "injection-room", "billing", "bookkeeping"],
      paymentGate: "pay_before",
      taxConfig: GH_TAX,
      labelConfig: { consultation: "Doctor Visit", procedure: "Surgery/Procedure", product: "Drugs & Supplies", admission: "Ward Bed", recurring: "Ward Nightly", admin: "Registration" },
      maxOperators: 20,
      maxBranches: 1,
    },
  })

  const hospBranch = await db.branch.create({ data: { orgId: hospital.id, name: "Main Campus", address: "Korle Bu, Accra", phone: "0302-671000", isDefault: true } })

  const hospOps = await Promise.all([
    db.operator.create({ data: { orgId: hospital.id, name: "Dr. Adjei Mensah", pin: "1234", role: "doctor", permissions: ["consultation", "prescribe", "refer", "lab_order"] } }),
    db.operator.create({ data: { orgId: hospital.id, name: "Nurse Akua Sarpong", pin: "5678", role: "nurse", permissions: ["vitals", "triage", "injection"] } }),
    db.operator.create({ data: { orgId: hospital.id, name: "Grace Owusu", pin: "9012", role: "cashier", permissions: ["billing", "receipts"] } }),
    db.operator.create({ data: { orgId: hospital.id, name: "Admin Osei", pin: "3456", role: "admin", permissions: ["*"] } }),
  ])

  const hospCats = await Promise.all([
    db.serviceCategory.create({ data: { orgId: hospital.id, name: "Consultations", sortOrder: 1 } }),
    db.serviceCategory.create({ data: { orgId: hospital.id, name: "Lab Tests", sortOrder: 2 } }),
    db.serviceCategory.create({ data: { orgId: hospital.id, name: "Imaging", sortOrder: 3 } }),
    db.serviceCategory.create({ data: { orgId: hospital.id, name: "Drugs", sortOrder: 4 } }),
    db.serviceCategory.create({ data: { orgId: hospital.id, name: "Ward", sortOrder: 5 } }),
    db.serviceCategory.create({ data: { orgId: hospital.id, name: "Procedures", sortOrder: 6 } }),
    db.serviceCategory.create({ data: { orgId: hospital.id, name: "Emergency", sortOrder: 7 } }),
  ])

  const hospItems = await Promise.all([
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[0].id, name: "General Consultation", behaviour: "consultation", stockType: "service", sellingPrice: 8000 } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[0].id, name: "Specialist Consultation", behaviour: "consultation", stockType: "service", sellingPrice: 15000 } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[1].id, name: "Full Blood Count", behaviour: "procedure", stockType: "service", sellingPrice: 5000 } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[1].id, name: "Malaria RDT", behaviour: "procedure", stockType: "service", sellingPrice: 3000 } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[1].id, name: "Urinalysis", behaviour: "procedure", stockType: "service", sellingPrice: 2500 } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[1].id, name: "Blood Sugar", behaviour: "procedure", stockType: "service", sellingPrice: 2000 } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[1].id, name: "Liver Function Test", behaviour: "procedure", stockType: "service", sellingPrice: 8000 } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[2].id, name: "Chest X-Ray", behaviour: "procedure", stockType: "service", sellingPrice: 12000 } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[2].id, name: "Abdominal Ultrasound", behaviour: "procedure", stockType: "service", sellingPrice: 15000 } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[3].id, name: "Paracetamol 500mg (x20)", behaviour: "product", stockType: "physical", costPrice: 200, sellingPrice: 500, stock: 500, minStock: 100, unit: "pack" } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[3].id, name: "Amoxicillin 500mg (x21)", behaviour: "product", stockType: "physical", costPrice: 800, sellingPrice: 1500, stock: 300, minStock: 50, unit: "pack" } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[3].id, name: "Artemether/Lumefantrine", behaviour: "product", stockType: "physical", costPrice: 1200, sellingPrice: 2500, stock: 200, minStock: 40, unit: "pack" } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[3].id, name: "Metformin 500mg (x30)", behaviour: "product", stockType: "physical", costPrice: 500, sellingPrice: 1000, stock: 150, minStock: 30, unit: "pack" } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[3].id, name: "Amlodipine 5mg (x30)", behaviour: "product", stockType: "physical", costPrice: 400, sellingPrice: 800, stock: 180, minStock: 30, unit: "pack" } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[4].id, name: "General Ward Bed (Night)", behaviour: "admission", stockType: "capacity", sellingPrice: 10000, capacityTotal: 40, capacityUsed: 12, recurringInterval: "daily" } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[4].id, name: "ICU Bed (Night)", behaviour: "admission", stockType: "capacity", sellingPrice: 50000, capacityTotal: 8, capacityUsed: 3, recurringInterval: "daily" } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[5].id, name: "Minor Surgery", behaviour: "procedure", stockType: "service", sellingPrice: 25000 } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[5].id, name: "Major Surgery", behaviour: "procedure", stockType: "service", sellingPrice: 150000 } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[6].id, name: "Emergency Room Fee", behaviour: "consultation", stockType: "service", sellingPrice: 20000 } }),
    db.serviceItem.create({ data: { orgId: hospital.id, categoryId: hospCats[6].id, name: "Emergency Registration", behaviour: "admin", stockType: "service", sellingPrice: 5000 } }),
  ])

  const patients = await Promise.all([
    db.contact.create({ data: { orgId: hospital.id, name: "Kwame Mensah", phone: "0244111222", type: "patient", dateOfBirth: "1985-03-15", gender: "Male", bloodGroup: "O+", insuranceType: "NHIS", insuranceId: "GHA-2024-001" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Ama Serwaa", phone: "0201222333", type: "patient", dateOfBirth: "1990-07-22", gender: "Female", bloodGroup: "A+", insuranceType: "Insurance" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Yaw Boateng", phone: "0551333444", type: "patient", dateOfBirth: "1978-11-08", gender: "Male", bloodGroup: "B+", allergies: ["Penicillin"] } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Abena Konadu", phone: "0277444555", type: "patient", dateOfBirth: "1995-01-30", gender: "Female", bloodGroup: "AB+" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Kofi Asante", phone: "0208555666", type: "patient", dateOfBirth: "2000-06-12", gender: "Male", bloodGroup: "O-" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Akosua Mensah", phone: "0244666777", type: "patient", dateOfBirth: "1988-09-25", gender: "Female", bloodGroup: "A-", insuranceType: "NHIS", insuranceId: "GHA-2024-006" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Kwaku Frimpong", phone: "0201777888", type: "patient", dateOfBirth: "1972-04-18", gender: "Male", allergies: ["Sulfa drugs", "Aspirin"] } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Efua Darkwah", phone: "0551888999", type: "patient", dateOfBirth: "1998-12-05", gender: "Female", bloodGroup: "B-" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Nana Agyemang", phone: "0277999000", type: "patient", dateOfBirth: "1965-08-20", gender: "Male", bloodGroup: "O+", emergencyContact: "Yaa Agyemang", emergencyPhone: "0244000111" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Adwoa Poku", phone: "0208000111", type: "patient", dateOfBirth: "2005-02-14", gender: "Female" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Kwesi Owusu", phone: "0244112233", type: "patient", dateOfBirth: "1992-05-30", gender: "Male", bloodGroup: "AB-" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Afia Boateng", phone: "0201223344", type: "patient", dateOfBirth: "1983-10-11", gender: "Female", bloodGroup: "A+", insuranceType: "NHIS" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Kojo Ampah", phone: "0551334455", type: "patient", dateOfBirth: "2010-07-03", gender: "Male" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Akua Sarpong", phone: "0277445566", type: "patient", dateOfBirth: "1975-01-19", gender: "Female", bloodGroup: "B+", allergies: ["Codeine"] } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Yaw Mensah", phone: "0208556677", type: "patient", dateOfBirth: "1960-11-28", gender: "Male", bloodGroup: "O+", emergencyContact: "Ama Mensah", emergencyPhone: "0244667788" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Esi Bonsu", phone: "0244778899", type: "patient", dateOfBirth: "1997-03-07", gender: "Female", bloodGroup: "A+" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Kwabena Asare", phone: "0201889900", type: "patient", dateOfBirth: "1980-08-14", gender: "Male" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Akosua Owusu", phone: "0551990011", type: "patient", dateOfBirth: "2002-12-22", gender: "Female", bloodGroup: "AB+" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Kofi Adomako", phone: "0277001122", type: "patient", dateOfBirth: "1955-06-09", gender: "Male", bloodGroup: "B-", emergencyContact: "Ama Adomako", emergencyPhone: "0208112233" } }),
    db.contact.create({ data: { orgId: hospital.id, name: "Abena Nyarko", phone: "0208223344", type: "patient", dateOfBirth: "1993-04-16", gender: "Female", insuranceType: "Insurance" } }),
  ])

  // Queue entries
  const queuePatients = patients.slice(0, 12)
  const complaints = ["Headache and fever", "Abdominal pain", "Cough for 2 weeks", "Chest pain", "Joint pain", "Skin rash", "Difficulty breathing", "Vomiting", "Back pain", "Eye irritation", "Pregnancy checkup", "Follow-up visit"]
  for (let i = 0; i < queuePatients.length; i++) {
    const p = queuePatients[i]
    const isEmergency = i === 3 || i === 6
    await db.queueEntry.create({
      data: {
        orgId: hospital.id, contactId: p.id,
        token: `0417-${String(i + 1).padStart(3, "0")}`,
        department: i < 6 ? "OPD" : "Emergency",
        chiefComplaint: complaints[i],
        symptomSeverity: isEmergency ? 9 : Math.floor(Math.random() * 5) + 1,
        emergencyFlag: isEmergency,
        visitStatus: i < 2 ? "in_consultation" : i < 4 ? "lab_results_ready" : i < 8 ? "waiting" : "closed",
        assignedDoctorId: i < 4 ? hospOps[0].id : undefined,
      },
    })
  }

  // Clinical records (SOAP notes for first 2 patients)
  await db.clinicalRecord.create({
    data: {
      orgId: hospital.id, contactId: patients[0].id, type: "consultation",
      data: { subjective: "Patient complains of persistent headache and low-grade fever for 3 days", objective: "Temp 38.2°C, BP 130/85, alert and oriented", assessment: "Suspected malaria", plan: "Order malaria RDT, prescribe paracetamol" },
      status: "completed", performedBy: hospOps[0].id, performedByName: hospOps[0].name,
    },
  })

  await db.clinicalRecord.create({
    data: {
      orgId: hospital.id, contactId: patients[0].id, type: "vitals",
      data: { temperature: 38.2, bpSystolic: 130, bpDiastolic: 85, pulse: 88, respiratoryRate: 18, spO2: 97, weight: 72 },
      status: "recorded", performedBy: hospOps[1].id, performedByName: hospOps[1].name,
    },
  })

  console.log(`  Korle Bu Hospital: ${hospItems.length} items, ${patients.length} patients, 12 queue entries`)

  // ═══════════════════════════════════════════════════════════
  // 3. DEMO ACADEMY — Institute vertical
  // ═══════════════════════════════════════════════════════════

  const school = await db.organization.create({
    data: {
      code: "ACAD",
      name: "Demo Academy",
      type: "institute",
      tier: "T2",
      activeBehaviours: ["recurring", "admin"],
      activeModules: ["enrollment", "groups", "subjects", "exams", "gradebook", "attendance", "fees", "payments", "schedule", "calendar", "communication", "staff"],
      paymentGate: "pay_before",
      taxConfig: GH_TAX,
      labelConfig: { recurring: "Term Fees", admin: "Administration" },
      maxOperators: 15,
      maxBranches: 1,
    },
  })

  const schoolBranch = await db.branch.create({ data: { orgId: school.id, name: "Main Campus", address: "East Legon, Accra", phone: "0302-555123", isDefault: true } })

  const schoolOps = await Promise.all([
    db.operator.create({ data: { orgId: school.id, name: "Mrs. Ampomah", pin: "1234", role: "admin", permissions: ["*"] } }),
    db.operator.create({ data: { orgId: school.id, name: "Mr. Mensah", pin: "5678", role: "teacher", permissions: ["grades", "attendance"] } }),
    db.operator.create({ data: { orgId: school.id, name: "Ms. Darko", pin: "9012", role: "registrar", permissions: ["enrollment", "fees"] } }),
    db.operator.create({ data: { orgId: school.id, name: "Mr. Osei", pin: "3456", role: "accountant", permissions: ["fees", "payments", "reports"] } }),
  ])

  const schoolCats = await Promise.all([
    db.serviceCategory.create({ data: { orgId: school.id, name: "Tuition", sortOrder: 1 } }),
    db.serviceCategory.create({ data: { orgId: school.id, name: "Miscellaneous", sortOrder: 2 } }),
  ])

  const schoolItems = await Promise.all([
    db.serviceItem.create({ data: { orgId: school.id, categoryId: schoolCats[0].id, name: "Term Tuition Fee", behaviour: "recurring", stockType: "service", sellingPrice: 250000, recurringInterval: "termly" } }),
    db.serviceItem.create({ data: { orgId: school.id, categoryId: schoolCats[0].id, name: "PTA Levy", behaviour: "recurring", stockType: "service", sellingPrice: 15000, recurringInterval: "termly" } }),
    db.serviceItem.create({ data: { orgId: school.id, categoryId: schoolCats[0].id, name: "ICT Lab Fee", behaviour: "recurring", stockType: "service", sellingPrice: 8000, recurringInterval: "termly" } }),
    db.serviceItem.create({ data: { orgId: school.id, categoryId: schoolCats[1].id, name: "School Uniform", behaviour: "product", stockType: "physical", costPrice: 8000, sellingPrice: 12000, stock: 50, minStock: 10, unit: "set" } }),
    db.serviceItem.create({ data: { orgId: school.id, categoryId: schoolCats[1].id, name: "Exercise Books (Pack of 10)", behaviour: "product", stockType: "physical", costPrice: 1500, sellingPrice: 2500, stock: 200, minStock: 50, unit: "pack" } }),
  ])

  const groups = await Promise.all([
    db.group.create({ data: { orgId: school.id, name: "Class 1A", type: "class", academicYear: "2025/2026", term: "Term 2", capacity: 35, teacherId: schoolOps[1].id } }),
    db.group.create({ data: { orgId: school.id, name: "Class 1B", type: "class", academicYear: "2025/2026", term: "Term 2", capacity: 35 } }),
    db.group.create({ data: { orgId: school.id, name: "Class 2A", type: "class", academicYear: "2025/2026", term: "Term 2", capacity: 30, teacherId: schoolOps[1].id } }),
    db.group.create({ data: { orgId: school.id, name: "Class 2B", type: "class", academicYear: "2025/2026", term: "Term 2", capacity: 30 } }),
    db.group.create({ data: { orgId: school.id, name: "Class 3A", type: "class", academicYear: "2025/2026", term: "Term 2", capacity: 30 } }),
    db.group.create({ data: { orgId: school.id, name: "Class 3B", type: "class", academicYear: "2025/2026", term: "Term 2", capacity: 30 } }),
  ])

  const subjects = await Promise.all([
    db.subject.create({ data: { orgId: school.id, name: "Mathematics", department: "Sciences" } }),
    db.subject.create({ data: { orgId: school.id, name: "English Language", department: "Languages" } }),
    db.subject.create({ data: { orgId: school.id, name: "Science", department: "Sciences" } }),
    db.subject.create({ data: { orgId: school.id, name: "Social Studies", department: "Humanities" } }),
    db.subject.create({ data: { orgId: school.id, name: "ICT", department: "Sciences" } }),
    db.subject.create({ data: { orgId: school.id, name: "French", department: "Languages" } }),
    db.subject.create({ data: { orgId: school.id, name: "Creative Arts", department: "Arts" } }),
    db.subject.create({ data: { orgId: school.id, name: "Physical Education", department: "Sports" } }),
    db.subject.create({ data: { orgId: school.id, name: "Religious & Moral Education", department: "Humanities" } }),
    db.subject.create({ data: { orgId: school.id, name: "Ghanaian Language (Twi)", department: "Languages" } }),
  ])

  const studentNames = [
    "Kwame Adu", "Ama Boateng", "Yaw Nkrumah", "Abena Mensah", "Kofi Appiah",
    "Akua Asante", "Kweku Owusu", "Efua Darko", "Nana Osei", "Adwoa Frimpong",
    "Kwesi Adomako", "Afia Bonsu", "Kojo Sarpong", "Akosua Nyarko", "Yaw Poku",
  ]

  const guardian = await db.contact.create({ data: { orgId: school.id, name: "Mr. & Mrs. Adu", phone: "0244123456", type: "guardian" } })

  const students = await Promise.all(
    studentNames.map((name, i) =>
      db.contact.create({
        data: {
          orgId: school.id, name, type: "student", status: "active",
          groupId: groups[i % 6].id,
          dateOfBirth: `${2012 + (i % 4)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
          gender: i % 2 === 0 ? "Male" : "Female",
          guardianId: i < 3 ? guardian.id : undefined,
          phone: `024${String(4000000 + i)}`,
          enrolledAt: new Date("2025-09-01"),
        },
      })
    )
  )

  // Fee records via recurring charges
  for (const student of students.slice(0, 10)) {
    await db.recurringCharge.create({
      data: {
        orgId: school.id, contactId: student.id, serviceItemId: schoolItems[0].id,
        interval: "termly", amount: 250000, nextDueDate: new Date("2026-05-01"),
        chargeCount: 1, lastChargedAt: new Date("2026-01-15"),
      },
    })
  }

  console.log(`  Demo Academy: ${schoolItems.length} items, ${students.length} students, ${groups.length} groups, ${subjects.length} subjects`)
  console.log("Seed complete!")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
