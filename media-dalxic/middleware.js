import { NextResponse } from "next/server"

/**
 * Known bot user-agents — block scrapers, crawlers, and AI training bots
 * from hitting API routes and racking up Anthropic bills.
 */
const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
  /python-requests/i, /httpie/i, /postman/i, /insomnia/i,
  /gptbot/i, /chatgpt/i, /ccbot/i, /anthropic-ai/i, /claude-web/i, /claude/i,
  /bytespider/i, /semrush/i, /ahrefs/i, /mj12bot/i, /dotbot/i,
  /petalbot/i, /yandex/i, /baiduspider/i, /sogou/i,
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
]

function isBot(ua) {
  if (!ua) return true
  return BOT_PATTERNS.some(p => p.test(ua))
}

function applySecurityHeaders(response) {
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()")
  response.headers.set("Content-Security-Policy", [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.googleusercontent.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.anthropic.com https://va.vercel-scripts.com wss://*.firebaseio.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "))
  return response
}

export function middleware(request) {
  const { pathname } = request.nextUrl
  const ua = request.headers.get("user-agent")

  // Bot wall: block bots from API routes
  if (pathname.startsWith("/api/")) {
    if (isBot(ua)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: { "X-Robots-Tag": "noindex, nofollow" } }
      )
    }
    return applySecurityHeaders(NextResponse.next())
  }

  // Password gate
  const auth = request.cookies.get("dalxic_access")?.value
  if (auth !== "granted") {
    return NextResponse.redirect("https://dalxic.com/gate")
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|preview).*)"],
}
