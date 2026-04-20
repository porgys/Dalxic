"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { T } from "@/components/ops/primitives"

interface CalloutEntry {
  id: string
  token: string
  name: string
  destination: string
}

const DEPT_NAMES: Record<string, string> = {
  "doctor": "Doctor's Office", "lab": "Laboratory", "pharmacy": "Pharmacy",
  "radiology": "Radiology", "ultrasound": "Ultrasound", "injection-room": "Injection Room",
  "nurse-station": "Nurse Station", "billing-health": "Billing", "ward": "Ward",
  "icu": "ICU", "maternity": "Maternity", "front-desk": "Front Desk",
  "waiting-room": "Waiting Room", "blood-bank": "Blood Bank",
}

export function useVoiceCallout() {
  const queueRef = useRef<CalloutEntry[]>([])
  const speakingRef = useRef(false)
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("dalxic_voice_muted") === "1"
  })

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev
      localStorage.setItem("dalxic_voice_muted", next ? "1" : "0")
      return next
    })
  }, [])

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.9
    u.pitch = 1
    u.lang = "en-GH"
    window.speechSynthesis.speak(u)
    return new Promise<void>(resolve => { u.onend = () => resolve() })
  }, [])

  const processQueue = useCallback(async () => {
    if (speakingRef.current || muted) return
    const entry = queueRef.current.shift()
    if (!entry) return
    speakingRef.current = true
    const dest = DEPT_NAMES[entry.destination] ?? entry.destination
    const msg = `Token ${entry.token}, ${entry.name}, please proceed to ${dest}`
    await speak(msg)
    await new Promise(r => setTimeout(r, 1200))
    await speak(msg)
    speakingRef.current = false
    if (queueRef.current.length > 0) processQueue()
  }, [muted, speak])

  const callout = useCallback((entry: CalloutEntry) => {
    queueRef.current.push(entry)
    processQueue()
  }, [processQueue])

  return { callout, muted, toggleMute }
}

export function VoiceCalloutOverlay({ token, name, destination, onDone }: {
  token: string; name: string; destination: string; onDone: () => void
}) {
  const [visible, setVisible] = useState(true)
  const dest = DEPT_NAMES[destination] ?? destination

  useEffect(() => {
    const timer = setTimeout(() => { setVisible(false); onDone() }, 6000)
    return () => clearTimeout(timer)
  }, [onDone])

  if (!visible) return null

  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 300,
      background: "rgba(8,20,16,0.95)", border: `1px solid ${T.copper}40`,
      borderRadius: 16, padding: "20px 28px", minWidth: 300,
      boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${T.copper}15`,
      animation: "slideIn 0.3s ease",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: T.copper, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>
        Now Calling
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4 }}>
        {token} — {name}
      </div>
      <div style={{ fontSize: 13, color: T.txM }}>
        Please proceed to <span style={{ color: T.copper, fontWeight: 700 }}>{dest}</span>
      </div>
    </div>
  )
}

export function MuteToggle({ muted, onToggle, accent = T.copper }: { muted: boolean; onToggle: () => void; accent?: string }) {
  return (
    <button onClick={onToggle} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 12px", borderRadius: 8,
      background: muted ? `${T.red}14` : `${accent}14`,
      border: `1px solid ${muted ? T.red : accent}28`,
      color: muted ? T.red : accent,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
      cursor: "pointer", fontFamily: "'DM Mono', monospace",
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {muted ? (
          <><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
        ) : (
          <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>
        )}
      </svg>
      {muted ? "Muted" : "Voice On"}
    </button>
  )
}
