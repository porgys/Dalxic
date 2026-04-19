import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const url = new URL(request.url)
  const groupId = url.searchParams.get("groupId")
  const where: Record<string, unknown> = { orgId: auth.orgId }
  if (groupId) where.groupId = groupId
  const slots = await db.scheduleSlot.findMany({ where: where as any, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] })
  return ok(slots)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const slot = await db.scheduleSlot.create({
    data: { orgId: auth.orgId, groupId: body.groupId, subjectId: body.subjectId, staffId: body.staffId, dayOfWeek: body.dayOfWeek, startTime: body.startTime, endTime: body.endTime, room: body.room },
  })
  return ok(slot)
}

export async function DELETE(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  if (!id) return fail("id required")
  await db.scheduleSlot.delete({ where: { id } })
  return ok({ deleted: true })
}
