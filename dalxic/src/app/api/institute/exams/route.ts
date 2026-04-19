import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createExamSchema } from "@/lib/api/schemas"

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
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(createExamSchema, await request.json())
    if (data instanceof Response) return data
    const exam = await db.exam.create({
      data: { orgId: auth.orgId, groupId: data.groupId, subjectId: data.subjectId, name: data.name, term: data.term, academicYear: data.academicYear, maxScore: data.maxScore, weight: data.weight ?? 100, date: new Date(data.date) },
    })
    return ok(exam)
  } catch {
    return fail("An error occurred", 500)
  }
}
