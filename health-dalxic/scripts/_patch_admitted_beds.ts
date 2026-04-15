/**
 * Patch: assign beds to seeded admitted patients with cross-ward fallback.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
const SEED_TAG = "kbh_live_2026_04_15";
const HOSPITAL_CODE = "KBH";

// Prioritized ward type list per dept — first match wins; later ones are fallback
function wardPreference(dept: string, gender: string): string[] {
  if (dept === "pediatrics") return ["pediatric", "general"];
  if (dept === "obstetrics") return ["maternity", "general"];
  if (dept === "emergency")  return ["emergency", "general"];
  if (dept === "surgery")    return ["surgical", "general"];
  return ["general", "private"];
}

async function findBedByType(hospitalId: string, type: string, wardNameHint?: string) {
  const wards = await db.ward.findMany({
    where: { hospitalId, isActive: true, type },
    orderBy: { name: "asc" },
  });
  for (const w of wards) {
    // If caller provides gender hint, prefer ward whose name matches it
    const rooms = await db.room.findMany({ where: { wardId: w.id } });
    for (const r of rooms) {
      const bed = await db.bed.findFirst({ where: { roomId: r.id, status: "available" }, orderBy: { label: "asc" } });
      if (bed) return { bed, ward: w };
    }
  }
  return null;
}

async function main() {
  const h = await db.hospital.findUnique({ where: { code: HOSPITAL_CODE } });
  if (!h) throw new Error("no KBH");
  const nurse = await db.deviceOperator.findFirst({ where: { hospitalId: h.id, role: "nurse", isActive: true } });

  // Unwind any broken prior assignments
  const seededIds = (await db.patientRecord.findMany({
    where: { hospitalId: h.id, createdBy: SEED_TAG }, select: { id: true },
  })).map(r => r.id);
  const unwound = await db.bed.updateMany({
    where: { patientId: { in: seededIds } },
    data: { status: "available", patientId: null },
  });
  console.log(`Unwound ${unwound.count} bed(s)`);

  const admitted = (await db.patientRecord.findMany({
    where: { hospitalId: h.id, createdBy: SEED_TAG },
  })).filter(r => (r.visit as { visitStatus?: string } | null)?.visitStatus === "admitted");
  console.log(`Admitted seeded patients: ${admitted.length}`);

  let assigned = 0;
  for (const r of admitted) {
    const v = r.visit as Record<string, unknown>;
    const p = r.patient as Record<string, unknown>;
    const dept = (v.department as string) || "general";
    const gender = (p.gender as string) || "male";

    let placement: Awaited<ReturnType<typeof findBedByType>> = null;
    for (const type of wardPreference(dept, gender)) {
      placement = await findBedByType(h.id, type);
      if (placement) break;
    }

    if (!placement) {
      console.log(`  ✗ ${dept.padEnd(12)} — no bed anywhere`);
      continue;
    }

    const { bed, ward } = placement;
    await db.bed.update({ where: { id: bed.id }, data: { status: "occupied", patientId: r.id } });
    await db.bedTransition.create({
      data: {
        bedId: bed.id, fromStatus: "available", toStatus: "occupied",
        triggeredBy: nurse?.name ?? "Ward Nurse", patientId: r.id,
      },
    });
    await db.patientRecord.update({
      where: { id: r.id },
      data: { visit: { ...v, wardName: ward.name, bedId: bed.id, bedLabel: bed.label } },
    });
    assigned++;
    console.log(`  ✓ ${dept.padEnd(12)} → ${ward.name} bed ${bed.label}`);
  }

  console.log(`\n✅ Assigned ${assigned}/${admitted.length} beds`);
  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
