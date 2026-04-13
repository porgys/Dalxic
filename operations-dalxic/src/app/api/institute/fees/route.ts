import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Institute Fee Records — create and list fee records.
 *
 * GET:   List fee records for an org (by member, status)
 * POST:  Create a new fee record
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const orgCode = searchParams.get("orgCode");
  const memberId = searchParams.get("memberId");
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!orgCode) return Response.json({ error: "orgCode required" }, { status: 400 });

  const org = await db.organization.findUnique({ where: { code: orgCode } });
  if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { orgId: org.id };
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

  try {
    const body = await request.json();
    const { orgCode, memberId, description, amount, dueDate } = body;

    if (!orgCode || !memberId || !description?.trim() || !amount) {
      return Response.json({ error: "orgCode, memberId, description, and amount required" }, { status: 400 });
    }

    const org = await db.organization.findUnique({ where: { code: orgCode } });
    if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

    const member = await db.member.findUnique({ where: { id: memberId } });
    if (!member || member.orgId !== org.id) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    const record = await db.feeRecord.create({
      data: {
        orgId: org.id,
        memberId,
        description: description.trim(),
        amount,
        balance: amount,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    await logAudit({
      actorType: "operator",
      actorId: body.operatorId || "system",
      orgId: org.id,
      action: "fee.created",
      metadata: { feeRecordId: record.id, memberId, amount, description },
      ipAddress: getClientIP(request),
    });

    return Response.json(record, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
