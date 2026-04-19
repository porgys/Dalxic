"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Stat, Pill, Tabs, DataTable, Column, Drawer, SearchBar, Section, Button, T, Tone } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import type { MockTenant } from "@/lib/ops/mock"
import { useAuth } from "@/lib/use-auth"

type Accent = "amber" | "copper" | "sky" | "emerald"
type Mode = "lab" | "imaging" | "injection" | "kitchen" | "generic"

interface Props { accent: Accent; tenant: MockTenant; mode: Mode }

const AX: Record<Accent, string> = { amber: T.amber, copper: T.copper, sky: T.sky, emerald: T.emerald }

interface ProcOrder {
  id: string; orderNo: string; patientName: string; test: string; category: string
  urgency: "routine" | "urgent" | "stat"; status: "pending" | "in_progress" | "completed" | "critical"
  orderedBy: string; orderedAt: string; result?: string; normalRange?: string; abnormal?: boolean
}

const DEMO_LAB: ProcOrder[] = [
  { id: "l1", orderNo: "LAB-0041", patientName: "Kwame Asante", test: "Malaria RDT", category: "Parasitology", urgency: "urgent", status: "pending", orderedBy: "Dr. Mensah", orderedAt: "09:15" },
  { id: "l2", orderNo: "LAB-0042", patientName: "Kwame Asante", test: "Full Blood Count", category: "Haematology", urgency: "urgent", status: "pending", orderedBy: "Dr. Mensah", orderedAt: "09:15" },
  { id: "l3", orderNo: "LAB-0043", patientName: "Ama Mensah", test: "Urinalysis", category: "Clinical Chemistry", urgency: "routine", status: "in_progress", orderedBy: "Dr. Adjei", orderedAt: "08:40" },
  { id: "l4", orderNo: "LAB-0044", patientName: "Kofi Darkwa", test: "Troponin I", category: "Cardiac Markers", urgency: "stat", status: "in_progress", orderedBy: "Dr. Mensah", orderedAt: "09:02" },
  { id: "l5", orderNo: "LAB-0045", patientName: "Yaa Boateng", test: "FBC + Blood Group", category: "Haematology", urgency: "routine", status: "pending", orderedBy: "Dr. Adjei", orderedAt: "08:55" },
  { id: "l6", orderNo: "LAB-0046", patientName: "Abena Osei", test: "Sputum AFB", category: "Microbiology", urgency: "urgent", status: "pending", orderedBy: "Dr. Mensah", orderedAt: "09:20" },
  { id: "l7", orderNo: "LAB-0047", patientName: "Nana Addo", test: "HbA1c", category: "Clinical Chemistry", urgency: "routine", status: "completed", orderedBy: "Dr. Adjei", orderedAt: "07:30", result: "7.8%", normalRange: "4.0-5.6%", abnormal: true },
  { id: "l8", orderNo: "LAB-0048", patientName: "Kojo Bonsu", test: "ESR + CRP", category: "Haematology", urgency: "routine", status: "completed", orderedBy: "Dr. Mensah", orderedAt: "07:45", result: "ESR 42mm/hr, CRP 28mg/L", normalRange: "ESR <15, CRP <5", abnormal: true },
]

const DEMO_IMAGING: ProcOrder[] = [
  { id: "r1", orderNo: "RAD-0012", patientName: "Abena Osei", test: "Chest X-Ray PA", category: "X-Ray", urgency: "urgent", status: "pending", orderedBy: "Dr. Mensah", orderedAt: "09:25" },
  { id: "r2", orderNo: "RAD-0013", patientName: "Kofi Darkwa", test: "CT Chest", category: "CT", urgency: "stat", status: "in_progress", orderedBy: "Dr. Mensah", orderedAt: "09:05" },
  { id: "r3", orderNo: "RAD-0014", patientName: "Kweku Pratt", test: "Lumbosacral Spine X-Ray", category: "X-Ray", urgency: "routine", status: "pending", orderedBy: "Dr. Adjei", orderedAt: "08:50" },
  { id: "r4", orderNo: "RAD-0015", patientName: "Nana Addo", test: "Abdomen Ultrasound", category: "Ultrasound", urgency: "routine", status: "completed", orderedBy: "Dr. Adjei", orderedAt: "07:20", result: "Normal liver, spleen, kidneys. No masses." },
]

const DEMO_INJECTION: ProcOrder[] = [
  { id: "j1", orderNo: "INJ-0008", patientName: "Yaa Boateng", test: "Tetanus Toxoid", category: "Vaccine", urgency: "routine", status: "pending", orderedBy: "Dr. Adjei", orderedAt: "09:00" },
  { id: "j2", orderNo: "INJ-0009", patientName: "Efua Appiah", test: "Hydrocortisone 100mg IV", category: "IV Medication", urgency: "urgent", status: "in_progress", orderedBy: "Dr. Mensah", orderedAt: "09:10" },
  { id: "j3", orderNo: "INJ-0010", patientName: "Kwame Asante", test: "Artesunate 120mg IV", category: "IV Medication", urgency: "stat", status: "pending", orderedBy: "Dr. Mensah", orderedAt: "09:18" },
]

const DEMO_KITCHEN: ProcOrder[] = [
  { id: "k1", orderNo: "ORD-0055", patientName: "Table 4 (3 pax)", test: "Jollof Rice × 2, Banku × 1", category: "Main", urgency: "routine", status: "pending", orderedBy: "Waiter Kofi", orderedAt: "12:15" },
  { id: "k2", orderNo: "ORD-0056", patientName: "Table 7 (2 pax)", test: "Fufu & Light Soup × 2", category: "Main", urgency: "routine", status: "in_progress", orderedBy: "Waiter Ama", orderedAt: "12:08" },
  { id: "k3", orderNo: "ORD-0057", patientName: "Table 1 (5 pax)", test: "Fried Rice × 3, Waakye × 2", category: "Main", urgency: "urgent", status: "pending", orderedBy: "Waiter Kofi", orderedAt: "12:20" },
]

function urgencyTone(u: string): Tone { return u === "stat" ? "red" : u === "urgent" ? "amber" : "neutral" }
function statusTone(s: string): Tone { return s === "critical" ? "red" : s === "completed" ? "emerald" : s === "in_progress" ? "sky" : "neutral" }
const glass: React.CSSProperties = { background: "rgba(8,20,16,0.55)", border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }
const inputStyle = (ax: string): React.CSSProperties => ({ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${ax}22`, color: T.tx, outline: "none", fontFamily: "'DM Sans', sans-serif" })

function getOrders(mode: Mode): ProcOrder[] {
  if (mode === "lab") return DEMO_LAB
  if (mode === "imaging") return DEMO_IMAGING
  if (mode === "injection") return DEMO_INJECTION
  if (mode === "kitchen") return DEMO_KITCHEN
  return DEMO_LAB
}

function getTitle(mode: Mode): string {
  if (mode === "lab") return "Laboratory"
  if (mode === "imaging") return "Radiology"
  if (mode === "injection") return "Injection Room"
  if (mode === "kitchen") return "Kitchen Display"
  return "Procedure"
}

function mapClinicalToOrder(rec: Record<string, unknown>, mode: Mode): ProcOrder {
  const d = rec.data as Record<string, unknown> | undefined
  return {
    id: rec.id as string,
    orderNo: (rec.id as string).slice(0, 8).toUpperCase(),
    patientName: (d?.patientName as string) ?? "Unknown",
    test: (d?.testName as string) ?? (d?.modality as string) ?? (d?.drug as string) ?? "Unknown",
    category: (d?.category as string) ?? mode,
    urgency: (d?.urgency as ProcOrder["urgency"]) ?? "routine",
    status: (rec.status as string) === "completed" ? "completed" : (rec.status as string) === "in_progress" ? "in_progress" : "pending",
    orderedBy: (rec.performedByName as string) ?? "",
    orderedAt: rec.performedAt ? new Date(rec.performedAt as string).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "",
    result: d?.result as string | undefined,
    normalRange: d?.normalRange as string | undefined,
    abnormal: (d?.abnormalFlag as boolean) ?? (d?.criticalFinding as boolean) ?? false,
  }
}

export function ProcedureEngine({ accent, tenant, mode }: Props) {
  const { authFetch, session } = useAuth()
  const ax = AX[accent]
  const [orders, setOrders] = useState<ProcOrder[]>(getOrders(mode))
  const [tab, setTab] = useState<"queue" | "results" | "history">("queue")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<ProcOrder | null>(null)
  const [resultText, setResultText] = useState("")
  const [abnormalFlag, setAbnormalFlag] = useState(false)

  const clinicalType = mode === "lab" ? "lab_result" : mode === "imaging" ? "imaging_result" : mode === "injection" ? "injection" : null

  const fetchOrders = useCallback(async () => {
    if (!session || !clinicalType) return
    try {
      const res = await authFetch(`/api/health/clinical?type=${clinicalType}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) setOrders(json.data.map((r: Record<string, unknown>) => mapClinicalToOrder(r, mode)))
    } catch { /* fallback to demo */ }
  }, [session, authFetch, clinicalType, mode])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const pending = orders.filter(o => o.status === "pending")
  const inProgress = orders.filter(o => o.status === "in_progress")
  const completed = orders.filter(o => o.status === "completed")
  const critical = completed.filter(o => o.abnormal)

  const filtered = useMemo(() => {
    let rows = orders
    if (tab === "queue") rows = rows.filter(o => o.status === "pending" || o.status === "in_progress")
    else if (tab === "results") rows = rows.filter(o => o.status === "in_progress")
    else rows = rows.filter(o => o.status === "completed")
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(o => o.patientName.toLowerCase().includes(q) || o.test.toLowerCase().includes(q) || o.orderNo.toLowerCase().includes(q))
    }
    return rows
  }, [tab, search, orders])

  const cols: Column<ProcOrder>[] = [
    { key: "orderNo", label: "Order", width: 100, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: ax }}>{r.orderNo}</span> },
    { key: "patientName", label: mode === "kitchen" ? "Table" : "Patient", render: r => <div><div style={{ fontWeight: 600, fontSize: 13 }}>{r.patientName}</div><div style={{ fontSize: 11, color: T.txM }}>{r.orderedBy} · {r.orderedAt}</div></div> },
    { key: "test", label: mode === "kitchen" ? "Items" : "Test", render: r => <span style={{ fontSize: 12, color: T.tx }}>{r.test}</span> },
    { key: "category", label: "Category", width: 120, render: r => <span style={{ fontSize: 11, color: T.txM }}>{r.category}</span> },
    { key: "urgency", label: "Priority", width: 90, render: r => <Pill tone={urgencyTone(r.urgency)}>{r.urgency}</Pill> },
    { key: "status", label: "Status", width: 110, render: r => <Pill tone={statusTone(r.status)} dot>{r.status.replace("_", " ")}</Pill> },
  ]

  if (tab === "history") {
    cols.push({ key: "result", label: "Result", render: r => (
      <div>
        <span style={{ fontSize: 12, color: r.abnormal ? T.red : T.emerald, fontWeight: r.abnormal ? 700 : 400 }}>{r.result ?? "---"}</span>
        {r.normalRange && <span style={{ fontSize: 10, color: T.txD, marginLeft: 8 }}>({r.normalRange})</span>}
      </div>
    )})
  }

  const s = selected

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Pending" value={pending.length} icon="clock" accent={accent} />
        <Stat label="In Progress" value={inProgress.length} icon="trending" accent="sky" />
        <Stat label="Completed" value={completed.length} icon="check" accent="emerald" />
        <Stat label={mode === "lab" ? "Abnormal" : "Critical"} value={critical.length} icon="alert" accent="amber" />
      </div>

      <Tabs tabs={[
        { key: "queue" as const, label: "Order Queue", count: pending.length + inProgress.length },
        { key: "results" as const, label: "In Progress", count: inProgress.length },
        { key: "history" as const, label: "Completed", count: completed.length },
      ]} value={tab} onChange={setTab} />

      <div style={{ marginBottom: 16 }}><SearchBar value={search} onChange={setSearch} placeholder="Search orders, patients, tests..." /></div>

      <DataTable rows={filtered} columns={cols} onRowClick={r => { setSelected(r); setResultText(r.result ?? ""); setAbnormalFlag(r.abnormal ?? false) }} empty="No orders found." />

      <Drawer open={!!s} onClose={() => setSelected(null)} title={s?.test ?? ""} subtitle={s?.orderNo} width={560}
        footer={<>
          {s?.status === "pending" && <Button variant="outline" icon="check">Start Processing</Button>}
          {s?.status === "in_progress" && <Button variant="outline" icon="check">Submit Result</Button>}
          {s?.abnormal && <Button variant="danger" icon="alert">Flag Critical</Button>}
        </>}
      >
        {s && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <Pill tone={statusTone(s.status)} dot>{s.status.replace("_", " ")}</Pill>
              <Pill tone={urgencyTone(s.urgency)}>{s.urgency}</Pill>
              <Pill tone="neutral">{s.category}</Pill>
            </div>

            <Section title={mode === "kitchen" ? "Table" : "Patient"}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.tx }}>{s.patientName}</div>
              <div style={{ fontSize: 12, color: T.txM, marginTop: 4 }}>Ordered by {s.orderedBy} at {s.orderedAt}</div>
            </Section>

            {s.status === "completed" && s.result ? (
              <Section title="Result">
                <div style={{ padding: 16, borderRadius: 10, background: s.abnormal ? `${T.red}08` : `${T.emerald}08`, border: `1px solid ${s.abnormal ? T.red : T.emerald}22` }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: s.abnormal ? T.red : T.emerald }}>{s.result}</div>
                  {s.normalRange && <div style={{ fontSize: 11, color: T.txM, marginTop: 4 }}>Normal: {s.normalRange}</div>}
                  {s.abnormal && <Pill tone="red" dot>Abnormal</Pill>}
                </div>
              </Section>
            ) : (
              <Section title={mode === "kitchen" ? "Preparation" : "Enter Result"}>
                {mode === "lab" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Value</label><input value={resultText} onChange={e => setResultText(e.target.value)} style={inputStyle(ax)} placeholder="Enter result value" /></div>
                      <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Unit</label><input style={inputStyle(ax)} placeholder="e.g., mmol/L" /></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Normal Range</label><input style={inputStyle(ax)} placeholder="e.g., 3.5-5.5" /></div>
                      <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: abnormalFlag ? T.red : T.txM }}>
                          <input type="checkbox" checked={abnormalFlag} onChange={e => setAbnormalFlag(e.target.checked)} /> Abnormal Flag
                        </label>
                      </div>
                    </div>
                    <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Notes</label><textarea style={{ ...inputStyle(ax), minHeight: 60 }} placeholder="Additional observations..." /></div>
                  </div>
                )}
                {mode === "imaging" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Findings</label><textarea style={{ ...inputStyle(ax), minHeight: 80 }} placeholder="Describe findings..." /></div>
                    <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Impression</label><textarea style={{ ...inputStyle(ax), minHeight: 60 }} placeholder="Radiological impression..." /></div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: T.txM }}>
                      <input type="checkbox" checked={abnormalFlag} onChange={e => setAbnormalFlag(e.target.checked)} /> Critical Finding
                    </label>
                  </div>
                )}
                {mode === "injection" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Route</label><select style={inputStyle(ax)}><option>IV</option><option>IM</option><option>SC</option><option>ID</option></select></div>
                      <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Site</label><select style={inputStyle(ax)}><option>Left Deltoid</option><option>Right Deltoid</option><option>Left Gluteal</option><option>Right Gluteal</option><option>Anterior Thigh</option></select></div>
                    </div>
                    <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Batch / Lot Number</label><input style={inputStyle(ax)} placeholder="Lot number" /></div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: T.red }}>
                      <input type="checkbox" /> Adverse Event (AEFI)
                    </label>
                  </div>
                )}
                {mode === "kitchen" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ fontSize: 13, color: T.tx }}>{s.test}</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <Button variant="outline" icon="clock">Mark Preparing</Button>
                      <Button variant="outline" icon="check">Ready to Serve</Button>
                    </div>
                  </div>
                )}
              </Section>
            )}
          </>
        )}
      </Drawer>
    </>
  )
}
