"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/payroll — Ghana payroll: SSNIT Tier 1/2, PAYE, payslips
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Input, Select,
  SearchBar, Tabs, Section, Empty, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import {
  MOCK_EMPLOYEES, MockEmployee,
  MOCK_PAY_RUNS, MockPayRun,
  MOCK_BRANCHES,
} from "@/lib/ops/mock"
import { money, dateShort } from "@/lib/ops/format"

type View = "runs" | "employees"

const RUN_TONE: Record<MockPayRun["status"], Tone> = {
  draft: "amber", approved: "sky", paid: "emerald",
}

const EMP_TONE: Record<MockEmployee["status"], Tone> = {
  active: "emerald", on_leave: "amber", suspended: "neutral",
}

/* Ghana PAYE 2026 — monthly bands (illustrative) */
function calculatePAYE(taxable: number): number {
  const bands = [
    { upto:  490, rate: 0 },
    { upto:  600, rate: 0.05 },
    { upto:  730, rate: 0.10 },
    { upto: 3896.67, rate: 0.175 },
    { upto: 19896.67, rate: 0.25 },
    { upto: 50416.67, rate: 0.30 },
    { upto: Infinity, rate: 0.35 },
  ]
  let remaining = taxable, prev = 0, paye = 0
  for (const b of bands) {
    if (taxable <= prev) break
    const slice = Math.min(taxable, b.upto) - prev
    if (slice > 0) paye += slice * b.rate
    prev = b.upto
    remaining -= slice
  }
  return paye
}

interface PayslipRow {
  emp: MockEmployee
  gross: number
  ssnitEEE: number  // employee 5.5%
  ssnitERT1: number // employer 13%
  ssnitERT2: number // employer 5%
  taxable: number
  paye: number
  net: number
}

function buildPayslip(emp: MockEmployee): PayslipRow {
  const gross = emp.basic + emp.allowances
  const ssnitEEE = emp.basic * 0.055
  const ssnitERT1 = emp.basic * 0.13
  const ssnitERT2 = emp.basic * 0.05
  const taxable = gross - ssnitEEE
  const paye = calculatePAYE(taxable)
  const net = gross - ssnitEEE - paye
  return { emp, gross, ssnitEEE, ssnitERT1, ssnitERT2, taxable, paye, net }
}

export default function PayrollPage() {
  return <Shell><PayrollView /></Shell>
}

function PayrollView() {
  const [view, setView] = useState<View>("runs")
  const [query, setQuery] = useState("")
  const [activeRun, setActiveRun] = useState<MockPayRun | null>(null)
  const [activeEmp, setActiveEmp] = useState<MockEmployee | null>(null)
  const [showNewEmp, setShowNewEmp] = useState(false)
  const [showRunPay, setShowRunPay] = useState(false)

  const totals = useMemo(() => {
    const draft = MOCK_PAY_RUNS.find(r => r.status === "draft")
    const ytdGross = MOCK_PAY_RUNS.filter(r => r.status === "paid").reduce((a, r) => a + r.gross, 0)
    const ytdSSNIT = MOCK_PAY_RUNS.filter(r => r.status === "paid").reduce((a, r) => a + r.ssnitTier1 + r.ssnitTier2, 0)
    const ytdPAYE = MOCK_PAY_RUNS.filter(r => r.status === "paid").reduce((a, r) => a + r.paye, 0)
    return {
      activeStaff: MOCK_EMPLOYEES.filter(e => e.status === "active").length,
      currentNet: draft?.net ?? 0,
      ytdSSNIT,
      ytdPAYE,
      ytdGross,
    }
  }, [])

  const runRows = useMemo(() => {
    if (!query) return MOCK_PAY_RUNS
    const q = query.toLowerCase()
    return MOCK_PAY_RUNS.filter(r => r.code.toLowerCase().includes(q) || r.period.toLowerCase().includes(q))
  }, [query])

  const empRows = useMemo(() => {
    if (!query) return MOCK_EMPLOYEES
    const q = query.toLowerCase()
    return MOCK_EMPLOYEES.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.staffNo.toLowerCase().includes(q) ||
      e.branch.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q)
    )
  }, [query])

  const runCols: Column<MockPayRun>[] = [
    { key: "code", label: "Code", width: 150, render: (r) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, color: T.amber, letterSpacing: "0.06em" }}>{r.code}</span>
    )},
    { key: "period", label: "Period", render: (r) => (
      <div>
        <div style={{ fontWeight: 600, color: T.tx }}>{r.period}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{r.employees} employees</div>
      </div>
    )},
    { key: "gross", label: "Gross", width: 130, align: "right", render: (r) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.tx }}>{money(r.gross, { compact: true })}</span>
    )},
    { key: "ssnit", label: "SSNIT (T1+T2)", width: 130, align: "right", render: (r) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.sky }}>{money(r.ssnitTier1 + r.ssnitTier2, { compact: true })}</span>
    )},
    { key: "paye", label: "PAYE", width: 110, align: "right", render: (r) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.amber }}>{money(r.paye, { compact: true })}</span>
    )},
    { key: "net", label: "Net Pay", width: 130, align: "right", render: (r) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, color: T.emerald }}>{money(r.net, { compact: true })}</span>
    )},
    { key: "status", label: "Status", width: 110, render: (r) => <Pill tone={RUN_TONE[r.status]} dot>{r.status}</Pill> },
  ]

  const empCols: Column<MockEmployee>[] = [
    { key: "staffNo", label: "Staff #", width: 110, render: (e) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, color: T.amber, letterSpacing: "0.06em" }}>{e.staffNo}</span>
    )},
    { key: "name", label: "Employee", render: (e) => (
      <div>
        <div style={{ fontWeight: 600, color: T.tx }}>{e.name}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{e.role} · {e.branch}</div>
      </div>
    )},
    { key: "basic", label: "Basic", width: 110, align: "right", render: (e) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.tx }}>{money(e.basic, { compact: true })}</span>
    )},
    { key: "allow", label: "Allowances", width: 120, align: "right", render: (e) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.txM }}>{money(e.allowances, { compact: true })}</span>
    )},
    { key: "ssnit", label: "SSNIT #", width: 130, render: (e) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.txM }}>{e.ssnit}</span>
    )},
    { key: "status", label: "Status", width: 120, render: (e) => <Pill tone={EMP_TONE[e.status]} dot>{e.status.replace("_", " ")}</Pill> },
  ]

  return (
    <>
      <Page
        title="Payroll"
        subtitle="SSNIT Tier 1, Tier 2, PAYE — calculated to GRA spec, posted to the GL, paid out to the bank."
        accent="amber"
        action={view === "runs"
          ? <Button icon="plus" onClick={() => setShowRunPay(true)}>Run Payroll</Button>
          : <Button icon="plus" onClick={() => setShowNewEmp(true)}>New Employee</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Active Staff"     value={totals.activeStaff}                              accent="emerald" icon="customers" />
          <Stat label="Net Pay (Apr)"    value={money(totals.currentNet, { compact: true })}    accent="amber"   icon="payroll" />
          <Stat label="SSNIT YTD"        value={money(totals.ytdSSNIT, { compact: true })}      accent="sky"     icon="financials" />
          <Stat label="PAYE YTD"         value={money(totals.ytdPAYE, { compact: true })}       accent="amber"   icon="tax" />
        </div>

        <Section
          title={view === "runs" ? "Pay Runs" : "Employees"}
          sub={
            view === "runs"
              ? "Each run snapshots gross, SSNIT, PAYE, and net pay. Approve to post journals, mark paid to disburse."
              : "Master register — basic, allowances, SSNIT and TIN. Edits apply to the next pay run."
          }
          action={
            <div style={{ width: 280 }}>
              <SearchBar value={query} onChange={setQuery} placeholder="Search…" />
            </div>
          }
        >
          <Tabs<View>
            value={view}
            onChange={(v) => { setView(v); setQuery("") }}
            accent="amber"
            tabs={[
              { key: "runs",      label: "Pay Runs",  count: MOCK_PAY_RUNS.length },
              { key: "employees", label: "Employees", count: MOCK_EMPLOYEES.length },
            ]}
          />
          {view === "runs" && (
            runRows.length === 0
              ? <Empty icon="payroll" title="No pay runs match" />
              : <DataTable rows={runRows} columns={runCols} onRowClick={(r) => setActiveRun(r)} />
          )}
          {view === "employees" && (
            empRows.length === 0
              ? <Empty icon="customers" title="No employees match" />
              : <DataTable rows={empRows} columns={empCols} onRowClick={(e) => setActiveEmp(e)} />
          )}
        </Section>
      </Page>

      <PayRunDrawer run={activeRun} onClose={() => setActiveRun(null)} />
      <EmployeeDrawer emp={activeEmp} onClose={() => setActiveEmp(null)} />
      <RunPayrollDrawer open={showRunPay} onClose={() => setShowRunPay(false)} />
      <NewEmployeeDrawer open={showNewEmp} onClose={() => setShowNewEmp(false)} />
    </>
  )
}

/* ─────────────────────────────  PAY RUN DRAWER  ───────────────────────────── */
function PayRunDrawer({ run, onClose }: { run: MockPayRun | null; onClose: () => void }) {
  if (!run) return <Drawer open={false} onClose={onClose} title="Pay Run">{null}</Drawer>
  const slips = MOCK_EMPLOYEES.filter(e => e.status === "active").slice(0, run.employees).map(buildPayslip)
  return (
    <Drawer
      open={!!run} onClose={onClose}
      title={run.code}
      subtitle={run.period}
      width={700}
      footer={
        run.status === "draft" ? (
          <>
            <Button variant="ghost" icon="trash">Discard</Button>
            <Button variant="outline" icon="check">Approve</Button>
            <Button icon="financials">Approve & Pay</Button>
          </>
        ) : run.status === "approved" ? (
          <>
            <Button variant="outline" icon="download">Export Bank File</Button>
            <Button icon="financials">Mark Paid</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" icon="print">Print Payslips</Button>
            <Button variant="outline" icon="download">SSNIT Filing</Button>
            <Button variant="outline" icon="download">PAYE Filing</Button>
          </>
        )
      }
    >
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Pill tone={RUN_TONE[run.status]} dot>{run.status}</Pill>
            <div style={{ fontSize: 32, fontWeight: 800, color: T.emerald, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {money(run.net)}
            </div>
            <div style={{ fontSize: 11, color: T.txD, marginTop: 4, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Total Net Pay</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.txM }}>Employees</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, marginTop: 2, fontFamily: "'Space Grotesk', sans-serif" }}>{run.employees}</div>
            {run.paidOn && <div style={{ fontSize: 11, color: T.txM, marginTop: 6 }}>Paid {dateShort(run.paidOn)}</div>}
          </div>
        </div>
      </Card>

      <Section title="Statutory Breakdown">
        <Card padding={20}>
          <RowKV label="Gross payroll" value={money(run.gross)} />
          <RowKV label="SSNIT Tier 1 (employer 13%)" value={money(run.ssnitTier1)} />
          <RowKV label="SSNIT Tier 2 (employer 5%)" value={money(run.ssnitTier2)} />
          <RowKV label="PAYE withheld" value={money(run.paye)} />
          <RowKV label="Net to bank" value={money(run.net)} bold last />
        </Card>
      </Section>

      <Section title="Payslips Preview">
        <Card padding={0}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.7fr 0.7fr 0.7fr 0.7fr", gap: 0, padding: "10px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 9, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
            <div>Employee</div>
            <div style={{ textAlign: "right" }}>Gross</div>
            <div style={{ textAlign: "right" }}>SSNIT 5.5%</div>
            <div style={{ textAlign: "right" }}>PAYE</div>
            <div style={{ textAlign: "right" }}>Net</div>
          </div>
          {slips.map((s, i) => (
            <div key={s.emp.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.7fr 0.7fr 0.7fr 0.7fr", gap: 0, padding: "12px 16px", borderBottom: i === slips.length - 1 ? "none" : `1px solid ${T.border}`, fontSize: 12 }}>
              <div>
                <div style={{ fontWeight: 600, color: T.tx }}>{s.emp.name}</div>
                <div style={{ fontSize: 10, color: T.txM, marginTop: 2 }}>{s.emp.staffNo}</div>
              </div>
              <div style={{ textAlign: "right", color: T.tx, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{money(s.gross, { compact: true })}</div>
              <div style={{ textAlign: "right", color: T.sky, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{money(s.ssnitEEE, { compact: true })}</div>
              <div style={{ textAlign: "right", color: T.amber, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{money(s.paye, { compact: true })}</div>
              <div style={{ textAlign: "right", color: T.emerald, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800 }}>{money(s.net, { compact: true })}</div>
            </div>
          ))}
        </Card>
      </Section>

      <Section title="Posting Journals">
        <Card padding={20}>
          <RowKV label="Salaries Expense" value={`Dr ${money(run.gross)}`} mono />
          <RowKV label="SSNIT Tier 1 Payable" value={`Cr ${money(run.ssnitTier1)}`} mono />
          <RowKV label="SSNIT Tier 2 Payable" value={`Cr ${money(run.ssnitTier2)}`} mono />
          <RowKV label="PAYE Payable" value={`Cr ${money(run.paye)}`} mono />
          <RowKV label="Bank — Salaries" value={`Cr ${money(run.net)}`} mono last />
        </Card>
      </Section>
    </Drawer>
  )
}

/* ─────────────────────────────  EMPLOYEE DRAWER  ───────────────────────────── */
function EmployeeDrawer({ emp, onClose }: { emp: MockEmployee | null; onClose: () => void }) {
  if (!emp) return <Drawer open={false} onClose={onClose} title="Employee">{null}</Drawer>
  const slip = buildPayslip(emp)
  return (
    <Drawer
      open={!!emp} onClose={onClose}
      title={emp.name}
      subtitle={`${emp.staffNo} · ${emp.role} · ${emp.branch}`}
      width={560}
      footer={
        <>
          <Button variant="ghost" icon="phone">Call</Button>
          <Button variant="outline" icon="print">Print Payslip</Button>
          <Button icon="edit">Edit</Button>
        </>
      }
    >
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Pill tone={EMP_TONE[emp.status]} dot>{emp.status.replace("_", " ")}</Pill>
            <div style={{ fontSize: 32, fontWeight: 800, color: T.emerald, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {money(slip.net)}
            </div>
            <div style={{ fontSize: 11, color: T.txD, marginTop: 4, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Estimated Net (Monthly)</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.txM }}>Joined</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, marginTop: 2 }}>{dateShort(emp.joined)}</div>
          </div>
        </div>
      </Card>

      <Section title="Compensation">
        <Card padding={20}>
          <RowKV label="Basic salary" value={money(emp.basic)} />
          <RowKV label="Allowances" value={money(emp.allowances)} />
          <RowKV label="Gross monthly" value={money(slip.gross)} bold />
          <div style={{ height: 1, background: T.border, margin: "10px 0" }} />
          <RowKV label="SSNIT (employee 5.5%)" value={`(${money(slip.ssnitEEE)})`} />
          <RowKV label="PAYE" value={`(${money(slip.paye)})`} />
          <RowKV label="Net pay" value={money(slip.net)} bold last />
        </Card>
      </Section>

      <Section title="Statutory IDs">
        <Card padding={20}>
          <RowKV label="SSNIT number" value={emp.ssnit} mono />
          <RowKV label="TIN" value={emp.tin} mono />
          <RowKV label="Bank account" value={emp.bankAccount} mono last />
        </Card>
      </Section>

      <Section title="Employer Contributions (You Pay)">
        <Card padding={20}>
          <RowKV label="SSNIT Tier 1 (13%)" value={money(slip.ssnitERT1)} />
          <RowKV label="SSNIT Tier 2 (5%)"  value={money(slip.ssnitERT2)} last />
        </Card>
      </Section>
    </Drawer>
  )
}

function RowKV({ label, value, mono = false, bold = false, last = false }: { label: string; value: React.ReactNode; mono?: boolean; bold?: boolean; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.txM }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 800 : 700, color: T.tx, fontFamily: mono ? "'DM Mono', monospace" : "'Space Grotesk', sans-serif" }}>{value}</span>
    </div>
  )
}

/* ─────────────────────────────  RUN PAYROLL DRAWER  ───────────────────────────── */
function RunPayrollDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [period, setPeriod] = useState("April 2026")
  return (
    <Drawer
      open={open} onClose={onClose}
      title="Run Payroll"
      subtitle="Generate payslips, calculate SSNIT and PAYE, post journals."
      width={460}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="payroll" onClick={onClose}>Generate Run</Button>
        </>
      }
    >
      <Field label="Period *">
        <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option>April 2026</option>
          <option>May 2026</option>
          <option>June 2026</option>
        </Select>
      </Field>

      <Card padding={16} style={{ marginTop: 8, background: `${T.amber}0A`, border: `1px dashed ${T.amber}40` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.amber, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>This run will</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: T.txM, lineHeight: 1.7 }}>
          <li>Snapshot every active employee's basic + allowances</li>
          <li>Compute SSNIT Tier 1 (employer 13%) and Tier 2 (employer 5%)</li>
          <li>Withhold employee SSNIT 5.5% from gross</li>
          <li>Apply PAYE bands (0/5/10/17.5/25/30/35) to taxable</li>
          <li>Stage journals — nothing posts until you tap <strong style={{ color: T.tx }}>Approve</strong></li>
        </ul>
      </Card>
    </Drawer>
  )
}

/* ─────────────────────────────  NEW EMPLOYEE DRAWER  ───────────────────────────── */
function NewEmployeeDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("")
  const [role, setRole] = useState("Cashier")
  const [branch, setBranch] = useState("Osu Main")
  const [basic, setBasic] = useState("")
  const [allow, setAllow] = useState("")
  const [ssnit, setSsnit] = useState("")
  const [tin, setTin] = useState("")
  return (
    <Drawer
      open={open} onClose={onClose}
      title="New Employee"
      subtitle="Add to the payroll register. Becomes part of the next pay run."
      width={500}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="check" onClick={onClose}>Add Employee</Button>
        </>
      }
    >
      <Field label="Full name *">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Akua Konadu" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Role *">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option>Branch Manager</option>
            <option>Senior Cashier</option>
            <option>Cashier</option>
            <option>Stockroom Lead</option>
            <option>Stockroom</option>
            <option>Driver</option>
          </Select>
        </Field>
        <Field label="Branch *">
          <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
            {MOCK_BRANCHES.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
          </Select>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Basic (GHS) *">
          <Input value={basic} onChange={(e) => setBasic(e.target.value)} placeholder="1800" />
        </Field>
        <Field label="Allowances (GHS)">
          <Input value={allow} onChange={(e) => setAllow(e.target.value)} placeholder="300" />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="SSNIT #">
          <Input value={ssnit} onChange={(e) => setSsnit(e.target.value.toUpperCase())} placeholder="C012345678" />
        </Field>
        <Field label="TIN">
          <Input value={tin} onChange={(e) => setTin(e.target.value.toUpperCase())} placeholder="P0001234567" />
        </Field>
      </div>
    </Drawer>
  )
}
