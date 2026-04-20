"use client"
import { useState } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Card, Pill, T, Button } from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"
import { MOCK_PLATFORM_SETTINGS } from "@/lib/ops/mock"

type SettingsTab = "brand" | "contacts" | "tax" | "payments" | "limits" | "webhooks" | "keys"

const TABS: { key: SettingsTab; label: string; subtitle: string; icon: IconName }[] = [
  { key: "brand",    label: "Brand",     subtitle: "Identity",       icon: "flag" },
  { key: "contacts", label: "Contacts",  subtitle: "Communication",  icon: "mail" },
  { key: "tax",      label: "Tax",       subtitle: "Rates & tiers",  icon: "tax" },
  { key: "payments", label: "Payments",  subtitle: "Providers",      icon: "billing" },
  { key: "limits",   label: "Limits",    subtitle: "Constraints",    icon: "shield" },
  { key: "webhooks", label: "Webhooks",  subtitle: "Integrations",   icon: "bolt" },
  { key: "keys",     label: "Keys",      subtitle: "API access",     icon: "lock" },
]

const S = MOCK_PLATFORM_SETTINGS

/* Row key-value helper */
function RowKV({ label, value, mono, swatch }: { label: string; value: string; mono?: boolean; swatch?: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 0",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{ fontSize: 13, color: T.txM }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {swatch && (
          <div style={{ width: 16, height: 16, borderRadius: 4, background: swatch, border: `1px solid ${T.border2}` }} />
        )}
        <div style={{ fontSize: 13, fontWeight: 600, color: T.tx, fontFamily: mono ? "'DM Mono', monospace" : undefined }}>
          {value}
        </div>
      </div>
    </div>
  )
}

/* Panel header */
function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}>{title}</h2>
      <p style={{ fontSize: 12, color: T.txM, marginTop: 4 }}>{subtitle}</p>
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("brand")

  return (
    <OpsPage title="Platform Settings" subtitle="Global configuration for the entire Dalxic platform." icon="settings">
      <div style={{ display: "flex", gap: 24 }}>
        {/* Tab rail */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <Card padding={8}>
            {TABS.map(t => {
              const active = activeTab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "12px 14px",
                    borderRadius: 10, border: "none",
                    background: active ? `${T.emerald}12` : "transparent",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    textAlign: "left",
                  }}
                  onMouseEnter={!active ? (e) => { (e.currentTarget as HTMLButtonElement).style.background = `rgba(16,185,129,0.05)` } : undefined}
                  onMouseLeave={!active ? (e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" } : undefined}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: active ? `${T.emerald}18` : `rgba(16,185,129,0.06)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon name={t.icon} size={13} color={active ? T.emerald : T.txD} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: active ? 700 : 600, color: active ? T.emerald : T.tx }}>{t.label}</div>
                    <div style={{ fontSize: 9, color: active ? T.emerald : T.txD, fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 1 }}>{t.subtitle}</div>
                  </div>
                </button>
              )
            })}
          </Card>
        </div>

        {/* Panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Card>
            {/* BRAND */}
            {activeTab === "brand" && (
              <div>
                <PanelHeader title="Brand" subtitle="Platform identity and visual configuration." />
                <RowKV label="Platform Name" value={S.brand.name} />
                <RowKV label="Parent Company" value={S.brand.parent} />
                <RowKV label="Legal Name" value={S.brand.legalName} />
                <RowKV label="Accent Color" value={S.brand.accent} mono swatch={S.brand.accent} />
              </div>
            )}

            {/* CONTACTS */}
            {activeTab === "contacts" && (
              <div>
                <PanelHeader title="Contacts" subtitle="Platform communication channels." />
                <RowKV label="Support Email" value={S.contacts.supportEmail} mono />
                <RowKV label="Billing Email" value={S.contacts.billingEmail} mono />
                <RowKV label="Phone" value={S.contacts.phone} mono />
                <RowKV label="WhatsApp" value={S.contacts.whatsapp} mono />
              </div>
            )}

            {/* TAX */}
            {activeTab === "tax" && (
              <div>
                <PanelHeader title="Tax Configuration" subtitle="Ghana Revenue Authority rates and SSNIT contribution tiers." />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
                  {[
                    { label: "VAT", rate: `${S.tax.vat}%`, desc: "Value Added Tax" },
                    { label: "NHIL", rate: `${S.tax.nhil}%`, desc: "National Health Insurance Levy" },
                    { label: "GETFund", rate: `${S.tax.getfund}%`, desc: "Ghana Education Trust Fund" },
                    { label: "COVID Levy", rate: `${S.tax.covidLevy}%`, desc: "COVID-19 Health Recovery Levy" },
                  ].map(t => (
                    <div key={t.label} style={{
                      background: `rgba(16,185,129,0.04)`,
                      borderRadius: 12,
                      padding: "16px 18px",
                      border: `1px solid ${T.border}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{t.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: T.emerald, fontFamily: "'Space Grotesk', sans-serif" }}>{t.rate}</div>
                      </div>
                      <div style={{ fontSize: 11, color: T.txD }}>{t.desc}</div>
                    </div>
                  ))}
                </div>

                {/* SSNIT tiers */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>
                    SSNIT Contribution Tiers
                  </div>
                  <Card padding={0} style={{ overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                          <th style={{ padding: "12px 16px", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, textAlign: "left", fontFamily: "'DM Mono', monospace" }}>Tier</th>
                          <th style={{ padding: "12px 16px", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, textAlign: "right", fontFamily: "'DM Mono', monospace" }}>Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "Tier 1 — Employer", value: `${S.tax.ssnitTier1Employer}%` },
                          { label: "Tier 2 — Employer", value: `${S.tax.ssnitTier2Employer}%` },
                          { label: "Employee Contribution", value: `${S.tax.ssnitEmployee}%` },
                        ].map((r, i) => (
                          <tr key={r.label} style={{ borderBottom: i === 2 ? "none" : `1px solid ${T.border}` }}>
                            <td style={{ padding: "12px 16px", fontSize: 13, color: T.tx }}>{r.label}</td>
                            <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: T.emerald, textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{r.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                </div>
              </div>
            )}

            {/* PAYMENTS */}
            {activeTab === "payments" && (
              <div>
                <PanelHeader title="Payment Providers" subtitle="Mobile money and card acquirer configuration." />
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>
                    MoMo Providers
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {S.payments.momoProviders.map(p => (
                      <Pill key={p} tone="amber">{p}</Pill>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>
                    Card Providers
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {S.payments.cardProviders.map(p => (
                      <Pill key={p} tone="sky">{p}</Pill>
                    ))}
                  </div>
                </div>
                <RowKV label="Settlement Window" value={`T+${S.payments.settlementDays} day${S.payments.settlementDays > 1 ? "s" : ""}`} />
              </div>
            )}

            {/* LIMITS */}
            {activeTab === "limits" && (
              <div>
                <PanelHeader title="Platform Limits" subtitle="Default constraints for tenant accounts." />
                <RowKV label="Free Trial" value={`${S.limits.freeTrialDays} days`} />
                <RowKV label="Max Upload" value={`${S.limits.maxFileUploadMB} MB`} />
                <RowKV label="Session Timeout" value={`${S.limits.sessionTimeoutMins} mins`} />
                <RowKV label="PIN Attempts" value={`${S.limits.pinAttempts} tries`} />
              </div>
            )}

            {/* WEBHOOKS */}
            {activeTab === "webhooks" && (
              <div>
                <PanelHeader title="Webhooks" subtitle="Outbound event notifications to external services." />
                <Card padding={0} style={{ overflow: "hidden", marginBottom: 20 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        <th style={{ padding: "12px 16px", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, textAlign: "left", fontFamily: "'DM Mono', monospace" }}>Event</th>
                        <th style={{ padding: "12px 16px", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, textAlign: "left", fontFamily: "'DM Mono', monospace" }}>URL</th>
                        <th style={{ padding: "12px 16px", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, textAlign: "center", fontFamily: "'DM Mono', monospace" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {S.webhooks.map((wh, i) => (
                        <tr key={wh.id} style={{ borderBottom: i === S.webhooks.length - 1 ? "none" : `1px solid ${T.border}` }}>
                          <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: T.tx, fontFamily: "'DM Mono', monospace" }}>{wh.event}</td>
                          <td style={{ padding: "12px 16px", fontSize: 11, color: T.txD, fontFamily: "'DM Mono', monospace", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wh.url}</td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <Pill tone={wh.active ? "emerald" : "neutral"} dot>{wh.active ? "Active" : "Inactive"}</Pill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
                <Button variant="outline" icon="plus" size="sm">Add Webhook</Button>
              </div>
            )}

            {/* KEYS */}
            {activeTab === "keys" && (
              <div>
                <PanelHeader title="API Keys" subtitle="Manage platform API credentials. Handle with care." />
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
                  {S.apiKeys.map(k => (
                    <div key={k.id} style={{
                      background: `rgba(16,185,129,0.04)`,
                      borderRadius: 12,
                      padding: "18px 20px",
                      border: `1px solid ${T.border}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, marginBottom: 2 }}>{k.label}</div>
                          <div style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace" }}>
                            Created {k.createdOn} {"\u00b7"} Last used {k.lastUsed}
                          </div>
                        </div>
                        <Pill tone="emerald" dot>Active</Pill>
                      </div>
                      <div style={{
                        fontSize: 12, color: T.emeraldL, fontFamily: "'DM Mono', monospace",
                        background: `rgba(16,185,129,0.06)`,
                        padding: "8px 12px", borderRadius: 8,
                        marginBottom: 12,
                        letterSpacing: "0.04em",
                      }}>
                        {k.keyMasked}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button variant="ghost" size="sm" icon="copy" onClick={() => navigator.clipboard.writeText(k.keyMasked)}>Copy</Button>
                        <Button variant="ghost" size="sm" icon="refresh">Rotate</Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Danger zone */}
                <div style={{
                  border: `2px dashed ${T.red}`,
                  borderRadius: 14,
                  padding: "18px 24px",
                  background: `${T.red}06`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Icon name="alert" size={16} color={T.red} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.red }}>Danger Zone</div>
                  </div>
                  <div style={{ fontSize: 12, color: T.txM, marginBottom: 14, lineHeight: 1.5 }}>
                    Revoking all keys will immediately disable every external integration using the platform API. This action cannot be undone — new keys must be issued and distributed manually.
                  </div>
                  <Button variant="danger" size="sm" icon="trash">Revoke All Keys</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </OpsPage>
  )
}
