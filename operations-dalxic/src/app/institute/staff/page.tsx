"use client"
import { useState, useMemo } from "react"
import { InstituteShell } from "@/components/ops/InstituteShell"
import { Page, Stat, Pill, Drawer, DataTable, Card, T, SearchBar, Section } from "@/components/ops/primitives"
import { MOCK_INST_STAFF } from "@/lib/ops/mock"

export default function StaffPage() {
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<typeof MOCK_INST_STAFF[0] | null>(null)

  const filtered = useMemo(() => {
    if (!query) return MOCK_INST_STAFF
    const q = query.toLowerCase()
    return MOCK_INST_STAFF.filter(s => s.name.toLowerCase().includes(q))
  }, [query])

  const teachers = MOCK_INST_STAFF.filter(s => s.role === "teacher").length
  const admin = MOCK_INST_STAFF.filter(s => s.role === "admin" || s.role === "head_teacher" || s.role === "accountant").length
  const activeStaff = MOCK_INST_STAFF.filter(s => s.status === "active").length

  return (
    <InstituteShell>
      <Page accent="sky" title="Staff" subtitle="Staff directory — teachers, admin and department assignments.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Staff" value={MOCK_INST_STAFF.length} accent="sky" icon="staff" />
          <Stat label="Teachers" value={teachers} accent="sky" icon="user" />
          <Stat label="Admin" value={admin} accent="amber" icon="settings" />
          <Stat label="Active" value={activeStaff} accent="emerald" icon="check" />
        </div>

        <Section title="Directory" action={<div style={{ width: 280 }}><SearchBar value={query} onChange={setQuery} placeholder="Search staff…" /></div>}>
          <DataTable
            columns={[
              { key: "name", label: "Name", render: (r) => r.name },
              { key: "role", label: "Role", render: (r) => <Pill tone={r.role === "teacher" ? "sky" : r.role === "head_teacher" ? "amber" : "neutral"}>{r.role.replace(/_/g, " ")}</Pill>, width: 110 },
              { key: "department", label: "Department", render: (r) => r.department },
              { key: "phone", label: "Phone", render: (r) => r.phone, width: 120 },
              { key: "subjects", label: "Subjects", render: (r) => <span style={{ fontSize: 11, color: T.txM }}>{r.subjects.join(", ") || "—"}</span> },
              { key: "status", label: "Status", render: (r) => <Pill tone={r.status === "active" ? "emerald" : "neutral"}>{r.status}</Pill>, width: 90 },
            ]}
            rows={filtered}
            onRowClick={(s) => setActive(s)}
          />
        </Section>

        <Drawer open={!!active} onClose={() => setActive(null)} title={active?.name ?? "Staff"} subtitle={active?.role.replace(/_/g, " ")} width={480}>
          {active && (
            <>
              <Card padding={18} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Personal Info</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Name:</b> {active.name}</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Role:</b> {active.role.replace(/_/g, " ")}</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Department:</b> {active.department}</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Phone:</b> {active.phone}</div>
                <div style={{ fontSize: 13, color: T.tx }}><b>Email:</b> {active.email}</div>
              </Card>
              {active.subjects.length > 0 && (
                <Card padding={18}>
                  <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Assigned Subjects</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {active.subjects.map(s => <Pill key={s} tone="sky">{s}</Pill>)}
                  </div>
                </Card>
              )}
            </>
          )}
        </Drawer>
      </Page>
    </InstituteShell>
  )
}
