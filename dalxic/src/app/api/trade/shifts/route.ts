import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { dayClose } from "@/lib/engine/reconcile"
import { validate, createShiftSchema, closeShiftSchema } from "@/lib/api/schemas"

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
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(createShiftSchema, await request.json())
    if (data instanceof Response) return data
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    const shift = await db.shift.create({
      data: { orgId: auth.orgId, branchId: data.branchId, operatorId: auth.operatorId, operatorName: operator?.name ?? "", openingCash: data.openingCash ?? 0 },
    })
    return ok(shift)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function PATCH(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(closeShiftSchema, await request.json())
    if (data instanceof Response) return data
    const report = await dayClose(auth.orgId, data.branchId, auth.operatorId, data.closingCash)
    return ok(report)
  } catch {
    return fail("An error occurred", 500)
  }
}
