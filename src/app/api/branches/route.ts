import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createBranchSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

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
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin"])
  if (denied) return denied
  try {
    const data = validate(createBranchSchema, await request.json())
    if (data instanceof Response) return data
    const branch = await db.branch.create({ data: { orgId: auth.orgId, ...data, isDefault: false } })
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "create_branch", entity: "branch", entityId: branch.id, after: { name: branch.name, address: branch.address } })
    return ok(branch)
  } catch {
    return fail("An error occurred", 500)
  }
}
