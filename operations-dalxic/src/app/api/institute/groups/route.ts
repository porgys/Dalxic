import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const groups = await db.group.findMany({ where: { orgId: auth.orgId, isActive: true }, orderBy: { name: "asc" } })
  return ok(groups)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const group = await db.group.create({ data: { orgId: auth.orgId, name: body.name, type: body.type ?? "class", academicYear: body.academicYear, term: body.term, capacity: body.capacity, teacherId: body.teacherId } })
  return ok(group)
}
