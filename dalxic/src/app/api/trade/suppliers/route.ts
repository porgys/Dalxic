import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, createSupplierSchema } from "@/lib/api/schemas"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const suppliers = await db.supplier.findMany({ where: { orgId: auth.orgId, isActive: true }, orderBy: { name: "asc" } })
    return ok(suppliers)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(createSupplierSchema, await request.json())
    if (data instanceof Response) return data
    const supplier = await db.supplier.create({ data: { orgId: auth.orgId, ...data } })
    return ok(supplier)
  } catch {
    return fail("An error occurred", 500)
  }
}
