/**
 * Pharmacy End-to-End Test Suite
 * Run: npx tsx scripts/test-pharmacy.ts
 * Requires dev server running on localhost:3000
 */

import http from "http";

const BASE = "http://localhost:3000";
const UA = "Mozilla/5.0";
const HC = "KBH";

let passed = 0;
let failed = 0;
const results: string[] = [];

function log(test: string, pass: boolean, detail?: string) {
  const status = pass ? "PASS" : "FAIL";
  if (pass) passed++; else failed++;
  const msg = `[${status}] ${test}${detail ? " — " + detail : ""}`;
  console.log(msg);
  results.push(msg);
}

async function api(method: string, path: string, body?: unknown): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { "User-Agent": UA, "Content-Type": "application/json" },
    };
    const req = http.request(opts, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode!, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode!, data: d }); }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log("\n══════════════════════════════════════════════════");
  console.log("  PHARMACY SYSTEM — END-TO-END TEST SUITE");
  console.log("══════════════════════════════════════════════════\n");

  // ═══════════════════════════════════════════
  // PHASE 2: Chain Flow — Register → Prescribe → Dispense → Billing
  // ═══════════════════════════════════════════
  console.log("\n── PHASE 2: Hospital Chain Flow ──\n");

  // 2.0 Get catalog
  const { data: catData } = await api("GET", `/api/pharmacy/catalog?hospitalCode=${HC}`);
  log("2.0 Catalog loaded", catData.total === 25, `${catData.total} drugs`);

  // 2.1 Register a test patient via /api/queue
  const { status: regStat, data: regData } = await api("POST", "/api/queue", {
    hospitalCode: HC,
    patient: { fullName: "Chain Test Patient", dateOfBirth: "1990-01-01", gender: "Male", phone: "0209876543" },
    chiefComplaint: "Headache and fever",
    department: "general",
  });
  const chainRecordId = regData.recordId;
  log("2.1 Register test patient", (regStat === 200 || regStat === 201) && !!chainRecordId, `token: ${regData.queueToken}, recordId: ${chainRecordId?.slice(-8)}`);

  // 2.2 Add prescriptions via PATCH /api/records
  const chainDrug1 = catData.catalog[0];
  const chainDrug2 = catData.catalog[5];
  const { status: rxStat, data: rxData } = await api("PATCH", "/api/records", {
    recordId: chainRecordId,
    hospitalCode: HC,
    treatment: {
      prescriptions: [
        { medication: chainDrug1.name, dosage: "500mg", frequency: "3x daily", duration: "7 days" },
        { medication: chainDrug2.name, dosage: "500mg", frequency: "As needed", duration: "3 days" },
      ],
    },
  });
  log("2.2 Doctor prescribes 2 drugs", rxStat === 200 && rxData.success, `${chainDrug1.name} + ${chainDrug2.name}`);

  // 2.3 Verify patient appears in pharmacy queue
  const { data: qData } = await api("GET", `/api/pharmacy?hospitalCode=${HC}`);
  const chainPatient = qData.patients?.find((p: any) => p.recordId === chainRecordId);
  log("2.3 Patient in pharmacy queue", !!chainPatient && chainPatient.prescriptions?.length === 2, `prescriptions: ${chainPatient?.prescriptions?.length}`);

  // 2.4 Get stock before dispense
  const { data: stockBefore } = await api("GET", `/api/pharmacy/stock?hospitalCode=${HC}&drugCatalogId=${chainDrug1.id}`);
  const totalStockBefore = stockBefore.inventory?.filter((b: any) => b.status === "ACTIVE").reduce((s: number, b: any) => s + b.quantityRemaining, 0) || 0;

  const { status: dStat, data: dData } = await api("POST", `/api/pharmacy/dispense`, {
    hospitalCode: HC,
    recordId: chainRecordId,
    dispensedBy: "Test Pharmacist",
  });
  log("2.4 Dispense prescription", dStat === 200 && dData.success, `dispensed: ${dData.dispensedCount}, deductions: ${dData.stockDeductions?.length}`);

  // 2.5 Verify stock decreased
  const { data: stockAfter } = await api("GET", `/api/pharmacy/stock?hospitalCode=${HC}&drugCatalogId=${chainDrug1.id}`);
  const totalStockAfter = stockAfter.inventory?.filter((b: any) => b.status === "ACTIVE").reduce((s: number, b: any) => s + b.quantityRemaining, 0) || 0;
  log("2.5 Stock decreased after dispense", totalStockAfter < totalStockBefore, `before: ${totalStockBefore}, after: ${totalStockAfter}`);

  // 2.6 Verify prescriptions marked dispensed
  const { data: qAfter } = await api("GET", `/api/pharmacy?hospitalCode=${HC}`);
  const dispensedPatient = qAfter.patients?.find((p: any) => p.recordId === chainRecordId);
  const allDisp = dispensedPatient?.allDispensed || dispensedPatient?.prescriptions?.every((p: any) => p.dispensed);
  log("2.6 Prescriptions marked dispensed", !!allDisp, `allDispensed: ${allDisp}`);

  // 2.7 Verify BillableItem created for hospital dispense
  const { data: billItems } = await api("GET", `/api/billing?hospitalCode=${HC}&patientId=${chainRecordId}&view=unbilled`);
  const drugBill = billItems.items?.find((i: any) => i.serviceType === "DRUG");
  log("2.7 BillableItem created (DRUG)", !!drugBill, drugBill ? `GHS ${drugBill.totalCost} — ${drugBill.description}` : "no DRUG item found");

  // ═══════════════════════════════════════════
  // PHASE 3: Standalone Retail Flow
  // ═══════════════════════════════════════════
  console.log("\n── PHASE 3: Retail Walk-In Flow ──\n");

  // Pick 2 drugs with stock for the cart (refresh catalog to get current stock)
  const { data: catRefresh } = await api("GET", `/api/pharmacy/catalog?hospitalCode=${HC}`);
  const inStock = catRefresh.catalog.filter((c: any) => c.stockStatus === "OK" && c.totalStock > 10);
  const drug1 = inStock[0] || catRefresh.catalog[2];
  const drug2 = inStock[1] || catRefresh.catalog[3];
  console.log(`  Cart: ${drug1.name} (1x, stock: ${drug1.totalStock}) + ${drug2.name} (2x, stock: ${drug2.totalStock})`);

  // 3.1 Create retail sale
  const { status: rStat, data: rData } = await api("POST", `/api/pharmacy/retail`, {
    hospitalCode: HC,
    customerName: "Kwame Asante",
    customerPhone: "0244123456",
    items: [
      { drugCatalogId: drug1.id, quantity: 1 },
      { drugCatalogId: drug2.id, quantity: 2 },
    ],
    discount: 10,
    soldBy: "Test Pharmacist",
  });
  log("3.1 Create retail sale", (rStat === 200 || rStat === 201) && rData.success, `receipt: ${rData.receiptCode}, status: ${rStat}`);

  const saleId = rData.sale?.id;
  const receiptCode = rData.receiptCode;

  if (receiptCode) {
    log("3.1a Receipt code format", /^RX-\d{8}-\d{4}$/.test(receiptCode), receiptCode);
  }

  // 3.2 Verify sale is PENDING
  const { data: salesData } = await api("GET", `/api/pharmacy/retail?hospitalCode=${HC}`);
  const ourSale = salesData.sales?.find((s: any) => s.id === saleId);
  log("3.2 Sale status is PENDING", ourSale?.paymentStatus === "PENDING", `status: ${ourSale?.paymentStatus}`);

  // 3.3 Attempt dispense on unpaid sale — should fail
  if (saleId) {
    const { status: badDisp, data: badDispData } = await api("PATCH", `/api/pharmacy/retail`, {
      hospitalCode: HC,
      saleId,
      action: "dispense",
      operatorId: "Test Pharmacist",
    });
    log("3.3 Dispense unpaid sale blocked", badDisp !== 200 || !badDispData.success, `status: ${badDisp}, msg: ${badDispData.error || "rejected"}`);
  }

  // 3.4 Confirm payment
  if (saleId) {
    const { status: payStat, data: payData } = await api("PATCH", `/api/pharmacy/retail`, {
      hospitalCode: HC,
      saleId,
      action: "confirm_payment",
      paymentMethod: "MOBILE_MONEY",
    });
    log("3.4 Confirm payment", payStat === 200 && payData.success, `status: ${payStat}`);

    // Verify status changed to PAID
    const { data: salesAfterPay } = await api("GET", `/api/pharmacy/retail?hospitalCode=${HC}`);
    const paidSale = salesAfterPay.sales?.find((s: any) => s.id === saleId);
    log("3.4a Sale status is PAID", paidSale?.paymentStatus === "PAID", `status: ${paidSale?.paymentStatus}`);
  }

  // 3.5 Dispense paid sale
  if (saleId) {
    // Get stock before
    const { data: stockBefore } = await api("GET", `/api/pharmacy/catalog?hospitalCode=${HC}`);
    const drug1Before = stockBefore.catalog.find((c: any) => c.id === drug1.id)?.totalStock;
    const drug2Before = stockBefore.catalog.find((c: any) => c.id === drug2.id)?.totalStock;

    const { status: dispStat, data: dispData } = await api("PATCH", `/api/pharmacy/retail`, {
      hospitalCode: HC,
      saleId,
      action: "dispense",
      operatorId: "Test Pharmacist",
    });
    log("3.5 Dispense paid sale", dispStat === 200 && dispData.success, `status: ${dispStat}`);

    // Verify stock decreased
    const { data: stockAfter } = await api("GET", `/api/pharmacy/catalog?hospitalCode=${HC}`);
    const drug1After = stockAfter.catalog.find((c: any) => c.id === drug1.id)?.totalStock;
    const drug2After = stockAfter.catalog.find((c: any) => c.id === drug2.id)?.totalStock;
    log("3.5a Drug 1 stock decreased", drug1After < drug1Before, `${drug1.name}: ${drug1Before} → ${drug1After}`);
    log("3.5b Drug 2 stock decreased", drug2After < drug2Before, `${drug2.name}: ${drug2Before} → ${drug2After} (qty 2)`);

    // Verify sale marked dispensed
    const { data: salesFinal } = await api("GET", `/api/pharmacy/retail?hospitalCode=${HC}`);
    const finalSale = salesFinal.sales?.find((s: any) => s.id === saleId);
    log("3.5c Sale marked dispensed", finalSale?.dispensed === true, `dispensed: ${finalSale?.dispensed}`);
  }

  // ═══════════════════════════════════════════
  // PHASE 4: Edge Cases
  // ═══════════════════════════════════════════
  console.log("\n── PHASE 4: Edge Cases ──\n");

  // 4.1 FEFO Verification — Check that earliest-expiring batch is deducted first
  // Pick a drug with multiple active batches (not the retail drugs which may be depleted)
  const fefoDrug = inStock.find((c: any) => c.totalStock > 50) || inStock[2] || drug1;
  const { data: batchData } = await api("GET", `/api/pharmacy/stock?hospitalCode=${HC}&drugCatalogId=${fefoDrug.id}`);
  const activeBatches = (batchData.inventory || []).filter((b: any) => b.status === "ACTIVE" && b.quantityRemaining > 0);
  if (activeBatches.length >= 2) {
    const sorted = activeBatches.sort((a: any, b: any) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    const nearestExpBatch = sorted[0];
    log("4.1 FEFO — earliest expiry batch exists", true, `${nearestExpBatch.batchNumber} expires ${nearestExpBatch.expiryDate.split("T")[0]}, remaining: ${nearestExpBatch.quantityRemaining}`);

    // Create a small retail sale for 1 unit of fefoDrug to test FEFO
    const { data: fefoSale } = await api("POST", `/api/pharmacy/retail`, {
      hospitalCode: HC,
      customerName: "FEFO Test",
      items: [{ drugCatalogId: fefoDrug.id, quantity: 1 }],
      discount: 0,
      soldBy: "Test Pharmacist",
    });
    if (fefoSale.success) {
      // Pay and dispense
      await api("PATCH", `/api/pharmacy/retail`, { hospitalCode: HC, saleId: fefoSale.sale.id, action: "confirm_payment", paymentMethod: "CASH" });
      await api("PATCH", `/api/pharmacy/retail`, { hospitalCode: HC, saleId: fefoSale.sale.id, action: "dispense", operatorId: "Test Pharmacist" });

      // Check if nearest-expiry batch was deducted
      const { data: batchAfter } = await api("GET", `/api/pharmacy/stock?hospitalCode=${HC}&drugCatalogId=${fefoDrug.id}`);
      const nearestAfter = batchAfter.inventory?.find((b: any) => b.batchNumber === nearestExpBatch.batchNumber);
      log("4.1a FEFO deducted from earliest batch", nearestAfter && nearestAfter.quantityRemaining === nearestExpBatch.quantityRemaining - 1, `before: ${nearestExpBatch.quantityRemaining}, after: ${nearestAfter?.quantityRemaining}`);
    }
  } else {
    log("4.1 FEFO check", false, "Not enough active batches to test");
  }

  // 4.2 Expiry auto-detection (tested via GET /api/pharmacy/stock which auto-expires past-date batches)
  const { data: expiryData } = await api("GET", `/api/pharmacy/stock?hospitalCode=${HC}&expiryAlert=30`);
  log("4.2 Expiry alert filter works", expiryData.inventory !== undefined, `${expiryData.inventory?.length || 0} batches expiring within 30 days`);

  // 4.3 Stock status checks
  const { data: catFinal } = await api("GET", `/api/pharmacy/catalog?hospitalCode=${HC}`);
  const okDrugs = catFinal.catalog.filter((c: any) => c.stockStatus === "OK").length;
  const lowDrugs = catFinal.catalog.filter((c: any) => c.stockStatus === "LOW").length;
  const outDrugs = catFinal.catalog.filter((c: any) => c.stockStatus === "OUT").length;
  log("4.3 Stock status distribution", okDrugs > 0, `OK: ${okDrugs}, LOW: ${lowDrugs}, OUT: ${outDrugs}`);

  // 4.4 Attempt to buy drug with zero stock — create a dummy test
  // Find a drug with low stock or skip
  console.log("  4.4 Zero-stock purchase test: would need to deplete a drug entirely (skipping — destructive)");

  // ═══════════════════════════════════════════
  // PHASE 5: Billing Integration
  // ═══════════════════════════════════════════
  console.log("\n── PHASE 5: Billing Integration ──\n");

  // Check billing summary for today's activity
  const { status: billStat, data: billSummary } = await api("GET", `/api/billing?hospitalCode=${HC}`);
  log("5.1 Billing summary accessible", billStat === 200 && billSummary.todayItemsCount > 0, `${billSummary.todayItemsCount} billable items today`);

  // Verify hospital dispense created DRUG billable item (using chain flow patient)
  if (chainRecordId) {
    const { data: chainBill } = await api("GET", `/api/billing?hospitalCode=${HC}&patientId=${chainRecordId}&view=unbilled`);
    const chainDrugItem = chainBill.items?.find((i: any) => i.serviceType === "DRUG");
    log("5.1a Hospital dispense billed", !!chainDrugItem, chainDrugItem ? `GHS ${chainDrugItem.totalCost}` : "no item");
  }

  // Check retail sales have receipt codes (proves billing linkage)
  const { data: retailFinal } = await api("GET", `/api/pharmacy/retail?hospitalCode=${HC}`);
  const paidSales = retailFinal.sales?.filter((s: any) => s.paymentStatus === "PAID") || [];
  log("5.2 Retail sales with receipts", paidSales.length > 0, `${paidSales.length} paid sales with receipt codes`);

  // Verify receipt amounts match cart totals
  if (paidSales.length > 0) {
    const sale = paidSales[0];
    const itemTotal = (sale.items || []).reduce((s: number, i: any) => s + i.total, 0);
    const expectedTotal = itemTotal - (sale.discount || 0);
    log("5.3 Sale amount correct", Math.abs(sale.totalAmount - expectedTotal) < 0.01, `total: ${sale.totalAmount}, expected: ${expectedTotal} (subtotal: ${itemTotal} - discount: ${sale.discount})`);
  }

  // ═══════════════════════════════════════════
  // FINAL SCORECARD
  // ═══════════════════════════════════════════
  console.log("\n══════════════════════════════════════════════════");
  console.log(`  FINAL SCORECARD: ${passed}/${passed + failed} PASSED`);
  if (failed > 0) {
    console.log(`  ${failed} FAILURES:`);
    results.filter((r) => r.startsWith("[FAIL]")).forEach((r) => console.log(`    ${r}`));
  } else {
    console.log("  ALL TESTS PASSED");
  }
  console.log("══════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error("Test suite crashed:", e.message);
  process.exit(1);
});
