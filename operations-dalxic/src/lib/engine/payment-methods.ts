import { db } from "@/lib/db"
import { generateReceiptCode, createReceipt } from "./receipt"
import { decrementPhysical, occupyCapacity } from "@/lib/api/stock"
import { logAudit } from "@/lib/api/audit"

export async function processPayment(params: {
  cartId: string
  method: string
  amount: number
  reference?: string
  processedBy: string
  processedByName: string
}) {
  const cart = await db.cart.findUniqueOrThrow({
    where: { id: params.cartId },
    include: { items: true, org: true },
  })

  if (cart.status !== "tendered") throw new Error("Cart must be tendered before payment")

  const org = cart.org
  const receiptCode = await generateReceiptCode(org.code)

  const payment = await db.payment.create({
    data: {
      orgId: org.id,
      cartId: cart.id,
      receiptCode,
      method: params.method,
      amount: params.amount,
      reference: params.reference,
      status: "completed",
      processedBy: params.processedBy,
      processedByName: params.processedByName,
      processedAt: new Date(),
    },
  })

  const stockMovements: Array<{ serviceItemId: string; type: string; quantity: number }> = []

  // Get the branch from cart
  const branchId = cart.branchId

  for (const item of cart.items) {
    const si = await db.serviceItem.findUniqueOrThrow({ where: { id: item.serviceItemId } })

    if (si.stockType === "physical") {
      await decrementPhysical({
        orgId: org.id,
        serviceItemId: si.id,
        branchId,
        quantity: item.quantity,
        reference: payment.id,
        performedBy: params.processedBy,
      })
      stockMovements.push({ serviceItemId: si.id, type: "sold", quantity: -item.quantity })
    } else if (si.stockType === "capacity") {
      await occupyCapacity({
        orgId: org.id,
        serviceItemId: si.id,
        branchId,
        reference: payment.id,
        performedBy: params.processedBy,
      })
      stockMovements.push({ serviceItemId: si.id, type: "occupied", quantity: 1 })
    }
    // service type = no stock effect
  }

  const subtotal = cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const discountTotal = cart.items.reduce((s, i) => s + i.discount, 0)
  const taxTotal = cart.items.reduce((s, i) => s + i.tax, 0)
  const grandTotal = subtotal - discountTotal + taxTotal

  // Look up contact for receipt
  let customerName: string | undefined
  let customerPhone: string | undefined
  if (cart.contactId) {
    const contact = await db.contact.findUnique({ where: { id: cart.contactId } })
    if (contact) {
      customerName = contact.name
      customerPhone = contact.phone ?? undefined
    }
  }

  const receipt = await createReceipt({
    orgId: org.id,
    paymentId: payment.id,
    cartId: cart.id,
    code: receiptCode,
    subtotal,
    discountTotal,
    taxTotal,
    grandTotal,
    items: cart.items.map(i => ({
      itemName: i.itemName,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      discount: i.discount,
      tax: i.tax,
      total: i.total,
    })),
    customerName,
    customerPhone,
  })

  await db.cart.update({ where: { id: cart.id }, data: { status: "completed" } })

  // Update contact stats
  if (cart.contactId) {
    await db.contact.update({
      where: { id: cart.contactId },
      data: {
        totalSpent: { increment: grandTotal },
        visitCount: { increment: 1 },
      },
    })
  }

  await logAudit({
    orgId: org.id,
    actorId: params.processedBy,
    actorName: params.processedByName,
    action: "process_payment",
    entity: "payment",
    entityId: payment.id,
    after: { method: params.method, amount: params.amount, receiptCode },
  })

  return { payment, receipt, stockMovements }
}
