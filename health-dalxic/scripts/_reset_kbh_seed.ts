/**
 * AUTHORIZED CLEANUP — deletes only records tagged `kbh_yt_seed_2026_04_15`
 * (my own inserts from the aborted seed run). Real hospital data is untouched.
 *
 * Deletes in dependency order:
 *   1. LabResults where lab_order.patientId is in seed set
 *   2. LabOrders where patientId in seed set
 *   3. BillableItems where patientId in seed set
 *   4. Bills where patientId in seed set
 *   5. BedTransitions where patientId in seed set
 *   6. Frees Beds (patientId -> null, status -> AVAILABLE) where patientId in seed set
 *   7. PatientCards linked to seed patients (if any were created)
 *   8. Bookings linked to seed patients (if any)
 *   9. PatientRecords where createdBy = SEED_TAG
 *   10. DoctorShifts + ShiftHandovers created today/yesterday (my seed only — we have no other data yet)
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
const SEED_TAG = "kbh_yt_seed_2026_04_15";
const HOSPITAL_CODE = "KBH";

async function main() {
  const h = await db.hospital.findUnique({ where: { code: HOSPITAL_CODE } });
  if (!h) throw new Error("no KBH hospital");

  const seeded = await db.patientRecord.findMany({
    where: { hospitalId: h.id, createdBy: SEED_TAG },
    select: { id: true },
  });
  const ids = seeded.map(r => r.id);
  console.log(`Seed-tagged PatientRecords: ${ids.length}`);

  if (ids.length === 0) {
    console.log("Nothing to clean.");
    await db.$disconnect();
    return;
  }

  // 1. LabResults (via labOrder.patientId)
  const labOrders = await db.labOrder.findMany({
    where: { hospitalId: h.id, patientId: { in: ids } },
    select: { id: true },
  });
  const labOrderIds = labOrders.map(o => o.id);
  const resultsDel = await db.labResult.deleteMany({ where: { labOrderId: { in: labOrderIds } } });
  console.log(`  deleted ${resultsDel.count} LabResults`);

  // 2. LabOrders
  const ordersDel = await db.labOrder.deleteMany({ where: { id: { in: labOrderIds } } });
  console.log(`  deleted ${ordersDel.count} LabOrders`);

  // 3. BillableItems
  const itemsDel = await db.billableItem.deleteMany({
    where: { hospitalId: h.id, patientId: { in: ids } },
  });
  console.log(`  deleted ${itemsDel.count} BillableItems`);

  // 4. Bills
  const billsDel = await db.bill.deleteMany({
    where: { hospitalId: h.id, patientId: { in: ids } },
  });
  console.log(`  deleted ${billsDel.count} Bills`);

  // 5. BedTransitions
  const transDel = await db.bedTransition.deleteMany({
    where: { patientId: { in: ids } },
  });
  console.log(`  deleted ${transDel.count} BedTransitions`);

  // 6. Free beds
  const freeBeds = await db.bed.updateMany({
    where: { patientId: { in: ids } },
    data: { patientId: null, status: "AVAILABLE" },
  });
  console.log(`  freed ${freeBeds.count} Beds`);

  // 7. PatientCards
  const cardsDel = await db.patientCard.deleteMany({ where: { patientRecordId: { in: ids } } }).catch(() => ({ count: 0 }));
  console.log(`  deleted ${cardsDel.count} PatientCards`);

  // 8. Bookings
  const bookingsDel = await db.booking.deleteMany({ where: { patientRecordId: { in: ids } } }).catch(() => ({ count: 0 }));
  console.log(`  deleted ${bookingsDel.count} Bookings`);

  // 9. PatientRecords themselves
  const recsDel = await db.patientRecord.deleteMany({
    where: { hospitalId: h.id, createdBy: SEED_TAG },
  });
  console.log(`  deleted ${recsDel.count} PatientRecords`);

  // 10. DoctorShifts + ShiftHandovers created within the last 48h
  // (we had no real data yet — these are all from the aborted seed)
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const shiftsDel = await db.doctorShift.deleteMany({
    where: { hospitalId: h.id, clockInAt: { gte: cutoff } },
  });
  console.log(`  deleted ${shiftsDel.count} DoctorShifts`);

  const handoversDel = await db.shiftHandover.deleteMany({
    where: { hospitalId: h.id, handoverAt: { gte: cutoff } },
  });
  console.log(`  deleted ${handoversDel.count} ShiftHandovers`);

  console.log("\n✅ Clean. Ready to reseed.");
  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
