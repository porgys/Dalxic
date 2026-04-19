"use client"
import { useState } from "react"
import { InstituteShell } from "@/components/ops/InstituteShell"
import { Page, Stat, Pill, Drawer, DataTable, Card, T } from "@/components/ops/primitives"
import { MOCK_INST_SUBJECTS, MOCK_INST_EXAMS, MOCK_INST_GROUPS, MOCK_INST_STAFF } from "@/lib/ops/mock"

type SubjectRow = typeof MOCK_INST_SUBJECTS[0]

export default function SubjectsPage() {
  const [active, setActive] = useState<SubjectRow | null>(null)

  const examCount = MOCK_INST_EXAMS.length

  /* Derive teacher for a subject by matching staff subjects array */
  const teacherFor = (name: string) => MOCK_INST_STAFF.find(s => s.subjects.includes(name))?.name ?? "—"
  /* Count groups that include this subject */
  const groupsFor = (name: string) => MOCK_INST_GROUPS.filter(g => g.subjects.includes(name)).length
  /* Unique teachers across all subjects */
  const uniqueTeachers = new Set(MOCK_INST_SUBJECTS.map(s => teacherFor(s.name)).filter(t => t !== "—")).size

  return (
    <InstituteShell>
      <Page accent="sky" title="Subjects" subtitle="Subject catalogue, teacher mapping and exam scheduling.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Subjects" value={MOCK_INST_SUBJECTS.length} accent="sky" icon="journals" />
          <Stat label="Teachers Assigned" value={uniqueTeachers} accent="sky" icon="staff" />
          <Stat label="Exams Scheduled" value={examCount} accent="amber" icon="reports" />
        </div>

        <DataTable
          columns={[
            { key: "name", label: "Subject", render: (r) => r.name },
            { key: "teacher", label: "Teacher", render: (r) => teacherFor(r.name) },
            { key: "groupsTaking", label: "Groups", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace" }}>{groupsFor(r.name)}</span>, width: 70 },
          ]}
          rows={MOCK_INST_SUBJECTS}
          onRowClick={(s) => setActive(s)}
        />

        <Drawer open={!!active} onClose={() => setActive(null)} title={active?.name ?? "Subject"} width={480}>
          {active && (
            <Card padding={18}>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Teacher:</b> {teacherFor(active.name)}</div>
              <div style={{ fontSize: 13, color: T.tx }}><b>Groups Taking:</b> {groupsFor(active.name)}</div>
            </Card>
          )}
        </Drawer>
      </Page>
    </InstituteShell>
  )
}
