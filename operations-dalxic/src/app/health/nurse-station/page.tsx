"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { HealthShell } from "@/components/ops/HealthShell"
import { useAuth } from "@/lib/use-auth"
import { Page, Card, Stat, Pill, Button, Drawer, Tabs, DataTable, T, Field, Input, Modal, Section, SearchBar, Empty } from "@/components/ops/primitives"

type View = "vitals" | "tasks" | "handoff"

interface QueueEntry {
  id: string; contactId: string; token: string; visitStatus: string
  chiefComplaint: string; symptomSeverity: number; emergencyFlag: boolean; queuedAt: string
  contact?: { id: string; name: string; dateOfBirth?: string; gender?: string } | null
}

interface VitalsRecord {
  id: string; contactId: string; patientName: string
  temperature: number; bpSystolic: number; bpDiastolic: number
  pulse: number; respiratoryRate: number; spO2: number
  weight?: number; height?: number; bmi?: number
  painScore?: number; bloodSugar?: number
  mewsScore: number; recordedAt: string; recordedBy: string
}

interface TaskItem {
  id: string; contactId: string; patientName: string; token: string
  type: string; priority: "high" | "medium" | "low"
  status: "pending" | "in_progress" | "completed"
  notes?: string; dueAt?: string
}

const RANGES: Record<string, [number, number]> = {
  temperature: [36.1, 37.5], bpSystolic: [90, 140], bpDiastolic: [60, 90],
  pulse: [60, 100], respiratoryRate: [12, 20], spO2: [95, 100],
}

function isAbnormal(key: string, val: number) {
  const r = RANGES[key]
  return r ? val < r[0] || val > r[1] : false
}

function calcMEWS(v: { bpSystolic: number; pulse: number; respiratoryRate: number; temperature: number; spO2: number }) {
  let score = 0
  if (v.bpSystolic <= 70) score += 3; else if (v.bpSystolic <= 80) score += 2; else if (v.bpSystolic <= 100) score += 1
  if (v.pulse < 40) score += 2; else if (v.pulse <= 50) score += 1; else if (v.pulse >= 130) score += 3; else if (v.pulse >= 110) score += 2; else if (v.pulse >= 100) score += 1
  if (v.respiratoryRate < 9) score += 2; else if (v.respiratoryRate >= 30) score += 3; else if (v.respiratoryRate >= 21) score += 2; else if (v.respiratoryRate >= 15) score += 1
  if (v.temperature < 35) score += 2; else if (v.temperature >= 38.5) score += 2; else if (v.temperature >= 38) score += 1
  if (v.spO2 < 90) score += 3; else if (v.spO2 < 93) score += 2; else if (v.spO2 < 95) score += 1
  return score
}

const emptyVitals = { temperature: "", bpSystolic: "", bpDiastolic: "", pulse: "", respiratoryRate: "", spO2: "", weight: "", height: "", painScore: "", bloodSugar: "" }

export default function NurseStationPage() {
  const { session, authFetch } = useAuth()
  const [view, setView] = useState<View>("vitals")
  const [query, setQuery] = useState("")
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [vitalsRecords, setVitalsRecords] = useState<VitalsRecord[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeVitals, setActiveVitals] = useState<VitalsRecord | null>(null)
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<QueueEntry | null>(null)
  const [vf, setVf] = useState({ ...emptyVitals })

  const fetchData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const [queueRes, vitalsRes] = await Promise.all([
        authFetch("/api/health/queue"),
        authFetch("/api/health/clinical?type=vitals"),
      ])
      const [queueJson, vitalsJson] = await Promise.all([queueRes.json(), vitalsRes.json()])

      if (queueJson.success) setQueue(queueJson.data)

      const vRecords: VitalsRecord[] = []
      const taskItems: TaskItem[] = []
      if (vitalsJson.success) {
        for (const rec of vitalsJson.data) {
          const d = rec.data as Record<string, unknown>
          vRecords.push({
            id: rec.id, contactId: rec.contactId,
            patientName: (d.patientName as string) || "Unknown",
            temperature: (d.temperature as number) || 0,
            bpSystolic: (d.bpSystolic as number) || 0,
            bpDiastolic: (d.bpDiastolic as number) || 0,
            pulse: (d.pulse as number) || 0,
            respiratoryRate: (d.respiratoryRate as number) || 0,
            spO2: (d.spO2 as number) || 0,
            weight: d.weight as number | undefined,
            height: d.height as number | undefined,
            bmi: d.bmi as number | undefined,
            painScore: d.painScore as number | undefined,
            bloodSugar: d.bloodSugar as number | undefined,
            mewsScore: (d.mewsScore as number) || 0,
            recordedAt: rec.performedAt,
            recordedBy: rec.performedByName,
          })
        }
      }

      if (queueJson.success) {
        const activePatients = (queueJson.data as QueueEntry[]).filter(q => q.visitStatus !== "closed")
        for (const q of activePatients) {
          const hasVitals = vRecords.some(v => v.contactId === q.contactId)
          if (!hasVitals) {
            taskItems.push({
              id: `task-vitals-${q.id}`, contactId: q.contactId,
              patientName: q.contact?.name || "Unknown", token: q.token,
              type: "Vital Signs", priority: q.emergencyFlag ? "high" : q.symptomSeverity >= 5 ? "high" : "medium",
              status: "pending",
            })
          }
        }
      }

      setVitalsRecords(vRecords)
      setTasks(taskItems)
      setError(null)
    } catch { setError("Network Error — Could Not Load Data") } finally { setLoading(false) }
  }, [session, authFetch])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  const awaiting = queue.filter(q => q.visitStatus === "waiting").length
  const abnormalCount = vitalsRecords.filter(v => isAbnormal("temperature", v.temperature) || isAbnormal("bpSystolic", v.bpSystolic) || isAbnormal("spO2", v.spO2) || v.mewsScore >= 4).length
  const tasksPending = tasks.filter(t => t.status === "pending").length

  const filteredVitals = useMemo(() => {
    if (!query) return vitalsRecords
    const q = query.toLowerCase()
    return vitalsRecords.filter(v => v.patientName.toLowerCase().includes(q))
  }, [vitalsRecords, query])

  const patientsNeedingVitals = useMemo(() => {
    return queue.filter(q => q.visitStatus === "waiting" && !vitalsRecords.some(v => v.contactId === q.contactId))
  }, [queue, vitalsRecords])

  function openVitalsEntry(patient: QueueEntry) {
    setSelectedPatient(patient)
    setVf({ ...emptyVitals })
    setVitalsModalOpen(true)
  }

  async function saveVitals() {
    if (!session || !selectedPatient) return
    const temp = parseFloat(vf.temperature) || 0
    const sys = parseInt(vf.bpSystolic) || 0
    const dia = parseInt(vf.bpDiastolic) || 0
    const pulse = parseInt(vf.pulse) || 0
    const rr = parseInt(vf.respiratoryRate) || 0
    const spo2 = parseInt(vf.spO2) || 0
    if (!temp && !sys && !pulse) return

    const mews = calcMEWS({ bpSystolic: sys, pulse, respiratoryRate: rr, temperature: temp, spO2: spo2 })
    const w = parseFloat(vf.weight) || undefined
    const h = parseFloat(vf.height) || undefined
    const bmi = w && h ? Math.round(w / ((h / 100) ** 2) * 10) / 10 : undefined

    setSubmitting(true); setError(null)
    try {
      await authFetch("/api/health/clinical", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedPatient.contactId, type: "vitals",
          data: {
            patientName: selectedPatient.contact?.name || "Unknown",
            temperature: temp, bpSystolic: sys, bpDiastolic: dia,
            pulse, respiratoryRate: rr, spO2: spo2,
            weight: w, height: h, bmi,
            painScore: parseInt(vf.painScore) || undefined,
            bloodSugar: parseFloat(vf.bloodSugar) || undefined,
            mewsScore: mews,
          },
          status: mews >= 4 ? "critical" : "active",
        }),
      })
      setVitalsModalOpen(false)
      setSelectedPatient(null)
      await fetchData()
    } catch { setError("Failed To Save Vitals") } finally { setSubmitting(false) }
  }

  return (
    <HealthShell>
      <Page accent="copper" title="Nurse Station" subtitle="Vitals Recording, MEWS Scoring, Task Management And Shift Handoff.">
        {error && (
          <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#f87171", fontSize: 13, fontWeight: 600 }}>{error}</div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Patients Awaiting" value={awaiting} accent="copper" icon="orders" />
          <Stat label="Vitals Recorded" value={vitalsRecords.length} accent="copper" icon="check" />
          <Stat label="Abnormal / Critical" value={abnormalCount} accent="neutral" icon="bolt" />
          <Stat label="Tasks Pending" value={tasksPending} accent="amber" icon="orders" />
        </div>

        <Section title="Nursing Operations" action={<div style={{ width: 260 }}><SearchBar value={query} onChange={setQuery} placeholder="Search Patient…" /></div>}>
          <Tabs<View> value={view} onChange={setView} accent="copper" tabs={[
            { key: "vitals", label: "Vitals", count: vitalsRecords.length },
            { key: "tasks", label: "Tasks", count: tasksPending },
            { key: "handoff", label: "Shift Handoff" },
          ]} />

          <div style={{ marginTop: 18 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: 48, color: T.txD, fontSize: 13, fontWeight: 600 }}>Loading…</div>
            ) : view === "vitals" ? (
              <>
                {patientsNeedingVitals.length > 0 && (
                  <div style={{ marginBottom: 18, padding: 14, background: `${T.amber}08`, border: `1px solid ${T.amber}20`, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: T.amber, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Patients Needing Vitals ({patientsNeedingVitals.length})</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {patientsNeedingVitals.map(q => (
                        <Button key={q.id} size="sm" onClick={() => openVitalsEntry(q)}>
                          {q.token} — {q.contact?.name || "Patient"}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredVitals.length === 0 ? (
                  <Empty icon="search" title="No Vitals Recorded" sub="Record vitals for patients in the queue." />
                ) : (
                  <DataTable
                    columns={[
                      { key: "patientName", label: "Patient", render: (v: VitalsRecord) => <span style={{ fontWeight: 700 }}>{v.patientName}</span> },
                      { key: "temperature", label: "Temp °C", width: 80, render: (v: VitalsRecord) => <span style={{ color: isAbnormal("temperature", v.temperature) ? T.red : T.tx, fontWeight: isAbnormal("temperature", v.temperature) ? 700 : 400, fontFamily: "'DM Mono', monospace" }}>{v.temperature.toFixed(1)}</span> },
                      { key: "bp", label: "BP", width: 90, render: (v: VitalsRecord) => <span style={{ color: isAbnormal("bpSystolic", v.bpSystolic) ? T.red : T.tx, fontFamily: "'DM Mono', monospace" }}>{v.bpSystolic}/{v.bpDiastolic}</span> },
                      { key: "pulse", label: "Pulse", width: 70, render: (v: VitalsRecord) => <span style={{ color: isAbnormal("pulse", v.pulse) ? T.red : T.tx, fontFamily: "'DM Mono', monospace" }}>{v.pulse}</span> },
                      { key: "rr", label: "RR", width: 60, render: (v: VitalsRecord) => <span style={{ color: isAbnormal("respiratoryRate", v.respiratoryRate) ? T.red : T.tx, fontFamily: "'DM Mono', monospace" }}>{v.respiratoryRate}</span> },
                      { key: "spO2", label: "SpO2", width: 70, render: (v: VitalsRecord) => <span style={{ color: isAbnormal("spO2", v.spO2) ? T.red : T.tx, fontFamily: "'DM Mono', monospace" }}>{v.spO2}%</span> },
                      { key: "mews", label: "MEWS", width: 80, render: (v: VitalsRecord) => <Pill tone={v.mewsScore >= 5 ? "red" : v.mewsScore >= 3 ? "amber" : "emerald"}>{v.mewsScore}</Pill> },
                      { key: "recordedAt", label: "Recorded", width: 80, render: (v: VitalsRecord) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{new Date(v.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span> },
                    ]}
                    rows={filteredVitals}
                    onRowClick={(v) => setActiveVitals(v as VitalsRecord)}
                  />
                )}
              </>
            ) : view === "tasks" ? (
              tasks.length === 0 ? (
                <Empty icon="check" title="All Tasks Complete" sub="No pending nursing tasks." />
              ) : (
                <DataTable
                  columns={[
                    { key: "token", label: "Token", width: 80, render: (t: TaskItem) => <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: T.copper }}>{t.token}</span> },
                    { key: "patientName", label: "Patient", render: (t: TaskItem) => t.patientName },
                    { key: "type", label: "Task", render: (t: TaskItem) => t.type },
                    { key: "priority", label: "Priority", width: 90, render: (t: TaskItem) => <Pill tone={t.priority === "high" ? "red" : t.priority === "medium" ? "amber" : "emerald"}>{t.priority}</Pill> },
                    { key: "status", label: "Status", width: 100, render: (t: TaskItem) => <Pill tone={t.status === "pending" ? "neutral" : t.status === "in_progress" ? "amber" : "emerald"}>{t.status.replace(/_/g, " ")}</Pill> },
                    { key: "action", label: "", width: 120, render: (t: TaskItem) => {
                      if (t.type === "Vital Signs") {
                        const q = queue.find(q => q.contactId === t.contactId)
                        return q ? <Button size="sm" onClick={() => openVitalsEntry(q)}>Record</Button> : null
                      }
                      return null
                    }},
                  ]}
                  rows={tasks}
                  onRowClick={() => {}}
                />
              )
            ) : (
              /* Shift Handoff */
              <Card padding={24}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>SBAR Shift Summary</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 12 }}><b>Situation:</b> {queue.filter(q => q.visitStatus !== "closed").length} active patients in queue. {abnormalCount} with abnormal vitals.</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 12 }}><b>Background:</b> {vitalsRecords.length} vitals sets recorded this shift. {tasksPending} tasks pending.</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 12 }}>
                  <b>Assessment:</b> {abnormalCount > 0 ? (
                    <span style={{ color: T.red }}> {abnormalCount} patient(s) with critical/abnormal values requiring close monitoring.</span>
                  ) : (
                    <span style={{ color: T.emerald }}> All patients stable.</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: T.tx }}><b>Recommendation:</b> {tasksPending > 0 ? `Complete ${tasksPending} pending tasks. ` : ""}Continue monitoring queue patients. Review any pending lab results.</div>

                {vitalsRecords.filter(v => v.mewsScore >= 3).length > 0 && (
                  <div style={{ marginTop: 18 }}>
                    <div style={{ fontSize: 10, color: T.red, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Patients Requiring Attention</div>
                    {vitalsRecords.filter(v => v.mewsScore >= 3).map(v => (
                      <div key={v.id} style={{ fontSize: 12, color: T.tx, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                        <b>{v.patientName}</b> — MEWS {v.mewsScore}, BP {v.bpSystolic}/{v.bpDiastolic}, SpO2 {v.spO2}%, Temp {v.temperature.toFixed(1)}°C
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </Section>
      </Page>

      {/* Vitals Detail Drawer */}
      <Drawer open={!!activeVitals} onClose={() => setActiveVitals(null)} title={activeVitals?.patientName ?? "Vitals"} subtitle={`MEWS: ${activeVitals?.mewsScore}`} width={480}>
        {activeVitals && (
          <>
            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Vital Signs</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "Temp", value: `${activeVitals.temperature.toFixed(1)}°C`, key: "temperature", raw: activeVitals.temperature },
                  { label: "BP", value: `${activeVitals.bpSystolic}/${activeVitals.bpDiastolic}`, key: "bpSystolic", raw: activeVitals.bpSystolic },
                  { label: "Pulse", value: `${activeVitals.pulse} bpm`, key: "pulse", raw: activeVitals.pulse },
                  { label: "RR", value: `${activeVitals.respiratoryRate}/min`, key: "respiratoryRate", raw: activeVitals.respiratoryRate },
                  { label: "SpO2", value: `${activeVitals.spO2}%`, key: "spO2", raw: activeVitals.spO2 },
                  { label: "MEWS", value: `${activeVitals.mewsScore}`, key: "", raw: 0 },
                ].map(v => (
                  <div key={v.label} style={{ background: T.surface, borderRadius: 8, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: v.key && isAbnormal(v.key, v.raw) ? T.red : v.label === "MEWS" && activeVitals.mewsScore >= 4 ? T.red : T.tx }}>{v.value}</div>
                    <div style={{ fontSize: 10, color: T.txD, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>{v.label}</div>
                  </div>
                ))}
              </div>
            </Card>
            {(activeVitals.weight || activeVitals.painScore !== undefined || activeVitals.bloodSugar !== undefined) && (
              <Card padding={18}>
                {activeVitals.weight && <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Weight:</b> {activeVitals.weight} kg</div>}
                {activeVitals.height && <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Height:</b> {activeVitals.height} cm</div>}
                {activeVitals.bmi && <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>BMI:</b> {activeVitals.bmi}</div>}
                {activeVitals.painScore !== undefined && <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Pain Score:</b> {activeVitals.painScore}/10</div>}
                {activeVitals.bloodSugar !== undefined && <div style={{ fontSize: 13, color: T.tx }}><b>Blood Sugar:</b> {activeVitals.bloodSugar} mmol/L</div>}
              </Card>
            )}
          </>
        )}
      </Drawer>

      {/* Record Vitals Modal */}
      <Modal open={vitalsModalOpen} onClose={() => setVitalsModalOpen(false)} title={`Record Vitals — ${selectedPatient?.contact?.name || "Patient"}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label="Temperature °C"><Input type="number" step="0.1" placeholder="36.5" value={vf.temperature} onChange={e => setVf(p => ({ ...p, temperature: e.target.value }))} /></Field>
          <Field label="BP Systolic"><Input type="number" placeholder="120" value={vf.bpSystolic} onChange={e => setVf(p => ({ ...p, bpSystolic: e.target.value }))} /></Field>
          <Field label="BP Diastolic"><Input type="number" placeholder="80" value={vf.bpDiastolic} onChange={e => setVf(p => ({ ...p, bpDiastolic: e.target.value }))} /></Field>
          <Field label="Pulse (bpm)"><Input type="number" placeholder="72" value={vf.pulse} onChange={e => setVf(p => ({ ...p, pulse: e.target.value }))} /></Field>
          <Field label="Respiratory Rate"><Input type="number" placeholder="16" value={vf.respiratoryRate} onChange={e => setVf(p => ({ ...p, respiratoryRate: e.target.value }))} /></Field>
          <Field label="SpO2 %"><Input type="number" placeholder="98" value={vf.spO2} onChange={e => setVf(p => ({ ...p, spO2: e.target.value }))} /></Field>
          <Field label="Weight (kg)"><Input type="number" step="0.1" placeholder="70" value={vf.weight} onChange={e => setVf(p => ({ ...p, weight: e.target.value }))} /></Field>
          <Field label="Height (cm)"><Input type="number" placeholder="170" value={vf.height} onChange={e => setVf(p => ({ ...p, height: e.target.value }))} /></Field>
          <Field label="Pain Score (0-10)"><Input type="number" placeholder="0" value={vf.painScore} onChange={e => setVf(p => ({ ...p, painScore: e.target.value }))} /></Field>
          <Field label="Blood Sugar (mmol/L)"><Input type="number" step="0.1" placeholder="5.5" value={vf.bloodSugar} onChange={e => setVf(p => ({ ...p, bloodSugar: e.target.value }))} /></Field>
        </div>
        {vf.temperature && vf.bpSystolic && vf.pulse && (
          <div style={{ marginTop: 12, padding: 10, background: T.surface, borderRadius: 8, textAlign: "center" }}>
            <span style={{ fontSize: 12, color: T.txD }}>Auto-Calculated MEWS: </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: calcMEWS({ bpSystolic: parseInt(vf.bpSystolic) || 0, pulse: parseInt(vf.pulse) || 0, respiratoryRate: parseInt(vf.respiratoryRate) || 0, temperature: parseFloat(vf.temperature) || 0, spO2: parseInt(vf.spO2) || 0 }) >= 4 ? T.red : T.emerald }}>
              {calcMEWS({ bpSystolic: parseInt(vf.bpSystolic) || 0, pulse: parseInt(vf.pulse) || 0, respiratoryRate: parseInt(vf.respiratoryRate) || 0, temperature: parseFloat(vf.temperature) || 0, spO2: parseInt(vf.spO2) || 0 })}
            </span>
          </div>
        )}
        <div style={{ marginTop: 16 }}><Button full onClick={saveVitals} disabled={submitting}>{submitting ? "Saving…" : "Save Vitals"}</Button></div>
      </Modal>
    </HealthShell>
  )
}
