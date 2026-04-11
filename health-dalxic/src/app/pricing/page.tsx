"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const COPPER = "#B87333";
const COPPER_LIGHT = "#D4956B";
const BLUE = "#0EA5E9";

/* ═══════════════════════════════════════════════════════════════════
   TIER DATA — 4 Hospital Tiers, cumulative capabilities
   ════���══════════════════════════════════════════════════════════════ */

const TIERS = [
  {
    id: "T1",
    name: "Clinic",
    subtitle: "Small Clinics & GP Practices",
    maxDevices: 6,
    maxBeds: 0,
    bedLabel: "Outpatient Only",
    accent: COPPER_LIGHT,
    gradient: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`,
    bg: "rgba(184,115,51,0.04)",
    border: "rgba(184,115,51,0.15)",
    stations: [
      { text: "Front Desk & Intake", on: true },
      { text: "Consultation", on: true },
      { text: "Pharmacy Dispensing", on: true },
      { text: "Laboratory", on: true },
      { text: "Billing (Manual)", on: true },
      { text: "CallBoard\u2122 Queue Display", on: true },
    ],
    features: [
      { text: "Patient Intake & Registration", on: true },
      { text: "Queue Token System", on: true },
      { text: "Basic Prescription Dispensing", on: true },
      { text: "TriageIQ\u2122 Severity Classification", on: false, addon: true },
      { text: "SafeExit\u2122 Discharge Verification", on: false, addon: true },
      { text: "PatientLink\u2122 Notifications", on: false, addon: true },
      { text: "BillStream\u2122 Auto-Capture", on: false, addon: true },
      { text: "LiveQueue\u2122 Real-Time Display", on: false, addon: true },
      { text: "BookKeeper\u2122 Digital Records", on: false, addon: true },
      { text: "StationGuard\u2122 Access Control", on: false, addon: true },
      { text: "AuditVault\u2122 Action Logging", on: false, addon: true },
      { text: "Nursing Station", on: false },
      { text: "RedLine\u2122 Emergency Protocol", on: false },
      { text: "CareChain\u2122 Specialist Routing", on: false },
      { text: "Nexus-7\u2122", on: false },
    ],
  },
  {
    id: "T2",
    name: "Medium",
    subtitle: "District Hospitals & Polyclinics",
    maxDevices: 15,
    maxBeds: 20,
    bedLabel: "Up To 20 Beds",
    popular: true,
    accent: BLUE,
    gradient: `linear-gradient(135deg, ${BLUE}, #38BDF8)`,
    bg: "rgba(14,165,233,0.04)",
    border: "rgba(14,165,233,0.18)",
    stations: [
      { text: "Everything In Clinic Tier", on: true, highlight: true },
      { text: "Nursing & Vitals", on: true },
      { text: "Injection Room", on: true },
      { text: "Records Management", on: true },
    ],
    features: [
      { text: "All Clinic Add-Ons Included", on: true, highlight: true },
      { text: "SafeExit\u2122 Discharge Verification", on: true },
      { text: "PatientLink\u2122 Notifications (1,000/mo)", on: true },
      { text: "BillStream\u2122 Auto-Capture", on: true },
      { text: "LiveQueue\u2122 Real-Time Display", on: true },
      { text: "StationGuard\u2122 & AuditVault\u2122", on: true },
      { text: "BookKeeper\u2122 Digital Records", on: true },
      { text: "RedLine\u2122 Emergency Protocol", on: true },
      { text: "RedLine\u2122 Fast-Track Tokens", on: true },
      { text: "CareChain\u2122 Specialist Routing", on: true },
      { text: "CareChain\u2122 Daisy-Chain Handover", on: true },
      { text: "FlowEngine\u2122 Visit Orchestration", on: true },
      { text: "LabReturn\u2122 Priority Re-Consultation", on: true },
      { text: "Vitals Recording (8 Metrics)", on: true },
      { text: "Imaging", on: false, addon: true },
      { text: "Inpatient Management", on: false, addon: true },
      { text: "Nexus-7\u2122", on: false },
    ],
  },
  {
    id: "T3",
    name: "Large",
    subtitle: "Regional & Teaching Hospitals",
    maxDevices: 35,
    maxBeds: 100,
    bedLabel: "Up To 100 Beds",
    accent: "#A78BFA",
    gradient: "linear-gradient(135deg, #A78BFA, #7C3AED)",
    bg: "rgba(167,139,250,0.04)",
    border: "rgba(167,139,250,0.18)",
    stations: [
      { text: "Everything In Medium Tier", on: true, highlight: true },
      { text: "CT / Radiology", on: true },
      { text: "Ultrasound", on: true },
      { text: "Inpatient Ward", on: true },
      { text: "Bed Management System", on: true },
    ],
    features: [
      { text: "All Medium Tier Features", on: true, highlight: true },
      { text: "Imaging Workflow & Reports", on: true },
      { text: "Inpatient Admission & Rounds", on: true },
      { text: "Bed Status Tracking & Transitions", on: true },
      { text: "Ward Discharge Workflow", on: true },
      { text: "Multi-Doctor Shift Handover", on: true },
      { text: "BillStream\u2122 Advanced (Ward Days)", on: true },
      { text: "PatientLink\u2122 Notifications (2,000/mo)", on: true },
      { text: "Intensive Care Module", on: false, addon: true },
      { text: "Maternity & Delivery Module", on: false, addon: true },
      { text: "Nexus-7\u2122", on: false, addon: true },
    ],
  },
  {
    id: "T4",
    name: "Full Hospital",
    subtitle: "National & Specialist Centres",
    maxDevices: 999,
    maxBeds: 9999,
    bedLabel: "Unlimited Beds",
    accent: "#F59E0B",
    gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
    bg: "rgba(245,158,11,0.04)",
    border: "rgba(245,158,11,0.18)",
    stations: [
      { text: "Everything In Large Tier", on: true, highlight: true },
      { text: "Intensive Care Unit", on: true },
      { text: "Maternity & Delivery Suite", on: true },
      { text: "Blood Bank & Transfusion", on: true },
    ],
    features: [
      { text: "All Large Tier Features", on: true, highlight: true },
      { text: "ICU Monitoring & Vitals Grid", on: true },
      { text: "Equipment & Ventilator Tracking", on: true },
      { text: "Full Maternity Lifecycle", on: true },
      { text: "Delivery & Procedure Billing", on: true },
      { text: "Blood Inventory & Cross-Match", on: true },
      { text: "Transfusion Issue Workflow", on: true },
      { text: "Nexus-7\u2122 Clinical Intelligence", on: true },
      { text: "InsightBrief\u2122 Clinical Summaries", on: true },
      { text: "PatientLink\u2122 Unlimited", on: true },
      { text: "Custom Module Integration", on: true },
      { text: "Dedicated Onboarding & Support", on: true },
    ],
  },
];

const FAQ = [
  { q: "How Do I Get Started With DalxicHealth?", a: "All tiers are request-based. Submit a demo request and our team will contact you within 24 hours to assess your facility, recommend the right tier, and begin onboarding." },
  { q: "Can I Upgrade Between Tiers?", a: "Absolutely. Your hospital can upgrade at any time. New modules activate instantly and all existing patient data is preserved. Downgrading is also supported \u2014 modules are hidden but data is never deleted." },
  { q: "How Does The Device Limit Work?", a: "Each tier has a maximum number of concurrent devices (tablets, desktops) that can be logged in simultaneously. Devices are registered to your hospital and each operator authenticates through StationGuard\u2122." },
  { q: "Is My Patient Data Secure?", a: "Yes. All data is encrypted in transit and at rest. AuditVault\u2122 logs every action with operator identity, timestamp, and source. StationGuard\u2122 prevents unauthorised workstation access. We are GDPR-aligned and built for African healthcare compliance." },
  { q: "What Is Nexus-7\u2122?", a: "Nexus-7\u2122 is our proprietary clinical intelligence engine available on the Full Hospital tier. Capabilities are demonstrated during onboarding. Contact our team for a private walkthrough." },
  { q: "Do You Support NHIS And Insurance?", a: "Yes. BillStream\u2122 supports CASH, MOBILE_MONEY, INSURANCE, NHIS, and WAIVED payment methods. Insurance claims and NHIS integration are available on all tiers." },
  { q: "How Do Add-On Modules Work?", a: "Any feature marked as \u201CAdd-On\u201D on your tier can be activated individually for an additional charge. This lets you customise your setup \u2014 a T1 clinic can add PatientLink\u2122 notifications without upgrading to T2. Each add-on is billed separately." },
  { q: "What Happens To Add-Ons When I Upgrade?", a: "When you upgrade tiers, any add-ons that are included in the new tier become part of your base package at no extra charge. You only pay for add-ons that are above your tier level." },
];

/* ─── Galaxy Canvas ─── */
function GalaxyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight * 3);
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight * 3; };
    window.addEventListener("resize", resize);
    const stars = Array.from({ length: 300 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() < 0.06 ? Math.random() * 2.2 + 1 : Math.random() * 1 + 0.2,
      baseOpacity: Math.random() * 0.55 + 0.15,
      twinkleSpeed: Math.random() * 0.04 + 0.012,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: [[255,255,255],[255,220,180],[184,115,51],[210,150,80],[14,165,233],[160,200,255]][
        Math.random() < 0.1 ? 2 : Math.random() < 0.1 ? 3 : Math.random() < 0.06 ? 4 : Math.random() < 0.05 ? 5 : Math.floor(Math.random() * 2)
      ],
    }));
    let t = 0, raf: number;
    function draw() {
      t++;
      ctx!.clearRect(0, 0, W, H);
      stars.forEach((s) => {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
        const flicker = Math.sin(t * s.twinkleSpeed + s.twinkleOffset) * 0.3 + 0.7;
        const opacity = s.baseOpacity * flicker;
        ctx!.beginPath(); ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${opacity})`; ctx!.fill();
        if (s.r > 1.2) {
          const glow = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
          glow.addColorStop(0, `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${opacity * 0.2})`);
          glow.addColorStop(1, "transparent");
          ctx!.fillStyle = glow; ctx!.fillRect(s.x - s.r * 3, s.y - s.r * 3, s.r * 6, s.r * 6);
        }
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

/* ─── Scroll reveal ��── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : "translateY(28px)",
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */

export default function PricingPage() {
  const [contactOpen, setContactOpen] = useState(false);
  const [contactTier, setContactTier] = useState("");
  const [form, setForm] = useState({ name: "", facility: "", email: "", phone: "", beds: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  function openContact(tierName: string) {
    setContactTier(tierName);
    setContactOpen(true);
    setSent(false);
  }

  async function submitContact(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    // Placeholder — will connect to contact API
    await new Promise(r => setTimeout(r, 1200));
    setSent(true);
    setSending(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 120% 80% at 55% 20%, rgba(20,12,8,1) 0%, rgba(8,5,15,1) 40%, rgba(2,4,12,1) 100%)",
      position: "relative", overflow: "hidden", color: "#E2E8F0",
    }}>
      {/* Background layers */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 15%, rgba(184,115,51,0.06) 0%, transparent 50%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 60%, rgba(14,165,233,0.03) 0%, transparent 40%)", pointerEvents: "none" }} />
      <GalaxyCanvas />

      {/* ─── Contact Modal ─── */}
      {/* ─── Modal Animations ─── */}
      <style>{`
        @keyframes nl-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes nl-modal-in { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes nl-success-pop { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        .nl-input:focus { border-color: ${COPPER}60 !important; box-shadow: 0 0 0 3px ${COPPER}15 !important; }
        .nl-submit-btn:hover:not(:disabled) { box-shadow: 0 8px 32px ${COPPER}40 !important; transform: translateY(-1px); }
      `}</style>

      {contactOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed", inset: 0, zIndex: 9000,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
            animation: "nl-backdrop-in 0.25s ease",
          }}
          onClick={e => e.target === e.currentTarget && setContactOpen(false)}
        >
          <div style={{
            width: "100%", maxWidth: 540, borderRadius: 24,
            background: "linear-gradient(180deg, #0F1630 0%, #0A0E1F 100%)",
            border: `1px solid ${COPPER}20`,
            boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 80px ${COPPER}06, inset 0 1px 0 rgba(255,255,255,0.04)`,
            animation: "nl-modal-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            overflow: "hidden",
          }}>
            {/* Top accent glow bar */}
            <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${COPPER}, ${COPPER_LIGHT}, ${COPPER}, transparent)` }} />

            <div style={{ padding: "36px 40px 40px" }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "32px 0", animation: "nl-success-pop 0.4s ease" }}>
                {/* Success icon */}
                <div style={{
                  width: 72, height: 72, borderRadius: "50%", margin: "0 auto 24px",
                  background: `radial-gradient(circle, ${COPPER}15, transparent 70%)`,
                  border: `1.5px solid ${COPPER}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 40px ${COPPER}15`,
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={COPPER_LIGHT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Demo Request Received</h3>
                <p style={{ color: "#7B8DB5", lineHeight: 1.8, fontSize: 14, maxWidth: 380, margin: "0 auto" }}>
                  Our team will respond within 24 hours to discuss the <strong style={{ color: COPPER_LIGHT }}>{contactTier}</strong> package for your facility.
                </p>
                <button
                  onClick={() => { setContactOpen(false); setSent(false); }}
                  style={{
                    marginTop: 32, padding: "14px 44px", borderRadius: 14, cursor: "pointer",
                    background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`,
                    border: "none", color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "0.04em",
                    boxShadow: `0 8px 32px ${COPPER}35`,
                    transition: "all 0.2s ease",
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {/* Accent icon with glow */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: `linear-gradient(135deg, ${COPPER}20, ${COPPER}08)`,
                      border: `1px solid ${COPPER}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 4px 16px ${COPPER}12`,
                      flexShrink: 0,
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COPPER_LIGHT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COPPER, marginBottom: 4 }}>Request A Demo</div>
                      <h3 style={{ fontSize: 24, fontWeight: 800, color: "#F0F4FF", margin: 0, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>{contactTier}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setContactOpen(false)}
                    style={{
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10, cursor: "pointer", color: "#64748B", fontSize: 18,
                      width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s ease", flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#94A3B8" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#64748B" }}
                  >&#10005;</button>
                </div>

                {/* Sub text */}
                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, margin: "12px 0 24px", paddingLeft: 64 }}>
                  Fill in your details and our team will reach out within 24 hours.
                </p>

                {/* Divider */}
                <div style={{ height: 1, background: `linear-gradient(90deg, ${COPPER}20, rgba(255,255,255,0.04), transparent)`, marginBottom: 28 }} />

                <form onSubmit={submitContact} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <input
                      className="nl-input" placeholder="Full Name" required value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      style={modalInputStyle}
                    />
                    <input
                      className="nl-input" placeholder="Facility / Hospital" required value={form.facility}
                      onChange={e => setForm(f => ({ ...f, facility: e.target.value }))}
                      style={modalInputStyle}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <input
                      className="nl-input" type="email" placeholder="Email Address" required value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      style={modalInputStyle}
                    />
                    <input
                      className="nl-input" placeholder="Phone Number" value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      style={modalInputStyle}
                    />
                  </div>
                  <input
                    className="nl-input" placeholder="Approximate Number Of Beds (Optional)" value={form.beds}
                    onChange={e => setForm(f => ({ ...f, beds: e.target.value }))}
                    style={modalInputStyle}
                  />
                  <textarea
                    className="nl-input" rows={3} placeholder="Tell Us About Your Facility..."
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    style={{ ...modalInputStyle, resize: "none" }}
                  />
                  <button
                    className="nl-submit-btn" type="submit" disabled={sending}
                    style={{
                      width: "100%", padding: "16px 0", borderRadius: 14, cursor: "pointer",
                      background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`,
                      border: "none", color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: "0.04em",
                      opacity: sending ? 0.7 : 1, transition: "all 0.25s ease",
                      boxShadow: `0 8px 32px ${COPPER}30`,
                      marginTop: 4,
                    }}
                  >
                    {sending ? "Sending..." : "Request A Demo"}
                  </button>
                </form>
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Nav ─── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "14px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(184,115,51,0.08)", background: "rgba(3,5,15,0.4)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: 300, fontSize: 13, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>Dalxic</span>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ fontSize: 13, color: "#94A3B8", textDecoration: "none", padding: "6px 12px", borderRadius: 8 }}>Home</Link>
          <span style={{ fontSize: 13, color: "#475569", padding: "6px 12px", borderRadius: 8 }}>Platform</span>
          <button
            onClick={() => openContact("DalxicHealth")}
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "8px 18px", borderRadius: 10, cursor: "pointer",
              background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`,
              border: "none", color: "#fff",
            }}
          >
            Request Demo
          </button>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section style={{ paddingTop: 140, paddingBottom: 48, textAlign: "center", position: "relative", zIndex: 1 }}>
        <Reveal>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: COPPER, marginBottom: 16 }}>Pricing</div>
          <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 3.2rem)", fontWeight: 800, letterSpacing: -1.2, marginBottom: 16, lineHeight: 1.15 }}>
            Hospital Management,{" "}
            <span style={{ background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT}, ${BLUE})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Scaled To Your Size
            </span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: 14, maxWidth: 540, margin: "0 auto 12px", lineHeight: 1.7 }}>
            Every tier is request-based. Our team will assess your facility, recommend the right package, and onboard you personally.
          </p>
          <p style={{ color: "#64748B", fontSize: 12, maxWidth: 420, margin: "0 auto 0", lineHeight: 1.6 }}>
            Start small, scale infinitely. All data preserved when you upgrade.
          </p>
        </Reveal>
      </section>

      {/* ─── Tier Cards — 4 abreast ─── */}
      <section style={{ paddingBottom: 80, position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <style>{`
            @keyframes tierGlow { 0%,100%{box-shadow:0 0 30px rgba(14,165,233,0.08)} 50%{box-shadow:0 0 50px rgba(14,165,233,0.15)} }
            @media (max-width: 1100px) { .tier-grid { grid-template-columns: repeat(2, 1fr) !important; } }
            @media (max-width: 640px) { .tier-grid { grid-template-columns: 1fr !important; max-width: 400px !important; margin: 0 auto !important; } }
          `}</style>
          <div className="tier-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, alignItems: "start" }}>
            {TIERS.map((tier, i) => (
              <Reveal key={tier.id} delay={i * 0.1}>
                <div
                  style={{
                    borderRadius: 22, overflow: "hidden", position: "relative",
                    background: tier.bg,
                    border: `1px solid ${tier.border}`,
                    transform: tier.popular ? "scale(1.02)" : "scale(1)",
                    boxShadow: tier.popular ? `0 20px 60px rgba(14,165,233,0.1)` : "0 4px 24px rgba(0,0,0,0.25)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    ...(tier.popular ? { animation: "tierGlow 3s ease-in-out infinite" } : {}),
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = `0 24px 70px ${tier.accent}18`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = tier.popular ? "scale(1.02)" : "scale(1)"; e.currentTarget.style.boxShadow = tier.popular ? "0 20px 60px rgba(14,165,233,0.1)" : "0 4px 24px rgba(0,0,0,0.25)"; }}
                >
                  {/* Popular badge */}
                  {tier.popular && (
                    <div style={{
                      position: "absolute", top: 14, right: 14, background: tier.gradient,
                      padding: "3px 12px", borderRadius: 10, fontSize: 9, fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff",
                    }}>
                      Most Popular
                    </div>
                  )}
                  {tier.id === "T4" && (
                    <div style={{
                      position: "absolute", top: 14, right: 14, background: tier.gradient,
                      padding: "3px 12px", borderRadius: 10, fontSize: 9, fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff",
                    }}>
                      Full Access
                    </div>
                  )}

                  {/* Top accent bar */}
                  <div style={{ height: 3, background: tier.gradient }} />

                  <div style={{ padding: "28px 22px 24px" }}>
                    {/* Tier badge + name */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{
                        display: "inline-block", padding: "3px 10px", borderRadius: 6, marginBottom: 8,
                        background: `${tier.accent}12`, border: `1px solid ${tier.accent}25`,
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: tier.accent,
                      }}>
                        {tier.id}
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>{tier.name}</h3>
                      <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>{tier.subtitle}</p>
                    </div>

                    {/* Device + Bed limits */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 28, fontWeight: 800, color: tier.accent }}>{tier.maxDevices === 999 ? "Unlimited" : `Up To ${tier.maxDevices}`}</span>
                        <span style={{ fontSize: 12, color: "#64748B", marginLeft: 6 }}>devices</span>
                      </div>
                      <div style={{
                        display: "inline-block", padding: "3px 10px", borderRadius: 6,
                        background: tier.maxBeds === 0 ? "rgba(100,116,139,0.08)" : `${tier.accent}08`,
                        border: `1px solid ${tier.maxBeds === 0 ? "rgba(100,116,139,0.12)" : tier.accent + "15"}`,
                        fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
                        color: tier.maxBeds === 0 ? "#64748B" : tier.accent,
                      }}>
                        {tier.bedLabel}
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => openContact(`${tier.id} ${tier.name}`)}
                      style={{
                        width: "100%", padding: "12px 0", borderRadius: 12, cursor: "pointer",
                        fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", transition: "all 0.3s",
                        background: tier.popular ? tier.gradient : "transparent",
                        color: tier.popular ? "#fff" : tier.accent,
                        border: tier.popular ? "none" : `1.5px solid ${tier.accent}35`,
                        marginBottom: 20,
                      }}
                    >
                      Request A Demo
                    </button>

                    {/* Divider */}
                    <div style={{ height: 1, background: `${tier.accent}15`, margin: "0 0 16px" }} />

                    {/* Stations */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748B", marginBottom: 10 }}>Stations Included</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {tier.stations.map((s, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "center" }}>
                            <div style={{
                              width: 16, height: 16, borderRadius: 8, flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 9, fontWeight: 700,
                              background: `${tier.accent}15`, color: tier.accent,
                            }}>
                              {s.highlight ? "+" : "\u2713"}
                            </div>
                            <span style={{ fontSize: 12, color: s.highlight ? tier.accent : "#C8CCE0", fontWeight: s.highlight ? 600 : 400 }}>{s.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: `${tier.accent}10`, margin: "0 0 16px" }} />

                    {/* Features */}
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748B", marginBottom: 10 }}>Features & Capabilities</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {tier.features.map((feat, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "center" }}>
                            <div style={{
                              width: 16, height: 16, borderRadius: 8, flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 9, fontWeight: 700,
                              background: feat.on
                                ? (feat.highlight ? `${tier.accent}20` : `${tier.accent}12`)
                                : feat.addon ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.03)",
                              color: feat.on ? tier.accent : feat.addon ? "#92700C" : "#334155",
                            }}>
                              {feat.on ? (feat.highlight ? "+" : "\u2713") : feat.addon ? "$" : "\u2014"}
                            </div>
                            <span style={{
                              fontSize: 11, lineHeight: 1.4,
                              color: feat.on ? (feat.highlight ? tier.accent : "#A0AEC0") : feat.addon ? "#8B7355" : "#334155",
                              fontWeight: feat.highlight ? 600 : 400,
                              display: "flex", alignItems: "center", gap: 6,
                            }}>
                              {feat.text}
                              {feat.addon && (
                                <span style={{
                                  fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                                  padding: "1px 5px", borderRadius: 3,
                                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.12)",
                                  color: "#B8860B",
                                }}>
                                  Add-On
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Comparison Strip ─── */}
      <section style={{ paddingBottom: 80, position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: -0.8, marginBottom: 36, textAlign: "center" }}>
              What Every Tier{" "}
              <span style={{ background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Includes
              </span>
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div style={{
              borderRadius: 20, overflow: "hidden",
              background: "rgba(255,255,255,0.015)", border: "1px solid rgba(184,115,51,0.08)",
              backdropFilter: "blur(8px)",
            }}>
              {[
                { label: "Patient Registration & Queue", t1: true, t2: true, t3: true, t4: true },
                { label: "Doctor & Pharmacy & Lab", t1: true, t2: true, t3: true, t4: true },
                { label: "BillStream™ Billing", t1: "Manual", t2: "Auto-Capture", t3: "Auto-Capture", t4: "Auto-Capture" },
                { label: "PatientLink™ Notifications", t1: "Add-On", t2: "1,000/mo", t3: "2,000/mo", t4: "Unlimited" },
                { label: "StationGuard™ Access Control", t1: "Add-On", t2: true, t3: true, t4: true },
                { label: "AuditVault™ Action Logging", t1: "Add-On", t2: true, t3: true, t4: true },
                { label: "CallBoard™ Queue Display", t1: "Add-On", t2: true, t3: true, t4: true },
                { label: "SafeExit™ Discharge Verification", t1: "Add-On", t2: true, t3: true, t4: true },
                { label: "RedLine™ Emergency Protocol", t1: false, t2: true, t3: true, t4: true },
                { label: "CareChain™ Specialist Routing", t1: false, t2: true, t3: true, t4: true },
                { label: "Imaging (CT / Ultrasound)", t1: false, t2: "Add-On", t3: true, t4: true },
                { label: "Ward / Inpatient", t1: false, t2: "Add-On", t3: true, t4: true },
                { label: "ICU Module", t1: false, t2: false, t3: "Add-On", t4: true },
                { label: "Maternity Module", t1: false, t2: false, t3: "Add-On", t4: true },
                { label: "Blood Bank", t1: false, t2: false, t3: false, t4: true },
                { label: "Nexus-7™ Clinical Intelligence", t1: false, t2: false, t3: "Add-On", t4: true },
                { label: "Max Devices", t1: "6", t2: "15", t3: "35", t4: "999+" },
                { label: "Max Beds", t1: "0", t2: "20", t3: "100", t4: "Unlimited" },
              ].map((row, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1fr", alignItems: "center",
                  padding: "12px 24px",
                  borderBottom: i < 17 ? "1px solid rgba(255,255,255,0.03)" : "none",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#C8CCE0" }}>{row.label}</span>
                  {[row.t1, row.t2, row.t3, row.t4].map((val, j) => (
                    <span key={j} style={{ textAlign: "center", fontSize: 11, fontWeight: 600 }}>
                      {val === true ? (
                        <span style={{ color: TIERS[j].accent }}>{"\u2713"}</span>
                      ) : val === false ? (
                        <span style={{ color: "#334155" }}>{"\u2014"}</span>
                      ) : val === "Add-On" ? (
                        <span style={{
                          fontSize: 8, fontWeight: 700, letterSpacing: "0.06em",
                          padding: "2px 6px", borderRadius: 3,
                          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.12)",
                          color: "#B8860B",
                        }}>ADD-ON</span>
                      ) : (
                        <span style={{ color: TIERS[j].accent, fontSize: 10 }}>{val}</span>
                      )}
                    </span>
                  ))}
                </div>
              ))}
              {/* Column headers */}
              <div style={{
                display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1fr", alignItems: "center",
                padding: "14px 24px", borderTop: `1px solid ${COPPER}15`,
                background: "rgba(184,115,51,0.03)",
                position: "sticky", bottom: 0,
              }}>
                <span />
                {TIERS.map(t => (
                  <button key={t.id} onClick={() => openContact(`${t.id} ${t.name}`)} style={{
                    textAlign: "center", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: t.accent, background: "none", border: "none",
                    cursor: "pointer", padding: "6px 0",
                  }}>
                    {t.id} \u2014 Demo
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section style={{ paddingBottom: 100, position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: -0.8, marginBottom: 36, textAlign: "center" }}>
              Frequently Asked{" "}
              <span style={{ background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Questions
              </span>
            </h2>
          </Reveal>
          {FAQ.map((f, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div style={{ borderBottom: "1px solid rgba(184,115,51,0.08)", padding: "18px 0" }}>
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  style={{
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: 0, textAlign: "left",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#E2E8F0" }}>{f.q}</span>
                  <span style={{
                    color: COPPER, transition: "transform 0.3s",
                    transform: faqOpen === i ? "rotate(45deg)" : "none",
                    fontSize: 20, flexShrink: 0, marginLeft: 16,
                  }}>+</span>
                </button>
                {faqOpen === i && (
                  <p style={{
                    marginTop: 12, fontSize: 13, color: "#94A3B8", lineHeight: 1.75,
                    opacity: 1, transition: "opacity 0.3s",
                  }}>{f.a}</p>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── Footer CTA ──�� */}
      <section style={{ paddingBottom: 60, position: "relative", zIndex: 1 }}>
        <Reveal>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 800, marginBottom: 14 }}>
              Ready To Transform Your Hospital?
            </h2>
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
              Join hospitals across Africa already using DalxicHealth to digitise their operations.
            </p>
            <button
              onClick={() => openContact("DalxicHealth")}
              style={{
                padding: "14px 40px", borderRadius: 14, cursor: "pointer",
                fontSize: 14, fontWeight: 700, letterSpacing: "0.06em",
                background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`,
                border: "none", color: "#fff",
                boxShadow: `0 8px 32px ${COPPER}30`,
              }}
            >
              Request A Demo
            </button>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer style={{ padding: "24px 0 32px", borderTop: `1px solid ${COPPER}08`, textAlign: "center", position: "relative", zIndex: 1 }}>
        <span style={{ fontSize: 11, color: "#334155" }}>&copy; 2026 Dalxic &mdash; DalxicHealth</span>
      </footer>
    </div>
  );
}


/* ─── Modal input style (premium contact modal) ─── */
const modalInputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 18px", borderRadius: 12, fontSize: 14,
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(184,115,51,0.15)",
  color: "#E2E8F0", outline: "none",
  fontFamily: "var(--font-outfit), Outfit, system-ui, sans-serif",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};
