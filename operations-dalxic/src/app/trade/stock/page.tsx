"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/stock — Transfers, counts, adjustments
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Input, Select,
  SearchBar, Tabs, Section, Empty, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import {
  MOCK_TRANSFERS, MockStockTransfer,
  MOCK_COUNTS, MockStockCount,
  MOCK_ADJUSTMENTS, MockStockAdjustment,
  MOCK_BRANCHES,
} from "@/lib/ops/mock"
import { money, dateShort } from "@/lib/ops/format"

type View = "transfers" | "counts" | "adjustments"

const TRANSFER_TONE: Record<MockStockTransfer["status"], Tone> = {
  draft: "neutral", in_transit: "amber", received: "emerald", cancelled: "red",
}

const COUNT_TONE: Record<MockStockCount["status"], Tone> = {
  in_progress: "amber", completed: "sky", approved: "emerald",
}

const REASON_TONE: Record<MockStockAdjustment["reason"], Tone> = {
  Damage: "red", Theft: "red", Expiry: "amber",
  Found: "emerald", Recount: "sky", "Promo Giveaway": "neutral",
}

export default function StockPage() {
  return <Shell><StockView /></Shell>
}

function StockView() {
  const [view, setView] = useState<View>("transfers")
  const [query, setQuery] = useState("")
  const [showNew, setShowNew] = useState(false)

  // Selection drawers, one per type
  const [activeTransfer, setActiveTransfer] = useState<MockStockTransfer | null>(null)
  const [activeCount, setActiveCount] = useState<MockStockCount | null>(null)
  const [activeAdjustment, setActiveAdjustment] = useState<MockStockAdjustment | null>(null)

  const totals = useMemo(() => ({
    inTransit:    MOCK_TRANSFERS.filter(t => t.status === "in_transit").length,
    transferVal:  MOCK_TRANSFERS.reduce((a, t) => a + t.value, 0),
    countsOpen:   MOCK_COUNTS.filter(c => c.status === "in_progress").length,
    variances:    MOCK_COUNTS.reduce((a, c) => a + c.variances, 0),
    adjustments:  MOCK_ADJUSTMENTS.length,
    adjValue:     MOCK_ADJUSTMENTS.reduce((a, x) => a + x.value, 0),
  }), [])

  /* ───── Transfers ───── */
  const transferRows = useMemo(() => {
    if (!query) return MOCK_TRANSFERS
    const q = query.toLowerCase()
    return MOCK_TRANSFERS.filter(t =>
      t.id.toLowerCase().includes(q) ||
      t.fromBranch.toLowerCase().includes(q) ||
      t.toBranch.toLowerCase().includes(q) ||
      t.createdBy.toLowerCase().includes(q)
    )
  }, [query])

  const transferCols: Column<MockStockTransfer>[] = [
    { key: "id", label: "Code", width: 90, render: (t) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, color: T.amber, letterSpacing: "0.06em" }}>{t.id}</span>
    )},
    { key: "date", label: "Date", width: 110, render: (t) => dateShort(t.date) },
    { key: "route", label: "Route", render: (t) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontWeight: 600, color: T.tx }}>{t.fromBranch}</span>
        <Icon name="chevron-right" size={14} color={T.txD} />
        <span style={{ fontWeight: 600, color: T.tx }}>{t.toBranch}</span>
      </div>
    )},
    { key: "items", label: "Items", width: 80, align: "right", render: (t) => t.itemCount },
    { key: "units", label: "Units", width: 80, align: "right", render: (t) => t.units },
    { key: "value", label: "Value", width: 120, align: "right", render: (t) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.emerald }}>{money(t.value, { compact: true })}</span>
    )},
    { key: "status", label: "Status", width: 130, render: (t) => <Pill tone={TRANSFER_TONE[t.status]} dot>{t.status.replace("_", " ")}</Pill> },
  ]

  /* ───── Counts ───── */
  const countRows = useMemo(() => {
    if (!query) return MOCK_COUNTS
    const q = query.toLowerCase()
    return MOCK_COUNTS.filter(c =>
      c.id.toLowerCase().includes(q) ||
      c.branch.toLowerCase().includes(q) ||
      c.countedBy.toLowerCase().includes(q)
    )
  }, [query])

  const countCols: Column<MockStockCount>[] = [
    { key: "id", label: "Code", width: 90, render: (c) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, color: T.amber, letterSpacing: "0.06em" }}>{c.id}</span>
    )},
    { key: "date", label: "Date", width: 110, render: (c) => dateShort(c.date) },
    { key: "branch", label: "Branch", render: (c) => (
      <div>
        <div style={{ fontWeight: 600, color: T.tx }}>{c.branch}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>by {c.countedBy}</div>
      </div>
    )},
    { key: "scope", label: "Scope", width: 100, render: (c) => (
      <Pill tone={c.scope === "Full" ? "amber" : c.scope === "Cycle" ? "sky" : "neutral"}>{c.scope}</Pill>
    )},
    { key: "items", label: "Items", width: 90, align: "right", render: (c) => c.itemsCounted },
    { key: "var", label: "Variances", width: 110, align: "right", render: (c) => (
      <span style={{ fontWeight: 700, color: c.variances > 0 ? T.amber : T.emerald }}>{c.variances}</span>
    )},
    { key: "varVal", label: "Variant Value", width: 130, align: "right", render: (c) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: c.variantValue > 0 ? T.amber : T.txD }}>
        {c.variantValue > 0 ? money(c.variantValue, { compact: true }) : "—"}
      </span>
    )},
    { key: "status", label: "Status", width: 130, render: (c) => <Pill tone={COUNT_TONE[c.status]} dot>{c.status.replace("_", " ")}</Pill> },
  ]

  /* ───── Adjustments ───── */
  const adjRows = useMemo(() => {
    if (!query) return MOCK_ADJUSTMENTS
    const q = query.toLowerCase()
    return MOCK_ADJUSTMENTS.filter(a =>
      a.id.toLowerCase().includes(q) ||
      a.branch.toLowerCase().includes(q) ||
      a.item.toLowerCase().includes(q) ||
      a.reason.toLowerCase().includes(q)
    )
  }, [query])

  const adjCols: Column<MockStockAdjustment>[] = [
    { key: "id", label: "Code", width: 90, render: (a) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, color: T.amber, letterSpacing: "0.06em" }}>{a.id}</span>
    )},
    { key: "date", label: "Date", width: 110, render: (a) => dateShort(a.date) },
    { key: "branch", label: "Branch", width: 160, render: (a) => a.branch },
    { key: "item", label: "Item", render: (a) => (
      <div style={{ fontWeight: 600, color: T.tx }}>{a.item}</div>
    )},
    { key: "qty", label: "Qty Δ", width: 90, align: "right", render: (a) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, color: a.qtyChange > 0 ? T.emerald : T.red }}>
        {a.qtyChange > 0 ? `+${a.qtyChange}` : a.qtyChange}
      </span>
    )},
    { key: "reason", label: "Reason", width: 160, render: (a) => <Pill tone={REASON_TONE[a.reason]}>{a.reason}</Pill> },
    { key: "value", label: "Value", width: 110, align: "right", render: (a) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: a.value < 0 ? T.red : T.emerald }}>
        {money(a.value, { compact: true })}
      </span>
    )},
    { key: "approver", label: "Approved By", width: 150, render: (a) => (
      <span style={{ fontSize: 12, color: a.approvedBy ? T.tx : T.txD }}>{a.approvedBy ?? "— pending —"}</span>
    )},
  ]

  return (
    <>
      <Page
        title="Stock Operations"
        subtitle="Move stock between branches, count what's on the shelf, and reconcile what isn't."
        accent="amber"
        action={
          <Button icon="plus" onClick={() => setShowNew(true)}>
            {view === "transfers" ? "New Transfer" : view === "counts" ? "New Count" : "New Adjustment"}
          </Button>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="In Transit"          value={totals.inTransit}                              accent="amber"   icon="orders" />
          <Stat label="Transfer Value YTD"  value={money(totals.transferVal, { compact: true })}  accent="emerald" icon="financials" />
          <Stat label="Variances Logged"    value={totals.variances}                              accent="sky"     icon="reconciliation" />
          <Stat label="Net Adjustment"      value={money(totals.adjValue, { compact: true })}     accent={totals.adjValue < 0 ? "amber" : "emerald"} icon="edit" />
        </div>

        <Section
          title={view === "transfers" ? "Branch Transfers" : view === "counts" ? "Stock Counts" : "Stock Adjustments"}
          sub={
            view === "transfers" ? "Goods on the move between outlets — receive at destination to commit." :
            view === "counts"    ? "Cycle, spot and full counts. Variances post to adjustment journal once approved." :
            "Manual write-offs, finds, and corrections. Each line books a journal."
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
              { key: "transfers",   label: "Transfers",   count: MOCK_TRANSFERS.length },
              { key: "counts",      label: "Counts",      count: MOCK_COUNTS.length },
              { key: "adjustments", label: "Adjustments", count: MOCK_ADJUSTMENTS.length },
            ]}
          />

          {view === "transfers" && (
            transferRows.length === 0
              ? <Empty icon="orders" title="No transfers match" />
              : <DataTable rows={transferRows} columns={transferCols} onRowClick={(t) => setActiveTransfer(t)} />
          )}
          {view === "counts" && (
            countRows.length === 0
              ? <Empty icon="inventory" title="No counts match" />
              : <DataTable rows={countRows} columns={countCols} onRowClick={(c) => setActiveCount(c)} />
          )}
          {view === "adjustments" && (
            adjRows.length === 0
              ? <Empty icon="edit" title="No adjustments match" />
              : <DataTable rows={adjRows} columns={adjCols} onRowClick={(a) => setActiveAdjustment(a)} />
          )}
        </Section>
      </Page>

      <TransferDrawer transfer={activeTransfer} onClose={() => setActiveTransfer(null)} />
      <CountDrawer count={activeCount} onClose={() => setActiveCount(null)} />
      <AdjustmentDrawer adj={activeAdjustment} onClose={() => setActiveAdjustment(null)} />

      <NewDrawer view={view} open={showNew} onClose={() => setShowNew(false)} />
    </>
  )
}

/* ─────────────────────────────  TRANSFER DRAWER  ───────────────────────────── */
function TransferDrawer({ transfer, onClose }: { transfer: MockStockTransfer | null; onClose: () => void }) {
  return (
    <Drawer
      open={!!transfer} onClose={onClose}
      title={transfer ? `Transfer ${transfer.id}` : "Transfer"}
      subtitle={transfer ? `${dateShort(transfer.date)} · ${transfer.fromBranch} → ${transfer.toBranch}` : ""}
      width={560}
      footer={transfer && transfer.status === "in_transit" ? (
        <>
          <Button variant="ghost" icon="close">Cancel Transfer</Button>
          <Button icon="check">Mark Received</Button>
        </>
      ) : transfer && transfer.status === "draft" ? (
        <>
          <Button variant="ghost" icon="trash">Discard</Button>
          <Button icon="orders">Send</Button>
        </>
      ) : (
        <Button variant="ghost" icon="print">Print Pack List</Button>
      )}
    >
      {!transfer ? null : (
        <>
          <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
            <Pill tone={TRANSFER_TONE[transfer.status]} dot>{transfer.status.replace("_", " ")}</Pill>
            <div style={{ fontSize: 32, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {money(transfer.value)}
            </div>
            <div style={{ fontSize: 11, color: T.txD, marginTop: 4, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
              {transfer.itemCount} SKUs · {transfer.units} units
            </div>
          </Card>

          <Section title="Route">
            <Card padding={20}>
              <RouteStep label="From" branch={transfer.fromBranch} actor={transfer.createdBy} role="Sent by" tone="amber" />
              <div style={{ height: 16, borderLeft: `2px dashed ${T.border}`, marginLeft: 18 }} />
              <RouteStep
                label="To"
                branch={transfer.toBranch}
                actor={transfer.receivedBy ?? "—"}
                role={transfer.receivedBy ? "Received by" : "Awaiting receipt"}
                tone="emerald"
                last
              />
            </Card>
          </Section>

          <Section title="Audit">
            <Card padding={20}>
              <RowKV label="Transfer code" value={transfer.id} mono />
              <RowKV label="Date created" value={dateShort(transfer.date)} />
              <RowKV label="Items" value={`${transfer.itemCount} SKUs`} />
              <RowKV label="Units" value={`${transfer.units} units`} />
              <RowKV label="Total value" value={money(transfer.value)} last />
            </Card>
          </Section>
        </>
      )}
    </Drawer>
  )
}

function RouteStep({ label, branch, actor, role, tone, last = false }: { label: string; branch: string; actor: string; role: string; tone: "amber" | "emerald"; last?: boolean }) {
  const color = tone === "amber" ? T.amber : T.emerald
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, paddingBottom: last ? 0 : 0 }}>
      <div style={{ width: 36, height: 36, borderRadius: 12, background: `${color}1A`, border: `1px solid ${color}40`, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name="branches" size={16} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace" }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.tx, marginTop: 2 }}>{branch}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{role} · {actor}</div>
      </div>
    </div>
  )
}

/* ─────────────────────────────  COUNT DRAWER  ───────────────────────────── */
function CountDrawer({ count, onClose }: { count: MockStockCount | null; onClose: () => void }) {
  return (
    <Drawer
      open={!!count} onClose={onClose}
      title={count ? `Count ${count.id}` : "Count"}
      subtitle={count ? `${dateShort(count.date)} · ${count.branch}` : ""}
      width={520}
      footer={count && count.status === "in_progress" ? (
        <>
          <Button variant="ghost" icon="close">Discard</Button>
          <Button icon="check">Submit Count</Button>
        </>
      ) : count && count.status === "completed" ? (
        <Button icon="check">Approve & Post</Button>
      ) : (
        <Button variant="ghost" icon="print">Print Sheet</Button>
      )}
    >
      {!count ? null : (
        <>
          <Card padding={20} accent="sky" style={{ marginBottom: 20 }}>
            <Pill tone={COUNT_TONE[count.status]} dot>{count.status.replace("_", " ")}</Pill>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: T.txM }}>Items counted</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginTop: 2 }}>{count.itemsCounted}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.txM }}>Variances</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: count.variances > 0 ? T.amber : T.emerald, fontFamily: "'Space Grotesk', sans-serif", marginTop: 2 }}>{count.variances}</div>
              </div>
            </div>
          </Card>

          <Section title="Detail">
            <Card padding={20}>
              <RowKV label="Count code" value={count.id} mono />
              <RowKV label="Branch" value={count.branch} />
              <RowKV label="Scope" value={count.scope} />
              <RowKV label="Counted by" value={count.countedBy} />
              <RowKV label="Variant value" value={count.variantValue > 0 ? money(count.variantValue) : "—"} last />
            </Card>
          </Section>

          <Section title="Posting Preview">
            <Card padding={20}>
              <div style={{ fontSize: 12, color: T.txM, marginBottom: 12 }}>
                When approved, a stock-adjustment journal will post for the variant value.
              </div>
              <RowKV label="Adjustment account" value="5450 — Stock Variances" mono />
              <RowKV label="Offset account" value="1310 — Inventory" mono last />
            </Card>
          </Section>
        </>
      )}
    </Drawer>
  )
}

/* ─────────────────────────────  ADJUSTMENT DRAWER  ───────────────────────────── */
function AdjustmentDrawer({ adj, onClose }: { adj: MockStockAdjustment | null; onClose: () => void }) {
  return (
    <Drawer
      open={!!adj} onClose={onClose}
      title={adj ? `Adjustment ${adj.id}` : "Adjustment"}
      subtitle={adj ? `${dateShort(adj.date)} · ${adj.branch}` : ""}
      width={500}
      footer={adj && !adj.approvedBy ? (
        <>
          <Button variant="ghost" icon="close">Reject</Button>
          <Button icon="check">Approve & Post</Button>
        </>
      ) : (
        <Button variant="ghost" icon="print">Print Voucher</Button>
      )}
    >
      {!adj ? null : (
        <>
          <Card padding={20} accent={adj.value < 0 ? "amber" : "emerald"} style={{ marginBottom: 20 }}>
            <Pill tone={REASON_TONE[adj.reason]}>{adj.reason}</Pill>
            <div style={{ fontSize: 32, fontWeight: 800, color: adj.value < 0 ? T.red : T.emerald, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {money(adj.value)}
            </div>
            <div style={{ fontSize: 11, color: T.txD, marginTop: 4, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
              {adj.qtyChange > 0 ? `+${adj.qtyChange}` : adj.qtyChange} units
            </div>
          </Card>

          <Section title="Detail">
            <Card padding={20}>
              <RowKV label="Adjustment code" value={adj.id} mono />
              <RowKV label="Item" value={adj.item} />
              <RowKV label="Branch" value={adj.branch} />
              <RowKV label="Quantity Δ" value={adj.qtyChange > 0 ? `+${adj.qtyChange}` : `${adj.qtyChange}`} />
              <RowKV label="Value" value={money(adj.value)} />
              <RowKV label="Approved by" value={adj.approvedBy ?? "Pending"} last />
            </Card>
          </Section>
        </>
      )}
    </Drawer>
  )
}

function RowKV({ label, value, mono = false, last = false }: { label: string; value: React.ReactNode; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.txM }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.tx, fontFamily: mono ? "'DM Mono', monospace" : "'Space Grotesk', sans-serif" }}>{value}</span>
    </div>
  )
}

/* ─────────────────────────────  NEW DRAWER (multi-mode)  ───────────────────────────── */
function NewDrawer({ view, open, onClose }: { view: View; open: boolean; onClose: () => void }) {
  if (view === "transfers") return <NewTransferDrawer open={open} onClose={onClose} />
  if (view === "counts") return <NewCountDrawer open={open} onClose={onClose} />
  return <NewAdjustmentDrawer open={open} onClose={onClose} />
}

function NewTransferDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [from, setFrom] = useState("Osu Main")
  const [to, setTo] = useState("Tema Community 2")
  const [items, setItems] = useState("4")
  const [units, setUnits] = useState("82")
  return (
    <Drawer
      open={open} onClose={onClose}
      title="New Transfer"
      subtitle="Move stock from one branch to another. Source branch debits, destination credits on receipt."
      width={500}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="orders" onClick={onClose}>Create Transfer</Button>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="From branch *">
          <Select value={from} onChange={(e) => setFrom(e.target.value)}>
            {MOCK_BRANCHES.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
          </Select>
        </Field>
        <Field label="To branch *">
          <Select value={to} onChange={(e) => setTo(e.target.value)}>
            {MOCK_BRANCHES.filter(b => b.name !== from).map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
          </Select>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="SKU count">
          <Input value={items} onChange={(e) => setItems(e.target.value)} placeholder="4" />
        </Field>
        <Field label="Unit count">
          <Input value={units} onChange={(e) => setUnits(e.target.value)} placeholder="82" />
        </Field>
      </div>
      <Card padding={16} style={{ marginTop: 14, background: `${T.amber}0A`, border: `1px dashed ${T.amber}40` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.amber, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Tip</div>
        <div style={{ fontSize: 12, color: T.txM }}>
          The destination branch will see this as <strong style={{ color: T.tx }}>incoming</strong> until they tap <em style={{ color: T.emerald }}>Receive</em>.
          Variances at receipt will book to <strong style={{ color: T.tx }}>5450 Stock Variances</strong>.
        </div>
      </Card>
    </Drawer>
  )
}

function NewCountDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [branch, setBranch] = useState("Osu Main")
  const [scope, setScope] = useState<"Full" | "Cycle" | "Spot">("Cycle")
  const [counter, setCounter] = useState("Linda Sefa")
  return (
    <Drawer
      open={open} onClose={onClose}
      title="New Count"
      subtitle="Snapshot what's on the shelf. Variances post to the adjustment journal once approved."
      width={500}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="inventory" onClick={onClose}>Start Count</Button>
        </>
      }
    >
      <Field label="Branch *">
        <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
          {MOCK_BRANCHES.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
        </Select>
      </Field>
      <Field label="Scope *" hint="Full = every SKU. Cycle = a planned rotation. Spot = one-off shelf check.">
        <Select value={scope} onChange={(e) => setScope(e.target.value as "Full" | "Cycle" | "Spot")}>
          <option value="Full">Full — every SKU</option>
          <option value="Cycle">Cycle — rotation</option>
          <option value="Spot">Spot — single shelf</option>
        </Select>
      </Field>
      <Field label="Counter">
        <Input value={counter} onChange={(e) => setCounter(e.target.value)} placeholder="Linda Sefa" />
      </Field>
    </Drawer>
  )
}

function NewAdjustmentDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [branch, setBranch] = useState("Osu Main")
  const [item, setItem] = useState("")
  const [qty, setQty] = useState("")
  const [reason, setReason] = useState<MockStockAdjustment["reason"]>("Damage")
  return (
    <Drawer
      open={open} onClose={onClose}
      title="New Adjustment"
      subtitle="Manually correct stock. Each entry posts a journal — choose the reason carefully."
      width={500}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="check" onClick={onClose}>Submit For Approval</Button>
        </>
      }
    >
      <Field label="Branch *">
        <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
          {MOCK_BRANCHES.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
        </Select>
      </Field>
      <Field label="Item *">
        <Input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Search SKU…" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Quantity Δ *" hint="Positive for additions, negative for removals">
          <Input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="-2" />
        </Field>
        <Field label="Reason *">
          <Select value={reason} onChange={(e) => setReason(e.target.value as MockStockAdjustment["reason"])}>
            {(["Damage", "Theft", "Expiry", "Found", "Recount", "Promo Giveaway"] as const).map(r => <option key={r}>{r}</option>)}
          </Select>
        </Field>
      </div>
      <Card padding={16} style={{ marginTop: 4, background: `${T.red}0A`, border: `1px dashed ${T.red}40` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.red, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Approval required</div>
        <div style={{ fontSize: 12, color: T.txM }}>
          Adjustments above <strong style={{ color: T.tx }}>GHS 50</strong> need a manager PIN before they post to the ledger.
        </div>
      </Card>
    </Drawer>
  )
}
