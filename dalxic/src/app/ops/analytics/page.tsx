"use client"
import { useState } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Stat, Card, Pill, T, Section } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { money, moneyShort, pct } from "@/lib/ops/format"
import { MOCK_MRR_SERIES, MOCK_REGIONS, MOCK_TENANTS, MOCK_TIERS, MOCK_MODULES } from "@/lib/ops/mock"

/* ───── Derived KPIs ───── */
const active = MOCK_TENANTS.filter(t => t.status === "active" || t.status === "past_due" || t.status === "trial")
const paying = MOCK_TENANTS.filter(t => t.mrr > 0)
const currentMRR = MOCK_MRR_SERIES[MOCK_MRR_SERIES.length - 1].mrr
const prevMRR = MOCK_MRR_SERIES[MOCK_MRR_SERIES.length - 2].mrr
const nrr = prevMRR > 0 ? ((currentMRR / prevMRR) * 100).toFixed(1) : "0"
const arpa = paying.length > 0 ? Math.round(currentMRR / paying.length) : 0
const operators = active.reduce((s, t) => s + t.users, 0)

/* ───── Module adoption ───── */
const moduleAdoption = MOCK_MODULES
  .filter(m => m.status === "ga" || m.status === "beta")
  .sort((a, b) => b.adoption - a.adoption)
  .slice(0, 8)

/* ───── SVG helpers ───── */
const CHART_W = 680
const CHART_H = 180
const PAD_X = 0
const PAD_Y = 12

function mrrPolyline(): string {
  const maxMRR = Math.max(...MOCK_MRR_SERIES.map(m => m.mrr))
  const step = (CHART_W - PAD_X * 2) / (MOCK_MRR_SERIES.length - 1)
  return MOCK_MRR_SERIES.map((m, i) => {
    const x = PAD_X + i * step
    const y = CHART_H - PAD_Y - ((m.mrr / maxMRR) * (CHART_H - PAD_Y * 2))
    return `${x},${y}`
  }).join(" ")
}

function mrrAreaPath(): string {
  const maxMRR = Math.max(...MOCK_MRR_SERIES.map(m => m.mrr))
  const step = (CHART_W - PAD_X * 2) / (MOCK_MRR_SERIES.length - 1)
  const points = MOCK_MRR_SERIES.map((m, i) => {
    const x = PAD_X + i * step
    const y = CHART_H - PAD_Y - ((m.mrr / maxMRR) * (CHART_H - PAD_Y * 2))
    return { x, y }
  })
  const first = points[0]
  const last = points[points.length - 1]
  let d = `M${first.x},${first.y}`
  points.slice(1).forEach(p => { d += ` L${p.x},${p.y}` })
  d += ` L${last.x},${CHART_H - PAD_Y} L${first.x},${CHART_H - PAD_Y} Z`
  return d
}

export default function AnalyticsPage() {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const maxRegionMRR = Math.max(...MOCK_REGIONS.map(r => r.mrr))
  const maxBarMRR = Math.max(...MOCK_MRR_SERIES.map(m => Math.max(m.newMrr, m.churnMrr)))

  return (
    <OpsPage title="Analytics" subtitle="Cross-vertical KPIs. MRR trajectory, regional distribution, module adoption." icon="analytics">
      {/* ───── 4 Stats ───── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <Stat label="ARR" value={moneyShort(currentMRR * 12)} sub={`MRR ${money(currentMRR)}`} icon="trending" />
        <Stat label="Net Revenue Retention" value={`${nrr}%`} sub="Month-over-month" icon="analytics" accent="emerald" />
        <Stat label="ARPA" value={money(arpa)} sub={`${paying.length} paying tenants`} icon="tenants" accent="sky" />
        <Stat label="Active Operators" value={operators} sub={`Across ${active.length} tenants`} icon="staff" accent="amber" />
      </div>

      {/* ───── MRR Waterfall ───── */}
      <Section title="MRR Waterfall" sub="New revenue (green) vs churn (red) by month">
        <Card>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180, padding: "0 8px" }}>
            {MOCK_MRR_SERIES.map((m, i) => {
              const greenH = (m.newMrr / maxBarMRR) * 140
              const redH = (m.churnMrr / maxBarMRR) * 140
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 9, color: T.txM, fontFamily: "'DM Mono', monospace" }}>
                    +{moneyShort(m.newMrr)}
                  </div>
                  <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 140 }}>
                    <div style={{ width: 24, height: greenH, borderRadius: "4px 4px 0 0", background: `linear-gradient(180deg, ${T.emerald}, #059669)` }} />
                    <div style={{ width: 24, height: redH, borderRadius: "4px 4px 0 0", background: `linear-gradient(180deg, ${T.red}, #DC2626)` }} />
                  </div>
                  <div style={{ fontSize: 9, color: T.txD, fontFamily: "'DM Mono', monospace" }}>{m.month}</div>
                </div>
              )
            })}
          </div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: T.emerald }} />
              <span style={{ fontSize: 10, color: T.txM }}>New MRR</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: T.red }} />
              <span style={{ fontSize: 10, color: T.txM }}>Churn</span>
            </div>
          </div>
        </Card>
      </Section>

      {/* ───── MRR Trend Line ───── */}
      <Section title="MRR Trend" sub="7-month trajectory with area fill">
        <Card>
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ width: "100%", height: 200 }} preserveAspectRatio="none">
            <defs>
              <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.emerald} stopOpacity={0.25} />
                <stop offset="100%" stopColor={T.emerald} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <path d={mrrAreaPath()} fill="url(#mrrGrad)" />
            <polyline points={mrrPolyline()} fill="none" stroke={T.emerald} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {MOCK_MRR_SERIES.map((m, i) => {
              const maxMRR = Math.max(...MOCK_MRR_SERIES.map(s => s.mrr))
              const step = (CHART_W - PAD_X * 2) / (MOCK_MRR_SERIES.length - 1)
              const x = PAD_X + i * step
              const y = CHART_H - PAD_Y - ((m.mrr / maxMRR) * (CHART_H - PAD_Y * 2))
              return <circle key={i} cx={x} cy={y} r={4} fill={T.bg} stroke={T.emerald} strokeWidth={2} />
            })}
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px 0" }}>
            {MOCK_MRR_SERIES.map((m, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.tx, fontFamily: "'DM Mono', monospace" }}>{moneyShort(m.mrr)}</div>
                <div style={{ fontSize: 9, color: T.txD, fontFamily: "'DM Mono', monospace" }}>{m.month}</div>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* ───── Two-column: Region + Module Adoption ───── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Geographic Distribution */}
        <Section title="Geographic Distribution" sub="Top 5 regions by MRR">
          <Card>
            {MOCK_REGIONS.slice(0, 5).map((r, i) => {
              const barPct = maxRegionMRR > 0 ? (r.mrr / maxRegionMRR) * 100 : 0
              return (
                <div
                  key={r.region}
                  onMouseEnter={() => setHoveredRegion(r.region)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  style={{
                    padding: "12px 0",
                    borderBottom: i < 4 ? `1px solid ${T.border}` : "none",
                    transition: "background 0.15s",
                    borderRadius: 8,
                    paddingLeft: 8,
                    paddingRight: 8,
                    background: hoveredRegion === r.region ? "rgba(16,185,129,0.04)" : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>{r.region}</span>
                    <span style={{ fontSize: 12, color: T.txM }}>
                      {r.tenants} tenants &middot; {moneyShort(r.mrr)}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: T.surface2 }}>
                    <div style={{ height: "100%", borderRadius: 3, background: T.emerald, width: `${barPct}%`, transition: "width 0.4s" }} />
                  </div>
                </div>
              )
            })}
          </Card>
        </Section>

        {/* Module Adoption */}
        <Section title="Module Adoption" sub="Top 8 modules by adoption rate">
          <Card>
            {moduleAdoption.map((mod, i) => {
              const barColor = mod.adoption >= 60 ? T.emerald : mod.adoption >= 30 ? T.amber : T.red
              return (
                <div key={mod.id} style={{ padding: "10px 8px", borderBottom: i < moduleAdoption.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.tx }}>{mod.name}</span>
                      <Pill tone={mod.adoption >= 60 ? "emerald" : mod.adoption >= 30 ? "amber" : "red"}>{mod.adoption}%</Pill>
                    </div>
                    <span style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>
                      {mod.vertical}
                    </span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: T.surface2 }}>
                    <div style={{ height: "100%", borderRadius: 3, background: barColor, width: `${mod.adoption}%`, transition: "width 0.4s" }} />
                  </div>
                </div>
              )
            })}
          </Card>
        </Section>
      </div>
    </OpsPage>
  )
}
