import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { createReturn } from "@/lib/engine/returns"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const returns = await db.return.findMany({ where: { orgId: auth.orgId }, include: { items: true }, orderBy: { createdAt: "desc" }, take: 100 })
  return ok(returns)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
  const ret = await createReturn({
    orgId: auth.orgId,
    paymentId: body.paymentId,
    items: body.items,
    type: body.type,
    reason: body.reason,
    reasonText: body.reasonText,
    refundMethod: body.refundMethod,
    processedBy: auth.operatorId,
    processedByName: operator?.name ?? auth.role,
    branchId: body.branchId,
  })
  return ok(ret)
}
