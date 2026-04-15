"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/returns — Returns & Refunds
   List of past refunds + drawer to file a new one.
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Input, Select,
  TextArea, SearchBar, Tabs, Section, Empty, T, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_RETURNS, MockReturn } from "@/lib/ops/mock"
import { money, dateShort } from "@/lib/ops/format"

type View = "all" | "completed" | "pending"

export default function ReturnsPage() {
  return <Shell><ReturnsView /></Shell>
}

function ReturnsView() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [returns] = useState<MockReturn[]>(MOCK_RETURNS)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [active, setActive] = useState<MockReturn | null>(null)

  const filtered = useMemo(() => {
    return returns.filter((r) => {
      if (view !== "all" && r.status !== view) return false
      if (!query) return true
      const q = query.toLowerCase()
      return r.receiptCode.toLowerCase().includes(q) ||
             r.customer.toLowerCase().includes(q) ||
             r.items.some(i => i.name.toLowerCase().includes(q))
    })
  }, [returns, view, query])

  const totals = useMemo(() => ({
    count: returns.length,
    refunded: returns.filter(r => r.status === "completed").reduce((a, r) => a + r.total, 0),
    pending:  returns.filter(r => r.status === "pending").reduce((a, r) => a + r.total, 0),
    restocked: returns.filter(r => r.restocked).length,
  }), [returns])

  const cols: Column<MockReturn>[] = [
    { key: "id",       label: "Refund #",  width: 100, render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", color: T.txM }}>{r.id}</span> },
    { key: "date",     label: "Date",      width: 110, render: (r) => dateShort(r.date) },
    { key: "receipt",  label: "Receipt",   width: 110, render: (r) => <span style={{ fontFamily: "'DM Mono', monospace" }}>{r.receiptCode}</span> },
    { key: "customer", label: "Customer",            render: (r) => r.customer },
    { key: "items",    label: "Items",               render: (r) => r.items.map(i => `${i.qty}× ${i.name}`).join(", ") },
    { key: "reason",   label: "Reason",   width: 170, render: (r) => <Pill tone="amber">{r.reason}</Pill> },
    { key: "method",   label: "Method",   width: 130, render: (r) => r.method },
    { key: "total",    label: "Refunded", width: 120, align: "right", render: (r) => <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.amber }}>{money(r.total)}</span> },
    { key: "status",   label: "Status",   width: 110, render: (r) => <Pill tone={r.status === "completed" ? "emerald" : "amber"} dot>{r.status}</Pill> },
  ]

  return (
    <>
      <Page
        title="Returns & Refunds"
        subtitle="Review every refund issued, restock decisions, and outstanding approval queue."
        accent="amber"
        action={<Button icon="plus" onClick={() => { setActive(null); setDrawerOpen(true) }}>New Refund</Button>}
      >
        {/* Stat strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Refunds (30d)" value={totals.count}             icon="returns" />
          <Stat label="Amount Refunded"     value={money(totals.refunded, { compact: true })} accent="amber" icon="financials" />
          <Stat label="Pending Approval"    value={money(totals.pending,  { compact: true })} accent="sky"   icon="check" />
          <Stat label="Items Restocked"     value={totals.restocked}         accent="emerald" icon="inventory" />
        </div>

        <Section
          title="Refund Activity"
          sub="Tap any row to view the full breakdown."
          action={
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 260 }}>
                <SearchBar value={query} onChange={setQuery} placeholder="Search receipt, item, customer…" />
              </div>
            </div>
          }
        >
          <Tabs<View>
            value={view}
            onChange={setView}
            accent="amber"
            tabs={[
              { key: "all",       label: "All",       count: returns.length },
              { key: "completed", label: "Completed", count: returns.filter(r => r.status === "completed").length },
              { key: "pending",   label: "Pending",   count: returns.filter(r => r.status === "pending").length },
            ]}
          />

          {filtered.length === 0 ? (
            <Empty
              icon="returns"
              title="No refunds match that filter"
              sub="Try a wider search or switch tabs."
              action={<Button onClick={() => { setQuery(""); setView("all") }}>Reset Filters</Button>}
            />
          ) : (
            <DataTable
              rows={filtered}
              columns={cols}
              onRowClick={(r) => { setActive(r); setDrawerOpen(true) }}
            />
          )}
        </Section>
      </Page>

      <RefundDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        existing={active}
      />
    </>
  )
}

/* ───── Refund Drawer ───── */

function RefundDrawer({ open, onClose, existing }: { open: boolean; onClose: () => void; existing: MockReturn | null }) {
  const isView = !!existing
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isView ? `Refund ${existing!.id}` : "New Refund"}
      subtitle={isView ? `${existing!.customer} — Receipt ${existing!.receiptCode}` : "Look up the original sale, pick items, set reason and method."}
      width={520}
      footer={
        isView ? (
          <>
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <Button icon="print">Print</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button icon="check" onClick={onClose}>Process Refund</Button>
          </>
        )
      }
    >
      {isView ? <ViewRefund r={existing!} /> : <NewRefundForm />}
    </Drawer>
  )
}

function ViewRefund({ r }: { r: MockReturn }) {
  return (
    <div>
      <Card padding={20} style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13 }}>
          <Detail label="Date" value={dateShort(r.date)} />
          <Detail label="Status" value={<Pill tone={r.status === "completed" ? "emerald" : "amber"} dot>{r.status}</Pill>} />
          <Detail label="Reason" value={<Pill tone="amber">{r.reason}</Pill>} />
          <Detail label="Method" value={r.method} />
          <Detail label="Restocked" value={r.restocked ? "Yes" : "No"} />
          <Detail label="Approved By" value={r.approvedBy ?? "—"} />
        </div>
      </Card>

      <Section title="Items Refunded">
        <Card padding={0}>
          {r.items.map((it, idx) => (
            <div key={idx} style={{ padding: "14px 18px", borderBottom: idx === r.items.length - 1 ? "none" : `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>{it.name}</div>
                <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>Qty {it.qty}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.amber, fontFamily: "'Space Grotesk', sans-serif" }}>{money(it.refund)}</div>
            </div>
          ))}
          <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", borderTop: `1px solid ${T.border2}`, background: "rgba(245,158,11,0.04)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: T.txM }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif" }}>{money(r.total)}</span>
          </div>
        </Card>
      </Section>
    </div>
  )
}

function NewRefundForm() {
  const [receipt, setReceipt] = useState("")
  const [reason, setReason] = useState<string>("Defective")
  const [method, setMethod] = useState<string>("Cash")
  const [restock, setRestock] = useState(true)
  const [notes, setNotes] = useState("")

  return (
    <div>
      <Field label="Original Receipt Code">
        <Input value={receipt} onChange={(e) => setReceipt(e.target.value.toUpperCase())} placeholder="R-7821" />
      </Field>

      <Card padding={20} style={{ marginBottom: 16, opacity: receipt ? 1 : 0.4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
          Items On Receipt
        </div>
        {receipt ? (
          <div style={{ fontSize: 13, color: T.txM, padding: "16px 0", textAlign: "center" }}>
            <Icon name="search" size={16} style={{ marginBottom: 8, opacity: 0.5 }} />
            <div>Sample line items appear here when wired to /api/trade/sales/[id].</div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: T.txD, textAlign: "center", padding: "16px 0" }}>
            Enter a receipt code to load its items.
          </div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Reason">
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {["Defective", "Wrong Item", "Customer Changed Mind", "Expired", "Damaged In Transit"].map(r => <option key={r}>{r}</option>)}
          </Select>
        </Field>
        <Field label="Refund Method">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            {["Cash", "Mobile Money", "Card", "Store Credit"].map(m => <option key={m}>{m}</option>)}
          </Select>
        </Field>
      </div>

      <Field label="Notes" hint="Optional internal note for the audit log">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Customer presented original packaging, no signs of misuse." />
      </Field>

      <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.border}`, cursor: "pointer", background: restock ? "rgba(16,185,129,0.06)" : "transparent" }}>
        <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} style={{ width: 16, height: 16, accentColor: T.emerald }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>Restock the item</div>
          <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>Returns this stock to the floor inventory.</div>
        </div>
      </label>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, color: T.txD, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: 13, color: T.tx, fontWeight: 600 }}>{value}</div>
    </div>
  )
}
