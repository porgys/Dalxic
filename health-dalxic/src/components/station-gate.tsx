"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OperatorSession } from "@/types";
import { useOperator } from "@/hooks/use-operator";

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
  children: (session: OperatorSession) => React.ReactNode;
}

export function StationGate({ hospitalCode, stationName, stationIcon, allowedRoles, children }: StationGateProps) {
  const { session, isAuthenticated, loading, login, logout } = useOperator(hospitalCode);

  if (loading) {
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

  return <>{children(session)}</>;
}

/**
 * OperatorBadge — shows current operator identity + lock button.
 * Drop this into any station header.
 */
export function OperatorBadge({ session, onLogout }: { session: OperatorSession; onLogout: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "4px 10px", borderRadius: 8,
        background: "rgba(184,115,51,0.08)",
        border: "1px solid rgba(184,115,51,0.15)",
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#22C55E", boxShadow: "0 0 6px rgba(34,197,94,0.4)",
        }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#D4956B", letterSpacing: "0.02em" }}>
          {session.operatorName}
        </span>
        <span style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {session.operatorRole.replace("_", " ")}
        </span>
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
        title="Lock Station"
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
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = useCallback((index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // only single digit

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError(null);

    // Auto-advance to next
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 filled
    if (value && index === 3 && newDigits.every(d => d)) {
      submitPin(newDigits.join(""));
    }
  }, [digits]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
    }
  }, [digits]);

  const submitPin = async (pin: string) => {
    setAuthenticating(true);
    setError(null);

    const result = await onLogin(pin);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "Login failed");
      setDigits(["", "", "", ""]);
      setAuthenticating(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
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

      {/* NexusLink brand — top left */}
      <div style={{ position: "absolute", top: 28, left: 36, zIndex: 2, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontWeight: 300, fontSize: 11, color: "#4A5568", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>NexusLink</span>
        <span style={{ fontWeight: 700, fontSize: 10, letterSpacing: "0.5em", textTransform: "uppercase", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>Health</span>
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
            {hospitalCode} &middot; StationGuard™
          </p>
        </motion.div>

        {/* Divider */}
        <div style={{ width: 56, height: 1, background: `linear-gradient(90deg, transparent, ${COPPER}30, transparent)`, margin: "28px auto" }} />

        {/* Prompt — ChickenAI weight */}
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
          Enter Your 4-Digit Access PIN
        </motion.p>

        {/* PIN boxes — larger, more premium */}
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 28 }}>
          {digits.map((digit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={error ? { x: [0, -6, 6, -4, 4, 0], opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
              transition={error ? { duration: 0.4 } : { delay: 0.4 + i * 0.06, duration: 0.4 }}
            >
              <input
                ref={el => { inputRefs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={authenticating || success}
                autoComplete="off"
                style={{
                  width: 64, height: 72, textAlign: "center",
                  fontSize: 28, fontWeight: 800, color: digit ? COPPER : "#3E4A5C",
                  fontFamily: "var(--font-outfit), Outfit, sans-serif",
                  background: digit
                    ? `linear-gradient(180deg, ${COPPER}08, ${COPPER}04)`
                    : "rgba(255,255,255,0.025)",
                  border: `2px solid ${error
                    ? "rgba(239,68,68,0.5)"
                    : digit
                      ? COPPER + "40"
                      : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 16,
                  outline: "none",
                  transition: "all 0.25s ease",
                  caretColor: "transparent",
                  boxShadow: digit ? `0 4px 20px ${COPPER}10, inset 0 1px 0 rgba(255,255,255,0.03)` : "inset 0 1px 0 rgba(255,255,255,0.02)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = COPPER + "60";
                  e.target.style.boxShadow = `0 0 24px ${COPPER}15, 0 4px 20px ${COPPER}10`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = digit ? COPPER + "40" : "rgba(255,255,255,0.06)";
                  e.target.style.boxShadow = digit ? `0 4px 20px ${COPPER}10` : "none";
                }}
              />
            </motion.div>
          ))}
        </div>

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
          NexusLink Health &mdash; StationGuard™
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
          Access Restricted
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
            This station requires: <strong style={{ color: "#94A3B8" }}>{allowedRoles.map(r => r.replace("_", " ")).join(", ")}</strong>
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
