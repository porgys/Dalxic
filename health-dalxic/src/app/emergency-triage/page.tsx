"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StationGate, OperatorBadge } from "@/components/station-gate";
import { useStationTheme, ThemeToggle, StationThemeProvider, useThemeContext, COPPER, fontFamily } from "@/hooks/use-station-theme";
import { useHospitalName } from "@/hooks/use-hospital-name";
import { useHospitalCode } from "@/hooks/use-hospital-code";
import type { OperatorSession } from "@/types";

const CRIMSON = "#EF4444";

type Severity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type TriageStatus = "incoming" | "active" | "dispatched";
type DispatchTarget = "doctor" | "icu" | "ward" | "observation" | "discharge";

interface TriagePatient {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F";
  chiefComplaint: string;
  mode: "walk-in" | "ambulance" | "referral";
  arrivedAt: string;
  status: TriageStatus;
  severity?: Severity;
  vitals?: { hr?: number; bp?: string; spo2?: number; temp?: number; rr?: number; gcs?: number };
  dispatchedTo?: DispatchTarget;
  dispatchedAt?: string;
  notes?: string;
}

const MOCK_PATIENTS: TriagePatient[] = [
  { id: "T-001", name: "Kwame Mensah", age: 42, gender: "M", chiefComplaint: "Chest pain, radiating to left arm", mode: "ambulance", arrivedAt: "14:02", status: "active", severity: 9, vitals: { hr: 128, bp: "165/95", spo2: 91, temp: 37.1, rr: 26, gcs: 15 } },
  { id: "T-002", name: "Akosua Boateng", age: 28, gender: "F", chiefComplaint: "Severe abdominal pain, vomiting", mode: "walk-in", arrivedAt: "14:18", status: "active", severity: 6, vitals: { hr: 98, bp: "118/76", spo2: 98, temp: 38.2, rr: 18, gcs: 15 } },
  { id: "T-003", name: "Emmanuel Osei", age: 8, gender: "M", chiefComplaint: "High fever, stiff neck", mode: "walk-in", arrivedAt: "14:24", status: "incoming" },
  { id: "T-004", name: "Ama Sarpong", age: 63, gender: "F", chiefComplaint: "Fall, head laceration, conscious", mode: "walk-in", arrivedAt: "14:31", status: "incoming" },
  { id: "T-005", name: "Yaw Darko", age: 35, gender: "M", chiefComplaint: "Motor accident, suspected femur fracture", mode: "ambulance", arrivedAt: "14:34", status: "incoming" },
  { id: "T-006", name: "Efua Mensima", age: 51, gender: "F", chiefComplaint: "Acute shortness of breath", mode: "referral", arrivedAt: "13:48", status: "dispatched", severity: 10, dispatchedTo: "icu", dispatchedAt: "14:05", vitals: { hr: 142, bp: "88/52", spo2: 82, temp: 37.6, rr: 34, gcs: 12 } },
  { id: "T-007", name: "Kofi Appiah", age: 24, gender: "M", chiefComplaint: "Deep laceration, right forearm", mode: "walk-in", arrivedAt: "13:22", status: "dispatched", severity: 4, dispatchedTo: "doctor", dispatchedAt: "13:40" },
];

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
    const stars = Array.from({ length: 420 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.72, vy: (Math.random() - 0.5) * 0.48, r: Math.random() < 0.08 ? Math.random() * 2.5 + 1.2 : Math.random() * 1.2 + 0.2, baseOpacity: Math.random() * 0.65 + 0.15, twinkleSpeed: Math.random() * 0.048 + 0.016, twinkleOffset: Math.random() * Math.PI * 2, color: [[255,255,255],[255,220,180],[184,115,51],[210,150,80],[239,68,68],[160,200,255]][Math.random() < 0.08 ? 2 : Math.random() < 0.12 ? 3 : Math.random() < 0.06 ? 4 : Math.random() < 0.05 ? 5 : Math.floor(Math.random() * 2)] }));
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

function DInput({ label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean }) {
  const t = useThemeContext();
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium font-body mb-1.5" style={{ color: t.textLabel, transition: "color 0.4s ease" }}>
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input {...props} className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body focus:outline-none focus:ring-2 transition-all duration-300"
        style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText, transition: "background 0.4s ease, border-color 0.4s ease, color 0.4s ease" }} />
    </div>
  );
}

function severityColor(s?: Severity): { bg: string; border: string; text: string; label: string } {
  if (!s) return { bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)", text: "#64748B", label: "Unassigned" };
  if (s >= 8) return { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.35)", text: "#EF4444", label: "Critical" };
  if (s >= 5) return { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", text: "#F59E0B", label: "Urgent" };
  if (s >= 3) return { bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.25)", text: "#EAB308", label: "Standard" };
  return { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)", text: "#22C55E", label: "Minor" };
}

export default function EmergencyTriagePage() {
  const HOSPITAL_CODE = useHospitalCode();
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Emergency Triage" stationIcon="🚨" allowedRoles={["nurse", "doctor", "specialist", "admin", "super_admin"]}>
      {(operator) => <TriageContent operator={operator} />}
    </StationGate>
  );
}

function TriageContent({ operator }: { operator: OperatorSession }) {
  const HOSPITAL_CODE = useHospitalCode();
  const theme = useStationTheme();
  const HOSPITAL_NAME = useHospitalName(HOSPITAL_CODE, "Korle Bu Teaching Hospital");
  const [patients, setPatients] = useState<TriagePatient[]>(MOCK_PATIENTS);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeNav, setActiveNav] = useState<"incoming" | "active" | "dispatched" | "intake">("active");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [intakeForm, setIntakeForm] = useState({ name: "", age: "", gender: "M" as "M" | "F", complaint: "", mode: "walk-in" as "walk-in" | "ambulance" | "referral" });
  const [vitalsForm, setVitalsForm] = useState({ hr: "", bp: "", spo2: "", temp: "", rr: "", gcs: "", severity: "5", notes: "" });

  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const incoming = patients.filter((p) => p.status === "incoming");
  const active = [...patients.filter((p) => p.status === "active")].sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0));
  const dispatched = patients.filter((p) => p.status === "dispatched");

  const criticalCount = active.filter((p) => (p.severity ?? 0) >= 8).length;

  const startTriage = (id: string) => {
    setPatients((ps) => ps.map((p) => p.id === id ? { ...p, status: "active" as TriageStatus, severity: 5 } : p));
    setSelectedPatient(id);
    setActiveNav("active");
    showToast("Triage Started");
  };

  const saveVitals = (id: string) => {
    setPatients((ps) => ps.map((p) => p.id === id ? {
      ...p,
      severity: (parseInt(vitalsForm.severity) || 5) as Severity,
      vitals: {
        hr: vitalsForm.hr ? parseInt(vitalsForm.hr) : p.vitals?.hr,
        bp: vitalsForm.bp || p.vitals?.bp,
        spo2: vitalsForm.spo2 ? parseInt(vitalsForm.spo2) : p.vitals?.spo2,
        temp: vitalsForm.temp ? parseFloat(vitalsForm.temp) : p.vitals?.temp,
        rr: vitalsForm.rr ? parseInt(vitalsForm.rr) : p.vitals?.rr,
        gcs: vitalsForm.gcs ? parseInt(vitalsForm.gcs) : p.vitals?.gcs,
      },
      notes: vitalsForm.notes || p.notes,
    } : p));
    setVitalsForm({ hr: "", bp: "", spo2: "", temp: "", rr: "", gcs: "", severity: "5", notes: "" });
    setSelectedPatient(null);
    showToast("Vitals Saved");
  };

  const dispatch = (id: string, target: DispatchTarget) => {
    const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    setPatients((ps) => ps.map((p) => p.id === id ? { ...p, status: "dispatched" as TriageStatus, dispatchedTo: target, dispatchedAt: now } : p));
    const label = target === "doctor" ? "Doctor" : target === "icu" ? "ICU" : target === "ward" ? "Ward" : target === "observation" ? "Observation" : "Discharge";
    showToast(`Dispatched To ${label}`);
  };

  const intakePatient = () => {
    if (!intakeForm.name.trim() || !intakeForm.age.trim() || !intakeForm.complaint.trim()) { showToast("Missing Required Fields", "error"); return; }
    const newId = `T-${String(patients.length + 1).padStart(3, "0")}`;
    const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    setPatients((ps) => [...ps, { id: newId, name: intakeForm.name, age: parseInt(intakeForm.age), gender: intakeForm.gender, chiefComplaint: intakeForm.complaint, mode: intakeForm.mode, arrivedAt: now, status: "incoming" }]);
    setIntakeForm({ name: "", age: "", gender: "M", complaint: "", mode: "walk-in" });
    setActiveNav("incoming");
    showToast("Patient Registered");
  };

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
            <motion.span animate={criticalCount > 0 ? { opacity: [1, 0.4, 1] } : {}} transition={{ duration: 1.2, repeat: Infinity }} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: CRIMSON }}>Emergency Triage</motion.span>
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

        <main style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "80px 32px 60px" }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Incoming", value: incoming.length, color: COPPER },
              { label: "Active Triage", value: active.length, color: "#F59E0B" },
              { label: "Critical", value: criticalCount, color: CRIMSON, pulse: criticalCount > 0 },
              { label: "Dispatched Today", value: dispatched.length, color: "#22C55E" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: `1px solid ${stat.pulse ? "rgba(239,68,68,0.2)" : "rgba(184,115,51,0.1)"}`, backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: theme.textMuted, marginBottom: 8 }}>{stat.label}</p>
                <motion.p animate={stat.pulse ? { opacity: [1, 0.5, 1] } : {}} transition={{ duration: 1.2, repeat: Infinity }} style={{ fontSize: 32, fontWeight: 800, fontFamily: fontFamily.mono, color: stat.color }}>{stat.value}</motion.p>
              </motion.div>
            ))}
          </div>

          {/* Nav */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { id: "active" as const, icon: "🚨", label: `Active (${active.length})` },
              { id: "incoming" as const, icon: "🚪", label: `Incoming (${incoming.length})` },
              { id: "intake" as const, icon: "➕", label: "New Intake" },
              { id: "dispatched" as const, icon: "📋", label: `Dispatched (${dispatched.length})` },
            ].map((n) => (
              <motion.button key={n.id} type="button" onClick={() => setActiveNav(n.id)} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-body transition-all duration-300"
                style={{ background: activeNav === n.id ? "rgba(184,115,51,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${activeNav === n.id ? COPPER + "40" : "rgba(255,255,255,0.05)"}`, color: activeNav === n.id ? "#D4956B" : "#64748B" }}>
                <span>{n.icon}</span>{n.label}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeNav === "intake" && (
              <motion.div key="intake" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <WorkshopBox title="New Emergency Intake" icon="➕">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <DInput label="Patient Name" required value={intakeForm.name} onChange={(e) => setIntakeForm({ ...intakeForm, name: e.target.value })} placeholder="Full name..." />
                    <DInput label="Age" required value={intakeForm.age} onChange={(e) => setIntakeForm({ ...intakeForm, age: e.target.value })} placeholder="Years" type="number" />
                    <div>
                      <label className="block text-xs font-medium font-body mb-1.5" style={{ color: theme.textLabel }}>Gender</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {(["M", "F"] as const).map((g) => (
                          <button key={g} type="button" onClick={() => setIntakeForm({ ...intakeForm, gender: g })}
                            style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", background: intakeForm.gender === g ? "rgba(184,115,51,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${intakeForm.gender === g ? COPPER + "40" : "rgba(255,255,255,0.05)"}`, color: intakeForm.gender === g ? "#D4956B" : "#64748B" }}>
                            {g === "M" ? "Male" : "Female"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <DInput label="Chief Complaint" required value={intakeForm.complaint} onChange={(e) => setIntakeForm({ ...intakeForm, complaint: e.target.value })} placeholder="Why are they here?" />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label className="block text-xs font-medium font-body mb-1.5" style={{ color: theme.textLabel }}>Arrival Mode</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {([{ key: "walk-in", icon: "🚶", label: "Walk-In" }, { key: "ambulance", icon: "🚑", label: "Ambulance" }, { key: "referral", icon: "🏥", label: "Referral" }] as const).map((m) => (
                        <button key={m.key} type="button" onClick={() => setIntakeForm({ ...intakeForm, mode: m.key })}
                          style={{ padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", background: intakeForm.mode === m.key ? "rgba(184,115,51,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${intakeForm.mode === m.key ? COPPER + "40" : "rgba(255,255,255,0.05)"}`, color: intakeForm.mode === m.key ? "#D4956B" : "#64748B" }}>
                          <span style={{ marginRight: 6 }}>{m.icon}</span>{m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <motion.button type="button" onClick={intakePatient} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                    style={{ width: "100%", padding: "14px 24px", borderRadius: 14, fontSize: 13, fontWeight: 800, color: "#fff", background: `linear-gradient(135deg, ${CRIMSON}, #DC2626)`, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Register Emergency Patient
                  </motion.button>
                </WorkshopBox>
              </motion.div>
            )}

            {activeNav === "incoming" && (
              <motion.div key="incoming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {incoming.length === 0 ? (
                  <WorkshopBox title="No Incoming Patients" icon="🚪"><p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 24 }}>Queue Is Empty. New Arrivals Will Appear Here.</p></WorkshopBox>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {incoming.map((p, i) => (
                      <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, fontFamily: fontFamily.mono, color: COPPER }}>{p.id}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>{p.name}</span>
                            <span style={{ fontSize: 11, color: theme.textMuted }}>{p.age}y {p.gender}</span>
                            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", background: p.mode === "ambulance" ? "rgba(239,68,68,0.08)" : p.mode === "referral" ? "rgba(14,165,233,0.08)" : "rgba(100,116,139,0.08)", color: p.mode === "ambulance" ? "#EF4444" : p.mode === "referral" ? "#38BDF8" : "#94A3B8", border: `1px solid ${p.mode === "ambulance" ? "rgba(239,68,68,0.2)" : p.mode === "referral" ? "rgba(14,165,233,0.2)" : "rgba(100,116,139,0.15)"}` }}>{p.mode}</span>
                            <span style={{ fontSize: 10, fontFamily: fontFamily.mono, color: theme.textMuted }}>{p.arrivedAt}</span>
                          </div>
                          <p style={{ fontSize: 13, color: theme.textSecondary }}>{p.chiefComplaint}</p>
                        </div>
                        <motion.button type="button" onClick={() => startTriage(p.id)} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                          style={{ padding: "10px 20px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#fff", background: `linear-gradient(135deg, ${CRIMSON}, #DC2626)`, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Start Triage
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeNav === "active" && (
              <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {active.length === 0 ? (
                  <WorkshopBox title="No Active Triage" icon="🚨"><p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 24 }}>No Patients Currently In Triage.</p></WorkshopBox>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {active.map((p, i) => {
                      const sev = severityColor(p.severity);
                      const isSelected = selectedPatient === p.id;
                      return (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: `1px solid ${sev.border}`, backdropFilter: "blur(12px)" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 13, fontWeight: 800, fontFamily: fontFamily.mono, color: COPPER }}>{p.id}</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>{p.name}</span>
                              <span style={{ fontSize: 11, color: theme.textMuted }}>{p.age}y {p.gender}</span>
                              <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", background: sev.bg, border: `1px solid ${sev.border}`, color: sev.text }}>
                                {sev.label}{p.severity ? ` · ${p.severity}/10` : ""}
                              </span>
                            </div>
                            <span style={{ fontSize: 10, fontFamily: fontFamily.mono, color: theme.textMuted }}>Arrived {p.arrivedAt}</span>
                          </div>

                          <p style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 12 }}>{p.chiefComplaint}</p>

                          {p.vitals && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 12 }}>
                              {[
                                { label: "HR", value: p.vitals.hr ? `${p.vitals.hr}` : "—", unit: "bpm", warn: p.vitals.hr && (p.vitals.hr > 120 || p.vitals.hr < 50) },
                                { label: "BP", value: p.vitals.bp || "—", unit: "", warn: false },
                                { label: "SpO2", value: p.vitals.spo2 ? `${p.vitals.spo2}` : "—", unit: "%", warn: p.vitals.spo2 && p.vitals.spo2 < 92 },
                                { label: "Temp", value: p.vitals.temp ? `${p.vitals.temp}` : "—", unit: "°C", warn: p.vitals.temp && (p.vitals.temp > 38.5 || p.vitals.temp < 35) },
                                { label: "RR", value: p.vitals.rr ? `${p.vitals.rr}` : "—", unit: "/min", warn: p.vitals.rr && (p.vitals.rr > 30 || p.vitals.rr < 8) },
                                { label: "GCS", value: p.vitals.gcs ? `${p.vitals.gcs}` : "—", unit: "/15", warn: p.vitals.gcs && p.vitals.gcs < 12 },
                              ].map((v) => (
                                <div key={v.label} style={{ padding: 8, borderRadius: 8, background: v.warn ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${v.warn ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)"}`, textAlign: "center" }}>
                                  <p style={{ fontSize: 8, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2 }}>{v.label}</p>
                                  <p style={{ fontSize: 15, fontWeight: 800, fontFamily: fontFamily.mono, color: v.warn ? "#EF4444" : theme.textPrimary }}>{v.value}</p>
                                  <p style={{ fontSize: 8, color: theme.textMuted }}>{v.unit}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <motion.button type="button" onClick={() => setSelectedPatient(isSelected ? null : p.id)} whileHover={{ y: -1 }}
                              style={{ padding: "8px 14px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: theme.copperText, background: "rgba(184,115,51,0.08)", border: "1px solid rgba(184,115,51,0.15)", cursor: "pointer", textTransform: "uppercase" }}>
                              {isSelected ? "Close" : "Update Vitals & Severity"}
                            </motion.button>
                            {([
                              { key: "doctor" as const, label: "→ Doctor", color: "#38BDF8" },
                              { key: "icu" as const, label: "→ ICU", color: CRIMSON },
                              { key: "ward" as const, label: "→ Ward", color: "#A855F7" },
                              { key: "observation" as const, label: "→ Observation", color: "#F59E0B" },
                              { key: "discharge" as const, label: "→ Discharge", color: "#22C55E" },
                            ]).map((d) => (
                              <motion.button key={d.key} type="button" onClick={() => dispatch(p.id, d.key)} whileHover={{ y: -1 }}
                                style={{ padding: "8px 14px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: d.color, background: `${d.color}14`, border: `1px solid ${d.color}33`, cursor: "pointer", textTransform: "uppercase" }}>
                                {d.label}
                              </motion.button>
                            ))}
                          </div>

                          {isSelected && (
                            <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: theme.navInactiveBg, border: "1px solid rgba(184,115,51,0.08)" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
                                {[
                                  { key: "hr", label: "HR (bpm)", ph: "80" }, { key: "bp", label: "BP", ph: "120/80" },
                                  { key: "spo2", label: "SpO2 (%)", ph: "98" }, { key: "temp", label: "Temp (°C)", ph: "36.8" },
                                  { key: "rr", label: "RR (/min)", ph: "16" }, { key: "gcs", label: "GCS (/15)", ph: "15" },
                                  { key: "severity", label: "Severity (1-10)", ph: "5" },
                                ].map((f) => (
                                  <DInput key={f.key} label={f.label} value={vitalsForm[f.key as keyof typeof vitalsForm]} onChange={(e) => setVitalsForm({ ...vitalsForm, [f.key]: e.target.value })} placeholder={f.ph} />
                                ))}
                              </div>
                              <div style={{ marginBottom: 12 }}>
                                <DInput label="Triage Notes" value={vitalsForm.notes} onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })} placeholder="Brief assessment..." />
                              </div>
                              <motion.button type="button" onClick={() => saveVitals(p.id)} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                                style={{ width: "100%", padding: "12px 24px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#fff", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: "pointer", textTransform: "uppercase" }}>
                                Save Vitals & Severity
                              </motion.button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeNav === "dispatched" && (
              <motion.div key="dispatched" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {dispatched.length === 0 ? (
                  <WorkshopBox title="No Dispatched Patients Yet" icon="📋"><p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 24 }}>Dispatched Patients Will Appear Here.</p></WorkshopBox>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {dispatched.map((p, i) => {
                      const sev = severityColor(p.severity);
                      const targetLabel = p.dispatchedTo === "doctor" ? "Doctor" : p.dispatchedTo === "icu" ? "ICU" : p.dispatchedTo === "ward" ? "Ward" : p.dispatchedTo === "observation" ? "Observation" : "Discharge";
                      const targetColor = p.dispatchedTo === "doctor" ? "#38BDF8" : p.dispatchedTo === "icu" ? CRIMSON : p.dispatchedTo === "ward" ? "#A855F7" : p.dispatchedTo === "observation" ? "#F59E0B" : "#22C55E";
                      return (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                          style={{ padding: 14, borderRadius: 12, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.08)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, fontFamily: fontFamily.mono, color: COPPER }}>{p.id}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>{p.name}</span>
                            <span style={{ fontSize: 11, color: theme.textMuted }}>{p.age}y {p.gender}</span>
                            {p.severity && (
                              <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, background: sev.bg, border: `1px solid ${sev.border}`, color: sev.text }}>{sev.label}</span>
                            )}
                            <span style={{ fontSize: 12, color: theme.textSecondary, flex: 1 }}>{p.chiefComplaint}</span>
                          </div>
                          <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: `${targetColor}14`, border: `1px solid ${targetColor}33`, color: targetColor }}>
                            → {targetLabel}
                          </span>
                          <span style={{ fontSize: 10, fontFamily: fontFamily.mono, color: theme.textMuted }}>{p.dispatchedAt}</span>
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
