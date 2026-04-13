"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StationGate, OperatorBadge } from "@/components/station-gate";
import { useStationTheme, ThemeToggle, StationThemeProvider, useThemeContext, COPPER, fontFamily } from "@/hooks/use-station-theme";
import type { OperatorSession } from "@/types";

const HOSPITAL_CODE = "KBH";
const HOSPITAL_NAME = "Korle Bu Teaching Hospital";
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

/* ─── Types ─── */
interface InjectionOrder {
  id: string;
  drug: string;
  route: string;
  dose: string;
  frequency: string;
  status: string;
  orderedBy: string;
  orderedAt: string;
  administeredBy?: string;
  administeredAt?: string;
  notes?: string;
  recordId: string;
  patientName: string;
  queueToken: string;
  department: string;
}

const ROUTE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  IM: { bg: "rgba(14,165,233,0.08)", text: "#38BDF8", label: "Intramuscular" },
  IV: { bg: "rgba(168,85,247,0.08)", text: "#A855F7", label: "Intravenous" },
  SC: { bg: "rgba(34,197,94,0.08)", text: "#22C55E", label: "Subcutaneous" },
  ID: { bg: "rgba(245,158,11,0.08)", text: "#F59E0B", label: "Intradermal" },
};

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  pending: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#F59E0B" },
  in_progress: { bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)", text: "#38BDF8" },
  completed: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", text: "#22C55E" },
};

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function InjectionRoomPage() {
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Injection Room" stationIcon="💉" allowedRoles={["nurse", "midwife", "admin", "super_admin"]}>
      {(operator) => <InjectionRoomContent operator={operator} />}
    </StationGate>
  );
}

function InjectionRoomContent({ operator }: { operator: OperatorSession }) {
  const theme = useStationTheme();
  const [activeNav, setActiveNav] = useState<"queue" | "completed">("queue");
  const [orders, setOrders] = useState<InjectionOrder[]>([]);
  const [counts, setCounts] = useState({ pending: 0, in_progress: 0, completed: 0, total: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadOrders = useCallback(async () => {
    try {
      const status = activeNav === "queue" ? "pending" : "completed";
      const res = await fetch(`/api/injection-room?hospitalCode=${HOSPITAL_CODE}&status=${activeNav === "queue" ? "all" : status}`);
      if (res.ok) {
        const data = await res.json();
        const filtered = activeNav === "queue"
          ? data.orders.filter((o: InjectionOrder) => o.status === "pending" || o.status === "in_progress")
          : data.orders.filter((o: InjectionOrder) => o.status === "completed");
        setOrders(filtered);
        setCounts(data.counts);
      }
    } catch { /* retry */ }
  }, [activeNav]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(loadOrders, 15000); return () => clearInterval(t); }, [loadOrders]);

  const startInjection = async (order: InjectionOrder) => {
    setProcessingId(order.id);
    try {
      const res = await fetch("/api/injection-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "start", recordId: order.recordId, injectionId: order.id, administeredBy: "nurse" }),
      });
      if (res.ok) {
        showToast(`Started — ${order.drug}`);
        loadOrders();
      }
    } catch { showToast("Failed", "error"); }
    setProcessingId(null);
  };

  const administerInjection = async (order: InjectionOrder) => {
    setProcessingId(order.id);
    try {
      const res = await fetch("/api/injection-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "administer", recordId: order.recordId, injectionId: order.id, administeredBy: "nurse" }),
      });
      if (res.ok) {
        showToast(`Administered — ${order.drug}`);
        loadOrders();
      }
    } catch { showToast("Failed", "error"); }
    setProcessingId(null);
  };

  const NAV_ITEMS = [
    { id: "queue" as const, icon: "💉", label: "Active Queue" },
    { id: "completed" as const, icon: "✅", label: "Completed" },
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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: theme.copperText }}>Injection Room</span>
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
        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Pending", value: counts.pending, color: "#F59E0B" },
            { label: "In Progress", value: counts.in_progress, color: "#38BDF8" },
            { label: "Completed Today", value: counts.completed, color: "#22C55E" },
            { label: "Total Orders", value: counts.total, color: COPPER },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: theme.textMuted, marginBottom: 8 }}>{stat.label}</p>
              <p style={{ fontSize: 32, fontWeight: 800, fontFamily: fontFamily.mono, color: stat.color }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Nav Pills */}
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
            {orders.length === 0 ? (
              <WorkshopBox title={activeNav === "queue" ? "No Pending Injections" : "No Completed Injections"} icon={activeNav === "queue" ? "💉" : "✅"}>
                <p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 24 }}>
                  {activeNav === "queue"
                    ? "No Injection Orders In Queue. Orders Appear Here When Doctors Prescribe Injections."
                    : "No Completed Injections Today Yet."}
                </p>
              </WorkshopBox>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {orders.map((order, i) => {
                  const routeInfo = ROUTE_COLORS[order.route] || ROUTE_COLORS.IM;
                  const statusInfo = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
                  return (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: `1px solid ${order.status === "in_progress" ? "rgba(14,165,233,0.2)" : "rgba(184,115,51,0.1)"}`, backdropFilter: "blur(12px)" }}>
                      {/* Top row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: fontFamily.mono, color: COPPER }}>{order.queueToken}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>{order.patientName}</span>
                          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", background: statusInfo.bg, border: `1px solid ${statusInfo.border}`, color: statusInfo.text }}>
                            {order.status.replace("_", " ")}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: theme.textMuted }}>{new Date(order.orderedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>

                      {/* Drug info */}
                      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4 }}>Drug</p>
                          <p style={{ fontSize: 16, fontWeight: 800, color: theme.textPrimary }}>{order.drug}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4 }}>Route</p>
                          <span style={{ padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: routeInfo.bg, color: routeInfo.text }}>
                            {order.route} — {routeInfo.label}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4 }}>Dose</p>
                          <p style={{ fontSize: 14, fontWeight: 700, fontFamily: fontFamily.mono, color: theme.copperText }}>{order.dose}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4 }}>Frequency</p>
                          <p style={{ fontSize: 13, color: theme.textSecondary }}>{order.frequency}</p>
                        </div>
                      </div>

                      {/* Notes */}
                      {order.notes && (
                        <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 12, fontStyle: "italic" }}>{order.notes}</p>
                      )}

                      {/* Ordered by */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 10, color: theme.textMuted }}>Ordered By: {order.orderedBy} — Dept: {order.department}</span>

                        {/* Action buttons */}
                        {order.status === "pending" && (
                          <motion.button type="button" onClick={() => startInjection(order)} disabled={processingId === order.id}
                            whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                            style={{ padding: "8px 20px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#38BDF8", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            💉 Start
                          </motion.button>
                        )}
                        {order.status === "in_progress" && (
                          <motion.button type="button" onClick={() => administerInjection(order)} disabled={processingId === order.id}
                            whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                            style={{ padding: "8px 20px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            ✓ Mark Administered
                          </motion.button>
                        )}
                        {order.status === "completed" && order.administeredAt && (
                          <span style={{ fontSize: 10, color: "#22C55E" }}>
                            Administered By {order.administeredBy} At {new Date(order.administeredAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
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