"use client"
import { useState, useMemo } from "react"
import { InstituteShell } from "@/components/ops/InstituteShell"
import { Page, Stat, Pill, Drawer, Tabs, DataTable, Card, T, SearchBar, Button, Field, Input, Select, Section } from "@/components/ops/primitives"
import { MOCK_INST_FEES, MOCK_INST_PAYMENTS } from "@/lib/ops/mock"
import { money, pct } from "@/lib/ops/format"

type View = "all" | "UNPAID" | "PARTIAL" | "PAID"

export default function FeesPage() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<typeof MOCK_INST_FEES[0] | null>(null)

  const filtered = useMemo(() => {
    let items = [...MOCK_INST_FEES]
    if (view !== "all") items = items.filter(f => f.status === view)
    if (query) {
      const q = query.toLowerCase()
      items = items.filter(f => f.studentName.toLowerCase().includes(q))
    }
    return items
  }, [view, query])

  const totalBilled = MOCK_INST_FEES.reduce((s, f) => s + f.amount, 0)
  const collected = MOCK_INST_FEES.reduce((s, f) => s + f.paid, 0)
  const outstanding = MOCK_INST_FEES.reduce((s, f) => s + f.balance, 0)
  return (
    <InstituteShell>
      <Page accent="sky" title="Fees" subtitle="Fee schedules, payment tracking and outstanding balances.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Billed" value={money(totalBilled)} accent="sky" icon="billing" />
          <Stat label="Collected" value={money(collected)} accent="emerald" icon="check" />
          <Stat label="Outstanding" value={money(outstanding)} accent="neutral" icon="trending" />
          <Stat label="Collection Rate" value={pct(collected, totalBilled)} accent="sky" icon="analytics" />
        </div>

        <Section title="Fee Ledger" action={<div style={{ width: 280 }}><SearchBar value={query} onChange={setQuery} placeholder="Search student…" /></div>}>
          <Tabs<View> value={view} onChange={setView} accent="sky" tabs={[
            { key: "all", label: "All", count: MOCK_INST_FEES.length },
            { key: "UNPAID", label: "Unpaid", count: MOCK_INST_FEES.filter(f => f.status === "UNPAID").length },
            { key: "PARTIAL", label: "Partial", count: MOCK_INST_FEES.filter(f => f.status === "PARTIAL").length },
            { key: "PAID", label: "Paid", count: MOCK_INST_FEES.filter(f => f.status === "PAID").length },
          ]} />

          <DataTable
            columns={[
              { key: "studentName", label: "Student", render: (r) => r.studentName },
              { key: "description", label: "Description", render: (r) => r.description },
              { key: "amount", label: "Amount", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace" }}>{money(r.amount)}</span>, width: 100 },
              { key: "paid", label: "Paid", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", color: T.emerald }}>{money(r.paid)}</span>, width: 100 },
              { key: "balance", label: "Balance", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", color: r.balance > 0 ? T.red : T.emerald }}>{money(r.balance)}</span>, width: 100 },
              { key: "status", label: "Status", render: (r) => <Pill tone={r.status === "UNPAID" ? "red" : r.status === "PARTIAL" ? "amber" : "emerald"}>{r.status}</Pill>, width: 90 },
              { key: "dueDate", label: "Due", render: (r) => r.dueDate, width: 100 },
            ]}
            rows={filtered}
            onRowClick={(f) => setActive(f)}
          />
        </Section>

        <Drawer open={!!active} onClose={() => setActive(null)} title={active?.studentName ?? "Fee"} subtitle={active?.description} width={480}>
          {active && (
            <>
              <Card padding={18} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Amount:</b> {money(active.amount)}</div>
                <div style={{ fontSize: 13, color: T.emerald, marginBottom: 6 }}><b>Paid:</b> {money(active.paid)}</div>
                <div style={{ fontSize: 13, color: T.red, marginBottom: 6 }}><b>Balance:</b> {money(active.balance)}</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Due:</b> {active.dueDate}</div>
                <div style={{ fontSize: 13, color: T.tx }}><b>Term:</b> {active.term}</div>
              </Card>
              <Section title="Payment History">
                {MOCK_INST_PAYMENTS.filter(p => p.feeId === active.id).map(p => (
                  <Card key={p.id} padding={12} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.tx }}>{money(p.amount)}</span>
                      <Pill tone="sky">{p.method}</Pill>
                    </div>
                    <div style={{ fontSize: 11, color: T.txM, marginTop: 4 }}>{p.date} · {p.receivedBy}</div>
                  </Card>
                ))}
              </Section>
              <Card padding={18} style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Record Payment</div>
                <Field label="Amount"><Input type="number" placeholder="Amount in pesewas" /></Field>
                <Field label="Method"><Select><option value="Cash">Cash</option><option value="MoMo">MoMo</option><option value="Bank">Bank</option></Select></Field>
                <Field label="Reference"><Input placeholder="Receipt / reference number" /></Field>
                <Button full>Record Payment</Button>
              </Card>
            </>
          )}
        </Drawer>
      </Page>
    </InstituteShell>
  )
}
