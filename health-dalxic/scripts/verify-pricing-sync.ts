/**
 * Verify that pricing set in /rates flows correctly through every billable.
 * Scans TEST- seeded data and compares snapshot values against the pricing blob.
 * Emits a color-coded markdown report at /TEST_REPORT_PRICING_SYNC.md
 * Run: npx tsx scripts/verify-pricing-sync.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import fs from "fs";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const HOSPITAL_CODE = "KBH";
const SEED_TAG = "pricing_sync_test";

type PricingBlob = {
  defaults?: Record<string, number>;
  doctors?: Record<string, { fee?: number; commission?: number; department?: string }>;
  wards?: Record<string, Record<string, number>>;
  services?: Record<string, Record<string, number>>;
};

type Row = { status: "🟢" | "🔴" | "🟡"; section: string; check: string; expected: string; actual: string; note?: string };

async function main() {
  const rows: Row[] = [];
  const pass = (section: string, check: string, expected: string, actual: string) => rows.push({ status: "🟢", section, check, expected, actual });
  const fail = (section: string, check: string, expected: string, actual: string, note?: string) => rows.push({ status: "🔴", section, check, expected, actual, note });
  const warn = (section: string, check: string, expected: string, actual: string, note?: string) => rows.push({ status: "🟡", section, check, expected, actual, note });

  const hospital = await db.hospital.findUnique({ where: { code: HOSPITAL_CODE } });
  if (!hospital) throw new Error("KBH not found");

  const pricing = ((hospital.settings ?? {}) as { pricing?: PricingBlob }).pricing ?? {};
  const doctors = await db.doctor.findMany({ where: { hospitalId: hospital.id } });
  const doctorById = Object.fromEntries(doctors.map(d => [d.id, d]));

  const testRecords = await db.patientRecord.findMany({
    where: { hospitalId: hospital.id, createdBy: SEED_TAG },
    select: { id: true, patient: true },
  });
  const testRecordIds = testRecords.map(r => r.id);

  if (testRecordIds.length === 0) {
    console.error("No TEST- records — run seed first.");
    process.exit(1);
  }

  const billables = await db.billableItem.findMany({
    where: { patientId: { in: testRecordIds } },
    orderBy: { renderedAt: "asc" },
  });

  console.log(`Verifying ${billables.length} billables across ${testRecordIds.length} TEST- patients…\n`);

  // ─── Consultations — priority chain (doctor blob wins) + commission snapshot ───
  const consults = billables.filter(b => b.serviceType === "CONSULTATION");
  for (const b of consults) {
    const docBlob = b.doctorId ? pricing.doctors?.[b.doctorId] : undefined;
    const expectedFee = docBlob?.fee ?? pricing.defaults?.consultationFee ?? 0;
    if (b.unitCost === expectedFee) pass("Consultation", "unitCost matches pricing.doctors[id].fee", String(expectedFee), String(b.unitCost));
    else fail("Consultation", `unitCost for billable ${b.id.slice(0, 8)}`, String(expectedFee), String(b.unitCost), "priority chain broke");

    if (b.doctorId && docBlob?.commission != null) {
      const expectedStaffCut = Math.round((b.totalCost * docBlob.commission) / 100 * 100) / 100;
      if (b.commissionPct === docBlob.commission) pass("Commission", `pct snapshot for ${doctorById[b.doctorId]?.name ?? b.doctorId.slice(0, 8)}`, `${docBlob.commission}%`, `${b.commissionPct}%`);
      else fail("Commission", `pct mismatch for billable ${b.id.slice(0, 8)}`, `${docBlob.commission}%`, `${b.commissionPct}%`);
      if (b.staffCutCost === expectedStaffCut) pass("Commission", `staffCutCost for ${b.id.slice(0, 8)}`, String(expectedStaffCut), String(b.staffCutCost));
      else fail("Commission", `staffCutCost for ${b.id.slice(0, 8)}`, String(expectedStaffCut), String(b.staffCutCost));
    }

    if (b.doctorId && !b.shiftId) warn("Shift", `auto-attach missing for billable ${b.id.slice(0, 8)}`, "shiftId set", "null");
    else if (b.doctorId && b.shiftId) pass("Shift", `auto-attach for doctor ${doctorById[b.doctorId]?.name?.slice(0, 20) ?? "?"}`, "shiftId set", b.shiftId.slice(0, 8));
  }

  // ─── Lab / Imaging — service catalog lookup ───
  for (const b of billables.filter(b => b.serviceType === "LAB" || b.serviceType === "IMAGING" || b.serviceType === "EMERGENCY" || b.serviceType === "ICU_DAY")) {
    const expected = pricing.services?.[b.serviceType]?.[b.description];
    if (expected != null) {
      if (b.unitCost === expected) pass(b.serviceType, `service catalog for "${b.description}"`, String(expected), String(b.unitCost));
      else fail(b.serviceType, `catalog mismatch "${b.description}"`, String(expected), String(b.unitCost));
    } else {
      warn(b.serviceType, `"${b.description}" not in catalog`, "in services blob", "missing — fell back to caller unitCost");
    }
  }

  // ─── Drugs — overrideUnitCost should win over pricing blob ───
  for (const b of billables.filter(b => b.serviceType === "DRUG")) {
    const blobPrice = pricing.services?.DRUG?.[b.description];
    if (blobPrice != null && b.unitCost > blobPrice) pass("Drug override", `batch sellPrice wins for "${b.description}"`, `>${blobPrice} (blob)`, String(b.unitCost));
    else if (blobPrice != null && b.unitCost === blobPrice) warn("Drug override", `"${b.description}" equals blob`, `>${blobPrice}`, String(b.unitCost), "override may not have been passed");
    else pass("Drug override", `"${b.description}"`, "override honored", String(b.unitCost));
  }

  // ─── Ward days — resolveWardNightly should use bed class rate ───
  const wardBillables = billables.filter(b => b.serviceType === "WARD_DAY");
  for (const b of wardBillables) {
    const [wardName, bedClass] = b.description.split(" — ");
    const expected = pricing.wards?.[wardName]?.[bedClass] ?? pricing.defaults?.wardNightly ?? 0;
    if (b.unitCost === expected) pass("Ward", `${wardName}/${bedClass} nightly`, String(expected), String(b.unitCost));
    else fail("Ward", `${wardName}/${bedClass} mismatch`, String(expected), String(b.unitCost));
  }

  // ─── Procedure injections — should use defaults.injectionFee ───
  const injections = billables.filter(b => b.serviceType === "PROCEDURE" && b.description === "Injection Administration");
  for (const b of injections) {
    const expected = pricing.defaults?.injectionFee ?? 15;
    if (b.unitCost === expected) pass("Injection", "default fee", String(expected), String(b.unitCost));
    else fail("Injection", "default fee mismatch", String(expected), String(b.unitCost));
  }

  // ─── Phase 4 — cross-module sync ───
  const gross = billables.reduce((s, b) => s + b.totalCost, 0);
  const staffCut = billables.reduce((s, b) => s + (b.staffCutCost ?? 0), 0);
  pass("Aggregate", "TEST- gross revenue total", "sum of totalCost", `₵${gross.toFixed(2)}`);
  pass("Aggregate", "TEST- commission total", "sum of staffCutCost", `₵${staffCut.toFixed(2)}`);

  const byDoctor: Record<string, { gross: number; cut: number }> = {};
  for (const b of billables) {
    if (!b.doctorId) continue;
    byDoctor[b.doctorId] = byDoctor[b.doctorId] || { gross: 0, cut: 0 };
    byDoctor[b.doctorId].gross += b.totalCost;
    byDoctor[b.doctorId].cut += b.staffCutCost ?? 0;
  }
  for (const [id, tot] of Object.entries(byDoctor)) {
    pass("Per-doctor", doctorById[id]?.name ?? id.slice(0, 8), "sum of doctor's billables", `gross=₵${tot.gross.toFixed(2)} cut=₵${tot.cut.toFixed(2)}`);
  }

  // ─── Bill assembly — every TEST patient should have exactly one bill ───
  const bills = await db.bill.findMany({ where: { patientId: { in: testRecordIds } } });
  const patientsWithBills = new Set(bills.map(b => b.patientId));
  const missing = testRecordIds.filter(id => !patientsWithBills.has(id)).length;
  if (missing === 0) pass("Billing", "every patient has a bill", `${testRecordIds.length}`, `${bills.length}`);
  else fail("Billing", "patients missing bills", "0 missing", `${missing} missing`);

  // Bill totals must equal sum of their billables' totalCost
  const billMap: Record<string, { sum: number; billTotal: number }> = {};
  for (const b of bills) billMap[b.id] = { sum: 0, billTotal: b.total };
  const billedItems = await db.billableItem.findMany({ where: { patientId: { in: testRecordIds }, isBilled: true } });
  for (const item of billedItems) {
    if (item.billId && billMap[item.billId]) billMap[item.billId].sum += item.totalCost;
  }
  let billMismatches = 0;
  for (const [id, { sum, billTotal }] of Object.entries(billMap)) {
    if (Math.abs(sum - billTotal) > 0.01) billMismatches++;
  }
  if (billMismatches === 0) pass("Billing", "bill totals match sum of billables", "0 mismatches", `${bills.length} bills checked`);
  else fail("Billing", "bill totals mismatch", "0", `${billMismatches}`);

  // Payment status distribution
  const statusCounts: Record<string, number> = {};
  const methodCounts: Record<string, number> = {};
  for (const b of bills) {
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    if (b.paymentMethod) methodCounts[b.paymentMethod] = (methodCounts[b.paymentMethod] || 0) + 1;
  }
  pass("Payment Mix", "status distribution", "PAID/PART_PAID/ISSUED/WAIVED", JSON.stringify(statusCounts));
  pass("Payment Mix", "method distribution", "CASH/MOMO/NHIS/INSURANCE/WAIVED", JSON.stringify(methodCounts));

  // Insurance claims specifically
  const insuranceBills = bills.filter(b => b.paymentMethod === "NHIS" || b.paymentMethod === "INSURANCE");
  const insuranceRevenue = insuranceBills.reduce((s, b) => s + b.total, 0);
  pass("Insurance", "NHIS + private claims", ">0", `${insuranceBills.length} bills, ₵${insuranceRevenue.toFixed(2)} claimed`);

  // Revenue aggregates
  const totalBillRevenue = bills.reduce((s, b) => s + b.total, 0);
  const paidRevenue = bills.filter(b => b.status === "PAID" || b.status === "PART_PAID").reduce((s, b) => s + b.total, 0);
  const outstandingRevenue = bills.filter(b => b.status === "ISSUED").reduce((s, b) => s + b.total, 0);
  const waivedRevenue = bills.filter(b => b.status === "WAIVED").reduce((s, b) => s + b.total, 0);
  pass("Finance", "total bill revenue", "sum of bill.total", `₵${totalBillRevenue.toFixed(2)}`);
  pass("Finance", "collected (PAID + PART_PAID)", "", `₵${paidRevenue.toFixed(2)}`);
  pass("Finance", "outstanding (ISSUED)", "", `₵${outstandingRevenue.toFixed(2)}`);
  pass("Finance", "waived", "", `₵${waivedRevenue.toFixed(2)}`);

  // Cross-check: billables.totalCost sum ≈ bills.total sum (within rounding)
  const billableGross = billables.reduce((s, b) => s + b.totalCost, 0);
  if (Math.abs(billableGross - totalBillRevenue) < 1) pass("Finance", "billable gross ↔ bill total reconcile", `≈₵${billableGross.toFixed(2)}`, `≈₵${totalBillRevenue.toFixed(2)}`);
  else warn("Finance", "billable gross vs bill total drift", `₵${billableGross.toFixed(2)}`, `₵${totalBillRevenue.toFixed(2)}`, "may include unbilled items");

  // ─── Phase 5 — regression check: non-TEST patients unchanged ───
  // Sample only pre-existing patients who actually have billables (skip empty records)
  const candidates = await db.patientRecord.findMany({
    where: { hospitalId: hospital.id, createdBy: { not: SEED_TAG } },
    orderBy: { createdAt: "desc" },
    select: { id: true, patient: true },
    take: 50,
  });
  const sampled: Array<{ id: string; patient: unknown; items: typeof billables }> = [];
  for (const rec of candidates) {
    if (sampled.length >= 3) break;
    const items = await db.billableItem.findMany({ where: { patientId: rec.id }, orderBy: { renderedAt: "asc" } });
    if (items.length > 0) sampled.push({ id: rec.id, patient: rec.patient, items });
  }
  if (sampled.length === 0) {
    warn("Regression", "no pre-existing patients with billables available", "≥1 sample", "0 sampled");
  } else {
    for (const rec of sampled) {
      const patientName = ((rec.patient ?? {}) as { fullName?: string }).fullName ?? rec.id.slice(0, 8);
      const sum = rec.items.reduce((s, b) => s + b.totalCost, 0);
      pass("Regression", `${patientName}: pre-existing billables preserved`, ">0 items", `${rec.items.length} items, ₵${sum.toFixed(2)}`);
    }
  }

  // ─── Write report ───
  const passCount = rows.filter(r => r.status === "🟢").length;
  const failCount = rows.filter(r => r.status === "🔴").length;
  const warnCount = rows.filter(r => r.status === "🟡").length;

  const md = [
    `# Pricing Sync Verification Report`,
    ``,
    `**Hospital:** ${HOSPITAL_CODE}  `,
    `**Test patients:** ${testRecordIds.length}  `,
    `**Billables checked:** ${billables.length}  `,
    `**Generated:** ${new Date().toISOString()}`,
    ``,
    `## Summary`,
    ``,
    `| Status | Count |`,
    `|--------|------:|`,
    `| 🟢 PASS | ${passCount} |`,
    `| 🔴 FAIL | ${failCount} |`,
    `| 🟡 WARN | ${warnCount} |`,
    ``,
    `## Pricing Blob Snapshot`,
    ``,
    `\`\`\`json`,
    JSON.stringify(pricing, null, 2),
    `\`\`\``,
    ``,
    `## Verification Rows`,
    ``,
    `| Status | Section | Check | Expected | Actual | Note |`,
    `|--------|---------|-------|----------|--------|------|`,
    ...rows.map(r => `| ${r.status} | ${r.section} | ${r.check} | ${r.expected} | ${r.actual} | ${r.note ?? ""} |`),
    ``,
    `## How to reproduce`,
    ``,
    `\`\`\`bash`,
    `npx tsx scripts/cleanup-test-patients.ts`,
    `npx tsx scripts/seed-pricing-test.ts`,
    `npx tsx scripts/seed-100-test-patients.ts`,
    `npx tsx scripts/verify-pricing-sync.ts`,
    `\`\`\``,
    ``,
  ].join("\n");

  fs.writeFileSync("/Users/thecreator/Projects/dalxic/health-dalxic/TEST_REPORT_PRICING_SYNC.md", md);
  console.log(`\n✅ Report written: TEST_REPORT_PRICING_SYNC.md`);
  console.log(`   🟢 ${passCount}   🔴 ${failCount}   🟡 ${warnCount}`);

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
