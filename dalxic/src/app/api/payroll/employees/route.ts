import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createEmployeeSchema } from "@/lib/api/schemas"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const employees = await db.employee.findMany({ where: { orgId: auth.orgId, status: "active" }, orderBy: { employeeCode: "asc" } })
    return ok(employees)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin", "accountant"])
  if (denied) return denied
  try {
    const data = validate(createEmployeeSchema, await request.json())
    if (data instanceof Response) return data
    const emp = await db.employee.create({ data: { orgId: auth.orgId, ...data, startDate: new Date(data.startDate) } })
    return ok(emp)
  } catch {
    return fail("An error occurred", 500)
  }
}
