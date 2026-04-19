#!/bin/bash
# End-to-end returns flow test
set -e

BASE="http://localhost:3000/api"
UA="User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
ADMIN_ID="op_demo"
CASHIER_ID="op_cashier"
ORG="DEMO"

pass=0
fail=0

check() {
  local desc="$1" expected="$2" actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "✓ $desc"
    pass=$((pass+1))
  else
    echo "✗ $desc — expected '$expected', got: $(echo "$actual" | head -c 200)"
    fail=$((fail+1))
  fi
}

# ── TEST 1: Create a test sale for voiding ──────────────────────
echo ""
echo "═══ Creating test sale for VOID ═══"
SALE1=$(curl -s -X POST "$BASE/trade/sales" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "Content-Type: application/json" -H "$UA" \
  -d '{"items":[{"productId":"prod_8","quantity":2}],"paymentMethod":"CASH","soldBy":"op_demo","soldByName":"Demo Admin"}')
SALE1_ID=$(echo "$SALE1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
SALE1_RC=$(echo "$SALE1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('receiptCode',''))" 2>/dev/null)
check "Sale created for void test" "receiptCode" "$SALE1"
echo "  Sale ID: $SALE1_ID | Receipt: $SALE1_RC"

# ── TEST 2: Lookup sale for return ──────────────────────────────
echo ""
echo "═══ Lookup sale by receipt code ═══"
LOOKUP=$(curl -s "$BASE/trade/returns?view=lookup&receiptCode=$SALE1_RC" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "$UA")
check "Sale lookup returns eligibility" "canVoid" "$LOOKUP"
check "Sale lookup shows eligible items" "eligibleQty" "$LOOKUP"

# ── TEST 3: Void the sale ───────────────────────────────────────
echo ""
echo "═══ VOID same-day sale ═══"
VOID=$(curl -s -X POST "$BASE/trade/returns" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "Content-Type: application/json" -H "$UA" \
  -d "{\"saleId\":\"$SALE1_ID\",\"type\":\"VOID\",\"reason\":\"CUSTOMER_CHANGED_MIND\",\"refundMethod\":\"CASH\",\"processedByName\":\"Demo Admin\",\"items\":[{\"productId\":\"prod_8\",\"quantity\":2}]}")
check "Void completed" "COMPLETED" "$VOID"
check "Void has no credit note" "creditNoteCode" "$VOID"
check "Sale marked VOIDED" "VOIDED" "$VOID"
RETURN1_ID=$(echo "$VOID" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('return',{}).get('id',''))" 2>/dev/null)
echo "  Return ID: $RETURN1_ID"

# ── TEST 4: Block double-void ───────────────────────────────────
echo ""
echo "═══ Block double-void ═══"
DOUBLE=$(curl -s -X POST "$BASE/trade/returns" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "Content-Type: application/json" -H "$UA" \
  -d "{\"saleId\":\"$SALE1_ID\",\"type\":\"VOID\",\"reason\":\"DAMAGED\",\"refundMethod\":\"CASH\",\"processedByName\":\"Demo Admin\",\"items\":[{\"productId\":\"prod_8\",\"quantity\":2}]}")
check "Double-void blocked" "already fully reversed" "$DOUBLE"

# ── TEST 5: Create sale for refund testing ──────────────────────
echo ""
echo "═══ Creating test sale for REFUND ═══"
SALE2=$(curl -s -X POST "$BASE/trade/sales" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "Content-Type: application/json" -H "$UA" \
  -d '{"items":[{"productId":"prod_8","quantity":3},{"productId":"cmnx1vrw5000iinvazlctn9vb","quantity":1}],"paymentMethod":"CASH","soldBy":"op_demo","soldByName":"Demo Admin"}')
SALE2_ID=$(echo "$SALE2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
SALE2_RC=$(echo "$SALE2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('receiptCode',''))" 2>/dev/null)
check "Refund test sale created" "receiptCode" "$SALE2"
echo "  Sale ID: $SALE2_ID | Receipt: $SALE2_RC"

# ── TEST 6: Partial refund — return 1 of 3 cement bags ─────────
echo ""
echo "═══ PARTIAL REFUND ═══"
REFUND1=$(curl -s -X POST "$BASE/trade/returns" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "Content-Type: application/json" -H "$UA" \
  -d "{\"saleId\":\"$SALE2_ID\",\"type\":\"REFUND\",\"reason\":\"DAMAGED\",\"reasonText\":\"Bag was torn\",\"refundMethod\":\"CASH\",\"processedByName\":\"Demo Admin\",\"items\":[{\"productId\":\"prod_8\",\"quantity\":1}]}")
check "Partial refund completed" "COMPLETED" "$REFUND1"
check "Credit note generated" "CN-DEMO" "$REFUND1"
check "Sale marked PARTIALLY_REFUNDED" "PARTIALLY_REFUNDED" "$REFUND1"
REFUND1_AMOUNT=$(echo "$REFUND1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('refundAmount',0))" 2>/dev/null)
echo "  Refund amount: $REFUND1_AMOUNT pesewas"

# ── TEST 7: Second partial refund ───────────────────────────────
echo ""
echo "═══ SECOND PARTIAL REFUND (remaining cement + brake pads) ═══"
REFUND2=$(curl -s -X POST "$BASE/trade/returns" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "Content-Type: application/json" -H "$UA" \
  -d "{\"saleId\":\"$SALE2_ID\",\"type\":\"REFUND\",\"reason\":\"WRONG_ITEM\",\"refundMethod\":\"ORIGINAL\",\"processedByName\":\"Demo Admin\",\"items\":[{\"productId\":\"prod_8\",\"quantity\":2},{\"productId\":\"cmnx1vrw5000iinvazlctn9vb\",\"quantity\":1}]}")
check "Full refund completed" "COMPLETED" "$REFUND2"
check "Sale now FULLY_REFUNDED" "FULLY_REFUNDED" "$REFUND2"

# ── TEST 8: Block over-return ───────────────────────────────────
echo ""
echo "═══ Block over-return ═══"
OVER=$(curl -s -X POST "$BASE/trade/returns" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "Content-Type: application/json" -H "$UA" \
  -d "{\"saleId\":\"$SALE2_ID\",\"type\":\"REFUND\",\"reason\":\"DAMAGED\",\"refundMethod\":\"CASH\",\"processedByName\":\"Demo Admin\",\"items\":[{\"productId\":\"prod_8\",\"quantity\":1}]}")
check "Over-return blocked" "already fully reversed" "$OVER"

# ── TEST 9: Cashier high-value refund needs approval ────────────
echo ""
echo "═══ Cashier approval gate (high-value) ═══"
SALE3=$(curl -s -X POST "$BASE/trade/sales" \
  -H "x-operator-id: $CASHIER_ID" -H "x-org-code: $ORG" -H "Content-Type: application/json" -H "$UA" \
  -d '{"items":[{"productId":"cmnx1vrw5000iinvazlctn9vb","quantity":5}],"paymentMethod":"CASH","soldBy":"op_cashier","soldByName":"Demo Cashier"}')
SALE3_ID=$(echo "$SALE3" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
echo "  High-value sale: $SALE3_ID (5 x Brake Pads = 75000 pesewas > 50000 threshold)"

BLOCKED=$(curl -s -X POST "$BASE/trade/returns" \
  -H "x-operator-id: $CASHIER_ID" -H "x-org-code: $ORG" -H "Content-Type: application/json" -H "$UA" \
  -d "{\"saleId\":\"$SALE3_ID\",\"type\":\"REFUND\",\"reason\":\"CUSTOMER_CHANGED_MIND\",\"refundMethod\":\"CASH\",\"processedByName\":\"Demo Cashier\",\"items\":[{\"productId\":\"cmnx1vrw5000iinvazlctn9vb\",\"quantity\":5}]}")
check "Cashier blocked on high-value return" "requiresApproval" "$BLOCKED"

# ── TEST 10: Cashier with supervisor PIN ────────────────────────
echo ""
echo "═══ Cashier with supervisor PIN approval ═══"
APPROVED=$(curl -s -X POST "$BASE/trade/returns" \
  -H "x-operator-id: $CASHIER_ID" -H "x-org-code: $ORG" -H "Content-Type: application/json" -H "$UA" \
  -d "{\"saleId\":\"$SALE3_ID\",\"type\":\"REFUND\",\"reason\":\"CUSTOMER_CHANGED_MIND\",\"refundMethod\":\"CASH\",\"processedByName\":\"Demo Cashier\",\"approverPin\":\"1234\",\"items\":[{\"productId\":\"cmnx1vrw5000iinvazlctn9vb\",\"quantity\":5}]}")
check "Supervisor-approved refund completed" "COMPLETED" "$APPROVED"
check "Approver recorded" "op_demo" "$APPROVED"

# ── TEST 11: Get single return detail ───────────────────────────
echo ""
echo "═══ Single return detail ═══"
DETAIL=$(curl -s "$BASE/trade/returns/$RETURN1_ID" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "$UA")
check "Return detail loads" "originalSaleId" "$DETAIL"

# ── TEST 12: List returns ───────────────────────────────────────
echo ""
echo "═══ List returns ═══"
LIST=$(curl -s "$BASE/trade/returns" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "$UA")
TOTAL=$(echo "$LIST" | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',0))" 2>/dev/null)
check "Returns listed" "returns" "$LIST"
echo "  Total returns: $TOTAL"

# ── TEST 13: List by type filter ────────────────────────────────
VOIDS=$(curl -s "$BASE/trade/returns?type=VOID" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "$UA")
check "Filter by VOID type works" "returns" "$VOIDS"

# ── TEST 14: Stock restored check ──────────────────────────────
echo ""
echo "═══ Stock verification ═══"
STOCK=$(curl -s "$BASE/trade/inventory?view=movements&productId=prod_8" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "$UA")
check "Stock movements include RETURNED" "RETURNED" "$STOCK"

# ── TEST 15: Validation — bad type ──────────────────────────────
echo ""
echo "═══ Validation tests ═══"
BAD_TYPE=$(curl -s -X POST "$BASE/trade/returns" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "Content-Type: application/json" -H "$UA" \
  -d '{"saleId":"fake","type":"EXCHANGE","reason":"DAMAGED","refundMethod":"CASH","processedByName":"Test","items":[{"productId":"x","quantity":1}]}')
check "Invalid type rejected" "type must be" "$BAD_TYPE"

BAD_REASON=$(curl -s -X POST "$BASE/trade/returns" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "Content-Type: application/json" -H "$UA" \
  -d '{"saleId":"fake","type":"REFUND","reason":"INVALID","refundMethod":"CASH","processedByName":"Test","items":[{"productId":"x","quantity":1}]}')
check "Invalid reason rejected" "reason must be" "$BAD_REASON"

MISSING=$(curl -s -X POST "$BASE/trade/returns" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "Content-Type: application/json" -H "$UA" \
  -d '{"type":"REFUND"}')
check "Missing fields rejected" "required" "$MISSING"

# ── TEST 16: Audit log ──────────────────────────────────────────
echo ""
echo "═══ Audit trail ═══"
AUDIT=$(curl -s "$BASE/audit?action=return" \
  -H "x-operator-id: $ADMIN_ID" -H "x-org-code: $ORG" -H "$UA")
check "Return actions in audit log" "return" "$AUDIT"

echo ""
echo "═══════════════════════════════════════"
echo "Results: $pass passed, $fail failed"
echo "═══════════════════════════════════════"
