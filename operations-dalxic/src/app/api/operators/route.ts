import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const operators = await db.operator.findMany({
    where: { orgId: auth.orgId },
    select: { id: true, name: true, phone: true, role: true, permissions: true, isActive: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })
  return ok(operators)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin"])
  if (denied) return denied
  const body = await request.json()
  const op = await db.operator.create({
    data: { orgId: auth.orgId, name: body.name, phone: body.phone, pin: body.pin, role: body.role, permissions: body.permissions ?? [] },
  })
  await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "create_operator", entity: "operator", entityId: op.id, after: op })
  return ok(op)
}
