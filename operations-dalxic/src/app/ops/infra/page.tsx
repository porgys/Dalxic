"use client"
/* ═══════════════════════════════════════════════════════════════
   /ops/infra — Infrastructure health (API, DB, gateways)
   ═══════════════════════════════════════════════════════════════ */
import { OpsPage } from "@/components/ops/OpsShell"
import { Card, Stat, Pill, Section, T, Tone } from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"
import { MOCK_INFRA, MockInfraService } from "@/lib/ops/mock"

const STATUS_TONE: Record<MockInfraService["status"], Tone> = {
  operational: "emerald", degraded: "amber", down: "red",
}

const CAT_ICON: Record<MockInfraService["category"], IconName> = {
  api: "globe", database: "database", messaging: "whatsapp", payments: "billing", storage: "layers", queue: "bolt",
}

export default function OpsInfraPage() {
  const operational = MOCK_INFRA.filter(s => s.status === "operational").length
  const degraded    = MOCK_INFRA.filter(s => s.status === "degraded").length
  const down        = MOCK_INFRA.filter(s => s.status === "down").length
  const avgUptime   = MOCK_INFRA.reduce((s, x) => s + x.uptime30d, 0) / MOCK_INFRA.length

  const grouped: Record<string, typeof MOCK_INFRA> = {}
  for (const s of MOCK_INFRA) (grouped[s.category] ??= []).push(s)

  return (
    <OpsPage
      title="Infrastructure"
      subtitle="Every service that keeps Dalxic running — API, databases, gateways, queues."
      icon="infra"
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        <Stat label="Operational"  value={operational}                    accent="emerald" icon="check" />
        <Stat label="Degraded"     value={degraded}                       accent="amber"   icon="bolt" />
        <Stat label="Down"         value={down}                           accent="amber"   icon="lock" />
        <Stat label="Avg Uptime"   value={`${avgUptime.toFixed(2)}%`}     accent="emerald" icon="shield" sub="30-day rolling" />
      </div>

      {down + degraded > 0 && (
        <Card padding={16} style={{ marginBottom: 28, background: `${T.amber}0A`, border: `1px dashed ${T.amber}40` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Icon name="bolt" size={16} color={T.amber} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.amber, fontFamily: "'DM Mono', monospace" }}>
              {degraded + down} service{degraded + down > 1 ? "s" : ""} need attention
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.txM, marginTop: 4, lineHeight: 1.5 }}>
            Degraded services may silently affect a subset of tenants. Investigate before escalation.
          </div>
        </Card>
      )}

      {Object.entries(grouped).map(([cat, services]) => (
        <Section key={cat} title={cat.charAt(0).toUpperCase() + cat.slice(1)} sub={`${services.length} service${services.length > 1 ? "s" : ""}`}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            {services.map(s => <ServiceCard key={s.id} svc={s} />)}
          </div>
        </Section>
      ))}
    </OpsPage>
  )
}

function ServiceCard({ svc }: { svc: MockInfraService }) {
  const c = svc.status === "operational" ? T.emerald : svc.status === "degraded" ? T.amber : T.red
  return (
    <Card padding={20}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${c}15`, color: c,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={CAT_ICON[svc.category]} size={16} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{svc.name}</div>
            <div style={{ fontSize: 11, color: T.txM, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{svc.provider}</div>
          </div>
        </div>
        <Pill tone={STATUS_TONE[svc.status]} dot>{svc.status}</Pill>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
        <Metric label="Uptime 30d" value={`${svc.uptime30d.toFixed(2)}%`} />
        <Metric label="Latency" value={`${svc.latencyMs}ms`} />
        <Metric label="Throughput" value={svc.throughput} compact />
      </div>

      {svc.regionNote && (
        <div style={{
          padding: 10, borderRadius: 8,
          background: T.surface2, border: `1px solid ${T.border}`,
          fontSize: 11, color: T.txM, fontFamily: "'DM Mono', monospace",
        }}>
          {svc.regionNote}
        </div>
      )}
    </Card>
  )
}

function Metric({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div style={{ padding: 10, background: T.surface2, borderRadius: 8, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 9, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: compact ? 11 : 14, fontWeight: 800, color: T.tx, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>{value}</div>
    </div>
  )
}
