"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/roles — Roles, permissions matrix, user assignments
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Input, Select,
  SearchBar, Tabs, Section, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon, IconName } from "@/components/ops/Icon"
import { MOCK_EMPLOYEES } from "@/lib/ops/mock"
import { dateShort } from "@/lib/ops/format"

type View = "matrix" | "users"

interface Role {
  id: string
  name: string
  description: string
  color: string
  perms: Record<string, "none" | "view" | "edit" | "approve" | "owner">
  members: number
}

const MODULES: { key: string; label: string; icon: IconName }[] = [
  { key: "pos",         label: "POS",            icon: "pos" },
  { key: "inventory",   label: "Inventory",      icon: "inventory" },
  { key: "stock",       label: "Stock Ops",      icon: "stock" },
  { key: "branches",    label: "Branches",       icon: "branches" },
  { key: "customers",   label: "Customers",      icon: "customers" },
  { key: "loyalty",     label: "Loyalty",        icon: "loyalty" },
  { key: "suppliers",   label: "Suppliers",      icon: "suppliers" },
  { key: "po",          label: "Purchase Orders",icon: "po" },
  { key: "accounting",  label: "Accounting",     icon: "coa" },
  { key: "expenses",    label: "Expenses",       icon: "expenses" },
  { key: "tax",         label: "Tax Engine",     icon: "tax" },
  { key: "payroll",     label: "Payroll",        icon: "payroll" },
  { key: "shifts",      label: "Shifts",         icon: "shifts" },
  { key: "reports",     label: "Reports",        icon: "reports" },
  { key: "audit",       label: "Audit Log",      icon: "audit" },
  { key: "roles",       label: "Roles",          icon: "roles" },
]

const ROLES: Role[] = [
  {
    id: "RL-OWNER", name: "Owner", description: "Full access — can never be locked out.", color: "#F59E0B", members: 1,
    perms: Object.fromEntries(MODULES.map(m => [m.key, "owner"])),
  },
  {
    id: "RL-MGR", name: "Branch Manager", description: "Runs the floor. Can approve voids, refunds, and adjustments.", color: "#10B981", members: 5,
    perms: {
      pos: "edit", inventory: "edit", stock: "approve", branches: "view",
      customers: "edit", loyalty: "edit", suppliers: "view", po: "edit",
      accounting: "view", expenses: "edit", tax: "view", payroll: "view",
      shifts: "approve", reports: "view", audit: "view", roles: "none",
    },
  },
  {
    id: "RL-CASHIER", name: "Senior Cashier", description: "POS power user. Can open shifts and run promos.", color: "#0EA5E9", members: 1,
    perms: {
      pos: "edit", inventory: "view", stock: "view", branches: "none",
      customers: "edit", loyalty: "view", suppliers: "none", po: "none",
      accounting: "none", expenses: "none", tax: "none", payroll: "none",
      shifts: "edit", reports: "view", audit: "none", roles: "none",
    },
  },
  {
    id: "RL-CASH", name: "Cashier", description: "Sells, refunds with supervisor PIN, ends own shift.", color: "#9CA3AF", members: 4,
    perms: {
      pos: "edit", inventory: "view", stock: "view", branches: "none",
      customers: "view", loyalty: "view", suppliers: "none", po: "none",
      accounting: "none", expenses: "none", tax: "none", payroll: "none",
      shifts: "view", reports: "none", audit: "none", roles: "none",
    },
  },
  {
    id: "RL-STOCK", name: "Stockroom", description: "Receives goods, runs counts, files transfers.", color: "#A78B6F", members: 2,
    perms: {
      pos: "view", inventory: "edit", stock: "edit", branches: "view",
      customers: "none", loyalty: "none", suppliers: "view", po: "view",
      accounting: "none", expenses: "none", tax: "none", payroll: "none",
      shifts: "none", reports: "view", audit: "none", roles: "none",
    },
  },
  {
    id: "RL-ACCT", name: "Accountant", description: "Posts journals, reconciles, files GRA returns.", color: "#E5E7EB", members: 0,
    perms: {
      pos: "view", inventory: "view", stock: "view", branches: "view",
      customers: "view", loyalty: "none", suppliers: "edit", po: "edit",
      accounting: "approve", expenses: "approve", tax: "approve", payroll: "approve",
      shifts: "view", reports: "view", audit: "view", roles: "none",
    },
  },
  {
    id: "RL-AUDIT", name: "Auditor", description: "Read-only access to everything. Can export.", color: "#9CA3AF", members: 0,
    perms: Object.fromEntries(MODULES.map(m => [m.key, "view"])),
  },
]

interface AppUser {
  id: string
  name: string
  email: string
  role: Role["name"]
  branch: string
  status: "active" | "invited" | "suspended"
  lastLogin?: string
}

const USERS: AppUser[] = [
  { id: "U001", name: "George Gaisie",  email: "owner@dalxic.com",     role: "Owner",          branch: "—",                  status: "active", lastLogin: "2026-04-15" },
  { id: "U002", name: "Linda Sefa",     email: "linda@dalxic.com",     role: "Branch Manager", branch: "Osu Main",           status: "active", lastLogin: "2026-04-15" },
  { id: "U003", name: "Mr. Owusu",      email: "owusu@dalxic.com",     role: "Branch Manager", branch: "Tema Community 2",   status: "active", lastLogin: "2026-04-15" },
  { id: "U004", name: "Ms. Boateng",    email: "boateng@dalxic.com",   role: "Branch Manager", branch: "Kasoa Highway",      status: "active", lastLogin: "2026-04-14" },
  { id: "U005", name: "Mr. Asante",     email: "asante@dalxic.com",    role: "Branch Manager", branch: "Kumasi Adum",        status: "active", lastLogin: "2026-04-14" },
  { id: "U006", name: "Ms. Quaye",      email: "quaye@dalxic.com",     role: "Branch Manager", branch: "Takoradi Market",    status: "suspended" },
  { id: "U007", name: "Kweku Boa",      email: "kweku@dalxic.com",     role: "Senior Cashier", branch: "Osu Main",           status: "active", lastLogin: "2026-04-15" },
  { id: "U008", name: "Akua Konadu",    email: "akua@dalxic.com",      role: "Cashier",        branch: "Osu Main",           status: "active", lastLogin: "2026-04-15" },
  { id: "U009", name: "Esi Nyarko",     email: "esi@dalxic.com",       role: "Cashier",        branch: "Tema Community 2",   status: "active", lastLogin: "2026-04-13" },
  { id: "U010", name: "Adjoa Tettey",   email: "adjoa@dalxic.com",     role: "Cashier",        branch: "Kumasi Adum",        status: "active", lastLogin: "2026-04-12" },
  { id: "U011", name: "Yaw Mensa",      email: "yaw@dalxic.com",       role: "Stockroom",      branch: "Osu Main",           status: "active", lastLogin: "2026-04-15" },
  { id: "U012", name: "Kwesi Pobee",    email: "kwesi@dalxic.com",     role: "Stockroom",      branch: "Kasoa Highway",      status: "invited" },
]

const PERM_TONE: Record<string, Tone> = {
  none: "neutral", view: "sky", edit: "amber", approve: "emerald", owner: "amber",
}

const PERM_LABEL: Record<string, string> = {
  none: "—", view: "View", edit: "Edit", approve: "Approve", owner: "Owner",
}

const USER_TONE: Record<AppUser["status"], Tone> = {
  active: "emerald", invited: "amber", suspended: "neutral",
}

export default function RolesPage() {
  return <Shell><RolesView /></Shell>
}

function RolesView() {
  const [view, setView] = useState<View>("matrix")
  const [query, setQuery] = useState("")
  const [activeRole, setActiveRole] = useState<Role | null>(null)
  const [activeUser, setActiveUser] = useState<AppUser | null>(null)
  const [showInvite, setShowInvite] = useState(false)

  const userRows = useMemo(() => {
    if (!query) return USERS
    const q = query.toLowerCase()
    return USERS.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.branch.toLowerCase().includes(q)
    )
  }, [query])

  const userCols: Column<AppUser>[] = [
    { key: "name", label: "User", render: (u) => (
      <div>
        <div style={{ fontWeight: 600, color: T.tx }}>{u.name}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{u.email}</div>
      </div>
    )},
    { key: "role", label: "Role", width: 160, render: (u) => (
      <Pill tone={u.role === "Owner" ? "amber" : "sky"}>{u.role}</Pill>
    )},
    { key: "branch", label: "Branch", width: 180, render: (u) => (
      <span style={{ fontSize: 12, color: T.txM }}>{u.branch}</span>
    )},
    { key: "last", label: "Last Login", width: 130, render: (u) => (
      <span style={{ fontSize: 12, color: u.lastLogin ? T.tx : T.txD, fontFamily: "'DM Mono', monospace" }}>
        {u.lastLogin ? dateShort(u.lastLogin) : "Never"}
      </span>
    )},
    { key: "status", label: "Status", width: 130, render: (u) => <Pill tone={USER_TONE[u.status]} dot>{u.status}</Pill> },
  ]

  return (
    <>
      <Page
        title="Roles & Access"
        subtitle="Granular module × action permissions. One role per user, one user per device, full audit."
        accent="amber"
        action={view === "users"
          ? <Button icon="plus" onClick={() => setShowInvite(true)}>Invite User</Button>
          : <Button icon="plus" onClick={() => alert("Custom role builder coming soon")}>New Role</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Roles Defined"   value={ROLES.length}                                  accent="amber"   icon="roles" />
          <Stat label="Active Users"    value={USERS.filter(u => u.status === "active").length} accent="emerald" icon="customers" />
          <Stat label="Modules Gated"   value={MODULES.length}                                 accent="sky"     icon="lock" />
          <Stat label="Pending Invites" value={USERS.filter(u => u.status === "invited").length} accent="amber"   icon="mail" />
        </div>

        <Section
          title={view === "matrix" ? "Permissions Matrix" : "Users"}
          sub={
            view === "matrix"
              ? "Tap a role to inspect or edit. Owner is locked — it can never be downgraded."
              : "All operators with login access. Each user is pinned to a single role + branch."
          }
          action={
            view === "users" ? (
              <div style={{ width: 280 }}>
                <SearchBar value={query} onChange={setQuery} placeholder="Name, email, role…" />
              </div>
            ) : undefined
          }
        >
          <Tabs<View>
            value={view}
            onChange={setView}
            accent="amber"
            tabs={[
              { key: "matrix", label: "Permissions",  count: ROLES.length },
              { key: "users",  label: "Users",        count: USERS.length },
            ]}
          />

          {view === "matrix" && (
            <Card padding={0} style={{ marginTop: 14, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 880 }}>
                  <thead>
                    <tr>
                      <th style={th}>Module</th>
                      {ROLES.map(r => (
                        <th key={r.id} style={{ ...th, textAlign: "center" }}>
                          <button
                            onClick={() => setActiveRole(r)}
                            style={{
                              appearance: "none", background: "none", border: "none", cursor: "pointer",
                              color: r.color, fontSize: 11, fontWeight: 800, letterSpacing: "0.14em",
                              textTransform: "uppercase", fontFamily: "'DM Mono', monospace",
                              padding: "4px 8px", borderRadius: 6,
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = `${r.color}1A`}
                            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                          >
                            {r.name.split(" ")[0]}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map((m, i) => (
                      <tr key={m.key} style={{ borderTop: `1px solid ${T.border}` }}>
                        <td style={{ ...td, fontWeight: 600, color: T.tx }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Icon name={m.icon} size={14} color={T.amber} />
                            {m.label}
                          </div>
                        </td>
                        {ROLES.map(r => {
                          const p = r.perms[m.key]
                          return (
                            <td key={r.id} style={{ ...td, textAlign: "center" }}>
                              <PermPill perm={p} />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {view === "users" && (
            <DataTable rows={userRows} columns={userCols} onRowClick={(u) => setActiveUser(u)} />
          )}
        </Section>
      </Page>

      <RoleDrawer role={activeRole} onClose={() => setActiveRole(null)} />
      <UserDrawer user={activeUser} onClose={() => setActiveUser(null)} />
      <InviteDrawer open={showInvite} onClose={() => setShowInvite(false)} />
    </>
  )
}

const th: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: 9, fontWeight: 700, letterSpacing: "0.16em",
  textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace",
  textAlign: "left", borderBottom: `1px solid ${T.border}`, background: "rgba(255,255,255,0.02)",
  whiteSpace: "nowrap",
}
const td: React.CSSProperties = { padding: "12px 16px", fontSize: 12 }

function PermPill({ perm }: { perm: Role["perms"][string] }) {
  if (perm === "none") return <span style={{ color: T.txD, fontSize: 11 }}>—</span>
  return <Pill tone={PERM_TONE[perm]}>{PERM_LABEL[perm]}</Pill>
}

/* ─────────────────────────────  ROLE DRAWER  ───────────────────────────── */
function RoleDrawer({ role, onClose }: { role: Role | null; onClose: () => void }) {
  if (!role) return <Drawer open={false} onClose={onClose} title="Role">{null}</Drawer>
  const isOwner = role.id === "RL-OWNER"
  return (
    <Drawer
      open={!!role} onClose={onClose}
      title={role.name}
      subtitle={`${role.members} members · ${MODULES.length} modules gated`}
      width={520}
      footer={
        isOwner ? (
          <Button variant="ghost" icon="lock" disabled>Owner Role Is Locked</Button>
        ) : (
          <>
            <Button variant="ghost" icon="trash">Delete Role</Button>
            <Button icon="edit">Edit Permissions</Button>
          </>
        )
      }
    >
      <Card padding={20} style={{ marginBottom: 20, background: `linear-gradient(140deg, ${role.color}1A, transparent 70%)`, border: `1px solid ${role.color}40` }}>
        <div style={{ fontSize: 11, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Description</div>
        <div style={{ fontSize: 14, color: T.tx, lineHeight: 1.6 }}>{role.description}</div>
      </Card>

      <Section title="Permissions">
        <Card padding={0}>
          {MODULES.map((m, i) => (
            <div key={m.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: i === MODULES.length - 1 ? "none" : `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Icon name={m.icon} size={14} color={T.amber} />
                <span style={{ fontSize: 13, color: T.tx, fontWeight: 600 }}>{m.label}</span>
              </div>
              <PermPill perm={role.perms[m.key]} />
            </div>
          ))}
        </Card>
      </Section>
    </Drawer>
  )
}

/* ─────────────────────────────  USER DRAWER  ───────────────────────────── */
function UserDrawer({ user, onClose }: { user: AppUser | null; onClose: () => void }) {
  if (!user) return <Drawer open={false} onClose={onClose} title="User">{null}</Drawer>
  return (
    <Drawer
      open={!!user} onClose={onClose}
      title={user.name}
      subtitle={user.email}
      width={500}
      footer={
        user.role === "Owner" ? (
          <Button variant="ghost" icon="lock" disabled>Owner Cannot Be Modified</Button>
        ) : (
          <>
            <Button variant="ghost" icon="lock">{user.status === "suspended" ? "Reinstate" : "Suspend"}</Button>
            <Button icon="edit">Edit</Button>
          </>
        )
      }
    >
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <Pill tone={USER_TONE[user.status]} dot>{user.status}</Pill>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
          {user.name}
        </div>
        <div style={{ fontSize: 13, color: T.txM, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{user.email}</div>
      </Card>

      <Section title="Assignment">
        <Card padding={20}>
          <RowKV label="Role" value={user.role} />
          <RowKV label="Branch" value={user.branch} />
          <RowKV label="Last login" value={user.lastLogin ? dateShort(user.lastLogin) : "Never"} last />
        </Card>
      </Section>

      <Section title="Security">
        <Card padding={20}>
          <RowKV label="PIN" value="•••• (set)" mono />
          <RowKV label="2FA" value="WhatsApp OTP" />
          <RowKV label="Devices" value="2 paired" last />
        </Card>
      </Section>
    </Drawer>
  )
}

function RowKV({ label, value, mono = false, last = false }: { label: string; value: React.ReactNode; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.txM }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.tx, fontFamily: mono ? "'DM Mono', monospace" : "'Space Grotesk', sans-serif" }}>{value}</span>
    </div>
  )
}

/* ─────────────────────────────  INVITE USER DRAWER  ───────────────────────────── */
function InviteDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("Cashier")
  const [branch, setBranch] = useState("Osu Main")
  return (
    <Drawer
      open={open} onClose={onClose}
      title="Invite User"
      subtitle="An email and WhatsApp invite are sent. They sign in with PIN + OTP."
      width={460}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="mail" onClick={onClose}>Send Invite</Button>
        </>
      }
    >
      <Field label="Full name *">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Akua Konadu" />
      </Field>
      <Field label="Email *">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="akua@dalxic.com" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Role *">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.filter(r => r.id !== "RL-OWNER").map(r => <option key={r.id}>{r.name}</option>)}
          </Select>
        </Field>
        <Field label="Branch *">
          <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option>Osu Main</option>
            <option>Tema Community 2</option>
            <option>Kasoa Highway</option>
            <option>Kumasi Adum</option>
            <option>Takoradi Market</option>
          </Select>
        </Field>
      </div>
      <Card padding={16} style={{ marginTop: 14, background: `${T.amber}0A`, border: `1px dashed ${T.amber}40` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.amber, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>What they get</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: T.txM, lineHeight: 1.7 }}>
          <li>Email + WhatsApp invite with a one-tap login link</li>
          <li>4-digit PIN they set on first sign-in</li>
          <li>WhatsApp OTP for new device pairing</li>
        </ul>
      </Card>
    </Drawer>
  )
}
