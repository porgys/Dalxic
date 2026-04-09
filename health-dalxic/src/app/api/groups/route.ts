import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

// GET: List all groups, or single group by groupCode
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const groupCode = searchParams.get("groupCode");

  if (groupCode) {
    const group = await db.hospitalGroup.findUnique({
      where: { groupCode },
      include: {
        hospitals: {
          select: {
            id: true, code: true, name: true, tier: true, active: true,
            activeModules: true, maxDevices: true,
            _count: { select: { patientRecords: true, deviceOperators: true, devices: true } },
          },
          orderBy: { name: "asc" },
        },
      },
    });
    if (!group) return Response.json({ error: "Group not found" }, { status: 404 });
    return Response.json(group);
  }

  const groups = await db.hospitalGroup.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      hospitals: {
        select: { id: true, code: true, name: true, tier: true, active: true },
        orderBy: { name: "asc" },
      },
    },
  });
  return Response.json(groups);
}

// POST: Create a new group OR link a hospital to a group
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { action } = body;

  // ── Create group ──
  if (action === "create") {
    const { groupCode, name, ownerName, ownerPin, actorId } = body;
    if (!groupCode || !name || !ownerName || !ownerPin || !actorId) {
      return Response.json({ error: "Missing required fields: groupCode, name, ownerName, ownerPin, actorId" }, { status: 400 });
    }
    if (!/^\d{4}$/.test(ownerPin)) {
      return Response.json({ error: "Owner PIN must be exactly 4 digits" }, { status: 400 });
    }

    const existing = await db.hospitalGroup.findUnique({ where: { groupCode } });
    if (existing) return Response.json({ error: "Group code already exists" }, { status: 409 });

    const group = await db.hospitalGroup.create({
      data: { groupCode, name, ownerName, ownerPin },
    });

    return Response.json(group, { status: 201 });
  }

  // ── Link hospital to group ──
  if (action === "link_hospital") {
    const { groupCode, hospitalCode, actorId } = body;
    if (!groupCode || !hospitalCode) {
      return Response.json({ error: "groupCode and hospitalCode required" }, { status: 400 });
    }

    const group = await db.hospitalGroup.findUnique({ where: { groupCode } });
    if (!group) return Response.json({ error: "Group not found" }, { status: 404 });

    const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
    if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

    if (hospital.groupId && hospital.groupId !== group.id) {
      return Response.json({ error: "Hospital already belongs to another group" }, { status: 409 });
    }

    const updated = await db.hospital.update({
      where: { code: hospitalCode },
      data: { groupId: group.id, groupCode: group.groupCode },
    });

    await logAudit({
      actorType: "dalxic_super_admin",
      actorId: actorId || "admin",
      hospitalId: hospital.id,
      action: "hospital.linked_to_group",
      metadata: { groupCode, hospitalCode, groupName: group.name },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true, hospital: { code: updated.code, name: updated.name, groupCode: updated.groupCode } });
  }

  // ── Unlink hospital from group ──
  if (action === "unlink_hospital") {
    const { hospitalCode, actorId } = body;
    if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

    const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
    if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });
    if (!hospital.groupId) return Response.json({ error: "Hospital is not in any group" }, { status: 400 });

    const oldGroupCode = hospital.groupCode;
    const updated = await db.hospital.update({
      where: { code: hospitalCode },
      data: { groupId: null, groupCode: null },
    });

    await logAudit({
      actorType: "dalxic_super_admin",
      actorId: actorId || "admin",
      hospitalId: hospital.id,
      action: "hospital.unlinked_from_group",
      metadata: { previousGroupCode: oldGroupCode, hospitalCode },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true, hospital: { code: updated.code, name: updated.name, groupCode: null } });
  }

  return Response.json({ error: "Invalid action. Use: create, link_hospital, unlink_hospital" }, { status: 400 });
}

// PATCH: Update group details
export async function PATCH(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { groupCode, name, ownerName, ownerPin, subscriptionTier, isActive } = body;

  if (!groupCode) return Response.json({ error: "groupCode required" }, { status: 400 });

  const group = await db.hospitalGroup.findUnique({ where: { groupCode } });
  if (!group) return Response.json({ error: "Group not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (ownerName !== undefined) updateData.ownerName = ownerName;
  if (ownerPin !== undefined) {
    if (!/^\d{4}$/.test(ownerPin)) return Response.json({ error: "PIN must be 4 digits" }, { status: 400 });
    updateData.ownerPin = ownerPin;
  }
  if (subscriptionTier !== undefined) updateData.subscriptionTier = subscriptionTier;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updated = await db.hospitalGroup.update({ where: { groupCode }, data: updateData });
  return Response.json(updated);
}
