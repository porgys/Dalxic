"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { T, Card, Button, SearchBar, Input, Pill } from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import { money } from "@/lib/ops/format"
import { calculateTax } from "@/lib/api/tax"
import { useAuth } from "@/lib/use-auth"
import type { MockTenant } from "@/lib/ops/mock"

type Accent = "amber" | "copper" | "sky" | "emerald"

const ACCENT_HEX: Record<Accent, string> = { amber: T.amber, copper: T.copper, sky: T.sky, emerald: T.emerald }

interface POSItem {
  id: string
  name: string
  price: number
  stock: number
  category: string
}

interface CartLine {
  item: POSItem
  qty: number
}

type PayMethod = "cash" | "momo" | "card" | "bank_transfer" | "insurance" | "credit"
type Node = "cart" | "tender" | "receipt"

const DEMO_CATEGORIES = ["All", "Medication", "Supplies", "Services", "Lab", "Radiology"]

const POS_ITEMS: POSItem[] = [
  { id: "P-001", name: "Paracetamol 500mg", price: 5, stock: 2400, category: "Medication" },
  { id: "P-002", name: "Amoxicillin 250mg", price: 18, stock: 860, category: "Medication" },
  { id: "P-003", name: "Metformin 500mg", price: 12, stock: 140, category: "Medication" },
  { id: "P-004", name: "Ibuprofen 400mg", price: 8, stock: 90, category: "Medication" },
  { id: "P-005", name: "Cetrizine 10mg", price: 6, stock: 1200, category: "Medication" },
  { id: "P-006", name: "Omeprazole 20mg", price: 15, stock: 420, category: "Medication" },
  { id: "P-007", name: "Surgical Gloves (Box)", price: 72, stock: 180, category: "Supplies" },
  { id: "P-008", name: "Bandage Roll 10cm", price: 4, stock: 45, category: "Supplies" },
  { id: "P-009", name: "IV Cannula (20G)", price: 8, stock: 320, category: "Supplies" },
  { id: "P-010", name: "Gauze Pad (Sterile)", price: 3, stock: 520, category: "Supplies" },
  { id: "P-011", name: "Consultation Fee", price: 150, stock: 999, category: "Services" },
  { id: "P-012", name: "Follow-up Visit", price: 80, stock: 999, category: "Services" },
  { id: "P-013", name: "Dental Check-up", price: 80, stock: 999, category: "Services" },
  { id: "P-014", name: "Blood Test Panel", price: 120, stock: 999, category: "Lab" },
  { id: "P-015", name: "Malaria RDT", price: 35, stock: 999, category: "Lab" },
  { id: "P-016", name: "Urinalysis", price: 40, stock: 999, category: "Lab" },
  { id: "P-017", name: "X-Ray (Chest)", price: 180, stock: 999, category: "Radiology" },
  { id: "P-018", name: "Ultrasound Scan", price: 250, stock: 999, category: "Radiology" },
]

const PAY_METHODS: { key: PayMethod; label: string }[] = [
  { key: "cash", label: "Cash" },
  { key: "momo", label: "MoMo" },
  { key: "card", label: "Card" },
  { key: "bank_transfer", label: "Bank" },
  { key: "insurance", label: "Insurance" },
  { key: "credit", label: "Credit" },
]

function mapPosItem(api: Record<string, unknown>): POSItem {
  return {
    id: api.id as string,
    name: api.name as string,
    price: ((api.sellingPrice as number) ?? 0) / 100,
    stock: (api.stock as number) ?? 0,
    category: (api.category as { name?: string } | null)?.name ?? "General",
  }
}

interface ReceiptData {
  code: string
  dateTime: string
  operator: string
}

export function POSPage({ accent, tenant }: { accent: Accent; tenant: MockTenant }) {
  const { authFetch, session } = useAuth()
  const accentHex = ACCENT_HEX[accent]
  const [node, setNode] = useState<Node>("cart")
  const [cart, setCart] = useState<CartLine[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [notes, setNotes] = useState("")
  const [payMethod, setPayMethod] = useState<PayMethod>("cash")
  const [receiptCode, setReceiptCode] = useState(() => `RX-${Date.now().toString(36).toUpperCase().slice(-6)}`)
  const [items, setItems] = useState<POSItem[]>(POS_ITEMS)
  const [loading, setLoading] = useState(false)
  const [branchId, setBranchId] = useState("")
  const [cartId, setCartId] = useState("")
  const [cartItemMap, setCartItemMap] = useState<Record<string, string>>({}) // serviceItemId -> cartItemId
  const [paying, setPaying] = useState(false)
  const [payRef, setPayRef] = useState("")
  const [payAmount, setPayAmount] = useState("")
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [categories, setCategories] = useState<string[]>(DEMO_CATEGORIES)

  // Fetch catalogue items
  const fetchItems = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const res = await authFetch("/api/catalogue")
      const json = await res.json()
      if (json.success && json.data?.rows) {
        const mapped = (json.data.rows as Record<string, unknown>[]).map(mapPosItem)
        setItems(mapped)
        const cats = [...new Set(mapped.map(i => i.category))]
        setCategories(["All", ...cats])
      }
    } catch { /* demo fallback */ }
    finally { setLoading(false) }
  }, [session, authFetch])

  useEffect(() => { fetchItems() }, [fetchItems])

  // Fetch first branch
  useEffect(() => {
    if (!session) return
    authFetch("/api/branches").then(r => r.json()).then(json => {
      if (json.success && json.data?.rows?.length) {
        setBranchId((json.data.rows[0] as { id: string }).id)
      }
    }).catch(() => {})
  }, [session, authFetch])

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      if (category !== "All" && i.category !== category) return false
      if (search) return i.name.toLowerCase().includes(search.toLowerCase())
      return true
    })
  }, [items, search, category])

  const subtotal = cart.reduce((s, l) => s + l.item.price * l.qty, 0)
  const taxBreakdown = calculateTax(Math.round(subtotal * 100))
  const tax = taxBreakdown.total / 100
  const total = subtotal + tax
  const cartCount = cart.reduce((s, l) => s + l.qty, 0)

  // Ensure a backend cart exists, return the cart id
  async function ensureCart(): Promise<string> {
    if (cartId) return cartId
    if (!session || !branchId) return ""
    try {
      const res = await authFetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, notes: notes || undefined }),
      })
      const json = await res.json()
      if (json.success && json.data?.id) {
        const id = json.data.id as string
        setCartId(id)
        return id
      }
    } catch { /* silent */ }
    return ""
  }

  async function addToCart(item: POSItem) {
    setCart(prev => {
      const idx = prev.findIndex(l => l.item.id === item.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 }
        return next
      }
      return [...prev, { item, qty: 1 }]
    })

    // Fire-and-forget API call to sync cart
    if (session && branchId) {
      const cid = await ensureCart()
      if (!cid) return
      const existing = cartItemMap[item.id]
      if (existing) {
        const line = cart.find(l => l.item.id === item.id)
        const newQty = (line?.qty ?? 0) + 1
        authFetch(`/api/cart/${cid}/items/${existing}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: newQty }),
        }).catch(() => {})
      } else {
        authFetch(`/api/cart/${cid}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceItemId: item.id, quantity: 1 }),
        }).then(r => r.json()).then(json => {
          if (json.success && json.data?.id) {
            setCartItemMap(prev => ({ ...prev, [item.id]: json.data.id as string }))
          }
        }).catch(() => {})
      }
    }
  }

  function updateQty(itemId: string, delta: number) {
    setCart(prev => {
      const next = prev.map(l => l.item.id === itemId ? { ...l, qty: Math.max(0, l.qty + delta) } : l).filter(l => l.qty > 0)
      return next
    })

    // Sync to API
    if (session && cartId) {
      const line = cart.find(l => l.item.id === itemId)
      const newQty = (line?.qty ?? 0) + delta
      const ciId = cartItemMap[itemId]
      if (ciId && newQty > 0) {
        authFetch(`/api/cart/${cartId}/items/${ciId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: newQty }),
        }).catch(() => {})
      } else if (ciId && newQty <= 0) {
        authFetch(`/api/cart/${cartId}/items/${ciId}`, { method: "DELETE" }).catch(() => {})
        setCartItemMap(prev => { const n = { ...prev }; delete n[itemId]; return n })
      }
    }
  }

  function removeLine(itemId: string) {
    setCart(prev => prev.filter(l => l.item.id !== itemId))

    // Sync to API
    if (session && cartId) {
      const ciId = cartItemMap[itemId]
      if (ciId) {
        authFetch(`/api/cart/${cartId}/items/${ciId}`, { method: "DELETE" }).catch(() => {})
        setCartItemMap(prev => { const n = { ...prev }; delete n[itemId]; return n })
      }
    }
  }

  async function handleTender() {
    if (session && cartId) {
      try {
        await authFetch(`/api/cart/${cartId}/tender`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      } catch { /* proceed to tender UI regardless */ }
    }
    setPayAmount(total.toFixed(2))
    setNode("tender")
  }

  async function handlePay() {
    setPaying(true)
    if (session && cartId) {
      try {
        const amountPesewas = Math.round(parseFloat(payAmount || String(total)) * 100)
        const res = await authFetch(`/api/cart/${cartId}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: payMethod,
            amount: amountPesewas,
            reference: payRef || undefined,
          }),
        })
        const json = await res.json()
        if (json.success && json.data) {
          const d = json.data as Record<string, unknown>
          setReceiptCode((d.receiptNo as string) ?? receiptCode)
          setReceiptData({
            code: (d.receiptNo as string) ?? receiptCode,
            dateTime: (d.createdAt as string) ?? new Date().toISOString(),
            operator: (d.operator as { name?: string } | null)?.name ?? session?.operatorName ?? "Operator",
          })
        }
      } catch { /* proceed to receipt UI */ }
    }
    setPaying(false)
    setNode("receipt")
  }

  function resetSale() {
    setCart([])
    setSearch("")
    setCategory("All")
    setNotes("")
    setPayMethod("cash")
    setPayRef("")
    setPayAmount("")
    setCartId("")
    setCartItemMap({})
    setReceiptData(null)
    setReceiptCode(`RX-${Date.now().toString(36).toUpperCase().slice(-6)}`)
    setNode("cart")
    fetchItems() // refresh stock counts
  }

  const posLabel = tenant.type === "health" ? "Billing" : tenant.type === "institute" ? "Fee Collection" : "Point of Sale"

  /* ── Node 1: Item Picker + Cart ── */
  if (node === "cart") {
    return (
      <div style={{ display: "flex", height: "calc(100vh - 56px)", background: T.bg, fontFamily: "'DM Sans', sans-serif" }}>
        {/* Left: Item picker */}
        <div style={{ flex: "0 0 60%", display: "flex", flexDirection: "column", borderRight: `1px solid ${T.border}` }}>
          {/* Category tabs */}
          <div style={{ display: "flex", gap: 4, padding: "12px 20px", borderBottom: `1px solid ${T.border}`, overflowX: "auto" }}>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                  background: category === c ? `${accentHex}18` : "transparent",
                  color: category === c ? accentHex : T.txM,
                  transition: "all 0.15s",
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ padding: "12px 20px" }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search items..." />
          </div>

          {/* Item grid */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
            {loading && <div style={{ textAlign: "center", padding: 12, fontSize: 12, color: T.txM }}>Loading items...</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  style={{
                    background: `rgba(16,185,129,0.03)`,
                    border: `1px solid ${T.border}`,
                    borderRadius: 12,
                    padding: 14,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color 0.15s, transform 0.1s",
                  }}
                  onMouseEnter={e => { (e.currentTarget).style.borderColor = `${accentHex}40` }}
                  onMouseLeave={e => { (e.currentTarget).style.borderColor = T.border }}
                  onMouseDown={e => { (e.currentTarget).style.transform = "scale(0.97)" }}
                  onMouseUp={e => { (e.currentTarget).style.transform = "scale(1)" }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.tx, marginBottom: 6 }}>{item.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: accentHex, fontFamily: "'Space Grotesk', sans-serif" }}>{money(item.price)}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                      fontFamily: "'DM Mono', monospace",
                      color: item.stock <= 10 ? T.red : T.txD,
                      background: item.stock <= 10 ? `${T.red}12` : T.surface2,
                    }}>
                      {item.stock}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div style={{ flex: "0 0 40%", display: "flex", flexDirection: "column", background: T.surface }}>
          {/* Cart header */}
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="pos" size={18} color={accentHex} />
              <span style={{ fontSize: 16, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>Cart</span>
            </div>
            {cartCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: `${accentHex}15`, color: accentHex, fontFamily: "'DM Mono', monospace" }}>
                {cartCount} item{cartCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Cart items */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <Icon name="pos" size={36} color={T.txD} />
                <p style={{ fontSize: 13, color: T.txM, marginTop: 12 }}>Click items to add to cart</p>
              </div>
            ) : (
              cart.map(line => (
                <div
                  key={line.item.id}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>{line.item.name}</div>
                    <div style={{ fontSize: 11, color: T.txM, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{money(line.item.price)} each</div>
                  </div>

                  {/* Qty controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={() => updateQty(line.item.id, -1)}
                      style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.border2}`, background: "transparent", color: T.txM, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}
                    >-</button>
                    <span style={{ width: 28, textAlign: "center", fontSize: 13, fontWeight: 700, color: T.tx, fontFamily: "'DM Mono', monospace" }}>{line.qty}</span>
                    <button
                      onClick={() => updateQty(line.item.id, 1)}
                      style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.border2}`, background: "transparent", color: T.txM, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}
                    >+</button>
                  </div>

                  <div style={{ width: 80, textAlign: "right", fontSize: 13, fontWeight: 700, color: T.tx, fontFamily: "'DM Mono', monospace" }}>
                    {money(line.item.price * line.qty)}
                  </div>

                  <button
                    onClick={() => removeLine(line.item.id)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: T.txD, padding: 4, display: "flex" }}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart footer */}
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}` }}>
            <div style={{ marginBottom: 12 }}>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Sale notes (optional)" style={{ fontSize: 12 }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: T.txM }}>Subtotal</span>
              <span style={{ fontSize: 12, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{money(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: T.txM }}>Tax (15%)</span>
              <span style={{ fontSize: 12, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{money(tax)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: accentHex, fontFamily: "'Space Grotesk', sans-serif" }}>{money(total)}</span>
            </div>

            <Button full size="lg" disabled={cart.length === 0} onClick={handleTender}>
              Tender
            </Button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Node 2: Payment ── */
  if (node === "tender") {
    return (
      <div style={{ minHeight: "calc(100vh - 56px)", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: 32 }}>
        <Card accent={accent} padding={40} style={{ width: "100%", maxWidth: 560 }}>
          {/* Cart summary */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Order Summary</div>
            {cart.map(line => (
              <div key={line.item.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: T.tx }}>{line.item.name} x{line.qty}</span>
                <span style={{ fontSize: 13, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{money(line.item.price * line.qty)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Total Due</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: accentHex, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>{money(total)}</div>
          </div>

          {/* Payment methods */}
          <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Payment Method</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
            {PAY_METHODS.map(m => (
              <button
                key={m.key}
                onClick={() => setPayMethod(m.key)}
                style={{
                  padding: "14px 10px", borderRadius: 10, cursor: "pointer",
                  border: `1px solid ${payMethod === m.key ? accentHex : T.border2}`,
                  background: payMethod === m.key ? `${accentHex}12` : "transparent",
                  color: payMethod === m.key ? accentHex : T.txM,
                  fontSize: 12, fontWeight: 700, textTransform: "uppercase",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Amount & reference */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.10em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Amount</div>
              <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} style={{ fontFamily: "'DM Mono', monospace", fontSize: 14 }} />
            </div>
            {payMethod !== "cash" && (
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.10em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Reference</div>
                <Input placeholder="Transaction ref" style={{ fontFamily: "'DM Mono', monospace" }} value={payRef} onChange={e => setPayRef(e.target.value)} />
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="ghost" onClick={() => setNode("cart")}>Back</Button>
            <Button full size="lg" onClick={handlePay} disabled={paying}>{paying ? "Processing..." : "Process Payment"}</Button>
          </div>
        </Card>
      </div>
    )
  }

  /* ── Node 3: Receipt ── */
  return (
    <div style={{ minHeight: "calc(100vh - 56px)", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: 32 }}>
      <Card accent={accent} padding={40} style={{ width: "100%", maxWidth: 480 }}>
        {/* Success animation */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.emerald}, #059669)`,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 8px 32px ${T.emerald}30`,
            marginBottom: 16,
          }}>
            <Icon name="check" size={32} color="#fff" strokeWidth={2.4} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4 }}>Payment Successful</h2>
          <p style={{ fontSize: 12, color: T.txM }}>Transaction completed</p>
        </div>

        {/* Receipt details */}
        <div style={{ background: T.surface2, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace" }}>Receipt</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: accentHex, fontFamily: "'DM Mono', monospace" }}>{receiptCode}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: T.txM }}>Date/Time</span>
            <span style={{ fontSize: 11, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          {cart.map(line => (
            <div key={line.item.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
              <span style={{ color: T.tx }}>{line.item.name} x{line.qty}</span>
              <span style={{ color: T.txM, fontFamily: "'DM Mono', monospace" }}>{money(line.item.price * line.qty)}</span>
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 12, paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: T.txM }}>Subtotal</span>
              <span style={{ fontSize: 12, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{money(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: T.txM }}>Tax (15%)</span>
              <span style={{ fontSize: 12, color: T.txM, fontFamily: "'DM Mono', monospace" }}>{money(tax)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>Total</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: accentHex, fontFamily: "'Space Grotesk', sans-serif" }}>{money(total)}</span>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 12, paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: T.txM }}>Payment</span>
              <Pill tone="emerald">{payMethod === "bank_transfer" ? "Bank" : payMethod}</Pill>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 11, color: T.txM }}>Operator</span>
              <span style={{ fontSize: 11, color: T.txM }}>{receiptData?.operator ?? session?.operatorName ?? "Operator"}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="outline" icon="print" full>Print Receipt</Button>
          <Button full onClick={resetSale}>New Sale</Button>
        </div>
      </Card>
    </div>
  )
}
