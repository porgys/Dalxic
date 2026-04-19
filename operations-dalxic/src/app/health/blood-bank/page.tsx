"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { HealthShell } from "@/components/ops/HealthShell"
import { useAuth } from "@/lib/use-auth"
import { Page, Stat, Pill, Drawer, Tabs, DataTable, Card, T, Button, Field, Input, TextArea, Select, Modal, Empty, Section, SearchBar } from "@/components/ops/primitives"

type View = "inventory" | "requests" | "transfusions" | "donors"

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const
const COMPONENTS = ["Whole Blood", "Packed RBC", "Plasma", "Platelets"] as const

interface BloodUnit { id: string; bloodType: string; component: string; quantity: number; expiresAt: string; donorId?: string; status: string }
interface BloodRequest { id: string; contactId: string; patientName: string; bloodType: string; component: string; quantity: number; status: string; requestedBy: string; requestedAt: string; notes?: string }
interface Transfusion { id: string; contactId: string; patientName: string; bloodType: string; component: string; unitNumber: string; startedAt: string; completedAt?: string; volume: number; adverseReaction: boolean; reactionDetails?: string }
interface Donor { id: string; name: string; bloodType: string; phone: string; lastDonation?: string; eligible: boolean; donations: number }

const emptyRequest = { contactId: "", patientName: "", bloodType: "O+", component: "Packed RBC", quantity: "1", notes: "" }
const emptyTransfusion = { unitNumber: "", volume: "1", adverseReaction: false, reactionDetails: "" }

export default function BloodBankPage() {
  const { session, authFetch } = useAuth()
  const [view, setView] = useState<View>("inventory")
  const [query, setQuery] = useState("")
  const [inventory, setInventory] = useState<Map<string, Map<string, number>>>(new Map())
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [transfusions, setTransfusions] = useState<Transfusion[]>([])
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(null)
  const [requestOpen, setRequestOpen] = useState(false)
  const [requestForm, setRequestForm] = useState({ ...emptyRequest })
  const [transfusionForm, setTransfusionForm] = useState({ ...emptyTransfusion })
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([])

  const fetchData = useCallback(async () => {
    if (!session) return; setLoading(true)
    try {
      const [bbRes, contactsRes] = await Promise.all([
        authFetch("/api/health/clinical?type=blood_bank"),
        authFetch("/api/contacts"),
      ])
      const [bbJson, contactsJson] = await Promise.all([bbRes.json(), contactsRes.json()])

      if (contactsJson.success) setContacts(contactsJson.data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })))
      const contactMap = new Map<string, string>()
      if (contactsJson.success) for (const c of contactsJson.data) contactMap.set(c.id, c.name)

      const inv = new Map<string, Map<string, number>>()
      for (const bt of BLOOD_TYPES) {
        inv.set(bt, new Map(COMPONENTS.map(c => [c, 0])))
      }

      const reqs: BloodRequest[] = []
      const trans: Transfusion[] = []
      const donorMap = new Map<string, Donor>()

      if (bbJson.success) {
        for (const rec of bbJson.data) {
          const d = rec.data as Record<string, unknown>
          const subtype = d.subtype as string

          if (subtype === "inventory_update") {
            const bt = d.bloodType as string
            const comp = d.component as string
            const qty = (d.quantity as number) || 0
            if (inv.has(bt)) inv.get(bt)!.set(comp, (inv.get(bt)!.get(comp) || 0) + qty)
          } else if (subtype === "request") {
            reqs.push({
              id: rec.id, contactId: rec.contactId,
              patientName: contactMap.get(rec.contactId) || (d.patientName as string) || "Unknown",
              bloodType: (d.bloodType as string) || "O+", component: (d.component as string) || "Packed RBC",
              quantity: (d.quantity as number) || 1, status: rec.status,
              requestedBy: (d.requestedBy as string) || rec.performedByName,
              requestedAt: rec.performedAt, notes: d.notes as string | undefined,
            })
          } else if (subtype === "transfusion") {
            trans.push({
              id: rec.id, contactId: rec.contactId,
              patientName: contactMap.get(rec.contactId) || (d.patientName as string) || "Unknown",
              bloodType: (d.bloodType as string) || "", component: (d.component as string) || "",
              unitNumber: (d.unitNumber as string) || "", startedAt: rec.performedAt,
              completedAt: rec.status === "completed" ? rec.performedAt : undefined,
              volume: (d.volume as number) || 1,
              adverseReaction: d.adverseReaction === true,
              reactionDetails: d.reactionDetails as string | undefined,
            })
          } else if (subtype === "donor") {
            const name = (d.donorName as string) || "Unknown"
            if (!donorMap.has(name)) {
              donorMap.set(name, {
                id: rec.id, name, bloodType: (d.bloodType as string) || "O+",
                phone: (d.phone as string) || "", lastDonation: rec.performedAt,
                eligible: d.eligible !== false, donations: 1,
              })
            } else {
              const existing = donorMap.get(name)!
              existing.donations++
              existing.lastDonation = rec.performedAt
            }
          }
        }
      }

      setInventory(inv)
      setRequests(reqs)
      setTransfusions(trans)
      setDonors(Array.from(donorMap.values()))
      setError(null)
    } catch { setError("Network Error") } finally { setLoading(false) }
  }, [session, authFetch])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  const totalUnits = useMemo(() => {
    let total = 0
    inventory.forEach(comps => comps.forEach(qty => { total += qty }))
    return total
  }, [inventory])
  const pendingReqs = requests.filter(r => r.status === "active" || r.status === "pending").length
  const issuedToday = requests.filter(r => r.status === "issued").length

  function cellColor(count: number) { if (count >= 10) return T.emerald; if (count >= 3) return T.amber; return T.red }

  async function createRequest() {
    if (!requestForm.contactId) return; setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        contactId: requestForm.contactId, type: "blood_bank",
        data: { subtype: "request", bloodType: requestForm.bloodType, component: requestForm.component, quantity: parseInt(requestForm.quantity) || 1, patientName: requestForm.patientName, notes: requestForm.notes },
        status: "active",
      }) })
      setRequestOpen(false); setRequestForm({ ...emptyRequest }); await fetchData()
    } catch { setError("Failed") } finally { setSubmitting(false) }
  }

  async function issueBlood(req: BloodRequest) {
    if (!session) return; setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        contactId: req.contactId, type: "blood_bank",
        data: { subtype: "transfusion", bloodType: req.bloodType, component: req.component, unitNumber: `BB-${Date.now()}`, volume: req.quantity, patientName: req.patientName },
        status: "active",
      }) })
      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        contactId: req.contactId, type: "blood_bank",
        data: { subtype: "inventory_update", bloodType: req.bloodType, component: req.component, quantity: -req.quantity },
        status: "completed",
      }) })
      setActiveRequest(null); await fetchData()
    } catch { setError("Failed") } finally { setSubmitting(false) }
  }

  return (
    <HealthShell>
      <Page accent="copper" title="Blood Bank" subtitle="Inventory Grid, Cross-Match, Transfusion Records And Donor Registry.">
        {error && <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#f87171", fontSize: 13, fontWeight: 600 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Units" value={totalUnits} accent="copper" icon="database" />
          <Stat label="Available" value={totalUnits} accent="emerald" icon="check" />
          <Stat label="Issued Today" value={issuedToday} accent="copper" icon="share" />
          <Stat label="Pending Requests" value={pendingReqs} accent="amber" icon="orders" />
        </div>

        <Section title="Blood Bank" action={
          <div style={{ display: "flex", gap: 10 }}>
            <SearchBar value={query} onChange={setQuery} placeholder="Search…" />
            <Button icon="plus" onClick={() => { setRequestForm({ ...emptyRequest }); setRequestOpen(true) }}>New Request</Button>
          </div>
        }>
          <Tabs<View> value={view} onChange={setView} accent="copper" tabs={[
            { key: "inventory", label: "Inventory" },
            { key: "requests", label: "Requests", count: pendingReqs },
            { key: "transfusions", label: "Transfusions", count: transfusions.length },
            { key: "donors", label: "Donors", count: donors.length },
          ]} />

          <div style={{ marginTop: 18 }}>
            {loading ? <div style={{ textAlign: "center", padding: 48, color: T.txD, fontSize: 13, fontWeight: 600 }}>Loading…</div> : view === "inventory" ? (
              <Card padding={18}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "10px 12px", textAlign: "left", color: T.txD, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Blood Type</th>
                        {COMPONENTS.map(c => <th key={c} style={{ padding: "10px 12px", textAlign: "center", color: T.txD, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>{c}</th>)}
                        <th style={{ padding: "10px 12px", textAlign: "center", color: T.txD, fontSize: 10, textTransform: "uppercase" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BLOOD_TYPES.map(bt => {
                        const comps = inventory.get(bt)
                        const total = comps ? Array.from(comps.values()).reduce((s, v) => s + v, 0) : 0
                        return (
                          <tr key={bt} style={{ borderBottom: `1px solid ${T.border}` }}>
                            <td style={{ padding: "10px 12px", fontWeight: 800, fontSize: 16, color: T.tx }}>{bt}</td>
                            {COMPONENTS.map(c => {
                              const count = comps?.get(c) || 0
                              return <td key={c} style={{ padding: "10px 12px", textAlign: "center", fontFamily: "'DM Mono', monospace", fontWeight: 800, fontSize: 18, color: cellColor(count) }}>{count}</td>
                            })}
                            <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 800, fontSize: 16, color: T.tx }}>{total}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : view === "requests" ? (
              requests.length === 0 ? <Empty icon="search" title="No Requests" sub="Blood requests will appear here." /> : (
                <DataTable
                  columns={[
                    { key: "patientName", label: "Patient", render: (r: BloodRequest) => <span style={{ fontWeight: 700 }}>{r.patientName}</span> },
                    { key: "bloodType", label: "Type", width: 70, render: (r: BloodRequest) => <span style={{ fontWeight: 800, color: T.red }}>{r.bloodType}</span> },
                    { key: "component", label: "Component", render: (r: BloodRequest) => r.component },
                    { key: "quantity", label: "Units", width: 70, render: (r: BloodRequest) => r.quantity },
                    { key: "status", label: "Status", width: 110, render: (r: BloodRequest) => <Pill tone={r.status === "active" ? "amber" : r.status === "issued" ? "emerald" : "neutral"}>{r.status}</Pill> },
                    { key: "requestedBy", label: "Requested By", render: (r: BloodRequest) => r.requestedBy },
                  ]}
                  rows={requests}
                  onRowClick={(r) => setActiveRequest(r as BloodRequest)}
                />
              )
            ) : view === "transfusions" ? (
              transfusions.length === 0 ? <Empty icon="search" title="No Transfusions" sub="Transfusion records will appear here." /> : (
                <DataTable
                  columns={[
                    { key: "patientName", label: "Patient", render: (t: Transfusion) => <span style={{ fontWeight: 700 }}>{t.patientName}</span> },
                    { key: "bloodType", label: "Type", width: 70, render: (t: Transfusion) => <span style={{ fontWeight: 800, color: T.red }}>{t.bloodType}</span> },
                    { key: "component", label: "Component", render: (t: Transfusion) => t.component },
                    { key: "unitNumber", label: "Unit #", width: 120, render: (t: Transfusion) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{t.unitNumber}</span> },
                    { key: "reaction", label: "Reaction", width: 100, render: (t: Transfusion) => t.adverseReaction ? <Pill tone="red">Yes</Pill> : <Pill tone="emerald">None</Pill> },
                    { key: "date", label: "Date", width: 100, render: (t: Transfusion) => new Date(t.startedAt).toLocaleDateString() },
                  ]}
                  rows={transfusions}
                  onRowClick={() => {}}
                />
              )
            ) : (
              donors.length === 0 ? <Empty icon="search" title="No Donors" sub="Donor records will appear here." /> : (
                <DataTable
                  columns={[
                    { key: "name", label: "Donor", render: (d: Donor) => <span style={{ fontWeight: 700 }}>{d.name}</span> },
                    { key: "bloodType", label: "Type", width: 70, render: (d: Donor) => <span style={{ fontWeight: 800, color: T.red }}>{d.bloodType}</span> },
                    { key: "phone", label: "Phone", render: (d: Donor) => d.phone || "—" },
                    { key: "donations", label: "Donations", width: 90, render: (d: Donor) => d.donations },
                    { key: "lastDonation", label: "Last Donation", width: 110, render: (d: Donor) => d.lastDonation ? new Date(d.lastDonation).toLocaleDateString() : "—" },
                    { key: "eligible", label: "Eligible", width: 80, render: (d: Donor) => <Pill tone={d.eligible ? "emerald" : "red"}>{d.eligible ? "Yes" : "No"}</Pill> },
                  ]}
                  rows={donors}
                  onRowClick={() => {}}
                />
              )
            )}
          </div>
        </Section>
      </Page>

      <Drawer open={!!activeRequest} onClose={() => setActiveRequest(null)} title="Blood Request" subtitle={activeRequest?.patientName} width={480}>
        {activeRequest && (
          <>
            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Patient:</b> {activeRequest.patientName}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Blood Type:</b> <span style={{ fontWeight: 800, color: T.red }}>{activeRequest.bloodType}</span></div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Component:</b> {activeRequest.component}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Units:</b> {activeRequest.quantity}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Requested By:</b> {activeRequest.requestedBy}</div>
              {activeRequest.notes && <div style={{ fontSize: 13, color: T.tx }}><b>Notes:</b> {activeRequest.notes}</div>}
            </Card>
            {(activeRequest.status === "active" || activeRequest.status === "pending") && (
              <div style={{ display: "flex", gap: 10 }}>
                <Button full onClick={() => issueBlood(activeRequest)} disabled={submitting}>{submitting ? "Issuing…" : "Cross-Match & Issue"}</Button>
              </div>
            )}
          </>
        )}
      </Drawer>

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="New Blood Request">
        <Field label="Patient">
          <Select value={requestForm.contactId} onChange={e => { const c = contacts.find(c => c.id === e.target.value); setRequestForm(p => ({ ...p, contactId: e.target.value, patientName: c?.name || "" })) }}>
            <option value="">Select Patient</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Blood Type">
            <Select value={requestForm.bloodType} onChange={e => setRequestForm(p => ({ ...p, bloodType: e.target.value }))}>
              {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
            </Select>
          </Field>
          <Field label="Component">
            <Select value={requestForm.component} onChange={e => setRequestForm(p => ({ ...p, component: e.target.value }))}>
              {COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Units Required"><Input type="number" placeholder="1" value={requestForm.quantity} onChange={e => setRequestForm(p => ({ ...p, quantity: e.target.value }))} /></Field>
        <Field label="Notes"><TextArea placeholder="Clinical indication…" value={requestForm.notes} onChange={e => setRequestForm(p => ({ ...p, notes: e.target.value }))} /></Field>
        <div style={{ marginTop: 16 }}><Button full onClick={createRequest} disabled={submitting}>{submitting ? "Requesting…" : "Submit Request"}</Button></div>
      </Modal>
    </HealthShell>
  )
}
