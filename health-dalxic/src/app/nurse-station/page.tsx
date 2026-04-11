"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StationGate, OperatorBadge } from "@/components/station-gate";
import { useStationTheme, ThemeToggle, StationThemeProvider, useThemeContext } from "@/hooks/use-station-theme";
import { getPusherClient } from "@/lib/pusher-client";
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

/* ─── Themed Input ─── */
function DInput({ label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean }) {
  const t = useThemeContext();
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium font-body mb-1.5" style={{ color: t.textLabel, transition: "color 0.4s ease" }}>
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input
        {...props}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body focus:outline-none focus:ring-2 transition-all duration-300"
        style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText, transition: "background 0.4s ease, border-color 0.4s ease, color 0.4s ease" }}
      />
    </div>
  );
}

/* ─── Types ─── */
interface NursePatient {
  recordId: string;
  patientName: string;
  age?: number;
  gender?: string;
  queueToken: string;
  department: string;
  assignedDoctor?: string;
  chiefComplaint?: string;
  latestVitals: VitalEntry | null;
  vitalsCount: number;
  pendingTasks: number;
  completedTasks: number;
  pendingInjections: number;
  tasks: NursingTask[];
  createdAt: string;
}

interface VitalEntry {
  id: string;
  timestamp: string;
  temperature?: number;
  bloodPressure?: string;
  pulse?: number;
  respRate?: number;
  spO2?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  recordedBy: string;
  notes?: string;
}

interface NursingTask {
  id: string;
  type: string;
  description: string;
  status: string;
  assignedTo?: string;
  completedBy?: string;
  completedAt?: string;
  dueAt?: string;
  notes?: string;
}

const TASK_TYPES = [
  { value: "medication", label: "Medication", icon: "💊" },
  { value: "wound_care", label: "Wound Care", icon: "🩹" },
  { value: "observation", label: "Observation", icon: "👁️" },
  { value: "mobility", label: "Mobility", icon: "🚶" },
  { value: "nutrition", label: "Nutrition", icon: "🍽️" },
  { value: "discharge_prep", label: "Discharge Prep", icon: "📋" },
  { value: "other", label: "Other", icon: "📝" },
];

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function NurseStationPage() {
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Nurse Station" stationIcon="👩‍⚕️" allowedRoles={["nurse", "midwife", "admin", "super_admin"]}>
      {(operator) => <NurseStationContent operator={operator} />}
    </StationGate>
  );
}

function NurseStationContent({ operator }: { operator: OperatorSession }) {
  const theme = useStationTheme();
  const [activeNav, setActiveNav] = useState<"overview" | "vitals" | "tasks">("overview");
  const [patients, setPatients] = useState<NursePatient[]>([]);
  const [counts, setCounts] = useState({ totalPatients: 0, needsVitals: 0, pendingTasks: 0, pendingInjections: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Vitals form
  const [vitalsForm, setVitalsForm] = useState({ temperature: "", bloodPressure: "", pulse: "", respRate: "", spO2: "", weight: "", height: "", notes: "" });
  const [savingVitals, setSavingVitals] = useState(false);

  // Task form
  const [taskForm, setTaskForm] = useState({ type: "medication", description: "" });
  const [savingTask, setSavingTask] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadPatients = useCallback(async () => {
    try {
      const res = await fetch(`/api/nurse-station?hospitalCode=${HOSPITAL_CODE}`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
        setCounts(data.counts || { totalPatients: 0, needsVitals: 0, pendingTasks: 0, pendingInjections: 0 });
      }
    } catch { /* retry */ }
  }, []);

  useEffect(() => {
    loadPatients();
    // Pusher: instant refresh on queue events
    const pusher = getPusherClient();
    const ch = pusher?.subscribe(`hospital-${HOSPITAL_CODE}-queue`);
    ch?.bind("patient-added", () => loadPatients());
    ch?.bind("patient-requeued", () => loadPatients());
    return () => { ch?.unbind_all(); pusher?.unsubscribe(`hospital-${HOSPITAL_CODE}-queue`); };
  }, [loadPatients]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(loadPatients, 20000); return () => clearInterval(t); }, [loadPatients]);

  const recordVitals = async () => {
    if (!selectedPatient) return;
    setSavingVitals(true);
    try {
      const payload: Record<string, unknown> = { hospitalCode: HOSPITAL_CODE, action: "record_vitals", recordId: selectedPatient, recordedBy: "nurse" };
      if (vitalsForm.temperature) payload.temperature = parseFloat(vitalsForm.temperature);
      if (vitalsForm.bloodPressure) payload.bloodPressure = vitalsForm.bloodPressure;
      if (vitalsForm.pulse) payload.pulse = parseInt(vitalsForm.pulse);
      if (vitalsForm.respRate) payload.respRate = parseInt(vitalsForm.respRate);
      if (vitalsForm.spO2) payload.spO2 = parseInt(vitalsForm.spO2);
      if (vitalsForm.weight) payload.weight = parseFloat(vitalsForm.weight);
      if (vitalsForm.height) payload.height = parseFloat(vitalsForm.height);
      if (vitalsForm.notes) payload.notes = vitalsForm.notes;

      const res = await fetch("/api/nurse-station", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast("Vitals Recorded");
        setVitalsForm({ temperature: "", bloodPressure: "", pulse: "", respRate: "", spO2: "", weight: "", height: "", notes: "" });
        loadPatients();
      } else { showToast("Failed To Record Vitals", "error"); }
    } catch { showToast("Network Error", "error"); }
    setSavingVitals(false);
  };

  const addTask = async () => {
    if (!selectedPatient || !taskForm.description.trim()) return;
    setSavingTask(true);
    try {
      const res = await fetch("/api/nurse-station", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "add_task", recordId: selectedPatient, type: taskForm.type, description: taskForm.description }),
      });
      if (res.ok) {
        showToast("Task Added");
        setTaskForm({ type: "medication", description: "" });
        loadPatients();
      } else { showToast("Failed To Add Task", "error"); }
    } catch { showToast("Network Error", "error"); }
    setSavingTask(false);
  };

  const completeTask = async (recordId: string, taskId: string) => {
    try {
      const res = await fetch("/api/nurse-station", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "complete_task", recordId, taskId, completedBy: "nurse" }),
      });
      if (res.ok) {
        showToast("Task Completed");
        loadPatients();
      }
    } catch { showToast("Failed", "error"); }
  };

  const selectedPatientData = patients.find((p) => p.recordId === selectedPatient);

  const NAV_ITEMS = [
    { id: "overview" as const, icon: "📋", label: "Patient Overview" },
    { id: "vitals" as const, icon: "🌡️", label: "Record Vitals" },
    { id: "tasks" as const, icon: "✅", label: "Nursing Tasks" },
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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#D4956B" }}>Nurse Station</span>
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
        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Patients", value: counts.totalPatients, color: COPPER },
            { label: "Needs Vitals", value: counts.needsVitals, color: "#F59E0B" },
            { label: "Pending Tasks", value: counts.pendingTasks, color: "#38BDF8" },
            { label: "Pending Injections", value: counts.pendingInjections, color: "#EF4444" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#64748B", marginBottom: 8 }}>{stat.label}</p>
              <p style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: stat.color }}>{stat.value}</p>
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
          {/* ═══════ OVERVIEW ═══════ */}
          {activeNav === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {patients.length === 0 ? (
                <WorkshopBox title="No Patients Today" icon="📋">
                  <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", padding: 24 }}>No Patients Registered Today. Patients Will Appear Here After Front Desk Registration.</p>
                </WorkshopBox>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {patients.map((p, i) => {
                    const needsVitals = p.vitalsCount === 0;
                    const hasUrgent = p.pendingInjections > 0;
                    return (
                      <motion.div key={p.recordId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        onClick={() => { setSelectedPatient(p.recordId); setActiveNav("vitals"); }}
                        style={{ padding: 16, borderRadius: 14, background: theme.cardBg, border: `1px solid ${hasUrgent ? "rgba(239,68,68,0.15)" : needsVitals ? "rgba(245,158,11,0.15)" : "rgba(184,115,51,0.1)"}`, cursor: "pointer", transition: "all 0.3s" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: COPPER }}>{p.queueToken}</span>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{p.patientName}</p>
                              <p style={{ fontSize: 10, color: "#64748B" }}>{p.age ? `${p.age}y` : ""} {p.gender || ""} — {p.department} {p.chiefComplaint ? `— ${p.chiefComplaint}` : ""}</p>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            {needsVitals && (
                              <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#F59E0B" }}>Needs Vitals</span>
                            )}
                            {hasUrgent && (
                              <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>{p.pendingInjections} Injection{p.pendingInjections > 1 ? "s" : ""}</span>
                            )}
                            {p.pendingTasks > 0 && (
                              <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", color: "#38BDF8" }}>{p.pendingTasks} Task{p.pendingTasks > 1 ? "s" : ""}</span>
                            )}
                            {p.latestVitals && (
                              <div style={{ display: "flex", gap: 8, fontSize: 10, fontFamily: "var(--font-jetbrains-mono), monospace", color: "#94A3B8" }}>
                                {p.latestVitals.temperature && <span>🌡️ {p.latestVitals.temperature}°C</span>}
                                {p.latestVitals.bloodPressure && <span>🫀 {p.latestVitals.bloodPressure}</span>}
                                {p.latestVitals.pulse && <span>💓 {p.latestVitals.pulse}</span>}
                                {p.latestVitals.spO2 && <span>🫁 {p.latestVitals.spO2}%</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════ VITALS ═══════ */}
          {activeNav === "vitals" && (
            <motion.div key="vitals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Patient selector */}
              <WorkshopBox title="Select Patient" icon="👤" delay={0} className="mb-4">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {patients.map((p) => (
                    <motion.button key={p.recordId} type="button" onClick={() => setSelectedPatient(p.recordId)} whileHover={{ y: -1 }}
                      style={{
                        padding: "8px 14px", borderRadius: 10, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                        background: selectedPatient === p.recordId ? "rgba(184,115,51,0.12)" : "rgba(255,255,255,0.03)",
                        color: selectedPatient === p.recordId ? "#D4956B" : "#64748B",
                        outline: selectedPatient === p.recordId ? `1px solid ${COPPER}40` : "1px solid rgba(255,255,255,0.05)",
                      }}>
                      {p.queueToken} — {p.patientName}
                      {p.vitalsCount === 0 && <span style={{ marginLeft: 6, color: "#F59E0B" }}>●</span>}
                    </motion.button>
                  ))}
                </div>
              </WorkshopBox>

              {selectedPatient && selectedPatientData && (
                <>
                  {/* Current vitals */}
                  {selectedPatientData.latestVitals && (
                    <WorkshopBox title="Latest Vitals" icon="📊" delay={0.05} className="mb-4">
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                        {[
                          { label: "Temperature", value: selectedPatientData.latestVitals.temperature ? `${selectedPatientData.latestVitals.temperature}°C` : "—", icon: "🌡️", warn: selectedPatientData.latestVitals.temperature && (selectedPatientData.latestVitals.temperature > 38 || selectedPatientData.latestVitals.temperature < 36) },
                          { label: "Blood Pressure", value: selectedPatientData.latestVitals.bloodPressure || "—", icon: "🫀", warn: false },
                          { label: "Pulse", value: selectedPatientData.latestVitals.pulse ? `${selectedPatientData.latestVitals.pulse} bpm` : "—", icon: "💓", warn: selectedPatientData.latestVitals.pulse && (selectedPatientData.latestVitals.pulse > 100 || selectedPatientData.latestVitals.pulse < 60) },
                          { label: "SpO2", value: selectedPatientData.latestVitals.spO2 ? `${selectedPatientData.latestVitals.spO2}%` : "—", icon: "🫁", warn: selectedPatientData.latestVitals.spO2 && selectedPatientData.latestVitals.spO2 < 95 },
                          { label: "Resp Rate", value: selectedPatientData.latestVitals.respRate ? `${selectedPatientData.latestVitals.respRate}/min` : "—", icon: "💨", warn: false },
                          { label: "Weight", value: selectedPatientData.latestVitals.weight ? `${selectedPatientData.latestVitals.weight} kg` : "—", icon: "⚖️", warn: false },
                          { label: "Height", value: selectedPatientData.latestVitals.height ? `${selectedPatientData.latestVitals.height} cm` : "—", icon: "📏", warn: false },
                          { label: "BMI", value: selectedPatientData.latestVitals.bmi ? `${selectedPatientData.latestVitals.bmi}` : "—", icon: "📐", warn: false },
                        ].map((v) => (
                          <div key={v.label} style={{ padding: 12, borderRadius: 10, background: v.warn ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${v.warn ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)"}` }}>
                            <p style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>{v.icon} {v.label}</p>
                            <p style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace", color: v.warn ? "#EF4444" : "white" }}>{v.value}</p>
                          </div>
                        ))}
                      </div>
                    </WorkshopBox>
                  )}

                  {/* Record new vitals */}
                  <WorkshopBox title="Record Vitals" icon="🌡️" delay={0.1}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                      {[
                        { key: "temperature", label: "Temp (°C)", placeholder: "36.5" },
                        { key: "bloodPressure", label: "BP (mmHg)", placeholder: "120/80" },
                        { key: "pulse", label: "Pulse (bpm)", placeholder: "72" },
                        { key: "spO2", label: "SpO2 (%)", placeholder: "98" },
                        { key: "respRate", label: "Resp Rate (/min)", placeholder: "16" },
                        { key: "weight", label: "Weight (kg)", placeholder: "70" },
                        { key: "height", label: "Height (cm)", placeholder: "170" },
                      ].map((field) => (
                        <DInput
                          key={field.key}
                          label={field.label}
                          value={vitalsForm[field.key as keyof typeof vitalsForm]}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                        />
                      ))}
                      <DInput
                        label="Notes"
                        value={vitalsForm.notes}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                        placeholder="Optional notes..."
                      />
                    </div>
                    <motion.button type="button" onClick={recordVitals} disabled={savingVitals}
                      whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                      style={{ width: "100%", padding: "14px 24px", borderRadius: 14, fontSize: 13, fontWeight: 800, color: "white", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: savingVitals ? "wait" : "pointer", textTransform: "uppercase", letterSpacing: "1px", opacity: savingVitals ? 0.6 : 1 }}>
                      {savingVitals ? "Saving..." : "Record Vitals"}
                    </motion.button>
                  </WorkshopBox>
                </>
              )}
            </motion.div>
          )}

          {/* ═══════ TASKS ═══════ */}
          {activeNav === "tasks" && (
            <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Patient selector */}
              <WorkshopBox title="Select Patient" icon="👤" delay={0} className="mb-4">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {patients.map((p) => (
                    <motion.button key={p.recordId} type="button" onClick={() => setSelectedPatient(p.recordId)} whileHover={{ y: -1 }}
                      style={{
                        padding: "8px 14px", borderRadius: 10, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                        background: selectedPatient === p.recordId ? "rgba(184,115,51,0.12)" : "rgba(255,255,255,0.03)",
                        color: selectedPatient === p.recordId ? "#D4956B" : "#64748B",
                        outline: selectedPatient === p.recordId ? `1px solid ${COPPER}40` : "1px solid rgba(255,255,255,0.05)",
                      }}>
                      {p.queueToken} — {p.patientName}
                      {p.pendingTasks > 0 && <span style={{ marginLeft: 6, fontSize: 10, color: "#38BDF8" }}>({p.pendingTasks})</span>}
                    </motion.button>
                  ))}
                </div>
              </WorkshopBox>

              {selectedPatient && selectedPatientData && (
                <>
                  {/* Existing tasks */}
                  {selectedPatientData.tasks.length > 0 && (
                    <WorkshopBox title="Current Tasks" icon="📋" delay={0.05} className="mb-4">
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {selectedPatientData.tasks.map((task) => {
                          const typeInfo = TASK_TYPES.find((t) => t.value === task.type);
                          return (
                            <div key={task.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 10, background: task.status === "completed" ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${task.status === "completed" ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)"}` }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 14 }}>{typeInfo?.icon || "📝"}</span>
                                <div>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: task.status === "completed" ? "#22C55E" : "white", textDecoration: task.status === "completed" ? "line-through" : "none" }}>{task.description}</p>
                                  <p style={{ fontSize: 10, color: "#64748B" }}>{typeInfo?.label || task.type} {task.completedBy ? `— Done By ${task.completedBy}` : ""}</p>
                                </div>
                              </div>
                              {task.status === "pending" && (
                                <motion.button type="button" onClick={() => completeTask(selectedPatient!, task.id)} whileHover={{ y: -1 }}
                                  style={{ padding: "6px 14px", borderRadius: 8, fontSize: 10, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", cursor: "pointer", textTransform: "uppercase" }}>
                                  ✓ Done
                                </motion.button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </WorkshopBox>
                  )}

                  {/* Add task */}
                  <WorkshopBox title="Add Nursing Task" icon="➕" delay={0.1}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {TASK_TYPES.map((tt) => (
                        <motion.button key={tt.value} type="button" onClick={() => setTaskForm({ ...taskForm, type: tt.value })} whileHover={{ y: -1 }}
                          style={{
                            padding: "6px 12px", borderRadius: 8, fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer",
                            background: taskForm.type === tt.value ? "rgba(184,115,51,0.12)" : "rgba(255,255,255,0.03)",
                            color: taskForm.type === tt.value ? "#D4956B" : "#64748B",
                            outline: taskForm.type === tt.value ? `1px solid ${COPPER}40` : "1px solid rgba(255,255,255,0.05)",
                          }}>
                          {tt.icon} {tt.label}
                        </motion.button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "end" }}>
                      <div style={{ flex: 1 }}>
                        <DInput
                          label="Description"
                          value={taskForm.description}
                          onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && addTask()}
                          placeholder="e.g. Administer Paracetamol 500mg PO 8hrly..."
                        />
                      </div>
                      <motion.button type="button" onClick={addTask} disabled={savingTask || !taskForm.description.trim()}
                        whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                        style={{ padding: "10px 24px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "white", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: savingTask ? "wait" : "pointer", textTransform: "uppercase", letterSpacing: "0.5px", opacity: savingTask || !taskForm.description.trim() ? 0.5 : 1 }}>
                        {savingTask ? "Saving..." : "Add Task"}
                      </motion.button>
                    </div>
                  </WorkshopBox>
                </>
              )}
            </motion.div>
          )}
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