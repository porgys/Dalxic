"use client"
/* ═══════════════════════════════════════════════════════════════
   /ops/audit — Platform-wide immutable action log
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import {
  Card, Stat, Pill, Button, Drawer, SearchBar, Field, Select,
  Tabs, Section, T, Tone,
} from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"
import { MOCK_PLATFORM_AUDIT, MockPlatformAudit } from "@/lib/ops/mock"

type View = "all" | "info" | "warn" | "critical"

const SEVERITY_TONE: Record<MockPlatformAudit["severity"], Tone> = {
  info: "sky", warn: "amber", critical: "red",
}

const ACTION_ICON: Record<string, IconName> = {
  invoice_send:    "mail",
  invoice_void:    "lock",
  tenant_login_as: "user",
  tenant_suspend:  "lock",
  tenant_upgrade:  "trending",
  tenant_refund:   "billing",
  tier_modify:     "tiers",
  addon_publish:   "addons",
  release_promote: "releases",
  ticket_assign:   "support",
  flag_toggle:     "flag",
  export:          "download",
}

export default function OpsAuditPage() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [actor, setActor] = useState("All")
  const [active, setActive] = useState<MockPlatformAudit | null>(null)

  const actors = useMemo(() => ["All", ...new Set(MOCK_PLATFORM_AUDIT.map(a => a.actor))], [])

  const filtered = useMemo(() => MOCK_PLATFORM_AUDIT.filter(a => {
    if (view !== "all" && a.severity !== view) return false
    if (actor !== "All" && a.actor !== actor) return false
    if (!query) return true
    const q = query.toLowerCase()
    return a.id.toLowerCase().includes(q)
        || a.action.toLowerCase().includes(q)
        || a.target.toLowerCase().includes(q)
        || a.detail.toLowerCase().includes(q)
        || a.actor.toLowerCase().includes(q)
  }), [view, query, actor])

  const totals = {
    total:    MOCK_PLATFORM_AUDIT.length,
    critical: MOCK_PLATFORM_AUDIT.filter(a => a.severity === "critical").length,
    warn:     MOCK_PLATFORM_AUDIT.filter(a => a.severity === "warn").length,
    unique:   new Set(MOCK_PLATFORM_AUDIT.map(a => a.actor)).size,
  }

  return (
    <>
      <OpsPage
        title="Platform Audit"
        subtitle="Every action taken by Dalxic staff — on every tenant. Immutable, timestamped, exportable."
        icon="shield"
        action={<Button icon="download">Export CSV</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Events"     value={totals.total}    accent="emerald" icon="shield" sub="Last 7 days" />
          <Stat label="Critical"         value={totals.critical} accent="amber"   icon="bolt" sub="Policy-reviewed actions" />
          <Stat label="Warnings"         value={totals.warn}     accent="amber"   icon="lock" />
          <Stat label="Staff Active"     value={totals.unique}   accent="emerald" icon="staff" sub="Unique actors" />
        </div>

        <Card padding={16} style={{ marginBottom: 28, background: `${T.emerald}0A`, border: `1px dashed ${T.emerald}40` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Icon name="shield" size={16} color={T.emerald} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.emerald, fontFamily: "'DM Mono', monospace" }}>
              Immutable Log
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.txM, marginTop: 4, lineHeight: 1.5 }}>
            Every row is append-only. Even founders cannot edit or delete entries. Exports are signed and include a SHA-256 chain hash per event.
          </div>
        </Card>

        <Section
          title="Activity Stream"
          action={<div style={{ width: 320 }}><SearchBar value={query} onChange={setQuery} placeholder="Actor, action, target, detail…" /></div>}
        >
          <Tabs<View>
            value={view} onChange={setView} accent="emerald"
            tabs={[
              { key: "all",      label: "All",      count: MOCK_PLATFORM_AUDIT.length },
              { key: "critical", label: "Critical", count: MOCK_PLATFORM_AUDIT.filter(a => a.severity === "critical").length },
              { key: "warn",     label: "Warn",     count: MOCK_PLATFORM_AUDIT.filter(a => a.severity === "warn").length },
              { key: "info",     label: "Info",     count: MOCK_PLATFORM_AUDIT.filter(a => a.severity === "info").length },
            ]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginBottom: 14, maxWidth: 320 }}>
            <Field label="Filter by Actor">
              <Select value={actor} onChange={(e) => setActor(e.target.value)}>
                {actors.map(a => <option key={a}>{a}</option>)}
              </Select>
            </Field>
          </div>

          <Card padding={0} style={{ overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: T.txD }}>No events match your filters</div>
              </div>
            ) : filtered.map((a, i) => (
              <AuditRow
                key={a.id}
                event={a}
                last={i === filtered.length - 1}
                onClick={() => setActive(a)}
              />
            ))}
          </Card>
        </Section>
      </OpsPage>

      <AuditDrawer event={active} onClose={() => setActive(null)} />
    </>
  )
}

function AuditRow({ event, last, onClick }: { event: MockPlatformAudit; last: boolean; onClick: () => void }) {
  const c = event.severity === "critical" ? T.red : event.severity === "warn" ? T.amber : T.sky
  const icon = ACTION_ICON[event.action] ?? "sparkle"
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", gap: 14, alignItems: "flex-start",
        padding: "16px 20px",
        borderBottom: last ? "none" : `1px solid ${T.border}`,
        cursor: "pointer", transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = T.surface2 }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: `${c}15`, color: c,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{event.actor}</span>
            <span style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {event.actorRole}
            </span>
          </div>
          <span style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace" }}>{event.ts}</span>
        </div>
        <div style={{ fontSize: 12, color: T.txM, lineHeight: 1.5 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", color: c, fontWeight: 700 }}>{event.action}</span>
          {" → "}
          <span style={{ fontFamily: "'DM Mono', monospace", color: T.tx, fontWeight: 700 }}>{event.target}</span>
          {" · "}{event.detail}
        </div>
      </div>
      <Pill tone={SEVERITY_TONE[event.severity]} dot>{event.severity}</Pill>
    </div>
  )
}

function AuditDrawer({ event, onClose }: { event: MockPlatformAudit | null; onClose: () => void }) {
  if (!event) return <Drawer open={false} onClose={onClose} title="Event">{null}</Drawer>

  return (
    <Drawer
      open={!!event} onClose={onClose}
      title={event.id}
      subtitle={event.action}
      width={520}
      footer={
        <>
          <Button variant="ghost" icon="share">Copy ID</Button>
          <Button variant="outline" icon="download">Export Row</Button>
        </>
      }
    >
      <Card padding={20} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Pill tone={SEVERITY_TONE[event.severity]} dot>{event.severity}</Pill>
          <Pill tone="neutral">{event.actorRole}</Pill>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.4 }}>
          {event.detail}
        </div>
        <div style={{ fontSize: 11, color: T.txD, marginTop: 12, fontFamily: "'DM Mono', monospace" }}>{event.ts}</div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <MiniStat label="Actor" value={event.actor} />
        <MiniStat label="Role" value={event.actorRole} />
        <MiniStat label="Action" value={event.action} mono />
        <MiniStat label="Target" value={event.target} mono />
        {event.tenantId && <MiniStat label="Tenant" value={event.tenantId} mono />}
        <MiniStat label="IP" value={event.ip} mono />
      </div>

      <Section title="Integrity">
        <Card padding={16}>
          <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700, marginBottom: 8 }}>
            Chain hash (SHA-256)
          </div>
          <div style={{ fontSize: 11, color: T.emerald, fontFamily: "'DM Mono', monospace", wordBreak: "break-all", lineHeight: 1.6 }}>
            {fakeHash(event.id)}
          </div>
        </Card>
      </Section>
    </Drawer>
  )
}

function MiniStat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ padding: 12, background: T.surface2, borderRadius: 10, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 9, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: T.tx, fontFamily: mono ? "'DM Mono', monospace" : "'Space Grotesk', sans-serif", marginTop: 4 }}>{value}</div>
    </div>
  )
}

function fakeHash(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  const hex = (Math.abs(h).toString(16) + "a7c4b19f8e2d6").repeat(5).slice(0, 64)
  return hex
}
