import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { getTierDefaults } from "@/lib/tier-defaults";
import { rateLimit } from "@/lib/rate-limit";
import { canSuspendHospital } from "@/lib/data-protection";
import { getPusher, hospitalChannel } from "@/lib/pusher-server";
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

  if (!hospitalCode) {
    return Response.json({ error: "hospitalCode required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // ── Edit hospital details ──
  const { editFields, toggleModule } = body;
  if (editFields) {
    // ─── DATA PROTECTION: Only Owner can suspend/deactivate a hospital ───
    if (typeof editFields.active === "boolean" && !editFields.active) {
      const guard = canSuspendHospital({
        actorType: (actorId === "owner" || actorId === "dalxic_super_admin") ? "dalxic_super_admin" : "dalxic_staff",
        actorId: actorId || "unknown",
        hospitalId: hospital.id,
        ipAddress: getClientIP(request),
      });
      if (!guard.allowed) {
        return Response.json({ error: guard.reason }, { status: 403 });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (editFields.name) data.name = editFields.name;
    if (editFields.tagline !== undefined) data.tagline = editFields.tagline;
    if (editFields.subdomain) data.subdomain = editFields.subdomain;
    if (typeof editFields.active === "boolean") data.active = editFields.active;
    if (editFields.groupCode !== undefined) data.groupCode = editFields.groupCode || null;
    if (editFields.cardTemplate !== undefined) data.cardTemplate = editFields.cardTemplate;
    if (editFields.cardTemplateCustom !== undefined) data.cardTemplateCustom = editFields.cardTemplateCustom;

    const updated = await db.hospital.update({ where: { code: hospitalCode }, data });

    await logAudit({
      actorType: "dalxic_super_admin",
      actorId: actorId || "admin",
      hospitalId: hospital.id,
      action: typeof editFields.active === "boolean"
        ? (editFields.active ? "hospital.activated" : "hospital.deactivated")
        : "hospital.details_updated",
      metadata: editFields,
      ipAddress: getClientIP(request),
    });

    return Response.json(updated);
  }

  // ── Toggle individual module (freestyle — not tier-restricted) ──
  if (toggleModule) {
    const currentModules = (hospital.activeModules as string[]) || [];
    const isActive = currentModules.includes(toggleModule);
    const newModules = isActive
      ? currentModules.filter(m => m !== toggleModule)
      : [...currentModules, toggleModule];

    const updated = await db.hospital.update({
      where: { code: hospitalCode },
      data: { activeModules: newModules },
    });

    await logAudit({
      actorType: "dalxic_super_admin",
      actorId: actorId || "admin",
      hospitalId: hospital.id,
      action: isActive ? "hospital.module_deactivated" : "hospital.module_activated",
      metadata: { module: toggleModule, activeModules: newModules },
      ipAddress: getClientIP(request),
    });

    // Broadcast so every StationGate on this hospital drops polling and reacts in real-time.
    try {
      const pusher = getPusher();
      await pusher.trigger(hospitalChannel(hospitalCode, "modules"), "module-toggled", {
        module: toggleModule,
        isActive: !isActive, // new state after toggle
        activeModules: newModules,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Pusher not configured — clients fall back to their polling interval
    }

    return Response.json(updated);
  }

  // ── Tier upgrade/downgrade ──
  if (!newTier) {
    return Response.json({ error: "newTier or toggleModule required" }, { status: 400 });
  }

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
