"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

interface Inpatient {
  recordId: string;
  patientName: string;
  age?: number;
  gender?: string;
  queueToken: string;
  department: string;
  chiefComplaint?: string;
  wardName: string;
  bedLabel: string;
  admittedAt?: string;
  admittedBy?: string;
  admissionReason?: string;
  discharged: boolean;
  dischargedAt?: string;
  dayCount: number;
  roundsCount: number;
  lastRound: { id: string; date: string; notes: string; recordedBy: string } | null;
}

export default function WardIPDPage() {
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Ward / IPD" stationIcon="🏥" allowedRoles={["nurse", "doctor", "admin"]}>
      {(operator) => <WardIPDContent operator={operator} />}
    </StationGate>
  );
}

function WardIPDContent({ operator }: { operator: OperatorSession }) {
  const theme = useStationTheme();
  const [activeNav, setActiveNav] = useState<"inpatients" | "admit" | "discharged">("inpatients");
  const [inpatients, setInpatients] = useState<Inpatient[]>([]);
  const [counts, setCounts] = useState({ admitted: 0, discharged: 0, total: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Admit form
  const [admitForm, setAdmitForm] = useState({ recordId: "", wardName: "", bedLabel: "", admissionReason: "" });
  const [admitting, setAdmitting] = useState(false);

  // Round form
  const [roundNotes, setRoundNotes] = useState("");
  const [savingRound, setSavingRound] = useState(false);

  // Discharge
  const [dischargeSummary, setDischargeSummary] = useState("");
  const [discharging, setDischarging] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadInpatients = useCallback(async () => {
    try {
      const status = activeNav === "discharged" ? "discharged" : "admitted";
      const res = await fetch(`/api/ward-ipd?hospitalCode=${HOSPITAL_CODE}&status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setInpatients(data.inpatients || []);
        setCounts(data.counts || { admitted: 0, discharged: 0, total: 0 });
      }
    } catch { /* retry */ }
  }, [activeNav]);

  useEffect(() => { loadInpatients(); }, [loadInpatients]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const admitPatient = async () => {
    if (!admitForm.recordId.trim()) return;
    setAdmitting(true);
    try {
      const res = await fetch("/api/ward-ipd", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "admit", ...admitForm, admittedBy: "ward_nurse" }),
      });
      if (res.ok) {
        showToast("Patient Admitted");
        setAdmitForm({ recordId: "", wardName: "", bedLabel: "", admissionReason: "" });
        loadInpatients();
      } else { showToast("Admission Failed", "error"); }
    } catch { showToast("Network Error", "error"); }
    setAdmitting(false);
  };

  const recordRound = async () => {
    if (!selectedPatient || !roundNotes.trim()) return;
    setSavingRound(true);
    try {
      const res = await fetch("/api/ward-ipd", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "daily_round", recordId: selectedPatient, notes: roundNotes, recordedBy: "ward_nurse" }),
      });
      if (res.ok) {
        showToast("Round Recorded");
        setRoundNotes("");
        loadInpatients();
      } else { showToast("Failed", "error"); }
    } catch { showToast("Network Error", "error"); }
    setSavingRound(false);
  };

  const dischargePatient = async () => {
    if (!selectedPatient) return;
    setDischarging(true);
    try {
      const res = await fetch("/api/ward-ipd", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "discharge", recordId: selectedPatient, dischargeSummary, dischargedBy: "ward_nurse" }),
      });
      if (res.ok) {
        showToast("Patient Discharged");
        setSelectedPatient(null);
        setDischargeSummary("");
        loadInpatients();
      } else { showToast("Discharge Failed", "error"); }
    } catch { showToast("Network Error", "error"); }
    setDischarging(false);
  };

  const NAV_ITEMS = [
    { id: "inpatients" as const, icon: "🛏️", label: "Inpatients" },
    { id: "admit" as const, icon: "➕", label: "Admit Patient" },
    { id: "discharged" as const, icon: "📋", label: "Discharged" },
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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#D4956B" }}>Ward / IPD</span>
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
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Currently Admitted", value: counts.admitted, color: "#38BDF8" },
            { label: "Discharged", value: counts.discharged, color: "#22C55E" },
            { label: "Total Records", value: counts.total, color: COPPER },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#64748B", marginBottom: 8 }}>{stat.label}</p>
              <p style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: stat.color }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Nav */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {NAV_ITEMS.map((n) => (
            <motion.button key={n.id} type="button" onClick={() => { setActiveNav(n.id); setSelectedPatient(null); }} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
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
          {/* ADMIT */}
          {activeNav === "admit" && (
            <motion.div key="admit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkshopBox title="Admit Patient" icon="➕">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    { key: "recordId", label: "Patient Record ID", placeholder: "Enter record ID..." },
                    { key: "wardName", label: "Ward Name", placeholder: "e.g. General Ward A" },
                    { key: "bedLabel", label: "Bed Label", placeholder: "e.g. Bed 3A" },
                    { key: "admissionReason", label: "Admission Reason", placeholder: "Reason for admission..." },
                  ].map((f) => (
                    <div key={f.key}>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>{f.label}</label>
                      <input
                        value={admitForm[f.key as keyof typeof admitForm]}
                        onChange={(e) => setAdmitForm({ ...admitForm, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 12, fontSize: 13, color: "white", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(184,115,51,0.15)", outline: "none" }}
                      />
                    </div>
                  ))}
                </div>
                <motion.button type="button" onClick={admitPatient} disabled={admitting || !admitForm.recordId.trim()} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "14px 24px", borderRadius: 14, fontSize: 13, fontWeight: 800, color: "white", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: admitting ? "wait" : "pointer", textTransform: "uppercase", letterSpacing: "1px", opacity: admitting || !admitForm.recordId.trim() ? 0.5 : 1 }}>
                  {admitting ? "Admitting..." : "Admit Patient"}
                </motion.button>
              </WorkshopBox>
            </motion.div>
          )}

          {/* INPATIENTS / DISCHARGED */}
          {(activeNav === "inpatients" || activeNav === "discharged") && (
            <motion.div key={activeNav} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {inpatients.length === 0 ? (
                <WorkshopBox title={activeNav === "inpatients" ? "No Inpatients" : "No Discharged Patients"} icon="🛏️">
                  <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", padding: 24 }}>
                    {activeNav === "inpatients" ? "No Patients Currently Admitted. Use Admit Patient Tab To Add One." : "No Discharged Patients Found."}
                  </p>
                </WorkshopBox>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {inpatients.map((p, i) => (
                    <motion.div key={p.recordId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: `1px solid ${selectedPatient === p.recordId ? COPPER + "40" : "rgba(184,115,51,0.1)"}`, backdropFilter: "blur(12px)" }}>
                      {/* Header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: COPPER }}>{p.queueToken}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{p.patientName}</span>
                          {p.age && <span style={{ fontSize: 11, color: "#64748B" }}>{p.age}y {p.gender || ""}</span>}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, fontFamily: "var(--font-jetbrains-mono), monospace", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", color: "#38BDF8" }}>Day {p.dayCount}</span>
                          <span style={{ fontSize: 11, color: "#64748B" }}>{p.roundsCount} Rounds</span>
                        </div>
                      </div>

                      {/* Details */}
                      <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Ward</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#D4956B" }}>{p.wardName}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Bed</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{p.bedLabel}</p>
                        </div>
                        {p.admissionReason && (
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Reason</p>
                            <p style={{ fontSize: 13, color: "#94A3B8" }}>{p.admissionReason}</p>
                          </div>
                        )}
                        {p.admittedAt && (
                          <div>
                            <p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Admitted</p>
                            <p style={{ fontSize: 11, color: "#94A3B8" }}>{new Date(p.admittedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</p>
                          </div>
                        )}
                      </div>

                      {/* Last round note */}
                      {p.lastRound && (
                        <div style={{ padding: 10, borderRadius: 10, background: theme.navInactiveBg, border: "1px solid rgba(255,255,255,0.04)", marginBottom: 12 }}>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Latest Round — {new Date(p.lastRound.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
                          <p style={{ fontSize: 13, color: "#94A3B8" }}>{p.lastRound.notes}</p>
                        </div>
                      )}

                      {/* Actions for admitted patients */}
                      {!p.discharged && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <motion.button type="button" onClick={() => setSelectedPatient(selectedPatient === p.recordId ? null : p.recordId)}
                            whileHover={{ y: -1 }} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#38BDF8", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", cursor: "pointer", textTransform: "uppercase" }}>
                            {selectedPatient === p.recordId ? "Close" : "Daily Round"}
                          </motion.button>
                          <motion.button type="button" onClick={() => { setSelectedPatient(p.recordId); setDischarging(false); }}
                            whileHover={{ y: -1 }} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", cursor: "pointer", textTransform: "uppercase" }}>
                            Discharge
                          </motion.button>
                        </div>
                      )}

                      {/* Expanded: Daily round or discharge */}
                      {selectedPatient === p.recordId && !p.discharged && (
                        <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: theme.navInactiveBg, border: "1px solid rgba(184,115,51,0.08)" }}>
                          <div style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Round Notes / Discharge Summary</label>
                            <textarea value={roundNotes || dischargeSummary} onChange={(e) => { setRoundNotes(e.target.value); setDischargeSummary(e.target.value); }} rows={3}
                              placeholder="Patient observations, progress notes..."
                              style={{ width: "100%", padding: "10px 14px", borderRadius: 12, fontSize: 13, color: "white", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(184,115,51,0.15)", outline: "none", resize: "vertical" }} />
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <motion.button type="button" onClick={recordRound} disabled={savingRound || !roundNotes.trim()} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                              style={{ flex: 1, padding: "10px 20px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "white", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: savingRound ? "wait" : "pointer", textTransform: "uppercase", opacity: savingRound || !roundNotes.trim() ? 0.5 : 1 }}>
                              {savingRound ? "Saving..." : "Save Round"}
                            </motion.button>
                            <motion.button type="button" onClick={dischargePatient} disabled={discharging} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                              style={{ padding: "10px 20px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", cursor: discharging ? "wait" : "pointer", textTransform: "uppercase" }}>
                              {discharging ? "Discharging..." : "Discharge Patient"}
                            </motion.button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
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