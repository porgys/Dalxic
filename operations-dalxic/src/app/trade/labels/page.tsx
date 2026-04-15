"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/labels — Barcode label designer + sheet preview
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Input, Select,
  SearchBar, Tabs, Section, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { dateShort } from "@/lib/ops/format"

type View = "designer" | "queue"
type Symbology = "Code128" | "EAN-13" | "QR"
type Preset = "30x20" | "50x30" | "100x50" | "Sheet A4 (24 up)" | "Sheet A4 (40 up)"

interface Product {
  sku: string
  name: string
  price: number
  barcode: string
  category: string
}

const PRODUCTS: Product[] = [
  { sku: "OMO-1KG",   name: "Omo Detergent 1kg",     price: 42, barcode: "6009880123451", category: "Household" },
  { sku: "GES-6PK",   name: "Geisha Soap 6-pack",     price: 24, barcode: "6009880123452", category: "Personal" },
  { sku: "LIP-100",   name: "Lipton Tea 100ct",       price: 32, barcode: "6009880123453", category: "Beverages" },
  { sku: "FAN-VAN",   name: "FanIce Vanilla Tub",     price: 25, barcode: "6009880123454", category: "Frozen" },
  { sku: "PEP-100",   name: "Pepsodent 100g",         price: 22, barcode: "6009880123455", category: "Personal" },
  { sku: "RICE-50",   name: "Royal Aroma Rice 50kg",  price: 220,barcode: "6009880123456", category: "Staples" },
  { sku: "OIL-5L",    name: "Cooking Oil 5L",         price: 58, barcode: "6009880123457", category: "Staples" },
  { sku: "PAM-MAX",   name: "Pampers Diaper Maxi",    price: 120,barcode: "6009880123458", category: "Baby" },
  { sku: "ALW-MEG",   name: "Always Pads Mega",       price: 35, barcode: "6009880123459", category: "Personal" },
  { sku: "ENG-5W30",  name: "Engine Oil 5W-30 4L",    price: 62, barcode: "6009880123460", category: "Auto" },
  { sku: "GTC-CHO",   name: "Golden Tree Drink Choc", price: 48, barcode: "6009880123461", category: "Beverages" },
  { sku: "ALO-200",   name: "Alomo Bitters 200ml",    price: 18, barcode: "6009880123462", category: "Beverages" },
]

interface PrintJob {
  id: string
  date: string
  preset: Preset
  items: number
  status: "draft" | "queued" | "printed" | "failed"
  printer: string
  user: string
}

const JOBS: PrintJob[] = [
  { id: "PJ001", date: "2026-04-15", preset: "50x30",            items: 142, status: "printed", printer: "Zebra ZD220 · Osu",  user: "Linda Sefa" },
  { id: "PJ002", date: "2026-04-15", preset: "Sheet A4 (24 up)", items:  72, status: "queued",  printer: "Brother HL-3170 · Osu", user: "Linda Sefa" },
  { id: "PJ003", date: "2026-04-14", preset: "30x20",            items: 240, status: "printed", printer: "Zebra ZD220 · Osu",  user: "Yaw Mensa" },
  { id: "PJ004", date: "2026-04-13", preset: "100x50",           items:  18, status: "printed", printer: "TSC TE200 · Tema",   user: "Mr. Owusu" },
  { id: "PJ005", date: "2026-04-12", preset: "Sheet A4 (40 up)", items: 120, status: "failed",  printer: "Brother HL-3170 · Osu", user: "Linda Sefa" },
]

const STATUS_TONE: Record<PrintJob["status"], Tone> = {
  draft: "neutral", queued: "amber", printed: "emerald", failed: "red",
}

const PRESET_DIM: Record<Preset, { w: number; h: number; perSheet: number; type: "thermal" | "sheet" }> = {
  "30x20":             { w:  90, h:  60, perSheet:    1, type: "thermal" },
  "50x30":             { w: 150, h:  90, perSheet:    1, type: "thermal" },
  "100x50":            { w: 220, h: 110, perSheet:    1, type: "thermal" },
  "Sheet A4 (24 up)":  { w: 120, h:  72, perSheet:   24, type: "sheet" },
  "Sheet A4 (40 up)":  { w:  96, h:  56, perSheet:   40, type: "sheet" },
}

export default function LabelsPage() {
  return <Shell><LabelsView /></Shell>
}

function LabelsView() {
  const [view, setView] = useState<View>("designer")
  const [query, setQuery] = useState("")

  // Designer state
  const [preset, setPreset] = useState<Preset>("50x30")
  const [symbology, setSymbology] = useState<Symbology>("Code128")
  const [showName, setShowName] = useState(true)
  const [showPrice, setShowPrice] = useState(true)
  const [showBranding, setShowBranding] = useState(true)
  const [selected, setSelected] = useState<Product>(PRODUCTS[0])
  const [activeJob, setActiveJob] = useState<PrintJob | null>(null)
  const [showPrint, setShowPrint] = useState(false)

  const totals = useMemo(() => ({
    skus: PRODUCTS.length,
    queued: JOBS.filter(j => j.status === "queued").length,
    printedToday: JOBS.filter(j => j.status === "printed" && j.date === "2026-04-15").reduce((a, j) => a + j.items, 0),
    presets: Object.keys(PRESET_DIM).length,
  }), [])

  const queueRows = useMemo(() => {
    if (!query) return JOBS
    const q = query.toLowerCase()
    return JOBS.filter(j =>
      j.id.toLowerCase().includes(q) ||
      j.preset.toLowerCase().includes(q) ||
      j.printer.toLowerCase().includes(q) ||
      j.user.toLowerCase().includes(q)
    )
  }, [query])

  const queueCols: Column<PrintJob>[] = [
    { key: "id", label: "Job", width: 100, render: (j) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, color: T.amber, letterSpacing: "0.06em" }}>{j.id}</span>
    )},
    { key: "date", label: "Date", width: 110, render: (j) => dateShort(j.date) },
    { key: "preset", label: "Preset", render: (j) => (
      <div>
        <div style={{ fontWeight: 600, color: T.tx }}>{j.preset}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{j.printer}</div>
      </div>
    )},
    { key: "items", label: "Labels", width: 110, align: "right", render: (j) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, color: T.tx }}>{j.items}</span>
    )},
    { key: "user", label: "By", width: 130, render: (j) => (
      <span style={{ fontSize: 12, color: T.txM }}>{j.user}</span>
    )},
    { key: "status", label: "Status", width: 130, render: (j) => <Pill tone={STATUS_TONE[j.status]} dot>{j.status}</Pill> },
  ]

  const dim = PRESET_DIM[preset]

  return (
    <>
      <Page
        title="Barcode Labels"
        subtitle="Designer, sheet preview, print queue — for shelf tags, price changes, and new SKU rollouts."
        accent="amber"
        action={view === "designer"
          ? <Button icon="print" onClick={() => setShowPrint(true)}>Send To Print</Button>
          : <Button icon="plus" onClick={() => setView("designer")}>New Job</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="SKUs Available"  value={totals.skus}          accent="amber"   icon="labels" />
          <Stat label="Queued Jobs"     value={totals.queued}        accent="sky"     icon="print" />
          <Stat label="Printed Today"   value={totals.printedToday}  accent="emerald" icon="check" />
          <Stat label="Label Presets"   value={totals.presets}       accent="amber"   icon="filter" />
        </div>

        <Tabs<View>
          value={view}
          onChange={setView}
          accent="amber"
          tabs={[
            { key: "designer", label: "Designer",    count: PRODUCTS.length },
            { key: "queue",    label: "Print Queue", count: JOBS.length },
          ]}
        />

        {view === "designer" && (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18, marginTop: 18 }}>
            {/* LEFT — controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Card padding={20}>
                <SectionLabel>Label Preset</SectionLabel>
                <Select value={preset} onChange={(e) => setPreset(e.target.value as Preset)}>
                  {(Object.keys(PRESET_DIM) as Preset[]).map(p => <option key={p}>{p}</option>)}
                </Select>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 11, color: T.txD, fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  <span>{dim.type}</span>
                  <span>{dim.perSheet} per sheet</span>
                </div>
              </Card>

              <Card padding={20}>
                <SectionLabel>Barcode Symbology</SectionLabel>
                <Select value={symbology} onChange={(e) => setSymbology(e.target.value as Symbology)}>
                  <option>Code128</option>
                  <option>EAN-13</option>
                  <option>QR</option>
                </Select>
              </Card>

              <Card padding={20}>
                <SectionLabel>Show On Label</SectionLabel>
                <Toggle label="Product name"     checked={showName}     onChange={setShowName} />
                <Toggle label="Price (GHS)"      checked={showPrice}    onChange={setShowPrice} />
                <Toggle label="DalxicTrade brand"checked={showBranding} onChange={setShowBranding} last />
              </Card>

              <Card padding={20}>
                <SectionLabel>Pick Product</SectionLabel>
                <SearchBar value={query} onChange={setQuery} placeholder="SKU or name…" />
                <div style={{ marginTop: 12, maxHeight: 260, overflowY: "auto", borderTop: `1px solid ${T.border}` }}>
                  {PRODUCTS.filter(p =>
                    !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())
                  ).map(p => (
                    <button
                      key={p.sku}
                      onClick={() => setSelected(p)}
                      style={{
                        appearance: "none", textAlign: "left", cursor: "pointer", display: "block", width: "100%",
                        padding: "12px 0", borderBottom: `1px solid ${T.border}`, background: "none", border: "none", borderTop: "none", borderLeft: "none", borderRight: "none",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: selected.sku === p.sku ? 800 : 600, color: selected.sku === p.sku ? T.amber : T.tx }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: T.txM, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{p.sku}</div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.emerald, fontFamily: "'Space Grotesk', sans-serif" }}>GHS {p.price}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* RIGHT — preview */}
            <Card padding={28} accent="amber">
              <SectionLabel>Preview · {preset}</SectionLabel>

              <div style={{ display: "flex", justifyContent: "center", padding: "30px 0" }}>
                <Label
                  product={selected}
                  symbology={symbology}
                  showName={showName}
                  showPrice={showPrice}
                  showBranding={showBranding}
                  width={dim.w * 1.6}
                  height={dim.h * 1.6}
                />
              </div>

              {dim.type === "sheet" && (
                <>
                  <SectionLabel>Sheet Layout</SectionLabel>
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${dim.perSheet === 24 ? 4 : 5}, 1fr)`, gap: 6, padding: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, borderRadius: 10 }}>
                    {Array.from({ length: dim.perSheet }).map((_, i) => (
                      <Label
                        key={i}
                        product={selected}
                        symbology={symbology}
                        showName={showName}
                        showPrice={showPrice}
                        showBranding={showBranding}
                        width={dim.w * 0.55}
                        height={dim.h * 0.55}
                        compact
                      />
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {view === "queue" && (
          <Section title="Print Queue" sub="Recent jobs across all printers and branches." action={
            <div style={{ width: 280 }}>
              <SearchBar value={query} onChange={setQuery} placeholder="Job, printer, user…" />
            </div>
          }>
            <DataTable rows={queueRows} columns={queueCols} onRowClick={(j) => setActiveJob(j)} />
          </Section>
        )}
      </Page>

      <JobDrawer job={activeJob} onClose={() => setActiveJob(null)} />
      <PrintDrawer
        open={showPrint}
        onClose={() => setShowPrint(false)}
        product={selected}
        preset={preset}
      />
    </>
  )
}

/* ─────────────────────────────  THE LABEL  ───────────────────────────── */
function Label({ product, symbology, showName, showPrice, showBranding, width, height, compact = false }: {
  product: Product; symbology: Symbology; showName: boolean; showPrice: boolean; showBranding: boolean;
  width: number; height: number; compact?: boolean;
}) {
  return (
    <div style={{
      width, height,
      background: "#FFFFFF",
      color: "#000",
      borderRadius: 6,
      padding: compact ? 6 : 10,
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      boxShadow: compact ? "none" : "0 12px 30px rgba(0,0,0,0.5), 0 4px 12px rgba(245,158,11,0.18)",
      fontFamily: "'DM Mono', monospace",
      border: compact ? "1px dashed #ddd" : "none",
      overflow: "hidden",
    }}>
      {showBranding && (
        <div style={{
          fontSize: compact ? 7 : 9, fontWeight: 800, letterSpacing: "0.18em",
          textTransform: "uppercase", textAlign: "center", color: "#222",
        }}>
          DALXIC TRADE
        </div>
      )}

      {showName && (
        <div style={{
          fontSize: compact ? 7 : 11, fontWeight: 700, textAlign: "center",
          fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.1,
          padding: compact ? "1px 0" : "2px 0",
        }}>
          {product.name}
        </div>
      )}

      {/* Barcode visual */}
      <div style={{ display: "flex", justifyContent: "center", padding: compact ? 0 : 4 }}>
        {symbology === "QR" ? (
          <div style={{
            width: compact ? height * 0.55 : height * 0.45,
            height: compact ? height * 0.55 : height * 0.45,
            background: "repeating-conic-gradient(#000 0 25%, transparent 0 50%) 50% / 8% 8%",
            border: "2px solid #000",
          }} />
        ) : (
          <BarcodeBars compact={compact} />
        )}
      </div>

      {/* Number row */}
      <div style={{
        textAlign: "center",
        fontSize: compact ? 6 : 8,
        letterSpacing: "0.06em", fontWeight: 700,
      }}>
        {product.barcode}
      </div>

      {showPrice && (
        <div style={{
          textAlign: "center",
          fontSize: compact ? 9 : 14,
          fontWeight: 800,
          fontFamily: "'Space Grotesk', sans-serif",
          color: "#000",
          letterSpacing: "-0.01em",
        }}>
          GHS {product.price.toFixed(2)}
        </div>
      )}
    </div>
  )
}

function BarcodeBars({ compact }: { compact: boolean }) {
  const widths = [2, 1, 3, 1, 2, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 2, 1, 3, 2, 1, 2, 1, 1, 2, 3, 1, 2, 1]
  return (
    <div style={{ display: "flex", alignItems: "stretch", height: compact ? 22 : 36, gap: 1 }}>
      {widths.map((w, i) => (
        <div key={i} style={{ width: w, background: i % 2 === 0 ? "#000" : "#fff", height: "100%" }} />
      ))}
    </div>
  )
}

function Toggle({ label, checked, onChange, last = false }: { label: string; checked: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  return (
    <label style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: last ? "none" : `1px solid ${T.border}`,
      cursor: "pointer", fontSize: 13, color: T.tx,
    }}>
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        style={{
          appearance: "none", border: "none", cursor: "pointer",
          width: 36, height: 22, borderRadius: 11, padding: 0,
          background: checked ? T.amber : T.border,
          position: "relative", transition: "background 0.18s ease",
        }}
      >
        <span style={{
          position: "absolute", top: 2, left: checked ? 16 : 2,
          width: 18, height: 18, borderRadius: 9,
          background: "#FFF",
          transition: "left 0.18s ease",
        }} />
      </button>
    </label>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, letterSpacing: "0.18em",
      textTransform: "uppercase", color: T.txD,
      fontFamily: "'DM Mono', monospace", marginBottom: 12,
    }}>{children}</div>
  )
}

/* ─────────────────────────────  JOB DRAWER  ───────────────────────────── */
function JobDrawer({ job, onClose }: { job: PrintJob | null; onClose: () => void }) {
  if (!job) return <Drawer open={false} onClose={onClose} title="Job">{null}</Drawer>
  return (
    <Drawer
      open={!!job} onClose={onClose}
      title={job.id}
      subtitle={`${job.preset} · ${job.printer}`}
      width={460}
      footer={
        job.status === "failed"
          ? <Button icon="print">Retry Print</Button>
          : job.status === "queued"
          ? <Button variant="ghost" icon="close">Cancel Job</Button>
          : <Button variant="ghost" icon="share">Reprint</Button>
      }
    >
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <Pill tone={STATUS_TONE[job.status]} dot>{job.status}</Pill>
        <div style={{ fontSize: 32, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {job.items}
        </div>
        <div style={{ fontSize: 11, color: T.txD, marginTop: 4, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Labels</div>
      </Card>

      <Section title="Detail">
        <Card padding={20}>
          <RowKV label="Job ID" value={job.id} mono />
          <RowKV label="Date" value={dateShort(job.date)} />
          <RowKV label="Preset" value={job.preset} />
          <RowKV label="Printer" value={job.printer} />
          <RowKV label="Submitted by" value={job.user} last />
        </Card>
      </Section>
    </Drawer>
  )
}

function RowKV({ label, value, mono = false, last = false }: { label: string; value: React.ReactNode; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.txM }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.tx, fontFamily: mono ? "'DM Mono', monospace" : "'Space Grotesk', sans-serif" }}>{value}</span>
    </div>
  )
}

/* ─────────────────────────────  PRINT DRAWER  ───────────────────────────── */
function PrintDrawer({ open, onClose, product, preset }: { open: boolean; onClose: () => void; product: Product; preset: Preset }) {
  const [count, setCount] = useState("12")
  const [printer, setPrinter] = useState("Zebra ZD220 · Osu")
  return (
    <Drawer
      open={open} onClose={onClose}
      title="Send To Print"
      subtitle={`${product.name} · ${preset}`}
      width={460}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="print" onClick={onClose}>Queue Print</Button>
        </>
      }
    >
      <Field label="Quantity *">
        <Input value={count} onChange={(e) => setCount(e.target.value)} placeholder="12" />
      </Field>
      <Field label="Printer *">
        <Select value={printer} onChange={(e) => setPrinter(e.target.value)}>
          <option>Zebra ZD220 · Osu</option>
          <option>Brother HL-3170 · Osu</option>
          <option>TSC TE200 · Tema</option>
          <option>Brother HL-3170 · Kumasi</option>
        </Select>
      </Field>
      <Card padding={16} style={{ marginTop: 14, background: `${T.amber}0A`, border: `1px dashed ${T.amber}40` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.amber, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Heads up</div>
        <div style={{ fontSize: 12, color: T.txM, lineHeight: 1.5 }}>
          Sheet presets round up to the nearest full sheet. Thermal presets print one label per request — bring extra ribbon.
        </div>
      </Card>
    </Drawer>
  )
}
