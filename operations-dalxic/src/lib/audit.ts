import { db } from "./db"

export async function logAudit(params: {
  orgId: string
  actorId: string
  actorName: string
  action: string
  entity: string
  entityId?: string
  before?: unknown
  after?: unknown
  ipAddress?: string
}) {
  return db.auditLog.create({
    data: {
      orgId: params.orgId,
      actorId: params.actorId,
      actorName: params.actorName,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      before: params.before as any,
      after: params.after as any,
      ipAddress: params.ipAddress ?? "unknown",
    },
  })
}

export function getClientIP(request: Request): string {
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const parts = forwarded.split(",").map(s => s.trim())
    return parts[parts.length - 1] || "unknown"
  }
  return "unknown"
}
