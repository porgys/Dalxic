import { db } from "./db";

export type ActorType = "operator" | "system" | "api";

export async function logAudit(params: {
  actorType: ActorType;
  actorId: string;
  orgId: string;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
}) {
  return db.auditLog.create({
    data: {
      actorType: params.actorType,
      actorId: params.actorId,
      orgId: params.orgId,
      action: params.action,
      metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : {},
      ipAddress: params.ipAddress,
    },
  });
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
