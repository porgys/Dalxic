"use client"
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import { Stat, Card, Pill, Tabs, DataTable, Drawer, T, Section, Button } from "@/components/ops/primitives"
import type { Column, Tone } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_FILINGS, MockFiling, FilingType, FilingStatus } from "@/lib/ops/mock"
import { money, dateShort } from "@/lib/ops/format"

const STATUS_TONE: Record<FilingStatus, Tone> = {
  due:      "amber",
  filed:    "sky",
  overdue:  "red",
  accepted: "emerald",
}

const TYPE_TONE: Record<FilingType, Tone> = {
  "VAT-3":      "amber",
  "SSNIT":      "sky",
  "PAYE":       "copper",
  "DPA":        "emerald",
  "GRA-Annual": "red",
}

const FILING_CARDS: { type: FilingType; description: string }[] = [
  { type: "VAT-3",      description: "Monthly VAT return to GRA. Due 21st of following month." },
  { type: "SSNIT",      description: "Social Security contribution. Due 14th of following month." },
  { type: "PAYE",       description: "Pay-As-You-Earn income tax. Due 14th of following month." },
  { type: "DPA",        description: "Data Protection Authority annual registration." },
  { type: "GRA-Annual", description: "Annual income tax return to Ghana Revenue Authority." },
]

type TabKey = "all" | "due" | "overdue" | "filed" | "accepted"

export default function CompliancePage() {
  const [tab, setTab] = useState<TabKey>("all")
  const [selected, setSelected] = useState<MockFiling | null>(null)

  const totalFilings = MOCK_FILINGS.length
  const dueCount     = MOCK_FILINGS.filter(f => f.status === "due").length
  const overdueCount = MOCK_FILINGS.filter(f => f.status === "overdue").length
  const outstanding  = MOCK_FILINGS.filter(f => f.status === "due" || f.status === "overdue").reduce((s, f) => s + (f.amount ?? 0), 0)

  const filtered = useMemo(() => {
    if (tab === "all") return MOCK_FILINGS
    return MOCK_FILINGS.filter(f => f.status === tab)
  }, [tab])

  const now = new Date()

  const columns: Column<MockFiling>[] = [
    { key: "id",     label: "ID",     width: 90,  render: r => <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: T.txD }}>{r.id}</span> },
    { key: "tenant", label: "Tenant", width: 200, render: r => <span style={{ fontWeight: 600, color: T.tx }}>{r.tenantName}</span> },
    { key: "type",   label: "Type",   width: 110, render: r => <Pill tone={TYPE_TONE[r.type]}>{r.type}</Pill> },
    { key: "period", label: "Period", width: 110, render: r => <span style={{ color: T.txM }}>{r.period}</span> },
    {
      key: "due", label: "Due Date", width: 120,
      render: r => {
        const overdue = new Date(r.dueOn) < now && (r.status === "due" || r.status === "overdue")
        return <span style={{ color: overdue ? T.red : T.txM, fontWeight: overdue ? 700 : 400 }}>{dateShort(r.dueOn)}</span>
      },
    },
    { key: "amount", label: "Amount", width: 110, align: "right", render: r => <span style={{ fontFamily: "'DM Mono', monospace", color: T.tx }}>{r.amount ? money(r.amount) : "--"}</span> },
    { key: "status", label: "Status", width: 100, render: r => <Pill tone={STATUS_TONE[r.status]} dot>{r.status}</Pill> },
  ]

  return (
    <OpsPage title="Tax & Regulatory Filings" subtitle="Track every filing obligation across all tenants. GRA, SSNIT, DPA compliance." icon="compliance">
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <Stat label="Total Filings" value={totalFilings} sub="All types, all tenants" icon="compliance" />
        <Stat label="Due This Period" value={dueCount} icon="clock" accent="amber" />
        <Stat label="Overdue" value={overdueCount} icon="alert" accent={overdueCount > 0 ? "amber" : "emerald"} />
        <Stat label="Outstanding" value={money(outstanding)} sub="Due + overdue combined" icon="billing" accent={outstanding > 0 ? "amber" : "emerald"} />
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div style={{
          border: `2px dashed ${T.red}`,
          borderRadius: 14,
          padding: "18px 24px",
          marginBottom: 32,
          background: `${T.red}08`,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.red}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="alert" size={18} color={T.red} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 2 }}>
              {overdueCount} overdue filing{overdueCount > 1 ? "s" : ""} require immediate attention
            </div>
            <div style={{ fontSize: 12, color: T.txM }}>
              Penalties accrue daily. Filter by "Overdue" to review affected tenants.
            </div>
          </div>
        </div>
      )}

      {/* Filing type cards */}
      <Section title="Filing Types" sub="5 obligation categories tracked">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 8 }}>
          {FILING_CARDS.map(fc => {
            const count = MOCK_FILINGS.filter(f => f.type === fc.type).length
            const status = MOCK_FILINGS.filter(f => f.type === fc.type && f.status === "overdue").length > 0
              ? "overdue"
              : MOCK_FILINGS.filter(f => f.type === fc.type && f.status === "due").length > 0
                ? "due"
                : "accepted"
            return (
              <Card key={fc.type} hover>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <Pill tone={TYPE_TONE[fc.type]}>{fc.type}</Pill>
                  <Pill tone={STATUS_TONE[status as FilingStatus]} dot>{status}</Pill>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4 }}>
                  {count}
                </div>
                <div style={{ fontSize: 11, color: T.txD, lineHeight: 1.4 }}>{fc.description}</div>
              </Card>
            )
          })}
        </div>
      </Section>

      {/* Tabs + table */}
      <Section title="All Filings">
        <Tabs<TabKey>
          tabs={[
            { key: "all",      label: "All",      count: MOCK_FILINGS.length },
            { key: "due",      label: "Due",       count: dueCount },
            { key: "overdue",  label: "Overdue",   count: overdueCount },
            { key: "filed",    label: "Filed",     count: MOCK_FILINGS.filter(f => f.status === "filed").length },
            { key: "accepted", label: "Accepted",  count: MOCK_FILINGS.filter(f => f.status === "accepted").length },
          ]}
          value={tab}
          onChange={setTab}
        />
        <DataTable rows={filtered} columns={columns} onRowClick={setSelected} empty="No filings match this filter." />
      </Section>

      {/* Drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.id ?? ""}
        subtitle={selected?.tenantName}
        width={540}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            <Button variant="outline" icon="download">Export PDF</Button>
          </>
        }
      >
        {selected && (
          <div>
            {/* Top pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <Pill tone={STATUS_TONE[selected.status]} dot>{selected.status}</Pill>
              <Pill tone={TYPE_TONE[selected.type]}>{selected.type}</Pill>
            </div>

            {/* Tenant */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Tenant</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.tx }}>{selected.tenantName}</div>
              <div style={{ fontSize: 11, color: T.txD, fontFamily: "'DM Mono', monospace" }}>{selected.tenantId}</div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Description</div>
              <div style={{ fontSize: 13, color: T.txM, lineHeight: 1.5 }}>
                {FILING_CARDS.find(fc => fc.type === selected.type)?.description ?? "--"}
              </div>
            </div>

            {/* Mini stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Period", value: selected.period },
                { label: "Due Date", value: dateShort(selected.dueOn) },
                { label: "Amount", value: selected.amount ? money(selected.amount) : "--" },
                { label: "Filed On", value: selected.filedOn ? dateShort(selected.filedOn) : "--" },
              ].map(m => (
                <div key={m.label} style={{
                  background: `rgba(16,185,129,0.04)`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  border: `1px solid ${T.border}`,
                }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Authority reference */}
            {selected.reference && (
              <div style={{
                background: `${T.emerald}06`,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: "14px 16px",
              }}>
                <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>
                  Authority Reference
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.emeraldL, fontFamily: "'DM Mono', monospace" }}>
                  {selected.reference}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </OpsPage>
  )
}
