"use client"
import { useState, useRef, useEffect } from "react"
import { useScanStore, classifyIntent, getCachedResponse } from "../../lib/scanStore"
import PlatformHeader from "../components/PlatformHeader"
import { P, VIOLET } from "../../lib/tokens"
import AmbientBg from "../components/AmbientBg"

const INITIAL = [
  { role:"assistant", content:"Welcome to **Nexus-7 Chat** — your forensic intelligence assistant.\n\nI can help you:\n\n- Interpret scan results and confidence scores\n- Explain forensic dimensions and detection methodology\n- Guide evidence documentation workflows\n- Analyse detection patterns across your case files\n\nHow can I assist your investigation?" }
]

/* ── Safe text formatter ── */
function FormatText({ text }) {
  const lines = text.split("\n")
  return lines.map((line, li) => {
    if (line.trim() === "") return <br key={li} />
    const parts = []
    let remaining = line
    let ki = 0
    while (remaining.length > 0) {
      const boldStart = remaining.indexOf("**")
      if (boldStart === -1) { if (remaining) parts.push(<span key={ki++}>{remaining}</span>); break }
      if (boldStart > 0) parts.push(<span key={ki++}>{remaining.slice(0, boldStart)}</span>)
      const boldEnd = remaining.indexOf("**", boldStart + 2)
      if (boldEnd === -1) { parts.push(<span key={ki++}>{remaining.slice(boldStart)}</span>); break }
      parts.push(<strong key={ki++} style={{ color:P.tx, fontWeight:700 }}>{remaining.slice(boldStart + 2, boldEnd)}</strong>)
      remaining = remaining.slice(boldEnd + 2)
    }
    const trimmed = line.trimStart()
    const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")
    if (isBullet) {
      const bulletText = trimmed.slice(2)
      const bParts = []
      let bRemaining = bulletText
      let bk = 0
      while (bRemaining.length > 0) {
        const bs = bRemaining.indexOf("**")
        if (bs === -1) { if (bRemaining) bParts.push(<span key={bk++}>{bRemaining}</span>); break }
        if (bs > 0) bParts.push(<span key={bk++}>{bRemaining.slice(0, bs)}</span>)
        const be = bRemaining.indexOf("**", bs + 2)
        if (be === -1) { bParts.push(<span key={bk++}>{bRemaining.slice(bs)}</span>); break }
        bParts.push(<strong key={bk++} style={{ color:P.tx, fontWeight:700 }}>{bRemaining.slice(bs + 2, be)}</strong>)
        bRemaining = bRemaining.slice(be + 2)
      }
      return (
        <div key={li} style={{ display:"flex", gap:10, alignItems:"flex-start", marginTop:li > 0 ? 6 : 0 }}>
          <span style={{ color:P.violet, fontSize:8, marginTop:7, flexShrink:0 }}>&#9679;</span>
          <span>{bParts}</span>
        </div>
      )
    }
    return <div key={li} style={{ marginTop: li > 0 && lines[li-1]?.trim() !== "" ? 2 : 0 }}>{parts}</div>
  })
}

/* ── Header + AmbientBg (shared master components) ── */
const Header = PlatformHeader

export default function ChatPage() {
  const [messages, setMessages] = useState(INITIAL)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const scans = useScanStore(s => s.scans)
  const recentScans = scans.slice(0, 5)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }) }, [messages])

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    const stored = JSON.parse(localStorage.getItem("dlx-chat-usage") || "{}")
    setMsgCount(stored.date === today ? (stored.count || 0) : 0)
  }, [])

  function incrementMsgCount() {
    const today = new Date().toISOString().split("T")[0]
    const stored = JSON.parse(localStorage.getItem("dlx-chat-usage") || "{}")
    const count = stored.date === today ? (stored.count || 0) + 1 : 1
    localStorage.setItem("dlx-chat-usage", JSON.stringify({ date: today, count }))
    setMsgCount(count)
  }

  async function send(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = { role:"user", content:input }
    const intent = classifyIntent(input)

    const cached = getCachedResponse(input)
    if (cached) {
      setMessages(m => [...m, userMsg, { role:"assistant", content:cached }])
      setInput("")
      return
    }

    if (intent === "BILLING_QUERY") {
      setMessages(m => [...m, userMsg, { role:"assistant", content:"Our plans are tailored to your organisation's needs — from individual forensic verification to sovereign-grade government deployments. I'll connect you with the team for specific pricing and plan details." }])
      setInput("")
      setTimeout(() => setContactOpen(true), 800)
      return
    }

    setMessages(m => [...m, userMsg])
    setInput(""); setLoading(true)
    incrementMsgCount()
    try {
      const r = await fetch("/api/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          messages:[...messages, userMsg],
          scanContext: intent === "SCAN_QUERY" ? recentScans : [],
          intent,
        })
      })
      const d = await r.json()
      setMessages(m => [...m, { role:"assistant", content:d.content }])
      if (d.redirect === "contact") setTimeout(() => setContactOpen(true), 800)
    } catch {
      setMessages(m => [...m, { role:"assistant", content:"Connection interrupted. Please try again." }])
    }
    setLoading(false)
  }

  const capabilities = [
    { icon:"🔍", label:"Scan Interpretation", desc:"Decode confidence scores and verdicts" },
    { icon:"🧬", label:"Forensic Analysis", desc:"Deep-dive into detection dimensions" },
    { icon:"📋", label:"Evidence Guidance", desc:"Document findings for legal or audit" },
    { icon:"⚡", label:"Methodology", desc:"Understand AI detection techniques" },
  ]

  const globalCSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #1E2A4A; border-radius: 2px; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:none; } }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
    @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  `

  return (
    <div style={{ minHeight:"100vh", background:P.bg, fontFamily:"'DM Sans', sans-serif", color:P.tx, display:"flex", flexDirection:"column" }}>
      <style>{globalCSS}</style>
      <AmbientBg />
      <Header />

      {/* Contact modal */}
      {contactOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:9000, background:"rgba(6,10,20,0.90)", backdropFilter:"blur(16px)", transform:"translateZ(0)", willChange:"transform", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={e => e.target===e.currentTarget && setContactOpen(false)}>
          <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(99,102,241,0.25)", borderRadius:20, padding:"40px 44px", width:"100%", maxWidth:500, boxShadow:"0 0 80px rgba(167,139,250,0.12)", position:"relative", backdropFilter:"blur(12px)", transform:"translateZ(0)", willChange:"transform" }}>
            <button onClick={() => setContactOpen(false)} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", color:P.txM, fontSize:18, cursor:"pointer", width:32, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            <div style={{ fontSize:12, fontWeight:600, letterSpacing:"3px", textTransform:"uppercase", color:P.accent, marginBottom:8, fontFamily:"'DM Sans', sans-serif" }}>Contact Us</div>
            <h3 style={{ fontSize:22, fontWeight:800, marginBottom:8, fontFamily:"'Space Grotesk', sans-serif" }}>Talk To Our Team</h3>
            <p style={{ color:P.txM, fontSize:14, marginBottom:24, lineHeight:1.7 }}>For billing, upgrades, enterprise plans and pricing enquiries, our team is here to help.</p>
            <a href="/pricing" style={{ display:"block", padding:"14px 0", background:"linear-gradient(135deg, #6366F1, #4F46E5)", color:"#fff", borderRadius:12, textAlign:"center", textDecoration:"none", fontWeight:600, fontSize:15, fontFamily:"'DM Sans', sans-serif" }}>View Plans & Contact Sales</a>
          </div>
        </div>
      )}

      {/* ═══════ MAIN ═══════ */}
      <div style={{ position:"relative", zIndex:1, flex:1, display:"flex", flexDirection:"column", maxWidth:720, width:"100%", margin:"0 auto", padding:"100px 24px 0" }}>

        {/* ── Nav Menus ── */}
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:12, marginBottom:24, animation:"fadeUp 0.5s ease 0.05s both", flexShrink:0 }}>
          <span onClick={() => window.location.href = "/workstation"} style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 20px", minWidth:160, borderRadius:12, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", color:"#818CF8", fontSize:13, fontWeight:500, letterSpacing:"0.3px", fontFamily:"'DM Sans', sans-serif", transition:"all 0.25s ease", cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.transform = "translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; e.currentTarget.style.transform = "" }}>
            <span style={{ fontSize:15 }}>📈</span>
            Workstation
          </span>
          <span onClick={() => window.location.href = "/reports"} style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 20px", minWidth:160, borderRadius:12, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", color:"#818CF8", fontSize:13, fontWeight:500, letterSpacing:"0.3px", fontFamily:"'DM Sans', sans-serif", transition:"all 0.25s ease", cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.transform = "translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; e.currentTarget.style.transform = "" }}>
            <span style={{ fontSize:15 }}>🗂️</span>
            Reports
          </span>
          <span onClick={() => window.location.href = "/chat"} style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 20px", minWidth:160, borderRadius:12, background:"linear-gradient(135deg, #6366F1, #7C3AED)", border:"1px solid rgba(124,58,237,0.5)", color:"#fff", fontSize:13, fontWeight:600, letterSpacing:"0.3px", fontFamily:"'DM Sans', sans-serif", cursor:"default", boxShadow:"0 4px 20px rgba(99,102,241,0.3)" }}>
            <span style={{ fontSize:15 }}>💬</span>
            DalxicChat
          </span>
        </div>

        {/* ── Chat Container (compact glass card) ── */}
        <div style={{
          flex:1, display:"flex", flexDirection:"column",
          background:"rgba(255,255,255,0.025)", border:"1px solid rgba(99,102,241,0.1)",
          borderRadius:20, backdropFilter:"blur(12px)", transform:"translateZ(0)", willChange:"transform", WebkitBackdropFilter:"blur(12px)",
          overflow:"hidden", marginBottom:24, animation:"fadeUp 0.6s ease 0.1s both",
          boxShadow:"0 4px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
          position:"relative", minHeight:0,
        }}>
          {/* Accent top bar */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg, #6366F190, #A78BFA50, transparent)" }} />

          {/* Chat header */}
          <div style={{ padding:"16px 24px", borderBottom:"1px solid rgba(99,102,241,0.08)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg, rgba(99,102,241,0.12), rgba(129,140,248,0.08))", border:"1px solid rgba(99,102,241,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:16 }}>⚡</span>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:14, fontFamily:"'Space Grotesk', sans-serif" }}>Nexus-7</div>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:P.gr, boxShadow:"0 0 6px " + P.gr }} />
                  <span style={{ fontSize:9, color:P.gr, fontFamily:"'DM Mono', monospace" }}>Online</span>
                  <span style={{ width:2, height:2, borderRadius:"50%", background:P.txD, margin:"0 2px" }} />
                  <span style={{ fontSize:9, color:P.txD, fontFamily:"'DM Mono', monospace" }}>Forensic Assistant</span>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:10, color:P.txD, fontFamily:"'DM Mono', monospace" }}>{msgCount} Today</span>
              <button onClick={() => setMessages(INITIAL)} style={{ padding:"6px 12px", borderRadius:8, background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.12)", color:P.txM, cursor:"pointer", fontSize:11, fontFamily:"'DM Sans', sans-serif", transition:"all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.12)"}>
                New Chat
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div style={{ flex:1, overflowY:"auto", padding:"24px 24px 16px" }}>
            {/* Scan context card */}
            {scans.length > 0 && (
              <div style={{ marginBottom:20, padding:"12px 16px", background:"rgba(99,102,241,0.04)", border:"1px solid rgba(99,102,241,0.12)", borderRadius:12, display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:20 }}>{scans[0].verdict === "AI_DETECTED" ? "⚠️" : "✅"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600 }}>{scans[0].filename || "Latest Scan"}</div>
                  <div style={{ fontSize:10, color:P.txM, fontFamily:"'DM Mono', monospace", marginTop:2 }}>
                    <span style={{ color: scans[0].verdict === "AI_DETECTED" ? P.re : P.gr, fontWeight:600 }}>{scans[0].verdict?.replace("_"," ")}</span>
                    <span style={{ margin:"0 6px" }}>&middot;</span>
                    {scans[0].confidence}% confidence
                  </div>
                </div>
                <span style={{ fontSize:9, color:P.txD, fontFamily:"'DM Mono', monospace", padding:"3px 8px", borderRadius:6, background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.1)" }}>Context Active</span>
              </div>
            )}

            {/* Welcome capability cards */}
            {messages.length === 1 && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:10, marginBottom:24 }}>
                {capabilities.map(cap => (
                  <button key={cap.label} onClick={() => { setInput(cap.desc); inputRef.current?.focus() }}
                    style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(99,102,241,0.08)", borderRadius:12, padding:"14px 16px", textAlign:"left", cursor:"pointer", transition:"all 0.25s", display:"flex", gap:12, alignItems:"flex-start" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)"; e.currentTarget.style.transform = "translateY(-2px)" }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.08)"; e.currentTarget.style.transform = "" }}>
                    <span style={{ fontSize:22 }}>{cap.icon}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:P.tx, marginBottom:3 }}>{cap.label}</div>
                      <div style={{ fontSize:12, color:P.txM, lineHeight:1.5 }}>{cap.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Message thread */}
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display:"flex", gap:12, justifyContent: m.role === "user" ? "flex-end" : "flex-start", animation:"msgIn 0.3s ease forwards" }}>
                  {m.role === "assistant" && (
                    <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg, rgba(99,102,241,0.12), rgba(129,140,248,0.08))", border:"1px solid rgba(99,102,241,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                      <span style={{ fontSize:13 }}>⚡</span>
                    </div>
                  )}
                  <div style={{
                    maxWidth:"75%", padding:"14px 18px", borderRadius:14, lineHeight:1.75, fontSize:14,
                    ...(m.role === "user" ? {
                      background:"linear-gradient(135deg, #6366F1, #4F46E5)",
                      color:"#fff",
                      borderBottomRightRadius:4,
                      boxShadow:"0 4px 20px rgba(99,102,241,0.18)",
                    } : {
                      background:"rgba(255,255,255,0.03)",
                      border:"1px solid rgba(99,102,241,0.08)",
                      color:P.tx,
                      borderBottomLeftRadius:4,
                    }),
                  }}>
                    {m.role === "user" ? m.content : <FormatText text={m.content} />}
                  </div>
                  {m.role === "user" && (
                    <div style={{ width:30, height:30, borderRadius:8, background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                      <span style={{ fontSize:13 }}>👤</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div style={{ display:"flex", gap:12, alignItems:"flex-start", animation:"msgIn 0.3s ease forwards" }}>
                  <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg, rgba(99,102,241,0.12), rgba(129,140,248,0.08))", border:"1px solid rgba(99,102,241,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:13 }}>⚡</span>
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(99,102,241,0.08)", borderRadius:14, borderBottomLeftRadius:4, padding:"16px 20px", display:"flex", gap:5, alignItems:"center" }}>
                    {[0,1,2].map(j => (
                      <span key={j} style={{ width:5, height:5, borderRadius:"50%", background:P.violet, display:"inline-block", animation:"pulse 1.4s ease-in-out infinite", animationDelay:`${j*0.15}s` }} />
                    ))}
                    <span style={{ fontSize:11, color:P.txD, marginLeft:8, fontFamily:"'DM Mono', monospace" }}>Analysing...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input area */}
          <div style={{ padding:"12px 20px 16px", borderTop:"1px solid rgba(99,102,241,0.08)", flexShrink:0 }}>
            <form onSubmit={send} style={{
              display:"flex", gap:0,
              background:"rgba(255,255,255,0.02)",
              border: `1px solid ${inputFocused ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.08)"}`,
              borderRadius:14, padding:"4px 4px 4px 18px", alignItems:"center",
              transition:"border-color 0.2s, box-shadow 0.2s",
              boxShadow: inputFocused ? "0 0 0 3px rgba(99,102,241,0.06)" : "none",
            }}>
              <input
                ref={inputRef}
                value={input} onChange={e => setInput(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={scans.length > 0 ? "Ask about your scan results..." : "Ask about forensic methodology..."}
                style={{ flex:1, background:"transparent", border:"none", color:P.tx, fontSize:14, outline:"none", padding:"11px 0", fontFamily:"'DM Sans', sans-serif" }}
              />
              <button type="submit" disabled={!input.trim()||loading} style={{
                padding:"10px 16px", borderRadius:10,
                background: input.trim()&&!loading ? "linear-gradient(135deg, #6366F1, #4F46E5)" : "transparent",
                border: input.trim()&&!loading ? "none" : "1px solid rgba(99,102,241,0.1)",
                color: input.trim()&&!loading ? "#fff" : P.txD,
                cursor: input.trim()&&!loading ? "pointer" : "default",
                fontSize:13, fontWeight:600, transition:"all 0.2s",
                display:"flex", alignItems:"center",
                boxShadow: input.trim()&&!loading ? "0 2px 12px rgba(99,102,241,0.2)" : "none",
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
            </form>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8, padding:"0 2px" }}>
              <span style={{ fontSize:9, color:P.txD, fontFamily:"'DM Mono', monospace" }}>Nexus-7 v4.2 · Verify Responses For Legal Proceedings</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
