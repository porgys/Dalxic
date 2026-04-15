"use client"
/* ═══════════════════════════════════════════════════════════════
   /ops/addons — Add-on marketplace (SMS, WhatsApp, capacity…)
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Card, Stat, Pill, Button, Drawer, SearchBar, Tabs, Section, T, Tone } from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"
import { MOCK_ADDONS, MOCK_TENANTS, MockAddon } from "@/lib/ops/mock"

type View = "all" | "messaging" | "capacity" | "support" | "integration"

const CAT_TONE: Record<MockAddon["category"], Tone> = {
  messaging: "sky", capacity: "emerald", support: "amber", integration: "neutral",
}

export default function OpsAddonsPage() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<MockAddon | null>(null)

  const filtered = useMemo(() => MOCK_ADDONS.filter(a => {
    if (view !== "all" && a.category !== view) return false
    if (!query) return true
    const q = query.toLowerCase()
    return a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)
  }), [view, query])

  const totals = {
    total: MOCK_ADDONS.length,
    monthlyRevenue: MOCK_ADDONS.filter(a => a.unit === "monthly").reduce((s, a) => s + a.price * a.activeCount, 0),
    oneOffRevenue: MOCK_ADDONS.filter(a => a.unit === "one-off").reduce((s, a) => s + a.price * a.activeCount, 0),
    totalActivations: MOCK_ADDONS.reduce((s, a) => s + a.activeCount, 0),
  }

  return (
    <>
      <OpsPage
        title="Add-ons"
        subtitle="À la carte extras on top of a tier. SMS packs, WhatsApp volumes, extra capacity, integrations."
        icon="addons"
        action={<Button icon="plus">New Add-on</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Catalog"             value={totals.total}                                       accent="emerald" icon="addons" />
          <Stat label="Monthly Recurring"    value={`GHS ${totals.monthlyRevenue.toLocaleString()}`}  accent="emerald" icon="billing" />
          <Stat label="One-Off (MTD)"        value={`GHS ${totals.oneOffRevenue.toLocaleString()}`}   accent="sky"     icon="sparkle" />
          <Stat label="Total Activations"    value={totals.totalActivations}                          accent="amber"   icon="check" />
        </div>

        <Section
          title="Marketplace"
          action={<div style={{ width: 340 }}><SearchBar value={query} onChange={setQuery} placeholder="Name, description, id…" /></div>}
        >
          <Tabs<View>
            value={view} onChange={setView} accent="emerald"
            tabs={[
              { key: "all",         label: "All",          count: MOCK_ADDONS.length },
              { key: "messaging",   label: "Messaging",    count: MOCK_ADDONS.filter(a => a.category === "messaging").length },
              { key: "capacity",    label: "Capacity",     count: MOCK_ADDONS.filter(a => a.category === "capacity").length },
              { key: "support",     label: "Support",      count: MOCK_ADDONS.filter(a => a.category === "support").length },
              { key: "integration", label: "Integration",  count: MOCK_ADDONS.filter(a => a.category === "integration").length },
            ]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {filtered.map(a => <AddonCard key={a.id} addon={a} onClick={() => setActive(a)} />)}
          </div>
        </Section>
      </OpsPage>

      <AddonDrawer addon={active} onClose={() => setActive(null)} />
    </>
  )
}

function AddonCard({ addon, onClick }: { addon: MockAddon; onClick: () => void }) {
  const c = addon.category === "messaging" ? T.sky : addon.category === "capacity" ? T.emerald : addon.category === "support" ? T.amber : T.txM
  return (
    <div onClick={onClick} style={{
      padding: 20, borderRadius: 14,
      background: `${c}05`, border: `1px solid ${c}22`,
      cursor: "pointer",
      transition: "transform 0.15s, border-color 0.15s",
      display: "flex", flexDirection: "column", minHeight: 200,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = `${c}55` }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = `${c}22` }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${c}15`, color: c,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={addon.icon as IconName} size={18} />
        </div>
        <Pill tone={CAT_TONE[addon.category]}>{addon.category}</Pill>
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em", marginBottom: 6 }}>
        {addon.name}
      </div>
      <div style={{ fontSize: 12, color: T.txM, lineHeight: 1.5, marginBottom: "auto", minHeight: 36 }}>
        {addon.description}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>
            GHS {addon.price}
          </div>
          <div style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
            {addon.unit}
          </div>
        </div>
        <div style={{
          padding: "5px 10px", borderRadius: 999,
          background: T.surface2, border: `1px solid ${T.border}`,
          fontSize: 10, color: T.tx, fontFamily: "'DM Mono', monospace", fontWeight: 700,
        }}>
          {addon.activeCount} active
        </div>
      </div>
    </div>
  )
}

function AddonDrawer({ addon, onClose }: { addon: MockAddon | null; onClose: () => void }) {
  if (!addon) return <Drawer open={false} onClose={onClose} title="Add-on">{null}</Drawer>
  const subscribers = MOCK_TENANTS.filter(t => t.activeAddons.includes(addon.id))

  return (
    <Drawer
      open={!!addon} onClose={onClose}
      title={addon.name}
      subtitle={`${addon.category} · ${addon.unit}`}
      width={520}
      footer={
        <>
          <Button variant="ghost" icon="edit">Edit</Button>
          <Button variant="outline" icon="download">Sales CSV</Button>
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
            <Icon name={addon.icon as IconName} size={22} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{addon.name}</div>
            <div style={{ fontSize: 12, color: T.txM, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{addon.id}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: T.tx, lineHeight: 1.6 }}>{addon.description}</div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        <MiniStat label="Price" value={`GHS ${addon.price}`} />
        <MiniStat label="Unit" value={addon.unit} />
        <MiniStat label="Active" value={addon.activeCount} />
      </div>

      <Section title={`Subscribers (${subscribers.length})`}>
        <Card padding={14}>
          {subscribers.length === 0
            ? <div style={{ fontSize: 12, color: T.txD, padding: 8 }}>No tenants have this add-on yet</div>
            : subscribers.map((t, i) => (
              <div key={t.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 6px",
                borderBottom: i === subscribers.length - 1 ? "none" : `1px solid ${T.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.tx }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{t.code}</div>
                </div>
                <Pill tone={t.tier === "enterprise" ? "amber" : t.tier === "scale" ? "emerald" : "sky"}>{t.tier}</Pill>
              </div>
            ))}
        </Card>
      </Section>
    </Drawer>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: 12, background: T.surface2, borderRadius: 10, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 9, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginTop: 4 }}>{value}</div>
    </div>
  )
}
