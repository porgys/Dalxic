import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

// GET: Inventory with expiry alerts
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const drugCatalogId = searchParams.get("drugCatalogId");
  const expiryAlert = searchParams.get("expiryAlert"); // "30" | "90" — show batches expiring within N days

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const where: Record<string, unknown> = { hospitalId: hospital.id, status: "ACTIVE" };
  if (drugCatalogId) where.drugCatalogId = drugCatalogId;
  if (expiryAlert) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + Number(expiryAlert));
    where.expiryDate = { lte: cutoff };
    where.quantityRemaining = { gt: 0 };
  }

  const stocks = await db.drugStock.findMany({
    where,
    orderBy: { expiryDate: "asc" },
    include: { drugCatalog: { select: { name: true, genericName: true, category: true, unit: true, minStockThreshold: true } } },
  });

  const inventory = stocks.map((s) => {
    const daysToExpiry = Math.ceil((s.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return {
      id: s.id,
      drugCatalogId: s.drugCatalogId,
      drugName: s.drugCatalog.name,
      genericName: s.drugCatalog.genericName,
      category: s.drugCatalog.category,
      unit: s.drugCatalog.unit,
      batchNumber: s.batchNumber,
      expiryDate: s.expiryDate,
      daysToExpiry,
      expiryStatus: daysToExpiry <= 0 ? "EXPIRED" : daysToExpiry <= 30 ? "CRITICAL" : daysToExpiry <= 90 ? "WARNING" : "OK",
      quantityReceived: s.quantityReceived,
      quantityRemaining: s.quantityRemaining,
      costPrice: s.costPrice,
      sellPrice: s.sellPrice,
      supplier: s.supplier,
      receivedAt: s.receivedAt,
      receivedBy: s.receivedBy,
      status: s.status,
    };
  });

  // Auto-expire batches past their date
  const expired = stocks.filter((s) => s.expiryDate.getTime() < Date.now() && s.status === "ACTIVE");
  if (expired.length > 0) {
    await db.drugStock.updateMany({
      where: { id: { in: expired.map((s) => s.id) } },
      data: { status: "EXPIRED" },
    });
    for (const s of expired) {
      await db.stockMovement.create({
        data: {
          hospitalId: hospital.id, drugStockId: s.id, drugCatalogId: s.drugCatalogId,
          type: "EXPIRED", quantity: s.quantityRemaining,
          balanceBefore: s.quantityRemaining, balanceAfter: 0,
          performedBy: "system", notes: `Auto-expired batch ${s.batchNumber}`,
        },
      });
    }
  }

  return Response.json({ inventory, total: inventory.length, expiredCount: expired.length });
}

// POST: Receive new stock batch
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { hospitalCode, drugCatalogId, batchNumber, expiryDate, quantity, costPrice, sellPrice, supplier, receivedBy } = body;

  if (!hospitalCode || !drugCatalogId || !batchNumber || !expiryDate || !quantity) {
    return Response.json({ error: "hospitalCode, drugCatalogId, batchNumber, expiryDate, quantity required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const drug = await db.drugCatalog.findUnique({ where: { id: drugCatalogId } });
  if (!drug || drug.hospitalId !== hospital.id) return Response.json({ error: "Drug not found in catalog" }, { status: 404 });

  const stock = await db.drugStock.create({
    data: {
      hospitalId: hospital.id,
      drugCatalogId,
      batchNumber,
      expiryDate: new Date(expiryDate),
      quantityReceived: Number(quantity),
      quantityRemaining: Number(quantity),
      costPrice: Number(costPrice || drug.costPrice),
      sellPrice: Number(sellPrice || drug.defaultPrice),
      supplier: supplier || null,
      receivedBy: receivedBy || "pharmacist",
    },
  });

  await db.stockMovement.create({
    data: {
      hospitalId: hospital.id, drugStockId: stock.id, drugCatalogId,
      type: "RECEIVED", quantity: Number(quantity),
      balanceBefore: 0, balanceAfter: Number(quantity),
      performedBy: receivedBy || "pharmacist",
      notes: `Batch ${batchNumber} from ${supplier || "unknown supplier"}`,
    },
  });

  await logAudit({
    actorType: "device_operator",
    actorId: receivedBy || "pharmacist",
    hospitalId: hospital.id,
    action: "pharmacy.stock_received",
    metadata: { drugId: drugCatalogId, drugName: drug.name, batchNumber, quantity, supplier },
    ipAddress: getClientIP(request),
  });

  return Response.json({ success: true, stock }, { status: 201 });
}

// PATCH: Adjust quantity or mark expired
export async function PATCH(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { hospitalCode, stockId, action, quantity, reason, adjustedBy } = body;

  if (!hospitalCode || !stockId || !action) {
    return Response.json({ error: "hospitalCode, stockId, action required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const stock = await db.drugStock.findUnique({ where: { id: stockId } });
  if (!stock || stock.hospitalId !== hospital.id) return Response.json({ error: "Stock batch not found" }, { status: 404 });

  if (action === "adjust") {
    const newQty = Number(quantity);
    if (isNaN(newQty) || newQty < 0) return Response.json({ error: "Valid quantity required" }, { status: 400 });

    await db.stockMovement.create({
      data: {
        hospitalId: hospital.id, drugStockId: stockId, drugCatalogId: stock.drugCatalogId,
        type: "ADJUSTED", quantity: Math.abs(newQty - stock.quantityRemaining),
        balanceBefore: stock.quantityRemaining, balanceAfter: newQty,
        performedBy: adjustedBy || "pharmacist", notes: reason || "Manual adjustment",
      },
    });

    await db.drugStock.update({
      where: { id: stockId },
      data: { quantityRemaining: newQty, status: newQty === 0 ? "DEPLETED" : "ACTIVE" },
    });

    return Response.json({ success: true });
  }

  if (action === "expire") {
    await db.stockMovement.create({
      data: {
        hospitalId: hospital.id, drugStockId: stockId, drugCatalogId: stock.drugCatalogId,
        type: "EXPIRED", quantity: stock.quantityRemaining,
        balanceBefore: stock.quantityRemaining, balanceAfter: 0,
        performedBy: adjustedBy || "pharmacist", notes: reason || "Manually marked expired",
      },
    });

    await db.drugStock.update({ where: { id: stockId }, data: { status: "EXPIRED", quantityRemaining: 0 } });

    await logAudit({
      actorType: "device_operator",
      actorId: adjustedBy || "pharmacist",
      hospitalId: hospital.id,
      action: "pharmacy.stock_expired",
      metadata: { stockId, batchNumber: stock.batchNumber },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action. Use: adjust, expire" }, { status: 400 });
}
