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
  const calloutQueueRef = useRef<CalloutEntry[]>([]);
  const processingRef = useRef(false);

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue?hospitalCode=${HOSPITAL_CODE}`);
      if (res.ok) {
        const data = await res.json();
        const items: QueueItem[] = data
          .filter((d: { department: string; visitStatus?: string }) => {
            if (dept && d.department !== dept) return false;
            const vs = d.visitStatus ?? "active";
            return vs !== "closed" && vs !== "deceased" && vs !== "lwbs";
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

      // Patient called — mark as serving + voice callout
      queueChannel.bind("patient-called", (data: { queueToken: string; patientName?: string; department?: string; room?: string; calledBy?: string }) => {
        if (dept && data.department && data.department !== dept) return;
        setQueue((prev) => prev.map((item) => item.token === data.queueToken ? { ...item, status: "serving" as const } : item));
        // Add to voice callout queue
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
      });

      // Patient completed — remove from queue
      queueChannel.bind("patient-completed", (data: { queueToken: string }) => {
        setQueue((prev) => prev.filter((item) => item.token !== data.queueToken));
      });

      // Callout channel (from Display Board system)
      const calloutChannel = pusher.subscribe(`hospital-${HOSPITAL_CODE}-callout`);
      calloutChannel.bind("number-called", (data: CalloutEntry) => {
        if (dept && data.department !== dept) return;
        calloutQueueRef.current.push(data);
        processCalloutQueue();
      });

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
  const serving = currentCallout
    ? queue.find((q) => q.token === currentCallout.token) || { token: currentCallout.token, patientName: currentCallout.patientName, department: currentCallout.department, emergencyFlag: false, status: "serving" as const }
    : queue.find((q) => q.status === "serving");
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
            <span className="font-display font-light text-[#94A3B8] text-sm uppercase" style={{ letterSpacing: "0.08em" }}>Dalxic</span>
            <span className="font-display font-bold text-sm uppercase" style={{ letterSpacing: "0.08em", background: "linear-gradient(135deg, #B87333, #D4956B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <h1 className="font-display font-medium text-lg text-white tracking-tight">{HOSPITAL_NAME}</h1>
          {dept && <div style={{ fontSize: 11, color: "#D4956B", letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 }}>{dept} Department</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle isDayMode={theme.isDayMode} onToggle={theme.toggle} />
          <time suppressHydrationWarning className="font-mono text-sm tabular-nums" style={{ color: "#B87333", fontWeight: 700, letterSpacing: "1px" }}>
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </time>
        </div>
      </motion.header>

      {/* Main content — dual panel */}
      <main className="relative z-10 flex-1 flex" style={{ padding: "24px 32px", gap: 32 }}>

        {/* LEFT: Now Serving + Recently Called */}
        <div style={{ flex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "4px", textTransform: "uppercase", color: "#64748B", marginBottom: 16 }}>
            Now Serving
          </p>

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
                <div style={{
                  fontSize: "clamp(80px, 15vw, 180px)", fontWeight: 800, lineHeight: 1,
                  fontFamily: "monospace", letterSpacing: "4px",
                  background: serving.token.startsWith("ER") ? "linear-gradient(135deg, #EF4444, #F87171)" : "linear-gradient(135deg, #B87333, #D4956B, #B87333)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  {serving.token}
                </div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <p style={{ fontSize: 24, fontWeight: 600, marginTop: 16, color: "white" }}>{serving.patientName}</p>
                  {currentCallout?.room && (
                    <p style={{ fontSize: 18, color: "#D4956B", marginTop: 8, fontWeight: 600 }}>
                      Proceed To {currentCallout.room}
                    </p>
                  )}
                  <p style={{ fontSize: 14, color: "#64748B", marginTop: 8 }}>{serving.department}</p>
                </motion.div>
                {isSpeaking && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16 }}
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
                <div style={{
                  fontSize: "clamp(80px, 15vw, 180px)", fontWeight: 800, lineHeight: 1,
                  fontFamily: "monospace", color: "rgba(184,115,51,0.12)",
                }}>
                  ---
                </div>
                <p style={{ fontSize: 16, color: "#D4956B", marginTop: 16, opacity: 0.5 }}>Waiting For Next Patient</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recently Called */}
          {recentCallouts.length > 0 && (
            <div style={{ marginTop: 40, width: "100%", maxWidth: 400 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#64748B", marginBottom: 12, fontFamily: "monospace" }}>
                Recently Called
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {recentCallouts.map((entry, i) => (
                  <div key={`${entry.token}-${i}`} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 12px", borderRadius: 8,
                    background: "rgba(255,255,255,0.02)",
                    opacity: 1 - i * 0.15,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "#64748B" }}>{entry.token}</span>
                      <span style={{ fontSize: 11, color: "#4A5568" }}>{entry.patientName}</span>
                    </div>
                    <span style={{ fontSize: 10, color: "#3D4D78" }}>
                      {new Date(entry.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Up Next sidebar */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{
            padding: 20, borderRadius: 16, flex: 1,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(184,115,51,0.08)",
            backdropFilter: "blur(12px)",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#D4956B", marginBottom: 16, fontFamily: "monospace" }}>
              Up Next
            </p>
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
                      background: item.emergencyFlag ? "rgba(220,38,38,0.05)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${item.emergencyFlag ? "rgba(220,38,38,0.15)" : "rgba(184,115,51,0.06)"}`,
                      animation: item.emergencyFlag ? "erFlash 2s ease-in-out infinite" : undefined,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{
                        fontSize: 22, fontWeight: 800, fontFamily: "monospace",
                        color: item.emergencyFlag ? "#F87171" : "#B87333",
                      }}>
                        {item.token}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#94A3B8" }}>
                        {item.patientName}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", color: "#64748B", textTransform: "uppercase" }}>
                      {item.emergencyFlag ? "ER" : item.department}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {upNext.length === 0 && (
                <p style={{ fontSize: 13, color: "#3D4D78", textAlign: "center", padding: 24 }}>Queue Empty</p>
              )}
            </div>
            {waiting.length > 5 && (
              <p style={{ fontSize: 11, color: "#64748B", textAlign: "center", marginTop: 12 }}>
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
        style={{ borderTop: "1px solid rgba(184,115,51,0.1)" }}
      >
        <p className="text-xs font-body" style={{ color: "#64748B" }}>
          {waiting.length} Patient{waiting.length !== 1 ? "s" : ""} Waiting · Est. Wait ~{Math.max(5, waiting.length * 8)} Min
        </p>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-[#B87333]/40" />
          <p className="text-[10px] font-body" style={{ color: "#64748B" }}>
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
