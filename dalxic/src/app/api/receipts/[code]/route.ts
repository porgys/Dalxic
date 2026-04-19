import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const { code } = await params
    const receipt = await db.receipt.findUnique({ where: { code }, include: { payment: true } })
    if (!receipt || receipt.orgId !== auth.orgId) return fail("Not found", 404)
    return ok(receipt)
  } catch {
    return fail("An error occurred", 500)
  }
}
