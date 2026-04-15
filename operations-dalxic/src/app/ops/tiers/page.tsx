"use client"
/* ═══════════════════════════════════════════════════════════════
   /ops/tiers — Subscription tier catalog + module assignment
   ═══════════════════════════════════════════════════════════════ */
import { useState } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Card, Stat, Pill, Button, Drawer, Section, T, Tone } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_TIERS, MOCK_TENANTS, MOCK_MODULES, MockTier } from "@/lib/ops/mock"

export default function OpsTiersPage() {
  const [active, setActive] = useState<MockTier | null>(null)

  const totals = {
    total: MOCK_TIERS.length,
    revenueMonthly: MOCK_TIERS.reduce((s, t) => {
      const count = MOCK_TENANTS.filter(tn => tn.tier === t.id && tn.status === "active").length
      return s + count * t.monthly
    }, 0),
    mostPopular: (() => {
      let top = MOCK_TIERS[0], topCount = 0
      for (const t of MOCK_TIERS) {
        const c = MOCK_TENANTS.filter(tn => tn.tier === t.id && tn.status === "active").length
        if (c > topCount) { top = t; topCount = c }
      }
      return top.name
    })(),
  }

  return (
    <>
      <OpsPage
        title="Tiers"
        subtitle="Every subscription level and the modules bundled inside. Drag modules between tiers to re-plan pricing."
        icon="tiers"
        action={<Button icon="plus">New Tier</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Active Tiers"          value={totals.total}                                            accent="emerald" icon="tiers" />
          <Stat label="Revenue (Monthly)"      value={`GHS ${(totals.revenueMonthly / 1000).toFixed(1)}k`}    accent="emerald" icon="trending" />
          <Stat label="Most Popular"           value={totals.mostPopular}                                     accent="sky"     icon="sparkle" />
        </div>

        <Section title="Tier Catalog" sub="Click a tier to edit its modules, pricing, and limits.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {MOCK_TIERS.map(tier => <TierCard key={tier.id} tier={tier} onClick={() => setActive(tier)} />)}
          </div>
        </Section>

        <Section title="Module Coverage Matrix" sub="Which modules ship in which tier. Everything above your tier shows as upsell.">
          <ModuleMatrix />
        </Section>
      </OpsPage>

      <TierDrawer tier={active} onClose={() => setActive(null)} />
    </>
  )
}

function TierCard({ tier, onClick }: { tier: MockTier; onClick: () => void }) {
  const c = tier.accent === "amber" ? T.amber : tier.accent === "sky" ? T.sky : tier.accent === "emerald" ? T.emerald : T.txM
  const count = MOCK_TENANTS.filter(t => t.tier === tier.id && t.status === "active").length
  return (
    <div onClick={onClick} style={{
      padding: 24, borderRadius: 16,
      background: `linear-gradient(160deg, ${c}0F, ${T.surface2} 75%)`,
      border: `1px solid ${c}30`,
      cursor: "pointer",
      transition: "transform 0.15s, border-color 0.15s",
      display: "flex", flexDirection: "column",
      minHeight: 320, position: "relative",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = `${c}70` }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = `${c}30` }}
    >
      {tier.popular && (
        <div style={{
          position: "absolute", top: 14, right: 14,
          padding: "4px 10px", borderRadius: 999,
          background: T.sky, color: "#fff",
          fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
          fontFamily: "'DM Mono', monospace",
        }}>Popular</div>
      )}
      <div style={{ fontSize: 11, color: c, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
        {tier.id}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: T.tx, marginTop: 8, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>
        {tier.name}
      </div>
      <div style={{ fontSize: 12, color: T.txM, marginTop: 6, lineHeight: 1.5, minHeight: 36 }}>
        {tier.tagline}
      </div>

      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>
          GHS {tier.monthly}
          <span style={{ fontSize: 12, color: T.txM, fontWeight: 500, marginLeft: 4 }}>/ month</span>
        </div>
        <div style={{ fontSize: 11, color: T.txD, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
          or GHS {tier.annual.toLocaleString()} / year
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: T.txM, marginBottom: 20 }}>
        <LimitRow label="Branches" value={tier.branchLimit} />
        <LimitRow label="Users" value={tier.userLimit} />
        <LimitRow label="Transactions" value={tier.txLimit} />
        <LimitRow label="Support" value={tier.supportSLA} />
      </div>

      <div style={{ marginTop: "auto" }}>
        <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
          {tier.modules.length} modules included
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Pill tone={tier.accent === "neutral" ? "neutral" : tier.accent}>{count} tenants</Pill>
          <Icon name="chevron-right" size={14} color={c} />
        </div>
      </div>
    </div>
  )
}

function LimitRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>{label}</span>
      <span style={{ color: T.tx, fontWeight: 700, fontFamily: "'DM Mono', monospace", fontSize: 10 }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  )
}

function ModuleMatrix() {
  const groups: Record<string, typeof MOCK_MODULES> = {}
  for (const m of MOCK_MODULES) {
    (groups[m.category] ??= []).push(m)
  }

  return (
    <Card padding={0} style={{ overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              <th style={headCell}>Module</th>
              <th style={{ ...headCell, textAlign: "center" }}>Vertical</th>
              {MOCK_TIERS.map(t => {
                const c = t.accent === "amber" ? T.amber : t.accent === "sky" ? T.sky : t.accent === "emerald" ? T.emerald : T.txM
                return (
                  <th key={t.id} style={{ ...headCell, textAlign: "center", color: c }}>
                    {t.name}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groups).map(([cat, mods]) => (
              <>
                <tr key={cat + "-h"} style={{ background: T.surface2 }}>
                  <td colSpan={2 + MOCK_TIERS.length} style={{
                    padding: "10px 18px",
                    fontSize: 10, color: T.emerald, fontFamily: "'DM Mono', monospace",
                    letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700,
                  }}>
                    {cat}
                  </td>
                </tr>
                {mods.map((m, i) => {
                  const minIdx = MOCK_TIERS.findIndex(t => t.id === m.minTier)
                  return (
                    <tr key={m.id} style={{ borderBottom: i === mods.length - 1 ? "none" : `1px solid ${T.border}` }}>
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: T.txD, marginTop: 2, maxWidth: 360 }}>{m.description}</div>
                      </td>
                      <td style={{ padding: "12px 18px", textAlign: "center" }}>
                        <Pill tone={m.vertical === "trade" ? "amber" : m.vertical === "institute" ? "sky" : "emerald"}>{m.vertical}</Pill>
                      </td>
                      {MOCK_TIERS.map((t, ti) => (
                        <td key={t.id} style={{ padding: "12px 18px", textAlign: "center" }}>
                          {ti >= minIdx ? (
                            <div style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 24, height: 24, borderRadius: 6,
                              background: `${T.emerald}15`, color: T.emerald,
                            }}>
                              <Icon name="check" size={12} />
                            </div>
                          ) : m.addonPrice ? (
                            <span style={{ fontSize: 10, color: T.amber, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>+{m.addonPrice}</span>
                          ) : (
                            <span style={{ color: T.txD, fontSize: 14 }}>—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

const headCell: React.CSSProperties = {
  padding: "14px 18px",
  fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
  color: T.txD, textAlign: "left",
  fontFamily: "'DM Mono', monospace",
}

function TierDrawer({ tier, onClose }: { tier: MockTier | null; onClose: () => void }) {
  if (!tier) return <Drawer open={false} onClose={onClose} title="Tier">{null}</Drawer>
  const c: Tone = tier.accent === "amber" ? "amber" : tier.accent === "sky" ? "sky" : tier.accent === "emerald" ? "emerald" : "neutral"
  const subsribers = MOCK_TENANTS.filter(t => t.tier === tier.id)

  return (
    <Drawer
      open={!!tier} onClose={onClose}
      title={tier.name}
      subtitle={tier.tagline}
      width={560}
      footer={
        <>
          <Button variant="ghost" icon="share">Preview Public</Button>
          <Button variant="outline" icon="edit">Duplicate</Button>
          <Button icon="check">Save Changes</Button>
        </>
      }
    >
      <Card padding={20} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <Pill tone={c} dot>{tier.id}</Pill>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>Per Month</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>
              GHS {tier.monthly}
            </div>
          </div>
        </div>
        <RowKV label="Annual" value={`GHS ${tier.annual.toLocaleString()}`} mono />
        <RowKV label="Branch limit" value={typeof tier.branchLimit === "number" ? tier.branchLimit : "unlimited"} />
        <RowKV label="User limit" value={typeof tier.userLimit === "number" ? tier.userLimit : "unlimited"} />
        <RowKV label="Transaction limit" value={typeof tier.txLimit === "number" ? tier.txLimit.toLocaleString() : "unlimited"} />
        <RowKV label="Support SLA" value={tier.supportSLA} last />
      </Card>

      <Section title={`Bundled Modules (${tier.modules.length})`}>
        <Card padding={14}>
          {tier.modules.map((id, i) => {
            const m = MOCK_MODULES.find(mm => mm.id === id)
            return (
              <div key={id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 6px",
                borderBottom: i === tier.modules.length - 1 ? "none" : `1px solid ${T.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{m?.name ?? id}</div>
                  <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{m?.category}</div>
                </div>
                <Pill tone={m?.vertical === "trade" ? "amber" : m?.vertical === "institute" ? "sky" : "emerald"}>{m?.vertical}</Pill>
              </div>
            )
          })}
        </Card>
      </Section>

      <Section title={`Subscribers (${subsribers.length})`}>
        <Card padding={14}>
          {subsribers.slice(0, 5).map((t, i) => (
            <div key={t.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 6px",
              borderBottom: i === Math.min(subsribers.length, 5) - 1 ? "none" : `1px solid ${T.border}`,
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.tx }}>{t.name}</div>
                <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{t.code} · {t.region}</div>
              </div>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: T.emerald, fontWeight: 800 }}>GHS {t.mrr.toLocaleString()}/mo</span>
            </div>
          ))}
          {subsribers.length > 5 && (
            <div style={{ textAlign: "center", padding: "10px 0 2px", fontSize: 11, color: T.txD }}>
              + {subsribers.length - 5} more
            </div>
          )}
        </Card>
      </Section>
    </Drawer>
  )
}

function RowKV({ label, value, mono = false, last = false }: { label: string; value: React.ReactNode; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.txM }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.tx, fontFamily: mono ? "'DM Mono', monospace" : "'Space Grotesk', sans-serif" }}>{value}</span>
    </div>
  )
}
