import { NextResponse } from "next/server"

const SITE_PASSWORD = process.env.SITE_PASSWORD || "dalxic2026"

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Allow: password page, API verify endpoint, static assets
  if (pathname === "/gate" || pathname === "/api/verify" || pathname.startsWith("/_next/") || pathname.startsWith("/favicon")) {
    return NextResponse.next()
  }

  // Check auth cookie
  const auth = request.cookies.get("dalxic_access")?.value
  if (auth === "granted") return NextResponse.next()

  // Redirect to gate
  const url = request.nextUrl.clone()
  url.pathname = "/gate"
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
