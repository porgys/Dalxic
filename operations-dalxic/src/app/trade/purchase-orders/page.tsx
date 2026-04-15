"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/purchase-orders — PO ledger + create flow
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Input, Select,
  SearchBar, Tabs, Section, Empty, T, Tone, Column,
} from "@/components/ops/primitives"
import { MOCK_POS, MockPO, MOCK_SUPPLIERS } from "@/lib/ops/mock"
import { money, dateShort } from "@/lib/ops/format"

type View = "all" | "draft" | "sent" | "partial" | "received" | "cancelled"

const STATUS_TONE: Record<MockPO["status"], Tone> = {
  draft: "neutral", sent: "sky", partial: "amber", received: "emerald", cancelled: "red",
}

export default function POsPage() {
  return <Shell><POsView /></Shell>
}

function POsView() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [pos] = useState<MockPO[]>(MOCK_POS)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [active, setActive] = useState<MockPO | null>(null)
  const [showNew, setShowNew] = useState(false)

  const filtered = useMemo(() => {
    return pos.filter((p) => {
      if (view !== "all" && p.status !== view) return false
      if (!query) return true
      const q = query.toLowerCase()
      return p.poNumber.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q)
    })
  }, [pos, view, query])

  const totals = useMemo(() => ({
    open:     pos.filter(p => p.status === "sent" || p.status === "partial").reduce((a, p) => a + p.total, 0),
    received: pos.filter(p => p.status === "received").reduce((a, p) => a + p.total, 0),
    pending:  pos.filter(p => p.status === "sent" || p.status === "partial").length,
    drafts:   pos.filter(p => p.status === "draft").length,
  }), [pos])

  const cols: Column<MockPO>[] = [
    { key: "po",      label: "PO #",     width: 140, render: (p) => <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: T.tx }}>{p.poNumber}</span> },
    { key: "supplier", label: "Supplier", render: (p) => p.supplier },
    { key: "date",    label: "Issued",   width: 120, render: (p) => dateShort(p.date) },
    { key: "expected", label: "Expected", width: 120, render: (p) => <span style={{ color: T.txM }}>{dateShort(p.expectedDate)}</span> },
    { key: "items",   label: "Lines",    width: 80, align: "right", render: (p) => p.items.length },
    { key: "total",   label: "Total",    width: 130, align: "right", render: (p) => <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.amber }}>{money(p.total, { compact: true })}</span> },
    { key: "status",  label: "Status",   width: 130, render: (p) => <Pill tone={STATUS_TONE[p.status]} dot>{p.status}</Pill> },
  ]

  return (
    <>
      <Page
        title="Purchase Orders"
        subtitle="Raise POs, track delivery, and post goods received notes against your ledger."
        accent="amber"
        action={<Button icon="plus" onClick={() => setShowNew(true)}>New PO</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Open Order Value"  value={money(totals.open, { compact: true })}     accent="amber"   icon="po" />
          <Stat label="Pending Receipt"   value={totals.pending}                                              icon="orders" />
          <Stat label="Received YTD"      value={money(totals.received, { compact: true })} accent="emerald" icon="check" />
          <Stat label="Drafts"            value={totals.drafts}                              accent="sky"     icon="edit" />
        </div>

        <Section
          title="PO Activity"
          sub="Drafts, in-flight orders and historical receipts."
          action={
            <div style={{ width: 280 }}>
              <SearchBar value={query} onChange={setQuery} placeholder="PO number or supplier…" />
            </div>
          }
        >
          <Tabs<View>
            value={view}
            onChange={setView}
            accent="amber"
            tabs={[
              { key: "all",       label: "All",       count: pos.length },
              { key: "draft",     label: "Drafts",    count: pos.filter(p => p.status === "draft").length },
              { key: "sent",      label: "Sent",      count: pos.filter(p => p.status === "sent").length },
              { key: "partial",   label: "Partial",   count: pos.filter(p => p.status === "partial").length },
              { key: "received",  label: "Received",  count: pos.filter(p => p.status === "received").length },
              { key: "cancelled", label: "Cancelled", count: pos.filter(p => p.status === "cancelled").length },
            ]}
          />

          {filtered.length === 0 ? (
            <Empty icon="po" title="No POs match this filter" />
          ) : (
            <DataTable rows={filtered} columns={cols} onRowClick={(p) => { setActive(p); setDrawerOpen(true) }} />
          )}
        </Section>
      </Page>

      <PODrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} po={active} />
      <NewPODrawer open={showNew} onClose={() => setShowNew(false)} />
    </>
  )
}

function PODrawer({ open, onClose, po }: { open: boolean; onClose: () => void; po: MockPO | null }) {
  if (!po) return <Drawer open={open} onClose={onClose} title="Purchase Order">{null}</Drawer>
  return (
    <Drawer
      open={open} onClose={onClose}
      title={po.poNumber}
      subtitle={`${po.supplier} — issued ${dateShort(po.date)}`}
      width={580}
      footer={
        <>
          <Button variant="ghost" icon="print">Print</Button>
          <Button variant="outline" icon="share">Send</Button>
          {po.status !== "received" && po.status !== "cancelled" && (
            <Button icon="check">Receive Goods</Button>
          )}
        </>
      }
    >
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Pill tone={STATUS_TONE[po.status]} dot>{po.status}</Pill>
            <div style={{ fontSize: 32, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1 }}>
              {money(po.total)}
            </div>
            <div style={{ fontSize: 11, color: T.txD, marginTop: 4, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
              Order Total
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.txM }}>Expected</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, marginTop: 2 }}>{dateShort(po.expectedDate)}</div>
          </div>
        </div>
      </Card>

      <Section title={`Line Items (${po.items.length})`}>
        <Card padding={0}>
          <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "1fr 70px 90px 110px", gap: 12, alignItems: "center" }}>
            <Th>Item</Th><Th align="right">Qty</Th><Th align="right">Cost</Th><Th align="right">Subtotal</Th>
          </div>
          {po.items.map((it, idx) => {
            const sub = it.qty * it.cost
            return (
              <div key={idx} style={{ padding: "14px 18px", borderBottom: idx === po.items.length - 1 ? "none" : `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "1fr 70px 90px 110px", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>{it.name}</div>
                  <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>per {it.unit}</div>
                </div>
                <div style={{ textAlign: "right", fontSize: 13, fontFamily: "'DM Mono', monospace", color: T.tx }}>{it.qty}</div>
                <div style={{ textAlign: "right", fontSize: 13, fontFamily: "'DM Mono', monospace", color: T.txM }}>{money(it.cost, { symbol: false })}</div>
                <div style={{ textAlign: "right", fontSize: 14, fontWeight: 700, color: T.amber, fontFamily: "'Space Grotesk', sans-serif" }}>{money(sub, { symbol: false })}</div>
              </div>
            )
          })}
          <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", borderTop: `1px solid ${T.border2}`, background: "rgba(245,158,11,0.04)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: T.txM }}>Order Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif" }}>{money(po.total)}</span>
          </div>
        </Card>
      </Section>
    </Drawer>
  )
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, textAlign: align, fontFamily: "'DM Mono', monospace" }}>{children}</span>
}

function NewPODrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [supplierId, setSupplierId] = useState(MOCK_SUPPLIERS[0]?.id ?? "")
  const [expected, setExpected] = useState("")
  const [lines, setLines] = useState([{ name: "", qty: "", unit: "carton", cost: "" }])

  const total = lines.reduce((a, l) => a + (parseFloat(l.qty) || 0) * (parseFloat(l.cost) || 0), 0)

  return (
    <Drawer
      open={open} onClose={onClose}
      title="New Purchase Order"
      subtitle="Drafts save automatically. Send to supplier when ready."
      width={620}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="outline">Save Draft</Button>
          <Button icon="share" onClick={onClose}>Send PO</Button>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Supplier *">
          <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            {MOCK_SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        <Field label="Expected Delivery">
          <Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
        </Field>
      </div>

      <div style={{ marginTop: 12, marginBottom: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace" }}>
        Line Items
      </div>
      <Card padding={0} style={{ marginBottom: 16 }}>
        {lines.map((l, idx) => (
          <div key={idx} style={{ padding: 12, borderBottom: idx === lines.length - 1 ? "none" : `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "1fr 80px 90px 100px 32px", gap: 8, alignItems: "center" }}>
            <Input placeholder="Item name" value={l.name} onChange={(e) => setLines(prev => prev.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))} />
            <Input placeholder="Qty" type="number" value={l.qty} onChange={(e) => setLines(prev => prev.map((p, i) => i === idx ? { ...p, qty: e.target.value } : p))} />
            <Select value={l.unit} onChange={(e) => setLines(prev => prev.map((p, i) => i === idx ? { ...p, unit: e.target.value } : p))}>
              {["piece", "kg", "bag", "bottle", "pack", "carton", "box"].map(u => <option key={u}>{u}</option>)}
            </Select>
            <Input placeholder="Unit cost" type="number" value={l.cost} onChange={(e) => setLines(prev => prev.map((p, i) => i === idx ? { ...p, cost: e.target.value } : p))} />
            <button onClick={() => setLines(prev => prev.filter((_, i) => i !== idx))} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, height: 36, color: T.txM, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        ))}
        <div style={{ padding: 12, borderTop: `1px solid ${T.border}` }}>
          <Button variant="ghost" size="sm" icon="plus" onClick={() => setLines([...lines, { name: "", qty: "", unit: "carton", cost: "" }])}>Add Line</Button>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", borderTop: `1px solid ${T.border2}` }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: T.txM }}>Order Total</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif" }}>{money(total)}</span>
      </div>
    </Drawer>
  )
}
