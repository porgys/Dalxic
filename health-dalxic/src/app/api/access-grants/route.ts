import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit, AUTH_RATE_LIMIT } from "@/lib/rate-limit";
// POST: Create a temporary access grant
export async function POST(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT); if (blocked) return blocked;  const body = await request.json();
  const { dalxicStaffId, hospitalId, grantedRole, grantedBy, expiresAt, reason } = body;

  if (!dalxicStaffId || !hospitalId || !grantedRole || !grantedBy || !expiresAt || !reason) {
    return Response.json({ error: "All fields required" }, { status: 400 });
  }

  const grant = await db.accessGrant.create({
    data: {
      dalxicStaffId,
      hospitalId,
      grantedRole,
      grantedBy,
      expiresAt: new Date(expiresAt),
      reason,
    },
  });

  await logAudit({
    actorType: "dalxic_super_admin",
    actorId: grantedBy,
    hospitalId,
    action: "access_grant.created",
    metadata: { grantId: grant.id, staffId: dalxicStaffId, role: grantedRole, reason },
    ipAddress: getClientIP(request),
  });

  return Response.json(grant, { status: 201 });
}

// PATCH: Revoke an access grant
export async function PATCH(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT); if (blocked) return blocked;  const body = await request.json();
  const { grantId, revokedBy } = body;

  if (!grantId || !revokedBy) {
    return Response.json({ error: "grantId and revokedBy required" }, { status: 400 });
  }

  const grant = await db.accessGrant.findUnique({ where: { id: grantId } });
  if (!grant) {
    return Response.json({ error: "Grant not found" }, { status: 404 });
  }

  const revoked = await db.accessGrant.update({
    where: { id: grantId },
    data: { isActive: false, revokedAt: new Date() },
  });

  await logAudit({
    actorType: "dalxic_super_admin",
    actorId: revokedBy,
    hospitalId: grant.hospitalId,
    action: "access_grant.revoked",
    metadata: { grantId, staffId: grant.dalxicStaffId },
    ipAddress: getClientIP(request),
  });

  return Response.json(revoked);
}

// GET: List active grants
export async function GET(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT); if (blocked) return blocked;  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get("hospitalId");

  const where = hospitalId
    ? { hospitalId, isActive: true }
    : { isActive: true };

  const grants = await db.accessGrant.findMany({
    where,
    include: { dalxicStaff: true, hospital: true },
    orderBy: { grantedAt: "desc" },
  });

  return Response.json(grants);
}
