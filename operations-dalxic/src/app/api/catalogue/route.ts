import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const url = new URL(request.url)
  const behaviour = url.searchParams.get("behaviour")
  const categoryId = url.searchParams.get("category")
  const search = url.searchParams.get("search")

  const where: Record<string, unknown> = { orgId: auth.orgId, isActive: true }
  if (behaviour) where.behaviour = behaviour
  if (categoryId) where.categoryId = categoryId
  if (search) where.name = { contains: search, mode: "insensitive" }

  const items = await db.serviceItem.findMany({ where: where as any, include: { category: true }, orderBy: { name: "asc" } })
  return ok(items)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin", "manager"])
  if (denied) return denied
  const body = await request.json()
  const item = await db.serviceItem.create({ data: { orgId: auth.orgId, ...body } })
  await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "create_service_item", entity: "service_item", entityId: item.id, after: item })
  return ok(item)
}

export async function PATCH(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  if (!body.id) return fail("id required")
  const { id, ...data } = body
  const before = await db.serviceItem.findUnique({ where: { id } })
  if (!before || before.orgId !== auth.orgId) return fail("Not found", 404)
  const item = await db.serviceItem.update({ where: { id }, data })
  await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "update_service_item", entity: "service_item", entityId: id, before, after: item })
  return ok(item)
}
