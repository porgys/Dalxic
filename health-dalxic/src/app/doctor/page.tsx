"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calloutNumber } from "@/lib/voice-callout";
import { StationGate, OperatorBadge } from "@/components/station-gate";
import { useStationTheme, ThemeToggle, StationThemeProvider } from "@/hooks/use-station-theme";
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

/* ─── Compact Dark Input ─── */
function DInput({ label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean }) {
  return (
    <div>
      {label && (
        <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "#64748B", marginBottom: 4 }}>
          {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
        </label>
      )}
      <input
        {...props}
        className="w-full rounded-lg border px-3 py-2 text-[13px] font-body text-white placeholder:text-[#3D4D78] focus:outline-none focus:ring-1 focus:ring-[#B87333]/30 transition-all duration-200"
        style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(184,115,51,0.1)", ...props.style }}
      />
    </div>
  );
}

/* ─── Severity Badge ─── */
function SeverityBadge({ severity }: { severity: number | null }) {
  if (severity == null) return null;
  const color = severity >= 8 ? "#EF4444" : severity >= 4 ? "#F59E0B" : "#22C55E";
  const label = severity >= 8 ? "Critical" : severity >= 4 ? "Moderate" : "Mild";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
      padding: "2px 7px", borderRadius: 4,
      background: `${color}10`, border: `1px solid ${color}20`, color,
      fontFamily: "var(--font-jetbrains-mono), monospace",
    }}>
      {severity >= 8 && <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, animation: "emergencyPulse 1.5s ease-in-out infinite" }} />}
      {severity}/10 {label}
    </span>
  );
}

/* ─── Types ─── */
interface QueuePatient {
  id: string;
  token: string;
  patientName: string;
  chiefComplaint: string;
  department: string;
  symptomSeverity: number | null;
  emergencyFlag: boolean;
  emergencyReason: string | null;
  visitStatus?: string;
  priorityReturn?: boolean;
  createdAt: string;
}

interface ActiveSession {
  recordId: string;
  patient: { fullName: string; dateOfBirth?: string; gender?: string; phone?: string; insuranceId?: string };
  visit: { queueToken: string; chiefComplaint: string; department: string; date: string; symptomSeverity?: number; emergencyFlag?: boolean };
}

function sortQueue(items: QueuePatient[]): QueuePatient[] {
  return [...items].sort((a, b) => {
    // Priority: Emergency > Lab-Return > Normal
    const priorityOf = (p: QueuePatient) => {
      if (p.emergencyFlag) return 0;
      if (p.visitStatus === "lab_results_ready" || p.priorityReturn) return 1;
      return 2;
    };
    const pa = priorityOf(a), pb = priorityOf(b);
    if (pa !== pb) return pa - pb;
    const sevA = a.symptomSeverity ?? 0;
    const sevB = b.symptomSeverity ?? 0;
    if (sevA !== sevB) return sevB - sevA;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

const LAB_TESTS = [
  { value: "fbc", label: "Full Blood Count" },
  { value: "mp", label: "Malaria Parasite" },
  { value: "rbs", label: "Random Blood Sugar" },
  { value: "lfts", label: "Liver Function" },
  { value: "rfts", label: "Renal Function" },
  { value: "urinalysis", label: "Urinalysis" },
  { value: "widal", label: "Widal Test" },
  { value: "hiv", label: "HIV Screening" },
  { value: "hb_electro", label: "Hb Electrophoresis" },
];

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function DoctorPage() {
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Doctor Station" stationIcon="🩺" allowedRoles={["doctor", "specialist", "surgeon", "admin", "super_admin"]}>
      {(operator) => <DoctorContent operator={operator} />}
    </StationGate>
  );
}

function DoctorContent({ operator }: { operator: OperatorSession }) {
  const theme = useStationTheme();
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [diagnosis, setDiagnosis] = useState({ primary: "", notes: "" });
  const [prescriptions, setPrescriptions] = useState([{ medication: "", dosage: "", frequency: "", duration: "" }]);
  const [labReferral, setLabReferral] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [ending, setEnding] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [doctorStatus, setDoctorStatus] = useState<string>("AVAILABLE");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [doctorId] = useState<string | null>(null);
  // Referral state
  const [showReferralPanel, setShowReferralPanel] = useState(false);
  const [referralSpecialty, setReferralSpecialty] = useState("");
  const [referralReason, setReferralReason] = useState("");
  const [referralUrgency, setReferralUrgency] = useState("routine");
  const [referralNotes, setReferralNotes] = useState("");
  const [referralSending, setReferralSending] = useState(false);
  const [incomingReferrals, setIncomingReferrals] = useState<{ id: string; recordId: string; patientName: string; queueToken: string; specialty?: string; reason: string; urgency: string; referredBy: string; referredAt: string; status: string; chiefComplaint: string; currentDiagnosis: string | null }[]>([]);
  const [referralCount, setReferralCount] = useState(0);

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue?hospitalCode=${HOSPITAL_CODE}`);
      if (res.ok) {
        const data = await res.json();
        // Filter: show active, lab_results_ready patients (not closed/paused_for_lab/etc)
        const visible = data.filter((d: { visitStatus?: string }) => {
          const vs = d.visitStatus ?? "active";
          return vs === "active" || vs === "lab_results_ready";
        });
        setQueue(sortQueue(visible.map((d: { id: string; token: string; patientName: string; chiefComplaint: string; department: string; symptomSeverity: number | null; emergencyFlag: boolean; emergencyReason: string | null; visitStatus?: string; priorityReturn?: boolean; createdAt: string }) => ({
          ...d,
          visitStatus: d.visitStatus ?? "active",
          priorityReturn: d.priorityReturn ?? false,
        }))));
      }
    } catch { /* retry */ }
  }, []);

  const loadReferrals = useCallback(async () => {
    try {
      const res = await fetch(`/api/referrals?hospitalCode=${HOSPITAL_CODE}&targetStation=doctor&status=pending`);
      if (res.ok) {
        const data = await res.json();
        setIncomingReferrals(data.referrals);
        setReferralCount(data.counts.pending);
      }
    } catch { /* retry */ }
  }, []);

  useEffect(() => { loadQueue(); loadReferrals(); const i = setInterval(() => { loadQueue(); loadReferrals(); }, 5000); return () => clearInterval(i); }, [loadQueue, loadReferrals]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const updateDoctorStatus = async (newStatus: string) => {
    setDoctorStatus(newStatus);
    setShowStatusMenu(false);
    if (doctorId) {
      try {
        await fetch("/api/doctors", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doctorId, hospitalCode: HOSPITAL_CODE, status: newStatus }) });
      } catch { /* silent */ }
    }
  };

  const callNext = async () => {
    if (queue.length === 0) return;
    const next = queue[0];
    setActiveSession({
      recordId: next.id,
      patient: { fullName: next.patientName },
      visit: { queueToken: next.token, chiefComplaint: next.chiefComplaint, department: next.department, date: next.createdAt, symptomSeverity: next.symptomSeverity ?? undefined, emergencyFlag: next.emergencyFlag },
    });
    setQueue((prev) => prev.slice(1));
    setDoctorStatus("IN_CONSULTATION");

    // Trigger voice callout + Pusher broadcast
    try {
      await fetch("/api/callout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, token: next.token, patientName: next.patientName, department: next.department, calledBy: "Doctor" }) });
    } catch { /* silent */ }
    if (voiceEnabled) {
      try { await calloutNumber({ token: next.token, department: next.department, mode: "speech" }); } catch { /* voice unavailable */ }
    }
  };

  const sendReferral = async () => {
    if (!activeSession || !referralReason.trim()) return;
    setReferralSending(true);
    try {
      await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalCode: HOSPITAL_CODE, action: "refer",
          recordId: activeSession.recordId, targetStation: "doctor",
          specialty: referralSpecialty || null, reason: referralReason,
          urgency: referralUrgency, referredBy: doctorId || "doctor",
          notes: referralNotes || null,
        }),
      });
      setShowReferralPanel(false);
      setReferralSpecialty(""); setReferralReason(""); setReferralUrgency("routine"); setReferralNotes("");
    } catch { /* retry */ }
    finally { setReferralSending(false); }
  };

  const acceptReferral = async (ref: typeof incomingReferrals[0]) => {
    try {
      await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "accept", recordId: ref.recordId, referralId: ref.id, acceptedBy: doctorId || "doctor" }),
      });
      // Load the patient record into active session
      const recordRes = await fetch(`/api/records?recordId=${ref.recordId}`);
      if (recordRes.ok) {
        const record = await recordRes.json();
        const patient = record.patient as { fullName: string; dateOfBirth?: string; gender?: string; phone?: string; insuranceId?: string };
        const visit = record.visit as { queueToken: string; chiefComplaint: string; department: string; date: string; symptomSeverity?: number; emergencyFlag?: boolean };
        setActiveSession({ recordId: ref.recordId, patient, visit });
        setDoctorStatus("IN_CONSULTATION");
      }
      loadReferrals();
    } catch { /* retry */ }
  };

  const escalateToEmergency = async () => {
    if (!activeSession || activeSession.visit.emergencyFlag) return;
    setEscalating(true);
    try {
      const res = await fetch("/api/queue", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordId: activeSession.recordId, hospitalCode: HOSPITAL_CODE, escalationReason: diagnosis.notes || "Doctor escalation", escalatedBy: "doctor" }) });
      if (res.ok) { const r = await res.json(); setActiveSession((p) => p ? { ...p, visit: { ...p.visit, queueToken: r.erToken, emergencyFlag: true } } : null); }
    } catch { /* retry */ } finally { setEscalating(false); }
  };

  const addPrescription = () => setPrescriptions((p) => [...p, { medication: "", dosage: "", frequency: "", duration: "" }]);
  const updatePrescription = (i: number, f: string, v: string) => setPrescriptions((p) => p.map((rx, j) => j === i ? { ...rx, [f]: v } : rx));
  const removePrescription = (i: number) => setPrescriptions((p) => p.filter((_, j) => j !== i));

  // Send to lab — PAUSE session, patient will return with results
  const sendToLab = async () => {
    if (!activeSession || selectedTests.length === 0) return;
    setEnding(true);
    try {
      // Save diagnosis + treatment so far
      await fetch("/api/records", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordId: activeSession.recordId, hospitalCode: HOSPITAL_CODE, diagnosis: { primary: diagnosis.primary, secondary: [], icdCodes: [], notes: diagnosis.notes }, treatment: { prescriptions: prescriptions.filter((p) => p.medication), procedures: [], followUp: null, nextAppointment: null } }) });
      // Pause visit and create lab order
      await fetch("/api/visit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "pause_for_lab", recordId: activeSession.recordId, doctorId: doctorId || "doctor", labTests: selectedTests, clinicalNotes }) });
      // AI summary for partial visit
      await fetch("/api/ai-summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordId: activeSession.recordId }) });
      // Emit CONSULTATION billable
      try { await fetch("/api/billing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "emit_billable", recordId: activeSession.recordId, serviceType: "CONSULTATION", description: `Consultation: ${diagnosis.primary || "General"} (Lab pending)`, renderedBy: doctorId || "doctor" }) }); } catch { /* billing non-blocking */ }
      resetSession();
    } finally { setEnding(false); }
  };

  // End consultation — COMPLETE, advance to pharmacy or awaiting_close
  const endSession = async () => {
    if (!activeSession) return;
    setEnding(true);
    try {
      const validRx = prescriptions.filter((p) => p.medication);
      // Save diagnosis + treatment
      await fetch("/api/records", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordId: activeSession.recordId, hospitalCode: HOSPITAL_CODE, diagnosis: { primary: diagnosis.primary, secondary: [], icdCodes: [], notes: diagnosis.notes }, treatment: { prescriptions: validRx, procedures: [], followUp: null, nextAppointment: null } }) });
      // If lab tests selected WITHOUT pause, still create orders (legacy path)
      if (labReferral && selectedTests.length > 0) {
        await fetch("/api/lab-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId: activeSession.recordId, hospitalCode: HOSPITAL_CODE, tests: selectedTests.map((t) => ({ testName: t, category: "other" })), clinicalNotes }) });
      }
      // Advance visit status: pharmacy if prescriptions, otherwise awaiting_close
      await fetch("/api/visit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "complete_consultation", recordId: activeSession.recordId, doctorId: doctorId || "doctor", hasPrescriptions: validRx.length > 0 }) });
      await fetch("/api/ai-summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordId: activeSession.recordId }) });
      // Emit CONSULTATION billable
      try { await fetch("/api/billing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "emit_billable", recordId: activeSession.recordId, serviceType: "CONSULTATION", description: `Consultation: ${diagnosis.primary || "General"}`, renderedBy: doctorId || "doctor" }) }); } catch { /* billing non-blocking */ }
      resetSession();
    } finally { setEnding(false); }
  };

  const resetSession = () => {
    setActiveSession(null); setDiagnosis({ primary: "", notes: "" }); setPrescriptions([{ medication: "", dosage: "", frequency: "", duration: "" }]); setLabReferral(false); setSelectedTests([]); setClinicalNotes(""); setShowReferralPanel(false); setReferralSpecialty(""); setReferralReason(""); setReferralNotes("");
    setDoctorStatus("AVAILABLE");
    if (doctorId) {
      fetch("/api/doctors", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doctorId, hospitalCode: HOSPITAL_CODE, status: "AVAILABLE" }) }).catch(() => {});
    }
  };

  const emergencyCount = queue.filter((q) => q.emergencyFlag).length;
  const isER = activeSession?.visit.emergencyFlag;

  return (
    <StationThemeProvider theme={theme}>
    <div style={{ minHeight: "100vh", background: theme.pageBg, position: "relative", overflow: "hidden", transition: "background 0.5s ease" }}>
      <style>{`
        @keyframes emergencyPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes emergencyBorder { 0%,100%{border-color:rgba(220,38,38,0.15)} 50%{border-color:rgba(220,38,38,0.35)} }
      `}</style>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 55% 35%, ${theme.overlayCopper} 0%, transparent 50%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 80% 50%, ${theme.overlayBlue} 0%, transparent 40%)`, pointerEvents: "none" }} />
      <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: theme.gridOpacity, transition: "opacity 0.5s ease" }} />
      <div style={{ opacity: theme.canvasOpacity, transition: "opacity 0.5s ease" }}><GalaxyCanvas /></div>

      {/* ─── Header ─── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "10px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: theme.headerBorder, background: theme.headerBg, transition: "background 0.5s ease",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      }}>
        <div onClick={() => window.location.href = "/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh"} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 300, fontSize: 13, color: theme.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", transition: "color 0.4s ease" }}>Dalxic</span>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#D4956B" }}>Doctor Station</span>
          {/* Doctor Status Indicator */}
          <div style={{ position: "relative" }}>
            <button type="button" onClick={() => setShowStatusMenu(!showStatusMenu)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 9, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
                padding: "3px 10px", borderRadius: 5, cursor: "pointer", border: "none",
                background: doctorStatus === "AVAILABLE" ? "rgba(34,197,94,0.1)" : doctorStatus === "ON_BREAK" ? "rgba(245,158,11,0.1)" : doctorStatus === "IN_CONSULTATION" ? "rgba(14,165,233,0.1)" : doctorStatus === "IN_SURGERY" ? "rgba(168,85,247,0.1)" : "rgba(100,116,139,0.1)",
                color: doctorStatus === "AVAILABLE" ? "#22C55E" : doctorStatus === "ON_BREAK" ? "#F59E0B" : doctorStatus === "IN_CONSULTATION" ? "#38BDF8" : doctorStatus === "IN_SURGERY" ? "#A855F7" : "#64748B",
              }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
              {doctorStatus.replace(/_/g, " ")}
              <span style={{ fontSize: 7, opacity: 0.6 }}>▼</span>
            </button>
            {showStatusMenu && (
              <div style={{
                position: "absolute", top: "100%", right: 0, marginTop: 4, padding: 4, borderRadius: 10, zIndex: 100, minWidth: 160,
                background: "rgba(10,10,20,0.95)", border: "1px solid rgba(184,115,51,0.15)", backdropFilter: "blur(16px)",
              }}>
                {[
                  { value: "AVAILABLE", color: "#22C55E", label: "Available" },
                  { value: "ON_BREAK", color: "#F59E0B", label: "On Break" },
                  { value: "IN_CONSULTATION", color: "#38BDF8", label: "In Consultation" },
                  { value: "IN_SURGERY", color: "#A855F7", label: "In Surgery" },
                  { value: "ON_CALL", color: "#D4956B", label: "On Call" },
                  { value: "OFF_DUTY", color: "#64748B", label: "Off Duty" },
                ].map((s) => (
                  <button key={s.value} type="button" onClick={() => updateDoctorStatus(s.value)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", borderRadius: 6,
                      background: doctorStatus === s.value ? "rgba(255,255,255,0.05)" : "transparent",
                      border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: s.color,
                      textAlign: "left",
                    }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                    {s.label}
                  </button>
                ))}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", margin: "4px 0" }} />
                <button type="button" onClick={() => { setVoiceEnabled(!voiceEnabled); setShowStatusMenu(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", borderRadius: 6,
                    background: "transparent", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 500, color: "#94A3B8",
                    textAlign: "left",
                  }}>
                  {voiceEnabled ? "🔊" : "🔇"} Voice Callout {voiceEnabled ? "On" : "Off"}
                </button>
              </div>
            )}
          </div>
          {referralCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)", color: "#38BDF8" }}>
              {referralCount} Referral{referralCount !== 1 ? "s" : ""}
            </span>
          )}
          {emergencyCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", color: "#F87171", animation: "emergencyPulse 1.5s ease-in-out infinite" }}>
              {emergencyCount} ER
            </span>
          )}
          <div style={{ width: 1, height: 12, background: "rgba(184,115,51,0.12)" }} />
          <ThemeToggle isDayMode={theme.isDayMode} onToggle={theme.toggle} />
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <OperatorBadge session={operator} onLogout={() => window.location.reload()} />
          <div style={{ width: 1, height: 12, background: "rgba(184,115,51,0.12)" }} />
          <span style={{ fontSize: 11, color: "#64748B" }}>{HOSPITAL_NAME}</span>
          <div style={{ width: 1, height: 12, background: "rgba(184,115,51,0.12)" }} />
          <time suppressHydrationWarning style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, color: COPPER }}>
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </time>
        </div>
      </header>

      {/* ─── Patient Banner (sticky, below header — only when active session) ─── */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: "fixed", top: 42, left: 0, right: 0, zIndex: 49,
              padding: "8px 28px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: isER ? "rgba(30,6,6,0.85)" : "rgba(8,6,16,0.85)",
              borderBottom: `1px solid ${isER ? "rgba(220,38,38,0.12)" : "rgba(184,115,51,0.08)"}`,
              backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              animation: isER ? "emergencyBorder 2s ease-in-out infinite" : undefined,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{
                fontSize: 16, fontWeight: 800, fontFamily: "var(--font-jetbrains-mono), monospace",
                background: isER ? "linear-gradient(135deg, #EF4444, #F87171)" : `linear-gradient(135deg, ${COPPER}, #D4956B)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>{activeSession.visit.queueToken}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{activeSession.patient.fullName}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#64748B" }}>{activeSession.visit.department}</span>
              {activeSession.visit.symptomSeverity != null && <SeverityBadge severity={activeSession.visit.symptomSeverity} />}
              <span style={{ fontSize: 12, color: "#4A5568", fontStyle: "italic" }}>&ldquo;{activeSession.visit.chiefComplaint}&rdquo;</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              {isER ? (
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "3px 10px", borderRadius: 5, background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", color: "#F87171" }}>Emergency</span>
              ) : (
                <button type="button" onClick={escalateToEmergency} disabled={escalating} style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 5, background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.1)", color: "#F87171", cursor: "pointer", opacity: escalating ? 0.5 : 1 }}>
                  Escalate
                </button>
              )}
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "3px 10px", borderRadius: 5, background: "rgba(184,115,51,0.08)", border: theme.cardBorder, color: "#D4956B" }}>In Consultation</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main 3-zone layout ─── */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", height: "100vh", paddingTop: activeSession ? 82 : 42 }}>

        {/* ─── LEFT: Queue Rail ─── */}
        <div style={{ width: 220, flexShrink: 0, padding: "16px 12px", overflowY: "auto", borderRight: "1px solid rgba(184,115,51,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#D4956B", fontFamily: "var(--font-jetbrains-mono), monospace" }}>Queue</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(184,115,51,0.08)", color: "#D4956B", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{queue.length}</span>
          </div>

          {/* Call next button */}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={callNext}
            disabled={queue.length === 0 || !!activeSession}
            style={{
              width: "100%", padding: "8px 0", borderRadius: 10, marginBottom: 12,
              fontSize: 12, fontWeight: 600, color: "white", cursor: (queue.length === 0 || activeSession) ? "not-allowed" : "pointer",
              background: (queue.length === 0 || activeSession) ? "rgba(255,255,255,0.03)" : `linear-gradient(135deg, ${COPPER}, #D4956B)`,
              border: (queue.length === 0 || activeSession) ? "1px solid rgba(255,255,255,0.05)" : "none",
              opacity: (queue.length === 0 || activeSession) ? 0.4 : 1, transition: "all 0.3s",
            }}
          >
            Call Next
          </motion.button>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {queue.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  padding: "10px 10px", borderRadius: 10,
                  background: theme.navInactiveBg,
                  border: `1px solid ${item.emergencyFlag ? "rgba(220,38,38,0.18)" : "rgba(184,115,51,0.08)"}`,
                  animation: item.emergencyFlag ? "emergencyBorder 2s ease-in-out infinite" : undefined,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, fontWeight: 700, color: item.emergencyFlag ? "#F87171" : item.visitStatus === "lab_results_ready" ? "#38BDF8" : COPPER }}>{item.token}</span>
                  <span style={{ fontSize: 9, fontFamily: "var(--font-jetbrains-mono), monospace", color: "#3D4D78" }}>
                    {new Date(item.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {item.visitStatus === "lab_results_ready" && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, marginBottom: 3, background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)", color: "#38BDF8", letterSpacing: "0.3px" }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#38BDF8" }} />
                    Returning — Lab Ready
                  </span>
                )}
                <p style={{ fontSize: 12, fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.patientName}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                  <p style={{ fontSize: 10, fontWeight: 500, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{item.chiefComplaint}</p>
                  <SeverityBadge severity={item.symptomSeverity} />
                </div>
              </motion.div>
            ))}
            {queue.length === 0 && (
              <p style={{ fontSize: 11, color: "#3D4D78", textAlign: "center", paddingTop: 24 }}>No Patients</p>
            )}
          </div>

          {/* Incoming Referrals */}
          {incomingReferrals.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#38BDF8", fontFamily: "var(--font-jetbrains-mono), monospace" }}>Referrals</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(14,165,233,0.08)", color: "#38BDF8", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{incomingReferrals.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {incomingReferrals.map((ref, i) => (
                  <motion.div key={ref.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    style={{ padding: "10px 10px", borderRadius: 10, background: "rgba(14,165,233,0.03)", border: "1px solid rgba(14,165,233,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, fontWeight: 700, color: "#38BDF8" }}>{ref.queueToken}</span>
                      <span style={{
                        fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase",
                        background: ref.urgency === "stat" ? "rgba(220,38,38,0.1)" : ref.urgency === "urgent" ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)",
                        color: ref.urgency === "stat" ? "#F87171" : ref.urgency === "urgent" ? "#F59E0B" : "#22C55E",
                      }}>{ref.urgency}</span>
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ref.patientName}</p>
                    <p style={{ fontSize: 10, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{ref.reason}</p>
                    {ref.specialty && <span style={{ fontSize: 9, fontWeight: 600, color: "#0EA5E9", marginTop: 2, display: "inline-block" }}>{ref.specialty.replace(/_/g, " ").toUpperCase()}</span>}
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => acceptReferral(ref)}
                      style={{ display: "block", width: "100%", marginTop: 6, padding: "5px 0", borderRadius: 6, fontSize: 10, fontWeight: 600, color: "#38BDF8", cursor: "pointer", background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)" }}>
                      Accept Referral
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ─── CENTER: Charting Workspace ─── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px 48px" }}>
          <AnimatePresence mode="wait">
            {activeSession ? (
              <motion.div key="charting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* ── Assessment & Plan — compact stacked sections ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  {/* Diagnosis */}
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    style={{ padding: 16, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: 14 }}>🩺</span>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#D4956B", fontFamily: "var(--font-jetbrains-mono), monospace" }}>Diagnosis</span>
                    </div>
                    <DInput label="Primary Diagnosis" placeholder="e.g. Plasmodium Falciparum Malaria" value={diagnosis.primary} onChange={(e) => setDiagnosis((d) => ({ ...d, primary: e.target.value }))} required />
                    <div style={{ marginTop: 10 }}>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "#64748B", marginBottom: 4 }}>Clinical Notes</label>
                      <textarea
                        rows={3}
                        className="w-full rounded-lg border px-3 py-2 text-[13px] font-body text-white placeholder:text-[#3D4D78] focus:outline-none focus:ring-1 focus:ring-[#B87333]/30 resize-none transition-all duration-200"
                        style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(184,115,51,0.1)" }}
                        placeholder="History, examination findings, observations..."
                        value={diagnosis.notes}
                        onChange={(e) => setDiagnosis((d) => ({ ...d, notes: e.target.value }))}
                      />
                    </div>
                  </motion.div>

                  {/* Lab Referral */}
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    style={{ padding: 16, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: 14 }}>🧪</span>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#D4956B", fontFamily: "var(--font-jetbrains-mono), monospace" }}>Lab Orders</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: labReferral ? 10 : 0 }}>
                      <input type="checkbox" id="labRef" checked={labReferral} onChange={(e) => setLabReferral(e.target.checked)} style={{ width: 14, height: 14, accentColor: COPPER }} />
                      <label htmlFor="labRef" style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8", cursor: "pointer" }}>Order Lab Tests</label>
                    </div>
                    {labReferral && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <select
                          className="w-full rounded-lg border px-3 py-2 text-[13px] font-body text-white focus:outline-none focus:ring-1 focus:ring-[#B87333]/30 transition-all duration-200 appearance-none"
                          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(184,115,51,0.1)" }}
                          value="" onChange={(e) => { if (e.target.value && !selectedTests.includes(e.target.value)) setSelectedTests((p) => [...p, e.target.value]); }}>
                          <option value="" style={{ background: theme.selectOptionBg }}>Add Test...</option>
                          {LAB_TESTS.map((t) => <option key={t.value} value={t.value} style={{ background: theme.selectOptionBg }}>{t.label}</option>)}
                        </select>
                        {selectedTests.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {selectedTests.map((test) => (
                              <span key={test} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.1)", color: "#38BDF8" }}>
                                {LAB_TESTS.find((t) => t.value === test)?.label ?? test}
                                <button type="button" onClick={() => setSelectedTests((p) => p.filter((t) => t !== test))} style={{ color: "#EF4444", cursor: "pointer", background: "none", border: "none", fontSize: 10, lineHeight: 1 }}>x</button>
                              </span>
                            ))}
                          </div>
                        )}
                        <textarea
                          rows={2}
                          className="w-full rounded-lg border px-3 py-2 text-[13px] font-body text-white placeholder:text-[#3D4D78] focus:outline-none focus:ring-1 focus:ring-[#B87333]/30 resize-none transition-all duration-200"
                          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(184,115,51,0.1)" }}
                          placeholder="Clinical context for lab..."
                          value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)}
                        />
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Prescriptions — full width, compact table */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}
                  style={{ padding: 16, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>💊</span>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#D4956B", fontFamily: "var(--font-jetbrains-mono), monospace" }}>Prescriptions</span>
                    </div>
                    <button type="button" onClick={addPrescription} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "#64748B", cursor: "pointer" }}>+ Add</button>
                  </div>

                  {/* Table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 28px", gap: 8, marginBottom: 6, padding: "0 2px" }}>
                    {["Medication", "Dosage", "Frequency", "Duration", ""].map((h) => (
                      <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#3D4D78" }}>{h}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {prescriptions.map((rx, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 28px", gap: 8, alignItems: "center" }}>
                        <DInput placeholder="Amoxicillin" value={rx.medication} onChange={(e) => updatePrescription(i, "medication", e.target.value)} />
                        <DInput placeholder="500mg" value={rx.dosage} onChange={(e) => updatePrescription(i, "dosage", e.target.value)} />
                        <DInput placeholder="3x Daily" value={rx.frequency} onChange={(e) => updatePrescription(i, "frequency", e.target.value)} />
                        <DInput placeholder="2 Weeks" value={rx.duration} onChange={(e) => updatePrescription(i, "duration", e.target.value)} />
                        {prescriptions.length > 1 ? (
                          <button type="button" onClick={() => removePrescription(i)} style={{ width: 24, height: 24, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.08)", color: "#EF4444", cursor: "pointer", fontSize: 11 }}>x</button>
                        ) : <div />}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Specialist Referral */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
                  style={{ padding: 16, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(14,165,233,0.1)", backdropFilter: "blur(12px)", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showReferralPanel ? 12 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>🔗</span>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#38BDF8", fontFamily: "var(--font-jetbrains-mono), monospace" }}>Refer To Specialist</span>
                    </div>
                    <button type="button" onClick={() => setShowReferralPanel(!showReferralPanel)}
                      style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: showReferralPanel ? "rgba(14,165,233,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${showReferralPanel ? "rgba(14,165,233,0.2)" : "rgba(255,255,255,0.05)"}`, color: showReferralPanel ? "#38BDF8" : "#64748B", cursor: "pointer" }}>
                      {showReferralPanel ? "Close" : "+ Refer"}
                    </button>
                  </div>
                  {showReferralPanel && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "#64748B", marginBottom: 4 }}>Specialty</label>
                          <select value={referralSpecialty} onChange={(e) => setReferralSpecialty(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 text-[13px] font-body text-white focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]/30 appearance-none"
                            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(14,165,233,0.1)" }}>
                            <option value="" style={{ background: theme.selectOptionBg }}>Select Specialty...</option>
                            {["Cardiologist", "Neurologist", "Orthopedic", "Dermatologist", "Pediatrician", "Gynecologist", "Surgeon", "Ophthalmologist", "ENT Specialist", "Psychiatrist", "Urologist", "Oncologist", "Pulmonologist", "Endocrinologist"].map((s) => (
                              <option key={s} value={s.toLowerCase().replace(/\s+/g, "_")} style={{ background: theme.selectOptionBg }}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "#64748B", marginBottom: 4 }}>Urgency</label>
                          <div style={{ display: "flex", gap: 6 }}>
                            {(["routine", "urgent", "stat"] as const).map((u) => (
                              <button key={u} type="button" onClick={() => setReferralUrgency(u)}
                                style={{
                                  flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", cursor: "pointer",
                                  background: referralUrgency === u ? (u === "stat" ? "rgba(220,38,38,0.1)" : u === "urgent" ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)") : "rgba(255,255,255,0.02)",
                                  border: `1px solid ${referralUrgency === u ? (u === "stat" ? "rgba(220,38,38,0.3)" : u === "urgent" ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.3)") : "rgba(255,255,255,0.05)"}`,
                                  color: referralUrgency === u ? (u === "stat" ? "#F87171" : u === "urgent" ? "#F59E0B" : "#22C55E") : "#64748B",
                                }}>
                                {u}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DInput label="Reason For Referral" placeholder="e.g. Suspected cardiac arrhythmia, needs ECG and specialist evaluation" required
                        value={referralReason} onChange={(e) => setReferralReason(e.target.value)} />
                      <textarea rows={2} placeholder="Additional notes for the receiving specialist..."
                        className="w-full rounded-lg border px-3 py-2 text-[13px] font-body text-white placeholder:text-[#3D4D78] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]/30 resize-none"
                        style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(14,165,233,0.1)" }}
                        value={referralNotes} onChange={(e) => setReferralNotes(e.target.value)} />
                      <button type="button" onClick={sendReferral} disabled={referralSending || !referralReason.trim()}
                        style={{
                          padding: "9px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "white", cursor: (!referralReason.trim() || referralSending) ? "not-allowed" : "pointer",
                          background: "linear-gradient(135deg, #0EA5E9, #38BDF8)", border: "none",
                          opacity: (!referralReason.trim() || referralSending) ? 0.4 : 1,
                        }}>
                        {referralSending ? "Sending..." : "Send Referral"}
                      </button>
                    </div>
                  )}
                </motion.div>

                {/* Session actions — two paths */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                  style={{ display: "flex", gap: 10 }}>
                  {/* Send to Lab — only if tests selected */}
                  {labReferral && selectedTests.length > 0 && (
                    <motion.button
                      whileHover={{ boxShadow: "0 6px 24px rgba(14,165,233,0.25)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={sendToLab} disabled={ending}
                      style={{
                        flex: 1, padding: "11px 24px", borderRadius: 12,
                        fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer",
                        background: "linear-gradient(135deg, #0EA5E9, #38BDF8)",
                        border: "none", opacity: ending ? 0.6 : 1, transition: "all 0.3s",
                      }}
                    >
                      {ending ? "Sending..." : "Send To Lab — Pause"}
                    </motion.button>
                  )}
                  {/* End consultation — advance to pharmacy or close */}
                  <motion.button
                    whileHover={{ boxShadow: `0 6px 24px ${COPPER}25` }}
                    whileTap={{ scale: 0.98 }}
                    onClick={endSession} disabled={ending}
                    style={{
                      flex: 1, padding: "11px 24px", borderRadius: 12,
                      fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer",
                      background: `linear-gradient(135deg, ${COPPER}, #D4956B)`,
                      border: "none", opacity: ending ? 0.6 : 1, transition: "all 0.3s",
                    }}
                  >
                    {ending ? "Saving..." : prescriptions.some((p) => p.medication) ? "End — Send To Pharmacy" : "End Consultation — Close"}
                  </motion.button>
                </motion.div>
              </motion.div>
            ) : (
              /* ── Empty state ── */
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70vh", textAlign: "center" }}>
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(184,115,51,0.15)", marginBottom: 16 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(184,115,51,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(184,115,51,0.3)" }} />
                  </div>
                </motion.div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 4 }}>No Active Consultation</p>
                <p style={{ fontSize: 12, fontWeight: 500, color: "#64748B", marginBottom: 16 }}>
                  {queue.length > 0 ? `${queue.length} patient${queue.length !== 1 ? "s" : ""} waiting` : "Queue is empty"}
                </p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={callNext} disabled={queue.length === 0}
                  style={{ padding: "10px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "white", cursor: queue.length === 0 ? "not-allowed" : "pointer", background: queue.length === 0 ? "rgba(255,255,255,0.03)" : `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: queue.length === 0 ? "1px solid rgba(255,255,255,0.05)" : "none", opacity: queue.length === 0 ? 0.4 : 1 }}>
                  Call Next Patient
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
    </StationThemeProvider>
  );
}