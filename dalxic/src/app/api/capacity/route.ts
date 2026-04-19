import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get("type")

    const where: Record<string, unknown> = { orgId: auth.orgId, stockType: "capacity", isActive: true }
    if (type) where.behaviour = type

    const slots = await db.serviceItem.findMany({
      where: where as any,
      select: {
        id: true, name: true, behaviour: true,
        capacityTotal: true, capacityUsed: true,
        meta: true, categoryId: true,
      },
      orderBy: { name: "asc" },
    })

    const activeAdmissions = await db.admission.findMany({
      where: { orgId: auth.orgId, status: "active" },
      select: { id: true, contactId: true, serviceItemId: true, type: true, identifier: true, admittedAt: true, notes: true, meta: true },
    })

    const admissionsBySlot = new Map<string, typeof activeAdmissions>()
    for (const adm of activeAdmissions) {
      const existing = admissionsBySlot.get(adm.serviceItemId) ?? []
      existing.push(adm)
      admissionsBySlot.set(adm.serviceItemId, existing)
    }

    const capacity = slots.map(slot => ({
      ...slot,
      available: (slot.capacityTotal ?? 0) - (slot.capacityUsed ?? 0),
      occupancy: slot.capacityTotal ? Math.round(((slot.capacityUsed ?? 0) / slot.capacityTotal) * 100) : 0,
      activeAdmissions: admissionsBySlot.get(slot.id) ?? [],
    }))

    const summary = {
      totalSlots: slots.reduce((s, sl) => s + (sl.capacityTotal ?? 0), 0),
      occupied: slots.reduce((s, sl) => s + (sl.capacityUsed ?? 0), 0),
      available: slots.reduce((s, sl) => s + ((sl.capacityTotal ?? 0) - (sl.capacityUsed ?? 0)), 0),
    }

    return ok({ capacity, summary })
  } catch {
    return fail("An error occurred", 500)
  }
}
