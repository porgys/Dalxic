"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/accounting/coa — Chart of Accounts (5-class tree)
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, Drawer, Field, Input, TextArea, Select,
  SearchBar, Tabs, Section, Empty, T, Tone,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_ACCOUNTS, MockAccount, AccountClass } from "@/lib/ops/mock"
import { money } from "@/lib/ops/format"

type View = "all" | "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"

const CLASS_TONE: Record<AccountClass, Tone> = {
  Asset: "emerald", Liability: "amber", Equity: "sky", Revenue: "emerald", Expense: "red",
}

const CLASS_COLOR: Record<AccountClass, string> = {
  Asset: T.emerald, Liability: T.amber, Equity: T.sky, Revenue: T.emeraldL, Expense: T.red,
}

export default function CoAPage() {
  return <Shell><CoAView /></Shell>
}

function CoAView() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [accounts] = useState<MockAccount[]>(MOCK_ACCOUNTS)
  const [active, setActive] = useState<MockAccount | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const totals = useMemo(() => {
    const sum = (cls: AccountClass) => accounts
      .filter(a => a.cls === cls && a.kind === "Header")
      .reduce((acc, h) => acc + h.balance, 0)
    return {
      assets:      sum("Asset"),
      liabilities: sum("Liability"),
      equity:      sum("Equity"),
      revenue:     sum("Revenue"),
      expenses:    sum("Expense"),
      netIncome:   sum("Revenue") - sum("Expense"),
      accounts:    accounts.filter(a => a.kind === "Detail" && a.active).length,
    }
  }, [accounts])

  const filtered = useMemo(() => {
    return accounts.filter(a => {
      if (view !== "all" && a.cls !== view) return false
      if (!query) return true
      const q = query.toLowerCase()
      return a.name.toLowerCase().includes(q) || a.code.includes(q)
    })
  }, [accounts, view, query])

  const toggle = (code: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code); else next.add(code)
      return next
    })
  }

  return (
    <>
      <Page
        title="Chart Of Accounts"
        subtitle="The five-class general-ledger tree. Open balances, tax codes, and sub-account hierarchy."
        accent="amber"
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outline" icon="download">Export</Button>
            <Button icon="plus" onClick={() => setShowNew(true)}>New Account</Button>
          </div>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
          <Stat label="Total Assets"      value={money(totals.assets,      { compact: true })} accent="emerald" icon="financials" />
          <Stat label="Total Liabilities" value={money(totals.liabilities, { compact: true })} accent="amber"   icon="po" />
          <Stat label="Total Equity"      value={money(totals.equity,      { compact: true })} accent="sky"     icon="customers" />
          <Stat label="Net Income (YTD)"  value={money(totals.netIncome,   { compact: true })} accent="emerald" icon="analytics" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 28 }}>
          <Card padding={20} accent="emerald">
            <ClassRow label="Revenue YTD" value={totals.revenue} color={T.emerald} />
            <ClassRow label="Expenses YTD" value={totals.expenses} color={T.red} />
            <div style={{ borderTop: `1px solid ${T.border2}`, marginTop: 10, paddingTop: 10 }}>
              <ClassRow label="Net Income" value={totals.netIncome} color={T.emerald} bold />
            </div>
          </Card>
          <Card padding={20} accent="sky">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: T.txM, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>Accounting Equation</span>
              <Pill tone="sky">Balanced</Pill>
            </div>
            <div style={{ fontSize: 16, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginTop: 8 }}>
              {money(totals.assets, { compact: true })} <span style={{ color: T.txM, fontWeight: 400 }}>=</span> {money(totals.liabilities, { compact: true })} <span style={{ color: T.txM, fontWeight: 400 }}>+</span> {money(totals.equity, { compact: true })}
            </div>
            <div style={{ fontSize: 11, color: T.txM, marginTop: 6 }}>Assets = Liabilities + Equity</div>
          </Card>
        </div>

        <Section
          title="The Ledger Tree"
          sub="Click a header to collapse, click a detail account to inspect or post a journal."
          action={
            <div style={{ width: 280 }}>
              <SearchBar value={query} onChange={setQuery} placeholder="Code or account name…" />
            </div>
          }
        >
          <Tabs<View>
            value={view}
            onChange={setView}
            accent="amber"
            tabs={[
              { key: "all",       label: "All",        count: accounts.filter(a => a.kind === "Detail").length },
              { key: "Asset",     label: "Assets",     count: accounts.filter(a => a.cls === "Asset"     && a.kind === "Detail").length },
              { key: "Liability", label: "Liabilities",count: accounts.filter(a => a.cls === "Liability" && a.kind === "Detail").length },
              { key: "Equity",    label: "Equity",     count: accounts.filter(a => a.cls === "Equity"    && a.kind === "Detail").length },
              { key: "Revenue",   label: "Revenue",    count: accounts.filter(a => a.cls === "Revenue"   && a.kind === "Detail").length },
              { key: "Expense",   label: "Expenses",   count: accounts.filter(a => a.cls === "Expense"   && a.kind === "Detail").length },
            ]}
          />

          {filtered.length === 0 ? (
            <Empty icon="coa" title="No accounts match" sub="Try a different filter or search." />
          ) : (
            <Card padding={0}>
              <div style={{ padding: "14px 22px", borderBottom: `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "70px 1fr 130px 130px 100px 90px", gap: 16, alignItems: "center" }}>
                <Th>Code</Th>
                <Th>Account</Th>
                <Th align="right">Balance</Th>
                <Th align="right">YTD Activity</Th>
                <Th>Tax Code</Th>
                <Th align="right">Status</Th>
              </div>
              <Tree accounts={filtered} all={accounts} collapsed={collapsed} onToggle={toggle} onOpen={(a) => { setActive(a); setDrawerOpen(true) }} />
            </Card>
          )}
        </Section>
      </Page>

      <AccountDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} account={active} />
      <NewAccountDrawer open={showNew} onClose={() => setShowNew(false)} accounts={accounts} />
    </>
  )
}

/* ───── Tree renderer ───── */

function Tree({ accounts, all, collapsed, onToggle, onOpen }: {
  accounts: MockAccount[]
  all: MockAccount[]
  collapsed: Set<string>
  onToggle: (code: string) => void
  onOpen: (a: MockAccount) => void
}) {
  const headers = accounts.filter(a => a.kind === "Header" && !a.parent)
  return (
    <div>
      {headers.map((h, idx) => (
        <Branch
          key={h.code}
          account={h}
          all={all}
          accounts={accounts}
          depth={0}
          collapsed={collapsed}
          onToggle={onToggle}
          onOpen={onOpen}
          last={idx === headers.length - 1}
        />
      ))}
    </div>
  )
}

function Branch({ account, all, accounts, depth, collapsed, onToggle, onOpen, last }: {
  account: MockAccount
  all: MockAccount[]
  accounts: MockAccount[]
  depth: number
  collapsed: Set<string>
  onToggle: (code: string) => void
  onOpen: (a: MockAccount) => void
  last: boolean
}) {
  const children = all.filter(a => a.parent === account.code && accounts.some(f => f.code === a.code))
  const isCollapsed = collapsed.has(account.code)
  const isHeader = account.kind === "Header"
  const color = CLASS_COLOR[account.cls]

  return (
    <>
      <div
        onClick={() => isHeader ? onToggle(account.code) : onOpen(account)}
        style={{
          padding: "12px 22px",
          paddingLeft: 22 + depth * 22,
          borderBottom: last && (isCollapsed || children.length === 0) ? "none" : `1px solid ${T.border}`,
          display: "grid",
          gridTemplateColumns: "70px 1fr 130px 130px 100px 90px",
          gap: 16,
          alignItems: "center",
          cursor: "pointer",
          background: isHeader ? `${color}06` : "transparent",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = isHeader ? `${color}10` : "rgba(255,255,255,0.02)")}
        onMouseLeave={e => (e.currentTarget.style.background = isHeader ? `${color}06` : "transparent")}
      >
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: isHeader ? color : T.txM, letterSpacing: "0.04em" }}>
          {account.code}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isHeader && (
            <Icon name="chevron-right" size={12} style={{ transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)", transition: "transform 0.15s ease", color: T.txM }} />
          )}
          {!isHeader && depth > 0 && (
            <span style={{ width: 12, height: 1, background: T.border, display: "inline-block" }} />
          )}
          <span style={{
            fontSize: isHeader ? 14 : 13,
            fontWeight: isHeader ? 800 : 600,
            color: isHeader ? T.tx : T.tx,
            fontFamily: isHeader ? "'Space Grotesk', sans-serif" : "'DM Sans', sans-serif",
            letterSpacing: isHeader ? "-0.01em" : "0",
          }}>
            {account.name}
          </span>
          {isHeader && (
            <Pill tone={CLASS_TONE[account.cls]}>{account.cls}</Pill>
          )}
        </div>
        <span style={{
          textAlign: "right",
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: isHeader ? 800 : 700,
          fontSize: isHeader ? 14 : 13,
          color: account.balance < 0 ? T.red : (isHeader ? color : T.tx),
        }}>
          {money(account.balance, { compact: true })}
        </span>
        <span style={{ textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.txM }}>
          {account.ytdActivity > 0 ? money(account.ytdActivity, { compact: true, symbol: false }) : "—"}
        </span>
        <span>
          {account.taxCode && <Pill tone="amber">{account.taxCode}</Pill>}
        </span>
        <span style={{ textAlign: "right" }}>
          {!isHeader && (
            <Pill tone={account.active ? "emerald" : "neutral"} dot>{account.active ? "Active" : "Inactive"}</Pill>
          )}
        </span>
      </div>

      {!isCollapsed && children.map((c, idx) => (
        <Branch
          key={c.code}
          account={c}
          all={all}
          accounts={accounts}
          depth={depth + 1}
          collapsed={collapsed}
          onToggle={onToggle}
          onOpen={onOpen}
          last={last && idx === children.length - 1}
        />
      ))}
    </>
  )
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, textAlign: align, fontFamily: "'DM Mono', monospace" }}>{children}</span>
}

function ClassRow({ label, value, color, bold = false }: { label: string; value: number; color: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0" }}>
      <span style={{ fontSize: 12, color: T.txM, letterSpacing: bold ? "0.10em" : 0, textTransform: bold ? "uppercase" : "none", fontWeight: bold ? 700 : 500, fontFamily: bold ? "'DM Mono', monospace" : "'DM Sans', sans-serif" }}>
        {label}
      </span>
      <span style={{ fontSize: bold ? 20 : 16, fontWeight: bold ? 800 : 700, color, fontFamily: "'Space Grotesk', sans-serif" }}>
        {money(value, { compact: true })}
      </span>
    </div>
  )
}

/* ───── Account drawer ───── */

function AccountDrawer({ open, onClose, account }: { open: boolean; onClose: () => void; account: MockAccount | null }) {
  if (!account) return <Drawer open={open} onClose={onClose} title="Account">{null}</Drawer>
  const color = CLASS_COLOR[account.cls]
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`${account.code} — ${account.name}`}
      subtitle={`${account.cls} · ${account.kind} Account`}
      width={540}
      footer={
        <>
          <Button variant="ghost" icon="journals">Post Journal</Button>
          <Button variant="outline" icon="orders">View Ledger</Button>
          <Button icon="edit">Edit</Button>
        </>
      }
    >
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Pill tone={CLASS_TONE[account.cls]}>{account.cls}</Pill>
            <div style={{ fontSize: 32, fontWeight: 800, color: account.balance < 0 ? T.red : color, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1 }}>
              {money(account.balance)}
            </div>
            <div style={{ fontSize: 11, color: T.txD, marginTop: 4, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
              Current Balance
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.txM }}>YTD Activity</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.tx, marginTop: 2, fontFamily: "'Space Grotesk', sans-serif" }}>
              {money(account.ytdActivity, { compact: true })}
            </div>
            {account.taxCode && (
              <div style={{ marginTop: 10 }}><Pill tone="amber">{account.taxCode}</Pill></div>
            )}
          </div>
        </div>
      </Card>

      <Section title="Account Details">
        <Card padding={20}>
          <Row label="Account Code"  value={account.code} mono />
          <Row label="Class"          value={account.cls} />
          <Row label="Type"           value={account.kind} />
          {account.parent && <Row label="Parent" value={account.parent} mono />}
          <Row label="Tax Treatment"  value={account.taxCode ?? "—"} />
          <Row label="Status"         value={<Pill tone={account.active ? "emerald" : "neutral"} dot>{account.active ? "Active" : "Inactive"}</Pill>} last />
        </Card>
      </Section>

      <Section title="Recent Activity">
        <Card padding={20}>
          <ActivityRow date="14 Apr" ref="JE-2104" memo="POS shift close · Osu Main"   debit={2840} credit={0} />
          <ActivityRow date="13 Apr" ref="JE-2098" memo="Supplier payment · Olam Ghana" debit={0}    credit={4200} />
          <ActivityRow date="12 Apr" ref="JE-2091" memo="MoMo settlement · MTN merchant" debit={1640} credit={0} last />
        </Card>
      </Section>

      {account.notes && (
        <Section title="Notes">
          <Card padding={20}>
            <p style={{ fontSize: 13, color: T.txM, lineHeight: 1.6 }}>{account.notes}</p>
          </Card>
        </Section>
      )}
    </Drawer>
  )
}

function Row({ label, value, mono = false, last = false }: { label: string; value: React.ReactNode; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.txM }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.tx, fontFamily: mono ? "'DM Mono', monospace" : "'Space Grotesk', sans-serif" }}>{value}</span>
    </div>
  )
}

function ActivityRow({ date, ref, memo, debit, credit, last = false }: { date: string; ref: string; memo: string; debit: number; credit: number; last?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "60px 90px 1fr 90px 90px", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 11, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{date}</span>
      <span style={{ fontSize: 11, color: T.tx, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{ref}</span>
      <span style={{ fontSize: 12, color: T.tx }}>{memo}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: debit > 0 ? T.tx : T.txD, textAlign: "right", fontFamily: "'Space Grotesk', sans-serif" }}>
        {debit > 0 ? money(debit, { symbol: false }) : "—"}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: credit > 0 ? T.amber : T.txD, textAlign: "right", fontFamily: "'Space Grotesk', sans-serif" }}>
        {credit > 0 ? money(credit, { symbol: false }) : "—"}
      </span>
    </div>
  )
}

/* ───── New account drawer ───── */

function NewAccountDrawer({ open, onClose, accounts }: { open: boolean; onClose: () => void; accounts: MockAccount[] }) {
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [cls, setCls] = useState<AccountClass>("Asset")
  const [parent, setParent] = useState("")
  const [taxCode, setTaxCode] = useState("")
  const [notes, setNotes] = useState("")

  const validParents = accounts.filter(a => a.kind === "Header" && a.cls === cls)

  return (
    <Drawer
      open={open} onClose={onClose}
      title="New Account"
      subtitle="Add a detail account under one of the five GL classes."
      width={500}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="check" onClick={onClose}>Create Account</Button>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14 }}>
        <Field label="Code *" hint="4-digit GL code">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="5950" />
        </Field>
        <Field label="Account Name *">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Office Cleaning" />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Class *">
          <Select value={cls} onChange={(e) => setCls(e.target.value as AccountClass)}>
            {(["Asset", "Liability", "Equity", "Revenue", "Expense"] as AccountClass[]).map(c => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Parent Header">
          <Select value={parent} onChange={(e) => setParent(e.target.value)}>
            <option value="">— None (Top Level) —</option>
            {validParents.map(p => <option key={p.code} value={p.code}>{p.code} · {p.name}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Tax Code" hint="GRA tax treatment for this account.">
        <Select value={taxCode} onChange={(e) => setTaxCode(e.target.value)}>
          <option value="">— No tax treatment —</option>
          <option value="VAT_OUT">VAT Output (Sales)</option>
          <option value="VAT_IN">VAT Input (Purchases)</option>
          <option value="EXEMPT">Exempt</option>
          <option value="ZERO">Zero-Rated</option>
        </Select>
      </Field>
      <Field label="Notes">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional internal description for this account." />
      </Field>
    </Drawer>
  )
}
