"use client"
/* ═══════════════════════════════════════════════════════════════
   /ops/analytics — Cross-vertical KPIs, cohorts, geography
   ═══════════════════════════════════════════════════════════════ */
import { OpsPage } from "@/components/ops/OpsShell"
import { Card, Stat, Section, T, Pill } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import {
  MOCK_MRR_SERIES, MOCK_REGIONS, MOCK_TENANTS, MOCK_TIERS, MOCK_MODULES, MOCK_INVOICES,
} from "@/lib/ops/mock"

export default function OpsAnalyticsPage() {
  const latest = MOCK_MRR_SERIES[MOCK_MRR_SERIES.length - 1]
  const first  = MOCK_MRR_SERIES[0]
  const growth = ((latest.mrr - first.mrr) / first.mrr) * 100
  const newMrrSum    = MOCK_MRR_SERIES.reduce((s, m) => s + m.newMrr, 0)
  const churnMrrSum  = MOCK_MRR_SERIES.reduce((s, m) => s + m.churnMrr, 0)
  const netRetention = ((newMrrSum - churnMrrSum) / newMrrSum) * 100

  const activeTenants = MOCK_TENANTS.filter(t => t.status === "active").length
  const paidInvoices  = MOCK_INVOICES.filter(i => i.status === "paid")
  const arpa          = paidInvoices.reduce((s, i) => s + i.amount, 0) / (activeTenants || 1)

  const maxMrr = Math.max(...MOCK_MRR_SERIES.map(s => s.mrr))
  const maxRegionMrr = Math.max(...MOCK_REGIONS.map(r => r.mrr))

  return (
    <OpsPage
      title="Analytics"
      subtitle="Deep telemetry on every lever — revenue, retention, adoption, geography."
      icon="trending"
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        <Stat label="ARR (annualised)" value={`GHS ${((latest.mrr * 12) / 1000).toFixed(0)}k`} accent="emerald" icon="trending" sub={`${growth.toFixed(0)}% since Oct`} />
        <Stat label="Net Retention"     value={`${netRetention.toFixed(0)}%`}                   accent="emerald" icon="sparkle" sub={`${(newMrrSum/1000).toFixed(1)}k new · ${(churnMrrSum/1000).toFixed(1)}k churn`} />
        <Stat label="ARPA"               value={`GHS ${Math.round(arpa).toLocaleString()}`}     accent="sky"     icon="billing" sub="Avg revenue / active account" />
        <Stat label="Active Operators"  value={activeTenants}                                   accent="amber"   icon="tenants" sub="Across Trade + Institute" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, marginBottom: 28 }}>
        <Card padding={24}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
                MRR Waterfall
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em", marginTop: 4 }}>
                New vs churn, by month
              </div>
            </div>
            <Pill tone="emerald" dot>{netRetention.toFixed(0)}% NRR</Pill>
          </div>
          <div style={{ height: 220, display: "flex", alignItems: "flex-end", gap: 12, paddingBottom: 24 }}>
            {MOCK_MRR_SERIES.map((s, i) => {
              const newH = (s.newMrr / 2400) * 90
              const churnH = (s.churnMrr / 2400) * 90
              return (
                <div key={s.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 10, color: T.emerald, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>+{s.newMrr}</div>
                  <div style={{ width: "70%", height: newH, background: T.emerald, borderRadius: "4px 4px 0 0" }} />
                  <div style={{ width: "70%", height: churnH, background: T.red, borderRadius: "0 0 4px 4px" }} />
                  <div style={{ fontSize: 10, color: T.red, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>−{s.churnMrr}</div>
                  <div style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>{s.month}</div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card padding={24}>
          <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, marginBottom: 14, fontFamily: "'DM Mono', monospace" }}>
            MRR Trend
          </div>
          <div style={{ position: "relative", height: 200 }}>
            <svg width="100%" height="200" viewBox="0 0 400 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areafill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.emerald} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={T.emerald} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline
                fill="url(#areafill)"
                stroke="none"
                points={`0,200 ${MOCK_MRR_SERIES.map((s, i) => `${(i / (MOCK_MRR_SERIES.length - 1)) * 400},${200 - (s.mrr / maxMrr) * 180}`).join(" ")} 400,200`}
              />
              <polyline
                fill="none" stroke={T.emerald} strokeWidth={2}
                points={MOCK_MRR_SERIES.map((s, i) => `${(i / (MOCK_MRR_SERIES.length - 1)) * 400},${200 - (s.mrr / maxMrr) * 180}`).join(" ")}
              />
              {MOCK_MRR_SERIES.map((s, i) => (
                <circle key={i} cx={(i / (MOCK_MRR_SERIES.length - 1)) * 400} cy={200 - (s.mrr / maxMrr) * 180} r={3} fill={T.emerald} />
              ))}
            </svg>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9, color: T.txD, fontFamily: "'DM Mono', monospace" }}>
            <span>{first.month}</span>
            <span>{latest.month}</span>
          </div>
        </Card>
      </div>

      <Section title="Geographic Distribution" sub="Ghana regions where we have operators — revenue and volume.">
        <Card padding={24}>
          {MOCK_REGIONS.map((r, i) => (
            <div key={r.region} style={{ marginBottom: i === MOCK_REGIONS.length - 1 ? 0 : 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{r.region}</span>
                <span style={{ fontSize: 11, color: T.txM, fontFamily: "'DM Mono', monospace" }}>
                  {r.tenants} tenant{r.tenants === 1 ? "" : "s"} · GHS {r.mrr.toLocaleString()}/mo
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: T.surface2, overflow: "hidden" }}>
                <div style={{
                  width: `${maxRegionMrr > 0 ? (r.mrr / maxRegionMrr) * 100 : 0}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${T.emerald}, ${T.emeraldL})`,
                  borderRadius: 999,
                }} />
              </div>
            </div>
          ))}
        </Card>
      </Section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Section title="Tier Mix">
          <Card padding={20}>
            {MOCK_TIERS.map(t => {
              const count = MOCK_TENANTS.filter(x => x.tier === t.id && x.status === "active").length
              const mrr = count * t.monthly
              const c = t.accent === "amber" ? T.amber : t.accent === "sky" ? T.sky : t.accent === "emerald" ? T.emerald : T.txM
              return (
                <div key={t.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{t.name}</span>
                    <span style={{ fontSize: 11, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{count} · GHS {mrr.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: T.surface2, overflow: "hidden" }}>
                    <div style={{ width: `${(count / 24) * 100}%`, height: "100%", background: c, borderRadius: 999 }} />
                  </div>
                </div>
              )
            })}
          </Card>
        </Section>

        <Section title="Module Adoption">
          <Card padding={20}>
            {MOCK_MODULES
              .sort((a, b) => b.adoption - a.adoption)
              .slice(0, 8)
              .map((m, i) => (
                <div key={m.id} style={{ marginBottom: i === 7 ? 0 : 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.tx }}>{m.name}</span>
                    <span style={{ fontSize: 10, color: m.adoption >= 60 ? T.emerald : m.adoption >= 30 ? T.amber : T.red, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{m.adoption}%</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 999, background: T.surface2, overflow: "hidden" }}>
                    <div style={{ width: `${m.adoption}%`, height: "100%", background: m.adoption >= 60 ? T.emerald : m.adoption >= 30 ? T.amber : T.red, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
          </Card>
        </Section>
      </div>
    </OpsPage>
  )
}
