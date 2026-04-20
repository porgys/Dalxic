"use client"
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Stat, Card, Pill, Tabs, Drawer, DataTable, Column, Section, T } from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"
import { dateShort } from "@/lib/ops/format"
import { MOCK_RELEASES, MOCK_MODULES, type MockRelease, type ReleaseStage } from "@/lib/ops/mock"

/* ───── Feature Flags (inline data) ───── */
interface FeatureFlag {
  id: string
  name: string
  scope: string
  enabled: boolean
  lastToggled: string
}

const FEATURE_FLAGS: FeatureFlag[] = [
  { id: "ff-01", name: "exp-new-dashboard",      scope: "internal",  enabled: true,  lastToggled: "2026-04-13" },
  { id: "ff-02", name: "whatsapp-bulk-preview",   scope: "canary",    enabled: true,  lastToggled: "2026-04-14" },
  { id: "ff-03", name: "label-designer-v2",       scope: "rolling",   enabled: true,  lastToggled: "2026-04-11" },
  { id: "ff-04", name: "timetable-beta",          scope: "canary",    enabled: true,  lastToggled: "2026-04-10" },
  { id: "ff-05", name: "transport-preview",        scope: "internal",  enabled: false, lastToggled: "2026-04-08" },
  { id: "ff-06", name: "dark-mode-kiosk",          scope: "internal",  enabled: false, lastToggled: "2026-03-28" },
  { id: "ff-07", name: "nhis-claims-module",       scope: "draft",     enabled: false, lastToggled: "2026-03-15" },
  { id: "ff-08", name: "gra-efiling-live",         scope: "stable",    enabled: false, lastToggled: "2026-02-20" },
]

/* ───── Derived KPIs ───── */
const totalReleases = MOCK_RELEASES.length
const stableCount = MOCK_RELEASES.filter(r => r.stage === "stable").length
const canaryCount = MOCK_RELEASES.filter(r => r.stage === "canary").length
const breakingCount = MOCK_RELEASES.filter(r => r.breaking).length

/* ───── Types ───── */
type TabKey = "all" | "canary" | "rolling" | "stable" | "draft"

const TABS: { key: TabKey; label: string; icon?: IconName }[] = [
  { key: "all",     label: "All",     icon: "releases" },
  { key: "canary",  label: "Canary",  icon: "flag" },
  { key: "rolling", label: "Rolling", icon: "trending" },
  { key: "stable",  label: "Stable",  icon: "check" },
  { key: "draft",   label: "Draft",   icon: "edit" },
]

const STAGE_TONE: Record<ReleaseStage, "emerald" | "amber" | "sky" | "neutral" | "red"> = {
  draft: "neutral",
  canary: "amber",
  rolling: "sky",
  stable: "emerald",
  deprecated: "red",
}

const VERTICAL_TONE: Record<string, "emerald" | "amber" | "sky" | "copper" | "neutral"> = {
  trade: "amber", health: "copper", institute: "sky", universal: "emerald", restaurant: "amber",
  salon: "emerald", gym: "emerald", mechanic: "amber", pharmacy: "emerald", law: "neutral", hotel: "sky",
}

export default function ReleasesPage() {
  const [tab, setTab] = useState<TabKey>("all")
  const [selected, setSelected] = useState<MockRelease | null>(null)
  const [flags, setFlags] = useState(FEATURE_FLAGS)

  const filtered = useMemo(() => {
    return MOCK_RELEASES.filter(r => {
      if (tab !== "all" && r.stage !== tab) return false
      return true
    })
  }, [tab])

  /* Drawer data */
  const affectedModules = selected ? MOCK_MODULES.filter(m => selected.modules.includes(m.id)) : []

  /* Toggle flag */
  function toggleFlag(id: string) {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f))
  }

  return (
    <OpsPage title="Deployments" subtitle="Release pipeline, rollout stages, feature flags." icon="releases">
      {/* ───── 4 Stats ───── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <Stat label="Total Releases" value={totalReleases} icon="releases" />
        <Stat label="Stable" value={stableCount} sub="Fully rolled out" icon="check" accent="emerald" />
        <Stat label="In Canary" value={canaryCount} sub="Partial rollout" icon="flag" accent="amber" />
        <Stat label="Breaking Changes" value={breakingCount} sub="Require migration" icon="alert" accent="amber" />
      </div>

      {/* ───── Tabs ───── */}
      <Tabs tabs={TABS.map(t => ({ ...t, count: t.key === "all" ? MOCK_RELEASES.length : MOCK_RELEASES.filter(r => r.stage === t.key).length }))} value={tab} onChange={setTab} />

      {/* ───── 2-Column Release Cards ───── */}
      <Section title="Releases" sub={`${filtered.length} releases`}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {filtered.map(release => (
            <Card key={release.id} hover style={{ cursor: "pointer" }}>
              <div onClick={() => setSelected(release)}>
                {/* Version + Title */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.emerald, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{release.version}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{release.title}</div>
                  </div>
                  <div style={{ fontSize: 11, color: T.txD, fontFamily: "'DM Mono', monospace", flexShrink: 0, marginLeft: 12 }}>
                    {dateShort(release.releasedOn)}
                  </div>
                </div>

                {/* Summary */}
                <div style={{ fontSize: 12, color: T.txM, lineHeight: 1.5, marginBottom: 14, minHeight: 36 }}>{release.summary}</div>

                {/* Pills row */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  <Pill tone={STAGE_TONE[release.stage]} dot>{release.stage}</Pill>
                  <Pill tone={VERTICAL_TONE[release.vertical] ?? "neutral"}>{release.vertical}</Pill>
                  {release.breaking && <Pill tone="red">Breaking</Pill>}
                </div>

                {/* Rollout progress */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>Rollout</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.tx, fontFamily: "'DM Mono', monospace" }}>{release.rolloutPct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: T.surface2 }}>
                    <div style={{
                      height: "100%", borderRadius: 3, transition: "width 0.4s",
                      width: `${release.rolloutPct}%`,
                      background: release.rolloutPct === 100 ? T.emerald : release.rolloutPct >= 50 ? T.sky : T.amber,
                    }} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        {filtered.length === 0 && (
          <Card style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 13, color: T.txM }}>No releases match this filter.</div>
          </Card>
        )}
      </Section>

      {/* ───── Feature Flags ───── */}
      <Section title="Feature Flags" sub={`${flags.filter(f => f.enabled).length} of ${flags.length} enabled`}>
        <Card padding={0} style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ padding: "14px 18px", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, textAlign: "left", fontFamily: "'DM Mono', monospace" }}>Flag</th>
                  <th style={{ padding: "14px 18px", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, textAlign: "left", fontFamily: "'DM Mono', monospace" }}>Scope</th>
                  <th style={{ padding: "14px 18px", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, textAlign: "center", fontFamily: "'DM Mono', monospace" }}>Toggle</th>
                  <th style={{ padding: "14px 18px", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, textAlign: "left", fontFamily: "'DM Mono', monospace" }}>Last Toggled</th>
                  <th style={{ padding: "14px 18px", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, textAlign: "center", fontFamily: "'DM Mono', monospace" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((flag, idx) => (
                  <tr key={flag.id} style={{ borderBottom: idx < flags.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <td style={{ padding: "12px 18px", fontSize: 13, fontWeight: 600, color: T.tx, fontFamily: "'DM Mono', monospace" }}>{flag.name}</td>
                    <td style={{ padding: "12px 18px" }}>
                      <Pill tone={flag.scope === "stable" ? "emerald" : flag.scope === "canary" ? "amber" : flag.scope === "rolling" ? "sky" : "neutral"}>{flag.scope}</Pill>
                    </td>
                    <td style={{ padding: "12px 18px", textAlign: "center" }}>
                      <button
                        onClick={() => toggleFlag(flag.id)}
                        style={{
                          width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                          background: flag.enabled ? T.emerald : T.surface2,
                          position: "relative", transition: "background 0.2s",
                          display: "inline-block",
                        }}
                      >
                        <span style={{
                          position: "absolute", top: 3, left: flag.enabled ? 23 : 3,
                          width: 18, height: 18, borderRadius: "50%",
                          background: flag.enabled ? "#fff" : T.txD,
                          transition: "left 0.2s",
                        }} />
                      </button>
                    </td>
                    <td style={{ padding: "12px 18px", fontSize: 12, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{dateShort(flag.lastToggled)}</td>
                    <td style={{ padding: "12px 18px", textAlign: "center" }}>
                      <Pill tone={flag.enabled ? "emerald" : "neutral"} dot>{flag.enabled ? "ON" : "OFF"}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* ───── Drawer ───── */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.version} \u2014 ${selected.title}` : ""} subtitle={selected ? `Released ${dateShort(selected.releasedOn)}` : ""} width={560}>
        {selected && (
          <div>
            {/* Stage + Vertical pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <Pill tone={STAGE_TONE[selected.stage]} dot>{selected.stage}</Pill>
              <Pill tone={VERTICAL_TONE[selected.vertical] ?? "neutral"}>{selected.vertical}</Pill>
              {selected.breaking && <Pill tone="red">Breaking Change</Pill>}
            </div>

            {/* Title + Summary */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 8 }}>{selected.title}</div>
              <div style={{ fontSize: 13, color: T.txM, lineHeight: 1.6 }}>{selected.summary}</div>
            </div>

            {/* Rollout progress */}
            <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: T.surface2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace" }}>Rollout Progress</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{selected.rolloutPct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: T.bg }}>
                <div style={{
                  height: "100%", borderRadius: 4, transition: "width 0.4s",
                  width: `${selected.rolloutPct}%`,
                  background: selected.rolloutPct === 100
                    ? `linear-gradient(90deg, ${T.emerald}, #059669)`
                    : selected.rolloutPct >= 50
                    ? `linear-gradient(90deg, ${T.sky}, #0284C7)`
                    : `linear-gradient(90deg, ${T.amber}, #D97706)`,
                }} />
              </div>
            </div>

            {/* Affected Modules */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Affected Modules</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {affectedModules.length > 0 ? affectedModules.map(m => (
                  <span key={m.id} style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, background: `${T.emerald}10`, color: T.emeraldL, fontWeight: 600 }}>
                    {m.name}
                  </span>
                )) : selected.modules.map(modId => (
                  <span key={modId} style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, background: `${T.emerald}10`, color: T.emeraldL, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
                    {modId}
                  </span>
                ))}
              </div>
            </div>

            {/* Breaking callout */}
            {selected.breaking && (
              <div style={{
                padding: 16, borderRadius: 12,
                background: `${T.red}08`, border: `1px solid ${T.red}25`,
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.red}15`, display: "flex", alignItems: "center", justifyContent: "center", color: T.red, flexShrink: 0 }}>
                  <Icon name="alert" size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 4 }}>Breaking Change</div>
                  <div style={{ fontSize: 12, color: T.txM, lineHeight: 1.5 }}>
                    This release includes breaking changes that may require migration. Tenants should review the changelog before updating.
                  </div>
                </div>
              </div>
            )}

            {/* Release metadata */}
            <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: T.surface2 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Metadata</div>
              {[
                { label: "Release ID", val: selected.id },
                { label: "Version", val: selected.version },
                { label: "Released", val: dateShort(selected.releasedOn) },
                { label: "Stage", val: selected.stage },
                { label: "Vertical", val: selected.vertical },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.txM }}>{l.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.tx, fontFamily: "'DM Mono', monospace", textTransform: "capitalize" }}>{l.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </OpsPage>
  )
}
