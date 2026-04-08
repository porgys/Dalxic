"use client"
import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

/* ─── Scroll-triggered fade-in hook ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function Reveal({ children, delay = 0, style = {}, className = "" }) {
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
function Counter({ target, suffix = "", prefix = "", decimals = 0 }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
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
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target, decimals])
  return <span ref={ref}>{prefix}{decimals > 0 ? val.toFixed(decimals) : val.toLocaleString()}{suffix}</span>
}

/* ─── Nav ─── */
function Nav({ onContact }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", h)
    return () => window.removeEventListener("scroll", h)
  }, [])
  const links = [
    { label: "Solutions", href: "#solutions" },
    { label: "Technology", href: "#technology" },
    { label: "Who We Serve", href: "#clients" },
    { label: "Team", href: "/team" },
    { label: "Pricing", href: "/pricing" },
  ]
  return (
    <>
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <Link href="/?from=nav" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ display: "inline-flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: "var(--tx)", lineHeight: 1, display: "flex", gap: 1, fontFamily: "'Plus Jakarta Sans','Space Grotesk',sans-serif" }}>{"Dalxıc".split("").map((c, i) => i === 4 ? <span key={i} style={{ display: "inline-block", position: "relative" }}>{"ı"}<span style={{ position: "absolute", top: -5, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: "#818CF8", boxShadow: "0 0 8px #6366F1" }} /></span> : <span key={i} style={{ display: "inline-block" }}>{c === " " ? "\u00A0" : c}</span>)}</span>
            <span style={{ fontWeight: 600, fontSize: 11, color: "#A78BFA", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 3, fontFamily: "'Space Grotesk',sans-serif" }}>Powered by Nexus-7</span>
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="hidden-mobile">
          {links.map(l => <a key={l.label} href={l.href} className="nav-link">{l.label}</a>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="hidden-mobile">
          <Link href="/auth" className="btn btn-ghost btn-sm">Sign In</Link>
          <button onClick={onContact} className="btn btn-primary btn-sm">Request Access</button>
        </div>
        <button onClick={() => setMenuOpen(o => !o)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 5, padding: 6 }}
          className="show-mobile" aria-label="Menu">
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              width: 22, height: 2, background: "var(--tx)", display: "block", transition: "all 0.3s ease",
              transform: menuOpen ? (i === 0 ? "rotate(45deg) translate(5px,5px)" : i === 2 ? "rotate(-45deg) translate(5px,-5px)" : "scaleX(0)") : "none",
              opacity: menuOpen && i === 1 ? 0 : 1
            }} />
          ))}
        </button>
      </nav>
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {links.map(l => (
          <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
            style={{ fontSize: 28, fontWeight: 700, color: "var(--tx)", textDecoration: "none", letterSpacing: -1 }}>{l.label}</a>
        ))}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "80%" }}>
          <Link href="/auth" className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }}>Sign In</Link>
          <button onClick={() => { setMenuOpen(false); onContact() }} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Request Access</button>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) { .hidden-mobile { display: none !important; } }
        @media (min-width: 901px) { .show-mobile   { display: none !important; } }
      `}</style>
    </>
  )
}

/* ─── Contact Modal ─── */
function ContactModal({ open, onClose }) {
  const [form, setForm] = useState({ name: "", org: "", email: "", message: "" })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState("")
  if (!open) return null

  async function submit(e) {
    e.preventDefault(); setSending(true); setErr("")
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (r.ok) setSent(true)
      else setErr("Failed to send. Please try again.")
    } catch { setErr("Network error. Please try again.") }
    setSending(false)
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(3,5,15,0.85)", backdropFilter: "blur(12px)", transform: "translateZ(0)", willChange: "transform", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass" style={{ width: "100%", maxWidth: 560, padding: "40px 44px", border: "1px solid rgba(99,102,241,0.25)", boxShadow: "0 0 80px rgba(99,102,241,0.15)", animation: "fadeUp 0.3s ease" }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16, color: "var(--glow)" }}>&#10022;</div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "var(--glow)" }}>Message Received</h3>
            <p style={{ color: "var(--txM)", lineHeight: 1.6 }}>Our enterprise team will respond within 24 hours.</p>
            <button onClick={onClose} className="btn btn-primary" style={{ marginTop: 24 }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
              <div>
                <div className="section-label" style={{ marginBottom: 6 }}>Contact Dalxic</div>
                <h3 style={{ fontSize: 22, fontWeight: 700 }}>Request Enterprise Access</h3>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--txM)", fontSize: 22, padding: 4 }}>&#10005;</button>
            </div>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <input className="input" placeholder="Your name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <input className="input" placeholder="Organisation" required value={form.org} onChange={e => setForm(f => ({ ...f, org: e.target.value }))} />
              </div>
              <input className="input" type="email" placeholder="Your email address" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <textarea className="input" placeholder="Tell us about your requirements..." rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} style={{ resize: "none" }} />
              {err && <p style={{ color: "var(--re)", fontSize: 13 }}>{err}</p>}
              <button type="submit" disabled={sending} className="btn btn-primary" style={{ width: "100%", marginTop: 6, padding: "14px 0" }}>
                {sending ? "Sending\u2026" : "Send Message"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Splash Screen ─── */
const INTRO_KEY = "dalxic_last_intro"
const COOLDOWN = 15 * 60 * 1000

function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("hold")
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("shrink"), 4000)
    const t2 = setTimeout(() => setPhase("done"), 5200)
    const t3 = setTimeout(onDone, 5800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])
  const isExit = phase === "shrink" || phase === "done"
  const isDone = phase === "done"
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      pointerEvents: isExit ? "none" : "auto", background: "#020408",
      opacity: isDone ? 0 : 1, transition: isDone ? "opacity 0.6s ease" : "none",
    }}>
      <div style={{
        position: "absolute", width: 480, height: 480, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(167,139,250,0.06) 40%, transparent 70%)",
        opacity: isExit ? 0 : 1, transform: isExit ? "scale(1.8)" : "scale(1)",
        transition: isExit ? "opacity 0.8s ease, transform 1.2s cubic-bezier(0.76, 0, 0.24, 1)" : "none",
      }} />
      <div style={{
        position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center",
        transform: isExit ? "scale(0.85)" : "scale(1)",
        transformOrigin: "center center", opacity: isExit ? 0 : 1,
        transition: isExit ? "transform 1s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.8s ease" : "none",
      }}>
        <div style={{ fontWeight: 800, fontSize: "min(12vw, 64px)", color: "#F0F4FF", letterSpacing: -2, lineHeight: 1, fontFamily: "'Plus Jakarta Sans','Space Grotesk',sans-serif" }}>Dalx<span style={{ position: "relative", display: "inline-block" }}>ı<span style={{ position: "absolute", top: "-0.35em", left: "50%", transform: "translateX(-50%)", width: "0.12em", height: "0.12em", borderRadius: "50%", background: "#818CF8", boxShadow: "0 0 8px #6366F1" }} /></span>c</div>
        <div style={{ fontWeight: 600, fontSize: "min(3.5vw, 18px)", color: "#A78BFA", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 6, fontFamily: "'Space Grotesk',sans-serif" }}>Powered by Nexus-7</div>
        <div style={{ fontWeight: 400, fontSize: "min(2.5vw, 13px)", color: "rgba(240,244,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginTop: 16 }}>Forensic Intelligence</div>
      </div>
    </div>
  )
}

/* ─── Short Video Intro (nav logo click) ─── */
function VideoIntro({ videoSrc, onDone }) {
  const vidRef = useRef(null)
  const [fading, setFading] = useState(false)
  useEffect(() => {
    const v = vidRef.current
    if (!v) return
    v.muted = true
    const end = () => { setFading(true); setTimeout(onDone, 600) }
    const err = () => { onDone() }
    v.addEventListener("ended", end)
    v.addEventListener("error", err)
    v.play().catch(() => onDone())
    return () => { v.removeEventListener("ended", end); v.removeEventListener("error", err) }
  }, [onDone])
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#020408", opacity: fading ? 0 : 1, transition: "opacity 0.6s ease", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <video ref={vidRef} playsInline muted preload="auto" poster="/open-logo.png" style={{ width: "100%", height: "100%", objectFit: "contain" }}>
        <source src={videoSrc} type="video/mp4" />
      </video>
    </div>
  )
}

/* ─── Nebula Background ─── */
function Nebula() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    let W, H
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; draw() }
    resize()
    window.addEventListener("resize", resize)
    function noise2D(x, y, seed) { const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453; return n - Math.floor(n) }
    function smoothNoise(x, y, scale, seed) {
      const sx = x / scale, sy = y / scale, ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy
      const a = noise2D(ix, iy, seed), b = noise2D(ix + 1, iy, seed), c = noise2D(ix, iy + 1, seed), d = noise2D(ix + 1, iy + 1, seed)
      const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy)
      return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
    }
    function fbm(x, y, seed) { return smoothNoise(x, y, 180, seed) * 0.5 + smoothNoise(x, y, 90, seed + 10) * 0.3 + smoothNoise(x, y, 40, seed + 20) * 0.2 }
    function draw() {
      const img = ctx.createImageData(W, H), cx = W / 2, cy = H / 2
      for (let py = 0; py < H; py += 2) {
        for (let px = 0; px < W; px += 2) {
          const n = fbm(px, py, 42), dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2), maxD = Math.sqrt(cx * cx + cy * cy), core = Math.exp(-dist * dist / ((maxD * 0.35) ** 2))
          let r = n * 0.45 + core * 0.12, g = n * 0.2 + core * 0.4, b = n * 0.5 + core * 0.65
          r += (1 - core) * n * 0.25; b += (1 - core) * n * 0.15
          r = Math.min(r, 1) * 255; g = Math.min(g, 1) * 255; b = Math.min(b, 1) * 255
          for (let dy = 0; dy < 2 && py + dy < H; dy++) for (let dx = 0; dx < 2 && px + dx < W; dx++) {
            const i = ((py + dy) * W + (px + dx)) * 4
            img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255
          }
        }
      }
      ctx.putImageData(img, 0, 0)
      for (let s = 0; s < 600; s++) { const sx = Math.random() * W, sy = Math.random() * H; ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.6 + 0.2})`; ctx.fillRect(sx, sy, 1, 1) }
      for (let s = 0; s < 40; s++) { const sx = Math.random() * W, sy = Math.random() * H; ctx.beginPath(); ctx.arc(sx, sy, Math.random() + 0.5, 0, Math.PI * 2); ctx.fillStyle = `rgba(200,210,255,${Math.random() * 0.5 + 0.5})`; ctx.fill() }
    }
    return () => window.removeEventListener("resize", resize)
  }, [])
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.18 }} />
}

/* ─── Particles ─── */
function Particles() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    let W = canvas.width = window.innerWidth, H = canvas.height = Math.min(window.innerHeight, 900)
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = Math.min(window.innerHeight, 900) }
    window.addEventListener("resize", resize)
    const colors = [[167, 139, 250], [99, 102, 241], [34, 211, 238], [129, 140, 248]]
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8,
      r: Math.random() * 1.5 + 0.5, opacity: Math.random() * 0.5 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)]
    }))
    let raf
    function draw() {
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.opacity})`; ctx.fill()
      })
      for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y, d = Math.sqrt(dx * dx + dy * dy)
        if (d < 120) { ctx.beginPath(); ctx.strokeStyle = `rgba(99,102,241,${0.15 * (1 - d / 120)})`; ctx.lineWidth = 0.5; ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke() }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.7 }} />
}

/* ─── Scrolling ticker ─── */
function Ticker({ text }) {
  const content = Array(4).fill(text).join("   ·   ")
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-block", animation: "marqueeScroll 40s linear infinite", fontSize: 11, color: "var(--txD)" }}>{content}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════════ */

const SOLUTIONS = [
  { icon: "🖼", title: "Image Intelligence", engine: "ChromaVeil™", desc: "Detects GAN artifacts, pixel coherence anomalies, neural compression signatures and metadata forgery across 47 forensic dimensions.", color: "#818CF8" },
  { icon: "🎬", title: "Video Forensics", engine: "KineticScan™", desc: "Frame-by-frame temporal analysis. Identifies deepfake face-swaps, synthetic actors, inter-frame inconsistencies and neural rendering artifacts.", color: "#6366F1" },
  { icon: "🎙", title: "Audio Authentication", engine: "SonicTrace™", desc: "Voice cloning detection, synthetic speech analysis, spectral anomaly mapping and acoustic environment verification.", color: "#10B981" },
  { icon: "📡", title: "Fusion Analysis", engine: "FusionProbe™", desc: "Combined audio-visual synchronisation forensics. Detects mismatches between synthesised voice and video that fool human observers.", color: "#F59E0B" },
  { icon: "📰", title: "Misinformation Guard", engine: "NarrativeGuard™", desc: "AI-generated news detection, narrative manipulation scoring, semantic inconsistency analysis and source credibility mapping.", color: "#EF4444" },
  { icon: "⚡", title: "Real-Time Threat", engine: "SentinelCore™", desc: "Live stream monitoring with millisecond-level flagging. Continuous threat classification across broadcast pipelines.", color: "#22D3EE" },
]

const CLIENTS = [
  { icon: "🏛", label: "Government Agencies", desc: "Tax regulatory authorities, ministries and national security bodies trust Nexus-7 to verify evidence and secure digital infrastructure." },
  { icon: "\u2696", label: "Judiciary & Courts", desc: "Courts of law use Dalxic forensic reports as certified evidence to authenticate or invalidate digital submissions." },
  { icon: "📺", label: "Broadcast & News", desc: "Television networks, radio stations and digital news organisations verify content before it reaches millions of viewers." },
  { icon: "📷", label: "Investigative Journalism", desc: "Award-winning journalists use Dalxic to expose fabricated media, disinformation campaigns and political manipulation." },
  { icon: "🏢", label: "Enterprise & Retail", desc: "Shopping centres, banks and enterprises protect themselves from synthetic identity fraud and AI-manipulated documentation." },
  { icon: "🔗", label: "API Integrations", desc: "Technology companies embed NexusLink™ directly into their workflows for real-time AI detection at scale." },
]

const STATS = [
  { display: "2.4B+", label: "Training Samples" },
  { value: 98.9, suffix: "%", decimals: 1, label: "Detection Accuracy" },
  { value: 73, suffix: "+", decimals: 0, label: "Forensic Dimensions" },
  { prefix: "<", value: 3, suffix: "s", decimals: 0, label: "Analysis Time" },
]

const TECH = [
  { title: "Nexus-7 Engine", desc: "Our proprietary neural architecture trained on a continuously expanding dataset of 2.4 billion labelled samples — the largest forensic training corpus in existence.", color: "#A78BFA" },
  { title: "ChromaVeil™ Imaging", desc: "73-dimension pixel-level analysis that detects the invisible signatures left by every AI image generator, from commercial tools to bespoke state-level models.", color: "#6366F1" },
  { title: "SonicTrace™ Audio", desc: "Spectral decomposition and voice-print verification that identifies cloned voices with sub-second precision, even through telephony compression.", color: "#22D3EE" },
  { title: "ForensIQ™ Reporting", desc: "Each scan generates a cryptographically signed forensic report with full chain-of-custody metadata, court-admissible formatting and executive visualisations.", color: "#10B981" },
]

const TESTIMONIALS = [
  { quote: "Dalxic caught a deepfake broadcast that would have aired live to several viewers. The forensic report was ready in under 8 seconds.", name: "Chief Content Officer", org: "Zillap Online" },
  { quote: "I use Dalxic Forensic Certification for winning cases in court.", name: "Attorney", org: "Bax Brothers @ Law" },
  { quote: "NexusLink™ integrated seamlessly with my workflow. I haven’t presented or published a single piece of synthetic content since.", name: "Susan Jaques", org: "Influencer" },
]

const STEPS = [
  { num: "01", title: "Upload", desc: "Drop any image, video, audio or document. Dalxic accepts all major formats with instant preprocessing.", icon: "\u2B06" },
  { num: "02", title: "Analyse", desc: "Nexus-7 runs 73+ forensic dimensions simultaneously — GAN fingerprints, spectral analysis, metadata forensics and more.", icon: "⚙" },
  { num: "03", title: "Report", desc: "Receive a court-admissible ForensIQ™ report with confidence scores, visual breakdowns and chain-of-custody certification.", icon: "📄" },
]

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */

function HomeInner() {
  const searchParams = useSearchParams()
  const fromNav = searchParams.get("from") === "nav"
  const [introState, setIntroState] = useState("checking")
  const [siteVisible, setSiteVisible] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  useEffect(() => {
    if (fromNav) { setIntroState("short"); return }
    try {
      const last = localStorage.getItem(INTRO_KEY)
      if (!last || Date.now() - parseInt(last) > COOLDOWN) { localStorage.setItem(INTRO_KEY, Date.now().toString()); setIntroState("splash") }
      else { setIntroState("done"); setSiteVisible(true) }
    } catch { setIntroState("splash") }
  }, [fromNav])

  function handleIntroDone() { setIntroState("done"); setSiteVisible(true) }

  useEffect(() => {
    if (!siteVisible) return
    const cursor = document.getElementById("dal-cursor"), ring = document.getElementById("dal-ring")
    if (!cursor || !ring) return
    const move = e => { cursor.style.left = e.clientX + "px"; cursor.style.top = e.clientY + "px"; ring.style.left = e.clientX + "px"; ring.style.top = e.clientY + "px" }
    const over = () => document.body.classList.add("cursor-hover")
    const out = () => document.body.classList.remove("cursor-hover")
    window.addEventListener("mousemove", move)
    document.querySelectorAll("a,button").forEach(el => { el.addEventListener("mouseenter", over); el.addEventListener("mouseleave", out) })
    return () => window.removeEventListener("mousemove", move)
  }, [siteVisible])

  return (
    <>
      <div id="dal-cursor" className="cursor" />
      <div id="dal-ring" className="cursor-ring" />
      {introState === "splash" && <SplashScreen onDone={handleIntroDone} />}
      {introState === "short" && <VideoIntro videoSrc="/logo-intro-short.mp4" onDone={handleIntroDone} />}
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

      <div style={{ opacity: siteVisible ? 1 : 0, transition: "opacity 0.8s ease" }}>
        <Nav onContact={() => setContactOpen(true)} />

        {/* ═══════════════════ HERO ═══════════════════ */}
        <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
          <Nebula />
          <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
          <Particles />
          <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(167,139,250,0.03) 40%, transparent 70%)", pointerEvents: "none" }} />

          <div className="container" style={{ position: "relative", zIndex: 1, paddingTop: 120, paddingBottom: 80, textAlign: "center" }}>
            <div style={{ maxWidth: 820, margin: "0 auto" }}>
              {/* Tagline badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 36, animation: "fadeUp 0.6s ease 0.2s both" }}>
                <span className="badge badge-indigo" style={{ fontSize: 12, padding: "6px 16px", letterSpacing: 1.5 }}>CHECK BEFORE YOU POST</span>
              </div>

              {/* Main headline */}
              <h1 style={{ marginBottom: 28, lineHeight: 1.05, animation: "fadeUp 0.6s ease 0.35s both" }}>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "clamp(2.8rem,5.5vw,5.2rem)", letterSpacing: -2, color: "var(--tx)", display: "block" }}>
                  Forensic{" "}
                  <span className="gradient-text">Intelligence</span>
                </span>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 300, fontSize: "clamp(1.4rem,2.8vw,2.3rem)", letterSpacing: -0.5, color: "var(--txM)", display: "block", marginTop: 8 }}>
                  That Catches Every Lie
                </span>
              </h1>

              {/* Sub-copy */}
              <p style={{ fontSize: "clamp(0.95rem,1.5vw,1.1rem)", color: "var(--txM)", lineHeight: 1.8, maxWidth: 580, margin: "0 auto 44px", animation: "fadeUp 0.6s ease 0.5s both" }}>
                The world's most advanced digital forensics detection platform, trusted by governments, broadcast networks and the judiciary. Trained on 2.4 billion samples. We catch manipulations.
              </p>

              {/* CTAs */}
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp 0.6s ease 0.65s both" }}>
                <Link href="/workstation" className="btn btn-primary btn-lg">
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" /></svg>
                  Start Forensic Analysis
                </Link>
                <button onClick={() => setContactOpen(true)} className="btn btn-glow btn-lg">Request Enterprise Demo</button>
              </div>

              {/* Trust line */}
              <div style={{ marginTop: 56, display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp 0.6s ease 0.8s both" }}>
                {["Govt Verified", "Court Admissible", "ISO Compliant", "GDPR Secure"].map(t => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, background: "var(--primaryL)", borderRadius: "50%", boxShadow: "0 0 8px var(--glow)", display: "inline-block" }} />
                    <span style={{ fontSize: 12, color: "var(--txM)", letterSpacing: 0.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════ STATS BAR ═══════════════════ */}
        <section style={{ padding: "56px 0", background: "var(--surf)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 40, textAlign: "center" }}>
              {STATS.map(s => (
                <Reveal key={s.label} delay={0}>
                  <div className="stat-number" style={{ marginBottom: 6 }}>
                    {s.display || <Counter target={s.value} suffix={s.suffix} prefix={s.prefix || ""} decimals={s.decimals} />}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--txM)", letterSpacing: 0.3 }}>{s.label}</div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
        <section className="section">
          <div className="container">
            <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>How It Works</div>
              <h2 style={{ fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 800, letterSpacing: -1, marginBottom: 16 }}>
                Three Steps to <span className="gradient-text">the Truth</span>
              </h2>
              <p style={{ color: "var(--txM)", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
                From upload to court-ready report in under 3 seconds
              </p>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, position: "relative" }}>
              {/* Connecting line */}
              <div style={{ position: "absolute", top: 52, left: "16.66%", right: "16.66%", height: 1, background: "linear-gradient(90deg, var(--border), var(--primary), var(--border))", zIndex: 0 }} />
              {STEPS.map((s, i) => (
                <Reveal key={s.num} delay={i * 0.15} style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%", margin: "0 auto 24px",
                    background: "linear-gradient(135deg, var(--surf2), var(--surf3))",
                    border: "1px solid var(--border2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28,
                    boxShadow: "0 0 30px rgba(99,102,241,0.1)",
                  }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "var(--glow)", marginBottom: 8 }}>STEP {s.num}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--txM)", lineHeight: 1.7, maxWidth: 280, margin: "0 auto" }}>{s.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ═══════════════════ SOLUTIONS ═══════════════════ */}
        <section id="solutions" className="section">
          <div className="container">
            <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>Detection Capabilities</div>
              <h2 style={{ fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 800, letterSpacing: -1, marginBottom: 16 }}>
                Six Pillars of <span className="gradient-text">Forensic Excellence</span>
              </h2>
              <p style={{ color: "var(--txM)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
                Every Nexus-7 detection module is purpose-built for the specific forensic signatures of each media type
              </p>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
              {SOLUTIONS.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.08}>
                  <div className="glass" style={{ padding: "32px 28px", cursor: "default", transition: "all 0.35s ease", height: "100%", display: "flex", flexDirection: "column" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + "60"; e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 20px 60px ${s.color}18` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "" }}>
                    <div style={{ fontSize: 32, marginBottom: 16 }}>{s.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: s.color, marginBottom: 6 }}>{s.engine}</div>
                    <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                    <p style={{ fontSize: 14, color: "var(--txM)", lineHeight: 1.7, flex: 1 }}>{s.desc}</p>
                    <div style={{ marginTop: 20, height: 2, background: `linear-gradient(90deg,${s.color}80,transparent)`, borderRadius: 1 }} />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ═══════════════════ TECHNOLOGY ═══════════════════ */}
        <section id="technology" className="section">
          <div className="container">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
              <Reveal>
                <div className="section-label" style={{ marginBottom: 14 }}>The Technology</div>
                <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, letterSpacing: -1, marginBottom: 20, lineHeight: 1.1 }}>
                  Built on <span className="gradient-text">Nexus-7</span><br />The World's Most<br />Trained Forensic Engine
                </h2>
                <p style={{ color: "var(--txM)", lineHeight: 1.8, marginBottom: 40, fontSize: 15 }}>
                  While others trained on millions of samples, we trained on billions. Nexus-7 has seen every AI model's fingerprint — from public generators to classified state-level systems. The result is detection capability that no forgery can outrun.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {TECH.map((t, i) => (
                    <Reveal key={t.title} delay={i * 0.1}>
                      <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ width: 3, background: `linear-gradient(to bottom,${t.color},transparent)`, borderRadius: 2, flexShrink: 0, minHeight: 60 }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: t.color }}>{t.title}</div>
                          <div style={{ fontSize: 13.5, color: "var(--txM)", lineHeight: 1.65 }}>{t.desc}</div>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </Reveal>
              {/* Technology sphere */}
              <Reveal delay={0.2} style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ position: "relative", width: 400, height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {/* Outer ring */}
                  <div className="glow-pulse" style={{ width: 320, height: 320, borderRadius: "50%", border: "1px solid rgba(99,102,241,0.15)", position: "absolute" }} />
                  {/* Mid ring */}
                  <div style={{ width: 240, height: 240, borderRadius: "50%", border: "1px solid rgba(167,139,250,0.2)", position: "absolute", animation: "spin 30s linear infinite reverse" }} />
                  {/* Inner glow */}
                  <div style={{ width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)", position: "absolute" }} />
                  {/* Logo */}
                  <img src="/logo-symbol.png" alt="Dalxic" width={152} height={152} style={{ width: 152, height: 152, objectFit: "contain", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, calc(-50% - 14px))", zIndex: 1, filter: "drop-shadow(0 0 20px rgba(99,102,241,0.3))" }} />
                  {/* Scan line */}
                  <div className="scan-line-effect" style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", overflow: "hidden", opacity: 0.3, pointerEvents: "none" }} />
                  {/* Orbiting stat badges */}
                  {[
                    { label: "98.9%", sub: "Accuracy", angle: -30 },
                    { label: "2.4B+", sub: "Samples", angle: 60 },
                    { label: "73+", sub: "Dimensions", angle: 150 },
                    { label: "<3s", sub: "Analysis", angle: 240 },
                  ].map(({ label, sub, angle }) => {
                    const rad = angle * Math.PI / 180, r = 195
                    return (
                      <div key={label} className="glass" style={{
                        position: "absolute",
                        left: `calc(50% + ${Math.cos(rad) * r}px - 48px)`,
                        top: `calc(50% + ${Math.sin(rad) * r}px - 26px)`,
                        width: 96, padding: "8px 10px", textAlign: "center",
                        border: "1px solid rgba(99,102,241,0.2)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                      }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "var(--glow)" }}>{label}</div>
                        <div style={{ fontSize: 9, color: "var(--txM)", letterSpacing: 0.5, textTransform: "uppercase" }}>{sub}</div>
                      </div>
                    )
                  })}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ═══════════════════ CLIENTS ═══════════════════ */}
        <section id="clients" className="section">
          <div className="container">
            <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>Who We Serve</div>
              <h2 style={{ fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 800, letterSpacing: -1, marginBottom: 16 }}>
                Trusted by the Institutions <span className="gradient-text">That Shape the World</span>
              </h2>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 16 }}>
              {CLIENTS.map((c, i) => (
                <Reveal key={c.label} delay={i * 0.06}>
                  <div className="glass" style={{ padding: "28px 24px", display: "flex", gap: 18, transition: "all 0.3s ease", height: "100%" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.transform = "translateY(-4px)" }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.transform = "" }}>
                    <div style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>{c.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{c.label}</div>
                      <div style={{ fontSize: 13, color: "var(--txM)", lineHeight: 1.65 }}>{c.desc}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ═══════════════════ REPORT PREVIEW ═══════════════════ */}
        <section className="section" style={{ background: "var(--surf)" }}>
          <div className="container">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
              <Reveal>
                <div className="glass" style={{ padding: 28, border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 0 60px rgba(99,102,241,0.1)" }}>
                  {/* Report header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--glow)", letterSpacing: 1 }}>DALXIC FORENSICS</div>
                        <div style={{ fontSize: 9, color: "var(--txM)" }}>Certified Report — ForensIQ™</div>
                      </div>
                    </div>
                    <span className="badge badge-red">AI DETECTED</span>
                  </div>
                  {/* Confidence bar */}
                  <div style={{ background: "var(--surf2)", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                    <div style={{ fontSize: 10, color: "var(--txM)", marginBottom: 8, letterSpacing: 0.5 }}>CONFIDENCE SCORE</div>
                    <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "97.3%", background: "linear-gradient(90deg,var(--re),#FF6B6B)", borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--re)", marginTop: 8 }}>97.3% — HIGH CONFIDENCE</div>
                  </div>
                  {/* Forensic signals */}
                  {[
                    ["GAN Fingerprint", "Detected", true],
                    ["Pixel Coherence", "Anomalous", true],
                    ["Metadata Integrity", "Compromised", true],
                    ["Temporal Consistency", "Verified", false],
                    ["Neural Trace", "Synthetic", true],
                  ].map(([k, v, bad]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 12, color: "var(--txM)" }}>{k}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: bad ? "var(--re)" : "var(--gr)" }}>{v}</span>
                    </div>
                  ))}
                  {/* Mini radar placeholder */}
                  <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                    <div style={{ flex: 1, background: "var(--surf2)", borderRadius: 8, padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "var(--txM)", letterSpacing: 0.5, marginBottom: 4 }}>RISK LEVEL</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--re)" }}>CRITICAL</div>
                    </div>
                    <div style={{ flex: 1, background: "var(--surf2)", borderRadius: 8, padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "var(--txM)", letterSpacing: 0.5, marginBottom: 4 }}>DIMENSIONS</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--glow)" }}>73</div>
                    </div>
                    <div style={{ flex: 1, background: "var(--surf2)", borderRadius: 8, padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "var(--txM)", letterSpacing: 0.5, marginBottom: 4 }}>TIME</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--cyan)" }}>2.1s</div>
                    </div>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="section-label" style={{ marginBottom: 14 }}>ForensIQ™ Reports</div>
                <h2 style={{ fontSize: "clamp(1.6rem,3.5vw,2.6rem)", fontWeight: 800, letterSpacing: -0.8, marginBottom: 18, lineHeight: 1.15 }}>
                  Court-Admissible Reports in <span className="gradient-text">Seconds</span>
                </h2>
                <p style={{ color: "var(--txM)", lineHeight: 1.8, marginBottom: 28, fontSize: 15 }}>
                  Every Dalxic analysis generates a forensic-grade report with full chain-of-custody metadata, confidence visualisations, dimensional breakdowns and executive summaries.
                </p>
                {["Cryptographically signed reports", "73-dimension breakdown charts", "Full metadata forensics", "Executive presentation-style layout", "Legal chain-of-custody logging", "Multi-language export ready"].map((f, i) => (
                  <Reveal key={f} delay={i * 0.05}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primaryL)", fontSize: 11, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 14, color: "var(--txM)" }}>{f}</span>
                    </div>
                  </Reveal>
                ))}
                <Link href="/workstation" className="btn btn-primary" style={{ marginTop: 24 }}>Try a Scan</Link>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
        <section className="section">
          <div className="container">
            <Reveal style={{ textAlign: "center", marginBottom: 60 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>Testimonials</div>
              <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, letterSpacing: -1 }}>
                What Our Clients <span className="gradient-text">Say</span>
              </h2>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <div className="glass" style={{ padding: "32px 28px", height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 36, color: "var(--glow)", marginBottom: 12, opacity: 0.6, lineHeight: 1 }}>“</div>
                    <p style={{ fontSize: 14.5, color: "var(--tx)", lineHeight: 1.75, marginBottom: 24, fontStyle: "italic", flex: 1 }}>{t.quote}</p>
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: "var(--txM)" }}>{t.org}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ CTA ═══════════════════ */}
        <section style={{ padding: "100px 0", background: "var(--surf)", borderTop: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />
          <div className="container" style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <Reveal>
              <div className="section-label" style={{ marginBottom: 16 }}>Get Started</div>
              <h2 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 800, letterSpacing: -1.5, marginBottom: 20 }}>
                The Lie Stops Here.<br /><span className="gradient-text">Check Before You Talk.</span>
              </h2>
              <p style={{ color: "var(--txM)", fontSize: 16, maxWidth: 500, margin: "0 auto 44px", lineHeight: 1.7 }}>
                Join the world's most security-conscious organisations who rely on Dalxic to protect the truth.
              </p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/workstation" className="btn btn-primary btn-lg">Begin Free Analysis</Link>
                <button onClick={() => setContactOpen(true)} className="btn btn-glow btn-lg">Contact Enterprise Sales</button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════ FOOTER ═══════════════════ */}
        <footer style={{ background: "var(--bg)", borderTop: "1px solid var(--border)", padding: "60px 0 0" }}>
          <div className="container">
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
              <div>
                <div style={{ display: "inline-flex", flexDirection: "column", marginBottom: 16 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: "#F0F4FF", lineHeight: 1, display: "flex", gap: 1, fontFamily: "'Plus Jakarta Sans','Space Grotesk',sans-serif" }}>{"Dalxıc".split("").map((c, i) => <span key={i} style={{ display: "inline-block" }}>{c === " " ? "\u00A0" : i === 4 ? <span style={{ position: "relative" }}>ı<span style={{ position: "absolute", top: -5, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: "#818CF8", boxShadow: "0 0 8px #6366F1" }} /></span> : c}</span>)}</span>
                  <span style={{ fontWeight: 600, fontSize: 11, color: "#A78BFA", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 3, fontFamily: "'Space Grotesk',sans-serif" }}>Powered by Nexus-7</span>
                </div>
                <p style={{ fontSize: 13.5, color: "var(--txM)", lineHeight: 1.7, maxWidth: 280, marginBottom: 16 }}>
                  Check Before You Talk. Powered by Nexus-7. Trained on 2.4 billion samples.
                </p>
                <a href={process.env.NEXT_PUBLIC_MAIN_URL || "http://localhost:3000"} style={{ fontSize: 12, color: "var(--txD)", textDecoration: "none" }}>dalxic.com</a>
              </div>
              {[
                { title: "Platform", links: [["Workstation", "/workstation"], ["Reports", "/reports"], ["Dalxic Chat", "/chat"], ["Integrations", "/integrations"]] },
                { title: "Company", links: [["About", "/about"], ["Team", "/team"], ["Pricing", "/pricing"], ["Contact", "#contact"]] },
                { title: "Verticals", links: [["Dalxic Main", process.env.NEXT_PUBLIC_MAIN_URL || "http://localhost:3000"], ["DalxicHealth", (process.env.NEXT_PUBLIC_MAIN_URL || "http://localhost:3000") + "/#stations"], ["DalxicJudiciary", "#"]] },
                { title: "Legal", links: [["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"]] },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16, color: "var(--txM)" }}>{col.title}</div>
                  {col.links.map(([label, href]) => (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <Link href={href} style={{ fontSize: 13.5, color: "var(--txD)", textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => e.target.style.color = "var(--tx)"} onMouseLeave={e => e.target.style.color = "var(--txD)"}>
                        {label}
                      </Link>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="divider" style={{ marginBottom: 0 }} />
            <div style={{ padding: "14px 0 6px", overflow: "hidden" }}>
              <Ticker text="© 2026 Dalxic Forensics. All rights reserved. Nexus-7 · ChromaVeil™ · SonicTrace™ · KineticScan™ · NarrativeGuard™ · FusionProbe™ · SentinelCore™ · ForensIQ™ · NexusLink™ — Proprietary trademarks of Dalxic. Check Before You Talk. dalxic.com" />
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes charJuggle { 0% { opacity:0; transform: translateY(12px) rotate(-2deg); } 60% { transform: translateY(-3px) rotate(0.5deg); } 100% { opacity:1; transform: translateY(0) rotate(0); } }
        @keyframes marqueeScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        @media (max-width: 768px) {
          section [style*="gridTemplateColumns: repeat(3"] { grid-template-columns: 1fr !important; }
          section [style*="gridTemplateColumns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          section [style*="gridTemplateColumns: 2fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ background: "#03050F", minHeight: "100vh" }} />}>
      <HomeInner />
    </Suspense>
  )
}
