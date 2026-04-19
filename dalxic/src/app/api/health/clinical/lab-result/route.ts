import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, labResultSchema } from "@/lib/api/schemas"

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["lab_tech", "doctor"])
  if (denied) return denied
  try {
    const data = validate(labResultSchema, await request.json())
    if (data instanceof Response) return data

    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })

    if (data.action === "start") {
      const record = await db.clinicalRecord.create({
        data: {
          orgId: auth.orgId, contactId: data.contactId,
          type: "lab_result",
          data: { testName: data.testName, clinicalRecordId: data.clinicalRecordId },
          status: "in_progress",
          performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
        },
      })
      return ok(record)
    }

    const record = await db.clinicalRecord.create({
      data: {
        orgId: auth.orgId, contactId: data.contactId,
        type: "lab_result",
        data: {
          testName: data.testName, clinicalRecordId: data.clinicalRecordId,
          result: data.result, normalRange: data.normalRange,
          abnormalFlag: data.abnormalFlag ?? false, criticalFlag: data.criticalFlag ?? false,
          notes: data.notes, tat: data.tat,
        },
        status: "completed",
        performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
      },
    })

    if (data.autoTransitionQueue) {
      const consultation = await db.clinicalRecord.findUnique({ where: { id: data.clinicalRecordId } })
      if (consultation) {
        const allLabOrders: string[] = (consultation.data as any)?.labOrders ?? []
        const completedResults = await db.clinicalRecord.findMany({
          where: { orgId: auth.orgId, type: "lab_result", status: "completed" },
        })
        const completedTests = new Set(
          completedResults
            .filter(r => (r.data as any)?.clinicalRecordId === data.clinicalRecordId)
            .map(r => (r.data as any)?.testName)
        )
        completedTests.add(data.testName)

        const allDone = allLabOrders.every(t => completedTests.has(t))
        if (allDone) {
          const queueEntry = await db.queueEntry.findFirst({
            where: { orgId: auth.orgId, contactId: data.contactId, visitStatus: "paused_for_lab" },
          })
          if (queueEntry) {
            await db.queueEntry.update({ where: { id: queueEntry.id }, data: { visitStatus: "lab_results_ready" } })
          }
        }
      }
    }

    return ok(record)
  } catch {
    return fail("An error occurred", 500)
  }
}
