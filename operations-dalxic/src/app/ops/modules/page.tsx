"use client"
/* ═══════════════════════════════════════════════════════════════
   /ops/modules — Module catalog across Trade + Institute
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import {
  Card, Stat, Pill, Button, DataTable, Drawer, Field, Select, SearchBar,
  Tabs, Section, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"
import { MOCK_MODULES, MOCK_TIERS, MOCK_TENANTS, MockModule, ORG_TONE } from "@/lib/ops/mock"

type View = "all" | "trade" | "health" | "institute" | "restaurant" | "universal"

const STATUS_TONE: Record<MockModule["status"], Tone> = {
  ga: "emerald", beta: "amber", preview: "sky",
}

export default function OpsModulesPage() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [tier, setTier] = useState("All")
  const [active, setActive] = useState<MockModule | null>(null)

  const categories = useMemo(() => ["All", ...new Set(MOCK_MODULES.map(m => m.category))], [])

  const filtered = useMemo(() => {
    return MOCK_MODULES.filter(m => {
      if (view !== "all" && m.vertical !== view) return false
      if (category !== "All" && m.category !== category) return false
      if (tier !== "All" && m.minTier !== tier.toLowerCase()) return false
      if (!query) return true
      const q = query.toLowerCase()
      return m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
    })
  }, [view, query, category, tier])

  const totals = {
    total: MOCK_MODULES.length,
    ga: MOCK_MODULES.filter(m => m.status === "ga").length,
    beta: MOCK_MODULES.filter(m => m.status === "beta").length,
    avgAdoption: Math.round(MOCK_MODULES.reduce((s, m) => s + m.adoption, 0) / MOCK_MODULES.length),
  }

  const cols: Column<MockModule>[] = [
    { key: "id", label: "Module", render: (m) => (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${T.emerald}15`, color: T.emerald,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon name={m.icon as IconName} size={14} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{m.name}</div>
          <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{m.id}</div>
        </div>
      </div>
    )},
    { key: "category", label: "Category", width: 140, render: (m) => (
      <span style={{ fontSize: 12, color: T.txM }}>{m.category}</span>
    )},
    { key: "vertical", label: "Vertical", width: 110, render: (m) => (
      <Pill tone={m.vertical === "universal" ? "emerald" : ORG_TONE[m.vertical]}>{m.vertical}</Pill>
    )},
    { key: "behaviour", label: "Behaviour", width: 110, render: (m) => m.behaviour
      ? <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: T.txM, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.behaviour}</span>
      : <span style={{ color: T.txD }}>—</span>
    },
    { key: "minTier", label: "Min Tier", width: 120, render: (m) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: T.tx, textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.minTier}</span>
    )},
    { key: "adoption", label: "Adoption", width: 140, render: (m) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 999, background: T.surface2, overflow: "hidden" }}>
          <div style={{ width: `${m.adoption}%`, height: "100%", background: m.adoption >= 60 ? T.emerald : m.adoption >= 30 ? T.amber : T.red, borderRadius: 999 }} />
        </div>
        <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: T.tx, fontWeight: 700, width: 32, textAlign: "right" }}>{m.adoption}%</span>
      </div>
    )},
    { key: "status", label: "Status", width: 100, render: (m) => <Pill tone={STATUS_TONE[m.status]} dot>{m.status}</Pill> },
  ]

  return (
    <>
      <OpsPage
        title="Modules"
        subtitle="Every module across all verticals. This is the source of truth — tiers reference it, tenants activate from it."
        icon="modules"
        action={<Button icon="plus">New Module</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Modules"  value={totals.total}         accent="emerald" icon="modules" />
          <Stat label="Generally Available" value={totals.ga}       accent="emerald" icon="check" />
          <Stat label="In Beta"        value={totals.beta}          accent="amber"   icon="sparkle" />
          <Stat label="Avg Adoption"    value={`${totals.avgAdoption}%`} accent="sky" icon="trending" />
        </div>

        <Section
          title="Module Catalog"
          action={<div style={{ width: 320 }}><SearchBar value={query} onChange={setQuery} placeholder="Name, id, description…" /></div>}
        >
          <Tabs<View>
            value={view} onChange={setView} accent="emerald"
            tabs={[
              { key: "all",        label: "All",          count: MOCK_MODULES.length },
              { key: "trade",      label: "Trade",        count: MOCK_MODULES.filter(m => m.vertical === "trade").length },
              { key: "health",     label: "Health",       count: MOCK_MODULES.filter(m => m.vertical === "health").length },
              { key: "institute",  label: "Institute",    count: MOCK_MODULES.filter(m => m.vertical === "institute").length },
              { key: "restaurant", label: "Restaurant",   count: MOCK_MODULES.filter(m => m.vertical === "restaurant").length },
              { key: "universal",  label: "Universal",    count: MOCK_MODULES.filter(m => m.vertical === "universal").length },
            ]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Min Tier">
              <Select value={tier} onChange={(e) => setTier(e.target.value)}>
                <option>All</option><option>Starter</option><option>Growth</option><option>Scale</option><option>Enterprise</option>
              </Select>
            </Field>
          </div>

          <DataTable rows={filtered} columns={cols} onRowClick={(m) => setActive(m)} />
        </Section>
      </OpsPage>

      <ModuleDrawer mod={active} onClose={() => setActive(null)} />
    </>
  )
}

function ModuleDrawer({ mod, onClose }: { mod: MockModule | null; onClose: () => void }) {
  if (!mod) return <Drawer open={false} onClose={onClose} title="Module">{null}</Drawer>
  const activeTenants = MOCK_TENANTS.filter(t => t.activeModules.includes(mod.id))
  const tiers = MOCK_TIERS.filter(t => t.modules.includes(mod.id))

  return (
    <Drawer
      open={!!mod} onClose={onClose}
      title={mod.name}
      subtitle={`${mod.category} · ${mod.vertical}`}
      width={560}
      footer={
        <>
          <Button variant="ghost" icon="edit">Edit</Button>
          <Button variant="outline" icon="code">API Docs</Button>
          <Button icon="check">Save</Button>
        </>
      }
    >
      <Card padding={20} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: `${T.emerald}15`, color: T.emerald,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={mod.icon as IconName} size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}>{mod.name}</div>
            <div style={{ fontSize: 12, color: T.txM, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>ID: {mod.id}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: T.tx, lineHeight: 1.6 }}>{mod.description}</div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        <MiniStat label="Status" value={mod.status.toUpperCase()} />
        <MiniStat label="Adoption" value={`${mod.adoption}%`} />
        <MiniStat label="Min Tier" value={mod.minTier} />
      </div>

      <Section title="Available In">
        <Card padding={14}>
          {MOCK_TIERS.map((t, i) => {
            const included = t.modules.includes(mod.id)
            return (
              <div key={t.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 6px",
                borderBottom: i === MOCK_TIERS.length - 1 ? "none" : `1px solid ${T.border}`,
                opacity: included ? 1 : 0.4,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: T.txM, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>GHS {t.monthly}/mo</div>
                </div>
                {included ? (
                  <div style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 28, height: 28, borderRadius: 8,
                    background: `${T.emerald}15`, color: T.emerald,
                  }}>
                    <Icon name="check" size={14} />
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: T.txD, fontFamily: "'DM Mono', monospace" }}>excluded</span>
                )}
              </div>
            )
          })}
        </Card>
      </Section>

      {mod.dependencies && mod.dependencies.length > 0 && (
        <Section title="Dependencies">
          <Card padding={14}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {mod.dependencies.map(d => (
                <Pill key={d} tone="sky">{d}</Pill>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {mod.addonPrice && (
        <Card padding={16} style={{ marginBottom: 20, background: `${T.amber}0A`, border: `1px dashed ${T.amber}40` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="addons" size={16} color={T.amber} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.amber, fontFamily: "'DM Mono', monospace" }}>Available As Add-On</div>
          </div>
          <div style={{ fontSize: 13, color: T.tx, marginTop: 8, fontWeight: 700 }}>
            GHS {mod.addonPrice} / month — sold à la carte on lower tiers
          </div>
        </Card>
      )}

      <Section title={`Active Tenants (${activeTenants.length})`}>
        <Card padding={14}>
          {activeTenants.slice(0, 5).map((t, i) => (
            <div key={t.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 6px",
              borderBottom: i === Math.min(activeTenants.length, 5) - 1 ? "none" : `1px solid ${T.border}`,
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.tx }}>{t.name}</div>
                <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{t.code}</div>
              </div>
              <Pill tone={t.tier === "enterprise" ? "amber" : t.tier === "scale" ? "emerald" : t.tier === "growth" ? "sky" : "neutral"}>{t.tier}</Pill>
            </div>
          ))}
          {activeTenants.length > 5 && (
            <div style={{ textAlign: "center", padding: "10px 0 2px", fontSize: 11, color: T.txD }}>
              + {activeTenants.length - 5} more
            </div>
          )}
        </Card>
      </Section>
    </Drawer>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 12, background: T.surface2, borderRadius: 10, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 9, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginTop: 4 }}>{value}</div>
    </div>
  )
}
