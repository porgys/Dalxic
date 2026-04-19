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

    const [receipts, total] = await Promise.all([
      db.receipt.findMany({ where: { orgId: auth.orgId }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      db.receipt.count({ where: { orgId: auth.orgId } }),
    ])
    return ok({ receipts, total, page, limit })
  } catch {
    return fail("An error occurred", 500)
  }
}
