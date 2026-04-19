import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, transferStockSchema } from "@/lib/api/schemas"

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(transferStockSchema, await request.json())
    if (data instanceof Response) return data
    const transfer = await db.stockTransfer.create({
      data: {
        orgId: auth.orgId, fromBranchId: data.fromBranchId, toBranchId: data.toBranchId,
        serviceItemId: data.serviceItemId, quantity: data.quantity,
        initiatedBy: auth.operatorId,
      },
    })
    return ok(transfer)
  } catch {
    return fail("An error occurred", 500)
  }
}
