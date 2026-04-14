import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
async function main() {
  const h = await db.hospital.findUnique({ where: { code: "KBH" } });
  if (!h) return;
  const reopened = await db.monthlyBook.updateMany({
    where: { hospitalId: h.id, status: "closed" },
    data: { status: "active", closedAt: null },
  });
  console.log("Reopened books:", reopened.count);
  const books = await db.monthlyBook.findMany({ where: { hospitalId: h.id }, orderBy: [{ year: "desc" }, { month: "desc" }] });
  console.log(books.map(b => ({ year: b.year, month: b.month, status: b.status })));
  await db.$disconnect();
}
main();
