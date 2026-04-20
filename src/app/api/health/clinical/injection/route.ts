import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"
import { validate, clinicalInjectionSchema } from "@/lib/api/schemas"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["nurse", "doctor", "pharmacist"])
  if (denied) return denied
  try {
    const data = validate(clinicalInjectionSchema, await request.json())
    if (data instanceof Response) return data

    const contact = await db.contact.findUnique({ where: { id: data.contactId } })
    if (!contact || contact.orgId !== auth.orgId) return fail("Patient not found", 404)

    const parent = await db.clinicalRecord.findUnique({ where: { id: data.clinicalRecordId } })
    if (!parent || parent.orgId !== auth.orgId) return fail("Prescription not found", 404)

    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })

    const record = await db.clinicalRecord.create({
      data: {
        orgId: auth.orgId, contactId: data.contactId,
        type: "injection",
        data: {
          clinicalRecordId: data.clinicalRecordId,
          drug: data.drug, route: data.route, site: data.site,
          dosage: data.dosage, lotNumber: data.lotNumber,
          expiryDate: data.expiryDate,
          aefiReported: data.aefiReported, aefiDetails: data.aefiDetails,
          notes: data.notes,
        },
        status: "completed",
        performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
      },
    })

    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "administer_injection", entity: "clinical_record", entityId: record.id, after: { drug: data.drug, route: data.route, aefiReported: data.aefiReported } })
    return ok(record)
  } catch {
    return fail("An error occurred", 500)
  }
}
