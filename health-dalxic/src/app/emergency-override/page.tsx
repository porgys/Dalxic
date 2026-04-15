"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COPPER, fontFamily } from "@/hooks/use-station-theme";
import { useHospitalCode } from "@/hooks/use-hospital-code";

const EMERGENCY_RED = "#DC2626";

/* ─── Galaxy Canvas (red-copper tinted for emergency) ─── */
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
      color: [[255,255,255],[255,220,180],[184,115,51],[210,150,80],[220,38,38],[255,100,100],[180,60,60],[120,80,40]][
        Math.random() < 0.10 ? 4 : Math.random() < 0.08 ? 5 : Math.random() < 0.06 ? 6 : Math.random() < 0.08 ? 2 : Math.random() < 0.06 ? 3 : Math.random() < 0.04 ? 7 : Math.floor(Math.random() * 2)
      ],
    }));
    const dust = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 2.0, vy: (Math.random() - 0.5) * 1.2,
      r: Math.random() * 1.0 + 0.2, opacity: Math.random() * 0.25 + 0.05,
      color: Math.random() < 0.4 ? [220,38,38] : Math.random() < 0.5 ? [184,115,51] : Math.random() < 0.5 ? [255,100,100] : [160,200,255] as number[],
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

/* ─── Workshop Box (emergency variant with optional red accent) ─── */
function WorkshopBox({ children, title, icon, delay = 0, red = false, className = "" }: {
  children: React.ReactNode; title: string; icon: string; delay?: number; red?: boolean; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: red ? "rgba(220,38,38,0.03)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${red ? "rgba(220,38,38,0.15)" : "rgba(184,115,51,0.12)"}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <h3 style={{
          fontSize: 12, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase",
          color: red ? "#F87171" : "#D4956B",
          fontFamily: fontFamily.mono,
        }}>{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

/* ─── Dark Input ─── */
function DInput({ label, required, red, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean; red?: boolean }) {
  const accent = red ? EMERGENCY_RED : COPPER;
  return (
    <div>
      {label && (
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "#94A3B8", marginBottom: 6 }}>
          {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
        </label>
      )}
      <input
        {...props}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body text-white placeholder:text-[#4A5568] focus:outline-none focus:ring-2 transition-all duration-300"
        style={{
          background: "rgba(255,255,255,0.04)",
          borderColor: `${accent}26`,
          ...(props.style || {}),
        }}
      />
    </div>
  );
}

/* ─── Types ─── */
interface EmergencySession {
  sessionId: string;
  expiresAt: string;
}

interface PatientRow {
  id: string;
  patient: { fullName?: string };
  visit: { date?: string; chiefComplaint?: string; queueToken?: string };
  createdAt: string;
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function EmergencyOverridePage() {
  const HOSPITAL_CODE = useHospitalCode();
  const [hospitalId, setHospitalId] = useState("");
  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<EmergencySession | null>(null);
  const [records, setRecords] = useState<PatientRow[]>([]);
  const [expiresIn, setExpiresIn] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Resolve hospital ID from code
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/hospitals?code=${HOSPITAL_CODE}`);
        if (res.ok) { const h = await res.json(); setHospitalId(h.id); }
      } catch { /* */ }
    })();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleActivate = async () => {
    if (!userId || !pin || !reason.trim()) {
      setError("All Fields Are Required. Reason Cannot Be Blank.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId, userId, pin, reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSession(data);
      await loadRecords(data.sessionId);
    } finally { setLoading(false); }
  };

  const loadRecords = async (sessionId: string) => {
    const res = await fetch(`/api/emergency?sessionId=${sessionId}`);
    if (res.ok) {
      const data = await res.json();
      setRecords(data.records);
      setExpiresIn(data.expiresIn);
    }
  };

  const handleEndSession = async () => {
    if (!session) return;
    await fetch("/api/emergency", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.sessionId, endReason: "manual" }),
    });
    setSession(null);
    setRecords([]);
  };

  const handleViewRecord = async (recordId: string) => {
    if (!session) return;
    await fetch(`/api/emergency?sessionId=${session.sessionId}&recordId=${recordId}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 120% 80% at 55% 40%, rgba(30,8,8,1) 0%, rgba(10,5,15,1) 50%, rgba(2,4,12,1) 100%)", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes emergencyPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes emergencyBorder { 0%,100%{border-color:rgba(220,38,38,0.15)} 50%{border-color:rgba(220,38,38,0.35)} }
      `}</style>

      {/* Background layers — red-tinted */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(220,38,38,0.04) 0%, transparent 50%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 60%, rgba(184,115,51,0.03) 0%, transparent 40%)", pointerEvents: "none" }} />
      <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.06 }} />
      <GalaxyCanvas />

      {/* Warning header bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 60,
          background: `linear-gradient(135deg, ${EMERGENCY_RED}, #B91C1C)`,
          padding: "10px 0", textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "white", animation: "emergencyPulse 1.5s ease-in-out infinite" }} />
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "white" }}>
            Emergency Override Access — All Actions Are Permanently Logged
          </p>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "white", animation: "emergencyPulse 1.5s ease-in-out infinite" }} />
        </div>
      </motion.div>

      {/* Secondary header */}
      <header style={{
        position: "fixed", top: 38, left: 0, right: 0, zIndex: 50, padding: "12px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(220,38,38,0.1)", background: "rgba(3,5,15,0.4)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      }}>
        <div onClick={() => window.location.href = "/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh"} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: 300, fontSize: 13, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>Dalxic</span>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", background: `linear-gradient(135deg, ${EMERGENCY_RED}, #F87171)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#F87171" }}>Emergency Override</span>
          <div style={{ width: 1, height: 16, background: "rgba(220,38,38,0.15)" }} />
          <time suppressHydrationWarning style={{ fontFamily: fontFamily.mono, fontSize: 12, color: "#F87171" }}>
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </time>
        </div>
      </header>

      {/* Main content */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", padding: "110px 32px 60px" }}>
        <AnimatePresence mode="wait">
          {!session ? (
            /* ═══════ AUTHENTICATION ═══════ */
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <WorkshopBox title="Emergency Override Authentication" icon="🔐" red delay={0.05}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    border: "2px solid rgba(220,38,38,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: EMERGENCY_RED, animation: "emergencyPulse 1.5s ease-in-out infinite" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "white" }}>CMO / Medical Director Access</p>
                    <p style={{ fontSize: 14.5, fontWeight: 500, color: "#94A3B8", lineHeight: 1.6 }}>
                      Read-Only Access To All Records Regardless Of Lock State
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <DInput red label="User ID" placeholder="Your Designated Override ID" value={userId} onChange={(e) => setUserId(e.target.value)} required />
                  <DInput red label="Emergency PIN" type="password" placeholder="Separate Emergency PIN — Not Your Regular PIN" value={pin} onChange={(e) => setPin(e.target.value)} required />
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "#94A3B8", marginBottom: 6 }}>
                      Reason For Emergency Access <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="This Field Cannot Be Blank. State The Reason For Emergency Access."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-xl border px-4 py-3 text-sm font-body text-white placeholder:text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all duration-300 resize-none"
                      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(220,38,38,0.15)" }}
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        style={{
                          padding: 16, borderRadius: 12, fontSize: 14.5, fontWeight: 500,
                          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", color: "#F87171",
                        }}
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.01, boxShadow: "0 8px 40px rgba(220,38,38,0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleActivate}
                    disabled={loading}
                    style={{
                      width: "100%", padding: "16px 32px", borderRadius: 16,
                      fontSize: 16, fontWeight: 600, color: "white", cursor: "pointer",
                      background: `linear-gradient(135deg, ${EMERGENCY_RED}, #B91C1C)`,
                      border: "none", boxShadow: "0 4px 24px rgba(220,38,38,0.2)",
                      opacity: loading ? 0.6 : 1, transition: "all 0.3s",
                    }}
                  >
                    {loading ? "Authenticating..." : "Activate Emergency Override"}
                  </motion.button>

                  <p style={{ fontSize: 12, fontWeight: 500, color: "#4A5568", textAlign: "center", lineHeight: 1.7 }}>
                    Session Max Duration: 4 Hours. Dalxic Master + Hospital Admin Will Be Notified Immediately.
                    Every Record Accessed Is Individually Logged With A Timestamp. The Trail Is Permanent And Uneditable.
                  </p>
                </div>
              </WorkshopBox>
            </motion.div>
          ) : (
            /* ═══════ ACTIVE SESSION ═══════ */
            <motion.div
              key="session"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              {/* Session status card */}
              <WorkshopBox title="Session Active" icon="⚡" red delay={0}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase",
                      padding: "6px 14px", borderRadius: 8,
                      background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)", color: "#F87171",
                      animation: "emergencyBorder 2s ease-in-out infinite",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", animation: "emergencyPulse 1s ease-in-out infinite" }} />
                      Emergency Override Active
                    </span>
                    <p style={{ fontSize: 14.5, fontWeight: 500, color: "#94A3B8", marginTop: 10 }}>
                      Read-Only Access. Expires In{" "}
                      <span style={{ fontFamily: fontFamily.mono, fontWeight: 800, color: "#F87171" }}>{expiresIn}</span> Minutes.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleEndSession}
                    style={{
                      padding: "10px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                      background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)",
                      color: "#F87171", cursor: "pointer", transition: "all 0.3s",
                    }}
                  >
                    End Session
                  </motion.button>
                </div>
              </WorkshopBox>

              {/* Patient records */}
              <WorkshopBox title="Patient Records" icon="📋" delay={0.05}>
                {records.length === 0 ? (
                  <div style={{ textAlign: "center", paddingTop: 32, paddingBottom: 32 }}>
                    <p style={{ fontSize: 14.5, fontWeight: 500, color: "#94A3B8" }}>No Records Available</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {records.map((record, i) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => handleViewRecord(record.id)}
                        whileHover={{ x: 4, background: "rgba(255,255,255,0.04)" }}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                          transition: "all 0.3s",
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 700, color: "white" }}>
                            {record.patient.fullName ?? "Unknown"}
                          </p>
                          <p style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8", marginTop: 2 }}>
                            {record.visit.chiefComplaint ?? "No Complaint Recorded"}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {record.visit.queueToken && (
                            <span style={{
                              fontFamily: fontFamily.mono,
                              fontSize: 14, fontWeight: 700, color: COPPER,
                            }}>
                              {record.visit.queueToken}
                            </span>
                          )}
                          <p style={{ fontSize: 11, fontFamily: fontFamily.mono, color: "#4A5568", marginTop: 2 }}>
                            {new Date(record.createdAt).toLocaleDateString("en-GB")}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </WorkshopBox>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
