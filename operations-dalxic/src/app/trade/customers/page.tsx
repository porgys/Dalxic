"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/customers — Customer master + drawer profile
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Input, Select,
  SearchBar, Tabs, Section, Empty, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_CUSTOMERS, MockCustomer } from "@/lib/ops/mock"
import { money, dateShort, relativeDays } from "@/lib/ops/format"

type View = "all" | "active" | "dormant" | "credit"

const TIER_COLORS: Record<MockCustomer["tier"], Tone> = {
  Platinum: "sky", Gold: "amber", Silver: "neutral", Bronze: "neutral",
}

export default function CustomersPage() {
  return <Shell><CustomersView /></Shell>
}

function CustomersView() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [customers] = useState<MockCustomer[]>(MOCK_CUSTOMERS)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [active, setActive] = useState<MockCustomer | null>(null)
  const [showNew, setShowNew] = useState(false)

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (view === "active"  && c.status !== "active") return false
      if (view === "dormant" && c.status !== "dormant") return false
      if (view === "credit"  && c.balance <= 0) return false
      if (!query) return true
      const q = query.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email?.toLowerCase().includes(q) ?? false)
    })
  }, [customers, view, query])

  const totals = useMemo(() => ({
    total: customers.length,
    active: customers.filter(c => c.status === "active").length,
    outstanding: customers.reduce((a, c) => a + c.balance, 0),
    lifetime: customers.reduce((a, c) => a + c.lifetimeSpend, 0),
  }), [customers])

  const cols: Column<MockCustomer>[] = [
    { key: "name", label: "Customer", render: (c) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name={c.name} />
        <div>
          <div style={{ fontWeight: 600, color: T.tx }}>{c.name}</div>
          <div style={{ fontSize: 11, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{c.phone}</div>
        </div>
      </div>
    )},
    { key: "tier",   label: "Tier",    width: 110, render: (c) => <Pill tone={TIER_COLORS[c.tier]} dot>{c.tier}</Pill> },
    { key: "credit", label: "Credit",  width: 130, align: "right", render: (c) => <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.txM }}>{money(c.creditLimit, { compact: true })}</span> },
    { key: "balance", label: "Balance", width: 130, align: "right", render: (c) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: c.balance > 0 ? T.amber : T.txM }}>
        {money(c.balance, { compact: true })}
      </span>
    )},
    { key: "lifetime", label: "Lifetime", width: 130, align: "right", render: (c) => <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.emerald }}>{money(c.lifetimeSpend, { compact: true })}</span> },
    { key: "visits", label: "Visits", width: 90, align: "right", render: (c) => c.visits },
    { key: "last",   label: "Last Visit", width: 130, render: (c) => <span style={{ color: T.txM }}>{relativeDays(c.lastVisit)}</span> },
    { key: "status", label: "Status", width: 110, render: (c) => <Pill tone={c.status === "active" ? "emerald" : "neutral"} dot>{c.status}</Pill> },
  ]

  return (
    <>
      <Page
        title="Customers"
        subtitle="Profiles, credit limits, lifetime spend, and loyalty tier — all in one place."
        accent="amber"
        action={<Button icon="plus" onClick={() => setShowNew(true)}>New Customer</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Customers"     value={totals.total}                                        icon="customers" />
          <Stat label="Active (90d)"         value={totals.active}                       accent="emerald" icon="check" />
          <Stat label="Outstanding Credit"   value={money(totals.outstanding, { compact: true })} accent="amber" icon="financials" />
          <Stat label="Lifetime Revenue"     value={money(totals.lifetime, { compact: true })}    accent="sky"   icon="analytics" />
        </div>

        <Section
          title="Customer Directory"
          sub="Tap a row to open the profile."
          action={
            <div style={{ width: 280 }}>
              <SearchBar value={query} onChange={setQuery} placeholder="Name, phone, email…" />
            </div>
          }
        >
          <Tabs<View>
            value={view}
            onChange={setView}
            accent="amber"
            tabs={[
              { key: "all",     label: "All",     count: customers.length },
              { key: "active",  label: "Active",  count: customers.filter(c => c.status === "active").length },
              { key: "dormant", label: "Dormant", count: customers.filter(c => c.status === "dormant").length },
              { key: "credit",  label: "On Credit", count: customers.filter(c => c.balance > 0).length },
            ]}
          />

          {filtered.length === 0 ? (
            <Empty icon="customers" title="No matches" sub="Try a different search or tab." />
          ) : (
            <DataTable rows={filtered} columns={cols} onRowClick={(c) => { setActive(c); setDrawerOpen(true) }} />
          )}
        </Section>
      </Page>

      <CustomerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} customer={active} />
      <NewCustomerDrawer open={showNew} onClose={() => setShowNew(false)} />
    </>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: `linear-gradient(135deg, ${T.amber}25, ${T.amber}10)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: T.amber, fontWeight: 800, fontSize: 12, fontFamily: "'Space Grotesk', sans-serif",
      border: `1px solid ${T.amber}25`,
    }}>{initials}</div>
  )
}

/* ───── Customer detail drawer ───── */

function CustomerDrawer({ open, onClose, customer }: { open: boolean; onClose: () => void; customer: MockCustomer | null }) {
  if (!customer) return <Drawer open={open} onClose={onClose} title="Customer">{null}</Drawer>
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={customer.name}
      subtitle={`${customer.phone}${customer.email ? ` — ${customer.email}` : ""}`}
      width={520}
      footer={
        <>
          <Button variant="ghost" icon="phone">Call</Button>
          <Button variant="outline" icon="whatsapp">WhatsApp</Button>
          <Button icon="edit">Edit</Button>
        </>
      }
    >
      {/* Hero */}
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Pill tone={TIER_COLORS[customer.tier]} dot>{customer.tier} Tier</Pill>
            <div style={{ fontSize: 36, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1 }}>
              {money(customer.lifetimeSpend, { compact: true })}
            </div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
              Lifetime Spend
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: T.txM }}>Member Since</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, marginTop: 2 }}>{dateShort(customer.joined)}</div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        <MiniStat label="Visits" value={customer.visits} />
        <MiniStat label="Avg Spend" value={money(customer.lifetimeSpend / Math.max(customer.visits, 1), { compact: true })} />
        <MiniStat label="Last Seen" value={relativeDays(customer.lastVisit)} />
      </div>

      <Section title="Credit & Balance">
        <Card padding={20}>
          <Row label="Credit Limit"   value={money(customer.creditLimit)} />
          <Row label="Current Balance" value={money(customer.balance)} valueColor={customer.balance > 0 ? T.amber : T.emerald} />
          <Row label="Available Credit" value={money(customer.creditLimit - customer.balance)} valueColor={T.emerald} last />
        </Card>
      </Section>

      <Section title="Recent Activity">
        <Card padding={20}>
          <Activity icon="pos" label="Purchase R-7821" detail="GHS 240 — Cash" when={dateShort(customer.lastVisit)} />
          <Activity icon="loyalty" label="Earned 24 points" detail="Reached Platinum tier" when="3 days ago" />
          <Activity icon="returns" label="Refund R001" detail="GHS 38 — Defective item" when="6 days ago" last />
        </Card>
      </Section>
    </Drawer>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</div>
    </div>
  )
}

function Row({ label, value, valueColor, last = false }: { label: string; value: React.ReactNode; valueColor?: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.txM }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: valueColor ?? T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</span>
    </div>
  )
}

function Activity({ icon, label, detail, when, last = false }: { icon: "pos" | "loyalty" | "returns"; label: string; detail: string; when: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: `${T.emerald}10`, display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald, flexShrink: 0 }}>
        <Icon name={icon} size={14} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: T.tx, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{detail}</div>
      </div>
      <div style={{ fontSize: 11, color: T.txD, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>{when}</div>
    </div>
  )
}

/* ───── New customer drawer ───── */
function NewCustomerDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [tier, setTier] = useState<MockCustomer["tier"]>("Bronze")
  const [credit, setCredit] = useState("0")

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New Customer"
      subtitle="Add a profile so every visit, refund and credit line links back."
      width={460}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="check" onClick={onClose}>Save Customer</Button>
        </>
      }
    >
      <Field label="Full Name *">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Akosua Mensah" />
      </Field>
      <Field label="Phone *">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 24 555 0000" />
      </Field>
      <Field label="Email">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optional" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Loyalty Tier">
          <Select value={tier} onChange={(e) => setTier(e.target.value as MockCustomer["tier"])}>
            {["Bronze", "Silver", "Gold", "Platinum"].map(t => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Credit Limit (GHS)" hint="Set 0 to require cash only">
          <Input type="number" value={credit} onChange={(e) => setCredit(e.target.value)} />
        </Field>
      </div>
    </Drawer>
  )
}
