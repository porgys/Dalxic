import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

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

  const { searchParams } = new URL(request.url);
  const orgCode = searchParams.get("orgCode");
  const groupId = searchParams.get("groupId");
  const staffId = searchParams.get("staffId");
  const dayOfWeek = searchParams.get("dayOfWeek");

  if (!orgCode) return Response.json({ error: "orgCode required" }, { status: 400 });

  const org = await db.organization.findUnique({ where: { code: orgCode } });
  if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { orgId: org.id };
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

  try {
    const body = await request.json();
    const { orgCode, groupId, staffId, subject, dayOfWeek, startTime, endTime, room } = body;

    if (!orgCode || !groupId || !subject?.trim() || dayOfWeek === undefined || !startTime || !endTime) {
      return Response.json({ error: "orgCode, groupId, subject, dayOfWeek, startTime, and endTime required" }, { status: 400 });
    }

    const org = await db.organization.findUnique({ where: { code: orgCode } });
    if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

    const group = await db.group.findUnique({ where: { id: groupId } });
    if (!group || group.orgId !== org.id) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    // Validate staff if provided
    if (staffId) {
      const staff = await db.staff.findUnique({ where: { id: staffId } });
      if (!staff || staff.orgId !== org.id) {
        return Response.json({ error: "Staff member not found" }, { status: 404 });
      }
    }

    const slot = await db.scheduleSlot.create({
      data: {
        orgId: org.id,
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
      actorId: body.operatorId || "system",
      orgId: org.id,
      action: "schedule.created",
      metadata: { slotId: slot.id, subject, dayOfWeek, groupId },
      ipAddress: getClientIP(request),
    });

    return Response.json(slot, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

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
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const slot = await db.scheduleSlot.findUnique({ where: { id } });
    if (!slot) return Response.json({ error: "Schedule slot not found" }, { status: 404 });

    await db.scheduleSlot.delete({ where: { id } });

    await logAudit({
      actorType: "operator",
      actorId: "system",
      orgId: slot.orgId,
      action: "schedule.deleted",
      metadata: { slotId: id, subject: slot.subject },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
