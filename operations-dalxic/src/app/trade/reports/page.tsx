"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/reports — Reports library, schedule, export
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, Drawer, Field, Input, Select,
  SearchBar, Tabs, Section, Empty, T, Tone,
} from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"

type Group = "all" | "Sales" | "Inventory" | "Financial" | "Tax" | "Payroll" | "Customers" | "Operations" | "Audit"

interface Report {
  slug: string
  title: string
  group: Exclude<Group, "all">
  blurb: string
  icon: IconName
  scheduled?: "Daily" | "Weekly" | "Monthly"
  exportable: boolean
}

const REPORTS: Report[] = [
  // Sales
  { slug: "sales-by-day",       group: "Sales",      title: "Sales By Day",            blurb: "Net revenue and receipt count, day by day",                 icon: "analytics",     exportable: true, scheduled: "Daily" },
  { slug: "sales-by-hour",      group: "Sales",      title: "Sales By Hour",           blurb: "Hourly heatmap to staff the right shift density",           icon: "analytics",     exportable: true },
  { slug: "sales-by-cashier",   group: "Sales",      title: "Sales By Cashier",        blurb: "Cashier leaderboard with refund and void rates",           icon: "shifts",        exportable: true },
  { slug: "sales-by-category",  group: "Sales",      title: "Sales By Category",       blurb: "Mix breakdown — what's pulling the till",                  icon: "labels",        exportable: true, scheduled: "Weekly" },
  { slug: "sales-by-branch",    group: "Sales",      title: "Sales By Branch",         blurb: "Cross-branch performance side-by-side",                    icon: "branches",      exportable: true, scheduled: "Daily" },
  { slug: "tender-mix",         group: "Sales",      title: "Tender Mix",              blurb: "Cash vs MoMo vs Card — daily, weekly, monthly",            icon: "financials",    exportable: true },
  { slug: "discounts-given",    group: "Sales",      title: "Discounts Given",         blurb: "Promo redemptions and manual price overrides",             icon: "loyalty",       exportable: true },

  // Inventory
  { slug: "stock-on-hand",      group: "Inventory",  title: "Stock On Hand",           blurb: "Live inventory snapshot with valuation",                   icon: "inventory",     exportable: true },
  { slug: "low-stock",          group: "Inventory",  title: "Low Stock & Reorder",     blurb: "SKUs below reorder point — what to buy now",               icon: "stock",         exportable: true, scheduled: "Daily" },
  { slug: "inventory-aging",    group: "Inventory",  title: "Inventory Aging",         blurb: "What's been sitting too long — write-down candidates",     icon: "calendar",      exportable: true },
  { slug: "expiry-watch",       group: "Inventory",  title: "Expiry Watch",            blurb: "Batches expiring in next 30/60/90 days",                   icon: "calendar",      exportable: true, scheduled: "Weekly" },
  { slug: "shrinkage",          group: "Inventory",  title: "Shrinkage Report",        blurb: "Stock losses by reason: damage, theft, expiry",            icon: "trash",         exportable: true, scheduled: "Monthly" },
  { slug: "transfers-summary",  group: "Inventory",  title: "Transfers Summary",       blurb: "Inter-branch movement, in-transit aging",                  icon: "branches",      exportable: true },

  // Financial
  { slug: "pl-monthly",         group: "Financial",  title: "Profit & Loss",           blurb: "Standard P&L by month, with margin %",                     icon: "financials",    exportable: true, scheduled: "Monthly" },
  { slug: "balance-sheet",      group: "Financial",  title: "Balance Sheet",           blurb: "Assets = Liabilities + Equity, balance-checked",           icon: "financials",    exportable: true, scheduled: "Monthly" },
  { slug: "cash-flow",          group: "Financial",  title: "Cash Flow Statement",     blurb: "Operating / Investing / Financing activities",             icon: "financials",    exportable: true, scheduled: "Monthly" },
  { slug: "trial-balance",      group: "Financial",  title: "Trial Balance",           blurb: "All accounts, debit and credit columns, balanced",         icon: "coa",           exportable: true, scheduled: "Monthly" },
  { slug: "general-ledger",     group: "Financial",  title: "General Ledger",          blurb: "Every posting by account with running balance",            icon: "journals",      exportable: true },
  { slug: "ar-aging",           group: "Financial",  title: "A/R Aging",               blurb: "Customer credit balances by days outstanding",             icon: "customers",     exportable: true, scheduled: "Weekly" },
  { slug: "ap-aging",           group: "Financial",  title: "A/P Aging",               blurb: "Supplier balances by due-date bucket",                     icon: "suppliers",     exportable: true, scheduled: "Weekly" },

  // Tax
  { slug: "vat-return",         group: "Tax",        title: "VAT Return (VAT-3)",      blurb: "GRA monthly VAT-3 form, ready to file",                    icon: "tax",           exportable: true, scheduled: "Monthly" },
  { slug: "withholding",        group: "Tax",        title: "Withholding Tax Schedule",blurb: "Supplier WHT credits to remit to GRA",                     icon: "tax",           exportable: true, scheduled: "Monthly" },
  { slug: "tax-collected",      group: "Tax",        title: "Tax Collected By Day",    blurb: "VAT + NHIL + GETFund + COVID, daily breakdown",            icon: "tax",           exportable: true },

  // Payroll
  { slug: "payroll-summary",    group: "Payroll",    title: "Payroll Summary",         blurb: "Per-run totals: gross, SSNIT, PAYE, net",                  icon: "payroll",       exportable: true, scheduled: "Monthly" },
  { slug: "ssnit-filing",       group: "Payroll",    title: "SSNIT Tier 1 + 2 Return", blurb: "Monthly SSNIT contribution schedule",                      icon: "payroll",       exportable: true, scheduled: "Monthly" },
  { slug: "paye-schedule",      group: "Payroll",    title: "PAYE Schedule",           blurb: "Monthly PAYE filing for GRA",                              icon: "tax",           exportable: true, scheduled: "Monthly" },

  // Customers
  { slug: "top-customers",      group: "Customers",  title: "Top Customers",           blurb: "Highest spenders, frequency, basket size",                 icon: "customers",     exportable: true },
  { slug: "loyalty-summary",    group: "Customers",  title: "Loyalty Summary",         blurb: "Tier movement, points outstanding, redemption rate",       icon: "loyalty",       exportable: true, scheduled: "Monthly" },
  { slug: "lapsed-customers",   group: "Customers",  title: "Lapsed Customers",        blurb: "Members not seen in 60+ days — win-back targets",          icon: "customers",     exportable: true },

  // Operations
  { slug: "shift-z-summary",    group: "Operations", title: "Shift / Z-Report Summary",blurb: "Every till close with variance",                           icon: "shifts",        exportable: true, scheduled: "Daily" },
  { slug: "branch-snapshot",    group: "Operations", title: "Branch Snapshot",         blurb: "All branches at a glance — staff, sales, stock",           icon: "branches",      exportable: true, scheduled: "Daily" },
  { slug: "expense-summary",    group: "Operations", title: "Expense Summary",         blurb: "Petty cash and approvals by category",                     icon: "expenses",      exportable: true, scheduled: "Weekly" },

  // Audit
  { slug: "audit-trail",        group: "Audit",      title: "Audit Trail",             blurb: "Who did what, when — immutable log",                       icon: "audit",         exportable: true },
  { slug: "void-log",           group: "Audit",      title: "Voids & Refunds Log",     blurb: "Every voided receipt and refund, with reason",             icon: "returns",       exportable: true, scheduled: "Daily" },
]

const GROUP_TONE: Record<Exclude<Group, "all">, Tone> = {
  Sales: "emerald", Inventory: "amber", Financial: "sky", Tax: "amber",
  Payroll: "emerald", Customers: "sky", Operations: "neutral", Audit: "amber",
}

export default function ReportsPage() {
  return <Shell><ReportsView /></Shell>
}

function ReportsView() {
  const [group, setGroup] = useState<Group>("all")
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<Report | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)

  const filtered = useMemo(() => {
    return REPORTS.filter(r => {
      if (group !== "all" && r.group !== group) return false
      if (!query) return true
      const q = query.toLowerCase()
      return r.title.toLowerCase().includes(q) || r.blurb.toLowerCase().includes(q)
    })
  }, [group, query])

  const totals = useMemo(() => ({
    total: REPORTS.length,
    scheduled: REPORTS.filter(r => r.scheduled).length,
    exportable: REPORTS.filter(r => r.exportable).length,
    groups: new Set(REPORTS.map(r => r.group)).size,
  }), [])

  const counts = useMemo(() => {
    const g: Record<string, number> = {}
    REPORTS.forEach(r => { g[r.group] = (g[r.group] ?? 0) + 1 })
    return g
  }, [])

  const groupKeys: Group[] = ["all", "Sales", "Inventory", "Financial", "Tax", "Payroll", "Customers", "Operations", "Audit"]

  return (
    <>
      <Page
        title="Reports Library"
        subtitle="Pre-built reports — generated on demand, scheduled by recipe, exported to CSV / PDF / Excel."
        accent="amber"
        action={<Button icon="plus" onClick={() => setShowSchedule(true)}>New Schedule</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Reports In Library" value={totals.total}      accent="amber"   icon="reports" />
          <Stat label="Categories"          value={totals.groups}     accent="emerald" icon="filter" />
          <Stat label="Scheduled"           value={totals.scheduled}  accent="sky"     icon="calendar" />
          <Stat label="Exportable"          value={totals.exportable} accent="amber"   icon="download" />
        </div>

        <Section
          title="Library"
          sub="Tap a report to preview, run, schedule or export."
          action={
            <div style={{ width: 280 }}>
              <SearchBar value={query} onChange={setQuery} placeholder="Search reports…" />
            </div>
          }
        >
          <Tabs<Group>
            value={group}
            onChange={setGroup}
            accent="amber"
            tabs={groupKeys.map(k => ({
              key: k,
              label: k === "all" ? "All" : k,
              count: k === "all" ? REPORTS.length : counts[k] ?? 0,
            }))}
          />

          {filtered.length === 0 ? (
            <Empty icon="reports" title="No reports match" />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginTop: 14 }}>
              {filtered.map(r => (
                <ReportTile key={r.slug} report={r} onClick={() => setActive(r)} />
              ))}
            </div>
          )}
        </Section>
      </Page>

      <ReportDrawer report={active} onClose={() => setActive(null)} />
      <ScheduleDrawer open={showSchedule} onClose={() => setShowSchedule(false)} />
    </>
  )
}

function ReportTile({ report, onClick }: { report: Report; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none", textAlign: "left", cursor: "pointer",
        padding: 20, borderRadius: 14,
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${T.border}`,
        backdropFilter: "blur(16px)",
        display: "flex", flexDirection: "column", gap: 12, minHeight: 168,
        transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)"
        e.currentTarget.style.borderColor = `${T.amber}50`
        e.currentTarget.style.boxShadow = `0 12px 30px ${T.amber}20`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none"
        e.currentTarget.style.borderColor = T.border
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${T.amber}1A`, border: `1px solid ${T.amber}40`, display: "grid", placeItems: "center" }}>
          <Icon name={report.icon} size={20} color={T.amber} />
        </div>
        <Pill tone={GROUP_TONE[report.group]}>{report.group}</Pill>
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em", marginBottom: 4 }}>
          {report.title}
        </div>
        <div style={{ fontSize: 12, color: T.txM, lineHeight: 1.5 }}>{report.blurb}</div>
      </div>
      <div style={{ marginTop: "auto", display: "flex", gap: 8, paddingTop: 8 }}>
        {report.scheduled && (
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.sky, fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="calendar" size={12} color={T.sky} />
            {report.scheduled}
          </span>
        )}
        {report.exportable && (
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txM, fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="download" size={12} color={T.txM} />
            Export
          </span>
        )}
      </div>
    </button>
  )
}

/* ─────────────────────────────  REPORT DRAWER  ───────────────────────────── */
function ReportDrawer({ report, onClose }: { report: Report | null; onClose: () => void }) {
  const [period, setPeriod] = useState("MTD")
  const [branch, setBranch] = useState("All branches")
  if (!report) return <Drawer open={false} onClose={onClose} title="Report">{null}</Drawer>
  return (
    <Drawer
      open={!!report} onClose={onClose}
      title={report.title}
      subtitle={report.group}
      width={600}
      footer={
        <>
          <Button variant="ghost" icon="calendar">Schedule</Button>
          <Button variant="outline" icon="download">Export CSV</Button>
          <Button icon="analytics">Run Now</Button>
        </>
      }
    >
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Pill tone={GROUP_TONE[report.group]}>{report.group}</Pill>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              {report.title}
            </div>
            <div style={{ fontSize: 13, color: T.txM, marginTop: 6, lineHeight: 1.5 }}>{report.blurb}</div>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${T.amber}1A`, border: `1px solid ${T.amber}40`, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name={report.icon} size={22} color={T.amber} />
          </div>
        </div>
      </Card>

      <Section title="Parameters">
        <Card padding={20}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Period">
              <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option>Today</option>
                <option>Yesterday</option>
                <option>This Week</option>
                <option>MTD</option>
                <option>QTD</option>
                <option>YTD</option>
                <option>Custom</option>
              </Select>
            </Field>
            <Field label="Branch">
              <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option>All branches</option>
                <option>Osu Main</option>
                <option>Tema Community 2</option>
                <option>Kasoa Highway</option>
                <option>Kumasi Adum</option>
                <option>Takoradi Market</option>
              </Select>
            </Field>
          </div>
        </Card>
      </Section>

      <Section title="Output Options">
        <Card padding={20}>
          <PreviewRow icon="print"    label="Print preview"      hint="Letter / A4 — landscape for wide tables" />
          <PreviewRow icon="download" label="Export to CSV"      hint="Opens in Excel, Sheets, or any spreadsheet" />
          <PreviewRow icon="share"    label="Email PDF"          hint="Send to owner@dalxic.com on a recurring schedule" last />
        </Card>
      </Section>

      {report.scheduled && (
        <Section title="Active Schedule">
          <Card padding={20} style={{ background: `${T.sky}0A`, border: `1px dashed ${T.sky}40` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Icon name="calendar" size={22} color={T.sky} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{report.scheduled} · 06:00 GMT</div>
                <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>Delivered to <strong style={{ color: T.tx }}>owner@dalxic.com</strong> as PDF</div>
              </div>
            </div>
          </Card>
        </Section>
      )}
    </Drawer>
  )
}

function PreviewRow({ icon, label, hint, last = false }: { icon: IconName; label: string; hint: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.amber}1A`, border: `1px solid ${T.amber}40`, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={icon} size={16} color={T.amber} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{label}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{hint}</div>
      </div>
    </div>
  )
}

/* ─────────────────────────────  SCHEDULE DRAWER  ───────────────────────────── */
function ScheduleDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [report, setReport] = useState(REPORTS[0].slug)
  const [freq, setFreq] = useState("Monthly")
  const [time, setTime] = useState("06:00")
  const [recipients, setRecipients] = useState("owner@dalxic.com")
  const [format, setFormat] = useState("PDF")
  return (
    <Drawer
      open={open} onClose={onClose}
      title="New Schedule"
      subtitle="Set it once. The report will land in inboxes on time, every time."
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="check" onClick={onClose}>Schedule Report</Button>
        </>
      }
    >
      <Field label="Report *">
        <Select value={report} onChange={(e) => setReport(e.target.value)}>
          {REPORTS.map(r => <option key={r.slug} value={r.slug}>{r.group} · {r.title}</option>)}
        </Select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Frequency *">
          <Select value={freq} onChange={(e) => setFreq(e.target.value)}>
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
            <option>Quarterly</option>
          </Select>
        </Field>
        <Field label="Time (GMT)">
          <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="06:00" />
        </Field>
      </div>
      <Field label="Recipients *" hint="Comma-separated email addresses">
        <Input value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="owner@dalxic.com" />
      </Field>
      <Field label="Format *">
        <Select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option>PDF</option>
          <option>CSV</option>
          <option>Excel</option>
        </Select>
      </Field>
    </Drawer>
  )
}
