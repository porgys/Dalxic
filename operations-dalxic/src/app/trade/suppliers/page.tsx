"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/suppliers — Vendor master + ledger drawer
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Input, Select,
  TextArea, SearchBar, Tabs, Section, Empty, T, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_SUPPLIERS, MockSupplier, MOCK_POS } from "@/lib/ops/mock"
import { money, dateShort } from "@/lib/ops/format"

type View = "all" | "active" | "outstanding" | "on_hold"

export default function SuppliersPage() {
  return <Shell><SuppliersView /></Shell>
}

function SuppliersView() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [suppliers] = useState<MockSupplier[]>(MOCK_SUPPLIERS)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [active, setActive] = useState<MockSupplier | null>(null)
  const [showNew, setShowNew] = useState(false)

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      if (view === "active"      && s.status !== "active") return false
      if (view === "outstanding" && s.outstanding === 0) return false
      if (view === "on_hold"     && s.status !== "on_hold") return false
      if (!query) return true
      const q = query.toLowerCase()
      return s.name.toLowerCase().includes(q) || s.contact.toLowerCase().includes(q) || s.phone.includes(q) || s.category.toLowerCase().includes(q)
    })
  }, [suppliers, view, query])

  const totals = useMemo(() => ({
    total: suppliers.length,
    active: suppliers.filter(s => s.status === "active").length,
    outstanding: suppliers.reduce((a, s) => a + s.outstanding, 0),
    ytd: suppliers.reduce((a, s) => a + s.ytdPurchases, 0),
  }), [suppliers])

  const cols: Column<MockSupplier>[] = [
    { key: "name", label: "Supplier", render: (s) => (
      <div>
        <div style={{ fontWeight: 600, color: T.tx }}>{s.name}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{s.contact} — {s.phone}</div>
      </div>
    )},
    { key: "category", label: "Category", width: 170, render: (s) => <Pill tone="emerald">{s.category}</Pill> },
    { key: "terms",    label: "Terms",    width: 90,  render: (s) => <span style={{ fontFamily: "'DM Mono', monospace", color: T.txM, fontSize: 11 }}>{s.paymentTerms}</span> },
    { key: "ytd",      label: "YTD Purchases", width: 140, align: "right", render: (s) => <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.emerald }}>{money(s.ytdPurchases, { compact: true })}</span> },
    { key: "outstanding", label: "Outstanding", width: 130, align: "right", render: (s) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: s.outstanding > 0 ? T.amber : T.txM }}>
        {money(s.outstanding, { compact: true })}
      </span>
    )},
    { key: "rating", label: "Rating", width: 100, render: (s) => <Rating value={s.rating} /> },
    { key: "status", label: "Status", width: 110, render: (s) => <Pill tone={s.status === "active" ? "emerald" : "amber"} dot>{s.status === "on_hold" ? "On Hold" : s.status}</Pill> },
  ]

  return (
    <>
      <Page
        title="Suppliers"
        subtitle="Vendor directory, purchase history, payment terms, and outstanding balances."
        accent="amber"
        action={<Button icon="plus" onClick={() => setShowNew(true)}>New Supplier</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Suppliers"   value={totals.total}                                        icon="suppliers" />
          <Stat label="Active"             value={totals.active}                       accent="emerald" icon="check" />
          <Stat label="Outstanding Owed"   value={money(totals.outstanding, { compact: true })} accent="amber" icon="financials" />
          <Stat label="YTD Purchases"      value={money(totals.ytd, { compact: true })}        accent="sky"   icon="po" />
        </div>

        <Section
          title="Vendor Directory"
          sub="Open a row to see ledger, contact and recent POs."
          action={
            <div style={{ width: 280 }}>
              <SearchBar value={query} onChange={setQuery} placeholder="Name, contact, category…" />
            </div>
          }
        >
          <Tabs<View>
            value={view}
            onChange={setView}
            accent="amber"
            tabs={[
              { key: "all",         label: "All",         count: suppliers.length },
              { key: "active",      label: "Active",      count: suppliers.filter(s => s.status === "active").length },
              { key: "outstanding", label: "Owed Money",  count: suppliers.filter(s => s.outstanding > 0).length },
              { key: "on_hold",     label: "On Hold",     count: suppliers.filter(s => s.status === "on_hold").length },
            ]}
          />

          {filtered.length === 0 ? (
            <Empty icon="suppliers" title="No suppliers match" />
          ) : (
            <DataTable rows={filtered} columns={cols} onRowClick={(s) => { setActive(s); setDrawerOpen(true) }} />
          )}
        </Section>
      </Page>

      <SupplierDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} supplier={active} />
      <NewSupplierDrawer open={showNew} onClose={() => setShowNew(false)} />
    </>
  )
}

function Rating({ value }: { value: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{
          width: 10, height: 10, borderRadius: 2,
          background: i <= value ? T.amber : `${T.amber}15`,
          display: "inline-block",
        }} />
      ))}
    </div>
  )
}

function SupplierDrawer({ open, onClose, supplier }: { open: boolean; onClose: () => void; supplier: MockSupplier | null }) {
  if (!supplier) return <Drawer open={open} onClose={onClose} title="Supplier">{null}</Drawer>
  const recentPOs = MOCK_POS.filter(p => p.supplierId === supplier.id).slice(0, 5)
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={supplier.name}
      subtitle={`${supplier.contact} — ${supplier.phone}`}
      width={540}
      footer={
        <>
          <Button variant="ghost" icon="phone">Call</Button>
          <Button variant="outline" icon="po">New PO</Button>
          <Button icon="edit">Edit</Button>
        </>
      }
    >
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Pill tone="emerald">{supplier.category}</Pill>
            <div style={{ fontSize: 32, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1 }}>
              {money(supplier.ytdPurchases, { compact: true })}
            </div>
            <div style={{ fontSize: 11, color: T.txD, marginTop: 4, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
              YTD Purchases
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.txM, marginBottom: 4 }}>Rating</div>
            <Rating value={supplier.rating} />
            <div style={{ fontSize: 11, color: T.txM, marginTop: 12 }}>Payment Terms</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, marginTop: 2 }}>{supplier.paymentTerms}</div>
          </div>
        </div>
      </Card>

      <Section title="Account Balance">
        <Card padding={20}>
          <Row label="YTD Purchases" value={money(supplier.ytdPurchases)} valueColor={T.emerald} />
          <Row label="Outstanding Owed" value={money(supplier.outstanding)} valueColor={supplier.outstanding > 0 ? T.amber : T.txM} last />
        </Card>
      </Section>

      <Section title={`Recent Purchase Orders (${recentPOs.length})`}>
        {recentPOs.length === 0 ? (
          <Empty icon="po" title="No POs yet" sub="Create one from the Purchase Orders module." />
        ) : (
          <Card padding={0}>
            {recentPOs.map((po, idx) => (
              <div key={po.id} style={{ padding: "14px 18px", borderBottom: idx === recentPOs.length - 1 ? "none" : `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.tx, fontFamily: "'DM Mono', monospace" }}>{po.poNumber}</div>
                  <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{dateShort(po.date)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Pill tone={po.status === "received" ? "emerald" : po.status === "cancelled" ? "red" : "amber"} dot>{po.status}</Pill>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", minWidth: 90, textAlign: "right" }}>{money(po.total, { compact: true })}</span>
                </div>
              </div>
            ))}
          </Card>
        )}
      </Section>
    </Drawer>
  )
}

function Row({ label, value, valueColor, last = false }: { label: string; value: React.ReactNode; valueColor?: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.txM }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: valueColor ?? T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</span>
    </div>
  )
}

function NewSupplierDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [category, setCategory] = useState("FMCG")
  const [terms, setTerms] = useState("Net 30")
  const [notes, setNotes] = useState("")
  return (
    <Drawer
      open={open} onClose={onClose}
      title="New Supplier"
      subtitle="Add a vendor before you raise the first purchase order."
      width={480}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="check" onClick={onClose}>Save Supplier</Button>
        </>
      }
    >
      <Field label="Supplier Name *">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ashfoam Wholesale Ltd" />
      </Field>
      <Field label="Primary Contact">
        <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Mr. Frimpong" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Phone *">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 30 222 1100" />
        </Field>
        <Field label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="orders@example.com" />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {["FMCG", "Bedding & Foam", "Dairy & Frozen", "Beverages", "Hardware & Auto", "Grains & Staples", "Confectionery", "Other"].map(c => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Payment Terms">
          <Select value={terms} onChange={(e) => setTerms(e.target.value)}>
            {["COD", "Net 7", "Net 14", "Net 30", "Net 45", "Net 60"].map(t => <option key={t}>{t}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Notes">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bulk discount on cartons over 50, prefers WhatsApp for urgent orders." />
      </Field>
    </Drawer>
  )
}
