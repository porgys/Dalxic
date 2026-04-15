"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/branches — Multi-branch master + per-branch dashboards
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Input, Select,
  SearchBar, Tabs, Section, Empty, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_BRANCHES, MockBranch } from "@/lib/ops/mock"
import { money, dateShort } from "@/lib/ops/format"

type View = "all" | "active" | "renovating" | "closed"

const STATUS_TONE: Record<MockBranch["status"], Tone> = {
  active: "emerald", renovating: "amber", closed: "neutral",
}

export default function BranchesPage() {
  return <Shell><BranchesView /></Shell>
}

function BranchesView() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [branches] = useState<MockBranch[]>(MOCK_BRANCHES)
  const [active, setActive] = useState<MockBranch | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const filtered = useMemo(() => {
    return branches.filter(b => {
      if (view !== "all" && b.status !== view) return false
      if (!query) return true
      const q = query.toLowerCase()
      return b.name.toLowerCase().includes(q) || b.city.toLowerCase().includes(q) || b.manager.toLowerCase().includes(q)
    })
  }, [branches, view, query])

  const totals = useMemo(() => ({
    branches: branches.length,
    active: branches.filter(b => b.status === "active").length,
    inventory: branches.reduce((a, b) => a + b.inventoryValue, 0),
    todayRev: branches.reduce((a, b) => a + b.todayRevenue, 0),
  }), [branches])

  const cols: Column<MockBranch>[] = [
    { key: "code", label: "Code", width: 80, render: (b) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, color: T.amber, letterSpacing: "0.06em" }}>{b.code}</span>
    )},
    { key: "name", label: "Branch", render: (b) => (
      <div>
        <div style={{ fontWeight: 600, color: T.tx }}>{b.name}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{b.city} · {b.manager}</div>
      </div>
    )},
    { key: "staff", label: "Staff", width: 70, align: "right", render: (b) => b.staff },
    { key: "registers", label: "Tills", width: 70, align: "right", render: (b) => b.registers },
    { key: "inventory", label: "Inventory Value", width: 150, align: "right", render: (b) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.emerald }}>{money(b.inventoryValue, { compact: true })}</span>
    )},
    { key: "today", label: "Today", width: 110, align: "right", render: (b) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: b.todayRevenue > 0 ? T.amber : T.txD }}>
        {money(b.todayRevenue, { compact: true })}
      </span>
    )},
    { key: "ytd", label: "YTD Revenue", width: 130, align: "right", render: (b) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.amber }}>{money(b.ytdRevenue, { compact: true })}</span>
    )},
    { key: "status", label: "Status", width: 120, render: (b) => <Pill tone={STATUS_TONE[b.status]} dot>{b.status}</Pill> },
  ]

  return (
    <>
      <Page
        title="Branches"
        subtitle="Per-branch ledgers, inventory snapshots, and consolidated performance — all in one wall."
        accent="amber"
        action={<Button icon="plus" onClick={() => setShowNew(true)}>New Branch</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Branches"      value={totals.branches}                                            icon="branches" />
          <Stat label="Active"               value={totals.active}                       accent="emerald"       icon="check" />
          <Stat label="Inventory Across All" value={money(totals.inventory, { compact: true })} accent="amber" icon="inventory" />
          <Stat label="Today's Revenue"      value={money(totals.todayRev, { compact: true })} accent="sky"   icon="financials" />
        </div>

        <Section
          title="Network"
          sub="Tap a branch to drill into its dashboard, manager, and contacts."
          action={
            <div style={{ width: 280 }}>
              <SearchBar value={query} onChange={setQuery} placeholder="Branch, city, manager…" />
            </div>
          }
        >
          <Tabs<View>
            value={view}
            onChange={setView}
            accent="amber"
            tabs={[
              { key: "all",        label: "All",         count: branches.length },
              { key: "active",     label: "Active",      count: branches.filter(b => b.status === "active").length },
              { key: "renovating", label: "Renovating",  count: branches.filter(b => b.status === "renovating").length },
              { key: "closed",     label: "Closed",      count: branches.filter(b => b.status === "closed").length },
            ]}
          />
          {filtered.length === 0 ? (
            <Empty icon="branches" title="No branches match" />
          ) : (
            <DataTable rows={filtered} columns={cols} onRowClick={(b) => { setActive(b); setDrawerOpen(true) }} />
          )}
        </Section>
      </Page>

      <BranchDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} branch={active} />
      <NewBranchDrawer open={showNew} onClose={() => setShowNew(false)} />
    </>
  )
}

function BranchDrawer({ open, onClose, branch }: { open: boolean; onClose: () => void; branch: MockBranch | null }) {
  if (!branch) return <Drawer open={open} onClose={onClose} title="Branch">{null}</Drawer>
  return (
    <Drawer
      open={open} onClose={onClose}
      title={branch.name}
      subtitle={`${branch.code} · ${branch.city} · Opened ${dateShort(branch.opened)}`}
      width={560}
      footer={
        <>
          <Button variant="ghost" icon="phone">Call Manager</Button>
          <Button variant="outline" icon="orders">View Sales</Button>
          <Button icon="edit">Edit</Button>
        </>
      }
    >
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Pill tone={STATUS_TONE[branch.status]} dot>{branch.status}</Pill>
            <div style={{ fontSize: 32, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {money(branch.ytdRevenue, { compact: true })}
            </div>
            <div style={{ fontSize: 11, color: T.txD, marginTop: 4, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>YTD Revenue</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.txM }}>Today</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, marginTop: 2, fontFamily: "'Space Grotesk', sans-serif" }}>{money(branch.todayRevenue, { compact: true })}</div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <MiniStat label="Staff"         value={branch.staff} />
        <MiniStat label="Tills"          value={branch.registers} />
        <MiniStat label="Inventory"     value={money(branch.inventoryValue, { compact: true })} />
      </div>

      <Section title="Branch Manager">
        <Card padding={20}>
          <Row label="Manager" value={branch.manager} />
          <Row label="Phone"   value={branch.phone} mono />
          <Row label="Branch Code" value={branch.code} mono last />
        </Card>
      </Section>

      <Section title="Recent Performance">
        <Card padding={20}>
          <ActivityRow label="Today's revenue"     value={money(branch.todayRevenue)} />
          <ActivityRow label="MTD revenue"          value={money(branch.ytdRevenue / 4)} />
          <ActivityRow label="YTD revenue"          value={money(branch.ytdRevenue)} />
          <ActivityRow label="Avg basket size"     value={money(28.5)} last />
        </Card>
      </Section>
    </Drawer>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</div>
    </div>
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

function ActivityRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.txM }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.amber, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</span>
    </div>
  )
}

function NewBranchDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [city, setCity] = useState("Accra")
  const [manager, setManager] = useState("")
  const [phone, setPhone] = useState("")
  return (
    <Drawer
      open={open} onClose={onClose}
      title="New Branch"
      subtitle="Spin up a new outlet — staff, tills and inventory will be pinned to this branch."
      width={480}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="check" onClick={onClose}>Create Branch</Button>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14 }}>
        <Field label="Code *" hint="3-4 letters">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="OSU" />
        </Field>
        <Field label="Branch Name *">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Osu Main" />
        </Field>
      </div>
      <Field label="City">
        <Select value={city} onChange={(e) => setCity(e.target.value)}>
          {["Accra", "Tema", "Kumasi", "Takoradi", "Tamale", "Cape Coast", "Sunyani", "Ho", "Wa", "Bolgatanga", "Kasoa"].map(c => <option key={c}>{c}</option>)}
        </Select>
      </Field>
      <Field label="Manager">
        <Input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Ms. Adjoa" />
      </Field>
      <Field label="Manager Phone">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 24 555 0000" />
      </Field>
    </Drawer>
  )
}
