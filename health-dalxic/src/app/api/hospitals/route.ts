import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { getTierDefaults } from "@/lib/tier-defaults";
import { rateLimit } from "@/lib/rate-limit";
// GET: List all hospitals or single by code
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const hospital = await db.hospital.findUnique({
      where: { code },
      include: {
        group: { select: { groupCode: true, name: true, ownerName: true } },
        _count: { select: { devices: true, monthlyBooks: true, patientRecords: true } },
      },
    });
    if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });
    return Response.json(hospital);
  }

  const groupCode = searchParams.get("groupCode");

  const hospitals = await db.hospital.findMany({
    where: groupCode ? { groupCode } : undefined,
    orderBy: { name: "asc" },
    include: {
      group: { select: { groupCode: true, name: true } },
      _count: { select: { devices: true, monthlyBooks: true, patientRecords: true } },
    },
  });
  return Response.json(hospitals);
}

// POST: Create a new hospital — applies TIER_DEFAULTS automatically
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { code, name, subdomain, tier, tagline, actorId } = body;

  if (!code || !name || !subdomain || !tier || !actorId) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await db.hospital.findFirst({
    where: { OR: [{ code }, { subdomain }] },
  });
  if (existing) {
    return Response.json({ error: "Hospital code or subdomain already exists" }, { status: 409 });
  }

  // Apply tier defaults
  const defaults = getTierDefaults(tier);

  const hospital = await db.hospital.create({
    data: {
      code,
      name,
      subdomain,
      tier,
      tagline: tagline ?? null,
      activeModules: [...defaults.modules],
      maxDevices: defaults.maxDevices,
      whatsappBundle: defaults.whatsappBundlePerMonth,
    },
  });

  await logAudit({
    actorType: "dalxic_super_admin",
    actorId,
    hospitalId: hospital.id,
    action: "hospital.created",
    metadata: { code, name, tier, modules: defaults.modules },
    ipAddress: getClientIP(request),
  });

  return Response.json(hospital, { status: 201 });
}

// PATCH: Upgrade/downgrade hospital tier
export async function PATCH(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { hospitalCode, newTier, actorId } = body;

  if (!hospitalCode || !newTier) {
    return Response.json({ error: "hospitalCode and newTier required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const defaults = getTierDefaults(newTier);
  const oldTier = hospital.tier;

  const updated = await db.hospital.update({
    where: { code: hospitalCode },
    data: {
      tier: newTier,
      activeModules: [...defaults.modules],
      maxDevices: defaults.maxDevices,
      whatsappBundle: defaults.whatsappBundlePerMonth,
    },
  });

  await logAudit({
    actorType: "dalxic_super_admin",
    actorId: actorId || "admin",
    hospitalId: hospital.id,
    action: oldTier < newTier ? "hospital.tier_upgraded" : "hospital.tier_downgraded",
    metadata: { from: oldTier, to: newTier, modules: defaults.modules },
    ipAddress: getClientIP(request),
  });

  return Response.json(updated);
}
