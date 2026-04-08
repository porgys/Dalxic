"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useScanStore } from "../../lib/scanStore"
import PlatformHeader from "../components/PlatformHeader"
import { P, VIOLET } from "../../lib/tokens"
import AmbientBg from "../components/AmbientBg"
import ConfRing from "../components/ConfRing"

const SAMPLE_REPORTS = [
  {
    id:"RPT-20260407-001",
    title:"AI-Generated Text — LLM Hedging Pattern Analysis",
    verdict:"AI_DETECTED",
    confidence:97,
    date:"2026-04-07",
    type:"Text",
    module:"NarrativeGuard",
    dimensions:[
      {dimension:"Perplexity Analysis",value:95},{dimension:"Burstiness Pattern",value:98},
      {dimension:"Vocabulary Distribution",value:82},{dimension:"Sentence Uniformity",value:96},
      {dimension:"Stylistic Consistency",value:90},{dimension:"Cliche Density",value:94},
      {dimension:"Hedging Language",value:97},{dimension:"Semantic Predictability",value:95},
    ],
    overall:93,
    reasoning:"Burstiness 0.180 critically below human threshold (0.50-1.00+). Seven LLM hedging phrases detected at 0.875 per sentence density. Opener diversity 0.375 confirms formulaic AI structure with repeated transitional adverbs."
  },
  {
    id:"RPT-20260407-002",
    title:"Bank of England Rate Decision — BBC News Verification",
    verdict:"AUTHENTIC",
    confidence:99,
    date:"2026-04-07",
    type:"News",
    module:"NarrativeGuard",
    dimensions:[
      {dimension:"Source Credibility",value:12},{dimension:"Factual Accuracy",value:18},
      {dimension:"Emotional Manipulation",value:8},{dimension:"Headline Consistency",value:15},
      {dimension:"Citation Quality",value:14},{dimension:"Narrative Bias",value:10},
      {dimension:"AI Generation Markers",value:22},{dimension:"Logical Coherence",value:12},
    ],
    overall:14,
    reasoning:"7 source specificity hits — named individuals (Bailey, Dhingra, Ramsden), precise figures (4.5%, 3.2%, $1.2847), institutional references. Zero hedging phrases, zero transition word excess. Composite: authentic journalism."
  },
  {
    id:"RPT-20260401-003",
    title:"Election Video Verification — Clip #47",
    verdict:"AI_DETECTED",
    confidence:87,
    date:"2026-04-01",
    type:"Video",
    module:"KineticScan",
    dimensions:[
      {dimension:"Temporal Consistency",value:82},{dimension:"Facial Landmark Drift",value:91},
      {dimension:"Audio-Visual Sync",value:78},{dimension:"Compression Artifacts",value:85},
      {dimension:"Motion Blur Analysis",value:74},{dimension:"Lip Sync Accuracy",value:89},
      {dimension:"Frame Interpolation",value:80},{dimension:"Blink Pattern",value:93},
    ],
    overall:84,
    reasoning:"Facial landmark drift at 91% indicates significant synthetic manipulation. Blink pattern irregularity confirms non-human timing. Audio-visual desynchronisation detected at 78% threshold. Composite score decisively above AI detection boundary."
  },
  {
    id:"RPT-20260328-004",
    title:"Presidential Address — Full Broadcast",
    verdict:"AUTHENTIC",
    confidence:92,
    date:"2026-03-28",
    type:"Video",
    module:"KineticScan",
    dimensions:[
      {dimension:"Temporal Consistency",value:8},{dimension:"Facial Landmark Drift",value:12},
      {dimension:"Audio-Visual Sync",value:6},{dimension:"Compression Artifacts",value:15},
      {dimension:"Motion Blur Analysis",value:10},{dimension:"Lip Sync Accuracy",value:9},
      {dimension:"Frame Interpolation",value:14},{dimension:"Blink Pattern",value:7},
    ],
    overall:10,
    reasoning:"All forensic dimensions well below detection thresholds. Natural blink patterns, consistent facial landmarks, and precise audio-visual synchronisation confirm authentic broadcast footage from verified institutional source."
  },
  {
    id:"RPT-20260320-005",
    title:"Court Evidence Image — Exhibit 12A",
    verdict:"AI_DETECTED",
    confidence:78,
    date:"2026-03-20",
    type:"Image",
    module:"ChromaVeil",
    dimensions:[
      {dimension:"Pixel Noise",value:72},{dimension:"Edge Density",value:68},
      {dimension:"Luminance StdDev",value:75},{dimension:"Histogram Bucket Duplicates",value:80},
      {dimension:"Colour Histogram Distribution",value:65},{dimension:"Aspect Ratio",value:58},
      {dimension:"Image Dimensions",value:70},{dimension:"Luminance Mean",value:63},
    ],
    overall:69,
    reasoning:"Histogram bucket duplication at 80% exceeds natural photographic range. Pixel noise pattern consistent with generative model output. Edge density and luminance deviation suggest synthetic origin with moderate confidence."
  },
  {
    id:"RPT-20260310-006",
    title:"Audio Witness Statement — Case #441",
    verdict:"AUTHENTIC",
    confidence:88,
    date:"2026-03-10",
    type:"Audio",
    module:"SonicTrace",
    dimensions:[
      {dimension:"Spectral Consistency",value:10},{dimension:"Formant Analysis",value:14},
      {dimension:"Background Noise Pattern",value:8},{dimension:"Pitch Variation",value:12},
      {dimension:"Breathing Pattern",value:6},{dimension:"Micro-Expression Timing",value:11},
      {dimension:"Compression Signature",value:15},{dimension:"Voice Print Match",value:9},
    ],
    overall:11,
    reasoning:"Natural breathing patterns and organic pitch variation throughout. Formant structure consistent with biological vocal tract. No spectral anomalies or synthesis artefacts detected. Compression signature matches standard recording device output."
  },
]

/* ── Header + AmbientBg (shared master components) ── */
const Header = PlatformHeader

/* ── Report Detail Modal (replicates workstation result view) ── */
function ReportModal({ report, onClose, router }) {
  if (!report) return null
  const zone = report.verdict === "AI_DETECTED" ? "ai" : report.verdict === "NEEDS_REVIEW" ? "review" : "authentic"
  const col = zone === "ai" ? P.re : zone === "review" ? P.amber : P.gr
  const bgTint = zone === "ai" ? "rgba(239,68,68,0.04)" : zone === "review" ? "rgba(245,158,11,0.04)" : "rgba(16,185,129,0.04)"
  const borderTint = zone === "ai" ? "rgba(239,68,68,0.2)" : zone === "review" ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"
  const verdictText = zone === "ai" ? "AI Detected" : zone === "review" ? "Human Verification Needed" : "Authentic Content Verified"
  const subText = zone === "ai" ? report.confidence + "% AI Probability" : zone === "review" ? report.confidence + "% — Mixed signals, human inspection recommended" : report.confidence + "% Authenticity Confidence"

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:9999, background:"rgba(3,5,15,0.88)",
      backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", transform:"translateZ(0)", willChange:"transform",
      display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"80px 24px 40px",
      overflowY:"auto",
    }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:720, animation:"fadeUp 0.4s ease" }}>

        {/* Close button */}
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(99,102,241,0.15)", borderRadius:10, padding:"8px 18px", color:P.txM, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans', sans-serif", transition:"all 0.2s", display:"flex", alignItems:"center", gap:6 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.color = "#ECF0FF" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)"; e.currentTarget.style.color = P.txM }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Close
          </button>
        </div>

        {/* VERDICT CARD */}
        <div style={{
          background: bgTint, border: "1px solid " + borderTint,
          borderRadius: 16, padding: "32px 36px", marginBottom: 20, position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: col }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
                {[
                  ["Case ID", report.id],
                  ["Timestamp", report.date],
                  ["Media", report.type],
                  ["Engine", "Nexus-7"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 9, color: P.txD, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 3, fontFamily: "'DM Mono', monospace" }}>{k}</div>
                    <div style={{ fontSize: 11, color: P.txM, fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: col, marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.5px" }}>
                {verdictText}
              </div>
              <div style={{ fontSize: 13, color: P.txM, fontWeight: 500 }}>
                {subText}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                <div style={{ fontSize: 11, color: P.txD, fontFamily: "'DM Mono', monospace", padding: "4px 10px", background: "rgba(0,0,0,0.2)", borderRadius: 6 }}>{report.title}</div>
                <button onClick={() => router.push("/workstation")} style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid " + P.border, background: "transparent", color: P.txM, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = VIOLET; e.currentTarget.style.color = "#ECF0FF" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.txM }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
                  New Analysis
                </button>
                <button style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid " + col + "40", background: col + "12", color: col, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = col + "25"; e.currentTarget.style.borderColor = col }}
                  onMouseLeave={e => { e.currentTarget.style.background = col + "12"; e.currentTarget.style.borderColor = col + "40" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Export PDF
                </button>
              </div>
            </div>

            {/* Confidence ring */}
            <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: -10, borderRadius: "50%", background: "radial-gradient(circle, " + col + "10, transparent 70%)" }} />
              <ConfRing value={report.confidence} color={col} size={130} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: col, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-1px" }}>{report.confidence}%</div>
                <div style={{ fontSize: 8, color: P.txD, letterSpacing: "1.2px", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                  {zone === "ai" ? "AI Prob" : zone === "review" ? "Review" : "Authentic"}
                </div>
              </div>
            </div>
          </div>

          {zone === "review" && (
            <div style={{ marginTop: 20, padding: "14px 18px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 10, fontSize: 12, color: P.amber, fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.amber} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Mixed signals detected. Human verification by a qualified analyst is recommended before drawing conclusions.
            </div>
          )}
        </div>

        {/* DIMENSIONS CARD */}
        {report.dimensions && report.dimensions.length > 0 && (
          <div style={{ padding: "28px 30px", marginBottom: 20, borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid " + VIOLET + "15", boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", transform: "translateZ(0)", willChange: "transform", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: VIOLET }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: P.txD, letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Forensic Dimensions</div>
              {report.overall !== undefined && <div style={{ fontSize: 10, color: P.txD, fontFamily: "'DM Mono', monospace" }}>Overall: <span style={{ color: col, fontWeight: 700 }}>{report.overall}%</span></div>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 40px" }}>
              {report.dimensions.map((d, i) => {
                const dc = d.value > 65 ? P.re : d.value > 45 ? P.amber : P.gr
                return (
                  <div key={i} style={{ animation: "fadeUp 0.4s ease " + (i * 0.06) + "s both" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: P.txM, fontFamily: "'DM Mono', monospace" }}>{d.dimension}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: dc, fontFamily: "'DM Mono', monospace", padding: "2px 8px", background: dc + "10", borderRadius: 4 }}>{d.value}%</span>
                    </div>
                    <div style={{ height: 5, background: P.border, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 3,
                        background: "linear-gradient(90deg, " + dc + ", " + dc + "90)",
                        width: d.value + "%",
                        animation: "barGrow 0.8s ease " + (i * 0.06) + "s both",
                        boxShadow: "0 0 8px " + dc + "30"
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ASSESSMENT CARD */}
        {report.reasoning && (
          <div style={{ padding: "28px 30px", marginBottom: 20, borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid " + col + "20", boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", transform: "translateZ(0)", willChange: "transform", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: col }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <div style={{ fontSize: 10, fontWeight: 600, color: P.txD, letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Forensic Assessment</div>
            </div>
            <p style={{ fontSize: 13, color: P.tx, lineHeight: 1.9, fontFamily: "'DM Mono', monospace", opacity: 0.9 }}>{report.reasoning}</p>
          </div>
        )}

      </div>
    </div>
  )
}

export default function ReportsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState("all")
  const [activeReport, setActiveReport] = useState(null)
  const scans = useScanStore(s => s.scans)
  const clearScans = useScanStore(s => s.clearScans)

  useEffect(() => {
    const cleared = sessionStorage.getItem("dalxic-cache-cleared-v1")
    if (!cleared && scans.length > 0) {
      const oldest = scans[scans.length - 1]?.timestamp
      if (oldest && new Date(oldest) < new Date("2026-04-07")) {
        clearScans()
        sessionStorage.setItem("dalxic-cache-cleared-v1", "1")
      }
    }
  }, [])

  // Close modal on Escape
  useEffect(() => {
    const handleKey = e => { if (e.key === "Escape") setActiveReport(null) }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  const realReports = scans.map((s, i) => ({
    id: s.id || ("scan_" + i),
    title: s.filename || "Untitled Scan",
    verdict: s.verdict === "AUTHENTIC" ? "AUTHENTIC" : s.verdict === "NEEDS_REVIEW" ? "NEEDS_REVIEW" : "AI_DETECTED",
    confidence: s.displayConfidence || s.confidence || 0,
    date: s.timestamp ? new Date(s.timestamp).toISOString().slice(0,10) : "Unknown",
    type: (s.mediaType || "unknown").charAt(0).toUpperCase() + (s.mediaType || "unknown").slice(1),
    module: s.module || "ChromaVeil",
    dimensions: s.dimensions || [],
    overall: s.overall,
    reasoning: s.reasoning,
  }))
  const allReports = [...realReports, ...SAMPLE_REPORTS]
  const filtered = filter === "all" ? allReports : allReports.filter(r => r.verdict === filter)

  const totalCount = allReports.length
  const aiCount = allReports.filter(r => r.verdict === "AI_DETECTED").length
  const reviewCount = allReports.filter(r => r.verdict === "NEEDS_REVIEW").length
  const authCount = allReports.filter(r => r.verdict === "AUTHENTIC").length
  const avgConf = allReports.length > 0 ? Math.round(allReports.reduce((a, r) => a + r.confidence, 0) / allReports.length) : 0

  const globalCSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #1E2A4A; border-radius: 2px; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:none; } }
    @keyframes barGrow { from { width: 0 } }
  `

  return (
    <div style={{ minHeight:"100vh", background:P.bg, fontFamily:"'DM Sans', sans-serif", color:P.tx }}>
      <style>{globalCSS}</style>
      <AmbientBg />
      <Header />

      <div style={{ position:"relative", zIndex:1, maxWidth:960, margin:"0 auto", minHeight:"100vh", padding:"100px 44px 60px" }}>

        {/* Nav Menus */}
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:12, marginBottom:32, animation:"fadeUp 0.5s ease 0.05s both" }}>
          <a href="/workstation" style={{ textDecoration:"none", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 20px", minWidth:160, borderRadius:12, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", color:"#818CF8", fontSize:13, fontWeight:500, letterSpacing:"0.3px", fontFamily:"'DM Sans', sans-serif", transition:"all 0.25s ease", cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.transform = "translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; e.currentTarget.style.transform = "" }}>
            <span style={{ fontSize:15 }}>📈</span>
            Workstation
          </a>
          <a href="/reports" style={{ textDecoration:"none", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 20px", minWidth:160, borderRadius:12, background:"linear-gradient(135deg, #6366F1, #7C3AED)", border:"1px solid rgba(124,58,237,0.5)", color:"#fff", fontSize:13, fontWeight:600, letterSpacing:"0.3px", fontFamily:"'DM Sans', sans-serif", cursor:"default", boxShadow:"0 4px 20px rgba(99,102,241,0.3)" }}>
            <span style={{ fontSize:15 }}>🗂️</span>
            Reports
          </a>
          <a href="/chat" style={{ textDecoration:"none", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 20px", minWidth:160, borderRadius:12, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", color:"#818CF8", fontSize:13, fontWeight:500, letterSpacing:"0.3px", fontFamily:"'DM Sans', sans-serif", transition:"all 0.25s ease", cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.transform = "translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; e.currentTarget.style.transform = "" }}>
            <span style={{ fontSize:15 }}>💬</span>
            DalxicChat
          </a>
        </div>

        {/* Hero */}
        <div style={{ textAlign:"center", marginBottom:40, animation:"fadeUp 0.6s ease 0.1s both" }}>
          <div style={{ fontSize:12, fontWeight:600, letterSpacing:"3px", textTransform:"uppercase", color:VIOLET, fontFamily:"'DM Sans', sans-serif", marginBottom:14 }}>ForensIQ™ Analysis</div>
          <h1 style={{ fontSize:"clamp(2.2rem, 5vw, 3.6rem)", fontWeight:800, letterSpacing:-2, lineHeight:1.1, marginBottom:6, fontFamily:"'Space Grotesk', sans-serif" }}>
            Forensic <span style={{ background:"linear-gradient(135deg, #818CF8, #A78BFA, #22D3EE)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Reports</span>
          </h1>
        </div>

        {/* Filter Tabs */}
        <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:24, animation:"fadeUp 0.6s ease 0.2s both" }}>
          {[
            { label:"All", value:"all" },
            { label:"AI Detected", value:"AI_DETECTED" },
            { label:"Needs Review", value:"NEEDS_REVIEW" },
            { label:"Authentic", value:"AUTHENTIC" },
          ].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} style={{
              padding:"10px 22px", borderRadius:10, fontSize:13, fontWeight:500, cursor:"pointer",
              background: filter === f.value ? "linear-gradient(135deg, #6366F1, #4F46E5)" : "rgba(255,255,255,0.025)",
              color: filter === f.value ? "#fff" : P.txM,
              border: filter === f.value ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(99,102,241,0.1)",
              fontFamily:"'DM Sans', sans-serif",
              transition:"all 0.25s ease",
            }}>{f.label}</button>
          ))}
        </div>

        {/* Stats Sidebar (fixed right edge) */}
        <div style={{ position:"fixed", top:100, right:24, zIndex:10, display:"flex", flexDirection:"column", gap:10, animation:"fadeUp 0.6s ease 0.2s both" }}>
          {[
            { label:"Total Reports", value:totalCount, color:P.accent },
            { label:"AI Detected", value:aiCount, color:P.re },
            { label:"Needs Review", value:reviewCount, color:P.amber },
            { label:"Authentic", value:authCount, color:P.gr },
          ].map(s => (
            <div key={s.label} style={{ background:"rgba(8,12,28,0.7)", border:"1px solid rgba(99,102,241,0.1)", borderRadius:14, padding:"18px 18px", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", transform:"translateZ(0)", willChange:"transform", width:140 }}>
              <div style={{ fontSize:26, fontWeight:800, color:s.color, fontFamily:"'DM Mono', monospace", marginBottom:3, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11, color:P.txM, fontFamily:"'DM Sans', sans-serif", lineHeight:1.3 }}>{s.label}</div>
            </div>
          ))}
          <div style={{ background:"rgba(8,12,28,0.7)", border:"1px solid rgba(99,102,241,0.1)", borderRadius:14, padding:"18px 18px", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", transform:"translateZ(0)", willChange:"transform", width:140, marginTop:2 }}>
            <div style={{ fontSize:26, fontWeight:800, color:VIOLET, fontFamily:"'DM Mono', monospace", marginBottom:3, lineHeight:1 }}>{avgConf}%</div>
            <div style={{ fontSize:11, color:P.txM, fontFamily:"'DM Sans', sans-serif", lineHeight:1.3 }}>Avg Confidence</div>
          </div>
        </div>

        {/* Report Cards Grid */}
        <div style={{ animation:"fadeUp 0.6s ease 0.3s both" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"80px 0", color:P.txM }}>
                <div style={{ fontSize:48, marginBottom:16, opacity:0.4 }}>📋</div>
                <div style={{ fontWeight:600, marginBottom:8, fontFamily:"'DM Sans', sans-serif" }}>No Reports Match This Filter</div>
                <div style={{ fontSize:13 }}>Try selecting a different filter above.</div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:14 }}>
                {filtered.map((r, i) => {
                  const verdictColor = r.verdict === "AI_DETECTED" ? P.re : r.verdict === "NEEDS_REVIEW" ? P.amber : P.gr
                  const verdictLabel = r.verdict === "AI_DETECTED" ? "AI Detected" : r.verdict === "NEEDS_REVIEW" ? "Needs Review" : "Authentic"
                  const verdictBg = r.verdict === "AI_DETECTED" ? "rgba(239,68,68,0.08)" : r.verdict === "NEEDS_REVIEW" ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)"
                  return (
                    <div key={r.id + i} onClick={() => setActiveReport(r)} style={{
                      background:"rgba(8,12,28,0.7)", border:"1px solid rgba(99,102,241,0.1)", borderRadius:16,
                      padding:"28px 22px", display:"flex", flexDirection:"column", minHeight:400,
                      backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", transform:"translateZ(0)", willChange:"transform", transition:"all 0.25s ease", cursor:"pointer",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1)"; e.currentTarget.style.transform = "translateY(-2px)" }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.1)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "" }}>

                      {/* Verdict badge + type */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                        <span style={{ padding:"4px 12px", borderRadius:8, fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", background:verdictBg, color:verdictColor, border:"1px solid " + verdictColor + "22" }}>{verdictLabel}</span>
                        <span style={{ fontSize:11, color:P.txD, fontFamily:"'DM Mono', monospace", letterSpacing:0.5 }}>{r.type}</span>
                      </div>

                      {/* Icon + confidence */}
                      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
                        <div style={{ width:52, height:52, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, background:verdictBg, border:"1px solid " + verdictColor + "33" }}>
                          {r.verdict === "AI_DETECTED" ? (
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={P.re} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><circle cx="9" cy="13" r="1.25" fill={P.re}/><circle cx="15" cy="13" r="1.25" fill={P.re}/><path d="M9 17h6"/></svg>
                          ) : r.verdict === "NEEDS_REVIEW" ? (
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={P.amber} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                          ) : (
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={P.gr} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize:28, fontWeight:800, fontFamily:"'DM Mono', monospace", color:verdictColor, lineHeight:1 }}>{r.confidence}%</div>
                          <div style={{ fontSize:10, color:P.txD, marginTop:2 }}>Confidence</div>
                        </div>
                      </div>

                      {/* Title */}
                      <div style={{ fontWeight:700, fontSize:14, lineHeight:1.4, marginBottom:8, fontFamily:"'DM Sans', sans-serif", color:P.tx }}>{r.title}</div>

                      {/* Meta */}
                      <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"center", marginBottom:6 }}>
                        <span style={{ fontFamily:"'DM Mono', monospace", color:P.txD, fontSize:10 }}>{r.id}</span>
                        {r.module && <span style={{ color:VIOLET, fontSize:10, fontWeight:600, fontFamily:"'DM Mono', monospace" }}>{r.module}™</span>}
                      </div>
                      <div style={{ fontSize:11, color:P.txM, marginBottom:4 }}>{r.date}</div>

                      <div style={{ flex:1 }} />

                      {/* View Report button */}
                      <div style={{ marginTop:16 }}>
                        <div style={{ padding:"10px 0", borderRadius:10, fontSize:12, fontWeight:600, textAlign:"center", background:"linear-gradient(135deg, #6366F1, #4F46E5)", color:"#fff", fontFamily:"'DM Sans', sans-serif", transition:"all 0.25s ease", letterSpacing:0.3 }}>
                          View Report
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </div>
      </div>

      {/* Report Modal Overlay */}
      {activeReport && <ReportModal report={activeReport} onClose={() => setActiveReport(null)} router={router} />}
    </div>
  )
}
