import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

// GET: Consolidated dashboard stats for a hospital group
// Query: groupCode
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const groupCode = searchParams.get("groupCode");

  if (!groupCode) return Response.json({ error: "groupCode required" }, { status: 400 });

  const group = await db.hospitalGroup.findUnique({ where: { groupCode } });
  if (!group) return Response.json({ error: "Group not found" }, { status: 404 });

  // Get all hospitals in this group
  const hospitals = await db.hospital.findMany({
    where: { groupCode, active: true },
    select: {
      id: true, code: true, name: true, tier: true,
      activeModules: true, maxDevices: true,
    },
    orderBy: { name: "asc" },
  });

  if (hospitals.length === 0) {
    return Response.json({
      group: { groupCode, name: group.name, subscriptionTier: group.subscriptionTier },
      branches: [],
      totals: { patients: 0, operators: 0, revenue: 0 },
      referrals: [],
    });
  }

  const hospitalIds = hospitals.map(h => h.id);

  // Today's date boundary
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parallel queries for all branches
  const [
    patientCounts,
    operatorCounts,
    todayRecords,
  ] = await Promise.all([
    // Total patient records per hospital
    db.patientRecord.groupBy({
      by: ["hospitalId"],
      where: { hospitalId: { in: hospitalIds } },
      _count: true,
    }),
    // Active operators per hospital
    db.deviceOperator.groupBy({
      by: ["hospitalId"],
      where: { hospitalId: { in: hospitalIds }, isActive: true },
      _count: true,
    }),
    // Today's records (for today's patient count + referrals)
    db.patientRecord.findMany({
      where: { hospitalId: { in: hospitalIds }, createdAt: { gte: today } },
      select: { id: true, hospitalId: true, patient: true, visit: true },
    }),
  ]);

  // Bill totals — bills table may not exist yet, graceful fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let billTotals: any[] = [];
  try {
    billTotals = await (db.bill as any).groupBy({
      by: ["hospitalId"],
      where: { hospitalId: { in: hospitalIds }, status: { in: ["PAID", "PART_PAID"] } },
      _sum: { total: true },
    });
  } catch { /* bills table not yet created */ }

  // Build lookup maps
  const patientMap = Object.fromEntries(patientCounts.map(p => [p.hospitalId, p._count]));
  const operatorMap = Object.fromEntries(operatorCounts.map(o => [o.hospitalId, o._count]));
  const billMap = Object.fromEntries(billTotals.map(b => [b.hospitalId, b._sum.total || 0]));

  // Count today's patients per hospital
  const todayMap: Record<string, number> = {};
  for (const r of todayRecords) {
    todayMap[r.hospitalId] = (todayMap[r.hospitalId] || 0) + 1;
  }

  // Extract active inter-branch referrals
  const activeReferrals: Array<Record<string, unknown>> = [];
  for (const record of todayRecords) {
    const visit = record.visit as Record<string, unknown>;
    const ibRefs = (visit?.interBranchReferrals || []) as Array<Record<string, unknown>>;
    const patient = record.patient as Record<string, unknown>;

    for (const ref of ibRefs) {
      if (ref.status === "COMPLETED" || ref.status === "CANCELLED") continue;
      activeReferrals.push({
        ...ref,
        patientName: patient?.fullName || "Unknown",
      });
    }
  }

  // Build branch summaries
  const branches = hospitals.map(h => ({
    code: h.code,
    name: h.name,
    tier: h.tier,
    modules: h.activeModules.length,
    totalPatients: patientMap[h.id] || 0,
    todayPatients: todayMap[h.id] || 0,
    operators: operatorMap[h.id] || 0,
    revenue: billMap[h.id] || 0,
  }));

  const totals = {
    patients: branches.reduce((s, b) => s + b.totalPatients, 0),
    todayPatients: branches.reduce((s, b) => s + b.todayPatients, 0),
    operators: branches.reduce((s, b) => s + b.operators, 0),
    revenue: branches.reduce((s, b) => s + b.revenue, 0),
    branches: branches.length,
  };

  return Response.json({
    group: {
      groupCode,
      name: group.name,
      ownerName: group.ownerName,
      subscriptionTier: group.subscriptionTier,
    },
    branches,
    totals,
    activeReferrals,
  });
}
