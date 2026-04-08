import { db } from "./db";
import type { ActorType } from "@/types";

export async function logAudit(params: {
  actorType: ActorType;
  actorId: string;
  hospitalId: string;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
}) {
  return db.auditLog.create({
    data: {
      actorType: params.actorType,
      actorId: params.actorId,
      hospitalId: params.hospitalId,
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
