"use client"
import { useState } from "react"
import { InstituteShell } from "@/components/ops/InstituteShell"
import { Page, Stat, Pill, Drawer, DataTable, Card, T } from "@/components/ops/primitives"
import { MOCK_INST_CALENDAR } from "@/lib/ops/mock"

export default function CalendarPage() {
  const [active, setActive] = useState<typeof MOCK_INST_CALENDAR[0] | null>(null)

  const upcoming = MOCK_INST_CALENDAR.filter(e => e.date >= "2026-04-17").length
  const holidays = MOCK_INST_CALENDAR.filter(e => e.type === "holiday").length
  const exams = MOCK_INST_CALENDAR.filter(e => e.type === "exam").length
  const meetings = MOCK_INST_CALENDAR.filter(e => e.type === "meeting").length

  return (
    <InstituteShell>
      <Page accent="sky" title="Academic Calendar" subtitle="Term events, holidays, exam periods and meetings.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Upcoming Events" value={upcoming} accent="sky" icon="calendar" />
          <Stat label="Holidays This Term" value={holidays} accent="emerald" icon="sparkle" />
          <Stat label="Exam Periods" value={exams} accent="amber" icon="reports" />
          <Stat label="Meetings" value={meetings} accent="sky" icon="customers" />
        </div>

        <DataTable
          columns={[
            { key: "date", label: "Date", render: (r) => r.date, width: 100 },
            { key: "title", label: "Event", render: (r) => r.title },
            { key: "type", label: "Type", render: (r) => <Pill tone={r.type === "holiday" ? "emerald" : r.type === "exam" ? "amber" : r.type === "meeting" ? "sky" : "neutral"}>{r.type}</Pill>, width: 100 },
            { key: "description", label: "Description", render: (r) => r.description },
          ]}
          rows={MOCK_INST_CALENDAR}
          onRowClick={(e) => setActive(e)}
        />

        <Drawer open={!!active} onClose={() => setActive(null)} title={active?.title ?? "Event"} subtitle={active?.date} width={440}>
          {active && (
            <Card padding={18}>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Date:</b> {active.date}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Type:</b> {active.type}</div>
              <div style={{ fontSize: 13, color: T.tx }}><b>Description:</b> {active.description}</div>
            </Card>
          )}
        </Drawer>
      </Page>
    </InstituteShell>
  )
}
