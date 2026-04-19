import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const low = url.searchParams.get("low") === "true"

    const items = await db.serviceItem.findMany({
      where: {
        orgId: auth.orgId,
        isActive: true,
        stockType: "physical",
        ...(low ? { stock: { lte: db.serviceItem.fields?.minStock as any } } : {}),
      },
      select: { id: true, name: true, sku: true, stock: true, minStock: true, maxStock: true, unit: true, batchNo: true, expiresAt: true },
      orderBy: { stock: "asc" },
    })

    if (low) {
      const filtered = items.filter(i => i.stock <= i.minStock)
      return ok(filtered)
    }
    return ok(items)
  } catch {
    return fail("An error occurred", 500)
  }
}
