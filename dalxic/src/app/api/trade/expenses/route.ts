import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createExpenseSchema } from "@/lib/api/schemas"

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
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(createExpenseSchema, await request.json())
    if (data instanceof Response) return data
    const expense = await db.expense.create({
      data: { orgId: auth.orgId, branchId: data.branchId, category: data.category, vendor: data.vendor, description: data.description, amount: data.amount, taxAmount: data.taxAmount ?? 0, paymentMethod: data.paymentMethod, reference: data.reference, date: new Date(data.date) },
    })
    return ok(expense)
  } catch {
    return fail("An error occurred", 500)
  }
}
