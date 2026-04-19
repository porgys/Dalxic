"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { HealthShell } from "@/components/ops/HealthShell"
import { useAuth } from "@/lib/use-auth"
import { Page, Stat, Pill, Drawer, Tabs, DataTable, Card, T, Button, Field, Input, TextArea, Select, Modal, Empty, Section, SearchBar } from "@/components/ops/primitives"

type View = "antenatal" | "labour" | "postnatal" | "delivered"

interface MaternityPatient {
  id: string; contactId: string; patientName: string
  stage: View; edd: string; gestWeeks: number; gravida: number; para: number
  doctor: string; highRisk: boolean; riskFactors?: string
  visits: { date: string; bp: string; weight: number; fundalHeight: number; fhr: number; notes: string }[]
  delivery?: { mode: string; date: string; birthWeight: number; apgar1: number; apgar5: number; complications: string; bloodLoss: string }
}

const emptyVisit = { bp: "", weight: "", fundalHeight: "", fhr: "", notes: "" }
const emptyDelivery = { mode: "SVD", date: "", birthWeight: "", apgar1: "", apgar5: "", complications: "", bloodLoss: "" }

export default function MaternityPage() {
  const { session, authFetch } = useAuth()
  const [view, setView] = useState<View>("antenatal")
  const [query, setQuery] = useState("")
  const [patients, setPatients] = useState<MaternityPatient[]>([])
  const [active, setActive] = useState<MaternityPatient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [visitForm, setVisitForm] = useState({ ...emptyVisit })
  const [deliveryOpen, setDeliveryOpen] = useState(false)
  const [deliveryForm, setDeliveryForm] = useState({ ...emptyDelivery })

  const fetchData = useCallback(async () => {
    if (!session) return; setLoading(true)
    try {
      const [ancRes, contactsRes] = await Promise.all([
        authFetch("/api/health/clinical?type=antenatal"),
        authFetch("/api/contacts"),
      ])
      const [ancJson, contactsJson] = await Promise.all([ancRes.json(), contactsRes.json()])

      const contactMap = new Map<string, string>()
      if (contactsJson.success) for (const c of contactsJson.data) contactMap.set(c.id, c.name)

      const patientMap = new Map<string, MaternityPatient>()
      if (ancJson.success) {
        for (const rec of ancJson.data) {
          const d = rec.data as Record<string, unknown>
          const contactId = rec.contactId as string
          if (!patientMap.has(contactId)) {
            patientMap.set(contactId, {
              id: rec.id, contactId, patientName: contactMap.get(contactId) || (d.patientName as string) || "Unknown",
              stage: (d.stage as View) || "antenatal", edd: (d.edd as string) || "",
              gestWeeks: (d.gestWeeks as number) || 0, gravida: (d.gravida as number) || 1, para: (d.para as number) || 0,
              doctor: (d.doctor as string) || rec.performedByName, highRisk: d.highRisk === true,
              riskFactors: d.riskFactors as string | undefined, visits: [], delivery: d.delivery as MaternityPatient["delivery"],
            })
          }
          const patient = patientMap.get(contactId)!
          if (d.visitType === "anc_visit") {
            patient.visits.push({
              date: rec.performedAt, bp: (d.bp as string) || "", weight: (d.weight as number) || 0,
              fundalHeight: (d.fundalHeight as number) || 0, fhr: (d.fhr as number) || 0, notes: (d.notes as string) || "",
            })
          }
          if (d.stage) patient.stage = d.stage as View
          if (d.gestWeeks) patient.gestWeeks = d.gestWeeks as number
          if (d.delivery) patient.delivery = d.delivery as MaternityPatient["delivery"]
        }
      }

      setPatients(Array.from(patientMap.values())); setError(null)
    } catch { setError("Network Error") } finally { setLoading(false) }
  }, [session, authFetch])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  const antenatal = patients.filter(p => p.stage === "antenatal").length
  const labour = patients.filter(p => p.stage === "labour").length
  const postnatal = patients.filter(p => p.stage === "postnatal").length
  const highRisk = patients.filter(p => p.highRisk).length

  const filtered = useMemo(() => {
    let items = patients.filter(p => p.stage === view)
    if (query) { const q = query.toLowerCase(); items = items.filter(p => p.patientName.toLowerCase().includes(q)) }
    return items
  }, [view, query, patients])

  async function saveANCVisit() {
    if (!active || !visitForm.bp) return; setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        contactId: active.contactId, type: "antenatal",
        data: {
          visitType: "anc_visit", patientName: active.patientName,
          bp: visitForm.bp, weight: parseFloat(visitForm.weight) || 0,
          fundalHeight: parseInt(visitForm.fundalHeight) || 0, fhr: parseInt(visitForm.fhr) || 0,
          notes: visitForm.notes, edd: active.edd, gestWeeks: active.gestWeeks,
          gravida: active.gravida, para: active.para, stage: active.stage,
        },
        status: "active",
      }) })
      setVisitForm({ ...emptyVisit }); await fetchData()
    } catch { setError("Failed") } finally { setSubmitting(false) }
  }

  async function recordDelivery() {
    if (!active || !deliveryForm.birthWeight) return; setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        contactId: active.contactId, type: "antenatal",
        data: {
          patientName: active.patientName, stage: "delivered",
          delivery: {
            mode: deliveryForm.mode, date: deliveryForm.date || new Date().toISOString(),
            birthWeight: parseFloat(deliveryForm.birthWeight) || 0,
            apgar1: parseInt(deliveryForm.apgar1) || 0, apgar5: parseInt(deliveryForm.apgar5) || 0,
            complications: deliveryForm.complications, bloodLoss: deliveryForm.bloodLoss,
          },
        },
        status: "completed",
      }) })
      setDeliveryOpen(false); setDeliveryForm({ ...emptyDelivery }); setActive(null); await fetchData()
    } catch { setError("Failed") } finally { setSubmitting(false) }
  }

  return (
    <HealthShell>
      <Page accent="copper" title="Maternity" subtitle="Antenatal Care, Labour Monitoring, Delivery Records And Postnatal Follow-Up.">
        {error && <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#f87171", fontSize: 13, fontWeight: 600 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Antenatal" value={antenatal} accent="copper" icon="calendar" />
          <Stat label="In Labour" value={labour} accent="neutral" icon="bolt" />
          <Stat label="Postnatal" value={postnatal} accent="emerald" icon="check" />
          <Stat label="High Risk" value={highRisk} accent={highRisk > 0 ? "amber" : "emerald"} icon="bolt" />
        </div>

        <Section title="Maternity Ward" action={<div style={{ width: 260 }}><SearchBar value={query} onChange={setQuery} placeholder="Search Patient…" /></div>}>
          <Tabs<View> value={view} onChange={setView} accent="copper" tabs={[
            { key: "antenatal", label: "Antenatal", count: antenatal },
            { key: "labour", label: "Labour", count: labour },
            { key: "postnatal", label: "Postnatal", count: postnatal },
            { key: "delivered", label: "Delivered", count: patients.filter(p => p.stage === "delivered").length },
          ]} />
          <div style={{ marginTop: 18 }}>
            {loading ? <div style={{ textAlign: "center", padding: 48, color: T.txD, fontSize: 13, fontWeight: 600 }}>Loading…</div> : filtered.length === 0 ? (
              <Empty icon="search" title="No Patients" sub="Maternity patients will appear here." />
            ) : (
              <DataTable
                columns={[
                  { key: "name", label: "Patient", render: (p: MaternityPatient) => <span style={{ fontWeight: 700 }}>{p.patientName}</span> },
                  { key: "edd", label: "EDD", width: 100, render: (p: MaternityPatient) => p.edd ? new Date(p.edd).toLocaleDateString() : "—" },
                  { key: "gest", label: "Gest", width: 70, render: (p: MaternityPatient) => <span style={{ fontFamily: "'DM Mono', monospace" }}>{p.gestWeeks}w</span> },
                  { key: "gp", label: "G/P", width: 70, render: (p: MaternityPatient) => <span style={{ fontFamily: "'DM Mono', monospace" }}>G{p.gravida}P{p.para}</span> },
                  { key: "visits", label: "Visits", width: 70, render: (p: MaternityPatient) => p.visits.length },
                  { key: "risk", label: "Risk", width: 90, render: (p: MaternityPatient) => p.highRisk ? <Pill tone="red">High</Pill> : <Pill tone="emerald">Low</Pill> },
                  { key: "doctor", label: "Doctor", render: (p: MaternityPatient) => p.doctor },
                ]}
                rows={filtered}
                onRowClick={(p) => { setActive(p as MaternityPatient); setVisitForm({ ...emptyVisit }) }}
              />
            )}
          </div>
        </Section>
      </Page>

      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.patientName ?? "Patient"} subtitle={`G${active?.gravida}P${active?.para} · ${active?.gestWeeks}w`} width={540}>
        {active && (
          <>
            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>EDD:</b> {active.edd ? new Date(active.edd).toLocaleDateString() : "—"}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Stage:</b> <Pill tone={active.stage === "labour" ? "red" : active.stage === "antenatal" ? "copper" : "emerald"}>{active.stage}</Pill></div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Doctor:</b> {active.doctor}</div>
              {active.highRisk && <div style={{ fontSize: 13, color: T.red }}><b>Risk Factors:</b> {active.riskFactors || "Flagged High Risk"}</div>}
            </Card>

            {active.delivery && (
              <Card padding={18} style={{ marginBottom: 14, background: `${T.emerald}08`, border: `1px solid ${T.emerald}20` }}>
                <div style={{ fontSize: 10, color: T.emerald, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Delivery Record</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 4 }}><b>Mode:</b> {active.delivery.mode}</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 4 }}><b>Birth Weight:</b> {active.delivery.birthWeight}g</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 4 }}><b>Apgar:</b> {active.delivery.apgar1} / {active.delivery.apgar5} (1min / 5min)</div>
                {active.delivery.complications && <div style={{ fontSize: 13, color: T.red }}><b>Complications:</b> {active.delivery.complications}</div>}
              </Card>
            )}

            {(active.stage === "antenatal" || active.stage === "postnatal") && (
              <Card padding={18} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>New ANC Visit</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Field label="Blood Pressure"><Input placeholder="120/80" value={visitForm.bp} onChange={e => setVisitForm(p => ({ ...p, bp: e.target.value }))} /></Field>
                  <Field label="Weight (kg)"><Input type="number" step="0.1" placeholder="65" value={visitForm.weight} onChange={e => setVisitForm(p => ({ ...p, weight: e.target.value }))} /></Field>
                  <Field label="Fundal Height (cm)"><Input type="number" placeholder="28" value={visitForm.fundalHeight} onChange={e => setVisitForm(p => ({ ...p, fundalHeight: e.target.value }))} /></Field>
                  <Field label="Fetal Heart Rate"><Input type="number" placeholder="140" value={visitForm.fhr} onChange={e => setVisitForm(p => ({ ...p, fhr: e.target.value }))} /></Field>
                </div>
                <Field label="Notes"><TextArea placeholder="Visit notes…" value={visitForm.notes} onChange={e => setVisitForm(p => ({ ...p, notes: e.target.value }))} /></Field>
                <Button full onClick={saveANCVisit} disabled={submitting}>{submitting ? "Saving…" : "Save Visit"}</Button>
              </Card>
            )}

            {active.stage === "labour" && !active.delivery && (
              <Button full onClick={() => { setDeliveryForm({ ...emptyDelivery }); setDeliveryOpen(true) }}>Record Delivery</Button>
            )}

            {active.visits.length > 0 && (
              <Card padding={18}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Visit History ({active.visits.length})</div>
                {active.visits.map((v, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 11, color: T.txD, fontFamily: "'DM Mono', monospace" }}>{new Date(v.date).toLocaleDateString()}</div>
                    <div style={{ fontSize: 12, color: T.tx }}>BP: {v.bp} | Wt: {v.weight}kg | FH: {v.fundalHeight}cm | FHR: {v.fhr}bpm</div>
                    {v.notes && <div style={{ fontSize: 11, color: T.txM }}>{v.notes}</div>}
                  </div>
                ))}
              </Card>
            )}
          </>
        )}
      </Drawer>

      <Modal open={deliveryOpen} onClose={() => setDeliveryOpen(false)} title={`Delivery — ${active?.patientName}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Mode Of Delivery">
            <Select value={deliveryForm.mode} onChange={e => setDeliveryForm(p => ({ ...p, mode: e.target.value }))}>
              <option value="SVD">SVD (Spontaneous Vaginal)</option>
              <option value="C-Section">C-Section</option>
              <option value="Assisted">Assisted (Vacuum/Forceps)</option>
              <option value="Breech">Breech Delivery</option>
            </Select>
          </Field>
          <Field label="Birth Weight (g)"><Input type="number" placeholder="3200" value={deliveryForm.birthWeight} onChange={e => setDeliveryForm(p => ({ ...p, birthWeight: e.target.value }))} /></Field>
          <Field label="Apgar 1 Min"><Input type="number" placeholder="8" value={deliveryForm.apgar1} onChange={e => setDeliveryForm(p => ({ ...p, apgar1: e.target.value }))} /></Field>
          <Field label="Apgar 5 Min"><Input type="number" placeholder="9" value={deliveryForm.apgar5} onChange={e => setDeliveryForm(p => ({ ...p, apgar5: e.target.value }))} /></Field>
        </div>
        <Field label="Blood Loss"><Input placeholder="E.g. 300ml" value={deliveryForm.bloodLoss} onChange={e => setDeliveryForm(p => ({ ...p, bloodLoss: e.target.value }))} /></Field>
        <Field label="Complications"><TextArea placeholder="Any complications…" value={deliveryForm.complications} onChange={e => setDeliveryForm(p => ({ ...p, complications: e.target.value }))} /></Field>
        <div style={{ marginTop: 16 }}><Button full onClick={recordDelivery} disabled={submitting}>{submitting ? "Recording…" : "Record Delivery"}</Button></div>
      </Modal>
    </HealthShell>
  )
}
