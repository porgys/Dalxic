"use client"
import { useState, useMemo, useEffect, useCallback } from "react"
import { HealthShell } from "@/components/ops/HealthShell"
import { useAuth } from "@/lib/use-auth"
import { Page, Card, Stat, Pill, Button, Drawer, SearchBar, Tabs, Section, DataTable, T, Modal, Field, Input, TextArea, Select } from "@/components/ops/primitives"

type View = "queue" | "registration" | "emergency" | "closed"

interface QueueEntry {
  id: string
  contactId: string
  token: string
  department: string
  chiefComplaint: string
  symptomSeverity: number
  emergencyFlag: boolean
  visitStatus: string
  priority: number
  queuedAt: string
  assignedDoctorId?: string | null
  contact?: {
    id: string
    name: string
    phone?: string
    dateOfBirth?: string
    gender?: string
    emergencyContact?: string
    emergencyPhone?: string
    insuranceType?: string
  } | null
}

const emptyReg = { name: "", dob: "", gender: "male", phone: "", emergencyContact: "", emergencyPhone: "", insurance: "none", complaint: "", severity: "1" }
const emptyEm = { name: "", complaint: "", arrivalMode: "ambulance" }

export default function FrontDeskPage() {
  const { session, authFetch } = useAuth()
  const [view, setView] = useState<View>("queue")
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<QueueEntry | null>(null)
  const [regOpen, setRegOpen] = useState(false)
  const [emOpen, setEmOpen] = useState(false)
  const [queueList, setQueueList] = useState<QueueEntry[]>([])
  const [reg, setReg] = useState({ ...emptyReg })
  const [em, setEm] = useState({ ...emptyEm })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchQueue = useCallback(async () => {
    if (!session) return
    try {
      const res = await authFetch("/api/health/queue")
      const json = await res.json()
      if (json.success) {
        setQueueList(json.data)
        setError(null)
      } else {
        setError(json.error || "Failed To Load Queue")
      }
    } catch {
      setError("Network Error — Could Not Load Queue")
    } finally {
      setLoading(false)
    }
  }, [session, authFetch])

  useEffect(() => {
    if (session) fetchQueue()
  }, [session, fetchQueue])

  const today = queueList.length
  const inQueue = queueList.filter(q => q.visitStatus === "waiting" || q.visitStatus === "in_consultation").length
  const emergency = queueList.filter(q => q.emergencyFlag).length
  const closed = queueList.filter(q => q.visitStatus === "closed").length

  const handleRegister = async () => {
    if (!reg.name.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      // Step 1: Create contact
      const contactRes = await authFetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reg.name,
          type: "patient",
          phone: reg.phone || undefined,
          dateOfBirth: reg.dob || undefined,
          gender: reg.gender,
          emergencyContact: reg.emergencyContact || undefined,
          emergencyPhone: reg.emergencyPhone || undefined,
          insuranceType: reg.insurance !== "none" ? reg.insurance : undefined,
        }),
      })
      const contactJson = await contactRes.json()
      if (!contactJson.success) {
        setError(contactJson.error || "Failed To Register Patient")
        setSubmitting(false)
        return
      }

      // Step 2: Add to queue
      const severity = Math.min(10, Math.max(1, parseInt(reg.severity) || 1))
      const queueRes = await authFetch("/api/health/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contactJson.data.id,
          department: "General",
          chiefComplaint: reg.complaint || "General Consultation",
          symptomSeverity: severity,
          emergencyFlag: false,
        }),
      })
      const queueJson = await queueRes.json()
      if (!queueJson.success) {
        setError(queueJson.error || "Patient Created But Failed To Add To Queue")
        setSubmitting(false)
        return
      }

      // Step 3: Refresh queue and close modal
      setReg({ ...emptyReg })
      setRegOpen(false)
      await fetchQueue()
    } catch {
      setError("Network Error — Registration Failed")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEmergency = async () => {
    if (!em.name.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      // Step 1: Create contact
      const contactRes = await authFetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: em.name,
          type: "patient",
        }),
      })
      const contactJson = await contactRes.json()
      if (!contactJson.success) {
        setError(contactJson.error || "Failed To Register Emergency Patient")
        setSubmitting(false)
        return
      }

      // Step 2: Add to queue with emergency flags
      const queueRes = await authFetch("/api/health/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contactJson.data.id,
          department: "Emergency",
          chiefComplaint: em.complaint || "Emergency Admission",
          symptomSeverity: 9,
          emergencyFlag: true,
        }),
      })
      const queueJson = await queueRes.json()
      if (!queueJson.success) {
        setError(queueJson.error || "Patient Created But Failed To Add To Emergency Queue")
        setSubmitting(false)
        return
      }

      // Step 3: Refresh queue and close modal
      setEm({ ...emptyEm })
      setEmOpen(false)
      await fetchQueue()
    } catch {
      setError("Network Error — Emergency Admission Failed")
    } finally {
      setSubmitting(false)
    }
  }

  const sorted = useMemo(() => {
    let items = [...queueList]
    if (view === "emergency") items = items.filter(q => q.emergencyFlag)
    else if (view === "closed") items = items.filter(q => q.visitStatus === "closed")
    else if (view === "queue") items = items.filter(q => q.visitStatus === "waiting" || q.visitStatus === "in_consultation" || q.visitStatus === "paused_for_lab" || q.visitStatus === "lab_results_ready")
    if (query) {
      const q = query.toLowerCase()
      items = items.filter(i => (i.contact?.name || "").toLowerCase().includes(q))
    }
    return items.sort((a, b) => b.symptomSeverity - a.symptomSeverity)
  }, [view, query, queueList])

  return (
    <HealthShell>
      <Page accent="copper" title="Front Desk" subtitle="Patient Registration, Queue Management And Emergency Admission.">
        {error && (
          <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#f87171", fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Patients Today" value={today} accent="copper" icon="customers" />
          <Stat label="In Queue" value={inQueue} accent="copper" icon="orders" />
          <Stat label="Emergency" value={emergency} accent="neutral" icon="bolt" />
          <Stat label="Closed Visits" value={closed} accent="emerald" icon="check" />
        </div>

        <Section
          title="Patient Queue"
          action={
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 260 }}><SearchBar value={query} onChange={setQuery} placeholder="Search Patient…" /></div>
              <Button icon="plus" onClick={() => setRegOpen(true)}>Register Patient</Button>
              <Button variant="outline" icon="bolt" onClick={() => setEmOpen(true)}>Emergency Admit</Button>
            </div>
          }
        >
          <Tabs<View>
            value={view} onChange={setView} accent="copper"
            tabs={[
              { key: "queue", label: "Queue", count: queueList.filter(q => q.visitStatus !== "closed").length },
              { key: "registration", label: "Registration" },
              { key: "emergency", label: "Emergency", count: emergency },
              { key: "closed", label: "Closed", count: closed },
            ]}
          />
          {loading ? (
            <div style={{ textAlign: "center", padding: 48, color: T.txD, fontSize: 13, fontWeight: 600 }}>Loading Queue…</div>
          ) : (
            <DataTable
              columns={[
                { key: "token", label: "Token", width: 80, render: (q: QueueEntry) => <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: q.emergencyFlag ? T.red : T.copper }}>{q.token}</span> },
                { key: "patientName", label: "Patient Name", render: (q: QueueEntry) => q.contact?.name || "Unknown Patient" },
                { key: "chiefComplaint", label: "Complaint", render: (q: QueueEntry) => q.chiefComplaint },
                { key: "symptomSeverity", label: "Severity", width: 90, render: (q: QueueEntry) => <Pill tone={q.emergencyFlag ? "red" : q.symptomSeverity >= 4 ? "amber" : "emerald"}>{q.symptomSeverity}/10</Pill> },
                { key: "visitStatus", label: "Status", width: 110, render: (q: QueueEntry) => <Pill tone={q.visitStatus === "waiting" ? "neutral" : q.visitStatus === "lab_results_ready" ? "sky" : q.visitStatus === "in_consultation" ? "copper" : q.visitStatus === "paused_for_lab" ? "amber" : "emerald"}>{q.visitStatus === "lab_results_ready" ? "Lab Ready" : q.visitStatus.replace(/_/g, " ")}</Pill> },
                { key: "department", label: "Department", render: (q: QueueEntry) => q.department || "—" },
                { key: "queuedAt", label: "Wait", width: 70, render: (q: QueueEntry) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{Math.round((Date.now() - new Date(q.queuedAt).getTime()) / 60000)}m</span> },
              ]}
              rows={sorted}
              onRowClick={(q: QueueEntry) => setActive(q)}
            />
          )}
        </Section>
      </Page>

      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.contact?.name ?? "Patient"} subtitle={`Token ${active?.token}`} width={480}>
        {active && (
          <>
            <Card padding={20} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Personal Info</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Name:</b> {active.contact?.name || "—"}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>DOB:</b> {active.contact?.dateOfBirth || "—"}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Gender:</b> {active.contact?.gender || "—"}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Phone:</b> {active.contact?.phone || "—"}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Insurance:</b> {active.contact?.insuranceType || "None"}</div>
            </Card>
            <Card padding={20} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Emergency Contact</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Contact:</b> {active.contact?.emergencyContact || "—"}</div>
              <div style={{ fontSize: 13, color: T.tx }}><b>Phone:</b> {active.contact?.emergencyPhone || "—"}</div>
            </Card>
            <Card padding={20}>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Visit Info</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Complaint:</b> {active.chiefComplaint}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Severity:</b> {active.symptomSeverity}/10</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Department:</b> {active.department}</div>
              <div style={{ fontSize: 13, color: T.tx }}><b>Status:</b> {active.visitStatus.replace(/_/g, " ")}</div>
            </Card>
          </>
        )}
      </Drawer>

      <Modal open={regOpen} onClose={() => setRegOpen(false)} title="Register Patient">
        <Field label="Full Name"><Input placeholder="Patient Name" value={reg.name} onChange={e => setReg(p => ({ ...p, name: e.target.value }))} /></Field>
        <Field label="Date Of Birth"><Input type="date" value={reg.dob} onChange={e => setReg(p => ({ ...p, dob: e.target.value }))} /></Field>
        <Field label="Gender">
          <Select value={reg.gender} onChange={e => setReg(p => ({ ...p, gender: e.target.value }))}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
        </Field>
        <Field label="Phone"><Input placeholder="0XX XXX XXXX" value={reg.phone} onChange={e => setReg(p => ({ ...p, phone: e.target.value }))} /></Field>
        <Field label="Emergency Contact"><Input placeholder="Contact Name" value={reg.emergencyContact} onChange={e => setReg(p => ({ ...p, emergencyContact: e.target.value }))} /></Field>
        <Field label="Emergency Phone"><Input placeholder="0XX XXX XXXX" value={reg.emergencyPhone} onChange={e => setReg(p => ({ ...p, emergencyPhone: e.target.value }))} /></Field>
        <Field label="Insurance Type">
          <Select value={reg.insurance} onChange={e => setReg(p => ({ ...p, insurance: e.target.value }))}>
            <option value="none">None</option>
            <option value="nhis">NHIS</option>
            <option value="private">Private</option>
          </Select>
        </Field>
        <Field label="Chief Complaint"><TextArea placeholder="Describe Presenting Complaint…" value={reg.complaint} onChange={e => setReg(p => ({ ...p, complaint: e.target.value }))} /></Field>
        <Field label="Severity (1-10)"><Input type="number" placeholder="1" value={reg.severity} onChange={e => setReg(p => ({ ...p, severity: e.target.value }))} /></Field>
        <div style={{ marginTop: 16 }}><Button full onClick={handleRegister} disabled={submitting}>{submitting ? "Registering…" : "Register Patient"}</Button></div>
      </Modal>

      <Modal open={emOpen} onClose={() => setEmOpen(false)} title="Emergency Admit">
        <Field label="Full Name"><Input placeholder="Patient Name" value={em.name} onChange={e => setEm(p => ({ ...p, name: e.target.value }))} /></Field>
        <Field label="Complaint"><TextArea placeholder="Emergency Complaint…" value={em.complaint} onChange={e => setEm(p => ({ ...p, complaint: e.target.value }))} /></Field>
        <Field label="Arrival Mode">
          <Select value={em.arrivalMode} onChange={e => setEm(p => ({ ...p, arrivalMode: e.target.value }))}>
            <option value="ambulance">Ambulance</option>
            <option value="walk-in">Walk-In</option>
            <option value="transfer">Transfer</option>
          </Select>
        </Field>
        <div style={{ marginTop: 16 }}><Button full onClick={handleEmergency} disabled={submitting}>{submitting ? "Admitting…" : "Admit Emergency"}</Button></div>
      </Modal>
    </HealthShell>
  )
}
