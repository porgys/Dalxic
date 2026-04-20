import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createRecurringSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const charges = await db.recurringCharge.findMany({ where: { orgId: auth.orgId }, orderBy: { nextDueDate: "asc" } })
    return ok(charges)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin", "accountant"])
  if (denied) return denied
  try {
    const data = validate(createRecurringSchema, await request.json())
    if (data instanceof Response) return data

    const contact = await db.contact.findUnique({ where: { id: data.contactId } })
    if (!contact || contact.orgId !== auth.orgId) return fail("Contact not found", 404)

    const charge = await db.recurringCharge.create({
      data: { orgId: auth.orgId, ...data, nextDueDate: new Date(data.nextDueDate) },
    })
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "create_recurring_charge", entity: "recurring_charge", entityId: charge.id, after: { contactId: data.contactId, serviceItemId: data.serviceItemId, interval: data.interval, amount: data.amount } })
    return ok(charge)
  } catch {
    return fail("An error occurred", 500)
  }
}
