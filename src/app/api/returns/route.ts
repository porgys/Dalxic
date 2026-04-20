import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { createReturn } from "@/lib/engine/returns"
import { validate, createReturnSchema } from "@/lib/api/schemas"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const returns = await db.return.findMany({ where: { orgId: auth.orgId }, include: { items: true }, orderBy: { createdAt: "desc" }, take: 100 })
    return ok(returns)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin", "manager", "cashier"])
  if (denied) return denied
  try {
    const data = validate(createReturnSchema, await request.json())
    if (data instanceof Response) return data

    const payment = await db.payment.findUnique({ where: { id: data.paymentId } })
    if (!payment || payment.orgId !== auth.orgId) return fail("Payment not found", 404)
    if (payment.status === "refunded") return fail("Payment already fully refunded")
    const returnTotal = data.items.reduce((s: number, i: { unitPrice: number; quantity: number }) => s + i.unitPrice * i.quantity, 0)
    if (returnTotal > payment.amount) return fail("Return amount exceeds original payment")

    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    const ret = await createReturn({
      orgId: auth.orgId,
      paymentId: data.paymentId,
      items: data.items,
      type: data.type,
      reason: data.reason,
      reasonText: data.reasonText,
      refundMethod: data.refundMethod,
      processedBy: auth.operatorId,
      processedByName: operator?.name ?? auth.role,
      branchId: data.branchId,
    })
    return ok(ret)
  } catch {
    return fail("An error occurred", 500)
  }
}
