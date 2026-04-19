import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin", "manager"])
  if (denied) return denied
  const body = await request.json()

  const item = await db.serviceItem.findUniqueOrThrow({ where: { id: body.serviceItemId } })
  const balanceBefore = item.stock
  const balanceAfter = body.newBalance

  await db.$transaction([
    db.serviceItem.update({ where: { id: body.serviceItemId }, data: { stock: balanceAfter } }),
    db.stockMovement.create({
      data: {
        orgId: auth.orgId, serviceItemId: body.serviceItemId, branchId: body.branchId,
        type: "adjusted", quantity: balanceAfter - balanceBefore,
        balanceBefore, balanceAfter,
        performedBy: auth.operatorId, notes: body.notes,
      },
    }),
  ])

  await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "adjust_stock", entity: "service_item", entityId: body.serviceItemId, before: { stock: balanceBefore }, after: { stock: balanceAfter } })
  return ok({ balanceBefore, balanceAfter })
}
