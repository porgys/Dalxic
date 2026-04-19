import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const org = await db.organization.findUnique({ where: { id: auth.orgId } })
  if (!org) return fail("Not found", 404)
  return ok(org)
}

export async function PATCH(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin"])
  if (denied) return denied
  const body = await request.json()
  const before = await db.organization.findUnique({ where: { id: auth.orgId } })
  const org = await db.organization.update({ where: { id: auth.orgId }, data: body })
  await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "update_org", entity: "organization", entityId: auth.orgId, before, after: org })
  return ok(org)
}
