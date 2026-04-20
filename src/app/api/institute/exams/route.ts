import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createExamSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const exams = await db.exam.findMany({ where: { orgId: auth.orgId }, include: { grades: true }, orderBy: { date: "desc" } })
    return ok(exams)
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
    const data = validate(createExamSchema, await request.json())
    if (data instanceof Response) return data

    const group = await db.group.findUnique({ where: { id: data.groupId } })
    if (!group || group.orgId !== auth.orgId) return fail("Group not found", 404)

    const exam = await db.exam.create({
      data: { orgId: auth.orgId, groupId: data.groupId, subjectId: data.subjectId, name: data.name, term: data.term, academicYear: data.academicYear, maxScore: data.maxScore, weight: data.weight ?? 100, date: new Date(data.date) },
    })
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "create_exam", entity: "exam", entityId: exam.id, after: { name: data.name, groupId: data.groupId, term: data.term, maxScore: data.maxScore } })
    return ok(exam)
  } catch {
    return fail("An error occurred", 500)
  }
}
