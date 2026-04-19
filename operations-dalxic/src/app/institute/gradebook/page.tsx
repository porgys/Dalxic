"use client"
import { useState } from "react"
import { InstituteShell } from "@/components/ops/InstituteShell"
import { Page, Stat, Pill, Drawer, DataTable, Card, T, Select, Field, Section } from "@/components/ops/primitives"
import { MOCK_INST_GRADES, MOCK_INST_STUDENTS, MOCK_INST_SUBJECTS } from "@/lib/ops/mock"

function gradeTone(grade: string): "emerald" | "amber" | "neutral" {
  if (["A1", "B2", "B3"].includes(grade)) return "emerald"
  if (["C4", "C5", "C6"].includes(grade)) return "amber"
  return "neutral"
}

export default function GradebookPage() {
  const [active, setActive] = useState<typeof MOCK_INST_GRADES[0] | null>(null)

  const studentName = (sid: string) => MOCK_INST_STUDENTS.find(s => s.id === sid)?.name ?? sid
  const subjectName = (sid: string) => MOCK_INST_SUBJECTS.find(s => s.id === sid)?.name ?? sid

  const avgScore = Math.round(MOCK_INST_GRADES.reduce((s, g) => s + g.score, 0) / (MOCK_INST_GRADES.length || 1))
  const passRate = Math.round((MOCK_INST_GRADES.filter(g => g.score >= 50).length / (MOCK_INST_GRADES.length || 1)) * 100)
  const distinctionRate = Math.round((MOCK_INST_GRADES.filter(g => g.score >= 80).length / (MOCK_INST_GRADES.length || 1)) * 100)

  return (
    <InstituteShell>
      <Page accent="sky" title="Gradebook" subtitle="Grades overview, filtering by term, group and subject.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Students Graded" value={new Set(MOCK_INST_GRADES.map(g => g.studentId)).size} accent="sky" icon="customers" />
          <Stat label="Average Score" value={avgScore} accent="sky" icon="analytics" />
          <Stat label="Pass Rate" value={`${passRate}%`} accent="emerald" icon="check" />
          <Stat label="Distinction Rate" value={`${distinctionRate}%`} accent="amber" icon="sparkle" />
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 160 }}><Field label="Term"><Select><option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option></Select></Field></div>
          <div style={{ width: 160 }}><Field label="Group"><Select><option value="all">All Groups</option></Select></Field></div>
          <div style={{ width: 160 }}><Field label="Subject"><Select><option value="all">All Subjects</option></Select></Field></div>
        </div>

        <DataTable
          columns={[
            { key: "studentName", label: "Student", render: (r) => studentName(r.studentId) },
            { key: "subjectName", label: "Subject", render: (r) => subjectName(r.subjectId) },
            { key: "score", label: "Score", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{r.score}</span>, width: 70 },
            { key: "grade", label: "Grade", render: (r) => <Pill tone={gradeTone(r.grade)}>{r.grade}</Pill>, width: 80 },
            { key: "remarks", label: "Remarks", render: (r) => r.remarks },
          ]}
          rows={MOCK_INST_GRADES}
          onRowClick={(g) => setActive(g)}
        />

        <Drawer open={!!active} onClose={() => setActive(null)} title={active ? studentName(active.studentId) : "Student"} subtitle="Grade Card" width={480}>
          {active && (
            <Section title="All Subjects This Term">
              {MOCK_INST_GRADES.filter(g => g.studentId === active.studentId).map(g => (
                <Card key={g.id} padding={12} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{subjectName(g.subjectId)}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 14 }}>{g.score}</span>
                      <Pill tone={gradeTone(g.grade)}>{g.grade}</Pill>
                    </div>
                  </div>
                  {g.remarks && <div style={{ fontSize: 11, color: T.txM, marginTop: 4 }}>{g.remarks}</div>}
                </Card>
              ))}
            </Section>
          )}
        </Drawer>
      </Page>
    </InstituteShell>
  )
}
