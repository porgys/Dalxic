import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const { id } = await params
    const admission = await db.admission.findUnique({ where: { id } })
    if (!admission || admission.orgId !== auth.orgId) return fail("Not found", 404)

    const rounds = await db.clinicalRecord.findMany({
      where: { orgId: auth.orgId, contactId: admission.contactId, type: "ward_round" },
      orderBy: { performedAt: "desc" },
    })
    return ok(rounds)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["doctor", "nurse"])
  if (denied) return denied
  try {
    const { id } = await params
    const admission = await db.admission.findUnique({ where: { id } })
    if (!admission || admission.orgId !== auth.orgId) return fail("Not found", 404)

    const body = await request.json()
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })

    const record = await db.clinicalRecord.create({
      data: {
        orgId: auth.orgId, contactId: admission.contactId,
        type: "ward_round",
        data: {
          admissionId: id,
          vitals: body.vitals ?? {},
          notes: body.notes ?? "",
          plan: body.plan ?? "",
          diet: body.diet ?? "",
          ivFluids: body.ivFluids ?? "",
          oxygenTherapy: body.oxygenTherapy ?? "",
        },
        status: "completed",
        performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
      },
    })

    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "create_ward_round", entity: "admission", entityId: id })
    return ok(record)
  } catch {
    return fail("An error occurred", 500)
  }
}
