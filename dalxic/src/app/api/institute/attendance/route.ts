import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, attendanceSchema } from "@/lib/api/schemas"

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
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(attendanceSchema, await request.json())
    if (data instanceof Response) return data

    const created = []
    for (const r of data.records) {
      const att = await db.attendance.upsert({
        where: { groupId_studentId_date: { groupId: data.groupId, studentId: r.studentId, date: new Date(data.date) } },
        create: { orgId: auth.orgId, groupId: data.groupId, studentId: r.studentId, date: new Date(data.date), status: r.status, markedBy: auth.operatorId },
        update: { status: r.status, markedBy: auth.operatorId, markedAt: new Date() },
      })
      created.push(att)
    }
    return ok(created)
  } catch {
    return fail("An error occurred", 500)
  }
}
