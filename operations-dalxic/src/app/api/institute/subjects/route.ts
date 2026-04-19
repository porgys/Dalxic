import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const subjects = await db.subject.findMany({ where: { orgId: auth.orgId, isActive: true }, orderBy: { name: "asc" } })
  return ok(subjects)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const subject = await db.subject.create({ data: { orgId: auth.orgId, name: body.name, department: body.department } })
  return ok(subject)
}
