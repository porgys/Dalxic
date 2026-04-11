"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const COPPER = "#B87333";
const COPPER_LIGHT = "#D4956B";

function GalaxyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const stars: { x: number; y: number; r: number; a: number; s: number }[] = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 120; i++) stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.2, a: Math.random(), s: 0.002 + Math.random() * 0.006 });
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.a += s.s;
        if (s.a > 1) s.s = -Math.abs(s.s);
        if (s.a < 0.1) s.s = Math.abs(s.s);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(184,115,51,${s.a * 0.4})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 120% 80% at 55% 40%, rgba(10,6,4,1) 0%, rgba(4,2,8,1) 50%, rgba(1,2,6,1) 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <GalaxyCanvas />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(184,115,51,0.04) 0%, transparent 55%)", pointerEvents: "none" }} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 520, padding: "0 24px" }}
      >
        {/* 404 number */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{ fontSize: 140, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em", fontFamily: "var(--font-outfit), Outfit, sans-serif", background: `linear-gradient(135deg, ${COPPER}30, ${COPPER}08)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}
        >
          404
        </motion.div>

        {/* Divider */}
        <div style={{ width: 60, height: 2, background: `linear-gradient(90deg, transparent, ${COPPER}40, transparent)`, margin: "0 auto 28px" }} />

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ fontSize: 24, fontWeight: 800, color: "#F0F4FF", marginBottom: 12, fontFamily: "var(--font-outfit), Outfit, sans-serif", letterSpacing: "-0.02em" }}
        >
          Signal Lost
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, fontFamily: "var(--font-outfit), Outfit, sans-serif", marginBottom: 36 }}
        >
          The page you are looking for does not exist, has been moved, or is behind an encrypted access point. If you believe this is an error, contact your system administrator.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ display: "flex", gap: 12, justifyContent: "center" }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ padding: "14px 32px", borderRadius: 14, cursor: "pointer", background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              Return Home
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.history.back()}
            style={{ padding: "14px 32px", borderRadius: 14, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: `1.5px solid ${COPPER}20`, color: COPPER_LIGHT, fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            Go Back
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{ position: "absolute", bottom: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: COPPER, fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
          Dalxic Health
        </span>
        <span style={{ fontSize: 9, color: "#1E293B", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
          Worlds Best Hospital Management System
        </span>
      </motion.div>
    </div>
  );
}
