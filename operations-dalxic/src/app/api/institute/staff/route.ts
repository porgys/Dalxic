import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Institute Staff — teachers, admin, support.
 *
 * GET:   List staff with department filter
 * POST:  Add staff member
 * PATCH: Update staff details
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const orgCode = searchParams.get("orgCode");
  const department = searchParams.get("department");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  if (!orgCode) return Response.json({ error: "orgCode required" }, { status: 400 });

  const org = await db.organization.findUnique({ where: { code: orgCode } });
  if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { orgId: org.id };
  if (department) where.department = department;
  if (status) where.status = status;
  if (search) where.name = { contains: search, mode: "insensitive" };

  const staff = await db.staff.findMany({
    where,
    orderBy: { name: "asc" },
  });

  // Get unique departments
  const departments = [...new Set(staff.map(s => s.department))].sort();

  return Response.json({ staff, departments, total: staff.length });
}

export async function POST(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const { orgCode, name, role, department, phone, email, meta } = body;

    if (!orgCode || !name?.trim() || !role || !department) {
      return Response.json({ error: "orgCode, name, role, and department required" }, { status: 400 });
    }

    const org = await db.organization.findUnique({ where: { code: orgCode } });
    if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

    const staffMember = await db.staff.create({
      data: {
        orgId: org.id,
        name: name.trim(),
        role,
        department,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
      },
    });

    await logAudit({
      actorType: "operator",
      actorId: body.operatorId || "system",
      orgId: org.id,
      action: "staff.created",
      metadata: { staffId: staffMember.id, name: staffMember.name, role, department },
      ipAddress: getClientIP(request),
    });

    return Response.json(staffMember, { status: 201 });
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
    const { id, name, role, department, phone, email, status, meta } = body;

    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (name?.trim()) updates.name = name.trim();
    if (role) updates.role = role;
    if (department) updates.department = department;
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (email !== undefined) updates.email = email?.trim() || null;
    if (status) updates.status = status;
    if (meta !== undefined) updates.meta = meta ? JSON.parse(JSON.stringify(meta)) : null;

    const updated = await db.staff.update({ where: { id }, data: updates });
    return Response.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
