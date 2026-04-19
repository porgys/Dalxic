"use client"
import Link from "next/link"
import { Icon, IconName } from "./Icon"
import { T } from "./primitives"
import { HEALTH_MODULES, HealthModuleDef } from "@/lib/ops/mock"

const ICON_FOR: Record<string, IconName> = {
  "front-desk": "customers", doctor: "user", "nurse-station": "support",
  "waiting-room": "orders", lab: "analytics", pharmacy: "inventory",
  radiology: "layers", ultrasound: "layers", ward: "tenants",
  icu: "bolt", maternity: "support", "blood-bank": "database",
  "injection-room": "bolt", billing: "billing", bookkeeping: "coa",
}

const GROUP_ORDER = ["Clinical", "Diagnostics", "Inpatient", "Specialist", "Admin"] as const
const GROUP_BLURB: Record<string, string> = {
  Clinical:    "Patient registration, consultations, nursing and queue",
  Diagnostics: "Laboratory, pharmacy, radiology and ultrasound",
  Inpatient:   "Wards, intensive care and maternity",
  Specialist:  "Blood bank, injection room and specialised units",
  Admin:       "Billing, bookkeeping and financial management",
}

const HEALTH_COL = "#D97706"

export function HealthLaunchpad({ orgName }: { orgName: string }) {
  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    items: HEALTH_MODULES.filter((m) => m.group === g),
  }))

  const live = HEALTH_MODULES.filter(m => m.status === "live").length
  const preview = HEALTH_MODULES.filter(m => m.status === "preview").length

  return (
    <div style={{ background: T.bg, minHeight: "calc(100vh - 56px)", padding: "48px 32px 96px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1480, margin: "0 auto" }}>

        <header style={{ marginBottom: 48, textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, color: HEALTH_COL, marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
            DalxicHealth Workstation
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.03em", lineHeight: 1.0, marginBottom: 16 }}>
            Every Ward, Every Desk,<br />
            <span style={{ background: `linear-gradient(135deg, ${HEALTH_COL}, #E69A2E)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              One Clinical Engine.
            </span>
          </h1>
          <p style={{ fontSize: 16, color: T.txM, maxWidth: 720, lineHeight: 1.6, margin: "0 auto" }}>
            From front desk to pharmacy — DalxicHealth unifies patient care,
            diagnostics, billing and compliance under one platform. Built for {orgName}.
          </p>

          <div style={{ display: "flex", gap: 24, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
            <HeroStat label="Modules Live"   value={live}     accent={T.emerald} />
            <HeroStat label="Patients Today" value="127"      accent={HEALTH_COL} />
            <HeroStat label="Queue Active"   value="14"       accent={T.amber} />
            <HeroStat label="Beds Occupied"  value="38"       accent={T.tx} />
          </div>
        </header>

        {grouped.map(({ group, items }) => (
          <section key={group} style={{ marginBottom: 56, textAlign: "center" }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 11, fontWeight: 800, color: HEALTH_COL, letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                {group}
              </h2>
              <p style={{ fontSize: 13, color: T.txM, marginTop: 6 }}>{GROUP_BLURB[group]}</p>
              <div style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace", marginTop: 6, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {items.length} modules
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, 280px)", gap: 14, textAlign: "left", justifyContent: "center" }}>
              {items.map((m) => <ModuleCard key={m.slug} mod={m} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function HeroStat({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div style={{
      padding: "16px 22px", borderRadius: 14,
      background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`,
      minWidth: 140,
    }}>
      <div style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: T.txD, marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
    </div>
  )
}

function ModuleCard({ mod }: { mod: HealthModuleDef }) {
  const icon = ICON_FOR[mod.slug] ?? "tag"
  const isPreview = mod.status === "preview"
  const isLocked = mod.status === "locked"

  return (
    <Link href={mod.href} style={{ textDecoration: "none" }}>
      <div style={{
        position: "relative",
        padding: 20, borderRadius: 16,
        background: "rgba(217,119,6,0.02)",
        border: `1px solid ${isLocked ? "rgba(255,255,255,0.04)" : "rgba(217,119,6,0.10)"}`,
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        minHeight: 132,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        transition: "transform 0.18s ease, border-color 0.18s, background 0.18s",
        cursor: isLocked ? "not-allowed" : "pointer",
        opacity: isLocked ? 0.4 : 1,
      }}
        onMouseEnter={(e) => {
          if (isLocked) return
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = "translateY(-2px)"
          el.style.background = "rgba(217,119,6,0.06)"
          el.style.borderColor = "rgba(217,119,6,0.30)"
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = "translateY(0)"
          el.style.background = "rgba(217,119,6,0.02)"
          el.style.borderColor = isLocked ? "rgba(255,255,255,0.04)" : "rgba(217,119,6,0.10)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(217,119,6,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: HEALTH_COL,
          }}>
            <Icon name={icon} size={20} />
          </div>
          {isPreview && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase",
              padding: "3px 8px", borderRadius: 999,
              color: HEALTH_COL, background: `${HEALTH_COL}10`, border: `1px solid ${HEALTH_COL}25`,
              fontFamily: "'DM Mono', monospace",
            }}>Preview</span>
          )}
          {isLocked && (
            <span style={{ color: T.txD, display: "flex" }}><Icon name="lock" size={14} /></span>
          )}
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.tx, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.005em" }}>
            {mod.title}
          </h3>
          <p style={{ fontSize: 12, color: T.txM, lineHeight: 1.45 }}>{mod.blurb}</p>
        </div>
      </div>
    </Link>
  )
}
