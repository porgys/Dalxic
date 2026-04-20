import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"
import { SAFE_OPERATOR_SELECT } from "@/lib/api/sanitize"
import { validate, updateRoleSchema } from "@/lib/api/schemas"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const operators = await db.operator.findMany({
      where: { orgId: auth.orgId, isActive: true },
      select: SAFE_OPERATOR_SELECT,
      orderBy: { role: "asc" },
    })

    const roleMap = new Map<string, { role: string; count: number; permissions: string[]; operators: typeof operators }>()
    for (const op of operators) {
      const existing = roleMap.get(op.role)
      if (existing) {
        existing.count++
        existing.operators.push(op)
        for (const p of op.permissions) {
          if (!existing.permissions.includes(p)) existing.permissions.push(p)
        }
      } else {
        roleMap.set(op.role, { role: op.role, count: 1, permissions: [...op.permissions], operators: [op] })
      }
    }

    return ok({ roles: Array.from(roleMap.values()) })
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function PATCH(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin"])
  if (denied) return denied
  try {
    const data = validate(updateRoleSchema, await request.json())
    if (data instanceof Response) return data

    const operator = await db.operator.findUnique({ where: { id: data.operatorId } })
    if (!operator || operator.orgId !== auth.orgId) return fail("Operator not found", 404)

    const updates: Record<string, unknown> = {}
    if (data.role) updates.role = data.role
    if (data.permissions) updates.permissions = data.permissions
    if (data.isActive != null) updates.isActive = data.isActive

    const updated = await db.operator.update({ where: { id: data.operatorId }, data: updates, select: SAFE_OPERATOR_SELECT })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "update_role", entity: "operator", entityId: data.operatorId, before: { role: operator.role, permissions: operator.permissions, isActive: operator.isActive }, after: { role: updated.role, permissions: updated.permissions, isActive: updated.isActive } })
    return ok(updated)
  } catch {
    return fail("An error occurred", 500)
  }
}
