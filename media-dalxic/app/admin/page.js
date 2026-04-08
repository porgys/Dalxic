"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

const PLAN_OPTIONS = [
  { group: "Non Professionals (Individuals)", plans: [
    { key: "individual_basic", label: "Basic — Casual Verification" },
    { key: "individual_standard", label: "Standard — Power Verification" },
    { key: "individual_premium", label: "Premium — Forensic Suite" },
  ]},
  { group: "News Presenters & Journalists", plans: [
    { key: "journalist_basic", label: "Basic — Newsroom Starter" },
    { key: "journalist_standard", label: "Standard — Press Verification" },
    { key: "journalist_premium", label: "Premium — Editorial Intelligence" },
  ]},
  { group: "Broadcast Organisations & Media Groups", plans: [
    { key: "broadcast_basic", label: "Basic — Broadcast Starter" },
    { key: "broadcast_standard", label: "Standard — Broadcast Operations" },
    { key: "broadcast_premium", label: "Premium — Enterprise Broadcast" },
  ]},
  { group: "Government & Judiciary", plans: [
    { key: "gov_basic", label: "Basic — Institutional Starter" },
    { key: "gov_standard", label: "Standard — Judicial Operations" },
    { key: "gov_premium", label: "Premium — Sovereign Operations" },
  ]},
  { group: "Legacy", plans: [
    { key: "free", label: "Free (default)" },
    { key: "sentinel", label: "Sentinel (legacy)" },
    { key: "guardian", label: "Guardian (legacy)" },
    { key: "vanguard", label: "Vanguard (legacy)" },
    { key: "citadel", label: "Citadel (legacy)" },
    { key: "sovereign", label: "Sovereign (legacy)" },
  ]},
]

export default function AdminDashboard() {
  const [adminUid, setAdminUid] = useState(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [tab, setTab] = useState("users") // users | audit
  const [users, setUsers] = useState([])
  const [audit, setAudit] = useState([])
  const [search, setSearch] = useState("")
  const [assigning, setAssigning] = useState(null) // uid being assigned
  const [selectedPlan, setSelectedPlan] = useState("")
  const [msg, setMsg] = useState("")

  // Auth check
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setAdminUid(user.uid)
      } else {
        setLoading(false)
        setDenied(true)
      }
    })
  }, [])

  // Helper — get Firebase ID token for Authorization header
  async function getAuthHeaders() {
    const user = auth.currentUser
    if (!user) return null
    const token = await user.getIdToken()
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
  }

  // Load data once we have adminUid
  useEffect(() => {
    if (!adminUid) return
    loadUsers()
    loadAudit()
  }, [adminUid])

  async function loadUsers() {
    try {
      const headers = await getAuthHeaders()
      if (!headers) { setDenied(true); setLoading(false); return }
      const res = await fetch("/api/admin/users", { headers })
      const data = await res.json()
      if (data.error) { setDenied(true); setLoading(false); return }
      setUsers(data.users || [])
      setLoading(false)
    } catch {
      setDenied(true); setLoading(false)
    }
  }

  async function loadAudit() {
    try {
      const headers = await getAuthHeaders()
      if (!headers) return
      const res = await fetch("/api/admin/audit?limit=100", { headers })
      const data = await res.json()
      if (!data.error) setAudit(data.logs || [])
    } catch { }
  }

  async function assignPlan(targetUid) {
    if (!selectedPlan) return
    setMsg("")
    try {
      const headers = await getAuthHeaders()
      if (!headers) return
      const res = await fetch("/api/admin/assign-plan", {
        method: "POST",
        headers,
        body: JSON.stringify({ targetUid, planKey: selectedPlan }),
      })
      const data = await res.json()
      if (data.success) {
        setMsg(`Assigned ${data.planName} to ${targetUid}`)
        setAssigning(null)
        setSelectedPlan("")
        loadUsers()
        loadAudit()
      } else {
        setMsg(`Error: ${data.error}`)
      }
    } catch (e) {
      setMsg(`Network error: ${e.message}`)
    }
  }

  const filtered = users.filter(u => {
    if (!search) return true
    const s = search.toLowerCase()
    return (u.uid || "").toLowerCase().includes(s) ||
      (u.email || "").toLowerCase().includes(s) ||
      (u.displayName || "").toLowerCase().includes(s) ||
      (u.plan || "").toLowerCase().includes(s) ||
      (u.planName || "").toLowerCase().includes(s)
  })

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spin-anim" style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", margin: "0 auto 16px" }} />
          <span style={{ color: "var(--txM)", fontSize: 14 }}>Loading admin dashboard...</span>
        </div>
      </div>
    )
  }

  if (denied) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="glass" style={{ padding: "48px 56px", textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: "var(--re)" }}>&#9888;</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Access Denied</h2>
          <p style={{ color: "var(--txM)", lineHeight: 1.6, marginBottom: 24 }}>
            This dashboard is restricted to Dalxic administrators. You must be signed in with an admin account.
          </p>
          <Link href="/auth" className="btn btn-primary">Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Nav */}
      <nav className="nav scrolled">
        <Link href="/?from=nav" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ display:"flex", flexDirection:"column" }}>
            <span style={{ fontWeight:800, fontSize:14, color:"#F0F4FF", lineHeight:1, display:"flex", gap:1, fontFamily:"'Plus Jakarta Sans','Space Grotesk',sans-serif" }}>{"Dalxıc".split("").map((c, i) => i === 4 ? <span key={i} style={{ display:"inline-block", position:"relative" }}>{"ı"}<span style={{ position:"absolute", top:-5, left:"50%", transform:"translateX(-50%)", width:5, height:5, borderRadius:"50%", background:"#818CF8", boxShadow:"0 0 8px #6366F1" }} /></span> : <span key={i} style={{ display:"inline-block" }}>{c === " " ? "\u00A0" : c}</span>)}</span>
            <span style={{ fontWeight:500, fontSize:10, color:"#A78BFA", letterSpacing:"0.15em", textTransform:"uppercase", marginTop:3, fontFamily:"'DM Mono','JetBrains Mono',monospace" }}>Admin Panel</span>
          </div>
        </Link>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/" className="btn btn-ghost btn-sm">Home</Link>
          <Link href="/workstation" className="btn btn-primary btn-sm">Scan</Link>
        </div>
      </nav>

      <div style={{ paddingTop: 100, paddingBottom: 60 }}>
        <div className="container" style={{ maxWidth: 1100 }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Dalxic Administration</div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, letterSpacing: -1 }}>
              User & <span className="gradient-text">Plan Management</span>
            </h1>
            <p style={{ color: "var(--txM)", fontSize: 14, marginTop: 8 }}>
              {users.length} registered users &middot; Assign packages, view usage, audit changes
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {[["users", `Users (${users.length})`], ["audit", `Audit Log (${audit.length})`]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                style={{
                  padding: "10px 22px", borderRadius: 10, cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                  background: tab === key ? "rgba(99,102,241,0.12)" : "transparent",
                  border: tab === key ? "1px solid rgba(99,102,241,0.3)" : "1px solid var(--border)",
                  color: tab === key ? "var(--primaryL)" : "var(--txM)",
                }}>{label}</button>
            ))}
          </div>

          {/* Status message */}
          {msg && (
            <div style={{ padding: "12px 20px", borderRadius: 10, marginBottom: 20, background: msg.startsWith("Error") ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${msg.startsWith("Error") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`, color: msg.startsWith("Error") ? "var(--re)" : "var(--gr)", fontSize: 13 }}>
              {msg}
              <button onClick={() => setMsg("")} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 16 }}>&times;</button>
            </div>
          )}

          {/* ═══════ USERS TAB ═══════ */}
          {tab === "users" && (
            <>
              {/* Search */}
              <input
                className="input"
                placeholder="Search by UID, email, name or plan..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ maxWidth: 400, marginBottom: 20 }}
              />

              {/* User table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["User", "Plan", "Category", "Tier", "Scans Used", "Modules", "Actions"].map(h => (
                        <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "var(--txM)", fontWeight: 600, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => (
                      <tr key={u.uid} style={{ borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = ""}>

                        {/* User */}
                        <td style={{ padding: "14px 14px" }}>
                          <div style={{ fontWeight: 600, color: "var(--tx)", fontSize: 13 }}>
                            {u.displayName || "—"}
                            {u.role === "admin" && <span style={{ marginLeft: 6, padding: "2px 8px", borderRadius: 6, background: "rgba(245,158,11,0.15)", color: "#FCD34D", fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>ADMIN</span>}
                          </div>
                          <div style={{ color: "var(--txD)", fontSize: 11, marginTop: 2 }}>{u.email || u.uid.slice(0, 16) + "..."}</div>
                        </td>

                        {/* Plan */}
                        <td style={{ padding: "14px 14px" }}>
                          <span style={{ fontWeight: 600, color: u.plan === "free" ? "var(--txM)" : "var(--primaryL)" }}>{u.planName}</span>
                          <div style={{ fontSize: 10, color: "var(--txD)", marginTop: 2 }}>{u.plan}</div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: "14px 14px", color: "var(--txM)" }}>
                          {u.planCategory || "—"}
                        </td>

                        {/* Tier */}
                        <td style={{ padding: "14px 14px" }}>
                          {u.planTier ? (
                            <span style={{
                              padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                              background: u.planTier === "premium" ? "rgba(167,139,250,0.12)" : u.planTier === "standard" ? "rgba(99,102,241,0.12)" : "rgba(34,211,238,0.12)",
                              color: u.planTier === "premium" ? "#A78BFA" : u.planTier === "standard" ? "#818CF8" : "#22D3EE",
                            }}>{u.planTier}</span>
                          ) : "—"}
                        </td>

                        {/* Scans */}
                        <td style={{ padding: "14px 14px", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                          <span style={{ color: "var(--tx)" }}>{u.scansUsed}</span>
                          <span style={{ color: "var(--txD)" }}> / {u.scansPerMonth === -1 ? "\u221E" : u.scansPerMonth}</span>
                        </td>

                        {/* Modules */}
                        <td style={{ padding: "14px 14px" }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {(u.modules || []).slice(0, 3).map(m => (
                              <span key={m} style={{ padding: "2px 6px", borderRadius: 4, background: "var(--surf2)", color: "var(--txM)", fontSize: 10 }}>{m}</span>
                            ))}
                            {(u.modules || []).length > 3 && <span style={{ fontSize: 10, color: "var(--txD)" }}>+{u.modules.length - 3}</span>}
                            {(!u.modules || u.modules.length === 0) && <span style={{ color: "var(--txD)", fontSize: 11 }}>—</span>}
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "14px 14px" }}>
                          {assigning === u.uid ? (
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <select
                                value={selectedPlan}
                                onChange={e => setSelectedPlan(e.target.value)}
                                style={{ background: "var(--surf)", color: "var(--tx)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", fontSize: 12, maxWidth: 200 }}
                              >
                                <option value="">Select plan...</option>
                                {PLAN_OPTIONS.map(g => (
                                  <optgroup key={g.group} label={g.group}>
                                    {g.plans.map(p => (
                                      <option key={p.key} value={p.key}>{p.label}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                              <button onClick={() => assignPlan(u.uid)} disabled={!selectedPlan}
                                style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: selectedPlan ? "pointer" : "default", fontSize: 12, fontWeight: 600, background: selectedPlan ? "var(--primary)" : "var(--border)", color: "#fff" }}>
                                Assign
                              </button>
                              <button onClick={() => { setAssigning(null); setSelectedPlan("") }}
                                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "none", cursor: "pointer", fontSize: 12, color: "var(--txM)" }}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => { setAssigning(u.uid); setSelectedPlan(u.plan || "") }}
                              style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "none", cursor: "pointer", fontSize: 12, color: "var(--primaryL)", fontWeight: 600 }}>
                              Change Plan
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--txM)" }}>
                  {search ? "No users match your search" : "No users found"}
                </div>
              )}
            </>
          )}

          {/* ═══════ AUDIT TAB ═══════ */}
          {tab === "audit" && (
            <>
              {audit.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--txM)" }}>
                  No audit log entries yet. Plan assignments will appear here.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Timestamp", "Action", "Target User", "Plan Assigned", "Admin", "IP"].map(h => (
                          <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "var(--txM)", fontWeight: 600, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {audit.map(log => (
                        <tr key={log.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "12px 14px", color: "var(--txM)", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "rgba(99,102,241,0.12)", color: "#818CF8" }}>
                              {log.action || "—"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px", color: "var(--tx)", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                            {(log.targetUid || "—").slice(0, 20)}...
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontWeight: 600, color: "var(--primaryL)" }}>{log.planName || "—"}</span>
                            <div style={{ fontSize: 10, color: "var(--txD)", marginTop: 2 }}>{log.planKey || ""}</div>
                          </td>
                          <td style={{ padding: "12px 14px", color: "var(--txM)", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                            {(log.adminUid || "—").slice(0, 16)}...
                          </td>
                          <td style={{ padding: "12px 14px", color: "var(--txD)", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                            {log.ip || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <footer style={{ padding: "24px 0", borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <span style={{ fontSize: 11, color: "var(--txD)" }}>Dalxic Admin &middot; Restricted Access</span>
      </footer>
    </div>
  )
}
