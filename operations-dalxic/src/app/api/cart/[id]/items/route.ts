import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { addItem } from "@/lib/engine/sale"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const { id } = await params
  const body = await request.json()
  if (!body.serviceItemId) return fail("serviceItemId required")
  const item = await addItem(id, body.serviceItemId, body.quantity ?? 1, body.discount ?? 0)
  return ok(item)
}
