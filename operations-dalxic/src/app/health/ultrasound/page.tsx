"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { HealthShell } from "@/components/ops/HealthShell"
import { useAuth } from "@/lib/use-auth"
import { Page, Stat, Pill, Drawer, Tabs, DataTable, Card, T, Button, TextArea, Field, Empty, Section, SearchBar } from "@/components/ops/primitives"

type View = "pending" | "in_progress" | "completed"

interface USOrder {
  id: string; clinicalRecordId: string; contactId: string
  patientName: string; doctorName: string; scanType: string
  clinicalIndication: string; status: "pending" | "in_progress" | "completed"
  findings?: string; impression?: string; measurements?: string
  orderedAt: string; completedAt?: string
}

const TEMPLATES: Record<string, { findings: string; impression: string; measurements: string }> = {
  "Obstetric Ultrasound": { findings: "Single live intrauterine pregnancy. Fetal cardiac activity present. Placenta anterior/posterior, grade 0-I. Amniotic fluid adequate. No obvious fetal anomaly.", impression: "Normal obstetric scan. Dates consistent with LMP.", measurements: "BPD: __ mm, HC: __ mm, AC: __ mm, FL: __ mm, EFW: __ g" },
  "Pelvic Ultrasound": { findings: "Uterus normal size and echo pattern. Endometrium __ mm. Both ovaries visualized, normal. No adnexal mass. No free fluid in POD.", impression: "Normal pelvic ultrasound.", measurements: "Uterus: __ × __ × __ cm" },
  "Abdominal Ultrasound": { findings: "Liver normal size and echo texture. No focal lesion. CBD not dilated. Gallbladder normal, no calculi. Pancreas normal. Spleen normal. Both kidneys normal, no hydronephrosis.", impression: "Normal abdominal ultrasound.", measurements: "Liver span: __ cm, Spleen: __ cm" },
  "Thyroid Ultrasound": { findings: "Both lobes of thyroid gland normal in size and echo pattern. No focal nodule. Isthmus normal. No cervical lymphadenopathy.", impression: "Normal thyroid ultrasound.", measurements: "Right lobe: __ × __ × __ cm, Left lobe: __ × __ × __ cm" },
  "Renal Ultrasound": { findings: "Both kidneys normal in size and cortical thickness. No hydronephrosis. No calculi. Bladder normal when distended.", impression: "Normal renal ultrasound.", measurements: "Right kidney: __ × __ cm, Left kidney: __ × __ cm" },
}

export default function UltrasoundPage() {
  const { session, authFetch } = useAuth()
  const [view, setView] = useState<View>("pending")
  const [query, setQuery] = useState("")
  const [orders, setOrders] = useState<USOrder[]>([])
  const [active, setActive] = useState<USOrder | null>(null)
  const [findings, setFindings] = useState("")
  const [impression, setImpression] = useState("")
  const [measurements, setMeasurements] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const [consultRes, reportRes] = await Promise.all([
        authFetch("/api/health/clinical?type=consultation"),
        authFetch("/api/health/clinical?type=ultrasound_report"),
      ])
      const [consultJson, reportJson] = await Promise.all([consultRes.json(), reportRes.json()])

      const completedMap = new Map<string, { findings: string; impression: string; measurements: string; completedAt: string }>()
      const inProgressSet = new Set<string>()
      if (reportJson.success) {
        for (const r of reportJson.data) {
          const d = r.data as Record<string, unknown>
          const key = `${d.clinicalRecordId}-${d.scanType}`
          if (r.status === "completed") completedMap.set(key, { findings: d.findings as string || "", impression: d.impression as string || "", measurements: d.measurements as string || "", completedAt: r.performedAt })
          else if (r.status === "in_progress") inProgressSet.add(key)
        }
      }

      const rows: USOrder[] = []
      if (consultJson.success) {
        for (const rec of consultJson.data) {
          const d = rec.data as Record<string, unknown>
          const scans = d.ultrasoundOrders as string[] | undefined
          if (!scans || !Array.isArray(scans)) continue
          for (const scanType of scans) {
            const key = `${rec.id}-${scanType}`
            const report = completedMap.get(key)
            let status: "pending" | "in_progress" | "completed" = "pending"
            if (report) status = "completed"; else if (inProgressSet.has(key)) status = "in_progress"
            rows.push({
              id: `${rec.id}-us-${scanType}`, clinicalRecordId: rec.id, contactId: rec.contactId,
              patientName: (d.patientName as string) || "Unknown", doctorName: (d.doctorName as string) || rec.performedByName,
              scanType, clinicalIndication: (d.diagnosis as string) || "",
              status, findings: report?.findings, impression: report?.impression, measurements: report?.measurements,
              orderedAt: rec.performedAt, completedAt: report?.completedAt,
            })
          }
        }
      }
      setOrders(rows); setError(null)
    } catch { setError("Network Error") } finally { setLoading(false) }
  }, [session, authFetch])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  const pendingCount = orders.filter(o => o.status === "pending").length
  const completedCount = orders.filter(o => o.status === "completed").length

  const filtered = useMemo(() => {
    let items = orders.filter(o => o.status === view)
    if (query) { const q = query.toLowerCase(); items = items.filter(o => o.patientName.toLowerCase().includes(q) || o.scanType.toLowerCase().includes(q)) }
    return items
  }, [view, query, orders])

  async function startScan(order: USOrder) {
    if (!session) return; setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId: order.contactId, type: "ultrasound_report", data: { scanType: order.scanType, clinicalRecordId: order.clinicalRecordId }, status: "in_progress" }) })
      await fetchData(); setActive(null)
    } catch { setError("Failed") } finally { setSubmitting(false) }
  }

  async function submitReport(order: USOrder) {
    if (!session || !findings.trim()) return; setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        contactId: order.contactId, type: "ultrasound_report",
        data: { scanType: order.scanType, clinicalRecordId: order.clinicalRecordId, findings, impression, measurements, patientName: order.patientName, doctorName: order.doctorName },
        status: "completed",
      }) })
      setFindings(""); setImpression(""); setMeasurements(""); setActive(null); await fetchData()
    } catch { setError("Failed To Submit") } finally { setSubmitting(false) }
  }

  function loadTemplate(scanType: string) { const t = TEMPLATES[scanType]; if (t) { setFindings(t.findings); setImpression(t.impression); setMeasurements(t.measurements) } }

  return (
    <HealthShell>
      <Page accent="copper" title="Ultrasound" subtitle="Sonography Queue, Structured Reports, Measurements And Growth Tracking.">
        {error && <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#f87171", fontSize: 13, fontWeight: 600 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Pending Scans" value={pendingCount} accent="copper" icon="orders" />
          <Stat label="Completed Today" value={completedCount} accent="emerald" icon="check" />
          <Stat label="Reports Written" value={completedCount} accent="copper" icon="reports" />
        </div>

        <Section title="Ultrasound Worklist" action={<div style={{ width: 260 }}><SearchBar value={query} onChange={setQuery} placeholder="Search…" /></div>}>
          <Tabs<View> value={view} onChange={setView} accent="copper" tabs={[
            { key: "pending", label: "Pending", count: pendingCount },
            { key: "in_progress", label: "In Progress", count: orders.filter(o => o.status === "in_progress").length },
            { key: "completed", label: "Completed", count: completedCount },
          ]} />
          <div style={{ marginTop: 18 }}>
            {loading ? <div style={{ textAlign: "center", padding: 48, color: T.txD, fontSize: 13, fontWeight: 600 }}>Loading…</div> : filtered.length === 0 ? (
              <Empty icon="search" title="No Orders" sub="Ultrasound orders from doctors will appear here." />
            ) : (
              <DataTable
                columns={[
                  { key: "patientName", label: "Patient", render: (o: USOrder) => <span style={{ fontWeight: 700 }}>{o.patientName}</span> },
                  { key: "scanType", label: "Scan Type", render: (o: USOrder) => o.scanType },
                  { key: "indication", label: "Indication", render: (o: USOrder) => o.clinicalIndication || "—" },
                  { key: "status", label: "Status", width: 110, render: (o: USOrder) => <Pill tone={o.status === "pending" ? "neutral" : o.status === "in_progress" ? "amber" : "emerald"}>{o.status.replace(/_/g, " ")}</Pill> },
                  { key: "doctor", label: "Doctor", render: (o: USOrder) => o.doctorName },
                ]}
                rows={filtered}
                onRowClick={(o) => { const ord = o as USOrder; setActive(ord); setFindings(ord.findings || ""); setImpression(ord.impression || ""); setMeasurements(ord.measurements || "") }}
              />
            )}
          </div>
        </Section>
      </Page>

      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.scanType ?? "Ultrasound"} subtitle={active?.patientName} width={520}>
        {active && (
          <>
            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Scan:</b> {active.scanType}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Patient:</b> {active.patientName}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Indication:</b> {active.clinicalIndication || "—"}</div>
              <div style={{ fontSize: 13, color: T.tx }}><b>Doctor:</b> {active.doctorName}</div>
            </Card>
            {active.status === "completed" ? (
              <Card padding={18}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.txD, marginBottom: 4 }}>Findings:</div>
                <div style={{ fontSize: 13, color: T.tx, whiteSpace: "pre-wrap", marginBottom: 12 }}>{active.findings || "—"}</div>
                {active.measurements && <><div style={{ fontSize: 12, fontWeight: 700, color: T.txD, marginBottom: 4 }}>Measurements:</div><div style={{ fontSize: 13, color: T.tx, whiteSpace: "pre-wrap", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>{active.measurements}</div></>}
                <div style={{ fontSize: 12, fontWeight: 700, color: T.txD, marginBottom: 4 }}>Impression:</div>
                <div style={{ fontSize: 13, color: T.tx, whiteSpace: "pre-wrap" }}>{active.impression || "—"}</div>
              </Card>
            ) : active.status === "pending" ? (
              <Card padding={18}><Button full onClick={() => startScan(active)} disabled={submitting}>{submitting ? "Starting…" : "Start Scan"}</Button></Card>
            ) : (
              <Card padding={18}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>Write Report</div>
                  {TEMPLATES[active.scanType] && <Button size="sm" variant="outline" onClick={() => loadTemplate(active.scanType)}>Load Template</Button>}
                </div>
                <Field label="Findings"><TextArea placeholder="Sonographic findings…" value={findings} onChange={e => setFindings(e.target.value)} /></Field>
                <Field label="Measurements"><TextArea placeholder="BPD, HC, AC, FL…" value={measurements} onChange={e => setMeasurements(e.target.value)} /></Field>
                <Field label="Impression"><TextArea placeholder="Impression…" value={impression} onChange={e => setImpression(e.target.value)} /></Field>
                <Button full onClick={() => submitReport(active)} disabled={submitting || !findings.trim()}>{submitting ? "Submitting…" : "Submit Report"}</Button>
              </Card>
            )}
          </>
        )}
      </Drawer>
    </HealthShell>
  )
}
