import { logAudit } from "./audit"

export async function logHoneypotHit(request: Request, endpoint: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown"

  const ua = request.headers.get("user-agent") ?? "unknown"

  await logAudit({
    orgId: "SYSTEM",
    actorId: ip,
    actorName: "honeypot",
    action: "honeypot_triggered",
    entity: "security",
    entityId: endpoint,
    after: {
      ip,
      userAgent: ua,
      method: request.method,
      url: request.url,
      referer: request.headers.get("referer"),
      timestamp: new Date().toISOString(),
    },
  })
}

export function honeypotDelay(): Promise<void> {
  const delay = 2000 + Math.random() * 3000
  return new Promise(r => setTimeout(r, delay))
}
