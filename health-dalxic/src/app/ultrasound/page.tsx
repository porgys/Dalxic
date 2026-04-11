"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StationGate, OperatorBadge } from "@/components/station-gate";
import { useStationTheme, ThemeToggle, StationThemeProvider, useThemeContext, COPPER, fontFamily } from "@/hooks/use-station-theme";
import type { OperatorSession } from "@/types";

const HOSPITAL_CODE = "KBH";
const HOSPITAL_NAME = "Korle Bu Teaching Hospital";
const MODALITY = "ultrasound";
const STATION_TITLE = "Ultrasound";

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

/* ─── Themed Textarea ─── */
function DTextarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const t = useThemeContext();
  return (
    <div>
      {label && <label className="block text-xs font-medium font-body mb-1.5" style={{ color: t.textLabel, transition: "color 0.4s ease" }}>{label}</label>}
      <textarea
        {...props}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body focus:outline-none focus:ring-2 transition-all duration-300 resize-none"
        style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText, transition: "background 0.4s ease, border-color 0.4s ease, color 0.4s ease" }}
      />
    </div>
  );
}

interface ImagingOrder {
  id: string;
  modality: string;
  examType: string;
  bodyPart: string;
  clinicalIndication: string;
  status: string;
  urgency: string;
  orderedBy: string;
  orderedAt: string;
  reportedBy?: string;
  reportedAt?: string;
  findings?: string;
  impression?: string;
  recordId: string;
  patientName: string;
  queueToken: string;
  department: string;
}

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  pending: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#F59E0B" },
  in_progress: { bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)", text: "#38BDF8" },
  completed: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", text: "#22C55E" },
};

export default function UltrasoundPage() {
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Ultrasound" stationIcon="📡" allowedRoles={["radiologist", "sonographer", "admin", "super_admin"]}>
      {(operator) => <UltrasoundContent operator={operator} />}
    </StationGate>
  );
}

function UltrasoundContent({ operator }: { operator: OperatorSession }) {
  const theme = useStationTheme();
  const [activeNav, setActiveNav] = useState<"queue" | "report" | "completed">("queue");
  const [orders, setOrders] = useState<ImagingOrder[]>([]);
  const [counts, setCounts] = useState({ pending: 0, in_progress: 0, completed: 0, total: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reportingOrder, setReportingOrder] = useState<ImagingOrder | null>(null);
  const [reportForm, setReportForm] = useState({ findings: "", impression: "" });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/imaging?hospitalCode=${HOSPITAL_CODE}&modality=${MODALITY}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setCounts(data.counts);
      }
    } catch { /* retry */ }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(loadOrders, 15000); return () => clearInterval(t); }, [loadOrders]);

  const startScan = async (order: ImagingOrder) => {
    setProcessingId(order.id);
    try {
      await fetch("/api/imaging", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "start", recordId: order.recordId, imagingId: order.id }) });
      showToast(`Scan Started — ${order.examType}`);
      loadOrders();
    } catch { showToast("Failed", "error"); }
    setProcessingId(null);
  };

  const submitReport = async () => {
    if (!reportingOrder) return;
    setProcessingId(reportingOrder.id);
    try {
      await fetch("/api/imaging", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "report", recordId: reportingOrder.recordId, imagingId: reportingOrder.id, findings: reportForm.findings, impression: reportForm.impression, reportedBy: "sonographer" }) });
      showToast(`Report Submitted — ${reportingOrder.examType}`);
      setReportingOrder(null);
      setReportForm({ findings: "", impression: "" });
      loadOrders();
    } catch { showToast("Failed", "error"); }
    setProcessingId(null);
  };

  const filteredOrders = activeNav === "queue"
    ? orders.filter((o) => o.status === "pending" || o.status === "in_progress")
    : activeNav === "completed"
    ? orders.filter((o) => o.status === "completed")
    : orders.filter((o) => o.status === "in_progress");

  const NAV_ITEMS = [
    { id: "queue" as const, icon: "📡", label: "Scan Queue" },
    { id: "report" as const, icon: "📝", label: "Ready To Report" },
    { id: "completed" as const, icon: "✅", label: "Completed" },
  ];

  return (
    <StationThemeProvider theme={theme}>
    <div style={{ minHeight: "100vh", background: theme.pageBg, position: "relative", overflow: "hidden", transition: "background 0.5s ease" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 55% 35%, ${theme.overlayCopper} 0%, transparent 50%)`, pointerEvents: "none" }} />
      <div style={{ opacity: theme.canvasOpacity, transition: "opacity 0.5s ease" }}><GalaxyCanvas /></div>

      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "16px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: theme.headerBorder, background: theme.headerBg, transition: "background 0.5s ease", backdropFilter: "blur(12px)" }}>
        <div onClick={() => window.location.href = "/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh"} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: 300, fontSize: 13, color: theme.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", transition: "color 0.4s ease" }}>Dalxic</span>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#D4956B" }}>{STATION_TITLE}</span>
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <ThemeToggle isDayMode={theme.isDayMode} onToggle={theme.toggle} />
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

      <main style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Pending Scans", value: counts.pending, color: "#F59E0B" },
            { label: "In Progress", value: counts.in_progress, color: "#38BDF8" },
            { label: "Completed Today", value: counts.completed, color: "#22C55E" },
            { label: "Total Orders", value: counts.total, color: COPPER },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#64748B", marginBottom: 8 }}>{stat.label}</p>
              <p style={{ fontSize: 32, fontWeight: 800, fontFamily: fontFamily.mono, color: stat.color }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
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
          <motion.div key={activeNav} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {reportingOrder && (
              <WorkshopBox title={`Report — ${reportingOrder.examType}`} icon="📝" className="mb-4">
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: "white", marginBottom: 4 }}><strong>{reportingOrder.patientName}</strong> — {reportingOrder.queueToken}</p>
                  <p style={{ fontSize: 11, color: "#64748B" }}>Body Part: {reportingOrder.bodyPart} — Indication: {reportingOrder.clinicalIndication}</p>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <DTextarea label="Findings" value={reportForm.findings} onChange={(e) => setReportForm({ ...reportForm, findings: e.target.value })} rows={4} placeholder="Describe ultrasound findings..." />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <DTextarea label="Impression" value={reportForm.impression} onChange={(e) => setReportForm({ ...reportForm, impression: e.target.value })} rows={2} placeholder="Sonographer impression / conclusion..." />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <motion.button type="button" onClick={submitReport} disabled={!!processingId} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                    style={{ flex: 1, padding: "12px 24px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "white", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: "pointer", textTransform: "uppercase" }}>
                    Submit Report
                  </motion.button>
                  <motion.button type="button" onClick={() => { setReportingOrder(null); setReportForm({ findings: "", impression: "" }); }} whileHover={{ y: -1 }}
                    style={{ padding: "12px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#64748B", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                    Cancel
                  </motion.button>
                </div>
              </WorkshopBox>
            )}

            {filteredOrders.length === 0 && !reportingOrder ? (
              <WorkshopBox title="No Orders" icon="📡">
                <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", padding: 24 }}>No {activeNav === "completed" ? "Completed" : "Pending"} Ultrasound Orders.</p>
              </WorkshopBox>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredOrders.map((order, i) => {
                  const statusInfo = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
                  return (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: fontFamily.mono, color: COPPER }}>{order.queueToken}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{order.patientName}</span>
                          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", background: statusInfo.bg, border: `1px solid ${statusInfo.border}`, color: statusInfo.text }}>{order.status.replace("_", " ")}</span>
                        </div>
                        <span style={{ fontSize: 11, color: "#64748B" }}>{new Date(order.orderedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4 }}>Exam</p>
                          <p style={{ fontSize: 16, fontWeight: 800, color: "white" }}>{order.examType}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4 }}>Body Part</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#D4956B" }}>{order.bodyPart}</p>
                        </div>
                        {order.clinicalIndication && (
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4 }}>Indication</p>
                            <p style={{ fontSize: 13, color: "#94A3B8" }}>{order.clinicalIndication}</p>
                          </div>
                        )}
                      </div>
                      {order.findings && (
                        <div style={{ padding: 12, borderRadius: 10, background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)", marginBottom: 12 }}>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#22C55E", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Findings</p>
                          <p style={{ fontSize: 13, color: "#94A3B8" }}>{order.findings}</p>
                          {order.impression && <p style={{ fontSize: 12, color: "white", fontWeight: 600, marginTop: 6 }}>Impression: {order.impression}</p>}
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 10, color: "#4A5568" }}>Ordered By: {order.orderedBy} — {order.department}</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          {order.status === "pending" && (
                            <motion.button type="button" onClick={() => startScan(order)} disabled={processingId === order.id} whileHover={{ y: -1 }}
                              style={{ padding: "8px 20px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#38BDF8", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", cursor: "pointer", textTransform: "uppercase" }}>
                              Start Scan
                            </motion.button>
                          )}
                          {order.status === "in_progress" && (
                            <motion.button type="button" onClick={() => setReportingOrder(order)} whileHover={{ y: -1 }}
                              style={{ padding: "8px 20px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", cursor: "pointer", textTransform: "uppercase" }}>
                              Write Report
                            </motion.button>
                          )}
                          {order.status === "completed" && order.reportedAt && (
                            <span style={{ fontSize: 10, color: "#22C55E" }}>Reported By {order.reportedBy} At {new Date(order.reportedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 40, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 40 }}
            style={{ position: "fixed", bottom: 32, left: "50%", zIndex: 100, padding: "14px 28px", borderRadius: 16, background: toast.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, backdropFilter: "blur(16px)", color: toast.type === "success" ? "#22C55E" : "#EF4444", fontSize: 13, fontWeight: 700 }}>
            {toast.type === "success" ? "✓" : "✗"} {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </StationThemeProvider>
  );
}