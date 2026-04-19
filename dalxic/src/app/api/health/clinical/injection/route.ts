import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

const injectionSchema = {
  parse(data: unknown) {
    const d = data as Record<string, unknown>
    if (!d?.contactId || typeof d.contactId !== "string") throw new Error("contactId required")
    if (!d?.clinicalRecordId || typeof d.clinicalRecordId !== "string") throw new Error("clinicalRecordId required")
    if (!d?.drug || typeof d.drug !== "string") throw new Error("drug required")
    return {
      contactId: d.contactId as string,
      clinicalRecordId: d.clinicalRecordId as string,
      drug: d.drug as string,
      route: (d.route as string) ?? "IM",
      site: (d.site as string) ?? "",
      dosage: d.dosage as string | undefined,
      lotNumber: d.lotNumber as string | undefined,
      expiryDate: d.expiryDate as string | undefined,
      aefiReported: (d.aefiReported as boolean) ?? false,
      aefiDetails: d.aefiDetails as string | undefined,
      notes: d.notes as string | undefined,
    }
  },
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["nurse", "doctor", "pharmacist"])
  if (denied) return denied
  try {
    const data = injectionSchema.parse(await request.json())
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

    return ok(record)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "An error occurred"
    return fail(msg, msg.includes("required") ? 400 : 500)
  }
}
