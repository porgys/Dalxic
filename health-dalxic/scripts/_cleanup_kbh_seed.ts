/**
 * UPDATE-only fix for existing SEED_TAG records:
 *  1. Rebalance "with_doctor" overflow → queued
 *  2. Null assignedDoctorId on queued patients
 *  3. Rewrite queueToken into "{DEPT}-KBH-{NUM}" format
 *  4. Clean patient fullName (drop "KBH-T034-" prefix)
 *
 * Pure UPDATE. No deletes. Safe under data-protection rules.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
const SEED_TAG = "kbh_yt_seed_2026_04_15";
const HOSPITAL_CODE = "KBH";

function deptCodeFor(dept: string): string {
  return (
    dept === "pediatrics" ? "PEDS" :
    dept === "obstetrics" ? "OB" :
    dept === "surgery"    ? "SUR" :
    dept === "dental"     ? "DEN" :
    dept === "eye"        ? "EYE" :
    dept === "ent"        ? "ENT" :
    dept === "emergency"  ? "ER"  : "GEN"
  );
}

async function main() {
  const h = await db.hospital.findUnique({ where: { code: HOSPITAL_CODE } });
  if (!h) throw new Error("no KBH");
  const doctors = await db.doctor.findMany({ where: { hospitalId: h.id } });
  console.log(`KBH has ${doctors.length} doctors`);

  const recs = await db.patientRecord.findMany({
    where: { hospitalId: h.id, createdBy: SEED_TAG },
    select: { id: true, visit: true, patient: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`Found ${recs.length} seed records to repair`);

  // Group with_doctor by assigned doctor for capping
  const byDoctor: Record<string, string[]> = {};
  for (const r of recs) {
    const v = (r.visit as Record<string, unknown>) || {};
    if (v.visitStatus === "with_doctor" && v.assignedDoctorId) {
      (byDoctor[v.assignedDoctorId as string] ??= []).push(r.id);
    }
  }
  const toDemote = new Set<string>();
  for (const [did, ids] of Object.entries(byDoctor)) {
    const demote = ids.slice(2);
    demote.forEach(id => toDemote.add(id));
    console.log(`  doctor ${did}: keep 2, demote ${demote.length}`);
  }

  // Per-dept sequence counters for clean token renumbering
  const seq: Record<string, number> = {};
  let n = 0;
  for (const r of recs) {
    const v = (r.visit as Record<string, unknown>) || {};
    const p = (r.patient as Record<string, unknown>) || {};
    const dept = (v.department as string) || "general";
    const code = deptCodeFor(dept);
    seq[code] = (seq[code] ?? 0) + 1;
    const newToken = `${code}-${HOSPITAL_CODE}-${String(seq[code]).padStart(3, "0")}`;

    // Strip "KBH-T034-" or "KBH-Y012-" style prefix from fullName
    const rawName = (p.fullName as string) || "";
    const cleanName = rawName.replace(/^KBH-[YT]\d{3}-/, "").replace(/^LIVE-\d{3}-/, "").replace(/^TEST-\d{3}-/, "");

    let newStatus = v.visitStatus as string;
    let assignedDoctorId = v.assignedDoctorId;
    let assignedDoctorName = v.assignedDoctorName;
    if (toDemote.has(r.id)) {
      newStatus = "queued";
      assignedDoctorId = null;
      assignedDoctorName = null;
    }
    if (newStatus === "queued") {
      assignedDoctorId = null;
      assignedDoctorName = null;
    }

    const newVisit = { ...v, queueToken: newToken, visitStatus: newStatus, assignedDoctorId, assignedDoctorName };
    const newPatient = { ...p, fullName: cleanName };

    await db.patientRecord.update({
      where: { id: r.id },
      data: { visit: newVisit, patient: newPatient },
    });
    n++;
    if (n % 50 === 0) process.stdout.write(`·${n} `);
  }

  console.log(`\n✅ Repaired ${n} records. Per-dept last tokens:`);
  for (const [code, c] of Object.entries(seq)) console.log(`  ${code}: ${c}`);
  await db.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
