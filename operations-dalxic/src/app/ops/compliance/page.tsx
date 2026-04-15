"use client"
/* ═══════════════════════════════════════════════════════════════
   /ops/compliance — GRA / SSNIT / PAYE / DPA filing tracker
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { OpsPage } from "@/components/ops/OpsShell"
import {
  Card, Stat, Pill, Button, DataTable, Drawer, SearchBar,
  Tabs, Section, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { MOCK_FILINGS, MockFiling, FilingType, FilingStatus } from "@/lib/ops/mock"

type View = "all" | "due" | "overdue" | "filed" | "accepted"

const STATUS_TONE: Record<FilingStatus, Tone> = {
  due: "amber", overdue: "red", filed: "sky", accepted: "emerald",
}

const TYPE_META: Record<FilingType, { label: string; body: string; tone: Tone }> = {
  "VAT-3":       { label: "VAT-3",       body: "Value Added Tax + NHIL + GETFund + COVID Levy", tone: "emerald" },
  "SSNIT":       { label: "SSNIT",       body: "Social Security Tier 1 contributions",          tone: "sky" },
  "PAYE":        { label: "PAYE",        body: "Pay-As-You-Earn income tax",                    tone: "amber" },
  "DPA":         { label: "DPA",         body: "Data Protection Commission annual renewal",     tone: "neutral" },
  "GRA-Annual":  { label: "GRA Annual",  body: "Ghana Revenue Authority corporate tax return",  tone: "red" },
}

export default function OpsCompliancePage() {
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [type, setType] = useState<FilingType | "All">("All")
  const [active, setActive] = useState<MockFiling | null>(null)

  const filtered = useMemo(() => MOCK_FILINGS.filter(f => {
    if (view !== "all" && f.status !== view) return false
    if (type !== "All" && f.type !== type) return false
    if (!query) return true
    const q = query.toLowerCase()
    return f.id.toLowerCase().includes(q)
        || f.tenantName.toLowerCase().includes(q)
        || (f.reference ?? "").toLowerCase().includes(q)
  }), [view, query, type])

  const totals = {
    total:    MOCK_FILINGS.length,
    due:      MOCK_FILINGS.filter(f => f.status === "due").length,
    overdue:  MOCK_FILINGS.filter(f => f.status === "overdue").length,
    accepted: MOCK_FILINGS.filter(f => f.status === "accepted").length,
    totalGhs: MOCK_FILINGS.filter(f => f.status !== "accepted").reduce((s, f) => s + (f.amount ?? 0), 0),
  }

  const cols: Column<MockFiling>[] = [
    { key: "id", label: "Filing", width: 110, render: (f) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 800, color: T.emerald }}>{f.id}</span>
    )},
    { key: "tenant", label: "Tenant", render: (f) => (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>{f.tenantName}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{f.tenantId}</div>
      </div>
    )},
    { key: "type", label: "Type", width: 130, render: (f) => <Pill tone={TYPE_META[f.type].tone}>{TYPE_META[f.type].label}</Pill> },
    { key: "period", label: "Period", width: 120, render: (f) => (
      <span style={{ fontSize: 12, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{f.period}</span>
    )},
    { key: "due", label: "Due", width: 120, render: (f) => (
      <span style={{ fontSize: 11, color: f.status === "overdue" ? T.red : T.txM, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{f.dueOn}</span>
    )},
    { key: "amount", label: "Amount", width: 120, align: "right", render: (f) => (
      <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", fontWeight: 800, color: T.tx }}>
        {f.amount ? `GHS ${f.amount.toLocaleString()}` : "—"}
      </span>
    )},
    { key: "status", label: "Status", width: 120, render: (f) => <Pill tone={STATUS_TONE[f.status]} dot>{f.status}</Pill> },
  ]

  return (
    <>
      <OpsPage
        title="Compliance"
        subtitle="Every tax, social, and regulatory filing — across every tenant. Ghana Revenue Authority, SSNIT, and the Data Protection Commission."
        icon="compliance"
        action={<Button icon="download">Export Filing Pack</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Filings"   value={totals.total}                             accent="emerald" icon="compliance" />
          <Stat label="Due This Period" value={totals.due}                               accent="amber"   icon="bolt" />
          <Stat label="Overdue"         value={totals.overdue}                           accent="amber"   icon="lock" sub="Escalate immediately" />
          <Stat label="Outstanding"     value={`GHS ${totals.totalGhs.toLocaleString()}`} accent="emerald" icon="billing" sub="Filings not yet accepted" />
        </div>

        {totals.overdue > 0 && (
          <Card padding={16} style={{ marginBottom: 28, background: `${T.red}0A`, border: `1px dashed ${T.red}40` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Icon name="bolt" size={16} color={T.red} />
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.red, fontFamily: "'DM Mono', monospace" }}>
                {totals.overdue} overdue filing{totals.overdue > 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ fontSize: 12, color: T.txM, marginTop: 4, lineHeight: 1.5 }}>
              GRA penalties accrue at GHS 500/month plus 125% of unpaid tax. Contact affected tenants within 24 hours.
            </div>
          </Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 28 }}>
          {(Object.keys(TYPE_META) as FilingType[]).map(t => {
            const m = TYPE_META[t]
            const count = MOCK_FILINGS.filter(f => f.type === t).length
            const active = MOCK_FILINGS.filter(f => f.type === t && f.status !== "accepted").length
            return (
              <Card key={t} padding={16} hover style={{ cursor: "pointer" }}>
                <div onClick={() => setType(t)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Pill tone={m.tone}>{m.label}</Pill>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 800, color: active > 0 ? T.amber : T.emerald }}>
                      {active}/{count}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: T.txM, lineHeight: 1.4 }}>{m.body}</div>
                </div>
              </Card>
            )
          })}
        </div>

        <Section
          title="All Filings"
          action={<div style={{ width: 320 }}><SearchBar value={query} onChange={setQuery} placeholder="Filing ID, tenant, reference…" /></div>}
        >
          <Tabs<View>
            value={view} onChange={setView} accent="emerald"
            tabs={[
              { key: "all",      label: "All",      count: MOCK_FILINGS.length },
              { key: "due",      label: "Due",      count: MOCK_FILINGS.filter(f => f.status === "due").length },
              { key: "overdue",  label: "Overdue",  count: MOCK_FILINGS.filter(f => f.status === "overdue").length },
              { key: "filed",    label: "Filed",    count: MOCK_FILINGS.filter(f => f.status === "filed").length },
              { key: "accepted", label: "Accepted", count: MOCK_FILINGS.filter(f => f.status === "accepted").length },
            ]}
          />

          {type !== "All" && (
            <div style={{ marginBottom: 14 }}>
              <Pill tone={TYPE_META[type].tone}>Type · {TYPE_META[type].label}</Pill>{" "}
              <button onClick={() => setType("All")} style={{
                background: "transparent", border: "none", color: T.txM, fontSize: 11,
                fontFamily: "'DM Mono', monospace", cursor: "pointer", textDecoration: "underline",
              }}>clear</button>
            </div>
          )}

          <DataTable rows={filtered} columns={cols} onRowClick={(f) => setActive(f)} />
        </Section>
      </OpsPage>

      <FilingDrawer filing={active} onClose={() => setActive(null)} />
    </>
  )
}

function FilingDrawer({ filing, onClose }: { filing: MockFiling | null; onClose: () => void }) {
  if (!filing) return <Drawer open={false} onClose={onClose} title="Filing">{null}</Drawer>
  const meta = TYPE_META[filing.type]

  return (
    <Drawer
      open={!!filing} onClose={onClose}
      title={filing.id}
      subtitle={`${meta.label} · ${filing.period}`}
      width={540}
      footer={
        <>
          <Button variant="ghost" icon="mail">Notify Tenant</Button>
          <Button variant="outline" icon="download">Download Proof</Button>
          {filing.status !== "accepted" && <Button icon="check">Mark Filed</Button>}
        </>
      }
    >
      <Card padding={20} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Pill tone={STATUS_TONE[filing.status]} dot>{filing.status}</Pill>
          <Pill tone={meta.tone}>{meta.label}</Pill>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}>
          {filing.tenantName}
        </div>
        <div style={{ fontSize: 12, color: T.txM, marginTop: 6, fontFamily: "'DM Mono', monospace" }}>{filing.tenantId}</div>
        <div style={{ fontSize: 13, color: T.txM, marginTop: 14, lineHeight: 1.5 }}>{meta.body}</div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <MiniStat label="Period" value={filing.period} />
        <MiniStat label="Due" value={filing.dueOn} highlight={filing.status === "overdue" ? T.red : undefined} />
        <MiniStat label="Filed" value={filing.filedOn ?? "—"} />
        <MiniStat label="Amount" value={filing.amount ? `GHS ${filing.amount.toLocaleString()}` : "—"} />
      </div>

      {filing.reference && (
        <Section title="Authority Reference">
          <Card padding={16}>
            <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700, marginBottom: 6 }}>
              Confirmation Number
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.emerald, fontFamily: "'DM Mono', monospace" }}>
              {filing.reference}
            </div>
          </Card>
        </Section>
      )}

      {filing.status === "overdue" && (
        <Card padding={16} style={{ marginTop: 20, background: `${T.red}0A`, border: `1px dashed ${T.red}40` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="bolt" size={16} color={T.red} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.red, fontFamily: "'DM Mono', monospace" }}>Overdue</div>
          </div>
          <div style={{ fontSize: 12, color: T.txM, marginTop: 8, lineHeight: 1.5 }}>
            Penalties accrue at GHS 500/month plus 125% of unpaid tax. Escalate within 24 hours — contact tenant owner directly.
          </div>
        </Card>
      )}
    </Drawer>
  )
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div style={{ padding: 12, background: T.surface2, borderRadius: 10, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 9, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: highlight ?? T.tx, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>{value}</div>
    </div>
  )
}
