import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const employees = await db.employee.findMany({ where: { orgId: auth.orgId, status: "active" }, orderBy: { employeeCode: "asc" } })
  return ok(employees)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const emp = await db.employee.create({ data: { orgId: auth.orgId, ...body, startDate: new Date(body.startDate) } })
  return ok(emp)
}
