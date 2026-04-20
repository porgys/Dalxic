"use client"
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Stat, Card, Pill, Tabs, DataTable, Column, Drawer, SearchBar, Button, T, Tone } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { money, moneyShort, dateShort, relativeDays, pct } from "@/lib/ops/format"
import { MOCK_INVOICES, MockInvoice } from "@/lib/ops/mock"

const STATUS_TONE: Record<string, Tone> = { paid: "emerald", sent: "sky", overdue: "red", draft: "neutral", void: "neutral" }
const METHOD_TONE: Record<string, Tone> = { momo: "amber", bank: "sky", card: "emerald" }

type TabKey = "all" | "paid" | "sent" | "overdue" | "draft"

export default function BillingPage() {
  const [tab, setTab] = useState<TabKey>("all")
  const [search, setSearch] = useState("")
  const [methodFilter, setMethodFilter] = useState<string>("all")
  const [selected, setSelected] = useState<MockInvoice | null>(null)

  const all = MOCK_INVOICES
  const paid = all.filter(i => i.status === "paid")
  const sent = all.filter(i => i.status === "sent")
  const overdue = all.filter(i => i.status === "overdue")
  const draft = all.filter(i => i.status === "draft")

  const collectedMTD = paid.reduce((s, i) => s + i.amount, 0)
  const outstanding = [...sent, ...overdue].reduce((s, i) => s + i.amount, 0)
  const overdueTotal = overdue.reduce((s, i) => s + i.amount, 0)
  const momoCount = paid.filter(i => i.method === "momo").length
  const momoShare = paid.length > 0 ? ((momoCount / paid.length) * 100).toFixed(1) : "0"

  const filtered = useMemo(() => {
    let rows = all
    if (tab !== "all") rows = rows.filter(i => i.status === tab)
    if (methodFilter !== "all") rows = rows.filter(i => i.method === methodFilter)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(i => i.id.toLowerCase().includes(q) || i.tenantName.toLowerCase().includes(q))
    }
    return rows
  }, [tab, search, methodFilter])

  const columns: Column<MockInvoice>[] = [
    { key: "id", label: "Invoice ID", width: 150, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.emerald }}>{r.id}</span> },
    { key: "tenant", label: "Tenant", render: r => <span style={{ fontWeight: 600, fontSize: 13 }}>{r.tenantName}</span> },
    { key: "period", label: "Period", width: 100, render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.period}</span> },
    { key: "due", label: "Due Date", width: 110, render: r => <span style={{ fontSize: 12, color: T.txM }}>{dateShort(r.dueOn)}</span> },
    { key: "amount", label: "Amount", width: 110, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 600 }}>{money(r.amount)}</span> },
    { key: "method", label: "Method", width: 90, render: r => r.method ? <Pill tone={METHOD_TONE[r.method]}>{r.method}</Pill> : <span style={{ fontSize: 11, color: T.txD }}>---</span> },
    { key: "status", label: "Status", width: 100, render: r => <Pill tone={STATUS_TONE[r.status]} dot>{r.status}</Pill> },
  ]

  const s = selected

  return (
    <OpsPage title="Invoices" subtitle="All platform billing. Track collections, chase overdue, reconcile methods." icon="billing">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <Stat label="Collected MTD" value={moneyShort(collectedMTD)} icon="check" accent="emerald" />
        <Stat label="Outstanding" value={moneyShort(outstanding)} icon="billing" accent="sky" />
        <Stat label="Overdue" value={moneyShort(overdueTotal)} sub={`${overdue.length} invoices`} icon="alert" accent="amber" />
        <Stat label="MoMo Share" value={`${momoShare}%`} sub={`${momoCount} of ${paid.length} paid`} icon="phone" accent="amber" />
      </div>

      <Tabs
        tabs={[
          { key: "all" as TabKey, label: "All", count: all.length },
          { key: "paid" as TabKey, label: "Paid", count: paid.length },
          { key: "sent" as TabKey, label: "Sent", count: sent.length },
          { key: "overdue" as TabKey, label: "Overdue", count: overdue.length },
          { key: "draft" as TabKey, label: "Draft", count: draft.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}><SearchBar value={search} onChange={setSearch} placeholder="Search invoices..." /></div>
        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={{ padding: "10px 14px", borderRadius: 10, fontSize: 12, background: "rgba(255,255,255,0.03)", border: `1px solid rgba(16,185,129,0.18)`, color: T.tx, outline: "none", fontFamily: "'DM Sans', sans-serif", minWidth: 130 }}>
          <option value="all">All Methods</option>
          <option value="momo">MoMo</option>
          <option value="bank">Bank</option>
          <option value="card">Card</option>
        </select>
      </div>

      <DataTable rows={filtered} columns={columns} onRowClick={r => setSelected(r)} empty="No invoices match your filters." />

      <Drawer
        open={!!s}
        onClose={() => setSelected(null)}
        title={s?.id ?? ""}
        subtitle={s?.tenantName}
        width={560}
        footer={
          <>
            <Button variant="ghost" icon="mail" onClick={() => setSelected(null)}>Resend</Button>
            <Button variant="outline" icon="download" onClick={() => setSelected(null)}>Download PDF</Button>
            {s?.status === "overdue" && <Button variant="danger" icon="alert" onClick={() => setSelected(null)}>Mark Escalated</Button>}
            {(s?.status === "sent" || s?.status === "overdue") && <Button variant="primary" icon="check" onClick={() => setSelected(null)}>Record Payment</Button>}
          </>
        }
      >
        {s && (
          <>
            {/* Amount hero */}
            <div style={{ textAlign: "center", padding: "20px 0 28px" }}>
              <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: T.tx, letterSpacing: "-0.02em" }}>{money(s.amount)}</div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 8 }}>
                <Pill tone={STATUS_TONE[s.status]} dot>{s.status}</Pill>
                {s.method && <Pill tone={METHOD_TONE[s.method]}>{s.method}</Pill>}
              </div>
            </div>

            {/* Invoice details */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Invoice Details</div>
              {[
                { label: "Invoice ID", value: s.id },
                { label: "Period", value: s.period },
                { label: "Issued", value: dateShort(s.issuedOn) },
                { label: "Due", value: dateShort(s.dueOn) },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.txM }}>{row.label}</span>
                  <span style={{ fontSize: 12, color: T.tx, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Tenant details */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Tenant</div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 12, color: T.txM }}>Name</span>
                <span style={{ fontSize: 12, color: T.tx, fontWeight: 600 }}>{s.tenantName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 12, color: T.txM }}>Tenant ID</span>
                <span style={{ fontSize: 12, color: T.emerald, fontFamily: "'DM Mono', monospace" }}>{s.tenantId}</span>
              </div>
            </div>

            {/* Payment details */}
            {s.method && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Payment</div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.txM }}>Method</span>
                  <Pill tone={METHOD_TONE[s.method]}>{s.method}</Pill>
                </div>
                {s.reference && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 12, color: T.txM }}>Reference</span>
                    <span style={{ fontSize: 12, color: T.tx, fontFamily: "'DM Mono', monospace" }}>{s.reference}</span>
                  </div>
                )}
              </div>
            )}

            {/* Overdue callout */}
            {s.status === "overdue" && (
              <Card style={{ background: `${T.red}08`, border: `1px solid ${T.red}22`, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${T.red}15`, display: "flex", alignItems: "center", justifyContent: "center", color: T.red, flexShrink: 0 }}>
                    <Icon name="alert" size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.red }}>Invoice Overdue</div>
                    <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>Due on {dateShort(s.dueOn)}. Auto-dunning active. Escalate if no response after 3 reminders.</div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </Drawer>
    </OpsPage>
  )
}
