import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Known bot user-agents — block scrapers, crawlers, and AI training bots
 * from hitting API routes.
 */
const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
  /python-requests/i, /httpie/i, /postman/i, /insomnia/i,
  /gptbot/i, /chatgpt/i, /ccbot/i, /anthropic-ai/i, /claude-web/i, /claude/i,
  /bytespider/i, /semrush/i, /ahrefs/i, /mj12bot/i, /dotbot/i,
  /petalbot/i, /yandex/i, /baiduspider/i, /sogou/i,
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
  /applebot/i, /duckduckbot/i, /ia_archiver/i, /archive\.org/i,
  /phantomjs/i, /headlesschrome/i, /selenium/i, /puppeteer/i,
]

/** Check if user-agent matches a known bot */
function isBot(ua: string | null): boolean {
  if (!ua) return true // No user-agent = suspicious
  return BOT_PATTERNS.some(p => p.test(ua))
}

/** CORS origin — restrict in production */
function getAllowedOrigin(): string {
  return process.env.ALLOWED_ORIGIN || "*"
}

/** Security headers applied to every response */
function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()")
  response.headers.set("Content-Security-Policy", [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://va.vercel-scripts.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "))
  // Remove X-Powered-By
  response.headers.delete("X-Powered-By")
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ua = request.headers.get("user-agent")

  // ── Block source map requests ──
  if (pathname.endsWith(".map")) {
    return new NextResponse(null, { status: 404 })
  }

  // ── API routes ──
  if (pathname.startsWith("/api/")) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      const preflightResponse = new NextResponse(null, { status: 204 })
      preflightResponse.headers.set("Access-Control-Allow-Origin", getAllowedOrigin())
      preflightResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
      preflightResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, x-operator-id, x-org-code")
      preflightResponse.headers.set("Access-Control-Max-Age", "86400")
      return preflightResponse
    }

    // Bot wall
    if (isBot(ua)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: { "X-Robots-Tag": "noindex, nofollow" } }
      )
    }

    const response = applySecurityHeaders(NextResponse.next())
    // CORS headers on API responses
    response.headers.set("Access-Control-Allow-Origin", getAllowedOrigin())
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, x-operator-id, x-org-code")
    // Prevent indexing of API responses
    response.headers.set("X-Robots-Tag", "noindex, nofollow")
    return response
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|sw.js|workbox).*)"],
}
