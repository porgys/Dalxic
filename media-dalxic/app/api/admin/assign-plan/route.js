import { NextResponse } from "next/server"
import { getAdminDb, requireAdmin } from "@/lib/firebaseAdmin"
import { PLANS } from "@/lib/planLimits"
import rateLimit from "@/lib/rateLimit"

const limiter = rateLimit({ interval: 60_000, limit: 10 })

/**
 * POST /api/admin/assign-plan
 * Authorization: Bearer <firebase-id-token>
 * Body: { targetUid, planKey }
 *
 * Assigns a plan to a user. Admin role verified via Firebase token — not client UID.
 */
export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
    const { success } = limiter.check(ip)
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    const admin = await requireAdmin(req)
    if (!admin) return NextResponse.json({ error: "Unauthorized — admin role required" }, { status: 403 })

    const { targetUid, planKey } = await req.json()

    if (!targetUid || !planKey) {
      return NextResponse.json({ error: "targetUid and planKey are required" }, { status: 400 })
    }

    if (!PLANS[planKey]) {
      return NextResponse.json({ error: `Unknown plan: ${planKey}` }, { status: 400 })
    }

    const db = getAdminDb()
    const plan = PLANS[planKey]
    const now = new Date().toISOString()

    const userRef = db.collection("users").doc(targetUid).collection("profile").doc("account")
    await userRef.set({
      plan: planKey,
      planName: plan.name,
      planCategory: plan.category || null,
      planTier: plan.tier || null,
      planAssignedBy: admin.uid,
      planAssignedAt: now,
      scansPerMonth: plan.scansPerMonth === Infinity ? -1 : plan.scansPerMonth,
      modules: plan.modules || [],
      features: plan.features || [],
      support: plan.support || "community",
    }, { merge: true })

    // Audit log — uses verified admin UID, not client-supplied
    await db.collection("audit").add({
      action: "plan_assigned",
      adminUid: admin.uid,
      adminEmail: admin.email || "unknown",
      targetUid,
      planKey,
      planName: plan.name,
      timestamp: now,
      ip,
    })

    return NextResponse.json({
      success: true,
      targetUid,
      plan: planKey,
      planName: plan.name,
      assignedAt: now,
    })
  } catch (e) {
    console.error("Admin assign-plan error:", e.message)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

/**
 * GET /api/admin/assign-plan
 * Authorization: Bearer <firebase-id-token>
 * Returns all available plan keys for the admin UI dropdown.
 */
export async function GET(req) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const planList = Object.entries(PLANS)
    .filter(([key]) => !["free", "sentinel", "guardian", "vanguard", "citadel", "sovereign"].includes(key))
    .map(([key, p]) => ({
      key,
      name: p.name,
      category: p.category || "legacy",
      tier: p.tier || "legacy",
      scansPerMonth: p.scansPerMonth === Infinity ? "Unlimited" : p.scansPerMonth,
    }))

  return NextResponse.json({ plans: planList })
}
