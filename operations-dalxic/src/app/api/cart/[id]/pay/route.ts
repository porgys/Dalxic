import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { processPayment } from "@/lib/engine/payment-methods"
import { db } from "@/lib/db"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const { id } = await params
  const body = await request.json()
  if (!body.method) return fail("method required")

  const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
  const result = await processPayment({
    cartId: id,
    method: body.method,
    amount: body.amount,
    reference: body.reference,
    processedBy: auth.operatorId,
    processedByName: operator?.name ?? auth.role,
  })
  return ok(result)
}
