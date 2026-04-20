import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { removeItem, updateItemQuantity } from "@/lib/engine/sale"
import { validate, updateCartItemSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit } from "@/lib/rate-limit"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const blocked = rateLimit(request)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const { id, itemId } = await params
    const cart = await db.cart.findUnique({ where: { id } })
    if (!cart || cart.orgId !== auth.orgId) return fail("Not found", 404)
    const existing = await db.cartItem.findUnique({ where: { id: itemId } })
    if (!existing || existing.cartId !== id) return fail("Not found", 404)
    const data = validate(updateCartItemSchema, await request.json())
    if (data instanceof Response) return data
    const item = await updateItemQuantity(itemId, data.quantity)
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "update_cart_item", entity: "cart_item", entityId: itemId, before: { quantity: existing.quantity }, after: { quantity: data.quantity } })
    return ok(item)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const blocked = rateLimit(request)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const { id, itemId } = await params
    const cart = await db.cart.findUnique({ where: { id } })
    if (!cart || cart.orgId !== auth.orgId) return fail("Not found", 404)
    const existing = await db.cartItem.findUnique({ where: { id: itemId } })
    if (!existing || existing.cartId !== id) return fail("Not found", 404)
    await removeItem(itemId)
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "remove_cart_item", entity: "cart_item", entityId: itemId, before: { serviceItemId: existing.serviceItemId, quantity: existing.quantity } })
    return ok({ deleted: true })
  } catch {
    return fail("An error occurred", 500)
  }
}
