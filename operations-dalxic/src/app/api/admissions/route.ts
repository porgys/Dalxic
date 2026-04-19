import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const url = new URL(request.url)
  const status = url.searchParams.get("status") ?? "active"
  const admissions = await db.admission.findMany({ where: { orgId: auth.orgId, status }, orderBy: { admittedAt: "desc" } })
  return ok(admissions)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const admission = await db.admission.create({ data: { orgId: auth.orgId, contactId: body.contactId, serviceItemId: body.serviceItemId, type: body.type, identifier: body.identifier, notes: body.notes } })
  return ok(admission)
}
