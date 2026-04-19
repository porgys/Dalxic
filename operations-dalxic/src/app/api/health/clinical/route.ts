import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const url = new URL(request.url)
  const contactId = url.searchParams.get("contactId")
  const type = url.searchParams.get("type")
  const where: Record<string, unknown> = { orgId: auth.orgId }
  if (contactId) where.contactId = contactId
  if (type) where.type = type
  const records = await db.clinicalRecord.findMany({ where: where as any, orderBy: { performedAt: "desc" }, take: 100 })
  return ok(records)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
  const record = await db.clinicalRecord.create({
    data: {
      orgId: auth.orgId, contactId: body.contactId, cartId: body.cartId,
      type: body.type, data: body.data, status: body.status ?? "active",
      performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
    },
  })
  return ok(record)
}
