"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Stat, Pill, Tabs, DataTable, Column, Drawer, SearchBar, Section, Button, T, Tone } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import type { MockTenant } from "@/lib/ops/mock"
import { useAuth } from "@/lib/use-auth"

type Accent = "amber" | "copper" | "sky" | "emerald"
type Mode = "intake" | "soap" | "display" | "assist"

interface Props { accent: Accent; tenant: MockTenant; mode: Mode }

const AX: Record<Accent, string> = { amber: T.amber, copper: T.copper, sky: T.sky, emerald: T.emerald }

interface QueueEntry {
  id: string; token: string; name: string; complaint: string
  severity: number; status: "waiting" | "with_provider" | "completed" | "emergency"
  waitMins: number; gender: string; age: number; insurance: string
}

const DEMO_QUEUE: QueueEntry[] = [
  { id: "q1", token: "Q-001", name: "Kwame Asante", complaint: "Fever and chills, 3 days", severity: 7, status: "waiting", waitMins: 12, gender: "M", age: 34, insurance: "NHIS" },
  { id: "q2", token: "Q-002", name: "Ama Mensah", complaint: "Persistent headache", severity: 4, status: "with_provider", waitMins: 25, gender: "F", age: 28, insurance: "Private" },
  { id: "q3", token: "Q-003", name: "Kofi Darkwa", complaint: "Chest pain, shortness of breath", severity: 8, status: "emergency", waitMins: 5, gender: "M", age: 55, insurance: "None" },
  { id: "q4", token: "Q-004", name: "Yaa Boateng", complaint: "ANC checkup, 28 weeks", severity: 2, status: "waiting", waitMins: 18, gender: "F", age: 24, insurance: "NHIS" },
  { id: "q5", token: "Q-005", name: "Kweku Pratt", complaint: "Lower back pain", severity: 3, status: "waiting", waitMins: 30, gender: "M", age: 42, insurance: "None" },
  { id: "q6", token: "Q-006", name: "Abena Osei", complaint: "Cough with blood in sputum", severity: 6, status: "waiting", waitMins: 8, gender: "F", age: 38, insurance: "NHIS" },
  { id: "q7", token: "Q-007", name: "Nana Addo", complaint: "Follow-up diabetes check", severity: 2, status: "completed", waitMins: 0, gender: "M", age: 62, insurance: "Private" },
  { id: "q8", token: "Q-008", name: "Efua Appiah", complaint: "Skin rash and itching, 1 week", severity: 3, status: "with_provider", waitMins: 15, gender: "F", age: 19, insurance: "NHIS" },
  { id: "q9", token: "Q-009", name: "Kojo Bonsu", complaint: "Chronic joint pain", severity: 4, status: "waiting", waitMins: 22, gender: "M", age: 48, insurance: "None" },
  { id: "q10", token: "Q-010", name: "Akosua Frimpong", complaint: "Dizziness and blurred vision", severity: 5, status: "waiting", waitMins: 6, gender: "F", age: 31, insurance: "NHIS" },
]

interface SOAPTemplate {
  name: string; diagnosis: string; subjective: string; objective: string; assessment: string; plan: string
  tests: string[]; rx: { drug: string; dosage: string; qty: number }[]
}

const SOAP_TEMPLATES: SOAPTemplate[] = [
  { name: "Malaria", diagnosis: "P. falciparum malaria", subjective: "Fever, chills, body aches for 3 days. Sweating at night.", objective: "Temp 38.8°C, HR 102, BP 118/72. Mild splenomegaly.", assessment: "Clinical malaria, moderate severity", plan: "Antimalarial therapy, hydration, paracetamol for fever", tests: ["Malaria RDT", "FBC", "G6PD"], rx: [{ drug: "Artemether-Lumefantrine 80/480mg", dosage: "BD × 3 days", qty: 6 }, { drug: "Paracetamol 1g", dosage: "TDS × 3 days", qty: 9 }] },
  { name: "Hypertension", diagnosis: "Essential hypertension, Stage 2", subjective: "Headache, neck stiffness. Known hypertensive, non-compliant with meds.", objective: "BP 168/102, HR 84, BMI 29.3. No papilloedema.", assessment: "Uncontrolled essential hypertension", plan: "Resume antihypertensives, lifestyle modification, follow-up 2 weeks", tests: ["RBS", "Lipid profile", "U&E", "ECG"], rx: [{ drug: "Amlodipine 10mg", dosage: "OD", qty: 30 }, { drug: "Losartan 50mg", dosage: "OD", qty: 30 }] },
  { name: "Diabetes T2", diagnosis: "Type 2 Diabetes Mellitus", subjective: "Polyuria, polydipsia, weight loss over 2 months.", objective: "RBS 18.4 mmol/L, BMI 31.2, acanthosis nigricans.", assessment: "Newly diagnosed T2DM with hyperglycaemia", plan: "Start metformin, dietary counselling, diabetic education", tests: ["FBS", "HbA1c", "Lipid profile", "U&E", "Urinalysis"], rx: [{ drug: "Metformin 500mg", dosage: "BD with meals", qty: 60 }, { drug: "Glimepiride 2mg", dosage: "OD before breakfast", qty: 30 }] },
  { name: "UTI", diagnosis: "Urinary Tract Infection", subjective: "Burning on urination, frequency, lower abdominal pain for 2 days.", objective: "Temp 37.6°C, suprapubic tenderness. No CVA tenderness.", assessment: "Lower UTI, uncomplicated", plan: "Antibiotics, increased fluid intake, follow-up if no improvement in 48h", tests: ["Urinalysis", "Urine C&S"], rx: [{ drug: "Ciprofloxacin 500mg", dosage: "BD × 5 days", qty: 10 }] },
  { name: "Pneumonia", diagnosis: "Community-acquired pneumonia", subjective: "Productive cough with rust-coloured sputum, fever, chest pain for 4 days.", objective: "Temp 39.2°C, RR 28, SpO2 94%. Bronchial breathing right lower lobe.", assessment: "CAP, moderate severity (CURB-65 score 2)", plan: "Antibiotics, supportive care, chest X-ray", tests: ["Chest X-ray", "FBC", "Sputum MCS", "Blood culture"], rx: [{ drug: "Amoxicillin/Clavulanate 1g", dosage: "BD × 7 days", qty: 14 }, { drug: "Azithromycin 500mg", dosage: "OD × 3 days", qty: 3 }] },
  { name: "Gastroenteritis", diagnosis: "Acute gastroenteritis", subjective: "Watery diarrhoea ×6 today, vomiting ×3, abdominal cramps.", objective: "Temp 37.4°C, mild dehydration. Abdomen soft, diffuse tenderness.", assessment: "Acute gastroenteritis with mild dehydration", plan: "ORS, antiemetic, bland diet, stool examination if persists", tests: ["Stool R/E"], rx: [{ drug: "ORS sachets", dosage: "After each loose stool", qty: 10 }, { drug: "Metoclopramide 10mg", dosage: "TDS × 2 days", qty: 6 }] },
  { name: "ANC Routine", diagnosis: "Normal pregnancy, routine ANC", subjective: "28 weeks pregnant. No complaints. Fetal movements active.", objective: "BP 112/68, fundal height 28cm, FHR 142bpm. No oedema.", assessment: "Normal pregnancy progressing well", plan: "Continue haematinics, next visit 32 weeks, review lab results", tests: ["FBC", "Urinalysis", "Blood group"], rx: [{ drug: "Ferrous sulphate 200mg", dosage: "TDS", qty: 90 }, { drug: "Folic acid 5mg", dosage: "OD", qty: 30 }] },
  { name: "Asthma", diagnosis: "Bronchial asthma, acute exacerbation", subjective: "Wheezing, chest tightness, cough worse at night for 2 days.", objective: "RR 24, SpO2 96%, diffuse expiratory wheeze bilaterally.", assessment: "Acute asthma exacerbation, moderate", plan: "Bronchodilator, short course steroids, review inhaler technique", tests: ["Peak flow", "SpO2 monitoring"], rx: [{ drug: "Salbutamol inhaler 100mcg", dosage: "2 puffs QID PRN", qty: 1 }, { drug: "Prednisolone 40mg", dosage: "OD × 5 days", qty: 5 }] },
  { name: "Typhoid", diagnosis: "Typhoid fever", subjective: "Step-ladder fever for 7 days, headache, constipation, malaise.", objective: "Temp 39.5°C, coated tongue, relative bradycardia, hepatomegaly.", assessment: "Clinical typhoid, pending confirmation", plan: "Antibiotics, blood culture, hydration", tests: ["Widal test", "Blood culture", "FBC", "LFT"], rx: [{ drug: "Azithromycin 500mg", dosage: "OD × 7 days", qty: 7 }, { drug: "Paracetamol 1g", dosage: "TDS PRN", qty: 21 }] },
]

function sevColor(s: number) { return s >= 8 ? T.red : s >= 5 ? T.amber : T.emerald }
function sevTone(s: number): Tone { return s >= 8 ? "red" : s >= 5 ? "amber" : "emerald" }
function statusTone(s: string): Tone { return s === "emergency" ? "red" : s === "with_provider" ? "sky" : s === "completed" ? "emerald" : "neutral" }

const glass: React.CSSProperties = { background: "rgba(8,20,16,0.55)", border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }
const inputStyle = (ax: string): React.CSSProperties => ({ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${ax}22`, color: T.tx, outline: "none", fontFamily: "'DM Sans', sans-serif" })

export function ConsultationEngine({ accent, tenant, mode }: Props) {
  const ax = AX[accent]
  const label = tenant.labelConfig?.consultation ?? "Consultation"
  if (mode === "intake") return <IntakeView ax={ax} accent={accent} label={label} />
  if (mode === "soap") return <SOAPView ax={ax} accent={accent} label={label} />
  if (mode === "display") return <DisplayView ax={ax} accent={accent} />
  return <AssistView ax={ax} accent={accent} label={label} />
}

function mapApiQueue(api: Record<string, unknown>): QueueEntry {
  const contact = api.contact as Record<string, unknown> | undefined
  return {
    id: api.id as string, token: api.token as string,
    name: contact?.name as string ?? "Unknown",
    complaint: (api.chiefComplaint as string) ?? "",
    severity: (api.symptomSeverity as number) ?? 1,
    status: ((api.visitStatus as string) === "in_consultation" ? "with_provider" : (api.visitStatus as string) === "closed" ? "completed" : (api.emergencyFlag as boolean) ? "emergency" : "waiting") as QueueEntry["status"],
    waitMins: api.queuedAt ? Math.round((Date.now() - new Date(api.queuedAt as string).getTime()) / 60000) : 0,
    gender: (contact?.gender as string)?.charAt(0).toUpperCase() ?? "?",
    age: contact?.dateOfBirth ? Math.floor((Date.now() - new Date(contact.dateOfBirth as string).getTime()) / 31557600000) : 0,
    insurance: (contact?.insuranceType as string) ?? "None",
  }
}

function IntakeView({ ax, accent, label }: { ax: string; accent: Accent; label: string }) {
  const { authFetch, session } = useAuth()
  const [tab, setTab] = useState<"queue" | "register">("queue")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<QueueEntry | null>(null)
  const [queue, setQueue] = useState<QueueEntry[]>(DEMO_QUEUE)

  const fetchQueue = useCallback(async () => {
    if (!session) return
    try {
      const res = await authFetch("/api/health/queue")
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) setQueue(json.data.map(mapApiQueue))
    } catch { /* fallback to demo */ }
  }, [session, authFetch])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  const waiting = queue.filter(q => q.status === "waiting")
  const withProvider = queue.filter(q => q.status === "with_provider")
  const emergencies = queue.filter(q => q.status === "emergency")
  const completed = queue.filter(q => q.status === "completed")

  const filtered = useMemo(() => {
    if (!search) return queue.filter(q => q.status !== "completed")
    const q = search.toLowerCase()
    return queue.filter(e => e.name.toLowerCase().includes(q) || e.token.toLowerCase().includes(q) || e.complaint.toLowerCase().includes(q))
  }, [search, queue])

  const cols: Column<QueueEntry>[] = [
    { key: "token", label: "Token", width: 80, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: r.status === "emergency" ? T.red : ax }}>{r.token}</span> },
    { key: "name", label: "Patient", render: r => <div><div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div><div style={{ fontSize: 11, color: T.txM }}>{r.gender}, {r.age}y · {r.insurance}</div></div> },
    { key: "complaint", label: "Complaint", render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.complaint}</span> },
    { key: "severity", label: "Sev", width: 60, render: r => <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: sevColor(r.severity) }} /><span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: sevColor(r.severity) }}>{r.severity}</span></div> },
    { key: "status", label: "Status", width: 110, render: r => <Pill tone={statusTone(r.status)} dot>{r.status.replace("_", " ")}</Pill> },
    { key: "waitMins", label: "Wait", width: 70, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: r.waitMins > 20 ? T.amber : T.txM }}>{r.waitMins > 0 ? `${r.waitMins}m` : "---"}</span> },
  ]

  const s = selected
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="In Queue" value={waiting.length + emergencies.length} icon="clock" accent={accent} />
        <Stat label="Waiting" value={waiting.length} icon="user" />
        <Stat label="With Provider" value={withProvider.length} icon="user" accent="sky" />
        <Stat label="Emergencies" value={emergencies.length} icon="alert" accent="amber" />
      </div>

      <Tabs tabs={[{ key: "queue" as const, label: "Queue", count: filtered.length }, { key: "register" as const, label: "Register" }]} value={tab} onChange={setTab} />

      {tab === "queue" && (
        <>
          <div style={{ marginBottom: 16 }}><SearchBar value={search} onChange={setSearch} placeholder="Search by name, token, or complaint..." /></div>
          <DataTable rows={filtered} columns={cols} onRowClick={r => setSelected(r)} empty="No queue entries." />
        </>
      )}

      {tab === "register" && (
        <div style={{ ...glass, maxWidth: 600 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.tx, marginBottom: 20, fontFamily: "'Space Grotesk', sans-serif" }}>New {label}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Full Name</label><input style={inputStyle(ax)} placeholder="Patient name" /></div>
              <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Phone</label><input style={inputStyle(ax)} placeholder="0XX XXX XXXX" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Gender</label><select style={inputStyle(ax)}><option>Male</option><option>Female</option></select></div>
              <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Age</label><input style={inputStyle(ax)} type="number" placeholder="Age" /></div>
              <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Insurance</label><select style={inputStyle(ax)}><option>NHIS</option><option>Private</option><option>None</option></select></div>
            </div>
            <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Chief Complaint</label><textarea style={{ ...inputStyle(ax), minHeight: 80, resize: "vertical" }} placeholder="Describe the presenting complaint..." /></div>
            <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Severity (1–10)</label><input style={{ ...inputStyle(ax), maxWidth: 100 }} type="number" min={1} max={10} placeholder="1" /></div>
            <Button variant="outline" icon="check">Add to Queue</Button>
          </div>
        </div>
      )}

      <Drawer open={!!s} onClose={() => setSelected(null)} title={s?.name ?? ""} subtitle={s?.token} width={520} footer={<><Button variant="ghost" icon="user">Assign Provider</Button><Button variant="outline" icon="check">Mark Seen</Button>{s?.severity && s.severity < 8 && <Button variant="danger" icon="alert">Escalate</Button>}</>}>
        {s && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <Pill tone={statusTone(s.status)} dot>{s.status.replace("_", " ")}</Pill>
              <Pill tone={sevTone(s.severity)}>Severity {s.severity}</Pill>
              <Pill tone="neutral">{s.gender}, {s.age}y</Pill>
              <Pill tone="sky">{s.insurance}</Pill>
            </div>
            <Section title="Chief Complaint"><p style={{ fontSize: 14, color: T.tx, lineHeight: 1.6 }}>{s.complaint}</p></Section>
            <Section title="Wait Time"><p style={{ fontSize: 22, fontWeight: 800, color: s.waitMins > 20 ? T.amber : T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{s.waitMins} minutes</p></Section>
          </>
        )}
      </Drawer>
    </>
  )
}

function SOAPView({ ax, accent, label }: { ax: string; accent: Accent; label: string }) {
  const { authFetch, session } = useAuth()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [noteTab, setNoteTab] = useState<"notes" | "rx" | "lab" | "refer">("notes")
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [soap, setSoap] = useState({ subjective: "", objective: "", assessment: "", plan: "" })
  const [rxList, setRxList] = useState<{ drug: string; dosage: string; qty: number }[]>([])
  const [labList, setLabList] = useState<string[]>([])
  const [allQueue, setAllQueue] = useState<QueueEntry[]>(DEMO_QUEUE)

  const fetchQueue = useCallback(async () => {
    if (!session) return
    try {
      const res = await authFetch("/api/health/queue")
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        const mapped = json.data.map(mapApiQueue)
        setAllQueue(mapped)
        if (!selectedId && mapped.length > 0) setSelectedId(mapped[0].id)
      }
    } catch { /* fallback to demo */ }
  }, [session, authFetch])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  const queue = allQueue.filter(q => q.status === "waiting" || q.status === "with_provider" || q.status === "emergency")
  const done = allQueue.filter(q => q.status === "completed")
  const patient = allQueue.find(q => q.id === selectedId)

  function applyTemplate(t: SOAPTemplate) {
    setActiveTemplate(t.name)
    setSoap({ subjective: t.subjective, objective: t.objective, assessment: t.assessment, plan: t.plan })
    setRxList(t.rx)
    setLabList(t.tests)
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, minHeight: "calc(100vh - 160px)" }}>
      {/* Queue rail */}
      <div style={{ ...glass, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: T.txD, fontFamily: "'DM Mono', monospace" }}>Queue ({queue.length})</div>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {queue.sort((a, b) => b.severity - a.severity).map(q => (
            <div key={q.id} onClick={() => setSelectedId(q.id)} style={{ padding: "12px 16px", cursor: "pointer", borderBottom: `1px solid ${T.border}`, background: selectedId === q.id ? `${ax}10` : "transparent", borderLeft: selectedId === q.id ? `3px solid ${ax}` : "3px solid transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: T.tx }}>{q.name}</span>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: sevColor(q.severity) }} />
              </div>
              <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{q.token} · {q.gender}, {q.age}y · Sev {q.severity}</div>
            </div>
          ))}
          {done.length > 0 && (
            <>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: T.txD, fontFamily: "'DM Mono', monospace" }}>Completed ({done.length})</div>
              </div>
              {done.map(q => (
                <div key={q.id} onClick={() => setSelectedId(q.id)} style={{ padding: "12px 16px", cursor: "pointer", borderBottom: `1px solid ${T.border}`, opacity: 0.5 }}>
                  <span style={{ fontSize: 13, color: T.txM }}>{q.name}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Workspace */}
      <div style={{ ...glass }}>
        {patient ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{patient.name}</div>
                <div style={{ fontSize: 12, color: T.txM, marginTop: 2 }}>{patient.token} · {patient.gender}, {patient.age}y · {patient.insurance} · {patient.complaint}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Pill tone={sevTone(patient.severity)}>Sev {patient.severity}</Pill>
                <Pill tone={statusTone(patient.status)} dot>{patient.status.replace("_", " ")}</Pill>
              </div>
            </div>

            <Tabs tabs={[{ key: "notes" as const, label: "SOAP Notes" }, { key: "rx" as const, label: "Prescriptions", count: rxList.length }, { key: "lab" as const, label: "Lab Orders", count: labList.length }, { key: "refer" as const, label: "Referrals" }]} value={noteTab} onChange={setNoteTab} />

            {noteTab === "notes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {SOAP_TEMPLATES.map(t => (
                    <button key={t.name} onClick={() => applyTemplate(t)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: activeTemplate === t.name ? `${ax}20` : `${ax}08`, color: activeTemplate === t.name ? ax : T.txM, border: `1px solid ${activeTemplate === t.name ? ax : T.border}`, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{t.name}</button>
                  ))}
                </div>
                {(["subjective", "objective", "assessment", "plan"] as const).map(field => (
                  <div key={field}>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: ax, display: "block", marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>{field.charAt(0).toUpperCase()}  — {field}</label>
                    <textarea value={soap[field]} onChange={e => setSoap(p => ({ ...p, [field]: e.target.value }))} style={{ ...inputStyle(ax), minHeight: 70, resize: "vertical" }} placeholder={`Enter ${field} findings...`} />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10 }}>
                  <Button variant="outline" icon="check">Save Notes</Button>
                  <Button variant="ghost" icon="clock">Complete Encounter</Button>
                </div>
              </div>
            )}

            {noteTab === "rx" && (
              <div>
                {rxList.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    {rxList.map((r, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: `${ax}06`, border: `1px solid ${T.border}`, marginBottom: 8 }}>
                        <div><div style={{ fontWeight: 600, fontSize: 13, color: T.tx }}>{r.drug}</div><div style={{ fontSize: 11, color: T.txM }}>{r.dosage}</div></div>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: ax }}>×{r.qty}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ ...glass, background: `${ax}04` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.tx, marginBottom: 12 }}>Add Prescription</div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px", gap: 10 }}>
                    <input style={inputStyle(ax)} placeholder="Drug name" />
                    <input style={inputStyle(ax)} placeholder="Dosage" />
                    <input style={inputStyle(ax)} type="number" placeholder="Qty" />
                  </div>
                  <div style={{ marginTop: 10 }}><Button variant="ghost" icon="check">Add</Button></div>
                </div>
              </div>
            )}

            {noteTab === "lab" && (
              <div>
                {labList.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                    {labList.map((t, i) => (
                      <span key={i} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: `${T.sky}10`, color: T.sky, border: `1px solid ${T.sky}22` }}>{t}</span>
                    ))}
                  </div>
                )}
                <div style={{ ...glass, background: `${ax}04` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.tx, marginBottom: 12 }}>Add Lab Order</div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                    <input style={inputStyle(ax)} placeholder="Test name" />
                    <select style={inputStyle(ax)}><option>Routine</option><option>Urgent</option><option>STAT</option></select>
                  </div>
                  <div style={{ marginTop: 10 }}><Button variant="ghost" icon="check">Add Test</Button></div>
                </div>
              </div>
            )}

            {noteTab === "refer" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[{ label: "Laboratory", icon: "lab" as const, tone: "sky" as Tone }, { label: "Pharmacy", icon: "pharmacy" as const, tone: "emerald" as Tone }, { label: "Radiology", icon: "radiology" as const, tone: "amber" as Tone }, { label: "Ward Admission", icon: "ward" as const, tone: "copper" as Tone }, { label: "Injection Room", icon: "injection" as const, tone: "red" as Tone }, { label: "Ultrasound", icon: "ultrasound" as const, tone: "sky" as Tone }].map(ref => (
                  <button key={ref.label} style={{ ...glass, cursor: "pointer", textAlign: "center", padding: 24, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, marginTop: 8 }}>{ref.label}</div>
                    <div style={{ fontSize: 11, color: T.txM, marginTop: 4 }}>Send referral</div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: 60, color: T.txD }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Select a patient from the queue</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>Click a name in the queue rail to begin consultation</div>
          </div>
        )}
      </div>
    </div>
  )
}

function DisplayView({ ax, accent }: { ax: string; accent: Accent }) {
  const { authFetch, session } = useAuth()
  const [queueData, setQueueData] = useState<QueueEntry[]>(DEMO_QUEUE)

  const fetchQueue = useCallback(async () => {
    if (!session) return
    try {
      const res = await authFetch("/api/health/queue")
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) setQueueData(json.data.map(mapApiQueue))
    } catch { /* fallback to demo */ }
  }, [session, authFetch])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  const serving = queueData.filter(q => q.status === "with_provider")
  const waiting = queueData.filter(q => q.status === "waiting").sort((a, b) => b.severity - a.severity)
  const emergencies = queueData.filter(q => q.status === "emergency")
  const current = serving[0]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {emergencies.length > 0 && (
        <div style={{ ...glass, border: `2px solid ${T.red}`, background: `${T.red}08` }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: T.red, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Emergency</div>
          {emergencies.map(e => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.red}20` }}>
              <div><span style={{ fontWeight: 700, fontSize: 14, color: T.tx }}>{e.name}</span><span style={{ fontSize: 12, color: T.txM, marginLeft: 10 }}>{e.complaint}</span></div>
              <Pill tone="red" dot>Sev {e.severity}</Pill>
            </div>
          ))}
        </div>
      )}

      {current && (
        <div style={{ textAlign: "center", padding: 48, ...glass, borderColor: `${ax}30` }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Now Serving</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: ax, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.03em" }}>{current.token}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.tx, marginTop: 8 }}>{current.name}</div>
          <div style={{ fontSize: 13, color: T.txM, marginTop: 4 }}>{current.gender}, {current.age}y · {current.complaint}</div>
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Waiting ({waiting.length})</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {waiting.map(q => (
            <div key={q.id} style={{ ...glass, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: ax }}>{q.token}</span>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: sevColor(q.severity) }} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: T.tx }}>{q.name}</div>
              <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{q.waitMins}m waiting</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AssistView({ ax, accent, label }: { ax: string; accent: Accent; label: string }) {
  const { authFetch, session } = useAuth()
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<QueueEntry | null>(null)
  const [allQueue, setAllQueue] = useState<QueueEntry[]>(DEMO_QUEUE)

  const fetchQueue = useCallback(async () => {
    if (!session) return
    try {
      const res = await authFetch("/api/health/queue")
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) setAllQueue(json.data.map(mapApiQueue))
    } catch { /* fallback to demo */ }
  }, [session, authFetch])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  const queue = allQueue.filter(q => q.status !== "completed")
  const filtered = useMemo(() => {
    if (!search) return queue
    const s = search.toLowerCase()
    return queue.filter(q => q.name.toLowerCase().includes(s) || q.complaint.toLowerCase().includes(s))
  }, [search, queue])

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Active" value={queue.length} icon="user" accent={accent} />
        <Stat label="In Progress" value={queue.filter(q => q.status === "with_provider").length} icon="user" accent="sky" />
        <Stat label="Completed Today" value={DEMO_QUEUE.filter(q => q.status === "completed").length} icon="check" accent="emerald" />
      </div>
      <div style={{ marginBottom: 16 }}><SearchBar value={search} onChange={setSearch} placeholder={`Search ${label.toLowerCase()}...`} /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(q => (
          <div key={q.id} onClick={() => setSelected(q)} style={{ ...glass, padding: 16, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontWeight: 600, fontSize: 14, color: T.tx }}>{q.name}</div><div style={{ fontSize: 12, color: T.txM, marginTop: 2 }}>{q.complaint}</div></div>
            <Pill tone={statusTone(q.status)} dot>{q.status.replace("_", " ")}</Pill>
          </div>
        ))}
      </div>
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""} subtitle={label} width={480}>
        {selected && (
          <>
            <Section title="Details">
              <div style={{ fontSize: 13, color: T.tx, lineHeight: 1.8 }}>{selected.complaint}</div>
            </Section>
            <Section title="Assist Notes">
              <textarea style={{ ...inputStyle(ax), minHeight: 120, resize: "vertical" }} placeholder="Record assist notes..." />
            </Section>
            <div style={{ marginTop: 16 }}><Button variant="outline" icon="check">Complete</Button></div>
          </>
        )}
      </Drawer>
    </>
  )
}
