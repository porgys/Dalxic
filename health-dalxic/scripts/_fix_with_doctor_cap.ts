/**
 * Balance with_doctor: exactly 1 patient per active doctor.
 * Prefers pediatric patients for pediatric doctor.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const h = await db.hospital.findUnique({ where: { code: "KBH" } });
  if (!h) throw new Error("no KBH");
  const doctors = await db.doctor.findMany({ where: { hospitalId: h.id } });

  const recs = await db.patientRecord.findMany({
    where: { hospitalId: h.id, createdBy: "kbh_live_2026_04_15" },
    orderBy: { createdAt: "asc" },
  });

  // Step 1: demote excess with_doctor to active
  const byDoctor: Record<string, string[]> = {};
  for (const r of recs) {
    const v = (r.visit as Record<string, unknown>) || {};
    if (v.visitStatus === "with_doctor" && v.assignedDoctorId) {
      (byDoctor[v.assignedDoctorId as string] ??= []).push(r.id);
    }
  }
  let demoted = 0;
  for (const [docId, ids] of Object.entries(byDoctor)) {
    for (const rid of ids.slice(1)) {
      const r = recs.find(x => x.id === rid)!;
      const v = (r.visit as Record<string, unknown>) || {};
      await db.patientRecord.update({
        where: { id: rid },
        data: { visit: { ...v, visitStatus: "active", assignedDoctorId: null, assignedDoctorName: null } },
      });
      demoted++;
    }
  }
  console.log(`Demoted ${demoted} excess consultations`);

  // Step 2: ensure every doctor has exactly 1 in consultation
  for (const doc of doctors) {
    const has = (byDoctor[doc.id] ?? []).length > 0;
    if (has) continue;
    // find an active patient — prefer matching specialty
    const preferPeds = doc.specialty.toLowerCase().includes("ped");
    const fresh = await db.patientRecord.findMany({
      where: { hospitalId: h.id, createdBy: "kbh_live_2026_04_15" },
      orderBy: { createdAt: "asc" },
    });
    const candidates = fresh.filter(r => {
      const v = (r.visit as Record<string, unknown>) || {};
      if (v.visitStatus !== "active") return false;
      const dept = v.department as string;
      return preferPeds ? dept === "pediatrics" : dept === "general";
    });
    const pick = candidates[0] ?? fresh.find(r => ((r.visit as Record<string, unknown>) || {}).visitStatus === "active");
    if (!pick) { console.log(`  ${doc.name}: no candidate`); continue; }
    const pv = (pick.visit as Record<string, unknown>) || {};
    await db.patientRecord.update({
      where: { id: pick.id },
      data: { visit: { ...pv, visitStatus: "with_doctor", assignedDoctorId: doc.id, assignedDoctorName: doc.name } },
    });
    console.log(`  ${doc.name}: promoted ${pv.queueToken} (${pv.department})`);
  }

  console.log("\n✓ Consultation balanced");
  await db.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
