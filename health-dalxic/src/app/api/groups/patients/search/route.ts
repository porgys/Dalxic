import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

// GET: Search patients across all hospitals in a group
// Query: groupCode, q (search term), fromHospitalCode (who is searching)
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const groupCode = searchParams.get("groupCode");
  const query = searchParams.get("q");
  const fromHospitalCode = searchParams.get("fromHospitalCode");

  if (!groupCode || !query || query.length < 2) {
    return Response.json({ error: "groupCode and q (min 2 chars) required" }, { status: 400 });
  }

  // Verify group exists
  const group = await db.hospitalGroup.findUnique({ where: { groupCode } });
  if (!group) return Response.json({ error: "Group not found" }, { status: 404 });

  // Get all hospital IDs in this group
  const groupHospitals = await db.hospital.findMany({
    where: { groupCode, active: true },
    select: { id: true, code: true, name: true, tier: true },
  });

  if (groupHospitals.length === 0) {
    return Response.json({ results: [], groupName: group.name, branchCount: 0 });
  }

  const hospitalIds = groupHospitals.map(h => h.id);
  const hospitalMap = Object.fromEntries(groupHospitals.map(h => [h.id, h]));
  const searchLower = query.toLowerCase();

  // Search patient records across all group hospitals
  // Patient data is in JSON columns — we search by raw SQL for performance
  const records = await db.patientRecord.findMany({
    where: {
      hospitalId: { in: hospitalIds },
    },
    select: {
      id: true,
      hospitalId: true,
      patient: true,
      visit: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200, // fetch more, filter in JS since JSON search
  });

  // Filter by patient name, phone, or queue token in JS (JSON columns)
  const matches = records.filter(r => {
    const p = r.patient as Record<string, unknown>;
    const v = r.visit as Record<string, unknown>;
    const fullName = String(p?.fullName || "").toLowerCase();
    const phone = String(p?.phone || "").toLowerCase();
    const token = String(v?.queueToken || "").toLowerCase();
    const insuranceId = String(p?.insuranceId || "").toLowerCase();

    return (
      fullName.includes(searchLower) ||
      phone.includes(searchLower) ||
      token.includes(searchLower) ||
      insuranceId.includes(searchLower)
    );
  }).slice(0, 15); // Cap at 15 results

  const results = matches.map(r => {
    const p = r.patient as Record<string, unknown>;
    const v = r.visit as Record<string, unknown>;
    const hospital = hospitalMap[r.hospitalId];
    return {
      recordId: r.id,
      patientName: p?.fullName || "Unknown",
      phone: p?.phone || null,
      dateOfBirth: p?.dateOfBirth || null,
      gender: p?.gender || null,
      insuranceId: p?.insuranceId || null,
      queueToken: v?.queueToken || null,
      visitStatus: v?.visitStatus || null,
      department: v?.department || null,
      hospitalCode: hospital?.code || "unknown",
      hospitalName: hospital?.name || "Unknown",
      hospitalTier: hospital?.tier || "T1",
      createdAt: r.createdAt,
    };
  });

  // Audit the cross-branch lookup
  if (fromHospitalCode) {
    const fromHospital = groupHospitals.find(h => h.code === fromHospitalCode);
    if (fromHospital) {
      await logAudit({
        actorType: "device_operator",
        actorId: "cross-branch-search",
        hospitalId: fromHospital.id,
        action: "group.patient_search",
        metadata: {
          groupCode,
          searchQuery: query,
          resultsCount: results.length,
          branchesSearched: groupHospitals.length,
        },
        ipAddress: getClientIP(request),
      }).catch(() => {}); // non-blocking
    }
  }

  return Response.json({
    results,
    groupName: group.name,
    groupCode,
    branchCount: groupHospitals.length,
    totalFound: results.length,
  });
}
