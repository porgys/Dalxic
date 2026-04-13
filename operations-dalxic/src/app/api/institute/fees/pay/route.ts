import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

/**
 * Fee Payment — record a payment against a fee record.
 * Atomic: creates payment + updates fee record balance + status.
 *
 * POST: Record a fee payment
 */

const VALID_PAYMENT_METHODS = ["CASH", "MOMO", "BANK", "CHEQUE"];

export async function POST(request: Request) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { feeRecordId, amount, paymentMethod, paymentRef, notes } = body;

    if (!feeRecordId || !amount || !paymentMethod) {
      return Response.json({ error: "feeRecordId, amount, and paymentMethod required" }, { status: 400 });
    }

    // Validate amount is a positive integer
    if (typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
      return Response.json({ error: "Amount must be a positive integer" }, { status: 400 });
    }

    // Validate payment method
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return Response.json({ error: `paymentMethod must be one of: ${VALID_PAYMENT_METHODS.join(", ")}` }, { status: 400 });
    }

    const feeRecord = await db.feeRecord.findUnique({ where: { id: feeRecordId } });
    if (!feeRecord) return Response.json({ error: "Fee record not found" }, { status: 404 });

    // Ensure fee record belongs to authenticated org
    if (feeRecord.orgId !== auth.orgId) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

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
          receivedBy: auth.operatorId,
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
      actorId: auth.operatorId,
      orgId: auth.orgId,
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
    console.error("API error:", err);
    return Response.json({ error: "An error occurred" }, { status: 500 });
  }
}
