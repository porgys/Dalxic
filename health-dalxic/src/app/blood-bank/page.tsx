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

function GalaxyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = (canvas.width = window.innerWidth), H = (canvas.height = window.innerHeight * 2);
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight * 2; };
    window.addEventListener("resize", resize);
    const stars = Array.from({ length: 420 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.72, vy: (Math.random() - 0.5) * 0.48, r: Math.random() < 0.08 ? Math.random() * 2.5 + 1.2 : Math.random() * 1.2 + 0.2, baseOpacity: Math.random() * 0.65 + 0.15, twinkleSpeed: Math.random() * 0.048 + 0.016, twinkleOffset: Math.random() * Math.PI * 2, color: [[255,255,255],[255,220,180],[184,115,51],[210,150,80],[14,165,233],[160,200,255]][Math.random() < 0.08 ? 2 : Math.random() < 0.12 ? 3 : Math.random() < 0.06 ? 4 : Math.random() < 0.05 ? 5 : Math.floor(Math.random() * 2)] }));
    let t = 0, raf: number;
    function draw() { t++; ctx!.clearRect(0, 0, W, H); stars.forEach((s) => { s.x += s.vx; s.y += s.vy; if (s.x < 0) s.x = W; if (s.x > W) s.x = 0; if (s.y < 0) s.y = H; if (s.y > H) s.y = 0; const f = Math.sin(t * s.twinkleSpeed + s.twinkleOffset) * 0.3 + 0.7; const o = s.baseOpacity * f; ctx!.beginPath(); ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx!.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${o})`; ctx!.fill(); if (s.r > 1.2) { const g = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3); g.addColorStop(0, `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${o * 0.25})`); g.addColorStop(1, "transparent"); ctx!.fillStyle = g; ctx!.fillRect(s.x - s.r * 3, s.y - s.r * 3, s.r * 6, s.r * 6); } }); raf = requestAnimationFrame(draw); }
    draw(); return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

function WorkshopBox({ children, title, icon, delay = 0, className = "" }: { children: React.ReactNode; title: string; icon: string; delay?: number; className?: string }) {
  const theme = useThemeContext();
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }} className={`rounded-2xl p-5 ${className}`}
      style={{ background: theme.cardBg, border: theme.cardBorder, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div className="flex items-center gap-2 mb-4"><span className="text-lg">{icon}</span><h3 className="text-xs font-mono uppercase tracking-wider text-[#D4956B]">{title}</h3></div>
      {children}
    </motion.div>
  );
}

interface BloodInventory { bloodGroup: string; wholeBlood: number; packedRBC: number; platelets: number; ffp: number; }

interface TransfusionRequest {
  id: string; bloodGroup: string; component: string; units: number; urgency: string; status: string;
  requestedBy: string; requestedAt: string; crossMatchedBy?: string; crossMatchedAt?: string;
  issuedBy?: string; issuedAt?: string; notes?: string;
  recordId: string; patientName: string; queueToken: string;
}

const BG_COLORS: Record<string, string> = { "A+": "#38BDF8", "A-": "#0EA5E9", "B+": "#22C55E", "B-": "#16A34A", "AB+": "#A855F7", "AB-": "#7C3AED", "O+": "#F59E0B", "O-": "#D97706" };

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  pending: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#F59E0B" },
  cross_matched: { bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.2)", text: "#A855F7" },
  issued: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", text: "#22C55E" },
};

export default function BloodBankPage() {
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Blood Bank" stationIcon="🩸" allowedRoles={["lab_tech", "nurse", "admin"]}>
      {(operator) => <BloodBankContent operator={operator} />}
    </StationGate>
  );
}

function BloodBankContent({ operator }: { operator: OperatorSession }) {
  const theme = useStationTheme();
  const [activeNav, setActiveNav] = useState<"inventory" | "requests" | "history">("inventory");
  const [inventory, setInventory] = useState<BloodInventory[]>([]);
  const [requests, setRequests] = useState<TransfusionRequest[]>([]);
  const [counts, setCounts] = useState({ pendingRequests: 0, crossMatched: 0, issued: 0, totalRequests: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 4000); };

  const loadData = useCallback(async () => {
    try {
      const view = activeNav === "history" ? "history" : activeNav === "requests" ? "requests" : "";
      const res = await fetch(`/api/blood-bank?hospitalCode=${HOSPITAL_CODE}${view ? `&view=${view}` : ""}`);
      if (res.ok) {
        const d = await res.json();
        if (d.inventory) setInventory(d.inventory);
        if (d.requests) setRequests(d.requests);
        if (d.counts) setCounts(d.counts);
      }
    } catch { /* retry */ }
  }, [activeNav]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const crossMatch = async (req: TransfusionRequest) => {
    setProcessingId(req.id);
    try {
      await fetch("/api/blood-bank", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "cross_match", recordId: req.recordId, requestId: req.id }) });
      showToast(`Cross-Matched — ${req.bloodGroup} ${req.component}`);
      loadData();
    } catch { showToast("Failed", "error"); }
    setProcessingId(null);
  };

  const issueBlood = async (req: TransfusionRequest) => {
    setProcessingId(req.id);
    try {
      await fetch("/api/blood-bank", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "issue", recordId: req.recordId, requestId: req.id }) });
      showToast(`Blood Issued — ${req.bloodGroup} ${req.component}`);
      loadData();
    } catch { showToast("Failed", "error"); }
    setProcessingId(null);
  };

  const NAV_ITEMS = [
    { id: "inventory" as const, icon: "🩸", label: "Inventory" },
    { id: "requests" as const, icon: "📋", label: "Requests" },
    { id: "history" as const, icon: "✅", label: "Issued History" },
  ];

  return (
    <StationThemeProvider theme={theme}>
    <div style={{ minHeight: "100vh", background: theme.pageBg, position: "relative", overflow: "hidden", transition: "background 0.5s ease" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 55% 35%, ${theme.overlayCopper} 0%, transparent 50%)`, pointerEvents: "none" }} />
      <div style={{ opacity: theme.canvasOpacity, transition: "opacity 0.5s ease" }}><GalaxyCanvas /></div>

      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "16px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: theme.headerBorder, background: theme.headerBg, transition: "background 0.5s ease", backdropFilter: "blur(12px)" }}>
        <Link href="/platform" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 300, fontSize: 12, color: theme.textSecondary, letterSpacing: "0.22em", textTransform: "uppercase", transition: "color 0.4s ease" }}>NEXUSLINK</span>
          <span style={{ fontWeight: 500, fontSize: 11, letterSpacing: "0.5em", textTransform: "uppercase", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>HEALTH</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#EF4444" }}>Blood Bank</span>
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <ThemeToggle isDayMode={theme.isDayMode} onToggle={theme.toggle} />
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <OperatorBadge session={operator} onLogout={() => window.location.reload()} />
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <span style={{ fontSize: 12, color: theme.textSecondary, transition: "color 0.4s ease" }}>{HOSPITAL_NAME}</span>
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <time suppressHydrationWarning style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 12, color: theme.copperText, transition: "color 0.4s ease" }}>{currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 60px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Pending Requests", value: counts.pendingRequests, color: "#F59E0B" },
            { label: "Cross-Matched", value: counts.crossMatched, color: "#A855F7" },
            { label: "Issued Today", value: counts.issued, color: "#22C55E" },
            { label: "Total Requests", value: counts.totalRequests, color: COPPER },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#64748B", marginBottom: 8 }}>{stat.label}</p>
              <p style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: stat.color }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {NAV_ITEMS.map((n) => (
            <motion.button key={n.id} type="button" onClick={() => setActiveNav(n.id)} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-body transition-all duration-300"
              style={{ background: activeNav === n.id ? "rgba(184,115,51,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${activeNav === n.id ? COPPER + "40" : "rgba(255,255,255,0.05)"}`, color: activeNav === n.id ? "#D4956B" : "#64748B" }}>
              <span>{n.icon}</span>{n.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeNav === "inventory" && (
            <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkshopBox title="Blood Inventory" icon="🩸">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {inventory.map((bg) => {
                    const total = bg.wholeBlood + bg.packedRBC + bg.platelets + bg.ffp;
                    const color = BG_COLORS[bg.bloodGroup] || COPPER;
                    return (
                      <motion.div key={bg.bloodGroup} whileHover={{ y: -2 }}
                        style={{ padding: 16, borderRadius: 14, background: theme.navInactiveBg, border: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
                        <p style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color, marginBottom: 8 }}>{bg.bloodGroup}</p>
                        <p style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: "white", marginBottom: 8 }}>{total}</p>
                        <div style={{ display: "flex", gap: 4, justifyContent: "center", fontSize: 9, color: "#64748B" }}>
                          <span>WB:{bg.wholeBlood}</span>
                          <span>RBC:{bg.packedRBC}</span>
                          <span>PLT:{bg.platelets}</span>
                          <span>FFP:{bg.ffp}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </WorkshopBox>
            </motion.div>
          )}

          {(activeNav === "requests" || activeNav === "history") && (
            <motion.div key={activeNav} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {requests.length === 0 ? (
                <WorkshopBox title={activeNav === "requests" ? "No Pending Requests" : "No Issued Blood"} icon="📋">
                  <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", padding: 24 }}>
                    {activeNav === "requests" ? "No Active Transfusion Requests." : "No Blood Issued Yet."}
                  </p>
                </WorkshopBox>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {requests.map((req, i) => {
                    const color = BG_COLORS[req.bloodGroup] || COPPER;
                    const ss = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
                    return (
                      <motion.div key={req.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: `1px solid ${req.urgency === "stat" ? "rgba(239,68,68,0.15)" : "rgba(184,115,51,0.1)"}`, backdropFilter: "blur(12px)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color }}>{req.bloodGroup}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{req.patientName}</span>
                            <span style={{ fontSize: 12, fontFamily: "var(--font-jetbrains-mono), monospace", color: COPPER }}>{req.queueToken}</span>
                            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", background: ss.bg, border: `1px solid ${ss.border}`, color: ss.text }}>{req.status.replace("_", " ")}</span>
                            {req.urgency === "stat" && <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", background: "rgba(239,68,68,0.08)", color: "#EF4444" }}>STAT</span>}
                          </div>
                          <span style={{ fontSize: 11, color: "#64748B" }}>{new Date(req.requestedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>

                        <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                          <div><p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Component</p><p style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{req.component.replace("_", " ")}</p></div>
                          <div><p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Units</p><p style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: "#D4956B" }}>{req.units}</p></div>
                          <div><p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Requested By</p><p style={{ fontSize: 12, color: "#94A3B8" }}>{req.requestedBy}</p></div>
                        </div>

                        {req.notes && <p style={{ fontSize: 11, color: "#64748B", marginBottom: 12, fontStyle: "italic" }}>{req.notes}</p>}

                        <div style={{ display: "flex", gap: 8 }}>
                          {req.status === "pending" && (
                            <motion.button type="button" onClick={() => crossMatch(req)} disabled={processingId === req.id} whileHover={{ y: -1 }}
                              style={{ padding: "8px 20px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#A855F7", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", cursor: "pointer", textTransform: "uppercase" }}>
                              Cross-Match
                            </motion.button>
                          )}
                          {req.status === "cross_matched" && (
                            <motion.button type="button" onClick={() => issueBlood(req)} disabled={processingId === req.id} whileHover={{ y: -1 }}
                              style={{ padding: "8px 20px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", cursor: "pointer", textTransform: "uppercase" }}>
                              Issue Blood
                            </motion.button>
                          )}
                          {req.status === "issued" && req.issuedAt && (
                            <span style={{ fontSize: 10, color: "#22C55E" }}>Issued By {req.issuedBy} At {new Date(req.issuedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
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