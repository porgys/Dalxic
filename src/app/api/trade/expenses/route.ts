import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createExpenseSchema } from "@/lib/api/schemas"
import { logAudit } from "@/lib/api/audit"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const expenses = await db.expense.findMany({ where: { orgId: auth.orgId }, orderBy: { date: "desc" }, take: 100 })
    return ok(expenses)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin", "manager", "accountant"])
  if (denied) return denied
  try {
    const data = validate(createExpenseSchema, await request.json())
    if (data instanceof Response) return data
    const expense = await db.expense.create({
      data: { orgId: auth.orgId, branchId: data.branchId, category: data.category, vendor: data.vendor, description: data.description, amount: data.amount, taxAmount: data.taxAmount ?? 0, paymentMethod: data.paymentMethod, reference: data.reference, date: new Date(data.date) },
    })
    const operator = await db.operator.findUnique({ where: { id: auth.operatorId } })
    await logAudit({ orgId: auth.orgId, actorId: auth.operatorId, actorName: operator?.name ?? auth.role, action: "create_expense", entity: "expense", entityId: expense.id, after: { category: data.category, vendor: data.vendor, amount: data.amount, paymentMethod: data.paymentMethod } })
    return ok(expense)
  } catch {
    return fail("An error occurred", 500)
  }
}
