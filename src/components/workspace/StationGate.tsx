"use client"

import { useState, useEffect, useCallback, ReactNode } from "react"
import { useAuth } from "@/lib/use-auth"
import { canAccessModule, getRoleLabel } from "@/lib/verticals/registry"
import { T } from "@/components/ops/primitives"
import type { OrgType } from "@/lib/ops/mock"

const IDLE_TIMEOUT_MS = 10 * 60 * 1000
const IDLE_EVENTS: (keyof WindowEventMap)[] = ["mousedown", "keydown", "touchstart", "scroll"]

interface StationGateProps {
  moduleId: string
  orgType: OrgType
  orgCode: string
  activeModules: string[]
  children: ReactNode
}

export function StationGate({ moduleId, orgType, orgCode, activeModules, children }: StationGateProps) {
  const { session, hydrated, login } = useAuth()
  const [locked, setLocked] = useState(false)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const resetIdle = useCallback(() => {
    setLocked(false)
  }, [])

  useEffect(() => {
    if (!session || locked) return
    let timer = setTimeout(() => setLocked(true), IDLE_TIMEOUT_MS)
    const bump = () => {
      clearTimeout(timer)
      timer = setTimeout(() => setLocked(true), IDLE_TIMEOUT_MS)
    }
    for (const ev of IDLE_EVENTS) window.addEventListener(ev, bump, { passive: true })
    return () => {
      clearTimeout(timer)
      for (const ev of IDLE_EVENTS) window.removeEventListener(ev, bump)
    }
  }, [session, locked])

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length < 4) { setError("Enter your 4-digit PIN"); return }
    setError("")
    setLoading(true)
    const result = await login(orgCode, pin)
    setLoading(false)
    if (result.success) {
      setPin("")
      setError("")
      resetIdle()
    } else {
      setError(result.error ?? "Invalid PIN")
    }
  }

  if (!hydrated) return null

  if (!session) {
    return <GateScreen title="Session Expired" sub="Sign in to continue." orgCode={orgCode} orgType={orgType} />
  }

  if (locked) {
    return (
      <LockScreen
        operatorName={session.operatorName}
        orgType={orgType}
        pin={pin}
        setPin={setPin}
        error={error}
        loading={loading}
        onSubmit={handleUnlock}
      />
    )
  }

  if (!activeModules.includes(moduleId)) {
    return <GateScreen title="Module Not Available" sub={`This module is not active for your organisation.`} orgCode={orgCode} orgType={orgType} />
  }

  if (!canAccessModule(session.operatorRole, moduleId, orgType)) {
    const roleLabel = getRoleLabel(session.operatorRole, orgType)
    return <GateScreen title="Access Denied" sub={`Your role (${roleLabel}) does not have access to this module.`} orgCode={orgCode} orgType={orgType} />
  }

  return <>{children}</>
}

function accentForOrg(orgType: OrgType): string {
  const map: Record<string, string> = { health: T.copper, trade: T.amber, institute: T.sky, restaurant: T.amber }
  return map[orgType] ?? T.emerald
}

function GateScreen({ title, sub, orgCode, orgType }: { title: string; sub: string; orgCode: string; orgType: OrgType }) {
  const c = accentForOrg(orgType)
  return (
    <div style={{
      minHeight: "calc(100vh - 56px)", background: T.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        textAlign: "center", maxWidth: 420, padding: "48px 40px",
        background: "rgba(8,20,16,0.75)", border: `1px solid ${T.border}`,
        borderRadius: 20, backdropFilter: "blur(24px)",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: `${T.red}12`, display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", fontSize: 24,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 8 }}>
          {title}
        </h2>
        <p style={{ fontSize: 13, color: T.txM, marginBottom: 24, lineHeight: 1.6 }}>
          {sub}
        </p>
        <a
          href={`/kiosk/${orgCode}`}
          style={{
            display: "inline-block", padding: "12px 28px", borderRadius: 10,
            fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            background: `linear-gradient(135deg, ${c}, ${c}CC)`, color: "#fff",
            textDecoration: "none",
          }}
        >
          Sign In
        </a>
      </div>
    </div>
  )
}

function LockScreen({ operatorName, orgType, pin, setPin, error, loading, onSubmit }: {
  operatorName: string
  orgType: OrgType
  pin: string
  setPin: (v: string) => void
  error: string
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
}) {
  const c = accentForOrg(orgType)
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(4,10,15,0.95)", backdropFilter: "blur(24px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <form onSubmit={onSubmit} style={{
        width: 380, textAlign: "center",
        background: "rgba(8,20,16,0.8)", border: `1px solid ${T.border2}`,
        borderRadius: 20, padding: "48px 36px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: `${c}18`, border: `2px solid ${c}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", fontSize: 20, fontWeight: 800,
          color: c, fontFamily: "'Space Grotesk', sans-serif",
        }}>
          {operatorName.charAt(0).toUpperCase()}
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4 }}>
          {operatorName}
        </div>
        <div style={{
          fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
          fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 28,
        }}>
          Workstation Locked
        </div>

        <input
          type="password"
          maxLength={4}
          value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g, "")); }}
          placeholder="•  •  •  •"
          autoFocus
          style={{
            width: "100%", padding: "14px 14px", borderRadius: 10,
            fontSize: 24, fontWeight: 700, textAlign: "center",
            background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border2}`,
            color: T.tx, fontFamily: "'DM Mono', monospace",
            outline: "none", letterSpacing: "0.3em", boxSizing: "border-box",
          }}
        />

        {error && (
          <div style={{ fontSize: 12, color: T.red, marginTop: 8 }}>{error}</div>
        )}

        <button type="submit" disabled={loading} style={{
          width: "100%", marginTop: 16, padding: "12px 28px", borderRadius: 10,
          fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
          background: `linear-gradient(135deg, ${c}, ${c}CC)`, color: "#fff",
          border: "none", cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.6 : 1,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {loading ? "Verifying…" : "Unlock"}
        </button>

        <div style={{ fontSize: 10, color: T.txD, marginTop: 20, fontFamily: "'DM Mono', monospace" }}>
          Auto-locked after 10 minutes of inactivity
        </div>
      </form>
    </div>
  )
}
