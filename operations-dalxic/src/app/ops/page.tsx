"use client"
/* ═══════════════════════════════════════════════════════════════
   /ops — MASTER COMMAND CENTER
   Platform-wide overview. MRR, tenants, health, alerts, quick nav.
   ═══════════════════════════════════════════════════════════════ */
import Link from "next/link"
import { useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Card, Stat, Pill, T, Section, Tone } from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"
import {
  MOCK_TENANTS, MOCK_INVOICES, MOCK_TICKETS, MOCK_MRR_SERIES,
  MOCK_TIERS, MOCK_PLATFORM_AUDIT, MOCK_INFRA, MOCK_MODULES,
} from "@/lib/ops/mock"

export default function OpsCommandPage() {
  const totals = useMemo(() => {
    const active = MOCK_TENANTS.filter(t => t.status === "active")
    const trial  = MOCK_TENANTS.filter(t => t.status === "trial")
    const past   = MOCK_TENANTS.filter(t => t.status === "past_due")
    const sus    = MOCK_TENANTS.filter(t => t.status === "suspended")
    const mrr    = active.reduce((s, t) => s + t.mrr, 0)
    const arr    = mrr * 12
    const unpaid = MOCK_INVOICES.filter(i => i.status === "overdue" || i.status === "sent").reduce((s, i) => s + i.amount, 0)
    const urgentTickets = MOCK_TICKETS.filter(t => (t.priority === "urgent" || t.priority === "high") && t.status !== "resolved" && t.status !== "closed").length
    const degraded = MOCK_INFRA.filter(s => s.status !== "operational").length
    return { activeCount: active.length, trialCount: trial.length, pastCount: past.length, susCount: sus.length, mrr, arr, unpaid, urgentTickets, degraded }
  }, [])

  const series = MOCK_MRR_SERIES
  const maxMrr = Math.max(...series.map(s => s.mrr))

  return (
    <OpsPage
      title="Master Command"
      subtitle={`Every tenant, every invoice, every vertical — one view. ${totals.activeCount} active operators. GHS ${totals.mrr.toLocaleString()} MRR.`}
      icon="dashboard"
    >
      {/* ── Headline row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        <Stat label="Active Tenants"   value={totals.activeCount}                              accent="emerald" icon="tenants"   sub={`${totals.trialCount} trial · ${totals.pastCount} past due · ${totals.susCount} suspended`} />
        <Stat label="Monthly Recurring" value={`GHS ${(totals.mrr / 1000).toFixed(1)}k`}       accent="emerald" icon="billing"   sub={`ARR GHS ${(totals.arr / 1000).toFixed(0)}k`} />
        <Stat label="Outstanding"       value={`GHS ${totals.unpaid.toLocaleString()}`}        accent="amber"   icon="tax"       sub="Invoices sent or overdue" />
        <Stat label="Urgent Tickets"    value={totals.urgentTickets}                           accent="amber"   icon="support"   sub={`${totals.degraded} service degraded`} />
      </div>

      {/* ── MRR trend + tier mix ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14, marginBottom: 28 }}>
        <Card padding={24}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
                MRR Trajectory
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.tx, marginTop: 6, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>
                GHS {series[series.length - 1].mrr.toLocaleString()}
                <span style={{ fontSize: 12, color: T.emerald, marginLeft: 10, fontWeight: 700 }}>
                  +{(((series[series.length - 1].mrr - series[0].mrr) / series[0].mrr) * 100).toFixed(0)}% in 7 months
                </span>
              </div>
            </div>
            <Pill tone="emerald" dot>Live</Pill>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 180, paddingBottom: 24, position: "relative" }}>
            {series.map((s, i) => {
              const h = (s.mrr / maxMrr) * 140
              return (
                <div key={s.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 10, color: T.txM, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
                    {(s.mrr / 1000).toFixed(0)}k
                  </div>
                  <div style={{
                    width: "100%", height: h, borderRadius: 8,
                    background: `linear-gradient(180deg, ${T.emerald}, ${T.emerald}22)`,
                    boxShadow: i === series.length - 1 ? `0 4px 18px ${T.emerald}40` : "none",
                    border: i === series.length - 1 ? `1px solid ${T.emerald}60` : `1px solid ${T.emerald}20`,
                  }} />
                  <div style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {s.month}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card padding={24}>
          <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>
            Tier Mix (Active)
          </div>
          {MOCK_TIERS.map(tier => {
            const count = MOCK_TENANTS.filter(t => t.tier === tier.id && t.status === "active").length
            const mrr = MOCK_TENANTS.filter(t => t.tier === tier.id && t.status === "active").reduce((s, t) => s + t.mrr, 0)
            const total = totals.activeCount || 1
            const pct = (count / total) * 100
            const c = tier.accent === "amber" ? T.amber : tier.accent === "sky" ? T.sky : tier.accent === "emerald" ? T.emerald : T.txM
            return (
              <div key={tier.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{tier.name}</span>
                  <span style={{ fontSize: 11, color: T.txM, fontFamily: "'DM Mono', monospace" }}>
                    {count} · GHS {mrr.toLocaleString()}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: T.surface2, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: c, borderRadius: 999 }} />
                </div>
              </div>
            )
          })}
        </Card>
      </div>

      {/* ── Quick nav tiles ── */}
      <Section title="Surfaces" sub="Every control in master ops. Tap to open.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <Tile href="/ops/tenants"    icon="tenants"    title="Tenants"      sub={`${MOCK_TENANTS.length} registered`} tone="emerald" />
          <Tile href="/ops/tiers"      icon="tiers"      title="Tiers"        sub="4 plans · Starter → Enterprise" tone="emerald" />
          <Tile href="/ops/modules"    icon="modules"    title="Modules"      sub={`${MOCK_MODULES.length} modules across all verticals`} tone="emerald" />
          <Tile href="/ops/addons"     icon="addons"     title="Add-ons"      sub="12 add-ons · SMS, WhatsApp, extras" tone="emerald" />
          <Tile href="/ops/billing"    icon="billing"    title="Billing"      sub={`GHS ${totals.unpaid.toLocaleString()} outstanding`} tone="amber" />
          <Tile href="/ops/analytics"  icon="trending"   title="Analytics"    sub="MRR, cohorts, geography" tone="sky" />
          <Tile href="/ops/partners"   icon="partners"   title="Partners"     sub="8 resellers · 40 tenants sourced" tone="sky" />
          <Tile href="/ops/support"    icon="support"    title="Support"      sub={`${totals.urgentTickets} urgent open`} tone="amber" />
          <Tile href="/ops/staff"      icon="staff"      title="Staff"        sub="8 internal operators" tone="neutral" />
          <Tile href="/ops/releases"   icon="releases"   title="Releases"     sub="v4.2.0 canary rolling" tone="sky" />
          <Tile href="/ops/infra"      icon="infra"      title="Infra"        sub={`${totals.degraded} degraded · 12 services`} tone={totals.degraded > 0 ? "amber" : "emerald"} />
          <Tile href="/ops/compliance" icon="compliance" title="Compliance"   sub="VAT-3, SSNIT, PAYE, DPA" tone="emerald" />
          <Tile href="/ops/audit"      icon="audit"      title="Audit"        sub="Platform-wide immutable log" tone="amber" />
          <Tile href="/ops/settings"   icon="settings"   title="Settings"     sub="Brand, tax, keys, webhooks" tone="neutral" />
          <Tile href="/trade"          icon="pos"        title="→ Trade"       sub="Retail workstation (tenant view)" tone="amber" external />
          <Tile href="/health"         icon="support"    title="→ Health"      sub="Hospital workstation (tenant view)" tone="amber" external />
          <Tile href="/institute"      icon="customers"  title="→ Institute"   sub="Schools & NGO workstation" tone="sky" external />
        </div>
      </Section>

      {/* ── Activity feed + Alerts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Section title="Recent Ops Activity" sub="Staff actions across the platform.">
          <Card padding={0} style={{ overflow: "hidden" }}>
            {MOCK_PLATFORM_AUDIT.slice(0, 8).map((e, i) => (
              <div key={e.id} style={{
                padding: "14px 18px",
                borderBottom: i === 7 ? "none" : `1px solid ${T.border}`,
                display: "flex", gap: 14, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: e.severity === "critical" ? `${T.red}15` : e.severity === "warn" ? `${T.amber}15` : `${T.emerald}10`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: e.severity === "critical" ? T.red : e.severity === "warn" ? T.amber : T.emerald,
                  flexShrink: 0,
                }}>
                  <Icon name={e.severity === "critical" ? "lock" : e.severity === "warn" ? "bolt" : "check"} size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.tx }}>
                      {e.actor} <span style={{ color: T.txD, fontWeight: 500 }}>·</span> <span style={{ color: T.emerald, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{e.action}</span>
                    </div>
                    <div style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>{e.ts.slice(11)}</div>
                  </div>
                  <div style={{ fontSize: 12, color: T.txM, marginTop: 3 }}>{e.detail}</div>
                </div>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Alerts & Actions Needed" sub="Things waiting on a human.">
          <Card padding={0} style={{ overflow: "hidden" }}>
            <AlertRow tone="red"     icon="lock"       title={`${totals.susCount} tenant(s) suspended`} sub="Payment recovery required" href="/ops/tenants" />
            <AlertRow tone="amber"   icon="billing"    title={`GHS ${totals.unpaid.toLocaleString()} outstanding`} sub="Run dunning on overdue invoices" href="/ops/billing" />
            <AlertRow tone="amber"   icon="support"    title={`${totals.urgentTickets} urgent tickets`} sub="High/urgent support queue" href="/ops/support" />
            <AlertRow tone="amber"   icon="whatsapp"   title="WhatsApp Cloud API degraded" sub="Template approvals delayed" href="/ops/infra" />
            <AlertRow tone="sky"     icon="releases"   title="v4.2.0 canary at 15%" sub="Promote to 30% if metrics hold" href="/ops/releases" />
            <AlertRow tone="emerald" icon="compliance" title="2 tenants with VAT-3 due in 6 days" sub="Auto-reminder scheduled" href="/ops/compliance" last />
          </Card>
        </Section>
      </div>
    </OpsPage>
  )
}

function Tile({ href, icon, title, sub, tone = "emerald", external = false }: {
  href: string; icon: IconName; title: string; sub: string; tone?: Tone; external?: boolean
}) {
  const c = tone === "amber" ? T.amber : tone === "sky" ? T.sky : tone === "red" ? T.red : tone === "neutral" ? T.txM : T.emerald
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        padding: 20, borderRadius: 14,
        background: `${c}06`,
        border: `1px solid ${c}22`,
        cursor: "pointer",
        transition: "transform 0.15s, border-color 0.15s, background 0.15s",
        display: "flex", flexDirection: "column", gap: 12,
        minHeight: 120,
      }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = `${c}55` }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = `${c}22` }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `${c}15`, color: c,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={icon} size={16} />
          </div>
          {external && <Icon name="share" size={12} color={T.txD} />}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}>
            {title}
          </div>
          <div style={{ fontSize: 11, color: T.txM, marginTop: 4 }}>{sub}</div>
        </div>
      </div>
    </Link>
  )
}

function AlertRow({ tone, icon, title, sub, href, last = false }: {
  tone: Tone; icon: IconName; title: string; sub: string; href: string; last?: boolean
}) {
  const c = tone === "amber" ? T.amber : tone === "sky" ? T.sky : tone === "red" ? T.red : tone === "neutral" ? T.txM : T.emerald
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        padding: "14px 18px",
        borderBottom: last ? "none" : `1px solid ${T.border}`,
        display: "flex", gap: 14, alignItems: "center",
        cursor: "pointer", transition: "background 0.15s",
      }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.04)" }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${c}15`, color: c,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon name={icon} size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{title}</div>
          <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{sub}</div>
        </div>
        <Icon name="chevron-right" size={14} color={T.txD} />
      </div>
    </Link>
  )
}
