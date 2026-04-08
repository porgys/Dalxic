import { db } from "./db";

/**
 * Auto-close all active books whose month has passed.
 * Run this via a cron job or on application startup.
 */
export async function autoCloseExpiredBooks() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const expired = await db.monthlyBook.findMany({
    where: {
      status: "active",
      OR: [
        { year: { lt: currentYear } },
        { year: currentYear, month: { lt: currentMonth } },
      ],
    },
  });

  for (const book of expired) {
    await db.monthlyBook.update({
      where: { id: book.id },
      data: {
        status: "closed",
        closedAt: new Date(book.year, book.month, 0, 23, 59, 59), // Last moment of that month
      },
    });
  }

  return expired.length;
}
