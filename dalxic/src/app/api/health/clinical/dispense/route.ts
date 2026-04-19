import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, dispenseSchema } from "@/lib/api/schemas"

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["pharmacist", "doctor", "nurse"])
  if (denied) return denied
  try {
    const data = validate(dispenseSchema, await request.json())
    if (data instanceof Response) return data

    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })

    if (data.outOfStock) {
      const record = await db.clinicalRecord.create({
        data: {
          orgId: auth.orgId, contactId: data.contactId,
          type: "dispensing",
          data: { drug: data.drug, clinicalRecordId: data.clinicalRecordId, outOfStock: true },
          status: "out_of_stock",
          performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
        },
      })
      return ok(record)
    }

    if (data.serviceItemId && data.quantity) {
      const item = await db.serviceItem.findUnique({ where: { id: data.serviceItemId } })
      if (!item || item.orgId !== auth.orgId) return fail("Service item not found", 404)
      if (item.stockType === "physical" && item.stock < data.quantity) {
        return fail("Insufficient stock")
      }

      const cartId = data.cartId
      if (cartId) {
        await db.cartItem.create({
          data: { cartId, serviceItemId: data.serviceItemId, behaviour: item.behaviour ?? "product", itemName: item.name, quantity: data.quantity, unitPrice: item.sellingPrice, discount: 0, tax: 0, total: item.sellingPrice * data.quantity },
        })
      }

      if (item.stockType === "physical") {
        const currentStock = item.stock
        await db.serviceItem.update({ where: { id: data.serviceItemId }, data: { stock: { decrement: data.quantity } } })
        await db.stockMovement.create({
          data: { orgId: auth.orgId, branchId: data.branchId ?? auth.orgId, serviceItemId: data.serviceItemId, type: "sale", quantity: -data.quantity, balanceBefore: currentStock, balanceAfter: currentStock - data.quantity, performedBy: auth.operatorId },
        })
      }
    }

    const record = await db.clinicalRecord.create({
      data: {
        orgId: auth.orgId, contactId: data.contactId, cartId: data.cartId,
        type: "dispensing",
        data: { drug: data.drug, dosage: data.dosage, duration: data.duration, quantity: data.quantity, clinicalRecordId: data.clinicalRecordId, batchNo: data.batchNo, expiresAt: data.expiresAt },
        status: "completed",
        performedBy: auth.operatorId, performedByName: operator?.name ?? auth.role,
      },
    })

    return ok(record)
  } catch {
    return fail("An error occurred", 500)
  }
}
