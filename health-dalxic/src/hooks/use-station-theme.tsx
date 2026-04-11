"use client";

import { useState, useCallback, createContext, useContext } from "react";

/* ═══════════════════════════════════════════════════════════════════════════════
   MASTER DESIGN TOKENS — Single source of truth for all DalxicHealth UI
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─── Brand Colors ─── */
export const COPPER = "#B87333";
export const COPPER_LIGHT = "#D4956B";
export const BLUE = "#0EA5E9";

/* ─── Typography Tokens ─── */
export const fontSize = {
  xs: 9,       // badges, status pills, fine print
  sm: 13,      // descriptions, helper text (accessibility minimum)
  base: 14,    // form inputs, body text
  lg: 16,      // sub-headings, icons
  xl: 20,      // section headings
  "2xl": 28,   // page headings
  display: 36, // hero numbers
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  heavy: 800,
} as const;

export const letterSpacing = {
  tight: "-0.02em",
  normal: "0",
  wide: "0.04em",
  wider: "0.08em",
  widest: "0.2em",
} as const;

export const fontFamily = {
  primary: "var(--font-outfit), Outfit, sans-serif",
  mono: "var(--font-jetbrains-mono), monospace",
} as const;

/* ─── Layout Tokens ─── */
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 16,
  "2xl": 20,
} as const;

export const spacing = {
  cardPadding: "24px 20px",
  sectionGap: 20,
} as const;

/* ─── Composite Style Presets ─── */
export function getStyles(isDayMode: boolean) {
  const d = !isDayMode; // dark mode flag
  return {
    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: radius.md,
      fontSize: fontSize.base,
      background: d ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.7)",
      border: `1px solid ${d ? COPPER + "12" : "rgba(139,90,43,0.2)"}`,
      color: d ? "#E2E8F0" : "#1A1714",
      outline: "none",
      fontFamily: fontFamily.primary,
    } as const,
    label: {
      display: "block" as const,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      color: d ? "#64748B" : "#5C534A",
      marginBottom: 6,
    } as const,
    card: {
      padding: spacing.cardPadding,
      borderRadius: radius.xl,
      background: d ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.82)",
      border: `1px solid ${d ? COPPER + "10" : "rgba(139,90,43,0.18)"}`,
      marginBottom: spacing.sectionGap,
    } as const,
    sectionTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.heavy,
      color: d ? COPPER_LIGHT : "#8B5A2B",
      letterSpacing: wider,
      textTransform: "uppercase" as const,
    } as const,
    description: {
      fontSize: fontSize.sm,
      color: d ? "#64748B" : "#6B7280",
      lineHeight: 1.6,
      marginBottom: 14,
    } as const,
    primaryButton: {
      padding: "10px 20px",
      borderRadius: radius.md,
      fontSize: 12,
      fontWeight: fontWeight.bold,
      letterSpacing: letterSpacing.wider,
      textTransform: "uppercase" as const,
      color: "#fff",
      cursor: "pointer",
      background: `linear-gradient(135deg, ${COPPER}, ${COPPER_LIGHT})`,
      border: "none",
      fontFamily: fontFamily.primary,
    } as const,
    secondaryButton: {
      padding: "10px 20px",
      borderRadius: radius.md,
      fontSize: 12,
      fontWeight: fontWeight.bold,
      letterSpacing: letterSpacing.wider,
      textTransform: "uppercase" as const,
      color: d ? "#64748B" : "#6B7280",
      cursor: "pointer",
      background: d ? "rgba(255,255,255,0.03)" : "rgba(139,90,43,0.04)",
      border: `1px solid ${d ? "rgba(255,255,255,0.06)" : "rgba(139,90,43,0.12)"}`,
      fontFamily: fontFamily.primary,
    } as const,
    statusBadge: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      padding: "2px 6px",
      borderRadius: radius.sm - 2,
      letterSpacing: "0.05em",
      textTransform: "uppercase" as const,
    } as const,
    feedbackMsg: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    } as const,
    sectionLabel: {
      fontSize: 10,
      fontWeight: fontWeight.bold,
      color: d ? "#475569" : "#6B7280",
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      marginBottom: 4,
    } as const,
  };
}

const wider = letterSpacing.wider;

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
