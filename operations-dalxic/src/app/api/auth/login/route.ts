import { db } from "@/lib/db"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"

export async function POST(request: Request) {
  const { orgCode, pin } = await request.json()
  if (!orgCode || !pin) return fail("orgCode and pin required")

  const org = await db.organization.findUnique({ where: { code: orgCode } })
  if (!org || !org.active) return fail("Organization not found", 404)

  const operator = await db.operator.findUnique({
    where: { orgId_pin: { orgId: org.id, pin } },
  })
  if (!operator || !operator.isActive) return fail("Invalid credentials", 401)

  await db.operator.update({ where: { id: operator.id }, data: { lastLoginAt: new Date() } })

  await logAudit({
    orgId: org.id,
    actorId: operator.id,
    actorName: operator.name,
    action: "login",
    entity: "operator",
    entityId: operator.id,
  })

  return ok({
    operator: { id: operator.id, name: operator.name, role: operator.role, permissions: operator.permissions },
    org: { id: org.id, code: org.code, name: org.name, type: org.type, tier: org.tier, paymentGate: org.paymentGate, activeBehaviours: org.activeBehaviours, activeModules: org.activeModules, labelConfig: org.labelConfig, taxConfig: org.taxConfig, currency: org.currency },
  })
}
