import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { addItem } from "@/lib/engine/sale"
import { validate, addCartItemSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = rateLimit(request)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const { id } = await params
    const cart = await db.cart.findUnique({ where: { id } })
    if (!cart || cart.orgId !== auth.orgId) return fail("Not found", 404)
    const data = validate(addCartItemSchema, await request.json())
    if (data instanceof Response) return data
    const item = await addItem(id, data.serviceItemId, data.quantity, data.discount)
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "add_cart_item", entity: "cart_item", entityId: item.id, after: { cartId: id, serviceItemId: data.serviceItemId, quantity: data.quantity, discount: data.discount ?? 0 } })
    return ok(item)
  } catch {
    return fail("An error occurred", 500)
  }
}
