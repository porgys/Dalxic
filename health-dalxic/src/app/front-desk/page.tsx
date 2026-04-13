"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BulkPaste } from "@/components/intake/bulk-paste";
import { StationGate, OperatorBadge } from "@/components/station-gate";
import { useStationTheme, ThemeToggle, StationThemeProvider, useThemeContext, COPPER, fontFamily } from "@/hooks/use-station-theme";
import { getPusherClient } from "@/lib/pusher-client";
import type { ParsedPatientEntry, OperatorSession } from "@/types";

const HOSPITAL_CODE = "KBH";
const HOSPITAL_NAME = "Korle Bu Teaching Hospital";
/* ─── Galaxy Canvas (copper, for station pages) ─── */
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

/* ─── Workshop Box (detached glass card for each form section) ─── */
function WorkshopBox({ children, title, icon, delay = 0, className = "" }: {
  children: React.ReactNode; title: string; icon: string; delay?: number; className?: string;
}) {
  const t = useThemeContext();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: t.cardBg,
        border: t.cardBorder,
        boxShadow: t.cardShadow,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: t.copperText, transition: "color 0.4s ease" }}>{title}</h3>
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

/* ─── Themed Select ─── */
function DSelect({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }) {
  const t = useThemeContext();
  return (
    <div>
      {label && <label className="block text-xs font-medium font-body mb-1.5" style={{ color: t.textLabel, transition: "color 0.4s ease" }}>{label}</label>}
      <select
        {...props}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body focus:outline-none focus:ring-2 transition-all duration-300 appearance-none"
        style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText, transition: "background 0.4s ease, border-color 0.4s ease, color 0.4s ease" }}
      >
        <option value="" style={{ background: t.selectOptionBg }}>Select...</option>
        {options.map((o) => <option key={o.value} value={o.value} style={{ background: t.selectOptionBg }}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ─── Camera Capture ─── */
function CameraCapture({ onCapture, currentPhoto }: { onCapture: (url: string) => void; currentPhoto?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320, facingMode: "user" } });
      if (videoRef.current) videoRef.current.srcObject = ms;
      setStream(ms); setCameraActive(true);
    } catch { /* camera denied */ }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null); setCameraActive(false);
  }, [stream]);

  const capture = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = 320; c.height = 320;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const size = Math.min(v.videoWidth, v.videoHeight);
    ctx.drawImage(v, (v.videoWidth - size) / 2, (v.videoHeight - size) / 2, size, size, 0, 0, 320, 320);
    onCapture(c.toDataURL("image/jpeg", 0.85));
    stopCamera();
  };

  useEffect(() => () => { stream?.getTracks().forEach((t) => t.stop()); }, [stream]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      {/* Avatar circle */}
      <div className="relative group mx-auto" style={{ width: 110, height: 110 }}>
        <div className="w-[110px] h-[110px] rounded-full overflow-hidden flex items-center justify-center transition-all duration-300"
          style={{
            background: currentPhoto ? "transparent" : "radial-gradient(circle, rgba(184,115,51,0.06) 0%, rgba(255,255,255,0.02) 70%)",
            border: `2px solid ${currentPhoto ? COPPER + "40" : "rgba(255,255,255,0.06)"}`,
            boxShadow: currentPhoto ? `0 0 20px ${COPPER}15` : "none",
          }}>
          {cameraActive ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            : currentPhoto ? <img src={currentPhoto} alt="Patient" className="w-full h-full object-cover" />
            : (
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity={0.15}>
                <circle cx="24" cy="18" r="8" stroke="white" strokeWidth="1.5" />
                <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
        </div>
        {/* Floating camera button */}
        {!cameraActive && (
          <button type="button" onClick={startCamera}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${COPPER}, #D4956B)`,
              boxShadow: `0 2px 8px ${COPPER}40`,
              border: "2px solid rgba(10,10,20,0.8)",
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {/* Status / actions */}
      {cameraActive ? (
        <div className="flex gap-2">
          <button type="button" onClick={capture} className="px-4 py-1.5 rounded-xl text-[11px] font-body font-medium text-white transition-all" style={{ background: `linear-gradient(135deg, ${COPPER}, #D4956B)` }}>Capture</button>
          <button type="button" onClick={stopCamera} className="px-4 py-1.5 rounded-xl text-[11px] font-body text-[#94A3B8] transition-all" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>Cancel</button>
        </div>
      ) : (
        <p className="text-[10px] font-body" style={{ color: currentPhoto ? "#22C55E" : "#4A5568" }}>
          {currentPhoto ? "Photo Captured" : "Tap Camera To Capture"}
        </p>
      )}
    </div>
  );
}

/* ─── Navigation tabs (mini workstation cards) ─── */
const NAV_ITEMS = [
  { id: "register", icon: "📋", label: "Patient Registration" },
  { id: "emergency", icon: "🚨", label: "Emergency Admit" },
  { id: "close", icon: "✅", label: "Close Visit" },
  { id: "queue", icon: "👥", label: "Today's Queue" },
  { id: "search", icon: "🔍", label: "Search Records" },
  { id: "bulk", icon: "📄", label: "Bulk Import" },
];

/* ─── Departments as mini cards ─── */
const DEPARTMENTS = [
  { value: "general", icon: "🩺", label: "General" },
  { value: "emergency", icon: "🚑", label: "Emergency" },
  { value: "pediatrics", icon: "👶", label: "Pediatrics" },
  { value: "obstetrics", icon: "🤱", label: "OB/GYN" },
  { value: "surgery", icon: "🏥", label: "Surgery" },
  { value: "dental", icon: "🦷", label: "Dental" },
  { value: "eye", icon: "👁", label: "Eye Clinic" },
  { value: "ent", icon: "👂", label: "ENT" },
];

const CHRONIC_CONDITIONS = [
  "Hypertension", "Diabetes", "Asthma", "Heart Disease", "Sickle Cell",
  "HIV/AIDS", "Tuberculosis", "Epilepsy", "Kidney Disease", "Hepatitis",
];

/* ─── Today's date helper ─── */
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ─── Premium Date Picker ─── */
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function DatePickerTrigger({ value, label, onClick }: { value: string; label?: string; onClick: () => void }) {
  const formatDisplay = (iso: string) => {
    if (!iso) return "Select Date...";
    const parts = iso.split("-");
    return `${parseInt(parts[2])} ${MONTH_NAMES[parseInt(parts[1]) - 1]} ${parts[0]}`;
  };
  return (
    <div>
      {label && <label className="block text-xs font-medium text-[#94A3B8] font-body mb-1.5">{label}</label>}
      <button type="button" onClick={onClick}
        className="w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-body text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#B87333]/30"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(184,115,51,0.15)" }}>
        <span className={value ? "text-white" : "text-[#4A5568]"}>{formatDisplay(value)}</span>
        <span className="text-[#D4956B] text-sm">📅</span>
      </button>
    </div>
  );
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function FrontDeskPage() {
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Front Desk" stationIcon="🏥" allowedRoles={["front_desk", "records", "admin", "super_admin"]}>
      {(operator) => <FrontDeskContent operator={operator} />}
    </StationGate>
  );
}

function FrontDeskContent({ operator }: { operator: OperatorSession }) {
  const theme = useStationTheme();
  const [activeNav, setActiveNav] = useState("register");
  const [recentToken, setRecentToken] = useState<string | null>(null);
  const [recentPin, setRecentPin] = useState<string | null>(null);
  const [recentEmergency, setRecentEmergency] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [erLoading, setErLoading] = useState(false);
  const [erForm, setErForm] = useState({ patientName: "", chiefComplaint: "", arrivalMode: "walk_in" as string });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; token: string; patientName: string; chiefComplaint: string; department: string; symptomSeverity: number | null; emergencyFlag: boolean; createdAt: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [queueData, setQueueData] = useState<{ id: string; token: string; patientName: string; chiefComplaint: string; department: string; symptomSeverity: number | null; emergencyFlag: boolean; createdAt: string }[]>([]);
  const [showCustomInsurance, setShowCustomInsurance] = useState(false);
  const [customInsuranceName, setCustomInsuranceName] = useState("");
  const [showCustomCondition, setShowCustomCondition] = useState(false);
  const [customConditionName, setCustomConditionName] = useState("");
  const [extraConditions, setExtraConditions] = useState<string[]>([]);
  const [showCustomRelation, setShowCustomRelation] = useState(false);
  const [customRelationName, setCustomRelationName] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dpViewYear, setDpViewYear] = useState(new Date().getFullYear());
  const [dpViewMonth, setDpViewMonth] = useState(new Date().getMonth());
  const [dpPendingDate, setDpPendingDate] = useState("");
  // Close visit state
  const [closeQueue, setCloseQueue] = useState<{ recordId: string; patientName: string; queueToken: string; department: string; chiefComplaint: string; visitStatus: string; services: string[]; createdAt: string }[]>([]);
  const [closeCounts, setCloseCounts] = useState({ awaitingClose: 0, closed: 0, lwbs: 0, total: 0 });
  const [closePin, setClosePin] = useState("");
  const [closingRecordId, setClosingRecordId] = useState<string | null>(null);
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeSuccess, setCloseSuccess] = useState<{ token: string; duration: number } | null>(null);

  // Card lookup & auto-fill
  const [cardLookup, setCardLookup] = useState("");
  const [cardFound, setCardFound] = useState<{ cardNumber: string; patientName: string; dateOfBirth?: string; phone?: string; gender?: string; insuranceProvider?: string; insuranceId?: string; emergencyContact?: string; emergencyContactPhone?: string; bloodType?: string; allergies?: string } | null>(null);
  const [cardSearching, setCardSearching] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState<string | null>(null);
  const [creatingCard, setCreatingCard] = useState(false);

  // Cross-branch search (group-aware)
  const [hospitalGroup, setHospitalGroup] = useState<{ groupCode: string; name: string } | null>(null);
  const [crossSearchQuery, setCrossSearchQuery] = useState("");
  const [crossSearchResults, setCrossSearchResults] = useState<{ recordId: string; patientName: string; phone: string | null; queueToken: string | null; visitStatus: string | null; department: string | null; hospitalCode: string; hospitalName: string; hospitalTier: string; createdAt: string }[]>([]);
  const [crossSearchLoading, setCrossSearchLoading] = useState(false);
  const [crossSearchMeta, setCrossSearchMeta] = useState<{ totalFound: number; branchCount: number } | null>(null);

  // Check if current hospital belongs to a group
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/hospitals?code=${HOSPITAL_CODE}`);
        if (res.ok) {
          const data = await res.json();
          if (data.group?.groupCode) {
            setHospitalGroup({ groupCode: data.group.groupCode, name: data.group.name });
          }
        }
      } catch { /* */ }
    })();
  }, []);

  const handleCrossSearch = async () => {
    if (!crossSearchQuery.trim() || crossSearchQuery.length < 2 || !hospitalGroup) return;
    setCrossSearchLoading(true);
    try {
      const res = await fetch(`/api/groups/patients/search?groupCode=${hospitalGroup.groupCode}&q=${encodeURIComponent(crossSearchQuery)}&fromHospitalCode=${HOSPITAL_CODE}`);
      if (res.ok) {
        const data = await res.json();
        setCrossSearchResults(data.results || []);
        setCrossSearchMeta({ totalFound: data.totalFound, branchCount: data.branchCount });
      }
    } catch { /* */ }
    finally { setCrossSearchLoading(false); }
  };

  // Form state
  const [form, setForm] = useState({
    fullName: "", dateOfBirth: todayISO(), gender: "", phone: "", email: "",
    maritalStatus: "", nationality: "Ghanaian", occupation: "", address: "",
    emergencyContactName: "", emergencyContactRelation: "", emergencyContactPhone: "",
    insuranceProvider: "", insuranceId: "", policyHolder: "",
    bloodType: "", allergies: "", currentMedications: "", chronicConditions: [] as string[],
    chiefComplaint: "", symptomDuration: "", symptomSeverity: 5, department: "",
    photoUrl: "", consentTreatment: false, consentPrivacy: false,
  });

  const update = (field: string, value: unknown) => setForm((p) => ({ ...p, [field]: value }));
  const toggleCondition = (c: string) => {
    const current = form.chronicConditions;
    update("chronicConditions", current.includes(c) ? current.filter((x) => x !== c) : [...current, c]);
  };

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleCardLookup = async (q: string) => {
    setCardLookup(q);
    setCardFound(null);
    if (q.length < 3) return;
    setCardSearching(true);
    try {
      const res = await fetch(`/api/cards?hospitalCode=${HOSPITAL_CODE}&q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const cards = await res.json();
        if (cards.length > 0) {
          const c = cards[0];
          setCardFound(c);
          // Auto-fill form
          setForm((p) => ({
            ...p,
            fullName: c.patientName || p.fullName,
            dateOfBirth: c.dateOfBirth || p.dateOfBirth,
            phone: c.phone || p.phone,
            gender: c.gender || p.gender,
            insuranceProvider: c.insuranceProvider || p.insuranceProvider,
            insuranceId: c.insuranceId || p.insuranceId,
            emergencyContactName: c.emergencyContact || p.emergencyContactName,
            emergencyContactPhone: c.emergencyContactPhone || p.emergencyContactPhone,
            bloodType: c.bloodType || p.bloodType,
            allergies: c.allergies || p.allergies,
          }));
        }
      }
    } catch { /* */ }
    finally { setCardSearching(false); }
  };

  const handleCreateCard = async () => {
    setCreatingCard(true);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalCode: HOSPITAL_CODE,
          patientName: form.fullName,
          dateOfBirth: form.dateOfBirth || null,
          phone: form.phone || null,
          gender: form.gender || null,
          bloodType: form.bloodType || null,
          allergies: form.allergies || null,
          insuranceProvider: form.insuranceProvider || null,
          insuranceId: form.insuranceId || null,
          emergencyContact: form.emergencyContactName || null,
          emergencyContactPhone: form.emergencyContactPhone || null,
          createdBy: operator.operatorId,
        }),
      });
      if (res.ok) {
        const card = await res.json();
        setNewCardNumber(card.cardNumber);
      }
    } catch { /* */ }
    finally { setCreatingCard(false); }
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.chiefComplaint.trim() || !form.department) return;
    setLoading(true);
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalCode: HOSPITAL_CODE,
          operatorId: operator.operatorId,
          operatorName: operator.operatorName,
          patient: {
            fullName: form.fullName, dateOfBirth: form.dateOfBirth || null,
            gender: form.gender || null, phone: form.phone || null,
            insuranceId: form.insuranceId || null, address: form.address || null,
            emergencyContact: form.emergencyContactName ? `${form.emergencyContactName} (${form.emergencyContactRelation}) ${form.emergencyContactPhone}` : null,
          },
          chiefComplaint: form.chiefComplaint, department: form.department,
          symptomSeverity: form.symptomSeverity, symptomDuration: form.symptomDuration || undefined,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setRecentToken(result.queueToken);
        setRecentPin(result.checkoutPin ?? null);
        setRecentEmergency(result.emergencyFlag ?? false);
        // Offer card creation if patient doesn't have one
        if (!cardFound) { setShowCreateCard(true); setNewCardNumber(null); }
        setCardLookup(""); setCardFound(null);
        // Auto-route patient to best-fit doctor
        if (result.recordId && form.department) {
          fetch("/api/doctors/route-patient", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, department: form.department, recordId: result.recordId }),
          }).catch(() => {});
        }
        // Reset form but keep date
        setForm((p) => ({
          ...p, fullName: "", gender: "", phone: "", email: "", maritalStatus: "",
          occupation: "", address: "", emergencyContactName: "", emergencyContactRelation: "",
          emergencyContactPhone: "", insuranceProvider: "", insuranceId: "", policyHolder: "",
          bloodType: "", allergies: "", currentMedications: "", chronicConditions: [],
          chiefComplaint: "", symptomDuration: "", symptomSeverity: 5, department: "",
          photoUrl: "", consentTreatment: false, consentPrivacy: false,
        }));
      }
    } catch (err) {
      console.error("Registration failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue?hospitalCode=${HOSPITAL_CODE}`);
      if (res.ok) setQueueData(await res.json());
    } catch { /* retry */ }
  }, []);

  useEffect(() => {
    if (activeNav === "queue") { loadQueue(); }
    // Pusher: instant refresh on queue events
    const pusher = getPusherClient();
    const ch = pusher?.subscribe(`hospital-${HOSPITAL_CODE}-queue`);
    ch?.bind("patient-added", () => loadQueue());
    ch?.bind("patient-requeued", () => loadQueue());
    const erCh = pusher?.subscribe(`hospital-${HOSPITAL_CODE}-emergency`);
    erCh?.bind("emergency-admission", () => loadQueue());
    erCh?.bind("emergency-escalation", () => loadQueue());
    return () => {
      ch?.unbind_all(); pusher?.unsubscribe(`hospital-${HOSPITAL_CODE}-queue`);
      erCh?.unbind_all(); pusher?.unsubscribe(`hospital-${HOSPITAL_CODE}-emergency`);
    };
  }, [activeNav, loadQueue]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/queue?hospitalCode=${HOSPITAL_CODE}`);
      if (res.ok) {
        const data = await res.json();
        const q = searchQuery.toLowerCase();
        setSearchResults(data.filter((d: { patientName: string; token: string; chiefComplaint: string }) =>
          d.patientName.toLowerCase().includes(q) || d.token.toLowerCase().includes(q) || d.chiefComplaint.toLowerCase().includes(q)
        ));
      }
    } catch { /* retry */ }
    finally { setSearchLoading(false); }
  };

  const handleEmergencyAdmit = async () => {
    if (!erForm.patientName.trim() || !erForm.chiefComplaint.trim()) return;
    setErLoading(true);
    try {
      const res = await fetch("/api/queue/emergency-admit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalCode: HOSPITAL_CODE,
          patientName: erForm.patientName,
          chiefComplaint: erForm.chiefComplaint,
          arrivalMode: erForm.arrivalMode,
          severity: 10,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setRecentToken(result.erToken);
        setRecentPin(result.checkoutPin ?? null);
        setRecentEmergency(true);
        setErForm({ patientName: "", chiefComplaint: "", arrivalMode: "walk_in" });
        setActiveNav("register");
      }
    } catch (err) {
      console.error("Emergency admit failed:", err);
    } finally {
      setErLoading(false);
    }
  };

  const handleBulkParsed = async (entries: ParsedPatientEntry[]) => {
    let saved = 0;
    for (const entry of entries) {
      try {
        const res = await fetch("/api/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hospitalCode: HOSPITAL_CODE,
            patient: { fullName: entry.patient.fullName, dateOfBirth: entry.patient.dateOfBirth || null, gender: entry.patient.gender || null, phone: entry.patient.phone || null },
            chiefComplaint: entry.visit.chiefComplaint || "General consultation",
            department: entry.visit.department || "general",
          }),
        });
        if (res.ok) saved++;
      } catch { /* continue with next */ }
    }
    if (saved > 0) loadQueue();
  };

  // Close visit handlers
  const loadCloseQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/visit?hospitalCode=${HOSPITAL_CODE}&view=close_queue`);
      if (res.ok) {
        const data = await res.json();
        setCloseQueue(data.patients);
        setCloseCounts(data.counts);
      }
    } catch { /* retry */ }
  }, []);

  useEffect(() => {
    if (activeNav === "close") { loadCloseQueue(); const i = setInterval(loadCloseQueue, 5000); return () => clearInterval(i); }
  }, [activeNav, loadCloseQueue]);

  const handleCloseVisit = async (recordId: string) => {
    if (!closePin || closePin.length !== 4) return;
    setCloseLoading(true);
    try {
      const res = await fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "close", recordId, pin: closePin, closedBy: `${operator.operatorName} (${operator.operatorId})` }),
      });
      if (res.ok) {
        const data = await res.json();
        const patient = closeQueue.find((p) => p.recordId === recordId);
        setCloseSuccess({ token: patient?.queueToken || "—", duration: data.summary?.durationMinutes || 0 });
        setClosePin("");
        setClosingRecordId(null);
        loadCloseQueue();
        setTimeout(() => setCloseSuccess(null), 5000);
      }
    } catch { /* retry */ }
    finally { setCloseLoading(false); }
  };

  const handleMarkLwbs = async (recordId: string) => {
    try {
      await fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "mark_lwbs", recordId, markedBy: `${operator.operatorName} (${operator.operatorId})` }),
      });
      loadCloseQueue();
    } catch { /* retry */ }
  };

  return (
    <StationThemeProvider theme={theme}>
    <div style={{ minHeight: "100vh", background: theme.pageBg, position: "relative", overflow: "hidden", transition: "background 0.5s ease" }}>
      <style>{`@keyframes emergencyPulse { 0%,100%{box-shadow:0 0 20px rgba(220,38,38,0.1)} 50%{box-shadow:0 0 40px rgba(220,38,38,0.25)} }`}</style>
      {/* Background layers */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 55% 35%, ${theme.overlayCopper} 0%, transparent 50%)`, pointerEvents: "none", transition: "background 0.5s ease" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 80% 50%, ${theme.overlayBlue} 0%, transparent 40%)`, pointerEvents: "none", transition: "background 0.5s ease" }} />
      <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: theme.gridOpacity, transition: "opacity 0.5s ease" }} />
      <div style={{ opacity: theme.canvasOpacity, transition: "opacity 0.5s ease" }}><GalaxyCanvas /></div>

      {/* Fixed header */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "16px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: theme.headerBorder, background: theme.headerBg,
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        transition: "background 0.5s ease, border-color 0.5s ease",
      }}>
        <div onClick={() => window.location.href = "/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh"} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: 300, fontSize: 13, color: theme.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", transition: "color 0.4s ease" }}>Dalxic</span>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: theme.textSecondary, transition: "color 0.4s ease" }}>{HOSPITAL_NAME}</span>
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <ThemeToggle isDayMode={theme.isDayMode} onToggle={theme.toggle} />
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <OperatorBadge session={operator} onLogout={() => window.location.reload()} />
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <time suppressHydrationWarning style={{ fontFamily: fontFamily.mono, fontSize: 12, color: theme.copperText, transition: "color 0.4s ease" }}>
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </time>
        </div>
      </header>

      {/* Main */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 60px" }}>

        {/* Navigation cards (mini workstation subset) */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          {NAV_ITEMS.map((n) => (
            <motion.button
              key={n.id}
              type="button"
              onClick={() => setActiveNav(n.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-body transition-all duration-300"
              style={{
                background: activeNav === n.id
                  ? (n.id === "emergency" ? "rgba(220,38,38,0.1)" : theme.navActiveBg)
                  : (n.id === "emergency" ? "rgba(220,38,38,0.03)" : theme.navInactiveBg),
                border: `1px solid ${activeNav === n.id
                  ? (n.id === "emergency" ? "rgba(220,38,38,0.4)" : theme.navActiveBorder)
                  : (n.id === "emergency" ? "rgba(220,38,38,0.12)" : theme.navInactiveBorder)}`,
                color: activeNav === n.id
                  ? (n.id === "emergency" ? "#F87171" : theme.navActiveText)
                  : (n.id === "emergency" ? "#DC2626" : theme.navInactiveText),
                boxShadow: activeNav === n.id ? `0 0 20px ${n.id === "emergency" ? "rgba(220,38,38,0.12)" : COPPER + "12"}` : "none",
                transition: "background 0.4s ease, border-color 0.4s ease, color 0.4s ease",
              }}
            >
              <span>{n.icon}</span>
              {n.label}
            </motion.button>
          ))}
        </div>

        {/* Token toast — fixed overlay, no layout shift */}
        <AnimatePresence>
          {recentToken && (
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] p-5 rounded-2xl flex items-center gap-6 cursor-pointer"
              style={{
                background: recentEmergency ? "rgba(20,6,6,0.95)" : "rgba(12,8,18,0.95)",
                border: `1px solid ${recentEmergency ? "rgba(220,38,38,0.3)" : "rgba(184,115,51,0.25)"}`,
                boxShadow: recentEmergency
                  ? "0 16px 60px rgba(220,38,38,0.2), 0 0 80px rgba(220,38,38,0.08)"
                  : `0 16px 60px rgba(0,0,0,0.5), 0 0 80px ${COPPER}10`,
                backdropFilter: "blur(16px)",
                animation: recentEmergency ? "emergencyPulse 1.5s ease-in-out infinite" : undefined,
                minWidth: 380,
              }}
              onClick={() => { setRecentToken(null); setRecentPin(null); }}
            >
              <div>
                <p className={`text-sm font-body font-medium ${recentEmergency ? "text-red-400" : "text-[#D4956B]"}`}>
                  {recentEmergency ? "⚠ Emergency Auto-Flagged" : "Patient Registered Successfully"}
                </p>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {recentEmergency ? "Priority ER Token — Immediate Attention" : "Queue Token Assigned"}
                </p>
                {recentPin && (
                  <div className="flex items-center gap-2 mt-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">Checkout Code:</span>
                    <span className="text-lg font-mono font-bold tracking-[0.3em] text-[#22C55E]">{recentPin}</span>
                    <span className="text-[9px] text-[#4A5568]">— Give To Patient</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <button type="button" onClick={(e) => {
                    e.stopPropagation();
                    const printUrl = `/print/ticket?tokenId=${encodeURIComponent(recentToken!)}&hospitalCode=${HOSPITAL_CODE}${recentPin ? `&pin=${recentPin}` : ""}`;
                    const iframe = document.createElement("iframe");
                    iframe.style.display = "none";
                    iframe.src = printUrl;
                    document.body.appendChild(iframe);
                    setTimeout(() => document.body.removeChild(iframe), 10000);
                  }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-body font-medium transition-all"
                    style={{ background: "rgba(184,115,51,0.1)", border: `1px solid ${COPPER}30`, color: theme.copperText }}>
                    🖨 Print Ticket
                  </button>
                  <span className="text-[9px] text-[#4A5568]">Click Toast To Dismiss</span>
                </div>
              </div>
              <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-4xl font-mono font-bold"
                style={{
                  background: recentEmergency
                    ? "linear-gradient(135deg, #EF4444, #F87171)"
                    : `linear-gradient(135deg, ${COPPER}, #D4956B)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                {recentToken}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ═══════ REGISTRATION VIEW ═══════ */}
          {activeNav === "register" && (
            <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Card Lookup Bar */}
              <div style={{ marginBottom: 16 }}>
                <WorkshopBox title="Card Lookup" icon="💳" delay={0}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <DInput
                        label="Card Number Or Phone"
                        placeholder="DH-XXXXXX Or 0XX-XXX-XXXX"
                        value={cardLookup}
                        onChange={(e) => handleCardLookup(e.target.value)}
                      />
                    </div>
                    {cardSearching && (
                      <span style={{ fontSize: 11, color: theme.textSecondary, fontFamily: fontFamily.mono }}>Searching...</span>
                    )}
                    {cardFound && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "6px 14px", borderRadius: 10,
                          background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
                        }}
                      >
                        <span style={{ fontSize: 12, color: "#22C55E", fontWeight: 700 }}>Card Member Found</span>
                        <span style={{ fontSize: 10, color: theme.textSecondary, fontFamily: fontFamily.mono }}>{cardFound.cardNumber}</span>
                        <span style={{ fontSize: 10, color: theme.textMuted }}>— Details Auto-Filled</span>
                      </motion.div>
                    )}
                  </div>
                </WorkshopBox>
              </div>

              {/* Row 1: Identity + Photo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 16, marginBottom: 16 }}>
                <WorkshopBox title="Patient Identity" icon="👤" delay={0.05}>
                  <div className="space-y-3">
                    <DInput label="Full Name" placeholder="First Middle Last" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required autoFocus />
                    <div className="grid grid-cols-3 gap-3">
                      <DatePickerTrigger label="Date Of Birth" value={form.dateOfBirth} onClick={() => {
                        const p = form.dateOfBirth ? new Date(form.dateOfBirth + "T00:00:00") : new Date();
                        setDpViewYear(p.getFullYear()); setDpViewMonth(p.getMonth());
                        setDpPendingDate(form.dateOfBirth); setShowDatePicker(true);
                      }} />
                      <DSelect label="Gender" options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }]} value={form.gender} onChange={(e) => update("gender", e.target.value)} />
                      <DSelect label="Marital Status" options={[{ value: "single", label: "Single" }, { value: "married", label: "Married" }, { value: "divorced", label: "Divorced" }, { value: "widowed", label: "Widowed" }]} value={form.maritalStatus} onChange={(e) => update("maritalStatus", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <DInput label="Nationality" value={form.nationality} onChange={(e) => update("nationality", e.target.value)} />
                      <DInput label="Occupation" placeholder="e.g. Teacher, Trader" value={form.occupation} onChange={(e) => update("occupation", e.target.value)} />
                    </div>
                  </div>
                </WorkshopBox>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="rounded-2xl p-5 flex flex-col items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(184,115,51,0.12)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  <CameraCapture currentPhoto={form.photoUrl} onCapture={(url) => update("photoUrl", url)} />
                </motion.div>
              </div>

              {/* Row 2: Contact + Emergency */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <WorkshopBox title="Contact Details" icon="📞" delay={0.15}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <DInput label="Phone Number" placeholder="0XX-XXX-XXXX" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                      <DInput label="Email" placeholder="Optional" value={form.email} onChange={(e) => update("email", e.target.value)} />
                    </div>
                    <DInput label="Home Address" placeholder="Street, City, Region" value={form.address} onChange={(e) => update("address", e.target.value)} />
                  </div>
                </WorkshopBox>

                <WorkshopBox title="Emergency Contact" icon="🚨" delay={0.2}>
                  <div className="space-y-3">
                    <DInput label="Contact Name" placeholder="Full Name" value={form.emergencyContactName} onChange={(e) => update("emergencyContactName", e.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                      <DSelect label="Relationship" options={[
                        { value: "spouse", label: "Spouse" }, { value: "parent", label: "Parent" },
                        { value: "sibling", label: "Sibling" }, { value: "child", label: "Child" },
                        { value: "friend", label: "Friend" },
                        ...(form.emergencyContactRelation && !["spouse","parent","sibling","child","friend",""].includes(form.emergencyContactRelation)
                          ? [{ value: form.emergencyContactRelation, label: `✦ ${form.emergencyContactRelation}` }] : []),
                        { value: "__other__", label: "Other..." },
                      ]} value={form.emergencyContactRelation} onChange={(e) => {
                        if (e.target.value === "__other__") {
                          setShowCustomRelation(true);
                          setCustomRelationName("");
                        } else {
                          update("emergencyContactRelation", e.target.value);
                        }
                      }} />
                      <DInput label="Phone" placeholder="0XX-XXX-XXXX" value={form.emergencyContactPhone} onChange={(e) => update("emergencyContactPhone", e.target.value)} />
                    </div>
                  </div>
                </WorkshopBox>
              </div>

              {/* Row 3: Insurance + Medical */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <WorkshopBox title="Insurance" icon="🛡️" delay={0.25}>
                  <div className="space-y-3">
                    <DSelect label="Insurance Provider" options={[
                      { value: "nhis", label: "NHIS" }, { value: "acacia", label: "Acacia Health" },
                      { value: "metropolitan", label: "Metropolitan" }, { value: "glico", label: "Glico" },
                      { value: "enterprise", label: "Enterprise Life" }, { value: "self_pay", label: "Self Pay" },
                      ...( form.insuranceProvider && !["nhis","acacia","metropolitan","glico","enterprise","self_pay",""].includes(form.insuranceProvider)
                        ? [{ value: form.insuranceProvider, label: `✦ ${form.insuranceProvider}` }] : []),
                      { value: "__other__", label: "Other..." },
                    ]} value={form.insuranceProvider} onChange={(e) => {
                      if (e.target.value === "__other__") {
                        setShowCustomInsurance(true);
                        setCustomInsuranceName("");
                      } else {
                        update("insuranceProvider", e.target.value);
                      }
                    }} />
                    <div className="grid grid-cols-2 gap-3">
                      <DInput label="Policy / Member ID" placeholder="Card Number" value={form.insuranceId} onChange={(e) => update("insuranceId", e.target.value)} />
                      <DInput label="Policy Holder" placeholder="If Different" value={form.policyHolder} onChange={(e) => update("policyHolder", e.target.value)} />
                    </div>
                  </div>
                </WorkshopBox>

                <WorkshopBox title="Medical History" icon="💊" delay={0.3}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <DSelect label="Blood Type" options={[
                        { value: "A+", label: "A+" }, { value: "A-", label: "A-" }, { value: "B+", label: "B+" }, { value: "B-", label: "B-" },
                        { value: "AB+", label: "AB+" }, { value: "AB-", label: "AB-" }, { value: "O+", label: "O+" }, { value: "O-", label: "O-" },
                      ]} value={form.bloodType} onChange={(e) => update("bloodType", e.target.value)} />
                      <DInput label="Known Allergies" placeholder="e.g. Penicillin, None" value={form.allergies} onChange={(e) => update("allergies", e.target.value)} />
                    </div>
                    <DInput label="Current Medications" placeholder="List Or 'None'" value={form.currentMedications} onChange={(e) => update("currentMedications", e.target.value)} />
                    <div>
                      <p className="text-xs text-[#94A3B8] mb-2">Chronic Conditions</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[...CHRONIC_CONDITIONS, ...extraConditions].map((c) => {
                          const active = form.chronicConditions.includes(c);
                          return (
                            <button key={c} type="button" onClick={() => toggleCondition(c)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-body transition-all"
                              style={{
                                background: active ? "rgba(184,115,51,0.12)" : "rgba(255,255,255,0.02)",
                                border: `1px solid ${active ? COPPER + "40" : "rgba(255,255,255,0.05)"}`,
                                color: active ? "#D4956B" : "#64748B",
                              }}>
                              {active && "✓ "}{c}
                            </button>
                          );
                        })}
                        {showCustomCondition ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              autoFocus
                              placeholder="Condition Name..."
                              value={customConditionName}
                              onChange={(e) => setCustomConditionName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && customConditionName.trim()) {
                                  const name = customConditionName.trim();
                                  if (![...CHRONIC_CONDITIONS, ...extraConditions].includes(name)) {
                                    setExtraConditions((p) => [...p, name]);
                                  }
                                  toggleCondition(name);
                                  setCustomConditionName("");
                                  setShowCustomCondition(false);
                                }
                                if (e.key === "Escape") setShowCustomCondition(false);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-body text-white placeholder:text-[#4A5568] focus:outline-none w-[130px]"
                              style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${COPPER}40` }}
                            />
                            <button type="button" onClick={() => setShowCustomCondition(false)}
                              className="text-[10px] text-[#64748B] hover:text-[#94A3B8]">✕</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setShowCustomCondition(true)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-body transition-all"
                            style={{
                              background: "rgba(184,115,51,0.04)",
                              border: `1px dashed ${COPPER}30`,
                              color: theme.copperText,
                            }}>
                            + Add Other
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </WorkshopBox>
              </div>

              {/* Row 4: Visit Reason (full width) */}
              <WorkshopBox title="Reason For Visit" icon="📝" delay={0.35} className="mb-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                      Chief Complaint <span className="text-red-400">*</span>
                    </label>
                    <textarea rows={2} placeholder="Describe The Patient's Primary Reason For Visiting..."
                      value={form.chiefComplaint} onChange={(e) => update("chiefComplaint", e.target.value)}
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body text-white placeholder:text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#B87333]/30 resize-none transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(184,115,51,0.15)" }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DInput label="Symptom Duration" placeholder="e.g. 3 Days, 2 Weeks" value={form.symptomDuration} onChange={(e) => update("symptomDuration", e.target.value)} />
                    <div>
                      <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                        Severity: <span className="font-mono text-[#B87333]">{form.symptomSeverity}/10</span>
                      </label>
                      <input type="range" min={1} max={10} value={form.symptomSeverity}
                        onChange={(e) => update("symptomSeverity", parseInt(e.target.value))}
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: COPPER, background: "rgba(255,255,255,0.06)" }} />
                      <div className="flex justify-between text-[8px] text-[#4A5568] mt-0.5"><span>Mild</span><span>Moderate</span><span>Severe</span></div>
                      {form.symptomSeverity >= 8 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          className="mt-2 px-3 py-1.5 rounded-lg flex items-center gap-2"
                          style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] text-red-400">Will Auto-Flag As Emergency — ER Token Assigned</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </WorkshopBox>

              {/* Row 5: Department Selection (mini cards) */}
              <WorkshopBox title="Assign Department" icon="🏥" delay={0.4} className="mb-4">
                <div className="grid grid-cols-4 gap-2">
                  {DEPARTMENTS.map((d) => {
                    const active = form.department === d.value;
                    return (
                      <motion.button key={d.value} type="button" onClick={() => update("department", d.value)}
                        whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                        className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-center transition-all duration-300"
                        style={{
                          background: active ? "rgba(184,115,51,0.1)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${active ? COPPER + "50" : "rgba(255,255,255,0.05)"}`,
                          boxShadow: active ? `0 0 24px ${COPPER}18` : "none",
                        }}>
                        <span className="text-xl">{d.icon}</span>
                        <span className="text-[10px] font-body" style={{ color: active ? "#D4956B" : "#94A3B8" }}>{d.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </WorkshopBox>

              {/* Row 6: Consent + Submit */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16 }}>
                <WorkshopBox title="Consent" icon="✅" delay={0.45}>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.consentTreatment} onChange={(e) => update("consentTreatment", e.target.checked)}
                        className="w-3.5 h-3.5 rounded" style={{ accentColor: COPPER }} />
                      <span className="text-xs text-[#94A3B8]">Consent To Treatment</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.consentPrivacy} onChange={(e) => update("consentPrivacy", e.target.checked)}
                        className="w-3.5 h-3.5 rounded" style={{ accentColor: COPPER }} />
                      <span className="text-xs text-[#94A3B8]">Ghana DPA 2012 Privacy</span>
                    </label>
                  </div>
                </WorkshopBox>

                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="flex items-center">
                  <Button variant="copper" size="lg" loading={loading}
                    disabled={!form.fullName.trim() || !form.chiefComplaint.trim() || !form.department || !form.consentTreatment || !form.consentPrivacy}
                    onClick={handleSubmit}>
                    Register & Assign Queue →
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ═══════ EMERGENCY ADMIT VIEW ═══════ */}
          {activeNav === "emergency" && (
            <motion.div key="emergency" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkshopBox title="Emergency Admission" icon="🚨" delay={0.05}
                className="!border-red-500/20" >
                <p className="text-xs text-red-400/70 mb-5">Bypass Normal Registration — For Ambulance, Walk-In, Or Transfer Emergencies</p>

                <div className="space-y-4">
                  <DInput label="Patient Name" placeholder="Full Name (Or 'Unknown' If Unidentified)" required
                    value={erForm.patientName} onChange={(e) => setErForm((p) => ({ ...p, patientName: e.target.value }))} />

                  {/* Arrival Mode selector — 3 icon cards */}
                  <div>
                    <p className="text-xs font-medium text-[#94A3B8] mb-2">Arrival Mode</p>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { value: "ambulance", icon: "🚑", label: "Ambulance" },
                        { value: "walk_in", icon: "🚶", label: "Walk-In" },
                        { value: "transfer", icon: "🏥", label: "Transfer" },
                      ] as const).map((m) => {
                        const active = erForm.arrivalMode === m.value;
                        return (
                          <motion.button key={m.value} type="button"
                            onClick={() => setErForm((p) => ({ ...p, arrivalMode: m.value }))}
                            whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                            className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-300"
                            style={{
                              background: active ? "rgba(220,38,38,0.08)" : "rgba(255,255,255,0.02)",
                              border: `1px solid ${active ? "rgba(220,38,38,0.3)" : "rgba(255,255,255,0.05)"}`,
                              boxShadow: active ? "0 0 20px rgba(220,38,38,0.1)" : "none",
                            }}>
                            <span className="text-2xl">{m.icon}</span>
                            <span className="text-[10px] font-body" style={{ color: active ? "#F87171" : "#94A3B8" }}>{m.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                      Chief Complaint <span className="text-red-400">*</span>
                    </label>
                    <textarea rows={2} placeholder="Describe Emergency Situation..."
                      value={erForm.chiefComplaint} onChange={(e) => setErForm((p) => ({ ...p, chiefComplaint: e.target.value }))}
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body text-white placeholder:text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(220,38,38,0.15)" }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs text-red-400/60 font-mono">SEVERITY: 10/10 — CRITICAL</span>
                    </div>
                    <Button variant="copper" size="lg" loading={erLoading}
                      disabled={!erForm.patientName.trim() || !erForm.chiefComplaint.trim()}
                      onClick={handleEmergencyAdmit}
                      className="!bg-red-600 hover:!bg-red-500 !border-red-500/30">
                      🚨 Admit Emergency
                    </Button>
                  </div>
                </div>
              </WorkshopBox>
            </motion.div>
          )}

          {/* ═══════ CLOSE VISIT VIEW ═══════ */}
          {activeNav === "close" && (
            <motion.div key="close" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                <WorkshopBox title="Awaiting Checkout" icon="⏳" delay={0.05}>
                  <p className="text-3xl font-mono font-bold" style={{ color: COPPER }}>{closeCounts.awaitingClose}</p>
                  <p className="text-[10px] text-[#64748B] mt-1">Patients Ready To Close</p>
                </WorkshopBox>
                <WorkshopBox title="Closed Today" icon="✅" delay={0.1}>
                  <p className="text-3xl font-mono font-bold text-[#22C55E]">{closeCounts.closed}</p>
                  <p className="text-[10px] text-[#64748B] mt-1">Visits Completed</p>
                </WorkshopBox>
                <WorkshopBox title="LWBS" icon="⚠️" delay={0.15}>
                  <p className="text-3xl font-mono font-bold text-[#F59E0B]">{closeCounts.lwbs}</p>
                  <p className="text-[10px] text-[#64748B] mt-1">Left Without Being Seen</p>
                </WorkshopBox>
              </div>

              {/* Success toast */}
              <AnimatePresence>
                {closeSuccess && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-body font-medium text-[#22C55E]">Visit Closed Successfully</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">Token {closeSuccess.token} — Duration: {closeSuccess.duration} Minutes</p>
                      </div>
                      <span className="text-2xl font-mono font-bold text-[#22C55E]">✓</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close queue */}
              {closeQueue.length === 0 ? (
                <WorkshopBox title="No Patients Awaiting Checkout" icon="✅" delay={0.05}>
                  <p className="text-xs text-[#64748B]">Patients Will Appear Here After Completing Their Consultation And Pharmacy Visit</p>
                </WorkshopBox>
              ) : (
                <div className="space-y-3">
                  {closeQueue.map((patient, i) => (
                    <motion.div key={patient.recordId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <WorkshopBox title={patient.queueToken} icon="" delay={0}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-body font-semibold text-white">{patient.patientName}</p>
                            <p className="text-xs text-[#64748B] mt-0.5">{patient.department} — {patient.chiefComplaint}</p>
                            {patient.services.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {patient.services.map((s) => (
                                  <span key={s} className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded" style={{ background: "rgba(184,115,51,0.06)", border: "1px solid rgba(184,115,51,0.1)", color: theme.copperText, letterSpacing: "0.5px" }}>
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-[10px] text-[#3D4D78] mt-2">
                              Checked In: {new Date(patient.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-4">
                            <span className="text-2xl font-mono font-bold" style={{ background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                              {patient.queueToken}
                            </span>
                          </div>
                        </div>

                        {/* PIN entry for this patient */}
                        {closingRecordId === patient.recordId ? (
                          <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(184,115,51,0.08)" }}>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mb-2">Enter Patient&apos;s Checkout Code (From Their Ticket Or WhatsApp)</p>
                            <div className="flex items-center gap-3">
                              <input
                                type="password" inputMode="numeric" maxLength={4} autoFocus
                                value={closePin} onChange={(e) => setClosePin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                className="w-32 text-center text-2xl font-mono font-bold rounded-xl border px-4 py-2.5 tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-[#B87333]/40"
                                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(184,115,51,0.2)" }}
                                placeholder="••••"
                              />
                              <Button variant="copper" loading={closeLoading}
                                disabled={closePin.length !== 4}
                                onClick={() => handleCloseVisit(patient.recordId)}>
                                Close Visit
                              </Button>
                              <button type="button" onClick={() => { setClosingRecordId(null); setClosePin(""); }}
                                className="px-3 py-2 rounded-lg text-xs text-[#64748B]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 pt-2 flex gap-2" style={{ borderTop: "1px solid rgba(184,115,51,0.06)" }}>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setClosingRecordId(patient.recordId); setClosePin(""); }}
                              className="flex-1 py-2 rounded-lg text-xs font-body font-semibold text-white"
                              style={{ background: `linear-gradient(135deg, ${COPPER}, #D4956B)` }}>
                              Checkout — Enter PIN
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleMarkLwbs(patient.recordId)}
                              className="px-3 py-2 rounded-lg text-xs font-body font-medium"
                              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", color: "#F59E0B" }}>
                              LWBS
                            </motion.button>
                          </div>
                        )}
                      </WorkshopBox>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════ BULK IMPORT VIEW ═══════ */}
          {activeNav === "bulk" && (
            <motion.div key="bulk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkshopBox title="Historical Bulk Entry" icon="📄" delay={0.05}>
                <p className="text-xs text-[#94A3B8] mb-4">Paste Records — Nexus-7 Will Detect Patients, Structure Data, And Assign To Months</p>
                <BulkPaste hospitalCode={HOSPITAL_CODE} onParsed={handleBulkParsed} />
              </WorkshopBox>
            </motion.div>
          )}

          {/* ═══════ QUEUE VIEW ═══════ */}
          {activeNav === "queue" && (
            <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                <WorkshopBox title="Total Today" icon="👥" delay={0.05}>
                  <p className="text-3xl font-mono font-bold" style={{ color: COPPER }}>{queueData.length}</p>
                  <p className="text-[10px] text-[#64748B] mt-1">Patients Registered</p>
                </WorkshopBox>
                <WorkshopBox title="Emergencies" icon="🚨" delay={0.1}>
                  <p className="text-3xl font-mono font-bold text-red-400">{queueData.filter((q) => q.emergencyFlag).length}</p>
                  <p className="text-[10px] text-[#64748B] mt-1">Flagged Emergency</p>
                </WorkshopBox>
                <WorkshopBox title="Departments" icon="🏥" delay={0.15}>
                  <p className="text-3xl font-mono font-bold text-[#0EA5E9]">{new Set(queueData.map((q) => q.department)).size}</p>
                  <p className="text-[10px] text-[#64748B] mt-1">Active Departments</p>
                </WorkshopBox>
              </div>

              <WorkshopBox title="Live Queue" icon="📋" delay={0.2}>
                {queueData.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#64748B] text-sm">No Patients In Queue Today</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {[...queueData].sort((a, b) => (b.emergencyFlag ? 1 : 0) - (a.emergencyFlag ? 1 : 0)).map((item, i) => (
                      <motion.div key={item.id}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 p-3 rounded-xl transition-all"
                        style={{
                          background: item.emergencyFlag ? "rgba(220,38,38,0.05)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${item.emergencyFlag ? "rgba(220,38,38,0.2)" : "rgba(184,115,51,0.08)"}`,
                        }}>
                        <span className={`font-mono font-bold text-sm min-w-[80px] ${item.emergencyFlag ? "text-red-400" : "text-[#B87333]"}`}>
                          {item.token}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-body truncate">{item.patientName}</p>
                          <p className="text-xs text-[#64748B] truncate">{item.chiefComplaint}</p>
                        </div>
                        <span className="text-[10px] text-[#64748B] px-2 py-1 rounded-lg font-body"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          {item.department}
                        </span>
                        {item.symptomSeverity != null && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                            style={{
                              color: item.symptomSeverity >= 8 ? "#EF4444" : item.symptomSeverity >= 4 ? "#F59E0B" : "#22C55E",
                              background: `${item.symptomSeverity >= 8 ? "#EF4444" : item.symptomSeverity >= 4 ? "#F59E0B" : "#22C55E"}15`,
                              border: `1px solid ${item.symptomSeverity >= 8 ? "#EF4444" : item.symptomSeverity >= 4 ? "#F59E0B" : "#22C55E"}30`,
                            }}>
                            {item.symptomSeverity}/10
                          </span>
                        )}
                        <span className="text-[10px] text-[#64748B] font-mono">
                          {new Date(item.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end mt-3">
                  <button type="button" onClick={loadQueue} className="text-[10px] text-[#D4956B] px-3 py-1 rounded-lg transition-all"
                    style={{ background: "rgba(184,115,51,0.06)", border: `1px solid ${COPPER}20` }}>
                    ↻ Refresh
                  </button>
                </div>
              </WorkshopBox>
            </motion.div>
          )}

          {/* ═══════ SEARCH VIEW ═══════ */}
          {activeNav === "search" && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkshopBox title="Search Records" icon="🔍" delay={0.05}>
                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <DInput placeholder="Search By Name, Token, Or Complaint..." value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                  </div>
                  <button type="button" onClick={handleSearch} disabled={searchLoading || !searchQuery.trim()}
                    className="px-5 py-2.5 rounded-xl text-sm font-body font-medium text-white shrink-0 disabled:opacity-40 transition-all"
                    style={{ background: `linear-gradient(135deg, ${COPPER}, #D4956B)` }}>
                    {searchLoading ? "..." : "Search"}
                  </button>
                </div>

                {searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    <p className="text-xs text-[#64748B] mb-2">{searchResults.length} Result{searchResults.length !== 1 ? "s" : ""} Found</p>
                    {searchResults.map((item, i) => (
                      <motion.div key={item.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="p-3.5 rounded-xl"
                        style={{
                          background: item.emergencyFlag ? "rgba(220,38,38,0.05)" : "rgba(255,255,255,0.025)",
                          border: `1px solid ${item.emergencyFlag ? "rgba(220,38,38,0.2)" : "rgba(184,115,51,0.1)"}`,
                        }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-3">
                            <span className={`font-mono font-bold text-sm ${item.emergencyFlag ? "text-red-400" : "text-[#B87333]"}`}>
                              {item.token}
                            </span>
                            <span className="text-sm text-white font-body">{item.patientName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.emergencyFlag && (
                              <span className="text-[9px] text-red-400 px-1.5 py-0.5 rounded animate-pulse"
                                style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}>
                                EMERGENCY
                              </span>
                            )}
                            <span className="text-[10px] text-[#64748B] font-mono">
                              {new Date(item.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                          <span>{item.chiefComplaint}</span>
                          <span className="text-[#64748B]">•</span>
                          <span className="text-[#64748B]">{item.department}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : searchQuery && !searchLoading ? (
                  <div className="text-center py-8">
                    <p className="text-[#64748B] text-sm">No Records Found For &quot;{searchQuery}&quot;</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#64748B] text-sm">Enter A Name, Token, Or Complaint To Search</p>
                  </div>
                )}
              </WorkshopBox>

              {/* Cross-Branch Search — only visible if hospital is in a group */}
              {hospitalGroup && (
                <WorkshopBox title={`Cross-Branch Search — ${hospitalGroup.name}`} icon="🌐" delay={0.15}>
                  <p className="text-xs text-[#64748B] mb-3">Search patients across all {hospitalGroup.name} branches</p>
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1">
                      <DInput placeholder="Search By Name, Phone, Token, Or Insurance ID..." value={crossSearchQuery}
                        onChange={(e) => setCrossSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCrossSearch()} />
                    </div>
                    <button type="button" onClick={handleCrossSearch} disabled={crossSearchLoading || crossSearchQuery.length < 2}
                      className="px-5 py-2.5 rounded-xl text-sm font-body font-medium text-white shrink-0 disabled:opacity-40 transition-all"
                      style={{ background: "linear-gradient(135deg, #0EA5E9, #38BDF8)" }}>
                      {crossSearchLoading ? "..." : "Search Group"}
                    </button>
                  </div>

                  {crossSearchResults.length > 0 && crossSearchMeta ? (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      <p className="text-xs text-[#64748B] mb-2">{crossSearchMeta.totalFound} Result{crossSearchMeta.totalFound !== 1 ? "s" : ""} Across {crossSearchMeta.branchCount} Branches</p>
                      {crossSearchResults.map((item, i) => {
                        const isOtherBranch = item.hospitalCode !== HOSPITAL_CODE;
                        return (
                          <motion.div key={item.recordId}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="p-3.5 rounded-xl"
                            style={{
                              background: isOtherBranch ? "rgba(14,165,233,0.04)" : "rgba(255,255,255,0.025)",
                              border: `1px solid ${isOtherBranch ? "rgba(14,165,233,0.15)" : "rgba(184,115,51,0.1)"}`,
                            }}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-3">
                                {item.queueToken && (
                                  <span className="font-mono font-bold text-sm" style={{ color: isOtherBranch ? "#0EA5E9" : COPPER }}>
                                    {item.queueToken}
                                  </span>
                                )}
                                <span className="text-sm text-white font-body">{item.patientName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] px-2 py-0.5 rounded font-bold font-mono" style={{
                                  background: isOtherBranch ? "rgba(14,165,233,0.1)" : "rgba(184,115,51,0.08)",
                                  border: `1px solid ${isOtherBranch ? "rgba(14,165,233,0.2)" : "rgba(184,115,51,0.15)"}`,
                                  color: isOtherBranch ? "#38BDF8" : COPPER,
                                }}>
                                  {item.hospitalCode}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                              <span>{item.hospitalName}</span>
                              {item.department && <><span className="text-[#64748B]">•</span><span className="text-[#64748B]">{item.department}</span></>}
                              {item.phone && <><span className="text-[#64748B]">•</span><span className="text-[#64748B]">{item.phone}</span></>}
                              {item.visitStatus && <><span className="text-[#64748B]">•</span><span className="text-[#64748B] uppercase text-[10px]">{item.visitStatus.replace(/_/g, " ")}</span></>}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : crossSearchQuery.length >= 2 && !crossSearchLoading ? (
                    <div className="text-center py-6">
                      <p className="text-[#64748B] text-sm">No Patients Found Across Group Branches</p>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-[#475569] text-xs">Minimum 2 Characters Required</p>
                    </div>
                  )}
                </WorkshopBox>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ═══════ DATE PICKER POPUP ═══════ */}
      <AnimatePresence>
        {showDatePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
            onClick={() => setShowDatePicker(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-[340px] rounded-2xl overflow-hidden"
              style={{
                background: "rgba(12,8,18,0.97)",
                border: `1px solid ${COPPER}25`,
                boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 60px ${COPPER}08`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Selected date header */}
              <div className="px-6 pt-5 pb-4" style={{ background: "linear-gradient(135deg, rgba(184,115,51,0.12), rgba(184,115,51,0.04))" }}>
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#D4956B] mb-1">Selected Date</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={dpPendingDate}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="text-lg font-body font-medium text-white"
                  >
                    {dpPendingDate
                      ? `${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date(dpPendingDate+"T00:00:00").getDay()]}, ${parseInt(dpPendingDate.split("-")[2])} ${MONTH_NAMES[parseInt(dpPendingDate.split("-")[1])-1]} ${dpPendingDate.split("-")[0]}`
                      : "No Date Selected"}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="p-5">
                {/* Month/Year nav */}
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => { if (dpViewMonth===0){setDpViewMonth(11);setDpViewYear(y=>y-1)}else setDpViewMonth(m=>m-1); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all">‹</button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-body font-medium text-white">{MONTH_NAMES[dpViewMonth]}</span>
                    <span className="text-sm font-mono text-[#D4956B]">{dpViewYear}</span>
                  </div>
                  <button type="button" onClick={() => { if (dpViewMonth===11){setDpViewMonth(0);setDpViewYear(y=>y+1)}else setDpViewMonth(m=>m+1); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all">›</button>
                </div>

                {/* Year quick jump */}
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  {[-10, -1, 1, 10].map((offset) => (
                    <button key={offset} type="button"
                      onClick={() => setDpViewYear(y => y + offset)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono text-[#64748B] hover:text-[#D4956B] transition-all"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      {offset > 0 ? `+${offset}` : offset}
                    </button>
                  ))}
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_NAMES.map((d) => (
                    <div key={d} className="text-center text-[10px] font-mono text-[#4A5568] py-1">{d}</div>
                  ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: new Date(dpViewYear, dpViewMonth, 1).getDay() }, (_, i) => <div key={`pad-${i}`} />)}
                  {Array.from({ length: new Date(dpViewYear, dpViewMonth + 1, 0).getDate() }, (_, i) => {
                    const day = i + 1;
                    const iso = `${dpViewYear}-${String(dpViewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                    const isSelected = iso === dpPendingDate;
                    const isToday = iso === todayISO();
                    return (
                      <motion.button key={day} type="button"
                        whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setDpPendingDate(iso)}
                        className="w-full aspect-square rounded-lg flex items-center justify-center text-xs font-body transition-all duration-200"
                        style={{
                          background: isSelected ? `linear-gradient(135deg, ${COPPER}, #D4956B)` : isToday ? "rgba(184,115,51,0.08)" : "transparent",
                          color: isSelected ? "#fff" : isToday ? "#D4956B" : "#94A3B8",
                          border: isToday && !isSelected ? `1px solid ${COPPER}30` : "1px solid transparent",
                          fontWeight: isSelected || isToday ? 600 : 400,
                          boxShadow: isSelected ? `0 4px 16px ${COPPER}40` : "none",
                        }}
                      >
                        {day}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "1px solid rgba(184,115,51,0.1)" }}>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { const t=todayISO(); setDpPendingDate(t); setDpViewYear(new Date().getFullYear()); setDpViewMonth(new Date().getMonth()); }}
                      className="text-[10px] text-[#D4956B] px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: "rgba(184,115,51,0.06)", border: `1px solid ${COPPER}20` }}>
                      Today
                    </button>
                    <button type="button" onClick={() => setDpPendingDate("")}
                      className="text-[10px] text-[#64748B] px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      Clear
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowDatePicker(false)}
                      className="px-4 py-1.5 rounded-lg text-xs text-[#94A3B8] transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      Cancel
                    </button>
                    <button type="button"
                      onClick={() => { update("dateOfBirth", dpPendingDate); setShowDatePicker(false); }}
                      className="px-5 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
                      style={{ background: `linear-gradient(135deg, ${COPPER}, #D4956B)` }}>
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ CREATE MEMBERSHIP CARD POPUP ═══════ */}
      <AnimatePresence>
        {showCreateCard && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
              onClick={() => { setShowCreateCard(false); setNewCardNumber(null); }} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{
                position: "relative", zIndex: 1, width: 420, padding: 32, borderRadius: 20,
                background: "rgba(12,8,18,0.95)", border: `1px solid ${COPPER}25`,
                boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 60px ${COPPER}08`,
                backdropFilter: "blur(16px)",
              }}
            >
              {newCardNumber ? (
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 12, color: "#22C55E", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Card Created</p>
                  <p style={{ fontSize: 36, fontFamily: fontFamily.mono, fontWeight: 800, color: theme.copperText, letterSpacing: "0.08em" }}>{newCardNumber}</p>
                  <p style={{ fontSize: 11, color: theme.textSecondary, marginTop: 8 }}>Write This Number On The Patient Card</p>
                  <button type="button" onClick={() => { setShowCreateCard(false); setNewCardNumber(null); }}
                    style={{ marginTop: 20, padding: "8px 24px", borderRadius: 10, background: `${COPPER}15`, border: `1px solid ${COPPER}30`, color: theme.copperText, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Done
                  </button>
                </div>
              ) : (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: theme.copperText, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Create Membership Card</h3>
                  <p style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 20 }}>Generate A Unique Card Number For This Patient</p>
                  <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", marginBottom: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>{form.fullName || "—"}</p>
                    <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{form.phone || "No Phone"} &middot; {form.gender || "—"} &middot; {form.insuranceProvider || "No Insurance"}</p>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="button" onClick={() => { setShowCreateCard(false); setNewCardNumber(null); }}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: theme.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Skip
                    </button>
                    <button type="button" onClick={handleCreateCard} disabled={creatingCard}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: `${COPPER}20`, border: `1px solid ${COPPER}40`, color: theme.copperText, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: creatingCard ? 0.5 : 1 }}>
                      {creatingCard ? "Creating..." : "Create Card"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ CUSTOM INSURANCE POPUP ═══════ */}
      <AnimatePresence>
        {showCustomInsurance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
            onClick={() => setShowCustomInsurance(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-md rounded-2xl p-6"
              style={{
                background: "rgba(12,8,18,0.95)",
                border: `1px solid ${COPPER}30`,
                boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 60px ${COPPER}08`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-5">
                <span className="text-lg">🛡️</span>
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#D4956B]">Custom Insurance Provider</h3>
              </div>
              <p className="text-xs text-[#94A3B8] mb-4">Enter The Name Of The Insurance Provider Not Listed In The Dropdown.</p>
              <DInput label="Insurance Provider Name" placeholder="e.g. Star Health, AMS Insurance..."
                value={customInsuranceName}
                onChange={(e) => setCustomInsuranceName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customInsuranceName.trim()) {
                    update("insuranceProvider", customInsuranceName.trim());
                    setShowCustomInsurance(false);
                  }
                }}
              />
              <div className="flex justify-end gap-3 mt-5">
                <button type="button" onClick={() => setShowCustomInsurance(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#94A3B8] transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Cancel
                </button>
                <button type="button"
                  disabled={!customInsuranceName.trim()}
                  onClick={() => {
                    update("insuranceProvider", customInsuranceName.trim());
                    setShowCustomInsurance(false);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-medium text-white disabled:opacity-40 transition-all"
                  style={{ background: `linear-gradient(135deg, ${COPPER}, #D4956B)` }}>
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ CUSTOM RELATIONSHIP POPUP ═══════ */}
      <AnimatePresence>
        {showCustomRelation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
            onClick={() => setShowCustomRelation(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-sm rounded-2xl p-6"
              style={{
                background: "rgba(12,8,18,0.95)",
                border: `1px solid ${COPPER}30`,
                boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 60px ${COPPER}08`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-5">
                <span className="text-lg">👥</span>
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#D4956B]">Custom Relationship</h3>
              </div>
              <p className="text-xs text-[#94A3B8] mb-4">Enter The Relationship Not Listed In The Dropdown.</p>
              <DInput label="Relationship" placeholder="e.g. Guardian, Neighbour, Colleague..."
                value={customRelationName}
                onChange={(e) => setCustomRelationName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customRelationName.trim()) {
                    update("emergencyContactRelation", customRelationName.trim());
                    setShowCustomRelation(false);
                  }
                }}
              />
              <div className="flex justify-end gap-3 mt-5">
                <button type="button" onClick={() => setShowCustomRelation(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#94A3B8] transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Cancel
                </button>
                <button type="button"
                  disabled={!customRelationName.trim()}
                  onClick={() => {
                    update("emergencyContactRelation", customRelationName.trim());
                    setShowCustomRelation(false);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-medium text-white disabled:opacity-40 transition-all"
                  style={{ background: `linear-gradient(135deg, ${COPPER}, #D4956B)` }}>
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </StationThemeProvider>
  );
}
