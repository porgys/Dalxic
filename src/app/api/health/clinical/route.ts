import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createClinicalSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit } from "@/lib/rate-limit"

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
  const blocked = rateLimit(request)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["doctor", "nurse"])
  if (denied) return denied
  try {
    const data = validate(createClinicalSchema, await request.json())
    if (data instanceof Response) return data

    const contact = await db.contact.findUnique({ where: { id: data.contactId } })
    if (!contact || contact.orgId !== auth.orgId) return fail("Contact not found", 404)

    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    const record = await db.clinicalRecord.create({
      data: {
        orgId: auth.orgId, contactId: data.contactId, cartId: data.cartId,
        type: data.type, data: data.data, status: data.status,
        performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
      },
    })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "create_clinical_record", entity: "clinical_record", entityId: record.id, after: { contactId: data.contactId, type: data.type, status: data.status } })
    return ok(record)
  } catch {
    return fail("An error occurred", 500)
  }
}
