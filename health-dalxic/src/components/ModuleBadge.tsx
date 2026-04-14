"use client";

import { useState } from "react";
import type { AddonModule } from "@/lib/modules";

/**
 * ModuleBadge — cross-module visibility chip.
 *
 * Renders a small module icon in any workstation header. When the module is
 * active for the hospital, it's a live tap-target (copper glow, opens module).
 * When locked, it's grayscale with a lock overlay and tooltip inviting the
 * user to activate it in Master Admin. The visibility itself is the upsell.
 */
export function ModuleBadge({
  module,
  active,
}: {
  module: AddonModule;
  active: boolean;
}) {
  const [hover, setHover] = useState(false);

  const handleClick = () => {
    if (active) {
      window.location.href = module.href;
    }
  };

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        onClick={handleClick}
        aria-label={active ? `Open ${module.label}` : `${module.label} — locked, activate in Master Admin`}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: active
            ? `linear-gradient(135deg, ${module.colorActive}22, ${module.colorActive}08)`
            : "rgba(255,255,255,0.04)",
          border: active
            ? `1px solid ${module.colorActive}66`
            : "1px solid rgba(255,255,255,0.06)",
          cursor: active ? "pointer" : "not-allowed",
          filter: active ? "none" : "grayscale(1) opacity(0.45)",
          boxShadow: active && hover ? `0 0 16px ${module.colorActive}66` : "none",
          transition: "box-shadow 180ms ease, filter 220ms ease",
          fontSize: 18,
          padding: 0,
        }}
      >
        <span>{module.icon}</span>
        {!active && (
          <span
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 14,
              height: 14,
              borderRadius: 7,
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8,
            }}
          >
            🔒
          </span>
        )}
      </button>

      {hover && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translate(-50%, 6px)",
            whiteSpace: "nowrap",
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(15,23,42,0.96)",
            border: `1px solid ${active ? module.colorActive + "55" : "rgba(255,255,255,0.08)"}`,
            color: "#F5F5F0",
            fontSize: 11,
            fontWeight: 600,
            zIndex: 1000,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 800, letterSpacing: 0.3, fontSize: 12 }}>{module.label}</div>
          <div style={{ marginTop: 2, fontWeight: 500, color: "rgba(245,245,240,0.65)" }}>
            {active ? module.tagline : `Locked · Activate in Master Admin (${module.tier}+)`}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ModuleStrip — renders the entire registry as a horizontal strip of badges.
 * Drop into any workstation header to surface all add-on modules at once.
 */
export function ModuleStrip({
  registry,
  activeModules,
}: {
  registry: AddonModule[];
  activeModules: string[];
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {registry.map((m) => (
        <ModuleBadge key={m.key} module={m} active={activeModules.includes(m.key)} />
      ))}
    </div>
  );
}
