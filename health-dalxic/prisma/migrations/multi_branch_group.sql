-- ============================================================
-- DalxicHealth — Multi-Branch Hospital Group Migration
-- Run this on Neon Console (SQL Editor)
-- Safe: adds new table + nullable columns. Zero impact on existing data.
-- ============================================================

-- 1. Create hospital_groups table
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
);

-- 2. Unique index on group_code
CREATE UNIQUE INDEX IF NOT EXISTS "hospital_groups_group_code_key" ON "hospital_groups"("group_code");

-- 3. Add nullable group columns to hospitals table
ALTER TABLE "hospitals" ADD COLUMN IF NOT EXISTS "group_id" TEXT;
ALTER TABLE "hospitals" ADD COLUMN IF NOT EXISTS "group_code" TEXT;

-- 4. Foreign key: hospitals.group_id -> hospital_groups.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'hospitals_group_id_fkey'
  ) THEN
    ALTER TABLE "hospitals"
      ADD CONSTRAINT "hospitals_group_id_fkey"
      FOREIGN KEY ("group_id") REFERENCES "hospital_groups"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================================
-- VERIFICATION: Run after migration to confirm
-- ============================================================
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'hospital_groups';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'hospitals' AND column_name IN ('group_id', 'group_code');
