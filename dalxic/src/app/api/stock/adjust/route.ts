import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"
import { validate, adjustStockSchema } from "@/lib/api/schemas"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin", "manager"])
  if (denied) return denied
  try {
    const data = validate(adjustStockSchema, await request.json())
    if (data instanceof Response) return data

    const item = await db.serviceItem.findUniqueOrThrow({ where: { id: data.serviceItemId } })
    if (item.orgId !== auth.orgId) return fail("Not found", 404)
    const balanceBefore = item.stock
    const balanceAfter = data.newBalance

    await db.$transaction([
      db.serviceItem.update({ where: { id: data.serviceItemId }, data: { stock: balanceAfter } }),
      db.stockMovement.create({
        data: {
          orgId: auth.orgId, serviceItemId: data.serviceItemId, branchId: data.branchId,
          type: "adjusted", quantity: balanceAfter - balanceBefore,
          balanceBefore, balanceAfter,
          performedBy: auth.operatorId, notes: data.notes,
        },
      }),
    ])

    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "adjust_stock", entity: "service_item", entityId: data.serviceItemId, before: { stock: balanceBefore }, after: { stock: balanceAfter } })
    return ok({ balanceBefore, balanceAfter })
  } catch {
    return fail("An error occurred", 500)
  }
}
