import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { logAudit } from "@/lib/api/audit"
import { hashPin } from "@/lib/api/hash"
import { validate, createOperatorSchema } from "@/lib/api/schemas"
import { SAFE_OPERATOR_SELECT } from "@/lib/api/sanitize"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth

  try {
    const operators = await db.operator.findMany({
      where: { orgId: auth.orgId },
      select: SAFE_OPERATOR_SELECT,
      orderBy: { createdAt: "desc" },
    })
    return ok(operators)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin"])
  if (denied) return denied

  try {
    const data = validate(createOperatorSchema, await request.json())
    if (data instanceof Response) return data

    const hashedPin = await hashPin(data.pin)

    const op = await db.operator.create({
      data: {
        orgId: auth.orgId,
        name: data.name,
        phone: data.phone ?? null,
        pin: hashedPin,
        role: data.role,
        permissions: data.permissions ?? [],
      },
      select: SAFE_OPERATOR_SELECT,
    })

    await logAudit({
      orgId: auth.orgId,
      actorId: auth.operatorId,
      actorName: auth.role,
      action: "create_operator",
      entity: "operator",
      entityId: op.id,
      after: { name: op.name, role: op.role },
    })

    return ok(op)
  } catch {
    return fail("An error occurred", 500)
  }
}
