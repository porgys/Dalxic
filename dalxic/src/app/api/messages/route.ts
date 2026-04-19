import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok, fail } from "@/lib/api/response"
import { validate, sendMessageSchema } from "@/lib/api/schemas"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get("type")
    const where: Record<string, unknown> = { orgId: auth.orgId }
    if (type) where.type = type
    const messages = await db.messageLog.findMany({ where: where as any, orderBy: { sentAt: "desc" }, take: 100 })
    return ok(messages)
  } catch {
    return fail("An error occurred", 500)
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  try {
    const data = validate(sendMessageSchema, await request.json())
    if (data instanceof Response) return data
    const msg = await db.messageLog.create({
      data: { orgId: auth.orgId, type: data.type, recipientType: data.recipientType, recipientId: data.recipientId, recipientName: data.recipientName, recipientPhone: data.recipientPhone, title: data.title, body: data.body, sentBy: auth.operatorId, sentAt: new Date() },
    })
    return ok(msg)
  } catch {
    return fail("An error occurred", 500)
  }
}
