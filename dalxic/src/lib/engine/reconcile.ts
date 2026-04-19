import { db } from "@/lib/db"

export async function dayClose(orgId: string, branchId: string, operatorId: string, closingCash: number) {
  const shift = await db.shift.findFirst({
    where: { orgId, branchId, operatorId, status: "active" },
    orderBy: { startedAt: "desc" },
  })
  if (!shift) throw new Error("No active shift found")

  const updated = await db.shift.update({
    where: { id: shift.id },
    data: { status: "closed", closingCash, endedAt: new Date() },
  })

  return generateZReport(orgId, branchId, shift.startedAt)
}

export async function generateZReport(orgId: string, branchId: string, since: Date) {
  const now = new Date()

  const payments = await db.payment.findMany({
    where: {
      orgId,
      cart: { branchId },
      status: "completed",
      processedAt: { gte: since, lte: now },
    },
  })

  const returns = await db.return.findMany({
    where: {
      orgId,
      createdAt: { gte: since, lte: now },
    },
  })

  const salesCount = payments.length
  const salesTotal = payments.reduce((s, p) => s + p.amount, 0)
  const returnsTotal = returns.reduce((s, r) => s + r.refundAmount, 0)

  const byMethod: Record<string, number> = {}
  for (const p of payments) {
    byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount
  }

  const cashExpected = (byMethod["cash"] ?? 0) - returns.filter(r => r.refundMethod === "cash").reduce((s, r) => s + r.refundAmount, 0)

  return {
    period: { from: since, to: now },
    salesCount,
    salesTotal,
    returnsCount: returns.length,
    returnsTotal,
    netSales: salesTotal - returnsTotal,
    byMethod,
    cashExpected,
  }
}
