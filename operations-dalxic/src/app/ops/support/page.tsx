"use client"
/* ═══════════════════════════════════════════════════════════════
   /ops/support — Ticket queue + SLA tracking
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import {
  Card, Stat, Pill, Button, DataTable, Drawer, Field, Select, SearchBar,
  Tabs, Section, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_TICKETS, MockTicket, TicketPriority, TicketStatus } from "@/lib/ops/mock"

type View = "all" | "open" | "pending" | "resolved" | "closed"

const PRIORITY_TONE: Record<TicketPriority, Tone> = {
  urgent: "red", high: "amber", normal: "sky", low: "neutral",
}
const STATUS_TONE: Record<TicketStatus, Tone> = {
  open: "amber", pending: "sky", resolved: "emerald", closed: "neutral",
}

export default function OpsSupportPage() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [priority, setPriority] = useState("All")
  const [category, setCategory] = useState("All")
  const [active, setActive] = useState<MockTicket | null>(null)

  const categories = useMemo(() => ["All", ...new Set(MOCK_TICKETS.map(t => t.category))], [])

  const filtered = useMemo(() => MOCK_TICKETS.filter(t => {
    if (view !== "all" && t.status !== view) return false
    if (priority !== "All" && t.priority !== priority.toLowerCase()) return false
    if (category !== "All" && t.category !== category) return false
    if (!query) return true
    const q = query.toLowerCase()
    return t.id.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.tenantName.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q)
  }), [view, query, priority, category])

  const totals = {
    total: MOCK_TICKETS.length,
    open: MOCK_TICKETS.filter(t => t.status === "open").length,
    urgent: MOCK_TICKETS.filter(t => t.priority === "urgent" && t.status !== "resolved" && t.status !== "closed").length,
    slaBreach: MOCK_TICKETS.filter(t => t.slaMins > 0 && t.slaMins < 60).length,
  }

  const cols: Column<MockTicket>[] = [
    { key: "id", label: "Ticket", width: 100, render: (t) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 800, color: T.emerald }}>{t.id}</span>
    )},
    { key: "subject", label: "Subject", render: (t) => (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{t.subject}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{t.tenantName} · {t.messages} msgs</div>
      </div>
    )},
    { key: "category", label: "Category", width: 130, render: (t) => <span style={{ fontSize: 12, color: T.txM }}>{t.category}</span> },
    { key: "priority", label: "Priority", width: 110, render: (t) => <Pill tone={PRIORITY_TONE[t.priority]} dot>{t.priority}</Pill> },
    { key: "assignee", label: "Assignee", width: 110, render: (t) => <span style={{ fontSize: 12, fontWeight: 700, color: T.tx }}>{t.assignee}</span> },
    { key: "sla", label: "SLA", width: 110, render: (t) => {
      if (t.status === "resolved" || t.status === "closed") return <span style={{ fontSize: 11, color: T.emerald, fontFamily: "'DM Mono', monospace" }}>met</span>
      const color = t.slaMins < 30 ? T.red : t.slaMins < 120 ? T.amber : T.emerald
      return <span style={{ fontSize: 11, color, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{t.slaMins}m left</span>
    }},
    { key: "status", label: "Status", width: 110, render: (t) => <Pill tone={STATUS_TONE[t.status]} dot>{t.status}</Pill> },
  ]

  return (
    <>
      <OpsPage
        title="Support"
        subtitle="Every tenant question, every open ticket. SLA clock is running."
        icon="support"
        action={<Button icon="plus">New Ticket</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Tickets" value={totals.total}  accent="emerald" icon="support" />
          <Stat label="Open"           value={totals.open}   accent="amber"   icon="bolt" />
          <Stat label="Urgent"         value={totals.urgent} accent="amber"   icon="lock" />
          <Stat label="SLA < 1h"       value={totals.slaBreach} accent="amber" icon="shifts" />
        </div>

        <Section
          title="Ticket Queue"
          action={<div style={{ width: 320 }}><SearchBar value={query} onChange={setQuery} placeholder="Ticket, subject, tenant, assignee…" /></div>}
        >
          <Tabs<View>
            value={view} onChange={setView} accent="emerald"
            tabs={[
              { key: "all",      label: "All",      count: MOCK_TICKETS.length },
              { key: "open",     label: "Open",     count: MOCK_TICKETS.filter(t => t.status === "open").length },
              { key: "pending",  label: "Pending",  count: MOCK_TICKETS.filter(t => t.status === "pending").length },
              { key: "resolved", label: "Resolved", count: MOCK_TICKETS.filter(t => t.status === "resolved").length },
              { key: "closed",   label: "Closed",   count: MOCK_TICKETS.filter(t => t.status === "closed").length },
            ]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Field label="Priority">
              <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option>All</option><option>Urgent</option><option>High</option><option>Normal</option><option>Low</option>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
          </div>

          <DataTable rows={filtered} columns={cols} onRowClick={(t) => setActive(t)} />
        </Section>
      </OpsPage>

      <TicketDrawer ticket={active} onClose={() => setActive(null)} />
    </>
  )
}

function TicketDrawer({ ticket, onClose }: { ticket: MockTicket | null; onClose: () => void }) {
  if (!ticket) return <Drawer open={false} onClose={onClose} title="Ticket">{null}</Drawer>

  return (
    <Drawer
      open={!!ticket} onClose={onClose}
      title={ticket.id}
      subtitle={ticket.tenantName}
      width={560}
      footer={
        <>
          <Button variant="ghost" icon="user">Reassign</Button>
          <Button variant="outline" icon="mail">Reply</Button>
          {ticket.status !== "resolved" && <Button icon="check">Mark Resolved</Button>}
        </>
      }
    >
      <Card padding={20} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Pill tone={PRIORITY_TONE[ticket.priority]} dot>{ticket.priority}</Pill>
          <Pill tone={STATUS_TONE[ticket.status]}>{ticket.status}</Pill>
          <Pill tone="neutral">{ticket.category}</Pill>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em", lineHeight: 1.3 }}>
          {ticket.subject}
        </div>
        <div style={{ fontSize: 12, color: T.txM, marginTop: 10 }}>
          Opened {ticket.openedOn} · assigned to {ticket.assignee} · {ticket.messages} messages
        </div>
      </Card>

      <Section title="Last Message">
        <Card padding={20}>
          <div style={{ fontSize: 13, color: T.tx, lineHeight: 1.6 }}>{ticket.lastMessage}</div>
        </Card>
      </Section>

      <Section title="Timeline">
        <Card padding={14}>
          <Timeline tone="emerald" title="Ticket opened" sub={ticket.openedOn} />
          <Timeline tone="sky" title={`Assigned to ${ticket.assignee}`} sub="Auto-routed by category" />
          <Timeline tone="amber" title={`${ticket.messages - 1} replies exchanged`} sub="Most recent reply above" />
          {ticket.status === "resolved" && <Timeline tone="emerald" title="Resolved" sub="Customer confirmed" last />}
          {ticket.status !== "resolved" && <Timeline tone="neutral" title="Awaiting next step" sub={ticket.slaMins > 0 ? `SLA: ${ticket.slaMins} minutes remaining` : "No SLA"} last />}
        </Card>
      </Section>
    </Drawer>
  )
}

function Timeline({ tone, title, sub, last = false }: { tone: Tone; title: string; sub: string; last?: boolean }) {
  const c = tone === "amber" ? T.amber : tone === "sky" ? T.sky : tone === "red" ? T.red : tone === "neutral" ? T.txM : T.emerald
  return (
    <div style={{ display: "flex", gap: 12, padding: "8px 0", position: "relative" }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: c, marginTop: 6, flexShrink: 0 }} />
      {!last && <div style={{ position: "absolute", left: 4, top: 20, bottom: -4, width: 2, background: T.border }} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{title}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  )
}
