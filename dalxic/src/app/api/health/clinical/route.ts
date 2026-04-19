import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createClinicalSchema } from "@/lib/api/schemas"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const contactId = url.searchParams.get("contactId")
    const type = url.searchParams.get("type")
    const where: Record<string, unknown> = { orgId: auth.orgId }
    if (contactId) where.contactId = contactId
    if (type) where.type = type
    const records = await db.clinicalRecord.findMany({ where: where as any, orderBy: { performedAt: "desc" }, take: 100 })
    return ok(records)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["doctor", "nurse"])
  if (denied) return denied
  try {
    const data = validate(createClinicalSchema, await request.json())
    if (data instanceof Response) return data
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    const record = await db.clinicalRecord.create({
      data: {
        orgId: auth.orgId, contactId: data.contactId, cartId: data.cartId,
        type: data.type, data: data.data, status: data.status,
        performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
      },
    })
    return ok(record)
  } catch {
    return fail("An error occurred", 500)
  }
}
