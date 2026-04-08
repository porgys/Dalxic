import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import rateLimit from "@/lib/rateLimit"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const limiter = rateLimit({ interval: 60_000, limit: 20 }) // 20 messages per minute per IP

const SYSTEM_BASE = `You are Nexus-7, the forensic intelligence engine powering Dalxic, built on proprietary architecture. Never mention Claude, Anthropic, Sonnet, or any third-party AI provider — you are Nexus-7.

You have deep expertise in:
- AI forensics: GAN detection, deepfake analysis, synthetic audio identification
- Forensic methodology: pixel coherence, metadata integrity, spectral analysis, temporal consistency
- ForensIQ™ report interpretation: confidence scores, dimension analysis, legal evidence standards
- Media authentication: images, video, audio, news and misinformation detection
- Dalxic's detection modules: ChromaVeil™, KineticScan™, SonicTrace™, NarrativeGuard™, DocForensIQ™, SentinelCore™

When scan results are provided below, reference specific scores, dimensions, and findings when answering. Be precise with numbers. Speak with forensic authority.

Handle typos and casual language naturally — NEVER correct the user's spelling, just understand their intent.

Keep responses concise (under 150 words) unless the user asks for detail ("explain in detail", "full breakdown", "more info"). Lead with the answer, then supporting evidence.

If asked about pricing, billing, plans, or upgrades, provide a brief helpful response and include CONTACT_REDIRECT at the very end.

FORENSIC DIMENSION REFERENCE:
- GAN Fingerprint: Detects generative adversarial network pixel patterns
- Pixel Coherence: Measures consistency of pixel relationships across regions
- Metadata Integrity: Checks EXIF, container, and file structure authenticity
- Edge Consistency: Analyses boundary sharpness and blending artefacts
- Noise Pattern: Evaluates sensor noise vs synthetic noise signatures
- Compression Artefact: Detects re-encoding, splicing, and generation traces
- Color Distribution: Examines histogram patterns for synthetic uniformity
- Semantic Logic: Checks physical plausibility (shadows, reflections, anatomy)`

function formatScanContext(scans) {
  if (!scans || scans.length === 0) return ""
  const entries = scans.map((s, i) => {
    const dims = (s.dimensions || []).map(d => `  ${d.dimension}: ${d.value}/100`).join("\n")
    return `SCAN ${i + 1}:
File: ${s.filename || "Unknown"}
Type: ${s.mediaType || "unknown"}
Verdict: ${s.verdict}
Confidence: ${s.confidence}%
Timestamp: ${s.timestamp || "N/A"}
Dimensions:
${dims}
Reasoning: ${s.reasoning || "N/A"}`
  }).join("\n\n")
  return `\n\nACTIVE SCAN RESULTS:\n${entries}`
}

export async function POST(req) {
  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown"
    const { success } = limiter.check(ip)
    if (!success) return NextResponse.json({ content: "Too many requests. Please slow down.", redirect: null }, { status: 429 })

    const { messages, scanContext, intent } = await req.json()

    // Build system prompt — only inject scan data for SCAN_QUERY intent
    let systemPrompt = SYSTEM_BASE
    if (intent === "SCAN_QUERY" && scanContext && scanContext.length > 0) {
      systemPrompt += formatScanContext(scanContext.slice(0, 5))
    }

    // Trim conversation to last 12 messages for token control
    const trimmedMessages = messages.slice(-12).map(m => ({
      role: m.role,
      content: m.content,
    }))

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: systemPrompt,
      messages: trimmedMessages,
    })

    const content = response.content[0].text
    const shouldRedirect = content.includes("CONTACT_REDIRECT")

    return NextResponse.json({
      content: content.replace("CONTACT_REDIRECT", "").trim(),
      redirect: shouldRedirect ? "contact" : null,
    })
  } catch (e) {
    console.error("Chat API error:", e.message)
    return NextResponse.json({
      content: "I'm experiencing a brief interruption. Please try again in a moment.",
      redirect: null,
    }, { status: 200 })
  }
}
