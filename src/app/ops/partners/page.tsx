"use client"
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Stat, Card, Pill, Tabs, DataTable, Column, Drawer, SearchBar, Button, T, Tone } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { money, moneyShort, dateShort } from "@/lib/ops/format"
import { MOCK_PARTNERS, MockPartner } from "@/lib/ops/mock"

const STATUS_TONE: Record<string, Tone> = { active: "emerald", paused: "amber", pending: "sky" }
const TIER_TONE: Record<string, Tone> = { silver: "neutral", gold: "amber", platinum: "emerald" }

type TabKey = "all" | "active" | "paused" | "pending"

export default function PartnersPage() {
  const [tab, setTab] = useState<TabKey>("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<MockPartner | null>(null)

  const all = MOCK_PARTNERS
  const active = all.filter(p => p.status === "active")
  const paused = all.filter(p => p.status === "paused")
  const pending = all.filter(p => p.status === "pending")

  const totalReferred = all.reduce((s, p) => s + p.tenantsReferred, 0)
  const commissionYTD = all.reduce((s, p) => s + p.commissionYTD, 0)
  const platinumCount = all.filter(p => p.tier === "platinum").length

  const filtered = useMemo(() => {
    let rows = all
    if (tab !== "all") rows = rows.filter(p => p.status === tab)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.contact.toLowerCase().includes(q))
    }
    return rows
  }, [tab, search])

  const columns: Column<MockPartner>[] = [
    { key: "code", label: "Code", width: 110, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.emerald }}>{r.code}</span> },
    { key: "name", label: "Partner", render: r => (
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
        <div style={{ fontSize: 11, color: T.txM }}>{r.contact} &middot; {r.phone}</div>
      </div>
    )},
    { key: "tier", label: "Tier", width: 90, render: r => <Pill tone={TIER_TONE[r.tier]}>{r.tier}</Pill> },
    { key: "region", label: "Region", width: 120, render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.region}</span> },
    { key: "tenants", label: "Tenants", width: 80, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.tenantsReferred}</span> },
    { key: "commission", label: "Commission YTD", width: 130, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{money(r.commissionYTD)}</span> },
    { key: "status", label: "Status", width: 100, render: r => <Pill tone={STATUS_TONE[r.status]} dot>{r.status}</Pill> },
  ]

  const s = selected

  return (
    <OpsPage title="Partner Network" subtitle="Resellers, referral partners, and their performance." icon="partners">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <Stat label="Partners" value={all.length} icon="partners" />
        <Stat label="Tenants Referred" value={totalReferred} icon="tenants" accent="sky" />
        <Stat label="Commission YTD" value={moneyShort(commissionYTD)} icon="trending" accent="amber" />
        <Stat label="Platinum" value={platinumCount} icon="sparkle" accent="emerald" />
      </div>

      <Tabs
        tabs={[
          { key: "all" as TabKey, label: "All", count: all.length },
          { key: "active" as TabKey, label: "Active", count: active.length },
          { key: "paused" as TabKey, label: "Paused", count: paused.length },
          { key: "pending" as TabKey, label: "Pending", count: pending.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div style={{ marginBottom: 20 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search partners..." />
      </div>

      <DataTable rows={filtered} columns={columns} onRowClick={r => setSelected(r)} empty="No partners match your filters." />

      <Drawer
        open={!!s}
        onClose={() => setSelected(null)}
        title={s?.name ?? ""}
        subtitle={s?.code}
        width={520}
        footer={
          <>
            <Button variant="ghost" icon="mail" onClick={() => setSelected(null)}>Email Partner</Button>
            <Button variant="outline" icon="tiers" onClick={() => setSelected(null)}>Change Tier</Button>
            {s?.status === "pending" && <Button variant="primary" icon="check" onClick={() => setSelected(null)}>Approve</Button>}
            {s?.status === "active" && <Button variant="danger" icon="lock" onClick={() => setSelected(null)}>Pause</Button>}
          </>
        }
      >
        {s && (
          <>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Pill tone={TIER_TONE[s.tier]}>{s.tier}</Pill>
                <Pill tone={STATUS_TONE[s.status]} dot>{s.status}</Pill>
              </div>
              <div style={{ fontSize: 12, color: T.txM }}>Joined {dateShort(s.joinedOn)}</div>
            </div>

            {/* Mini stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }}>
              {[
                { label: "Tenants", value: s.tenantsReferred },
                { label: "Commission YTD", value: money(s.commissionYTD) },
                { label: "Rate", value: `${s.commissionRate}%` },
              ].map(ms => (
                <div key={ms.label} style={{ padding: 14, borderRadius: 12, background: `${T.emerald}06`, border: `1px solid ${T.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{ms.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{ms.value}</div>
                </div>
              ))}
            </div>

            {/* Contact info */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Contact</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="user" size={14} color={T.txM} />
                  <span style={{ fontSize: 13, color: T.tx }}>{s.contact}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="mail" size={14} color={T.txM} />
                  <span style={{ fontSize: 13, color: T.txM }}>{s.email}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="phone" size={14} color={T.txM} />
                  <span style={{ fontSize: 13, color: T.txM }}>{s.phone}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="globe" size={14} color={T.txM} />
                  <span style={{ fontSize: 13, color: T.txM }}>{s.region}</span>
                </div>
              </div>
            </div>

            {/* Tier benefits callout */}
            <Card style={{ background: s.tier === "platinum" ? `${T.emerald}08` : s.tier === "gold" ? `${T.amber}08` : `${T.sky}08`, border: `1px solid ${s.tier === "platinum" ? T.emerald : s.tier === "gold" ? T.amber : T.sky}22`, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `${s.tier === "platinum" ? T.emerald : s.tier === "gold" ? T.amber : T.sky}15`, display: "flex", alignItems: "center", justifyContent: "center", color: s.tier === "platinum" ? T.emerald : s.tier === "gold" ? T.amber : T.sky, flexShrink: 0 }}>
                  <Icon name="sparkle" size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.tx, textTransform: "capitalize" }}>{s.tier} Tier Benefits</div>
                  <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>
                    {s.tier === "platinum" ? "20% commission, priority leads, co-branded materials, quarterly bonus." :
                     s.tier === "gold" ? "15% commission, early access to features, monthly performance review." :
                     "10% commission, referral dashboard, email support."}
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </Drawer>
    </OpsPage>
  )
}
