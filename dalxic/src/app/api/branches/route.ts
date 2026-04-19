import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createBranchSchema } from "@/lib/api/schemas"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const branches = await db.branch.findMany({ where: { orgId: auth.orgId }, orderBy: { createdAt: "desc" } })
    return ok(branches)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin"])
  if (denied) return denied
  try {
    const data = validate(createBranchSchema, await request.json())
    if (data instanceof Response) return data
    const branch = await db.branch.create({ data: { orgId: auth.orgId, ...data, isDefault: false } })
    return ok(branch)
  } catch {
    return fail("An error occurred", 500)
  }
}
