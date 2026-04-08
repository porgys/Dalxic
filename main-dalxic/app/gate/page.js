"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Gate() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(false)
    setLoading(true)
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push("/")
        router.refresh()
      } else {
        setError(true)
        setPassword("")
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 120% 80% at 50% 30%, rgba(10,8,20,1) 0%, rgba(4,3,10,1) 60%, #000 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      <form onSubmit={handleSubmit} style={{
        textAlign: "center", maxWidth: 380, width: "90%",
        padding: "48px 40px", borderRadius: 24,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(99,102,241,0.1)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 22, color: "#ECF0FF", letterSpacing: -0.5 }}>
            {"Dalxıc".split("").map((c, i) =>
              i === 4
                ? <span key={i} style={{ display: "inline-block", position: "relative" }}>
                    ı<span style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, borderRadius: "50%", background: "#818CF8", boxShadow: "0 0 10px #6366F1" }} />
                  </span>
                : <span key={i}>{c}</span>
            )}
          </span>
        </div>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#A78BFA", marginBottom: 36, fontFamily: "'DM Mono', monospace" }}>
          Powered By Nexus-7
        </p>

        {/* Accent line */}
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)", marginBottom: 32 }} />

        <p style={{ fontSize: 13, color: "#7B8DB5", marginBottom: 24, fontWeight: 500 }}>
          Enter Access Code To Continue
        </p>

        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Access Code"
          autoFocus
          style={{
            width: "100%", padding: "14px 18px", borderRadius: 12, fontSize: 14,
            background: "rgba(255,255,255,0.04)", border: error ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(99,102,241,0.12)",
            color: "#ECF0FF", outline: "none", textAlign: "center",
            letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace",
            transition: "border-color 0.2s",
            boxSizing: "border-box",
          }}
        />

        {error && (
          <p style={{ fontSize: 12, color: "#EF4444", marginTop: 12, fontWeight: 600 }}>
            Invalid Access Code
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 12, fontSize: 13,
            fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            background: loading ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.2)",
            border: "1px solid rgba(99,102,241,0.25)",
            color: "#C4B5FD", cursor: loading ? "wait" : "pointer",
            marginTop: 20, transition: "all 0.2s",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {loading ? "Verifying..." : "Enter"}
        </button>

        <p style={{ fontSize: 10, color: "#475569", marginTop: 28, fontWeight: 500 }}>
          Authorized Personnel Only
        </p>
      </form>
    </div>
  )
}
