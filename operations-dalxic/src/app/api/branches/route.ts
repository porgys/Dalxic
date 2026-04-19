import { db } from "@/lib/db"
import { authenticateRequest, requireRole } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const branches = await db.branch.findMany({ where: { orgId: auth.orgId }, orderBy: { createdAt: "desc" } })
  return ok(branches)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const denied = requireRole(auth, ["owner", "admin"])
  if (denied) return denied
  const body = await request.json()
  const branch = await db.branch.create({ data: { orgId: auth.orgId, name: body.name, address: body.address, phone: body.phone, isDefault: body.isDefault ?? false } })
  return ok(branch)
}
