import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const url = new URL(request.url)
  const type = url.searchParams.get("type")
  const where: Record<string, unknown> = { orgId: auth.orgId }
  if (type) where.type = type
  const messages = await db.messageLog.findMany({ where: where as any, orderBy: { sentAt: "desc" }, take: 100 })
  return ok(messages)
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const body = await request.json()
  const msg = await db.messageLog.create({
    data: { orgId: auth.orgId, type: body.type, recipientType: body.recipientType, recipientId: body.recipientId, recipientName: body.recipientName, recipientPhone: body.recipientPhone, title: body.title, body: body.body, sentBy: auth.operatorId, sentAt: new Date() },
  })
  return ok(msg)
}
