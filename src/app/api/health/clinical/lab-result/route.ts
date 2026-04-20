import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, labResultSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["lab_tech", "doctor"])
  if (denied) return denied
  try {
    const data = validate(labResultSchema, await request.json())
    if (data instanceof Response) return data

    const contact = await db.contact.findUnique({ where: { id: data.contactId } })
    if (!contact || contact.orgId !== auth.orgId) return fail("Patient not found", 404)

    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    const actorName = operator?.name ?? auth.role

    if (data.action === "start") {
      const record = await db.clinicalRecord.create({
        data: {
          orgId: auth.orgId, contactId: data.contactId,
          type: "lab_result",
          data: { testName: data.testName, clinicalRecordId: data.clinicalRecordId },
          status: "in_progress",
          performedBy: auth.operatorId, performedByName: actorName,
        },
      })
      await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName, action: "lab_start", entity: "clinical_record", entityId: record.id, after: { testName: data.testName } })
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
        performedBy: auth.operatorId, performedByName: actorName,
      },
    })

    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName, action: "lab_result", entity: "clinical_record", entityId: record.id, after: { testName: data.testName, abnormalFlag: data.abnormalFlag ?? false, criticalFlag: data.criticalFlag ?? false } })

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
