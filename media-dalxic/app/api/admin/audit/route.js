import { NextResponse } from "next/server"
import { getAdminDb, requireAdmin } from "@/lib/firebaseAdmin"
import rateLimit from "@/lib/rateLimit"

const limiter = rateLimit({ interval: 60_000, limit: 10 })

/**
 * GET /api/admin/audit?limit=50
 * Authorization: Bearer <firebase-id-token>
 * Returns recent audit log entries.
 */
export async function GET(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
    const { success } = limiter.check(ip)
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    const admin = await requireAdmin(req)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)

    const db = getAdminDb()
    const snap = await db.collection("audit").orderBy("timestamp", "desc").limit(limit).get()
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    return NextResponse.json({ logs, total: logs.length })
  } catch (e) {
    console.error("Admin audit error:", e.message)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
