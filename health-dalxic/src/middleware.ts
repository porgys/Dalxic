import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Blocked paths — real workstation directories that must only be accessed
 * via obfuscated /w/ rewrites, never directly.
 */
const BLOCKED_PATHS = [
  "/front-desk", "/waiting-room", "/doctor", "/pharmacy", "/billing",
  "/lab", "/injection-room", "/nurse-station", "/radiology", "/ward",
  "/ultrasound", "/emergency-triage", "/icu", "/maternity", "/blood-bank",
  "/admin", "/beds", "/platform", "/ops",
  "/bookkeeping",
  "/emergency-override", "/print/ticket",
]

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

/** Check if user-agent matches a known bot */
function isBot(ua: string | null): boolean {
  if (!ua) return true // No user-agent = suspicious
  return BOT_PATTERNS.some(p => p.test(ua))
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
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://api.anthropic.com https://va.vercel-scripts.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "))
  return response
}

const PLATFORM_ROUTE = "/w/rJ1~tN5kZm8Q-bA4xW7nDs2vFh"
const APEX_HOSTS = new Set(["health.dalxic.com", "www.health.dalxic.com", "localhost", "localhost:3000"])

function isHospitalSubdomain(host: string): boolean {
  const h = host.toLowerCase()
  if (APEX_HOSTS.has(h)) return false
  if (h.endsWith(".vercel.app")) return false
  if (/^\d+\.\d+\.\d+\.\d+(:\d+)?$/.test(h)) return false
  return h.endsWith(".health.dalxic.com")
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ua = request.headers.get("user-agent")
  const host = request.headers.get("host") || ""

  // ── Hospital subdomain: root path loads workstations launchpad, not marketing page ──
  // Exception: ?boot=1 lets the kiosk boot screen iframe render the marketing landing.
  if (pathname === "/" && isHospitalSubdomain(host) && request.nextUrl.searchParams.get("boot") !== "1") {
    const url = request.nextUrl.clone()
    url.pathname = PLATFORM_ROUTE
    return NextResponse.redirect(url)
  }

  // ── Bot wall: block bots from API routes (protects Anthropic billing) ──
  if (pathname.startsWith("/api/")) {
    if (isBot(ua)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: { "X-Robots-Tag": "noindex, nofollow" } }
      )
    }
    // API routes get security headers but skip password gate
    // (API auth is handled per-route via rate limiting + cookie checks)
    return applySecurityHeaders(NextResponse.next())
  }

  // ── Block direct access to real workstation paths ──
  const isBlockedPath = BLOCKED_PATHS.some(p =>
    pathname === p || pathname.startsWith(p + "/")
  )
  const isRewrite = request.headers.get("x-middleware-rewrite")
  if (isBlockedPath && !isRewrite) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  // Now includes api/ routes for bot protection
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|preview|sw.js|workbox).*)"],
}
