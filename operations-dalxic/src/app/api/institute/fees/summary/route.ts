import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Fee Summary — org-wide fee dashboard.
 *
 * GET: Aggregate fee stats (total billed, collected, outstanding, by status)
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const orgCode = searchParams.get("orgCode");
  const groupId = searchParams.get("groupId");

  if (!orgCode) return Response.json({ error: "orgCode required" }, { status: 400 });

  const org = await db.organization.findUnique({ where: { code: orgCode } });
  if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

  // Build where clause — optionally filter by group via member
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { orgId: org.id };
  if (groupId) {
    where.member = { groupId };
  }

  const records = await db.feeRecord.findMany({
    where,
    select: { amount: true, paid: true, balance: true, status: true },
  });

  const totalBilled = records.reduce((sum, r) => sum + r.amount, 0);
  const totalCollected = records.reduce((sum, r) => sum + r.paid, 0);
  const totalOutstanding = records.reduce((sum, r) => sum + r.balance, 0);

  const byStatus = {
    UNPAID: 0,
    PARTIAL: 0,
    PAID: 0,
    OVERDUE: 0,
    WAIVED: 0,
  };
  for (const r of records) {
    if (r.status in byStatus) {
      byStatus[r.status as keyof typeof byStatus]++;
    }
  }

  // Collection rate
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 10000) / 100 : 0;

  return Response.json({
    totalRecords: records.length,
    totalBilled,
    totalCollected,
    totalOutstanding,
    collectionRate,
    byStatus,
  });
}
