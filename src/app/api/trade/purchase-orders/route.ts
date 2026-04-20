import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createPOSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const pos = await db.purchaseOrder.findMany({ where: { orgId: auth.orgId }, include: { items: true, supplier: true }, orderBy: { createdAt: "desc" } })
    return ok(pos)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin", "manager"])
  if (denied) return denied
  try {
    const data = validate(createPOSchema, await request.json())
    if (data instanceof Response) return data

    const supplier = await db.supplier.findUnique({ where: { id: data.supplierId } })
    if (!supplier || supplier.orgId !== auth.orgId) return fail("Supplier not found", 404)

    const count = await db.purchaseOrder.count({ where: { orgId: auth.orgId } })
    const poNumber = `PO-${String(count + 1).padStart(5, "0")}`
    const po = await db.purchaseOrder.create({
      data: {
        orgId: auth.orgId, supplierId: data.supplierId, poNumber,
        subtotal: data.subtotal, tax: data.tax ?? 0, total: data.total,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
        createdBy: auth.operatorId, notes: data.notes,
        items: { create: data.items.map(i => ({ ...i, total: i.quantity * i.unitCost })) },
      },
      include: { items: true },
    })
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "create_purchase_order", entity: "purchase_order", entityId: po.id, after: { poNumber, supplierId: data.supplierId, total: data.total, itemCount: data.items.length } })
    return ok(po)
  } catch {
    return fail("An error occurred", 500)
  }
}
