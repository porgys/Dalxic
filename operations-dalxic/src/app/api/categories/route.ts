import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const cats = await db.serviceCategory.findMany({ where: { orgId: auth.orgId, isActive: true }, orderBy: { sortOrder: "asc" }, include: { children: true } })
  return ok(cats)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const cat = await db.serviceCategory.create({ data: { orgId: auth.orgId, name: body.name, sortOrder: body.sortOrder ?? 0, parentId: body.parentId } })
  return ok(cat)
}
