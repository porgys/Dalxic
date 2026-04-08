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

interface ICUPatient {
  recordId: string; patientName: string; age?: number; gender?: string; queueToken: string; bedLabel: string;
  diagnosis: string; ventilator: boolean; ventilatorMode: string; admittedAt?: string; dayCount: number;
  latestObs: { hr?: number; bp?: string; spo2?: number; temp?: number; rr?: number; fio2?: number; gcs?: number; timestamp: string } | null;
  obsCount: number;
}

export default function ICUPage() {
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="ICU" stationIcon="🫀" allowedRoles={["nurse", "doctor", "admin"]}>
      {(operator) => <ICUContent operator={operator} />}
    </StationGate>
  );
}

function ICUContent({ operator }: { operator: OperatorSession }) {
  const theme = useStationTheme();
  const [patients, setPatients] = useState<ICUPatient[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [obsForm, setObsForm] = useState({ hr: "", bp: "", spo2: "", temp: "", rr: "", fio2: "", gcs: "", urine: "", notes: "" });
  const [savingObs, setSavingObs] = useState(false);
  const [admitForm, setAdmitForm] = useState({ recordId: "", bedLabel: "", diagnosis: "", ventilator: false });
  const [admitting, setAdmitting] = useState(false);
  const [activeNav, setActiveNav] = useState<"monitor" | "admit">("monitor");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 4000); };

  const loadPatients = useCallback(async () => {
    try { const res = await fetch(`/api/icu?hospitalCode=${HOSPITAL_CODE}`); if (res.ok) { const d = await res.json(); setPatients(d.patients || []); } } catch { /* retry */ }
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(loadPatients, 30000); return () => clearInterval(t); }, [loadPatients]);

  const recordObs = async () => {
    if (!selectedPatient) return;
    setSavingObs(true);
    try {
      const payload: Record<string, unknown> = { hospitalCode: HOSPITAL_CODE, action: "hourly_obs", recordId: selectedPatient, recordedBy: "icu_nurse" };
      if (obsForm.hr) payload.hr = parseInt(obsForm.hr);
      if (obsForm.bp) payload.bp = obsForm.bp;
      if (obsForm.spo2) payload.spo2 = parseInt(obsForm.spo2);
      if (obsForm.temp) payload.temp = parseFloat(obsForm.temp);
      if (obsForm.rr) payload.rr = parseInt(obsForm.rr);
      if (obsForm.fio2) payload.fio2 = parseFloat(obsForm.fio2);
      if (obsForm.gcs) payload.gcs = parseInt(obsForm.gcs);
      if (obsForm.urine) payload.urine = parseInt(obsForm.urine);
      if (obsForm.notes) payload.notes = obsForm.notes;
      const res = await fetch("/api/icu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { showToast("Observation Recorded"); setObsForm({ hr: "", bp: "", spo2: "", temp: "", rr: "", fio2: "", gcs: "", urine: "", notes: "" }); loadPatients(); }
      else showToast("Failed", "error");
    } catch { showToast("Network Error", "error"); }
    setSavingObs(false);
  };

  const admitPatient = async () => {
    if (!admitForm.recordId.trim()) return;
    setAdmitting(true);
    try {
      const res = await fetch("/api/icu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "admit", ...admitForm, admittedBy: "icu_nurse" }) });
      if (res.ok) { showToast("ICU Admission Complete"); setAdmitForm({ recordId: "", bedLabel: "", diagnosis: "", ventilator: false }); loadPatients(); }
      else showToast("Failed", "error");
    } catch { showToast("Network Error", "error"); }
    setAdmitting(false);
  };

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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#EF4444" }}>ICU</span>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "ICU Patients", value: patients.length, color: "#EF4444" },
            { label: "On Ventilator", value: patients.filter((p) => p.ventilator).length, color: "#F59E0B" },
            { label: "Avg Day Count", value: patients.length > 0 ? Math.round(patients.reduce((s, p) => s + p.dayCount, 0) / patients.length) : 0, color: COPPER },
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
          {[{ id: "monitor" as const, icon: "❤️", label: "Monitor" }, { id: "admit" as const, icon: "➕", label: "ICU Admit" }].map((n) => (
            <motion.button key={n.id} type="button" onClick={() => setActiveNav(n.id)} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-body transition-all duration-300"
              style={{ background: activeNav === n.id ? "rgba(184,115,51,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${activeNav === n.id ? COPPER + "40" : "rgba(255,255,255,0.05)"}`, color: activeNav === n.id ? "#D4956B" : "#64748B" }}>
              <span>{n.icon}</span>{n.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeNav === "admit" && (
            <motion.div key="admit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkshopBox title="ICU Admission" icon="➕">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[{ key: "recordId", label: "Patient Record ID", placeholder: "Enter record ID..." }, { key: "bedLabel", label: "ICU Bed", placeholder: "e.g. ICU-3" }, { key: "diagnosis", label: "Diagnosis", placeholder: "Primary diagnosis..." }].map((f) => (
                    <div key={f.key}>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>{f.label}</label>
                      <input value={admitForm[f.key as keyof typeof admitForm] as string} onChange={(e) => setAdmitForm({ ...admitForm, [f.key]: e.target.value })} placeholder={f.placeholder}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 12, fontSize: 13, color: "white", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(184,115,51,0.15)", outline: "none" }} />
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "end" }}>
                    <motion.button type="button" onClick={() => setAdmitForm({ ...admitForm, ventilator: !admitForm.ventilator })} whileHover={{ y: -1 }}
                      style={{ padding: "10px 20px", borderRadius: 12, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none", background: admitForm.ventilator ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.03)", color: admitForm.ventilator ? "#EF4444" : "#64748B", outline: admitForm.ventilator ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.05)" }}>
                      {admitForm.ventilator ? "🫁 Ventilator: ON" : "🫁 Ventilator: OFF"}
                    </motion.button>
                  </div>
                </div>
                <motion.button type="button" onClick={admitPatient} disabled={admitting || !admitForm.recordId.trim()} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "14px 24px", borderRadius: 14, fontSize: 13, fontWeight: 800, color: "white", background: "linear-gradient(135deg, #EF4444, #DC2626)", border: "none", cursor: admitting ? "wait" : "pointer", textTransform: "uppercase", letterSpacing: "1px", opacity: admitting || !admitForm.recordId.trim() ? 0.5 : 1 }}>
                  {admitting ? "Admitting..." : "Admit To ICU"}
                </motion.button>
              </WorkshopBox>
            </motion.div>
          )}

          {activeNav === "monitor" && (
            <motion.div key="monitor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {patients.length === 0 ? (
                <WorkshopBox title="No ICU Patients" icon="❤️"><p style={{ fontSize: 13, color: "#64748B", textAlign: "center", padding: 24 }}>No Patients Currently In ICU.</p></WorkshopBox>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {patients.map((p, i) => (
                    <motion.div key={p.recordId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: `1px solid ${p.ventilator ? "rgba(239,68,68,0.15)" : "rgba(184,115,51,0.1)"}`, backdropFilter: "blur(12px)" }}>
                      {/* Patient header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: COPPER }}>{p.bedLabel}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{p.patientName}</span>
                          {p.ventilator && <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>Ventilator</span>}
                          <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, fontFamily: "var(--font-jetbrains-mono), monospace", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", color: "#38BDF8" }}>Day {p.dayCount}</span>
                        </div>
                        <span style={{ fontSize: 10, color: "#64748B" }}>{p.obsCount} Observations</span>
                      </div>

                      {/* Diagnosis */}
                      {p.diagnosis && <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 12 }}>{p.diagnosis}</p>}

                      {/* Latest vitals grid */}
                      {p.latestObs && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 12 }}>
                          {[
                            { label: "HR", value: p.latestObs.hr ? `${p.latestObs.hr}` : "—", unit: "bpm", warn: p.latestObs.hr && (p.latestObs.hr > 120 || p.latestObs.hr < 50) },
                            { label: "BP", value: p.latestObs.bp || "—", unit: "", warn: false },
                            { label: "SpO2", value: p.latestObs.spo2 ? `${p.latestObs.spo2}` : "—", unit: "%", warn: p.latestObs.spo2 && p.latestObs.spo2 < 92 },
                            { label: "Temp", value: p.latestObs.temp ? `${p.latestObs.temp}` : "—", unit: "°C", warn: p.latestObs.temp && (p.latestObs.temp > 38.5 || p.latestObs.temp < 35) },
                            { label: "RR", value: p.latestObs.rr ? `${p.latestObs.rr}` : "—", unit: "/min", warn: p.latestObs.rr && (p.latestObs.rr > 30 || p.latestObs.rr < 8) },
                            { label: "FiO2", value: p.latestObs.fio2 ? `${p.latestObs.fio2}` : "—", unit: "%", warn: false },
                            { label: "GCS", value: p.latestObs.gcs ? `${p.latestObs.gcs}` : "—", unit: "/15", warn: p.latestObs.gcs && p.latestObs.gcs < 8 },
                          ].map((v) => (
                            <div key={v.label} style={{ padding: 8, borderRadius: 8, background: v.warn ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${v.warn ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)"}`, textAlign: "center" }}>
                              <p style={{ fontSize: 8, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2 }}>{v.label}</p>
                              <p style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: v.warn ? "#EF4444" : "white" }}>{v.value}</p>
                              <p style={{ fontSize: 8, color: "#4A5568" }}>{v.unit}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Record observation */}
                      <motion.button type="button" onClick={() => setSelectedPatient(selectedPatient === p.recordId ? null : p.recordId)} whileHover={{ y: -1 }}
                        style={{ padding: "8px 16px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#D4956B", background: "rgba(184,115,51,0.08)", border: "1px solid rgba(184,115,51,0.15)", cursor: "pointer", textTransform: "uppercase" }}>
                        {selectedPatient === p.recordId ? "Close" : "Record Observation"}
                      </motion.button>

                      {selectedPatient === p.recordId && (
                        <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: theme.navInactiveBg, border: "1px solid rgba(184,115,51,0.08)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
                            {[
                              { key: "hr", label: "HR (bpm)", ph: "80" }, { key: "bp", label: "BP", ph: "120/80" },
                              { key: "spo2", label: "SpO2 (%)", ph: "98" }, { key: "temp", label: "Temp (°C)", ph: "36.8" },
                              { key: "rr", label: "RR (/min)", ph: "16" }, { key: "fio2", label: "FiO2 (%)", ph: "21" },
                              { key: "gcs", label: "GCS (/15)", ph: "15" }, { key: "urine", label: "Urine (ml/h)", ph: "50" },
                            ].map((f) => (
                              <div key={f.key}>
                                <label style={{ display: "block", fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>{f.label}</label>
                                <input value={obsForm[f.key as keyof typeof obsForm]} onChange={(e) => setObsForm({ ...obsForm, [f.key]: e.target.value })} placeholder={f.ph}
                                  style={{ width: "100%", padding: "8px 10px", borderRadius: 10, fontSize: 13, color: "white", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(184,115,51,0.15)", outline: "none", fontFamily: "var(--font-jetbrains-mono), monospace" }} />
                              </div>
                            ))}
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <input value={obsForm.notes} onChange={(e) => setObsForm({ ...obsForm, notes: e.target.value })} placeholder="Notes..."
                              style={{ width: "100%", padding: "8px 12px", borderRadius: 10, fontSize: 12, color: "white", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(184,115,51,0.15)", outline: "none" }} />
                          </div>
                          <motion.button type="button" onClick={recordObs} disabled={savingObs} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                            style={{ width: "100%", padding: "12px 24px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "white", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: savingObs ? "wait" : "pointer", textTransform: "uppercase", opacity: savingObs ? 0.5 : 1 }}>
                            {savingObs ? "Saving..." : "Save Observation"}
                          </motion.button>
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