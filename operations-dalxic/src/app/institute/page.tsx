"use client"
import { useState } from "react"

/* ═══════════════════════════════════════════════════════════════
   DALXICINSTITUTE — Dashboard / Enrollment / Fees / Staff
   Service organisations: schools, NGOs, training centres.
   ═══════════════════════════════════════════════════════════════ */

const EMERALD    = "#10B981"
const EMERALD_L  = "#34D399"
const INST_COL   = "#0EA5E9"
const INST_L     = "#38BDF8"
const BG         = "#040A0F"

type Screen = "dashboard" | "enrollment" | "fees" | "schedule" | "staff"

interface Member {
  id: string
  name: string
  role: string
  status: "active" | "inactive" | "graduated" | "suspended"
  joinDate: string
  group: string
  contact?: string
  balance: number
}

interface StaffMember {
  id: string
  name: string
  role: string
  department: string
  status: "active" | "inactive"
  phone: string
}

/* ── Demo data ── */
const DEMO_MEMBERS: Member[] = [
  { id: "m1", name: "Kwame Mensah", role: "Student", status: "active", joinDate: "2025-09-01", group: "Form 3A", balance: 0 },
  { id: "m2", name: "Ama Serwaa", role: "Student", status: "active", joinDate: "2025-09-01", group: "Form 3A", contact: "0244123456", balance: -150 },
  { id: "m3", name: "Yaw Boateng", role: "Student", status: "active", joinDate: "2025-09-01", group: "Form 2B", balance: 0 },
  { id: "m4", name: "Efua Darkwa", role: "Student", status: "active", joinDate: "2024-09-01", group: "Form 4", balance: -300 },
  { id: "m5", name: "Kofi Adjei", role: "Student", status: "graduated", joinDate: "2022-09-01", group: "Alumni 2025", balance: 0 },
  { id: "m6", name: "Abena Ofori", role: "Member", status: "active", joinDate: "2026-01-15", group: "Youth Group", balance: -50 },
  { id: "m7", name: "Nana Akufo", role: "Trainee", status: "active", joinDate: "2026-02-01", group: "Batch 12", contact: "0551987654", balance: -200 },
  { id: "m8", name: "Seli Tetteh", role: "Student", status: "suspended", joinDate: "2025-09-01", group: "Form 3B", balance: -450 },
]

const DEMO_STAFF: StaffMember[] = [
  { id: "s1", name: "Dr. Emmanuel Asante", role: "Director", department: "Administration", status: "active", phone: "0244555111" },
  { id: "s2", name: "Grace Osei", role: "Teacher", department: "Mathematics", status: "active", phone: "0244555222" },
  { id: "s3", name: "James Appiah", role: "Teacher", department: "English", status: "active", phone: "0244555333" },
  { id: "s4", name: "Mercy Boateng", role: "Accountant", department: "Finance", status: "active", phone: "0244555444" },
  { id: "s5", name: "Samuel Owusu", role: "Security", department: "Operations", status: "active", phone: "0244555555" },
  { id: "s6", name: "Florence Mensah", role: "Teacher", department: "Science", status: "active", phone: "0244555666" },
  { id: "s7", name: "Daniel Tetteh", role: "Teacher", department: "ICT", status: "active", phone: "0244555777" },
  { id: "s8", name: "Lydia Asare", role: "Librarian", department: "Library", status: "active", phone: "0244555888" },
  { id: "s9", name: "Patrick Kwarteng", role: "Counsellor", department: "Student Affairs", status: "active", phone: "0244555999" },
  { id: "s10", name: "Hannah Adu", role: "Nurse", department: "Sick Bay", status: "inactive", phone: "0244555000" },
]

/* ── Styles ── */
const glass = {
  background: "rgba(14,165,233,0.03)",
  border: "1px solid rgba(14,165,233,0.08)",
  borderRadius: 16,
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  transform: "translateZ(0)" as const,
  willChange: "transform" as const,
} as const

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  fontSize: 13,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(14,165,233,0.12)",
  color: "#ECF5F0",
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#3A6B7A",
  marginBottom: 5,
}

const btnPrimary: React.CSSProperties = {
  padding: "10px 22px",
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#fff",
  cursor: "pointer",
  background: `linear-gradient(135deg, ${INST_COL}, #0284C7)`,
  border: "none",
  fontFamily: "'DM Sans', sans-serif",
  boxShadow: `0 4px 16px ${INST_COL}25`,
}

/* ── Header ── */
function Header({ screen, setScreen, orgName }: { screen: Screen; setScreen: (s: Screen) => void; orgName: string }) {
  const tabs: { key: Screen; label: string; icon: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: "🏠" },
    { key: "enrollment", label: "Enrollment", icon: "🎓" },
    { key: "fees", label: "Fees", icon: "💰" },
    { key: "schedule", label: "Schedule", icon: "📅" },
    { key: "staff", label: "Staff", icon: "👥" },
  ]
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 30, padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(4,10,15,0.9)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${INST_COL}10` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontWeight: 300, fontSize: 14, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif" }}>Dalxic</span>
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif", background: `linear-gradient(135deg, ${INST_COL}, ${INST_L})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Institute</span>
        <span style={{ fontSize: 11, color: "#3A6B7A", marginLeft: 8, fontFamily: "'DM Mono', monospace" }}>{orgName}</span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setScreen(t.key)}
            style={{
              padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
              background: screen === t.key ? `${INST_COL}15` : "transparent",
              color: screen === t.key ? INST_L : "#6B9B8A",
              border: screen === t.key ? `1px solid ${INST_COL}25` : "1px solid transparent",
            }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            <span className="hidden-mobile">{t.label}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: `${EMERALD}08`, border: `1px solid ${EMERALD}15` }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: EMERALD, display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: EMERALD, fontFamily: "'DM Sans', sans-serif" }}>Online</span>
        </div>
      </div>
    </div>
  )
}

/* ── Dashboard ── */
function DashboardScreen({ members, staff, setScreen }: { members: Member[]; staff: StaffMember[]; setScreen: (s: Screen) => void }) {
  const active = members.filter(m => m.status === "active")
  const totalOwed = members.reduce((a, m) => a + Math.abs(Math.min(0, m.balance)), 0)
  const groups = [...new Set(members.map(m => m.group))]

  const stats = [
    { label: "Total Members", value: members.length.toString(), color: INST_COL },
    { label: "Active", value: active.length.toString(), color: EMERALD },
    { label: "Outstanding Fees", value: `GHS ${totalOwed.toLocaleString()}`, color: "#EF4444" },
    { label: "Staff", value: staff.length.toString(), color: INST_L },
  ]

  return (
    <div style={{ padding: "28px 28px 60px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Overview of your institution</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...glass, padding: "22px 20px" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Quick actions */}
        <div style={{ ...glass, padding: "24px 22px" }}>
          <div style={{ ...labelStyle, marginBottom: 16 }}>Quick Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Enroll New Member", icon: "🎓", screen: "enrollment" as Screen, color: INST_COL },
              { label: "Manage Fees", icon: "💰", screen: "fees" as Screen, color: "#F59E0B" },
              { label: "View Schedule", icon: "📅", screen: "schedule" as Screen, color: EMERALD },
              { label: "Staff Management", icon: "👥", screen: "staff" as Screen, color: "#8B5CF6" },
            ].map(a => (
              <button key={a.label} onClick={() => setScreen(a.screen)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: `${a.color}08`, border: `1px solid ${a.color}15`, cursor: "pointer", textAlign: "left", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#ECF5F0" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${a.color}40` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${a.color}15` }}>
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Groups overview */}
        <div style={{ ...glass, padding: "24px 22px" }}>
          <div style={{ ...labelStyle, marginBottom: 16 }}>Groups / Classes</div>
          {groups.map(g => {
            const count = members.filter(m => m.group === g && m.status === "active").length
            return (
              <div key={g} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${INST_COL}06` }}>
                <span style={{ fontSize: 13, color: "#ECF5F0", fontFamily: "'DM Sans', sans-serif" }}>{g}</span>
                <span style={{ fontSize: 12, color: INST_L, fontWeight: 700, fontFamily: "'DM Mono', monospace", padding: "2px 8px", background: `${INST_COL}10`, borderRadius: 6 }}>{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Enrollment Screen ── */
function EnrollmentScreen({ members, setMembers }: { members: Member[]; setMembers: (m: Member[]) => void }) {
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: "", role: "Student", group: "", contact: "" })
  const [filter, setFilter] = useState("all")

  const addMember = () => {
    if (!form.name || !form.group) return
    const m: Member = {
      id: `m${Date.now()}`,
      name: form.name,
      role: form.role,
      status: "active",
      joinDate: new Date().toISOString().slice(0, 10),
      group: form.group,
      contact: form.contact || undefined,
      balance: 0,
    }
    setMembers([m, ...members])
    setForm({ name: "", role: "Student", group: "", contact: "" })
    setShowAdd(false)
  }

  const filtered = members.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all" || m.status === filter
    return matchSearch && matchFilter
  })

  const statusColor = (s: string) => s === "active" ? EMERALD : s === "graduated" ? INST_COL : s === "suspended" ? "#EF4444" : "#6B9B8A"

  return (
    <div style={{ padding: "28px 28px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>Enrollment</h1>
          <p style={{ fontSize: 13, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{members.length} registered members</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: 220 }} />
          <div style={{ display: "flex", gap: 4 }}>
            {["all", "active", "graduated", "suspended"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif", textTransform: "capitalize",
                  background: filter === f ? `${INST_COL}20` : "rgba(255,255,255,0.03)", color: filter === f ? INST_L : "#6B9B8A" }}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(!showAdd)} style={btnPrimary}>{showAdd ? "Cancel" : "+ Enroll"}</button>
        </div>
      </div>

      {showAdd && (
        <div style={{ ...glass, padding: "22px", marginBottom: 20, animation: "fadeUp 0.3s ease" }}>
          <div style={{ ...labelStyle, marginBottom: 14, color: INST_COL }}>New Enrollment</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} placeholder="e.g. Kwame Mensah" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select style={{ ...inputStyle, appearance: "auto" }} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {["Student", "Member", "Trainee", "Volunteer"].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Group / Class *</label>
              <input style={inputStyle} placeholder="e.g. Form 3A" value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Contact</label>
              <input style={inputStyle} placeholder="0244123456" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
            </div>
            <button onClick={addMember} style={btnPrimary}>Enroll</button>
          </div>
        </div>
      )}

      {/* Members table */}
      <div style={{ ...glass, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${INST_COL}10` }}>
              {["Name", "Role", "Group", "Joined", "Contact", "Balance", "Status", ""].map((h, i) => (
                <th key={i} style={{ padding: "12px 14px", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A6B7A" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} style={{ borderBottom: `1px solid ${INST_COL}06`, transition: "background 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = `${INST_COL}04` }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#ECF5F0" }}>{m.name}</td>
                <td style={{ padding: "10px 14px", color: "#6B9B8A" }}>{m.role}</td>
                <td style={{ padding: "10px 14px", fontFamily: "'DM Mono', monospace", fontSize: 11, color: INST_L }}>{m.group}</td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: "#6B9B8A", fontFamily: "'DM Mono', monospace" }}>{m.joinDate}</td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: "#6B9B8A", fontFamily: "'DM Mono', monospace" }}>{m.contact || "—"}</td>
                <td style={{ padding: "10px 14px", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: m.balance < 0 ? "#EF4444" : EMERALD }}>
                  {m.balance < 0 ? `GHS ${Math.abs(m.balance)}` : "Paid"}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: `${statusColor(m.status)}12`, color: statusColor(m.status) }}>
                    {m.status}
                  </span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <button style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, border: `1px solid ${INST_COL}15`, background: "transparent", color: "#6B9B8A", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Fees Screen ── */
function FeesScreen({ members }: { members: Member[] }) {
  const owing = members.filter(m => m.balance < 0)
  const totalOwed = owing.reduce((a, m) => a + Math.abs(m.balance), 0)

  return (
    <div style={{ padding: "28px 28px 60px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>Fee Management</h1>
        <p style={{ fontSize: 13, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{owing.length} members with outstanding balances</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 28 }}>
        <div style={{ ...glass, padding: "22px 20px" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#EF4444", fontFamily: "'Space Grotesk', sans-serif" }}>GHS {totalOwed.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Total Outstanding</div>
        </div>
        <div style={{ ...glass, padding: "22px 20px" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#F59E0B", fontFamily: "'Space Grotesk', sans-serif" }}>{owing.length}</div>
          <div style={{ fontSize: 11, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Owing Members</div>
        </div>
        <div style={{ ...glass, padding: "22px 20px" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: EMERALD, fontFamily: "'Space Grotesk', sans-serif" }}>{members.filter(m => m.balance >= 0).length}</div>
          <div style={{ fontSize: 11, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Fully Paid</div>
        </div>
      </div>

      <div style={{ ...glass, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${INST_COL}10` }}>
              {["Member", "Group", "Amount Owed", "Status", "Action"].map((h, i) => (
                <th key={i} style={{ padding: "12px 14px", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A6B7A" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {owing.map(m => (
              <tr key={m.id} style={{ borderBottom: `1px solid ${INST_COL}06` }}>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#ECF5F0" }}>{m.name}</td>
                <td style={{ padding: "10px 14px", color: INST_L, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{m.group}</td>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#EF4444", fontFamily: "'Space Grotesk', sans-serif" }}>GHS {Math.abs(m.balance)}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>Owing</span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <button style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: `${EMERALD}15`, border: `1px solid ${EMERALD}25`, color: EMERALD_L, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Record Payment</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Staff Screen ── */
function StaffScreen({ staff, setStaff }: { staff: StaffMember[]; setStaff: (s: StaffMember[]) => void }) {
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [filterDept, setFilterDept] = useState("All")
  const [form, setForm] = useState({ name: "", role: "", department: "", phone: "" })

  const departments = ["All", ...new Set(staff.map(s => s.department))]

  const addStaff = () => {
    if (!form.name || !form.role || !form.department) return
    const s: StaffMember = {
      id: `s${Date.now()}`,
      name: form.name,
      role: form.role,
      department: form.department,
      status: "active",
      phone: form.phone || "—",
    }
    setStaff([s, ...staff])
    setForm({ name: "", role: "", department: "", phone: "" })
    setShowAdd(false)
  }

  const filtered = staff.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase())
    const matchDept = filterDept === "All" || s.department === filterDept
    return matchSearch && matchDept
  })

  const roleColor = (r: string) => r === "Director" ? "#F59E0B" : r === "Teacher" ? INST_COL : r === "Accountant" ? EMERALD : r === "Security" ? "#EF4444" : "#8B5CF6"

  return (
    <div style={{ padding: "28px 28px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>Staff</h1>
          <p style={{ fontSize: 13, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{staff.length} team members</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: 200 }} />
          <div style={{ display: "flex", gap: 4 }}>
            {departments.map(d => (
              <button key={d} onClick={() => setFilterDept(d)}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif",
                  background: filterDept === d ? `${INST_COL}20` : "rgba(255,255,255,0.03)", color: filterDept === d ? INST_L : "#6B9B8A" }}>
                {d}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(!showAdd)} style={btnPrimary}>{showAdd ? "Cancel" : "+ Add Staff"}</button>
        </div>
      </div>

      {showAdd && (
        <div style={{ ...glass, padding: "22px", marginBottom: 20, animation: "fadeUp 0.3s ease" }}>
          <div style={{ ...labelStyle, marginBottom: 14, color: INST_COL }}>New Staff Member</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} placeholder="e.g. Grace Osei" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Role *</label>
              <input style={inputStyle} placeholder="e.g. Teacher" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Department *</label>
              <input style={inputStyle} placeholder="e.g. Mathematics" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} placeholder="0244555666" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <button onClick={addStaff} style={btnPrimary}>Add</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Staff", value: staff.length.toString(), color: INST_COL },
          { label: "Active", value: staff.filter(s => s.status === "active").length.toString(), color: EMERALD },
          { label: "Departments", value: [...new Set(staff.map(s => s.department))].length.toString(), color: "#8B5CF6" },
          { label: "Teaching Staff", value: staff.filter(s => s.role === "Teacher").length.toString(), color: INST_L },
        ].map(s => (
          <div key={s.label} style={{ ...glass, padding: "18px 16px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {filtered.map(s => (
          <div key={s.id} style={{ ...glass, padding: "22px 20px", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${INST_COL}25` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${roleColor(s.role)}12`, border: `1px solid ${roleColor(s.role)}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: roleColor(s.role), fontFamily: "'Space Grotesk', sans-serif" }}>
                  {s.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#ECF5F0", fontFamily: "'Space Grotesk', sans-serif" }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: roleColor(s.role), fontFamily: "'DM Sans', sans-serif", marginTop: 2, fontWeight: 600 }}>{s.role}</div>
                </div>
              </div>
              <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                background: s.status === "active" ? `${EMERALD}12` : "rgba(239,68,68,0.1)",
                color: s.status === "active" ? EMERALD_L : "#EF4444" }}>{s.status}</span>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <div>
                <div style={{ fontSize: 9, color: "#3A6B7A", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Department</div>
                <div style={{ fontSize: 12, color: "#6B9B8A", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{s.department}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#3A6B7A", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Phone</div>
                <div style={{ fontSize: 12, color: "#6B9B8A", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{s.phone}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Schedule Data ── */
interface ScheduleSlot {
  id: string
  day: number // 0=Mon, 4=Fri
  period: number // 0-7
  subject: string
  teacher: string
  room: string
  group: string
  color: string
}

const PERIODS = [
  { label: "Period 1", time: "7:30 - 8:15" },
  { label: "Period 2", time: "8:15 - 9:00" },
  { label: "Break", time: "9:00 - 9:30" },
  { label: "Period 3", time: "9:30 - 10:15" },
  { label: "Period 4", time: "10:15 - 11:00" },
  { label: "Period 5", time: "11:00 - 11:45" },
  { label: "Lunch", time: "11:45 - 12:30" },
  { label: "Period 6", time: "12:30 - 1:15" },
  { label: "Period 7", time: "1:15 - 2:00" },
]

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

const DEMO_SCHEDULE: ScheduleSlot[] = [
  // Monday
  { id: "sc1", day: 0, period: 0, subject: "Mathematics", teacher: "Grace Osei", room: "Room 1A", group: "Form 3A", color: "#0EA5E9" },
  { id: "sc2", day: 0, period: 1, subject: "English", teacher: "James Appiah", room: "Room 1A", group: "Form 3A", color: "#8B5CF6" },
  { id: "sc3", day: 0, period: 3, subject: "Science", teacher: "Grace Osei", room: "Lab 1", group: "Form 3A", color: "#10B981" },
  { id: "sc4", day: 0, period: 4, subject: "Social Studies", teacher: "James Appiah", room: "Room 1A", group: "Form 3A", color: "#F59E0B" },
  { id: "sc5", day: 0, period: 5, subject: "ICT", teacher: "Grace Osei", room: "Computer Lab", group: "Form 3A", color: "#EC4899" },
  { id: "sc6", day: 0, period: 7, subject: "French", teacher: "James Appiah", room: "Room 2B", group: "Form 3A", color: "#6366F1" },
  { id: "sc7", day: 0, period: 8, subject: "Physical Education", teacher: "Samuel Owusu", room: "Field", group: "Form 3A", color: "#EF4444" },
  // Tuesday
  { id: "sc8", day: 1, period: 0, subject: "English", teacher: "James Appiah", room: "Room 1A", group: "Form 3A", color: "#8B5CF6" },
  { id: "sc9", day: 1, period: 1, subject: "Mathematics", teacher: "Grace Osei", room: "Room 1A", group: "Form 3A", color: "#0EA5E9" },
  { id: "sc10", day: 1, period: 3, subject: "Religious & Moral Ed.", teacher: "James Appiah", room: "Room 1A", group: "Form 3A", color: "#D97706" },
  { id: "sc11", day: 1, period: 4, subject: "Creative Arts", teacher: "Grace Osei", room: "Art Room", group: "Form 3A", color: "#EC4899" },
  { id: "sc12", day: 1, period: 5, subject: "Science", teacher: "Grace Osei", room: "Lab 1", group: "Form 3A", color: "#10B981" },
  { id: "sc13", day: 1, period: 7, subject: "Ghanaian Language (Twi)", teacher: "James Appiah", room: "Room 1A", group: "Form 3A", color: "#F59E0B" },
  { id: "sc14", day: 1, period: 8, subject: "Mathematics", teacher: "Grace Osei", room: "Room 1A", group: "Form 3A", color: "#0EA5E9" },
  // Wednesday
  { id: "sc15", day: 2, period: 0, subject: "Science", teacher: "Grace Osei", room: "Lab 1", group: "Form 3A", color: "#10B981" },
  { id: "sc16", day: 2, period: 1, subject: "Social Studies", teacher: "James Appiah", room: "Room 1A", group: "Form 3A", color: "#F59E0B" },
  { id: "sc17", day: 2, period: 3, subject: "Mathematics", teacher: "Grace Osei", room: "Room 1A", group: "Form 3A", color: "#0EA5E9" },
  { id: "sc18", day: 2, period: 4, subject: "English", teacher: "James Appiah", room: "Room 1A", group: "Form 3A", color: "#8B5CF6" },
  { id: "sc19", day: 2, period: 5, subject: "ICT", teacher: "Grace Osei", room: "Computer Lab", group: "Form 3A", color: "#EC4899" },
  { id: "sc20", day: 2, period: 7, subject: "Physical Education", teacher: "Samuel Owusu", room: "Field", group: "Form 3A", color: "#EF4444" },
  // Thursday
  { id: "sc21", day: 3, period: 0, subject: "English", teacher: "James Appiah", room: "Room 1A", group: "Form 3A", color: "#8B5CF6" },
  { id: "sc22", day: 3, period: 1, subject: "French", teacher: "James Appiah", room: "Room 2B", group: "Form 3A", color: "#6366F1" },
  { id: "sc23", day: 3, period: 3, subject: "Mathematics", teacher: "Grace Osei", room: "Room 1A", group: "Form 3A", color: "#0EA5E9" },
  { id: "sc24", day: 3, period: 4, subject: "Science", teacher: "Grace Osei", room: "Lab 1", group: "Form 3A", color: "#10B981" },
  { id: "sc25", day: 3, period: 5, subject: "Creative Arts", teacher: "Grace Osei", room: "Art Room", group: "Form 3A", color: "#EC4899" },
  { id: "sc26", day: 3, period: 7, subject: "Social Studies", teacher: "James Appiah", room: "Room 1A", group: "Form 3A", color: "#F59E0B" },
  { id: "sc27", day: 3, period: 8, subject: "Religious & Moral Ed.", teacher: "James Appiah", room: "Room 1A", group: "Form 3A", color: "#D97706" },
  // Friday
  { id: "sc28", day: 4, period: 0, subject: "Mathematics", teacher: "Grace Osei", room: "Room 1A", group: "Form 3A", color: "#0EA5E9" },
  { id: "sc29", day: 4, period: 1, subject: "English", teacher: "James Appiah", room: "Room 1A", group: "Form 3A", color: "#8B5CF6" },
  { id: "sc30", day: 4, period: 3, subject: "Ghanaian Language (Twi)", teacher: "James Appiah", room: "Room 1A", group: "Form 3A", color: "#F59E0B" },
  { id: "sc31", day: 4, period: 4, subject: "Science", teacher: "Grace Osei", room: "Lab 1", group: "Form 3A", color: "#10B981" },
  { id: "sc32", day: 4, period: 5, subject: "Assembly / Club", teacher: "Dr. Emmanuel Asante", room: "Hall", group: "Form 3A", color: "#6B9B8A" },
]

/* ── Schedule Screen ── */
function ScheduleScreen() {
  const [selectedGroup, setSelectedGroup] = useState("Form 3A")
  const groups = [...new Set(DEMO_SCHEDULE.map(s => s.group))]
  const filtered = DEMO_SCHEDULE.filter(s => s.group === selectedGroup)

  const getSlot = (day: number, period: number) => filtered.find(s => s.day === day && s.period === period)

  // Count stats
  const totalLessons = filtered.length
  const subjects = [...new Set(filtered.map(s => s.subject))]
  const rooms = [...new Set(filtered.map(s => s.room))]

  return (
    <div style={{ padding: "28px 28px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>Timetable</h1>
          <p style={{ fontSize: 13, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{totalLessons} lessons per week across {subjects.length} subjects</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A6B7A" }}>Class:</span>
          <div style={{ display: "flex", gap: 4 }}>
            {groups.map(g => (
              <button key={g} onClick={() => setSelectedGroup(g)}
                style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif",
                  background: selectedGroup === g ? `${INST_COL}20` : "rgba(255,255,255,0.03)", color: selectedGroup === g ? INST_L : "#6B9B8A" }}>
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Lessons / Week", value: totalLessons.toString(), color: INST_COL },
          { label: "Subjects", value: subjects.length.toString(), color: EMERALD },
          { label: "Rooms Used", value: rooms.length.toString(), color: "#8B5CF6" },
          { label: "Teachers", value: [...new Set(filtered.map(s => s.teacher))].length.toString(), color: INST_L },
        ].map(s => (
          <div key={s.label} style={{ ...glass, padding: "18px 16px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Timetable grid */}
      <div style={{ ...glass, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${INST_COL}10` }}>
              <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A6B7A", width: 100 }}>Time</th>
              {DAYS.map(d => (
                <th key={d} style={{ padding: "12px 14px", textAlign: "center", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A6B7A" }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p, pi) => {
              const isBreak = p.label === "Break" || p.label === "Lunch"
              return (
                <tr key={pi} style={{ borderBottom: `1px solid ${INST_COL}06`, background: isBreak ? "rgba(255,255,255,0.015)" : "transparent" }}>
                  <td style={{ padding: "8px 14px", verticalAlign: "top" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: isBreak ? "#6B9B8A" : INST_L, fontFamily: "'DM Mono', monospace" }}>{p.label}</div>
                    <div style={{ fontSize: 9, color: "#3A6B5A", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{p.time}</div>
                  </td>
                  {DAYS.map((_, di) => {
                    if (isBreak) {
                      return <td key={di} style={{ padding: "8px 14px", textAlign: "center", color: "#3A6B5A", fontSize: 10, fontStyle: "italic" }}>{p.label}</td>
                    }
                    const slot = getSlot(di, pi)
                    return (
                      <td key={di} style={{ padding: "4px 6px", verticalAlign: "top" }}>
                        {slot ? (
                          <div style={{ padding: "8px 10px", borderRadius: 8, background: `${slot.color}10`, border: `1px solid ${slot.color}18`, transition: "all 0.2s" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: slot.color, marginBottom: 3 }}>{slot.subject}</div>
                            <div style={{ fontSize: 9, color: "#6B9B8A", fontFamily: "'DM Mono', monospace" }}>{slot.teacher}</div>
                            <div style={{ fontSize: 9, color: "#3A6B5A", fontFamily: "'DM Mono', monospace", marginTop: 1 }}>{slot.room}</div>
                          </div>
                        ) : (
                          <div style={{ padding: "8px 10px", textAlign: "center", color: "#1A2A22", fontSize: 10 }}>—</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   INSTITUTE APP
   ═══════════════════════════════════════════════════════════════ */

export default function InstitutePage() {
  const [screen, setScreen] = useState<Screen>("dashboard")
  const [members, setMembers] = useState<Member[]>(DEMO_MEMBERS)
  const [staff, setStaff] = useState<StaffMember[]>(DEMO_STAFF)

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans', sans-serif", color: "#ECF5F0" }}>
      <style>{`
        @media (max-width: 900px) { .hidden-mobile { display: none !important; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      <Header screen={screen} setScreen={setScreen} orgName="Demo School" />
      {screen === "dashboard" && <DashboardScreen members={members} staff={staff} setScreen={setScreen} />}
      {screen === "enrollment" && <EnrollmentScreen members={members} setMembers={setMembers} />}
      {screen === "fees" && <FeesScreen members={members} />}
      {screen === "schedule" && <ScheduleScreen />}
      {screen === "staff" && <StaffScreen staff={staff} setStaff={setStaff} />}
    </div>
  )
}
