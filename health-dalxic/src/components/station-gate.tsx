"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OperatorSession } from "@/types";
import { useOperator } from "@/hooks/use-operator";
import { ChatPanel } from "@/components/chat-panel";
import { getPusherClient } from "@/lib/pusher-client";

const COPPER = "#B87333";

/**
 * StationGate — PIN lock screen that wraps every workstation.
 *
 * Shows a 4-digit PIN entry when no operator is logged in.
 * After successful login, renders children + operator identity in header bar.
 * Provides a lock button to log out.
 *
 * Usage:
 *   <StationGate hospitalCode="KBH" stationName="Front Desk" stationIcon="🏥">
 *     {(operator) => <FrontDeskContent operator={operator} />}
 *   </StationGate>
 */

interface StationGateProps {
  hospitalCode: string;
  stationName: string;
  stationIcon: string;
  /** Optional: restrict to specific operator roles */
  allowedRoles?: string[];
  /** Optional: module key for chat (e.g. "doctor", "pharmacy"). Auto-derived from stationName if not provided */
  moduleKey?: string;
  children: (session: OperatorSession) => React.ReactNode;
}

/** Idle timeout in milliseconds — lock after 10 minutes of no interaction */
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

/** Derive module key from station name: "Front Desk" → "front_desk", "Doctor Station" → "doctor" */
const STATION_TO_MODULE: Record<string, string> = {
  "Front Desk": "front_desk", "Waiting Room": "waiting_room", "Doctor Station": "doctor",
  "Doctor": "doctor", "Pharmacy": "pharmacy", "Billing": "billing", "Laboratory": "lab",
  "Lab": "lab", "Injection Room": "injection_room", "Nursing": "nurse_station",
  "Nurse Station": "nurse_station", "Radiology": "ct_radiology", "CT / Radiology": "ct_radiology",
  "Ward / IPD": "ward_ipd", "Ward": "ward_ipd", "Ultrasound": "ultrasound",
  "Emergency": "emergency", "Emergency Triage": "emergency", "ICU": "icu",
  "Maternity": "maternity", "Blood Bank": "blood_bank", "Bookkeeping": "bookkeeping",
  "Admin": "admin",
};

export function StationGate({ hospitalCode, stationName, stationIcon, allowedRoles, moduleKey, children }: StationGateProps) {
  const { session, isAuthenticated, loading, login, logout } = useOperator(hospitalCode);
  const [moduleLocked, setModuleLocked] = useState(false);
  const [moduleCheckDone, setModuleCheckDone] = useState(false);

  const resolvedModule = moduleKey || STATION_TO_MODULE[stationName] || stationName.toLowerCase().replace(/[\s/]+/g, "_");

  // Check if this module is active for the hospital — initial fetch, then Pusher for live updates.
  // Poll interval drops to 60s as fallback in case Pusher is not configured.
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`/api/hospitals?code=${hospitalCode}`);
        if (!res.ok) { if (!cancelled) setModuleCheckDone(true); return; }
        const data = await res.json();
        const hospital = data.hospitals?.[0] || data.hospital;
        if (!hospital) { if (!cancelled) setModuleCheckDone(true); return; }
        const active = (hospital.activeModules || []) as string[];
        if (!cancelled) {
          setModuleLocked(!active.includes(resolvedModule));
          setModuleCheckDone(true);
        }
      } catch { if (!cancelled) setModuleCheckDone(true); }
    };
    check();

    // Pusher subscription — fires instantly when ops toggles this hospital's modules.
    const pusher = getPusherClient();
    const channel = pusher?.subscribe(`hospital-${hospitalCode}-modules`);
    const handler = (payload: { module: string; isActive: boolean; activeModules: string[] }) => {
      if (cancelled) return;
      // Use the broadcast's authoritative activeModules list — don't trust the single-field flag
      // in case multiple toggles race.
      setModuleLocked(!payload.activeModules.includes(resolvedModule));
    };
    channel?.bind("module-toggled", handler);

    const interval = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      channel?.unbind("module-toggled", handler);
      pusher?.unsubscribe(`hospital-${hospitalCode}-modules`);
    };
  }, [hospitalCode, resolvedModule]);

  // Auto-lock on idle — resets on mouse, keyboard, touch activity
  useEffect(() => {
    if (!isAuthenticated) return;

    let timer = setTimeout(() => logout(), IDLE_TIMEOUT_MS);

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => logout(), IDLE_TIMEOUT_MS);
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"] as const;
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [isAuthenticated, logout]);

  if (loading || !moduleCheckDone) {
    return <GateLoading stationName={stationName} stationIcon={stationIcon} />;
  }

  if (!isAuthenticated || !session) {
    return (
      <PinEntry
        hospitalCode={hospitalCode}
        stationName={stationName}
        stationIcon={stationIcon}
        allowedRoles={allowedRoles}
        onLogin={login}
      />
    );
  }

  // Role check
  if (allowedRoles?.length && !allowedRoles.includes(session.operatorRole)) {
    return (
      <RoleBlocked
        stationName={stationName}
        stationIcon={stationIcon}
        operatorName={session.operatorName}
        operatorRole={session.operatorRole}
        allowedRoles={allowedRoles}
        onLogout={logout}
      />
    );
  }

  // Module disabled — Super Admin sees a preview banner + full UI; everyone else is locked out.
  if (moduleLocked && session.operatorRole !== "super_admin") {
    return <ModuleLocked stationName={stationName} stationIcon={stationIcon} />;
  }

  return (
    <>
      {moduleLocked && session.operatorRole === "super_admin" && (
        <SuperAdminPreviewBanner
          hospitalCode={hospitalCode}
          moduleKey={resolvedModule}
          stationName={stationName}
          actorId={session.operatorId}
          onActivated={() => setModuleLocked(false)}
        />
      )}
      {children(session)}
      <ChatPanel
        hospitalCode={hospitalCode}
        currentModule={resolvedModule}
        operatorId={session.operatorId}
        operatorName={session.operatorName}
      />
    </>
  );
}

/**
 * SuperAdminPreviewBanner — shown at the top of any locked module when a
 * super_admin is viewing it. One-click activate pipes through the standard
 * /api/hospitals toggleModule endpoint.
 */
export function SuperAdminPreviewBanner({
  hospitalCode,
  moduleKey,
  stationName,
  actorId,
  onActivated,
}: {
  hospitalCode: string;
  moduleKey: string;
  stationName: string;
  actorId: string;
  onActivated: () => void;
}) {
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function activate() {
    setActivating(true);
    setError(null);
    try {
      const res = await fetch("/api/hospitals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode, toggleModule: moduleKey, actorId }),
      });
      if (res.ok) onActivated();
      else setError("Activation failed");
    } catch {
      setError("Network error");
    } finally {
      setActivating(false);
    }
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 60,
      padding: "10px 20px",
      background: `linear-gradient(135deg, ${COPPER}22, ${COPPER}0d)`,
      borderBottom: `1px solid ${COPPER}55`,
      backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
    }}>
      <span style={{ fontSize: 14 }}>🔓</span>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#F5E9DA", letterSpacing: "1px", textTransform: "uppercase" }}>
          Super Admin Preview
        </span>
        <span style={{ fontSize: 11, color: "rgba(245,245,240,0.6)" }}>
          {stationName} is not active for this hospital. Staff cannot see this page.
        </span>
      </div>
      {error && <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 600 }}>{error}</span>}
      <button
        onClick={activate}
        disabled={activating}
        style={{
          padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 800,
          background: activating ? "rgba(184,115,51,0.3)" : COPPER,
          border: "none", color: "#0D0A07", cursor: activating ? "wait" : "pointer",
          textTransform: "uppercase", letterSpacing: "0.5px",
        }}
      >
        {activating ? "Activating…" : "Activate Module"}
      </button>
    </div>
  );
}

/**
 * OperatorBadge — shows current operator identity + lock button.
 * Drop this into any station header.
 */
export function OperatorBadge({ session, onLogout }: { session: OperatorSession; onLogout: () => void }) {
  const roleLabel = session.operatorRole.replace(/_/g, " ");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "4px 12px", borderRadius: 8,
        background: "rgba(184,115,51,0.08)",
        border: "1px solid rgba(184,115,51,0.15)",
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#22C55E", boxShadow: "0 0 6px rgba(34,197,94,0.4)",
        }} />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", letterSpacing: "0.02em" }}>
            {session.operatorName}
          </span>
          <span style={{ fontSize: 8, fontWeight: 600, color: "#B8733380", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {roleLabel}
          </span>
        </div>
      </div>
      <motion.button
        type="button"
        onClick={onLogout}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          padding: "4px 8px", borderRadius: 6, fontSize: 10,
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
          color: "#EF4444", cursor: "pointer", fontWeight: 500,
          letterSpacing: "0.04em", textTransform: "uppercase",
        }}
        title="Lock Workstation"
      >
        Lock
      </motion.button>
    </div>
  );
}

/* ─── PIN Entry Screen ─── */
function PinEntry({
  hospitalCode,
  stationName,
  stationIcon,
  allowedRoles,
  onLogin,
}: {
  hospitalCode: string;
  stationName: string;
  stationIcon: string;
  allowedRoles?: string[];
  onLogin: (pin: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const MAX_ATTEMPTS = 5;

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setLockCountdown(0);
        setAttempts(0);
        setError(null);
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        setLockCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || authenticating || lockedUntil) return;

    setAuthenticating(true);
    setError(null);

    const result = await onLogin(pin);

    if (result.success) {
      setSuccess(true);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        // Escalating lockout: 60s, 120s, 300s
        const lockDurations = [60, 120, 300];
        const lockIndex = Math.min(Math.floor(newAttempts / MAX_ATTEMPTS) - 1, lockDurations.length - 1);
        const lockMs = lockDurations[lockIndex] * 1000;
        setLockedUntil(Date.now() + lockMs);
        setError(`Too many attempts. Locked for ${lockDurations[lockIndex]}s`);
      } else {
        setError(`Access Denied — ${MAX_ATTEMPTS - newAttempts} attempts remaining`);
      }

      setPin("");
      setAuthenticating(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 120% 80% at 55% 40%, rgba(15,9,5,1) 0%, rgba(6,3,12,1) 50%, rgba(2,3,10,1) 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      {/* Multi-layer ambient glow — BRIGHTER */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(184,115,51,0.14) 0%, transparent 55%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 55%, rgba(212,149,107,0.08) 0%, transparent 45%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 75% 30%, rgba(14,165,233,0.05) 0%, transparent 40%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(232,184,120,0.06) 0%, transparent 35%)", pointerEvents: "none" }} />

      {/* Floating ambient glow orbs — LARGER + BRIGHTER */}
      <div className="glow-pulse-copper" style={{
        position: "absolute", top: "15%", left: "10%", width: 320, height: 320,
        borderRadius: "50%", background: `radial-gradient(circle, ${COPPER}15, transparent 70%)`,
        filter: "blur(50px)", pointerEvents: "none",
      }} />
      <div className="glow-pulse" style={{
        position: "absolute", bottom: "15%", right: "10%", width: 280, height: 280,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,0.10), transparent 70%)",
        filter: "blur(50px)", pointerEvents: "none",
      }} />
      <div className="glow-pulse-copper" style={{
        position: "absolute", top: "50%", left: "60%", width: 200, height: 200,
        borderRadius: "50%", background: `radial-gradient(circle, ${COPPER}10, transparent 70%)`,
        filter: "blur(40px)", pointerEvents: "none",
        animationDelay: "2s",
      }} />
      <div style={{
        position: "absolute", top: "30%", right: "25%", width: 160, height: 160,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(232,184,120,0.08), transparent 70%)",
        filter: "blur(35px)", pointerEvents: "none",
        animation: "sg-corner-glow 5s ease-in-out 1.5s infinite",
      }} />

      {/* Dalxic brand — top left */}
      <div style={{ position: "absolute", top: 28, left: 36, zIndex: 2, display: "flex", alignItems: "center" }}>
        <span style={{ fontWeight: 300, fontSize: 13, color: "#4A5568", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Dalxic</span>
        <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Health</span>
      </div>

      {/* Glow animation styles */}
      <style>{`
        @keyframes sg-border-breathe {
          0%, 100% { border-color: rgba(184,115,51,0.12); box-shadow: 0 32px 80px rgba(0,0,0,0.4), 0 0 80px rgba(184,115,51,0.06), 0 0 120px rgba(184,115,51,0.03), inset 0 1px 0 rgba(255,255,255,0.06); }
          50% { border-color: rgba(184,115,51,0.28); box-shadow: 0 32px 80px rgba(0,0,0,0.4), 0 0 100px rgba(184,115,51,0.12), 0 0 160px rgba(184,115,51,0.06), inset 0 1px 0 rgba(255,255,255,0.08); }
        }
        @keyframes sg-corner-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes sg-line-sweep {
          0% { left: -20%; opacity: 0; }
          30% { opacity: 1; }
          100% { left: 120%; opacity: 0; }
        }
      `}</style>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative", zIndex: 1, textAlign: "center",
          padding: "56px 52px 48px", borderRadius: 28,
          background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)",
          border: `1.5px solid ${COPPER}15`,
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          minWidth: 420, maxWidth: 460,
          animation: "sg-border-breathe 4s ease-in-out infinite",
        }}
      >
        {/* Corner glow dots */}
        {[
          { top: -3, left: -3 },
          { top: -3, right: -3 },
          { bottom: -3, left: -3 },
          { bottom: -3, right: -3 },
        ].map((pos, i) => (
          <div key={i} style={{
            position: "absolute", ...pos,
            width: 6, height: 6, borderRadius: "50%",
            background: COPPER,
            boxShadow: `0 0 14px ${COPPER}, 0 0 28px ${COPPER}90, 0 0 48px ${COPPER}40`,
            animation: `sg-corner-glow 4s ease-in-out ${i * 0.5}s infinite`,
          }} />
        ))}

        {/* Sweeping light line across top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, overflow: "hidden", borderRadius: "28px 28px 0 0" }}>
          <div style={{
            position: "absolute", top: 0, width: "30%", height: 1,
            background: `linear-gradient(90deg, transparent, ${COPPER}90, ${COPPER}, ${COPPER}90, transparent)`,
            animation: "sg-line-sweep 5s ease-in-out infinite",
          }} />
        </div>

        {/* Static top accent glow */}
        <div style={{ position: "absolute", top: -1, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg, transparent, ${COPPER}50, ${COPPER}70, ${COPPER}50, transparent)` }} />

        {/* Shield icon with glow ring */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ marginBottom: 20 }}
        >
          <div style={{
            width: 80, height: 80, borderRadius: 22, margin: "0 auto",
            background: `radial-gradient(circle, ${COPPER}08, transparent 70%)`,
            border: `1.5px solid ${COPPER}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 48px ${COPPER}08, inset 0 1px 0 rgba(255,255,255,0.03)`,
          }}>
            <span style={{ fontSize: 38, lineHeight: 1 }}>{stationIcon}</span>
          </div>
        </motion.div>

        {/* Station name — ChickenAI heavy */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 style={{
            fontSize: 22, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
            background: `linear-gradient(135deg, ${COPPER}, #D4956B, ${COPPER})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: 6,
            fontFamily: "var(--font-outfit), Outfit, sans-serif",
          }}>
            {stationName}
          </h1>
          <p style={{
            fontSize: 11, color: "#475569", letterSpacing: "0.2em", textTransform: "uppercase",
            fontFamily: "var(--font-outfit), Outfit, sans-serif", fontWeight: 600,
          }}>
            {hospitalCode} &middot; WorkstationGuard™
          </p>
        </motion.div>

        {/* Divider */}
        <div style={{ width: 56, height: 1, background: `linear-gradient(90deg, transparent, ${COPPER}30, transparent)`, margin: "28px auto" }} />

        {/* Prompt */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            fontSize: 14, color: "#94A3B8", marginBottom: 28, fontWeight: 600,
            letterSpacing: "0.02em",
            fontFamily: "var(--font-outfit), Outfit, sans-serif",
          }}
        >
          Enter Access PIN
        </motion.p>

        {/* Single password input — no digit count visible */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 28 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={error ? { x: [0, -6, 6, -4, 4, 0], opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={error ? { duration: 0.4 } : { delay: 0.4, duration: 0.4 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
          >
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => { if (/^\d*$/.test(e.target.value)) { setPin(e.target.value); setError(null); } }}
              disabled={authenticating || success || !!lockedUntil}
              autoComplete="off"
              placeholder="••••"
              style={{
                width: 200, height: 56, textAlign: "center",
                fontSize: 24, fontWeight: 800, color: COPPER,
                fontFamily: "var(--font-outfit), Outfit, sans-serif",
                letterSpacing: "0.3em",
                background: "rgba(255,255,255,0.025)",
                border: `2px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 14,
                outline: "none",
                transition: "all 0.25s ease",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = COPPER + "50";
                e.target.style.boxShadow = `0 0 24px ${COPPER}12`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)";
                e.target.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.02)";
              }}
            />
            <motion.button
              type="submit"
              disabled={!pin.trim() || authenticating || success || !!lockedUntil}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: "12px 40px", borderRadius: 12, fontSize: 12,
                background: `linear-gradient(135deg, ${COPPER}, #D4956B)`,
                border: "none", color: "#fff", cursor: "pointer", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                fontFamily: "var(--font-outfit), Outfit, sans-serif",
                boxShadow: `0 6px 20px ${COPPER}25`,
                opacity: (!pin.trim() || authenticating || !!lockedUntil) ? 0.4 : 1,
                transition: "opacity 0.2s ease",
              }}
            >
              {lockedUntil ? `Locked (${lockCountdown}s)` : "Authenticate"}
            </motion.button>
          </motion.div>
        </form>

        {/* Status messages */}
        <div style={{ minHeight: 36 }}>
          <AnimatePresence mode="wait">
            {authenticating && !error && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  fontSize: 12, color: COPPER, fontWeight: 700, letterSpacing: "0.12em",
                  fontFamily: "var(--font-outfit), Outfit, sans-serif",
                }}
              >
                Authenticating...
              </motion.div>
            )}
            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "rgba(34,197,94,0.1)", border: "1.5px solid rgba(34,197,94,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <span style={{
                  fontSize: 14, color: "#22C55E", fontWeight: 800, letterSpacing: "0.1em",
                  fontFamily: "var(--font-outfit), Outfit, sans-serif",
                }}>
                  Access Granted
                </span>
              </motion.div>
            )}
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  fontSize: 12, color: "#EF4444", fontWeight: 700,
                  padding: "10px 20px", borderRadius: 12,
                  background: "rgba(239,68,68,0.05)",
                  border: "1px solid rgba(239,68,68,0.12)",
                  fontFamily: "var(--font-outfit), Outfit, sans-serif",
                  letterSpacing: "0.02em",
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Role hint */}
        {allowedRoles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: `${COPPER}40` }} />
            <p style={{
              fontSize: 10, color: "#3E4A5C", letterSpacing: "0.1em", textTransform: "uppercase",
              fontWeight: 600, fontFamily: "var(--font-outfit), Outfit, sans-serif",
            }}>
              Authorised: {allowedRoles.map(r => r.replace("_", " ")).join(", ")}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{ position: "absolute", bottom: 28, textAlign: "center" }}
      >
        <p style={{
          fontSize: 9, color: "#1E293B", letterSpacing: "0.3em", textTransform: "uppercase",
          fontFamily: "var(--font-outfit), Outfit, sans-serif", fontWeight: 600,
        }}>
          Dalxic Health &mdash; WorkstationGuard™
        </p>
      </motion.div>
    </div>
  );
}

/* ─── Loading State ─── */
function GateLoading({ stationName, stationIcon }: { stationName: string; stationIcon: string }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 120% 80% at 55% 40%, rgba(15,9,5,1) 0%, rgba(6,3,12,1) 50%, rgba(2,3,10,1) 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      position: "relative",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(184,115,51,0.04) 0%, transparent 50%)", pointerEvents: "none" }} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", position: "relative", zIndex: 1 }}
      >
        <div style={{ fontSize: 44, marginBottom: 16 }}>{stationIcon}</div>
        <div style={{
          fontSize: 13, color: COPPER, letterSpacing: "0.2em", textTransform: "uppercase",
          fontWeight: 700, fontFamily: "var(--font-outfit), Outfit, sans-serif",
        }}>
          Loading {stationName}...
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Module Locked By Admin ─── */
function ModuleLocked({ stationName, stationIcon }: { stationName: string; stationIcon: string }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 120% 80% at 55% 40%, rgba(15,9,5,1) 0%, rgba(6,3,12,1) 50%, rgba(2,3,10,1) 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      position: "relative",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(239,68,68,0.04) 0%, transparent 50%)", pointerEvents: "none" }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: "center", maxWidth: 440, position: "relative", zIndex: 1,
          padding: "56px 48px", borderRadius: 28,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(239,68,68,0.12)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)" }} />

        <div style={{
          width: 80, height: 80, borderRadius: 22, margin: "0 auto 24px",
          background: "rgba(239,68,68,0.05)", border: "1.5px solid rgba(239,68,68,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <span style={{ fontSize: 38, filter: "grayscale(0.6) opacity(0.5)" }}>{stationIcon}</span>
          <div style={{
            position: "absolute", bottom: -6, right: -6,
            width: 28, height: 28, borderRadius: 8,
            background: "rgba(239,68,68,0.12)", border: "1.5px solid rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>

        <h1 style={{
          fontSize: 22, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
          color: "#EF4444", marginBottom: 12,
          fontFamily: "var(--font-outfit), Outfit, sans-serif",
        }}>
          Locked By Admin
        </h1>

        <p style={{
          fontSize: 14, fontWeight: 700, color: "#94A3B8", marginBottom: 8,
          fontFamily: "var(--font-outfit), Outfit, sans-serif", letterSpacing: "0.02em",
        }}>
          {stationName}
        </p>

        <p style={{
          fontSize: 12, color: "#475569", lineHeight: 1.6, marginBottom: 0,
          fontFamily: "var(--font-outfit), Outfit, sans-serif",
        }}>
          This module has been disabled by an administrator. Contact your Ops team to re-enable access.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ position: "absolute", bottom: 28, textAlign: "center" }}
      >
        <p style={{
          fontSize: 9, color: "#1E293B", letterSpacing: "0.3em", textTransform: "uppercase",
          fontFamily: "var(--font-outfit), Outfit, sans-serif", fontWeight: 600,
        }}>
          Dalxic Health &mdash; WorkstationGuard™
        </p>
      </motion.div>
    </div>
  );
}

/* ─── Role Blocked Screen ─── */
function RoleBlocked({
  stationName, stationIcon, operatorName, operatorRole, allowedRoles, onLogout,
}: {
  stationName: string; stationIcon: string;
  operatorName: string; operatorRole: string;
  allowedRoles: string[]; onLogout: () => void;
}) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 120% 80% at 55% 40%, rgba(15,9,5,1) 0%, rgba(6,3,12,1) 50%, rgba(2,3,10,1) 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      position: "relative",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(239,68,68,0.03) 0%, transparent 50%)", pointerEvents: "none" }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: "center", maxWidth: 420, position: "relative", zIndex: 1,
          padding: "48px 44px", borderRadius: 28,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(239,68,68,0.1)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Red accent line */}
        <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)" }} />

        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: "0 auto 20px",
          background: "rgba(239,68,68,0.05)", border: "1.5px solid rgba(239,68,68,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 36 }}>{stationIcon}</span>
        </div>

        <h1 style={{
          fontSize: 20, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
          color: "#EF4444", marginBottom: 16,
          fontFamily: "var(--font-outfit), Outfit, sans-serif",
        }}>
          {stationName} — Access Restricted
        </h1>
        <p style={{ fontSize: 14, color: "#94A3B8", marginBottom: 6, fontWeight: 600, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
          <strong style={{ color: "#D4956B" }}>{operatorName}</strong>
        </p>
        <p style={{ fontSize: 11, color: "#475569", marginBottom: 24, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Role: {operatorRole.replace("_", " ")}
        </p>

        <div style={{
          padding: "12px 18px", borderRadius: 12, marginBottom: 28,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
        }}>
          <p style={{ fontSize: 11, color: "#64748B", fontWeight: 600, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
            This workstation requires: <strong style={{ color: "#94A3B8" }}>{allowedRoles.map(r => r.replace("_", " ")).join(", ")}</strong>
          </p>
        </div>

        <motion.button
          type="button"
          onClick={onLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: "14px 32px", borderRadius: 14, fontSize: 12,
            background: `linear-gradient(135deg, ${COPPER}, #D4956B)`,
            border: "none", color: "#fff", cursor: "pointer", fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            fontFamily: "var(--font-outfit), Outfit, sans-serif",
            boxShadow: `0 8px 24px ${COPPER}25`,
          }}
        >
          Switch Operator
        </motion.button>
      </motion.div>
    </div>
  );
}
