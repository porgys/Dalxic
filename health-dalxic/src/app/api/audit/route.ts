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

  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const actorId = searchParams.get("actorId");
  const format = searchParams.get("format"); // "csv" for export

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (hospitalCode) {
    const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
    if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });
    where.hospitalId = hospital.id;
  }
  if (actorType) where.actorType = actorType;
  if (actorId) where.actorId = actorId;
  if (action) where.action = { contains: action };
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  const logs = await db.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: limit,
    include: { hospital: { select: { code: true, name: true } } },
  });

  // CSV export
  if (format === "csv") {
    const header = "Timestamp,Action,Actor Type,Actor ID,Hospital,IP Address,Metadata";
    const rows = logs.map(l => {
      const h = l.hospital as { code: string; name: string } | null;
      const meta = l.metadata ? JSON.stringify(l.metadata).replace(/"/g, '""') : "";
      return `${l.timestamp.toISOString()},${l.action},${l.actorType},${l.actorId || ""},${h?.code || ""},${l.ipAddress || ""},"${meta}"`;
    });
    const csv = [header, ...rows].join("\n");
    return new Response(csv, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="audit-${new Date().toISOString().slice(0, 10)}.csv"` },
    });
  }

  return Response.json(logs);
}
