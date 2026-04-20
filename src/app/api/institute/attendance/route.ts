import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, attendanceSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const groupId = url.searchParams.get("groupId")
    const date = url.searchParams.get("date")
    const where: Record<string, unknown> = { orgId: auth.orgId }
    if (groupId) where.groupId = groupId
    if (date) where.date = new Date(date)
    const records = await db.attendance.findMany({ where: where as any, orderBy: { date: "desc" } })
    return ok(records)
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
    const data = validate(attendanceSchema, await request.json())
    if (data instanceof Response) return data

    const group = await db.group.findUnique({ where: { id: data.groupId } })
    if (!group || group.orgId !== auth.orgId) return fail("Group not found", 404)

    const created = []
    for (const r of data.records) {
      const att = await db.attendance.upsert({
        where: { groupId_studentId_date: { groupId: data.groupId, studentId: r.studentId, date: new Date(data.date) } },
        create: { orgId: auth.orgId, groupId: data.groupId, studentId: r.studentId, date: new Date(data.date), status: r.status, markedBy: auth.operatorId },
        update: { status: r.status, markedBy: auth.operatorId, markedAt: new Date() },
      })
      created.push(att)
    }
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "mark_attendance", entity: "attendance", entityId: data.groupId, after: { groupId: data.groupId, date: data.date, recordCount: created.length } })
    return ok(created)
  } catch {
    return fail("An error occurred", 500)
  }
}
