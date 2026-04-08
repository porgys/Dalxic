import { NextResponse } from "next/server"
import rateLimit from "@/lib/rateLimit"

const limiter = rateLimit({ interval: 60_000, limit: 15 }) // 15 fetches per minute per IP

// Block SSRF — internal/private IPs
const BLOCKED_HOSTS = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.0\.0\.0|::1|\[::1\]|169\.254\.|fc00:|fd00:)/i

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown"
    const { success } = limiter.check(ip)
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    const { url } = await request.json()
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    // Block dangerous schemes
    if (/^(javascript|data|vbscript|file):/i.test(url.trim())) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    // Block SSRF — prevent requests to internal networks
    try {
      const parsed = new URL(url.trim())
      if (BLOCKED_HOSTS.test(parsed.hostname)) {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    const res = await fetch(url.trim(), {
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DalxicMind/4.2; forensic-crawler)",
        "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9",
      }
    })

    const contentType = res.headers.get("content-type") || ""

    if (contentType.includes("text/plain")) {
      const text = await res.text()
      return NextResponse.json({ content: text.slice(0, 12000), url })
    }

    // HTML — strip tags and extract readable text
    const html = await res.text()
    const clean = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 12000)

    return NextResponse.json({
      content: "Source URL: " + url + "\n\n" + clean,
      url
    })

  } catch(e) {
    return NextResponse.json({
      content: null,
      error: "Failed to fetch URL"
    }, { status: 200 }) // 200 so the scan page handles it gracefully
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
