"use client"
import { useState, useMemo, useEffect, useCallback } from "react"
import { HealthShell } from "@/components/ops/HealthShell"
import { useAuth } from "@/lib/use-auth"
import { Page, Card, Stat, Pill, Button, Section, T, TextArea, Input, Select, Field } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_SOAP_TEMPLATES } from "@/lib/ops/mock"

const SPECIALTIES = ["General Medicine","Paediatrics","Obstetrics & Gynaecology","Surgery","Orthopaedics","ENT","Ophthalmology","Dermatology","Cardiology","Neurology","Psychiatry","Urology","Anaesthesia","Emergency Medicine"]
const LAB_TESTS = ["Full Blood Count","Malaria RDT","Urinalysis","Blood Sugar","Liver Function","Renal Function","Lipid Profile","HIV Screening"]
const IMAGING_TYPES = ["Chest X-Ray","Abdominal X-Ray","CT Head","CT Abdomen","CT Chest","MRI Brain","MRI Spine","Pelvic X-Ray","Skeletal Survey","Mammogram"]
const ULTRASOUND_TYPES = ["Obstetric Ultrasound","Pelvic Ultrasound","Abdominal Ultrasound","Thyroid Ultrasound","Renal Ultrasound","Breast Ultrasound","Doppler"]
const INJECTION_LIST = ["IM Diclofenac 75mg","IM Artesunate","IV Normal Saline","IV Dextrose 5%","SC Insulin","IM Tetanus Toxoid","IM Ceftriaxone 1g","IV Metronidazole","IV Ciprofloxacin","SC Enoxaparin"]

/* ── Types for API data ────────────────────────────── */
interface QueueContact {
  id: string
  name: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  bloodGroup?: string
  allergies?: string[]
  insuranceType?: string
}

interface QueueEntry {
  id: string
  contactId: string
  token: string
  department: string
  chiefComplaint: string
  symptomSeverity: number
  emergencyFlag: boolean
  visitStatus: string
  assignedDoctorId?: string
  priority: number
  queuedAt: string
  calledAt?: string
  completedAt?: string
  contact?: QueueContact
}

interface DrugItem {
  id: string
  name: string
  sellingPrice: number
  stock: number
  unit?: string
}

export default function DoctorPage() {
  const { session, authFetch } = useAuth()

  /* ── Live data ───────────────────────────────────── */
  const [queueList, setQueueList] = useState<QueueEntry[]>([])
  const [drugCatalogue, setDrugCatalogue] = useState<DrugItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  /* ── Form state ──────────────────────────────────── */
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [soap, setSoap] = useState({ subjective: "", objective: "", assessment: "", plan: "" })
  const [diagnosis, setDiagnosis] = useState({ primary: "", secondary: "" })
  const [labChecked, setLabChecked] = useState<Record<string, boolean>>({})
  const [imagingChecked, setImagingChecked] = useState<Record<string, boolean>>({})
  const [ultrasoundChecked, setUltrasoundChecked] = useState<Record<string, boolean>>({})
  const [injectionChecked, setInjectionChecked] = useState<Record<string, boolean>>({})
  const [prescriptions, setPrescriptions] = useState([{ drug: "", dosage: "", duration: "", serviceItemId: "" }])
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [referral, setReferral] = useState({ specialty: SPECIALTIES[0], urgency: "routine", reason: "" })

  /* ── Fetch helpers ───────────────────────────────── */
  const fetchQueue = useCallback(async () => {
    if (!session) return
    try {
      const res = await authFetch("/api/health/queue")
      const json = await res.json()
      if (json.success) setQueueList(json.data)
    } catch { /* network error — keep stale data */ }
  }, [session, authFetch])

  const fetchCatalogue = useCallback(async () => {
    if (!session) return
    try {
      const res = await authFetch("/api/catalogue?behaviour=product")
      const json = await res.json()
      if (json.success) setDrugCatalogue(json.data)
    } catch { /* network error */ }
  }, [session, authFetch])

  /* ── Load on mount ───────────────────────────────── */
  useEffect(() => {
    if (!session) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchQueue(), fetchCatalogue()])
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [session, fetchQueue, fetchCatalogue])

  /* ── Reset form ──────────────────────────────────── */
  const resetForm = () => {
    setSoap({ subjective: "", objective: "", assessment: "", plan: "" })
    setDiagnosis({ primary: "", secondary: "" })
    setLabChecked({})
    setImagingChecked({})
    setUltrasoundChecked({})
    setInjectionChecked({})
    setPrescriptions([{ drug: "", dosage: "", duration: "", serviceItemId: "" }])
    setActiveTemplate(null)
    setReferral({ specialty: SPECIALTIES[0], urgency: "routine", reason: "" })
    setSelectedId(null)
  }

  /* ── Select patient → mark in_consultation ───────── */
  const handleSelectPatient = async (id: string) => {
    if (!session) return
    setSelectedId(id)
    const entry = queueList.find(q => q.id === id)
    if (entry && entry.visitStatus === "waiting" || entry?.visitStatus === "lab_results_ready") {
      try {
        await authFetch("/api/health/queue", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, visitStatus: "in_consultation", assignedDoctorId: session.operatorId }),
        })
        await fetchQueue()
      } catch { /* silent — queue will show stale until next refresh */ }
    }
  }

  /* ── Save clinical record helper ─────────────────── */
  const saveClinicalRecord = async (contactId: string, labOrders: string[]) => {
    const validPrescriptions = prescriptions.filter(p => p.drug.trim())
    const data: Record<string, unknown> = {
      subjective: soap.subjective,
      objective: soap.objective,
      assessment: soap.assessment,
      plan: soap.plan,
      diagnosis: { primary: diagnosis.primary, secondary: diagnosis.secondary },
    }
    if (labOrders.length > 0) data.labOrders = labOrders
    const imagingOrders = Object.entries(imagingChecked).filter(([, v]) => v).map(([k]) => k)
    if (imagingOrders.length > 0) data.imagingOrders = imagingOrders
    const ultrasoundOrders = Object.entries(ultrasoundChecked).filter(([, v]) => v).map(([k]) => k)
    if (ultrasoundOrders.length > 0) data.ultrasoundOrders = ultrasoundOrders
    const injectionOrders = Object.entries(injectionChecked).filter(([, v]) => v).map(([k]) => k)
    if (injectionOrders.length > 0) data.injectionOrders = injectionOrders
    if (validPrescriptions.length > 0) data.prescriptions = validPrescriptions.map(p => ({ drug: p.drug, dosage: p.dosage, duration: p.duration }))
    if (referral.reason.trim()) data.referral = { specialty: referral.specialty, urgency: referral.urgency, reason: referral.reason }

    const res = await authFetch("/api/health/clinical", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, type: "consultation", data, status: "completed" }),
    })
    return res.json()
  }

  /* ── Send To Lab — Pause ─────────────────────────── */
  const handleSendToLab = async () => {
    if (!selectedId || !session || saving) return
    const entry = queueList.find(q => q.id === selectedId)
    if (!entry) return
    setSaving(true)
    try {
      const labOrders = Object.entries(labChecked).filter(([, v]) => v).map(([k]) => k)
      await saveClinicalRecord(entry.contactId, labOrders)
      await authFetch("/api/health/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, visitStatus: "paused_for_lab" }),
      })
      resetForm()
      await fetchQueue()
    } catch { /* error */ }
    setSaving(false)
  }

  /* ── End Consultation ────────────────────────────── */
  const handleEndConsultation = async () => {
    if (!selectedId || !session || saving) return
    const entry = queueList.find(q => q.id === selectedId)
    if (!entry) return
    setSaving(true)
    try {
      const labOrders = Object.entries(labChecked).filter(([, v]) => v).map(([k]) => k)
      await saveClinicalRecord(entry.contactId, labOrders)

      /* Create pharmacy cart for prescriptions */
      const validRx = prescriptions.filter(p => p.serviceItemId)
      if (validRx.length > 0) {
        /* Get branch — use first branch available */
        const branchRes = await authFetch("/api/branches")
        const branchJson = await branchRes.json()
        const branchId = branchJson.success && branchJson.data.length > 0 ? branchJson.data[0].id : null

        if (branchId) {
          const cartRes = await authFetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ branchId, contactId: entry.contactId }),
          })
          const cartJson = await cartRes.json()
          if (cartJson.success) {
            const cartId = cartJson.data.id
            for (const rx of validRx) {
              await authFetch(`/api/cart/${cartId}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ serviceItemId: rx.serviceItemId, quantity: 1 }),
              })
            }
          }
        }
      }

      await authFetch("/api/health/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, visitStatus: "closed" }),
      })
      resetForm()
      await fetchQueue()
    } catch { /* error */ }
    setSaving(false)
  }

  /* ── Derived data ────────────────────────────────── */
  const queue = useMemo(() =>
    [...queueList]
      .filter(q => q.visitStatus !== "closed")
      .sort((a, b) => {
        if (a.emergencyFlag && !b.emergencyFlag) return -1
        if (b.emergencyFlag && !a.emergencyFlag) return 1
        if (a.visitStatus === "lab_results_ready" && b.visitStatus !== "lab_results_ready") return -1
        if (b.visitStatus === "lab_results_ready" && a.visitStatus !== "lab_results_ready") return 1
        return b.symptomSeverity - a.symptomSeverity
      }), [queueList])

  const selected = queue.find(q => q.id === selectedId)
  const contact = selected?.contact ?? null
  const seen = queueList.filter(q => q.visitStatus === "closed").length
  const labReturns = queueList.filter(q => q.visitStatus === "lab_results_ready").length
  const hasLab = Object.values(labChecked).some(Boolean)

  const age = contact?.dateOfBirth
    ? new Date().getFullYear() - new Date(contact.dateOfBirth).getFullYear()
    : 0

  /* ── SOAP templates ──────────────────────────────── */
  const applyTemplate = (tId: string) => {
    const t = MOCK_SOAP_TEMPLATES.find(x => x.id === tId)
    if (!t) return
    setActiveTemplate(tId)
    setSoap({ subjective: t.notes.subjective, objective: t.notes.objective, assessment: t.notes.assessment, plan: t.notes.plan })
    setDiagnosis({ primary: t.diagnosis, secondary: "" })
    /* Match template drugs to catalogue items for serviceItemId */
    setPrescriptions(t.prescriptions.map(p => {
      const match = drugCatalogue.find(d => d.name.toLowerCase().includes(p.drug.toLowerCase().split(" ")[0]))
      return { drug: p.drug, dosage: p.dosage, duration: p.duration, serviceItemId: match?.id ?? "" }
    }))
    const lc: Record<string, boolean> = {}
    t.suggestedLabs.forEach(l => { lc[l] = true })
    setLabChecked(lc)
  }

  /* ── Drug picker helper ──────────────────────────── */
  const handleDrugSelect = (index: number, itemId: string) => {
    const drug = drugCatalogue.find(d => d.id === itemId)
    if (!drug) return
    const next = [...prescriptions]
    next[index] = { ...next[index], drug: drug.name, serviceItemId: drug.id }
    setPrescriptions(next)
  }

  return (
    <HealthShell>
      <Page accent="copper" title="Doctor" subtitle="Consultation Workspace — SOAP Notes, Prescriptions, Lab Orders And Referrals.">
        {loading ? (
          <Card padding={40} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, color: T.txM }}>Loading Workspace...</div>
          </Card>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
              <Stat label="Patients Seen" value={seen} accent="copper" icon="check" />
              <Stat label="In Queue" value={queue.length} accent="copper" icon="orders" />
              <Stat label="Lab Returns" value={labReturns} accent="sky" icon="analytics" />
              <Stat label="Referrals Sent" value={0} accent="amber" icon="share" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16 }}>
              {/* LEFT RAIL */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Patient Queue</div>
                {queue.length === 0 && (
                  <div style={{ fontSize: 12, color: T.txD, padding: 16, textAlign: "center" }}>No Patients In Queue</div>
                )}
                {queue.map(q => {
                  const isEm = q.emergencyFlag
                  const isLab = q.visitStatus === "lab_results_ready"
                  const isActive = q.id === selectedId
                  const patientName = q.contact?.name ?? "Unknown Patient"
                  return (
                    <div key={q.id} onClick={() => handleSelectPatient(q.id)} style={{
                      padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                      background: isActive ? `${T.copper}12` : T.surface2,
                      border: `1px solid ${isEm ? T.red + "60" : isActive ? T.copper + "40" : T.border}`,
                      transition: "all 0.15s",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, fontSize: 13, color: isEm ? T.red : T.copper }}>{q.token}</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <Pill tone={isEm ? "red" : q.symptomSeverity >= 4 ? "amber" : "emerald"}>{q.symptomSeverity}</Pill>
                          {isLab && <Pill tone="sky">Lab Ready</Pill>}
                          {q.visitStatus === "in_consultation" && <Pill tone="copper">In Session</Pill>}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.tx }}>{patientName}</div>
                      <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{Math.round((Date.now() - new Date(q.queuedAt).getTime()) / 60000)}m Wait</div>
                    </div>
                  )
                })}
              </div>

              {/* RIGHT WORKSPACE */}
              <div>
                {!selected ? (
                  <Card padding={40} style={{ textAlign: "center" }}>
                    <Icon name="user" size={32} color={T.txD} />
                    <div style={{ fontSize: 14, color: T.txM, marginTop: 12 }}>Select A Patient From The Queue</div>
                  </Card>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Card padding={18}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{contact?.name ?? "Unknown"}</div>
                          <div style={{ fontSize: 12, color: T.txM, marginTop: 4 }}>
                            {age > 0 ? `${age} Yrs` : "Age Unknown"} · {contact?.gender ?? "—"} · Severity {selected.symptomSeverity}/10
                            {contact?.bloodGroup ? ` · ${contact.bloodGroup}` : ""}
                            {contact?.allergies && contact.allergies.length > 0 ? ` · Allergies: ${contact.allergies.join(", ")}` : ""}
                          </div>
                        </div>
                        <Pill tone={selected.emergencyFlag ? "red" : "copper"}>{selected.chiefComplaint}</Pill>
                      </div>
                    </Card>

                    <Card padding={16}>
                      <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>SOAP Templates</div>
                      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                        {MOCK_SOAP_TEMPLATES.map(t => (
                          <button key={t.id} onClick={() => applyTemplate(t.id)} style={{
                            flexShrink: 0, padding: "8px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                            background: activeTemplate === t.id ? `${T.copper}18` : T.surface2,
                            border: `1px solid ${activeTemplate === t.id ? T.copper : T.border}`,
                            color: activeTemplate === t.id ? T.copper : T.txM,
                            cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
                          }}>{t.name}</button>
                        ))}
                      </div>
                    </Card>

                    <Card padding={16}>
                      <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>SOAP Notes</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <Field label="Subjective"><TextArea value={soap.subjective} onChange={(e) => setSoap(p => ({ ...p, subjective: e.target.value }))} placeholder="Patient's complaint in their words…" /></Field>
                        <Field label="Objective"><TextArea value={soap.objective} onChange={(e) => setSoap(p => ({ ...p, objective: e.target.value }))} placeholder="Examination findings…" /></Field>
                        <Field label="Assessment"><TextArea value={soap.assessment} onChange={(e) => setSoap(p => ({ ...p, assessment: e.target.value }))} placeholder="Clinical assessment…" /></Field>
                        <Field label="Plan"><TextArea value={soap.plan} onChange={(e) => setSoap(p => ({ ...p, plan: e.target.value }))} placeholder="Treatment plan…" /></Field>
                      </div>
                    </Card>

                    <Card padding={16}>
                      <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Diagnosis</div>
                      <Field label="Primary Diagnosis"><Input value={diagnosis.primary} onChange={(e) => setDiagnosis(p => ({ ...p, primary: e.target.value }))} placeholder="Primary diagnosis…" /></Field>
                      <Field label="Secondary (Comma Separated)"><Input value={diagnosis.secondary} onChange={(e) => setDiagnosis(p => ({ ...p, secondary: e.target.value }))} placeholder="Secondary diagnoses…" /></Field>
                    </Card>

                    <Card padding={16}>
                      <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Lab Orders</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {LAB_TESTS.map(test => (
                          <label key={test} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: labChecked[test] ? `${T.sky}14` : T.surface2, border: `1px solid ${labChecked[test] ? T.sky + "40" : T.border}`, cursor: "pointer", fontSize: 11, fontWeight: 600, color: labChecked[test] ? T.sky : T.txM }}>
                            <input type="checkbox" checked={!!labChecked[test]} onChange={() => setLabChecked(p => ({ ...p, [test]: !p[test] }))} style={{ accentColor: T.sky }} />
                            {test}
                          </label>
                        ))}
                      </div>
                    </Card>

                    <Card padding={16}>
                      <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Imaging Orders</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {IMAGING_TYPES.map(test => (
                          <label key={test} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: imagingChecked[test] ? `${T.copper}14` : T.surface2, border: `1px solid ${imagingChecked[test] ? T.copper + "40" : T.border}`, cursor: "pointer", fontSize: 11, fontWeight: 600, color: imagingChecked[test] ? T.copper : T.txM }}>
                            <input type="checkbox" checked={!!imagingChecked[test]} onChange={() => setImagingChecked(p => ({ ...p, [test]: !p[test] }))} style={{ accentColor: T.copper }} />
                            {test}
                          </label>
                        ))}
                      </div>
                    </Card>

                    <Card padding={16}>
                      <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Ultrasound Orders</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {ULTRASOUND_TYPES.map(test => (
                          <label key={test} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: ultrasoundChecked[test] ? `${T.copper}14` : T.surface2, border: `1px solid ${ultrasoundChecked[test] ? T.copper + "40" : T.border}`, cursor: "pointer", fontSize: 11, fontWeight: 600, color: ultrasoundChecked[test] ? T.copper : T.txM }}>
                            <input type="checkbox" checked={!!ultrasoundChecked[test]} onChange={() => setUltrasoundChecked(p => ({ ...p, [test]: !p[test] }))} style={{ accentColor: T.copper }} />
                            {test}
                          </label>
                        ))}
                      </div>
                    </Card>

                    <Card padding={16}>
                      <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Injection Orders</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {INJECTION_LIST.map(inj => (
                          <label key={inj} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: injectionChecked[inj] ? `${T.amber}14` : T.surface2, border: `1px solid ${injectionChecked[inj] ? T.amber + "40" : T.border}`, cursor: "pointer", fontSize: 11, fontWeight: 600, color: injectionChecked[inj] ? T.amber : T.txM }}>
                            <input type="checkbox" checked={!!injectionChecked[inj]} onChange={() => setInjectionChecked(p => ({ ...p, [inj]: !p[inj] }))} style={{ accentColor: T.amber }} />
                            {inj}
                          </label>
                        ))}
                      </div>
                    </Card>

                    <Card padding={16}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>Prescriptions</div>
                        <Button variant="ghost" size="sm" icon="plus" onClick={() => setPrescriptions(p => [...p, { drug: "", dosage: "", duration: "", serviceItemId: "" }])}>Add</Button>
                      </div>
                      {prescriptions.map((rx, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 32px", gap: 8, marginBottom: 8, alignItems: "end" }}>
                          {i === 0 ? (
                            <>
                              <Field label="Drug">
                                <Select value={rx.serviceItemId} onChange={e => handleDrugSelect(i, e.target.value)}>
                                  <option value="">— Select Drug —</option>
                                  {drugCatalogue.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                  ))}
                                </Select>
                              </Field>
                              <Field label="Dosage"><Input value={rx.dosage} onChange={e => { const n = [...prescriptions]; n[i].dosage = e.target.value; setPrescriptions(n) }} placeholder="e.g. 500mg" /></Field>
                              <Field label="Duration"><Input value={rx.duration} onChange={e => { const n = [...prescriptions]; n[i].duration = e.target.value; setPrescriptions(n) }} placeholder="e.g. 5 days" /></Field>
                            </>
                          ) : (
                            <>
                              <div>
                                <Select value={rx.serviceItemId} onChange={e => handleDrugSelect(i, e.target.value)}>
                                  <option value="">— Select Drug —</option>
                                  {drugCatalogue.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                  ))}
                                </Select>
                              </div>
                              <div><Input value={rx.dosage} onChange={e => { const n = [...prescriptions]; n[i].dosage = e.target.value; setPrescriptions(n) }} placeholder="e.g. 500mg" /></div>
                              <div><Input value={rx.duration} onChange={e => { const n = [...prescriptions]; n[i].duration = e.target.value; setPrescriptions(n) }} placeholder="e.g. 5 days" /></div>
                            </>
                          )}
                          {prescriptions.length > 1 && (
                            <button onClick={() => setPrescriptions(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", padding: 4, marginBottom: 2 }}>
                              <Icon name="trash" size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </Card>

                    <Card padding={16}>
                      <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Referral</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <Field label="Specialty">
                          <Select value={referral.specialty} onChange={e => setReferral(p => ({ ...p, specialty: e.target.value }))}>
                            {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        </Field>
                        <Field label="Urgency">
                          <Select value={referral.urgency} onChange={e => setReferral(p => ({ ...p, urgency: e.target.value }))}>
                            <option value="routine">Routine</option>
                            <option value="urgent">Urgent</option>
                            <option value="stat">Stat</option>
                          </Select>
                        </Field>
                      </div>
                      <Field label="Reason"><TextArea placeholder="Reason for referral…" value={referral.reason} onChange={e => setReferral(p => ({ ...p, reason: e.target.value }))} /></Field>
                    </Card>

                    <div style={{ display: "flex", gap: 12 }}>
                      {hasLab && <div style={{ flex: 1 }}><Button variant="outline" icon="analytics" full onClick={handleSendToLab} disabled={saving}>{saving ? "Saving..." : "Send To Lab — Pause"}</Button></div>}
                      <div style={{ flex: 1 }}><Button icon="check" full onClick={handleEndConsultation} disabled={saving}>{saving ? "Saving..." : "End Consultation"}</Button></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Page>
    </HealthShell>
  )
}
