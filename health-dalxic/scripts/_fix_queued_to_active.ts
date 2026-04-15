/**
 * UPDATE-only fix: convert visitStatus "queued" → "active" on seeded records.
 * Waiting room filters on "active"; "queued" wasn't recognized so patients were invisible.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const h = await db.hospital.findUnique({ where: { code: "KBH" } });
  if (!h) throw new Error("no KBH");
  const recs = await db.patientRecord.findMany({
    where: { hospitalId: h.id, createdBy: { in: ["kbh_live_2026_04_15", "kbh_yest_2026_04_14"] } },
    select: { id: true, visit: true },
  });
  let fixed = 0;
  for (const r of recs) {
    const v = (r.visit as Record<string, unknown>) || {};
    if (v.visitStatus === "queued") {
      await db.patientRecord.update({
        where: { id: r.id },
        data: { visit: { ...v, visitStatus: "active" } },
      });
      fixed++;
    }
  }
  console.log(`✓ Updated ${fixed} records: queued → active`);
  await db.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
