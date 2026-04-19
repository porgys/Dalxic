import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const { id } = await params
  const cart = await db.cart.findUnique({ where: { id }, include: { items: true } })
  if (!cart || cart.orgId !== auth.orgId) return fail("Not found", 404)
  return ok(cart)
}
