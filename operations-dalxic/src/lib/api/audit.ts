import { db } from "@/lib/db"

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
