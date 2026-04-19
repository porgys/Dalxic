"use client"
import { useState, useMemo } from "react"
import { InstituteShell } from "@/components/ops/InstituteShell"
import { Page, Stat, Pill, Drawer, Tabs, DataTable, Card, T, SearchBar, Section } from "@/components/ops/primitives"
import { MOCK_INST_STUDENTS, MOCK_INST_GROUPS } from "@/lib/ops/mock"

type View = "all" | "active" | "inactive" | "graduated" | "suspended"

export default function EnrollmentPage() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<typeof MOCK_INST_STUDENTS[0] | null>(null)

  const groupName = (groupId: string) => MOCK_INST_GROUPS.find(g => g.id === groupId)?.name ?? groupId

  const filtered = useMemo(() => {
    let items = [...MOCK_INST_STUDENTS]
    if (view !== "all") items = items.filter(s => s.status === view)
    if (query) {
      const q = query.toLowerCase()
      items = items.filter(s => s.name.toLowerCase().includes(q) || (s.guardianName ?? "").toLowerCase().includes(q))
    }
    return items
  }, [view, query])

  const total = MOCK_INST_STUDENTS.length
  const activeCount = MOCK_INST_STUDENTS.filter(s => s.status === "active").length
  const graduated = MOCK_INST_STUDENTS.filter(s => s.status === "graduated").length

  return (
    <InstituteShell>
      <Page accent="sky" title="Enrollment" subtitle="Student registration, guardian information and group assignment.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Students" value={total} accent="sky" icon="customers" />
          <Stat label="Active" value={activeCount} accent="emerald" icon="check" />
          <Stat label="Graduated" value={graduated} accent="sky" icon="trending" />
          <Stat label="New This Term" value={4} accent="amber" icon="plus" />
        </div>

        <Section title="Students" action={<div style={{ width: 280 }}><SearchBar value={query} onChange={setQuery} placeholder="Search student or guardian…" /></div>}>
          <Tabs<View> value={view} onChange={setView} accent="sky" tabs={[
            { key: "all", label: "All", count: total },
            { key: "active", label: "Active", count: activeCount },
            { key: "inactive", label: "Inactive", count: MOCK_INST_STUDENTS.filter(s => s.status === "inactive").length },
            { key: "graduated", label: "Graduated", count: graduated },
            { key: "suspended", label: "Suspended", count: MOCK_INST_STUDENTS.filter(s => s.status === "suspended").length },
          ]} />

          <DataTable
            columns={[
              { key: "name", label: "Name", render: (r) => r.name },
              { key: "groupName", label: "Group", render: (r) => groupName(r.groupId ?? "") },
              { key: "status", label: "Status", render: (r) => <Pill tone={r.status === "active" ? "emerald" : r.status === "graduated" ? "sky" : r.status === "suspended" ? "red" : "neutral"}>{r.status}</Pill>, width: 100 },
              { key: "guardianName", label: "Guardian", render: (r) => r.guardianName ?? "—" },
              { key: "guardianPhone", label: "Phone", render: (r) => r.guardianPhone ?? "—", width: 120 },
              { key: "enrolledAt", label: "Enrolled", render: (r) => r.enrolledAt ?? "—", width: 100 },
            ]}
            rows={filtered}
            onRowClick={(s) => setActive(s)}
          />
        </Section>

        <Drawer open={!!active} onClose={() => setActive(null)} title={active?.name ?? "Student"} subtitle={active ? groupName(active.groupId ?? "") : undefined} width={480}>
          {active && (
            <>
              <Card padding={18} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Personal Info</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Name:</b> {active.name}</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>DOB:</b> {active.dateOfBirth}</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Gender:</b> {active.gender}</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Group:</b> {groupName(active.groupId ?? "")}</div>
                <div style={{ fontSize: 13, color: T.tx }}><b>Enrolled:</b> {active.enrolledAt ?? "—"}</div>
              </Card>
              <Card padding={18}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Guardian</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Name:</b> {active.guardianName ?? "—"}</div>
                <div style={{ fontSize: 13, color: T.tx }}><b>Phone:</b> {active.guardianPhone ?? "—"}</div>
              </Card>
            </>
          )}
        </Drawer>
      </Page>
    </InstituteShell>
  )
}
