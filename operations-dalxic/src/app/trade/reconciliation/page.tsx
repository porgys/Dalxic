"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/reconciliation — Bank & MoMo statement matching
   Side-by-side: ledger entries vs imported statement.
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, Drawer, Section, T, Tone,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { money, dateShort } from "@/lib/ops/format"

type Source = "GCB" | "Stanbic" | "MTN MoMo" | "Vodafone Cash"

interface AccountSummary {
  id: Source
  label: string
  bookBalance: number
  statementBalance: number
  unmatchedBook: number
  unmatchedStmt: number
  lastImport: string
  color: string
}

const ACCOUNTS: AccountSummary[] = [
  { id: "GCB",            label: "GCB Main · 1234567890",    bookBalance: 62100, statementBalance: 60840, unmatchedBook: 2, unmatchedStmt: 1, lastImport: "2026-04-15", color: "#10B981" },
  { id: "Stanbic",        label: "Stanbic · 9876543210",     bookBalance: 24800, statementBalance: 24800, unmatchedBook: 0, unmatchedStmt: 0, lastImport: "2026-04-15", color: "#0EA5E9" },
  { id: "MTN MoMo",       label: "MTN Merchant · 0244123456",bookBalance: 14200, statementBalance: 14040, unmatchedBook: 1, unmatchedStmt: 2, lastImport: "2026-04-15", color: "#F59E0B" },
  { id: "Vodafone Cash",  label: "Vodafone · 0501234567",    bookBalance:  4900, statementBalance:  4900, unmatchedBook: 0, unmatchedStmt: 0, lastImport: "2026-04-15", color: "#EF4444" },
]

interface LedgerEntry {
  id: string
  date: string
  ref: string
  memo: string
  amount: number
  matched: boolean
}

interface StatementEntry {
  id: string
  date: string
  description: string
  amount: number
  matched: boolean
}

const LEDGER: Record<Source, LedgerEntry[]> = {
  GCB: [
    { id: "L1", date: "2026-04-15", ref: "JE-2104", memo: "POS shift close · Osu Main",    amount:  4280, matched: true },
    { id: "L2", date: "2026-04-14", ref: "JE-2102", memo: "Goods received PO-2026-0141",   amount: -4200, matched: true },
    { id: "L3", date: "2026-04-13", ref: "JE-2101", memo: "Supplier payment Olam Ghana",   amount: -4200, matched: true },
    { id: "L4", date: "2026-04-12", ref: "JE-2099", memo: "March payroll · 6 staff",       amount: -6720, matched: true },
    { id: "L5", date: "2026-04-11", ref: "JE-2098", memo: "March rent · Osu Main",         amount: -4000, matched: true },
    { id: "L6", date: "2026-04-10", ref: "JE-2097", memo: "Utilities · ECG + GWCL",        amount: -1640, matched: true },
    { id: "L7", date: "2026-04-09", ref: "JE-2090", memo: "Insurance premium · April",     amount: -1260, matched: false },
    { id: "L8", date: "2026-04-08", ref: "JE-2089", memo: "Equipment deposit · POS unit",  amount: -2400, matched: false },
  ],
  Stanbic: [
    { id: "L1", date: "2026-04-08", ref: "JE-2095", memo: "Bank charges · Stanbic", amount: -240, matched: true },
  ],
  "MTN MoMo": [
    { id: "L1", date: "2026-04-15", ref: "JE-2103", memo: "MoMo settlement · 14:42",      amount: 229.9, matched: true },
    { id: "L2", date: "2026-04-15", ref: "JE-2103", memo: "MoMo settlement · 12:14",      amount: 130.7, matched: true },
    { id: "L3", date: "2026-04-15", ref: "JE-2103", memo: "MoMo settlement · 10:08",      amount: 116.2, matched: false },
  ],
  "Vodafone Cash": [],
}

const STATEMENT: Record<Source, StatementEntry[]> = {
  GCB: [
    { id: "S1", date: "2026-04-15", description: "DEPOSIT POS BATCH 04150142",         amount:  4280, matched: true },
    { id: "S2", date: "2026-04-14", description: "PAY ASHFOAM WHOLESALE LTD",          amount: -4200, matched: true },
    { id: "S3", date: "2026-04-13", description: "PAY OLAM GHANA LIMITED",             amount: -4200, matched: true },
    { id: "S4", date: "2026-04-12", description: "PAYROLL BATCH MAR2026 6PERS",        amount: -6720, matched: true },
    { id: "S5", date: "2026-04-11", description: "STANDING ORDER RENT OSU PROP",       amount: -4000, matched: true },
    { id: "S6", date: "2026-04-10", description: "DD ECG GHANA",                       amount: -1240, matched: true },
    { id: "S7", date: "2026-04-10", description: "DD GHANA WATER COMPANY",             amount:  -400, matched: true },
    { id: "S8", date: "2026-04-09", description: "BANK CHARGES INTL TRANSFER FEE",     amount:   -85, matched: false },
  ],
  Stanbic: [
    { id: "S1", date: "2026-04-08", description: "MONTHLY MAINTENANCE FEE", amount: -240, matched: true },
  ],
  "MTN MoMo": [
    { id: "S1", date: "2026-04-15", description: "MOMO MERCHANT 14:42:11",  amount: 229.9, matched: true },
    { id: "S2", date: "2026-04-15", description: "MOMO MERCHANT 12:14:08",  amount: 130.7, matched: true },
    { id: "S3", date: "2026-04-15", description: "MOMO MERCHANT 09:42",     amount: 116.2, matched: false },
    { id: "S4", date: "2026-04-15", description: "MOMO CHARGE TXN 887412",  amount:  -3.4, matched: false },
  ],
  "Vodafone Cash": [],
}

export default function ReconciliationPage() {
  return <Shell><ReconView /></Shell>
}

function ReconView() {
  const [source, setSource] = useState<Source>("GCB")
  const [showImport, setShowImport] = useState(false)
  const account = ACCOUNTS.find(a => a.id === source)!
  const ledger = LEDGER[source]
  const statement = STATEMENT[source]

  const totals = useMemo(() => {
    const matched = ledger.filter(l => l.matched).reduce((a, l) => a + l.amount, 0)
    const variance = account.bookBalance - account.statementBalance
    return { matched, variance, matchedCount: ledger.filter(l => l.matched).length }
  }, [ledger, account])

  return (
    <>
      <Page
        title="Bank & MoMo Reconciliation"
        subtitle="Match imported statements to your ledger. Find variances before they compound."
        accent="amber"
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outline" icon="settings">Auto-Match Rules</Button>
            <Button icon="plus" onClick={() => setShowImport(true)}>Import Statement</Button>
          </div>
        }
      >
        {/* Account selector */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
          {ACCOUNTS.map(a => (
            <button
              key={a.id}
              onClick={() => setSource(a.id)}
              style={{
                textAlign: "left", padding: "16px 18px", borderRadius: 14,
                background: source === a.id ? `${a.color}10` : "rgba(255,255,255,0.02)",
                border: `1px solid ${source === a.id ? a.color : T.border}`,
                cursor: "pointer", transition: "all 0.18s ease",
                backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: T.txM, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{a.id}</span>
                {(a.unmatchedBook + a.unmatchedStmt) > 0 ? (
                  <Pill tone="amber">{a.unmatchedBook + a.unmatchedStmt} unmatched</Pill>
                ) : (
                  <Pill tone="emerald" dot>Balanced</Pill>
                )}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: a.color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>
                {money(a.bookBalance, { compact: true })}
              </div>
              <div style={{ fontSize: 11, color: T.txD, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{a.label}</div>
            </button>
          ))}
        </div>

        {/* Variance hero */}
        <Card padding={24} accent={Math.abs(totals.variance) < 0.01 ? "emerald" : "amber"} style={{ marginBottom: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 18, alignItems: "center" }}>
            <div>
              <Label>Book Balance</Label>
              <Big value={money(account.bookBalance)} color={T.tx} />
            </div>
            <div>
              <Label>Statement Balance</Label>
              <Big value={money(account.statementBalance)} color={T.tx} />
            </div>
            <div>
              <Label>Variance</Label>
              <Big value={money(totals.variance)} color={Math.abs(totals.variance) < 0.01 ? T.emerald : T.amber} />
              <div style={{ fontSize: 11, color: T.txM, marginTop: 4 }}>
                {Math.abs(totals.variance) < 0.01 ? "Books and bank agree" : "Investigate unmatched items below"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Label>Matched</Label>
              <div style={{ fontSize: 26, fontWeight: 800, color: T.emerald, fontFamily: "'Space Grotesk', sans-serif" }}>
                {totals.matchedCount}<span style={{ color: T.txD, fontWeight: 600 }}>/{ledger.length}</span>
              </div>
              <div style={{ marginTop: 8 }}>
                <Button variant="outline" size="sm" icon="check">Auto-Match</Button>
              </div>
            </div>
          </div>
        </Card>

        <Section title="Side-By-Side Reconciliation" sub="Drag to match · Click to mark · Variances surface in amber.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <ColumnPanel
              title="Your Ledger"
              sub={`${ledger.length} entries · ${ledger.filter(l => l.matched).length} matched`}
              color={T.emerald}
            >
              {ledger.length === 0 ? (
                <Empty label="No ledger entries for this account" />
              ) : ledger.map((l, idx) => (
                <Row
                  key={l.id}
                  date={dateShort(l.date)}
                  ref={l.ref}
                  memo={l.memo}
                  amount={l.amount}
                  matched={l.matched}
                  last={idx === ledger.length - 1}
                />
              ))}
            </ColumnPanel>

            <ColumnPanel
              title={`${source} Statement`}
              sub={`${statement.length} entries · imported ${dateShort(account.lastImport)}`}
              color={account.color}
            >
              {statement.length === 0 ? (
                <Empty label="No statement imported yet" />
              ) : statement.map((s, idx) => (
                <Row
                  key={s.id}
                  date={dateShort(s.date)}
                  ref="—"
                  memo={s.description}
                  amount={s.amount}
                  matched={s.matched}
                  last={idx === statement.length - 1}
                />
              ))}
            </ColumnPanel>
          </div>
        </Section>
      </Page>

      <ImportDrawer open={showImport} onClose={() => setShowImport(false)} source={source} />
    </>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>{children}</div>
}

function Big({ value, color }: { value: string; color: string }) {
  return <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>{value}</div>
}

function ColumnPanel({ title, sub, color, children }: { title: string; sub: string; color: string; children: React.ReactNode }) {
  return (
    <Card padding={0}>
      <div style={{ padding: "16px 22px", borderBottom: `1px solid ${T.border}`, background: `${color}06` }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}>{title}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 4 }}>{sub}</div>
      </div>
      <div>{children}</div>
    </Card>
  )
}

function Row({ date, ref, memo, amount, matched, last }: { date: string; ref: string; memo: string; amount: number; matched: boolean; last: boolean }) {
  const positive = amount > 0
  return (
    <div style={{
      padding: "14px 18px",
      borderBottom: last ? "none" : `1px solid ${T.border}`,
      display: "grid", gridTemplateColumns: "20px 1fr 110px", gap: 12, alignItems: "center",
      background: matched ? "transparent" : "rgba(245,158,11,0.04)",
      cursor: "pointer", transition: "background 0.15s ease",
    }}
      onMouseEnter={e => (e.currentTarget.style.background = matched ? "rgba(255,255,255,0.02)" : "rgba(245,158,11,0.08)")}
      onMouseLeave={e => (e.currentTarget.style.background = matched ? "transparent" : "rgba(245,158,11,0.04)")}
    >
      <span title={matched ? "Matched" : "Unmatched"} style={{
        width: 16, height: 16, borderRadius: 5,
        background: matched ? `${T.emerald}25` : `${T.amber}20`,
        color: matched ? T.emerald : T.amber,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={matched ? "check" : "close"} size={10} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.tx, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{memo}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2, fontFamily: "'DM Mono', monospace", display: "flex", gap: 8 }}>
          <span>{date}</span>
          {ref !== "—" && <span style={{ color: T.txD }}>· {ref}</span>}
        </div>
      </div>
      <span style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: positive ? T.emerald : T.red, fontFamily: "'Space Grotesk', sans-serif" }}>
        {positive ? "+" : ""}{money(amount, { symbol: false })}
      </span>
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return <div style={{ padding: 32, textAlign: "center", color: T.txD, fontSize: 12 }}>{label}</div>
}

function ImportDrawer({ open, onClose, source }: { open: boolean; onClose: () => void; source: Source }) {
  return (
    <Drawer
      open={open} onClose={onClose}
      title={`Import ${source} Statement`}
      subtitle="Upload a CSV, OFX, or PDF — we'll parse and queue for matching."
      width={500}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="check" onClick={onClose}>Import Statement</Button>
        </>
      }
    >
      <Card padding={32} style={{ textAlign: "center", borderStyle: "dashed", marginBottom: 18 }}>
        <div style={{ width: 64, height: 64, margin: "0 auto 14px", borderRadius: 16, background: `${T.amber}10`, color: T.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="download" size={28} style={{ transform: "rotate(180deg)" }} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.tx }}>Drop your statement file here</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 4 }}>CSV, OFX, MT940 or PDF · up to 20 MB</div>
        <div style={{ marginTop: 14 }}>
          <Button variant="outline" size="sm">Browse Files</Button>
        </div>
      </Card>

      <Section title="Or Connect Live Feed">
        <Card padding={20} accent="amber">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${T.emerald}15`, color: T.emerald, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="reconciliation" size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>Open Banking Feed</div>
              <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>Connect via GhIPSS for daily auto-import.</div>
            </div>
            <Button variant="outline" size="sm">Connect</Button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${T.amber}15`, color: T.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="phone" size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>MoMo Merchant API</div>
              <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>Real-time settlement webhook from MTN/Vodafone.</div>
            </div>
            <Button variant="outline" size="sm">Connect</Button>
          </div>
        </Card>
      </Section>
    </Drawer>
  )
}
