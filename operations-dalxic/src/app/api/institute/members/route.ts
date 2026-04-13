import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

/**
 * Institute Members — students, trainees, participants.
 *
 * GET:   List/search members
 * POST:  Enroll a new member
 * PATCH: Update member details
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
  const offset = parseInt(searchParams.get("offset") || "0");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { orgId: auth.orgId };
  if (groupId) where.groupId = groupId;
  if (status) where.status = status;
  if (search) where.name = { contains: search, mode: "insensitive" };

  const [members, total] = await Promise.all([
    db.member.findMany({
      where,
      orderBy: { name: "asc" },
      include: { group: { select: { name: true } } },
      take: limit,
      skip: offset,
    }),
    db.member.count({ where }),
  ]);

  return Response.json({ members, total, limit, offset });
}

export async function POST(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { name, role, groupId, phone, email, dateOfBirth, gender, guardianName, guardianPhone, meta } = body;

    if (!name?.trim()) {
      return Response.json({ error: "name required" }, { status: 400 });
    }

    // Validate group if provided
    if (groupId) {
      const group = await db.group.findUnique({ where: { id: groupId } });
      if (!group || group.orgId !== auth.orgId) {
        return Response.json({ error: "Group not found" }, { status: 404 });
      }
    }

    const member = await db.member.create({
      data: {
        orgId: auth.orgId,
        name: name.trim(),
        role: role || "student",
        groupId: groupId || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        guardianName: guardianName?.trim() || null,
        guardianPhone: guardianPhone?.trim() || null,
        meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
      },
    });

    await logAudit({
      actorType: "operator",
      actorId: auth.operatorId,
      orgId: auth.orgId,
      action: "member.enrolled",
      metadata: { memberId: member.id, name: member.name, groupId },
      ipAddress: getClientIP(request),
    });

    return Response.json(member, { status: 201 });
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
    const { id, name, role, status, groupId, phone, email, dateOfBirth, gender, guardianName, guardianPhone, meta } = body;

    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (name?.trim()) updates.name = name.trim();
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (groupId !== undefined) updates.groupId = groupId || null;
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (email !== undefined) updates.email = email?.trim() || null;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth || null;
    if (gender !== undefined) updates.gender = gender || null;
    if (guardianName !== undefined) updates.guardianName = guardianName?.trim() || null;
    if (guardianPhone !== undefined) updates.guardianPhone = guardianPhone?.trim() || null;
    if (meta !== undefined) updates.meta = meta ? JSON.parse(JSON.stringify(meta)) : null;

    const updated = await db.member.update({ where: { id }, data: updates });
    return Response.json(updated);
  } catch (err: unknown) {
    console.error("API error:", err);
    return Response.json({ error: "An error occurred" }, { status: 500 });
  }
}
