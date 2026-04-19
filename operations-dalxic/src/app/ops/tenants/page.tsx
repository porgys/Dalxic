"use client"
/* ═══════════════════════════════════════════════════════════════
   /ops/tenants — Tenant registry + detail drawer
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import {
  Card, Stat, Pill, Button, DataTable, Drawer, Field, Select, SearchBar,
  Tabs, Section, Empty, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import {
  MOCK_TENANTS, MockTenant, TenantStatus, TenantTier, OrgType,
  MOCK_INVOICES, MOCK_TICKETS, MOCK_MODULES, ORG_TONE, ALL_BEHAVIOURS,
} from "@/lib/ops/mock"

type View = "all" | "active" | "trial" | "past_due" | "suspended"

const STATUS_TONE: Record<TenantStatus, Tone> = {
  active: "emerald", trial: "sky", past_due: "amber", suspended: "red", churned: "neutral",
}

const TIER_TONE: Record<TenantTier, Tone> = {
  starter: "neutral", growth: "sky", scale: "emerald", enterprise: "amber",
}

export default function OpsTenantsPage() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [orgType, setOrgType] = useState("All")
  const [region, setRegion] = useState("All")
  const [tier, setTier] = useState("All")
  const [active, setActive] = useState<MockTenant | null>(null)

  const regions = useMemo(() => ["All", ...new Set(MOCK_TENANTS.map(t => t.region))], [])

  const filtered = useMemo(() => {
    return MOCK_TENANTS.filter(t => {
      if (view !== "all" && t.status !== view) return false
      if (orgType !== "All" && t.type !== orgType.toLowerCase()) return false
      if (region !== "All" && t.region !== region) return false
      if (tier !== "All" && t.tier !== tier.toLowerCase()) return false
      if (!query) return true
      const q = query.toLowerCase()
      return t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.ownerName.toLowerCase().includes(q) || t.ownerPhone.includes(q)
    })
  }, [view, query, orgType, region, tier])

  const totals = useMemo(() => ({
    total: MOCK_TENANTS.length,
    active: MOCK_TENANTS.filter(t => t.status === "active").length,
    trial: MOCK_TENANTS.filter(t => t.status === "trial").length,
    pastDue: MOCK_TENANTS.filter(t => t.status === "past_due").length,
    suspended: MOCK_TENANTS.filter(t => t.status === "suspended").length,
    mrr: MOCK_TENANTS.filter(t => t.status === "active").reduce((s, t) => s + t.mrr, 0),
  }), [])

  const cols: Column<MockTenant>[] = [
    { key: "code", label: "Code", width: 130, render: (t) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 800, color: T.emerald, letterSpacing: "0.04em" }}>{t.code}</span>
    )},
    { key: "name", label: "Tenant", render: (t) => (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{t.name}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{t.ownerName} · {t.ownerPhone}</div>
      </div>
    )},
    { key: "type", label: "Type", width: 110, render: (t) => (
      <Pill tone={ORG_TONE[t.type]}>{t.type}</Pill>
    )},
    { key: "behaviours", label: "Behaviours", width: 90, align: "center", render: (t) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: t.activeBehaviours.length === 6 ? T.emerald : T.txM }}>{t.activeBehaviours.length}/6</span>
    )},
    { key: "tier", label: "Tier", width: 110, render: (t) => <Pill tone={TIER_TONE[t.tier]}>{t.tier}</Pill> },
    { key: "status", label: "Status", width: 120, render: (t) => <Pill tone={STATUS_TONE[t.status]} dot>{t.status.replace("_", " ")}</Pill> },
    { key: "region", label: "Region", width: 130, render: (t) => <span style={{ fontSize: 12, color: T.txM }}>{t.region}</span> },
    { key: "branches", label: "B / U", width: 80, align: "center", render: (t) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.txM }}>{t.branches}·{t.users}</span>
    )},
    { key: "mrr", label: "MRR", width: 110, align: "right", render: (t) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 800, color: t.mrr > 0 ? T.tx : T.txD }}>
        {t.mrr > 0 ? `GHS ${t.mrr.toLocaleString()}` : "—"}
      </span>
    )},
    { key: "health", label: "Health", width: 100, render: (t) => <HealthBar value={t.health} /> },
  ]

  return (
    <>
      <OpsPage
        title="Tenants"
        subtitle="Every operator on the platform — retail and institutions. Click any row for the full view."
        icon="tenants"
        action={<Button icon="plus">Onboard Tenant</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total"     value={totals.total}                                            accent="emerald" icon="tenants" />
          <Stat label="Active"    value={totals.active}                                           accent="emerald" icon="check" />
          <Stat label="Trial"     value={totals.trial}                                            accent="sky"     icon="sparkle" />
          <Stat label="Past Due"  value={totals.pastDue}                                          accent="amber"   icon="billing" />
          <Stat label="MRR"       value={`GHS ${(totals.mrr / 1000).toFixed(1)}k`}                accent="emerald" icon="trending" />
        </div>

        <Section
          title="Tenant Registry"
          action={<div style={{ width: 340 }}><SearchBar value={query} onChange={setQuery} placeholder="Name, code, owner, phone…" /></div>}
        >
          <Tabs<View>
            value={view} onChange={setView} accent="emerald"
            tabs={[
              { key: "all",       label: "All",       count: MOCK_TENANTS.length },
              { key: "active",    label: "Active",    count: totals.active },
              { key: "trial",     label: "Trial",     count: totals.trial },
              { key: "past_due",  label: "Past Due",  count: totals.pastDue },
              { key: "suspended", label: "Suspended", count: totals.suspended },
            ]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Field label="Type">
              <Select value={orgType} onChange={(e) => setOrgType(e.target.value)}>
                <option>All</option><option>Trade</option><option>Health</option><option>Institute</option><option>Restaurant</option><option>Salon</option>
              </Select>
            </Field>
            <Field label="Region">
              <Select value={region} onChange={(e) => setRegion(e.target.value)}>
                {regions.map(r => <option key={r}>{r}</option>)}
              </Select>
            </Field>
            <Field label="Tier">
              <Select value={tier} onChange={(e) => setTier(e.target.value)}>
                <option>All</option><option>Starter</option><option>Growth</option><option>Scale</option><option>Enterprise</option>
              </Select>
            </Field>
          </div>

          {filtered.length === 0
            ? <Empty icon="tenants" title="No tenants match" />
            : <DataTable rows={filtered} columns={cols} onRowClick={(t) => setActive(t)} />}
        </Section>
      </OpsPage>

      <TenantDrawer tenant={active} onClose={() => setActive(null)} />
    </>
  )
}

function HealthBar({ value }: { value: number }) {
  const c = value >= 85 ? T.emerald : value >= 65 ? T.sky : value >= 40 ? T.amber : T.red
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: T.surface2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: c, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: c, fontWeight: 700, width: 24, textAlign: "right" }}>{value}</span>
    </div>
  )
}

function TenantDrawer({ tenant, onClose }: { tenant: MockTenant | null; onClose: () => void }) {
  if (!tenant) return <Drawer open={false} onClose={onClose} title="Tenant">{null}</Drawer>
  const invoices = MOCK_INVOICES.filter(i => i.tenantId === tenant.id)
  const tickets  = MOCK_TICKETS.filter(t => t.tenantId === tenant.id)
  const paid   = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0)
  const unpaid = invoices.filter(i => i.status !== "paid" && i.status !== "void").reduce((s, i) => s + i.amount, 0)

  return (
    <Drawer
      open={!!tenant} onClose={onClose}
      title={tenant.name}
      subtitle={`${tenant.code} · ${tenant.region}`}
      width={620}
      footer={
        <>
          <Button variant="ghost" icon="share">Login as Owner</Button>
          <Button variant="outline" icon="edit">Change Tier</Button>
          {tenant.status === "active" && <Button variant="danger" icon="lock">Suspend</Button>}
          {tenant.status === "suspended" && <Button icon="check">Reactivate</Button>}
        </>
      }
    >
      <Card padding={20} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <Pill tone={STATUS_TONE[tenant.status]} dot>{tenant.status.replace("_", " ")}</Pill>
              <Pill tone={TIER_TONE[tenant.tier]}>{tenant.tier}</Pill>
              <Pill tone={ORG_TONE[tenant.type]}>{tenant.type}</Pill>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}>
              {tenant.name}
            </div>
            <div style={{ fontSize: 13, color: T.txM, marginTop: 6 }}>
              Joined {tenant.joinedOn} · Renews {tenant.renewsOn} · Last seen {tenant.lastSeen}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>MRR</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: T.emerald, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>
              GHS {tenant.mrr.toLocaleString()}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        <MiniStat label="Branches" value={tenant.branches} />
        <MiniStat label="Users" value={tenant.users} />
        <MiniStat label="Health" value={`${tenant.health}%`} />
        <MiniStat label="Modules" value={tenant.activeModules.length} />
      </div>

      <Section title="Owner & Contact">
        <Card padding={20}>
          <RowKV label="Primary Contact" value={tenant.ownerName} />
          <RowKV label="Phone" value={tenant.ownerPhone} mono />
          <RowKV label="Email" value={tenant.ownerEmail} mono last />
        </Card>
      </Section>

      <Section title="6 Behaviours" sub={`${tenant.activeBehaviours.length} of 6 active · ${tenant.paymentGate === "pay_before" ? "Pay-Before" : "Pay-After"}`}>
        <Card padding={14}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {ALL_BEHAVIOURS.map(b => {
              const active = tenant.activeBehaviours.includes(b)
              return (
                <div key={b} style={{
                  padding: "6px 12px", borderRadius: 8,
                  background: active ? `${T.emerald}10` : T.surface2,
                  border: `1px solid ${active ? T.emerald + "30" : T.border}`,
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                  color: active ? T.emerald : T.txD,
                  fontFamily: "'DM Mono', monospace",
                  textTransform: "uppercase",
                }}>
                  {b}
                </div>
              )
            })}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <Pill tone={tenant.paymentGate === "pay_before" ? "copper" : "amber"} dot>{tenant.paymentGate === "pay_before" ? "Pay-Before" : "Pay-After"}</Pill>
          </div>
          {Object.keys(tenant.labelConfig).length > 0 && (
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Label Config</div>
              {(Object.entries(tenant.labelConfig) as [string, string][]).map(([beh, label]) => (
                <div key={beh} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 11, color: T.txM, fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>{beh}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.tx }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Section>

      <Section title="Active Modules" sub={`${tenant.activeModules.length} of ${MOCK_MODULES.filter(m => m.vertical === tenant.type || m.vertical === "universal").length} available for ${tenant.type}`}>
        <Card padding={14}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tenant.activeModules.map(modId => {
              const m = MOCK_MODULES.find(mm => mm.id === modId)
              return (
                <div key={modId} style={{
                  padding: "6px 10px", borderRadius: 8,
                  background: `${T.emerald}10`, border: `1px solid ${T.emerald}30`,
                  fontSize: 11, fontWeight: 700, color: T.emerald,
                  fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em",
                }}>
                  {m?.name ?? modId}
                </div>
              )
            })}
            {tenant.activeModules.length === 0 && <div style={{ fontSize: 12, color: T.txD, padding: "4px 0" }}>No modules active</div>}
          </div>
        </Card>
      </Section>

      {tenant.activeAddons.length > 0 && (
        <Section title="Add-ons">
          <Card padding={14}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tenant.activeAddons.map(a => (
                <div key={a} style={{
                  padding: "6px 10px", borderRadius: 8,
                  background: `${T.amber}10`, border: `1px solid ${T.amber}30`,
                  fontSize: 11, fontWeight: 700, color: T.amber,
                  fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em",
                }}>
                  {a}
                </div>
              ))}
            </div>
          </Card>
        </Section>
      )}

      <Section title="Billing" sub={`${invoices.length} invoice(s) · GHS ${paid.toLocaleString()} paid · GHS ${unpaid.toLocaleString()} outstanding`}>
        <Card padding={14}>
          {invoices.length === 0
            ? <div style={{ fontSize: 12, color: T.txD, padding: 8 }}>No invoices yet</div>
            : invoices.slice(0, 4).map((inv, i) => (
              <div key={inv.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 6px",
                borderBottom: i === Math.min(invoices.length, 4) - 1 ? "none" : `1px solid ${T.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.tx, fontFamily: "'DM Mono', monospace" }}>{inv.id}</div>
                  <div style={{ fontSize: 10, color: T.txM, marginTop: 2 }}>{inv.period} · Due {inv.dueOn}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: T.tx, fontFamily: "'DM Mono', monospace" }}>GHS {inv.amount.toLocaleString()}</span>
                  <Pill tone={inv.status === "paid" ? "emerald" : inv.status === "overdue" ? "red" : "amber"}>{inv.status}</Pill>
                </div>
              </div>
            ))}
        </Card>
      </Section>

      <Section title="Support">
        <Card padding={14}>
          {tickets.length === 0
            ? <div style={{ fontSize: 12, color: T.txD, padding: 8 }}>No tickets open</div>
            : tickets.map((t, i) => (
              <div key={t.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 6px",
                borderBottom: i === tickets.length - 1 ? "none" : `1px solid ${T.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.tx }}>{t.subject}</div>
                  <div style={{ fontSize: 10, color: T.txM, marginTop: 2 }}>{t.category} · {t.messages} msgs · {t.assignee}</div>
                </div>
                <Pill tone={t.priority === "urgent" ? "red" : t.priority === "high" ? "amber" : t.status === "resolved" ? "emerald" : "neutral"}>{t.priority}</Pill>
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
      <div style={{ fontSize: 18, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginTop: 4 }}>{value}</div>
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
