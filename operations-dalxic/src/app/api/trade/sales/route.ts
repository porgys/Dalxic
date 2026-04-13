import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { generateReceiptCode } from "@/lib/receipt";
import { authenticateRequest } from "@/lib/auth";

/**
 * Trade Sales — atomic sale creation with stock decrement.
 *
 * GET:  List sales for an org (paginated, date-filtered)
 * POST: Create a sale (cart -> stock decrement -> receipt — all atomic)
 */

const VALID_PAYMENT_METHODS = ["CASH", "MOBILE_MONEY", "CARD", "CREDIT"];

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { orgId: auth.orgId };
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

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { items, customerName, customerPhone, discount, paymentMethod, paymentRef, paymentStatus, soldBy, soldByName } = body;

    if (!items?.length || !soldBy || !soldByName) {
      return Response.json({ error: "items, soldBy, and soldByName required" }, { status: 400 });
    }

    // Validate items
    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return Response.json({ error: "Each item needs productId and quantity" }, { status: 400 });
      }
      if (typeof item.quantity !== "number" || item.quantity <= 0 || item.quantity > 10000 || !Number.isInteger(item.quantity)) {
        return Response.json({ error: "Quantity must be a positive integer (max 10000)" }, { status: 400 });
      }
    }

    // Validate payment method if provided
    if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return Response.json({ error: `paymentMethod must be one of: ${VALID_PAYMENT_METHODS.join(", ")}` }, { status: 400 });
    }

    // Validate all products exist and have enough stock
    const productIds = items.map((i: { productId: string }) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, orgId: auth.orgId },
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

    // Validate discount
    if (typeof discountAmount !== "number" || discountAmount < 0 || discountAmount > subtotal) {
      return Response.json({ error: "Discount must be non-negative and cannot exceed subtotal" }, { status: 400 });
    }

    const total = subtotal - discountAmount;

    // Generate receipt code: count today's sales + 1
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySalesCount = await db.sale.count({
      where: { orgId: auth.orgId, createdAt: { gte: todayStart } },
    });
    const receiptCode = generateReceiptCode(auth.orgCode, todaySalesCount + 1);

    // Atomic transaction: create sale + items + decrement stock + log movements
    const sale = await db.$transaction(async (tx) => {
      // Create sale
      const newSale = await tx.sale.create({
        data: {
          orgId: auth.orgId,
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
            orgId: auth.orgId,
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
      actorId: auth.operatorId,
      orgId: auth.orgId,
      action: "sale.created",
      metadata: { saleId: sale.id, receiptCode, total, itemCount: saleItems.length },
      ipAddress: getClientIP(request),
    });

    return Response.json(sale, { status: 201 });
  } catch (err: unknown) {
    console.error("API error:", err);
    return Response.json({ error: "An error occurred" }, { status: 500 });
  }
}
