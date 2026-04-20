import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { createCart } from "@/lib/engine/sale"
import { validate, createCartSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const contactId = url.searchParams.get("contactId")

    const where: Record<string, unknown> = { orgId: auth.orgId }
    if (status) where.status = status
    if (contactId) where.contactId = contactId

    const carts = await db.cart.findMany({
      where: where as any,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    })
    return ok(carts)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const blocked = rateLimit(request)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(createCartSchema, await request.json())
    if (data instanceof Response) return data
    const cart = await createCart(auth.orgId, data.branchId, auth.operatorId, data.contactId, data.paymentGate)
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "create_cart", entity: "cart", entityId: cart.id, after: { branchId: data.branchId, contactId: data.contactId, paymentGate: data.paymentGate } })
    return ok(cart)
  } catch {
    return fail("An error occurred", 500)
  }
}
