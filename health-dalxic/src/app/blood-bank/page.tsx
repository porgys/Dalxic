"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StationGate, OperatorBadge } from "@/components/station-gate";
import { useStationTheme, ThemeToggle, StationThemeProvider, useThemeContext, COPPER, fontFamily } from "@/hooks/use-station-theme";
import { useHospitalName } from "@/hooks/use-hospital-name";
import { useHospitalCode } from "@/hooks/use-hospital-code";
import type { OperatorSession } from "@/types";

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
  const HOSPITAL_CODE = useHospitalCode();
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Blood Bank" stationIcon="🩸" allowedRoles={["lab_tech", "nurse", "doctor", "admin", "super_admin"]}>
      {(operator) => <BloodBankContent operator={operator} />}
    </StationGate>
  );
}

function BloodBankContent({ operator }: { operator: OperatorSession }) {
  const HOSPITAL_CODE = useHospitalCode();
  const HOSPITAL_NAME = useHospitalName(HOSPITAL_CODE, "Korle Bu Teaching Hospital");
  const theme = useStationTheme();
  const [activeNav, setActiveNav] = useState<"inventory" | "requests" | "history" | "donors">("inventory");
  const [inventory, setInventory] = useState<BloodInventory[]>([]);
  const [requests, setRequests] = useState<TransfusionRequest[]>([]);
  const [counts, setCounts] = useState({ pendingRequests: 0, crossMatched: 0, issued: 0, totalRequests: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Donor state
  interface DonorRecord {
    id: string; fullName: string; phone?: string; dateOfBirth?: string; gender?: string; bloodGroup?: string;
    donorToken: string; donorStatus: string; registeredAt: string; registeredBy: string;
    screening?: { weight?: number; bloodPressure?: string; hemoglobin?: number; pulse?: number; temperature?: number; eligible: boolean; deferralReason?: string; screenedAt: string };
    collection?: { bloodGroup: string; component: string; units: number; collectedAt: string };
    createdAt: string;
  }
  const [donors, setDonors] = useState<DonorRecord[]>([]);
  const [donorForm, setDonorForm] = useState({ donorName: "", phone: "", dateOfBirth: "", gender: "", bloodGroup: "" });
  const [screeningForm, setScreeningForm] = useState<{ recordId: string; weight: string; bloodPressure: string; hemoglobin: string; pulse: string; temperature: string } | null>(null);
  const [collectForm, setCollectForm] = useState<{ recordId: string; bloodGroup: string; component: string; units: string } | null>(null);
  const [donorSubmitting, setDonorSubmitting] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 4000); };

  const loadDonors = useCallback(async () => {
    try {
      const res = await fetch(`/api/blood-bank?hospitalCode=${HOSPITAL_CODE}&view=donors`);
      if (res.ok) {
        const d = await res.json();
        if (d.donors) setDonors(d.donors);
      }
    } catch { /* retry */ }
  }, []);

  const loadData = useCallback(async () => {
    if (activeNav === "donors") { loadDonors(); return; }
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
  }, [activeNav, loadDonors]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  // Donor actions
  const registerDonor = async () => {
    if (!donorForm.donorName.trim()) return;
    setDonorSubmitting(true);
    try {
      const res = await fetch("/api/blood-bank", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "register_donor", ...donorForm, registeredBy: operator.operatorName }) });
      if (res.ok) {
        const d = await res.json();
        showToast(`Donor Registered — ${d.donorToken}`);
        setDonorForm({ donorName: "", phone: "", dateOfBirth: "", gender: "", bloodGroup: "" });
        loadDonors();
      } else { const e = await res.json(); showToast(e.error || "Failed", "error"); }
    } catch { showToast("Failed", "error"); }
    setDonorSubmitting(false);
  };

  const screenDonor = async () => {
    if (!screeningForm) return;
    setDonorSubmitting(true);
    try {
      const hb = parseFloat(screeningForm.hemoglobin);
      const eligible = !isNaN(hb) ? hb >= 12.5 : true; // WHO minimum: 12.5 g/dL
      const res = await fetch("/api/blood-bank", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "screen_donor", recordId: screeningForm.recordId, weight: screeningForm.weight ? parseFloat(screeningForm.weight) : null, bloodPressure: screeningForm.bloodPressure || null, hemoglobin: !isNaN(hb) ? hb : null, pulse: screeningForm.pulse ? parseInt(screeningForm.pulse) : null, temperature: screeningForm.temperature ? parseFloat(screeningForm.temperature) : null, eligible, deferralReason: !eligible ? "Hemoglobin below 12.5 g/dL" : null, screenedBy: operator.operatorName }) });
      if (res.ok) {
        const d = await res.json();
        showToast(d.status === "deferred" ? "Donor Deferred — Low Hemoglobin" : "Screening Complete — Eligible");
        setScreeningForm(null);
        loadDonors();
      } else { const e = await res.json(); showToast(e.error || "Failed", "error"); }
    } catch { showToast("Failed", "error"); }
    setDonorSubmitting(false);
  };

  const collectDonation = async () => {
    if (!collectForm || !collectForm.bloodGroup) return;
    setDonorSubmitting(true);
    try {
      const res = await fetch("/api/blood-bank", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "collect_donation", recordId: collectForm.recordId, bloodGroup: collectForm.bloodGroup, component: collectForm.component || "whole_blood", units: collectForm.units ? parseInt(collectForm.units) : 1, collectedBy: operator.operatorName }) });
      if (res.ok) {
        showToast("Donation Collected — Inventory Updated");
        setCollectForm(null);
        loadDonors();
      } else { const e = await res.json(); showToast(e.error || "Failed", "error"); }
    } catch { showToast("Failed", "error"); }
    setDonorSubmitting(false);
  };

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
    { id: "donors" as const, icon: "🫀", label: "Donors" },
    { id: "history" as const, icon: "✅", label: "Issued History" },
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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#EF4444" }}>Blood Bank</span>
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <ThemeToggle isDayMode={theme.isDayMode} onToggle={theme.toggle} />
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <OperatorBadge session={operator} onLogout={() => window.location.reload()} />
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <span style={{ fontSize: 13, color: theme.textSecondary, transition: "color 0.4s ease" }}>{HOSPITAL_NAME}</span>
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <time suppressHydrationWarning style={{ fontFamily: fontFamily.mono, fontSize: 12, color: theme.copperText, transition: "color 0.4s ease" }}>{currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
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
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: theme.textMuted, marginBottom: 8 }}>{stat.label}</p>
              <p style={{ fontSize: 32, fontWeight: 800, fontFamily: fontFamily.mono, color: stat.color }}>{stat.value}</p>
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
                        <p style={{ fontSize: 24, fontWeight: 800, fontFamily: fontFamily.mono, color, marginBottom: 8 }}>{bg.bloodGroup}</p>
                        <p style={{ fontSize: 28, fontWeight: 800, fontFamily: fontFamily.mono, color: theme.textPrimary, marginBottom: 8 }}>{total}</p>
                        <div style={{ display: "flex", gap: 4, justifyContent: "center", fontSize: 9, color: theme.textMuted }}>
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
                  <p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 24 }}>
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
                            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: fontFamily.mono, color }}>{req.bloodGroup}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>{req.patientName}</span>
                            <span style={{ fontSize: 12, fontFamily: fontFamily.mono, color: COPPER }}>{req.queueToken}</span>
                            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", background: ss.bg, border: `1px solid ${ss.border}`, color: ss.text }}>{req.status.replace("_", " ")}</span>
                            {req.urgency === "stat" && <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", background: "rgba(239,68,68,0.08)", color: "#EF4444" }}>STAT</span>}
                          </div>
                          <span style={{ fontSize: 11, color: theme.textMuted }}>{new Date(req.requestedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>

                        <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                          <div><p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase" }}>Component</p><p style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>{req.component.replace("_", " ")}</p></div>
                          <div><p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase" }}>Units</p><p style={{ fontSize: 14, fontWeight: 800, fontFamily: fontFamily.mono, color: theme.copperText }}>{req.units}</p></div>
                          <div><p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase" }}>Requested By</p><p style={{ fontSize: 13, color: theme.textSecondary }}>{req.requestedBy}</p></div>
                        </div>

                        {req.notes && <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 12, fontStyle: "italic" }}>{req.notes}</p>}

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

          {activeNav === "donors" && (
            <motion.div key="donors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Register Donor Form */}
              <WorkshopBox title="Register Walk-In Donor" icon="🫀" delay={0}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 4 }}>Donor Name *</label>
                    <input value={donorForm.donorName} onChange={(e) => setDonorForm({ ...donorForm, donorName: e.target.value })} placeholder="Full Name"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${COPPER}20`, color: theme.textPrimary, fontSize: 13, fontWeight: 600, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 4 }}>Phone</label>
                    <input value={donorForm.phone} onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })} placeholder="0XX XXX XXXX"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${COPPER}20`, color: theme.textPrimary, fontSize: 13, fontWeight: 600, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 4 }}>Gender</label>
                    <select value={donorForm.gender} onChange={(e) => setDonorForm({ ...donorForm, gender: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${COPPER}20`, color: theme.textPrimary, fontSize: 13, fontWeight: 600, outline: "none" }}>
                      <option value="" style={{ background: "#1a1a2e" }}>Select</option>
                      <option value="male" style={{ background: "#1a1a2e" }}>Male</option>
                      <option value="female" style={{ background: "#1a1a2e" }}>Female</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 4 }}>Blood Group (If Known)</label>
                    <select value={donorForm.bloodGroup} onChange={(e) => setDonorForm({ ...donorForm, bloodGroup: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${COPPER}20`, color: theme.textPrimary, fontSize: 13, fontWeight: 600, outline: "none" }}>
                      <option value="" style={{ background: "#1a1a2e" }}>Unknown</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => <option key={bg} value={bg} style={{ background: "#1a1a2e" }}>{bg}</option>)}
                    </select>
                  </div>
                  <motion.button type="button" onClick={registerDonor} disabled={donorSubmitting || !donorForm.donorName.trim()} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                    style={{ padding: "10px 24px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#EF4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px", whiteSpace: "nowrap" }}>
                    Register
                  </motion.button>
                </div>
              </WorkshopBox>

              {/* Screening Modal */}
              {screeningForm && (
                <WorkshopBox title="Screen Donor — Vitals Check" icon="🩺" delay={0.05}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 10, alignItems: "end", marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 4 }}>Weight (Kg)</label>
                      <input value={screeningForm.weight} onChange={(e) => setScreeningForm({ ...screeningForm, weight: e.target.value })} placeholder="50+"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${COPPER}20`, color: theme.textPrimary, fontSize: 13, fontWeight: 600, outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 4 }}>Blood Pressure</label>
                      <input value={screeningForm.bloodPressure} onChange={(e) => setScreeningForm({ ...screeningForm, bloodPressure: e.target.value })} placeholder="120/80"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${COPPER}20`, color: theme.textPrimary, fontSize: 13, fontWeight: 600, outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 4 }}>Hemoglobin (g/dL) *</label>
                      <input value={screeningForm.hemoglobin} onChange={(e) => setScreeningForm({ ...screeningForm, hemoglobin: e.target.value })} placeholder="≥12.5"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${COPPER}20`, color: theme.textPrimary, fontSize: 13, fontWeight: 600, outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 4 }}>Pulse (BPM)</label>
                      <input value={screeningForm.pulse} onChange={(e) => setScreeningForm({ ...screeningForm, pulse: e.target.value })} placeholder="60-100"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${COPPER}20`, color: theme.textPrimary, fontSize: 13, fontWeight: 600, outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 4 }}>Temp (°C)</label>
                      <input value={screeningForm.temperature} onChange={(e) => setScreeningForm({ ...screeningForm, temperature: e.target.value })} placeholder="36.5-37.5"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${COPPER}20`, color: theme.textPrimary, fontSize: 13, fontWeight: 600, outline: "none" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <motion.button type="button" onClick={screenDonor} disabled={donorSubmitting} whileHover={{ y: -1 }}
                      style={{ padding: "10px 24px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", cursor: "pointer", textTransform: "uppercase" }}>
                      Complete Screening
                    </motion.button>
                    <motion.button type="button" onClick={() => setScreeningForm(null)} whileHover={{ y: -1 }}
                      style={{ padding: "10px 24px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: theme.textMuted, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", textTransform: "uppercase" }}>
                      Cancel
                    </motion.button>
                  </div>
                </WorkshopBox>
              )}

              {/* Collection Modal */}
              {collectForm && (
                <WorkshopBox title="Collect Donation" icon="🩸" delay={0.05}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 4 }}>Blood Group *</label>
                      <select value={collectForm.bloodGroup} onChange={(e) => setCollectForm({ ...collectForm, bloodGroup: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${COPPER}20`, color: theme.textPrimary, fontSize: 13, fontWeight: 600, outline: "none" }}>
                        <option value="" style={{ background: "#1a1a2e" }}>Select Blood Group</option>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => <option key={bg} value={bg} style={{ background: "#1a1a2e" }}>{bg}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 4 }}>Component</label>
                      <select value={collectForm.component} onChange={(e) => setCollectForm({ ...collectForm, component: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${COPPER}20`, color: theme.textPrimary, fontSize: 13, fontWeight: 600, outline: "none" }}>
                        <option value="whole_blood" style={{ background: "#1a1a2e" }}>Whole Blood</option>
                        <option value="packed_rbc" style={{ background: "#1a1a2e" }}>Packed RBC</option>
                        <option value="platelets" style={{ background: "#1a1a2e" }}>Platelets</option>
                        <option value="ffp" style={{ background: "#1a1a2e" }}>FFP</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 4 }}>Units</label>
                      <input value={collectForm.units} onChange={(e) => setCollectForm({ ...collectForm, units: e.target.value })} placeholder="1"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${COPPER}20`, color: theme.textPrimary, fontSize: 13, fontWeight: 600, outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <motion.button type="button" onClick={collectDonation} disabled={donorSubmitting || !collectForm.bloodGroup} whileHover={{ y: -1 }}
                        style={{ padding: "10px 24px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#EF4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                        Collect
                      </motion.button>
                      <motion.button type="button" onClick={() => setCollectForm(null)} whileHover={{ y: -1 }}
                        style={{ padding: "10px 24px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: theme.textMuted, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", textTransform: "uppercase" }}>
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                </WorkshopBox>
              )}

              {/* Donor List */}
              <div style={{ marginTop: 16 }}>
                {donors.length === 0 ? (
                  <WorkshopBox title="No Donors Today" icon="🫀">
                    <p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 24 }}>No Walk-In Donors Registered Yet.</p>
                  </WorkshopBox>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {donors.map((d, i) => {
                      const statusColors: Record<string, { bg: string; border: string; text: string }> = {
                        registered: { bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.2)", text: "#38BDF8" },
                        screened: { bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.2)", text: "#A855F7" },
                        collected: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", text: "#22C55E" },
                        deferred: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", text: "#EF4444" },
                      };
                      const ss = statusColors[d.donorStatus] || statusColors.registered;
                      const bgColor = d.bloodGroup ? (BG_COLORS[d.bloodGroup] || COPPER) : "#64748B";
                      return (
                        <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: `1px solid ${COPPER}10`, backdropFilter: "blur(12px)" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, fontFamily: fontFamily.mono, color: bgColor }}>{d.bloodGroup || "?"}</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>{d.fullName}</span>
                              <span style={{ fontSize: 12, fontFamily: fontFamily.mono, color: COPPER }}>{d.donorToken}</span>
                              <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", background: ss.bg, border: `1px solid ${ss.border}`, color: ss.text }}>
                                {d.donorStatus}
                              </span>
                            </div>
                            <span style={{ fontSize: 11, color: theme.textMuted }}>{new Date(d.registeredAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>

                          {d.screening && (
                            <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 11 }}>
                              {d.screening.weight && <span style={{ color: theme.textSecondary }}>Weight: <strong style={{ color: theme.textPrimary }}>{d.screening.weight} Kg</strong></span>}
                              {d.screening.bloodPressure && <span style={{ color: theme.textSecondary }}>BP: <strong style={{ color: theme.textPrimary }}>{d.screening.bloodPressure}</strong></span>}
                              {d.screening.hemoglobin && <span style={{ color: theme.textSecondary }}>Hb: <strong style={{ color: (d.screening.hemoglobin >= 12.5 ? "#22C55E" : "#EF4444") }}>{d.screening.hemoglobin} g/dL</strong></span>}
                              {d.screening.pulse && <span style={{ color: theme.textSecondary }}>Pulse: <strong style={{ color: theme.textPrimary }}>{d.screening.pulse}</strong></span>}
                              {d.screening.deferralReason && <span style={{ color: "#EF4444", fontWeight: 700 }}>Deferred: {d.screening.deferralReason}</span>}
                            </div>
                          )}

                          {d.collection && (
                            <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 11 }}>
                              <span style={{ color: theme.textSecondary }}>Collected: <strong style={{ color: "#22C55E" }}>{d.collection.units} Unit(s) {d.collection.component.replace("_", " ")}</strong></span>
                              <span style={{ color: theme.textSecondary }}>At: {new Date(d.collection.collectedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          )}

                          <div style={{ display: "flex", gap: 8 }}>
                            {d.donorStatus === "registered" && (
                              <motion.button type="button" whileHover={{ y: -1 }}
                                onClick={() => setScreeningForm({ recordId: d.id, weight: "", bloodPressure: "", hemoglobin: "", pulse: "", temperature: "" })}
                                style={{ padding: "8px 20px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#A855F7", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", cursor: "pointer", textTransform: "uppercase" }}>
                                Screen Donor
                              </motion.button>
                            )}
                            {d.donorStatus === "screened" && (
                              <motion.button type="button" whileHover={{ y: -1 }}
                                onClick={() => setCollectForm({ recordId: d.id, bloodGroup: d.bloodGroup || "", component: "whole_blood", units: "1" })}
                                style={{ padding: "8px 20px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#EF4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer", textTransform: "uppercase" }}>
                                Collect Donation
                              </motion.button>
                            )}
                            {d.donorStatus === "collected" && (
                              <span style={{ fontSize: 10, color: "#22C55E", fontWeight: 700 }}>Donation Complete</span>
                            )}
                            {d.donorStatus === "deferred" && (
                              <span style={{ fontSize: 10, color: "#EF4444", fontWeight: 700 }}>Deferred — Not Eligible</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
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