import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, generateFeesSchema } from "@/lib/api/schemas"

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(generateFeesSchema, await request.json())
    if (data instanceof Response) return data

    const item = await db.serviceItem.findUniqueOrThrow({ where: { id: data.serviceItemId } })
    if (item.orgId !== auth.orgId) return fail("Not found", 404)
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
    return ok({ generated: charges.length, charges })
  } catch {
    return fail("An error occurred", 500)
  }
}
