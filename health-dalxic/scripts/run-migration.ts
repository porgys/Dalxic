// One-time script: run multi-branch migration via Prisma WebSocket adapter
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Running multi-branch group migration...");

  // 1. Create hospital_groups table
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "hospital_groups" (
      "id" TEXT NOT NULL,
      "group_code" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "owner_name" TEXT NOT NULL,
      "owner_pin" TEXT NOT NULL,
      "subscription_tier" TEXT NOT NULL DEFAULT 'GROUP_STANDARD',
      "is_active" BOOLEAN NOT NULL DEFAULT true,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "hospital_groups_pkey" PRIMARY KEY ("id")
    )
  `);
  console.log("✓ hospital_groups table created");

  // 2. Unique index
  await db.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "hospital_groups_group_code_key" ON "hospital_groups"("group_code")
  `);
  console.log("✓ group_code unique index created");

  // 3. Add columns to hospitals
  await db.$executeRawUnsafe(`ALTER TABLE "hospitals" ADD COLUMN IF NOT EXISTS "group_id" TEXT`);
  await db.$executeRawUnsafe(`ALTER TABLE "hospitals" ADD COLUMN IF NOT EXISTS "group_code" TEXT`);
  console.log("✓ group_id and group_code columns added to hospitals");

  // 4. Foreign key
  const fkExists = await db.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'hospitals_group_id_fkey'
  `) as unknown[];

  if (!Array.isArray(fkExists) || fkExists.length === 0) {
    await db.$executeRawUnsafe(`
      ALTER TABLE "hospitals"
        ADD CONSTRAINT "hospitals_group_id_fkey"
        FOREIGN KEY ("group_id") REFERENCES "hospital_groups"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log("✓ Foreign key constraint added");
  } else {
    console.log("✓ Foreign key already exists");
  }

  // Verify
  const tables = await db.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables WHERE table_name = 'hospital_groups'
  `) as unknown[];
  console.log(`\n✓ Migration complete. hospital_groups table exists: ${Array.isArray(tables) && tables.length > 0}`);

  await db.$disconnect();
}

main().catch(e => { console.error("Migration failed:", e); process.exit(1); });
