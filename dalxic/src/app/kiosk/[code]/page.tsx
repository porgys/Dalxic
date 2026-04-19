"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { T } from "@/components/ops/primitives"
import { MOCK_TENANTS, VERTICAL_LABEL } from "@/lib/ops/mock"
import { useAuth } from "@/lib/use-auth"

const ACCENT_MAP: Record<string, string> = {
  trade: T.amber,
  health: T.copper,
  institute: T.sky,
  restaurant: T.amber,
  salon: T.copper,
}

const ACCENT_LIGHT: Record<string, string> = {
  trade: T.amberL,
  health: T.copperL,
  institute: "#38BDF8",
  restaurant: T.amberL,
  salon: T.copperL,
}


export default function KioskPage() {
  const { code } = useParams() as { code: string }
  const router = useRouter()
  const { login } = useAuth()
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const tenant = MOCK_TENANTS.find(t => t.code === code)
  const accentColor = ACCENT_MAP[tenant?.type ?? ""] ?? T.emerald
  const accentLight = ACCENT_LIGHT[tenant?.type ?? ""] ?? T.emeraldL
  const verticalName = (tenant ? VERTICAL_LABEL[tenant.type] : undefined) ?? "Platform"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length < 4) {
      setError("Enter a 4-digit PIN")
      return
    }
    setError("")
    setLoading(true)
    const result = await login(code, pin)
    setLoading(false)
    if (result.success) {
      router.push(`/kiosk/${code}/modules`)
    } else {
      setError(result.error ?? "Login failed")
    }
  }

  if (!tenant) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: T.txD, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 16 }}>404</div>
          <div style={{ fontSize: 14, color: T.txM, marginBottom: 24 }}>Organisation &ldquo;{code.toUpperCase()}&rdquo; not found</div>
          <a href="/" style={{ fontSize: 12, color: T.emerald, textDecoration: "none", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Back to Home</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glow circles */}
      <div style={{
        position: "absolute",
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
        top: "20%",
        left: "30%",
        filter: "blur(80px)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        width: 350,
        height: 350,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${T.emerald}12 0%, transparent 70%)`,
        bottom: "15%",
        right: "25%",
        filter: "blur(80px)",
        pointerEvents: "none",
      }} />

      {/* Login card */}
      <form onSubmit={handleSubmit} style={{
        width: 440,
        background: "rgba(8,20,16,0.75)",
        border: `1px solid rgba(16,185,129,0.12)`,
        borderRadius: 20,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        padding: "48px 40px",
        position: "relative",
        zIndex: 1,
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <span style={{
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            color: T.txM,
            letterSpacing: "-0.01em",
          }}>
            Dalxic
          </span>
          <span style={{
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            background: `linear-gradient(135deg, ${accentColor}, ${accentLight})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.01em",
            marginLeft: 4,
          }}>
            {verticalName}
          </span>
        </div>

        {/* Org name */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>
            {tenant?.name ?? code}
          </div>
        </div>

        {/* Label */}
        <div style={{
          textAlign: "center",
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: T.txD,
          fontFamily: "'DM Mono', monospace",
          marginBottom: 28,
        }}>
          Workstation Sign-In
        </div>

        {/* Org code field */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: T.txD, marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>
            Org Code
          </label>
          <input
            readOnly
            value={code.toUpperCase()}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${T.border}`,
              color: T.txM,
              fontFamily: "'DM Mono', monospace",
              textTransform: "uppercase",
              outline: "none",
              cursor: "default",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* PIN field */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: T.txD, marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>
            PIN
          </label>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setError("") }}
            placeholder={"•  •  •  •"}
            style={{
              width: "100%",
              padding: "14px 14px",
              borderRadius: 10,
              fontSize: 24,
              fontWeight: 700,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid rgba(16,185,129,0.18)`,
              color: T.tx,
              fontFamily: "'DM Mono', monospace",
              textAlign: "center",
              outline: "none",
              letterSpacing: "0.3em",
              boxSizing: "border-box",
            }}
            autoFocus
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ fontSize: 12, color: T.red, textAlign: "center", marginBottom: 8 }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px 28px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            background: `linear-gradient(135deg, ${T.emerald}, #059669)`,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: `0 4px 16px ${T.emerald}25`,
            marginTop: 16,
            transition: "transform 0.1s",
          }}
          disabled={loading}
          onMouseDown={e => { (e.currentTarget).style.transform = "scale(0.98)" }}
          onMouseUp={e => { (e.currentTarget).style.transform = "scale(1)" }}
          onMouseLeave={e => { (e.currentTarget).style.transform = "scale(1)" }}
        >
          {loading ? "Signing in…" : "Enter Workstation"}
        </button>

        {/* Footer */}
        <div style={{
          textAlign: "center",
          fontSize: 10,
          color: T.txD,
          fontFamily: "'DM Mono', monospace",
          marginTop: 28,
          letterSpacing: "0.04em",
        }}>
          Powered by DalxicOperations
        </div>
      </form>
    </div>
  )
}
