"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { T, Page, Stat, Tabs, SearchBar, Select, DataTable, Pill, Drawer, Modal, Button, Field, Input, TextArea, Card } from "@/components/ops/primitives"
import type { Column } from "@/components/ops/primitives"
import { money } from "@/lib/ops/format"
import { useAuth } from "@/lib/use-auth"
import type { MockTenant, Behaviour, StockType } from "@/lib/ops/mock"

type Accent = "amber" | "copper" | "sky" | "emerald"

interface CatalogueItem {
  id: string
  name: string
  sku: string
  category: string
  behaviour: Behaviour
  stockType: StockType
  costPrice: number
  sellingPrice: number
  stock: number | null
  minStock: number | null
  status: "active" | "inactive"
  description: string
}

const DEMO_ITEMS: CatalogueItem[] = [
  { id: "SI-001", name: "Consultation Fee", sku: "CONS-001", category: "Services", behaviour: "consultation", stockType: "service", costPrice: 0, sellingPrice: 150, stock: null, minStock: null, status: "active", description: "Standard consultation" },
  { id: "SI-002", name: "Paracetamol 500mg", sku: "MED-001", category: "Medication", behaviour: "product", stockType: "physical", costPrice: 2.5, sellingPrice: 5, stock: 2400, minStock: 500, status: "active", description: "Pain relief tablets" },
  { id: "SI-003", name: "Amoxicillin 250mg", sku: "MED-002", category: "Medication", behaviour: "product", stockType: "physical", costPrice: 8, sellingPrice: 18, stock: 860, minStock: 200, status: "active", description: "Broad-spectrum antibiotic capsules" },
  { id: "SI-004", name: "Blood Test Panel", sku: "LAB-001", category: "Lab Work", behaviour: "procedure", stockType: "service", costPrice: 0, sellingPrice: 120, stock: null, minStock: null, status: "active", description: "Full blood count, liver function, kidney function" },
  { id: "SI-005", name: "Hospital Bed (Ward)", sku: "BED-001", category: "Facility", behaviour: "admission", stockType: "capacity", costPrice: 0, sellingPrice: 350, stock: 24, minStock: 4, status: "active", description: "General ward bed per night" },
  { id: "SI-006", name: "Surgical Gloves (Box)", sku: "SUP-001", category: "Supplies", behaviour: "product", stockType: "physical", costPrice: 45, sellingPrice: 72, stock: 180, minStock: 50, status: "active", description: "Latex-free, box of 100" },
  { id: "SI-007", name: "Weekly Physiotherapy", sku: "REC-001", category: "Recurring", behaviour: "recurring", stockType: "service", costPrice: 0, sellingPrice: 200, stock: null, minStock: null, status: "active", description: "Weekly physiotherapy session subscription" },
  { id: "SI-008", name: "X-Ray (Chest)", sku: "RAD-001", category: "Radiology", behaviour: "procedure", stockType: "service", costPrice: 0, sellingPrice: 180, stock: null, minStock: null, status: "active", description: "Standard chest X-ray" },
  { id: "SI-009", name: "IV Cannula (20G)", sku: "SUP-002", category: "Supplies", behaviour: "product", stockType: "physical", costPrice: 3.2, sellingPrice: 8, stock: 320, minStock: 100, status: "active", description: "Sterile IV cannula, gauge 20" },
  { id: "SI-010", name: "Metformin 500mg", sku: "MED-003", category: "Medication", behaviour: "product", stockType: "physical", costPrice: 4.5, sellingPrice: 12, stock: 0, minStock: 300, status: "active", description: "Diabetes management tablets" },
  { id: "SI-011", name: "ICU Bed", sku: "BED-002", category: "Facility", behaviour: "admission", stockType: "capacity", costPrice: 0, sellingPrice: 1200, stock: 6, minStock: 2, status: "active", description: "Intensive care unit bed per night" },
  { id: "SI-012", name: "Dental Check-up", sku: "DEN-001", category: "Services", behaviour: "consultation", stockType: "service", costPrice: 0, sellingPrice: 80, stock: null, minStock: null, status: "active", description: "Routine dental examination" },
  { id: "SI-013", name: "Bandage Roll 10cm", sku: "SUP-003", category: "Supplies", behaviour: "product", stockType: "physical", costPrice: 1.8, sellingPrice: 4, stock: 45, minStock: 100, status: "active", description: "Elastic bandage roll" },
  { id: "SI-014", name: "Monthly Dialysis Plan", sku: "REC-002", category: "Recurring", behaviour: "recurring", stockType: "service", costPrice: 0, sellingPrice: 2800, stock: null, minStock: null, status: "inactive", description: "Monthly dialysis subscription package" },
  { id: "SI-015", name: "Ultrasound Scan", sku: "RAD-002", category: "Radiology", behaviour: "procedure", stockType: "service", costPrice: 0, sellingPrice: 250, stock: null, minStock: null, status: "active", description: "Abdominal or pelvic ultrasound" },
]

const BEHAVIOUR_TONE: Record<Behaviour, "emerald" | "amber" | "sky" | "copper" | "neutral"> = {
  consultation: "sky", procedure: "copper", product: "emerald", admission: "amber", recurring: "neutral", admin: "neutral",
}

interface ApiCategory {
  id: string
  name: string
}

function mapApiItem(api: Record<string, unknown>): CatalogueItem {
  return {
    id: api.id as string,
    name: api.name as string,
    sku: (api.sku as string) ?? "",
    category: (api.category as { name?: string } | null)?.name ?? "Uncategorised",
    behaviour: api.behaviour as Behaviour,
    stockType: api.stockType as StockType,
    costPrice: ((api.costPrice as number) ?? 0) / 100,
    sellingPrice: ((api.sellingPrice as number) ?? 0) / 100,
    stock: api.stock as number | null,
    minStock: api.minStock as number | null,
    status: (api.isActive as boolean) ? "active" : "inactive",
    description: (api.description as string) ?? "",
  }
}

type TabKey = "all" | Behaviour

export function CataloguePage({ accent, tenant }: { accent: Accent; tenant: MockTenant }) {
  const { authFetch, session } = useAuth()
  const [tab, setTab] = useState<TabKey>("all")
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [selected, setSelected] = useState<CatalogueItem | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [items, setItems] = useState<CatalogueItem[]>(DEMO_ITEMS)
  const [loading, setLoading] = useState(false)
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([])

  // Form state for Add Item modal
  const [formName, setFormName] = useState("")
  const [formSku, setFormSku] = useState("")
  const [formCategoryId, setFormCategoryId] = useState("")
  const [formBehaviour, setFormBehaviour] = useState("")
  const [formStockType, setFormStockType] = useState("")
  const [formCostPrice, setFormCostPrice] = useState("")
  const [formSellingPrice, setFormSellingPrice] = useState("")
  const [formStock, setFormStock] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [creating, setCreating] = useState(false)

  const fetchItems = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const res = await authFetch("/api/catalogue")
      const json = await res.json()
      if (json.success && json.data?.rows) {
        setItems(json.data.rows.map(mapApiItem))
      }
    } catch { /* fall back to demo data */ }
    finally { setLoading(false) }
  }, [session, authFetch])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Fetch categories for the Add Item form
  useEffect(() => {
    if (!session) return
    authFetch("/api/categories").then(r => r.json()).then(json => {
      if (json.success && json.data?.rows) {
        setApiCategories(json.data.rows as ApiCategory[])
      }
    }).catch(() => {})
  }, [session, authFetch])

  async function handleCreate() {
    if (!session || !formName || !formCategoryId || !formBehaviour || !formStockType || !formSellingPrice) return
    setCreating(true)
    try {
      const res = await authFetch("/api/catalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: formCategoryId,
          name: formName,
          sku: formSku || undefined,
          behaviour: formBehaviour,
          stockType: formStockType,
          unit: "piece",
          costPrice: Math.round(parseFloat(formCostPrice || "0") * 100),
          sellingPrice: Math.round(parseFloat(formSellingPrice) * 100),
          stock: formStock ? parseInt(formStock) : 0,
          description: formDescription || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShowAdd(false)
        setFormName(""); setFormSku(""); setFormCategoryId(""); setFormBehaviour("")
        setFormStockType(""); setFormCostPrice(""); setFormSellingPrice(""); setFormStock(""); setFormDescription("")
        fetchItems()
      }
    } catch { /* silent */ }
    finally { setCreating(false) }
  }

  const categories = useMemo(() => {
    if (apiCategories.length > 0) return apiCategories.map(c => c.name)
    return [...new Set(items.map(i => i.category))]
  }, [items, apiCategories])

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (tab !== "all" && i.behaviour !== tab) return false
      if (catFilter && i.category !== catFilter) return false
      if (typeFilter && i.stockType !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
      }
      return true
    })
  }, [items, tab, search, catFilter, typeFilter])

  const countByBehaviour = (b: Behaviour) => items.filter(i => i.behaviour === b).length
  const physicalCount = items.filter(i => i.stockType === "physical").length
  const capacityCount = items.filter(i => i.stockType === "capacity").length
  const serviceCount = items.filter(i => i.stockType === "service").length

  const tabItems: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: items.length },
    { key: "product", label: "Product", count: countByBehaviour("product") },
    { key: "consultation", label: "Consultation", count: countByBehaviour("consultation") },
    { key: "procedure", label: "Procedure", count: countByBehaviour("procedure") },
    { key: "admission", label: "Admission", count: countByBehaviour("admission") },
    { key: "recurring", label: "Recurring", count: countByBehaviour("recurring") },
  ]

  const columns: Column<CatalogueItem>[] = [
    {
      key: "name", label: "Item", width: "22%",
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: T.tx, fontSize: 13 }}>{r.name}</div>
          <div style={{ fontSize: 11, color: T.txD, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{r.sku}</div>
        </div>
      ),
    },
    { key: "category", label: "Category", render: (r) => <span style={{ color: T.txM, fontSize: 12 }}>{r.category}</span> },
    { key: "behaviour", label: "Behaviour", render: (r) => <Pill tone={BEHAVIOUR_TONE[r.behaviour]}>{r.behaviour}</Pill> },
    { key: "stockType", label: "Stock Type", render: (r) => <span style={{ fontSize: 12, color: T.txM, textTransform: "capitalize" }}>{r.stockType}</span> },
    { key: "cost", label: "Cost", align: "right", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.txM }}>{money(r.costPrice)}</span> },
    { key: "selling", label: "Selling", align: "right", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.tx }}>{money(r.sellingPrice)}</span> },
    {
      key: "stock", label: "Stock", align: "right",
      render: (r) => {
        if (r.stock === null) return <span style={{ fontSize: 11, color: T.txD }}>N/A</span>
        const color = r.stock === 0 ? T.red : (r.minStock !== null && r.stock < r.minStock) ? T.amber : T.emerald
        return <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color, fontWeight: 700 }}>{r.stock}</span>
      },
    },
    { key: "status", label: "Status", render: (r) => <Pill tone={r.status === "active" ? "emerald" : "neutral"} dot>{r.status}</Pill> },
  ]

  const catalogueTitle = tenant.type === "health" ? "Drug & Service Catalogue" : tenant.type === "institute" ? "Fee & Resource Catalogue" : "Service Catalogue"

  return (
    <Page title={catalogueTitle} accent={accent} action={<Button icon="plus" onClick={() => setShowAdd(true)}>Add Item</Button>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Total Items" value={items.length} icon="inventory" accent={accent} />
        <Stat label="Physical" value={physicalCount} icon="stock" accent="emerald" />
        <Stat label="Capacity" value={capacityCount} icon="branches" accent="amber" />
        <Stat label="Service" value={serviceCount} icon="customers" accent="sky" />
      </div>

      <Tabs tabs={tabItems} value={tab} onChange={setTab} accent={accent} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 200px", gap: 12, marginBottom: 20 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search items or SKU..." />
        <Select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Stock Types</option>
          <option value="physical">Physical</option>
          <option value="capacity">Capacity</option>
          <option value="service">Service</option>
        </Select>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 12, fontSize: 12, color: T.txM }}>Loading catalogue...</div>}
      <DataTable rows={filtered} columns={columns} onRowClick={setSelected} empty="No items match your filters." />

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected?.sku}
        width={560}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            <Button variant="outline" icon="edit">Edit</Button>
          </>
        }
      >
        {selected && (
          <div>
            <p style={{ fontSize: 13, color: T.txM, marginBottom: 24, lineHeight: 1.6 }}>{selected.description}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
              {[
                { label: "Behaviour", value: selected.behaviour },
                { label: "Stock Type", value: selected.stockType },
                { label: "Cost Price", value: money(selected.costPrice) },
                { label: "Selling Price", value: money(selected.sellingPrice) },
              ].map(b => (
                <Card key={b.label} padding={14} accent={accent}>
                  <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>{b.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", textTransform: "capitalize" }}>{b.value}</div>
                </Card>
              ))}
            </div>
            {selected.stock !== null && (
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Stock Levels</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <Card padding={14} accent={accent}>
                    <div style={{ fontSize: 9, color: T.txD, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Current</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: selected.stock === 0 ? T.red : T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{selected.stock}</div>
                  </Card>
                  <Card padding={14} accent={accent}>
                    <div style={{ fontSize: 9, color: T.txD, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Minimum</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{selected.minStock ?? "N/A"}</div>
                  </Card>
                  <Card padding={14} accent={accent}>
                    <div style={{ fontSize: 9, color: T.txD, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Category</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{selected.category}</div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Service Item" width={600}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Item Name"><Input placeholder="e.g. Paracetamol 500mg" value={formName} onChange={e => setFormName(e.target.value)} /></Field>
          <Field label="SKU"><Input placeholder="e.g. MED-001" style={{ fontFamily: "'DM Mono', monospace" }} value={formSku} onChange={e => setFormSku(e.target.value)} /></Field>
          <Field label="Category">
            <Select value={formCategoryId} onChange={e => setFormCategoryId(e.target.value)}>
              <option value="">Select category</option>
              {apiCategories.length > 0
                ? apiCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                : categories.map(c => <option key={c} value={c}>{c}</option>)
              }
            </Select>
          </Field>
          <Field label="Behaviour">
            <Select value={formBehaviour} onChange={e => setFormBehaviour(e.target.value)}>
              <option value="">Select behaviour</option>
              <option value="consultation">Consultation</option>
              <option value="procedure">Procedure</option>
              <option value="product">Product</option>
              <option value="admission">Admission</option>
              <option value="recurring">Recurring</option>
            </Select>
          </Field>
          <Field label="Stock Type">
            <Select value={formStockType} onChange={e => setFormStockType(e.target.value)}>
              <option value="">Select type</option>
              <option value="physical">Physical</option>
              <option value="capacity">Capacity</option>
              <option value="service">Service</option>
            </Select>
          </Field>
          <Field label="Cost Price"><Input type="number" placeholder="0.00" value={formCostPrice} onChange={e => setFormCostPrice(e.target.value)} /></Field>
          <Field label="Selling Price"><Input type="number" placeholder="0.00" value={formSellingPrice} onChange={e => setFormSellingPrice(e.target.value)} /></Field>
          <Field label="Current Stock"><Input type="number" placeholder="0" value={formStock} onChange={e => setFormStock(e.target.value)} /></Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Description"><TextArea placeholder="Brief item description..." value={formDescription} onChange={e => setFormDescription(e.target.value)} /></Field>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={creating}>{creating ? "Creating..." : "Create Item"}</Button>
        </div>
      </Modal>
    </Page>
  )
}
