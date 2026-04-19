import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createCategorySchema } from "@/lib/api/schemas"

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
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(createCategorySchema, await request.json())
    if (data instanceof Response) return data
    const cat = await db.serviceCategory.create({ data: { orgId: auth.orgId, ...data } })
    return ok(cat)
  } catch {
    return fail("An error occurred", 500)
  }
}
