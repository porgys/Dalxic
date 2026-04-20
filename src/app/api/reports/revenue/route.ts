import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const receipts = await db.receipt.findMany({ where: { orgId: auth.orgId }, select: { grandTotal: true, createdAt: true } })
    const totalRevenue = receipts.reduce((s, r) => s + r.grandTotal, 0)
    const returns = await db.return.findMany({ where: { orgId: auth.orgId }, select: { refundAmount: true } })
    const totalReturns = returns.reduce((s, r) => s + r.refundAmount, 0)

    return ok({ totalRevenue, totalReturns, netRevenue: totalRevenue - totalReturns, transactionCount: receipts.length })
  } catch {
    return fail("An error occurred", 500)
  }
}
