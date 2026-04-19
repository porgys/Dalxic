import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  if (!body.serviceItemId || !body.groupId) return fail("serviceItemId and groupId required")

  const item = await db.serviceItem.findUniqueOrThrow({ where: { id: body.serviceItemId } })
  const students = await db.contact.findMany({ where: { orgId: auth.orgId, type: "student", groupId: body.groupId, status: "active" } })

  const charges = []
  for (const student of students) {
    const charge = await db.recurringCharge.create({
      data: {
        orgId: auth.orgId, contactId: student.id, serviceItemId: body.serviceItemId,
        interval: item.recurringInterval ?? "termly", amount: item.sellingPrice,
        nextDueDate: body.dueDate ? new Date(body.dueDate) : new Date(),
      },
    })
    charges.push(charge)
  }
  return ok({ generated: charges.length, charges })
}
