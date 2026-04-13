"use client"
import { useState, useEffect, useCallback } from "react"
import { useAuth, Session } from "@/lib/use-auth"

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

interface Group {
  id: string
  name: string
  type: string
  isActive: boolean
  _count: { members: number }
}

interface Member {
  id: string
  name: string
  role: string
  status: "active" | "inactive" | "graduated" | "suspended"
  phone: string | null
  email: string | null
  enrolledAt: string
  groupId: string | null
  group: { id: string; name: string } | null
  guardianName: string | null
  guardianPhone: string | null
  dateOfBirth: string | null
  gender: string | null
}

interface StaffMember {
  id: string
  name: string
  role: string
  department: string
  status: "active" | "inactive"
  phone: string
  email: string | null
  createdAt: string
}

interface FeeRecord {
  id: string
  memberId: string
  description: string
  amount: number
  paid: number
  balance: number
  status: "UNPAID" | "PARTIAL" | "PAID"
  dueDate: string | null
  member: { id: string; name: string; group: { name: string } | null }
}

interface FeeSummary {
  totalBilled: number
  totalCollected: number
  totalOutstanding: number
  collectionRate: number
  byStatus: { UNPAID: number; PARTIAL: number; PAID: number }
}

interface ScheduleEntry {
  id: string
  subject: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string
  groupId: string
  group: { id: string; name: string }
  staffId: string
  staff: { id: string; name: string }
}

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

const feedbackStyle: React.CSSProperties = {
  position: "fixed",
  top: 20,
  right: 28,
  zIndex: 100,
  padding: "12px 22px",
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif",
  backdropFilter: "blur(16px)",
  animation: "fadeUp 0.3s ease",
}

/* ── Subject color helper ── */
const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#0EA5E9",
  English: "#8B5CF6",
  Science: "#10B981",
  "Social Studies": "#F59E0B",
  ICT: "#EC4899",
  French: "#6366F1",
  "Physical Education": "#EF4444",
  "Religious & Moral Ed.": "#D97706",
  "Creative Arts": "#EC4899",
  "Ghanaian Language (Twi)": "#F59E0B",
  "Assembly / Club": "#6B9B8A",
}

function subjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] || INST_COL
}

/* ── Login Screen ── */
function LoginScreen({ onLogin }: { onLogin: (orgCode: string, pin: string) => Promise<{ success: boolean; error?: string }> }) {
  const [orgCode, setOrgCode] = useState("DEMO")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!orgCode.trim() || pin.length !== 4 || loading) return
    setLoading(true)
    setError("")
    const result = await onLogin(orgCode.trim(), pin)
    if (!result.success) {
      setError(result.error || "Login failed")
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ ...glass, padding: "48px 40px", width: 380, textAlign: "center" }}>
        <div style={{ marginBottom: 32 }}>
          <span style={{ fontWeight: 300, fontSize: 18, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif" }}>Dalxic</span>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif", background: `linear-gradient(135deg, ${INST_COL}, ${INST_L})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginLeft: 8 }}>Institute</span>
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ ...labelStyle, textAlign: "left" }}>Organisation Code</label>
          <input
            style={inputStyle}
            value={orgCode}
            onChange={e => setOrgCode(e.target.value.toUpperCase())}
            placeholder="ORG CODE"
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ ...labelStyle, textAlign: "left" }}>Operator PIN</label>
          <input
            style={{ ...inputStyle, fontSize: 28, fontFamily: "'DM Mono', monospace", textAlign: "center", letterSpacing: "0.4em" }}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={e => { const v = e.target.value.replace(/\D/g, ""); setPin(v) }}
            placeholder="----"
            onKeyDown={e => { if (e.key === "Enter") handleSubmit() }}
          />
        </div>
        {error && (
          <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>{error}</div>
        )}
        <button
          onClick={handleSubmit}
          disabled={pin.length !== 4 || loading}
          style={{ ...btnPrimary, width: "100%", padding: "14px 0", fontSize: 13, textAlign: "center", opacity: pin.length !== 4 || loading ? 0.5 : 1 }}
        >
          {loading ? "Authenticating..." : "Enter"}
        </button>
        <div style={{ marginTop: 32, fontSize: 10, color: "#3A6B7A", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>Powered By DalxicOperations</div>
      </div>
    </div>
  )
}

/* ── Header ── */
function Header({ screen, setScreen, session, onLogout }: { screen: Screen; setScreen: (s: Screen) => void; session: Session; onLogout: () => void }) {
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
        <span style={{ fontSize: 11, color: "#3A6B7A", marginLeft: 8, fontFamily: "'DM Mono', monospace" }}>{session.orgName}</span>
        <span style={{ fontSize: 10, color: "#2A4A5A", fontFamily: "'DM Mono', monospace" }}>{session.operatorName}</span>
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
        <button onClick={onLogout} style={{ ...labelStyle, cursor: "pointer", background: "transparent", border: "none", color: "#3A6B7A", marginBottom: 0 }}>End Session</button>
      </div>
    </div>
  )
}

/* ── Feedback toast ── */
function FeedbackToast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div style={{
      ...feedbackStyle,
      background: type === "success" ? `${EMERALD}20` : "rgba(239,68,68,0.15)",
      border: `1px solid ${type === "success" ? EMERALD : "#EF4444"}30`,
      color: type === "success" ? EMERALD_L : "#FCA5A5",
    }}>
      {message}
    </div>
  )
}

/* ── Dashboard ── */
function DashboardScreen({ members, staff, groups, feeSummary, setScreen }: { members: Member[]; staff: StaffMember[]; groups: Group[]; feeSummary: FeeSummary | null; setScreen: (s: Screen) => void }) {
  const active = members.filter(m => m.status === "active")
  const totalOutstanding = feeSummary ? (feeSummary.totalOutstanding / 100) : 0

  const stats = [
    { label: "Total Members", value: members.length.toString(), color: INST_COL },
    { label: "Active", value: active.length.toString(), color: EMERALD },
    { label: "Outstanding Fees", value: `GHS ${totalOutstanding.toLocaleString()}`, color: "#EF4444" },
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
          {groups.map(g => (
            <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${INST_COL}06` }}>
              <span style={{ fontSize: 13, color: "#ECF5F0", fontFamily: "'DM Sans', sans-serif" }}>{g.name}</span>
              <span style={{ fontSize: 12, color: INST_L, fontWeight: 700, fontFamily: "'DM Mono', monospace", padding: "2px 8px", background: `${INST_COL}10`, borderRadius: 6 }}>{g._count.members}</span>
            </div>
          ))}
          {groups.length === 0 && (
            <div style={{ fontSize: 12, color: "#3A6B5A", padding: "10px 0" }}>No groups yet</div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Enrollment Screen ── */
function EnrollmentScreen({ members, groups, onAddMember, onAddGroup, feedback }: { members: Member[]; groups: Group[]; onAddMember: (data: { name: string; role: string; groupId: string; phone: string }) => Promise<void>; onAddGroup: (data: { name: string; type: string }) => Promise<Group | null>; feedback: { message: string; type: "success" | "error" } | null }) {
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: "", role: "Student", groupId: "", phone: "" })
  const [filter, setFilter] = useState("all")
  const [submitting, setSubmitting] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupSubmitting, setNewGroupSubmitting] = useState(false)

  const addMember = async () => {
    if (!form.name || !form.groupId) return
    setSubmitting(true)
    await onAddMember({ name: form.name, role: form.role, groupId: form.groupId, phone: form.phone })
    setSubmitting(false)
    setForm({ name: "", role: "Student", groupId: "", phone: "" })
    setShowAdd(false)
  }

  const createGroup = async () => {
    if (!newGroupName) return
    setNewGroupSubmitting(true)
    const created = await onAddGroup({ name: newGroupName, type: "class" })
    setNewGroupSubmitting(false)
    if (created) {
      setForm(f => ({ ...f, groupId: created.id }))
      setNewGroupName("")
      setShowNewGroup(false)
    }
  }

  const filtered = members.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all" || m.status === filter
    return matchSearch && matchFilter
  })

  const statusColor = (s: string) => s === "active" ? EMERALD : s === "graduated" ? INST_COL : s === "suspended" ? "#EF4444" : "#6B9B8A"

  return (
    <div style={{ padding: "28px 28px 60px" }}>
      {feedback && <FeedbackToast message={feedback.message} type={feedback.type} />}
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
              <div style={{ display: "flex", gap: 6 }}>
                <select style={{ ...inputStyle, appearance: "auto", flex: 1 }} value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}>
                  <option value="">Select Group</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <button onClick={() => setShowNewGroup(!showNewGroup)} style={{ padding: "8px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${INST_COL}20`, background: `${INST_COL}08`, color: INST_L, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>+ New</button>
              </div>
              {showNewGroup && (
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <input style={{ ...inputStyle, flex: 1 }} placeholder="e.g. Form 3A" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                  <button onClick={createGroup} disabled={newGroupSubmitting} style={{ padding: "8px 12px", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "none", background: INST_COL, color: "#fff", fontFamily: "'DM Sans', sans-serif", opacity: newGroupSubmitting ? 0.6 : 1 }}>{newGroupSubmitting ? "..." : "Create"}</button>
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} placeholder="0244123456" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <button onClick={addMember} disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}>{submitting ? "..." : "Enroll"}</button>
          </div>
        </div>
      )}

      {/* Members table */}
      <div style={{ ...glass, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${INST_COL}10` }}>
              {["Name", "Role", "Group", "Enrolled", "Phone", "Status", ""].map((h, i) => (
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
                <td style={{ padding: "10px 14px", fontFamily: "'DM Mono', monospace", fontSize: 11, color: INST_L }}>{m.group?.name || "—"}</td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: "#6B9B8A", fontFamily: "'DM Mono', monospace" }}>{m.enrolledAt ? m.enrolledAt.slice(0, 10) : "—"}</td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: "#6B9B8A", fontFamily: "'DM Mono', monospace" }}>{m.phone || "—"}</td>
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
function FeesScreen({ fees, feeSummary, onRecordPayment, feedback }: { fees: FeeRecord[]; feeSummary: FeeSummary | null; onRecordPayment: (feeRecordId: string, amount: number, method: string) => Promise<void>; feedback: { message: string; type: "success" | "error" } | null }) {
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState("")
  const [payMethod, setPayMethod] = useState("CASH")
  const [submitting, setSubmitting] = useState(false)

  const totalOutstanding = feeSummary ? feeSummary.totalOutstanding / 100 : 0

  const unpaidCount = feeSummary ? (feeSummary.byStatus.UNPAID + feeSummary.byStatus.PARTIAL) : 0
  const paidCount = feeSummary ? feeSummary.byStatus.PAID : 0

  const handlePay = async (feeRecordId: string) => {
    const amountGhs = parseFloat(payAmount)
    if (!amountGhs || amountGhs <= 0) return
    setSubmitting(true)
    await onRecordPayment(feeRecordId, Math.round(amountGhs * 100), payMethod)
    setSubmitting(false)
    setPayingId(null)
    setPayAmount("")
    setPayMethod("CASH")
  }

  const statusColor = (s: string) => s === "PAID" ? EMERALD : s === "PARTIAL" ? "#F59E0B" : "#EF4444"

  return (
    <div style={{ padding: "28px 28px 60px" }}>
      {feedback && <FeedbackToast message={feedback.message} type={feedback.type} />}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>Fee Management</h1>
        <p style={{ fontSize: 13, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{unpaidCount} records with outstanding balances</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 28 }}>
        <div style={{ ...glass, padding: "22px 20px" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#EF4444", fontFamily: "'Space Grotesk', sans-serif" }}>GHS {totalOutstanding.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Total Outstanding</div>
        </div>
        <div style={{ ...glass, padding: "22px 20px" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#F59E0B", fontFamily: "'Space Grotesk', sans-serif" }}>{unpaidCount}</div>
          <div style={{ fontSize: 11, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Owing Records</div>
        </div>
        <div style={{ ...glass, padding: "22px 20px" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: EMERALD, fontFamily: "'Space Grotesk', sans-serif" }}>{paidCount}</div>
          <div style={{ fontSize: 11, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Fully Paid</div>
        </div>
      </div>

      <div style={{ ...glass, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${INST_COL}10` }}>
              {["Member", "Group", "Description", "Amount", "Paid", "Balance", "Status", "Action"].map((h, i) => (
                <th key={i} style={{ padding: "12px 14px", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A6B7A" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fees.map(f => (
              <tr key={f.id} style={{ borderBottom: `1px solid ${INST_COL}06` }}>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#ECF5F0" }}>{f.member.name}</td>
                <td style={{ padding: "10px 14px", color: INST_L, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{f.member.group?.name || "—"}</td>
                <td style={{ padding: "10px 14px", color: "#6B9B8A", fontSize: 12 }}>{f.description}</td>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: INST_L, fontFamily: "'Space Grotesk', sans-serif" }}>GHS {(f.amount / 100).toLocaleString()}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: EMERALD, fontFamily: "'Space Grotesk', sans-serif" }}>GHS {(f.paid / 100).toLocaleString()}</td>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: f.balance > 0 ? "#EF4444" : EMERALD, fontFamily: "'Space Grotesk', sans-serif" }}>GHS {(f.balance / 100).toLocaleString()}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: `${statusColor(f.status)}15`, color: statusColor(f.status) }}>{f.status}</span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  {f.status !== "PAID" ? (
                    payingId === f.id ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input style={{ ...inputStyle, width: 80, padding: "6px 8px", fontSize: 11 }} placeholder="GHS" value={payAmount} onChange={e => setPayAmount(e.target.value)} type="number" min="0" step="0.01" />
                        <select style={{ ...inputStyle, width: 80, padding: "6px 8px", fontSize: 10, appearance: "auto" }} value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                          {["CASH", "MOMO", "BANK", "CHEQUE"].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <button onClick={() => handlePay(f.id)} disabled={submitting} style={{ padding: "6px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: EMERALD, border: "none", color: "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: submitting ? 0.6 : 1 }}>{submitting ? "..." : "Pay"}</button>
                        <button onClick={() => { setPayingId(null); setPayAmount(""); }} style={{ padding: "6px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: "transparent", border: `1px solid ${INST_COL}15`, color: "#6B9B8A", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>X</button>
                      </div>
                    ) : (
                      <button onClick={() => setPayingId(f.id)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: `${EMERALD}15`, border: `1px solid ${EMERALD}25`, color: EMERALD_L, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Record Payment</button>
                    )
                  ) : (
                    <span style={{ fontSize: 10, color: "#3A6B5A" }}>Settled</span>
                  )}
                </td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "28px 14px", textAlign: "center", color: "#3A6B5A", fontSize: 13 }}>No fee records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Staff Screen ── */
function StaffScreen({ staff, onAddStaff, feedback }: { staff: StaffMember[]; onAddStaff: (data: { name: string; role: string; department: string; phone: string }) => Promise<void>; feedback: { message: string; type: "success" | "error" } | null }) {
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [filterDept, setFilterDept] = useState("All")
  const [form, setForm] = useState({ name: "", role: "", department: "", phone: "" })
  const [submitting, setSubmitting] = useState(false)

  const departments = ["All", ...new Set(staff.map(s => s.department))]

  const addStaff = async () => {
    if (!form.name || !form.role || !form.department) return
    setSubmitting(true)
    await onAddStaff({ name: form.name, role: form.role, department: form.department, phone: form.phone })
    setSubmitting(false)
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
      {feedback && <FeedbackToast message={feedback.message} type={feedback.type} />}
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
            <button onClick={addStaff} disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}>{submitting ? "..." : "Add"}</button>
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

/* ── Schedule Screen ── */
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

const PERIOD_TIMES = [
  { start: "07:30", end: "08:15" },
  { start: "08:15", end: "09:00" },
  { start: "09:00", end: "09:30" }, // Break
  { start: "09:30", end: "10:15" },
  { start: "10:15", end: "11:00" },
  { start: "11:00", end: "11:45" },
  { start: "11:45", end: "12:30" }, // Lunch
  { start: "12:30", end: "13:15" },
  { start: "13:15", end: "14:00" },
]

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

function mapScheduleToSlot(entry: ScheduleEntry): { day: number; period: number } | null {
  const day = entry.dayOfWeek
  const periodIndex = PERIOD_TIMES.findIndex(p => p.start === entry.startTime)
  if (periodIndex === -1 || day < 0 || day > 4) return null
  return { day, period: periodIndex }
}

function ScheduleScreen({ schedule }: { schedule: ScheduleEntry[] }) {
  const allGroups = [...new Set(schedule.map(s => s.group.name))]
  const [selectedGroup, setSelectedGroup] = useState(allGroups[0] || "")
  const filtered = schedule.filter(s => s.group.name === selectedGroup)

  const getSlot = (day: number, period: number) => {
    return filtered.find(s => {
      const mapped = mapScheduleToSlot(s)
      return mapped && mapped.day === day && mapped.period === period
    })
  }

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
            {allGroups.map(g => (
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
          { label: "Teachers", value: [...new Set(filtered.map(s => s.staff.name))].length.toString(), color: INST_L },
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
                    const color = slot ? subjectColor(slot.subject) : INST_COL
                    return (
                      <td key={di} style={{ padding: "4px 6px", verticalAlign: "top" }}>
                        {slot ? (
                          <div style={{ padding: "8px 10px", borderRadius: 8, background: `${color}10`, border: `1px solid ${color}18`, transition: "all 0.2s" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: color, marginBottom: 3 }}>{slot.subject}</div>
                            <div style={{ fontSize: 9, color: "#6B9B8A", fontFamily: "'DM Mono', monospace" }}>{slot.staff.name}</div>
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
  const { session, login, logout, authFetch } = useAuth()
  const [screen, setScreen] = useState<Screen>("dashboard")
  const [members, setMembers] = useState<Member[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const orgCode = session?.orgCode ?? ""

  const showFeedback = useCallback((message: string, type: "success" | "error") => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 3000)
  }, [])

  const fetchMembers = useCallback(async () => {
    try {
      const res = await authFetch(`/api/institute/members?orgCode=${orgCode}`)
      if (!res.ok) throw new Error("Failed to fetch members")
      const data = await res.json()
      setMembers(data.members ?? data)
    } catch { showFeedback("Failed to load members", "error") }
  }, [authFetch, orgCode, showFeedback])

  const fetchStaff = useCallback(async () => {
    try {
      const res = await authFetch(`/api/institute/staff?orgCode=${orgCode}`)
      if (!res.ok) throw new Error("Failed to fetch staff")
      const data = await res.json()
      setStaff(data.staff ?? data)
    } catch { showFeedback("Failed to load staff", "error") }
  }, [authFetch, orgCode, showFeedback])

  const fetchGroups = useCallback(async () => {
    try {
      const res = await authFetch(`/api/institute/groups?orgCode=${orgCode}`)
      if (!res.ok) throw new Error("Failed to fetch groups")
      const data = await res.json()
      setGroups(data)
    } catch { showFeedback("Failed to load groups", "error") }
  }, [authFetch, orgCode, showFeedback])

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await authFetch(`/api/institute/schedule?orgCode=${orgCode}`)
      if (!res.ok) throw new Error("Failed to fetch schedule")
      const data = await res.json()
      setSchedule(data)
    } catch { showFeedback("Failed to load schedule", "error") }
  }, [authFetch, orgCode, showFeedback])

  const fetchFees = useCallback(async () => {
    try {
      const res = await authFetch(`/api/institute/fees?orgCode=${orgCode}`)
      if (!res.ok) throw new Error("Failed to fetch fees")
      const data = await res.json()
      setFees(data.records ?? data)
    } catch { showFeedback("Failed to load fees", "error") }
  }, [authFetch, orgCode, showFeedback])

  const fetchFeeSummary = useCallback(async () => {
    try {
      const res = await authFetch(`/api/institute/fees/summary?orgCode=${orgCode}`)
      if (!res.ok) throw new Error("Failed to fetch fee summary")
      const data = await res.json()
      setFeeSummary(data)
    } catch { showFeedback("Failed to load fee summary", "error") }
  }, [authFetch, orgCode, showFeedback])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    async function loadAll() {
      setLoading(true)
      await Promise.all([
        fetchMembers(),
        fetchStaff(),
        fetchGroups(),
        fetchSchedule(),
        fetchFees(),
        fetchFeeSummary(),
      ])
      if (!cancelled) setLoading(false)
    }
    loadAll()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const handleAddMember = useCallback(async (data: { name: string; role: string; groupId: string; phone: string }) => {
    try {
      const res = await authFetch("/api/institute/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgCode, name: data.name, role: data.role, groupId: data.groupId, phone: data.phone || undefined }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to enroll member")
      }
      showFeedback("Member enrolled successfully", "success")
      await Promise.all([fetchMembers(), fetchGroups()])
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Failed to enroll member", "error")
    }
  }, [authFetch, orgCode, showFeedback, fetchMembers, fetchGroups])

  const handleAddGroup = useCallback(async (data: { name: string; type: string }): Promise<Group | null> => {
    try {
      const res = await authFetch("/api/institute/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgCode, name: data.name, type: data.type }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to create group")
      }
      const created = await res.json()
      showFeedback(`Group "${data.name}" created`, "success")
      await fetchGroups()
      return created
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Failed to create group", "error")
      return null
    }
  }, [authFetch, orgCode, showFeedback, fetchGroups])

  const handleAddStaff = useCallback(async (data: { name: string; role: string; department: string; phone: string }) => {
    try {
      const res = await authFetch("/api/institute/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgCode, name: data.name, role: data.role, department: data.department, phone: data.phone || undefined }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to add staff")
      }
      showFeedback("Staff member added successfully", "success")
      await fetchStaff()
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Failed to add staff", "error")
    }
  }, [authFetch, orgCode, showFeedback, fetchStaff])

  const handleRecordPayment = useCallback(async (feeRecordId: string, amount: number, paymentMethod: string) => {
    try {
      const res = await authFetch("/api/institute/fees/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgCode, feeRecordId, amount, paymentMethod, receivedBy: "system" }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to record payment")
      }
      showFeedback("Payment recorded successfully", "success")
      await Promise.all([fetchFees(), fetchFeeSummary()])
    } catch (e) {
      showFeedback(e instanceof Error ? e.message : "Failed to record payment", "error")
    }
  }, [authFetch, orgCode, showFeedback, fetchFees, fetchFeeSummary])

  if (!session) {
    return <LoginScreen onLogin={login} />
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#6B9B8A", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em" }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans', sans-serif", color: "#ECF5F0" }}>
      <style>{`
        @media (max-width: 900px) { .hidden-mobile { display: none !important; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      <Header screen={screen} setScreen={setScreen} session={session} onLogout={logout} />
      {screen === "dashboard" && <DashboardScreen members={members} staff={staff} groups={groups} feeSummary={feeSummary} setScreen={setScreen} />}
      {screen === "enrollment" && <EnrollmentScreen members={members} groups={groups} onAddMember={handleAddMember} onAddGroup={handleAddGroup} feedback={feedback} />}
      {screen === "fees" && <FeesScreen fees={fees} feeSummary={feeSummary} onRecordPayment={handleRecordPayment} feedback={feedback} />}
      {screen === "schedule" && <ScheduleScreen schedule={schedule} />}
      {screen === "staff" && <StaffScreen staff={staff} onAddStaff={handleAddStaff} feedback={feedback} />}
    </div>
  )
}
