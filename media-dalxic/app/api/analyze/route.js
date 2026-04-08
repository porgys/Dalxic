import { NextResponse } from "next/server"
import rateLimit from "@/lib/rateLimit"

const limiter = rateLimit({ interval: 60_000, limit: 10 }) // 10 scans per minute per IP

const ALLOWED_ORIGINS = [
  "https://dalxic.com",
  "https://www.dalxic.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
]

const MAX_BODY_SIZE = 10 * 1024 * 1024

const INJECTION_PATTERNS = [
  /ignore (all |previous |above )?instructions/i,
  /you are now (?!DalxicMind)/i,
  /forget (your |all |previous )?instructions/i,
  /reveal (your |the )?(system |hidden |secret )?prompt/i,
  /jailbreak/i,
  /do anything now/i,
]

function isValidOrigin(req) {
  const origin = req.headers.get("origin") || ""
  if (!origin) return true
  return ALLOWED_ORIGINS.some(o => origin.startsWith(o))
}

function sanitiseMessages(messages) {
  if (!Array.isArray(messages)) return []
  return messages.map(msg => {
    // Array content = multimodal (image + text blocks) — pass through safely
    if (Array.isArray(msg.content)) {
      return {
        ...msg,
        content: msg.content.map(block => {
          if (block.type === "text") {
            let text = block.text || ""
            text = text.replace(/<[^>]*>/g, "")
            text = text.replace(/(javascript|vbscript|data):/gi, "[blocked]:")
            if (text.length > 12000) text = text.slice(0, 12000)
            return { ...block, text }
          }
          // image blocks pass through untouched
          return block
        })
      }
    }
    // String content — existing sanitisation
    if (typeof msg.content !== "string") return msg
    let content = msg.content
    content = content.replace(/<[^>]*>/g, "")
    content = content.replace(/(javascript|vbscript|data):/gi, "[blocked]:")
    if (content.length > 12000) content = content.slice(0, 12000)
    return { ...msg, content }
  })
}

function hasPromptInjection(messages) {
  if (!Array.isArray(messages)) return false
  return messages.some(msg => {
    // Check text blocks in array content
    if (Array.isArray(msg.content)) {
      return msg.content.some(block =>
        block.type === "text" &&
        INJECTION_PATTERNS.some(p => p.test(block.text || ""))
      )
    }
    if (typeof msg.content !== "string") return false
    return INJECTION_PATTERNS.some(p => p.test(msg.content))
  })
}

export async function POST(request) {
  try {
    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown"
    const { success } = limiter.check(ip)
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const contentType = request.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    const contentLength = parseInt(request.headers.get("content-length") || "0")
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 })
    }

    const body = await request.json()

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 })
    }
    if (hasPromptInjection(body.messages)) {
      return NextResponse.json({ error: "Invalid request content" }, { status: 400 })
    }

    body.messages = sanitiseMessages(body.messages)
    body.model = "claude-sonnet-4-6"
    body.max_tokens = Math.min(body.max_tokens || 4000, 4096)
    body.temperature = 0
    body.system = "You are a JSON-only forensic analysis API. Your response MUST be a single raw JSON object with EXACTLY these 3 top-level keys and NO others:\n\n1. \"dimensions\" — an array of exactly 8 objects, each with keys \"dimension\" (string) and \"score\" (integer 0-100). Use the EXACT dimension names from the user's template.\n2. \"verdict\" — either \"AI_DETECTED\" or \"AUTHENTIC\"\n3. \"reasoning\" — a string of 3-4 sentences\n\nCRITICAL RULES:\n- Start your response with { and end with }\n- No markdown, no backticks, no prose outside the JSON\n- \"dimensions\" is a SCORING ARRAY — it has NOTHING to do with image pixel dimensions or image size metadata\n- Use the exact dimension names shown in the user's JSON template — do not rename them"

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errBody = await response.text().catch(() => "no body")
      console.error("Anthropic error:", response.status, errBody.slice(0, 500))
      return NextResponse.json({ error: "Analysis service unavailable" }, { status: 502 })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error("Route error:", error.message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
