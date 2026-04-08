import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div style={{ minHeight:"100vh", background:"#03050F", color:"#F0F4FF", fontFamily:"'Space Grotesk',sans-serif" }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; }`}</style>
      <nav style={{ padding:"20px 44px", borderBottom:"1px solid #1A2240", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <Link href="/?from=nav" style={{ display:"flex", alignItems:"center", textDecoration:"none" }}>
          <span style={{ fontWeight:300, fontSize:14, color:"#94A3B8", letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans','Space Grotesk',sans-serif" }}>Dalxic</span>
          <span style={{ fontWeight:700, fontSize:14, letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans','Space Grotesk',sans-serif", background:"linear-gradient(135deg, #818CF8, #A78BFA)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Media</span>
        </Link>
      </nav>
      <main style={{ maxWidth:720, margin:"0 auto", padding:"60px 32px" }}>
        <h1 style={{ fontSize:36, fontWeight:800, letterSpacing:-1, marginBottom:8 }}>Privacy Policy</h1>
        <p style={{ color:"#6878AA", marginBottom:40 }}>Effective: 1 January 2025 · dalxic.com</p>
        {[
          ["Data We Collect", "We collect only what is necessary to provide our forensic analysis service: account credentials, billing information, and the metadata of files you submit for analysis. We do not retain scanned media files — all content is processed in encrypted memory and purged immediately upon report generation."],
          ["How We Use Data", "Account data is used to provide and improve our services. Scan metadata (file type, dimensions analysed, confidence scores) is retained to power your Projects workspace and to improve Nexus-7™ detection models — always in anonymised, aggregated form."],
          ["Data Security", "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Our infrastructure is designed to zero-trust standards. Rajan Pillai, our Chief Security Architect, oversees all security protocols. We do not sell data to third parties."],
          ["Your Rights", "You have the right to access, correct or delete your account data at any time. Contact our privacy team via the enquiry form on dalxic.com for all data requests. We comply with GDPR, and applicable data protection laws in all jurisdictions we serve."],
          ["Contact", "For privacy enquiries, please use the contact form on our website at dalxic.com."],
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
