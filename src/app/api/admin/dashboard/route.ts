import { logHoneypotHit, honeypotDelay } from "@/lib/api/honeypot"

export async function GET(request: Request) {
  await logHoneypotHit(request, "/api/admin/dashboard")
  await honeypotDelay()
  return Response.json({ error: "Session expired. Please re-authenticate." }, { status: 401 })
}

export async function POST(request: Request) {
  await logHoneypotHit(request, "/api/admin/dashboard")
  await honeypotDelay()
  return Response.json({ error: "Session expired. Please re-authenticate." }, { status: 401 })
}
