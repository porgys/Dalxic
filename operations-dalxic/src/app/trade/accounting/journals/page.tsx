"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/accounting/journals — Journal entries (double-entry)
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import Link from "next/link"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Input, TextArea, Select,
  SearchBar, Tabs, Section, Empty, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_JOURNALS, MockJournal, MOCK_ACCOUNTS } from "@/lib/ops/mock"
import { money, dateShort } from "@/lib/ops/format"

type View = "all" | "posted" | "draft" | "void"

const STATUS_TONE: Record<MockJournal["status"], Tone> = {
  posted: "emerald", draft: "amber", void: "red",
}

const SOURCE_TONE: Record<MockJournal["source"], Tone> = {
  POS: "emerald", PO: "amber", Refund: "red", Manual: "neutral", Payroll: "sky", Bank: "neutral", MoMo: "amber", Adjustment: "amber",
}

export default function JournalsPage() {
  return <Shell><JournalsView /></Shell>
}

function JournalsView() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [journals] = useState<MockJournal[]>(MOCK_JOURNALS)
  const [active, setActive] = useState<MockJournal | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const filtered = useMemo(() => {
    return journals.filter(j => {
      if (view !== "all" && j.status !== view) return false
      if (!query) return true
      const q = query.toLowerCase()
      return j.ref.toLowerCase().includes(q) || j.memo.toLowerCase().includes(q) || j.source.toLowerCase().includes(q)
    })
  }, [journals, view, query])

  const totals = useMemo(() => {
    const posted = journals.filter(j => j.status === "posted")
    return {
      count: posted.length,
      debit:  posted.reduce((a, j) => a + j.lines.reduce((b, l) => b + l.debit, 0), 0),
      credit: posted.reduce((a, j) => a + j.lines.reduce((b, l) => b + l.credit, 0), 0),
      drafts: journals.filter(j => j.status === "draft").length,
    }
  }, [journals])

  const cols: Column<MockJournal>[] = [
    { key: "ref",  label: "Ref",  width: 110, render: (j) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: T.tx }}>{j.ref}</span>
    )},
    { key: "date", label: "Date", width: 110, render: (j) => dateShort(j.date) },
    { key: "source", label: "Source", width: 120, render: (j) => <Pill tone={SOURCE_TONE[j.source]}>{j.source}</Pill> },
    { key: "memo", label: "Memo", render: (j) => <span style={{ color: j.status === "void" ? T.txD : T.tx }}>{j.memo}</span> },
    { key: "lines", label: "Lines", width: 70, align: "right", render: (j) => j.lines.length },
    { key: "total", label: "Total", width: 130, align: "right", render: (j) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.amber }}>
        {money(j.total, { compact: true })}
      </span>
    )},
    { key: "status", label: "Status", width: 110, render: (j) => <Pill tone={STATUS_TONE[j.status]} dot>{j.status}</Pill> },
  ]

  return (
    <>
      <Page
        title="Journals & Ledger"
        subtitle="Every double-entry posting that touches the books — automated and manual, drafts and posted."
        accent="amber"
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/trade/accounting/ledger" style={{ textDecoration: "none" }}>
              <Button variant="outline" icon="orders">General Ledger</Button>
            </Link>
            <Button icon="plus" onClick={() => setShowNew(true)}>New Journal</Button>
          </div>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Postings (MTD)"   value={totals.count}                                              icon="journals" />
          <Stat label="Total Debits"     value={money(totals.debit,  { compact: true })} accent="emerald" icon="financials" />
          <Stat label="Total Credits"    value={money(totals.credit, { compact: true })} accent="amber"   icon="financials" />
          <Stat label="Draft Entries"    value={totals.drafts}                                            accent="sky" icon="edit" />
        </div>

        <Section
          title="Journal Activity"
          sub="Click any row to inspect the full debit/credit breakdown."
          action={
            <div style={{ width: 280 }}>
              <SearchBar value={query} onChange={setQuery} placeholder="Ref, memo, source…" />
            </div>
          }
        >
          <Tabs<View>
            value={view}
            onChange={setView}
            accent="amber"
            tabs={[
              { key: "all",    label: "All",    count: journals.length },
              { key: "posted", label: "Posted", count: journals.filter(j => j.status === "posted").length },
              { key: "draft",  label: "Drafts", count: journals.filter(j => j.status === "draft").length },
              { key: "void",   label: "Voided", count: journals.filter(j => j.status === "void").length },
            ]}
          />

          {filtered.length === 0 ? (
            <Empty icon="journals" title="No journal entries match" />
          ) : (
            <DataTable rows={filtered} columns={cols} onRowClick={(j) => { setActive(j); setDrawerOpen(true) }} />
          )}
        </Section>
      </Page>

      <JournalDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} journal={active} />
      <NewJournalDrawer open={showNew} onClose={() => setShowNew(false)} />
    </>
  )
}

/* ───── Journal detail drawer ───── */

function JournalDrawer({ open, onClose, journal }: { open: boolean; onClose: () => void; journal: MockJournal | null }) {
  if (!journal) return <Drawer open={open} onClose={onClose} title="Journal Entry">{null}</Drawer>
  const debit = journal.lines.reduce((a, l) => a + l.debit, 0)
  const credit = journal.lines.reduce((a, l) => a + l.credit, 0)
  const balanced = Math.abs(debit - credit) < 0.01
  return (
    <Drawer
      open={open} onClose={onClose}
      title={journal.ref}
      subtitle={`${journal.source} · ${dateShort(journal.date)}${journal.postedBy ? ` · ${journal.postedBy}` : ""}`}
      width={620}
      footer={
        <>
          <Button variant="ghost" icon="print">Print</Button>
          <Button variant="outline" icon="share">Duplicate</Button>
          {journal.status === "draft" && <Button icon="check">Post Entry</Button>}
          {journal.status === "posted" && <Button variant="outline" icon="trash">Reverse</Button>}
        </>
      }
    >
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <Pill tone={STATUS_TONE[journal.status]} dot>{journal.status}</Pill>
          <Pill tone={SOURCE_TONE[journal.source]}>{journal.source}</Pill>
          {balanced ? <Pill tone="emerald">Balanced</Pill> : <Pill tone="red">Unbalanced</Pill>}
        </div>
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
        {journal.lines.length === 0 ? (
          <Empty icon="journals" title="No lines on this entry" />
        ) : (
          <Card padding={0}>
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "70px 1fr 110px 110px", gap: 12, alignItems: "center" }}>
              <Th>Account</Th><Th>Memo</Th><Th align="right">Debit</Th><Th align="right">Credit</Th>
            </div>
            {journal.lines.map((l, idx) => (
              <div key={idx} style={{ padding: "14px 18px", borderBottom: idx === journal.lines.length - 1 ? "none" : `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "70px 1fr 110px 110px", gap: 12, alignItems: "center" }}>
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
            <div style={{ padding: "14px 18px", borderTop: `1px solid ${T.border2}`, background: "rgba(245,158,11,0.04)", display: "grid", gridTemplateColumns: "70px 1fr 110px 110px", gap: 12, alignItems: "center" }}>
              <span></span>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: T.txM }}>Totals</span>
              <span style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: T.emerald, fontFamily: "'Space Grotesk', sans-serif" }}>{money(debit, { symbol: false })}</span>
              <span style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif" }}>{money(credit, { symbol: false })}</span>
            </div>
          </Card>
        )}
      </Section>
    </Drawer>
  )
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, textAlign: align, fontFamily: "'DM Mono', monospace" }}>{children}</span>
}

/* ───── New journal drawer (manual entry) ───── */

function NewJournalDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [date, setDate] = useState("")
  const [memo, setMemo] = useState("")
  const [lines, setLines] = useState([
    { accountCode: "", debit: "", credit: "" },
    { accountCode: "", debit: "", credit: "" },
  ])

  const detailAccounts = MOCK_ACCOUNTS.filter(a => a.kind === "Detail" && a.active)
  const debitTotal  = lines.reduce((a, l) => a + (parseFloat(l.debit)  || 0), 0)
  const creditTotal = lines.reduce((a, l) => a + (parseFloat(l.credit) || 0), 0)
  const balanced = Math.abs(debitTotal - creditTotal) < 0.01 && debitTotal > 0

  return (
    <Drawer
      open={open} onClose={onClose}
      title="New Journal Entry"
      subtitle="Manual posting · Debits must equal credits before posting."
      width={680}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="outline">Save Draft</Button>
          <Button icon="check" onClick={onClose}>Post Entry</Button>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
        <Field label="Date *">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Memo *">
          <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="What is this entry for?" />
        </Field>
      </div>

      <div style={{ marginTop: 12, marginBottom: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace" }}>
        Lines
      </div>
      <Card padding={0} style={{ marginBottom: 16 }}>
        {lines.map((l, idx) => (
          <div key={idx} style={{ padding: 10, borderBottom: idx === lines.length - 1 ? "none" : `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "1fr 110px 110px 32px", gap: 8, alignItems: "center" }}>
            <Select value={l.accountCode} onChange={(e) => setLines(prev => prev.map((p, i) => i === idx ? { ...p, accountCode: e.target.value } : p))}>
              <option value="">— Select account —</option>
              {detailAccounts.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
            </Select>
            <Input placeholder="Debit"  type="number" value={l.debit}  onChange={(e) => setLines(prev => prev.map((p, i) => i === idx ? { ...p, debit:  e.target.value, credit: e.target.value ? "" : p.credit } : p))} />
            <Input placeholder="Credit" type="number" value={l.credit} onChange={(e) => setLines(prev => prev.map((p, i) => i === idx ? { ...p, credit: e.target.value, debit:  e.target.value ? "" : p.debit  } : p))} />
            <button onClick={() => setLines(prev => prev.filter((_, i) => i !== idx))} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, height: 36, color: T.txM, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        ))}
        <div style={{ padding: 12, borderTop: `1px solid ${T.border}` }}>
          <Button variant="ghost" size="sm" icon="plus" onClick={() => setLines([...lines, { accountCode: "", debit: "", credit: "" }])}>Add Line</Button>
        </div>
      </Card>

      <Card padding={16} accent={balanced ? "emerald" : "amber"}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>Debits</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.emerald, fontFamily: "'Space Grotesk', sans-serif", marginTop: 4 }}>{money(debitTotal)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>Credits</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", marginTop: 4 }}>{money(creditTotal)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            {balanced ? (
              <Pill tone="emerald" dot>Balanced</Pill>
            ) : (
              <div>
                <Pill tone="amber" dot>Out by {money(Math.abs(debitTotal - creditTotal))}</Pill>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Drawer>
  )
}
