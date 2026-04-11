import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

// GET: List/search drugs in catalog
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const activeOnly = searchParams.get("activeOnly") !== "false";

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const where: Record<string, unknown> = { hospitalId: hospital.id };
  if (activeOnly) where.isActive = true;
  if (category) where.category = category;
  if (search) where.name = { contains: search, mode: "insensitive" };

  const drugs = await db.drugCatalog.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      stocks: {
        where: { status: "ACTIVE", quantityRemaining: { gt: 0 } },
        orderBy: { expiryDate: "asc" },
      },
    },
  });

  // Compute stock summary per drug
  const catalog = drugs.map((d) => {
    const totalStock = d.stocks.reduce((sum, s) => sum + s.quantityRemaining, 0);
    const nearestExpiry = d.stocks.length > 0 ? d.stocks[0].expiryDate : null;
    const daysToExpiry = nearestExpiry ? Math.ceil((nearestExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    return {
      id: d.id,
      name: d.name,
      genericName: d.genericName,
      category: d.category,
      unit: d.unit,
      defaultPrice: d.defaultPrice,
      costPrice: d.costPrice,
      controlledSubstance: d.controlledSubstance,
      requiresPrescription: d.requiresPrescription,
      minStockThreshold: d.minStockThreshold,
      isActive: d.isActive,
      totalStock,
      batchCount: d.stocks.length,
      nearestExpiry,
      daysToExpiry,
      stockStatus: totalStock === 0 ? "OUT" : totalStock <= d.minStockThreshold ? "LOW" : "OK",
    };
  });

  return Response.json({ catalog, total: catalog.length });
}

// POST: Add drug to catalog
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { hospitalCode, name, genericName, category, unit, defaultPrice, costPrice, controlledSubstance, requiresPrescription, minStockThreshold, addedBy } = body;

  if (!hospitalCode || !name || !category || !unit || defaultPrice == null) {
    return Response.json({ error: "hospitalCode, name, category, unit, defaultPrice required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const drug = await db.drugCatalog.create({
    data: {
      hospitalId: hospital.id,
      name,
      genericName: genericName || null,
      category,
      unit,
      defaultPrice: Number(defaultPrice),
      costPrice: Number(costPrice || 0),
      controlledSubstance: controlledSubstance || false,
      requiresPrescription: requiresPrescription !== false,
      minStockThreshold: minStockThreshold || 20,
    },
  });

  await logAudit({
    actorType: "device_operator",
    actorId: addedBy || "pharmacist",
    hospitalId: hospital.id,
    action: "pharmacy.catalog_added",
    metadata: { drugId: drug.id, name, category },
    ipAddress: getClientIP(request),
  });

  return Response.json({ success: true, drug }, { status: 201 });
}

// PATCH: Edit drug or toggle active
export async function PATCH(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { hospitalCode, drugId, toggleActive, editedBy, ...updates } = body;

  if (!hospitalCode || !drugId) {
    return Response.json({ error: "hospitalCode and drugId required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const drug = await db.drugCatalog.findUnique({ where: { id: drugId } });
  if (!drug || drug.hospitalId !== hospital.id) return Response.json({ error: "Drug not found" }, { status: 404 });

  if (toggleActive) {
    await db.drugCatalog.update({ where: { id: drugId }, data: { isActive: !drug.isActive } });
    return Response.json({ success: true, isActive: !drug.isActive });
  }

  const allowed = ["name", "genericName", "category", "unit", "defaultPrice", "costPrice", "controlledSubstance", "requiresPrescription", "minStockThreshold"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      data[key] = ["defaultPrice", "costPrice"].includes(key) ? Number(updates[key]) : ["minStockThreshold"].includes(key) ? Number(updates[key]) : updates[key];
    }
  }

  if (Object.keys(data).length === 0) return Response.json({ error: "No valid fields to update" }, { status: 400 });

  const updated = await db.drugCatalog.update({ where: { id: drugId }, data });

  await logAudit({
    actorType: "device_operator",
    actorId: editedBy || "pharmacist",
    hospitalId: hospital.id,
    action: "pharmacy.catalog_edited",
    metadata: { drugId, changes: Object.keys(data) },
    ipAddress: getClientIP(request),
  });

  return Response.json({ success: true, drug: updated });
}
