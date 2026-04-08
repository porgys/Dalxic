"use client"
import Link from "next/link"

export default function AboutPage() {
  const milestones = [
    { year:"2022", title:"The Idea", desc:"George Gaisie conceives Nexus-7™ after witnessing deepfake manipulation in a high-stakes broadcast event. The vision: a forensic AI that leaves no lie undetected." },
    { year:"2023", title:"Dalxic Founded", desc:"The Dalxic team assembles. Early training begins on 200 million samples. The first version of ChromaVeil™ is tested in closed beta with a West African broadcaster." },
    { year:"2024", title:"2.4 Billion Samples", desc:"The training corpus passes 2.4 billion samples — an industry record. Dalxic achieves 98.9% detection accuracy. The first government client goes live. ForensIQ™ reports gain court acceptance." },
    { year:"2025", title:"Global Deployment", desc:"NexusLink™ API launches. Enterprise deployments across three continents. Partnerships with national broadcasters, judiciary systems and regulatory authorities. The standard is set." },
  ]

  const values = [
    { icon:"🎯", title:"Truth as Standard", desc:"We exist for one purpose: to protect the authenticity of information. Every feature, every model, every report exists in service of truth." },
    { icon:"🔬", title:"Forensic Precision", desc:"98.9% is not a ceiling — it is a floor. We iterate daily, expand our training corpus daily, and hold ourselves to standards that exceed any industry benchmark." },
    { icon:"🛡", title:"Uncompromising Security", desc:"Our clients' data and workflows are protected by multi-layered cryptographic architecture. No scan data is retained. No exceptions." },
    { icon:"⚖", title:"Ethical Intelligence", desc:"AI detection carries responsibility. We operate under the highest ethical standards, with independent oversight, bias auditing and transparent methodology." },
  ]

  return (
    <>
      <nav className="nav scrolled">
        <Link href="/?from=nav" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <div style={{ display:"flex", flexDirection:"column" }}>
            <span style={{ fontWeight:800, fontSize:14, color:"#F0F4FF", lineHeight:1, display:"flex", gap:1, fontFamily:"'Plus Jakarta Sans','Space Grotesk',sans-serif" }}>{"Dalxıc".split("").map((c, i) => i === 4 ? <span key={i} style={{ display:"inline-block", position:"relative" }}>{"ı"}<span style={{ position:"absolute", top:-5, left:"50%", transform:"translateX(-50%)", width:5, height:5, borderRadius:"50%", background:"#818CF8", boxShadow:"0 0 8px #6366F1" }} /></span> : <span key={i} style={{ display:"inline-block" }}>{c === " " ? "\u00A0" : c}</span>)}</span>
            <span style={{ fontWeight:600, fontSize:11, color:"#A78BFA", letterSpacing:"0.12em", textTransform:"uppercase", marginTop:2, fontFamily:"'Space Grotesk',sans-serif" }}>POWERED BY NEXUS-7</span>
          </div>
        </Link>
        <div style={{ display:"flex", gap:12 }}>
          <Link href="/team" className="btn btn-ghost btn-sm">Team</Link>
          <Link href="/pricing" className="btn btn-ghost btn-sm">Pricing</Link>
          <Link href="/workstation" className="btn btn-primary btn-sm">Start Scan</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop:140, paddingBottom:80, position:"relative", overflow:"hidden" }}>
        <div className="grid-bg" style={{ position:"absolute", inset:0, opacity:0.5 }} />
        <div style={{ position:"absolute", top:"30%", right:"10%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)", pointerEvents:"none" }} />
        <div className="container" style={{ position:"relative", zIndex:1 }}>
          <div className="section-label" style={{ marginBottom:14 }}>About Dalxic</div>
          <h1 style={{ fontSize:"clamp(2.5rem, 6vw, 4.5rem)", fontWeight:800, letterSpacing:-2, marginBottom:20, maxWidth:700, lineHeight:1.05 }}>
            We Built the Intelligence<br/><span className="gradient-text">the World Needed</span>
          </h1>
          <p style={{ fontSize:17, color:"var(--txM)", maxWidth:600, lineHeight:1.8, marginBottom:32 }}>
            Dalxic was created in response to a crisis: the unchecked proliferation of AI-generated media used to manipulate governments, deceive courts, mislead the public and undermine democratic institutions. We are the answer.
          </p>
          <div style={{ display:"flex", gap:14 }}>
            <Link href="/workstation" className="btn btn-primary btn-lg">Experience Nexus-7™</Link>
            <Link href="/team" className="btn btn-glow btn-lg">Meet Our Team</Link>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section" style={{ background:"var(--surf)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }}>
        <div className="container" style={{ textAlign:"center", maxWidth:720 }}>
          <div className="section-label" style={{ marginBottom:16 }}>Our Mission</div>
          <p style={{ fontSize:"clamp(1.1rem, 2vw, 1.4rem)", lineHeight:1.75, color:"var(--tx)", fontWeight:400 }}>
            "To create a world where the authenticity of information is verifiable, where AI manipulation is impossible to hide, and where institutions — from governments to broadcast networks to courts — can act on what is real.
            <span className="gradient-text" style={{ fontWeight:700 }}> We catch every lie.</span>"
          </p>
          <div style={{ marginTop:24, fontSize:14, color:"var(--txM)" }}>— George Gaisie, Founder & CEO</div>
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:60 }}>
            <div className="section-label" style={{ marginBottom:12 }}>Our Values</div>
            <h2 style={{ fontSize:"clamp(1.8rem, 4vw, 2.8rem)", fontWeight:800, letterSpacing:-1 }}>The Principles <span className="gradient-text">We Won't Compromise</span></h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:16 }}>
            {values.map(v => (
              <div key={v.title} className="glass" style={{ padding:"32px 28px" }}
                onMouseEnter={e => e.currentTarget.style.transform="translateY(-4px)"}
                onMouseLeave={e => e.currentTarget.style.transform=""}>
                <div style={{ fontSize:32, marginBottom:16 }}>{v.icon}</div>
                <h3 style={{ fontSize:18, fontWeight:700, marginBottom:10 }}>{v.title}</h3>
                <p style={{ fontSize:14, color:"var(--txM)", lineHeight:1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section" style={{ background:"var(--surf)", borderTop:"1px solid var(--border)" }}>
        <div className="container" style={{ maxWidth:800 }}>
          <div style={{ textAlign:"center", marginBottom:60 }}>
            <div className="section-label" style={{ marginBottom:12 }}>Our Journey</div>
            <h2 style={{ fontSize:"clamp(1.8rem, 4vw, 2.8rem)", fontWeight:800, letterSpacing:-1 }}>From Vision to <span className="gradient-text">Global Standard</span></h2>
          </div>
          <div style={{ position:"relative" }}>
            <div style={{ position:"absolute", left:60, top:0, bottom:0, width:1, background:"linear-gradient(to bottom, var(--glow), transparent)" }} />
            {milestones.map((m, i) => (
              <div key={m.year} style={{ display:"flex", gap:32, marginBottom:48, position:"relative" }}>
                <div style={{ width:120, flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <div style={{ width:12, height:12, borderRadius:"50%", background:"var(--glow)", boxShadow:"0 0 12px var(--glow)", position:"relative", zIndex:1, marginTop:6 }} />
                  <div style={{ fontWeight:800, fontSize:18, color:"var(--glow)" }}>{m.year}</div>
                </div>
                <div className="glass" style={{ flex:1, padding:"20px 24px" }}>
                  <h3 style={{ fontWeight:700, fontSize:17, marginBottom:8 }}>{m.title}</h3>
                  <p style={{ fontSize:14, color:"var(--txM)", lineHeight:1.7 }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ padding:"32px 0", borderTop:"1px solid var(--border)", textAlign:"center" }}>
        <span style={{ fontSize:12, color:"var(--txD)" }}>© 2026 Dalxic — <Link href="/?from=nav" style={{ color:"var(--primaryL)", textDecoration:"none" }}>dalxic.com</Link></span>
      </footer>
    </>
  )
}
