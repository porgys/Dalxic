import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, generateFeesSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin", "accountant"])
  if (denied) return denied
  try {
    const data = validate(generateFeesSchema, await request.json())
    if (data instanceof Response) return data

    const item = await db.serviceItem.findUnique({ where: { id: data.serviceItemId } })
    if (!item || item.orgId !== auth.orgId) return fail("Service item not found", 404)

    const group = await db.group.findUnique({ where: { id: data.groupId } })
    if (!group || group.orgId !== auth.orgId) return fail("Group not found", 404)

    const students = await db.contact.findMany({ where: { orgId: auth.orgId, type: "student", groupId: data.groupId, status: "active" } })

    const charges = []
    for (const student of students) {
      const charge = await db.recurringCharge.create({
        data: {
          orgId: auth.orgId, contactId: student.id, serviceItemId: data.serviceItemId,
          interval: item.recurringInterval ?? "termly", amount: item.sellingPrice,
          nextDueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
        },
      })
      charges.push(charge)
    }
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "generate_fees", entity: "recurring_charge", entityId: data.groupId, after: { groupId: data.groupId, serviceItemId: data.serviceItemId, generated: charges.length, amount: item.sellingPrice } })
    return ok({ generated: charges.length, charges })
  } catch {
    return fail("An error occurred", 500)
  }
}
