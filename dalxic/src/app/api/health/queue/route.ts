import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createQueueSchema, updateQueueSchema } from "@/lib/api/schemas"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const where: Record<string, unknown> = { orgId: auth.orgId }
    if (status) where.visitStatus = status
    const entries = await db.queueEntry.findMany({ where: where as any, include: { contact: true }, orderBy: [{ emergencyFlag: "desc" }, { priority: "desc" }, { queuedAt: "asc" }] })
    return ok(entries)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(createQueueSchema, await request.json())
    if (data instanceof Response) return data

    const today = new Date()
    const prefix = `${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`
    const count = await db.queueEntry.count({ where: { orgId: auth.orgId, queuedAt: { gte: new Date(today.toDateString()) } } })
    const token = `${prefix}-${String(count + 1).padStart(3, "0")}`

    const entry = await db.queueEntry.create({
      data: {
        orgId: auth.orgId, contactId: data.contactId, token,
        department: data.department, chiefComplaint: data.chiefComplaint,
        symptomSeverity: data.symptomSeverity, emergencyFlag: data.emergencyFlag,
      },
    })
    return ok(entry)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function PATCH(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(updateQueueSchema, await request.json())
    if (data instanceof Response) return data
    const existing = await db.queueEntry.findUnique({ where: { id: data.id } })
    if (!existing || existing.orgId !== auth.orgId) return fail("Not found", 404)
    const entry = await db.queueEntry.update({ where: { id: data.id }, data: { visitStatus: data.visitStatus, assignedDoctorId: data.assignedDoctorId, calledAt: data.visitStatus === "in_consultation" ? new Date() : undefined, completedAt: data.visitStatus === "closed" ? new Date() : undefined } })
    return ok(entry)
  } catch {
    return fail("An error occurred", 500)
  }
}
