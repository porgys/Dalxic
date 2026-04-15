"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StationGate, OperatorBadge } from "@/components/station-gate";
import { useStationTheme, ThemeToggle, StationThemeProvider, useThemeContext, COPPER, COPPER_LIGHT, BLUE, fontFamily } from "@/hooks/use-station-theme";
import { getPusherClient } from "@/lib/pusher-client";
import { calloutNumber } from "@/lib/voice-callout";
import { useHospitalName } from "@/hooks/use-hospital-name";
import { useHospitalCode } from "@/hooks/use-hospital-code";
import type { OperatorSession } from "@/types";


/* ─── Galaxy Canvas ─── */
function GalaxyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight * 2);
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight * 2; };
    window.addEventListener("resize", resize);
    const stars = Array.from({ length: 420 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.72, vy: (Math.random() - 0.5) * 0.48,
      r: Math.random() < 0.08 ? Math.random() * 2.5 + 1.2 : Math.random() * 1.2 + 0.2,
      baseOpacity: Math.random() * 0.65 + 0.15,
      twinkleSpeed: Math.random() * 0.048 + 0.016,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: [[255,255,255],[255,220,180],[184,115,51],[210,150,80],[14,165,233],[160,200,255],[255,180,120],[120,80,40]][
        Math.random() < 0.08 ? 2 : Math.random() < 0.12 ? 3 : Math.random() < 0.06 ? 4 : Math.random() < 0.05 ? 5 : Math.random() < 0.05 ? 6 : Math.random() < 0.04 ? 7 : Math.floor(Math.random() * 2)
      ],
    }));
    const dust = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 2.0, vy: (Math.random() - 0.5) * 1.2,
      r: Math.random() * 1.0 + 0.2, opacity: Math.random() * 0.25 + 0.05,
      color: Math.random() < 0.5 ? [184,115,51] : Math.random() < 0.6 ? [14,165,233] : Math.random() < 0.5 ? [255,180,120] : [160,200,255] as number[],
    }));
    let t = 0, raf: number;
    function draw() {
      t++;
      ctx!.clearRect(0, 0, W, H);
      stars.forEach((s) => {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
        const flicker = Math.sin(t * s.twinkleSpeed + s.twinkleOffset) * 0.3 + 0.7;
        const opacity = s.baseOpacity * flicker;
        ctx!.beginPath(); ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${opacity})`; ctx!.fill();
        if (s.r > 1.2) {
          const glow = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
          glow.addColorStop(0, `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${opacity * 0.25})`);
          glow.addColorStop(1, "transparent");
          ctx!.fillStyle = glow; ctx!.fillRect(s.x - s.r * 3, s.y - s.r * 3, s.r * 6, s.r * 6);
        }
      });
      dust.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.opacity})`; ctx!.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

/* ─── Workshop Box ─── */
function WorkshopBox({ children, title, icon, delay = 0, className = "" }: {
  children: React.ReactNode; title: string; icon: string; delay?: number; className?: string;
}) {
  const theme = useThemeContext();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: theme.cardBg,
        border: theme.cardBorder,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: theme.copperText, fontFamily: fontFamily.mono }}>{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

/* ─── Types ─── */
interface PrescriptionItem {
  recordId: string;
  patientName: string;
  queueToken: string;
  department: string;
  emergencyFlag: boolean;
  prescriptions: { medication: string; dosage: string; frequency: string; duration: string; dispensed?: boolean; dispensedAt?: string }[];
  allDispensed: boolean;
  createdAt: string;
}

interface CatalogDrug {
  id: string;
  name: string;
  genericName: string | null;
  category: string;
  unit: string;
  defaultPrice: number;
  costPrice: number;
  controlledSubstance: boolean;
  requiresPrescription: boolean;
  minStockThreshold: number;
  isActive: boolean;
  totalStock: number;
  batchCount: number;
  nearestExpiry: string | null;
  daysToExpiry: number | null;
  stockStatus: "OK" | "LOW" | "OUT";
}

interface StockBatch {
  id: string;
  drugCatalogId: string;
  drugName: string;
  genericName: string | null;
  category: string;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  daysToExpiry: number;
  expiryStatus: "OK" | "WARNING" | "CRITICAL" | "EXPIRED";
  quantityReceived: number;
  quantityRemaining: number;
  costPrice: number;
  sellPrice: number;
  supplier: string | null;
  receivedAt: string;
  receivedBy: string;
  status: string;
}

interface RetailSaleItem {
  id: string;
  customerName: string | null;
  customerPhone: string | null;
  items: Array<{ drugCatalogId: string; drugName: string; quantity: number; unitPrice: number; total: number; batchId: string }>;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentStatus: "PENDING" | "PAID" | "CANCELLED";
  paymentMethod: string | null;
  receiptCode: string;
  dispensed: boolean;
  dispensedAt: string | null;
  dispensedBy: string | null;
  soldBy: string;
  createdAt: string;
}

interface CartItem {
  drugCatalogId: string;
  drugName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/* ─── Themed Input (matches Front Desk gold standard) ─── */
function DInput({ label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean }) {
  const t = useThemeContext();
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium font-body mb-1.5" style={{ color: t.textLabel, transition: "color 0.4s ease" }}>
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input
        {...props}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body focus:outline-none focus:ring-2 transition-all duration-300"
        style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText, transition: "background 0.4s ease, border-color 0.4s ease, color 0.4s ease" }}
      />
    </div>
  );
}

/* ─── Themed Select ─── */
function DSelect({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }) {
  const t = useThemeContext();
  return (
    <div>
      {label && <label className="block text-xs font-medium font-body mb-1.5" style={{ color: t.textLabel, transition: "color 0.4s ease" }}>{label}</label>}
      <select
        {...props}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body focus:outline-none focus:ring-2 transition-all duration-300 appearance-none"
        style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText, transition: "background 0.4s ease, border-color 0.4s ease, color 0.4s ease" }}
      >
        <option value="" style={{ background: t.selectOptionBg }}>Select...</option>
        {options.map((o) => <option key={o.value} value={o.value} style={{ background: t.selectOptionBg }}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ─── Styles ─── */
const btnCopper: React.CSSProperties = {
  padding: "10px 20px", borderRadius: 10, cursor: "pointer", border: "none",
  background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, color: "#fff",
  fontWeight: 700, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.06em",
};

/* ─── Helpers ─── */
function expiryColor(days: number | null): string {
  if (days === null) return "#475569";
  if (days <= 0) return "#EF4444";
  if (days <= 30) return "#EF4444";
  if (days <= 90) return "#F59E0B";
  return "#22C55E";
}
function stockColor(status: string): string {
  if (status === "OUT") return "#EF4444";
  if (status === "LOW") return "#F59E0B";
  return "#22C55E";
}

/* ─── Nav items ─── */
const NAV_ITEMS = [
  { id: "prescriptions", icon: "💊", label: "Prescriptions" },
  { id: "retail", icon: "🛒", label: "Retail Counter" },
  { id: "inventory", icon: "📦", label: "Inventory" },
  { id: "reports", icon: "📊", label: "Reports" },
];

const CATEGORIES = ["ANTIBIOTIC", "ANALGESIC", "ANTIHYPERTENSIVE", "ANTIDIABETIC", "ANTIMALARIAL", "VITAMIN", "ANTACID", "ANTIHISTAMINE"];
const UNITS = ["tablet", "capsule", "bottle", "vial", "tube", "sachet", "ampoule"];

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function PharmacyPage() {
  const HOSPITAL_CODE = useHospitalCode();
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Pharmacy" stationIcon="💊" allowedRoles={["pharmacist", "admin", "super_admin"]}>
      {(operator) => <PharmacyContent operator={operator} />}
    </StationGate>
  );
}

function PharmacyContent({ operator }: { operator: OperatorSession }) {
  const HOSPITAL_CODE = useHospitalCode();
  const theme = useStationTheme();
  const HOSPITAL_NAME = useHospitalName(HOSPITAL_CODE, "Korle Bu Teaching Hospital");
  const [activeNav, setActiveNav] = useState("prescriptions");
  const [currentTime, setCurrentTime] = useState(new Date());

  // ═══ Voice ═══
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // ═══ Prescription state ═══
  const [queue, setQueue] = useState<PrescriptionItem[]>([]);
  const [dispensing, setDispensing] = useState<string | null>(null);
  const [counts, setCounts] = useState({ total: 0, pending: 0, dispensed: 0 });
  const [rxView, setRxView] = useState<"pending" | "dispensed">("pending");

  // ═══ Catalog state ═══
  const [catalog, setCatalog] = useState<CatalogDrug[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [showAddDrug, setShowAddDrug] = useState(false);
  const [addDrugForm, setAddDrugForm] = useState({ name: "", genericName: "", category: "ANTIBIOTIC", unit: "tablet", defaultPrice: "", costPrice: "", controlledSubstance: false, requiresPrescription: true, minStockThreshold: "20" });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");

  // ═══ Stock state ═══
  const [inventory, setInventory] = useState<StockBatch[]>([]);
  const [showReceiveStock, setShowReceiveStock] = useState(false);
  const [receiveForm, setReceiveForm] = useState({ drugCatalogId: "", batchNumber: "", expiryDate: "", quantity: "", costPrice: "", sellPrice: "", supplier: "" });
  const [invFilter, setInvFilter] = useState<"all" | "warning" | "critical">("all");
  const [invViewBy, setInvViewBy] = useState<"category" | "az">("category");

  // ═══ Retail state ═══
  const [retailSales, setRetailSales] = useState<RetailSaleItem[]>([]);
  const [retailCounts, setRetailCounts] = useState({ pending: 0, paid: 0, dispensed: 0 });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [retailSearch, setRetailSearch] = useState("");
  const [retailSearchResults, setRetailSearchResults] = useState<CatalogDrug[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [retailDiscount, setRetailDiscount] = useState("");
  const [creatingSale, setCreatingSale] = useState(false);

  // ═══ Reports state ═══
  const [reportStats, setReportStats] = useState<{ totalStockValue: number; expiringCount: number; dispensedToday: number; retailRevenue: number }>({ totalStockValue: 0, expiringCount: 0, dispensedToday: 0, retailRevenue: 0 });
  const [reportView, setReportView] = useState<"workshop" | "list">("workshop");
  const [reportExpandedCat, setReportExpandedCat] = useState<string | null>(null);

  // ═══ Loaders ═══
  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/pharmacy?hospitalCode=${HOSPITAL_CODE}`);
      if (!res.ok) return;
      const data = await res.json();
      setQueue(data.patients);
      setCounts(data.counts);
    } catch { /* retry */ }
  }, []);

  const loadCatalog = useCallback(async () => {
    try {
      const url = `/api/pharmacy/catalog?hospitalCode=${HOSPITAL_CODE}${catalogSearch ? `&search=${encodeURIComponent(catalogSearch)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setCatalog(data.catalog);
    } catch { /* retry */ }
  }, [catalogSearch]);

  const loadInventory = useCallback(async () => {
    try {
      const alert = invFilter === "critical" ? "30" : invFilter === "warning" ? "90" : "";
      const url = `/api/pharmacy/stock?hospitalCode=${HOSPITAL_CODE}${alert ? `&expiryAlert=${alert}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setInventory(data.inventory);
    } catch { /* retry */ }
  }, [invFilter]);

  const loadRetailSales = useCallback(async () => {
    try {
      const res = await fetch(`/api/pharmacy/retail?hospitalCode=${HOSPITAL_CODE}`);
      if (!res.ok) return;
      const data = await res.json();
      setRetailSales(data.sales);
      setRetailCounts(data.counts);
    } catch { /* retry */ }
  }, []);

  const computeReports = useCallback(() => {
    const totalStockValue = inventory.reduce((sum, s) => sum + s.quantityRemaining * s.sellPrice, 0);
    const expiringCount = inventory.filter((s) => s.daysToExpiry <= 30 && s.daysToExpiry > 0).length;
    const dispensedToday = counts.dispensed;
    const retailRevenue = retailSales.filter((s) => s.paymentStatus === "PAID").reduce((sum, s) => sum + s.totalAmount, 0);
    setReportStats({ totalStockValue, expiringCount, dispensedToday, retailRevenue });
  }, [inventory, counts, retailSales]);

  // ═══ Effects ═══
  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 8000);
    const pusher = getPusherClient();
    const ch = pusher?.subscribe(`hospital-${HOSPITAL_CODE}-queue`);
    ch?.bind("patient-added", () => loadQueue());
    // Listen for payment confirmations
    const ch2 = pusher?.subscribe(`hospital-${HOSPITAL_CODE}`);
    ch2?.bind("pharmacy-payment-confirmed", () => loadRetailSales());
    return () => { clearInterval(interval); ch?.unbind_all(); ch2?.unbind_all(); pusher?.unsubscribe(`hospital-${HOSPITAL_CODE}-queue`); pusher?.unsubscribe(`hospital-${HOSPITAL_CODE}`); };
  }, [loadQueue, loadRetailSales]);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);
  useEffect(() => { loadInventory(); }, [loadInventory]);
  useEffect(() => { loadRetailSales(); }, [loadRetailSales]);
  useEffect(() => { computeReports(); }, [computeReports]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ═══ Actions ═══
  const dispenseRx = async (recordId: string) => {
    setDispensing(recordId);
    try {
      const patient = queue.find(q => q.recordId === recordId);
      const res = await fetch("/api/pharmacy/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, recordId, dispensedBy: operator.operatorName }),
      });
      if (res.ok) {
        await loadQueue(); await loadInventory();
        // Voice callout — announce patient to collect medication
        if (voiceEnabled && patient) {
          try {
            await calloutNumber({ token: patient.queueToken, department: "pharmacy", mode: "speech", rate: 0.85, volume: 1 });
            // Repeat once for clarity
            await new Promise(r => setTimeout(r, 1200));
            await calloutNumber({ token: patient.queueToken, department: "pharmacy", mode: "speech", rate: 0.85, volume: 1 });
          } catch { /* voice unavailable */ }
        }
      }
    } catch { /* retry */ }
    finally { setDispensing(null); }
  };

  const addDrug = async () => {
    const res = await fetch("/api/pharmacy/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, ...addDrugForm, defaultPrice: Number(addDrugForm.defaultPrice), costPrice: Number(addDrugForm.costPrice || 0), minStockThreshold: Number(addDrugForm.minStockThreshold || 20), addedBy: operator.operatorName }),
    });
    if (res.ok) { setShowAddDrug(false); setAddDrugForm({ name: "", genericName: "", category: "ANTIBIOTIC", unit: "tablet", defaultPrice: "", costPrice: "", controlledSubstance: false, requiresPrescription: true, minStockThreshold: "20" }); loadCatalog(); }
  };

  const receiveStock = async () => {
    const res = await fetch("/api/pharmacy/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, ...receiveForm, quantity: Number(receiveForm.quantity), costPrice: Number(receiveForm.costPrice || 0), sellPrice: Number(receiveForm.sellPrice || 0), receivedBy: operator.operatorName }),
    });
    if (res.ok) { setShowReceiveStock(false); setReceiveForm({ drugCatalogId: "", batchNumber: "", expiryDate: "", quantity: "", costPrice: "", sellPrice: "", supplier: "" }); loadInventory(); loadCatalog(); }
  };

  const searchRetailDrugs = useCallback(async (q: string) => {
    setRetailSearch(q);
    if (!q.trim()) { setRetailSearchResults([]); return; }
    try {
      const res = await fetch(`/api/pharmacy/catalog?hospitalCode=${HOSPITAL_CODE}&search=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = await res.json();
      setRetailSearchResults(data.catalog.filter((d: CatalogDrug) => d.totalStock > 0));
    } catch { /* ignore */ }
  }, []);

  const addToCart = (drug: CatalogDrug) => {
    const existing = cart.find((c) => c.drugCatalogId === drug.id);
    if (existing) {
      setCart(cart.map((c) => c.drugCatalogId === drug.id ? { ...c, quantity: c.quantity + 1, total: (c.quantity + 1) * c.unitPrice } : c));
    } else {
      setCart([...cart, { drugCatalogId: drug.id, drugName: drug.name, unit: drug.unit, quantity: 1, unitPrice: drug.defaultPrice, total: drug.defaultPrice }]);
    }
    setRetailSearch("");
    setRetailSearchResults([]);
  };

  const updateCartQty = (drugId: string, qty: number) => {
    if (qty <= 0) { setCart(cart.filter((c) => c.drugCatalogId !== drugId)); return; }
    setCart(cart.map((c) => c.drugCatalogId === drugId ? { ...c, quantity: qty, total: qty * c.unitPrice } : c));
  };

  const createRetailSale = async () => {
    if (!cart.length) return;
    setCreatingSale(true);
    const res = await fetch("/api/pharmacy/retail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hospitalCode: HOSPITAL_CODE,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        items: cart.map((c) => ({ drugCatalogId: c.drugCatalogId, quantity: c.quantity })),
        discount: Number(retailDiscount || 0),
        soldBy: operator.operatorName,
      }),
    });
    if (res.ok) {
      setCart([]); setCustomerName(""); setCustomerPhone(""); setRetailDiscount("");
      loadRetailSales();
    }
    setCreatingSale(false);
  };

  const dispenseRetail = async (saleId: string) => {
    await fetch("/api/pharmacy/retail", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, saleId, action: "dispense", operatorId: operator.operatorName }),
    });
    loadRetailSales(); loadInventory();
  };

  const cartSubtotal = cart.reduce((sum, c) => sum + c.total, 0);
  const cartTotal = Math.max(0, cartSubtotal - Number(retailDiscount || 0));
  const pending = queue.filter((q) => !q.allDispensed);
  const dispensedItems = queue.filter((q) => q.allDispensed);

  return (
    <StationThemeProvider theme={theme}>
    <div style={{ minHeight: "100vh", background: theme.pageBg, position: "relative", overflow: "hidden", transition: "background 0.5s ease" }}>
      {/* Background layers */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 55% 35%, ${theme.overlayCopper} 0%, transparent 50%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 80% 50%, ${theme.overlayBlue} 0%, transparent 40%)`, pointerEvents: "none" }} />
      <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: theme.gridOpacity, transition: "opacity 0.5s ease" }} />
      <div style={{ opacity: theme.canvasOpacity, transition: "opacity 0.5s ease" }}><GalaxyCanvas /></div>

      {/* Fixed header */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "16px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: theme.headerBorder, background: theme.headerBg, transition: "background 0.5s ease",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      }}>
        <div onClick={() => window.location.href = "/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh"} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: 300, fontSize: 13, color: theme.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", transition: "color 0.4s ease" }}>Dalxic</span>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: theme.copperText }}>Pharmacy</span>
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <ThemeToggle isDayMode={theme.isDayMode} onToggle={theme.toggle} />
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <button onClick={() => setVoiceEnabled(v => !v)} title={voiceEnabled ? "Voice On" : "Voice Off"}
            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, opacity: voiceEnabled ? 1 : 0.4, transition: "opacity 0.2s" }}>
            {voiceEnabled ? "🔊" : "🔇"}
          </button>
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <OperatorBadge session={operator} onLogout={() => window.location.reload()} />
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <span style={{ fontSize: 13, color: theme.textSecondary, transition: "color 0.4s ease" }}>{HOSPITAL_NAME}</span>
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <time suppressHydrationWarning style={{ fontFamily: fontFamily.mono, fontSize: 12, color: theme.copperText, transition: "color 0.4s ease" }}>
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </time>
        </div>
      </header>

      {/* Main */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 60px" }}>

        {/* Nav pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          {NAV_ITEMS.map((n) => (
            <motion.button
              key={n.id}
              type="button"
              onClick={() => setActiveNav(n.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                background: activeNav === n.id ? "rgba(184,115,51,0.1)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${activeNav === n.id ? COPPER + "40" : "rgba(255,255,255,0.05)"}`,
                color: activeNav === n.id ? "#D4956B" : "#64748B",
                boxShadow: activeNav === n.id ? `0 0 20px ${COPPER}12` : "none",
                cursor: "pointer", transition: "all 0.3s",
                letterSpacing: "0.04em", textTransform: "uppercase",
              }}
            >
              <span>{n.icon}</span>
              {n.label}
              {n.id === "prescriptions" && counts.pending > 0 && (
                <span style={{ background: COPPER, color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 6, marginLeft: 4 }}>{counts.pending}</span>
              )}
              {n.id === "retail" && retailCounts.pending > 0 && (
                <span style={{ background: "#F59E0B", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 6, marginLeft: 4 }}>{retailCounts.pending}</span>
              )}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ═══════════════════════════════════════════ */}
          {/* TAB 1: PRESCRIPTIONS (Hospital Dispensing)  */}
          {/* ═══════════════════════════════════════════ */}
          {activeNav === "prescriptions" && (
            <motion.div key="prescriptions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Pending", value: counts.pending, color: COPPER },
                  { label: "Dispensed Today", value: counts.dispensed, color: "#22C55E" },
                  { label: "Total Patients", value: counts.total, color: BLUE },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    style={{ padding: 20, borderRadius: 16, background: theme.cardBg, border: `1px solid ${stat.color}20`, backdropFilter: "blur(12px)" }}>
                    <p style={{ fontSize: 28, fontWeight: 800, fontFamily: fontFamily.mono, color: stat.color }}>{stat.value}</p>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.textSecondary, marginTop: 4 }}>{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Sub-toggle */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {(["pending", "dispensed"] as const).map((v) => (
                  <button key={v} onClick={() => setRxView(v)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: rxView === v ? `${COPPER}15` : "transparent", border: `1px solid ${rxView === v ? COPPER + "30" : "rgba(255,255,255,0.05)"}`, color: rxView === v ? COPPER_LIGHT : "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{v}</button>
                ))}
              </div>

              {/* Prescription cards */}
              {(rxView === "pending" ? pending : dispensedItems).length === 0 ? (
                <div style={{ textAlign: "center", padding: "64px 0" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: theme.textSecondary }}>{rxView === "pending" ? "No Pending Prescriptions" : "No Dispensed Items Yet"}</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {(rxView === "pending" ? pending : dispensedItems).map((item, i) => (
                    <motion.div key={item.recordId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <WorkshopBox title={`${item.queueToken} — ${item.patientName}`} icon={item.emergencyFlag ? "🚨" : "💊"} delay={0}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {item.prescriptions.map((rx, j) => {
                            // Check stock for this medication
                            const matchedDrug = catalog.find((d) => d.name.toLowerCase() === rx.medication.toLowerCase());
                            return (
                              <div key={j} style={{
                                display: "grid", gridTemplateColumns: "28px 1fr 1fr 1fr 1fr auto", gap: 12, alignItems: "center",
                                padding: "12px 14px", borderRadius: 12,
                                background: theme.navInactiveBg,
                                border: `1px solid rgba(184,115,51,0.1)`,
                              }}>
                                <span style={{ fontSize: 11, fontWeight: 700, width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(184,115,51,0.08)", border: "1px solid rgba(184,115,51,0.15)", color: theme.copperText }}>{j + 1}</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>{rx.medication}</span>
                                <span style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary }}>{rx.dosage}</span>
                                <span style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary }}>{rx.frequency}</span>
                                <span style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary }}>{rx.duration}</span>
                                {matchedDrug ? (
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: `${stockColor(matchedDrug.stockStatus)}12`, color: stockColor(matchedDrug.stockStatus), textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                    {matchedDrug.stockStatus === "OUT" ? "Out Of Stock" : matchedDrug.stockStatus === "LOW" ? `Low (${matchedDrug.totalStock})` : `${matchedDrug.totalStock} In Stock`}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(100,116,139,0.1)", color: theme.textMuted }}>Not In Catalog</span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {rxView === "pending" && (
                          <motion.button
                            whileHover={{ scale: 1.01, boxShadow: `0 8px 40px ${COPPER}30` }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => dispenseRx(item.recordId)}
                            disabled={dispensing === item.recordId}
                            style={{ ...btnCopper, width: "100%", marginTop: 16, padding: "14px 24px", borderRadius: 14, fontSize: 14, opacity: dispensing === item.recordId ? 0.5 : 1, cursor: dispensing === item.recordId ? "wait" : "pointer" }}
                          >
                            {dispensing === item.recordId ? "Dispensing..." : "Dispense — Deduct From Inventory"}
                          </motion.button>
                        )}
                        {rxView === "dispensed" && (
                          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#22C55E", textTransform: "uppercase", letterSpacing: "0.06em" }}>Dispensed</span>
                          </div>
                        )}
                      </WorkshopBox>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* TAB 2: RETAIL COUNTER (Walk-In Sales)       */}
          {/* ═══════════════════════════════════════════ */}
          {activeNav === "retail" && (
            <motion.div key="retail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                {/* Left: Cart Builder */}
                <div style={{ background: theme.cardBg, border: theme.cardBorder, borderRadius: 20, padding: 24, backdropFilter: "blur(12px)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COPPER_LIGHT, marginBottom: 16 }}>New Retail Sale</div>

                  {/* Customer info */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <DInput label="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Optional" />
                    <DInput label="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Optional" />
                  </div>

                  {/* Drug search */}
                  <div style={{ position: "relative", marginBottom: 16 }}>
                    <DInput label="Search Medication" value={retailSearch} onChange={(e) => searchRetailDrugs(e.target.value)} placeholder="Type To Search Catalog..." />
                    {retailSearchResults.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: theme.isDayMode ? "rgba(237,229,219,0.95)" : "rgba(10,10,20,0.95)", border: `1px solid ${theme.divider}`, borderRadius: 12, maxHeight: 200, overflow: "auto", marginTop: 4 }}>
                        {retailSearchResults.map((d) => (
                          <button key={d.id} onClick={() => addToCart(d)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 14px", border: "none", background: "transparent", color: theme.textPrimary, cursor: "pointer", fontSize: 13, fontWeight: 600, textAlign: "left" }}>
                            <span>{d.name} <span style={{ color: theme.textMuted, fontSize: 11 }}>({d.unit})</span></span>
                            <span style={{ color: COPPER_LIGHT, fontFamily: fontFamily.mono, fontSize: 12 }}>GHS {d.defaultPrice.toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cart items */}
                  {cart.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: theme.textMuted, fontSize: 13 }}>Search And Add Medications To Cart</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                      {cart.map((item) => (
                        <div key={item.drugCatalogId} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 12, alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>{item.drugName}</div>
                            <div style={{ fontSize: 11, color: theme.textMuted }}>GHS {item.unitPrice.toFixed(2)} / {item.unit}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button onClick={() => updateCartQty(item.drugCatalogId, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: theme.textSecondary, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>−</button>
                            <span style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary, minWidth: 24, textAlign: "center" }}>{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.drugCatalogId, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: theme.textSecondary, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>+</button>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: COPPER_LIGHT, fontFamily: fontFamily.mono }}>GHS {item.total.toFixed(2)}</span>
                          <button onClick={() => updateCartQty(item.drugCatalogId, 0)} style={{ border: "none", background: "transparent", color: "#EF4444", cursor: "pointer", fontSize: 14 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {cart.length > 0 && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ width: 120 }}>
                          <DInput label="Discount (GHS)" value={retailDiscount} onChange={(e) => setRetailDiscount(e.target.value)} placeholder="0" />
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: COPPER_LIGHT, fontFamily: fontFamily.mono }}>GHS {cartTotal.toFixed(2)}</div>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                        onClick={createRetailSale}
                        disabled={creatingSale}
                        style={{ ...btnCopper, width: "100%", padding: "14px", fontSize: 13, marginTop: 8, opacity: creatingSale ? 0.5 : 1 }}
                      >
                        {creatingSale ? "Creating..." : "Generate Bill — Send To Cashier"}
                      </motion.button>
                    </>
                  )}
                </div>

                {/* Right: Pending Sales / Payment Tracker */}
                <div style={{ background: theme.cardBg, border: theme.cardBorder, borderRadius: 20, padding: 24, backdropFilter: "blur(12px)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COPPER_LIGHT }}>Sales Queue</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>Pending: {retailCounts.pending}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>Paid: {retailCounts.paid}</span>
                    </div>
                  </div>

                  {retailSales.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0", color: theme.textMuted, fontSize: 13 }}>No Sales Today</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 500, overflow: "auto" }}>
                      {retailSales.map((sale) => (
                        <div key={sale.id} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${sale.paymentStatus === "PAID" ? (sale.dispensed ? "rgba(34,197,94,0.2)" : "rgba(14,165,233,0.2)") : sale.paymentStatus === "CANCELLED" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)"}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, fontFamily: fontFamily.mono, color: COPPER_LIGHT }}>{sale.receiptCode}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.06em",
                              background: sale.dispensed ? "rgba(34,197,94,0.1)" : sale.paymentStatus === "PAID" ? "rgba(14,165,233,0.1)" : sale.paymentStatus === "CANCELLED" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                              color: sale.dispensed ? "#22C55E" : sale.paymentStatus === "PAID" ? BLUE : sale.paymentStatus === "CANCELLED" ? "#EF4444" : "#F59E0B",
                            }}>
                              {sale.dispensed ? "Dispensed" : sale.paymentStatus === "PAID" ? "Payment Confirmed" : sale.paymentStatus === "CANCELLED" ? "Cancelled" : "Awaiting Payment"}
                            </span>
                          </div>

                          {sale.customerName && <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>{sale.customerName}</div>}

                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                            {sale.items.map((item, idx) => (
                              <span key={idx} style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(184,115,51,0.06)", border: "1px solid rgba(184,115,51,0.12)", color: theme.textSecondary }}>
                                {item.drugName} × {item.quantity}
                              </span>
                            ))}
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 16, fontWeight: 800, fontFamily: fontFamily.mono, color: theme.textPrimary }}>GHS {sale.totalAmount.toFixed(2)}</span>

                            {/* Payment gate: dispense only if PAID */}
                            {sale.paymentStatus === "PAID" && !sale.dispensed && (
                              <motion.button
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => dispenseRetail(sale.id)}
                                style={{ padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer", background: "rgba(34,197,94,0.12)", color: "#22C55E", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                                Dispense Now
                              </motion.button>
                            )}

                            {sale.paymentStatus === "PENDING" && (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.5 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Awaiting Payment</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* TAB 3: INVENTORY                            */}
          {/* ═══════════════════════════════════════════ */}
          {activeNav === "inventory" && (
            <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Top bar: actions + filter + view toggle */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAddDrug(true)}
                    style={{ ...btnCopper, fontSize: 11, padding: "8px 16px" }}>+ Add Drug To Catalog</motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowReceiveStock(true)}
                    style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", background: `${BLUE}12`, border: `1px solid ${BLUE}25`, color: BLUE, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>+ Receive Stock</motion.button>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {/* View By toggle */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: theme.textMuted }}>View By</span>
                    {(["category", "az"] as const).map((v) => (
                      <button key={v} onClick={() => setInvViewBy(v)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: "pointer", background: invViewBy === v ? `${COPPER}15` : "transparent", border: `1px solid ${invViewBy === v ? COPPER + "30" : "rgba(255,255,255,0.05)"}`, color: invViewBy === v ? COPPER_LIGHT : "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {v === "category" ? "Category" : "A — Z"}
                      </button>
                    ))}
                  </div>
                  <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.06)" }} />
                  {/* Expiry filter */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["all", "warning", "critical"] as const).map((f) => (
                      <button key={f} onClick={() => setInvFilter(f)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: "pointer", background: invFilter === f ? `${f === "critical" ? "#EF4444" : f === "warning" ? "#F59E0B" : COPPER}15` : "transparent", border: `1px solid ${invFilter === f ? (f === "critical" ? "#EF444430" : f === "warning" ? "#F59E0B30" : COPPER + "30") : "rgba(255,255,255,0.05)"}`, color: invFilter === f ? (f === "critical" ? "#EF4444" : f === "warning" ? "#F59E0B" : COPPER_LIGHT) : "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {f === "all" ? "All" : f === "warning" ? "90d" : "30d"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Catalog search */}
              <div style={{ marginBottom: 20, maxWidth: 400 }}>
                <DInput value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} placeholder="Search Drug Catalog..." />
              </div>

              {/* ═══ CATEGORY VIEW ═══ */}
              {invViewBy === "category" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 28, marginBottom: 32 }}>
                  {(() => {
                    const grouped = new Map<string, CatalogDrug[]>();
                    catalog.forEach((d) => {
                      const arr = grouped.get(d.category) || [];
                      arr.push(d);
                      grouped.set(d.category, arr);
                    });
                    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([cat, drugs]) => {
                      const catStock = drugs.reduce((s, d) => s + d.totalStock, 0);
                      const catValue = drugs.reduce((s, d) => s + d.totalStock * d.defaultPrice, 0);
                      return (
                        <motion.div key={cat} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                          {/* Category header */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "12px 18px", borderRadius: 14, background: `${COPPER}06`, border: `1px solid ${COPPER}15` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: COPPER_LIGHT }}>{cat}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted }}>{drugs.length} {drugs.length === 1 ? "Drug" : "Drugs"}</span>
                            </div>
                            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: fontFamily.mono, color: theme.textSecondary }}>{catStock} Units</span>
                              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: fontFamily.mono, color: COPPER_LIGHT }}>GHS {catValue.toFixed(2)}</span>
                            </div>
                          </div>
                          {/* Drug cards in this category */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                            {drugs.map((drug, i) => (
                              <motion.div key={drug.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                                style={{ padding: "18px 20px", borderRadius: 16, background: theme.cardBg, border: `1px solid ${stockColor(drug.stockStatus)}15`, backdropFilter: "blur(12px)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                  <div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: theme.textPrimary, transition: "color 0.4s ease" }}>{drug.name}</div>
                                    {drug.genericName && <div style={{ fontSize: 11, color: theme.textMuted, fontStyle: "italic" }}>{drug.genericName}</div>}
                                  </div>
                                  <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: `${stockColor(drug.stockStatus)}12`, color: stockColor(drug.stockStatus), textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                    {drug.stockStatus === "OUT" ? "Out" : drug.stockStatus === "LOW" ? "Low" : "OK"}
                                  </span>
                                </div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: theme.textSecondary }}>{drug.unit}</span>
                                  {drug.controlledSubstance && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "rgba(239,68,68,0.08)", color: "#EF4444" }}>Controlled</span>}
                                  {drug.requiresPrescription && <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.12)", color: theme.textMuted }}>Rx</span>}
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                                  <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: stockColor(drug.stockStatus), fontFamily: fontFamily.mono }}>{drug.totalStock}</div>
                                    <div style={{ fontSize: 9, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>In Stock</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: COPPER_LIGHT, fontFamily: fontFamily.mono }}>{drug.batchCount}</div>
                                    <div style={{ fontSize: 9, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Batches</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: expiryColor(drug.daysToExpiry), fontFamily: fontFamily.mono }}>
                                      {drug.daysToExpiry !== null ? `${drug.daysToExpiry}d` : "—"}
                                    </div>
                                    <div style={{ fontSize: 9, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Expiry</div>
                                  </div>
                                </div>
                                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: theme.textPrimary, fontFamily: fontFamily.mono, transition: "color 0.4s ease" }}>
                                  GHS {drug.defaultPrice.toFixed(2)} <span style={{ fontSize: 10, color: theme.textMuted, fontWeight: 500 }}>/ {drug.unit}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              ) : (
                /* ═══ A-Z VIEW ═══ */
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 32 }}>
                  {[...catalog].sort((a, b) => a.name.localeCompare(b.name)).map((drug, i) => (
                    <motion.div key={drug.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                      style={{ padding: "18px 20px", borderRadius: 16, background: theme.cardBg, border: `1px solid ${stockColor(drug.stockStatus)}15`, backdropFilter: "blur(12px)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: theme.textPrimary, transition: "color 0.4s ease" }}>{drug.name}</div>
                          {drug.genericName && <div style={{ fontSize: 11, color: theme.textMuted, fontStyle: "italic" }}>{drug.genericName}</div>}
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: `${stockColor(drug.stockStatus)}12`, color: stockColor(drug.stockStatus), textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {drug.stockStatus === "OUT" ? "Out" : drug.stockStatus === "LOW" ? "Low" : "OK"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: theme.textSecondary }}>{drug.category}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: theme.textSecondary }}>{drug.unit}</span>
                        {drug.controlledSubstance && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "rgba(239,68,68,0.08)", color: "#EF4444" }}>Controlled</span>}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: stockColor(drug.stockStatus), fontFamily: fontFamily.mono }}>{drug.totalStock}</div>
                          <div style={{ fontSize: 9, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>In Stock</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: COPPER_LIGHT, fontFamily: fontFamily.mono }}>{drug.batchCount}</div>
                          <div style={{ fontSize: 9, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Batches</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: expiryColor(drug.daysToExpiry), fontFamily: fontFamily.mono }}>
                            {drug.daysToExpiry !== null ? `${drug.daysToExpiry}d` : "—"}
                          </div>
                          <div style={{ fontSize: 9, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Expiry</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: theme.textPrimary, fontFamily: fontFamily.mono, transition: "color 0.4s ease" }}>
                        GHS {drug.defaultPrice.toFixed(2)} <span style={{ fontSize: 10, color: theme.textMuted, fontWeight: 500 }}>/ {drug.unit}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {catalog.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px 0", color: theme.textMuted }}>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>No Drugs In Catalog</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Add Medications To Get Started</p>
                </div>
              )}

              {/* Stock batches table */}
              {inventory.length > 0 && (
                <div style={{ background: theme.cardBg, border: theme.cardBorder, borderRadius: 20, padding: 24, backdropFilter: "blur(12px)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COPPER_LIGHT, marginBottom: 16 }}>Stock Batches ({inventory.length})</div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 8, padding: "8px 12px", fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span>Drug</span><span>Batch</span><span>Qty</span><span>Price</span><span>Expiry</span><span>Status</span>
                  </div>
                  <div style={{ maxHeight: 400, overflow: "auto" }}>
                    {inventory.map((s) => (
                      <div key={s.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 8, padding: "10px 12px", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary, transition: "color 0.4s ease" }}>{s.drugName}</span>
                        <span style={{ fontSize: 11, fontFamily: fontFamily.mono, color: theme.textSecondary }}>{s.batchNumber}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: s.quantityRemaining === 0 ? "#EF4444" : theme.textPrimary }}>{s.quantityRemaining} / {s.quantityReceived}</span>
                        <span style={{ fontSize: 12, fontFamily: fontFamily.mono, color: COPPER_LIGHT }}>GHS {s.sellPrice.toFixed(2)}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: expiryColor(s.daysToExpiry), boxShadow: s.daysToExpiry <= 30 ? `0 0 6px ${expiryColor(s.daysToExpiry)}` : "none" }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: expiryColor(s.daysToExpiry) }}>{s.daysToExpiry}d</span>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: s.expiryStatus === "EXPIRED" ? "#EF4444" : s.expiryStatus === "CRITICAL" ? "#EF4444" : s.expiryStatus === "WARNING" ? "#F59E0B" : "#22C55E", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.expiryStatus}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ Add Drug Modal ═══ */}
              <AnimatePresence>
                {showAddDrug && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
                    onClick={() => setShowAddDrug(false)}>
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ background: "rgba(15,15,25,0.98)", border: `1px solid ${COPPER}20`, borderRadius: 24, padding: 32, width: 480 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COPPER_LIGHT, marginBottom: 20 }}>Add Drug To Catalog</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <DInput label="Drug Name" value={addDrugForm.name} onChange={(e) => setAddDrugForm({ ...addDrugForm, name: e.target.value })} placeholder="e.g. Amoxicillin 500mg" required />
                        <DInput label="Generic Name" value={addDrugForm.genericName} onChange={(e) => setAddDrugForm({ ...addDrugForm, genericName: e.target.value })} placeholder="Optional" />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <DSelect label="Category" value={addDrugForm.category} onChange={(e) => {
                            if (e.target.value === "__other__") {
                              setShowCustomCategory(true);
                              setCustomCategoryName("");
                            } else {
                              setAddDrugForm({ ...addDrugForm, category: e.target.value });
                            }
                          }} options={[
                            ...CATEGORIES.map((c) => ({ value: c, label: c })),
                            ...(addDrugForm.category && !CATEGORIES.includes(addDrugForm.category)
                              ? [{ value: addDrugForm.category, label: `✦ ${addDrugForm.category}` }] : []),
                            { value: "__other__", label: "Other..." },
                          ]} />
                          <DSelect label="Unit" value={addDrugForm.unit} onChange={(e) => setAddDrugForm({ ...addDrugForm, unit: e.target.value })} options={UNITS.map((u) => ({ value: u, label: u }))} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                          <DInput label="Sell Price (GHS)" type="number" value={addDrugForm.defaultPrice} onChange={(e) => setAddDrugForm({ ...addDrugForm, defaultPrice: e.target.value })} required />
                          <DInput label="Cost Price (GHS)" type="number" value={addDrugForm.costPrice} onChange={(e) => setAddDrugForm({ ...addDrugForm, costPrice: e.target.value })} />
                          <DInput label="Min Stock Alert" type="number" value={addDrugForm.minStockThreshold} onChange={(e) => setAddDrugForm({ ...addDrugForm, minStockThreshold: e.target.value })} />
                        </div>
                        <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: theme.textSecondary, cursor: "pointer" }}>
                            <input type="checkbox" checked={addDrugForm.controlledSubstance} onChange={(e) => setAddDrugForm({ ...addDrugForm, controlledSubstance: e.target.checked })} />
                            Controlled Substance
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: theme.textSecondary, cursor: "pointer" }}>
                            <input type="checkbox" checked={addDrugForm.requiresPrescription} onChange={(e) => setAddDrugForm({ ...addDrugForm, requiresPrescription: e.target.checked })} />
                            Requires Prescription
                          </label>
                        </div>
                        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={addDrug}
                            style={btnCopper}>Add To Catalog</motion.button>
                          <button onClick={() => setShowAddDrug(false)}
                            style={{ padding: "10px 20px", borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: theme.textSecondary, fontWeight: 700, fontSize: 12 }}>Cancel</button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ═══ Custom Category Modal ═══ */}
              <AnimatePresence>
                {showCustomCategory && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}
                    onClick={() => setShowCustomCategory(false)}>
                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ background: "rgba(12,8,18,0.95)", border: `1px solid ${COPPER}30`, borderRadius: 20, padding: 24, width: 400, boxShadow: `0 24px 80px rgba(0,0,0,0.5)` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <span style={{ fontSize: 16 }}>📦</span>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.copperText, fontFamily: fontFamily.mono }}>Custom Drug Category</span>
                      </div>
                      <p style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 14 }}>Enter The Name Of The Drug Category Not Listed In The Dropdown.</p>
                      <DInput label="Category Name" placeholder="e.g. ANTIFUNGAL, ANTIRETROVIRAL, STEROID..."
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value.toUpperCase())}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && customCategoryName.trim()) {
                            setAddDrugForm({ ...addDrugForm, category: customCategoryName.trim() });
                            setShowCustomCategory(false);
                          }
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                        <button onClick={() => setShowCustomCategory(false)}
                          style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, color: theme.textSecondary, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                          Cancel
                        </button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          disabled={!customCategoryName.trim()}
                          onClick={() => {
                            setAddDrugForm({ ...addDrugForm, category: customCategoryName.trim() });
                            setShowCustomCategory(false);
                          }}
                          style={{ padding: "8px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", opacity: !customCategoryName.trim() ? 0.4 : 1 }}>
                          Confirm
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ═══ Receive Stock Modal ═══ */}
              <AnimatePresence>
                {showReceiveStock && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
                    onClick={() => setShowReceiveStock(false)}>
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ background: "rgba(15,15,25,0.98)", border: `1px solid ${BLUE}20`, borderRadius: 24, padding: 32, width: 480 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: BLUE, marginBottom: 20 }}>Receive Stock Batch</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <DSelect label="Drug" value={receiveForm.drugCatalogId} onChange={(e) => setReceiveForm({ ...receiveForm, drugCatalogId: e.target.value })} options={catalog.map((d) => ({ value: d.id, label: `${d.name} (${d.unit})` }))} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <DInput label="Batch Number" value={receiveForm.batchNumber} onChange={(e) => setReceiveForm({ ...receiveForm, batchNumber: e.target.value })} placeholder="e.g. BN-2026-042" required />
                          <DInput label="Expiry Date" type="date" value={receiveForm.expiryDate} onChange={(e) => setReceiveForm({ ...receiveForm, expiryDate: e.target.value })} required />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                          <DInput label="Quantity" type="number" value={receiveForm.quantity} onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })} required />
                          <DInput label="Cost Price" type="number" value={receiveForm.costPrice} onChange={(e) => setReceiveForm({ ...receiveForm, costPrice: e.target.value })} />
                          <DInput label="Sell Price" type="number" value={receiveForm.sellPrice} onChange={(e) => setReceiveForm({ ...receiveForm, sellPrice: e.target.value })} />
                        </div>
                        <DInput label="Supplier" value={receiveForm.supplier} onChange={(e) => setReceiveForm({ ...receiveForm, supplier: e.target.value })} placeholder="e.g. Ernest Chemists" />
                        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={receiveStock}
                            style={{ ...btnCopper, background: `linear-gradient(135deg, ${BLUE}, #38BDF8)` }}>Receive Stock</motion.button>
                          <button onClick={() => setShowReceiveStock(false)}
                            style={{ padding: "10px 20px", borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: theme.textSecondary, fontWeight: 700, fontSize: 12 }}>Cancel</button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* TAB 4: REPORTS                              */}
          {/* ═══════════════════════════════════════════ */}
          {activeNav === "reports" && (
            <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Stats cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
                {[
                  { label: "Total Stock Value", value: `GHS ${reportStats.totalStockValue.toFixed(2)}`, color: COPPER },
                  { label: "Expiring (30 Days)", value: String(reportStats.expiringCount), color: reportStats.expiringCount > 0 ? "#EF4444" : "#22C55E" },
                  { label: "Dispensed Today", value: String(reportStats.dispensedToday), color: BLUE },
                  { label: "Retail Revenue", value: `GHS ${reportStats.retailRevenue.toFixed(2)}`, color: "#22C55E" },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    style={{ padding: 20, borderRadius: 16, background: theme.cardBg, border: `1px solid ${stat.color}20`, backdropFilter: "blur(12px)" }}>
                    <p style={{ fontSize: 22, fontWeight: 800, fontFamily: fontFamily.mono, color: stat.color }}>{stat.value}</p>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.textSecondary, marginTop: 6 }}>{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* View toggle for category breakdown */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COPPER_LIGHT }}>Sales By Category</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: theme.textMuted }}>Display</span>
                  {(["workshop", "list"] as const).map((v) => (
                    <button key={v} onClick={() => setReportView(v)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: "pointer", background: reportView === v ? `${COPPER}15` : "transparent", border: `1px solid ${reportView === v ? COPPER + "30" : "rgba(255,255,255,0.05)"}`, color: reportView === v ? COPPER_LIGHT : "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {v === "workshop" ? "Cards" : "List"}
                    </button>
                  ))}
                </div>
              </div>

              {/* ═══ WORKSHOP (Card) VIEW ═══ */}
              {reportView === "workshop" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 28 }}>
                  {(() => {
                    const byCategory = new Map<string, { drugs: CatalogDrug[]; stock: number; value: number; retailSold: number }>();
                    catalog.forEach((d) => {
                      const cur = byCategory.get(d.category) || { drugs: [], stock: 0, value: 0, retailSold: 0 };
                      cur.drugs.push(d);
                      cur.stock += d.totalStock;
                      cur.value += d.totalStock * d.defaultPrice;
                      byCategory.set(d.category, cur);
                    });
                    // Count retail sales per category
                    retailSales.filter((s) => s.paymentStatus === "PAID").forEach((sale) => {
                      sale.items.forEach((item) => {
                        const drug = catalog.find((d) => d.id === item.drugCatalogId);
                        if (drug) {
                          const cur = byCategory.get(drug.category);
                          if (cur) cur.retailSold += item.total;
                        }
                      });
                    });
                    return Array.from(byCategory.entries()).sort((a, b) => b[1].value - a[1].value).map(([cat, data]) => {
                      const isExpanded = reportExpandedCat === cat;
                      const lowCount = data.drugs.filter((d) => d.stockStatus === "LOW" || d.stockStatus === "OUT").length;
                      return (
                        <motion.div key={cat} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                          {/* Category workshop card */}
                          <motion.div
                            onClick={() => setReportExpandedCat(isExpanded ? null : cat)}
                            whileHover={{ y: -2 }}
                            style={{ padding: "20px 24px", borderRadius: 20, background: theme.cardBg, border: `1px solid ${COPPER}15`, backdropFilter: "blur(12px)", cursor: "pointer", transition: "border-color 0.3s" }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                              <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: theme.textPrimary, transition: "color 0.4s ease" }}>{cat}</div>
                                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{data.drugs.length} Medications{lowCount > 0 ? ` — ${lowCount} Low/Out` : ""}</div>
                              </div>
                              <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} style={{ fontSize: 14, color: COPPER_LIGHT }}>▾</motion.span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
                              <div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: COPPER_LIGHT, fontFamily: fontFamily.mono }}>{data.stock}</div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>Total Units</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: theme.textPrimary, fontFamily: fontFamily.mono, transition: "color 0.4s ease" }}>GHS {data.value.toFixed(0)}</div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>Stock Value</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: "#22C55E", fontFamily: fontFamily.mono }}>GHS {data.retailSold.toFixed(0)}</div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>Retail Sales</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: lowCount > 0 ? "#F59E0B" : "#22C55E", fontFamily: fontFamily.mono }}>{data.drugs.length - lowCount}/{data.drugs.length}</div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>In Stock</div>
                              </div>
                            </div>
                          </motion.div>

                          {/* Expanded: drug breakdown */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12, paddingLeft: 8, paddingRight: 8 }}>
                                  {data.drugs.sort((a, b) => b.totalStock - a.totalStock).map((drug, i) => (
                                    <motion.div key={drug.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                      style={{ padding: "14px 16px", borderRadius: 14, background: theme.navInactiveBg, border: `1px solid ${stockColor(drug.stockStatus)}12`, transition: "background 0.3s" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary, transition: "color 0.4s ease" }}>{drug.name}</span>
                                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: `${stockColor(drug.stockStatus)}12`, color: stockColor(drug.stockStatus), textTransform: "uppercase" }}>
                                          {drug.stockStatus}
                                        </span>
                                      </div>
                                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                                        <div>
                                          <div style={{ fontSize: 15, fontWeight: 800, color: stockColor(drug.stockStatus), fontFamily: fontFamily.mono }}>{drug.totalStock}</div>
                                          <div style={{ fontSize: 8, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Stock</div>
                                        </div>
                                        <div>
                                          <div style={{ fontSize: 13, fontWeight: 700, color: COPPER_LIGHT, fontFamily: fontFamily.mono }}>GHS {drug.defaultPrice.toFixed(2)}</div>
                                          <div style={{ fontSize: 8, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Price</div>
                                        </div>
                                        <div>
                                          <div style={{ fontSize: 13, fontWeight: 700, color: expiryColor(drug.daysToExpiry), fontFamily: fontFamily.mono }}>{drug.daysToExpiry !== null ? `${drug.daysToExpiry}d` : "—"}</div>
                                          <div style={{ fontSize: 8, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Expiry</div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              ) : (
                /* ═══ LIST VIEW ═══ */
                <div style={{ background: theme.cardBg, border: theme.cardBorder, borderRadius: 20, padding: 24, backdropFilter: "blur(12px)", marginBottom: 28 }}>
                  {(() => {
                    const byCategory = new Map<string, { drugs: CatalogDrug[]; stock: number; value: number; retailSold: number }>();
                    catalog.forEach((d) => {
                      const cur = byCategory.get(d.category) || { drugs: [], stock: 0, value: 0, retailSold: 0 };
                      cur.drugs.push(d);
                      cur.stock += d.totalStock;
                      cur.value += d.totalStock * d.defaultPrice;
                      byCategory.set(d.category, cur);
                    });
                    retailSales.filter((s) => s.paymentStatus === "PAID").forEach((sale) => {
                      sale.items.forEach((item) => {
                        const drug = catalog.find((d) => d.id === item.drugCatalogId);
                        if (drug) {
                          const cur = byCategory.get(drug.category);
                          if (cur) cur.retailSold += item.total;
                        }
                      });
                    });
                    return Array.from(byCategory.entries()).sort((a, b) => b[1].value - a[1].value).map(([cat, data]) => {
                      const isExpanded = reportExpandedCat === cat;
                      return (
                        <div key={cat}>
                          {/* Category row */}
                          <div onClick={() => setReportExpandedCat(isExpanded ? null : cat)}
                            style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: 12, padding: "14px 16px", alignItems: "center", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", borderRadius: isExpanded ? "12px 12px 0 0" : 0, background: isExpanded ? `${COPPER}06` : "transparent", transition: "background 0.2s" }}>
                            <div>
                              <span style={{ fontSize: 14, fontWeight: 800, color: theme.textPrimary, transition: "color 0.4s ease" }}>{cat}</span>
                              <span style={{ fontSize: 11, color: theme.textMuted, marginLeft: 8 }}>{data.drugs.length} drugs</span>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: fontFamily.mono, color: theme.textSecondary }}>{data.stock} units</span>
                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: fontFamily.mono, color: COPPER_LIGHT }}>GHS {data.value.toFixed(0)}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: fontFamily.mono, color: "#22C55E" }}>GHS {data.retailSold.toFixed(0)}</span>
                            <div>
                              {data.drugs.filter((d) => d.stockStatus === "LOW" || d.stockStatus === "OUT").length > 0 && (
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
                                  {data.drugs.filter((d) => d.stockStatus === "LOW" || d.stockStatus === "OUT").length} Alert{data.drugs.filter((d) => d.stockStatus === "LOW" || d.stockStatus === "OUT").length > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                            <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} style={{ fontSize: 12, color: COPPER_LIGHT }}>▾</motion.span>
                          </div>

                          {/* Expanded drug rows */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                                {/* Sub-header */}
                                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px", gap: 12, padding: "6px 16px 6px 32px", fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", background: `${COPPER}04` }}>
                                  <span>Drug</span><span>Stock</span><span>Price</span><span>Value</span><span>Expiry</span><span>Status</span>
                                </div>
                                {data.drugs.sort((a, b) => b.totalStock - a.totalStock).map((drug) => (
                                  <div key={drug.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px", gap: 12, padding: "10px 16px 10px 32px", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.02)", background: `${COPPER}02` }}>
                                    <div>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary, transition: "color 0.4s ease" }}>{drug.name}</span>
                                      {drug.genericName && <span style={{ fontSize: 10, color: theme.textMuted, marginLeft: 6, fontStyle: "italic" }}>{drug.genericName}</span>}
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: fontFamily.mono, color: stockColor(drug.stockStatus) }}>{drug.totalStock}</span>
                                    <span style={{ fontSize: 12, fontFamily: fontFamily.mono, color: COPPER_LIGHT }}>GHS {drug.defaultPrice.toFixed(2)}</span>
                                    <span style={{ fontSize: 12, fontFamily: fontFamily.mono, color: theme.textSecondary }}>GHS {(drug.totalStock * drug.defaultPrice).toFixed(0)}</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: expiryColor(drug.daysToExpiry) }}>{drug.daysToExpiry !== null ? `${drug.daysToExpiry}d` : "—"}</span>
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: `${stockColor(drug.stockStatus)}12`, color: stockColor(drug.stockStatus), textTransform: "uppercase", textAlign: "center" }}>{drug.stockStatus}</span>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    });
                  })()}
                  {/* Column header */}
                  {catalog.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: 12, padding: "8px 16px", fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(255,255,255,0.05)", order: -1, position: "sticky", top: 0 }}>
                      <span>Category</span><span>Units</span><span>Value</span><span>Revenue</span><span>Alerts</span><span />
                    </div>
                  )}
                </div>
              )}

              {/* Low stock alerts panel */}
              <div style={{ background: theme.cardBg, border: theme.cardBorder, borderRadius: 20, padding: 24, backdropFilter: "blur(12px)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COPPER_LIGHT, marginBottom: 16 }}>Low Stock Alerts</div>
                {catalog.filter((d) => d.stockStatus === "LOW" || d.stockStatus === "OUT").length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "#22C55E", fontSize: 13, fontWeight: 600 }}>All Stock Levels Healthy</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {catalog.filter((d) => d.stockStatus === "LOW" || d.stockStatus === "OUT").map((d) => (
                      <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 12, background: `${stockColor(d.stockStatus)}06`, border: `1px solid ${stockColor(d.stockStatus)}15` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: stockColor(d.stockStatus), boxShadow: `0 0 6px ${stockColor(d.stockStatus)}` }} />
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary, transition: "color 0.4s ease" }}>{d.name}</span>
                            <div style={{ fontSize: 10, color: theme.textMuted }}>{d.category}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, fontFamily: fontFamily.mono, color: stockColor(d.stockStatus) }}>
                          {d.totalStock} <span style={{ fontSize: 10, fontWeight: 500, color: theme.textMuted }}>/ {d.minStockThreshold} min</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
    </StationThemeProvider>
  );
}
