import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
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
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const contact = await db.contact.create({ data: { orgId: auth.orgId, ...body } })
  await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "create_contact", entity: "contact", entityId: contact.id })
  return ok(contact)
}
