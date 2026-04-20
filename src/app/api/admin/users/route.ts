import { logHoneypotHit, honeypotDelay } from "@/lib/api/honeypot"

export async function GET(request: Request) {
  await logHoneypotHit(request, "/api/admin/users")
  await honeypotDelay()
  return Response.json({ error: "Insufficient privileges", code: "ADMIN_REQUIRED" }, { status: 403 })
}

export async function POST(request: Request) {
  await logHoneypotHit(request, "/api/admin/users")
  await honeypotDelay()
  return Response.json({ error: "Insufficient privileges", code: "ADMIN_REQUIRED" }, { status: 403 })
}
