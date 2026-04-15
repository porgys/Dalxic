"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/shifts — Shifts, till open/close, Z-report
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Input, Select,
  SearchBar, Tabs, Section, Empty, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_SHIFTS, MockShift, MOCK_BRANCHES } from "@/lib/ops/mock"
import { money, dateShort } from "@/lib/ops/format"

type View = "all" | "open" | "closed" | "reconciled"

const SHIFT_TONE: Record<MockShift["status"], Tone> = {
  open: "amber", closed: "sky", reconciled: "emerald",
}

export default function ShiftsPage() {
  return <Shell><ShiftsView /></Shell>
}

function ShiftsView() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<MockShift | null>(null)
  const [showOpen, setShowOpen] = useState(false)
  const [showZ, setShowZ] = useState<MockShift | null>(null)

  const filtered = useMemo(() => {
    return MOCK_SHIFTS.filter(s => {
      if (view !== "all" && s.status !== view) return false
      if (!query) return true
      const q = query.toLowerCase()
      return (
        s.code.toLowerCase().includes(q) ||
        s.cashier.toLowerCase().includes(q) ||
        s.branch.toLowerCase().includes(q) ||
        s.register.toLowerCase().includes(q)
      )
    })
  }, [view, query])

  const totals = useMemo(() => {
    const open = MOCK_SHIFTS.filter(s => s.status === "open")
    const today = MOCK_SHIFTS.filter(s => s.date === "2026-04-15")
    const todayRev = today.reduce((a, s) => a + s.cashSales + s.momoSales + s.cardSales, 0)
    const variances = MOCK_SHIFTS.filter(s => s.status !== "open").reduce((a, s) => a + s.variance, 0)
    return {
      open: open.length,
      todayRev,
      receipts: today.reduce((a, s) => a + s.receipts, 0),
      variances,
    }
  }, [])

  const cols: Column<MockShift>[] = [
    { key: "code", label: "Code", width: 160, render: (s) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, color: T.amber, letterSpacing: "0.06em", fontSize: 12 }}>{s.code}</span>
    )},
    { key: "branch", label: "Branch · Till", render: (s) => (
      <div>
        <div style={{ fontWeight: 600, color: T.tx }}>{s.branch}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{s.register} · {s.cashier}</div>
      </div>
    )},
    { key: "opened", label: "Opened", width: 100, render: (s) => (
      <div>
        <div style={{ fontSize: 12, color: T.tx }}>{s.openedAt}</div>
        <div style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace" }}>{dateShort(s.date)}</div>
      </div>
    )},
    { key: "closed", label: "Closed", width: 90, render: (s) => (
      <span style={{ fontSize: 12, color: s.closedAt ? T.tx : T.txD }}>{s.closedAt ?? "—"}</span>
    )},
    { key: "rev", label: "Sales", width: 130, align: "right", render: (s) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.emerald }}>
        {money(s.cashSales + s.momoSales + s.cardSales, { compact: true })}
      </span>
    )},
    { key: "var", label: "Variance", width: 110, align: "right", render: (s) => {
      if (s.status === "open") return <span style={{ color: T.txD }}>—</span>
      const positive = s.variance >= 0
      return (
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: s.variance === 0 ? T.emerald : positive ? T.amber : T.red }}>
          {s.variance > 0 ? `+${money(s.variance)}` : money(s.variance)}
        </span>
      )
    }},
    { key: "status", label: "Status", width: 130, render: (s) => <Pill tone={SHIFT_TONE[s.status]} dot>{s.status}</Pill> },
  ]

  return (
    <>
      <Page
        title="Shifts & Till"
        subtitle="Open the till, count the cash, post the Z-report — every shift, every branch."
        accent="amber"
        action={<Button icon="plus" onClick={() => setShowOpen(true)}>Open Shift</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Open Shifts"     value={totals.open}                                  accent="amber"   icon="shifts" />
          <Stat label="Today's Sales"   value={money(totals.todayRev, { compact: true })}    accent="emerald" icon="financials" />
          <Stat label="Today Receipts"  value={totals.receipts}                              accent="sky"     icon="receipts" />
          <Stat label="Net Variance"    value={money(totals.variances, { compact: true })}   accent={totals.variances < 0 ? "amber" : "emerald"} icon="reconciliation" />
        </div>

        <Section
          title="Shift Ledger"
          sub="Every till session — opening float, declared cash, variance, and the Z-report."
          action={
            <div style={{ width: 280 }}>
              <SearchBar value={query} onChange={setQuery} placeholder="Code, cashier, branch…" />
            </div>
          }
        >
          <Tabs<View>
            value={view}
            onChange={setView}
            accent="amber"
            tabs={[
              { key: "all",        label: "All",         count: MOCK_SHIFTS.length },
              { key: "open",       label: "Open",        count: MOCK_SHIFTS.filter(s => s.status === "open").length },
              { key: "closed",     label: "Closed",      count: MOCK_SHIFTS.filter(s => s.status === "closed").length },
              { key: "reconciled", label: "Reconciled",  count: MOCK_SHIFTS.filter(s => s.status === "reconciled").length },
            ]}
          />
          {filtered.length === 0
            ? <Empty icon="shifts" title="No shifts match" />
            : <DataTable rows={filtered} columns={cols} onRowClick={(s) => setActive(s)} />}
        </Section>
      </Page>

      <ShiftDrawer shift={active} onClose={() => setActive(null)} onPrintZ={(s) => { setActive(null); setShowZ(s) }} />
      <ZReportDrawer shift={showZ} onClose={() => setShowZ(null)} />
      <OpenShiftDrawer open={showOpen} onClose={() => setShowOpen(false)} />
    </>
  )
}

/* ─────────────────────────────  SHIFT DRAWER  ───────────────────────────── */
function ShiftDrawer({ shift, onClose, onPrintZ }: { shift: MockShift | null; onClose: () => void; onPrintZ: (s: MockShift) => void }) {
  const totalSales = shift ? shift.cashSales + shift.momoSales + shift.cardSales : 0
  const close = shift?.status === "open"
  return (
    <Drawer
      open={!!shift} onClose={onClose}
      title={shift?.code ?? "Shift"}
      subtitle={shift ? `${shift.branch} · ${shift.register} · ${shift.cashier}` : ""}
      width={620}
      footer={shift ? (close ? (
        <>
          <Button variant="ghost" icon="close">Discard</Button>
          <Button icon="check">Close Shift</Button>
        </>
      ) : (
        <>
          <Button variant="ghost" icon="print" onClick={() => onPrintZ(shift)}>Print Z-Report</Button>
          <Button variant="outline" icon="download">Export CSV</Button>
        </>
      )) : null}
    >
      {!shift ? null : (
        <>
          <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Pill tone={SHIFT_TONE[shift.status]} dot>{shift.status}</Pill>
                <div style={{ fontSize: 32, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {money(totalSales)}
                </div>
                <div style={{ fontSize: 11, color: T.txD, marginTop: 4, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Total Sales</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: T.txM }}>Receipts</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, marginTop: 2, fontFamily: "'Space Grotesk', sans-serif" }}>{shift.receipts}</div>
              </div>
            </div>
          </Card>

          <Section title="Tender Mix">
            <Card padding={0}>
              <TenderRow label="Cash"          value={shift.cashSales}  color={T.emerald} />
              <TenderRow label="Mobile Money"  value={shift.momoSales}  color={T.amber} />
              <TenderRow label="Card"          value={shift.cardSales}  color={T.sky} last />
            </Card>
          </Section>

          <Section title="Cash Reconciliation">
            <Card padding={20}>
              <ReconRow label="Opening float" value={money(shift.openingFloat)} />
              <ReconRow label="Cash sales" value={money(shift.cashSales)} />
              <ReconRow label="Refunds paid in cash" value={`(${money(shift.refunds)})`} />
              <ReconRow label="Expected in drawer" value={money(shift.expectedCash)} bold />
              <div style={{ height: 1, background: T.border, margin: "10px 0" }} />
              <ReconRow label="Counted in drawer" value={shift.status === "open" ? "—" : money(shift.countedCash)} />
              <ReconRow
                label="Variance"
                value={shift.status === "open" ? "—" : (shift.variance > 0 ? `+${money(shift.variance)}` : money(shift.variance))}
                color={shift.status === "open" ? T.txD : (shift.variance === 0 ? T.emerald : shift.variance > 0 ? T.amber : T.red)}
                bold last
              />
            </Card>
          </Section>

          <Section title="Operations">
            <Card padding={20}>
              <RowKV label="Voided receipts" value={money(shift.voids)} />
              <RowKV label="Refunds" value={money(shift.refunds)} />
              <RowKV label="Opened at" value={shift.openedAt} />
              <RowKV label="Closed at" value={shift.closedAt ?? "—"} last />
            </Card>
          </Section>
        </>
      )}
    </Drawer>
  )
}

function TenderRow({ label, value, color, last = false }: { label: string; value: number; color: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: 3, background: color }} />
        <span style={{ fontSize: 13, color: T.tx }}>{label}</span>
      </div>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color, fontSize: 15 }}>{money(value)}</span>
    </div>
  )
}

function ReconRow({ label, value, color, bold = false, last = false }: { label: string; value: string; color?: string; bold?: boolean; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.txM }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 800 : 600, color: color ?? T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</span>
    </div>
  )
}

function RowKV({ label, value, last = false }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.txM }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</span>
    </div>
  )
}

/* ─────────────────────────────  Z-REPORT DRAWER  ───────────────────────────── */
function ZReportDrawer({ shift, onClose }: { shift: MockShift | null; onClose: () => void }) {
  if (!shift) return <Drawer open={false} onClose={onClose} title="Z-Report">{null}</Drawer>
  const totalSales = shift.cashSales + shift.momoSales + shift.cardSales
  return (
    <Drawer
      open={!!shift} onClose={onClose}
      title="Z-Report"
      subtitle={`${shift.code} · ${shift.branch}`}
      width={420}
      footer={
        <>
          <Button variant="ghost" icon="mail">Email Owner</Button>
          <Button icon="print">Print</Button>
        </>
      }
    >
      {/* Thermal-paper preview */}
      <div style={{
        background: "#FFFFFF",
        color: "#000",
        padding: "24px 18px",
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        lineHeight: 1.6,
        borderRadius: 8,
        boxShadow: "0 18px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(245,158,11,0.18)",
      }}>
        <div style={{ textAlign: "center", borderBottom: "1px dashed #888", paddingBottom: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.04em" }}>DALXIC TRADE</div>
          <div style={{ fontSize: 10, marginTop: 2 }}>{shift.branch}</div>
          <div style={{ fontSize: 10, marginTop: 2 }}>Z-REPORT · END OF SHIFT</div>
        </div>

        <ZLine k="Shift" v={shift.code} />
        <ZLine k="Cashier" v={shift.cashier} />
        <ZLine k="Till" v={shift.register} />
        <ZLine k="Date" v={dateShort(shift.date)} />
        <ZLine k="Opened" v={shift.openedAt} />
        <ZLine k="Closed" v={shift.closedAt ?? "—"} />
        <Divider />

        <ZLine k="Receipts" v={String(shift.receipts)} />
        <ZLine k="Voids" v={money(shift.voids)} />
        <ZLine k="Refunds" v={money(shift.refunds)} />
        <Divider />

        <SectionLabel>TENDER</SectionLabel>
        <ZLine k="Cash" v={money(shift.cashSales)} />
        <ZLine k="Mobile Money" v={money(shift.momoSales)} />
        <ZLine k="Card" v={money(shift.cardSales)} />
        <ZLine k="TOTAL SALES" v={money(totalSales)} bold />
        <Divider />

        <SectionLabel>CASH DRAWER</SectionLabel>
        <ZLine k="Opening Float" v={money(shift.openingFloat)} />
        <ZLine k="Expected" v={money(shift.expectedCash)} />
        <ZLine k="Counted" v={shift.status === "open" ? "—" : money(shift.countedCash)} />
        <ZLine k="VARIANCE" v={shift.status === "open" ? "—" : (shift.variance > 0 ? `+${money(shift.variance)}` : money(shift.variance))} bold />
        <Divider />

        <div style={{ textAlign: "center", fontSize: 9, marginTop: 8, opacity: 0.7 }}>
          End of Z-Report · Posted to GL
        </div>
      </div>
    </Drawer>
  )
}

function ZLine({ k, v, bold = false }: { k: string; v: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: bold ? 800 : 400 }}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  )
}

function Divider() {
  return <div style={{ borderTop: "1px dashed #888", margin: "10px 0" }} />
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontWeight: 800, marginTop: 6, marginBottom: 4, letterSpacing: "0.1em" }}>{children}</div>
}

/* ─────────────────────────────  OPEN SHIFT DRAWER  ───────────────────────────── */
function OpenShiftDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [branch, setBranch] = useState("Osu Main")
  const [till, setTill] = useState("Till 1")
  const [cashier, setCashier] = useState("Linda Sefa")
  const [floatAmt, setFloatAmt] = useState("200")
  return (
    <Drawer
      open={open} onClose={onClose}
      title="Open Shift"
      subtitle="Declare your starting cash. Every receipt from now on belongs to this shift."
      width={460}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="check" onClick={onClose}>Open Till</Button>
        </>
      }
    >
      <Field label="Branch *">
        <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
          {MOCK_BRANCHES.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
        </Select>
      </Field>
      <Field label="Till *">
        <Select value={till} onChange={(e) => setTill(e.target.value)}>
          <option>Till 1</option>
          <option>Till 2</option>
          <option>Till 3</option>
        </Select>
      </Field>
      <Field label="Cashier *">
        <Input value={cashier} onChange={(e) => setCashier(e.target.value)} />
      </Field>
      <Field label="Opening Float (GHS) *" hint="Counted physical cash placed in the drawer at start of shift">
        <Input value={floatAmt} onChange={(e) => setFloatAmt(e.target.value)} placeholder="200" />
      </Field>

      <Card padding={16} style={{ marginTop: 14, background: `${T.amber}0A`, border: `1px dashed ${T.amber}40` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.amber, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Reminder</div>
        <div style={{ fontSize: 12, color: T.txM }}>
          Once the till is open, the cashier owns the variance at close. Manager PIN required if the float doesn't match yesterday's close.
        </div>
      </Card>
    </Drawer>
  )
}
