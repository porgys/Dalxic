import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { dayClose } from "@/lib/engine/reconcile"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const shifts = await db.shift.findMany({ where: { orgId: auth.orgId }, orderBy: { startedAt: "desc" }, take: 50 })
  return ok(shifts)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
  const shift = await db.shift.create({
    data: { orgId: auth.orgId, branchId: body.branchId, operatorId: auth.operatorId, operatorName: operator?.name ?? "", openingCash: body.openingCash ?? 0 },
  })
  return ok(shift)
}

export async function PATCH(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  if (!body.branchId || body.closingCash === undefined) return fail("branchId and closingCash required")
  const report = await dayClose(auth.orgId, body.branchId, auth.operatorId, body.closingCash)
  return ok(report)
}
