import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { getPlanLimit, currentMonthKey } from "@/lib/planLimits"
import rateLimit from "@/lib/rateLimit"

const limiter = rateLimit({ interval: 60_000, limit: 30 }) // 30 usage checks per minute per IP

// POST /api/usage  { uid, action: "check" | "increment" }
export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown"
    const { success } = limiter.check(ip)
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    const { uid, action } = await req.json()
    if (!uid) return NextResponse.json({ error: "uid required" }, { status: 400 })

    const db       = getAdminDb()
    const userRef  = db.collection("users").doc(uid).collection("profile").doc("account")
    const snap     = await userRef.get()
    const data     = snap.exists ? snap.data() : {}

    const plan     = getPlanLimit(data.plan)
    const monthKey = currentMonthKey()

    // Reset counter if we're in a new month
    const usedThisMonth = data.monthKey === monthKey ? (data.scansUsed ?? 0) : 0
    const limit         = plan.scansPerMonth

    if (action === "check") {
      return NextResponse.json({
        plan:      data.plan ?? "free",
        planName:  plan.name,
        used:      usedThisMonth,
        limit:     limit === Infinity ? null : limit,
        remaining: limit === Infinity ? null : Math.max(0, limit - usedThisMonth),
        allowed:   limit === Infinity || usedThisMonth < limit,
      })
    }

    if (action === "increment") {
      if (limit !== Infinity && usedThisMonth >= limit) {
        return NextResponse.json({
          allowed:  false,
          used:     usedThisMonth,
          limit,
          plan:     data.plan ?? "free",
          planName: plan.name,
        })
      }
      await userRef.set({
        plan:       data.plan ?? "free",
        scansUsed:  usedThisMonth + 1,
        monthKey,
        lastScanAt: new Date().toISOString(),
      }, { merge: true })

      return NextResponse.json({
        allowed:   true,
        used:      usedThisMonth + 1,
        limit:     limit === Infinity ? null : limit,
        remaining: limit === Infinity ? null : Math.max(0, limit - usedThisMonth - 1),
        plan:      data.plan ?? "free",
        planName:  plan.name,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch(e) {
    console.error("Usage route error:", e.message)
    // Fail open — don't block scans if usage check itself errors
    console.error("Usage route error:", e.message)
    return NextResponse.json({ allowed: true, error: "Usage check failed" })
  }
}
