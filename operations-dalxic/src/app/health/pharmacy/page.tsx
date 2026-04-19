"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { HealthShell } from "@/components/ops/HealthShell"
import { useAuth } from "@/lib/use-auth"
import { Page, Card, Stat, Pill, Button, Drawer, SearchBar, Tabs, Section, DataTable, T, Modal, Field, Input, TextArea, Select, Empty } from "@/components/ops/primitives"

/* ═══════════════ TYPES ═══════════════ */

type View = "prescriptions" | "catalogue" | "stock" | "purchase_orders" | "suppliers" | "low_stock"

interface CatalogueItem {
  id: string; name: string; sku?: string; behaviour: string; stockType: string
  sellingPrice: number; costPrice: number; stock: number; minStock: number; maxStock?: number
  unit: string; batchNo?: string; expiresAt?: string; storageConditions?: string
  taxable: boolean; barcode?: string; description?: string; categoryId: string
  category?: { id: string; name: string } | null
}

interface Category { id: string; name: string }

interface ClinicalRecord {
  id: string; contactId: string; cartId: string | null; type: string
  data: { prescriptions?: { drug: string; dosage: string; duration: string; quantity?: number }[]; patientName?: string; doctorName?: string; outOfStock?: boolean; clinicalRecordId?: string; [k: string]: unknown }
  status: string; performedBy: string; performedByName: string; performedAt: string
}

interface PrescriptionRow {
  id: string; clinicalRecordId: string; patientName: string; doctorName: string
  drug: string; dosage: string; duration: string; quantity: number
  status: "pending" | "dispensed" | "out_of_stock"; contactId: string
  serviceItemId: string | null; dispensedAt?: string
}

interface Supplier {
  id: string; name: string; contactName?: string; phone?: string; email?: string
  address?: string; taxId?: string; paymentTerms?: string
}

interface PurchaseOrder {
  id: string; poNumber: string; status: string; subtotal: number; tax: number; total: number
  expectedDate?: string; receivedDate?: string; notes?: string; createdAt: string
  supplier?: Supplier; items?: POItem[]
}

interface POItem {
  id: string; serviceItemId: string; quantity: number; unitCost: number; total: number; receivedQty: number
}

/* ═══════════════ EMPTY FORMS ═══════════════ */

const emptyDrug = { name: "", sku: "", categoryId: "", unit: "tablet", sellingPrice: "", costPrice: "", minStock: "10", maxStock: "", description: "", taxable: true, barcode: "", batchNo: "", expiresAt: "", storageConditions: "" }
const emptyReceive = { serviceItemId: "", quantity: "", batchNo: "", expiresAt: "", reference: "" }
const emptyAdjust = { serviceItemId: "", newBalance: "", notes: "" }
const emptySupplier = { name: "", contactName: "", phone: "", email: "", address: "", taxId: "", paymentTerms: "" }
const emptyPO = { supplierId: "", notes: "", expectedDate: "", items: [] as { serviceItemId: string; quantity: string; unitCost: string }[] }

export default function PharmacyPage() {
  const { session, authFetch } = useAuth()
  const [view, setView] = useState<View>("prescriptions")
  const [query, setQuery] = useState("")

  /* ── Data state ── */
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([])
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [branchId, setBranchId] = useState<string | null>(null)

  /* ── UI state ── */
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activePrescription, setActivePrescription] = useState<PrescriptionRow | null>(null)
  const [activeDrugDetail, setActiveDrugDetail] = useState<CatalogueItem | null>(null)
  const [activePO, setActivePO] = useState<PurchaseOrder | null>(null)

  /* ── Modal state ── */
  const [drugModalOpen, setDrugModalOpen] = useState(false)
  const [editDrug, setEditDrug] = useState<CatalogueItem | null>(null)
  const [drugForm, setDrugForm] = useState({ ...emptyDrug })
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [receiveForm, setReceiveForm] = useState({ ...emptyReceive })
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [adjustForm, setAdjustForm] = useState({ ...emptyAdjust })
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [supplierForm, setSupplierForm] = useState({ ...emptySupplier })
  const [poModalOpen, setPOModalOpen] = useState(false)
  const [poForm, setPOForm] = useState({ ...emptyPO })

  /* ═══════════════ DATA FETCHING ═══════════════ */

  const fetchAll = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const [clinicalRes, catRes, branchRes, dispensingRes, catgRes, suppRes, poRes] = await Promise.all([
        authFetch("/api/health/clinical?type=consultation"),
        authFetch("/api/catalogue?behaviour=product"),
        authFetch("/api/branches"),
        authFetch("/api/health/clinical?type=dispensing"),
        authFetch("/api/categories"),
        authFetch("/api/trade/suppliers"),
        authFetch("/api/trade/purchase-orders"),
      ])
      const [clinicalJson, catJson, branchJson, dispensingJson, catgJson, suppJson, poJson] = await Promise.all([
        clinicalRes.json(), catRes.json(), branchRes.json(), dispensingRes.json(), catgRes.json(), suppRes.json(), poRes.json(),
      ])

      if (branchJson.success && branchJson.data.length) setBranchId(branchJson.data[0].id)
      if (catJson.success) setCatalogue(catJson.data)
      if (catgJson.success) setCategories(catgJson.data)
      if (suppJson.success) setSuppliers(suppJson.data)
      if (poJson.success) setPurchaseOrders(poJson.data)

      const drugs: CatalogueItem[] = catJson.success ? catJson.data : []
      const dispensingRecords: ClinicalRecord[] = dispensingJson.success ? dispensingJson.data : []
      const dispensedSet = new Set(dispensingRecords.filter(r => r.status === "completed").map(r => r.data?.clinicalRecordId as string))
      const oosSet = new Set(dispensingRecords.filter(r => r.data?.outOfStock).map(r => r.data?.clinicalRecordId as string))

      const rows: PrescriptionRow[] = []
      const clinicalRecords: ClinicalRecord[] = clinicalJson.success ? clinicalJson.data : []

      for (const rec of clinicalRecords) {
        if (!rec.data?.prescriptions || !Array.isArray(rec.data.prescriptions)) continue
        for (let i = 0; i < rec.data.prescriptions.length; i++) {
          const rx = rec.data.prescriptions[i]
          const matchDrug = drugs.find(d => d.name.toLowerCase().includes(rx.drug.toLowerCase()) || rx.drug.toLowerCase().includes(d.name.toLowerCase()))
          let status: "pending" | "dispensed" | "out_of_stock" = "pending"
          if (dispensedSet.has(rec.id)) status = "dispensed"
          else if (oosSet.has(rec.id)) status = "out_of_stock"
          rows.push({
            id: `${rec.id}-rx-${i}`, clinicalRecordId: rec.id,
            patientName: (rec.data.patientName as string) || "Unknown Patient",
            doctorName: (rec.data.doctorName as string) || rec.performedByName,
            drug: rx.drug, dosage: rx.dosage, duration: rx.duration, quantity: rx.quantity ?? 1,
            status, contactId: rec.contactId, serviceItemId: matchDrug?.id ?? null,
            dispensedAt: status === "dispensed" ? rec.performedAt : undefined,
          })
        }
      }
      setPrescriptions(rows)
      setError(null)
    } catch {
      setError("Network Error — Could Not Load Pharmacy Data")
    } finally {
      setLoading(false)
    }
  }, [session, authFetch])

  useEffect(() => { if (session) fetchAll() }, [session, fetchAll])

  /* ═══════════════ COMPUTED ═══════════════ */

  const pending = prescriptions.filter(p => p.status === "pending").length
  const dispensedCount = prescriptions.filter(p => p.status === "dispensed").length
  const lowStockItems = useMemo(() => catalogue.filter(d => d.stock <= d.minStock), [catalogue])

  const filteredCatalogue = useMemo(() => {
    if (!query) return catalogue
    const q = query.toLowerCase()
    return catalogue.filter(d => d.name.toLowerCase().includes(q) || (d.sku || "").toLowerCase().includes(q))
  }, [catalogue, query])

  const filteredPrescriptions = useMemo(() => {
    if (!query) return prescriptions
    const q = query.toLowerCase()
    return prescriptions.filter(p => p.patientName.toLowerCase().includes(q) || p.drug.toLowerCase().includes(q))
  }, [prescriptions, query])

  const filteredSuppliers = useMemo(() => {
    if (!query) return suppliers
    const q = query.toLowerCase()
    return suppliers.filter(s => s.name.toLowerCase().includes(q))
  }, [suppliers, query])

  /* ═══════════════ DISPENSE FLOW ═══════════════ */

  async function dispense(rx: PrescriptionRow) {
    if (!session || !branchId || !rx.serviceItemId) return
    setSubmitting(true); setError(null)
    try {
      const cartRes = await authFetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ branchId, contactId: rx.contactId }) })
      const cartJson = await cartRes.json()
      if (!cartJson.success) { setError(cartJson.error || "Failed To Create Cart"); return }
      const cartId = cartJson.data.id

      const itemRes = await authFetch(`/api/cart/${cartId}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceItemId: rx.serviceItemId, quantity: rx.quantity }) })
      if (!(await itemRes.json()).success) { setError("Failed To Add Item"); return }

      const tenderRes = await authFetch(`/api/cart/${cartId}/tender`, { method: "POST", headers: { "Content-Type": "application/json" } })
      const tenderJson = await tenderRes.json()
      if (!tenderJson.success) { setError("Failed To Tender"); return }

      const payRes = await authFetch(`/api/cart/${cartId}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method: "cash", amount: tenderJson.data.grandTotal }) })
      if (!(await payRes.json()).success) { setError("Payment Failed"); return }

      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId: rx.contactId, cartId, type: "dispensing", data: { drug: rx.drug, dosage: rx.dosage, duration: rx.duration, quantity: rx.quantity, clinicalRecordId: rx.clinicalRecordId }, status: "completed" }) })

      setActivePrescription(null)
      await fetchAll()
    } catch { setError("Network Error — Dispensing Failed") } finally { setSubmitting(false) }
  }

  async function markOutOfStock(rx: PrescriptionRow) {
    if (!session) return
    setSubmitting(true)
    try {
      await authFetch("/api/health/clinical", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId: rx.contactId, type: "dispensing", data: { drug: rx.drug, clinicalRecordId: rx.clinicalRecordId, outOfStock: true }, status: "out_of_stock" }) })
      setPrescriptions(prev => prev.map(p => p.id === rx.id ? { ...p, status: "out_of_stock" as const } : p))
      setActivePrescription(null)
    } catch { setError("Could Not Update Status") } finally { setSubmitting(false) }
  }

  /* ═══════════════ DRUG CATALOGUE CRUD ═══════════════ */

  function openAddDrug() {
    setEditDrug(null)
    setDrugForm({ ...emptyDrug, categoryId: categories[0]?.id || "" })
    setDrugModalOpen(true)
  }

  function openEditDrug(d: CatalogueItem) {
    setEditDrug(d)
    setDrugForm({
      name: d.name, sku: d.sku || "", categoryId: d.categoryId, unit: d.unit,
      sellingPrice: String(d.sellingPrice / 100), costPrice: String(d.costPrice / 100),
      minStock: String(d.minStock), maxStock: d.maxStock ? String(d.maxStock) : "",
      description: d.description || "", taxable: d.taxable, barcode: d.barcode || "",
      batchNo: d.batchNo || "", expiresAt: d.expiresAt ? d.expiresAt.split("T")[0] : "",
      storageConditions: d.storageConditions || "",
    })
    setDrugModalOpen(true)
  }

  async function saveDrug() {
    if (!drugForm.name.trim() || !drugForm.categoryId) return
    setSubmitting(true); setError(null)
    try {
      const payload = {
        name: drugForm.name, sku: drugForm.sku || undefined, categoryId: drugForm.categoryId,
        unit: drugForm.unit, behaviour: "product", stockType: "physical",
        sellingPrice: Math.round(parseFloat(drugForm.sellingPrice || "0") * 100),
        costPrice: Math.round(parseFloat(drugForm.costPrice || "0") * 100),
        minStock: parseInt(drugForm.minStock) || 0, maxStock: drugForm.maxStock ? parseInt(drugForm.maxStock) : undefined,
        description: drugForm.description || undefined, taxable: drugForm.taxable,
        barcode: drugForm.barcode || undefined, batchNo: drugForm.batchNo || undefined,
        expiresAt: drugForm.expiresAt || undefined, storageConditions: drugForm.storageConditions || undefined,
      }
      if (editDrug) {
        await authFetch("/api/catalogue", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editDrug.id, ...payload }) })
      } else {
        await authFetch("/api/catalogue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      }
      setDrugModalOpen(false)
      setDrugForm({ ...emptyDrug })
      await fetchAll()
    } catch { setError("Failed To Save Drug") } finally { setSubmitting(false) }
  }

  /* ═══════════════ RECEIVE STOCK ═══════════════ */

  function openReceiveStock(itemId?: string) {
    setReceiveForm({ ...emptyReceive, serviceItemId: itemId || "" })
    setReceiveModalOpen(true)
  }

  async function receiveStock() {
    if (!receiveForm.serviceItemId || !receiveForm.quantity || !branchId) return
    setSubmitting(true); setError(null)
    try {
      const res = await authFetch("/api/stock/receive", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceItemId: receiveForm.serviceItemId, branchId,
          quantity: parseInt(receiveForm.quantity),
          batchNo: receiveForm.batchNo || undefined,
          expiresAt: receiveForm.expiresAt || undefined,
          reference: receiveForm.reference || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error || "Stock Receive Failed"); return }
      setReceiveModalOpen(false)
      setReceiveForm({ ...emptyReceive })
      setActiveDrugDetail(null)
      await fetchAll()
    } catch { setError("Network Error — Stock Receive Failed") } finally { setSubmitting(false) }
  }

  /* ═══════════════ ADJUST STOCK ═══════════════ */

  function openAdjustStock(item?: CatalogueItem) {
    setAdjustForm({ ...emptyAdjust, serviceItemId: item?.id || "", newBalance: item ? String(item.stock) : "" })
    setAdjustModalOpen(true)
  }

  async function adjustStock() {
    if (!adjustForm.serviceItemId || adjustForm.newBalance === "" || !branchId) return
    setSubmitting(true); setError(null)
    try {
      const res = await authFetch("/api/stock/adjust", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceItemId: adjustForm.serviceItemId, branchId,
          newBalance: parseInt(adjustForm.newBalance),
          notes: adjustForm.notes || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error || "Stock Adjustment Failed"); return }
      setAdjustModalOpen(false)
      setAdjustForm({ ...emptyAdjust })
      setActiveDrugDetail(null)
      await fetchAll()
    } catch { setError("Network Error — Stock Adjustment Failed") } finally { setSubmitting(false) }
  }

  /* ═══════════════ SUPPLIER MANAGEMENT ═══════════════ */

  async function saveSupplier() {
    if (!supplierForm.name.trim()) return
    setSubmitting(true); setError(null)
    try {
      await authFetch("/api/trade/suppliers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: supplierForm.name, contactName: supplierForm.contactName || undefined,
          phone: supplierForm.phone || undefined, email: supplierForm.email || undefined,
          address: supplierForm.address || undefined, taxId: supplierForm.taxId || undefined,
          paymentTerms: supplierForm.paymentTerms || undefined,
        }),
      })
      setSupplierModalOpen(false)
      setSupplierForm({ ...emptySupplier })
      await fetchAll()
    } catch { setError("Failed To Save Supplier") } finally { setSubmitting(false) }
  }

  /* ═══════════════ PURCHASE ORDERS ═══════════════ */

  function addPOLine() {
    setPOForm(prev => ({ ...prev, items: [...prev.items, { serviceItemId: "", quantity: "1", unitCost: "" }] }))
  }

  function updatePOLine(idx: number, field: string, value: string) {
    setPOForm(prev => ({ ...prev, items: prev.items.map((it, i) => i === idx ? { ...it, [field]: value } : it) }))
  }

  function removePOLine(idx: number) {
    setPOForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))
  }

  async function createPO() {
    if (!poForm.supplierId || poForm.items.length === 0) return
    setSubmitting(true); setError(null)
    try {
      const items = poForm.items.map(it => ({
        serviceItemId: it.serviceItemId,
        quantity: parseInt(it.quantity) || 1,
        unitCost: Math.round(parseFloat(it.unitCost || "0") * 100),
        total: (parseInt(it.quantity) || 1) * Math.round(parseFloat(it.unitCost || "0") * 100),
      }))
      const subtotal = items.reduce((s, i) => s + i.total, 0)
      const tax = Math.round(subtotal * 0.15)
      await authFetch("/api/trade/purchase-orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: poForm.supplierId, subtotal, tax, total: subtotal + tax,
          expectedDate: poForm.expectedDate || undefined, notes: poForm.notes || undefined,
          items,
        }),
      })
      setPOModalOpen(false)
      setPOForm({ ...emptyPO })
      await fetchAll()
    } catch { setError("Failed To Create Purchase Order") } finally { setSubmitting(false) }
  }

  /* ═══════════════ HELPERS ═══════════════ */

  const activeDrug = activePrescription ? catalogue.find(d => d.id === activePrescription.serviceItemId) : null
  const currentStock = activeDrug?.stock ?? 0
  const canDispense = activePrescription ? activePrescription.status === "pending" && currentStock >= activePrescription.quantity && !!activePrescription.serviceItemId : false

  const substitutes = useMemo(() => {
    if (!activePrescription || activePrescription.serviceItemId) return []
    const drugName = activePrescription.drug.toLowerCase()
    return catalogue.filter(d => d.stock > 0 && (d.name.toLowerCase().includes(drugName.split(" ")[0]) || d.category?.name?.toLowerCase().includes(drugName.split(" ")[0])))
  }, [activePrescription, catalogue])

  /* ═══════════════ RENDER ═══════════════ */

  return (
    <HealthShell>
      <Page accent="copper" title="Pharmacy" subtitle="Prescriptions, Drug Catalogue, Stock Management, Purchase Orders And Suppliers.">
        {error && (
          <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#f87171", fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Pending Rx" value={pending} accent="copper" icon="orders" />
          <Stat label="Dispensed Today" value={dispensedCount} accent="emerald" icon="check" />
          <Stat label="Low Stock Alerts" value={lowStockItems.length} accent={lowStockItems.length > 0 ? "amber" : "neutral"} icon="bolt" />
          <Stat label="Drug Catalogue" value={catalogue.length} accent="copper" icon="billing" />
        </div>

        <Section
          title="Pharmacy Operations"
          action={
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 260 }}><SearchBar value={query} onChange={setQuery} placeholder="Search Drugs, Patients…" /></div>
              {view === "catalogue" && <Button icon="plus" onClick={openAddDrug}>Add Drug</Button>}
              {view === "stock" && (
                <>
                  <Button icon="plus" onClick={() => openReceiveStock()}>Receive Stock</Button>
                  <Button variant="outline" onClick={() => openAdjustStock()}>Adjust Stock</Button>
                </>
              )}
              {view === "suppliers" && <Button icon="plus" onClick={() => { setSupplierForm({ ...emptySupplier }); setSupplierModalOpen(true) }}>Add Supplier</Button>}
              {view === "purchase_orders" && <Button icon="plus" onClick={() => { setPOForm({ ...emptyPO }); setPOModalOpen(true) }}>New Purchase Order</Button>}
            </div>
          }
        >
          <Tabs<View>
            value={view} onChange={setView} accent="copper"
            tabs={[
              { key: "prescriptions", label: "Prescriptions", count: pending },
              { key: "catalogue", label: "Drug Catalogue", count: catalogue.length },
              { key: "stock", label: "Stock Levels" },
              { key: "purchase_orders", label: "Purchase Orders", count: purchaseOrders.length },
              { key: "suppliers", label: "Suppliers", count: suppliers.length },
              { key: "low_stock", label: "Low Stock", count: lowStockItems.length },
            ]}
          />

          <div style={{ marginTop: 18 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: 48, color: T.txD, fontSize: 13, fontWeight: 600 }}>Loading Pharmacy…</div>
            ) : view === "prescriptions" ? (
              /* ─── PRESCRIPTIONS TAB ─── */
              filteredPrescriptions.length === 0 ? (
                <Empty icon="search" title="No Prescriptions" sub="Prescriptions from doctors will appear here." />
              ) : (
                <DataTable
                  columns={[
                    { key: "patientName", label: "Patient", render: (p: PrescriptionRow) => p.patientName },
                    { key: "drug", label: "Drug", render: (p: PrescriptionRow) => <span style={{ fontWeight: 700 }}>{p.drug}</span> },
                    { key: "dosage", label: "Dosage", width: 100, render: (p: PrescriptionRow) => p.dosage },
                    { key: "duration", label: "Duration", width: 90, render: (p: PrescriptionRow) => p.duration },
                    { key: "quantity", label: "Qty", width: 60, render: (p: PrescriptionRow) => <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{p.quantity}</span> },
                    { key: "stockMatch", label: "In Stock", width: 90, render: (p: PrescriptionRow) => {
                      const match = catalogue.find(d => d.id === p.serviceItemId)
                      return match ? <Pill tone={match.stock >= p.quantity ? "emerald" : "red"}>{match.stock}</Pill> : <Pill tone="red">No Match</Pill>
                    }},
                    { key: "status", label: "Status", width: 120, render: (p: PrescriptionRow) => (
                      <Pill tone={p.status === "pending" ? "amber" : p.status === "dispensed" ? "emerald" : "red"}>
                        {p.status === "out_of_stock" ? "Out Of Stock" : p.status === "dispensed" ? "Dispensed" : "Pending"}
                      </Pill>
                    )},
                    { key: "doctorName", label: "Doctor", render: (p: PrescriptionRow) => p.doctorName },
                  ]}
                  rows={filteredPrescriptions}
                  onRowClick={(p) => setActivePrescription(p as PrescriptionRow)}
                />
              )
            ) : view === "catalogue" ? (
              /* ─── DRUG CATALOGUE TAB ─── */
              filteredCatalogue.length === 0 ? (
                <Empty icon="search" title="No Drugs In Catalogue" sub="Add drugs to the catalogue to start dispensing." action={<Button icon="plus" onClick={openAddDrug}>Add Drug</Button>} />
              ) : (
                <DataTable
                  columns={[
                    { key: "name", label: "Drug Name", render: (d: CatalogueItem) => <span style={{ fontWeight: 700 }}>{d.name}</span> },
                    { key: "sku", label: "SKU", width: 100, render: (d: CatalogueItem) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{d.sku || "—"}</span> },
                    { key: "category", label: "Category", width: 120, render: (d: CatalogueItem) => d.category?.name ?? "—" },
                    { key: "costPrice", label: "Cost", width: 90, render: (d: CatalogueItem) => `GHS ${(d.costPrice / 100).toFixed(2)}` },
                    { key: "sellingPrice", label: "Price", width: 90, render: (d: CatalogueItem) => `GHS ${(d.sellingPrice / 100).toFixed(2)}` },
                    { key: "margin", label: "Margin", width: 80, render: (d: CatalogueItem) => d.costPrice > 0 ? `${((d.sellingPrice - d.costPrice) / d.sellingPrice * 100).toFixed(0)}%` : "—" },
                    { key: "stock", label: "Stock", width: 80, render: (d: CatalogueItem) => <span style={{ color: d.stock <= d.minStock ? T.red : T.tx, fontWeight: 700 }}>{d.stock}</span> },
                    { key: "unit", label: "Unit", width: 70, render: (d: CatalogueItem) => d.unit },
                    { key: "expiry", label: "Expiry", width: 90, render: (d: CatalogueItem) => {
                      if (!d.expiresAt) return "—"
                      const exp = new Date(d.expiresAt)
                      const daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86400000)
                      return <span style={{ color: daysLeft < 30 ? T.red : daysLeft < 90 ? T.amber : T.txM, fontSize: 11 }}>{exp.toLocaleDateString()}</span>
                    }},
                  ]}
                  rows={filteredCatalogue}
                  onRowClick={(d) => openEditDrug(d as CatalogueItem)}
                />
              )
            ) : view === "stock" ? (
              /* ─── STOCK LEVELS TAB ─── */
              catalogue.length === 0 ? (
                <Empty icon="search" title="No Stock Items" sub="Add drugs to the catalogue first." />
              ) : (
                <DataTable
                  columns={[
                    { key: "name", label: "Drug", render: (d: CatalogueItem) => <span style={{ fontWeight: 700 }}>{d.name}</span> },
                    { key: "stock", label: "On Hand", width: 90, render: (d: CatalogueItem) => <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, fontSize: 15, color: d.stock <= d.minStock ? T.red : T.tx }}>{d.stock}</span> },
                    { key: "minStock", label: "Min", width: 70, render: (d: CatalogueItem) => d.minStock },
                    { key: "maxStock", label: "Max", width: 70, render: (d: CatalogueItem) => d.maxStock ?? "—" },
                    { key: "unit", label: "Unit", width: 70, render: (d: CatalogueItem) => d.unit },
                    { key: "batchNo", label: "Batch", width: 100, render: (d: CatalogueItem) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{d.batchNo || "—"}</span> },
                    { key: "expiresAt", label: "Expiry", width: 100, render: (d: CatalogueItem) => {
                      if (!d.expiresAt) return "—"
                      const exp = new Date(d.expiresAt)
                      const daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86400000)
                      return <Pill tone={daysLeft < 30 ? "red" : daysLeft < 90 ? "amber" : "emerald"}>{daysLeft}d Left</Pill>
                    }},
                    { key: "status", label: "Status", width: 120, render: (d: CatalogueItem) => (
                      <Pill tone={d.stock <= d.minStock ? "red" : d.stock <= d.minStock * 2 ? "amber" : "emerald"}>
                        {d.stock <= d.minStock ? "Reorder Now" : d.stock <= d.minStock * 2 ? "Reorder Soon" : "Healthy"}
                      </Pill>
                    )},
                  ]}
                  rows={catalogue.sort((a, b) => a.stock - b.stock)}
                  onRowClick={(d) => setActiveDrugDetail(d as CatalogueItem)}
                />
              )
            ) : view === "purchase_orders" ? (
              /* ─── PURCHASE ORDERS TAB ─── */
              purchaseOrders.length === 0 ? (
                <Empty icon="search" title="No Purchase Orders" sub="Create a purchase order to restock your pharmacy." action={<Button icon="plus" onClick={() => { setPOForm({ ...emptyPO }); setPOModalOpen(true) }}>New Purchase Order</Button>} />
              ) : (
                <DataTable
                  columns={[
                    { key: "poNumber", label: "PO Number", width: 120, render: (po: PurchaseOrder) => <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: T.copper }}>{po.poNumber}</span> },
                    { key: "supplier", label: "Supplier", render: (po: PurchaseOrder) => po.supplier?.name || "—" },
                    { key: "items", label: "Items", width: 70, render: (po: PurchaseOrder) => po.items?.length ?? 0 },
                    { key: "total", label: "Total", width: 110, render: (po: PurchaseOrder) => <span style={{ fontWeight: 700 }}>GHS {(po.total / 100).toFixed(2)}</span> },
                    { key: "status", label: "Status", width: 110, render: (po: PurchaseOrder) => (
                      <Pill tone={po.status === "draft" ? "neutral" : po.status === "issued" ? "amber" : po.status === "received" ? "emerald" : "copper"}>
                        {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                      </Pill>
                    )},
                    { key: "expectedDate", label: "Expected", width: 100, render: (po: PurchaseOrder) => po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : "—" },
                    { key: "createdAt", label: "Created", width: 100, render: (po: PurchaseOrder) => new Date(po.createdAt).toLocaleDateString() },
                  ]}
                  rows={purchaseOrders}
                  onRowClick={(po) => setActivePO(po as PurchaseOrder)}
                />
              )
            ) : view === "suppliers" ? (
              /* ─── SUPPLIERS TAB ─── */
              filteredSuppliers.length === 0 ? (
                <Empty icon="search" title="No Suppliers" sub="Add drug suppliers to manage procurement." action={<Button icon="plus" onClick={() => { setSupplierForm({ ...emptySupplier }); setSupplierModalOpen(true) }}>Add Supplier</Button>} />
              ) : (
                <DataTable
                  columns={[
                    { key: "name", label: "Supplier Name", render: (s: Supplier) => <span style={{ fontWeight: 700 }}>{s.name}</span> },
                    { key: "contactName", label: "Contact Person", render: (s: Supplier) => s.contactName || "—" },
                    { key: "phone", label: "Phone", width: 130, render: (s: Supplier) => s.phone || "—" },
                    { key: "email", label: "Email", render: (s: Supplier) => s.email || "—" },
                    { key: "paymentTerms", label: "Terms", width: 100, render: (s: Supplier) => s.paymentTerms || "—" },
                    { key: "taxId", label: "Tax ID", width: 110, render: (s: Supplier) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{s.taxId || "—"}</span> },
                  ]}
                  rows={filteredSuppliers}
                  onRowClick={() => {}}
                />
              )
            ) : (
              /* ─── LOW STOCK TAB ─── */
              lowStockItems.length === 0 ? (
                <Empty icon="check" title="All Stock Levels Healthy" sub="No drugs are below their minimum stock level." />
              ) : (
                <DataTable
                  columns={[
                    { key: "name", label: "Drug", render: (d: CatalogueItem) => <span style={{ fontWeight: 700, color: T.red }}>{d.name}</span> },
                    { key: "stock", label: "On Hand", width: 90, render: (d: CatalogueItem) => <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, fontSize: 15, color: T.red }}>{d.stock}</span> },
                    { key: "minStock", label: "Minimum", width: 90, render: (d: CatalogueItem) => d.minStock },
                    { key: "deficit", label: "Deficit", width: 90, render: (d: CatalogueItem) => <span style={{ color: T.red, fontWeight: 700 }}>{d.minStock - d.stock > 0 ? `-${d.minStock - d.stock}` : "0"}</span> },
                    { key: "unit", label: "Unit", width: 70, render: (d: CatalogueItem) => d.unit },
                    { key: "costPrice", label: "Reorder Cost", width: 120, render: (d: CatalogueItem) => {
                      const deficit = Math.max(0, d.minStock - d.stock)
                      return `GHS ${(deficit * d.costPrice / 100).toFixed(2)}`
                    }},
                    { key: "actions", label: "", width: 140, render: (d: CatalogueItem) => (
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button size="sm" onClick={() => openReceiveStock(d.id)}>Receive</Button>
                      </div>
                    )},
                  ]}
                  rows={lowStockItems}
                  onRowClick={(d) => setActiveDrugDetail(d as CatalogueItem)}
                />
              )
            )}
          </div>
        </Section>
      </Page>

      {/* ═══════════════ PRESCRIPTION DRAWER ═══════════════ */}
      <Drawer open={!!activePrescription} onClose={() => setActivePrescription(null)} title={activePrescription?.drug ?? "Prescription"} subtitle={activePrescription?.patientName} width={500}>
        {activePrescription && (
          <>
            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Prescription Details</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Patient:</b> {activePrescription.patientName}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Drug:</b> {activePrescription.drug}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Dosage:</b> {activePrescription.dosage}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Duration:</b> {activePrescription.duration}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Quantity:</b> {activePrescription.quantity}</div>
              <div style={{ fontSize: 13, color: T.tx }}><b>Doctor:</b> {activePrescription.doctorName}</div>
            </Card>

            {activePrescription.status === "dispensed" ? (
              <Card padding={18}>
                <Pill tone="emerald">Dispensed</Pill>
                <div style={{ fontSize: 12, color: T.txM, marginTop: 8 }}>Dispensed At {activePrescription.dispensedAt ? new Date(activePrescription.dispensedAt).toLocaleString() : "—"}</div>
              </Card>
            ) : activePrescription.status === "out_of_stock" ? (
              <Card padding={18}>
                <Pill tone="red">Out Of Stock</Pill>
                {substitutes.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Possible Substitutes</div>
                    {substitutes.map(s => (
                      <div key={s.id} style={{ fontSize: 12, color: T.tx, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                        {s.name} — {s.stock} {s.unit} — GHS {(s.sellingPrice / 100).toFixed(2)}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ) : (
              <Card padding={18}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Dispensing</div>
                {!activePrescription.serviceItemId ? (
                  <div style={{ fontSize: 12, color: T.red, marginBottom: 12, fontWeight: 600 }}>
                    Drug Not Found In Catalogue — Cannot Dispense Electronically
                    {substitutes.length > 0 && (
                      <div style={{ marginTop: 10, color: T.txM }}>
                        <b>Possible Substitutes:</b>
                        {substitutes.map(s => <div key={s.id} style={{ marginTop: 4 }}>{s.name} ({s.stock} {s.unit})</div>)}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      <div style={{ background: T.surface, borderRadius: 8, padding: 14, textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: currentStock < activePrescription.quantity ? T.red : T.tx }}>{currentStock}</div>
                        <div style={{ fontSize: 10, color: T.txD, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>On Hand</div>
                      </div>
                      <div style={{ background: T.surface, borderRadius: 8, padding: 14, textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: T.copper }}>{activePrescription.quantity}</div>
                        <div style={{ fontSize: 10, color: T.txD, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>Required</div>
                      </div>
                    </div>
                    {activeDrug && (
                      <div style={{ fontSize: 12, color: T.txM, marginBottom: 12 }}>
                        <b>Batch:</b> {activeDrug.batchNo || "—"} &nbsp;|&nbsp; <b>Expiry:</b> {activeDrug.expiresAt ? new Date(activeDrug.expiresAt).toLocaleDateString() : "—"}
                        &nbsp;|&nbsp; <b>Price:</b> GHS {(activeDrug.sellingPrice / 100).toFixed(2)} × {activePrescription.quantity} = GHS {(activeDrug.sellingPrice * activePrescription.quantity / 100).toFixed(2)}
                      </div>
                    )}
                  </>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <Button full onClick={() => dispense(activePrescription)} disabled={!canDispense || submitting}>
                    {submitting ? "Dispensing…" : canDispense ? "Confirm Dispense" : !activePrescription.serviceItemId ? "Drug Not In Catalogue" : "Insufficient Stock"}
                  </Button>
                  <Button variant="outline" full onClick={() => markOutOfStock(activePrescription)} disabled={submitting}>
                    Mark Out Of Stock
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </Drawer>

      {/* ═══════════════ STOCK DETAIL DRAWER ═══════════════ */}
      <Drawer open={!!activeDrugDetail} onClose={() => setActiveDrugDetail(null)} title={activeDrugDetail?.name ?? "Drug"} subtitle={activeDrugDetail?.category?.name} width={500}>
        {activeDrugDetail && (
          <>
            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Stock Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ background: T.surface, borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: activeDrugDetail.stock <= activeDrugDetail.minStock ? T.red : T.tx }}>{activeDrugDetail.stock}</div>
                  <div style={{ fontSize: 10, color: T.txD, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>On Hand</div>
                </div>
                <div style={{ background: T.surface, borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.txM }}>{activeDrugDetail.minStock}</div>
                  <div style={{ fontSize: 10, color: T.txD, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>Minimum</div>
                </div>
                <div style={{ background: T.surface, borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.txM }}>{activeDrugDetail.maxStock ?? "—"}</div>
                  <div style={{ fontSize: 10, color: T.txD, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>Maximum</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Unit:</b> {activeDrugDetail.unit}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Batch:</b> {activeDrugDetail.batchNo || "—"}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Expiry:</b> {activeDrugDetail.expiresAt ? new Date(activeDrugDetail.expiresAt).toLocaleDateString() : "—"}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Storage:</b> {activeDrugDetail.storageConditions || "Standard"}</div>
            </Card>
            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Pricing</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Cost Price:</b> GHS {(activeDrugDetail.costPrice / 100).toFixed(2)}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Selling Price:</b> GHS {(activeDrugDetail.sellingPrice / 100).toFixed(2)}</div>
              {activeDrugDetail.costPrice > 0 && <div style={{ fontSize: 13, color: T.tx }}><b>Margin:</b> {((activeDrugDetail.sellingPrice - activeDrugDetail.costPrice) / activeDrugDetail.sellingPrice * 100).toFixed(1)}%</div>}
            </Card>
            <div style={{ display: "flex", gap: 10 }}>
              <Button full onClick={() => openReceiveStock(activeDrugDetail.id)}>Receive Stock</Button>
              <Button variant="outline" full onClick={() => openAdjustStock(activeDrugDetail)}>Adjust Stock</Button>
              <Button variant="outline" full onClick={() => openEditDrug(activeDrugDetail)}>Edit Drug</Button>
            </div>
          </>
        )}
      </Drawer>

      {/* ═══════════════ PO DETAIL DRAWER ═══════════════ */}
      <Drawer open={!!activePO} onClose={() => setActivePO(null)} title={activePO?.poNumber ?? "Purchase Order"} subtitle={activePO?.supplier?.name} width={500}>
        {activePO && (
          <>
            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Order Summary</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Supplier:</b> {activePO.supplier?.name || "—"}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Status:</b> <Pill tone={activePO.status === "received" ? "emerald" : activePO.status === "issued" ? "amber" : "neutral"}>{activePO.status}</Pill></div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Expected:</b> {activePO.expectedDate ? new Date(activePO.expectedDate).toLocaleDateString() : "—"}</div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Created:</b> {new Date(activePO.createdAt).toLocaleDateString()}</div>
              {activePO.notes && <div style={{ fontSize: 13, color: T.tx }}><b>Notes:</b> {activePO.notes}</div>}
            </Card>
            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Line Items</div>
              {activePO.items?.map((item, idx) => {
                const drug = catalogue.find(d => d.id === item.serviceItemId)
                return (
                  <div key={item.id || idx} style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, color: T.tx, fontWeight: 600 }}>{drug?.name || "Unknown Item"}</div>
                      <div style={{ fontSize: 11, color: T.txM }}>Qty: {item.quantity} × GHS {(item.unitCost / 100).toFixed(2)}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.tx }}>GHS {(item.total / 100).toFixed(2)}</div>
                  </div>
                )
              })}
            </Card>
            <Card padding={18}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: T.txM }}>Subtotal</span><span style={{ fontWeight: 700 }}>GHS {(activePO.subtotal / 100).toFixed(2)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: T.txM }}>Tax (15%)</span><span style={{ fontWeight: 700 }}>GHS {(activePO.tax / 100).toFixed(2)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${T.border}` }}><span style={{ fontWeight: 800 }}>Total</span><span style={{ fontWeight: 800, fontSize: 16 }}>GHS {(activePO.total / 100).toFixed(2)}</span></div>
            </Card>
          </>
        )}
      </Drawer>

      {/* ═══════════════ ADD/EDIT DRUG MODAL ═══════════════ */}
      <Modal open={drugModalOpen} onClose={() => setDrugModalOpen(false)} title={editDrug ? "Edit Drug" : "Add Drug To Catalogue"}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Drug Name"><Input placeholder="E.g. Amoxicillin 500mg" value={drugForm.name} onChange={e => setDrugForm(p => ({ ...p, name: e.target.value }))} /></Field></div>
          <Field label="SKU"><Input placeholder="SKU-001" value={drugForm.sku} onChange={e => setDrugForm(p => ({ ...p, sku: e.target.value }))} /></Field>
          <Field label="Barcode"><Input placeholder="Barcode" value={drugForm.barcode} onChange={e => setDrugForm(p => ({ ...p, barcode: e.target.value }))} /></Field>
          <Field label="Category">
            <Select value={drugForm.categoryId} onChange={e => setDrugForm(p => ({ ...p, categoryId: e.target.value }))}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Unit">
            <Select value={drugForm.unit} onChange={e => setDrugForm(p => ({ ...p, unit: e.target.value }))}>
              <option value="tablet">Tablet</option>
              <option value="capsule">Capsule</option>
              <option value="bottle">Bottle</option>
              <option value="vial">Vial</option>
              <option value="ampoule">Ampoule</option>
              <option value="sachet">Sachet</option>
              <option value="tube">Tube</option>
              <option value="pack">Pack</option>
              <option value="piece">Piece</option>
              <option value="ml">ML</option>
              <option value="mg">MG</option>
            </Select>
          </Field>
          <Field label="Cost Price (GHS)"><Input type="number" step="0.01" placeholder="0.00" value={drugForm.costPrice} onChange={e => setDrugForm(p => ({ ...p, costPrice: e.target.value }))} /></Field>
          <Field label="Selling Price (GHS)"><Input type="number" step="0.01" placeholder="0.00" value={drugForm.sellingPrice} onChange={e => setDrugForm(p => ({ ...p, sellingPrice: e.target.value }))} /></Field>
          <Field label="Min Stock"><Input type="number" placeholder="10" value={drugForm.minStock} onChange={e => setDrugForm(p => ({ ...p, minStock: e.target.value }))} /></Field>
          <Field label="Max Stock"><Input type="number" placeholder="500" value={drugForm.maxStock} onChange={e => setDrugForm(p => ({ ...p, maxStock: e.target.value }))} /></Field>
          <Field label="Batch Number"><Input placeholder="BATCH-001" value={drugForm.batchNo} onChange={e => setDrugForm(p => ({ ...p, batchNo: e.target.value }))} /></Field>
          <Field label="Expiry Date"><Input type="date" value={drugForm.expiresAt} onChange={e => setDrugForm(p => ({ ...p, expiresAt: e.target.value }))} /></Field>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Storage Conditions"><Input placeholder="E.g. Store Below 25°C" value={drugForm.storageConditions} onChange={e => setDrugForm(p => ({ ...p, storageConditions: e.target.value }))} /></Field></div>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Description"><TextArea placeholder="Drug Description…" value={drugForm.description} onChange={e => setDrugForm(p => ({ ...p, description: e.target.value }))} /></Field></div>
        </div>
        <div style={{ marginTop: 16 }}><Button full onClick={saveDrug} disabled={submitting}>{submitting ? "Saving…" : editDrug ? "Update Drug" : "Add Drug"}</Button></div>
      </Modal>

      {/* ═══════════════ RECEIVE STOCK MODAL ═══════════════ */}
      <Modal open={receiveModalOpen} onClose={() => setReceiveModalOpen(false)} title="Receive Stock">
        <Field label="Drug">
          <Select value={receiveForm.serviceItemId} onChange={e => setReceiveForm(p => ({ ...p, serviceItemId: e.target.value }))}>
            <option value="">Select Drug</option>
            {catalogue.map(d => <option key={d.id} value={d.id}>{d.name} (Current: {d.stock} {d.unit})</option>)}
          </Select>
        </Field>
        <Field label="Quantity Received"><Input type="number" placeholder="100" value={receiveForm.quantity} onChange={e => setReceiveForm(p => ({ ...p, quantity: e.target.value }))} /></Field>
        <Field label="Batch Number"><Input placeholder="BATCH-001" value={receiveForm.batchNo} onChange={e => setReceiveForm(p => ({ ...p, batchNo: e.target.value }))} /></Field>
        <Field label="Expiry Date"><Input type="date" value={receiveForm.expiresAt} onChange={e => setReceiveForm(p => ({ ...p, expiresAt: e.target.value }))} /></Field>
        <Field label="Reference / Invoice"><Input placeholder="INV-12345" value={receiveForm.reference} onChange={e => setReceiveForm(p => ({ ...p, reference: e.target.value }))} /></Field>
        <div style={{ marginTop: 16 }}><Button full onClick={receiveStock} disabled={submitting}>{submitting ? "Receiving…" : "Receive Stock"}</Button></div>
      </Modal>

      {/* ═══════════════ ADJUST STOCK MODAL ═══════════════ */}
      <Modal open={adjustModalOpen} onClose={() => setAdjustModalOpen(false)} title="Adjust Stock">
        <Field label="Drug">
          <Select value={adjustForm.serviceItemId} onChange={e => setAdjustForm(p => ({ ...p, serviceItemId: e.target.value }))}>
            <option value="">Select Drug</option>
            {catalogue.map(d => <option key={d.id} value={d.id}>{d.name} (Current: {d.stock} {d.unit})</option>)}
          </Select>
        </Field>
        <Field label="New Balance"><Input type="number" placeholder="New Stock Count" value={adjustForm.newBalance} onChange={e => setAdjustForm(p => ({ ...p, newBalance: e.target.value }))} /></Field>
        <Field label="Reason For Adjustment"><TextArea placeholder="Explain why stock is being adjusted…" value={adjustForm.notes} onChange={e => setAdjustForm(p => ({ ...p, notes: e.target.value }))} /></Field>
        <div style={{ marginTop: 16 }}><Button full onClick={adjustStock} disabled={submitting}>{submitting ? "Adjusting…" : "Adjust Stock"}</Button></div>
      </Modal>

      {/* ═══════════════ ADD SUPPLIER MODAL ═══════════════ */}
      <Modal open={supplierModalOpen} onClose={() => setSupplierModalOpen(false)} title="Add Supplier">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Supplier Name"><Input placeholder="E.g. Ernest Chemists" value={supplierForm.name} onChange={e => setSupplierForm(p => ({ ...p, name: e.target.value }))} /></Field></div>
          <Field label="Contact Person"><Input placeholder="Contact Name" value={supplierForm.contactName} onChange={e => setSupplierForm(p => ({ ...p, contactName: e.target.value }))} /></Field>
          <Field label="Phone"><Input placeholder="0XX XXX XXXX" value={supplierForm.phone} onChange={e => setSupplierForm(p => ({ ...p, phone: e.target.value }))} /></Field>
          <Field label="Email"><Input placeholder="supplier@email.com" value={supplierForm.email} onChange={e => setSupplierForm(p => ({ ...p, email: e.target.value }))} /></Field>
          <Field label="Tax ID"><Input placeholder="TIN" value={supplierForm.taxId} onChange={e => setSupplierForm(p => ({ ...p, taxId: e.target.value }))} /></Field>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Address"><TextArea placeholder="Supplier Address" value={supplierForm.address} onChange={e => setSupplierForm(p => ({ ...p, address: e.target.value }))} /></Field></div>
          <Field label="Payment Terms">
            <Select value={supplierForm.paymentTerms} onChange={e => setSupplierForm(p => ({ ...p, paymentTerms: e.target.value }))}>
              <option value="">Select Terms</option>
              <option value="cod">Cash On Delivery</option>
              <option value="net_7">Net 7 Days</option>
              <option value="net_14">Net 14 Days</option>
              <option value="net_30">Net 30 Days</option>
              <option value="net_60">Net 60 Days</option>
              <option value="prepaid">Prepaid</option>
            </Select>
          </Field>
        </div>
        <div style={{ marginTop: 16 }}><Button full onClick={saveSupplier} disabled={submitting}>{submitting ? "Saving…" : "Add Supplier"}</Button></div>
      </Modal>

      {/* ═══════════════ CREATE PURCHASE ORDER MODAL ═══════════════ */}
      <Modal open={poModalOpen} onClose={() => setPOModalOpen(false)} title="New Purchase Order" width={680}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Supplier">
            <Select value={poForm.supplierId} onChange={e => setPOForm(p => ({ ...p, supplierId: e.target.value }))}>
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Expected Delivery"><Input type="date" value={poForm.expectedDate} onChange={e => setPOForm(p => ({ ...p, expectedDate: e.target.value }))} /></Field>
        </div>

        <div style={{ marginTop: 16, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>Order Lines</div>
            <Button size="sm" icon="plus" onClick={addPOLine}>Add Line</Button>
          </div>

          {poForm.items.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: T.txD, fontSize: 12 }}>Click "Add Line" To Add Items To This Order</div>
          ) : (
            poForm.items.map((line, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "end" }}>
                <Field label={idx === 0 ? "Drug" : ""}>
                  <Select value={line.serviceItemId} onChange={e => updatePOLine(idx, "serviceItemId", e.target.value)}>
                    <option value="">Select Drug</option>
                    {catalogue.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </Field>
                <Field label={idx === 0 ? "Qty" : ""}><Input type="number" placeholder="Qty" value={line.quantity} onChange={e => updatePOLine(idx, "quantity", e.target.value)} /></Field>
                <Field label={idx === 0 ? "Unit Cost (GHS)" : ""}><Input type="number" step="0.01" placeholder="0.00" value={line.unitCost} onChange={e => updatePOLine(idx, "unitCost", e.target.value)} /></Field>
                <Button variant="outline" size="sm" onClick={() => removePOLine(idx)}>×</Button>
              </div>
            ))
          )}

          {poForm.items.length > 0 && (
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginTop: 8, textAlign: "right" }}>
              <div style={{ fontSize: 12, color: T.txM }}>Subtotal: GHS {poForm.items.reduce((s, i) => s + (parseInt(i.quantity) || 0) * parseFloat(i.unitCost || "0"), 0).toFixed(2)}</div>
              <div style={{ fontSize: 12, color: T.txM }}>Tax (15%): GHS {(poForm.items.reduce((s, i) => s + (parseInt(i.quantity) || 0) * parseFloat(i.unitCost || "0"), 0) * 0.15).toFixed(2)}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.tx, marginTop: 4 }}>Total: GHS {(poForm.items.reduce((s, i) => s + (parseInt(i.quantity) || 0) * parseFloat(i.unitCost || "0"), 0) * 1.15).toFixed(2)}</div>
            </div>
          )}
        </div>

        <Field label="Notes"><TextArea placeholder="Order Notes…" value={poForm.notes} onChange={e => setPOForm(p => ({ ...p, notes: e.target.value }))} /></Field>
        <div style={{ marginTop: 16 }}><Button full onClick={createPO} disabled={submitting || poForm.items.length === 0}>{submitting ? "Creating…" : "Create Purchase Order"}</Button></div>
      </Modal>
    </HealthShell>
  )
}
