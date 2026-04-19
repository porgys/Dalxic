"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { HealthShell } from "@/components/ops/HealthShell"
import { useAuth } from "@/lib/use-auth"
import { Page, Stat, Pill, Drawer, Tabs, DataTable, Card, T, Button, TextArea, Field, Input, Select, Modal, Empty, Section, SearchBar } from "@/components/ops/primitives"

type View = "admitted" | "rounds" | "discharge"

interface Admission {
  id: string; contactId: string; serviceItemId: string; type: string
  identifier: string; status: string; admittedAt: string; dischargedAt?: string
  notes?: string; meta?: Record<string, unknown>
}

interface WardPatient {
  id: string; admissionId: string; contactId: string
  patientName: string; ward: string; bed: string; diagnosis: string
  admittedAt: string; dayCount: number; status: string
  doctor?: string; dietaryNotes?: string
  rounds: { date: string; notes: string; vitalsSummary: string; orders: string }[]
}

interface ClinicalRecord {
  id: string; contactId: string; type: string; status: string
  data: Record<string, unknown>; performedAt: string; performedByName: string
}

const emptyAdmit = { contactId: "", ward: "General Ward", bed: "", diagnosis: "", doctor: "", dietaryNotes: "" }
const emptyRound = { notes: "", vitalsSummary: "", orders: "" }
const emptyDischarge = { summary: "", medications: "", followUp: "", instructions: "" }

export default function WardPage() {
  const { session, authFetch } = useAuth()
  const [view, setView] = useState<View>("admitted")
  const [query, setQuery] = useState("")
  const [patients, setPatients] = useState<WardPatient[]>([])
  const [active, setActive] = useState<WardPatient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [admitOpen, setAdmitOpen] = useState(false)
  const [admitForm, setAdmitForm] = useState({ ...emptyAdmit })
  const [roundForm, setRoundForm] = useState({ ...emptyRound })
  const [dischargeOpen, setDischargeOpen] = useState(false)
  const [dischargeForm, setDischargeForm] = useState({ ...emptyDischarge })
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([])

  const fetchData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const [admRes, wardRoundsRes, contactsRes] = await Promise.all([
        authFetch("/api/admissions?status=active"),
        authFetch("/api/health/clinical?type=ward_round"),
        authFetch("/api/contacts"),
      ])
      const [admJson, roundsJson, contactsJson] = await Promise.all([admRes.json(), wardRoundsRes.json(), contactsRes.json()])

      if (contactsJson.success) setContacts(contactsJson.data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })))

      const admissions: Admission[] = admJson.success ? admJson.data : []
      const rounds: ClinicalRecord[] = roundsJson.success ? roundsJson.data : []

      const wardPatients: WardPatient[] = admissions.map(adm => {
        const meta = (adm.meta || {}) as Record<string, unknown>
        const contactName = contactsJson.success ? contactsJson.data.find((c: { id: string; name: string }) => c.id === adm.contactId)?.name || "Unknown" : "Unknown"
        const patientRounds = rounds.filter(r => r.contactId === adm.contactId).map(r => ({
          date: r.performedAt, notes: (r.data.notes as string) || "", vitalsSummary: (r.data.vitalsSummary as string) || "", orders: (r.data.orders as string) || "",
        }))
        const daysAdmitted = Math.max(1, Math.ceil((Date.now() - new Date(adm.admittedAt).getTime()) / 86400000))

        return {
          id: adm.id, admissionId: adm.id, contactId: adm.contactId,
          patientName: contactName, ward: (meta.ward as string) || "General Ward",
          bed: adm.identifier || "—", diagnosis: adm.notes || "—",
          admittedAt: adm.admittedAt, dayCount: daysAdmitted, status: adm.status,
          doctor: (meta.doctor as string) || undefined,
          dietaryNotes: (meta.dietaryNotes as string) || undefined,
          rounds: patientRounds,
        }
      })
      setPatients(wardPatients); setError(null)
    } catch { setError("Network Error") } finally { setLoading(false) }
  }, [session, authFetch])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  const admitted = patients.filter(p => p.status === "active").length
  const avgStay = patients.length > 0 ? Math.round(patients.reduce((s, p) => s + p.dayCount, 0) / patients.length) : 0
  const longStay = patients.filter(p => p.dayCount > 7).length

  const filtered = useMemo(() => {
    let items = patients
    if (view === "discharge") items = items.filter(p => p.dayCount > 5 || p.status !== "active")
    if (query) { const q = query.toLowerCase(); items = items.filter(p => p.patientName.toLowerCase().includes(q) || p.ward.toLowerCase().includes(q)) }
    return items
  }, [view, query, patients])

  async function admitPatient() {
    if (!admitForm.contactId || !admitForm.bed) return
    setSubmitting(true); setError(null)
    try {
      await authFetch("/api/admissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        contactId: admitForm.contactId, serviceItemId: "ward_bed", type: "inpatient",
        identifier: admitForm.bed, notes: admitForm.diagnosis,
        meta: { ward: admitForm.ward, doctor: admitForm.doctor, dietaryNotes: admitForm.dietaryNotes },
      }) })
      setAdmitOpen(false); setAdmitForm({ ...emptyAdmit }); await fetchData()
    } catch { setError("Admission Failed") } finally { setSubmitting(false) }
  }

  async function saveRound(patient: WardPatient) {
    if (!roundForm.notes.trim()) return
    setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        contactId: patient.contactId, type: "ward_round",
        data: { notes: roundForm.notes, vitalsSummary: roundForm.vitalsSummary, orders: roundForm.orders, patientName: patient.patientName, ward: patient.ward, bed: patient.bed },
        status: "active",
      }) })
      setRoundForm({ ...emptyRound }); await fetchData()
    } catch { setError("Failed To Save Round") } finally { setSubmitting(false) }
  }

  async function dischargePatient(patient: WardPatient) {
    if (!dischargeForm.summary.trim()) return
    setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        contactId: patient.contactId, type: "discharge_summary",
        data: { summary: dischargeForm.summary, medications: dischargeForm.medications, followUp: dischargeForm.followUp, instructions: dischargeForm.instructions, patientName: patient.patientName, ward: patient.ward, dayCount: patient.dayCount, diagnosis: patient.diagnosis },
        status: "completed",
      }) })
      setDischargeOpen(false); setDischargeForm({ ...emptyDischarge }); setActive(null); await fetchData()
    } catch { setError("Discharge Failed") } finally { setSubmitting(false) }
  }

  return (
    <HealthShell>
      <Page accent="copper" title="Ward / IPD" subtitle="Admissions, Daily Rounds, Bed Board And Discharge Management.">
        {error && <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#f87171", fontSize: 13, fontWeight: 600 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Admitted" value={admitted} accent="copper" icon="tenants" />
          <Stat label="Beds Occupied" value={`${admitted}/24`} accent="copper" icon="orders" />
          <Stat label="Avg Stay" value={`${avgStay}d`} accent="amber" icon="calendar" />
          <Stat label="Long Stay (>7d)" value={longStay} accent={longStay > 0 ? "amber" : "emerald"} icon="bolt" />
        </div>

        <Section title="Ward Management" action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 260 }}><SearchBar value={query} onChange={setQuery} placeholder="Search Patient Or Ward…" /></div>
            <Button icon="plus" onClick={() => setAdmitOpen(true)}>Admit Patient</Button>
          </div>
        }>
          <Tabs<View> value={view} onChange={setView} accent="copper" tabs={[
            { key: "admitted", label: "Admitted", count: admitted },
            { key: "rounds", label: "Daily Rounds" },
            { key: "discharge", label: "Discharge Planning", count: longStay },
          ]} />
          <div style={{ marginTop: 18 }}>
            {loading ? <div style={{ textAlign: "center", padding: 48, color: T.txD, fontSize: 13, fontWeight: 600 }}>Loading…</div> : filtered.length === 0 ? (
              <Empty icon="search" title="No Patients" sub="Admit patients to see them here." action={<Button icon="plus" onClick={() => setAdmitOpen(true)}>Admit Patient</Button>} />
            ) : (
              <DataTable
                columns={[
                  { key: "patientName", label: "Patient", render: (p: WardPatient) => <span style={{ fontWeight: 700 }}>{p.patientName}</span> },
                  { key: "ward", label: "Ward", render: (p: WardPatient) => p.ward },
                  { key: "bed", label: "Bed", width: 70, render: (p: WardPatient) => <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{p.bed}</span> },
                  { key: "diagnosis", label: "Diagnosis", render: (p: WardPatient) => p.diagnosis },
                  { key: "dayCount", label: "Days", width: 70, render: (p: WardPatient) => <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: p.dayCount > 7 ? T.amber : T.tx }}>{p.dayCount}</span> },
                  { key: "rounds", label: "Rounds", width: 80, render: (p: WardPatient) => <span style={{ fontFamily: "'DM Mono', monospace" }}>{p.rounds.length}</span> },
                  { key: "status", label: "Status", width: 100, render: (p: WardPatient) => <Pill tone={p.status === "active" ? "copper" : "emerald"}>{p.status}</Pill> },
                ]}
                rows={filtered}
                onRowClick={(p) => { setActive(p as WardPatient); setRoundForm({ ...emptyRound }) }}
              />
            )}
          </div>
        </Section>
      </Page>

      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.patientName ?? "Patient"} subtitle={`${active?.ward} · Bed ${active?.bed}`} width={540}>
        {active && (
          <>
            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Diagnosis:</b> {active.diagnosis}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Admitted:</b> {new Date(active.admittedAt).toLocaleDateString()}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Day Count:</b> {active.dayCount}</div>
              {active.doctor && <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Doctor:</b> {active.doctor}</div>}
              {active.dietaryNotes && <div style={{ fontSize: 13, color: T.tx }}><b>Dietary:</b> {active.dietaryNotes}</div>}
            </Card>

            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>New Ward Round Entry</div>
              <Field label="Progress Notes"><TextArea placeholder="Clinical notes, assessments…" value={roundForm.notes} onChange={e => setRoundForm(p => ({ ...p, notes: e.target.value }))} /></Field>
              <Field label="Vitals Summary"><Input placeholder="BP 120/80, HR 72, Temp 36.8…" value={roundForm.vitalsSummary} onChange={e => setRoundForm(p => ({ ...p, vitalsSummary: e.target.value }))} /></Field>
              <Field label="Orders"><TextArea placeholder="New orders, medication changes…" value={roundForm.orders} onChange={e => setRoundForm(p => ({ ...p, orders: e.target.value }))} /></Field>
              <Button full onClick={() => saveRound(active)} disabled={submitting || !roundForm.notes.trim()}>{submitting ? "Saving…" : "Save Round"}</Button>
            </Card>

            {active.rounds.length > 0 && (
              <Card padding={18} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Previous Rounds ({active.rounds.length})</div>
                {active.rounds.slice(0, 5).map((r, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 11, color: T.txD, fontFamily: "'DM Mono', monospace" }}>{new Date(r.date).toLocaleString()}</div>
                    <div style={{ fontSize: 13, color: T.tx, marginTop: 4 }}>{r.notes}</div>
                    {r.vitalsSummary && <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>Vitals: {r.vitalsSummary}</div>}
                    {r.orders && <div style={{ fontSize: 11, color: T.sky, marginTop: 2 }}>Orders: {r.orders}</div>}
                  </div>
                ))}
              </Card>
            )}

            <Button variant="outline" full onClick={() => { setDischargeForm({ ...emptyDischarge }); setDischargeOpen(true) }}>Discharge Patient</Button>
          </>
        )}
      </Drawer>

      <Modal open={admitOpen} onClose={() => setAdmitOpen(false)} title="Admit Patient">
        <Field label="Patient">
          <Select value={admitForm.contactId} onChange={e => setAdmitForm(p => ({ ...p, contactId: e.target.value }))}>
            <option value="">Select Patient</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Ward">
            <Select value={admitForm.ward} onChange={e => setAdmitForm(p => ({ ...p, ward: e.target.value }))}>
              <option value="General Ward">General Ward</option>
              <option value="Surgical Ward">Surgical Ward</option>
              <option value="Paediatric Ward">Paediatric Ward</option>
              <option value="Maternity Ward">Maternity Ward</option>
              <option value="Private Ward">Private Ward</option>
            </Select>
          </Field>
          <Field label="Bed Number"><Input placeholder="Bed 1A" value={admitForm.bed} onChange={e => setAdmitForm(p => ({ ...p, bed: e.target.value }))} /></Field>
        </div>
        <Field label="Diagnosis"><TextArea placeholder="Admission diagnosis…" value={admitForm.diagnosis} onChange={e => setAdmitForm(p => ({ ...p, diagnosis: e.target.value }))} /></Field>
        <Field label="Attending Doctor"><Input placeholder="Doctor Name" value={admitForm.doctor} onChange={e => setAdmitForm(p => ({ ...p, doctor: e.target.value }))} /></Field>
        <Field label="Dietary Notes"><Input placeholder="E.g. Diabetic Diet, NPO…" value={admitForm.dietaryNotes} onChange={e => setAdmitForm(p => ({ ...p, dietaryNotes: e.target.value }))} /></Field>
        <div style={{ marginTop: 16 }}><Button full onClick={admitPatient} disabled={submitting}>{submitting ? "Admitting…" : "Admit Patient"}</Button></div>
      </Modal>

      <Modal open={dischargeOpen} onClose={() => setDischargeOpen(false)} title={`Discharge — ${active?.patientName}`}>
        <Field label="Discharge Summary"><TextArea placeholder="Summary of hospital stay…" value={dischargeForm.summary} onChange={e => setDischargeForm(p => ({ ...p, summary: e.target.value }))} /></Field>
        <Field label="Take-Home Medications"><TextArea placeholder="Medications to continue at home…" value={dischargeForm.medications} onChange={e => setDischargeForm(p => ({ ...p, medications: e.target.value }))} /></Field>
        <Field label="Follow-Up"><Input placeholder="E.g. Review in 2 weeks" value={dischargeForm.followUp} onChange={e => setDischargeForm(p => ({ ...p, followUp: e.target.value }))} /></Field>
        <Field label="Patient Instructions"><TextArea placeholder="Instructions for patient…" value={dischargeForm.instructions} onChange={e => setDischargeForm(p => ({ ...p, instructions: e.target.value }))} /></Field>
        <div style={{ marginTop: 16 }}><Button full onClick={() => active && dischargePatient(active)} disabled={submitting || !dischargeForm.summary.trim()}>{submitting ? "Discharging…" : "Complete Discharge"}</Button></div>
      </Modal>
    </HealthShell>
  )
}
