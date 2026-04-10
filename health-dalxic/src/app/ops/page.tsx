"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TIER_DEFAULTS, ALL_WORKSTATIONS, UTILITY_STATIONS, type TierKey } from "@/lib/tier-defaults";

/* ─── Constants ─── */
const COPPER = "#B87333";
const COPPER_LIGHT = "#D4956B";
const BLUE = "#0EA5E9";
const OPS_KEY = "dalxic_ops_session";

/** Master role list — professional titles, module mapping drives contextual sorting */
const ROLE_OPTIONS = [
  { value: "front_desk", label: "Front Desk / Records", modules: ["front_desk"] },
  { value: "doctor", label: "Doctor", modules: ["doctor", "ward_ipd", "emergency", "icu", "maternity"] },
  { value: "specialist", label: "Specialist / Consultant", modules: ["doctor", "ward_ipd"] },
  { value: "surgeon", label: "Surgeon", modules: ["doctor", "emergency", "icu"] },
  { value: "pharmacist", label: "Pharmacist", modules: ["pharmacy"] },
  { value: "lab_tech", label: "Lab Technician", modules: ["lab", "blood_bank"] },
  { value: "nurse", label: "Nurse", modules: ["nurse_station", "injection_room", "ward_ipd", "emergency", "icu", "maternity"] },
  { value: "midwife", label: "Midwife", modules: ["maternity"] },
  { value: "radiologist", label: "Radiologist", modules: ["ct_radiology"] },
  { value: "sonographer", label: "Sonographer", modules: ["ultrasound"] },
  { value: "anaesthetist", label: "Anaesthetist", modules: ["icu", "emergency"] },
  { value: "physiotherapist", label: "Physiotherapist", modules: ["ward_ipd"] },
  { value: "billing", label: "Billing / Accounts", modules: ["billing"] },
  { value: "records", label: "Medical Records", modules: ["front_desk"] },
  { value: "porter", label: "Porter / Orderly", modules: [] },
  { value: "it_support", label: "IT Support", modules: [] },
  { value: "admin", label: "Hospital Admin", modules: ["admin"] },
  { value: "super_admin", label: "Super Admin (Dalxic)", modules: [] },
];

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
    const stars = Array.from({ length: 350 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() < 0.08 ? Math.random() * 2.5 + 1.2 : Math.random() * 1.2 + 0.2,
      baseOpacity: Math.random() * 0.6 + 0.15,
      twinkleSpeed: Math.random() * 0.04 + 0.012,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: [[255,255,255],[255,220,180],[184,115,51],[210,150,80],[14,165,233],[160,200,255]][
        Math.random() < 0.1 ? 2 : Math.random() < 0.1 ? 3 : Math.random() < 0.06 ? 4 : Math.random() < 0.05 ? 5 : Math.floor(Math.random() * 2)
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
        if (s.r > 1.5) {
          const glow = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
          glow.addColorStop(0, `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${opacity * 0.2})`);
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

/* ─── Encrypted Gate ─── */
function EncryptedGate({ onUnlock }: { onUnlock: () => void }) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;
    setVerifying(true); setError(null);
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase.trim());
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    const isValid = passphrase.trim().startsWith("dalxic-") && passphrase.trim().length >= 12;
    if (isValid) {
      setUnlocked(true);
      sessionStorage.setItem(OPS_KEY, JSON.stringify({ authenticated: true, expiresAt: Date.now() + 8 * 60 * 60 * 1000, hash: hashHex.slice(0, 16) }));
      setTimeout(onUnlock, 800);
    } else {
      setError("Access Denied — Invalid Encryption Key");
      setPassphrase(""); setVerifying(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 120% 80% at 55% 40%, rgba(10,6,4,1) 0%, rgba(4,2,8,1) 50%, rgba(1,2,6,1) 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <GalaxyCanvas />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(184,115,51,0.04) 0%, transparent 55%)", pointerEvents: "none" }} />
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "56px 48px", borderRadius: 28, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(184,115,51,0.08)", backdropFilter: "blur(24px)", minWidth: 420, maxWidth: 460, boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
        <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: `linear-gradient(90deg, transparent, ${COPPER}30, transparent)` }} />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }} style={{ marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto", background: `radial-gradient(circle, ${COPPER}08, transparent 70%)`, border: `1px solid ${COPPER}15`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 48px ${COPPER}08` }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COPPER} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><rect x="10" y="10" width="4" height="5" rx="0.5" /><circle cx="12" cy="8.5" r="1.5" />
            </svg>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: COPPER, marginBottom: 8, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Dalxic Health</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F0F4FF", marginBottom: 6, fontFamily: "var(--font-outfit), Outfit, sans-serif", letterSpacing: "-0.02em" }}>Operating Platform</h1>
          <p style={{ fontSize: 11, color: "#4A5568", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Encrypted Access Required</p>
        </motion.div>
        <div style={{ width: 48, height: 1, background: `linear-gradient(90deg, transparent, ${COPPER}25, transparent)`, margin: "28px auto" }} />
        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <div style={{ position: "relative", marginBottom: 20 }}>
            <input ref={inputRef} type="password" value={passphrase} onChange={e => { setPassphrase(e.target.value); setError(null); }} placeholder="Enter Encryption Key" disabled={verifying && !error} autoComplete="off" spellCheck={false}
              style={{ width: "100%", padding: "16px 20px 16px 48px", borderRadius: 14, fontSize: 14, fontWeight: 500, color: "#E2E8F0", letterSpacing: "0.04em", background: "rgba(255,255,255,0.03)", border: `1.5px solid ${error ? "rgba(239,68,68,0.4)" : passphrase ? COPPER + "30" : "rgba(255,255,255,0.06)"}`, outline: "none", transition: "all 0.25s ease", fontFamily: "var(--font-jetbrains-mono), monospace" }} />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={passphrase ? COPPER : "#4A5568"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <motion.button type="submit" disabled={!passphrase.trim() || (verifying && !error)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            style={{ width: "100%", padding: "15px 0", borderRadius: 14, cursor: "pointer", background: unlocked ? "linear-gradient(135deg, #22C55E, #16A34A)" : `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", opacity: !passphrase.trim() ? 0.4 : 1, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
            {unlocked ? "Access Granted" : verifying && !error ? "Verifying..." : "Authenticate"}
          </motion.button>
        </motion.form>
        <AnimatePresence>
          {error && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ marginTop: 16, fontSize: 11, color: "#EF4444", fontWeight: 600, padding: "10px 16px", borderRadius: 10, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>{error}</motion.div>}
        </AnimatePresence>
        <AnimatePresence>
          {unlocked && <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ marginTop: 16, fontSize: 12, color: "#22C55E", fontWeight: 600, letterSpacing: "0.1em" }}>Decrypting Platform...</motion.div>}
        </AnimatePresence>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} style={{ position: "absolute", bottom: 28, fontSize: 9, color: "#1E293B", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
        Dalxic &mdash; Classified
      </motion.p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

interface HospitalItem {
  id: string; code: string; name: string; subdomain: string;
  tier: string; active: boolean; activeModules?: string[];
  tagline?: string;
  groupId?: string | null; groupCode?: string | null;
  group?: { groupCode: string; name: string } | null;
  _count: { devices: number; monthlyBooks: number; patientRecords: number };
}

interface OperatorItem {
  id: string; name: string; phone: string | null;
  role: string; isActive: boolean; lastLoginAt: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface GroupDashboard { group: { groupCode: string; name: string; ownerName: string; subscriptionTier: string }; branches: { code: string; name: string; tier: string; modules: number; totalPatients: number; todayPatients: number; operators: number; revenue: number }[]; totals: { patients: number; todayPatients: number; operators: number; revenue: number; branches: number }; activeReferrals: any[] }

interface DeviceItem {
  id: string; deviceCode: string; deviceName: string;
  role: string; isActive: boolean; isLocked: boolean;
  lastActiveAt: string | null;
}

interface AuditLog { id: string; actorType: string; actorId: string; action: string; metadata: Record<string, unknown>; ipAddress: string; timestamp: string; hospital?: { code: string; name: string } }

interface AccessGrant { id: string; dalxicStaffId: string; grantedRole: string; grantedBy: string; reason: string; isActive: boolean; grantedAt: string; expiresAt: string; revokedAt: string | null; dalxicStaff?: { name: string; email: string }; hospital?: { code: string; name: string } }

/* ═══════════════════════════════════════════════════════════════════════════════
   OPERATING PLATFORM — Hierarchical Drill-Down
   ═══════════════════════════════════════════════════════════════════════════════ */

type OpsScreen = "tiers" | "modules" | "module-config" | "hospitals" | "hospital-detail" | "monitoring" | "audit" | "access";

function OperatingPlatform({ onLogout }: { onLogout: () => void }) {
  // ─── Navigation ───
  const [screen, setScreen] = useState<OpsScreen>("hospitals");
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [configModule, setConfigModule] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ─── Data ───
  const [hospitals, setHospitals] = useState<HospitalItem[]>([]);
  const [operators, setOperators] = useState<OperatorItem[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>("");
  const [groupDashboard, setGroupDashboard] = useState<GroupDashboard | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [onlineOps, setOnlineOps] = useState(0);

  // ─── Hospital form ───
  const [newHospital, setNewHospital] = useState({ code: "", name: "", subdomain: "", tagline: "" });
  const [addingHospital, setAddingHospital] = useState(false);
  const [hospitalMsg, setHospitalMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ─── Group form ───
  const [newGroup, setNewGroup] = useState({ groupCode: "", name: "", ownerName: "", ownerPin: "" });
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupMsg, setGroupMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ─── Operator form ───
  const [newOp, setNewOp] = useState({ name: "", phone: "", pin: "", role: "front_desk" });
  const [addingOp, setAddingOp] = useState(false);
  const [opMsg, setOpMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [editOp, setEditOp] = useState<OperatorItem | null>(null);
  const [editOpForm, setEditOpForm] = useState({ name: "", phone: "", role: "", newPin: "" });
  const [editOpMsg, setEditOpMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ─── Audit ───
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditFilter, setAuditFilter] = useState({ hospitalCode: "", actorType: "", action: "", startDate: "", endDate: "" });

  // ─── Access grants ───
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>([]);
  const [newGrant, setNewGrant] = useState({ staffId: "", hospitalId: "", role: "viewer", reason: "", hours: "24" });
  const [grantMsg, setGrantMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ─── Hospital Detail ─── (some temporarily unused — will return when detail sections are re-added)
  const [detailHospital, setDetailHospital] = useState<HospitalItem | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [detailOperators, setDetailOperators] = useState<OperatorItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [detailDevices, setDetailDevices] = useState<DeviceItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editingDetails, setEditingDetails] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [detailEditForm, setDetailEditForm] = useState({ name: "", tagline: "", subdomain: "" });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [detailEditMsg, setDetailEditMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [changingTier, setChangingTier] = useState(false);
  const [detailNewOp, setDetailNewOp] = useState({ name: "", phone: "", pin: "", role: "front_desk" });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [detailAddingOp, setDetailAddingOp] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [detailOpMsg, setDetailOpMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [detailEditOp, setDetailEditOp] = useState<OperatorItem | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [detailEditOpForm, setDetailEditOpForm] = useState({ name: "", phone: "", role: "", newPin: "" });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [detailEditOpMsg, setDetailEditOpMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ─── Module Popup (hospital-detail inline config) ───
  const [modulePopup, setModulePopup] = useState<string | null>(null);
  const [popupOp, setPopupOp] = useState({ name: "", phone: "", pin: "" });
  const [popupAdding, setPopupAdding] = useState(false);
  const [popupMsg, setPopupMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [popupOperators, setPopupOperators] = useState<OperatorItem[]>([]);

  // ─── Collapsed groups for tree view ───
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  /* ─── API Loaders ─── */
  const loadHospitals = useCallback(async () => {
    try { const res = await fetch("/api/hospitals"); if (res.ok) setHospitals(await res.json()); } catch { /* */ }
  }, []);

  const loadOperators = useCallback(async (hospitalCode: string) => {
    if (!hospitalCode) { setOperators([]); return; }
    try { const res = await fetch(`/api/operators?hospitalCode=${hospitalCode}&activeOnly=false`); if (res.ok) { const data = await res.json(); setOperators(data.operators || []); } } catch { /* */ }
  }, []);

  const loadGroups = useCallback(async () => {
    // Groups are derived from hospital data in the grouped computed block
  }, []);

  const loadGroupDashboard = useCallback(async (groupCode: string) => {
    if (!groupCode) { setGroupDashboard(null); return; }
    try { const res = await fetch(`/api/groups/dashboard?groupCode=${groupCode}`); if (res.ok) setGroupDashboard(await res.json()); } catch { /* */ }
  }, []);

  const loadOnlineCount = useCallback(async (hosList: typeof hospitals) => {
    if (hosList.length === 0) { setOnlineOps(0); return; }
    try {
      const results = await Promise.all(hosList.map(h => fetch(`/api/operators?hospitalCode=${h.code}`).then(r => r.ok ? r.json() : { onlineCount: 0 })));
      setOnlineOps(results.reduce((s: number, r: { onlineCount?: number }) => s + (r.onlineCount || 0), 0));
    } catch { setOnlineOps(0); }
  }, []);

  const loadAuditLogs = useCallback(async (filters?: typeof auditFilter) => {
    try {
      const f = filters || auditFilter;
      const params = new URLSearchParams({ limit: "200" });
      if (f.hospitalCode) params.set("hospitalCode", f.hospitalCode);
      if (f.actorType) params.set("actorType", f.actorType);
      if (f.action) params.set("action", f.action);
      if (f.startDate) params.set("startDate", f.startDate);
      if (f.endDate) params.set("endDate", f.endDate);
      const res = await fetch(`/api/audit?${params.toString()}`);
      if (res.ok) setAuditLogs(await res.json());
    } catch { /* */ }
  }, [auditFilter]);

  const loadAccessGrants = useCallback(async () => {
    try { const res = await fetch("/api/access-grants"); if (res.ok) setAccessGrants(await res.json()); } catch { /* */ }
  }, []);

  const loadHospitalDetail = useCallback(async (hospitalCode: string) => {
    try {
      const [hospRes, opsRes] = await Promise.all([
        fetch(`/api/hospitals?code=${hospitalCode}`),
        fetch(`/api/operators?hospitalCode=${hospitalCode}&activeOnly=false`),
      ]);
      if (hospRes.ok) {
        const hosp = await hospRes.json();
        setDetailHospital(hosp);
        try { const devRes = await fetch(`/api/devices?hospitalId=${hosp.id}`); if (devRes.ok) setDetailDevices(await devRes.json()); else setDetailDevices([]); } catch { setDetailDevices([]); }
      }
      if (opsRes.ok) { const data = await opsRes.json(); setDetailOperators(data.operators || []); }
    } catch { /* */ }
  }, []);

  const enterHospitalDetail = useCallback((hospital: HospitalItem) => {
    setDetailHospital(hospital);
    setDetailOperators([]);
    setDetailDevices([]);
    setEditingDetails(false);
    setChangingTier(false);
    setDetailEditOp(null);
    setDetailOpMsg(null);
    setDetailEditMsg(null);
    setScreen("hospital-detail");
    loadHospitalDetail(hospital.code);
  }, [loadHospitalDetail]);

  /* ─── Effects ─── */
  useEffect(() => { loadHospitals(); loadGroups(); }, [loadHospitals, loadGroups]);
  useEffect(() => { if (hospitals.length > 0) loadOnlineCount(hospitals); }, [hospitals, loadOnlineCount]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (selectedHospital) loadOperators(selectedHospital); }, [selectedHospital, loadOperators]);
  useEffect(() => { if (selectedGroup) loadGroupDashboard(selectedGroup); }, [selectedGroup, loadGroupDashboard]);

  /* ─── Handlers ─── */
  const selectTier = (tier: TierKey) => {
    setSelectedTier(tier);
    setActiveModules([...TIER_DEFAULTS[tier].modules]);
    setScreen("modules");
  };

  const toggleModule = (key: string) => {
    setActiveModules(prev => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]);
  };

  const enterModuleConfig = (moduleKey: string) => {
    setConfigModule(moduleKey);
    setScreen("module-config");
    // Default role to the first relevant role for this module
    const relevantRole = ROLE_OPTIONS.find(r => r.modules.includes(moduleKey));
    if (relevantRole) setNewOp(o => ({ ...o, role: relevantRole.value }));
    // Auto-select hospital if one is assigned
    if (selectedHospital) loadOperators(selectedHospital);
  };

  const handleAddOperator = async () => {
    if (!selectedHospital || !newOp.name || !newOp.pin || !newOp.role) return;
    setAddingOp(true); setOpMsg(null);
    try {
      const res = await fetch("/api/operators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: selectedHospital, action: "create", name: newOp.name, phone: newOp.phone, pin: newOp.pin, role: newOp.role }) });
      if (res.ok) { setOpMsg({ type: "ok", text: `${newOp.name} added` }); setNewOp({ name: "", phone: "", pin: "", role: "front_desk" }); loadOperators(selectedHospital); }
      else { const err = await res.json(); setOpMsg({ type: "err", text: err.error || "Failed" }); }
    } catch { setOpMsg({ type: "err", text: "Network error" }); } finally { setAddingOp(false); }
  };

  const handleToggleOperator = async (op: OperatorItem) => {
    if (!selectedHospital) return;
    await fetch("/api/operators", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: selectedHospital, operatorId: op.id, isActive: !op.isActive }) });
    loadOperators(selectedHospital);
  };

  const handleEditOperator = async () => {
    if (!editOp || !selectedHospital) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { hospitalCode: selectedHospital, operatorId: editOp.id };
    if (editOpForm.name !== editOp.name) payload.name = editOpForm.name;
    if (editOpForm.phone !== (editOp.phone || "")) payload.phone = editOpForm.phone;
    if (editOpForm.role !== editOp.role) payload.role = editOpForm.role;
    if (editOpForm.newPin && editOpForm.newPin.length === 4) payload.newPin = editOpForm.newPin;
    const res = await fetch("/api/operators", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { setEditOpMsg({ type: "ok", text: "Updated" }); loadOperators(selectedHospital); setTimeout(() => setEditOp(null), 600); }
    else { const err = await res.json(); setEditOpMsg({ type: "err", text: err.error || "Failed" }); }
  };

  const handleAddHospital = async () => {
    if (!newHospital.code || !newHospital.name || !newHospital.subdomain || !selectedTier) return;
    setAddingHospital(true); setHospitalMsg(null);
    try {
      const res = await fetch("/api/hospitals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: newHospital.code, name: newHospital.name, subdomain: newHospital.subdomain, tier: selectedTier, tagline: newHospital.tagline, actorId: "dalxic_ops" }) });
      if (res.ok) {
        // Update the hospital's active modules to match our config
        await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: newHospital.code, editFields: {} }) });
        // Set each module
        for (const mod of activeModules) {
          const h = await fetch("/api/hospitals").then(r => r.json());
          const hospital = h.find((x: HospitalItem) => x.code === newHospital.code);
          if (hospital && !(hospital.activeModules || []).includes(mod)) {
            await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: newHospital.code, toggleModule: mod }) });
          }
        }
        setHospitalMsg({ type: "ok", text: `${newHospital.name} created with ${activeModules.length} modules` });
        setNewHospital({ code: "", name: "", subdomain: "", tagline: "" });
        setSelectedHospital(newHospital.code);
        loadHospitals(); loadGroups();
      } else { const err = await res.json(); setHospitalMsg({ type: "err", text: err.error || "Failed" }); }
    } catch { setHospitalMsg({ type: "err", text: "Network error" }); }
    finally { setAddingHospital(false); }
  };

  const handleCreateGroup = async () => {
    const { groupCode, name, ownerName, ownerPin } = newGroup;
    if (!groupCode || !name || !ownerName || ownerPin.length !== 4) return;
    setCreatingGroup(true); setGroupMsg(null);
    try {
      const res = await fetch("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", groupCode, name, ownerName, ownerPin, actorId: "dalxic_ops" }) });
      if (res.ok) { setGroupMsg({ type: "ok", text: `Group ${groupCode} created` }); setNewGroup({ groupCode: "", name: "", ownerName: "", ownerPin: "" }); loadGroups(); }
      else { const err = await res.json(); setGroupMsg({ type: "err", text: err.error || "Failed" }); }
    } catch { setGroupMsg({ type: "err", text: "Network error" }); }
    finally { setCreatingGroup(false); }
  };

  const handleLinkHospital = async (groupCode: string, hospitalCode: string) => {
    const res = await fetch("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "link_hospital", groupCode, hospitalCode, actorId: "dalxic_ops" }) });
    if (res.ok) { loadHospitals(); loadGroups(); } else { const err = await res.json(); setGroupMsg({ type: "err", text: err.error || "Failed" }); }
  };

  const handleUnlinkHospital = async (hospitalCode: string) => {
    const res = await fetch("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unlink_hospital", hospitalCode, actorId: "dalxic_ops" }) });
    if (res.ok) { loadHospitals(); loadGroups(); }
  };

  const handleCreateGrant = async () => {
    if (!newGrant.staffId || !newGrant.hospitalId || !newGrant.reason) { setGrantMsg({ type: "err", text: "All fields required" }); return; }
    const expiresAt = new Date(Date.now() + parseInt(newGrant.hours) * 60 * 60 * 1000).toISOString();
    const res = await fetch("/api/access-grants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dalxicStaffId: newGrant.staffId, hospitalId: newGrant.hospitalId, grantedRole: newGrant.role, grantedBy: "ops-admin", expiresAt, reason: newGrant.reason }) });
    if (res.ok) { setGrantMsg({ type: "ok", text: "Access granted" }); setNewGrant({ staffId: "", hospitalId: "", role: "viewer", reason: "", hours: "24" }); loadAccessGrants(); }
    else { const err = await res.json(); setGrantMsg({ type: "err", text: err.error || "Failed" }); }
  };

  const handleRevokeGrant = async (grantId: string) => {
    const res = await fetch("/api/access-grants", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ grantId, revokedBy: "ops-admin" }) });
    if (res.ok) loadAccessGrants();
  };

  const handleExportAuditCSV = () => {
    const params = new URLSearchParams({ limit: "500", format: "csv" });
    if (auditFilter.hospitalCode) params.set("hospitalCode", auditFilter.hospitalCode);
    if (auditFilter.actorType) params.set("actorType", auditFilter.actorType);
    if (auditFilter.action) params.set("action", auditFilter.action);
    if (auditFilter.startDate) params.set("startDate", auditFilter.startDate);
    if (auditFilter.endDate) params.set("endDate", auditFilter.endDate);
    window.open(`/api/audit?${params.toString()}`, "_blank");
  };

  // handleToggleHospitalActive moved to detail view as handleDetailToggleActive

  /* ─── Hospital Detail Handlers ─── */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDetailEditSave = async () => {
    if (!detailHospital) return;
    setDetailEditMsg(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editFields: any = {};
    if (detailEditForm.name && detailEditForm.name !== detailHospital.name) editFields.name = detailEditForm.name;
    if (detailEditForm.tagline !== (detailHospital.tagline || "")) editFields.tagline = detailEditForm.tagline;
    if (detailEditForm.subdomain && detailEditForm.subdomain !== detailHospital.subdomain) editFields.subdomain = detailEditForm.subdomain;
    if (Object.keys(editFields).length === 0) { setEditingDetails(false); return; }
    const res = await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: detailHospital.code, editFields, actorId: "ops-admin" }) });
    if (res.ok) { setDetailEditMsg({ type: "ok", text: "Details Updated" }); setEditingDetails(false); loadHospitalDetail(detailHospital.code); loadHospitals(); }
    else { const err = await res.json(); setDetailEditMsg({ type: "err", text: err.error || "Failed" }); }
  };

  const handleDetailToggleModule = async (moduleKey: string) => {
    if (!detailHospital) return;
    const hospitalModules = (detailHospital.activeModules || []) as string[];
    const allKeys = [...ALL_WORKSTATIONS, ...UTILITY_STATIONS].map(ws => ws.key);

    if (moduleKey === "__select_all__") {
      const toEnable = allKeys.filter(k => !hospitalModules.includes(k));
      for (const k of toEnable) await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: detailHospital.code, toggleModule: k, actorId: "ops-admin" }) });
      loadHospitalDetail(detailHospital.code); loadHospitals(); return;
    }
    if (moduleKey === "__deselect_all__") {
      const toDisable = allKeys.filter(k => hospitalModules.includes(k));
      for (const k of toDisable) await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: detailHospital.code, toggleModule: k, actorId: "ops-admin" }) });
      loadHospitalDetail(detailHospital.code); loadHospitals(); return;
    }

    const res = await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: detailHospital.code, toggleModule: moduleKey, actorId: "ops-admin" }) });
    if (res.ok) { loadHospitalDetail(detailHospital.code); loadHospitals(); }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDetailChangeTier = async (newTier: TierKey) => {
    if (!detailHospital) return;
    const res = await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: detailHospital.code, newTier, actorId: "ops-admin" }) });
    if (res.ok) { setChangingTier(false); loadHospitalDetail(detailHospital.code); loadHospitals(); }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDetailToggleActive = async () => {
    if (!detailHospital) return;
    await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: detailHospital.code, editFields: { active: !detailHospital.active }, actorId: "ops-admin" }) });
    loadHospitalDetail(detailHospital.code); loadHospitals();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDetailAddOperator = async () => {
    if (!detailHospital || !detailNewOp.name || !detailNewOp.pin || !detailNewOp.role) return;
    setDetailAddingOp(true); setDetailOpMsg(null);
    try {
      const res = await fetch("/api/operators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: detailHospital.code, action: "create", name: detailNewOp.name, phone: detailNewOp.phone, pin: detailNewOp.pin, role: detailNewOp.role }) });
      if (res.ok) { setDetailOpMsg({ type: "ok", text: `${detailNewOp.name} Added` }); setDetailNewOp({ name: "", phone: "", pin: "", role: "front_desk" }); loadHospitalDetail(detailHospital.code); }
      else { const err = await res.json(); setDetailOpMsg({ type: "err", text: err.error || "Failed" }); }
    } catch { setDetailOpMsg({ type: "err", text: "Network Error" }); } finally { setDetailAddingOp(false); }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDetailToggleOperator = async (op: OperatorItem) => {
    if (!detailHospital) return;
    await fetch("/api/operators", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: detailHospital.code, operatorId: op.id, isActive: !op.isActive }) });
    loadHospitalDetail(detailHospital.code);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDetailEditOperator = async () => {
    if (!detailEditOp || !detailHospital) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { hospitalCode: detailHospital.code, operatorId: detailEditOp.id };
    if (detailEditOpForm.name !== detailEditOp.name) payload.name = detailEditOpForm.name;
    if (detailEditOpForm.phone !== (detailEditOp.phone || "")) payload.phone = detailEditOpForm.phone;
    if (detailEditOpForm.role !== detailEditOp.role) payload.role = detailEditOpForm.role;
    if (detailEditOpForm.newPin && detailEditOpForm.newPin.length === 4) payload.newPin = detailEditOpForm.newPin;
    const res = await fetch("/api/operators", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { setDetailEditOpMsg({ type: "ok", text: "Updated" }); loadHospitalDetail(detailHospital.code); setTimeout(() => setDetailEditOp(null), 600); }
    else { const err = await res.json(); setDetailEditOpMsg({ type: "err", text: err.error || "Failed" }); }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDetailDeviceAction = async (deviceId: string, action: string) => {
    await fetch("/api/devices", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId, action, actorId: "ops-admin", actorType: "dalxic_super_admin" }) });
    if (detailHospital) loadHospitalDetail(detailHospital.code);
  };

  /* ─── Module Popup Handlers ─── */
  const openModulePopup = async (moduleKey: string) => {
    if (!detailHospital) return;
    setModulePopup(moduleKey);
    setPopupOp({ name: "", phone: "", pin: "" });
    setPopupMsg(null);
    // Load operators for this hospital filtered by module role
    try {
      const res = await fetch(`/api/operators?hospitalCode=${detailHospital.code}&activeOnly=false`);
      if (res.ok) { const data = await res.json(); setPopupOperators(data); }
    } catch { /* ignore */ }
  };

  const handlePopupAddOperator = async () => {
    if (!detailHospital || !modulePopup || !popupOp.name || popupOp.pin.length !== 4) return;
    setPopupAdding(true); setPopupMsg(null);
    // Derive role from the module's workstation role
    const ws = [...ALL_WORKSTATIONS, ...UTILITY_STATIONS].find(w => w.key === modulePopup);
    const relevantRole = ROLE_OPTIONS.find(r => r.modules.includes(modulePopup));
    const role = relevantRole?.value || ws?.key || "front_desk";
    try {
      const res = await fetch("/api/operators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: detailHospital.code, action: "create", name: popupOp.name, phone: popupOp.phone, pin: popupOp.pin, role }) });
      if (res.ok) {
        setPopupMsg({ type: "ok", text: `${popupOp.name} Added` });
        setPopupOp({ name: "", phone: "", pin: "" });
        // Refresh operator list
        const opRes = await fetch(`/api/operators?hospitalCode=${detailHospital.code}&activeOnly=false`);
        if (opRes.ok) setPopupOperators(await opRes.json());
      } else { const err = await res.json(); setPopupMsg({ type: "err", text: err.error || "Failed" }); }
    } catch { setPopupMsg({ type: "err", text: "Network Error" }); }
    finally { setPopupAdding(false); }
  };

  /* ─── Computed ─── */
  const totalPatients = hospitals.reduce((s, h) => s + h._count.patientRecords, 0);
  const totalDevices = hospitals.reduce((s, h) => s + h._count.devices, 0);
  const configWs = configModule ? [...ALL_WORKSTATIONS, ...UTILITY_STATIONS].find(ws => ws.key === configModule) : null;
  // Group hospitals for tree view
  const grouped = (() => {
    const groupMap = new Map<string, { groupName: string; hospitals: HospitalItem[] }>();
    const standalone: HospitalItem[] = [];
    for (const h of hospitals) {
      if (h.group?.groupCode) {
        const existing = groupMap.get(h.group.groupCode);
        if (existing) existing.hospitals.push(h); else groupMap.set(h.group.groupCode, { groupName: h.group.name, hospitals: [h] });
      } else standalone.push(h);
    }
    return { groups: Array.from(groupMap.entries()).map(([groupCode, data]) => ({ groupCode, groupName: data.groupName, hospitals: data.hospitals })), standalone };
  })();

  /* ─── Breadcrumb ─── */
  const breadcrumb = (() => {
    const crumbs: { label: string; onClick?: () => void }[] = [{ label: "Hospitals", onClick: () => { setScreen("hospitals"); setDetailHospital(null); setConfigModule(null); } }];
    if (screen === "tiers" || (selectedTier && (screen === "modules" || (screen === "module-config" && !detailHospital)))) {
      crumbs.push({ label: "Tiers", onClick: () => { setScreen("tiers"); setSelectedTier(null); setConfigModule(null); } });
    }
    if (selectedTier && (screen === "modules" || (screen === "module-config" && !detailHospital))) {
      crumbs.push({ label: `${selectedTier} — ${TIER_DEFAULTS[selectedTier].label}`, onClick: () => { setScreen("modules"); setConfigModule(null); } });
    }
    if (configModule && screen === "module-config" && configWs) {
      if (detailHospital) {
        crumbs.push({ label: detailHospital.name, onClick: () => { setScreen("hospital-detail"); setConfigModule(null); } });
      }
      crumbs.push({ label: configWs.title });
    }
    if (screen === "hospital-detail" && detailHospital) {
      crumbs.push({ label: `${detailHospital.code} — ${detailHospital.name}` });
    }
    if (screen === "monitoring") crumbs.push({ label: "Monitoring" });
    if (screen === "audit") crumbs.push({ label: "Audit Trail" });
    if (screen === "access") crumbs.push({ label: "Access Grants" });
    return crumbs;
  })();

  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}12`, color: "#E2E8F0", outline: "none", fontFamily: "var(--font-outfit), Outfit, sans-serif" };
  const labelStyle = { display: "block" as const, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#64748B", marginBottom: 6 };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 120% 80% at 55% 20%, rgba(15,9,5,1) 0%, rgba(6,3,12,1) 45%, rgba(2,3,10,1) 100%)", position: "relative", overflow: "hidden", color: "#E2E8F0" }}>
      <GalaxyCanvas />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 15%, rgba(184,115,51,0.04) 0%, transparent 50%)", pointerEvents: "none" }} />

      {/* ─── Header ─── */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "14px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${COPPER}08`, background: "rgba(3,5,15,0.5)", backdropFilter: "blur(16px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: COPPER, boxShadow: `0 0 12px ${COPPER}60` }} />
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.04em", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
            <span style={{ color: "#F0F4FF" }}>Dalxic</span>{" "}
            <span style={{ color: COPPER }}>OPS</span>
          </span>
        </div>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {breadcrumb.map((crumb, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && <span style={{ color: "#334155", fontSize: 10 }}>›</span>}
              {crumb.onClick ? (
                <motion.button whileHover={{ scale: 1.03 }} onClick={crumb.onClick}
                  style={{ background: "none", border: "none", color: i === breadcrumb.length - 1 ? COPPER_LIGHT : "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
                  {crumb.label}
                </motion.button>
              ) : (
                <span style={{ color: COPPER_LIGHT, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>{crumb.label}</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Utility nav */}
          {["hospitals", "monitoring", "audit", "access"].map(s => (
            <motion.button key={s} whileHover={{ scale: 1.05 }} onClick={() => { setScreen(s as OpsScreen); if (s === "audit") loadAuditLogs(); if (s === "access") loadAccessGrants(); }}
              style={{ background: screen === s ? `${COPPER}10` : "none", border: screen === s ? `1px solid ${COPPER}20` : "1px solid transparent", color: screen === s ? COPPER_LIGHT : "#475569", fontSize: 10, fontWeight: 700, padding: "6px 12px", borderRadius: 8, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
              {s === "hospitals" ? "🏥" : s === "monitoring" ? "📊" : s === "audit" ? "📋" : "🔑"} {s}
            </motion.button>
          ))}

          <span style={{ fontSize: 12, fontWeight: 700, color: "#334155", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <motion.button whileHover={{ scale: 1.05 }} onClick={onLogout}
            style={{ padding: "6px 14px", borderRadius: 8, fontSize: 10, fontWeight: 700, color: "#EF4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Lock
          </motion.button>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main style={{ position: "relative", zIndex: 1, paddingTop: 80, paddingBottom: 60, maxWidth: 1200, margin: "0 auto", padding: "80px 36px 60px" }}>
        <AnimatePresence mode="wait">

          {/* ═══════════════════════════════════════ */}
          {/* SCREEN 1: TIER SELECTION (ROOT)        */}
          {/* ═══════════════════════════════════════ */}
          {screen === "tiers" && (
            <motion.div key="tiers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>Deployment Builder</div>
                <h1 style={{ fontSize: 32, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif", letterSpacing: "-0.02em", marginBottom: 6 }}>Select A Tier Template</h1>
                <p style={{ fontSize: 12, color: "#64748B", maxWidth: 480, margin: "0 auto" }}>Each tier is a starting point. Select one, then freely add or remove modules.</p>
              </div>

              {/* Summary bar */}
              <div style={{ display: "flex", justifyContent: "center", gap: 28, marginBottom: 24 }}>
                {[
                  { label: "Hospitals", value: hospitals.length, color: COPPER },
                  { label: "Operators Online", value: `${onlineOps} / ${totalDevices}`, color: onlineOps > 0 ? "#22C55E" : "#64748B" },
                  { label: "Total Patients", value: totalPatients.toLocaleString(), color: BLUE },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>{s.value}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Tier cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {(["T1", "T2", "T3", "T4"] as const).map((tier, i) => {
                  const def = TIER_DEFAULTS[tier];
                  const colors: Record<string, string> = { T1: "#22C55E", T2: BLUE, T3: COPPER, T4: "#A855F7" };
                  const color = colors[tier];
                  const hospitalsAtTier = hospitals.filter(h => h.tier === tier);
                  return (
                    <motion.button
                      key={tier}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectTier(tier)}
                      style={{
                        textAlign: "left", cursor: "pointer", padding: "28px 24px", borderRadius: 20,
                        background: `linear-gradient(135deg, ${color}06, transparent)`,
                        border: `1.5px solid ${color}20`,
                        backdropFilter: "blur(12px)", position: "relative", overflow: "hidden",
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.02)`,
                      }}
                    >
                      <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 2, background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "var(--font-outfit), Outfit, sans-serif", letterSpacing: "-0.02em" }}>{tier}</div>
                        <div style={{ padding: "4px 10px", borderRadius: 8, background: `${color}10`, border: `1px solid ${color}20`, fontSize: 10, fontWeight: 700, color }}>{def.maxDevices === 999 ? "Unlimited" : `${def.maxDevices} Devices`}</div>
                      </div>

                      <div style={{ fontSize: 16, fontWeight: 700, color: "#F0F4FF", marginBottom: 4, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>{def.label}</div>
                      <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5, marginBottom: 10 }}>{def.description}</div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8" }}>{def.modules.length} Modules</span>
                        </div>
                        {hospitalsAtTier.length > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#475569" }}>{hospitalsAtTier.length} Hospital{hospitalsAtTier.length > 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* MASTER — full-width freestyle card */}
              <motion.button
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => selectTier("MASTER" as TierKey)}
                style={{
                  width: "65%", margin: "14px auto 0", display: "block", textAlign: "left", cursor: "pointer", padding: "28px 32px", borderRadius: 22,
                  background: `linear-gradient(135deg, ${COPPER}06, rgba(168,85,247,0.03), transparent)`,
                  border: `1.5px solid ${COPPER}25`,
                  backdropFilter: "blur(12px)", position: "relative", overflow: "hidden",
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03)`,
                }}
              >
                <div style={{ position: "absolute", top: 0, left: "5%", right: "5%", height: 2, background: `linear-gradient(90deg, transparent, ${COPPER}50, rgba(168,85,247,0.3), transparent)` }} />
                <div style={{ position: "absolute", bottom: 0, left: "8%", right: "8%", height: 3, borderRadius: "3px 3px 0 0", background: `linear-gradient(90deg, ${COPPER}, #A855F7)` }} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ fontSize: 28 }}>⚡</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif", letterSpacing: "-0.02em" }}>The Master</span>
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COPPER_LIGHT }}>Privileged Access</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6, maxWidth: 600 }}>
                        Every Module Unlocked — Freestyle Configuration For Any Hospital Type. Build Custom Deployments Without Tier Constraints.
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: COPPER, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>{ALL_WORKSTATIONS.length + UTILITY_STATIONS.length}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568" }}>Modules</div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COPPER} strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                  </div>
                </div>
              </motion.button>

              {/* LEGO tagline */}
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <div style={{ fontSize: 11, color: "#334155", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>Plug And Play — Lets LEGO</div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* SCREEN 2: MODULE SPREAD                */}
          {/* ═══════════════════════════════════════ */}
          {screen === "modules" && selectedTier && (
            <motion.div key="modules" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>Module Configuration</div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
                    {selectedTier} — {TIER_DEFAULTS[selectedTier].label}
                  </h2>
                  <p style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>{activeModules.length} modules active. Click any module to configure operators and access.</p>
                </div>

                {/* Assign / Hospital menu */}
                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setScreen("hospitals")}
                    style={{ padding: "12px 24px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none", letterSpacing: "0.06em" }}>
                    Assign To Hospital
                  </motion.button>
                </div>
              </div>

              {/* Module grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {ALL_WORKSTATIONS.map((ws, i) => {
                  const isActive = activeModules.includes(ws.key);
                  return (
                    <motion.div
                      key={ws.key}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{
                        padding: "20px", borderRadius: 16, position: "relative",
                        background: isActive ? "rgba(34,197,94,0.03)" : "rgba(255,255,255,0.015)",
                        border: `1.5px solid ${isActive ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)"}`,
                        backdropFilter: "blur(8px)",
                        opacity: isActive ? 1 : 0.5,
                      }}
                    >
                      {/* Status dot */}
                      <div style={{ position: "absolute", top: 16, right: 16, width: 10, height: 10, borderRadius: "50%", background: isActive ? "#22C55E" : "#334155", boxShadow: isActive ? "0 0 8px rgba(34,197,94,0.4)" : "none" }} />

                      {/* Clickable area — enter config */}
                      <motion.div
                        whileHover={{ scale: isActive ? 1.01 : 1 }}
                        onClick={() => isActive && enterModuleConfig(ws.key)}
                        style={{ cursor: isActive ? "pointer" : "default" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <span style={{ fontSize: 28 }}>{ws.icon}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? "#F0F4FF" : "#475569" }}>{ws.title}</div>
                            <div style={{ fontSize: 10, color: "#64748B" }}>{ws.role}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", marginBottom: 14, lineHeight: 1.5 }}>{ws.desc}</div>
                      </motion.div>

                      {/* Toggle + Enter buttons */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => toggleModule(ws.key)}
                          style={{
                            flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                            cursor: "pointer", border: "none",
                            background: isActive ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)",
                            color: isActive ? "#EF4444" : "#22C55E",
                          }}>
                          {isActive ? "Remove" : "Add"}
                        </motion.button>
                        {isActive && (
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => enterModuleConfig(ws.key)}
                            style={{
                              flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                              cursor: "pointer", border: `1px solid ${COPPER}20`, background: `${COPPER}06`, color: COPPER_LIGHT,
                            }}>
                            Configure →
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Utility stations */}
              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#475569", marginBottom: 14 }}>Utility Stations (Always Active)</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {UTILITY_STATIONS.map(ws => (
                    <motion.div key={ws.key} whileHover={{ scale: 1.01 }} onClick={() => enterModuleConfig(ws.key)}
                      style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(34,197,94,0.03)", border: "1px solid rgba(34,197,94,0.1)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", position: "relative" }}>
                      <div style={{ position: "absolute", top: 12, right: 14, width: 8, height: 8, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 6px rgba(34,197,94,0.4)" }} />
                      <span style={{ fontSize: 20 }}>{ws.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8" }}>{ws.title}</div>
                        <div style={{ fontSize: 10, color: "#475569" }}>{ws.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* SCREEN 3: MODULE CONFIGURATION          */}
          {/* ═══════════════════════════════════════ */}
          {screen === "module-config" && configWs && (
            <motion.div key="module-config" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <span style={{ fontSize: 40 }}>{configWs.icon}</span>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 4 }}>Module Configuration</div>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>{configWs.title}</h2>
                    <p style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{configWs.desc} — Managed by {configWs.role}</p>
                  </div>
                </div>
              </div>

              {/* Hospital selector for this module */}
              <div style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}10`, marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", whiteSpace: "nowrap" }}>Hospital</div>
                <select value={selectedHospital} onChange={e => setSelectedHospital(e.target.value)}
                  style={{ flex: 1, ...inputStyle }}>
                  <option value="" style={{ background: "#0a0a14" }}>Select A Hospital To Configure Operators</option>
                  {hospitals.map(h => <option key={h.id} value={h.code} style={{ background: "#0a0a14" }}>{h.name} ({h.code})</option>)}
                </select>
              </div>

              {selectedHospital ? (
                <>
                  {/* Add operator form */}
                  <div style={{ padding: "24px", borderRadius: 18, marginBottom: 24, background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}10` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COPPER_LIGHT, marginBottom: 18 }}>
                      Add Operator To {configWs.title}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 1fr auto", gap: 12, alignItems: "end" }}>
                      <div>
                        <label style={labelStyle}>Full Name</label>
                        <input placeholder="e.g. Ama Mensah" value={newOp.name} onChange={e => setNewOp(o => ({ ...o, name: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Phone (Optional)</label>
                        <input placeholder="0244123456" value={newOp.phone} onChange={e => setNewOp(o => ({ ...o, phone: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>PIN</label>
                        <input placeholder="4 digits" type="password" maxLength={4} value={newOp.pin}
                          onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setNewOp(o => ({ ...o, pin: e.target.value })); }}
                          style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.3em", fontFamily: "var(--font-jetbrains-mono), monospace" }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Role</label>
                        <select value={newOp.role} onChange={e => setNewOp(o => ({ ...o, role: e.target.value }))} style={{ ...inputStyle, appearance: "none" }}>
                          {(() => {
                            const relevant = ROLE_OPTIONS.filter(r => configModule && r.modules.includes(configModule));
                            const others = ROLE_OPTIONS.filter(r => !configModule || !r.modules.includes(configModule));
                            return (<>
                              {relevant.map(r => <option key={r.value} value={r.value} style={{ background: "#0a0a14" }}>{r.label}</option>)}
                              {relevant.length > 0 && others.length > 0 && <option disabled style={{ background: "#0a0a14" }}>──────────</option>}
                              {others.map(r => <option key={r.value} value={r.value} style={{ background: "#0a0a14" }}>{r.label}</option>)}
                            </>);
                          })()}
                        </select>
                      </div>
                      <motion.button onClick={handleAddOperator} disabled={addingOp || !newOp.name || newOp.pin.length !== 4}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        style={{ padding: "12px 20px", borderRadius: 10, cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, opacity: addingOp || !newOp.name || newOp.pin.length !== 4 ? 0.4 : 1, whiteSpace: "nowrap" }}>
                        {addingOp ? "Adding..." : "Add"}
                      </motion.button>
                    </div>
                    {opMsg && <div style={{ marginTop: 12, fontSize: 11, fontWeight: 600, color: opMsg.type === "ok" ? "#22C55E" : "#EF4444" }}>{opMsg.text}</div>}
                  </div>

                  {/* Operator list */}
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", marginBottom: 12 }}>
                    {operators.length} Operator{operators.length !== 1 ? "s" : ""} At {selectedHospital}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {operators.map((op, i) => (
                      <motion.div key={op.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${op.isActive ? "rgba(255,255,255,0.04)" : "rgba(239,68,68,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: op.isActive ? 1 : 0.5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: op.isActive ? "#22C55E" : "#EF4444", boxShadow: op.isActive ? "0 0 6px rgba(34,197,94,0.3)" : "none" }} />
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#F0F4FF" }}>{op.name}</span>
                            {op.phone && <span style={{ fontSize: 11, color: "#475569", marginLeft: 8 }}>{op.phone}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ padding: "3px 10px", borderRadius: 6, background: `${BLUE}10`, border: `1px solid ${BLUE}20`, fontSize: 10, fontWeight: 700, color: BLUE, textTransform: "uppercase", letterSpacing: "0.06em" }}>{op.role.replace(/_/g, " ")}</span>
                          {op.lastLoginAt && <span style={{ fontSize: 10, color: "#475569", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{new Date(op.lastLoginAt).toLocaleDateString("en-GB")}</span>}
                          <motion.button whileHover={{ scale: 1.08 }} onClick={() => { setEditOp(op); setEditOpForm({ name: op.name, phone: op.phone || "", role: op.role, newPin: "" }); setEditOpMsg(null); }}
                            style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: `${COPPER}08`, border: `1px solid ${COPPER}15`, color: COPPER_LIGHT, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Edit</motion.button>
                          <motion.button whileHover={{ scale: 1.08 }} onClick={() => handleToggleOperator(op)}
                            style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: op.isActive ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)", border: `1px solid ${op.isActive ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)"}`, color: op.isActive ? "#EF4444" : "#22C55E", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
                            {op.isActive ? "Deactivate" : "Activate"}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Edit operator modal */}
                  <AnimatePresence>
                    {editOp && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditOp(null)}
                        style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                          onClick={e => e.stopPropagation()}
                          style={{ background: "rgba(10,10,20,0.95)", border: `1px solid ${COPPER}15`, borderRadius: 24, padding: "36px 40px", minWidth: 420, backdropFilter: "blur(24px)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 6 }}>Edit Operator</div>
                              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif", margin: 0 }}>{editOp.name}</h3>
                            </div>
                            <motion.button whileHover={{ scale: 1.1 }} onClick={() => setEditOp(null)} style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748B", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</motion.button>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div><label style={labelStyle}>Full Name</label><input value={editOpForm.name} onChange={e => setEditOpForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Phone</label><input value={editOpForm.phone} onChange={e => setEditOpForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Role</label><select value={editOpForm.role} onChange={e => setEditOpForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, appearance: "none" }}>{ROLE_OPTIONS.map(r => <option key={r.value} value={r.value} style={{ background: "#0a0a14" }}>{r.label}</option>)}</select></div>
                            <div><label style={{ ...labelStyle, color: "#EF4444" }}>Reset PIN (Leave Blank To Keep)</label><input value={editOpForm.newPin} onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setEditOpForm(f => ({ ...f, newPin: e.target.value })); }} placeholder="••••" type="password" maxLength={4} style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.3em", fontFamily: "var(--font-jetbrains-mono), monospace", background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.12)" }} /></div>
                          </div>
                          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                            <motion.button whileHover={{ scale: 1.02 }} onClick={handleEditOperator} style={{ flex: 1, padding: "12px 0", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none" }}>Save Changes</motion.button>
                            <motion.button whileHover={{ scale: 1.02 }} onClick={() => setEditOp(null)} style={{ padding: "12px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#64748B", cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>Cancel</motion.button>
                          </div>
                          {editOpMsg && <div style={{ marginTop: 12, fontSize: 11, fontWeight: 600, textAlign: "center", color: editOpMsg.type === "ok" ? "#22C55E" : "#EF4444" }}>{editOpMsg.text}</div>}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#334155", fontSize: 14, fontWeight: 600 }}>
                  Select A Hospital Above To Configure Operators For This Module
                </div>
              )}

              {/* Back button */}
              <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
                <motion.button whileHover={{ scale: 1.03 }} onClick={() => {
                  if (detailHospital) { setScreen("hospital-detail"); setConfigModule(null); }
                  else { setScreen("modules"); setConfigModule(null); }
                }}
                  style={{ padding: "12px 32px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#64748B", cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  ← Back To {detailHospital ? detailHospital.name : "Modules"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* SCREEN 4: HOSPITALS (Create + Assign)  */}
          {/* ═══════════════════════════════════════ */}
          {screen === "hospitals" && (
            <motion.div key="hospitals" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>Hospital Management</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Hospitals & Groups</h2>
              </div>

              {/* Create hospital */}
              <div style={{ padding: "28px 24px", borderRadius: 20, marginBottom: 28, background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}12` }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COPPER_LIGHT, marginBottom: 20 }}>Create Hospital{selectedTier ? ` (${selectedTier} — ${activeModules.length} Modules)` : ""}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div><label style={labelStyle}>Hospital Code</label><input placeholder="e.g. KBH" value={newHospital.code} onChange={e => setNewHospital(h => ({ ...h, code: e.target.value.toUpperCase() }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Hospital Name</label><input placeholder="e.g. Korle Bu Teaching Hospital" value={newHospital.name} onChange={e => setNewHospital(h => ({ ...h, name: e.target.value }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Subdomain</label><input placeholder="e.g. korlebu" value={newHospital.subdomain} onChange={e => setNewHospital(h => ({ ...h, subdomain: e.target.value.toLowerCase() }))} style={inputStyle} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12 }}>
                  <div><label style={labelStyle}>Tagline (Optional)</label><input placeholder="Worlds Best Hospital" value={newHospital.tagline} onChange={e => setNewHospital(h => ({ ...h, tagline: e.target.value }))} style={inputStyle} /></div>
                  <div>
                    <label style={labelStyle}>Tier</label>
                    <select value={selectedTier || "T1"} onChange={e => { setSelectedTier(e.target.value as TierKey); setActiveModules([...TIER_DEFAULTS[e.target.value as TierKey].modules]); }}
                      style={{ ...inputStyle, appearance: "none" }}>
                      {(["T1", "T2", "T3", "T4"] as const).map(t => <option key={t} value={t} style={{ background: "#0a0a14" }}>{t} — {TIER_DEFAULTS[t].label}</option>)}
                    </select>
                  </div>
                  <motion.button onClick={handleAddHospital} disabled={addingHospital || !newHospital.code || !newHospital.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{ padding: "12px 24px", borderRadius: 12, cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, opacity: addingHospital || !newHospital.code ? 0.5 : 1, alignSelf: "end", whiteSpace: "nowrap" }}>
                    {addingHospital ? "Creating..." : "Create Hospital"}
                  </motion.button>
                </div>
                {hospitalMsg && <div style={{ marginTop: 12, fontSize: 11, fontWeight: 600, color: hospitalMsg.type === "ok" ? "#22C55E" : "#EF4444" }}>{hospitalMsg.text}</div>}
              </div>

              {/* Create group */}
              <div style={{ padding: "24px", borderRadius: 18, marginBottom: 28, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", marginBottom: 16 }}>Create Group Folder</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 100px auto", gap: 12, alignItems: "end" }}>
                  <div><label style={labelStyle}>Group Code</label><input placeholder="e.g. GHS" value={newGroup.groupCode} onChange={e => setNewGroup(g => ({ ...g, groupCode: e.target.value.toUpperCase() }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Group Name</label><input placeholder="e.g. Ghana Health Service" value={newGroup.name} onChange={e => setNewGroup(g => ({ ...g, name: e.target.value }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Owner Name</label><input placeholder="e.g. Dr. Mensah" value={newGroup.ownerName} onChange={e => setNewGroup(g => ({ ...g, ownerName: e.target.value }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Owner PIN</label><input placeholder="4 digits" type="password" maxLength={4} value={newGroup.ownerPin} onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setNewGroup(g => ({ ...g, ownerPin: e.target.value })); }} style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.3em" }} /></div>
                  <motion.button onClick={handleCreateGroup} disabled={creatingGroup || !newGroup.groupCode || !newGroup.name} whileHover={{ scale: 1.03 }}
                    style={{ padding: "12px 18px", borderRadius: 10, cursor: "pointer", background: `${COPPER}15`, border: `1px solid ${COPPER}20`, color: COPPER_LIGHT, fontWeight: 700, fontSize: 12, opacity: creatingGroup ? 0.5 : 1, whiteSpace: "nowrap" }}>
                    {creatingGroup ? "..." : "Create"}
                  </motion.button>
                </div>
                {groupMsg && <div style={{ marginTop: 10, fontSize: 11, fontWeight: 600, color: groupMsg.type === "ok" ? "#22C55E" : "#EF4444" }}>{groupMsg.text}</div>}
              </div>

              {/* Hospital card grid */}
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", marginBottom: 18 }}>
                {hospitals.length} Registered Hospital{hospitals.length !== 1 ? "s" : ""}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {/* Group cluster cards */}
                {grouped.groups.map((g, gi) => {
                  const isOpen = !collapsedGroups.has(g.groupCode);
                  const totalPatientsInGroup = g.hospitals.reduce((s, h) => s + h._count.patientRecords, 0);
                  const totalModulesInGroup = g.hospitals.reduce((s, h) => s + (h.activeModules || []).length, 0);
                  const allActive = g.hospitals.every(h => h.active);
                  return (
                    <motion.div key={g.groupCode} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.06 }}
                      style={{ gridColumn: isOpen ? "1 / -1" : undefined, borderRadius: 20, background: "rgba(255,255,255,0.02)", border: `1.5px solid ${COPPER}18`, overflow: "hidden", position: "relative" }}>
                      {/* Accent line */}
                      <div style={{ position: "absolute", bottom: 0, left: "8%", right: "8%", height: 3, borderRadius: "3px 3px 0 0", background: `linear-gradient(90deg, ${COPPER}, ${COPPER_LIGHT})` }} />

                      {/* Cluster header — clickable to expand */}
                      <motion.div whileHover={{ backgroundColor: "rgba(184,115,51,0.04)" }}
                        onClick={() => setCollapsedGroups(prev => { const next = new Set(prev); if (next.has(g.groupCode)) next.delete(g.groupCode); else next.add(g.groupCode); return next; })}
                        style={{ padding: "24px 24px 20px", cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                          <div>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COPPER} strokeWidth="1.5" style={{ marginBottom: 10 }}>
                              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                            </svg>
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COPPER_LIGHT }}>Cluster · {g.hospitals.length} Branch{g.hospitals.length > 1 ? "es" : ""}</span>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif", marginBottom: 4 }}>{g.groupName}</div>
                        <div style={{ fontSize: 11, color: "#64748B", marginBottom: 16 }}>{g.groupCode} · {totalPatientsInGroup.toLocaleString()} Total Patients · {totalModulesInGroup} Modules</div>

                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          {g.hospitals.map(h => (
                            <div key={h.code} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: h.active ? "#22C55E" : "#EF4444" }} />
                              <span style={{ fontSize: 9, fontWeight: 700, color: "#4A5568", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{h.code}</span>
                            </div>
                          ))}
                          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: allActive ? "#22C55E" : "#F59E0B", boxShadow: allActive ? "0 0 6px rgba(34,197,94,0.3)" : "none" }} />
                            <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Expanded branch cards */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                            style={{ overflow: "hidden", borderTop: `1px solid ${COPPER}10` }}>
                            <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                              {g.hospitals.map((h, i) => {
                                const hTierColor = ({ T1: "#22C55E", T2: BLUE, T3: COPPER, T4: "#A855F7" } as Record<string, string>)[h.tier] || COPPER;
                                return (
                                  <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    whileHover={{ scale: 1.01, borderColor: `${hTierColor}40` }}
                                    onClick={() => enterHospitalDetail(h)}
                                    style={{ padding: "20px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.05)`, cursor: "pointer", position: "relative", overflow: "hidden" }}>
                                    <div style={{ position: "absolute", bottom: 0, left: "10%", right: "10%", height: 2, borderRadius: "2px 2px 0 0", background: hTierColor, opacity: 0.5 }} />
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                      <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, color: COPPER, background: `${COPPER}08`, border: `1px solid ${COPPER}12`, fontFamily: "var(--font-jetbrains-mono), monospace" }}>{h.code}</span>
                                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: hTierColor }}>{h.tier} — {TIER_DEFAULTS[h.tier as TierKey]?.label || h.tier}</span>
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif", marginBottom: 4 }}>{h.name}</div>
                                    <div style={{ fontSize: 10, color: "#4A5568", marginBottom: 12 }}>{h._count.patientRecords} Patients · {(h.activeModules || []).length} Modules · {h._count.devices} Devices</div>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: h.active ? "#22C55E" : "#EF4444", boxShadow: h.active ? "0 0 5px rgba(34,197,94,0.3)" : "none" }} />
                                        <span style={{ fontSize: 9, fontWeight: 700, color: h.active ? "#22C55E" : "#EF4444", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h.active ? "Active" : "Suspended"}</span>
                                      </div>
                                      <motion.button whileHover={{ scale: 1.1 }} onClick={(e) => { e.stopPropagation(); handleUnlinkHospital(h.code); }}
                                        style={{ padding: "2px 6px", borderRadius: 4, fontSize: 8, fontWeight: 700, color: "#475569", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", textTransform: "uppercase" }}>Unlink</motion.button>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                            {/* Link hospital to group */}
                            <div style={{ padding: "8px 20px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                              <select onChange={e => { if (e.target.value) handleLinkHospital(g.groupCode, e.target.value); e.target.value = ""; }}
                                style={{ ...inputStyle, padding: "6px 10px", fontSize: 10, maxWidth: 300 }}>
                                <option value="">+ Add Hospital To Cluster</option>
                                {grouped.standalone.map(h => <option key={h.code} value={h.code} style={{ background: "#0a0a14" }}>{h.code} — {h.name}</option>)}
                              </select>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}

                {/* Standalone hospital cards */}
                {grouped.standalone.map((h, i) => {
                  const tierColor = ({ T1: "#22C55E", T2: BLUE, T3: COPPER, T4: "#A855F7" } as Record<string, string>)[h.tier] || COPPER;
                  return (
                    <motion.div key={h.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (grouped.groups.length + i) * 0.06 }}
                      whileHover={{ scale: 1.01, borderColor: `${tierColor}35` }}
                      onClick={() => enterHospitalDetail(h)}
                      style={{ padding: "24px", borderRadius: 20, background: "rgba(255,255,255,0.02)", border: `1.5px solid rgba(255,255,255,0.05)`, cursor: "pointer", position: "relative", overflow: "hidden", transition: "border-color 0.25s" }}>
                      {/* Accent line */}
                      <div style={{ position: "absolute", bottom: 0, left: "8%", right: "8%", height: 3, borderRadius: "3px 3px 0 0", background: tierColor, opacity: 0.6 }} />

                      {/* Top: code badge + tier label */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800, color: COPPER, background: `${COPPER}08`, border: `1px solid ${COPPER}15`, fontFamily: "var(--font-jetbrains-mono), monospace" }}>{h.code}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: tierColor }}>{h.tier} — {TIER_DEFAULTS[h.tier as TierKey]?.label || h.tier}</span>
                      </div>

                      {/* Name */}
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif", marginBottom: 4 }}>{h.name}</div>

                      {/* Description line */}
                      <div style={{ fontSize: 11, color: "#64748B", marginBottom: 18 }}>
                        {h.tagline || `${h.subdomain}.health.dalxic.com`}
                      </div>

                      {/* Stats row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                        {[
                          { label: "Patients", value: h._count.patientRecords, color: BLUE },
                          { label: "Modules", value: (h.activeModules || []).length, color: COPPER_LIGHT },
                          { label: "Devices", value: h._count.devices, color: "#22C55E" },
                        ].map(stat => (
                          <div key={stat.label} style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                            <span style={{ fontSize: 18, fontWeight: 800, color: stat.color, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>{stat.value}</span>
                            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568" }}>{stat.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Status + action */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: h.active ? "#22C55E" : "#EF4444", boxShadow: h.active ? "0 0 6px rgba(34,197,94,0.3)" : "none" }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: h.active ? "#22C55E" : "#EF4444", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h.active ? "Active" : "Suspended"}</span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* SCREEN: HOSPITAL DETAIL — Module Grid  */}
          {/* ═══════════════════════════════════════ */}
          {screen === "hospital-detail" && detailHospital && (
            <motion.div key="hospital-detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>

              {/* Header bar */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>Module Configuration</div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif", letterSpacing: "-0.02em", margin: 0 }}>{detailHospital.name}</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                    <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${({ T1: "#22C55E", T2: BLUE, T3: COPPER, T4: "#A855F7" } as Record<string, string>)[detailHospital.tier] || COPPER}10`, border: `1px solid ${({ T1: "#22C55E", T2: BLUE, T3: COPPER, T4: "#A855F7" } as Record<string, string>)[detailHospital.tier] || COPPER}25`, color: ({ T1: "#22C55E", T2: BLUE, T3: COPPER, T4: "#A855F7" } as Record<string, string>)[detailHospital.tier] || COPPER, textTransform: "uppercase", letterSpacing: "0.06em" }}>{detailHospital.tier} — {TIER_DEFAULTS[detailHospital.tier as TierKey]?.label || detailHospital.tier}</span>
                    <span style={{ fontSize: 11, color: "#64748B", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{detailHospital.code}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: detailHospital.active ? "#22C55E" : "#EF4444", boxShadow: detailHospital.active ? "0 0 8px rgba(34,197,94,0.4)" : "none" }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: detailHospital.active ? "#22C55E" : "#EF4444", textTransform: "uppercase", letterSpacing: "0.08em" }}>{detailHospital.active ? "Active" : "Suspended"}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>{(detailHospital.activeModules || []).length} modules active. Click any module to configure operators and access.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button whileHover={{ scale: 1.04 }}
                    onClick={() => handleDetailToggleModule("__select_all__")}
                    style={{ padding: "8px 16px", borderRadius: 8, fontSize: 10, fontWeight: 700, color: COPPER_LIGHT, background: `${COPPER}08`, border: `1px solid ${COPPER}18`, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Select All
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.04 }}
                    onClick={() => handleDetailToggleModule("__deselect_all__")}
                    style={{ padding: "8px 16px", borderRadius: 8, fontSize: 10, fontWeight: 700, color: "#64748B", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Deselect All
                  </motion.button>
                </div>
              </div>

              {/* Module cards — 3 column grid, clickable to enter operator config */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {(() => {
                  const hospitalModules = (detailHospital.activeModules || []) as string[];
                  return [...ALL_WORKSTATIONS, ...UTILITY_STATIONS].map((ws, i) => {
                    const isActive = hospitalModules.includes(ws.key);
                    return (
                      <motion.button key={ws.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                        whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                        onClick={() => openModulePopup(ws.key)}
                        style={{
                          textAlign: "left", cursor: "pointer", padding: "20px 22px", borderRadius: 18,
                          background: isActive ? "rgba(34,197,94,0.03)" : "rgba(255,255,255,0.01)",
                          border: `1.5px solid ${isActive ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)"}`,
                          position: "relative", overflow: "hidden",
                        }}>
                        {/* Accent line at bottom */}
                        <div style={{ position: "absolute", bottom: 0, left: "10%", right: "10%", height: 2, borderRadius: "2px 2px 0 0", background: isActive ? `linear-gradient(90deg, transparent, ${COPPER}60, transparent)` : "transparent" }} />

                        {/* Top row: icon + role badge */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                          <span style={{ fontSize: 28 }}>{ws.icon}</span>
                          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: isActive ? COPPER_LIGHT : "#4A5568" }}>{ws.role}</span>
                        </div>

                        {/* Title */}
                        <div style={{ fontSize: 15, fontWeight: 800, color: isActive ? "#F0F4FF" : "#475569", fontFamily: "var(--font-outfit), Outfit, sans-serif", marginBottom: 4 }}>{ws.title}</div>
                        <div style={{ fontSize: 11, color: isActive ? "#64748B" : "#334155", lineHeight: 1.5 }}>{ws.desc}</div>

                        {/* Status dot + toggle */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: isActive ? "#22C55E" : "#334155", boxShadow: isActive ? "0 0 6px rgba(34,197,94,0.3)" : "none" }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? "#22C55E" : "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{isActive ? "Active" : "Inactive"}</span>
                          </div>
                          <motion.span
                            whileHover={{ scale: 1.1 }}
                            onClick={(e) => { e.stopPropagation(); handleDetailToggleModule(ws.key); }}
                            style={{ padding: "3px 10px", borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer", background: isActive ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", color: isActive ? "#EF4444" : "#22C55E" }}>
                            {isActive ? "Disable" : "Enable"}
                          </motion.span>
                        </div>
                      </motion.button>
                    );
                  });
                })()}
              </div>

              {/* ── Module Config Popup ── */}
              <AnimatePresence>
                {modulePopup && (() => {
                  const popupWs = [...ALL_WORKSTATIONS, ...UTILITY_STATIONS].find(w => w.key === modulePopup);
                  if (!popupWs) return null;
                  const popupColor = (detailHospital.activeModules as string[] || []).includes(modulePopup) ? COPPER : "#475569";
                  return (
                    <motion.div key="module-popup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setModulePopup(null)}
                      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <motion.div initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                          background: "rgba(10,10,20,0.97)", borderRadius: 28, width: 480, maxHeight: "85vh", overflow: "auto",
                          border: `1px solid ${popupColor}20`, position: "relative",
                          boxShadow: `0 32px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.03)`,
                        }}>
                        {/* Top accent glow — pricing card style */}
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "28px 28px 0 0", background: `linear-gradient(90deg, ${COPPER}, ${popupColor}, ${COPPER}40)` }} />
                        {/* Side accent strips */}
                        <div style={{ position: "absolute", top: 20, left: 0, width: 3, height: 60, borderRadius: "0 3px 3px 0", background: `linear-gradient(180deg, ${COPPER}, transparent)` }} />
                        <div style={{ position: "absolute", top: 20, right: 0, width: 3, height: 60, borderRadius: "3px 0 0 3px", background: `linear-gradient(180deg, ${COPPER}, transparent)` }} />

                        <div style={{ padding: "32px 28px 28px" }}>
                          {/* Close button */}
                          <motion.button whileHover={{ scale: 1.1 }} onClick={() => setModulePopup(null)}
                            style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748B", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>✕</motion.button>

                          {/* Module icon + title */}
                          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                            <span style={{ fontSize: 36 }}>{popupWs.icon}</span>
                            <div>
                              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 4 }}>{popupWs.role}</div>
                              <div style={{ fontSize: 22, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>{popupWs.title}</div>
                              <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{popupWs.desc}</div>
                            </div>
                          </div>

                          {/* Locked hospital */}
                          <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}10`, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COPPER} strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#F0F4FF" }}>{detailHospital.name}</span>
                            <span style={{ fontSize: 10, color: "#475569", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{detailHospital.code}</span>
                          </div>

                          {/* Add operator form — no Role dropdown */}
                          <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: COPPER_LIGHT, marginBottom: 14 }}>
                              Add Operator To {popupWs.title}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              <div>
                                <label style={labelStyle}>Full Name</label>
                                <input placeholder="e.g. Ama Mensah" value={popupOp.name} onChange={e => setPopupOp(o => ({ ...o, name: e.target.value }))} style={inputStyle} />
                              </div>
                              <div>
                                <label style={labelStyle}>Phone (Optional)</label>
                                <input placeholder="0244123456" value={popupOp.phone} onChange={e => setPopupOp(o => ({ ...o, phone: e.target.value }))} style={inputStyle} />
                              </div>
                              <div>
                                <label style={labelStyle}>PIN</label>
                                <input placeholder="4 digits" type="password" maxLength={4} value={popupOp.pin}
                                  onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setPopupOp(o => ({ ...o, pin: e.target.value })); }}
                                  style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.3em", fontFamily: "var(--font-jetbrains-mono), monospace" }} />
                              </div>
                              <motion.button onClick={handlePopupAddOperator} disabled={popupAdding || !popupOp.name || popupOp.pin.length !== 4}
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                style={{ padding: "12px 0", borderRadius: 12, cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, opacity: popupAdding || !popupOp.name || popupOp.pin.length !== 4 ? 0.4 : 1, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                {popupAdding ? "Adding..." : "Add"}
                              </motion.button>
                            </div>
                            {popupMsg && <div style={{ marginTop: 10, fontSize: 11, fontWeight: 600, color: popupMsg.type === "ok" ? "#22C55E" : "#EF4444" }}>{popupMsg.text}</div>}
                          </div>

                          {/* Operator list */}
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", marginBottom: 10 }}>
                            {popupOperators.length} Operator{popupOperators.length !== 1 ? "s" : ""} At {detailHospital.code}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {popupOperators.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#334155", fontSize: 12 }}>No Operators Registered Yet</div>}
                            {popupOperators.map((op, i) => (
                              <motion.div key={op.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                                style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${op.isActive ? "rgba(255,255,255,0.04)" : "rgba(239,68,68,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: op.isActive ? 1 : 0.5 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: op.isActive ? "#22C55E" : "#EF4444" }} />
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "#F0F4FF" }}>{op.name}</span>
                                  {op.phone && <span style={{ fontSize: 10, color: "#475569" }}>{op.phone}</span>}
                                </div>
                                <span style={{ padding: "2px 8px", borderRadius: 5, background: `${BLUE}10`, border: `1px solid ${BLUE}18`, fontSize: 9, fontWeight: 700, color: BLUE, textTransform: "uppercase" }}>{op.role.replace(/_/g, " ")}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              {/* Back button */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
                <motion.button whileHover={{ scale: 1.03 }} onClick={() => { setScreen("hospitals"); setDetailHospital(null); }}
                  style={{ padding: "12px 32px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#64748B", cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  ← Back To Hospitals
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* SCREEN 5: MONITORING                   */}
          {/* ═══════════════════════════════════════ */}
          {screen === "monitoring" && (
            <motion.div key="monitoring" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>Live Dashboard</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Monitoring</h2>
              </div>

              {/* Summary stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 }}>
                {[
                  { icon: "🏥", label: "Hospitals", value: hospitals.length, color: COPPER },
                  { icon: "👤", label: "Total Patients", value: totalPatients.toLocaleString(), color: BLUE },
                  { icon: "📱", label: "Operators Online", value: `${onlineOps} / ${totalDevices}`, color: onlineOps > 0 ? "#22C55E" : "#64748B" },
                  { icon: "📂", label: "Groups", value: grouped.groups.length, color: COPPER_LIGHT },
                ].map(s => (
                  <div key={s.label} style={{ padding: "24px 20px", borderRadius: 18, background: "rgba(255,255,255,0.02)", border: `1px solid ${s.color}12` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 20 }}>{s.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B" }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Group selector for dashboard */}
              {grouped.groups.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", marginBottom: 8 }}>Group Dashboard</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {grouped.groups.map(g => (
                      <motion.button key={g.groupCode} whileHover={{ scale: 1.03 }} onClick={() => setSelectedGroup(g.groupCode)}
                        style={{ padding: "10px 18px", borderRadius: 10, cursor: "pointer", background: selectedGroup === g.groupCode ? `${COPPER}12` : "rgba(255,255,255,0.02)", border: `1px solid ${selectedGroup === g.groupCode ? COPPER + "30" : "rgba(255,255,255,0.05)"}`, color: selectedGroup === g.groupCode ? COPPER_LIGHT : "#64748B", fontSize: 12, fontWeight: 700 }}>
                        {g.groupName} ({g.hospitals.length})
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Group dashboard data */}
              {groupDashboard && (
                <div style={{ padding: "24px", borderRadius: 18, background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}10` }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: COPPER_LIGHT, marginBottom: 20, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>{groupDashboard.group.name}</div>

                  {/* Totals */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                    {[
                      { label: "Total Patients", value: groupDashboard.totals.patients },
                      { label: "Today", value: groupDashboard.totals.todayPatients },
                      { label: "Operators", value: groupDashboard.totals.operators },
                      { label: "Branches", value: groupDashboard.totals.branches },
                    ].map(t => (
                      <div key={t.label} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: BLUE, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>{t.value}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748B", marginTop: 4 }}>{t.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Branch breakdown */}
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", marginBottom: 10 }}>Branch Breakdown</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {groupDashboard.branches.map(b => (
                      <div key={b.code} style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: COPPER, fontFamily: "var(--font-jetbrains-mono), monospace" }}>{b.code}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0" }}>{b.name}</span>
                          <span style={{ padding: "2px 6px", borderRadius: 4, background: `${BLUE}10`, fontSize: 9, fontWeight: 700, color: BLUE }}>{b.tier}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11, color: "#64748B" }}>
                          <span>{b.totalPatients} patients</span>
                          <span>{b.todayPatients} today</span>
                          <span>{b.operators} ops</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-hospital quick stats (if no group selected) */}
              {!groupDashboard && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {hospitals.map(h => (
                    <div key={h.id} style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: h.active ? "#22C55E" : "#EF4444" }} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: COPPER, fontFamily: "var(--font-jetbrains-mono), monospace" }}>{h.code}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>{h.name}</span>
                        <span style={{ padding: "2px 6px", borderRadius: 4, background: `${BLUE}10`, fontSize: 9, fontWeight: 700, color: BLUE }}>{h.tier}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11, color: "#64748B" }}>
                        <span>{h._count.patientRecords} patients</span>
                        <span>{h._count.devices} devices</span>
                        <span>{(h.activeModules || []).length} modules</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* SCREEN 6: AUDIT TRAIL                  */}
          {/* ═══════════════════════════════════════ */}
          {screen === "audit" && (
            <motion.div key="audit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>System Records</div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Audit Trail</h2>
                  <p style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>Immutable log. Cannot be edited or deleted by any user level.</p>
                </div>
                <motion.button whileHover={{ scale: 1.03 }} onClick={handleExportAuditCSV}
                  style={{ padding: "10px 20px", borderRadius: 10, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: COPPER_LIGHT, background: `${COPPER}08`, border: `1px solid ${COPPER}15`, cursor: "pointer" }}>Export CSV</motion.button>
              </div>

              {/* Filters */}
              <div style={{ padding: "16px 20px", borderRadius: 14, marginBottom: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
                <div><label style={labelStyle}>Hospital</label><select value={auditFilter.hospitalCode} onChange={e => setAuditFilter(f => ({ ...f, hospitalCode: e.target.value }))} style={{ ...inputStyle, padding: "8px 10px", fontSize: 11 }}><option value="">All</option>{hospitals.map(h => <option key={h.code} value={h.code}>{h.code}</option>)}</select></div>
                <div><label style={labelStyle}>Actor Type</label><select value={auditFilter.actorType} onChange={e => setAuditFilter(f => ({ ...f, actorType: e.target.value }))} style={{ ...inputStyle, padding: "8px 10px", fontSize: 11 }}><option value="">All</option><option value="operator">Operator</option><option value="dalxic_super_admin">Super Admin</option><option value="system">System</option></select></div>
                <div><label style={labelStyle}>Action</label><input value={auditFilter.action} onChange={e => setAuditFilter(f => ({ ...f, action: e.target.value }))} placeholder="e.g. login" style={{ ...inputStyle, padding: "8px 10px", fontSize: 11 }} /></div>
                <div><label style={labelStyle}>From</label><input type="date" value={auditFilter.startDate} onChange={e => setAuditFilter(f => ({ ...f, startDate: e.target.value }))} style={{ ...inputStyle, padding: "8px 10px", fontSize: 11, colorScheme: "dark" }} /></div>
                <div><label style={labelStyle}>To</label><input type="date" value={auditFilter.endDate} onChange={e => setAuditFilter(f => ({ ...f, endDate: e.target.value }))} style={{ ...inputStyle, padding: "8px 10px", fontSize: 11, colorScheme: "dark" }} /></div>
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => loadAuditLogs()} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "white", cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none" }}>Search</motion.button>
              </div>

              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#475569", marginBottom: 10 }}>{auditLogs.length} Records</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {auditLogs.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "#475569", fontSize: 13 }}>No audit logs match your filters</div>}
                {auditLogs.map(log => {
                  const isEmergency = log.action.includes("emergency");
                  return (
                    <div key={log.id} style={{ padding: "10px 14px", borderRadius: 10, background: isEmergency ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.015)", border: `1px solid ${isEmergency ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)"}`, display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", marginTop: 5, background: isEmergency ? "#EF4444" : log.action.includes("login") ? "#22C55E" : log.action.includes("created") ? COPPER : "#64748B", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{log.action}</span>
                          <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: "#64748B" }}>{log.actorType}</span>
                          {log.hospital && <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: `${COPPER}10`, color: COPPER_LIGHT }}>{log.hospital.code}</span>}
                        </div>
                        <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>Actor: {log.actorId} · IP: {log.ipAddress} · {new Date(log.timestamp).toLocaleString()}</div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && <div style={{ fontSize: 9, color: "#334155", marginTop: 2, fontFamily: "var(--font-jetbrains-mono), monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{JSON.stringify(log.metadata)}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* SCREEN 7: ACCESS GRANTS                */}
          {/* ═══════════════════════════════════════ */}
          {screen === "access" && (
            <motion.div key="access" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>Staff Access Control</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Access Grants</h2>
              </div>

              <div style={{ padding: "24px 20px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}10`, marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COPPER_LIGHT, marginBottom: 14 }}>Grant Temporary Access</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input value={newGrant.staffId} onChange={e => setNewGrant(g => ({ ...g, staffId: e.target.value }))} placeholder="Dalxic Staff ID" style={{ ...inputStyle, padding: "9px 12px", fontSize: 12 }} />
                  <select value={newGrant.hospitalId} onChange={e => setNewGrant(g => ({ ...g, hospitalId: e.target.value }))} style={{ ...inputStyle, padding: "9px 12px", fontSize: 12 }}><option value="">Select Hospital...</option>{hospitals.map(h => <option key={h.id} value={h.id}>{h.code} — {h.name}</option>)}</select>
                  <select value={newGrant.role} onChange={e => setNewGrant(g => ({ ...g, role: e.target.value }))} style={{ ...inputStyle, padding: "9px 12px", fontSize: 12 }}><option value="viewer">Viewer (Read Only)</option><option value="support">Support (Read + Notes)</option><option value="admin">Admin (Full Access)</option></select>
                  <select value={newGrant.hours} onChange={e => setNewGrant(g => ({ ...g, hours: e.target.value }))} style={{ ...inputStyle, padding: "9px 12px", fontSize: 12 }}><option value="1">1 Hour</option><option value="4">4 Hours</option><option value="8">8 Hours</option><option value="24">24 Hours</option><option value="72">3 Days</option><option value="168">7 Days</option></select>
                </div>
                <input value={newGrant.reason} onChange={e => setNewGrant(g => ({ ...g, reason: e.target.value }))} placeholder="Reason for access grant" style={{ ...inputStyle, padding: "9px 12px", fontSize: 12, marginTop: 10 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                  <motion.button whileHover={{ scale: 1.02 }} onClick={handleCreateGrant} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "white", cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none" }}>Grant Access</motion.button>
                  {grantMsg && <span style={{ fontSize: 11, fontWeight: 600, color: grantMsg.type === "ok" ? "#22C55E" : "#F87171" }}>{grantMsg.text}</span>}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {accessGrants.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "#475569", fontSize: 13 }}>No active access grants</div>}
                {accessGrants.map(grant => {
                  const expired = new Date(grant.expiresAt) < new Date();
                  return (
                    <div key={grant.id} style={{ padding: "14px 18px", borderRadius: 12, background: expired ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)", border: `1px solid ${expired ? "rgba(239,68,68,0.12)" : `${COPPER}10`}`, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: expired ? 0.5 : 1 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
                          {grant.dalxicStaff?.name || grant.dalxicStaffId}
                          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: grant.grantedRole === "admin" ? "rgba(239,68,68,0.1)" : grant.grantedRole === "support" ? "rgba(245,158,11,0.1)" : "rgba(14,165,233,0.1)", color: grant.grantedRole === "admin" ? "#F87171" : grant.grantedRole === "support" ? "#F59E0B" : "#38BDF8" }}>{grant.grantedRole.toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{grant.hospital?.name || "All"} — {grant.reason}</div>
                        <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>Granted: {new Date(grant.grantedAt).toLocaleString()} · Expires: {new Date(grant.expiresAt).toLocaleString()}{expired && <span style={{ color: "#EF4444", fontWeight: 700 }}> · EXPIRED</span>}{grant.revokedAt && <span style={{ color: "#EF4444", fontWeight: 700 }}> · REVOKED</span>}</div>
                      </div>
                      {grant.isActive && !expired && (
                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleRevokeGrant(grant.id)}
                          style={{ padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#EF4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", cursor: "pointer" }}>Revoke</motion.button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, padding: "10px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${COPPER}06`, background: "rgba(3,5,15,0.5)", backdropFilter: "blur(12px)" }}>
        <span style={{ fontSize: 9, color: "#1E293B", letterSpacing: "0.2em", textTransform: "uppercase" }}>Dalxic — Operating Platform v2.0</span>
        <span style={{ fontSize: 9, color: "#1E293B", letterSpacing: "0.15em" }}>Classified — Authorised Personnel Only</span>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PAGE EXPORT — Gate → Platform
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function OpsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(OPS_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        if (session.authenticated && session.expiresAt > Date.now()) setAuthenticated(true);
        else sessionStorage.removeItem(OPS_KEY);
      }
    } catch { /* */ }
    setChecking(false);
  }, []);

  const handleLogout = () => { sessionStorage.removeItem(OPS_KEY); setAuthenticated(false); };
  if (checking) return null;
  return authenticated ? <OperatingPlatform onLogout={handleLogout} /> : <EncryptedGate onUnlock={() => setAuthenticated(true)} />;
}
