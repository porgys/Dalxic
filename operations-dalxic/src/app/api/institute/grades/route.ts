import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const url = new URL(request.url)
  const examId = url.searchParams.get("examId")
  const studentId = url.searchParams.get("studentId")
  const where: Record<string, unknown> = {}
  if (examId) where.examId = examId
  if (studentId) where.studentId = studentId
  const grades = await db.grade.findMany({ where, include: { exam: true }, orderBy: { gradedAt: "desc" } })
  return ok(grades)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  if (!body.examId || !body.grades) return fail("examId and grades[] required")

  const created = []
  for (const g of body.grades) {
    const grade = await db.grade.upsert({
      where: { examId_studentId: { examId: body.examId, studentId: g.studentId } },
      create: { examId: body.examId, studentId: g.studentId, score: g.score, grade: g.grade, remarks: g.remarks, gradedBy: auth.operatorId },
      update: { score: g.score, grade: g.grade, remarks: g.remarks, gradedBy: auth.operatorId, gradedAt: new Date() },
    })
    created.push(grade)
  }
  return ok(created)
}
