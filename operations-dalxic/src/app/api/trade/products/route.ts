import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Trade Products — CRUD with search, category filter, low stock alerts.
 *
 * GET:   List/search products for an org
 * POST:  Create a new product
 * PATCH: Update product details
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const orgCode = searchParams.get("orgCode");
  const categoryId = searchParams.get("categoryId");
  const search = searchParams.get("search");
  const lowStock = searchParams.get("lowStock") === "true";
  const activeOnly = searchParams.get("activeOnly") !== "false";
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!orgCode) return Response.json({ error: "orgCode required" }, { status: 400 });

  const org = await db.organization.findUnique({ where: { code: orgCode } });
  if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { orgId: org.id };
  if (activeOnly) where.isActive = true;
  if (categoryId) where.categoryId = categoryId;
  if (search) where.name = { contains: search, mode: "insensitive" };

  // Low stock: fetch all then filter in JS (self-referencing column comparison)
  if (lowStock) {
    const products = await db.product.findMany({
      where: { ...where },
      orderBy: { name: "asc" },
      include: { category: { select: { name: true } } },
      take: limit,
      skip: offset,
    });
    // Filter in JS for self-referencing comparison
    const lowStockProducts = products.filter(p => p.stock <= p.minStock);
    return Response.json({ products: lowStockProducts, total: lowStockProducts.length });
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { name: "asc" },
      include: { category: { select: { name: true } } },
      take: limit,
      skip: offset,
    }),
    db.product.count({ where }),
  ]);

  return Response.json({ products, total, limit, offset });
}

export async function POST(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const { orgCode, categoryId, name, sku, unit, costPrice, sellingPrice, stock, minStock, photoUrl, batchNo, expiresAt } = body;

    if (!orgCode || !categoryId || !name?.trim() || sellingPrice === undefined) {
      return Response.json({ error: "orgCode, categoryId, name, and sellingPrice required" }, { status: 400 });
    }

    const org = await db.organization.findUnique({ where: { code: orgCode } });
    if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

    const product = await db.product.create({
      data: {
        orgId: org.id,
        categoryId,
        name: name.trim(),
        sku: sku?.trim() || null,
        unit: unit || "piece",
        costPrice: costPrice || 0,
        sellingPrice,
        stock: stock || 0,
        minStock: minStock ?? 5,
        photoUrl: photoUrl?.trim() || null,
        batchNo: batchNo?.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Log initial stock as a RECEIVED movement
    if (stock && stock > 0) {
      await db.stockMovement.create({
        data: {
          orgId: org.id,
          productId: product.id,
          type: "RECEIVED",
          quantity: stock,
          balanceBefore: 0,
          balanceAfter: stock,
          reference: "initial_stock",
          performedBy: body.operatorId || "system",
        },
      });
    }

    await logAudit({
      actorType: "operator",
      actorId: body.operatorId || "system",
      orgId: org.id,
      action: "product.created",
      metadata: { productId: product.id, name: product.name, sellingPrice },
      ipAddress: getClientIP(request),
    });

    return Response.json(product, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const { id, name, categoryId, sku, unit, costPrice, sellingPrice, minStock, photoUrl, batchNo, expiresAt, isActive } = body;

    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (name?.trim()) updates.name = name.trim();
    if (categoryId) updates.categoryId = categoryId;
    if (sku !== undefined) updates.sku = sku?.trim() || null;
    if (unit) updates.unit = unit;
    if (costPrice !== undefined) updates.costPrice = costPrice;
    if (sellingPrice !== undefined) updates.sellingPrice = sellingPrice;
    if (minStock !== undefined) updates.minStock = minStock;
    if (photoUrl !== undefined) updates.photoUrl = photoUrl?.trim() || null;
    if (batchNo !== undefined) updates.batchNo = batchNo?.trim() || null;
    if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await db.product.update({
      where: { id },
      data: updates,
    });

    return Response.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
