"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COPPER, fontFamily } from "@/hooks/use-station-theme";

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
      color: [[255,255,255],[255,220,180],[184,115,51],[210,150,80],[14,165,233],[160,200,255],[255,180,120],[120,80,40]][
        Math.random() < 0.08 ? 2 : Math.random() < 0.12 ? 3 : Math.random() < 0.06 ? 4 : Math.random() < 0.05 ? 5 : Math.random() < 0.05 ? 6 : Math.random() < 0.04 ? 7 : Math.floor(Math.random() * 2)
      ],
    }));
    const dust = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 2.0, vy: (Math.random() - 0.5) * 1.2,
      r: Math.random() * 1.0 + 0.2, opacity: Math.random() * 0.25 + 0.05,
      color: Math.random() < 0.5 ? [184,115,51] : Math.random() < 0.6 ? [14,165,233] : Math.random() < 0.5 ? [255,180,120] : [160,200,255] as number[],
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

/* ─── Workshop Box ─── */
function WorkshopBox({ children, title, icon, delay = 0, className = "" }: {
  children: React.ReactNode; title: string; icon: string; delay?: number; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(184,115,51,0.12)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "#D4956B", fontFamily: fontFamily.mono }}>{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

/* ─── Dark Input ─── */
function DInput({ label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean }) {
  return (
    <div>
      {label && (
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "#94A3B8", marginBottom: 6 }}>
          {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
        </label>
      )}
      <input
        {...props}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body text-white placeholder:text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#B87333]/30 focus:border-[#B87333]/30 transition-all duration-300"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(184,115,51,0.15)" }}
      />
    </div>
  );
}

/* ─── Dark Select ─── */
function DSelect({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }) {
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "#94A3B8", marginBottom: 6 }}>{label}</label>}
      <select
        {...props}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-body text-white focus:outline-none focus:ring-2 focus:ring-[#B87333]/30 focus:border-[#B87333]/30 transition-all duration-300 appearance-none"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(184,115,51,0.15)" }}
      >
        <option value="" style={{ background: "#0a0a14" }}>Select...</option>
        {options.map((o) => <option key={o.value} value={o.value} style={{ background: "#0a0a14" }}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ─── Types ─── */
type AdminView = "overview" | "devices" | "books" | "staff";

interface DeviceItem {
  id: string;
  deviceCode: string;
  deviceName: string;
  role: string;
  isActive: boolean;
  isLocked: boolean;
  lastSeenAt: string | null;
}

interface BookItem {
  id: string;
  year: number;
  month: number;
  status: string;
  _count: { patientRecords: number };
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ROLE_OPTIONS = [
  { value: "front_desk", label: "Front Desk" },
  { value: "doctor", label: "Doctor" },
  { value: "lab", label: "Lab" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "nurse", label: "Nurse" },
  { value: "injection", label: "Injection" },
  { value: "radiology", label: "Radiology" },
  { value: "waiting_room", label: "Waiting Room" },
];

/* ─── Nav items ─── */
const NAV_ITEMS: { id: AdminView; icon: string; label: string }[] = [
  { id: "overview", icon: "📊", label: "Overview" },
  { id: "devices", icon: "📱", label: "Devices" },
  { id: "books", icon: "📚", label: "Monthly Books" },
  { id: "staff", icon: "👥", label: "Staff Access" },
];

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function AdminPage() {
  const [view, setView] = useState<AdminView>("overview");
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [newDevice, setNewDevice] = useState({ name: "", role: "", pin: "" });
  const [addingDevice, setAddingDevice] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hospitalId, setHospitalId] = useState<string>("");

  const loadData = useCallback(async (hId: string) => {
    if (!hId) return;
    try {
      const [devRes, bookRes, queueRes] = await Promise.all([
        fetch(`/api/devices?hospitalId=${hId}`),
        fetch(`/api/books?hospitalId=${hId}`),
        fetch(`/api/queue?hospitalCode=${HOSPITAL_CODE}`),
      ]);
      if (devRes.ok) setDevices(await devRes.json());
      if (bookRes.ok) setBooks(await bookRes.json());
      if (queueRes.ok) { const q = await queueRes.json(); setTodayCount(q.length); }
    } catch { /* retry */ }
  }, []);

  // Resolve hospital ID from code on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/hospitals?code=${HOSPITAL_CODE}`);
        if (res.ok) { const h = await res.json(); setHospitalId(h.id); loadData(h.id); }
      } catch { /* */ }
    })();
  }, [loadData]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleDeviceAction = async (deviceId: string, action: string) => {
    await fetch("/api/devices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, action, actorId: "admin", actorType: "hospital_admin" }),
    });
    loadData(hospitalId);
  };

  const handleAddDevice = async () => {
    if (!newDevice.name || !newDevice.role || !newDevice.pin) return;
    setAddingDevice(true);
    try {
      await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId: hospitalId, deviceName: newDevice.name, role: newDevice.role, pin: newDevice.pin, assignedBy: "admin" }),
      });
      setNewDevice({ name: "", role: "", pin: "" });
      loadData(hospitalId);
    } finally { setAddingDevice(false); }
  };

  const handleCloseBook = async (bookId: string) => {
    await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, actorId: "admin" }),
    });
    loadData(hospitalId);
  };

  const activeDevices = devices.filter((d) => d.isActive);
  const lockedDevices = devices.filter((d) => d.isLocked);

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 120% 80% at 55% 40%, rgba(20,12,8,1) 0%, rgba(8,5,15,1) 50%, rgba(2,4,12,1) 100%)", position: "relative", overflow: "hidden" }}>
      {/* Background layers */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 55% 35%, rgba(184,115,51,0.04) 0%, transparent 50%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(14,165,233,0.02) 0%, transparent 40%)", pointerEvents: "none" }} />
      <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.08 }} />
      <GalaxyCanvas />

      {/* Fixed header */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "16px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(184,115,51,0.08)", background: "rgba(3,5,15,0.3)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      }}>
        <div onClick={() => window.location.href = "/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh"} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: 300, fontSize: 13, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>Dalxic</span>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", background: `linear-gradient(135deg, ${COPPER}, #D4956B)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#D4956B" }}>Hospital Admin</span>
          <div style={{ width: 1, height: 16, background: "rgba(184,115,51,0.15)" }} />
          <span style={{ fontSize: 13, color: "#94A3B8" }}>{HOSPITAL_NAME}</span>
          <div style={{ width: 1, height: 16, background: "rgba(184,115,51,0.15)" }} />
          <time suppressHydrationWarning style={{ fontFamily: fontFamily.mono, fontSize: 12, color: COPPER }}>
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </time>
        </div>
      </header>

      {/* Main */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 60px" }}>

        {/* Nav pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          {NAV_ITEMS.map((n) => (
            <motion.button
              key={n.id}
              type="button"
              onClick={() => setView(n.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 500,
                background: view === n.id ? "rgba(184,115,51,0.1)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${view === n.id ? COPPER + "40" : "rgba(255,255,255,0.05)"}`,
                color: view === n.id ? "#D4956B" : "#64748B",
                boxShadow: view === n.id ? `0 0 20px ${COPPER}12` : "none",
                cursor: "pointer", transition: "all 0.3s",
              }}
            >
              <span>{n.icon}</span>
              {n.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ═══════ OVERVIEW ═══════ */}
          {view === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Today's Patients", value: todayCount, accent: true },
                  { label: "Active Devices", value: activeDevices.length, accent: false },
                  { label: "Locked Devices", value: lockedDevices.length, accent: false },
                  { label: "Monthly Books", value: books.length, accent: false },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      padding: 20, borderRadius: 16,
                      background: "rgba(255,255,255,0.025)",
                      border: `1px solid ${stat.accent ? "rgba(184,115,51,0.2)" : "rgba(255,255,255,0.05)"}`,
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <p style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, fontFamily: fontFamily.mono, color: stat.accent ? COPPER : "white" }}>
                      {stat.value}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "#94A3B8", marginTop: 4 }}>{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Quick actions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <WorkshopBox title="Quick Actions" icon="⚡" delay={0.1}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Manage Devices", action: () => setView("devices"), icon: "📱" },
                      { label: "View Books", action: () => setView("books"), icon: "📚" },
                      { label: "Staff Access Log", action: () => setView("staff"), icon: "👥" },
                      { label: "Refresh Data", action: () => loadData(hospitalId), icon: "🔄" },
                    ].map((item) => (
                      <motion.button
                        key={item.label}
                        whileHover={{ y: -2, boxShadow: `0 8px 32px ${COPPER}08` }}
                        whileTap={{ scale: 0.97 }}
                        onClick={item.action}
                        style={{
                          padding: "16px 12px", borderRadius: 14, cursor: "pointer",
                          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(184,115,51,0.1)",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                          transition: "all 0.3s",
                        }}
                      >
                        <span style={{ fontSize: 24 }}>{item.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>{item.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </WorkshopBox>

                <WorkshopBox title="System Status" icon="🖥️" delay={0.15}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { label: "Database", status: "Operational", ok: true },
                      { label: "Real-Time Sync", status: "Connected", ok: true },
                      { label: "Audit Logging", status: "Active", ok: true },
                      { label: "Backup Service", status: "Scheduled", ok: true },
                    ].map((item) => (
                      <div key={item.label} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px", borderRadius: 12,
                        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                      }}>
                        <span style={{ fontSize: 14.5, fontWeight: 500, color: "white" }}>{item.label}</span>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.ok ? "#10B981" : "#EF4444" }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: item.ok ? "#10B981" : "#EF4444" }}>{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </WorkshopBox>
              </div>
            </motion.div>
          )}

          {/* ═══════ DEVICES ═══════ */}
          {view === "devices" && (
            <motion.div key="devices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Register new device */}
              <WorkshopBox title="Register New Device" icon="📱" delay={0.05}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
                  <DInput label="Device Name" placeholder="e.g. Front Desk Tablet 1" value={newDevice.name} onChange={(e) => setNewDevice((d) => ({ ...d, name: e.target.value }))} required />
                  <DSelect label="Role" options={ROLE_OPTIONS} value={newDevice.role} onChange={(e) => setNewDevice((d) => ({ ...d, role: e.target.value }))} />
                  <DInput label="PIN" type="password" placeholder="Device PIN" value={newDevice.pin} onChange={(e) => setNewDevice((d) => ({ ...d, pin: e.target.value }))} required />
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleAddDevice}
                    disabled={addingDevice}
                    style={{
                      padding: "10px 24px", borderRadius: 12, fontSize: 15, fontWeight: 600,
                      color: "white", cursor: "pointer",
                      background: `linear-gradient(135deg, ${COPPER}, #D4956B)`,
                      border: "none", boxShadow: `0 4px 24px ${COPPER}20`,
                      opacity: addingDevice ? 0.6 : 1, transition: "all 0.3s",
                      height: 42,
                    }}
                  >
                    {addingDevice ? "..." : "Register"}
                  </motion.button>
                </div>
              </WorkshopBox>

              {/* Device list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
                {devices.map((device, i) => (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      padding: 20, borderRadius: 16,
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(184,115,51,0.12)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "rgba(184,115,51,0.08)", border: "1px solid rgba(184,115,51,0.15)",
                        }}>
                          <span style={{ fontFamily: fontFamily.mono, fontSize: 12, fontWeight: 700, color: COPPER }}>
                            {device.deviceCode.slice(0, 3)}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{device.deviceName}</p>
                          <p style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8", textTransform: "capitalize" }}>
                            {device.role.replace("_", " ")}
                            {device.lastSeenAt && ` — Last seen ${new Date(device.lastSeenAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Status badges */}
                        <span style={{
                          fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase",
                          padding: "4px 10px", borderRadius: 6,
                          background: device.isActive ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                          border: `1px solid ${device.isActive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
                          color: device.isActive ? "#10B981" : "#EF4444",
                        }}>
                          {device.isActive ? "Active" : "Inactive"}
                        </span>
                        {device.isLocked && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase",
                            padding: "4px 10px", borderRadius: 6,
                            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", color: "#F59E0B",
                          }}>
                            Locked
                          </span>
                        )}

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8 }}>
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeviceAction(device.id, device.isLocked ? "unlock" : "lock")}
                            style={{
                              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                              color: "#94A3B8", cursor: "pointer", transition: "all 0.3s",
                            }}
                          >
                            {device.isLocked ? "Unlock" : "Lock"}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeviceAction(device.id, device.isActive ? "deactivate" : "activate")}
                            style={{
                              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                              color: "#94A3B8", cursor: "pointer", transition: "all 0.3s",
                            }}
                          >
                            {device.isActive ? "Deactivate" : "Activate"}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {devices.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", paddingTop: 48, paddingBottom: 48 }}>
                    <p style={{ fontSize: 14.5, fontWeight: 500, color: "#94A3B8" }}>No Devices Registered</p>
                    <p style={{ fontSize: 12, fontWeight: 500, color: "#4A5568", marginTop: 4 }}>Use The Form Above To Register Your First Device</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══════ MONTHLY BOOKS ═══════ */}
          {view === "books" && (
            <motion.div key="books" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {books.map((book, i) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      padding: 20, borderRadius: 16,
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(184,115,51,0.12)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 12,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "linear-gradient(135deg, rgba(184,115,51,0.15), rgba(184,115,51,0.05))",
                          border: "1px solid rgba(184,115,51,0.15)",
                        }}>
                          <span style={{ fontFamily: fontFamily.mono, fontSize: 12, fontWeight: 700, color: COPPER }}>
                            {MONTH_NAMES[book.month - 1]}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{MONTH_NAMES[book.month - 1]} {book.year}</p>
                          <p style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8" }}>{book._count.patientRecords} Records</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase",
                          padding: "4px 10px", borderRadius: 6,
                          background: book.status === "active" ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${book.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)"}`,
                          color: book.status === "active" ? "#10B981" : "#94A3B8",
                        }}>
                          {book.status}
                        </span>
                        {book.status === "active" && (
                          <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => handleCloseBook(book.id)}
                            style={{
                              padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                              color: "white", cursor: "pointer",
                              background: `linear-gradient(135deg, ${COPPER}, #D4956B)`,
                              border: "none", transition: "all 0.3s",
                            }}
                          >
                            Close Book
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => window.open(`/api/reports?bookId=${book.id}&type=monthly`)}
                          style={{
                            padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                            color: "#94A3B8", cursor: "pointer", transition: "all 0.3s",
                          }}
                        >
                          Download PDF
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {books.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", paddingTop: 48, paddingBottom: 48 }}>
                    <p style={{ fontSize: 14.5, fontWeight: 500, color: "#94A3B8" }}>No Books Yet</p>
                    <p style={{ fontSize: 12, fontWeight: 500, color: "#4A5568", marginTop: 4 }}>Monthly Books Are Created Automatically When The First Patient Is Registered Each Month</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══════ STAFF ACCESS ═══════ */}
          {view === "staff" && (
            <motion.div key="staff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WorkshopBox title="Staff Access Log" icon="👥" delay={0.05}>
                <div style={{ textAlign: "center", paddingTop: 40, paddingBottom: 40 }}>
                  <div style={{ width: 64, height: 64, margin: "0 auto 16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(184,115,51,0.15)" }}>
                    <span style={{ fontSize: 24 }}>🔐</span>
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: "white", marginBottom: 8 }}>Access Log Active</p>
                  <p style={{ fontSize: 14.5, fontWeight: 500, color: "#94A3B8", lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
                    External Access Grants From Dalxic Support Staff Will Appear Here. All Actions Are Logged With Timestamps And IP Addresses.
                  </p>
                </div>
              </WorkshopBox>

              <WorkshopBox title="Access Policy" icon="🛡️" delay={0.1} className="mt-4">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { rule: "All Emergency Override Sessions Are Logged Permanently", severity: "critical" },
                    { rule: "Device PIN Changes Require Admin Confirmation", severity: "high" },
                    { rule: "Dalxic Support Access Requires Hospital Admin Approval", severity: "high" },
                    { rule: "Audit Trail Cannot Be Modified Or Deleted", severity: "critical" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.04 }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 16px", borderRadius: 12,
                        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                        background: item.severity === "critical" ? "#EF4444" : "#F59E0B",
                      }} />
                      <span style={{ fontSize: 14.5, fontWeight: 500, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>{item.rule}</span>
                    </motion.div>
                  ))}
                </div>
              </WorkshopBox>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
