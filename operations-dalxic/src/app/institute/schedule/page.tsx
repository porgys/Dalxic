"use client"
import { useState, useMemo } from "react"
import { InstituteShell } from "@/components/ops/InstituteShell"
import { Page, Stat, Pill, Drawer, Tabs, DataTable, Card, T } from "@/components/ops/primitives"
import { MOCK_INST_SCHEDULE } from "@/lib/ops/mock"

type Day = "0" | "1" | "2" | "3" | "4"
const DAY_LABELS: Record<Day, string> = { "0": "Monday", "1": "Tuesday", "2": "Wednesday", "3": "Thursday", "4": "Friday" }

export default function SchedulePage() {
  const [day, setDay] = useState<Day>("0")
  const [active, setActive] = useState<typeof MOCK_INST_SCHEDULE[0] | null>(null)

  const filtered = useMemo(() =>
    MOCK_INST_SCHEDULE.filter(s => s.dayOfWeek === Number(day)).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [day])

  const totalSlots = MOCK_INST_SCHEDULE.length
  const groups = new Set(MOCK_INST_SCHEDULE.map(s => s.groupId)).size
  const staff = new Set(MOCK_INST_SCHEDULE.map(s => s.staffName)).size
  const rooms = new Set(MOCK_INST_SCHEDULE.map(s => s.room)).size

  return (
    <InstituteShell>
      <Page accent="sky" title="Schedule" subtitle="Timetable management across days, groups and rooms.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Slots" value={totalSlots} accent="sky" icon="calendar" />
          <Stat label="Groups Scheduled" value={groups} accent="sky" icon="tenants" />
          <Stat label="Staff Assigned" value={staff} accent="amber" icon="staff" />
          <Stat label="Rooms Used" value={rooms} accent="emerald" icon="branches" />
        </div>

        <Tabs<Day> value={day} onChange={setDay} accent="sky" tabs={[
          { key: "0", label: "Monday", count: MOCK_INST_SCHEDULE.filter(s => s.dayOfWeek === 0).length },
          { key: "1", label: "Tuesday", count: MOCK_INST_SCHEDULE.filter(s => s.dayOfWeek === 1).length },
          { key: "2", label: "Wednesday", count: MOCK_INST_SCHEDULE.filter(s => s.dayOfWeek === 2).length },
          { key: "3", label: "Thursday", count: MOCK_INST_SCHEDULE.filter(s => s.dayOfWeek === 3).length },
          { key: "4", label: "Friday", count: MOCK_INST_SCHEDULE.filter(s => s.dayOfWeek === 4).length },
        ]} />

        <DataTable
          columns={[
            { key: "time", label: "Time", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: T.sky }}>{r.startTime}–{r.endTime}</span>, width: 120 },
            { key: "subjectName", label: "Subject", render: (r) => r.subjectName },
            { key: "groupId", label: "Group", render: (r) => r.groupId },
            { key: "staffName", label: "Teacher", render: (r) => r.staffName },
            { key: "room", label: "Room", render: (r) => r.room, width: 80 },
          ]}
          rows={filtered}
          onRowClick={(s) => setActive(s)}
        />

        <Drawer open={!!active} onClose={() => setActive(null)} title={active?.subjectName ?? "Slot"} subtitle={`${DAY_LABELS[(String(active?.dayOfWeek ?? 0)) as Day] ?? ""} ${active?.startTime}–${active?.endTime}`} width={400}>
          {active && (
            <Card padding={18}>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Subject:</b> {active.subjectName}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Group:</b> {active.groupId}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Teacher:</b> {active.staffName}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Room:</b> {active.room}</div>
              <div style={{ fontSize: 13, color: T.tx }}><b>Time:</b> {active.startTime}–{active.endTime}</div>
            </Card>
          )}
        </Drawer>
      </Page>
    </InstituteShell>
  )
}
