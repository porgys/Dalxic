/**
 * Tier configuration — controls what features each pricing tier unlocks.
 * T1 = Free starter, T2 = Growth, T3 = Business, T4 = Enterprise
 */

export interface TierConfig {
  name: string;
  maxOperators: number;
  whatsappBundle: number;
  activeModules: string[];
}

export const TIER_DEFAULTS: Record<string, TierConfig> = {
  T1: {
    name: "Starter",
    maxOperators: 1,
    whatsappBundle: 0,
    activeModules: [
      "trade.categories",
      "trade.products",
      "trade.sales",
      "trade.inventory",
      "institute.groups",
      "institute.members",
    ],
  },
  T2: {
    name: "Growth",
    maxOperators: 3,
    whatsappBundle: 100,
    activeModules: [
      "trade.categories",
      "trade.products",
      "trade.sales",
      "trade.inventory",
      "trade.analytics",
      "trade.orders",
      "institute.groups",
      "institute.members",
      "institute.staff",
      "institute.fees",
      "institute.schedule",
      "whatsapp",
    ],
  },
  T3: {
    name: "Business",
    maxOperators: 10,
    whatsappBundle: 500,
    activeModules: [
      "trade.categories",
      "trade.products",
      "trade.sales",
      "trade.inventory",
      "trade.analytics",
      "trade.orders",
      "trade.reports",
      "institute.groups",
      "institute.members",
      "institute.staff",
      "institute.fees",
      "institute.schedule",
      "institute.reports",
      "whatsapp",
      "audit",
      "multi-branch",
    ],
  },
  T4: {
    name: "Enterprise",
    maxOperators: 999,
    whatsappBundle: 2000,
    activeModules: ["*"], // All modules
  },
};

/** Check if an org's active modules include a specific module */
export function hasModule(activeModules: string[], module: string): boolean {
  return activeModules.includes("*") || activeModules.includes(module);
}

/** Get tier defaults, fallback to T1 */
export function getTierDefaults(tier: string): TierConfig {
  return TIER_DEFAULTS[tier] || TIER_DEFAULTS.T1;
}
