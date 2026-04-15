"use client"
/* ═══════════════════════════════════════════════════════════════
   SHELL — Top header + auth gate for every Trade screen.
   Wraps children only when a session exists; otherwise shows PIN.
   ═══════════════════════════════════════════════════════════════ */
import { useState, ReactNode } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/use-auth"
import { Icon } from "./Icon"
import { T, Field, Input, Button, Card } from "./primitives"

const TRADE_COL = "#F59E0B"

export function Shell({ children }: { children: ReactNode }) {
  const { session, login, logout } = useAuth()
  if (!session) return <LoginScreen onLogin={login} />
  return (
    <div style={{ background: T.bg, color: T.tx, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <Header orgName={session.orgName} operatorName={session.operatorName} onLogout={logout} />
      {children}
    </div>
  )
}

function Header({ orgName, operatorName, onLogout }: { orgName: string; operatorName: string; onLogout: () => void }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 30,
      padding: "12px 28px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "rgba(4,10,15,0.92)",
      backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      borderBottom: `1px solid ${T.border}`,
      transform: "translateZ(0)", willChange: "transform",
    }}>
      <Link href="/trade" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
        <Brand />
        <span style={{ fontSize: 11, color: T.txD, marginLeft: 8, fontFamily: "'DM Mono', monospace" }}>{orgName}</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/trade" style={{
          fontSize: 11, color: T.txM, textDecoration: "none",
          padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`,
          display: "inline-flex", alignItems: "center", gap: 6,
          fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
        }}>
          <Icon name="dashboard" size={12} />
          All Modules
        </Link>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 8,
          background: `${T.emerald}08`, border: `1px solid ${T.border}`,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.emerald, display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: T.emerald }}>Online</span>
        </div>
        <span style={{ fontSize: 11, color: T.txD, fontFamily: "'DM Mono', monospace" }}>{operatorName}</span>
        <button onClick={onLogout} style={{
          background: "transparent", border: `1px solid ${T.border}`,
          padding: "7px 12px", borderRadius: 8, color: T.txM,
          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
          fontFamily: "'DM Mono', monospace",
        }}>
          <Icon name="logout" size={12} />
          End Session
        </button>
      </div>
    </div>
  )
}

export function Brand({ size = 14 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      <span style={{ fontWeight: 300, fontSize: size, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif" }}>Dalxic</span>
      <span style={{
        fontWeight: 700, fontSize: size, letterSpacing: "0.06em", textTransform: "uppercase",
        fontFamily: "'Space Grotesk', sans-serif",
        background: `linear-gradient(135deg, ${TRADE_COL}, #FBBF24)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>Trade</span>
    </span>
  )
}

/* ───── PIN login ───── */
function LoginScreen({ onLogin }: { onLogin: (orgCode: string, pin: string) => Promise<{ success: boolean; error?: string }> }) {
  const [orgCode, setOrgCode] = useState("DEMO")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!orgCode.trim() || pin.length !== 4 || loading) return
    setLoading(true); setError("")
    const r = await onLogin(orgCode.trim(), pin)
    if (!r.success) { setError(r.error || "Login failed"); setLoading(false) }
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.10), transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.10), transparent 70%)", filter: "blur(40px)" }} />
      </div>
      <Card style={{ width: 400, padding: 40, position: "relative", textAlign: "center" }}>
        <div style={{ marginBottom: 32 }}>
          <Brand size={20} />
          <div style={{ fontSize: 10, color: T.txD, marginTop: 8, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
            Workstation Sign-In
          </div>
        </div>

        <Field label="Organisation Code">
          <Input value={orgCode} onChange={(e) => setOrgCode(e.target.value.toUpperCase())} placeholder="ORG CODE" />
        </Field>

        <Field label="Operator PIN">
          <Input
            type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter") submit() }}
            placeholder="----"
            style={{ fontSize: 28, fontFamily: "'DM Mono', monospace", textAlign: "center", letterSpacing: "0.4em" }}
          />
        </Field>

        {error && (
          <div style={{ fontSize: 12, color: T.red, marginBottom: 16 }}>{error}</div>
        )}

        <Button onClick={submit} disabled={pin.length !== 4 || loading} full size="lg">
          {loading ? "Authenticating…" : "Enter Workstation"}
        </Button>

        <div style={{ marginTop: 28, fontSize: 10, color: T.txD, letterSpacing: "0.10em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
          Powered By DalxicOperations
        </div>
      </Card>
    </div>
  )
}
