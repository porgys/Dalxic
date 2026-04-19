import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

const imagingSchema = {
  parse(data: unknown) {
    const d = data as Record<string, unknown>
    if (!d?.contactId || typeof d.contactId !== "string") throw new Error("contactId required")
    if (!d?.clinicalRecordId || typeof d.clinicalRecordId !== "string") throw new Error("clinicalRecordId required")
    if (!d?.modality || typeof d.modality !== "string") throw new Error("modality required")
    return {
      contactId: d.contactId as string,
      clinicalRecordId: d.clinicalRecordId as string,
      modality: d.modality as string,
      bodyPart: (d.bodyPart as string) ?? "",
      action: d.action as string | undefined,
      findings: d.findings as string | undefined,
      impression: d.impression as string | undefined,
      criticalFinding: (d.criticalFinding as boolean) ?? false,
      notes: d.notes as string | undefined,
      autoTransitionQueue: (d.autoTransitionQueue as boolean) ?? false,
    }
  },
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["doctor", "lab_tech", "nurse"])
  if (denied) return denied
  try {
    const data = imagingSchema.parse(await request.json())
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })

    if (data.action === "start") {
      const record = await db.clinicalRecord.create({
        data: {
          orgId: auth.orgId, contactId: data.contactId,
          type: "imaging_result",
          data: { clinicalRecordId: data.clinicalRecordId, modality: data.modality, bodyPart: data.bodyPart },
          status: "in_progress",
          performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
        },
      })
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
        performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
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

    return ok(record)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "An error occurred"
    return fail(msg, msg.includes("required") ? 400 : 500)
  }
}
