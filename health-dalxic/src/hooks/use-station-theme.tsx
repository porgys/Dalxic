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
      background: d ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
      border: `1px solid ${d ? COPPER + "12" : "rgba(139,90,43,0.55)"}`,
      color: d ? "#E2E8F0" : "#0D0A07",
      outline: "none",
      fontFamily: fontFamily.primary,
    } as const,
    label: {
      display: "block" as const,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      color: d ? "#64748B" : "#3A3228",
      marginBottom: 6,
    } as const,
    card: {
      padding: spacing.cardPadding,
      borderRadius: radius.xl,
      background: d ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)",
      border: `1px solid ${d ? COPPER + "10" : "rgba(139,90,43,0.5)"}`,
      marginBottom: spacing.sectionGap,
    } as const,
    sectionTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.heavy,
      color: d ? COPPER_LIGHT : "#5C3D1A",
      letterSpacing: wider,
      textTransform: "uppercase" as const,
    } as const,
    description: {
      fontSize: fontSize.sm,
      color: d ? "#64748B" : "#4A4035",
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
      color: d ? "#64748B" : "#4A4035",
      cursor: "pointer",
      background: d ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
      border: `1px solid ${d ? "rgba(255,255,255,0.06)" : "rgba(139,90,43,0.06)"}`,
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
      color: d ? "#475569" : "#7C7268",
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
  const toggle = useCallback(() => setIsDayMode((p) => {
    const next = !p;
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next ? "light" : "dark");
    }
    return next;
  }), []);

  if (isDayMode) {
    return {
      isDayMode: true,
      toggle,
      /* ── Warm parchment base ── */
      pageBg: "linear-gradient(180deg, #EDE5DB 0%, #E4DACE 30%, #D9CFC0 60%, #D0C4B3 100%)",
      /* ── Surfaces: 5% darker tint from bg, NOT white overlay ── */
      cardBg: "rgba(0,0,0,0.03)",           // 3% darken — barely visible, matches dark mode's 2.5% lighten
      cardBorder: "1px solid rgba(139,90,43,0.5)",
      cardShadow: "none",
      cardHoverBg: "rgba(0,0,0,0.05)",      // 5% darken on hover — matches dark's 4% lighten
      cardHoverBorder: "rgba(139,90,43,0.6)",
      cardHoverShadow: "none",
      /* ── Header: blend into page ── */
      headerBg: "rgba(237,229,219,0.9)",
      headerBorder: "1px solid rgba(139,90,43,0.12)",
      /* ── Inputs: subtle inset feel ── */
      inputBg: "rgba(0,0,0,0.04)",          // inset tint, not white box
      inputBorder: "rgba(139,90,43,0.55)",
      inputText: "#0D0A07",
      inputPlaceholder: "#9CA3AF",
      inputFocusRing: "rgba(184,115,51,0.2)",
      selectOptionBg: "#E4DACE",
      /* ── Text: 7:1+ primary, 4.5:1+ secondary, muted holds ── */
      textPrimary: "#0D0A07",               // near-black
      textSecondary: "#2C2418",             // dark brown
      textMuted: "#4A4035",                 // warm dark gray
      textLabel: "#3A3228",                 // dark label
      /* ── Ambient layers: almost invisible ── */
      canvasOpacity: 0.06,
      overlayCopper: "rgba(184,115,51,0.02)",
      overlayBlue: "rgba(14,165,233,0.01)",
      gridOpacity: 0.03,
      /* ── Nav: copper tinted, not opaque ── */
      navActiveBg: "rgba(139,90,43,0.08)",
      navActiveBorder: "rgba(139,90,43,0.55)",
      navActiveText: "#4A2D15",
      navInactiveBg: "rgba(0,0,0,0.02)",
      navInactiveBorder: "rgba(139,90,43,0.35)",
      navInactiveText: "#4A4035",
      /* ── Copper accent: darker for contrast on light bg ── */
      copperText: "#5C3D1A",
      copperSubtle: "rgba(139,90,43,0.08)",
      /* ── Dividers + chips ── */
      divider: "rgba(139,90,43,0.45)",
      chipBg: "rgba(139,90,43,0.04)",
      chipBorder: "rgba(139,90,43,0.45)",
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

/* ─── Toggle Button Component (disabled — day mode not yet ready) ─── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ThemeToggle({ isDayMode, onToggle }: { isDayMode: boolean; onToggle: () => void }) {
  return null;
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
