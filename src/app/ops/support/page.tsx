"use client"
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Stat, Card, Pill, Tabs, DataTable, Column, Drawer, SearchBar, Button, T, Tone } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { relativeDays } from "@/lib/ops/format"
import { MOCK_TICKETS, MockTicket, TicketStatus, TicketPriority } from "@/lib/ops/mock"

const STATUS_TONE: Record<string, Tone> = { open: "sky", pending: "amber", resolved: "emerald", closed: "neutral" }
const PRIORITY_TONE: Record<string, Tone> = { low: "neutral", normal: "sky", high: "amber", urgent: "red" }

type TabKey = "all" | "open" | "pending" | "resolved" | "closed"

function slaColor(mins: number): string {
  if (mins === 0) return T.txD
  if (mins <= 60) return T.red
  if (mins <= 180) return T.amber
  return T.emerald
}

function slaDisplay(mins: number): string {
  if (mins === 0) return "---"
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function SupportPage() {
  const [tab, setTab] = useState<TabKey>("all")
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selected, setSelected] = useState<MockTicket | null>(null)

  const all = MOCK_TICKETS
  const open = all.filter(t => t.status === "open")
  const pending = all.filter(t => t.status === "pending")
  const resolved = all.filter(t => t.status === "resolved")
  const closed = all.filter(t => t.status === "closed")
  const urgent = all.filter(t => (t.priority === "urgent" || t.priority === "high") && (t.status === "open" || t.status === "pending"))
  const slaBreach = all.filter(t => t.slaMins > 0 && t.slaMins <= 60 && t.status !== "resolved" && t.status !== "closed")

  const categories = useMemo(() => [...new Set(all.map(t => t.category))].sort(), [])

  const filtered = useMemo(() => {
    let rows = all
    if (tab !== "all") rows = rows.filter(t => t.status === tab)
    if (priorityFilter !== "all") rows = rows.filter(t => t.priority === priorityFilter)
    if (categoryFilter !== "all") rows = rows.filter(t => t.category === categoryFilter)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(t => t.subject.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.tenantName.toLowerCase().includes(q))
    }
    return rows
  }, [tab, search, priorityFilter, categoryFilter])

  const columns: Column<MockTicket>[] = [
    { key: "id", label: "ID", width: 90, render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.emerald }}>{r.id}</span> },
    { key: "subject", label: "Subject", render: r => (
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.subject}</div>
        <div style={{ fontSize: 11, color: T.txM }}>{r.tenantName}</div>
      </div>
    )},
    { key: "category", label: "Category", width: 100, render: r => <span style={{ fontSize: 12, color: T.txM }}>{r.category}</span> },
    { key: "priority", label: "Priority", width: 90, render: r => <Pill tone={PRIORITY_TONE[r.priority]}>{r.priority}</Pill> },
    { key: "assignee", label: "Assignee", width: 90, render: r => <span style={{ fontSize: 12, color: T.tx }}>{r.assignee}</span> },
    { key: "sla", label: "SLA", width: 80, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: slaColor(r.slaMins), fontWeight: 600 }}>{slaDisplay(r.slaMins)}</span> },
    { key: "status", label: "Status", width: 100, render: r => <Pill tone={STATUS_TONE[r.status]} dot>{r.status}</Pill> },
  ]

  const s = selected

  return (
    <OpsPage title="Ticket Queue" subtitle="Support tickets across all tenants. Triage, assign, resolve." icon="support">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <Stat label="Total Tickets" value={all.length} icon="support" />
        <Stat label="Open" value={open.length} icon="flag" accent="sky" />
        <Stat label="Urgent / High" value={urgent.length} icon="alert" accent="amber" />
        <Stat label="SLA Breach" value={slaBreach.length} icon="clock" accent={slaBreach.length > 0 ? "amber" : "emerald"} />
      </div>

      <Tabs
        tabs={[
          { key: "all" as TabKey, label: "All", count: all.length },
          { key: "open" as TabKey, label: "Open", count: open.length },
          { key: "pending" as TabKey, label: "Pending", count: pending.length },
          { key: "resolved" as TabKey, label: "Resolved", count: resolved.length },
          { key: "closed" as TabKey, label: "Closed", count: closed.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}><SearchBar value={search} onChange={setSearch} placeholder="Search tickets..." /></div>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ padding: "10px 14px", borderRadius: 10, fontSize: 12, background: "rgba(255,255,255,0.03)", border: `1px solid rgba(16,185,129,0.18)`, color: T.tx, outline: "none", fontFamily: "'DM Sans', sans-serif", minWidth: 120 }}>
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: "10px 14px", borderRadius: 10, fontSize: 12, background: "rgba(255,255,255,0.03)", border: `1px solid rgba(16,185,129,0.18)`, color: T.tx, outline: "none", fontFamily: "'DM Sans', sans-serif", minWidth: 130 }}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <DataTable rows={filtered} columns={columns} onRowClick={r => setSelected(r)} empty="No tickets match your filters." />

      <Drawer
        open={!!s}
        onClose={() => setSelected(null)}
        title={s?.id ?? ""}
        subtitle={s?.tenantName}
        width={560}
        footer={
          <>
            <Button variant="ghost" icon="user" onClick={() => setSelected(null)}>Reassign</Button>
            <Button variant="outline" icon="mail" onClick={() => setSelected(null)}>Reply</Button>
            {(s?.status === "open" || s?.status === "pending") && <Button variant="primary" icon="check" onClick={() => setSelected(null)}>Resolve</Button>}
          </>
        }
      >
        {s && (
          <>
            {/* Header pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <Pill tone={STATUS_TONE[s.status]} dot>{s.status}</Pill>
              <Pill tone={PRIORITY_TONE[s.priority]}>{s.priority}</Pill>
              <Pill tone="neutral">{s.category}</Pill>
            </div>

            {/* Subject */}
            <div style={{ fontSize: 18, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 8, lineHeight: 1.3 }}>{s.subject}</div>
            <div style={{ fontSize: 12, color: T.txM, marginBottom: 24 }}>Opened {relativeDays(s.openedOn)} &middot; {s.messages} messages &middot; Assigned to {s.assignee}</div>

            {/* Last message */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Last Message</div>
              <Card style={{ padding: 16 }}>
                <div style={{ fontSize: 13, color: T.tx, lineHeight: 1.5 }}>{s.lastMessage}</div>
              </Card>
            </div>

            {/* Timeline */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Timeline</div>
              {[
                { time: s.openedOn, action: "Ticket created", actor: s.tenantName, icon: "plus" as const },
                { time: s.openedOn, action: `Assigned to ${s.assignee}`, actor: "System", icon: "user" as const },
                ...(s.status === "resolved" || s.status === "closed" ? [{ time: s.openedOn, action: `Ticket ${s.status}`, actor: s.assignee, icon: "check" as const }] : []),
              ].map((ev, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${T.emerald}10`, display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald, flexShrink: 0 }}>
                    <Icon name={ev.icon} size={12} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: T.tx, fontWeight: 600 }}>{ev.action}</div>
                    <div style={{ fontSize: 11, color: T.txD }}>{ev.actor} &middot; {relativeDays(ev.time)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* SLA info */}
            {s.slaMins > 0 && (
              <Card style={{ background: s.slaMins <= 60 ? `${T.red}08` : s.slaMins <= 180 ? `${T.amber}08` : `${T.emerald}08`, border: `1px solid ${slaColor(s.slaMins)}22`, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${slaColor(s.slaMins)}15`, display: "flex", alignItems: "center", justifyContent: "center", color: slaColor(s.slaMins), flexShrink: 0 }}>
                    <Icon name="clock" size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>SLA: {slaDisplay(s.slaMins)} remaining</div>
                    <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>
                      {s.slaMins <= 60 ? "At risk of breach. Prioritize immediately." : s.slaMins <= 180 ? "Approaching SLA limit. Monitor closely." : "Within SLA. On track."}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </Drawer>
    </OpsPage>
  )
}
