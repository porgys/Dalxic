"use client"
import { useState, useMemo } from "react"
import { InstituteShell } from "@/components/ops/InstituteShell"
import { Page, Stat, Pill, Drawer, Tabs, DataTable, Card, T } from "@/components/ops/primitives"
import { MOCK_INST_ATTENDANCE, MOCK_INST_GROUPS } from "@/lib/ops/mock"

type View = "daily" | "weekly" | "student"

export default function AttendancePage() {
  const [view, setView] = useState<View>("daily")
  const [active, setActive] = useState<typeof MOCK_INST_ATTENDANCE[0] | null>(null)

  const groupName = (gid: string) => MOCK_INST_GROUPS.find(g => g.id === gid)?.name ?? gid

  const todayRate = MOCK_INST_ATTENDANCE.length > 0
    ? Math.round((MOCK_INST_ATTENDANCE.reduce((s, a) => s + a.present, 0) / MOCK_INST_ATTENDANCE.reduce((s, a) => s + a.total, 0)) * 100)
    : 0

  return (
    <InstituteShell>
      <Page accent="sky" title="Attendance" subtitle="Daily attendance tracking, weekly summaries and student view.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Todays Present %" value={`${todayRate}%`} accent="sky" icon="check" />
          <Stat label="Week Avg" value={`${todayRate - 2}%`} accent="sky" icon="analytics" />
          <Stat label="Chronic Absentees" value={3} accent="neutral" icon="bolt" />
          <Stat label="Perfect Attendance" value={12} accent="emerald" icon="sparkle" />
        </div>

        <Tabs<View> value={view} onChange={setView} accent="sky" tabs={[
          { key: "daily", label: "Daily View" },
          { key: "weekly", label: "Weekly Summary" },
          { key: "student", label: "Student View" },
        ]} />

        {view === "daily" && (
          <DataTable
            columns={[
              { key: "date", label: "Date", render: (r) => r.date, width: 100 },
              { key: "groupName", label: "Group", render: (r) => groupName(r.groupId) },
              { key: "present", label: "Present", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", color: T.emerald }}>{r.present}</span>, width: 70 },
              { key: "absent", label: "Absent", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", color: T.red }}>{r.absent}</span>, width: 70 },
              { key: "late", label: "Late", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", color: T.amber }}>{r.late}</span>, width: 60 },
              { key: "rate", label: "Rate %", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: Math.round((r.present / r.total) * 100) >= 90 ? T.emerald : T.amber }}>{Math.round((r.present / r.total) * 100)}%</span>, width: 80 },
            ]}
            rows={MOCK_INST_ATTENDANCE}
            onRowClick={(a) => setActive(a)}
          />
        )}

        {view === "weekly" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
              <Card key={day} padding={18} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>{day}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.sky, fontFamily: "'Space Grotesk', sans-serif" }}>{[92, 88, 95, 90, 87][i]}%</div>
              </Card>
            ))}
          </div>
        )}

        {view === "student" && (
          <DataTable
            columns={[
              { key: "name", label: "Student", render: (r) => r.name },
              { key: "daysPresent", label: "Present", render: (r) => r.daysPresent, width: 80 },
              { key: "daysAbsent", label: "Absent", render: (r) => r.daysAbsent, width: 80 },
              { key: "rate", label: "Rate %", render: (r) => r.rate, width: 80 },
              { key: "status", label: "Status", render: (r) => r.status, width: 100 },
            ]}
            rows={[
              { id: "s1", name: "Kwame Mensah", daysPresent: "45", daysAbsent: "3", rate: <span style={{ fontFamily: "'DM Mono', monospace", color: T.emerald }}>94%</span>, status: <Pill tone="emerald">Good</Pill> },
              { id: "s2", name: "Ama Serwaa", daysPresent: "48", daysAbsent: "0", rate: <span style={{ fontFamily: "'DM Mono', monospace", color: T.emerald }}>100%</span>, status: <Pill tone="emerald">Perfect</Pill> },
              { id: "s3", name: "Yaw Boateng", daysPresent: "38", daysAbsent: "10", rate: <span style={{ fontFamily: "'DM Mono', monospace", color: T.red }}>79%</span>, status: <Pill tone="red">At Risk</Pill> },
              { id: "s4", name: "Abena Konadu", daysPresent: "42", daysAbsent: "6", rate: <span style={{ fontFamily: "'DM Mono', monospace", color: T.amber }}>88%</span>, status: <Pill tone="amber">Monitor</Pill> },
              { id: "s5", name: "Kofi Asante", daysPresent: "46", daysAbsent: "2", rate: <span style={{ fontFamily: "'DM Mono', monospace", color: T.emerald }}>96%</span>, status: <Pill tone="emerald">Good</Pill> },
            ]}
          />
        )}

        <Drawer open={!!active} onClose={() => setActive(null)} title={`${active ? groupName(active.groupId) : "Group"} — ${active?.date}`} subtitle="Attendance Detail" width={440}>
          {active && (
            <Card padding={18}>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Date:</b> {active.date}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Group:</b> {groupName(active.groupId)}</div>
              <div style={{ fontSize: 13, color: T.emerald, marginBottom: 6 }}><b>Present:</b> {active.present}</div>
              <div style={{ fontSize: 13, color: T.red, marginBottom: 6 }}><b>Absent:</b> {active.absent}</div>
              <div style={{ fontSize: 13, color: T.amber }}><b>Late:</b> {active.late}</div>
            </Card>
          )}
        </Drawer>
      </Page>
    </InstituteShell>
  )
}
