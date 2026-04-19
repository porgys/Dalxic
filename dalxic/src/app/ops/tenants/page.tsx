"use client"
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Stat, Card, Pill, Tabs, DataTable, Column, Drawer, SearchBar, Section, Button, T, Tone } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { useRouter } from "next/navigation"
import { money, moneyShort, dateShort, relativeDays, pct } from "@/lib/ops/format"
import { MOCK_TENANTS, MockTenant, TenantStatus, OrgType, TenantTier } from "@/lib/ops/mock"

const STATUS_TONE: Record<string, Tone> = { active: "emerald", trial: "sky", past_due: "amber", suspended: "red", churned: "neutral" }
const TIER_TONE: Record<string, Tone> = { starter: "neutral", growth: "sky", scale: "emerald", enterprise: "amber" }
const TYPE_LABEL: Record<string, string> = { trade: "Trade", health: "Health", institute: "Institute", restaurant: "Restaurant", salon: "Salon", gym: "Gym", mechanic: "Mechanic", pharmacy: "Pharmacy", law: "Law", hotel: "Hotel" }

type TabKey = "all" | "active" | "trial" | "past_due" | "suspended"

export default function TenantsPage() {
  const [tab, setTab] = useState<TabKey>("all")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [tierFilter, setTierFilter] = useState<string>("all")
  const [selected, setSelected] = useState<MockTenant | null>(null)
  const router = useRouter()

  const all = MOCK_TENANTS
  const active = all.filter(t => t.status === "active")
  const trial = all.filter(t => t.status === "trial")
  const pastDue = all.filter(t => t.status === "past_due")
  const suspended = all.filter(t => t.status === "suspended")
  const totalMRR = active.reduce((s, t) => s + t.mrr, 0)

  const regions = useMemo(() => [...new Set(all.map(t => t.region))].sort(), [])
  const types = useMemo(() => [...new Set(all.map(t => t.type))].sort(), [])

  const filtered = useMemo(() => {
    let rows = all
    if (tab !== "all") rows = rows.filter(t => t.status === tab)
    if (typeFilter !== "all") rows = rows.filter(t => t.type === typeFilter)
    if (regionFilter !== "all") rows = rows.filter(t => t.region === regionFilter)
    if (tierFilter !== "all") rows = rows.filter(t => t.tier === tierFilter)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(t => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.ownerName.toLowerCase().includes(q))
    }
    return rows
  }, [tab, search, typeFilter, regionFilter, tierFilter])

  const columns: Column<MockTenant>[] = [
    { key: "code", label: "Code", width: 120, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.emerald }}>{r.code}</span> },
    { key: "name", label: "Name", render: r => (
      <div>
        <div style={{ fontWeight: 600 }}>{r.name}</div>
        <div style={{ fontSize: 11, color: T.txM }}>{r.ownerName}</div>
      </div>
    )},
    { key: "type", label: "Type", width: 100, render: r => <Pill tone={r.type === "health" ? "copper" : r.type === "institute" ? "sky" : "amber"}>{TYPE_LABEL[r.type] ?? r.type}</Pill> },
    { key: "tier", label: "Tier", width: 100, render: r => <Pill tone={TIER_TONE[r.tier]}>{r.tier}</Pill> },
    { key: "status", label: "Status", width: 100, render: r => <Pill tone={STATUS_TONE[r.status]} dot>{r.status.replace("_", " ")}</Pill> },
    { key: "region", label: "Region", width: 120, render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.region}</span> },
    { key: "mrr", label: "MRR", width: 100, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.mrr > 0 ? money(r.mrr) : "---"}</span> },
    { key: "health", label: "Health", width: 80, render: r => {
      const c = r.health >= 80 ? T.emerald : r.health >= 50 ? T.amber : T.red
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.surface2, minWidth: 36 }}>
            <div style={{ height: "100%", borderRadius: 3, background: c, width: `${r.health}%` }} />
          </div>
          <span style={{ fontSize: 10, color: c, fontFamily: "'DM Mono', monospace", minWidth: 24, textAlign: "right" }}>{r.health}</span>
        </div>
      )
    }},
  ]

  const s = selected

  return (
    <OpsPage title="Tenant Registry" subtitle="Every organisation on the platform. Filter, inspect, act." icon="tenants">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 32 }}>
        <Stat label="Total Tenants" value={all.length} icon="tenants" />
        <Stat label="Active" value={active.length} icon="check" accent="emerald" />
        <Stat label="Trial" value={trial.length} icon="clock" accent="sky" />
        <Stat label="Past Due" value={pastDue.length} icon="alert" accent="amber" />
        <Stat label="MRR" value={moneyShort(totalMRR)} sub={`ARR ${moneyShort(totalMRR * 12)}`} icon="trending" />
      </div>

      <Tabs
        tabs={[
          { key: "all" as TabKey, label: "All", count: all.length },
          { key: "active" as TabKey, label: "Active", count: active.length },
          { key: "trial" as TabKey, label: "Trial", count: trial.length },
          { key: "past_due" as TabKey, label: "Past Due", count: pastDue.length },
          { key: "suspended" as TabKey, label: "Suspended", count: suspended.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}><SearchBar value={search} onChange={setSearch} placeholder="Search tenants..." /></div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: "10px 14px", borderRadius: 10, fontSize: 12, background: "rgba(255,255,255,0.03)", border: `1px solid rgba(16,185,129,0.18)`, color: T.tx, outline: "none", fontFamily: "'DM Sans', sans-serif", minWidth: 120 }}>
          <option value="all">All Types</option>
          {types.map(t => <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>)}
        </select>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={{ padding: "10px 14px", borderRadius: 10, fontSize: 12, background: "rgba(255,255,255,0.03)", border: `1px solid rgba(16,185,129,0.18)`, color: T.tx, outline: "none", fontFamily: "'DM Sans', sans-serif", minWidth: 140 }}>
          <option value="all">All Regions</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} style={{ padding: "10px 14px", borderRadius: 10, fontSize: 12, background: "rgba(255,255,255,0.03)", border: `1px solid rgba(16,185,129,0.18)`, color: T.tx, outline: "none", fontFamily: "'DM Sans', sans-serif", minWidth: 120 }}>
          <option value="all">All Tiers</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="scale">Scale</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <DataTable rows={filtered} columns={columns} onRowClick={r => setSelected(r)} empty="No tenants match your filters." />

      <Drawer
        open={!!s}
        onClose={() => setSelected(null)}
        title={s?.name ?? ""}
        subtitle={<span style={{ cursor: "default" }} onClick={() => { if (s) { setSelected(null); router.push(`/ops/tenants/${s.code}`) } }}>{s?.code}</span>}
        width={620}
        footer={
          <>
            <Button variant="ghost" icon="user" onClick={() => setSelected(null)}>Login as Owner</Button>
            <Button variant="outline" icon="tiers" onClick={() => setSelected(null)}>Change Tier</Button>
            <Button variant="danger" icon="lock" onClick={() => setSelected(null)}>Suspend</Button>
          </>
        }
      >
        {s && (
          <>
            {/* Hero */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Pill tone={STATUS_TONE[s.status]} dot>{s.status.replace("_", " ")}</Pill>
                <Pill tone={TIER_TONE[s.tier]}>{s.tier}</Pill>
                <Pill tone={s.type === "health" ? "copper" : s.type === "institute" ? "sky" : "amber"}>{TYPE_LABEL[s.type] ?? s.type}</Pill>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: T.tx, letterSpacing: "-0.02em" }}>{money(s.mrr)}<span style={{ fontSize: 14, color: T.txM, fontWeight: 400 }}>/mo</span></div>
            </div>

            {/* Mini stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 28 }}>
              {[
                { label: "Branches", value: s.branches },
                { label: "Users", value: s.users },
                { label: "Modules", value: s.activeModules.length },
                { label: "Health", value: s.health },
              ].map(ms => (
                <div key={ms.label} style={{ padding: 14, borderRadius: 12, background: `${T.emerald}06`, border: `1px solid ${T.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{ms.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{ms.value}</div>
                </div>
              ))}
            </div>

            {/* Owner */}
            <Section title="Owner">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="user" size={14} color={T.txM} />
                  <span style={{ fontSize: 13, color: T.tx }}>{s.ownerName}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="mail" size={14} color={T.txM} />
                  <span style={{ fontSize: 13, color: T.txM }}>{s.ownerEmail}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="phone" size={14} color={T.txM} />
                  <span style={{ fontSize: 13, color: T.txM }}>{s.ownerPhone}</span>
                </div>
              </div>
            </Section>

            {/* Behaviours */}
            <Section title="Behaviours">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {s.activeBehaviours.map(b => (
                  <span key={b} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: `${T.emerald}10`, color: T.emerald, border: `1px solid ${T.border}` }}>
                    {s.labelConfig[b] ?? b}
                  </span>
                ))}
              </div>
            </Section>

            {/* Modules */}
            <Section title="Active Modules">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {s.activeModules.map(m => (
                  <span key={m} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: `${T.sky}10`, color: T.sky, border: `1px solid ${T.sky}22` }}>
                    {m}
                  </span>
                ))}
                {s.activeModules.length === 0 && <span style={{ fontSize: 12, color: T.txD }}>No active modules</span>}
              </div>
            </Section>

            {/* Billing summary */}
            <Section title="Billing Summary">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Region", value: `${s.region}, ${s.country}` },
                  { label: "Joined", value: dateShort(s.joinedOn) },
                  { label: "Renews", value: dateShort(s.renewsOn) },
                  { label: "Payment Gate", value: s.paymentGate === "pay_before" ? "Pay Before" : "Pay After" },
                  { label: "Last Seen", value: relativeDays(s.lastSeen) },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 12, color: T.txM }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: T.tx, fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}
      </Drawer>
    </OpsPage>
  )
}
