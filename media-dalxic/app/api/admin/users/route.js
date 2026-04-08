import { NextResponse } from "next/server"
import { getAdminDb, requireAdmin } from "@/lib/firebaseAdmin"
import rateLimit from "@/lib/rateLimit"

const limiter = rateLimit({ interval: 60_000, limit: 10 })

/**
 * GET /api/admin/users
 * Authorization: Bearer <firebase-id-token>
 * Returns all users with their plan info, scan usage, and profile data.
 */
export async function GET(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
    const { success } = limiter.check(ip)
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

    // Verify Firebase token + admin role (server-side — no client-supplied UID)
    const admin = await requireAdmin(req)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const db = getAdminDb()
    const usersSnap = await db.collection("users").listDocuments()
    const users = []

    for (const userDoc of usersSnap) {
      const uid = userDoc.id
      const accountSnap = await db.collection("users").doc(uid).collection("profile").doc("account").get()
      const accountData = accountSnap.exists ? accountSnap.data() : {}

      users.push({
        uid,
        plan: accountData.plan || "free",
        planName: accountData.planName || "Free",
        planCategory: accountData.planCategory || null,
        planTier: accountData.planTier || null,
        scansUsed: accountData.scansUsed || 0,
        scansPerMonth: accountData.scansPerMonth || 5,
        monthKey: accountData.monthKey || null,
        lastScanAt: accountData.lastScanAt || null,
        planAssignedBy: accountData.planAssignedBy || null,
        planAssignedAt: accountData.planAssignedAt || null,
        role: accountData.role || "user",
        email: accountData.email || null,
        displayName: accountData.displayName || null,
        modules: accountData.modules || [],
        features: accountData.features || [],
        support: accountData.support || "community",
      })
    }

    users.sort((a, b) => {
      if (a.role === "admin" && b.role !== "admin") return -1
      if (a.role !== "admin" && b.role === "admin") return 1
      return (b.planAssignedAt || "").localeCompare(a.planAssignedAt || "")
    })

    return NextResponse.json({ users, total: users.length })
  } catch (e) {
    console.error("Admin users error:", e.message)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
