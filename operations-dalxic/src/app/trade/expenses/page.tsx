"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/expenses — Petty cash, approvals, receipts
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Input, TextArea, Select,
  SearchBar, Tabs, Section, Empty, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_EXPENSES, MockExpense, MOCK_ACCOUNTS } from "@/lib/ops/mock"
import { money, dateShort } from "@/lib/ops/format"

type View = "all" | "approved" | "pending" | "rejected"

const STATUS_TONE: Record<MockExpense["status"], Tone> = {
  approved: "emerald", pending: "amber", rejected: "red",
}

const CATEGORY_TONE: Record<MockExpense["category"], Tone> = {
  Rent: "amber", Utilities: "sky", Fuel: "amber", Supplies: "neutral",
  Marketing: "emerald", Repairs: "red", Travel: "sky", Internet: "sky",
  "Salary Advance": "amber", Misc: "neutral",
}

export default function ExpensesPage() {
  return <Shell><ExpensesView /></Shell>
}

function ExpensesView() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [expenses] = useState<MockExpense[]>(MOCK_EXPENSES)
  const [active, setActive] = useState<MockExpense | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (view !== "all" && e.status !== view) return false
      if (!query) return true
      const q = query.toLowerCase()
      return e.vendor.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || (e.notes?.toLowerCase().includes(q) ?? false)
    })
  }, [expenses, view, query])

  const totals = useMemo(() => ({
    approved: expenses.filter(e => e.status === "approved").reduce((a, e) => a + e.amount, 0),
    pending:  expenses.filter(e => e.status === "pending").reduce((a, e) => a + e.amount, 0),
    rejected: expenses.filter(e => e.status === "rejected").reduce((a, e) => a + e.amount, 0),
    missing:  expenses.filter(e => !e.hasReceipt && e.status === "approved").length,
  }), [expenses])

  const cols: Column<MockExpense>[] = [
    { key: "date", label: "Date", width: 100, render: (e) => dateShort(e.date) },
    { key: "vendor", label: "Vendor", render: (e) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {!e.hasReceipt && (
          <span title="Missing receipt" style={{ color: T.amber }}>
            <Icon name="receipts" size={13} />
          </span>
        )}
        <span style={{ color: T.tx, fontWeight: 600 }}>{e.vendor}</span>
      </div>
    )},
    { key: "category", label: "Category", width: 130, render: (e) => <Pill tone={CATEGORY_TONE[e.category]}>{e.category}</Pill> },
    { key: "method", label: "Method", width: 130, render: (e) => <span style={{ color: T.txM, fontSize: 12 }}>{e.method}</span> },
    { key: "submitted", label: "Submitted By", width: 140, render: (e) => <span style={{ fontSize: 12, color: T.txM }}>{e.submittedBy}</span> },
    { key: "amount", label: "Amount", width: 130, align: "right", render: (e) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.amber }}>{money(e.amount)}</span>
    )},
    { key: "status", label: "Status", width: 110, render: (e) => <Pill tone={STATUS_TONE[e.status]} dot>{e.status}</Pill> },
  ]

  return (
    <>
      <Page
        title="Expenses"
        subtitle="Petty cash, vendor payments, and approval queue — every spend with an attached receipt."
        accent="amber"
        action={<Button icon="plus" onClick={() => setShowNew(true)}>New Expense</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Approved (MTD)"     value={money(totals.approved, { compact: true })} accent="emerald" icon="check" />
          <Stat label="Pending Approval"   value={money(totals.pending,  { compact: true })} accent="amber"   icon="expenses" />
          <Stat label="Rejected"            value={money(totals.rejected, { compact: true })} accent="sky"     icon="trash" />
          <Stat label="Missing Receipts"   value={totals.missing}                              accent="amber"  icon="receipts" />
        </div>

        <Section
          title="Expense Activity"
          sub="Open any row to view the full breakdown, approve, or reject."
          action={
            <div style={{ width: 280 }}>
              <SearchBar value={query} onChange={setQuery} placeholder="Vendor, category, notes…" />
            </div>
          }
        >
          <Tabs<View>
            value={view}
            onChange={setView}
            accent="amber"
            tabs={[
              { key: "all",      label: "All",       count: expenses.length },
              { key: "approved", label: "Approved",  count: expenses.filter(e => e.status === "approved").length },
              { key: "pending",  label: "Pending",   count: expenses.filter(e => e.status === "pending").length },
              { key: "rejected", label: "Rejected",  count: expenses.filter(e => e.status === "rejected").length },
            ]}
          />

          {filtered.length === 0 ? (
            <Empty icon="expenses" title="No expenses match" />
          ) : (
            <DataTable rows={filtered} columns={cols} onRowClick={(e) => { setActive(e); setDrawerOpen(true) }} />
          )}
        </Section>
      </Page>

      <ExpenseDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} expense={active} />
      <NewExpenseDrawer open={showNew} onClose={() => setShowNew(false)} />
    </>
  )
}

function ExpenseDrawer({ open, onClose, expense }: { open: boolean; onClose: () => void; expense: MockExpense | null }) {
  if (!expense) return <Drawer open={open} onClose={onClose} title="Expense">{null}</Drawer>
  const account = MOCK_ACCOUNTS.find(a => a.code === expense.account)
  return (
    <Drawer
      open={open} onClose={onClose}
      title={expense.vendor}
      subtitle={`${dateShort(expense.date)} · ${expense.category} · ${expense.method}`}
      width={560}
      footer={
        expense.status === "pending" ? (
          <>
            <Button variant="ghost" icon="trash">Reject</Button>
            <Button icon="check">Approve</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" icon="print">Print</Button>
            <Button variant="outline" icon="edit">Edit</Button>
            <Button icon="download">Download Receipt</Button>
          </>
        )
      }
    >
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <Pill tone={STATUS_TONE[expense.status]} dot>{expense.status}</Pill>
              <Pill tone={CATEGORY_TONE[expense.category]}>{expense.category}</Pill>
              {!expense.hasReceipt && <Pill tone="amber">Receipt Missing</Pill>}
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", marginTop: 6, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {money(expense.amount)}
            </div>
            <div style={{ fontSize: 11, color: T.txD, marginTop: 4, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
              {expense.method}
            </div>
          </div>
        </div>
      </Card>

      <Section title="Details">
        <Card padding={20}>
          <Row label="Vendor"        value={expense.vendor} />
          <Row label="Date"          value={dateShort(expense.date)} />
          <Row label="GL Account"    value={account ? `${account.code} · ${account.name}` : expense.account} mono />
          <Row label="Submitted By"  value={expense.submittedBy} />
          <Row label="Approved By"   value={expense.approvedBy ?? "—"} last />
        </Card>
      </Section>

      {expense.notes && (
        <Section title="Notes">
          <Card padding={20}>
            <p style={{ fontSize: 13, color: T.txM, lineHeight: 1.6 }}>{expense.notes}</p>
          </Card>
        </Section>
      )}

      <Section title="Receipt">
        <Card padding={0}>
          {expense.hasReceipt ? (
            <div style={{ padding: 32, textAlign: "center", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ width: 64, height: 64, margin: "0 auto 14px", borderRadius: 16, background: `${T.emerald}10`, color: T.emerald, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="receipts" size={28} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>receipt-{expense.id}.jpg</div>
              <div style={{ fontSize: 11, color: T.txM, marginTop: 4 }}>Uploaded · 2.4 MB · JPEG</div>
              <div style={{ marginTop: 14 }}>
                <Button variant="outline" size="sm" icon="download">View Receipt</Button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: "center", background: "rgba(245,158,11,0.04)" }}>
              <div style={{ width: 64, height: 64, margin: "0 auto 14px", borderRadius: 16, background: `${T.amber}10`, color: T.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="plus" size={28} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>No receipt attached</div>
              <div style={{ fontSize: 11, color: T.txM, marginTop: 4 }}>Add one to keep your books audit-ready.</div>
              <div style={{ marginTop: 14 }}>
                <Button variant="outline" size="sm" icon="plus">Upload Receipt</Button>
              </div>
            </div>
          )}
        </Card>
      </Section>
    </Drawer>
  )
}

function Row({ label, value, mono = false, last = false }: { label: string; value: React.ReactNode; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.txM }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.tx, fontFamily: mono ? "'DM Mono', monospace" : "'Space Grotesk', sans-serif" }}>{value}</span>
    </div>
  )
}

function NewExpenseDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [vendor, setVendor] = useState("")
  const [category, setCategory] = useState<MockExpense["category"]>("Supplies")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<MockExpense["method"]>("Cash")
  const [account, setAccount] = useState("5900")
  const [notes, setNotes] = useState("")
  const expenseAccounts = MOCK_ACCOUNTS.filter(a => a.cls === "Expense" && a.kind === "Detail")

  return (
    <Drawer
      open={open} onClose={onClose}
      title="New Expense"
      subtitle="Log a spend, attach a receipt, route for approval."
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="outline">Save Draft</Button>
          <Button icon="check" onClick={onClose}>Submit For Approval</Button>
        </>
      }
    >
      <Field label="Vendor / Payee *">
        <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Total Fuel Station Osu" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Category *">
          <Select value={category} onChange={(e) => setCategory(e.target.value as MockExpense["category"])}>
            {(["Rent", "Utilities", "Fuel", "Supplies", "Marketing", "Repairs", "Travel", "Internet", "Salary Advance", "Misc"] as const).map(c => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Amount (GHS) *">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="240" />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Payment Method">
          <Select value={method} onChange={(e) => setMethod(e.target.value as MockExpense["method"])}>
            {(["Cash", "Mobile Money", "Bank Transfer", "Petty Cash"] as const).map(m => <option key={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="GL Account">
          <Select value={account} onChange={(e) => setAccount(e.target.value)}>
            {expenseAccounts.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Notes">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was this for? Internal note for the audit log." />
      </Field>

      <Card padding={16} style={{ marginTop: 8, borderStyle: "dashed" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${T.amber}10`, color: T.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="plus" size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>Attach Receipt Photo</div>
            <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>Snap a photo or upload — keeps the books audit-clean.</div>
          </div>
          <Button variant="outline" size="sm">Upload</Button>
        </div>
      </Card>
    </Drawer>
  )
}
