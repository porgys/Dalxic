"use client"
import { useState } from "react"
import Link from "next/link"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

const C = {
  bg:"#03050F", surf:"#070B1A", surf2:"#0A1028", border:"#1A2240", border2:"#243060",
  primary:"#6366F1", glow:"#A78BFA", indigo:"#6366F1",
  tx:"#F0F4FF", txM:"#6878AA", txD:"#3A4870",
  gr:"#10B981", re:"#EF4444",
}

const FIREBASE_ERRORS = {
  "auth/user-not-found":       "No account found with this email.",
  "auth/wrong-password":       "Incorrect password.",
  "auth/invalid-credential":   "Incorrect email or password.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password":        "Password must be at least 6 characters.",
  "auth/invalid-email":        "Please enter a valid email address.",
  "auth/too-many-requests":    "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error. Check your connection.",
}

export default function AuthPage() {
  const [mode, setMode]         = useState("login") // login | register | reset
  const [form, setForm]         = useState({ name:"", email:"", password:"", confirm:"" })
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState("")
  const [resetSent, setResetSent] = useState(false)

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function submit(e) {
    e.preventDefault()
    setErr("")
    setLoading(true)

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, form.email, form.password)
        window.location.href = "/workstation"

      } else if (mode === "register") {
        if (form.password !== form.confirm) { setErr("Passwords do not match."); setLoading(false); return }
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
        if (form.name) await updateProfile(cred.user, { displayName: form.name })
        window.location.href = "/workstation"

      } else if (mode === "reset") {
        await sendPasswordResetEmail(auth, form.email)
        setResetSent(true)
      }
    } catch (err) {
      setErr(FIREBASE_ERRORS[err.code] || "Something went wrong. Please try again.")
    }

    setLoading(false)
  }

  const inputStyle = {
    background:C.surf2, border:`1px solid ${C.border}`, borderRadius:10,
    padding:"12px 16px", color:C.tx, fontSize:14, outline:"none",
    width:"100%", transition:"border-color 0.2s", fontFamily:"inherit",
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Space Grotesk',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 1000px #0A1028 inset !important; -webkit-text-fill-color:#F0F4FF !important; }
      `}</style>

      {/* Background grid */}
      <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(rgba(99,102,241,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.035) 1px, transparent 1px)`, backgroundSize:"50px 50px" }} />
      <div style={{ position:"absolute", top:"20%", left:"50%", transform:"translateX(-50%)", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)", pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:420, padding:24 }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <Link href="/" style={{ textDecoration:"none", display:"inline-flex", alignItems:"center" }}>
            <span style={{ fontWeight:300, fontSize:20, color:"#94A3B8", letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans','Space Grotesk',sans-serif" }}>Dalxic</span>
            <span style={{ fontWeight:700, fontSize:20, letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans','Space Grotesk',sans-serif", background:"linear-gradient(135deg, #818CF8, #A78BFA)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Media</span>
          </Link>
          <div style={{ fontSize:13, color:C.txM, marginTop:8 }}>Forensic Excellence Platform</div>
        </div>

        <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:20, padding:"36px 32px", boxShadow:`0 0 60px rgba(167,139,250,0.08)` }}>

          {/* Mode tabs */}
          {mode !== "reset" && (
            <div style={{ display:"flex", background:C.surf2, borderRadius:12, padding:4, marginBottom:28 }}>
              {["login","register"].map(m => (
                <button key={m} onClick={() => { setMode(m); setErr("") }} style={{
                  flex:1, padding:"9px 0", borderRadius:9, border:"none", cursor:"pointer",
                  background: mode===m ? C.primary : "transparent",
                  color: mode===m ? "#fff" : C.txM,
                  fontSize:13, fontWeight:600, transition:"all 0.2s",
                }}>
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          {/* Reset header */}
          {mode === "reset" && !resetSent && (
            <div style={{ marginBottom:24 }}>
              <button onClick={() => { setMode("login"); setErr("") }} style={{ background:"none", border:"none", color:C.txM, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:6, marginBottom:16 }}>
                ← Back to sign in
              </button>
              <h2 style={{ fontSize:20, fontWeight:800, marginBottom:8, color:C.tx }}>Reset Password</h2>
              <p style={{ fontSize:13, color:C.txM, lineHeight:1.6 }}>Enter your email and we'll send reset instructions.</p>
            </div>
          )}

          {/* Reset sent confirmation */}
          {resetSent ? (
            <div style={{ textAlign:"center", padding:"10px 0" }}>
              <div style={{ fontSize:44, marginBottom:16 }}>✉️</div>
              <h3 style={{ fontSize:18, fontWeight:700, marginBottom:8, color:C.tx }}>Check your inbox</h3>
              <p style={{ fontSize:13, color:C.txM, lineHeight:1.6, marginBottom:20 }}>If an account exists for that email, you'll receive reset instructions shortly.</p>
              <button onClick={() => { setMode("login"); setResetSent(false) }} style={{ padding:"10px 24px", borderRadius:10, background:C.primary, color:"#fff", border:"none", cursor:"pointer", fontWeight:600 }}>
                Return to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {mode === "register" && (
                <input type="text" placeholder="Full name" value={form.name} onChange={set("name")}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor=C.primary}
                  onBlur={e  => e.target.style.borderColor=C.border} />
              )}

              <input type="email" placeholder="Email address" required value={form.email} onChange={set("email")}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor=C.primary}
                onBlur={e  => e.target.style.borderColor=C.border} />

              {mode !== "reset" && (
                <input type="password" placeholder="Password" required value={form.password} onChange={set("password")}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor=C.primary}
                  onBlur={e  => e.target.style.borderColor=C.border} />
              )}

              {mode === "register" && (
                <input type="password" placeholder="Confirm password" required value={form.confirm} onChange={set("confirm")}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor=C.primary}
                  onBlur={e  => e.target.style.borderColor=C.border} />
              )}

              {err && (
                <div style={{ fontSize:13, color:C.re, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, padding:"10px 14px" }}>
                  {err}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                padding:"14px 0", borderRadius:12, width:"100%",
                background:`linear-gradient(135deg, ${C.primary}, #4F46E5)`,
                color:"#fff", border:"none", cursor:loading ? "not-allowed" : "pointer",
                fontSize:15, fontWeight:700, boxShadow:`0 4px 20px rgba(99,102,241,0.3)`,
                opacity:loading ? 0.7 : 1, transition:"all 0.2s", fontFamily:"inherit",
              }}>
                {loading ? "Please wait…" : mode==="login" ? "Sign In" : mode==="register" ? "Create Account" : "Send Reset Link"}
              </button>

              {mode === "login" && (
                <button type="button" onClick={() => { setMode("reset"); setErr("") }}
                  style={{ background:"none", border:"none", color:C.txM, cursor:"pointer", fontSize:13, textAlign:"center", marginTop:-4 }}>
                  Forgot password?
                </button>
              )}
            </form>
          )}
        </div>

        <p style={{ textAlign:"center", marginTop:20, fontSize:12, color:C.txD }}>
          By continuing, you agree to our{" "}
          <Link href="/terms" style={{ color:C.txM, textDecoration:"none" }}>Terms</Link> &{" "}
          <Link href="/privacy" style={{ color:C.txM, textDecoration:"none" }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
