"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { calloutNumber } from "@/lib/voice-callout";
import { getPusherClient } from "@/lib/pusher-client";

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
  emergencyFlag: boolean;
}

const HOSPITAL_CODE = "KBH";
const HOSPITAL_NAME = "Korle Bu Teaching Hospital";

function DisplayContent() {
  const searchParams = useSearchParams();
  const dept = searchParams.get("department");
  const voiceMode = (searchParams.get("voice") || "speech") as "speech" | "audio";

  const [currentCallout, setCurrentCallout] = useState<CalloutEntry | null>(null);
  const [recentCallouts, setRecentCallouts] = useState<CalloutEntry[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const calloutQueueRef = useRef<CalloutEntry[]>([]);
  const processingRef = useRef(false);

  // Load queue
  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue?hospitalCode=${HOSPITAL_CODE}`);
      if (res.ok) {
        const data = await res.json();
        const items: QueueItem[] = data
          .filter((d: { department: string }) => !dept || d.department === dept)
          .map((d: { token: string; patientName: string; department: string; emergencyFlag: boolean }) => ({
            token: d.token,
            patientName: d.patientName,
            department: d.department,
            emergencyFlag: d.emergencyFlag ?? false,
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

      // Remove from queue display
      setQueue((prev) => prev.filter((q) => q.token !== entry.token));

      // Pause between callouts
      await new Promise((r) => setTimeout(r, 2000));
    }

    processingRef.current = false;
  }, [voiceMode]);

  // Subscribe to Pusher callout events
  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 30000);

    try {
      const pusher = getPusherClient();
      const channelName = dept
        ? `hospital-${HOSPITAL_CODE}-callout-${dept}`
        : `hospital-${HOSPITAL_CODE}-callout`;
      const channel = pusher.subscribe(channelName);

      // Also subscribe to global channel if filtering by department
      const globalChannel = dept ? pusher.subscribe(`hospital-${HOSPITAL_CODE}-callout`) : null;

      const handleCallout = (data: CalloutEntry) => {
        if (dept && data.department !== dept) return;
        calloutQueueRef.current.push(data);
        processCalloutQueue();
      };

      channel.bind("number-called", handleCallout);
      globalChannel?.bind("number-called", handleCallout);

      // Also listen for new queue additions
      const queueChannel = pusher.subscribe(`hospital-${HOSPITAL_CODE}-queue`);
      queueChannel.bind("patient-added", (data: { queueToken: string; patientName: string; department: string; emergencyFlag: boolean }) => {
        if (dept && data.department !== dept) return;
        setQueue((prev) => [...prev, {
          token: data.queueToken,
          patientName: data.patientName,
          department: data.department,
          emergencyFlag: data.emergencyFlag ?? false,
        }]);
      });

      return () => {
        channel.unbind_all(); pusher.unsubscribe(channelName);
        globalChannel?.unbind_all(); if (dept) pusher.unsubscribe(`hospital-${HOSPITAL_CODE}-callout`);
        queueChannel.unbind_all(); pusher.unsubscribe(`hospital-${HOSPITAL_CODE}-queue`);
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

  const upNext = queue.slice(0, 5);

  return (
    <div style={{
      minHeight: "100vh", width: "100vw", overflow: "hidden",
      background: "radial-gradient(ellipse 120% 80% at 50% 50%, rgba(12,8,6,1) 0%, rgba(6,4,10,1) 50%, rgba(2,4,12,1) 100%)",
      color: "white", fontFamily: "system-ui, -apple-system, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 40px rgba(184,115,51,0.1)} 50%{box-shadow:0 0 80px rgba(184,115,51,0.25)} }
        @keyframes speakPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes erFlash { 0%,100%{border-color:rgba(220,38,38,0.2)} 50%{border-color:rgba(220,38,38,0.5)} }
      `}</style>

      {/* Header bar */}
      <header style={{
        padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(184,115,51,0.1)", background: "rgba(3,5,15,0.4)",
        backdropFilter: "blur(16px)",
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#B87333", boxShadow: "0 0 12px rgba(184,115,51,0.6)" }} />
          <span style={{ fontWeight: 300, fontSize: 13, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>Dalxic</span>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", background: "linear-gradient(135deg, #B87333, #D4956B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.5px" }}>{HOSPITAL_NAME}</div>
          {dept && <div style={{ fontSize: 11, color: "#D4956B", letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 }}>{dept} Department</div>}
        </div>
        <time suppressHydrationWarning style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "#B87333", letterSpacing: "1px" }}>
          {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </time>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, display: "flex", padding: "24px 32px", gap: 32 }}>

        {/* LEFT: Now Serving (large) */}
        <div style={{ flex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "4px", textTransform: "uppercase", color: "#64748B", marginBottom: 16 }}>
            Now Serving
          </p>

          <AnimatePresence mode="wait">
            {currentCallout ? (
              <motion.div
                key={currentCallout.token}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -30 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ textAlign: "center", animation: isSpeaking ? "pulseGlow 2s ease-in-out infinite" : undefined, padding: 40, borderRadius: 24 }}
              >
                <div style={{
                  fontSize: "clamp(80px, 15vw, 180px)", fontWeight: 800, lineHeight: 1,
                  fontFamily: "monospace", letterSpacing: "4px",
                  background: currentCallout.token.startsWith("ER") ? "linear-gradient(135deg, #EF4444, #F87171)" : "linear-gradient(135deg, #B87333, #D4956B, #B87333)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  {currentCallout.token}
                </div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <p style={{ fontSize: 24, fontWeight: 600, marginTop: 16 }}>{currentCallout.patientName}</p>
                  {currentCallout.room && (
                    <p style={{ fontSize: 18, color: "#D4956B", marginTop: 8, fontWeight: 600 }}>
                      Proceed To {currentCallout.room}
                    </p>
                  )}
                  <p style={{ fontSize: 14, color: "#64748B", marginTop: 8 }}>{currentCallout.department}</p>
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
                <p style={{ fontSize: 16, color: "#3D4D78", marginTop: 16 }}>Waiting For Next Patient</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Queue + Recent */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Up Next */}
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
            {queue.length > 5 && (
              <p style={{ fontSize: 11, color: "#64748B", textAlign: "center", marginTop: 12 }}>
                +{queue.length - 5} More Waiting
              </p>
            )}
          </div>

          {/* Recent Callouts */}
          {recentCallouts.length > 0 && (
            <div style={{
              padding: 20, borderRadius: 16,
              background: "rgba(255,255,255,0.015)", border: "1px solid rgba(184,115,51,0.06)",
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#64748B", marginBottom: 12, fontFamily: "monospace" }}>
                Recently Called
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {recentCallouts.map((entry, i) => (
                  <div key={`${entry.token}-${i}`} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 12px", borderRadius: 8,
                    background: "rgba(255,255,255,0.01)",
                    opacity: 1 - i * 0.15,
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "#64748B" }}>
                      {entry.token}
                    </span>
                    <span style={{ fontSize: 10, color: "#3D4D78" }}>
                      {new Date(entry.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: "12px 32px", display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTop: "1px solid rgba(184,115,51,0.06)", background: "rgba(3,5,15,0.3)",
      }}>
        <p style={{ fontSize: 11, color: "#64748B" }}>
          {queue.length} Patient{queue.length !== 1 ? "s" : ""} Waiting
        </p>
        <p style={{ fontSize: 10, color: "#3D4D78" }}>
          Powered By DalxicHealth — A Dalxic Subsidiary
        </p>
      </footer>
    </div>
  );
}

export default function DisplayBoardPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0a0614", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>Loading Display Board...</div>}>
      <DisplayContent />
    </Suspense>
  );
}
