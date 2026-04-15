"use client"
/* ═══════════════════════════════════════════════════════════════
   /ops/releases — Deployments, canary rollouts, feature flags
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import {
  Card, Stat, Pill, Button, Drawer, SearchBar,
  Tabs, Section, T, Tone,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_RELEASES, MockRelease, ReleaseStage } from "@/lib/ops/mock"

type View = "all" | "canary" | "rolling" | "stable" | "draft"

const STAGE_TONE: Record<ReleaseStage, Tone> = {
  draft: "neutral", canary: "sky", rolling: "amber", stable: "emerald", deprecated: "red",
}

export default function OpsReleasesPage() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<MockRelease | null>(null)

  const filtered = useMemo(() => MOCK_RELEASES.filter(r => {
    if (view !== "all" && r.stage !== view) return false
    if (!query) return true
    const q = query.toLowerCase()
    return r.version.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q)
  }), [view, query])

  const totals = {
    total: MOCK_RELEASES.length,
    stable: MOCK_RELEASES.filter(r => r.stage === "stable").length,
    canary: MOCK_RELEASES.filter(r => r.stage === "canary").length,
    breaking: MOCK_RELEASES.filter(r => r.breaking).length,
  }

  return (
    <>
      <OpsPage
        title="Releases"
        subtitle="Every deployment, every feature flag, every canary. Roll forward with confidence."
        icon="releases"
        action={<Button icon="plus">New Release</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Releases"  value={totals.total}    accent="emerald" icon="releases" />
          <Stat label="Stable"           value={totals.stable}  accent="emerald" icon="check" />
          <Stat label="In Canary"        value={totals.canary}  accent="sky"     icon="sparkle" />
          <Stat label="Breaking Changes" value={totals.breaking} accent="amber" icon="bolt" />
        </div>

        <Section
          title="Release Timeline"
          action={<div style={{ width: 320 }}><SearchBar value={query} onChange={setQuery} placeholder="Version, title, summary…" /></div>}
        >
          <Tabs<View>
            value={view} onChange={setView} accent="emerald"
            tabs={[
              { key: "all",     label: "All",     count: MOCK_RELEASES.length },
              { key: "canary",  label: "Canary",  count: MOCK_RELEASES.filter(r => r.stage === "canary").length },
              { key: "rolling", label: "Rolling", count: MOCK_RELEASES.filter(r => r.stage === "rolling").length },
              { key: "stable",  label: "Stable",  count: MOCK_RELEASES.filter(r => r.stage === "stable").length },
              { key: "draft",   label: "Draft",   count: MOCK_RELEASES.filter(r => r.stage === "draft").length },
            ]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            {filtered.map(r => <ReleaseCard key={r.id} release={r} onClick={() => setActive(r)} />)}
          </div>
        </Section>

        <Section title="Feature Flags" sub="Toggles shipped live. Target specific tenants or canary cohorts.">
          <Card padding={0} style={{ overflow: "hidden" }}>
            <FlagRow name="exp-new-dashboard"         scope="3 internal tenants"     enabled lastToggled="2026-04-13 19:30" owner="Yaw Boateng" />
            <FlagRow name="exp-whatsapp-composer"     scope="Canary 15%"             enabled lastToggled="2026-04-15 07:44" owner="Yaw Boateng" />
            <FlagRow name="gate-inst-library"         scope="Scale+ only"            enabled lastToggled="2026-03-28 10:00" owner="Abena Nyarko" />
            <FlagRow name="gate-inst-timetable"       scope="Beta testers"           enabled lastToggled="2026-04-10 14:22" owner="Akosua Ampomah" />
            <FlagRow name="exp-owner-login-as"         scope="Internal ops only"     enabled lastToggled="2026-01-04 09:00" owner="George Gaisie" />
            <FlagRow name="exp-momo-direct-settle"    scope="Off"                    enabled={false} lastToggled="2026-02-20 11:10" owner="Yaw Boateng" last />
          </Card>
        </Section>
      </OpsPage>

      <ReleaseDrawer release={active} onClose={() => setActive(null)} />
    </>
  )
}

function ReleaseCard({ release, onClick }: { release: MockRelease; onClick: () => void }) {
  const c = release.stage === "stable" ? T.emerald : release.stage === "canary" ? T.sky : release.stage === "rolling" ? T.amber : T.txM
  return (
    <div onClick={onClick} style={{
      padding: 20, borderRadius: 14,
      background: `${c}06`, border: `1px solid ${c}22`,
      cursor: "pointer", transition: "transform 0.15s, border-color 0.15s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = `${c}55` }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = `${c}22` }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 800, color: c, letterSpacing: "0.06em" }}>{release.version}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em", marginTop: 4 }}>
            {release.title}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <Pill tone={STAGE_TONE[release.stage]} dot>{release.stage}</Pill>
          {release.breaking && <Pill tone="red">breaking</Pill>}
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.txM, lineHeight: 1.5, marginBottom: 14 }}>{release.summary}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
          {release.releasedOn} · {release.vertical}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 70, height: 5, borderRadius: 999, background: T.surface2, overflow: "hidden" }}>
            <div style={{ width: `${release.rolloutPct}%`, height: "100%", background: c, borderRadius: 999 }} />
          </div>
          <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: c, fontWeight: 700 }}>{release.rolloutPct}%</span>
        </div>
      </div>
    </div>
  )
}

function FlagRow({ name, scope, enabled, lastToggled, owner, last = false }: {
  name: string; scope: string; enabled: boolean; lastToggled: string; owner: string; last?: boolean
}) {
  return (
    <div style={{
      padding: "14px 18px",
      borderBottom: last ? "none" : `1px solid ${T.border}`,
      display: "flex", gap: 14, alignItems: "center",
    }}>
      <div style={{
        width: 36, height: 20, borderRadius: 999,
        background: enabled ? T.emerald : T.surface2,
        position: "relative", flexShrink: 0, border: `1px solid ${enabled ? T.emerald : T.border}`,
      }}>
        <div style={{
          position: "absolute", top: 2, left: enabled ? 18 : 2,
          width: 14, height: 14, borderRadius: "50%", background: "#fff",
          transition: "left 0.2s",
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.tx, fontFamily: "'DM Mono', monospace" }}>{name}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{scope} · last toggled {lastToggled} by {owner}</div>
      </div>
      <Pill tone={enabled ? "emerald" : "neutral"}>{enabled ? "ON" : "OFF"}</Pill>
    </div>
  )
}

function ReleaseDrawer({ release, onClose }: { release: MockRelease | null; onClose: () => void }) {
  if (!release) return <Drawer open={false} onClose={onClose} title="Release">{null}</Drawer>

  return (
    <Drawer
      open={!!release} onClose={onClose}
      title={release.version}
      subtitle={release.title}
      width={560}
      footer={
        <>
          <Button variant="ghost" icon="share">View PR</Button>
          <Button variant="outline" icon="download">Release Notes</Button>
          {release.stage === "canary" && <Button icon="check">Promote →</Button>}
          {release.stage === "rolling" && <Button icon="check">Complete Rollout</Button>}
        </>
      }
    >
      <Card padding={20} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Pill tone={STAGE_TONE[release.stage]} dot>{release.stage}</Pill>
          <Pill tone={release.vertical === "trade" ? "amber" : release.vertical === "institute" ? "sky" : "emerald"}>{release.vertical}</Pill>
          {release.breaking && <Pill tone="red">breaking</Pill>}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}>
          {release.title}
        </div>
        <div style={{ fontSize: 13, color: T.txM, marginTop: 10, lineHeight: 1.5 }}>{release.summary}</div>
      </Card>

      <Section title="Rollout">
        <Card padding={20}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: T.txM }}>{release.rolloutPct}% of tenants</span>
            <span style={{ fontSize: 11, color: T.txD, fontFamily: "'DM Mono', monospace" }}>released {release.releasedOn}</span>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: T.surface2, overflow: "hidden" }}>
            <div style={{
              width: `${release.rolloutPct}%`, height: "100%",
              background: `linear-gradient(90deg, ${T.emerald}, ${T.emeraldL})`,
              borderRadius: 999,
            }} />
          </div>
        </Card>
      </Section>

      <Section title="Affected Modules">
        <Card padding={14}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {release.modules.map(m => <Pill key={m} tone="sky">{m}</Pill>)}
          </div>
        </Card>
      </Section>

      {release.breaking && (
        <Card padding={16} style={{ marginTop: 20, background: `${T.red}0A`, border: `1px dashed ${T.red}40` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="bolt" size={16} color={T.red} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.red, fontFamily: "'DM Mono', monospace" }}>Breaking Change</div>
          </div>
          <div style={{ fontSize: 12, color: T.txM, marginTop: 8, lineHeight: 1.5 }}>
            Announce to tenants 30 days ahead. Provide migration path. Roll back is not trivial.
          </div>
        </Card>
      )}
    </Drawer>
  )
}
