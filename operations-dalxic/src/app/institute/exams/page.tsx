"use client"
import { useState, useMemo } from "react"
import { InstituteShell } from "@/components/ops/InstituteShell"
import { Page, Stat, Pill, Drawer, Tabs, DataTable, Card, T, Input, Section } from "@/components/ops/primitives"
import { MOCK_INST_EXAMS, MOCK_INST_STUDENTS, MOCK_INST_GROUPS } from "@/lib/ops/mock"

type View = "all" | "upcoming" | "in_progress" | "completed" | "graded"

export default function ExamsPage() {
  const [view, setView] = useState<View>("all")
  const [active, setActive] = useState<typeof MOCK_INST_EXAMS[0] | null>(null)

  const groupName = (gid: string) => MOCK_INST_GROUPS.find(g => g.id === gid)?.name ?? gid

  const filtered = useMemo(() => {
    if (view === "all") return MOCK_INST_EXAMS
    return MOCK_INST_EXAMS.filter(e => e.status === view)
  }, [view])

  return (
    <InstituteShell>
      <Page accent="sky" title="Exams" subtitle="Examination management, scheduling and grade entry.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Exams" value={MOCK_INST_EXAMS.length} accent="sky" icon="reports" />
          <Stat label="Upcoming" value={MOCK_INST_EXAMS.filter(e => e.status === "upcoming").length} accent="amber" icon="calendar" />
          <Stat label="In Progress" value={MOCK_INST_EXAMS.filter(e => e.status === "in_progress").length} accent="sky" icon="sparkle" />
          <Stat label="Graded" value={MOCK_INST_EXAMS.filter(e => e.status === "graded").length} accent="emerald" icon="check" />
        </div>

        <Tabs<View> value={view} onChange={setView} accent="sky" tabs={[
          { key: "all", label: "All", count: MOCK_INST_EXAMS.length },
          { key: "upcoming", label: "Upcoming", count: MOCK_INST_EXAMS.filter(e => e.status === "upcoming").length },
          { key: "in_progress", label: "In Progress", count: MOCK_INST_EXAMS.filter(e => e.status === "in_progress").length },
          { key: "completed", label: "Completed", count: MOCK_INST_EXAMS.filter(e => e.status === "completed").length },
          { key: "graded", label: "Graded", count: MOCK_INST_EXAMS.filter(e => e.status === "graded").length },
        ]} />

        <DataTable
          columns={[
            { key: "name", label: "Exam Name", render: (r) => r.name },
            { key: "groupName", label: "Group", render: (r) => groupName(r.groupId) },
            { key: "term", label: "Term", render: (r) => r.term, width: 80 },
            { key: "date", label: "Date", render: (r) => r.date, width: 100 },
            { key: "maxScore", label: "Max", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace" }}>{r.maxScore}</span>, width: 60 },
            { key: "status", label: "Status", render: (r) => <Pill tone={r.status === "upcoming" ? "amber" : r.status === "in_progress" ? "sky" : r.status === "graded" ? "emerald" : "neutral"}>{r.status.replace(/_/g, " ")}</Pill>, width: 110 },
          ]}
          rows={filtered}
          onRowClick={(e) => setActive(e)}
        />

        <Drawer open={!!active} onClose={() => setActive(null)} title={active?.name ?? "Exam"} subtitle={active ? groupName(active.groupId) : undefined} width={520}>
          {active && (
            <>
              <Card padding={18} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Term:</b> {active.term}</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Date:</b> {active.date}</div>
                <div style={{ fontSize: 13, color: T.tx }}><b>Max Score:</b> {active.maxScore}</div>
              </Card>
              <Section title="Grade Entry">
                <Card padding={14}>
                  {MOCK_INST_STUDENTS.filter(s => s.status === "active").slice(0, 6).map(s => (
                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.tx }}>{s.name}</span>
                      <div style={{ width: 80 }}><Input placeholder="Score" type="number" /></div>
                    </div>
                  ))}
                  <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Avg</div><div style={{ fontSize: 18, fontWeight: 800, color: T.sky, fontFamily: "'Space Grotesk', sans-serif" }}>72</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Highest</div><div style={{ fontSize: 18, fontWeight: 800, color: T.emerald, fontFamily: "'Space Grotesk', sans-serif" }}>95</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Lowest</div><div style={{ fontSize: 18, fontWeight: 800, color: T.red, fontFamily: "'Space Grotesk', sans-serif" }}>38</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Pass Rate</div><div style={{ fontSize: 18, fontWeight: 800, color: T.sky, fontFamily: "'Space Grotesk', sans-serif" }}>82%</div></div>
                  </div>
                </Card>
              </Section>
            </>
          )}
        </Drawer>
      </Page>
    </InstituteShell>
  )
}
