"use client"
import { useState, useEffect, useRef, useCallback } from "react"

/* ═══════════════════════════════════════════════════════════════
   DALXIC OPERATIONS — Landing Page
   Emerald spectrum. Commerce + Institutions.
   ═══════════════════════════════════════════════════════════════ */

const EMERALD = "#10B981"
const EMERALD_L = "#34D399"
const EMERALD_GL = "#6EE7B7"
const TRADE_COL = "#F59E0B"
const INST_COL = "#0EA5E9"

const MAIN_URL   = process.env.NEXT_PUBLIC_MAIN_URL   || "https://dalxic.com"
const HEALTH_URL = process.env.NEXT_PUBLIC_HEALTH_URL  || "https://health.dalxic.com"
const MEDIA_URL  = process.env.NEXT_PUBLIC_MEDIA_URL   || "https://media.dalxic.com"

/* ── Scroll reveal ── */
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

function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} style={{
      ...style,
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : "translateY(32px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }}>
      {children}
    </div>
  )
}

/* ── Animated counter ── */
function Counter({ target, suffix = "", prefix = "", decimals = 0 }: { target: number; suffix?: string; prefix?: string; decimals?: number }) {
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

/* ── Ticker ── */
function Ticker({ text }: { text: string }) {
  const content = Array(4).fill(text).join("   \u00b7   ")
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-block", animation: "marqueeScroll 45s linear infinite", fontSize: 11, color: "#3A6B5A" }}>{content}</span>
    </div>
  )
}

/* ── Particles (emerald-tinted) ── */
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let W = canvas.width = window.innerWidth, H = canvas.height = Math.min(window.innerHeight, 900)
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = Math.min(window.innerHeight, 900) }
    window.addEventListener("resize", resize)
    const colors = [[16, 185, 129], [52, 211, 153], [110, 231, 183], [6, 182, 212]]
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 1.5 + 0.5, opacity: Math.random() * 0.4 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)]
    }))
    let raf: number
    function draw() {
      ctx!.clearRect(0, 0, W, H)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.opacity})`; ctx!.fill()
      })
      for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y, d = Math.sqrt(dx * dx + dy * dy)
        if (d < 120) { ctx!.beginPath(); ctx!.strokeStyle = `rgba(16,185,129,${0.12 * (1 - d / 120)})`; ctx!.lineWidth = 0.5; ctx!.moveTo(particles[i].x, particles[i].y); ctx!.lineTo(particles[j].x, particles[j].y); ctx!.stroke() }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.6 }} />
}

/* ── Nav ── */
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", h)
    return () => window.removeEventListener("scroll", h)
  }, [])
  const HEALTH_COL = "#D97706"
  const links: { label: string; href: string; external?: boolean; color?: string }[] = [
    { label: "Health", href: "/health", color: HEALTH_COL },
    { label: "Trade", href: "#trade", color: TRADE_COL },
    { label: "Institute", href: "#institute", color: INST_COL },
    { label: "Features", href: "#features" },
    { label: "Media", href: MEDIA_URL, external: true },
  ]
  return (
    <>
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <span style={{ fontWeight: 300, fontSize: 14, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans','Space Grotesk',sans-serif" }}>Dalxic</span>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans','Space Grotesk',sans-serif", background: `linear-gradient(135deg, ${EMERALD}, ${EMERALD_GL})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Operations</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="hidden-mobile">
          {links.map(l => {
            const base = l.color ?? "#6B9B8A"
            return (
              <a key={l.label} href={l.href} target={l.external ? "_blank" : undefined} rel={l.external ? "noopener noreferrer" : undefined}
                style={{ fontSize: 13, color: base, textDecoration: "none", fontWeight: l.color ? 600 : 500, transition: "color 0.2s", fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#ECF5F0")}
                onMouseLeave={e => (e.currentTarget.style.color = base)}>
                {l.label}
              </a>
            )
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="hidden-mobile">
          <button onClick={() => window.location.href = "/auth"}
            style={{ padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "transparent", border: `1px solid ${EMERALD}30`, color: EMERALD_L, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = EMERALD; e.currentTarget.style.background = `${EMERALD}10` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${EMERALD}30`; e.currentTarget.style.background = "transparent" }}>
            Sign In
          </button>
          <button onClick={() => window.location.href = "/register"}
            style={{ padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: `linear-gradient(135deg, ${EMERALD}, #059669)`, border: "none", color: "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: `0 4px 20px ${EMERALD}30` }}>
            Get Started
          </button>
        </div>
        <button onClick={() => setMenuOpen(o => !o)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 5, padding: 6 }}
          className="show-mobile" aria-label="Menu">
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              width: 22, height: 2, background: "#ECF5F0", display: "block", transition: "all 0.3s ease",
              transform: menuOpen ? (i === 0 ? "rotate(45deg) translate(5px,5px)" : i === 2 ? "rotate(-45deg) translate(5px,-5px)" : "scaleX(0)") : "none",
              opacity: menuOpen && i === 1 ? 0 : 1
            }} />
          ))}
        </button>
      </nav>
      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(4,10,15,0.97)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, animation: "fadeIn 0.3s ease" }}>
          {links.map(l => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
              style={{ fontSize: 28, fontWeight: 700, color: "#ECF5F0", textDecoration: "none", letterSpacing: -1 }}>{l.label}</a>
          ))}
        </div>
      )}
      <style>{`
        @media (max-width: 900px) { .hidden-mobile { display: none !important; } }
        @media (min-width: 901px) { .show-mobile { display: none !important; } }
      `}</style>
    </>
  )
}

/* ── Splash Screen ── */
function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState("hold")
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("shrink"), 3500)
    const t2 = setTimeout(() => setPhase("done"), 4500)
    const t3 = setTimeout(onDone, 5000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])
  const isExit = phase === "shrink" || phase === "done"
  const isDone = phase === "done"
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      pointerEvents: isExit ? "none" : "auto", background: "#020806",
      opacity: isDone ? 0 : 1, transition: isDone ? "opacity 0.6s ease" : "none",
    }}>
      <div style={{
        position: "absolute", width: 480, height: 480, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(52,211,153,0.06) 40%, transparent 70%)`,
        opacity: isExit ? 0 : 1, transform: isExit ? "scale(1.8)" : "scale(1)",
        transition: isExit ? "opacity 0.8s ease, transform 1.2s cubic-bezier(0.76, 0, 0.24, 1)" : "none",
      }} />
      <div style={{
        position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center",
        transform: isExit ? "scale(0.85)" : "scale(1)",
        opacity: isExit ? 0 : 1,
        transition: isExit ? "transform 1s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.8s ease" : "none",
      }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontWeight: 300, fontSize: "min(10vw, 56px)", color: "#94A3B8", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans','Space Grotesk',sans-serif" }}>Dalxic</span>
          <span style={{ fontWeight: 800, fontSize: "min(10vw, 56px)", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans','Space Grotesk',sans-serif", background: `linear-gradient(135deg, ${EMERALD}, ${EMERALD_GL})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Operations</span>
        </div>
        <div style={{ fontWeight: 400, fontSize: "min(2.5vw, 13px)", color: "rgba(236,245,240,0.4)", letterSpacing: 3, textTransform: "uppercase", marginTop: 16 }}>Business Intelligence</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */

const TRADE_FEATURES = [
  { icon: "\uD83D\uDCE6", title: "Smart Inventory", desc: "Flexible stock management with optional expiry tracking, batch numbers, and storage conditions. Every item can have a photo — snap from camera and attach instantly." },
  { icon: "\uD83D\uDCB3", title: "Point Of Sale", desc: "Fast, intuitive checkout. Scan items, apply discounts, split payments, and print receipts. Works on any screen from phone to desktop." },
  { icon: "\uD83C\uDFEA", title: "Multi-Branch", desc: "One dashboard for all your locations. Track stock, sales, and staff across branches. Transfer inventory between stores with one tap." },
  { icon: "\uD83D\uDCF7", title: "Visual Catalogue", desc: "Every product gets a photo. Tap to open camera, snap, done. Staff identify items by picture — no reading required. Perfect for any market." },
  { icon: "\uD83D\uDCC8", title: "Sales Analytics", desc: "Real-time dashboards showing top sellers, daily revenue, profit margins, and trends. Know whats moving and whats sitting on shelves." },
  { icon: "\uD83D\uDE9A", title: "Supplier Management", desc: "Track suppliers, automate reorder points, manage purchase orders. Never run out of your best-selling items." },
]

const INSTITUTE_FEATURES = [
  { icon: "\uD83C\uDF93", title: "Enrollment Engine", desc: "Student and member registration with custom fields, document uploads, and approval workflows. From nursery schools to universities." },
  { icon: "\uD83D\uDCB0", title: "Fee Management", desc: "Flexible billing — term fees, monthly dues, one-time charges. Payment tracking, reminders, and receipt generation." },
  { icon: "\uD83D\uDCC5", title: "Scheduling", desc: "Timetables, event calendars, room bookings, and resource allocation. Keep operations running on time." },
  { icon: "\uD83D\uDC65", title: "Staff Portal", desc: "Employee management, attendance tracking, role-based access. From teachers to admin to security." },
  { icon: "\uD83D\uDCE2", title: "Announcements", desc: "Push communications to parents, students, or members. SMS, WhatsApp, and in-app notifications." },
  { icon: "\uD83D\uDCCA", title: "Performance Reports", desc: "Academic results, financial summaries, attendance reports. Export to PDF or view on any screen." },
]

const CORE_FEATURES = [
  { title: "PIN-Gated Access", desc: "Every operator logs in with a 4-digit PIN. Role-based permissions control who sees what. Full audit trail.", color: EMERALD },
  { title: "Works On Any Device", desc: "Phone, tablet, laptop, desktop. Responsive design adapts to any screen. No app download required.", color: EMERALD_L },
  { title: "Add-On Modules", desc: "Start with what you need. Add WhatsApp notifications, advanced reports, or custom integrations as you grow.", color: "#06B6D4" },
  { title: "Offline Resilient", desc: "Core operations continue working with limited connectivity. Data syncs automatically when connection returns.", color: "#8B5CF6" },
]

const STATS = [
  { display: "4", label: "Business Verticals" },
  { value: 15, suffix: "+", decimals: 0, label: "Core Modules" },
  { display: "24/7", label: "System Uptime" },
  { value: 100, suffix: "%", decimals: 0, label: "Cloud Native" },
]

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */

const INTRO_KEY = "dalxic_ops_intro"
const COOLDOWN = 15 * 60 * 1000

export default function Home() {
  const [introState, setIntroState] = useState("checking")
  const [siteVisible, setSiteVisible] = useState(false)

  useEffect(() => {
    try {
      const last = localStorage.getItem(INTRO_KEY)
      if (!last || Date.now() - parseInt(last) > COOLDOWN) {
        localStorage.setItem(INTRO_KEY, Date.now().toString())
        setIntroState("splash")
      } else {
        setIntroState("done")
        setSiteVisible(true)
      }
    } catch { setIntroState("splash") }
  }, [])

  const onSplashDone = useCallback(() => { setIntroState("done"); setSiteVisible(true) }, [])

  if (introState === "checking") return null

  return (
    <>
      {introState === "splash" && <SplashScreen onDone={onSplashDone} />}

      <div style={{ opacity: siteVisible ? 1 : 0, transition: "opacity 0.6s ease 0.2s" }}>
        <Nav />

        {/* ── HERO ── */}
        <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "120px 40px 80px" }}>
          <Particles />
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(16,185,129,0.06) 0%, transparent 60%)`, pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 900 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 4, textTransform: "uppercase", color: EMERALD, fontFamily: "'DM Sans', sans-serif", marginBottom: 20, animation: "fadeUp 0.6s ease 0.1s both" }}>
              DalxicOperations
            </div>
            <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 4.2rem)", fontWeight: 800, letterSpacing: -2, lineHeight: 1.08, marginBottom: 20, fontFamily: "'Space Grotesk', sans-serif", animation: "fadeUp 0.7s ease 0.2s both" }}>
              Run Your Business{" "}
              <span style={{ background: `linear-gradient(135deg, ${EMERALD}, ${EMERALD_L}, ${EMERALD_GL})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                With Precision
              </span>
            </h1>
            <p style={{ fontSize: 17, color: "#6B9B8A", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 36px", fontFamily: "'DM Sans', sans-serif", animation: "fadeUp 0.7s ease 0.3s both" }}>
              From retail shops to schools, NGOs to service organisations. One platform that adapts to any business — inventory, POS, enrollment, staff management, and multi-branch operations.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", animation: "fadeUp 0.7s ease 0.4s both" }}>
              <button onClick={() => window.location.href = "/trade"}
                style={{ padding: "14px 32px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: `linear-gradient(135deg, ${EMERALD}, #059669)`, border: "none", color: "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: `0 4px 24px ${EMERALD}30`, transition: "all 0.2s", letterSpacing: 0.3 }}>
                Launch Trade
              </button>
              <button onClick={() => window.location.href = "/institute"}
                style={{ padding: "14px 32px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "transparent", border: `1px solid ${EMERALD}40`, color: EMERALD_L, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", letterSpacing: 0.3 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = EMERALD; e.currentTarget.style.background = `${EMERALD}10` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${EMERALD}40`; e.currentTarget.style.background = "transparent" }}>
                Launch Institute
              </button>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <Reveal>
          <div style={{ display: "flex", justifyContent: "center", gap: 48, padding: "48px 40px", borderTop: `1px solid ${EMERALD}10`, borderBottom: `1px solid ${EMERALD}10`, flexWrap: "wrap" }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: "center", minWidth: 120 }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: EMERALD_L, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1, lineHeight: 1 }}>
                  {s.display || <Counter target={s.value!} suffix={s.suffix} decimals={s.decimals} />}
                </div>
                <div style={{ fontSize: 12, color: "#6B9B8A", marginTop: 6, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ── TWO VERTICALS SHOWCASE ── */}
        <section style={{ padding: "100px 40px 60px", maxWidth: 1100, margin: "0 auto" }}>
          {/* TRADE */}
          <div id="trade">
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: 56 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: TRADE_COL, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>DalxicTrade</div>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 12 }}>
                  Retail{" "}
                  <span style={{ background: `linear-gradient(135deg, ${TRADE_COL}, #FBBF24)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Reimagined</span>
                </h2>
                <p style={{ fontSize: 15, color: "#6B9B8A", maxWidth: 550, margin: "0 auto", lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
                  Whether you sell clothes, electronics, groceries, or crafts — DalxicTrade adapts to your shop. Photo-based inventory so every item is instantly recognisable.
                </p>
              </div>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              {TRADE_FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 0.08}>
                  <div className="glass" style={{ padding: "28px 24px", minHeight: 180, position: "relative", overflow: "hidden" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${TRADE_COL}30` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = `rgba(16,185,129,0.08)` }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${TRADE_COL}60, transparent)` }} />
                    <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "#ECF5F0", fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: "#6B9B8A", lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{f.desc}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* INSTITUTE */}
          <div id="institute" style={{ marginTop: 100 }}>
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: 56 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: INST_COL, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>DalxicInstitute</div>
                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 12 }}>
                  Institutions{" "}
                  <span style={{ background: `linear-gradient(135deg, ${INST_COL}, #38BDF8)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Elevated</span>
                </h2>
                <p style={{ fontSize: 15, color: "#6B9B8A", maxWidth: 550, margin: "0 auto", lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
                  Schools, NGOs, training centres, religious organisations — any institution that serves people. Enrollment, fees, scheduling, and communication in one system.
                </p>
              </div>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              {INSTITUTE_FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 0.08}>
                  <div className="glass" style={{ padding: "28px 24px", minHeight: 180, position: "relative", overflow: "hidden" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${INST_COL}30` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = `rgba(16,185,129,0.08)` }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${INST_COL}60, transparent)` }} />
                    <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "#ECF5F0", fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: "#6B9B8A", lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{f.desc}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CORE PLATFORM FEATURES ── */}
        <section id="features" style={{ padding: "100px 40px", maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: EMERALD, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>Core Platform</div>
              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, fontFamily: "'Space Grotesk', sans-serif" }}>
                Built For{" "}
                <span style={{ background: `linear-gradient(135deg, ${EMERALD}, ${EMERALD_GL})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Every Business</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {CORE_FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.1}>
                <div className="glass" style={{ padding: "32px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${f.color}12`, border: `1px solid ${f.color}25`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: f.color, boxShadow: `0 0 16px ${f.color}50` }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: "#ECF5F0", fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: "#6B9B8A", lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{f.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ padding: "80px 40px", maxWidth: 900, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 800, letterSpacing: -1, fontFamily: "'Space Grotesk', sans-serif" }}>
                Get Running In{" "}
                <span style={{ background: `linear-gradient(135deg, ${EMERALD}, ${EMERALD_GL})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>3 Steps</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { num: "01", title: "Register", desc: "Create your business. Choose Trade or Institute. Name your first branch." },
              { num: "02", title: "Customise", desc: "Enable the modules you need. Add staff, set PINs, configure your catalogue." },
              { num: "03", title: "Operate", desc: "Start selling, enrolling, managing. Everything syncs across all your devices." },
            ].map((s, i) => (
              <Reveal key={s.num} delay={i * 0.12}>
                <div style={{ textAlign: "center", padding: "32px 20px" }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: `${EMERALD}20`, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1, marginBottom: 16 }}>{s.num}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: "#ECF5F0", fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: "#6B9B8A", lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{s.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ padding: "100px 40px", textAlign: "center" }}>
          <Reveal>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 16 }}>
                Ready To{" "}
                <span style={{ background: `linear-gradient(135deg, ${EMERALD}, ${EMERALD_GL})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Transform</span> Your Business?
              </h2>
              <p style={{ fontSize: 15, color: "#6B9B8A", lineHeight: 1.7, marginBottom: 32, fontFamily: "'DM Sans', sans-serif" }}>
                Join businesses across Africa and beyond who run on Dalxic. Start free, scale when ready.
              </p>
              <button onClick={() => window.location.href = "/register"}
                style={{ padding: "16px 48px", borderRadius: 14, fontSize: 15, fontWeight: 700, background: `linear-gradient(135deg, ${EMERALD}, #059669)`, border: "none", color: "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: `0 6px 32px ${EMERALD}30`, transition: "all 0.2s", letterSpacing: 0.3 }}>
                Get Started Free
              </button>
            </div>
          </Reveal>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: `1px solid ${EMERALD}10`, padding: "60px 40px 20px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 40, marginBottom: 40 }}>
              {[
                { title: "Platform", links: [["Trade", "/trade"], ["Institute", "/institute"], ["Pricing", "/pricing"]] },
                { title: "Company", links: [["About", "/about"], ["Team", "/team"], ["Contact", "#contact"]] },
                { title: "Subsidiaries", links: [["Dalxic Main", MAIN_URL], ["DalxicHealth", "/health"], ["DalxicMedia", MEDIA_URL]] },
                { title: "Legal", links: [["Privacy Policy", "/privacy"], ["Terms Of Service", "/terms"]] },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16, color: "#6B9B8A" }}>{col.title}</div>
                  {col.links.map(([label, href]) => {
                    const isInternal = ["/health", "/trade", "/institute", "/auth", "/register", "/pricing"].includes(href)
                    return (
                      <div key={label} style={{ marginBottom: 10 }}>
                        {isInternal ? (
                          <span onClick={() => window.location.href = href} style={{ fontSize: 13.5, color: "#3A6B5A", cursor: "pointer", transition: "color 0.2s" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#ECF5F0")} onMouseLeave={e => (e.currentTarget.style.color = "#3A6B5A")}>
                            {label}
                          </span>
                        ) : (
                          <a href={href} style={{ fontSize: 13.5, color: "#3A6B5A", textDecoration: "none", transition: "color 0.2s" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#ECF5F0")} onMouseLeave={e => (e.currentTarget.style.color = "#3A6B5A")}>
                            {label}
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: `${EMERALD}10`, marginBottom: 16 }} />
            <Ticker text="\u00a9 2026 Dalxic. All rights reserved. DalxicOperations\u2122 \u00b7 DalxicTrade\u2122 \u00b7 DalxicInstitute\u2122 \u00b7 DalxicHealth\u2122 \u00b7 DalxicMedia\u2122 \u2014 Proprietary trademarks of Dalxic. operations.dalxic.com" />
          </div>
        </footer>
      </div>
    </>
  )
}
