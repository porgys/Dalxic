"use client"
import { useState, useMemo, useEffect, useCallback } from "react"
import { HealthShell } from "@/components/ops/HealthShell"
import { useAuth } from "@/lib/use-auth"
import { Page, Stat, Pill, Drawer, Tabs, DataTable, Card, T, Button, SearchBar, Select, Field, Section } from "@/components/ops/primitives"
import { money } from "@/lib/ops/format"

type View = "all" | "unpaid" | "paid"

interface CartItem {
  id: string
  itemName: string
  unitPrice: number
  quantity: number
  discount: number
  tax: number
  total: number
}

interface Cart {
  id: string
  orgId: string
  branchId: string
  operatorId: string
  contactId: string | null
  status: string
  paymentGate: string
  createdAt: string
  items: CartItem[]
}

interface ReceiptItem {
  itemName: string
  unitPrice: number
  quantity: number
  discount: number
  tax: number
  total: number
}

interface Receipt {
  id: string
  code: string
  paymentId: string
  cartId: string
  subtotal: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  items: ReceiptItem[]
  customerName: string | null
  customerPhone: string | null
  createdAt: string
  payment?: {
    method: string
    amount: number
    status: string
    processedByName: string
    processedAt: string | null
  }
}

interface InvoiceRow {
  id: string
  cartId: string
  patientName: string
  description: string
  serviceType: string
  amount: number
  status: "unpaid" | "paid"
  method?: string
  date: string
  receiptCode?: string
  receipt?: Receipt
}

export default function BillingPage() {
  const { session, authFetch } = useAuth()
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [view, setView] = useState<View>("all")
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<InvoiceRow | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const fetchData = useCallback(async () => {
    if (!session) return
    try {
      // Fetch tendered carts (unpaid invoices) and receipts (paid) in parallel
      const [tenderedRes, receiptsRes, openRes] = await Promise.all([
        authFetch("/api/cart?status=tendered"),
        authFetch("/api/receipts"),
        authFetch("/api/cart?status=open"),
      ])
      const [tenderedJson, receiptsJson, openJson] = await Promise.all([
        tenderedRes.json(),
        receiptsRes.json(),
        openRes.json(),
      ])

      const rows: InvoiceRow[] = []

      // Tendered carts = unpaid invoices
      const tenderedCarts: Cart[] = tenderedJson.success ? tenderedJson.data : []
      for (const cart of tenderedCarts) {
        const totalAmount = cart.items.reduce((s, i) => s + i.total, 0)
        const description = cart.items.map(i => i.itemName).join(", ")
        const serviceType = cart.items.length > 0 ? cart.items[0].itemName : "Service"

        rows.push({
          id: `cart-${cart.id}`,
          cartId: cart.id,
          patientName: "Patient", // Will be enriched below
          description: description || "Pending Invoice",
          serviceType,
          amount: totalAmount,
          status: "unpaid",
          date: cart.createdAt,
        })
      }

      // Open carts with items = also unpaid (not yet tendered)
      const openCarts: Cart[] = openJson.success ? openJson.data : []
      for (const cart of openCarts) {
        if (cart.items.length === 0) continue
        const totalAmount = cart.items.reduce((s, i) => s + i.total, 0)
        const description = cart.items.map(i => i.itemName).join(", ")

        rows.push({
          id: `cart-${cart.id}`,
          cartId: cart.id,
          patientName: "Patient",
          description: description || "Open Cart",
          serviceType: cart.items[0]?.itemName ?? "Service",
          amount: totalAmount,
          status: "unpaid",
          date: cart.createdAt,
        })
      }

      // Receipts = paid invoices
      const receipts: Receipt[] = receiptsJson.success ? receiptsJson.data.receipts : []
      for (const receipt of receipts) {
        const items = Array.isArray(receipt.items) ? receipt.items as ReceiptItem[] : []
        const description = items.map(i => i.itemName).join(", ")

        rows.push({
          id: `receipt-${receipt.id}`,
          cartId: receipt.cartId,
          patientName: receipt.customerName || "Patient",
          description: description || "Paid Invoice",
          serviceType: items.length > 0 ? items[0].itemName : "Service",
          amount: receipt.grandTotal,
          status: "paid",
          method: receipt.payment?.method,
          date: receipt.createdAt,
          receiptCode: receipt.code,
          receipt,
        })
      }

      // Enrich patient names for unpaid carts that have contactId
      const allCarts = [...tenderedCarts, ...openCarts.filter(c => c.items.length > 0)]
      const contactIds = [...new Set(allCarts.filter(c => c.contactId).map(c => c.contactId!))]
      if (contactIds.length > 0) {
        // Fetch contacts one by one (no bulk endpoint)
        for (const contactId of contactIds) {
          try {
            const contactRes = await authFetch(`/api/contacts?id=${contactId}`)
            const contactJson = await contactRes.json()
            if (contactJson.success && Array.isArray(contactJson.data) && contactJson.data.length > 0) {
              const contact = contactJson.data[0]
              const matchingCarts = allCarts.filter(c => c.contactId === contactId)
              for (const cart of matchingCarts) {
                const row = rows.find(r => r.cartId === cart.id)
                if (row) row.patientName = contact.name
              }
            }
          } catch {
            // Non-critical — patient name stays as "Patient"
          }
        }
      }

      // Sort by date descending
      rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setInvoices(rows)
      setError(null)
    } catch {
      setError("Network Error — Could Not Load Billing Data")
    } finally {
      setLoading(false)
    }
  }, [session, authFetch])

  useEffect(() => {
    if (session) fetchData()
  }, [session, fetchData])

  const filtered = useMemo(() => {
    let list = [...invoices]
    if (view === "unpaid") list = list.filter(i => i.status === "unpaid")
    if (view === "paid") list = list.filter(i => i.status === "paid")
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(i => i.patientName.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
    }
    return list
  }, [view, query, invoices])

  const revenueToday = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0)
  const pendingBills = invoices.filter(i => i.status === "unpaid").length
  const outstanding = invoices.filter(i => i.status === "unpaid").reduce((s, i) => s + i.amount, 0)
  const totalBilled = invoices.length
  const paidCount = invoices.filter(i => i.status === "paid").length
  const collectionRate = totalBilled > 0 ? (paidCount / totalBilled) * 100 : 0
  const collectionLabel = `${collectionRate.toFixed(1)}%`

  async function processPayment(invoice: InvoiceRow) {
    if (!session) return
    setProcessing(true)
    setError(null)
    try {
      const cartId = invoice.cartId

      // If the cart is still open (not tendered), tender it first
      const cartRes = await authFetch(`/api/cart/${cartId}`)
      const cartJson = await cartRes.json()
      if (!cartJson.success) {
        setError(cartJson.error || "Failed To Load Cart")
        setProcessing(false)
        return
      }

      if (cartJson.data.status === "open") {
        const tenderRes = await authFetch(`/api/cart/${cartId}/tender`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
        const tenderJson = await tenderRes.json()
        if (!tenderJson.success) {
          setError(tenderJson.error || "Failed To Tender Cart")
          setProcessing(false)
          return
        }
      }

      // Get updated cart to get grandTotal
      const updatedRes = await authFetch(`/api/cart/${cartId}`)
      const updatedJson = await updatedRes.json()
      if (!updatedJson.success) {
        setError("Failed To Load Updated Cart")
        setProcessing(false)
        return
      }
      const updatedCart = updatedJson.data
      const grandTotal = updatedCart.items.reduce((s: number, i: CartItem) => s + i.total, 0)

      // Process payment
      const payRes = await authFetch(`/api/cart/${cartId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: paymentMethod,
          amount: grandTotal,
        }),
      })
      const payJson = await payRes.json()
      if (!payJson.success) {
        setError(payJson.error || "Payment Failed")
        setProcessing(false)
        return
      }

      setActive(null)
      await fetchData()
    } catch {
      setError("Network Error — Payment Failed")
    } finally {
      setProcessing(false)
    }
  }

  function printReceipt(invoice: InvoiceRow) {
    if (!invoice.receipt) {
      window.print()
      return
    }
    const r = invoice.receipt
    const items = Array.isArray(r.items) ? r.items as ReceiptItem[] : []
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.write(`
      <html><head><title>Receipt ${r.code}</title>
      <style>body{font-family:monospace;padding:20px;max-width:300px;margin:0 auto}
      h2{text-align:center;margin-bottom:4px}
      .line{border-top:1px dashed #000;margin:8px 0}
      .row{display:flex;justify-content:space-between;font-size:12px;margin:2px 0}
      .total{font-weight:bold;font-size:14px}
      </style></head><body>
      <h2>Receipt</h2>
      <div style="text-align:center;font-size:11px">${r.code}</div>
      <div style="text-align:center;font-size:11px">${new Date(r.createdAt).toLocaleString()}</div>
      ${r.customerName ? `<div style="text-align:center;font-size:11px">Patient: ${r.customerName}</div>` : ""}
      <div class="line"></div>
      ${items.map(i => `<div class="row"><span>${i.itemName} x${i.quantity}</span><span>${money(i.total)}</span></div>`).join("")}
      <div class="line"></div>
      <div class="row"><span>Subtotal</span><span>${money(r.subtotal)}</span></div>
      ${r.discountTotal > 0 ? `<div class="row"><span>Discount</span><span>-${money(r.discountTotal)}</span></div>` : ""}
      ${r.taxTotal > 0 ? `<div class="row"><span>Tax</span><span>${money(r.taxTotal)}</span></div>` : ""}
      <div class="line"></div>
      <div class="row total"><span>Total</span><span>${money(r.grandTotal)}</span></div>
      <div class="line"></div>
      <div style="text-align:center;font-size:11px">Method: ${invoice.method ?? "N/A"}</div>
      <div style="text-align:center;font-size:10px;margin-top:16px">Thank You</div>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <HealthShell>
      <Page accent="copper" title="Billing" subtitle="Revenue Dashboard, Patient Billing, Payments And Receipts.">
        {error && (
          <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#f87171", fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Revenue Today" value={money(revenueToday)} accent="copper" icon="billing" />
          <Stat label="Pending Bills" value={pendingBills} accent="amber" icon="orders" />
          <Stat label="Outstanding" value={money(outstanding)} accent="neutral" icon="trending" />
          <Stat label="Collection Rate" value={collectionLabel} accent="emerald" icon="check" />
        </div>

        <Section
          title="Billing Ledger"
          action={<div style={{ width: 280 }}><SearchBar value={query} onChange={setQuery} placeholder="Search Patient..." /></div>}
        >
          <Tabs<View> value={view} onChange={setView} accent="copper" tabs={[
            { key: "all", label: "All", count: invoices.length },
            { key: "unpaid", label: "Unpaid", count: invoices.filter(i => i.status === "unpaid").length },
            { key: "paid", label: "Paid", count: invoices.filter(i => i.status === "paid").length },
          ]} />

          {loading ? (
            <div style={{ textAlign: "center", padding: 48, color: T.txD, fontSize: 13, fontWeight: 600 }}>Loading Billing Data...</div>
          ) : (
            <DataTable
              columns={[
                { key: "patientName", label: "Patient", render: (i: InvoiceRow) => i.patientName },
                { key: "description", label: "Description", render: (i: InvoiceRow) => <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>{i.description}</span> },
                { key: "amount", label: "Amount", width: 110, render: (i: InvoiceRow) => <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{money(i.amount)}</span> },
                { key: "status", label: "Status", width: 100, render: (i: InvoiceRow) => <Pill tone={i.status === "unpaid" ? "amber" : "emerald"}>{i.status === "unpaid" ? "Unpaid" : "Paid"}</Pill> },
                { key: "method", label: "Method", width: 90, render: (i: InvoiceRow) => i.method ?? "\u2014" },
                { key: "date", label: "Date", width: 100, render: (i: InvoiceRow) => new Date(i.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) },
              ]}
              rows={filtered}
              onRowClick={(i) => { setActive(i as InvoiceRow); setPaymentMethod("cash") }}
            />
          )}
        </Section>

        <Drawer open={!!active} onClose={() => setActive(null)} title="Patient Billing" subtitle={active?.patientName} width={500}>
          {active && (
            <>
              <Card padding={18} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Billable Items</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Description:</b> {active.description}</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Amount:</b> {money(active.amount)}</div>
                <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Date:</b> {new Date(active.date).toLocaleString()}</div>
                {active.receiptCode && <div style={{ fontSize: 13, color: T.tx }}><b>Receipt:</b> {active.receiptCode}</div>}
              </Card>

              <Card padding={18} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Process Payment</div>
                <Field label="Payment Method">
                  <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="momo">Mobile Money (MoMo)</option>
                    <option value="nhis">NHIS</option>
                    <option value="insurance">Private Insurance</option>
                    <option value="waived">Waived</option>
                  </Select>
                </Field>
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <Button full disabled={active.status === "paid" || processing} onClick={() => processPayment(active)}>
                    {processing ? "Processing..." : "Process Payment"}
                  </Button>
                  <Button variant="outline" full disabled={active.status !== "paid"} onClick={() => printReceipt(active)}>Print Receipt</Button>
                </div>
              </Card>
            </>
          )}
        </Drawer>
      </Page>
    </HealthShell>
  )
}
