import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { processPayment } from "@/lib/engine/payment-methods"
import { db } from "@/lib/db"
import { validate, paySchema } from "@/lib/api/schemas"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const { id } = await params
    const data = validate(paySchema, await request.json())
    if (data instanceof Response) return data

    const cart = await db.cart.findUnique({ where: { id }, include: { items: true } })
    if (!cart || cart.orgId !== auth.orgId) return fail("Not found", 404)
    if (cart.status !== "tendered") return fail("Cart must be tendered before payment")
    const expectedTotal = cart.items.reduce((s, i) => s + i.total, 0)
    if (Math.abs(data.amount - expectedTotal) > 1) return fail("Payment amount does not match cart total")

    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    const result = await processPayment({
      cartId: id,
      method: data.method,
      amount: data.amount,
      reference: data.reference,
      processedBy: auth.operatorId,
      processedByName: operator?.name ?? auth.role,
    })
    return ok(result)
  } catch {
    return fail("An error occurred", 500)
  }
}
