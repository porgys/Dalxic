/**
 * TIER_DEFAULTS — Module configurations per hospital tier.
 * Drives what stations appear, device limits, and WhatsApp allocation.
 * Each tier is additive — T2 includes all of T1, T3 includes all of T2, etc.
 */

export const TIER_DEFAULTS = {
  T1: {
    label: "Clinic",
    modules: [
      "front_desk",
      "waiting_room",
      "doctor",
      "pharmacy",
      "billing",
    ],
    maxDevices: 6,
    whatsappBundlePerMonth: 500,
    description: "Private clinics, health centres, small outpatient facilities",
  },
  T2: {
    label: "Medium Hospital",
    modules: [
      "front_desk",
      "waiting_room",
      "doctor",
      "pharmacy",
      "billing",
      "lab",
      "injection_room",
      "nurse_station",
    ],
    maxDevices: 15,
    whatsappBundlePerMonth: 2000,
    description: "District hospitals, medium private hospitals, polyclinics",
  },
  T3: {
    label: "Large Hospital",
    modules: [
      "front_desk",
      "waiting_room",
      "doctor",
      "pharmacy",
      "billing",
      "lab",
      "injection_room",
      "nurse_station",
      "ct_radiology",
      "ward_ipd",
      "ultrasound",
    ],
    maxDevices: 35,
    whatsappBundlePerMonth: 5000,
    description: "Regional hospitals, larger private hospitals, specialist centres",
  },
  T4: {
    label: "Full Hospital",
    modules: [
      "front_desk",
      "waiting_room",
      "doctor",
      "pharmacy",
      "billing",
      "lab",
      "injection_room",
      "nurse_station",
      "ct_radiology",
      "ward_ipd",
      "ultrasound",
      "emergency",
      "icu",
      "maternity",
      "blood_bank",
    ],
    maxDevices: 999,
    whatsappBundlePerMonth: 20000,
    description: "Teaching hospitals, national referral hospitals, large private groups",
  },
} as const;

export type TierKey = keyof typeof TIER_DEFAULTS;
export type ModuleKey = (typeof TIER_DEFAULTS)[TierKey]["modules"][number];

/**
 * ALL_WORKSTATIONS — Master list of every station in the system.
 * Platform page filters this by hospital's active_modules.
 */
export const ALL_WORKSTATIONS = [
  // T1 — Core
  { key: "front_desk", href: "/front-desk", icon: "🏥", title: "Front Desk", desc: "Patient Registration & Check-In", role: "Device Operator" },
  { key: "waiting_room", href: "/waiting-room", icon: "📺", title: "Waiting Room", desc: "Live Queue Display", role: "Public Display" },
  { key: "doctor", href: "/doctor", icon: "🩺", title: "Doctor View", desc: "Consultation & Session Management", role: "Doctor" },
  { key: "pharmacy", href: "/pharmacy", icon: "💊", title: "Pharmacy", desc: "Prescription Dispensing", role: "Pharmacist" },
  { key: "billing", href: "/billing", icon: "🧾", title: "Billing", desc: "Invoice & Payment Collection", role: "Billing Officer" },
  // T2 — Medium
  { key: "lab", href: "/lab", icon: "🔬", title: "Lab Station", desc: "Lab Orders & Result Entry", role: "Lab Technician" },
  { key: "injection_room", href: "/injection-room", icon: "💉", title: "Injection Room", desc: "Injection & IV Administration", role: "Nurse" },
  { key: "nurse_station", href: "/nurse-station", icon: "🩹", title: "Nurse Station", desc: "Nursing Workflow & Observations", role: "Nurse" },
  // T3 — Large
  { key: "ct_radiology", href: "/radiology", icon: "🫁", title: "CT / Radiology", desc: "Imaging Referrals & Results", role: "Radiologist" },
  { key: "ward_ipd", href: "/ward", icon: "🛏️", title: "Ward / IPD", desc: "Inpatient Management", role: "Ward Nurse" },
  { key: "ultrasound", href: "/ultrasound", icon: "📡", title: "Ultrasound", desc: "Ultrasound Referrals & Results", role: "Sonographer" },
  // T4 — Full
  { key: "emergency", href: "/emergency-triage", icon: "🚨", title: "Emergency", desc: "Triage & Emergency Care", role: "Emergency Nurse" },
  { key: "icu", href: "/icu", icon: "❤️", title: "ICU", desc: "Intensive Care Management", role: "ICU Nurse" },
  { key: "maternity", href: "/maternity", icon: "🤱", title: "Maternity", desc: "Antenatal, Delivery & Postnatal", role: "Midwife" },
  { key: "blood_bank", href: "/blood-bank", icon: "🩸", title: "Blood Bank", desc: "Blood Inventory & Transfusions", role: "Blood Bank Officer" },
] as const;

/** Utility stations always visible regardless of tier */
export const UTILITY_STATIONS = [
  { key: "admin", href: "/admin", icon: "⚙️", title: "Hospital Admin", desc: "Device & Book Management", role: "Hospital Admin" },
  { key: "beds", href: "/beds", icon: "🛏️", title: "Bed Management", desc: "Ward & Bed Status Tracking", role: "Ward Manager" },
  { key: "display", href: "/display", icon: "📢", title: "Display Board", desc: "Queue Callout & Voice Announcements", role: "Public Display" },
] as const;

/** Get tier defaults for a tier key */
export function getTierDefaults(tier: string) {
  return TIER_DEFAULTS[tier as TierKey] || TIER_DEFAULTS.T1;
}

/** Get workstations for a set of active modules */
export function getActiveWorkstations(activeModules: string[]) {
  return ALL_WORKSTATIONS.filter((ws) => activeModules.includes(ws.key));
}
