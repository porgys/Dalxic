import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

/**
 * Trade Analytics — revenue, top sellers, trends.
 *
 * GET: Dashboard analytics for an org
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "today"; // today | week | month
  const view = searchParams.get("view"); // "top_sellers" | "category_breakdown" | "daily_revenue"

  // Calculate date range
  const now = new Date();
  let startDate: Date;
  if (period === "week") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1);
  } else {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  }

  // Top sellers
  if (view === "top_sellers") {
    const saleItems = await db.saleItem.findMany({
      where: {
        sale: {
          orgId: auth.orgId,
          createdAt: { gte: startDate },
          paymentStatus: { not: "REFUNDED" },
        },
      },
    });

    // Aggregate by product
    const productTotals = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const item of saleItems) {
      const existing = productTotals.get(item.productId) || { name: item.productName, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.total;
      productTotals.set(item.productId, existing);
    }

    const topSellers = Array.from(productTotals.entries())
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return Response.json({ topSellers, period });
  }

  // Category breakdown
  if (view === "category_breakdown") {
    const saleItems = await db.saleItem.findMany({
      where: {
        sale: {
          orgId: auth.orgId,
          createdAt: { gte: startDate },
          paymentStatus: { not: "REFUNDED" },
        },
      },
      include: {
        product: {
          select: { category: { select: { id: true, name: true } } },
        },
      },
    });

    const categoryTotals = new Map<string, { name: string; revenue: number; count: number }>();
    for (const item of saleItems) {
      const cat = item.product.category;
      const existing = categoryTotals.get(cat.id) || { name: cat.name, revenue: 0, count: 0 };
      existing.revenue += item.total;
      existing.count += item.quantity;
      categoryTotals.set(cat.id, existing);
    }

    const breakdown = Array.from(categoryTotals.entries())
      .map(([categoryId, data]) => ({ categoryId, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    return Response.json({ categories: breakdown, period });
  }

  // Daily revenue (for chart)
  if (view === "daily_revenue") {
    const sales = await db.sale.findMany({
      where: {
        orgId: auth.orgId,
        createdAt: { gte: startDate },
        paymentStatus: { not: "REFUNDED" },
      },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const dailyMap = new Map<string, number>();
    for (const sale of sales) {
      const day = sale.createdAt.toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) || 0) + sale.total);
    }

    const dailyRevenue = Array.from(dailyMap.entries())
      .map(([date, revenue]) => ({ date, revenue }));

    return Response.json({ dailyRevenue, period });
  }

  // Default: dashboard summary
  const [salesCount, salesData, pendingPayments, todayStart] = await Promise.all([
    db.sale.count({
      where: { orgId: auth.orgId, createdAt: { gte: startDate }, paymentStatus: { not: "REFUNDED" } },
    }),
    db.sale.findMany({
      where: { orgId: auth.orgId, createdAt: { gte: startDate }, paymentStatus: { not: "REFUNDED" } },
      select: { total: true, discount: true },
    }),
    db.sale.count({
      where: { orgId: auth.orgId, paymentStatus: "PENDING" },
    }),
    Promise.resolve((() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })()),
  ]);

  const totalRevenue = salesData.reduce((sum, s) => sum + s.total, 0);
  const totalDiscount = salesData.reduce((sum, s) => sum + s.discount, 0);
  const averageOrder = salesCount > 0 ? Math.round(totalRevenue / salesCount) : 0;

  // Today's sales count
  const todaySales = await db.sale.count({
    where: { orgId: auth.orgId, createdAt: { gte: todayStart }, paymentStatus: { not: "REFUNDED" } },
  });

  return Response.json({
    period,
    totalRevenue,
    totalDiscount,
    salesCount,
    averageOrder,
    pendingPayments,
    todaySales,
  });
}
