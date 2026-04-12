"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StationGate, OperatorBadge } from "@/components/station-gate";
import { useStationTheme, ThemeToggle, StationThemeProvider, useThemeContext, COPPER, fontFamily } from "@/hooks/use-station-theme";
import { getPusherClient } from "@/lib/pusher-client";
import type { OperatorSession } from "@/types";

const HOSPITAL_CODE = "KBH";
const HOSPITAL_NAME = "Korle Bu Teaching Hospital";
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
      fontFamily: fontFamily.mono,
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

/* ─── SOAP Templates & Diagnosis-Driven Order Sets ─── */
interface SOAPTemplate {
  key: string;
  label: string;
  icon: string;
  diagnosis: string;
  notes: string;
  suggestedTests: string[];
  prescriptions: { medication: string; dosage: string; frequency: string; duration: string }[];
}

const SOAP_TEMPLATES: SOAPTemplate[] = [
  {
    key: "malaria", label: "Malaria (Suspected)", icon: "🦟",
    diagnosis: "Plasmodium Falciparum Malaria (Suspected)",
    notes: "S: Fever, chills, headache, body aches. O: Temperature elevated, mild pallor. A: Suspected malaria — confirm with RDT/smear. P: Antimalarial pending confirmation.",
    suggestedTests: ["mp", "fbc"],
    prescriptions: [
      { medication: "Artemether-Lumefantrine (AL)", dosage: "80/480mg", frequency: "BD (Twice Daily)", duration: "3 Days" },
      { medication: "Paracetamol", dosage: "1000mg", frequency: "TDS (3x Daily)", duration: "3 Days" },
    ],
  },
  {
    key: "hypertension", label: "Hypertension", icon: "❤️",
    diagnosis: "Essential Hypertension",
    notes: "S: Headache, dizziness, or asymptomatic. O: BP elevated (≥140/90 mmHg on repeated measurement). A: Essential hypertension — assess end-organ damage. P: Lifestyle modification + antihypertensive.",
    suggestedTests: ["rfts", "fbc", "rbs", "urinalysis"],
    prescriptions: [
      { medication: "Amlodipine", dosage: "5mg", frequency: "OD (Once Daily)", duration: "30 Days" },
    ],
  },
  {
    key: "diabetes_t2", label: "Diabetes (Type 2)", icon: "🍬",
    diagnosis: "Type 2 Diabetes Mellitus",
    notes: "S: Polyuria, polydipsia, weight loss, fatigue. O: Elevated random/fasting blood glucose. A: Type 2 DM — assess glycaemic control and complications. P: Oral hypoglycaemic + dietary counselling.",
    suggestedTests: ["rbs", "rfts", "lfts", "urinalysis", "fbc"],
    prescriptions: [
      { medication: "Metformin", dosage: "500mg", frequency: "BD (Twice Daily)", duration: "30 Days" },
    ],
  },
  {
    key: "uti", label: "UTI", icon: "🚽",
    diagnosis: "Urinary Tract Infection",
    notes: "S: Dysuria, frequency, urgency, suprapubic discomfort. O: Tender suprapubic region, urine may appear cloudy. A: Uncomplicated UTI. P: Antibiotics + hydration advice.",
    suggestedTests: ["urinalysis", "fbc"],
    prescriptions: [
      { medication: "Ciprofloxacin", dosage: "500mg", frequency: "BD (Twice Daily)", duration: "5 Days" },
      { medication: "Paracetamol", dosage: "1000mg", frequency: "TDS (3x Daily)", duration: "3 Days" },
    ],
  },
  {
    key: "pneumonia", label: "Pneumonia", icon: "🫁",
    diagnosis: "Community-Acquired Pneumonia",
    notes: "S: Cough (productive), fever, chest pain, dyspnoea. O: Reduced breath sounds, crackles/crepitations, tachypnoea. A: Community-acquired pneumonia. P: Antibiotics, chest X-ray if available.",
    suggestedTests: ["fbc"],
    prescriptions: [
      { medication: "Amoxicillin", dosage: "500mg", frequency: "TDS (3x Daily)", duration: "7 Days" },
      { medication: "Azithromycin", dosage: "500mg", frequency: "OD (Once Daily)", duration: "3 Days" },
      { medication: "Paracetamol", dosage: "1000mg", frequency: "TDS (3x Daily)", duration: "3 Days" },
    ],
  },
  {
    key: "gastroenteritis", label: "Gastroenteritis", icon: "🤢",
    diagnosis: "Acute Gastroenteritis",
    notes: "S: Diarrhoea, vomiting, abdominal cramps, nausea. O: Mild dehydration, diffuse abdominal tenderness. A: Acute gastroenteritis — likely viral/bacterial. P: ORS, antiemetic, monitor hydration.",
    suggestedTests: ["fbc"],
    prescriptions: [
      { medication: "ORS (Oral Rehydration Salts)", dosage: "1 Sachet", frequency: "After Each Stool", duration: "3 Days" },
      { medication: "Metoclopramide", dosage: "10mg", frequency: "TDS (3x Daily)", duration: "3 Days" },
    ],
  },
  {
    key: "anc_routine", label: "ANC Visit (Routine)", icon: "🤰",
    diagnosis: "Routine Antenatal Visit",
    notes: "S: Routine ANC visit. O: Fundal height measured, fetal heart rate auscultated, BP checked, urine dipstick. A: Normal pregnancy progression. P: Continue iron/folate, schedule next visit.",
    suggestedTests: ["fbc", "urinalysis", "rbs", "hiv"],
    prescriptions: [
      { medication: "Ferrous Sulphate + Folic Acid", dosage: "200mg/0.4mg", frequency: "OD (Once Daily)", duration: "30 Days" },
    ],
  },
  {
    key: "asthma", label: "Asthma (Acute)", icon: "💨",
    diagnosis: "Acute Asthma Exacerbation",
    notes: "S: Wheeze, shortness of breath, chest tightness, cough (especially nocturnal). O: Bilateral wheeze on auscultation, prolonged expiratory phase, tachypnoea. A: Acute asthma exacerbation — mild/moderate. P: Bronchodilator, oral steroids if moderate-severe.",
    suggestedTests: ["fbc"],
    prescriptions: [
      { medication: "Salbutamol Inhaler", dosage: "2 Puffs", frequency: "QID (4x Daily)", duration: "5 Days" },
      { medication: "Prednisolone", dosage: "40mg", frequency: "OD (Once Daily)", duration: "5 Days" },
    ],
  },
  {
    key: "typhoid", label: "Typhoid Fever", icon: "🤒",
    diagnosis: "Typhoid Fever (Suspected)",
    notes: "S: Persistent fever (>5 days), headache, abdominal pain, constipation or diarrhoea. O: Coated tongue, hepatosplenomegaly, relative bradycardia. A: Suspected typhoid — confirm with Widal/culture. P: Antibiotics pending confirmation.",
    suggestedTests: ["widal", "fbc", "lfts"],
    prescriptions: [
      { medication: "Ciprofloxacin", dosage: "500mg", frequency: "BD (Twice Daily)", duration: "7 Days" },
      { medication: "Paracetamol", dosage: "1000mg", frequency: "TDS (3x Daily)", duration: "5 Days" },
    ],
  },
];

/* ─── Custom Template Storage ─── */
function getCustomTemplates(operatorId: string): SOAPTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`soap_templates_${operatorId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveCustomTemplates(operatorId: string, templates: SOAPTemplate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`soap_templates_${operatorId}`, JSON.stringify(templates));
}

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
  const [customTest, setCustomTest] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [ending, setEnding] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [doctorStatus, setDoctorStatus] = useState<string>("AVAILABLE");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorSpecialty, setDoctorSpecialty] = useState<string>("general");
  const [coveredSpecialties, setCoveredSpecialties] = useState<string[]>([]);
  const [showDeptSwitcher, setShowDeptSwitcher] = useState(false);
  const isAdmin = operator.operatorRole === "admin" || operator.operatorRole === "super_admin";
  const ALL_DEPARTMENTS = [
    { value: "all", label: "All Departments" },
    { value: "general", label: "General Medicine" },
    { value: "cardiology", label: "Cardiology" },
    { value: "neurology", label: "Neurology" },
    { value: "oncology", label: "Oncology" },
    { value: "gastroenterology", label: "Gastroenterology" },
    { value: "endocrinology", label: "Endocrinology" },
    { value: "nephrology", label: "Nephrology" },
    { value: "pulmonology", label: "Pulmonology" },
    { value: "hematology", label: "Hematology" },
    { value: "rheumatology", label: "Rheumatology" },
    { value: "geriatrics", label: "Geriatrics" },
    { value: "dermatology", label: "Dermatology" },
    { value: "emergency", label: "Emergency" },
    { value: "pediatrics", label: "Pediatrics" },
    { value: "obstetrics", label: "OB/GYN" },
    { value: "surgery", label: "General Surgery" },
    { value: "orthopedics", label: "Orthopedics" },
    { value: "neurosurgery", label: "Neurosurgery" },
    { value: "cardiothoracic", label: "Cardiothoracic" },
    { value: "plastic_surgery", label: "Plastic Surgery" },
    { value: "urology", label: "Urology" },
    { value: "dental", label: "Dental" },
    { value: "eye", label: "Ophthalmology" },
    { value: "ent", label: "ENT" },
    { value: "psychiatry", label: "Psychiatry" },
    { value: "radiology", label: "Radiology" },
    { value: "anesthesiology", label: "Anesthesiology" },
    { value: "pathology", label: "Pathology" },
  ];
  // Referral state
  const [showReferralPanel, setShowReferralPanel] = useState(false);
  const [referralSpecialty, setReferralSpecialty] = useState("");
  const [referralReason, setReferralReason] = useState("");
  const [referralUrgency, setReferralUrgency] = useState("routine");
  const [referralNotes, setReferralNotes] = useState("");
  const [referralSending, setReferralSending] = useState(false);
  const [incomingReferrals, setIncomingReferrals] = useState<{ id: string; recordId: string; patientName: string; queueToken: string; specialty?: string; reason: string; urgency: string; referredBy: string; referredAt: string; status: string; chiefComplaint: string; currentDiagnosis: string | null }[]>([]);
  const [referralCount, setReferralCount] = useState(0);

  // Sub-menu navigation
  const [consultTab, setConsultTab] = useState<"consultation" | "lab" | "actions">("consultation");

  // Vitals state
  const [vitals, setVitals] = useState({ bp: "", heartRate: "", rr: "", temperature: "", spo2: "", weight: "", height: "" });
  const calcBmi = vitals.weight && vitals.height ? (Number(vitals.weight) / ((Number(vitals.height) / 100) ** 2)).toFixed(1) : "";
  const bmiClass = calcBmi ? (Number(calcBmi) < 18.5 ? "Underweight" : Number(calcBmi) < 25 ? "Normal" : Number(calcBmi) < 30 ? "Overweight" : "Obese") : "";
  const bmiColor = bmiClass === "Normal" ? "#22C55E" : bmiClass === "Underweight" ? "#38BDF8" : bmiClass === "Overweight" ? "#F59E0B" : bmiClass === "Obese" ? "#EF4444" : "#64748B";

  // Custom SOAP templates
  const [customTemplates, setCustomTemplates] = useState<SOAPTemplate[]>(() => getCustomTemplates(operator.operatorId));
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ label: "", icon: "📋", diagnosis: "", notes: "", prescriptions: [{ medication: "", dosage: "", frequency: "", duration: "" }], suggestedTests: [] as string[] });
  const allTemplates = [...SOAP_TEMPLATES, ...customTemplates];

  // Admission order state (doctor orders, ward nurse executes)
  const [orderingAdmission, setOrderingAdmission] = useState(false);

  // Inter-branch referral state
  const [hospitalGroup, setHospitalGroup] = useState<{ groupCode: string; name: string } | null>(null);
  const [groupBranches, setGroupBranches] = useState<{ code: string; name: string; tier: string; activeModules: string[] }[]>([]);
  const [showInterBranchPanel, setShowInterBranchPanel] = useState(false);
  const [ibDest, setIbDest] = useState("");
  const [ibDept, setIbDept] = useState("");
  const [ibType, setIbType] = useState("OUTPATIENT");
  const [ibPriority, setIbPriority] = useState("ROUTINE");
  const [ibReason, setIbReason] = useState("");
  const [ibNotes, setIbNotes] = useState("");
  const [ibSending, setIbSending] = useState(false);
  const [ibIncoming, setIbIncoming] = useState<{ id: string; fromHospitalCode: string; fromHospitalName: string; toHospitalCode: string; department: string; priority: string; status: string; clinicalReason: string; referringDoctorName: string; patientName: string; patientRecordId: string; createdAt: string }[]>([]);

  // Shift handover state
  const [showHandover, setShowHandover] = useState(false);
  const [handoverDoctors, setHandoverDoctors] = useState<{ id: string; name: string; specialty: string; status: string }[]>([]);
  const [handoverTarget, setHandoverTarget] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");
  const [handoverSending, setHandoverSending] = useState(false);

  // WhatsApp & PDF state
  const [waPhone, setWaPhone] = useState("");
  const [waSending, setWaSending] = useState(false);
  const [waResult, setWaResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Load doctor profile by operator name → get specialty + doctorId
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/doctors?hospitalCode=${HOSPITAL_CODE}`);
        if (res.ok) {
          const doctors = await res.json();
          // Normalize label variants to consistent value keys (1:1 — each specialty is its own department)
          const LABEL_TO_KEY: Record<string, string> = {
            "general medicine": "general", "emergency medicine": "emergency",
            "ob/gyn": "obstetrics", "general surgery": "surgery",
            "eye clinic": "eye", "ophthalmology": "eye",
          };
          const normalize = (s: string) => {
            const r = (s || "general").toLowerCase();
            return LABEL_TO_KEY[r] || r;
          };
          // Specialties covered by registered specialists (excluding GM — GM is the catch-all)
          const covered = doctors
            .map((d: { specialty?: string }) => normalize(d.specialty || "general"))
            .filter((s: string) => s !== "general");
          setCoveredSpecialties(Array.from(new Set(covered)));

          const match = doctors.find((d: { name: string }) => d.name === operator.operatorName);
          if (match) {
            setDoctorId(match.id);
            const mySpecialty = normalize(match.specialty);
            // Solo doctor sees ALL departments
            if (doctors.length <= 1) {
              setDoctorSpecialty("all");
            } else {
              setDoctorSpecialty(mySpecialty);
            }
          }
        }
      } catch { /* fallback to general */ }
    })();
  }, [operator.operatorName]);

  // Check group membership + load branches
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/hospitals?code=${HOSPITAL_CODE}`);
        if (res.ok) {
          const data = await res.json();
          if (data.group?.groupCode) {
            setHospitalGroup({ groupCode: data.group.groupCode, name: data.group.name });
            // Load group detail for branches
            const gRes = await fetch(`/api/groups?groupCode=${data.group.groupCode}`);
            if (gRes.ok) {
              const gData = await gRes.json();
              setGroupBranches((gData.hospitals || []).filter((h: { code: string }) => h.code !== HOSPITAL_CODE));
            }
          }
        }
      } catch { /* */ }
    })();
  }, []);

  // Poll inter-branch referrals
  useEffect(() => {
    if (!hospitalGroup) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/groups/referrals?groupCode=${hospitalGroup.groupCode}&hospitalCode=${HOSPITAL_CODE}&status=all`);
        if (res.ok) {
          const data = await res.json();
          const incoming = (data.referrals || []).filter((r: { toHospitalCode: string; status: string }) => r.toHospitalCode === HOSPITAL_CODE && (r.status === "PENDING" || r.status === "ACCEPTED"));
          setIbIncoming(incoming);
          // ibIncoming count is derived from ibIncoming.length in the UI
        }
      } catch { /* */ }
    };
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [hospitalGroup]);

  const sendInterBranchReferral = async () => {
    if (!activeSession || !hospitalGroup || !ibDest || !ibDept || !ibReason.trim()) return;
    setIbSending(true);
    try {
      await fetch("/api/groups/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          groupCode: hospitalGroup.groupCode,
          hospitalCode: HOSPITAL_CODE,
          recordId: activeSession.recordId,
          toHospitalCode: ibDest,
          department: ibDept,
          referralType: ibType,
          priority: ibPriority,
          clinicalReason: ibReason,
          referringDoctorName: operator.operatorName,
          notes: ibNotes || undefined,
        }),
      });
      setIbDest(""); setIbDept(""); setIbType("OUTPATIENT"); setIbPriority("ROUTINE"); setIbReason(""); setIbNotes("");
      setShowInterBranchPanel(false);
    } catch { /* */ }
    finally { setIbSending(false); }
  };

  const handleIbAccept = async (referral: typeof ibIncoming[0]) => {
    if (!hospitalGroup) return;
    await fetch("/api/groups/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept", groupCode: hospitalGroup.groupCode, hospitalCode: HOSPITAL_CODE, recordId: referral.patientRecordId, referralId: referral.id, operatorName: operator.operatorName }),
    });
  };

  // Load available doctors for handover
  const loadHandoverDoctors = async () => {
    try {
      const res = await fetch(`/api/doctors?hospitalCode=${HOSPITAL_CODE}&available=true`);
      if (res.ok) {
        const data = await res.json();
        setHandoverDoctors((data || []).filter((d: { id: string }) => d.id !== doctorId));
      }
    } catch { /* */ }
  };

  const handleShiftHandover = async () => {
    if (!handoverTarget || !doctorId) return;
    setHandoverSending(true);
    try {
      const res = await fetch("/api/doctors/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, outgoingDoctorId: doctorId, incomingDoctorId: handoverTarget, notes: handoverNotes || undefined }),
      });
      if (res.ok) {
        setShowHandover(false);
        setHandoverTarget("");
        setHandoverNotes("");
        setDoctorStatus("OFF_DUTY");
      }
    } catch { /* */ }
    setHandoverSending(false);
  };

  // WhatsApp send
  const handleWhatsAppSend = async () => {
    if (!activeSession?.recordId || !waPhone.trim()) return;
    setWaSending(true);
    setWaResult(null);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: activeSession.recordId, phoneNumber: waPhone }),
      });
      if (res.ok) {
        setWaResult({ ok: true, msg: "Report sent via WhatsApp" });
        setWaPhone("");
      } else {
        const err = await res.json();
        setWaResult({ ok: false, msg: err.error || "Send failed" });
      }
    } catch {
      setWaResult({ ok: false, msg: "Network error" });
    }
    setWaSending(false);
  };

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue?hospitalCode=${HOSPITAL_CODE}`);
      if (res.ok) {
        const data = await res.json();
        const deptMatch = (d: { department?: string }) => {
          if (doctorSpecialty === "all") return true;
          const dept = (d.department || "general").toLowerCase();
          if (doctorSpecialty === "general") {
            // GM catch-all: show general + any department NOT covered by an active specialist
            if (dept === "general" || dept === "general medicine") return true;
            return !coveredSpecialties.includes(dept);
          }
          // Specialist: only their department
          return dept === doctorSpecialty;
        };
        // Filter: show active, lab_results_ready patients (not closed/paused_for_lab/etc)
        const visible = data.filter((d: { visitStatus?: string; department?: string }) => {
          const vs = d.visitStatus ?? "active";
          if (vs !== "active" && vs !== "lab_results_ready") return false;
          return deptMatch(d);
        });
        setQueue(sortQueue(visible.map((d: { id: string; token: string; patientName: string; chiefComplaint: string; department: string; symptomSeverity: number | null; emergencyFlag: boolean; emergencyReason: string | null; visitStatus?: string; priorityReturn?: boolean; createdAt: string }) => ({
          ...d,
          visitStatus: d.visitStatus ?? "active",
          priorityReturn: d.priorityReturn ?? false,
        }))));
        // Admin switching departments: auto-resume active consultation in this department
        const inConsult = data.filter((d: { visitStatus?: string; department?: string }) => {
          const vs = d.visitStatus ?? "active";
          return vs === "in_consultation" && deptMatch(d);
        });
        if (inConsult.length > 0) {
          setActiveSession((prev) => {
            // Don't override if doctor already has a session loaded
            if (prev) return prev;
            const p = inConsult[0];
            setDoctorStatus("IN_CONSULTATION");
            return {
              recordId: p.id,
              patient: { fullName: p.patientName },
              visit: { queueToken: p.token, chiefComplaint: p.chiefComplaint, department: p.department, date: p.createdAt, symptomSeverity: p.symptomSeverity ?? undefined, emergencyFlag: p.emergencyFlag },
            };
          });
        }
      }
    } catch { /* retry */ }
  }, [doctorSpecialty, coveredSpecialties]);

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

  useEffect(() => {
    loadQueue(); loadReferrals();
    const i = setInterval(() => { loadQueue(); loadReferrals(); }, 5000);
    // Pusher: instant refresh on queue, referral, and lab-results events
    const pusher = getPusherClient();
    const qCh = pusher?.subscribe(`hospital-${HOSPITAL_CODE}-queue`);
    const rCh = pusher?.subscribe(`hospital-${HOSPITAL_CODE}-referrals`);
    const lCh = pusher?.subscribe(`hospital-${HOSPITAL_CODE}-lab-results`);
    qCh?.bind("patient-added", () => loadQueue());
    qCh?.bind("patient-requeued", () => loadQueue());
    rCh?.bind("new-referral", () => loadReferrals());
    lCh?.bind("results-ready", () => loadQueue());
    return () => {
      clearInterval(i);
      qCh?.unbind_all(); pusher?.unsubscribe(`hospital-${HOSPITAL_CODE}-queue`);
      rCh?.unbind_all(); pusher?.unsubscribe(`hospital-${HOSPITAL_CODE}-referrals`);
      lCh?.unbind_all(); pusher?.unsubscribe(`hospital-${HOSPITAL_CODE}-lab-results`);
    };
  }, [loadQueue, loadReferrals]);
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

    // Update patient visit status to in_consultation
    try {
      await fetch("/api/records", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordId: next.id, hospitalCode: HOSPITAL_CODE, visitStatus: "in_consultation" }) });
    } catch { /* silent */ }
    // Trigger Pusher broadcast → waiting room announces the callout
    try {
      await fetch("/api/callout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, token: next.token, patientName: next.patientName, department: next.department, calledBy: "Doctor" }) });
    } catch { /* silent */ }
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

  // SOAP Template Application
  const applyTemplate = (template: SOAPTemplate) => {
    setDiagnosis({ primary: template.diagnosis, notes: template.notes });
    if (template.prescriptions.length > 0) setPrescriptions(template.prescriptions.map(rx => ({ ...rx })));
    if (template.suggestedTests.length > 0) {
      setLabReferral(true);
      setSelectedTests(template.suggestedTests);
    }
  };

  const saveAsTemplate = () => {
    if (!newTemplate.label.trim() || !newTemplate.diagnosis.trim()) return;
    const key = `custom_${Date.now()}`;
    const tmpl: SOAPTemplate = {
      key,
      label: newTemplate.label,
      icon: newTemplate.icon || "📋",
      diagnosis: newTemplate.diagnosis,
      notes: newTemplate.notes,
      suggestedTests: newTemplate.suggestedTests,
      prescriptions: newTemplate.prescriptions.filter(rx => rx.medication.trim()),
    };
    const updated = [...customTemplates, tmpl];
    setCustomTemplates(updated);
    saveCustomTemplates(operator.operatorId, updated);
    setShowCreateTemplate(false);
    setNewTemplate({ label: "", icon: "📋", diagnosis: "", notes: "", prescriptions: [{ medication: "", dosage: "", frequency: "", duration: "" }], suggestedTests: [] });
  };

  const saveCurrentAsTemplate = () => {
    setNewTemplate({
      label: "",
      icon: "📋",
      diagnosis: diagnosis.primary,
      notes: diagnosis.notes,
      prescriptions: prescriptions.filter(rx => rx.medication.trim()),
      suggestedTests: selectedTests,
    });
    setShowCreateTemplate(true);
  };

  const deleteCustomTemplate = (key: string) => {
    const updated = customTemplates.filter(t => t.key !== key);
    setCustomTemplates(updated);
    saveCustomTemplates(operator.operatorId, updated);
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
      const vitalsData = { bp: vitals.bp, heartRate: vitals.heartRate, rr: vitals.rr, temperature: vitals.temperature, spo2: vitals.spo2, weight: vitals.weight, height: vitals.height, bmi: calcBmi };
      // Save diagnosis + treatment + vitals
      await fetch("/api/records", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordId: activeSession.recordId, hospitalCode: HOSPITAL_CODE, diagnosis: { primary: diagnosis.primary, secondary: [], icdCodes: [], notes: diagnosis.notes }, treatment: { prescriptions: validRx, procedures: [], followUp: null, nextAppointment: null }, vitals: vitalsData }) });
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

  // Order admission — doctor flags patient for ward nurse to admit
  const orderAdmission = async () => {
    if (!activeSession) return;
    setOrderingAdmission(true);
    try {
      const reason = diagnosis.primary || activeSession.visit.chiefComplaint || "Admission required";
      await fetch("/api/records", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: activeSession.recordId,
          hospitalCode: HOSPITAL_CODE,
          admissionOrder: { reason, orderedBy: doctorId || operator.operatorId, orderedByName: operator.operatorName || "Doctor" },
        }),
      });
      // Save diagnosis + treatment + vitals
      const validRx = prescriptions.filter((p) => p.medication);
      const vitalsData = { bp: vitals.bp, heartRate: vitals.heartRate, rr: vitals.rr, temperature: vitals.temperature, spo2: vitals.spo2, weight: vitals.weight, height: vitals.height, bmi: calcBmi };
      await fetch("/api/records", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordId: activeSession.recordId, hospitalCode: HOSPITAL_CODE, diagnosis: { primary: diagnosis.primary, secondary: [], icdCodes: [], notes: diagnosis.notes }, treatment: { prescriptions: validRx, procedures: [], followUp: null, nextAppointment: null }, vitals: vitalsData }) });
      // Advance visit status
      await fetch("/api/visit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "complete_consultation", recordId: activeSession.recordId, doctorId: doctorId || "doctor", hasPrescriptions: validRx.length > 0 }) });
      // Emit billable
      try { await fetch("/api/billing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "emit_billable", recordId: activeSession.recordId, serviceType: "CONSULTATION", description: `Consultation + Admission Order: ${diagnosis.primary || "General"}`, renderedBy: doctorId || "doctor" }) }); } catch { /* */ }
      resetSession();
    } catch { /* */ }
    setOrderingAdmission(false);
  };

  const resetSession = () => {
    setActiveSession(null); setDiagnosis({ primary: "", notes: "" }); setPrescriptions([{ medication: "", dosage: "", frequency: "", duration: "" }]); setLabReferral(false); setSelectedTests([]); setClinicalNotes(""); setShowReferralPanel(false); setReferralSpecialty(""); setReferralReason(""); setReferralNotes("");
    setVitals({ bp: "", heartRate: "", rr: "", temperature: "", spo2: "", weight: "", height: "" }); setConsultTab("consultation");
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
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", margin: "4px 0" }} />
                <button type="button" onClick={() => { setShowHandover(true); setShowStatusMenu(false); loadHandoverDoctors(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", borderRadius: 6,
                    background: "transparent", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 500, color: "#F59E0B",
                    textAlign: "left",
                  }}>
                  🔄 Shift Handover
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
          <div style={{ position: "relative" }}>
            <span
              onClick={isAdmin ? () => setShowDeptSwitcher(!showDeptSwitcher) : undefined}
              style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: `${COPPER}10`, border: `1px solid ${COPPER}20`, color: COPPER, textTransform: "uppercase", letterSpacing: "0.06em", cursor: isAdmin ? "pointer" : "default", userSelect: "none" }}
            >
              {ALL_DEPARTMENTS.find(d => d.value === doctorSpecialty)?.label || "General Medicine"}
              {isAdmin && <span style={{ marginLeft: 4, fontSize: 7 }}>▼</span>}
            </span>
            {showDeptSwitcher && isAdmin && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "rgba(20,20,20,0.95)", border: `1px solid ${COPPER}30`, borderRadius: 8, padding: 4, zIndex: 999, minWidth: 160, backdropFilter: "blur(12px)" }}>
                {ALL_DEPARTMENTS.map(d => (
                  <div
                    key={d.value}
                    onClick={() => { setDoctorSpecialty(d.value); setShowDeptSwitcher(false); setActiveSession(null); setDoctorStatus("AVAILABLE"); }}
                    style={{ padding: "6px 12px", fontSize: 11, fontWeight: doctorSpecialty === d.value ? 700 : 500, color: doctorSpecialty === d.value ? COPPER : "#94A3B8", cursor: "pointer", borderRadius: 4, background: doctorSpecialty === d.value ? `${COPPER}10` : "transparent" }}
                    onMouseEnter={e => { (e.target as HTMLDivElement).style.background = `${COPPER}10`; }}
                    onMouseLeave={e => { (e.target as HTMLDivElement).style.background = doctorSpecialty === d.value ? `${COPPER}10` : "transparent"; }}
                  >
                    {d.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ width: 1, height: 12, background: "rgba(184,115,51,0.12)" }} />
          <span style={{ fontSize: 11, color: "#64748B" }}>{HOSPITAL_NAME}</span>
          <div style={{ width: 1, height: 12, background: "rgba(184,115,51,0.12)" }} />
          <time suppressHydrationWarning style={{ fontFamily: fontFamily.mono, fontSize: 11, color: COPPER }}>
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
                fontSize: 16, fontWeight: 800, fontFamily: fontFamily.mono,
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
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#D4956B", fontFamily: fontFamily.mono }}>Queue</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(184,115,51,0.08)", color: "#D4956B", fontFamily: fontFamily.mono }}>{queue.length}</span>
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
                  <span style={{ fontFamily: fontFamily.mono, fontSize: 11, fontWeight: 700, color: item.emergencyFlag ? "#F87171" : item.visitStatus === "lab_results_ready" ? "#38BDF8" : COPPER }}>{item.token}</span>
                  <span style={{ fontSize: 9, fontFamily: fontFamily.mono, color: "#3D4D78" }}>
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
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#38BDF8", fontFamily: fontFamily.mono }}>Referrals</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(14,165,233,0.08)", color: "#38BDF8", fontFamily: fontFamily.mono }}>{incomingReferrals.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {incomingReferrals.map((ref, i) => (
                  <motion.div key={ref.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    style={{ padding: "10px 10px", borderRadius: 10, background: "rgba(14,165,233,0.03)", border: "1px solid rgba(14,165,233,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontFamily: fontFamily.mono, fontSize: 11, fontWeight: 700, color: "#38BDF8" }}>{ref.queueToken}</span>
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

          {/* Incoming Inter-Branch Referrals */}
          {hospitalGroup && ibIncoming.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: COPPER, fontFamily: fontFamily.mono }}>Branch Transfers</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: `${COPPER}10`, color: COPPER, fontFamily: fontFamily.mono }}>{ibIncoming.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ibIncoming.map((ref, i) => {
                  const pColor = ref.priority === "CRITICAL" ? "#EF4444" : ref.priority === "URGENT" ? "#F59E0B" : "#22C55E";
                  return (
                    <motion.div key={ref.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      style={{ padding: "10px 10px", borderRadius: 10, background: `${pColor}04`, border: `1px solid ${pColor}15` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontFamily: fontFamily.mono, fontSize: 10, fontWeight: 700, color: pColor }}>{ref.fromHospitalCode}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", background: `${pColor}12`, color: pColor }}>{ref.priority}</span>
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ref.patientName}</p>
                      <p style={{ fontSize: 10, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{ref.clinicalReason}</p>
                      <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                        <span style={{ fontSize: 9, fontWeight: 600, color: COPPER }}>{ref.department}</span>
                        <span style={{ fontSize: 9, color: "#475569" }}>&middot; {ref.status}</span>
                      </div>
                      {ref.status === "PENDING" && (
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleIbAccept(ref)}
                          style={{ display: "block", width: "100%", marginTop: 6, padding: "5px 0", borderRadius: 6, fontSize: 10, fontWeight: 600, color: COPPER, cursor: "pointer", background: `${COPPER}06`, border: `1px solid ${COPPER}18` }}>
                          Accept Transfer
                        </motion.button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ─── CENTER: Charting Workspace ─── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px 48px" }}>
          <AnimatePresence mode="wait">
            {activeSession ? (
              <motion.div key="charting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Sub-menu pills */}
                <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
                  {([
                    { id: "consultation" as const, icon: "🩺", label: "Consultation" },
                    { id: "lab" as const, icon: "🧪", label: "Lab & Referrals", badge: selectedTests.length > 0 ? selectedTests.length : undefined },
                    { id: "actions" as const, icon: "⚡", label: "Actions" },
                  ]).map((tab) => (
                    <motion.button key={tab.id} type="button" onClick={() => { setConsultTab(tab.id); if (tab.id === "lab") setLabReferral(true); }} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer",
                        background: consultTab === tab.id ? `${COPPER}12` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${consultTab === tab.id ? COPPER + "30" : "rgba(255,255,255,0.05)"}`,
                        color: consultTab === tab.id ? "#D4956B" : "#64748B",
                        textTransform: "uppercase", letterSpacing: "0.04em", transition: "all 0.2s",
                      }}>
                      <span>{tab.icon}</span> {tab.label}
                      {tab.badge && <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 4, background: "#0EA5E9", color: "#fff", marginLeft: 2 }}>{tab.badge}</span>}
                    </motion.button>
                  ))}
                  <div style={{ flex: 1 }} />
                  <motion.button type="button" onClick={endSession} disabled={ending} whileHover={{ y: -1, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: ending ? "wait" : "pointer",
                      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444",
                      textTransform: "uppercase", letterSpacing: "0.04em", opacity: ending ? 0.5 : 1,
                    }}>
                    <span>✓</span> End Session
                  </motion.button>
                </div>

                {/* ═══════ TAB 1: CONSULTATION ═══════ */}
                {consultTab === "consultation" && (
                  <motion.div key="consult-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Vitals grid */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      style={{ padding: 16, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(14,165,233,0.1)", backdropFilter: "blur(12px)", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                        <span style={{ fontSize: 14 }}>📊</span>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#38BDF8", fontFamily: fontFamily.mono }}>Vital Signs</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                        <DInput label="BP (mmHg)" placeholder="120/80" value={vitals.bp} onChange={(e) => setVitals(v => ({ ...v, bp: e.target.value }))} />
                        <DInput label="Heart Rate (bpm)" placeholder="72" value={vitals.heartRate} onChange={(e) => setVitals(v => ({ ...v, heartRate: e.target.value }))} />
                        <DInput label="Resp. Rate (/min)" placeholder="18" value={vitals.rr} onChange={(e) => setVitals(v => ({ ...v, rr: e.target.value }))} />
                        <DInput label="Temperature (°C)" placeholder="36.8" value={vitals.temperature} onChange={(e) => setVitals(v => ({ ...v, temperature: e.target.value }))} />
                        <DInput label="SpO2 (%)" placeholder="98" value={vitals.spo2} onChange={(e) => setVitals(v => ({ ...v, spo2: e.target.value }))} />
                        <DInput label="Weight (kg)" placeholder="75" value={vitals.weight} onChange={(e) => setVitals(v => ({ ...v, weight: e.target.value }))} />
                        <DInput label="Height (cm)" placeholder="170" value={vitals.height} onChange={(e) => setVitals(v => ({ ...v, height: e.target.value }))} />
                        <div>
                          <label className="block text-xs font-medium font-body mb-1.5" style={{ color: theme.textLabel, transition: "color 0.4s ease" }}>BMI</label>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", minHeight: 40 }}>
                            <span style={{ fontSize: 16, fontWeight: 800, fontFamily: fontFamily.mono, color: calcBmi ? bmiColor : "#3D4D78" }}>{calcBmi || "—"}</span>
                            {bmiClass && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${bmiColor}12`, color: bmiColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>{bmiClass}</span>}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Diagnosis */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
                      style={{ padding: 16, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 14 }}>🩺</span>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#D4956B", fontFamily: fontFamily.mono }}>Diagnosis</span>
                      </div>
                      {/* SOAP Template Quick-Select */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <label style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "#3D4D78" }}>Quick Template</label>
                          <div style={{ display: "flex", gap: 4 }}>
                            {diagnosis.primary && (
                              <button type="button" onClick={saveCurrentAsTemplate} style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, cursor: "pointer", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E", letterSpacing: "0.04em" }}>
                                Save As Template
                              </button>
                            )}
                            <button type="button" onClick={() => setShowCreateTemplate(true)} style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, cursor: "pointer", background: `${COPPER}08`, border: `1px solid ${COPPER}20`, color: "#D4956B", letterSpacing: "0.04em" }}>
                              + New
                            </button>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {allTemplates.map(t => (
                            <div key={t.key} style={{ position: "relative", display: "inline-flex" }}>
                              <button type="button" onClick={() => applyTemplate(t)}
                                style={{
                                  fontSize: 10, fontWeight: 600, padding: "4px 8px", borderRadius: 6, cursor: "pointer",
                                  background: diagnosis.primary === t.diagnosis ? `${COPPER}18` : "rgba(255,255,255,0.03)",
                                  border: `1px solid ${diagnosis.primary === t.diagnosis ? COPPER + "30" : t.key.startsWith("custom_") ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)"}`,
                                  color: diagnosis.primary === t.diagnosis ? "#D4956B" : t.key.startsWith("custom_") ? "#94A3B8" : "#64748B",
                                  transition: "all 0.15s ease", paddingRight: t.key.startsWith("custom_") ? 20 : 8,
                                }}>
                                {t.icon} {t.label}
                              </button>
                              {t.key.startsWith("custom_") && (
                                <button type="button" onClick={(e) => { e.stopPropagation(); deleteCustomTemplate(t.key); }}
                                  style={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)", fontSize: 8, fontWeight: 800, width: 14, height: 14, borderRadius: 3, border: "none", background: "rgba(239,68,68,0.1)", color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                                  x
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <DInput label="Primary Diagnosis" placeholder="e.g. Plasmodium Falciparum Malaria" value={diagnosis.primary} onChange={(e) => setDiagnosis((d) => ({ ...d, primary: e.target.value }))} required />
                      <div style={{ marginTop: 10 }}>
                        <DTextarea label="Clinical Notes" rows={3} placeholder="S: ... O: ... A: ... P: ..."
                          value={diagnosis.notes} onChange={(e) => setDiagnosis((d) => ({ ...d, notes: e.target.value }))} />
                      </div>
                    </motion.div>

                    {/* Prescriptions */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                      style={{ padding: 16, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 14 }}>💊</span>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#D4956B", fontFamily: fontFamily.mono }}>Prescriptions</span>
                        </div>
                        <button type="button" onClick={addPrescription} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "#64748B", cursor: "pointer" }}>+ Add</button>
                      </div>
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
                  </motion.div>
                )}

                {/* ═══════ TAB 2: LAB & REFERRALS ═══════ */}
                {consultTab === "lab" && (
                  <motion.div key="lab-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Lab Orders */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      style={{ padding: 16, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(14,165,233,0.1)", backdropFilter: "blur(12px)", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 14 }}>🧪</span>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#38BDF8", fontFamily: fontFamily.mono }}>Lab Orders</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: labReferral ? 10 : 0 }}>
                        <input type="checkbox" id="labRef" checked={labReferral} onChange={(e) => setLabReferral(e.target.checked)} style={{ width: 14, height: 14, accentColor: "#0EA5E9" }} />
                        <label htmlFor="labRef" style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8", cursor: "pointer" }}>Order Lab Tests</label>
                      </div>
                      {labReferral && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <select
                            className="w-full rounded-lg border px-3 py-2 text-[13px] font-body text-white focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]/30 transition-all duration-200 appearance-none"
                            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(14,165,233,0.15)" }}
                            value="" onChange={(e) => { if (e.target.value && !selectedTests.includes(e.target.value)) setSelectedTests((p) => [...p, e.target.value]); }}>
                            <option value="" style={{ background: theme.selectOptionBg }}>Select From Common Tests...</option>
                            {LAB_TESTS.map((t) => <option key={t.value} value={t.value} style={{ background: theme.selectOptionBg }}>{t.label}</option>)}
                          </select>
                          <div style={{ display: "flex", gap: 6 }}>
                            <input
                              type="text" placeholder="Type Custom Test Name..."
                              value={customTest} onChange={(e) => setCustomTest(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter" && customTest.trim() && !selectedTests.includes(customTest.trim())) { setSelectedTests((p) => [...p, customTest.trim()]); setCustomTest(""); } }}
                              className="flex-1 rounded-lg border px-3 py-2 text-[13px] font-body text-white focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]/30 transition-all duration-200"
                              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(14,165,233,0.15)" }}
                            />
                            <button type="button" onClick={() => { if (customTest.trim() && !selectedTests.includes(customTest.trim())) { setSelectedTests((p) => [...p, customTest.trim()]); setCustomTest(""); } }}
                              disabled={!customTest.trim()}
                              style={{ padding: "0 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#38BDF8", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", cursor: customTest.trim() ? "pointer" : "not-allowed", opacity: customTest.trim() ? 1 : 0.4, textTransform: "uppercase" }}>
                              + Add
                            </button>
                          </div>
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
                          <DTextarea label="Clinical Context For Lab" rows={2} placeholder="Clinical context for lab..." value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} />
                          <button type="button" onClick={sendToLab} disabled={ending || selectedTests.length === 0}
                            style={{ padding: "10px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "white", cursor: ending ? "wait" : "pointer", background: "linear-gradient(135deg, #0EA5E9, #38BDF8)", border: "none", opacity: ending || selectedTests.length === 0 ? 0.4 : 1, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            {ending ? "Sending..." : "Send To Lab — Pause Consultation"}
                          </button>
                        </div>
                      )}
                    </motion.div>

                    {/* Specialist Referral */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
                      style={{ padding: 16, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(14,165,233,0.1)", backdropFilter: "blur(12px)", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showReferralPanel ? 12 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 14 }}>🔗</span>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#38BDF8", fontFamily: fontFamily.mono }}>Refer To Specialist</span>
                        </div>
                        <button type="button" onClick={() => setShowReferralPanel(!showReferralPanel)}
                          style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: showReferralPanel ? "rgba(14,165,233,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${showReferralPanel ? "rgba(14,165,233,0.2)" : "rgba(255,255,255,0.05)"}`, color: showReferralPanel ? "#38BDF8" : "#64748B", cursor: "pointer" }}>
                          {showReferralPanel ? "Close" : "+ Refer"}
                        </button>
                      </div>
                      {showReferralPanel && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <DSelect label="Specialty" value={referralSpecialty} onChange={(e) => setReferralSpecialty(e.target.value)}
                              options={["Cardiologist", "Neurologist", "Orthopedic", "Dermatologist", "Pediatrician", "Gynecologist", "Surgeon", "Ophthalmologist", "ENT Specialist", "Psychiatrist", "Urologist", "Oncologist", "Pulmonologist", "Endocrinologist"].map((s) => ({ value: s.toLowerCase().replace(/\s+/g, "_"), label: s }))} />
                            <div>
                              <label className="block text-xs font-medium font-body mb-1.5" style={{ color: "#94A3B8" }}>Urgency</label>
                              <div style={{ display: "flex", gap: 6 }}>
                                {(["routine", "urgent", "stat"] as const).map((u) => (
                                  <button key={u} type="button" onClick={() => setReferralUrgency(u)}
                                    style={{
                                      flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", cursor: "pointer",
                                      background: referralUrgency === u ? (u === "stat" ? "rgba(220,38,38,0.1)" : u === "urgent" ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)") : "rgba(255,255,255,0.02)",
                                      border: `1px solid ${referralUrgency === u ? (u === "stat" ? "rgba(220,38,38,0.3)" : u === "urgent" ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.3)") : "rgba(255,255,255,0.05)"}`,
                                      color: referralUrgency === u ? (u === "stat" ? "#F87171" : u === "urgent" ? "#F59E0B" : "#22C55E") : "#64748B",
                                    }}>{u}</button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <DInput label="Reason For Referral" placeholder="e.g. Suspected cardiac arrhythmia" required value={referralReason} onChange={(e) => setReferralReason(e.target.value)} />
                          <DTextarea label="Additional Notes" rows={2} placeholder="Additional notes..." value={referralNotes} onChange={(e) => setReferralNotes(e.target.value)} />
                          <button type="button" onClick={sendReferral} disabled={referralSending || !referralReason.trim()}
                            style={{ padding: "9px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "white", cursor: (!referralReason.trim() || referralSending) ? "not-allowed" : "pointer", background: "linear-gradient(135deg, #0EA5E9, #38BDF8)", border: "none", opacity: (!referralReason.trim() || referralSending) ? 0.4 : 1 }}>
                            {referralSending ? "Sending..." : "Send Referral"}
                          </button>
                        </div>
                      )}
                    </motion.div>

                    {/* Inter-Branch Referral */}
                    {hospitalGroup && (
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                        style={{ padding: 16, borderRadius: 14, background: theme.cardBg, border: `1px solid ${COPPER}15`, backdropFilter: "blur(12px)", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showInterBranchPanel ? 12 : 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 14 }}>🌐</span>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: COPPER, fontFamily: fontFamily.mono }}>Inter-Branch Referral</span>
                            <span style={{ fontSize: 9, color: "#64748B", marginLeft: 4 }}>({hospitalGroup.name})</span>
                          </div>
                          <button type="button" onClick={() => setShowInterBranchPanel(!showInterBranchPanel)}
                            style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: showInterBranchPanel ? `${COPPER}15` : "rgba(255,255,255,0.03)", border: `1px solid ${showInterBranchPanel ? COPPER + "30" : "rgba(255,255,255,0.05)"}`, color: showInterBranchPanel ? COPPER : "#64748B", cursor: "pointer" }}>
                            {showInterBranchPanel ? "Close" : "+ Transfer"}
                          </button>
                        </div>
                        {showInterBranchPanel && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              <DSelect label="Destination Branch" value={ibDest} onChange={(e) => setIbDest(e.target.value)}
                                options={groupBranches.map((b) => ({ value: b.code, label: `${b.code} — ${b.name}` }))} />
                              <DSelect label="Department" value={ibDept} onChange={(e) => setIbDept(e.target.value)}
                                options={["Doctor", "Lab", "Pharmacy", "CT/Radiology", "Ultrasound", "Ward", "ICU", "Maternity", "Blood Bank", "Emergency"].map((d) => ({ value: d, label: d }))} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              <div>
                                <label className="block text-xs font-medium font-body mb-1.5" style={{ color: "#94A3B8" }}>Type</label>
                                <div style={{ display: "flex", gap: 4 }}>
                                  {(["OUTPATIENT", "ADMISSION", "EMERGENCY", "BLOOD_REQUEST"] as const).map((t) => (
                                    <button key={t} type="button" onClick={() => setIbType(t)}
                                      style={{ flex: 1, padding: "5px 0", borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", cursor: "pointer", background: ibType === t ? `${COPPER}10` : "rgba(255,255,255,0.02)", border: `1px solid ${ibType === t ? COPPER + "30" : "rgba(255,255,255,0.05)"}`, color: ibType === t ? COPPER : "#64748B" }}>
                                      {t.replace("_", " ")}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium font-body mb-1.5" style={{ color: "#94A3B8" }}>Priority</label>
                                <div style={{ display: "flex", gap: 6 }}>
                                  {(["ROUTINE", "URGENT", "CRITICAL"] as const).map((p) => (
                                    <button key={p} type="button" onClick={() => setIbPriority(p)}
                                      style={{ flex: 1, padding: "5px 0", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", cursor: "pointer", background: ibPriority === p ? (p === "CRITICAL" ? "rgba(220,38,38,0.1)" : p === "URGENT" ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)") : "rgba(255,255,255,0.02)", border: `1px solid ${ibPriority === p ? (p === "CRITICAL" ? "rgba(220,38,38,0.3)" : p === "URGENT" ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.3)") : "rgba(255,255,255,0.05)"}`, color: ibPriority === p ? (p === "CRITICAL" ? "#F87171" : p === "URGENT" ? "#F59E0B" : "#22C55E") : "#64748B" }}>
                                      {p}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <DInput label="Clinical Reason" placeholder="e.g. Requires CT scan not available at this branch" required value={ibReason} onChange={(e) => setIbReason(e.target.value)} />
                            <DTextarea label="Additional Notes" rows={2} placeholder="Additional notes..." value={ibNotes} onChange={(e) => setIbNotes(e.target.value)} />
                            {ibPriority === "CRITICAL" && (
                              <div style={{ fontSize: 10, color: "#F87171", padding: "6px 10px", borderRadius: 6, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
                                CRITICAL priority will auto-accept at the receiving branch — no waiting for approval.
                              </div>
                            )}
                            <button type="button" onClick={sendInterBranchReferral} disabled={ibSending || !ibDest || !ibDept || !ibReason.trim()}
                              style={{ padding: "9px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "white", cursor: (!ibDest || !ibDept || !ibReason.trim() || ibSending) ? "not-allowed" : "pointer", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", opacity: (!ibDest || !ibDept || !ibReason.trim() || ibSending) ? 0.4 : 1 }}>
                              {ibSending ? "Sending..." : "Transfer To Branch"}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Incoming referrals summary */}
                    {incomingReferrals.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                        style={{ padding: 16, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(14,165,233,0.1)", backdropFilter: "blur(12px)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                          <span style={{ fontSize: 14 }}>📨</span>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#38BDF8", fontFamily: fontFamily.mono }}>Incoming Referrals</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(14,165,233,0.08)", color: "#38BDF8", marginLeft: 4 }}>{incomingReferrals.length}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {incomingReferrals.map((ref) => (
                            <div key={ref.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "rgba(14,165,233,0.03)", border: "1px solid rgba(14,165,233,0.1)" }}>
                              <div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "#38BDF8", fontFamily: fontFamily.mono }}>{ref.queueToken}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "white", marginLeft: 8 }}>{ref.patientName}</span>
                                <span style={{ fontSize: 10, color: "#64748B", marginLeft: 8 }}>{ref.reason}</span>
                              </div>
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => acceptReferral(ref)}
                                style={{ padding: "5px 12px", borderRadius: 6, fontSize: 10, fontWeight: 600, color: "#38BDF8", cursor: "pointer", background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)" }}>
                                Accept
                              </motion.button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ═══════ TAB 3: ACTIONS ═══════ */}
                {consultTab === "actions" && (
                  <motion.div key="actions-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      {/* End Consultation */}
                      <motion.div whileHover={{ y: -2 }} onClick={endSession}
                        style={{ padding: 24, borderRadius: 16, background: theme.cardBg, border: `1px solid ${COPPER}20`, backdropFilter: "blur(12px)", cursor: ending ? "wait" : "pointer", opacity: ending ? 0.6 : 1 }}>
                        <div style={{ fontSize: 28, marginBottom: 12 }}>✅</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#D4956B", marginBottom: 4 }}>
                          {prescriptions.some((p) => p.medication) ? "End — Send To Pharmacy" : "End Consultation"}
                        </div>
                        <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
                          {prescriptions.some((p) => p.medication)
                            ? "Save diagnosis, vitals, and prescriptions. Patient proceeds to pharmacy for medication."
                            : "Close this consultation and save all records. Patient proceeds to checkout."}
                        </p>
                      </motion.div>

                      {/* Order Admission */}
                      <motion.div whileHover={{ y: -2 }} onClick={orderAdmission}
                        style={{ padding: 24, borderRadius: 16, background: theme.cardBg, border: "1px solid rgba(168,85,247,0.2)", backdropFilter: "blur(12px)", cursor: orderingAdmission ? "wait" : "pointer", opacity: orderingAdmission ? 0.6 : 1 }}>
                        <div style={{ fontSize: 28, marginBottom: 12 }}>🏥</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#A855F7", marginBottom: 4 }}>{orderingAdmission ? "Ordering..." : "Order Admission"}</div>
                        <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>Order ward admission for this patient. Ward nurse will assign bed and complete admission.</p>
                      </motion.div>

                      {/* Download PDF */}
                      <motion.div whileHover={{ y: -2 }} onClick={() => window.open(`/api/reports?recordId=${activeSession.recordId}&type=patient`, "_blank")}
                        style={{ padding: 24, borderRadius: 16, background: theme.cardBg, border: "1px solid rgba(14,165,233,0.15)", backdropFilter: "blur(12px)", cursor: "pointer" }}>
                        <div style={{ fontSize: 28, marginBottom: 12 }}>📄</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#38BDF8", marginBottom: 4 }}>Download PDF</div>
                        <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>Generate and download the patient record as a PDF document for printing or filing.</p>
                      </motion.div>

                      {/* Send Via WhatsApp */}
                      <motion.div whileHover={{ y: -2 }} onClick={() => { setWaPhone(activeSession.patient?.phone || ""); setWaResult(null); }}
                        style={{ padding: 24, borderRadius: 16, background: theme.cardBg, border: "1px solid rgba(37,211,102,0.15)", backdropFilter: "blur(12px)", cursor: "pointer" }}>
                        <div style={{ fontSize: 28, marginBottom: 12 }}>💬</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#25D366", marginBottom: 4 }}>Send Via WhatsApp</div>
                        <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>Send consultation summary and prescriptions to the patient via WhatsApp message.</p>
                      </motion.div>
                    </div>

                    {/* WhatsApp phone input (shows when WhatsApp card clicked) */}
                    {waPhone !== "" && (
                      <div style={{ marginTop: 14, padding: 16, borderRadius: 14, background: theme.cardBg, border: "1px solid rgba(37,211,102,0.15)", backdropFilter: "blur(12px)" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
                          <div style={{ flex: 1 }}>
                            <DInput label="Patient Phone Number" value={waPhone} onChange={(e) => setWaPhone(e.target.value)} placeholder="e.g. 0244123456" />
                          </div>
                          <button type="button" onClick={handleWhatsAppSend} disabled={waSending || !waPhone.trim()}
                            style={{ padding: "10px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "white", background: "#25D366", border: "none", cursor: "pointer", opacity: waSending ? 0.6 : 1, marginBottom: 1 }}>
                            {waSending ? "Sending..." : "Send"}
                          </button>
                          <button type="button" onClick={() => { setWaPhone(""); setWaResult(null); }}
                            style={{ padding: "10px 12px", borderRadius: 10, fontSize: 12, color: "#64748B", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", marginBottom: 1 }}>
                            ✕
                          </button>
                        </div>
                        {waResult && <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: waResult.ok ? "#25D366" : "#F87171" }}>{waResult.msg}</div>}
                      </div>
                    )}
                  </motion.div>
                )}
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
    {/* ── Shift Handover Modal ── */}
    {showHandover && (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) setShowHandover(false); }}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ width: 420, padding: 28, borderRadius: 16, background: "rgba(10,10,20,0.97)", border: `1px solid ${COPPER}20`, backdropFilter: "blur(16px)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#F59E0B", marginBottom: 16 }}>🔄 Shift Handover</h3>
          <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>Transfer all your active patients to the incoming doctor. Your status will be set to Off Duty.</p>
          <div style={{ marginBottom: 12 }}>
            <DSelect label="Incoming Doctor" value={handoverTarget} onChange={(e) => setHandoverTarget(e.target.value)}
              options={handoverDoctors.map(d => ({ value: d.id, label: `${d.name} — ${d.specialty} (${d.status})` }))} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <DTextarea label="Handover Notes" value={handoverNotes} onChange={(e) => setHandoverNotes(e.target.value)} placeholder="Key observations, pending actions..." rows={3} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setShowHandover(false)}
              style={{ flex: 1, padding: "9px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#94A3B8", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="button" onClick={handleShiftHandover} disabled={handoverSending || !handoverTarget}
              style={{ flex: 1, padding: "9px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "white", background: "#F59E0B", border: "none", cursor: "pointer", opacity: handoverSending || !handoverTarget ? 0.5 : 1 }}>
              {handoverSending ? "Transferring..." : "Confirm Handover"}
            </button>
          </div>
        </motion.div>
      </div>
    )}

    {/* ═══ Create SOAP Template Modal ═══ */}
    <AnimatePresence>
      {showCreateTemplate && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
          onClick={() => setShowCreateTemplate(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            style={{ background: "rgba(15,15,25,0.98)", border: `1px solid ${COPPER}20`, borderRadius: 24, padding: 28, width: 560, maxHeight: "85vh", overflow: "auto" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#D4956B", marginBottom: 20 }}>Create SOAP Template</div>

            {/* Template name + icon */}
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label className="block text-xs font-medium font-body mb-1.5" style={{ color: theme.textLabel }}>Icon</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  {["📋", "🩺", "💊", "🧪", "🩹", "🫁", "❤️", "🦟", "🤒", "🤰", "🦴", "👁️"].map(ico => (
                    <button key={ico} type="button" onClick={() => setNewTemplate(t => ({ ...t, icon: ico }))}
                      style={{ fontSize: 14, padding: 3, borderRadius: 4, cursor: "pointer", border: newTemplate.icon === ico ? `1px solid ${COPPER}40` : "1px solid transparent", background: newTemplate.icon === ico ? `${COPPER}10` : "transparent" }}>
                      {ico}
                    </button>
                  ))}
                </div>
              </div>
              <DInput label="Template Name" placeholder="e.g. Sickle Cell Crisis" value={newTemplate.label} onChange={e => setNewTemplate(t => ({ ...t, label: e.target.value }))} required />
            </div>

            {/* Diagnosis + Notes */}
            <div style={{ marginBottom: 12 }}>
              <DInput label="Diagnosis" placeholder="e.g. Sickle Cell Disease — Vaso-Occlusive Crisis" value={newTemplate.diagnosis} onChange={e => setNewTemplate(t => ({ ...t, diagnosis: e.target.value }))} required />
            </div>
            <div style={{ marginBottom: 12 }}>
              <DTextarea label="SOAP Notes" rows={3} placeholder="S: ... O: ... A: ... P: ..." value={newTemplate.notes} onChange={e => setNewTemplate(t => ({ ...t, notes: e.target.value }))} />
            </div>

            {/* Prescriptions */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label className="block text-xs font-medium font-body" style={{ color: theme.textLabel }}>Prescriptions</label>
                <button type="button" onClick={() => setNewTemplate(t => ({ ...t, prescriptions: [...t.prescriptions, { medication: "", dosage: "", frequency: "", duration: "" }] }))}
                  style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, cursor: "pointer", background: `${COPPER}08`, border: `1px solid ${COPPER}20`, color: "#D4956B" }}>+ Add</button>
              </div>
              {newTemplate.prescriptions.map((rx, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 20px", gap: 6, marginBottom: 6 }}>
                  <input placeholder="Medication" value={rx.medication} onChange={e => { const p = [...newTemplate.prescriptions]; p[i] = { ...p[i], medication: e.target.value }; setNewTemplate(t => ({ ...t, prescriptions: p })); }}
                    className="rounded-lg border px-2.5 py-2 text-xs font-body focus:outline-none" style={{ background: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }} />
                  <input placeholder="Dosage" value={rx.dosage} onChange={e => { const p = [...newTemplate.prescriptions]; p[i] = { ...p[i], dosage: e.target.value }; setNewTemplate(t => ({ ...t, prescriptions: p })); }}
                    className="rounded-lg border px-2.5 py-2 text-xs font-body focus:outline-none" style={{ background: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }} />
                  <input placeholder="Frequency" value={rx.frequency} onChange={e => { const p = [...newTemplate.prescriptions]; p[i] = { ...p[i], frequency: e.target.value }; setNewTemplate(t => ({ ...t, prescriptions: p })); }}
                    className="rounded-lg border px-2.5 py-2 text-xs font-body focus:outline-none" style={{ background: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }} />
                  <input placeholder="Duration" value={rx.duration} onChange={e => { const p = [...newTemplate.prescriptions]; p[i] = { ...p[i], duration: e.target.value }; setNewTemplate(t => ({ ...t, prescriptions: p })); }}
                    className="rounded-lg border px-2.5 py-2 text-xs font-body focus:outline-none" style={{ background: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }} />
                  {newTemplate.prescriptions.length > 1 && (
                    <button type="button" onClick={() => setNewTemplate(t => ({ ...t, prescriptions: t.prescriptions.filter((_, j) => j !== i) }))}
                      style={{ border: "none", background: "transparent", color: "#EF4444", cursor: "pointer", fontSize: 12, fontWeight: 700, alignSelf: "center" }}>x</button>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <motion.button type="button" onClick={saveAsTemplate} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                disabled={!newTemplate.label.trim() || !newTemplate.diagnosis.trim()}
                style={{ flex: 2, padding: "12px 20px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", textTransform: "uppercase", letterSpacing: "0.06em", opacity: !newTemplate.label.trim() || !newTemplate.diagnosis.trim() ? 0.4 : 1 }}>
                Save Template
              </motion.button>
              <button type="button" onClick={() => setShowCreateTemplate(false)}
                style={{ flex: 1, padding: "12px 20px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#94A3B8", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </StationThemeProvider>
  );
}