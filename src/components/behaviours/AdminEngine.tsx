"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Stat, Pill, Tabs, DataTable, Column, Drawer, SearchBar, Section, Button, T, Tone } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import type { MockTenant } from "@/lib/ops/mock"
import { money, dateShort } from "@/lib/ops/format"
import { useAuth } from "@/lib/use-auth"

type Accent = "amber" | "copper" | "sky" | "emerald"
type Mode = "billing" | "bookkeeping" | "nurse" | "accounting" | "shifts" | "payroll" | "reports" | "audit" | "roles" | "attendance" | "expenses" | "suppliers" | "po"

interface Props { accent: Accent; tenant: MockTenant; mode: Mode }

const AX: Record<Accent, string> = { amber: T.amber, copper: T.copper, sky: T.sky, emerald: T.emerald }
const glass: React.CSSProperties = { background: "rgba(8,20,16,0.55)", border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }
const inputStyle = (ax: string): React.CSSProperties => ({ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${ax}22`, color: T.tx, outline: "none", fontFamily: "'DM Sans', sans-serif" })

interface BillItem { id: string; patient: string; detail: string; items: string[]; total: number; status: "unpaid" | "partial" | "paid"; date: string; payMethod?: string }
interface VitalsEntry { id: string; patient: string; bed: string; hr: number; bp: string; temp: number; spo2: number; rr: number; gcs: number; mews: number; time: string }
interface AuditEvent { id: string; actor: string; action: string; target: string; detail: string; severity: "info" | "warning" | "critical"; timestamp: string }
interface ShiftRecord { id: string; operator: string; role: string; branch: string; openedAt: string; closedAt?: string; openFloat: number; closeCash?: number; variance?: number; status: "open" | "closed" }
interface Employee { id: string; name: string; role: string; baseSalary: number; ssnit: number; paye: number; netPay: number; status: "active" | "on_leave" }
interface Account { id: string; code: string; name: string; type: "asset" | "liability" | "equity" | "revenue" | "expense"; balance: number }
interface Expense { id: string; description: string; category: string; amount: number; submittedBy: string; date: string; status: "pending" | "approved" | "rejected" }
interface Supplier { id: string; name: string; contact: string; phone: string; category: string; balance: number; lastOrder: string }
interface PurchaseOrder { id: string; poNumber: string; supplier: string; items: number; total: number; status: "draft" | "sent" | "received" | "partial"; date: string }
interface AttendanceRow { id: string; name: string; status: "present" | "absent" | "late" | "excused"; time?: string; note?: string }
interface ReportTemplate { id: string; name: string; category: string; description: string; frequency: string }
interface RoleEntry { id: string; name: string; operators: number; permissions: string[] }

const DEMO_BILLS: BillItem[] = [
  { id: "b1", patient: "Kwame Asante", detail: "M, 34y · Malaria", items: ["Consultation GH₵80", "Malaria RDT GH₵25", "FBC GH₵35", "Artemether-Lumefantrine GH₵45", "Paracetamol GH₵8"], total: 193_00, status: "unpaid", date: "2026-04-19" },
  { id: "b2", patient: "Ama Mensah", detail: "F, 28y · UTI", items: ["Consultation GH₵80", "Urinalysis GH₵20", "Ciprofloxacin GH₵30"], total: 130_00, status: "paid", date: "2026-04-19", payMethod: "NHIS" },
  { id: "b3", patient: "Kofi Darkwa", detail: "M, 55y · Acute MI", items: ["Emergency Consult GH₵150", "Troponin I GH₵85", "ECG GH₵60", "CT Chest GH₵350", "ICU Day 1 GH₵500"], total: 1145_00, status: "partial", date: "2026-04-18" },
  { id: "b4", patient: "Nana Addo", detail: "M, 62y · DKA", items: ["Ward Day ×4 GH₵600", "Insulin GH₵120", "U&E GH₵45", "RBS ×4 GH₵40"], total: 805_00, status: "unpaid", date: "2026-04-15" },
  { id: "b5", patient: "Yaa Boateng", detail: "F, 24y · ANC", items: ["ANC Visit GH₵50", "FBC GH₵35", "Urinalysis GH₵20", "Ferrous Sulphate GH₵15"], total: 120_00, status: "paid", date: "2026-04-19", payMethod: "Cash" },
]

const DEMO_VITALS: VitalsEntry[] = [
  { id: "v1", patient: "Kwame Asante", bed: "W1-A", hr: 102, bp: "118/72", temp: 38.8, spo2: 97, rr: 20, gcs: 15, mews: 3, time: "09:00" },
  { id: "v2", patient: "Nana Addo", bed: "W1-C", hr: 78, bp: "142/88", temp: 36.9, spo2: 98, rr: 16, gcs: 15, mews: 1, time: "09:10" },
  { id: "v3", patient: "Abena Osei", bed: "W2-A", hr: 96, bp: "108/68", temp: 38.2, spo2: 93, rr: 24, gcs: 15, mews: 4, time: "09:15" },
  { id: "v4", patient: "Efua Appiah", bed: "W2-D", hr: 88, bp: "112/70", temp: 37.1, spo2: 99, rr: 18, gcs: 15, mews: 0, time: "09:20" },
  { id: "v5", patient: "Kojo Bonsu", bed: "W3-C", hr: 72, bp: "128/82", temp: 36.8, spo2: 98, rr: 16, gcs: 15, mews: 0, time: "09:25" },
]

const DEMO_AUDIT: AuditEvent[] = [
  { id: "a1", actor: "Dr. Mensah", action: "clinical.create", target: "Kwame Asante", detail: "SOAP notes created, diagnosis: P. falciparum malaria", severity: "info", timestamp: "2026-04-19 09:32" },
  { id: "a2", actor: "Front Desk", action: "queue.emergency", target: "Kofi Darkwa", detail: "Escalated to emergency, severity 8 → ER-KBH-003", severity: "warning", timestamp: "2026-04-19 09:05" },
  { id: "a3", actor: "Lab Tech", action: "lab.result.abnormal", target: "Nana Addo", detail: "HbA1c 7.8% (normal <5.6%)", severity: "warning", timestamp: "2026-04-19 08:45" },
  { id: "a4", actor: "System", action: "recurring.charge", target: "ICU-1 Kofi Darkwa", detail: "ICU daily charge GH₵500 applied", severity: "info", timestamp: "2026-04-19 00:01" },
  { id: "a5", actor: "Pharmacist", action: "dispense.complete", target: "Ama Mensah", detail: "Ciprofloxacin 500mg ×10 dispensed", severity: "info", timestamp: "2026-04-19 09:28" },
  { id: "a6", actor: "Admin", action: "operator.login_fail", target: "Unknown PIN", detail: "3 failed PIN attempts from Front Desk terminal", severity: "critical", timestamp: "2026-04-19 07:55" },
  { id: "a7", actor: "System", action: "stock.low", target: "Amoxicillin 500mg", detail: "Stock at 12 units (min: 50)", severity: "warning", timestamp: "2026-04-18 23:00" },
  { id: "a8", actor: "Billing", action: "payment.received", target: "Yaa Boateng", detail: "GH₵120 cash payment for ANC visit", severity: "info", timestamp: "2026-04-19 09:40" },
]

const DEMO_SHIFTS: ShiftRecord[] = [
  { id: "sh1", operator: "Kofi Mensah", role: "Cashier", branch: "Main", openedAt: "2026-04-19 07:00", status: "open", openFloat: 500_00 },
  { id: "sh2", operator: "Ama Darko", role: "Cashier", branch: "Main", openedAt: "2026-04-18 07:00", closedAt: "2026-04-18 19:00", status: "closed", openFloat: 500_00, closeCash: 4850_00, variance: -50_00 },
  { id: "sh3", operator: "Kweku Pratt", role: "Manager", branch: "Branch 2", openedAt: "2026-04-18 08:00", closedAt: "2026-04-18 18:00", status: "closed", openFloat: 300_00, closeCash: 2280_00, variance: 0 },
]

const DEMO_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Kofi Mensah", role: "Cashier", baseSalary: 2500_00, ssnit: 137_50, paye: 0, netPay: 2362_50, status: "active" },
  { id: "e2", name: "Ama Darko", role: "Cashier", baseSalary: 2500_00, ssnit: 137_50, paye: 0, netPay: 2362_50, status: "active" },
  { id: "e3", name: "Kweku Pratt", role: "Manager", baseSalary: 5000_00, ssnit: 275_00, paye: 198_75, netPay: 4526_25, status: "active" },
  { id: "e4", name: "Nana Addo", role: "Stock Clerk", baseSalary: 2200_00, ssnit: 121_00, paye: 0, netPay: 2079_00, status: "on_leave" },
  { id: "e5", name: "Efua Appiah", role: "Sales Associate", baseSalary: 2800_00, ssnit: 154_00, paye: 0, netPay: 2646_00, status: "active" },
]

const DEMO_ACCOUNTS: Account[] = [
  { id: "a1", code: "1000", name: "Cash on Hand", type: "asset", balance: 12500_00 },
  { id: "a2", code: "1100", name: "Bank — GCB", type: "asset", balance: 85000_00 },
  { id: "a3", code: "1200", name: "Accounts Receivable", type: "asset", balance: 15800_00 },
  { id: "a4", code: "1300", name: "Inventory", type: "asset", balance: 42000_00 },
  { id: "a5", code: "2000", name: "Accounts Payable", type: "liability", balance: 18500_00 },
  { id: "a6", code: "2100", name: "VAT Payable", type: "liability", balance: 4200_00 },
  { id: "a7", code: "3000", name: "Owner Equity", type: "equity", balance: 100000_00 },
  { id: "a8", code: "4000", name: "Sales Revenue", type: "revenue", balance: 68000_00 },
  { id: "a9", code: "4100", name: "Service Revenue", type: "revenue", balance: 12000_00 },
  { id: "a10", code: "5000", name: "Cost of Goods Sold", type: "expense", balance: 32000_00 },
  { id: "a11", code: "5100", name: "Salaries & Wages", type: "expense", balance: 15000_00 },
  { id: "a12", code: "5200", name: "Rent", type: "expense", balance: 5000_00 },
  { id: "a13", code: "5300", name: "Utilities", type: "expense", balance: 2800_00 },
]

const DEMO_EXPENSES: Expense[] = [
  { id: "ex1", description: "Office supplies — printer toner", category: "Office", amount: 350_00, submittedBy: "Ama Darko", date: "2026-04-18", status: "approved" },
  { id: "ex2", description: "Generator diesel — 50L", category: "Utilities", amount: 850_00, submittedBy: "Kweku Pratt", date: "2026-04-17", status: "approved" },
  { id: "ex3", description: "Staff lunch — team meeting", category: "Meals", amount: 420_00, submittedBy: "Kofi Mensah", date: "2026-04-19", status: "pending" },
  { id: "ex4", description: "Delivery van fuel", category: "Transport", amount: 280_00, submittedBy: "Nana Addo", date: "2026-04-16", status: "rejected" },
]

const DEMO_SUPPLIERS: Supplier[] = [
  { id: "sp1", name: "Accra Wholesale Ltd", contact: "Kwame Owusu", phone: "024 555 1234", category: "General", balance: 8500_00, lastOrder: "2026-04-15" },
  { id: "sp2", name: "Tema Pharmaceuticals", contact: "Esi Mensah", phone: "020 888 5678", category: "Pharma", balance: 0, lastOrder: "2026-04-10" },
  { id: "sp3", name: "Kasoa Building Materials", contact: "Kofi Asante", phone: "027 333 9012", category: "Hardware", balance: 3200_00, lastOrder: "2026-04-12" },
  { id: "sp4", name: "Kumasi Textiles", contact: "Ama Boateng", phone: "024 777 3456", category: "Textiles", balance: 1800_00, lastOrder: "2026-03-28" },
]

const DEMO_POS_ORDERS: PurchaseOrder[] = [
  { id: "po1", poNumber: "PO-2026-041", supplier: "Accra Wholesale Ltd", items: 12, total: 8500_00, status: "sent", date: "2026-04-15" },
  { id: "po2", poNumber: "PO-2026-042", supplier: "Tema Pharmaceuticals", items: 8, total: 4200_00, status: "received", date: "2026-04-10" },
  { id: "po3", poNumber: "PO-2026-043", supplier: "Kasoa Building Materials", items: 5, total: 3200_00, status: "partial", date: "2026-04-12" },
  { id: "po4", poNumber: "PO-2026-044", supplier: "Kumasi Textiles", items: 3, total: 1800_00, status: "draft", date: "2026-04-19" },
]

const DEMO_ATTENDANCE: AttendanceRow[] = [
  { id: "at1", name: "Kwame Asante Jr.", status: "present", time: "07:55" },
  { id: "at2", name: "Ama Mensah", status: "present", time: "07:50" },
  { id: "at3", name: "Kofi Darkwa", status: "late", time: "08:15", note: "Traffic" },
  { id: "at4", name: "Yaa Boateng", status: "absent", note: "Sick — parent called" },
  { id: "at5", name: "Kweku Pratt Jr.", status: "present", time: "07:48" },
  { id: "at6", name: "Abena Osei", status: "excused", note: "School event" },
  { id: "at7", name: "Efua Appiah", status: "present", time: "07:52" },
  { id: "at8", name: "Kojo Bonsu", status: "present", time: "07:58" },
]

const DEMO_REPORTS: ReportTemplate[] = [
  { id: "rp1", name: "Daily Sales Summary", category: "Sales", description: "Total sales, payment methods, top items", frequency: "Daily" },
  { id: "rp2", name: "Till Report", category: "Cash", description: "Cash in vs cash out per shift", frequency: "Per Shift" },
  { id: "rp3", name: "Inventory Aging", category: "Stock", description: "Stock age, slow movers, expiry alerts", frequency: "Weekly" },
  { id: "rp4", name: "Tax Report (VAT-3)", category: "Tax", description: "VAT, NHIL, GETFund, COVID levy summary", frequency: "Monthly" },
  { id: "rp5", name: "Profit & Loss", category: "Finance", description: "Revenue, COGS, expenses, net profit", frequency: "Monthly" },
  { id: "rp6", name: "Outstanding Debtors", category: "AR", description: "Aging buckets: 0-30, 30-60, 60-90, 90+", frequency: "Weekly" },
  { id: "rp7", name: "Payroll Summary", category: "HR", description: "Gross, SSNIT, PAYE, net per employee", frequency: "Monthly" },
  { id: "rp8", name: "Stock Movement", category: "Stock", description: "Receives, sales, adjustments, transfers", frequency: "Daily" },
]

const DEMO_ROLES: RoleEntry[] = [
  { id: "rl1", name: "Cashier", operators: 3, permissions: ["pos.sell", "pos.refund", "stock.view", "contacts.view"] },
  { id: "rl2", name: "Manager", operators: 2, permissions: ["pos.sell", "pos.refund", "pos.void", "stock.view", "stock.receive", "stock.adjust", "contacts.view", "contacts.edit", "reports.view", "shifts.close"] },
  { id: "rl3", name: "Admin", operators: 1, permissions: ["all"] },
  { id: "rl4", name: "Stock Clerk", operators: 1, permissions: ["stock.view", "stock.receive", "stock.adjust", "stock.transfer"] },
]

function billTone(s: string): Tone { return s === "paid" ? "emerald" : s === "partial" ? "amber" : "red" }
function attTone(s: string): Tone { return s === "present" ? "emerald" : s === "late" ? "amber" : s === "absent" ? "red" : "sky" }
function mewsColor(m: number) { return m >= 5 ? T.red : m >= 3 ? T.amber : T.emerald }
function poTone(s: string): Tone { return s === "received" ? "emerald" : s === "sent" ? "sky" : s === "partial" ? "amber" : "neutral" }
function expTone(s: string): Tone { return s === "approved" ? "emerald" : s === "pending" ? "amber" : "red" }
function acctColor(t: string) { return t === "asset" ? T.emerald : t === "liability" ? T.red : t === "equity" ? T.sky : t === "revenue" ? T.emerald : T.amber }

export function AdminEngine({ accent, tenant, mode }: Props) {
  const ax = AX[accent]
  if (mode === "billing") return <BillingView ax={ax} accent={accent} />
  if (mode === "bookkeeping") return <BookkeepingView ax={ax} accent={accent} />
  if (mode === "nurse") return <NurseView ax={ax} accent={accent} />
  if (mode === "accounting") return <AccountingView ax={ax} accent={accent} />
  if (mode === "shifts") return <ShiftsView ax={ax} accent={accent} />
  if (mode === "payroll") return <PayrollView ax={ax} accent={accent} />
  if (mode === "reports") return <ReportsView ax={ax} accent={accent} />
  if (mode === "audit") return <AuditView ax={ax} accent={accent} />
  if (mode === "roles") return <RolesView ax={ax} accent={accent} />
  if (mode === "attendance") return <AttendanceView ax={ax} accent={accent} />
  if (mode === "expenses") return <ExpensesView ax={ax} accent={accent} />
  if (mode === "suppliers") return <SuppliersView ax={ax} accent={accent} />
  if (mode === "po") return <POView ax={ax} accent={accent} />
  return <AuditView ax={ax} accent={accent} />
}

function BillingView({ ax, accent }: { ax: string; accent: Accent }) {
  const [tab, setTab] = useState<"outstanding" | "paid" | "all">("outstanding")
  const [selected, setSelected] = useState<BillItem | null>(null)
  const [bills, setBills] = useState<BillItem[]>(DEMO_BILLS)
  const [payMethod, setPayMethod] = useState<string | null>(null)
  const unpaid = bills.filter(b => b.status !== "paid")
  const paid = bills.filter(b => b.status === "paid")
  const totalOwed = unpaid.reduce((s, b) => s + b.total, 0)
  const totalPaid = paid.reduce((s, b) => s + b.total, 0)
  const filtered = tab === "outstanding" ? unpaid : tab === "paid" ? paid : bills

  function collectPayment() { if (selected && payMethod) { setBills(prev => prev.map(b => b.id === selected.id ? { ...b, status: "paid" as const, payMethod } : b)); setSelected(null); setPayMethod(null) } }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Outstanding" value={money(totalOwed)} icon="alert" accent="amber" />
        <Stat label="Collected Today" value={money(totalPaid)} icon="check" accent="emerald" />
        <Stat label="Bills Today" value={DEMO_BILLS.length} icon="trending" accent={accent} />
        <Stat label="Unpaid" value={unpaid.length} icon="clock" accent="amber" />
      </div>
      <Tabs tabs={[{ key: "outstanding" as const, label: "Outstanding", count: unpaid.length }, { key: "paid" as const, label: "Paid", count: paid.length }, { key: "all" as const, label: "All", count: bills.length }]} value={tab} onChange={setTab} />
      <DataTable rows={filtered} columns={[
        { key: "patient", label: "Patient", render: r => <div><div style={{ fontWeight: 600 }}>{r.patient}</div><div style={{ fontSize: 11, color: T.txM }}>{r.detail}</div></div> },
        { key: "items", label: "Items", width: 60, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.items.length}</span> },
        { key: "total", label: "Total", width: 120, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700 }}>{money(r.total)}</span> },
        { key: "status", label: "Status", width: 100, render: r => <Pill tone={billTone(r.status)} dot>{r.status}</Pill> },
        { key: "date", label: "Date", width: 100, render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.date}</span> },
      ] as Column<BillItem>[]} onRowClick={r => setSelected(r)} empty="No bills." />
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.patient ?? ""} subtitle="Bill" width={520}
        footer={<>{selected?.status !== "paid" && <><Button variant="outline" icon="check" onClick={collectPayment} disabled={!payMethod}>Collect Payment</Button><Button variant="ghost" icon="clock" onClick={() => setSelected(null)}>Send Reminder</Button></>}</>}>
        {selected && (<>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}><Pill tone={billTone(selected.status)} dot>{selected.status}</Pill></div>
          <Section title="Line Items">{selected.items.map((item, i) => <div key={i} style={{ padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13, color: T.tx }}>{item}</div>)}</Section>
          <Section title="Total"><div style={{ fontSize: 28, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{money(selected.total)}</div></Section>
          {selected.status !== "paid" && (
            <Section title="Payment Method">
              <div style={{ display: "flex", gap: 8 }}>
                {["Cash", "MoMo", "NHIS", "Insurance", "Card"].map(m => <button key={m} onClick={() => setPayMethod(m)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: payMethod === m ? `${ax}20` : `${ax}08`, color: payMethod === m ? ax : T.tx, border: `1px solid ${payMethod === m ? ax : T.border}`, cursor: "pointer" }}>{m}</button>)}
              </div>
            </Section>
          )}
        </>)}
      </Drawer>
    </>
  )
}

function NurseView({ ax, accent }: { ax: string; accent: Accent }) {
  const [selected, setSelected] = useState<VitalsEntry | null>(null)
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Patients" value={DEMO_VITALS.length} icon="user" accent={accent} />
        <Stat label="MEWS ≥ 3" value={DEMO_VITALS.filter(v => v.mews >= 3).length} icon="alert" accent="amber" />
        <Stat label="Vitals Due" value={2} icon="clock" accent="amber" />
        <Stat label="Tasks Pending" value={5} icon="trending" accent="sky" />
      </div>
      <DataTable rows={DEMO_VITALS} columns={[
        { key: "bed", label: "Bed", width: 80, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: ax }}>{r.bed}</span> },
        { key: "patient", label: "Patient", render: r => <span style={{ fontWeight: 600, fontSize: 13 }}>{r.patient}</span> },
        { key: "hr", label: "HR", width: 60, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.hr}</span> },
        { key: "bp", label: "BP", width: 80, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.bp}</span> },
        { key: "temp", label: "Temp", width: 60, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: r.temp >= 38 ? T.red : T.tx }}>{r.temp}°</span> },
        { key: "spo2", label: "SpO2", width: 60, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: r.spo2 < 95 ? T.red : T.tx }}>{r.spo2}%</span> },
        { key: "mews", label: "MEWS", width: 70, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: mewsColor(r.mews) }}>{r.mews}</span> },
        { key: "time", label: "Taken", width: 70, render: r => <span style={{ fontSize: 11, color: T.txM }}>{r.time}</span> },
      ] as Column<VitalsEntry>[]} onRowClick={r => setSelected(r)} empty="No vitals recorded." />
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.patient ?? ""} subtitle={selected?.bed} width={560}
        footer={<Button variant="outline" icon="check" onClick={() => setSelected(null)}>Record New Vitals</Button>}>
        {selected && (<>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
            {[{ l: "HR", v: `${selected.hr} bpm` }, { l: "BP", v: selected.bp }, { l: "Temp", v: `${selected.temp}°C` }, { l: "SpO2", v: `${selected.spo2}%` }, { l: "RR", v: `${selected.rr}/min` }, { l: "GCS", v: `${selected.gcs}/15` }].map(m => (
              <div key={m.l} style={{ padding: 14, borderRadius: 12, background: `${ax}06`, border: `1px solid ${T.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{m.l}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{m.v}</div>
              </div>
            ))}
          </div>
          <Section title="MEWS Score">
            <div style={{ fontSize: 36, fontWeight: 900, color: mewsColor(selected.mews), fontFamily: "'Space Grotesk', sans-serif" }}>{selected.mews}<span style={{ fontSize: 14, color: T.txM, fontWeight: 400 }}> / 14</span></div>
            <div style={{ fontSize: 12, color: T.txM, marginTop: 4 }}>{selected.mews >= 5 ? "Immediate medical review required" : selected.mews >= 3 ? "Increase monitoring frequency" : "Continue routine monitoring"}</div>
          </Section>
        </>)}
      </Drawer>
    </>
  )
}

function BookkeepingView({ ax, accent }: { ax: string; accent: Accent }) {
  const [tab, setTab] = useState<"bills" | "audit">("bills")
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Total Billed" value={money(DEMO_BILLS.reduce((s, b) => s + b.total, 0))} icon="trending" accent={accent} />
        <Stat label="Paid" value={DEMO_BILLS.filter(b => b.status === "paid").length} icon="check" accent="emerald" />
        <Stat label="Unpaid" value={DEMO_BILLS.filter(b => b.status !== "paid").length} icon="alert" accent="amber" />
        <Stat label="Events" value={DEMO_AUDIT.length} icon="clock" accent="sky" />
      </div>
      <Tabs tabs={[{ key: "bills" as const, label: "Patient Bills", count: DEMO_BILLS.length }, { key: "audit" as const, label: "Activity Log", count: DEMO_AUDIT.length }]} value={tab} onChange={setTab} />
      {tab === "bills" && <DataTable rows={DEMO_BILLS} columns={[
        { key: "patient", label: "Patient", render: r => <div><div style={{ fontWeight: 600 }}>{r.patient}</div><div style={{ fontSize: 11, color: T.txM }}>{r.detail}</div></div> },
        { key: "total", label: "Total", width: 120, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700 }}>{money(r.total)}</span> },
        { key: "status", label: "Status", width: 100, render: r => <Pill tone={billTone(r.status)} dot>{r.status}</Pill> },
      ] as Column<BillItem>[]} empty="No records." />}
      {tab === "audit" && <DataTable rows={DEMO_AUDIT} columns={[
        { key: "timestamp", label: "Time", width: 140, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.txM }}>{r.timestamp}</span> },
        { key: "actor", label: "Actor", width: 120, render: r => <span style={{ fontWeight: 600, fontSize: 12 }}>{r.actor}</span> },
        { key: "action", label: "Action", width: 160, render: r => <span style={{ fontSize: 12, color: ax }}>{r.action}</span> },
        { key: "detail", label: "Detail", render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.detail}</span> },
      ] as Column<AuditEvent>[]} empty="No events." />}
    </>
  )
}

function AccountingView({ ax, accent }: { ax: string; accent: Accent }) {
  const [tab, setTab] = useState<"coa" | "gl">("coa")
  const assets = DEMO_ACCOUNTS.filter(a => a.type === "asset").reduce((s, a) => s + a.balance, 0)
  const revenue = DEMO_ACCOUNTS.filter(a => a.type === "revenue").reduce((s, a) => s + a.balance, 0)
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Total Assets" value={money(assets)} icon="trending" accent="emerald" />
        <Stat label="Revenue" value={money(revenue)} icon="check" accent={accent} />
        <Stat label="Accounts" value={DEMO_ACCOUNTS.length} icon="tenants" />
        <Stat label="Journal Entries" value={24} icon="clock" accent="sky" />
      </div>
      <Tabs tabs={[{ key: "coa" as const, label: "Chart of Accounts", count: DEMO_ACCOUNTS.length }, { key: "gl" as const, label: "General Ledger" }]} value={tab} onChange={setTab} />
      {tab === "coa" && <DataTable rows={DEMO_ACCOUNTS} columns={[
        { key: "code", label: "Code", width: 80, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: ax }}>{r.code}</span> },
        { key: "name", label: "Account", render: r => <span style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</span> },
        { key: "type", label: "Type", width: 100, render: r => <Pill tone={r.type === "asset" ? "emerald" : r.type === "liability" ? "red" : r.type === "revenue" ? "emerald" : r.type === "expense" ? "amber" : "sky"}>{r.type}</Pill> },
        { key: "balance", label: "Balance", width: 130, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: acctColor(r.type) }}>{money(r.balance)}</span> },
      ] as Column<Account>[]} empty="No accounts." />}
      {tab === "gl" && (
        <div style={{ ...glass, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 14, color: T.txM }}>Journal entry form — select account, debit/credit, amount, narration</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr", gap: 10, marginTop: 16 }}>
            <select style={inputStyle(ax)}><option>Select Account</option>{DEMO_ACCOUNTS.map(a => <option key={a.code}>{a.code} — {a.name}</option>)}</select>
            <select style={inputStyle(ax)}><option>Debit</option><option>Credit</option></select>
            <input style={inputStyle(ax)} placeholder="Amount" type="number" />
            <input style={inputStyle(ax)} placeholder="Narration" />
          </div>
          <div style={{ marginTop: 12 }}><Button variant="outline" icon="check" onClick={() => { setTab("coa") }}>Post Entry</Button></div>
        </div>
      )}
    </>
  )
}

function ShiftsView({ ax, accent }: { ax: string; accent: Accent }) {
  const { authFetch, session } = useAuth()
  const [shifts, setShifts] = useState<ShiftRecord[]>(DEMO_SHIFTS)

  useEffect(() => {
    if (!session) return
    authFetch("/api/trade/shifts").then(r => r.json()).then(json => {
      if (json.success && Array.isArray(json.data)) {
        const mapped: ShiftRecord[] = json.data.map((s: Record<string, unknown>) => ({
          id: s.id as string, operator: (s.operatorName as string) ?? "", role: "", branch: s.branchId as string,
          openedAt: s.startedAt ? new Date(s.startedAt as string).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "",
          closedAt: s.endedAt ? new Date(s.endedAt as string).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : undefined,
          openFloat: (s.openingCash as number) ?? 0, closeCash: s.closingCash as number | undefined,
          variance: s.closingCash != null ? ((s.closingCash as number) - ((s.openingCash as number) + (s.salesTotal as number) - (s.returnsTotal as number))) : undefined,
          status: (s.status as string) === "active" ? "open" : "closed",
        }))
        if (mapped.length > 0) setShifts(mapped)
      }
    }).catch(() => {})
  }, [session, authFetch])

  const open = shifts.filter(s => s.status === "open")
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Open Shifts" value={open.length} icon="clock" accent="emerald" />
        <Stat label="Closed Today" value={shifts.filter(s => s.status === "closed").length} icon="check" accent={accent} />
        <Stat label="Variance" value={money(Math.abs(shifts.filter(s => s.variance).reduce((s, r) => s + (r.variance ?? 0), 0)))} icon="alert" accent="amber" />
        <Stat label="Total Cash" value={money(shifts.reduce((s, r) => s + (r.closeCash ?? r.openFloat), 0))} icon="trending" />
      </div>
      {open.length > 0 && open.map(s => (
        <div key={s.id} style={{ ...glass, marginBottom: 16, border: `1px solid ${T.emerald}30` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontWeight: 700, fontSize: 16, color: T.tx }}>{s.operator}</div><div style={{ fontSize: 12, color: T.txM }}>{s.role} · {s.branch} · Opened {s.openedAt}</div></div>
            <div style={{ display: "flex", gap: 8 }}><Pill tone="emerald" dot>Active</Pill><Button variant="outline" icon="lock" onClick={() => setShifts(prev => prev.map(sh => sh.id === s.id ? { ...sh, status: "closed" as const, closedAt: new Date().toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }), closeCash: s.openFloat, variance: 0 } : sh))}>Close Shift</Button></div>
          </div>
        </div>
      ))}
      <DataTable rows={shifts} columns={[
        { key: "operator", label: "Operator", render: r => <div><div style={{ fontWeight: 600 }}>{r.operator}</div><div style={{ fontSize: 11, color: T.txM }}>{r.role} · {r.branch}</div></div> },
        { key: "openedAt", label: "Opened", width: 160, render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.openedAt}</span> },
        { key: "closedAt", label: "Closed", width: 160, render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.closedAt ?? "---"}</span> },
        { key: "closeCash", label: "Cash", width: 110, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.closeCash ? money(r.closeCash) : "---"}</span> },
        { key: "variance", label: "Variance", width: 100, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: r.variance && r.variance !== 0 ? T.red : T.emerald }}>{r.variance !== undefined ? money(r.variance) : "---"}</span> },
        { key: "status", label: "Status", width: 90, render: r => <Pill tone={r.status === "open" ? "emerald" : "neutral"} dot>{r.status}</Pill> },
      ] as Column<ShiftRecord>[]} empty="No shifts." />
    </>
  )
}

function PayrollView({ ax, accent }: { ax: string; accent: Accent }) {
  const { authFetch, session } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>(DEMO_EMPLOYEES)

  useEffect(() => {
    if (!session) return
    authFetch("/api/payroll/employees").then(r => r.json()).then(json => {
      if (json.success && Array.isArray(json.data)) {
        const mapped: Employee[] = json.data.map((e: Record<string, unknown>) => ({
          id: e.id as string, name: (e.employeeCode as string) ?? "", role: (e.position as string) ?? "",
          baseSalary: (e.baseSalary as number) ?? 0, ssnit: Math.round(((e.baseSalary as number) ?? 0) * 0.055),
          paye: 0, netPay: (e.baseSalary as number) ?? 0, status: (e.status as string) === "active" ? "active" : "on_leave",
        }))
        if (mapped.length > 0) setEmployees(mapped)
      }
    }).catch(() => {})
  }, [session, authFetch])

  const totalGross = employees.reduce((s, e) => s + e.baseSalary, 0)
  const totalNet = employees.reduce((s, e) => s + e.netPay, 0)
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Employees" value={employees.length} icon="user" accent={accent} />
        <Stat label="Gross Payroll" value={money(totalGross)} icon="trending" accent="amber" />
        <Stat label="Net Payroll" value={money(totalNet)} icon="check" accent="emerald" />
        <Stat label="On Leave" value={employees.filter(e => e.status === "on_leave").length} icon="clock" accent="sky" />
      </div>
      <DataTable rows={employees} columns={[
        { key: "name", label: "Employee", render: r => <div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: T.txM }}>{r.role}</div></div> },
        { key: "baseSalary", label: "Base", width: 110, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{money(r.baseSalary)}</span> },
        { key: "ssnit", label: "SSNIT", width: 90, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.red }}>{money(r.ssnit)}</span> },
        { key: "paye", label: "PAYE", width: 90, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.red }}>{money(r.paye)}</span> },
        { key: "netPay", label: "Net Pay", width: 110, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: T.emerald }}>{money(r.netPay)}</span> },
        { key: "status", label: "Status", width: 90, render: r => <Pill tone={r.status === "active" ? "emerald" : "amber"} dot>{r.status.replace("_", " ")}</Pill> },
      ] as Column<Employee>[]} empty="No employees." />
    </>
  )
}

function ReportsView({ ax, accent }: { ax: string; accent: Accent }) {
  const [generated, setGenerated] = useState<string | null>(null)
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Templates" value={DEMO_REPORTS.length} icon="trending" accent={accent} />
        <Stat label="Daily" value={DEMO_REPORTS.filter(r => r.frequency === "Daily").length} icon="clock" />
        <Stat label="Weekly" value={DEMO_REPORTS.filter(r => r.frequency === "Weekly").length} icon="clock" accent="sky" />
        <Stat label="Monthly" value={DEMO_REPORTS.filter(r => r.frequency === "Monthly").length} icon="clock" accent="amber" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {DEMO_REPORTS.map(r => (
          <div key={r.id} style={{ ...glass, cursor: "pointer", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: T.tx }}>{r.name}</span>
              <Pill tone="neutral">{r.frequency}</Pill>
            </div>
            <div style={{ fontSize: 12, color: T.txM, marginBottom: 12 }}>{r.description}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" icon="trending" onClick={() => { setGenerated(r.id); setTimeout(() => setGenerated(null), 2000) }}>{generated === r.id ? "Generated" : "Generate"}</Button>
              <Button variant="ghost" icon="check" onClick={() => { setGenerated(r.id); setTimeout(() => setGenerated(null), 2000) }}>{generated === r.id ? "Exported" : "Export CSV"}</Button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function AuditView({ ax, accent }: { ax: string; accent: Accent }) {
  const { authFetch, session } = useAuth()
  const [search, setSearch] = useState("")
  const [auditData, setAuditData] = useState<AuditEvent[]>(DEMO_AUDIT)

  useEffect(() => {
    if (!session) return
    authFetch("/api/audit").then(r => r.json()).then(json => {
      if (json.success && json.data?.logs) {
        const mapped: AuditEvent[] = json.data.logs.map((l: Record<string, unknown>) => ({
          id: l.id as string, actor: (l.actorName as string) ?? "", action: (l.action as string) ?? "",
          target: (l.entity as string) ?? "", detail: JSON.stringify(l.after ?? l.before ?? ""),
          severity: ((l.action as string)?.includes("fail") || (l.action as string)?.includes("delete")) ? "critical" : (l.action as string)?.includes("abnormal") || (l.action as string)?.includes("emergency") ? "warning" : "info",
          timestamp: l.timestamp ? new Date(l.timestamp as string).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "",
        }))
        if (mapped.length > 0) setAuditData(mapped)
      }
    }).catch(() => {})
  }, [session, authFetch])

  const filtered = useMemo(() => {
    if (!search) return auditData
    const q = search.toLowerCase()
    return auditData.filter(e => e.actor.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q))
  }, [search, auditData])
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Total Events" value={auditData.length} icon="trending" accent={accent} />
        <Stat label="Warnings" value={auditData.filter(e => e.severity === "warning").length} icon="alert" accent="amber" />
        <Stat label="Critical" value={auditData.filter(e => e.severity === "critical").length} icon="alert" accent="amber" />
        <Stat label="Info" value={auditData.filter(e => e.severity === "info").length} icon="check" accent="emerald" />
      </div>
      <div style={{ marginBottom: 16 }}><SearchBar value={search} onChange={setSearch} placeholder="Search audit log..." /></div>
      <DataTable rows={filtered} columns={[
        { key: "timestamp", label: "Time", width: 140, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.txM }}>{r.timestamp}</span> },
        { key: "severity", label: "Sev", width: 80, render: r => <Pill tone={r.severity === "critical" ? "red" : r.severity === "warning" ? "amber" : "emerald"}>{r.severity}</Pill> },
        { key: "actor", label: "Actor", width: 120, render: r => <span style={{ fontWeight: 600, fontSize: 12 }}>{r.actor}</span> },
        { key: "action", label: "Action", width: 180, render: r => <span style={{ fontSize: 12, color: ax, fontFamily: "'DM Mono', monospace" }}>{r.action}</span> },
        { key: "target", label: "Target", width: 140, render: r => <span style={{ fontSize: 12, color: T.tx }}>{r.target}</span> },
        { key: "detail", label: "Detail", render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.detail}</span> },
      ] as Column<AuditEvent>[]} empty="No events." />
    </>
  )
}

function RolesView({ ax, accent }: { ax: string; accent: Accent }) {
  const { authFetch, session } = useAuth()
  const [roles, setRoles] = useState<RoleEntry[]>(DEMO_ROLES)
  const [selected, setSelected] = useState<RoleEntry | null>(null)

  useEffect(() => {
    if (!session) return
    authFetch("/api/roles").then(r => r.json()).then(json => {
      if (json.success && json.data?.roles) {
        const mapped: RoleEntry[] = json.data.roles.map((r: Record<string, unknown>, i: number) => ({
          id: `r${i}`, name: (r.role as string) ?? "", operators: (r.count as number) ?? 0,
          permissions: (r.permissions as string[]) ?? [],
        }))
        if (mapped.length > 0) setRoles(mapped)
      }
    }).catch(() => {})
  }, [session, authFetch])

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Roles" value={roles.length} icon="user" accent={accent} />
        <Stat label="Operators" value={roles.reduce((s, r) => s + r.operators, 0)} icon="user" accent="sky" />
        <Stat label="Permissions" value={roles.reduce((s, r) => s + r.permissions.length, 0)} icon="lock" accent="amber" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {roles.map(r => (
          <div key={r.id} onClick={() => setSelected(r)} style={{ ...glass, cursor: "pointer" }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: T.tx, marginBottom: 4 }}>{r.name}</div>
            <div style={{ fontSize: 12, color: T.txM, marginBottom: 12 }}>{r.operators} operators · {r.permissions.length} permissions</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {r.permissions.slice(0, 4).map(p => <span key={p} style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, background: `${ax}10`, color: ax, border: `1px solid ${ax}22` }}>{p}</span>)}
              {r.permissions.length > 4 && <span style={{ fontSize: 10, color: T.txD }}>+{r.permissions.length - 4} more</span>}
            </div>
          </div>
        ))}
      </div>
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""} subtitle="Role" width={480}
        footer={<Button variant="outline" icon="check" onClick={() => setSelected(null)}>Save Changes</Button>}>
        {selected && (
          <Section title="Permissions">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {selected.permissions.map(p => (
                <label key={p} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: T.tx, cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked /> {p}
                </label>
              ))}
            </div>
          </Section>
        )}
      </Drawer>
    </>
  )
}

function AttendanceView({ ax, accent }: { ax: string; accent: Accent }) {
  const present = DEMO_ATTENDANCE.filter(a => a.status === "present")
  const absent = DEMO_ATTENDANCE.filter(a => a.status === "absent")
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Total" value={DEMO_ATTENDANCE.length} icon="user" accent={accent} />
        <Stat label="Present" value={present.length} icon="check" accent="emerald" />
        <Stat label="Absent" value={absent.length} icon="alert" accent="amber" />
        <Stat label="Late" value={DEMO_ATTENDANCE.filter(a => a.status === "late").length} icon="clock" accent="amber" />
      </div>
      <DataTable rows={DEMO_ATTENDANCE} columns={[
        { key: "name", label: "Student", render: r => <span style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</span> },
        { key: "status", label: "Status", width: 100, render: r => <Pill tone={attTone(r.status)} dot>{r.status}</Pill> },
        { key: "time", label: "Time", width: 80, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.txM }}>{r.time ?? "---"}</span> },
        { key: "note", label: "Note", render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.note ?? ""}</span> },
      ] as Column<AttendanceRow>[]} empty="No attendance records." />
    </>
  )
}

function ExpensesView({ ax, accent }: { ax: string; accent: Accent }) {
  const { authFetch, session } = useAuth()
  const [selected, setSelected] = useState<Expense | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>(DEMO_EXPENSES)

  useEffect(() => {
    if (!session) return
    authFetch("/api/trade/expenses").then(r => r.json()).then(json => {
      if (json.success && Array.isArray(json.data)) {
        const mapped: Expense[] = json.data.map((e: Record<string, unknown>) => ({
          id: e.id as string, description: (e.description as string) ?? "", category: (e.category as string) ?? "",
          amount: (e.amount as number) ?? 0, submittedBy: (e.vendor as string) ?? "",
          date: e.date ? new Date(e.date as string).toISOString().slice(0, 10) : "",
          status: e.approvedBy ? "approved" : "pending",
        }))
        if (mapped.length > 0) setExpenses(mapped)
      }
    }).catch(() => {})
  }, [session, authFetch])

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Total" value={money(total)} icon="trending" accent={accent} />
        <Stat label="Pending" value={expenses.filter(e => e.status === "pending").length} icon="clock" accent="amber" />
        <Stat label="Approved" value={expenses.filter(e => e.status === "approved").length} icon="check" accent="emerald" />
        <Stat label="Rejected" value={expenses.filter(e => e.status === "rejected").length} icon="alert" accent="amber" />
      </div>
      <DataTable rows={expenses} columns={[
        { key: "description", label: "Description", render: r => <div><div style={{ fontWeight: 600, fontSize: 13 }}>{r.description}</div><div style={{ fontSize: 11, color: T.txM }}>{r.submittedBy} · {r.date}</div></div> },
        { key: "category", label: "Category", width: 100, render: r => <Pill tone="neutral">{r.category}</Pill> },
        { key: "amount", label: "Amount", width: 110, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700 }}>{money(r.amount)}</span> },
        { key: "status", label: "Status", width: 100, render: r => <Pill tone={expTone(r.status)} dot>{r.status}</Pill> },
      ] as Column<Expense>[]} onRowClick={r => setSelected(r)} empty="No expenses." />
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.description ?? ""} width={480}
        footer={<>{selected?.status === "pending" && <><Button variant="outline" icon="check" onClick={() => { if (selected) { setExpenses(prev => prev.map(e => e.id === selected.id ? { ...e, status: "approved" as const } : e)); setSelected(null) } }}>Approve</Button><Button variant="danger" icon="lock" onClick={() => { if (selected) { setExpenses(prev => prev.map(e => e.id === selected.id ? { ...e, status: "rejected" as const } : e)); setSelected(null) } }}>Reject</Button></>}</>}>
        {selected && (<>
          <Section title="Details">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[{ l: "Amount", v: money(selected.amount) }, { l: "Category", v: selected.category }, { l: "Submitted By", v: selected.submittedBy }, { l: "Date", v: selected.date }].map(r => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.txM }}>{r.l}</span><span style={{ fontSize: 12, color: T.tx, fontWeight: 600 }}>{r.v}</span>
                </div>
              ))}
            </div>
          </Section>
        </>)}
      </Drawer>
    </>
  )
}

function SuppliersView({ ax, accent }: { ax: string; accent: Accent }) {
  const { authFetch, session } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>(DEMO_SUPPLIERS)

  useEffect(() => {
    if (!session) return
    authFetch("/api/trade/suppliers").then(r => r.json()).then(json => {
      if (json.success && Array.isArray(json.data)) {
        const mapped: Supplier[] = json.data.map((s: Record<string, unknown>) => ({
          id: s.id as string, name: (s.name as string) ?? "", contact: (s.contactName as string) ?? "",
          phone: (s.phone as string) ?? "", category: (s.paymentTerms as string) ?? "General",
          balance: 0, lastOrder: s.createdAt ? new Date(s.createdAt as string).toISOString().slice(0, 10) : "",
        }))
        if (mapped.length > 0) setSuppliers(mapped)
      }
    }).catch(() => {})
  }, [session, authFetch])

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Suppliers" value={suppliers.length} icon="user" accent={accent} />
        <Stat label="Outstanding" value={money(suppliers.reduce((s, r) => s + r.balance, 0))} icon="alert" accent="amber" />
        <Stat label="Active POs" value={0} icon="clock" accent="amber" />
        <Stat label="Received" value={0} icon="check" accent="emerald" />
      </div>
      <DataTable rows={suppliers} columns={[
        { key: "name", label: "Supplier", render: r => <div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: T.txM }}>{r.contact} · {r.phone}</div></div> },
        { key: "category", label: "Category", width: 100, render: r => <Pill tone="neutral">{r.category}</Pill> },
        { key: "balance", label: "Balance", width: 120, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: r.balance > 0 ? T.red : T.emerald }}>{money(r.balance)}</span> },
        { key: "lastOrder", label: "Last Order", width: 120, render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.lastOrder}</span> },
      ] as Column<Supplier>[]} empty="No suppliers." />
    </>
  )
}

function POView({ ax, accent }: { ax: string; accent: Accent }) {
  const { authFetch, session } = useAuth()
  const [poOrders, setPOOrders] = useState<PurchaseOrder[]>(DEMO_POS_ORDERS)

  useEffect(() => {
    if (!session) return
    authFetch("/api/trade/purchase-orders").then(r => r.json()).then(json => {
      if (json.success && Array.isArray(json.data)) {
        const mapped: PurchaseOrder[] = json.data.map((p: Record<string, unknown>) => ({
          id: p.id as string, poNumber: (p.poNumber as string) ?? "",
          supplier: ((p.supplier as Record<string, unknown>)?.name as string) ?? "",
          items: ((p.items as unknown[])?.length as number) ?? 0,
          total: (p.total as number) ?? 0,
          status: (p.status as string) === "received" ? "received" : (p.status as string) === "sent" ? "sent" : (p.status as string) === "partial" ? "partial" : "draft",
          date: p.createdAt ? new Date(p.createdAt as string).toISOString().slice(0, 10) : "",
        }))
        if (mapped.length > 0) setPOOrders(mapped)
      }
    }).catch(() => {})
  }, [session, authFetch])

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Total POs" value={poOrders.length} icon="trending" accent={accent} />
        <Stat label="Pending" value={poOrders.filter(p => p.status === "sent" || p.status === "draft").length} icon="clock" accent="amber" />
        <Stat label="Received" value={poOrders.filter(p => p.status === "received").length} icon="check" accent="emerald" />
        <Stat label="Value" value={money(poOrders.reduce((s, p) => s + p.total, 0))} icon="trending" />
      </div>
      <DataTable rows={poOrders} columns={[
        { key: "poNumber", label: "PO #", width: 130, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: ax }}>{r.poNumber}</span> },
        { key: "supplier", label: "Supplier", render: r => <span style={{ fontWeight: 600, fontSize: 13 }}>{r.supplier}</span> },
        { key: "items", label: "Items", width: 70, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.items}</span> },
        { key: "total", label: "Total", width: 120, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700 }}>{money(r.total)}</span> },
        { key: "status", label: "Status", width: 100, render: r => <Pill tone={poTone(r.status)} dot>{r.status}</Pill> },
        { key: "date", label: "Date", width: 110, render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.date}</span> },
      ] as Column<PurchaseOrder>[]} empty="No purchase orders." />
    </>
  )
}
