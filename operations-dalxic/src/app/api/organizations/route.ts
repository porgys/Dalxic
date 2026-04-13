import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { getTierDefaults } from "@/lib/tier-defaults";

/**
 * Organization CRUD — multi-tenant core.
 *
 * GET:   List all orgs or fetch by code
 * POST:  Create a new organization
 * PATCH: Update organization details
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const org = await db.organization.findUnique({ where: { code } });
    if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });
    return Response.json(org);
  }

  const orgs = await db.organization.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(orgs);
}

export async function POST(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const { code, name, type, tier, logoUrl, tagline, meta } = body;

    if (!code?.trim() || !name?.trim() || !type) {
      return Response.json({ error: "code, name, and type required" }, { status: 400 });
    }

    if (!["trade", "institute"].includes(type)) {
      return Response.json({ error: "type must be 'trade' or 'institute'" }, { status: 400 });
    }

    // Check code uniqueness
    const existing = await db.organization.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (existing) {
      return Response.json({ error: "Organization code already in use" }, { status: 409 });
    }

    // Apply tier defaults
    const tierConfig = getTierDefaults(tier || "T1");

    const org = await db.organization.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        type,
        tier: tier || "T1",
        logoUrl: logoUrl?.trim() || null,
        tagline: tagline?.trim() || null,
        activeModules: tierConfig.activeModules,
        maxOperators: tierConfig.maxOperators,
        whatsappBundle: tierConfig.whatsappBundle,
        meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
      },
    });

    await logAudit({
      actorType: "system",
      actorId: "api",
      orgId: org.id,
      action: "organization.created",
      metadata: { code: org.code, type: org.type, tier: org.tier },
      ipAddress: getClientIP(request),
    });

    return Response.json(org, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[organizations] POST error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const { id, name, logoUrl, tagline, tier, active, activeModules, meta } = body;

    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const org = await db.organization.findUnique({ where: { id } });
    if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (name?.trim()) updates.name = name.trim();
    if (logoUrl !== undefined) updates.logoUrl = logoUrl?.trim() || null;
    if (tagline !== undefined) updates.tagline = tagline?.trim() || null;
    if (active !== undefined) updates.active = active;
    if (activeModules) updates.activeModules = activeModules;
    if (meta !== undefined) updates.meta = meta ? JSON.parse(JSON.stringify(meta)) : null;

    // If tier changes, apply new tier defaults
    if (tier && tier !== org.tier) {
      const tierConfig = getTierDefaults(tier);
      updates.tier = tier;
      updates.maxOperators = tierConfig.maxOperators;
      updates.whatsappBundle = tierConfig.whatsappBundle;
      updates.activeModules = tierConfig.activeModules;
    }

    const updated = await db.organization.update({
      where: { id },
      data: updates,
    });

    await logAudit({
      actorType: "system",
      actorId: "api",
      orgId: org.id,
      action: "organization.updated",
      metadata: { changes: Object.keys(updates) },
      ipAddress: getClientIP(request),
    });

    return Response.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[organizations] PATCH error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
