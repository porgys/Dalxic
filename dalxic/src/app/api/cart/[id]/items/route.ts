import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { addItem } from "@/lib/engine/sale"
import { validate, addCartItemSchema } from "@/lib/api/schemas"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const { id } = await params
    const cart = await db.cart.findUnique({ where: { id } })
    if (!cart || cart.orgId !== auth.orgId) return fail("Not found", 404)
    const data = validate(addCartItemSchema, await request.json())
    if (data instanceof Response) return data
    const item = await addItem(id, data.serviceItemId, data.quantity, data.discount)
    return ok(item)
  } catch {
    return fail("An error occurred", 500)
  }
}
