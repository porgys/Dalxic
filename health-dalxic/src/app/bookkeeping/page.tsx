"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { StationGate, OperatorBadge } from "@/components/station-gate";
import { useStationTheme, ThemeToggle, StationThemeProvider, useThemeContext, COPPER, COPPER_LIGHT, BLUE, fontFamily } from "@/hooks/use-station-theme";
import type { OperatorSession } from "@/types";

const HOSPITAL_CODE = "KBH";

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
function WorkshopBox({ children, title, icon, delay = 0 }: {
  children: React.ReactNode; title: string; icon: string; delay?: number;
}) {
  const theme = useThemeContext();
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}
      className="rounded-2xl p-5"
      style={{ background: theme.cardBg, border: theme.cardBorder, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <h3 className="text-xs font-mono uppercase tracking-wider text-[#D4956B]">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

/* ─── Types ─── */
interface SummaryData {
  period: string;
  periodRevenue: number;
  periodBillCount: number;
  periodItemCount: number;
  periodItemsTotal: number;
  periodDiscounts: number;
  periodWaived: number;
  outstandingAmount: number;
  outstandingCount: number;
  totalBillsAllTime: number;
  paymentBreakdown: Record<string, number>;
}

interface DepartmentRow {
  serviceType: string;
  count: number;
  total: number;
}

interface RevenueDay {
  date: string;
  revenue: number;
  count: number;
}

interface OutstandingBill {
  billNumber: string;
  patientId: string;
  total: number;
  status: string;
  createdAt: string;
  ageDays: number;
}

interface AgingBuckets {
  current: number;
  days30: number;
  days60: number;
  days90: number;
}

interface ClaimRow {
  billNumber: string;
  patientId: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  itemCount: number;
}

interface PatientRow {
  id: string;
  name: string;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  insuranceId: string | null;
  insuranceScheme: string | null;
  queueToken: string | null;
  chiefComplaint: string | null;
  department: string | null;
  visitStatus: string | null;
  primaryDiagnosis: string | null;
  prescriptionCount: number;
  visitDate: string;
  entryPoint: string;
}

interface PatientHistory {
  patient: { name: string; phone: string; gender: string; dateOfBirth: string; insuranceId: string; insuranceScheme: string; emergencyContact: unknown };
  totalVisits: number;
  visits: { id: string; queueToken: string; chiefComplaint: string; department: string; visitStatus: string; primaryDiagnosis: string; notes: string; prescriptions: { medication: string; dosage: string; frequency: string; duration: string }[]; visitDate: string }[];
}

interface AssessmentBucket {
  label: string;
  patients: number;
  revenue: number;
  diagnoses: Record<string, number>;
}

interface AssessmentData {
  period: string;
  totalPatients: number;
  totalRevenue: number;
  buckets: AssessmentBucket[];
  topDiagnoses: { diagnosis: string; count: number }[];
}

const SERVICE_LABELS: Record<string, string> = {
  CONSULTATION: "Consultations", LAB: "Laboratory", IMAGING: "Imaging / Radiology",
  DRUG: "Pharmacy / Drugs", WARD_DAY: "Ward Stay", PROCEDURE: "Procedures",
  EMERGENCY: "Emergency", ICU_DAY: "ICU Stay",
};
const SERVICE_ICONS: Record<string, string> = {
  CONSULTATION: "🩺", LAB: "🧪", IMAGING: "📷", DRUG: "💊",
  WARD_DAY: "🏥", PROCEDURE: "🔬", EMERGENCY: "🚑", ICU_DAY: "❤️",
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#94A3B8", ISSUED: "#38BDF8", PART_PAID: "#F59E0B", PAID: "#22C55E", WAIVED: "#A855F7",
};

type NavView = "patients" | "overview" | "assessment" | "revenue" | "departments" | "outstanding" | "claims";

const NAV_ITEMS: { key: NavView; icon: string; label: string }[] = [
  { key: "patients", icon: "👥", label: "Patients" },
  { key: "overview", icon: "📊", label: "Financials" },
  { key: "assessment", icon: "📈", label: "Assessment" },
  { key: "revenue", icon: "💰", label: "Revenue" },
  { key: "departments", icon: "🏢", label: "Departments" },
  { key: "outstanding", icon: "📋", label: "Outstanding" },
  { key: "claims", icon: "🏛️", label: "Claims" },
];

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function BookkeepingPage() {
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Bookkeeping" stationIcon="📊" allowedRoles={["billing", "admin", "super_admin", "accountant"]}>
      {(operator) => <BookkeepingContent operator={operator} />}
    </StationGate>
  );
}

function BookkeepingContent({ operator }: { operator: OperatorSession }) {
  const theme = useStationTheme();
  const [activeNav, setActiveNav] = useState<NavView>("patients");
  const [period, setPeriod] = useState<string>("today");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Patient records
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientPage, setPatientPage] = useState(1);
  const [patientTotal, setPatientTotal] = useState(0);
  const [patientTotalPages, setPatientTotalPages] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<PatientHistory | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Assessment
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);

  // Data
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [deptTotal, setDeptTotal] = useState(0);
  const [revenueDaily, setRevenueDaily] = useState<RevenueDay[]>([]);
  const [revenueTotal, setRevenueTotal] = useState(0);
  const [outstanding, setOutstanding] = useState<OutstandingBill[]>([]);
  const [aging, setAging] = useState<AgingBuckets>({ current: 0, days30: 0, days60: 0, days90: 0 });
  const [outstandingTotal, setOutstandingTotal] = useState(0);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [claimsStats, setClaimsStats] = useState({ totalClaims: 0, paidClaims: 0, paidTotal: 0, pendingClaims: 0, pendingTotal: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const fetchData = useCallback(async (view: string, extra?: string) => {
    setLoading(true);
    try {
      const url = `/api/bookkeeping?hospitalCode=${HOSPITAL_CODE}&view=${view}&period=${period}${extra || ""}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();

      if (view === "summary") setSummary(data);
      if (view === "department") { setDepartments(data.departments); setDeptTotal(data.grandTotal); }
      if (view === "revenue") { setRevenueDaily(data.daily); setRevenueTotal(data.total); }
      if (view === "outstanding") { setOutstanding(data.bills); setAging(data.aging); setOutstandingTotal(data.totalOutstanding); }
      if (view === "claims") { setClaims(data.claims); setClaimsStats({ totalClaims: data.totalClaims, paidClaims: data.paidClaims, paidTotal: data.paidTotal, pendingClaims: data.pendingClaims, pendingTotal: data.pendingTotal }); }
      if (view === "patients") { setPatients(data.patients); setPatientTotal(data.total); setPatientTotalPages(data.totalPages); }
      if (view === "patient-history") { setSelectedPatient(data); }
      if (view === "assessment") { setAssessment(data); }
    } catch { /* silent */ }
    setLoading(false);
  }, [period]);

  // Load data on nav/period change
  useEffect(() => {
    if (activeNav === "patients") fetchData("patients", `&page=${patientPage}&search=${encodeURIComponent(patientSearch)}`);
    if (activeNav === "overview") { fetchData("summary"); fetchData("department"); }
    if (activeNav === "assessment") fetchData("assessment");
    if (activeNav === "revenue") fetchData("revenue");
    if (activeNav === "departments") fetchData("department");
    if (activeNav === "outstanding") fetchData("outstanding");
    if (activeNav === "claims") fetchData("claims");
  }, [activeNav, period, patientPage, fetchData]); // patientSearch triggered separately

  // Search patients with debounce
  useEffect(() => {
    if (activeNav !== "patients") return;
    const t = setTimeout(() => {
      setPatientPage(1);
      fetchData("patients", `&page=1&search=${encodeURIComponent(patientSearch)}`);
    }, 400);
    return () => clearTimeout(t);
  }, [patientSearch, activeNav, fetchData]);

  // Load patient detail
  const openPatientDetail = (patientId: string) => {
    setSelectedPatientId(patientId);
    fetchData("patient-history", `&patientId=${patientId}`);
  };

  const closePatientDetail = () => {
    setSelectedPatient(null);
    setSelectedPatientId(null);
  };

  const fmt = (n: number) => `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const periodLabel = period === "today" ? "Today" : period === "week" ? "This Week" : period === "month" ? "This Month" : "This Year";

  return (
    <StationThemeProvider theme={theme}>
    <div style={{ minHeight: "100vh", background: theme.pageBg, position: "relative", overflow: "hidden", transition: "background 0.5s ease" }}>
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
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: COPPER_LIGHT }}>Bookkeeping</span>
          <OperatorBadge session={operator} onLogout={() => window.location.reload()} />
          <ThemeToggle isDayMode={theme.isDayMode} onToggle={theme.toggle} />
          <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, fontFamily: fontFamily.mono }}>
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </header>

      {/* ─── Content ─── */}
      <div style={{ position: "relative", zIndex: 10, paddingTop: 70, paddingBottom: 40, maxWidth: 1200, margin: "0 auto", padding: "70px 28px 40px" }}>

        {/* Nav Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
          {NAV_ITEMS.map(n => {
            const isActive = activeNav === n.key;
            return (
              <button key={n.key} type="button" onClick={() => setActiveNav(n.key)}
                style={{
                  padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: isActive ? 800 : 600, letterSpacing: "0.5px",
                  background: isActive ? `${COPPER}18` : "transparent",
                  color: isActive ? COPPER_LIGHT : theme.textMuted,
                  transition: "all 0.2s ease",
                }}
              >
                {n.icon} {n.label}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          {/* Period Selector */}
          <div style={{ display: "flex", gap: 4 }}>
            {["today", "week", "month", "year"].map(p => (
              <button key={p} type="button" onClick={() => setPeriod(p)}
                style={{
                  padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 10, fontWeight: period === p ? 800 : 600, letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  background: period === p ? `${BLUE}15` : "transparent",
                  color: period === p ? BLUE : theme.textMuted,
                  transition: "all 0.2s ease",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div style={{ textAlign: "center", padding: 20, color: theme.textMuted, fontSize: 12 }}>
            Loading...
          </div>
        )}

        {/* ═══ PATIENTS ═══ */}
        {activeNav === "patients" && !selectedPatient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* Search Bar */}
            <div style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search By Name, Phone, Or Token..."
                  style={{
                    width: "100%", padding: "12px 16px 12px 40px", borderRadius: 14, fontSize: 13, fontWeight: 600,
                    background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}15`,
                    color: "#fff", outline: "none",
                  }}
                />
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.4 }}>🔍</span>
              </div>
              <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>
                {patientTotal} Records
              </div>
            </div>

            {/* Patient Cards */}
            {patients.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: theme.textMuted, fontSize: 13 }}>No Patient Records Found</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {patients.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => openPatientDetail(p.id)}
                    style={{
                      display: "grid", gridTemplateColumns: "auto 1fr auto auto",
                      alignItems: "center", gap: 16,
                      padding: "14px 18px", borderRadius: 14, cursor: "pointer",
                      background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}08`,
                      transition: "all 0.15s ease",
                    }}
                    whileHover={{ scale: 1.005, borderColor: `${COPPER}25` }}
                  >
                    {/* Token */}
                    <div style={{
                      fontSize: 12, fontWeight: 800, color: COPPER_LIGHT,
                      fontFamily: fontFamily.mono,
                      minWidth: 60,
                    }}>
                      {p.queueToken || "—"}
                    </div>

                    {/* Patient Info */}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: theme.textPrimary }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: theme.textMuted, display: "flex", gap: 12, marginTop: 2 }}>
                        {p.phone && <span>📱 {p.phone}</span>}
                        {p.gender && <span>{p.gender === "male" ? "♂" : p.gender === "female" ? "♀" : "⚧"} {p.gender}</span>}
                        {p.department && <span>🏥 {p.department}</span>}
                        {p.insuranceScheme && <span>🏛️ {p.insuranceScheme}</span>}
                      </div>
                    </div>

                    {/* Diagnosis */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: BLUE }}>
                        {p.primaryDiagnosis || p.chiefComplaint || "—"}
                      </div>
                      <div style={{ fontSize: 9, color: theme.textMuted, marginTop: 2 }}>
                        {p.prescriptionCount > 0 && `💊 ${p.prescriptionCount} Rx`}
                      </div>
                    </div>

                    {/* Date + Status */}
                    <div style={{ textAlign: "right", minWidth: 90 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: theme.textMuted, fontFamily: fontFamily.mono }}>
                        {new Date(p.visitDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </div>
                      {p.visitStatus && (
                        <span style={{
                          fontSize: 8, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
                          padding: "2px 6px", borderRadius: 4, marginTop: 2, display: "inline-block",
                          background: p.visitStatus === "closed" ? "rgba(34,197,94,0.08)" : p.visitStatus === "active" ? "rgba(14,165,233,0.08)" : "rgba(245,158,11,0.08)",
                          color: p.visitStatus === "closed" ? "#22C55E" : p.visitStatus === "active" ? "#38BDF8" : "#F59E0B",
                        }}>
                          {(p.visitStatus as string).replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {patientTotalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
                <button type="button" disabled={patientPage <= 1} onClick={() => setPatientPage(p => p - 1)}
                  style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}15`, color: patientPage <= 1 ? "#3D4D78" : COPPER_LIGHT, cursor: patientPage <= 1 ? "default" : "pointer" }}>
                  Previous
                </button>
                <span style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, color: theme.textMuted }}>
                  Page {patientPage} Of {patientTotalPages}
                </span>
                <button type="button" disabled={patientPage >= patientTotalPages} onClick={() => setPatientPage(p => p + 1)}
                  style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}15`, color: patientPage >= patientTotalPages ? "#3D4D78" : COPPER_LIGHT, cursor: patientPage >= patientTotalPages ? "default" : "pointer" }}>
                  Next
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ PATIENT DETAIL (Visit History Card) ═══ */}
        {activeNav === "patients" && selectedPatient && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Back Button */}
            <button type="button" onClick={closePatientDetail}
              style={{ fontSize: 11, fontWeight: 700, color: COPPER_LIGHT, background: "none", border: "none", cursor: "pointer", marginBottom: 16, letterSpacing: "0.5px" }}>
              ← Back To Patient List
            </button>

            {/* Patient Card */}
            <WorkshopBox title="Patient Profile" icon="👤" delay={0}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary }}>{selectedPatient.patient.name || "Unknown"}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                    {selectedPatient.patient.phone && <span>📱 {selectedPatient.patient.phone}</span>}
                    {selectedPatient.patient.gender && <span>{selectedPatient.patient.gender === "male" ? "♂ Male" : selectedPatient.patient.gender === "female" ? "♀ Female" : selectedPatient.patient.gender}</span>}
                    {selectedPatient.patient.dateOfBirth && <span>🎂 {selectedPatient.patient.dateOfBirth}</span>}
                  </div>
                </div>
                <div>
                  {selectedPatient.patient.insuranceId && (
                    <div style={{ fontSize: 11, color: theme.textMuted }}>
                      <span style={{ fontWeight: 700, color: COPPER_LIGHT }}>Insurance ID:</span> {selectedPatient.patient.insuranceId}
                    </div>
                  )}
                  {selectedPatient.patient.insuranceScheme && (
                    <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                      <span style={{ fontWeight: 700, color: COPPER_LIGHT }}>Scheme:</span> {selectedPatient.patient.insuranceScheme}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: BLUE, fontFamily: fontFamily.mono }}>
                    {selectedPatient.totalVisits}
                  </div>
                  <div style={{ fontSize: 10, color: theme.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Visits</div>
                </div>
              </div>
            </WorkshopBox>

            {/* Visit Timeline */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: COPPER_LIGHT, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>
                Visit History
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedPatient.visits.map((v, i) => (
                  <motion.div key={v.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{
                      padding: 16, borderRadius: 14,
                      background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}10`,
                      position: "relative",
                    }}
                  >
                    {/* Timeline dot */}
                    <div style={{
                      position: "absolute", left: -6, top: 20,
                      width: 12, height: 12, borderRadius: "50%",
                      background: v.visitStatus === "closed" ? "#22C55E" : BLUE,
                      border: "2px solid rgba(10,10,15,0.9)",
                    }} />

                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "start", paddingLeft: 12 }}>
                      {/* Date + Token */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: COPPER_LIGHT, fontFamily: fontFamily.mono }}>
                          {v.queueToken || "—"}
                        </div>
                        <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>
                          {new Date(v.visitDate).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })}
                        </div>
                      </div>

                      {/* Clinical Details */}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>
                          {v.primaryDiagnosis || v.chiefComplaint || "No Diagnosis"}
                        </div>
                        {v.chiefComplaint && v.primaryDiagnosis && (
                          <div style={{ fontSize: 10, color: theme.textMuted }}>Complaint: {v.chiefComplaint}</div>
                        )}
                        {v.notes && (
                          <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4, lineHeight: 1.4, maxHeight: 60, overflow: "hidden" }}>
                            {v.notes}
                          </div>
                        )}
                        {v.prescriptions && v.prescriptions.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                            {v.prescriptions.map((rx, j) => (
                              <span key={j} style={{
                                fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                                background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.1)", color: "#38BDF8",
                              }}>
                                💊 {rx.medication} {rx.dosage}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
                        padding: "3px 8px", borderRadius: 5,
                        background: v.visitStatus === "closed" ? "rgba(34,197,94,0.08)" : "rgba(14,165,233,0.08)",
                        color: v.visitStatus === "closed" ? "#22C55E" : "#38BDF8",
                      }}>
                        {v.visitStatus?.replace(/_/g, " ") || "Active"}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ ASSESSMENT ═══ */}
        {activeNav === "assessment" && assessment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* Summary Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              <WorkshopBox title={`Total Patients (${periodLabel})`} icon="👥" delay={0}>
                <div style={{ fontSize: 28, fontWeight: 800, color: BLUE, fontFamily: fontFamily.mono }}>
                  {assessment.totalPatients.toLocaleString()}
                </div>
              </WorkshopBox>
              <WorkshopBox title={`Revenue (${periodLabel})`} icon="💰" delay={0.05}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#22C55E", fontFamily: fontFamily.mono }}>
                  {fmt(assessment.totalRevenue)}
                </div>
              </WorkshopBox>
              <WorkshopBox title="Avg Revenue Per Patient" icon="📊" delay={0.1}>
                <div style={{ fontSize: 28, fontWeight: 800, color: COPPER_LIGHT, fontFamily: fontFamily.mono }}>
                  {assessment.totalPatients > 0 ? fmt(assessment.totalRevenue / assessment.totalPatients) : "—"}
                </div>
              </WorkshopBox>
            </div>

            {/* Period Breakdown Bars */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <WorkshopBox title={`Patient Flow — ${periodLabel}`} icon="📈" delay={0.15}>
                {assessment.buckets.length === 0 ? (
                  <div style={{ fontSize: 12, color: theme.textMuted, textAlign: "center", padding: 20 }}>No Data</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {assessment.buckets.map((b, i) => {
                      const maxP = Math.max(...assessment.buckets.map(x => x.patients), 1);
                      const pct = (b.patients / maxP) * 100;
                      return (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: theme.textPrimary }}>{b.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: BLUE, fontFamily: fontFamily.mono }}>
                              {b.patients} Patients
                            </span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.04)" }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, delay: i * 0.05 }}
                              style={{ height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${BLUE}, #38BDF8)` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </WorkshopBox>

              {/* Top Diagnoses */}
              <WorkshopBox title={`Top Diagnoses — ${periodLabel}`} icon="🩺" delay={0.2}>
                {assessment.topDiagnoses.length === 0 ? (
                  <div style={{ fontSize: 12, color: theme.textMuted, textAlign: "center", padding: 20 }}>No Data</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {assessment.topDiagnoses.map((d, i) => {
                      const maxC = assessment.topDiagnoses[0]?.count || 1;
                      const pct = (d.count / maxC) * 100;
                      return (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: theme.textPrimary, maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {d.diagnosis}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 800, color: COPPER_LIGHT, fontFamily: fontFamily.mono }}>
                              {d.count}
                            </span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.04)" }}>
                            <div style={{ height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${COPPER}, ${COPPER_LIGHT})`, width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </WorkshopBox>
            </div>

            {/* Revenue Per Period Bucket */}
            <div style={{ marginTop: 16 }}>
              <WorkshopBox title={`Revenue Flow — ${periodLabel}`} icon="💰" delay={0.25}>
                {assessment.buckets.length === 0 ? (
                  <div style={{ fontSize: 12, color: theme.textMuted, textAlign: "center", padding: 20 }}>No Data</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {assessment.buckets.map((b, i) => {
                      const maxR = Math.max(...assessment.buckets.map(x => x.revenue), 1);
                      const pct = (b.revenue / maxR) * 100;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, width: 60, fontFamily: fontFamily.mono }}>{b.label}</span>
                          <div style={{ flex: 1, height: 20, borderRadius: 6, background: "rgba(255,255,255,0.03)", overflow: "hidden", position: "relative" }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, delay: i * 0.04 }}
                              style={{ height: "100%", borderRadius: 6, background: "linear-gradient(90deg, #22C55E, #4ADE80)" }} />
                            <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 700, color: theme.textPrimary, fontFamily: fontFamily.mono }}>
                              {fmt(b.revenue)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </WorkshopBox>
            </div>
          </motion.div>
        )}

        {/* ═══ OVERVIEW ═══ */}
        {activeNav === "overview" && summary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { icon: "💰", label: `Revenue (${periodLabel})`, value: fmt(summary.periodRevenue), color: "#22C55E" },
                { icon: "📋", label: "Outstanding", value: fmt(summary.outstandingAmount), color: "#F59E0B", sub: `${summary.outstandingCount} Bills` },
                { icon: "🧾", label: `Bills (${periodLabel})`, value: summary.periodBillCount.toString(), color: BLUE },
                { icon: "📦", label: `Items (${periodLabel})`, value: summary.periodItemCount.toString(), color: COPPER_LIGHT },
              ].map((s, i) => (
                <WorkshopBox key={i} title={s.label} icon={s.icon} delay={i * 0.05}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: fontFamily.mono }}>
                    {s.value}
                  </div>
                  {s.sub && <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>{s.sub}</div>}
                </WorkshopBox>
              ))}
            </div>

            {/* Payment Breakdown + Department Split */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Payment Methods */}
              <WorkshopBox title="Payment Methods" icon="💳" delay={0.2}>
                {Object.keys(summary.paymentBreakdown).length === 0 ? (
                  <div style={{ fontSize: 12, color: theme.textMuted }}>No Payments In Period</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.entries(summary.paymentBreakdown).sort((a, b) => b[1] - a[1]).map(([method, amount]) => {
                      const pct = summary.periodRevenue > 0 ? (amount / summary.periodRevenue * 100) : 0;
                      return (
                        <div key={method}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: theme.textPrimary }}>{method.replace(/_/g, " ")}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: COPPER_LIGHT, fontFamily: fontFamily.mono }}>{fmt(amount)}</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.04)" }}>
                            <div style={{ height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${COPPER}, ${COPPER_LIGHT})`, width: `${pct}%`, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </WorkshopBox>

              {/* Top Departments */}
              <WorkshopBox title="Revenue By Department" icon="🏢" delay={0.25}>
                {departments.length === 0 ? (
                  <div style={{ fontSize: 12, color: theme.textMuted }}>No Data In Period</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {departments.slice(0, 6).map(d => {
                      const pct = deptTotal > 0 ? (d.total / deptTotal * 100) : 0;
                      return (
                        <div key={d.serviceType}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: theme.textPrimary }}>
                              {SERVICE_ICONS[d.serviceType] || "📦"} {SERVICE_LABELS[d.serviceType] || d.serviceType}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: BLUE, fontFamily: fontFamily.mono }}>{fmt(d.total)}</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.04)" }}>
                            <div style={{ height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${BLUE}, #38BDF8)`, width: `${pct}%`, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </WorkshopBox>
            </div>

            {/* Extra Row — Discounts + Waivers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 16 }}>
              <WorkshopBox title="Discounts Given" icon="🏷️" delay={0.3}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#F59E0B", fontFamily: fontFamily.mono }}>
                  {fmt(summary.periodDiscounts)}
                </div>
              </WorkshopBox>
              <WorkshopBox title="Bills Waived" icon="🤝" delay={0.35}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#A855F7", fontFamily: fontFamily.mono }}>
                  {fmt(summary.periodWaived)}
                </div>
              </WorkshopBox>
              <WorkshopBox title="All-Time Bills" icon="📚" delay={0.4}>
                <div style={{ fontSize: 22, fontWeight: 800, color: COPPER_LIGHT, fontFamily: fontFamily.mono }}>
                  {summary.totalBillsAllTime.toLocaleString()}
                </div>
              </WorkshopBox>
            </div>
          </motion.div>
        )}

        {/* ═══ REVENUE ═══ */}
        {activeNav === "revenue" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <WorkshopBox title={`Revenue Trend — ${periodLabel}`} icon="📈" delay={0}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#22C55E", marginBottom: 16, fontFamily: fontFamily.mono }}>
                Total: {fmt(revenueTotal)}
              </div>
              {revenueDaily.length === 0 ? (
                <div style={{ fontSize: 12, color: theme.textMuted, textAlign: "center", padding: 40 }}>No Revenue Data For This Period</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {revenueDaily.map((day, i) => {
                    const maxRev = Math.max(...revenueDaily.map(d => d.revenue), 1);
                    const pct = (day.revenue / maxRev) * 100;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, width: 80, fontFamily: fontFamily.mono }}>
                          {new Date(day.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                        <div style={{ flex: 1, height: 24, borderRadius: 6, background: "rgba(255,255,255,0.03)", overflow: "hidden", position: "relative" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: i * 0.03 }}
                            style={{ height: "100%", borderRadius: 6, background: `linear-gradient(90deg, #22C55E, #4ADE80)` }}
                          />
                          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, fontWeight: 700, color: theme.textPrimary, fontFamily: fontFamily.mono }}>
                            {fmt(day.revenue)} ({day.count})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </WorkshopBox>
          </motion.div>
        )}

        {/* ═══ DEPARTMENTS ═══ */}
        {activeNav === "departments" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <WorkshopBox title={`Department Breakdown — ${periodLabel}`} icon="🏢" delay={0}>
              <div style={{ fontSize: 24, fontWeight: 800, color: BLUE, marginBottom: 16, fontFamily: fontFamily.mono }}>
                Total: {fmt(deptTotal)}
              </div>
              {departments.length === 0 ? (
                <div style={{ fontSize: 12, color: theme.textMuted, textAlign: "center", padding: 40 }}>No Data For This Period</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  {departments.map((d, i) => {
                    const pct = deptTotal > 0 ? (d.total / deptTotal * 100) : 0;
                    return (
                      <motion.div key={d.serviceType} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        style={{
                          padding: 16, borderRadius: 14,
                          background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}10`,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 20 }}>{SERVICE_ICONS[d.serviceType] || "📦"}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: theme.textPrimary }}>{SERVICE_LABELS[d.serviceType] || d.serviceType}</span>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: BLUE, fontFamily: fontFamily.mono }}>
                          {fmt(d.total)}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                          <span style={{ fontSize: 10, color: theme.textMuted }}>{d.count} Items</span>
                          <span style={{ fontSize: 10, color: COPPER_LIGHT, fontWeight: 700 }}>{pct.toFixed(1)}%</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.04)", marginTop: 6 }}>
                          <div style={{ height: 3, borderRadius: 2, background: BLUE, width: `${pct}%` }} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </WorkshopBox>
          </motion.div>
        )}

        {/* ═══ OUTSTANDING ═══ */}
        {activeNav === "outstanding" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* Aging Buckets */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Current (0-30D)", value: aging.current, color: "#22C55E" },
                { label: "30-60 Days", value: aging.days30, color: "#F59E0B" },
                { label: "60-90 Days", value: aging.days60, color: "#F97316" },
                { label: "90+ Days", value: aging.days90, color: "#EF4444" },
              ].map((b, i) => (
                <WorkshopBox key={i} title={b.label} icon="📅" delay={i * 0.05}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: b.color, fontFamily: fontFamily.mono }}>
                    {fmt(b.value)}
                  </div>
                </WorkshopBox>
              ))}
            </div>

            {/* Total */}
            <div style={{ fontSize: 14, fontWeight: 800, color: "#F59E0B", marginBottom: 16 }}>
              Total Outstanding: {fmt(outstandingTotal)} ({outstanding.length} Bills)
            </div>

            {/* Bills List */}
            <WorkshopBox title="Outstanding Bills" icon="📋" delay={0.2}>
              {outstanding.length === 0 ? (
                <div style={{ fontSize: 12, color: theme.textMuted, textAlign: "center", padding: 20 }}>No Outstanding Bills</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 400, overflowY: "auto" }}>
                  {outstanding.map(b => (
                    <div key={b.billNumber} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: 10,
                      background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}08`,
                    }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, fontFamily: fontFamily.mono }}>{b.billNumber}</div>
                        <div style={{ fontSize: 10, color: theme.textMuted }}>{b.ageDays} Days Old</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: STATUS_COLORS[b.status] || "#94A3B8", fontFamily: fontFamily.mono }}>
                          {fmt(b.total)}
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
                          padding: "2px 6px", borderRadius: 4,
                          background: `${STATUS_COLORS[b.status] || "#94A3B8"}12`,
                          color: STATUS_COLORS[b.status] || "#94A3B8",
                        }}>
                          {b.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </WorkshopBox>
          </motion.div>
        )}

        {/* ═══ CLAIMS ═══ */}
        {activeNav === "claims" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { icon: "🏛️", label: "Total Claims", value: claimsStats.totalClaims.toString(), color: BLUE },
                { icon: "✅", label: "Paid Claims", value: fmt(claimsStats.paidTotal), color: "#22C55E", sub: `${claimsStats.paidClaims} Claims` },
                { icon: "⏳", label: "Pending Claims", value: fmt(claimsStats.pendingTotal), color: "#F59E0B", sub: `${claimsStats.pendingClaims} Claims` },
                { icon: "📊", label: "Clearance Rate", value: claimsStats.totalClaims > 0 ? `${Math.round(claimsStats.paidClaims / claimsStats.totalClaims * 100)}%` : "—", color: COPPER_LIGHT },
              ].map((s, i) => (
                <WorkshopBox key={i} title={s.label} icon={s.icon} delay={i * 0.05}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: fontFamily.mono }}>
                    {s.value}
                  </div>
                  {s.sub && <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>{s.sub}</div>}
                </WorkshopBox>
              ))}
            </div>

            {/* Claims List */}
            <WorkshopBox title={`Insurance Claims — ${periodLabel}`} icon="📑" delay={0.2}>
              {claims.length === 0 ? (
                <div style={{ fontSize: 12, color: theme.textMuted, textAlign: "center", padding: 20 }}>No Insurance Claims In Period</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 400, overflowY: "auto" }}>
                  {claims.map(c => (
                    <div key={c.billNumber} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: 10,
                      background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}08`,
                    }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, fontFamily: fontFamily.mono }}>{c.billNumber}</div>
                        <div style={{ fontSize: 10, color: theme.textMuted }}>
                          {c.paymentMethod === "NHIS" ? "🇬🇭 NHIS" : "🏛️ Insurance"} — {c.itemCount} Items
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: STATUS_COLORS[c.status] || "#94A3B8", fontFamily: fontFamily.mono }}>
                          {fmt(c.total)}
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
                          padding: "2px 6px", borderRadius: 4,
                          background: `${STATUS_COLORS[c.status] || "#94A3B8"}12`,
                          color: STATUS_COLORS[c.status] || "#94A3B8",
                        }}>
                          {c.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </WorkshopBox>
          </motion.div>
        )}

      </div>
    </div>
    </StationThemeProvider>
  );
}
