import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
// GET: List books for a hospital
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get("hospitalId");

  if (!hospitalId) {
    return Response.json({ error: "hospitalId required" }, { status: 400 });
  }

  const books = await db.monthlyBook.findMany({
    where: { hospitalId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      _count: { select: { patientRecords: true } },
    },
  });

  return Response.json(books);
}

// POST: Close a book (auto-close or manual)
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { bookId, actorId } = body;

  if (!bookId || !actorId) {
    return Response.json({ error: "bookId and actorId required" }, { status: 400 });
  }

  const book = await db.monthlyBook.findUnique({ where: { id: bookId } });
  if (!book) {
    return Response.json({ error: "Book not found" }, { status: 404 });
  }

  if (book.status === "closed") {
    return Response.json({ error: "Book already closed" }, { status: 409 });
  }

  const closed = await db.monthlyBook.update({
    where: { id: bookId },
    data: { status: "closed", closedAt: new Date() },
  });

  await logAudit({
    actorType: "hospital_admin",
    actorId,
    hospitalId: book.hospitalId,
    action: "book.closed",
    metadata: { year: book.year, month: book.month },
    ipAddress: getClientIP(request),
  });

  return Response.json(closed);
}
