export const SAFE_OPERATOR_SELECT = {
  id: true, name: true, phone: true, role: true,
  permissions: true, isActive: true, lastLoginAt: true, createdAt: true,
} as const

export const SAFE_ORG_SELECT = {
  id: true, code: true, name: true, type: true, tier: true,
  logoUrl: true, tagline: true, paymentGate: true,
  activeBehaviours: true, activeModules: true,
  labelConfig: true, taxConfig: true,
  currency: true, timezone: true,
  maxOperators: true, maxBranches: true,
  whatsappBundle: true, active: true, createdAt: true,
} as const
