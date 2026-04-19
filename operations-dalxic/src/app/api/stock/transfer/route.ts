import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const transfer = await db.stockTransfer.create({
    data: {
      orgId: auth.orgId, fromBranchId: body.fromBranchId, toBranchId: body.toBranchId,
      serviceItemId: body.serviceItemId, quantity: body.quantity,
      initiatedBy: auth.operatorId,
    },
  })
  return ok(transfer)
}
