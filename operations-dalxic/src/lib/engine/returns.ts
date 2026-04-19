import { db } from "@/lib/db"
import { incrementPhysical, releaseCapacity } from "@/lib/api/stock"
import { logAudit } from "@/lib/api/audit"

export async function generateCreditNoteCode(orgCode: string): Promise<string> {
  const count = await db.return.count({ where: { creditNoteCode: { startsWith: `CN-${orgCode}` } } })
  return `CN-${orgCode}-${String(count + 1).padStart(4, "0")}`
}

export async function createReturn(params: {
  orgId: string
  paymentId: string
  items: Array<{ serviceItemId: string; itemName: string; unitPrice: number; quantity: number; restock: boolean }>
  type: "void" | "refund"
  reason: string
  reasonText?: string
  refundMethod: string
  processedBy: string
  processedByName: string
  branchId: string
}) {
  const payment = await db.payment.findUniqueOrThrow({
    where: { id: params.paymentId },
    include: { cart: { include: { items: true } } },
  })

  const refundAmount = params.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const creditNoteCode = await generateCreditNoteCode(
    (await db.organization.findUniqueOrThrow({ where: { id: params.orgId }, select: { code: true } })).code
  )

  const ret = await db.return.create({
    data: {
      orgId: params.orgId,
      originalPaymentId: params.paymentId,
      creditNoteCode,
      type: params.type,
      reason: params.reason,
      reasonText: params.reasonText,
      refundMethod: params.refundMethod,
      refundAmount,
      restockItems: params.items.some(i => i.restock),
      processedBy: params.processedBy,
      processedByName: params.processedByName,
      items: {
        create: params.items.map(i => ({
          serviceItemId: i.serviceItemId,
          itemName: i.itemName,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          total: i.unitPrice * i.quantity,
          restock: i.restock,
        })),
      },
    },
    include: { items: true },
  })

  for (const item of params.items) {
    if (!item.restock) continue
    const si = await db.serviceItem.findUniqueOrThrow({ where: { id: item.serviceItemId } })
    if (si.stockType === "physical") {
      await incrementPhysical({
        orgId: params.orgId,
        serviceItemId: item.serviceItemId,
        branchId: params.branchId,
        quantity: item.quantity,
        type: "returned",
        reference: ret.id,
        performedBy: params.processedBy,
      })
    } else if (si.stockType === "capacity") {
      await releaseCapacity({
        orgId: params.orgId,
        serviceItemId: item.serviceItemId,
        branchId: params.branchId,
        reference: ret.id,
        performedBy: params.processedBy,
      })
    }
  }

  if (params.type === "void") {
    await db.payment.update({ where: { id: params.paymentId }, data: { status: "refunded" } })
    await db.cart.update({ where: { id: payment.cartId }, data: { status: "voided" } })
  }

  await logAudit({
    orgId: params.orgId,
    actorId: params.processedBy,
    actorName: params.processedByName,
    action: params.type === "void" ? "void_payment" : "refund_payment",
    entity: "return",
    entityId: ret.id,
    after: { creditNoteCode, refundAmount, type: params.type },
  })

  return ret
}
