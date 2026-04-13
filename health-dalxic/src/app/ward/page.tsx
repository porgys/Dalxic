"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StationGate, OperatorBadge } from "@/components/station-gate";
import { useStationTheme, ThemeToggle, StationThemeProvider, useThemeContext, COPPER, fontFamily } from "@/hooks/use-station-theme";
import type { OperatorSession } from "@/types";

const HOSPITAL_CODE = "KBH";
const HOSPITAL_NAME = "Korle Bu Teaching Hospital";


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


/* ─── Themed Textarea ─── */
function DTextarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const t = useThemeContext();
  return (
    <div>
      {label && <label className="block text-xs font-medium font-body mb-1.5" style={{ color: t.textLabel, transition: "color 0.4s ease" }}>{label}</label>}
      <textarea
        {...props}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body focus:outline-none focus:ring-2 transition-all duration-300 resize-none"
        style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText, transition: "background 0.4s ease, border-color 0.4s ease, color 0.4s ease" }}
      />
    </div>
  );
}

interface Inpatient {
  recordId: string;
  patientName: string;
  age?: number;
  gender?: string;
  phone?: string;
  queueToken: string;
  department: string;
  chiefComplaint?: string;
  wardName: string;
  bedLabel: string;
  bedId?: string | null;
  admittedAt?: string;
  admittedBy?: string;
  admissionReason?: string;
  assignedDoctor?: string | null;
  assignedDoctorName?: string | null;
  visitingHours?: string | null;
  discharged: boolean;
  dischargedAt?: string;
  dayCount: number;
  roundsCount: number;
  lastRound: { id: string; date: string; notes: string; recordedBy: string } | null;
  prescriptions: Array<{ medication: string; dosage: string; frequency: string; duration: string }>;
  diagnosis?: string | null;
  diagnosisNotes?: string | null;
}

interface WardData {
  id: string; name: string; type: string;
  rooms: Array<{ id: string; name: string; beds: Array<{ id: string; label: string; status: string }> }>;
}

export default function WardIPDPage() {
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Ward / IPD" stationIcon="🏥" allowedRoles={["nurse", "doctor", "specialist", "porter", "admin", "super_admin"]}>
      {(operator) => <WardIPDContent operator={operator} />}
    </StationGate>
  );
}

function WardIPDContent({ operator }: { operator: OperatorSession }) {
  const theme = useStationTheme();
  // Ward scoping — nurses see only their assigned ward, admin/super_admin see all
  const isAdmin = ["admin", "super_admin"].includes(operator.operatorRole);
  // Support both old single-ward and new multi-ward meta shapes
  const operatorMeta = operator.meta as Record<string, unknown> | null;
  const assignedWards: Array<{ id: string; name: string }> = (() => {
    if (!operatorMeta) return [];
    if (Array.isArray(operatorMeta.assignedWards)) return operatorMeta.assignedWards as Array<{ id: string; name: string }>;
    if (operatorMeta.assignedWardId && operatorMeta.assignedWardName) return [{ id: operatorMeta.assignedWardId as string, name: operatorMeta.assignedWardName as string }];
    return [];
  })();
  const assignedWardIds = assignedWards.map(w => w.id);
  const assignedWardNames = assignedWards.map(w => w.name);
  const [activeNav, setActiveNav] = useState<"inpatients" | "admit" | "discharged">("inpatients");
  const [inpatients, setInpatients] = useState<Inpatient[]>([]);
  const [counts, setCounts] = useState({ admitted: 0, discharged: 0, total: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null); // "round" | "discharge" | "prescriptions" | "doctor"
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Admit form — pending orders + bed picker
  interface PendingOrder { recordId: string; patientName: string; age?: number; gender?: string; queueToken: string; department: string; chiefComplaint?: string; admissionReason: string; orderedByName: string; orderedAt?: string; diagnosis?: string | null }
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [admitting, setAdmitting] = useState(false);
  const [wards, setWards] = useState<WardData[]>([]);
  const [selectedWardId, setSelectedWardId] = useState("");
  const [selectedBed, setSelectedBed] = useState<{ id: string; label: string; wardName: string } | null>(null);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Round form
  const [roundNotes, setRoundNotes] = useState("");
  const [savingRound, setSavingRound] = useState(false);

  // Discharge
  const [dischargeSummary, setDischargeSummary] = useState("");
  const [discharging, setDischarging] = useState(false);

  // Doctor assignment
  const [doctorName, setDoctorName] = useState("");
  const [assigningDoctor, setAssigningDoctor] = useState(false);

  // Visiting hours
  const [visitHours, setVisitHours] = useState("");
  const [savingVisitHours, setSavingVisitHours] = useState(false);

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
        let list: Inpatient[] = data.inpatients || [];
        // Ward scoping: non-admin operators only see their assigned wards
        if (!isAdmin && assignedWardNames.length > 0) {
          list = list.filter(p => assignedWardNames.includes(p.wardName));
        }
        setInpatients(list);
        setCounts(data.counts || { admitted: 0, discharged: 0, total: 0 });
      }
    } catch { /* retry */ }
  }, [activeNav, isAdmin, assignedWardNames]);

  const loadWards = useCallback(async () => {
    setLoadingWards(true);
    try {
      const res = await fetch(`/api/beds?hospitalCode=${HOSPITAL_CODE}`);
      if (res.ok) {
        const data = await res.json();
        setWards(data.wards || []);
      }
    } catch { /* */ }
    setLoadingWards(false);
  }, []);

  const loadPendingOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/ward-ipd?hospitalCode=${HOSPITAL_CODE}&status=pending_orders`);
      if (res.ok) {
        const data = await res.json();
        setPendingOrders(data.pendingOrders || []);
      }
    } catch { /* */ }
    setLoadingOrders(false);
  }, []);

  // Filter wards for non-admin: only show assigned wards
  const visibleWards = (!isAdmin && assignedWardIds.length > 0) ? wards.filter(w => assignedWardIds.includes(w.id)) : wards;

  useEffect(() => { loadInpatients(); }, [loadInpatients]);
  useEffect(() => { if (activeNav === "admit") { loadWards(); loadPendingOrders(); } }, [activeNav, loadWards, loadPendingOrders]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const admitPatient = async () => {
    if (!selectedOrder || !selectedBed) return;
    setAdmitting(true);
    try {
      const res = await fetch("/api/ward-ipd", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalCode: HOSPITAL_CODE, action: "admit",
          recordId: selectedOrder.recordId,
          wardName: selectedBed.wardName,
          bedLabel: selectedBed.label,
          bedId: selectedBed.id,
          admissionReason: selectedOrder.admissionReason,
          admittedBy: operator.operatorName || "ward_nurse",
        }),
      });
      if (res.ok) {
        showToast("Patient Admitted");
        setSelectedOrder(null);
        setSelectedBed(null);
        setSelectedWardId("");
        loadInpatients();
        loadWards();
        loadPendingOrders();
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
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "daily_round", recordId: selectedPatient, notes: roundNotes, recordedBy: operator.operatorName || "ward_nurse" }),
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
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "discharge", recordId: selectedPatient, dischargeSummary, dischargedBy: operator.operatorName || "ward_nurse" }),
      });
      if (res.ok) {
        showToast("Patient Discharged");
        setSelectedPatient(null);
        setExpandedSection(null);
        setDischargeSummary("");
        loadInpatients();
      } else { showToast("Discharge Failed", "error"); }
    } catch { showToast("Network Error", "error"); }
    setDischarging(false);
  };

  const assignDoctor = async (recordId: string) => {
    if (!doctorName.trim()) return;
    setAssigningDoctor(true);
    try {
      const res = await fetch("/api/ward-ipd", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "assign_doctor", recordId, assignedDoctorName: doctorName, assignedBy: operator.operatorName || "ward_nurse" }),
      });
      if (res.ok) {
        showToast("Doctor Assigned");
        setDoctorName("");
        setExpandedSection(null);
        loadInpatients();
      } else { showToast("Assignment Failed", "error"); }
    } catch { showToast("Network Error", "error"); }
    setAssigningDoctor(false);
  };

  const saveVisitingHours = async (recordId: string) => {
    if (!visitHours.trim()) return;
    setSavingVisitHours(true);
    try {
      const res = await fetch("/api/ward-ipd", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "set_visiting_hours", recordId, visitingHours: visitHours }),
      });
      if (res.ok) {
        showToast("Visiting Hours Set");
        setVisitHours("");
        setExpandedSection(null);
        loadInpatients();
      } else { showToast("Failed", "error"); }
    } catch { showToast("Network Error", "error"); }
    setSavingVisitHours(false);
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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: theme.copperText }}>Ward / IPD</span>
          {assignedWardNames.length > 0 && !isAdmin && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {assignedWardNames.map(name => (
                <span key={name} style={{ padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", color: "#C084FC" }}>
                  {name}
                </span>
              ))}
            </div>
          )}
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
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Currently Admitted", value: counts.admitted, color: "#38BDF8" },
            { label: "Discharged", value: counts.discharged, color: "#22C55E" },
            { label: "Total Records", value: counts.total, color: COPPER },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: theme.textMuted, marginBottom: 8 }}>{stat.label}</p>
              <p style={{ fontSize: 32, fontWeight: 800, fontFamily: fontFamily.mono, color: stat.color }}>{stat.value}</p>
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
          {/* ADMIT — with bed picker */}
          {activeNav === "admit" && (
            <motion.div key="admit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Pending Admission Orders from Doctors */}
              <WorkshopBox title={`Pending Admission Orders (${pendingOrders.length})`} icon="📋">
                {loadingOrders ? (
                  <p style={{ fontSize: 12, color: theme.textMuted, textAlign: "center", padding: 16 }}>Loading Orders...</p>
                ) : pendingOrders.length === 0 ? (
                  <p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 24 }}>No Pending Admission Orders From Doctors.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    {pendingOrders.map((order) => {
                      const isSelected = selectedOrder?.recordId === order.recordId;
                      return (
                        <motion.button key={order.recordId} type="button" whileHover={{ y: -1 }}
                          onClick={() => { setSelectedOrder(isSelected ? null : order); setSelectedWardId(""); setSelectedBed(null); }}
                          style={{
                            padding: 16, borderRadius: 14, cursor: "pointer", border: "none", textAlign: "left", width: "100%",
                            background: isSelected ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.02)",
                            outline: isSelected ? "1.5px solid rgba(168,85,247,0.35)" : "1px solid rgba(255,255,255,0.06)",
                          }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 12, fontWeight: 800, fontFamily: fontFamily.mono, color: COPPER }}>{order.queueToken}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>{order.patientName}</span>
                              {order.age && <span style={{ fontSize: 11, color: theme.textMuted }}>{order.age}y {order.gender || ""}</span>}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#A855F7", textTransform: "uppercase" }}>
                              {isSelected ? "✓ Selected" : "Select"}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 16, fontSize: 11, color: theme.textSecondary }}>
                            <span>Reason: <strong style={{ color: theme.copperText }}>{order.admissionReason || order.chiefComplaint || "—"}</strong></span>
                            <span>By: <strong>{order.orderedByName}</strong></span>
                            {order.diagnosis && <span>Dx: <strong>{order.diagnosis}</strong></span>}
                            {order.orderedAt && <span>{new Date(order.orderedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </WorkshopBox>

              {/* Ward + Bed Picker — shows when an order is selected */}
              {selectedOrder && (
                <WorkshopBox title={`Assign Bed For ${selectedOrder.patientName}`} icon="🛏️" delay={0.1}>
                  {/* Ward Selector */}
                  <div style={{ marginBottom: 12 }}>
                    <label className="block text-xs font-medium font-body mb-2" style={{ color: theme.textSecondary }}>Select Ward</label>
                    {loadingWards ? (
                      <p style={{ fontSize: 12, color: theme.textMuted, padding: 12 }}>Loading Wards...</p>
                    ) : visibleWards.length === 0 ? (
                      <p style={{ fontSize: 12, color: "#F59E0B", padding: 12 }}>No Wards Configured. Set Up Wards In Bed Management First.</p>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {visibleWards.map((w) => {
                          const available = w.rooms.flatMap((r) => r.beds).filter((b) => b.status === "AVAILABLE").length;
                          const isSelected = selectedWardId === w.id;
                          return (
                            <motion.button key={w.id} type="button" whileHover={{ y: -2 }}
                              onClick={() => { setSelectedWardId(isSelected ? "" : w.id); setSelectedBed(null); }}
                              style={{
                                padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
                                background: isSelected ? `${COPPER}15` : "rgba(255,255,255,0.03)",
                                color: isSelected ? "#D4956B" : "#94A3B8",
                                outline: isSelected ? `1px solid ${COPPER}40` : "1px solid rgba(255,255,255,0.06)",
                              }}>
                              {w.name}
                              <span style={{ display: "block", fontSize: 9, marginTop: 2, color: available > 0 ? "#22C55E" : "#EF4444" }}>
                                {available} Beds Free
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Bed Grid */}
                  {selectedWardId && (
                    <div style={{ marginBottom: 16 }}>
                      <label className="block text-xs font-medium font-body mb-2" style={{ color: theme.textSecondary }}>Select Bed</label>
                      {(() => {
                        const ward = wards.find((w) => w.id === selectedWardId);
                        if (!ward) return null;
                        const allBeds = ward.rooms.flatMap((r) => r.beds.map((b) => ({ ...b, roomName: r.name, wardName: ward.name })));
                        if (allBeds.length === 0) return <p style={{ fontSize: 12, color: "#F59E0B", padding: 8 }}>No Beds In This Ward. Add Beds In Bed Management.</p>;
                        return (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
                            {allBeds.map((bed) => {
                              const isAvailable = bed.status === "AVAILABLE";
                              const isSel = selectedBed?.id === bed.id;
                              return (
                                <motion.button key={bed.id} type="button" whileHover={isAvailable ? { y: -2 } : {}}
                                  onClick={() => isAvailable && setSelectedBed({ id: bed.id, label: bed.label, wardName: bed.wardName })}
                                  style={{
                                    padding: "12px 8px", borderRadius: 12, cursor: isAvailable ? "pointer" : "not-allowed", border: "none", textAlign: "center",
                                    background: isSel ? "rgba(34,197,94,0.12)" : !isAvailable ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.03)",
                                    outline: isSel ? "1.5px solid rgba(34,197,94,0.4)" : "1px solid rgba(255,255,255,0.06)",
                                    opacity: isAvailable ? 1 : 0.35,
                                  }}>
                                  <div style={{ fontSize: 15, fontWeight: 800, fontFamily: fontFamily.mono, color: isSel ? "#22C55E" : isAvailable ? "white" : "#64748B" }}>{bed.label}</div>
                                  <div style={{ fontSize: 9, color: theme.textMuted, marginTop: 2 }}>{bed.roomName}</div>
                                  <div style={{ fontSize: 8, marginTop: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
                                    color: bed.status === "AVAILABLE" ? "#22C55E" : bed.status === "OCCUPIED" ? "#38BDF8" : bed.status === "CLEANING" ? "#FB923C" : bed.status === "MAINTENANCE" ? "#A855F7" : "#F59E0B",
                                  }}>{bed.status}</div>
                                </motion.button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Selected Summary */}
                  {selectedBed && (
                    <div style={{ padding: 12, borderRadius: 12, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", marginBottom: 16 }}>
                      <p style={{ fontSize: 12, color: "#22C55E", fontWeight: 700 }}>
                        ✓ {selectedBed.wardName} — Bed {selectedBed.label}
                      </p>
                    </div>
                  )}

                  <motion.button type="button" onClick={admitPatient} disabled={admitting || !selectedBed} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                    style={{ width: "100%", padding: "14px 24px", borderRadius: 14, fontSize: 13, fontWeight: 800, color: theme.textPrimary, background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: admitting ? "wait" : "pointer", textTransform: "uppercase", letterSpacing: "1px", opacity: admitting || !selectedBed ? 0.5 : 1 }}>
                    {admitting ? "Admitting..." : "Admit Patient"}
                  </motion.button>
                </WorkshopBox>
              )}
            </motion.div>
          )}

          {/* INPATIENTS / DISCHARGED */}
          {(activeNav === "inpatients" || activeNav === "discharged") && (
            <motion.div key={activeNav} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {inpatients.length === 0 ? (
                <WorkshopBox title={activeNav === "inpatients" ? "No Inpatients" : "No Discharged Patients"} icon="🛏️">
                  <p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 24 }}>
                    {activeNav === "inpatients" ? "No Patients Currently Admitted. Use Admit Patient Tab To Add One." : "No Discharged Patients Found."}
                  </p>
                </WorkshopBox>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {inpatients.map((p, i) => {
                    const isSelected = selectedPatient === p.recordId;
                    return (
                    <motion.div key={p.recordId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ padding: 20, borderRadius: 14, background: theme.cardBg, border: `1px solid ${isSelected ? COPPER + "40" : "rgba(184,115,51,0.1)"}`, backdropFilter: "blur(12px)" }}>
                      {/* Header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: fontFamily.mono, color: COPPER }}>{p.queueToken}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>{p.patientName}</span>
                          {p.age && <span style={{ fontSize: 11, color: theme.textMuted }}>{p.age}y {p.gender || ""}</span>}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, fontFamily: fontFamily.mono, background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", color: "#38BDF8" }}>Day {p.dayCount}</span>
                          <span style={{ fontSize: 11, color: theme.textMuted }}>{p.roundsCount} Rounds</span>
                        </div>
                      </div>

                      {/* Details Row */}
                      <div style={{ display: "flex", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Ward</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: theme.copperText }}>{p.wardName}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Bed</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>{p.bedLabel}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Doctor</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: p.assignedDoctorName ? "#A855F7" : "#475569" }}>
                            {p.assignedDoctorName || "Not Assigned"}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Visiting Hours</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: p.visitingHours ? "#F59E0B" : "#475569" }}>
                            {p.visitingHours || "Not Set"}
                          </p>
                        </div>
                        {p.diagnosis && (
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Diagnosis</p>
                            <p style={{ fontSize: 13, color: theme.textSecondary }}>{p.diagnosis}</p>
                          </div>
                        )}
                        {p.admittedAt && (
                          <div>
                            <p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Admitted</p>
                            <p style={{ fontSize: 11, color: theme.textSecondary }}>{new Date(p.admittedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</p>
                          </div>
                        )}
                      </div>

                      {/* Prescription Feed */}
                      {p.prescriptions.length > 0 && (
                        <div style={{ padding: 10, borderRadius: 10, background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.1)", marginBottom: 12 }}>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#A855F7", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Active Prescriptions ({p.prescriptions.length})</p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {p.prescriptions.map((rx, ri) => (
                              <span key={ri} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, color: "#C084FC", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.12)" }}>
                                {rx.medication} {rx.dosage && <span style={{ color: theme.textSecondary }}>— {rx.dosage} {rx.frequency}</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Last round note */}
                      {p.lastRound && (
                        <div style={{ padding: 10, borderRadius: 10, background: theme.navInactiveBg, border: "1px solid rgba(255,255,255,0.04)", marginBottom: 12 }}>
                          <p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Latest Round — {new Date(p.lastRound.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
                          <p style={{ fontSize: 13, color: theme.textSecondary }}>{p.lastRound.notes}</p>
                        </div>
                      )}

                      {/* Actions for admitted patients */}
                      {!p.discharged && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <motion.button type="button" onClick={() => { setSelectedPatient(isSelected ? null : p.recordId); setExpandedSection("round"); setRoundNotes(""); }}
                            whileHover={{ y: -1 }} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#38BDF8", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", cursor: "pointer", textTransform: "uppercase" }}>
                            Daily Round
                          </motion.button>
                          <motion.button type="button" onClick={() => { setSelectedPatient(p.recordId); setExpandedSection("doctor"); setDoctorName(p.assignedDoctorName || ""); }}
                            whileHover={{ y: -1 }} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#A855F7", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", cursor: "pointer", textTransform: "uppercase" }}>
                            {p.assignedDoctorName ? "Change Doctor" : "Assign Doctor"}
                          </motion.button>
                          <motion.button type="button" onClick={() => { setSelectedPatient(p.recordId); setExpandedSection("visiting"); setVisitHours(p.visitingHours || ""); }}
                            whileHover={{ y: -1 }} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", cursor: "pointer", textTransform: "uppercase" }}>
                            Set Hours
                          </motion.button>
                          <motion.button type="button" onClick={() => { setSelectedPatient(p.recordId); setExpandedSection("discharge"); setDischargeSummary(""); }}
                            whileHover={{ y: -1 }} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", cursor: "pointer", textTransform: "uppercase" }}>
                            Discharge
                          </motion.button>
                        </div>
                      )}

                      {/* Expanded: Daily round */}
                      {isSelected && expandedSection === "round" && !p.discharged && (
                        <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: theme.navInactiveBg, border: "1px solid rgba(184,115,51,0.08)" }}>
                          <DTextarea label="Round Notes" value={roundNotes} onChange={(e) => setRoundNotes(e.target.value)} rows={3} placeholder="Patient observations, progress notes..." />
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <motion.button type="button" onClick={recordRound} disabled={savingRound || !roundNotes.trim()} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                              style={{ flex: 1, padding: "10px 20px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: theme.textPrimary, background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: savingRound ? "wait" : "pointer", textTransform: "uppercase", opacity: savingRound || !roundNotes.trim() ? 0.5 : 1 }}>
                              {savingRound ? "Saving..." : "Save Round"}
                            </motion.button>
                            <button type="button" onClick={() => { setSelectedPatient(null); setExpandedSection(null); }}
                              style={{ padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: theme.textMuted, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expanded: Assign Doctor */}
                      {isSelected && expandedSection === "doctor" && !p.discharged && (
                        <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: theme.navInactiveBg, border: "1px solid rgba(168,85,247,0.1)" }}>
                          <DInput label="Doctor Name" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="Enter doctor name..." required />
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <motion.button type="button" onClick={() => assignDoctor(p.recordId)} disabled={assigningDoctor || !doctorName.trim()} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                              style={{ flex: 1, padding: "10px 20px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: theme.textPrimary, background: "linear-gradient(135deg, #A855F7, #C084FC)", border: "none", cursor: assigningDoctor ? "wait" : "pointer", textTransform: "uppercase", opacity: assigningDoctor || !doctorName.trim() ? 0.5 : 1 }}>
                              {assigningDoctor ? "Assigning..." : "Assign Doctor"}
                            </motion.button>
                            <button type="button" onClick={() => { setSelectedPatient(null); setExpandedSection(null); }}
                              style={{ padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: theme.textMuted, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expanded: Visiting Hours */}
                      {isSelected && expandedSection === "visiting" && !p.discharged && (
                        <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: theme.navInactiveBg, border: "1px solid rgba(245,158,11,0.1)" }}>
                          <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Visiting Hours</label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                            {["9:00 AM — 12:00 PM", "2:00 PM — 5:00 PM", "9:00 AM — 5:00 PM", "No Visitors"].map((preset) => (
                              <button key={preset} type="button" onClick={() => setVisitHours(preset)}
                                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
                                  background: visitHours === preset ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.03)",
                                  color: visitHours === preset ? "#F59E0B" : "#94A3B8",
                                  outline: visitHours === preset ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.06)",
                                }}>
                                {preset}
                              </button>
                            ))}
                          </div>
                          <div style={{ marginBottom: 10 }}>
                            <DInput value={visitHours} onChange={(e) => setVisitHours(e.target.value)} placeholder="Or type custom hours..." />
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <motion.button type="button" onClick={() => saveVisitingHours(p.recordId)} disabled={savingVisitHours || !visitHours.trim()} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                              style={{ flex: 1, padding: "10px 20px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: theme.textPrimary, background: "linear-gradient(135deg, #F59E0B, #FBBF24)", border: "none", cursor: savingVisitHours ? "wait" : "pointer", textTransform: "uppercase", opacity: savingVisitHours || !visitHours.trim() ? 0.5 : 1 }}>
                              {savingVisitHours ? "Saving..." : "Save Visiting Hours"}
                            </motion.button>
                            <button type="button" onClick={() => { setSelectedPatient(null); setExpandedSection(null); }}
                              style={{ padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: theme.textMuted, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expanded: Discharge */}
                      {isSelected && expandedSection === "discharge" && !p.discharged && (
                        <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: theme.navInactiveBg, border: "1px solid rgba(34,197,94,0.1)" }}>
                          <DTextarea label="Discharge Summary" value={dischargeSummary} onChange={(e) => setDischargeSummary(e.target.value)} rows={3} placeholder="Discharge summary, instructions..." />
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <motion.button type="button" onClick={dischargePatient} disabled={discharging} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                              style={{ flex: 1, padding: "10px 20px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: theme.textPrimary, background: "linear-gradient(135deg, #22C55E, #4ADE80)", border: "none", cursor: discharging ? "wait" : "pointer", textTransform: "uppercase" }}>
                              {discharging ? "Discharging..." : "Confirm Discharge"}
                            </motion.button>
                            <button type="button" onClick={() => { setSelectedPatient(null); setExpandedSection(null); }}
                              style={{ padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: theme.textMuted, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
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