import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"
import { validate, createContactSchema, updateContactSchema } from "@/lib/api/schemas"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get("type")
    const search = url.searchParams.get("search")
    const status = url.searchParams.get("status")

    const where: Record<string, unknown> = { orgId: auth.orgId }
    if (type) where.type = type
    if (status) where.status = status
    if (search) where.name = { contains: search, mode: "insensitive" }

    const contacts = await db.contact.findMany({ where: where as any, orderBy: { createdAt: "desc" }, take: 200 })
    return ok(contacts)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(createContactSchema, await request.json())
    if (data instanceof Response) return data
    const contact = await db.contact.create({ data: { orgId: auth.orgId, ...data } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "create_contact", entity: "contact", entityId: contact.id })
    return ok(contact)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function PATCH(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const body = await request.json()
    if (typeof body?.id !== "string" || !body.id) return fail("id required")
    const { id, ...rest } = body
    const data = validate(updateContactSchema, rest)
    if (data instanceof Response) return data
    const before = await db.contact.findUnique({ where: { id } })
    if (!before || before.orgId !== auth.orgId) return fail("Not found", 404)
    const contact = await db.contact.update({ where: { id }, data })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "update_contact", entity: "contact", entityId: id, before, after: contact })
    return ok(contact)
  } catch {
    return fail("An error occurred", 500)
  }
}
