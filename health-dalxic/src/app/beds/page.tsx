"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StationGate } from "@/components/station-gate";
import { useStationTheme, StationThemeProvider, useThemeContext, COPPER, fontFamily } from "@/hooks/use-station-theme";

const HOSPITAL_CODE = "KBH";
const HOSPITAL_NAME = "Korle Bu Teaching Hospital";
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
    const stars = Array.from({ length: 420 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.72, vy: (Math.random() - 0.5) * 0.48,
      r: Math.random() < 0.08 ? Math.random() * 2.5 + 1.2 : Math.random() * 1.2 + 0.2,
      baseOpacity: Math.random() * 0.65 + 0.15,
      twinkleSpeed: Math.random() * 0.048 + 0.016,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: [[255,255,255],[255,220,180],[184,115,51],[210,150,80],[14,165,233],[160,200,255]][
        Math.random() < 0.08 ? 2 : Math.random() < 0.12 ? 3 : Math.random() < 0.06 ? 4 : Math.random() < 0.05 ? 5 : Math.floor(Math.random() * 2)
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
        if (s.r > 1.2) {
          const glow = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
          glow.addColorStop(0, `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${opacity * 0.25})`);
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

/* ─── Workshop Box ─── */
function WorkshopBox({ children, title, icon, delay = 0, className = "" }: {
  children: React.ReactNode; title: string; icon: string; delay?: number; className?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(184,115,51,0.12)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <h3 className="text-xs font-mono uppercase tracking-wider text-[#D4956B]">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

/* ─── Themed Input ─── */
function DInput({ label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean }) {
  const t = useThemeContext();
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium font-body mb-1.5" style={{ color: t.textLabel, transition: "color 0.4s ease" }}>
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input
        {...props}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body focus:outline-none focus:ring-2 transition-all duration-300"
        style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText, transition: "background 0.4s ease, border-color 0.4s ease, color 0.4s ease" }}
      />
    </div>
  );
}

/* ─── Themed Select ─── */
function DSelect({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }) {
  const t = useThemeContext();
  return (
    <div>
      {label && <label className="block text-xs font-medium font-body mb-1.5" style={{ color: t.textLabel, transition: "color 0.4s ease" }}>{label}</label>}
      <select
        {...props}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body focus:outline-none focus:ring-2 transition-all duration-300 appearance-none"
        style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.inputText, transition: "background 0.4s ease, border-color 0.4s ease, color 0.4s ease" }}
      >
        <option value="" style={{ background: t.selectOptionBg }}>Select...</option>
        {options.map((o) => <option key={o.value} value={o.value} style={{ background: t.selectOptionBg }}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ─── Types ─── */
interface Ward {
  id: string;
  name: string;
  type: string;
  floor: number;
  rooms: Room[];
  counts: { total: number; AVAILABLE: number; OCCUPIED: number; RESERVED: number; MAINTENANCE: number; CLEANING: number };
}

interface Room {
  id: string;
  name: string;
  beds: Bed[];
}

interface Bed {
  id: string;
  label: string;
  status: string;
  patientId: string | null;
  reservedUntil: string | null;
}

const BED_STATUS_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  AVAILABLE: { bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.2)", text: "#22C55E", icon: "✓" },
  OCCUPIED: { bg: "rgba(14,165,233,0.06)", border: "rgba(14,165,233,0.2)", text: "#38BDF8", icon: "●" },
  RESERVED: { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", text: "#F59E0B", icon: "◐" },
  MAINTENANCE: { bg: "rgba(168,85,247,0.06)", border: "rgba(168,85,247,0.2)", text: "#A855F7", icon: "⚙" },
  CLEANING: { bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.2)", text: "#FB923C", icon: "✦" },
};

const WARD_TYPES = [
  { value: "general", label: "General", icon: "🏥" },
  { value: "icu", label: "ICU", icon: "❤️" },
  { value: "maternity", label: "Maternity", icon: "👶" },
  { value: "pediatric", label: "Pediatric", icon: "🧒" },
  { value: "surgical", label: "Surgical", icon: "🔬" },
];

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function BedManagementPage() {
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Bed Management" stationIcon="🛏️" allowedRoles={["nurse", "doctor", "admin", "super_admin"]}>
      {() => <BedManagementContent />}
    </StationGate>
  );
}

function BedManagementContent() {
  const theme = useStationTheme();
  const [activeNav, setActiveNav] = useState<"dashboard" | "manage" | "transitions">("dashboard");
  const [wards, setWards] = useState<Ward[]>([]);
  const [summary, setSummary] = useState({ totalBeds: 0, totalAvailable: 0, totalOccupied: 0 });
  const [, setSelectedWard] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [addingWard, setAddingWard] = useState(false);
  const [addingRoom, setAddingRoom] = useState<string | null>(null);
  const [addingBed, setAddingBed] = useState<string | null>(null);
  const [newWardForm, setNewWardForm] = useState({ name: "", type: "general", floor: 1 });
  const [newRoomName, setNewRoomName] = useState("");
  const [newBedLabel, setNewBedLabel] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/beds?hospitalCode=${HOSPITAL_CODE}`);
      if (res.ok) {
        const data = await res.json();
        setWards(data.wards || []);
        setSummary(data.summary || { totalBeds: 0, totalAvailable: 0, totalOccupied: 0 });
      }
    } catch { /* retry */ }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const createWard = async () => {
    if (!newWardForm.name.trim()) return;
    try {
      const res = await fetch("/api/beds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "create_ward", ...newWardForm }) });
      if (res.ok) { setNewWardForm({ name: "", type: "general", floor: 1 }); setAddingWard(false); loadDashboard(); }
    } catch { /* retry */ }
  };

  const createRoom = async (wardId: string) => {
    if (!newRoomName.trim()) return;
    try {
      const res = await fetch("/api/beds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "create_room", wardId, name: newRoomName }) });
      if (res.ok) { setNewRoomName(""); setAddingRoom(null); loadDashboard(); }
    } catch { /* retry */ }
  };

  const createBed = async (roomId: string) => {
    if (!newBedLabel.trim()) return;
    try {
      const res = await fetch("/api/beds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, action: "create_bed", roomId, label: newBedLabel }) });
      if (res.ok) { setNewBedLabel(""); setAddingBed(null); loadDashboard(); }
    } catch { /* retry */ }
  };

  const updateBedStatus = async (bedId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/beds", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bedId, status: newStatus, triggeredBy: "admin" }) });
      if (res.ok) loadDashboard();
    } catch { /* retry */ }
  };

  const NAV_ITEMS = [
    { id: "dashboard" as const, icon: "📊", label: "Dashboard" },
    { id: "manage" as const, icon: "🛏️", label: "Manage Beds" },
    { id: "transitions" as const, icon: "📋", label: "Activity Log" },
  ];

  return (
    <StationThemeProvider theme={theme}>
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 120% 80% at 55% 40%, rgba(20,12,8,1) 0%, rgba(8,5,15,1) 50%, rgba(2,4,12,1) 100%)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 55% 35%, rgba(184,115,51,0.04) 0%, transparent 50%)", pointerEvents: "none" }} />
      <GalaxyCanvas />

      {/* Header */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "16px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(184,115,51,0.08)", background: "rgba(3,5,15,0.3)", backdropFilter: "blur(12px)" }}>
        <div onClick={() => window.location.href = "/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh"} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: 300, fontSize: 13, color: theme.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Dalxic</span>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: theme.copperText }}>Bed Management</span>
          <div style={{ width: 1, height: 16, background: "rgba(184,115,51,0.15)" }} />
          <span style={{ fontSize: 13, color: theme.textSecondary }}>{HOSPITAL_NAME}</span>
          <div style={{ width: 1, height: 16, background: "rgba(184,115,51,0.15)" }} />
          <time suppressHydrationWarning style={{ fontFamily: fontFamily.mono, fontSize: 12, color: COPPER }}>
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </time>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 60px" }}>
        {/* Nav pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          {NAV_ITEMS.map((n) => (
            <motion.button key={n.id} type="button" onClick={() => setActiveNav(n.id)} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-body transition-all duration-300"
              style={{
                background: activeNav === n.id ? "rgba(184,115,51,0.1)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${activeNav === n.id ? COPPER + "40" : "rgba(255,255,255,0.05)"}`,
                color: activeNav === n.id ? "#D4956B" : "#64748B",
              }}>
              <span>{n.icon}</span>{n.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ═══════ DASHBOARD ═══════ */}
          {activeNav === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Total Beds", value: summary.totalBeds, color: COPPER },
                  { label: "Available", value: summary.totalAvailable, color: "#22C55E" },
                  { label: "Occupied", value: summary.totalOccupied, color: "#38BDF8" },
                  { label: "Occupancy Rate", value: summary.totalBeds > 0 ? `${Math.round((summary.totalOccupied / summary.totalBeds) * 100)}%` : "0%", color: "#F59E0B" },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ padding: 20, borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: theme.textMuted, marginBottom: 8 }}>{stat.label}</p>
                    <p style={{ fontSize: 32, fontWeight: 800, fontFamily: fontFamily.mono, color: stat.color }}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Ward cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {wards.map((ward, i) => {
                  const typeInfo = WARD_TYPES.find((t) => t.value === ward.type);
                  return (
                    <motion.div key={ward.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                      onClick={() => { setSelectedWard(ward.id); setActiveNav("manage"); }}
                      style={{ padding: 20, borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(184,115,51,0.1)", backdropFilter: "blur(12px)", cursor: "pointer", transition: "all 0.3s" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{ fontSize: 20 }}>{typeInfo?.icon || "🏥"}</span>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>{ward.name}</p>
                            <p style={{ fontSize: 10, fontWeight: 500, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Floor {ward.floor} — {typeInfo?.label || ward.type}</p>
                          </div>
                        </div>
                        <span style={{ fontSize: 24, fontWeight: 800, fontFamily: fontFamily.mono, color: COPPER }}>{ward.counts.total}</span>
                      </div>
                      {/* Status bar */}
                      <div style={{ display: "flex", gap: 4, height: 6, borderRadius: 3, overflow: "hidden", background: "rgba(255,255,255,0.03)", marginBottom: 10 }}>
                        {ward.counts.total > 0 && (
                          <>
                            <div style={{ width: `${(ward.counts.AVAILABLE / ward.counts.total) * 100}%`, background: "#22C55E", borderRadius: 3 }} />
                            <div style={{ width: `${(ward.counts.OCCUPIED / ward.counts.total) * 100}%`, background: "#38BDF8", borderRadius: 3 }} />
                            <div style={{ width: `${(ward.counts.RESERVED / ward.counts.total) * 100}%`, background: "#F59E0B", borderRadius: 3 }} />
                            <div style={{ width: `${(ward.counts.MAINTENANCE / ward.counts.total) * 100}%`, background: "#A855F7", borderRadius: 3 }} />
                            <div style={{ width: `${(ward.counts.CLEANING / ward.counts.total) * 100}%`, background: "#FB923C", borderRadius: 3 }} />
                          </>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        {Object.entries(ward.counts).filter(([k]) => k !== "total").map(([status, count]) => (
                          <span key={status} style={{ fontSize: 10, fontWeight: 600, color: BED_STATUS_COLORS[status]?.text || "#64748B" }}>
                            {BED_STATUS_COLORS[status]?.icon} {count}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
                {wards.length === 0 && (
                  <WorkshopBox title="No Wards Yet" icon="🏥" className="col-span-2">
                    <p style={{ fontSize: 13, color: theme.textMuted, marginBottom: 12 }}>Add Your First Ward To Get Started With Bed Management.</p>
                    <button type="button" onClick={() => { setActiveNav("manage"); setAddingWard(true); }}
                      style={{ fontSize: 12, fontWeight: 600, padding: "8px 16px", borderRadius: 8, background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, color: theme.textPrimary, border: "none", cursor: "pointer" }}>
                      + Create Ward
                    </button>
                  </WorkshopBox>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══════ MANAGE BEDS ═══════ */}
          {activeNav === "manage" && (
            <motion.div key="manage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Add ward button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary }}>{wards.length} Ward{wards.length !== 1 ? "s" : ""}</p>
                <button type="button" onClick={() => setAddingWard(!addingWard)}
                  style={{ fontSize: 11, fontWeight: 600, padding: "6px 14px", borderRadius: 8, background: "rgba(184,115,51,0.08)", border: `1px solid ${COPPER}25`, color: theme.copperText, cursor: "pointer" }}>
                  + Add Ward
                </button>
              </div>

              {/* New ward form */}
              <AnimatePresence>
                {addingWard && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <WorkshopBox title="New Ward" icon="🏥" className="mb-4">
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
                        <DInput label="Ward Name" value={newWardForm.name} onChange={(e) => setNewWardForm({ ...newWardForm, name: e.target.value })} placeholder="e.g. General Ward A" />
                        <DSelect label="Type" value={newWardForm.type} onChange={(e) => setNewWardForm({ ...newWardForm, type: e.target.value })} options={WARD_TYPES.map(t => ({ value: t.value, label: `${t.icon} ${t.label}` }))} />
                        <DInput label="Floor" type="number" min={1} value={newWardForm.floor} onChange={(e) => setNewWardForm({ ...newWardForm, floor: parseInt(e.target.value) || 1 })} />
                        <button type="button" onClick={createWard}
                          style={{ fontSize: 12, fontWeight: 600, padding: "8px 20px", borderRadius: 8, background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, color: theme.textPrimary, border: "none", cursor: "pointer" }}>
                          Create
                        </button>
                      </div>
                    </WorkshopBox>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wards with rooms and beds */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {wards.map((ward) => (
                  <WorkshopBox key={ward.id} title={ward.name} icon={WARD_TYPES.find((t) => t.value === ward.type)?.icon || "��"}>
                    {ward.rooms.map((room) => (
                      <div key={room.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: theme.textSecondary }}>{room.name}</span>
                          <button type="button" onClick={() => { setAddingBed(addingBed === room.id ? null : room.id); setNewBedLabel(""); }}
                            style={{ fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", color: theme.textMuted, cursor: "pointer" }}>
                            + Bed
                          </button>
                        </div>

                        {/* Bed grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
                          {room.beds.map((bed) => {
                            const style = BED_STATUS_COLORS[bed.status] || BED_STATUS_COLORS.AVAILABLE;
                            return (
                              <div key={bed.id} style={{
                                padding: "10px 12px", borderRadius: 10,
                                background: style.bg, border: `1px solid ${style.border}`,
                                position: "relative",
                              }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary }}>{bed.label}</span>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: style.text }}>{style.icon}</span>
                                </div>
                                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: style.text, marginBottom: 6 }}>{bed.status}</p>
                                {/* Quick status change */}
                                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                                  {Object.keys(BED_STATUS_COLORS).filter((s) => s !== bed.status).map((s) => (
                                    <button key={s} type="button" onClick={() => updateBedStatus(bed.id, s)}
                                      style={{ fontSize: 7, fontWeight: 600, padding: "2px 5px", borderRadius: 3, background: BED_STATUS_COLORS[s].bg, border: `1px solid ${BED_STATUS_COLORS[s].border}`, color: BED_STATUS_COLORS[s].text, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                                      {BED_STATUS_COLORS[s].icon} {s.slice(0, 4)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Add bed inline form */}
                        <AnimatePresence>
                          {addingBed === room.id && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                              style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                              <div className="flex-1">
                                <DInput value={newBedLabel} onChange={(e) => setNewBedLabel(e.target.value)} placeholder="e.g. Bed 1A"
                                  onKeyDown={(e) => { if (e.key === "Enter") createBed(room.id); }} />
                              </div>
                              <button type="button" onClick={() => createBed(room.id)}
                                style={{ fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 6, background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, color: theme.textPrimary, border: "none", cursor: "pointer" }}>
                                Add
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}

                    {/* Add room */}
                    {addingRoom === ward.id ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                        <div className="flex-1">
                          <DInput value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="e.g. Room 101"
                            onKeyDown={(e) => { if (e.key === "Enter") createRoom(ward.id); }} />
                        </div>
                        <button type="button" onClick={() => createRoom(ward.id)}
                          style={{ fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 6, background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, color: theme.textPrimary, border: "none", cursor: "pointer" }}>
                          Add Room
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => { setAddingRoom(ward.id); setNewRoomName(""); }}
                        style={{ fontSize: 10, fontWeight: 600, padding: "5px 12px", borderRadius: 6, background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(184,115,51,0.15)", color: theme.copperText, cursor: "pointer", marginTop: 8 }}>
                        + Add Room
                      </button>
                    )}
                  </WorkshopBox>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════ ACTIVITY LOG ═══════ */}
          {activeNav === "transitions" && (
            <motion.div key="transitions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkshopBox title="Bed Transition Log" icon="📋">
                <p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 32 }}>
                  Transitions Will Appear Here As Bed Statuses Change.
                  <br />
                  <span style={{ fontSize: 11, color: "#3D4D78" }}>Each Status Change Is Logged With Timestamp, Actor, And Patient Info.</span>
                </p>
              </WorkshopBox>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
    </StationThemeProvider>
  );
}
