"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"

/* ═══════════════════════════════════════════════════════════════════
   PRICING DATA — 4 Master Categories, each with Basic / Standard / Premium
   ═══════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  {
    id: "individuals",
    label: "Non Professionals (Individuals)",
    shortLabel: "Individuals",
    desc: "Personal verification for curious minds and independent investigators.",
    accent: "#22D3EE",
    plans: [
      {
        tier: "Free", name: "Fact Checker", planKey: "individual_free",
        free: true,
        features: [
          { text: "5 verifications per month", on: true },
          { text: "Image verification (ChromaVeil\u2122)", on: true },
          { text: "Verification finding with confidence score", on: true },
          { text: "Basic forensic summary", on: true },
          { text: "Video verification", on: false },
          { text: "Audio verification", on: false },
          { text: "ForensIQ\u2122 reports", on: false },
          { text: "Team access", on: false },
        ],
      },
    ],
  },
  {
    id: "journalists",
    label: "News Presenters & Journalists",
    shortLabel: "Journalists",
    desc: "Editorial-grade verification for newsrooms and investigative reporters.",
    accent: "#6366F1",
    plans: [
      {
        tier: "Basic", name: "Newsroom Starter", planKey: "journalist_basic",
        features: [
          { text: "100 verifications per month", on: true },
          { text: "Image & video detection", on: true },
          { text: "ChromaVeil\u2122 image analysis", on: true },
          { text: "KineticScan\u2122 video analysis", on: true },
          { text: "Basic forensic PDF reports", on: true },
          { text: "Email support", on: true },
          { text: "1 project workspace", on: true },
          { text: "NarrativeGuard\u2122", on: false },
          { text: "Dalxic Chat", on: false },
        ],
      },
      {
        tier: "Standard", name: "Press Verification", planKey: "journalist_standard",
        popular: true,
        features: [
          { text: "250 verifications per month", on: true },
          { text: "All media types (image, video, audio)", on: true },
          { text: "Full Nexus-7 detection suite", on: true },
          { text: "NarrativeGuard\u2122 news verification", on: true },
          { text: "ForensIQ\u2122 forensic reports", on: true },
          { text: "Dalxic Chat assistant", on: true },
          { text: "3 project workspaces", on: true },
          { text: "Priority email support", on: true },
        ],
      },
      {
        tier: "Premium", name: "Editorial Intelligence", planKey: "journalist_premium",
        features: [
          { text: "500 verifications per month", on: true },
          { text: "All media types + audio-visual fusion", on: true },
          { text: "Full Nexus-7 engine access", on: true },
          { text: "NarrativeGuard\u2122 verification", on: true },
          { text: "ForensIQ\u2122 court-grade reports", on: true },
          { text: "NexusLink\u2122 API access", on: true },
          { text: "Dalxic Chat assistant", on: true },
          { text: "Unlimited project workspaces", on: true },
          { text: "Priority email support", on: true },
        ],
      },
    ],
  },
  {
    id: "broadcast",
    label: "Broadcast Organisations & Media Groups",
    shortLabel: "Broadcast",
    desc: "Enterprise-scale detection for television networks, radio and digital media.",
    accent: "#A78BFA",
    plans: [
      {
        tier: "Basic", name: "Broadcast Starter", planKey: "broadcast_basic",
        features: [
          { text: "500 verifications per month", on: true },
          { text: "Image, video & audio detection", on: true },
          { text: "ChromaVeil\u2122 + KineticScan\u2122 + SonicTrace\u2122", on: true },
          { text: "ForensIQ\u2122 forensic reports", on: true },
          { text: "Dalxic Chat assistant", on: true },
          { text: "3 project workspaces", on: true },
          { text: "Priority email support", on: true },
          { text: "SentinelCore\u2122 live monitoring", on: false },
          { text: "NexusLink\u2122 API", on: false },
        ],
      },
      {
        tier: "Standard", name: "Broadcast Operations", planKey: "broadcast_standard",
        popular: true,
        features: [
          { text: "2,000 verifications per month", on: true },
          { text: "All media types + live streams", on: true },
          { text: "Full Nexus-7 + SentinelCore\u2122", on: true },
          { text: "NarrativeGuard\u2122 verification", on: true },
          { text: "ForensIQ\u2122 reports + custom branding", on: true },
          { text: "NexusLink\u2122 API access", on: true },
          { text: "Dalxic Chat with verification context", on: true },
          { text: "Unlimited project workspaces", on: true },
          { text: "Dedicated account support", on: true },
        ],
      },
      {
        tier: "Premium", name: "Enterprise Broadcast", planKey: "broadcast_premium",
        features: [
          { text: "Unlimited verifications", on: true },
          { text: "All modules + FusionProbe\u2122 AV sync", on: true },
          { text: "SentinelCore\u2122 live broadcast monitoring", on: true },
          { text: "White-label forensic reports", on: true },
          { text: "NexusLink\u2122 API (unlimited)", on: true },
          { text: "SSO / SAML authentication", on: true },
          { text: "Audit logs & compliance reports", on: true },
          { text: "Custom report branding", on: true },
          { text: "Unlimited workspaces & seats", on: true },
          { text: "Dedicated SLA support", on: true },
        ],
      },
    ],
  },
  {
    id: "government",
    label: "Government & Judiciary",
    shortLabel: "Government",
    desc: "Classified-grade forensic intelligence for national institutions and courts.",
    accent: "#F59E0B",
    plans: [
      {
        tier: "Basic", name: "Institutional Starter", planKey: "gov_basic",
        features: [
          { text: "1,000 verifications per month", on: true },
          { text: "All media types supported", on: true },
          { text: "Full Nexus-7 engine", on: true },
          { text: "Court-admissible ForensIQ\u2122 reports", on: true },
          { text: "NarrativeGuard\u2122 verification", on: true },
          { text: "Dalxic Chat assistant", on: true },
          { text: "Unlimited project workspaces", on: true },
          { text: "Dedicated account manager", on: true },
          { text: "NexusLink\u2122 API", on: false },
        ],
      },
      {
        tier: "Standard", name: "Judicial Operations", planKey: "gov_standard",
        popular: true,
        features: [
          { text: "5,000 verifications per month", on: true },
          { text: "All modules + SentinelCore\u2122 + FusionProbe\u2122", on: true },
          { text: "Court-admissible forensic reports", on: true },
          { text: "NexusLink\u2122 API access", on: true },
          { text: "SSO / SAML authentication", on: true },
          { text: "Audit logs & compliance reports", on: true },
          { text: "Custom report branding", on: true },
          { text: "Unlimited workspaces & seats", on: true },
          { text: "Dedicated SLA (4-hour response)", on: true },
        ],
      },
      {
        tier: "Premium", name: "Sovereign Operations", planKey: "gov_premium",
        features: [
          { text: "Unlimited verifications \u2014 no caps", on: true },
          { text: "All detection modules + custom training", on: true },
          { text: "On-premise or private cloud deployment", on: true },
          { text: "Air-gap & classified-grade security", on: true },
          { text: "Full white-label platform", on: true },
          { text: "NexusLink\u2122 API (unlimited)", on: true },
          { text: "Regulatory compliance certification", on: true },
          { text: "Board-level forensic briefings", on: true },
          { text: "Unlimited seats & workspaces", on: true },
          { text: "Sovereign SLA (2-hour or better)", on: true },
        ],
      },
    ],
  },
]

const TIER_COLORS = {
  Free:     { bg: "rgba(255,255,255,0.03)", border: "rgba(34,211,238,0.15)", bar: "linear-gradient(135deg, #22D3EE, #06B6D4)" },
  Basic:    { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)", bar: "linear-gradient(135deg, #22D3EE, #06B6D4)" },
  Standard: { bg: "rgba(99,102,241,0.06)", border: "rgba(99,102,241,0.25)", bar: "linear-gradient(135deg, #6366F1, #4F46E5)" },
  Premium:  { bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.3)", bar: "linear-gradient(135deg, #A78BFA, #7C3AED)" },
}

const FAQ = [
  { q: "How do I get access to a plan?", a: "All plans are request-based. Submit your interest and our team will contact you within 24 hours to discuss your needs, verify your use case and activate your account with the appropriate package." },
  { q: "Can I upgrade between categories?", a: "Yes. Your Dalxic account can be upgraded or migrated between any category and tier. Contact your account manager or our enterprise team to discuss changes." },
  { q: "Are forensic reports admissible in court?", a: "ForensIQ\u2122 reports on Government & Judiciary plans include cryptographic signing, full chain-of-custody metadata and forensic certification formatted to international legal standards." },
  { q: "How does the NexusLink\u2122 API work?", a: "NexusLink\u2122 provides a RESTful API with client libraries for Python, JavaScript and Java. API access is available on higher-tier plans with rate limits appropriate to your subscription." },
  { q: "Is my data private?", a: "Absolutely. Dalxic never stores your submitted media. Analysis is performed in encrypted memory and purged immediately after the report is generated. We are GDPR compliant and ISO 27001 aligned." },
]

/* ═══════════════════════════════════════════════════════════════════ */

export default function PricingPage() {
  const [activeCat, setActiveCat] = useState(0)
  const [autoCycle, setAutoCycle] = useState(true)
  const [annual, setAnnual] = useState(false)
  const [faqOpen, setFaqOpen] = useState(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [contactPlan, setContactPlan] = useState("")
  const [form, setForm] = useState({ name: "", org: "", email: "", message: "" })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const intervalRef = useRef(null)

  // Auto-cycle categories every 5s
  useEffect(() => {
    if (!autoCycle) { clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      setActiveCat(c => (c + 1) % CATEGORIES.length)
    }, 5000)
    return () => clearInterval(intervalRef.current)
  }, [autoCycle])

  function selectCategory(i) {
    setActiveCat(i)
    setAutoCycle(false)
  }

  // Custom cursor
  useEffect(() => {
    const cursor = document.getElementById("dal-cursor")
    const ring = document.getElementById("dal-ring")
    if (!cursor || !ring) return
    const move = e => { cursor.style.left = e.clientX + "px"; cursor.style.top = e.clientY + "px"; ring.style.left = e.clientX + "px"; ring.style.top = e.clientY + "px" }
    const over = () => document.body.classList.add("cursor-hover")
    const out = () => document.body.classList.remove("cursor-hover")
    window.addEventListener("mousemove", move)
    document.querySelectorAll("a,button").forEach(el => { el.addEventListener("mouseenter", over); el.addEventListener("mouseleave", out) })
    return () => window.removeEventListener("mousemove", move)
  }, [activeCat])

  function openContact(planName) {
    setContactPlan(planName)
    setContactOpen(true)
    setSent(false)
  }

  async function submitContact(e) {
    e.preventDefault(); setSending(true)
    try {
      await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, message: `Plan interest: ${contactPlan}\n\n${form.message}` }) })
      setSent(true)
    } catch { }
    setSending(false)
  }

  const cat = CATEGORIES[activeCat]

  return (
    <>
      <div id="dal-cursor" className="cursor" />
      <div id="dal-ring" className="cursor-ring" />

      {/* Contact Modal */}
      {contactOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(4,7,18,0.88)", backdropFilter: "blur(12px)", transform: "translateZ(0)", willChange: "transform", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => e.target === e.currentTarget && setContactOpen(false)}>
          <div className="glass" style={{ width: "100%", maxWidth: 540, padding: "40px 44px", border: `1px solid ${cat.accent}30`, boxShadow: `0 0 80px ${cat.accent}18`, animation: "fadeUp 0.3s ease" }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16, color: cat.accent }}>&#10022;</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Request Received</h3>
                <p style={{ color: "var(--txM)", lineHeight: 1.6 }}>Our team will respond within 24 hours to discuss your <strong>{contactPlan}</strong> package.</p>
                <button onClick={() => { setContactOpen(false); setSent(false) }} className="btn btn-primary" style={{ marginTop: 24 }}>Close</button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
                  <div>
                    <div className="section-label" style={{ marginBottom: 6, color: cat.accent }}>Request Access</div>
                    <h3 style={{ fontSize: 22, fontWeight: 700 }}>{contactPlan}</h3>
                    <p style={{ color: "var(--txM)", fontSize: 13, marginTop: 4 }}>{cat.label}</p>
                  </div>
                  <button onClick={() => setContactOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--txM)", fontSize: 22, padding: 4 }}>&#10005;</button>
                </div>
                <form onSubmit={submitContact} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <input className="input" placeholder="Full name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    <input className="input" placeholder="Organisation" required value={form.org} onChange={e => setForm(f => ({ ...f, org: e.target.value }))} />
                  </div>
                  <input className="input" type="email" placeholder="Email address" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  <textarea className="input" rows={4} placeholder="Tell us about your requirements..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} style={{ resize: "none" }} />
                  <button type="submit" disabled={sending} className="btn btn-primary" style={{ width: "100%", padding: "14px 0" }}>{sending ? "Sending\u2026" : "Request Access"}</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="nav scrolled">
                <Link href="/?from=nav" style={{ display:"flex", alignItems:"center", textDecoration:"none" }}>
          <span style={{ fontWeight:300, fontSize:14, color:"#94A3B8", letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans','Space Grotesk',sans-serif" }}>Dalxic</span>
          <span style={{ fontWeight:700, fontSize:14, letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans','Space Grotesk',sans-serif", background:"linear-gradient(135deg, #818CF8, #A78BFA)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Media</span>
        </Link>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/" className="btn btn-ghost btn-sm">Home</Link>
          <Link href="/team" className="btn btn-ghost btn-sm">Team</Link>
          <Link href="/workstation" className="btn btn-primary btn-sm">Begin Verification</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 130, paddingBottom: 40, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${cat.accent}0A 0%, transparent 70%)`, pointerEvents: "none", transition: "background 0.8s ease" }} />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="section-label" style={{ marginBottom: 14, color: cat.accent, transition: "color 0.5s" }}>Pricing</div>
          <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 3.4rem)", fontWeight: 800, letterSpacing: -1.5, marginBottom: 16 }}>
            Choose Your <span className="gradient-text">Forensic Package</span>
          </h1>
          <p style={{ color: "var(--txM)", fontSize: 15, maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Every plan is request-based. Our team will configure your access and onboard you personally.
          </p>

          {/* Monthly/Annual toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, background: "var(--surf)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px 16px", marginBottom: 40 }}>
            <span style={{ fontSize: 14, color: !annual ? "var(--tx)" : "var(--txM)", fontWeight: !annual ? 600 : 400 }}>Monthly</span>
            <button
              onClick={() => setAnnual(a => !a)}
              style={{ width: 44, height: 24, borderRadius: 12, background: annual ? "var(--primary)" : "var(--border2)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.3s" }}
            >
              <span style={{ position: "absolute", top: 3, left: annual ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.3s" }} />
            </button>
            <span style={{ fontSize: 14, color: annual ? "var(--tx)" : "var(--txM)", fontWeight: annual ? 600 : 400 }}>Annual</span>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section style={{ paddingBottom: 16 }}>
        <div className="container">
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
            {CATEGORIES.map((c, i) => (
              <button
                key={c.id}
                onClick={() => selectCategory(i)}
                style={{
                  padding: "10px 22px", borderRadius: 10, cursor: "pointer",
                  fontSize: 13, fontWeight: 600, letterSpacing: 0.3,
                  transition: "all 0.4s ease",
                  background: activeCat === i ? `${c.accent}18` : "transparent",
                  border: activeCat === i ? `1.5px solid ${c.accent}50` : "1px solid var(--border)",
                  color: activeCat === i ? c.accent : "var(--txM)",
                  boxShadow: activeCat === i ? `0 0 20px ${c.accent}12` : "none",
                }}
              >
                {c.shortLabel}
                {/* Active indicator dot */}
                {activeCat === i && autoCycle && (
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: c.accent, marginLeft: 8, animation: "pulse 2s ease-in-out infinite" }} />
                )}
              </button>
            ))}
          </div>
          {/* Auto-cycle indicator */}
          {autoCycle && (
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 11, color: "var(--txD)", letterSpacing: 0.5 }}>Auto-browsing categories</span>
            </div>
          )}
          {!autoCycle && (
            <div style={{ textAlign: "center" }}>
              <button onClick={() => setAutoCycle(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--txD)", letterSpacing: 0.5 }}>
                Resume auto-browse
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Category Header */}
      <section style={{ paddingBottom: 12 }}>
        <div className="container" style={{ textAlign: "center" }}>
          <div style={{
            display: "inline-block", padding: "6px 20px", borderRadius: 20,
            background: `${cat.accent}15`, border: `1px solid ${cat.accent}30`,
            fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: cat.accent,
            textTransform: "uppercase", marginBottom: 14,
            transition: "all 0.5s ease",
          }}>
            {cat.label}
          </div>
          <p style={{ color: "var(--txM)", fontSize: 14, maxWidth: 500, margin: "0 auto", lineHeight: 1.6, transition: "all 0.5s ease" }}>
            {cat.desc}
          </p>
        </div>
      </section>

      {/* Plan Cards — always 3 abreast */}
      <section style={{ paddingBottom: 80 }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: cat.plans.length === 1 ? "1fr" : "repeat(3, 1fr)", gap: 20, alignItems: "start", maxWidth: cat.plans.length === 1 ? 400 : 1100, margin: "0 auto" }}>
            {cat.plans.map((plan, i) => {
              const tc = TIER_COLORS[plan.tier]
              const isPop = plan.popular
              const isPremium = plan.tier === "Premium"
              return (
                <div
                  key={plan.planKey}
                  style={{
                    borderRadius: 20, overflow: "hidden", position: "relative",
                    background: isPop ? tc.bg : tc.bg,
                    border: isPop ? `1.5px solid ${tc.border}` : `1px solid ${tc.border}`,
                    transform: isPop ? "scale(1.03)" : "scale(1)",
                    boxShadow: isPop ? `0 20px 60px ${cat.accent}12` : isPremium ? `0 12px 40px rgba(167,139,250,0.08)` : "0 4px 20px rgba(0,0,0,0.2)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = isPop ? "scale(1.05)" : "scale(1.02)"; e.currentTarget.style.boxShadow = `0 24px 70px ${cat.accent}18` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = isPop ? "scale(1.03)" : "scale(1)"; e.currentTarget.style.boxShadow = isPop ? `0 20px 60px ${cat.accent}12` : isPremium ? "0 12px 40px rgba(167,139,250,0.08)" : "0 4px 20px rgba(0,0,0,0.2)" }}
                >
                  {/* Popular badge */}
                  {isPop && (
                    <div style={{ position: "absolute", top: 16, right: 16, background: tc.bar, padding: "4px 14px", borderRadius: 12, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#fff" }}>
                      RECOMMENDED
                    </div>
                  )}
                  {isPremium && !isPop && (
                    <div style={{ position: "absolute", top: 16, right: 16, background: "linear-gradient(135deg, #A78BFA, #7C3AED)", padding: "4px 14px", borderRadius: 12, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#fff" }}>
                      FULL ACCESS
                    </div>
                  )}

                  {/* Top accent bar */}
                  <div style={{ height: 4, background: tc.bar }} />

                  <div style={{ padding: "36px 28px 30px" }}>
                    {/* Tier + Plan name */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: (plan.tier === "Basic" || plan.tier === "Free") ? "#22D3EE" : plan.tier === "Standard" ? "#818CF8" : "#A78BFA", marginBottom: 4 }}>
                        {plan.tier}
                      </div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>{plan.name}</h3>
                    </div>

                    {/* Price */}
                    <div style={{ marginBottom: 24 }}>
                      {plan.free ? (
                        <>
                          <span style={{ fontSize: 36, fontWeight: 800, color: cat.accent, transition: "color 0.5s" }}>Free</span>
                          <div style={{ fontSize: 13, color: "var(--txM)", marginTop: 4 }}>No card required</div>
                        </>
                      ) : (
                        <span style={{ fontSize: 36, fontWeight: 800, color: cat.accent, transition: "color 0.5s" }}>Request</span>
                      )}
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: tc.border, margin: "0 0 20px" }} />

                    {/* Features */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                      {plan.features.map((feat, j) => (
                        <div key={j} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: 10, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 700,
                            background: feat.on ? ((plan.tier === "Basic" || plan.tier === "Free") ? "rgba(34,211,238,0.12)" : plan.tier === "Standard" ? "rgba(99,102,241,0.15)" : "rgba(167,139,250,0.15)") : "rgba(255,255,255,0.04)",
                            color: feat.on ? ((plan.tier === "Basic" || plan.tier === "Free") ? "#22D3EE" : plan.tier === "Standard" ? "#818CF8" : "#A78BFA") : "#4A4E68",
                          }}>
                            {feat.on ? "\u2713" : "\u2014"}
                          </div>
                          <span style={{ fontSize: 13, lineHeight: 1.4, color: feat.on ? "#C8CCE0" : "#4A4E68" }}>{feat.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => openContact(`${cat.label} \u2014 ${plan.tier}: ${plan.name}`)}
                      style={{
                        width: "100%", padding: "14px 0", borderRadius: 12, cursor: "pointer",
                        fontSize: 14, fontWeight: 700, letterSpacing: 0.5, transition: "all 0.3s",
                        background: plan.free ? "transparent" : isPop ? tc.bar : isPremium ? "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.05))" : "transparent",
                        color: plan.free ? "#22D3EE" : isPop ? "#fff" : plan.tier === "Basic" ? "#22D3EE" : plan.tier === "Standard" ? "#818CF8" : "#A78BFA",
                        border: plan.free ? "1.5px solid rgba(34,211,238,0.25)" : isPop ? "none" : `1.5px solid ${plan.tier === "Basic" ? "rgba(34,211,238,0.25)" : plan.tier === "Standard" ? "rgba(99,102,241,0.25)" : "rgba(167,139,250,0.3)"}`,
                      }}
                    >
                      {plan.free ? "Create Free Account" : "Request Access"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Upgrade nudge for free tier */}
          {cat.plans.length === 1 && (
            <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--txM)", letterSpacing: 0.3 }}>
              Need more? Journalists start at 100 verifications per month.
            </p>
          )}

          {/* Mobile fallback — hint */}
          <style>{`
            @media (max-width: 860px) {
              .container > div[style*="grid-template-columns: repeat(3"] {
                grid-template-columns: 1fr !important;
                max-width: 420px !important;
              }
            }
          `}</style>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ paddingBottom: 100 }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, letterSpacing: -0.8, marginBottom: 40, textAlign: "center" }}>
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          {FAQ.map((f, i) => (
            <div key={i} style={{ borderBottom: "1px solid var(--border)", padding: "20px 0" }}>
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0, textAlign: "left" }}
              >
                <span style={{ fontWeight: 600, fontSize: 15, color: "var(--tx)" }}>{f.q}</span>
                <span style={{ color: "var(--primary)", transition: "transform 0.3s", transform: faqOpen === i ? "rotate(45deg)" : "none", fontSize: 20, flexShrink: 0 }}>+</span>
              </button>
              {faqOpen === i && <p style={{ marginTop: 14, fontSize: 14, color: "var(--txM)", lineHeight: 1.75, animation: "fadeUp 0.3s ease" }}>{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <footer style={{ padding: "32px 0", borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "var(--txD)" }}>&copy; 2026 Dalxic Forensics &mdash; <Link href="/" style={{ color: "var(--primaryL)", textDecoration: "none" }}>dalxic.com</Link></span>
      </footer>
    </>
  )
}
