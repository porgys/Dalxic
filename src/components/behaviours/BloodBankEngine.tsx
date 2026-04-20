"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Stat, Pill, Tabs, DataTable, Column, Drawer, SearchBar, Section, Button, T, Tone } from "@/components/ops/primitives"
import type { MockTenant } from "@/lib/ops/mock"
import { money } from "@/lib/ops/format"
import { useAuth } from "@/lib/use-auth"

type Accent = "amber" | "copper" | "sky" | "emerald"
interface Props { accent: Accent; tenant: MockTenant }

const AX: Record<Accent, string> = { amber: T.amber, copper: T.copper, sky: T.sky, emerald: T.emerald }
const glass: React.CSSProperties = { background: "rgba(8,20,16,0.55)", border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }
const inputStyle = (ax: string): React.CSSProperties => ({ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${ax}22`, color: T.tx, outline: "none", fontFamily: "'DM Sans', sans-serif" })

const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const
type BloodGroup = typeof BLOOD_GROUPS[number]
const COMPONENTS = ["Whole Blood", "Packed RBC", "Platelets", "Plasma"] as const
type BloodComponent = typeof COMPONENTS[number]

interface BloodUnit {
  id: string; group: BloodGroup; component: BloodComponent
  units: number; expiresAt: string; status: "available" | "reserved" | "expired"
}

interface Donor {
  id: string; name: string; group: BloodGroup; phone: string
  lastDonation: string; donations: number; status: "eligible" | "deferred" | "permanent_defer"
  deferReason?: string
}

interface CrossMatch {
  id: string; patient: string; patientGroup: BloodGroup; requestedComponent: BloodComponent
  units: number; status: "pending" | "matched" | "issued" | "transfused" | "cancelled"
  requestedAt: string; matchedDonor?: string
}

const DEMO_INVENTORY: BloodUnit[] = [
  { id: "bu1", group: "O+", component: "Whole Blood", units: 12, expiresAt: "2026-05-15", status: "available" },
  { id: "bu2", group: "O+", component: "Packed RBC", units: 8, expiresAt: "2026-05-20", status: "available" },
  { id: "bu3", group: "O+", component: "Platelets", units: 4, expiresAt: "2026-04-24", status: "available" },
  { id: "bu4", group: "O+", component: "Plasma", units: 6, expiresAt: "2026-10-19", status: "available" },
  { id: "bu5", group: "O-", component: "Whole Blood", units: 3, expiresAt: "2026-05-10", status: "available" },
  { id: "bu6", group: "O-", component: "Packed RBC", units: 2, expiresAt: "2026-05-18", status: "available" },
  { id: "bu7", group: "A+", component: "Whole Blood", units: 9, expiresAt: "2026-05-12", status: "available" },
  { id: "bu8", group: "A+", component: "Packed RBC", units: 5, expiresAt: "2026-05-22", status: "available" },
  { id: "bu9", group: "A+", component: "Platelets", units: 3, expiresAt: "2026-04-23", status: "available" },
  { id: "bu10", group: "A+", component: "Plasma", units: 4, expiresAt: "2026-10-15", status: "available" },
  { id: "bu11", group: "A-", component: "Whole Blood", units: 2, expiresAt: "2026-05-08", status: "available" },
  { id: "bu12", group: "B+", component: "Whole Blood", units: 7, expiresAt: "2026-05-14", status: "available" },
  { id: "bu13", group: "B+", component: "Packed RBC", units: 4, expiresAt: "2026-05-19", status: "available" },
  { id: "bu14", group: "B+", component: "Plasma", units: 3, expiresAt: "2026-10-12", status: "available" },
  { id: "bu15", group: "B-", component: "Whole Blood", units: 1, expiresAt: "2026-05-06", status: "available" },
  { id: "bu16", group: "AB+", component: "Whole Blood", units: 4, expiresAt: "2026-05-16", status: "available" },
  { id: "bu17", group: "AB+", component: "Plasma", units: 5, expiresAt: "2026-10-20", status: "available" },
  { id: "bu18", group: "AB-", component: "Whole Blood", units: 1, expiresAt: "2026-05-04", status: "available" },
  { id: "bu19", group: "AB-", component: "Packed RBC", units: 1, expiresAt: "2026-05-11", status: "reserved" },
  { id: "bu20", group: "O-", component: "Platelets", units: 0, expiresAt: "2026-04-20", status: "expired" },
]

const DEMO_DONORS: Donor[] = [
  { id: "d1", name: "Kwame Asante", group: "O+", phone: "024 111 0001", lastDonation: "2026-02-14", donations: 8, status: "eligible" },
  { id: "d2", name: "Ama Mensah", group: "A+", phone: "020 111 0002", lastDonation: "2026-03-28", donations: 3, status: "eligible" },
  { id: "d3", name: "Kofi Boateng", group: "B+", phone: "026 111 0003", lastDonation: "2026-01-10", donations: 12, status: "eligible" },
  { id: "d4", name: "Akua Darko", group: "AB+", phone: "054 111 0004", lastDonation: "2025-11-22", donations: 5, status: "deferred", deferReason: "Low haemoglobin at last screening" },
  { id: "d5", name: "Yaw Osei", group: "O-", phone: "027 111 0005", lastDonation: "2026-04-02", donations: 15, status: "eligible" },
  { id: "d6", name: "Abena Frimpong", group: "A-", phone: "050 111 0006", lastDonation: "2025-09-15", donations: 2, status: "eligible" },
  { id: "d7", name: "Kwesi Tetteh", group: "B-", phone: "024 111 0007", lastDonation: "2024-06-10", donations: 1, status: "permanent_defer", deferReason: "Hepatitis B positive" },
  { id: "d8", name: "Efua Amoah", group: "O+", phone: "055 111 0008", lastDonation: "2026-03-05", donations: 6, status: "eligible" },
]

const DEMO_CROSSMATCH: CrossMatch[] = [
  { id: "cm1", patient: "Kofi Darkwa", patientGroup: "O+", requestedComponent: "Packed RBC", units: 2, status: "matched", requestedAt: "2026-04-19 08:00", matchedDonor: "d1" },
  { id: "cm2", patient: "Akua Mensah", patientGroup: "A+", requestedComponent: "Whole Blood", units: 1, status: "pending", requestedAt: "2026-04-19 09:30" },
  { id: "cm3", patient: "Nana Addo", patientGroup: "B+", requestedComponent: "Platelets", units: 1, status: "issued", requestedAt: "2026-04-18 14:00", matchedDonor: "d3" },
  { id: "cm4", patient: "Esi Nyarko", patientGroup: "O+", requestedComponent: "Whole Blood", units: 2, status: "transfused", requestedAt: "2026-04-17 06:15", matchedDonor: "d8" },
]

function groupColor(g: BloodGroup): string {
  if (g.startsWith("O")) return T.emerald
  if (g.startsWith("A")) return T.sky
  if (g.startsWith("B")) return T.amber
  return T.copper
}

function donorTone(s: string): Tone { return s === "eligible" ? "emerald" : s === "deferred" ? "amber" : "red" }
function matchTone(s: string): Tone { return s === "transfused" ? "emerald" : s === "issued" ? "sky" : s === "matched" ? "amber" : s === "cancelled" ? "red" : "neutral" }

export function BloodBankEngine({ accent, tenant }: Props) {
  const ax = AX[accent]
  const { authFetch, session } = useAuth()
  const [tab, setTab] = useState<"inventory" | "donors" | "crossmatch" | "register">("inventory")
  const [inventory, setInventory] = useState(DEMO_INVENTORY)
  const [donors, setDonors] = useState(DEMO_DONORS)
  const [crossmatches, setCrossmatches] = useState(DEMO_CROSSMATCH)
  const [search, setSearch] = useState("")
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<CrossMatch | null>(null)

  const [regName, setRegName] = useState("")
  const [regPhone, setRegPhone] = useState("")
  const [regGroup, setRegGroup] = useState<BloodGroup>("O+")

  const fetchInventory = useCallback(async () => {
    if (!session) return
    try {
      const res = await authFetch("/api/health/blood-bank?view=inventory")
      const json = await res.json()
      if (json.success && Array.isArray(json.data) && json.data.length > 0) setInventory(json.data)
    } catch { /* fallback to demo */ }
  }, [session, authFetch])

  const fetchDonors = useCallback(async () => {
    if (!session) return
    try {
      const res = await authFetch("/api/health/blood-bank?view=donors")
      const json = await res.json()
      if (json.success && Array.isArray(json.data) && json.data.length > 0) setDonors(json.data)
    } catch { /* fallback to demo */ }
  }, [session, authFetch])

  const fetchCrossmatches = useCallback(async () => {
    if (!session) return
    try {
      const res = await authFetch("/api/health/blood-bank?view=crossmatch")
      const json = await res.json()
      if (json.success && Array.isArray(json.data) && json.data.length > 0) setCrossmatches(json.data)
    } catch { /* fallback to demo */ }
  }, [session, authFetch])

  useEffect(() => { fetchInventory(); fetchDonors(); fetchCrossmatches() }, [fetchInventory, fetchDonors, fetchCrossmatches])

  const totalUnits = inventory.filter(u => u.status === "available").reduce((s, u) => s + u.units, 0)
  const criticalGroups = BLOOD_GROUPS.filter(g => {
    const total = inventory.filter(u => u.group === g && u.status === "available").reduce((s, u) => s + u.units, 0)
    return total <= 2
  })
  const pendingMatches = crossmatches.filter(c => c.status === "pending").length
  const eligibleDonors = donors.filter(d => d.status === "eligible").length

  const gridData = useMemo(() => {
    return BLOOD_GROUPS.map(group => {
      const counts: Record<BloodComponent, number> = { "Whole Blood": 0, "Packed RBC": 0, "Platelets": 0, "Plasma": 0 }
      for (const comp of COMPONENTS) {
        counts[comp] = inventory.filter(u => u.group === group && u.component === comp && u.status === "available").reduce((s, u) => s + u.units, 0)
      }
      const total = Object.values(counts).reduce((s, v) => s + v, 0)
      return { group, counts, total }
    })
  }, [inventory])

  const filteredDonors = useMemo(() => {
    if (!search) return donors
    const q = search.toLowerCase()
    return donors.filter(d => d.name.toLowerCase().includes(q) || d.group.toLowerCase().includes(q) || d.phone.includes(q))
  }, [search, donors])

  function addDonor() {
    if (!regName || !regPhone) return
    const d: Donor = { id: `d${Date.now()}`, name: regName, group: regGroup, phone: regPhone, lastDonation: "Never", donations: 0, status: "eligible" }
    setDonors(prev => [...prev, d])
    setRegName(""); setRegPhone("")
    setTab("donors")
  }

  function updateMatch(id: string, u: Partial<CrossMatch>) { setCrossmatches(prev => prev.map(c => c.id === id ? { ...c, ...u } : c)); setSelectedMatch(null) }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Total Units" value={totalUnits} icon="database" accent={accent} />
        <Stat label="Critical Groups" value={criticalGroups.length} icon="alert" accent={criticalGroups.length > 0 ? "amber" : "emerald"} />
        <Stat label="Pending Match" value={pendingMatches} icon="clock" accent="sky" />
        <Stat label="Eligible Donors" value={eligibleDonors} icon="user" accent="emerald" />
      </div>

      {criticalGroups.length > 0 && (
        <div style={{ ...glass, border: `1px solid ${T.amber}40`, background: `${T.amber}06`, marginBottom: 20, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.amber }}>Critical stock: {criticalGroups.join(", ")} — 2 units or fewer available</span>
        </div>
      )}

      <Tabs tabs={[
        { key: "inventory" as const, label: "Inventory Grid" },
        { key: "crossmatch" as const, label: "Cross-Match", count: pendingMatches },
        { key: "donors" as const, label: "Donors", count: donors.length },
        { key: "register" as const, label: "Register Donor" },
      ]} value={tab} onChange={setTab} />

      {tab === "inventory" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", borderBottom: `1px solid ${T.border}` }}>Group</th>
                {COMPONENTS.map(c => (
                  <th key={c} style={{ padding: "12px 16px", textAlign: "center", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", borderBottom: `1px solid ${T.border}` }}>{c}</th>
                ))}
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", borderBottom: `1px solid ${T.border}` }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {gridData.map(row => (
                <tr key={row.group}>
                  <td style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, fontWeight: 800, fontSize: 15, color: groupColor(row.group), fontFamily: "'Space Grotesk', sans-serif" }}>{row.group}</td>
                  {COMPONENTS.map(c => {
                    const val = row.counts[c]
                    return (
                      <td key={c} style={{ padding: "14px 16px", textAlign: "center", borderBottom: `1px solid ${T.border}` }}>
                        <span style={{
                          display: "inline-block", minWidth: 36, padding: "4px 10px", borderRadius: 8,
                          fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700,
                          background: val === 0 ? `${T.red}14` : val <= 2 ? `${T.amber}14` : `${T.emerald}08`,
                          color: val === 0 ? T.red : val <= 2 ? T.amber : T.tx,
                        }}>{val}</span>
                      </td>
                    )
                  })}
                  <td style={{ padding: "14px 16px", textAlign: "right", borderBottom: `1px solid ${T.border}`, fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: row.total <= 2 ? T.amber : T.tx }}>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "crossmatch" && (
        <>
          <DataTable rows={crossmatches} columns={[
            { key: "patient", label: "Patient", render: r => <div><div style={{ fontWeight: 600, fontSize: 13 }}>{r.patient}</div><div style={{ fontSize: 11, color: T.txM }}>Group {r.patientGroup}</div></div> },
            { key: "requestedComponent", label: "Component", width: 130, render: r => <span style={{ fontSize: 12 }}>{r.requestedComponent}</span> },
            { key: "units", label: "Units", width: 70, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700 }}>{r.units}</span> },
            { key: "status", label: "Status", width: 110, render: r => <Pill tone={matchTone(r.status)} dot>{r.status}</Pill> },
            { key: "requestedAt", label: "Requested", width: 140, render: r => <span style={{ fontSize: 11, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{r.requestedAt}</span> },
          ] as Column<CrossMatch>[]} onRowClick={r => setSelectedMatch(r)} empty="No cross-match requests." />

          <Drawer open={!!selectedMatch} onClose={() => setSelectedMatch(null)} title={selectedMatch?.patient ?? ""} subtitle={`${selectedMatch?.patientGroup} — ${selectedMatch?.requestedComponent}`} width={480}
            footer={<>
              {selectedMatch?.status === "pending" && <Button variant="outline" icon="check" onClick={() => selectedMatch && updateMatch(selectedMatch.id, { status: "matched" })}>Confirm Match</Button>}
              {selectedMatch?.status === "matched" && <Button variant="outline" icon="check" onClick={() => selectedMatch && updateMatch(selectedMatch.id, { status: "issued" })}>Issue Blood</Button>}
              {selectedMatch?.status === "issued" && <Button variant="outline" icon="check" onClick={() => selectedMatch && updateMatch(selectedMatch.id, { status: "transfused" })}>Mark Transfused</Button>}
              {selectedMatch?.status !== "transfused" && selectedMatch?.status !== "cancelled" && <Button variant="danger" icon="close" onClick={() => selectedMatch && updateMatch(selectedMatch.id, { status: "cancelled" })}>Cancel</Button>}
            </>}
          >
            {selectedMatch && (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <Pill tone={matchTone(selectedMatch.status)} dot>{selectedMatch.status}</Pill>
                  <Pill tone="neutral">{selectedMatch.patientGroup}</Pill>
                  <Pill tone="neutral">{selectedMatch.units} unit(s)</Pill>
                </div>
                <Section title="Request Details">
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { label: "Patient", value: selectedMatch.patient },
                      { label: "Blood Group", value: selectedMatch.patientGroup },
                      { label: "Component", value: selectedMatch.requestedComponent },
                      { label: "Units Requested", value: String(selectedMatch.units) },
                      { label: "Requested At", value: selectedMatch.requestedAt },
                    ].map(row => (
                      <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: 12, color: T.txM }}>{row.label}</span>
                        <span style={{ fontSize: 12, color: T.tx, fontWeight: 600 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </Section>
                {selectedMatch.status === "pending" && (
                  <Section title="Compatible Units Available">
                    <div style={{ fontSize: 13, color: T.tx }}>
                      {inventory.filter(u => u.group === selectedMatch.patientGroup && u.component === selectedMatch.requestedComponent && u.status === "available").reduce((s, u) => s + u.units, 0)} units of {selectedMatch.patientGroup} {selectedMatch.requestedComponent} in stock
                    </div>
                  </Section>
                )}
              </>
            )}
          </Drawer>
        </>
      )}

      {tab === "donors" && (
        <>
          <div style={{ marginBottom: 16 }}><SearchBar value={search} onChange={setSearch} placeholder="Search donors by name, group, or phone..." /></div>
          <DataTable rows={filteredDonors} columns={[
            { key: "name", label: "Donor", render: r => <div><div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div><div style={{ fontSize: 11, color: T.txM }}>{r.phone}</div></div> },
            { key: "group", label: "Group", width: 70, render: r => <span style={{ fontWeight: 800, fontSize: 14, color: groupColor(r.group), fontFamily: "'Space Grotesk', sans-serif" }}>{r.group}</span> },
            { key: "donations", label: "Donations", width: 90, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13 }}>{r.donations}</span> },
            { key: "lastDonation", label: "Last Donated", width: 120, render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.lastDonation}</span> },
            { key: "status", label: "Status", width: 120, render: r => <Pill tone={donorTone(r.status)} dot>{r.status.replace("_", " ")}</Pill> },
          ] as Column<Donor>[]} onRowClick={r => setSelectedDonor(r)} empty="No registered donors." />

          <Drawer open={!!selectedDonor} onClose={() => setSelectedDonor(null)} title={selectedDonor?.name ?? ""} subtitle={`Group ${selectedDonor?.group}`} width={480}
            footer={<>
              {selectedDonor?.status === "eligible" && <Button variant="outline" icon="check" onClick={() => { if (selectedDonor) { setDonors(prev => prev.map(d => d.id === selectedDonor.id ? { ...d, donations: d.donations + 1, lastDonation: new Date().toISOString().slice(0, 10) } : d)); setSelectedDonor(null) } }}>Record Donation</Button>}
              {selectedDonor?.status === "deferred" && <Button variant="outline" icon="check" onClick={() => { if (selectedDonor) { setDonors(prev => prev.map(d => d.id === selectedDonor.id ? { ...d, status: "eligible" as const, deferReason: undefined } : d)); setSelectedDonor(null) } }}>Clear Deferral</Button>}
            </>}
          >
            {selectedDonor && (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <Pill tone={donorTone(selectedDonor.status)} dot>{selectedDonor.status.replace("_", " ")}</Pill>
                  <Pill tone="neutral">{selectedDonor.group}</Pill>
                  <Pill tone="neutral">{selectedDonor.donations} donations</Pill>
                </div>
                <Section title="Donor Details">
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { label: "Phone", value: selectedDonor.phone },
                      { label: "Blood Group", value: selectedDonor.group },
                      { label: "Last Donation", value: selectedDonor.lastDonation },
                      { label: "Total Donations", value: String(selectedDonor.donations) },
                    ].map(row => (
                      <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: 12, color: T.txM }}>{row.label}</span>
                        <span style={{ fontSize: 12, color: T.tx, fontWeight: 600 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </Section>
                {selectedDonor.deferReason && (
                  <Section title="Deferral Reason">
                    <div style={{ padding: "10px 14px", borderRadius: 8, background: `${T.amber}08`, border: `1px solid ${T.amber}20`, fontSize: 13, color: T.amber }}>{selectedDonor.deferReason}</div>
                  </Section>
                )}
              </>
            )}
          </Drawer>
        </>
      )}

      {tab === "register" && (
        <div style={{ ...glass, maxWidth: 500 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.tx, marginBottom: 20, fontFamily: "'Space Grotesk', sans-serif" }}>Register New Donor</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Full Name</label><input value={regName} onChange={e => setRegName(e.target.value)} style={inputStyle(ax)} placeholder="Donor name" /></div>
            <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Phone Number</label><input value={regPhone} onChange={e => setRegPhone(e.target.value)} style={inputStyle(ax)} placeholder="0XX XXX XXXX" /></div>
            <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Blood Group</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {BLOOD_GROUPS.map(g => (
                  <button key={g} onClick={() => setRegGroup(g)} style={{
                    padding: "10px 8px", borderRadius: 10, fontSize: 14, fontWeight: 800,
                    background: regGroup === g ? `${groupColor(g)}18` : "rgba(255,255,255,0.03)",
                    border: `2px solid ${regGroup === g ? groupColor(g) : T.border}`,
                    color: regGroup === g ? groupColor(g) : T.txM,
                    cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
                  }}>{g}</button>
                ))}
              </div>
            </div>
            <Button variant="outline" icon="check" onClick={addDonor}>Register Donor</Button>
          </div>
        </div>
      )}
    </>
  )
}
