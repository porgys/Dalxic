import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { calculatePayroll } from "@/lib/api/tax"
import { validate, createPayRunSchema } from "@/lib/api/schemas"
import { rateLimit, STRICT_RATE_LIMIT } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const runs = await db.payRun.findMany({ where: { orgId: auth.orgId }, include: { slips: true }, orderBy: { createdAt: "desc" } })
    return ok(runs)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const blocked = rateLimit(request, STRICT_RATE_LIMIT)
  if (blocked) return blocked
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin", "accountant"])
  if (denied) return denied
  try {
    const data = validate(createPayRunSchema, await request.json())
    if (data instanceof Response) return data

    const employees = await db.employee.findMany({ where: { orgId: auth.orgId, status: "active" } })

    let totalGross = 0, totalDeductions = 0, totalNet = 0
    const slipData = employees.map(emp => {
      const breakdown = calculatePayroll(emp.baseSalary, 0, emp.ssnitTier as "T1" | "T2")
      totalGross += breakdown.grossPay
      totalDeductions += breakdown.ssnitEmployee + breakdown.paye
      totalNet += breakdown.netPay
      return {
        employeeId: emp.id,
        baseSalary: emp.baseSalary,
        grossPay: breakdown.grossPay,
        ssnitEmployee: breakdown.ssnitEmployee,
        ssnitEmployer: breakdown.ssnitEmployer,
        paye: breakdown.paye,
        netPay: breakdown.netPay,
      }
    })

    const run = await db.payRun.create({
      data: {
        orgId: auth.orgId, period: data.period, totalGross, totalDeductions, totalNet,
        employeeCount: employees.length, processedBy: auth.operatorId,
        slips: { create: slipData },
      },
      include: { slips: true },
    })
    return ok(run)
  } catch {
    return fail("An error occurred", 500)
  }
}
