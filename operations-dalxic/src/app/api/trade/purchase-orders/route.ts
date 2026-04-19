import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const pos = await db.purchaseOrder.findMany({ where: { orgId: auth.orgId }, include: { items: true, supplier: true }, orderBy: { createdAt: "desc" } })
  return ok(pos)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const count = await db.purchaseOrder.count({ where: { orgId: auth.orgId } })
  const poNumber = `PO-${String(count + 1).padStart(5, "0")}`
  const po = await db.purchaseOrder.create({
    data: {
      orgId: auth.orgId, supplierId: body.supplierId, poNumber,
      subtotal: body.subtotal, tax: body.tax ?? 0, total: body.total,
      expectedDate: body.expectedDate ? new Date(body.expectedDate) : undefined,
      createdBy: auth.operatorId, notes: body.notes,
      items: { create: body.items },
    },
    include: { items: true },
  })
  return ok(po)
}
