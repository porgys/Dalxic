"use client"
/* ═══════════════════════════════════════════════════════════════════════════
   FORENSIC REPORT — Keynote-Style On-Screen Analysis Report
   Premium infographic presentation. Each section = a keynote slide.
   ═══════════════════════════════════════════════════════════════════════════ */
import { useState, useEffect, useRef } from "react"
import { P, VIOLET } from "../../lib/tokens"
import ConfRing from "./ConfRing"

/* ── Color helpers ── */
const vCol = (v) => v === "AI_DETECTED" ? P.re : v === "NEEDS_REVIEW" ? P.amber : P.gr
const vLabel = (v) => v === "AI_DETECTED" ? "AI Detected" : v === "NEEDS_REVIEW" ? "Human Verification Needed" : "Authentic Content Verified"
const dimCol = (v) => v > 65 ? P.re : v > 45 ? P.amber : P.gr

/* ── Radial Gauge (mini donut for each dimension) ── */
function RadialGauge({ value, color, size = 72, strokeWidth = 6 }) {
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)", filter: `drop-shadow(0 0 8px ${color}50)` }} />
    </svg>
  )
}

/* ── Horizontal Bar (animated) ── */
function Bar({ value, color, delay = 0 }) {
  return (
    <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden", flex: 1 }}>
      <div style={{
        height: "100%", borderRadius: 3,
        background: `linear-gradient(90deg, ${color}, ${color}90)`,
        width: value + "%",
        animation: `barGrow 1s ease ${delay}s both`,
        boxShadow: `0 0 12px ${color}30`,
      }} />
    </div>
  )
}

/* ── Score Meter (vertical bar chart style) ── */
function ScoreMeter({ value, color, label, delay = 0 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 48 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}%</div>
      <div style={{ width: 32, height: 80, background: "rgba(255,255,255,0.03)", borderRadius: 16, position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: value + "%",
          background: `linear-gradient(to top, ${color}, ${color}60)`,
          borderRadius: 16,
          animation: `barGrow 1.2s ease ${delay}s both`,
          boxShadow: `0 0 16px ${color}30`,
        }} />
      </div>
      <div style={{ fontSize: 8, color: P.txD, textAlign: "center", lineHeight: 1.2, fontFamily: "'DM Mono', monospace", letterSpacing: "0.5px", textTransform: "uppercase", maxWidth: 60 }}>{label}</div>
    </div>
  )
}

/* ── Section Divider ── */
function SectionBreak({ label, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "48px 0 28px", animation: "fadeUp 0.6s ease both" }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase", color: VIOLET, fontFamily: "'DM Mono', monospace" }}>{label}</div>
        <div style={{ height: 1, background: `linear-gradient(90deg, ${VIOLET}30, transparent)`, marginTop: 8 }} />
      </div>
    </div>
  )
}

/* ── Glass Card wrapper ── */
function Glass({ children, style = {}, glow }) {
  return (
    <div style={{
      background: "rgba(8,12,28,0.75)",
      backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 20,
      padding: "32px 36px",
      position: "relative",
      overflow: "hidden",
      boxShadow: glow
        ? `0 8px 40px rgba(0,0,0,0.4), 0 0 60px ${glow}08, inset 0 1px 0 rgba(255,255,255,0.03)`
        : "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN FORENSIC REPORT COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function ForensicReport({ report, onClose, onExportPdf }) {
  if (!report) return null

  const col = vCol(report.verdict)
  const label = vLabel(report.verdict)
  const zone = report.verdict === "AI_DETECTED" ? "ai" : report.verdict === "NEEDS_REVIEW" ? "review" : "authentic"

  /* Sort dimensions by value descending for threat ranking */
  const sortedDims = [...(report.dimensions || [])].sort((a, b) => b.value - a.value)
  const topThreats = sortedDims.slice(0, 3)
  const avgDim = sortedDims.length > 0 ? Math.round(sortedDims.reduce((a, d) => a + d.value, 0) / sortedDims.length) : 0

  /* Threat classification */
  const threatLevel = report.confidence >= 90 ? "Critical" : report.confidence >= 75 ? "High" : report.confidence >= 50 ? "Moderate" : "Low"
  const threatLevelCol = report.confidence >= 90 ? P.re : report.confidence >= 75 ? "#F97316" : report.confidence >= 50 ? P.amber : P.gr

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(3,5,15,0.92)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      overflowY: "auto", overflowX: "hidden",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:none; } }
        @keyframes barGrow { from { width:0; height:0 } }
        @keyframes pulseGlow { 0%,100% { opacity:0.6 } 50% { opacity:1 } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-20px) } to { opacity:1; transform:none } }
        .report-scroll::-webkit-scrollbar { width: 4px }
        .report-scroll::-webkit-scrollbar-track { background: transparent }
        .report-scroll::-webkit-scrollbar-thumb { background: #1E2A4A; border-radius: 2px }
      `}</style>

      <div onClick={e => e.stopPropagation()} className="report-scroll" style={{
        width: "100%", maxWidth: 820, margin: "0 auto",
        padding: "60px 32px 80px",
        minHeight: "100vh",
      }}>

        {/* ─── TOP BAR: Close + Export ─── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, animation: "fadeUp 0.4s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, boxShadow: `0 0 12px ${col}80`, animation: "pulseGlow 2s ease infinite" }} />
            <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: P.txD, letterSpacing: "1.5px", textTransform: "uppercase" }}>ForensIQ Report</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {onExportPdf && (
              <button onClick={() => onExportPdf(report)} style={{ background: `linear-gradient(135deg, ${VIOLET}, #4F46E5)`, border: "none", borderRadius: 10, padding: "8px 20px", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform = ""}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export PDF
              </button>
            )}
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 18px", color: P.txM, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#ECF0FF" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = P.txM }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Close
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            SLIDE 1 — VERDICT HERO
            ═══════════════════════════════════════════════════ */}
        <Glass glow={col} style={{ marginBottom: 24, animation: "fadeUp 0.5s ease 0.05s both" }}>
          {/* Accent stripe */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${col}, ${col}60)` }} />
          {/* Background glow */}
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${col}12, transparent 70%)`, pointerEvents: "none" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 32 }}>
            {/* Left: Verdict + Meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Case metadata row */}
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 24 }}>
                {[
                  ["Case ID", report.id],
                  ["Date", report.date],
                  ["Media Type", report.type],
                  ["Module", (report.module || "ChromaVeil") + "\u2122"],
                  ["Engine", "Nexus-7"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 8, color: P.txD, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>{k}</div>
                    <div style={{ fontSize: 12, color: P.txM, fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Verdict text */}
              <div style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, color: col,
                fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-1px", lineHeight: 1.1, marginBottom: 8,
              }}>
                {label}
              </div>

              {/* Confidence subtitle */}
              <div style={{ fontSize: 14, color: P.txM, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
                {zone === "ai"
                  ? `${report.confidence}% AI Generation Probability`
                  : zone === "review"
                    ? `${report.confidence}% — Mixed Signals, Human Inspection Recommended`
                    : `${report.confidence}% Authenticity Confidence`}
              </div>

              {/* Title tag */}
              <div style={{ marginTop: 14, padding: "6px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 8, display: "inline-block", fontSize: 11, color: P.txM, fontFamily: "'DM Mono', monospace" }}>
                {report.title}
              </div>
            </div>

            {/* Right: Big confidence ring */}
            <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: -20, borderRadius: "50%", background: `radial-gradient(circle, ${col}15, transparent 70%)` }} />
              <ConfRing value={report.confidence} color={col} size={160} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 42, fontWeight: 800, color: col, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-2px", lineHeight: 1 }}>{report.confidence}%</div>
                <div style={{ fontSize: 9, color: P.txD, letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 600, marginTop: 4 }}>
                  {zone === "ai" ? "AI Probability" : zone === "review" ? "Under Review" : "Authentic"}
                </div>
              </div>
            </div>
          </div>

          {/* Review warning */}
          {zone === "review" && (
            <div style={{ marginTop: 24, padding: "14px 18px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 12, fontSize: 12, color: P.amber, fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.amber} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Mixed Signals Detected. Human Verification By A Qualified Analyst Is Recommended Before Drawing Conclusions.
            </div>
          )}
        </Glass>

        {/* ═══════════════════════════════════════════════════
            SLIDE 2 — THREAT CLASSIFICATION STRIP
            ═══════════════════════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24, animation: "fadeUp 0.5s ease 0.15s both" }}>
          {[
            { label: "Threat Level", value: threatLevel, color: threatLevelCol },
            { label: "Overall Score", value: (report.overall || avgDim) + "%", color: dimCol(report.overall || avgDim) },
            { label: "Dimensions Flagged", value: sortedDims.filter(d => d.value > 65).length + "/" + sortedDims.length, color: VIOLET },
            { label: "Analysis Engine", value: "Nexus-7", color: P.txM },
          ].map((s, i) => (
            <Glass key={i} style={{ padding: "20px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: P.txD, letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{s.label}</div>
            </Glass>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════
            SLIDE 3 — FORENSIC DIMENSIONS (Radial Gauges)
            ═══════════════════════════════════════════════════ */}
        {sortedDims.length > 0 && (
          <>
            <SectionBreak label="Forensic Dimension Analysis" icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={VIOLET} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            } />

            <Glass style={{ marginBottom: 24, animation: "fadeUp 0.5s ease 0.25s both" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${VIOLET}, ${VIOLET}40)` }} />

              {/* Dimension cards grid — each with radial gauge */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
                {sortedDims.map((d, i) => {
                  const dc = dimCol(d.value)
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 16,
                      padding: "16px 20px",
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${dc}15`,
                      borderRadius: 14,
                      animation: `slideIn 0.5s ease ${0.3 + i * 0.06}s both`,
                    }}>
                      {/* Mini radial gauge */}
                      <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
                        <RadialGauge value={d.value} color={dc} size={56} strokeWidth={5} />
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: dc, fontFamily: "'Space Grotesk', sans-serif" }}>{d.value}</span>
                        </div>
                      </div>

                      {/* Label + bar */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: P.tx, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>{d.dimension}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Bar value={d.value} color={dc} delay={0.3 + i * 0.06} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: dc, fontFamily: "'DM Mono', monospace", minWidth: 36, textAlign: "right" }}>{d.value}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Overall score footer */}
              {(report.overall !== undefined || avgDim > 0) && (
                <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 11, color: P.txD, fontFamily: "'DM Mono', monospace", letterSpacing: "1.5px", textTransform: "uppercase" }}>Composite Score</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: dimCol(report.overall || avgDim), fontFamily: "'Space Grotesk', sans-serif" }}>{report.overall || avgDim}%</span>
                </div>
              )}
            </Glass>
          </>
        )}

        {/* ═══════════════════════════════════════════════════
            SLIDE 4 — TOP THREAT INDICATORS (Score Meters)
            ═══════════════════════════════════════════════════ */}
        {topThreats.length > 0 && (
          <>
            <SectionBreak label="Primary Indicators" icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={P.re} strokeWidth="1.5" strokeLinecap="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            } />

            <Glass style={{ marginBottom: 24, animation: "fadeUp 0.5s ease 0.35s both" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: zone === "ai" ? `linear-gradient(90deg, ${P.re}, ${P.re}40)` : `linear-gradient(90deg, ${P.gr}, ${P.gr}40)` }} />

              <div style={{ display: "flex", justifyContent: "center", gap: 40, padding: "12px 0" }}>
                {topThreats.map((d, i) => (
                  <ScoreMeter key={i} value={d.value} color={dimCol(d.value)} label={d.dimension} delay={0.4 + i * 0.1} />
                ))}
              </div>

              <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: P.txD, fontFamily: "'DM Mono', monospace" }}>
                {zone === "ai"
                  ? "Highest-Scoring Forensic Indicators — Strongest Evidence Of Synthetic Origin"
                  : zone === "review"
                    ? "Elevated Indicators Requiring Human Verification"
                    : "All Indicators Within Authentic Range — No Synthetic Markers Detected"}
              </div>
            </Glass>
          </>
        )}

        {/* ═══════════════════════════════════════════════════
            SLIDE 5 — DIMENSION COMPARISON MATRIX
            ═══════════════════════════════════════════════════ */}
        {sortedDims.length >= 4 && (
          <>
            <SectionBreak label="Dimension Comparison Matrix" icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={VIOLET} strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>
            } />

            <Glass style={{ marginBottom: 24, animation: "fadeUp 0.5s ease 0.45s both" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${VIOLET}, #22D3EE40)` }} />

              {/* Visual bar comparison — all dimensions ranked */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {sortedDims.map((d, i) => {
                  const dc = dimCol(d.value)
                  const isTop = i < 3
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, animation: `slideIn 0.4s ease ${0.5 + i * 0.05}s both` }}>
                      {/* Rank badge */}
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        background: isTop ? `${dc}15` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isTop ? dc + "30" : "rgba(255,255,255,0.04)"}`,
                        fontSize: 11, fontWeight: 700, color: isTop ? dc : P.txD, fontFamily: "'DM Mono', monospace",
                      }}>
                        {i + 1}
                      </div>

                      {/* Label */}
                      <div style={{ width: 140, fontSize: 11, color: isTop ? P.tx : P.txM, fontFamily: "'DM Sans', sans-serif", fontWeight: isTop ? 600 : 400 }}>{d.dimension}</div>

                      {/* Full-width bar */}
                      <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.03)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 4,
                          background: `linear-gradient(90deg, ${dc}, ${dc}70)`,
                          width: d.value + "%",
                          animation: `barGrow 1s ease ${0.5 + i * 0.05}s both`,
                          boxShadow: isTop ? `0 0 16px ${dc}25` : "none",
                        }} />
                      </div>

                      {/* Score */}
                      <div style={{ minWidth: 42, textAlign: "right", fontSize: 13, fontWeight: 800, color: dc, fontFamily: "'Space Grotesk', sans-serif" }}>{d.value}%</div>
                    </div>
                  )
                })}
              </div>
            </Glass>
          </>
        )}

        {/* ═══════════════════════════════════════════════════
            SLIDE 6 — FORENSIC ASSESSMENT
            ═══════════════════════════════════════════════════ */}
        {report.reasoning && (
          <>
            <SectionBreak label="Forensic Assessment" icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            } />

            <Glass glow={col} style={{ marginBottom: 24, animation: "fadeUp 0.5s ease 0.55s both" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${col}, ${col}40)` }} />

              <p style={{
                fontSize: 14, color: P.tx, lineHeight: 2,
                fontFamily: "'DM Sans', sans-serif", fontWeight: 400, opacity: 0.92,
                letterSpacing: "0.2px",
              }}>
                {report.reasoning}
              </p>
            </Glass>
          </>
        )}

        {/* ═══════════════════════════════════════════════════
            SLIDE 7 — CERTIFICATION FOOTER
            ═══════════════════════════════════════════════════ */}
        <Glass style={{ padding: "24px 32px", animation: "fadeUp 0.5s ease 0.65s both", marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.5px", marginBottom: 4 }}>
                <span style={{ background: "linear-gradient(135deg, #818CF8, #A78BFA, #22D3EE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DalxicForensics</span>
              </div>
              <div style={{ fontSize: 10, color: P.txD, fontFamily: "'DM Mono', monospace", letterSpacing: "1px" }}>ForensIQ Certified Analysis Report</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: P.txD, fontFamily: "'DM Mono', monospace", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>Powered By</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", background: "linear-gradient(135deg, #818CF8, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Nexus-7 Engine</div>
            </div>
          </div>
        </Glass>

      </div>
    </div>
  )
}
