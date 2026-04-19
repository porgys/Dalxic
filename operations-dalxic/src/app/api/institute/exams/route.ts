import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const exams = await db.exam.findMany({ where: { orgId: auth.orgId }, include: { grades: true }, orderBy: { date: "desc" } })
  return ok(exams)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const exam = await db.exam.create({
    data: { orgId: auth.orgId, groupId: body.groupId, subjectId: body.subjectId, name: body.name, term: body.term, academicYear: body.academicYear, maxScore: body.maxScore, weight: body.weight ?? 100, date: new Date(body.date) },
  })
  return ok(exam)
}
