"use client"
import { useState, useRef, useCallback } from "react"

/* ═══════════════════════════════════════════════════════════════
   DALXICTRADE — Dashboard / POS / Inventory
   Flexible retail platform with photo-based catalogue.
   ═══════════════════════════════════════════════════════════════ */

const EMERALD    = "#10B981"
const EMERALD_L  = "#34D399"
const EMERALD_GL = "#6EE7B7"
const TRADE_COL  = "#F59E0B"
const BG         = "#040A0F"

type Screen = "dashboard" | "pos" | "inventory" | "orders" | "analytics"

interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string
  photo?: string
  sku?: string
  expiresAt?: string
  batchNo?: string
  unit: string
}

interface CartItem {
  product: Product
  qty: number
}

/* ── Demo products ── */
const DEMO_PRODUCTS: Product[] = [
  { id: "p1", name: "Rice (50kg Bag)", price: 450, stock: 24, category: "Groceries", unit: "bag", sku: "GR-001" },
  { id: "p2", name: "Cooking Oil (5L)", price: 85, stock: 36, category: "Groceries", unit: "bottle", expiresAt: "2027-03-15", batchNo: "B-2026-441" },
  { id: "p3", name: "Mens T-Shirt (Black)", price: 65, stock: 120, category: "Clothing", unit: "piece" },
  { id: "p4", name: "Ladies Ankara Dress", price: 180, stock: 45, category: "Clothing", unit: "piece" },
  { id: "p5", name: "Samsung Galaxy A15", price: 1200, stock: 8, category: "Electronics", unit: "piece", sku: "EL-015" },
  { id: "p6", name: "Phone Charger (USB-C)", price: 35, stock: 200, category: "Electronics", unit: "piece" },
  { id: "p7", name: "School Exercise Book (Set)", price: 12, stock: 500, category: "Stationery", unit: "set" },
  { id: "p8", name: "Cement (Dangote 50kg)", price: 72, stock: 60, category: "Building", unit: "bag", batchNo: "DG-2026-88" },
  { id: "p9", name: "Paracetamol (Pack)", price: 8, stock: 300, category: "Pharmacy", unit: "pack", expiresAt: "2027-08-01" },
  { id: "p10", name: "Fresh Tilapia (1kg)", price: 55, stock: 15, category: "Fresh", unit: "kg", expiresAt: "2026-04-14" },
  { id: "p11", name: "Plastic Chairs (Nesta)", price: 95, stock: 40, category: "Household", unit: "piece" },
  { id: "p12", name: "Hair Extensions (Bundle)", price: 250, stock: 30, category: "Beauty", unit: "bundle" },
]

/* ── Styles ── */
const glass = {
  background: "rgba(16,185,129,0.03)",
  border: "1px solid rgba(16,185,129,0.08)",
  borderRadius: 16,
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  transform: "translateZ(0)" as const,
  willChange: "transform" as const,
} as const

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  fontSize: 13,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(16,185,129,0.12)",
  color: "#ECF5F0",
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#3A6B5A",
  marginBottom: 5,
}

const btnPrimary: React.CSSProperties = {
  padding: "10px 22px",
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#fff",
  cursor: "pointer",
  background: `linear-gradient(135deg, ${EMERALD}, #059669)`,
  border: "none",
  fontFamily: "'DM Sans', sans-serif",
  boxShadow: `0 4px 16px ${EMERALD}25`,
}

/* ── Header ── */
function Header({ screen, setScreen, storeName }: { screen: Screen; setScreen: (s: Screen) => void; storeName: string }) {
  const tabs: { key: Screen; label: string; icon: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: "🏠" },
    { key: "pos", label: "Point Of Sale", icon: "💳" },
    { key: "inventory", label: "Inventory", icon: "📦" },
    { key: "orders", label: "Orders", icon: "📋" },
    { key: "analytics", label: "Analytics", icon: "📈" },
  ]
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 30, padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(4,10,15,0.9)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${EMERALD}10` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontWeight: 300, fontSize: 14, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif" }}>Dalxic</span>
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif", background: `linear-gradient(135deg, ${TRADE_COL}, #FBBF24)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Trade</span>
        <span style={{ fontSize: 11, color: "#3A6B5A", marginLeft: 8, fontFamily: "'DM Mono', monospace" }}>{storeName}</span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setScreen(t.key)}
            style={{
              padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
              background: screen === t.key ? `${EMERALD}15` : "transparent",
              color: screen === t.key ? EMERALD_L : "#6B9B8A",
              border: screen === t.key ? `1px solid ${EMERALD}25` : "1px solid transparent",
            }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            <span className="hidden-mobile">{t.label}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: `${EMERALD}08`, border: `1px solid ${EMERALD}15` }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: EMERALD, display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: EMERALD, fontFamily: "'DM Sans', sans-serif" }}>Online</span>
        </div>
      </div>
    </div>
  )
}

/* ── Dashboard Screen ── */
function DashboardScreen({ products, setScreen }: { products: Product[]; setScreen: (s: Screen) => void }) {
  const totalStock = products.reduce((a, p) => a + p.stock, 0)
  const totalValue = products.reduce((a, p) => a + p.stock * p.price, 0)
  const categories = [...new Set(products.map(p => p.category))]
  const lowStock = products.filter(p => p.stock < 10)
  const expiring = products.filter(p => p.expiresAt && new Date(p.expiresAt) < new Date(Date.now() + 30 * 86400000))

  const stats = [
    { label: "Total Products", value: products.length.toString(), color: EMERALD },
    { label: "Total Stock Units", value: totalStock.toLocaleString(), color: EMERALD_L },
    { label: "Inventory Value", value: `GHS ${totalValue.toLocaleString()}`, color: TRADE_COL },
    { label: "Categories", value: categories.length.toString(), color: "#0EA5E9" },
  ]

  return (
    <div style={{ padding: "28px 28px 60px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Overview of your store operations</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...glass, padding: "22px 20px" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Quick Actions */}
        <div style={{ ...glass, padding: "24px 22px" }}>
          <div style={{ ...labelStyle, marginBottom: 16 }}>Quick Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Open Point Of Sale", icon: "💳", screen: "pos" as Screen, color: EMERALD },
              { label: "Manage Inventory", icon: "📦", screen: "inventory" as Screen, color: TRADE_COL },
              { label: "View Analytics", icon: "📈", screen: "analytics" as Screen, color: "#0EA5E9" },
            ].map(a => (
              <button key={a.label} onClick={() => setScreen(a.screen)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: `${a.color}08`, border: `1px solid ${a.color}15`, cursor: "pointer", textAlign: "left", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#ECF5F0" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${a.color}40`; e.currentTarget.style.background = `${a.color}12` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${a.color}15`; e.currentTarget.style.background = `${a.color}08` }}>
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div style={{ ...glass, padding: "24px 22px" }}>
          <div style={{ ...labelStyle, marginBottom: 16 }}>Alerts</div>
          {lowStock.length > 0 && (
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#EF4444", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Low Stock ({lowStock.length} Items)</div>
              {lowStock.slice(0, 3).map(p => (
                <div key={p.id} style={{ fontSize: 12, color: "#6B9B8A", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>{p.name} — {p.stock} {p.unit}s left</div>
              ))}
            </div>
          )}
          {expiring.length > 0 && (
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TRADE_COL, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Expiring Soon ({expiring.length} Items)</div>
              {expiring.slice(0, 3).map(p => (
                <div key={p.id} style={{ fontSize: 12, color: "#6B9B8A", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>{p.name} — {p.expiresAt}</div>
              ))}
            </div>
          )}
          {lowStock.length === 0 && expiring.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#3A6B5A", fontSize: 13 }}>All clear. No alerts.</div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── POS Screen ── */
function POSScreen({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [selectedCat, setSelectedCat] = useState("All")

  const categories = ["All", ...new Set(products.map(p => p.category))]
  const filtered = products.filter(p => {
    const matchCat = selectedCat === "All" || p.category === selectedCat
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id)
      if (existing) return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { product, qty: 1 }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0))
  }

  const total = cart.reduce((a, c) => a + c.product.price * c.qty, 0)
  const itemCount = cart.reduce((a, c) => a + c.qty, 0)

  return (
    <div style={{ display: "flex", height: "calc(100vh - 56px)" }}>
      {/* Product grid */}
      <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, maxWidth: 260 }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.map(c => (
              <button key={c} onClick={() => setSelectedCat(c)}
                style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", border: "none",
                  background: selectedCat === c ? `${EMERALD}20` : "rgba(255,255,255,0.03)",
                  color: selectedCat === c ? EMERALD_L : "#6B9B8A",
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {filtered.map(p => (
            <button key={p.id} onClick={() => addToCart(p)}
              style={{ ...glass, padding: "18px 14px", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${EMERALD}30` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.08)" }}>
              {/* Photo placeholder */}
              <div style={{ width: "100%", height: 80, borderRadius: 10, background: p.photo ? `url(${p.photo}) center/cover` : `${EMERALD}06`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, border: `1px solid ${EMERALD}08` }}>
                {!p.photo && <span style={{ fontSize: 28, opacity: 0.3 }}>{p.category === "Clothing" ? "👕" : p.category === "Electronics" ? "📱" : p.category === "Groceries" ? "🍚" : p.category === "Fresh" ? "🐟" : "📦"}</span>}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#ECF5F0", marginBottom: 4, fontFamily: "'DM Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: TRADE_COL, fontFamily: "'Space Grotesk', sans-serif" }}>GHS {p.price}</span>
                <span style={{ fontSize: 10, color: p.stock < 10 ? "#EF4444" : "#3A6B5A", fontFamily: "'DM Mono', monospace" }}>{p.stock} left</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart sidebar */}
      <div style={{ width: 320, borderLeft: `1px solid ${EMERALD}10`, background: "rgba(4,10,15,0.5)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${EMERALD}08` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#ECF5F0", fontFamily: "'Space Grotesk', sans-serif" }}>Cart <span style={{ color: "#6B9B8A", fontWeight: 500 }}>({itemCount})</span></div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#3A6B5A", fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🛒</div>
              Tap Products To Add
            </div>
          ) : cart.map(c => (
            <div key={c.product.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${EMERALD}06` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#ECF5F0", fontFamily: "'DM Sans', sans-serif" }}>{c.product.name}</div>
                <div style={{ fontSize: 11, color: "#6B9B8A", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>GHS {c.product.price} x {c.qty}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => updateQty(c.product.id, -1)} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${EMERALD}20`, background: "transparent", color: "#6B9B8A", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#ECF5F0", fontFamily: "'DM Mono', monospace", minWidth: 20, textAlign: "center" }}>{c.qty}</span>
                <button onClick={() => updateQty(c.product.id, 1)} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${EMERALD}20`, background: "transparent", color: "#6B9B8A", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TRADE_COL, fontFamily: "'Space Grotesk', sans-serif", minWidth: 60, textAlign: "right" }}>GHS {(c.product.price * c.qty).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${EMERALD}10` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#ECF5F0", fontFamily: "'Space Grotesk', sans-serif" }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: TRADE_COL, fontFamily: "'Space Grotesk', sans-serif" }}>GHS {total.toLocaleString()}</span>
          </div>
          <button style={{ ...btnPrimary, width: "100%", padding: "14px 0", fontSize: 13, textAlign: "center" }} disabled={cart.length === 0}>
            Charge Customer
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Inventory Screen ── */
function InventoryScreen({ products, setProducts, categories, onAddCategory }: { products: Product[]; setProducts: (p: Product[]) => void; categories: string[]; onAddCategory: (c: string) => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState("All")
  const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "", category: "", unit: "piece", expiresAt: "", batchNo: "" })
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState("")

  const handlePhoto = useCallback(() => {
    fileRef.current?.click()
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const addCategory = () => {
    if (!newCatName.trim()) return
    onAddCategory(newCatName.trim())
    setNewProduct(p => ({ ...p, category: newCatName.trim() }))
    setNewCatName("")
    setShowNewCat(false)
  }

  const addProduct = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) return
    const p: Product = {
      id: `p${Date.now()}`,
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock),
      category: newProduct.category || "General",
      unit: newProduct.unit || "piece",
      photo: photoPreview || undefined,
      expiresAt: newProduct.expiresAt || undefined,
      batchNo: newProduct.batchNo || undefined,
    }
    setProducts([p, ...products])
    setNewProduct({ name: "", price: "", stock: "", category: "", unit: "piece", expiresAt: "", batchNo: "" })
    setPhotoPreview(null)
    setShowAdd(false)
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === "All" || p.category === filterCat
    return matchSearch && matchCat
  })

  return (
    <div style={{ padding: "28px 28px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>Inventory</h1>
          <p style={{ fontSize: 13, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{products.length} products in catalogue</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: 220 }} />
          <button onClick={() => setShowAdd(!showAdd)} style={btnPrimary}>
            {showAdd ? "Cancel" : "+ Add Product"}
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {["All", ...categories].map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
              background: filterCat === c ? `${EMERALD}20` : "rgba(255,255,255,0.03)", color: filterCat === c ? EMERALD_L : "#6B9B8A" }}>
            {c}
          </button>
        ))}
      </div>

      {/* Add product form */}
      {showAdd && (
        <div style={{ ...glass, padding: "24px 22px", marginBottom: 20, animation: "fadeUp 0.3s ease" }}>
          <div style={{ ...labelStyle, marginBottom: 14, color: EMERALD }}>New Product</div>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 16 }}>
            {/* Photo capture */}
            <div>
              <button onClick={handlePhoto}
                style={{ width: 120, height: 120, borderRadius: 14, border: `2px dashed ${EMERALD}30`, background: photoPreview ? `url(${photoPreview}) center/cover` : `${EMERALD}06`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = EMERALD }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${EMERALD}30` }}>
                {!photoPreview && (
                  <>
                    <span style={{ fontSize: 28 }}>📷</span>
                    <span style={{ fontSize: 10, color: "#6B9B8A", fontFamily: "'DM Sans', sans-serif" }}>Tap To Add Photo</span>
                  </>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={onFileChange} />
            </div>
            {/* Fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Product Name *</label>
                <input style={inputStyle} placeholder="e.g. Samsung Galaxy A15" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                {showNewCat ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input style={{ ...inputStyle, flex: 1 }} placeholder="New category name" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === "Enter" && addCategory()} autoFocus />
                    <button onClick={addCategory} style={{ padding: "8px 12px", borderRadius: 8, fontSize: 10, fontWeight: 700, background: EMERALD, color: "#fff", border: "none", cursor: "pointer" }}>Add</button>
                    <button onClick={() => setShowNewCat(false)} style={{ padding: "8px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, background: "rgba(255,255,255,0.04)", color: "#6B9B8A", border: `1px solid ${EMERALD}12`, cursor: "pointer" }}>Back</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <select style={{ ...inputStyle, flex: 1, appearance: "auto" }} value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={() => setShowNewCat(true)} style={{ padding: "8px 12px", borderRadius: 8, fontSize: 10, fontWeight: 700, background: `${EMERALD}12`, color: EMERALD_L, border: `1px solid ${EMERALD}20`, cursor: "pointer", whiteSpace: "nowrap" }}>+ New</button>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Price (GHS) *</label>
                <input style={inputStyle} type="number" placeholder="0.00" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Stock Qty *</label>
                <input style={inputStyle} type="number" placeholder="0" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Unit</label>
                <select style={{ ...inputStyle, appearance: "auto" }} value={newProduct.unit} onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))}>
                  {["piece", "kg", "bag", "bottle", "pack", "set", "bundle", "box", "carton"].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Expiry Date <span style={{ color: "#3A6B5A" }}>(Optional)</span></label>
                <input style={inputStyle} type="date" value={newProduct.expiresAt} onChange={e => setNewProduct(p => ({ ...p, expiresAt: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Batch No. <span style={{ color: "#3A6B5A" }}>(Optional)</span></label>
                <input style={inputStyle} placeholder="e.g. B-2026-441" value={newProduct.batchNo} onChange={e => setNewProduct(p => ({ ...p, batchNo: e.target.value }))} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button onClick={addProduct} style={btnPrimary}>Add Product</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product table */}
      <div style={{ ...glass, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${EMERALD}10` }}>
              {["", "Product", "SKU", "Category", "Price", "Stock", "Batch", "Expiry", ""].map((h, i) => (
                <th key={i} style={{ padding: "12px 14px", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A6B5A" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${EMERALD}06`, transition: "background 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = `${EMERALD}04` }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}>
                <td style={{ padding: "10px 14px", width: 44 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: p.photo ? `url(${p.photo}) center/cover` : `${EMERALD}08`, border: `1px solid ${EMERALD}08`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {!p.photo && <span style={{ fontSize: 14, opacity: 0.4 }}>📦</span>}
                  </div>
                </td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#ECF5F0" }}>{p.name}</td>
                <td style={{ padding: "10px 14px", fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B9B8A" }}>{p.sku || "—"}</td>
                <td style={{ padding: "10px 14px", color: "#6B9B8A" }}>{p.category}</td>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: TRADE_COL, fontFamily: "'Space Grotesk', sans-serif" }}>GHS {p.price}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace", background: p.stock < 10 ? "rgba(239,68,68,0.1)" : `${EMERALD}08`, color: p.stock < 10 ? "#EF4444" : EMERALD_L }}>
                    {p.stock} {p.unit}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: "#6B9B8A", fontFamily: "'DM Mono', monospace" }}>{p.batchNo || "—"}</td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: p.expiresAt && new Date(p.expiresAt) < new Date(Date.now() + 30 * 86400000) ? TRADE_COL : "#6B9B8A", fontFamily: "'DM Mono', monospace" }}>{p.expiresAt || "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <button style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, border: `1px solid ${EMERALD}15`, background: "transparent", color: "#6B9B8A", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Demo Orders ── */
interface Order {
  id: string
  date: string
  items: { name: string; qty: number; price: number }[]
  total: number
  method: "Cash" | "Mobile Money" | "Card" | "Credit"
  status: "completed" | "refunded" | "pending"
  customer?: string
}

const DEMO_ORDERS: Order[] = [
  { id: "ORD-001", date: "2026-04-13 09:14", items: [{ name: "Rice (50kg Bag)", qty: 2, price: 450 }, { name: "Cooking Oil (5L)", qty: 3, price: 85 }], total: 1155, method: "Mobile Money", status: "completed", customer: "Kwame Asante" },
  { id: "ORD-002", date: "2026-04-13 10:32", items: [{ name: "Samsung Galaxy A15", qty: 1, price: 1200 }, { name: "Phone Charger (USB-C)", qty: 2, price: 35 }], total: 1270, method: "Card", status: "completed" },
  { id: "ORD-003", date: "2026-04-13 11:05", items: [{ name: "Cement (Dangote 50kg)", qty: 10, price: 72 }], total: 720, method: "Cash", status: "completed", customer: "Yaw Boateng Construction" },
  { id: "ORD-004", date: "2026-04-13 12:18", items: [{ name: "Ladies Ankara Dress", qty: 3, price: 180 }, { name: "Hair Extensions (Bundle)", qty: 1, price: 250 }], total: 790, method: "Mobile Money", status: "completed", customer: "Ama Serwaa" },
  { id: "ORD-005", date: "2026-04-12 08:45", items: [{ name: "School Exercise Book (Set)", qty: 20, price: 12 }], total: 240, method: "Cash", status: "completed", customer: "St. Mary's Academy" },
  { id: "ORD-006", date: "2026-04-12 14:22", items: [{ name: "Plastic Chairs (Nesta)", qty: 8, price: 95 }], total: 760, method: "Credit", status: "pending", customer: "Grace Events" },
  { id: "ORD-007", date: "2026-04-12 16:01", items: [{ name: "Fresh Tilapia (1kg)", qty: 5, price: 55 }, { name: "Cooking Oil (5L)", qty: 1, price: 85 }], total: 360, method: "Cash", status: "completed" },
  { id: "ORD-008", date: "2026-04-11 09:30", items: [{ name: "Mens T-Shirt (Black)", qty: 5, price: 65 }], total: 325, method: "Mobile Money", status: "refunded" },
  { id: "ORD-009", date: "2026-04-11 13:15", items: [{ name: "Paracetamol (Pack)", qty: 10, price: 8 }, { name: "Rice (50kg Bag)", qty: 1, price: 450 }], total: 530, method: "Cash", status: "completed", customer: "Nana Akufo" },
  { id: "ORD-010", date: "2026-04-10 11:40", items: [{ name: "Samsung Galaxy A15", qty: 2, price: 1200 }], total: 2400, method: "Card", status: "completed", customer: "TechHub Accra" },
]

/* ── Orders Screen ── */
function OrdersScreen() {
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const filtered = DEMO_ORDERS.filter(o => {
    const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) || (o.customer || "").toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || o.status === filterStatus
    return matchSearch && matchStatus
  })

  const todayTotal = DEMO_ORDERS.filter(o => o.date.startsWith("2026-04-13") && o.status === "completed").reduce((a, o) => a + o.total, 0)
  const todayOrders = DEMO_ORDERS.filter(o => o.date.startsWith("2026-04-13")).length
  const pendingCount = DEMO_ORDERS.filter(o => o.status === "pending").length

  const methodColor = (m: string) => m === "Cash" ? EMERALD : m === "Mobile Money" ? "#8B5CF6" : m === "Card" ? "#0EA5E9" : TRADE_COL
  const statusColor = (s: string) => s === "completed" ? EMERALD : s === "refunded" ? "#EF4444" : TRADE_COL

  return (
    <div style={{ padding: "28px 28px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>Order History</h1>
          <p style={{ fontSize: 13, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{DEMO_ORDERS.length} total transactions</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input placeholder="Search order or customer..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: 240 }} />
          <div style={{ display: "flex", gap: 4 }}>
            {["all", "completed", "pending", "refunded"].map(f => (
              <button key={f} onClick={() => setFilterStatus(f)}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif", textTransform: "capitalize",
                  background: filterStatus === f ? `${EMERALD}20` : "rgba(255,255,255,0.03)", color: filterStatus === f ? EMERALD_L : "#6B9B8A" }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 28 }}>
        <div style={{ ...glass, padding: "22px 20px" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: TRADE_COL, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>GHS {todayTotal.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Today&apos;s Revenue</div>
        </div>
        <div style={{ ...glass, padding: "22px 20px" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: EMERALD, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>{todayOrders}</div>
          <div style={{ fontSize: 11, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Today&apos;s Orders</div>
        </div>
        <div style={{ ...glass, padding: "22px 20px" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: pendingCount > 0 ? TRADE_COL : EMERALD, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>{pendingCount}</div>
          <div style={{ fontSize: 11, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Pending</div>
        </div>
      </div>

      {/* Orders table */}
      <div style={{ ...glass, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${EMERALD}10` }}>
              {["Order ID", "Date", "Customer", "Items", "Total", "Payment", "Status"].map((h, i) => (
                <th key={i} style={{ padding: "12px 14px", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A6B5A" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} style={{ borderBottom: `1px solid ${EMERALD}06`, transition: "background 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = `${EMERALD}04` }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: EMERALD_L, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{o.id}</td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: "#6B9B8A", fontFamily: "'DM Mono', monospace" }}>{o.date}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#ECF5F0" }}>{o.customer || "Walk-In"}</td>
                <td style={{ padding: "10px 14px", color: "#6B9B8A", fontSize: 12 }}>
                  {o.items.map((it, i) => <div key={i} style={{ marginBottom: i < o.items.length - 1 ? 2 : 0 }}>{it.name} x{it.qty}</div>)}
                </td>
                <td style={{ padding: "10px 14px", fontWeight: 800, color: TRADE_COL, fontFamily: "'Space Grotesk', sans-serif" }}>GHS {o.total.toLocaleString()}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${methodColor(o.method)}10`, color: methodColor(o.method) }}>{o.method}</span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: `${statusColor(o.status)}12`, color: statusColor(o.status) }}>{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Analytics Screen ── */
function AnalyticsScreen({ products }: { products: Product[] }) {
  const dailySales = [
    { day: "Mon", revenue: 3200, orders: 14 },
    { day: "Tue", revenue: 4100, orders: 18 },
    { day: "Wed", revenue: 2800, orders: 11 },
    { day: "Thu", revenue: 5600, orders: 24 },
    { day: "Fri", revenue: 6900, orders: 31 },
    { day: "Sat", revenue: 8200, orders: 42 },
    { day: "Sun", revenue: 3100, orders: 13 },
  ]

  const topSellers = [
    { name: "Rice (50kg Bag)", sold: 48, revenue: 21600 },
    { name: "Samsung Galaxy A15", sold: 12, revenue: 14400 },
    { name: "Cement (Dangote 50kg)", sold: 85, revenue: 6120 },
    { name: "Ladies Ankara Dress", sold: 34, revenue: 6120 },
    { name: "Cooking Oil (5L)", sold: 67, revenue: 5695 },
  ]

  const categoryBreakdown = [
    { name: "Groceries", percentage: 32, color: EMERALD },
    { name: "Electronics", percentage: 24, color: "#0EA5E9" },
    { name: "Building", percentage: 18, color: TRADE_COL },
    { name: "Clothing", percentage: 14, color: "#8B5CF6" },
    { name: "Household", percentage: 7, color: "#EC4899" },
    { name: "Other", percentage: 5, color: "#6B9B8A" },
  ]

  const maxRevenue = Math.max(...dailySales.map(d => d.revenue))
  const weekTotal = dailySales.reduce((a, d) => a + d.revenue, 0)
  const weekOrders = dailySales.reduce((a, d) => a + d.orders, 0)
  const avgOrder = Math.round(weekTotal / weekOrders)

  return (
    <div style={{ padding: "28px 28px 60px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>Sales Analytics</h1>
        <p style={{ fontSize: 13, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>This week&apos;s performance overview</p>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Week Revenue", value: `GHS ${weekTotal.toLocaleString()}`, color: TRADE_COL },
          { label: "Total Orders", value: weekOrders.toString(), color: EMERALD },
          { label: "Avg Order Value", value: `GHS ${avgOrder}`, color: "#0EA5E9" },
          { label: "Products In Stock", value: products.length.toString(), color: EMERALD_L },
        ].map(s => (
          <div key={s.label} style={{ ...glass, padding: "22px 20px" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6B9B8A", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Daily revenue chart */}
        <div style={{ ...glass, padding: "24px 22px" }}>
          <div style={{ ...labelStyle, marginBottom: 20 }}>Daily Revenue</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180 }}>
            {dailySales.map(d => (
              <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: TRADE_COL, fontFamily: "'DM Mono', monospace" }}>GHS {(d.revenue / 1000).toFixed(1)}k</div>
                <div style={{
                  width: "100%", borderRadius: 6,
                  height: `${(d.revenue / maxRevenue) * 140}px`,
                  background: `linear-gradient(180deg, ${TRADE_COL}, ${EMERALD})`,
                  opacity: 0.8,
                  transition: "height 0.5s ease",
                  animation: "barGrow 0.8s ease",
                }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6B9B8A", fontFamily: "'DM Sans', sans-serif" }}>{d.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div style={{ ...glass, padding: "24px 22px" }}>
          <div style={{ ...labelStyle, marginBottom: 16 }}>Sales By Category</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {categoryBreakdown.map(c => (
              <div key={c.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#ECF5F0", fontFamily: "'DM Sans', sans-serif" }}>{c.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.color, fontFamily: "'DM Mono', monospace" }}>{c.percentage}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.04)" }}>
                  <div style={{ height: "100%", borderRadius: 3, width: `${c.percentage}%`, background: c.color, animation: "barGrow 0.8s ease", opacity: 0.85 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top sellers */}
      <div style={{ ...glass, padding: "24px 22px" }}>
        <div style={{ ...labelStyle, marginBottom: 16 }}>Top Sellers This Week</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
          {topSellers.map((t, i) => (
            <div key={t.name} style={{ padding: "18px 16px", borderRadius: 12, background: `${EMERALD}04`, border: `1px solid ${EMERALD}08` }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: i === 0 ? TRADE_COL : `${EMERALD}40`, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 8 }}>#{i + 1}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#ECF5F0", fontFamily: "'DM Sans', sans-serif", marginBottom: 8, lineHeight: 1.3 }}>{t.name}</div>
              <div style={{ fontSize: 10, color: "#6B9B8A", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{t.sold} units sold</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: TRADE_COL, fontFamily: "'Space Grotesk', sans-serif" }}>GHS {t.revenue.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TRADE APP
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_CATEGORIES = ["Groceries", "Clothing", "Electronics", "Stationery", "Building", "Pharmacy", "Fresh", "Household", "Beauty"]

export default function TradePage() {
  const [screen, setScreen] = useState<Screen>("dashboard")
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS)
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)

  const addCategory = (name: string) => {
    if (!categories.includes(name)) setCategories(prev => [...prev, name])
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans', sans-serif", color: "#ECF5F0" }}>
      <style>{`
        @media (max-width: 900px) { .hidden-mobile { display: none !important; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      <Header screen={screen} setScreen={setScreen} storeName="Demo Store" />
      {screen === "dashboard" && <DashboardScreen products={products} setScreen={setScreen} />}
      {screen === "pos" && <POSScreen products={products} />}
      {screen === "inventory" && <InventoryScreen products={products} setProducts={setProducts} categories={categories} onAddCategory={addCategory} />}
      {screen === "orders" && <OrdersScreen />}
      {screen === "analytics" && <AnalyticsScreen products={products} />}
    </div>
  )
}
