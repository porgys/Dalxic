import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { removeItem, updateItemQuantity } from "@/lib/engine/sale"
import { validate, updateCartItemSchema } from "@/lib/api/schemas"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const { id, itemId } = await params
    const cart = await db.cart.findUnique({ where: { id } })
    if (!cart || cart.orgId !== auth.orgId) return fail("Not found", 404)
    const data = validate(updateCartItemSchema, await request.json())
    if (data instanceof Response) return data
    const item = await updateItemQuantity(itemId, data.quantity)
    return ok(item)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const { id, itemId } = await params
    const cart = await db.cart.findUnique({ where: { id } })
    if (!cart || cart.orgId !== auth.orgId) return fail("Not found", 404)
    await removeItem(itemId)
    return ok({ deleted: true })
  } catch {
    return fail("An error occurred", 500)
  }
}
