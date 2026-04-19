import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const url = new URL(request.url)
  const status = url.searchParams.get("status")
  const where: Record<string, unknown> = { orgId: auth.orgId }
  if (status) where.visitStatus = status
  const entries = await db.queueEntry.findMany({ where: where as any, include: { contact: true }, orderBy: [{ emergencyFlag: "desc" }, { priority: "desc" }, { queuedAt: "asc" }] })
  return ok(entries)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  if (!body.contactId) return fail("contactId required")

  const today = new Date()
  const prefix = `${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`
  const count = await db.queueEntry.count({ where: { orgId: auth.orgId, queuedAt: { gte: new Date(today.toDateString()) } } })
  const token = `${prefix}-${String(count + 1).padStart(3, "0")}`

  const entry = await db.queueEntry.create({
    data: {
      orgId: auth.orgId, contactId: body.contactId, token,
      department: body.department, chiefComplaint: body.chiefComplaint,
      symptomSeverity: body.symptomSeverity ?? 1, emergencyFlag: body.emergencyFlag ?? false,
      assignedDoctorId: body.assignedDoctorId,
    },
  })
  return ok(entry)
}

export async function PATCH(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  if (!body.id) return fail("id required")
  const entry = await db.queueEntry.update({ where: { id: body.id }, data: { visitStatus: body.visitStatus, assignedDoctorId: body.assignedDoctorId, calledAt: body.visitStatus === "in_consultation" ? new Date() : undefined, completedAt: body.visitStatus === "closed" ? new Date() : undefined } })
  return ok(entry)
}
