import type { OrgType, Behaviour } from "@/lib/ops/mock"

export interface RoleAccess {
  modules: string[]
  label: string
}

export interface VerticalConfig {
  type: OrgType
  label: string
  brand: string
  accent: "amber" | "copper" | "sky" | "emerald"
  paymentGate: "pay_before" | "pay_after"
  defaultBehaviours: Behaviour[]
  roles: Record<string, RoleAccess>
  labelConfig: Record<string, string>
}

export interface HealthConfig extends VerticalConfig {
  specialties: string[]
  rateDefaults: { registration: number; consultation: number; followUp: number; emergency: number }
  serviceTypes: string[]
}
