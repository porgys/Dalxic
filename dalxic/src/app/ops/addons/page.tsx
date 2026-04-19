"use client"
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Stat, Card, Pill, Tabs, Drawer, SearchBar, T } from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"
import { money } from "@/lib/ops/format"
import { MOCK_ADDONS, MOCK_TENANTS, type MockAddon } from "@/lib/ops/mock"

/* ───── Derived KPIs ───── */
const monthlyAddons = MOCK_ADDONS.filter(a => a.unit === "monthly")
const oneOffAddons = MOCK_ADDONS.filter(a => a.unit === "one-off")
const monthlyRecurring = monthlyAddons.reduce((s, a) => s + a.price * a.activeCount, 0)
const oneOffMTD = oneOffAddons.reduce((s, a) => s + a.price * a.activeCount, 0)
const totalActivations = MOCK_ADDONS.reduce((s, a) => s + a.activeCount, 0)

/* ───── Types ───── */
type TabKey = "all" | "messaging" | "capacity" | "support" | "integration"

const TABS: { key: TabKey; label: string; icon?: IconName }[] = [
  { key: "all",         label: "All",          icon: "addons" },
  { key: "messaging",   label: "Messaging",    icon: "phone" },
  { key: "capacity",    label: "Capacity",     icon: "branches" },
  { key: "support",     label: "Support",      icon: "support" },
  { key: "integration", label: "Integration",  icon: "code" },
]

const CATEGORY_TONE: Record<string, "emerald" | "amber" | "sky" | "copper"> = {
  messaging: "emerald",
  capacity: "amber",
  support: "copper",
  integration: "sky",
}

export default function AddonsPage() {
  const [tab, setTab] = useState<TabKey>("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<MockAddon | null>(null)

  const filtered = useMemo(() => {
    return MOCK_ADDONS.filter(a => {
      if (tab !== "all" && a.category !== tab) return false
      if (search) {
        const q = search.toLowerCase()
        if (!a.name.toLowerCase().includes(q) && !a.id.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [tab, search])

  /* Drawer data */
  const subscribers = selected
    ? MOCK_TENANTS.filter(t => t.activeAddons.includes(selected.id) && (t.status === "active" || t.status === "past_due"))
    : []

  return (
    <OpsPage title="Add-on Marketplace" subtitle="Messaging packs, capacity boosters, integrations, and premium support." icon="addons">
      {/* ───── 4 Stats ───── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <Stat label="Catalog" value={MOCK_ADDONS.length} sub="Available add-ons" icon="addons" />
        <Stat label="Monthly Recurring" value={money(monthlyRecurring)} sub="From active subscriptions" icon="trending" accent="emerald" />
        <Stat label="One-Off MTD" value={money(oneOffMTD)} sub="Credits sold this month" icon="billing" accent="amber" />
        <Stat label="Total Activations" value={totalActivations} sub="Across all tenants" icon="tenants" accent="sky" />
      </div>

      {/* ───── Tabs ───── */}
      <Tabs tabs={TABS.map(t => ({ ...t, count: t.key === "all" ? MOCK_ADDONS.length : MOCK_ADDONS.filter(a => a.category === t.key).length }))} value={tab} onChange={setTab} />

      {/* ───── Search ───── */}
      <div style={{ marginBottom: 20, maxWidth: 400 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search add-ons..." />
      </div>

      {/* ───── 3-Column Grid ───── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {filtered.map(addon => {
          const catTone = CATEGORY_TONE[addon.category] ?? "emerald"
          const catColor = catTone === "amber" ? T.amber : catTone === "sky" ? T.sky : catTone === "copper" ? T.copper : T.emerald
          return (
            <Card key={addon.id} hover style={{ cursor: "pointer" }} accent={catTone === "copper" ? "emerald" : catTone}>
              <div onClick={() => setSelected(addon)}>
                {/* Icon + Category */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${catColor}15`, display: "flex", alignItems: "center", justifyContent: "center", color: catColor }}>
                    <Icon name={addon.icon} size={20} />
                  </div>
                  <Pill tone={catTone}>{addon.category}</Pill>
                </div>

                {/* Name + Description */}
                <div style={{ fontSize: 16, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 6 }}>{addon.name}</div>
                <div style={{ fontSize: 12, color: T.txM, lineHeight: 1.5, marginBottom: 16, minHeight: 36 }}>{addon.description}</div>

                {/* Price + Active */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                  <div>
                    <span style={{ fontSize: 22, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{money(addon.price, { symbol: false })}</span>
                    <span style={{ fontSize: 11, color: T.txM }}> /{addon.unit === "monthly" ? "mo" : addon.unit}</span>
                  </div>
                  {addon.activeCount > 0 ? (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: 999,
                      background: `${T.emerald}12`, fontSize: 11, fontWeight: 700, color: T.emerald,
                      fontFamily: "'DM Mono', monospace",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.emerald, display: "inline-block" }} />
                      {addon.activeCount} active
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: T.txD }}>No activations</span>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 13, color: T.txM }}>No add-ons match your filters.</div>
        </Card>
      )}

      {/* ───── Drawer ───── */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""} subtitle={selected ? selected.id : ""} width={520}>
        {selected && (
          <div>
            {/* Icon + Description */}
            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: `${CATEGORY_TONE[selected.category] === "amber" ? T.amber : CATEGORY_TONE[selected.category] === "sky" ? T.sky : CATEGORY_TONE[selected.category] === "copper" ? T.copper : T.emerald}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: CATEGORY_TONE[selected.category] === "amber" ? T.amber : CATEGORY_TONE[selected.category] === "sky" ? T.sky : CATEGORY_TONE[selected.category] === "copper" ? T.copper : T.emerald,
                flexShrink: 0,
              }}>
                <Icon name={selected.icon} size={24} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{selected.name}</div>
                <div style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{selected.id}</div>
                <div style={{ fontSize: 13, color: T.txM, lineHeight: 1.5, marginTop: 8 }}>{selected.description}</div>
              </div>
            </div>

            {/* 3 mini stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 14, borderRadius: 12, background: T.surface2, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.emerald, fontFamily: "'Space Grotesk', sans-serif" }}>{money(selected.price)}</div>
                <div style={{ fontSize: 9, color: T.txD, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>
                  {selected.unit === "monthly" ? "Per Month" : "One-Off"}
                </div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: T.surface2, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{selected.activeCount}</div>
                <div style={{ fontSize: 9, color: T.txD, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Active</div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: T.surface2, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {selected.unit === "monthly" ? money(selected.price * selected.activeCount) : money(selected.price * selected.activeCount)}
                </div>
                <div style={{ fontSize: 9, color: T.txD, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>
                  {selected.unit === "monthly" ? "MRR" : "Revenue"}
                </div>
              </div>
            </div>

            {/* Category + type pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <Pill tone={CATEGORY_TONE[selected.category] ?? "emerald"}>{selected.category}</Pill>
              <Pill tone="neutral">{selected.unit === "monthly" ? "Recurring" : "One-Off"}</Pill>
            </div>

            {/* Subscribers */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>
                Subscribers ({subscribers.length})
              </div>
              {subscribers.length === 0 ? (
                <div style={{ fontSize: 12, color: T.txM, padding: 8 }}>No active subscribers yet.</div>
              ) : (
                subscribers.map((t, i) => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < subscribers.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: T.txD }}>{t.region} &middot; {t.tier}</div>
                    </div>
                    <Pill tone={t.type === "trade" ? "amber" : t.type === "institute" ? "sky" : t.type === "health" ? "copper" : "emerald"}>{t.type}</Pill>
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
