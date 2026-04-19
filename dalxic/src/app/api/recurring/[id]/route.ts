import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"

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
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const { id } = await params
    const charge = await db.recurringCharge.findUnique({ where: { id } })
    if (!charge || charge.orgId !== auth.orgId) return fail("Not found", 404)

    const body = await request.json()
    const action = body.action as string

    const updates: Record<string, unknown> = {}

    if (action === "freeze") {
      if (charge.status !== "active") return fail("Only active charges can be frozen")
      updates.status = "frozen"
    } else if (action === "cancel") {
      if (charge.status === "cancelled") return fail("Already cancelled")
      updates.status = "cancelled"
    } else if (action === "reactivate") {
      if (charge.status !== "frozen") return fail("Only frozen charges can be reactivated")
      updates.status = "active"
      if (body.nextDueDate) updates.nextDueDate = new Date(body.nextDueDate)
    } else if (action === "update") {
      if (body.amount != null) updates.amount = body.amount
      if (body.interval) updates.interval = body.interval
      if (body.nextDueDate) updates.nextDueDate = new Date(body.nextDueDate)
      if (body.autoCharge != null) updates.autoCharge = body.autoCharge
    } else {
      return fail("Invalid action. Use: freeze, cancel, reactivate, update")
    }

    const updated = await db.recurringCharge.update({ where: { id }, data: updates })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: auth.role, action: `recurring_${action}`, entity: "recurring_charge", entityId: id, before: { status: charge.status }, after: { status: updated.status } })
    return ok(updated)
  } catch {
    return fail("An error occurred", 500)
  }
}
