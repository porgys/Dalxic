/**
 * v1.1 migration applier — probes Neon then applies only what's missing.
 *
 * Fully idempotent: every statement is CREATE TABLE IF NOT EXISTS or
 * ADD COLUMN IF NOT EXISTS. Re-running is a safe no-op. No DROP, no DELETE.
 *
 * Run: bun scripts/apply-v11-migrations.ts
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function hasTable(name: string): Promise<boolean> {
  const rows = await db.$queryRawUnsafe(
    `SELECT 1 FROM information_schema.tables WHERE table_name = $1`,
    name,
  ) as unknown[];
  return Array.isArray(rows) && rows.length > 0;
}

async function hasColumn(table: string, column: string): Promise<boolean> {
  const rows = await db.$queryRawUnsafe(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    table,
    column,
  ) as unknown[];
  return Array.isArray(rows) && rows.length > 0;
}

// Split migration SQL on semicolons that end a statement. The migration files
// only use simple DDL so this naive split is safe — no DO blocks, no functions.
function splitStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\n|$)/)
    .map((s) =>
      s
        .split("\n")
        .filter((ln) => !ln.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((s) => s.length > 0);
}

async function applyFile(label: string, relPath: string) {
  const sql = readFileSync(resolve(ROOT, relPath), "utf8");
  const stmts = splitStatements(sql);
  console.log(`\n▸ ${label} (${stmts.length} statements)`);
  for (const s of stmts) {
    const preview = s.replace(/\s+/g, " ").slice(0, 80);
    try {
      await db.$executeRawUnsafe(s);
      console.log(`  ✓ ${preview}...`);
    } catch (err) {
      console.error(`  ✗ ${preview}...`);
      throw err;
    }
  }
}

async function main() {
  console.log("═══ v1.1 Migration Probe ═══");

  const probe = {
    bookings_table: await hasTable("bookings"),
    hospitals_card_template: await hasColumn("hospitals", "card_template"),
    hospitals_card_template_custom: await hasColumn("hospitals", "card_template_custom"),
    doctors_consultation_fee: await hasColumn("doctors", "consultation_fee"),
    doctors_commission_rate: await hasColumn("doctors", "commission_rate"),
    doctors_department: await hasColumn("doctors", "department"),
    billable_items_doctor_id: await hasColumn("billable_items", "doctor_id"),
    billable_items_shift_id: await hasColumn("billable_items", "shift_id"),
    billable_items_commission_pct: await hasColumn("billable_items", "commission_pct"),
    billable_items_staff_cut_cost: await hasColumn("billable_items", "staff_cut_cost"),
    doctor_shifts_table: await hasTable("doctor_shifts"),
    staff_payouts_table: await hasTable("staff_payouts"),
  };

  console.log("\nProbe results:");
  for (const [k, v] of Object.entries(probe)) {
    console.log(`  ${v ? "✓ present" : "✗ missing"}  ${k}`);
  }

  const allPresent = Object.values(probe).every((v) => v);
  if (allPresent) {
    console.log("\n✓ All v1.1 schema objects already applied. Nothing to do.");
    await db.$disconnect();
    return;
  }

  console.log("\n═══ Applying Migrations ═══");
  await applyFile("add_bookings.sql", "prisma/migrations/add_bookings.sql");
  await applyFile("add_card_templates.sql", "prisma/migrations/add_card_templates.sql");
  await applyFile("add_revenue_attribution.sql", "prisma/migrations/add_revenue_attribution.sql");

  console.log("\n═══ Re-Probing ═══");
  const after = {
    bookings_table: await hasTable("bookings"),
    hospitals_card_template: await hasColumn("hospitals", "card_template"),
    hospitals_card_template_custom: await hasColumn("hospitals", "card_template_custom"),
    doctors_consultation_fee: await hasColumn("doctors", "consultation_fee"),
    doctors_commission_rate: await hasColumn("doctors", "commission_rate"),
    doctors_department: await hasColumn("doctors", "department"),
    billable_items_doctor_id: await hasColumn("billable_items", "doctor_id"),
    billable_items_shift_id: await hasColumn("billable_items", "shift_id"),
    billable_items_commission_pct: await hasColumn("billable_items", "commission_pct"),
    billable_items_staff_cut_cost: await hasColumn("billable_items", "staff_cut_cost"),
    doctor_shifts_table: await hasTable("doctor_shifts"),
    staff_payouts_table: await hasTable("staff_payouts"),
  };
  const missing = Object.entries(after).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.error(`\n✗ Post-apply probe still missing: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log("✓ All v1.1 schema objects present.");
  await db.$disconnect();
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
