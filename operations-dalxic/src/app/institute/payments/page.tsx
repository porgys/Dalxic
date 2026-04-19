"use client"
import { useState } from "react"
import { InstituteShell } from "@/components/ops/InstituteShell"
import { Page, Stat, Pill, Drawer, DataTable, Card, T } from "@/components/ops/primitives"
import { MOCK_INST_PAYMENTS } from "@/lib/ops/mock"
import { money } from "@/lib/ops/format"

export default function PaymentsPage() {
  const [active, setActive] = useState<typeof MOCK_INST_PAYMENTS[0] | null>(null)

  const total = MOCK_INST_PAYMENTS.reduce((s, p) => s + p.amount, 0)
  const cash = MOCK_INST_PAYMENTS.filter(p => p.method === "Cash").reduce((s, p) => s + p.amount, 0)
  const momo = MOCK_INST_PAYMENTS.filter(p => p.method === "MoMo").reduce((s, p) => s + p.amount, 0)
  const bank = MOCK_INST_PAYMENTS.filter(p => p.method === "Bank").reduce((s, p) => s + p.amount, 0)

  return (
    <InstituteShell>
      <Page accent="sky" title="Payments" subtitle="Payment ledger — all received payments across students.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Received" value={money(total)} accent="sky" icon="billing" />
          <Stat label="Cash" value={money(cash)} accent="emerald" icon="expenses" />
          <Stat label="MoMo" value={money(momo)} accent="amber" icon="expenses" />
          <Stat label="Bank" value={money(bank)} accent="sky" icon="expenses" />
        </div>

        <DataTable
          columns={[
            { key: "date", label: "Date", render: (r) => r.date, width: 100 },
            { key: "studentName", label: "Student", render: (r) => r.studentName },
            { key: "feeId", label: "Fee Reference", render: (r) => r.feeId },
            { key: "amount", label: "Amount", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{money(r.amount)}</span>, width: 100 },
            { key: "method", label: "Method", render: (r) => <Pill tone={r.method === "Cash" ? "emerald" : r.method === "MoMo" ? "amber" : "sky"}>{r.method}</Pill>, width: 80 },
            { key: "receivedBy", label: "Received By", render: (r) => r.receivedBy },
            { key: "reference", label: "Reference", render: (r) => r.reference, width: 120 },
          ]}
          rows={MOCK_INST_PAYMENTS}
          onRowClick={(p) => setActive(p)}
        />

        <Drawer open={!!active} onClose={() => setActive(null)} title="Payment Receipt" subtitle={active?.studentName} width={440}>
          {active && (
            <Card padding={18}>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Student:</b> {active.studentName}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Amount:</b> {money(active.amount)}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Method:</b> {active.method}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Reference:</b> {active.reference}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Received By:</b> {active.receivedBy}</div>
              <div style={{ fontSize: 13, color: T.tx }}><b>Date:</b> {active.date}</div>
            </Card>
          )}
        </Drawer>
      </Page>
    </InstituteShell>
  )
}
