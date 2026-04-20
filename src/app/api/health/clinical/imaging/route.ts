import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"
import { validate, clinicalImagingSchema } from "@/lib/api/schemas"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["doctor", "lab_tech", "nurse"])
  if (denied) return denied
  try {
    const data = validate(clinicalImagingSchema, await request.json())
    if (data instanceof Response) return data

    const contact = await db.contact.findUnique({ where: { id: data.contactId } })
    if (!contact || contact.orgId !== auth.orgId) return fail("Patient not found", 404)

    const parent = await db.clinicalRecord.findUnique({ where: { id: data.clinicalRecordId } })
    if (!parent || parent.orgId !== auth.orgId) return fail("Imaging order not found", 404)

    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    const actorName = operator?.name ?? auth.role

    if (data.action === "start") {
      const record = await db.clinicalRecord.create({
        data: {
          orgId: auth.orgId, contactId: data.contactId,
          type: "imaging_result",
          data: { clinicalRecordId: data.clinicalRecordId, modality: data.modality, bodyPart: data.bodyPart },
          status: "in_progress",
          performedBy: auth.operatorId, performedByName: actorName,
        },
      })
      await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName, action: "imaging_start", entity: "clinical_record", entityId: record.id, after: { modality: data.modality, bodyPart: data.bodyPart } })
      return ok(record)
    }

    const record = await db.clinicalRecord.create({
      data: {
        orgId: auth.orgId, contactId: data.contactId,
        type: "imaging_result",
        data: {
          clinicalRecordId: data.clinicalRecordId,
          modality: data.modality, bodyPart: data.bodyPart,
          findings: data.findings, impression: data.impression,
          criticalFinding: data.criticalFinding, notes: data.notes,
        },
        status: "completed",
        performedBy: auth.operatorId, performedByName: actorName,
      },
    })

    if (data.autoTransitionQueue) {
      const queueEntry = await db.queueEntry.findFirst({
        where: { orgId: auth.orgId, contactId: data.contactId, visitStatus: "paused_for_imaging" },
      })
      if (queueEntry) {
        await db.queueEntry.update({ where: { id: queueEntry.id }, data: { visitStatus: "imaging_results_ready" } })
      }
    }

    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName, action: "imaging_complete", entity: "clinical_record", entityId: record.id, after: { modality: data.modality, criticalFinding: data.criticalFinding } })
    return ok(record)
  } catch {
    return fail("An error occurred", 500)
  }
}
