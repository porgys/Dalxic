"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { T } from "@/components/ops/primitives"

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

interface WorkspaceShellProps {
  children: ReactNode
  accent: AccentKey
  verticalName: string
  orgName: string
  orgCode: string
  fromOps?: boolean
  operator?: string
}

export function WorkspaceShell({
  children,
  accent,
  verticalName,
  orgName,
  orgCode,
  fromOps,
  operator,
}: WorkspaceShellProps) {
  const c = ACCENT_HEX[accent]
  const cL = ACCENT_LIGHT[accent]
  const op = operator ?? "Operator"

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      {/* ── Sticky header bar ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
          padding: "0 24px",
          background: "rgba(4,10,15,0.82)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: `1px solid ${T.border}`,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── Left: brand + org ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Brand */}
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: T.txM,
              letterSpacing: "-0.01em",
            }}
          >
            Dalxic
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              background: `linear-gradient(135deg, ${c}, ${cL})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.01em",
            }}
          >
            {verticalName}
          </span>

          {/* Separator dot */}
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: T.txD,
              flexShrink: 0,
            }}
          />

          {/* Org name */}
          <span style={{ fontSize: 14, fontWeight: 600, color: T.tx }}>
            {orgName}
          </span>
        </div>

        {/* ── Right: links + status + operator ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* All Modules link */}
          <Link
            href={fromOps ? `/ops/tenants/${orgCode}` : `/kiosk/${orgCode}/modules`}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: T.txM,
              textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            All Modules
          </Link>

          {/* Status dot */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: T.emerald,
                boxShadow: `0 0 6px ${T.emerald}`,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: T.txM,
                fontFamily: "'DM Mono', monospace",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Online
            </span>
          </div>

          {/* Operator pill */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: c,
              background: `${c}14`,
              border: `1px solid ${c}28`,
              borderRadius: 20,
              padding: "4px 12px",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {op}
          </span>

          {/* Back to Ops or End Session */}
          {fromOps ? (
            <Link
              href="/ops/tenants"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: T.txM,
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: 8,
                border: `1px solid ${T.border2}`,
                transition: "border-color 0.15s",
              }}
            >
              Back to Ops
            </Link>
          ) : (
            <button
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: T.red,
                background: `${T.red}14`,
                border: `1px solid ${T.red}28`,
                borderRadius: 8,
                padding: "6px 14px",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              End Session
            </button>
          )}
        </div>
      </header>

      {/* ── Page content ── */}
      {children}
    </div>
  )
}
