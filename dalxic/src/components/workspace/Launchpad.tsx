"use client"

import { T } from "@/components/ops/primitives"
import { ModuleCard } from "./ModuleCard"
import type { MockModule } from "@/lib/ops/mock"

type AccentKey = "amber" | "copper" | "sky" | "emerald"

const ACCENT_HEX: Record<AccentKey, string> = {
  amber: T.amber,
  copper: T.copper,
  sky: T.sky,
  emerald: T.emerald,
}

const ACCENT_LIGHT: Record<AccentKey, string> = {
  amber: T.amberL,
  copper: T.copperL,
  sky: "#38BDF8",
  emerald: T.emeraldL,
}

interface LaunchpadProps {
  orgName: string
  orgCode: string
  modules: MockModule[]
  activeModuleIds: string[]
  accent: AccentKey
  verticalLabel: string
  basePath: string
  branches: number
}

export function Launchpad({
  orgName,
  orgCode,
  modules,
  activeModuleIds,
  accent,
  verticalLabel,
  basePath,
  branches,
}: LaunchpadProps) {
  const c = ACCENT_HEX[accent]
  const cL = ACCENT_LIGHT[accent]

  const gaCount = modules.filter((m) => m.status === "ga").length
  const previewCount = modules.filter((m) => m.status === "preview").length

  // Group modules by category
  const groups: Record<string, MockModule[]> = {}
  for (const m of modules) {
    if (!groups[m.category]) groups[m.category] = []
    groups[m.category].push(m)
  }

  const heroStats: { label: string; value: string | number }[] = [
    { label: "Modules Live", value: gaCount },
    { label: "Preview", value: previewCount },
    { label: "Currency", value: "GHS" },
    { label: "Branches", value: branches },
  ]

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        background: T.bg,
        padding: "0 32px 80px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1480, margin: "0 auto" }}>
        {/* ── Hero Section ── */}
        <div
          style={{
            textAlign: "center",
            paddingTop: 72,
            paddingBottom: 48,
          }}
        >
          {/* Vertical label */}
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: c,
              marginBottom: 14,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {verticalLabel} Workstation
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 48,
              fontWeight: 800,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              margin: "0 0 12px",
            }}
          >
            <span style={{ color: T.tx }}>Your</span>
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${c}, ${cL})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {orgName}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 14,
              color: T.txM,
              maxWidth: 600,
              margin: "0 auto 32px",
              lineHeight: 1.6,
            }}
          >
            All your modules in one place. Select a module to begin, or explore
            preview tools coming to your plan.
          </p>

          {/* Hero stats */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            {heroStats.map((s) => (
              <div
                key={s.label}
                style={{
                  minWidth: 120,
                  padding: "14px 20px",
                  borderRadius: 12,
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    color: T.txM,
                    fontFamily: "'DM Mono', monospace",
                    marginBottom: 4,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: T.tx,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Module Groups ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          {Object.entries(groups).map(([groupName, groupModules]) => (
            <section key={groupName}>
              {/* Group header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: c,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {groupName}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: T.txD,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {groupModules.length}
                </span>
              </div>

              {/* Card grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 14,
                }}
              >
                {groupModules.map((mod) => (
                  <ModuleCard
                    key={mod.id}
                    module={mod}
                    accent={accent}
                    basePath={basePath}
                    isActive={activeModuleIds.includes(mod.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
