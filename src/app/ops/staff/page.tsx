"use client"
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Stat, Card, Pill, Tabs, DataTable, Column, Drawer, SearchBar, Button, T, Tone } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { dateShort, relativeDays } from "@/lib/ops/format"
import { MOCK_STAFF, MockStaff, MOCK_PLATFORM_AUDIT } from "@/lib/ops/mock"

const STATUS_TONE: Record<string, Tone> = { online: "emerald", away: "amber", offline: "neutral" }
const ROLE_TONE: Record<string, Tone> = { founder: "emerald", account_manager: "sky", support_l1: "neutral", support_l2: "amber", billing: "copper", analyst: "sky", engineer: "emerald" }
const ROLE_LABEL: Record<string, string> = { founder: "Founder", account_manager: "Account Mgr", support_l1: "Support L1", support_l2: "Support L2", billing: "Billing", analyst: "Analyst", engineer: "Engineer" }

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #10B981, #059669)",
  "linear-gradient(135deg, #0EA5E9, #0284C7)",
  "linear-gradient(135deg, #F59E0B, #D97706)",
  "linear-gradient(135deg, #8B5CF6, #7C3AED)",
  "linear-gradient(135deg, #EF4444, #DC2626)",
  "linear-gradient(135deg, #EC4899, #DB2777)",
  "linear-gradient(135deg, #14B8A6, #0D9488)",
  "linear-gradient(135deg, #F97316, #EA580C)",
]

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

type TabKey = "all" | "online" | "away" | "offline"

export default function StaffPage() {
  const [tab, setTab] = useState<TabKey>("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<MockStaff | null>(null)

  const all = MOCK_STAFF
  const online = all.filter(s => s.status === "online")
  const away = all.filter(s => s.status === "away")
  const offline = all.filter(s => s.status === "offline")
  const totalOpenTickets = all.reduce((s, m) => s + m.openTickets, 0)
  const totalTenants = all.reduce((s, m) => s + m.tenantsAssigned, 0)

  const filtered = useMemo(() => {
    let rows = all
    if (tab !== "all") rows = rows.filter(s => s.status === tab)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.role.toLowerCase().includes(q))
    }
    return rows
  }, [tab, search])

  const columns: Column<MockStaff>[] = [
    { key: "name", label: "Member", render: (r: MockStaff) => {
      const idx = all.indexOf(r)
      const statusColor = r.status === "online" ? T.emerald : r.status === "away" ? T.amber : T.txD
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", fontFamily: "'DM Mono', monospace" }}>
              {initials(r.name)}
            </div>
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: statusColor, border: `2px solid ${T.surface}` }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
            <div style={{ fontSize: 11, color: T.txM }}>{r.email}</div>
          </div>
        </div>
      )
    }},
    { key: "role", label: "Role", width: 120, render: r => <Pill tone={ROLE_TONE[r.role]}>{ROLE_LABEL[r.role] ?? r.role}</Pill> },
    { key: "region", label: "Region", width: 120, render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.region}</span> },
    { key: "tenants", label: "Tenants", width: 80, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.tenantsAssigned || "---"}</span> },
    { key: "tickets", label: "Tickets", width: 80, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: r.openTickets > 3 ? T.amber : T.tx }}>{r.openTickets}</span> },
    { key: "lastActive", label: "Last Active", width: 130, render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.lastActive}</span> },
    { key: "status", label: "Status", width: 90, render: r => <Pill tone={STATUS_TONE[r.status]} dot>{r.status}</Pill> },
  ]

  const s = selected
  const sIdx = s ? all.indexOf(s) : 0

  // Get recent actions for selected staff
  const staffActions = useMemo(() => {
    if (!s) return []
    return MOCK_PLATFORM_AUDIT.filter(a => a.actor === s.name).slice(0, 5)
  }, [s])

  return (
    <OpsPage title="Internal Team" subtitle="DalxicOps staff. Roles, workloads, activity." icon="staff">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <Stat label="Total Staff" value={all.length} icon="staff" />
        <Stat label="Online" value={online.length} icon="check" accent="emerald" />
        <Stat label="Open Tickets" value={totalOpenTickets} icon="support" accent="sky" />
        <Stat label="Tenants Covered" value={totalTenants} icon="tenants" accent="amber" />
      </div>

      <Tabs
        tabs={[
          { key: "all" as TabKey, label: "All", count: all.length },
          { key: "online" as TabKey, label: "Online", count: online.length },
          { key: "away" as TabKey, label: "Away", count: away.length },
          { key: "offline" as TabKey, label: "Offline", count: offline.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div style={{ marginBottom: 20 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search staff..." />
      </div>

      <DataTable rows={filtered} columns={columns} onRowClick={r => setSelected(r)} empty="No staff match your filters." />

      <Drawer
        open={!!s}
        onClose={() => setSelected(null)}
        title={s?.name ?? ""}
        subtitle={s?.email}
        width={520}
        footer={
          <>
            <Button variant="ghost" icon="mail" onClick={() => setSelected(null)}>Message</Button>
            <Button variant="outline" icon="edit" onClick={() => setSelected(null)}>Edit Role</Button>
            <Button variant="primary" icon="user" onClick={() => setSelected(null)}>Assign Tenants</Button>
          </>
        }
      >
        {s && (
          <>
            {/* Avatar + status */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: AVATAR_GRADIENTS[sIdx % AVATAR_GRADIENTS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'DM Mono', monospace" }}>
                  {initials(s.name)}
                </div>
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderRadius: "50%", background: s.status === "online" ? T.emerald : s.status === "away" ? T.amber : T.txD, border: `3px solid ${T.surface}` }} />
              </div>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Pill tone={ROLE_TONE[s.role]}>{ROLE_LABEL[s.role] ?? s.role}</Pill>
                  <Pill tone={STATUS_TONE[s.status]} dot>{s.status}</Pill>
                </div>
                <div style={{ fontSize: 12, color: T.txM, marginTop: 6 }}>Last active: {s.lastActive}</div>
              </div>
            </div>

            {/* Mini stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 28 }}>
              {[
                { label: "Tenants", value: s.tenantsAssigned },
                { label: "Tickets", value: s.openTickets },
                { label: "Region", value: s.region === "All" ? "All" : s.region.slice(0, 3) },
                { label: "Joined", value: dateShort(s.joinedOn).slice(0, 6) },
                { label: "Status", value: s.status },
              ].map(ms => (
                <div key={ms.label} style={{ padding: 10, borderRadius: 10, background: `${T.emerald}06`, border: `1px solid ${T.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>{ms.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{ms.value}</div>
                </div>
              ))}
            </div>

            {/* Details */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Details</div>
              {[
                { label: "Full Name", value: s.name },
                { label: "Email", value: s.email },
                { label: "Role", value: ROLE_LABEL[s.role] ?? s.role },
                { label: "Region", value: s.region },
                { label: "Joined", value: dateShort(s.joinedOn) },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.txM }}>{row.label}</span>
                  <span style={{ fontSize: 12, color: T.tx, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Recent actions */}
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Recent Actions</div>
              {staffActions.length > 0 ? staffActions.map((a, i) => (
                <div key={a.id} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: a.severity === "critical" ? `${T.red}12` : a.severity === "warn" ? `${T.amber}12` : `${T.emerald}12`, display: "flex", alignItems: "center", justifyContent: "center", color: a.severity === "critical" ? T.red : a.severity === "warn" ? T.amber : T.emerald, flexShrink: 0 }}>
                    <Icon name="audit" size={12} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.tx }}>{a.action.replace("_", " ")}</div>
                    <div style={{ fontSize: 11, color: T.txD }}>{a.detail}</div>
                    <div style={{ fontSize: 10, color: T.txD, marginTop: 2 }}>{relativeDays(a.ts)}</div>
                  </div>
                </div>
              )) : (
                <div style={{ fontSize: 12, color: T.txD }}>No recent audit actions recorded.</div>
              )}
            </div>
          </>
        )}
      </Drawer>
    </OpsPage>
  )
}
