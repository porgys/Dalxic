import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

// Lightweight ping to keep Neon compute warm — called by Vercel Cron every 5 minutes
export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, ts: new Date().toISOString() });
  } catch {
    console.error("Heartbeat failed");
    return Response.json({ ok: false, error: "An error occurred" }, { status: 500 });
  }
}
