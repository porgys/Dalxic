"use client"
import { useState } from "react"
import { InstituteShell } from "@/components/ops/InstituteShell"
import { Page, Stat, Pill, Drawer, DataTable, Card, T, Section } from "@/components/ops/primitives"
import { MOCK_INST_GROUPS, MOCK_INST_STUDENTS } from "@/lib/ops/mock"

export default function GroupsPage() {
  const [active, setActive] = useState<typeof MOCK_INST_GROUPS[0] | null>(null)

  const totalStudents = MOCK_INST_STUDENTS.filter(s => s.status === "active").length
  const avgSize = Math.round(totalStudents / (MOCK_INST_GROUPS.length || 1))

  return (
    <InstituteShell>
      <Page accent="sky" title="Groups / Classes" subtitle="Class management, teacher assignment and student grouping.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Groups" value={MOCK_INST_GROUPS.length} accent="sky" icon="tenants" />
          <Stat label="Total Students" value={totalStudents} accent="sky" icon="customers" />
          <Stat label="Avg Class Size" value={avgSize} accent="amber" icon="analytics" />
          <Stat label="Active Groups" value={MOCK_INST_GROUPS.length} accent="emerald" icon="check" />
        </div>

        <DataTable
          columns={[
            { key: "name", label: "Group Name", render: (r) => r.name },
            { key: "type", label: "Type", render: (r) => <Pill tone="sky">{r.type}</Pill>, width: 90 },
            { key: "memberCount", label: "Students", render: (r) => r.memberCount, width: 80 },
            { key: "teacherName", label: "Teacher", render: (r) => r.teacherName },
            { key: "subjectsCount", label: "Subjects", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace" }}>{r.subjects.length}</span>, width: 80 },
          ]}
          rows={MOCK_INST_GROUPS}
          onRowClick={(g) => setActive(g)}
        />

        <Drawer open={!!active} onClose={() => setActive(null)} title={active?.name ?? "Group"} subtitle={`${active?.teacherName} · ${active?.memberCount} students`} width={480}>
          {active && (
            <>
              <Card padding={18} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Type:</b> {active.type}</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Teacher:</b> {active.teacherName}</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Students:</b> {active.memberCount}</div>
                <div style={{ fontSize: 13, color: T.tx }}><b>Subjects:</b> {active.subjects.length}</div>
              </Card>
              <Section title="Members">
                {MOCK_INST_STUDENTS.filter(s => s.groupId === active.id).map(s => (
                  <div key={s.id} style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.tx }}>{s.name}</span>
                    <Pill tone={s.status === "active" ? "emerald" : "neutral"}>{s.status}</Pill>
                  </div>
                ))}
              </Section>
            </>
          )}
        </Drawer>
      </Page>
    </InstituteShell>
  )
}
