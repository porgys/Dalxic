import { db } from "@/lib/db";
import { rateLimit, AUTH_RATE_LIMIT } from "@/lib/rate-limit";

// GET: List audit logs (most recent first)
// Query: hospitalCode, actorType, action, limit (default 100)
export async function GET(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const actorType = searchParams.get("actorType");
  const action = searchParams.get("action");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (hospitalCode) {
    const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
    if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });
    where.hospitalId = hospital.id;
  }
  if (actorType) where.actorType = actorType;
  if (action) where.action = { contains: action };

  const logs = await db.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: limit,
    include: { hospital: { select: { code: true, name: true } } },
  });

  return Response.json(logs);
}
