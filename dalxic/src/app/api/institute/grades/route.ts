import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createGradeSchema } from "@/lib/api/schemas"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const examId = url.searchParams.get("examId")
    const studentId = url.searchParams.get("studentId")
    const where: Record<string, unknown> = { exam: { orgId: auth.orgId } }
    if (examId) where.examId = examId
    if (studentId) where.studentId = studentId
    const grades = await db.grade.findMany({ where: where as any, include: { exam: true }, orderBy: { gradedAt: "desc" } })
    return ok(grades)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(createGradeSchema, await request.json())
    if (data instanceof Response) return data

    const exam = await db.exam.findUnique({ where: { id: data.examId } })
    if (!exam || exam.orgId !== auth.orgId) return fail("Exam not found", 404)

    const created = []
    for (const g of data.grades) {
      const grade = await db.grade.upsert({
        where: { examId_studentId: { examId: data.examId, studentId: g.studentId } },
        create: { examId: data.examId, studentId: g.studentId, score: g.score, grade: g.grade, remarks: g.remarks, gradedBy: auth.operatorId },
        update: { score: g.score, grade: g.grade, remarks: g.remarks, gradedBy: auth.operatorId, gradedAt: new Date() },
      })
      created.push(grade)
    }
    return ok(created)
  } catch {
    return fail("An error occurred", 500)
  }
}
