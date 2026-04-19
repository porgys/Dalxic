import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok } from "@/lib/api/response"

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth

  const due = await db.recurringCharge.findMany({
    where: { orgId: auth.orgId, status: "active", autoCharge: true, nextDueDate: { lte: new Date() } },
  })

  const processed: string[] = []
  for (const charge of due) {
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
    processed.push(charge.id)
  }

  return ok({ processed: processed.length, ids: processed })
}
