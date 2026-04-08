import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import rateLimit from "@/lib/rateLimit"

const limiter = rateLimit({ interval: 300_000, limit: 3 }) // 3 emails per 5 minutes per IP

export async function POST(req) {
  try {
    // Rate limit
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown"
    const { success } = limiter.check(ip)
    if (!success) return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 })

    const { name, org, email, message } = await req.json()

    // Input validation
    if (!name || !email || !org) return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 })
    if (typeof name !== "string" || typeof email !== "string" || name.length > 200 || email.length > 200 || (message && message.length > 5000)) {
      return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 })
    }

    // Sanitize inputs — prevent HTML/script injection in email template
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    const safeName = esc(name)
    const safeOrg = esc(org)
    const safeEmail = esc(email)
    const safeMessage = esc(message || "No message provided.")

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    })

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#03050F;font-family:'Arial',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 32px;">
    <div style="background:linear-gradient(135deg,#6366F1,#6366F1);border-radius:12px 12px 0 0;padding:32px;text-align:center;">
      <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">DALXIC AI FORENSICS</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;letter-spacing:2px;text-transform:uppercase;">New Enterprise Enquiry</div>
    </div>
    <div style="background:#070B1A;border:1px solid #1A2240;border-top:none;border-radius:0 0 12px 12px;padding:32px;">
      <table style="width:100%;border-collapse:collapse;">
        ${[["Name", safeName], ["Organisation", safeOrg], ["Email", safeEmail]].map(([k,v]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1A2240;font-size:12px;color:#6878AA;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:120px;">${k}</td>
          <td style="padding:10px 0;border-bottom:1px solid #1A2240;font-size:14px;color:#F0F4FF;">${v}</td>
        </tr>`).join("")}
      </table>
      <div style="margin-top:24px;">
        <div style="font-size:12px;color:#6878AA;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Message</div>
        <div style="background:#0A1028;border:1px solid #1A2240;border-radius:8px;padding:16px;font-size:14px;color:#F0F4FF;line-height:1.7;">${safeMessage}</div>
      </div>
      <div style="margin-top:24px;padding:16px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:8px;font-size:12px;color:#6878AA;text-align:center;">
        Reply to: <a href="mailto:${safeEmail}" style="color:#818CF8;">${safeEmail}</a>
      </div>
    </div>
    <div style="text-align:center;margin-top:20px;font-size:11px;color:#3A4870;">
      © 2026 Dalxic Forensics · dalxic.com<br/>
      Nexus-7™ · ForensIQ™ · NexusLink™
    </div>
  </div>
</body>
</html>`

    await transport.sendMail({
      from: `"Dalxic Forensics" <${process.env.GMAIL_USER}>`,
      to: "dalxicforensics@gmail.com",
      replyTo: email,
      subject: `[Dalxic Enquiry] ${safeOrg} — ${safeName}`,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Contact email failed:", e.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
