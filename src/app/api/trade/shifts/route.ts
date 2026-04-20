import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { dayClose } from "@/lib/engine/reconcile"
import { validate, createShiftSchema, closeShiftSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const shifts = await db.shift.findMany({ where: { orgId: auth.orgId }, orderBy: { startedAt: "desc" }, take: 50 })
    return ok(shifts)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const blocked = rateLimit(request)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(createShiftSchema, await request.json())
    if (data instanceof Response) return data
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    const shift = await db.shift.create({
      data: { orgId: auth.orgId, branchId: data.branchId, operatorId: auth.operatorId, operatorName: operator?.name ?? "", openingCash: data.openingCash ?? 0 },
    })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "open_shift", entity: "shift", entityId: shift.id, after: { branchId: data.branchId, openingCash: data.openingCash ?? 0 } })
    return ok(shift)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function PATCH(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(closeShiftSchema, await request.json())
    if (data instanceof Response) return data
    const report = await dayClose(auth.orgId, data.branchId, auth.operatorId, data.closingCash)
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "day_close", entity: "shift", entityId: data.branchId, after: { branchId: data.branchId, closingCash: data.closingCash, cashExpected: report.cashExpected, variance: data.closingCash - report.cashExpected, salesTotal: report.salesTotal, netSales: report.netSales } })
    return ok(report)
  } catch {
    return fail("An error occurred", 500)
  }
}
