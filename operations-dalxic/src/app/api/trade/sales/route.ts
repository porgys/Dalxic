import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { generateReceiptCode } from "@/lib/receipt";

/**
 * Trade Sales — atomic sale creation with stock decrement.
 *
 * GET:  List sales for an org (paginated, date-filtered)
 * POST: Create a sale (cart → stock decrement → receipt — all atomic)
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const orgCode = searchParams.get("orgCode");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!orgCode) return Response.json({ error: "orgCode required" }, { status: 400 });

  const org = await db.organization.findUnique({ where: { code: orgCode } });
  if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { orgId: org.id };
  if (status) where.paymentStatus = status;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [sales, total] = await Promise.all([
    db.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: limit,
      skip: offset,
    }),
    db.sale.count({ where }),
  ]);

  return Response.json({ sales, total, limit, offset });
}

export async function POST(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const { orgCode, items, customerName, customerPhone, discount, paymentMethod, paymentRef, paymentStatus, soldBy, soldByName } = body;

    if (!orgCode || !items?.length || !soldBy || !soldByName) {
      return Response.json({ error: "orgCode, items, soldBy, and soldByName required" }, { status: 400 });
    }

    const org = await db.organization.findUnique({ where: { code: orgCode } });
    if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

    // Validate all products exist and have enough stock
    const productIds = items.map((i: { productId: string }) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, orgId: org.id },
    });

    if (products.length !== productIds.length) {
      return Response.json({ error: "One or more products not found" }, { status: 404 });
    }

    const productMap = new Map(products.map(p => [p.id, p]));
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) continue;
      if (product.stock < item.quantity) {
        return Response.json({
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${item.quantity}`,
        }, { status: 400 });
      }
    }

    // Calculate totals
    let subtotal = 0;
    const saleItems = items.map((item: { productId: string; quantity: number }) => {
      const product = productMap.get(item.productId)!;
      const itemTotal = product.sellingPrice * item.quantity;
      subtotal += itemTotal;
      return {
        productId: item.productId,
        productName: product.name,
        unitPrice: product.sellingPrice,
        quantity: item.quantity,
        total: itemTotal,
      };
    });

    const discountAmount = discount || 0;
    const total = subtotal - discountAmount;

    // Generate receipt code: count today's sales + 1
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySalesCount = await db.sale.count({
      where: { orgId: org.id, createdAt: { gte: todayStart } },
    });
    const receiptCode = generateReceiptCode(org.code, todaySalesCount + 1);

    // Atomic transaction: create sale + items + decrement stock + log movements
    const sale = await db.$transaction(async (tx) => {
      // Create sale
      const newSale = await tx.sale.create({
        data: {
          orgId: org.id,
          receiptCode,
          customerName: customerName?.trim() || null,
          customerPhone: customerPhone?.trim() || null,
          subtotal,
          discount: discountAmount,
          total,
          paymentMethod: paymentMethod || null,
          paymentRef: paymentRef?.trim() || null,
          paymentStatus: paymentStatus || "PAID",
          soldBy,
          soldByName,
          items: { create: saleItems },
        },
        include: { items: true },
      });

      // Decrement stock + create movements
      for (const item of saleItems) {
        const product = productMap.get(item.productId)!;
        const newStock = product.stock - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        });

        await tx.stockMovement.create({
          data: {
            orgId: org.id,
            productId: item.productId,
            type: "SOLD",
            quantity: item.quantity,
            balanceBefore: product.stock,
            balanceAfter: newStock,
            reference: receiptCode,
            performedBy: soldBy,
          },
        });
      }

      return newSale;
    });

    await logAudit({
      actorType: "operator",
      actorId: soldBy,
      orgId: org.id,
      action: "sale.created",
      metadata: { saleId: sale.id, receiptCode, total, itemCount: saleItems.length },
      ipAddress: getClientIP(request),
    });

    return Response.json(sale, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[sales] POST error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
