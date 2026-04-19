import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createRecurringSchema } from "@/lib/api/schemas"

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
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(createRecurringSchema, await request.json())
    if (data instanceof Response) return data
    const charge = await db.recurringCharge.create({
      data: { orgId: auth.orgId, ...data, nextDueDate: new Date(data.nextDueDate) },
    })
    return ok(charge)
  } catch {
    return fail("An error occurred", 500)
  }
}
