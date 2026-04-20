import type { OrgType } from "@/lib/ops/mock"
import type { VerticalConfig } from "./types"
import { HEALTH } from "./health"
import { TRADE } from "./trade"
import { INSTITUTE } from "./institute"
import { RESTAURANT } from "./restaurant"

const REGISTRY: Partial<Record<OrgType, VerticalConfig>> = {
  health: HEALTH,
  trade: TRADE,
  institute: INSTITUTE,
  restaurant: RESTAURANT,
}

export function getVerticalConfig(type: OrgType): VerticalConfig | undefined {
  return REGISTRY[type]
}

export function canAccessModule(role: string, moduleId: string, orgType: OrgType): boolean {
  const config = REGISTRY[orgType]
  if (!config) return true
  const roleAccess = config.roles[role]
  if (!roleAccess) return false
  return roleAccess.modules.includes(moduleId)
}

export function getRoleLabel(role: string, orgType: OrgType): string {
  const config = REGISTRY[orgType]
  if (!config) return role
  return config.roles[role]?.label ?? role
}

export function getModulesForRole(role: string, orgType: OrgType): string[] {
  const config = REGISTRY[orgType]
  if (!config) return []
  return config.roles[role]?.modules ?? []
}
