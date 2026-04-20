import { logHoneypotHit, honeypotDelay } from "@/lib/api/honeypot"

export async function GET(request: Request) {
  await logHoneypotHit(request, "/api/debug/config")
  await honeypotDelay()
  return Response.json({ error: "Debug mode disabled in production" }, { status: 403 })
}
