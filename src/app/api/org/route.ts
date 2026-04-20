import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"
import { validate, updateOrgSchema } from "@/lib/api/schemas"
import { SAFE_ORG_SELECT } from "@/lib/api/sanitize"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const org = await db.organization.findUnique({ where: { id: auth.orgId }, select: SAFE_ORG_SELECT })
    if (!org) return fail("Not found", 404)
    return ok(org)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function PATCH(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin"])
  if (denied) return denied
  try {
    const data = validate(updateOrgSchema, await request.json())
    if (data instanceof Response) return data
    const before = await db.organization.findUnique({ where: { id: auth.orgId } })
    const org = await db.organization.update({ where: { id: auth.orgId }, data })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "update_org", entity: "organization", entityId: auth.orgId, before, after: org })
    return ok(org)
  } catch {
    return fail("An error occurred", 500)
  }
}
