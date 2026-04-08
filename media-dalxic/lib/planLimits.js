// ── Plan definitions ─────────────────────────────────────────────────────────
// Each plan key maps to scan limits + feature access flags.
// Admin assigns plans to users via Firestore: users/{uid}/profile/account.plan
export const PLANS = {
  // ── Non Professionals (Individuals) ──
  free:               { name: "Free",                  scansPerMonth: 5,        chatPerDay: 5,      label: "5 scans/mo",       category: "individuals", tier: "free" },
  individual_basic:   { name: "Casual Verification",   scansPerMonth: 30,       chatPerDay: 25,     label: "30 scans/mo",      category: "individuals", tier: "basic",
    modules: ["chromaveil"], features: ["basic_summary"], support: "community" },
  individual_standard:{ name: "Power Verification",    scansPerMonth: 50,       chatPerDay: 50,     label: "50 scans/mo",      category: "individuals", tier: "standard",
    modules: ["chromaveil", "kineticscan"], features: ["basic_pdf", "projects_1"], support: "email" },
  individual_premium: { name: "Forensic Suite",        scansPerMonth: 70,       chatPerDay: 100,    label: "70 scans/mo",      category: "individuals", tier: "premium",
    modules: ["chromaveil", "kineticscan", "sonictrace", "narrativeguard", "dalxicmind"], features: ["forensiq_reports", "dalxic_chat", "projects_1"], support: "email" },

  // ── News Presenters & Journalists ──
  journalist_basic:   { name: "Newsroom Starter",      scansPerMonth: 100,      chatPerDay: 50,     label: "100 scans/mo",     category: "journalists", tier: "basic",
    modules: ["chromaveil", "kineticscan"], features: ["basic_pdf", "projects_1"], support: "email" },
  journalist_standard:{ name: "Press Verification",    scansPerMonth: 250,      chatPerDay: 150,    label: "250 scans/mo",     category: "journalists", tier: "standard",
    modules: ["chromaveil", "kineticscan", "sonictrace", "narrativeguard"], features: ["forensiq_reports", "dalxic_chat", "projects_3"], support: "priority_email" },
  journalist_premium: { name: "Editorial Intelligence",scansPerMonth: 500,      chatPerDay: 300,    label: "500 scans/mo",     category: "journalists", tier: "premium",
    modules: ["chromaveil", "kineticscan", "sonictrace", "narrativeguard", "dalxicmind"], features: ["forensiq_reports", "dalxic_chat", "projects_unlimited", "nexuslink_api"], support: "priority_email" },

  // ── Broadcast Organisations & Media Groups ──
  broadcast_basic:    { name: "Broadcast Starter",     scansPerMonth: 500,      chatPerDay: 200,    label: "500 scans/mo",     category: "broadcast", tier: "basic",
    modules: ["chromaveil", "kineticscan", "sonictrace"], features: ["forensiq_reports", "projects_3", "dalxic_chat"], support: "priority_email" },
  broadcast_standard: { name: "Broadcast Operations",  scansPerMonth: 2000,     chatPerDay: 500,    label: "2,000 scans/mo",   category: "broadcast", tier: "standard",
    modules: ["chromaveil", "kineticscan", "sonictrace", "narrativeguard", "sentinelcore", "dalxicmind"], features: ["forensiq_reports", "dalxic_chat", "projects_unlimited", "nexuslink_api", "custom_branding"], support: "dedicated" },
  broadcast_premium:  { name: "Enterprise Broadcast",  scansPerMonth: Infinity, chatPerDay: Infinity, label: "Unlimited",        category: "broadcast", tier: "premium",
    modules: ["chromaveil", "kineticscan", "sonictrace", "narrativeguard", "sentinelcore", "fusionprobe", "dalxicmind"], features: ["forensiq_reports", "dalxic_chat", "projects_unlimited", "nexuslink_api", "custom_branding", "sso_saml", "audit_logs", "white_label"], support: "dedicated_sla" },

  // ── Government & Judiciary ──
  gov_basic:          { name: "Institutional Starter",  scansPerMonth: 1000,    chatPerDay: 500,    label: "1,000 scans/mo",   category: "government", tier: "basic",
    modules: ["chromaveil", "kineticscan", "sonictrace", "narrativeguard", "dalxicmind"], features: ["forensiq_reports", "dalxic_chat", "projects_unlimited", "court_admissible"], support: "dedicated" },
  gov_standard:       { name: "Judicial Operations",    scansPerMonth: 5000,    chatPerDay: 2000,   label: "5,000 scans/mo",   category: "government", tier: "standard",
    modules: ["chromaveil", "kineticscan", "sonictrace", "narrativeguard", "sentinelcore", "fusionprobe", "dalxicmind"], features: ["forensiq_reports", "dalxic_chat", "projects_unlimited", "nexuslink_api", "court_admissible", "audit_logs", "sso_saml", "custom_branding"], support: "dedicated_sla" },
  gov_premium:        { name: "Sovereign Operations",   scansPerMonth: Infinity, chatPerDay: Infinity, label: "Unlimited",       category: "government", tier: "premium",
    modules: ["chromaveil", "kineticscan", "sonictrace", "narrativeguard", "sentinelcore", "fusionprobe", "dalxicmind"], features: ["forensiq_reports", "dalxic_chat", "projects_unlimited", "nexuslink_api", "court_admissible", "audit_logs", "sso_saml", "white_label", "custom_model_training", "on_premise", "air_gap", "board_briefings"], support: "sovereign_sla" },

  // Legacy aliases (backward compat)
  sentinel:  { name: "Sentinel",  scansPerMonth: 100,       label: "100 scans/mo"  },
  guardian:  { name: "Guardian",  scansPerMonth: 500,        label: "500 scans/mo"  },
  vanguard:  { name: "Vanguard",  scansPerMonth: 2000,       label: "2,000 scans/mo" },
  citadel:   { name: "Citadel",   scansPerMonth: Infinity,   label: "Unlimited"     },
  sovereign: { name: "Sovereign", scansPerMonth: Infinity,   label: "Unlimited"     },
}

export function getPlanLimit(planKey) {
  return PLANS[planKey?.toLowerCase()] ?? PLANS.free
}

// Returns the first day of the current UTC month as an ISO date string — used as reset key
export function currentMonthKey() {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
}
