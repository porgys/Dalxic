"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

const TEAM = [
  {
    name: "George Gaisie",
    role: "Chief Executive Officer",
    dept: "Executive Leadership",
    bio: "Visionary AI architect and Business Growth Consultant with an unparalleled command of machine learning systems. As founder of The Porgys Group and chief mind behind Nexus-7™, George put together an amazing team that spent years building Dalxic from the ground up with an uncompromising vision: a world where no fabricated media goes undetected. His understanding of AI modelling, large-scale neural architecture training, business dynamics, has produced one of the worlds highest grades of forensic efficiency, that is admissible even in the court of law.",
    skills: ["AI Modelling", "Business Growth Consultant", "Production Engineering", "Strategic Leadership"],
    color: "#A78BFA",
    badge: "Founder & CEO",
    porgys: true,
  },
  {
    name: "Dr. Catriona Sinclair",
    role: "Chief AI Research Officer",
    dept: "Research & Development",
    bio: "One of the world's foremost AI researchers, Dr. Sinclair leads Dalxic's R&D division, overseeing continuous expansion of Nexus-7™'s training corpus. Her groundbreaking work in adversarial machine learning and GAN fingerprinting has directly contributed to Dalxic's 98.9% detection benchmark.",
    skills: ["Machine Learning Research", "GAN Forensics", "Adversarial Training", "Neural Networks"],
    color: "#6366F1",
    badge: "Research Lead",
  },
  {
    name: "Arjun Mehta",
    role: "Head of Neural Architecture",
    dept: "Engineering",
    bio: "A master of deep learning architecture, Arjun designs the foundational neural structures that power ChromaVeil™, KineticScan™ and SonicTrace™. His multi-modal attention mechanisms have set industry records for cross-domain forensic detection.",
    skills: ["Deep Learning", "LLMs", "Multi-modal AI", "GenAI"],
    color: "#6366F1",
    badge: "Architecture Lead",
  },
  {
    name: "Isabelle Fontaine",
    role: "Chief Technology Officer",
    dept: "Technology",
    bio: "A seasoned technologist with 15 years building enterprise intelligence platforms across Europe. Isabelle oversees Dalxic's entire technical stack, cloud infrastructure, security architecture and the NexusLink™ integration framework that powers enterprise deployments.",
    skills: ["Cloud Architecture", "System Design", "API Infrastructure", "DevSecOps"],
    color: "#10B981",
    badge: "CTO",
  },
  {
    name: "Marcus Chen",
    role: "Director of Forensic Intelligence",
    dept: "Forensics",
    bio: "Former senior digital forensics investigator with extensive experience in evidence authentication for high-stakes legal proceedings. Marcus leads the development of ForensIQ™, ensuring every Dalxic report meets the stringent standards required by courts, regulators and international bodies.",
    skills: ["GenAI", "Legal Compliance", "Evidence Authentication", "Chain of Custody"],
    color: "#F59E0B",
    badge: "Forensics Director",
  },
  {
    name: "Priya Nambiar",
    role: "Head of Training Data Operations",
    dept: "Data Science",
    bio: "The architect of Dalxic's 2.4-billion-sample training pipeline, Priya designs the data acquisition, labelling and augmentation systems that keep Nexus-7™ ahead of every emerging AI generation tool. Under her leadership, the training corpus grows daily.",
    skills: ["Data Engineering", "ML Pipelines", "Predictive AI", "Synthetic Media Analysis"],
    color: "#EC4899",
    badge: "Data Operations",
  },
  {
    name: "Tobias Reinholt",
    role: "Senior AI Ethics & Compliance Lead",
    dept: "Ethics & Governance",
    bio: "A leading voice in responsible AI governance, Tobias ensures Dalxic operates within the highest ethical frameworks. His work on bias detection, transparent AI and regulatory compliance has made Dalxic the preferred partner for governmental and judicial institutions.",
    skills: ["AI Ethics", "GDPR Compliance", "Regulatory Affairs", "Bias Auditing"],
    color: "#8B5CF6",
    badge: "Ethics & Compliance",
  },
  {
    name: "Adaeze Uchenna",
    role: "Director of Enterprise Partnerships",
    dept: "Business Development",
    bio: "Adaeze has forged Dalxic's most strategic institutional relationships across governments, broadcast networks and multilateral organisations. She leads enterprise onboarding and ensures that every integration delivers measurable forensic impact.",
    skills: ["Enterprise Sales", "Government Relations", "Partnership Strategy", "Contract Negotiation"],
    color: "#F97316",
    badge: "Partnerships",
  },
  {
    name: "Zaid Hussain",
    role: "Lead Media Forensics Engineer",
    dept: "Engineering",
    bio: "A specialist in audio-visual forensics, Zaid built the KineticScan™ and FusionProbe™ engines from first principles. His expertise in temporal coherence analysis and frame-level neural forensics has enabled detection capabilities no other platform matches.",
    skills: ["Video Forensics", "Audio Analysis", "Signal Processing", "Computer Vision"],
    color: "#06B6D4",
    badge: "Media Forensics",
  },
  {
    name: "Sofia Mäkinen",
    role: "Head of UX & Product Design",
    dept: "Design",
    bio: "With a background in forensic visualization and enterprise product design, Sofia translates Dalxic's complex analytical outputs into clear, compelling interfaces. Her design philosophy: every insight must be immediately understood by both a judge and a journalist.",
    skills: ["UX Design", "Data Visualisation", "Product Strategy", "Design Systems"],
    color: "#A78BFA",
    badge: "Design Lead",
  },
  {
    name: "Rajan Pillai",
    role: "Chief Security Architect",
    dept: "Security",
    bio: "A veteran cybersecurity professional, Rajan designed Dalxic's multi-layered security architecture — from zero-trust API access and cryptographic report signing to end-to-end encrypted analysis pipelines. Dalxic's infrastructure is built to withstand nation-state-level adversaries.",
    skills: ["Cybersecurity", "Cryptography", "Zero-Trust Architecture", "Penetration Testing"],
    color: "#EF4444",
    badge: "Security",
  },
  {
    name: "Nadia Petrova",
    role: "Head Of Relations",
    dept: "Relations & Affairs",
    bio: "Nadia is Dalxic's bridge to the world — managing government affairs, media relations, institutional partnerships and public communications across all major markets. With experience spanning the EU, UN and African Union, she cultivates the trust that makes Dalxic the preferred forensic partner for regulators, broadcasters and international bodies alike.",
    skills: ["Government Affairs", "Media Relations", "Public Communications", "Stakeholder Strategy"],
    color: "#14B8A6",
    badge: "Head Of Relations",
  },
  {
    name: "Lucas Ferreira",
    role: "Director of Platform Engineering",
    dept: "Engineering",
    bio: "Lucas architects the systems that deliver sub-3-second analysis to thousands of concurrent users worldwide. His distributed computing expertise powers the real-time SentinelCore™ threat classification engine and ensures Dalxic's platform scales without compromise.",
    skills: ["Distributed Systems", "Backend Engineering", "Real-Time Processing", "Kubernetes"],
    color: "#22D3EE",
    badge: "Platform Engineering",
  },
]

export const metadata_export = {
  title: "Our Team — Dalxic",
}

export default function TeamPage() {
  const [active, setActive] = useState(null)

  useEffect(() => {
    const cursor = document.getElementById("dal-cursor")
    const ring   = document.getElementById("dal-ring")
    if (!cursor || !ring) return
    const move = e => { cursor.style.left=e.clientX+"px"; cursor.style.top=e.clientY+"px"; ring.style.left=e.clientX+"px"; ring.style.top=e.clientY+"px" }
    window.addEventListener("mousemove", move)
    return () => window.removeEventListener("mousemove", move)
  }, [])

  return (
    <>
      <div id="dal-cursor" className="cursor" />
      <div id="dal-ring"   className="cursor-ring" />

      {/* Nav */}
      <nav className="nav scrolled">
                <Link href="/?from=nav" style={{ display:"flex", alignItems:"center", textDecoration:"none" }}>
          <span style={{ fontWeight:300, fontSize:14, color:"#94A3B8", letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans','Space Grotesk',sans-serif" }}>Dalxic</span>
          <span style={{ fontWeight:700, fontSize:14, letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans','Space Grotesk',sans-serif", background:"linear-gradient(135deg, #818CF8, #A78BFA)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Media</span>
        </Link>
        <div style={{ display:"flex", gap:12 }}>
          <Link href="/" className="btn btn-ghost btn-sm">Home</Link>
          <Link href="/pricing" className="btn btn-ghost btn-sm">Pricing</Link>
          <button onClick={() => window.location.href = "/workstation"} className="btn btn-primary btn-sm">Start Scan</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop:140, paddingBottom:80, textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div className="grid-bg" style={{ position:"absolute", inset:0, opacity:0.5 }} />
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:600, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)", pointerEvents:"none" }} />
        <div className="container" style={{ position:"relative", zIndex:1 }}>
          <div className="section-label" style={{ marginBottom:14 }}>Our People</div>
          <h1 style={{ fontSize:"clamp(2.5rem, 6vw, 4.5rem)", fontWeight:800, letterSpacing:-2, marginBottom:20 }}>
            The Minds Behind <span className="gradient-text">Every Detection</span>
          </h1>
          <p style={{ color:"var(--txM)", fontSize:16, maxWidth:560, margin:"0 auto", lineHeight:1.75 }}>
            Thirteen world-class professionals united by a singular mission: to make AI manipulation impossible to hide. Every background. Every expertise. One standard of excellence.
          </p>
        </div>
      </section>

      {/* CEO Feature */}
      <section style={{ padding:"0 0 80px" }}>
        <div className="container">
          <div className="glass" style={{
            padding:"44px 48px", border:"1px solid rgba(167,139,250,0.25)",
            boxShadow:"0 0 80px rgba(167,139,250,0.1)",
            display:"grid", gridTemplateColumns:"auto 1fr", gap:48, alignItems:"start"
          }}>
            <div style={{ position:"relative" }}>
              <div style={{ width:160, height:160, borderRadius:20, background:"var(--surf2)", border:"2px solid rgba(167,139,250,0.3)", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:64 }}>👤</span>
              </div>
              <div className="badge badge-blue" style={{ position:"absolute", bottom:-8, left:"50%", transform:"translateX(-50%)", whiteSpace:"nowrap" }}>Founder & CEO</div>
            </div>
            <div>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center", marginBottom:8 }}>
                <div className="section-label">Executive Leadership</div>
              </div>
              <h2 style={{ fontSize:"clamp(1.6rem, 3vw, 2.4rem)", fontWeight:800, letterSpacing:-0.8, marginBottom:4 }}>{TEAM[0].name}</h2>
              <div style={{ fontSize:15, color:"var(--glow)", fontWeight:600, marginBottom:20 }}>{TEAM[0].role}</div>
              <p style={{ fontSize:15, color:"var(--txM)", lineHeight:1.8, marginBottom:24 }}>{TEAM[0].bio}</p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {TEAM[0].skills.map(s => <span key={s} className="badge badge-blue">{s}</span>)}
              </div>
              <div style={{ marginTop:20, fontSize:13, color:"var(--txD)" }}>
                Also: Founder & Owner, <span style={{ color:"var(--primaryL)" }}>The Porgys Group</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section style={{ paddingBottom:120 }}>
        <div className="container">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:20 }}>
            {TEAM.slice(1).map((m, i) => (
              <div key={m.name}
                className="glass team-card"
                onClick={() => setActive(active === i ? null : i)}
                style={{ padding:"28px 24px", cursor:"pointer", transition:"all 0.3s ease" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=m.color+"50"; e.currentTarget.style.boxShadow=`0 16px 48px ${m.color}12` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=""; e.currentTarget.style.boxShadow="" }}
              >
                <div style={{ display:"flex", gap:16, alignItems:"flex-start", marginBottom: active===i ? 16 : 0 }}>
                  <div style={{ width:64, height:64, borderRadius:14, background:"var(--surf2)", border:`1.5px solid ${m.color}40`, overflow:"hidden", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:28 }}>👤</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:m.color, textTransform:"uppercase", marginBottom:3 }}>{m.badge}</div>
                    <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>{m.name}</div>
                    <div style={{ fontSize:12, color:"var(--txM)" }}>{m.role}</div>
                  </div>
                  <span style={{ color:"var(--txD)", fontSize:14, transition:"transform 0.3s", display:"inline-block", transform: active===i ? "rotate(180deg)" : "none" }}>▾</span>
                </div>
                {active === i && (
                  <div style={{ animation:"fadeUp 0.3s ease" }}>
                    <p style={{ fontSize:13, color:"var(--txM)", lineHeight:1.7, marginBottom:14 }}>{m.bio}</p>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {m.skills.map(s => <span key={s} className="badge" style={{ background:`${m.color}15`, color:m.color, border:`1px solid ${m.color}30`, fontSize:10 }}>{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section style={{ padding:"80px 0", background:"var(--surf)", borderTop:"1px solid var(--border)" }}>
        <div className="container" style={{ textAlign:"center" }}>
          <h2 style={{ fontSize:"clamp(1.8rem, 4vw, 3rem)", fontWeight:800, letterSpacing:-1, marginBottom:16 }}>
            Join the World's <span className="gradient-text">Most Elite Forensics Team</span>
          </h2>
          <p style={{ color:"var(--txM)", maxWidth:480, margin:"0 auto 32px", lineHeight:1.7 }}>We are always looking for exceptional talent who share our commitment to truth, precision and forensic excellence.</p>
          <a href="mailto:careers@dalxic.com" className="btn btn-primary btn-lg">careers</a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding:"32px 0", borderTop:"1px solid var(--border)", textAlign:"center" }}>
        <span style={{ fontSize:12, color:"var(--txD)" }}>© 2026 Dalxic — <Link href="/" style={{ color:"var(--primaryL)", textDecoration:"none" }}>dalxic.com</Link></span>
      </footer>
    </>
  )
}
