"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { HealthShell } from "@/components/ops/HealthShell"
import { useAuth } from "@/lib/use-auth"
import { Page, Stat, Pill, Drawer, Tabs, DataTable, Card, T, Button, TextArea, Field, Input, Select, Empty, Section, SearchBar, Modal } from "@/components/ops/primitives"

type View = "pending" | "observing" | "completed"

interface InjectionOrder {
  id: string; clinicalRecordId: string; contactId: string
  patientName: string; doctorName: string
  medication: string; dosage: string; route: string
  status: "pending" | "observing" | "completed"
  administeredAt?: string; completedAt?: string
  batchNo?: string; site?: string; notes?: string
  adverseReaction: boolean; reactionDetails?: string
  observationMinutes: number
}

export default function InjectionRoomPage() {
  const { session, authFetch } = useAuth()
  const [view, setView] = useState<View>("pending")
  const [query, setQuery] = useState("")
  const [orders, setOrders] = useState<InjectionOrder[]>([])
  const [active, setActive] = useState<InjectionOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [adminForm, setAdminForm] = useState({ site: "left_deltoid", batchNo: "", notes: "" })
  const [reactionForm, setReactionForm] = useState({ hasReaction: false, details: "" })

  const fetchData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const [consultRes, injectionRes] = await Promise.all([
        authFetch("/api/health/clinical?type=consultation"),
        authFetch("/api/health/clinical?type=injection"),
      ])
      const [consultJson, injectionJson] = await Promise.all([consultRes.json(), injectionRes.json()])

      const injectionMap = new Map<string, { status: string; data: Record<string, unknown>; performedAt: string }>()
      if (injectionJson.success) {
        for (const r of injectionJson.data) {
          const d = r.data as Record<string, unknown>
          const key = `${d.clinicalRecordId}-${d.medication}`
          injectionMap.set(key, { status: r.status, data: d, performedAt: r.performedAt })
        }
      }

      const rows: InjectionOrder[] = []
      if (consultJson.success) {
        for (const rec of consultJson.data) {
          const d = rec.data as Record<string, unknown>
          const injections = d.injectionOrders as { medication: string; dosage: string; route: string }[] | undefined
          if (!injections || !Array.isArray(injections)) continue
          for (const inj of injections) {
            const key = `${rec.id}-${inj.medication}`
            const existing = injectionMap.get(key)
            let status: "pending" | "observing" | "completed" = "pending"
            if (existing?.status === "completed") status = "completed"
            else if (existing?.status === "observing") status = "observing"

            rows.push({
              id: `${rec.id}-inj-${inj.medication}`, clinicalRecordId: rec.id, contactId: rec.contactId,
              patientName: (d.patientName as string) || "Unknown", doctorName: (d.doctorName as string) || rec.performedByName,
              medication: inj.medication, dosage: inj.dosage, route: inj.route, status,
              administeredAt: existing?.status === "observing" || existing?.status === "completed" ? existing.performedAt : undefined,
              completedAt: existing?.status === "completed" ? existing.performedAt : undefined,
              batchNo: existing?.data?.batchNo as string || undefined,
              site: existing?.data?.site as string || undefined,
              notes: existing?.data?.notes as string || undefined,
              adverseReaction: existing?.data?.adverseReaction === true,
              reactionDetails: existing?.data?.reactionDetails as string || undefined,
              observationMinutes: (existing?.data?.observationMinutes as number) || 15,
            })
          }
        }
      }
      setOrders(rows); setError(null)
    } catch { setError("Network Error") } finally { setLoading(false) }
  }, [session, authFetch])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  const pendingCount = orders.filter(o => o.status === "pending").length
  const observingCount = orders.filter(o => o.status === "observing").length
  const completedCount = orders.filter(o => o.status === "completed").length
  const adverseCount = orders.filter(o => o.adverseReaction).length

  const filtered = useMemo(() => {
    let items = orders.filter(o => o.status === view)
    if (query) { const q = query.toLowerCase(); items = items.filter(o => o.patientName.toLowerCase().includes(q) || o.medication.toLowerCase().includes(q)) }
    return items
  }, [view, query, orders])

  async function administer(order: InjectionOrder) {
    if (!session) return; setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        contactId: order.contactId, type: "injection",
        data: { clinicalRecordId: order.clinicalRecordId, medication: order.medication, dosage: order.dosage, route: order.route, site: adminForm.site, batchNo: adminForm.batchNo || undefined, notes: adminForm.notes || undefined, patientName: order.patientName, observationMinutes: 15 },
        status: "observing",
      }) })
      setActive(null); setAdminForm({ site: "left_deltoid", batchNo: "", notes: "" }); await fetchData()
    } catch { setError("Failed To Record Administration") } finally { setSubmitting(false) }
  }

  async function completeObservation(order: InjectionOrder) {
    if (!session) return; setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        contactId: order.contactId, type: "injection",
        data: { clinicalRecordId: order.clinicalRecordId, medication: order.medication, dosage: order.dosage, route: order.route, adverseReaction: reactionForm.hasReaction, reactionDetails: reactionForm.hasReaction ? reactionForm.details : undefined, patientName: order.patientName },
        status: "completed",
      }) })
      setActive(null); setReactionForm({ hasReaction: false, details: "" }); await fetchData()
    } catch { setError("Failed") } finally { setSubmitting(false) }
  }

  return (
    <HealthShell>
      <Page accent="copper" title="Injection Room" subtitle="Administration, Post-Injection Observation And Adverse Reaction Tracking.">
        {error && <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#f87171", fontSize: 13, fontWeight: 600 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Pending" value={pendingCount} accent="copper" icon="orders" />
          <Stat label="Observing" value={observingCount} accent="amber" icon="sparkle" />
          <Stat label="Completed" value={completedCount} accent="emerald" icon="check" />
          <Stat label="Adverse Reactions" value={adverseCount} accent="neutral" icon="bolt" />
        </div>

        <Section title="Injection Orders" action={<div style={{ width: 260 }}><SearchBar value={query} onChange={setQuery} placeholder="Search…" /></div>}>
          <Tabs<View> value={view} onChange={setView} accent="copper" tabs={[
            { key: "pending", label: "Pending", count: pendingCount },
            { key: "observing", label: "Observing", count: observingCount },
            { key: "completed", label: "Completed", count: completedCount },
          ]} />
          <div style={{ marginTop: 18 }}>
            {loading ? <div style={{ textAlign: "center", padding: 48, color: T.txD, fontSize: 13, fontWeight: 600 }}>Loading…</div> : filtered.length === 0 ? (
              <Empty icon="search" title="No Orders" sub="Injection orders from doctors will appear here." />
            ) : (
              <DataTable
                columns={[
                  { key: "patientName", label: "Patient", render: (o: InjectionOrder) => <span style={{ fontWeight: 700 }}>{o.patientName}</span> },
                  { key: "medication", label: "Medication", render: (o: InjectionOrder) => o.medication },
                  { key: "dosage", label: "Dosage", width: 100, render: (o: InjectionOrder) => o.dosage },
                  { key: "route", label: "Route", width: 80, render: (o: InjectionOrder) => <Pill tone={o.route === "IV" ? "red" : o.route === "IM" ? "copper" : "sky"}>{o.route}</Pill> },
                  { key: "status", label: "Status", width: 110, render: (o: InjectionOrder) => <Pill tone={o.status === "pending" ? "neutral" : o.status === "observing" ? "amber" : o.adverseReaction ? "red" : "emerald"}>{o.status === "observing" ? "Observing" : o.status}</Pill> },
                  { key: "doctor", label: "Doctor", render: (o: InjectionOrder) => o.doctorName },
                ]}
                rows={filtered}
                onRowClick={(o) => { setActive(o as InjectionOrder); setAdminForm({ site: "left_deltoid", batchNo: "", notes: "" }); setReactionForm({ hasReaction: false, details: "" }) }}
              />
            )}
          </div>
        </Section>
      </Page>

      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.medication ?? "Injection"} subtitle={active?.patientName} width={500}>
        {active && (
          <>
            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Order Details</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Medication:</b> {active.medication}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Dosage:</b> {active.dosage}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Route:</b> {active.route}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Patient:</b> {active.patientName}</div>
              <div style={{ fontSize: 13, color: T.tx }}><b>Doctor:</b> {active.doctorName}</div>
            </Card>

            {active.status === "pending" ? (
              <Card padding={18}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Administration Record</div>
                <Field label="Injection Site">
                  <Select value={adminForm.site} onChange={e => setAdminForm(p => ({ ...p, site: e.target.value }))}>
                    <option value="left_deltoid">Left Deltoid</option>
                    <option value="right_deltoid">Right Deltoid</option>
                    <option value="left_gluteal">Left Gluteal</option>
                    <option value="right_gluteal">Right Gluteal</option>
                    <option value="left_thigh">Left Thigh</option>
                    <option value="right_thigh">Right Thigh</option>
                    <option value="iv_line">IV Line</option>
                  </Select>
                </Field>
                <Field label="Batch Number"><Input placeholder="Batch No." value={adminForm.batchNo} onChange={e => setAdminForm(p => ({ ...p, batchNo: e.target.value }))} /></Field>
                <Field label="Notes"><TextArea placeholder="Administration notes…" value={adminForm.notes} onChange={e => setAdminForm(p => ({ ...p, notes: e.target.value }))} /></Field>
                <Button full onClick={() => administer(active)} disabled={submitting}>{submitting ? "Recording…" : "Administer & Start Observation"}</Button>
              </Card>
            ) : active.status === "observing" ? (
              <Card padding={18}>
                <div style={{ fontSize: 10, color: T.amber, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Post-Injection Observation ({active.observationMinutes} Min)</div>
                {active.administeredAt && (
                  <div style={{ fontSize: 12, color: T.txM, marginBottom: 12 }}>Administered: {new Date(active.administeredAt).toLocaleTimeString()} — {Math.round((Date.now() - new Date(active.administeredAt).getTime()) / 60000)} min elapsed</div>
                )}
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.red, fontWeight: 700, marginBottom: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={reactionForm.hasReaction} onChange={e => setReactionForm(p => ({ ...p, hasReaction: e.target.checked }))} style={{ accentColor: T.red }} /> Adverse Reaction (AEFI)
                </label>
                {reactionForm.hasReaction && (
                  <Field label="Reaction Details"><TextArea placeholder="Describe the adverse reaction…" value={reactionForm.details} onChange={e => setReactionForm(p => ({ ...p, details: e.target.value }))} /></Field>
                )}
                <Button full onClick={() => completeObservation(active)} disabled={submitting}>{submitting ? "Completing…" : "Complete Observation & Discharge"}</Button>
              </Card>
            ) : (
              <Card padding={18}>
                <Pill tone={active.adverseReaction ? "red" : "emerald"}>{active.adverseReaction ? "Adverse Reaction Reported" : "Completed — No Reaction"}</Pill>
                {active.site && <div style={{ fontSize: 13, color: T.tx, marginTop: 10 }}><b>Site:</b> {active.site.replace(/_/g, " ")}</div>}
                {active.batchNo && <div style={{ fontSize: 13, color: T.tx, marginTop: 4 }}><b>Batch:</b> {active.batchNo}</div>}
                {active.adverseReaction && active.reactionDetails && <div style={{ fontSize: 13, color: T.red, marginTop: 8 }}><b>Reaction:</b> {active.reactionDetails}</div>}
              </Card>
            )}
          </>
        )}
      </Drawer>
    </HealthShell>
  )
}
