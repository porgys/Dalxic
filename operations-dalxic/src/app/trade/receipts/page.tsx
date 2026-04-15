"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/receipts — Receipt ledger + preview, print, share
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Input, TextArea,
  SearchBar, Tabs, Section, Empty, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_RECEIPTS, MockReceipt } from "@/lib/ops/mock"
import { money, dateShort } from "@/lib/ops/format"

type View = "all" | "paid" | "credit" | "voided"

const STATUS_TONE: Record<MockReceipt["status"], Tone> = {
  paid: "emerald", voided: "red", credit: "amber",
}

const METHOD_TONE: Record<MockReceipt["method"], Tone> = {
  Cash: "neutral", "Mobile Money": "amber", Card: "sky", Mixed: "neutral",
}

export default function ReceiptsPage() {
  return <Shell><ReceiptsView /></Shell>
}

function ReceiptsView() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [receipts] = useState<MockReceipt[]>(MOCK_RECEIPTS)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [active, setActive] = useState<MockReceipt | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      if (view !== "all" && r.status !== view) return false
      if (!query) return true
      const q = query.toLowerCase()
      return r.code.toLowerCase().includes(q) ||
             (r.customer?.toLowerCase().includes(q) ?? false) ||
             r.cashier.toLowerCase().includes(q) ||
             r.items.some(i => i.name.toLowerCase().includes(q))
    })
  }, [receipts, view, query])

  const totals = useMemo(() => ({
    count:    receipts.filter(r => r.status === "paid").length,
    revenue:  receipts.filter(r => r.status === "paid").reduce((a, r) => a + r.total, 0),
    avg:      (() => {
      const paid = receipts.filter(r => r.status === "paid")
      return paid.length ? paid.reduce((a, r) => a + r.total, 0) / paid.length : 0
    })(),
    credit:   receipts.filter(r => r.status === "credit").reduce((a, r) => a + r.total, 0),
  }), [receipts])

  const cols: Column<MockReceipt>[] = [
    { key: "code", label: "Receipt", width: 110, render: (r) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: T.tx }}>{r.code}</span>
    )},
    { key: "time", label: "Time", width: 110, render: (r) => (
      <div>
        <div style={{ fontSize: 12, color: T.tx }}>{r.time}</div>
        <div style={{ fontSize: 10, color: T.txM, marginTop: 1, fontFamily: "'DM Mono', monospace" }}>{dateShort(r.date)}</div>
      </div>
    )},
    { key: "cashier", label: "Cashier", width: 130, render: (r) => r.cashier },
    { key: "customer", label: "Customer", render: (r) => (
      <span style={{ color: r.customer ? T.tx : T.txD }}>{r.customer ?? "Walk-in"}</span>
    )},
    { key: "items", label: "Lines", width: 70, align: "right", render: (r) => r.items.length },
    { key: "method", label: "Method", width: 130, render: (r) => <Pill tone={METHOD_TONE[r.method]}>{r.method}</Pill> },
    { key: "total", label: "Total", width: 130, align: "right", render: (r) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.amber }}>{money(r.total)}</span>
    )},
    { key: "status", label: "Status", width: 110, render: (r) => <Pill tone={STATUS_TONE[r.status]} dot>{r.status}</Pill> },
  ]

  return (
    <>
      <Page
        title="Receipts"
        subtitle="Reprint, resend, void or share any sale receipt — the full audit trail at your fingertips."
        accent="amber"
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outline" icon="settings" onClick={() => setShowSettings(true)}>Template</Button>
            <Button icon="plus">New Sale</Button>
          </div>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Receipts Today"     value={totals.count}                                              icon="orders" />
          <Stat label="Gross Revenue"      value={money(totals.revenue, { compact: true })} accent="amber"   icon="financials" />
          <Stat label="Avg Basket"         value={money(totals.avg,     { compact: true })} accent="emerald" icon="analytics" />
          <Stat label="On Credit"          value={money(totals.credit,  { compact: true })} accent="sky"     icon="customers" />
        </div>

        <Section
          title="Today's Receipts"
          sub="Open any row to preview, reprint, or send to the customer."
          action={
            <div style={{ width: 280 }}>
              <SearchBar value={query} onChange={setQuery} placeholder="Receipt, cashier, item, customer…" />
            </div>
          }
        >
          <Tabs<View>
            value={view}
            onChange={setView}
            accent="amber"
            tabs={[
              { key: "all",    label: "All",    count: receipts.length },
              { key: "paid",   label: "Paid",   count: receipts.filter(r => r.status === "paid").length },
              { key: "credit", label: "Credit", count: receipts.filter(r => r.status === "credit").length },
              { key: "voided", label: "Voided", count: receipts.filter(r => r.status === "voided").length },
            ]}
          />

          {filtered.length === 0 ? (
            <Empty icon="orders" title="No receipts match" sub="Try a different filter or search." />
          ) : (
            <DataTable rows={filtered} columns={cols} onRowClick={(r) => { setActive(r); setDrawerOpen(true) }} />
          )}
        </Section>
      </Page>

      <ReceiptDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} receipt={active} />
      <TemplateDrawer open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}

/* ───── Receipt preview drawer ───── */

function ReceiptDrawer({ open, onClose, receipt }: { open: boolean; onClose: () => void; receipt: MockReceipt | null }) {
  if (!receipt) return <Drawer open={open} onClose={onClose} title="Receipt">{null}</Drawer>
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={receipt.code}
      subtitle={`${dateShort(receipt.date)} · ${receipt.time} · ${receipt.cashier}`}
      width={560}
      footer={
        <>
          <Button variant="ghost" icon="download">PDF</Button>
          <Button variant="outline" icon="mail">Email</Button>
          <Button variant="outline" icon="whatsapp">WhatsApp</Button>
          <Button icon="print">Print</Button>
        </>
      }
    >
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <Pill tone={STATUS_TONE[receipt.status]} dot>{receipt.status}</Pill>
        <Pill tone={METHOD_TONE[receipt.method]}>{receipt.method}</Pill>
        {receipt.momoRef && (
          <Pill tone="neutral">Ref {receipt.momoRef}</Pill>
        )}
      </div>

      <ReceiptPaper r={receipt} />

      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <ActionTile icon="edit"   label="Reprint Header" sub="Customer, branch, cashier" />
        <ActionTile icon="share"  label="Send To Display" sub="Push to customer-facing screen" />
        <ActionTile icon="trash"  label="Void Receipt"   sub="Requires manager PIN" tone="red" />
        <ActionTile icon="orders" label="Issue Refund"   sub="Refund flow with restock" />
      </div>
    </Drawer>
  )
}

function ActionTile({ icon, label, sub, tone = "neutral" }: { icon: any; label: string; sub: string; tone?: "neutral" | "red" }) {
  const accent = tone === "red" ? T.red : T.amber
  return (
    <button style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
      borderRadius: 12, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.02)",
      cursor: "pointer", textAlign: "left", transition: "all 0.18s ease",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: `${accent}15`, color: accent,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon name={icon} size={15} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.tx }}>{label}</div>
        <div style={{ fontSize: 10, color: T.txM, marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  )
}

/* ───── The actual receipt paper (thermal-style, on-screen replica) ───── */

function ReceiptPaper({ r }: { r: MockReceipt }) {
  return (
    <div style={{
      background: "#FFFFFF",
      color: "#0B1218",
      borderRadius: 14,
      padding: "28px 26px 22px",
      boxShadow: "0 24px 60px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.25)",
      border: "1px solid rgba(255,255,255,0.05)",
      fontFamily: "'DM Mono', monospace",
      lineHeight: 1.5,
    }}>
      {/* brand */}
      <div style={{ textAlign: "center", marginBottom: 16, paddingBottom: 14, borderBottom: "1px dashed rgba(11,18,24,0.25)" }}>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>
          Dalxic <span style={{ color: T.amber }}>Trade</span>
        </div>
        <div style={{ fontSize: 11, marginTop: 4, color: "#4A5660" }}>Worlds Best Operations Software</div>
        <div style={{ fontSize: 10, marginTop: 8, color: "#4A5660" }}>{r.branch} Branch · Osu, Accra</div>
        <div style={{ fontSize: 10, color: "#4A5660" }}>+233 30 222 1100 · trade@dalxic.com</div>
      </div>

      {/* meta */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, marginBottom: 14 }}>
        <Meta label="Receipt"  value={r.code} />
        <Meta label="Date"     value={`${dateShort(r.date)} ${r.time}`} align="right" />
        <Meta label="Cashier"  value={r.cashier} />
        <Meta label="Method"   value={r.method} align="right" />
        {r.customer && <Meta label="Customer" value={r.customer} />}
        {r.customerPhone && <Meta label="Phone" value={r.customerPhone} align="right" />}
      </div>

      {/* items */}
      <div style={{ borderTop: "1px dashed rgba(11,18,24,0.25)", borderBottom: "1px dashed rgba(11,18,24,0.25)", padding: "10px 0", marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 60px 70px", gap: 8, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6B7680", marginBottom: 8 }}>
          <span>Item</span>
          <span style={{ textAlign: "right" }}>Qty</span>
          <span style={{ textAlign: "right" }}>Price</span>
          <span style={{ textAlign: "right" }}>Total</span>
        </div>
        {r.items.map((it, idx) => (
          <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 40px 60px 70px", gap: 8, fontSize: 11, padding: "4px 0", color: "#0B1218" }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{it.name}</span>
            <span style={{ textAlign: "right" }}>{it.qty}</span>
            <span style={{ textAlign: "right", color: "#4A5660" }}>{money(it.price, { symbol: false })}</span>
            <span style={{ textAlign: "right", fontWeight: 700 }}>{money(it.qty * it.price, { symbol: false })}</span>
          </div>
        ))}
      </div>

      {/* totals */}
      <div style={{ fontSize: 11 }}>
        <Line label="Subtotal" value={money(r.subtotal)} />
        <Line label="VAT (15%)" value={money(r.vat)} muted />
        <Line label="NHIL (2.5%)" value={money(r.nhil)} muted />
        <Line label="GETFund (2.5%)" value={money(r.getfund)} muted />
        <Line label="COVID-19 (1%)" value={money(r.covid)} muted />
        <div style={{ borderTop: "1px solid rgba(11,18,24,0.35)", marginTop: 8, paddingTop: 8 }}>
          <Line label="TOTAL" value={money(r.total)} bold />
        </div>
        {r.status === "paid" && (
          <>
            <Line label={`Paid (${r.method})`} value={money(r.paid)} />
            {r.change > 0 && <Line label="Change" value={money(r.change)} />}
          </>
        )}
        {r.status === "credit" && (
          <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(245,158,11,0.12)", borderRadius: 6, color: "#8a5a00", fontSize: 11, textAlign: "center", fontWeight: 700 }}>
            ON CREDIT · Settle within terms
          </div>
        )}
        {r.status === "voided" && (
          <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(239,68,68,0.12)", borderRadius: 6, color: "#9a1a1a", fontSize: 11, textAlign: "center", fontWeight: 700 }}>
            *** VOIDED *** Not Valid
          </div>
        )}
      </div>

      {/* footer */}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px dashed rgba(11,18,24,0.25)", textAlign: "center", fontSize: 10, color: "#4A5660" }}>
        <div style={{ marginBottom: 4 }}>Thank You — Come Again</div>
        <div>GRA TIN · C0001234567 · VAT Reg · 123456</div>
        <div style={{ marginTop: 12, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.4em", fontSize: 14, fontWeight: 800 }}>
          {r.code}
        </div>
        <div style={{ marginTop: 4, fontSize: 9 }}>Powered by Dalxic · ops.dalxic.com</div>
      </div>
    </div>
  )
}

function Meta({ label, value, align = "left" }: { label: string; value: string; align?: "left" | "right" }) {
  return (
    <div style={{ textAlign: align }}>
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6B7680" }}>{label}</div>
      <div style={{ fontSize: 11, color: "#0B1218", fontWeight: 600, marginTop: 1 }}>{value}</div>
    </div>
  )
}

function Line({ label, value, bold = false, muted = false }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: muted ? "#4A5660" : "#0B1218" }}>
      <span style={{ fontWeight: bold ? 800 : 500, fontSize: bold ? 13 : 11 }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 600, fontSize: bold ? 14 : 11 }}>{value}</span>
    </div>
  )
}

/* ───── Template settings drawer ───── */

function TemplateDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [orgName, setOrgName] = useState("Dalxic Trade")
  const [tagline, setTagline] = useState("Worlds Best Operations Software")
  const [address, setAddress] = useState("Osu Main Branch · Osu, Accra")
  const [phone, setPhone] = useState("+233 30 222 1100")
  const [tin, setTin] = useState("C0001234567")
  const [vatReg, setVatReg] = useState("123456")
  const [footer, setFooter] = useState("Thank You — Come Again")
  const [showLogo, setShowLogo] = useState(true)
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(true)
  const [showQR, setShowQR] = useState(true)
  const [paperSize, setPaperSize] = useState<"80mm" | "58mm" | "A4">("80mm")

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Receipt Template"
      subtitle="Customise what every printed and emailed receipt shows."
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="outline" icon="print">Print Test</Button>
          <Button icon="check" onClick={onClose}>Save Template</Button>
        </>
      }
    >
      <Section title="Header">
        <Field label="Business Name *">
          <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
        </Field>
        <Field label="Tagline" hint="Shown directly under the brand name.">
          <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </Field>
        <Field label="Address Line">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <Field label="Phone / Contact">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </Section>

      <Section title="Compliance">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="GRA TIN">
            <Input value={tin} onChange={(e) => setTin(e.target.value)} />
          </Field>
          <Field label="VAT Reg #">
            <Input value={vatReg} onChange={(e) => setVatReg(e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Footer & Layout">
        <Field label="Footer Message">
          <TextArea value={footer} onChange={(e) => setFooter(e.target.value)} />
        </Field>
        <Field label="Paper Size">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {(["80mm", "58mm", "A4"] as const).map(size => (
              <button
                key={size}
                onClick={() => setPaperSize(size)}
                style={{
                  padding: "10px 12px", borderRadius: 10,
                  border: `1px solid ${paperSize === size ? T.amber : T.border}`,
                  background: paperSize === size ? `${T.amber}10` : "transparent",
                  color: paperSize === size ? T.amber : T.txM,
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em",
                }}
              >{size}</button>
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Show On Receipt">
        <Toggle label="Business Logo" sub="Top of receipt" value={showLogo} onChange={setShowLogo} />
        <Toggle label="Itemised Tax Breakdown" sub="VAT, NHIL, GETFund, COVID separately" value={showTaxBreakdown} onChange={setShowTaxBreakdown} />
        <Toggle label="Receipt QR Code" sub="Customers scan to view digital copy" value={showQR} onChange={setShowQR} />
      </Section>
    </Drawer>
  )
}

function Toggle({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 8,
      borderRadius: 10, border: `1px solid ${T.border}`, cursor: "pointer",
      background: value ? "rgba(245,158,11,0.06)" : "transparent",
      transition: "all 0.18s ease",
    }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} style={{ width: 16, height: 16, accentColor: T.amber }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>{label}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{sub}</div>
      </div>
    </label>
  )
}
