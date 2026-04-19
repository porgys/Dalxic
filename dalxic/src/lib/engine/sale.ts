import { db } from "@/lib/db"
import { calculateTax } from "@/lib/api/tax"

export async function createCart(orgId: string, branchId: string, operatorId: string, contactId?: string, paymentGate?: string) {
  const org = await db.organization.findUniqueOrThrow({ where: { id: orgId } })
  return db.cart.create({
    data: {
      orgId,
      branchId,
      operatorId,
      contactId,
      paymentGate: paymentGate ?? org.paymentGate,
      status: "open",
    },
    include: { items: true },
  })
}

export async function addItem(cartId: string, serviceItemId: string, quantity: number, discount = 0) {
  const cart = await db.cart.findUniqueOrThrow({ where: { id: cartId } })
  if (cart.status !== "open") throw new Error("Cart is not open")

  const item = await db.serviceItem.findUniqueOrThrow({ where: { id: serviceItemId } })
  const lineTotal = item.sellingPrice * quantity - discount

  return db.cartItem.create({
    data: {
      cartId,
      serviceItemId,
      behaviour: item.behaviour,
      itemName: item.name,
      unitPrice: item.sellingPrice,
      quantity,
      discount,
      tax: 0,
      total: lineTotal,
    },
  })
}

export async function removeItem(cartItemId: string) {
  return db.cartItem.delete({ where: { id: cartItemId } })
}

export async function updateItemQuantity(cartItemId: string, quantity: number) {
  const item = await db.cartItem.findUniqueOrThrow({ where: { id: cartItemId } })
  const total = item.unitPrice * quantity - item.discount
  return db.cartItem.update({
    where: { id: cartItemId },
    data: { quantity, total },
  })
}

export async function tenderCart(cartId: string) {
  const cart = await db.cart.findUniqueOrThrow({
    where: { id: cartId },
    include: { items: true, org: true },
  })
  if (cart.status !== "open") throw new Error("Cart is not open")

  const subtotal = cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const discountTotal = cart.items.reduce((s, i) => s + i.discount, 0)

  const taxableSubtotal = subtotal - discountTotal
  const taxBreakdown = calculateTax(taxableSubtotal, cart.org.taxConfig as Record<string, number> | null)

  for (const item of cart.items) {
    const itemProportion = (item.unitPrice * item.quantity - item.discount) / (taxableSubtotal || 1)
    const itemTax = Math.round(taxBreakdown.total * itemProportion)
    await db.cartItem.update({
      where: { id: item.id },
      data: { tax: itemTax, total: item.unitPrice * item.quantity - item.discount + itemTax },
    })
  }

  await db.cart.update({ where: { id: cartId }, data: { status: "tendered" } })

  return {
    cartId,
    subtotal,
    discountTotal,
    taxTotal: taxBreakdown.total,
    taxBreakdown,
    grandTotal: subtotal - discountTotal + taxBreakdown.total,
    items: cart.items.map(i => ({
      id: i.id,
      itemName: i.itemName,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      discount: i.discount,
      total: i.unitPrice * i.quantity - i.discount,
    })),
  }
}
