import type { HealthConfig } from "./types"

const HEALTH_MODULES_ALL = [
  "front-desk", "doctor", "nurse-station", "waiting-room", "lab", "pharmacy",
  "billing-health", "ward", "icu", "maternity", "injection-room", "radiology",
  "ultrasound", "bookkeeping-h", "blood-bank",
]

export const HEALTH: HealthConfig = {
  type: "health",
  label: "Health",
  brand: "DalxicHealth",
  accent: "copper",
  paymentGate: "pay_before",
  defaultBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"],

  labelConfig: {
    consultation: "Doctor Visit",
    procedure: "Surgery",
    product: "Drugs",
    admission: "Ward Bed",
    recurring: "Ward Nightly",
    admin: "Patient Card",
  },

  roles: {
    doctor:          { label: "Doctor",          modules: ["doctor", "front-desk", "lab", "radiology", "ultrasound", "waiting-room"] },
    nurse:           { label: "Nurse",           modules: ["nurse-station", "injection-room", "waiting-room", "ward"] },
    pharmacist:      { label: "Pharmacist",      modules: ["pharmacy"] },
    lab_tech:        { label: "Lab Technician",  modules: ["lab"] },
    radiologist:     { label: "Radiologist",     modules: ["radiology"] },
    sonographer:     { label: "Sonographer",     modules: ["ultrasound"] },
    billing_clerk:   { label: "Billing Clerk",   modules: ["billing-health"] },
    front_desk:      { label: "Front Desk",      modules: ["front-desk", "waiting-room"] },
    records:         { label: "Records Officer", modules: ["bookkeeping-h", "front-desk"] },
    icu_nurse:       { label: "ICU Nurse",       modules: ["icu", "nurse-station"] },
    midwife:         { label: "Midwife",         modules: ["maternity", "nurse-station", "waiting-room"] },
    blood_bank_tech: { label: "Blood Bank Tech", modules: ["blood-bank"] },
    triage_nurse:    { label: "Triage Nurse",    modules: ["front-desk", "waiting-room"] },
    ward_nurse:      { label: "Ward Nurse",      modules: ["ward", "nurse-station"] },
    injection_nurse: { label: "Injection Nurse", modules: ["injection-room", "nurse-station"] },
    finance:         { label: "Finance Officer", modules: ["billing-health", "bookkeeping-h"] },
    bookkeeper:      { label: "Bookkeeper",      modules: ["bookkeeping-h"] },
    admin:           { label: "Administrator",   modules: HEALTH_MODULES_ALL },
    owner:           { label: "Owner",           modules: HEALTH_MODULES_ALL },
    super_admin:     { label: "Super Admin",     modules: HEALTH_MODULES_ALL },
  },

  specialties: [
    "General Practice", "Internal Medicine", "Surgery", "Pediatrics",
    "OB/GYN", "Cardiology", "Dermatology", "ENT",
    "Ophthalmology", "Orthopedics", "Psychiatry", "Neurology",
    "Urology", "Oncology", "Radiology", "Pathology",
    "Anesthesiology", "Emergency Medicine", "Family Medicine", "Pulmonology",
    "Gastroenterology", "Nephrology", "Hematology", "Endocrinology",
    "Rheumatology", "Infectious Disease", "Geriatrics", "Sports Medicine",
  ],

  rateDefaults: {
    registration: 2000,
    consultation: 5000,
    followUp: 3000,
    emergency: 10000,
  },

  serviceTypes: [
    "Consultation", "Lab", "Imaging", "Injection",
    "Ward", "ICU", "Procedure", "Emergency",
  ],
}
