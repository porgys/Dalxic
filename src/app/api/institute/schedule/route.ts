import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, scheduleSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const groupId = url.searchParams.get("groupId")
    const where: Record<string, unknown> = { orgId: auth.orgId }
    if (groupId) where.groupId = groupId
    const slots = await db.scheduleSlot.findMany({ where: where as any, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] })
    return ok(slots)
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
    const data = validate(scheduleSchema, await request.json())
    if (data instanceof Response) return data
    const slot = await db.scheduleSlot.create({
      data: { orgId: auth.orgId, groupId: data.groupId, subjectId: data.subjectId, staffId: data.staffId, dayOfWeek: data.dayOfWeek, startTime: data.startTime, endTime: data.endTime, room: data.room },
    })
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "create_schedule_slot", entity: "schedule_slot", entityId: slot.id, after: { groupId: data.groupId, subjectId: data.subjectId, dayOfWeek: data.dayOfWeek, startTime: data.startTime, endTime: data.endTime } })
    return ok(slot)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function DELETE(request: Request) {
  const blocked = rateLimit(request)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) return fail("id required")
    const slot = await db.scheduleSlot.findUnique({ where: { id } })
    if (!slot || slot.orgId !== auth.orgId) return fail("Not found", 404)
    await db.scheduleSlot.delete({ where: { id } })
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "delete_schedule_slot", entity: "schedule_slot", entityId: id, before: { groupId: slot.groupId, subjectId: slot.subjectId, dayOfWeek: slot.dayOfWeek } })
    return ok({ deleted: true })
  } catch {
    return fail("An error occurred", 500)
  }
}
