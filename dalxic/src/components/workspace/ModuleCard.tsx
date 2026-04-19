"use client"

import { useState } from "react"
import Link from "next/link"
import { Icon, IconName } from "@/components/ops/Icon"
import { T } from "@/components/ops/primitives"
import type { MockModule } from "@/lib/ops/mock"

type AccentKey = "amber" | "copper" | "sky" | "emerald"

const ACCENT_HEX: Record<AccentKey, string> = {
  amber: T.amber,
  copper: T.copper,
  sky: T.sky,
  emerald: T.emerald,
}

function moduleHref(moduleId: string, basePath: string): string {
  const direct = [
    "pos", "stock", "contacts", "catalogue",
    "front-desk", "doctor", "waiting-room", "nurse-station",
    "lab", "radiology", "ultrasound", "injection-room", "pharmacy",
    "ward", "icu", "maternity", "billing-health", "bookkeeping",
    "accounting", "shifts", "payroll", "reports", "audit", "roles",
    "expenses", "suppliers", "po", "branches", "tables",
    "loyalty", "fees", "membership", "attendance",
    "enrollment", "gradebook",
  ]
  if (direct.includes(moduleId)) return `${basePath}/${moduleId}`
  switch (moduleId) {
    case "inventory":
      return `${basePath}/stock`
    case "customers":
      return `${basePath}/contacts`
    default:
      return `${basePath}/catalogue`
  }
}

interface ModuleCardProps {
  module: MockModule
  accent: AccentKey
  basePath: string
  isActive: boolean
}

export function ModuleCard({ module, accent, basePath, isActive }: ModuleCardProps) {
  const [hovered, setHovered] = useState(false)
  const c = ACCENT_HEX[accent]
  const locked = !isActive

  const statusPill =
    module.status === "preview"
      ? "Preview"
      : module.status === "beta"
        ? "Beta"
        : null

  const pillColor =
    module.status === "preview" ? T.amber : module.status === "beta" ? T.sky : c

  const cardStyle: React.CSSProperties = {
    position: "relative",
    minHeight: 120,
    borderRadius: 14,
    background: "rgba(8,20,16,0.65)",
    border: `1px solid ${hovered && !locked ? `${c}38` : T.border}`,
    padding: "18px 16px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    cursor: locked ? "not-allowed" : "pointer",
    opacity: locked ? 0.5 : 1,
    transform: hovered && !locked ? "translateY(-2px)" : "none",
    transition: "transform 0.18s, border-color 0.18s, opacity 0.18s",
    textDecoration: "none",
  }

  const inner = (
    <>
      {/* Top-right badge */}
      {statusPill && (
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            fontSize: 9,
            fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: pillColor,
            background: `${pillColor}18`,
            border: `1px solid ${pillColor}30`,
            borderRadius: 6,
            padding: "2px 7px",
          }}
        >
          {statusPill}
        </span>
      )}
      {locked && !statusPill && (
        <span style={{ position: "absolute", top: 12, right: 12 }}>
          <Icon name="lock" size={14} color={T.txD} />
        </span>
      )}

      {/* Icon badge */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${c}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={module.icon as IconName} size={18} color={c} />
      </div>

      {/* Title */}
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: T.tx,
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1.2,
        }}
      >
        {module.name}
      </span>

      {/* Blurb */}
      <span
        style={{
          fontSize: 11,
          color: T.txM,
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {module.description}
      </span>
    </>
  )

  if (locked) {
    return (
      <div
        style={cardStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {inner}
      </div>
    )
  }

  return (
    <Link
      href={moduleHref(module.id, basePath)}
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {inner}
    </Link>
  )
}
