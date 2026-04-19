import { authenticateRequest } from "@/lib/auth"
import { ok } from "@/lib/api/response"
import { tenderCart } from "@/lib/engine/sale"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const { id } = await params
  const result = await tenderCart(id)
  return ok(result)
}
