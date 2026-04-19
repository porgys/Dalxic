-- Returns / Refund / Void system (BLUEPRINT §4)
-- Raw SQL migration — never use prisma db push

-- Add return_status to sales table
ALTER TABLE "sales" ADD COLUMN "return_status" TEXT;

-- Returns table
CREATE TABLE "returns" (
  "id" TEXT NOT NULL,
  "org_id" TEXT NOT NULL,
  "original_sale_id" TEXT NOT NULL,
  "credit_note_code" TEXT,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  "reason" TEXT NOT NULL,
  "reason_text" TEXT,
  "refund_method" TEXT NOT NULL,
  "refund_amount" INTEGER NOT NULL,
  "approved_by" TEXT,
  "approved_by_name" TEXT,
  "processed_by" TEXT NOT NULL,
  "processed_by_name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "returns_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "returns_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "returns_original_sale_id_fkey" FOREIGN KEY ("original_sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "returns_credit_note_code_key" ON "returns"("credit_note_code");
CREATE INDEX "returns_org_id_created_at_idx" ON "returns"("org_id", "created_at");
CREATE INDEX "returns_org_id_original_sale_id_idx" ON "returns"("org_id", "original_sale_id");

-- Return items table
CREATE TABLE "return_items" (
  "id" TEXT NOT NULL,
  "return_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "product_name" TEXT NOT NULL,
  "unit_price" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  "restock" BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "return_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "return_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
