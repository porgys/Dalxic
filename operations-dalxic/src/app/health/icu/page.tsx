"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { HealthShell } from "@/components/ops/HealthShell"
import { useAuth } from "@/lib/use-auth"
import { Page, Stat, Pill, Drawer, DataTable, Card, T, Button, Field, Input, TextArea, Modal, Section, Empty } from "@/components/ops/primitives"

interface ICUPatient {
  id: string; admissionId: string; contactId: string
  patientName: string; bed: string; diagnosis: string
  ventilated: boolean; doctor: string; dayCount: number
  observations: ICUObs[]
}

interface ICUObs {
  time: string; hr: number; bp: string; temp: number; spo2: number; rr: number
  gcs?: number; fio2?: number; peep?: number; tidalVolume?: number; ventMode?: string
  urine?: number; ivInput?: number; notes: string
}

const RANGES: Record<string, [number, number]> = { hr: [60, 100], temp: [36.1, 37.5], spo2: [95, 100], rr: [12, 20] }
function isAbn(key: string, val: number) { const r = RANGES[key]; return r ? val < r[0] || val > r[1] : false }

function calcSOFA(obs: ICUObs) {
  let score = 0
  if (obs.spo2 < 90) score += 3; else if (obs.spo2 < 93) score += 2; else if (obs.spo2 < 95) score += 1
  if (obs.hr > 130) score += 2; else if (obs.hr > 110) score += 1
  const sys = parseInt(obs.bp.split("/")[0]) || 0
  if (sys < 70) score += 3; else if (sys < 90) score += 2; else if (sys < 100) score += 1
  if (obs.gcs && obs.gcs < 6) score += 3; else if (obs.gcs && obs.gcs < 10) score += 2; else if (obs.gcs && obs.gcs < 13) score += 1
  return score
}

const emptyObs = { hr: "", bpSys: "", bpDia: "", temp: "", spo2: "", rr: "", gcs: "", fio2: "", peep: "", tidalVolume: "", ventMode: "", urine: "", ivInput: "", notes: "" }

export default function IcuPage() {
  const { session, authFetch } = useAuth()
  const [patients, setPatients] = useState<ICUPatient[]>([])
  const [active, setActive] = useState<ICUPatient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [obsModalOpen, setObsModalOpen] = useState(false)
  const [obsForm, setObsForm] = useState({ ...emptyObs })

  const fetchData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const [admRes, obsRes, contactsRes] = await Promise.all([
        authFetch("/api/admissions?status=active"),
        authFetch("/api/health/clinical?type=icu_observation"),
        authFetch("/api/contacts"),
      ])
      const [admJson, obsJson, contactsJson] = await Promise.all([admRes.json(), obsRes.json(), contactsRes.json()])

      const contactMap = new Map<string, string>()
      if (contactsJson.success) for (const c of contactsJson.data) contactMap.set(c.id, c.name)

      const observations = new Map<string, ICUObs[]>()
      if (obsJson.success) {
        for (const r of obsJson.data) {
          const d = r.data as Record<string, unknown>
          const contactId = r.contactId as string
          if (!observations.has(contactId)) observations.set(contactId, [])
          observations.get(contactId)!.push({
            time: r.performedAt, hr: (d.hr as number) || 0, bp: (d.bp as string) || "0/0",
            temp: (d.temp as number) || 0, spo2: (d.spo2 as number) || 0, rr: (d.rr as number) || 0,
            gcs: d.gcs as number | undefined, fio2: d.fio2 as number | undefined,
            peep: d.peep as number | undefined, tidalVolume: d.tidalVolume as number | undefined,
            ventMode: d.ventMode as string | undefined,
            urine: d.urine as number | undefined, ivInput: d.ivInput as number | undefined,
            notes: (d.notes as string) || "",
          })
        }
      }

      const icuPatients: ICUPatient[] = []
      if (admJson.success) {
        for (const adm of admJson.data) {
          const meta = (adm.meta || {}) as Record<string, unknown>
          if ((meta.ward as string) !== "ICU" && adm.type !== "icu") continue
          const days = Math.max(1, Math.ceil((Date.now() - new Date(adm.admittedAt).getTime()) / 86400000))
          icuPatients.push({
            id: adm.id, admissionId: adm.id, contactId: adm.contactId,
            patientName: contactMap.get(adm.contactId) || "Unknown",
            bed: adm.identifier || "ICU-?", diagnosis: adm.notes || "—",
            ventilated: meta.ventilated === true, doctor: (meta.doctor as string) || "—",
            dayCount: days, observations: observations.get(adm.contactId) || [],
          })
        }
      }
      setPatients(icuPatients); setError(null)
    } catch { setError("Network Error") } finally { setLoading(false) }
  }, [session, authFetch])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  const ventilated = patients.filter(p => p.ventilated).length
  const totalObs = patients.reduce((s, p) => s + p.observations.length, 0)
  const criticals = patients.reduce((s, p) => s + p.observations.filter(o => isAbn("spo2", o.spo2) || isAbn("hr", o.hr)).length, 0)

  async function saveObservation() {
    if (!session || !active) return; setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        contactId: active.contactId, type: "icu_observation",
        data: {
          hr: parseInt(obsForm.hr) || 0, bp: `${obsForm.bpSys || 0}/${obsForm.bpDia || 0}`,
          temp: parseFloat(obsForm.temp) || 0, spo2: parseInt(obsForm.spo2) || 0, rr: parseInt(obsForm.rr) || 0,
          gcs: parseInt(obsForm.gcs) || undefined, fio2: parseInt(obsForm.fio2) || undefined,
          peep: parseInt(obsForm.peep) || undefined, tidalVolume: parseInt(obsForm.tidalVolume) || undefined,
          ventMode: obsForm.ventMode || undefined,
          urine: parseInt(obsForm.urine) || undefined, ivInput: parseInt(obsForm.ivInput) || undefined,
          notes: obsForm.notes, patientName: active.patientName, bed: active.bed,
        },
        status: "active",
      }) })
      setObsModalOpen(false); setObsForm({ ...emptyObs }); await fetchData()
    } catch { setError("Failed To Save") } finally { setSubmitting(false) }
  }

  return (
    <HealthShell>
      <Page accent="copper" title="ICU" subtitle="Hourly Charting, Ventilator Tracking, Fluid Balance And Scoring Tools.">
        {error && <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#f87171", fontSize: 13, fontWeight: 600 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="ICU Patients" value={patients.length} accent="copper" icon="tenants" />
          <Stat label="Ventilated" value={ventilated} accent="neutral" icon="bolt" />
          <Stat label="Observations" value={totalObs} accent="copper" icon="check" />
          <Stat label="Critical Alerts" value={criticals} accent={criticals > 0 ? "amber" : "emerald"} icon="bolt" />
        </div>

        {loading ? <div style={{ textAlign: "center", padding: 48, color: T.txD, fontSize: 13, fontWeight: 600 }}>Loading…</div> : patients.length === 0 ? (
          <Empty icon="search" title="No ICU Patients" sub="Patients admitted to ICU will appear here." />
        ) : (
          <Section title="ICU Bed Grid">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300, 1fr))", gap: 14 }}>
              {patients.map(p => {
                const latest = p.observations[0]
                return (
                  <div key={p.id} onClick={() => { setActive(p); setObsForm({ ...emptyObs }) }} style={{ cursor: "pointer" }}><Card padding={18} hover style={{ border: latest && (isAbn("spo2", latest.spo2) || isAbn("hr", latest.hr)) ? `1px solid ${T.red}40` : undefined }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, fontSize: 16, color: T.copper }}>{p.bed}</span>
                      {p.ventilated && <Pill tone="red">Ventilated</Pill>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, marginBottom: 4 }}>{p.patientName}</div>
                    <div style={{ fontSize: 12, color: T.txM, marginBottom: 8 }}>{p.diagnosis} · Day {p.dayCount}</div>
                    {latest ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                        {[
                          { label: "HR", value: latest.hr, key: "hr" },
                          { label: "BP", value: latest.bp, key: "" },
                          { label: "SpO2", value: `${latest.spo2}%`, key: "spo2" },
                          { label: "Temp", value: `${latest.temp.toFixed(1)}°`, key: "temp" },
                          { label: "RR", value: latest.rr, key: "rr" },
                          { label: "GCS", value: latest.gcs ?? "—", key: "" },
                        ].map(v => (
                          <div key={v.label} style={{ background: T.surface, borderRadius: 6, padding: 6, textAlign: "center" }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: v.key && isAbn(v.key, typeof v.value === "number" ? v.value : 0) ? T.red : T.tx }}>{v.value}</div>
                            <div style={{ fontSize: 9, color: T.txD, textTransform: "uppercase" }}>{v.label}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: T.txD }}>No observations yet</div>
                    )}
                  </Card></div>
                )
              })}
            </div>
          </Section>
        )}
      </Page>

      <Drawer open={!!active} onClose={() => setActive(null)} title={`${active?.bed} — ${active?.patientName}`} subtitle={active?.diagnosis} width={560}>
        {active && (
          <>
            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, color: T.tx }}><b>Doctor:</b> {active.doctor}</div>
                  <div style={{ fontSize: 13, color: T.tx }}><b>Day:</b> {active.dayCount} | {active.ventilated ? "Ventilated" : "Not Ventilated"}</div>
                </div>
                <Button onClick={() => setObsModalOpen(true)}>New Observation</Button>
              </div>
            </Card>

            {active.observations.length > 0 && (
              <Card padding={18}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Hourly Chart</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>{["Time", "HR", "BP", "SpO2", "Temp", "RR", "GCS", "Notes"].map(h => <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: T.txD, borderBottom: `1px solid ${T.border}`, fontSize: 10, textTransform: "uppercase" }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {active.observations.slice(0, 24).map((o, i) => (
                        <tr key={i}>
                          <td style={{ padding: "6px 8px", fontFamily: "'DM Mono', monospace", color: T.txM }}>{new Date(o.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                          <td style={{ padding: "6px 8px", color: isAbn("hr", o.hr) ? T.red : T.tx, fontWeight: isAbn("hr", o.hr) ? 700 : 400 }}>{o.hr}</td>
                          <td style={{ padding: "6px 8px", color: T.tx }}>{o.bp}</td>
                          <td style={{ padding: "6px 8px", color: isAbn("spo2", o.spo2) ? T.red : T.tx, fontWeight: isAbn("spo2", o.spo2) ? 700 : 400 }}>{o.spo2}%</td>
                          <td style={{ padding: "6px 8px", color: isAbn("temp", o.temp) ? T.red : T.tx }}>{o.temp.toFixed(1)}</td>
                          <td style={{ padding: "6px 8px", color: isAbn("rr", o.rr) ? T.red : T.tx }}>{o.rr}</td>
                          <td style={{ padding: "6px 8px", color: T.tx }}>{o.gcs ?? "—"}</td>
                          <td style={{ padding: "6px 8px", color: T.txM, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </Drawer>

      <Modal open={obsModalOpen} onClose={() => setObsModalOpen(false)} title={`Observation — ${active?.patientName}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label="Heart Rate"><Input type="number" placeholder="72" value={obsForm.hr} onChange={e => setObsForm(p => ({ ...p, hr: e.target.value }))} /></Field>
          <Field label="BP Systolic"><Input type="number" placeholder="120" value={obsForm.bpSys} onChange={e => setObsForm(p => ({ ...p, bpSys: e.target.value }))} /></Field>
          <Field label="BP Diastolic"><Input type="number" placeholder="80" value={obsForm.bpDia} onChange={e => setObsForm(p => ({ ...p, bpDia: e.target.value }))} /></Field>
          <Field label="SpO2 %"><Input type="number" placeholder="98" value={obsForm.spo2} onChange={e => setObsForm(p => ({ ...p, spo2: e.target.value }))} /></Field>
          <Field label="Temp °C"><Input type="number" step="0.1" placeholder="36.8" value={obsForm.temp} onChange={e => setObsForm(p => ({ ...p, temp: e.target.value }))} /></Field>
          <Field label="Resp Rate"><Input type="number" placeholder="16" value={obsForm.rr} onChange={e => setObsForm(p => ({ ...p, rr: e.target.value }))} /></Field>
          <Field label="GCS (3-15)"><Input type="number" placeholder="15" value={obsForm.gcs} onChange={e => setObsForm(p => ({ ...p, gcs: e.target.value }))} /></Field>
          <Field label="FiO2 %"><Input type="number" placeholder="40" value={obsForm.fio2} onChange={e => setObsForm(p => ({ ...p, fio2: e.target.value }))} /></Field>
          <Field label="PEEP"><Input type="number" placeholder="5" value={obsForm.peep} onChange={e => setObsForm(p => ({ ...p, peep: e.target.value }))} /></Field>
          <Field label="Tidal Volume"><Input type="number" placeholder="500" value={obsForm.tidalVolume} onChange={e => setObsForm(p => ({ ...p, tidalVolume: e.target.value }))} /></Field>
          <Field label="Vent Mode"><Input placeholder="SIMV, PS, CPAP…" value={obsForm.ventMode} onChange={e => setObsForm(p => ({ ...p, ventMode: e.target.value }))} /></Field>
          <Field label="Urine (ml)"><Input type="number" placeholder="50" value={obsForm.urine} onChange={e => setObsForm(p => ({ ...p, urine: e.target.value }))} /></Field>
          <Field label="IV Input (ml)"><Input type="number" placeholder="100" value={obsForm.ivInput} onChange={e => setObsForm(p => ({ ...p, ivInput: e.target.value }))} /></Field>
        </div>
        <Field label="Notes"><TextArea placeholder="Clinical notes…" value={obsForm.notes} onChange={e => setObsForm(p => ({ ...p, notes: e.target.value }))} /></Field>
        <div style={{ marginTop: 16 }}><Button full onClick={saveObservation} disabled={submitting}>{submitting ? "Saving…" : "Save Observation"}</Button></div>
      </Modal>
    </HealthShell>
  )
}
