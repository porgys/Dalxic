"use client";


import { useStationTheme, ThemeToggle } from "@/hooks/use-station-theme";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPusherClient } from "@/lib/pusher-client";
import { FloatingDot } from "@/components/ui/motion";

interface QueueItem {
  token: string;
  patientName: string;
  department: string;
  status: "waiting" | "serving" | "completed";
  emergencyFlag?: boolean;
  symptomSeverity?: number | null;
}

const HOSPITAL_CODE = "KBH";
const HOSPITAL_NAME = "Korle Bu Teaching Hospital";

export default function WaitingRoomPage() {
  const theme = useStationTheme();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue?hospitalCode=${HOSPITAL_CODE}`);
      if (res.ok) {
        const data = await res.json();
        setQueue(
          data.map((d: { token: string; patientName: string; department: string; emergencyFlag?: boolean; symptomSeverity?: number }) => ({
            token: d.token,
            patientName: d.patientName,
            department: d.department,
            status: "waiting" as const,
            emergencyFlag: d.emergencyFlag ?? false,
            symptomSeverity: d.symptomSeverity ?? null,
          }))
        );
      }
    } catch { /* retry */ }
  }, []);

  useEffect(() => {
    loadQueue();
    try {
      const pusher = getPusherClient();
      const channel = pusher.subscribe(`hospital-${HOSPITAL_CODE}-queue`);
      channel.bind("patient-added", (data: { queueToken: string; patientName: string; department: string; emergencyFlag?: boolean; symptomSeverity?: number }) => {
        setQueue((prev) => [...prev, {
          token: data.queueToken, patientName: data.patientName, department: data.department,
          status: "waiting", emergencyFlag: data.emergencyFlag ?? false, symptomSeverity: data.symptomSeverity ?? null,
        }]);
      });
      channel.bind("patient-called", (data: { queueToken: string }) => {
        setQueue((prev) => prev.map((item) => item.token === data.queueToken ? { ...item, status: "serving" as const } : item));
      });
      channel.bind("patient-completed", (data: { queueToken: string }) => {
        setQueue((prev) => prev.map((item) => item.token === data.queueToken ? { ...item, status: "completed" as const } : item));
      });
      // Subscribe to emergency channel for escalations
      const erChannel = pusher.subscribe(`hospital-${HOSPITAL_CODE}-emergency`);
      erChannel.bind("emergency-escalation", (data: { queueToken: string; recordId: string }) => {
        setQueue((prev) => prev.map((item) =>
          item.token === data.queueToken || item.token === data.recordId
            ? { ...item, token: data.queueToken, emergencyFlag: true }
            : item
        ));
      });
      return () => {
        channel.unbind_all(); pusher.unsubscribe(`hospital-${HOSPITAL_CODE}-queue`);
        erChannel.unbind_all(); pusher.unsubscribe(`hospital-${HOSPITAL_CODE}-emergency`);
      };
    } catch {
      const interval = setInterval(loadQueue, 10000);
      return () => clearInterval(interval);
    }
  }, [loadQueue]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const serving = queue.find((q) => q.status === "serving");
  const waiting = [...queue.filter((q) => q.status === "waiting")]
    .sort((a, b) => (b.emergencyFlag ? 1 : 0) - (a.emergencyFlag ? 1 : 0));
  const upNext = waiting[0];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{
      background: theme.pageBg,
      color: theme.textPrimary,
      transition: "background 0.5s ease, color 0.4s ease",
    }}>
      <style>{`
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
        className="relative z-10 px-8 py-5 flex items-center justify-between"
        style={{ borderBottom: theme.headerBorder }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(184,115,51,0.3)" }}>
            <div className="w-2 h-2 rounded-full bg-[#B87333]" style={{ boxShadow: "0 0 8px rgba(184,115,51,0.6)" }} />
          </div>
          <div>
            <span className="font-display font-light text-[#94A3B8] tracking-[0.22em] text-xs uppercase">
              NEXUSLINK
            </span>{" "}
            <span className="font-display font-medium text-xs uppercase" style={{
              letterSpacing: "0.5em",
              background: "linear-gradient(135deg, #B87333, #D4956B)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              HEALTH
            </span>
          </div>
        </div>
        <h1 className="font-display font-medium text-lg text-white tracking-tight">
          {HOSPITAL_NAME}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle isDayMode={theme.isDayMode} onToggle={theme.toggle} />
          <time className="font-mono text-sm tabular-nums" style={{ color: theme.textSecondary, transition: "color 0.4s ease" }}>
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </time>
        </div>
      </motion.header>

      {/* Main display */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 gap-14">
        {/* Now Serving */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center"
        >
          <p className="text-[#64748B] text-xs font-body uppercase tracking-[0.3em] mb-6">
            Now Serving
          </p>
          <AnimatePresence mode="wait">
            {serving ? (
              <motion.div
                key={serving.token}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <span className="text-[140px] font-mono font-bold leading-none block" style={{
                  background: "linear-gradient(135deg, #B87333, #D4956B, #B87333)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  {serving.token}
                </span>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="mt-6 text-xl font-body text-white">{serving.patientName}</p>
                  <p className="text-sm font-body text-[#94A3B8] mt-1">{serving.department}</p>
                </motion.div>
              </motion.div>
            ) : (
              <motion.span
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[140px] font-mono font-bold leading-none block"
                style={{ color: "rgba(184,115,51,0.15)" }}
              >
                ---
              </motion.span>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Up Next */}
        <AnimatePresence>
          {upNext && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="text-[#64748B] text-[10px] font-body uppercase tracking-[0.3em] mb-3">
                Up Next
              </p>
              <span className={`text-5xl font-mono font-bold ${upNext.emergencyFlag ? "text-red-400/60" : "text-[#B87333]/40"}`}
                style={upNext.emergencyFlag ? { animation: "erTokenPulse 1.5s ease-in-out infinite" } : undefined}>
                {upNext.emergencyFlag && "🚨 "}{upNext.token}
              </span>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Queue grid */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-3xl"
        >
          <div className="grid grid-cols-4 gap-3">
            <AnimatePresence>
              {waiting.slice(0, 12).map((item, i) => (
                <motion.div
                  key={item.token}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="rounded-xl p-4 text-center transition-all duration-500"
                  style={{
                    background: item.emergencyFlag ? "rgba(220,38,38,0.06)" : "rgba(184,115,51,0.04)",
                    border: `1px solid ${item.emergencyFlag ? "rgba(220,38,38,0.25)" : "rgba(184,115,51,0.1)"}`,
                    animation: item.emergencyFlag ? "erFlash 2s ease-in-out infinite" : undefined,
                  }}
                >
                  <span className={`text-2xl font-mono font-bold ${item.emergencyFlag ? "text-red-400" : "text-[#94A3B8]"}`}>
                    {item.token}
                  </span>
                  <p className="text-[10px] font-body text-[#64748B] mt-1.5 truncate">
                    {item.emergencyFlag ? "🚨 Emergency" : item.department}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {waiting.length > 12 && (
            <p className="text-center text-xs text-[#64748B] mt-4 font-body">
              +{waiting.length - 12} More In Queue
            </p>
          )}
        </motion.section>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 px-8 py-3 flex justify-between items-center"
        style={{ borderTop: "1px solid rgba(184,115,51,0.1)" }}
      >
        <p className="text-xs text-[#64748B] font-body">
          Estimated Wait: ~{Math.max(5, waiting.length * 8)} Min
        </p>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-[#B87333]/40" />
          <p className="text-[10px] text-[#64748B] font-body">
            Powered By NexusLink Health — A Dalxic Subsidiary
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
