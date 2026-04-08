"use client";

import { useState, useCallback, createContext, useContext } from "react";

const COPPER = "#B87333";

export interface StationTheme {
  isDayMode: boolean;
  toggle: () => void;
  /* Backgrounds */
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  cardHoverBg: string;
  cardHoverBorder: string;
  cardHoverShadow: string;
  /* Header */
  headerBg: string;
  headerBorder: string;
  /* Inputs & form elements */
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  inputFocusRing: string;
  selectOptionBg: string;
  /* Text */
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textLabel: string;
  /* Overlay layers */
  canvasOpacity: number;
  overlayCopper: string;
  overlayBlue: string;
  gridOpacity: number;
  /* Nav pills */
  navActiveBg: string;
  navActiveBorder: string;
  navActiveText: string;
  navInactiveBg: string;
  navInactiveBorder: string;
  navInactiveText: string;
  /* Copper accents */
  copperText: string;
  copperSubtle: string;
  /* Dividers */
  divider: string;
  /* Badge / chip backgrounds */
  chipBg: string;
  chipBorder: string;
}

export function useStationTheme(): StationTheme {
  const [isDayMode, setIsDayMode] = useState(false);
  const toggle = useCallback(() => setIsDayMode((p) => !p), []);

  if (isDayMode) {
    return {
      isDayMode: true,
      toggle,
      pageBg: "linear-gradient(180deg, #EDE5DB 0%, #E4DACE 30%, #D9CFC0 60%, #D0C4B3 100%)",
      cardBg: "rgba(255,255,255,0.82)",
      cardBorder: "1.5px solid rgba(139,90,43,0.18)",
      cardShadow: "0 4px 20px rgba(139,90,43,0.08), 0 0 40px rgba(184,115,51,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
      cardHoverBg: "rgba(255,255,255,0.92)",
      cardHoverBorder: "rgba(184,140,80,0.30)",
      cardHoverShadow: "0 8px 32px rgba(139,90,43,0.12), 0 0 48px rgba(184,115,51,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
      headerBg: "rgba(237,229,219,0.85)",
      headerBorder: "1px solid rgba(139,90,43,0.12)",
      inputBg: "rgba(255,255,255,0.7)",
      inputBorder: "rgba(139,90,43,0.2)",
      inputText: "#1A1714",
      inputPlaceholder: "#9CA3AF",
      inputFocusRing: "rgba(184,115,51,0.25)",
      selectOptionBg: "#F5F0EB",
      textPrimary: "#1A1714",
      textSecondary: "#4A4035",
      textMuted: "#6B7280",
      textLabel: "#5C534A",
      canvasOpacity: 0.08,
      overlayCopper: "rgba(184,115,51,0.03)",
      overlayBlue: "rgba(14,165,233,0.015)",
      gridOpacity: 0.04,
      navActiveBg: "rgba(184,115,51,0.1)",
      navActiveBorder: `${COPPER}50`,
      navActiveText: "#8B5A2B",
      navInactiveBg: "rgba(139,90,43,0.04)",
      navInactiveBorder: "rgba(139,90,43,0.12)",
      navInactiveText: "#6B7280",
      copperText: "#8B5A2B",
      copperSubtle: "rgba(139,90,43,0.12)",
      divider: "rgba(139,90,43,0.15)",
      chipBg: "rgba(139,90,43,0.06)",
      chipBorder: "rgba(139,90,43,0.15)",
    };
  }

  return {
    isDayMode: false,
    toggle,
    pageBg: "radial-gradient(ellipse 120% 80% at 55% 40%, rgba(20,12,8,1) 0%, rgba(8,5,15,1) 50%, rgba(2,4,12,1) 100%)",
    cardBg: "rgba(255,255,255,0.025)",
    cardBorder: "1px solid rgba(184,115,51,0.12)",
    cardShadow: "none",
    cardHoverBg: "rgba(255,255,255,0.04)",
    cardHoverBorder: `${COPPER}40`,
    cardHoverShadow: `0 0 20px ${COPPER}12`,
    headerBg: "rgba(3,5,15,0.3)",
    headerBorder: "1px solid rgba(184,115,51,0.08)",
    inputBg: "rgba(255,255,255,0.04)",
    inputBorder: "rgba(184,115,51,0.15)",
    inputText: "#FFFFFF",
    inputPlaceholder: "#4A5568",
    inputFocusRing: "rgba(184,115,51,0.3)",
    selectOptionBg: "#0a0a14",
    textPrimary: "#F0F4FF",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    textLabel: "#94A3B8",
    canvasOpacity: 1,
    overlayCopper: "rgba(184,115,51,0.04)",
    overlayBlue: "rgba(14,165,233,0.02)",
    gridOpacity: 0.08,
    navActiveBg: "rgba(184,115,51,0.1)",
    navActiveBorder: `${COPPER}40`,
    navActiveText: "#D4956B",
    navInactiveBg: "rgba(255,255,255,0.02)",
    navInactiveBorder: "rgba(255,255,255,0.05)",
    navInactiveText: "#64748B",
    copperText: COPPER,
    copperSubtle: `${COPPER}15`,
    divider: "rgba(184,115,51,0.15)",
    chipBg: `${COPPER}08`,
    chipBorder: `${COPPER}12`,
  };
}

/* ─── Toggle Button Component ─── */
export function ThemeToggle({ isDayMode, onToggle }: { isDayMode: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
        background: isDayMode
          ? "linear-gradient(135deg, #F59E0B, #FBBF24)"
          : "linear-gradient(135deg, #1E293B, #334155)",
        position: "relative",
        transition: "background 0.4s ease",
        boxShadow: isDayMode
          ? "0 2px 8px rgba(245,158,11,0.3)"
          : "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        position: "absolute", top: 3,
        left: isDayMode ? 27 : 3,
        background: isDayMode ? "#FFF" : "#0F172A",
        transition: "left 0.3s ease, background 0.3s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: isDayMode ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
      }}>
        <span style={{ fontSize: 12, lineHeight: 1 }}>{isDayMode ? "\u2600\uFE0F" : "\uD83C\uDF19"}</span>
      </div>
    </button>
  );
}

/* ─── Theme Context (avoids prop-drilling through every component) ─── */
const ThemeContext = createContext<StationTheme | null>(null);

export function StationThemeProvider({ children, theme }: { children: React.ReactNode; theme: StationTheme }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): StationTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback to dark mode defaults if used outside provider
    return {
      isDayMode: false, toggle: () => {},
      pageBg: "radial-gradient(ellipse 120% 80% at 55% 40%, rgba(20,12,8,1) 0%, rgba(8,5,15,1) 50%, rgba(2,4,12,1) 100%)",
      cardBg: "rgba(255,255,255,0.025)", cardBorder: "1px solid rgba(184,115,51,0.12)", cardShadow: "none",
      cardHoverBg: "rgba(255,255,255,0.04)", cardHoverBorder: `${COPPER}40`, cardHoverShadow: `0 0 20px ${COPPER}12`,
      headerBg: "rgba(3,5,15,0.3)", headerBorder: "1px solid rgba(184,115,51,0.08)",
      inputBg: "rgba(255,255,255,0.04)", inputBorder: "rgba(184,115,51,0.15)", inputText: "#FFFFFF",
      inputPlaceholder: "#4A5568", inputFocusRing: "rgba(184,115,51,0.3)", selectOptionBg: "#0a0a14",
      textPrimary: "#F0F4FF", textSecondary: "#94A3B8", textMuted: "#64748B", textLabel: "#94A3B8",
      canvasOpacity: 1, overlayCopper: "rgba(184,115,51,0.04)", overlayBlue: "rgba(14,165,233,0.02)", gridOpacity: 0.08,
      navActiveBg: "rgba(184,115,51,0.1)", navActiveBorder: `${COPPER}40`, navActiveText: "#D4956B",
      navInactiveBg: "rgba(255,255,255,0.02)", navInactiveBorder: "rgba(255,255,255,0.05)", navInactiveText: "#64748B",
      copperText: COPPER, copperSubtle: `${COPPER}15`, divider: "rgba(184,115,51,0.15)",
      chipBg: `${COPPER}08`, chipBorder: `${COPPER}12`,
    };
  }
  return ctx;
}
