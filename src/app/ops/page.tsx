"use client"
import { OpsPage } from "@/components/ops/OpsShell"
import { Stat, Card, Pill, T } from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"
import { MOCK_TENANTS, MOCK_MRR_SERIES, MOCK_TIERS, MOCK_INVOICES, MOCK_TICKETS, MOCK_INFRA, MOCK_PLATFORM_AUDIT } from "@/lib/ops/mock"
import { money, relativeDays } from "@/lib/ops/format"
import Link from "next/link"

const NAV_TILES: { href: string; label: string; icon: IconName; count: string | number }[] = [
  { href: "/ops/tenants",    label: "Tenants",    icon: "tenants",    count: MOCK_TENANTS.length },
  { href: "/ops/analytics",  label: "Analytics",  icon: "analytics",  count: "Live" },
  { href: "/ops/tiers",      label: "Tiers",      icon: "tiers",      count: MOCK_TIERS.length },
  { href: "/ops/modules",    label: "Modules",    icon: "modules",    count: "40+" },
  { href: "/ops/addons",     label: "Add-ons",    icon: "addons",     count: "12" },
  { href: "/ops/billing",    label: "Billing",    icon: "billing",    count: MOCK_INVOICES.length },
  { href: "/ops/partners",   label: "Partners",   icon: "partners",   count: "8" },
  { href: "/ops/support",    label: "Support",    icon: "support",    count: MOCK_TICKETS.filter(t => t.status === "open").length },
  { href: "/ops/staff",      label: "Staff",      icon: "staff",      count: "6" },
  { href: "/ops/releases",   label: "Releases",   icon: "releases",   count: "8" },
  { href: "/ops/infra",      label: "Infra",      icon: "infra",      count: MOCK_INFRA.filter(s => s.status === "operational").length },
  { href: "/ops/compliance", label: "Compliance", icon: "compliance", count: "5" },
  { href: "/ops/audit",      label: "Audit",      icon: "audit",      count: MOCK_PLATFORM_AUDIT.length },
  { href: "/ops/settings",   label: "Settings",   icon: "settings",   count: "7" },
]

export default function CommandPage() {
  const active = MOCK_TENANTS.filter(t => t.status === "active")
  const trial = MOCK_TENANTS.filter(t => t.status === "trial")
  const pastDue = MOCK_TENANTS.filter(t => t.status === "past_due")
  const totalMRR = active.reduce((s, t) => s + t.mrr, 0)
  const outstanding = MOCK_INVOICES.filter(i => i.status === "overdue" || i.status === "sent").reduce((s, i) => s + i.amount, 0)
  const urgentTickets = MOCK_TICKETS.filter(t => (t.priority === "urgent" || t.priority === "high") && t.status === "open").length
  const degraded = MOCK_INFRA.filter(s => s.status !== "operational").length
  const maxMRR = Math.max(...MOCK_MRR_SERIES.map(m => m.mrr))

  return (
    <OpsPage title="Master Command" subtitle="Platform-wide overview. All tenants, all verticals, one view." icon="dashboard">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <Stat label="Active Tenants" value={active.length} sub={`${trial.length} trial · ${pastDue.length} past due`} icon="tenants" />
        <Stat label="MRR" value={money(totalMRR)} sub={`ARR ${money(totalMRR * 12, { compact: true })}`} icon="trending" />
        <Stat label="Outstanding" value={money(outstanding)} icon="billing" accent="amber" />
        <Stat label="Urgent" value={`${urgentTickets} tickets · ${degraded} degraded`} icon="support" accent={urgentTickets > 0 ? "amber" : "emerald"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        <Card>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>MRR Trajectory</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
            {MOCK_MRR_SERIES.map((m, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 9, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{money(m.mrr, { compact: true, symbol: false })}</div>
                <div style={{ width: "100%", borderRadius: 6, background: `linear-gradient(180deg, ${T.emerald}, #059669)`, height: `${(m.mrr / maxMRR) * 100}%`, minHeight: 8, transition: "height 0.3s" }} />
                <div style={{ fontSize: 9, color: T.txD, fontFamily: "'DM Mono', monospace" }}>{m.month}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Tier Mix</div>
          {MOCK_TIERS.map(tier => {
            const count = active.filter(t => t.tier === tier.id).length
            const tierMRR = active.filter(t => t.tier === tier.id).reduce((s, t) => s + t.mrr, 0)
            const pctVal = active.length > 0 ? (count / active.length) * 100 : 0
            return (
              <div key={tier.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.tx }}>{tier.name}</span>
                  <span style={{ fontSize: 11, color: T.txM }}>{count} tenants · {money(tierMRR, { compact: true })}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: T.surface2 }}>
                  <div style={{ height: "100%", borderRadius: 3, background: T.emerald, width: `${pctVal}%`, transition: "width 0.3s" }} />
                </div>
              </div>
            )
          })}
        </Card>
      </div>

      <Card style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Quick Navigation</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {NAV_TILES.map(tile => (
            <Link key={tile.href} href={tile.href} style={{ textDecoration: "none" }}>
              <div style={{ padding: 14, borderRadius: 12, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, transition: "transform 0.15s, border-color 0.15s", cursor: "pointer" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.borderColor = T.border2 }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.borderColor = T.border }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.emerald}10`, display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald }}>
                  <Icon name={tile.icon} size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.tx }}>{tile.label}</div>
                  <div style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace" }}>{tile.count}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Recent Activity</div>
          {MOCK_PLATFORM_AUDIT.slice(0, 8).map((ev, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 7 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: ev.severity === "critical" ? `${T.red}12` : ev.severity === "warn" ? `${T.amber}12` : `${T.emerald}12`, display: "flex", alignItems: "center", justifyContent: "center", color: ev.severity === "critical" ? T.red : ev.severity === "warn" ? T.amber : T.emerald, flexShrink: 0 }}>
                <Icon name="audit" size={12} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: T.tx, fontWeight: 600 }}>{ev.actor} <span style={{ color: T.txM, fontWeight: 400 }}>{ev.action}</span></div>
                <div style={{ fontSize: 10, color: T.txD }}>{ev.target} · {relativeDays(ev.ts)}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Alerts</div>
          {[
            { label: "Overdue invoices", count: MOCK_INVOICES.filter(i => i.status === "overdue").length, href: "/ops/billing", icon: "billing" as IconName, tone: "red" as const },
            { label: "Expiring trials", count: trial.length, href: "/ops/tenants", icon: "tenants" as IconName, tone: "amber" as const },
            { label: "Urgent tickets", count: urgentTickets, href: "/ops/support", icon: "support" as IconName, tone: "amber" as const },
            { label: "Degraded services", count: degraded, href: "/ops/infra", icon: "infra" as IconName, tone: degraded > 0 ? "red" as const : "emerald" as const },
            { label: "Past-due tenants", count: pastDue.length, href: "/ops/tenants", icon: "tenants" as IconName, tone: pastDue.length > 0 ? "amber" as const : "emerald" as const },
          ].map((a, i) => (
            <Link key={i} href={a.href} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${a.tone === "red" ? T.red : a.tone === "amber" ? T.amber : T.emerald}12`, display: "flex", alignItems: "center", justifyContent: "center", color: a.tone === "red" ? T.red : a.tone === "amber" ? T.amber : T.emerald, flexShrink: 0 }}>
                <Icon name={a.icon} size={12} />
              </div>
              <span style={{ flex: 1, fontSize: 12, color: T.tx }}>{a.label}</span>
              <Pill tone={a.tone}>{a.count}</Pill>
              <Icon name="chevron-right" size={14} color={T.txD} />
            </Link>
          ))}
        </Card>
      </div>
    </OpsPage>
  )
}
