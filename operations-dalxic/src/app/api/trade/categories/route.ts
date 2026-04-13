import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

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

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  const where: Record<string, unknown> = { orgId: auth.orgId };
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

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { name, sortOrder } = body;

    if (!name?.trim()) {
      return Response.json({ error: "name required" }, { status: 400 });
    }

    // Check uniqueness
    const existing = await db.category.findUnique({
      where: { orgId_name: { orgId: auth.orgId, name: name.trim() } },
    });
    if (existing) {
      return Response.json({ error: "Category already exists" }, { status: 409 });
    }

    const category = await db.category.create({
      data: {
        orgId: auth.orgId,
        name: name.trim(),
        sortOrder: sortOrder ?? 0,
      },
    });

    await logAudit({
      actorType: "operator",
      actorId: auth.operatorId,
      orgId: auth.orgId,
      action: "category.created",
      metadata: { categoryId: category.id, name: category.name },
      ipAddress: getClientIP(request),
    });

    return Response.json(category, { status: 201 });
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
    console.error("API error:", err);
    return Response.json({ error: "An error occurred" }, { status: 500 });
  }
}
