import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

/**
 * Institute Schedule — timetable management.
 *
 * GET:    List schedule slots (by group, staff, day)
 * POST:   Create a schedule slot
 * PATCH:  Update a schedule slot
 * DELETE: Remove a schedule slot
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const staffId = searchParams.get("staffId");
  const dayOfWeek = searchParams.get("dayOfWeek");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { orgId: auth.orgId };
  if (groupId) where.groupId = groupId;
  if (staffId) where.staffId = staffId;
  if (dayOfWeek !== null && dayOfWeek !== undefined) where.dayOfWeek = parseInt(dayOfWeek);

  const slots = await db.scheduleSlot.findMany({
    where,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: {
      group: { select: { name: true } },
      staff: { select: { name: true } },
    },
  });

  return Response.json(slots);
}

export async function POST(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { groupId, staffId, subject, dayOfWeek, startTime, endTime, room } = body;

    if (!groupId || !subject?.trim() || dayOfWeek === undefined || !startTime || !endTime) {
      return Response.json({ error: "groupId, subject, dayOfWeek, startTime, and endTime required" }, { status: 400 });
    }

    const group = await db.group.findUnique({ where: { id: groupId } });
    if (!group || group.orgId !== auth.orgId) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    // Validate staff if provided
    if (staffId) {
      const staff = await db.staff.findUnique({ where: { id: staffId } });
      if (!staff || staff.orgId !== auth.orgId) {
        return Response.json({ error: "Staff member not found" }, { status: 404 });
      }
    }

    const slot = await db.scheduleSlot.create({
      data: {
        orgId: auth.orgId,
        groupId,
        staffId: staffId || null,
        subject: subject.trim(),
        dayOfWeek,
        startTime,
        endTime,
        room: room?.trim() || null,
      },
    });

    await logAudit({
      actorType: "operator",
      actorId: auth.operatorId,
      orgId: auth.orgId,
      action: "schedule.created",
      metadata: { slotId: slot.id, subject, dayOfWeek, groupId },
      ipAddress: getClientIP(request),
    });

    return Response.json(slot, { status: 201 });
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
    const { id, staffId, subject, dayOfWeek, startTime, endTime, room } = body;

    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (staffId !== undefined) updates.staffId = staffId || null;
    if (subject?.trim()) updates.subject = subject.trim();
    if (dayOfWeek !== undefined) updates.dayOfWeek = dayOfWeek;
    if (startTime) updates.startTime = startTime;
    if (endTime) updates.endTime = endTime;
    if (room !== undefined) updates.room = room?.trim() || null;

    const updated = await db.scheduleSlot.update({ where: { id }, data: updates });
    return Response.json(updated);
  } catch (err: unknown) {
    console.error("API error:", err);
    return Response.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const slot = await db.scheduleSlot.findUnique({ where: { id } });
    if (!slot) return Response.json({ error: "Schedule slot not found" }, { status: 404 });

    // Ensure slot belongs to authenticated org
    if (slot.orgId !== auth.orgId) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    await db.scheduleSlot.delete({ where: { id } });

    await logAudit({
      actorType: "operator",
      actorId: auth.operatorId,
      orgId: auth.orgId,
      action: "schedule.deleted",
      metadata: { slotId: id, subject: slot.subject },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true });
  } catch (err: unknown) {
    console.error("API error:", err);
    return Response.json({ error: "An error occurred" }, { status: 500 });
  }
}
