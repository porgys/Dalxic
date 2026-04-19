import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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

function isBot(ua: string | null): boolean {
  if (!ua) return true
  return BOT_PATTERNS.some(p => p.test(ua))
}

function getAllowedOrigin(): string {
  return process.env.ALLOWED_ORIGIN || "*"
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()")
  const isDev = process.env.NODE_ENV === "development"
  response.headers.set("Content-Security-Policy", [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://va.vercel-scripts.com",
    "upgrade-insecure-requests",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "))
  response.headers.set("Server", "nginx/1.24.0")
  response.headers.set("X-Powered-By", "PHP/8.2.12")
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ua = request.headers.get("user-agent")

  if (pathname.endsWith(".map")) {
    return new NextResponse(null, { status: 404 })
  }

  if (pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      const preflightResponse = new NextResponse(null, { status: 204 })
      preflightResponse.headers.set("Access-Control-Allow-Origin", getAllowedOrigin())
      preflightResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
      preflightResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, x-operator-id, x-org-code, x-master-sig")
      preflightResponse.headers.set("Access-Control-Max-Age", "86400")
      return preflightResponse
    }

    if (isBot(ua)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: { "X-Robots-Tag": "noindex, nofollow" } }
      )
    }

    const response = applySecurityHeaders(NextResponse.next())
    response.headers.set("Access-Control-Allow-Origin", getAllowedOrigin())
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, x-operator-id, x-org-code, x-master-sig")
    response.headers.set("X-Robots-Tag", "noindex, nofollow")
    return response
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|sw.js|workbox).*)"],
}
