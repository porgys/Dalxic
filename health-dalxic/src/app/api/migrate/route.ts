import { db } from "@/lib/db";

// POST: Run raw SQL to create new tables (one-time migration helper)
export async function POST() {
  try {
    // Create doctors table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "doctors" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "hospital_id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "specialty" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
        "max_concurrent_patients" INTEGER NOT NULL DEFAULT 10,
        "active_patient_count" INTEGER NOT NULL DEFAULT 0,
        "supervisor_id" TEXT,
        "role" TEXT NOT NULL DEFAULT 'attending',
        "shift_start" TEXT,
        "shift_end" TEXT,
        "meta" JSONB,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "doctors_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "doctors_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT,
        CONSTRAINT "doctors_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "doctors"("id") ON DELETE SET NULL
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "doctors_hospital_id_specialty_idx" ON "doctors"("hospital_id", "specialty")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "doctors_hospital_id_status_idx" ON "doctors"("hospital_id", "status")`);

    // Create shift_handovers table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "shift_handovers" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "hospital_id" TEXT NOT NULL,
        "outgoing_doctor_id" TEXT NOT NULL,
        "incoming_doctor_id" TEXT NOT NULL,
        "patientIds" JSONB NOT NULL,
        "notes" TEXT,
        "handover_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "shift_handovers_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "shift_handovers_outgoing_fkey" FOREIGN KEY ("outgoing_doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT,
        CONSTRAINT "shift_handovers_incoming_fkey" FOREIGN KEY ("incoming_doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT
      )
    `);

    // Create wards table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "wards" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "hospital_id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "floor" INTEGER NOT NULL DEFAULT 1,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "wards_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "wards_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT,
        CONSTRAINT "wards_hospital_id_name_key" UNIQUE ("hospital_id", "name")
      )
    `);

    // Create rooms table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "rooms" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "ward_id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        CONSTRAINT "rooms_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "rooms_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "wards"("id") ON DELETE RESTRICT,
        CONSTRAINT "rooms_ward_id_name_key" UNIQUE ("ward_id", "name")
      )
    `);

    // Create beds table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "beds" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "room_id" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
        "patient_id" TEXT,
        "reserved_until" TIMESTAMP(3),
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "beds_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "beds_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT,
        CONSTRAINT "beds_room_id_label_key" UNIQUE ("room_id", "label")
      )
    `);

    // Create bed_transitions table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "bed_transitions" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "bed_id" TEXT NOT NULL,
        "from_status" TEXT NOT NULL,
        "to_status" TEXT NOT NULL,
        "triggered_by" TEXT NOT NULL,
        "patient_id" TEXT,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "bed_transitions_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "bed_transitions_bed_id_fkey" FOREIGN KEY ("bed_id") REFERENCES "beds"("id") ON DELETE RESTRICT
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "bed_transitions_bed_id_timestamp_idx" ON "bed_transitions"("bed_id", "timestamp")`);

    // Add tier columns to hospitals table (idempotent)
    await db.$executeRawUnsafe(`ALTER TABLE "hospitals" ADD COLUMN IF NOT EXISTS "active_modules" TEXT[] DEFAULT '{}'`);
    await db.$executeRawUnsafe(`ALTER TABLE "hospitals" ADD COLUMN IF NOT EXISTS "max_devices" INTEGER DEFAULT 6`);
    await db.$executeRawUnsafe(`ALTER TABLE "hospitals" ADD COLUMN IF NOT EXISTS "whatsapp_bundle" INTEGER DEFAULT 500`);

    // Create billable_items table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "billable_items" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "hospital_id" TEXT NOT NULL,
        "patient_id" TEXT NOT NULL,
        "book_id" TEXT NOT NULL,
        "service_type" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "unit_cost" DOUBLE PRECISION NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "total_cost" DOUBLE PRECISION NOT NULL,
        "rendered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "rendered_by" TEXT NOT NULL,
        "is_billed" BOOLEAN NOT NULL DEFAULT false,
        "bill_id" TEXT,
        CONSTRAINT "billable_items_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "billable_items_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "billable_items_hospital_patient_idx" ON "billable_items"("hospital_id", "patient_id")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "billable_items_hospital_billed_idx" ON "billable_items"("hospital_id", "is_billed")`);

    // Create bills table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "bills" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "hospital_id" TEXT NOT NULL,
        "patient_id" TEXT NOT NULL,
        "book_id" TEXT NOT NULL,
        "bill_number" TEXT NOT NULL,
        "subtotal" DOUBLE PRECISION NOT NULL,
        "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "total" DOUBLE PRECISION NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'DRAFT',
        "payment_method" TEXT,
        "issued_at" TIMESTAMP(3),
        "paid_at" TIMESTAMP(3),
        "created_by" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "bills_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "bills_bill_number_key" UNIQUE ("bill_number"),
        CONSTRAINT "bills_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "bills_hospital_patient_idx" ON "bills"("hospital_id", "patient_id")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "bills_hospital_status_idx" ON "bills"("hospital_id", "status")`);

    // Add bill_id FK on billable_items (after bills table exists)
    await db.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "billable_items" ADD CONSTRAINT "billable_items_bill_id_fkey"
          FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    // Create service_prices table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "service_prices" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "hospital_id" TEXT NOT NULL,
        "service_type" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "unit_cost" DOUBLE PRECISION NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "service_prices_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "service_prices_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT,
        CONSTRAINT "service_prices_hospital_type_name_key" UNIQUE ("hospital_id", "service_type", "name")
      )
    `);

    return Response.json({ success: true, message: "All tables created successfully (including billing + tier columns)" });
  } catch (error) {
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
