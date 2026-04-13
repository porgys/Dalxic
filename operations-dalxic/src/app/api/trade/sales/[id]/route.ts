import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Single sale — for receipt reprint / detail view.
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = rateLimit(request);
  if (blocked) return blocked;

  const { id } = await params;

  const sale = await db.sale.findUnique({
    where: { id },
    include: {
      items: true,
      org: { select: { name: true, code: true, logoUrl: true } },
    },
  });

  if (!sale) return Response.json({ error: "Sale not found" }, { status: 404 });

  return Response.json(sale);
}
