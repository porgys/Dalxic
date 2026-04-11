import { db } from "@/lib/db";

// Lightweight ping to keep Neon compute warm — called by Vercel Cron every 4 minutes
export async function GET() {
  try {
    await db.$queryRawUnsafe("SELECT 1");
    return Response.json({ ok: true, ts: new Date().toISOString() });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
