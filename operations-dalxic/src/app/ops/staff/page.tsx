"use client"
/* ═══════════════════════════════════════════════════════════════
   /ops/staff — DalxicOps internal operators + their roles
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import {
  Card, Stat, Pill, Button, DataTable, Drawer, SearchBar,
  Tabs, Section, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_STAFF, MockStaff, StaffRole, MOCK_PLATFORM_AUDIT } from "@/lib/ops/mock"

type View = "all" | "online" | "away" | "offline"

const ROLE_LABEL: Record<StaffRole, string> = {
  founder: "Founder",
  account_manager: "Account Manager",
  support_l1: "Support L1",
  support_l2: "Support L2",
  billing: "Billing",
  analyst: "Analyst",
  engineer: "Engineer",
}

const ROLE_TONE: Record<StaffRole, Tone> = {
  founder: "amber",
  account_manager: "emerald",
  support_l1: "sky",
  support_l2: "sky",
  billing: "amber",
  analyst: "emerald",
  engineer: "neutral",
}

const STATUS_TONE: Record<MockStaff["status"], Tone> = {
  online: "emerald", away: "amber", offline: "neutral",
}

export default function OpsStaffPage() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<MockStaff | null>(null)

  const filtered = useMemo(() => MOCK_STAFF.filter(s => {
    if (view !== "all" && s.status !== view) return false
    if (!query) return true
    const q = query.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || ROLE_LABEL[s.role].toLowerCase().includes(q)
  }), [view, query])

  const totals = {
    total: MOCK_STAFF.length,
    online: MOCK_STAFF.filter(s => s.status === "online").length,
    openTickets: MOCK_STAFF.reduce((s, x) => s + x.openTickets, 0),
    coverage: MOCK_STAFF.reduce((s, x) => s + x.tenantsAssigned, 0),
  }

  const cols: Column<MockStaff>[] = [
    { key: "name", label: "Staff", render: (s) => (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={s.name} status={s.status} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{s.name}</div>
          <div style={{ fontSize: 11, color: T.txM, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{s.email}</div>
        </div>
      </div>
    )},
    { key: "role", label: "Role", width: 160, render: (s) => <Pill tone={ROLE_TONE[s.role]}>{ROLE_LABEL[s.role]}</Pill> },
    { key: "region", label: "Region", width: 130, render: (s) => <span style={{ fontSize: 12, color: T.txM }}>{s.region}</span> },
    { key: "tenants", label: "Tenants", width: 100, align: "center", render: (s) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 800, color: T.tx }}>{s.tenantsAssigned || "—"}</span>
    )},
    { key: "tickets", label: "Open Tix", width: 100, align: "center", render: (s) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 800, color: s.openTickets > 0 ? T.amber : T.txD }}>{s.openTickets || "—"}</span>
    )},
    { key: "active", label: "Last Active", width: 140, render: (s) => (
      <span style={{ fontSize: 11, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{s.lastActive}</span>
    )},
    { key: "status", label: "Status", width: 110, render: (s) => <Pill tone={STATUS_TONE[s.status]} dot>{s.status}</Pill> },
  ]

  return (
    <>
      <OpsPage
        title="Staff"
        subtitle="DalxicOps internal team. Not tenants — the people behind the platform."
        icon="staff"
        action={<Button icon="plus">Invite Staff</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Staff"    value={totals.total}                accent="emerald" icon="staff" />
          <Stat label="Online Now"      value={totals.online}               accent="emerald" icon="check" />
          <Stat label="Open Tickets"   value={totals.openTickets}          accent="amber"   icon="support" />
          <Stat label="Tenants Covered" value={totals.coverage}             accent="sky"     icon="tenants" />
        </div>

        <Section
          title="Team Directory"
          action={<div style={{ width: 320 }}><SearchBar value={query} onChange={setQuery} placeholder="Name, email, role…" /></div>}
        >
          <Tabs<View>
            value={view} onChange={setView} accent="emerald"
            tabs={[
              { key: "all",     label: "All",     count: MOCK_STAFF.length },
              { key: "online",  label: "Online",  count: MOCK_STAFF.filter(s => s.status === "online").length },
              { key: "away",    label: "Away",    count: MOCK_STAFF.filter(s => s.status === "away").length },
              { key: "offline", label: "Offline", count: MOCK_STAFF.filter(s => s.status === "offline").length },
            ]}
          />

          <DataTable rows={filtered} columns={cols} onRowClick={(s) => setActive(s)} />
        </Section>
      </OpsPage>

      <StaffDrawer staff={active} onClose={() => setActive(null)} />
    </>
  )
}

function Avatar({ name, status }: { name: string; status: MockStaff["status"] }) {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("")
  const c = status === "online" ? T.emerald : status === "away" ? T.amber : T.txD
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        background: `linear-gradient(135deg, ${T.emerald}, #059669)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, color: "#fff", fontFamily: "'DM Mono', monospace",
      }}>{initials}</div>
      <div style={{
        position: "absolute", right: -1, bottom: -1,
        width: 10, height: 10, borderRadius: "50%",
        background: c, border: `2px solid ${T.bg}`,
      }} />
    </div>
  )
}

function StaffDrawer({ staff, onClose }: { staff: MockStaff | null; onClose: () => void }) {
  if (!staff) return <Drawer open={false} onClose={onClose} title="Staff">{null}</Drawer>
  const actions = MOCK_PLATFORM_AUDIT.filter(a => a.actor === staff.name).slice(0, 6)

  return (
    <Drawer
      open={!!staff} onClose={onClose}
      title={staff.name}
      subtitle={ROLE_LABEL[staff.role]}
      width={520}
      footer={
        <>
          <Button variant="ghost" icon="mail">Message</Button>
          <Button variant="outline" icon="edit">Edit Role</Button>
          <Button variant="danger" icon="logout">Revoke Access</Button>
        </>
      }
    >
      <Card padding={20} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar name={staff.name} status={staff.status} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{staff.name}</div>
            <div style={{ fontSize: 12, color: T.txM, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{staff.email}</div>
          </div>
          <Pill tone={STATUS_TONE[staff.status]} dot>{staff.status}</Pill>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        <MiniStat label="Role" value={ROLE_LABEL[staff.role]} />
        <MiniStat label="Region" value={staff.region} />
        <MiniStat label="Joined" value={staff.joinedOn} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <MiniStat label="Tenants Assigned" value={staff.tenantsAssigned} />
        <MiniStat label="Open Tickets" value={staff.openTickets} />
      </div>

      <Section title="Recent Actions">
        <Card padding={0} style={{ overflow: "hidden" }}>
          {actions.length === 0
            ? <div style={{ fontSize: 12, color: T.txD, padding: 20, textAlign: "center" }}>No recent actions</div>
            : actions.map((a, i) => (
              <div key={a.id} style={{
                padding: "12px 16px",
                borderBottom: i === actions.length - 1 ? "none" : `1px solid ${T.border}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 11, color: T.emerald, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{a.action}</span>
                  <span style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace" }}>{a.ts}</span>
                </div>
                <div style={{ fontSize: 12, color: T.txM, marginTop: 4 }}>{a.detail}</div>
              </div>
            ))}
        </Card>
      </Section>
    </Drawer>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: 12, background: T.surface2, borderRadius: 10, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 9, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginTop: 4 }}>{value}</div>
    </div>
  )
}
