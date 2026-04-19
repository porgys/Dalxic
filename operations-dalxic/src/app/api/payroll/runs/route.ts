import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { calculatePayroll } from "@/lib/api/tax"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const runs = await db.payRun.findMany({ where: { orgId: auth.orgId }, include: { slips: true }, orderBy: { createdAt: "desc" } })
  return ok(runs)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  if (!body.period) return fail("period required (YYYY-MM)")

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
      orgId: auth.orgId, period: body.period, totalGross, totalDeductions, totalNet,
      employeeCount: employees.length, processedBy: auth.operatorId,
      slips: { create: slipData },
    },
    include: { slips: true },
  })
  return ok(run)
}
