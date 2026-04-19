import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()

  if (!body.contactId || !body.clinicalRecordId || !body.testName) {
    return fail("contactId, clinicalRecordId, and testName are required")
  }

  const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })

  if (body.action === "start") {
    const record = await db.clinicalRecord.create({
      data: {
        orgId: auth.orgId, contactId: body.contactId,
        type: "lab_result",
        data: { testName: body.testName, clinicalRecordId: body.clinicalRecordId },
        status: "in_progress",
        performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
      },
    })
    return ok(record)
  }

  const record = await db.clinicalRecord.create({
    data: {
      orgId: auth.orgId, contactId: body.contactId,
      type: "lab_result",
      data: {
        testName: body.testName, clinicalRecordId: body.clinicalRecordId,
        result: body.result, normalRange: body.normalRange,
        abnormalFlag: body.abnormalFlag ?? false, criticalFlag: body.criticalFlag ?? false,
        notes: body.notes, tat: body.tat,
      },
      status: "completed",
      performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
    },
  })

  if (body.autoTransitionQueue) {
    const consultation = await db.clinicalRecord.findUnique({ where: { id: body.clinicalRecordId } })
    if (consultation) {
      const allLabOrders: string[] = (consultation.data as any)?.labOrders ?? []
      const completedResults = await db.clinicalRecord.findMany({
        where: { orgId: auth.orgId, type: "lab_result", status: "completed" },
      })
      const completedTests = new Set(
        completedResults
          .filter(r => (r.data as any)?.clinicalRecordId === body.clinicalRecordId)
          .map(r => (r.data as any)?.testName)
      )
      completedTests.add(body.testName)

      const allDone = allLabOrders.every(t => completedTests.has(t))
      if (allDone) {
        const queueEntry = await db.queueEntry.findFirst({
          where: { orgId: auth.orgId, contactId: body.contactId, visitStatus: "paused_for_lab" },
        })
        if (queueEntry) {
          await db.queueEntry.update({ where: { id: queueEntry.id }, data: { visitStatus: "lab_results_ready" } })
        }
      }
    }
  }

  return ok(record)
}
