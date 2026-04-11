/**
 * Pharmacy Seed Script — Populates KBH with 25 medications + stock batches
 * Run: npx tsx scripts/seed-pharmacy.ts
 * Uses raw SQL via pg driver (not prisma db push)
 */

import { Client } from "pg";
import { readFileSync } from "fs";
import { randomBytes } from "crypto";

const envFile = readFileSync(".env", "utf8");
const match = envFile.match(/DATABASE_URL="([^"]+)"/);
if (!match) throw new Error("DATABASE_URL not found in .env");

const HOSPITAL_ID = "hosp_kbh_1775862940979";
const BOOK_ID = "book_kbh_1775862950932";

function cuid() {
  return "ph_" + Date.now().toString(36) + randomBytes(4).toString("hex");
}

// 25 real medications commonly stocked in Ghanaian hospital pharmacies
const DRUGS = [
  // ANTIBIOTICS (5)
  { name: "Amoxicillin 500mg Capsules", generic: "Amoxicillin", cat: "ANTIBIOTIC", unit: "capsule", sell: 2.50, cost: 1.20, threshold: 100, controlled: false, rx: true },
  { name: "Ciprofloxacin 500mg Tablets", generic: "Ciprofloxacin", cat: "ANTIBIOTIC", unit: "tablet", sell: 3.00, cost: 1.50, threshold: 80, controlled: false, rx: true },
  { name: "Metronidazole 400mg Tablets", generic: "Metronidazole", cat: "ANTIBIOTIC", unit: "tablet", sell: 1.80, cost: 0.80, threshold: 100, controlled: false, rx: true },
  { name: "Azithromycin 250mg Capsules", generic: "Azithromycin", cat: "ANTIBIOTIC", unit: "capsule", sell: 5.00, cost: 2.80, threshold: 50, controlled: false, rx: true },
  { name: "Ceftriaxone 1g Injection", generic: "Ceftriaxone", cat: "ANTIBIOTIC", unit: "vial", sell: 18.00, cost: 10.00, threshold: 30, controlled: false, rx: true },

  // ANALGESICS (4)
  { name: "Paracetamol 500mg Tablets", generic: "Acetaminophen", cat: "ANALGESIC", unit: "tablet", sell: 0.50, cost: 0.15, threshold: 200, controlled: false, rx: false },
  { name: "Ibuprofen 400mg Tablets", generic: "Ibuprofen", cat: "ANALGESIC", unit: "tablet", sell: 1.00, cost: 0.40, threshold: 150, controlled: false, rx: false },
  { name: "Diclofenac 50mg Tablets", generic: "Diclofenac Sodium", cat: "ANALGESIC", unit: "tablet", sell: 1.50, cost: 0.60, threshold: 100, controlled: false, rx: true },
  { name: "Tramadol 50mg Capsules", generic: "Tramadol HCl", cat: "ANALGESIC", unit: "capsule", sell: 4.00, cost: 2.00, threshold: 50, controlled: true, rx: true },

  // ANTIMALARIALS (3)
  { name: "Artemether-Lumefantrine Tablets", generic: "Coartem", cat: "ANTIMALARIAL", unit: "tablet", sell: 8.00, cost: 4.50, threshold: 80, controlled: false, rx: true },
  { name: "Artesunate 60mg Injection", generic: "Artesunate", cat: "ANTIMALARIAL", unit: "vial", sell: 15.00, cost: 8.00, threshold: 40, controlled: false, rx: true },
  { name: "Amodiaquine 200mg Tablets", generic: "Amodiaquine", cat: "ANTIMALARIAL", unit: "tablet", sell: 3.50, cost: 1.80, threshold: 60, controlled: false, rx: true },

  // ANTIHYPERTENSIVES (3)
  { name: "Amlodipine 5mg Tablets", generic: "Amlodipine Besylate", cat: "ANTIHYPERTENSIVE", unit: "tablet", sell: 2.00, cost: 0.80, threshold: 100, controlled: false, rx: true },
  { name: "Lisinopril 10mg Tablets", generic: "Lisinopril", cat: "ANTIHYPERTENSIVE", unit: "tablet", sell: 2.50, cost: 1.00, threshold: 80, controlled: false, rx: true },
  { name: "Losartan 50mg Tablets", generic: "Losartan Potassium", cat: "ANTIHYPERTENSIVE", unit: "tablet", sell: 3.00, cost: 1.20, threshold: 80, controlled: false, rx: true },

  // ANTIDIABETICS (2)
  { name: "Metformin 500mg Tablets", generic: "Metformin HCl", cat: "ANTIDIABETIC", unit: "tablet", sell: 1.50, cost: 0.50, threshold: 150, controlled: false, rx: true },
  { name: "Glibenclamide 5mg Tablets", generic: "Glyburide", cat: "ANTIDIABETIC", unit: "tablet", sell: 1.80, cost: 0.70, threshold: 100, controlled: false, rx: true },

  // VITAMINS (2)
  { name: "Vitamin C 500mg Tablets", generic: "Ascorbic Acid", cat: "VITAMIN", unit: "tablet", sell: 0.80, cost: 0.25, threshold: 200, controlled: false, rx: false },
  { name: "Folic Acid 5mg Tablets", generic: "Folic Acid", cat: "VITAMIN", unit: "tablet", sell: 0.60, cost: 0.15, threshold: 200, controlled: false, rx: true },

  // ANTACIDS (2)
  { name: "Omeprazole 20mg Capsules", generic: "Omeprazole", cat: "ANTACID", unit: "capsule", sell: 3.00, cost: 1.20, threshold: 80, controlled: false, rx: true },
  { name: "Magnesium Trisilicate Tablets", generic: "Magnesium Trisilicate", cat: "ANTACID", unit: "tablet", sell: 0.80, cost: 0.30, threshold: 100, controlled: false, rx: false },

  // ANTIHISTAMINES (2)
  { name: "Cetirizine 10mg Tablets", generic: "Cetirizine HCl", cat: "ANTIHISTAMINE", unit: "tablet", sell: 1.50, cost: 0.50, threshold: 80, controlled: false, rx: false },
  { name: "Chlorpheniramine 4mg Tablets", generic: "Chlorpheniramine Maleate", cat: "ANTIHISTAMINE", unit: "tablet", sell: 0.80, cost: 0.25, threshold: 100, controlled: false, rx: false },

  // OTHER (2)
  { name: "Morphine Sulfate 10mg Injection", generic: "Morphine", cat: "OTHER", unit: "ampoule", sell: 25.00, cost: 15.00, threshold: 20, controlled: true, rx: true },
  { name: "Oral Rehydration Salts (ORS)", generic: "ORS", cat: "OTHER", unit: "sachet", sell: 2.00, cost: 0.80, threshold: 150, controlled: false, rx: false },
];

const SUPPLIERS = ["Ernest Chemists", "Tobinco Pharmaceuticals", "Kama Industries", "Dannex Ayrton Starwin", "Entrance Pharmaceuticals"];

function randomDate(minDays: number, maxDays: number): string {
  const now = new Date();
  const days = minDays + Math.floor(Math.random() * (maxDays - minDays));
  const d = new Date(now.getTime() + days * 86400000);
  return d.toISOString().split("T")[0];
}

async function seed() {
  const client = new Client({ connectionString: match![1], ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to Neon");

  // Clear existing pharmacy data for KBH
  console.log("\nClearing existing pharmacy data for KBH...");
  await client.query(`DELETE FROM stock_movements WHERE hospital_id = $1`, [HOSPITAL_ID]);
  await client.query(`DELETE FROM retail_sales WHERE hospital_id = $1`, [HOSPITAL_ID]);
  await client.query(`DELETE FROM drug_stock WHERE hospital_id = $1`, [HOSPITAL_ID]);
  await client.query(`DELETE FROM drug_catalog WHERE hospital_id = $1`, [HOSPITAL_ID]);
  console.log("Cleared.");

  let totalBatches = 0;
  let totalMovements = 0;
  let batchCounter = 1;

  for (const drug of DRUGS) {
    const drugId = cuid();

    // Insert drug catalog entry
    await client.query(`
      INSERT INTO drug_catalog (id, hospital_id, name, generic_name, category, unit, default_price, cost_price, controlled_substance, requires_prescription, min_stock_threshold, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW())
    `, [drugId, HOSPITAL_ID, drug.name, drug.generic, drug.cat, drug.unit, drug.sell, drug.cost, drug.controlled, drug.rx, drug.threshold]);

    // Create 2-3 stock batches per drug
    const batchCount = 2 + Math.floor(Math.random() * 2); // 2 or 3
    for (let b = 0; b < batchCount; b++) {
      const stockId = cuid();
      const batchNum = `BN-2026-${String(batchCounter++).padStart(3, "0")}`;
      const supplier = SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)];

      // Spread expiry dates: first batch near-expiry, second mid, third far
      let expiryDate: string;
      if (b === 0) {
        // Near expiry: 10-25 days out (red zone)
        expiryDate = randomDate(10, 25);
      } else if (b === 1) {
        // Mid expiry: 45-85 days out (amber zone)
        expiryDate = randomDate(45, 85);
      } else {
        // Far expiry: 200-400 days out (green zone)
        expiryDate = randomDate(200, 400);
      }

      const qty = 20 + Math.floor(Math.random() * 480);
      const batchCost = drug.cost * (0.9 + Math.random() * 0.2); // ±10% variance
      const batchSell = drug.sell;

      await client.query(`
        INSERT INTO drug_stock (id, hospital_id, drug_catalog_id, batch_number, expiry_date, quantity_received, quantity_remaining, cost_price, sell_price, supplier, received_by, status, received_at)
        VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, 'System Seed', 'ACTIVE', NOW())
      `, [stockId, HOSPITAL_ID, drugId, batchNum, expiryDate, qty, Math.round(batchCost * 100) / 100, batchSell, supplier]);

      // Create matching RECEIVED movement
      const movementId = cuid();
      await client.query(`
        INSERT INTO stock_movements (id, hospital_id, drug_stock_id, drug_catalog_id, type, quantity, balance_before, balance_after, performed_by, notes, created_at)
        VALUES ($1, $2, $3, $4, 'RECEIVED', $5, 0, $5, 'System Seed', 'Initial pharmacy seed', NOW())
      `, [movementId, HOSPITAL_ID, stockId, drugId, qty]);

      totalBatches++;
      totalMovements++;
    }

    console.log(`  ✓ ${drug.name} — ${batchCount} batches`);
  }

  console.log(`\n═══ PHARMACY SEED COMPLETE ═══`);
  console.log(`  Drugs:     ${DRUGS.length}`);
  console.log(`  Batches:   ${totalBatches}`);
  console.log(`  Movements: ${totalMovements}`);
  console.log(`  Hospital:  KBH (${HOSPITAL_ID})`);
  console.log(`  Book:      April 2026 (${BOOK_ID})`);

  await client.end();
}

seed().catch(console.error);
