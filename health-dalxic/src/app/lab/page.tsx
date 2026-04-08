"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
        <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "#D4956B", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

/* ─── Dark Input ─── */
function DInput({ label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean }) {
  const theme = useThemeContext();
  return (
    <div>
      {label && (
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "#94A3B8", marginBottom: 6 }}>
          {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
        </label>
      )}
      <input
        {...props}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body text-white placeholder:text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#B87333]/30 focus:border-[#B87333]/30 transition-all duration-300"
        style={{ background: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText, transition: "background 0.4s ease, border-color 0.4s ease, color 0.4s ease" }}
      />
    </div>
  );
}

/* ─── Dark Select ─── */
function DSelect({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }) {
  const theme = useThemeContext();
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "#94A3B8", marginBottom: 6 }}>{label}</label>}
      <select
        {...props}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body text-white focus:outline-none focus:ring-2 focus:ring-[#B87333]/30 focus:border-[#B87333]/30 transition-all duration-300 appearance-none"
        style={{ background: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText, transition: "background 0.4s ease, border-color 0.4s ease, color 0.4s ease" }}
      >
        <option value="" style={{ background: theme.selectOptionBg }}>Select...</option>
        {options.map((o) => <option key={o.value} value={o.value} style={{ background: theme.selectOptionBg }}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ─── Types ─── */
interface LabOrderItem {
  id: string;
  labToken: string;
  patientId: string;
  tests: { testName: string; category: string }[];
  clinicalNotes: string | null;
  status: string;
  orderedAt: string;
  labResults: { testName: string; resultValue: string; flag: string }[];
}

const FLAG_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "low", label: "Low" },
  { value: "reactive", label: "Reactive" },
  { value: "non_reactive", label: "Non-Reactive" },
];

/* ─── Nav items ─── */
const NAV_ITEMS = [
  { id: "pending", icon: "🧪", label: "Pending Orders" },
  { id: "in_progress", icon: "🔬", label: "In Progress" },
  { id: "completed", icon: "✅", label: "Completed" },
];

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function LabPage() {
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Laboratory" stationIcon="🔬" allowedRoles={["lab_tech", "admin"]}>
      {(operator) => <LabContent operator={operator} />}
    </StationGate>
  );
}

function LabContent({ operator }: { operator: OperatorSession }) {
  const theme = useStationTheme();
  const [activeNav, setActiveNav] = useState("pending");
  const [orders, setOrders] = useState<LabOrderItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<LabOrderItem | null>(null);
  const [results, setResults] = useState<Record<string, { value: string; unit: string; range: string; flag: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/lab-orders?hospitalCode=${HOSPITAL_CODE}&status=pending`);
      if (res.ok) setOrders(await res.json());
    } catch { /* retry */ }
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const selectOrder = (order: LabOrderItem) => {
    setActiveOrder(order);
    const initial: typeof results = {};
    order.tests.forEach((t) => {
      initial[t.testName] = { value: "", unit: "", range: "", flag: "normal" };
    });
    setResults(initial);
  };

  const updateResult = (testName: string, field: string, value: string) => {
    setResults((prev) => ({ ...prev, [testName]: { ...prev[testName], [field]: value } }));
  };

  const submitResults = async () => {
    if (!activeOrder) return;
    setSubmitting(true);
    try {
      const payload = Object.entries(results).map(([testName, r]) => ({
        testName,
        resultValue: r.value,
        unit: r.unit || undefined,
        referenceRange: r.range || undefined,
        flag: r.flag,
      }));
      await fetch("/api/lab-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labOrderId: activeOrder.id, results: payload, enteredBy: "lab_tech" }),
      });
      setActiveOrder(null);
      setResults({});
      loadOrders();
    } finally {
      setSubmitting(false);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const completedOrders = orders.filter((o) => o.status === "completed");

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
        <Link href="/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: 300, fontSize: 13, color: theme.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", transition: "color 0.4s ease" }}>Dalxic</span>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#D4956B" }}>Lab Station</span>
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

      {/* Main */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 60px" }}>

        {/* Nav pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          {NAV_ITEMS.map((n) => (
            <motion.button
              key={n.id}
              type="button"
              onClick={() => { setActiveNav(n.id); setActiveOrder(null); }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 500,
                background: activeNav === n.id ? "rgba(184,115,51,0.1)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${activeNav === n.id ? COPPER + "40" : "rgba(255,255,255,0.05)"}`,
                color: activeNav === n.id ? "#D4956B" : "#64748B",
                boxShadow: activeNav === n.id ? `0 0 20px ${COPPER}12` : "none",
                cursor: "pointer", transition: "all 0.3s",
              }}
            >
              <span>{n.icon}</span>
              {n.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ═══════ ACTIVE ORDER — RESULT ENTRY ═══════ */}
          {activeOrder ? (
            <motion.div key="active-order" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Order header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{
                    fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800,
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    background: `linear-gradient(135deg, ${COPPER}, #D4956B)`,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    {activeOrder.labToken}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase",
                    padding: "4px 12px", borderRadius: 8,
                    background: "rgba(184,115,51,0.1)", border: "1px solid rgba(184,115,51,0.2)", color: "#D4956B",
                  }}>
                    In Progress
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveOrder(null)}
                  style={{
                    padding: "8px 20px", borderRadius: 12, fontSize: 14, fontWeight: 500,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#94A3B8", cursor: "pointer", transition: "all 0.3s",
                  }}
                >
                  Back To Queue
                </motion.button>
              </div>

              {/* Clinical notes */}
              {activeOrder.clinicalNotes && (
                <WorkshopBox title="Clinical Notes From Doctor" icon="📋" delay={0.05}>
                  <p style={{
                    fontSize: 14.5, fontWeight: 500, lineHeight: 1.7, color: "rgba(255,255,255,0.7)",
                    padding: 16, borderRadius: 12, fontStyle: "italic",
                    background: "rgba(184,115,51,0.04)", border: "1px solid rgba(184,115,51,0.1)",
                  }}>
                    {activeOrder.clinicalNotes}
                  </p>
                </WorkshopBox>
              )}

              {/* Test result entry */}
              <WorkshopBox title="Enter Test Results" icon="🔬" delay={0.1} className="mt-4">
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {activeOrder.tests.map((test, i) => (
                    <motion.div
                      key={test.testName}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      style={{
                        padding: 20, borderRadius: 16,
                        background: theme.navInactiveBg,
                        border: "1px solid rgba(184,115,51,0.1)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <h4 style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{test.testName}</h4>
                        <span style={{
                          fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase",
                          padding: "3px 10px", borderRadius: 6,
                          background: "rgba(184,115,51,0.08)", border: "1px solid rgba(184,115,51,0.15)", color: "#D4956B",
                        }}>
                          {test.category}
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                        <DInput label="Result Value" placeholder="e.g. 12.5" value={results[test.testName]?.value ?? ""} onChange={(e) => updateResult(test.testName, "value", e.target.value)} required />
                        <DInput label="Unit" placeholder="e.g. g/dL" value={results[test.testName]?.unit ?? ""} onChange={(e) => updateResult(test.testName, "unit", e.target.value)} />
                        <DInput label="Reference Range" placeholder="e.g. 11-16" value={results[test.testName]?.range ?? ""} onChange={(e) => updateResult(test.testName, "range", e.target.value)} />
                        <DSelect label="Flag" options={FLAG_OPTIONS} value={results[test.testName]?.flag ?? "normal"} onChange={(e) => updateResult(test.testName, "flag", e.target.value)} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </WorkshopBox>

              {/* Submit button */}
              <motion.button
                whileHover={{ scale: 1.01, boxShadow: `0 8px 40px ${COPPER}30` }}
                whileTap={{ scale: 0.98 }}
                onClick={submitResults}
                disabled={submitting}
                style={{
                  width: "100%", marginTop: 20, padding: "16px 32px", borderRadius: 16,
                  fontSize: 16, fontWeight: 600, color: "white", cursor: "pointer",
                  background: `linear-gradient(135deg, ${COPPER}, #D4956B)`,
                  border: "none", boxShadow: `0 4px 24px ${COPPER}20`,
                  opacity: submitting ? 0.6 : 1, transition: "all 0.3s",
                }}
              >
                {submitting ? "Submitting Results..." : "Submit Results & Notify Doctor"}
              </motion.button>
            </motion.div>
          ) : (
            /* ═══════ ORDER QUEUE LIST ═══════ */
            <motion.div key="order-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Pending Orders", value: pendingOrders.length, accent: true },
                  { label: "Completed Today", value: completedOrders.length, accent: false },
                  { label: "Total Tests", value: orders.reduce((sum, o) => sum + o.tests.length, 0), accent: false },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      padding: 20, borderRadius: 16,
                      background: theme.cardBg,
                      border: `1px solid ${stat.accent ? "rgba(184,115,51,0.2)" : "rgba(255,255,255,0.05)"}`,
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <p style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: stat.accent ? COPPER : "white" }}>
                      {stat.value}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "#94A3B8", marginTop: 4 }}>{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Order cards */}
              {activeNav === "pending" && pendingOrders.length === 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", paddingTop: 64, paddingBottom: 64 }}>
                  <div style={{ width: 64, height: 64, margin: "0 auto 16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(184,115,51,0.15)" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(184,115,51,0.2)" }} />
                  </div>
                  <p style={{ fontSize: 14.5, fontWeight: 500, color: "#94A3B8" }}>No Pending Orders</p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "#4A5568", marginTop: 4 }}>Orders Will Appear Here When Doctors Send Lab Requests</p>
                </motion.div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(activeNav === "pending" ? pendingOrders : activeNav === "completed" ? completedOrders : orders).map((order, i) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => activeNav === "pending" ? selectOrder(order) : undefined}
                    whileHover={{ y: -2, boxShadow: `0 8px 32px ${COPPER}08` }}
                    style={{
                      padding: 20, borderRadius: 16, cursor: activeNav === "pending" ? "pointer" : "default",
                      background: theme.cardBg,
                      border: theme.cardBorder,
                      backdropFilter: "blur(12px)",
                      transition: "all 0.3s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{
                          fontSize: 20, fontWeight: 700,
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                          background: `linear-gradient(135deg, ${COPPER}, #D4956B)`,
                          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        }}>
                          {order.labToken}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase",
                          padding: "3px 10px", borderRadius: 6,
                          background: order.status === "pending" ? "rgba(184,115,51,0.08)" : "rgba(16,185,129,0.08)",
                          border: `1px solid ${order.status === "pending" ? "rgba(184,115,51,0.15)" : "rgba(16,185,129,0.15)"}`,
                          color: order.status === "pending" ? "#D4956B" : "#10B981",
                        }}>
                          {order.status === "pending" ? "Pending" : "Completed"}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, fontFamily: "var(--font-jetbrains-mono), monospace", color: "#64748B" }}>
                        {new Date(order.orderedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                      {order.tests.map((t) => (
                        <span key={t.testName} style={{
                          fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8,
                          background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.12)",
                          color: "#38BDF8",
                        }}>
                          {t.testName}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
    </StationThemeProvider>
  );
}