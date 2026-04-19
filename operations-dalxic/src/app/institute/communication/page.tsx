"use client"
import { useState, useMemo } from "react"
import { InstituteShell } from "@/components/ops/InstituteShell"
import { Page, Stat, Pill, Drawer, Tabs, DataTable, Card, T } from "@/components/ops/primitives"
import { MOCK_INST_COMMUNICATION } from "@/lib/ops/mock"

type View = "all" | "notice" | "sms" | "circular" | "draft"

export default function CommunicationPage() {
  const [view, setView] = useState<View>("all")
  const [active, setActive] = useState<typeof MOCK_INST_COMMUNICATION[0] | null>(null)

  const filtered = useMemo(() => {
    if (view === "all") return MOCK_INST_COMMUNICATION
    if (view === "draft") return MOCK_INST_COMMUNICATION.filter(m => m.status === "draft")
    return MOCK_INST_COMMUNICATION.filter(m => m.type === view)
  }, [view])

  const total = MOCK_INST_COMMUNICATION.filter(m => m.status === "sent").length
  const notices = MOCK_INST_COMMUNICATION.filter(m => m.type === "notice").length
  const sms = MOCK_INST_COMMUNICATION.filter(m => m.type === "sms").length
  const circulars = MOCK_INST_COMMUNICATION.filter(m => m.type === "circular").length

  return (
    <InstituteShell>
      <Page accent="sky" title="Communication" subtitle="Notices, SMS and circulars — messaging centre.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Sent" value={total} accent="sky" icon="mail" />
          <Stat label="Notices" value={notices} accent="sky" icon="flag" />
          <Stat label="SMS" value={sms} accent="amber" icon="phone" />
          <Stat label="Circulars" value={circulars} accent="emerald" icon="share" />
        </div>

        <Tabs<View> value={view} onChange={setView} accent="sky" tabs={[
          { key: "all", label: "All", count: MOCK_INST_COMMUNICATION.length },
          { key: "notice", label: "Notices", count: notices },
          { key: "sms", label: "SMS", count: sms },
          { key: "circular", label: "Circulars", count: circulars },
          { key: "draft", label: "Drafts", count: MOCK_INST_COMMUNICATION.filter(m => m.status === "draft").length },
        ]} />

        <DataTable
          columns={[
            { key: "title", label: "Title", render: (r) => r.title },
            { key: "type", label: "Type", render: (r) => <Pill tone={r.type === "notice" ? "sky" : r.type === "sms" ? "amber" : "emerald"}>{r.type}</Pill>, width: 90 },
            { key: "recipients", label: "Recipients", render: (r) => r.recipients, width: 100 },
            { key: "sentBy", label: "Sent By", render: (r) => r.sentBy },
            { key: "sentAt", label: "Date", render: (r) => r.sentAt, width: 140 },
            { key: "status", label: "Status", render: (r) => <Pill tone={r.status === "sent" ? "emerald" : r.status === "draft" ? "neutral" : "amber"}>{r.status}</Pill>, width: 100 },
          ]}
          rows={filtered}
          onRowClick={(m) => setActive(m)}
        />

        <Drawer open={!!active} onClose={() => setActive(null)} title={active?.title ?? "Message"} subtitle={`${active?.type} · ${active?.sentAt}`} width={480}>
          {active && (
            <>
              <Card padding={18} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Type:</b> {active.type}</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Recipients:</b> {active.recipients}</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Sent By:</b> {active.sentBy}</div>
                <div style={{ fontSize: 13, color: T.tx }}><b>Status:</b> {active.status}</div>
              </Card>
              <Card padding={18}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Message Body</div>
                <div style={{ fontSize: 13, color: T.tx, lineHeight: 1.6 }}>{active.body}</div>
              </Card>
            </>
          )}
        </Drawer>
      </Page>
    </InstituteShell>
  )
}
