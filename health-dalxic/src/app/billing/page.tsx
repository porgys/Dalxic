"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StationGate, OperatorBadge } from "@/components/station-gate";
import { useStationTheme, ThemeToggle, StationThemeProvider, useThemeContext } from "@/hooks/use-station-theme";
import type { OperatorSession } from "@/types";

const HOSPITAL_CODE = "KBH";
const HOSPITAL_NAME = "Korle Bu Teaching Hospital";
const COPPER = "#B87333";

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
      color: [[255,255,255],[255,220,180],[184,115,51],[210,150,80],[14,165,233],[160,200,255]][
        Math.random() < 0.08 ? 2 : Math.random() < 0.12 ? 3 : Math.random() < 0.06 ? 4 : Math.random() < 0.05 ? 5 : Math.floor(Math.random() * 2)
      ],
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
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: theme.cardBg, border: theme.cardBorder, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <h3 className="text-xs font-mono uppercase tracking-wider text-[#D4956B]">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

/* ─── Themed Input ─── */
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

/* ─── Types ─── */
interface BillableItem {
  id: string;
  serviceType: string;
  description: string;
  unitCost: number;
  quantity: number;
  totalCost: number;
  renderedAt: string;
  renderedBy: string;
}

interface Bill {
  id: string;
  billNumber: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  paymentMethod: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  items: BillableItem[];
}

interface DashboardStats {
  todayItemsCount: number;
  todayBillsCount: number;
  todayRevenue: number;
  pendingBillsCount: number;
  pendingAmount: number;
}

const SERVICE_ICONS: Record<string, string> = {
  CONSULTATION: "🩺", LAB: "🧪", IMAGING: "📷", DRUG: "💊",
  WARD_DAY: "🏥", PROCEDURE: "🔬", EMERGENCY: "🚑", ICU_DAY: "❤️",
};

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  DRAFT: { bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)", text: "#94A3B8" },
  ISSUED: { bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)", text: "#38BDF8" },
  PART_PAID: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#F59E0B" },
  PAID: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", text: "#22C55E" },
  WAIVED: { bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.2)", text: "#A855F7" },
};

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash", icon: "💵" },
  { value: "MOBILE_MONEY", label: "Mobile Money", icon: "📱" },
  { value: "INSURANCE", label: "Insurance", icon: "🏛️" },
  { value: "NHIS", label: "NHIS", icon: "🇬🇭" },
  { value: "WAIVED", label: "Waived", icon: "🤝" },
];

const SERVICE_TYPES = [
  "CONSULTATION", "LAB", "IMAGING", "DRUG", "WARD_DAY", "PROCEDURE", "EMERGENCY", "ICU_DAY",
];

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function BillingStationPage() {
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Billing" stationIcon="💰" allowedRoles={["billing", "admin", "super_admin"]}>
      {(operator) => <BillingContent operator={operator} />}
    </StationGate>
  );
}

function BillingContent({ operator }: { operator: OperatorSession }) {
  const theme = useStationTheme();
  const [activeNav, setActiveNav] = useState<"dashboard" | "patient" | "bills" | "prices">("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Dashboard
  const [stats, setStats] = useState<DashboardStats>({ todayItemsCount: 0, todayBillsCount: 0, todayRevenue: 0, pendingBillsCount: 0, pendingAmount: 0 });

  // Patient billing
  const [patientSearch, setPatientSearch] = useState("");
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [unbilledItems, setUnbilledItems] = useState<BillableItem[]>([]);
  const [unbilledTotal, setUnbilledTotal] = useState(0);
  const [patientBills, setPatientBills] = useState<Bill[]>([]);
  const [discount, setDiscount] = useState(0);
  const [assembling, setAssembling] = useState(false);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Prices
  const [priceForm, setPriceForm] = useState({ serviceType: "CONSULTATION", name: "", unitCost: "" });
  const [savingPrice, setSavingPrice] = useState(false);

  // View toggle for patient section
  const [patientView, setPatientView] = useState<"unbilled" | "history">("unbilled");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/billing?hospitalCode=${HOSPITAL_CODE}`);
      if (res.ok) setStats(await res.json());
    } catch { /* retry */ }
  }, []);

  const loadUnbilled = useCallback(async (patientId: string) => {
    try {
      const res = await fetch(`/api/billing?hospitalCode=${HOSPITAL_CODE}&patientId=${patientId}&view=unbilled`);
      if (res.ok) {
        const data = await res.json();
        setUnbilledItems(data.items || []);
        setUnbilledTotal(data.total || 0);
      }
    } catch { /* retry */ }
  }, []);

  const loadBills = useCallback(async (patientId: string) => {
    try {
      const res = await fetch(`/api/billing?hospitalCode=${HOSPITAL_CODE}&patientId=${patientId}&view=bills`);
      if (res.ok) setPatientBills(await res.json());
    } catch { /* retry */ }
  }, []);

  const searchPatient = () => {
    if (!patientSearch.trim()) return;
    setActivePatientId(patientSearch.trim());
    setPatientView("unbilled");
  };

  useEffect(() => {
    if (activePatientId) {
      loadUnbilled(activePatientId);
      loadBills(activePatientId);
    }
  }, [activePatientId, loadUnbilled, loadBills]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const assembleBill = async () => {
    if (!activePatientId || unbilledItems.length === 0) return;
    setAssembling(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "assemble_bill", patientId: activePatientId, discount, createdBy: "billing_officer" }),
      });
      if (res.ok) {
        const bill = await res.json();
        showToast(`Bill ${bill.billNumber} Created — GHS ${bill.total.toFixed(2)}`);
        loadUnbilled(activePatientId);
        loadBills(activePatientId);
        loadDashboard();
        setDiscount(0);
      } else {
        const err = await res.json();
        showToast(err.error || "Failed To Create Bill", "error");
      }
    } catch { showToast("Network Error", "error"); }
    setAssembling(false);
  };

  const recordPayment = async () => {
    if (!payingBillId || !paymentMethod) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalCode: HOSPITAL_CODE, action: "record_payment",
          billId: payingBillId, paymentMethod,
          paidAmount: paidAmount ? parseFloat(paidAmount) : undefined,
          recordedBy: "billing_officer",
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        showToast(`Payment Recorded — ${updated.status}`);
        setPayingBillId(null);
        setPaymentMethod("");
        setPaidAmount("");
        if (activePatientId) loadBills(activePatientId);
        loadDashboard();
      } else {
        const err = await res.json();
        showToast(err.error || "Payment Failed", "error");
      }
    } catch { showToast("Network Error", "error"); }
    setProcessing(false);
  };

  const savePrice = async () => {
    if (!priceForm.name.trim() || !priceForm.unitCost) return;
    setSavingPrice(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "set_price", serviceType: priceForm.serviceType, name: priceForm.name, unitCost: parseFloat(priceForm.unitCost) }),
      });
      if (res.ok) {
        showToast(`Price Saved — ${priceForm.name}`);
        setPriceForm({ serviceType: "CONSULTATION", name: "", unitCost: "" });
      } else {
        showToast("Failed To Save Price", "error");
      }
    } catch { showToast("Network Error", "error"); }
    setSavingPrice(false);
  };

  const formatCurrency = (amount: number) => `GHS ${amount.toFixed(2)}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const NAV_ITEMS = [
    { id: "dashboard" as const, icon: "📊", label: "Dashboard" },
    { id: "patient" as const, icon: "💰", label: "Patient Billing" },
    { id: "bills" as const, icon: "📋", label: "Bill History" },
    { id: "prices" as const, icon: "⚙️", label: "Price Config" },
  ];

  return (
    <StationThemeProvider theme={theme}>
    <div style={{ minHeight: "100vh", background: theme.pageBg, position: "relative", overflow: "hidden", transition: "background 0.5s ease" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 55% 35%, ${theme.overlayCopper} 0%, transparent 50%)`, pointerEvents: "none" }} />
      <div style={{ opacity: theme.canvasOpacity, transition: "opacity 0.5s ease" }}><GalaxyCanvas /></div>

      {/* Header */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "16px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: theme.headerBorder, background: theme.headerBg, transition: "background 0.5s ease", backdropFilter: "blur(12px)" }}>
        <div onClick={() => window.location.href = "/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh"} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: 300, fontSize: 13, color: theme.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", transition: "color 0.4s ease" }}>Dalxic</span>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#D4956B" }}>Billing Station</span>
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <ThemeToggle isDayMode={theme.isDayMode} onToggle={theme.toggle} />
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <OperatorBadge session={operator} onLogout={() => window.location.reload()} />
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <span style={{ fontSize: 13, color: theme.textSecondary, transition: "color 0.4s ease" }}>{HOSPITAL_NAME}</span>
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <time suppressHydrationWarning style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 12, color: theme.copperText, transition: "color 0.4s ease" }}>
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </time>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 60px" }}>
        {/* Nav Pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          {NAV_ITEMS.map((n) => (
            <motion.button key={n.id} type="button" onClick={() => setActiveNav(n.id)} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-body transition-all duration-300"
              style={{
                background: activeNav === n.id ? "rgba(184,115,51,0.1)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${activeNav === n.id ? COPPER + "40" : "rgba(255,255,255,0.05)"}`,
                color: activeNav === n.id ? "#D4956B" : "#64748B",
              }}>
              <span>{n.icon}</span>{n.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ═══════ DASHBOARD ═══════ */}
          {activeNav === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Items Rendered Today", value: stats.todayItemsCount, color: COPPER },
                  { label: "Bills Created Today", value: stats.todayBillsCount, color: "#38BDF8" },
                  { label: "Today's Revenue", value: formatCurrency(stats.todayRevenue), color: "#22C55E" },
                  { label: "Pending Bills", value: stats.pendingBillsCount, color: "#F59E0B" },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#64748B", marginBottom: 8 }}>{stat.label}</p>
                    <p style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: stat.color }}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Pending Amount */}
              <WorkshopBox title="Outstanding Balance" icon="⚠️" delay={0.15}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Total Unpaid Across All Patients</p>
                    <p style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: "#F59E0B" }}>{formatCurrency(stats.pendingAmount)}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Bills Pending</p>
                    <p style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: "#F59E0B" }}>{stats.pendingBillsCount}</p>
                  </div>
                </div>
              </WorkshopBox>
            </motion.div>
          )}

          {/* ═══════ PATIENT BILLING ═══════ */}
          {activeNav === "patient" && (
            <motion.div key="patient" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Search */}
              <WorkshopBox title="Find Patient" icon="🔍" delay={0}>
                <div style={{ display: "flex", gap: 12, alignItems: "end" }}>
                  <div style={{ flex: 1 }}>
                    <DInput
                      label="Patient ID"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchPatient()}
                      placeholder="Enter Patient Record ID..."
                    />
                  </div>
                  <motion.button type="button" onClick={searchPatient} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                    style={{ padding: "10px 24px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "white", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Search
                  </motion.button>
                </div>
              </WorkshopBox>

              {activePatientId && (
                <>
                  {/* Sub-nav: Unbilled vs History */}
                  <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
                    {([["unbilled", "Unbilled Items"], ["history", "Bill History"]] as const).map(([key, label]) => (
                      <motion.button key={key} type="button" onClick={() => setPatientView(key)} whileHover={{ y: -1 }}
                        style={{
                          padding: "8px 16px", borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
                          background: patientView === key ? "rgba(184,115,51,0.12)" : "rgba(255,255,255,0.02)",
                          color: patientView === key ? "#D4956B" : "#64748B",
                        }}>
                        {label}
                      </motion.button>
                    ))}
                  </div>

                  {/* Unbilled Items */}
                  {patientView === "unbilled" && (
                    <WorkshopBox title={`Unbilled Items — ${activePatientId.slice(0, 12)}...`} icon="📝" delay={0.1}>
                      {unbilledItems.length === 0 ? (
                        <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", padding: 24 }}>No Unbilled Items For This Patient</p>
                      ) : (
                        <>
                          {/* Items table */}
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr>
                                  {["Service", "Description", "Unit Cost", "Qty", "Total", "When"].map((h) => (
                                    <th key={h} style={{ padding: "8px 12px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#64748B", textAlign: "left", borderBottom: "1px solid rgba(184,115,51,0.08)" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {unbilledItems.map((item) => (
                                  <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#D4956B" }}>
                                      <span style={{ marginRight: 6 }}>{SERVICE_ICONS[item.serviceType] || "📋"}</span>
                                      {item.serviceType}
                                    </td>
                                    <td style={{ padding: "10px 12px", fontSize: 12, color: "white" }}>{item.description}</td>
                                    <td style={{ padding: "10px 12px", fontSize: 13, color: "#94A3B8", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{formatCurrency(item.unitCost)}</td>
                                    <td style={{ padding: "10px 12px", fontSize: 13, color: "#94A3B8", textAlign: "center" }}>{item.quantity}</td>
                                    <td style={{ padding: "10px 12px", fontSize: 12, color: "white", fontWeight: 700, fontFamily: "var(--font-jetbrains-mono), monospace" }}>{formatCurrency(item.totalCost)}</td>
                                    <td style={{ padding: "10px 12px", fontSize: 11, color: "#64748B" }}>{formatTime(item.renderedAt)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Totals + assemble */}
                          <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: theme.navInactiveBg, border: "1px solid rgba(184,115,51,0.08)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                              <span style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px" }}>Subtotal</span>
                              <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: "white" }}>{formatCurrency(unbilledTotal)}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                              <label style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", whiteSpace: "nowrap" }}>Discount (GHS)</label>
                              <input
                                type="number" min="0" step="0.01" value={discount || ""}
                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                style={{ flex: 1, maxWidth: 140, padding: "8px 12px", borderRadius: 10, fontSize: 13, color: "white", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(184,115,51,0.15)", outline: "none", fontFamily: "var(--font-jetbrains-mono), monospace" }}
                              />
                              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                                <span style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", display: "block" }}>Bill Total</span>
                                <span style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: "#22C55E" }}>{formatCurrency(Math.max(0, unbilledTotal - discount))}</span>
                              </div>
                            </div>
                            <motion.button type="button" onClick={assembleBill} disabled={assembling || unbilledItems.length === 0}
                              whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                              style={{ width: "100%", padding: "14px 24px", borderRadius: 14, fontSize: 13, fontWeight: 800, color: "white", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: assembling ? "wait" : "pointer", textTransform: "uppercase", letterSpacing: "1px", opacity: assembling ? 0.6 : 1 }}>
                              {assembling ? "Creating Bill..." : `Assemble Bill — ${unbilledItems.length} Items`}
                            </motion.button>
                          </div>
                        </>
                      )}
                    </WorkshopBox>
                  )}

                  {/* Bill History */}
                  {patientView === "history" && (
                    <WorkshopBox title="Bill History" icon="📋" delay={0.1}>
                      {patientBills.length === 0 ? (
                        <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", padding: 24 }}>No Bills Found For This Patient</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {patientBills.map((bill) => {
                            const sc = STATUS_COLORS[bill.status] || STATUS_COLORS.DRAFT;
                            return (
                              <motion.div key={bill.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                style={{ padding: 16, borderRadius: 12, background: theme.navInactiveBg, border: "1px solid rgba(184,115,51,0.06)" }}>
                                {/* Bill header */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: COPPER }}>{bill.billNumber}</span>
                                    <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>{bill.status}</span>
                                  </div>
                                  <span style={{ fontSize: 11, color: "#64748B" }}>{formatDate(bill.createdAt)}</span>
                                </div>

                                {/* Bill amounts */}
                                <div style={{ display: "flex", gap: 24, marginBottom: 10 }}>
                                  <div>
                                    <span style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px" }}>Subtotal</span>
                                    <p style={{ fontSize: 13, fontFamily: "var(--font-jetbrains-mono), monospace", color: "#94A3B8" }}>{formatCurrency(bill.subtotal)}</p>
                                  </div>
                                  {bill.discount > 0 && (
                                    <div>
                                      <span style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px" }}>Discount</span>
                                      <p style={{ fontSize: 13, fontFamily: "var(--font-jetbrains-mono), monospace", color: "#F59E0B" }}>-{formatCurrency(bill.discount)}</p>
                                    </div>
                                  )}
                                  <div>
                                    <span style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px" }}>Total</span>
                                    <p style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: "white" }}>{formatCurrency(bill.total)}</p>
                                  </div>
                                  {bill.paymentMethod && (
                                    <div>
                                      <span style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px" }}>Method</span>
                                      <p style={{ fontSize: 13, color: "#94A3B8" }}>{bill.paymentMethod}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Items summary */}
                                {bill.items && bill.items.length > 0 && (
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                                    {bill.items.map((item) => (
                                      <span key={item.id} style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, background: "rgba(184,115,51,0.06)", border: "1px solid rgba(184,115,51,0.1)", color: "#D4956B" }}>
                                        {SERVICE_ICONS[item.serviceType] || "📋"} {item.description}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Payment button */}
                                {(bill.status === "DRAFT" || bill.status === "ISSUED" || bill.status === "PART_PAID") && (
                                  <>
                                    {payingBillId === bill.id ? (
                                      <div style={{ padding: 12, borderRadius: 10, background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}>
                                        <p style={{ fontSize: 10, fontWeight: 700, color: "#22C55E", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>Record Payment</p>
                                        {/* Method selection */}
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                                          {PAYMENT_METHODS.map((pm) => (
                                            <motion.button key={pm.value} type="button" onClick={() => setPaymentMethod(pm.value)} whileHover={{ y: -1 }}
                                              style={{
                                                padding: "8px 14px", borderRadius: 10, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                                                background: paymentMethod === pm.value ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)",
                                                color: paymentMethod === pm.value ? "#22C55E" : "#64748B",
                                                outline: paymentMethod === pm.value ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.05)",
                                              }}>
                                              {pm.icon} {pm.label}
                                            </motion.button>
                                          ))}
                                        </div>
                                        {/* Partial payment */}
                                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                                          <label style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", whiteSpace: "nowrap" }}>Paid Amount (Leave Empty For Full)</label>
                                          <input
                                            type="number" min="0" step="0.01" value={paidAmount}
                                            onChange={(e) => setPaidAmount(e.target.value)}
                                            placeholder={bill.total.toFixed(2)}
                                            style={{ flex: 1, maxWidth: 160, padding: "8px 12px", borderRadius: 10, fontSize: 13, color: "white", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(34,197,94,0.15)", outline: "none", fontFamily: "var(--font-jetbrains-mono), monospace" }}
                                          />
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                          <motion.button type="button" onClick={recordPayment} disabled={!paymentMethod || processing}
                                            whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                                            style={{ flex: 1, padding: "10px 20px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "white", background: "linear-gradient(135deg, #22C55E, #16A34A)", border: "none", cursor: processing ? "wait" : "pointer", textTransform: "uppercase", letterSpacing: "0.5px", opacity: processing || !paymentMethod ? 0.5 : 1 }}>
                                            {processing ? "Processing..." : "Confirm Payment"}
                                          </motion.button>
                                          <motion.button type="button" onClick={() => { setPayingBillId(null); setPaymentMethod(""); setPaidAmount(""); }}
                                            whileHover={{ y: -1 }}
                                            style={{ padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#64748B", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                                            Cancel
                                          </motion.button>
                                        </div>
                                      </div>
                                    ) : (
                                      <motion.button type="button" onClick={() => setPayingBillId(bill.id)}
                                        whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                                        style={{ padding: "8px 20px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        💵 Record Payment
                                      </motion.button>
                                    )}
                                  </>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </WorkshopBox>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ═══════ BILL HISTORY (all) ═══════ */}
          {activeNav === "bills" && (
            <motion.div key="bills" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkshopBox title="All Recent Bills" icon="📋" delay={0}>
                <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", padding: 24 }}>
                  Use Patient Billing Tab To Search Bills By Patient ID.
                  <br /><br />
                  <span style={{ fontSize: 11, color: "#4A5568" }}>Search By Patient ID In The Patient Billing Tab</span>
                </p>
              </WorkshopBox>
            </motion.div>
          )}

          {/* ═══════ PRICE CONFIG ═══════ */}
          {activeNav === "prices" && (
            <motion.div key="prices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkshopBox title="Set Service Prices" icon="⚙️" delay={0}>
                <p style={{ fontSize: 11, color: "#64748B", marginBottom: 16 }}>
                  Configure Default Prices For Each Service Type. These Override Module-Provided Costs.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Service Type</label>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {SERVICE_TYPES.map((st) => (
                        <motion.button key={st} type="button" onClick={() => setPriceForm({ ...priceForm, serviceType: st })}
                          whileHover={{ y: -1 }}
                          style={{
                            padding: "6px 12px", borderRadius: 8, fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer",
                            background: priceForm.serviceType === st ? "rgba(184,115,51,0.12)" : "rgba(255,255,255,0.03)",
                            color: priceForm.serviceType === st ? "#D4956B" : "#64748B",
                            outline: priceForm.serviceType === st ? `1px solid ${COPPER}40` : "1px solid rgba(255,255,255,0.05)",
                          }}>
                          {SERVICE_ICONS[st]} {st}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 12, alignItems: "end" }}>
                  <div>
                    <DInput
                      label="Service Name"
                      value={priceForm.name}
                      onChange={(e) => setPriceForm({ ...priceForm, name: e.target.value })}
                      placeholder="e.g. General Consultation, Full Blood Count..."
                    />
                  </div>
                  <div>
                    <DInput
                      label="Unit Cost (GHS)"
                      type="number" min="0" step="0.01"
                      value={priceForm.unitCost}
                      onChange={(e) => setPriceForm({ ...priceForm, unitCost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <motion.button type="button" onClick={savePrice} disabled={savingPrice || !priceForm.name || !priceForm.unitCost}
                    whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                    style={{ padding: "10px 24px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "white", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: savingPrice ? "wait" : "pointer", textTransform: "uppercase", letterSpacing: "0.5px", opacity: savingPrice || !priceForm.name || !priceForm.unitCost ? 0.5 : 1 }}>
                    {savingPrice ? "Saving..." : "Save Price"}
                  </motion.button>
                </div>
              </WorkshopBox>

              {/* Price examples */}
              <WorkshopBox title="How Billing Auto-Capture Works" icon="💡" delay={0.1} className="mt-4">
                <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.8 }}>
                  <p style={{ marginBottom: 8 }}>Every Module Automatically Emits Billable Items When Services Are Rendered:</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { icon: "🩺", from: "Doctor Station", item: "Consultation Fee" },
                      { icon: "🧪", from: "Lab Station", item: "Test Charges" },
                      { icon: "💊", from: "Pharmacy", item: "Drug Costs" },
                      { icon: "🏥", from: "Ward Manager", item: "Daily Bed Rate" },
                      { icon: "📷", from: "Imaging", item: "Scan Fees" },
                      { icon: "🔬", from: "Procedures", item: "Procedure Costs" },
                    ].map((eg) => (
                      <div key={eg.from} style={{ padding: 10, borderRadius: 10, background: theme.navInactiveBg, border: "1px solid rgba(255,255,255,0.04)" }}>
                        <span style={{ fontSize: 14 }}>{eg.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#D4956B", marginLeft: 6 }}>{eg.from}</span>
                        <span style={{ fontSize: 11, color: "#64748B" }}> → {eg.item}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: 12, fontSize: 11, color: "#64748B" }}>
                    Prices Set Here Override Default Module Costs. The Billing Officer Simply Searches A Patient, Reviews Auto-Captured Items, And Assembles The Bill.
                  </p>
                </div>
              </WorkshopBox>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 40 }}
            style={{
              position: "fixed", bottom: 32, left: "50%", zIndex: 100, padding: "14px 28px", borderRadius: 16,
              background: toast.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              color: toast.type === "success" ? "#22C55E" : "#EF4444",
              fontSize: 13, fontWeight: 700, letterSpacing: "0.3px",
            }}>
            {toast.type === "success" ? "✓" : "✗"} {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </StationThemeProvider>
  );
}