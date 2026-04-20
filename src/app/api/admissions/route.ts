import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"
import { validate, createAdmissionSchema, updateAdmissionSchema } from "@/lib/api/schemas"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get("status") ?? "active"
    const admissions = await db.admission.findMany({ where: { orgId: auth.orgId, status }, orderBy: { admittedAt: "desc" } })
    return ok(admissions)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin", "doctor", "nurse"])
  if (denied) return denied
  try {
    const data = validate(createAdmissionSchema, await request.json())
    if (data instanceof Response) return data
    const admission = await db.admission.create({ data: { orgId: auth.orgId, ...data } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "create_admission", entity: "admission", entityId: admission.id })
    return ok(admission)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function PATCH(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin", "doctor", "nurse"])
  if (denied) return denied
  try {
    const body = await request.json()
    if (typeof body?.id !== "string" || !body.id) return fail("id required")
    const { id, ...rest } = body
    const data = validate(updateAdmissionSchema, rest)
    if (data instanceof Response) return data
    const before = await db.admission.findUnique({ where: { id } })
    if (!before || before.orgId !== auth.orgId) return fail("Not found", 404)
    const admission = await db.admission.update({ where: { id }, data })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: "update_admission", entity: "admission", entityId: id, before, after: admission })
    return ok(admission)
  } catch {
    return fail("An error occurred", 500)
  }
}
