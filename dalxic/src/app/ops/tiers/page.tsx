"use client"
import { useState } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Stat, Card, Pill, Drawer, T, Section, DataTable, Column } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { money } from "@/lib/ops/format"
import { MOCK_TIERS, MOCK_TENANTS, MOCK_MODULES, type MockTier, type MockModule } from "@/lib/ops/mock"

/* ───── Derived KPIs ───── */
const activeTenants = MOCK_TENANTS.filter(t => t.status === "active" || t.status === "past_due")
const totalRevenue = activeTenants.reduce((s, t) => s + t.mrr, 0)
const popularTier = MOCK_TIERS.reduce((best, tier) => {
  const count = activeTenants.filter(t => t.tier === tier.id).length
  return count > best.count ? { name: tier.name, count } : best
}, { name: "", count: 0 })

/* ───── Accent helpers ───── */
const TIER_ACCENTS: Record<string, string> = {
  neutral: T.txM, sky: T.sky, emerald: T.emerald, amber: T.amber,
}

function tierAccent(tier: MockTier): string {
  return TIER_ACCENTS[tier.accent] ?? T.emerald
}

const ALL_BEHAVIOURS = ["consultation", "procedure", "product", "admission", "recurring", "admin"] as const

export default function TiersPage() {
  const [selected, setSelected] = useState<MockTier | null>(null)
  const selectedTenants = selected ? activeTenants.filter(t => t.tier === selected.id) : []
  const selectedModules = selected ? MOCK_MODULES.filter(m => selected.modules.includes(m.id)) : []

  return (
    <OpsPage title="Tier Catalog" subtitle="Pricing tiers, limits, behaviour coverage, and module bundles." icon="tiers">
      {/* ───── 3 Stats ───── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        <Stat label="Active Tiers" value={MOCK_TIERS.length} icon="tiers" />
        <Stat label="Monthly Revenue" value={money(totalRevenue)} sub="From paying tenants" icon="trending" accent="emerald" />
        <Stat label="Most Popular" value={popularTier.name} sub={`${popularTier.count} tenants`} icon="tenants" accent="sky" />
      </div>

      {/* ───── 4 Tier Cards ───── */}
      <Section title="Tiers" sub="Click a card for full detail">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {MOCK_TIERS.map(tier => {
            const color = tierAccent(tier)
            const tenantCount = activeTenants.filter(t => t.tier === tier.id).length
            const moduleCount = MOCK_MODULES.filter(m => tier.modules.includes(m.id)).length
            return (
              <Card key={tier.id} hover style={{ cursor: "pointer", position: "relative" }} accent={tier.accent === "neutral" ? "emerald" : tier.accent as "emerald" | "amber" | "sky"}>
                <div onClick={() => setSelected(tier)} style={{ padding: 0 }}>
                  {/* Popular badge */}
                  {tier.popular && (
                    <div style={{ position: "absolute", top: 12, right: 12 }}>
                      <Pill tone="sky" dot>Popular</Pill>
                    </div>
                  )}

                  {/* Icon + Name */}
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", color, marginBottom: 14 }}>
                    <Icon name="tiers" size={20} />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>{tier.name}</div>
                  <div style={{ fontSize: 11, color: T.txM, marginTop: 4, marginBottom: 16, minHeight: 32 }}>{tier.tagline}</div>

                  {/* Pricing */}
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif" }}>{money(tier.monthly, { symbol: false })}</span>
                    <span style={{ fontSize: 12, color: T.txM }}> /mo</span>
                    <div style={{ fontSize: 11, color: T.txD, marginTop: 2 }}>
                      {money(tier.annual, { symbol: false })} /yr (save {Math.round((1 - tier.annual / (tier.monthly * 12)) * 100)}%)
                    </div>
                  </div>

                  {/* Limits */}
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginBottom: 12 }}>
                    {[
                      { label: "Branches", val: tier.branchLimit === "unlimited" ? "Unlimited" : String(tier.branchLimit) },
                      { label: "Users", val: tier.userLimit === "unlimited" ? "Unlimited" : String(tier.userLimit) },
                      { label: "Tx/month", val: tier.txLimit === "unlimited" ? "Unlimited" : tier.txLimit.toLocaleString() },
                      { label: "SLA", val: tier.supportSLA },
                    ].map(l => (
                      <div key={l.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                        <span style={{ fontSize: 11, color: T.txD }}>{l.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: T.tx, fontFamily: "'DM Mono', monospace" }}>{l.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Behaviours checklist */}
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Behaviours</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {ALL_BEHAVIOURS.map(b => {
                        const included = tier.behaviours.includes(b)
                        return (
                          <span key={b} style={{
                            fontSize: 9, padding: "3px 7px", borderRadius: 6,
                            background: included ? `${color}15` : T.surface2,
                            color: included ? color : T.txD,
                            fontWeight: 600, textTransform: "capitalize",
                          }}>
                            {included ? "\u2713 " : ""}{b}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
                    <span style={{ fontSize: 11, color: T.txM }}>{moduleCount} modules</span>
                    <Pill tone="emerald">{tenantCount} tenants</Pill>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </Section>

      {/* ───── Module Coverage Matrix ───── */}
      <Section title="Module Coverage Matrix" sub="Which modules are included in each tier">
        <Card padding={0} style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ padding: "14px 18px", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, textAlign: "left", fontFamily: "'DM Mono', monospace", minWidth: 180 }}>Module</th>
                  {MOCK_TIERS.map(tier => (
                    <th key={tier.id} style={{ padding: "14px 18px", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: tierAccent(tier), textAlign: "center", fontFamily: "'DM Mono', monospace", minWidth: 100 }}>{tier.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_MODULES.filter(m => m.status === "ga" || m.status === "beta").map((mod, idx) => (
                  <tr key={mod.id} style={{ borderBottom: idx < MOCK_MODULES.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <td style={{ padding: "10px 18px", fontSize: 12, color: T.tx }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{mod.name}</span>
                        {mod.addonPrice && <span style={{ fontSize: 9, color: T.txD, fontFamily: "'DM Mono', monospace" }}>+{money(mod.addonPrice, { symbol: false })}</span>}
                      </div>
                    </td>
                    {MOCK_TIERS.map(tier => {
                      const included = tier.modules.includes(mod.id)
                      return (
                        <td key={tier.id} style={{ padding: "10px 18px", textAlign: "center" }}>
                          {included ? (
                            <span style={{ color: tierAccent(tier), fontSize: 14 }}>
                              <Icon name="check" size={14} />
                            </span>
                          ) : mod.addonPrice ? (
                            <span style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace" }}>+{money(mod.addonPrice, { symbol: false })}</span>
                          ) : (
                            <span style={{ color: T.txD, fontSize: 12 }}>&mdash;</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* ───── Drawer ───── */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""} subtitle={selected?.tagline} width={560}>
        {selected && (
          <div>
            {/* Pricing */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Pricing</div>
              <div style={{ display: "flex", gap: 24 }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: tierAccent(selected), fontFamily: "'Space Grotesk', sans-serif" }}>{money(selected.monthly)}</div>
                  <div style={{ fontSize: 11, color: T.txM }}>per month</div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{money(selected.annual)}</div>
                  <div style={{ fontSize: 11, color: T.txM }}>per year</div>
                </div>
              </div>
            </div>

            {/* Limits */}
            <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: T.surface2 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Limits</div>
              {[
                { label: "Branches", val: selected.branchLimit === "unlimited" ? "Unlimited" : String(selected.branchLimit) },
                { label: "Users", val: selected.userLimit === "unlimited" ? "Unlimited" : String(selected.userLimit) },
                { label: "Transactions / month", val: selected.txLimit === "unlimited" ? "Unlimited" : selected.txLimit.toLocaleString() },
                { label: "Support SLA", val: selected.supportSLA },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.txM }}>{l.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.tx, fontFamily: "'DM Mono', monospace" }}>{l.val}</span>
                </div>
              ))}
            </div>

            {/* Behaviours */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Behaviours</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ALL_BEHAVIOURS.map(b => {
                  const has = selected.behaviours.includes(b)
                  return (
                    <Pill key={b} tone={has ? "emerald" : "neutral"}>
                      {has ? "\u2713 " : "\u2717 "}{b}
                    </Pill>
                  )
                })}
              </div>
            </div>

            {/* Bundled Modules */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Bundled Modules ({selectedModules.length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selectedModules.map(m => (
                  <span key={m.id} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, background: `${T.emerald}10`, color: T.emeraldL, fontWeight: 600 }}>
                    {m.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Subscribers */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Subscribers ({selectedTenants.length})</div>
              {selectedTenants.length === 0 ? (
                <div style={{ fontSize: 12, color: T.txM, padding: 8 }}>No active subscribers on this tier.</div>
              ) : (
                selectedTenants.map((t, i) => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < selectedTenants.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: T.txD }}>{t.region} &middot; {t.type}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.emerald, fontFamily: "'DM Mono', monospace" }}>{money(t.mrr)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Drawer>
    </OpsPage>
  )
}
