import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["doctor", "nurse", "admin"])
  if (denied) return denied
  try {
    const { id } = await params
    const admission = await db.admission.findUnique({ where: { id } })
    if (!admission || admission.orgId !== auth.orgId) return fail("Not found", 404)
    if (admission.status === "discharged") return fail("Already discharged")

    const body = await request.json()
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })

    const [updated, dischargeRecord] = await Promise.all([
      db.admission.update({
        where: { id },
        data: { status: "discharged", dischargedAt: new Date(), notes: body.dischargeNotes ?? admission.notes },
      }),
      db.clinicalRecord.create({
        data: {
          orgId: auth.orgId, contactId: admission.contactId,
          type: "discharge",
          data: {
            admissionId: id,
            diagnosis: body.diagnosis ?? "",
            condition: body.conditionAtDischarge ?? "stable",
            instructions: body.instructions ?? "",
            followUp: body.followUp ?? "",
            medications: body.medications ?? [],
          },
          status: "completed",
          performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
        },
      }),
    ])

    await db.recurringCharge.updateMany({
      where: { orgId: auth.orgId, admissionId: id, status: "active" },
      data: { status: "cancelled" },
    })

    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "discharge_patient", entity: "admission", entityId: id, before: { status: admission.status }, after: { status: "discharged" } })
    return ok({ admission: updated, dischargeRecord })
  } catch {
    return fail("An error occurred", 500)
  }
}
