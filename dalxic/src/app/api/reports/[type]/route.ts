import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

const REPORT_TYPES = ["revenue", "sales", "stock", "expenses", "payroll", "admissions", "queue", "audit"] as const

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const { type } = await params
    if (!REPORT_TYPES.includes(type as any)) return fail(`Invalid report type. Valid: ${REPORT_TYPES.join(", ")}`)

    const url = new URL(request.url)
    const from = url.searchParams.get("from")
    const to = url.searchParams.get("to")
    const dateFrom = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30))
    const dateTo = to ? new Date(to) : new Date()

    switch (type) {
      case "revenue": {
        const receipts = await db.receipt.findMany({ where: { orgId: auth.orgId, createdAt: { gte: dateFrom, lte: dateTo } }, select: { grandTotal: true, taxTotal: true, subtotal: true, createdAt: true } })
        const returns = await db.return.findMany({ where: { orgId: auth.orgId, createdAt: { gte: dateFrom, lte: dateTo } }, select: { refundAmount: true } })
        const totalRevenue = receipts.reduce((s, r) => s + r.grandTotal, 0)
        const totalTax = receipts.reduce((s, r) => s + r.taxTotal, 0)
        const totalReturns = returns.reduce((s, r) => s + r.refundAmount, 0)
        return ok({ type: "revenue", period: { from: dateFrom, to: dateTo }, totalRevenue, totalTax, totalReturns, netRevenue: totalRevenue - totalReturns, transactionCount: receipts.length })
      }
      case "sales": {
        const receipts = await db.receipt.findMany({ where: { orgId: auth.orgId, createdAt: { gte: dateFrom, lte: dateTo } }, select: { items: true, grandTotal: true, createdAt: true }, orderBy: { createdAt: "desc" } })
        return ok({ type: "sales", period: { from: dateFrom, to: dateTo }, transactions: receipts.length, receipts })
      }
      case "stock": {
        const items = await db.serviceItem.findMany({ where: { orgId: auth.orgId, stockType: "physical", isActive: true }, select: { id: true, name: true, stock: true, minStock: true, costPrice: true, sellingPrice: true, batchNo: true, expiresAt: true }, orderBy: { stock: "asc" } })
        const lowStock = items.filter(i => i.stock <= i.minStock)
        const expiring = items.filter(i => i.expiresAt && i.expiresAt <= new Date(Date.now() + 90 * 86400000))
        return ok({ type: "stock", totalItems: items.length, lowStockCount: lowStock.length, expiringCount: expiring.length, lowStock, expiring, items })
      }
      case "expenses": {
        const expenses = await db.expense.findMany({ where: { orgId: auth.orgId, date: { gte: dateFrom, lte: dateTo } }, orderBy: { date: "desc" } })
        const total = expenses.reduce((s, e) => s + e.amount, 0)
        const byCategory: Record<string, number> = {}
        for (const e of expenses) byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount
        return ok({ type: "expenses", period: { from: dateFrom, to: dateTo }, total, count: expenses.length, byCategory, expenses })
      }
      case "payroll": {
        const runs = await db.payRun.findMany({ where: { orgId: auth.orgId }, include: { slips: true }, orderBy: { createdAt: "desc" }, take: 12 })
        return ok({ type: "payroll", runs })
      }
      case "admissions": {
        const active = await db.admission.count({ where: { orgId: auth.orgId, status: "active" } })
        const discharged = await db.admission.count({ where: { orgId: auth.orgId, status: "discharged", dischargedAt: { gte: dateFrom, lte: dateTo } } })
        return ok({ type: "admissions", period: { from: dateFrom, to: dateTo }, active, dischargedInPeriod: discharged })
      }
      case "queue": {
        const entries = await db.queueEntry.findMany({ where: { orgId: auth.orgId, queuedAt: { gte: dateFrom, lte: dateTo } }, select: { visitStatus: true, queuedAt: true, calledAt: true, completedAt: true, emergencyFlag: true } })
        const total = entries.length
        const completed = entries.filter(e => e.visitStatus === "closed").length
        const emergencies = entries.filter(e => e.emergencyFlag).length
        return ok({ type: "queue", period: { from: dateFrom, to: dateTo }, total, completed, emergencies, completionRate: total ? Math.round((completed / total) * 100) : 0 })
      }
      case "audit": {
        const logs = await db.auditLog.findMany({ where: { orgId: auth.orgId, timestamp: { gte: dateFrom, lte: dateTo } }, orderBy: { timestamp: "desc" }, take: 500 })
        return ok({ type: "audit", period: { from: dateFrom, to: dateTo }, count: logs.length, logs })
      }
      default:
        return fail("Unknown report type")
    }
  } catch {
    return fail("An error occurred", 500)
  }
}
