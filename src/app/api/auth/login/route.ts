import { db } from "@/lib/db"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"
import { verifyPin } from "@/lib/api/hash"
import { rateLimit, AUTH_RATE_LIMIT, checkPinLockout, recordPinFailure, clearPinFailures } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT)
  if (blocked) return blocked

  const start = Date.now()

  try {
    const body = await request.json()
    const orgCode = typeof body.orgCode === "string" ? body.orgCode.trim() : ""
    const pin = typeof body.pin === "string" ? body.pin : ""

    if (!orgCode || !pin || pin.length < 4 || pin.length > 8) {
      await normalizeResponseTime(start)
      return fail("Invalid credentials", 401)
    }

    const lockout = checkPinLockout(orgCode)
    if (lockout) return lockout

    const org = await db.organization.findUnique({ where: { code: orgCode } })
    if (!org || !org.active) {
      recordPinFailure(orgCode)
      await normalizeResponseTime(start)
      return fail("Invalid credentials", 401)
    }

    const operators = await db.operator.findMany({
      where: { orgId: org.id, isActive: true },
      select: { id: true, name: true, pin: true, role: true, permissions: true },
    })

    let matched: typeof operators[0] | null = null
    for (const op of operators) {
      if (await verifyPin(pin, op.pin)) {
        matched = op
        break
      }
    }

    if (!matched) {
      recordPinFailure(orgCode)
      await normalizeResponseTime(start)
      return fail("Invalid credentials", 401)
    }

    clearPinFailures(orgCode)

    await db.operator.update({ where: { id: matched.id }, data: { lastLoginAt: new Date() } })

    await logAudit({
      orgId: org.id,
      actorId: matched.id,
      actorName: matched.name,
      action: "login",
      entity: "operator",
      entityId: matched.id,
    })

    await normalizeResponseTime(start)

    return ok({
      operator: { id: matched.id, name: matched.name, role: matched.role, permissions: matched.permissions },
      org: {
        id: org.id, code: org.code, name: org.name, type: org.type, tier: org.tier,
        paymentGate: org.paymentGate, activeBehaviours: org.activeBehaviours,
        activeModules: org.activeModules, labelConfig: org.labelConfig,
        currency: org.currency,
      },
    })
  } catch {
    await normalizeResponseTime(start)
    return fail("Invalid credentials", 401)
  }
}

async function normalizeResponseTime(start: number) {
  const elapsed = Date.now() - start
  const target = 200 + Math.random() * 100
  if (elapsed < target) {
    await new Promise(r => setTimeout(r, target - elapsed))
  }
}
