"use client"

export default function PlatformHeader() {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 32px", background: "linear-gradient(180deg, rgba(6,10,20,0.95) 0%, rgba(6,10,20,0.8) 60%, transparent 100%)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", transform: "translateZ(0)", willChange: "transform" }}>
      {/* Left: Logo */}
      <a href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
        <span style={{ fontWeight: 300, fontSize: 15, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif" }}>Dalxic</span>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif", background: "linear-gradient(135deg, #818CF8, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Media</span>
      </a>
      {/* Right: Settings + Online */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <a href="/settings" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#7B8DB5", transition: "all 0.2s ease", cursor: "pointer" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#ECF0FF" }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#7B8DB5" }}>
          <span style={{ fontSize: 15 }}>⚙️</span>
        </a>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 4, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "pulse 2s infinite", boxShadow: "0 0 8px rgba(16,185,129,0.5)" }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#10B981", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", letterSpacing: "1px" }}>Online</span>
        </div>
      </div>
    </div>
  )
}
