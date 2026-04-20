import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"))
    const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50"))
    const entity = url.searchParams.get("entity")
    const action = url.searchParams.get("action")

    const where: Record<string, unknown> = { orgId: auth.orgId }
    if (entity) where.entity = entity
    if (action) where.action = action

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({ where, orderBy: { timestamp: "desc" }, skip: (page - 1) * limit, take: limit }),
      db.auditLog.count({ where }),
    ])
    return ok({ logs, total, page, limit })
  } catch {
    return fail("An error occurred", 500)
  }
}
