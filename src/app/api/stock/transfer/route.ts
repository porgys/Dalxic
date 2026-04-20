import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, transferStockSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin", "manager"])
  if (denied) return denied
  try {
    const data = validate(transferStockSchema, await request.json())
    if (data instanceof Response) return data

    const item = await db.serviceItem.findUnique({ where: { id: data.serviceItemId } })
    if (!item || item.orgId !== auth.orgId) return fail("Service item not found", 404)

    const fromBranch = await db.branch.findUnique({ where: { id: data.fromBranchId } })
    if (!fromBranch || fromBranch.orgId !== auth.orgId) return fail("Source branch not found", 404)

    const toBranch = await db.branch.findUnique({ where: { id: data.toBranchId } })
    if (!toBranch || toBranch.orgId !== auth.orgId) return fail("Destination branch not found", 404)

    const transfer = await db.stockTransfer.create({
      data: {
        orgId: auth.orgId, fromBranchId: data.fromBranchId, toBranchId: data.toBranchId,
        serviceItemId: data.serviceItemId, quantity: data.quantity,
        initiatedBy: auth.operatorId,
      },
    })
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "stock_transfer", entity: "stock_transfer", entityId: transfer.id, after: { fromBranchId: data.fromBranchId, toBranchId: data.toBranchId, serviceItemId: data.serviceItemId, quantity: data.quantity } })
    return ok(transfer)
  } catch {
    return fail("An error occurred", 500)
  }
}
