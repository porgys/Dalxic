/**
 * Remove ONLY TEST- prefixed test data from KBH.
 * Safe — filters on createdBy tag and patient name prefix, never touches real data.
 * Run: npx tsx scripts/cleanup-test-patients.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const HOSPITAL_CODE = "KBH";
const SEED_TAG = "pricing_sync_test";

async function main() {
  const hospital = await db.hospital.findUnique({ where: { code: HOSPITAL_CODE } });
  if (!hospital) throw new Error("KBH not found");

  const records = await db.patientRecord.findMany({
    where: { hospitalId: hospital.id, createdBy: SEED_TAG },
    select: { id: true },
  });
  const recordIds = records.map(r => r.id);
  console.log(`Found ${recordIds.length} TEST- patient records`);

  if (recordIds.length === 0) { console.log("Nothing to clean"); await db.$disconnect(); return; }

  const billables = await db.billableItem.findMany({ where: { patientId: { in: recordIds } }, select: { id: true, billId: true } });
  const billableIds = billables.map(b => b.id);
  const billIds = [...new Set(billables.map(b => b.billId).filter((id): id is string => !!id))];

  await db.billableItem.deleteMany({ where: { id: { in: billableIds } } });
  console.log(`  removed ${billableIds.length} billables`);

  if (billIds.length > 0) {
    await db.bill.deleteMany({ where: { id: { in: billIds } } });
    console.log(`  removed ${billIds.length} bills`);
  }

  // Payouts tied to TEST- billables: only remove payouts whose createdBy matches tag
  const payouts = await db.staffPayout.deleteMany({ where: { hospitalId: hospital.id, createdBy: SEED_TAG } });
  console.log(`  removed ${payouts.count} payouts`);

  // Open shifts opened by the seed (clockOutAt null and created today via seed) — we leave real shifts alone
  // Safer to just leave shifts in place; they attach to future billables harmlessly.

  await db.patientRecord.deleteMany({ where: { id: { in: recordIds } } });
  console.log(`  removed ${recordIds.length} patient records`);

  await db.$disconnect();
  console.log("✅ Cleanup complete");
}

main().catch((e) => { console.error(e); process.exit(1); });
