import { logHoneypotHit, honeypotDelay } from "@/lib/api/honeypot"

export async function GET(request: Request) {
  await logHoneypotHit(request, "/api/wp-admin")
  await honeypotDelay()
  return new Response("<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>Not Found</h1></body></html>", { status: 404, headers: { "Content-Type": "text/html" } })
}
