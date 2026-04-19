import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createGroupSchema } from "@/lib/api/schemas"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const groups = await db.group.findMany({ where: { orgId: auth.orgId, isActive: true }, orderBy: { name: "asc" } })
    return ok(groups)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(createGroupSchema, await request.json())
    if (data instanceof Response) return data
    const group = await db.group.create({ data: { orgId: auth.orgId, name: data.name, type: data.type ?? "class", academicYear: data.academicYear, term: data.term, capacity: data.capacity, teacherId: data.teacherId } })
    return ok(group)
  } catch {
    return fail("An error occurred", 500)
  }
}
