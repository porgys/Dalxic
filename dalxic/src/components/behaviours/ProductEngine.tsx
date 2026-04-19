"use client"

import { useState, useMemo } from "react"
import { Stat, Pill, Tabs, DataTable, Column, Drawer, SearchBar, Section, Button, T, Tone } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import type { MockTenant } from "@/lib/ops/mock"
import { CataloguePage } from "@/components/modules/CataloguePage"
import { StockPage } from "@/components/modules/StockPage"
import { POSPage } from "@/components/modules/POSPage"
import { money } from "@/lib/ops/format"

type Accent = "amber" | "copper" | "sky" | "emerald"
type Mode = "retail" | "dispense" | "catalogue" | "stock" | "menu"

interface Props { accent: Accent; tenant: MockTenant; mode: Mode }

const AX: Record<Accent, string> = { amber: T.amber, copper: T.copper, sky: T.sky, emerald: T.emerald }

interface RxOrder {
  id: string; orderNo: string; patient: string; patientDetail: string
  items: { drug: string; dosage: string; qty: number; inStock: boolean; batch?: string; expiry?: string }[]
  status: "pending" | "dispensing" | "dispensed" | "out_of_stock"
  orderedBy: string; orderedAt: string
}

const DEMO_RX: RxOrder[] = [
  { id: "rx1", orderNo: "RX-0021", patient: "Kwame Asante", patientDetail: "M, 34y · Malaria", items: [
    { drug: "Artemether-Lumefantrine 80/480mg", dosage: "BD × 3 days", qty: 6, inStock: true, batch: "ALM-2026-04", expiry: "2027-08" },
    { drug: "Paracetamol 1g", dosage: "TDS × 3 days", qty: 9, inStock: true, batch: "PCM-2026-02", expiry: "2028-02" },
  ], status: "pending", orderedBy: "Dr. Mensah", orderedAt: "09:32" },
  { id: "rx2", orderNo: "RX-0022", patient: "Ama Mensah", patientDetail: "F, 28y · UTI", items: [
    { drug: "Ciprofloxacin 500mg", dosage: "BD × 5 days", qty: 10, inStock: true, batch: "CPX-2026-01", expiry: "2027-06" },
  ], status: "dispensed", orderedBy: "Dr. Adjei", orderedAt: "09:10" },
  { id: "rx3", orderNo: "RX-0023", patient: "Nana Addo", patientDetail: "M, 62y · Diabetes", items: [
    { drug: "Metformin 500mg", dosage: "BD with meals", qty: 60, inStock: true, batch: "MET-2026-03", expiry: "2027-12" },
    { drug: "Glimepiride 2mg", dosage: "OD before breakfast", qty: 30, inStock: false },
  ], status: "out_of_stock", orderedBy: "Dr. Adjei", orderedAt: "08:45" },
  { id: "rx4", orderNo: "RX-0024", patient: "Yaa Boateng", patientDetail: "F, 24y · ANC", items: [
    { drug: "Ferrous Sulphate 200mg", dosage: "TDS", qty: 90, inStock: true, batch: "FES-2026-04", expiry: "2028-04" },
    { drug: "Folic Acid 5mg", dosage: "OD", qty: 30, inStock: true, batch: "FOL-2026-02", expiry: "2028-01" },
  ], status: "dispensing", orderedBy: "Dr. Adjei", orderedAt: "09:00" },
  { id: "rx5", orderNo: "RX-0025", patient: "Abena Osei", patientDetail: "F, 38y · Pneumonia", items: [
    { drug: "Amoxicillin/Clavulanate 1g", dosage: "BD × 7 days", qty: 14, inStock: true, batch: "AMC-2026-03", expiry: "2027-09" },
    { drug: "Azithromycin 500mg", dosage: "OD × 3 days", qty: 3, inStock: true, batch: "AZT-2026-01", expiry: "2027-07" },
  ], status: "pending", orderedBy: "Dr. Mensah", orderedAt: "09:28" },
]

function rxTone(s: string): Tone { return s === "dispensed" ? "emerald" : s === "dispensing" ? "sky" : s === "out_of_stock" ? "red" : "amber" }
const glass: React.CSSProperties = { background: "rgba(8,20,16,0.55)", border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }

export function ProductEngine({ accent, tenant, mode }: Props) {
  if (mode === "retail") return <POSPage accent={accent} tenant={tenant} />
  if (mode === "catalogue") return <CataloguePage accent={accent} tenant={tenant} />
  if (mode === "stock") return <StockPage accent={accent} tenant={tenant} />
  if (mode === "dispense") return <DispenseView accent={accent} tenant={tenant} />
  if (mode === "menu") return <CataloguePage accent={accent} tenant={tenant} />
  return <CataloguePage accent={accent} tenant={tenant} />
}

function DispenseView({ accent, tenant }: { accent: Accent; tenant: MockTenant }) {
  const ax = AX[accent]
  const [tab, setTab] = useState<"rx" | "retail" | "inventory">("rx")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<RxOrder | null>(null)

  const pending = DEMO_RX.filter(r => r.status === "pending")
  const dispensing = DEMO_RX.filter(r => r.status === "dispensing")
  const dispensed = DEMO_RX.filter(r => r.status === "dispensed")
  const outOfStock = DEMO_RX.filter(r => r.status === "out_of_stock")

  const filtered = useMemo(() => {
    if (!search) return DEMO_RX
    const q = search.toLowerCase()
    return DEMO_RX.filter(r => r.patient.toLowerCase().includes(q) || r.orderNo.toLowerCase().includes(q) || r.items.some(i => i.drug.toLowerCase().includes(q)))
  }, [search])

  const s = selected

  return (
    <>
      {tab === "rx" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
            <Stat label="Pending" value={pending.length} icon="clock" accent={accent} />
            <Stat label="Dispensing" value={dispensing.length} icon="trending" accent="sky" />
            <Stat label="Dispensed" value={dispensed.length} icon="check" accent="emerald" />
            <Stat label="Out of Stock" value={outOfStock.length} icon="alert" accent="amber" />
          </div>

          <Tabs tabs={[
            { key: "rx" as const, label: "Prescriptions", count: DEMO_RX.length },
            { key: "retail" as const, label: "Walk-in Sale" },
            { key: "inventory" as const, label: "Drug Inventory" },
          ]} value={tab} onChange={setTab} />

          <div style={{ marginBottom: 16 }}><SearchBar value={search} onChange={setSearch} placeholder="Search prescriptions, patients, drugs..." /></div>

          <DataTable rows={filtered} columns={[
            { key: "orderNo", label: "Rx #", width: 100, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: ax }}>{r.orderNo}</span> },
            { key: "patient", label: "Patient", render: r => <div><div style={{ fontWeight: 600, fontSize: 13 }}>{r.patient}</div><div style={{ fontSize: 11, color: T.txM }}>{r.patientDetail}</div></div> },
            { key: "items", label: "Drugs", width: 60, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.items.length}</span> },
            { key: "orderedBy", label: "By", width: 100, render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.orderedBy}</span> },
            { key: "orderedAt", label: "Time", width: 70, render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.orderedAt}</span> },
            { key: "status", label: "Status", width: 120, render: r => <Pill tone={rxTone(r.status)} dot>{r.status.replace("_", " ")}</Pill> },
          ] as Column<RxOrder>[]} onRowClick={r => setSelected(r)} empty="No prescriptions." />

          <Drawer open={!!s} onClose={() => setSelected(null)} title={s?.patient ?? ""} subtitle={s?.orderNo} width={600}
            footer={<>
              {s?.status === "pending" && <Button variant="outline" icon="check">Start Dispensing</Button>}
              {s?.status === "dispensing" && <Button variant="outline" icon="check">Complete Dispense</Button>}
              {s?.status === "out_of_stock" && <Button variant="ghost" icon="alert">Notify Doctor</Button>}
            </>}
          >
            {s && (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <Pill tone={rxTone(s.status)} dot>{s.status.replace("_", " ")}</Pill>
                  <Pill tone="neutral">{s.orderedBy}</Pill>
                </div>
                <Section title="Prescribed Items">
                  {s.items.map((item, i) => (
                    <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: item.inStock ? `${T.emerald}06` : `${T.red}06`, border: `1px solid ${item.inStock ? T.emerald : T.red}20`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: T.tx }}>{item.drug}</div>
                        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{item.dosage}</div>
                        {item.batch && <div style={{ fontSize: 10, color: T.txD, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>Batch {item.batch} · Exp {item.expiry}</div>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: ax }}>×{item.qty}</div>
                        {!item.inStock && <div style={{ fontSize: 10, color: T.red, fontWeight: 700 }}>OUT OF STOCK</div>}
                      </div>
                    </div>
                  ))}
                </Section>
              </>
            )}
          </Drawer>
        </>
      )}

      {tab === "retail" && (
        <>
          <Tabs tabs={[
            { key: "rx" as const, label: "Prescriptions", count: DEMO_RX.length },
            { key: "retail" as const, label: "Walk-in Sale" },
            { key: "inventory" as const, label: "Drug Inventory" },
          ]} value={tab} onChange={setTab} />
          <POSPage accent={accent} tenant={tenant} />
        </>
      )}

      {tab === "inventory" && (
        <>
          <Tabs tabs={[
            { key: "rx" as const, label: "Prescriptions", count: DEMO_RX.length },
            { key: "retail" as const, label: "Walk-in Sale" },
            { key: "inventory" as const, label: "Drug Inventory" },
          ]} value={tab} onChange={setTab} />
          <StockPage accent={accent} tenant={tenant} />
        </>
      )}
    </>
  )
}
