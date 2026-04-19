import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"
import { validate, createServiceItemSchema, updateServiceItemSchema } from "@/lib/api/schemas"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
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
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin", "manager"])
  if (denied) return denied
  try {
    const data = validate(createServiceItemSchema, await request.json())
    if (data instanceof Response) return data
    const item = await db.serviceItem.create({ data: { orgId: auth.orgId, ...data } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "create_service_item", entity: "service_item", entityId: item.id, after: item })
    return ok(item)
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
    const data = validate(updateServiceItemSchema, rest)
    if (data instanceof Response) return data
    const before = await db.serviceItem.findUnique({ where: { id } })
    if (!before || before.orgId !== auth.orgId) return fail("Not found", 404)
    const item = await db.serviceItem.update({ where: { id }, data })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "update_service_item", entity: "service_item", entityId: id, before, after: item })
    return ok(item)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function DELETE(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin", "manager"])
  if (denied) return denied
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) return fail("id required")
    const item = await db.serviceItem.findUnique({ where: { id } })
    if (!item || item.orgId !== auth.orgId) return fail("Not found", 404)
    await db.serviceItem.update({ where: { id }, data: { isActive: false } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "deactivate_service_item", entity: "service_item", entityId: id, before: { isActive: true }, after: { isActive: false } })
    return ok({ deactivated: true })
  } catch {
    return fail("An error occurred", 500)
  }
}
