"use client"
/* ═══════════════════════════════════════════════════════════════
   /ops/billing — Invoices + MoMo collections + dunning
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import {
  Card, Stat, Pill, Button, DataTable, Drawer, Field, Select, SearchBar,
  Tabs, Section, Empty, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_INVOICES, MOCK_TENANTS, MockInvoice } from "@/lib/ops/mock"

type View = "all" | "paid" | "sent" | "overdue" | "draft"

const STATUS_TONE: Record<MockInvoice["status"], Tone> = {
  paid: "emerald", sent: "sky", overdue: "red", draft: "neutral", void: "neutral",
}

const METHOD_COLOR: Record<string, string> = {
  momo: T.amber, bank: T.sky, card: T.emerald,
}

export default function OpsBillingPage() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [method, setMethod] = useState("All")
  const [active, setActive] = useState<MockInvoice | null>(null)

  const filtered = useMemo(() => MOCK_INVOICES.filter(i => {
    if (view !== "all" && i.status !== view) return false
    if (method !== "All" && i.method !== method.toLowerCase()) return false
    if (!query) return true
    const q = query.toLowerCase()
    return i.id.toLowerCase().includes(q) || i.tenantName.toLowerCase().includes(q) || (i.reference?.toLowerCase().includes(q) ?? false)
  }), [view, query, method])

  const totals = useMemo(() => ({
    total: MOCK_INVOICES.length,
    collected: MOCK_INVOICES.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0),
    outstanding: MOCK_INVOICES.filter(i => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0),
    overdue: MOCK_INVOICES.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0),
    momo: MOCK_INVOICES.filter(i => i.method === "momo").reduce((s, i) => s + i.amount, 0),
    bank: MOCK_INVOICES.filter(i => i.method === "bank").reduce((s, i) => s + i.amount, 0),
  }), [])

  const cols: Column<MockInvoice>[] = [
    { key: "id", label: "Invoice", width: 160, render: (i) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 800, color: T.emerald }}>{i.id}</span>
    )},
    { key: "tenant", label: "Tenant", render: (i) => (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{i.tenantName}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{i.tenantId}</div>
      </div>
    )},
    { key: "period", label: "Period", width: 110, render: (i) => <span style={{ fontSize: 12, color: T.txM }}>{i.period}</span> },
    { key: "due", label: "Due", width: 110, render: (i) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.txM }}>{i.dueOn}</span> },
    { key: "amount", label: "Amount", width: 130, align: "right", render: (i) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 800, color: T.tx }}>GHS {i.amount.toLocaleString()}</span>
    )},
    { key: "method", label: "Method", width: 110, render: (i) => i.method
      ? <span style={{ fontSize: 11, fontWeight: 700, color: METHOD_COLOR[i.method], fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>{i.method}</span>
      : <span style={{ fontSize: 11, color: T.txD }}>—</span>
    },
    { key: "status", label: "Status", width: 110, render: (i) => <Pill tone={STATUS_TONE[i.status]} dot>{i.status}</Pill> },
  ]

  return (
    <>
      <OpsPage
        title="Billing"
        subtitle="All invoices, all tenants. Collect, dun, post. MoMo and bank settle here."
        icon="billing"
        action={<div style={{ display: "flex", gap: 8 }}>
          <Button variant="outline" icon="download">Export</Button>
          <Button icon="plus">Generate Invoices</Button>
        </div>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Collected MTD"    value={`GHS ${totals.collected.toLocaleString()}`}  accent="emerald" icon="check" />
          <Stat label="Outstanding"       value={`GHS ${totals.outstanding.toLocaleString()}`} accent="amber"   icon="billing" />
          <Stat label="Overdue"           value={`GHS ${totals.overdue.toLocaleString()}`}     accent="amber"   icon="bolt" />
          <Stat label="MoMo Share"         value={`GHS ${totals.momo.toLocaleString()}`}       accent="sky"     icon="phone" sub={`${((totals.momo / (totals.momo + totals.bank || 1)) * 100).toFixed(0)}% of collected`} />
        </div>

        <Section
          title="Invoice Ledger"
          action={<div style={{ width: 340 }}><SearchBar value={query} onChange={setQuery} placeholder="Invoice, tenant, reference…" /></div>}
        >
          <Tabs<View>
            value={view} onChange={setView} accent="emerald"
            tabs={[
              { key: "all",     label: "All",     count: MOCK_INVOICES.length },
              { key: "paid",    label: "Paid",    count: MOCK_INVOICES.filter(i => i.status === "paid").length },
              { key: "sent",    label: "Sent",    count: MOCK_INVOICES.filter(i => i.status === "sent").length },
              { key: "overdue", label: "Overdue", count: MOCK_INVOICES.filter(i => i.status === "overdue").length },
              { key: "draft",   label: "Draft",   count: MOCK_INVOICES.filter(i => i.status === "draft").length },
            ]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Field label="Method">
              <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option>All</option><option>Momo</option><option>Bank</option><option>Card</option>
              </Select>
            </Field>
          </div>

          {filtered.length === 0
            ? <Empty icon="billing" title="No invoices match" />
            : <DataTable rows={filtered} columns={cols} onRowClick={(i) => setActive(i)} />}
        </Section>
      </OpsPage>

      <InvoiceDrawer invoice={active} onClose={() => setActive(null)} />
    </>
  )
}

function InvoiceDrawer({ invoice, onClose }: { invoice: MockInvoice | null; onClose: () => void }) {
  if (!invoice) return <Drawer open={false} onClose={onClose} title="Invoice">{null}</Drawer>
  const tenant = MOCK_TENANTS.find(t => t.id === invoice.tenantId)

  return (
    <Drawer
      open={!!invoice} onClose={onClose}
      title={invoice.id}
      subtitle={invoice.tenantName}
      width={560}
      footer={
        <>
          <Button variant="ghost" icon="print">Print</Button>
          <Button variant="outline" icon="download">PDF</Button>
          {invoice.status === "overdue" && <Button variant="danger" icon="whatsapp">Send Reminder</Button>}
          {invoice.status === "sent" && <Button icon="check">Mark Paid</Button>}
        </>
      }
    >
      <Card padding={20} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Pill tone={STATUS_TONE[invoice.status]} dot>{invoice.status}</Pill>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>Amount Due</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>
              GHS {invoice.amount.toLocaleString()}
            </div>
          </div>
        </div>
      </Card>

      <Section title="Invoice">
        <Card padding={20}>
          <RowKV label="Invoice #" value={invoice.id} mono />
          <RowKV label="Period" value={invoice.period} />
          <RowKV label="Issued" value={invoice.issuedOn} mono />
          <RowKV label="Due" value={invoice.dueOn} mono last />
        </Card>
      </Section>

      <Section title="Tenant">
        <Card padding={20}>
          <RowKV label="Name" value={invoice.tenantName} />
          <RowKV label="Code" value={invoice.tenantId} mono />
          {tenant && (
            <>
              <RowKV label="Tier" value={tenant.tier} />
              <RowKV label="Contact" value={`${tenant.ownerName} · ${tenant.ownerPhone}`} last />
            </>
          )}
        </Card>
      </Section>

      {invoice.method && (
        <Section title="Payment">
          <Card padding={20}>
            <RowKV label="Method" value={invoice.method.toUpperCase()} mono />
            <RowKV label="Reference" value={invoice.reference ?? "—"} mono last />
          </Card>
        </Section>
      )}

      {invoice.status === "overdue" && (
        <Card padding={16} style={{ marginTop: 20, background: `${T.red}0A`, border: `1px dashed ${T.red}40` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="bolt" size={16} color={T.red} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.red, fontFamily: "'DM Mono', monospace" }}>Overdue</div>
          </div>
          <div style={{ fontSize: 12, color: T.txM, marginTop: 8, lineHeight: 1.5 }}>
            Dunning schedule: day 3 SMS · day 7 WhatsApp · day 14 phone call · day 21 suspension warning.
          </div>
        </Card>
      )}
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
