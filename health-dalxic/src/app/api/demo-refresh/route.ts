import { db } from "@/lib/db";

/**
 * Demo Data Refresh — resets patient_records.createdAt to today
 * so demo data always appears in the daily queue view.
 *
 * Called by Vercel Cron daily at 00:05 UTC.
 * Only affects hospitals with demo data (no real patient harm).
 * Does NOT delete or modify any clinical data — only timestamps.
 */
export async function GET() {
  try {
    // Update all patient records' createdAt to now so they appear in today's queue
    const result = await db.$executeRawUnsafe(
      `UPDATE patient_records SET created_at = NOW()`
    );

    return Response.json({
      ok: true,
      refreshed: result,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
