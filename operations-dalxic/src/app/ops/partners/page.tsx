"use client"
/* ═══════════════════════════════════════════════════════════════
   /ops/partners — Reseller network + commission tracking
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import {
  Card, Stat, Pill, Button, DataTable, Drawer, SearchBar,
  Tabs, Section, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_PARTNERS, MockPartner } from "@/lib/ops/mock"

type View = "all" | "active" | "paused" | "pending"

const TIER_TONE: Record<MockPartner["tier"], Tone> = {
  silver: "neutral", gold: "amber", platinum: "emerald",
}

const STATUS_TONE: Record<MockPartner["status"], Tone> = {
  active: "emerald", paused: "amber", pending: "sky",
}

export default function OpsPartnersPage() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<MockPartner | null>(null)

  const filtered = useMemo(() => MOCK_PARTNERS.filter(p => {
    if (view !== "all" && p.status !== view) return false
    if (!query) return true
    const q = query.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.contact.toLowerCase().includes(q) || p.region.toLowerCase().includes(q)
  }), [view, query])

  const totals = {
    total: MOCK_PARTNERS.length,
    tenants: MOCK_PARTNERS.reduce((s, p) => s + p.tenantsReferred, 0),
    commission: MOCK_PARTNERS.reduce((s, p) => s + p.commissionYTD, 0),
    platinum: MOCK_PARTNERS.filter(p => p.tier === "platinum").length,
  }

  const cols: Column<MockPartner>[] = [
    { key: "code", label: "Code", width: 140, render: (p) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 800, color: T.emerald }}>{p.code}</span>
    )},
    { key: "name", label: "Partner", render: (p) => (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{p.name}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{p.contact} · {p.phone}</div>
      </div>
    )},
    { key: "tier", label: "Tier", width: 110, render: (p) => <Pill tone={TIER_TONE[p.tier]} dot>{p.tier}</Pill> },
    { key: "region", label: "Region", width: 140, render: (p) => <span style={{ fontSize: 12, color: T.txM }}>{p.region}</span> },
    { key: "tenants", label: "Tenants", width: 100, align: "center", render: (p) => (
      <span style={{ fontSize: 14, fontWeight: 800, color: T.tx, fontFamily: "'DM Mono', monospace" }}>{p.tenantsReferred}</span>
    )},
    { key: "commission", label: "YTD Commission", width: 160, align: "right", render: (p) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 800, color: T.emerald }}>GHS {p.commissionYTD.toLocaleString()}</span>
    )},
    { key: "status", label: "Status", width: 110, render: (p) => <Pill tone={STATUS_TONE[p.status]} dot>{p.status}</Pill> },
  ]

  return (
    <>
      <OpsPage
        title="Partners"
        subtitle="Resellers, implementation partners, regional affiliates. They bring tenants — we pay them."
        icon="partners"
        action={<Button icon="plus">Add Partner</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Partners"          value={totals.total}                                      accent="emerald" icon="partners" />
          <Stat label="Tenants Referred"  value={totals.tenants}                                    accent="emerald" icon="tenants" />
          <Stat label="Commission YTD"    value={`GHS ${totals.commission.toLocaleString()}`}       accent="amber"   icon="billing" />
          <Stat label="Platinum"          value={totals.platinum}                                   accent="sky"     icon="sparkle" />
        </div>

        <Section
          title="Partner Network"
          action={<div style={{ width: 340 }}><SearchBar value={query} onChange={setQuery} placeholder="Name, code, contact, region…" /></div>}
        >
          <Tabs<View>
            value={view} onChange={setView} accent="emerald"
            tabs={[
              { key: "all",     label: "All",     count: MOCK_PARTNERS.length },
              { key: "active",  label: "Active",  count: MOCK_PARTNERS.filter(p => p.status === "active").length },
              { key: "paused",  label: "Paused",  count: MOCK_PARTNERS.filter(p => p.status === "paused").length },
              { key: "pending", label: "Pending", count: MOCK_PARTNERS.filter(p => p.status === "pending").length },
            ]}
          />

          <DataTable rows={filtered} columns={cols} onRowClick={(p) => setActive(p)} />
        </Section>
      </OpsPage>

      <PartnerDrawer partner={active} onClose={() => setActive(null)} />
    </>
  )
}

function PartnerDrawer({ partner, onClose }: { partner: MockPartner | null; onClose: () => void }) {
  if (!partner) return <Drawer open={false} onClose={onClose} title="Partner">{null}</Drawer>

  return (
    <Drawer
      open={!!partner} onClose={onClose}
      title={partner.name}
      subtitle={`${partner.code} · ${partner.region}`}
      width={520}
      footer={
        <>
          <Button variant="ghost" icon="mail">Send Brief</Button>
          <Button variant="outline" icon="download">Commission Statement</Button>
          <Button icon="check">Save</Button>
        </>
      }
    >
      <Card padding={20} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Pill tone={TIER_TONE[partner.tier]} dot>{partner.tier}</Pill>
          <Pill tone={STATUS_TONE[partner.status]}>{partner.status}</Pill>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{partner.name}</div>
        <div style={{ fontSize: 12, color: T.txM, marginTop: 6 }}>Partner since {partner.joinedOn}</div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        <MiniStat label="Tenants" value={partner.tenantsReferred} />
        <MiniStat label="YTD Commission" value={`GHS ${partner.commissionYTD.toLocaleString()}`} />
        <MiniStat label="Rate" value={`${partner.commissionRate}%`} />
      </div>

      <Section title="Primary Contact">
        <Card padding={20}>
          <RowKV label="Contact" value={partner.contact} />
          <RowKV label="Phone" value={partner.phone} mono />
          <RowKV label="Email" value={partner.email} mono last />
        </Card>
      </Section>

      <Card padding={16} style={{ marginTop: 20, background: `${T.emerald}0A`, border: `1px dashed ${T.emerald}40` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="sparkle" size={16} color={T.emerald} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.emerald, fontFamily: "'DM Mono', monospace" }}>Tier Benefits</div>
        </div>
        <div style={{ fontSize: 12, color: T.txM, marginTop: 8, lineHeight: 1.5 }}>
          {partner.tier === "platinum" ? "20% commission · co-marketing budget · dedicated partner manager · early access to releases." :
            partner.tier === "gold"    ? "15% commission · quarterly business review · priority support escalation." :
            "10% commission · shared partner portal · standard support."}
        </div>
      </Card>
    </Drawer>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: 12, background: T.surface2, borderRadius: 10, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 9, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginTop: 4 }}>{value}</div>
    </div>
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
