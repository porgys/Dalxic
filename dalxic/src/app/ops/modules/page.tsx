"use client"
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Stat, Card, Pill, Tabs, DataTable, Column, Drawer, SearchBar, Section, T } from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"
import { money } from "@/lib/ops/format"
import { MOCK_MODULES, MOCK_TIERS, MOCK_TENANTS, type MockModule, type TenantTier } from "@/lib/ops/mock"

/* ───── Derived KPIs ───── */
const totalModules = MOCK_MODULES.length
const gaModules = MOCK_MODULES.filter(m => m.status === "ga").length
const betaModules = MOCK_MODULES.filter(m => m.status === "beta").length
const avgAdoption = Math.round(MOCK_MODULES.reduce((s, m) => s + m.adoption, 0) / MOCK_MODULES.length)

/* ───── Types ───── */
type TabKey = "all" | "trade" | "health" | "institute" | "restaurant" | "universal"

const TABS: { key: TabKey; label: string; icon?: IconName }[] = [
  { key: "all",        label: "All",        icon: "modules" },
  { key: "trade",      label: "Trade",      icon: "pos" },
  { key: "health",     label: "Health",     icon: "support" },
  { key: "institute",  label: "Institute",  icon: "customers" },
  { key: "restaurant", label: "Restaurant", icon: "orders" },
  { key: "universal",  label: "Universal",  icon: "globe" },
]

const TIER_ORDER: TenantTier[] = ["starter", "growth", "scale", "enterprise"]
const CATEGORIES = [...new Set(MOCK_MODULES.map(m => m.category))].sort()

/* ───── Tone helpers ───── */
const VERTICAL_TONE: Record<string, "amber" | "copper" | "sky" | "emerald" | "neutral"> = {
  trade: "amber", health: "copper", institute: "sky", restaurant: "amber", universal: "emerald",
}
const STATUS_TONE: Record<string, "emerald" | "amber" | "sky"> = {
  ga: "emerald", beta: "amber", preview: "sky",
}

export default function ModulesPage() {
  const [tab, setTab] = useState<TabKey>("all")
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("all")
  const [tierFilter, setTierFilter] = useState<TenantTier | "all">("all")
  const [selected, setSelected] = useState<MockModule | null>(null)

  const filtered = useMemo(() => {
    return MOCK_MODULES.filter(m => {
      if (tab !== "all" && m.vertical !== tab) return false
      if (catFilter !== "all" && m.category !== catFilter) return false
      if (tierFilter !== "all" && TIER_ORDER.indexOf(m.minTier) > TIER_ORDER.indexOf(tierFilter)) return false
      if (search) {
        const q = search.toLowerCase()
        if (!m.name.toLowerCase().includes(q) && !m.id.toLowerCase().includes(q) && !m.category.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [tab, search, catFilter, tierFilter])

  /* Drawer data */
  const selectedTiers = selected ? MOCK_TIERS.filter(t => t.modules.includes(selected.id)) : []
  const selectedDeps = selected?.dependencies ? MOCK_MODULES.filter(m => selected.dependencies!.includes(m.id)) : []
  const activeTenants = MOCK_TENANTS.filter(t => t.status === "active" || t.status === "past_due")
  const selectedTenants = selected ? activeTenants.filter(t => t.activeModules.includes(selected.id)) : []

  const columns: Column<MockModule>[] = [
    {
      key: "name", label: "Module", width: 240,
      render: (m) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${T.emerald}10`, display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald, flexShrink: 0 }}>
            <Icon name={m.icon} size={14} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>{m.name}</div>
            <div style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace" }}>{m.id}</div>
          </div>
        </div>
      ),
    },
    { key: "category", label: "Category", render: (m) => <span style={{ fontSize: 12, color: T.txM }}>{m.category}</span> },
    {
      key: "vertical", label: "Vertical",
      render: (m) => <Pill tone={VERTICAL_TONE[m.vertical] ?? "neutral"}>{m.vertical}</Pill>,
    },
    {
      key: "behaviour", label: "Behaviour",
      render: (m) => m.behaviour ? <span style={{ fontSize: 12, color: T.txM, textTransform: "capitalize" }}>{m.behaviour}</span> : <span style={{ color: T.txD }}>&mdash;</span>,
    },
    {
      key: "minTier", label: "Min Tier",
      render: (m) => <span style={{ fontSize: 11, fontWeight: 600, color: T.tx, textTransform: "capitalize", fontFamily: "'DM Mono', monospace" }}>{m.minTier}</span>,
    },
    {
      key: "adoption", label: "Adoption", width: 160, align: "right",
      render: (m) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
          <div style={{ width: 80, height: 5, borderRadius: 3, background: T.surface2, flexShrink: 0 }}>
            <div style={{ height: "100%", borderRadius: 3, background: m.adoption >= 60 ? T.emerald : m.adoption >= 30 ? T.amber : T.red, width: `${m.adoption}%` }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.tx, fontFamily: "'DM Mono', monospace", minWidth: 32, textAlign: "right" }}>{m.adoption}%</span>
        </div>
      ),
    },
    {
      key: "status", label: "Status",
      render: (m) => <Pill tone={STATUS_TONE[m.status] ?? "neutral"}>{m.status.toUpperCase()}</Pill>,
    },
  ]

  return (
    <OpsPage title="Module Catalog" subtitle="Every module across all verticals. Adoption, tier gating, dependencies." icon="modules">
      {/* ───── 4 Stats ───── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <Stat label="Total Modules" value={totalModules} icon="modules" />
        <Stat label="GA" value={gaModules} sub="Generally available" icon="check" accent="emerald" />
        <Stat label="Beta" value={betaModules} sub="Limited access" icon="flag" accent="amber" />
        <Stat label="Avg Adoption" value={`${avgAdoption}%`} sub="Across paying tenants" icon="trending" accent="sky" />
      </div>

      {/* ───── Tabs ───── */}
      <Tabs tabs={TABS.map(t => ({ ...t, count: t.key === "all" ? MOCK_MODULES.length : MOCK_MODULES.filter(m => m.vertical === t.key).length }))} value={tab} onChange={setTab} />

      {/* ───── Filters ───── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search modules..." />
        </div>
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={{
            padding: "11px 14px", borderRadius: 10, fontSize: 13,
            background: "rgba(255,255,255,0.03)", border: `1px solid rgba(16,185,129,0.18)`,
            color: T.tx, outline: "none", fontFamily: "'DM Sans', sans-serif", minWidth: 140,
          }}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value as TenantTier | "all")}
          style={{
            padding: "11px 14px", borderRadius: 10, fontSize: 13,
            background: "rgba(255,255,255,0.03)", border: `1px solid rgba(16,185,129,0.18)`,
            color: T.tx, outline: "none", fontFamily: "'DM Sans', sans-serif", minWidth: 140,
          }}
        >
          <option value="all">All Tiers</option>
          {TIER_ORDER.map(t => <option key={t} value={t} style={{ textTransform: "capitalize" }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      {/* ───── Table ───── */}
      <DataTable rows={filtered.map(m => ({ ...m, id: m.id }))} columns={columns} onRowClick={(m) => setSelected(m)} empty="No modules match your filters." />

      {/* ───── Drawer ───── */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""} subtitle={selected ? `${selected.id} \u00B7 ${selected.vertical} \u00B7 ${selected.category}` : ""} width={560}>
        {selected && (
          <div>
            {/* Description */}
            <div style={{ fontSize: 13, color: T.txM, lineHeight: 1.6, marginBottom: 24 }}>{selected.description}</div>

            {/* Mini stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 14, borderRadius: 12, background: T.surface2, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.emerald, fontFamily: "'Space Grotesk', sans-serif" }}>{selected.adoption}%</div>
                <div style={{ fontSize: 9, color: T.txD, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Adoption</div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: T.surface2, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{selectedTenants.length}</div>
                <div style={{ fontSize: 9, color: T.txD, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Active Users</div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: T.surface2, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", textTransform: "capitalize" }}>{selected.minTier}</div>
                <div style={{ fontSize: 9, color: T.txD, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Min Tier</div>
              </div>
            </div>

            {/* Status + Behaviour */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <Pill tone={STATUS_TONE[selected.status] ?? "neutral"}>{selected.status.toUpperCase()}</Pill>
              <Pill tone={VERTICAL_TONE[selected.vertical] ?? "neutral"}>{selected.vertical}</Pill>
              {selected.behaviour && <Pill tone="neutral">{selected.behaviour}</Pill>}
            </div>

            {/* Available Tiers */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Available In</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {selectedTiers.map(t => (
                  <span key={t.id} style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, background: `${T.emerald}10`, color: T.emeraldL, fontWeight: 600, textTransform: "capitalize" }}>
                    {t.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Dependencies */}
            {selectedDeps.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Dependencies</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {selectedDeps.map(d => (
                    <span key={d.id} style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, background: `${T.amber}10`, color: T.amber, fontWeight: 600 }}>
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add-on pricing */}
            {selected.addonPrice && (
              <div style={{ marginBottom: 24, padding: 14, borderRadius: 12, border: `1px solid ${T.border2}`, background: T.surface2 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Add-on Pricing</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.emerald, fontFamily: "'Space Grotesk', sans-serif" }}>{money(selected.addonPrice)}<span style={{ fontSize: 12, fontWeight: 400, color: T.txM }}> /mo</span></div>
              </div>
            )}

            {/* Active Tenants */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Active Tenants ({selectedTenants.length})</div>
              {selectedTenants.slice(0, 8).map((t, i) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < Math.min(selectedTenants.length, 8) - 1 ? `1px solid ${T.border}` : "none" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.tx }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: T.txD }}>{t.region}</div>
                  </div>
                  <Pill tone={VERTICAL_TONE[t.type] ?? "neutral"}>{t.type}</Pill>
                </div>
              ))}
              {selectedTenants.length > 8 && (
                <div style={{ fontSize: 11, color: T.txM, padding: "8px 0" }}>+{selectedTenants.length - 8} more</div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </OpsPage>
  )
}
