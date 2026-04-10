"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TIER_DEFAULTS, ALL_WORKSTATIONS, UTILITY_STATIONS, type TierKey } from "@/lib/tier-defaults";

/* ─── Constants ─── */
const COPPER = "#B87333";
const COPPER_LIGHT = "#D4956B";
const BLUE = "#0EA5E9";
const OPS_KEY = "dalxic_ops_session";

// SHA-256 hash of the passphrase — never store the passphrase itself
// To change: run crypto.subtle.digest on new passphrase, update this hash
// SHA-256 hash of the passphrase — reserved for future verification
// const PASSPHRASE_HASH = "a0f3b8c2d4e6f8a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7";

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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;
    setVerifying(true);
    setError(null);

    // Hash the passphrase with SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase.trim());
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // For now, accept any passphrase that is 8+ chars with the prefix "dalxic-"
    // In production, compare hashHex against PASSPHRASE_HASH
    const isValid = passphrase.trim().startsWith("dalxic-") && passphrase.trim().length >= 12;

    if (isValid) {
      setUnlocked(true);
      // Store session (expires in 8 hours)
      const session = {
        authenticated: true,
        expiresAt: Date.now() + 8 * 60 * 60 * 1000,
        hash: hashHex.slice(0, 16),
      };
      sessionStorage.setItem(OPS_KEY, JSON.stringify(session));
      setTimeout(onUnlock, 800);
    } else {
      setError("Access Denied — Invalid Encryption Key");
      setPassphrase("");
      setVerifying(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 120% 80% at 55% 40%, rgba(10,6,4,1) 0%, rgba(4,2,8,1) 50%, rgba(1,2,6,1) 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      <GalaxyCanvas />

      {/* Subtle radial glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(184,115,51,0.04) 0%, transparent 55%)", pointerEvents: "none" }} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative", zIndex: 1, textAlign: "center",
          padding: "56px 48px", borderRadius: 28,
          background: "rgba(255,255,255,0.015)",
          border: "1px solid rgba(184,115,51,0.08)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          minWidth: 420, maxWidth: 460,
          boxShadow: `0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)`,
        }}
      >
        {/* Top accent line */}
        <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: `linear-gradient(90deg, transparent, ${COPPER}30, transparent)` }} />

        {/* Shield icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ marginBottom: 28 }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: "0 auto",
            background: `radial-gradient(circle, ${COPPER}08, transparent 70%)`,
            border: `1px solid ${COPPER}15`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 48px ${COPPER}08`,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COPPER} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <rect x="10" y="10" width="4" height="5" rx="0.5" />
              <circle cx="12" cy="8.5" r="1.5" />
            </svg>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: COPPER, marginBottom: 8, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
            Dalxic Health
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F0F4FF", marginBottom: 6, fontFamily: "var(--font-outfit), Outfit, sans-serif", letterSpacing: "-0.02em" }}>
            Operating Platform
          </h1>
          <p style={{ fontSize: 11, color: "#4A5568", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
            Encrypted Access Required
          </p>
        </motion.div>

        {/* Divider */}
        <div style={{ width: 48, height: 1, background: `linear-gradient(90deg, transparent, ${COPPER}25, transparent)`, margin: "28px auto" }} />

        {/* Input */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div style={{ position: "relative", marginBottom: 20 }}>
            <input
              ref={inputRef}
              type="password"
              value={passphrase}
              onChange={e => { setPassphrase(e.target.value); setError(null); }}
              placeholder="Enter Encryption Key"
              disabled={verifying && !error}
              autoComplete="off"
              spellCheck={false}
              style={{
                width: "100%", padding: "16px 20px 16px 48px", borderRadius: 14,
                fontSize: 14, fontWeight: 500, color: "#E2E8F0", letterSpacing: "0.04em",
                background: "rgba(255,255,255,0.03)",
                border: `1.5px solid ${error ? "rgba(239,68,68,0.4)" : passphrase ? COPPER + "30" : "rgba(255,255,255,0.06)"}`,
                outline: "none", transition: "all 0.25s ease",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                boxShadow: passphrase ? `0 0 24px ${COPPER}08` : "none",
              }}
              onFocus={e => { e.target.style.borderColor = COPPER + "40"; e.target.style.boxShadow = `0 0 32px ${COPPER}10`; }}
              onBlur={e => { if (!passphrase) { e.target.style.borderColor = "rgba(255,255,255,0.06)"; e.target.style.boxShadow = "none"; } }}
            />
            {/* Lock icon inside input */}
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={passphrase ? COPPER : "#4A5568"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", transition: "stroke 0.2s" }}
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={!passphrase.trim() || (verifying && !error)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{
              width: "100%", padding: "15px 0", borderRadius: 14, cursor: "pointer",
              background: unlocked
                ? "linear-gradient(135deg, #22C55E, #16A34A)"
                : `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`,
              border: "none", color: "#fff", fontWeight: 700, fontSize: 13,
              letterSpacing: "0.1em", textTransform: "uppercase",
              opacity: !passphrase.trim() ? 0.4 : 1,
              transition: "all 0.3s ease",
              fontFamily: "var(--font-outfit), Outfit, sans-serif",
              boxShadow: unlocked ? "0 8px 32px rgba(34,197,94,0.3)" : `0 8px 32px ${COPPER}20`,
            }}
          >
            {unlocked ? "Access Granted" : verifying && !error ? "Verifying..." : "Authenticate"}
          </motion.button>
        </motion.form>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                marginTop: 16, fontSize: 11, color: "#EF4444", fontWeight: 600,
                padding: "10px 16px", borderRadius: 10,
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.12)",
                letterSpacing: "0.04em",
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success animation */}
        <AnimatePresence>
          {unlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                marginTop: 16, fontSize: 12, color: "#22C55E", fontWeight: 600,
                letterSpacing: "0.1em",
              }}
            >
              Decrypting Platform...
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{ position: "absolute", bottom: 28, fontSize: 9, color: "#1E293B", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
      >
        Dalxic &mdash; Classified
      </motion.p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   OPERATING PLATFORM — Master Control
   ═══════════════════════════════════════════════════════════════════════════════ */

type OpsView = "command" | "hospitals" | "operators" | "tiers" | "audit" | "modules" | "groups" | "access";

interface HospitalItem {
  id: string; code: string; name: string; subdomain: string;
  tier: string; active: boolean;
  groupId?: string | null; groupCode?: string | null;
  group?: { groupCode: string; name: string } | null;
  _count: { devices: number; monthlyBooks: number; patientRecords: number };
}

interface GroupedHospitals {
  groups: { groupCode: string; groupName: string; hospitals: HospitalItem[] }[];
  standalone: HospitalItem[];
}

function groupHospitals(hospitals: HospitalItem[]): GroupedHospitals {
  const groupMap = new Map<string, { groupName: string; hospitals: HospitalItem[] }>();
  const standalone: HospitalItem[] = [];
  for (const h of hospitals) {
    if (h.group?.groupCode) {
      const existing = groupMap.get(h.group.groupCode);
      if (existing) { existing.hospitals.push(h); }
      else { groupMap.set(h.group.groupCode, { groupName: h.group.name, hospitals: [h] }); }
    } else {
      standalone.push(h);
    }
  }
  const groups = Array.from(groupMap.entries()).map(([groupCode, data]) => ({
    groupCode, groupName: data.groupName, hospitals: data.hospitals,
  }));
  return { groups, standalone };
}

interface OperatorItem {
  id: string; name: string; phone: string | null;
  role: string; isActive: boolean; lastLoginAt: string | null;
}

/* ─── Tier Visual Card ─── */
function TierCard({ tierKey, active, onClick }: { tierKey: TierKey; active: boolean; onClick: () => void }) {
  const tier = TIER_DEFAULTS[tierKey];
  const colors: Record<string, string> = { T1: "#22C55E", T2: BLUE, T3: COPPER, T4: "#A855F7" };
  const color = colors[tierKey] || COPPER;
  const moduleCount = tier.modules.length;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer",
        padding: "28px 24px", borderRadius: 20,
        background: active ? `${color}08` : "rgba(255,255,255,0.02)",
        border: `1.5px solid ${active ? color + "40" : "rgba(255,255,255,0.05)"}`,
        backdropFilter: "blur(12px)",
        boxShadow: active ? `0 8px 32px ${color}12, inset 0 1px 0 rgba(255,255,255,0.03)` : "inset 0 1px 0 rgba(255,255,255,0.02)",
        transition: "all 0.3s ease",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Top accent */}
      {active && <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{
          fontSize: 28, fontWeight: 800, color,
          fontFamily: "var(--font-outfit), Outfit, sans-serif",
          letterSpacing: "-0.02em",
          textShadow: active ? `0 0 24px ${color}30` : "none",
        }}>
          {tierKey}
        </div>
        <div style={{
          padding: "4px 12px", borderRadius: 8,
          background: `${color}10`, border: `1px solid ${color}20`,
          fontSize: 10, fontWeight: 700, color, letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          {tier.maxDevices === 999 ? "Unlimited" : `${tier.maxDevices} Devices`}
        </div>
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, color: "#F0F4FF", marginBottom: 6, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
        {tier.label}
      </div>
      <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.6, marginBottom: 16 }}>
        {tier.description}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8" }}>{moduleCount} Modules</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8" }}>{tier.whatsappBundlePerMonth.toLocaleString()} WhatsApp/Mo</span>
        </div>
      </div>
    </motion.button>
  );
}

/* ─── Module Badge ─── */
function ModuleBadge({ ws, included }: { ws: typeof ALL_WORKSTATIONS[number]; included: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      borderRadius: 12,
      background: included ? "rgba(184,115,51,0.06)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${included ? COPPER + "20" : "rgba(255,255,255,0.04)"}`,
      opacity: included ? 1 : 0.4,
      transition: "all 0.2s",
    }}>
      <span style={{ fontSize: 18 }}>{ws.icon}</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: included ? "#E2E8F0" : "#4A5568" }}>{ws.title}</div>
        <div style={{ fontSize: 10, color: "#64748B" }}>{ws.desc}</div>
      </div>
      {included && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: "auto", flexShrink: 0 }}>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ value, label, color = COPPER, icon }: { value: string | number; label: string; color?: string; icon: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "24px 20px", borderRadius: 18,
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${color}12`,
        backdropFilter: "blur(12px)",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: `linear-gradient(90deg, transparent, ${color}20, transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B" }}>{label}</span>
      </div>
      <div style={{
        fontSize: 32, fontWeight: 800, color,
        fontFamily: "var(--font-outfit), Outfit, sans-serif",
        letterSpacing: "-0.02em",
      }}>
        {value}
      </div>
    </motion.div>
  );
}

/* ─── Nav Pill ─── */
function NavPill({ label, icon, active, onClick, color = COPPER }: {
  label: string; icon: string; active: boolean; onClick: () => void; color?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        padding: "10px 20px", borderRadius: 12, cursor: "pointer",
        background: active ? `${color}10` : "transparent",
        border: `1px solid ${active ? color + "30" : "transparent"}`,
        color: active ? color : "#64748B",
        fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8,
        transition: "all 0.2s",
        fontFamily: "var(--font-outfit), Outfit, sans-serif",
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      {label}
    </motion.button>
  );
}

/* ═══════════ MAIN OPERATING PLATFORM ═══════════ */

function OperatingPlatform({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<OpsView>("command");
  const [hospitals, setHospitals] = useState<HospitalItem[]>([]);
  const [operators, setOperators] = useState<OperatorItem[]>([]);
  const [selectedTier, setSelectedTier] = useState<TierKey>("T1");
  const [selectedHospital, setSelectedHospital] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Online operators
  const [onlineOps, setOnlineOps] = useState(0);

  // Group folding
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (groupCode: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupCode)) next.delete(groupCode); else next.add(groupCode);
      return next;
    });
  };
  const grouped = groupHospitals(hospitals);

  // New hospital form
  const [newHospital, setNewHospital] = useState({ code: "", name: "", subdomain: "", tier: "T1" as string, tagline: "", groupCode: "" });
  const [addingHospital, setAddingHospital] = useState(false);

  // New operator form
  const [newOp, setNewOp] = useState({ name: "", phone: "", pin: "", role: "front_desk" });
  const [addingOp, setAddingOp] = useState(false);
  const [opMsg, setOpMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Group management
  interface GroupDetail { id: string; groupCode: string; name: string; ownerName: string; subscriptionTier: string; isActive: boolean; hospitals: { id: string; code: string; name: string; tier: string; active: boolean; activeModules: string[]; _count: { patientRecords: number; devices: number } }[] }
  interface GroupDashboard { group: { groupCode: string; name: string; ownerName: string; subscriptionTier: string }; branches: { code: string; name: string; tier: string; modules: number; totalPatients: number; todayPatients: number; operators: number; revenue: number }[]; totals: { patients: number; todayPatients: number; operators: number; revenue: number; branches: number }; activeReferrals: { id: string; fromHospitalCode: string; toHospitalCode: string; department: string; priority: string; status: string; patientName: string; createdAt: string }[] }
  const [allGroups, setAllGroups] = useState<{ groupCode: string; name: string; hospitals: { code: string; name: string }[] }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null);
  const [groupDashboard, setGroupDashboard] = useState<GroupDashboard | null>(null);
  const [newGroup, setNewGroup] = useState({ groupCode: "", name: "", ownerName: "", ownerPin: "" });
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupMsg, setGroupMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [linkHospitalCode, setLinkHospitalCode] = useState("");

  // Access grants state
  interface AccessGrantItem { id: string; dalxicStaffId: string; grantedRole: string; grantedBy: string; reason: string; isActive: boolean; grantedAt: string; expiresAt: string; revokedAt: string | null; dalxicStaff?: { name: string; email: string }; hospital?: { code: string; name: string } }
  const [accessGrants, setAccessGrants] = useState<AccessGrantItem[]>([]);
  const [newGrant, setNewGrant] = useState({ staffId: "", hospitalId: "", role: "viewer", reason: "", hours: "24" });
  const [grantMsg, setGrantMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Tier upgrade
  const [tierTarget, setTierTarget] = useState("");
  const [tierMsg, setTierMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const handleTierUpgrade = async () => {
    if (!tierTarget || !selectedTier) return;
    setTierMsg(null);
    const res = await fetch("/api/hospitals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalCode: tierTarget, newTier: selectedTier, actorId: "ops-admin" }),
    });
    if (res.ok) {
      setTierMsg({ type: "ok", text: `${tierTarget} upgraded to ${selectedTier}` });
      setTierTarget("");
      loadHospitals();
    } else {
      const err = await res.json();
      setTierMsg({ type: "err", text: err.error || "Upgrade failed" });
    }
  };

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<{ id: string; actorType: string; actorId: string; action: string; metadata: Record<string, unknown>; ipAddress: string; timestamp: string; hospital?: { code: string; name: string } }[]>([]);
  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/audit?limit=100");
      if (res.ok) setAuditLogs(await res.json());
    } catch { /* */ }
  }, []);

  const loadAccessGrants = useCallback(async () => {
    try {
      const res = await fetch("/api/access-grants");
      if (res.ok) setAccessGrants(await res.json());
    } catch { /* */ }
  }, []);

  const handleCreateGrant = async () => {
    if (!newGrant.staffId || !newGrant.hospitalId || !newGrant.reason) { setGrantMsg({ type: "err", text: "All fields required" }); return; }
    const expiresAt = new Date(Date.now() + parseInt(newGrant.hours) * 60 * 60 * 1000).toISOString();
    const res = await fetch("/api/access-grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dalxicStaffId: newGrant.staffId, hospitalId: newGrant.hospitalId, grantedRole: newGrant.role, grantedBy: "ops-admin", expiresAt, reason: newGrant.reason }),
    });
    if (res.ok) {
      setGrantMsg({ type: "ok", text: "Access granted" });
      setNewGrant({ staffId: "", hospitalId: "", role: "viewer", reason: "", hours: "24" });
      loadAccessGrants();
    } else {
      const err = await res.json();
      setGrantMsg({ type: "err", text: err.error || "Failed" });
    }
  };

  const handleRevokeGrant = async (grantId: string) => {
    const res = await fetch("/api/access-grants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grantId, revokedBy: "ops-admin" }),
    });
    if (res.ok) loadAccessGrants();
  };

  const loadHospitals = useCallback(async () => {
    try {
      const res = await fetch("/api/hospitals");
      if (res.ok) setHospitals(await res.json());
    } catch { /* */ }
  }, []);

  const loadOperators = useCallback(async (hospitalCode: string) => {
    if (!hospitalCode) { setOperators([]); return; }
    try {
      const res = await fetch(`/api/operators?hospitalCode=${hospitalCode}&activeOnly=false`);
      if (res.ok) {
        const data = await res.json();
        setOperators(data.operators || []);
      }
    } catch { /* */ }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) setAllGroups(await res.json());
    } catch { /* */ }
  }, []);

  const loadGroupDetail = useCallback(async (groupCode: string) => {
    if (!groupCode) { setGroupDetail(null); setGroupDashboard(null); return; }
    try {
      const [detailRes, dashRes] = await Promise.all([
        fetch(`/api/groups?groupCode=${groupCode}`),
        fetch(`/api/groups/dashboard?groupCode=${groupCode}`),
      ]);
      if (detailRes.ok) setGroupDetail(await detailRes.json());
      if (dashRes.ok) setGroupDashboard(await dashRes.json());
    } catch { /* */ }
  }, []);

  // Fetch online operator count across all hospitals
  const loadOnlineCount = useCallback(async (hosList: typeof hospitals) => {
    if (hosList.length === 0) { setOnlineOps(0); return; }
    try {
      const results = await Promise.all(
        hosList.map(h => fetch(`/api/operators?hospitalCode=${h.code}`).then(r => r.ok ? r.json() : { onlineCount: 0 }))
      );
      setOnlineOps(results.reduce((s: number, r: { onlineCount?: number }) => s + (r.onlineCount || 0), 0));
    } catch { setOnlineOps(0); }
  }, []);

  useEffect(() => { loadHospitals(); loadGroups(); }, [loadHospitals, loadGroups]);
  useEffect(() => { if (hospitals.length > 0) loadOnlineCount(hospitals); }, [hospitals, loadOnlineCount]);
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // When hospital changes, load operators
  useEffect(() => {
    if (selectedHospital) loadOperators(selectedHospital);
  }, [selectedHospital, loadOperators]);

  // When group changes, load detail + dashboard
  useEffect(() => {
    if (selectedGroup) loadGroupDetail(selectedGroup);
  }, [selectedGroup, loadGroupDetail]);

  const handleAddHospital = async () => {
    const { code, name, subdomain } = newHospital;
    if (!code || !name || !subdomain) return;
    setAddingHospital(true);
    try {
      const res = await fetch("/api/hospitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, subdomain, tier: newHospital.tier, tagline: newHospital.tagline, actorId: "dalxic_ops" }),
      });
      if (!res.ok) { const err = await res.json(); setGroupMsg({ type: "err", text: err.error || "Hospital creation failed" }); return; }
      // If groupCode selected, link hospital to group
      if (newHospital.groupCode) {
        await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "link_hospital", groupCode: newHospital.groupCode, hospitalCode: code, actorId: "dalxic_ops" }),
        });
      }
      setNewHospital({ code: "", name: "", subdomain: "", tier: "T1", tagline: "", groupCode: "" });
      loadHospitals(); loadGroups();
    } finally { setAddingHospital(false); }
  };

  const handleCreateGroup = async () => {
    const { groupCode, name, ownerName, ownerPin } = newGroup;
    if (!groupCode || !name || !ownerName || ownerPin.length !== 4) return;
    setCreatingGroup(true); setGroupMsg(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", groupCode, name, ownerName, ownerPin, actorId: "dalxic_ops" }),
      });
      if (res.ok) {
        setGroupMsg({ type: "ok", text: `Group ${groupCode} created` });
        setNewGroup({ groupCode: "", name: "", ownerName: "", ownerPin: "" });
        loadGroups();
      } else {
        const err = await res.json();
        setGroupMsg({ type: "err", text: err.error || "Failed" });
      }
    } catch { setGroupMsg({ type: "err", text: "Network error" }); }
    finally { setCreatingGroup(false); }
  };

  const handleLinkHospital = async (groupCode: string, hospitalCode: string) => {
    setGroupMsg(null);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "link_hospital", groupCode, hospitalCode, actorId: "dalxic_ops" }),
    });
    if (res.ok) {
      setGroupMsg({ type: "ok", text: `${hospitalCode} linked to ${groupCode}` });
      loadHospitals(); loadGroups(); loadGroupDetail(groupCode);
      setLinkHospitalCode("");
    } else {
      const err = await res.json();
      setGroupMsg({ type: "err", text: err.error || "Failed" });
    }
  };

  const handleUnlinkHospital = async (hospitalCode: string) => {
    setGroupMsg(null);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unlink_hospital", hospitalCode, actorId: "dalxic_ops" }),
    });
    if (res.ok) {
      setGroupMsg({ type: "ok", text: `${hospitalCode} removed from group` });
      loadHospitals(); loadGroups(); if (selectedGroup) loadGroupDetail(selectedGroup);
    } else {
      const err = await res.json();
      setGroupMsg({ type: "err", text: err.error || "Failed" });
    }
  };

  const handleAddOperator = async () => {
    if (!selectedHospital || !newOp.name || !newOp.pin || !newOp.role) return;
    setAddingOp(true);
    setOpMsg(null);
    try {
      const res = await fetch("/api/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalCode: selectedHospital,
          action: "create",
          name: newOp.name, phone: newOp.phone, pin: newOp.pin, role: newOp.role,
        }),
      });
      if (res.ok) {
        setOpMsg({ type: "ok", text: `${newOp.name} added as ${newOp.role.replace("_", " ")}` });
        setNewOp({ name: "", phone: "", pin: "", role: "front_desk" });
        loadOperators(selectedHospital);
      } else {
        const err = await res.json();
        setOpMsg({ type: "err", text: err.error || "Failed to add operator" });
      }
    } catch {
      setOpMsg({ type: "err", text: "Network error" });
    } finally { setAddingOp(false); }
  };

  const handleToggleOperator = async (op: OperatorItem) => {
    if (!selectedHospital) return;
    await fetch("/api/operators", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalCode: selectedHospital, operatorId: op.id, isActive: !op.isActive }),
    });
    loadOperators(selectedHospital);
  };

  const totalPatients = hospitals.reduce((s, h) => s + h._count.patientRecords, 0);
  const totalDevices = hospitals.reduce((s, h) => s + h._count.devices, 0);
  const activeTierModules = TIER_DEFAULTS[selectedTier].modules;

  const ROLE_OPTIONS = [
    { value: "front_desk", label: "Front Desk / Records" },
    { value: "doctor", label: "Doctor" },
    { value: "specialist", label: "Specialist / Consultant" },
    { value: "surgeon", label: "Surgeon" },
    { value: "pharmacist", label: "Pharmacist" },
    { value: "lab_tech", label: "Lab Technician" },
    { value: "nurse", label: "Nurse" },
    { value: "midwife", label: "Midwife" },
    { value: "radiologist", label: "Radiologist" },
    { value: "sonographer", label: "Sonographer" },
    { value: "anaesthetist", label: "Anaesthetist" },
    { value: "physiotherapist", label: "Physiotherapist" },
    { value: "billing", label: "Billing / Accounts" },
    { value: "records", label: "Medical Records" },
    { value: "porter", label: "Porter / Orderly" },
    { value: "it_support", label: "IT Support" },
    { value: "admin", label: "Hospital Admin" },
    { value: "super_admin", label: "Super Admin (Dalxic)" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 120% 80% at 55% 20%, rgba(15,9,5,1) 0%, rgba(6,3,12,1) 45%, rgba(2,3,10,1) 100%)",
      position: "relative", overflow: "hidden", color: "#E2E8F0",
    }}>
      <GalaxyCanvas />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 15%, rgba(184,115,51,0.04) 0%, transparent 50%)", pointerEvents: "none" }} />

      {/* ─── Fixed Header ─── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "14px 36px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${COPPER}08`, background: "rgba(3,5,15,0.5)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Dalxic brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `linear-gradient(135deg, ${COPPER}20, ${COPPER}08)`,
              border: `1px solid ${COPPER}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COPPER} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: "-0.01em", color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
              Dalxic
            </span>
            <span style={{ fontWeight: 300, fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: COPPER }}>
              OPS
            </span>
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.06)" }} />

          {/* Nav pills */}
          <div style={{ display: "flex", gap: 2 }}>
            <NavPill icon="⚡" label="Command" active={view === "command"} onClick={() => setView("command")} />
            <NavPill icon="🏥" label="Hospitals" active={view === "hospitals"} onClick={() => setView("hospitals")} />
            <NavPill icon="📂" label="Groups" active={view === "groups"} onClick={() => setView("groups")} />
            <NavPill icon="👥" label="Operators" active={view === "operators"} onClick={() => setView("operators")} />
            <NavPill icon="📦" label="Tiers" active={view === "tiers"} onClick={() => setView("tiers")} />
            <NavPill icon="🧩" label="Modules" active={view === "modules"} onClick={() => setView("modules")} />
            <NavPill icon="📋" label="Audit" active={view === "audit"} onClick={() => { setView("audit"); loadAuditLogs(); }} />
            <NavPill icon="🔑" label="Access" active={view === "access"} onClick={() => { setView("access"); loadAccessGrants(); }} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.1em", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <motion.button
            onClick={onLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 10,
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
              color: "#EF4444", cursor: "pointer", fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}
          >
            Lock
          </motion.button>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main style={{ paddingTop: 80, paddingBottom: 60, maxWidth: 1200, margin: "0 auto", padding: "80px 36px 60px", position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">

          {/* ═══ COMMAND CENTER ═══ */}
          {view === "command" && (
            <motion.div key="command" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              {/* Hero */}
              <div style={{ marginBottom: 40 }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>
                    Operating Platform
                  </div>
                  <h1 style={{ fontSize: 36, fontWeight: 800, color: "#F0F4FF", marginBottom: 8, fontFamily: "var(--font-outfit), Outfit, sans-serif", letterSpacing: "-0.02em" }}>
                    Command Center
                  </h1>
                  <p style={{ fontSize: 13, color: "#64748B", maxWidth: 500 }}>
                    Master control for all DalxicHealth operations. Manage hospitals, operators, tiers, and system configuration.
                  </p>
                </motion.div>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: grouped.groups.length > 0 ? "repeat(5, 1fr)" : "repeat(4, 1fr)", gap: 16, marginBottom: 36 }}>
                <StatCard icon="🏥" label="Hospitals" value={hospitals.length} color={COPPER} />
                {grouped.groups.length > 0 && (
                  <StatCard icon="📂" label="Groups" value={grouped.groups.length} color={COPPER_LIGHT} />
                )}
                <StatCard icon="👤" label="Total Patients" value={totalPatients.toLocaleString()} color={BLUE} />
                <StatCard icon="📱" label="Operators Online" value={`${onlineOps} / ${totalDevices}`} color={onlineOps > 0 ? "#22C55E" : "#64748B"} />
                <StatCard icon="📦" label="Tier Templates" value={Object.keys(TIER_DEFAULTS).length} color="#A855F7" />
              </div>

              {/* Hospital quick list — grouped */}
              <div style={{ marginBottom: 36 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#64748B", marginBottom: 16 }}>
                  Registered Hospitals
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* ── Group folders ── */}
                  {grouped.groups.map((g) => {
                    const isOpen = !collapsedGroups.has(g.groupCode);
                    const groupPatients = g.hospitals.reduce((s, h) => s + h._count.patientRecords, 0);
                    const groupDevices = g.hospitals.reduce((s, h) => s + h._count.devices, 0);
                    return (
                      <motion.div key={g.groupCode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                        {/* Group header (folder) */}
                        <motion.div
                          onClick={() => toggleGroup(g.groupCode)}
                          whileHover={{ scale: 1.003 }}
                          style={{
                            padding: "14px 20px", borderRadius: isOpen ? "14px 14px 0 0" : 14,
                            background: "rgba(184,115,51,0.04)",
                            border: `1px solid ${COPPER}18`,
                            borderBottom: isOpen ? `1px solid ${COPPER}10` : `1px solid ${COPPER}18`,
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            cursor: "pointer", transition: "all 0.2s",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {/* Folder chevron */}
                            <motion.div
                              animate={{ rotate: isOpen ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COPPER} strokeWidth="2.5" strokeLinecap="round">
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            </motion.div>
                            {/* Group icon */}
                            <div style={{
                              width: 36, height: 36, borderRadius: 10,
                              background: `linear-gradient(135deg, ${COPPER}15, ${COPPER}08)`,
                              border: `1px solid ${COPPER}25`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 14,
                            }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COPPER} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                              </svg>
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: COPPER_LIGHT, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
                                {g.groupName}
                              </div>
                              <div style={{ fontSize: 10, color: "#64748B", fontFamily: "var(--font-jetbrains-mono), monospace", letterSpacing: "0.04em" }}>
                                {g.groupCode} &middot; {g.hospitals.length} {g.hospitals.length === 1 ? "Branch" : "Branches"}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 11, color: "#64748B" }}>{groupPatients} patients</div>
                              <div style={{ fontSize: 11, color: "#475569" }}>{groupDevices} devices</div>
                            </div>
                            <div style={{
                              padding: "3px 10px", borderRadius: 6,
                              background: `${COPPER}10`, border: `1px solid ${COPPER}20`,
                              fontSize: 9, fontWeight: 700, color: COPPER,
                              letterSpacing: "0.08em", textTransform: "uppercase",
                            }}>
                              Group
                            </div>
                          </div>
                        </motion.div>

                        {/* Branches (collapsible) */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              style={{
                                overflow: "hidden",
                                borderLeft: `1px solid ${COPPER}12`,
                                borderRight: `1px solid ${COPPER}12`,
                                borderBottom: `1px solid ${COPPER}12`,
                                borderRadius: "0 0 14px 14px",
                                background: "rgba(184,115,51,0.015)",
                              }}
                            >
                              {g.hospitals.map((h, i) => (
                                <motion.div
                                  key={h.id}
                                  initial={{ opacity: 0, x: -12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.04 }}
                                  style={{
                                    padding: "12px 20px 12px 52px",
                                    borderTop: i > 0 ? `1px solid rgba(255,255,255,0.03)` : "none",
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    cursor: "pointer", transition: "all 0.2s",
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(184,115,51,0.04)"; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                                  onClick={() => { setSelectedHospital(h.code); setView("operators"); }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    {/* Branch connector line */}
                                    <div style={{ width: 12, borderBottom: `1px solid ${COPPER}20`, marginRight: 2 }} />
                                    <div style={{
                                      minWidth: 40, padding: "4px 8px", borderRadius: 8,
                                      background: `${COPPER}06`, border: `1px solid ${COPPER}12`,
                                      fontSize: 10, fontWeight: 800, color: COPPER,
                                      fontFamily: "var(--font-jetbrains-mono), monospace",
                                      textAlign: "center",
                                    }}>
                                      {h.code}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>{h.name}</div>
                                      <div style={{ fontSize: 10, color: "#4A5568", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                                        {h.subdomain}.health.dalxic.com
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                    <div style={{ textAlign: "right" }}>
                                      <div style={{ fontSize: 10, color: "#64748B" }}>{h._count.patientRecords} patients</div>
                                      <div style={{ fontSize: 10, color: "#475569" }}>{h._count.devices} devices</div>
                                    </div>
                                    <div style={{
                                      padding: "3px 8px", borderRadius: 5,
                                      background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)",
                                      fontSize: 9, fontWeight: 700, color: "#22C55E",
                                      letterSpacing: "0.04em",
                                    }}>
                                      {h.tier}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}

                  {/* ── Standalone hospitals ── */}
                  {grouped.standalone.map((h, i) => (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        padding: "16px 20px", borderRadius: 14,
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = COPPER + "20"; e.currentTarget.style.background = "rgba(184,115,51,0.03)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                      onClick={() => { setSelectedHospital(h.code); setView("operators"); }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: `${COPPER}08`, border: `1px solid ${COPPER}15`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 800, color: COPPER,
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                        }}>
                          {h.code}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#F0F4FF" }}>{h.name}</div>
                          <div style={{ fontSize: 11, color: "#4A5568", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{h.subdomain}.health.dalxic.com</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: "#64748B" }}>{h._count.patientRecords} patients</div>
                          <div style={{ fontSize: 11, color: "#475569" }}>{h._count.devices} devices</div>
                        </div>
                        <div style={{
                          padding: "4px 10px", borderRadius: 6,
                          background: h.active ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                          border: `1px solid ${h.active ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                          fontSize: 10, fontWeight: 700, color: h.active ? "#22C55E" : "#EF4444",
                          letterSpacing: "0.06em",
                        }}>
                          {h.tier}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {hospitals.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#475569", fontSize: 13 }}>
                      No hospitals registered yet. Go to Hospitals to add one.
                    </div>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { icon: "➕", label: "Register Hospital", action: () => setView("hospitals") },
                  { icon: "👤", label: "Add Operator", action: () => setView("operators") },
                  { icon: "📦", label: "Deploy Tier", action: () => setView("tiers") },
                ].map((a, i) => (
                  <motion.button
                    key={i}
                    onClick={a.action}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: "20px", borderRadius: 14, cursor: "pointer",
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${COPPER}10`,
                      display: "flex", alignItems: "center", gap: 12,
                      textAlign: "left", transition: "all 0.2s",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{a.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.04em" }}>{a.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ HOSPITALS ═══ */}
          {view === "hospitals" && (
            <motion.div key="hospitals" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>Hospital Management</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Register & Manage Hospitals</h2>
              </div>

              {/* Add hospital form */}
              <div style={{
                padding: "28px 24px", borderRadius: 20, marginBottom: 28,
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${COPPER}12`,
                backdropFilter: "blur(12px)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COPPER_LIGHT, marginBottom: 20 }}>
                  New Hospital
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                  {[
                    { placeholder: "Hospital Code (e.g. KBH)", key: "code" as const, transform: (v: string) => v.toUpperCase() },
                    { placeholder: "Hospital Name", key: "name" as const },
                    { placeholder: "Subdomain (e.g. korlebu)", key: "subdomain" as const, transform: (v: string) => v.toLowerCase() },
                  ].map(f => (
                    <input
                      key={f.key}
                      placeholder={f.placeholder}
                      value={newHospital[f.key]}
                      onChange={e => setNewHospital(h => ({ ...h, [f.key]: f.transform ? f.transform(e.target.value) : e.target.value }))}
                      style={{
                        width: "100%", padding: "13px 16px", borderRadius: 12, fontSize: 13,
                        background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}12`,
                        color: "#E2E8F0", outline: "none",
                        fontFamily: "var(--font-outfit), Outfit, sans-serif",
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  <select
                    value={newHospital.tier}
                    onChange={e => setNewHospital(h => ({ ...h, tier: e.target.value }))}
                    style={{
                      width: "100%", padding: "13px 16px", borderRadius: 12, fontSize: 13,
                      background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}12`,
                      color: "#E2E8F0", outline: "none", appearance: "none",
                    }}
                  >
                    {(["T1", "T2", "T3", "T4"] as const).map(t => (
                      <option key={t} value={t} style={{ background: "#0a0a14" }}>{t} — {TIER_DEFAULTS[t].label}</option>
                    ))}
                  </select>
                  <select
                    value={newHospital.groupCode}
                    onChange={e => setNewHospital(h => ({ ...h, groupCode: e.target.value }))}
                    style={{
                      width: "100%", padding: "13px 16px", borderRadius: 12, fontSize: 13,
                      background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}12`,
                      color: "#E2E8F0", outline: "none", appearance: "none",
                    }}
                  >
                    <option value="" style={{ background: "#0a0a14" }}>No Group (Standalone)</option>
                    {allGroups.map(g => (
                      <option key={g.groupCode} value={g.groupCode} style={{ background: "#0a0a14" }}>{g.groupCode} — {g.name}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Tagline (Optional)"
                    value={newHospital.tagline}
                    onChange={e => setNewHospital(h => ({ ...h, tagline: e.target.value }))}
                    style={{
                      width: "100%", padding: "13px 16px", borderRadius: 12, fontSize: 13,
                      background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}12`,
                      color: "#E2E8F0", outline: "none",
                    }}
                  />
                  <motion.button
                    onClick={handleAddHospital}
                    disabled={addingHospital || !newHospital.code || !newHospital.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: "13px 20px", borderRadius: 12, cursor: "pointer",
                      background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`,
                      border: "none", color: "#fff", fontWeight: 700, fontSize: 13,
                      opacity: addingHospital || !newHospital.code ? 0.5 : 1,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {addingHospital ? "Registering..." : "Register Hospital"}
                  </motion.button>
                </div>
              </div>

              {/* Hospital list — grouped */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Group folders */}
                {grouped.groups.map((g) => {
                  const isOpen = !collapsedGroups.has(g.groupCode);
                  return (
                    <div key={g.groupCode}>
                      <motion.div
                        onClick={() => toggleGroup(g.groupCode)}
                        whileHover={{ scale: 1.003 }}
                        style={{
                          padding: "16px 20px", borderRadius: isOpen ? "14px 14px 0 0" : 14,
                          background: "rgba(184,115,51,0.04)",
                          border: `1px solid ${COPPER}18`,
                          borderBottom: isOpen ? `1px solid ${COPPER}10` : `1px solid ${COPPER}18`,
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }} style={{ display: "flex" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COPPER} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                          </motion.div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COPPER} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                          </svg>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 800, color: COPPER_LIGHT }}>{g.groupName}</span>
                            <span style={{ fontSize: 10, color: "#64748B", marginLeft: 10 }}>{g.groupCode} &middot; {g.hospitals.length} Branches</span>
                          </div>
                        </div>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.4)",
                        }} />
                      </motion.div>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            style={{
                              overflow: "hidden",
                              borderLeft: `1px solid ${COPPER}12`, borderRight: `1px solid ${COPPER}12`,
                              borderBottom: `1px solid ${COPPER}12`, borderRadius: "0 0 14px 14px",
                              background: "rgba(184,115,51,0.015)",
                            }}
                          >
                            {g.hospitals.map((h, i) => (
                              <div
                                key={h.id}
                                style={{
                                  padding: "14px 20px 14px 48px",
                                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none",
                                  display: "flex", alignItems: "center", justifyContent: "space-between",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <div style={{ width: 12, borderBottom: `1px solid ${COPPER}20` }} />
                                  <div style={{
                                    minWidth: 44, padding: "4px 8px", borderRadius: 8,
                                    background: `${COPPER}06`, border: `1px solid ${COPPER}12`,
                                    fontSize: 11, fontWeight: 800, color: COPPER, textAlign: "center",
                                    fontFamily: "var(--font-jetbrains-mono), monospace",
                                  }}>
                                    {h.code}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>{h.name}</div>
                                    <div style={{ fontSize: 10, color: "#4A5568", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                                      {h.subdomain}.health.dalxic.com &middot; {h.tier} &middot; {h._count.patientRecords} patients
                                    </div>
                                  </div>
                                </div>
                                <div style={{
                                  width: 8, height: 8, borderRadius: "50%",
                                  background: h.active ? "#22C55E" : "#EF4444",
                                  boxShadow: h.active ? "0 0 6px rgba(34,197,94,0.3)" : "0 0 6px rgba(239,68,68,0.3)",
                                }} />
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                {/* Standalone hospitals */}
                {grouped.standalone.map((h, i) => (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      padding: "18px 20px", borderRadius: 14,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: `${COPPER}08`, border: `1px solid ${COPPER}15`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 800, color: COPPER,
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                      }}>
                        {h.code}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#F0F4FF" }}>{h.name}</div>
                        <div style={{ fontSize: 11, color: "#4A5568", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                          {h.subdomain}.health.dalxic.com &middot; {h.tier} &middot; {h._count.patientRecords} patients &middot; {h._count.devices} devices
                        </div>
                      </div>
                    </div>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: h.active ? "#22C55E" : "#EF4444",
                      boxShadow: h.active ? "0 0 8px rgba(34,197,94,0.4)" : "0 0 8px rgba(239,68,68,0.4)",
                    }} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ OPERATORS ═══ */}
          {view === "operators" && (
            <motion.div key="operators" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>Operator Management</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Workstation Operators</h2>
              </div>

              {/* Hospital selector — grouped */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", marginBottom: 8 }}>Select Hospital</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {/* Group clusters */}
                  {grouped.groups.map(g => (
                    <div key={g.groupCode} style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 6px", borderRadius: 12, background: `${COPPER}06`, border: `1px solid ${COPPER}10` }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: COPPER, letterSpacing: "0.06em", padding: "0 6px", textTransform: "uppercase" }}>{g.groupCode}</span>
                      <div style={{ width: 1, height: 16, background: `${COPPER}15` }} />
                      {g.hospitals.map(h => (
                        <motion.button
                          key={h.code}
                          onClick={() => setSelectedHospital(h.code)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          style={{
                            padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                            background: selectedHospital === h.code ? `${COPPER}15` : "transparent",
                            border: `1px solid ${selectedHospital === h.code ? COPPER + "30" : "transparent"}`,
                            color: selectedHospital === h.code ? COPPER_LIGHT : "#64748B",
                            fontSize: 11, fontWeight: 700, letterSpacing: "0.03em",
                            transition: "all 0.2s",
                          }}
                        >
                          {h.code}
                        </motion.button>
                      ))}
                    </div>
                  ))}
                  {/* Standalone */}
                  {grouped.standalone.map(h => (
                    <motion.button
                      key={h.code}
                      onClick={() => setSelectedHospital(h.code)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        padding: "10px 18px", borderRadius: 10, cursor: "pointer",
                        background: selectedHospital === h.code ? `${COPPER}12` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${selectedHospital === h.code ? COPPER + "30" : "rgba(255,255,255,0.05)"}`,
                        color: selectedHospital === h.code ? COPPER_LIGHT : "#64748B",
                        fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
                        transition: "all 0.2s",
                      }}
                    >
                      {h.code} — {h.name}
                    </motion.button>
                  ))}
                </div>
              </div>

              {selectedHospital && (
                <>
                  {/* Add operator form */}
                  <div style={{
                    padding: "24px", borderRadius: 18, marginBottom: 24,
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${COPPER}10`,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COPPER_LIGHT, marginBottom: 18 }}>
                      Add Operator To {selectedHospital}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 1fr auto", gap: 12, alignItems: "end" }}>
                      <div>
                        <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748B", marginBottom: 6 }}>Full Name</label>
                        <input
                          placeholder="e.g. Ama Mensah"
                          value={newOp.name}
                          onChange={e => setNewOp(o => ({ ...o, name: e.target.value }))}
                          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}12`, color: "#E2E8F0", outline: "none" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748B", marginBottom: 6 }}>Phone (Optional)</label>
                        <input
                          placeholder="0244123456"
                          value={newOp.phone}
                          onChange={e => setNewOp(o => ({ ...o, phone: e.target.value }))}
                          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}12`, color: "#E2E8F0", outline: "none" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748B", marginBottom: 6 }}>PIN</label>
                        <input
                          placeholder="4 digits"
                          type="password"
                          maxLength={4}
                          value={newOp.pin}
                          onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setNewOp(o => ({ ...o, pin: e.target.value })); }}
                          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}12`, color: "#E2E8F0", outline: "none", textAlign: "center", letterSpacing: "0.3em", fontFamily: "var(--font-jetbrains-mono), monospace" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748B", marginBottom: 6 }}>Role</label>
                        <select
                          value={newOp.role}
                          onChange={e => setNewOp(o => ({ ...o, role: e.target.value }))}
                          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}12`, color: "#E2E8F0", outline: "none", appearance: "none" }}
                        >
                          {ROLE_OPTIONS.map(r => (
                            <option key={r.value} value={r.value} style={{ background: "#0a0a14" }}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                      <motion.button
                        onClick={handleAddOperator}
                        disabled={addingOp || !newOp.name || newOp.pin.length !== 4}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        style={{
                          padding: "12px 20px", borderRadius: 10, cursor: "pointer",
                          background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`,
                          border: "none", color: "#fff", fontWeight: 700, fontSize: 12,
                          opacity: addingOp || !newOp.name || newOp.pin.length !== 4 ? 0.4 : 1,
                          whiteSpace: "nowrap", letterSpacing: "0.04em",
                        }}
                      >
                        {addingOp ? "Adding..." : "Add"}
                      </motion.button>
                    </div>

                    {/* Feedback */}
                    <AnimatePresence>
                      {opMsg && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          style={{
                            marginTop: 14, fontSize: 11, fontWeight: 600,
                            padding: "8px 14px", borderRadius: 8,
                            background: opMsg.type === "ok" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                            border: `1px solid ${opMsg.type === "ok" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
                            color: opMsg.type === "ok" ? "#22C55E" : "#EF4444",
                          }}
                        >
                          {opMsg.text}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Operator list */}
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", marginBottom: 12 }}>
                    {operators.length} Operator{operators.length !== 1 ? "s" : ""} At {selectedHospital}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {operators.map((op, i) => (
                      <motion.div
                        key={op.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        style={{
                          padding: "14px 18px", borderRadius: 12,
                          background: "rgba(255,255,255,0.02)",
                          border: `1px solid ${op.isActive ? "rgba(255,255,255,0.04)" : "rgba(239,68,68,0.1)"}`,
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          opacity: op.isActive ? 1 : 0.5,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: op.isActive ? "#22C55E" : "#EF4444",
                            boxShadow: op.isActive ? "0 0 6px rgba(34,197,94,0.3)" : "none",
                          }} />
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#F0F4FF" }}>{op.name}</span>
                            {op.phone && <span style={{ fontSize: 11, color: "#475569", marginLeft: 8 }}>{op.phone}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 6,
                            background: `${BLUE}10`, border: `1px solid ${BLUE}20`,
                            fontSize: 10, fontWeight: 700, color: BLUE,
                            textTransform: "uppercase", letterSpacing: "0.06em",
                          }}>
                            {op.role.replace("_", " ")}
                          </span>
                          {op.lastLoginAt && (
                            <span style={{ fontSize: 10, color: "#475569", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                              Last: {new Date(op.lastLoginAt).toLocaleDateString("en-GB")}
                            </span>
                          )}
                          <motion.button
                            onClick={() => handleToggleOperator(op)}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            style={{
                              padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                              background: op.isActive ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)",
                              border: `1px solid ${op.isActive ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)"}`,
                              color: op.isActive ? "#EF4444" : "#22C55E",
                              fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                              textTransform: "uppercase",
                            }}
                          >
                            {op.isActive ? "Deactivate" : "Activate"}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                    {operators.length === 0 && selectedHospital && (
                      <div style={{ textAlign: "center", padding: "32px 0", color: "#475569", fontSize: 12 }}>
                        No operators registered for {selectedHospital}. Add one above.
                      </div>
                    )}
                  </div>
                </>
              )}

              {!selectedHospital && (
                <div style={{ textAlign: "center", padding: "48px 0", color: "#475569", fontSize: 13 }}>
                  Select a hospital above to manage its operators.
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ TIERS ═══ */}
          {view === "tiers" && (
            <motion.div key="tiers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>Deployment Templates</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Tier Templates</h2>
                <p style={{ fontSize: 13, color: "#64748B", marginTop: 8 }}>Pre-configured deployment packages. Select a tier to see included modules and specifications.</p>
              </div>

              {/* Tier cards grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 32 }}>
                {(["T1", "T2", "T3", "T4"] as const).map(t => (
                  <TierCard key={t} tierKey={t} active={selectedTier === t} onClick={() => setSelectedTier(t)} />
                ))}
              </div>

              {/* Module breakdown for selected tier */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", marginBottom: 14 }}>
                  {selectedTier} Module Breakdown — {activeTierModules.length} Active
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {ALL_WORKSTATIONS.map(ws => (
                    <ModuleBadge key={ws.key} ws={ws} included={(activeTierModules as readonly string[]).includes(ws.key)} />
                  ))}
                </div>
              </div>

              {/* Utility stations always included */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#475569", marginBottom: 12 }}>
                  Always Included (Utility)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {UTILITY_STATIONS.map(ws => (
                    <ModuleBadge key={ws.key} ws={ws as unknown as typeof ALL_WORKSTATIONS[number]} included />
                  ))}
                </div>
              </div>

              {/* Tier upgrade action */}
              <div style={{ marginTop: 28, padding: "20px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}10` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COPPER_LIGHT, marginBottom: 10 }}>Deploy {selectedTier} To Hospital</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select value={tierTarget} onChange={(e) => setTierTarget(e.target.value)}
                    style={{ flex: 1, padding: "9px 12px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "white", outline: "none" }}>
                    <option value="">Select Hospital...</option>
                    {hospitals.map(h => <option key={h.code} value={h.code}>{h.code} — {h.name} (Current: {h.tier})</option>)}
                  </select>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleTierUpgrade} disabled={!tierTarget}
                    style={{ padding: "9px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "white", cursor: tierTarget ? "pointer" : "not-allowed", background: tierTarget ? `linear-gradient(135deg, ${COPPER}, #D4956B)` : "rgba(255,255,255,0.03)", border: "none", opacity: tierTarget ? 1 : 0.4 }}>
                    Upgrade
                  </motion.button>
                </div>
                {tierMsg && <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: tierMsg.type === "ok" ? "#22C55E" : "#F87171" }}>{tierMsg.text}</div>}
              </div>
            </motion.div>
          )}

          {/* ═══ MODULES ═══ */}
          {view === "modules" && (
            <motion.div key="modules" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>System Architecture</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Module Registry</h2>
                <p style={{ fontSize: 13, color: "#64748B", marginTop: 8 }}>Complete station inventory. Each module is a self-contained LEGO block — plug in, plug out.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {ALL_WORKSTATIONS.map((ws, i) => {
                  const inTiers = (["T1", "T2", "T3", "T4"] as const).filter(t => (TIER_DEFAULTS[t].modules as readonly string[]).includes(ws.key));
                  return (
                    <motion.div
                      key={ws.key}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        padding: "20px", borderRadius: 16,
                        background: "rgba(255,255,255,0.02)",
                        border: `1px solid ${COPPER}08`,
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <span style={{ fontSize: 24 }}>{ws.icon}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#F0F4FF" }}>{ws.title}</div>
                          <div style={{ fontSize: 10, color: "#64748B" }}>{ws.role}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12, lineHeight: 1.5 }}>{ws.desc}</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {inTiers.map(t => {
                          const colors: Record<string, string> = { T1: "#22C55E", T2: BLUE, T3: COPPER, T4: "#A855F7" };
                          return (
                            <span key={t} style={{
                              padding: "2px 8px", borderRadius: 5,
                              background: `${colors[t]}10`, border: `1px solid ${colors[t]}20`,
                              fontSize: 9, fontWeight: 700, color: colors[t],
                            }}>
                              {t}
                            </span>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: 10, fontSize: 10, color: "#334155", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                        {ws.href}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Utility stations */}
              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#475569", marginBottom: 14 }}>
                  Utility Stations (Always Active)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {UTILITY_STATIONS.map(ws => (
                    <div key={ws.key} style={{
                      padding: "16px 18px", borderRadius: 14,
                      background: "rgba(255,255,255,0.015)",
                      border: "1px solid rgba(255,255,255,0.03)",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{ fontSize: 20 }}>{ws.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8" }}>{ws.title}</div>
                        <div style={{ fontSize: 10, color: "#475569" }}>{ws.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ GROUPS ═══ */}
          {view === "groups" && (
            <motion.div key="groups" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>Multi-Branch Management</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Hospital Groups</h2>
                <p style={{ fontSize: 13, color: "#64748B", marginTop: 8 }}>Create groups, link branches, and view consolidated dashboards.</p>
              </div>

              {/* Create group form */}
              <div style={{
                padding: "28px 24px", borderRadius: 20, marginBottom: 28,
                background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}12`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COPPER_LIGHT, marginBottom: 20 }}>
                  Create New Group
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 100px auto", gap: 12, alignItems: "end" }}>
                  <div>
                    <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748B", marginBottom: 6 }}>Group Code</label>
                    <input placeholder="e.g. NYAHO" value={newGroup.groupCode} onChange={e => setNewGroup(g => ({ ...g, groupCode: e.target.value.toUpperCase() }))}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}12`, color: "#E2E8F0", outline: "none", fontFamily: "var(--font-jetbrains-mono), monospace" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748B", marginBottom: 6 }}>Group Name</label>
                    <input placeholder="e.g. Nyaho Medical Centre" value={newGroup.name} onChange={e => setNewGroup(g => ({ ...g, name: e.target.value }))}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}12`, color: "#E2E8F0", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748B", marginBottom: 6 }}>Owner Name</label>
                    <input placeholder="e.g. Dr. Nyaho" value={newGroup.ownerName} onChange={e => setNewGroup(g => ({ ...g, ownerName: e.target.value }))}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}12`, color: "#E2E8F0", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748B", marginBottom: 6 }}>Owner PIN</label>
                    <input placeholder="4 digits" type="password" maxLength={4} value={newGroup.ownerPin}
                      onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setNewGroup(g => ({ ...g, ownerPin: e.target.value })); }}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}12`, color: "#E2E8F0", outline: "none", textAlign: "center", letterSpacing: "0.3em", fontFamily: "var(--font-jetbrains-mono), monospace" }} />
                  </div>
                  <motion.button onClick={handleCreateGroup} disabled={creatingGroup || !newGroup.groupCode || !newGroup.name || !newGroup.ownerName || newGroup.ownerPin.length !== 4}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{ padding: "12px 20px", borderRadius: 10, cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, opacity: creatingGroup || !newGroup.groupCode ? 0.4 : 1, whiteSpace: "nowrap" }}>
                    {creatingGroup ? "Creating..." : "Create"}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {groupMsg && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ marginTop: 14, fontSize: 11, fontWeight: 600, padding: "8px 14px", borderRadius: 8, background: groupMsg.type === "ok" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${groupMsg.type === "ok" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`, color: groupMsg.type === "ok" ? "#22C55E" : "#EF4444" }}>
                      {groupMsg.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Group selector */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", marginBottom: 8 }}>Select Group</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {allGroups.map(g => (
                    <motion.button key={g.groupCode} onClick={() => setSelectedGroup(g.groupCode)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      style={{
                        padding: "10px 18px", borderRadius: 10, cursor: "pointer",
                        background: selectedGroup === g.groupCode ? `${COPPER}12` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${selectedGroup === g.groupCode ? COPPER + "30" : "rgba(255,255,255,0.05)"}`,
                        color: selectedGroup === g.groupCode ? COPPER_LIGHT : "#64748B",
                        fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", transition: "all 0.2s",
                      }}>
                      {g.groupCode} — {g.name} ({g.hospitals.length})
                    </motion.button>
                  ))}
                  {allGroups.length === 0 && <span style={{ fontSize: 12, color: "#475569" }}>No groups yet. Create one above.</span>}
                </div>
              </div>

              {/* Selected group detail + dashboard */}
              {selectedGroup && groupDetail && (
                <>
                  {/* Dashboard stats */}
                  {groupDashboard && (
                    <div style={{ marginBottom: 28 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COPPER_LIGHT, marginBottom: 14 }}>
                        {groupDashboard.group.name} — Dashboard
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
                        <StatCard icon="🏥" label="Branches" value={groupDashboard.totals.branches} color={COPPER} />
                        <StatCard icon="👤" label="Total Patients" value={groupDashboard.totals.patients} color={BLUE} />
                        <StatCard icon="📅" label="Today" value={groupDashboard.totals.todayPatients} color="#22C55E" />
                        <StatCard icon="👥" label="Operators" value={groupDashboard.totals.operators} color="#A855F7" />
                        <StatCard icon="💰" label="Revenue (GHS)" value={groupDashboard.totals.revenue.toLocaleString()} color={COPPER_LIGHT} />
                      </div>

                      {/* Branch breakdown */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                        {groupDashboard.branches.map(b => (
                          <div key={b.code} style={{
                            padding: "14px 18px", borderRadius: 12,
                            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 12, borderBottom: `1px solid ${COPPER}20` }} />
                              <div style={{
                                minWidth: 50, padding: "4px 8px", borderRadius: 6, textAlign: "center",
                                background: `${COPPER}06`, border: `1px solid ${COPPER}12`,
                                fontSize: 10, fontWeight: 800, color: COPPER,
                                fontFamily: "var(--font-jetbrains-mono), monospace",
                              }}>{b.code}</div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>{b.name}</div>
                                <div style={{ fontSize: 10, color: "#475569" }}>{b.tier} &middot; {b.modules} modules</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 20 }}>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: BLUE }}>{b.totalPatients}</div>
                                <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.08em" }}>PATIENTS</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "#22C55E" }}>{b.todayPatients}</div>
                                <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.08em" }}>TODAY</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "#A855F7" }}>{b.operators}</div>
                                <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.08em" }}>OPS</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: COPPER_LIGHT }}>{b.revenue.toLocaleString()}</div>
                                <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.08em" }}>GHS</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Active referrals */}
                      {groupDashboard.activeReferrals.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", marginBottom: 10 }}>
                            Active Inter-Branch Referrals ({groupDashboard.activeReferrals.length})
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {groupDashboard.activeReferrals.map(r => {
                              const pColor = r.priority === "CRITICAL" ? "#EF4444" : r.priority === "URGENT" ? "#F59E0B" : "#22C55E";
                              return (
                                <div key={r.id} style={{
                                  padding: "10px 16px", borderRadius: 10,
                                  background: `${pColor}04`, border: `1px solid ${pColor}15`,
                                  display: "flex", alignItems: "center", justifyContent: "space-between",
                                  fontSize: 11,
                                }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ padding: "2px 6px", borderRadius: 4, background: `${pColor}15`, color: pColor, fontWeight: 800, fontSize: 9, letterSpacing: "0.06em" }}>{r.priority}</span>
                                    <span style={{ color: "#E2E8F0", fontWeight: 600 }}>{r.patientName}</span>
                                    <span style={{ color: "#475569" }}>&rarr; {r.department}</span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ color: "#64748B", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 10 }}>{r.fromHospitalCode} &rarr; {r.toHospitalCode}</span>
                                    <span style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)", color: BLUE, fontWeight: 700, fontSize: 9 }}>{r.status}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Link hospital form */}
                  <div style={{
                    padding: "20px 24px", borderRadius: 16, marginBottom: 20,
                    background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}10`,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COPPER_LIGHT, marginBottom: 14 }}>
                      Link Hospital To {selectedGroup}
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <select value={linkHospitalCode} onChange={e => setLinkHospitalCode(e.target.value)}
                        style={{ flex: 1, padding: "12px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.03)", border: `1px solid ${COPPER}12`, color: "#E2E8F0", outline: "none", appearance: "none" }}>
                        <option value="" style={{ background: "#0a0a14" }}>Select A Standalone Hospital...</option>
                        {hospitals.filter(h => !h.groupCode).map(h => (
                          <option key={h.code} value={h.code} style={{ background: "#0a0a14" }}>{h.code} — {h.name}</option>
                        ))}
                      </select>
                      <motion.button onClick={() => linkHospitalCode && handleLinkHospital(selectedGroup, linkHospitalCode)}
                        disabled={!linkHospitalCode} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        style={{ padding: "12px 20px", borderRadius: 10, cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, opacity: !linkHospitalCode ? 0.4 : 1, whiteSpace: "nowrap" }}>
                        Link
                      </motion.button>
                    </div>
                  </div>

                  {/* Group branch list with unlink */}
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", marginBottom: 10 }}>
                    {groupDetail.hospitals.length} Branches In {selectedGroup}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {groupDetail.hospitals.map(h => (
                      <div key={h.id} style={{
                        padding: "14px 18px", borderRadius: 12,
                        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            minWidth: 50, padding: "4px 8px", borderRadius: 8, textAlign: "center",
                            background: `${COPPER}06`, border: `1px solid ${COPPER}12`,
                            fontSize: 10, fontWeight: 800, color: COPPER,
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                          }}>{h.code}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>{h.name}</div>
                            <div style={{ fontSize: 10, color: "#475569" }}>{h.tier} &middot; {h._count.patientRecords} patients &middot; {h._count.devices} devices</div>
                          </div>
                        </div>
                        <motion.button onClick={() => handleUnlinkHospital(h.code)}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          style={{ padding: "5px 12px", borderRadius: 6, cursor: "pointer", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#EF4444", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          Unlink
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ═══ AUDIT ═══ */}
          {view === "audit" && (
            <motion.div key="audit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>System Records</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Audit Trail</h2>
                <p style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>Immutable log. Cannot be edited or deleted by any user level.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {auditLogs.length === 0 && (
                  <div style={{ padding: 32, textAlign: "center", color: "#475569", fontSize: 13 }}>No audit logs recorded yet</div>
                )}
                {auditLogs.map((log) => {
                  const isEmergency = log.action.includes("emergency");
                  return (
                    <div key={log.id} style={{
                      padding: "10px 14px", borderRadius: 10,
                      background: isEmergency ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.015)",
                      border: `1px solid ${isEmergency ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)"}`,
                      display: "flex", alignItems: "flex-start", gap: 10,
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", marginTop: 5, background: isEmergency ? "#EF4444" : log.action.includes("login") ? "#22C55E" : log.action.includes("created") ? COPPER : "#64748B", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{log.action}</span>
                          <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: "#64748B" }}>{log.actorType}</span>
                          {log.hospital && <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: `${COPPER}10`, color: COPPER_LIGHT }}>{log.hospital.code}</span>}
                        </div>
                        <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
                          Actor: {log.actorId} · IP: {log.ipAddress} · {new Date(log.timestamp).toLocaleString()}
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div style={{ fontSize: 9, color: "#334155", marginTop: 2, fontFamily: "var(--font-jetbrains-mono), monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {JSON.stringify(log.metadata)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══════ ACCESS GRANTS ═══════ */}
          {view === "access" && (
            <motion.div key="access" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 8 }}>Staff Access Control</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#F0F4FF", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Access Grants</h2>
              </div>

              {/* Create grant form */}
              <div style={{ padding: "24px 20px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: `1px solid ${COPPER}10`, marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COPPER_LIGHT, marginBottom: 14 }}>Grant Temporary Access</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input value={newGrant.staffId} onChange={(e) => setNewGrant(g => ({ ...g, staffId: e.target.value }))} placeholder="Dalxic Staff ID"
                    style={{ padding: "9px 12px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "white", outline: "none" }} />
                  <select value={newGrant.hospitalId} onChange={(e) => setNewGrant(g => ({ ...g, hospitalId: e.target.value }))}
                    style={{ padding: "9px 12px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "white", outline: "none" }}>
                    <option value="">Select Hospital...</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.code} — {h.name}</option>)}
                  </select>
                  <select value={newGrant.role} onChange={(e) => setNewGrant(g => ({ ...g, role: e.target.value }))}
                    style={{ padding: "9px 12px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "white", outline: "none" }}>
                    <option value="viewer">Viewer (Read Only)</option>
                    <option value="support">Support (Read + Notes)</option>
                    <option value="admin">Admin (Full Access)</option>
                  </select>
                  <select value={newGrant.hours} onChange={(e) => setNewGrant(g => ({ ...g, hours: e.target.value }))}
                    style={{ padding: "9px 12px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "white", outline: "none" }}>
                    <option value="1">1 Hour</option>
                    <option value="4">4 Hours</option>
                    <option value="8">8 Hours</option>
                    <option value="24">24 Hours</option>
                    <option value="72">3 Days</option>
                    <option value="168">7 Days</option>
                  </select>
                </div>
                <input value={newGrant.reason} onChange={(e) => setNewGrant(g => ({ ...g, reason: e.target.value }))} placeholder="Reason for access grant"
                  style={{ width: "100%", marginTop: 10, padding: "9px 12px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "white", outline: "none" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCreateGrant}
                    style={{ padding: "9px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "white", cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, border: "none" }}>
                    Grant Access
                  </motion.button>
                  {grantMsg && <span style={{ fontSize: 11, fontWeight: 600, color: grantMsg.type === "ok" ? "#22C55E" : "#F87171" }}>{grantMsg.text}</span>}
                </div>
              </div>

              {/* Active grants list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {accessGrants.length === 0 && (
                  <div style={{ padding: 32, textAlign: "center", color: "#475569", fontSize: 13 }}>No active access grants</div>
                )}
                {accessGrants.map((grant) => {
                  const expired = new Date(grant.expiresAt) < new Date();
                  return (
                    <div key={grant.id} style={{
                      padding: "14px 18px", borderRadius: 12,
                      background: expired ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${expired ? "rgba(239,68,68,0.12)" : `${COPPER}10`}`,
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      opacity: expired ? 0.5 : 1,
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
                          {grant.dalxicStaff?.name || grant.dalxicStaffId}
                          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: grant.grantedRole === "admin" ? "rgba(239,68,68,0.1)" : grant.grantedRole === "support" ? "rgba(245,158,11,0.1)" : "rgba(14,165,233,0.1)", color: grant.grantedRole === "admin" ? "#F87171" : grant.grantedRole === "support" ? "#F59E0B" : "#38BDF8" }}>
                            {grant.grantedRole.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                          {grant.hospital?.name || "All"} — {grant.reason}
                        </div>
                        <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
                          Granted: {new Date(grant.grantedAt).toLocaleString()} · Expires: {new Date(grant.expiresAt).toLocaleString()}
                          {expired && <span style={{ color: "#EF4444", fontWeight: 700 }}> · EXPIRED</span>}
                          {grant.revokedAt && <span style={{ color: "#EF4444", fontWeight: 700 }}> · REVOKED</span>}
                        </div>
                      </div>
                      {grant.isActive && !expired && (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleRevokeGrant(grant.id)}
                          style={{ padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#EF4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", cursor: "pointer" }}>
                          Revoke
                        </motion.button>
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
      <footer style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
        padding: "10px 36px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderTop: `1px solid ${COPPER}06`, background: "rgba(3,5,15,0.5)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      }}>
        <span style={{ fontSize: 9, color: "#1E293B", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Dalxic — Operating Platform v1.0
        </span>
        <span style={{ fontSize: 9, color: "#1E293B", letterSpacing: "0.15em" }}>
          Classified — Authorised Personnel Only
        </span>
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

  // Check for existing session
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(OPS_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        if (session.authenticated && session.expiresAt > Date.now()) {
          setAuthenticated(true);
        } else {
          sessionStorage.removeItem(OPS_KEY);
        }
      }
    } catch { /* */ }
    setChecking(false);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem(OPS_KEY);
    setAuthenticated(false);
  };

  if (checking) return null;

  return authenticated
    ? <OperatingPlatform onLogout={handleLogout} />
    : <EncryptedGate onUnlock={() => setAuthenticated(true)} />;
}
