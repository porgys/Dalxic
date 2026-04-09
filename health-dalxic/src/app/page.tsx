"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"

/* ─── Cross-platform URLs ─── */
const MAIN_URL  = process.env.NEXT_PUBLIC_MAIN_URL  || "http://localhost:3000"
const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL || "http://localhost:3001"

/* ─── Scroll-triggered reveal (dalxic.com pattern) ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible] as const
}

function Reveal({ children, delay = 0, style = {}, className = "" }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties; className?: string
}) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} className={className} style={{
      ...style,
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : "translateY(32px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }}>
      {children}
    </div>
  )
}

/* ─── Animated counter ─── */
function Counter({ target, suffix = "", prefix = "", decimals = 0 }: {
  target: number; suffix?: string; prefix?: string; decimals?: number
}) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; obs.disconnect()
      const start = Date.now(), dur = 2200
      const tick = () => {
        const p = Math.min((Date.now() - start) / dur, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        setVal(+(ease * target).toFixed(decimals))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target, decimals])
  return <span ref={ref}>{prefix}{decimals > 0 ? val.toFixed(decimals) : val.toLocaleString()}{suffix}</span>
}

/* ─── Galaxy Canvas (stars, nebula clouds, light rays) ─── */
function GalaxyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    window.addEventListener("resize", resize)

    /* ── Stars: mixed sizes, some twinkle, all drift slowly ── */
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.24,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() < 0.08 ? Math.random() * 2.5 + 1.5 : Math.random() * 1.2 + 0.3,
      baseOpacity: Math.random() * 0.7 + 0.2,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: [
        [255, 255, 255],
        [255, 220, 180],
        [212, 149, 107],
        [184, 115, 51],
        [255, 200, 150],
        [14, 165, 233],
      ][Math.random() < 0.15 ? 3 : Math.random() < 0.3 ? 4 : Math.random() < 0.1 ? 5 : Math.floor(Math.random() * 3)]
    }))

    /* ── Drifting particles (slow galactic dust) ── */
    const dust = Array.from({ length: 40 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.9, vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 1 + 0.3,
      opacity: Math.random() * 0.3 + 0.05,
      color: (Math.random() < 0.6 ? [184, 115, 51] : [14, 165, 233]) as number[]
    }))

    /* ── Nebula clouds (drawn once to offscreen canvas, composited each frame) ── */
    const nebulaCanvas = document.createElement("canvas")
    nebulaCanvas.width = W; nebulaCanvas.height = H
    const nctx = nebulaCanvas.getContext("2d")!
    // Cloud 1: warm copper center-right
    const g1 = nctx.createRadialGradient(W * 0.6, H * 0.4, 0, W * 0.6, H * 0.4, W * 0.45)
    g1.addColorStop(0, "rgba(184,115,51,0.1)")
    g1.addColorStop(0.3, "rgba(212,149,107,0.05)")
    g1.addColorStop(0.6, "rgba(140,80,30,0.03)")
    g1.addColorStop(1, "transparent")
    nctx.fillStyle = g1; nctx.fillRect(0, 0, W, H)
    // Cloud 2: copper-amber upper left
    const g2 = nctx.createRadialGradient(W * 0.2, H * 0.25, 0, W * 0.2, H * 0.25, W * 0.35)
    g2.addColorStop(0, "rgba(184,115,51,0.07)")
    g2.addColorStop(0.4, "rgba(200,140,70,0.04)")
    g2.addColorStop(1, "transparent")
    nctx.fillStyle = g2; nctx.fillRect(0, 0, W, H)
    // Cloud 3: subtle blue accent bottom-right (clinical hint)
    const g3 = nctx.createRadialGradient(W * 0.8, H * 0.7, 0, W * 0.8, H * 0.7, W * 0.3)
    g3.addColorStop(0, "rgba(14,165,233,0.05)")
    g3.addColorStop(0.5, "rgba(56,189,248,0.02)")
    g3.addColorStop(1, "transparent")
    nctx.fillStyle = g3; nctx.fillRect(0, 0, W, H)
    // Cloud 4: deep warm bottom
    const g4 = nctx.createRadialGradient(W * 0.4, H * 0.85, 0, W * 0.4, H * 0.85, W * 0.35)
    g4.addColorStop(0, "rgba(160,90,30,0.05)")
    g4.addColorStop(0.5, "rgba(184,115,51,0.02)")
    g4.addColorStop(1, "transparent")
    nctx.fillStyle = g4; nctx.fillRect(0, 0, W, H)

    let t = 0, raf: number

    function draw() {
      t++
      ctx!.clearRect(0, 0, W, H)

      /* ── Nebula layer ── */
      ctx!.globalAlpha = 0.9
      ctx!.drawImage(nebulaCanvas, 0, 0)
      ctx!.globalAlpha = 1

      /* ── Light rays (diagonal, from top-left) ── */
      ctx!.save()
      for (let i = 0; i < 3; i++) {
        const rayX = W * (0.05 + i * 0.12)
        const rayGrad = ctx!.createLinearGradient(rayX, 0, rayX + W * 0.3, H * 0.7)
        rayGrad.addColorStop(0, `rgba(255,230,200,${0.015 + Math.sin(t * 0.003 + i) * 0.008})`)
        rayGrad.addColorStop(0.5, `rgba(212,149,107,${0.008 + Math.sin(t * 0.004 + i * 2) * 0.005})`)
        rayGrad.addColorStop(1, "transparent")
        ctx!.fillStyle = rayGrad
        ctx!.beginPath()
        ctx!.moveTo(rayX, 0)
        ctx!.lineTo(rayX + 60 + i * 20, 0)
        ctx!.lineTo(rayX + W * 0.35, H * 0.75)
        ctx!.lineTo(rayX + W * 0.25, H * 0.75)
        ctx!.closePath()
        ctx!.fill()
      }
      ctx!.restore()

      /* ── Stars with twinkling + drift ── */
      stars.forEach(s => {
        s.x += s.vx; s.y += s.vy
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0
        if (s.y < 0) s.y = H; if (s.y > H) s.y = 0
        const flicker = Math.sin(t * s.twinkleSpeed + s.twinkleOffset) * 0.3 + 0.7
        const opacity = s.baseOpacity * flicker
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${opacity})`
        ctx!.fill()
        // Glow halo on brighter stars
        if (s.r > 1.5) {
          const glow = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4)
          glow.addColorStop(0, `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${opacity * 0.3})`)
          glow.addColorStop(1, "transparent")
          ctx!.fillStyle = glow
          ctx!.fillRect(s.x - s.r * 4, s.y - s.r * 4, s.r * 8, s.r * 8)
        }
      })

      /* ── Drifting dust particles ── */
      dust.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.opacity})`
        ctx!.fill()
      })

      /* ── Connecting lines between nearby dust ── */
      for (let i = 0; i < dust.length; i++) for (let j = i + 1; j < dust.length; j++) {
        const dx = dust[i].x - dust[j].x, dy = dust[i].y - dust[j].y, d = Math.sqrt(dx * dx + dy * dy)
        if (d < 140) {
          ctx!.beginPath()
          ctx!.strokeStyle = `rgba(184,115,51,${0.08 * (1 - d / 140)})`
          ctx!.lineWidth = 0.4
          ctx!.moveTo(dust[i].x, dust[i].y); ctx!.lineTo(dust[j].x, dust[j].y)
          ctx!.stroke()
        }
      }

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
}

/* ─── Scrolling ticker ─── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Ticker({ text }: { text: string }) {
  const content = Array(4).fill(text).join("   ·   ")
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-block", animation: "marqueeScroll 40s linear infinite", fontSize: 11, color: "var(--nl-txD)" }}>{content}</span>
    </div>
  )
}

const COPPER = "#B87333";
const COPPER_LIGHT = "#D4956B";

/* ─── Ticker with glowing country names ─── */
function TickerMulti() {
  const items = [
    { text: "DALXIC HEALTH", glow: false },
    { text: "NEXUS-7™", glow: false },
    { text: "GHANA", glow: true },
    { text: "LIVEQUEUE™", glow: false },
    { text: "NIGERIA", glow: true },
    { text: "BOOKKEEPER™", glow: false },
    { text: "KENYA", glow: true },
    { text: "REDLINE™", glow: false },
    { text: "SOUTH AFRICA", glow: true },
    { text: "AUDITVAULT™", glow: false },
    { text: "RWANDA", glow: true },
    { text: "STATIONGUARD™", glow: false },
    { text: "TANZANIA", glow: true },
    { text: "FLOWENGINE™", glow: false },
    { text: "ETHIOPIA", glow: true },
    { text: "DALXIC", glow: false },
    { text: "SENEGAL", glow: true },
  ]
  const content = Array(4).fill(items).flat().map((item, i) => (
    <span key={i}>
      {i > 0 && <span style={{ margin: "0 12px", color: "var(--nl-txD)" }}>·</span>}
      <span style={item.glow ? {
        color: "#38BDF8",
        textShadow: "0 0 8px rgba(56,189,248,0.5), 0 0 20px rgba(14,165,233,0.25)",
        fontWeight: 700,
      } : { color: "var(--nl-txD)" }}>
        {item.text}
      </span>
    </span>
  ))
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-block", animation: "marqueeScroll 60s linear infinite", fontSize: 11 }}>
        {content}
      </span>
    </div>
  )
}

/* ═══════════════════ DATA ═══════════════════ */

const WORKSTATIONS = [
  { icon: "🏥", title: "Registration & Triage", engine: "FlowEngine™", desc: "Patient intake in under 30 seconds. TriageIQ™ severity classification with automatic priority routing.", color: "#0EA5E9" },
  { icon: "📺", title: "Queue & Display", engine: "CallBoard™", desc: "LiveQueue™ real-time patient flow. Auto-updates across all devices instantly — no refresh, no delays.", color: "#38BDF8" },
  { icon: "🩺", title: "Consultation", engine: "Clinical Engine", desc: "Full consultation workflow with InsightBrief™ summaries. CareChain™ specialist routing, prescriptions, and diagnosis.", color: "#0EA5E9" },
  { icon: "🔬", title: "Laboratory", engine: "Lab Pipeline", desc: "Complete lab order lifecycle with result entry. LabReturn™ priority re-consultation on completion.", color: "#0284C7" },
  { icon: "💊", title: "Pharmacy", engine: "Rx Dispense", desc: "Prescription queue with full medication details. Track dispensing status across the entire facility.", color: "#38BDF8" },
  { icon: "💉", title: "Injection & Nursing", engine: "CarePoint™", desc: "Injection tracking, vitals monitoring, and nursing workflow — all connected to the patient record in real-time.", color: "#0EA5E9" },
  { icon: "🏨", title: "Inpatient & Ward", engine: "BedSync™", desc: "Bed management, ward rounds, and inpatient tracking. Designed for facilities from 20 to 1,000+ beds.", color: "#0284C7" },
  { icon: "🚨", title: "Emergency & ICU", engine: "RedLine™", desc: "Emergency fast-track admission, severity-based priority, and ICU-grade monitoring — zero paperwork delays.", color: "#EF4444" },
  { icon: "🤰", title: "Maternity", engine: "MaternaFlow™", desc: "Antenatal tracking, labour monitoring, and postnatal care — full maternal lifecycle in one workflow.", color: "#A855F7" },
  { icon: "🩸", title: "Blood Bank", engine: "HemoVault™", desc: "Inventory management, cross-matching, and transfusion tracking with full compatibility verification.", color: "#DC2626" },
  { icon: "📡", title: "Imaging & Radiology", engine: "ScanLink™", desc: "CT, ultrasound, and X-ray order management with result delivery direct to the consulting physician.", color: "#38BDF8" },
  { icon: "💰", title: "Billing & Revenue", engine: "BillStream™", desc: "Auto-captured billing from every workstation. SafeExit™ discharge verification ensures nothing leaves unbilled.", color: "#B87333" },
]

const STATS = [
  { value: 30, suffix: "s", prefix: "<", decimals: 0, label: "FlowEngine™ Registration" },
  { display: "100%", label: "AuditVault™ Compliance" },
  { value: 46, suffix: "+", decimals: 0, label: "Connected Workstations" },
  { display: "Real-time", label: "LiveQueue™ Updates" },
]

const FEATURES_LEFT = [
  { title: "Nexus-7™ Clinical Intelligence", desc: "Proprietary engine that transforms patient data into structured, searchable records — instantly.", color: "#0EA5E9" },
  { title: "FlowEngine™ Patient Orchestration", desc: "End-to-end visit lifecycle from intake to discharge. Every step tracked, every handoff seamless.", color: "#38BDF8" },
  { title: "RedLine™ Emergency Protocol", desc: "Severity-based fast-track admission with priority escalation. Zero paperwork delays in critical moments.", color: "#EF4444" },
  { title: "AuditVault™ Compliance Trail", desc: "Automatic compliance documentation. Exportable records, DPA-compliant, always available when you need them.", color: "#B87333" },
]

const FEATURES_RIGHT = [
  { title: "BillStream™ Revenue Capture", desc: "Auto-captured billing from every department. Nothing leaves the facility unbilled.", color: "#B87333" },
  { title: "CareChain™ Specialist Routing", desc: "Doctor-to-doctor referral chains with accept, complete, and handover tracking.", color: "#0EA5E9" },
  { title: "StationGuard™ Access Control", desc: "PIN-gated workstations with role-based permissions. Every operator authenticated.", color: "#0284C7" },
  { title: "PatientLink™ Notifications", desc: "Automated patient communication at every stage of their visit — from queue to discharge.", color: "#38BDF8" },
]

const ROUTES_SPECIAL = [
  { href: "/emergency-override", label: "RedLine™ Emergency Access", desc: "Authorised read-only emergency access — full compliance documentation maintained automatically in AuditVault™", role: "CMO / Medical Director" },
]

/* ═══════════════════ NAV ═══════════════════ */

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", h)
    return () => window.removeEventListener("scroll", h)
  }, [])

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      padding: scrolled ? "14px 44px" : "22px 44px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      transition: "all 0.35s ease",
      background: scrolled ? "rgba(3, 5, 15, 0.88)" : "transparent",
      backdropFilter: scrolled ? "blur(24px)" : "none",
      borderBottom: scrolled ? "1px solid var(--nl-border)" : "1px solid transparent",
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
        <span style={{ fontWeight: 300, fontSize: 14, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Dalxic</span>
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }} className="text-gradient-blue">Health</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {[
          { label: "Workstations", href: "#stations" },
          { label: "Technology", href: "#technology" },
          { label: "Pricing", href: "/pricing" },
          { label: "Access", href: "#access" },
        ].map(l => (
          <a key={l.label} href={l.href} style={{
            color: "var(--nl-txM)", fontSize: 14, fontWeight: 600,
            textDecoration: "none", letterSpacing: 0.3,
            transition: "color 0.2s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--nl-tx)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--nl-txM)")}
          >
            {l.label}
          </a>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh" style={{
          padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
          textDecoration: "none", color: "#fff",
          background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`,
          boxShadow: `0 4px 16px ${COPPER}30`,
        }}>Enter Platform</Link>
      </div>
    </nav>
  )
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function HomePage() {
  return (
    <>
      <Nav />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", background: "radial-gradient(ellipse 120% 80% at 60% 50%, rgba(8,20,50,1) 0%, rgba(4,8,20,1) 50%, rgba(2,4,12,1) 100%)" }}>
        {/* Deep space base layers */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 40%, rgba(184,115,51,0.08) 0%, transparent 50%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 25% 30%, rgba(212,149,107,0.05) 0%, transparent 40%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 60%, rgba(140,80,30,0.04) 0%, transparent 45%)", pointerEvents: "none" }} />
        <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.15 }} />
        <GalaxyCanvas />
        {/* Central glow behind text */}
        <div style={{ position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)", width: 900, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(184,115,51,0.06) 0%, rgba(212,149,107,0.02) 30%, transparent 65%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "120px 32px 80px", position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 36, animation: "fadeUp 0.6s ease 0.2s both" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                letterSpacing: 1.5, textTransform: "uppercase",
                background: "rgba(184,115,51,0.12)", color: COPPER_LIGHT,
                border: "1px solid rgba(184,115,51,0.25)",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: COPPER, boxShadow: `0 0 8px ${COPPER}` }} />
                NEXUS-7™ HOSPITAL MANAGEMENT
              </span>
            </div>

            {/* Headline */}
            <h1 style={{ marginBottom: 28, lineHeight: 1.05, animation: "fadeUp 0.6s ease 0.35s both" }}>
              <span style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif", fontWeight: 800, fontSize: "clamp(2.8rem, 5.5vw, 5.2rem)", letterSpacing: -2, color: "var(--nl-tx)", display: "block" }}>
                Worlds Best Hospital
              </span>
              <span style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 3vw, 2.6rem)", letterSpacing: -1, display: "block", marginTop: 4 }} className="text-gradient-copper">
                Management System
              </span>
            </h1>

            {/* Tagline */}
            <p style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif", fontWeight: 500, fontSize: "clamp(1.1rem, 2.2vw, 1.6rem)", letterSpacing: -0.3, color: "var(--nl-txM)", margin: "16px auto 8px", animation: "fadeUp 0.6s ease 0.45s both" }}>
              Built For Africa. Powered By Nexus-7™
            </p>

            {/* Sub-copy */}
            <p style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)", color: "var(--nl-txM)", lineHeight: 1.8, maxWidth: 580, margin: "0 auto 44px", animation: "fadeUp 0.6s ease 0.5s both" }}>
              From patient intake to pharmacy dispensing — every workstation connected in real-time. 46+ connected workstations, one seamless platform.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp 0.6s ease 0.65s both" }}>
              <Link href="/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh" style={{
                padding: "16px 0", width: 240, textAlign: "center", borderRadius: 14, fontSize: 15, fontWeight: 700,
                letterSpacing: "0.04em", textDecoration: "none", color: "#fff", display: "inline-block",
                background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`,
                boxShadow: `0 8px 32px ${COPPER}40`,
                transition: "all 0.3s ease",
              }}>
                Enter Platform
              </Link>
              <a href="#stations" className="btn-nl btn-nl-glow btn-nl-lg" style={{ width: 240, textAlign: "center", display: "inline-block", boxSizing: "border-box" }}>
                Explore Workstations
              </a>
            </div>

            {/* Trust badges */}
            <div style={{ marginTop: 56, display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp 0.6s ease 0.8s both" }}>
              {["Pan-African Compliance", "AuditVault™ Trail", "Multi-Facility Ready", "LiveQueue™ Sync"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ width: 6, height: 6, background: COPPER, borderRadius: "50%", boxShadow: `0 0 8px ${COPPER}90`, display: "inline-block" }} />
                  <span style={{ fontSize: 12, color: "var(--nl-txM)", letterSpacing: 0.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ STATS BAR ═══════════════════ */}
      <section style={{ padding: "56px 0", background: "var(--nl-surf)", borderTop: "1px solid var(--nl-border)", borderBottom: "1px solid var(--nl-border)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 40, textAlign: "center" }}>
            {STATS.map(s => (
              <Reveal key={s.label} delay={0}>
                <div className="stat-number" style={{ marginBottom: 6 }}>
                  {s.display || <Counter target={s.value!} suffix={s.suffix} prefix={s.prefix || ""} decimals={s.decimals} />}
                </div>
                <div style={{ fontSize: 13, color: "var(--nl-txM)", letterSpacing: 0.3 }}>{s.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ SHOWCASE 1: CONNECTED CORRIDOR ═══════════════════ */}
      <section style={{ padding: "100px 0", background: "var(--nl-bg)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(184,115,51,0.04) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            {/* Image */}
            <Reveal>
              <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(184,115,51,0.15)", boxShadow: "0 24px 80px rgba(0,0,0,0.4), 0 0 60px rgba(184,115,51,0.08)" }}>
                <Image src="/images/connected-corridor.jpg" alt="Hospital departments connected by intelligent data streams" width={600} height={400} style={{ width: "100%", height: "auto", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 60%, rgba(3,5,15,0.6) 100%)", pointerEvents: "none" }} />
              </div>
            </Reveal>
            {/* Text */}
            <Reveal delay={0.15}>
              <div className="section-label" style={{ marginBottom: 14 }}>Seamless Integration</div>
              <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)", fontWeight: 800, letterSpacing: -1, marginBottom: 20, lineHeight: 1.1, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
                Every Department.{" "}<span className="text-gradient-copper">One Nervous System.</span>
              </h2>
              <p style={{ fontSize: 15, color: "var(--nl-txM)", lineHeight: 1.8, marginBottom: 28 }}>
                From pharmacy shelves to radiology suites — every corridor pulses with real-time data. Staff carry intelligent tablets that sync with LiveQueue™, routing patients through departments without a single paper handoff.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "LiveQueue™ Sync", desc: "Patient position updates propagate across all departments instantly", accent: "#0EA5E9" },
                  { label: "CareChain™ Routing", desc: "Automatic handoff between pharmacy, radiology, lab, and consultation", accent: "#38BDF8" },
                  { label: "Zero Paper Trail", desc: "Every order, result, and referral travels digitally through the facility", accent: COPPER },
                ].map(f => (
                  <div key={f.label} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 3, height: 36, background: `linear-gradient(to bottom, ${f.accent}, transparent)`, borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: f.accent, marginBottom: 3 }}>{f.label}</div>
                      <div style={{ fontSize: 13, color: "var(--nl-txM)", lineHeight: 1.6 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══════════════════ STATIONS ═══════════════════ */}
      <section id="stations" style={{ padding: "100px 0" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>Full Hospital Coverage</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: -1, marginBottom: 16, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
              Every Workstation.{" "}<span className="text-gradient-blue">One Platform.</span>
            </h2>
            <p style={{ color: "var(--nl-txM)", maxWidth: 580, margin: "0 auto", lineHeight: 1.7 }}>
              From registration to pharmacy, emergency to maternity — every workflow connected in real-time. Fully integrated onboarding for facilities up to 1,000+ beds.
            </p>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {WORKSTATIONS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.06} style={{ height: "100%" }}>
                <div className="glass" style={{
                  padding: "28px 24px", width: "100%", height: 290,
                  display: "flex", flexDirection: "column",
                  transition: "all 0.35s ease", cursor: "default",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + "60"; e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 20px 60px ${s.color}18` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "" }}>
                  <div style={{ fontSize: 28, marginBottom: 14 }}>{s.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: s.color, marginBottom: 6 }}>{s.engine}</div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>{s.title}</h3>
                  <p style={{ fontSize: 13.5, color: "var(--nl-txM)", lineHeight: 1.7, flex: 1 }}>{s.desc}</p>
                  <div style={{ marginTop: 16, height: 2, background: `linear-gradient(90deg, ${s.color}80, transparent)`, borderRadius: 1 }} />
                </div>
              </Reveal>
            ))}
          </div>

          {/* 1000+ bed boast strip */}
          <Reveal delay={0.3}>
            <div style={{
              marginTop: 64, padding: "52px 48px", borderRadius: 24,
              background: "radial-gradient(ellipse at 50% 0%, rgba(14,165,233,0.08) 0%, transparent 60%), rgba(255,255,255,0.015)",
              border: "1px solid rgba(184,115,51,0.12)",
              backdropFilter: "blur(12px)",
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24,
              textAlign: "center", position: "relative", overflow: "hidden",
            }}>
              {/* Subtle top glow line */}
              <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, rgba(14,165,233,0.4), rgba(184,115,51,0.3), transparent)" }} />
              {[
                { value: "1,000+", label: "Bed Capacity", accent: "#0EA5E9" },
                { value: "46", label: "Integrated Workstations", accent: "#38BDF8" },
                { value: "< 48hrs", label: "Full Onboarding", accent: "#B87333" },
                { value: "99.9%", label: "Uptime Target", accent: "#0EA5E9" },
              ].map(s => (
                <div key={s.label}>
                  <div style={{
                    fontFamily: "var(--font-outfit), Outfit, sans-serif",
                    fontWeight: 800, fontSize: "clamp(2.4rem, 4vw, 3.6rem)",
                    letterSpacing: -2, lineHeight: 1,
                    background: `linear-gradient(135deg, ${s.accent}, ${s.accent}99)`,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    filter: `drop-shadow(0 0 20px ${s.accent}30)`,
                  }}>
                    {s.value}
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: "var(--nl-txM)",
                    letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 12,
                  }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════ SHOWCASE 2: COMMAND CENTER ═══════════════════ */}
      <section style={{ padding: "100px 0", background: "var(--nl-surf)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 40%, rgba(14,165,233,0.04) 0%, transparent 55%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            {/* Text (left this time — alternating layout) */}
            <Reveal>
              <div className="section-label-copper" style={{ marginBottom: 14 }}>Available On Demand</div>
              <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)", fontWeight: 800, letterSpacing: -1, marginBottom: 20, lineHeight: 1.1, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
                Total Hospital{" "}<span className="text-gradient-blue">Connectivity.</span>
              </h2>
              <p style={{ fontSize: 15, color: "var(--nl-txM)", lineHeight: 1.8, marginBottom: 28 }}>
                Digital interconnectivity that breathes — live patient flow, department loads, queue lengths, billing, and emergency alerts — all in one system. This is not a dashboard. This is hospital-wide consciousness.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Real-Time Facility Map", desc: "Every workstation, every queue, every bed — live on screen with auto-refresh", accent: "#0EA5E9" },
                  { label: "AuditVault™ Compliance", desc: "Full documentation trail — accessible, exportable, DPA-compliant when needed", accent: COPPER },
                  { label: "RedLine™ Alert Feed", desc: "Emergency escalations surface instantly with severity classification and routing", accent: "#EF4444" },
                ].map(f => (
                  <div key={f.label} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 3, height: 36, background: `linear-gradient(to bottom, ${f.accent}, transparent)`, borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: f.accent, marginBottom: 3 }}>{f.label}</div>
                      <div style={{ fontSize: 13, color: "var(--nl-txM)", lineHeight: 1.6 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            {/* Image */}
            <Reveal delay={0.15}>
              <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(14,165,233,0.15)", boxShadow: "0 24px 80px rgba(0,0,0,0.4), 0 0 60px rgba(14,165,233,0.08)" }}>
                <Image src="/images/command-center.jpg" alt="Hospital connectivity dashboard with integrated department workflows" width={600} height={400} style={{ width: "100%", height: "auto", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 60%, rgba(3,5,15,0.6) 100%)", pointerEvents: "none" }} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══════════════════ TECHNOLOGY ═══════════════════ */}
      <section id="technology" style={{ padding: "100px 0" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
          {/* Centered heading */}
          <Reveal style={{ textAlign: "center", marginBottom: 72 }}>
            <div className="section-label" style={{ marginBottom: 14 }}>Proprietary Technology</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: -1, marginBottom: 20, lineHeight: 1.1, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
              Powered By{" "}
              <span className="text-gradient-blue">Nexus-7™</span>
              <br />
              Built On{" "}
              <span className="text-gradient-copper">Dalxic DNA</span>
            </h2>
            <p style={{ color: "var(--nl-txM)", lineHeight: 1.8, fontSize: 15, maxWidth: 600, margin: "0 auto" }}>
              Eight proprietary systems working as one. Every feature trademarked, every workflow engineered for African healthcare at scale.
            </p>
          </Reveal>

          {/* Two-column features grid — row-aligned */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 56px", marginBottom: 72 }}>
            {FEATURES_LEFT.map((f, i) => {
              const fr = FEATURES_RIGHT[i]
              return [
                <Reveal key={f.title} delay={i * 0.08}>
                  <div style={{ display: "flex", gap: 16, height: "100%" }}>
                    <div style={{ width: 3, background: `linear-gradient(to bottom, ${f.color}, transparent)`, borderRadius: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 5, color: f.color }}>{f.title}</div>
                      <div style={{ fontSize: 13.5, color: "var(--nl-txM)", lineHeight: 1.7 }}>{f.desc}</div>
                    </div>
                  </div>
                </Reveal>,
                <Reveal key={fr.title} delay={i * 0.08 + 0.15}>
                  <div style={{ display: "flex", gap: 16, height: "100%" }}>
                    <div style={{ width: 3, background: `linear-gradient(to bottom, ${fr.color}, transparent)`, borderRadius: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 5, color: fr.color }}>{fr.title}</div>
                      <div style={{ fontSize: 13.5, color: "var(--nl-txM)", lineHeight: 1.65 }}>{fr.desc}</div>
                    </div>
                  </div>
                </Reveal>,
              ]
            })}
          </div>

          {/* Visual element — tech sphere centered */}
          <Reveal delay={0.2} style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 520, height: 520, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* Outer ring */}
              <div className="glow-pulse" style={{ width: 380, height: 380, borderRadius: "50%", border: "1px solid rgba(14,165,233,0.12)", position: "absolute" }} />
              {/* Mid ring */}
              <div style={{ width: 280, height: 280, borderRadius: "50%", border: "1px solid rgba(56,189,248,0.15)", position: "absolute", animation: "spin 30s linear infinite reverse" }} />
              {/* Inner ring */}
              <div style={{ width: 180, height: 180, borderRadius: "50%", border: "1px solid rgba(184,115,51,0.1)", position: "absolute", animation: "spin 45s linear infinite" }} />
              {/* Inner glow */}
              <div style={{ width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)", position: "absolute" }} />
              {/* Center text */}
              <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif", display: "flex", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 300, fontSize: 14, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>Dalxic</span>
                  <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase" }} className="text-gradient-blue">Health</span>
                </div>
              </div>
              {/* Scan line */}
              <div className="scan-line-effect" style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", overflow: "hidden", opacity: 0.3, pointerEvents: "none" }} />
              {/* Orbiting trademark badges */}
              {[
                { label: "<30s", sub: "FlowEngine™", angle: -40, accent: "#0EA5E9" },
                { label: "N-7", sub: "Nexus-7™", angle: 15, accent: "#38BDF8" },
                { label: "100%", sub: "AuditVault™", angle: 70, accent: "#B87333" },
                { label: "Live", sub: "LiveQueue™", angle: 125, accent: "#0EA5E9" },
                { label: "Auto", sub: "BillStream™", angle: 180, accent: "#B87333" },
                { label: "ER", sub: "RedLine™", angle: 235, accent: "#EF4444" },
                { label: "PIN", sub: "StationGuard™", angle: 290, accent: "#0284C7" },
                { label: "Link", sub: "CareChain™", angle: 345, accent: "#38BDF8" },
              ].map(({ label, sub, angle, accent }) => {
                const rad = angle * Math.PI / 180, r = 235
                return (
                  <div key={label} className="glass" style={{
                    position: "absolute",
                    left: `calc(50% + ${Math.cos(rad) * r}px - 50px)`,
                    top: `calc(50% + ${Math.sin(rad) * r}px - 28px)`,
                    width: 100, padding: "9px 10px", textAlign: "center",
                    border: `1px solid ${accent}30`,
                    boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 12px ${accent}08`,
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: accent }}>{label}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--nl-txM)", letterSpacing: 0.6, textTransform: "uppercase", marginTop: 2 }}>{sub}</div>
                  </div>
                )
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════ SHOWCASE 3: HOLOGRAPHIC RECORDS ═══════════════════ */}
      <section style={{ padding: "100px 0", background: "var(--nl-bg)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 40% 60%, rgba(184,115,51,0.04) 0%, transparent 55%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            {/* Image */}
            <Reveal>
              <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(184,115,51,0.15)", boxShadow: "0 24px 80px rgba(0,0,0,0.4), 0 0 60px rgba(184,115,51,0.08)" }}>
                <Image src="/images/holographic-records.jpg" alt="Doctor reviewing intelligent patient records with connected workstation modules" width={600} height={400} style={{ width: "100%", height: "auto", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 60%, rgba(3,5,15,0.6) 100%)", pointerEvents: "none" }} />
              </div>
            </Reveal>
            {/* Text */}
            <Reveal delay={0.15}>
              <div className="section-label" style={{ marginBottom: 14 }}>Intelligence At The Point Of Care</div>
              <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)", fontWeight: 800, letterSpacing: -1, marginBottom: 20, lineHeight: 1.1, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
                The Patient Record,{" "}<span className="text-gradient-copper">Reimagined.</span>
              </h2>
              <p style={{ fontSize: 15, color: "var(--nl-txM)", lineHeight: 1.8, marginBottom: 28 }}>
                Every consultation connects to every workstation. Lab results, pharmacy orders, imaging reports, billing items, and referral chains — all visible in one intelligent patient view. Nexus-7™ structures the data so doctors think, not search.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Nexus-7™ InsightBrief", desc: "Structured clinical summaries generated from consultation data in real-time", accent: "#0EA5E9" },
                  { label: "Cross-Station Context", desc: "Lab, pharmacy, radiology, and billing data all visible from the consultation screen", accent: "#38BDF8" },
                  { label: "BillStream™ Auto-Capture", desc: "Every test ordered, drug dispensed, and procedure performed — billed automatically", accent: COPPER },
                ].map(f => (
                  <div key={f.label} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 3, height: 36, background: `linear-gradient(to bottom, ${f.accent}, transparent)`, borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: f.accent, marginBottom: 3 }}>{f.label}</div>
                      <div style={{ fontSize: 13, color: "var(--nl-txM)", lineHeight: 1.6 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══════════════════ OPERATIONAL DEPTH ═══════════════════ */}
      <section style={{ padding: "100px 0", background: "var(--nl-surf)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 72 }}>
            <div className="section-label" style={{ marginBottom: 14 }}>Built For Real Hospitals</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: -1, marginBottom: 16, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
              We Thought Of{" "}<span className="text-gradient-blue">Everything</span>
            </h2>
            <p style={{ color: "var(--nl-txM)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
              Shift changes, lunch breaks, emergencies at 3am, ward rounds before dawn — every real-world scenario, handled.
            </p>
          </Reveal>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18 }}>
            {[
              { title: "Doctor Break & Ward Rounds", desc: "Doctors pause their queue for breaks, prayer, or ward visits. Patients hold position — queue resumes seamlessly when they return.", accent: "#0EA5E9" },
              { title: "RedLine™ Emergency Escalation", desc: "Any doctor can escalate a patient to emergency mid-consultation. ER token issued instantly, priority queue activated across every workstation.", accent: "#EF4444" },
              { title: "Lab Return Priority Queue", desc: "Patient sent to lab returns to the doctor with priority status — they skip to the front, not the back.", accent: "#38BDF8" },
              { title: "SafeExit™ Discharge Verification", desc: "No patient leaves without verification. Discharge requires confirmation — prevents walkouts on unpaid bills and ensures billing closure.", accent: "#B87333" },
              { title: "CareChain™ Multi-Doctor Routing", desc: "Doctor A refers to Doctor B, who can chain to Doctor C. Full specialist routing with handover context at every step.", accent: "#0EA5E9" },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06}>
                <div style={{
                  padding: "28px 26px", borderRadius: 16,
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${f.accent}15`,
                  transition: "all 0.3s ease",
                  width: 380,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = f.accent + "40"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 40px ${f.accent}10` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = f.accent + "15"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: f.accent }}>{f.title}</div>
                  <div style={{ fontSize: 13.5, color: "var(--nl-txM)", lineHeight: 1.75 }}>{f.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* See More → Demo Gate */}
          <Reveal delay={0.3}>
            <div style={{ textAlign: "center", marginTop: 48 }}>
              <button
                onClick={() => {
                  const el = document.getElementById("demo-gate")
                  if (el) el.style.display = el.style.display === "none" ? "block" : "none"
                }}
                style={{
                  background: "none", border: `1px solid rgba(14,165,233,0.2)`, borderRadius: 12,
                  padding: "14px 36px", cursor: "pointer",
                  fontSize: 15, fontWeight: 700, color: "#38BDF8", letterSpacing: 0.3,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.5)"; e.currentTarget.style.background = "rgba(14,165,233,0.06)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.2)"; e.currentTarget.style.background = "none" }}
              >
                See More Dalxic Solutions →
              </button>

              <div id="demo-gate" style={{ display: "none", marginTop: 32 }}>
                <div style={{
                  maxWidth: 520, margin: "0 auto", padding: "40px 36px", borderRadius: 20,
                  background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}18`,
                  backdropFilter: "blur(8px)",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: COPPER, marginBottom: 12 }}>
                    30+ More Features
                  </div>
                  <h3 style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif", fontWeight: 800, fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", letterSpacing: -0.5, marginBottom: 12 }}>
                    Request A Demo &{" "}
                    <span style={{ background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      Experience Superiority In Real-Time
                    </span>
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--nl-txM)", lineHeight: 1.7, marginBottom: 28 }}>
                    Voice callouts, deceased protocols, abnormal value alerts, cross-tab sync, shift handover, and dozens more — see them live with your own hospital data.
                  </p>
                  <Link href="/pricing" style={{
                    display: "inline-block", padding: "14px 40px", borderRadius: 14,
                    fontSize: 14, fontWeight: 700, letterSpacing: "0.06em",
                    background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`,
                    color: "#fff", textDecoration: "none",
                    boxShadow: `0 8px 32px ${COPPER}30`,
                  }}>
                    Request A Demo
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="divider" />

      {/* ═══════════════════ ACCESS TIERS ═══════════════════ */}
      <section id="access" style={{ padding: "100px 0", background: "var(--nl-surf)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
            <div className="section-label-copper" style={{ marginBottom: 12 }}>Privileged Access</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: -1, marginBottom: 16, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
              Command & <span className="text-gradient-copper">Control</span>
            </h2>
            <p style={{ color: "var(--nl-txM)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              RedLine™ emergency protocol with permanent AuditVault™ trail. Multi-facility management from a single Dalxic dashboard.
            </p>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, maxWidth: 600, margin: "0 auto" }}>
            {ROUTES_SPECIAL.map((route, i) => (
              <Reveal key={route.href} delay={i * 0.1}>
                <Link href={route.href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                  <div className="glass-copper" style={{
                    padding: "36px 32px", cursor: "pointer",
                    transition: "all 0.35s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(184,115,51,0.4)"; e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(184,115,51,0.12)" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#B87333", marginBottom: 12 }}>{route.role}</div>
                    <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>{route.label}</h3>
                    <p style={{ fontSize: 14, color: "var(--nl-txM)", lineHeight: 1.7 }}>{route.desc}</p>
                    <div style={{ marginTop: 20, height: 2, background: "linear-gradient(90deg, rgba(184,115,51,0.6), transparent)", borderRadius: 1 }} />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TICKER ═══════════════════ */}
      <div style={{ padding: "16px 0", borderTop: "1px solid var(--nl-border)", borderBottom: "1px solid var(--nl-border)" }}>
        <TickerMulti />
      </div>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer style={{ padding: "48px 0 32px", background: "var(--nl-bg)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px" }}>
          {/* Workstations grid */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--nl-txM)", marginBottom: 20, textAlign: "center" }}>Workstations</div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 32px" }}>
              {["Registration & Triage", "Consultation", "Laboratory", "Pharmacy", "Nursing & Injection", "Emergency & ICU", "Inpatient & Ward", "Maternity", "Blood Bank", "Imaging & Radiology", "Billing & Revenue", "Queue & Display"].map(l => (
                <span key={l} style={{ fontSize: 13, color: "var(--nl-txD)" }}>{l}</span>
              ))}
            </div>
          </div>

          {/* Dalxic Subsidiaries */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--nl-txM)", marginBottom: 20 }}>Dalxic Subsidiaries</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
              {/* Dalxic — Copper */}
              <a href={MAIN_URL} style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, width: 160, height: 80, borderRadius: 14, border: "none", background: "none", transition: "all 0.3s ease", position: "relative", overflow: "hidden" }}
                onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(184,115,51,0.12) 0%, rgba(210,150,80,0.05) 100%)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(184,115,51,0.15)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.boxShadow = "none" }}>
                <span style={{ fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, #D4956B, #B87333)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Dalxic</span>
                <span style={{ fontSize: 11, color: "var(--nl-txD)" }}>dalxic.com</span>
              </a>
              {/* DalxicHealth — Blue (active) */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, width: 160, height: 80, borderRadius: 14, border: "none", background: "linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(56,189,248,0.04) 100%)", position: "relative", overflow: "hidden", boxShadow: "0 4px 20px rgba(14,165,233,0.08)" }}>
                <span style={{ fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, #38BDF8, #0EA5E9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>DalxicHealth</span>
                <span style={{ fontSize: 11, color: "var(--nl-txM)" }}>You Are Here</span>
              </div>
              {/* DalxicMedia — Indigo/Violet */}
              <a href={MEDIA_URL} style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, width: 160, height: 80, borderRadius: 14, border: "none", background: "none", transition: "all 0.3s ease", position: "relative", overflow: "hidden" }}
                onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(167,139,250,0.05) 100%)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.15)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.boxShadow = "none" }}>
                <span style={{ fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, #818CF8, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>DalxicMedia</span>
                <span style={{ fontSize: 11, color: "var(--nl-txD)" }}>media.dalxic.com</span>
              </a>
              {/* DalxicJudiciary — Ruby Red */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, width: 160, height: 80, borderRadius: 14, border: "none", background: "none", position: "relative", overflow: "hidden", opacity: 0.45 }}>
                <span style={{ fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, #EF4444, #DC2626)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>DalxicJudiciary</span>
                <span style={{ fontSize: 11, color: "var(--nl-txD)" }}>judiciary.dalxic.com</span>
              </div>
            </div>
          </div>

          {/* Brand */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ display: "inline-flex", alignItems: "baseline", marginBottom: 12 }}>
              <span style={{ fontWeight: 300, fontSize: 14, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Dalxic</span>
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }} className="text-gradient-blue">Health</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--nl-txD)", maxWidth: 400, margin: "0 auto", lineHeight: 1.7 }}>
              Nexus-7™ hospital management platform. Built for speed. Designed for precision. A Dalxic subsidiary.
            </p>
          </div>

          <div className="divider" style={{ marginBottom: 24 }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--nl-txD)" }}>
              &copy; 2026 Dalxic — health.dalxic.com
            </span>
            <span style={{ fontSize: 11, color: "var(--nl-txD)" }}>
              Ghana DPA · Nigeria NDPR · Kenya DPA · South Africa POPIA Compliant
            </span>
          </div>
        </div>
      </footer>
    </>
  )
}
