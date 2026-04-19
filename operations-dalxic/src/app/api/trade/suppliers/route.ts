import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const suppliers = await db.supplier.findMany({ where: { orgId: auth.orgId, isActive: true }, orderBy: { name: "asc" } })
  return ok(suppliers)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const supplier = await db.supplier.create({ data: { orgId: auth.orgId, ...body } })
  return ok(supplier)
}
