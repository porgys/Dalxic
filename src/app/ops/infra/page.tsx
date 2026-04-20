"use client"
import { OpsPage } from "@/components/ops/OpsShell"
import { Stat, Card, Pill, T, Section } from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"
import { MOCK_INFRA, MockInfraService } from "@/lib/ops/mock"

const CATEGORY_META: Record<MockInfraService["category"], { label: string; icon: IconName }> = {
  api:       { label: "API",       icon: "globe" },
  database:  { label: "Database",  icon: "database" },
  messaging: { label: "Messaging", icon: "mail" },
  payments:  { label: "Payments",  icon: "billing" },
  storage:   { label: "Storage",   icon: "inventory" },
  queue:     { label: "Queue",     icon: "layers" },
}

const STATUS_TONE: Record<MockInfraService["status"], "emerald" | "amber" | "red"> = {
  operational: "emerald",
  degraded:    "amber",
  down:        "red",
}

export default function InfraPage() {
  const operational = MOCK_INFRA.filter(s => s.status === "operational").length
  const degraded    = MOCK_INFRA.filter(s => s.status === "degraded").length
  const down        = MOCK_INFRA.filter(s => s.status === "down").length
  const avgUptime   = (MOCK_INFRA.reduce((s, i) => s + i.uptime30d, 0) / MOCK_INFRA.length).toFixed(2)

  const hasIssues = degraded > 0 || down > 0

  const categories = Object.keys(CATEGORY_META) as MockInfraService["category"][]
  const grouped = categories
    .map(cat => ({ cat, services: MOCK_INFRA.filter(s => s.category === cat) }))
    .filter(g => g.services.length > 0)

  return (
    <OpsPage title="Infrastructure Health" subtitle="Real-time status of every service dependency. 30-day rolling metrics." icon="infra">
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <Stat label="Operational" value={operational} sub={`of ${MOCK_INFRA.length} services`} icon="check" />
        <Stat label="Degraded" value={degraded} icon="alert" accent={degraded > 0 ? "amber" : "emerald"} />
        <Stat label="Down" value={down} icon="close" accent={down > 0 ? "amber" : "emerald"} />
        <Stat label="Avg Uptime 30d" value={`${avgUptime}%`} icon="trending" />
      </div>

      {/* Alert callout */}
      {hasIssues && (
        <div style={{
          border: `2px dashed ${T.amber}`,
          borderRadius: 14,
          padding: "18px 24px",
          marginBottom: 32,
          background: `${T.amber}08`,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.amber}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="alert" size={18} color={T.amber} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.amber, marginBottom: 2 }}>
              Service degradation detected
            </div>
            <div style={{ fontSize: 12, color: T.txM }}>
              {degraded > 0 && `${degraded} service${degraded > 1 ? "s" : ""} degraded`}
              {degraded > 0 && down > 0 && " · "}
              {down > 0 && `${down} service${down > 1 ? "s" : ""} down`}
              {" — review affected services below for details."}
            </div>
          </div>
        </div>
      )}

      {/* Grouped services */}
      {grouped.map(({ cat, services }) => {
        const meta = CATEGORY_META[cat]
        return (
          <Section key={cat} title={meta.label} sub={`${services.length} service${services.length > 1 ? "s" : ""}`}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {services.map(svc => (
                <Card key={svc.id} hover>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: `${T.emerald}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={meta.icon} size={15} color={T.emerald} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.tx }}>{svc.name}</div>
                        <div style={{ fontSize: 11, color: T.txD }}>{svc.provider}</div>
                      </div>
                    </div>
                    <Pill tone={STATUS_TONE[svc.status]} dot>{svc.status}</Pill>
                  </div>

                  {/* Metric boxes */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Uptime %", value: `${svc.uptime30d}%` },
                      { label: "Latency", value: `${svc.latencyMs} ms` },
                      { label: "Throughput", value: svc.throughput },
                    ].map(m => (
                      <div key={m.label} style={{
                        background: `rgba(16,185,129,0.04)`,
                        borderRadius: 10,
                        padding: "10px 12px",
                        border: `1px solid ${T.border}`,
                      }}>
                        <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
                          {m.label}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Region note */}
                  {svc.regionNote && (
                    <div style={{ fontSize: 11, color: T.txD, marginTop: 12, fontFamily: "'DM Mono', monospace" }}>
                      {svc.regionNote}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Section>
        )
      })}
    </OpsPage>
  )
}
