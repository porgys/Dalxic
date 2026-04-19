"use client"
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Stat, Card, Pill, Tabs, Drawer, SearchBar, Select, T, Section, Button } from "@/components/ops/primitives"
import type { Tone } from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"
import { MOCK_PLATFORM_AUDIT, MockPlatformAudit } from "@/lib/ops/mock"

const SEV_TONE: Record<MockPlatformAudit["severity"], Tone> = {
  info:     "emerald",
  warn:     "amber",
  critical: "red",
}

const SEV_ICON: Record<MockPlatformAudit["severity"], IconName> = {
  info:     "check",
  warn:     "alert",
  critical: "shield",
}

type TabKey = "all" | "critical" | "warn" | "info"

export default function AuditPage() {
  const [tab, setTab] = useState<TabKey>("all")
  const [actor, setActor] = useState("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<MockPlatformAudit | null>(null)

  const totalEvents  = MOCK_PLATFORM_AUDIT.length
  const criticalCount = MOCK_PLATFORM_AUDIT.filter(e => e.severity === "critical").length
  const warnCount     = MOCK_PLATFORM_AUDIT.filter(e => e.severity === "warn").length
  const uniqueActors  = Array.from(new Set(MOCK_PLATFORM_AUDIT.map(e => e.actor)))

  const filtered = useMemo(() => {
    let list = MOCK_PLATFORM_AUDIT
    if (tab !== "all") list = list.filter(e => e.severity === tab)
    if (actor !== "all") list = list.filter(e => e.actor === actor)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.action.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q) ||
        e.detail.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q)
      )
    }
    return list
  }, [tab, actor, search])

  // Mock SHA-256 hash for the drawer integrity section
  const mockHash = (id: string) => {
    const base = "a3f8e2c91d4b706f5e8c3a2d1b9f07e6"
    return base + id.replace(/[^0-9]/g, "").padStart(8, "0") + "c4d2"
  }

  return (
    <OpsPage title="Immutable Action Log" subtitle="Every privileged action by ops staff. Cryptographically chained, tamper-evident." icon="audit">
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <Stat label="Total Events (7d)" value={totalEvents} icon="audit" />
        <Stat label="Critical" value={criticalCount} icon="shield" accent={criticalCount > 0 ? "amber" : "emerald"} />
        <Stat label="Warnings" value={warnCount} icon="alert" accent={warnCount > 0 ? "amber" : "emerald"} />
        <Stat label="Staff Active" value={uniqueActors.length} sub={`${uniqueActors.length} unique actors this period`} icon="staff" />
      </div>

      {/* Immutable log callout */}
      <div style={{
        border: `2px dashed ${T.emerald}`,
        borderRadius: 14,
        padding: "18px 24px",
        marginBottom: 32,
        background: `${T.emerald}08`,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.emerald}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="shield" size={18} color={T.emerald} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.emerald, marginBottom: 2 }}>
            Immutable audit chain
          </div>
          <div style={{ fontSize: 12, color: T.txM }}>
            Every entry is SHA-256 hashed and chained to its predecessor. The log is append-only — no entry can be modified or deleted without breaking chain integrity.
          </div>
        </div>
      </div>

      {/* Tabs + Filter */}
      <Section title="Activity Stream">
        <Tabs<TabKey>
          tabs={[
            { key: "all",      label: "All",      count: totalEvents },
            { key: "critical", label: "Critical",  count: criticalCount },
            { key: "warn",     label: "Warnings",  count: warnCount },
            { key: "info",     label: "Info",       count: MOCK_PLATFORM_AUDIT.filter(e => e.severity === "info").length },
          ]}
          value={tab}
          onChange={setTab}
        />

        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search actions, targets, details..." />
          </div>
          <Select
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            style={{ width: 220 }}
          >
            <option value="all">All actors</option>
            {uniqueActors.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
        </div>

        {/* Activity stream — custom rows */}
        {filtered.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 13, color: T.txM }}>No events match this filter.</div>
          </Card>
        ) : (
          <Card padding={0} style={{ overflow: "hidden" }}>
            {filtered.map((evt, idx) => {
              const sevColor = SEV_TONE[evt.severity] === "emerald" ? T.emerald : SEV_TONE[evt.severity] === "amber" ? T.amber : T.red
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelected(evt)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    borderBottom: idx === filtered.length - 1 ? "none" : `1px solid ${T.border}`,
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(16,185,129,0.04)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent" }}
                >
                  {/* Severity icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: `${sevColor}12`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon name={SEV_ICON[evt.severity]} size={14} color={sevColor} />
                  </div>

                  {/* Actor + role */}
                  <div style={{ minWidth: 140, flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{evt.actor}</div>
                    <div style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace" }}>{evt.actorRole}</div>
                  </div>

                  {/* Action description */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: T.tx, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", color: T.emeraldL, fontWeight: 600 }}>{evt.action}</span>
                      <span style={{ color: T.txD }}>{" \u2192 "}</span>
                      <span style={{ color: T.txM }}>{evt.target}</span>
                      {evt.tenantId && <span style={{ color: T.txD }}>{" \u00b7 "}{evt.tenantId}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: T.txD, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {evt.detail}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {evt.ts}
                  </div>

                  {/* Severity pill */}
                  <div style={{ flexShrink: 0 }}>
                    <Pill tone={SEV_TONE[evt.severity]} dot>{evt.severity}</Pill>
                  </div>
                </div>
              )
            })}
          </Card>
        )}
      </Section>

      {/* Drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.action.replace(/_/g, " ").toUpperCase() ?? ""}
        subtitle={selected ? `${selected.actor} \u00b7 ${selected.actorRole}` : ""}
        width={520}
        footer={
          <>
            <Button variant="ghost" icon="copy" onClick={() => { if (selected) navigator.clipboard.writeText(selected.id) }}>Copy ID</Button>
            <Button variant="outline" icon="download">Export</Button>
          </>
        }
      >
        {selected && (
          <div>
            {/* Top pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <Pill tone={SEV_TONE[selected.severity]} dot>{selected.severity}</Pill>
              <Pill tone="neutral">{selected.actorRole}</Pill>
            </div>

            {/* Detail */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Detail</div>
              <div style={{ fontSize: 13, color: T.txM, lineHeight: 1.5 }}>{selected.detail}</div>
            </div>

            {/* Timestamp */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Timestamp</div>
              <div style={{ fontSize: 13, color: T.tx, fontFamily: "'DM Mono', monospace" }}>{selected.ts}</div>
            </div>

            {/* Mini stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Event ID", value: selected.id },
                { label: "Action", value: selected.action },
                { label: "Target", value: selected.target },
                { label: "Tenant", value: selected.tenantId ?? "--" },
                { label: "IP Address", value: selected.ip },
                { label: "Actor", value: selected.actor },
              ].map(m => (
                <div key={m.label} style={{
                  background: `rgba(16,185,129,0.04)`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  border: `1px solid ${T.border}`,
                }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.tx, fontFamily: "'DM Mono', monospace", wordBreak: "break-all" }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Integrity section */}
            <div style={{
              background: `${T.emerald}06`,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "16px 18px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Icon name="shield" size={14} color={T.emerald} />
                <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: T.emerald, fontFamily: "'DM Mono', monospace" }}>
                  Chain Integrity
                </div>
              </div>
              <div style={{ fontSize: 9, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
                SHA-256 Hash
              </div>
              <div style={{
                fontSize: 11, color: T.emeraldL, fontFamily: "'DM Mono', monospace",
                background: `rgba(16,185,129,0.06)`,
                padding: "8px 12px", borderRadius: 8,
                wordBreak: "break-all", lineHeight: 1.6,
              }}>
                {mockHash(selected.id)}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </OpsPage>
  )
}
