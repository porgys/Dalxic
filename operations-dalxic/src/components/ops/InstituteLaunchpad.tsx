"use client"
import Link from "next/link"
import { Icon, IconName } from "./Icon"
import { T } from "./primitives"
import { INSTITUTE_MODULES, InstModuleDef } from "@/lib/ops/mock"

const ICON_FOR: Record<string, IconName> = {
  enrollment: "customers", groups: "tenants", subjects: "journals",
  exams: "reports", gradebook: "financials", attendance: "check",
  fees: "billing", payments: "expenses", schedule: "calendar",
  calendar: "calendar", communication: "mail", staff: "staff",
}

const GROUP_ORDER = ["Enrollment", "Academics", "Finance", "Scheduling", "Admin"] as const
const GROUP_BLURB: Record<string, string> = {
  Enrollment:  "Student registration, class groups and guardians",
  Academics:   "Subjects, examinations, grading and attendance",
  Finance:     "Fee schedules, payments and outstanding balances",
  Scheduling:  "Timetables, calendar and event management",
  Admin:       "Communication centre and staff management",
}

const INST_COL = "#0EA5E9"

export function InstituteLaunchpad({ orgName }: { orgName: string }) {
  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    items: INSTITUTE_MODULES.filter((m) => m.group === g),
  }))

  const live = INSTITUTE_MODULES.filter(m => m.status === "live").length
  const preview = INSTITUTE_MODULES.filter(m => m.status === "preview").length

  return (
    <div style={{ background: T.bg, minHeight: "calc(100vh - 56px)", padding: "48px 32px 96px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1480, margin: "0 auto" }}>

        <header style={{ marginBottom: 48, textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, color: INST_COL, marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
            DalxicInstitute Workstation
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.03em", lineHeight: 1.0, marginBottom: 16 }}>
            Every Classroom, Every Record,<br />
            <span style={{ background: `linear-gradient(135deg, ${INST_COL}, #38BDF8)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              One Academic Engine.
            </span>
          </h1>
          <p style={{ fontSize: 16, color: T.txM, maxWidth: 720, lineHeight: 1.6, margin: "0 auto" }}>
            From enrollment to graduation — DalxicInstitute unifies academics,
            attendance, fees and communication under one platform. Built for {orgName}.
          </p>

          <div style={{ display: "flex", gap: 24, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
            <HeroStat label="Modules Live"    value={live}    accent={T.emerald} />
            <HeroStat label="Students Active" value="342"     accent={INST_COL} />
            <HeroStat label="Staff"           value="28"      accent={T.amber} />
            <HeroStat label="Classes"         value="18"      accent={T.tx} />
          </div>
        </header>

        {grouped.map(({ group, items }) => (
          <section key={group} style={{ marginBottom: 56, textAlign: "center" }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 11, fontWeight: 800, color: INST_COL, letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
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

function ModuleCard({ mod }: { mod: InstModuleDef }) {
  const icon = ICON_FOR[mod.slug] ?? "tag"
  const isPreview = mod.status === "preview"
  const isLocked = mod.status === "locked"

  return (
    <Link href={mod.href} style={{ textDecoration: "none" }}>
      <div style={{
        position: "relative",
        padding: 20, borderRadius: 16,
        background: "rgba(14,165,233,0.02)",
        border: `1px solid ${isLocked ? "rgba(255,255,255,0.04)" : "rgba(14,165,233,0.10)"}`,
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
          el.style.background = "rgba(14,165,233,0.06)"
          el.style.borderColor = "rgba(14,165,233,0.30)"
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = "translateY(0)"
          el.style.background = "rgba(14,165,233,0.02)"
          el.style.borderColor = isLocked ? "rgba(255,255,255,0.04)" : "rgba(14,165,233,0.10)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(14,165,233,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: INST_COL,
          }}>
            <Icon name={icon} size={20} />
          </div>
          {isPreview && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase",
              padding: "3px 8px", borderRadius: 999,
              color: INST_COL, background: `${INST_COL}10`, border: `1px solid ${INST_COL}25`,
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
