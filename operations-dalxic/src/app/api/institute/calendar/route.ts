import { db } from "@/lib/db"
import { authenticateRequest } from "@/lib/auth"
import { ok } from "@/lib/api/response"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (auth instanceof Response) return auth
  const events = await db.messageLog.findMany({
    where: { orgId: auth.orgId, type: { in: ["notice", "circular"] } },
    orderBy: { sentAt: "desc" }, take: 50,
  })
  return ok(events)
}
