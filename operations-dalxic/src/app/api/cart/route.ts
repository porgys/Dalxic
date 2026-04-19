import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { createCart } from "@/lib/engine/sale"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
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
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  if (!body.branchId) return fail("branchId required")
  const cart = await createCart(auth.orgId, body.branchId, auth.operatorId, body.contactId, body.paymentGate)
  return ok(cart)
}
