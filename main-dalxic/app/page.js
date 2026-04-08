"use client"
import { useRef, useEffect, useState } from "react"
import DalxicLogo from "./components/DalxicLogo"

/* ═══════════════════════════════════════════════════════════
   DALXIC MAIN — dalxic.com Landing Page
   Locked to DESIGN_SYSTEM.md
   Galaxy particle canvas + copper/indigo/cyan palette
   ═══════════════════════════════════════════════════════════ */

/* ── Cross-subsidiary links ── */
const MEDIA  = process.env.NEXT_PUBLIC_MEDIA_URL  || "http://localhost:3001"
const HEALTH = process.env.NEXT_PUBLIC_HEALTH_URL || "http://localhost:3002"
const LINKS = {
  main: "/",
  health: HEALTH,
  media: MEDIA,
  judiciary: "#",
}

/* ── GalaxyCanvas — canvas-based particle system ─────────── */
function GalaxyCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let W = (canvas.width = window.innerWidth)
    let H = (canvas.height = window.innerHeight)
    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      drawNebula()
    }
    window.addEventListener("resize", resize)

    /* Star colours: white 60%, copper 20%, indigo 15%, cyan 5% */
    function pickStarColor() {
      const r = Math.random()
      if (r < 0.60) return [255, 255, 255]
      if (r < 0.80) return [184, 115, 51]
      if (r < 0.95) return [99, 102, 241]
      return [34, 211, 238]
    }

    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.24,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() < 0.08 ? Math.random() * 2.5 + 1.5 : Math.random() * 1.2 + 0.3,
      baseOpacity: Math.random() * 0.7 + 0.2,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: pickStarColor(),
    }))

    const dust = Array.from({ length: 40 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.9,
      vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 1 + 0.3,
      opacity: Math.random() * 0.3 + 0.05,
      color: Math.random() < 0.4 ? [184, 115, 51] : Math.random() < 0.7 ? [99, 102, 241] : [34, 211, 238],
    }))

    /* Nebula — offscreen canvas, redrawn on resize */
    const nebulaCanvas = document.createElement("canvas")
    const nctx = nebulaCanvas.getContext("2d")

    function drawNebula() {
      nebulaCanvas.width = W
      nebulaCanvas.height = H
      if (!nctx) return
      // Cloud 1: copper center-right
      const g1 = nctx.createRadialGradient(W * 0.6, H * 0.4, 0, W * 0.6, H * 0.4, W * 0.45)
      g1.addColorStop(0, "rgba(184,115,51,0.10)")
      g1.addColorStop(0.3, "rgba(212,149,107,0.05)")
      g1.addColorStop(0.6, "rgba(140,80,30,0.03)")
      g1.addColorStop(1, "transparent")
      nctx.fillStyle = g1
      nctx.fillRect(0, 0, W, H)
      // Cloud 2: indigo upper-left
      const g2 = nctx.createRadialGradient(W * 0.2, H * 0.25, 0, W * 0.2, H * 0.25, W * 0.35)
      g2.addColorStop(0, "rgba(99,102,241,0.08)")
      g2.addColorStop(0.4, "rgba(129,140,248,0.04)")
      g2.addColorStop(1, "transparent")
      nctx.fillStyle = g2
      nctx.fillRect(0, 0, W, H)
      // Cloud 3: cyan bottom-right
      const g3 = nctx.createRadialGradient(W * 0.8, H * 0.7, 0, W * 0.8, H * 0.7, W * 0.3)
      g3.addColorStop(0, "rgba(34,211,238,0.05)")
      g3.addColorStop(0.5, "rgba(34,211,238,0.02)")
      g3.addColorStop(1, "transparent")
      nctx.fillStyle = g3
      nctx.fillRect(0, 0, W, H)
      // Cloud 4: copper bottom
      const g4 = nctx.createRadialGradient(W * 0.4, H * 0.85, 0, W * 0.4, H * 0.85, W * 0.35)
      g4.addColorStop(0, "rgba(160,90,30,0.05)")
      g4.addColorStop(0.5, "rgba(184,115,51,0.02)")
      g4.addColorStop(1, "transparent")
      nctx.fillStyle = g4
      nctx.fillRect(0, 0, W, H)
    }
    drawNebula()

    let t = 0
    let raf

    function draw() {
      t++
      ctx.clearRect(0, 0, W, H)

      /* Nebula layer */
      ctx.globalAlpha = 0.9
      ctx.drawImage(nebulaCanvas, 0, 0)
      ctx.globalAlpha = 1

      /* Light rays */
      ctx.save()
      for (let i = 0; i < 3; i++) {
        const rayX = W * (0.05 + i * 0.12)
        const rayGrad = ctx.createLinearGradient(rayX, 0, rayX + W * 0.3, H * 0.7)
        rayGrad.addColorStop(0, `rgba(255,230,200,${0.015 + Math.sin(t * 0.003 + i) * 0.008})`)
        rayGrad.addColorStop(0.5, `rgba(212,149,107,${0.008 + Math.sin(t * 0.004 + i * 2) * 0.005})`)
        rayGrad.addColorStop(1, "transparent")
        ctx.fillStyle = rayGrad
        ctx.beginPath()
        ctx.moveTo(rayX, 0)
        ctx.lineTo(rayX + 60 + i * 20, 0)
        ctx.lineTo(rayX + W * 0.35, H * 0.75)
        ctx.lineTo(rayX + W * 0.25, H * 0.75)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()

      /* Stars with twinkling */
      stars.forEach((s) => {
        s.x += s.vx
        s.y += s.vy
        if (s.x < 0) s.x = W
        if (s.x > W) s.x = 0
        if (s.y < 0) s.y = H
        if (s.y > H) s.y = 0
        const flicker = Math.sin(t * s.twinkleSpeed + s.twinkleOffset) * 0.3 + 0.7
        const opacity = s.baseOpacity * flicker
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${opacity})`
        ctx.fill()
        if (s.r > 1.5) {
          const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4)
          glow.addColorStop(0, `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${opacity * 0.3})`)
          glow.addColorStop(1, "transparent")
          ctx.fillStyle = glow
          ctx.fillRect(s.x - s.r * 4, s.y - s.r * 4, s.r * 8, s.r * 8)
        }
      })

      /* Dust particles */
      dust.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.opacity})`
        ctx.fill()
      })

      /* Connecting lines between nearby dust */
      for (let i = 0; i < dust.length; i++) {
        for (let j = i + 1; j < dust.length; j++) {
          const dx = dust[i].x - dust[j].x
          const dy = dust[i].y - dust[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 140) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(184,115,51,${0.08 * (1 - d / 140)})`
            ctx.lineWidth = 0.4
            ctx.moveTo(dust[i].x, dust[i].y)
            ctx.lineTo(dust[j].x, dust[j].y)
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />
}

/* ── Reveal — scroll-triggered fade-up ───────────────────── */
function Reveal({ children, delay = 0, style = {} }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ── Counter — animated number ───────────────────────────── */
function Counter({ target, suffix = "", prefix = "", decimals = 0 }) {
  const ref = useRef(null)
  const [val, setVal] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        obs.disconnect()
        const duration = 2200
        const start = performance.now()
        function tick(now) {
          const elapsed = now - start
          const progress = Math.min(elapsed / duration, 1)
          const ease = 1 - Math.pow(1 - progress, 3)
          setVal(ease * target)
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{prefix}{val.toFixed(decimals)}{suffix}</span>
}

/* ── Ticker — scrolling text bar with center glow ────────── */
function Ticker({ items }) {
  const containerRef = useRef(null)
  const trackRef = useRef(null)
  const itemRefs = useRef([])
  const doubled = [...items, ...items]

  useEffect(() => {
    const container = containerRef.current
    const track = trackRef.current
    if (!container || !track) return
    let raf
    function update() {
      const containerRect = container.getBoundingClientRect()
      const centerX = containerRect.left + containerRect.width / 2
      const fadeZone = containerRect.width * 0.35
      itemRefs.current.forEach((el) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const itemCenterX = rect.left + rect.width / 2
        const dist = Math.abs(itemCenterX - centerX)
        const t = Math.max(0, 1 - dist / fadeZone)
        const opacity = 0.2 + t * 0.8
        const color = t > 0.5
          ? `rgba(232,236,248,${opacity})`
          : `rgba(61,77,120,${opacity})`
        el.style.color = color
        if (t > 0.7) {
          el.style.textShadow = `0 0 ${12 * t}px rgba(167,139,250,${t * 0.4})`
        } else {
          el.style.textShadow = "none"
        }
      })
      raf = requestAnimationFrame(update)
    }
    update()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div ref={containerRef} style={{ overflow: "hidden", width: "100%", position: "relative" }}>
      <div
        ref={trackRef}
        style={{
          display: "flex",
          gap: "var(--sp-2xl)",
          whiteSpace: "nowrap",
          animation: "tickerScroll 90s linear infinite",
          width: "max-content",
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            ref={(el) => (itemRefs.current[i] = el)}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              fontWeight: 500,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "var(--txD)",
              transition: "text-shadow 0.3s ease",
            }}
          >
            {item}
          </span>
        ))}
      </div>
      <style>{`@keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  )
}

/* ── Vertical Card ───────────────────────────────────────── */
function VerticalCard({ name, tagline, description, accent, accentGlow, modules, status, href, delay }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Reveal delay={delay} style={{ height: "100%" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "rgba(8, 12, 28, 0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${hovered ? accent : "rgba(255,255,255,0.05)"}`,
          borderRadius: "16px",
          padding: "var(--sp-xl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-md)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hovered ? `0 8px 32px ${accentGlow}` : "0 4px 24px rgba(0,0,0,0.3)",
          transition: "all 0.25s ease",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          height: "100%",
        }}
      >
        {/* Status badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              fontWeight: 500,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: accent,
            }}
          >
            {name}
          </span>
          <span
            style={{
              fontFamily: "var(--font-accent)",
              fontStyle: "italic",
              fontSize: "var(--fs-sm)",
              color: status === "Live" ? "var(--success)" : "var(--txD)",
            }}
          >
            {status}
          </span>
        </div>

        {/* Tagline */}
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h2)",
            fontWeight: 700,
            lineHeight: 1.2,
            color: "var(--tx)",
          }}
        >
          {tagline}
        </h3>

        {/* Description — flex grows to fill, pushing chips+CTA to card bottom */}
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-body)",
            lineHeight: 1.65,
            color: "var(--txM)",
            flex: 1,
          }}
        >
          {description}
        </p>

        {/* Module chips — 2x2 grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {modules.map((m) => (
            <span
              key={m}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                fontWeight: 400,
                padding: "4px 10px",
                borderRadius: "6px",
                border: `1px solid ${accent}33`,
                color: accent,
                background: `${accent}0A`,
                whiteSpace: "nowrap",
              }}
            >
              {m}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: "auto", paddingTop: "var(--sp-md)", textAlign: "right" }}>
          <a
            href={href}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              fontWeight: 600,
              color: accent,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
            }}
          >
            {status === "Live" ? "Enter Platform" : "Coming Soon"}{" "}
            <span style={{ transition: "transform 0.25s", transform: hovered ? "translateX(4px)" : "none" }}>
              &rarr;
            </span>
          </a>
        </div>

        {/* Accent glow orb */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accentGlow}, transparent)`,
            opacity: hovered ? 0.3 : 0.1,
            transition: "opacity 0.25s ease",
            pointerEvents: "none",
          }}
        />
      </div>
    </Reveal>
  )
}

/* ── Stat Block ──────────────────────────────────────────── */
function StatBlock({ value, suffix, label, delay }) {
  return (
    <Reveal delay={delay}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h1)",
            fontWeight: 800,
            lineHeight: 1.1,
            background: "linear-gradient(135deg, var(--copper-light), var(--copper), var(--indigo))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          <Counter target={value} suffix={suffix} />
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            fontWeight: 500,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--txM)",
            marginTop: "var(--sp-sm)",
          }}
        >
          {label}
        </div>
      </div>
    </Reveal>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function Home() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <GalaxyCanvas />

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 var(--sp-xl)",
          height: "64px",
          background: scrolled ? "rgba(3,5,15,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.04)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        {/* Logo (shared master component) */}
        <DalxicLogo size="lg" />

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-xl)" }}>
          {[
            { label: "Technology", href: "#technology" },
            { label: "Solutions", href: "#solutions" },
            { label: "About", href: "#about" },
            { label: "Health", href: LINKS.health },
            { label: "Media", href: LINKS.media },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
                fontWeight: 500,
                color: "var(--txM)",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--tx)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--txM)")}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#solutions"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              fontWeight: 600,
              padding: "10px 22px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, var(--copper), var(--indigo-deep))",
              color: "#fff",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(184,115,51,0.3)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            Explore
          </a>
        </div>
      </nav>

      {/* ── Main Content ───────────────────────────────── */}
      <main style={{ position: "relative", zIndex: 1 }}>

        {/* ── HERO SECTION ─────────────────────────────── */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "var(--sp-3xl) var(--sp-xl) var(--sp-3xl)",
            position: "relative",
          }}
        >
          {/* Nexus-7 badge */}
          <Reveal delay={0}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 20px",
                borderRadius: "40px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(8,12,28,0.6)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                marginBottom: "var(--sp-xl)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--copper)",
                  boxShadow: "0 0 8px var(--copper)",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-xs)",
                  fontWeight: 500,
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  color: "var(--txM)",
                }}
              >
                Nexus-7 Integration Engine
              </span>
            </div>
          </Reveal>

          {/* Main title — big bold */}
          <Reveal delay={0.1}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.8rem, 5.5vw, 5.2rem)",
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                maxWidth: "900px",
                color: "var(--tx)",
                marginBottom: "var(--sp-md)",
              }}
            >
              The Worlds Most
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ marginBottom: "var(--sp-lg)" }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)",
                  fontWeight: 800,
                  letterSpacing: "-1px",
                  background: "linear-gradient(135deg, var(--copper-light), var(--copper), var(--indigo), var(--violet))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "block",
                  lineHeight: 1.15,
                }}
              >
                Advanced Integration
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                  fontWeight: 800,
                  letterSpacing: "-1px",
                  background: "linear-gradient(135deg, var(--cyan), var(--indigo), var(--violet))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "block",
                  lineHeight: 1.15,
                  marginTop: "4px",
                }}
              >
                Platform
              </span>
            </div>
          </Reveal>

          {/* Tagline — faded, subtle, reusable */}
          <Reveal delay={0.2}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-sm)",
                fontWeight: 500,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--txD)",
                display: "block",
                marginBottom: "var(--sp-sm)",
              }}
            >
              Technology That Protects
            </span>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(0.9rem, 1.3vw, 1.05rem)",
                lineHeight: 1.7,
                color: "var(--txM)",
                maxWidth: "560px",
                marginBottom: "var(--sp-md)",
              }}
            >
              Safeguarding truth across healthcare, media integrity, and
              the judiciary. One engine. Three frontiers. Zero compromise.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div style={{ display: "flex", gap: "var(--sp-md)", flexWrap: "wrap", justifyContent: "center" }}>
              <a
                href="#solutions"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-body)",
                  fontWeight: 600,
                  padding: "14px 32px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, var(--copper), var(--copper-mid))",
                  color: "#fff",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 6px 24px rgba(184,115,51,0.35)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                Our Platforms
              </a>
              <a
                href="#technology"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-body)",
                  fontWeight: 600,
                  padding: "14px 32px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  color: "var(--txM)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border2)"
                  e.currentTarget.style.color = "var(--tx)"
                  e.currentTarget.style.transform = "translateY(-2px)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)"
                  e.currentTarget.style.color = "var(--txM)"
                  e.currentTarget.style.transform = "translateY(0)"
                }}
              >
                The Engine
              </a>
            </div>
          </Reveal>

          {/* Scroll indicator */}
          <div
            style={{
              position: "absolute",
              bottom: "var(--sp-xl)",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--sp-sm)",
              opacity: 0.4,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--txD)",
              }}
            >
              Scroll
            </span>
            <div
              style={{
                width: "1px",
                height: "32px",
                background: "linear-gradient(to bottom, var(--txD), transparent)",
              }}
            />
          </div>
        </section>

        {/* ── TICKER ───────────────────────────────────── */}
        <section style={{ padding: "var(--sp-xl) 0", borderTop: "1px solid rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
          <Ticker
            items={[
              /* ── Brand ── */
              "Nexus-7 Engine",
              "Pan-African Infrastructure",

              /* ── Media / Forensic ── */
              "Deepfake Detection",
              "Evidence Authentication",
              "Forensic Media Analysis",
              "Chain Of Custody Logging",
              "Metadata Extraction",
              "Reverse Image Search",
              "Geolocation Verification",
              "Audio Spectrum Analysis",

              /* ── Health / Hospital ── */
              "Patient Queue Systems",
              "Pharmacy Integration",
              "Dispensary Management",
              "Emergency Overrides",
              "Triage Classification",
              "Vitals Monitoring",
              "Lab Result Routing",
              "Radiology Workflows",
              "Billing And Claims",
              "Bed Management",
              "Referral Chains",
              "PIN-Gated Operator Stations",
              "WhatsApp Notifications",
              "Kiosk Deployment",

              /* ── Judiciary ── */
              "Court Scheduling",
              "Case Docket Management",
              "Evidence Exhibit Tracking",
              "Judicial Bench Allocation",
              "Verdict And Sentencing Logs",
              "Witness Management",
              "Bail And Bond Processing",
            ]}
          />
        </section>

        {/* ── STATS SECTION ────────────────────────────── */}
        <section style={{ padding: "var(--sp-3xl) var(--sp-xl)", maxWidth: "1000px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "var(--sp-2xl)",
            }}
          >
            <StatBlock value={3} suffix="" label="Subsidiaries" delay={0} />
            <StatBlock value={15} suffix="+" label="Workstations" delay={0.1} />
            <StatBlock value={7} suffix="" label="Court Zones" delay={0.2} />
            <StatBlock value={50} suffix="+" label="Operational Modules" delay={0.3} />
          </div>
        </section>

        {/* ── TECHNOLOGY SECTION ────────────────────────── */}
        <section
          id="technology"
          style={{
            padding: "var(--sp-4xl) var(--sp-xl)",
            maxWidth: "1000px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <Reveal>
            <span className="section-label" style={{ display: "block", marginBottom: "var(--sp-sm)" }}>
              The Engine
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                fontWeight: 400,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "var(--txD)",
                opacity: 0.6,
                display: "block",
                marginBottom: "var(--sp-lg)",
              }}
            >
              Technology That Protects
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-h1)",
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: "var(--sp-lg)",
              }}
            >
              Nexus-7{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, var(--copper-light), var(--indigo))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Proprietary Architecture
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-body)",
                lineHeight: 1.7,
                color: "var(--txM)",
                maxWidth: "640px",
                margin: "0 auto var(--sp-2xl)",
              }}
            >
              Every Dalxic subsidiary is powered by Nexus-7 — a unified intelligence
              engine built for institutional-grade operations. One architecture that adapts
              across healthcare management, media authenticity, and court case
              lifecycle integrity. No third-party dependencies. No compromises.
            </p>
          </Reveal>

          {/* Engine feature cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "var(--sp-lg)",
              textAlign: "left",
            }}
          >
            {[
              {
                label: "LiveQueue™",
                desc: "Real-time patient and staff flow across 15 integrated stations. From triage to discharge — every department connected, every handoff tracked, zero dropped patients.",
                icon: "01",
                color: "var(--copper)",
              },
              {
                label: "ChromaVeil™",
                desc: "Forensic-grade image authenticity detection. Multi-dimensional scoring across 8 vectors — pixel analysis, metadata forensics, GAN fingerprinting, compression artefacts.",
                icon: "02",
                color: "var(--indigo)",
              },
              {
                label: "NexusVerdict™",
                desc: "Verdict-to-enforcement in real time. Structured ruling, automated Court Enforcement Order dispatch, mandatory proof upload. Case sealed at database level — immutable.",
                icon: "03",
                color: "var(--danger)",
              },
            ].map((feat, i) => (
              <Reveal key={feat.label} delay={0.1 * i}>
                <div
                  className="glass glass-glow"
                  style={{ padding: "var(--sp-lg)", height: "100%" }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--fs-mono)",
                      fontWeight: 500,
                      color: feat.color,
                      display: "block",
                      marginBottom: "var(--sp-md)",
                    }}
                  >
                    {feat.icon}
                  </span>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--fs-h3)",
                      fontWeight: 700,
                      color: "var(--tx)",
                      marginBottom: "var(--sp-sm)",
                    }}
                  >
                    {feat.label}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-sm)",
                      lineHeight: 1.65,
                      color: "var(--txM)",
                    }}
                  >
                    {feat.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── VERTICALS SECTION ────────────────────────── */}
        <section
          id="solutions"
          style={{
            padding: "var(--sp-4xl) var(--sp-xl)",
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "var(--sp-2xl)", position: "relative" }}>
              {/* Center glow */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -45%)",
                  width: "320px",
                  height: "220px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(14,165,233,0.04) 40%, transparent 70%)",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
              <span className="section-label" style={{ display: "block", marginBottom: "var(--sp-md)", position: "relative", zIndex: 1 }}>
                Our Platforms
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.8rem, 5.5vw, 5.2rem)",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <span style={{ color: "var(--copper)" }}>Health-Care</span>{" "}
                <span style={{ color: "var(--indigo)" }}>Media</span>{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, var(--danger-light), var(--danger-mid), var(--danger-deep))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >Judiciary</span>
              </h2>
            </div>
          </Reveal>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "var(--sp-lg)",
            }}
          >
            <VerticalCard
              name="DalxicHealth"
              tagline="Worlds Best Hospital Management"
              description="End-to-end hospital operations — triage, consultation, pharmacy dispensing, laboratory routing, radiology workflows, emergency overrides, bed management, referral chains, and intelligent billing. 15+ integrated stations with real-time queue systems and PIN-gated operator access."
              accent="var(--copper)"
              accentGlow="rgba(184,115,51,0.2)"
              modules={["Triage", "Pharmacy", "Dispensary", "Emergency"]}
              status="Live"
              href={LINKS.health}
              delay={0.1}
            />
            <VerticalCard
              name="DalxicMedia"
              tagline="Forensic Media Intelligence"
              description="Detect deepfakes, synthetic media, and manipulated content with forensic precision. 7 detection modules powered by ChromaVeil, KineticScan, and SonicTrace analysis."
              accent="var(--indigo)"
              accentGlow="rgba(99,102,241,0.2)"
              modules={["ChromaVeil", "KineticScan", "SonicTrace", "NarrativeGuard"]}
              status="Live"
              href={LINKS.media}
              delay={0.2}
            />
            <VerticalCard
              name="DalxicJudiciary"
              tagline="Court Operations Intelligence"
              description="End-to-end court operations — case docket filing, judicial bench allocation, bail and bond processing, witness scheduling, evidence exhibit chains, verdict and sentencing logs, and sealed enforcement order dispatch. 7 court zones with immutable audit trails."
              accent="var(--danger-mid)"
              accentGlow="rgba(220,38,38,0.2)"
              modules={["Case Dockets", "Court Scheduling", "Bail Processing", "Verdict Logs"]}
              status="Live"
              href="#"
              delay={0.3}
            />
          </div>
        </section>

        {/* ── ABOUT / MISSION ──────────────────────────── */}
        <section
          id="about"
          style={{
            padding: "var(--sp-4xl) var(--sp-xl)",
            maxWidth: "800px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <Reveal>
            <span className="section-label" style={{ display: "block", marginBottom: "var(--sp-md)" }}>
              The Mission
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-h1)",
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: "var(--sp-lg)",
              }}
            >
              Built For{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, var(--copper-light), var(--copper))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Africa
              </span>
              . Scaled For The World.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-body)",
                lineHeight: 1.7,
                color: "var(--txM)",
                marginBottom: "var(--sp-2xl)",
              }}
            >
              Dalxic is a technology based company, creating infrastructure where it matters most.
              Our systems are designed for real-world conditions — unreliable networks,
              high-volume facilities, and environments where getting it wrong has
              consequences. Every line of code serves a purpose: protecting lives,
              projecting truth & enhancing justice.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div
              className="glass glass-glow"
              style={{
                padding: "var(--sp-xl) var(--sp-2xl)",
                display: "inline-block",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-accent)",
                  fontStyle: "italic",
                  fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
                  color: "var(--txM)",
                  lineHeight: 1.6,
                }}
              >
                &ldquo;Technology That Solves Problems And Brings Productivity&rdquo;
              </span>
            </div>
          </Reveal>
        </section>

        {/* ── FOOTER ───────────────────────────────────── */}
        <footer
          style={{
            padding: "var(--sp-2xl) var(--sp-xl)",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--sp-md)",
            }}
          >
            {/* Footer logo (shared master component) */}
            <DalxicLogo size="md" extraText="Technology That Protects" />

            <div style={{ display: "flex", gap: "var(--sp-xl)", marginTop: "var(--sp-sm)" }}>
              {[
                { label: "DalxicHealth", href: LINKS.health },
                { label: "DalxicMedia", href: LINKS.media },
                { label: "DalxicJudiciary", href: LINKS.judiciary },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-sm)",
                    color: "var(--txM)",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--tx)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--txM)")}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--txD)",
                marginTop: "var(--sp-lg)",
              }}
            >
              &copy; 2026 Dalxic. All Rights Reserved.
            </span>
          </div>
        </footer>
      </main>
    </>
  )
}
