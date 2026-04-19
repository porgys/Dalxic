import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const itemId = url.searchParams.get("itemId")
    const type = url.searchParams.get("type")
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"))
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50")))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { orgId: auth.orgId }
    if (itemId) where.serviceItemId = itemId
    if (type) where.type = type

    const [rows, total] = await Promise.all([
      db.stockMovement.findMany({
        where: where as any,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.stockMovement.count({ where: where as any }),
    ])

    return ok({ rows, total, page, limit })
  } catch {
    return fail("An error occurred", 500)
  }
}
