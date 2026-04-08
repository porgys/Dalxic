/* ═══════════════════════════════════════════════════════════════════
   DALXIC LOGO — Single source of truth
   Used in header and footer. Change once → all instances update.
   Size variants: "lg" (header), "md" (footer), "sm" (compact)
   ═══════════════════════════════════════════════════════════════════ */

const SIZES = {
  lg: { font: "clamp(1.25rem, 2vw, 1.5rem)", weight: 800, dot: 4, glow: "0 0 8px var(--glow), 0 0 16px var(--glow-deep)", spacing: "-0.02em" },
  md: { font: "var(--fs-h3)", weight: 700, dot: 3, glow: "0 0 6px var(--glow)", spacing: "-0.01em" },
  sm: { font: "var(--fs-body)", weight: 700, dot: 2, glow: "0 0 4px var(--glow)", spacing: "0" },
}

export default function DalxicLogo({ size = "lg", subtitle = "Powered By Nexus-7", extraText = null }) {
  const s = SIZES[size] || SIZES.lg
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)" }}>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: s.font,
          fontWeight: s.weight,
          letterSpacing: s.spacing,
          color: "var(--tx)",
        }}
      >
        Dalx
        <span style={{ position: "relative", display: "inline-block" }}>
          <span style={{ color: "var(--tx)" }}>ı</span>
          <span
            style={{
              position: "absolute",
              top: "-1px",
              left: "50%",
              transform: "translateX(-50%)",
              width: s.dot,
              height: s.dot,
              borderRadius: "50%",
              background: "var(--glow)",
              boxShadow: s.glow,
            }}
          />
        </span>
        c
      </span>
      {subtitle && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            fontWeight: 500,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            color: "var(--txD)",
          }}
        >
          {subtitle}
        </span>
      )}
      {extraText && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            fontWeight: 400,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "var(--txD)",
            opacity: 0.5,
          }}
        >
          {extraText}
        </span>
      )}
    </div>
  )
}
