"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/tax — Ghana Tax Engine
   VAT (15%), NHIL (2.5%), GETFund (2.5%), COVID-19 Levy (1%)
   Plus GRA E-VAT export queue.
   ═══════════════════════════════════════════════════════════════ */
import { useState } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Input, Select,
  Section, T, Tone, Column, TextArea,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { money, dateShort } from "@/lib/ops/format"

interface TaxPeriod {
  id: string
  period: string
  vatOut: number
  vatIn: number
  nhil: number
  getfund: number
  covid: number
  netDue: number
  status: "filed" | "draft" | "due"
  dueDate: string
}

const PERIODS: TaxPeriod[] = [
  { id: "P-2604", period: "Apr 2026", vatOut:  9420, vatIn: 2840, nhil: 1570, getfund: 1570, covid:  628, netDue:  4580, status: "draft", dueDate: "2026-05-15" },
  { id: "P-2603", period: "Mar 2026", vatOut: 12640, vatIn: 4120, nhil: 2106, getfund: 2106, covid:  842, netDue:  8520, status: "filed", dueDate: "2026-04-15" },
  { id: "P-2602", period: "Feb 2026", vatOut: 10820, vatIn: 3240, nhil: 1803, getfund: 1803, covid:  721, netDue:  7580, status: "filed", dueDate: "2026-03-15" },
  { id: "P-2601", period: "Jan 2026", vatOut:  8240, vatIn: 2680, nhil: 1373, getfund: 1373, covid:  549, netDue:  5560, status: "filed", dueDate: "2026-02-15" },
  { id: "P-2512", period: "Dec 2025", vatOut: 14200, vatIn: 4840, nhil: 2366, getfund: 2366, covid:  946, netDue:  9360, status: "filed", dueDate: "2026-01-15" },
]

interface EVatInvoice {
  id: string
  receipt: string
  date: string
  customer: string
  total: number
  vat: number
  status: "queued" | "submitted" | "rejected"
  graRef?: string
}

const EVAT_QUEUE: EVatInvoice[] = [
  { id: "EV-7831", receipt: "R-7831", date: "2026-04-15", customer: "Akosua Mensah",  total: 169.4, vat: 21,    status: "queued" },
  { id: "EV-7830", receipt: "R-7830", date: "2026-04-15", customer: "Walk-in",        total: 229.9, vat: 28.5,  status: "queued" },
  { id: "EV-7829", receipt: "R-7829", date: "2026-04-15", customer: "Yaw Boateng",    total: 406.6, vat: 50.4,  status: "queued" },
  { id: "EV-7828", receipt: "R-7828", date: "2026-04-15", customer: "Adwoa Pokuaa",   total: 133.1, vat: 16.5,  status: "queued" },
  { id: "EV-7827", receipt: "R-7827", date: "2026-04-15", customer: "Walk-in",        total: 157.3, vat: 19.5,  status: "submitted", graRef: "GRA-EV-887412" },
  { id: "EV-7826", receipt: "R-7826", date: "2026-04-15", customer: "Walk-in",        total: 130.7, vat: 16.2,  status: "submitted", graRef: "GRA-EV-887411" },
  { id: "EV-7825", receipt: "R-7825", date: "2026-04-15", customer: "Jessica Tetteh", total: 122.2, vat: 15.15, status: "submitted", graRef: "GRA-EV-887410" },
]

const STATUS_TONE: Record<TaxPeriod["status"], Tone> = {
  filed: "emerald", draft: "amber", due: "red",
}

const EVAT_TONE: Record<EVatInvoice["status"], Tone> = {
  queued: "amber", submitted: "emerald", rejected: "red",
}

export default function TaxPage() {
  return <Shell><TaxView /></Shell>
}

function TaxView() {
  const [showFile, setShowFile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const current = PERIODS[0]
  const grossTax = current.vatOut + current.nhil + current.getfund + current.covid

  const periodCols: Column<TaxPeriod>[] = [
    { key: "period", label: "Period", width: 130, render: (p) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: T.tx, letterSpacing: "0.06em" }}>{p.period}</span>
    )},
    { key: "vatOut", label: "VAT Output", width: 120, align: "right", render: (p) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.amber }}>{money(p.vatOut, { compact: true })}</span>
    )},
    { key: "vatIn",  label: "VAT Input",  width: 120, align: "right", render: (p) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.emerald }}>{money(p.vatIn, { compact: true })}</span>
    )},
    { key: "nhil",   label: "NHIL",       width: 100, align: "right", render: (p) => money(p.nhil, { compact: true }) },
    { key: "getfund",label: "GETFund",    width: 110, align: "right", render: (p) => money(p.getfund, { compact: true }) },
    { key: "covid",  label: "COVID-19",   width: 110, align: "right", render: (p) => money(p.covid, { compact: true }) },
    { key: "due",    label: "Net Due",    width: 130, align: "right", render: (p) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, color: T.amber }}>{money(p.netDue, { compact: true })}</span>
    )},
    { key: "dueDate",label: "Filing Due", width: 110, render: (p) => <span style={{ color: T.txM, fontSize: 12 }}>{dateShort(p.dueDate)}</span> },
    { key: "status", label: "Status",     width: 100, render: (p) => <Pill tone={STATUS_TONE[p.status]} dot>{p.status}</Pill> },
  ]

  const evatCols: Column<EVatInvoice>[] = [
    { key: "receipt", label: "Receipt", width: 110, render: (e) => <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: T.tx }}>{e.receipt}</span> },
    { key: "date",    label: "Date",    width: 110, render: (e) => dateShort(e.date) },
    { key: "customer",label: "Customer", render: (e) => e.customer },
    { key: "total",   label: "Invoice Total", width: 130, align: "right", render: (e) => money(e.total) },
    { key: "vat",     label: "VAT",     width: 100, align: "right", render: (e) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.amber }}>{money(e.vat)}</span>
    )},
    { key: "graRef",  label: "GRA Ref", width: 160, render: (e) => (
      e.graRef ? <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.txM }}>{e.graRef}</span> : <span style={{ color: T.txD }}>—</span>
    )},
    { key: "status",  label: "Status",  width: 110, render: (e) => <Pill tone={EVAT_TONE[e.status]} dot>{e.status}</Pill> },
  ]

  return (
    <>
      <Page
        title="Tax Engine"
        subtitle="Ghana VAT, NHIL, GETFund, COVID-19 Levy and GRA E-VAT submission queue."
        accent="amber"
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outline" icon="settings" onClick={() => setShowSettings(true)}>Tax Settings</Button>
            <Button icon="share" onClick={() => setShowFile(true)}>File With GRA</Button>
          </div>
        }
      >
        {/* Current period summary */}
        <Card padding={24} accent="amber" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
                Current Filing Period
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginTop: 6, letterSpacing: "-0.02em" }}>
                {current.period}
              </div>
              <div style={{ fontSize: 12, color: T.txM, marginTop: 4 }}>Filing due {dateShort(current.dueDate)} · GRA Form VAT-3</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
                Net Tax Due
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", marginTop: 6, lineHeight: 1, letterSpacing: "-0.02em" }}>
                {money(current.netDue)}
              </div>
              <Pill tone={STATUS_TONE[current.status]} dot>{current.status}</Pill>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, paddingTop: 18, borderTop: `1px solid ${T.border}` }}>
            <TaxBox label="VAT Output (15%)" value={money(current.vatOut, { compact: true })} color={T.amber} />
            <TaxBox label="VAT Input"        value={money(current.vatIn,  { compact: true })} color={T.emerald} subtract />
            <TaxBox label="NHIL (2.5%)"      value={money(current.nhil,   { compact: true })} color={T.txM} />
            <TaxBox label="GETFund (2.5%)"   value={money(current.getfund,{ compact: true })} color={T.txM} />
            <TaxBox label="COVID-19 (1%)"    value={money(current.covid,  { compact: true })} color={T.txM} />
          </div>

          <div style={{ marginTop: 18, padding: "12px 16px", background: `${T.amber}08`, borderRadius: 10, fontSize: 12, color: T.txM, display: "flex", justifyContent: "space-between" }}>
            <span>Gross taxes collected this period</span>
            <span style={{ fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{money(grossTax)}</span>
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="VAT YTD"            value={money(50320, { compact: true })} accent="amber"   icon="tax" />
          <Stat label="NHIL YTD"           value={money(8500,  { compact: true })} accent="emerald" icon="financials" />
          <Stat label="GETFund YTD"        value={money(8500,  { compact: true })} accent="sky"     icon="financials" />
          <Stat label="COVID-19 YTD"       value={money(3400,  { compact: true })} accent="amber"   icon="financials" />
        </div>

        <Section title="GRA E-VAT Submission Queue" sub="Real-time invoice submission to Ghana Revenue Authority.">
          <DataTable rows={EVAT_QUEUE} columns={evatCols} />
        </Section>

        <Section title="Filing History" sub="Past tax periods and their filing status.">
          <DataTable rows={PERIODS} columns={periodCols} />
        </Section>
      </Page>

      <FileDrawer open={showFile} onClose={() => setShowFile(false)} period={current} />
      <SettingsDrawer open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}

function TaxBox({ label, value, color, subtract = false }: { label: string; value: string; color: string; subtract?: boolean }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, position: "relative" }}>
      {subtract && <span style={{ position: "absolute", top: -8, right: 8, background: T.bg, padding: "0 6px", fontSize: 9, color: T.emerald, fontWeight: 700, letterSpacing: "0.14em", fontFamily: "'DM Mono', monospace" }}>−</span>}
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</div>
    </div>
  )
}

function FileDrawer({ open, onClose, period }: { open: boolean; onClose: () => void; period: TaxPeriod }) {
  return (
    <Drawer
      open={open} onClose={onClose}
      title={`File ${period.period}`}
      subtitle="Submit your return directly to the Ghana Revenue Authority."
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="outline" icon="download">Download VAT-3</Button>
          <Button icon="share" onClick={onClose}>Submit To GRA</Button>
        </>
      }
    >
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>Net Amount Payable</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", marginTop: 6, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {money(period.netDue)}
        </div>
        <div style={{ fontSize: 12, color: T.txM, marginTop: 8 }}>To be transferred via GCB or GRA Pay before {dateShort(period.dueDate)}.</div>
      </Card>

      <Section title="Return Breakdown">
        <Card padding={20}>
          <Row label="Gross Sales"      value={money(78500)} />
          <Row label="VAT Output (15%)" value={money(period.vatOut)} />
          <Row label="Less: VAT Input"  value={`(${money(period.vatIn)})`} valueColor={T.emerald} />
          <Row label="NHIL (2.5%)"      value={money(period.nhil)} />
          <Row label="GETFund (2.5%)"   value={money(period.getfund)} />
          <Row label="COVID-19 (1%)"    value={money(period.covid)} />
          <Row label="Net Tax Due"      value={money(period.netDue)} valueColor={T.amber} bold last />
        </Card>
      </Section>

      <Section title="Submission Method">
        <Card padding={20}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", cursor: "pointer" }}>
            <input type="radio" name="submit" defaultChecked style={{ accentColor: T.amber }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>GRA Online Portal</div>
              <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>Direct API submission · instant acknowledgement</div>
            </div>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", cursor: "pointer" }}>
            <input type="radio" name="submit" style={{ accentColor: T.amber }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>Manual VAT-3 Form</div>
              <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>Download PDF, file at GRA office</div>
            </div>
          </label>
        </Card>
      </Section>
    </Drawer>
  )
}

function Row({ label, value, valueColor, bold = false, last = false }: { label: string; value: React.ReactNode; valueColor?: string; bold?: boolean; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: bold ? 13 : 12, color: bold ? T.tx : T.txM, fontWeight: bold ? 800 : 500, letterSpacing: bold ? "0.10em" : 0, textTransform: bold ? "uppercase" : "none", fontFamily: bold ? "'DM Mono', monospace" : "'DM Sans', sans-serif" }}>{label}</span>
      <span style={{ fontSize: bold ? 18 : 13, fontWeight: bold ? 800 : 700, color: valueColor ?? T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</span>
    </div>
  )
}

function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tin, setTin] = useState("C0001234567")
  const [vatReg, setVatReg] = useState("123456")
  const [scheme, setScheme] = useState("Standard")
  const [eVatEnabled, setEVatEnabled] = useState(true)
  const [graApiKey, setGraApiKey] = useState("")

  return (
    <Drawer
      open={open} onClose={onClose}
      title="Tax Configuration"
      subtitle="Connect your GRA account, set tax rates, manage filing schedule."
      width={500}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="check" onClick={onClose}>Save Configuration</Button>
        </>
      }
    >
      <Section title="Business Registration">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="GRA TIN *">
            <Input value={tin} onChange={(e) => setTin(e.target.value)} />
          </Field>
          <Field label="VAT Reg. Number">
            <Input value={vatReg} onChange={(e) => setVatReg(e.target.value)} />
          </Field>
        </div>
        <Field label="VAT Scheme">
          <Select value={scheme} onChange={(e) => setScheme(e.target.value)}>
            <option>Standard (15% + 2.5% + 2.5% + 1%)</option>
            <option>Flat-Rate (3%)</option>
            <option>Exempt (Education / Health)</option>
          </Select>
        </Field>
      </Section>

      <Section title="Tax Rates">
        <Card padding={0}>
          <RateRow label="VAT" value="15.00%" />
          <RateRow label="NHIL (National Health Insurance Levy)" value="2.50%" />
          <RateRow label="GETFund (Education Trust Fund)" value="2.50%" />
          <RateRow label="COVID-19 Health Recovery Levy" value="1.00%" last />
        </Card>
      </Section>

      <Section title="GRA E-VAT Integration">
        <Card padding={20} accent="amber">
          <label style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, cursor: "pointer" }}>
            <input type="checkbox" checked={eVatEnabled} onChange={(e) => setEVatEnabled(e.target.checked)} style={{ width: 16, height: 16, accentColor: T.amber }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>Submit invoices to GRA in real-time</div>
              <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>Required for VAT-registered businesses since 2024.</div>
            </div>
          </label>
          {eVatEnabled && (
            <Field label="GRA API Key" hint="Get this from gra.gov.gh under My Profile.">
              <Input type="password" value={graApiKey} onChange={(e) => setGraApiKey(e.target.value)} placeholder="paste your GRA API key" />
            </Field>
          )}
        </Card>
      </Section>
    </Drawer>
  )
}

function RateRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.tx, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.04em" }}>{value}</span>
    </div>
  )
}
