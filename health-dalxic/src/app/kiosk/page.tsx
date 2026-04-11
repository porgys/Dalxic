"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ALL_WORKSTATIONS, UTILITY_STATIONS, getTierDefaults } from "@/lib/tier-defaults";
import { motion, AnimatePresence } from "framer-motion";
import { COPPER, COPPER_LIGHT, fontFamily } from "@/hooks/use-station-theme";

/* ─── Constants ─── */
const BOOT_HOLD = 5000; // ms — how long the landing page stays visible before transitioning

/* ─── Fullscreen helpers ─── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function requestFullscreen() {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  };
  try {
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  } catch { /* Fullscreen may require user gesture */ }
}

/* ─── Module lookup ─── */
const ALL_STATIONS = [...ALL_WORKSTATIONS, ...UTILITY_STATIONS];
function getStationByKey(key: string) {
  return ALL_STATIONS.find((s) => s.key === key);
}

/* ─── Boot Canvas (minimal stars for transition overlay) ─── */
function BootCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1 + 0.2,
      opacity: Math.random() * 0.4 + 0.1,
      color: Math.random() < 0.15 ? [184, 115, 51] : [255, 255, 255],
    }));
    let raf: number;
    function draw() {
      ctx!.clearRect(0, 0, W, H);
      stars.forEach((s) => {
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${s.opacity})`;
        ctx!.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   KIOSK FRAME — Wraps everything with exit prevention
   ═══════════════════════════════════════════════════════════════════════════════ */

function KioskFrame({ children }: { children: React.ReactNode }) {
  // Prevent back navigation
  useEffect(() => {
    const preventBack = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", preventBack);
    return () => window.removeEventListener("popstate", preventBack);
  }, []);

  // Block escape shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "F11" ||
        (e.altKey && e.key === "F4") ||
        (e.ctrlKey && ["w", "t", "n", "l"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, []);

  // Prevent right-click
  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // Auto-hide cursor after inactivity
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = () => {
      document.body.style.cursor = "default";
      clearTimeout(timer);
      timer = setTimeout(() => { document.body.style.cursor = "none"; }, 5000);
    };
    window.addEventListener("mousemove", show);
    window.addEventListener("mousedown", show);
    show();
    return () => {
      clearTimeout(timer);
      document.body.style.cursor = "default";
      window.removeEventListener("mousemove", show);
      window.removeEventListener("mousedown", show);
    };
  }, []);

  return <>{children}</>;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STATION PICKER — When no module is assigned
   ═══════════════════════════════════════════════════════════════════════════════ */

function StationPicker({ hospitalCode, onSelect }: { hospitalCode: string; onSelect: (href: string) => void }) {
  const [activeModules, setActiveModules] = useState<string[]>([...getTierDefaults("T4").modules]);

  useEffect(() => {
    async function loadHospital() {
      try {
        const res = await fetch(`/api/hospitals?code=${hospitalCode}`);
        if (res.ok) {
          const data = await res.json();
          const hospital = Array.isArray(data) ? data[0] : data;
          if (hospital?.activeModules?.length > 0) {
            setActiveModules(hospital.activeModules);
          } else {
            const defaults = getTierDefaults(hospital?.tier || "T4");
            setActiveModules([...defaults.modules]);
          }
        }
      } catch { /* Fallback T4 already set */ }
    }
    loadHospital();
  }, [hospitalCode]);

  const stations = [
    ...ALL_WORKSTATIONS.filter((ws) => activeModules.includes(ws.key)),
    ...UTILITY_STATIONS,
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 120% 80% at 55% 40%, rgba(15,9,5,1) 0%, rgba(6,3,12,1) 45%, rgba(2,3,10,1) 100%)",
      position: "relative", overflow: "hidden",
    }}>
      <BootCanvas />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(184,115,51,0.04) 0%, transparent 50%)", pointerEvents: "none" }} />

      {/* Header */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "16px 36px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${COPPER}08`, background: "rgba(3,5,15,0.4)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: 300, fontSize: 13, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>Dalxic</span>
          <span style={{
            fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase",
            background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Health</span>
        </div>
        <div style={{
          padding: "4px 12px", borderRadius: 8,
          background: `${COPPER}08`, border: `1px solid ${COPPER}15`,
          fontSize: 10, fontWeight: 700, color: COPPER,
          letterSpacing: "0.1em", fontFamily: fontFamily.mono,
        }}>
          {hospitalCode}
        </div>
      </header>

      {/* Station grid */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "100px 32px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, marginBottom: 10, fontFamily: fontFamily.primary }}>
            Kiosk Mode
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#F0F4FF", marginBottom: 10, fontFamily: fontFamily.primary, letterSpacing: "-0.02em" }}>
            Select Workstation
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", maxWidth: 420, margin: "0 auto" }}>
            Tap your assigned station to begin. This device will lock to the selected module.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {stations.map((s, i) => (
            <motion.button
              key={s.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onSelect(s.href)}
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.98 }}
              style={{
                textAlign: "left", cursor: "pointer",
                padding: "24px 22px", borderRadius: 18,
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${COPPER}10`,
                backdropFilter: "blur(8px)",
                transition: "all 0.25s ease",
                display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: COPPER, fontFamily: fontFamily.mono }}>
                  {s.role}
                </span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#F0F4FF", marginBottom: 6, fontFamily: fontFamily.primary }}>
                {s.title}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, flex: 1 }}>
                {s.desc}
              </div>
              <div style={{ marginTop: 16, height: 2, background: `linear-gradient(90deg, ${COPPER}40, transparent)`, borderRadius: 1 }} />
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TRANSITION OVERLAY — Fades over the landing page before routing to module
   ═══════════════════════════════════════════════════════════════════════════════ */

function TransitionOverlay({ station, onDone }: { station: ReturnType<typeof getStationByKey> | null; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "radial-gradient(ellipse at 50% 50%, rgba(10,6,4,0.97) 0%, rgba(2,1,4,0.99) 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}
    >
      <BootCanvas />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        {station && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>{station.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F0F4FF", marginBottom: 6, fontFamily: fontFamily.primary }}>
              {station.title}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: COPPER, fontFamily: fontFamily.mono }}>
              Loading Module...
            </div>
          </motion.div>
        )}
        {!station && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: COPPER }}
          >
            Loading Station Selector...
          </motion.div>
        )}

        {/* Progress bar */}
        <motion.div style={{ width: 180, height: 2, margin: "32px auto 0", background: "rgba(255,255,255,0.04)", borderRadius: 1, overflow: "hidden" }}>
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{ height: "100%", background: `linear-gradient(90deg, ${COPPER}, ${COPPER_LIGHT})`, borderRadius: 1 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN KIOSK PAGE

   URL: /kiosk?module=front_desk&hospital=KBH

   Boot flow:
     1. The actual DalxicHealth landing page loads in a full-screen iframe
        — galaxy canvas, "Worlds Best Hospital", copper accents, the whole show
     2. The landing page animates into place (CSS animations already built in)
     3. After 5 seconds, a transition overlay fades in showing the target module
     4. Auto-navigates to the module → StationGate PIN screen takes over
     5. Everything wrapped in KioskFrame (fullscreen, exit prevention)

   If no module param → after landing page, shows station picker grid

   OS-Level Kiosk Setup:
     chrome.exe --kiosk --app="https://korlebu.health.dalxic.com/kiosk?module=front_desk"
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function KioskPage() {
  return <Suspense><KioskInner /></Suspense>
}

function KioskInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const stationKey = searchParams.get("module");
  const hospitalCode = searchParams.get("hospital") || "KBH";
  const station = stationKey ? getStationByKey(stationKey) : null;

  const [phase, setPhase] = useState<"landing" | "transition" | "navigate" | "picker">("landing");

  // Phase 1: Show landing page for BOOT_HOLD ms, then transition
  useEffect(() => {
    const timer = setTimeout(() => {
      // Fullscreen is handled by Chrome --kiosk flag at OS level
      // Don't call requestFullscreen() here — browsers block it without user gesture
      setPhase("transition");
    }, BOOT_HOLD);
    return () => clearTimeout(timer);
  }, []);

  // Phase 3: After transition, navigate to module or show picker
  const handleTransitionDone = useCallback(() => {
    if (stationKey && station) {
      router.push(station.href);
    } else {
      setPhase("picker");
    }
  }, [stationKey, station, router]);

  const handleStationSelect = useCallback((href: string) => {
    router.push(href);
  }, [router]);

  return (
    <KioskFrame>
      {/* Phase 1: The actual landing page as the boot screen */}
      {(phase === "landing" || phase === "transition") && (
        <iframe
          src="/"
          style={{
            position: "fixed", inset: 0, width: "100%", height: "100%",
            border: "none", zIndex: 1,
          }}
          title="DalxicHealth"
        />
      )}

      {/* Phase 2: Transition overlay fades over the landing page */}
      <AnimatePresence>
        {phase === "transition" && (
          <TransitionOverlay station={station} onDone={handleTransitionDone} />
        )}
      </AnimatePresence>

      {/* Phase 3b: Station picker (if no module param) */}
      {phase === "picker" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <StationPicker hospitalCode={hospitalCode} onSelect={handleStationSelect} />
        </motion.div>
      )}
    </KioskFrame>
  );
}
