import { NextResponse } from "next/server"

const SITE_PASSWORD = process.env.SITE_PASSWORD || "dalxic2026"

export async function POST(request) {
  const { password } = await request.json()

  if (password === SITE_PASSWORD) {
    const res = NextResponse.json({ success: true })
    res.cookies.set("dalxic_access", "granted", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      domain: ".dalxic.com",
    })
    return res
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 })
}
