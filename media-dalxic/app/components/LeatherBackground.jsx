"use client"

// ── SVG noise filter for leather grain texture ──────────────────────────────
const LeatherSVGFilters = () => (
  <svg width="0" height="0" style={{ position: "absolute" }}>
    <defs>
      {/* Dark leather grain */}
      <filter id="leather-grain-dark" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.68 0.72"
          numOctaves="4"
          seed="2"
          result="noise"
        />
        <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
        <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blended" />
        <feComponentTransfer in="blended">
          <feFuncA type="linear" slope="1" />
        </feComponentTransfer>
      </filter>

      {/* Leather pore pattern */}
      <pattern id="pore-dark" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
        <rect width="120" height="120" fill="transparent" />
        {[
          [8,12,1.2],[23,7,0.9],[41,15,1.1],[58,4,0.8],[72,18,1.3],[89,9,0.9],[105,14,1.0],
          [3,32,0.8],[18,28,1.2],[35,35,0.9],[52,24,1.1],[67,38,1.0],[83,27,0.8],[98,33,1.2],[115,22,0.9],
          [11,52,1.0],[28,47,1.3],[44,55,0.8],[61,43,1.1],[76,58,0.9],[92,48,1.2],[108,54,1.0],
          [6,72,1.1],[21,68,0.9],[38,75,1.2],[55,64,0.8],[70,78,1.0],[86,68,1.3],[102,74,0.9],[118,70,1.1],
          [14,92,0.9],[30,88,1.1],[47,95,1.0],[63,84,1.2],[79,98,0.8],[95,89,1.1],[111,94,0.9],
          [4,112,1.2],[19,108,0.8],[36,115,1.0],[53,104,1.3],[68,118,0.9],[84,109,1.1],[100,114,0.8],[117,110,1.2],
        ].map(([x,y,r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="rgba(255,255,255,0.03)" />
        ))}
        {[
          [0,40,120,42],[0,82,120,80],[15,0,18,120],[60,0,58,120],[105,0,107,120],
        ].map(([x1,y1,x2,y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.015)" strokeWidth="0.5" />
        ))}
      </pattern>

      {/* Stitching pattern */}
      <pattern id="stitch-pattern" x="0" y="0" width="24" height="16" patternUnits="userSpaceOnUse">
        <rect width="24" height="16" fill="transparent" />
        <path d="M0,4 Q6,1 12,4 Q18,7 24,4" fill="none" stroke="#B8892A" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M0,4 Q6,1 12,4 Q18,7 24,4" fill="none" stroke="#E8C870" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="2 4" />
        <path d="M0,12 Q6,9 12,12 Q18,15 24,12" fill="none" stroke="#8B6520" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M0,12 Q6,9 12,12 Q18,15 24,12" fill="none" stroke="#D4A848" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="2 4" strokeDashoffset="2" />
        <line x1="6" y1="3" x2="6" y2="13" stroke="#9A7530" strokeWidth="0.8" opacity="0.6" />
        <line x1="18" y1="5" x2="18" y2="11" stroke="#9A7530" strokeWidth="0.8" opacity="0.6" />
      </pattern>
    </defs>
  </svg>
)

// ── Vertical stitching bar ─────────────────────────────────────────────────
const VerticalStitchBar = ({ left, width = 24 }) => (
  <div style={{
    position: "fixed",
    left,
    top: 0,
    bottom: 0,
    width,
    zIndex: 101,
    pointerEvents: "none",
  }}>
    {/* Left metal edge */}
    <div style={{
      position: "absolute", left: 0, top: 0, bottom: 0, width: 1.5,
      background: "linear-gradient(180deg, transparent 1%, #3A2510 6%, #8B6420 30%, #C8942A 50%, #8B6420 70%, #3A2510 94%, transparent 99%)",
    }} />

    {/* Left stitch column */}
    <div style={{
      position: "absolute", left: 3, top: 0, bottom: 0, width: 6,
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='20'%3E%3Cpath d='M3,0 Q0.5,5 3,10 Q5.5,15 3,20' fill='none' stroke='%23B8892A' stroke-width='1.2'/%3E%3Cpath d='M3,0 Q0.5,5 3,10 Q5.5,15 3,20' fill='none' stroke='%23E8C870' stroke-width='0.4' stroke-dasharray='2 3'/%3E%3C/svg%3E\")",
      backgroundRepeat: "repeat-y",
      backgroundSize: "6px 20px",
    }} />

    {/* Bar body — braided leather */}
    <div style={{
      position: "absolute", left: 7, right: 7, top: 0, bottom: 0,
      background: "linear-gradient(90deg, #1A1008 0%, #2A1C0A 40%, #1E1206 60%, #1A1008 100%)",
      boxShadow: "inset 1px 0 2px rgba(200,148,42,0.06), inset -1px 0 2px rgba(0,0,0,0.4)",
    }} />

    {/* Right stitch column */}
    <div style={{
      position: "absolute", right: 3, top: 0, bottom: 0, width: 6,
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='20'%3E%3Cpath d='M3,0 Q5.5,5 3,10 Q0.5,15 3,20' fill='none' stroke='%238B6520' stroke-width='1.2'/%3E%3Cpath d='M3,0 Q5.5,5 3,10 Q0.5,15 3,20' fill='none' stroke='%23D4A848' stroke-width='0.4' stroke-dasharray='2 3' stroke-dashoffset='2'/%3E%3C/svg%3E\")",
      backgroundRepeat: "repeat-y",
      backgroundSize: "6px 20px",
    }} />

    {/* Right metal edge */}
    <div style={{
      position: "absolute", right: 0, top: 0, bottom: 0, width: 1.5,
      background: "linear-gradient(180deg, transparent 1%, #2A1808 6%, #6B4A18 30%, #9A6E20 50%, #6B4A18 70%, #2A1808 94%, transparent 99%)",
      boxShadow: "1px 0 6px rgba(0,0,0,0.4)",
    }} />
  </div>
)

// ── Main LeatherBackground component ───────────────────────────────────────
// Props:
//   stitchLeft — px position for the vertical stitch lining (default 240 = sidebar edge)
//   baseColor  — tint the leather to blend with existing palette
export default function LeatherBackground({ children, stitchLeft = 240, baseColor = "#060A14", style = {} }) {
  return (
    <div style={{
      position: "relative",
      width: "100%",
      minHeight: "100vh",
      overflow: "hidden",
      ...style,
    }}>
      <style>{`
        @keyframes barReveal {
          from { opacity: 0; transform: scaleX(0.96); }
          to   { opacity: 1; transform: scaleX(1); }
        }
      `}</style>

      <LeatherSVGFilters />

      {/* ── DARK LEATHER — full background ── */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(160deg, #2A1808 0%, #1E1004 25%, #180E02 50%, #221608 75%, #2A1808 100%)",
        filter: "url(#leather-grain-dark)",
      }}>
        {/* Pore texture overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url(#pore-dark)",
          opacity: 0.5,
        }} />
        {/* Specular highlight — top left light source */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 60% 40% at 20% 10%, rgba(120,80,40,0.18) 0%, transparent 70%)",
        }} />
        {/* Subtle vignette */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 120% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)",
        }} />
      </div>

      {/* ── VERTICAL STITCH LINING — sidebar edge ── */}
      <VerticalStitchBar left={stitchLeft - 12} width={24} />

      {/* ── CONTENT ── */}
      <div style={{ position: "relative", zIndex: 20 }}>
        {children}
      </div>
    </div>
  )
}
