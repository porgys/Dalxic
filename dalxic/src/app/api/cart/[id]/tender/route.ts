import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { tenderCart } from "@/lib/engine/sale"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const { id } = await params
    const cart = await db.cart.findUnique({ where: { id } })
    if (!cart || cart.orgId !== auth.orgId) return fail("Not found", 404)
    const result = await tenderCart(id)
    return ok(result)
  } catch {
    return fail("An error occurred", 500)
  }
}
