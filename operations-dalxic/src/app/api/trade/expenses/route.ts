import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const expenses = await db.expense.findMany({ where: { orgId: auth.orgId }, orderBy: { date: "desc" }, take: 100 })
  return ok(expenses)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const expense = await db.expense.create({
    data: { orgId: auth.orgId, branchId: body.branchId, category: body.category, vendor: body.vendor, description: body.description, amount: body.amount, taxAmount: body.taxAmount ?? 0, paymentMethod: body.paymentMethod, reference: body.reference, date: new Date(body.date) },
  })
  return ok(expense)
}
