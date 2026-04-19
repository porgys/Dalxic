import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const url = new URL(request.url)
  const groupId = url.searchParams.get("groupId")
  const date = url.searchParams.get("date")
  const where: Record<string, unknown> = { orgId: auth.orgId }
  if (groupId) where.groupId = groupId
  if (date) where.date = new Date(date)
  const records = await db.attendance.findMany({ where: where as any, orderBy: { date: "desc" } })
  return ok(records)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  if (!body.groupId || !body.date || !body.records) return fail("groupId, date, records[] required")

  const created = []
  for (const r of body.records) {
    const att = await db.attendance.upsert({
      where: { groupId_studentId_date: { groupId: body.groupId, studentId: r.studentId, date: new Date(body.date) } },
      create: { orgId: auth.orgId, groupId: body.groupId, studentId: r.studentId, date: new Date(body.date), status: r.status, markedBy: auth.operatorId },
      update: { status: r.status, markedBy: auth.operatorId, markedAt: new Date() },
    })
    created.push(att)
  }
  return ok(created)
}
