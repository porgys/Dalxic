"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/accounting/reports — P&L · Balance Sheet · Cash Flow
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Pill, Button, Section, T,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_ACCOUNTS, MockAccount, AccountClass } from "@/lib/ops/mock"
import { money } from "@/lib/ops/format"

type Report = "pnl" | "bs" | "cf"
type Period = "mtd" | "qtd" | "ytd" | "custom"

export default function FinancialsPage() {
  return <Shell><FinancialsView /></Shell>
}

function FinancialsView() {
  const [report, setReport] = useState<Report>("pnl")
  const [period, setPeriod] = useState<Period>("ytd")

  return (
    <Page
      title="Financial Reports"
      subtitle="Profit & Loss, Balance Sheet, Cash Flow — generated in real-time from the ledger."
      accent="amber"
      action={
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="outline" icon="print">Print</Button>
          <Button variant="outline" icon="mail">Email</Button>
          <Button icon="download">Export PDF</Button>
        </div>
      }
    >
      {/* Report selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
        <ReportTile
          active={report === "pnl"}
          onClick={() => setReport("pnl")}
          icon="financials"
          title="Profit & Loss"
          sub="Revenue minus expenses for the period"
          accent={T.emerald}
        />
        <ReportTile
          active={report === "bs"}
          onClick={() => setReport("bs")}
          icon="coa"
          title="Balance Sheet"
          sub="Assets, liabilities, equity at a point in time"
          accent={T.amber}
        />
        <ReportTile
          active={report === "cf"}
          onClick={() => setReport("cf")}
          icon="reconciliation"
          title="Cash Flow"
          sub="Operating, investing, financing movements"
          accent={T.sky}
        />
      </div>

      {/* Period picker */}
      <Card padding={16} style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Reporting Period</div>
            <div style={{ fontSize: 14, color: T.tx, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
              {period === "mtd" && "1 Apr 2026 – 15 Apr 2026"}
              {period === "qtd" && "1 Apr 2026 – 15 Apr 2026"}
              {period === "ytd" && "1 Jan 2026 – 15 Apr 2026"}
              {period === "custom" && "Custom Range"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["mtd", "qtd", "ytd", "custom"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "10px 18px", borderRadius: 10,
                  border: `1px solid ${period === p ? T.amber : T.border}`,
                  background: period === p ? `${T.amber}10` : "transparent",
                  color: period === p ? T.amber : T.txM,
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  fontFamily: "'DM Mono', monospace",
                }}
              >{p.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </Card>

      {report === "pnl" && <ProfitLoss />}
      {report === "bs"  && <BalanceSheet />}
      {report === "cf"  && <CashFlow />}
    </Page>
  )
}

function ReportTile({ active, onClick, icon, title, sub, accent }: {
  active: boolean; onClick: () => void; icon: any; title: string; sub: string; accent: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left", padding: "20px 22px", borderRadius: 16,
        background: active ? `${accent}0F` : "rgba(255,255,255,0.02)",
        border: `1px solid ${active ? accent : T.border}`,
        cursor: "pointer", transition: "all 0.18s ease",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: active ? `${accent}20` : `${accent}10`,
          color: accent,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={icon} size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: T.txM, marginTop: 4 }}>{sub}</div>
        </div>
        {active && <Pill tone={accent === T.emerald ? "emerald" : accent === T.amber ? "amber" : "sky"}>Viewing</Pill>}
      </div>
    </button>
  )
}

/* ───── Profit & Loss ───── */

function ProfitLoss() {
  const data = useMemo(() => {
    const detail = (cls: AccountClass) => MOCK_ACCOUNTS.filter(a => a.cls === cls && a.kind === "Detail")
    const revenue = detail("Revenue")
    const cogs    = detail("Expense").filter(a => a.code === "5100")
    const opex    = detail("Expense").filter(a => a.code !== "5100")
    const totalRevenue = revenue.reduce((a, x) => a + x.balance, 0)
    const totalCogs    = cogs.reduce((a, x) => a + x.balance, 0)
    const grossProfit  = totalRevenue - totalCogs
    const totalOpex    = opex.reduce((a, x) => a + x.balance, 0)
    const netIncome    = grossProfit - totalOpex
    return { revenue, cogs, opex, totalRevenue, totalCogs, grossProfit, totalOpex, netIncome }
  }, [])

  const grossMargin = (data.grossProfit / data.totalRevenue) * 100
  const netMargin   = (data.netIncome / data.totalRevenue) * 100

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <Headline label="Revenue"      value={money(data.totalRevenue, { compact: true })} color={T.emerald} />
        <Headline label="Gross Profit" value={money(data.grossProfit,  { compact: true })} sub={`${grossMargin.toFixed(1)}% margin`} color={T.emerald} />
        <Headline label="Operating Exp." value={money(data.totalOpex, { compact: true })} color={T.amber} />
        <Headline label="Net Income"   value={money(data.netIncome,   { compact: true })} sub={`${netMargin.toFixed(1)}% margin`} color={data.netIncome > 0 ? T.emerald : T.red} bold />
      </div>

      <Section title="Profit & Loss Statement" sub="As at 15 April 2026 · YTD">
        <Card padding={0}>
          <Group label="REVENUE">
            {data.revenue.map(a => <LineRow key={a.code} code={a.code} name={a.name} amount={a.balance} />)}
            <SubTotal label="Total Revenue" amount={data.totalRevenue} color={T.emerald} />
          </Group>

          <Group label="COST OF GOODS SOLD">
            {data.cogs.map(a => <LineRow key={a.code} code={a.code} name={a.name} amount={a.balance} negate />)}
            <SubTotal label="Total COGS" amount={-data.totalCogs} color={T.red} />
          </Group>

          <BigRow label="GROSS PROFIT" amount={data.grossProfit} color={T.emerald} sub={`${grossMargin.toFixed(1)}% gross margin`} />

          <Group label="OPERATING EXPENSES">
            {data.opex.map(a => <LineRow key={a.code} code={a.code} name={a.name} amount={a.balance} negate />)}
            <SubTotal label="Total Operating Expenses" amount={-data.totalOpex} color={T.red} />
          </Group>

          <BigRow label="NET INCOME" amount={data.netIncome} color={data.netIncome > 0 ? T.emerald : T.red} sub={`${netMargin.toFixed(1)}% net margin`} highlight />
        </Card>
      </Section>
    </>
  )
}

/* ───── Balance Sheet ───── */

function BalanceSheet() {
  const data = useMemo(() => {
    const detail = (cls: AccountClass) => MOCK_ACCOUNTS.filter(a => a.cls === cls && a.kind === "Detail")
    const headers = (cls: AccountClass) => MOCK_ACCOUNTS.filter(a => a.cls === cls && a.kind === "Header" && a.parent)
    const assets    = detail("Asset")
    const currentA  = assets.filter(a => a.parent === "1100")
    const fixedA    = assets.filter(a => a.parent === "1500")
    const liabilities = detail("Liability")
    const equity      = detail("Equity")
    const totA = assets.reduce((a, x) => a + x.balance, 0)
    const totL = liabilities.reduce((a, x) => a + x.balance, 0)
    const totE = equity.reduce((a, x) => a + x.balance, 0)
    return { currentA, fixedA, liabilities, equity, totA, totL, totE, totLE: totL + totE }
  }, [])

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
        <Headline label="Total Assets"      value={money(data.totA, { compact: true })} color={T.emerald} bold />
        <Headline label="Total Liabilities" value={money(data.totL, { compact: true })} color={T.amber} />
        <Headline label="Total Equity"      value={money(data.totE, { compact: true })} color={T.sky} />
      </div>

      <Section title="Balance Sheet" sub="As at 15 April 2026">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <Card padding={0}>
            <Group label="ASSETS">
              <SubHeader label="Current Assets" />
              {data.currentA.map(a => <LineRow key={a.code} code={a.code} name={a.name} amount={a.balance} />)}
              <SubTotal label="Total Current Assets" amount={data.currentA.reduce((s, x) => s + x.balance, 0)} color={T.emerald} />

              <SubHeader label="Fixed Assets" />
              {data.fixedA.map(a => <LineRow key={a.code} code={a.code} name={a.name} amount={a.balance} />)}
              <SubTotal label="Net Fixed Assets" amount={data.fixedA.reduce((s, x) => s + x.balance, 0)} color={T.emerald} />
            </Group>
            <BigRow label="TOTAL ASSETS" amount={data.totA} color={T.emerald} highlight />
          </Card>

          <Card padding={0}>
            <Group label="LIABILITIES">
              {data.liabilities.map(a => <LineRow key={a.code} code={a.code} name={a.name} amount={a.balance} />)}
              <SubTotal label="Total Liabilities" amount={data.totL} color={T.amber} />
            </Group>

            <Group label="EQUITY">
              {data.equity.map(a => <LineRow key={a.code} code={a.code} name={a.name} amount={a.balance} />)}
              <SubTotal label="Total Equity" amount={data.totE} color={T.sky} />
            </Group>

            <BigRow label="TOTAL LIAB. + EQUITY" amount={data.totLE} color={T.sky} highlight />
          </Card>
        </div>

        <div style={{ marginTop: 18, textAlign: "center" }}>
          {Math.abs(data.totA - data.totLE) < 0.01 ? (
            <Pill tone="emerald" dot>Balance Sheet Balances</Pill>
          ) : (
            <Pill tone="red" dot>Out of Balance — investigate {money(Math.abs(data.totA - data.totLE))}</Pill>
          )}
        </div>
      </Section>
    </>
  )
}

/* ───── Cash Flow ───── */

function CashFlow() {
  const operating = [
    { name: "Cash receipts from customers", amount:  286400 },
    { name: "Cash paid to suppliers",       amount: -142000 },
    { name: "Cash paid to employees",       amount:  -32400 },
    { name: "Rent paid",                    amount:  -12000 },
    { name: "Utilities & internet",         amount:   -6600 },
    { name: "Bank & MoMo charges",          amount:   -2100 },
    { name: "VAT & taxes remitted",         amount:  -42000 },
  ]
  const investing = [
    { name: "Purchase of POS hardware",     amount:  -18200 },
    { name: "Furniture & fittings",         amount:   -8400 },
  ]
  const financing = [
    { name: "Owner contributions",          amount:    8000 },
    { name: "Owner drawings",               amount:   -4200 },
    { name: "Loan repayment — Stanbic",     amount:   -4800 },
  ]

  const totOp  = operating.reduce((a, x) => a + x.amount, 0)
  const totInv = investing.reduce((a, x) => a + x.amount, 0)
  const totFin = financing.reduce((a, x) => a + x.amount, 0)
  const netCash = totOp + totInv + totFin
  const opening = 18400
  const closing = opening + netCash

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <Headline label="Operating"   value={money(totOp,  { compact: true })} color={totOp  > 0 ? T.emerald : T.red} />
        <Headline label="Investing"   value={money(totInv, { compact: true })} color={totInv > 0 ? T.emerald : T.red} />
        <Headline label="Financing"   value={money(totFin, { compact: true })} color={totFin > 0 ? T.emerald : T.red} />
        <Headline label="Net Change"  value={money(netCash, { compact: true })} sub="Cash position movement" color={netCash > 0 ? T.emerald : T.red} bold />
      </div>

      <Section title="Statement of Cash Flow" sub="Indirect method · YTD through 15 Apr 2026">
        <Card padding={0}>
          <Group label="OPERATING ACTIVITIES">
            {operating.map((l, idx) => <LineRow key={idx} name={l.name} amount={l.amount} />)}
            <SubTotal label="Net Cash from Operations" amount={totOp} color={totOp > 0 ? T.emerald : T.red} />
          </Group>

          <Group label="INVESTING ACTIVITIES">
            {investing.map((l, idx) => <LineRow key={idx} name={l.name} amount={l.amount} />)}
            <SubTotal label="Net Cash from Investing" amount={totInv} color={totInv > 0 ? T.emerald : T.red} />
          </Group>

          <Group label="FINANCING ACTIVITIES">
            {financing.map((l, idx) => <LineRow key={idx} name={l.name} amount={l.amount} />)}
            <SubTotal label="Net Cash from Financing" amount={totFin} color={totFin > 0 ? T.emerald : T.red} />
          </Group>

          <BigRow label="NET CHANGE IN CASH" amount={netCash} color={netCash > 0 ? T.emerald : T.red} highlight />
          <div style={{ padding: "16px 22px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: T.txM, fontWeight: 600 }}>Cash at Beginning of Period</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{money(opening)}</span>
          </div>
          <div style={{ padding: "16px 22px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", background: "rgba(245,158,11,0.04)" }}>
            <span style={{ fontSize: 13, color: T.tx, fontWeight: 800, letterSpacing: "0.10em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Cash At End Of Period</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif" }}>{money(closing)}</span>
          </div>
        </Card>
      </Section>
    </>
  )
}

/* ───── shared building blocks ───── */

function Headline({ label, value, sub, color, bold = false }: { label: string; value: string; sub?: string; color: string; bold?: boolean }) {
  return (
    <Card padding={20} accent={color === T.emerald ? "emerald" : color === T.amber ? "amber" : "sky"}>
      <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: bold ? 30 : 24, fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif", marginTop: 8, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.txM, marginTop: 6 }}>{sub}</div>}
    </Card>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ padding: "14px 22px", background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.amber, fontFamily: "'DM Mono', monospace" }}>{label}</span>
      </div>
      {children}
    </div>
  )
}

function SubHeader({ label }: { label: string }) {
  return (
    <div style={{ padding: "10px 22px", paddingLeft: 32, fontSize: 11, color: T.txM, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", borderBottom: `1px solid ${T.border}` }}>
      {label}
    </div>
  )
}

function LineRow({ code, name, amount, negate = false }: { code?: string; name: string; amount: number; negate?: boolean }) {
  const display = negate ? -Math.abs(amount) : amount
  return (
    <div style={{ padding: "10px 22px", paddingLeft: 32, display: "grid", gridTemplateColumns: "60px 1fr 130px", gap: 12, alignItems: "center", borderBottom: `1px solid ${T.border}` }}>
      {code ? (
        <span style={{ fontSize: 11, color: T.txD, fontFamily: "'DM Mono', monospace" }}>{code}</span>
      ) : <span></span>}
      <span style={{ fontSize: 13, color: T.tx }}>{name}</span>
      <span style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: display < 0 ? T.red : T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>
        {money(display)}
      </span>
    </div>
  )
}

function SubTotal({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div style={{ padding: "12px 22px", paddingLeft: 32, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.border}`, background: `${color}05` }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: T.tx, letterSpacing: "0.06em", fontFamily: "'DM Mono', monospace" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif" }}>{money(amount)}</span>
    </div>
  )
}

function BigRow({ label, amount, color, sub, highlight = false }: { label: string; amount: number; color: string; sub?: string; highlight?: boolean }) {
  return (
    <div style={{
      padding: "20px 22px",
      borderTop: `1px solid ${T.border2}`,
      borderBottom: `1px solid ${T.border}`,
      background: highlight ? `${color}0C` : "rgba(255,255,255,0.02)",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.tx, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: T.txM, marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>{money(amount)}</div>
    </div>
  )
}
