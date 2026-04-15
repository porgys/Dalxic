"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/accounting/ledger — General Ledger drill-down
   Pick an account, see every posting that touched it.
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import Link from "next/link"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, Drawer, Field, Select,
  SearchBar, Section, Empty, T, Tone,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_ACCOUNTS, MockAccount, MOCK_JOURNALS, MockJournal, AccountClass } from "@/lib/ops/mock"
import { money, dateShort } from "@/lib/ops/format"

const CLASS_COLOR: Record<AccountClass, string> = {
  Asset: "#10B981", Liability: "#F59E0B", Equity: "#0EA5E9", Revenue: "#34D399", Expense: "#EF4444",
}

const SOURCE_TONE: Record<MockJournal["source"], Tone> = {
  POS: "emerald", PO: "amber", Refund: "red", Manual: "neutral", Payroll: "sky", Bank: "neutral", MoMo: "amber", Adjustment: "amber",
}

interface LedgerLine {
  date: string
  ref: string
  source: MockJournal["source"]
  memo: string
  debit: number
  credit: number
  running: number
}

export default function LedgerPage() {
  return <Shell><LedgerView /></Shell>
}

function LedgerView() {
  const detailAccounts = MOCK_ACCOUNTS.filter(a => a.kind === "Detail" && a.active)
  const [accountCode, setAccountCode] = useState(detailAccounts[0]?.code ?? "")
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<MockJournal | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const account = detailAccounts.find(a => a.code === accountCode) ?? detailAccounts[0]

  const lines = useMemo<LedgerLine[]>(() => {
    if (!account) return []
    let running = 0
    const sorted = [...MOCK_JOURNALS].filter(j => j.status === "posted").sort((a, b) => a.date.localeCompare(b.date))
    const out: LedgerLine[] = []
    for (const j of sorted) {
      const matching = j.lines.filter(l => l.accountCode === account.code)
      for (const l of matching) {
        const isDebitNormal = account.cls === "Asset" || account.cls === "Expense"
        const delta = isDebitNormal ? (l.debit - l.credit) : (l.credit - l.debit)
        running += delta
        out.push({
          date: j.date,
          ref: j.ref,
          source: j.source,
          memo: l.memo ?? j.memo,
          debit: l.debit,
          credit: l.credit,
          running,
        })
      }
    }
    return out
  }, [account])

  const filtered = useMemo(() => {
    if (!query) return lines
    const q = query.toLowerCase()
    return lines.filter(l => l.memo.toLowerCase().includes(q) || l.ref.toLowerCase().includes(q))
  }, [lines, query])

  const debitTotal  = lines.reduce((a, l) => a + l.debit, 0)
  const creditTotal = lines.reduce((a, l) => a + l.credit, 0)
  const closingBalance = lines.length ? lines[lines.length - 1].running : 0

  return (
    <>
      <Page
        title="General Ledger"
        subtitle="Pick an account to see every posting that touched it — with a running balance."
        accent="amber"
        action={
          <Link href="/trade/accounting/journals" style={{ textDecoration: "none" }}>
            <Button variant="outline" icon="journals">Back To Journals</Button>
          </Link>
        }
      >
        {/* Account picker hero */}
        <Card padding={20} accent="amber" style={{ marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 18, alignItems: "end" }}>
            <Field label="Account">
              <Select value={accountCode} onChange={(e) => setAccountCode(e.target.value)}>
                {(["Asset", "Liability", "Equity", "Revenue", "Expense"] as AccountClass[]).map(cls => (
                  <optgroup key={cls} label={cls.toUpperCase()}>
                    {detailAccounts.filter(a => a.cls === cls).map(a => (
                      <option key={a.code} value={a.code}>{a.code} · {a.name}</option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </Field>
            {account && (
              <>
                <MiniStat label="Class" value={<Pill tone={(account.cls === "Asset" || account.cls === "Revenue") ? "emerald" : account.cls === "Liability" ? "amber" : account.cls === "Equity" ? "sky" : "red"}>{account.cls}</Pill>} />
                <MiniStat label="Tax Code" value={account.taxCode ? <Pill tone="amber">{account.taxCode}</Pill> : <span style={{ color: T.txD }}>—</span>} />
                <MiniStat label="Status" value={<Pill tone={account.active ? "emerald" : "neutral"} dot>{account.active ? "Active" : "Inactive"}</Pill>} />
              </>
            )}
          </div>
        </Card>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Postings"        value={lines.length}                                              icon="journals" />
          <Stat label="Total Debits"    value={money(debitTotal,  { compact: true })} accent="emerald" icon="financials" />
          <Stat label="Total Credits"   value={money(creditTotal, { compact: true })} accent="amber"   icon="financials" />
          <Stat label="Closing Balance" value={money(closingBalance, { compact: true })} accent="sky"  icon="analytics" />
        </div>

        <Section
          title={account ? `${account.code} · ${account.name}` : "Select an Account"}
          sub="Every posting in chronological order with a running balance."
          action={
            <div style={{ width: 260 }}>
              <SearchBar value={query} onChange={setQuery} placeholder="Memo or journal ref…" />
            </div>
          }
        >
          {filtered.length === 0 ? (
            <Empty icon="journals" title="No postings touched this account" sub="Try selecting another account or widening the date range." />
          ) : (
            <Card padding={0}>
              <div style={{ padding: "14px 22px", borderBottom: `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "100px 110px 110px 1fr 110px 110px 130px", gap: 12, alignItems: "center" }}>
                <Th>Date</Th><Th>Ref</Th><Th>Source</Th><Th>Memo</Th>
                <Th align="right">Debit</Th><Th align="right">Credit</Th><Th align="right">Running</Th>
              </div>
              {filtered.map((l, idx) => {
                const journal = MOCK_JOURNALS.find(j => j.ref === l.ref)
                return (
                  <div
                    key={idx}
                    onClick={() => { if (journal) { setActive(journal); setDrawerOpen(true) } }}
                    style={{
                      padding: "12px 22px",
                      borderBottom: idx === filtered.length - 1 ? "none" : `1px solid ${T.border}`,
                      display: "grid", gridTemplateColumns: "100px 110px 110px 1fr 110px 110px 130px", gap: 12, alignItems: "center",
                      cursor: "pointer", transition: "background 0.12s ease",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: 12, color: T.tx, fontFamily: "'DM Mono', monospace" }}>{dateShort(l.date)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.tx, fontFamily: "'DM Mono', monospace" }}>{l.ref}</span>
                    <Pill tone={SOURCE_TONE[l.source]}>{l.source}</Pill>
                    <span style={{ fontSize: 13, color: T.tx }}>{l.memo}</span>
                    <span style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: l.debit > 0 ? T.emerald : T.txD, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {l.debit > 0 ? money(l.debit, { symbol: false }) : "—"}
                    </span>
                    <span style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: l.credit > 0 ? T.amber : T.txD, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {l.credit > 0 ? money(l.credit, { symbol: false }) : "—"}
                    </span>
                    <span style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: l.running < 0 ? T.red : T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {money(l.running, { symbol: false })}
                    </span>
                  </div>
                )
              })}
              <div style={{ padding: "16px 22px", borderTop: `1px solid ${T.border2}`, background: "rgba(245,158,11,0.04)", display: "grid", gridTemplateColumns: "100px 110px 110px 1fr 110px 110px 130px", gap: 12, alignItems: "center" }}>
                <span></span><span></span><span></span>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: T.txM }}>Period Total</span>
                <span style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: T.emerald, fontFamily: "'Space Grotesk', sans-serif" }}>{money(debitTotal, { symbol: false })}</span>
                <span style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif" }}>{money(creditTotal, { symbol: false })}</span>
                <span style={{ textAlign: "right", fontSize: 16, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif" }}>{money(closingBalance, { symbol: false })}</span>
              </div>
            </Card>
          )}
        </Section>
      </Page>

      <JournalQuickDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} journal={active} />
    </>
  )
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>{label}</div>
      <div>{value}</div>
    </div>
  )
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, textAlign: align, fontFamily: "'DM Mono', monospace" }}>{children}</span>
}

/* ───── Quick journal preview drawer ───── */

function JournalQuickDrawer({ open, onClose, journal }: { open: boolean; onClose: () => void; journal: MockJournal | null }) {
  if (!journal) return <Drawer open={open} onClose={onClose} title="Journal">{null}</Drawer>
  const debit = journal.lines.reduce((a, l) => a + l.debit, 0)
  const credit = journal.lines.reduce((a, l) => a + l.credit, 0)
  return (
    <Drawer
      open={open} onClose={onClose}
      title={journal.ref}
      subtitle={`${journal.source} · ${dateShort(journal.date)}${journal.postedBy ? ` · ${journal.postedBy}` : ""}`}
      width={580}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Link href="/trade/accounting/journals" style={{ textDecoration: "none" }}>
            <Button variant="outline" icon="journals">Open In Journals</Button>
          </Link>
        </>
      }
    >
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: T.tx, marginBottom: 14, lineHeight: 1.5 }}>{journal.memo}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>Debit Total</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.emerald, fontFamily: "'Space Grotesk', sans-serif", marginTop: 4 }}>{money(debit)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>Credit Total</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", marginTop: 4 }}>{money(credit)}</div>
          </div>
        </div>
      </Card>

      <Section title={`Lines (${journal.lines.length})`}>
        <Card padding={0}>
          {journal.lines.map((l, idx) => (
            <div key={idx} style={{ padding: "14px 18px", borderBottom: idx === journal.lines.length - 1 ? "none" : `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "70px 1fr 100px 100px", gap: 12, alignItems: "center" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: T.txM }}>{l.accountCode}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>{l.accountName}</div>
                {l.memo && <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{l.memo}</div>}
              </div>
              <span style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: l.debit > 0 ? T.emerald : T.txD, fontFamily: "'Space Grotesk', sans-serif" }}>
                {l.debit > 0 ? money(l.debit, { symbol: false }) : "—"}
              </span>
              <span style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: l.credit > 0 ? T.amber : T.txD, fontFamily: "'Space Grotesk', sans-serif" }}>
                {l.credit > 0 ? money(l.credit, { symbol: false }) : "—"}
              </span>
            </div>
          ))}
        </Card>
      </Section>
    </Drawer>
  )
}
