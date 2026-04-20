import { db } from "@/lib/db"

export async function generateReceiptCode(orgCode: string, prefix?: string): Promise<string> {
  const base = prefix ? `${orgCode}-${prefix}` : orgCode
  const count = await db.receipt.count({ where: { code: { startsWith: base } } })
  return `${base}-${String(count + 1).padStart(4, "0")}`
}

export async function createReceipt(params: {
  orgId: string
  paymentId: string
  cartId: string
  code: string
  subtotal: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  items: unknown
  customerName?: string
  customerPhone?: string
}) {
  return db.receipt.create({
    data: {
      orgId: params.orgId,
      paymentId: params.paymentId,
      cartId: params.cartId,
      code: params.code,
      subtotal: params.subtotal,
      discountTotal: params.discountTotal,
      taxTotal: params.taxTotal,
      grandTotal: params.grandTotal,
      items: params.items as any,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
    },
  })
}
