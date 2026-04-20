"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Stat, Pill, Tabs, DataTable, Column, Drawer, SearchBar, Section, Button, T, Tone } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import type { MockTenant } from "@/lib/ops/mock"
import { useAuth } from "@/lib/use-auth"

type Accent = "amber" | "copper" | "sky" | "emerald"
type Mode = "bed" | "icu" | "maternity" | "table" | "class" | "room" | "chair" | "bay" | "branch"

interface Props { accent: Accent; tenant: MockTenant; mode: Mode }

const AX: Record<Accent, string> = { amber: T.amber, copper: T.copper, sky: T.sky, emerald: T.emerald }

interface Slot {
  id: string; code: string; entity?: string; entityDetail?: string
  status: "available" | "occupied" | "reserved" | "maintenance"
  admittedAt?: string; estRelease?: string; notes?: string; dayCount?: number
}

const MODE_CONFIG: Record<Mode, { slotLabel: string; entityLabel: string; totalLabel: string; unitLabel: string }> = {
  bed: { slotLabel: "Bed", entityLabel: "Patient", totalLabel: "Ward Beds", unitLabel: "days" },
  icu: { slotLabel: "ICU Bed", entityLabel: "Patient", totalLabel: "ICU Beds", unitLabel: "hours" },
  maternity: { slotLabel: "Maternity Bed", entityLabel: "Mother", totalLabel: "Maternity Beds", unitLabel: "days" },
  table: { slotLabel: "Table", entityLabel: "Party", totalLabel: "Floor Tables", unitLabel: "mins" },
  class: { slotLabel: "Seat", entityLabel: "Student", totalLabel: "Class Seats", unitLabel: "term" },
  room: { slotLabel: "Room", entityLabel: "Guest", totalLabel: "Hotel Rooms", unitLabel: "nights" },
  chair: { slotLabel: "Chair", entityLabel: "Client", totalLabel: "Salon Chairs", unitLabel: "mins" },
  bay: { slotLabel: "Bay", entityLabel: "Vehicle", totalLabel: "Mechanic Bays", unitLabel: "days" },
  branch: { slotLabel: "Branch", entityLabel: "Location", totalLabel: "Branches", unitLabel: "" },
}

function genSlots(mode: Mode): Slot[] {
  if (mode === "bed") return [
    { id: "s1", code: "W1-A", entity: "Kwame Asante", entityDetail: "M, 34y · Malaria", status: "occupied", admittedAt: "2026-04-17", estRelease: "2026-04-20", dayCount: 2, notes: "Responding to treatment. Fever subsiding." },
    { id: "s2", code: "W1-B", status: "available" },
    { id: "s3", code: "W1-C", entity: "Nana Addo", entityDetail: "M, 62y · DKA", status: "occupied", admittedAt: "2026-04-15", estRelease: "2026-04-22", dayCount: 4, notes: "Blood sugar stabilising. Insulin adjusted." },
    { id: "s4", code: "W1-D", status: "maintenance" },
    { id: "s5", code: "W2-A", entity: "Abena Osei", entityDetail: "F, 38y · Pneumonia", status: "occupied", admittedAt: "2026-04-18", estRelease: "2026-04-24", dayCount: 1, notes: "Started IV antibiotics. SpO2 improving." },
    { id: "s6", code: "W2-B", status: "available" },
    { id: "s7", code: "W2-C", status: "reserved", entity: "Incoming transfer", entityDetail: "From ICU" },
    { id: "s8", code: "W2-D", entity: "Efua Appiah", entityDetail: "F, 19y · Severe allergic reaction", status: "occupied", admittedAt: "2026-04-18", dayCount: 1 },
    { id: "s9", code: "W3-A", status: "available" },
    { id: "s10", code: "W3-B", status: "available" },
    { id: "s11", code: "W3-C", entity: "Kojo Bonsu", entityDetail: "M, 48y · Rheumatoid flare", status: "occupied", admittedAt: "2026-04-16", dayCount: 3 },
    { id: "s12", code: "W3-D", status: "available" },
  ]
  if (mode === "icu") return [
    { id: "i1", code: "ICU-1", entity: "Kofi Darkwa", entityDetail: "M, 55y · Acute MI", status: "occupied", admittedAt: "2026-04-18", dayCount: 1, notes: "SOFA 8. Intubated. Dobutamine infusion." },
    { id: "i2", code: "ICU-2", status: "available" },
    { id: "i3", code: "ICU-3", entity: "Akua Mensah", entityDetail: "F, 42y · Septic shock", status: "occupied", admittedAt: "2026-04-17", dayCount: 2, notes: "SOFA 6. Vasopressors weaning. Urine output improving." },
    { id: "i4", code: "ICU-4", status: "maintenance" },
  ]
  if (mode === "maternity") return [
    { id: "m1", code: "MAT-1", entity: "Yaa Boateng", entityDetail: "F, 24y · G2P1, 28wk ANC", status: "occupied", admittedAt: "2026-04-19", dayCount: 0, notes: "Routine ANC. EDD 2026-07-12. Fundal height on track." },
    { id: "m2", code: "MAT-2", entity: "Esi Nyarko", entityDetail: "F, 30y · G1P0, Active labour", status: "occupied", admittedAt: "2026-04-18", dayCount: 1, notes: "Cervix 7cm. FHR 138. Progressing well." },
    { id: "m3", code: "MAT-3", status: "available" },
    { id: "m4", code: "MAT-4", entity: "Akosua Frimpong", entityDetail: "F, 31y · Postnatal Day 1", status: "occupied", admittedAt: "2026-04-18", dayCount: 1, notes: "SVD at 38+4. Baby 3.2kg. Apgar 8/9. Both well." },
    { id: "m5", code: "MAT-5", status: "available" },
    { id: "m6", code: "MAT-6", status: "reserved", entity: "Elective C/S booked", entityDetail: "Tomorrow 08:00" },
  ]
  if (mode === "table") return [
    { id: "t1", code: "T-1", entity: "Party of 4", entityDetail: "Arrived 12:10", status: "occupied", dayCount: 25 },
    { id: "t2", code: "T-2", status: "available" },
    { id: "t3", code: "T-3", entity: "Party of 2", entityDetail: "Arrived 12:30", status: "occupied", dayCount: 5 },
    { id: "t4", code: "T-4", entity: "Party of 6", entityDetail: "Arrived 11:45", status: "occupied", dayCount: 50 },
    { id: "t5", code: "T-5", status: "available" },
    { id: "t6", code: "T-6", status: "reserved", entity: "VIP Reservation", entityDetail: "13:00" },
    { id: "t7", code: "T-7", entity: "Party of 3", entityDetail: "Arrived 12:15", status: "occupied", dayCount: 20 },
    { id: "t8", code: "T-8", status: "available" },
  ]
  if (mode === "class") return [
    { id: "c1", code: "JHS 1A", entity: "32 students", entityDetail: "Capacity 35", status: "occupied" },
    { id: "c2", code: "JHS 1B", entity: "28 students", entityDetail: "Capacity 35", status: "occupied" },
    { id: "c3", code: "JHS 2A", entity: "35 students", entityDetail: "Capacity 35", status: "occupied" },
    { id: "c4", code: "JHS 2B", entity: "30 students", entityDetail: "Capacity 35", status: "occupied" },
    { id: "c5", code: "JHS 3A", entity: "33 students", entityDetail: "Capacity 35", status: "occupied" },
    { id: "c6", code: "JHS 3B", entity: "25 students", entityDetail: "Capacity 35", status: "occupied" },
  ]
  return [
    { id: "g1", code: "SLOT-1", status: "available" },
    { id: "g2", code: "SLOT-2", entity: "Entity A", status: "occupied" },
    { id: "g3", code: "SLOT-3", status: "available" },
    { id: "g4", code: "SLOT-4", entity: "Entity B", status: "occupied" },
  ]
}

function statusColor(s: string) { return s === "occupied" ? T.sky : s === "available" ? T.emerald : s === "reserved" ? T.amber : T.txD }
function statusTone(s: string): Tone { return s === "occupied" ? "sky" : s === "available" ? "emerald" : s === "reserved" ? "amber" : "neutral" }
const glass: React.CSSProperties = { background: "rgba(8,20,16,0.55)", border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }
const inputStyle = (ax: string): React.CSSProperties => ({ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${ax}22`, color: T.tx, outline: "none", fontFamily: "'DM Sans', sans-serif" })

export function AdmissionEngine({ accent, tenant, mode }: Props) {
  const { authFetch, session } = useAuth()
  const ax = AX[accent]
  const cfg = MODE_CONFIG[mode] ?? MODE_CONFIG.bed
  const [slots, setSlots] = useState<Slot[]>(() => genSlots(mode))
  const [tab, setTab] = useState<"grid" | "list" | "rounds">("grid")
  const [selected, setSelected] = useState<Slot | null>(null)
  const [roundSaved, setRoundSaved] = useState<string | null>(null)
  const [dischargeSummary, setDischargeSummary] = useState("")
  const [dischargeMode, setDischargeMode] = useState(false)

  function updateSlot(id: string, u: Partial<Slot>) { setSlots(prev => prev.map(s => s.id === id ? { ...s, ...u } : s)); setSelected(null) }

  const fetchCapacity = useCallback(async () => {
    if (!session) return
    try {
      const res = await authFetch(`/api/capacity?type=${mode === "bed" || mode === "icu" || mode === "maternity" ? "admission" : mode}`)
      const json = await res.json()
      if (json.success && json.data?.capacity) {
        const mapped: Slot[] = json.data.capacity.map((c: Record<string, unknown>) => {
          const adms = (c.activeAdmissions as Record<string, unknown>[]) ?? []
          const adm = adms[0]
          return {
            id: c.id as string, code: c.name as string,
            entity: adm ? (adm.identifier as string) : undefined,
            entityDetail: adm ? (adm.notes as string) : undefined,
            status: adms.length > 0 ? "occupied" : "available",
            admittedAt: adm?.admittedAt as string | undefined,
            dayCount: adm?.admittedAt ? Math.ceil((Date.now() - new Date(adm.admittedAt as string).getTime()) / 86400000) : undefined,
          } satisfies Slot
        })
        if (mapped.length > 0) setSlots(mapped)
      }
    } catch { /* fallback to demo */ }
  }, [session, authFetch, mode])

  useEffect(() => { fetchCapacity() }, [fetchCapacity])

  const occupied = slots.filter(s => s.status === "occupied")
  const available = slots.filter(s => s.status === "available")
  const reserved = slots.filter(s => s.status === "reserved")

  const s = selected

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label={cfg.totalLabel} value={slots.length} icon="tenants" accent={accent} />
        <Stat label="Occupied" value={occupied.length} icon="user" accent="sky" />
        <Stat label="Available" value={available.length} icon="check" accent="emerald" />
        <Stat label="Reserved" value={reserved.length} icon="clock" accent="amber" />
      </div>

      <Tabs tabs={[
        { key: "grid" as const, label: "Capacity Grid" },
        { key: "list" as const, label: `${cfg.entityLabel} List`, count: occupied.length },
        ...((mode === "bed" || mode === "icu" || mode === "maternity") ? [{ key: "rounds" as const, label: "Daily Rounds" }] : []),
      ]} value={tab} onChange={setTab} />

      {tab === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
          {slots.map(slot => (
            <div key={slot.id} onClick={() => setSelected(slot)} style={{ padding: 16, borderRadius: 12, background: `${statusColor(slot.status)}08`, border: `1px solid ${statusColor(slot.status)}30`, cursor: "pointer", textAlign: "center", transition: "border-color 0.15s" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: statusColor(slot.status), marginBottom: 6 }}>{slot.code}</div>
              {slot.entity ? (
                <>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.tx, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{slot.entity}</div>
                  {slot.entityDetail && <div style={{ fontSize: 10, color: T.txM, marginTop: 2 }}>{slot.entityDetail}</div>}
                  {slot.dayCount !== undefined && <div style={{ fontSize: 10, color: T.txD, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{slot.dayCount} {cfg.unitLabel}</div>}
                </>
              ) : (
                <div style={{ fontSize: 11, color: T.txD, textTransform: "uppercase", letterSpacing: "0.1em" }}>{slot.status}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "list" && (
        <DataTable rows={occupied} columns={[
          { key: "code", label: cfg.slotLabel, width: 100, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: ax }}>{r.code}</span> },
          { key: "entity", label: cfg.entityLabel, render: r => <div><div style={{ fontWeight: 600, fontSize: 13 }}>{r.entity}</div>{r.entityDetail && <div style={{ fontSize: 11, color: T.txM }}>{r.entityDetail}</div>}</div> },
          { key: "admittedAt", label: "Admitted", width: 110, render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.admittedAt ?? "---"}</span> },
          { key: "dayCount", label: "Duration", width: 80, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.dayCount !== undefined ? `${r.dayCount} ${cfg.unitLabel}` : "---"}</span> },
          { key: "status", label: "Status", width: 100, render: r => <Pill tone="sky" dot>admitted</Pill> },
        ]} onRowClick={r => setSelected(r)} empty="No active admissions." />
      )}

      {tab === "rounds" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {occupied.map(slot => (
            <div key={slot.id} style={{ ...glass, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: ax }}>{slot.code}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: T.tx }}>{slot.entity}</span>
                </div>
                <div style={{ fontSize: 12, color: T.txM }}>{slot.entityDetail}</div>
                {slot.notes && <div style={{ fontSize: 12, color: T.tx, marginTop: 8, lineHeight: 1.6, padding: "8px 12px", borderRadius: 8, background: `${ax}06` }}>{slot.notes}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.txD }}>Day {slot.dayCount}</span>
                <Button variant="ghost" icon="check" onClick={() => { setRoundSaved(slot.id); setTimeout(() => setRoundSaved(null), 2000) }}>{roundSaved === slot.id ? "Saved" : "Record Round"}</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer open={!!s} onClose={() => setSelected(null)} title={s?.entity ?? s?.code ?? ""} subtitle={s?.code} width={560}
        footer={<>
          {s?.status === "available" && <Button variant="outline" icon="check" onClick={() => s && updateSlot(s.id, { status: "occupied", entity: `New ${cfg.entityLabel}`, entityDetail: "Just admitted", admittedAt: new Date().toISOString().slice(0, 10), dayCount: 0 })}>Admit {cfg.entityLabel}</Button>}
          {s?.status === "occupied" && <><Button variant="ghost" icon="user" onClick={() => s && updateSlot(s.id, { status: "reserved", entity: `Transferring ${s.entity}`, entityDetail: "Pending transfer" })}>Transfer</Button><Button variant="outline" icon="check" onClick={() => setDischargeMode(true)}>Discharge</Button></>}
          {s?.status === "maintenance" && <Button variant="outline" icon="check" onClick={() => s && updateSlot(s.id, { status: "available" })}>Mark Available</Button>}
        </>}
      >
        {s && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <Pill tone={statusTone(s.status)} dot>{s.status}</Pill>
              {s.dayCount !== undefined && <Pill tone="neutral">{s.dayCount} {cfg.unitLabel}</Pill>}
            </div>

            {s.entity && (
              <Section title={cfg.entityLabel}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.tx }}>{s.entity}</div>
                {s.entityDetail && <div style={{ fontSize: 12, color: T.txM, marginTop: 4 }}>{s.entityDetail}</div>}
              </Section>
            )}

            {s.admittedAt && <Section title="Admitted"><p style={{ fontSize: 14, color: T.tx }}>{s.admittedAt}</p>{s.estRelease && <p style={{ fontSize: 12, color: T.txM, marginTop: 4 }}>Est. release: {s.estRelease}</p>}</Section>}

            {s.notes && <Section title="Latest Notes"><p style={{ fontSize: 13, color: T.tx, lineHeight: 1.6 }}>{s.notes}</p></Section>}

            {s.status === "available" && (
              <Section title={`Admit ${cfg.entityLabel}`}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>{cfg.entityLabel} Name</label><input style={inputStyle(ax)} placeholder={`Search or enter ${cfg.entityLabel.toLowerCase()} name`} /></div>
                  <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Notes</label><textarea style={{ ...inputStyle(ax), minHeight: 60 }} placeholder="Admission notes..." /></div>
                </div>
              </Section>
            )}

            {dischargeMode && s.status === "occupied" && (
              <Section title="Discharge Summary">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: `${T.amber}08`, border: `1px solid ${T.amber}20`, fontSize: 12, color: T.amber }}>
                    Discharging {s.entity} from {s.code} after {s.dayCount ?? 0} {cfg.unitLabel}
                  </div>
                  <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Discharge Notes</label><textarea value={dischargeSummary} onChange={e => setDischargeSummary(e.target.value)} style={{ ...inputStyle(ax), minHeight: 80 }} placeholder="Diagnosis, treatment given, outcome, follow-up instructions..." /></div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Button variant="outline" icon="check" onClick={() => { updateSlot(s.id, { status: "available", entity: undefined, entityDetail: undefined, admittedAt: undefined, estRelease: undefined, notes: undefined, dayCount: undefined }); setDischargeMode(false); setDischargeSummary("") }}>Confirm Discharge</Button>
                    <Button variant="ghost" icon="close" onClick={() => setDischargeMode(false)}>Cancel</Button>
                  </div>
                </div>
              </Section>
            )}

            {(mode === "bed" || mode === "icu" || mode === "maternity") && s.status === "occupied" && (
              <Section title="Record Round">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {mode === "icu" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                      <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>HR</label><input style={inputStyle(ax)} placeholder="bpm" /></div>
                      <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>BP</label><input style={inputStyle(ax)} placeholder="mmHg" /></div>
                      <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>SpO2</label><input style={inputStyle(ax)} placeholder="%" /></div>
                    </div>
                  )}
                  {mode === "icu" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                      <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Temp</label><input style={inputStyle(ax)} placeholder="°C" /></div>
                      <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>GCS</label><input style={inputStyle(ax)} placeholder="/15" /></div>
                      <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>SOFA</label><input style={inputStyle(ax)} placeholder="Score" /></div>
                    </div>
                  )}
                  {mode === "maternity" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                      <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>FHR</label><input style={inputStyle(ax)} placeholder="bpm" /></div>
                      <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Cervix</label><input style={inputStyle(ax)} placeholder="cm" /></div>
                      <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Contractions</label><input style={inputStyle(ax)} placeholder="/10min" /></div>
                    </div>
                  )}
                  <div><label style={{ fontSize: 11, color: T.txM, display: "block", marginBottom: 4 }}>Notes</label><textarea style={{ ...inputStyle(ax), minHeight: 60 }} placeholder="Round notes..." /></div>
                  <Button variant="ghost" icon="check" onClick={() => { if (s) { updateSlot(s.id, { notes: `Round recorded at ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` }) } }}>Save Round</Button>
                </div>
              </Section>
            )}
          </>
        )}
      </Drawer>
    </>
  )
}
