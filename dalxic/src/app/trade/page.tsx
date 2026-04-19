import Link from "next/link"

export default function TradePage() {
  return (
    <main style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#040A0F", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)", width: 600, height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 640, padding: "0 24px" }}>
        <p style={{ fontSize: 11, letterSpacing: 6, textTransform: "uppercase", color: "#F59E0B", marginBottom: 24, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
          DalxicTrade
        </p>

        <h1 style={{ fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 800, lineHeight: 1.1, color: "#ECF5F0", marginBottom: 20, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>
          Commerce,{" "}
          <span style={{ background: "linear-gradient(135deg, #F59E0B, #FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            redefined
          </span>
        </h1>

        <p style={{ fontSize: 16, color: "rgba(236,245,240,0.45)", lineHeight: 1.7, marginBottom: 48 }}>
          POS, inventory, suppliers, accounting, loyalty, payroll.
          One platform for every store, market, and wholesaler.
        </p>

        <Link href="/kiosk/KASOA-MART" style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "14px 32px", borderRadius: 12,
          background: "linear-gradient(135deg, #F59E0B, #D97706)",
          color: "#fff", fontSize: 13, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase",
          textDecoration: "none", boxShadow: "0 8px 32px rgba(245,158,11,0.25)",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Enter Platform
        </Link>
      </div>

      <div style={{ position: "absolute", bottom: 32, fontSize: 11, color: "rgba(236,245,240,0.15)", letterSpacing: 3, textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
        Dalxic &middot; Ghana
      </div>
    </main>
  )
}
