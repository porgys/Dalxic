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

/* ─── Nav items ─── */
const NAV_ITEMS = [
  { id: "prescriptions", icon: "💊", label: "Prescriptions" },
  { id: "dispensed", icon: "✅", label: "Dispensed Today" },
  { id: "inventory", icon: "📦", label: "Inventory" },
];

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function PharmacyPage() {
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Pharmacy" stationIcon="💊" allowedRoles={["pharmacist", "admin"]}>
      {(operator) => <PharmacyContent operator={operator} />}
    </StationGate>
  );
}

function PharmacyContent({ operator }: { operator: OperatorSession }) {
  const theme = useStationTheme();
  const [activeNav, setActiveNav] = useState("prescriptions");
  const [queue, setQueue] = useState<PrescriptionItem[]>([]);
  const [dispensing, setDispensing] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [counts, setCounts] = useState({ total: 0, pending: 0, dispensed: 0 });

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/pharmacy?hospitalCode=${HOSPITAL_CODE}`);
      if (!res.ok) return;
      const data = await res.json();
      setQueue(data.patients);
      setCounts(data.counts);
    } catch { /* retry */ }
  }, []);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 8000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const markDispensed = async (recordId: string) => {
    setDispensing(recordId);
    try {
      const res = await fetch("/api/pharmacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, recordId, dispensedBy: "pharmacist" }),
      });
      if (res.ok) await loadQueue();
    } catch { /* retry */ }
    finally { setDispensing(null); }
  };

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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#D4956B" }}>Pharmacy</span>
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
              onClick={() => setActiveNav(n.id)}
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

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Pending Prescriptions", value: counts.pending, accent: true },
            { label: "Dispensed Today", value: counts.dispensed, accent: false },
            { label: "Total Medications", value: queue.reduce((sum, q) => sum + q.prescriptions.length, 0), accent: false },
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

        <AnimatePresence mode="wait">
          {/* ═══════ PRESCRIPTIONS VIEW ═══════ */}
          {(activeNav === "prescriptions" || activeNav === "dispensed") && (
            <motion.div key={activeNav} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {(activeNav === "prescriptions" ? pending : dispensedItems).length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", paddingTop: 64, paddingBottom: 64 }}>
                  <div style={{ width: 64, height: 64, margin: "0 auto 16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(184,115,51,0.15)" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(184,115,51,0.2)" }} />
                  </div>
                  <p style={{ fontSize: 14.5, fontWeight: 500, color: "#94A3B8" }}>
                    {activeNav === "prescriptions" ? "No Pending Prescriptions" : "No Dispensed Items Yet"}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "#4A5568", marginTop: 4 }}>
                    {activeNav === "prescriptions" ? "Prescriptions Will Appear Here When Doctors Complete Consultations" : "Dispensed Items Will Appear Here After You Mark Them"}
                  </p>
                </motion.div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {(activeNav === "prescriptions" ? pending : dispensedItems).map((item, i) => (
                    <motion.div
                      key={item.recordId}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <WorkshopBox title={`${item.queueToken} — ${item.patientName}`} icon="💊" delay={0}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {item.prescriptions.map((rx, j) => (
                            <motion.div
                              key={j}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: j * 0.04 }}
                              style={{
                                display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr 1fr", gap: 16, alignItems: "center",
                                padding: "14px 16px", borderRadius: 12,
                                background: theme.navInactiveBg,
                                border: "1px solid rgba(184,115,51,0.1)",
                              }}
                            >
                              <span style={{
                                fontSize: 11, fontWeight: 700, width: 28, height: 28, borderRadius: 8,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: "rgba(184,115,51,0.08)", border: "1px solid rgba(184,115,51,0.15)", color: "#D4956B",
                              }}>
                                {j + 1}
                              </span>
                              <span style={{ fontSize: 14.5, fontWeight: 700, color: "white" }}>{rx.medication}</span>
                              <span style={{ fontSize: 14.5, fontWeight: 500, color: "#94A3B8" }}>{rx.dosage}</span>
                              <span style={{ fontSize: 14.5, fontWeight: 500, color: "#94A3B8" }}>{rx.frequency}</span>
                              <span style={{ fontSize: 14.5, fontWeight: 500, color: "#94A3B8" }}>{rx.duration}</span>
                            </motion.div>
                          ))}
                        </div>

                        {activeNav === "prescriptions" && (
                          <motion.button
                            whileHover={{ scale: 1.01, boxShadow: `0 8px 40px ${COPPER}30` }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => markDispensed(item.recordId)}
                            disabled={dispensing === item.recordId}
                            style={{
                              width: "100%", marginTop: 16, padding: "14px 24px", borderRadius: 14,
                              fontSize: 15, fontWeight: 600, color: "white", cursor: dispensing === item.recordId ? "wait" : "pointer",
                              background: `linear-gradient(135deg, ${COPPER}, #D4956B)`,
                              border: "none", boxShadow: `0 4px 24px ${COPPER}20`,
                              transition: "all 0.3s", opacity: dispensing === item.recordId ? 0.5 : 1,
                            }}
                          >
                            {dispensing === item.recordId ? "Dispensing..." : "Mark As Dispensed"}
                          </motion.button>
                        )}

                        {activeNav === "dispensed" && (
                          <div style={{ marginTop: 12, display: "flex", alignItems: "center" }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#10B981", textTransform: "uppercase", letterSpacing: "1px" }}>Dispensed</span>
                          </div>
                        )}
                      </WorkshopBox>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════ INVENTORY VIEW (PLACEHOLDER) ═══════ */}
          {activeNav === "inventory" && (
            <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkshopBox title="Inventory Management" icon="📦" delay={0.05}>
                <div style={{ textAlign: "center", paddingTop: 40, paddingBottom: 40 }}>
                  <div style={{ width: 64, height: 64, margin: "0 auto 16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(184,115,51,0.15)" }}>
                    <span style={{ fontSize: 24 }}>📦</span>
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: "white", marginBottom: 8 }}>Inventory Module Coming Soon</p>
                  <p style={{ fontSize: 14.5, fontWeight: 500, color: "#94A3B8", lineHeight: 1.7 }}>
                    Stock Tracking, Reorder Alerts, And Expiry Management Will Be Available In The Next Update
                  </p>
                </div>
              </WorkshopBox>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
    </StationThemeProvider>
  );
}