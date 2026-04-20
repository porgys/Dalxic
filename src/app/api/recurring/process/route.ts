import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin"])
  if (denied) return denied

  try {
    const due = await db.recurringCharge.findMany({
      where: { orgId: auth.orgId, status: "active", autoCharge: true, nextDueDate: { lte: new Date() } },
    })

    const recentlyProcessed = due.filter(c => c.lastChargedAt && Date.now() - new Date(c.lastChargedAt).getTime() < 60_000)
    if (recentlyProcessed.length === due.length && due.length > 0) {
      return ok({ processed: 0, ids: [], message: "Already processed recently" })
    }

    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    const actorName = operator?.name ?? auth.role

    const processed: string[] = []
    for (const charge of due) {
      if (charge.lastChargedAt && Date.now() - new Date(charge.lastChargedAt).getTime() < 60_000) continue
      const nextDate = new Date(charge.nextDueDate)
      switch (charge.interval) {
        case "daily": nextDate.setDate(nextDate.getDate() + 1); break
        case "weekly": nextDate.setDate(nextDate.getDate() + 7); break
        case "monthly": nextDate.setMonth(nextDate.getMonth() + 1); break
        case "termly": nextDate.setMonth(nextDate.getMonth() + 4); break
        case "yearly": nextDate.setFullYear(nextDate.getFullYear() + 1); break
      }
      await db.recurringCharge.update({
        where: { id: charge.id },
        data: { chargeCount: { increment: 1 }, lastChargedAt: new Date(), nextDueDate: nextDate },
      })
      await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName, action: "recurring_charge_processed", entity: "recurring_charge", entityId: charge.id, before: { nextDueDate: charge.nextDueDate, chargeCount: charge.chargeCount }, after: { nextDueDate: nextDate, chargeCount: charge.chargeCount + 1 } })
      processed.push(charge.id)
    }

    return ok({ processed: processed.length, ids: processed })
  } catch {
    return fail("An error occurred", 500)
  }
}
