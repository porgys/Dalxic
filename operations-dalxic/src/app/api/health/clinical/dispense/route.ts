import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()

  if (!body.contactId || !body.clinicalRecordId || !body.drug) {
    return fail("contactId, clinicalRecordId, and drug are required")
  }

  const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })

  if (body.outOfStock) {
    const record = await db.clinicalRecord.create({
      data: {
        orgId: auth.orgId, contactId: body.contactId,
        type: "dispensing",
        data: { drug: body.drug, clinicalRecordId: body.clinicalRecordId, outOfStock: true },
        status: "out_of_stock",
        performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
      },
    })
    return ok(record)
  }

  if (body.serviceItemId && body.quantity) {
    const item = await db.serviceItem.findUnique({ where: { id: body.serviceItemId } })
    if (!item) return fail("Service item not found")
    if (item.stockType === "physical" && item.stock < body.quantity) {
      return fail("Insufficient stock")
    }

    const cartId = body.cartId
    if (cartId) {
      await db.cartItem.create({
        data: { cartId, serviceItemId: body.serviceItemId, behaviour: item.behaviour ?? "product", itemName: item.name, quantity: body.quantity, unitPrice: item.sellingPrice, discount: 0, tax: 0, total: item.sellingPrice * body.quantity },
      })
    }

    if (item.stockType === "physical") {
      const currentStock = item.stock
      await db.serviceItem.update({ where: { id: body.serviceItemId }, data: { stock: { decrement: body.quantity } } })
      await db.stockMovement.create({
        data: { orgId: auth.orgId, branchId: body.branchId ?? auth.orgId, serviceItemId: body.serviceItemId, type: "sale", quantity: -body.quantity, balanceBefore: currentStock, balanceAfter: currentStock - body.quantity, performedBy: auth.operatorId },
      })
    }
  }

  const record = await db.clinicalRecord.create({
    data: {
      orgId: auth.orgId, contactId: body.contactId, cartId: body.cartId,
      type: "dispensing",
      data: { drug: body.drug, dosage: body.dosage, duration: body.duration, quantity: body.quantity, clinicalRecordId: body.clinicalRecordId, batchNo: body.batchNo, expiresAt: body.expiresAt },
      status: "completed",
      performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
    },
  })

  return ok(record)
}
