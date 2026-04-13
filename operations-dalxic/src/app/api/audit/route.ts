import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Audit log viewer — read-only, append-only trail.
 *
 * GET: Fetch audit logs for an org (paginated, filterable)
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const orgCode = searchParams.get("orgCode");
  const action = searchParams.get("action");
  const actorId = searchParams.get("actorId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!orgCode) return Response.json({ error: "orgCode required" }, { status: 400 });

  const org = await db.organization.findUnique({ where: { code: orgCode } });
  if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

  const where: Record<string, unknown> = { orgId: org.id };
  if (action) where.action = { contains: action };
  if (actorId) where.actorId = actorId;

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
    }),
    db.auditLog.count({ where }),
  ]);

  return Response.json({ logs, total, limit, offset });
}
