"use client"
import Link from "next/link"

const INTEGRATIONS = [
  { name:"News Verification API", desc:"Embed NarrativeGuard™ directly into your editorial workflow. Real-time AI content scoring for every article, video and image before publication.", icon:"M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z", category:"Media", status:"available", docs:true },
  { name:"Legal Evidence Connector", desc:"Automated ForensIQ™ report generation for digital evidence submitted to court case management systems.", icon:"M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3", category:"Legal", status:"available", docs:true },
  { name:"Broadcast Monitor", desc:"Live stream ingestion and continuous AI monitoring for television and radio broadcast pipelines via SentinelCore™.", icon:"M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", category:"Broadcast", status:"available", docs:true },
  { name:"Slack Intelligence", desc:"Instant Dalxic scan results delivered to your Slack workspace. Flag suspicious content directly from team channels.", icon:"M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z", category:"Productivity", status:"available", docs:true },
  { name:"Zapier Automation", desc:"Connect Dalxic to 6,000+ apps. Trigger scans, receive reports and route detections automatically.", icon:"M13 10V3L4 14h7v7l9-11h-7z", category:"Automation", status:"available", docs:false },
  { name:"SharePoint Vault", desc:"Automatically scan documents and media uploaded to SharePoint. ForensIQ™ reports attached to every flagged file.", icon:"M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4", category:"Enterprise", status:"coming-soon", docs:false },
  { name:"Salesforce Shield", desc:"AI-manipulation detection for customer-submitted media and documentation in your Salesforce environment.", icon:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", category:"Enterprise", status:"coming-soon", docs:false },
  { name:"Government GovCloud", desc:"Sovereign-grade private cloud deployment for classified government environments with full air-gap support.", icon:"M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z", category:"Government", status:"enterprise", docs:false },
]

import { P } from "../../lib/tokens"

export default function IntegrationsPage() {
  return (
    <div style={{ minHeight:"100vh", background:P.bg, fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif", color:P.tx, display:"flex" }}>
      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E2A4A; border-radius: 4px; }
        .dlx-nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: 500; transition: all 0.15s; position: relative; }
        .dlx-nav-item:hover { background: rgba(99,102,241,0.04); }
      `}</style>

      {/* ═══════ SIDEBAR ═══════ */}
      <div style={{ position:"fixed", left:0, top:0, bottom:0, width:240, background:P.side, borderRight:"none", display:"flex", flexDirection:"column", zIndex:100 }}>
        {/* Leather texture strip — right edge, behind stitch */}
        <div style={{ position:"absolute", right:0, top:0, bottom:0, width:20, zIndex:99, pointerEvents:"none", background:"url('/sidebar-leather.png') right top / 20px auto repeat-y", opacity:0.7 }} />
        {/* Stitch lining — right edge */}
        <div style={{ position:"absolute", right:-4, top:0, bottom:0, width:8, zIndex:101, pointerEvents:"none", background:"url('/stitch-line.png') center top / 8px repeat-y", filter:"brightness(0.50)" }} />
        {/* Logo */}
        <div style={{ padding:"24px 20px 20px 59px", borderBottom:"1px solid " + P.border, position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center" }}>
            <span style={{ fontWeight:300, fontSize:15, color:"#94A3B8", letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'Space Grotesk', sans-serif" }}>Dalxic</span>
            <span style={{ fontWeight:700, fontSize:15, letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'Space Grotesk', sans-serif", background:"linear-gradient(135deg, #818CF8, #A78BFA)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Media</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"0 12px", display:"flex", flexDirection:"column", gap:2, position:"relative", zIndex:1 }}>
          {[
            { icon:"M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z", label:"Dashboard", href:"/" },
            { icon:"M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zm4-8h.01M12 15h.01", label:"Workstation", href:"/workstation" },
            { icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", label:"Reports", href:"/reports" },
            { icon:"M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z", label:"Dalxic Chat", href:"/chat" },
            { icon:"M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z", label:"Integrations", href:"/integrations", active:true },
          ].map(item => (
            <a key={item.label} href={item.href} className="dlx-nav-item" style={{
              background: "transparent",
              color: P.txM,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0.6 }}><path d={item.icon}/></svg>
              <span style={{ fontWeight:500 }}>{item.label}</span>
            </a>
          ))}

          {/* Separator */}
          <div style={{ height:1, background:P.border, margin:"12px 14px" }} />
          <div style={{ padding:"0 14px", marginBottom:6 }}>
            <div style={{ fontSize:9, fontWeight:600, color:P.txD, letterSpacing:"1.5px", textTransform:"uppercase", fontFamily:"'DM Mono', monospace" }}>SYSTEM</div>
          </div>
          <a href="/settings" className="dlx-nav-item" style={{ color:P.txM }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0.6 }}><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span>Settings</span>
          </a>
        </nav>

        {/* Bottom engine status */}
        <div style={{ padding:"20px 24px", borderTop:"1px solid " + P.border, position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.1))", border:"1px solid " + P.border, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.violet} strokeWidth="1.5" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:P.tx }}>Nexus-7</div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:P.gr, display:"inline-block" }} />
                <span style={{ fontSize:9, color:P.gr, fontFamily:"'DM Mono', monospace" }}>Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginLeft:240, flex:1, padding:"40px 48px" }}>
        <div style={{ marginBottom:40 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:P.violet, marginBottom:6, fontFamily:"'DM Mono', monospace" }}>NexusLink™ Ecosystem</div>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:-0.5, marginBottom:8 }}>Integrations</h1>
          <p style={{ color:P.txM, fontSize:14, maxWidth:560 }}>Embed Nexus-7™ intelligence directly into your existing workflows. NexusLink™ API powers every integration.</p>
        </div>

        {/* API Key card */}
        <div style={{ background:`rgba(99,102,241,0.06)`, border:`1px solid rgba(99,102,241,0.2)`, borderRadius:14, padding:"20px 24px", marginBottom:32, display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:P.accent, marginBottom:4 }}>NexusLink™ API Key</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:P.txM, letterSpacing:1 }}>dlx_live_••••••••••••••••••••••••••••••••</div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button style={{ padding:"8px 16px", borderRadius:8, background:`rgba(99,102,241,0.1)`, border:`1px solid rgba(99,102,241,0.2)`, color:P.accent, cursor:"pointer", fontSize:12, fontWeight:600 }}>Reveal Key</button>
            <button style={{ padding:"8px 16px", borderRadius:8, background:"transparent", border:`1px solid ${P.border}`, color:P.txM, cursor:"pointer", fontSize:12 }}>Regenerate</button>
          </div>
        </div>

        {/* Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:14 }}>
          {INTEGRATIONS.map(int => {
            const statusColor = int.status==="available" ? P.gr : int.status==="coming-soon" ? P.gold : P.accent
            const statusLabel = int.status==="available" ? "Available" : int.status==="coming-soon" ? "Coming Soon" : "Enterprise"
            return (
              <div key={int.name} style={{ background:P.card, border:`1px solid ${P.border}`, borderRadius:14, padding:"24px 22px", transition:"all 0.25s ease", cursor:"default" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=statusColor+"40"; e.currentTarget.style.transform="translateY(-3px)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=P.border; e.currentTarget.style.transform="" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                  <div style={{ width:42, height:42, borderRadius:12, background:`${statusColor}10`, border:`1px solid ${statusColor}20`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={int.icon}/></svg>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", padding:"3px 10px", borderRadius:20, background:`${statusColor}15`, color:statusColor, border:`1px solid ${statusColor}30` }}>{statusLabel}</span>
                    <span style={{ fontSize:10, color:P.txD, padding:"2px 8px", borderRadius:8, background:P.bg }}>{int.category}</span>
                  </div>
                </div>
                <h3 style={{ fontWeight:700, fontSize:15, marginBottom:8 }}>{int.name}</h3>
                <p style={{ fontSize:13, color:P.txM, lineHeight:1.65, marginBottom:16 }}>{int.desc}</p>
                <div style={{ display:"flex", gap:8 }}>
                  {int.status==="available" ? (
                    <>
                      <button style={{ flex:1, padding:"8px 0", borderRadius:8, background:`linear-gradient(135deg, ${P.accent}, #4F46E5)`, color:"#fff", border:"none", cursor:"pointer", fontSize:12, fontWeight:600 }}>Connect</button>
                      {int.docs && <button style={{ padding:"8px 14px", borderRadius:8, background:"transparent", border:`1px solid ${P.border}`, color:P.txM, cursor:"pointer", fontSize:12 }}>Docs</button>}
                    </>
                  ) : int.status==="coming-soon" ? (
                    <button style={{ flex:1, padding:"8px 0", borderRadius:8, background:"transparent", border:`1px solid ${P.gold}30`, color:P.gold, cursor:"pointer", fontSize:12, fontWeight:600 }}>Notify Me</button>
                  ) : (
                    <a href="/pricing" style={{ flex:1, padding:"8px 0", borderRadius:8, background:`rgba(99,102,241,0.1)`, border:`1px solid rgba(99,102,241,0.25)`, color:P.accent, cursor:"pointer", fontSize:12, fontWeight:600, textDecoration:"none", display:"block", textAlign:"center" }}>Contact Sales</a>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* NexusLink docs teaser */}
        <div style={{ marginTop:40, background:`rgba(167,139,250,0.04)`, border:`1px solid rgba(167,139,250,0.15)`, borderRadius:16, padding:"28px 32px" }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:P.glow, marginBottom:8 }}>NexusLink™ Developer API</div>
          <h3 style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Build custom forensic integrations</h3>
          <p style={{ color:P.txM, fontSize:14, lineHeight:1.7, marginBottom:16, maxWidth:560 }}>
            The NexusLink™ API provides programmatic access to the full Nexus-7™ engine. Supports image, video, audio and text analysis with webhook callbacks and batch processing.
          </p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <code style={{ background:P.bg, border:`1px solid ${P.border}`, borderRadius:8, padding:"8px 14px", fontSize:12, color:P.glow, fontFamily:"'DM Mono', monospace" }}>POST /api/v1/analyze</code>
            <code style={{ background:P.bg, border:`1px solid ${P.border}`, borderRadius:8, padding:"8px 14px", fontSize:12, color:P.txM, fontFamily:"'DM Mono', monospace" }}>GET /api/v1/report/:id</code>
            <code style={{ background:P.bg, border:`1px solid ${P.border}`, borderRadius:8, padding:"8px 14px", fontSize:12, color:P.txM, fontFamily:"'DM Mono', monospace" }}>POST /api/v1/batch</code>
          </div>
        </div>
      </div>
    </div>
  )
}
