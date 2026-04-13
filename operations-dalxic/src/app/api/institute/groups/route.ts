import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

/**
 * Institute Groups — classes, cohorts, departments.
 *
 * GET:   List groups for an org
 * POST:  Create a new group
 * PATCH: Update / deactivate
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const includeInactive = searchParams.get("includeInactive") === "true";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { orgId: auth.orgId };
  if (!includeInactive) where.isActive = true;
  if (type) where.type = type;

  const groups = await db.group.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { members: true } } },
  });

  return Response.json(groups);
}

export async function POST(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { name, type } = body;

    if (!name?.trim()) {
      return Response.json({ error: "name required" }, { status: 400 });
    }

    const existing = await db.group.findUnique({
      where: { orgId_name: { orgId: auth.orgId, name: name.trim() } },
    });
    if (existing) {
      return Response.json({ error: "Group already exists" }, { status: 409 });
    }

    const group = await db.group.create({
      data: {
        orgId: auth.orgId,
        name: name.trim(),
        type: type || "class",
      },
    });

    await logAudit({
      actorType: "operator",
      actorId: auth.operatorId,
      orgId: auth.orgId,
      action: "group.created",
      metadata: { groupId: group.id, name: group.name, type: group.type },
      ipAddress: getClientIP(request),
    });

    return Response.json(group, { status: 201 });
  } catch (err: unknown) {
    console.error("API error:", err);
    return Response.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { id, name, type, isActive } = body;

    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (name?.trim()) updates.name = name.trim();
    if (type) updates.type = type;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await db.group.update({ where: { id }, data: updates });
    return Response.json(updated);
  } catch (err: unknown) {
    console.error("API error:", err);
    return Response.json({ error: "An error occurred" }, { status: 500 });
  }
}
