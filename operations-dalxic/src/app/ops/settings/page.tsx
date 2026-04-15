"use client"
/* ═══════════════════════════════════════════════════════════════
   /ops/settings — Platform-wide settings (brand, tax, keys, hooks)
   ═══════════════════════════════════════════════════════════════ */
import { useState } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import {
  Card, Pill, Button, Section, Field, T, Tone,
} from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"
import { MOCK_PLATFORM_SETTINGS } from "@/lib/ops/mock"

type Tab = "brand" | "contacts" | "tax" | "payments" | "limits" | "webhooks" | "keys"

const TABS: { key: Tab; label: string; icon: IconName; sub: string }[] = [
  { key: "brand",    label: "Brand",         icon: "sparkle",  sub: "Identity, legal name, accent color" },
  { key: "contacts", label: "Contacts",      icon: "mail",     sub: "Support, billing, phone, WhatsApp" },
  { key: "tax",      label: "Tax Engine",    icon: "billing",  sub: "VAT, NHIL, GETFund, SSNIT rates" },
  { key: "payments", label: "Payments",      icon: "billing",  sub: "MoMo, card providers, settlement" },
  { key: "limits",   label: "Limits",        icon: "lock",     sub: "Trial days, file size, session" },
  { key: "webhooks", label: "Webhooks",      icon: "bolt",     sub: "Outbound event subscribers" },
  { key: "keys",     label: "API Keys",      icon: "shield",   sub: "Production, staging, partners" },
]

export default function OpsSettingsPage() {
  const [tab, setTab] = useState<Tab>("brand")
  const s = MOCK_PLATFORM_SETTINGS

  return (
    <OpsPage
      title="Platform Settings"
      subtitle="The master toggles that govern every tenant, invoice, filing, and integration."
      icon="settings"
      action={<Button variant="outline" icon="download">Export Config</Button>}
    >
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>
        {/* Tab rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {TABS.map(t => {
            const isActive = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  textAlign: "left", padding: "12px 14px", borderRadius: 10,
                  background: isActive ? `${T.emerald}14` : "transparent",
                  border: `1px solid ${isActive ? T.emerald + "40" : "transparent"}`,
                  cursor: "pointer", display: "flex", gap: 12, alignItems: "center",
                  transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: isActive ? T.emerald : T.surface2,
                  color: isActive ? T.bg : T.emerald,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon name={t.icon} size={13} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? T.tx : T.txM, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: 10, color: T.txD, marginTop: 2, fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em" }}>
                    {t.sub}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Panel */}
        <div>
          {tab === "brand" && (
            <Section title="Brand Identity" sub="How Dalxic presents itself across every tenant-facing surface.">
              <Card padding={24}>
                <Row label="Platform Name" value={s.brand.name} />
                <Row label="Parent Company" value={s.brand.parent} />
                <Row label="Legal Name" value={s.brand.legalName} />
                <Row label="Accent Color" value={s.brand.accent} swatch={s.brand.accent} last />
              </Card>
            </Section>
          )}

          {tab === "contacts" && (
            <Section title="Support & Billing Contacts" sub="Where tenants reach the Dalxic team.">
              <Card padding={24}>
                <Row label="Support Email" value={s.contacts.supportEmail} mono />
                <Row label="Billing Email" value={s.contacts.billingEmail} mono />
                <Row label="Phone" value={s.contacts.phone} mono />
                <Row label="WhatsApp" value={s.contacts.whatsapp} mono last />
              </Card>
            </Section>
          )}

          {tab === "tax" && (
            <>
              <Section title="Ghana Tax Rates" sub="Applied automatically to every invoice, receipt, and financial report.">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  <TaxCard label="VAT" value={`${s.tax.vat}%`} body="Value Added Tax — standard rate" tone="emerald" />
                  <TaxCard label="NHIL" value={`${s.tax.nhil}%`} body="National Health Insurance Levy" tone="sky" />
                  <TaxCard label="GETFund" value={`${s.tax.getfund}%`} body="Ghana Education Trust Fund" tone="amber" />
                  <TaxCard label="COVID Levy" value={`${s.tax.covidLevy}%`} body="Post-pandemic recovery levy" tone="neutral" />
                </div>
              </Section>
              <Section title="SSNIT Rates" sub="Social Security and National Insurance Trust — employer + employee splits.">
                <Card padding={24}>
                  <Row label="Tier 1 — Employer" value={`${s.tax.ssnitTier1Employer}%`} />
                  <Row label="Tier 2 — Employer" value={`${s.tax.ssnitTier2Employer}%`} />
                  <Row label="Employee Contribution" value={`${s.tax.ssnitEmployee}%`} last />
                </Card>
              </Section>
            </>
          )}

          {tab === "payments" && (
            <Section title="Payment Providers" sub="Active rails across every tenant checkout and invoice settle.">
              <Card padding={24} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700, marginBottom: 10 }}>
                  Mobile Money
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {s.payments.momoProviders.map(p => <Pill key={p} tone="emerald">{p}</Pill>)}
                </div>
              </Card>
              <Card padding={24} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700, marginBottom: 10 }}>
                  Card Acquirers
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {s.payments.cardProviders.map(p => <Pill key={p} tone="sky">{p}</Pill>)}
                </div>
              </Card>
              <Card padding={24}>
                <Row label="Settlement Window" value={`T+${s.payments.settlementDays} day${s.payments.settlementDays === 1 ? "" : "s"}`} last />
              </Card>
            </Section>
          )}

          {tab === "limits" && (
            <Section title="Platform Limits" sub="Hard caps enforced across all tenants, regardless of tier.">
              <Card padding={24}>
                <Row label="Free Trial" value={`${s.limits.freeTrialDays} days`} />
                <Row label="Max File Upload" value={`${s.limits.maxFileUploadMB} MB`} />
                <Row label="Session Timeout" value={`${s.limits.sessionTimeoutMins} mins`} />
                <Row label="PIN Attempts (lockout)" value={String(s.limits.pinAttempts)} last />
              </Card>
            </Section>
          )}

          {tab === "webhooks" && (
            <Section
              title="Outbound Webhooks"
              sub="Events pushed to Slack, Segment, and partner services."
              action={<Button icon="plus" size="sm">Add Webhook</Button>}
            >
              <Card padding={0} style={{ overflow: "hidden" }}>
                {s.webhooks.map((w, i) => (
                  <div key={w.id} style={{
                    padding: "16px 20px",
                    borderBottom: i === s.webhooks.length - 1 ? "none" : `1px solid ${T.border}`,
                    display: "flex", gap: 14, alignItems: "center",
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: w.active ? T.emerald : T.txD,
                      boxShadow: w.active ? `0 0 8px ${T.emerald}80` : "none",
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.emerald, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
                        {w.event}
                      </div>
                      <div style={{ fontSize: 11, color: T.txM, fontFamily: "'DM Mono', monospace", wordBreak: "break-all" }}>
                        {w.url}
                      </div>
                    </div>
                    <Pill tone={w.active ? "emerald" : "neutral"}>{w.active ? "ACTIVE" : "PAUSED"}</Pill>
                    <Button variant="ghost" size="sm" icon="edit">Edit</Button>
                  </div>
                ))}
              </Card>
            </Section>
          )}

          {tab === "keys" && (
            <Section
              title="API Keys"
              sub="Bearer tokens for internal, staging, and partner access. Rotate regularly."
              action={<Button icon="plus" size="sm">New Key</Button>}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                {s.apiKeys.map(k => (
                  <Card key={k.id} padding={20}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{k.label}</div>
                        <div style={{ fontSize: 11, color: T.txD, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
                          Created {k.createdOn} · Last used {k.lastUsed}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button variant="ghost" size="sm" icon="share">Copy</Button>
                        <Button variant="outline" size="sm" icon="edit">Rotate</Button>
                      </div>
                    </div>
                    <div style={{
                      padding: "10px 14px", background: T.bg, borderRadius: 8,
                      border: `1px solid ${T.border}`,
                      fontSize: 13, color: T.emerald, fontFamily: "'DM Mono', monospace", fontWeight: 700,
                    }}>
                      {k.keyMasked}
                    </div>
                  </Card>
                ))}
              </div>
              <Card padding={16} style={{ marginTop: 20, background: `${T.red}0A`, border: `1px dashed ${T.red}40` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name="lock" size={16} color={T.red} />
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.red, fontFamily: "'DM Mono', monospace" }}>Danger Zone</div>
                </div>
                <div style={{ fontSize: 12, color: T.txM, marginTop: 8, lineHeight: 1.5 }}>
                  Rotating the production key forces every server-side integration to re-authenticate. Schedule during a low-traffic window and notify partners 48 hours ahead.
                </div>
              </Card>
            </Section>
          )}
        </div>
      </div>
    </OpsPage>
  )
}

function Row({ label, value, mono = false, swatch, last = false }: {
  label: string; value: string; mono?: boolean; swatch?: string; last?: boolean
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "12px 0",
      borderBottom: last ? "none" : `1px solid ${T.border}`,
    }}>
      <div style={{ fontSize: 12, color: T.txM, fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {swatch && <div style={{ width: 18, height: 18, borderRadius: 4, background: swatch, border: `1px solid ${T.border2}` }} />}
        <div style={{
          fontSize: 13, fontWeight: 800, color: T.tx,
          fontFamily: mono ? "'DM Mono', monospace" : "'Space Grotesk', sans-serif",
        }}>{value}</div>
      </div>
    </div>
  )
}

function TaxCard({ label, value, body, tone }: { label: string; value: string; body: string; tone: Tone }) {
  const c = tone === "amber" ? T.amber : tone === "sky" ? T.sky : tone === "red" ? T.red : tone === "neutral" ? T.txM : T.emerald
  return (
    <Card padding={20}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{
          fontSize: 10, color: c, letterSpacing: "0.18em", textTransform: "uppercase",
          fontWeight: 800, fontFamily: "'DM Mono', monospace",
        }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: c, fontFamily: "'DM Mono', monospace", letterSpacing: "-0.02em" }}>
          {value}
        </div>
      </div>
      <div style={{ fontSize: 11, color: T.txM, lineHeight: 1.4 }}>{body}</div>
    </Card>
  )
}
