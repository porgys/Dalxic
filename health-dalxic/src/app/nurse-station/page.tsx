"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StationGate, OperatorBadge } from "@/components/station-gate";
import { useStationTheme, ThemeToggle, StationThemeProvider, useThemeContext, COPPER, fontFamily } from "@/hooks/use-station-theme";
import { getPusherClient } from "@/lib/pusher-client";
import { useHospitalName } from "@/hooks/use-hospital-name";
import type { OperatorSession } from "@/types";

const HOSPITAL_CODE = "KBH";
const VITALS_PREVIEW_COUNT = 8;

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

interface NursePatient {
  recordId: string;
  patientName: string;
  age?: number;
  gender?: string;
  queueToken: string;
  department: string;
  assignedDoctor?: string;
  chiefComplaint?: string;
  entryPoint?: string;
  isDirectTreatment?: boolean;
  latestVitals: VitalEntry | null;
  vitalsCount: number;
  pendingTasks: number;
  completedTasks: number;
  pendingInjections: number;
  suppliesCount?: number;
  tasks: NursingTask[];
  createdAt: string;
}

interface InjectionOrder {
  id: string;
  drug: string;
  route: string;
  dose: string;
  frequency: string;
  status: string;
  orderedBy: string;
  orderedAt: string;
  administeredBy?: string;
  administeredAt?: string;
  notes?: string;
  recordId: string;
  patientName: string;
  queueToken: string;
  department: string;
}

interface DrugCatalogItem {
  id: string;
  name: string;
  genericName: string | null;
  category: string;
  unit: string;
  defaultPrice: number;
  totalStock: number;
  stockStatus: "OK" | "LOW" | "OUT";
}

interface CartItem {
  drugCatalogId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
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

const ROUTE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  IM: { bg: "rgba(14,165,233,0.08)", text: "#38BDF8", label: "Intramuscular" },
  IV: { bg: "rgba(168,85,247,0.08)", text: "#A855F7", label: "Intravenous" },
  SC: { bg: "rgba(34,197,94,0.08)", text: "#22C55E", label: "Subcutaneous" },
  ID: { bg: "rgba(245,158,11,0.08)", text: "#F59E0B", label: "Intradermal" },
};

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  pending: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#F59E0B" },
  in_progress: { bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)", text: "#38BDF8" },
  completed: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", text: "#22C55E" },
};

type NavId = "overview" | "vitals" | "tasks" | "injections" | "supplies";

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
  const HOSPITAL_NAME = useHospitalName(HOSPITAL_CODE, "Korle Bu Teaching Hospital");
  const [activeNav, setActiveNav] = useState<NavId>("overview");
  const [patients, setPatients] = useState<NursePatient[]>([]);
  const [counts, setCounts] = useState({ totalPatients: 0, needsVitals: 0, pendingTasks: 0, pendingInjections: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Vitals accordion state
  const [expandedVitalsId, setExpandedVitalsId] = useState<string | null>(null);
  const [showAllVitals, setShowAllVitals] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({ temperature: "", bloodPressure: "", pulse: "", respRate: "", spO2: "", weight: "", height: "", notes: "" });
  const [savingVitals, setSavingVitals] = useState(false);

  // Tasks state
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({ type: "medication", description: "" });
  const [savingTask, setSavingTask] = useState(false);

  // Injections state (merged from injection-room)
  const [injOrders, setInjOrders] = useState<InjectionOrder[]>([]);
  const [injCounts, setInjCounts] = useState({ pending: 0, in_progress: 0, completed: 0, total: 0 });
  const [injView, setInjView] = useState<"queue" | "completed">("queue");
  const [injProcessingId, setInjProcessingId] = useState<string | null>(null);

  // Supplies state
  const [supplyPatientId, setSupplyPatientId] = useState<string | null>(null);
  const [drugQuery, setDrugQuery] = useState("");
  const [drugResults, setDrugResults] = useState<DrugCatalogItem[]>([]);
  const [drugLoading, setDrugLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submittingCart, setSubmittingCart] = useState(false);
  const [showAllSupplyPatients, setShowAllSupplyPatients] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── URL tab param (e.g. from /injection-room redirect) ─── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "injections" || tab === "supplies" || tab === "vitals" || tab === "tasks" || tab === "overview") {
      setActiveNav(tab as NavId);
    }
  }, []);

  /* ─── Data loaders ─── */
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

  const loadInjections = useCallback(async () => {
    try {
      const res = await fetch(`/api/injection-room?hospitalCode=${HOSPITAL_CODE}&status=all`);
      if (res.ok) {
        const data = await res.json();
        const filtered = injView === "queue"
          ? data.orders.filter((o: InjectionOrder) => o.status === "pending" || o.status === "in_progress")
          : data.orders.filter((o: InjectionOrder) => o.status === "completed");
        setInjOrders(filtered);
        setInjCounts(data.counts);
      }
    } catch { /* retry */ }
  }, [injView]);

  useEffect(() => {
    loadPatients();
    const pusher = getPusherClient();
    const ch = pusher?.subscribe(`hospital-${HOSPITAL_CODE}-queue`);
    ch?.bind("patient-added", () => loadPatients());
    ch?.bind("patient-requeued", () => loadPatients());
    return () => { ch?.unbind_all(); pusher?.unsubscribe(`hospital-${HOSPITAL_CODE}-queue`); };
  }, [loadPatients]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(loadPatients, 20000); return () => clearInterval(t); }, [loadPatients]);
  useEffect(() => { if (activeNav === "injections") { loadInjections(); const t = setInterval(loadInjections, 15000); return () => clearInterval(t); } }, [activeNav, loadInjections]);

  /* ─── Drug search (debounced) ─── */
  useEffect(() => {
    if (activeNav !== "supplies") return;
    const q = drugQuery.trim();
    setDrugLoading(true);
    const t = setTimeout(async () => {
      try {
        const url = q.length >= 2
          ? `/api/pharmacy/catalog?hospitalCode=${HOSPITAL_CODE}&search=${encodeURIComponent(q)}`
          : `/api/pharmacy/catalog?hospitalCode=${HOSPITAL_CODE}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setDrugResults(data.catalog || []);
        }
      } catch { /* */ }
      finally { setDrugLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [drugQuery, activeNav]);

  /* ─── Actions ─── */
  const recordVitalsFor = async (recordId: string) => {
    setSavingVitals(true);
    try {
      const payload: Record<string, unknown> = { hospitalCode: HOSPITAL_CODE, action: "record_vitals", recordId, recordedBy: operator.operatorName || "nurse" };
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
        setExpandedVitalsId(null);
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
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "complete_task", recordId, taskId, completedBy: operator.operatorName || "nurse" }),
      });
      if (res.ok) { showToast("Task Completed"); loadPatients(); }
    } catch { showToast("Failed", "error"); }
  };

  const startInjection = async (order: InjectionOrder) => {
    setInjProcessingId(order.id);
    try {
      const res = await fetch("/api/injection-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "start", recordId: order.recordId, injectionId: order.id, administeredBy: operator.operatorName || "nurse" }),
      });
      if (res.ok) { showToast(`Started — ${order.drug}`); loadInjections(); }
    } catch { showToast("Failed", "error"); }
    setInjProcessingId(null);
  };

  const administerInjection = async (order: InjectionOrder) => {
    setInjProcessingId(order.id);
    try {
      const res = await fetch("/api/injection-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "administer", recordId: order.recordId, injectionId: order.id, administeredBy: operator.operatorName || "nurse" }),
      });
      if (res.ok) { showToast(`Administered — ${order.drug}`); loadInjections(); loadPatients(); }
    } catch { showToast("Failed", "error"); }
    setInjProcessingId(null);
  };

  const addToCart = (drug: DrugCatalogItem, qty: number, notes?: string) => {
    if (drug.totalStock <= 0) { showToast("Out Of Stock", "error"); return; }
    const q = Math.max(1, Math.min(qty, drug.totalStock));
    setCart((c) => {
      const idx = c.findIndex((i) => i.drugCatalogId === drug.id);
      if (idx >= 0) {
        const copy = [...c];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + q, notes: notes ?? copy[idx].notes };
        return copy;
      }
      return [...c, { drugCatalogId: drug.id, name: drug.name, unit: drug.unit, unitPrice: drug.defaultPrice, quantity: q, notes }];
    });
    showToast(`Added ${drug.name} × ${q}`);
  };

  const removeFromCart = (drugCatalogId: string) => setCart((c) => c.filter((i) => i.drugCatalogId !== drugCatalogId));

  const submitCart = async () => {
    if (!supplyPatientId || cart.length === 0) return;
    setSubmittingCart(true);
    try {
      const res = await fetch("/api/nurse-station", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalCode: HOSPITAL_CODE,
          action: "add_supply",
          recordId: supplyPatientId,
          administeredBy: operator.operatorName || "nurse",
          items: cart.map((c) => ({ drugCatalogId: c.drugCatalogId, quantity: c.quantity, notes: c.notes })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const failed = (data.results || []).filter((r: { success: boolean }) => !r.success);
        if (failed.length > 0) {
          showToast(`Billed ${cart.length - failed.length}/${cart.length} — ${failed.length} Failed`, "error");
        } else {
          showToast(`Administered ${cart.length} Item${cart.length > 1 ? "s" : ""} — GHS ${data.grandTotal?.toFixed(2) ?? "0.00"} Billed`);
        }
        setCart([]);
        loadPatients();
      } else { showToast("Failed To Bill Supplies", "error"); }
    } catch { showToast("Network Error", "error"); }
    setSubmittingCart(false);
  };

  const selectedTaskPatient = patients.find((p) => p.recordId === selectedPatient);
  const selectedSupplyPatient = patients.find((p) => p.recordId === supplyPatientId);

  const NAV_ITEMS: { id: NavId; icon: string; label: string }[] = [
    { id: "overview", icon: "📋", label: "Patient Overview" },
    { id: "vitals", icon: "🌡️", label: "Record Vitals" },
    { id: "tasks", icon: "✅", label: "Nursing Tasks" },
    { id: "injections", icon: "💉", label: "Injections" },
    { id: "supplies", icon: "💊", label: "Supplies" },
  ];

  /* ─── Walk-In Badge (shared) ─── */
  const WalkInBadge = () => (
    <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)", color: "#C4B5FD" }}>
      💉 Walk-In Treatment
    </span>
  );

  const visiblePatientsForVitals = showAllVitals ? patients : patients.slice(0, VITALS_PREVIEW_COUNT);
  const visibleSupplyPatients = showAllSupplyPatients ? patients : patients.slice(0, VITALS_PREVIEW_COUNT);

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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: theme.copperText }}>Nurse Station</span>
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
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: theme.textMuted, marginBottom: 8 }}>{stat.label}</p>
              <p style={{ fontSize: 32, fontWeight: 800, fontFamily: fontFamily.mono, color: stat.color }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Nav Pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
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
                  <p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 24 }}>No Patients Registered Today. Patients Will Appear Here After Front Desk Registration.</p>
                </WorkshopBox>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {patients.map((p, i) => {
                    const needsVitals = p.vitalsCount === 0;
                    const hasUrgent = p.pendingInjections > 0;
                    return (
                      <motion.div key={p.recordId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        onClick={() => { setSelectedPatient(p.recordId); setActiveNav("vitals"); setExpandedVitalsId(p.recordId); }}
                        style={{ padding: 16, borderRadius: 14, background: theme.cardBg, border: `1px solid ${hasUrgent ? "rgba(239,68,68,0.15)" : p.isDirectTreatment ? "rgba(168,85,247,0.2)" : needsVitals ? "rgba(245,158,11,0.15)" : "rgba(184,115,51,0.1)"}`, cursor: "pointer", transition: "all 0.3s" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, fontFamily: fontFamily.mono, color: COPPER }}>{p.queueToken}</span>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>{p.patientName}</p>
                              <p style={{ fontSize: 10, color: theme.textMuted }}>{p.age ? `${p.age}y` : ""} {p.gender || ""} — {p.department} {p.chiefComplaint ? `— ${p.chiefComplaint}` : ""}</p>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            {p.isDirectTreatment && <WalkInBadge />}
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
                              <div style={{ display: "flex", gap: 8, fontSize: 10, fontFamily: fontFamily.mono, color: theme.textSecondary }}>
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

          {/* ═══════ VITALS (accordion) ═══════ */}
          {activeNav === "vitals" && (
            <motion.div key="vitals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkshopBox title={`Patients (${patients.length})`} icon="🌡️">
                {patients.length === 0 ? (
                  <p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 24 }}>No Patients Registered Today.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {visiblePatientsForVitals.map((p) => {
                      const open = expandedVitalsId === p.recordId;
                      const needsVitals = p.vitalsCount === 0;
                      return (
                        <div key={p.recordId} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${open ? COPPER + "40" : "rgba(255,255,255,0.04)"}`, background: open ? "rgba(184,115,51,0.04)" : "rgba(255,255,255,0.02)", transition: "all 0.2s" }}>
                          {/* Compact row */}
                          <button type="button" onClick={() => { setExpandedVitalsId(open ? null : p.recordId); setVitalsForm({ temperature: "", bloodPressure: "", pulse: "", respRate: "", spO2: "", weight: "", height: "", notes: "" }); }}
                            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span style={{ fontSize: 12, fontWeight: 800, fontFamily: fontFamily.mono, color: COPPER, minWidth: 100, textAlign: "left" }}>{p.queueToken}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: theme.textPrimary }}>{p.patientName}</span>
                              {needsVitals && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", boxShadow: "0 0 8px #F59E0B" }} />}
                              {p.isDirectTreatment && <WalkInBadge />}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {p.latestVitals && (
                                <span style={{ fontSize: 10, fontFamily: fontFamily.mono, color: theme.textMuted }}>
                                  {p.latestVitals.temperature ? `${p.latestVitals.temperature}°C ` : ""}
                                  {p.latestVitals.bloodPressure || ""}
                                  {p.latestVitals.pulse ? ` ${p.latestVitals.pulse}bpm` : ""}
                                </span>
                              )}
                              <span style={{ color: COPPER, fontSize: 12, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                            </div>
                          </button>

                          {/* Inline accordion */}
                          <AnimatePresence>
                            {open && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                                style={{ overflow: "hidden" }}>
                                <div style={{ padding: "4px 14px 16px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                                  {/* Latest vitals compact */}
                                  {p.latestVitals && (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12, marginTop: 12 }}>
                                      {[
                                        { label: "Temp", v: p.latestVitals.temperature ? `${p.latestVitals.temperature}°C` : "—" },
                                        { label: "BP", v: p.latestVitals.bloodPressure || "—" },
                                        { label: "Pulse", v: p.latestVitals.pulse ? `${p.latestVitals.pulse}` : "—" },
                                        { label: "SpO2", v: p.latestVitals.spO2 ? `${p.latestVitals.spO2}%` : "—" },
                                      ].map((v) => (
                                        <div key={v.label} style={{ padding: 8, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                                          <p style={{ fontSize: 8, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2 }}>{v.label}</p>
                                          <p style={{ fontSize: 13, fontWeight: 700, fontFamily: fontFamily.mono, color: theme.textPrimary }}>{v.v}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Inline form */}
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
                                    {[
                                      { key: "temperature", label: "Temp (°C)", placeholder: "36.5" },
                                      { key: "bloodPressure", label: "BP (mmHg)", placeholder: "120/80" },
                                      { key: "pulse", label: "Pulse (bpm)", placeholder: "72" },
                                      { key: "spO2", label: "SpO2 (%)", placeholder: "98" },
                                      { key: "respRate", label: "Resp (/min)", placeholder: "16" },
                                      { key: "weight", label: "Weight (kg)", placeholder: "70" },
                                      { key: "height", label: "Height (cm)", placeholder: "170" },
                                      { key: "notes", label: "Notes", placeholder: "Optional…" },
                                    ].map((field) => (
                                      <DInput
                                        key={field.key}
                                        label={field.label}
                                        value={vitalsForm[field.key as keyof typeof vitalsForm]}
                                        onChange={(e) => setVitalsForm({ ...vitalsForm, [field.key]: e.target.value })}
                                        placeholder={field.placeholder}
                                      />
                                    ))}
                                  </div>
                                  <motion.button type="button" onClick={() => recordVitalsFor(p.recordId)} disabled={savingVitals}
                                    whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                                    style={{ width: "100%", padding: "12px 20px", borderRadius: 12, fontSize: 12, fontWeight: 800, color: theme.textPrimary, background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: savingVitals ? "wait" : "pointer", textTransform: "uppercase", letterSpacing: "1px", opacity: savingVitals ? 0.6 : 1 }}>
                                    {savingVitals ? "Saving..." : "Record Vitals"}
                                  </motion.button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}

                    {patients.length > VITALS_PREVIEW_COUNT && (
                      <button type="button" onClick={() => setShowAllVitals((v) => !v)}
                        style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(184,115,51,0.06)", border: "1px dashed rgba(184,115,51,0.25)", color: "#D4956B", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", marginTop: 4 }}>
                        {showAllVitals ? "Show Fewer" : `+${patients.length - VITALS_PREVIEW_COUNT} More Patient${patients.length - VITALS_PREVIEW_COUNT > 1 ? "s" : ""}`}
                      </button>
                    )}
                  </div>
                )}
              </WorkshopBox>
            </motion.div>
          )}

          {/* ═══════ TASKS ═══════ */}
          {activeNav === "tasks" && (
            <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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

              {selectedPatient && selectedTaskPatient && (
                <>
                  {selectedTaskPatient.tasks.length > 0 && (
                    <WorkshopBox title="Current Tasks" icon="📋" delay={0.05} className="mb-4">
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {selectedTaskPatient.tasks.map((task) => {
                          const typeInfo = TASK_TYPES.find((t) => t.value === task.type);
                          return (
                            <div key={task.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 10, background: task.status === "completed" ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${task.status === "completed" ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)"}` }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 14 }}>{typeInfo?.icon || "📝"}</span>
                                <div>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: task.status === "completed" ? "#22C55E" : "white", textDecoration: task.status === "completed" ? "line-through" : "none" }}>{task.description}</p>
                                  <p style={{ fontSize: 10, color: theme.textMuted }}>{typeInfo?.label || task.type} {task.completedBy ? `— Done By ${task.completedBy}` : ""}</p>
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
                        style={{ padding: "10px 24px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: theme.textPrimary, background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: savingTask ? "wait" : "pointer", textTransform: "uppercase", letterSpacing: "0.5px", opacity: savingTask || !taskForm.description.trim() ? 0.5 : 1 }}>
                        {savingTask ? "Saving..." : "Add Task"}
                      </motion.button>
                    </div>
                  </WorkshopBox>
                </>
              )}
            </motion.div>
          )}

          {/* ═══════ INJECTIONS (merged from Injection Room) ═══════ */}
          {activeNav === "injections" && (
            <motion.div key="injections" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Pending", value: injCounts.pending, color: "#F59E0B" },
                  { label: "In Progress", value: injCounts.in_progress, color: "#38BDF8" },
                  { label: "Completed Today", value: injCounts.completed, color: "#22C55E" },
                  { label: "Total Orders", value: injCounts.total, color: COPPER },
                ].map((s) => (
                  <div key={s.label} style={{ padding: 16, borderRadius: 12, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.08)" }}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: theme.textMuted, marginBottom: 6 }}>{s.label}</p>
                    <p style={{ fontSize: 24, fontWeight: 800, fontFamily: fontFamily.mono, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {([{ id: "queue", label: "💉 Active Queue" }, { id: "completed", label: "✅ Completed" }] as const).map((v) => (
                  <button key={v.id} type="button" onClick={() => setInjView(v.id)}
                    style={{
                      padding: "8px 16px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      background: injView === v.id ? "rgba(184,115,51,0.1)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${injView === v.id ? COPPER + "40" : "rgba(255,255,255,0.05)"}`,
                      color: injView === v.id ? "#D4956B" : "#64748B",
                    }}>{v.label}</button>
                ))}
              </div>

              {injOrders.length === 0 ? (
                <WorkshopBox title={injView === "queue" ? "No Pending Injections" : "No Completed Injections"} icon="💉">
                  <p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 24 }}>
                    {injView === "queue" ? "No Injection Orders In Queue. Orders Appear Here When Doctors Prescribe Injections." : "No Completed Injections Today Yet."}
                  </p>
                </WorkshopBox>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {injOrders.map((order) => {
                    const routeInfo = ROUTE_COLORS[order.route] || ROUTE_COLORS.IM;
                    const statusInfo = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
                    return (
                      <div key={order.id} style={{ padding: 18, borderRadius: 14, background: theme.cardBg, border: `1px solid ${order.status === "in_progress" ? "rgba(14,165,233,0.2)" : "rgba(184,115,51,0.08)"}` }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, fontFamily: fontFamily.mono, color: COPPER }}>{order.queueToken}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary }}>{order.patientName}</span>
                            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", background: statusInfo.bg, border: `1px solid ${statusInfo.border}`, color: statusInfo.text }}>
                              {order.status.replace("_", " ")}
                            </span>
                          </div>
                          <span style={{ fontSize: 10, color: theme.textMuted }}>{new Date(order.orderedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 10 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 3 }}>Drug</p>
                            <p style={{ fontSize: 15, fontWeight: 800, color: theme.textPrimary }}>{order.drug}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 3 }}>Route</p>
                            <span style={{ padding: "3px 10px", borderRadius: 7, fontSize: 10, fontWeight: 700, background: routeInfo.bg, color: routeInfo.text }}>
                              {order.route} — {routeInfo.label}
                            </span>
                          </div>
                          <div>
                            <p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 3 }}>Dose</p>
                            <p style={{ fontSize: 13, fontWeight: 700, fontFamily: fontFamily.mono, color: theme.copperText }}>{order.dose}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 3 }}>Freq</p>
                            <p style={{ fontSize: 12, color: theme.textSecondary }}>{order.frequency}</p>
                          </div>
                        </div>
                        {order.notes && <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 10, fontStyle: "italic" }}>{order.notes}</p>}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 10, color: theme.textMuted }}>Ordered By: {order.orderedBy} — Dept: {order.department}</span>
                          {order.status === "pending" && (
                            <button type="button" onClick={() => startInjection(order)} disabled={injProcessingId === order.id}
                              style={{ padding: "8px 18px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#38BDF8", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              💉 Start
                            </button>
                          )}
                          {order.status === "in_progress" && (
                            <button type="button" onClick={() => administerInjection(order)} disabled={injProcessingId === order.id}
                              style={{ padding: "8px 18px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              ✓ Mark Administered
                            </button>
                          )}
                          {order.status === "completed" && order.administeredAt && (
                            <span style={{ fontSize: 10, color: "#22C55E" }}>
                              Administered By {order.administeredBy} At {new Date(order.administeredAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════ SUPPLIES ═══════ */}
          {activeNav === "supplies" && (
            <motion.div key="supplies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkshopBox title="Select Patient" icon="👤" className="mb-4">
                {patients.length === 0 ? (
                  <p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 16 }}>No Patients Registered Today.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {visibleSupplyPatients.map((p) => {
                      const active = supplyPatientId === p.recordId;
                      return (
                        <button key={p.recordId} type="button" onClick={() => { setSupplyPatientId(p.recordId); setCart([]); }}
                          style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${active ? COPPER + "40" : "rgba(255,255,255,0.04)"}`, background: active ? "rgba(184,115,51,0.06)" : "rgba(255,255,255,0.02)", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, fontFamily: fontFamily.mono, color: COPPER, minWidth: 100 }}>{p.queueToken}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: theme.textPrimary }}>{p.patientName}</span>
                            {p.isDirectTreatment && <WalkInBadge />}
                          </div>
                          {(p.suppliesCount ?? 0) > 0 && (
                            <span style={{ fontSize: 10, color: theme.textMuted }}>{p.suppliesCount} Supplied</span>
                          )}
                        </button>
                      );
                    })}
                    {patients.length > VITALS_PREVIEW_COUNT && (
                      <button type="button" onClick={() => setShowAllSupplyPatients((v) => !v)}
                        style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(184,115,51,0.06)", border: "1px dashed rgba(184,115,51,0.25)", color: "#D4956B", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", marginTop: 4 }}>
                        {showAllSupplyPatients ? "Show Fewer" : `+${patients.length - VITALS_PREVIEW_COUNT} More Patient${patients.length - VITALS_PREVIEW_COUNT > 1 ? "s" : ""}`}
                      </button>
                    )}
                  </div>
                )}
              </WorkshopBox>

              {supplyPatientId && selectedSupplyPatient && (
                <>
                  <WorkshopBox title={`Pharmacy Supplies — ${selectedSupplyPatient.patientName}`} icon="💊" className="mb-4">
                    <DInput
                      label="Search Drugs / Consumables"
                      value={drugQuery}
                      onChange={(e) => setDrugQuery(e.target.value)}
                      placeholder="Type a drug, syringe, dressing..."
                    />
                    <div style={{ marginTop: 12, maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                      {drugLoading && <p style={{ fontSize: 11, color: theme.textMuted, padding: 12 }}>Searching...</p>}
                      {!drugLoading && drugResults.length === 0 && (
                        <p style={{ fontSize: 11, color: theme.textMuted, padding: 12 }}>No Matching Items In Catalog.</p>
                      )}
                      {drugResults.map((d) => (
                        <SupplyRow key={d.id} drug={d} onAdd={addToCart} />
                      ))}
                    </div>
                  </WorkshopBox>

                  {cart.length > 0 && (
                    <WorkshopBox title={`Cart (${cart.length} Item${cart.length > 1 ? "s" : ""})`} icon="🛒">
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                        {cart.map((c) => (
                          <div key={c.drugCatalogId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary }}>{c.name}</p>
                              <p style={{ fontSize: 10, color: theme.textMuted }}>{c.quantity} {c.unit}{c.quantity > 1 ? "s" : ""} × GHS {c.unitPrice.toFixed(2)} = GHS {(c.quantity * c.unitPrice).toFixed(2)}</p>
                            </div>
                            <button type="button" onClick={() => removeFromCart(c.drugCatalogId)}
                              style={{ padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, color: "#EF4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "rgba(184,115,51,0.06)", border: `1px solid ${COPPER}30`, marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: theme.copperText, textTransform: "uppercase", letterSpacing: "1px" }}>Estimated Total</span>
                        <span style={{ fontSize: 16, fontWeight: 800, fontFamily: fontFamily.mono, color: COPPER }}>
                          GHS {cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0).toFixed(2)}
                        </span>
                      </div>
                      <motion.button type="button" onClick={submitCart} disabled={submittingCart}
                        whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                        style={{ width: "100%", padding: "14px 20px", borderRadius: 14, fontSize: 13, fontWeight: 800, color: theme.textPrimary, background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", cursor: submittingCart ? "wait" : "pointer", textTransform: "uppercase", letterSpacing: "1px", opacity: submittingCart ? 0.6 : 1 }}>
                        {submittingCart ? "Administering..." : `Administer & Bill ${cart.length} Item${cart.length > 1 ? "s" : ""}`}
                      </motion.button>
                    </WorkshopBox>
                  )}
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

/* ─── Supply Row ─── */
function SupplyRow({ drug, onAdd }: { drug: DrugCatalogItem; onAdd: (d: DrugCatalogItem, qty: number, notes?: string) => void }) {
  const theme = useThemeContext();
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");
  const stockColor = drug.stockStatus === "OUT" ? "#EF4444" : drug.stockStatus === "LOW" ? "#F59E0B" : "#22C55E";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{drug.name}</p>
          <span style={{ fontSize: 9, color: stockColor, fontWeight: 700 }}>● {drug.stockStatus === "OUT" ? "Out" : `${drug.totalStock} Left`}</span>
        </div>
        <p style={{ fontSize: 10, color: theme.textMuted }}>{drug.category} — GHS {drug.defaultPrice.toFixed(2)} / {drug.unit}</p>
      </div>
      <input type="number" min={1} max={drug.totalStock || 1} value={qty} onChange={(e) => setQty(e.target.value)}
        style={{ width: 56, padding: "6px 8px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: theme.textPrimary, fontSize: 11, fontFamily: fontFamily.mono, textAlign: "center" }} />
      <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..."
        style={{ width: 130, padding: "6px 8px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: theme.textPrimary, fontSize: 11 }} />
      <button type="button" onClick={() => onAdd(drug, parseInt(qty) || 1, notes || undefined)} disabled={drug.stockStatus === "OUT"}
        style={{ padding: "6px 12px", borderRadius: 8, fontSize: 10, fontWeight: 700, color: drug.stockStatus === "OUT" ? "#64748B" : "#D4956B", background: drug.stockStatus === "OUT" ? "rgba(255,255,255,0.02)" : "rgba(184,115,51,0.08)", border: `1px solid ${drug.stockStatus === "OUT" ? "rgba(255,255,255,0.05)" : COPPER + "40"}`, cursor: drug.stockStatus === "OUT" ? "not-allowed" : "pointer", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
        Add
      </button>
    </div>
  );
}
