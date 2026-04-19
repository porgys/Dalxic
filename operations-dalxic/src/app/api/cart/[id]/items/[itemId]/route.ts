import { authenticateRequest } from "@/lib/auth"
import { ok } from "@/lib/api/response"
import { removeItem, updateItemQuantity } from "@/lib/engine/sale"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const { itemId } = await params
  const body = await request.json()
  const item = await updateItemQuantity(itemId, body.quantity)
  return ok(item)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const { itemId } = await params
  await removeItem(itemId)
  return ok({ deleted: true })
}
