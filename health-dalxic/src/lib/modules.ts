/**
 * MODULE_REGISTRY — cross-module visibility + upsell pattern.
 *
 * Every add-on module that should surface its icon inside OTHER workstations
 * (grayed/locked when inactive, lively when active) is listed here. The
 * ModuleBadge component renders from this registry so new modules appear
 * everywhere automatically once added to this file.
 *
 * Tier baseline: minimum tier the module is sold on. The actual switch is
 * always the hospital's active_modules array — tier is just pricing metadata
 * for the upsell tooltip.
 */

import { ROUTE_MAP } from "./tier-defaults";

export type AddonModule = {
  key: string;            // matches active_modules entry
  icon: string;           // emoji or short symbol
  label: string;          // friendly display name
  tagline: string;        // one-line pitch for the tooltip
  tier: "T1" | "T2" | "T3" | "T4";
  href: string;           // obfuscated workstation route when active
  colorActive: string;    // CSS color for the "live" state
};

export const MODULE_REGISTRY: AddonModule[] = [
  {
    key: "cards_bookings",
    icon: "💳",
    label: "Cards & Bookings",
    tagline: "Patient cards, printouts & appointment scheduling",
    tier: "T1",
    href: ROUTE_MAP.cards_bookings,
    colorActive: "#B87333", // copper
  },
  {
    key: "bookkeeping",
    icon: "📊",
    label: "Bookkeeping",
    tagline: "Records, revenue dashboards and financial assessments",
    tier: "T3",
    href: ROUTE_MAP.bookkeeping,
    colorActive: "#3B82F6", // blue
  },
];

/** Filter registry by modules the hospital has activated. */
export function activeModules(registry: AddonModule[], active: string[]): AddonModule[] {
  return registry.filter((m) => active.includes(m.key));
}

/** Filter registry by modules NOT yet activated (the upsell pile). */
export function lockedModules(registry: AddonModule[], active: string[]): AddonModule[] {
  return registry.filter((m) => !active.includes(m.key));
}
