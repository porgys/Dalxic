import Link from "next/link"

export default function TermsPage() {
  return (
    <div style={{ minHeight:"100vh", background:"#03050F", color:"#F0F4FF", fontFamily:"'Space Grotesk',sans-serif" }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; }`}</style>
      <nav style={{ padding:"20px 44px", borderBottom:"1px solid #1A2240", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <Link href="/?from=nav" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <div style={{ display:"flex", flexDirection:"column" }}>
            <span style={{ fontWeight:800, fontSize:14, color:"#F0F4FF", lineHeight:1, display:"flex", gap:1, fontFamily:"'Plus Jakarta Sans','Space Grotesk',sans-serif" }}>{"Dalxıc".split("").map((c, i) => i === 4 ? <span key={i} style={{ display:"inline-block", position:"relative" }}>{"ı"}<span style={{ position:"absolute", top:-5, left:"50%", transform:"translateX(-50%)", width:5, height:5, borderRadius:"50%", background:"#818CF8", boxShadow:"0 0 8px #6366F1" }} /></span> : <span key={i} style={{ display:"inline-block" }}>{c === " " ? "\u00A0" : c}</span>)}</span>
            <span style={{ fontWeight:600, fontSize:11, color:"#A78BFA", letterSpacing:"0.12em", textTransform:"uppercase", marginTop:2, fontFamily:"'Space Grotesk',sans-serif" }}>POWERED BY NEXUS-7</span>
          </div>
        </Link>
      </nav>
      <main style={{ maxWidth:720, margin:"0 auto", padding:"60px 32px" }}>
        <h1 style={{ fontSize:36, fontWeight:800, letterSpacing:-1, marginBottom:8 }}>Terms of Service</h1>
        <p style={{ color:"#6878AA", marginBottom:40 }}>Effective: 1 January 2025 · dalxic.com</p>
        {[
          ["Acceptance", "By accessing or using Dalxic services, you agree to these Terms. If you do not agree, do not use our platform."],
          ["Permitted Use", "Dalxic is provided for legitimate forensic analysis, content verification, journalism, legal proceedings and enterprise security use cases. You may not use Dalxic to circumvent, deceive or manipulate any legal or regulatory process."],
          ["Intellectual Property", "All Dalxic technology, including Nexus-7™, ChromaVeil™, SonicTrace™, KineticScan™, NarrativeGuard™, FusionProbe™, SentinelCore™, ForensIQ™ and NexusLink™, are proprietary trademarks and intellectual property of Dalxic. Unauthorised reproduction or reverse engineering is prohibited."],
          ["Liability", "Dalxic reports are produced with 98.9% accuracy and are intended for professional use. Users are responsible for applying forensic reports appropriately within their legal and professional contexts."],
          ["Contact", "For all enquiries, please use the contact form available on our website at dalxic.com."],
        ].map(([title, text]) => (
          <div key={title} style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:18, fontWeight:700, marginBottom:10, color:"#38BDF8" }}>{title}</h2>
            <p style={{ fontSize:14, lineHeight:1.8, color:"#6878AA" }}>{text}</p>
          </div>
        ))}
      </main>
    </div>
  )
}
