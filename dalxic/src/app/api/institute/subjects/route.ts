import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createSubjectSchema } from "@/lib/api/schemas"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const subjects = await db.subject.findMany({ where: { orgId: auth.orgId, isActive: true }, orderBy: { name: "asc" } })
    return ok(subjects)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(createSubjectSchema, await request.json())
    if (data instanceof Response) return data
    const subject = await db.subject.create({ data: { orgId: auth.orgId, name: data.name, department: data.department } })
    return ok(subject)
  } catch {
    return fail("An error occurred", 500)
  }
}
