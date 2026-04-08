"use client"

/**
 * DalxicLogo — inline SVG logo component (no background, transparent)
 * Props:
 *   size      — controls width (height scales proportionally). Default 900.
 *   showText  — show "DALXIC" + "AI" text below the D. Default true.
 *   glow      — enable the drop-shadow glow filter. Default true.
 *   className — optional CSS class
 *   style     — optional inline styles
 */
export default function DalxicLogo({ size = 900, showText = true, glow = true, className, style }) {
  const scale = size / 900
  const h = showText ? 620 : 400
  return (
    <svg
      width={size}
      height={h * scale}
      viewBox={`0 0 900 ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Dalxic"
      className={className}
      style={{
        display: "block",
        ...(glow ? { filter: "drop-shadow(0 0 50px rgba(99,102,241,0.45)) drop-shadow(0 0 100px rgba(167,139,250,0.2))" } : {}),
        ...style,
      }}
    >
      <defs>
        {/* Metallic blue-cyan gradient for the D */}
        <linearGradient id="dlx-metalD" x1="25%" y1="15%" x2="78%" y2="88%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#a0f8ff"/>
          <stop offset="32%" stopColor="#00e4ff"/>
          <stop offset="55%" stopColor="#00b8ff"/>
          <stop offset="78%" stopColor="#0088dd"/>
          <stop offset="100%" stopColor="#003d88"/>
        </linearGradient>

        {/* Neon highlight glow */}
        <linearGradient id="dlx-highlight" x1="18%" y1="8%" x2="75%" y2="65%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95"/>
          <stop offset="48%" stopColor="#a0f8ff" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#00e4ff" stopOpacity="0"/>
        </linearGradient>

        {/* Metallic silver text gradient */}
        <linearGradient id="dlx-textMetal" x1="0%" y1="0%" x2="0%" y2="100%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#f0f8ff"/>
          <stop offset="50%" stopColor="#c8e0ff"/>
          <stop offset="100%" stopColor="#a0c8ff"/>
        </linearGradient>

        {/* Strong blue glow filter */}
        <filter id="dlx-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Inner metallic shine */}
        <filter id="dlx-innerShine" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="shine"/>
          <feMerge>
            <feMergeNode in="shine"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Lens flare */}
        <radialGradient id="dlx-flare1" cx="22%" cy="28%" r="18%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9"/>
          <stop offset="40%" stopColor="#00f0ff" stopOpacity="0.75"/>
          <stop offset="100%" stopColor="#00b0ff" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="dlx-flare2" cx="78%" cy="72%" r="12%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#00e4ff" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#0055aa" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Soft bokeh lights */}
      <circle cx="120" cy="110" r="28" fill="#00d4ff" opacity="0.12"/>
      <circle cx="680" cy={showText ? 480 : 320} r="42" fill="#00e4ff" opacity="0.09"/>
      <circle cx="810" cy="140" r="35" fill="#00f0ff" opacity="0.08"/>

      {/* Flowing ribbon swoosh */}
      <path
        d="M 215 165 Q 255 105 355 125 Q 520 165 625 280 Q 685 370 635 465 Q 575 535 430 525 Q 310 510 245 415"
        fill="none"
        stroke="url(#dlx-metalD)"
        strokeWidth="78"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.96"
        filter="url(#dlx-glow)"
      />
      {/* Highlight ribbon layer */}
      <path
        d="M 215 165 Q 255 105 355 125 Q 520 165 625 280 Q 685 370 635 465 Q 575 535 430 525 Q 310 510 245 415"
        fill="none"
        stroke="url(#dlx-highlight)"
        strokeWidth="34"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.78"
        filter="url(#dlx-innerShine)"
      />

      {/* Large metallic "D" */}
      <text
        x="445" y="295"
        fontFamily="'Impact', 'Arial Black', sans-serif"
        fontSize="425" fontWeight="900"
        fill="url(#dlx-metalD)"
        stroke="#001122" strokeWidth="32"
        paintOrder="stroke fill"
        textAnchor="middle" dominantBaseline="middle"
        filter="url(#dlx-glow)"
        style={{ letterSpacing: "-18px" }}
      >D</text>
      {/* Inner shine on D */}
      <text
        x="445" y="295"
        fontFamily="'Impact', 'Arial Black', sans-serif"
        fontSize="425" fontWeight="900"
        fill="url(#dlx-highlight)"
        textAnchor="middle" dominantBaseline="middle"
        opacity="0.68"
        filter="url(#dlx-innerShine)"
        style={{ letterSpacing: "-18px" }}
      >D</text>

      {/* Brand text */}
      {showText && (
        <>
          <text
            x="450" y="480"
            fontFamily="'Arial Black', 'Impact', sans-serif"
            fontSize="68" fontWeight="700"
            fill="url(#dlx-textMetal)"
            textAnchor="middle"
            letterSpacing="21"
            style={{ filter: "drop-shadow(0 6px 12px rgba(99,102,241,0.5))" }}
          >DALXIC</text>
          <text
            x="450" y="535"
            fontFamily="'Arial Black', 'Impact', sans-serif"
            fontSize="29" fontWeight="600"
            fill="#818CF8"
            textAnchor="middle"
            letterSpacing="9"
            opacity="0.95"
          >AI</text>
        </>
      )}

      {/* Lens flare top-left */}
      <circle r="38" cx="235" cy="138" fill="url(#dlx-flare1)" opacity="0.95"/>
      <circle r="18" cx="228" cy="132" fill="#ffffff" opacity="0.85"/>

      {/* Horizontal lens flare streak */}
      {showText && (
        <rect x="85" y="472" width="730" height="6" rx="3" fill="#818CF8" opacity="0.45" filter="url(#dlx-glow)"/>
      )}

      {/* Subtle flare right */}
      <circle r="25" cx="715" cy={showText ? 495 : 335} fill="url(#dlx-flare2)" opacity="0.6"/>
    </svg>
  )
}
