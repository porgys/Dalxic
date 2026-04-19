import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const charges = await db.recurringCharge.findMany({ where: { orgId: auth.orgId }, orderBy: { nextDueDate: "asc" } })
  return ok(charges)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const charge = await db.recurringCharge.create({
    data: { orgId: auth.orgId, contactId: body.contactId, admissionId: body.admissionId, serviceItemId: body.serviceItemId, interval: body.interval, amount: body.amount, nextDueDate: new Date(body.nextDueDate), autoCharge: body.autoCharge ?? false },
  })
  return ok(charge)
}
