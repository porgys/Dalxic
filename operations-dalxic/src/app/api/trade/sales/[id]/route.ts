import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

/**
 * Single sale — for receipt reprint / detail view.
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const sale = await db.sale.findUnique({
    where: { id },
    include: {
      items: true,
      org: { select: { name: true, code: true, logoUrl: true } },
    },
  });

  if (!sale) return Response.json({ error: "Sale not found" }, { status: 404 });

  // Ensure the sale belongs to the authenticated org
  if (sale.orgId !== auth.orgId) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  return Response.json(sale);
}
