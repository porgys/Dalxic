/* ═══════════════════════════════════════════════════════════════════
   CONFIDENCE RING — Animated SVG circle gauge
   Master component: stroke width, animation curve, glow all here.
   Change once → workstation + reports update.
   ═══════════════════════════════════════════════════════════════════ */

export default function ConfRing({ value, color, size = 120 }) {
  const r = size / 2 - 10, circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1E2A4A" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)", filter: "drop-shadow(0 0 6px " + color + "60)" }} />
    </svg>
  )
}
