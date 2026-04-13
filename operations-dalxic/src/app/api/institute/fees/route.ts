import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

/**
 * Institute Fee Records — create and list fee records.
 *
 * GET:   List fee records for an org (by member, status)
 * POST:  Create a new fee record
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
  const offset = parseInt(searchParams.get("offset") || "0");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { orgId: auth.orgId };
  if (memberId) where.memberId = memberId;
  if (status) where.status = status;

  const [records, total] = await Promise.all([
    db.feeRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        member: { select: { name: true, groupId: true } },
        payments: { orderBy: { receivedAt: "desc" } },
      },
      take: limit,
      skip: offset,
    }),
    db.feeRecord.count({ where }),
  ]);

  return Response.json({ records, total, limit, offset });
}

export async function POST(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { memberId, description, amount, dueDate } = body;

    if (!memberId || !description?.trim() || !amount) {
      return Response.json({ error: "memberId, description, and amount required" }, { status: 400 });
    }

    const member = await db.member.findUnique({ where: { id: memberId } });
    if (!member || member.orgId !== auth.orgId) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    const record = await db.feeRecord.create({
      data: {
        orgId: auth.orgId,
        memberId,
        description: description.trim(),
        amount,
        balance: amount,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    await logAudit({
      actorType: "operator",
      actorId: auth.operatorId,
      orgId: auth.orgId,
      action: "fee.created",
      metadata: { feeRecordId: record.id, memberId, amount, description },
      ipAddress: getClientIP(request),
    });

    return Response.json(record, { status: 201 });
  } catch (err: unknown) {
    console.error("API error:", err);
    return Response.json({ error: "An error occurred" }, { status: 500 });
  }
}
