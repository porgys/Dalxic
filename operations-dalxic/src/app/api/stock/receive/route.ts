import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { incrementPhysical } from "@/lib/api/stock"
import { logAudit } from "@/lib/api/audit"

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  if (!body.serviceItemId || !body.branchId || !body.quantity) return fail("serviceItemId, branchId, quantity required")

  const result = await incrementPhysical({
    orgId: auth.orgId,
    serviceItemId: body.serviceItemId,
    branchId: body.branchId,
    quantity: body.quantity,
    type: "received",
    reference: body.reference,
    batchNo: body.batchNo,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    performedBy: auth.operatorId,
  })

  await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "receive_stock", entity: "stock_movement", after: result })
  return ok(result)
}
