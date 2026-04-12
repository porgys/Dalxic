"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TIER_DEFAULTS, ALL_WORKSTATIONS, UTILITY_STATIONS, type TierKey } from "@/lib/tier-defaults";
import { COPPER, COPPER_LIGHT, BLUE, fontFamily, getStyles } from "@/hooks/use-station-theme";

/* ─── Constants ─── */
const OPS_KEY = "dalxic_ops_session";

/** Master role list — professional titles, module mapping drives contextual sorting */
const DOCTOR_SPECIALTIES = [
  { value: "general", label: "General Medicine", icon: "🩺" },
  { value: "emergency", label: "Emergency", icon: "🚑" },
  { value: "pediatrics", label: "Pediatrics", icon: "👶" },
  { value: "obstetrics", label: "OB/GYN", icon: "🤱" },
  { value: "surgery", label: "Surgery", icon: "🏥" },
  { value: "dental", label: "Dental", icon: "🦷" },
  { value: "eye", label: "Eye Clinic", icon: "👁" },
  { value: "ent", label: "ENT", icon: "👂" },
];

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

/* ─── Session type ─── */
interface OpsSession {
  authenticated: boolean;
  expiresAt: number;
  isOwner: boolean;
  staffId?: string;
  staffName?: string;
  allowedScreens?: string[];
}

/* ─── Encrypted Gate ─── */
function EncryptedGate({ onUnlock }: { onUnlock: (session: OpsSession) => void }) {
  const [mode, setMode] = useState<"owner" | "staff">("owner");
  const [passphrase, setPassphrase] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPin, setStaffPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const staffEmailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/system-config?action=ops_password_status")
      .then(r => r.json())
      .then(d => setIsFirstTime(!d.isSet))
      .catch(() => setIsFirstTime(false));
  }, []);
  useEffect(() => { if (isFirstTime !== null) { if (mode === "owner") inputRef.current?.focus(); else staffEmailRef.current?.focus(); } }, [isFirstTime, mode]);

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;
    setVerifying(true); setError(null);
    try {
      if (isFirstTime) {
        if (passphrase.length < 8) { setError("Password must be at least 8 characters"); setVerifying(false); return; }
        if (passphrase !== confirmPass) { setError("Passwords do not match"); setVerifying(false); return; }
        const res = await fetch("/api/system-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set_ops_password", password: passphrase.trim() }) });
        if (!res.ok) { setError("Failed to set password"); setVerifying(false); return; }
      } else {
        const res = await fetch("/api/system-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify_ops_password", password: passphrase.trim() }) });
        const data = await res.json();
        if (!data.valid) { setError("Access Denied — Invalid Password"); setPassphrase(""); setVerifying(false); setTimeout(() => inputRef.current?.focus(), 100); return; }
      }
      const session: OpsSession = { authenticated: true, expiresAt: Date.now() + 8 * 60 * 60 * 1000, isOwner: true };
      setUnlocked(true);
      sessionStorage.setItem(OPS_KEY, JSON.stringify(session));
      setTimeout(() => onUnlock(session), 800);
    } catch { setError("Connection error — try again"); setVerifying(false); }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail.trim() || !staffPin.trim()) return;
    setVerifying(true); setError(null);
    try {
      const res = await fetch("/api/system-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify_ops_staff", email: staffEmail.trim(), pin: staffPin.trim() }) });
      const data = await res.json();
      if (!data.valid) { setError(data.error || "Invalid credentials"); setStaffPin(""); setVerifying(false); return; }
      const session: OpsSession = { authenticated: true, expiresAt: Date.now() + 8 * 60 * 60 * 1000, isOwner: false, staffId: data.staffId, staffName: data.staffName, allowedScreens: data.allowedScreens };
      setUnlocked(true);
      sessionStorage.setItem(OPS_KEY, JSON.stringify(session));
      setTimeout(() => onUnlock(session), 800);
    } catch { setError("Connection error — try again"); setVerifying(false); }
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
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: COPPER, marginBottom: 8, fontFamily: fontFamily.primary }}>Dalxic Health</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F0F4FF", marginBottom: 6, fontFamily: fontFamily.primary, letterSpacing: "-0.02em" }}>Operating Platform</h1>
          <p style={{ fontSize: 13, color: "#4A5568", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: fontFamily.primary }}>{isFirstTime ? "First Time Setup" : "Encrypted Access Required"}</p>
        </motion.div>
        {/* Mode toggle — Owner / Staff */}
        {!isFirstTime && isFirstTime !== null && (
          <div style={{ display: "flex", gap: 0, margin: "24px auto 20px", borderRadius: 10, overflow: "hidden", border: `1px solid ${COPPER}15`, maxWidth: 280 }}>
            {(["owner", "staff"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); setPassphrase(""); setStaffEmail(""); setStaffPin(""); }}
                style={{ flex: 1, padding: "10px 0", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", border: "none", fontFamily: fontFamily.primary, background: mode === m ? `${COPPER}15` : "transparent", color: mode === m ? COPPER_LIGHT : "#475569", transition: "all 0.2s" }}>
                {m === "owner" ? "🔐 Owner" : "👤 Staff"}
              </button>
            ))}
          </div>
        )}
        <div style={{ width: 48, height: 1, background: `linear-gradient(90deg, transparent, ${COPPER}25, transparent)`, margin: "0 auto 20px" }} />
        {isFirstTime === null ? (
          <div style={{ padding: 20, textAlign: "center", color: "#64748B", fontSize: 12 }}>Checking...</div>
        ) : mode === "owner" || isFirstTime ? (
        <motion.form onSubmit={handleOwnerSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} key="owner-form">
          {isFirstTime && <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(184,115,51,0.06)", border: `1px solid ${COPPER}15`, fontSize: 13, color: COPPER_LIGHT, fontWeight: 500 }}>Create your master password to secure the Ops platform.</div>}
          <div style={{ position: "relative", marginBottom: isFirstTime ? 12 : 20 }}>
            <input ref={inputRef} type="password" value={passphrase} onChange={e => { setPassphrase(e.target.value); setError(null); }} placeholder={isFirstTime ? "Create Password (8+ Characters)" : "Enter Owner Password"} disabled={verifying && !error} autoComplete="off" spellCheck={false}
              style={{ width: "100%", padding: "16px 20px 16px 48px", borderRadius: 14, fontSize: 14, fontWeight: 500, color: "#E2E8F0", letterSpacing: "0.04em", background: "rgba(255,255,255,0.03)", border: `1.5px solid ${error ? "rgba(239,68,68,0.4)" : passphrase ? COPPER + "30" : "rgba(255,255,255,0.06)"}`, outline: "none", transition: "all 0.25s ease", fontFamily: fontFamily.mono }} />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={passphrase ? COPPER : "#4A5568"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          {isFirstTime && (
            <div style={{ position: "relative", marginBottom: 20 }}>
              <input type="password" value={confirmPass} onChange={e => { setConfirmPass(e.target.value); setError(null); }} placeholder="Confirm Password" disabled={verifying && !error} autoComplete="off" spellCheck={false}
                style={{ width: "100%", padding: "16px 20px 16px 48px", borderRadius: 14, fontSize: 14, fontWeight: 500, color: "#E2E8F0", letterSpacing: "0.04em", background: "rgba(255,255,255,0.03)", border: `1.5px solid ${confirmPass && confirmPass === passphrase ? "rgba(34,197,94,0.3)" : confirmPass ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)"}`, outline: "none", transition: "all 0.25s ease", fontFamily: fontFamily.mono }} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={confirmPass === passphrase && confirmPass ? "#22C55E" : "#4A5568"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
          )}
          <motion.button type="submit" disabled={!passphrase.trim() || (isFirstTime && passphrase !== confirmPass) || (verifying && !error)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            style={{ width: "100%", padding: "15px 0", borderRadius: 14, cursor: "pointer", background: unlocked ? "linear-gradient(135deg, #22C55E, #16A34A)" : `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", opacity: !passphrase.trim() || (isFirstTime && passphrase !== confirmPass) ? 0.4 : 1, fontFamily: fontFamily.primary }}>
            {unlocked ? "Access Granted" : verifying && !error ? "Verifying..." : isFirstTime ? "Set Password & Enter" : "Authenticate"}
          </motion.button>
        </motion.form>
        ) : (
        <motion.form onSubmit={handleStaffSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} key="staff-form">
          <div style={{ position: "relative", marginBottom: 12 }}>
            <input ref={staffEmailRef} type="email" value={staffEmail} onChange={e => { setStaffEmail(e.target.value); setError(null); }} placeholder="Staff Email" disabled={verifying && !error} autoComplete="off" spellCheck={false}
              style={{ width: "100%", padding: "16px 20px 16px 48px", borderRadius: 14, fontSize: 14, fontWeight: 500, color: "#E2E8F0", letterSpacing: "0.02em", background: "rgba(255,255,255,0.03)", border: `1.5px solid ${error ? "rgba(239,68,68,0.4)" : staffEmail ? COPPER + "30" : "rgba(255,255,255,0.06)"}`, outline: "none", transition: "all 0.25s ease", fontFamily: fontFamily.mono }} />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={staffEmail ? COPPER : "#4A5568"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }}>
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div style={{ position: "relative", marginBottom: 20 }}>
            <input type="password" value={staffPin} onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) { setStaffPin(e.target.value); setError(null); } }} placeholder="4-Digit PIN" maxLength={4} disabled={verifying && !error} autoComplete="off"
              style={{ width: "100%", padding: "16px 20px 16px 48px", borderRadius: 14, fontSize: 18, fontWeight: 600, color: "#E2E8F0", letterSpacing: "0.4em", textAlign: "center", background: "rgba(255,255,255,0.03)", border: `1.5px solid ${error ? "rgba(239,68,68,0.4)" : staffPin ? COPPER + "30" : "rgba(255,255,255,0.06)"}`, outline: "none", transition: "all 0.25s ease", fontFamily: fontFamily.mono }} />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={staffPin ? COPPER : "#4A5568"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <motion.button type="submit" disabled={!staffEmail.trim() || staffPin.length !== 4 || (verifying && !error)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            style={{ width: "100%", padding: "15px 0", borderRadius: 14, cursor: "pointer", background: unlocked ? "linear-gradient(135deg, #22C55E, #16A34A)" : `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", opacity: !staffEmail.trim() || staffPin.length !== 4 ? 0.4 : 1, fontFamily: fontFamily.primary }}>
            {unlocked ? "Access Granted" : verifying && !error ? "Verifying..." : "Staff Login"}
          </motion.button>
        </motion.form>
        )}
        <AnimatePresence>
          {error && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ marginTop: 16, fontSize: 13, color: "#EF4444", fontWeight: 600, padding: "10px 16px", borderRadius: 10, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>{error}</motion.div>}
        </AnimatePresence>
        <AnimatePresence>
          {unlocked && <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ marginTop: 16, fontSize: 12, color: "#22C55E", fontWeight: 600, letterSpacing: "0.1em" }}>Decrypting Platform...</motion.div>}
        </AnimatePresence>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} style={{ position: "absolute", bottom: 28, fontSize: 9, color: "#1E293B", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: fontFamily.primary }}>
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

type OpsScreen = "tiers" | "modules" | "module-config" | "create-hospitals" | "hospitals" | "hospital-detail" | "operators" | "audit" | "access";

function OperatingPlatform({ onLogout, session }: { onLogout: () => void; session: OpsSession }) {
  const isOwner = session.isOwner;
  const allowedScreens = session.allowedScreens || [];
  const actorId = isOwner ? "owner" : (session.staffId || "unknown");
  const actorName = isOwner ? "Owner" : (session.staffName || "Staff");
  // ─── Navigation ───
  const [screen, setScreen] = useState<OpsScreen>(() => {
    if (isOwner) return "create-hospitals";
    // Staff: default to first allowed screen
    return (allowedScreens[0] as OpsScreen) || "hospitals";
  });
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [configModule, setConfigModule] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ─── Data ───
  const [hospitals, setHospitals] = useState<HospitalItem[]>([]);
  const [operators, setOperators] = useState<OperatorItem[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [groupDashboard, setGroupDashboard] = useState<GroupDashboard | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const [newOp, setNewOp] = useState({ name: "", phone: "", pin: "", role: "front_desk", specialty: "general", assignedWard: "" });
  const [configWards, setConfigWards] = useState<Array<{ id: string; name: string }>>([]);
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
  // Access screen gate
  const [accessUnlocked, setAccessUnlocked] = useState(false);
  const [accessGatePass, setAccessGatePass] = useState("");
  const [accessGateError, setAccessGateError] = useState("");
  const [accessGateLoading, setAccessGateLoading] = useState(false);
  // Master Password + PIN state
  const [opsPassCurrent, setOpsPassCurrent] = useState("");
  const [opsPassNew, setOpsPassNew] = useState("");
  const [opsPassConfirm, setOpsPassConfirm] = useState("");
  const [opsPassMsg, setOpsPassMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [opsPassIsSet, setOpsPassIsSet] = useState(true);
  const [masterPinHospital, setMasterPinHospital] = useState("");
  const [masterPinValue, setMasterPinValue] = useState("");
  const [masterPinMsg, setMasterPinMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [masterPinMap, setMasterPinMap] = useState<Record<string, boolean>>({});
  // Ops Staff management
  const [opsStaffList, setOpsStaffList] = useState<{ id: string; name: string; email: string; role: string; allowedScreens: string[]; isActive: boolean; lastOpsLoginAt: string | null }[]>([]);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", pin: "", screens: [] as string[] });
  const [staffMsg, setStaffMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [editStaff, setEditStaff] = useState<{ id: string; name: string; screens: string[]; resetPin: string } | null>(null);
  const [editStaffMsg, setEditStaffMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ─── Hospital Detail ───
  const [detailHospital, setDetailHospital] = useState<HospitalItem | null>(null);
  const [detailOperators, setDetailOperators] = useState<OperatorItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [detailDevices, setDetailDevices] = useState<DeviceItem[]>([]);
  const [editingDetails, setEditingDetails] = useState(false);
  const [detailEditForm, setDetailEditForm] = useState({ name: "", tagline: "", subdomain: "" });
  const [detailEditMsg, setDetailEditMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
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

  // ─── Module Filter (hospital-detail) ───
  const [moduleFilter, setModuleFilter] = useState<"all" | "active" | "inactive">("all");

  // ─── Module Popup (hospital-detail inline config) ───
  const [modulePopup, setModulePopup] = useState<string | null>(null);
  const [popupOp, setPopupOp] = useState({ name: "", phone: "", pin: "", specialty: "general" });
  const [popupAdding, setPopupAdding] = useState(false);
  const [popupMsg, setPopupMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [popupOperators, setPopupOperators] = useState<OperatorItem[]>([]);

  // ─── Operators Page ───
  const [opsPageHospital, setOpsPageHospital] = useState<string>("");
  const [opsPageOperators, setOpsPageOperators] = useState<OperatorItem[]>([]);
  const [opsPageFilter, setOpsPageFilter] = useState<"all" | "active" | "inactive">("all");
  const [opsPageEditOp, setOpsPageEditOp] = useState<OperatorItem | null>(null);
  const [opsPageEditForm, setOpsPageEditForm] = useState({ name: "", phone: "", role: "", newPin: "" });
  const [opsPageEditMsg, setOpsPageEditMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ─── Collapsed groups for tree view ───
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  /* ─── API Loaders ─── */
  const loadHospitals = useCallback(async (retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try { const res = await fetch("/api/hospitals"); if (res.ok) { setHospitals(await res.json()); return; } } catch { if (attempt < retries) await new Promise(r => setTimeout(r, 1500)); }
    }
  }, []);

  const loadOperators = useCallback(async (hospitalCode: string, retries = 2) => {
    if (!hospitalCode) { setOperators([]); return; }
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`/api/operators?hospitalCode=${hospitalCode}&activeOnly=false`);
        if (res.ok) { const data = await res.json(); setOperators(data.operators || []); return; }
      } catch { if (attempt < retries) await new Promise(r => setTimeout(r, 1500)); }
    }
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

  const loadConfigWards = async (hospCode: string) => {
    try {
      const res = await fetch(`/api/beds?hospitalCode=${hospCode}`);
      if (res.ok) {
        const data = await res.json();
        setConfigWards((data.wards || []).map((w: { id: string; name: string }) => ({ id: w.id, name: w.name })));
      }
    } catch { /* */ }
  };

  const enterModuleConfig = (moduleKey: string) => {
    setConfigModule(moduleKey);
    setScreen("module-config");
    // Default role to the first relevant role for this module
    const relevantRole = ROLE_OPTIONS.find(r => r.modules.includes(moduleKey));
    if (relevantRole) setNewOp(o => ({ ...o, role: relevantRole.value }));
    // Auto-select hospital if one is assigned
    if (selectedHospital) {
      loadOperators(selectedHospital);
      if (moduleKey === "ward_ipd") loadConfigWards(selectedHospital);
    }
  };

  const handleAddOperator = async () => {
    if (!selectedHospital || !newOp.name || !newOp.pin || !newOp.role) return;
    setAddingOp(true); setOpMsg(null);
    try {
      // Build meta for ward assignment
      const isWardModule = configModule === "ward_ipd";
      const wardMeta = isWardModule && newOp.assignedWard ? (() => {
        const ward = configWards.find(w => w.id === newOp.assignedWard);
        return ward ? { assignedWardId: ward.id, assignedWardName: ward.name } : undefined;
      })() : undefined;
      const res = await fetch("/api/operators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: selectedHospital, action: "create", name: newOp.name, phone: newOp.phone, pin: newOp.pin, role: newOp.role, meta: wardMeta }) });
      if (res.ok) {
        // Auto-create Doctor profile when adding a doctor-role operator
        const isDoctorRole = ["doctor", "specialist", "surgeon"].includes(newOp.role);
        if (isDoctorRole && configModule === "doctor") {
          const docRole = newOp.role === "specialist" ? "attending" : newOp.role === "surgeon" ? "attending" : "attending";
          await fetch("/api/doctors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: selectedHospital, name: newOp.name, specialty: newOp.specialty || "general", role: docRole }) }).catch(() => {});
        }
        const wardLabel = wardMeta ? ` — ${wardMeta.assignedWardName}` : "";
        setOpMsg({ type: "ok", text: `${newOp.name} added${isDoctorRole && configModule === "doctor" ? ` — ${DOCTOR_SPECIALTIES.find(s => s.value === newOp.specialty)?.label || "General"} specialty` : wardLabel}` });
        setNewOp({ name: "", phone: "", pin: "", role: "front_desk", specialty: "general", assignedWard: "" }); loadOperators(selectedHospital);
      }
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
    const res = await fetch("/api/access-grants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dalxicStaffId: newGrant.staffId, hospitalId: newGrant.hospitalId, grantedRole: newGrant.role, grantedBy: actorId, expiresAt, reason: newGrant.reason }) });
    if (res.ok) { setGrantMsg({ type: "ok", text: "Access granted" }); setNewGrant({ staffId: "", hospitalId: "", role: "viewer", reason: "", hours: "24" }); loadAccessGrants(); }
    else { const err = await res.json(); setGrantMsg({ type: "err", text: err.error || "Failed" }); }
  };

  const handleRevokeGrant = async (grantId: string) => {
    const res = await fetch("/api/access-grants", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ grantId, revokedBy: actorId }) });
    if (res.ok) loadAccessGrants();
  };

  // ─── Master Password Handlers ───
  const loadOpsPasswordStatus = useCallback(async () => {
    try { const res = await fetch("/api/system-config?action=ops_password_status"); if (res.ok) { const d = await res.json(); setOpsPassIsSet(d.isSet); } } catch { /* */ }
  }, []);

  const loadMasterPinStatus = useCallback(async () => {
    try { const res = await fetch("/api/system-config?action=master_pin_status"); if (res.ok) { const d = await res.json(); setMasterPinMap(d.pins || {}); } } catch { /* */ }
  }, []);

  const handleSetOpsPassword = async () => {
    setOpsPassMsg(null);
    if (opsPassNew.length < 8) { setOpsPassMsg({ type: "err", text: "Password must be at least 8 characters" }); return; }
    if (opsPassNew !== opsPassConfirm) { setOpsPassMsg({ type: "err", text: "Passwords do not match" }); return; }
    const body: Record<string, string> = { action: "set_ops_password", password: opsPassNew };
    if (opsPassIsSet) body.currentPassword = opsPassCurrent;
    const res = await fetch("/api/system-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setOpsPassMsg({ type: "ok", text: opsPassIsSet ? "Password changed" : "Password set" }); setOpsPassCurrent(""); setOpsPassNew(""); setOpsPassConfirm(""); setOpsPassIsSet(true); }
    else { const err = await res.json(); setOpsPassMsg({ type: "err", text: err.error || "Failed" }); }
  };

  const handleSetMasterPin = async () => {
    setMasterPinMsg(null);
    if (!masterPinHospital) { setMasterPinMsg({ type: "err", text: "Select a hospital" }); return; }
    if (!/^\d{4}$/.test(masterPinValue)) { setMasterPinMsg({ type: "err", text: "PIN must be exactly 4 digits" }); return; }
    const res = await fetch("/api/system-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set_master_pin", hospitalId: masterPinHospital, pin: masterPinValue }) });
    if (res.ok) { setMasterPinMsg({ type: "ok", text: "Master PIN set" }); setMasterPinValue(""); loadMasterPinStatus(); }
    else { const err = await res.json(); setMasterPinMsg({ type: "err", text: err.error || "Failed" }); }
  };

  const handleRemoveMasterPin = async (hospitalId: string) => {
    const res = await fetch("/api/system-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove_master_pin", hospitalId }) });
    if (res.ok) loadMasterPinStatus();
  };

  const loadOpsStaff = useCallback(async () => {
    try {
      const res = await fetch("/api/system-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "list_ops_staff" }) });
      if (res.ok) setOpsStaffList(await res.json());
    } catch { /* */ }
  }, []);

  const handleCreateOpsStaff = async () => {
    setStaffMsg(null);
    if (!newStaff.name || !newStaff.email || !/^\d{4}$/.test(newStaff.pin)) { setStaffMsg({ type: "err", text: "Name, email, and 4-digit PIN required" }); return; }
    const res = await fetch("/api/system-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_ops_staff", name: newStaff.name, email: newStaff.email, pin: newStaff.pin, allowedScreens: newStaff.screens }) });
    if (res.ok) { setStaffMsg({ type: "ok", text: "Staff added" }); setNewStaff({ name: "", email: "", pin: "", screens: [] }); loadOpsStaff(); }
    else { const err = await res.json(); setStaffMsg({ type: "err", text: err.error || "Failed" }); }
  };

  const handleEditOpsStaff = async () => {
    if (!editStaff) return;
    setEditStaffMsg(null);
    const body: Record<string, unknown> = { action: "edit_ops_staff", staffId: editStaff.id, name: editStaff.name, allowedScreens: editStaff.screens };
    if (editStaff.resetPin && /^\d{4}$/.test(editStaff.resetPin)) body.resetPin = editStaff.resetPin;
    const res = await fetch("/api/system-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setEditStaffMsg({ type: "ok", text: "Updated" }); loadOpsStaff(); setTimeout(() => setEditStaff(null), 600); }
    else { const err = await res.json(); setEditStaffMsg({ type: "err", text: err.error || "Failed" }); }
  };

  const handleToggleOpsStaff = async (staffId: string) => {
    await fetch("/api/system-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggle_ops_staff", staffId }) });
    loadOpsStaff();
  };

  const handleAccessGateUnlock = async () => {
    if (!accessGatePass.trim()) return;
    setAccessGateLoading(true); setAccessGateError("");
    try {
      const res = await fetch("/api/system-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify_ops_password", password: accessGatePass.trim() }) });
      const data = await res.json();
      if (data.valid) { setAccessUnlocked(true); setAccessGatePass(""); loadOpsPasswordStatus(); loadMasterPinStatus(); loadAccessGrants(); loadOpsStaff(); }
      else { setAccessGateError("Invalid password"); setAccessGatePass(""); }
    } catch { setAccessGateError("Connection error"); }
    setAccessGateLoading(false);
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
  const handleDetailEditSave = async () => {
    if (!detailHospital) return;
    setDetailEditMsg(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editFields: any = {};
    if (detailEditForm.name && detailEditForm.name !== detailHospital.name) editFields.name = detailEditForm.name;
    if (detailEditForm.tagline !== (detailHospital.tagline || "")) editFields.tagline = detailEditForm.tagline;
    if (detailEditForm.subdomain && detailEditForm.subdomain !== detailHospital.subdomain) editFields.subdomain = detailEditForm.subdomain;
    if (Object.keys(editFields).length === 0) { setEditingDetails(false); return; }
    const res = await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: detailHospital.code, editFields, actorId: actorId }) });
    if (res.ok) { setDetailEditMsg({ type: "ok", text: "Details Updated" }); setEditingDetails(false); loadHospitalDetail(detailHospital.code); loadHospitals(); }
    else { const err = await res.json(); setDetailEditMsg({ type: "err", text: err.error || "Failed" }); }
  };

  const handleDetailToggleModule = async (moduleKey: string) => {
    if (!detailHospital) return;
    const hospitalModules = (detailHospital.activeModules || []) as string[];
    const allKeys = [...ALL_WORKSTATIONS, ...UTILITY_STATIONS].map(ws => ws.key);

    if (moduleKey === "__select_all__") {
      const toEnable = allKeys.filter(k => !hospitalModules.includes(k));
      for (const k of toEnable) await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: detailHospital.code, toggleModule: k, actorId: actorId }) });
      loadHospitalDetail(detailHospital.code); loadHospitals(); return;
    }
    if (moduleKey === "__deselect_all__") {
      const toDisable = allKeys.filter(k => hospitalModules.includes(k));
      for (const k of toDisable) await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: detailHospital.code, toggleModule: k, actorId: actorId }) });
      loadHospitalDetail(detailHospital.code); loadHospitals(); return;
    }

    const res = await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: detailHospital.code, toggleModule: moduleKey, actorId: actorId }) });
    if (res.ok) { loadHospitalDetail(detailHospital.code); loadHospitals(); }
  };

  const handleDetailChangeTier = async (newTier: TierKey) => {
    if (!detailHospital) return;
    const res = await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: detailHospital.code, newTier, actorId: actorId }) });
    if (res.ok) { setChangingTier(false); loadHospitalDetail(detailHospital.code); loadHospitals(); }
  };

  const handleToggleHospitalActive = async (hospitalCode: string, currentlyActive: boolean) => {
    await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode, editFields: { active: !currentlyActive }, actorId: actorId }) });
    loadHospitals();
    if (detailHospital?.code === hospitalCode) loadHospitalDetail(hospitalCode);
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
    await fetch("/api/devices", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId, action, actorId: actorId, actorType: "dalxic_super_admin" }) });
    if (detailHospital) loadHospitalDetail(detailHospital.code);
  };

  /* ─── Operators Page Handlers ─── */
  const loadOpsPageOperators = async (hospitalCode: string) => {
    if (!hospitalCode) { setOpsPageOperators([]); return; }
    try {
      const res = await fetch(`/api/operators?hospitalCode=${hospitalCode}&activeOnly=false`);
      if (res.ok) { const data = await res.json(); setOpsPageOperators(data.operators || []); }
    } catch { /* ignore */ }
  };

  const handleOpsPageToggleOperator = async (op: OperatorItem) => {
    if (!opsPageHospital) return;
    await fetch("/api/operators", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: opsPageHospital, operatorId: op.id, isActive: !op.isActive }) });
    loadOpsPageOperators(opsPageHospital);
  };

  const handleOpsPageEditOperator = async () => {
    if (!opsPageEditOp || !opsPageHospital) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { hospitalCode: opsPageHospital, operatorId: opsPageEditOp.id };
    if (opsPageEditForm.name !== opsPageEditOp.name) payload.name = opsPageEditForm.name;
    if (opsPageEditForm.phone !== (opsPageEditOp.phone || "")) payload.phone = opsPageEditForm.phone;
    if (opsPageEditForm.role !== opsPageEditOp.role) payload.role = opsPageEditForm.role;
    if (opsPageEditForm.newPin && opsPageEditForm.newPin.length === 4) payload.newPin = opsPageEditForm.newPin;
    const res = await fetch("/api/operators", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { setOpsPageEditMsg({ type: "ok", text: "Updated" }); loadOpsPageOperators(opsPageHospital); setTimeout(() => { setOpsPageEditOp(null); setOpsPageEditMsg(null); }, 600); }
    else { const err = await res.json(); setOpsPageEditMsg({ type: "err", text: err.error || "Failed" }); }
  };

  const handleOpsPageResetPin = async (op: OperatorItem) => {
    if (!opsPageHospital) return;
    const newPin = prompt("Enter New 4-Digit PIN:");
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) return;
    await fetch("/api/operators", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: opsPageHospital, operatorId: op.id, newPin }) });
    loadOpsPageOperators(opsPageHospital);
  };

  /* ─── Module Popup Handlers ─── */
  const openModulePopup = async (moduleKey: string) => {
    if (!detailHospital) return;
    setModulePopup(moduleKey);
    setPopupOp({ name: "", phone: "", pin: "", specialty: "general" });
    setPopupMsg(null);
    // Load operators for this hospital filtered by module role
    try {
      const res = await fetch(`/api/operators?hospitalCode=${detailHospital.code}&activeOnly=false`);
      if (res.ok) { const data = await res.json(); setPopupOperators(data.operators || []); }
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
        // Auto-create Doctor profile when adding to Doctor module
        if (modulePopup === "doctor" && ["doctor", "specialist", "surgeon"].includes(role)) {
          await fetch("/api/doctors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: detailHospital.code, name: popupOp.name, specialty: popupOp.specialty || "general", role: "attending" }) }).catch(() => {});
        }
        const specLabel = DOCTOR_SPECIALTIES.find(s => s.value === popupOp.specialty)?.label;
        setPopupMsg({ type: "ok", text: `${popupOp.name} Added${modulePopup === "doctor" ? ` — ${specLabel || "General"}` : ""}` });
        setPopupOp({ name: "", phone: "", pin: "", specialty: "general" });
        // Refresh operator lists
        const opRes = await fetch(`/api/operators?hospitalCode=${detailHospital.code}&activeOnly=false`);
        if (opRes.ok) { const d = await opRes.json(); setPopupOperators(d.operators || []); setDetailOperators(d.operators || []); }
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
    const crumbs: { label: string; onClick?: () => void }[] = [];
    // Only show breadcrumb for drill-down screens, not for top-level nav screens
    if (screen === "hospital-detail" || screen === "module-config" || screen === "tiers" || screen === "modules") {
      crumbs.push({ label: "Hospitals", onClick: () => { setScreen("hospitals"); setDetailHospital(null); setConfigModule(null); } });
    }
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
    return crumbs;
  })();

  const DS = getStyles(false); // ops is always dark mode
  const inputStyle = DS.input;
  const labelStyle = DS.label;

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 120% 80% at 55% 20%, rgba(15,9,5,1) 0%, rgba(6,3,12,1) 45%, rgba(2,3,10,1) 100%)", position: "relative", overflow: "hidden", color: "#E2E8F0" }}>
      <GalaxyCanvas />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 15%, rgba(184,115,51,0.04) 0%, transparent 50%)", pointerEvents: "none" }} />

      {/* ─── Header ─── */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "14px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${COPPER}08`, background: "rgba(3,5,15,0.5)", backdropFilter: "blur(16px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: COPPER, boxShadow: `0 0 12px ${COPPER}60` }} />
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.04em", fontFamily: fontFamily.primary }}>
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
                  style={{ background: "none", border: "none", color: i === breadcrumb.length - 1 ? COPPER_LIGHT : "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: fontFamily.primary }}>
                  {crumb.label}
                </motion.button>
              ) : (
                <span style={{ color: COPPER_LIGHT, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: fontFamily.primary }}>{crumb.label}</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Utility nav — filtered by session scope */}
          {["create-hospitals", "hospitals", "operators", "audit", "access"].filter(s => {
            if (isOwner) return true; // owner sees everything
            if (s === "access") return false; // access is always owner-only
            return allowedScreens.includes(s);
          }).map(s => {
            const isActive = s === "hospitals" ? (screen === "hospitals" || screen === "hospital-detail") : screen === s;
            const label = s === "create-hospitals" ? "Create" : s;
            return (
            <motion.button key={s} whileHover={{ scale: 1.05 }} onClick={() => { if (s === "hospitals") { setScreen("hospitals"); setDetailHospital(null); setConfigModule(null); } else { setScreen(s as OpsScreen); } if (s === "audit") loadAuditLogs(); if (s !== "access") setAccessUnlocked(false); }}
              style={{ background: isActive ? `${COPPER}10` : "none", border: isActive ? `1px solid ${COPPER}20` : "1px solid transparent", color: isActive ? COPPER_LIGHT : "#475569", fontSize: 10, fontWeight: 700, padding: "6px 12px", borderRadius: 8, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: fontFamily.primary }}>
              {s === "create-hospitals" ? "➕" : s === "hospitals" ? "🏥" : s === "operators" ? "👥" : s === "audit" ? "📋" : "🔑"} {label}
            </motion.button>
            );
          })}

          {/* Logged-in identity */}
          <span style={{ fontSize: 10, fontWeight: 600, color: isOwner ? COPPER_LIGHT : "#38BDF8", padding: "4px 10px", borderRadius: 6, background: isOwner ? `${COPPER}08` : "rgba(56,189,248,0.06)", border: `1px solid ${isOwner ? COPPER + "15" : "rgba(56,189,248,0.12)"}` }}>
            {isOwner ? "🔐 Owner" : `👤 ${actorName}`}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#334155", fontFamily: fontFamily.mono }}>
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
                <h1 style={{ fontSize: 32, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary, letterSpacing: "-0.02em", marginBottom: 6 }}>Select A Tier Template</h1>
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
                    <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: fontFamily.primary }}>{s.value}</div>
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
                        <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: fontFamily.primary, letterSpacing: "-0.02em" }}>{tier}</div>
                        <div style={{ padding: "4px 10px", borderRadius: 8, background: `${color}10`, border: `1px solid ${color}20`, fontSize: 10, fontWeight: 700, color }}>{def.maxDevices === 999 ? "Unlimited" : `${def.maxDevices} Devices`}</div>
                      </div>

                      <div style={{ fontSize: 16, fontWeight: 700, color: "#F0F4FF", marginBottom: 4, fontFamily: fontFamily.primary }}>{def.label}</div>
                      <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, marginBottom: 10 }}>{def.description}</div>

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
                        <span style={{ fontSize: 24, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary, letterSpacing: "-0.02em" }}>The Master</span>
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COPPER_LIGHT }}>Privileged Access</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6, maxWidth: 600 }}>
                        Every Module Unlocked — Freestyle Configuration For Any Hospital Type. Build Custom Deployments Without Tier Constraints.
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: COPPER, fontFamily: fontFamily.primary }}>{ALL_WORKSTATIONS.length + UTILITY_STATIONS.length}</div>
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
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary }}>
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
                        <div style={{ fontSize: 13, color: "#64748B", marginBottom: 14, lineHeight: 1.5 }}>{ws.desc}</div>
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
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary }}>{configWs.title}</h2>
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
                    <div style={{ display: "grid", gridTemplateColumns: configModule === "doctor" ? "1fr 1fr 100px 1fr 1fr auto" : configModule === "ward_ipd" ? "1fr 1fr 100px 1fr 1fr auto" : "1fr 1fr 100px 1fr auto", gap: 12, alignItems: "end" }}>
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
                          style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.3em", fontFamily: fontFamily.mono }} />
                      </div>
                      {configModule === "doctor" && (
                        <div>
                          <label style={labelStyle}>Specialty</label>
                          <select value={newOp.specialty} onChange={e => setNewOp(o => ({ ...o, specialty: e.target.value }))} style={{ ...inputStyle, appearance: "none" }}>
                            {DOCTOR_SPECIALTIES.map(s => <option key={s.value} value={s.value} style={{ background: "#0a0a14" }}>{s.icon} {s.label}</option>)}
                          </select>
                        </div>
                      )}
                      {configModule === "ward_ipd" && (
                        <div>
                          <label style={labelStyle}>Assigned Ward</label>
                          <select value={newOp.assignedWard} onChange={e => setNewOp(o => ({ ...o, assignedWard: e.target.value }))} style={{ ...inputStyle, appearance: "none" }}>
                            <option value="" style={{ background: "#0a0a14" }}>All Wards</option>
                            {configWards.map(w => <option key={w.id} value={w.id} style={{ background: "#0a0a14" }}>🛏️ {w.name}</option>)}
                          </select>
                        </div>
                      )}
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
                    {opMsg && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: opMsg.type === "ok" ? "#22C55E" : "#EF4444" }}>{opMsg.text}</div>}
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
                            {op.phone && <span style={{ fontSize: 13, color: "#475569", marginLeft: 8 }}>{op.phone}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ padding: "3px 10px", borderRadius: 6, background: `${BLUE}10`, border: `1px solid ${BLUE}20`, fontSize: 10, fontWeight: 700, color: BLUE, textTransform: "uppercase", letterSpacing: "0.06em" }}>{op.role.replace(/_/g, " ")}</span>
                          {op.lastLoginAt && <span style={{ fontSize: 10, color: "#475569", fontFamily: fontFamily.mono }}>{new Date(op.lastLoginAt).toLocaleDateString("en-GB")}</span>}
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
                              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary, margin: 0 }}>{editOp.name}</h3>
                            </div>
                            <motion.button whileHover={{ scale: 1.1 }} onClick={() => setEditOp(null)} style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748B", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</motion.button>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div><label style={labelStyle}>Full Name</label><input value={editOpForm.name} onChange={e => setEditOpForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Phone</label><input value={editOpForm.phone} onChange={e => setEditOpForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Role</label><select value={editOpForm.role} onChange={e => setEditOpForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, appearance: "none" }}>{ROLE_OPTIONS.map(r => <option key={r.value} value={r.value} style={{ background: "#0a0a14" }}>{r.label}</option>)}</select></div>
                            <div><label style={{ ...labelStyle, color: "#EF4444" }}>Reset PIN (Leave Blank To Keep)</label><input value={editOpForm.newPin} onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setEditOpForm(f => ({ ...f, newPin: e.target.value })); }} placeholder="••••" type="password" maxLength={4} style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.3em", fontFamily: fontFamily.mono, background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.12)" }} /></div>
                          </div>
                          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                            <motion.button whileHover={{ scale: 1.02 }} onClick={handleEditOperator} style={{ flex: 1, padding: "12px 0", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none" }}>Save Changes</motion.button>
                            <motion.button whileHover={{ scale: 1.02 }} onClick={() => setEditOp(null)} style={{ padding: "12px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#64748B", cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>Cancel</motion.button>
                          </div>
                          {editOpMsg && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, textAlign: "center", color: editOpMsg.type === "ok" ? "#22C55E" : "#EF4444" }}>{editOpMsg.text}</div>}
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
          {/* SCREEN: CREATE HOSPITALS               */}
          {/* ═══════════════════════════════════════ */}
          {screen === "create-hospitals" && (
            <motion.div key="create-hospitals" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>Deployment</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary }}>Create Hospital</h2>
              </div>

              {/* Create hospital */}
              <div style={{ padding: "28px 24px", borderRadius: 20, marginBottom: 28, background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}12` }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COPPER_LIGHT, marginBottom: 20 }}>New Hospital{selectedTier ? ` (${selectedTier} — ${activeModules.length} Modules)` : ""}</div>
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
                {hospitalMsg && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: hospitalMsg.type === "ok" ? "#22C55E" : "#EF4444" }}>{hospitalMsg.text}</div>}
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
                {groupMsg && <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: groupMsg.type === "ok" ? "#22C55E" : "#EF4444" }}>{groupMsg.text}</div>}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* SCREEN 4: HOSPITALS (View Only)         */}
          {/* ═══════════════════════════════════════ */}
          {screen === "hospitals" && (
            <motion.div key="hospitals" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>Hospital Management</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary }}>Hospitals & Groups</h2>
              </div>

              {/* Compact stats bar */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { icon: "🏥", label: "Hospitals", value: hospitals.length, color: COPPER },
                  { icon: "👤", label: "Total Patients", value: totalPatients.toLocaleString(), color: BLUE },
                  { icon: "📱", label: "Operators Online", value: `${onlineOps} / ${totalDevices}`, color: onlineOps > 0 ? "#22C55E" : "#64748B" },
                  { icon: "📂", label: "Groups", value: grouped.groups.length, color: COPPER_LIGHT },
                ].map(s => (
                  <div key={s.label} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${s.color}10` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 13 }}>{s.icon}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B" }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: fontFamily.primary }}>{s.value}</div>
                  </div>
                ))}
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
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary, marginBottom: 4 }}>{g.groupName}</div>
                        <div style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>{g.groupCode} · {totalPatientsInGroup.toLocaleString()} Total Patients · {totalModulesInGroup} Modules</div>

                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          {g.hospitals.map(h => (
                            <div key={h.code} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: h.active ? "#22C55E" : "#EF4444" }} />
                              <span style={{ fontSize: 9, fontWeight: 700, color: "#4A5568", fontFamily: fontFamily.mono }}>{h.code}</span>
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
                                      <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, color: COPPER, background: `${COPPER}08`, border: `1px solid ${COPPER}12`, fontFamily: fontFamily.mono }}>{h.code}</span>
                                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: hTierColor }}>{h.tier} — {TIER_DEFAULTS[h.tier as TierKey]?.label || h.tier}</span>
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary, marginBottom: 4 }}>{h.name}</div>
                                    <div style={{ fontSize: 10, color: "#4A5568", marginBottom: 12 }}>{h._count.patientRecords} Patients · {(h.activeModules || []).length} Modules · {h._count.devices} Devices</div>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: h.active ? "#22C55E" : "#EF4444", boxShadow: h.active ? "0 0 5px rgba(34,197,94,0.3)" : "none" }} />
                                        <span style={{ fontSize: 9, fontWeight: 700, color: h.active ? "#22C55E" : "#EF4444", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h.active ? "Active" : "Suspended"}</span>
                                      </div>
                                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <motion.button whileHover={{ scale: 1.1 }} onClick={(e) => { e.stopPropagation(); handleToggleHospitalActive(h.code, h.active); }}
                                          style={{ padding: "2px 6px", borderRadius: 4, fontSize: 8, fontWeight: 700, color: h.active ? "#EF4444" : "#22C55E", background: h.active ? "rgba(239,68,68,0.04)" : "rgba(34,197,94,0.04)", border: `1px solid ${h.active ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)"}`, cursor: "pointer", textTransform: "uppercase" }}>{h.active ? "Suspend" : "Activate"}</motion.button>
                                        <motion.button whileHover={{ scale: 1.1 }} onClick={(e) => { e.stopPropagation(); handleUnlinkHospital(h.code); }}
                                          style={{ padding: "2px 6px", borderRadius: 4, fontSize: 8, fontWeight: 700, color: "#475569", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", textTransform: "uppercase" }}>Unlink</motion.button>
                                      </div>
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
                        <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800, color: COPPER, background: `${COPPER}08`, border: `1px solid ${COPPER}15`, fontFamily: fontFamily.mono }}>{h.code}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: tierColor }}>{h.tier} — {TIER_DEFAULTS[h.tier as TierKey]?.label || h.tier}</span>
                      </div>

                      {/* Name */}
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary, marginBottom: 4 }}>{h.name}</div>

                      {/* Description line */}
                      <div style={{ fontSize: 13, color: "#64748B", marginBottom: 18 }}>
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
                            <span style={{ fontSize: 18, fontWeight: 800, color: stat.color, fontFamily: fontFamily.primary }}>{stat.value}</span>
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
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <motion.button whileHover={{ scale: 1.05 }} onClick={(e) => { e.stopPropagation(); handleToggleHospitalActive(h.code, h.active); }}
                            style={{ padding: "4px 10px", borderRadius: 6, fontSize: 9, fontWeight: 700, color: h.active ? "#EF4444" : "#22C55E", background: h.active ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)", border: `1px solid ${h.active ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)"}`, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {h.active ? "Suspend" : "Activate"}
                          </motion.button>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                        </div>
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
          {screen === "hospital-detail" && detailHospital && (() => {
            const tierColor = ({ T1: "#22C55E", T2: BLUE, T3: COPPER, T4: "#A855F7", MASTER: "#F59E0B" } as Record<string, string>)[detailHospital.tier] || COPPER;
            const tierDef = TIER_DEFAULTS[detailHospital.tier as TierKey];
            const hospitalModules = (detailHospital.activeModules || []) as string[];
            const allWs = [...ALL_WORKSTATIONS, ...UTILITY_STATIONS];
            const cardStyle: React.CSSProperties = { background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}12`, borderRadius: 20, padding: "28px 28px", marginBottom: 20 };
            const sectionTitle = (text: string) => <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 16 }}>{text}</div>;
            return (
            <motion.div key="hospital-detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>

              {/* ═══ SECTION A: HOSPITAL HEADER ═══ */}
              <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ flex: 1 }}>
                    {!editingDetails ? (
                      <>
                        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary, letterSpacing: "-0.02em", margin: 0 }}>{detailHospital.name}</h2>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                          <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${tierColor}10`, border: `1px solid ${tierColor}25`, color: tierColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>{detailHospital.tier} — {tierDef?.label || detailHospital.tier}</span>
                          <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: COPPER_LIGHT, background: `${COPPER}08`, fontFamily: fontFamily.mono, letterSpacing: "0.04em" }}>{detailHospital.code}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: detailHospital.active ? "#22C55E" : "#EF4444", boxShadow: detailHospital.active ? "0 0 8px rgba(34,197,94,0.4)" : "none" }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: detailHospital.active ? "#22C55E" : "#EF4444", textTransform: "uppercase", letterSpacing: "0.08em" }}>{detailHospital.active ? "Active" : "Suspended"}</span>
                          </div>
                        </div>
                        {detailHospital.tagline && <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 8, fontStyle: "italic" }}>{detailHospital.tagline}</p>}
                        <p style={{ fontSize: 13, color: "#475569", marginTop: 6, fontFamily: fontFamily.mono }}>
                          <span style={{ cursor: "text" }} onClick={() => window.open(`${window.location.origin}/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh`, "_blank")}>ID {detailHospital.id?.slice(0, 8) || detailHospital.code.toLowerCase()}</span>
                        </p>
                      </>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420 }}>
                        <div>
                          <label style={labelStyle}>Hospital Name</label>
                          <input value={detailEditForm.name} onChange={e => setDetailEditForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Tagline</label>
                          <input value={detailEditForm.tagline} onChange={e => setDetailEditForm(f => ({ ...f, tagline: e.target.value }))} style={inputStyle} placeholder="e.g. Where Care Meets Excellence" />
                        </div>
                        <div>
                          <label style={labelStyle}>Subdomain</label>
                          <input value={detailEditForm.subdomain} onChange={e => setDetailEditForm(f => ({ ...f, subdomain: e.target.value }))} style={inputStyle} />
                        </div>
                        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleDetailEditSave}
                            style={{ padding: "10px 24px", borderRadius: 10, cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Save</motion.button>
                          <motion.button whileHover={{ scale: 1.03 }} onClick={() => setEditingDetails(false)}
                            style={{ padding: "10px 24px", borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cancel</motion.button>
                        </div>
                        {detailEditMsg && <div style={{ fontSize: 13, fontWeight: 600, color: detailEditMsg.type === "ok" ? "#22C55E" : "#EF4444" }}>{detailEditMsg.text}</div>}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {!editingDetails && (
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { setEditingDetails(true); setDetailEditForm({ name: detailHospital.name, tagline: detailHospital.tagline || "", subdomain: detailHospital.subdomain }); setDetailEditMsg(null); }}
                        style={{ padding: "8px 18px", borderRadius: 10, cursor: "pointer", background: `${COPPER}10`, border: `1px solid ${COPPER}25`, color: COPPER_LIGHT, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Edit Details</motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleHospitalActive(detailHospital.code, detailHospital.active)}
                        style={{ padding: "8px 18px", borderRadius: 10, cursor: "pointer", background: detailHospital.active ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", border: `1px solid ${detailHospital.active ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`, color: detailHospital.active ? "#EF4444" : "#22C55E", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{detailHospital.active ? "Suspend" : "Activate"}</motion.button>
                    </div>
                  )}
                </div>
              </div>

              {/* ═══ SECTION B: MODULE CONFIGURATION (Original polished design) ═══ */}
              <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    {sectionTitle("Module Configuration")}
                    <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>{hospitalModules.length} modules active. Click any module to configure operators and access.</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleDetailToggleModule("__select_all__")}
                      style={{ width: 120, padding: "8px 0", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22C55E", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: fontFamily.primary, textAlign: "center" }}>Unlock All</motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleDetailToggleModule("__deselect_all__")}
                      style={{ width: 120, padding: "8px 0", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: fontFamily.primary, textAlign: "center" }}>Lock All</motion.button>
                    <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value as "all" | "active" | "inactive")}
                      style={{ width: 120, padding: "8px 0", borderRadius: 8, fontSize: 10, fontWeight: 700, color: moduleFilter === "active" ? "#22C55E" : moduleFilter === "inactive" ? "#EF4444" : COPPER_LIGHT, background: "rgba(255,255,255,0.03)", border: `1px solid ${moduleFilter === "active" ? "rgba(34,197,94,0.3)" : moduleFilter === "inactive" ? "rgba(239,68,68,0.3)" : COPPER + "18"}`, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em", appearance: "none", fontFamily: fontFamily.primary, textAlign: "center" }}>
                      <option value="all" style={{ background: "#0a0a14" }}>All</option>
                      <option value="active" style={{ background: "#0a0a14" }}>Active</option>
                      <option value="inactive" style={{ background: "#0a0a14" }}>Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Module cards — 3 column grid, clickable to enter operator config */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {(() => {
                    const filtered = moduleFilter === "active" ? allWs.filter(ws => hospitalModules.includes(ws.key))
                      : moduleFilter === "inactive" ? allWs.filter(ws => !hospitalModules.includes(ws.key))
                      : allWs;
                    // Build role→module mapping for showing operators on cards
                    const moduleOperatorMap = new Map<string, OperatorItem[]>();
                    for (const ws of allWs) {
                      const relevantRoles = ROLE_OPTIONS.filter(r => r.modules.includes(ws.key)).map(r => r.value);
                      const ops = detailOperators.filter(op => relevantRoles.includes(op.role) && op.isActive);
                      if (ops.length > 0) moduleOperatorMap.set(ws.key, ops);
                    }

                    return filtered.map((ws, i) => {
                      const isActive = hospitalModules.includes(ws.key);
                      const moduleOps = moduleOperatorMap.get(ws.key) || [];
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
                          <div style={{ fontSize: 15, fontWeight: 800, color: isActive ? "#F0F4FF" : "#475569", fontFamily: fontFamily.primary, marginBottom: 4 }}>{ws.title}</div>
                          <div style={{ fontSize: 13, color: isActive ? "#64748B" : "#334155", lineHeight: 1.5 }}>{ws.desc}</div>

                          {/* Status dot + operators + toggle */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: isActive ? "#22C55E" : "#334155", boxShadow: isActive ? "0 0 6px rgba(34,197,94,0.3)" : "none" }} />
                              <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? "#22C55E" : "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{isActive ? "Active" : "Inactive"}</span>
                            </div>
                            {moduleOps.length > 0 && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, justifyContent: "center" }}>
                                {moduleOps.slice(0, 3).map(op => (
                                  <span key={op.id} style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8" }}>{op.name}</span>
                                ))}
                                {moduleOps.length > 3 && <span style={{ fontSize: 9, color: "#475569" }}>+{moduleOps.length - 3}</span>}
                              </div>
                            )}
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
              </div>

              {/* ── Module Config Popup ── */}
              <AnimatePresence>
                {modulePopup && (() => {
                  const popupWs = [...ALL_WORKSTATIONS, ...UTILITY_STATIONS].find(w => w.key === modulePopup);
                  if (!popupWs) return null;
                  const popupColor = hospitalModules.includes(modulePopup) ? COPPER : "#475569";
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
                        {/* Side accent strips — full height, even solid color on both sides */}
                        <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: "#4A3728", borderRadius: "28px 0 0 28px" }} />
                        <div style={{ position: "absolute", top: 0, right: 0, width: 3, height: "100%", background: "#4A3728", borderRadius: "0 28px 28px 0" }} />

                        <div style={{ padding: "32px 28px 28px" }}>
                          {/* Module icon + title */}
                          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                            <span style={{ fontSize: 36 }}>{popupWs.icon}</span>
                            <div>
                              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 4 }}>{popupWs.role}</div>
                              <div style={{ fontSize: 22, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary }}>{popupWs.title}</div>
                              <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{popupWs.desc}</div>
                            </div>
                          </div>

                          {/* Locked hospital */}
                          <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}10`, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COPPER} strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#F0F4FF" }}>{detailHospital.name}</span>
                            <span style={{ fontSize: 10, color: "#475569", fontFamily: fontFamily.mono }}>{detailHospital.code}</span>
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
                              {modulePopup === "doctor" && (
                                <div>
                                  <label style={labelStyle}>Specialty</label>
                                  <select value={popupOp.specialty} onChange={e => setPopupOp(o => ({ ...o, specialty: e.target.value }))} style={{ ...inputStyle, appearance: "none" }}>
                                    {DOCTOR_SPECIALTIES.map(s => <option key={s.value} value={s.value} style={{ background: "#0a0a14" }}>{s.icon} {s.label}</option>)}
                                  </select>
                                </div>
                              )}
                              <div>
                                <label style={labelStyle}>PIN</label>
                                <input placeholder="4 digits" type="password" maxLength={4} value={popupOp.pin}
                                  onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setPopupOp(o => ({ ...o, pin: e.target.value })); }}
                                  style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.3em", fontFamily: fontFamily.mono }} />
                              </div>
                              <motion.button onClick={handlePopupAddOperator} disabled={popupAdding || !popupOp.name || popupOp.pin.length !== 4}
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                style={{ padding: "12px 0", borderRadius: 12, cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, opacity: popupAdding || !popupOp.name || popupOp.pin.length !== 4 ? 0.4 : 1, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                {popupAdding ? "Adding..." : "Add"}
                              </motion.button>
                            </div>
                            {popupMsg && <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: popupMsg.type === "ok" ? "#22C55E" : "#EF4444" }}>{popupMsg.text}</div>}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              {/* ═══ SECTION E: STATS + TIER INFO ═══ */}
              <div style={cardStyle}>
                {sectionTitle("Stats & Tier")}

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
                  {[
                    { label: "Patients", value: detailHospital._count.patientRecords, color: BLUE },
                    { label: "Devices", value: detailHospital._count.devices, color: COPPER },
                    { label: "Monthly Books", value: detailHospital._count.monthlyBooks, color: "#A855F7" },
                    { label: "Active Modules", value: hospitalModules.length, color: "#22C55E" },
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: "center", padding: "18px 12px", borderRadius: 14, background: `${stat.color}06`, border: `1px solid ${stat.color}12` }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, fontFamily: fontFamily.primary }}>{stat.value.toLocaleString()}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", marginTop: 4 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Tier info card */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px", borderRadius: 16, background: `${tierColor}06`, border: `1px solid ${tierColor}12` }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: tierColor, fontFamily: fontFamily.primary }}>{detailHospital.tier} — {tierDef?.label || detailHospital.tier}</div>
                    <p style={{ fontSize: 12, color: "#94A3B8", margin: "6px 0 10px" }}>{tierDef?.description || ""}</p>
                    <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#64748B" }}>
                      <span>Max Devices: <strong style={{ color: "#F0F4FF" }}>{tierDef?.maxDevices || "—"}</strong></span>
                      <span>WhatsApp Bundle: <strong style={{ color: "#F0F4FF" }}>{tierDef?.whatsappBundlePerMonth?.toLocaleString() || "—"}/mo</strong></span>
                      <span>Modules: <strong style={{ color: "#F0F4FF" }}>{tierDef?.modules?.length || "—"}</strong></span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    {!changingTier ? (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setChangingTier(true)}
                        style={{ padding: "8px 18px", borderRadius: 10, cursor: "pointer", background: `${tierColor}10`, border: `1px solid ${tierColor}25`, color: tierColor, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Change Tier</motion.button>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                        <div style={{ fontSize: 9, color: "#F59E0B", fontWeight: 600, marginBottom: 2 }}>Warning: Changing Tier May Reset Modules</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {(Object.keys(TIER_DEFAULTS) as TierKey[]).filter(t => t !== detailHospital.tier).map(t => (
                            <motion.button key={t} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                              onClick={() => handleDetailChangeTier(t)}
                              style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", background: `${({ T1: "#22C55E", T2: BLUE, T3: COPPER, T4: "#A855F7", MASTER: "#F59E0B" } as Record<string, string>)[t] || COPPER}10`, border: `1px solid ${({ T1: "#22C55E", T2: BLUE, T3: COPPER, T4: "#A855F7", MASTER: "#F59E0B" } as Record<string, string>)[t] || COPPER}25`, color: ({ T1: "#22C55E", T2: BLUE, T3: COPPER, T4: "#A855F7", MASTER: "#F59E0B" } as Record<string, string>)[t] || COPPER }}>{t}</motion.button>
                          ))}
                          <motion.button whileHover={{ scale: 1.05 }} onClick={() => setChangingTier(false)}
                            style={{ padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748B" }}>Cancel</motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Back button */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 8, marginBottom: 40 }}>
                <motion.button whileHover={{ scale: 1.03 }} onClick={() => { setScreen("hospitals"); setDetailHospital(null); }}
                  style={{ padding: "12px 32px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#64748B", cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  ← Back To Hospitals
                </motion.button>
              </div>
            </motion.div>
          ); })()}

          {/* ═══════════════════════════════════════ */}
          {/* SCREEN 5: OPERATORS                    */}
          {/* ═══════════════════════════════════════ */}
          {screen === "operators" && (() => {
            const filteredOps = opsPageOperators.filter(op =>
              opsPageFilter === "all" ? true : opsPageFilter === "active" ? op.isActive : !op.isActive
            );
            const activeCount = opsPageOperators.filter(o => o.isActive).length;
            const selectedH = hospitals.find(h => h.code === opsPageHospital);
            return (
            <motion.div key="operators" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>Personnel Management</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary }}>Operators</h2>
              </div>

              {/* Hospital selector + filter */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <select value={opsPageHospital} onChange={e => { setOpsPageHospital(e.target.value); loadOpsPageOperators(e.target.value); setOpsPageFilter("all"); }}
                  style={{ ...inputStyle, maxWidth: 340, appearance: "none" }}>
                  <option value="" style={{ background: "#0a0a14" }}>Select A Hospital</option>
                  {hospitals.map(h => <option key={h.code} value={h.code} style={{ background: "#0a0a14" }}>{h.code} — {h.name}</option>)}
                </select>
                {opsPageHospital && (
                  <>
                    <select value={opsPageFilter} onChange={e => setOpsPageFilter(e.target.value as "all" | "active" | "inactive")}
                      style={{ ...inputStyle, maxWidth: 140, appearance: "none" }}>
                      <option value="all" style={{ background: "#0a0a14" }}>All</option>
                      <option value="active" style={{ background: "#0a0a14" }}>Active</option>
                      <option value="inactive" style={{ background: "#0a0a14" }}>Inactive</option>
                    </select>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#22C55E" }}>{activeCount} Active</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>{opsPageOperators.length - activeCount} Inactive</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: COPPER_LIGHT }}>{opsPageOperators.length} Total</span>
                    </div>
                  </>
                )}
              </div>

              {/* No hospital selected */}
              {!opsPageHospital && (
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#475569" }}>Select A Hospital To View Operators</div>
                </div>
              )}

              {/* Operator grid */}
              {opsPageHospital && (
                <div style={{ padding: "28px 24px", borderRadius: 20, background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}12` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COPPER_LIGHT }}>
                      {selectedH?.name || opsPageHospital} — {filteredOps.length} Operator{filteredOps.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {filteredOps.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#475569", fontSize: 13, fontWeight: 600 }}>
                      {opsPageFilter === "all" ? "No Operators Registered" : `No ${opsPageFilter === "active" ? "Active" : "Inactive"} Operators`}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {filteredOps.map((op, i) => {
                      const roleLabel = ROLE_OPTIONS.find(r => r.value === op.role)?.label || op.role;
                      const roleModules = ROLE_OPTIONS.find(r => r.value === op.role)?.modules || [];
                      return (
                        <motion.div key={op.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                          style={{ padding: "18px 16px", borderRadius: 16, background: op.isActive ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.01)", border: `1px solid ${op.isActive ? "#22C55E" + "20" : "rgba(255,255,255,0.04)"}`, position: "relative", overflow: "hidden" }}>
                          {/* Status dot + Name */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: op.isActive ? "#22C55E" : "#EF4444", flexShrink: 0 }} />
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary }}>{op.name}</div>
                          </div>

                          {/* Role badge */}
                          <div style={{ fontSize: 10, fontWeight: 700, color: COPPER_LIGHT, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{roleLabel}</div>

                          {/* Module tags */}
                          {roleModules.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                              {roleModules.slice(0, 3).map(m => {
                                const ws = [...ALL_WORKSTATIONS, ...UTILITY_STATIONS].find(w => w.key === m);
                                return <span key={m} style={{ padding: "2px 6px", borderRadius: 4, background: `${BLUE}08`, border: `1px solid ${BLUE}12`, fontSize: 8, fontWeight: 700, color: BLUE, textTransform: "uppercase", letterSpacing: "0.06em" }}>{ws?.title || m}</span>;
                              })}
                              {roleModules.length > 3 && <span style={{ fontSize: 8, color: "#475569", alignSelf: "center" }}>+{roleModules.length - 3}</span>}
                            </div>
                          )}

                          {/* Phone + PIN info */}
                          <div style={{ fontSize: 10, color: "#4A5568", marginBottom: 12 }}>
                            {op.phone && <span>{op.phone} · </span>}
                            <span>PIN ····</span>
                          </div>

                          {/* Action buttons */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <motion.button whileHover={{ scale: 1.05 }}
                              onClick={() => { setOpsPageEditOp(op); setOpsPageEditForm({ name: op.name, phone: op.phone || "", role: op.role, newPin: "" }); setOpsPageEditMsg(null); }}
                              style={{ padding: "5px 10px", borderRadius: 6, fontSize: 9, fontWeight: 700, color: BLUE, background: `${BLUE}08`, border: `1px solid ${BLUE}15`, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Edit
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.05 }}
                              onClick={() => handleOpsPageResetPin(op)}
                              style={{ padding: "5px 10px", borderRadius: 6, fontSize: 9, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Reset PIN
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.05 }}
                              onClick={() => handleOpsPageToggleOperator(op)}
                              style={{ padding: "5px 10px", borderRadius: 6, fontSize: 9, fontWeight: 700, color: op.isActive ? "#EF4444" : "#22C55E", background: op.isActive ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)", border: `1px solid ${op.isActive ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)"}`, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              {op.isActive ? "Deactivate" : "Activate"}
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Edit operator modal */}
              {opsPageEditOp && (
                <div onClick={() => setOpsPageEditOp(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}
                    style={{ width: 440, padding: "32px 28px", borderRadius: 20, background: "#0C0C16", border: `1px solid ${COPPER}20`, position: "relative" }}>
                    {/* Side accents */}
                    <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 4, background: "#4A3728", borderRadius: "20px 0 0 20px" }} />
                    <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 4, background: "#4A3728", borderRadius: "0 20px 20px 0" }} />

                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COPPER_LIGHT, marginBottom: 20 }}>Edit Operator</div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div><label style={labelStyle}>Name</label><input value={opsPageEditForm.name} onChange={e => setOpsPageEditForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
                      <div><label style={labelStyle}>Phone</label><input value={opsPageEditForm.phone} onChange={e => setOpsPageEditForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} /></div>
                      <div><label style={labelStyle}>Role</label>
                        <select value={opsPageEditForm.role} onChange={e => setOpsPageEditForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, appearance: "none" }}>
                          {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value} style={{ background: "#0a0a14" }}>{r.label}</option>)}
                        </select>
                      </div>
                      <div><label style={labelStyle}>New PIN (Leave Empty To Keep Current)</label><input type="password" maxLength={4} placeholder="····" value={opsPageEditForm.newPin} onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setOpsPageEditForm(f => ({ ...f, newPin: e.target.value })); }} style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.3em" }} /></div>
                    </div>

                    {opsPageEditMsg && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: opsPageEditMsg.type === "ok" ? "#22C55E" : "#EF4444" }}>{opsPageEditMsg.text}</div>}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                      <motion.button whileHover={{ scale: 1.03 }} onClick={() => setOpsPageEditOp(null)}
                        style={{ padding: "10px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#64748B", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>Cancel</motion.button>
                      <motion.button whileHover={{ scale: 1.03 }} onClick={handleOpsPageEditOperator}
                        style={{ padding: "10px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff", background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none", cursor: "pointer" }}>Save Changes</motion.button>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
            );
          })()}

          {/* ═══════════════════════════════════════ */}
          {/* SCREEN 6: AUDIT TRAIL                  */}
          {/* ═══════════════════════════════════════ */}
          {screen === "audit" && (
            <motion.div key="audit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>System Records</div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary }}>Audit Trail</h2>
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
                        {log.metadata && Object.keys(log.metadata).length > 0 && <div style={{ fontSize: 9, color: "#334155", marginTop: 2, fontFamily: fontFamily.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{JSON.stringify(log.metadata)}</div>}
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
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>Security & Access Control</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: fontFamily.primary }}>Access Management</h2>
              </div>

              {/* ─── Access Gate: re-authenticate before showing sensitive controls ─── */}
              {!accessUnlocked ? (
                <div style={{ maxWidth: 420, margin: "80px auto", textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 24px", background: `radial-gradient(circle, ${COPPER}08, transparent 70%)`, border: `1px solid ${COPPER}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={COPPER} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><rect x="10" y="10" width="4" height="5" rx="0.5" /><circle cx="12" cy="8.5" r="1.5" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#F0F4FF", marginBottom: 6, fontFamily: fontFamily.primary }}>Owner Authentication Required</div>
                  <div style={{ fontSize: 13, color: "#64748B", marginBottom: 24 }}>Re-enter your Ops password to access security controls.</div>
                  <form onSubmit={e => { e.preventDefault(); handleAccessGateUnlock(); }}>
                    <input type="password" value={accessGatePass} onChange={e => { setAccessGatePass(e.target.value); setAccessGateError(""); }} placeholder="Enter Ops Password" autoFocus
                      style={{ width: "100%", padding: "14px 18px", borderRadius: 12, fontSize: 13, fontWeight: 500, color: "#E2E8F0", background: "rgba(255,255,255,0.03)", border: `1.5px solid ${accessGateError ? "rgba(239,68,68,0.4)" : accessGatePass ? COPPER + "30" : "rgba(255,255,255,0.06)"}`, outline: "none", fontFamily: fontFamily.mono, marginBottom: 12 }} />
                    <motion.button type="submit" disabled={!accessGatePass.trim() || accessGateLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      style={{ width: "100%", padding: "13px 0", borderRadius: 12, cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", opacity: !accessGatePass.trim() ? 0.4 : 1, fontFamily: fontFamily.primary }}>
                      {accessGateLoading ? "Verifying..." : "Unlock Access Controls"}
                    </motion.button>
                  </form>
                  {accessGateError && <div style={{ marginTop: 12, fontSize: 13, color: "#EF4444", fontWeight: 600, padding: "8px 14px", borderRadius: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>{accessGateError}</div>}
                </div>
              ) : (
              <>

              {/* ─── Section A: Master Password ─── */}
              <div style={{ padding: "24px 20px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}10`, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>🔐</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: COPPER_LIGHT, letterSpacing: "0.06em", textTransform: "uppercase" }}>Ops Master Password</div>
                  <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: opsPassIsSet ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: opsPassIsSet ? "#22C55E" : "#F59E0B" }}>{opsPassIsSet ? "Set" : "Not Set"}</span>
                </div>
                <div style={{ fontSize: 13, color: "#64748B", marginBottom: 14 }}>This password protects the entire Ops platform. {opsPassIsSet ? "Enter your current password to change it." : "Set a password to secure access."}</div>
                <div style={{ display: "grid", gridTemplateColumns: opsPassIsSet ? "1fr 1fr 1fr" : "1fr 1fr", gap: 10 }}>
                  {opsPassIsSet && <input type="password" value={opsPassCurrent} onChange={e => { setOpsPassCurrent(e.target.value); setOpsPassMsg(null); }} placeholder="Current Password" style={{ ...inputStyle, padding: "12px 14px", fontSize: 14 }} />}
                  <input type="password" value={opsPassNew} onChange={e => { setOpsPassNew(e.target.value); setOpsPassMsg(null); }} placeholder="New Password (8+ Characters)" style={{ ...inputStyle, padding: "12px 14px", fontSize: 14 }} />
                  <input type="password" value={opsPassConfirm} onChange={e => { setOpsPassConfirm(e.target.value); setOpsPassMsg(null); }} placeholder="Confirm Password" style={{ ...inputStyle, padding: "12px 14px", fontSize: 14, borderColor: opsPassConfirm && opsPassConfirm === opsPassNew ? "rgba(34,197,94,0.3)" : opsPassConfirm ? "rgba(239,68,68,0.3)" : undefined }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                  <motion.button whileHover={{ scale: 1.02 }} onClick={handleSetOpsPassword} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "white", cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none" }}>{opsPassIsSet ? "Change Password" : "Set Password"}</motion.button>
                  {opsPassMsg && <span style={{ fontSize: 13, fontWeight: 600, color: opsPassMsg.type === "ok" ? "#22C55E" : "#F87171" }}>{opsPassMsg.text}</span>}
                </div>
              </div>

              {/* ─── Section B: Master PIN Per Hospital ─── */}
              <div style={{ padding: "24px 20px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}10`, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>🗝️</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: COPPER_LIGHT, letterSpacing: "0.06em", textTransform: "uppercase" }}>Hospital Master PINs</div>
                </div>
                <div style={{ fontSize: 13, color: "#64748B", marginBottom: 14 }}>A 4-digit master PIN that unlocks ALL workstations at a hospital as Super Admin. Use this for Dalxic staff access or emergency override.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: 10, alignItems: "end" }}>
                  <select value={masterPinHospital} onChange={e => setMasterPinHospital(e.target.value)} style={{ ...inputStyle, padding: "12px 14px", fontSize: 14 }}>
                    <option value="">Select Hospital...</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.code} — {h.name}</option>)}
                  </select>
                  <input type="password" value={masterPinValue} onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setMasterPinValue(e.target.value); setMasterPinMsg(null); }} placeholder="4-Digit PIN" maxLength={4} style={{ ...inputStyle, padding: "10px 12px", fontSize: 14, fontFamily: fontFamily.mono, textAlign: "center", letterSpacing: "0.3em" }} />
                  <motion.button whileHover={{ scale: 1.02 }} onClick={handleSetMasterPin} style={{ padding: "10px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "white", cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none", whiteSpace: "nowrap" as const }}>Set PIN</motion.button>
                </div>
                {masterPinMsg && <div style={{ fontSize: 13, fontWeight: 600, color: masterPinMsg.type === "ok" ? "#22C55E" : "#F87171", marginTop: 8 }}>{masterPinMsg.text}</div>}
                {/* Active master PINs */}
                {hospitals.filter(h => masterPinMap[h.id]).length > 0 && (
                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Active Master PINs</div>
                    {hospitals.filter(h => masterPinMap[h.id]).map(h => (
                      <div key={h.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.015)", border: `1px solid ${COPPER}08` }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0", fontFamily: fontFamily.mono }}>{h.code}</span>
                          <span style={{ fontSize: 13, color: "#64748B", marginLeft: 8 }}>{h.name}</span>
                          <span style={{ marginLeft: 10, fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 3, background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>PIN SET</span>
                        </div>
                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleRemoveMasterPin(h.id)} style={{ padding: "4px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, color: "#EF4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", cursor: "pointer" }}>Remove</motion.button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ─── Section C: Access Grants ─── */}
              <div style={{ padding: "24px 20px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}10`, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>👤</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: COPPER_LIGHT, letterSpacing: "0.06em", textTransform: "uppercase" }}>Staff Access Grants</div>
                </div>
                <div style={{ fontSize: 13, color: "#64748B", marginBottom: 14 }}>Grant temporary access for Dalxic staff to view or manage hospital data.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input value={newGrant.staffId} onChange={e => setNewGrant(g => ({ ...g, staffId: e.target.value }))} placeholder="Dalxic Staff ID" style={{ ...inputStyle, padding: "12px 14px", fontSize: 14 }} />
                  <select value={newGrant.hospitalId} onChange={e => setNewGrant(g => ({ ...g, hospitalId: e.target.value }))} style={{ ...inputStyle, padding: "12px 14px", fontSize: 14 }}><option value="">Select Hospital...</option>{hospitals.map(h => <option key={h.id} value={h.id}>{h.code} — {h.name}</option>)}</select>
                  <select value={newGrant.role} onChange={e => setNewGrant(g => ({ ...g, role: e.target.value }))} style={{ ...inputStyle, padding: "12px 14px", fontSize: 14 }}><option value="viewer">Viewer (Read Only)</option><option value="support">Support (Read + Notes)</option><option value="admin">Admin (Full Access)</option></select>
                  <select value={newGrant.hours} onChange={e => setNewGrant(g => ({ ...g, hours: e.target.value }))} style={{ ...inputStyle, padding: "12px 14px", fontSize: 14 }}><option value="1">1 Hour</option><option value="4">4 Hours</option><option value="8">8 Hours</option><option value="24">24 Hours</option><option value="72">3 Days</option><option value="168">7 Days</option></select>
                </div>
                <input value={newGrant.reason} onChange={e => setNewGrant(g => ({ ...g, reason: e.target.value }))} placeholder="Reason for access grant" style={{ ...inputStyle, padding: "12px 14px", fontSize: 14, marginTop: 10 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                  <motion.button whileHover={{ scale: 1.02 }} onClick={handleCreateGrant} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "white", cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none" }}>Grant Access</motion.button>
                  {grantMsg && <span style={{ fontSize: 13, fontWeight: 600, color: grantMsg.type === "ok" ? "#22C55E" : "#F87171" }}>{grantMsg.text}</span>}
                </div>
              </div>

              {/* Active Grants List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {accessGrants.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "#475569", fontSize: 13 }}>No Active Access Grants</div>}
                {accessGrants.map(grant => {
                  const expired = new Date(grant.expiresAt) < new Date();
                  return (
                    <div key={grant.id} style={{ padding: "14px 18px", borderRadius: 12, background: expired ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)", border: `1px solid ${expired ? "rgba(239,68,68,0.12)" : `${COPPER}10`}`, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: expired ? 0.5 : 1 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
                          {grant.dalxicStaff?.name || grant.dalxicStaffId}
                          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: grant.grantedRole === "admin" ? "rgba(239,68,68,0.1)" : grant.grantedRole === "support" ? "rgba(245,158,11,0.1)" : "rgba(14,165,233,0.1)", color: grant.grantedRole === "admin" ? "#F87171" : grant.grantedRole === "support" ? "#F59E0B" : "#38BDF8" }}>{grant.grantedRole.toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{grant.hospital?.name || "All"} — {grant.reason}</div>
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

              {/* ─── Section D: Ops Staff Management ─── */}
              <div style={{ padding: "24px 20px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}10`, marginTop: 20, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>👥</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: COPPER_LIGHT, letterSpacing: "0.06em", textTransform: "uppercase" }}>Ops Staff Accounts</div>
                  <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color: "#64748B" }}>{opsStaffList.filter(s => s.isActive).length} Active</span>
                </div>
                <div style={{ fontSize: 13, color: "#64748B", marginBottom: 14 }}>Add staff members who can log into Ops with their own email + PIN. Assign which screens they can access.</div>

                {/* Add Staff Form */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: 10 }}>
                  <input value={newStaff.name} onChange={e => setNewStaff(s => ({ ...s, name: e.target.value }))} placeholder="Full Name" style={{ ...inputStyle, padding: "12px 14px", fontSize: 14 }} />
                  <input value={newStaff.email} onChange={e => setNewStaff(s => ({ ...s, email: e.target.value }))} placeholder="Email Address" type="email" style={{ ...inputStyle, padding: "12px 14px", fontSize: 14 }} />
                  <input value={newStaff.pin} onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setNewStaff(s => ({ ...s, pin: e.target.value })); }} placeholder="PIN" maxLength={4} style={{ ...inputStyle, padding: "10px 12px", fontSize: 13, fontFamily: fontFamily.mono, textAlign: "center", letterSpacing: "0.3em" }} />
                </div>
                {/* Screen checkboxes */}
                <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                  {[{ key: "create-hospitals", label: "Create" }, { key: "hospitals", label: "Hospitals" }, { key: "operators", label: "Operators" }, { key: "audit", label: "Audit" }].map(sc => (
                    <label key={sc.key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: newStaff.screens.includes(sc.key) ? COPPER_LIGHT : "#64748B" }}>
                      <input type="checkbox" checked={newStaff.screens.includes(sc.key)} onChange={e => setNewStaff(s => ({ ...s, screens: e.target.checked ? [...s.screens, sc.key] : s.screens.filter(x => x !== sc.key) }))} style={{ accentColor: COPPER }} />
                      {sc.label}
                    </label>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                  <motion.button whileHover={{ scale: 1.02 }} onClick={handleCreateOpsStaff} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "white", cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none" }}>Add Staff</motion.button>
                  {staffMsg && <span style={{ fontSize: 13, fontWeight: 600, color: staffMsg.type === "ok" ? "#22C55E" : "#F87171" }}>{staffMsg.text}</span>}
                </div>

                {/* Staff List */}
                {opsStaffList.length > 0 && (
                  <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Staff Members</div>
                    {opsStaffList.map(staff => (
                      <div key={staff.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.015)", border: `1px solid ${COPPER}08`, opacity: staff.isActive ? 1 : 0.5 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: staff.isActive ? "#22C55E" : "#EF4444" }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>{staff.name}</span>
                            <span style={{ fontSize: 10, color: "#64748B", fontFamily: fontFamily.mono }}>{staff.email}</span>
                          </div>
                          <div style={{ display: "flex", gap: 6, marginTop: 6, marginLeft: 15 }}>
                            {(staff.allowedScreens || []).map((sc: string) => (
                              <span key={sc} style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 3, background: `${COPPER}08`, color: COPPER_LIGHT, textTransform: "uppercase", letterSpacing: "0.05em" }}>{sc === "create-hospitals" ? "Create" : sc}</span>
                            ))}
                            {staff.lastOpsLoginAt && <span style={{ fontSize: 9, color: "#475569", marginLeft: 6 }}>Last: {new Date(staff.lastOpsLoginAt).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <motion.button whileHover={{ scale: 1.05 }} onClick={() => setEditStaff({ id: staff.id, name: staff.name, screens: staff.allowedScreens || [], resetPin: "" })}
                            style={{ padding: "5px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, color: COPPER_LIGHT, background: `${COPPER}06`, border: `1px solid ${COPPER}12`, cursor: "pointer" }}>Edit</motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleToggleOpsStaff(staff.id)}
                            style={{ padding: "5px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, color: staff.isActive ? "#F59E0B" : "#22C55E", background: staff.isActive ? "rgba(245,158,11,0.06)" : "rgba(34,197,94,0.06)", border: `1px solid ${staff.isActive ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)"}`, cursor: "pointer" }}>{staff.isActive ? "Deactivate" : "Activate"}</motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Edit Staff Modal */}
              <AnimatePresence>
                {editStaff && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setEditStaff(null)}>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ width: 400, padding: "28px 24px", borderRadius: 20, background: "rgba(10,8,20,0.95)", border: `1px solid ${COPPER}15`, boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: COPPER_LIGHT, marginBottom: 20 }}>Edit Staff Member</div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={labelStyle}>Name</div>
                        <input value={editStaff.name} onChange={e => setEditStaff(s => s ? { ...s, name: e.target.value } : s)} style={{ ...inputStyle, padding: "12px 14px", fontSize: 14 }} />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={labelStyle}>Reset PIN (Leave Empty To Keep)</div>
                        <input value={editStaff.resetPin} onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setEditStaff(s => s ? { ...s, resetPin: e.target.value } : s); }} placeholder="New 4-Digit PIN" maxLength={4} style={{ ...inputStyle, padding: "10px 12px", fontSize: 13, fontFamily: fontFamily.mono, textAlign: "center", letterSpacing: "0.3em" }} />
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <div style={labelStyle}>Allowed Screens</div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
                          {[{ key: "create-hospitals", label: "Create" }, { key: "hospitals", label: "Hospitals" }, { key: "operators", label: "Operators" }, { key: "audit", label: "Audit" }].map(sc => (
                            <label key={sc.key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: editStaff.screens.includes(sc.key) ? COPPER_LIGHT : "#64748B" }}>
                              <input type="checkbox" checked={editStaff.screens.includes(sc.key)} onChange={e => setEditStaff(s => s ? { ...s, screens: e.target.checked ? [...s.screens, sc.key] : s.screens.filter(x => x !== sc.key) } : s)} style={{ accentColor: COPPER }} />
                              {sc.label}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <motion.button whileHover={{ scale: 1.02 }} onClick={handleEditOpsStaff} style={{ padding: "10px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "white", cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none" }}>Save Changes</motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} onClick={() => setEditStaff(null)} style={{ padding: "10px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>Cancel</motion.button>
                        {editStaffMsg && <span style={{ fontSize: 13, fontWeight: 600, color: editStaffMsg.type === "ok" ? "#22C55E" : "#F87171" }}>{editStaffMsg.text}</span>}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              </>
              )}
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
  const [opsSession, setOpsSession] = useState<OpsSession | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(OPS_KEY);
      if (stored) {
        const session = JSON.parse(stored) as OpsSession;
        if (session.authenticated && session.expiresAt > Date.now()) setOpsSession(session);
        else sessionStorage.removeItem(OPS_KEY);
      }
    } catch { /* */ }
    setChecking(false);
  }, []);

  const handleLogout = () => { sessionStorage.removeItem(OPS_KEY); setOpsSession(null); };
  if (checking) return null;
  return opsSession ? <OperatingPlatform onLogout={handleLogout} session={opsSession} /> : <EncryptedGate onUnlock={(s) => setOpsSession(s)} />;
}
