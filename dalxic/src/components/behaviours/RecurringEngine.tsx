"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Stat, Pill, Tabs, DataTable, Column, Drawer, SearchBar, Section, Button, T, Tone } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import type { MockTenant } from "@/lib/ops/mock"
import { money } from "@/lib/ops/format"
import { useAuth } from "@/lib/use-auth"

type Accent = "amber" | "copper" | "sky" | "emerald"
type Mode = "nightly" | "membership" | "fees" | "subscription" | "generic"

interface Props { accent: Accent; tenant: MockTenant; mode: Mode }

const AX: Record<Accent, string> = { amber: T.amber, copper: T.copper, sky: T.sky, emerald: T.emerald }

interface RecurringSchedule {
  id: string; entity: string; entityDetail: string; plan: string
  amount: number; interval: string; status: "active" | "overdue" | "frozen" | "cancelled"
  nextCharge: string; lastCharge: string; totalCharged: number; chargeCount: number
}

const DEMO_NIGHTLY: RecurringSchedule[] = [
  { id: "rn1", entity: "Kwame Asante", entityDetail: "W1-A · Malaria", plan: "Ward Daily", amount: 150_00, interval: "daily", status: "active", nextCharge: "2026-04-20", lastCharge: "2026-04-19", totalCharged: 300_00, chargeCount: 2 },
  { id: "rn2", entity: "Nana Addo", entityDetail: "W1-C · DKA", plan: "Ward Daily", amount: 150_00, interval: "daily", status: "active", nextCharge: "2026-04-20", lastCharge: "2026-04-19", totalCharged: 600_00, chargeCount: 4 },
  { id: "rn3", entity: "Abena Osei", entityDetail: "W2-A · Pneumonia", plan: "Ward Daily", amount: 150_00, interval: "daily", status: "active", nextCharge: "2026-04-20", lastCharge: "2026-04-19", totalCharged: 150_00, chargeCount: 1 },
  { id: "rn4", entity: "Kofi Darkwa", entityDetail: "ICU-1 · Acute MI", plan: "ICU Daily", amount: 500_00, interval: "daily", status: "active", nextCharge: "2026-04-20", lastCharge: "2026-04-19", totalCharged: 500_00, chargeCount: 1 },
  { id: "rn5", entity: "Akua Mensah", entityDetail: "ICU-3 · Sepsis", plan: "ICU Daily", amount: 500_00, interval: "daily", status: "active", nextCharge: "2026-04-20", lastCharge: "2026-04-19", totalCharged: 1000_00, chargeCount: 2 },
]

const DEMO_MEMBERSHIP: RecurringSchedule[] = [
  { id: "rm1", entity: "Kweku Pratt", entityDetail: "Gold Member", plan: "Gold Membership", amount: 100_00, interval: "monthly", status: "active", nextCharge: "2026-05-01", lastCharge: "2026-04-01", totalCharged: 1200_00, chargeCount: 12 },
  { id: "rm2", entity: "Efua Appiah", entityDetail: "Silver Member", plan: "Silver Membership", amount: 50_00, interval: "monthly", status: "active", nextCharge: "2026-05-01", lastCharge: "2026-04-01", totalCharged: 300_00, chargeCount: 6 },
  { id: "rm3", entity: "Kojo Bonsu", entityDetail: "Platinum Member", plan: "Platinum VIP", amount: 200_00, interval: "monthly", status: "overdue", nextCharge: "2026-04-01", lastCharge: "2026-03-01", totalCharged: 2400_00, chargeCount: 12 },
  { id: "rm4", entity: "Ama Mensah", entityDetail: "Bronze Member", plan: "Bronze Membership", amount: 30_00, interval: "monthly", status: "frozen", nextCharge: "---", lastCharge: "2026-02-01", totalCharged: 120_00, chargeCount: 4 },
  { id: "rm5", entity: "Yaa Boateng", entityDetail: "Gold Member", plan: "Gold Membership", amount: 100_00, interval: "monthly", status: "active", nextCharge: "2026-05-01", lastCharge: "2026-04-01", totalCharged: 400_00, chargeCount: 4 },
]

const DEMO_FEES: RecurringSchedule[] = [
  { id: "rf1", entity: "JHS 1A (32 students)", entityDetail: "Term 2 2025/26", plan: "Tuition + Levy", amount: 850_00, interval: "termly", status: "active", nextCharge: "2026-09-01", lastCharge: "2026-04-01", totalCharged: 27200_00, chargeCount: 32 },
  { id: "rf2", entity: "JHS 1B (28 students)", entityDetail: "Term 2 2025/26", plan: "Tuition + Levy", amount: 850_00, interval: "termly", status: "active", nextCharge: "2026-09-01", lastCharge: "2026-04-01", totalCharged: 23800_00, chargeCount: 28 },
  { id: "rf3", entity: "JHS 2A (35 students)", entityDetail: "Term 2 2025/26", plan: "Tuition + Levy", amount: 900_00, interval: "termly", status: "active", nextCharge: "2026-09-01", lastCharge: "2026-04-01", totalCharged: 31500_00, chargeCount: 35 },
  { id: "rf4", entity: "JHS 3 Defaulters (4)", entityDetail: "Overdue since Term 1", plan: "Tuition Balance", amount: 650_00, interval: "termly", status: "overdue", nextCharge: "Overdue", lastCharge: "2025-09-01", totalCharged: 0, chargeCount: 0 },
]

function getSchedules(mode: Mode): RecurringSchedule[] {
  if (mode === "nightly") return DEMO_NIGHTLY
  if (mode === "membership") return DEMO_MEMBERSHIP
  if (mode === "fees") return DEMO_FEES
  if (mode === "subscription") return DEMO_MEMBERSHIP
  return DEMO_MEMBERSHIP
}

function statusTone(s: string): Tone { return s === "active" ? "emerald" : s === "overdue" ? "red" : s === "frozen" ? "sky" : "neutral" }
const glass: React.CSSProperties = { background: "rgba(8,20,16,0.55)", border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }
const inputStyle = (ax: string): React.CSSProperties => ({ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${ax}22`, color: T.tx, outline: "none", fontFamily: "'DM Sans', sans-serif" })

function mapApiRecurring(api: Record<string, unknown>): RecurringSchedule {
  const isOverdue = api.status === "active" && api.nextDueDate && new Date(api.nextDueDate as string) < new Date()
  return {
    id: api.id as string,
    entity: (api.contactId as string) ?? "Unknown",
    entityDetail: (api.admissionId as string) ?? "",
    plan: (api.serviceItemId as string) ?? "",
    amount: (api.amount as number) ?? 0,
    interval: (api.interval as string) ?? "monthly",
    status: isOverdue ? "overdue" : (api.status as RecurringSchedule["status"]) ?? "active",
    nextCharge: api.nextDueDate ? new Date(api.nextDueDate as string).toISOString().slice(0, 10) : "---",
    lastCharge: api.lastChargedAt ? new Date(api.lastChargedAt as string).toISOString().slice(0, 10) : "---",
    totalCharged: ((api.amount as number) ?? 0) * ((api.chargeCount as number) ?? 0),
    chargeCount: (api.chargeCount as number) ?? 0,
  }
}

export function RecurringEngine({ accent, tenant, mode }: Props) {
  const { authFetch, session } = useAuth()
  const ax = AX[accent]
  const [schedules, setSchedules] = useState<RecurringSchedule[]>(getSchedules(mode))
  const [tab, setTab] = useState<"active" | "overdue" | "frozen" | "all">("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<RecurringSchedule | null>(null)

  function updateSchedule(id: string, u: Partial<RecurringSchedule>) { setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...u } : s)); setSelected(null) }

  const fetchSchedules = useCallback(async () => {
    if (!session) return
    try {
      const res = await authFetch("/api/recurring")
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        const mapped = json.data.map(mapApiRecurring)
        if (mapped.length > 0) setSchedules(mapped)
      }
    } catch { /* fallback to demo */ }
  }, [session, authFetch])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  const active = schedules.filter(s => s.status === "active")
  const overdue = schedules.filter(s => s.status === "overdue")
  const frozen = schedules.filter(s => s.status === "frozen")
  const totalRevenue = schedules.reduce((sum, s) => sum + s.totalCharged, 0)

  const filtered = useMemo(() => {
    let rows = schedules
    if (tab !== "all") rows = rows.filter(s => s.status === tab)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(s => s.entity.toLowerCase().includes(q) || s.plan.toLowerCase().includes(q))
    }
    return rows
  }, [tab, search, schedules])

  const cols: Column<RecurringSchedule>[] = [
    { key: "entity", label: mode === "fees" ? "Class / Group" : "Member", render: r => <div><div style={{ fontWeight: 600, fontSize: 13 }}>{r.entity}</div><div style={{ fontSize: 11, color: T.txM }}>{r.entityDetail}</div></div> },
    { key: "plan", label: "Plan", width: 140, render: r => <span style={{ fontSize: 12, color: T.tx }}>{r.plan}</span> },
    { key: "amount", label: "Amount", width: 100, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{money(r.amount)}</span> },
    { key: "interval", label: "Interval", width: 90, render: r => <Pill tone="neutral">{r.interval}</Pill> },
    { key: "nextCharge", label: "Next Charge", width: 120, render: r => <span style={{ fontSize: 12, color: r.status === "overdue" ? T.red : T.txM, fontWeight: r.status === "overdue" ? 700 : 400 }}>{r.nextCharge}</span> },
    { key: "status", label: "Status", width: 100, render: r => <Pill tone={statusTone(r.status)} dot>{r.status}</Pill> },
    { key: "totalCharged", label: "Total", width: 100, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.txM }}>{money(r.totalCharged)}</span> },
  ]

  const s = selected

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Active" value={active.length} icon="check" accent="emerald" />
        <Stat label="Overdue" value={overdue.length} icon="alert" accent="amber" />
        <Stat label="Frozen" value={frozen.length} icon="lock" accent="sky" />
        <Stat label="Revenue" value={money(totalRevenue)} icon="trending" accent={accent} />
      </div>

      <Tabs tabs={[
        { key: "all" as const, label: "All", count: schedules.length },
        { key: "active" as const, label: "Active", count: active.length },
        { key: "overdue" as const, label: "Overdue", count: overdue.length },
        { key: "frozen" as const, label: "Frozen", count: frozen.length },
      ]} value={tab} onChange={setTab} />

      <div style={{ marginBottom: 16 }}><SearchBar value={search} onChange={setSearch} placeholder="Search schedules..." /></div>

      <DataTable rows={filtered} columns={cols} onRowClick={r => setSelected(r)} empty="No recurring schedules." />

      <Drawer open={!!s} onClose={() => setSelected(null)} title={s?.entity ?? ""} subtitle={s?.plan} width={520}
        footer={<>
          {s?.status === "active" && <><Button variant="ghost" icon="clock" onClick={() => s && updateSchedule(s.id, { chargeCount: s.chargeCount + 1, totalCharged: s.totalCharged + s.amount, lastCharge: new Date().toISOString().slice(0, 10) })}>Charge Now</Button><Button variant="outline" icon="lock" onClick={() => s && updateSchedule(s.id, { status: "frozen", nextCharge: "---" })}>Freeze</Button></>}
          {s?.status === "overdue" && <><Button variant="outline" icon="check" onClick={() => s && updateSchedule(s.id, { status: "active", chargeCount: s.chargeCount + 1, totalCharged: s.totalCharged + s.amount, lastCharge: new Date().toISOString().slice(0, 10) })}>Collect Payment</Button><Button variant="danger" icon="lock" onClick={() => s && updateSchedule(s.id, { status: "frozen", nextCharge: "---" })}>Suspend</Button></>}
          {s?.status === "frozen" && <Button variant="outline" icon="check" onClick={() => s && updateSchedule(s.id, { status: "active" })}>Reactivate</Button>}
          {s?.status !== "cancelled" && <Button variant="danger" icon="lock" onClick={() => s && updateSchedule(s.id, { status: "cancelled", nextCharge: "---" })}>Cancel</Button>}
        </>}
      >
        {s && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <Pill tone={statusTone(s.status)} dot>{s.status}</Pill>
              <Pill tone="neutral">{s.interval}</Pill>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
              {[
                { label: "Charge Amount", value: money(s.amount) },
                { label: "Total Charged", value: money(s.totalCharged) },
                { label: "Charges Fired", value: String(s.chargeCount) },
              ].map(ms => (
                <div key={ms.label} style={{ padding: 14, borderRadius: 12, background: `${ax}06`, border: `1px solid ${T.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{ms.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{ms.value}</div>
                </div>
              ))}
            </div>

            <Section title="Schedule Details">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Plan", value: s.plan },
                  { label: "Interval", value: s.interval },
                  { label: "Next Charge", value: s.nextCharge },
                  { label: "Last Charge", value: s.lastCharge },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 12, color: T.txM }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: T.tx, fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title={`${s.entityDetail}`}>
              <p style={{ fontSize: 13, color: T.tx }}>{s.entity}</p>
            </Section>
          </>
        )}
      </Drawer>
    </>
  )
}
