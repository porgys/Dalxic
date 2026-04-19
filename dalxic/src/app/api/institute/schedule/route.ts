import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, scheduleSchema } from "@/lib/api/schemas"

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
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(scheduleSchema, await request.json())
    if (data instanceof Response) return data
    const slot = await db.scheduleSlot.create({
      data: { orgId: auth.orgId, groupId: data.groupId, subjectId: data.subjectId, staffId: data.staffId, dayOfWeek: data.dayOfWeek, startTime: data.startTime, endTime: data.endTime, room: data.room },
    })
    return ok(slot)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) return fail("id required")
    const slot = await db.scheduleSlot.findUnique({ where: { id } })
    if (!slot || slot.orgId !== auth.orgId) return fail("Not found", 404)
    await db.scheduleSlot.delete({ where: { id } })
    return ok({ deleted: true })
  } catch {
    return fail("An error occurred", 500)
  }
}
