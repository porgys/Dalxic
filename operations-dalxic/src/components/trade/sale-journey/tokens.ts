/* ═══════════════════════════════════════════════════════════════
   Sale Journey — design tokens
   Shared across all spine+slot components so the surface stays
   consistent even when new slot plug-ins get written.
   ═══════════════════════════════════════════════════════════════ */

import type { CSSProperties } from "react"

export const EMERALD = "#10B981"
export const EMERALD_L = "#34D399"
export const EMERALD_GL = "#6EE7B7"
export const TRADE = "#F59E0B"
export const TRADE_L = "#FBBF24"
export const BG = "#040A0F"
export const BG_DEEP = "#020608"
export const INK = "#ECF5F0"
export const INK_DIM = "#6B9B8A"
export const INK_FAINT = "#3A6B5A"

export const FONT_DISPLAY = "'Space Grotesk', 'Plus Jakarta Sans', sans-serif"
export const FONT_BODY = "'DM Sans', sans-serif"
export const FONT_MONO = "'DM Mono', 'JetBrains Mono', monospace"

export const glass: CSSProperties = {
  background: "rgba(16,185,129,0.03)",
  border: "1px solid rgba(16,185,129,0.08)",
  borderRadius: 16,
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  transform: "translateZ(0)",
  willChange: "transform",
}

export const glassBright: CSSProperties = {
  background: "rgba(16,185,129,0.06)",
  border: "1px solid rgba(16,185,129,0.14)",
  borderRadius: 18,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
}

export const input: CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  fontSize: 13,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(16,185,129,0.12)",
  color: INK,
  outline: "none",
  fontFamily: FONT_BODY,
}

export const label: CSSProperties = {
  display: "block",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: INK_FAINT,
  marginBottom: 5,
}

export const btnPrimary: CSSProperties = {
  padding: "12px 22px",
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#fff",
  cursor: "pointer",
  background: `linear-gradient(135deg, ${EMERALD}, #059669)`,
  border: "none",
  fontFamily: FONT_BODY,
  boxShadow: `0 4px 16px ${EMERALD}25`,
}

export const btnGhost: CSSProperties = {
  padding: "10px 18px",
  borderRadius: 10,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.04em",
  color: INK_DIM,
  background: "transparent",
  border: `1px solid ${EMERALD}20`,
  cursor: "pointer",
  fontFamily: FONT_BODY,
}

export const ghsFmt = (cents: number): string => {
  const ghs = cents / 100
  return `GHS ${ghs.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const ghs = (amount: number): string =>
  `GHS ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
