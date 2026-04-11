import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { createBillableItem } from "@/lib/billing";
import { rateLimit } from "@/lib/rate-limit";

// GET: List retail sales
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const status = searchParams.get("status"); // PENDING | PAID | CANCELLED | all

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const where: Record<string, unknown> = { hospitalId: hospital.id, createdAt: { gte: today } };
  if (status && status !== "all") where.paymentStatus = status;

  const sales = await db.retailSale.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const counts = {
    pending: await db.retailSale.count({ where: { hospitalId: hospital.id, createdAt: { gte: today }, paymentStatus: "PENDING" } }),
    paid: await db.retailSale.count({ where: { hospitalId: hospital.id, createdAt: { gte: today }, paymentStatus: "PAID" } }),
    dispensed: await db.retailSale.count({ where: { hospitalId: hospital.id, createdAt: { gte: today }, dispensed: true } }),
  };

  return Response.json({ sales, counts });
}

// POST: Create retail sale + generate receipt code
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { hospitalCode, customerName, customerPhone, items, discount, soldBy } = body;

  if (!hospitalCode || !items?.length) {
    return Response.json({ error: "hospitalCode and items required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // Validate stock for each item and compute totals
  type SaleItem = { drugCatalogId: string; drugName: string; quantity: number; unitPrice: number; total: number; batchId: string };
  const saleItems: SaleItem[] = [];

  for (const item of items) {
    const drug = await db.drugCatalog.findUnique({ where: { id: item.drugCatalogId } });
    if (!drug) return Response.json({ error: `Drug ${item.drugCatalogId} not found` }, { status: 404 });

    // Find best batch (FEFO — first expiry first out)
    const batch = await db.drugStock.findFirst({
      where: { drugCatalogId: drug.id, hospitalId: hospital.id, status: "ACTIVE", quantityRemaining: { gte: Number(item.quantity) } },
      orderBy: { expiryDate: "asc" },
    });

    if (!batch) return Response.json({ error: `Insufficient stock for ${drug.name}` }, { status: 400 });

    saleItems.push({
      drugCatalogId: drug.id,
      drugName: drug.name,
      quantity: Number(item.quantity),
      unitPrice: batch.sellPrice,
      total: batch.sellPrice * Number(item.quantity),
      batchId: batch.id,
    });
  }

  const subtotal = saleItems.reduce((sum, i) => sum + i.total, 0);
  const discountAmt = Number(discount || 0);
  const totalAmount = Math.max(0, subtotal - discountAmt);

  // Generate receipt code: RX-YYYYMMDD-NNNN
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const todayCount = await db.retailSale.count({
    where: { hospitalId: hospital.id, receiptCode: { startsWith: `RX-${dateStr}` } },
  });
  const receiptCode = `RX-${dateStr}-${String(todayCount + 1).padStart(4, "0")}`;

  // Get active book
  const now = new Date();
  const book = await db.monthlyBook.findFirst({
    where: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" },
  });

  const sale = await db.retailSale.create({
    data: {
      hospitalId: hospital.id,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      items: JSON.parse(JSON.stringify(saleItems)),
      subtotal,
      discount: discountAmt,
      totalAmount,
      paymentStatus: "PENDING",
      receiptCode,
      soldBy: soldBy || "pharmacist",
      bookId: book?.id || null,
    },
  });

  // Create billable item for billing workstation to see
  if (book) {
    await createBillableItem({
      hospitalId: hospital.id,
      patientId: sale.id, // retail sale ID as reference
      bookId: book.id,
      serviceType: "DRUG",
      description: `Pharmacy Retail — ${receiptCode}`,
      unitCost: totalAmount,
      quantity: 1,
      renderedBy: soldBy || "pharmacist",
    });
  }

  await logAudit({
    actorType: "device_operator",
    actorId: soldBy || "pharmacist",
    hospitalId: hospital.id,
    action: "pharmacy.retail_sale_created",
    metadata: { saleId: sale.id, receiptCode, itemCount: saleItems.length, totalAmount },
    ipAddress: getClientIP(request),
  });

  return Response.json({ success: true, sale, receiptCode }, { status: 201 });
}

// PATCH: Confirm payment or mark dispensed
export async function PATCH(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { hospitalCode, saleId, action, paymentMethod, operatorId } = body;

  if (!hospitalCode || !saleId || !action) {
    return Response.json({ error: "hospitalCode, saleId, action required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const sale = await db.retailSale.findUnique({ where: { id: saleId } });
  if (!sale || sale.hospitalId !== hospital.id) return Response.json({ error: "Sale not found" }, { status: 404 });

  if (action === "confirm_payment") {
    if (sale.paymentStatus === "PAID") return Response.json({ error: "Already paid" }, { status: 400 });

    await db.retailSale.update({
      where: { id: saleId },
      data: { paymentStatus: "PAID", paymentMethod: paymentMethod || "CASH" },
    });

    // Fire Pusher event for real-time update
    try {
      const pusherUrl = new URL("/api/pusher", request.url);
      await fetch(pusherUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: `hospital-${hospitalCode}`, event: "pharmacy-payment-confirmed", data: { saleId, receiptCode: sale.receiptCode } }),
      });
    } catch { /* non-blocking */ }

    await logAudit({
      actorType: "device_operator",
      actorId: operatorId || "billing_officer",
      hospitalId: hospital.id,
      action: "pharmacy.retail_payment_confirmed",
      metadata: { saleId, receiptCode: sale.receiptCode, paymentMethod },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true });
  }

  if (action === "dispense") {
    if (sale.paymentStatus !== "PAID") return Response.json({ error: "Payment not confirmed — cannot dispense" }, { status: 400 });
    if (sale.dispensed) return Response.json({ error: "Already dispensed" }, { status: 400 });

    // Deduct stock using FEFO for each item
    const saleItems = sale.items as Array<{ drugCatalogId: string; quantity: number; batchId: string; drugName: string }>;
    for (const item of saleItems) {
      const batch = await db.drugStock.findUnique({ where: { id: item.batchId } });
      if (!batch || batch.quantityRemaining < item.quantity) {
        return Response.json({ error: `Insufficient stock for ${item.drugName}` }, { status: 400 });
      }

      const newQty = batch.quantityRemaining - item.quantity;
      await db.drugStock.update({
        where: { id: batch.id },
        data: { quantityRemaining: newQty, status: newQty === 0 ? "DEPLETED" : "ACTIVE" },
      });

      await db.stockMovement.create({
        data: {
          hospitalId: hospital.id, drugStockId: batch.id, drugCatalogId: item.drugCatalogId,
          type: "DISPENSED_RETAIL", quantity: item.quantity,
          balanceBefore: batch.quantityRemaining, balanceAfter: newQty,
          reference: saleId, performedBy: operatorId || "pharmacist",
          notes: `Retail sale ${sale.receiptCode}`,
        },
      });
    }

    await db.retailSale.update({
      where: { id: saleId },
      data: { dispensed: true, dispensedAt: new Date(), dispensedBy: operatorId || "pharmacist" },
    });

    await logAudit({
      actorType: "device_operator",
      actorId: operatorId || "pharmacist",
      hospitalId: hospital.id,
      action: "pharmacy.retail_dispensed",
      metadata: { saleId, receiptCode: sale.receiptCode },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true });
  }

  if (action === "cancel") {
    if (sale.dispensed) return Response.json({ error: "Cannot cancel — already dispensed" }, { status: 400 });

    await db.retailSale.update({ where: { id: saleId }, data: { paymentStatus: "CANCELLED" } });

    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action. Use: confirm_payment, dispense, cancel" }, { status: 400 });
}
