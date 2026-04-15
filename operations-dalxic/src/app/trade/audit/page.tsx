"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/audit — Immutable audit log viewer
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Select,
  SearchBar, Tabs, Section, Empty, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"
import { MOCK_AUDIT, MockAuditEvent, AuditAction, AuditSeverity } from "@/lib/ops/mock"

type View = "all" | "info" | "warn" | "critical"

const SEVERITY_TONE: Record<AuditSeverity, Tone> = {
  info: "neutral", warn: "amber", critical: "red",
}

const ACTION_ICON: Record<AuditAction, IconName> = {
  login: "lock", logout: "logout", void: "close", refund: "returns",
  discount: "loyalty", price_override: "edit", edit: "edit", delete: "trash",
  create: "plus", approve: "check", post: "journals", import: "download",
  export: "share", settings: "settings",
}

const ACTION_TONE: Record<AuditAction, Tone> = {
  login: "neutral", logout: "neutral", void: "amber", refund: "amber",
  discount: "amber", price_override: "amber", edit: "sky", delete: "red",
  create: "emerald", approve: "emerald", post: "neutral", import: "sky",
  export: "neutral", settings: "amber",
}

export default function AuditPage() {
  return <Shell><AuditView /></Shell>
}

function AuditView() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [actor, setActor] = useState<string>("All")
  const [module, setModule] = useState<string>("All")
  const [active, setActive] = useState<MockAuditEvent | null>(null)

  const actors = useMemo(() => ["All", ...new Set(MOCK_AUDIT.map(e => e.actor))], [])
  const modules = useMemo(() => ["All", ...new Set(MOCK_AUDIT.map(e => e.module))], [])

  const filtered = useMemo(() => {
    return MOCK_AUDIT.filter(e => {
      if (view !== "all" && e.severity !== view) return false
      if (actor !== "All" && e.actor !== actor) return false
      if (module !== "All" && e.module !== module) return false
      if (!query) return true
      const q = query.toLowerCase()
      return (
        e.id.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q) ||
        e.detail.toLowerCase().includes(q) ||
        e.module.toLowerCase().includes(q)
      )
    })
  }, [view, query, actor, module])

  const totals = useMemo(() => ({
    total: MOCK_AUDIT.length,
    today: MOCK_AUDIT.filter(e => e.date === "2026-04-15").length,
    critical: MOCK_AUDIT.filter(e => e.severity === "critical").length,
    actors: new Set(MOCK_AUDIT.map(e => e.actor)).size,
  }), [])

  const cols: Column<MockAuditEvent>[] = [
    { key: "id", label: "ID", width: 90, render: (e) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, color: T.amber, letterSpacing: "0.06em", fontSize: 11 }}>{e.id}</span>
    )},
    { key: "ts", label: "Timestamp", width: 160, render: (e) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.txM }}>{e.ts}</span>
    )},
    { key: "actor", label: "Actor", render: (e) => (
      <div>
        <div style={{ fontWeight: 600, color: T.tx, fontSize: 13 }}>{e.actor}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{e.role}</div>
      </div>
    )},
    { key: "action", label: "Action", width: 140, render: (e) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name={ACTION_ICON[e.action]} size={14} color={
          ACTION_TONE[e.action] === "amber" ? T.amber :
          ACTION_TONE[e.action] === "red" ? T.red :
          ACTION_TONE[e.action] === "emerald" ? T.emerald :
          ACTION_TONE[e.action] === "sky" ? T.sky : T.txM
        } />
        <span style={{ fontSize: 12, fontWeight: 600, color: T.tx }}>{e.action.replace("_", " ")}</span>
      </div>
    )},
    { key: "module", label: "Module", width: 140, render: (e) => (
      <span style={{ fontSize: 12, color: T.txM }}>{e.module}</span>
    )},
    { key: "target", label: "Target", width: 160, render: (e) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.tx, fontWeight: 700 }}>{e.target}</span>
    )},
    { key: "severity", label: "Sev", width: 110, render: (e) => <Pill tone={SEVERITY_TONE[e.severity]} dot>{e.severity}</Pill> },
  ]

  return (
    <>
      <Page
        title="Audit Log"
        subtitle="Every action, by every operator, on every record. Immutable. Searchable. Exportable."
        accent="amber"
        action={<Button icon="download">Export CSV</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Events"     value={totals.total}     accent="amber"   icon="audit" />
          <Stat label="Today"             value={totals.today}     accent="emerald" icon="calendar" />
          <Stat label="Critical"          value={totals.critical}  accent="amber"   icon="lock" />
          <Stat label="Distinct Actors"   value={totals.actors}    accent="sky"     icon="customers" />
        </div>

        <Section
          title="Event Stream"
          sub="Filter by severity, actor, or module. Tap any row to see the full payload."
          action={
            <div style={{ width: 320 }}>
              <SearchBar value={query} onChange={setQuery} placeholder="ID, actor, target, detail…" />
            </div>
          }
        >
          <Tabs<View>
            value={view}
            onChange={setView}
            accent="amber"
            tabs={[
              { key: "all",      label: "All",      count: MOCK_AUDIT.length },
              { key: "info",     label: "Info",     count: MOCK_AUDIT.filter(e => e.severity === "info").length },
              { key: "warn",     label: "Warning",  count: MOCK_AUDIT.filter(e => e.severity === "warn").length },
              { key: "critical", label: "Critical", count: MOCK_AUDIT.filter(e => e.severity === "critical").length },
            ]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Field label="Actor">
              <Select value={actor} onChange={(e) => setActor(e.target.value)}>
                {actors.map(a => <option key={a}>{a}</option>)}
              </Select>
            </Field>
            <Field label="Module">
              <Select value={module} onChange={(e) => setModule(e.target.value)}>
                {modules.map(m => <option key={m}>{m}</option>)}
              </Select>
            </Field>
          </div>

          {filtered.length === 0
            ? <Empty icon="audit" title="No events match" />
            : <DataTable rows={filtered} columns={cols} onRowClick={(e) => setActive(e)} />}
        </Section>
      </Page>

      <EventDrawer event={active} onClose={() => setActive(null)} />
    </>
  )
}

function EventDrawer({ event, onClose }: { event: MockAuditEvent | null; onClose: () => void }) {
  if (!event) return <Drawer open={false} onClose={onClose} title="Event">{null}</Drawer>
  const sevColor = event.severity === "critical" ? T.red : event.severity === "warn" ? T.amber : T.txM
  return (
    <Drawer
      open={!!event} onClose={onClose}
      title={event.id}
      subtitle={event.module}
      width={520}
      footer={
        <>
          <Button variant="ghost" icon="share">Share Link</Button>
          <Button variant="outline" icon="download">Export JSON</Button>
        </>
      }
    >
      <Card padding={20} style={{ marginBottom: 20, borderColor: `${sevColor}40` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Pill tone={SEVERITY_TONE[event.severity]} dot>{event.severity}</Pill>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              {event.action.replace("_", " ").toUpperCase()} · {event.target}
            </div>
            <div style={{ fontSize: 13, color: T.txM, marginTop: 6, lineHeight: 1.5 }}>{event.detail}</div>
          </div>
          <Icon name={ACTION_ICON[event.action]} size={28} color={sevColor} />
        </div>
      </Card>

      <Section title="Who & When">
        <Card padding={20}>
          <RowKV label="Actor" value={event.actor} />
          <RowKV label="Role" value={event.role} />
          <RowKV label="Branch" value={event.branch} />
          <RowKV label="Timestamp" value={event.ts} mono />
          <RowKV label="IP address" value={event.ip ?? "—"} mono last />
        </Card>
      </Section>

      <Section title="Payload">
        <Card padding={20}>
          <RowKV label="Event ID" value={event.id} mono />
          <RowKV label="Module" value={event.module} />
          <RowKV label="Action" value={event.action} mono />
          <RowKV label="Target" value={event.target} mono />
          <RowKV label="Severity" value={event.severity} last />
        </Card>
      </Section>

      <Card padding={16} style={{ marginTop: 20, background: `${T.amber}0A`, border: `1px dashed ${T.amber}40` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="lock" size={16} color={T.amber} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.amber, fontFamily: "'DM Mono', monospace" }}>Immutable</div>
        </div>
        <div style={{ fontSize: 12, color: T.txM, marginTop: 8, lineHeight: 1.5 }}>
          Audit events cannot be edited or deleted — even by an Owner. Compliance, court evidence, and SSNIT/GRA queries rely on this guarantee.
        </div>
      </Card>
    </Drawer>
  )
}

function RowKV({ label, value, mono = false, last = false }: { label: string; value: React.ReactNode; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.txM }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.tx, fontFamily: mono ? "'DM Mono', monospace" : "'Space Grotesk', sans-serif" }}>{value}</span>
    </div>
  )
}
