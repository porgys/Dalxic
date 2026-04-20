"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { T, Page, Stat, Tabs, DataTable, Pill, Card, Button, Field, Input, Select, TextArea } from "@/components/ops/primitives"
import type { Column } from "@/components/ops/primitives"
import { money, dateShort, relativeDays } from "@/lib/ops/format"
import { useAuth } from "@/lib/use-auth"
import type { MockTenant } from "@/lib/ops/mock"

type Accent = "amber" | "copper" | "sky" | "emerald"

interface StockLevel {
  id: string
  name: string
  sku: string
  current: number
  minStock: number
  lastMovement: string
}

interface StockMovement {
  id: string
  date: string
  item: string
  type: "sale" | "receive" | "adjust" | "transfer"
  qty: number
  balanceAfter: number
  operator: string
}

const DEMO_LEVELS: StockLevel[] = [
  { id: "SL-001", name: "Paracetamol 500mg", sku: "MED-001", current: 2400, minStock: 500, lastMovement: "2026-04-17" },
  { id: "SL-002", name: "Amoxicillin 250mg", sku: "MED-002", current: 860, minStock: 200, lastMovement: "2026-04-16" },
  { id: "SL-003", name: "Surgical Gloves (Box)", sku: "SUP-001", current: 180, minStock: 50, lastMovement: "2026-04-15" },
  { id: "SL-004", name: "IV Cannula (20G)", sku: "SUP-002", current: 320, minStock: 100, lastMovement: "2026-04-14" },
  { id: "SL-005", name: "Metformin 500mg", sku: "MED-003", current: 0, minStock: 300, lastMovement: "2026-04-10" },
  { id: "SL-006", name: "Bandage Roll 10cm", sku: "SUP-003", current: 45, minStock: 100, lastMovement: "2026-04-13" },
  { id: "SL-007", name: "Cetrizine 10mg", sku: "MED-004", current: 1200, minStock: 200, lastMovement: "2026-04-17" },
  { id: "SL-008", name: "Ibuprofen 400mg", sku: "MED-005", current: 90, minStock: 150, lastMovement: "2026-04-12" },
  { id: "SL-009", name: "Gauze Pad (Sterile)", sku: "SUP-004", current: 520, minStock: 100, lastMovement: "2026-04-16" },
  { id: "SL-010", name: "Omeprazole 20mg", sku: "MED-006", current: 0, minStock: 250, lastMovement: "2026-04-08" },
]

const DEMO_MOVEMENTS: StockMovement[] = [
  { id: "MV-001", date: "2026-04-17T14:22:00Z", item: "Paracetamol 500mg", type: "sale", qty: -30, balanceAfter: 2400, operator: "Ama K." },
  { id: "MV-002", date: "2026-04-17T11:05:00Z", item: "Cetrizine 10mg", type: "receive", qty: 500, balanceAfter: 1200, operator: "Kwame A." },
  { id: "MV-003", date: "2026-04-16T16:40:00Z", item: "Amoxicillin 250mg", type: "sale", qty: -20, balanceAfter: 860, operator: "Ama K." },
  { id: "MV-004", date: "2026-04-16T09:30:00Z", item: "Gauze Pad (Sterile)", type: "receive", qty: 200, balanceAfter: 520, operator: "Yaw B." },
  { id: "MV-005", date: "2026-04-15T15:18:00Z", item: "Surgical Gloves (Box)", type: "transfer", qty: -20, balanceAfter: 180, operator: "Kofi D." },
  { id: "MV-006", date: "2026-04-14T10:45:00Z", item: "IV Cannula (20G)", type: "sale", qty: -10, balanceAfter: 320, operator: "Ama K." },
  { id: "MV-007", date: "2026-04-13T08:20:00Z", item: "Bandage Roll 10cm", type: "sale", qty: -5, balanceAfter: 45, operator: "Kwame A." },
  { id: "MV-008", date: "2026-04-12T14:55:00Z", item: "Ibuprofen 400mg", type: "adjust", qty: -10, balanceAfter: 90, operator: "Yaw B." },
  { id: "MV-009", date: "2026-04-11T09:10:00Z", item: "Paracetamol 500mg", type: "receive", qty: 1000, balanceAfter: 2430, operator: "Kofi D." },
  { id: "MV-010", date: "2026-04-10T16:30:00Z", item: "Metformin 500mg", type: "sale", qty: -50, balanceAfter: 0, operator: "Ama K." },
]

const MOVE_TONE: Record<string, "emerald" | "amber" | "sky" | "copper"> = {
  sale: "amber", receive: "emerald", adjust: "sky", transfer: "copper",
}

function mapApiLevel(api: Record<string, unknown>): StockLevel {
  return {
    id: api.id as string,
    name: api.name as string,
    sku: (api.sku as string) ?? "",
    current: (api.stock as number) ?? 0,
    minStock: (api.minStock as number) ?? 0,
    lastMovement: (api.updatedAt as string) ?? (api.createdAt as string) ?? "",
  }
}

function mapApiMovement(api: Record<string, unknown>): StockMovement {
  return {
    id: api.id as string,
    date: api.createdAt as string,
    item: (api.serviceItem as { name?: string } | null)?.name ?? "",
    type: api.type as StockMovement["type"],
    qty: api.quantity as number,
    balanceAfter: api.balanceAfter as number,
    operator: (api.operator as { name?: string } | null)?.name ?? "",
  }
}

type TabKey = "levels" | "receive" | "adjust" | "movements"

export function StockPage({ accent, tenant }: { accent: Accent; tenant: MockTenant }) {
  const { authFetch, session } = useAuth()
  const [tab, setTab] = useState<TabKey>("levels")
  const [levels, setLevels] = useState<StockLevel[]>(DEMO_LEVELS)
  const [movements, setMovements] = useState<StockMovement[]>(DEMO_MOVEMENTS)
  const [loading, setLoading] = useState(false)
  const [branchId, setBranchId] = useState("")

  // Receive form state
  const [rcvItemId, setRcvItemId] = useState("")
  const [rcvQty, setRcvQty] = useState("")
  const [rcvBatch, setRcvBatch] = useState("")
  const [rcvExpiry, setRcvExpiry] = useState("")
  const [rcvRef, setRcvRef] = useState("")
  const [rcvBusy, setRcvBusy] = useState(false)

  // Adjust form state
  const [adjItemId, setAdjItemId] = useState("")
  const [adjBalance, setAdjBalance] = useState("")
  const [adjReason, setAdjReason] = useState("")
  const [adjBusy, setAdjBusy] = useState(false)

  const fetchLevels = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const res = await authFetch("/api/stock")
      const json = await res.json()
      if (json.success && json.data?.rows) {
        setLevels(json.data.rows.map(mapApiLevel))
      }
    } catch { /* demo fallback */ }
    finally { setLoading(false) }
  }, [session, authFetch])

  const fetchMovements = useCallback(async () => {
    if (!session) return
    try {
      const res = await authFetch("/api/stock/movements")
      const json = await res.json()
      if (json.success && json.data?.rows) {
        setMovements(json.data.rows.map(mapApiMovement))
      }
    } catch { /* demo fallback */ }
  }, [session, authFetch])

  useEffect(() => {
    fetchLevels()
    fetchMovements()
  }, [fetchLevels, fetchMovements])

  // Fetch the first branch for stock operations
  useEffect(() => {
    if (!session) return
    authFetch("/api/branches").then(r => r.json()).then(json => {
      if (json.success && json.data?.rows?.length) {
        setBranchId((json.data.rows[0] as { id: string }).id)
      }
    }).catch(() => {})
  }, [session, authFetch])

  async function handleReceive() {
    if (!session || !rcvItemId || !rcvQty || !branchId) return
    setRcvBusy(true)
    try {
      const res = await authFetch("/api/stock/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceItemId: rcvItemId,
          branchId,
          quantity: parseInt(rcvQty),
          batchNo: rcvBatch || undefined,
          expiresAt: rcvExpiry ? new Date(rcvExpiry).toISOString() : undefined,
          reference: rcvRef || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setRcvItemId(""); setRcvQty(""); setRcvBatch(""); setRcvExpiry(""); setRcvRef("")
        fetchLevels()
        fetchMovements()
      }
    } catch { /* silent */ }
    finally { setRcvBusy(false) }
  }

  async function handleAdjust() {
    if (!session || !adjItemId || adjBalance === "" || !branchId) return
    setAdjBusy(true)
    try {
      const res = await authFetch("/api/stock/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceItemId: adjItemId,
          branchId,
          newBalance: parseInt(adjBalance),
          notes: adjReason || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setAdjItemId(""); setAdjBalance(""); setAdjReason("")
        fetchLevels()
        fetchMovements()
      }
    } catch { /* silent */ }
    finally { setAdjBusy(false) }
  }

  const lowStock = useMemo(() => levels.filter(l => l.current > 0 && l.current < l.minStock).length, [levels])
  const outOfStock = useMemo(() => levels.filter(l => l.current === 0).length, [levels])
  const movements7d = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000
    return movements.filter(m => new Date(m.date).getTime() > cutoff).length
  }, [movements])

  const levelCols: Column<StockLevel>[] = [
    {
      key: "name", label: "Item Name", width: "30%",
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: T.tx, fontSize: 13 }}>{r.name}</div>
          <div style={{ fontSize: 11, color: T.txD, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{r.sku}</div>
        </div>
      ),
    },
    {
      key: "current", label: "Current Stock", align: "right",
      render: (r) => {
        const color = r.current === 0 ? T.red : r.current < r.minStock ? T.amber : T.emerald
        return <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color }}>{r.current.toLocaleString()}</span>
      },
    },
    { key: "min", label: "Min Stock", align: "right", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.txM }}>{r.minStock.toLocaleString()}</span> },
    {
      key: "status", label: "Status",
      render: (r) => {
        if (r.current === 0) return <Pill tone="red" dot>Out of Stock</Pill>
        if (r.current < r.minStock) return <Pill tone="amber" dot>Low Stock</Pill>
        return <Pill tone="emerald" dot>OK</Pill>
      },
    },
    { key: "lastMove", label: "Last Movement", render: (r) => <span style={{ fontSize: 12, color: T.txM }}>{relativeDays(r.lastMovement)}</span> },
  ]

  const moveCols: Column<StockMovement>[] = [
    { key: "date", label: "Date", render: (r) => <span style={{ fontSize: 12, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{dateShort(r.date)}</span> },
    { key: "item", label: "Item", width: "25%", render: (r) => <span style={{ fontWeight: 600, color: T.tx, fontSize: 13 }}>{r.item}</span> },
    { key: "type", label: "Type", render: (r) => <Pill tone={MOVE_TONE[r.type]}>{r.type}</Pill> },
    {
      key: "qty", label: "Qty", align: "right",
      render: (r) => (
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: r.qty > 0 ? T.emerald : T.amber }}>
          {r.qty > 0 ? `+${r.qty}` : r.qty}
        </span>
      ),
    },
    { key: "balance", label: "Balance After", align: "right", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.txM }}>{r.balanceAfter.toLocaleString()}</span> },
    { key: "operator", label: "Operator", render: (r) => <span style={{ fontSize: 12, color: T.txM }}>{r.operator}</span> },
  ]

  const stockTitle = tenant.type === "health" ? "Pharmacy Stock" : tenant.type === "institute" ? "Resource Stock" : "Stock Management"

  return (
    <Page title={stockTitle} accent={accent}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Total SKUs" value={levels.length} icon="inventory" accent={accent} />
        <Stat label="Low Stock" value={lowStock} icon="alert" accent="amber" />
        <Stat label="Out of Stock" value={outOfStock} icon="stock" accent="neutral" />
        <Stat label="Movements (7d)" value={movements7d} icon="trending" accent="sky" />
      </div>

      <Tabs
        tabs={[
          { key: "levels" as TabKey, label: "Levels", count: levels.length },
          { key: "receive" as TabKey, label: "Receive" },
          { key: "adjust" as TabKey, label: "Adjust" },
          { key: "movements" as TabKey, label: "Movements", count: movements.length },
        ]}
        value={tab}
        onChange={setTab}
        accent={accent}
      />

      {tab === "levels" && (
        <>
          {loading && <div style={{ textAlign: "center", padding: 12, fontSize: 12, color: T.txM }}>Loading stock...</div>}
          <DataTable rows={levels} columns={levelCols} empty="No stock items found." />
        </>
      )}

      {tab === "receive" && (
        <Card accent={accent} padding={32}>
          <div style={{ maxWidth: 560 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 24 }}>Receive Stock</h3>
            <Field label="Select Item">
              <Select value={rcvItemId} onChange={e => setRcvItemId(e.target.value)}>
                <option value="">Choose item...</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name} ({l.sku})</option>)}
              </Select>
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Quantity"><Input type="number" placeholder="0" value={rcvQty} onChange={e => setRcvQty(e.target.value)} /></Field>
              <Field label="Batch No"><Input placeholder="e.g. BAT-2026-04" style={{ fontFamily: "'DM Mono', monospace" }} value={rcvBatch} onChange={e => setRcvBatch(e.target.value)} /></Field>
              <Field label="Expiry Date"><Input type="date" value={rcvExpiry} onChange={e => setRcvExpiry(e.target.value)} /></Field>
              <Field label="Reference"><Input placeholder="Invoice or GRN number" value={rcvRef} onChange={e => setRcvRef(e.target.value)} /></Field>
            </div>
            <div style={{ marginTop: 8 }}>
              <Button onClick={handleReceive} disabled={rcvBusy}>{rcvBusy ? "Receiving..." : "Receive Stock"}</Button>
            </div>
          </div>
        </Card>
      )}

      {tab === "adjust" && (
        <Card accent={accent} padding={32}>
          <div style={{ maxWidth: 560 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 24 }}>Adjust Stock</h3>
            <Field label="Select Item">
              <Select value={adjItemId} onChange={e => setAdjItemId(e.target.value)}>
                <option value="">Choose item...</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name} ({l.sku})</option>)}
              </Select>
            </Field>
            <Field label="New Balance"><Input type="number" placeholder="Enter new stock count" value={adjBalance} onChange={e => setAdjBalance(e.target.value)} /></Field>
            <Field label="Reason"><TextArea placeholder="Reason for adjustment (e.g. physical count, damage, expiry)..." value={adjReason} onChange={e => setAdjReason(e.target.value)} /></Field>
            <div style={{ marginTop: 8 }}>
              <Button onClick={handleAdjust} disabled={adjBusy}>{adjBusy ? "Adjusting..." : "Adjust Stock"}</Button>
            </div>
          </div>
        </Card>
      )}

      {tab === "movements" && (
        <DataTable rows={movements} columns={moveCols} empty="No movements recorded." />
      )}
    </Page>
  )
}
