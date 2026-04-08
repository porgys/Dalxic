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

interface MaternityPatient {
  recordId: string; patientName: string; age?: number; queueToken: string; stage: string;
  edd?: string; gravida?: number; para?: number; gestationalWeeks?: number; admittedAt?: string;
  deliveredAt?: string; deliveryMode?: string; babyWeight?: number; babyGender?: string; apgarScores?: string; visitsCount: number;
}

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  antenatal: { bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)", text: "#38BDF8", icon: "🤰" },
  labour: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", text: "#EF4444", icon: "⚡" },
  postnatal: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", text: "#22C55E", icon: "🤱" },
};

const DELIVERY_MODES = [
  { value: "normal", label: "Normal Vaginal", icon: "👶" },
  { value: "assisted", label: "Assisted", icon: "🩺" },
  { value: "caesarean", label: "Caesarean Section", icon: "🔬" },
];

export default function MaternityPage() {
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Maternity" stationIcon="👶" allowedRoles={["nurse", "doctor", "admin"]}>
      {(operator) => <MaternityContent operator={operator} />}
    </StationGate>
  );
}

function MaternityContent({ operator }: { operator: OperatorSession }) {
  const theme = useStationTheme();
  const [activeNav, setActiveNav] = useState<"patients" | "register" | "delivery">("patients");
  const [patients, setPatients] = useState<MaternityPatient[]>([]);
  const [counts, setCounts] = useState({ antenatal: 0, labour: 0, postnatal: 0, total: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Register form
  const [regForm, setRegForm] = useState({ recordId: "", edd: "", gravida: "", para: "", gestationalWeeks: "" });
  const [registering, setRegistering] = useState(false);

  // Delivery form
  const [delForm, setDelForm] = useState({ recordId: "", deliveryMode: "normal", babyWeight: "", babyGender: "", apgarScores: "", complications: "" });
  const [delivering, setDelivering] = useState(false);

  // Visit form
  const [visitRecordId, setVisitRecordId] = useState<string | null>(null);
  const [visitNotes, setVisitNotes] = useState("");
  const [savingVisit, setSavingVisit] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 4000); };

  const loadPatients = useCallback(async () => {
    try { const res = await fetch(`/api/maternity?hospitalCode=${HOSPITAL_CODE}`); if (res.ok) { const d = await res.json(); setPatients(d.patients || []); setCounts(d.counts); } } catch { /* retry */ }
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const registerPatient = async () => {
    if (!regForm.recordId.trim()) return;
    setRegistering(true);
    try {
      const res = await fetch("/api/maternity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "register", recordId: regForm.recordId, edd: regForm.edd || undefined, gravida: regForm.gravida ? parseInt(regForm.gravida) : undefined, para: regForm.para ? parseInt(regForm.para) : undefined, gestationalWeeks: regForm.gestationalWeeks ? parseInt(regForm.gestationalWeeks) : undefined }) });
      if (res.ok) { showToast("Maternity Patient Registered"); setRegForm({ recordId: "", edd: "", gravida: "", para: "", gestationalWeeks: "" }); loadPatients(); }
      else showToast("Registration Failed", "error");
    } catch { showToast("Network Error", "error"); }
    setRegistering(false);
  };

  const recordDelivery = async () => {
    if (!delForm.recordId || !delForm.deliveryMode) return;
    setDelivering(true);
    try {
      const res = await fetch("/api/maternity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "delivery", recordId: delForm.recordId, deliveryMode: delForm.deliveryMode, babyWeight: delForm.babyWeight ? parseFloat(delForm.babyWeight) : undefined, babyGender: delForm.babyGender || undefined, apgarScores: delForm.apgarScores || undefined, complications: delForm.complications || undefined }) });
      if (res.ok) { showToast("Delivery Recorded"); setDelForm({ recordId: "", deliveryMode: "normal", babyWeight: "", babyGender: "", apgarScores: "", complications: "" }); loadPatients(); }
      else showToast("Failed", "error");
    } catch { showToast("Network Error", "error"); }
    setDelivering(false);
  };

  const recordVisit = async () => {
    if (!visitRecordId || !visitNotes.trim()) return;
    setSavingVisit(true);
    try {
      const res = await fetch("/api/maternity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "record_visit", recordId: visitRecordId, type: "antenatal_checkup", notes: visitNotes }) });
      if (res.ok) { showToast("Visit Recorded"); setVisitRecordId(null); setVisitNotes(""); loadPatients(); }
      else showToast("Failed", "error");
    } catch { showToast("Network Error", "error"); }
    setSavingVisit(false);
  };

  const NAV_ITEMS = [
    { id: "patients" as const, icon: "🤱", label: "Patients" },
    { id: "register" as const, icon: "➕", label: "Register" },
    { id: "delivery" as const, icon: "👶", label: "Record Delivery" },
  ];

  return (
    <StationThemeProvider theme={theme}>
    <div style={{ minHeight: "100vh", background: theme.pageBg, position: "relative", overflow: "hidden", transition: "background 0.5s ease" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 55% 35%, ${theme.overlayCopper} 0%, transparent 50%)`, pointerEvents: "none" }} />
      <div style={{ opacity: theme.canvasOpacity, transition: "opacity 0.5s ease" }}><GalaxyCanvas /></div>

      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "16px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: theme.headerBorder, background: theme.headerBg, transition: "background 0.5s ease", backdropFilter: "blur(12px)" }}>
        <Link href="/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: 300, fontSize: 13, color: theme.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", transition: "color 0.4s ease" }}>Dalxic</span>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#D4956B" }}>Maternity</span>
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <ThemeToggle isDayMode={theme.isDayMode} onToggle={theme.toggle} />
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <OperatorBadge session={operator} onLogout={() => window.location.reload()} />
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <span style={{ fontSize: 13, color: theme.textSecondary, transition: "color 0.4s ease" }}>{HOSPITAL_NAME}</span>
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <time suppressHydrationWarning style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 12, color: theme.copperText, transition: "color 0.4s ease" }}>{currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 60px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Antenatal", value: counts.antenatal, color: "#38BDF8" },
            { label: "In Labour", value: counts.labour, color: "#EF4444" },
            { label: "Postnatal", value: counts.postnatal, color: "#22C55E" },
            { label: "Total", value: counts.total, color: COPPER },
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
          {activeNav === "register" && (
            <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkshopBox title="Register Maternity Patient" icon="🤰">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    { key: "recordId", label: "Patient Record ID", placeholder: "Enter record ID...", type: "text" },
                    { key: "edd", label: "Expected Due Date", placeholder: "", type: "date" },
                    { key: "gravida", label: "Gravida", placeholder: "Number of pregnancies", type: "number" },
                    { key: "para", label: "Para", placeholder: "Number of deliveries", type: "number" },
                    { key: "gestationalWeeks", label: "Gestational Weeks", placeholder: "Current weeks", type: "number" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>{f.label}</label>
                      <input type={f.type} value={regForm[f.key as keyof typeof regForm]} onChange={(e) => setRegForm({ ...regForm, [f.key]: e.target.value })} placeholder={f.placeholder}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 12, fontSize: 13, color: "white", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(184,115,51,0.15)", outline: "none", colorScheme: "dark" }} />
                    </div>
                  ))}
                </div>
                <motion.button type="button" onClick={registerPatient} disabled={registering || !regForm.recordId.trim()} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "14px 24px", borderRadius: 14, fontSize: 13, fontWeight: 800, color: "white", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: registering ? "wait" : "pointer", textTransform: "uppercase", letterSpacing: "1px", opacity: registering || !regForm.recordId.trim() ? 0.5 : 1 }}>
                  {registering ? "Registering..." : "Register Patient"}
                </motion.button>
              </WorkshopBox>
            </motion.div>
          )}

          {activeNav === "delivery" && (
            <motion.div key="delivery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkshopBox title="Record Delivery" icon="👶">
                {/* Patient selector from antenatal/labour patients */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Select Patient</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {patients.filter((p) => p.stage === "antenatal" || p.stage === "labour").map((p) => (
                      <motion.button key={p.recordId} type="button" onClick={() => setDelForm({ ...delForm, recordId: p.recordId })} whileHover={{ y: -1 }}
                        style={{ padding: "8px 14px", borderRadius: 10, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", background: delForm.recordId === p.recordId ? "rgba(184,115,51,0.12)" : "rgba(255,255,255,0.03)", color: delForm.recordId === p.recordId ? "#D4956B" : "#64748B", outline: delForm.recordId === p.recordId ? `1px solid ${COPPER}40` : "1px solid rgba(255,255,255,0.05)" }}>
                        {p.queueToken} — {p.patientName}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {DELIVERY_MODES.map((dm) => (
                    <motion.button key={dm.value} type="button" onClick={() => setDelForm({ ...delForm, deliveryMode: dm.value })} whileHover={{ y: -1 }}
                      style={{ flex: 1, padding: "12px", borderRadius: 12, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", textAlign: "center", background: delForm.deliveryMode === dm.value ? "rgba(184,115,51,0.12)" : "rgba(255,255,255,0.03)", color: delForm.deliveryMode === dm.value ? "#D4956B" : "#64748B", outline: delForm.deliveryMode === dm.value ? `1px solid ${COPPER}40` : "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontSize: 20, display: "block", marginBottom: 4 }}>{dm.icon}</span>{dm.label}
                    </motion.button>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    { key: "babyWeight", label: "Baby Weight (kg)", placeholder: "3.2" },
                    { key: "babyGender", label: "Baby Gender", placeholder: "Male / Female" },
                    { key: "apgarScores", label: "APGAR Scores", placeholder: "8/9" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>{f.label}</label>
                      <input value={delForm[f.key as keyof typeof delForm]} onChange={(e) => setDelForm({ ...delForm, [f.key]: e.target.value })} placeholder={f.placeholder}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 12, fontSize: 13, color: "white", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(184,115,51,0.15)", outline: "none" }} />
                    </div>
                  ))}
                </div>

                <motion.button type="button" onClick={recordDelivery} disabled={delivering || !delForm.recordId} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "14px 24px", borderRadius: 14, fontSize: 13, fontWeight: 800, color: "white", background: "linear-gradient(135deg, #22C55E, #16A34A)", border: "none", cursor: delivering ? "wait" : "pointer", textTransform: "uppercase", letterSpacing: "1px", opacity: delivering || !delForm.recordId ? 0.5 : 1 }}>
                  {delivering ? "Recording..." : "Record Delivery"}
                </motion.button>
              </WorkshopBox>
            </motion.div>
          )}

          {activeNav === "patients" && (
            <motion.div key="patients" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {patients.length === 0 ? (
                <WorkshopBox title="No Maternity Patients" icon="🤱"><p style={{ fontSize: 13, color: "#64748B", textAlign: "center", padding: 24 }}>No Active Maternity Patients. Use Register Tab To Add One.</p></WorkshopBox>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {patients.map((p, i) => {
                    const sc = STAGE_COLORS[p.stage] || STAGE_COLORS.antenatal;
                    return (
                      <motion.div key={p.recordId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: `1px solid ${sc.border}`, backdropFilter: "blur(12px)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 16 }}>{sc.icon}</span>
                            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: COPPER }}>{p.queueToken}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{p.patientName}</span>
                            {p.age && <span style={{ fontSize: 11, color: "#64748B" }}>{p.age}y</span>}
                            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>{p.stage}</span>
                          </div>
                          <span style={{ fontSize: 11, color: "#64748B" }}>{p.visitsCount} Visits</span>
                        </div>

                        <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                          {p.gestationalWeeks && <div><p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px" }}>Weeks</p><p style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: "#D4956B" }}>{p.gestationalWeeks}</p></div>}
                          {p.gravida != null && <div><p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px" }}>G</p><p style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{p.gravida}</p></div>}
                          {p.para != null && <div><p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px" }}>P</p><p style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{p.para}</p></div>}
                          {p.edd && <div><p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px" }}>EDD</p><p style={{ fontSize: 13, color: "#94A3B8" }}>{new Date(p.edd).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p></div>}
                          {p.deliveryMode && <div><p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px" }}>Delivery</p><p style={{ fontSize: 12, color: "#22C55E", fontWeight: 700 }}>{p.deliveryMode}</p></div>}
                          {p.babyWeight && <div><p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px" }}>Baby</p><p style={{ fontSize: 12, color: "white" }}>{p.babyGender} — {p.babyWeight}kg</p></div>}
                        </div>

                        {/* Add visit note */}
                        {p.stage === "antenatal" && (
                          <>
                            <motion.button type="button" onClick={() => setVisitRecordId(visitRecordId === p.recordId ? null : p.recordId)} whileHover={{ y: -1 }}
                              style={{ padding: "8px 16px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#38BDF8", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", cursor: "pointer", textTransform: "uppercase" }}>
                              {visitRecordId === p.recordId ? "Close" : "Record Visit"}
                            </motion.button>
                            {visitRecordId === p.recordId && (
                              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                                <input value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} onKeyDown={(e) => e.key === "Enter" && recordVisit()} placeholder="Visit notes..."
                                  style={{ flex: 1, padding: "10px 14px", borderRadius: 12, fontSize: 13, color: "white", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(184,115,51,0.15)", outline: "none" }} />
                                <motion.button type="button" onClick={recordVisit} disabled={savingVisit} whileHover={{ y: -1 }}
                                  style={{ padding: "10px 20px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "white", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: "pointer", textTransform: "uppercase", opacity: savingVisit ? 0.5 : 1 }}>
                                  Save
                                </motion.button>
                              </div>
                            )}
                          </>
                        )}
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