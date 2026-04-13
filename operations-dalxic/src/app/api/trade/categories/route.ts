import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Trade Categories — org-scoped, persistent.
 *
 * GET:   List categories for an org
 * POST:  Create a new category
 * PATCH: Update / reorder / deactivate
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const orgCode = searchParams.get("orgCode");
  const includeInactive = searchParams.get("includeInactive") === "true";

  if (!orgCode) return Response.json({ error: "orgCode required" }, { status: 400 });

  const org = await db.organization.findUnique({ where: { code: orgCode } });
  if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

  const where: Record<string, unknown> = { orgId: org.id };
  if (!includeInactive) where.isActive = true;

  const categories = await db.category.findMany({
    where,
    orderBy: { sortOrder: "asc" },
  });

  return Response.json(categories);
}

export async function POST(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const { orgCode, name, sortOrder } = body;

    if (!orgCode || !name?.trim()) {
      return Response.json({ error: "orgCode and name required" }, { status: 400 });
    }

    const org = await db.organization.findUnique({ where: { code: orgCode } });
    if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

    // Check uniqueness
    const existing = await db.category.findUnique({
      where: { orgId_name: { orgId: org.id, name: name.trim() } },
    });
    if (existing) {
      return Response.json({ error: "Category already exists" }, { status: 409 });
    }

    const category = await db.category.create({
      data: {
        orgId: org.id,
        name: name.trim(),
        sortOrder: sortOrder ?? 0,
      },
    });

    await logAudit({
      actorType: "operator",
      actorId: body.operatorId || "system",
      orgId: org.id,
      action: "category.created",
      metadata: { categoryId: category.id, name: category.name },
      ipAddress: getClientIP(request),
    });

    return Response.json(category, { status: 201 });
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
    const { id, name, sortOrder, isActive } = body;

    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (name?.trim()) updates.name = name.trim();
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await db.category.update({
      where: { id },
      data: updates,
    });

    return Response.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
