"use client"
import { useState, useMemo, useEffect, useCallback } from "react"
import { HealthShell } from "@/components/ops/HealthShell"
import { useAuth } from "@/lib/use-auth"
import { Page, Stat, Pill, Drawer, Tabs, DataTable, Card, T, Button, TextArea, Field, Input, Empty, Section, SearchBar } from "@/components/ops/primitives"

type View = "pending" | "in_progress" | "completed"

interface LabOrder {
  id: string
  clinicalRecordId: string
  contactId: string
  patientName: string
  doctorName: string
  testName: string
  category: string
  urgent: boolean
  status: "pending" | "in_progress" | "completed"
  result?: string
  abnormalFlag: boolean
  orderedAt: string
  completedAt?: string
  queueEntryId?: string
}

interface ClinicalRecord {
  id: string; contactId: string; type: string; status: string
  data: { labOrders?: string[]; patientName?: string; doctorName?: string; diagnosis?: string; clinicalQuestion?: string; [k: string]: unknown }
  performedBy: string; performedByName: string; performedAt: string
}

interface LabResultRecord {
  id: string; contactId: string; type: string; status: string
  data: { testName?: string; result?: string; abnormalFlag?: boolean; clinicalRecordId?: string; normalRange?: string; [k: string]: unknown }
  performedAt: string
}

interface QueueEntry {
  id: string; contactId: string; token: string; visitStatus: string
  contact?: { id: string; name: string } | null
}

const NORMAL_RANGES: Record<string, string> = {
  "Full Blood Count": "WBC 4.0-11.0, RBC 4.5-5.5, Hb 12-17, Plt 150-400",
  "Malaria RDT": "Negative",
  "Urinalysis": "pH 4.5-8.0, SG 1.005-1.030, Protein Neg, Glucose Neg",
  "Blood Sugar": "Fasting 3.9-5.6 mmol/L, Random <7.8 mmol/L",
  "Liver Function": "ALT 7-56, AST 10-40, ALP 44-147, Bilirubin 0.1-1.2",
  "Renal Function": "Creatinine 0.7-1.3, BUN 7-20, eGFR >60",
  "Lipid Profile": "Total Chol <5.2, LDL <3.4, HDL >1.0, Trig <1.7",
  "HIV Screening": "Non-Reactive",
}

const TEST_CATEGORIES: Record<string, string> = {
  "Full Blood Count": "Haematology",
  "Malaria RDT": "Parasitology",
  "Urinalysis": "Chemistry",
  "Blood Sugar": "Chemistry",
  "Liver Function": "Chemistry",
  "Renal Function": "Chemistry",
  "Lipid Profile": "Chemistry",
  "HIV Screening": "Serology",
}

export default function LabPage() {
  const { session, authFetch } = useAuth()
  const [view, setView] = useState<View>("pending")
  const [query, setQuery] = useState("")
  const [orders, setOrders] = useState<LabOrder[]>([])
  const [active, setActive] = useState<LabOrder | null>(null)
  const [resultText, setResultText] = useState("")
  const [abnormalFlag, setAbnormalFlag] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const [consultRes, labResultsRes, queueRes] = await Promise.all([
        authFetch("/api/health/clinical?type=consultation"),
        authFetch("/api/health/clinical?type=lab_result"),
        authFetch("/api/health/queue"),
      ])
      const [consultJson, labResultsJson, queueJson] = await Promise.all([
        consultRes.json(), labResultsRes.json(), queueRes.json(),
      ])

      const consultations: ClinicalRecord[] = consultJson.success ? consultJson.data : []
      const labResults: LabResultRecord[] = labResultsJson.success ? labResultsJson.data : []
      const queueEntries: QueueEntry[] = queueJson.success ? queueJson.data : []

      const completedSet = new Map<string, LabResultRecord>()
      for (const lr of labResults) {
        const key = `${lr.data.clinicalRecordId}-${lr.data.testName}`
        completedSet.set(key, lr)
      }

      const inProgressSet = new Set<string>()
      for (const lr of labResults) {
        if (lr.status === "in_progress") inProgressSet.add(`${lr.data.clinicalRecordId}-${lr.data.testName}`)
      }

      const rows: LabOrder[] = []
      for (const rec of consultations) {
        if (!rec.data?.labOrders || !Array.isArray(rec.data.labOrders)) continue
        const qEntry = queueEntries.find(q => q.contactId === rec.contactId && (q.visitStatus === "paused_for_lab" || q.visitStatus === "lab_results_ready"))

        for (const testName of rec.data.labOrders) {
          const key = `${rec.id}-${testName}`
          const result = completedSet.get(key)
          const isInProgress = inProgressSet.has(key)

          let status: "pending" | "in_progress" | "completed" = "pending"
          if (result && result.status === "completed") status = "completed"
          else if (isInProgress) status = "in_progress"

          rows.push({
            id: `${rec.id}-lab-${testName}`,
            clinicalRecordId: rec.id,
            contactId: rec.contactId,
            patientName: (rec.data.patientName as string) || "Unknown Patient",
            doctorName: (rec.data.doctorName as string) || rec.performedByName,
            testName,
            category: TEST_CATEGORIES[testName] || "General",
            urgent: (rec.data as Record<string, unknown>).urgent === true,
            status,
            result: result?.data?.result as string | undefined,
            abnormalFlag: result?.data?.abnormalFlag === true,
            orderedAt: rec.performedAt,
            completedAt: result?.performedAt,
            queueEntryId: qEntry?.id,
          })
        }
      }

      setOrders(rows)
      setError(null)
    } catch {
      setError("Network Error — Could Not Load Lab Data")
    } finally {
      setLoading(false)
    }
  }, [session, authFetch])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  const pending = orders.filter(o => o.status === "pending").length
  const inProgress = orders.filter(o => o.status === "in_progress").length
  const completed = orders.filter(o => o.status === "completed").length
  const abnormalCount = orders.filter(o => o.abnormalFlag).length

  const filtered = useMemo(() => {
    let items = orders.filter(o => o.status === view)
    if (query) {
      const q = query.toLowerCase()
      items = items.filter(o => o.patientName.toLowerCase().includes(q) || o.testName.toLowerCase().includes(q))
    }
    return items
  }, [view, query, orders])

  async function startProcessing(order: LabOrder) {
    if (!session) return
    setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: order.contactId, type: "lab_result",
          data: { testName: order.testName, clinicalRecordId: order.clinicalRecordId },
          status: "in_progress",
        }),
      })
      await fetchData()
      setActive(null)
    } catch { setError("Failed To Start Processing") } finally { setSubmitting(false) }
  }

  async function submitResult(order: LabOrder) {
    if (!session || !resultText.trim()) return
    setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: order.contactId, type: "lab_result",
          data: {
            testName: order.testName, clinicalRecordId: order.clinicalRecordId,
            result: resultText, abnormalFlag,
            normalRange: NORMAL_RANGES[order.testName] || "",
            patientName: order.patientName, doctorName: order.doctorName,
          },
          status: "completed",
        }),
      })

      if (order.queueEntryId) {
        const siblingOrders = orders.filter(o => o.clinicalRecordId === order.clinicalRecordId && o.id !== order.id)
        const allOthersComplete = siblingOrders.every(o => o.status === "completed")
        if (allOthersComplete) {
          await authFetch("/api/health/queue", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: order.queueEntryId, visitStatus: "lab_results_ready" }),
          })
        }
      }

      setResultText("")
      setAbnormalFlag(false)
      setActive(null)
      await fetchData()
    } catch { setError("Failed To Submit Result") } finally { setSubmitting(false) }
  }

  const tatMinutes = (order: LabOrder) => {
    if (!order.completedAt) return Math.round((Date.now() - new Date(order.orderedAt).getTime()) / 60000)
    return Math.round((new Date(order.completedAt).getTime() - new Date(order.orderedAt).getTime()) / 60000)
  }

  return (
    <HealthShell>
      <Page accent="copper" title="Laboratory" subtitle="Test Orders, Sample Processing, Result Entry And Abnormal Flagging.">
        {error && (
          <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#f87171", fontSize: 13, fontWeight: 600 }}>{error}</div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Pending Orders" value={pending} accent="copper" icon="orders" />
          <Stat label="In Progress" value={inProgress} accent="amber" icon="sparkle" />
          <Stat label="Completed Today" value={completed} accent="emerald" icon="check" />
          <Stat label="Abnormal Results" value={abnormalCount} accent="neutral" icon="bolt" />
        </div>

        <Section title="Lab Orders" action={<div style={{ width: 260 }}><SearchBar value={query} onChange={setQuery} placeholder="Search Patient Or Test…" /></div>}>
          <Tabs<View> value={view} onChange={setView} accent="copper" tabs={[
            { key: "pending", label: "Pending", count: pending },
            { key: "in_progress", label: "In Progress", count: inProgress },
            { key: "completed", label: "Completed", count: completed },
          ]} />

          <div style={{ marginTop: 18 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: 48, color: T.txD, fontSize: 13, fontWeight: 600 }}>Loading Lab Orders…</div>
            ) : filtered.length === 0 ? (
              <Empty icon="search" title={`No ${view.replace(/_/g, " ")} Orders`} sub="Lab orders from doctor consultations will appear here." />
            ) : (
              <DataTable
                columns={[
                  { key: "patientName", label: "Patient", render: (o: LabOrder) => <span style={{ fontWeight: 700 }}>{o.patientName}</span> },
                  { key: "testName", label: "Test", render: (o: LabOrder) => o.testName },
                  { key: "category", label: "Category", width: 110, render: (o: LabOrder) => <Pill tone="sky">{o.category}</Pill> },
                  { key: "urgent", label: "Urgent", width: 80, render: (o: LabOrder) => o.urgent ? <Pill tone="red">URGENT</Pill> : <span style={{ color: T.txD }}>—</span> },
                  { key: "tat", label: "TAT", width: 70, render: (o: LabOrder) => {
                    const m = tatMinutes(o)
                    return <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: m > 120 ? T.red : m > 60 ? T.amber : T.txM }}>{m}m</span>
                  }},
                  { key: "status", label: "Status", width: 110, render: (o: LabOrder) => (
                    <Pill tone={o.status === "pending" ? "neutral" : o.status === "in_progress" ? "amber" : o.abnormalFlag ? "red" : "emerald"}>
                      {o.status === "in_progress" ? "Processing" : o.status === "completed" ? (o.abnormalFlag ? "Abnormal" : "Normal") : "Pending"}
                    </Pill>
                  )},
                  { key: "doctorName", label: "Doctor", render: (o: LabOrder) => o.doctorName },
                ]}
                rows={filtered}
                onRowClick={(o) => { setActive(o as LabOrder); setResultText((o as LabOrder).result || ""); setAbnormalFlag((o as LabOrder).abnormalFlag) }}
              />
            )}
          </div>
        </Section>
      </Page>

      <Drawer open={!!active} onClose={() => { setActive(null); setResultText(""); setAbnormalFlag(false) }} title={active?.testName ?? "Lab Order"} subtitle={active?.patientName} width={500}>
        {active && (
          <>
            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Order Details</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Test:</b> {active.testName}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Category:</b> {active.category}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Patient:</b> {active.patientName}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Requesting Doctor:</b> {active.doctorName}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Ordered:</b> {new Date(active.orderedAt).toLocaleString()}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>TAT:</b> {tatMinutes(active)} minutes</div>
              {active.urgent && <Pill tone="red">URGENT</Pill>}
            </Card>

            {NORMAL_RANGES[active.testName] && (
              <Card padding={18} style={{ marginBottom: 14, background: `${T.sky}08`, border: `1px solid ${T.sky}20` }}>
                <div style={{ fontSize: 10, color: T.sky, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Normal Range</div>
                <div style={{ fontSize: 12, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{NORMAL_RANGES[active.testName]}</div>
              </Card>
            )}

            {active.status === "completed" ? (
              <Card padding={18}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Result</div>
                <div style={{ fontSize: 13, color: T.tx, whiteSpace: "pre-wrap", marginBottom: 10 }}>{active.result || "—"}</div>
                <Pill tone={active.abnormalFlag ? "red" : "emerald"}>{active.abnormalFlag ? "Abnormal" : "Normal"}</Pill>
                {active.completedAt && <div style={{ fontSize: 11, color: T.txD, marginTop: 8 }}>Completed: {new Date(active.completedAt).toLocaleString()}</div>}
              </Card>
            ) : active.status === "pending" ? (
              <Card padding={18}>
                <Button full onClick={() => startProcessing(active)} disabled={submitting}>
                  {submitting ? "Starting…" : "Start Processing"}
                </Button>
              </Card>
            ) : (
              <Card padding={18}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Enter Result</div>
                <Field label="Test Result">
                  <TextArea placeholder="Enter test result values…" value={resultText} onChange={(e) => setResultText(e.target.value)} />
                </Field>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.red, fontWeight: 700, marginBottom: 14, cursor: "pointer" }}>
                  <input type="checkbox" checked={abnormalFlag} onChange={(e) => setAbnormalFlag(e.target.checked)} style={{ accentColor: T.red }} /> Flag As Abnormal / Critical Value
                </label>
                <Button full onClick={() => submitResult(active)} disabled={submitting || !resultText.trim()}>
                  {submitting ? "Submitting…" : "Submit Result"}
                </Button>
              </Card>
            )}
          </>
        )}
      </Drawer>
    </HealthShell>
  )
}
