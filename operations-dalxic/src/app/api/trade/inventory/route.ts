import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

/**
 * Inventory management — stock overview, adjustments, alerts.
 *
 * GET:  Stock overview with low stock alerts, expiring items
 * POST: Stock adjustment (receive, return, adjust, expire)
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view"); // "low_stock" | "expiring" | "movements"
  const productId = searchParams.get("productId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  // Low stock items
  if (view === "low_stock") {
    const products = await db.product.findMany({
      where: { orgId: auth.orgId, isActive: true },
      include: { category: { select: { name: true } } },
      orderBy: { stock: "asc" },
    });
    const lowStock = products.filter(p => p.stock <= p.minStock);
    return Response.json({ products: lowStock, total: lowStock.length });
  }

  // Expiring within 30 days
  if (view === "expiring") {
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const expiring = await db.product.findMany({
      where: {
        orgId: auth.orgId,
        isActive: true,
        expiresAt: { lte: thirtyDays, not: null },
      },
      include: { category: { select: { name: true } } },
      orderBy: { expiresAt: "asc" },
      take: limit,
    });
    return Response.json({ products: expiring, total: expiring.length });
  }

  // Stock movements for a specific product
  if (view === "movements" && productId) {
    const movements = await db.stockMovement.findMany({
      where: { orgId: auth.orgId, productId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return Response.json({ movements });
  }

  // Default: full stock overview
  const [totalProducts, totalValue, lowStockCount, categories] = await Promise.all([
    db.product.count({ where: { orgId: auth.orgId, isActive: true } }),
    db.product.findMany({
      where: { orgId: auth.orgId, isActive: true },
      select: { stock: true, costPrice: true },
    }),
    db.product.findMany({
      where: { orgId: auth.orgId, isActive: true },
    }).then(products => products.filter(p => p.stock <= p.minStock).length),
    db.category.count({ where: { orgId: auth.orgId, isActive: true } }),
  ]);

  const stockValue = totalValue.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);

  return Response.json({
    totalProducts,
    totalStockValue: stockValue,
    lowStockCount,
    categories,
  });
}

export async function POST(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { productId, type, quantity, notes } = body;

    if (!productId || !type || !quantity) {
      return Response.json({ error: "productId, type, and quantity required" }, { status: 400 });
    }

    if (!["RECEIVED", "ADJUSTED", "RETURNED", "EXPIRED"].includes(type)) {
      return Response.json({ error: "type must be RECEIVED, ADJUSTED, RETURNED, or EXPIRED" }, { status: 400 });
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product || product.orgId !== auth.orgId) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    // Calculate new stock
    let newStock: number;
    if (type === "RECEIVED" || type === "RETURNED") {
      newStock = product.stock + quantity;
    } else if (type === "EXPIRED") {
      newStock = Math.max(0, product.stock - quantity);
    } else {
      // ADJUSTED — quantity is the absolute new value
      newStock = quantity;
    }

    // Atomic update
    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      await tx.stockMovement.create({
        data: {
          orgId: auth.orgId,
          productId,
          type,
          quantity: type === "ADJUSTED" ? Math.abs(newStock - product.stock) : quantity,
          balanceBefore: product.stock,
          balanceAfter: newStock,
          notes: notes?.trim() || null,
          performedBy: auth.operatorId,
        },
      });
    });

    await logAudit({
      actorType: "operator",
      actorId: auth.operatorId,
      orgId: auth.orgId,
      action: `inventory.${type.toLowerCase()}`,
      metadata: { productId, productName: product.name, quantity, balanceBefore: product.stock, balanceAfter: newStock },
      ipAddress: getClientIP(request),
    });

    return Response.json({ productId, name: product.name, previousStock: product.stock, newStock, type });
  } catch (err: unknown) {
    console.error("API error:", err);
    return Response.json({ error: "An error occurred" }, { status: 500 });
  }
}
