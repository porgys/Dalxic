import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"
import { validate, bloodBankActionSchema } from "@/lib/api/schemas"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const view = url.searchParams.get("view") ?? "inventory"

    if (view === "inventory") {
      const items = await db.serviceItem.findMany({
        where: { orgId: auth.orgId, isActive: true, meta: { path: ["bloodGroup"], not: undefined } },
        orderBy: { name: "asc" },
      })
      const inventory = items.map(item => {
        const meta = item.meta as Record<string, unknown> | null
        return {
          id: item.id, group: meta?.bloodGroup as string, component: meta?.bloodComponent as string,
          units: item.stock, expiresAt: item.expiresAt?.toISOString().slice(0, 10) ?? null,
          status: item.stock <= 0 ? "expired" : "available",
        }
      })
      return ok(inventory)
    }

    if (view === "donors") {
      const donors = await db.contact.findMany({
        where: { orgId: auth.orgId, type: "patient", bloodGroup: { not: null } },
        orderBy: { name: "asc" },
      })
      const donorData = donors.filter(d => {
        const meta = d.meta as Record<string, unknown> | null
        return meta?.isDonor === true
      }).map(d => {
        const meta = d.meta as Record<string, unknown> | null
        return {
          id: d.id, name: d.name, group: d.bloodGroup, phone: d.phone,
          lastDonation: (meta?.lastDonation as string) ?? "Never",
          donations: (meta?.donationCount as number) ?? 0,
          status: (meta?.donorStatus as string) ?? "eligible",
          deferReason: meta?.deferReason as string | undefined,
        }
      })
      return ok(donorData)
    }

    if (view === "crossmatch") {
      const records = await db.clinicalRecord.findMany({
        where: { orgId: auth.orgId, type: "cross_match" },
        orderBy: { performedAt: "desc" },
        take: 50,
      })
      const matches = records.map(r => {
        const data = r.data as Record<string, unknown>
        return {
          id: r.id, patient: data.patientName as string, patientGroup: data.patientGroup as string,
          requestedComponent: data.requestedComponent as string, units: data.units as number,
          status: r.status, requestedAt: r.performedAt.toISOString().slice(0, 16).replace("T", " "),
          matchedDonor: data.matchedDonorId as string | undefined,
        }
      })
      return ok(matches)
    }

    return fail("Invalid view parameter")
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const roleCheck = requireRole(auth, ["doctor", "nurse", "blood_bank_tech", "admin", "owner"])
  if (roleCheck) return roleCheck
  try {
    const data = validate(bloodBankActionSchema, await request.json())
    if (data instanceof Response) return data

    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    const actorName = operator?.name ?? auth.role

    if (data.action === "crossmatch") {
      const contact = await db.contact.findUnique({ where: { id: data.contactId } })
      if (!contact || contact.orgId !== auth.orgId) return fail("Patient not found", 404)

      const record = await db.clinicalRecord.create({
        data: {
          orgId: auth.orgId, contactId: data.contactId, type: "cross_match",
          data: { patientName: data.patientName, patientGroup: data.patientGroup, requestedComponent: data.requestedComponent, units: data.units },
          status: "pending", performedBy: auth.operatorId, performedByName: data.operatorName ?? operator?.name ?? auth.role,
        },
      })
      await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName, action: "blood_bank_crossmatch_request", entity: "clinical_record", entityId: record.id, after: { patientGroup: data.patientGroup, units: data.units } })
      return ok(record)
    }

    if (data.action === "update_match") {
      const existing = await db.clinicalRecord.findUnique({ where: { id: data.id } })
      if (!existing || existing.orgId !== auth.orgId) return fail("Record not found", 404)

      const record = await db.clinicalRecord.update({
        where: { id: data.id },
        data: { status: data.status },
      })
      await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName, action: "blood_bank_update_match", entity: "clinical_record", entityId: record.id, before: { status: existing.status }, after: { status: data.status } })
      return ok(record)
    }

    if (data.action === "register_donor") {
      const contact = await db.contact.findUnique({ where: { id: data.contactId } })
      if (!contact || contact.orgId !== auth.orgId) return fail("Contact not found", 404)

      const updated = await db.contact.update({
        where: { id: data.contactId },
        data: { meta: { isDonor: true, donorStatus: "eligible", donationCount: 0, lastDonation: null } },
      })
      await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName, action: "blood_bank_register_donor", entity: "contact", entityId: updated.id })
      return ok(updated)
    }

    if (data.action === "record_donation") {
      const contact = await db.contact.findUnique({ where: { id: data.contactId } })
      if (!contact || contact.orgId !== auth.orgId) return fail("Donor not found", 404)

      const meta = (contact.meta as Record<string, unknown>) ?? {}
      const updated = await db.contact.update({
        where: { id: data.contactId },
        data: { meta: { ...meta, donationCount: ((meta.donationCount as number) ?? 0) + 1, lastDonation: new Date().toISOString().slice(0, 10) } },
      })
      await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName, action: "blood_bank_record_donation", entity: "contact", entityId: updated.id, after: { donationCount: ((meta.donationCount as number) ?? 0) + 1 } })
      return ok({ success: true })
    }

    return fail("Invalid action")
  } catch {
    return fail("An error occurred", 500)
  }
}
