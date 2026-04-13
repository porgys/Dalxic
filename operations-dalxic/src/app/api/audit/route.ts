import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { authenticateRequest, requireRole } from "@/lib/auth";

/**
 * Audit log viewer — read-only, append-only trail.
 *
 * GET: Fetch audit logs for an org (paginated, filterable)
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const roleCheck = requireRole(auth, ["admin", "manager"]);
  if (roleCheck) return roleCheck;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const actorId = searchParams.get("actorId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Record<string, unknown> = { orgId: auth.orgId };
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
