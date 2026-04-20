import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createCategorySchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const cats = await db.serviceCategory.findMany({ where: { orgId: auth.orgId, isActive: true }, orderBy: { sortOrder: "asc" }, include: { children: true } })
    return ok(cats)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin"])
  if (denied) return denied
  try {
    const data = validate(createCategorySchema, await request.json())
    if (data instanceof Response) return data
    const cat = await db.serviceCategory.create({ data: { orgId: auth.orgId, ...data } })
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "create_category", entity: "service_category", entityId: cat.id, after: { name: cat.name, parentId: cat.parentId } })
    return ok(cat)
  } catch {
    return fail("An error occurred", 500)
  }
}
