"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useStationTheme, ThemeToggle } from "@/hooks/use-station-theme";
import { calloutNumber } from "@/lib/voice-callout";
import { getPusherClient } from "@/lib/pusher-client";
import { FloatingDot } from "@/components/ui/motion";

interface CalloutEntry {
  token: string;
  patientName: string;
  department: string;
  room: string | null;
  calledBy: string;
  timestamp: string;
}

interface QueueItem {
  token: string;
  patientName: string;
  department: string;
  status: "waiting" | "serving" | "completed";
  emergencyFlag: boolean;
  visitStatus?: string;
}

const HOSPITAL_CODE = "KBH";
const HOSPITAL_NAME = "Korle Bu Teaching Hospital";

function QueueDisplay() {
  const searchParams = useSearchParams();
  const dept = searchParams.get("department");
  const voiceMode = (searchParams.get("voice") || "speech") as "speech" | "audio";
  const theme = useStationTheme();

  const [currentCallout, setCurrentCallout] = useState<CalloutEntry | null>(null);
  const [recentCallouts, setRecentCallouts] = useState<CalloutEntry[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceUnlocked, setVoiceUnlocked] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem("voice_unlocked") === "1") setVoiceUnlocked(true);
  }, []);
  const calloutQueueRef = useRef<CalloutEntry[]>([]);
  const processingRef = useRef(false);

  // Unlock browser speech API with a user gesture
  const unlockVoice = () => {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance("");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
    sessionStorage.setItem("voice_unlocked", "1");
    setVoiceUnlocked(true);
  };

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue?hospitalCode=${HOSPITAL_CODE}`);
      if (res.ok) {
        const data = await res.json();
        const items: QueueItem[] = data
          .filter((d: { department: string; visitStatus?: string }) => {
            if (dept && d.department !== dept) return false;
            const vs = d.visitStatus ?? "active";
            // Show waiting + in_consultation patients (exclude closed, pharmacy, admitted, etc.)
            return vs === "active" || vs === "lab_results_ready" || vs === "in_consultation";
          })
          .map((d: { token: string; patientName: string; department: string; emergencyFlag: boolean; visitStatus?: string }) => ({
            token: d.token,
            patientName: d.patientName,
            department: d.department,
            emergencyFlag: d.emergencyFlag ?? false,
            visitStatus: d.visitStatus ?? "active",
            status: (d.visitStatus === "in_consultation" ? "serving" : "waiting") as "waiting" | "serving",
          }));
        setQueue(items);
      }
    } catch { /* retry */ }
  }, [dept]);

  // Process callout queue (one at a time with voice)
  const processCalloutQueue = useCallback(async () => {
    if (processingRef.current || calloutQueueRef.current.length === 0) return;
    processingRef.current = true;

    while (calloutQueueRef.current.length > 0) {
      const entry = calloutQueueRef.current.shift()!;
      setCurrentCallout(entry);
      setIsSpeaking(true);

      try {
        await calloutNumber({
          token: entry.token,
          room: entry.room || undefined,
          department: entry.department,
          mode: voiceMode,
          rate: 0.85,
          volume: 1,
        });
        // Repeat once for emphasis
        await new Promise((r) => setTimeout(r, 1500));
        await calloutNumber({
          token: entry.token,
          room: entry.room || undefined,
          department: entry.department,
          mode: voiceMode,
          rate: 0.85,
          volume: 1,
        });
      } catch { /* voice failed */ }

      setIsSpeaking(false);
      setRecentCallouts((prev) => [entry, ...prev].slice(0, 5));

      // Mark as serving in queue
      setQueue((prev) => prev.map((q) => q.token === entry.token ? { ...q, status: "serving" as const } : q));

      // Pause between callouts
      await new Promise((r) => setTimeout(r, 2000));
    }

    processingRef.current = false;
  }, [voiceMode]);

  // Subscribe to Pusher events
  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 30000);

    try {
      const pusher = getPusherClient();
      if (!pusher) { return () => clearInterval(interval); }

      // Queue channel — new patients
      const queueChannel = pusher.subscribe(`hospital-${HOSPITAL_CODE}-queue`);
      queueChannel.bind("patient-added", (data: { queueToken: string; patientName: string; department: string; emergencyFlag: boolean }) => {
        if (dept && data.department !== dept) return;
        setQueue((prev) => [...prev, {
          token: data.queueToken,
          patientName: data.patientName,
          department: data.department,
          emergencyFlag: data.emergencyFlag ?? false,
          status: "waiting" as const,
        }]);
      });

      // Patient called — mark as serving + voice callout + refresh queue
      queueChannel.bind("patient-called", (data: { queueToken: string; patientName?: string; department?: string; room?: string; calledBy?: string }) => {
        if (dept && data.department && data.department !== dept) return;
        setQueue((prev) => prev.map((item) => item.token === data.queueToken ? { ...item, status: "serving" as const } : item));
        // Refresh queue from DB to catch visitStatus change
        loadQueue();
        // Add to voice callout queue (dedup — React strict mode can double-fire)
        const alreadyQueued = calloutQueueRef.current.some(e => e.token === data.queueToken);
        if (!alreadyQueued) {
          const entry: CalloutEntry = {
            token: data.queueToken,
            patientName: data.patientName || "",
            department: data.department || "",
            room: data.room || null,
            calledBy: data.calledBy || "",
            timestamp: new Date().toISOString(),
          };
          calloutQueueRef.current.push(entry);
          processCalloutQueue();
        }
      });

      // Patient completed — remove from queue
      queueChannel.bind("patient-completed", (data: { queueToken: string }) => {
        setQueue((prev) => prev.filter((item) => item.token !== data.queueToken));
      });

      // Callout channel — subscribe but don't duplicate voice (patient-called already handles it)
      const calloutChannel = pusher.subscribe(`hospital-${HOSPITAL_CODE}-callout`);

      // Emergency channel
      const erChannel = pusher.subscribe(`hospital-${HOSPITAL_CODE}-emergency`);
      erChannel.bind("emergency-escalation", (data: { queueToken: string; recordId: string }) => {
        setQueue((prev) => prev.map((item) =>
          item.token === data.queueToken || item.token === data.recordId
            ? { ...item, token: data.queueToken, emergencyFlag: true }
            : item
        ));
      });

      return () => {
        queueChannel.unbind_all(); pusher.unsubscribe(`hospital-${HOSPITAL_CODE}-queue`);
        calloutChannel.unbind_all(); pusher.unsubscribe(`hospital-${HOSPITAL_CODE}-callout`);
        erChannel.unbind_all(); pusher.unsubscribe(`hospital-${HOSPITAL_CODE}-emergency`);
        clearInterval(interval);
      };
    } catch {
      return () => clearInterval(interval);
    }
  }, [dept, loadQueue, processCalloutQueue]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Derived state
  // All patients currently in consultation (multiple doctors = multiple serving)
  const allServing = queue.filter((q) => q.status === "serving");
  // Most recently called (via Pusher) gets highlighted, fallback to first from DB
  const serving = currentCallout
    ? allServing.find((q) => q.token === currentCallout.token) || { token: currentCallout.token, patientName: currentCallout.patientName, department: currentCallout.department, emergencyFlag: currentCallout.token.startsWith("ER"), status: "serving" as const }
    : allServing[0] || null;
  const waiting = queue
    .filter((q) => q.status === "waiting")
    .sort((a, b) => (b.emergencyFlag ? 1 : 0) - (a.emergencyFlag ? 1 : 0));
  const upNext = waiting.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{
      background: theme.pageBg,
      color: theme.textPrimary,
      transition: "background 0.5s ease, color 0.4s ease",
    }}>
      <style>{`
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 40px rgba(184,115,51,0.1)} 50%{box-shadow:0 0 80px rgba(184,115,51,0.25)} }
        @keyframes speakPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes erFlash { 0%,100%{border-color:rgba(220,38,38,0.2);box-shadow:0 0 15px rgba(220,38,38,0.05)} 50%{border-color:rgba(220,38,38,0.5);box-shadow:0 0 30px rgba(220,38,38,0.15)} }
        @keyframes erTokenPulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
      `}</style>

      {/* Voice unlock overlay — browser requires one click before speech works */}
      {!voiceUnlocked && (
        <div onClick={unlockVoice} style={{
          position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", cursor: "pointer",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔊</div>
            <p style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, letterSpacing: "0.02em" }}>Tap To Enable Voice Callout</p>
            <p style={{ fontSize: 13, color: theme.textMuted, marginTop: 8 }}>Patient Names Will Be Announced When Called</p>
          </div>
        </div>
      )}

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[150px]" style={{ background: "rgba(184,115,51,0.03)" }} />
      </div>
      <FloatingDot size="sm" color="copper" delay={0} className="absolute top-24 right-12 opacity-20" />
      <FloatingDot size="sm" color="copper" delay={2} className="absolute bottom-20 left-16 opacity-15" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 px-8 py-4 flex items-center justify-between"
        style={{ borderBottom: theme.headerBorder, background: theme.isDayMode ? undefined : "rgba(3,5,15,0.4)", backdropFilter: "blur(16px)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(184,115,51,0.3)" }}>
            <div className="w-2 h-2 rounded-full bg-[#B87333]" style={{ boxShadow: "0 0 8px rgba(184,115,51,0.6)" }} />
          </div>
          <div className="flex items-center">
            <span className="font-display font-light text-sm uppercase" style={{ letterSpacing: "0.08em", color: theme.textSecondary }}>Dalxic</span>
            <span className="font-display font-bold text-sm uppercase" style={{ letterSpacing: "0.08em", background: "linear-gradient(135deg, #B87333, #D4956B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <h1 className="font-display font-medium text-lg tracking-tight" style={{ color: theme.textPrimary }}>{HOSPITAL_NAME}</h1>
          {dept && <div style={{ fontSize: 11, color: theme.copperText, letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 }}>{dept} Department</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle isDayMode={theme.isDayMode} onToggle={theme.toggle} />
          <time suppressHydrationWarning className="font-mono text-sm tabular-nums" style={{ color: "#B87333", fontWeight: 700, letterSpacing: "1px" }}>
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </time>
        </div>
      </motion.header>

      {/* Main content — three-column layout */}
      <main className="relative z-10 flex-1 flex" style={{ padding: "24px 32px", gap: 24 }}>

        {/* LEFT: In Consultation list */}
        <div style={{ width: 260, minWidth: 260, display: "flex", flexDirection: "column" }}>
          <div style={{
            padding: 16, borderRadius: 16, flex: 1,
            background: theme.cardBg, border: theme.cardBorder,
            backdropFilter: "blur(12px)", boxShadow: theme.cardShadow,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#22C55E", fontFamily: "monospace" }}>
                In Consultation
              </p>
              {allServing.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.15)", color: "#22C55E" }}>
                  {allServing.length}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <AnimatePresence>
                {allServing.map((s) => (
                  <motion.div
                    key={s.token}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    style={{
                      padding: "10px 12px", borderRadius: 10,
                      background: s.token === serving?.token ? (theme.isDayMode ? "rgba(184,115,51,0.08)" : "rgba(184,115,51,0.08)") : (theme.isDayMode ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.02)"),
                      border: `1px solid ${s.token === serving?.token ? "rgba(184,115,51,0.15)" : (theme.isDayMode ? "rgba(139,90,43,0.04)" : "rgba(255,255,255,0.04)")}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 6px rgba(34,197,94,0.4)", flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace", color: s.token.startsWith("ER") ? "#F87171" : "#B87333" }}>
                        {s.token}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: theme.textPrimary, marginTop: 4, marginLeft: 14 }}>{s.patientName}</p>
                    <p style={{ fontSize: 9, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2, marginLeft: 14 }}>{s.department}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              {allServing.length === 0 && (
                <p style={{ fontSize: 12, color: theme.textMuted, textAlign: "center", padding: 20, opacity: 0.6 }}>No Active Consultations</p>
              )}
            </div>

            {/* Recently Called */}
            {recentCallouts.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${theme.divider}` }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: theme.textMuted, marginBottom: 8, fontFamily: "monospace" }}>
                  Recently Called
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {recentCallouts.slice(0, 4).map((entry, i) => (
                    <div key={`${entry.token}-${i}`} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "4px 8px", borderRadius: 6, opacity: 0.7 - i * 0.12,
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: theme.textMuted }}>{entry.token}</span>
                      <span style={{ fontSize: 9, color: theme.textMuted }}>
                        {new Date(entry.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Most recently called — big dramatic display */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <AnimatePresence mode="wait">
            {serving ? (
              <motion.div
                key={serving.token}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -30 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ textAlign: "center", animation: isSpeaking ? "pulseGlow 2s ease-in-out infinite" : undefined, padding: 40, borderRadius: 24 }}
              >
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "4px", textTransform: "uppercase", color: theme.textMuted, marginBottom: 24 }}>
                  Now Serving
                </p>
                <div style={{
                  fontSize: "clamp(72px, 12vw, 160px)", fontWeight: 800, lineHeight: 1,
                  fontFamily: "monospace", letterSpacing: "4px",
                  background: serving.token.startsWith("ER") ? "linear-gradient(135deg, #EF4444, #F87171)" : "linear-gradient(135deg, #B87333, #D4956B, #B87333)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  {serving.token}
                </div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <p style={{ fontSize: 22, fontWeight: 700, marginTop: 16, color: theme.textPrimary }}>{serving.patientName}</p>
                  {currentCallout?.room && (
                    <p style={{ fontSize: 16, color: theme.copperText, marginTop: 8, fontWeight: 600 }}>
                      Proceed To {currentCallout.room}
                    </p>
                  )}
                  <p style={{ fontSize: 13, color: theme.textMuted, marginTop: 8, textTransform: "uppercase", letterSpacing: "1px" }}>{serving.department}</p>
                </motion.div>
                {isSpeaking && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{
                        width: 6, height: 20 + i * 8, borderRadius: 3, background: "#B87333",
                        animation: `speakPulse 0.8s ease-in-out ${i * 0.15}s infinite`,
                      }} />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "4px", textTransform: "uppercase", color: theme.textMuted, marginBottom: 24 }}>
                  Now Serving
                </p>
                <div style={{
                  fontSize: "clamp(72px, 12vw, 160px)", fontWeight: 800, lineHeight: 1,
                  fontFamily: "monospace", color: "rgba(184,115,51,0.12)",
                }}>
                  ---
                </div>
                <p style={{ fontSize: 16, color: theme.copperText, marginTop: 16, opacity: 0.5 }}>Waiting For Next Patient</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Up Next queue */}
        <div style={{ width: 320, minWidth: 320, display: "flex", flexDirection: "column" }}>
          <div style={{
            padding: 20, borderRadius: 16, flex: 1,
            background: theme.cardBg, border: theme.cardBorder,
            backdropFilter: "blur(12px)", boxShadow: theme.cardShadow,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: theme.copperText, fontFamily: "monospace" }}>
                Up Next
              </p>
              {waiting.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(184,115,51,0.08)", border: "1px solid rgba(184,115,51,0.12)", color: "#B87333" }}>
                  {waiting.length}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <AnimatePresence>
                {upNext.map((item, i) => (
                  <motion.div
                    key={item.token}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", borderRadius: 10,
                      background: item.emergencyFlag ? "rgba(220,38,38,0.05)" : (theme.isDayMode ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.02)"),
                      border: `1px solid ${item.emergencyFlag ? "rgba(220,38,38,0.15)" : (theme.isDayMode ? "rgba(139,90,43,0.1)" : "rgba(184,115,51,0.06)")}`,
                      animation: item.emergencyFlag ? "erFlash 2s ease-in-out infinite" : undefined,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{
                        fontSize: 20, fontWeight: 800, fontFamily: "monospace",
                        color: item.emergencyFlag ? "#F87171" : "#B87333",
                      }}>
                        {item.token}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: theme.textSecondary }}>
                        {item.patientName}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", color: theme.textMuted, textTransform: "uppercase" }}>
                      {item.emergencyFlag ? "ER" : item.department}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {upNext.length === 0 && (
                <p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 24 }}>Queue Empty</p>
              )}
            </div>
            {waiting.length > 5 && (
              <p style={{ fontSize: 11, color: theme.textMuted, textAlign: "center", marginTop: 12 }}>
                +{waiting.length - 5} More Waiting
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 px-8 py-3 flex justify-between items-center"
        style={{ borderTop: `1px solid ${theme.divider}` }}
      >
        <p className="text-xs font-body" style={{ color: theme.textMuted }}>
          {waiting.length} Patient{waiting.length !== 1 ? "s" : ""} Waiting · Est. Wait ~{Math.max(5, waiting.length * 8)} Min
        </p>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-[#B87333]/40" />
          <p className="text-[10px] font-body" style={{ color: theme.textMuted }}>
            Powered By DalxicHealth — A Dalxic Subsidiary
          </p>
        </div>
      </motion.footer>
    </div>
  );
}

export default function WaitingRoomPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0a0614", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>Loading Queue Display...</div>}>
      <QueueDisplay />
    </Suspense>
  );
}
