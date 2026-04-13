import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Fee Payment — record a payment against a fee record.
 * Atomic: creates payment + updates fee record balance + status.
 *
 * POST: Record a fee payment
 */

export async function POST(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const { feeRecordId, amount, paymentMethod, paymentRef, receivedBy, notes } = body;

    if (!feeRecordId || !amount || !paymentMethod || !receivedBy) {
      return Response.json({ error: "feeRecordId, amount, paymentMethod, and receivedBy required" }, { status: 400 });
    }

    if (amount <= 0) {
      return Response.json({ error: "Amount must be positive" }, { status: 400 });
    }

    const feeRecord = await db.feeRecord.findUnique({ where: { id: feeRecordId } });
    if (!feeRecord) return Response.json({ error: "Fee record not found" }, { status: 404 });

    if (feeRecord.balance <= 0) {
      return Response.json({ error: "Fee is already fully paid" }, { status: 400 });
    }

    // Cap payment at remaining balance
    const paymentAmount = Math.min(amount, feeRecord.balance);
    const newPaid = feeRecord.paid + paymentAmount;
    const newBalance = feeRecord.amount - newPaid;
    const newStatus = newBalance <= 0 ? "PAID" : "PARTIAL";

    // Atomic transaction
    const result = await db.$transaction(async (tx) => {
      const payment = await tx.feePayment.create({
        data: {
          feeRecordId,
          amount: paymentAmount,
          paymentMethod,
          paymentRef: paymentRef?.trim() || null,
          receivedBy,
          notes: notes?.trim() || null,
        },
      });

      const updatedRecord = await tx.feeRecord.update({
        where: { id: feeRecordId },
        data: {
          paid: newPaid,
          balance: newBalance,
          status: newStatus,
        },
        include: { payments: { orderBy: { receivedAt: "desc" } } },
      });

      return { payment, feeRecord: updatedRecord };
    });

    await logAudit({
      actorType: "operator",
      actorId: receivedBy,
      orgId: feeRecord.orgId,
      action: "fee.payment_received",
      metadata: {
        feeRecordId,
        paymentId: result.payment.id,
        amount: paymentAmount,
        paymentMethod,
        newBalance,
        newStatus,
      },
      ipAddress: getClientIP(request),
    });

    return Response.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[fees/pay] POST error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
