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
      "chat",
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
      "chat",
      "bookkeeping",
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
      "chat",
      "bookkeeping",
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
  MASTER: {
    label: "The Master",
    modules: [
      "front_desk",
      "waiting_room",
      "doctor",
      "pharmacy",
      "billing",
      "chat",
      "bookkeeping",
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
      "admin",
      "beds",
    ],
    maxDevices: 999,
    whatsappBundlePerMonth: 50000,
    description: "Every module unlocked — freestyle configuration for any hospital type",
  },
} as const;

export type TierKey = keyof typeof TIER_DEFAULTS;
export type ModuleKey = (typeof TIER_DEFAULTS)[TierKey]["modules"][number];

/**
 * ALL_WORKSTATIONS — Master list of every workstation in the system.
 * Platform page filters this by hospital's active_modules.
 */
/**
 * ROUTE_MAP — Obfuscated route hashes for all workstation paths.
 * Real page directories (/front-desk, /doctor, etc.) are blocked by middleware.
 * Only these /w/ hashes are accessible. Next.js rewrites map them internally.
 */
export const ROUTE_MAP = {
  "front_desk":        "/w/xK9~vR3mZp7Q-dW1nB5tYj8sLf",
  "waiting_room":      "/w/Tj4_bN8wXq2R~hF6yA0cVm3eKs",
  "doctor":            "/w/mH7~pD1kZr5W-vJ9nQ3xBf8tLa",
  "pharmacy":          "/w/Qw2_jF5nXd8T~cK0rV4mYb7hGs",
  "billing":           "/w/dR6~xA9sZm3P-tN1yJ7wBk5vLf",
  "lab":               "/w/Yn3_kW8rXb1Q~mF4dH0pTj6cAs",
  "injection_room":    "/w/sB5~hJ2nZf9V-xK7rD3mYw1tLp",
  "nurse_station":     "/w/Fk8_vQ4dXt6R~bN0yH2jAm9wCs",
  "ct_radiology":      "/w/pA1~tL7kZs4W-mR9xF3nBd5vYj",
  "ward_ipd":          "/w/Wm6_rH3bXn9T~jK2vD8sYf0cQa",
  "ultrasound":        "/w/jV4~nB8wZd2P-yF5kR1mXt7hLs",
  "emergency":         "/w/Rh9_xK5tXm3Q~wA7nJ2dBp4vFs",
  "icu":               "/w/bN2~sF6kZj8V-rD0mH4nYt9wLa",
  "maternity":         "/w/Xd7_yR1nXf5T~vK3bJ8mAw0cPs",
  "blood_bank":        "/w/kQ5~hW9sZr2P-tB6nF3dYm8jLv",
  "admin":             "/w/Vt8_mA4bXk1R~wN7rJ0nDs3hFy",
  "beds":              "/w/nF3~jK7dZs9W-yR2vH5mBt1xQa",
  "platform":          "/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh",
  "kiosk":             "/w/Ys9_dF2bXh6R~mK0rV3nJt7wLp",
  "ops":               "/s/ZXJ2LkQ9Mnx0V3hCYTVrUw.aGVhbHRo",
  "chat":              "/w/Lx3~mT7kZq1W-vN9rF4bDs8hYp",
  "bookkeeping":       "/w/Gn4~rL8kZv2W-mB5xJ1nYt9hQs",
  "emergency_override":"/w/Dk7_xQ3nXv0T~sF6bW2mYr8hLa",
  "print_ticket":      "/w/fR2~kV6dZt9W-nA1mJ4bXh7cPs",
} as const;

export const ALL_WORKSTATIONS = [
  // T1 — Core
  { key: "front_desk", href: ROUTE_MAP.front_desk, icon: "🏥", title: "Front Desk", desc: "Patient Registration & Check-In", role: "Device Operator" },
  { key: "waiting_room", href: ROUTE_MAP.waiting_room, icon: "📺", title: "Waiting Room", desc: "Live Queue Display & Voice Callout", role: "Public Display" },
  { key: "doctor", href: ROUTE_MAP.doctor, icon: "🩺", title: "Doctor View", desc: "Consultation & Session Management", role: "Doctor" },
  { key: "pharmacy", href: ROUTE_MAP.pharmacy, icon: "💊", title: "Pharmacy", desc: "Prescription Dispensing", role: "Pharmacist" },
  { key: "billing", href: ROUTE_MAP.billing, icon: "🧾", title: "Billing", desc: "Invoice & Payment Collection", role: "Billing Officer" },
  { key: "bookkeeping", href: ROUTE_MAP.bookkeeping, icon: "📊", title: "Bookkeeping", desc: "Patient Records, Revenue & Assessments", role: "Records Officer" },
  // T2 — Medium
  { key: "lab", href: ROUTE_MAP.lab, icon: "🔬", title: "Laboratory", desc: "Lab Orders & Result Entry", role: "Lab Technician" },
  { key: "injection_room", href: ROUTE_MAP.injection_room, icon: "💉", title: "Injection Room", desc: "Injection & IV Administration", role: "Nurse" },
  { key: "nurse_station", href: ROUTE_MAP.nurse_station, icon: "🩹", title: "Nursing", desc: "Nursing Workflow & Observations", role: "Nurse" },
  // T3 — Large
  { key: "ct_radiology", href: ROUTE_MAP.ct_radiology, icon: "🫁", title: "CT / Radiology", desc: "Imaging Referrals & Results", role: "Radiologist" },
  { key: "ward_ipd", href: ROUTE_MAP.ward_ipd, icon: "🛏️", title: "Ward / IPD", desc: "Inpatient Management", role: "Ward Nurse" },
  { key: "ultrasound", href: ROUTE_MAP.ultrasound, icon: "📡", title: "Ultrasound", desc: "Ultrasound Referrals & Results", role: "Sonographer" },
  // T4 — Full
  { key: "emergency", href: ROUTE_MAP.emergency, icon: "🚨", title: "Emergency", desc: "Triage & Emergency Care", role: "Emergency Nurse" },
  { key: "icu", href: ROUTE_MAP.icu, icon: "❤️", title: "ICU", desc: "Intensive Care Management", role: "ICU Nurse" },
  { key: "maternity", href: ROUTE_MAP.maternity, icon: "🤱", title: "Maternity", desc: "Antenatal, Delivery & Postnatal", role: "Midwife" },
  { key: "blood_bank", href: ROUTE_MAP.blood_bank, icon: "🩸", title: "Blood Bank", desc: "Blood Inventory & Transfusions", role: "Blood Bank Officer" },
] as const;

/** Utility workstations always visible regardless of tier */
export const UTILITY_STATIONS = [
  { key: "admin", href: ROUTE_MAP.admin, icon: "⚙️", title: "Hospital Admin", desc: "Device & Book Management", role: "Hospital Admin" },
  { key: "beds", href: ROUTE_MAP.beds, icon: "🛏️", title: "Bed Management", desc: "Ward & Bed Status Tracking", role: "Ward Manager" },
  { key: "finance", href: "/finance", icon: "💰", title: "Finance", desc: "Revenue, Payouts & Shifts", role: "Finance Officer" },
  { key: "rates", href: "/rates", icon: "💲", title: "Pricing Control", desc: "Doctor, Ward & Service Rates", role: "Finance Officer" },
] as const;

/** Get tier defaults for a tier key */
export function getTierDefaults(tier: string) {
  return TIER_DEFAULTS[tier as TierKey] || TIER_DEFAULTS.T1;
}

/** Get workstations for a set of active modules */
export function getActiveWorkstations(activeModules: string[]) {
  return ALL_WORKSTATIONS.filter((ws) => activeModules.includes(ws.key));
}
