import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createQueueSchema, updateQueueSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit } from "@/lib/rate-limit"

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
  const blocked = rateLimit(request)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(createQueueSchema, await request.json())
    if (data instanceof Response) return data

    const contact = await db.contact.findUnique({ where: { id: data.contactId } })
    if (!contact || contact.orgId !== auth.orgId) return fail("Contact not found", 404)

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
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "queue_patient", entity: "queue_entry", entityId: entry.id, after: { token, contactId: data.contactId, department: data.department, emergencyFlag: data.emergencyFlag } })
    return ok(entry)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function PATCH(request: Request) {
  const blocked = rateLimit(request)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(updateQueueSchema, await request.json())
    if (data instanceof Response) return data
    const existing = await db.queueEntry.findUnique({ where: { id: data.id } })
    if (!existing || existing.orgId !== auth.orgId) return fail("Not found", 404)
    const entry = await db.queueEntry.update({ where: { id: data.id }, data: { visitStatus: data.visitStatus, assignedDoctorId: data.assignedDoctorId, calledAt: data.visitStatus === "in_consultation" ? new Date() : undefined, completedAt: data.visitStatus === "closed" ? new Date() : undefined } })
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "update_queue_status", entity: "queue_entry", entityId: data.id, before: { visitStatus: existing.visitStatus }, after: { visitStatus: data.visitStatus, assignedDoctorId: data.assignedDoctorId } })
    return ok(entry)
  } catch {
    return fail("An error occurred", 500)
  }
}
