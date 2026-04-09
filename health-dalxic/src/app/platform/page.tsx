"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { ALL_WORKSTATIONS, UTILITY_STATIONS, getTierDefaults } from "@/lib/tier-defaults"

/* ─── Scroll-triggered reveal ─── */
function useReveal(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Check if already in viewport
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true)
      return
    }
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

/* ─── Galaxy Canvas (copper-toned, theme-aware) ─── */
function GalaxyCanvas({ isDayMode }: { isDayMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const themeRef = useRef(isDayMode)
  themeRef.current = isDayMode
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight * 1.5
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight * 1.5 }
    window.addEventListener("resize", resize)

    const stars = Array.from({ length: 420 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.72,
      vy: (Math.random() - 0.5) * 0.48,
      r: Math.random() < 0.08 ? Math.random() * 2.5 + 1.5 : Math.random() * 1.2 + 0.3,
      baseOpacity: Math.random() * 0.7 + 0.2,
      twinkleSpeed: Math.random() * 0.048 + 0.016,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: [
        [255, 255, 255],
        [255, 220, 180],    // warm white
        [184, 115, 51],     // copper
        [210, 150, 80],     // light copper
        [14, 165, 233],     // blue accent (rare)
        [200, 170, 130],    // sand
        [255, 180, 120],    // warm amber
        [160, 200, 255],    // cool blue
      ][Math.random() < 0.10 ? 2 : Math.random() < 0.15 ? 3 : Math.random() < 0.06 ? 4 : Math.random() < 0.05 ? 5 : Math.random() < 0.05 ? 6 : Math.random() < 0.04 ? 7 : Math.floor(Math.random() * 2)]
    }))

    const dust = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 2.0, vy: (Math.random() - 0.5) * 1.2,
      r: Math.random() * 1 + 0.3,
      opacity: Math.random() * 0.25 + 0.05,
      color: Math.random() < 0.5 ? [184, 115, 51] : Math.random() < 0.6 ? [14, 165, 233] : Math.random() < 0.5 ? [255, 180, 120] : [160, 200, 255] as number[]
    }))

    const nebulaCanvas = document.createElement("canvas")
    nebulaCanvas.width = W; nebulaCanvas.height = H
    const nctx = nebulaCanvas.getContext("2d")!
    // Copper nebula center
    const g1 = nctx.createRadialGradient(W * 0.55, H * 0.35, 0, W * 0.55, H * 0.35, W * 0.4)
    g1.addColorStop(0, "rgba(184,115,51,0.07)")
    g1.addColorStop(0.4, "rgba(210,150,80,0.04)")
    g1.addColorStop(0.7, "rgba(140,60,30,0.02)")
    g1.addColorStop(1, "transparent")
    nctx.fillStyle = g1; nctx.fillRect(0, 0, W, H)
    // Blue accent right
    const g2 = nctx.createRadialGradient(W * 0.8, H * 0.5, 0, W * 0.8, H * 0.5, W * 0.25)
    g2.addColorStop(0, "rgba(14,165,233,0.05)")
    g2.addColorStop(0.5, "rgba(56,189,248,0.02)")
    g2.addColorStop(1, "transparent")
    nctx.fillStyle = g2; nctx.fillRect(0, 0, W, H)
    // Warm glow left
    const g3 = nctx.createRadialGradient(W * 0.15, H * 0.25, 0, W * 0.15, H * 0.25, W * 0.3)
    g3.addColorStop(0, "rgba(184,115,51,0.04)")
    g3.addColorStop(0.6, "rgba(140,80,30,0.02)")
    g3.addColorStop(1, "transparent")
    nctx.fillStyle = g3; nctx.fillRect(0, 0, W, H)
    // Deep bottom
    const g4 = nctx.createRadialGradient(W * 0.5, H * 0.9, 0, W * 0.5, H * 0.9, W * 0.35)
    g4.addColorStop(0, "rgba(120,60,20,0.04)")
    g4.addColorStop(0.5, "rgba(184,115,51,0.02)")
    g4.addColorStop(1, "transparent")
    nctx.fillStyle = g4; nctx.fillRect(0, 0, W, H)

    let t = 0, raf: number
    function draw() {
      t++
      const isDay = themeRef.current
      const pMul = isDay ? 0.18 : 1 // particle opacity multiplier
      const nMul = isDay ? 0.12 : 0.9 // nebula opacity

      ctx!.clearRect(0, 0, W, H)
      ctx!.globalAlpha = nMul
      ctx!.drawImage(nebulaCanvas, 0, 0)
      ctx!.globalAlpha = 1

      // Light rays — warm diagonal
      if (!isDay) {
        ctx!.save()
        for (let i = 0; i < 3; i++) {
          const rayX = W * (0.05 + i * 0.12)
          const rayGrad = ctx!.createLinearGradient(rayX, 0, rayX + W * 0.3, H * 0.7)
          rayGrad.addColorStop(0, `rgba(255,220,180,${0.012 + Math.sin(t * 0.003 + i) * 0.006})`)
          rayGrad.addColorStop(0.5, `rgba(184,115,51,${0.006 + Math.sin(t * 0.004 + i * 2) * 0.004})`)
          rayGrad.addColorStop(1, "transparent")
          ctx!.fillStyle = rayGrad
          ctx!.beginPath()
          ctx!.moveTo(rayX, 0); ctx!.lineTo(rayX + 60 + i * 20, 0)
          ctx!.lineTo(rayX + W * 0.35, H * 0.75); ctx!.lineTo(rayX + W * 0.25, H * 0.75)
          ctx!.closePath(); ctx!.fill()
        }
        ctx!.restore()
      }

      // Stars
      stars.forEach(s => {
        s.x += s.vx; s.y += s.vy
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0
        if (s.y < 0) s.y = H; if (s.y > H) s.y = 0
        const flicker = Math.sin(t * s.twinkleSpeed + s.twinkleOffset) * 0.3 + 0.7
        const opacity = s.baseOpacity * flicker * pMul
        // Day mode: shift particles to warm copper/bronze tones
        const c = isDay ? [[184,140,100],[160,110,65],[139,90,43],[180,130,80]][Math.floor(s.twinkleOffset) % 4] : s.color
        ctx!.beginPath(); ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${opacity})`; ctx!.fill()
        if (s.r > 1.5 && !isDay) {
          const glow = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4)
          glow.addColorStop(0, `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${opacity * 0.3})`)
          glow.addColorStop(1, "transparent")
          ctx!.fillStyle = glow; ctx!.fillRect(s.x - s.r * 4, s.y - s.r * 4, s.r * 8, s.r * 8)
        }
      })

      // Dust
      dust.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        const dC = isDay ? [160,110,65] : p.color
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${dC[0]},${dC[1]},${dC[2]},${p.opacity * pMul})`; ctx!.fill()
      })

      if (!isDay) {
        for (let i = 0; i < dust.length; i++) for (let j = i + 1; j < dust.length; j++) {
          const dx = dust[i].x - dust[j].x, dy = dust[i].y - dust[j].y, d = Math.sqrt(dx * dx + dy * dy)
          if (d < 140) {
            ctx!.beginPath()
            ctx!.strokeStyle = `rgba(184,115,51,${0.08 * (1 - d / 140)})`
            ctx!.lineWidth = 0.4
            ctx!.moveTo(dust[i].x, dust[i].y); ctx!.lineTo(dust[j].x, dust[j].y); ctx!.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
}

const HOSPITAL_CODE = "KBH"

const COPPER = "#B87333"
const COPPER_GLOW = "rgba(184,115,51,0.5)"

export default function PlatformPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isDayMode, setIsDayMode] = useState(false)
  const defaultModules = getTierDefaults("T4")
  const [activeModules, setActiveModules] = useState<string[]>([...defaultModules.modules])
  const [tierLabel, setTierLabel] = useState(defaultModules.label)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch hospital's active modules
  useEffect(() => {
    async function loadHospital() {
      try {
        const res = await fetch(`/api/hospitals?code=${HOSPITAL_CODE}`)
        if (res.ok) {
          const data = await res.json()
          const hospital = Array.isArray(data) ? data[0] : data
          if (hospital?.activeModules?.length > 0) {
            setActiveModules(hospital.activeModules)
            setTierLabel(getTierDefaults(hospital.tier).label)
          } else {
            // Fallback: use tier defaults if activeModules not populated yet
            const defaults = getTierDefaults(hospital?.tier || "T4")
            setActiveModules([...defaults.modules])
            setTierLabel(defaults.label)
          }
        }
      } catch {
        // Fallback to T4 (show everything) if hospital fetch fails
        const defaults = getTierDefaults("T4")
        setActiveModules([...defaults.modules])
        setTierLabel(defaults.label)
      }
    }
    loadHospital()
  }, [])

  const STATIONS = [
    ...ALL_WORKSTATIONS.filter((ws) => activeModules.includes(ws.key)),
    ...UTILITY_STATIONS,
  ]

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDayMode ? "light" : "dark")
    return () => document.documentElement.removeAttribute("data-theme")
  }, [isDayMode])

  const toggleTheme = useCallback(() => setIsDayMode(prev => !prev), [])

  /* ORIGINAL VALUES (for revert):
   * darkBg = "radial-gradient(ellipse 120% 80% at 55% 40%, rgba(20,12,8,1) 0%, rgba(8,5,15,1) 50%, rgba(2,4,12,1) 100%)"
   * copper glow: 0.05, blue glow: 0.03, amber glow: 0.04
   */
  const darkBg = "radial-gradient(ellipse 120% 80% at 55% 40%, rgba(12,7,3,1) 0%, rgba(5,3,10,1) 50%, rgba(1,2,8,1) 100%)"
  /* ORIGINAL lightBg (for revert): "linear-gradient(180deg, #FAF7F4 0%, #F5F0EB 30%, #EDE6DE 60%, #E4D9CE 100%)" */
  const lightBg = "linear-gradient(180deg, #EDE5DB 0%, #E4DACE 30%, #D9CFC0 60%, #D0C4B3 100%)"

  return (
    <div style={{ minHeight: "100vh", background: isDayMode ? lightBg : darkBg, position: "relative", overflow: "hidden", transition: "background 0.6s ease" }}>
      {/* Deep space layers — copper toned, brighter ambient */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 55% 35%, rgba(184,115,51,0.10) 0%, transparent 55%)", pointerEvents: "none", opacity: isDayMode ? 0.3 : 1, transition: "opacity 0.6s ease" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(14,165,233,0.05) 0%, transparent 45%)", pointerEvents: "none", opacity: isDayMode ? 0.2 : 1, transition: "opacity 0.6s ease" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 25%, rgba(140,80,30,0.07) 0%, transparent 45%)", pointerEvents: "none", opacity: isDayMode ? 0.3 : 1, transition: "opacity 0.6s ease" }} />
      {/* Extra warm wash behind content zone */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(232,184,120,0.04) 0%, transparent 40%)", pointerEvents: "none", opacity: isDayMode ? 0 : 1, transition: "opacity 0.6s ease" }} />
      <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: isDayMode ? 0.06 : 0.12, pointerEvents: "none", transition: "opacity 0.6s ease" }} />
      {/* Noise grain texture — day mode premium feel */}
      {isDayMode && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.035, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "200px 200px" }} />}
      <GalaxyCanvas isDayMode={isDayMode} />

      {/* Header — fixed transparent glass */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "20px 44px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: isDayMode ? "1px solid rgba(139,90,43,0.08)" : "1px solid rgba(184,115,51,0.06)",
        background: "transparent",
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
        boxShadow: "none",
        transition: "background 0.4s ease, border-bottom 0.4s ease",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <span style={{ fontWeight: 300, fontSize: 14, color: isDayMode ? "#6B7280" : "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif", transition: "color 0.4s ease" }}>Dalxic</span>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Day/Night Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
              background: isDayMode
                ? "linear-gradient(135deg, #F59E0B, #FBBF24)"
                : "linear-gradient(135deg, #1E293B, #334155)",
              position: "relative",
              transition: "background 0.4s ease",
              boxShadow: isDayMode
                ? "0 2px 8px rgba(245,158,11,0.3)"
                : "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              position: "absolute", top: 3,
              left: isDayMode ? 27 : 3,
              background: isDayMode ? "#FFF" : "#0F172A",
              transition: "left 0.3s ease, background 0.3s ease",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: isDayMode ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
            }}>
              <span style={{ fontSize: 12, lineHeight: 1 }}>{isDayMode ? "☀️" : "🌙"}</span>
            </div>
          </button>
          <time suppressHydrationWarning style={{ fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace", fontSize: 13, color: "var(--nl-txM)", letterSpacing: 0.5 }}>
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </time>
        </div>
      </header>

      {/* Floating ambient glow orbs — soft, no moving parts */}
      {!isDayMode && (
        <>
          <div className="glow-pulse-copper" style={{
            position: "absolute", top: "25%", left: "5%", width: 300, height: 300,
            borderRadius: "50%", background: `radial-gradient(circle, ${COPPER}12, transparent 70%)`,
            filter: "blur(60px)", pointerEvents: "none", zIndex: 0,
          }} />
          <div className="glow-pulse" style={{
            position: "absolute", top: "45%", right: "3%", width: 250, height: 250,
            borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,0.08), transparent 70%)",
            filter: "blur(50px)", pointerEvents: "none", zIndex: 0,
          }} />
          <div className="glow-pulse-copper" style={{
            position: "absolute", bottom: "20%", left: "30%", width: 200, height: 200,
            borderRadius: "50%", background: `radial-gradient(circle, ${COPPER}08, transparent 70%)`,
            filter: "blur(45px)", pointerEvents: "none", zIndex: 0,
            animationDelay: "2s",
          }} />
        </>
      )}

      {/* Main content */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "28px 32px 80px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 44, animation: "fadeUp 0.6s ease 0.1s both" }}>
          {/* Floating dotted ring — always rendered to keep layout stable */}
          <div style={{
            width: 44, height: 44, borderRadius: "50%", margin: "0 auto 18px",
            border: `2px solid ${isDayMode ? "#8B5A2B" : COPPER + "4D"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "border-color 0.4s ease", position: "relative", zIndex: 51,
          }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: isDayMode ? "#B87333" : COPPER, boxShadow: isDayMode ? "0 0 12px rgba(184,115,51,0.6)" : `0 0 14px ${COPPER_GLOW}`, transition: "all 0.4s ease" }} />
          </div>
          <div className="section-label-copper" style={{ marginBottom: 14, fontSize: 12, fontWeight: 700 }}>Select Workstation</div>
          {tierLabel && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 20, marginBottom: 12, background: isDayMode ? "rgba(184,115,51,0.08)" : "rgba(184,115,51,0.06)", border: `1px solid ${isDayMode ? "rgba(184,115,51,0.15)" : "rgba(184,115,51,0.12)"}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: COPPER, fontFamily: "var(--font-jetbrains-mono), monospace" }}>{tierLabel}</span>
              <span style={{ fontSize: 10, color: isDayMode ? "#6B7280" : "#64748B" }}>•</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: isDayMode ? "#6B7280" : "#64748B" }}>{STATIONS.length} Workstations</span>
            </div>
          )}
          <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, marginBottom: 16, fontFamily: "var(--font-outfit), Outfit, sans-serif", color: isDayMode ? "#1A1714" : undefined, transition: "color 0.4s ease" }}>
            Choose Your <span className="text-gradient-copper">Workstation</span>
          </h1>
          <p style={{ color: "var(--nl-txM)", maxWidth: 480, margin: "0 auto", lineHeight: 1.7, fontSize: 16, fontWeight: 500 }}>
            Each Workstation Is Purpose-Built For Its Role. Select Yours To Begin.
          </p>
        </div>

        {/* Workstation Grid */}
        {/* ORIGINAL card styles (for revert): glass class default, no boxShadow, onMouseEnter copper 30/15 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {STATIONS.map((s, i) => (
            <Reveal key={s.href} delay={i * 0.06} style={{ height: "100%" }}>
              <div onClick={() => window.location.href = s.href} style={{ cursor: "pointer", color: "inherit", display: "flex", height: "100%" }}>
                <div className={`glass ${isDayMode ? "l-glow-day" : ""}`} style={{
                  padding: "28px 24px", cursor: "pointer", width: "100%",
                  display: "flex", flexDirection: "column",
                  transition: "all 0.35s ease",
                  /* ORIGINAL day card (for revert): bg 0.55, border rgba(139,90,43,0.25) */
                  ...(isDayMode ? {
                    background: "rgba(255,255,255,0.82)",
                    border: "1.5px solid rgba(139,90,43,0.18)",
                    borderTop: "1.5px solid rgba(184,140,80,0.30)",
                    boxShadow: "0 4px 20px rgba(139,90,43,0.08), 0 0 40px rgba(184,115,51,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
                  } : {
                    background: "rgba(255,255,255,0.025)",
                    border: `1px solid ${COPPER}12`,
                    boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 40px ${COPPER}04, inset 0 1px 0 rgba(255,255,255,0.03)`,
                  }),
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = isDayMode ? "rgba(184,140,80,0.30)" : COPPER + "80"
                  e.currentTarget.style.transform = "translateY(-4px)"
                  e.currentTarget.style.boxShadow = isDayMode
                    ? `0 8px 32px rgba(139,90,43,0.12), 0 0 48px rgba(184,115,51,0.08), 0 0 80px rgba(210,170,120,0.05), inset 0 1px 0 rgba(255,255,255,0.95)`
                    : `0 16px 48px ${COPPER}35, 0 0 80px ${COPPER}18, inset 0 1px 0 rgba(255,255,255,0.06)`
                  e.currentTarget.style.background = isDayMode ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.04)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = isDayMode ? "rgba(139,90,43,0.18)" : COPPER + "12"
                  e.currentTarget.style.transform = ""
                  e.currentTarget.style.boxShadow = isDayMode ? "0 4px 20px rgba(139,90,43,0.08), 0 0 40px rgba(184,115,51,0.04), inset 0 1px 0 rgba(255,255,255,0.9)" : `0 4px 24px rgba(0,0,0,0.3), 0 0 40px ${COPPER}04, inset 0 1px 0 rgba(255,255,255,0.03)`
                  e.currentTarget.style.background = isDayMode ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.025)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 30 }}>{s.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: isDayMode ? "#8B5A2B" : COPPER, fontFamily: "var(--font-jetbrains-mono), monospace", transition: "color 0.4s ease" }}>{s.role}</span>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, fontFamily: "var(--font-outfit), Outfit, sans-serif", color: isDayMode ? "#1A1714" : undefined, transition: "color 0.4s ease" }}>{s.title}</h3>
                  <p style={{ fontSize: 14.5, fontWeight: 500, color: "var(--nl-txM)", lineHeight: 1.6, flex: 1 }}>{s.desc}</p>
                  <div style={{ marginTop: 20, height: 2, background: isDayMode ? `linear-gradient(90deg, #8B5A2BA0, #B8733360, transparent)` : `linear-gradient(90deg, ${COPPER}90, ${COPPER}30, transparent)`, borderRadius: 1, transition: "background 0.4s ease" }} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Emergency Override — privileged, centered, wider */}
        <Reveal delay={0.4} style={{ marginTop: 40 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div className="section-label-copper" style={{ marginBottom: 0 }}>Privileged Access</div>
          </div>
          {/* ORIGINAL emergency card: borderColor COPPER+"25", no default boxShadow */}
          <div onClick={() => window.location.href = "/w/Dk7_xQ3nXv0T~sF6bW2mYr8hLa"} style={{ cursor: "pointer", color: "inherit", display: "block", maxWidth: 680, margin: "0 auto" }}>
            <div className={`glass ${isDayMode ? "l-glow-day" : ""}`} style={{
              padding: "32px 32px", cursor: "pointer",
              display: "flex", flexDirection: "column",
              transition: "all 0.35s ease",
              ...(isDayMode ? {
                background: "rgba(255,255,255,0.82)",
                border: "1.5px solid rgba(139,90,43,0.18)",
                borderTop: "1.5px solid rgba(184,140,80,0.30)",
                boxShadow: "0 4px 24px rgba(139,90,43,0.10), 0 0 48px rgba(184,115,51,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
              } : {
                background: "rgba(255,255,255,0.04)",
                border: `1.5px solid ${COPPER}20`,
                boxShadow: `0 4px 32px rgba(0,0,0,0.3), 0 0 48px ${COPPER}06, inset 0 1px 0 rgba(255,255,255,0.05)`,
              }),
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = isDayMode ? "rgba(184,140,80,0.30)" : COPPER + "90"
              e.currentTarget.style.transform = "translateY(-4px)"
              e.currentTarget.style.boxShadow = isDayMode
                ? `0 8px 36px rgba(139,90,43,0.14), 0 0 60px rgba(184,115,51,0.08), inset 0 1px 0 rgba(255,255,255,0.95)`
                : `0 20px 60px ${COPPER}40, 0 0 100px ${COPPER}20, inset 0 1px 0 rgba(255,255,255,0.07)`
              e.currentTarget.style.background = isDayMode ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.06)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = isDayMode ? "rgba(139,90,43,0.18)" : COPPER + "20"
              e.currentTarget.style.transform = ""
              e.currentTarget.style.boxShadow = isDayMode ? "0 4px 24px rgba(139,90,43,0.10), 0 0 48px rgba(184,115,51,0.05), inset 0 1px 0 rgba(255,255,255,0.9)" : `0 4px 32px rgba(0,0,0,0.3), 0 0 48px ${COPPER}06, inset 0 1px 0 rgba(255,255,255,0.05)`
              e.currentTarget.style.background = isDayMode ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.04)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 30 }}>🚨</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: isDayMode ? "#8B5A2B" : COPPER, fontFamily: "var(--font-jetbrains-mono), monospace", transition: "color 0.4s ease" }}>CMO / Medical Director</span>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, fontFamily: "var(--font-outfit), Outfit, sans-serif", color: isDayMode ? "#1A1714" : undefined, transition: "color 0.4s ease" }}>Emergency Override</h3>
              <p style={{ fontSize: 14.5, fontWeight: 500, color: "var(--nl-txM)", lineHeight: 1.7, flex: 1 }}>CMO Read-Only Emergency Access — All Actions Permanently Logged With Uneditable Audit Trail</p>
              <div style={{ marginTop: 20, height: 2, background: isDayMode ? `linear-gradient(90deg, #8B5A2BA0, #B8733360, transparent)` : `linear-gradient(90deg, ${COPPER}90, ${COPPER}30, transparent)`, borderRadius: 1, transition: "background 0.4s ease" }} />
            </div>
          </div>
        </Reveal>
      </main>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 1, padding: "20px 44px", borderTop: "1px solid var(--nl-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${COPPER}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: `${COPPER}66` }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--nl-txD)" }}>A Dalxic subsidiary</span>
        </div>
        <span onClick={() => window.location.href = "/s/ZXJ2LkQ9Mnx0V3hCYTVrUw.aGVhbHRo"} style={{ fontSize: 12, fontWeight: 500, color: "var(--nl-txD)", cursor: "default" }}>We Serve You Better</span>
      </footer>
    </div>
  )
}
