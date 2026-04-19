import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { incrementPhysical } from "@/lib/api/stock"
import { logAudit } from "@/lib/api/audit"
import { validate, receiveStockSchema } from "@/lib/api/schemas"

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(receiveStockSchema, await request.json())
    if (data instanceof Response) return data

    const result = await incrementPhysical({
      orgId: auth.orgId,
      serviceItemId: data.serviceItemId,
      branchId: data.branchId,
      quantity: data.quantity,
      type: "received",
      reference: data.reference,
      batchNo: data.batchNo,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      performedBy: auth.operatorId,
    })

    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "receive_stock", entity: "stock_movement", after: result })
    return ok(result)
  } catch {
    return fail("An error occurred", 500)
  }
}
