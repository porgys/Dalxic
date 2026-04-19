"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { HealthShell } from "@/components/ops/HealthShell"
import { useAuth } from "@/lib/use-auth"
import { Page, Stat, Pill, Drawer, Tabs, DataTable, Card, T, Button, TextArea, Field, Select, Empty, Section, SearchBar } from "@/components/ops/primitives"

type View = "pending" | "in_progress" | "completed"

interface ImagingOrder {
  id: string; clinicalRecordId: string; contactId: string
  patientName: string; doctorName: string; scanType: string
  clinicalIndication: string; urgent: boolean
  status: "pending" | "in_progress" | "completed"
  findings?: string; impression?: string; criticalFlag: boolean
  orderedAt: string; completedAt?: string
}

const REPORT_TEMPLATES: Record<string, { findings: string; impression: string }> = {
  "Chest X-Ray": { findings: "Heart size normal. Lung fields clear bilaterally. No pleural effusion. Costophrenic angles sharp. Mediastinum midline.", impression: "Normal chest radiograph." },
  "CT Head": { findings: "No acute intracranial hemorrhage. No midline shift. Ventricles normal in size. Grey-white matter differentiation preserved.", impression: "Normal non-contrast CT head." },
  "Abdominal X-Ray": { findings: "Normal bowel gas pattern. No dilated loops. No free air under diaphragm. No radio-opaque calculi.", impression: "Unremarkable abdominal radiograph." },
  "CT Abdomen": { findings: "Liver, spleen, pancreas, and kidneys normal in size and attenuation. No lymphadenopathy. No free fluid.", impression: "Normal CT abdomen." },
}

export default function RadiologyPage() {
  const { session, authFetch } = useAuth()
  const [view, setView] = useState<View>("pending")
  const [query, setQuery] = useState("")
  const [orders, setOrders] = useState<ImagingOrder[]>([])
  const [active, setActive] = useState<ImagingOrder | null>(null)
  const [findings, setFindings] = useState("")
  const [impression, setImpression] = useState("")
  const [criticalFlag, setCriticalFlag] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const [consultRes, reportRes] = await Promise.all([
        authFetch("/api/health/clinical?type=consultation"),
        authFetch("/api/health/clinical?type=radiology_report"),
      ])
      const [consultJson, reportJson] = await Promise.all([consultRes.json(), reportRes.json()])

      const completedMap = new Map<string, { findings: string; impression: string; criticalFlag: boolean; completedAt: string }>()
      const inProgressSet = new Set<string>()
      if (reportJson.success) {
        for (const r of reportJson.data) {
          const d = r.data as Record<string, unknown>
          const key = `${d.clinicalRecordId}-${d.scanType}`
          if (r.status === "completed") completedMap.set(key, { findings: d.findings as string || "", impression: d.impression as string || "", criticalFlag: d.criticalFlag === true, completedAt: r.performedAt })
          else if (r.status === "in_progress") inProgressSet.add(key)
        }
      }

      const rows: ImagingOrder[] = []
      if (consultJson.success) {
        for (const rec of consultJson.data) {
          const d = rec.data as Record<string, unknown>
          const imaging = d.imagingOrders as string[] | undefined
          if (!imaging || !Array.isArray(imaging)) continue
          for (const scanType of imaging) {
            const key = `${rec.id}-${scanType}`
            const report = completedMap.get(key)
            let status: "pending" | "in_progress" | "completed" = "pending"
            if (report) status = "completed"
            else if (inProgressSet.has(key)) status = "in_progress"
            rows.push({
              id: `${rec.id}-img-${scanType}`, clinicalRecordId: rec.id, contactId: rec.contactId,
              patientName: (d.patientName as string) || "Unknown", doctorName: (d.doctorName as string) || rec.performedByName,
              scanType, clinicalIndication: (d.diagnosis as string) || (d.chiefComplaint as string) || "",
              urgent: d.urgent === true, status,
              findings: report?.findings, impression: report?.impression,
              criticalFlag: report?.criticalFlag ?? false,
              orderedAt: rec.performedAt, completedAt: report?.completedAt,
            })
          }
        }
      }
      setOrders(rows)
      setError(null)
    } catch { setError("Network Error — Could Not Load Imaging Data") } finally { setLoading(false) }
  }, [session, authFetch])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  const pendingCount = orders.filter(o => o.status === "pending").length
  const inProgressCount = orders.filter(o => o.status === "in_progress").length
  const completedCount = orders.filter(o => o.status === "completed").length
  const criticalCount = orders.filter(o => o.criticalFlag).length

  const filtered = useMemo(() => {
    let items = orders.filter(o => o.status === view)
    if (query) { const q = query.toLowerCase(); items = items.filter(o => o.patientName.toLowerCase().includes(q) || o.scanType.toLowerCase().includes(q)) }
    return items
  }, [view, query, orders])

  async function startScan(order: ImagingOrder) {
    if (!session) return
    setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId: order.contactId, type: "radiology_report", data: { scanType: order.scanType, clinicalRecordId: order.clinicalRecordId }, status: "in_progress" }) })
      await fetchData(); setActive(null)
    } catch { setError("Failed To Start") } finally { setSubmitting(false) }
  }

  async function submitReport(order: ImagingOrder) {
    if (!session || !findings.trim()) return
    setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        contactId: order.contactId, type: "radiology_report",
        data: { scanType: order.scanType, clinicalRecordId: order.clinicalRecordId, findings, impression, criticalFlag, patientName: order.patientName, doctorName: order.doctorName },
        status: "completed",
      }) })
      setFindings(""); setImpression(""); setCriticalFlag(false); setActive(null)
      await fetchData()
    } catch { setError("Failed To Submit Report") } finally { setSubmitting(false) }
  }

  function loadTemplate(scanType: string) {
    const t = REPORT_TEMPLATES[scanType]
    if (t) { setFindings(t.findings); setImpression(t.impression) }
  }

  return (
    <HealthShell>
      <Page accent="copper" title="CT / Radiology" subtitle="Imaging Queue, Structured Reports And Critical Finding Alerts.">
        {error && <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#f87171", fontSize: 13, fontWeight: 600 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Pending Scans" value={pendingCount} accent="copper" icon="orders" />
          <Stat label="In Progress" value={inProgressCount} accent="amber" icon="sparkle" />
          <Stat label="Completed" value={completedCount} accent="emerald" icon="check" />
          <Stat label="Critical Findings" value={criticalCount} accent="neutral" icon="bolt" />
        </div>

        <Section title="Imaging Worklist" action={<div style={{ width: 260 }}><SearchBar value={query} onChange={setQuery} placeholder="Search Patient Or Scan…" /></div>}>
          <Tabs<View> value={view} onChange={setView} accent="copper" tabs={[
            { key: "pending", label: "Pending", count: pendingCount },
            { key: "in_progress", label: "In Progress", count: inProgressCount },
            { key: "completed", label: "Completed", count: completedCount },
          ]} />
          <div style={{ marginTop: 18 }}>
            {loading ? <div style={{ textAlign: "center", padding: 48, color: T.txD, fontSize: 13, fontWeight: 600 }}>Loading…</div> : filtered.length === 0 ? (
              <Empty icon="search" title="No Orders" sub="Imaging orders from doctors will appear here." />
            ) : (
              <DataTable
                columns={[
                  { key: "patientName", label: "Patient", render: (o: ImagingOrder) => <span style={{ fontWeight: 700 }}>{o.patientName}</span> },
                  { key: "scanType", label: "Scan Type", render: (o: ImagingOrder) => o.scanType },
                  { key: "indication", label: "Indication", render: (o: ImagingOrder) => o.clinicalIndication || "—" },
                  { key: "urgent", label: "Urgent", width: 80, render: (o: ImagingOrder) => o.urgent ? <Pill tone="red">URGENT</Pill> : <span style={{ color: T.txD }}>—</span> },
                  { key: "status", label: "Status", width: 110, render: (o: ImagingOrder) => <Pill tone={o.status === "pending" ? "neutral" : o.status === "in_progress" ? "amber" : o.criticalFlag ? "red" : "emerald"}>{o.status === "completed" ? (o.criticalFlag ? "Critical" : "Reported") : o.status.replace(/_/g, " ")}</Pill> },
                  { key: "doctor", label: "Doctor", render: (o: ImagingOrder) => o.doctorName },
                ]}
                rows={filtered}
                onRowClick={(o) => { const ord = o as ImagingOrder; setActive(ord); setFindings(ord.findings || ""); setImpression(ord.impression || ""); setCriticalFlag(ord.criticalFlag) }}
              />
            )}
          </div>
        </Section>
      </Page>

      <Drawer open={!!active} onClose={() => { setActive(null); setFindings(""); setImpression(""); setCriticalFlag(false) }} title={active?.scanType ?? "Imaging"} subtitle={active?.patientName} width={520}>
        {active && (
          <>
            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Order Details</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Scan:</b> {active.scanType}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Patient:</b> {active.patientName}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Clinical Indication:</b> {active.clinicalIndication || "—"}</div>
              <div style={{ fontSize: 13, color: T.tx }}><b>Requesting Doctor:</b> {active.doctorName}</div>
            </Card>

            {active.status === "completed" ? (
              <Card padding={18}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Report</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.txD, marginBottom: 4 }}>Findings:</div>
                <div style={{ fontSize: 13, color: T.tx, whiteSpace: "pre-wrap", marginBottom: 12 }}>{active.findings || "—"}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.txD, marginBottom: 4 }}>Impression:</div>
                <div style={{ fontSize: 13, color: T.tx, whiteSpace: "pre-wrap", marginBottom: 12 }}>{active.impression || "—"}</div>
                {active.criticalFlag && <Pill tone="red">Critical Finding</Pill>}
              </Card>
            ) : active.status === "pending" ? (
              <Card padding={18}><Button full onClick={() => startScan(active)} disabled={submitting}>{submitting ? "Starting…" : "Start Scan"}</Button></Card>
            ) : (
              <Card padding={18}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>Write Report</div>
                  {REPORT_TEMPLATES[active.scanType] && <Button size="sm" variant="outline" onClick={() => loadTemplate(active.scanType)}>Load Template</Button>}
                </div>
                <Field label="Findings"><TextArea placeholder="Describe imaging findings…" value={findings} onChange={e => setFindings(e.target.value)} /></Field>
                <Field label="Impression"><TextArea placeholder="Radiological impression…" value={impression} onChange={e => setImpression(e.target.value)} /></Field>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.red, fontWeight: 700, marginBottom: 14, cursor: "pointer" }}>
                  <input type="checkbox" checked={criticalFlag} onChange={e => setCriticalFlag(e.target.checked)} style={{ accentColor: T.red }} /> Critical Finding — Notify Doctor Immediately
                </label>
                <Button full onClick={() => submitReport(active)} disabled={submitting || !findings.trim()}>{submitting ? "Submitting…" : "Submit Report"}</Button>
              </Card>
            )}
          </>
        )}
      </Drawer>
    </HealthShell>
  )
}
