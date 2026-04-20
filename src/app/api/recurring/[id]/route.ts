import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"
import { validate, updateRecurringSchema } from "@/lib/api/schemas"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const { id } = await params
    const charge = await db.recurringCharge.findUnique({ where: { id } })
    if (!charge || charge.orgId !== auth.orgId) return fail("Not found", 404)
    return ok(charge)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const { id } = await params
    const charge = await db.recurringCharge.findUnique({ where: { id } })
    if (!charge || charge.orgId !== auth.orgId) return fail("Not found", 404)

    const data = validate(updateRecurringSchema, await request.json())
    if (data instanceof Response) return data

    const updates: Record<string, unknown> = {}

    if (data.action === "freeze") {
      if (charge.status !== "active") return fail("Only active charges can be frozen")
      updates.status = "frozen"
    } else if (data.action === "cancel") {
      if (charge.status === "cancelled") return fail("Already cancelled")
      updates.status = "cancelled"
    } else if (data.action === "reactivate") {
      if (charge.status !== "frozen") return fail("Only frozen charges can be reactivated")
      updates.status = "active"
      if (data.nextDueDate) updates.nextDueDate = new Date(data.nextDueDate)
    } else if (data.action === "update") {
      if (data.amount != null) updates.amount = data.amount
      if (data.interval) updates.interval = data.interval
      if (data.nextDueDate) updates.nextDueDate = new Date(data.nextDueDate)
      if (data.autoCharge != null) updates.autoCharge = data.autoCharge
    }

    const updated = await db.recurringCharge.update({ where: { id }, data: updates })
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: `recurring_${data.action}`, entity: "recurring_charge", entityId: id, before: { status: charge.status }, after: { status: updated.status } })
    return ok(updated)
  } catch {
    return fail("An error occurred", 500)
  }
}
