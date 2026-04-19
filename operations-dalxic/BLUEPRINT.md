# DALXIC UNIVERSAL PLATFORM — MASTER BLUEPRINT

> **One document. One architecture. One engine.**
> This is the single reference for the entire Dalxic platform — the WHY, the WHAT, and the HOW.
>
> **Date:** 2026-04-17 (architecture) · 2026-04-15 (flows)
> **Status:** Definitive. No separate version files. Updates merge into this document.

---

## How This Document Is Organised

Like a textbook — one book, multiple chapters, one umbrella:

| Part | Chapters | What It Covers |
|------|----------|---------------|
| **I — The V6 Foundation** | §1–§17 | The 6 behaviours, engine, system architecture, data model, API, config |
| **II — Flow Architecture** | §18–§20 | How to read flows, design principles, patchflow contracts, flow inventory |
| **III — The 19 Flows** | §21–§40 | Every flow mapped node-by-node with intersection slots |
| **IV — Platform Concerns** | §41 | Analytics, SEO, public surfaces |
| **V — Execution** | §42–§46 | Open questions, audit gate, build phases, slot matrix, offline sync |

---

# PART I — THE V6 FOUNDATION

> The 6 behaviours ARE the codebase. Everything else is config.


## §1. The Core Truth

Every business in the world runs on 6 behaviours. Not industry-specific categories — the same 6, with different labels. Same data model, same lifecycle, same state machine. The system doesn't need to know it's a hospital, school, or salon. It just needs to know which behaviours the business owner has activated and what they call them.

"Every '—' I wrote was a failure of imagination, not a limitation of the architecture. The 6 behaviours are truly universal — the only question is whether the business owner has activated them yet."

---

## §2. The Universal Behaviour Table

Zero dashes. Every cell filled.

| Behaviour        | Hospital             | Trade               | Restaurant          | School               | Hotel             | Salon                | Mechanic          | Gym                 | Pharmacy            | Law                |
|-----------------|---------------------|---------------------|---------------------|-----------------------|-------------------|----------------------|-------------------|---------------------|---------------------|--------------------|
| **Consultation** | Doctor visit         | Customer assist     | Waiter walks menu   | Admissions counsel    | Concierge         | Style consult        | Diagnosis         | Fitness assessment  | Pharmacist advice   | Legal consult      |
| **Procedure**    | Surgery              | Warehouse pick      | Kitchen prep        | Lesson delivery       | Room prep         | Haircut              | Repair work       | Training session    | Compounding         | Court appearance   |
| **Product**      | Drugs                | Goods               | Food & drink        | Textbooks             | Minibar           | Hair products        | Parts & fluids    | Supplements         | Medications         | Document copies    |
| **Admission**    | Patient → bed        | Product → shelf     | Diner → table       | Student → class       | Guest → room      | Client → chair       | Vehicle → bay     | Member → roster     | Batch → stock       | Case → docket      |
| **Recurring**    | Ward nightly         | Supplier credit / loyalty | Tab / VIP membership | Term fees        | Room night / loyalty | Monthly membership | Service plan      | Monthly subscription | Chronic med refill  | Retainer           |
| **Admin**        | Patient card / roles | Bookkeeping / roles | Staff roles / shifts | Grading / certs      | Staff roles / shifts | Role assign / shifts | Warranty admin    | Class scheduling    | Regulatory logs     | Case admin         |

### The Salon Proof

A salon with the right mindset runs all 6:
- **Consultation**: Style consult (what do you want?)
- **Procedure**: Haircut (the work performed)
- **Product**: Hair products (physical goods sold)
- **Admission**: Client → chair (occupy capacity for duration)
- **Recurring**: Monthly membership (GHS 50/month = unlimited basic cuts, or GHS 30 = 4 cuts capped). Walk-in member just shows up, gets the cut, no payment at the counter — the membership recurring charge handles it automatically
- **Admin**: Role assignment / shifts (nail tech, male barber, stylist, braider)

That's not a "salon feature" — that's the **Recurring** behaviour + **Admission** (member → roster) + **Payment gate** (pre-paid via subscription, gate auto-passes). Same infrastructure a hospital ward uses for nightly charges. Same infrastructure a gym uses. Same infrastructure a school uses for term fees.

The system doesn't need to know it's a salon. It just needs to know: this org has a recurring charge linked to an admission, and the payment gate is pre-cleared by the active subscription.

---

## §3. Three Stock Types

| Type         | Rule                                        | Examples                                |
|-------------|--------------------------------------------|-----------------------------------------|
| **Physical** | Counted, decrement on sale, FEFO for expiry | Drugs, goods, food, parts, textbooks    |
| **Capacity** | Counted, occupy/release, no decrement       | Beds, tables, chairs, bays, rooms, seats |
| **Service**  | Infinite, no stock tracking                 | Consultations, haircuts, training, lessons |

---

## §4. Two Payment Gates

| Gate           | Flow                      | Verticals                          |
|---------------|--------------------------|-------------------------------------|
| **Pay-before** | Bill → collect → serve    | Hospital, School, Gym, Law, Hotel   |
| **Pay-after**  | Serve → bill → collect    | Retail, Restaurant, Salon, Mechanic, Pharmacy |

---

## §5. The Spine

Every vertical flows through the same spine. What changes is the **entry point**.

```
Cart → Tender → Payment → Stock Effect → Receipt → Done
```

| Vertical    | Entry Point                | Payment Gate |
|------------|---------------------------|-------------|
| Trade      | Cart (add items)          | Pay-after   |
| Health     | Clinical Event → Bill     | Pay-before  |
| Restaurant | Order / Tab               | Pay-after   |
| Institute  | Enroll → Fee Schedule     | Pay-before  |
| Salon      | Walk-in → Service Select  | Pay-after   |
| Gym        | Membership enrollment     | Pay-before  |
| Mechanic   | Vehicle check-in          | Pay-after   |
| Pharmacy   | Prescription → Counter    | Pay-after   |
| Hotel      | Reservation → Check-in    | Pay-before  |
| Law        | Case intake → Retainer    | Pay-before  |

The 19 flows documented in this document (Sale Journey, Restock Journey, Day-Close, Returns, Expenses, Inventory Count, Multi-Branch Transfer, Enrollment, Attendance, Fees, Tenant Lifecycle, Auth, Billing, Compliance, Support, Release Rollout, Remote Assistance, Break-Glass, DOH) are all implementations of this spine applied to specific contexts.

---

## §6. The Engine (5 Frozen Files)

```
src/lib/engine/
├── sale.ts              sale + saleItem + atomic stock
├── receipt.ts           receipt code generation
├── returns.ts           void + refund + restock
├── reconcile.ts         day-close + Z-report
└── payment-methods.ts   cash + momo + card + insurance
```

These 5 files know NOTHING about verticals. They handle the spine and nothing else.

### sale.ts
- `createCart(orgId, branchId, operatorId, contactId?, paymentGate)` → Cart
- `addItem(cartId, serviceItemId, quantity, discount?)` → CartItem
  - Looks up ServiceItem, resolves price, calculates line total
  - Sets `behaviour` from ServiceItem.behaviour
- `removeItem(cartItemId)`
- `updateItemQuantity(cartItemId, quantity)`
- `tenderCart(cartId)` → { subtotal, discountTotal, taxTotal, grandTotal, items[] }
  - Calculates tax based on org.taxConfig
  - Returns breakdown ready for payment

### receipt.ts
- `generateReceiptCode(orgCode, prefix?)` → "KBH-001", "DEMO-T-001"
- `createReceipt(payment, cart, items)` → Receipt (prices frozen at time of payment)

### returns.ts
- `createReturn(orgId, paymentId, items[], type, reason, refundMethod, processedBy)` → Return
- Void: reverses entire payment
- Refund: partial or full
- If restockItems: reverses stock movements
- `generateCreditNoteCode(orgCode)` → credit note code

### reconcile.ts
- `dayClose(orgId, branchId, operatorId, closingCash)` → Z-report
- `generateZReport(orgId, branchId, date)` → aggregated daily report
- Calculates: salesCount, salesTotal, returnTotal, cashExpected, cashActual, variance

### payment-methods.ts
- `processPayment(cartId, method, amount, reference?, processedBy)` → { payment, receipt, stockMovements[] }
- Triggers stock effects based on each item's stockType:
  - physical → decrement (FEFO if expiry tracked)
  - capacity → occupy (increment capacityUsed)
  - service → no-op
- Creates Payment + Receipt + StockMovement + AuditLog
- Methods: cash, momo_mtn, momo_voda, momo_at, bank, card, store_credit, nhis, insurance, waived

---


---

## §7. The V6 System Architecture

The 6 behaviours are not abstract categories — they are literal code modules. The entire system is 4 folders:

```
dalxic/
├── engine/        ← 5 frozen payment files (BUILT)
│   sale.ts             sale + saleItem + atomic stock
│   receipt.ts          receipt code generation
│   returns.ts          void + refund + restock
│   reconcile.ts        day-close + Z-report
│   payment-methods.ts  cash + momo + card + insurance
│
├── behaviours/    ← The 6 modules (~200 lines each)
│   consultation.ts     create, assign provider, gate check
│   procedure.ts        create, fulfil, stock consume, provider
│   product.ts          catalogue, stock, FEFO, reorder
│   admission.ts        check-in, assign slot, duration, release
│   recurring.ts        schedule, charge, renew, freeze
│   admin.ts            roles, shifts, bookkeeping, config
│
├── verticals/     ← Config files (~50 lines each)
│   health.json · trade.json · restaurant.json · institute.json
│   salon.json · law.json · mechanic.json · gym.json
│   pharmacy.json · hotel.json
│
└── ui/            ← The physical output layer
    theme.ts            reads vertical config → colours
    terms.ts            reads vertical config → labels
    components/         same components everywhere
```

### The 4 Pillars

| Pillar | What It Does | Changes When |
|--------|-------------|-------------|
| **engine/** | Processes payments, stock, receipts, returns, reconciliation | Never (frozen) |
| **behaviours/** | Implements the 6 universal business actions | Rarely (stable contracts) |
| **verticals/** | Defines what a vertical looks like (colors, labels, active behaviours) | New vertical = new JSON file |
| **ui/** | Renders the system for human interaction (touchscreen, keyboard, mouse) | Design language changes |

UI is not a separate concern — it is the physical representation of the working functionality. `ui/` reads `verticals/` config to determine what the user sees. Same components render a hospital workstation and a salon booking screen — only the theme and terminology change.

### Vertical Config Shape

```json
{
  "id": "health",
  "name": "DalxicHealth",
  "theme": { "primary": "...", "accent": "...", "background": "..." },
  "terminology": {
    "consultation": "Doctor Visit",
    "procedure": "Surgery",
    "product": "Drugs",
    "admission": "Patient → Bed",
    "recurring": "Ward Nightly",
    "admin": "Patient Card / Roles"
  },
  "activeBehaviours": ["consultation", "procedure", "product", "admission", "recurring", "admin"],
  "paymentGate": "pay_before",
  "activeModules": ["clinical", "queue", "pharmacy", "lab", "ward", "billing"]
}
```

New vertical = new config file. Same engine. Same behaviours. Same UI components.

## §8. Config-Driven Verticals

```typescript
Organization {
  type: "salon"                                    // determines skin/theme
  activeBehaviours: ["consultation", "procedure",  // which of the 6 are active
                     "product", "admission", 
                     "recurring", "admin"]
  paymentGate: "pay_after"                         // how payment flows
  labelConfig: {                                   // vertical-specific labels
    consultation: "Style Consult",
    procedure: "Haircut",
    product: "Hair Products",
    admission: "Client → Chair",
    recurring: "Monthly Membership",
    admin: "Role Assignment"
  }
  activeModules: ["pos", "inventory", "shifts"]    // which UI screens show
  taxConfig: { vat: 15, nhil: 2.5, ... }          // Ghana tax rates
}
```

New vertical = new theme + new label config + activate relevant behaviours. Same engine. Same 5 files.

---

## §9. The ServiceItem (Universal Product Table)

Every sellable thing — a drug, a haircut, a ward bed, a textbook, a lab test — is a ServiceItem.

```
ServiceItem {
  behaviour:         "consultation" | "procedure" | "product" | "admission" | "recurring" | "admin"
  stockType:         "physical" | "capacity" | "service"
  sellingPrice:      Int (pesewas)
  costPrice:         Int (pesewas)
  stock:             Int (current count for physical/capacity)
  capacityTotal:     Int? (max for capacity items: beds, seats)
  capacityUsed:      Int? (currently occupied)
  recurringInterval: "daily" | "weekly" | "monthly" | "termly" | "yearly" (for recurring)
  // ... standard fields: name, sku, category, photo, barcode, tax, commission, etc.
}
```

A doctor consultation, a can of Coca-Cola, a ward bed night, a term fee, and a legal retainer are ALL ServiceItems. The `behaviour` and `stockType` fields determine how the engine processes them.

---

## §10. Universal Contact

One table replaces Patient, Customer, Student, Supplier:

```
Contact {
  type:    "patient" | "customer" | "student" | "guardian" | "supplier" | "member" | "client" | "partner"
  status:  "active" | "inactive" | "graduated" | "suspended" | "discharged" | "deceased"
  meta:    Json  // flexible per-vertical data (medical history, academic records, purchase history)
  // ... standard fields: name, phone, email, DOB, gender, guardian, insurance, loyalty, photo
}
```

---

## §11. Admission + Recurring (Universal)

**Admission** — anything that occupies capacity for a duration:
```
Admission {
  type: "ward" | "icu" | "table" | "seat" | "class" | "bay" | "room" | "membership" | "case"
  contactId → Contact
  serviceItemId → ServiceItem (the capacity item)
  identifier: "Bed 3" | "Table 7" | "Class 4A" | "Bay 2"
  status: "active" | "discharged" | "transferred" | "completed" | "expired"
}
```

**Recurring** — time-based billing on an active admission:
```
RecurringCharge {
  admissionId → Admission
  serviceItemId → ServiceItem
  interval: "daily" | "weekly" | "monthly" | "termly" | "yearly"
  autoCharge: Boolean  // if true, auto-creates cart item on due date
  status: "active" | "paused" | "cancelled" | "completed"
}
```

Hospital ward nightly = Admission(patient→bed) + RecurringCharge(daily, 100 GHS)
School term fee = Admission(student→class) + RecurringCharge(termly, amount)
Gym membership = Admission(member→roster) + RecurringCharge(monthly, 50 GHS)
Same code. Different labels.

---

## §12. Vertical-Specific Extensions

These DON'T replace the spine — they FEED INTO it.

### Health Extensions
- **ClinicalRecord** — SOAP notes, vitals, lab orders/results, prescriptions, imaging reports, injection records, daily rounds
- **QueueEntry** — patient queue with tokens, severity, priority, visit status
- When a clinical event completes → adds ServiceItem to patient's cart → flows through the spine
- Doctor completes consultation → CONSULTATION item added to cart
- Lab completes test → LAB item added
- Pharmacy dispenses → DRUG product items added (with stock decrement)
- Ward daily round → WARD_DAY recurring charge fires

### Institute Extensions
- **Group, Subject, GroupSubject** — academic structure
- **Exam, Grade** — assessment and grading
- **Attendance** — daily tracking
- **ScheduleSlot** — timetable
- Fee payment → create cart items → pay through /api/cart/[id]/pay (same spine)

### Trade Extensions
- **Supplier, PurchaseOrder, POItem** — supply chain
- **Shift** — till management, uses reconcile.ts for day-close
- **Expense** — operational expenses
- All sales flow through the spine directly

---

## §13. Ghana-Specific

| Tax              | Rate  |
|-----------------|-------|
| VAT              | 15%   |
| NHIL             | 2.5%  |
| GETFund          | 2.5%  |
| COVID Levy       | 1%    |
| SSNIT T1 Employer | 13%  |
| SSNIT T2 Employer | 5%   |
| SSNIT Employee   | 5.5%  |

**PAYE brackets (monthly GHS):**
0–490: 0% · 490–600: 5% · 600–730: 10% · 730–3,896: 17.5% · 3,896–20,000: 25% · 20,000–50,000: 30% · 50,000+: 35%

**Currency:** GHS (Ghana Cedis). All internal amounts in pesewas (Int).
**Payment methods:** Cash, MoMo (MTN/Vodafone/AirtelTigo), Bank Transfer, Card, Store Credit, NHIS, Insurance, Waived.

---

## §14. API Structure

ONE set of spine endpoints serves ALL verticals:

```
CORE
  POST   /api/auth/login              { orgCode, pin }
  GET    /api/org
  PATCH  /api/org
  CRUD   /api/operators
  CRUD   /api/branches
  GET    /api/audit

SERVICE CATALOGUE
  CRUD   /api/catalogue               ServiceItems (universal)
  CRUD   /api/categories

THE SPINE (same for EVERY vertical)
  POST   /api/cart                    Create cart
  GET    /api/cart/[id]               Cart + items
  POST   /api/cart/[id]/items         Add item (by serviceItemId)
  PATCH  /api/cart/[id]/items/[id]    Update qty/discount
  DELETE /api/cart/[id]/items/[id]    Remove item
  POST   /api/cart/[id]/tender        Calculate totals + tax
  POST   /api/cart/[id]/pay           THE payment endpoint — ALL verticals

RECEIPTS + RETURNS
  GET    /api/receipts
  GET    /api/receipts/[code]
  CRUD   /api/returns

STOCK
  GET    /api/stock
  POST   /api/stock/receive
  POST   /api/stock/adjust
  POST   /api/stock/transfer

UNIVERSAL
  CRUD   /api/contacts
  CRUD   /api/admissions
  CRUD   /api/recurring + POST /api/recurring/process
  CRUD   /api/payroll/*
  GET    /api/reports/*

HEALTH EXTENSIONS (feed INTO spine)
  /api/health/queue
  /api/health/clinical
  /api/health/clinical/dispense
  /api/health/clinical/lab-result

INSTITUTE EXTENSIONS (feed INTO spine)
  /api/institute/groups, subjects, exams, grades, attendance, schedule, calendar
  /api/institute/fees/generate → creates RecurringCharges → pay via /api/cart/[id]/pay

TRADE EXTENSIONS (feed INTO spine)
  /api/trade/suppliers, purchase-orders, shifts, expenses

HEALTH CHECK
  GET    /api/health-check            Heartbeat (keeps Neon warm)
```

---

## §15. Color System

| Vertical     | Accent   | Hex       |
|-------------|----------|-----------|
| Master Ops   | Emerald  | #10B981   |
| Trade        | Amber    | #F59E0B   |
| Health       | Copper   | #D97706   |
| Institute    | Sky      | #0EA5E9   |
| Media        | Violet   | (existing) |
| Judiciary    | TBD      | TBD       |

---

## §16. The Moat

A competitor sees DalxicHealth as a hospital system, DalxicOperations as a retail POS, the restaurant product as kitchen management. They look like completely different products. The shared engine underneath is invisible.

To copy Dalxic, a competitor must:
1. Realize all products are one system (not obvious from the outside)
2. Reverse-engineer the universal 6-behaviour architecture
3. Rebuild the engine + patchflow slots + vertical skins
4. By then, Dalxic has shipped 10 more verticals off the same root

---

## §17. Build Priority

1. **Health** — 15 workstations, clinical workflows, copper accent (REBUILD from scratch)
2. **Trade** — 23 pages exist but predate this architecture, need realignment to ServiceItem/behaviour model
3. **Institute** — full rebuild, sky accent, academic workflows
4. **Backend Engine** — 5 frozen files + API routes + Prisma schema

**Rule:** UI first (mock data), then wire to engine. Finish and approve UI before wiring backend.

---


# PART II — FLOW ARCHITECTURE

> Design principles, patchflow architecture, and flow inventory.


## §18. How to read this document

**This is a UI-anchored blueprint.** Every flow starts at a UI moment the user touches and traces every domino that falls before the UI settles again. No code. No schemas. No API signatures. Just behaviour and data movement.

**Four flow shapes:**
- **V-shape (control flows)** — authority cascades down from master ops to a tenant UI moment; consequences ripple back up. Example: tenant granted Loyalty trial → all loyalty surfaces light up in Trade → loyalty usage billing bubbles back to master ops.
- **J-shape (tenant-internal flows)** — tenant action, small audit ripple back to master ops, no control arc. Example: cashier applies a 5% discount within their authority.
- **Lateral (interrupt flows)** — master ops injects sideways into a running tenant session. Example: break-glass unlock, device kill-switch, remote assistance.
- **Intersection slot (pluggable behavior)** — a defined open door in a flow where a vertical-specific module plugs in pluggable behavior. The spine is vertical-agnostic; the plug-in behavior is entitlement-driven. Example: at "ring up," a retail tenant gets product search; a restaurant tenant (with Menu + Modifiers entitled) gets menu picker + modifier tree at the same slot. A tenant with BOTH entitled gets both — same cart, same spine.

**One tenant, many activations** (the master principle): Every tenant runs the same codebase. The entitlement engine opens the intersection slots appropriate to their business. A fuel station with a convenience shop AND a small kitchen has Retail Inventory + Menu & Recipes both entitled — the same sale can contain a bag of rice (retail SKU path) and a plate of jollof (recipe explosion path). Modules don't fork the system; they unlock doors.

**Graceful degradation rule:** Locked modules are **visible** (grayed), not hidden. Visibility itself is the upsell. Every locked path has a defined landing (upsell page, empty state, disabled button with tooltip) — never a 404, never a crash.

**4 + N ops linkage:** every tenant module links to 4 mandatory ops screens (`modules`, `tiers`, `add-ons`, `tenants/T/entitlements`) plus N conditional screens (`settings`, `compliance`, `billing`, `support`, `audit`, `analytics`, `releases`, `infra`).

---

## §19. Design principles

1. **One tenant, many activations — the master principle.** There is ONE application. Every tenant gets the same codebase. The entitlement engine opens the intersection slots (doors) appropriate to their business: retail, restaurant, hospitality, services, mixed. A single tenant with multiple vertical modules entitled runs all behaviors on the same spine. No forks. No separate apps. Doors.
2. **Patchflow — the architectural spine principle.** Every flow in this blueprint is a **patchflow**: a stable spine + named slots with contracted shapes, modelled on the audio-engineering patchbay. Modules plug into slots; the spine never changes to accommodate a module. When a new capability (vertical, add-on, future plug-in) needs to attach, there are only three moves: (a) plug through an existing slot (preferred), (b) declare a new slot with a contracted shape (when none fits), or (c) reject the module as wrong-flow (rare — reconsider spine only if the module belongs on a different patchflow entirely). Spine-surgery to accommodate a module is forbidden. Patchbay vocabulary carries over: **normaled** = slot's default behavior when no module plugs in; **half-normaled** = default behavior plus observer taps (audit ripples, analytics events) that listen without diverting the flow; **de-normaled** = slot that requires a specific module to function (e.g., restaurant Menu must plug into the "ring up" slot for restaurant tenants); the slot **contract** (TRS/TT jack standard) = accepted input payload shape + output callback shape + failure semantics; **re-patching** = swapping or adding modules at a slot without touching flow nodes. **Phase 1 = spine frozen + slot matrix open.** Add-ons are normal operating procedure, not exceptions. Audit lens: *every add-on path must flow through a slot, never through the spine.*
3. **Blueprint before code.** No non-trivial feature ships without its flow mapped here first.
4. **UI is the truth source.** Every flow is anchored to a UI moment, not an architectural layer.
5. **Ops is quiet.** Master ops is called in only when needed (emergency, entitlement change, support, billing, audit, compliance). It never sits in the happy-path.
6. **Locked ≠ hidden.** Grayed modules stay visible to sell themselves.
7. **Offline-first where customer-facing.** POS, receipts, inventory lookup must work offline. Every customer-facing flow has an offline variant.
8. **Preserve, don't delete.** Downgrades preserve data as read-only. True erasure only through compliance-approved flow.
9. **Every mutation audits.** No silent changes. Every state transition writes to the audit trail.
10. **Graceful degradation over hard failure.** Locked features, hardware failures, network drops — all have defined fallbacks.

---

### §19.A — Patchflow slot contract template

Every slot declared in §21–§40 must be specified using this template. Contracts are the jack standard (TRS/TT equivalent): two modules designed against the same contract are guaranteed to inter-operate when plugged into the same slot.

```
[Sx — Slot Name]
Flow location:         Node N of §X (one-line anchor to the spine moment)
Connection type:       Normaled | Half-normaled | De-normaled
Input payload:         { field: type, ... }                     ← what the spine hands the module
Output callback:       { field: type, ... }                     ← what the module must return to unblock the spine
Failure semantics:     [retry | fallback-to-default | block | degrade-graceful]
                       Explicit path for: module-not-entitled, module-crashed, module-timeout, contract-violation
Default behavior:      prose — what happens when no module plugs in (normaled) or when module unreachable
Observer taps:         audit-event, analytics-event (for half-normaled slots only)
Entitlement gate:      which module/tier lights this slot up
Re-patch policy:       can modules be swapped at runtime? (yes/no/requires-restart)
```

**Connection-type definitions (glossary):**

- **Normaled** — slot has a working default. When no module is plugged in, the spine keeps flowing with the default behavior. Example: S1 "Item entry" defaults to barcode/text search; restaurant Menu module replaces this when entitled.
- **Half-normaled** — normaled behavior plus mandatory observer taps. The slot's default keeps the spine flowing, AND every passage through the slot emits an audit event and/or analytics event. The observer never diverts the flow; it only listens. Example: S16 "Receipt template" — default retail receipt prints + an audit event fires + analytics records the template rendered, even when no receipt-branding module is entitled.
- **De-normaled** — slot requires a specific module to function. If the required module is not entitled, the flow blocks at this slot or refuses entry to the flow entirely. Example: C7 "Tip-out distribution" is de-normaled for restaurant tenants (retail is no-op, but a restaurant tenant that has entered close-flow must have tip-out rules configured; null is not allowed).

**Contract violation handling (universal):**

If a plugged-in module returns a payload that violates its declared output shape:
1. Spine logs a `contract_violation` audit event with full payload snapshot.
2. Spine falls back to slot's failure semantics (retry / fallback-to-default / block / degrade-graceful).
3. Master ops receives a `module_contract_violation` alert tagged to the tenant + module + slot.
4. If the same module violates the same slot's contract ≥3 times in 1h, entitlement engine auto-suspends the module for that tenant and emits a `module_quarantined` event. Manual re-enable required.

This guards against rogue vertical modules breaking the spine for tenants who have that module entitled.

**Re-audit rule:** any slot defined in §21–§40 without this template filled in is a **blueprint gap** and must be closed before its corresponding flow's backend work begins.

---

## §20. Flow inventory

Flows to be mapped in this blueprint. **Ink** = fully drawn; **Pencil** = stubbed pending George's scope call.

### Primary flows (one spine each, pluggable via intersection slots)
| # | Flow | Status |
|---|---|---|
| 1 | The Sale Journey | **Ink** ← this document |
| 2 | The Restock Journey | **Ink** ← this document |
| 3 | The Day-Close Journey | **Ink** ← this document |
| 4 | The Return / Refund / Void Journey | **Ink** ← this document |
| 5 | The Expense Journey | **Ink** ← this document |
| 6 | The Inventory Count / Adjustment Journey | **Ink** ← this document |
| 7 | The Multi-Branch Transfer Journey | **Ink** ← this document |

### Institute flows (separate spines, same pluggable principle)
| # | Flow | Status |
|---|---|---|
| 8 | The Enrollment Journey | **Ink** ← this document |
| 9 | The Attendance Journey | **Ink** ← this document |
| 10 | The Fees Journey | **Ink** ← this document |

### Cross-cutting flows (both verticals, master-ops driven)
| # | Flow | Status |
|---|---|---|
| 11 | The Tenant Lifecycle (signup → trial → activation → upgrade → suspend → archive) | **Ink** ← this document |
| 12 | The Auth / Session Journey | **Ink** ← this document |
| 13 | The Billing Journey (master ops invoices tenants) | **Ink** ← this document |
| 14 | The Compliance / Filing Journey | **Ink** ← this document |
| 15 | The Support Journey | **Ink** ← this document |
| 16 | The Release Rollout Journey | **Ink** ← this document |
| 17 | The Remote Assistance Journey | **Ink** ← this document |
| 18 | The Break-Glass / Device Kill Journey | **Ink** ← this document |
| 19 | The Daily Online Handshake & Heartbeat (DOH) — anti-piracy spine | **Ink** ← this document |

### Module plug-ins (not flows — these plug INTO flows at intersection slots)
Not counted as separate journeys. Each plugs into the Sale Journey (or other spines) at defined slots documented in Section §21.4.

**Restaurant plug-ins:** Menu & Recipes · Tables & Floor Plan · Kitchen Display (KDS) · Modifiers & Options · Reservations · Course Pacing · 86 List · Service & Tips · Wastage/Spoilage · Bar Tabs

**Retail plug-ins:** All 25 modules documented on Trade launchpad (POS, Inventory, Customers, Loyalty, etc.) are plug-ins into the Sale Journey and companion flows.

**Future verticals** (hospitality, services, pharmacy, etc.) will introduce their own plug-in module sets that activate the same intersection slots with vertical-specific behavior.

---


---

# PART III — THE 19 FLOWS

> Every flow mapped node-by-node with intersection slots.


## §21. FLOW — The Sale Journey

> The atomic value-exchange of Trade — every tenant's heartbeat regardless of vertical.
> **Shape:** V-shape (authority from /ops down, action at cashier/server, consequences ripple back up).
> **Vertical-agnostic:** the spine below describes behavior that is true for every tenant, retail to restaurant to hospitality. Vertical-specific behavior plugs in at the intersection slots defined in Section §21.4.
> **Frequency:** dozens to hundreds per day per tenant.

### §21.1 Skeleton

```
[Customer arrives] → [Rings up items] → [Customer pays] → [Receipt issued] → [Customer leaves]
```

Five nodes. The space between each node is where every connected module plugs in via intersection slots.

### §21.2 Preconditions (must be true before the flow can start)

| Precondition | Sourced from | Failure mode |
|---|---|---|
| Tenant T active (not suspended / frozen) | `/ops/tenants/T` | Sale blocked; cashier sees "Your account is suspended" banner |
| Tier includes POS module | `/ops/tiers` + `/ops/tenants/T/entitlements` | POS card grayed on launchpad; sale cannot start |
| Cashier authenticated | Auth session | Login PIN gate, lockout after N tries |
| Cashier role has `pos.open` | Roles & Access module | "You do not have permission to open POS" |
| Shift open at this till | Shifts & Till module (float declared at open) | "Open a shift to begin selling" CTA |
| Branch selected | Multi-Branch module (if multi-branch) | Single-branch: implicit; multi: forced chooser |
| Catalogue loaded | Inventory module (cached) | Empty catalogue: quick-add inline flow (first-day UX) |
| Tax rates current | Tax Engine (synced from `/ops/settings`) | Fallback to last-known rates + warning banner |
| Payment providers configured | `/ops/settings` → synced to tenant | Cash-only mode if none configured |
| COA exists with required accounts | Chart of Accounts module | "Finish accounting setup before selling" blocker |
| Device clock within tolerance | Server time sync | Sync attempt; if drift > N minutes, block writes until corrected |
| Device enrolled in tenant fleet | Device registry | Unenrolled device: prompt enrollment flow, cannot sell |

---

### §21.3 Node-by-node with lego connectors

#### NODE 1: Customer arrives

**UI moment:** Operator on `/trade/pos` initiates a new transaction via the **cart-initiation slot** (S0). Default (normaled) behavior: cashier clicks "New Sale" or barcode scan fires auto-open. Vertical plug-ins re-patch this slot (table-tap on floor plan for restaurant; QR-table self-service for guest-initiated orders; appointment-resume for services; check-in for hospitality). See §21.4 S0 for the full contract.

| Sub-connector | Reads | Writes | Ripple |
|---|---|---|---|
| New cart container created (see slot: **Cart container**) | shift context, till context, branch context | cart or tab row with status:open | audit: `cart.opened` |
| Cart UI renders | empty catalogue | — | — |

**Return to UI:** The shell rendered by the S4 cart-container plug-in (normaled default: empty cart with search bar and scanner focus; re-patched surfaces: table-scoped tab view, appointment workspace, folio workspace).

---

#### NODE 2: Rings up items

**UI moments** are routed through the **item-entry slot** (S1) and **quantity-entry slot** (S3). Any of these fire, in any order, repeatable — the UI surface exposed depends on which modules are re-patched at S1/S3 for the tenant:
- Text / barcode search (normaled default at S1)
- Category tile navigation (normaled)
- Camera scan / quick-add via photo (S2 Quick-add via camera)
- Scale-driven quantity capture (S3 plug-in: bulk scale integration)
- Menu picker with modifier tree (S1 plug-in: Menu & Recipes, de-normaled for restaurant tenants)
- Service catalogue / duration picker (S1 plug-in: Services)
- Room + rate + nights picker (S1 plug-in: Hospitality)

See §21.4 for slot contracts. Spine behaviour after S1 returns is identical regardless of which plug-in handled entry.

For each item added, these lego connectors fire in sequence:

```
[Item identified]
     ▼
[Catalogue lookup] ───────────── if barcode not found → manual search fallback
     ▼                            if still not found → "quick add product" inline modal
     │                            (snap photo via camera, set name + price → add)
[Entitlement check] ──────────── some items restricted by role (e.g., alcohol by age-flagged cashier)
     ▼                            age verification plug-in may fire here
[Price resolution] ──────────── base price + active promo + customer-tier price
     ▼                            time-gated pricing (happy hour) evaluated
[Loyalty price override] ─────── S5.5 slot: customer-tier-based price pre-empts promo match when module entitled
     ▼
[Modifier resolution] ────────── S9 slot: modifier tree → price delta (de-normaled for restaurant)
     ▼
[Promo match] ───────────────── cart-level + line-level + customer-level rules evaluated
     ▼                            conflicts resolved by priority engine
[Tax split] ──────────────────── S14 slot: VAT 15% + NHIL 2.5% + GETFund 2.5% + COVID 1%
     ▼                            tax-exempt items skip; tax-inclusive pricing reverses math
     │                            vertical tax plug-ins stack here (alcohol excise, tourism levy, etc.)
[Cold-chain compliance] ──────── S14.5 slot: temperature / condition gate (de-normaled for pharmacy / vaccine-carrying tenants)
     ▼
[Availability check] ──────────── S7 slot: stock-on-hand soft-check (normaled default); 86-list / schedule map / occupancy map via plug-in
[Line added to cart] ────────── cart.items[] append; running total updates
     ▼
[Audit line event] ──────────── audit: `cart.item_added`
```

**Customer attach (conditional, any time before payment):**
```
[Cashier/server clicks "Add Customer" or "Add Guest"]
     ▼
[Customers module search] ────── S8 slot: phone / name / loyalty card; extensions via plug-in (cover count for restaurant, client history for services, guest profile for hospitality)
     ▼
[Customer selected OR created inline]
     ▼                            inline creation: name + phone + marketing consent toggle
[Credit check] ───────────────── if customer has AR balance + hit limit → block credit tender
     ▼
[Loyalty tier reveal] ────────── S17 slot default: tier banner; plug-in re-patches surface (frequency stamps, stay credits, etc.)
     ▼
[Allergy / special flag] ─────── S10 slot: normaled = no-op; de-normaled plug-ins surface red banner and propagate flag to fulfilment ticket (allergy for restaurant, medical for services, accessibility for hospitality)
     ▼
[Loyalty promos re-evaluated] ─ tier-specific discounts may apply retroactively to cart
     ▼
[Cart totals re-render]
```

**Approval interrupts** (pauses Node 2 until resolved):
- Discount > configured threshold → "Manager PIN required" modal → supervisor authorises → logged
- Manual price override → same
- Restricted item override → same
- Age-verified item + cashier not age-authorized → supervisor approval

**Return to UI after each ring-up:** Updated cart list with running subtotal, tax total, discount total, grand total. S4 cart-container plug-ins extend the header with vertical-specific context (table # + covers + course markers for restaurant; appointment block + provider for services; folio + guest for hospitality).

---

#### NODE 3: Customer pays

**UI moment:** Operator triggers checkout. Trigger timing is governed by the **cart-container slot** (S4): cart-close for retail, guest-bill-request for restaurant, session-complete for services, checkout for hospitality. Regardless of trigger, the tender modal opens and the spine path through Node 3 is identical.

**Tender is N-to-1** (multiple payments per single sale):

```
[Pay modal opens]
     ▼
[Split check evaluation] ──────── S11 slot: multi-party split (by item / guest / equal / %) when plug-in entitled
     ▼
[Cashier/guest picks tender type] — cash | MoMo (MTN/Vodafone/AirtelTigo) | card | credit | gift card | store credit
     ▼
[Per-tender flow — repeat as needed until cart balance = 0]
```

**Cash tender:**
```
[Cashier enters tendered amount]
     ▼
[Change calculated] ──────────── if tendered < balance: partial payment, continue
     ▼                            if tendered > balance: change due displayed
[Drawer opens signal] ────────── hardware: cash drawer pulse (wired or BT)
     ▼                            if drawer offline: manual prompt + audit
[Tender row recorded]
```

**MoMo tender:**
```
[Cashier enters customer phone + amount]
     ▼
[STK push sent to customer phone] ← payment provider API call
     ▼                              if provider offline: pending state, retry queue
[Waiting state UI (30s)]            if customer declines: tender voided
     ▼
[Provider confirms] ───────────── tender row recorded with provider txn ID
     ▼                              if timeout: move to pending, alert cashier
[Provider reconciliation event] ── feeds Bank & MoMo Recon downstream
```

**Card tender:**
```
[Terminal integration] ─────── if tenant has card terminal (BT or integrated)
     ▼                           else: manual entry fallback
[NFC / chip / swipe capture]
     ▼
[Amount sent to terminal]
     ▼
[Customer taps/inserts/swipes]
     ▼
[Acquirer authorises] ──────── tender row recorded with auth code (only last 4 PAN stored, PCI-DSS)
     ▼                           if declined: tender voided, prompt alternate tender
```

**Credit tender (sale on account):**
```
[Cashier confirms "Charge to account"]
     ▼
[Credit limit re-verified] ──── if exceeded: block, prompt other method
     ▼
[Signature capture] ──────────── if required: touchscreen or camera-captured signature
     ▼
[AR journal line queued] ────── Dr AR (customer), Cr Sales (posted at Node 4)
     ▼
[Customer statement updated] ── ledger row on customer's account
```

**Gift card / store credit tender:**
```
[Card number scanned/entered / NFC tap]
     ▼
[Balance lookup] ───────────── from gift-card liability ledger
     ▼
[Draw-down recorded] ──────── Dr Gift Card Liability, Cr Sales
     ▼                          if insufficient: partial, prompt remainder method
[Updated balance stored]
```

**Tip / service charge** (via S12 + S13 slots when entitled):
```
[Tip prompt] ──────────────── S12 slot: suggested % buttons OR manual entry (when plug-in entitled)
     ▼
[Service charge auto-added] ── IF tenant policy: 10% added to bill pre-tax
     ▼
[Tip ledger row] ──────────── Cr Tip Liability (routes to tip-out later)
     ▼
[Service charge ledger row] ── Cr Service Charge Revenue (different account than Sales Revenue)
```

**When cart balance = 0:**
```
[All tender rows finalised]
     ▼
[Sale transitions: open → paid]
     ▼
[Audit: `sale.paid` with tender summary]
     ▼
[Move to Node 4]
```

---

#### NODE 4: Receipt issued

**UI moment:** Sale auto-transitions on full tender. Receipt options modal renders.

```
[Receipt number allocated] ───── sequential per-branch; gap-free
     ▼
[Journal auto-posted] ────────── every sale's journal:
     ▼                            Dr Cash / MoMo Clearing / Card Clearing / AR  (by tender)
     │                            Cr Sales Revenue                               (net)
     │                            Cr Service Charge Revenue                      (if applicable)
     │                            Cr Tip Liability                               (if applicable)
     │                            Cr VAT Output                                  (15%)
     │                            Cr NHIL Output                                 (2.5%)
     │                            Cr GETFund Output                              (2.5%)
     │                            Cr COVID Output                                (1%)
     │                            Cr Excise Output                               (if alcohol)
     │                            Dr COGS                                        (at weighted-avg landed cost)
     │                            Cr Inventory Asset                             (at weighted-avg landed cost)
     │                            if any account missing → transaction rolls back, cart returns to Node 3
     ▼
[Fulfilment-branch resolution] ─ S15.0 slot: which branch's stock decrements? (normaled = sale branch; de-normaled plug-in: nearest-warehouse / cross-branch)
     ▼
[Batch / FIFO picker] ────────── S15.5 slot: which batch is consumed? (normaled = FIFO by entry date; de-normaled plug-ins: FEFO by expiry for pharmacy, regulation-enforced for controlled substances)
     ▼
[Inventory decremented] ──────── S15 slot: per-branch stock decrement with concurrent-sale guard (optimistic lock). Normaled default: finished-good SKU −1. Plug-ins: recipe explosion (restaurant Menu), slot-time marked used (services), room marked occupied (hospitality). Last-unit contention → retry or graceful-fail with reservation.
     ▼
[Loyalty points accrued] ─────── S17 slot: normaled = points per cart total; plug-ins re-patch accrual mechanics (stamps, stay credits, service credits)
     ▼
[Commission / incentive evaluated] S17.5 slot: normaled = Payroll commission rule lookup; de-normaled plug-ins evaluate conditional triggers (top-seller bonus, margin-based, repeat-customer, etc.)
     ▼
[Receipt rendered] ────────────── S16 slot: template from /ops/settings (branding, tax ID, footer). Normaled default is the retail template (lines, tax breakdown). Plug-ins re-patch with vertical-specific sections (table/server/courses/covers/tip for restaurant, duration/provider for services, folio for hospitality).
     ▼
[Delivery options presented]
     ├── Print (default if printer connected, wired or BT)
     │    → hardware: thermal printer spool; if paper out: fallback to email/WhatsApp prompt
     ├── Email
     │    → send via platform email; if bounces: log, alert
     ├── WhatsApp
     │    → send via Meta Cloud API (if tenant has WhatsApp entitlement)
     │    → if not entitled: option grayed with upsell hint
     ├── SMS
     │    → send via SMS provider
     └── QR-code digital receipt
          → customer scans QR at POS to pull receipt to their phone
     ▼
[Delivery confirmed or deferred]
     ▼
[GRA E-VAT transmission queued] ← compliance arc; receipt data forwarded to Ghana Revenue Authority
     ▼                               retries on failure; batched; surfaced in `/trade/tax`
[Audit: `sale.receipt_issued`]
```

**Return to UI:** "Sale complete" confirmation with delivery + next-action buttons. Next-action buttons are governed by the S4 cart-container plug-in ("Next Sale" for retail, "Clear Table / Keep Tab Open" for restaurant, "Book Next" for services, "Next Guest" for hospitality).

---

#### NODE 5: Customer leaves

**UI moment:** Operator action closes the cart surface (via S4 cart-container plug-in's close-gesture). Post-sale ripples fire asynchronously.

```
[Shift totals updated] ────────── open shift's sales counter, tender breakdown, COGS ticker
     ▼
[Post-sale ripple] ─────────────── S18 slot: vertical-specific post-sale side-effects fire here (table-turn for restaurant, provider-utilization for services, occupancy-update for hospitality)
     ▼
[Dashboard event fired] ───────── revenue tile updates live (via Pusher); hourly chart advances
     ▼
[Low-stock check] ─────────────── if any item crossed reorder point → alert to procurement dashboard. Plug-in ripples: 86-list add for restaurant, schedule-pressure for services, overbook-warning for hospitality (all via S18)
     ▼
[Analytics event emitted] ─────── product mix, top sellers, hour-of-day, operator performance. Vertical plug-in metrics stack at S18 observer tap
[Reports row appended] ────────── today's sales list report, hour report, till report, cashier report
     ▼
[Billing meter increment] ─────── if tenant is on metered plan, platform fee accrual ticks up
     ▼
[Audit: `sale.completed`]
     ▼
[Cart object archived] ────────── moves to Orders module archive; searchable
```

**Return to UI:** Fresh operator surface ready for the next transaction — shape determined by S4 cart-container plug-in (empty cart for retail, floor plan for restaurant, schedule for services, folio dashboard for hospitality).

---

### §21.4 Intersection Slots — where modules plug into the Sale Journey

> An intersection slot is a **defined open door** in the Sale Journey where a module plugs in pluggable behavior. If the plug-in module is entitled for a tenant, its behavior activates at that slot. If not, the default behavior runs. The spine stays the same; behavior at each slot reflects the tenant's entitlements.

**One tenant can have multiple plug-ins at the same slot.** A petrol station with a convenience shop AND a small kitchen has Retail Inventory + Menu & Recipes both entitled. When ringing up, both doors are open: a bag of rice goes through retail-SKU path; a plate of jollof goes through recipe-explosion path. Both items sit in the same cart, pay together, print on one receipt.

**Activation rules:**
- Each slot consults the entitlement engine at runtime: "Is module X active for this tenant?"
- If YES: plug-in behavior runs at the slot (may compose with default, may replace)
- If NO: default behavior runs
- Multiple plug-ins can stack at the same slot (e.g., Restaurant Menu + Age Verification both fire at Item entry for an alcohol menu item)

#### Slot catalogue

| # | Slot | Flow location | Default behavior (retail) | Restaurant plug-in | Services plug-in (future) | Hospitality plug-in (future) |
|---|---|---|---|---|---|---|
| S0 | **Cart initiation** | Pre-Node-1 | Cashier clicks "New Sale" or barcode scan auto-opens | Server taps table on floor plan; QR-code self-service guest-initiated | Provider resumes appointment | Front-desk check-in |
| S1 | **Item entry** | Node 2 | Barcode / text search → product SKU → add line | Menu picker → modifier tree → add with options | Service catalog → duration picker | Room rate → nights → guest count |
| S2 | **Quick-add via camera** | Node 2 | Snap photo → name + price → temporary SKU → add | Snap menu item photo → create menu card | Snap service photo → create service card | Snap room photo → create room type |
| S3 | **Quantity entry** | Node 2 | Numeric keypad | Scale integration for weighed items; cover count for courses | Hours from timer | Nights, guests, occupancy |
| S4 | **Cart container** | Nodes 1–4 | Cart on till session | Tab on table / seat / ticket / bar stool | Appointment tied to customer | Folio on room |
| S5 | **Cart persistence** | Nodes 1–4 | Ends at payment | Persists across split payments, across course fires, shared across servers | Persists across session (save-and-resume) | Persists for entire stay |
| S5.5 | **Loyalty price override** | Node 2 (before Promo match) | (no-op) | Member-exclusive pricing pre-empts promo | Member rate | Loyalty rate |
| S6 | **Fire-to-fulfilment** | Between 3 and 4 | (no-op; items handed over at till) | KDS ticket routed to stations (grill/cold/bar/dessert) with pacing | Provider scheduled / assigned | Housekeeping task created |
| S7 | **Availability check** | Node 2 | Stock-on-hand soft-check | 86-list (auto-lock menu items out of ingredient) | Provider schedule availability | Room occupancy map |
| S8 | **Customer attach** | Node 2 | Customers module lookup / inline creation | Table guest count + allergy tags attached; cover labels per seat | Client history + preferences | Guest profile + stay history |
| S9 | **Modifier pricing** | Node 2 | Flat product price | Modifier tree resolves price delta per option (free vs charged modifiers) | Add-on services priced incrementally | Room extras (breakfast, spa) |
| S10 | **Allergy / special flag** | Between 2 and 3 | (no-op) | Allergy tag appends to kitchen ticket in red; blocks cross-contaminated items | Medical history flag to provider | Guest VIP / accessibility flag |
| S11 | **Split check** | Node 3 | Single tender stream | Split by item, by guest, equal, by % | Split per session attendee | Split across room occupants |
| S12 | **Tipping / gratuity** | Node 3 | (no-op or optional line) | Structured tip + tip-out distribution (server/runner/kitchen) | Provider tip | Room service tip |
| S13 | **Service charge** | Node 3 | (no-op) | Auto 10% (Ghana restaurant common); separate GL account | Booking fee | Resort fee |
| S14 | **Tax rules** | Node 2–4 | Standard VAT / NHIL / GETFund / COVID | May include excise (alcohol), service-specific VAT | Service VAT | Tourism levy |
| S14.5 | **Cold-chain compliance gate** | Node 2 | (no-op) | (no-op unless temperature-sensitive dish) | (no-op) | (no-op) — pharmacy / vaccine plug-in blocks sale if device temp reading out of range |
| S15.0 | **Fulfilment-branch resolution** | Node 4 pre-decrement | Decrement from sale branch | Same | Same | Same — plug-ins: nearest-warehouse, cross-branch, warehouse-first |
| S15 | **Inventory decrement** | Node 4 | Finished-good SKU −1 per unit | Recipe explosion → N ingredient decrements (at weighted-avg cost each) | Provider time slot marked used | Room inventory marked occupied |
| S15.5 | **Batch / FIFO picker** | Node 4 pre-decrement | FIFO by lot entry date | FIFO by ingredient expiry; 86-list feedback | Consumables FIFO | Amenity FIFO — pharmacy plug-in: FEFO enforced by regulation |
| S16 | **Receipt template** | Node 4 | Retail template (lines, tax breakdown) | Restaurant template (table#, server, courses, covers, tip line) | Service template (duration, provider) | Hotel folio |
| S17 | **Loyalty accrual** | Node 4 | Points per cart total | Frequency stamps, prix-fixe points, chef's table credit | Service credit | Stay credits / nights |
| S17.5 | **Commission / incentive evaluation** | Node 4 post-accrual | Payroll rule lookup (flat % on sale) | Plug-in: tip-out split, margin bonus, top-seller, repeat-customer bonus | Provider commission | Front-desk upsell commission |
| S18 | **Post-sale ripple** | Node 5 | Standard (dashboard, reports, analytics) | Table turn flag, server performance, kitchen throughput, cover time | Provider utilization | Occupancy rate |
| S19 | **Age verification** | Node 2 | (no-op) | Alcohol/tobacco items trigger ID capture (camera) before add | (varies) | Alcohol service flag |
| S20 | **Hold / Park** | Any node | Cashier parks cart to help next customer; resume later | Tab naturally persists (no extra slot needed) | Appointment draft saved | Reservation held |
| S21 | **Device context** | Pre-Node-1 | Till + branch + cashier | Table + server + shift | Provider + room | Desk + clerk |

#### §21.4.A — Slot contracts (patchbay jack standard)

Per §19.A, every slot must declare its contract before any module can plug in. Phase 1 (boutique) slots have full contracts below. Phase 2 slots carry a deferred-contract marker — they are **closed to plug-ins** until their owning module enters its build window.

**Legend:** `N` = Normaled · `HN` = Half-normaled · `DN` = De-normaled · `→` = returns to spine

---

**S0 — Cart initiation** · `N` · Pre-Node-1

```
Input:    { operator_id, device_id, branch_id, shift_id }
Output:   { cart_id, opened_at, opener_ref }
Failure:  module-crashed → fallback to cashier-button default; module-timeout (300ms) → fallback; contract-violation → block + alert
Default:  Cashier clicks "New Sale" button
Observer: audit `cart.opened`; analytics `cart_initiated` with initiation_method tag
Entitle:  always-on; plug-ins re-patch per tenant entitlements (Restaurant Tables, QR-Order, Services Schedule, Hospitality Front-Desk)
Re-patch: yes, hot-swappable (entitlement change takes effect next cart)
```

**S1 — Item entry** · `N` · Node 2

```
Input:    { cart_id, branch_id, query: string?, barcode: string?, image: blob?, menu_selection?, modifier_tree? }
Output:   { sku_id, display_name, base_price, tax_class, modifiers_resolved[], quantity_default, fulfilment_hint }
Failure:  not-found → S2 quick-add fallback offered; module-timeout (500ms) → degrade-graceful to text search; price-missing → block + supervisor approval for manual price
Default:  Barcode + text search against local catalogue
Observer: audit `cart.item_added`; analytics `item_entered` with entry_method tag
Entitle:  retail default always-on; Menu & Recipes (DN for restaurant), Services Catalogue, Hospitality Rates stack at this slot
Re-patch: yes
```

**S3 — Quantity entry** · `N` · Node 2

```
Input:    { sku_id, unit_of_measure, min_qty, max_qty }
Output:   { quantity: decimal, unit, capture_source: [keypad | scale | camera | default] }
Failure:  scale-timeout → fallback to keypad; out-of-range → block with re-prompt
Default:  Numeric keypad, default qty = 1
Observer: audit `cart.quantity_set`; analytics `quantity_captured`
Entitle:  keypad always-on; scale integration via Bulk module; covers via Restaurant
Re-patch: yes
```

**S4 — Cart container** · `N` · Nodes 1–4

```
Input:    { tenant_config, vertical_entitlements, operator_context }
Output:   { container_shape: [cart | tab | appointment | folio], header_fields[], persistence_policy, close_gesture }
Failure:  module-crashed → hard fallback to simple cart-on-till; contract-violation → block cart open + alert
Default:  Cart bound to open shift on this till; auto-closes at payment
Observer: audit `container.opened`/`container.closed`; analytics `container_type` (for vertical mix reporting)
Entitle:  always-on with default; re-patched by Restaurant Tables (DN), Services Schedule, Hospitality Folio
Re-patch: no at runtime — container shape locked at open; next open resolves fresh
```

**S5 — Cart persistence** · `HN` · Nodes 1–4

```
Input:    { cart_id, event: [item_add | tender | fire | split | park] }
Output:   { persist_ok: bool, next_state }
Failure:  persist-failed → local queue with retry; conflict-on-sync → surface in /trade/sync
Default:  Cart state ends at payment (retail) unless Cart-persistence plug-in entitled
Observer: audit every state transition; analytics cart-age distribution
Entitle:  default is retail-ephemeral; plug-ins extend lifetime
Re-patch: no at runtime for open cart; next cart picks up new policy
```

**S5.5 — Loyalty price override** · `N` · Node 2 (before Promo match)

```
Input:    { cart_id, customer_id, sku_id, base_price, tax_class }
Output:   { override_price?: decimal, override_reason?: string, proceed_with: [override | base] }
Failure:  module-timeout (150ms) → proceed with base price; contract-violation → proceed with base + alert
Default:  no-op; base price passes through
Observer: audit `price.loyalty_override` when override applied; analytics `loyalty_pricing_hit`
Entitle:  Loyalty Pricing add-on (not bundled with basic loyalty)
Re-patch: yes
```

**S7 — Availability check** · `HN` · Node 2

```
Input:    { sku_id, quantity, branch_id, fulfilment_hint }
Output:   { status: [available | low | out | locked], reason?: string, suggest_substitute?: sku_id }
Failure:  module-timeout (200ms) → status=available with soft-warning flag; contract-violation → block add + alert
Default:  Stock-on-hand soft check (warn, do not block)
Observer: audit `availability.checked`; analytics low/out events feed procurement dashboard
Entitle:  default; re-patched by 86-list (restaurant), schedule map (services), occupancy map (hospitality)
Re-patch: yes
```

**S14 — Tax rules** · `N` · Nodes 2–4

```
Input:    { sku_id, line_amount, tenant_region, tax_profile }
Output:   { tax_lines[]: { code, rate, amount, account_ref }, gross_amount, net_amount }
Failure:  rate-missing → fallback to last-known + warning banner; module-crashed → block + alert (integrity)
Default:  VAT 15% + NHIL 2.5% + GETFund 2.5% + COVID 1% stacked per GRA rules
Observer: audit every tax line; analytics tax-collected per rate for compliance dashboard
Entitle:  always-on; stacking plug-ins (excise, tourism levy) append
Re-patch: no at runtime — tax profile resolved at cart open
```

**S14.5 — Cold-chain compliance gate** · `DN` for pharmacy/vaccine tenants · Node 2

```
Input:    { sku_id, temperature_spec, device_temp_reading, timestamp }
Output:   { pass: bool, reading_captured, block_reason?: string }
Failure:  sensor-unavailable → block add + escalate to supervisor; reading-out-of-range → hard-block
Default:  no-op (normaled-passthrough for non-cold-chain tenants)
Observer: audit every reading with sensor_id; analytics cold-chain compliance rate
Entitle:  Pharmacy / Vaccine Handling module
Re-patch: no — once entitled, mandatory for flagged SKUs
```

**S15.0 — Fulfilment-branch resolution** · `N` · Node 4 pre-decrement

```
Input:    { cart_id, sale_branch_id, line_items[], tenant_network_policy }
Output:   { decrement_targets[]: { branch_id, sku_id, quantity } }
Failure:  resolver-timeout (300ms) → fallback to sale-branch decrement; conflict (no stock anywhere) → block + ops alert
Default:  Decrement from sale branch 1:1
Observer: audit each decrement target; analytics cross-branch fulfilment rate
Entitle:  Multi-Branch Fulfilment add-on
Re-patch: yes
```

**S15 — Inventory decrement** · `N` · Node 4

```
Input:    { decrement_targets[], cart_id, sale_id }
Output:   { decrements_applied[]: { branch_id, sku_id, prior_qty, new_qty, cost_basis }, cogs_amount }
Failure:  optimistic-lock-conflict → retry 3x; last-unit-race → reservation-then-fail-graceful; module-crashed → block + alert (integrity)
Default:  Finished-good SKU −1 per unit at weighted-avg landed cost
Observer: audit each decrement; analytics stock velocity
Entitle:  always-on; re-patched by Recipe Explosion (restaurant), Slot-time (services), Room-occupancy (hospitality)
Re-patch: yes
```

**S15.5 — Batch / FIFO picker** · `N` · Node 4 pre-decrement

```
Input:    { branch_id, sku_id, quantity_needed, batch_strategy: [FIFO | FEFO | LIFO | manual] }
Output:   { batch_selection[]: { batch_id, qty, expiry, landed_cost } }
Failure:  insufficient-batch → cross-batch split; expired-batch-only → block + supervisor override; module-crashed → fallback to FIFO default
Default:  FIFO by lot entry date
Observer: audit batch selection per decrement; analytics expiry-risk inventory
Entitle:  Batch Tracking add-on; FEFO for Pharmacy (regulation-enforced, DN); LIFO for FX-cost tenants
Re-patch: yes — strategy change applies to next sale
```

**S16 — Receipt template** · `HN` · Node 4

```
Input:    { sale_id, tenant_branding, tax_summary, tender_summary, vertical_context }
Output:   { rendered_receipt: { format, body, delivery_channels[] } }
Failure:  template-render-failed → fallback to basic retail template; branding-asset-missing → degrade-graceful
Default:  Retail template: lines, tax breakdown, tender summary, footer
Observer: audit `receipt.rendered`; analytics template-version rendered
Entitle:  always-on; re-patched by Restaurant, Services, Hospitality templates
Re-patch: yes
```

**S17 — Loyalty accrual** · `N` · Node 4

```
Input:    { sale_id, customer_id, cart_total, cart_lines[] }
Output:   { points_earned?, stamps_earned?, credits_earned?, new_tier?, accrual_ref }
Failure:  loyalty-module-timeout (300ms) → queue retroactive accrual; module-crashed → silent skip with audit
Default:  no-op unless Loyalty module entitled; when entitled, points-per-cart-total
Observer: audit `loyalty.accrued`; analytics per-customer lifetime value
Entitle:  Loyalty module (Trade add-on); re-patched by vertical loyalty flavours
Re-patch: yes
```

**S17.5 — Commission / incentive evaluation** · `HN` · Node 4 post-accrual

```
Input:    { sale_id, cashier_id, cart_total, cart_margin, customer_id?, shift_context }
Output:   { commission_entries[]: { beneficiary_ref, amount, rule_ref, basis } }
Failure:  rule-eval-timeout (200ms) → queue for async evaluation; rule-conflict → first-match wins + log
Default:  Payroll flat-rule lookup (e.g., 1% of cart)
Observer: audit every commission accrual; analytics commission-to-sales ratio
Entitle:  Payroll module; Incentive Engine add-on stacks
Re-patch: yes
```

**S18 — Post-sale ripple** · `HN` · Node 5

```
Input:    { sale_id, cart_lines[], tender_summary, operator_id, vertical_context }
Output:   { ripples_fired[]: { channel, payload_ref, status } }
Failure:  ripple-channel-down → queue for retry; partial-failure → continue + log per channel
Default:  dashboard event, reports row, analytics event, billing meter increment
Observer: every ripple emits its own audit event
Entitle:  always-on; re-patched by vertical ripples (table-turn, provider-utilisation, occupancy-update)
Re-patch: yes
```

**S21 — Device context** · `N` · Pre-Node-1

```
Input:    { device_id, operator_login_state }
Output:   { context_pack: { till_id, branch_id, cashier_id, shift_id, vertical_surface_hint } }
Failure:  device-unenrolled → block entire flow + enrollment prompt; shift-closed → block + open-shift prompt
Default:  Till + branch + cashier context resolution
Observer: audit `device.context.resolved`; analytics device health per branch
Entitle:  always-on; re-patched by Restaurant (adds table context), Services (adds provider/room), Hospitality (adds desk/clerk)
Re-patch: no at runtime — context locked per flow instance
```

---

**Phase 2 slot contracts — deferred:**

The following slots are named and their normaled-default behavior is described in the §21.4 catalogue, but their **contracts are deferred to their owning module's Phase 2 build window**. Until contracts close, the spine treats each as normaled-passthrough with the catalogue's default behavior. No plug-ins may attach.

- **S2 Quick-add via camera** — closes with Camera Catalogue module
- **S6 Fire-to-fulfilment** — closes with Restaurant KDS / Services Scheduling / Housekeeping modules
- **S8 Customer attach** — closes with CRM module (Phase 1 uses reduced inline-create default)
- **S9 Modifier pricing** — closes with Restaurant Menu & Recipes
- **S10 Allergy / special flag** — closes with Restaurant Menu & Recipes
- **S11 Split check** — closes with Restaurant Tabs
- **S12 Tipping / gratuity** — closes with Restaurant Tabs
- **S13 Service charge** — closes with Restaurant Tabs
- **S19 Age verification** — closes with Age-Gate module
- **S20 Hold / Park** — closes with Cart Hold module

This deferral is explicit and allowed under §19 Patchflow principle (slots declared, contracts pending). It is tracked in §43 audit gate.

#### Adding a new vertical

When DalxicTrade expands to a new vertical (pharmacies, clinics, laundries, courier services, etc.), the pattern is fixed:
1. Identify which intersection slots the vertical needs to override
2. Build the vertical's module(s) as plug-ins at those slots (not a new app)
3. Register in `/ops/modules` with slot declarations
4. Define tier / add-on inclusion in `/ops/tiers` and `/ops/add-ons`
5. The Sale Journey spine never changes — new doors open.

---

### §21.5 Reverse spine — Returns, Refunds, Voids

Three distinct flows, same spine reversed:

**Void** (same-day, pre-EOD, before receipt issued or within grace window):
- Sale reversed in-place; journal zeroed; inventory restored; receipt voided
- Authorization: cashier can void within grace; supervisor required outside
- Applies to any open cart container across verticals (cart, tab, appointment, folio) per S4 plug-in

**Refund** (any time, against an existing receipt):
- New reverse transaction; credit note issued; journal contra-posted
- Stock returned to specified branch (not necessarily original)
- Tender refunded to original or alternate method (cash refund, MoMo reversal, etc.)
- Tip-line reversal policy governed by S12 slot (configurable per tenant; default: keep on partial, reverse on full)

**Partial return** (subset of lines from a receipt):
- Line-level refund; original receipt retains lineage; partial credit note
- Per-line restock, per-line tax reversal
- Per-line comp semantics delegated to R-series slot contracts in §22.4

**Exchange** (return + new sale in one flow):
- Refund portion + new sale portion; net to zero or delta paid/refunded

All four are downstream flows with their own blueprint section (pencil-stubbed).

---

### §21.6 Offline variant — mandatory

The entire Sale Journey must work without network connectivity.

```
[Network drops during shift]
     ▼
[App switches to OFFLINE mode banner]
     ▼
[Cashier continues selling]
     ├── Catalogue: last synced copy from local cache
     ├── Menu + modifiers: last synced
     ├── Prices: last known; no promo refresh
     ├── Customer lookup: local copy of customers synced at shift open
     ├── Tax rates: last known from last sync
     ├── Cart assembly: fully functional
     ├── Cash tender: fully functional
     ├── MoMo tender: DISABLED (requires network); cashier sees "MoMo unavailable"
     ├── Card tender: terminal may still work if terminal has its own line; else disabled
     ├── Receipt: prints from local data
     ├── Journal: queued locally, flagged `pending_sync`
     ├── Inventory: decrements locally (S15 resolves per plug-in: finished-good, recipe explosion, slot-time, room-occupancy)
     └── Fulfilment: S6 plug-in handles local side-channel (kitchen printer direct for restaurant, provider notification for services, housekeeping queue for hospitality); syncs later
     ▼
[Network returns]
     ▼
[Sync daemon activates]
     ├── Queued sales upload to server in order
     ├── Server re-validates each (prices, entitlements, inventory)
     ├── Journal entries post to GL
     ├── Inventory deltas applied (conflict detection if server shows different)
     ├── E-VAT transmissions fire for queued receipts
     └── Loyalty points credited retroactively
     ▼
[Conflicts surface in /trade/sync]
     ├── Price changed during offline → flagged, manager reviews
     ├── Inventory oversold (sold more than server knew) → flagged
     ├── Availability-state changed during offline → flagged per S7 plug-in (86-list for restaurant, schedule clash for services, double-book for hospitality)
     └── Duplicate tender (retry-ambiguous) → flagged
     ▼
[Audit: `offline_session.synced`]
```

Offline is not an afterthought — it's a **first-class variant** of the Sale Journey with its own UI states, failure modes, and conflict resolution flow.

---

### §21.7 Master ops laterals on the Sale Journey

Interrupts that can land on the Sale Journey from the `/ops/*` plane:

| Lateral | Fires from | Lands on | Effect |
|---|---|---|---|
| **Break-glass unlock** | `/ops/tenants/T/support` | Any login-blocked state | Temporary bypass of PIN; owner-on-record verify; time-boxed |
| **Device kill-switch** | `/ops/tenants/T/devices` | Device's next API call | 403; cart lost; "Device locked by Dalxic support" message |
| **Remote assistance (co-pilot)** | `/ops/support/ticket/T` | Active session | Staff sees tenant screen; points + chat; cannot click |
| **Remote assistance (takeover)** | Same + "take keyboard" | Active session | Staff clicks on tenant's behalf; dual audit; masked sensitive fields (PAN, PIN) |
| **Provider flip** | `/ops/settings/payments` | Next tender of that type | Flips MoMo/card provider platform-wide or per-tenant |
| **Force-refund** | `/ops/billing/invoice/X` | Creates reverse journal | Dispute resolution; audited with reason |
| **Announcement inject** | `/ops/releases/announcements` | Banner on next tenant page load | Incident notice / scheduled maintenance / release note |
| **Tier change** | `/ops/tenants/T/entitlements` | Session invalidation | Entitlements re-resolve; UI surfaces light up / dim down; slots open/close |
| **Hard suspend** | `/ops/tenants/T` | All sessions terminated | Non-payment, fraud, compliance; read-only or total lock |

Each lateral is itself a flow with its own UI moment, audit trail, and recovery path — to be mapped separately.

---

### §21.8 Failure modes — the broken-path inventory

Every one of these needs a defined UI state and recovery path. **None result in a crash or 404.**

| Failure | Node | Graceful path |
|---|---|---|
| Barcode not in catalogue | 2 | Manual search fallback → quick-add product inline (camera snap option) |
| Product restricted for cashier role | 2 | Block + explain + log |
| Age verification fails | 2 | Block item + log + alert |
| Promo/loyalty stacking conflict | 2 | Priority engine picks one; others greyed with reason |
| Inventory shows out of stock | 2 | Soft warning; hard-block only if policy set |
| 86-listed menu item attempted | 2 | Block + suggest alternative (restaurant) |
| Scale reads zero / disconnected | 2 | Manual quantity entry fallback + audit |
| Camera permission denied | 2 | Fall back to manual entry + prompt user to enable |
| Discount exceeds cashier's cap | 2 | Pause → supervisor PIN modal → approve/deny/audit |
| MoMo provider timeout | 3 | Pending state → retry → fallback to other tender |
| Card acquirer decline | 3 | Show decline reason → prompt alternate tender |
| BT card terminal offline | 3 | Fall back to manual card entry or alternate tender |
| Customer credit limit exceeded | 3 | Block credit tender; prompt other method |
| Gift card insufficient | 3 | Partial tender; prompt remainder method |
| Split check guest walks out | 3 | Supervisor approval to close remaining as write-off / bar tab |
| Journal post fails (COA missing) | 4 | Transaction rolls back; cart returns to Node 3; alert ops |
| Recipe explosion fails (ingredient record missing) | 4 | Kitchen printed but inventory untouched; flag for manager review |
| Inventory concurrent-sale last-unit | 4 | Optimistic lock; retry once; if lost, return to Node 2 with "last unit sold" |
| Receipt printer out of paper | 4 | Fallback to email/WhatsApp prompt; alert when paper replaced |
| Kitchen printer offline | 4 | Fall back to KDS screen or manual dispatch; alert + retry |
| Email/WhatsApp delivery fails | 4 | Queue retry; show status; print fallback |
| GRA E-VAT transmission fails | 4 | Queue for retry; tenant sees "Pending GRA" in `/trade/tax` |
| Network drops mid-sale | any | Switch to offline mode (3.6); cart preserved |
| Power failure mid-sale | any | Local state preserved (IndexedDB/disk); recovery on reboot |
| Shift closed by another cashier during sale | 3 | Block finalization; alert; supervisor re-opens or new shift |
| Cashier session timeout mid-sale | any | PIN re-prompt; cart preserved for N minutes |
| Device clock drift detected | any | Block writes until server-time sync corrects; audit |
| Multi-device same-user race | pre-1 | Policy-driven: block, swap-to-new, or mirror; audit |
| Device storage full (offline queue) | any | Alert + force sync + prevent new sales until cleared |
| Device unenrolled mid-shift | any | Freeze cart; enforce re-enrollment or manager override |

---

### §21.9 Downstream ripples — what bubbles up to /ops

Every completed sale emits events that climb the V-shape to master ops:

```
Sale completed
     │
     ├── /ops/analytics ───── tenant's revenue rolls into platform-wide KPI
     ├── /ops/billing ─────── metered plans: platform fee accrual; module usage meters
     ├── /ops/audit ────────── severity-filtered events bubble up (voids, manager overrides, E-VAT failures)
     ├── /ops/compliance ──── tenant's GRA E-VAT status; late filings flagged
     ├── /ops/support ──────── if sale triggers a dispute or error ticket
     ├── /ops/infra ────────── provider success/failure rates feed health dashboards
     └── /ops/infra/peripherals — BT printer / scanner / KDS uptime signals per tenant
```

These do NOT live inside a single sale's flow — they're async ripples that downstream consumers aggregate.

---

### §21.10 Ops linkage — 4 + N for the Sale Journey

**Mandatory 4 ops screens for every module in this flow:**

| Module | /ops/modules | /ops/tiers | /ops/add-ons | /ops/tenants/T/entitlements |
|---|---|---|---|---|
| Point of Sale | ✔ registered | ✔ T1+ | — | ✔ live state |
| Customers | ✔ | ✔ T1+ | — | ✔ |
| Loyalty & Promos | ✔ | T2+ | ✔ add-on for T1 | ✔ |
| Inventory | ✔ | ✔ T1+ | — | ✔ |
| Multi-Branch | ✔ | T2+ | ✔ add-on for T1 | ✔ |
| Tax Engine | ✔ | ✔ all tiers | — | ✔ |
| Chart of Accounts | ✔ | ✔ all tiers | — | ✔ |
| Journals & Ledger | ✔ | ✔ all tiers | — | ✔ |
| Receipts | ✔ | ✔ all tiers | — | ✔ |
| Orders | ✔ | ✔ all tiers | — | ✔ |
| Shifts & Till | ✔ | ✔ all tiers | — | ✔ |
| Audit Log | ✔ | T2+ | ✔ add-on | ✔ |
| Roles & Access | ✔ | T2+ | ✔ add-on | ✔ |
| **Menu & Recipes** (restaurant) | ✔ | restaurant T1+ | ✔ add-on | ✔ |
| **Tables & Floor** (restaurant) | ✔ | restaurant T1+ | ✔ add-on | ✔ |
| **Kitchen Display** (restaurant) | ✔ | restaurant T2+ | ✔ add-on | ✔ |
| **Modifiers & Options** (restaurant) | ✔ | restaurant T1+ | ✔ add-on | ✔ |
| **Course Pacing** (restaurant) | ✔ | restaurant T2+ | ✔ add-on | ✔ |
| **86 List** (restaurant) | ✔ | restaurant T1+ | — | ✔ |
| **Service & Tips** (restaurant) | ✔ | restaurant T1+ | ✔ add-on | ✔ |
| **Reservations** (restaurant) | ✔ | restaurant T2+ | ✔ add-on | ✔ |
| **Bar Tabs** (restaurant) | ✔ | restaurant T2+ | ✔ add-on | ✔ |

**Conditional N ops screens triggered by this flow:**

| Conditional screen | Triggered when |
|---|---|
| `/ops/settings` → tax rates | Platform tax rate change propagates to all tenants |
| `/ops/settings` → payment providers | Provider config affects MoMo/card tender paths |
| `/ops/settings` → receipt template | Platform receipt branding applies to all tenant receipts |
| `/ops/compliance` → GRA E-VAT | Every sale's E-VAT submission tracked here |
| `/ops/billing` → metered usage | Per-sale fee accrual for metered plans |
| `/ops/support` → tickets | Disputes, declines, hardware issues surface here |
| `/ops/support/device-fleet` | Device enrollment, kill, wipe governance |
| `/ops/audit` → platform log | Critical sale events (voids >X, force-refunds, override abuses) |
| `/ops/analytics` → cross-tenant | Revenue KPIs aggregate across all tenants |
| `/ops/analytics/fraud-signals` | Cross-tenant anomaly detection (void abuse, discount abuse) |
| `/ops/infra` → provider health | MoMo/card provider uptime tracked per tenant |
| `/ops/infra/peripherals` | BT printer, scanner, KDS uptime across tenant fleet |

---

### §21.11 Interlinks to other flows

The Sale Journey does not exist alone. It hands off to / receives from:

| Connected flow | Direction | Merge point |
|---|---|---|
| Restock Journey | ← feeds | Inventory must exist before sale (Node 2 lookup) |
| Day-Close Journey | → feeds | Shift totals aggregated at close |
| Return/Refund Journey | → spawns from | Original receipt is lineage for all later returns |
| Expense Journey | ↔ shares | Petty cash draws from till cash (liability transfer) |
| Tenant Lifecycle | ← dependency | Tenant must be active for sale to proceed |
| Auth Journey | ← dependency | Cashier/server session gates sale start |
| Billing Journey (master) | → feeds | Metered plans: every sale increments platform fee |
| Compliance Journey | → feeds | E-VAT transmission to GRA |
| Remote Assistance | ↔ can intersect | Any Sale Journey node can be observed/assisted |
| Reservation Journey (restaurant) | ← feeds | Reservation converts to seated tab → sale proceeds |

Every merge point needs a bidirectional audit in the audit phase: does the receiving flow expect what the emitting flow sends?

---

## §22. FLOW — The Return / Refund / Void Journey

> The reverse spine of the Sale Journey. Every sale is potentially a future reversal. This flow is how value, inventory, and compliance move **backwards** — without breaking the forward audit lineage.
> **Shape:** V-shape (authority cascades from `/ops` for escalated cases; most actions originate at the till/tab and ripple back to master ops as audit and billing signals).
> **Vertical-agnostic:** the same spine runs for retail refund, restaurant comp, hospitality folio adjustment. Vertical-specific behavior (tip reversal, recipe re-credit, room re-release) plugs in at the reverse intersection slots defined in Section §22.4.
> **Frequency:** typically 1–5% of sales volume; spikes with seasonal returns, bad batches, or fraud.

### §22.1 Skeleton

```
[Reversal triggered] → [Original sale located] → [Scope of reversal chosen] → [Approvals cleared] → [Reverse transaction posted] → [Customer refunded / item comped] → [Ripples fire]
```

Seven nodes. Unlike the Sale Journey's forward sequence, reversals branch early: **three distinct modes** share the spine but diverge at Node 3.

**Three reversal modes:**
- **Void** — pre-receipt, pre-EOD, same shift. In-place erasure. Original sale never happened for accounting purposes.
- **Refund** — post-receipt. New contra-transaction. Original sale preserved; credit note issued; net-of-returns reported.
- **Exchange** — refund one side, new sale the other side, net tendered.

A fourth variant — **Comp** — routes through slot **R13 Comp-vs-void branch** (§22.4): de-normaled, entitled per tenant, posting to Comp Expense GL instead of Sales Reversal. Reuses Node 3 scope logic and Node 5 posting; slot selects ledger destination.

### §22.2 Preconditions

| Precondition | Sourced from | Failure mode |
|---|---|---|
| Tenant active | `/ops/tenants/T` | Suspended tenants cannot process refunds except through `/ops` force-refund lateral |
| Returns module entitled | `/ops/tenants/T/entitlements` | Basic void allowed on every tier; refund module gated T1+; exchange gated T2+ |
| Operator authenticated | Auth session | Login gate |
| Operator role permission | Roles & Access | `sale.void` / `sale.refund` / `sale.exchange` scoped; absence triggers supervisor escalation |
| Shift open | Shifts & Till | Refund without open shift → "Open a shift to process refund" (cash refund path); card/MoMo refunds may bypass shift requirement per tenant policy |
| Original sale retrievable | Orders / Receipts | Refund/exchange cannot proceed without receipt lineage unless "no-receipt return" policy is enabled (manager-gated) |
| Original sale not already fully reversed | Returns ledger | Block double-refund; show prior reversal lineage |
| Refund window not expired | Tenant policy (e.g., 14 days) | Outside window → supervisor escalation or hard block |
| Refund tender provider available | Payment providers | MoMo refund requires provider API; card refund requires terminal/acquirer; fallback to cash or store credit |
| Branch can accept return | Multi-Branch policy | Cross-branch return: policy decides (allow / block / flag) |

---

### §22.3 Node-by-node with lego connectors

#### NODE 1: Reversal triggered

**UI moments (any of):**
- Cashier on `/trade/pos` clicks **"Returns"** tile → enters receipt # or scans receipt QR
- Cashier in active cart clicks **"Void Sale"** before payment (void-before-receipt path)
- Operator taps an open-tab UI surface (slot S14 Order-context initiator) → taps **"Void Item"** or **"Comp Item"** on a line (slot R13 entitled tenants)
- Manager on `/trade/orders` opens historical sale → clicks **"Refund"** / **"Exchange"**
- `/ops/support` agent fires **force-refund lateral** on tenant's behalf (lands here via audit trail, not direct UI)

| Sub-connector | Reads | Writes | Ripple |
|---|---|---|---|
| Reversal intent captured | operator context, branch, shift | `reversal_draft` row (status: drafting) | audit: `reversal.started` |

**Return to UI:** Reversal workspace — receipt lookup search, or line-level controls on the active tab, or a historical sale loaded in reversal mode.

---

#### NODE 2: Original sale located

**UI moments:**
- Receipt # / QR scan / barcode resolves to a sale
- Phone number lookup returns customer's recent sales list (no-receipt path)
- Active cart is its own lineage (void-before-receipt path — Node 2 is implicit)

```
[Sale lookup query]
     ▼
[Sale envelope loaded] ────────── items, tenders, journal refs, tax breakdown, modifiers, tip, service charge
     ▼                            vertical context appended via S4 plug-in reverse-hydration (tab/tabs+covers+courses+KDS history for restaurant, appointment for services, folio for hospitality)
[Lineage check] ─────────────── already fully reversed? partially reversed? which lines still eligible?
     ▼                            if fully reversed → block + show history
[Policy check] ──────────────── within refund window? original tender still refundable?
     ▼                            if past window → supervisor escalation or hard block
[Original customer surfaced] ── loyalty banner, AR balance, prior reversal history
     ▼                            fraud signals: if this customer has high reversal ratio → flag
[Audit: `reversal.sale_loaded`]
```

**Return to UI:** Original sale rendered in reversal mode — every line selectable, tender rows shown, running refund total starts at 0.

---

#### NODE 3: Scope of reversal chosen

**UI moment:** Operator picks the reversal mode + line selection. This is the **branch point** — the three modes diverge here.

```
[Mode selector]
     ├── Void (if pre-receipt / same-shift / grace window)
     │     → all lines auto-selected by default; partial void enabled per slot R3 selector entitlement (line-granular verticals)
     ├── Refund (post-receipt)
     │     → operator picks which lines (all / subset)
     │     → per-line quantity (full line or partial quantity)
     │     → reason tag (damaged, wrong item, customer changed mind, complaint, etc.)
     └── Exchange (post-receipt)
           → refund side: pick lines to return
           → new-sale side: opens Sale Journey NODE 2 in "exchange mode"
           → net balance calculated; either owed to customer or collected from customer
     ▼
[Line selection repeats until operator confirms]
     ▼
[Return-to-stock flag per line] — R7 slot: restock? scrap? damaged? Plug-ins extend with recipe re-credit (restaurant), slot-time re-release (services), room-release (hospitality)
     ▼
[Destination branch picked] ─── R8 slot: where does stock return to? (default: original branch; cross-branch policy plug-in may re-route)
     ▼                             may differ from original (cross-branch returns policy)
[Tax reversal calculated] ───── line-by-line; handles tax-inclusive vs tax-exclusive math
     ▼                             alcohol excise reverses if applicable
[Tender refund plan chosen] ─── refund to original tender (default) OR alternate:
     ▼                             cash → cash / store credit / gift card
     │                             MoMo → MoMo reversal / cash / store credit
     │                             card → card refund (acquirer) / cash if policy allows
     │                             credit (AR) → AR contra (reduce customer balance)
     │                             gift card → reload original or new
[Tip handling decision] ────── R11 slot (via S12 reverse): reverse / keep / split; policy default = reverse proportional to refunded amount (plug-in entitled)
     ▼
[Service charge handling] ──── R12 slot (via S13 reverse): auto-reverse on full refund, else proportional (plug-in entitled)
     ▼
[Comp vs void branch] ──────── R13 slot: if operator chose "Comp" (plug-in entitled):
     ▼                             destination = Comp Expense (different GL from Sales Reversal)
     │                             reason tag required (manager visit, staff meal, goodwill, quality issue)
[Summary preview rendered]
```

**Return to UI:** Preview panel — lines, quantities, restock flags, tender refund breakdown, tax reversal, fees handling, total refund amount, approvals needed (if any).

---

#### NODE 4: Approvals cleared

**Every reversal has an approval gate.** Threshold is policy-driven.

```
[Authority check against operator's role]
     ├── Within operator's cap → auto-approved, proceed
     ├── Beyond cap → supervisor PIN modal
     │    ↓
     │    supervisor enters PIN on same device (or approves from their mobile)
     │    ↓
     │    approved: proceed
     │    denied: reversal cancelled, cart returns to Node 3
     ├── Beyond supervisor cap → manager escalation (in-app notification or WhatsApp)
     │    ↓
     │    async approval; reversal stays in `pending_approval` until decided
     └── Beyond manager cap → `/ops/support` force-refund lateral required
          ↓
          tenant submits request; ops staff reviews; if approved, fires lateral from master ops
          ↓
          audit dual-logged (tenant request + ops action)
     ▼
[Reason tag required] — enum + free text; mandatory for all refunds/voids above trivial threshold
     ▼
[Fraud signal evaluation]
     ├── Same operator high reversal frequency → flag to manager dashboard
     ├── Same customer high reversal frequency → flag; may require ID capture
     ├── High-value reversal outside policy hours → flag to `/ops/analytics/fraud-signals`
     └── Void after cash drop → hard-flag; supervisor must acknowledge
     ▼
[Audit: `reversal.approved` with approver chain]
```

**Return to UI:** Approval state banner; either proceed button unlocks, or blocker with explanation.

---

#### NODE 5: Reverse transaction posted

**UI moment:** Operator clicks **"Confirm Refund"** (or "Confirm Void" / "Confirm Comp" / "Confirm Exchange"). Irreversible after this.

```
[Reverse transaction envelope created]
     ▼
[Journal contra-posted] ─────── the original sale's journal is mirrored with opposite signs:
     ▼                            Dr Sales Reversal (contra-revenue)           (net of returned lines)
     │                            Dr VAT Output                                 (reversed)
     │                            Dr NHIL / GETFund / COVID Output             (reversed)
     │                            Dr Excise Output                              (if applicable, reversed)
     │                            Cr Cash / MoMo Clearing / Card Clearing / AR (by refund tender)
     │                            Cr Tip Liability                              (if reversing tip)
     │                            Dr Service Charge Revenue                     (if reversing service charge)
     │                            Cr COGS                                       (at original weighted-avg landed cost of returned lines)
     │                            Dr Inventory Asset                            (if restocked)
     │                            OR Dr Inventory Write-off                     (if scrapped/damaged)
     │                            slot R13 Comp variant (entitled tenants):
     │                              Dr Comp Expense (P&L) instead of Sales Reversal
     │                            if any account missing → rollback, operator returned to Node 3
     ▼
[Receipt lineage linked] ────── reverse transaction stores `original_sale_id` + `original_receipt_#`
     ▼                            original sale updated: `reversal_history[]` appended
[Credit note # allocated] ───── gap-free per-branch sequence (separate from sale receipt sequence)
     ▼                            void variant skips credit note (no new receipt issued)
     │                            exchange variant: credit note PLUS new sale receipt #
[Inventory adjusted] ── slot R14 Inventory-reversal handler (per-vertical contract)
     ├── Finished-good restock variant: finished-good +N at destination branch (weighted-avg cost blended)
     ├── Scrap variant: write-off account debited; no inventory change
     ├── Recipe re-credit variant: ingredient +N per recipe (entitled tenants; policy-gated, often disabled for kitchen-prepared)
     ├── Ingredient scrap variant: ingredient write-off; wastage module ripple
     └── Gift card / store credit variant: new liability row in GC ledger
     ▼
[Tender refund executed]
     ├── Cash refund: drawer opens (hardware pulse); if drawer offline → manual prompt + audit
     ├── MoMo reversal: provider API call (different endpoint from STK push)
     │    → if provider offline → pending state, queued retry
     │    → may take minutes to hours depending on provider
     ├── Card refund: terminal → acquirer; auth code stored; PCI constraints as Sale Journey
     │    → partial card refunds allowed if acquirer supports
     ├── AR contra: reduce customer balance in Customers module; statement updated
     └── Store credit / gift card: issue new card OR reload existing; print/email card #
     ▼
[Loyalty points reversed] ──── if customer attached and points were accrued on original sale
     ▼                            proportional to refunded amount; handle already-spent-points scenario:
     │                              - if points spent: log as "points reversal owed" (tenant absorbs loss OR chases customer)
     │                              - policy-driven
[Commission reversed] ──────── if cashier/server earned commission on original, unwind on commission ledger
     ▼                            payroll run will net-of-reversals
[Sale state transitioned]
     ├── Void: original sale → `voided` (journal nulled, not deleted)
     ├── Partial refund: original sale → `partially_refunded`; reversal linked
     ├── Full refund: original sale → `fully_refunded`
     ├── Exchange: original → appropriate refund state; new sale → `paid` as a fresh sale
     └── Comp: specific line → `comped`; sale aggregate recalculated
     ▼
[Audit: `reversal.posted` with full journal + approver chain + reason tag]
```

**Return to UI:** Confirmation screen with credit note # (or void acknowledgement), refund method, amount, and delivery options.

---

#### NODE 6: Customer refunded / item comped

**UI moment:** Refund artifact is delivered to customer. Same delivery rails as Sale Journey Node 4.

```
[Credit note rendered] ──────── template from /ops/settings; mirrors original receipt styling
     ▼                            shows: lines returned, reversal reason (optional), refund method, balance if partial
[Delivery options presented]
     ├── Print (default if printer available)
     ├── Email
     ├── WhatsApp (if entitled)
     ├── SMS
     └── QR-code digital credit note
     ▼
[Cash refund physical handover] — cashier counts out refund; customer confirms; drawer closes
     ▼                            void path: no handover (no payment had taken place)
[GRA E-VAT reversal transmission queued] ← compliance arc; reversal data forwarded to Ghana Revenue Authority
     ▼                                       retries on failure; batched; surfaced in `/trade/tax`
[Audit: `reversal.delivered`]
```

**Slot R13 Comp path diverges** (entitled tenants):
- No credit note issued (the item never generated a receipt in the guest's name)
- Kitchen-display slot (S7 Fulfilment router) notified if item was already fired; may require "send back" ticket
- Manager sign-off audited
- Comp Expense posted to P&L; appears on manager's daily comp report

**Return to UI:** "Reversal complete" confirmation → "Process Another Return" / "Next Sale" / "Close Tab" (slot S14 open-tab context).

---

#### NODE 7: Ripples fire

Post-reversal async effects. Some mirror Sale Journey Node 5 (inverted); others are reversal-specific.

```
[Shift totals updated] ──────── sales counter reduced; refunds counter incremented
     ▼                            tender breakdown adjusted
[Container turn handling] ──── C10 slot: if post-close comp/amend triggered, container plug-in governs re-pay path (tab stays open for restaurant; appointment re-opens for services; folio re-opens for hospitality)
     ▼
[Dashboard event fired] ──────── revenue tile re-renders net-of-returns; refund rate KPI ticks
     ▼
[Reorder-point re-check] ─────── if restock returned items above reorder point, clear low-stock alert
     ▼                            if scrap, low-stock alert may intensify
[Analytics event emitted]
     ├── Return rate by product → surfaces product quality issues
     ├── Return rate by cashier → fraud / training signal
     ├── Return rate by customer → abuse signal
     └── Reason tag aggregation → surfaces root causes (damaged batches, mispricing)
     ▼
[Reports row appended] ──────── refunds report, voids report, comps report (slot R13 entitled tenants)
     ▼
[Billing meter adjustment] ──── metered plans: does reversal decrement platform fee? (policy: usually NO — platform still did the work)
     ▼                            force-refund via /ops may decrement differently
[Fraud detection ripple] ─────── cross-tenant anomaly signals to `/ops/analytics/fraud-signals`
     ▼
[Support ticket auto-open] ──── if reversal reason = "system error" or "price mismatch" → ticket created automatically
     ▼
[Audit: `reversal.completed`]
```

**Return to UI:** Operator back at home state — POS ready for next sale, or floor plan showing cleared table.

---

### §22.4 Reverse intersection slots — where modules plug into the Reversal Journey

Parallel to Sale Journey's Section §21.4. The entitlement engine resolves behavior at each slot based on tenant's active modules.

| # | Slot | Flow location | Default (retail) | Restaurant plug-in | Services plug-in (future) | Hospitality plug-in (future) |
|---|---|---|---|---|---|---|
| R1 | **Reversal entry** | Node 1 | Receipt lookup or active cart void | Tab line void or comp; KDS send-back | Appointment cancel / no-show flow | Folio adjustment / stay cut-short |
| R2 | **Sale lookup scope** | Node 2 | Sale envelope | Tab (may span split tenders, courses, multiple servers) | Session (provider + client + service) | Folio (nights + extras) |
| R3 | **Line eligibility** | Node 3 | All lines eligible within window | Fired vs not-fired distinction (fired food may not restock) | Rendered vs unrendered service | Nights stayed vs nights remaining |
| R4 | **Restock destination** | Node 3 | Branch-level restock or scrap | Ingredient re-credit rarely; wastage common | Time slot re-opened | Room re-released to availability map |
| R5 | **Tip reversal** | Node 3 | (no-op) | Proportional reverse; tenant-configurable; already-disbursed tips handled via tip-out ledger | Provider tip reversal | Room service tip reversal |
| R6 | **Service charge reversal** | Node 3 | (no-op) | Auto-reverse if full refund; proportional if partial | Booking fee keep vs reverse | Resort fee reversal |
| R7 | **Comp path** | Node 3–5 | (no-op; comps are restaurant-specific) | Routes to Comp Expense not Sales Reversal; no credit note | Service gift / goodwill credit | Room upgrade / night forgiveness |
| R8 | **Modifier reversal** | Node 5 | (no-op) | Modifier price deltas unwound line-by-line | Add-on service unwind | Extras line unwind (breakfast, spa) |
| R9 | **Recipe re-credit** | Node 5 | (no-op) | Per-policy; often NO re-credit for prepared food | Consumables re-credit per session | Minibar restock |
| R10 | **Loyalty reversal** | Node 5 | Points reversed; spent-points handled per policy | Frequency stamps decremented; chef's table credit reversed | Service credits reversed | Stay-night credits reversed |
| R11 | **Commission reversal** | Node 5 | Ledger contra entry | Server commission + shared tip-out both adjusted | Provider commission reversed | Concierge commission reversed |
| R12 | **Credit note template** | Node 6 | Retail credit note | Restaurant template (table#, server, reason) | Service credit template | Folio adjustment document |
| R13 | **Kitchen send-back** | Node 5–6 | (no-op) | KDS notified if food was fired; station-routed | Provider notified of cancellation | Housekeeping re-assigned |
| R14 | **Fraud signals** | Node 4, 7 | Per-cashier / per-customer rates | Per-server comp rate; per-table void rate | Per-provider cancellation rate | Per-clerk refund rate |
| R15 | **No-receipt return** | Node 2 | Manager-gated lookup by customer, card, or date+amount | Same + by table session | Customer session search | Guest folio search |

#### §22.4.A — Slot contracts

All R-series slots inherit their contract shape from their paired Sale-Journey slot (R1↔S0, R2↔S1, …) under the §19.A patchbay template, with the Output callback inverted (return payload = reversal record instead of forward record) and Failure semantics hardened (reversal failures never silently drop — always audit-log + ops alert). Phase 1 boutique slots that must carry full contracts: **R1 Reversal entry**, **R3 Policy gate**, **R7 Return-to-stock flag**, **R8 Destination branch**, **R9 Tax reversal**, **R10 Tender refund plan**, **R14 Fraud signals**, **R15 No-receipt return**. Remaining R-slots (R2 line-scope, R4 approvals, R5 journal post, R6 receipt re-render, R11 tip-reverse, R12 service-charge reverse, R13 comp-vs-void) are slot-catalogue-complete with contracts deferred to their owning module's Phase 2 build window; until then the spine treats each as normaled-passthrough with catalogue defaults.

---

### §22.5 Offline variant

Reversals must also work offline, with tighter constraints than Sale Journey.

```
[Network drops while processing reversal]
     ▼
[Offline reversal mode]
     ├── Lookup: only sales in local cache are retrievable (today's shift + recent sales depending on cache window)
     ├── Void of same-shift sale: fully functional
     ├── Refund of cached sale: functional; queues for server revalidation
     ├── Refund of non-cached sale: BLOCKED; "reconnect to process refund" banner
     ├── MoMo reversal: DISABLED (requires provider API); offer store credit / cash alternative
     ├── Card refund: terminal-dependent; may work if terminal has independent line
     ├── Cash refund: fully functional
     ├── Credit note: prints from local data; credit note # from local sequence allocator
     ├── Inventory restock: local decrement inversion; queued for sync
     ├── Fulfilment send-back (slot S7 reverse, entitled tenants): printed to local fulfilment printer directly
     ▼
[Network returns]
     ▼
[Reversal sync daemon]
     ├── Queued reversals uploaded in order
     ├── Server re-validates each (original sale existence, window, authority, no double-refund)
     ├── Journal entries post to GL
     ├── E-VAT reversal transmissions fire
     ├── Loyalty points net-adjusted
     ├── Commission ledger net-adjusted
     ├── Conflicts surface in /trade/sync
     │    - Refund attempted on already-reversed sale → flag; manager reconciles
     │    - Provider reversal couldn't be completed offline → manual follow-up queued
     │    - Credit note # collision (unlikely but possible with multi-device offline) → renumber + audit
     ▼
[Audit: `offline_reversal_session.synced`]
```

---

### §22.6 Master ops laterals on the Reversal Journey

Interrupts from `/ops/*` that can land on or originate this flow:

| Lateral | Fires from | Lands on | Effect |
|---|---|---|---|
| **Force-refund** | `/ops/billing/invoice/X` or `/ops/support/ticket/T` | Creates reverse journal directly | Dispute resolution; bypasses tenant approval gates; dual audit |
| **Reversal freeze** | `/ops/tenants/T` | Blocks Node 4 approval | Used during fraud investigation; tenant sees "Refunds temporarily paused — contact support" |
| **Cap override** | `/ops/tenants/T/settings` | Node 4 authority check | Raises/lowers refund thresholds mid-flight (rare; usually policy, not emergency) |
| **Refund window extension** | `/ops/support/ticket/T` | Node 2 policy check | Bypasses expired window for a specific sale by ID |
| **E-VAT retransmit** | `/ops/compliance` | Reversal already posted | Forces re-send of GRA reversal record |
| **Remote assistance (takeover)** | `/ops/support/ticket/T` | Active reversal session | Staff clicks on tenant's behalf; masked sensitive fields; dual audit |

---

### §22.7 Failure modes — the broken-path inventory

Every failure must have a defined UI state and recovery path.

| Failure | Node | Graceful path |
|---|---|---|
| Receipt # not found | 2 | Prompt alternate lookup (phone, card, date+amount); no-receipt policy check |
| Sale already fully reversed | 2 | Block + show prior reversal lineage + lineage link |
| Sale outside refund window | 2 | Supervisor escalation or hard block per policy |
| Original tender no longer refundable (expired card) | 3 | Prompt alternate refund method (cash / store credit) |
| Original tender provider offline (MoMo) | 5 | Queue provider call; issue provisional credit note; offer store credit alternative |
| Cash drawer empty / insufficient | 5 | Prompt alternate refund method; manager may authorize float top-up first |
| Card acquirer rejects refund | 5 | Show decline reason; prompt alternate method |
| Gift card issuance fails | 5 | Fallback to cash or retry; audit |
| Authority cap exceeded, supervisor absent | 4 | Park reversal in `pending_approval`; async supervisor approval via mobile; customer may wait or return |
| Approval denied | 4 | Reversal cancelled; audit denial with reason; customer routed to manager |
| Reason tag not provided (above trivial threshold) | 4 | Block confirm until entered |
| Fraud signal: cashier reversal rate >threshold | 4 | Force supervisor approval regardless of cap; alert manager dashboard |
| Journal post fails (missing contra accounts) | 5 | Rollback; return operator to Node 3; alert ops (`/ops/support` ticket auto-opens) |
| Recipe re-credit fails (ingredient record missing) | 5 | Refund completes; inventory flagged for manual reconciliation |
| Credit note # collision | 5 | Allocator retries; if persistent, flag to support |
| Loyalty spent-points reversal conflict | 5 | Log as "points reversal owed"; policy-driven follow-up |
| Printer out of paper | 6 | Fallback to email/WhatsApp; alert when paper replaced |
| E-VAT reversal transmission fails | 6 | Queue retry; tenant sees "Pending GRA" in `/trade/tax` |
| Network drops mid-reversal | any | Switch to offline mode (4.5); if non-cached sale, block gracefully |
| Power failure mid-reversal | any | Local state preserved; recovery on reboot; partial reversals flagged for manual review |
| Operator session timeout | any | PIN re-prompt; reversal draft preserved for N minutes |
| Device unenrolled mid-reversal | any | Freeze draft; require re-enrollment or manager override |
| Original sale journal itself malformed (legacy) | 5 | Halt; escalate to `/ops/support`; do not attempt to reverse a broken lineage |

---

### §22.8 Downstream ripples — what bubbles up to /ops

```
Reversal completed
     │
     ├── /ops/analytics ────── net-of-returns revenue aggregated platform-wide
     ├── /ops/analytics/fraud-signals — high-risk reversal patterns (same operator, same customer, high-value, after cash drop)
     ├── /ops/billing ──────── force-refunds adjust platform invoices; metered plans reconsider
     ├── /ops/audit ────────── every reversal with approver chain + reason tag bubbles up; high-severity flagged
     ├── /ops/compliance ──── GRA E-VAT reversal transmission status
     ├── /ops/support ──────── auto-created tickets for "system error" reason tags; dispute linkage
     └── /ops/infra ─────────── provider refund success/failure rates (separate metric from payment success)
```

---

### §22.9 Ops linkage — 4 + N for the Reversal Journey

**Mandatory 4:**

| Module | /ops/modules | /ops/tiers | /ops/add-ons | /ops/tenants/T/entitlements |
|---|---|---|---|---|
| Returns & Refunds | ✔ | T1+ for refund; void included all tiers | ✔ add-on for T1 (extended windows, no-receipt returns) | ✔ |
| Exchanges | ✔ | T2+ | ✔ add-on | ✔ |
| Comps (restaurant) | ✔ | restaurant T1+ | — | ✔ |
| Store Credit / Gift Cards | ✔ | T2+ | ✔ add-on | ✔ |
| Fraud Signals | ✔ | T3+ (tenant-side view) | ✔ add-on | ✔ |

**Conditional N:**

| Conditional screen | Triggered when |
|---|---|
| `/ops/settings` → refund policy defaults | Platform-wide windows, reason enums, authority cap defaults |
| `/ops/settings` → comp reason enum | Restaurant comp reasons governed centrally |
| `/ops/compliance` → GRA E-VAT reversals | Every reversal's E-VAT submission tracked |
| `/ops/billing` → force-refunds issued | Ops-initiated tenant credits |
| `/ops/support` → dispute tickets | Reversal-linked tickets surface |
| `/ops/audit` → severity-filtered reversal events | Voids after cash drop, high-value refunds, cap overrides |
| `/ops/analytics/fraud-signals` | Cross-tenant reversal anomaly aggregation |
| `/ops/infra` → provider refund health | MoMo/card refund endpoint uptime per provider |

---

### §22.10 Interlinks to other flows

| Connected flow | Direction | Merge point |
|---|---|---|
| Sale Journey | ← reverses | Every reversal requires an original sale (except pre-payment void, which lives inside Sale Journey Node 3) |
| Day-Close Journey | ↔ interacts | Reversals after cash drop flagged; variance investigation surfaces unbalanced tenders |
| Restock Journey | → feeds | Restocked returns increase inventory; scrap returns hit write-off |
| Expense Journey | → shares | Comp Expense (restaurant) posts through similar category path; wastage also expense-like |
| Tenant Lifecycle | ← dependency | Suspended tenants blocked except via force-refund lateral |
| Auth Journey | ← dependency | Operator session + role gate reversal authority |
| Billing Journey | → feeds | Force-refunds hit master invoices; metered-plan accrual recalculated |
| Compliance Journey | → feeds | GRA E-VAT reversal transmissions |
| Remote Assistance | ↔ intersects | Ops can co-pilot / take over any reversal node |
| Fraud Signals | → feeds | Every reversal contributes to fraud scoring model |

Every merge point bidirectionally audited during the audit phase.

---

## §23. FLOW — The Day-Close Journey

> Every shift / till / branch / tenant eventually closes. This is how the forward spine (Sale) and reverse spine (Reversal) resolve to a **locked, reconciled, banked, filed** day. Without a clean close, everything downstream — payroll, tax, billing, audit — runs on sand.
> **Shape:** V-shape (tenant executes; master ops laterals for variance escalation, force-close, compliance retransmit).
> **Vertical-agnostic:** same spine for retail cashier, restaurant server, hospitality desk clerk. Vertical-specific behavior (tip-out distribution, kitchen close, folio rollover) plugs at intersection slots defined in 5.4.
> **Frequency:** once per operator per shift; once per till per day; once per branch per day; once per tenant per fiscal period.
> **Nested structure:** shift closes roll up to till closes; till closes roll up to branch daily close; branch closes roll up to tenant fiscal close. Each level is a subflow with its own approvals and audit.

### §23.1 Skeleton

```
[Close intent] → [Activity freeze] → [Blind count] → [System reveal + variance] → [Variance investigation] → [Cash drop / banking] → [Z-report + filings] → [Day lock] → [Ripples]
```

Nine nodes. The blind-count-then-reveal order is deliberate: counting **after** seeing the system total defeats the variance check.

**Three close levels:**
- **Shift close** (operator-level) — individual cashier/server ends their shift; hands off till or clocks out
- **Till close / Z-report** (device/register-level) — end of trading day for a till; one Z-report per till per day
- **Branch daily close** (branch-level) — aggregates all tills; banking cutoff; branch-level reconciliation
- **Fiscal close** (tenant-level, monthly/annual) — out of scope for this flow; own journey

### §23.2 Preconditions

| Precondition | Sourced from | Failure mode |
|---|---|---|
| Tenant active | `/ops/tenants/T` | Suspended tenant: close still permitted for lock/archive; banking blocked |
| Shifts & Till module entitled | `/ops/tenants/T/entitlements` | Included every tier; unclosed shifts block next day's sales |
| Operator authenticated | Auth session | Close attempted by wrong operator → supervisor override required |
| Operator role permission | Roles & Access | `shift.close` (self) / `till.close` (Z-report) / `branch.close` (daily) scoped separately |
| Shift / till / branch in `open` state | State machine | Already-closed: show read-only close packet; re-open requires supervisor + audit |
| All sales finalized (no parked carts, no open tabs) | POS + Tabs module | Parked carts → prompt "N parked carts — resolve before close"; restaurant: open tabs block close, force manager resolution (comp / transfer / force-pay) |
| All KDS tickets bumped | Kitchen Display module | Unbumped tickets block restaurant close; force manager resolution |
| Pending MoMo / card tenders resolved | Payment providers | Pending tenders must reach terminal state (success/fail) before reveal; if stuck > N minutes, manager can force-mark + audit |
| Pending reversals resolved | Returns module | Pending-approval reversals block close; force manager clearance |
| Offline queue empty (or acknowledged) | Sync daemon | Offline sales pending sync: close allowed but flagged; variance recalculated post-sync |
| Till float known | Shift open record | Shift must have opened with declared float; absence blocks reveal math |

---

### §23.3 Node-by-node with lego connectors

#### NODE 1: Close intent

**UI moments (any of):**
- Cashier on `/trade/pos` clicks **"End Shift"** (shift close)
- Till operator clicks **"Close Till / Z-Report"** (till close)
- Branch manager on `/trade/reports/daily` clicks **"Close Day for Branch"** (branch close)
- `/ops/support` fires **force-close lateral** (stuck till, operator absent)
- Auto-close cron fires at tenant-configured time (e.g., 03:00 local) if operator forgot

| Sub-connector | Reads | Writes | Ripple |
|---|---|---|---|
| Close level determined | operator role, active scope | `close_draft` row (status: drafting, level: shift/till/branch) | audit: `close.started` |

**Return to UI:** Close wizard enters preflight screen — checklist of preconditions with live status indicators.

---

#### NODE 2: Activity freeze

**UI moment:** Preflight checklist resolves to all-green OR blocking items surface with one-tap resolution paths.

```
[Freeze trigger broadcast] ─── to all devices on this till / branch
     ▼                          new sales attempts show "Till closing — ask a manager"
[Active work inventory]
     ├── Parked carts → list with resume/abandon actions
     ├── Open order-context tabs (slot S14) → list; options: force-pay / transfer to another shift / comp with approval
     ├── Unbumped fulfilment tickets (slot S7 Fulfilment router) → list with station; force-bump requires manager + audit
     ├── Pending tenders → list with timeout clock; force-resolve path
     ├── Pending reversals → list; approver chain visible; block until cleared
     ├── Offline sales unsynced → "Sync before close" with retry; "Close anyway" requires supervisor + audit flag
     └── Open reservations (slot C14 Reservation carry-forward, day-level closes) → roll forward to next day or cancel
     ▼
[All-green or explicit overrides logged]
     ▼
[Shift/till/branch transitions: open → closing]
     ▼
[Audit: `close.frozen` with override list]
```

**Return to UI:** Freeze state banner on all POS screens on this till/branch. Close wizard advances to blind count.

---

#### NODE 3: Blind count

**UI moment:** Operator is presented with **empty fields only** — no system totals shown. This is the integrity check: counting what's physically there without knowing what the system thinks should be there.

```
[Blind count form rendered]
     ├── Cash — by denomination (GHS 200, 100, 50, 20, 10, 5, 2, 1, and coins)
     │    → operator enters counts; totals computed locally; no system comparison yet
     ├── MoMo — merchant app balance OR provider dashboard reading (manual entry or API pull)
     ├── Card — terminal batch total (manual read from terminal OR integrated pull)
     ├── Gift cards sold — count of new cards issued (for physical stock reconcile if applicable)
     ├── Vouchers redeemed — physical voucher count
     └── Manual receipts issued — count of manual receipt book entries (power/network failure fallback)
     ▼
[Shift-level tips envelope] ── C2 observer: tip-envelope accounting counted separately via S12 plug-in (tip-bearing verticals only)
     ▼                           tips NOT part of till cash reconciliation
[Float return] ─────────────── operator separates declared float from sales cash
     ▼                           float returned to safe OR rolled to next shift per policy
[Count submitted]
     ▼
[Count locked — no edits past this point without supervisor]
     ▼
[Audit: `close.counted` with entered figures]
```

**Return to UI:** "Count locked — reveal variance" confirm screen.

---

#### NODE 4: System reveal + variance

**UI moment:** Operator clicks **"Reveal"**. System totals render alongside entered counts with variance column.

```
[System totals computed]
     ├── Expected cash = opening float + cash sales − cash refunds − cash paid-outs − cash drops taken mid-shift + cash paid-ins
     ├── Expected MoMo = sum of successful MoMo tenders − MoMo reversals
     ├── Expected card = sum of successful card tenders − card reversals
     ├── Expected gift cards issued = sum of GC sales value; expected GC redemptions = sum of GC tender
     ├── Expected manual receipts = count from manual-receipt audit log
     └── Expected tips (slot S12 tipping, entitled tenants) = sum of tips captured on tenders
     ▼
[Variance calculated per bucket]
     ├── Over: counted > expected (operator possibly undercharged customer OR system error OR float top-up undeclared)
     ├── Short: counted < expected (operator error OR theft OR tendering mistake OR unlogged paid-out)
     └── Exact: counted == expected (goal state)
     ▼
[Variance thresholds applied]
     ├── Within "acceptable" threshold (tenant-configurable, e.g., ±GHS 5) → auto-pass, no investigation required
     ├── Within "review" threshold (e.g., ±GHS 20) → reason tag required; supervisor sign-off
     ├── Beyond "review" threshold → mandatory investigation (Node 5)
     └── Beyond "hard" threshold (e.g., >GHS 100 or >1% of sales) → escalation to branch manager + `/ops/analytics/fraud-signals` ripple
     ▼
[Audit: `close.revealed` with variance per bucket]
```

**Return to UI:** Variance panel — green/amber/red per bucket; Continue button gated by threshold.

---

#### NODE 5: Variance investigation

**UI moment:** For any bucket over review threshold, investigation workspace opens.

```
[Investigation workspace]
     ├── Transaction drill-down ─── all cash tenders this shift, sortable, flaggable
     ├── Recent reversals ──────── reversals after last cash drop flagged (common shortfall source)
     ├── Paid-outs / paid-ins ──── all cash-out/in events; missing receipts highlighted
     ├── Manager overrides ────── discounts/voids beyond cashier cap, with reason tags
     ├── Recent manual receipts ── manual-receipt book entries (possible untransacted sales)
     ├── Till swap history ───── if another operator took over mid-shift, variance attribution split
     └── Offline queue ────────── unsynced sales could explain apparent shortfall
     ▼
[Hypothesis log] ───────────── operator/supervisor selects one or more probable causes
     ▼                            structured tags: miscount, customer overcharge, tender-type misclick, etc.
[Resolution path]
     ├── Recount allowed (bounded: N attempts configured by tenant)
     │    ↓ recount succeeds → variance within threshold → proceed
     │    ↓ recount fails → proceed with documented variance
     ├── Paid-out discovery → log retroactive paid-out with supervisor approval + receipt photo
     ├── Manual receipt reconciliation → match to physical book; enter any untransacted sales
     └── Accept variance → reason tag + supervisor PIN + photo of count (optional tenant policy)
     ▼
[Over/short posted to ledger]
     ├── Short: Dr Cash Over/Short (P&L expense); Cr Cash
     ├── Over: Dr Cash; Cr Cash Over/Short (P&L income)
     └── Large variance: routes to branch manager dashboard + `/ops/analytics/fraud-signals`
     ▼
[Fraud signal evaluation]
     ├── Per-operator running variance streak → if consecutive shortfall pattern, escalate
     ├── Per-till variance trend → equipment or training issue vs individual behavior
     └── Variance immediately after a void cluster → correlated fraud flag
     ▼
[Audit: `close.variance_resolved` with hypothesis + resolution + approver chain]
```

**Return to UI:** Investigation closed; variance either resolved to zero or posted as over/short with approver chain attached.

---

#### NODE 6: Cash drop / banking

**UI moment:** Operator prompted to hand off cash; next destination depends on close level.

```
[Cash drop planning]
     ├── Shift close:
     │    → cash returned to safe OR handed to next shift operator (two-person count required)
     │    → float rolled to next shift OR returned to safe
     ├── Till close:
     │    → cash prepared for branch-level deposit bag OR handed to branch manager
     │    → till-level safe drop recorded
     └── Branch daily close:
          → total cash prepared for bank deposit
          → deposit bag sealed; bag # recorded
          → courier pickup OR staff bank run scheduled
     ▼
[Two-person count] ─────── optional per tenant policy; both operators present; dual signoff on count form
     ▼
[Deposit slip generation]
     ├── Bank deposit slip (PDF or printed)
     ├── Amount by denomination
     ├── Bag seal # captured (photo optional)
     └── Courier reference (if applicable)
     ▼
[Cash in transit ledger entry]
     ├── Dr Cash in Transit
     ├── Cr Cash on Hand (Till / Safe)
     ├── Reversed on bank confirmation (via Bank Recon module)
     ▼
[Paid-outs reconciled] ── petty cash paid-outs (receipts attached during shift) posted to expense accounts via Expense Journey interlink
     ▼
[MoMo / card settlement]
     ├── MoMo: provider settlement expected T+0 or T+1 per provider; logged as pending receivable
     ├── Card: acquirer settlement per schedule; logged as pending receivable
     ├── Both reconciled downstream in Bank & MoMo Recon when bank statement arrives
     ▼
[Audit: `close.banked` with bag #, courier, amounts]
```

**Return to UI:** Deposit summary screen with printable deposit slip.

---

#### NODE 7: Z-report + filings

**UI moment:** System generates the locked end-of-day report. Z-report is the authoritative end-of-day document.

```
[Z-report compiled] ─── per till OR per branch depending on close level
     ▼                   contents:
     │                     - Shift / till / branch identifier
     │                     - Opening float, closing float, float variance
     │                     - Gross sales, discounts, refunds, net sales
     │                     - Tax breakdown (VAT, NHIL, GETFund, COVID, excise)
     │                     - Tender breakdown (cash, MoMo, card, credit, gift card)
     │                     - Reversal summary (voids, refunds, comps)
     │                     - Manager overrides count + value
     │                     - Over/short summary
     │                     - Tip summary (slot S12, entitled tenants)
     │                     - Service charge summary (slot S13, entitled tenants)
     │                     - Commission accrual (by operator)
     │                     - Loyalty points accrued/redeemed
     │                     - Top products / top servers / hour-of-day breakdown
     │                     - Operator signatures (if enforced)
     ▼
[Z-report number allocated] ── gap-free per-branch sequence
     ▼
[Z-report archived] ────────── immutable; download anytime; re-print requires supervisor
     ▼
[Journal close entries posted]
     ├── Revenue recognition finalized (already posted per sale; Z confirms totals match)
     ├── Tip liability → payable to operators via slot C7 Tip-out distribution (entitled tenants)
     ├── Cash Over/Short → P&L
     ├── Deposit in transit → Cash in Transit
     └── COGS reconciliation summary appended
     ▼
[GRA E-VAT daily summary submitted]
     ├── Per-receipt transmissions should have fired during the day (Sale Journey Node 4)
     ├── Z-close sends daily summary to GRA + confirms transmission completeness
     ├── Missing transmissions flagged for retry; tenant notified
     ▼
[SSNIT / PAYE accrual tick] ── daily payroll accrual updated (rolls into monthly filings)
     ▼
[Tip-out distribution fires — C7 slot (de-normaled for tip-bearing verticals)]
     ├── Per tenant rules: server X%, runner Y%, kitchen Z%
     ├── Writes per-operator tip ledger rows
     ├── Routes to Payroll module for payout cycle
     ▼
[Commission ledger finalized] ─ per-operator commission earnings for today locked
     ▼
[Audit: `close.z_report_issued` with Z #]
```

**Return to UI:** Z-report rendered — print, email, WhatsApp, archive options.

---

#### NODE 8: Day lock

**UI moment:** Final confirmation.

```
[Lock intent confirmed] ── supervisor PIN; explicit "lock" button
     ▼
[Shift / till / branch state: closing → closed]
     ▼
[All journal entries for this period frozen]
     ├── No back-dated sales allowed (except via force-unlock lateral)
     ├── No back-dated reversals allowed without explicit unlock
     ├── Any future reversal of today's sales posts to TODAY, not back-dated
     ▼
[Day-lock integrity hash computed] ──── signature over Z-report + all linked journals
     ▼                                    stored as tamper-evidence; verifiable during audit
[Next-day prep auto-opens OR queued]
     ├── If next shift already scheduled → pre-open with declared float placeholder
     ├── If auto-open configured → till opens automatically at tenant-configured time
     └── If manual-open policy → till stays closed until next operator opens
     ▼
[Audit: `close.locked` with hash + approver]
```

**Return to UI:** "Day closed and locked" confirmation with Z-report download + next-shift prep option.

---

#### NODE 9: Ripples

Post-close async effects. Heavier than Sale Node 5 because day-lock triggers many downstream consumers.

```
[Dashboard events fired]
     ├── Branch dashboard: today locked; switch to yesterday-compare view
     ├── Tenant-wide dashboard: today's totals roll into period-to-date
     ├── Ops dashboard: tenant daily-close heartbeat (missed closes ping support)
     ▼
[Analytics batch]
     ├── Daily KPIs materialized (revenue, basket size, cover count, ATV, top products)
     ├── Weekly trailing aggregates updated
     ├── Month-to-date updated
     ├── Same-day-last-year comparison computed
     ▼
[Inventory reconciliation tick]
     ├── End-of-day on-hand per SKU / ingredient snapshot
     ├── Variance vs opening + transactions computed per item
     ├── Shrinkage alerts fire for items with unexplained decrement
     ▼
[Reports generated and distributed]
     ├── End-of-day email / WhatsApp to owner (per tenant preferences)
     ├── Manager's daily report to branch manager
     ├── Cashier performance cards to each operator
     ├── Fulfilment performance report (slot S7, entitled tenants): top-selling items, avg fire-to-bump time, waste
     ▼
[Billing meter finalized] ── metered plans: today's platform fee accrual locked
     ▼
[Compliance ticks]
     ├── GRA E-VAT daily completeness check
     ├── Audit trail batch push to compliance archive
     ▼
[Payroll ticks]
     ├── Daily tip-out distribution journal
     ├── Daily commission accrual locked
     ├── Hours worked per operator finalized
     ▼
[Restock triggers]
     ├── Any SKU / ingredient below reorder point → restock suggestion on procurement dashboard
     ├── Slot C11 86-list carry-forward (entitled tenants): items flagged "out of stock today" carried to next day with manager acknowledgement required to clear
     ▼
[Ops heartbeat]
     ├── Tenant's daily close heartbeat registered at `/ops/infra` (missed close → escalate)
     ├── Cross-tenant anomaly: unusual pattern (zero sales, spike, massive variance) → `/ops/analytics/fraud-signals`
     ▼
[Audit: `close.completed`]
```

**Return to UI:** Operator logged out OR returned to a read-only "yesterday closed" view with tomorrow's prep panel visible.

---

### §23.4 Intersection slots — where modules plug into the Day-Close Journey

| # | Slot | Flow location | Default (retail) | Restaurant plug-in | Services / Hospitality (future) |
|---|---|---|---|---|---|
| C1 | **Activity freeze scope** | Node 2 | Till / branch sales | Tab completion enforcement + KDS ticket bump | Active sessions / active folios |
| C2 | **Blind count subjects** | Node 3 | Cash + tenders | Cash + tenders + tip envelopes (separate) | Cash + tenders + provider time sheets |
| C3 | **Variance threshold rules** | Node 4 | Per-till cash | Per-server tips + per-till cash (separate variance buckets) | Per-provider session count |
| C4 | **Investigation depth** | Node 5 | Transaction drill, overrides, paid-outs | Adds: comp log, 86-list check, server hand-off history | Adds: session history per provider |
| C5 | **Cash drop policy** | Node 6 | Safe or deposit bag | Same + tip envelope separation from till cash | Same |
| C6 | **Z-report content** | Node 7 | Retail Z | Restaurant Z (covers, tables, servers, courses, avg check, turn time) | Service Z (sessions, provider util, cancel rate) |
| C7 | **Tip-out distribution** | Node 7 | (no-op) | Server/runner/kitchen per tenant rules; writes tip ledger | Provider tip distribution |
| C8 | **86-list carry-forward** | Node 9 | (no-op) | 86'd items carry to next day until manager clears | (no-op) |
| C9 | **Next-shift pre-open** | Node 8–9 | Declared-float placeholder | Declared-float + table-map reset + 86 review | Session schedule for tomorrow |
| C10 | **Kitchen close** | Node 2 | (no-op) | Kitchen staff bump-complete; station close; waste/spoilage entry | (no-op) |
| C11 | **Reservation rollover** | Node 9 | (no-op) | Tomorrow's reservations surfaced for manager review | Tomorrow's bookings |
| C12 | **Compliance filings** | Node 7 | GRA E-VAT daily summary + SSNIT/PAYE accrual | Same + alcohol excise daily | Tourism levy where applicable |
| C13 | **Commission finalization** | Node 7 | Per-cashier daily commission lock | Per-server + tip-out; server takeovers tracked | Per-provider |
| C14 | **Report recipients** | Node 9 | Owner + branch manager | Adds: executive chef for kitchen report | Provider manager |
| C15 | **Day-lock integrity hash** | Node 8 | Hash over Z + journals | Same + tip ledger | Same + session ledger |

#### §23.4.A — Slot contracts

C-series slots follow §19.A template. Phase 1 boutique slots with full contracts: **C1 Scope**, **C2 Blind-count subjects**, **C3 Variance thresholds** (`N` with hard-override gate), **C4 Cash-drop destination**, **C5 Journal consolidation**, **C6 Z-report template** (`HN`, observer emits GRA E-VAT daily summary), **C12 Compliance filings** (`HN`, same observer path), **C15 Day-lock integrity hash** (`N`, integrity rule — cannot be skipped, module failure = block). Remaining C-slots (C7 Tip-out `DN` for tip-bearing verticals, C8 Approval matrix, C9 Next-shift pre-open, C10 Kitchen close, C11 Reservation rollover, C13 Commission finalisation, C14 Report recipients) are slot-catalogue-complete with contracts deferred to Phase 2 per §19.A deferred-marker convention. **C7 contradiction resolved:** classified as **De-normaled for tip-bearing verticals** — retail tenants get normaled-no-op (tip-out slot inactive), restaurant tenants must have tip-out rules declared before close can complete (null = block). Old spec said "retail = no-op default"; new spec: C7 is entitled-or-dormant (not normaled).

---

### §23.5 Offline variant

Day-close must work offline, but with explicit constraints because cryptographic day-lock and compliance filings require network.

```
[Network down at close time]
     ▼
[Offline close mode]
     ├── Freeze: functional locally; all devices on branch respond
     ├── Blind count: fully functional
     ├── Variance reveal: computed from local data (may differ once offline queue syncs)
     │    → variance marked "provisional" pending sync
     ├── Investigation: limited to locally cached data
     ├── Cash drop / deposit slip: printable locally; deposit slip # from local sequence allocator
     ├── Z-report: generated locally with "PROVISIONAL" watermark
     ├── Day-lock: BLOCKED; system refuses permanent lock without network (hash requires server co-signature)
     │    → alternative: "soft close" state; till cannot re-open for new sales; locks properly on sync
     ├── E-VAT daily summary: queued
     ├── Tip-out distribution: computed and printed locally; writes to local ledger
     └── Next-shift pre-open: functional with provisional flag
     ▼
[Network returns]
     ▼
[Close sync daemon]
     ├── Offline sales queue drains first (retry priority over close sync)
     ├── Variance recalculated with synced data; if material change, manager notified + re-sign required
     ├── Z-report regenerated; "PROVISIONAL" watermark removed; Z # reallocated from server sequence
     ├── Day-lock hash computed and stored
     ├── E-VAT daily summary transmitted
     ├── Tip-out ledger reconciled to server
     ├── Conflicts surface in /trade/sync
     │    - Variance moved beyond threshold post-sync → manager re-approval required
     │    - Z # collision resolved in favor of server sequence
     ▼
[Audit: `offline_close_session.synced`]
```

**Critical:** the default is "soft close" when offline — the till cannot re-open for new sales (preventing double-day sales), but legal day-lock waits for network. This preserves integrity.

---

### §23.6 Master ops laterals on the Day-Close Journey

| Lateral | Fires from | Lands on | Effect |
|---|---|---|---|
| **Force-close** | `/ops/support/ticket/T` | Stuck till / absent operator | Ops triggers close on tenant's behalf; blind count bypassed; variance attributed to "ops force"; heavy audit |
| **Force-unlock** | `/ops/support/ticket/T` + dual approval | Already-locked day | Unlock for dispute resolution (e.g., missed sale back-dating); legal implications; extreme audit |
| **Variance escalation** | Auto on large variance | `/ops/analytics/fraud-signals` | Cross-tenant anomaly dashboard entry |
| **Missed close heartbeat** | `/ops/infra` cron | Tenant whose day didn't close | Ops gets alert; support reaches out; offers force-close if operator unreachable |
| **Compliance retransmit** | `/ops/compliance` | Already-closed day | Re-send E-VAT daily summary if GRA rejected or audit demands |
| **Remote assistance** | `/ops/support/ticket/T` | Active close workflow | Staff co-pilots operator through variance investigation; masked sensitive fields |

---

### §23.7 Failure modes

| Failure | Node | Graceful path |
|---|---|---|
| Parked carts / open tabs at close | 2 | Blocking list with one-tap resolution; force-resolve requires manager |
| Unbumped KDS tickets | 2 | Blocking list; force-bump requires manager + audit |
| Pending MoMo / card tender stuck | 2 | Timeout clock; force-mark fail/success requires manager + provider reconciliation note |
| Pending reversal unapproved | 2 | Blocking; approver chain surfaces; supervisor escalation |
| Offline queue not empty | 2 | "Sync before close" CTA; "Close anyway" marks close as provisional |
| Operator tries to count before freeze completes | 3 | Blocked with reason; checklist must be all-green |
| Count form submitted blank | 3 | Prevented; zero must be entered explicitly (distinguishes "none" from "forgot") |
| Variance beyond hard threshold | 4–5 | Mandatory investigation; branch manager notified; `/ops/analytics/fraud-signals` ripple |
| Recount attempts exhausted | 5 | Proceed with documented variance; over/short posted; supervisor reason tag required |
| Supervisor absent for variance sign-off | 5 | Park close in `pending_approval`; async approval possible; next shift blocked until cleared |
| Cash drop bag seal # skipped | 6 | Prevented if policy set; audit if policy allows skip |
| Z-report journal mismatch (impossible but defensive) | 7 | Halt lock; escalate to `/ops/support`; never lock on inconsistent data |
| E-VAT transmission fails at close | 7 | Close still locks; E-VAT queued for retry; `/trade/tax` surfaces pending |
| Day-lock hash fails (server unreachable) | 8 | Soft-close per 5.5; full lock pends network |
| Tip-out distribution rule missing (restaurant) | 7 | Block until tenant sets rules; sensible default offered |
| Manager override chain incomplete | 8 | Block lock; surface missing approval; reissue PIN prompt |
| Auto-close fired while operator mid-sale | 1 | Grace window honored; finish sale or cancel; audit |
| Network drops mid-close | any | Switch to offline variant (5.5); soft-close; pending network resume |
| Power failure mid-close | any | Local state preserved; recovery on reboot; resume from last saved node |
| Device unenrolled mid-close | any | Freeze close draft; require re-enrollment or manager override |
| Two-person count mismatch | 3, 6 | Recount required; escalate if persists; tenant policy may allow split-the-difference with audit |

---

### §23.8 Downstream ripples — what bubbles up to /ops

```
Day-close locked
     │
     ├── /ops/analytics ────── tenant's daily revenue locked into platform KPIs
     ├── /ops/analytics/fraud-signals — variance outliers, void-then-close patterns, cross-tenant anomalies
     ├── /ops/billing ──────── metered platform fee for today locked; invoice draft updated
     ├── /ops/audit ────────── severity-filtered close events (force-close, force-unlock, large variance, override chain abuses)
     ├── /ops/compliance ──── E-VAT daily summary status; missing transmissions flagged
     ├── /ops/support ──────── missed-close heartbeat triggers; dispute tickets from variance investigations
     ├── /ops/infra ────────── daily-close heartbeat per tenant per branch (missed → escalate)
     └── /ops/releases ────── close-time crashes or hash failures correlated to recent release
```

---

### §23.9 Ops linkage — 4 + N for the Day-Close Journey

**Mandatory 4:**

| Module | /ops/modules | /ops/tiers | /ops/add-ons | /ops/tenants/T/entitlements |
|---|---|---|---|---|
| Shifts & Till | ✔ | all tiers | — | ✔ |
| Z-Report & Day Lock | ✔ | all tiers | — | ✔ |
| Cash Management | ✔ | all tiers | — | ✔ |
| Variance Investigation | ✔ | T1+ | ✔ add-on for deeper drill | ✔ |
| Bank & MoMo Recon | ✔ | T2+ | ✔ add-on | ✔ |
| Tip-Out Distribution (restaurant) | ✔ | restaurant T1+ | ✔ add-on | ✔ |
| Fraud Signals (tenant view) | ✔ | T3+ | ✔ add-on | ✔ |

**Conditional N:**

| Conditional screen | Triggered when |
|---|---|
| `/ops/settings` → variance thresholds | Platform defaults; tenant may override within bounds |
| `/ops/settings` → cash drop policy | Two-person rule, seal bag enforcement, deposit cadence |
| `/ops/settings` → auto-close schedule | Tenant-configurable auto-close time per branch |
| `/ops/settings` → tip-out rules (restaurant) | Rule templates per restaurant sub-type (casual, fine dining, bar) |
| `/ops/compliance` → GRA daily summaries | Every tenant's daily summary transmission status |
| `/ops/compliance` → SSNIT/PAYE accruals | Daily payroll accrual ticks roll up to monthly filings |
| `/ops/billing` → metered usage daily lock | Per-tenant today's accrued fee locked |
| `/ops/support` → missed-close tickets | Auto-opened when close heartbeat missed past grace window |
| `/ops/audit` → close-event severity filter | Force-close, force-unlock, large variance, day-lock hash failures |
| `/ops/analytics/fraud-signals` | Variance patterns, void-then-close, cross-tenant anomalies |
| `/ops/infra` → daily-close heartbeat map | Per-tenant per-branch green/red status for today |
| `/ops/releases` → close-time incident correlation | If close-time errors spike, correlate to recent release; may trigger rollback |

---

### §23.10 Interlinks to other flows

| Connected flow | Direction | Merge point |
|---|---|---|
| Sale Journey | ← aggregates | Every paid sale this period rolls into Z totals |
| Reversal Journey | ← aggregates | Every reversal nets into refunds, comps, voids summaries |
| Restock Journey | ↔ shares | End-of-day on-hand snapshot feeds reorder suggestions |
| Expense Journey | ← reconciles | Petty cash paid-outs settle against till cash at close |
| Multi-Branch Transfer | ↔ shares | Transfers in/out of branch reconciled into branch daily close |
| Tenant Lifecycle | ← dependency | Suspended tenant can still close (lock + archive) |
| Auth Journey | ← dependency | Role permission gates shift / till / branch close authority |
| Billing Journey | → feeds | Daily metered accrual locks |
| Compliance Journey | → feeds | E-VAT daily summaries + SSNIT/PAYE accruals |
| Remote Assistance | ↔ intersects | Ops can co-pilot any close node |
| Release Rollout | ↔ correlates | Close-time errors surface release regressions |

Every merge point needs bidirectional audit during audit phase.

---

## §24. FLOW — The Restock Journey

> The supply-side spine. Where **inventory enters the business**, where **payables are born**, where **landed cost** is crystallized. Every item sold in the Sale Journey existed first because this flow brought it in. Without a clean Restock, inventory valuations are garbage and COGS is a guess.
> **Shape:** V-shape (tenant executes procurement; master ops laterals for supplier blocklists, fraud detection, bulk-import assistance).
> **Vertical-agnostic:** same spine for retail SKU, restaurant ingredient, services consumable, hospitality linen. Vertical-specific behavior (recipe ingredient receipt, perishable expiry, batch tracking) plugs at intersection slots defined in 6.4.
> **Frequency:** daily to weekly per tenant; volume scales with tenant size.
> **Three entry modes:** PO-driven (planned, approved, tracked), direct receipt (spot purchase, market run), and supplier-initiated (standing order auto-delivery).

### §24.1 Skeleton

```
[Need identified] → [PO drafted] → [PO approved] → [PO issued to supplier] → [Goods arrive + counted] → [GRN posted] → [Landed cost resolved] → [Inventory valued + payable raised] → [Supplier paid] → [Ripples]
```

Ten nodes. Nodes 1–4 are the **planning / commitment side**; Nodes 5–7 are the **physical receipt + valuation side**; Nodes 8–10 are the **financial settlement side**.

**Three entry variants:**
- **Full PO flow** (nodes 1–10) — large tenants, high-value items, contract suppliers
- **Direct receipt** (skip to node 5 with a "spot PO" auto-drafted) — market runs, urgent replenishment, small tenants
- **Standing order** (supplier initiates; PO auto-drafted at receipt) — daily bread, fresh produce, beverages

---

### §24.2 Preconditions

| Precondition | Sourced from | Failure mode |
|---|---|---|
| Tenant active | `/ops/tenants/T` | Suspended tenants cannot raise PO or receive goods except via `/ops` support lateral |
| Inventory module entitled | `/ops/tenants/T/entitlements` | Included every tier; Procurement sub-module T2+ for PO approvals workflow |
| Procurement role permission | Roles & Access | `po.draft` / `po.approve` / `grn.post` scoped; per-amount thresholds per tenant |
| Supplier master record exists | Suppliers module | Inline supplier-create flow as fallback; may block PO approval if tax ID missing |
| Items in catalogue OR inline-creatable | Inventory module | Unknown item → quick-add inline (same camera-first pattern as Sale Journey S2); temp SKU created |
| Branch / store location selected | Multi-Branch | Single-branch: implicit; multi: forced chooser (where does stock land) |
| COA has required accounts | Chart of Accounts | Missing Inventory Asset / AP / Landed Cost accounts → blocker with guided setup |
| Currency configured | Tax Engine + FX | Foreign-currency PO requires FX rate source; fallback to manual entry |
| Tax treatment configured | Tax Engine | Input VAT recoverable/non-recoverable per item class; missing → default "non-recoverable" + warning |
| Expense category mapping | Accounts mapping | Restaurant ingredient receipts hit different inventory sub-accounts than retail SKU |

---

### §24.3 Node-by-node with lego connectors

#### NODE 1: Need identified

**UI moments (any of):**
- Low-stock alert on procurement dashboard (triggered by Sale Node 5 reorder-point crossing)
- Operator on `/trade/inventory` clicks **"New Purchase Order"**
- Manager on `/trade/reports/restock-suggestions` selects suggested items → **"Create PO"**
- Operator on slot C11 86-list surface (entitled tenants) promotes 86'd item → **"Restock"** CTA
- Standing-order cron fires daily for configured items
- Supplier app / portal fires auto-replenishment signal (future integration)

| Sub-connector | Reads | Writes | Ripple |
|---|---|---|---|
| Restock intent captured | operator, branch, source (manual/alert/cron) | `po_draft` row (status: drafting, source tag) | audit: `po.drafted` |

**Return to UI:** PO builder — supplier picker, item list, pricing/quantity controls, notes field, expected delivery date.

---

#### NODE 2: PO drafted

**UI moment:** Operator assembles the PO on the builder screen.

```
[Supplier picked] ──────────── from Suppliers module OR inline-create
     ▼                           inline create: name, phone, tax ID (optional per tenant), default terms
[Branch / destination chosen] ── where goods will be received
     ▼
[Line items added] ─────────── for each item:
     │  ├── Item resolved ──── slot P2: catalogue lookup OR quick-add (same camera-first pattern as Sale slot S2). Plug-ins extend via slot: ingredient+recipe hint, consumable mapping, amenity mapping per vertical entitlement
     │  ├── Quantity entered ── uses tenant's UOM (each / case / kg / litre / bag); UOM conversion if needed
     │  ├── Unit cost entered ─ last cost pre-filled; manual override; promo/contract pricing hints
     │  ├── Discount applied ── per-line OR cart-level
     │  ├── Input-tax treatment — recoverable VAT / non-recoverable / exempt / reverse-charge
     │  ├── Expiry / batch entry — slot P7 Expiry/batch capture (entitled tenants: perishable / batched SKUs)
     │  └── Storage condition — cold / frozen / dry / controlled (inventory slot routing)
[Freight + handling line] ──── separate line item; feeds landed-cost calculation at Node 7
     ▼
[Other landed-cost lines] ──── customs duty, clearing, transport, insurance (allocable charges)
     ▼                           allocation method chosen: by value / by weight / by qty / manually per line
[Payment terms picked] ─────── net 0 (COD) / net 7 / net 14 / net 30 / advance / installment
     ▼
[Expected delivery date] ──── drives reorder tracking; surfaces overdue deliveries later
     ▼
[PO totals computed]
     ├── Subtotal (line items)
     ├── Discount total
     ├── Freight + handling
     ├── Other landed-cost allocable
     ├── Tax total (input VAT per line)
     ├── Grand total
     ▼
[Draft saved]
     ▼
[Audit: `po.draft_saved`]
```

**Return to UI:** PO draft preview with edit/send-for-approval/convert-to-direct-receipt options.

---

#### NODE 3: PO approved

**UI moment:** PO enters approval workflow based on tenant's thresholds.

```
[Authority check against drafter's role]
     ├── Within drafter's cap → auto-approved, proceed to issue
     ├── Beyond cap, within supervisor cap → supervisor review queue
     ├── Beyond supervisor cap → manager review queue
     ├── Beyond manager cap → owner review OR `/ops/support` escalation (very rare; typically contract-level)
     ▼
[Reviewer workspace]
     ├── PO details rendered
     ├── Supplier history (prior orders, on-time rate, quality complaints)
     ├── Price comparison (last price paid for same item; price trend)
     ├── Budget check — does this PO exceed category budget cap?
     ├── Cash flow check — does AP aging suggest capacity for this commitment?
     └── Supplier risk flags (blocklist, payment disputes, quality history)
     ▼
[Decision]
     ├── Approve → status: approved; ready to issue
     ├── Approve with revisions → bounced back with annotations
     ├── Decline → status: declined; drafter notified with reason
     └── Park → status: parked (awaiting more info)
     ▼
[Fraud signals evaluated]
     ├── Same drafter + same supplier, unusually high frequency → flag
     ├── Price materially higher than market baseline → flag
     ├── Supplier on platform blocklist (set at `/ops/settings/supplier-blocklist`) → hard-block
     └── Drafter + approver same person (where segregation required) → hard-block
     ▼
[Audit: `po.approved` with approver chain]
```

**Return to UI:** PO now in approved state with **"Issue to Supplier"** CTA.

---

#### NODE 4: PO issued to supplier

**UI moment:** Operator clicks **"Issue PO"**. Becomes a legal commitment to the supplier.

```
[PO number allocated] ──────── gap-free per-tenant sequence
     ▼
[PO state: approved → issued]
     ▼
[Delivery channels]
     ├── Email (supplier email on file)
     ├── WhatsApp (Meta Cloud API, if entitled; common in Ghana supplier comms)
     ├── SMS (summary + link to PDF)
     ├── Print (if supplier prefers paper)
     ├── Supplier portal push (future: supplier-facing app — "DalxicTrade Supplier")
     └── Manual (phone call / in-person handoff, with delivery log entry)
     ▼
[Commitment registered] ──── PO reserved as pending liability (NOT yet a payable; AP not raised yet)
     ▼                        feeds cash-flow forecast
[Expected delivery window surfaces on dashboard]
     ▼
[Audit: `po.issued` with channel]
```

**Return to UI:** PO live in "awaiting delivery" state. Can be cancelled (with supplier notification + audit) or amended (creates revision).

---

#### NODE 5: Goods arrive + counted

**UI moment:** Goods physically arrive. Receiving operator on `/trade/receiving` scans supplier invoice QR or enters PO # → PO loaded for receiving.

**Direct receipt variant:** if no prior PO, operator clicks **"Direct Receipt"** → inline PO auto-drafted at Node 2/3/4 shrink path → arrives here. Audit flags as spot purchase.

```
[PO loaded for receiving]
     ▼
[Receiving workspace]
     ├── Each expected line rendered with expected qty
     ├── Receiving operator counts and enters actual qty
     ├── Per-line flags:
     │    ├── Damaged — separate "damaged qty" field; destination: write-off / return to supplier
     │    ├── Expired on arrival (perishables) — separate expired qty; destination: reject
     │    ├── Short-shipped — received < expected; back-order flag per tenant policy
     │    ├── Over-shipped — received > expected; accept surplus (policy) or reject
     │    └── Substituted — supplier sent alternate item; manager approval required
     ├── Batch / expiry data captured per received batch (slot P7 Expiry/batch capture — entitled tenants with batched/perishable SKU classes)
     ├── Photo capture (camera-first): supplier invoice + goods state photo
     └── Temperature reading (cold-chain items; manual or sensor)
     ▼
[Blind-count option] ────────── tenant policy: receiving operator counts without seeing expected qty
     ▼                             reveals expected only after counts entered; variance surfaces for investigation
[Quality check fires]
     ├── Visual inspection checklist (tenant-configurable per item class)
     ├── Sample test (slot P11 QC sampling — entitled tenants with QC-bearing SKU classes)
     ├── Reject/accept decision per line
     ▼
[Reconciliation prep]
     ├── PO vs actual variance table generated
     ├── Per-line discrepancy reason tags (damaged, missing, extra, substituted)
     ▼
[Audit: `receiving.counted` with variances]
```

**Return to UI:** Receiving summary with discrepancies flagged; **"Post GRN"** or **"Reject Delivery"** options.

---

#### NODE 6: GRN posted

**UI moment:** Operator confirms counts and clicks **"Post Goods Received Note"**. Irreversible without reversal flow.

```
[GRN number allocated] ─────── gap-free per-branch sequence
     ▼
[PO updated] ───────────────── state: issued → partially_received / fully_received / closed
     ▼                          partial: remaining balance stays open; follow-up receipts allowed
[Received lines posted to inventory staging]
     ▼                          "staging" = received-but-not-yet-valued; visible as on-hand but cost TBD
[Damaged / rejected handling]
     ├── Damaged → Write-off account hit; supplier may be debit-noted
     ├── Rejected → Returned to supplier; debit note raised against supplier account
     ├── Short-shipped → no inventory booked for missing qty; supplier invoice expected to match received qty (not PO qty)
     ├── Over-shipped → accepted surplus booked; supplier invoice expected to reflect surplus
     └── Substituted → new SKU booked; cross-reference note added
     ▼
[Batch / expiry committed] ─── batch records written; FEFO/FIFO picker at Sale Node 4 will respect
     ▼
[Temperature log persisted] ── cold-chain compliance trail
     ▼
[Invoice capture]
     ├── Supplier invoice photo / PDF captured
     ├── Invoice total entered
     ├── Invoice number recorded (for 3-way match at Node 8)
     ▼
[Audit: `grn.posted`]
```

**Return to UI:** GRN posted confirmation. Next step: **"Resolve Landed Cost"**.

---

#### NODE 7: Landed cost resolved

**UI moment:** Landed cost workspace opens. This is where "total cost of getting stock to the shelf" crystallizes into per-unit valuation.

```
[Direct cost] ──────────────── per-line invoice price (from supplier invoice, not PO)
     ▼                           if invoice differs from PO → variance investigation (price variance)
[Allocable charges]
     ├── Freight (from PO line or separate supplier invoice)
     ├── Customs duty (imports)
     ├── Clearing agent fees (imports)
     ├── Transport / last-mile
     ├── Insurance
     └── Handling / unloading labor
     ▼
[Allocation method applied]
     ├── By value (default) — charge allocated proportional to line value
     ├── By weight — for heavy/freight-driven items
     ├── By volume — for bulky items
     ├── By quantity — flat per-unit
     └── Manual — operator assigns per line (rare)
     ▼
[Per-unit landed cost computed]
     ├── (direct unit cost) + (allocated charges / qty received) = landed unit cost
     ▼
[Weighted-average update]
     ├── For each item, new WAC = ((old on-hand × old WAC) + (received qty × new landed cost)) / (old on-hand + received qty)
     ├── Historical WAC preserved for audit
     ├── Slot P10 Derived-cost re-cost (entitled tenants): ingredient WAC feeds plate/kit/package cost recalculation; derived recipes re-priced
     ▼
[FX handling] ──────────────── foreign-currency invoice:
     ▼                           - locked FX rate at GRN date (default)
     │                           - OR locked at payment date (per tenant policy)
     │                           - FX variance at payment routed to Exchange Gain/Loss
[Input tax calculation]
     ├── Recoverable VAT booked to Input VAT (asset; offsets Output VAT at filing)
     ├── Non-recoverable VAT rolled into landed cost
     ├── Reverse-charge handled per GRA rules
     ▼
[Cost variance analysis]
     ├── Price variance (invoice unit price vs PO unit price) → Price Variance account
     ├── Quantity variance (invoice qty vs GRN qty) → investigation flag
     ▼
[Audit: `landed_cost.resolved`]
```

**Return to UI:** Landed cost summary with per-unit cost visible; **"Post to Inventory + AP"** button.

---

#### NODE 8: Inventory valued + payable raised

**UI moment:** Operator confirms. Irreversible.

```
[3-way match verified] ─────── PO ↔ GRN ↔ invoice numbers + qtys + amounts
     ▼                           mismatch beyond tolerance → investigation flag, supervisor approval to proceed
[Journal posted]
     ├── Dr Inventory Asset           (at landed cost × received qty, per item; staging → live)
     ├── Dr Input VAT                 (recoverable portion)
     ├── Dr Price Variance            (if invoice price > PO price, material)
     ├── Dr FX Loss                   (if applicable)
     ├── Cr Accounts Payable          (supplier; gross invoice amount)
     ├── Cr Freight Payable / Clearing Payable (if separate supplier)
     ├── OR Cr Cash                   (if COD / direct receipt paid immediately)
     ├── Dr Write-off                 (damaged/rejected qty)
     ├── Dr Prepaid                   (if overpaid on advance)
     ├── Cr FX Gain                   (if applicable)
     │    if any account missing → rollback, operator returned to Node 7
     ▼
[AP aging bucket assigned] ── based on invoice date + payment terms
     ▼                           feeds supplier statement and cash-flow forecast
[Staging → live inventory] ── received qty becomes sellable on POS. P9 observer: plug-ins consume post-receive event (recipe-explosion re-arm for restaurant, consumable re-arm for services, amenity re-arm for hospitality)
     ▼
[Supplier ledger updated]
     ▼
[Cost-basis downstream re-cost] — P10 slot: if WAC changed, downstream derived costs recalculated (restaurant plate cost via Menu & Recipes; services kit cost; hospitality package cost)
     ▼                           price-review prompt if derived cost moved beyond margin threshold
[Availability unlock] ───────── S7-reverse observer: availability plug-ins re-arm previously-blocked items (86-list unlock for restaurant, schedule-re-open for services, room-re-open for hospitality)
     ▼
[Low-stock alerts cleared] ─── for items now above reorder point
     ▼
[Audit: `grn.posted_to_gl`]
```

**Return to UI:** "Inventory updated + payable raised" confirmation; GRN archived, searchable.

---

#### NODE 9: Supplier paid

**UI moment:** Separate flow, may fire days/weeks after GRN depending on terms. Typically triggered from `/trade/accounting/payables`.

```
[Payment run triggered]
     ├── Manual — operator selects payables to pay
     ├── Batch — scheduled run (e.g., weekly Friday payables)
     ├── Auto — standing instruction for trusted suppliers
     ▼
[Payables list surfaced] ─── by supplier, by due date, by amount
     ▼                          aging buckets visible; overdue flagged
[Payment method picked]
     ├── Bank transfer — bank account + reference; bank file generated
     ├── MoMo transfer — merchant-to-MoMo push (MTN / Vodafone / AirtelTigo)
     ├── Cash — petty cash draw; requires physical handover signed receipt
     ├── Cheque — cheque # recorded; clearing awaited
     └── Card — rare for supplier payment, but possible
     ▼
[Payment authority check]
     ├── Within operator's cap → proceed
     ├── Beyond cap → supervisor approval
     ├── Beyond supervisor → dual-signature (two approvers)
     └── Beyond dual-sig → owner or /ops lateral
     ▼
[Payment executed]
     ▼
[Journal posted]
     ├── Dr Accounts Payable          (supplier)
     ├── Cr Cash / Bank / MoMo Clearing
     ├── Dr FX Gain/Loss              (if FX terms and rate moved from GRN to payment)
     ▼
[Withholding tax handling] ── if applicable, Dr AP (gross) / Cr WHT Payable + Cr Cash (net)
     ▼                            WHT certificate generated for supplier
[Supplier statement updated]
     ▼
[Audit: `payment.posted`]
```

**Return to UI:** Payment confirmation with remittance advice printable + emailable/WhatsApp-able.

---

#### NODE 10: Ripples

Post-receipt async effects.

```
[Inventory valuation tick]
     ├── COGS accuracy improves (each sale now values at true landed cost)
     ├── Margin analytics recompute
     ├── Stock valuation reports refresh
     ▼
[Slot P10 Derived-cost tick] ── entitled tenants only
     ├── All recipes / kits / packages using changed ingredients recalculated
     ├── Derived-item margin analytics refresh
     ├── Bundle / set / prix-fixe costing updates
     ▼
[Reorder suggestions refresh] ── reorder points may shift based on new cost + demand
     ▼
[Supplier scorecard tick]
     ├── On-time delivery rate
     ├── Fill rate (received vs ordered)
     ├── Damage rate
     ├── Price stability
     ├── Quality rejection rate
     ▼
[Cash flow forecast refresh] ── new payable feeds forecast
     ▼
[Compliance ticks]
     ├── Input VAT recoverable rolls into monthly VAT return
     ├── WHT remittance tracker updated (if applicable)
     ▼
[Ops heartbeat]
     ├── Tenant's procurement activity logged at `/ops/infra`
     ├── Cross-tenant anomalies: price spikes, supplier fraud patterns → `/ops/analytics/fraud-signals`
     ▼
[Billing meter tick] ────────── metered plans: inventory-transactions meter increments
     ▼
[Audit: `restock.completed`]
```

**Return to UI:** Procurement dashboard updated with today's GRNs, payables, alerts.

---

### §24.4 Intersection slots — where modules plug into the Restock Journey

| # | Slot | Flow location | Default (retail) | Restaurant plug-in | Services / Hospitality (future) |
|---|---|---|---|---|---|
| P1 | **Need signal** | Node 1 | Reorder-point alert, manual, cron | 86-list promotion, recipe consumption forecast, chef's par-level | Consumable depletion, linen shortage |
| P2 | **Item type** | Node 2, 5, 6 | Finished-good SKU | Ingredient, prep recipe, semi-finished, finished dish | Consumable, instrument, linen |
| P3 | **UOM + conversion** | Node 2, 5 | Each / case / carton | Kg, litre, bag, bunch, dozen, crate — complex conversions | Sets, units, hours |
| P4 | **Batch / expiry** | Node 5, 6 | Optional (pharma/cosmetics) | Mandatory for perishables; drives FEFO picking at Sale | Sterile-expiry for medical |
| P5 | **Storage routing** | Node 6 | Branch stockroom | Cold / frozen / dry / bar / wine cellar — auto-routing | Linen room, sterile store |
| P6 | **Quality check** | Node 5 | Visual damage | Sensory inspection, temperature probe, fresh produce sample | Calibration check, sterile integrity |
| P7 | **Landed cost allocation** | Node 7 | By value / weight | Same + perishable-spoilage-on-arrival adjustment | Same |
| P8 | **Cost model update** | Node 7, 8 | Weighted-average SKU cost | Ingredient WAC → recipe re-cost cascade → menu margin refresh | Service cost rebuild |
| P9 | **Menu/catalogue ripple** | Node 8 | Last-cost update on item card | 86 list unlock + plate cost surfaced + menu price review prompt | Service offering updated |
| P10 | **Supplier portal** | Node 4, 5 | Email/WhatsApp to supplier | Same + standing-order cadence per chef's schedule | Same |
| P11 | **Spot purchase path** | Node 1→5 | Inline direct receipt | Market run (fresh produce); petty cash tie-in | Inline consumable purchase |
| P12 | **Blind receive option** | Node 5 | Tenant policy | Same; common in high-theft-risk environments | Same |
| P13 | **Waste at receipt** | Node 5, 6 | Write-off journal | Heavy: perishable spoilage, damaged, expired-on-arrival; feeds Wastage module | Defective items flagged |
| P14 | **3-way match tolerance** | Node 8 | Price/qty tolerance per tenant | Tighter on high-value proteins/alcohol; looser on produce (price volatile) | Per-category tolerance |
| P15 | **WHT + compliance** | Node 9 | Tenant-configured by supplier class | Same + alcohol-import specifics | Same |

#### §24.4.A — Slot contracts

P-series slots follow §19.A template. Phase 1 boutique slots with full contracts: **P1 PO draft**, **P2 Line-item resolver** (`HN`), **P3 Approval gate**, **P4 Receive + GRN** (`N`, integrity-critical — module failure = block), **P7 Landed cost allocation**, **P8 Cost model update** (`HN`, observer emits WAC-change event consumed by S15/downstream), **P14 3-way match tolerance** (integrity-critical), **P15 WHT + compliance** (`HN`, observer emits to GRA). Remaining P-slots (P5 Storage routing, P6 Quality check, P9 Menu/catalogue ripple, P10 Supplier portal, P11 Spot purchase path, P12 Blind receive, P13 Waste-at-receipt) are slot-catalogue-complete with contracts deferred to their owning module's Phase 2 build window. Phase 1 retains normaled-passthrough defaults — no contract required to ship.

---

### §24.5 Offline variant

Restock must work in patchy connectivity. Rural supplier deliveries, market runs, and warehouse dead zones are normal Ghana conditions.

```
[Network down at receiving time]
     ▼
[Offline restock mode]
     ├── PO lookup: PO must be cached locally; not-cached → block with "reconnect to receive against this PO"
     ├── Direct receipt: fully functional; PO auto-drafted locally with provisional PO #
     ├── Receiving workspace: fully functional; counts, photos, batch entry all local
     ├── GRN post: functional with provisional GRN # from local allocator
     ├── Landed cost: computed locally; WAC updated in local state
     ├── Journal: queued locally with status `pending_sync`
     ├── Inventory: local on-hand updated; sellable on same device immediately
     ├── Supplier invoice photo captured locally
     └── Supplier payment: DISABLED if bank/MoMo needed; cash payment allowed
     ▼
[Network returns]
     ▼
[Restock sync daemon]
     ├── Provisional PO/GRN numbers reconciled to server sequence (server renumbers + audit map)
     ├── Journal entries post to GL
     ├── WAC reconciled centrally (local WAC may have drifted from server if concurrent activity)
     ├── Recipe costs recomputed server-side
     ├── Compliance transmissions fire (input VAT, WHT)
     ├── Conflicts surface in /trade/sync
     │    - Duplicate GRN against same PO (if another device received partially while offline)
     │    - WAC conflict → manager reconciles
     │    - Batch # collision across devices → manager resolves
     ▼
[Audit: `offline_restock_session.synced`]
```

---

### §24.6 Master ops laterals on the Restock Journey

| Lateral | Fires from | Lands on | Effect |
|---|---|---|---|
| **Supplier blocklist** | `/ops/settings/supplier-blocklist` | PO issue attempt | Platform-wide or per-tenant; prevents PO issue to fraudulent/problematic supplier |
| **Bulk import assist** | `/ops/support/ticket/T` | Tenant onboarding | Ops staff bulk-imports supplier list, item catalogue, opening stock |
| **Price reference data** | `/ops/settings/market-prices` | Node 2, 3 | Platform-maintained market-price hints (fresh produce, staples); informs tenant drafters |
| **Fraud alert** | `/ops/analytics/fraud-signals` | Back to tenant manager | Unusual PO patterns flagged: same drafter+supplier spike, price outliers, kickback patterns |
| **Remote assistance** | `/ops/support/ticket/T` | Active receiving flow | Staff co-pilots receiving operator; masked sensitive supplier data |
| **Force PO close** | `/ops/support/ticket/T` | Stuck PO | Close lingering unfilled PO (supplier cancelled, bankruptcy) |
| **WHT rate propagation** | `/ops/compliance/tax-rates` | Node 9 | Platform-level WHT rate updates cascade to all tenants |

---

### §24.7 Failure modes

| Failure | Node | Graceful path |
|---|---|---|
| Supplier missing tax ID | 2 | Inline supplier-edit; policy may allow PO save but block "issue" |
| Unknown item | 2 | Quick-add inline (camera-first); temp SKU; manager validates later |
| UOM conversion missing | 2 | Prompt conversion ratio or split receiving by UOM |
| PO exceeds budget cap | 3 | Block approval OR route to higher authority (tenant policy) |
| Supplier on blocklist | 3 | Hard block with explanation; escalate if urgent |
| Drafter = approver (segregation required) | 3 | Hard block; route to another approver |
| Supplier delivery overdue | post-4 | Dashboard alert; auto-nag via WhatsApp; escalation path |
| Partial delivery | 5 | Receive partial; PO stays open; tenant decides to wait or close |
| Over-delivery | 5 | Policy: accept surplus / reject surplus / supervisor decides |
| Substitution | 5 | Manager approval; cross-ref note; update catalogue if substitution recurring |
| Damaged on arrival | 5, 6 | Write-off + supplier debit note + photo evidence |
| Expired on arrival | 5, 6 | Reject + supplier debit note + audit |
| Temperature breach (cold chain) | 5, 6 | Reject + supplier debit note + compliance log (restaurant/pharma) |
| 3-way match out of tolerance | 8 | Investigation flag; supervisor approval to proceed OR hold invoice |
| Invoice > PO beyond tolerance | 8 | Price variance booked; supplier may be challenged; audit |
| Account missing (COA incomplete) | 8 | Rollback; tenant guided to finish COA setup |
| FX rate unavailable | 7, 8, 9 | Manual entry with source note OR block until rate feed recovers |
| WHT rate not configured | 9 | Policy-driven: default rate with warning OR block |
| Payment bounces (bad transfer) | 9 | AP restored; payment marked failed; investigation ticket |
| Duplicate supplier invoice # | 8 | Block; force investigation (supplier double-billing or genuine correction) |
| Power failure mid-receiving | 5–8 | Local state preserved; resume at last saved node |
| Network drops mid-flow | any | Switch to offline variant (6.5); sync on reconnect |
| Device unenrolled mid-flow | any | Freeze draft; re-enrollment or manager override |

---

### §24.8 Downstream ripples — what bubbles up to /ops

```
Restock completed
     │
     ├── /ops/analytics ────── tenant's procurement volume rolls into platform KPIs
     ├── /ops/analytics/fraud-signals — PO pattern anomalies, price outliers, kickback signals
     ├── /ops/billing ──────── metered plans: inventory-transactions meter; commitments feed usage
     ├── /ops/audit ────────── PO approvals, force-closes, blocklist triggers, tolerance overrides
     ├── /ops/compliance ──── input VAT recoverable, WHT remittances, cold-chain logs
     ├── /ops/support ──────── disputes, supplier complaints, mismatched invoices
     ├── /ops/infra ────────── supplier portal / email / WhatsApp delivery reliability
     └── /ops/settings ────── market-price reference data refined from aggregated tenant pricing (with privacy guardrails)
```

---

### §24.9 Ops linkage — 4 + N for the Restock Journey

**Mandatory 4:**

| Module | /ops/modules | /ops/tiers | /ops/add-ons | /ops/tenants/T/entitlements |
|---|---|---|---|---|
| Inventory | ✔ | all tiers | — | ✔ |
| Procurement / PO | ✔ | T2+ | ✔ add-on for T1 | ✔ |
| Suppliers | ✔ | all tiers | — | ✔ |
| Goods Receiving (GRN) | ✔ | all tiers | — | ✔ |
| Landed Cost | ✔ | T2+ | ✔ add-on | ✔ |
| Payables & AP | ✔ | T2+ | ✔ add-on | ✔ |
| Batch / Expiry | ✔ | T2+ | ✔ add-on | ✔ |
| Multi-Currency / FX | ✔ | T3+ | ✔ add-on | ✔ |
| WHT / Withholding | ✔ | T3+ | ✔ add-on | ✔ |

**Conditional N:**

| Conditional screen | Triggered when |
|---|---|
| `/ops/settings` → PO approval thresholds | Platform defaults; tenant overrides within bounds |
| `/ops/settings` → supplier blocklist | Platform-wide supplier denials |
| `/ops/settings` → market-price reference | Crowd-anonymized reference pricing feeds tenant drafters |
| `/ops/settings` → 3-way match tolerance | Platform defaults for price/qty variance |
| `/ops/compliance` → input VAT recovery | Monthly roll-up tracked here |
| `/ops/compliance` → WHT remittances | WHT due-date tracking |
| `/ops/compliance` → cold-chain logs | Temperature breach incidents (restaurant/pharma) |
| `/ops/billing` → metered procurement | Per-tenant inventory-transactions accrual |
| `/ops/support` → supplier disputes | Tickets from mismatched invoices, supplier complaints |
| `/ops/audit` → PO/GRN severity events | Force-close, tolerance overrides, blocklist triggers |
| `/ops/analytics/fraud-signals` | Procurement fraud patterns across tenants |
| `/ops/infra` → supplier-comms reliability | Email/WhatsApp/portal delivery stats |

---

### §24.10 Interlinks to other flows

| Connected flow | Direction | Merge point |
|---|---|---|
| Sale Journey | → feeds | Inventory received here is sold there; WAC set here flows to COGS at Sale Node 4 |
| Reversal Journey | ← receives | Return-to-stock from sale reversals increases on-hand (at original WAC) |
| Day-Close Journey | ↔ shares | EOD snapshot captures today's GRNs; reorder suggestions refreshed |
| Expense Journey | ↔ shares | Freight, clearing, small supplier payments often cross into expense treatment |
| Multi-Branch Transfer | ↔ shares | Goods may be received at one branch and transferred to another; transfer preserves landed cost |
| Tenant Lifecycle | ← dependency | Suspended tenant cannot raise PO (except via `/ops` lateral) |
| Auth Journey | ← dependency | `po.draft` / `po.approve` / `grn.post` roles gate actions |
| Billing Journey | → feeds | Metered plans accrue on procurement volume |
| Compliance Journey | → feeds | Input VAT, WHT, cold-chain |
| Remote Assistance | ↔ intersects | Ops co-pilot any restock node |
| Wastage / Spoilage (restaurant) | ↔ shares | Damaged/expired at receipt feeds wastage module |
| Menu & Recipes (restaurant) | → feeds | Ingredient WAC changes cascade to recipe re-costing |

Every merge point needs bidirectional audit during audit phase.

---

## §25. FLOW — The Tenant Lifecycle Journey

> **The most foundational flow on the platform.** Every other flow hangs off a tenant: suspended tenants can't sell; downgraded tenants lose intersection slots; archived tenants become read-only; reactivated tenants wake up where they left off. This journey is where the **entitlement engine** — the door-opener for every module — actually lives and breathes.
> **Shape:** V-shape dominant (master ops owns state transitions; tenant UI reacts). Also contains the **only flow where master ops is in the happy path** — signup, billing, and suspend/reactivate are master-ops-first by design.
> **Vertical-agnostic:** same spine for retail tenant, restaurant tenant, institute tenant, future verticals. Vertical-specific onboarding (menu import vs catalogue import, table map vs floor plan, enrollment vs POS) plugs at intersection slots defined in 7.4.
> **Frequency:** signups weekly–monthly; state transitions (upgrade, suspend, etc.) lifetime-sparse per tenant but system-wide constant.

### §25.1 Skeleton

```
[Signup intent] → [Account provisioned] → [Trial live] → [Activation] → [Live operation] ⇄ [State changes: upgrade / downgrade / branch+/− / add-on +/− / suspend / unsuspend] → [Archive] → [Purge]
```

Non-linear. Unlike the transactional flows (Sale, Reversal, Day-Close, Restock) which have a fixed directional spine, the Tenant Lifecycle is a **state machine**. "Live operation" is the steady state; transitions fire from many triggers.

**States:**
- `signup_draft` — intent captured; provisioning incomplete
- `trial` — provisioned; limited time; full features within tier
- `active` — paid tenant in good standing
- `suspended_soft` — operational read-mostly; can view but not transact
- `suspended_hard` — total lockout; all users receive "Account suspended"
- `archived` — tenant left; data retained read-only per retention policy
- `purged` — data erased per compliance approval

**Transitions:** Every edge of the state graph has a dedicated sub-flow with triggers, preconditions, journal impact, entitlement ripples, and audit events.

---

### §25.2 Preconditions

Unlike other flows, the Tenant Lifecycle has **no operational preconditions** — it creates the preconditions that all other flows require. Instead, it has **platform preconditions**:

| Precondition | Sourced from | Failure mode |
|---|---|---|
| Platform healthy | `/ops/infra` health check | Signup rate-limited / queued if platform under incident |
| Signup channel active | `/ops/settings/signup-channels` | Specific channel (self-serve web, partner, ops-created) may be toggled |
| Tier catalogue current | `/ops/tiers` | Signup forced to default tier if tier catalogue mid-edit |
| Identity verification provider available | `/ops/settings/kyc` | Non-interactive fallback (manual review queue) if provider down |
| Payment provider available | `/ops/settings/payments` | Trial may proceed without payment; active state blocked until payment works |
| Audit pipeline available | `/ops/audit` | Lifecycle transitions HARD BLOCK if audit pipeline down (integrity rule) |

---

### §25.3 Node-by-node with lego connectors

#### NODE 1: Signup intent

**UI moments (any of):**
- Prospective tenant on `dalxic.com/trade` → clicks **"Get Started"** → self-serve signup wizard
- Partner/reseller on `/ops/partners/P/dashboard` → clicks **"Onboard New Tenant"**
- Ops staff on `/ops/tenants` → clicks **"Create Tenant"** (white-glove onboarding)
- Import flow (future): migration wizard from competitor POS
- WhatsApp intent (future): prospect messages business WhatsApp → bot gathers basics → creates draft

```
[Signup context captured]
     ├── Channel (self-serve / partner / ops-created / import / whatsapp)
     ├── Referrer / partner ID (if applicable)
     ├── Campaign / UTM (if applicable)
     ▼
[Basics collected]
     ├── Business legal name
     ├── Trading name (if different)
     ├── Primary contact: name, phone, email
     ├── Business type (retail / restaurant / mixed / services / institute)
     ├── Country (default: Ghana)
     ├── Language preference (EN / future: TW, GA, EWE)
     ├── Expected branch count (informs tier suggestion)
     ├── Expected operator count
     ▼
[Tier recommendation]
     ├── Based on business type + size → suggested tier (T1/T2/T3)
     ├── Visible: what modules are included, what are add-ons, pricing
     ├── Tenant can accept suggestion or pick different tier
     ▼
[Signup draft row created]
     ▼
[Audit: `tenant.signup_started`]
```

**Return to UI:** Signup wizard step 2 — business details + KYC.

---

#### NODE 2: Account provisioned

**UI moment:** Wizard collects remaining details and provisions backing resources.

```
[Legal / compliance details]
     ├── Ghana: TIN (Taxpayer Identification Number) — optional for signup, required for E-VAT filing
     ├── Ghana: GRA registration status
     ├── Ghana: SSNIT employer number (if has employees)
     ├── Business registration document (photo/PDF upload)
     ├── Owner ID document (photo/PDF — Ghana Card / passport)
     ▼
[KYC check]
     ├── Automated identity verification (provider API)
     ├── If passes: proceed
     ├── If flagged: route to `/ops/tenants/pending-review` queue (manual review within 24h)
     ├── If fails: signup blocked; explanation; support contact
     ▼
[Tenant ID allocated] ──────── gap-free platform-wide sequence; tenant's permanent identifier
     ▼                           e.g., `T-00482`
[Subdomain / tenant URL provisioned] ── `tenant-slug.dalxic.com` OR path prefix
     ▼                                    auto-generated from legal name; user can customize (subject to availability)
[Default data seeded]
     ├── Chart of Accounts (Ghana SME template)
     ├── Tax rates (VAT 15%, NHIL 2.5%, GETFund 2.5%, COVID 1%)
     ├── Default currency (GHS)
     ├── Default roles (Owner, Manager, Cashier/Server, Supervisor)
     ├── Empty product catalogue / menu (vertical-specific placeholders)
     ├── Default receipt template (tenant branding slot, Ghanaian tax footer)
     ├── Default shift/till setup for single branch
     ├── Vertical-specific starter (see slot T1: Vertical starter pack)
     ▼
[Owner account created]
     ├── Email sent with activation link
     ├── WhatsApp message sent (if opted in)
     ├── Default PIN generated + forced-change on first login
     ▼
[Entitlement registry initialized]
     ├── Tenant's tier recorded
     ├── Tier-included modules activated
     ├── Add-ons empty
     ├── Intersection slots resolved for vertical
     ▼
[Tenant row: signup_draft → trial]
     ▼
[Audit: `tenant.provisioned` with KYC status]
```

**Return to UI:** Activation email/WhatsApp received; owner clicks link → first-login flow.

---

#### NODE 3: Trial live

**UI moment:** Owner logs in first time. Trial clock starts.

```
[First login]
     ├── Force PIN change from default
     ├── Tenant onboarding tour offered (vertical-specific)
     ├── Day 1 tasks surfaced:
     │    ├── Add your first product / menu item
     │    ├── Do your first sale (or test sale)
     │    ├── Add a team member
     │    ├── Connect payment providers (MoMo, card)
     │    └── Slot T7 Vertical-starter task (entitled tenants): e.g., map your tables, print barcode labels, open a cohort — resolved per vertical pack
     ▼
[Trial clock running]
     ├── Default: 14 days (tenant-configurable at `/ops/settings/trial-policy`)
     ├── Countdown visible on dashboard; email reminders at day 7 / 3 / 1 / expiry
     ├── Full tier features unlocked during trial (generous)
     ├── Usage caps in place (e.g., max 100 transactions/day on trial) to prevent production use
     ▼
[Usage tracking]
     ├── Transactions, operators, branches, storage
     ├── Fed to `/ops/analytics/trial-funnel` for conversion analysis
     ▼
[Trial-end approaches]
     ├── T-7 days: reminder email/WhatsApp
     ├── T-3 days: reminder + "Start subscription" CTA
     ├── T-1 day: final reminder
     ├── T-0 (expiry): trial ends
     ▼
[Trial outcome]
     ├── Path A: payment attached → transitions to NODE 4 (Activation)
     ├── Path B: no payment → auto-moves to `suspended_soft` (read-only grace 14 days)
     │    → still recoverable with payment during grace
     ├── Path C: explicit "Cancel trial" → transitions to `archived`
     └── Path D: extended by ops (partner deal, edge case) → grace extended with audit
     ▼
[Audit: `tenant.trial_ended` with outcome]
```

**Return to UI:** Depending on outcome — payment screen, locked banner, or cancellation confirmation.

---

#### NODE 4: Activation

**UI moment:** Owner attaches payment method. Transitions trial → active.

```
[Payment method collection]
     ├── Method options:
     │    ├── MoMo standing order (MTN / Vodafone / AirtelTigo) — most common in Ghana
     │    ├── Bank standing order
     │    ├── Card (saved for recurring)
     │    ├── Manual invoicing (ops-approved, for enterprise)
     │    └── Partner-billed (reseller fronts the bill)
     ▼
[First charge]
     ├── Pro-rated for partial month OR full first month based on plan
     ├── Setup fee if applicable (tier-dependent; usually T3+)
     ├── First invoice generated (see Billing Journey interlink)
     ▼
[Charge result]
     ├── Success → proceed to active
     ├── Decline → retain trial-expired state; prompt retry
     ├── Pending (MoMo slow settlement) → temporary "pending_activation" state; ops notified
     ▼
[Entitlements lock to paid tier]
     ├── Tier boundaries enforced (trial-generous → tier-appropriate)
     ├── Usage caps released (or set to tier's actual limits)
     ├── Locked modules re-surface as grayed (visibility-as-upsell per Section 1)
     ▼
[Tenant row: trial → active]
     ▼
[Welcome-to-active comms]
     ├── Email: "You're live!"
     ├── WhatsApp: "Your account is active. Tap to see today's dashboard."
     ├── Optional: partner / ops rep courtesy call (white-glove tenants)
     ▼
[Audit: `tenant.activated` with tier + payment method]
```

**Return to UI:** Active dashboard; trial banner gone; welcome kit surfaced.

---

#### NODE 5: Live operation (steady state)

This is where every other flow runs. The Tenant Lifecycle's job is to keep the tenant's state coherent **while** those flows execute.

**Continuously running sub-processes:**

```
[Entitlement resolution]
     ├── On every request from tenant: resolve tenant → tier + add-ons → active intersection slots
     ├── Cached with TTL; invalidated on any state change
     ├── When tenant opens a module, engine checks: module_X.active_for(tenant_T) → bool
     │    → true: full functionality
     │    → false: grayed UI + upsell landing (Section 1, graceful degradation rule)
     ▼
[Usage metering]
     ├── Transactions, storage, operators, branches, API calls, WhatsApp messages
     ├── Fed to `/ops/billing/metering` for invoice drafting
     ▼
[Health heartbeat]
     ├── Daily-close heartbeat (Day-Close Journey ripple)
     ├── Daily login heartbeat
     ├── Daily E-VAT heartbeat
     ├── Missed heartbeats → support investigation + auto-ticket
     ▼
[Compliance monitoring]
     ├── VAT return due dates tracked
     ├── SSNIT monthly accrual
     ├── PAYE monthly accrual
     ├── Pre-deadline reminders fire
     ▼
[Payment monitoring]
     ├── Recurring subscription charge fires monthly/annually
     ├── Success → invoice paid, continue active
     ├── Decline → retry cadence (day 0, 3, 7, 14); escalation on each
     ├── Final retry fails → transitions toward suspended_soft
```

**Trigger-driven state transitions from live operation:**

##### T5.1: Upgrade tier

```
[Owner clicks "Upgrade to T2/T3"] OR ops initiates from /ops/tenants/T/entitlements
     ▼
[Pricing preview] — pro-rated delta for current period
     ▼
[Consent + payment capture if amount > 0]
     ▼
[Effective date] — immediate OR next billing cycle (owner picks)
     ▼
[Entitlement engine re-resolves]
     ├── New modules activate → intersection slots open
     ├── Usage caps expand
     ├── Locked features surface as active
     ▼
[Tenant notified — features lighting up]
     ▼
[Audit: `tenant.tier_upgraded`]
     ▼
[Sale / Reversal / Day-Close / Restock all see new entitlements on next action]
```

##### T5.2: Downgrade tier

```
[Owner clicks "Downgrade"] — usually discouraged but not blocked
     ▼
[Impact preview] — which modules you'll LOSE, data retention note
     ▼
[Consent + confirmation]
     ▼
[Effective date] — usually end-of-current-period (paid time honored)
     ▼
[At effective date: entitlement engine re-resolves downward]
     ├── Modules deactivate → intersection slots close
     │    → default behavior resumes at slot
     │    → vertical-specific data preserved read-only (per Design Principle 7: Preserve, don't delete)
     ├── Usage caps shrink
     │    → if over cap at downgrade: grace period (e.g., 30 days) to reduce OR upgrade back
     ▼
[Tenant notified — features going dim]
     ▼
[Audit: `tenant.tier_downgraded`]
```

##### T5.3: Add-on activation

```
[Owner activates an add-on module] OR ops grants via /ops
     ▼
[Pricing preview + consent]
     ▼
[Entitlement engine re-resolves]
     ├── Specific slot opens for this tenant
     ├── Example: a cart-variant add-on → tenant's Sale Journey cart container (S4) gains a new variant via slot entitlement flip (no spine change)
     ▼
[Billing incremented (usually monthly recurring)]
     ▼
[Audit: `tenant.addon_activated`]
```

##### T5.4: Add-on deactivation

```
[Owner deactivates] OR ops revokes
     ▼
[Impact preview] — module-specific data becomes read-only
     ▼
[Effective end-of-current-period by default]
     ▼
[Entitlement re-resolves — slot closes]
     ▼
[Audit: `tenant.addon_deactivated`]
```

##### T5.5: Branch add / remove

```
[Owner adds a branch at /trade/branches]
     ├── Branch name, address, default operators, opening float
     ├── Tier check: does current tier allow another branch? (e.g., T1 = 1 branch, T2 = 3, T3 = unlimited)
     │    → exceeds: prompt upgrade OR block
     ▼
[Branch provisioned]
     ├── Default shift / till scaffolding
     ├── COA branch segment
     ├── Inventory branch segment (opening on-hand = 0 or transferred from other branch)
     ▼
[Entitlement re-resolves — multi-branch features light up if first >1 branch]
     ▼
[Audit: `tenant.branch_added`]

[Branch remove]
     ▼
[Data preservation] — closed branch becomes read-only; cannot transact; stock transferred or written off
     ▼
[Audit: `tenant.branch_removed`]
```

##### T5.6: Operator / role change

```
[Owner or manager invites operator]
     ├── Name, phone, role, PIN policy, access branches
     ▼
[Operator provisioning]
     ├── Invite sent via WhatsApp / SMS / email
     ├── Operator first-login forces PIN set
     ▼
[Role assignment] — from Roles & Access module; per-module permission scopes
     ▼
[Audit: `operator.provisioned`]

[Role downgrade / revocation]
     ▼
[Active sessions invalidated]
     ▼
[Audit: `operator.role_changed`]
```

##### T5.7: Suspend (soft)

**Triggers:**
- Payment failure after retry cadence exhausts
- Tenant-requested pause (vacation hold)
- Compliance warning (e.g., GRA investigation, escalation)
- Low-severity fraud investigation
- Partner request (reseller pauses their customer)

```
[Suspension initiated]
     ├── Reason tag required
     ├── Auto-initiated: payment cadence exhausted
     ├── Manual: ops staff at /ops/tenants/T clicks "Soft Suspend"
     │    → approver chain (depending on tier; enterprise tenants require dual approval)
     ▼
[Tenant enters suspended_soft]
     ├── All operator sessions remain valid but show "Account in read-only mode — contact support"
     ├── Can view: reports, past sales, inventory, audit
     ├── Cannot: sell, refund, post GRN, run payroll, close day
     ├── Exception: day-close if open day at time of suspend (graceful finish)
     ▼
[Tenant notified]
     ├── Email, WhatsApp, in-app banner
     ├── Reason + resolution path
     ▼
[Reactivation path surfaced]
     ├── If payment: "Retry payment" CTA
     ├── If compliance: "Upload required document"
     ├── If fraud: "Contact support"
     ▼
[Audit: `tenant.suspended_soft` with reason + initiator]
```

##### T5.8: Suspend (hard)

**Triggers:**
- Fraud confirmed (not suspected)
- Legal order / compliance mandate
- Terms-of-service violation (serious)
- Extended non-payment past soft-suspend grace
- Tenant request ("shut it all down")

```
[Hard suspension initiated]
     ├── Ops dual-approval required (never single-person hard suspend)
     ├── /ops lateral fires: `tenant.hard_suspend`
     ▼
[All active sessions terminated immediately]
     ├── Operators see "Account suspended — contact support"
     ├── No operational access (not even read-only)
     ├── Owner retains minimal read-only access to data export + billing (regulatory)
     ▼
[Scheduled jobs paused]
     ├── Recurring billing paused (or adjusted per reason)
     ├── Compliance filings still queue (legal obligation)
     ├── Webhooks suspended
     ▼
[Retention clock starts]
     ├── Default 90 days in hard_suspend → can move to archive or reactivate
     ├── Clock extends automatically if active dispute / legal hold
     ▼
[Audit: `tenant.suspended_hard` with dual-approver chain + reason]
```

##### T5.9: Unsuspend (reactivate)

```
[Reactivation trigger]
     ├── Payment: owner settles arrears → auto-reactivate
     ├── Compliance: document uploaded → ops review → manual reactivate
     ├── Fraud: investigation clears → ops dual-approve reactivate
     ├── Tenant request: owner requests resume → verify identity → reactivate
     ▼
[State transition: suspended → active]
     ├── Entitlements re-resolve
     ├── Sessions require fresh login (PIN re-prompt everyone)
     ├── Open carts / tabs recovered where possible
     │    → if too old (>N days), safely expired with audit
     ├── Day-close alignment: if suspended mid-day, that day force-closed before new day opens
     ▼
[Tenant notified — back online]
     ▼
[Post-reactivation health check]
     ├── Ops-initiated monitoring period (elevated scrutiny)
     ├── Fraud-reactivations flagged to `/ops/analytics/fraud-signals`
     ▼
[Audit: `tenant.reactivated` with reason]
```

---

#### NODE 6: Archive

**Triggers:**
- Owner explicitly offboards ("Close my account")
- Hard-suspend retention clock expires
- Business ceases operations (known via non-usage signal + attempted contact)
- Merger (tenant merges into another tenant on platform)

```
[Archive initiated]
     ├── Owner path: full consent flow + data export offered + final invoice settled
     ├── Auto-path: extended non-usage + suspend clock expired; auto-notification attempts fail
     ▼
[Final billing run]
     ├── Pro-rated final charge
     ├── Outstanding balance settled or escalated
     ├── Platform refunds unused pre-paid credit (if any)
     ▼
[Data export delivered]
     ├── Bulk CSV / JSON export: sales, inventory, customers, employees
     ├── Formal tax filings archive (legal requirement to retain by tenant)
     ├── Via secure download link (expires in 14 days) + email to registered owner
     ▼
[Tenant transitions: active/suspended → archived]
     ├── All operational access removed
     ├── Data preserved read-only at platform (retention per policy)
     ├── Subdomain redirects to "This business is no longer on Dalxic"
     ▼
[Compliance retention clock starts]
     ├── Default: 7 years (Ghana tax records retention)
     ├── Extension for active legal dispute
     ▼
[Audit: `tenant.archived` with reason + final export delivery status]
```

**Return to UI:** Owner sees "Account archived" confirmation with export link; operational users can no longer log in.

---

#### NODE 7: Purge

**Triggers:**
- Compliance retention period expires + no active legal hold
- Tenant explicit GDPR-equivalent erasure request (Ghana DPA)
- Legal order to erase
- Platform exit (Dalxic decommissioning a data center, subject to transfer options first)

```
[Purge eligibility verified]
     ├── Retention clock expired
     ├── No active disputes / legal holds
     ├── Dual-approval required (ops + legal)
     ▼
[Final export to tenant] (if reachable)
     ├── Last-chance export link; 30-day window
     ▼
[Cryptographic proof generation]
     ├── Pre-purge data digest computed + sealed
     ├── Proof that "tenant T existed and held X records" without holding the records
     ▼
[Erasure executed]
     ├── All tenant-owned data deleted
     ├── Audit trail references anonymized (keep structural integrity)
     ├── Tenant ID reserved (never reused) to prevent accidental resurrection
     ▼
[Audit: `tenant.purged` with dual-approver + proof hash]
     ▼
[This audit row is itself permanent — never purged]
```

**Return to UI:** Owner (if reachable) notified of completion; all access gone.

---

### §25.4 Intersection slots — where vertical plug-ins plug into the Tenant Lifecycle

| # | Slot | Flow location | Default (retail) | Restaurant plug-in | Institute plug-in | Services / Hospitality (future) |
|---|---|---|---|---|---|---|
| T1 | **Vertical starter pack** | Node 2 | Retail COA + catalogue scaffold | Restaurant COA + menu template + default modifier trees + sample recipes | Institute COA + terms + courses template + attendance setup | Services scaffold / hospitality folio |
| T2 | **Onboarding tour** | Node 3 | "Add product → do sale" | "Add menu item → build table map → fire first tab" | "Create term → enroll first student → take first attendance" | Service-specific |
| T3 | **Day-1 tasks** | Node 3 | Product + team + payment | Menu + table map + team + kitchen setup | Students + staff + curriculum | Services + providers |
| T4 | **Signup questions** | Node 1 | "How many branches?" | Adds: "How many tables? Bar?" | Adds: "Students? Year groups? NGO or school?" | Service-specific |
| T5 | **Tier-included modules** | Node 2, 4 | POS, Inventory, Customers, Tax, COA, Shifts | Same + Menu, Modifiers, Tables (T1 restaurant) | Same + Enrollment, Attendance (T1 institute) | Vertical-specific module bundles |
| T6 | **Entitlement resolution** | Node 5 | Retail intersection slots S1–S21 opened per tier | Restaurant slots opened for Menu/Modifiers/Tables/KDS/Reservations/Tips/ServiceCharge/BarTabs | Institute: Enrollment/Attendance/Fees/Reports | Future slots |
| T7 | **Usage caps** | Node 5 | Transactions, operators, branches | Same + tables, seats, covers, kitchen stations | Same + students, classes | Services sessions, rooms |
| T8 | **Compliance pack** | Node 5 | Ghana VAT + NHIL + GETFund + COVID | Same + alcohol excise (if alcohol entitled) | Same + NGO-specific reporting (if NGO tag) + GES alignment | Tourism levy |
| T9 | **Reports recipients** | Node 5 | Owner + manager | Same + head chef + F&B director | Same + head teacher + finance officer | Service manager |
| T10 | **Export format** | Node 6 | Retail CSV set | Restaurant CSV set + recipe archive + reservation history | Institute CSV set + academic records | Service data sets |
| T11 | **Retention class** | Node 6, 7 | 7yr Ghana tax standard | Same + alcohol/hygiene logs retention if applicable | Same + student records extended retention | Service regulatory retention |
| T12 | **Merge / split** | Node 6 | Tenants rarely merge | Multi-outlet consolidation possible | School mergers (known Ghana pattern) | Franchise consolidation |

#### §25.4.A — Slot contracts

T-series slots follow §19.A template. Phase 1 boutique slots with full contracts: **T1 Starter-pack** (`N`), **T5 Tier→Module mapping** (`N`, integrity-critical), **T6 Usage caps** (`HN`, observer emits cap-approach/breach to Billing), **T7 Compliance pack** (GH default: TIN + VAT + SSNIT + GRA E-VAT), **T8 Legal hold** (`DN` when hold flag set — writes blocked), **T11 Retention class** (`N`, integrity rule: 7-year Ghana tax standard default). Remaining T-slots (T2 Onboarding tour, T3 Day-1 tasks, T4 Signup questions, T9 Reports recipients, T10 Export format, T12 Merge/split) are slot-catalogue-complete with contracts deferred to their owning Phase 2 module. Entitlement resolution itself is integrity-critical; see §19.A `contract_violation` handling — an entitlement-module crash blocks the tenant rather than open all doors (fail-secure).

---

### §25.5 Offline variant

Tenant Lifecycle is **predominantly online** — signup, activation, tier change, suspend all originate at master ops and can't meaningfully occur offline. But **entitlement resolution** (happens on every tenant action) must work offline.

```
[Device offline]
     ▼
[Cached entitlement snapshot used]
     ├── Last-sync tenant state: tier, add-ons, active slots, usage caps
     ├── Age of snapshot tracked; stale > N hours → banner "Entitlement snapshot stale"
     ├── Transactions proceed against cached entitlements
     ▼
[Network returns]
     ▼
[Entitlement reconciliation]
     ├── If tenant state changed while offline (upgrade, suspend, etc.):
     │    → cached snapshot stale; sessions prompt re-login
     │    → if SUSPENDED while offline: all offline-queued transactions still sync,
     │      but NEW transactions blocked from moment of sync forward
     │    → offline-queued transactions that occurred AFTER the server-side suspend are audit-flagged
     ▼
[Audit: `entitlement_snapshot_reconciled`]
```

**Critical rule:** **Suspensions are retroactive on the server but not enforceable retroactively on the device.** Offline transactions between the suspend moment and the device's first reconnect are honored but audit-flagged for review.

---

### §25.6 Master ops laterals

Tenant Lifecycle is primarily a set of master-ops-initiated transitions. But additional laterals:

| Lateral | Fires from | Lands on | Effect |
|---|---|---|---|
| **Impersonate tenant** | `/ops/support/ticket/T` | Dual-approval required | Ops staff log in as owner for troubleshooting; session heavily audited; all actions labeled "impersonation"; masked PII in UI |
| **Bulk tier migration** | `/ops/tenants/bulk-ops` | Many tenants | Platform-wide tier changes (e.g., tier restructuring); staged rollout with monitoring |
| **Emergency broadcast** | `/ops/releases/announcements` | All active tenants | Banner on next load: outage notice, security alert, scheduled maintenance |
| **Merge tenants** | `/ops/tenants/merge` | Source + target tenant | Rare; acquirer absorbs acquiree; data consolidation; heavy audit |
| **Cross-tenant refund** (dispute resolution) | `/ops/billing` | Platform account | Ops credits affected tenants after platform incident |
| **Force-export** | `/ops/legal` | Archived / suspended tenant | Legal order forces data export to authorized party |
| **Legal hold** | `/ops/legal` | Any state | Freezes purge clock; annotates retention; special audit |

---

### §25.7 Failure modes

| Failure | Node | Graceful path |
|---|---|---|
| KYC provider down | 2 | Queue for manual review; tenant enters `pending_review`; signup continues with limited access |
| Subdomain collision | 2 | Force different slug; suggest alternatives |
| Payment decline at activation | 4 | Retain trial-expired state; retry cadence; offer alternate method |
| Payment decline at recurring | 5 | Retry cadence (0/3/7/14 days); escalating comms; ends at soft-suspend if unresolved |
| Over-usage during trial | 3 | Soft cap enforcement; banner encourages upgrade |
| Over-usage during active | 5 | Soft cap with grace window; auto-upgrade prompt OR usage throttle |
| Downgrade would orphan data | T5.2 | Impact preview; data preserved read-only; blocker only if legal constraints |
| Downgrade exceeds usage cap at new tier | T5.2 | Grace window to reduce OR cancel downgrade |
| Branch-remove with active stock | T5.5 | Transfer or write-off enforced first |
| Operator revocation mid-session | T5.6 | Session invalidated; cart preserved for N minutes under supervisor |
| Soft-suspend with open day | T5.7 | Grace: finish close only; no new sales |
| Hard-suspend with open tab / cart | T5.8 | Carts auto-voided; audit-flagged; dispute process available to tenant upon reactivation |
| Reactivation after long suspend | T5.9 | Fresh login required; entitlement re-resolve; data integrity check; audit elevated |
| Archive with unpaid balance | 6 | Block archive until settled OR route to collections with audit |
| Purge with active legal hold | 7 | Blocked; retention auto-extended; legal notified |
| Purge proof generation fails | 7 | Halt purge; escalate; never purge without integrity proof |
| Merge conflict (duplicate master data) | 7.6 lateral | Manual reconciliation workspace; ops-driven with tenant confirmations |
| Entitlement cache poisoning (rare) | 5 | Server-side re-resolve on next login; audit anomaly; invalidate cache globally for that tenant |
| Offline transaction after server-side suspend | 7.5 | Honored but flagged; reviewed during reconciliation; may trigger reversal |
| Tenant ID collision (impossible if allocator correct) | 2 | Halt; escalate; integrity investigation |

---

### §25.8 Downstream ripples — what bubbles up from the Tenant Lifecycle

Unlike other flows that emit ripples to `/ops/*`, the Tenant Lifecycle IS the thing `/ops/*` primarily observes. Its ripples target the **platform's own dashboards**:

```
Tenant state transition
     │
     ├── /ops/tenants ────────── real-time tenant roster state; suspended/trial/active counts
     ├── /ops/analytics ───────── signup funnel, conversion rate, activation rate, churn, LTV
     ├── /ops/analytics/trial-funnel — day-by-day trial progression, drop-off analysis
     ├── /ops/analytics/cohorts — cohort retention by signup month, by vertical, by channel
     ├── /ops/billing ────────── every state transition has billing implication (pro-rate, refund, stop, start)
     ├── /ops/audit ─────────── the most sensitive audit events (hard-suspend, purge, impersonate, merge)
     ├── /ops/compliance ──── KYC completion rate, retention policy adherence
     ├── /ops/support ──────── auto-tickets from suspension, payment decline, missed heartbeat
     ├── /ops/partners ──────── partner-originated tenants tracked for commission accrual
     ├── /ops/releases ──────── tenant impacted counts per release rollout
     ├── /ops/infra ────────── tenant density per region, per deployment shard (capacity planning)
     └── /ops/legal ─────────── legal-hold register, purge register, dispute register
```

---

### §25.9 Ops linkage — 4 + N for the Tenant Lifecycle

**Mandatory 4** (slightly different for Tenant Lifecycle because it IS the ops flow):

| Module | /ops/modules | /ops/tiers | /ops/add-ons | /ops/tenants/T/entitlements |
|---|---|---|---|---|
| Tenant Registry | N/A — master ops owns | all tiers | — | foundational |
| Tier Catalogue | N/A — master ops owns | defined here | — | applied per tenant |
| Add-on Catalogue | N/A — master ops owns | — | defined here | applied per tenant |
| Entitlement Engine | foundation for all modules | foundation for all tiers | foundation for all add-ons | per-tenant resolver |

**Conditional N** (extensive, because nearly every ops screen touches the Tenant Lifecycle):

| Conditional screen | Triggered when |
|---|---|
| `/ops/tenants` | Primary tenant management surface |
| `/ops/tenants/pending-review` | KYC-flagged signups |
| `/ops/tenants/T/entitlements` | Per-tenant module/slot state |
| `/ops/tenants/T/devices` | Device registry per tenant |
| `/ops/tenants/T/users` | Owner + operator directory |
| `/ops/tiers` | Tier catalogue maintenance |
| `/ops/add-ons` | Add-on catalogue maintenance |
| `/ops/billing` | Invoicing, recurring charges, pro-rations, credits |
| `/ops/partners` | Partner-originated tenant tracking |
| `/ops/compliance` | KYC, retention, legal holds |
| `/ops/support` | Tickets from every lifecycle event |
| `/ops/audit` | All lifecycle state transitions logged |
| `/ops/analytics` | Funnel, cohort, LTV, churn |
| `/ops/analytics/fraud-signals` | Suspicious signup patterns, fraud-driven suspend patterns |
| `/ops/releases` | Tenant impact of rollouts |
| `/ops/infra` | Capacity, shard residency |
| `/ops/legal` | Legal holds, purge queue, dispute register |
| `/ops/settings/signup-channels` | Enable/disable signup paths |
| `/ops/settings/trial-policy` | Trial length, caps, extension rules |
| `/ops/settings/kyc` | KYC provider configuration |
| `/ops/settings/retention-policy` | Data retention and purge timing |

---

### §25.10 Interlinks to other flows

The Tenant Lifecycle is the **precondition root** for every other flow. Every flow's Section X.2 (Preconditions) starts with "Tenant T active." The lifecycle is what makes that precondition true or false.

| Connected flow | Direction | Merge point |
|---|---|---|
| Sale Journey | → gates | Suspended tenant: no sale. Downgraded tenant: narrower intersection slots. |
| Reversal Journey | → gates | Same — suspended tenants route through force-refund lateral only. |
| Day-Close Journey | → gates | Suspended tenants can still close open days (graceful finish). |
| Restock Journey | → gates | Same dependency structure. |
| Auth / Session Journey | ↔ shares | Tenant state change invalidates all sessions; re-login re-resolves entitlements. |
| Billing Journey | ↔ shares | Every lifecycle transition has billing implication; billing failures trigger lifecycle transitions. |
| Compliance Journey | ↔ shares | KYC at signup, retention at archive, purge per compliance approval. |
| Support Journey | ↔ intersects | Ops co-pilots every transition; impersonate lateral flows here. |
| Release Rollout | ↔ shares | Tenant impact scoring per release; staged rollout respects tenant tier/vertical. |
| Remote Assistance | ↔ intersects | Impersonation is a special remote-assist lateral. |
| Enrollment (Institute) | → conditional | Institute tenants need Enrollment live for Day-1 tasks. |
| Reservation (Restaurant) | → conditional | Restaurant tenants with Reservations entitled see it in onboarding tour. |

Every other flow reads tenant state; the Tenant Lifecycle is the only flow that **writes** tenant state.

---

## §26. FLOW — The Auth / Session Journey

> **The universal gatekeeper.** Every other flow's first precondition is "operator authenticated." This flow is the mechanism behind that precondition — how identity is claimed, verified, carried across a working session, elevated for sensitive actions, shared between devices, and revoked. It also spans **device identity** — the tenant's fleet of tills, tablets, handhelds, and KDS screens all have their own enrollment lifecycle running in parallel with operator auth.
> **Shape:** Primarily J-shape (tenant-internal with audit ripple to /ops). Supervisor approvals and break-glass laterals add V-shape overlays.
> **Vertical-agnostic:** same spine for cashier, server, nurse, teacher. Vertical-specific session semantics (shift-bound vs day-bound vs term-bound) plug at intersection slots defined in 8.4.
> **Frequency:** extremely high — multiple auth events per operator per day (login, re-auth on timeout, approval re-prompts, shift swaps).

### §26.1 Skeleton

```
[Device enrolled] → [Identity claimed (login)] → [Credentials verified] → [Session issued] → [Session active; sensitive actions trigger step-up re-auth] → [Session ends (logout / timeout / revoked / shift-swap)] → [Audit]
```

Seven nodes. Device enrollment (Node 1) happens once per device at provisioning; operator auth (Nodes 2–7) happens continuously.

**Three identity models unified on the same spine:**
- **Operator identity** — cashier, server, manager, nurse, teacher; PIN-primary, short-lived, device-local
- **Owner identity** — tenant owner; password + MFA, longer-lived, cross-device
- **Ops-staff identity** — Dalxic internal staff acting on a tenant via impersonation lateral; fully separate identity plane that NEVER blends with tenant credentials

**Three session kinds:**
- **Primary session** — continuous working session for an operator after login
- **Step-up session** — short-lived elevated session for sensitive actions (void, discount override, refund approval); piggybacks on primary
- **Supervisor session** — another operator momentarily authenticates into the primary operator's session to approve an action (approval PIN modal)

---

### §26.2 Preconditions

| Precondition | Sourced from | Failure mode |
|---|---|---|
| Tenant active (not hard-suspended) | Tenant Lifecycle | Hard-suspend: login blocked globally; banner "Account suspended" |
| Tenant entitled to module operator is trying to enter | Entitlement engine | Module locked: login succeeds but module's landing page is the upsell/grayed state |
| Device enrolled in tenant fleet | Device registry | Unenrolled: enrollment flow surfaces first; ops may whitelist per tenant policy |
| Device not killed | `/ops/tenants/T/devices` | Kill-switched device: ALL operator logins fail; device-locked banner shown |
| Auth provider healthy | Auth subsystem | Degraded fallback: cached credentials usable for N minutes; new logins blocked |
| Clock within tolerance | Device clock + server | Large drift: writes blocked; authentication can still proceed to surface the error |
| Audit pipeline healthy | `/ops/audit` | Auth events HARD BLOCKED if audit pipeline down (integrity rule; matches Tenant Lifecycle) |
| Identity record exists | Users module | No record → signup / invite flow (not this journey) |
| Identity not locked | Lockout ledger | After N failed attempts, lockout triggers; recovery flow required |

---

### §26.3 Node-by-node with lego connectors

#### NODE 1: Device enrolled

**One-time per device.** Happens when a new till, tablet, handheld, KDS screen, or kitchen printer joins a tenant's fleet.

**UI moments:**
- Manager on `/trade/devices` clicks **"Enroll New Device"** → generates pairing code
- Ops on `/ops/tenants/T/devices` clicks **"Enroll for Tenant"** (white-glove provisioning)
- New device opens app → prompts for pairing code → pairs

```
[Pairing code generated]
     ├── Short-lived (15 min)
     ├── One-time-use
     ├── Scoped to a specific tenant + branch + device-role (till / handheld / KDS / printer / kiosk)
     ▼
[Device app enters code]
     ▼
[Device identity provisioned]
     ├── Device ID allocated (gap-free per-tenant sequence; e.g., `D-00041`)
     ├── Device fingerprint captured (hardware identifiers + OS; stored for tamper-detection)
     ├── Device certificate issued (mTLS; used for all future API calls)
     ├── Device role stamped (till / handheld / KDS / printer / kiosk)
     ├── Branch assignment locked (device lives at one branch unless re-enrolled)
     ▼
[Initial sync]
     ├── Tenant entitlement snapshot cached
     ├── Catalogue / menu snapshot cached
     ├── Customer master cached
     ├── Tax rates cached
     ├── Receipt template cached
     ├── Slot T1 Vertical-starter pack cached (entitled tenants): table map / modifiers / recipes / cohort roster etc. per pack
     ▼
[Heartbeat subscription]
     ├── Device registered for push notifications from server
     ├── Regular heartbeat cadence (e.g., every 30s when awake)
     ▼
[Audit: `device.enrolled` with device ID + branch + role + enroller]
```

**Return to UI:** Device shows "Ready" state; awaits first operator login.

---

#### NODE 2: Identity claimed (login)

**UI moments (varies by identity model):**
- Cashier/server at till: **PIN pad** on device lock screen → enters 4–6 digit PIN
- Owner on web browser: **Email + password + MFA** on `account.dalxic.com`
- Ops staff: separate auth plane at `/ops/auth` — email + password + hardware key (YubiKey or equivalent)
- Mobile manager: biometric unlock (face/fingerprint) after initial password registration
- Kiosk (customer-facing): no operator login; device-only identity

```
[Claim captured]
     ├── Identifier entered (PIN / email / biometric)
     ├── Device context attached (device ID, branch, till)
     ├── Timestamp, IP (for web), geolocation (if permitted)
     ▼
[Identity resolution]
     ├── Identifier → user record
     ├── If no match: generic "invalid credentials" (never disclose whether identity exists)
     ▼
[Pre-verification checks]
     ├── User locked out? → show "Account locked — ask manager OR use recovery" path
     ├── User account suspended by tenant owner? → "Contact your manager"
     ├── User role permits login to this device role? (e.g., cashier cannot log into KDS-only device) → "Wrong device"
     ▼
[Audit: `auth.claim_received` (even before verification — ensures attempts are logged)]
```

**Return to UI:** Credential entry screen OR lockout/role mismatch explanation.

---

#### NODE 3: Credentials verified

**UI moment:** Operator taps "Sign In" / auth completes for biometric / MFA code submitted.

```
[Primary factor verification]
     ├── PIN: hashed compare (bcrypt or equivalent; salted per user)
     ├── Password: same
     ├── Biometric: device-local cryptographic challenge (never leaves device)
     ▼
[Primary factor outcome]
     ├── Success → proceed to secondary (if required)
     ├── Failure → increment failed-attempt counter
     │    → show generic "Invalid credentials"
     │    → attempt counter ≥ threshold (e.g., 5) → trigger lockout
     │        → lockout duration: exponential backoff capped at tenant-policy max (e.g., 30 min)
     │        → manager override available with approval PIN
     ▼
[Secondary factor (MFA) — if required]
     ├── Required for:
     │    ├── Owner logins (always)
     │    ├── Manager role on first-device-of-day (tenant-configurable)
     │    ├── Any role from a new-to-them device
     │    ├── Ops staff (always, with hardware key)
     │    └── Step-up actions above threshold (see Node 5)
     ├── MFA methods (in order of tenant preference):
     │    ├── WhatsApp OTP (Ghana-optimal; high deliverability)
     │    ├── SMS OTP (fallback)
     │    ├── TOTP (Authenticator app; preferred for power users)
     │    ├── Hardware key (ops staff mandatory; tenant optional for owner)
     │    └── Email OTP (fallback)
     ▼
[MFA outcome]
     ├── Success → proceed to session issuance
     ├── Failure → attempt counter increments (separate from primary); lockout applies
     ▼
[Risk score evaluated]
     ├── New device? → flag
     ├── Geographic anomaly? (login from GH then 5min later from elsewhere) → flag
     ├── Unusual hour for this operator? → flag
     ├── Cached risk profile per operator → baseline
     ▼
[Risk-driven action]
     ├── Low risk → session issued normally
     ├── Medium risk → session issued, owner notified async, elevated audit
     ├── High risk → force additional verification (send WhatsApp to owner for approval) OR block with support contact
     ▼
[Audit: `auth.verified` with factors used + risk score]
```

**Return to UI:** Session landing screen — vertical-appropriate (POS home, floor plan, attendance register, etc.).

---

#### NODE 4: Session issued

**UI moment:** Operator is now "in" — home screen appears.

```
[Session token minted]
     ├── Access token: short-lived (e.g., 15 min); signed; carries claims (user, tenant, role, branch, device, session-id)
     ├── Refresh token: longer-lived (tenant-configurable, e.g., 12h for cashier, 30d for owner); stored securely
     ├── Session ID: canonical session identifier for audit joining
     ▼
[Session state persisted]
     ├── Server-side session row: opened_at, operator, device, branch, shift, last_seen_at
     ├── Device-local session cache: token bundle + entitlement snapshot + role snapshot
     ▼
[Entitlement snapshot attached]
     ├── From entitlement engine (Tenant Lifecycle § T6): active modules + slots + caps
     ├── Cached for offline continuity
     ▼
[Shift binding]
     ├── Slot A7 Role-context binder: role-specific session context resolved per entitlement
     │    ├── Till-bound roles → find open shift OR prompt open-shift
     │    ├── Section-bound roles (entitled tenants) → find open section assignment OR prompt assignment
     │    └── Day/term-bound roles (entitled tenants) → find day/term context
     ▼
[Concurrency policy applied]
     ├── "One active session per operator across devices" (strict mode)
     │    → if operator already logged in elsewhere: policy decides
     │       ├── Block new → "Already logged in at [device]"
     │       ├── Swap → old session invalidated, new one takes over (audit both)
     │       └── Mirror → both remain active (rare; supervisor roles only)
     ├── "Multiple sessions allowed" (permissive mode, default for owner/manager)
     │    → no block; all sessions co-exist
     ▼
[Welcome-back UI]
     ├── Last-login timestamp surfaced
     ├── Any unread announcements/alerts
     ├── Vertical home landing
     ▼
[Audit: `session.opened` with all claims]
```

**Return to UI:** Vertical home screen.

---

#### NODE 5: Session active; sensitive actions trigger step-up re-auth

**The session runs while every other flow happens on top of it.** But certain actions require **step-up** — a fresh proof of identity even mid-session.

**Step-up triggers:**

| Action | Step-up required | Reason |
|---|---|---|
| Void above cashier cap | Supervisor PIN | Fraud prevention (Sale Journey) |
| Refund above cashier cap | Supervisor PIN | Fraud prevention (Reversal Journey) |
| Price override | Supervisor PIN | Margin protection |
| Discount above cap | Supervisor PIN | Margin protection |
| Restricted item sale (alcohol, pharmacy) | Age-verified cashier PIN OR override | Compliance |
| Paid-out from cash drawer | Supervisor PIN | Cash integrity |
| Shift close with variance | Supervisor PIN | Day-Close integrity |
| Manual receipt entry | Supervisor PIN | Audit trail |
| PO approval above drafter cap | Approver PIN | Procurement control (Restock Journey) |
| Supplier blocklist override | Manager + ops | Fraud prevention |
| Role change / operator provisioning | Manager PIN + MFA | Identity integrity |
| Tier / add-on change | Owner + MFA | Billing control |
| Settings change (tax, payment, receipt template) | Owner/manager PIN | Drift prevention |
| Data export | Owner PIN + MFA | DPA compliance |
| Cross-branch transfer approval | Manager PIN | Inventory control |
| Break-glass unlock | Ops + tenant owner | Dual-auth for emergency |
| Impersonation (ops) | Ops + dual approval + owner notify | Highest sensitivity |

```
[Sensitive action attempted]
     ▼
[Step-up decision]
     ├── Primary operator already has step-up for this action class? (within step-up TTL) → skip modal
     ├── No step-up → prompt modal
     ▼
[Step-up modal opens]
     ├── Who can authorize this action (role filter)
     ├── If primary operator has role → self re-auth
     ├── If not → supervisor approval flow:
     │    → supervisor enters their PIN on primary operator's device (quick-auth)
     │    → OR approves from their own device (push approval; mobile manager use case)
     ▼
[Step-up token minted]
     ├── Short-lived (e.g., 2 min)
     ├── Scoped to action class (void, discount, refund, etc.)
     ├── Attached to primary session for this action only
     ▼
[Action proceeds]
     ▼
[Audit: `auth.step_up` with approver + action + session + duration]
```

**Return to UI:** Action completes; step-up modal closes; primary session resumes.

---

**Session continuity sub-processes (always running):**

```
[Heartbeat]
     ├── Device pings server every 30s with session ID
     ├── Server updates last_seen_at
     ├── Missing heartbeat > threshold (e.g., 2 min) → session marked "possibly stale"; UI shows "Reconnecting..."
     ▼
[Token refresh]
     ├── Access token near expiry → device exchanges refresh token silently
     ├── Refresh token rotation (each refresh issues a new refresh; old one invalidated)
     │    → if device presents an invalidated refresh token → possible replay → terminate all sessions for that user, require fresh login, audit as possible compromise
     ▼
[Idle timeout]
     ├── No user input for N minutes (e.g., 15 for cashier; 60 for manager) → session goes to "locked"
     ├── Locked state: UI dimmed + PIN prompt to resume; cart/work preserved
     ├── Hard timeout (e.g., 4h cashier, 12h manager) → session terminated; full login required
     ▼
[Entitlement re-check]
     ├── On any tier/add-on/suspend change to tenant → entitlement snapshot invalidated
     ├── Device refetches snapshot; if downgrade removes a module the user is currently in → graceful redirect to upsell landing
     ├── If tenant hard-suspended mid-session → all sessions terminated (matches Tenant Lifecycle T5.8)
     ▼
[Risk re-score]
     ├── Mid-session anomalies (bursty transactions, unusual access pattern) → re-evaluate
     ├── High-risk mid-session → force step-up for next sensitive action
     ▼
[Cross-device events]
     ├── Another device logs in same operator → per concurrency policy, existing session may be swapped
     ├── Owner changes operator's role → active session sees role update on next action (no forced logout unless role removal)
     ▼
[Audit: `session.kept_alive` (sampled, not every heartbeat); `session.refreshed`; `session.locked`]
```

---

#### NODE 6: Session ends

**Four ways a session terminates:**

##### T6.1: Logout (explicit)

```
[User clicks "Log Out" / "End Shift + Log Out" / "Exit"]
     ▼
[Unsaved work check]
     ├── Open cart: prompt save-park / void / force-logout-with-abandonment
     ├── Open order-context tab (slot S14): prompt transfer to another operator / handoff / supervisor override
     ▼
[Session invalidated server-side]
     ├── Access + refresh tokens revoked
     ├── Session row closed
     ▼
[Device-local state cleared]
     ├── Session cache wiped
     ├── Entitlement snapshot retained (tied to device, not session)
     ▼
[Audit: `session.logged_out`]
```

##### T6.2: Timeout

```
[Idle or hard timeout fires]
     ▼
[Session auto-locked (idle) or terminated (hard)]
     ▼
[Device-local state handled like T6.1 but with audit reason tag]
     ▼
[Audit: `session.timeout` (idle or hard)]
```

##### T6.3: Revoked (admin action)

```
[Revocation trigger]
     ├── Owner/manager revokes operator access at /trade/users
     ├── Operator's role changed to unassignable state
     ├── Device kill-switch fires (all sessions on that device die)
     ├── Tenant hard-suspended (all sessions on tenant die)
     ├── Ops fraud investigation triggers platform-wide revoke
     ▼
[Server-side revoke broadcast]
     ├── Active session row marked revoked
     ├── Push notification to device (if online) → immediate logout
     ├── If offline → next API call returns 401; device-local grace handling
     ▼
[Device-local state cleared]
     ▼
[Audit: `session.revoked` with revoker + reason]
```

##### T6.4: Shift swap / handoff

**Universal pattern across verticals.** One operator hands control of a till/section/context to another mid-shift via slot A7 role-context binder.

```
[Outgoing operator clicks "Handoff"]
     ▼
[Incoming operator authenticates]
     ├── Step-up style: incoming enters their PIN
     ├── Two-person count (cash drawer) happens inline — optional per tenant policy
     ▼
[Till / section binding transfers]
     ├── Outgoing operator's session closes (T6.1 path)
     ├── Incoming operator's session opens (Node 4 path)
     ├── Shift attribution splits on audit trail — outgoing sold X GHS, incoming starts from fresh counter
     ├── Slot A7 context transfer (entitled tenants): section/table assignments + in-flight order-contexts carry over with dual attribution
     ▼
[Variance attribution policy]
     ├── If shift close later shows variance: attribution depends on when swap happened
     │    → Transactions up to swap → outgoing
     │    → Transactions after swap → incoming
     │    → Per-operator-variance visible separately
     ▼
[Audit: `session.handoff` with both operators + device + branch]
```

**Return to UI:** Incoming operator's home screen; outgoing operator is logged out.

---

#### NODE 7: Audit

Every auth event — claimed, verified, failed, issued, refreshed, elevated, locked, timed-out, revoked, handed-off — writes to the audit trail. This is the densest audit producer in the platform.

```
[Audit record fields]
     ├── event type (auth.claim / auth.verified / auth.failed / session.opened / session.step_up / session.locked / session.refreshed / session.logged_out / session.timeout / session.revoked / session.handoff)
     ├── user ID (hashed where appropriate; full for ops-side audit)
     ├── tenant ID
     ├── device ID
     ├── branch ID
     ├── factors used (pin / password / biometric / TOTP / WhatsApp OTP / hardware key)
     ├── risk score
     ├── result
     ├── approver chain (step-up only)
     ├── reason tag (revocation only)
     ├── IP, user agent, geolocation (web only)
     └── session ID (to join downstream events on this session)
     ▼
[Audit tier routing]
     ├── Tenant audit (visible at /trade/audit) — tenant-scoped auth events
     ├── Platform audit (/ops/audit) — severity-filtered (failed logins > threshold, step-ups beyond cap, impersonation events, cross-tenant risk signals)
     ├── Security audit (/ops/security/auth) — exhaustive; retention extended; used for forensics
     ▼
[Event emission]
     ├── Analytics: login frequency, MFA adoption, lockout rate, step-up rate
     ├── Fraud signals: abnormal patterns
     ├── Support: failed-login spikes auto-ticket
     └── Compliance: DPA audit-trail completeness
```

---

### §26.4 Intersection slots — where vertical plug-ins plug into the Auth / Session Journey

| # | Slot | Flow location | Default (retail) | Restaurant plug-in | Institute plug-in | Future |
|---|---|---|---|---|---|---|
| A1 | **Session binding** | Node 4 | Cashier → till → shift | Server → section → shift + tables | Teacher → class → term | Nurse → ward → shift |
| A2 | **Idle timeout** | Node 5 | 15 min (cashier); 60 min (manager) | 10 min (server — tables are live); 30 min (host); 60 min (manager) | 30 min (teacher) | Per vertical |
| A3 | **Hard timeout** | Node 5 | 4h (cashier); 12h (manager); 24h (owner) | Shift-bound (ends at shift close) | Day-bound | Shift-bound for clinical |
| A4 | **Step-up cap catalogue** | Node 5 | Retail cap list | Restaurant cap list (comp, void-after-fire, 86 override) | Institute cap list (grade change, fee waiver, withdraw student) | Vertical-specific |
| A5 | **Handoff pattern** | T6.4 | Till handoff (cash count) | Section handoff (tables transferred) + tip envelope separation | Class handoff (attendance in-progress transfer) | Ward handoff, front-desk handoff |
| A6 | **Role catalogue** | Node 3, 4 | Cashier, Manager, Supervisor, Owner | Adds: Server, Bartender, Host, Runner, Expediter, Kitchen, F&B Manager | Adds: Teacher, Principal, Admin, Finance | Nurse, Doctor, Concierge |
| A7 | **MFA sensitivity** | Node 3 | Owner always; manager on new device | Same + F&B manager enforced for comp approvals | Same + Principal enforced for grade changes | Vertical sensitivity |
| A8 | **Approval routing** | Node 5 step-up | Supervisor nearby via PIN modal | Any eligible manager (floor walkie pattern); push-approve from mobile | Principal push-approve | Vertical routing |
| A9 | **Device-role affinity** | Node 1 | Till, handheld, kiosk | Adds: KDS, kitchen printer, bump bar, waiter handheld, reservation tablet | Attendance tablet, admin desk | Ward terminal, concierge desk |
| A10 | **Restricted-action identity** | Node 5 | Age-verified cashier unlocks alcohol/pharmacy | Same + bar-authorised server | Financial-staff-only fee actions | Licensed-clinician-only med actions |
| A11 | **Session-bound context** | Node 4 | Shift + till + branch | Shift + section + tables + cover count | Term + class + subject | Shift + ward + patient assignment |
| A12 | **Audit granularity** | Node 7 | Standard auth events | Same + kitchen-ticket attribution + tip-envelope accountability | Same + grade-change extra-verbose | Clinical extra-verbose |

#### §26.4.A — Slot contracts

A-series slots follow §19.A template. Phase 1 boutique slots with full contracts: **A1 Session binding** (`N`, integrity-critical), **A2 Step-up timeout** (`N`), **A3 Hard timeout** (`HN`, observer emits session-end), **A4 Role catalogue** (`N`, integrity-critical — module failure = fail-secure block), **A7 MFA sensitivity** (`HN`), **A11 Session-bound context** (`N`, integrity-critical — spine uses this for every write attribution), **A12 Audit granularity** (`HN`, integrity rule: audit pipeline down = HARD BLOCK per §26). Remaining A-slots (A5 Handoff, A6 Role catalogue extensions, A8 Approval routing, A9 Device-role affinity, A10 Restricted-action identity) are slot-catalogue-complete with contracts deferred to their owning Phase 2 vertical modules. Integrity rule restated: any A-slot plug-in that violates its contract triggers immediate session invalidation rather than degraded auth.

---

### §26.5 Offline variant

Auth offline is **non-negotiable** — a till with an operator cannot refuse login just because network dropped. But offline auth must not erode integrity.

```
[Network down at login time]
     ▼
[Offline auth mode]
     ├── PIN verification: against locally cached hash (last-synced from server)
     │    → cache age tracked; stale > N days → login blocked (forces online-auth before stale limit)
     ├── Password login: blocked offline (owner/manager must use device's cached operator PIN mode)
     ├── Biometric: fully functional (device-local by design)
     ├── MFA: SMS/WhatsApp/email OTP blocked; TOTP works offline; hardware key works offline
     ├── Failed-attempt counter: maintained locally; syncs to server on reconnect; merges with server counter
     ├── Session issuance: local-signed session token; refresh later validated by server
     │    → if server rejects on reconnect (operator revoked server-side during offline window) → session terminated; any transactions done during that window flagged for review
     ▼
[Step-up offline]
     ├── Supervisor PIN: against cached supervisor PIN hashes
     │    → cap amounts from cached policy
     │    → if supervisor role revoked server-side during offline → step-ups they approved flagged on reconnect
     ├── Emergency supervisor override: physical one-time code issued by owner (printed; stored in safe) → bypasses offline step-up cap; SINGLE USE; audited heavily on reconnect
     ▼
[Network returns]
     ▼
[Auth sync daemon]
     ├── Offline sessions validated server-side
     ├── Failed-attempt counters merged (server-side + local)
     ├── Lockout states reconciled
     ├── Offline step-ups audited with sync delay noted
     ├── Revoked-during-offline sessions flagged + associated transactions queued for manager review
     ├── Entitlement snapshot refreshed; if downgrade happened offline, module usage during offline window flagged
     ▼
[Audit: `offline_auth_session.reconciled`]
```

**Critical rule:** offline auth is allowed but **integrity is enforced at reconnect.** Revocations that happened server-side during a device's offline period are retroactively honored via audit flags — the platform never pretends the offline work didn't happen, but makes the retroactive authority collision inspectable.

---

### §26.6 Master ops laterals

| Lateral | Fires from | Lands on | Effect |
|---|---|---|---|
| **Device kill-switch** | `/ops/tenants/T/devices` | Device's next API call | 403; all sessions on device terminated; banner "Device locked by Dalxic support" |
| **Device re-enrollment force** | `/ops/tenants/T/devices` | Device | Device re-provisioned; device certificate re-issued; acts as theft response |
| **Break-glass unlock** | `/ops/support/ticket/T` | Login-blocked state | Time-boxed bypass of lockout; owner-of-record verify; tenant notified; heavy audit |
| **Impersonation** | `/ops/support/ticket/T` | Tenant session plane | Ops staff acts as owner; dual-approval; tenant owner notified + WhatsApp; sensitive fields masked; dual audit |
| **Force-revoke operator** | `/ops/security` | All sessions for an operator | Used in fraud investigation; platform-wide immediate revoke |
| **Policy update** | `/ops/settings/auth` | Next refresh per tenant | Password policy, MFA requirement, timeout duration propagated platform-wide or per tenant |
| **Security incident broadcast** | `/ops/security` | All active sessions | Forces re-auth on next action; may require additional factor; used during credential-compromise incidents |

---

### §26.7 Failure modes

| Failure | Node | Graceful path |
|---|---|---|
| PIN entered wrong N times | 3 | Lockout with exponential backoff; recovery path (manager override or password recovery) |
| MFA provider down (SMS/WhatsApp) | 3 | Fallback to secondary MFA method; if none available, break-glass lateral option |
| Biometric hardware failure | 3 | Fallback to PIN/password |
| Risk-flagged login | 3 | Force additional factor OR block with support contact |
| Token refresh replay detected | 5 | Terminate all sessions for that user; force fresh login; audit as possible compromise; notify user |
| Idle timeout with open cart | 5 | Lock preserves cart; PIN re-prompt resumes where left off |
| Hard timeout mid-transaction | 5 | Transaction-scoped grace (e.g., finish-current-sale window) OR abort with audit |
| Role change mid-session (revoked permission needed now) | 5 | Graceful redirect: if user is on a feature they just lost, push them to the next-allowed screen with explanation |
| Device kill-switch fires mid-sale | 5 | Cart preserved if possible; device forces re-enrollment; new device can resume the parked cart (if tenant policy) |
| Offline auth cache stale | 8.5 | Block new logins; existing sessions continue until their own refresh expiry; owner notified to reconnect device |
| Offline step-up by revoked supervisor | 8.5 | Transaction posted; flagged on reconnect; manager reviews; may require reversal |
| Shift-swap count mismatch | T6.4 | Block until resolved OR supervisor overrides with audit |
| Concurrency block on logged-in elsewhere | 4 | Per policy: block / swap / mirror; explain clearly |
| Clock drift rejected | 2, 3 | Attempt sync; if persistent, block writes but allow session to surface error |
| Operator exists but locked by owner | 2 | Explicit "Contact your manager" (distinguishes from "doesn't exist" but still privacy-safe) |
| Audit pipeline down | all | HARD BLOCK new auth events; existing sessions continue; integrity rule; surfaces ops-visible incident |
| Device unenrolled during operator session | 5 | Session terminated; cart preserved locally with re-enrollment recovery path |
| Impersonation session leaks action | 8.6 | Every ops action on tenant side carries impersonation badge; tenant can query "Did Dalxic staff log in as me?" at `/trade/audit/impersonation` |
| Tenant hard-suspended during session | 5 | All sessions across all devices immediately terminate; operators see "Account suspended" banner |

---

### §26.8 Downstream ripples — what bubbles up to /ops

```
Auth event
     │
     ├── /ops/audit ──────────── all sensitive events (failed-login spikes, step-up beyond cap, impersonation, break-glass)
     ├── /ops/security/auth ── exhaustive auth telemetry; forensics queryable
     ├── /ops/analytics/security — lockout rate by tenant, MFA adoption, risk-score distribution
     ├── /ops/analytics/fraud-signals — abnormal auth patterns (credential stuffing, anomalous geography, impossible travel)
     ├── /ops/support ─────── auto-tickets: lockout storms, failed-MFA spikes, offline-cache-stale incidents
     ├── /ops/infra/auth ─── auth subsystem health (latency, token rotation errors)
     ├── /ops/tenants ────── suspicious-activity indicators surface here per tenant
     └── /ops/compliance ── DPA auth-trail completeness, retention compliance
```

---

### §26.9 Ops linkage — 4 + N for the Auth / Session Journey

**Mandatory 4:**

| Module | /ops/modules | /ops/tiers | /ops/add-ons | /ops/tenants/T/entitlements |
|---|---|---|---|---|
| Users & Identity | ✔ (foundational) | all tiers | — | ✔ |
| Roles & Access | ✔ | T1+ | ✔ add-on for granular roles | ✔ |
| Device Registry | ✔ (foundational) | all tiers | — | ✔ |
| MFA | ✔ | T2+ mandatory for manager+; T1 optional | — | ✔ |
| Step-Up Approvals | ✔ | all tiers | — | ✔ |
| Hardware-Key Support (ops-side only) | ✔ | ops-internal | — | N/A |

**Conditional N:**

| Conditional screen | Triggered when |
|---|---|
| `/ops/settings/auth` → password + PIN policy | Platform defaults; tenant overrides within bounds |
| `/ops/settings/auth` → MFA policy | Which roles require MFA, which methods allowed |
| `/ops/settings/auth` → timeout policy | Idle + hard timeout defaults |
| `/ops/settings/auth` → lockout policy | Threshold, backoff, recovery path |
| `/ops/settings/auth` → concurrency policy | Block / swap / mirror default |
| `/ops/security/auth` | Exhaustive auth forensics |
| `/ops/security/incidents` | Active credential-compromise / device-theft incidents |
| `/ops/tenants/T/devices` | Per-tenant device fleet |
| `/ops/tenants/T/users` | Per-tenant operator directory |
| `/ops/audit` → auth severity filter | Failed-login spikes, impersonation, break-glass |
| `/ops/analytics/security` | Platform-wide auth health |
| `/ops/analytics/fraud-signals` | Auth-pattern anomalies |
| `/ops/support` → auth-incident tickets | Auto-opened per incident class |
| `/ops/infra/auth` | Auth subsystem health |

---

### §26.10 Interlinks to other flows

The Auth / Session Journey is the **authority root**. Every other flow reads a session; this flow writes it.

| Connected flow | Direction | Merge point |
|---|---|---|
| Sale Journey | → gates | Preconditions include valid session + role permission; step-ups mid-sale piggyback on session |
| Reversal Journey | → gates | Same; reversals have heavier step-up requirements |
| Day-Close Journey | → gates | Close requires session; shift swap = T6.4 handoff; force-close bypass uses ops-lateral auth |
| Restock Journey | → gates | PO approval chain piggybacks on step-up; receiving role enforced |
| Tenant Lifecycle | ↔ shares | Tenant state changes invalidate sessions; impersonation originates here; hard-suspend terminates all sessions; downgrade re-resolves entitlement snapshot cached in session |
| Billing Journey | → gates | Tenant billing actions require owner session + MFA |
| Compliance Journey | → gates | Compliance actions (filing, export) require elevated session |
| Support Journey | ↔ intersects | Impersonation + break-glass + remote-assistance all originate from support but execute through this journey |
| Release Rollout | ↔ correlates | Auth regressions surface here first; auth-subsystem rollouts staged with extra care |
| Remote Assistance | ↔ intersects | Remote-assist co-pilot / takeover actions attached to tenant session via dual-identity overlay |

Every merge point bidirectionally audited.

---

## §27. FLOW — The Billing Journey

> How **the platform gets paid**. Every other flow is about the tenant's money; this one is about ours. It spans: the recurring subscription that keeps the lights on, the metered usage that scales with tenant success (transactions, WhatsApp messages, SMS, storage, branches, operators), the pro-rations when tenants move mid-period, the dunning sequence that precedes suspension, the partner commissions that reward resellers, and the platform-level reconciliation against our own payment providers.
> **Shape:** V-shape (master ops drives billing cycles; tenant UI surfaces consume invoices, make payments; failure ripples back into Tenant Lifecycle suspend arcs).
> **Vertical-agnostic:** same spine for retail tenant, restaurant tenant, institute tenant. Per-vertical metering (covers, students, beds) plugs at intersection slots defined in 9.4.
> **Frequency:** monthly billing runs platform-wide; metered accrual ticks per transaction; failed-payment retries daily; partner commission runs monthly.

### §27.1 Skeleton

```
[Metering accrual (continuous)] → [Billing period boundary fires] → [Invoice draft assembled] → [Invoice issued + delivered] → [Payment attempt] → [Payment outcome: success / retry / fail] → [Post-payment effects: GL, entitlement continuity, partner commission] → [Dunning → suspend interlink (if fails)] → [Period closed]
```

Nine nodes. **The only flow where master ops sits squarely in the happy path** (matches Tenant Lifecycle § 7 — both are master-ops-first by design).

**Three revenue streams unified on the same spine:**
- **Recurring subscription** — monthly/annual fixed tier fee; pro-rated on tier changes
- **Metered usage** — variable per-event fees (per-transaction, per-WhatsApp message, per-SMS, per-GB storage, per-extra-operator, per-extra-branch)
- **One-off charges** — add-on activation fees, hardware purchases through platform, setup fees, bolt-on services

**Three invoice modes:**
- **Standard invoice** — tenant pays platform (the 99% case)
- **Partner-billed invoice** — platform bills the reseller; reseller bills their downstream tenant separately (wholesale model)
- **Enterprise invoice** — manual negotiated terms; ops-driven; custom PDF; NET-30 to NET-90 terms

### §27.2 Preconditions

| Precondition | Sourced from | Failure mode |
|---|---|---|
| Tenant exists + not purged | Tenant Lifecycle | Purged tenants have frozen billing history but no new invoices |
| Tenant state permits billing | Tenant Lifecycle | Archived: final settlement only. Hard-suspend: billing may pause or accrue per reason |
| Tier / add-on / branch / usage-cap state current | Entitlement engine | Stale state → invoice amount wrong; engine staleness HARD blocks billing run |
| Billing provider reachable (for payment execution) | `/ops/settings/payments` | Provider outage: invoices issue fine; payment attempts queue for retry |
| GL accounts configured (platform's own) | Platform COA | Platform revenue accounts missing → HARD block; never issue an invoice without posting path |
| Tax config current (VAT on SaaS in Ghana) | Tax Engine | VAT regulation change propagated via `/ops/compliance` before billing run |
| Currency + FX rates current | FX feed | Foreign-currency tenants: stale FX → use last-known + warning banner on invoice |
| Audit pipeline healthy | `/ops/audit` | HARD block on billing runs if audit pipeline down (integrity rule matches Tenant Lifecycle and Auth) |
| Partner commission rules current | `/ops/partners` | Stale rules → commission run deferred; tenant billing proceeds |

---

### §27.3 Node-by-node with lego connectors

#### NODE 1: Metering accrual (continuous)

Unlike other flows that have a clear "start," metering is **always on**. Every sale, reversal, WhatsApp send, SMS send, storage write increments the relevant meter.

**Feed sources (not exhaustive):**

| Metered event | Source flow | Tick logic |
|---|---|---|
| Sales transactions | Sale Journey Node 5 | +1 per completed sale; unit fee depends on tier/plan |
| Reversals | Reversal Journey Node 7 | Policy: reversals usually DO NOT decrement sales-transaction fee (platform did the work); force-refund via ops may differ |
| WhatsApp messages sent | All flows that send (receipts, reminders, OTP, notifications) | +1 per message; different rates for template vs session messages |
| SMS messages sent | Same | +1 per SGM; Ghana SMS pricing differs per carrier |
| Storage footprint | Daily sweep | GB-month accrual; images, invoices, attachments counted |
| Active operators (peak in period) | Session Journey | Count distinct operators who had ≥1 session in period |
| Active branches | Tenant Lifecycle state | Count branches active on any day in period |
| API calls (for partner integrations) | API gateway | Per-call accrual; first N free, then tiered |
| Kiosk device-hours | Session heartbeat | Unattended kiosks metered by active hours |

```
[Event fires in any flow]
     ▼
[Meter tick dispatched]
     ├── Tenant ID
     ├── Meter ID (sales / whatsapp / sms / storage / operators / branches / api / kiosk)
     ├── Event timestamp
     ├── Quantity
     ├── Idempotency key (prevents double-tick on retry)
     ▼
[Meter aggregation]
     ├── Running tally per tenant per meter per billing period
     ├── Stored as append-only; no deletions (audit integrity)
     ├── Pro-ration scaffolding: per-day buckets allow mid-period math
     ▼
[Cap visibility]
     ├── Tenant nears tier cap → banner on their dashboard "You've used 80% of included transactions"
     ├── Hit soft-cap → continue but overage meter begins
     ├── Hit hard-cap (rare; usually soft) → policy decides: throttle, upgrade-prompt, or just-keep-accruing
     ▼
[Audit: `meter.tick` (sampled; not every event audits individually — aggregated per period)]
```

**Return to UI:** Tenant's `/trade/billing/usage` dashboard updates in near-real-time.

---

#### NODE 2: Billing period boundary fires

**UI moment (master ops side):** Scheduled cron runs (e.g., 02:00 on the 1st of each month for monthly; on anniversary for anniversary-billed tenants).

```
[Period boundary trigger]
     ├── Platform-wide monthly: all monthly-billed tenants
     ├── Anniversary: per-tenant on their signup date-of-month
     ├── Annual: yearly renewal for annually-billed tenants
     ├── Ad-hoc: ops-triggered for one-off charges (add-on activation fee, etc.)
     ▼
[Tenant selection]
     ├── Active tenants in scope
     ├── Suspended tenants per reason rule (non-payment suspends may skip; tenant-requested pauses skip)
     ├── Archived tenants: final settlement only (once, then never)
     ▼
[Meter freeze]
     ├── All meters for this tenant/period snapshot-captured
     ├── Ongoing accrual for the NEXT period begins immediately (no gap)
     ▼
[Pro-ration plan computed]
     ├── Tier changes during period → split: partial-period at old tier + partial at new
     ├── Add-on activations during period → partial-period charge
     ├── Branch additions mid-period → partial
     ├── Operator-count changes → uses daily buckets from metering
     ├── Suspension during period → charges stop at suspend timestamp (per policy)
     ▼
[Entitlement snapshot pinned]
     ├── Today's tier + add-ons locked for invoice math
     ├── Any change in-flight queued for next period
     ▼
[Audit: `billing.period_boundary_fired` with scope]
```

**Return to UI:** Ops dashboard shows billing run in progress; progress bar across tenants.

---

#### NODE 3: Invoice draft assembled

**UI moment:** Each tenant's invoice draft materializes. Visible to ops before issuance for review (sampled; big-ticket invoices manual-reviewed).

```
[Line items built]
     ├── Base subscription line (tier × pro-ration factor)
     ├── Add-on lines (each add-on × pro-ration factor)
     ├── Metered usage lines (each meter × rate; overage-only for included-first-N meters)
     ├── One-off charges accumulated this period (setup fees, manual adjustments)
     ├── Partner discount lines (if tenant is on partner-discounted tier)
     ├── Promotional credits / trial-extension credits / goodwill credits
     ├── Prior-period adjustments (if any reversal of earlier invoice)
     ▼
[Subtotal computed]
     ▼
[Tax application]
     ├── Ghana VAT on SaaS: 15% VAT + 2.5% NHIL + 2.5% GETFund + 1% COVID (same stack as Sale Journey)
     ├── Per-tenant tax exempt status honored (NGOs, specific tax-exempt entities) — proof on file required, audited
     ├── Foreign tenants: place-of-supply rules applied; may be zero-rated if export of service per Ghana rules
     ▼
[Currency handling]
     ├── Invoice currency = tenant's billing currency (GHS default)
     ├── Platform's books in GHS; FX rate at issuance captured
     ├── FX gain/loss at payment settled against platform FX account
     ▼
[Invoice number allocated] ─── gap-free platform-wide sequence (per legal entity)
     ▼
[Due date computed]
     ├── Standard: NET-0 (charge on issue) for auto-pay tenants
     ├── NET-7 / NET-14 / NET-30 for invoice-pay tenants (enterprise, manual)
     ├── Partner: per partner agreement
     ▼
[Draft saved]
     ▼
[Sampling / review]
     ├── Invoices above threshold → human review queue
     ├── Invoices with unusual deltas vs prior month → flagged
     ├── First-invoice-after-tier-change → flagged
     ▼
[Audit: `invoice.drafted`]
```

**Return to UI:** Draft invoice visible to ops; tenant cannot see yet.

---

#### NODE 4: Invoice issued + delivered

**UI moment:** Ops (or auto) approves draft → invoice becomes official document.

```
[Draft → issued]
     ▼
[Immutable invoice artifact created]
     ├── PDF rendered (Dalxic branding; Ghanaian tax compliant footer; TIN; legal entity details)
     ├── Stored permanently; never edited; corrections via credit note
     ▼
[Accrual journal posted on PLATFORM books]
     ├── Dr Accounts Receivable (tenant)
     ├── Cr Subscription Revenue (deferred until service period, but simplified here)
     ├── Cr Usage Revenue
     ├── Cr One-off Revenue
     ├── Cr Output VAT (Ghana revenue authority owed)
     ├── Cr Output NHIL / GETFund / COVID
     ├── Cr Partner Commission Payable (if partner revenue share applies)
     ▼
[Delivery to tenant]
     ├── In-app notification on `/trade/billing`
     ├── Email with PDF attached (primary channel)
     ├── WhatsApp with PDF link (Ghana-optimal; high open rate)
     ├── SMS summary for lower-tier tenants
     ▼
[Delivery receipts tracked]
     ├── Email bounce → retry via secondary contact → flag support
     ├── WhatsApp read receipt captured
     ▼
[Accounts-receivable bucket assigned]
     ├── Feeds platform's own cash-flow forecast
     ├── Aging surfaces on `/ops/billing/ar-aging`
     ▼
[Audit: `invoice.issued` with delivery channels]
```

**Return to UI (tenant side):** New invoice visible on `/trade/billing/invoices`; due amount surfaces on dashboard.

---

#### NODE 5: Payment attempt

**UI moment:** Depends on tenant's payment mode.

**Mode A: Auto-pay (the majority)**
Scheduled attempt fires on due date.

**Mode B: Tenant-initiated**
Tenant clicks **"Pay Now"** on `/trade/billing/invoices/INV`.

**Mode C: Enterprise / partner**
Manual payment via bank transfer; ops reconciles inbound.

```
[Attempt triggered]
     ▼
[Method dispatch]
     ├── MoMo standing order (MTN / Vodafone / AirtelTigo)
     │    → merchant-to-merchant debit; STK push if confirmation required
     ├── Bank standing order
     │    → direct debit file generated; bank batch; settles T+1 or T+2
     ├── Card (stored)
     │    → acquirer API; auth → capture; PCI-DSS tokenized at signup
     ├── Manual bank transfer
     │    → tenant initiates; ops matches inbound transfer to invoice (reconciliation at Node 7)
     ├── Partner bill-through
     │    → debit partner's prepaid balance OR net against partner's commission payable
     ▼
[Provider call]
     ├── Idempotency key attached (invoice-scoped; retry-safe)
     ├── Timeout handling: if provider doesn't respond, mark `pending` not `failed` (avoid double-charge on retry)
     ▼
[Immediate outcome]
     ├── Success → Node 7 post-payment
     ├── Failure (decline) → Node 6 retry cadence
     ├── Pending (MoMo slow settlement) → status pending; check-in webhook expected
     ▼
[Audit: `payment.attempted` with method + provider-ref + outcome]
```

**Return to UI:** Payment result modal (tenant-initiated) or ops dashboard tick (auto-pay).

---

#### NODE 6: Payment outcome — retry cadence (if failed)

**UI moment:** Failed payment triggers dunning. Tenant sees warning; ops sees aging ticker.

**Dunning cadence (tenant-configurable at `/ops/settings/dunning`, but sensible Ghana defaults):**

```
[T+0 (due date, first attempt failed)]
     ├── Tenant notified: email + WhatsApp — "Your payment didn't go through"
     ├── Grace clock starts (default 3 days)
     ▼
[T+3]
     ├── Retry attempt #2
     ├── If fails: reminder #2 — "Payment overdue — 4 days to resolve"
     ▼
[T+7]
     ├── Retry attempt #3
     ├── If fails: escalation — "Your account will be suspended in 7 days"
     ├── Tenant offered alternate method (manual transfer, alternate card, switch to MoMo)
     ▼
[T+14]
     ├── Retry attempt #4
     ├── If fails: transition to soft-suspend via Tenant Lifecycle § T5.7
     ├── Tenant has 14 more days of soft-suspend recovery
     ▼
[T+28]
     ├── Still unpaid → soft-suspend → hard-suspend via Tenant Lifecycle § T5.8
     ├── Ops notified; support outreach initiated
     ▼
[T+60]
     ├── Hard-suspend retention clock ticking
     ├── Ops last-attempt contact
     ▼
[T+90]
     ├── Route to write-off OR collections (enterprise only)
     ├── Archive tenant via Tenant Lifecycle § 6
     ▼
[Audit: `payment.dunning_*` at each stage]
```

**Mid-cadence recovery:** Tenant settles any time → immediate reactivation if suspended; retry loop terminates; invoice marked paid.

**Ops laterals during dunning:**
- Grace extension (ops can push T+14 out by N days manually)
- Hardship program enrollment (waives late fees, extends terms)
- Voluntary hold (tenant requests pause before suspend)

---

#### NODE 7: Post-payment effects

**UI moment:** Payment clears. Happens async (MoMo/bank) or immediate (card).

```
[Payment confirmed]
     ▼
[Provider reconciliation]
     ├── Provider's settlement report cross-checked against expected receipts
     ├── Match → reconciled
     ├── Mismatch → investigation queue on `/ops/billing/reconciliation`
     │    → under-settlement → provider dispute
     │    → over-settlement → platform credit to provider
     ▼
[Platform GL posted]
     ├── Dr Cash / MoMo Clearing / Card Clearing (Platform's own bank/MoMo/card account)
     ├── Cr Accounts Receivable (tenant; zeroed or reduced if partial)
     ├── Dr FX Gain/Loss (if FX tenant and rate moved between issuance and payment)
     ▼
[Invoice state transition]
     ├── Full payment → paid
     ├── Partial payment → partially_paid; remaining balance still in AR
     ├── Over-payment → credit note issued for surplus; tenant can apply to next invoice or request refund
     ▼
[Entitlement continuity confirmed]
     ├── Tenant stays in `active` state (or transitions back from soft-suspend)
     ├── Session re-auth NOT forced (payment success is non-disruptive)
     ▼
[Partner commission accrual]
     ├── If tenant is partner-referred → partner commission calculated
     ├── Commission rate per partner agreement (e.g., 20% of subscription revenue for 12 months)
     ├── Commission posted: Dr Partner Commission Expense; Cr Partner Commission Payable
     ├── Surfaces on /ops/partners/P/commissions; payout batch runs monthly
     ▼
[Receipt generated]
     ├── Tenant receives receipt (email + in-app); serves as proof of payment
     ├── Stored under invoice lineage
     ▼
[Audit: `payment.settled` with full amount + method + provider-ref]
```

**Return to UI:** Tenant's billing page shows invoice paid; receipts downloadable.

---

#### NODE 8: Dunning → suspend interlink

Captured in Node 6 cadence. When the cadence ends without payment, control transfers to **Tenant Lifecycle § T5.7 (soft-suspend)** or **§ T5.8 (hard-suspend)**. No new logic here — this is a pointer to the lifecycle's state transitions.

```
[Dunning cadence exhausts (T+14)]
     ▼
[Tenant Lifecycle T5.7 invoked]
     ├── Reason: "payment-failure"
     ├── Grace: 14 more days; retry still possible; feature access frozen
     ▼
[If unresolved at T+28]
     ▼
[Tenant Lifecycle T5.8 invoked]
     ├── Reason: "extended-nonpayment"
     ├── All sessions terminated (Auth Journey § T6.3 revoke cascade)
     ▼
[If unresolved at T+60/90]
     ▼
[Tenant Lifecycle § 6 archive invoked]
     ├── Reason: "nonpayment-archival"
     ▼
[Audit: `billing.suspend_cascaded` and `billing.archive_cascaded`]
```

---

#### NODE 9: Period closed

**UI moment:** Billing run complete; ops dashboard shows outcome.

```
[Period lock]
     ├── All tenants' invoices for this period are issued, settled, or dunning-in-flight
     ├── Period marked closed on platform books
     ├── No more retroactive invoicing for this period (corrections go to next period as adjustments)
     ▼
[Revenue recognition tick]
     ├── Subscription revenue deferred-to-earned: monthly proportion recognized
     ├── Usage revenue: fully recognized in period
     ├── One-off: recognized when delivered
     ▼
[Partner payout scheduling]
     ├── Commission payable bucketed by partner
     ├── Payout batch scheduled per partner agreement (typically monthly, NET-15)
     ▼
[Tax liability crystallized]
     ├── Output VAT + levies payable to Ghana Revenue Authority for the period
     ├── Feeds Compliance Journey (next flow) for E-VAT and periodic filings
     ▼
[Financial reporting ticks]
     ├── MRR / ARR / churn / expansion / net-revenue-retention metrics computed
     ├── Platform P&L snapshot updated
     ├── Investor dashboard refreshed
     ▼
[Audit: `billing.period_closed`]
```

**Return to UI:** Ops billing dashboard shows period-closed state; next period's accrual already ticking.

---

### §27.4 Intersection slots — where vertical plug-ins plug into the Billing Journey

| # | Slot | Flow location | Default (retail) | Restaurant plug-in | Institute plug-in | Future |
|---|---|---|---|---|---|---|
| B1 | **Metered units** | Node 1 | Sales transactions | Adds: covers, kitchen tickets, bar-tab hours | Students, terms, reports | Room-nights, provider-hours, patient-days |
| B2 | **Included-in-tier allotments** | Node 3 | N transactions / M WhatsApp | Adds: N covers / M kitchen tickets | N students / M attendance events | Vertical allotments |
| B3 | **Overage rates** | Node 3 | Per-transaction overage | Per-cover, per-KDS-ticket overage | Per-student overage | Vertical overage |
| B4 | **Add-on catalogue** | Node 3 | Loyalty, multi-branch, ecommerce | Reservations, KDS, bar-tabs, QR-order | Fees module, parent portal, reports | Hospitality add-ons |
| B5 | **Setup fee schedule** | Node 3 | Generally waived | Kitchen hardware setup fee | Enrollment migration fee | Room-mapping fee |
| B6 | **Pro-ration granularity** | Node 2 | Daily | Daily | Daily; term-based for annual tiers | Vertical-appropriate |
| B7 | **Tax treatment** | Node 3 | Ghana VAT stack | Same | Same; some NGO tenants zero-rated | Tourism levy considerations |
| B8 | **Invoice template** | Node 4 | Retail standard | Restaurant-themed (optional) | Institute-themed | Vertical-themed |
| B9 | **Dunning cadence** | Node 6 | Default Ghana cadence | Same | Longer for schools (funds arrive with terms) | Vertical-appropriate |
| B10 | **Partner commission schema** | Node 7 | Standard | Same | Higher partner commission for ed-tech channel partners (non-standard) | Per-vertical partner programs |
| B11 | **Hardware pass-through** | Node 3 | KBC thermal printer, scanner | KDS screens, kitchen thermal printer, bump bar | Attendance tablets | Room terminals |
| B12 | **Enterprise billing template** | Node 3, 4 | Standard enterprise PDF | Same | Same | Same |

#### §27.4.A — Slot contracts

B-series slots follow §19.A template. Phase 1 boutique slots with full contracts: **B1 Metered units** (`N`, integrity-critical — retroactive-sync policy from §27: offline events land in next period, never reopen closed period), **B2 Included-in-tier allotments** (`N`), **B3 Overage rates** (`N`), **B6 Pro-ration granularity**, **B7 Tax treatment** (`HN`, observer to Compliance), **B9 Dunning cadence** (`N`, default Ghana cadence T+0/+3/+7/+14/+28/+60/+90 — suspend hand-off to Tenant Lifecycle T5.7). Remaining B-slots (B4 Add-on catalogue, B5 Setup fee, B8 Invoice template, B10 Partner commission, B11 Hardware pass-through, B12 Enterprise template) are slot-catalogue-complete with contracts deferred to their owning Phase 2 module. Integrity rule restated: Billing runs observe audit-pipeline-down HARD BLOCK (matches Auth/Tenant-Lifecycle integrity rule).

---

### §27.5 Offline variant

Billing is **predominantly online** — master ops is where it runs. But metered events happen offline constantly. Offline variant is really a **metering sync** variant:

```
[Device offline, events accumulating]
     ├── Meters ticked to LOCAL append-only log
     ├── Idempotency keys generated locally
     ▼
[Network returns]
     ▼
[Meter sync daemon]
     ├── Offline meter events uploaded in order
     ├── Server dedupes via idempotency keys
     ├── Aggregated into running period tally
     ├── If sync happens AFTER period boundary → events attributed to correct period per their timestamp (not sync time)
     ▼
[Retroactive metering rule]
     ├── If offline events land for a CLOSED period → queue into "retroactive-adjustment" bucket
     ├── Appears as a line on NEXT period's invoice (not reopening closed period)
     ├── Material retroactive adjustments flagged to ops for review
     ▼
[Audit: `meter.retroactive_sync`]
```

**Billing runs themselves** never run offline — they're a master-ops cron.

---

### §27.6 Master ops laterals

| Lateral | Fires from | Lands on | Effect |
|---|---|---|---|
| **Manual credit** | `/ops/billing/invoice/X` | Specific invoice | Goodwill credit, incident apology, dispute settlement; audited with reason + approver |
| **Force-refund** | `/ops/billing` | Payment already settled | Tenant credit processed; platform P&L hit; supports dispute resolution |
| **Dunning grace extension** | `/ops/support/ticket/T` | Active dunning tenant | Delays next escalation stage; audited |
| **Hardship program** | `/ops/billing/hardship` | Enrolled tenant | Waives late fees, extends terms, may discount tier temporarily |
| **Manual invoice adjustment** | `/ops/billing/invoice/X` | Invoice pre-issue or via credit note post-issue | One-off corrections; full audit; matches invoice-corrections-are-credit-notes rule |
| **Force-bill** | `/ops/billing` | Tenant whose period didn't auto-bill | Runs billing for a specific tenant out-of-cycle (edge cases) |
| **Partner commission override** | `/ops/partners/P/commissions` | Partner accrual | Special deal adjustments; dual-approval |
| **Write-off** | `/ops/billing/write-offs` | Uncollectable AR | Moves to bad-debt expense; heavy audit |
| **Rate change propagation** | `/ops/settings/pricing` | Next period boundary | Platform-wide pricing change; tenants grandfathered or migrated per rule; notifications sent ahead |

---

### §27.7 Failure modes

| Failure | Node | Graceful path |
|---|---|---|
| Meter double-tick (duplicate event) | 1 | Idempotency key dedupes; no user impact |
| Meter missed tick (event fired but didn't reach meter) | 1 | Reconciliation at period boundary catches via cross-flow audit; retro-meter runs |
| Pro-ration math edge case (same-day tier change) | 2 | Sensible default: charge at old tier for day-of, new tier from next day; tenant-visible explanation |
| Entitlement snapshot stale | 2 | HARD block billing run for affected tenants; ops investigates |
| Invoice draft fails to assemble | 3 | Specific tenant skipped; manual-review queue; ops investigates; never partial-bill |
| Tax config missing | 3 | HARD block for affected tenants; ops fixes before re-run |
| FX rate unavailable | 3 | Use last-known rate + warning on invoice; ops reviews |
| Invoice delivery bounces (bad email, bad phone) | 4 | Retry via secondary contact; if all fail, flag to ops + surface in-app only |
| PDF render failure | 4 | Retry; if persistent, surface on `/ops/billing` without PDF but with all line items |
| Payment provider timeout | 5 | Mark pending not failed; recheck webhook; do not re-attempt until definitive outcome |
| Payment declined | 5 | Enter dunning cadence (Node 6) |
| Payment succeeded but webhook never fired | 5, 7 | Provider reconciliation at Node 7 catches; invoice may sit "unpaid" temporarily; ops corrects |
| Under-settlement (provider sent less than expected) | 7 | Investigation queue; provider dispute; platform absorbs if unresolvable |
| Over-settlement (provider sent more) | 7 | Credit provider; never pocket; audit |
| Partial payment | 7 | Invoice partially_paid; AR reduced; dunning continues for remainder |
| Over-payment | 7 | Credit note issued; applicable to next invoice OR refundable per tenant preference |
| Duplicate charge (rare, provider issue) | 7 | Auto-credit note; tenant notified; provider dispute opened |
| Refund request post-settlement | 7, 9.6 | Force-refund lateral; dual-approval; P&L hit; audit |
| Tenant disputes invoice | 6, 9.6 | Support ticket; hold dunning; manual review |
| Tenant purged while invoice outstanding | 9 | Write-off + legal dispute per amount threshold |
| Partner commission error (bad rate data) | 7 | Commission accrual held; partner notified of delay; corrected |
| Period-close run crashes mid-way | 9 | Resume from checkpoint; never double-close a tenant's period |
| Platform legal-entity restructure | 9 | Invoices from old entity remain; new invoices from new entity; hard audit trail of cutover |
| Audit pipeline down at billing time | any | HARD BLOCK the billing run; do NOT silently proceed |
| VAT regulation change mid-period | 9.6 | Ops propagates via `/ops/compliance`; invoices for affected period regenerated if material; credit-note-the-old-issue-new pattern |

---

### §27.8 Downstream ripples — what bubbles up

Billing is a **master-ops-primary** flow, so "ripples up" means ripples to the platform's own reporting, finance, and executive dashboards:

```
Billing event
     │
     ├── /ops/billing ────────────── primary surface (AR aging, invoices, dunning, reconciliation, write-offs, hardship)
     ├── /ops/billing/reconciliation — provider settlement vs platform expectation
     ├── /ops/billing/ar-aging ─── aging buckets across tenants
     ├── /ops/analytics/revenue ── MRR, ARR, churn, expansion, NRR
     ├── /ops/analytics/cohorts ── billing cohorts by signup month, tier, vertical, channel
     ├── /ops/analytics/fraud-signals — anomalous payment patterns, chargeback spikes, hardship abuse
     ├── /ops/partners/P/commissions — accruals + payouts
     ├── /ops/compliance ──────── VAT / NHIL / GETFund / COVID output liabilities; tax-exempt audit trail
     ├── /ops/audit ───────────── high-severity billing events (write-offs, force-refunds, manual credits, rate changes)
     ├── /ops/support ───────── auto-tickets from dunning failures, disputes, delivery bounces
     ├── /ops/tenants ───────── payment-health indicator per tenant; at-risk flagging
     ├── /ops/legal ───────── write-offs, collections, disputes requiring legal
     └── /ops/infra/billing ── provider health (MoMo, bank, card acquirer uptime)
```

**Tenant-side ripples** (smaller; billing is tenant-visible mostly via `/trade/billing`):
- `/trade/billing` — invoices, receipts, payment methods, usage, dunning alerts
- Dashboard notification on invoice issued / paid / overdue
- WhatsApp + email per stage

---

### §27.9 Ops linkage — 4 + N for the Billing Journey

**Mandatory 4:**

| Module | /ops/modules | /ops/tiers | /ops/add-ons | /ops/tenants/T/entitlements |
|---|---|---|---|---|
| Billing Engine | foundational (master-ops) | defined here | — | applied per tenant |
| Metering | foundational (master-ops) | defined here | — | applied per tenant |
| Invoicing | foundational (master-ops) | defined here | — | applied per tenant |
| Payment Providers (platform-side) | foundational (master-ops) | — | — | configured per tenant |
| AR / Collections | foundational (master-ops) | — | — | tracked per tenant |
| Partner Commissions | foundational (master-ops) | — | — | per partner agreement |

**Conditional N:**

| Conditional screen | Triggered when |
|---|---|
| `/ops/settings/pricing` | Tier + add-on + overage rate definition |
| `/ops/settings/dunning` | Dunning cadence defaults + tenant overrides |
| `/ops/settings/payments` | Platform-side provider configuration (the providers that BILL tenants) |
| `/ops/settings/tax` | Platform's own tax config (Ghana VAT on SaaS) |
| `/ops/billing` | Master billing surface |
| `/ops/billing/invoices` | All invoices across tenants |
| `/ops/billing/ar-aging` | Aging buckets |
| `/ops/billing/reconciliation` | Provider settlement reconciliation |
| `/ops/billing/write-offs` | Write-off register |
| `/ops/billing/hardship` | Hardship program enrollments |
| `/ops/billing/metering` | Meter tally across tenants |
| `/ops/billing/credits` | Credit notes issued |
| `/ops/partners/P/commissions` | Partner commission ledger |
| `/ops/partners/payouts` | Partner payout batches |
| `/ops/compliance` → platform VAT | Output VAT due to GRA |
| `/ops/audit` → billing severity filter | Write-offs, force-refunds, credits, rate changes |
| `/ops/analytics/revenue` | Platform revenue KPIs |
| `/ops/analytics/fraud-signals` | Payment anomalies |
| `/ops/support` → billing tickets | Disputes, dunning escalations |
| `/ops/legal` → collections | Hard write-off cases |
| `/ops/infra/billing` | Provider health for billing-side payments |
| `/ops/tenants/T/billing` | Per-tenant billing history surface |

---

### §27.10 Interlinks to other flows

| Connected flow | Direction | Merge point |
|---|---|---|
| Sale Journey | ← meter source | Every paid sale ticks the sales-transaction meter (Node 1) |
| Reversal Journey | ← meter source | Reversals fed per policy (usually don't decrement) |
| Day-Close Journey | ← aggregate | Daily totals feed platform billing analytics |
| Restock Journey | ← meter source | Inventory-transaction meter for metered plans |
| Tenant Lifecycle | ↔ tightly coupled | Every lifecycle transition has billing implication; dunning escalation hands control to lifecycle suspend arcs; lifecycle tier changes trigger pro-ration |
| Auth / Session | → gates | Tenant billing UI requires owner + MFA; ops billing actions require ops-auth |
| Compliance Journey | → feeds | Output VAT from issued invoices + SaaS tax filings |
| Support Journey | ↔ shares | Billing disputes, hardship enrollment, grace extensions all routed through support |
| Remote Assistance | ↔ intersects | Ops can co-pilot tenant through payment method setup, dispute resolution |
| Release Rollout | ↔ correlates | Pricing changes rolled out via release system; revenue impact monitored |

Every merge point bidirectionally audited.

---

## §28. FLOW — The Compliance / Filing Journey

> **How tenants stay legal.** Ghana's regulatory stack — GRA for tax, SSNIT for social security, Labour Department for PAYE, sector-specific bodies (FDA for pharma, Ghana Tourism Authority, NAFCO, Bank of Ghana for financial compliance) — all expect paperwork on schedules. This journey is how Dalxic generates, submits, tracks, and proves those filings. For international tenants (future), this spine localizes.
> **Shape:** V-shape (master ops owns rate tables and filing schedules; tenant data fires the actual filings; rejections ripple back up).
> **Vertical-agnostic:** VAT / NHIL / GETFund / COVID / SSNIT / PAYE core is identical across retail and restaurant; sector-specific filings (alcohol excise, FDA pharmacy, tourism levy) plug at intersection slots in 10.4.
> **Frequency:** real-time (E-VAT per receipt), daily (E-VAT summary, SSNIT/PAYE accrual), monthly (VAT return, SSNIT, PAYE, NHIL), quarterly (income tax provisional), annually (corporate tax, audited financials).

### §28.1 Skeleton

```
[Event creates filing obligation] → [Obligation accrues] → [Filing window opens] → [Filing compiled] → [Filing reviewed (optional)] → [Filing submitted to authority] → [Authority acknowledges / accepts / rejects] → [Retry / correction / credit note if needed] → [Payment to authority] → [Evidence archived] → [Ripples]
```

Eleven nodes. Unlike transactional flows, compliance is **time-driven first, event-driven second.** The regulatory calendar dictates most of the schedule; tenant activity populates content.

**Five concurrent compliance tracks** running in parallel per tenant:
- **Track A — E-VAT (real-time + daily summary)** — per-receipt to GRA E-VAT endpoint; daily summary at day-close
- **Track B — VAT return (monthly)** — aggregated output VAT − input VAT = remittance
- **Track C — SSNIT (monthly)** — employer 13% + employee 5.5% of gross payroll
- **Track D — PAYE (monthly)** — income tax on employee earnings
- **Track E — Annual + quarterly** — provisional corporate tax, year-end financials
- **Track F (sector-specific)** — alcohol excise, FDA pharmacy, tourism levy, bank reporting, etc. — activated by entitlement

---

### §28.2 Preconditions

| Precondition | Sourced from | Failure mode |
|---|---|---|
| Tenant active (or archived with legal hold) | Tenant Lifecycle | Suspended tenants still file (legal obligation); ops-initiated if tenant unreachable |
| Tenant has TIN registered | Tenant profile | Missing: filings blocked; prompts tenant to upload registration; partial filings possible with draft status |
| Regulatory rate tables current | `/ops/compliance/tax-rates` | Stale rates → HARD block filing; platform update propagates ahead of deadline |
| Authority endpoint reachable | Integration layer | GRA / SSNIT endpoint down: filing queued; surfaced as pending; SLA clock awaits authority recovery |
| GL closed for period | Day-Close + accounting period lock | Open period: filing uses best-known numbers but flagged "preliminary" |
| Audit pipeline healthy | `/ops/audit` | HARD block (integrity rule, same as Billing/Auth/Lifecycle) |
| Filing signatory configured | Tenant profile | Tenants with sole owner: implicit; companies: designated officer required for sign-off |
| Payment method for authority available | Platform + tenant payment config | Filing submitted without payment → tenant liable separately; platform facilitates but never pays as default |

---

### §28.3 Node-by-node with lego connectors

#### NODE 1: Event creates filing obligation

**Event sources (not exhaustive):**

| Event | Source flow | Obligation created |
|---|---|---|
| Sale with VAT | Sale Journey Node 4 | E-VAT transmission (immediate) + monthly output VAT accrual |
| Reversal | Reversal Journey Node 6 | E-VAT reversal transmission + monthly output VAT reversal |
| Alcohol sale | Sale Journey (excise plug-in) | Monthly excise filing |
| Payroll run | Payroll module | Monthly SSNIT accrual + monthly PAYE accrual |
| Commission payout | Payroll | SSNIT + PAYE apply |
| Supplier invoice with VAT | Restock Journey Node 8 | Input VAT recoverable (offsets output at filing) |
| Withholding tax event | Restock Node 9 / Payroll | Monthly WHT remittance accrual |
| Corporate year-end | Annual cron | Year-end financial filings |
| FDA inspectable event (pharma) | Pharmacy module | Sector-specific log |
| Tourism transaction (if entitled) | Sale (tourism plug-in) | Tourism levy accrual |

```
[Source event fires]
     ▼
[Obligation ticker]
     ├── Obligation type (E-VAT / VAT-return / SSNIT / PAYE / WHT / excise / sector)
     ├── Tenant ID
     ├── Period (day / month / quarter / year)
     ├── Amount accrued (or placeholder pending aggregation)
     ├── Due date (computed from period end + statutory grace)
     ▼
[Obligation registry updates]
     ├── Append-only log; never edited
     ├── Amendments land as new rows referencing originals
     ▼
[Audit: `compliance.obligation_accrued`]
```

**Return to UI:** Tenant's `/trade/compliance` dashboard shows running obligation picture.

---

#### NODE 2: Obligation accrues

**Continuous sub-process.** Mirrors Billing Journey Node 1 in pattern but for regulatory buckets.

```
[Running aggregation per tenant per obligation]
     ├── Output VAT, NHIL, GETFund, COVID — per sale/reversal
     ├── Input VAT — per eligible purchase
     ├── SSNIT — per payroll cycle (employer + employee portions separate)
     ├── PAYE — per payroll cycle
     ├── WHT — per qualifying payment
     ├── Excise — per restricted-category sale
     ▼
[Cap / threshold tracking]
     ├── Tenant VAT threshold status: registered vs exempt (below turnover threshold)
     ├── If tenant crosses registration threshold mid-year → alert; registration flow
     ▼
[Pre-deadline reminders]
     ├── T-14 days: first reminder via dashboard banner
     ├── T-7 days: email + WhatsApp
     ├── T-3 days: urgent reminder
     ├── T-0 (due date): final notice; after this, late penalty accrual begins
     ▼
[Late-penalty accrual (if past due)]
     ├── Ghana GRA penalties: fixed fine + interest on unpaid
     ├── SSNIT: 3% per month of unpaid contribution
     ├── Surfaced as separate obligation row; visible to tenant
     ▼
[Audit: `compliance.reminder_sent` / `compliance.overdue`]
```

**Return to UI:** Dashboard banner surfaces upcoming filing deadlines with countdown; overdue items highlighted red.

---

#### NODE 3: Filing window opens

**UI moment:** Period ends (e.g., last day of month). Filing workspace becomes actionable.

```
[Period boundary fires]
     ├── Monthly: last day of month → VAT return / SSNIT / PAYE windows open
     ├── Quarterly: Mar 31 / Jun 30 / Sep 30 / Dec 31 → provisional tax
     ├── Annually: financial year end → corporate tax
     ▼
[Period freeze for compliance]
     ├── All obligations for this period captured
     ├── GL must be closed (or at least current-period-locked) before final filing
     ├── If GL not yet closed: "preliminary" mode; can draft but not submit
     ▼
[Filing workspace activated]
     ├── Per-track (VAT / SSNIT / PAYE / etc.) tile surfaces with "Prepare filing" CTA
     ├── Due date countdown visible
     ├── Auto-populated numbers from period data
     ▼
[Audit: `compliance.window_opened`]
```

**Return to UI:** `/trade/compliance` shows all open filing windows with status (draft / ready / submitted / accepted).

---

#### NODE 4: Filing compiled

**UI moment:** Tenant (or ops on their behalf) opens a specific filing track and reviews.

```
[Filing assembly]
     ├── Header (tenant TIN, period, signatory)
     ├── Line items auto-populated:
     │    ├── VAT return: output VAT aggregated from sales; input VAT from eligible purchases; net payable/refundable
     │    ├── SSNIT: gross payroll × rates; employer + employee portions
     │    ├── PAYE: per-employee tax computed on earnings per GRA PAYE table
     │    ├── WHT: supplier payments × applicable rate (per supplier class)
     │    ├── Excise: restricted-category units × rate
     │    └── Sector-specific: per sector rules
     ▼
[Discrepancy checks]
     ├── Cross-reference VAT return against E-VAT daily transmissions
     │    → missing transmissions flagged; tenant must clear before filing
     ├── Cross-reference SSNIT against payroll records
     │    → unenrolled employees flagged
     ├── Cross-reference PAYE against employee count + salary bands
     ├── Foreign-currency items converted at month-end rate (or rolling rate per policy)
     ▼
[Adjustments + supporting docs]
     ├── Optional adjustment lines (prior-period corrections, carry-forward credits)
     ├── Supporting documents uploaded (receipts, WHT certificates, contracts)
     ▼
[Net position computed]
     ├── VAT: output − input = payable (or refundable credit)
     ├── SSNIT: total contribution
     ├── PAYE: total withheld
     ├── Refund cases: credit carried forward OR refund request (rare; GRA slow)
     ▼
[Draft saved]
     ▼
[Audit: `filing.compiled` with figures + supporting docs list]
```

**Return to UI:** Filing preview with line items, net position, and "Review before submit" button.

---

#### NODE 5: Filing reviewed (optional)

```
[Review gate]
     ├── Tenant policy: require manager OR accountant sign-off before submit? (default: yes for VAT return and above)
     ├── If required: notification to signatory; approval or annotations
     ▼
[External accountant review (optional)]
     ├── Tenant can invite accountant as read-only viewer on `/trade/compliance`
     ├── Accountant annotates; tenant adjusts
     ▼
[Final sign-off]
     ├── Signatory PIN + MFA (per Auth Journey § 8.5 step-up)
     ├── Declaration: "I certify the figures are accurate"
     ▼
[Audit: `filing.signed_off` with signatory]
```

**Return to UI:** "Ready to submit" state.

---

#### NODE 6: Filing submitted to authority

**UI moment:** Tenant clicks **"Submit to GRA/SSNIT/etc."**

```
[Submission packaging]
     ├── Format per authority spec:
     │    ├── GRA E-VAT: real-time JSON per receipt (already sent; Node 1 of this flow); daily + monthly summaries in GRA's format
     │    ├── GRA VAT return: official XML/PDF per GRA portal spec
     │    ├── SSNIT: SSNIT portal format (CSV/XML)
     │    ├── PAYE: GRA portal
     │    ├── WHT: WHT certificate XML + certificate generation for supplier
     │    └── Sector: per sector spec
     ▼
[Idempotency key] ── prevents double-submit on retry
     ▼
[Transmission]
     ├── Primary channel: authority API integration
     ├── Fallback: authority portal upload (manual; ops-assisted)
     ├── Last resort: printed/paper submission (very rare; ops-driven)
     ▼
[Receipt expected]
     ├── Authority ack (immediate or delayed)
     ├── Acceptance or rejection response
     ▼
[Audit: `filing.submitted` with channel + idempotency key]
```

**Return to UI:** "Submitted — awaiting confirmation" state with spinner; not finalized until Node 7.

---

#### NODE 7: Authority acknowledges / accepts / rejects

**Async, sometimes slow.** GRA responses can be instant (API) or days later (manual review).

```
[Authority response received]
     ├── ACK only → receipt of submission; pending review
     ├── ACCEPTED → filing official; move to payment (Node 9)
     ├── REJECTED → reason provided; move to correction (Node 8)
     ├── QUERIED → additional info needed; tenant responds via portal or correspondence
     ▼
[State transitions]
     ├── submitted → accepted → paid (green path)
     ├── submitted → rejected → corrected → resubmitted → accepted (retry path)
     ├── submitted → queried → answered → accepted (dialog path)
     ▼
[SLA tracking]
     ├── Authority SLA (e.g., GRA 30 days for VAT return review)
     ├── SLA breach → ops escalation support available
     ▼
[Audit: `filing.authority_response` with outcome + reason]
```

**Return to UI:** Tenant's compliance dashboard reflects state transition; next steps surfaced.

---

#### NODE 8: Retry / correction / credit note

**Triggered by rejection or queried state.**

```
[Correction workspace]
     ├── Authority's rejection reason parsed (where structured)
     ├── Original submission shown with flagged issues
     ├── Amendable fields highlighted
     ▼
[Amended filing compiled]
     ├── Follows same pattern as Node 4 but with correction context
     ├── References original submission ID
     ▼
[Re-signed + resubmitted]
     ├── Path back through Nodes 5–7
     ▼
[If tenant believes authority is wrong]
     ├── Dispute flow (appeal)
     ├── Ops-assisted: `/ops/compliance/disputes` provides tracking
     ├── Legal escalation path for high-value disputes
     ▼
[Audit: `filing.corrected` with reason + diff]
```

**Return to UI:** Corrected filing in state "resubmitted — awaiting confirmation."

---

#### NODE 9: Payment to authority

**Only for payable filings (VAT-payable, SSNIT, PAYE, etc.). Refund filings skip this node.**

```
[Payment preparation]
     ├── Amount = net payable from accepted filing
     ├── Authority bank account / MoMo details fetched from platform config
     ├── Payment reference = filing ID + tenant TIN (required by GRA for reconciliation)
     ▼
[Payment channel]
     ├── Direct bank transfer from tenant's bank (tenant-initiated; tenant enters reference)
     ├── MoMo transfer (Ghana-common)
     ├── GRA portal payment gateway (integrated; platform facilitates)
     ├── In-branch GRA/SSNIT office payment (physical; tenant uploads receipt)
     ▼
[Payment confirmation]
     ├── Platform captures proof of payment
     ├── Authority eventually reconciles and marks settled
     ▼
[Journal posted on tenant books]
     ├── Dr Tax Payable / SSNIT Payable / PAYE Payable
     ├── Cr Cash / Bank / MoMo Clearing
     ▼
[Authority reconciliation]
     ├── Awaits authority's own ledger to match
     ├── Mismatches flagged for investigation
     ▼
[Audit: `filing.paid` with reference]
```

**Return to UI:** Filing marked "paid" with receipt downloadable.

---

#### NODE 10: Evidence archived

```
[Compliance archive]
     ├── Filing PDF + supporting docs + authority ack + payment proof bundled
     ├── Immutable; retention = 7 years (Ghana standard) minimum
     ├── Legal-hold eligible (extends retention)
     ▼
[Searchable tenant archive]
     ├── `/trade/compliance/archive` per tenant
     ├── Export on demand
     ▼
[Audit: `filing.archived`]
```

**Return to UI:** Archived filing visible indefinitely on compliance history.

---

#### NODE 11: Ripples

```
Filing lifecycle event
     │
     ├── /trade/compliance ─── tenant's dashboard tick
     ├── /trade/accounting ──── journal posted
     ├── /ops/compliance ────── cross-tenant filing status (on-time rate, rejection rate, authority response times)
     ├── /ops/compliance/disputes — active disputes with authorities
     ├── /ops/audit ─────────── high-severity events (rejections, disputes, late filings, missed deadlines)
     ├── /ops/support ──────── auto-tickets on missed deadlines or persistent rejections
     ├── /ops/analytics/regulatory — Ghana regulatory health across tenant base
     └── /ops/infra ────────── authority endpoint reliability tracking
```

---

### §28.4 Intersection slots — where vertical plug-ins plug into the Compliance Journey

| # | Slot | Flow location | Default | Restaurant plug-in | Institute plug-in | Pharmacy (future) | Tourism (future) |
|---|---|---|---|---|---|---|---|
| CP1 | **Tax stack** | Node 4 | VAT + NHIL + GETFund + COVID | Same + alcohol excise (if alcohol entitled) | Same; NGO tenants may have exemptions | Same + FDA levies | Same + tourism levy |
| CP2 | **E-VAT scope** | Node 1 | Per-sale | Same + tip disclosure rules | Same | Same + controlled substance flags | Same + tourism-receipt flag |
| CP3 | **Sector-specific filings** | Track F | None | None (restaurant has no extra by default; alcohol excise folds into CP1) | MoE reporting (schools), NGO reports to Registrar-General | FDA monthly inventory, narcotics log | GTA monthly returns |
| CP4 | **Employee class for SSNIT** | Node 4 | Standard employees | Includes servers on tip-based wage (structure affects PAYE) | Teacher / non-teacher classification | Per sector | Per sector |
| CP5 | **Signatory class** | Node 5 | Owner OR accountant | Same | Principal/Head + board sign-off for larger institutes | Pharmacist-in-charge | Manager |
| CP6 | **Deadline cadence** | Nodes 2, 3 | Ghana standard | Same | School-term-aligned for some reports | Same + controlled-substance weekly | Same + seasonal tourism reports |
| CP7 | **Refund cases** | Node 9 | VAT refundable carried forward | Same | Same | Same | Same |
| CP8 | **Sector inspection logs** | Track F + audit | None | Food safety log (conditional) | Student welfare, safety | FDA inspection log | GTA inspection log |
| CP9 | **Threshold registration** | Node 2 | VAT threshold tracking | Same | Same | Same | Same |
| CP10 | **Payment channels to authority** | Node 9 | Bank, MoMo, portal, office | Same | Same | Same | Same |
| CP11 | **Authority contact + escalation** | Node 8 | GRA general | Adds: GRA-ESA unit (excise) | GES + Registrar-General | FDA | GTA |

#### §28.4.A — Slot contracts

CP-series slots follow §19.A template. Phase 1 boutique slots with full contracts: **CP1 Tax stack** (`N`, integrity-critical — Ghana VAT stack 15% + NHIL 2.5% + GETFund 2.5% + COVID 1%), **CP2 E-VAT scope** (`HN`, observer fires per receipt to GRA), **CP6 Deadline cadence** (`N`, Ghana standard), **CP9 Threshold registration** (`N`, auto-tracks VAT threshold crossing), **CP10 Payment channels** (`N`, integrity-critical — Bank/MoMo/portal/office fallback chain). Remaining CP-slots (CP3 Sector filings, CP4 Employee class for SSNIT, CP5 Signatory class, CP7 Refund cases, CP8 Sector inspection logs, CP11 Authority escalation) are slot-catalogue-complete with contracts deferred to their owning Phase 2 vertical compliance pack. Integrity rule restated: Compliance submissions observe audit-pipeline-down HARD BLOCK (matches Auth/Billing integrity rule).

---

### §28.5 Offline variant

Compliance is **authority-dependent** — submissions require network. But **accrual and filing preparation** can run offline.

```
[Device offline]
     ├── Obligation accrual: local; syncs on reconnect
     ├── Filing compilation: possible on cached data; may be incomplete
     ├── Filing submission: BLOCKED (authority endpoint required); queued with explicit "pending transmission" status
     ├── E-VAT real-time transmissions: queued; Sale Journey Node 4 already handles this pattern
     ▼
[Network returns]
     ▼
[Compliance sync daemon]
     ├── Queued E-VAT transmissions fire in order
     ├── Late transmissions time-stamped with original receipt time; authority receives with "retroactive" flag
     ├── Filing prepared offline: tenant reviews + submits now that network is back
     ├── Missed deadlines during offline: late penalty accrual begins at actual deadline, not sync time
     ▼
[Audit: `compliance_offline.synced`]
```

---

### §28.6 Master ops laterals

| Lateral | Fires from | Lands on | Effect |
|---|---|---|---|
| **Rate table update** | `/ops/compliance/tax-rates` | All tenants; next accrual | Platform-wide rate change propagation; historical accruals unchanged |
| **Regulatory bulletin** | `/ops/compliance/bulletins` | All tenants | Push notification: "GRA announced new rule X"; supports narrative + links |
| **Assisted filing** | `/ops/support/compliance` | Specific tenant | Ops staff preps filing on tenant's behalf; tenant approves + signs |
| **Authority endpoint switch** | `/ops/infra` | Platform-wide | When authority changes API, toggle tenant-impacting migration |
| **Mass retransmit** | `/ops/compliance` | Backlogged E-VAT queue | Force reprocessing of stuck transmissions |
| **Dispute escalation** | `/ops/compliance/disputes` | Authority relations | Ops engages authority on tenant's behalf |
| **Legal hold** | `/ops/legal` | Specific filings / archives | Freezes retention; extends preservation |
| **Bulk correction** | `/ops/compliance` | Many tenants | When authority mandates re-filing after platform error |

---

### §28.7 Failure modes

| Failure | Node | Graceful path |
|---|---|---|
| TIN not registered | 4 | Draft mode; block final submit; guided registration flow |
| GL not closed for period | 3, 4 | Preliminary filing allowed; mark "non-final"; force close before final submit |
| Authority endpoint down | 6 | Queue submission; retry cadence; SLA clock pauses; support notified |
| Submission rejected | 7 | Reason captured; correction workspace (Node 8); re-submission |
| Authority queries filing | 7 | Dialog state; tenant/ops responds; re-filing per response |
| Missing supporting doc | 4 | Compilation blocks until uploaded; temp draft preserved |
| Input VAT claim exceeds output (refund position) | 4 | Credit carried forward; refund request path (manual follow-up with GRA) |
| WHT certificate not provided to supplier | 9 | Tenant obligation; platform generates certificate; delivery proof tracked |
| Rate table stale | 2, 4 | HARD block; platform update propagated before filings |
| Signatory unavailable at deadline | 5 | Extended signatory list per tenant; override with manager + MFA; audit |
| Payment to authority bounces | 9 | Restart payment; tenant re-initiates; filing stays accepted but payment marked unsettled |
| Duplicate submission attempt | 6 | Idempotency key dedupes; previous submission returned |
| Authority's format spec changes | 6 | Platform-side packaging updates; backward-compat for in-flight filings; ops-led migration |
| E-VAT transmission backlog | 6 | Force mass-retransmit lateral; authority may need notification |
| Tenant archived with open obligation | Node 11 | Obligation preserved; ops pursues via Tenant Lifecycle archive sub-flow |
| Legal hold on filings | Node 10 | Retention extended indefinitely; immutable; legal notifications |
| Offline long enough to miss deadline | 10.5 | Late penalty accrues from actual deadline; tenant absorbs per statute |
| Filing pipeline crash mid-run | any | Resume from checkpoint; idempotent at every step |
| Cross-border filing (foreign tenant) | varies | Platform-specific localized stack; out of Ghana scope for v1; flagged for v2 |

---

### §28.8 Downstream ripples

```
Compliance event
     │
     ├── /trade/compliance ─── tenant's surface
     ├── /trade/accounting ── journal entries (VAT liabilities, SSNIT, PAYE)
     ├── /trade/payroll ──── SSNIT/PAYE feed payroll
     ├── /ops/compliance ── cross-tenant status dashboard
     ├── /ops/compliance/disputes — active dispute tracking
     ├── /ops/compliance/bulletins — regulatory news feed (ops publishes)
     ├── /ops/audit ─────── severity-filtered events
     ├── /ops/support ──── tickets on missed deadlines / persistent rejections
     ├── /ops/analytics/regulatory — health of regulatory relationships
     ├── /ops/legal ──── disputes, holds
     └── /ops/infra ──── authority endpoint uptime
```

---

### §28.9 Ops linkage — 4 + N

**Mandatory 4:**

| Module | /ops/modules | /ops/tiers | /ops/add-ons | /ops/tenants/T/entitlements |
|---|---|---|---|---|
| Compliance & Filings | ✔ | T1+ (basic) / T2+ (multi-track) | ✔ add-on for sector-specific | ✔ |
| Tax Engine (core) | ✔ | all tiers | — | ✔ |
| Payroll & SSNIT/PAYE | ✔ | T2+ | ✔ add-on | ✔ |
| WHT | ✔ | T3+ | ✔ add-on | ✔ |
| E-VAT Integration | ✔ (foundational) | all tiers (GRA mandate) | — | ✔ |
| Sector-Specific Filings | ✔ (per sector) | per entitlement | ✔ add-on | ✔ |

**Conditional N:**

| Conditional screen | Triggered when |
|---|---|
| `/ops/compliance` | Primary surface |
| `/ops/compliance/tax-rates` | Rate maintenance |
| `/ops/compliance/bulletins` | Regulatory news |
| `/ops/compliance/disputes` | Dispute tracking |
| `/ops/compliance/archive` | Cross-tenant filing archive |
| `/ops/settings/filings-policy` | Deadline reminders, signatory defaults |
| `/ops/analytics/regulatory` | Regulatory KPIs |
| `/ops/audit` → compliance severity filter | Missed deadlines, rejections, disputes |
| `/ops/support/compliance` | Assisted-filing queue |
| `/ops/legal` | Legal holds, appeals |
| `/ops/infra/compliance-endpoints` | Authority endpoint uptime |

---

### §28.10 Interlinks

| Connected flow | Direction | Merge point |
|---|---|---|
| Sale Journey | ← feeds | Every sale's VAT/NHIL/GETFund/COVID/excise bubbles here |
| Reversal Journey | ← feeds | Reversals net against output VAT |
| Day-Close Journey | ← feeds | E-VAT daily summary at close |
| Restock Journey | ← feeds | Input VAT recoverable; WHT obligations |
| Tenant Lifecycle | ← dependency | TIN, KYC, signatory, retention all live here |
| Auth / Session | ← dependency | Signatory step-up per § 8.5 |
| Billing Journey | ↔ shares | Platform's own VAT-on-SaaS filing uses the same compliance spine |
| Payroll (module) | → feeds | SSNIT + PAYE accruals per cycle |
| Support Journey | ↔ shares | Ops-assisted filings |
| Remote Assistance | ↔ intersects | Ops co-pilot through filing prep |
| Release Rollout | ↔ correlates | Rate/format changes rolled out via release system |

---

## §29. FLOW — The Enrollment Journey (Institute)

> **The root of the Institute vertical.** Where a student / member / trainee / beneficiary becomes a registered entity on the platform, joins a cohort (class / group / programme), gets a profile, is linked to a guardian/contact, and becomes a billable subject for the Fees Journey and a trackable subject for the Attendance Journey.
> **Shape:** V-shape (admin-initiated; guardians may self-serve in some tenants; audit ripples up).
> **Frequency:** seasonal spikes (term start, intake windows); continuous for rolling admission.
> **Scope:** covers schools (primary/secondary/tertiary), NGOs (beneficiary enrolment), training institutes, faith groups, clubs.

### §29.1 Skeleton

```
[Intent captured] → [Application] → [Verification + assessment (optional)] → [Admission decision] → [Placement / cohort assignment] → [Profile provisioned] → [Guardian link + notifications] → [Fee schedule attached] → [Attendance register updated] → [Ripples]
```

Ten nodes. Institute enrolment is application-heavy compared to Trade's signup-style flows — there's often a decision gate (accept/waitlist/reject).

### §29.2 Preconditions

| Precondition | Source | Failure mode |
|---|---|---|
| Tenant has Institute entitlement | Tenant Lifecycle | Block; upsell |
| Term / cohort exists and is open for intake | Institute setup | Prompt admin to open a cohort |
| Staff role permission (`enrollment.admit`) | Auth / Roles | Step-up or block |
| Required fields configured | Institute profile policy | Warn; draft allowed; submit blocked until complete |
| Fee schedule template available | Fees module | Guided creation inline if missing |
| Privacy policy published | Tenant profile | Guardians must see; missing blocks submission |
| Audit pipeline healthy | `/ops/audit` | HARD block (integrity rule) |

### §29.3 Node-by-node

**NODE 1 — Intent captured:** guardian or admin starts application (self-serve portal, WhatsApp bot, in-person staff-assisted, import). Vertical-specific fields surface per sub-type (school vs NGO vs training).

**NODE 2 — Application:** biodata, contact, guardian(s), prior academic/program history, medical/allergy notes, special-needs flags, photo capture, document upload (birth cert, prior reports, ID). **Slot E1 — Application fields catalogue** plugs sub-type fields.

**NODE 3 — Verification + assessment (optional):** documents verified against authoritative sources where possible; optional entrance assessment (interview, test, placement exam) scheduled and scored.

**NODE 4 — Admission decision:** `admit / waitlist / reject`. Policy-driven authority (classroom teacher cap, subject head, principal). Step-up approval per Auth § 8.5. Rejection reasons tagged; waitlist auto-promotes as vacancies arise.

**NODE 5 — Placement / cohort assignment:** class/group/programme assigned; subject combinations for secondary; term start date; stream (science/arts, NGO programme branch, training module).

**NODE 6 — Profile provisioned:** student ID allocated (tenant-sequence); photo + biometric optional; initial attendance register row created; subject roster row created; ledger entry stub for Fees Journey.

**NODE 7 — Guardian link + notifications:** guardian(s) linked with relationship tag (father/mother/uncle/NGO sponsor); primary contact marked; WhatsApp + SMS welcome pack sent; parent-portal invite issued (if tenant has portal entitlement).

**NODE 8 — Fee schedule attached:** student placed on appropriate fee schedule (class-level, scholarship, sponsor-funded, staff discount, sibling discount). Feeds Fees Journey Node 1 for term billing.

**NODE 9 — Attendance register updated:** student added to active register for each class/subject; first-day attendance slot created; Attendance Journey becomes applicable immediately.

**NODE 10 — Ripples:** dashboard enrolment count ticks; MIS report refresh; parent-portal populated; Ghana GES reporting feeds (if school); donor/sponsor reports (NGO).

### §29.4 Intersection slots

| # | Slot | Default (school) | NGO plug-in | Training plug-in | Club/faith plug-in |
|---|---|---|---|---|---|
| E1 | Application fields | Biodata + academic | Needs assessment, vulnerability tags | Prior-training, skill level | Simpler profile |
| E2 | Decision authority | Head teacher + class cap | Programme manager + capacity | Trainer + cohort cap | Leader sign-off |
| E3 | Placement logic | Class + stream | Programme branch | Module cohort | Group |
| E4 | Assessment | Entrance exam (optional) | Needs eligibility | Skill assessment | None |
| E5 | Fee template | Term fees, levies | Sponsored / zero | Course fee | Subscription or free |
| E6 | Guardian model | Parents + guardian | Sponsor + family + case worker | Self or employer | Self |
| E7 | MIS reporting | Ghana GES alignment | Donor reports | Certification body | Internal |
| E8 | Privacy + minors | Strict; Ghana DPA | Strict; NGO codes | Age-dependent | Varies |

### §29.5 Offline variant
Application drafting, photo capture, document upload — all offline-capable via local queue. Verification against external sources queues until reconnect. Admission decision posting held until sync to prevent duplicate IDs.

### §29.6 Ops laterals
Rate-limit bulk imports; detect duplicate-ID patterns cross-tenant; assist with MIS export formats; legal hold on minor-records.

### §29.7 Failure modes
Duplicate student detected (name+DOB+parent match) → prompt link-not-create; incomplete docs → draft-only mode; rejection with legal implication → manager escalation; waitlist auto-promote conflict with class cap → blocked until capacity resolved; guardian contact fails → retry cadence; photo consent missing → block until obtained (Ghana DPA for minors).

### §29.8 Ripples — bubbles to: `/trade/institute`, `/trade/institute/students`, `/trade/fees`, `/trade/attendance`, `/ops/analytics/institute` (enrolment funnel), `/ops/compliance` (GES filings), `/ops/audit` (admission decisions), `/ops/support`.

### §29.9 Ops linkage
Modules: Enrollment, Cohorts, Profiles, Guardians, Fee Schedule Templates, Attendance Setup. Ops screens: `/ops/modules` (enrollment), `/ops/tiers` (institute T1+), `/ops/settings/ges-alignment`, `/ops/analytics/institute`.

### §29.10 Interlinks
→ Fees Journey (fee attachment), → Attendance Journey (register activation), ← Tenant Lifecycle (institute entitlement), ← Auth (admission authority), ↔ Compliance (GES/NGO reports), ↔ Support (assisted enrolment).

---

## §30. FLOW — The Attendance Journey (Institute)

> **Who is here today.** Daily register per class/session/programme; supports biometric, QR, manual, and parent-facing notifications. Feeds welfare alerts (consecutive absences), compliance reports, and Fees Journey (attendance-linked fees).
> **Shape:** J-shape (teacher-initiated, small ripple up).
> **Frequency:** 1–N events per student per day (per subject, per session, daily roll-call).

### §30.1 Skeleton

```
[Session opens] → [Roll taken] → [Exceptions captured (late, excused, sick)] → [Register locked] → [Notifications fire] → [Welfare checks] → [Ripples]
```

### §30.2 Preconditions
Student enrolled; cohort active; teacher session (Auth); device enrolled; day not locked on the academic calendar.

### §30.3 Nodes
**N1 — Session opens:** class/subject session begins; register surfaces with roster from Enrollment Node 9. **N2 — Roll taken:** teacher marks present/absent/late; biometric/QR scanner auto-captures if entitled; manual fallback always available. **N3 — Exceptions:** late arrival tag; excused absence with reason; sick flag routes to health officer if tenant has welfare module. **N4 — Register locked:** after grace window, teacher signs off; audit lock. **N5 — Notifications:** absent-student WhatsApp to guardian; configurable (first-period only, daily summary, same-day); parent-portal ticked. **N6 — Welfare:** consecutive-absence threshold crossed → case officer alert; ranked by risk (primary age, prior pattern, vulnerable tags from Enrollment). **N7 — Ripples.**

### §30.4 Intersection slots

| # | Slot | Default (school) | NGO | Training | Club/faith |
|---|---|---|---|---|---|
| AT1 | Session granularity | Per subject / daily roll | Programme session | Module session | Event |
| AT2 | Capture method | Manual + QR + biometric | Manual + QR | Same + certification-hour | Manual |
| AT3 | Exception tags | Late, excused, sick, suspended | Same + referral | Same + reschedule | Same |
| AT4 | Notification cadence | Same-day absence | Case-worker notification | Course-attendance warning | Member notification |
| AT5 | Welfare linkage | Consecutive absence → case | Vulnerability-flag escalation | Certification-at-risk | Low engagement |
| AT6 | Compliance | GES attendance reports | Donor activity reports | Certification body | Internal |

### §30.5 Offline variant
Register fully functional offline; notifications queued; biometric device-local; sync on reconnect reconciles with server roster (if student transferred mid-day, conflicts surface).

### §30.6 Ops laterals
Bulk-mark-present on school-wide event; offline-capture device provisioning; welfare-case escalation cross-tenant pattern detection.

### §30.7 Failure modes
Biometric mismatch → manual fallback + audit; roster mid-term change (student transfer) → attendance attributed to period of active enrolment; teacher absent (substitute) → sub takes register with supervisor session handoff per Auth § T6.4; register locked by accident → supervisor unlock + audit.

### §30.8 Ripples
`/trade/attendance`, `/trade/institute/welfare`, guardian notifications, `/ops/analytics/institute/attendance-rate`, `/ops/compliance/ges-reports`, `/ops/audit`.

### §30.9 Ops linkage
Modules: Attendance Capture, Biometric/QR (add-ons), Welfare Alerts (add-on), Parent Notifications. Ops: `/ops/settings/attendance-policy`, `/ops/analytics/institute`, `/ops/support`.

### §30.10 Interlinks
← Enrollment (roster), ↔ Fees (attendance-linked fees, if entitled), ↔ Auth (teacher session), → Compliance (GES reports), ↔ Remote Assistance.

---

## §31. FLOW — The Fees Journey (Institute)

> **How the institute gets paid by parents/sponsors.** Term fees, levies, optional items (bus, lunch, books, uniform), scholarships, sponsor-funded, sibling discounts, staff-kid discounts, installment plans, penalty for late payment. Feeds into the institute's own accounting — this is NOT the Dalxic platform bill (that's Billing Journey § 9); this is the tenant's receivables from their own customers.
> **Shape:** V-shape (admin-issued; guardians pay; ripples back to admin dashboards).
> **Frequency:** termly base; continuous for optional items and late payments.

### §31.1 Skeleton

```
[Fee schedule attached (from Enrollment)] → [Term bill assembled] → [Bill issued to guardian] → [Payment attempt] → [Payment received / arrears tracked] → [Receipt + ledger update] → [Reminders / dunning] → [Scholarship / waiver application] → [Arrears escalation] → [Ripples]
```

Ten nodes.

### §31.2 Preconditions
Student enrolled; fee schedule configured; payment providers configured; guardian contact verified; academic calendar defines term boundaries.

### §31.3 Nodes

**N1 — Fee schedule attached:** from Enrollment Node 8. **N2 — Term bill assembled:** base fees + levies + optional items the family has opted in to + discounts (sibling, staff, scholarship partial). **N3 — Issued:** delivered to guardian via WhatsApp + email + SMS + parent portal + printed (Ghana reality: print still common). Discount transparency: guardian sees original + discount + net. **N4 — Payment attempt:** guardian pays via MoMo (dominant), bank, cash-at-office, card, installment; partial payments allowed; multi-child single-payment supported. **N5 — Payment received / arrears tracked:** ledger updated; running balance visible in portal; full vs partial tracked. **N6 — Receipt + ledger:** receipt issued (with tenant branding); GL posted (Dr Cash / MoMo / AR reduction; Cr Fee Revenue; Cr Levy Liability where levies pass through). **N7 — Reminders / dunning:** cadence (T-14, T-7, T-3, T+0, T+7, T+14, T+30); escalation to principal / bursar / sponsor; never punitive language toward child. **N8 — Scholarship / waiver:** application flow; decision authority (bursary committee / principal); if approved, retroactive adjustment via credit note; sponsor-funded flows post Dr AR (Sponsor) / Cr AR (Guardian). **N9 — Arrears escalation:** policy-driven — sit-out policy, suspension from extracurriculars, withholding of results (sensitive; must match Ghana legal bounds on denying education). Ops-visible pattern detection prevents abusive use. **N10 — Ripples.**

### §31.4 Intersection slots

| # | Slot | Default (school) | NGO | Training | Club/faith |
|---|---|---|---|---|---|
| FE1 | Fee model | Termly base + levies | Often sponsored; voluntary | Course-based | Subscription or donation |
| FE2 | Discount catalogue | Sibling, staff, scholarship | Beneficiary-full | Employer-funded | Member |
| FE3 | Delivery channels | WhatsApp + SMS + portal + print | WhatsApp + sponsor portal | WhatsApp + employer | WhatsApp + app |
| FE4 | Payment methods | MoMo dominant + bank + cash + installment | Sponsor bulk + MoMo | MoMo + bank + employer direct | MoMo + cash |
| FE5 | Arrears policy | Cadence + sensitive escalation | Tracked; rarely punitive | Training cancellation | Lapse |
| FE6 | Sponsor linkage | Scholarships | Primary funder model | Employer sponsor | Donor |
| FE7 | Portal surfaces | Parent portal with breakdown | Sponsor dashboard | Employer + trainee view | Member dashboard |
| FE8 | Receipt template | School receipt with tax footer | NGO receipt template | Training receipt | Club receipt |

### §31.5 Offline variant
Bill generation + receipt printing offline-capable; payment capture (cash at office) offline; MoMo payment requires provider; queue as pending with provisional receipt; reconcile on sync.

### §31.6 Ops laterals
Fee template library; bulk fee-schedule update at tier level; dispute resolution on discount eligibility; ops-assisted sponsor onboarding.

### §31.7 Failure modes
Guardian phone changed → delivery retries + backup channel; overpayment → credit to next term (default) or refund request; multi-child family split payment ambiguity → explicit child selection on payment UI; sponsor withdrawal mid-term → invoice guardian for remainder with grace; scholarship denial appeal path; cash-at-office reconciliation to child account (common Ghana reality — printed receipts cross-referenced).

### §31.8 Ripples
`/trade/fees`, `/trade/accounting` (fee revenue GL), `/trade/institute/parent-portal`, `/ops/analytics/institute/fee-collection-rate`, `/ops/audit`, `/ops/support` (sensitive disputes).

### §31.9 Ops linkage
Modules: Fee Schedules, Levy Engine, Scholarships, Installments, Parent Portal (add-on), Sponsor Management (add-on). Ops: `/ops/settings/fee-policy`, `/ops/analytics/institute`, `/ops/audit`.

### §31.10 Interlinks
← Enrollment (fee attachment), ↔ Attendance (attendance-linked fees where applicable), ↔ Auth (bursar session + step-up for waivers), → Compliance (NGO donor reports, school financial reports), ↔ Remote Assistance, ↔ Support (sensitive escalations).

---

## §32. FLOW — The Reservation Journey (Restaurant plug-in)

> **Tables booked before guests arrive.** Feeds directly into the Sale Journey at Node 1 when guests seat. Also handles walk-in queue, no-shows, cancellations, deposit/pre-auth, waitlist, and table-status integration with the floor plan.
> **Shape:** J-shape (host-initiated; audit ripple).
> **Frequency:** variable — a café may have few; a fine-dining venue with pre-auth may manage hundreds.

### §32.1 Skeleton

```
[Booking request] → [Availability + quote] → [Confirmation (with optional deposit)] → [Pre-arrival reminders] → [Arrival] → [Seated → hands off to Sale Journey] → [No-show / cancellation branch] → [Ripples]
```

### §32.2 Preconditions
Restaurant entitled; Reservation add-on active; table map configured; host/reception role active; payment provider for deposits (optional).

### §32.3 Nodes

**N1 — Booking request:** via phone (host enters manually), WhatsApp bot, web widget on tenant's landing page, walk-in. **N2 — Availability + quote:** date/time, party size, table-preference; system checks table availability against existing bookings + turn-time assumptions; alternative slots offered. **N3 — Confirmation:** customer details captured (name, phone, email, allergies, notes); optional deposit or pre-auth (for holidays, large parties, fine-dining); deposit recorded as prepaid liability. **N4 — Pre-arrival reminders:** T-24h WhatsApp + T-2h reminder; "confirm attendance" tap; no-confirm → still held by default, but auto-release threshold configurable. **N5 — Arrival:** host checks guest in; table released from hold to "arrived"; if guest late > grace, table may be offered to walk-in queue. **N6 — Seated:** hands off to Sale Journey Node 1 (Tab on table); deposit (if any) attaches to tab as prepayment; allergy flags propagate to Sale Journey Node 2 customer-attach. **N7 — No-show / cancellation:** cancellation with notice → deposit refunded per policy (configurable); no-show → deposit forfeit per policy; tenant-configurable grace. **N8 — Ripples.**

### §32.4 Intersection slots

| # | Slot | Default | Casual restaurant | Fine dining | Bar |
|---|---|---|---|---|---|
| RV1 | Booking channels | Host + widget | Host dominant | Host + concierge app | Walk-in dominant |
| RV2 | Deposit policy | Optional | Rare | Common, pre-auth | Rare |
| RV3 | Turn time | Policy-default | 60 min | 120 min | N/A (bar tab) |
| RV4 | Preferred table | Weak preference | Best-effort | Hard-assign | Section-based |
| RV5 | Special requests | Allergies, occasion | Same | Extensive | Limited |
| RV6 | Guest database | Optional | Optional | Mandatory for pre-auth | Optional |
| RV7 | Walk-in queue | Optional | Common | Rare | Common |

### §32.5 Offline variant
Booking capture via host-on-tablet offline-capable; confirmation via WhatsApp requires network; deposit capture requires provider; queue + sync. Existing bookings cache for day-ahead use.

### §32.6 Ops laterals
Platform-level holiday templates; deposit policy defaults; cross-tenant no-show analytics (reputation signals); dispute on deposit forfeit.

### §32.7 Failure modes
Double-booking (two hosts simultaneously) → last-write-wins with alert + walk-in queue offered to loser; guest phone wrong → alternate confirmation channel; deposit provider failure → book without deposit + flag; capacity exceeded (over-optimistic turn-time) → host manages overflow via waitlist; allergy not propagated → catchall check at Sale Node 2 customer-attach (defense in depth).

### §32.8 Ripples
`/trade/restaurant/reservations`, `/trade/restaurant/floor` (live table states), `/trade/pos` (allergy flags at attach), `/ops/analytics/restaurant` (no-show rate, turn time), `/ops/support`, `/ops/audit`.

### §32.9 Ops linkage
Modules: Reservations, Walk-in Queue, Deposits, Guest Database, WhatsApp Booking Bot (add-on). Ops: `/ops/settings/reservation-policy`, `/ops/analytics/restaurant`.

### §32.10 Interlinks
→ Sale Journey (seated → tab), ← Auth (host step-up for overrides), ↔ Customers module (guest database), ↔ WhatsApp notifications.

---

## §33. FLOW — The Expense Journey

> **How money leaves the business** outside of supplier payables (which are Restock Journey territory). Petty cash draws, one-off expenses (fuel, emergency repair, market runs, entertainment, transport), reimbursements, mileage, manager approvals, receipt capture.
> **Shape:** J-shape (operator-initiated; approval step-up; audit ripple).
> **Frequency:** continuous per tenant; multiple per day at active branches.

### §33.1 Skeleton

```
[Expense intent] → [Draft with receipt] → [Approval (step-up)] → [Payment executed] → [Journal posted] → [Reconciliation at day-close] → [Ripples]
```

### §33.2 Preconditions
Tenant active; Expense module entitled (included T1+); operator has `expense.draft` role; payment source available (petty cash float, reimbursable fund, bank, MoMo).

### §33.3 Nodes

**N1 — Intent:** staff on `/trade/expenses` clicks **"New Expense"** or uses in-POS "Paid Out" shortcut on till. **N2 — Draft:** category selected (fuel, transport, supplies, entertainment, repair, utility, tax, staff-welfare, misc), amount, payee, GL account auto-mapped, receipt photo captured (camera-first), description, project/cost-center tag (optional). **N3 — Approval:** within operator cap → auto-approve; above → supervisor/manager step-up per Auth § 8.5; beyond → owner; ops-force for edge cases. Reason tag above threshold. **N4 — Payment:** petty cash (drawer open) / bank transfer / MoMo / card / reimbursement-to-employee. Expense can also be POST-PAID (employee paid from pocket; tenant reimburses). **N5 — Journal:** Dr Expense account (category-mapped); Cr Cash / Bank / MoMo / Employee Payable (reimbursement). Input VAT recoverable if supplier-invoice-backed. **N6 — Reconciliation at day-close:** petty cash paid-outs tallied against Day-Close Node 6; receipts matched; unreceipted spend flagged. **N7 — Ripples.**

### §33.4 Intersection slots

| # | Slot | Default | Restaurant | Institute | Future |
|---|---|---|---|---|---|
| EX1 | Category catalogue | Retail ops | Adds: produce market run, kitchen maintenance, waste disposal | Adds: school supplies, teacher welfare, exams | Per vertical |
| EX2 | Approval caps | Tenant policy | Same + F&B manager tier | Same + bursar tier | Per vertical |
| EX3 | Receipt requirement | Above threshold | Same | Same + strict on school-fund use | Per vertical |
| EX4 | Project / cost center | Optional | Section / shift | Class / programme | Per vertical |
| EX5 | Reimbursement flow | Employee-paid → tenant-owes | Same | Same | Per vertical |
| EX6 | Tax treatment | Input VAT recoverable if applicable | Same | Same; NGO-different for donor-funded expense | Per vertical |
| EX7 | Fraud signals | Duplicate-receipt, round-number patterns | Same + high-frequency market-run | Same + vendor-concentration | Per vertical |

### §33.5 Offline variant
Fully offline-capable: draft, photo receipt, approval via local cached supervisor PIN, petty cash draw, journal queued. Sync on reconnect; post-sync re-audit of offline approvals per Auth § 8.5 retroactive-authority rule.

### §33.6 Ops laterals
Category catalogue defaults; fraud pattern detection cross-tenant; bulk-import historical expenses during tenant onboarding; force-approve for edge cases.

### §33.7 Failure modes
Petty cash insufficient → prompt alternate method or block; receipt photo missing above threshold → block approval; supplier-invoice-backed expense duplicates supplier ledger → route to Restock path; reimbursement to employee who left → AR to ex-employee with manager decision; offline approval by revoked supervisor → flagged on sync.

### §33.8 Ripples
`/trade/expenses`, `/trade/accounting` (expense GL), `/ops/analytics/fraud-signals` (expense patterns), `/ops/audit`, Day-Close reconciliation.

### §33.9 Ops linkage
Modules: Expenses, Petty Cash, Reimbursements. Ops: `/ops/settings/expense-policy`, `/ops/analytics/fraud-signals`, `/ops/audit`.

### §33.10 Interlinks
↔ Day-Close (petty cash reconciliation), ↔ Restock (supplier-invoice expenses), ↔ Payroll (reimbursements), ↔ Auth (approval step-up), → Compliance (input VAT recovery, expense deductibility).

---

## §34. FLOW — The Inventory Count / Adjustment Journey

> **Reconciling what the system thinks you have with what's actually on the shelf.** Stocktakes, cycle counts, spot checks, breakage logs, shrinkage investigations. Where inventory reality is restored.
> **Shape:** J-shape (operator-initiated; audit ripple; potential fraud-signal).
> **Frequency:** weekly cycle counts; quarterly full stocktake; continuous spot breakage.

### §34.1 Skeleton

```
[Count scope chosen] → [Count mode picked (blind / sighted)] → [Physical count] → [Variance revealed] → [Investigation + adjustment decision] → [Adjustment posted] → [Ripples]
```

### §34.2 Preconditions
Inventory entitled; counter role (`inventory.count`); branch scope clear; catalogue current.

### §34.3 Nodes

**N1 — Scope:** full stocktake / category / aisle / single SKU / cycle-count-auto (system picks rotating subset). **N2 — Mode:** blind (preferred — counter doesn't see system qty) or sighted (faster but weaker integrity); policy-driven. **N3 — Count:** handheld scan or manual entry; batch/expiry recorded if applicable; photo capture for damaged/expired; concurrent counters supported with zone-locking. **N4 — Reveal:** per-SKU variance vs system on-hand; within threshold auto-pass; above threshold routed to investigation. **N5 — Investigation:** recent receipts vs sales vs adjustments timeline per SKU; recounts allowed (bounded); reason tagging (shrinkage, damage, expiry, miscount, theft). **N6 — Adjustment:** posting journal — Dr Inventory Shrinkage (P&L) / Cr Inventory Asset for shorts; reverse for overs; damaged/expired → Write-off. Slot P10 Derived-cost re-cost (entitled tenants): ingredient-level adjustments cascade to derived-recipe on-hand. **N7 — Ripples.**

### §34.4 Intersection slots

| # | Slot | Default (retail) | Restaurant | Pharmacy | Future |
|---|---|---|---|---|---|
| IC1 | Count unit | SKU each/case | Ingredient (kg/ltr/unit) + prep recipe on-hand | SKU + batch/expiry mandatory | Per vertical |
| IC2 | Frequency norm | Quarterly full + weekly cycle | Daily kitchen count for perishables | Daily narcotics; weekly others | Per vertical |
| IC3 | Blind enforcement | Tenant policy | Tenant policy; common in restaurants | Regulatory mandate | Per vertical |
| IC4 | Variance threshold | Per-SKU value + qty | Per-ingredient tight (cost volatility) | Per-SKU zero for narcotics | Per vertical |
| IC5 | Write-off routing | Shrinkage / Damaged / Expired | Same + Wastage (restaurant) | Same + Regulated-destruction | Per vertical |
| IC6 | Dual sign-off | High-value only | Daily supervisor | Pharmacist-in-charge | Per vertical |

### §34.5 Offline variant
Count capture fully offline; adjustment posting queued. Multi-counter conflict on reconnect: last write wins OR manual reconcile based on timestamps.

### §34.6 Ops laterals
Force-count after platform incident; fraud pattern (same counter/same SKU repeat shortfall); regulatory inspection assist (pharma narcotics).

### §34.7 Failure modes
Scanner mismatch (SKU renamed mid-count) → manual resolve; zone overlap with concurrent counters → zone-lock prevents; reveal-before-count violation → audit flagged; journal post fails → rollback; destroyed items (damaged/expired) without disposal evidence → regulatory flag for pharma.

### §34.8 Ripples
`/trade/inventory/counts`, `/trade/accounting` (shrinkage GL), `/ops/analytics/fraud-signals` (shrinkage patterns), `/ops/audit`, `/ops/compliance` (pharma).

### §34.9 Ops linkage
Modules: Stocktake, Cycle Counts, Wastage (restaurant add-on). Ops: `/ops/settings/stocktake-policy`, `/ops/analytics/fraud-signals`.

### §34.10 Interlinks
↔ Sale (inventory consumed), ↔ Restock (inventory added), ↔ Reversal (returned-to-stock), → Compliance (pharma narcotics log), ↔ Auth (step-up for high-value adjustments), ↔ Remote Assistance.

---

## §35. FLOW — The Multi-Branch Transfer Journey

> **Stock moving between tenant's own branches.** Not a sale. Not a supplier transaction. Internal logistics. Preserves landed cost; dual-sided (one branch decrements, another increments); in-transit state; partial receipt; shrinkage in transit; driver accountability.
> **Shape:** J-shape (sending branch initiates; receiving branch confirms; audit rings up).
> **Frequency:** daily for multi-branch tenants.

### §35.1 Skeleton

```
[Transfer request] → [Approved + picked at source] → [In-transit dispatched] → [Received at destination + counted] → [Variance investigated (if any)] → [Posted both sides] → [Ripples]
```

### §35.2 Preconditions
Multi-Branch module entitled; source + destination branches active; transfer role (`transfer.draft`, `transfer.dispatch`, `transfer.receive`); driver assignment (if tenant tracks).

### §35.3 Nodes (expanded v1.4 — atomic inventory + pending-transfer state)

**N1 — Request**
- Destination branch requests OR source branch pushes; line items + qtys.
- Each request creates a `Transfer` record in state `DRAFT`:
  ```
  Transfer {
    id:             UUID
    tenant_id:      string
    source_branch:  string
    dest_branch:    string
    status:         DRAFT | APPROVED | PICKED | IN_TRANSIT | PENDING_RECEIVE | RECEIVED | VARIANCE | POSTED | CANCELLED
    items:          TransferItem[]   // { product_id, qty_requested, qty_dispatched, qty_received, variance, reason }
    driver:         string | null
    seal_code:      string | null
    dispatched_at:  ISO 8601 | null
    received_at:    ISO 8601 | null
    posted_at:      ISO 8601 | null
    created_by:     operator_id
    approved_by:    operator_id | null
  }
  ```

**N2 — Approval + pick at source**
- Stock checked against current on-hand; if insufficient → reject line or entire transfer.
- **Reservation created:** source branch inventory gets a `reserved` quantity hold — on-hand remains, but `available = on_hand - reserved` drops. This prevents concurrent sales from draining stock that's committed to a transfer.
- Pick-list generated; items scanned/counted; packed.
- Status: `DRAFT → APPROVED → PICKED`.

**N3 — In-transit dispatch (ATOMIC)**
- **This is the critical atomic operation.** In a single database transaction:
  1. Source branch: `on_hand -= qty_dispatched`, `reserved -= qty_dispatched`
  2. In-Transit ledger: `in_transit += qty_dispatched` (tenant-wide, attributed to this Transfer)
  3. Transfer status: `PICKED → IN_TRANSIT`
- Seal bag/container; photo captured; driver assigned.
- **If transaction fails:** status stays `PICKED`, no inventory moves, retry.
- **If source goes offline after dispatch but before server confirms:** event queued per §46. Server processes on reconnect. Until then, source device shows `IN_TRANSIT` locally.

**N4 — Receive + count**
- Destination opens seal; counts each item; enters `qty_received` per line.
- Compares `qty_received` vs `qty_dispatched`; exceptions auto-flagged:
  - `qty_received < qty_dispatched` → `SHORT`
  - `qty_received > qty_dispatched` → `OVER` (mis-pick from source)
  - Damaged items → `DAMAGED` with photo
- Status: `IN_TRANSIT → PENDING_RECEIVE` (count entered but not yet posted).
- **If destination is offline when transfer arrives:** see §35.5 expanded offline variant.

**N5 — Variance investigation**
- If ANY line has variance (`SHORT`, `OVER`, `DAMAGED`):
  - Per-line reason tags required (theft, damage, mis-pick, counting error, weather).
  - Sign-off required if total variance value exceeds threshold (per MB5 slot).
  - Status: `PENDING_RECEIVE → VARIANCE` until all lines resolved.
- If no variance: skip directly to N6.

**N6 — Posted both sides (ATOMIC)**
- **Second critical atomic operation.** In a single database transaction:
  1. In-Transit ledger: `in_transit -= qty_dispatched`
  2. Destination branch: `on_hand += qty_received` (actual received, not dispatched)
  3. Variance lines: `Dr Shrinkage (tenant-wide) / Cr In-Transit` for shortfall
  4. Over-receipt: `Dr Inventory (destination) / Cr In-Transit` for overage
  5. Landed cost preserved: weighted-average cost carries forward from source to destination; no cost change on transfer.
  6. Transfer status: `VARIANCE → POSTED` or `PENDING_RECEIVE → POSTED`
- **Day-lock interlock:** if destination's day is already closed, transfer lands in next open day with dual-date metadata (per §46.4 rule).

**N7 — Ripples**
- `/trade/inventory/transfers` — transfer history
- `/trade/accounting` — in-transit + shrinkage GL entries
- `/ops/analytics/fraud-signals` — repeated shortfall patterns per driver/route
- `/ops/audit` — full transfer lifecycle with timestamps and operator attribution

### §35.3.A — Pending-Transfer State Machine

```
DRAFT ──→ APPROVED ──→ PICKED ──→ IN_TRANSIT ──→ PENDING_RECEIVE ──→ POSTED
  │          │            │            │               │
  └→CANCELLED └→CANCELLED  └→CANCELLED  │               └→ VARIANCE ──→ POSTED
                                        │
                                        └→ STALE (if not received within grace period per MB4)
                                             └→ ops alert + investigation
```

**Cancellation rules:**
- `DRAFT/APPROVED/PICKED` → cancellable by source manager. Reservation released.
- `IN_TRANSIT` → NOT cancellable. Goods are in motion. Must complete to `POSTED` or `STALE`.
- `STALE` → triggered by grace period expiry (MB4 slot). Ops alerted. Manual resolution required.

### §35.3.B — Concurrent Protection

- **Two transfers requesting same stock:** reservation system (N2) prevents double-allocation. Second transfer sees reduced `available` and must wait or reduce qty.
- **Sale during transfer pick:** sale checks `available` (not `on_hand`), so reserved transfer stock is protected.
- **Transfer + restock arriving simultaneously:** no conflict — restock adds to `on_hand`, transfer reservation is against pre-restock levels.

### §35.4 Intersection slots

| # | Slot | Default | Restaurant | Institute | Future |
|---|---|---|---|---|---|
| MB1 | Transfer unit | SKU case/each | Ingredient + prep + finished dish | Supplies + consumables | Per vertical |
| MB2 | Cold-chain tracking | Optional | Mandatory for cold items; temp log | Rare | Hospitality linen |
| MB3 | Driver tracking | Optional | Same | Bus driver (same staff) | Same |
| MB4 | In-transit grace | Policy | Tight (perishables) | Loose | Per vertical |
| MB5 | Variance threshold | Per-SKU | Per-ingredient | Per-category | Per vertical |

### §35.5 Offline variant (expanded v1.4)

**The core problem:** transfer is a two-sided operation across two branches that may have independent connectivity. Source dispatches while destination is offline, or vice versa.

**Principle:** Each side captures its half offline; the server reconciles when both halves arrive. No side can unilaterally complete the transfer.

```
[Source ONLINE, Destination OFFLINE]
     ▼
Source dispatches (N3 atomic transaction succeeds on server)
     ├── Server: source inventory decremented, in-transit created
     ├── Server: transfer status = IN_TRANSIT
     ├── Destination device: does NOT know transfer exists yet
     ▼
[Goods physically arrive at destination]
     ▼
Destination receives offline:
     ├── Operator scans/counts items against paper manifest or driver's device screenshot
     ├── Creates local PENDING_RECEIVE event in §46 queue
     ├── Local inventory NOT updated yet (server hasn't confirmed)
     ├── UI shows: "Transfer received — will post when connected"
     ▼
[Destination reconnects]
     ▼
§28 sync daemon drains queue:
     ├── Server matches PENDING_RECEIVE event to existing IN_TRANSIT transfer
     ├── Runs N6 atomic posting (in-transit → destination inventory)
     ├── Transfer status → POSTED
     └── Destination device receives updated inventory on pull

[Source OFFLINE, Destination ONLINE — rarer but handled]
     ▼
Source dispatches offline:
     ├── Local event queued: dispatch with item list + seal code
     ├── Source local inventory decremented optimistically
     ├── Transfer shows as IN_TRANSIT locally
     ▼
[Source reconnects]
     ▼
§28 sync daemon:
     ├── Server validates: stock was available at time of dispatch?
     │    → Yes: server creates IN_TRANSIT record, decrements source
     │    → No (concurrent sale drained stock): server REJECTS dispatch
     │       → source device shows "Transfer failed — insufficient stock"
     │       → operator must re-do with available quantities
     ├── Destination can now receive via normal online flow

[BOTH OFFLINE — worst case]
     ▼
Source dispatches offline → queued
Destination receives offline → queued (matched by seal_code or transfer reference on paper)
     ▼
[Both reconnect — order doesn't matter]
     ▼
Server processes source dispatch first (creates IN_TRANSIT)
Server processes destination receipt second (matches to IN_TRANSIT, posts)
     ├── If destination reconnects first: receipt event waits in server queue
     │   until source dispatch event arrives (transfer doesn't exist yet)
     │   → server holds receipt in PENDING_MATCH state (max 72h)
     │   → if source dispatch never arrives within 72h: ops alerted
     └── Normal case: both drain within hours, transfer completes
```

**Conflict: destination received different quantities than source dispatched.** This is a real variance (theft, damage, counting error) — handled by N5 variance investigation, same as online flow. The offline path doesn't change variance handling, only delays it.

### §35.6 Ops laterals
Cross-branch fraud pattern (same drivers, repeated shortfall); bulk-transfer assist during tenant restructure.

### §35.7 Failure modes
Negative stock at source (concurrent sale drained it) → reservation failure + alert; seal broken at receive → mandatory investigation; driver absence at dispatch → policy-driven hold; temperature breach → destination rejects + source expense via Expense Journey path.

### §35.8 Ripples
`/trade/inventory/transfers`, `/trade/accounting` (in-transit + shrinkage GL), `/ops/analytics/fraud-signals`, `/ops/audit`.

### §35.9 Ops linkage
Modules: Multi-Branch Transfer, In-Transit Tracker, Driver Accountability (add-on). Ops: `/ops/analytics/fraud-signals`, `/ops/audit`.

### §35.10 Interlinks
↔ Sale (source branch stock drawn), ↔ Restock (weighted-avg cost preservation), ↔ Inventory Count (destination variance), ↔ Expense (cold-chain breach write-off), ↔ Auth.

---

## §36. FLOW — The Support Journey

> **How tenants get help and how help gets delivered.** Ticket creation, routing, response, escalation, closure. Also the entry point for assisted filings, remote assistance, break-glass, and dispute resolution.
> **Shape:** V-shape (tenant raises → ops responds; ops also proactively raises on detected incidents).
> **Frequency:** constant; volume varies by tenant base size.

### §36.1 Skeleton

```
[Issue signal] → [Ticket created] → [Triage + categorize] → [Routed to agent] → [Diagnosis] → [Resolution (direct / remote-assist / break-glass / escalation)] → [Closure + CSAT] → [Ripples]
```

### §36.2 Preconditions
Tenant exists (can raise from any state including suspended); support channel active; agent roles at `/ops/support` configured; auto-triage rules current.

### §36.3 Nodes

**N1 — Signal:** tenant clicks "Help" → chat / WhatsApp message → web form → phone (ops-logged); auto-signals from platform (missed day-close, payment decline cascade, E-VAT failures, auth-incident spikes, release-regression alerts). **N2 — Ticket created:** ID allocated; tenant context auto-attached (tier, state, recent activity, device fleet). **N3 — Triage:** category (billing / technical / compliance / training / account-security / dispute / feature-request); severity (low/medium/high/critical); SLA clock starts. **N4 — Routed:** agent pool filter (billing agents, technical agents, compliance specialists, security team, partner support); partner-tenant tickets route to partner first per agreement. **N5 — Diagnosis:** agent investigates; uses `/ops/tenants/T` to view tenant data; may invoke remote-assistance lateral (Journey § 19) or break-glass (§ 20). **N6 — Resolution:** direct response / remote-assist session / break-glass action / bug filed / feature routed / escalation to engineering / legal escalation. **N7 — Closure + CSAT:** tenant confirms resolution OR auto-close on timeout; CSAT survey fires; unsatisfied reopens with elevated priority. **N8 — Ripples.**

### §36.4 Intersection slots

| # | Slot | Default | Partner-managed | Enterprise |
|---|---|---|---|---|
| SP1 | Signal channels | In-app + WhatsApp + email | Partner portal first | Dedicated Slack/email |
| SP2 | Triage depth | Auto + human | Partner-routed | Human first |
| SP3 | SLA | Per severity | Per partner tier | Custom SLA |
| SP4 | Agent skill routing | Skill-matched | Partner first | Named TAM |
| SP5 | Remote-assist default | On-demand | Same | Pre-authorized for some tasks |

### §36.5 Offline variant
Tenant-side ticket draft fully offline; signal queued; sync on reconnect creates ticket. Urgent in-person / phone path always available for total outages.

### §36.6 Ops laterals (support IS the ops lateral surface)
All cross-flow laterals we've defined (break-glass, force-close, force-refund, impersonate, reversal-freeze, device-kill, cap-override, etc.) originate from Support Journey resolution node.

### §36.7 Failure modes
Tenant unreachable for clarification → agent proceeds with best-effort + audit; SLA breach → auto-escalate; wrong-category routing → re-triage; partner non-responsive → auto-escalation to Dalxic after grace; confidential info leak concern → masked-fields discipline; impersonation-for-diagnosis requires tenant owner consent for sensitive actions.

### §36.8 Ripples
`/ops/support`, `/ops/support/csat`, `/ops/analytics/support-kpis` (FCR, TTR, volume by category), `/ops/audit`, `/ops/releases` (bug feed), `/ops/product/feedback` (feature requests).

### §36.9 Ops linkage
Modules: Ticketing, Chat, WhatsApp integration, Remote Assist, Break-Glass, Escalation Paths. Ops: `/ops/support`, `/ops/support/queues`, `/ops/support/sla`, `/ops/support/csat`, `/ops/settings/support-policy`.

### §36.10 Interlinks
Fires laterals into EVERY other journey (the support flow IS the connective tissue for all ops laterals documented in previous flows). ↔ Remote Assistance, ↔ Tenant Lifecycle (impersonation), ↔ Billing (disputes), ↔ Compliance (assisted filings), ↔ Release Rollout (bug feed), ↔ Auth (break-glass).

---

## §37. FLOW — The Remote Assistance Journey

> **Ops staff helping a tenant inside their own session.** Two modes: co-pilot (see + point) and takeover (see + click). Always consent-gated, always dual-audited, always with masked sensitive fields.
> **Shape:** Lateral (interrupts any running tenant flow).
> **Frequency:** per support ticket where needed; fraction of total tickets.

### §37.1 Skeleton

```
[Support agent requests] → [Tenant consents] → [Session established (co-pilot or takeover)] → [Assisted action performed] → [Session terminated] → [Dual audit posted] → [Ripples]
```

### §37.2 Preconditions
Support ticket open; tenant owner-or-delegated-user online or reachable; agent role has `remote-assist.request`; tenant policy permits (default on; can be disabled at `/ops/tenants/T/settings` by owner).

### §37.3 Nodes

**N1 — Request:** agent on `/ops/support/ticket/T` clicks "Remote Assist"; picks mode. **N2 — Consent:** tenant receives push notification + WhatsApp + in-app modal with agent identity, scope, mode; explicit "Accept" / "Decline" buttons; time-boxed consent (e.g., next 30 min). Decline ends here; audit logged. **N3 — Session established:** WebRTC + screen share + pointer overlay (co-pilot) OR dual-pointer with dual audit (takeover); sensitive fields auto-masked (PAN, PIN, patient data); "Takeover active" indicator persistent for tenant. **N4 — Assisted action:** agent navigates/explains (co-pilot) or clicks (takeover); in takeover, every click double-logged (agent initiated + tenant session executed). **N5 — Termination:** agent ends session OR tenant ends OR auto-timeout (e.g., 30 min inactivity). **N6 — Dual audit:** tenant-side audit (`/trade/audit` shows "Remote assist by agent X at time T for ticket Y") + ops-side audit (`/ops/audit` shows the full interaction including clicks). **N7 — Ripples.**

### §37.4 Intersection slots

| # | Slot | Default | Sensitive context |
|---|---|---|---|
| RA1 | Consent depth | Single consent per session | Per-action consent for extreme-sensitivity (e.g., payroll) |
| RA2 | Mode restriction | Co-pilot default; takeover requires additional approval | Takeover may be disabled entirely per tenant policy |
| RA3 | Masked fields | PAN, PIN, biometric hash | Plus: patient records if health vertical; student records for minors |
| RA4 | Recording | Session video archived for audit | Additional secure storage for sensitive sessions |
| RA5 | Agent identity | Name + agent ID visible to tenant | Always |

### §37.5 Offline variant
Not applicable — remote assist requires network both sides. Offline tenant: agent cannot assist; schedules for reconnect.

### §37.6 Ops laterals
Supervisor can shadow agent session; platform-wide pause in event of security incident.

### §37.7 Failure modes
Tenant declines → respectful fall-back to chat/phone; network drops mid-session → auto-resume on reconnect within grace; agent misbehavior → supervisor intervention + audit flag; takeover attempted action blocked by entitlement → respects the gate (no privilege escalation); consent expired → session ends gracefully.

### §37.8 Ripples
`/ops/audit` (full interaction log), `/ops/support/quality` (session review), `/trade/audit/impersonation` (tenant's own record of ops access), `/ops/compliance` (privacy adherence).

### §37.9 Ops linkage
Modules: Remote Assist, Session Recording, Consent Manager. Ops: `/ops/support`, `/ops/support/quality`, `/ops/settings/remote-assist-policy`.

### §37.10 Interlinks
Interrupts: any tenant flow. ↔ Support (parent context), ← Auth (agent identity + tenant consent as step-up), → Audit (double-entry record).

---

## §38. FLOW — The Break-Glass / Device Kill Journey

> **Emergency interventions when normal auth / device state blocks legitimate business.** Break-glass unlocks a blocked account temporarily; device-kill remotely disables a lost/stolen/compromised device. Both are rare, both heavily audited, both dual-approver.
> **Shape:** Lateral (interrupts running sessions / blocks).
> **Frequency:** very rare per tenant; cumulatively regular at platform scale.

### §38.1 Skeleton

**Break-glass:**
```
[Tenant unreachable / locked out] → [Ops support receives request] → [Identity + owner verified out-of-band] → [Dual-approval] → [Time-boxed unlock] → [Tenant re-auths normally] → [Post-incident audit + review]
```

**Device kill:**
```
[Device lost/stolen/compromised signal] → [Ops receives] → [Dual-approval] → [Kill broadcast] → [Device 403 on next API call; sessions terminated] → [Data on device wiped/rendered-useless] → [Audit + replacement path]
```

### §38.2 Preconditions
Support ticket open with reason; ops staff with respective role (`break-glass.approve`, `device-kill.approve`); owner-of-record contactable for break-glass; dual-approval available.

### §38.3 Nodes

**Break-glass N1 — Lockout context:** tenant cannot access (forgot password, lost MFA, PIN lockout with no supervisor, fraud recovery). **N2 — Ops receives:** support triages; verifies owner identity via multiple signals (phone + email + ID doc + security questions + possibly video call). **N3 — Dual-approval:** first approver (ops agent) + second approver (support manager); reason + scope + duration required. **N4 — Time-boxed unlock:** tenant/operator gets restricted temporary access (e.g., 30 min) to reset credentials; explicit banner "Break-glass mode active"; all actions flagged. **N5 — Normal re-auth:** tenant changes password/PIN/re-enrolls MFA; break-glass ends. **N6 — Post-incident:** write-up; preventive recommendations (add secondary MFA, owner contact update).

**Device kill N1 — Signal:** device lost/stolen/compromised reported by tenant OR auto-detected (repeated failed auth from unusual location). **N2 — Ops receives.** **N3 — Dual-approval:** severity-scaled; kill is destructive. **N4 — Broadcast:** device marked `killed` in registry; next API call returns 403; push notification to device (if reachable) forces logout; device cache poisoned (cryptographic keys rotated). **N5 — Wipe:** device-local data (offline queue, cached entitlements, session state) is rendered useless; tenant notified. **N6 — Replacement:** if device truly lost, new device enrolled per Auth § 8.3 Node 1; orphan data from killed device reconciled from server.

### §38.4 Intersection slots
| # | Slot | Default | Sensitive |
|---|---|---|---|
| BG1 | Approval depth | Dual | Owner-in-person for hard cases |
| BG2 | Duration cap | 30 min | Shorter for privileged scope |
| BG3 | Scope limitation | Credential-reset only | May include billing for extreme |
| BG4 | Wipe completeness | Device cache + tokens | Plus offline queue verification |

### §38.5 Offline variant
Break-glass requires network (ops originates). Device kill: if target device offline, kill queues; at next heartbeat device executes — until then device may complete offline actions (flagged retroactively per Auth § 8.5 rule).

### §38.6 Ops laterals
Platform-level freeze (security incident → mass kill / mass forced re-auth); legal-order-driven freeze.

### §38.7 Failure modes
Owner identity imposter attempt → multi-factor verification; revoked device comes back online → reiterates kill + audit offline-actions-during-kill-window; break-glass extended beyond need → auto-terminate + escalate; kill broadcast lost → retry + manual device recovery.

### §38.8 Ripples
`/ops/security`, `/ops/audit`, `/ops/support`, `/trade/audit` (tenant-visible record), `/ops/analytics/security`.

### §38.9 Ops linkage
Modules: Break-Glass, Device Kill, Owner Identity Verification. Ops: `/ops/security`, `/ops/security/break-glass`, `/ops/security/device-kills`, `/ops/audit`.

### §38.10 Interlinks
↔ Auth (credential + device registry), ↔ Support (parent context), ↔ Tenant Lifecycle (impersonation is related-but-different; break-glass restores tenant's own access), → Audit.

---

## §39. FLOW — The Release Rollout Journey

> **How new platform code reaches tenants** — staged, observable, reversible. Covers feature flags, gradual rollouts, canary cohorts, A/B policies, regional staging, rollback, announcements, and regression containment.
> **Shape:** V-shape (master ops fires; tenants consume; correlation feeds back up).
> **Frequency:** continuous; multiple rollouts per week at platform scale.

### §39.1 Skeleton

```
[Change ready for rollout] → [Cohort + flags configured] → [Canary tier (ops-internal + friendlies)] → [Expanding waves] → [Monitoring (error rate, incident signal)] → [Either: full GA or Rollback] → [Announcement + changelog] → [Post-release retrospective]
```

### §39.2 Preconditions
Build passing; schema migrations (if any) backward-compatible or accompanied by data-migration plan; observability instrumented; rollback script verified; release note drafted; compliance impact assessed (E-VAT format change? Tax rate propagation?).

### §39.3 Nodes

**N1 — Ready:** release candidate tagged; release note authored; risk assessment rated; canary plan attached. **N2 — Cohort + flags:** feature flags configured (per-tenant, per-tier, per-vertical, per-region, percentage); rollout waves defined. **N3 — Canary:** ops-internal tenants + explicit friendlies + small percentage of general tenant pool; duration per risk level. **N4 — Expanding waves:** 5% → 25% → 50% → 100%; dwell time per wave; auto-pause on incident signal. **N5 — Monitoring:** error rate deltas, latency deltas, customer-ticket spikes, flow-specific failure rate deltas (Sale Journey completion, E-VAT transmission, Day-Close hash verification). **N6 — Decision:** signals green → proceed; signals red → rollback via flag flip (preferred) OR code revert (rare). **N7 — Announcement:** tenant-facing changelog; `/ops/releases/announcements` lateral fires banner for material changes; WhatsApp broadcast for critical changes. **N8 — Retrospective:** outcome analysis; incidents documented; preventive actions.

### §39.4 Intersection slots

| # | Slot | Default | Regulated change (tax, compliance) | Pricing change |
|---|---|---|---|---|
| RR1 | Canary scope | Ops + friendlies | Same + compliance-sensitive tenants (advance warning + sign-off) | Same + enterprise tenants (advance notice) |
| RR2 | Wave dwell | Hours | Days (allow compliance observation cycle) | Days (allow tenant review) |
| RR3 | Rollback strategy | Flag flip | Flag flip + potential filing corrections | Flag flip + pro-ration adjustments |
| RR4 | Tenant-notice | Release note | Regulatory bulletin (Compliance § 10) | Pricing-change-propagation lateral (Billing § 9) |
| RR5 | Vertical scoping | Per-vertical cohorts | Per-sector for compliance | Per-tier |

### §39.5 Offline variant
Platform release is a master-ops activity — not applicable to offline devices. Devices receive new feature gates via entitlement sync.

### §39.6 Ops laterals
Emergency rollback platform-wide; targeted-tenant exclusion from rollout (if tenant-specific concern); announcement injection.

### §39.7 Failure modes
Schema migration irreversible → pre-announced, pre-staged, pre-approved special procedure; canary regression invisible → expanded monitoring + synthetic flows; rollback path broken (flag infra failure) → code revert + incident; tenant-specific regression (multi-tenant bug) → per-tenant flag-off + support outreach; offline device gets new API but not new feature flag → graceful degradation (default behavior at slot).

### §39.8 Ripples
`/ops/releases`, `/ops/releases/history`, `/ops/analytics/release-health`, `/ops/audit` (material changes), `/ops/support` (spike correlation), `/ops/settings/changelog` (tenant-facing).

### §39.9 Ops linkage
Modules: Release Manager, Feature Flags, Canary Runner, Announcements, Rollback Engine. Ops: `/ops/releases`, `/ops/releases/canaries`, `/ops/settings/feature-flags`.

### §39.10 Interlinks
Correlates to EVERY other flow (each flow's failure modes include "Does this spike correlate with recent release?"). ↔ Support (bug feed), ↔ Compliance (regulatory-release coordination), ↔ Billing (pricing rollouts), ↔ Auth (auth-subsystem releases extra-careful), ↔ Tenant Lifecycle (tier catalogue changes).

---

## §40. FLOW — The Daily Online Handshake & Heartbeat (DOH)

The anti-piracy spine. Every other flow on this platform is gated on an active DOH session for the (tenant × branch × device) triple. It is simultaneously:
1. **The trade-enable mechanism** — no handshake, no trade.
2. **The billing enforcement lever** — suspended tenants can't handshake.
3. **The attack surface** — the one thing an attacker would break to make the platform free.

Designed for economic unbreakability: defence in depth, no single point of failure, every layer independently required. Compromising any one layer does not yield trade.

### §40.1 Skeleton
```
[Device Launch]
     │
     ▼ (integrity self-check)
[Morning Handshake Request] → [Server validates all 16 layers] → [Signed Snapshot Delivered]
     │                                                                  │
     │                                                                  ▼
     │                                                        [Trade Unlocked]
     │                                                                  │
     │                                                                  ▼
     │                                                        [Heartbeat Loop — 5 min]
     │                                                         (Tier A: gating | Tier B: opportunistic)
     │                                                                  │
     │                                                                  ▼
     │                                                        [Business-Day Boundary]
     │                                                                  │
     └──────────────────────────────────────────────────────────── [Re-handshake required]
```

### §40.2 Preconditions

| Precondition | Sourced from | Failure mode |
|---|---|---|
| Device enrolled with hardware-bound keypair | §26 Auth, device enrolment | Not enrolled → enrolment flow, not handshake |
| Tenant in `active` or `trial` state | §25 Tenant Lifecycle | `suspended_hard` or `archived` → handshake rejected with cause |
| Device cert not revoked | CRL (maintained by master ops) | Revoked → lockdown screen, local data wipe |
| Network reachable to handshake endpoint | Device OS | No network → device stays locked; ops calls tenant |
| Hardware secure enclave / TPM available | Device hardware | Unavailable → device cannot enrol, cannot handshake (pre-installation check) |
| Platform HSM healthy | Master ops infra | HSM down → platform-wide incident, all handshakes fail closed, status page + broadcast |
| App binary passes L7 integrity self-check | App itself | Mismatch → flagged tampered, handshake denied, forensic bundle shipped |
| Clock skew < 5 min vs server | L5 | Excessive skew → rejected, device prompted to NTP-sync |

### §40.3 Node-by-node with lego connectors

**Node 1 — Device Launch & Pre-Flight**
- Runs binary integrity self-check (L7)
- Loads cached device cert from hardware keystore
- Loads last-session hash from encrypted local state
- Confirms secure enclave / TPM responsive
- **Failure-closed rule:** any pre-flight step fails → device stays on splash with "Cannot start — contact support"
- Lego: ⇢ feeds request assembly in Node 2

**Node 2 — Handshake Request Assembly**

Device constructs signed request with:
- `tenant_id`, `branch_id`, `device_id`
- Device cert (public)
- Last-session hash
- Queued-packet count (how many late-sync events are pending)
- Local clock + NTP offset
- Integrity self-check result
- Requested scope (which modules device expects to use today)
- **Challenge**: fresh random bytes device will include in signed portion

Signed with device private key (L2, non-exportable). Shipped over mTLS (L3) to handshake endpoint.

**Node 3 — Server-Side Validation (16-layer gauntlet)**

Server runs validation in strict order, fail-closed at any step:

1. mTLS client cert check → must be signed by platform CA
2. Signature verify on request body using device public key
3. CRL check — is this cert revoked?
4. Tenant state — active/trial?
5. Clock skew — within 5 min of server time?
6. Nonce freshness — device's nonce not already redeemed?
7. Behavioural fingerprint — does request pattern match device history?
8. Binary integrity — does self-check hash match expected for device's app version?
9. Enrolment integrity — device_id ↔ hardware fingerprint binding valid?
10. Honeypot check — is the requested tenant_id a canary?
11. Geo-IP sanity — request source plausible for this tenant?
12. Rate-limit — is device attempting excessive handshakes?
13. Entitlement resolution — compute tier, modules, caps, expiry
14. Policy tier — Tier A (default) or Tier B (annual-cleared + reputable flag)?
15. CRL delta + revoked-device list — gather for inclusion in response
16. Broadcasts — any pending ops messages for this tenant?

Fail at any step → log to `/ops/analytics/fraud-signals` (if tamper-indicative) or `/ops/support` (if benign), deliver specific cause code, device locks down appropriately.

Lego: ↙ ripples to /ops/audit on every handshake (success or fail).

**Node 4 — Response Assembly & HSM Signing**

Server assembles response containing:
- Entitlement snapshot (modules, caps, expiry)
- Policy tier (A or B) + tier parameters (heartbeat interval, grace thresholds)
- Server-signed monotonic time (L5)
- CRL delta + revoked-device list (L16)
- Push-channel broadcasts (kill instructions, announcements)
- Business-day anchor for this tenant (time-zone aware)
- App-version-latest hash (for L7 comparisons)
- Fresh nonce for first heartbeat
- Client challenge echoed back (prevents request-reorder attacks)

Entire response signed by HSM using Ed25519 key (L1). HSM never exposes key material to application memory.

Lego: ⇢ returns to Node 5.

**Node 5 — Device Verification & Snapshot Install**

Device verifies:
- Server signature using pinned public key (L3 + L1)
- Challenge echo matches
- Timestamp reasonable

On verify pass:
- Stores snapshot in JWE (encrypted with device-derived key) + HMAC
- Updates local CRL
- Updates server-signed time reference
- Activates UI: login screen enabled, trade unblocked, modules shown per snapshot

On verify fail:
- Discards response
- Retries once
- If still failing → displays lockdown with "Security check failed — contact support"
- Ships forensic to `/ops/analytics/fraud-signals` on reconnect to alternate endpoint

Lego: ⇢ enters Node 6 heartbeat loop.

**Node 6 — Heartbeat Loop**

Every 5 min (Tier A) or 15 min (Tier B opportunistic):
- Device sends: tenant_id, branch_id, device_id, operator_id, last-event-hash, queue-depth, clock-delta, integrity-selftest-summary
- Signed with device key, over mTLS
- Event stream piggybacks: any sales, E-VAT packets, audit entries, metering events posted alongside
- Server responds: token-state (valid/expiring/revoked), push-channel broadcasts (kill, force-refund, force-logout, announcement), CRL delta, re-signed time

Continuous snapshot re-verification:
- Tier A: snapshot signature re-verified at every heartbeat. Fail → immediate lockout.
- Tier B: snapshot signature re-verified opportunistically. Fail → device flagged, forensic shipped, handshake required at next business day.

Lego: ↙ ripples event stream to the relevant flow's backends (sale → §21, compliance → §28, billing meter → §27, audit → everywhere).

**Node 7 — Offline Grace / Lockout (Tier A) | Opportunistic Mode (Tier B)**

**Tier A behaviour:**
- 0–60 min no heartbeat: full ops, no UI indication (network resilience)
- 60–120 min no heartbeat: amber banner "Connection lost — reconnect within 60 min"
- 120+ min no heartbeat: hard read-only lockout — no new sales, no kitchen fires, no payouts, no user actions beyond viewing historical data
- Reconnect → heartbeat resumes → events drain → full ops resume

**Tier B behaviour:**
- No lockout. Amber banner at 60 min, persistent. Full ops continue all day.
- On reconnect, queue drains opportunistically.
- Marketing: "When your bank is down, you keep trading."

**Both tiers:**
- If the **12h hard token expiry** passes with no heartbeat → token invalidates → re-handshake required regardless of tier.
- If business-day boundary crosses → token invalidates → re-handshake required.

**No emergency fallback.** Lockout means lockout. No cash-sales-logged-for-later. (Per George's ruling: no back door.)

**Node 8 — Business-Day Boundary / Token Expiry**

At tenant-configured business-day anchor (e.g., `06:00 Africa/Accra` for retail, `10:00` for restaurants, `14:00` for 24-hour bars):
- Server invalidates token for (tenant × branch × device)
- Device's next trade action → forced re-handshake
- Snapshot considered stale; must refresh

**Non-business day handling (device not turned on):**

A shop that closes on Sundays simply doesn't turn on the device. No handshake fires. The system must handle this gracefully — not panic, not accumulate debt, not punish the tenant for being closed.

Server-side rules using §40.E holiday calendar:
1. **No missing-handshake alert on non-business days.** Server checks `isBusinessDay(today, tenant.holiday_calendar)` before raising missing-handshake alerts. If today is Sunday and tenant has `weekly_rest=[0]`, no alert fires.
2. **Token expiry is passive.** The 12h/20h TTL expires silently. No server-side action needed. When the device next turns on (Monday morning), it simply handshakes fresh.
3. **Multi-day gap is normal.** A 3-day holiday weekend (Fri close → Mon open) means 3 days with no handshake. Server expects this. The gap is only suspicious if it falls on a business day.
4. **Late-sync from last business day drains at next startup.** Saturday's queued events drain in Monday's morning handshake (Node 9). They land in Saturday's ledger with correct timestamps. Monday's day-lock cert covers Saturday's close.
5. **Cert renewal clock still ticks.** The 90-day device cert countdown continues even when the device is off. If a seasonal shop closes for 60+ days, the cert may be near expiry at next startup. The 60-day auto-renew threshold accounts for this — shops that trade at least monthly will never hit expiry.
6. **Extended absence (30+ days without handshake).** Server flags for ops review — could be a closed business, a stolen device sitting unused, or a tenant who churned without notifying. Ops reaches out. Not an automated suspension — just a review flag.

**Alert suppression matrix:**

| Scenario | Business Day? | Alert? | Action |
|---|---|---|---|
| Device off on Sunday | No (weekly rest) | **No** | Nothing — expected |
| Device off on Christmas | No (public holiday) | **No** | Nothing — expected |
| Device off on Monday | Yes | **Yes** — after anchor + 2h grace | Ops notified |
| Device off for 7+ business days | Yes (multiple) | **Yes** — escalating | Ops calls tenant |
| Device off for 30+ calendar days | Mixed | **Review flag** | Ops investigates |
| New device never handshaked | N/A | **Yes** — after 48h of enrollment | Possible abandoned signup |

Anchor is stored in tenant settings, default per vertical:
- Retail: `06:00` local
- Restaurant (day): `09:00` local
- Restaurant (bar / late-night): `14:00` local
- Institute: `05:30` local

**Node 9 — Late-Sync Drain (subordinate to next handshake)**

When the next handshake succeeds:
- Device ships any queued events with `late-sync = true` and original timestamps preserved
- Events land in today's ledger tagged as late-sync for day D-1 (or earlier)
- Server computes yesterday's day-hash from all events received (via heartbeat + late-sync)
- Server issues **day-lock certificate** for yesterday, signed, immutable
- Device stores cert locally as authoritative close-of-day record
- **Closed days are never reopened.** Very-late arrivals (days old) land in current day with dual-date metadata for reconciliation.

Lego: ↙ ripples yesterday's day-lock cert to /ops/audit, /ops/compliance (Z-report payload), relevant flows' post-close hooks.

### §40.4 Intersection slots — where policies plug into the Handshake

| Slot | Decision point | Default | Plug-in examples |
|---|---|---|---|
| DH1 | Handshake policy tier | Tier A (standard) | Tier B (annual-cleared + reputable flag); future Tier C (government / regulated) |
| DH2 | Business-day anchor | `06:00` tenant-local | Restaurant 09:00; Bar 14:00; Institute 05:30; 24h operation custom |
| DH3 | Heartbeat interval | 5 min | Tier B 15 min opportunistic; high-risk tenant 2 min |
| DH4 | Offline grace thresholds | 60 warning / 120 lockout | Tier B: no lockout; Tier C: 0 grace; flagged tenant: 15/30 |
| DH5 | Pre-handshake challenge | signed nonce only | Elevated risk: OTP-via-WhatsApp to owner phone before handshake clears |
| DH6 | Broadcast payload | none | Platform announcement, tenant-specific notice, forced-logout, emergency message |
| DH7 | Canary check set | baseline (L11) | Additional checks for devices flagged anomalous by L12 behavioural fingerprint |
| DH8 | Post-handshake starter task | splash → login | Restaurant: show table map; Institute: show class roster; Retail: show day's revenue |
| DH9 | Token TTL | 12h hard expiry | Tier B: 20h; high-risk tenant: 6h |
| DH10 | Event stream piggyback policy | all events via heartbeat | High-volume: parallel channel; low-value tenant: batched every 15 min |

#### §40.4.A — Slot contracts

DH-series slots follow §19.A template with tightened failure semantics — the DOH is the anti-piracy spine, so every DH slot is **integrity-critical** (contract violation = hard block, never degrade-graceful). Phase 1 boutique slots with full contracts: **DH1 Policy tier** (`N`, default Tier A; Tier B re-patch requires both annual-cleared + reputable_ops_clearance flag), **DH2 Business-day anchor** (`N`, boutique default 06:00 local; tenant re-patch via ops-approved config), **DH3 Heartbeat interval** (`N`, default 5min), **DH4 Offline grace thresholds** (`N`, default 60/120 Tier A; Tier B no-lockout is `DN` — requires both annual-cleared AND reputable flag), **DH5 Pre-handshake challenge** (`N`, default signed nonce; OTP escalation on elevated risk), **DH7 Canary check set** (`HN`, baseline L11 + observer emits anomaly to L12), **DH9 Token TTL** (`N`, 12h hard). Remaining DH-slots (DH6 Broadcast payload, DH8 Post-handshake starter task, DH10 Event stream piggyback policy) are slot-catalogue-complete with contracts deferred to their owning Phase 2 modules. **Spine-surgery prohibition applies doubly here:** no DH slot may be bypassed, widened, or default-overridden without master-ops dual-approval. Any DH-slot plug-in that returns a contract-violation triggers immediate device cert revocation + tenant-wide lockdown, per §40.D operational runbook.

### §40.5 Offline variant

**The morning handshake cannot be offline. Ever. Hard rule, no exceptions, no override.**

Justification: morning handshake IS the entitlement gate. Offline morning handshake = self-authorized trade = piracy vector. Any tenant who cannot connect at start of day cannot trade that day. They call support; ops diagnoses (network issue vs suspended account vs device tampered); issue resolved via appropriate lateral.

**Mid-day offline** behaves per tier (see Node 7).

**End-of-day offline**: no close handshake exists, so this is a non-issue. Events queue locally, drain at next morning's handshake. (The absence of a close ceremony is itself an anti-freebie feature — there's no "close" to spoof.)

### §40.6 Master ops laterals on DOH

| Lateral | Who | When | Effect |
|---|---|---|---|
| Force re-handshake on device | Ops staff, single approval | Device suspected compromised, cert near expiry, urgent config push | Device's next action forces new handshake; active session terminated |
| Force re-handshake on entire branch | Ops manager, dual-approval | Branch-wide config change, suspected breach | All devices at branch forced to re-handshake; coordinated downtime possible |
| Grant Tier B | Ops staff, dual-approval + reason + written KYB | Enterprise / reputable tenant with annual payment cleared | `reputable_ops_clearance = true`, next handshake applies Tier B profile |
| Revoke Tier B | Ops staff, single approval + reason | Fraud signal, compliance breach, legal hold, non-renewal | Flag flipped; next morning handshake drops back to Tier A |
| Grant hardship grace (one-time) | Ops manager, dual-approval | Tenant outage documented, tenant in good standing | Extends offline grace one time, logged, tenant notified |
| Device cert revoke (instant kill) | Ops manager, dual-approval | Device stolen, sold without licence, flagged tampered | CRL updated; online device killed via push; offline device dies at next handshake |
| HSM key rotation | Ops director + security lead, quarterly | Scheduled rotation, emergency rotation on compromise suspicion | All in-flight tokens invalidate on schedule; rotation overlap window prevents mid-day outage |
| Broadcast on handshake | Ops staff, single approval | Announcement, urgent notice | Message delivered in next handshake response; device displays on UI |
| Tenant-wide lockdown | Ops director, triple-approval + legal sign-off | Court order, regulatory directive, severe breach | All devices at tenant fail handshake with explanatory screen; Break-Glass §38 is the action surface |

### §40.7 Failure modes — the broken-path inventory

| Failure | Who sees it | Detection | Recovery |
|---|---|---|---|
| Tenant's internet dead at morning | Tenant, ops | Device displays "No connection"; ops sees missing-handshake alert after anchor + 2h grace (business days only per §40.E calendar) | Tenant fixes connectivity; if protracted, ops calls to diagnose |
| Device not turned on (non-business day) | Nobody | Server checks §40.E holiday calendar; no alert if today is weekly rest or public holiday | Nothing — expected. Token expired passively. Fresh handshake at next startup |
| Device not turned on (business day) | Ops | Missing-handshake alert after anchor + 2h grace | Ops contacts tenant to verify — could be power outage, forgotten device, or churn signal |
| Extended absence (30+ calendar days) | Ops | Server flags for review after 30 days since last handshake | Ops investigates: closed business? Stolen device? Churned tenant? Not automated suspension — human review |
| HSM down | Platform-wide | Health-check alarm | Incident response; status page; all new handshakes queue briefly or fail; existing in-flight sessions continue until their TTL |
| Device cert expired (90d without renewal) | Tenant | Handshake rejects with `cert_expired` | Auto-renewal logic triggers at 60d; if missed, ops re-issues via `/ops/tenants/[id]/devices` |
| Cert revoked (stolen device, etc.) | Attacker attempting to use | Handshake rejects with `cert_revoked` | Device wipes local data, shows revoked screen; actual owner contacts ops |
| Integrity self-check fails (tamper) | Device flagged; attacker unaware | L7 + L11 canaries | Handshake denied; forensic bundle shipped; device locked; ops investigates |
| Clock tampering | Server | L5 skew > 5 min | Handshake rejects with `clock_skew`; device prompted to NTP sync |
| Replay of old handshake | Attacker attempts; server rejects | L4 nonce cache | Hard reject; logged to `/ops/analytics/fraud-signals`; device potentially flagged for L12 anomaly |
| Rooted device with Frida hook | Device | L9 runtime anti-tamper | Session killed; forensic ship; L11 canaries may have already caught them silently |
| Emulator attempt | Server | L9 + hardware attestation fail | Handshake denied; enrolment blocked |
| MITM with fake cert | Device | L3 cert pinning | Connection refused; device logs attempt; tries alt endpoint |
| Fake "Dalxic server" redirect (DNS poison) | Device | L3 cert pinning rejects fake cert | Device refuses to proceed; ships tamper alert on recovery |
| Tenant suspended mid-day (Tier A) | Tenant operator | Next heartbeat gets `suspended` ack | UI goes read-only; banner with explanation and contact info |
| Tenant suspended mid-day (Tier B) | Not seen until next morning | Tier B doesn't gate on heartbeat | Break-Glass §38 is used for instant cutoff if urgent |
| Canary tenant_id probed | Attacker (unknowingly) | L13 honeypot | IP banned, forensic collected, law-enforcement-ready evidence bundle produced |
| Behavioural anomaly (L12) | Scored, not hard-blocked | Multi-heartbeat pattern | Scored to fraud-signals; elevated verification (OTP) on next sensitive action |

### §40.8 Downstream ripples — what bubbles up to /ops

Every successful handshake ripples:
- `/ops/audit` — who handshaked, when, from where, policy tier applied, snapshot hash
- `/ops/analytics/devices-active` — real-time heatmap of active devices per tenant per branch
- `/ops/analytics/handshake-latency` — HSM + server performance tracking

Every failed handshake ripples:
- `/ops/support` — benign failures (expired cert, clock skew) for operator assistance
- `/ops/analytics/fraud-signals` — tamper-indicative failures (L7/L9/L11 canary/L12 behavioural)

Every tier change ripples:
- `/ops/tenants/[id]` — tier history
- `/ops/billing` — correlation with annual-clearance state
- `/ops/audit` — approver, reason, dual-approval chain

Every revoke / force action ripples:
- `/ops/audit` — full chain of approvals
- `/ops/support` — tenant-facing notification preparation

### §40.9 Ops linkage — 4 + N for DOH

**Mandatory (the 4):**

| Route | Payload |
|---|---|
| `/ops/audit` | Every handshake event, every tier change, every force-action |
| `/ops/support` | Benign failures + tenant-facing issue tickets |
| `/ops/analytics/devices-active` | Real-time active-device heatmap |
| `/ops/compliance` | Handshake logs available for GRA / DPA audit requests (who handshaked when, from which geo-IP) |

**Conditional (the N):**

| Route | When |
|---|---|
| `/ops/analytics/fraud-signals` | L7/L9/L11/L12 trips — tamper-indicative failures |
| `/ops/tenants/[id]` | Tier B grant/revoke visibility; device list management |
| `/ops/tenants/[id]/devices` | Device enrolment, cert renewal, revocation |
| `/ops/infra` | HSM health, handshake endpoint latency, CRL propagation |
| `/ops/releases` | App version hash distributed in handshake response; version mismatch detection |
| `/ops/billing` | Tier B eligibility ↔ annual-cleared correlation |
| `/ops/security` | Pen-test findings, bug-bounty reports, incident response |

### §40.10 Interlinks to other flows

| Connected flow | Direction | Merge point |
|---|---|---|
| §21 Sale | DOH → Sale | Sale can't start without active handshake; session token presented with every sale action |
| §22 Reversal | DOH → Reversal | Step-up auth for high-value reversals validates against current handshake |
| §23 Day-Close | DOH → Day-Close | Day-Close is business-internal now; day-lock cert comes from **next morning's handshake** (Node 9) |
| §24 Restock | DOH → Restock | PO approval requires active session; supplier payment requires Tier-valid handshake |
| §25 Tenant Lifecycle | Bidirectional | DOH consumes tenant state; T5.7 soft-suspend shows in heartbeat ack; T5.1 upgrade triggers re-handshake |
| §26 Auth | Bidirectional | Device cert enrolled in §26; DOH validates session-level; §26 validates operator-level; both required |
| §27 Billing | Bidirectional | Annual-cleared state from §27 → Tier B eligibility in DOH; suspension from §27 → handshake rejection |
| §28 Compliance | DOH → Compliance | E-VAT queue depth reported in heartbeat; canary threshold triggers §28 watchdog |
| §11–13 Institute flows | DOH → Institute | Enrolment/Attendance/Fees all gated on active handshake |
| §32 Reservation | DOH → Reservation | Handshake required to open reservation system |
| §15–17 Expense / Count / Transfer | DOH → these | All gated on active handshake; large variances require step-up auth bound to handshake |
| §36 Support | Support ↔ DOH | Handshake failures generate support tickets; support can force re-handshake |
| §37 Remote Assistance | Remote → DOH | Remote session establishes via fresh handshake with elevated attestation |
| §38 Break-Glass | Break-Glass → DOH | Supersedes and terminates active handshake; kill-switch is the ultimate override |
| §39 Release Rollout | Release → DOH | New app-version hash distributed in handshake response; L7 integrity enforced |

### 22.A — Tier A / Tier B Policy Matrix

| Dimension | Tier A (Standard) | Tier B (Continuous Trade) |
|---|---|---|
| Qualifies for | All tenants by default | Annual payment **cleared** AND `reputable_ops_clearance = true` flag |
| Morning handshake | **Required** | **Required** |
| Heartbeat frequency | Every 5 min | Every 15 min opportunistic |
| Heartbeat gates trade? | Yes | No |
| Offline tolerance | 60 min warning / 120 min lockout | No lockout during business day |
| Token TTL | 12h hard expiry | 20h hard expiry |
| Marketing position | "Robust during short drops" | "When your bank is down, you keep trading" |
| Downgrade triggers | N/A | Annual expires, reputable flag revoked, fraud signal, court order |
| Downgrade timing | N/A | Next morning handshake (never mid-day, avoids sudden lockout for enterprise in middle of service) |

**Dual-qualification rule:** both conditions must be true continuously. Either failing → next morning, Tier A applies.

**Emergency override:** Break-Glass §38 supersedes Tier B. A revoked device dies at next ping regardless of tier. A tenant lockdown kills all branches regardless of tier.

### 22.B — Handshake Security Architecture (16 independent layers)

The handshake is the attack surface. Budget security accordingly: defence in depth, no single point of failure, every layer independently required to trade.

| # | Layer | What it prevents | Storage / enforcement |
|---|---|---|---|
| L1 | Server-signed response via HSM | Token forgery | Ed25519 key in AWS CloudHSM (or GCP Cloud KMS). Never in application memory. Quarterly rotation with overlap window. |
| L2 | Hardware-bound device keypair | Cert cloning, key extraction | Generated and stored in device's Secure Enclave (iOS/Mac) / StrongBox (Android) / TPM 2.0 (Windows/Linux). Non-exportable. |
| L3 | Mutual TLS + certificate pinning | MITM, fake server, proxy interception | Client pins server cert; server pins client-cert CA. Hard reject on mismatch. |
| L4 | Fresh server nonce + device nonce | Replay attacks | 64-byte random server nonce; Redis-backed redemption cache; 30-second validity window. |
| L5 | Server-signed time | Clock tampering | Server monotonic time signed in response; device uses for token expiry math, not local clock. |
| L6 | Signed entitlement snapshot | Snapshot editing | JWE-encrypted + HMAC with device-derived key. Verified on every use, not just receipt. |
| L7 | Binary self-integrity | App patching | Hash self-check at launch + every 15 min against server-registered expected hash. Obfuscated code paths. |
| L8 | Distributed validation logic | Single-patch bypass | Handshake validation stitched across 5+ modules; each checks a fragment; partial verdicts passed through obfuscated channels. No single `isValid() → bool` to patch. |
| L9 | Anti-runtime-tamper | Frida / Xposed / Substrate hooking | Detection at runtime; memory checksums; anti-debugging; anti-emulator; hooking trips kill session + forensic ship. |
| L10 | Root / jailbreak awareness | Elevated-risk devices | Not auto-deny (too many false positives in Africa); triggers elevated verification (more OTP challenges, tighter L12 scoring). |
| L11 | Canary checks | Sophisticated bypass | Hidden validations that **log tamper without revealing they were caught**. Attacker thinks bypass worked; forensic ships; device killed within hours. |
| L12 | Behavioural fingerprinting | Post-compromise detection | 30-day per-device profile (heartbeat timing, packet ordering, queue depths, IP range, transaction volumes). Anomaly score → fraud-signals. |
| L13 | Honeypot tenant IDs | Attacker probing | Seeded fake "premium" tenant IDs with no billing record. Any device validating against them = known probe. IP ban + forensic + law-enforcement-ready bundle. |
| L14 | Out-of-band OTP | Fully-rooted compromise | Sensitive actions (annual renewals, Tier B grants, large refunds, device enrolments) require WhatsApp / SMS OTP to registered owner phone. Attacker doesn't have the phone. |
| L15 | Server-side truth on high-value ops | Offline trust of snapshot alone | Snapshot is a cache, not a legal document. Large refunds, module toggles, tier changes, operator deletions ask server live. No offline authorization. |
| L16 | Push-channel kill switch | Compromised device in the wild | Server can kill any online device instantly; offline devices die at next handshake. Break-Glass §38 is the command surface. |

**Threat model — what attackers will try:**

| Attack | Primary defence | Secondary |
|---|---|---|
| Forge handshake response locally | L1 (HSM signing, key never leaves HSM) | L7 (patched client still fails L8 distributed validation) |
| Replay old valid response | L4 (fresh nonce, 30s validity) | L5 (signed time) |
| Clone device cert to another machine | L2 (hardware-bound private key) | L12 (behavioural anomaly after clone) |
| Set device clock backward | L5 (server-signed time) | L12 (pattern change) |
| Edit cached entitlement snapshot | L6 (signed + HMAC) | L8 (re-verify on every use) |
| Patch app binary to skip validation | L7 (integrity self-check) | L8 (distributed validation), L11 (canary catches patched bypass) |
| Reverse-engineer validator | L8 (distributed logic) | L11 (canaries catch deployed bypass) |
| Extract signing keys from client | L1 (keys in HSM, not in client) | L2 (device key in Secure Enclave, non-exportable) |
| Runtime tamper (Frida, Xposed) | L9 (detection) | L11 (silent canary) |
| Emulator with fake hardware | L9 + hardware attestation | L2 (real Secure Enclave required for enrolment) |
| Man-in-the-middle | L3 (mTLS + cert pinning) | L1 (signature invalidates fake content) |
| Fake "Dalxic server" (DNS poisoning) | L3 (cert pinning) | L1 (no HSM, no valid signature possible) |
| Mass piracy via disk image clone | L2 (hardware-bound per-device key) | L12 (multiple devices with identical fingerprint flag instantly) |
| Insider fraud | L14 (OTP to owner phone) | L12 (behavioural anomaly) |
| Social-engineered credential theft | L14 (OTP) | L12 (new geo / device pattern) |

**Attacker economics — why this is Hulk-proof in practice:**

| Attacker | Outcome |
|---|---|
| Script kiddie with decompiler | Stopped at L2 + L3 + L7. No progress. |
| Commercial piracy crew (KMS-ers) | L2 hardware-bound keys defeat scale — each device needs per-device hardware compromise. Economics don't work. |
| Skilled individual RE | Weeks of work. L8 distributed validation + L11 canaries catch deployed bypass within days. Every quarterly key rotation invalidates their work. Race against rotation = lose. |
| Corporate insider | L14 OTP requires owner's phone. L12 flags behavioural anomaly. L16 kills within hours of detection. |
| Nation-state zero-day chain | Theoretically could compromise HSM + Secure Enclave + OTP channel. But they're not after free POS software — wrong target. |

**Honest disclosure:** no cryptosystem is theoretically unbreakable. What we're engineering is **economically unbreakable** — cost-to-break exceeds any imaginable return. A commercial pirate would spend months and be detected within days. They eventually do the math and pay the subscription. That's the desired outcome.

### 22.C — Cryptographic Inventory

Every key, where it lives, rotation cadence:

| Key | Storage | Purpose | Rotation |
|---|---|---|---|
| Platform CA (root) | HSM, offline, quorum-sealed | Issues intermediate CAs | 10-year; manual ceremony |
| Device-cert intermediate CA | HSM | Signs device certs at enrolment | 3-year |
| Handshake response signing key | HSM (AWS CloudHSM) | Signs L1 handshake responses | Quarterly, overlap window |
| Day-lock signing key | HSM | Signs day-lock certificates | Quarterly |
| Audit-chain signing key | HSM | Signs audit-chain Merkle roots | Quarterly |
| Nonce HMAC key | HSM | Binds nonces to device context | Monthly |
| Device private key (per device) | Device Secure Enclave / TPM 2.0 | Signs handshake requests, heartbeats | 90-day cert, auto-renew at 60d |
| Snapshot encryption key (per device) | Derived from device private key + server salt | Encrypts local snapshot JWE | Rotates on device cert renew |
| Snapshot HMAC key (per device) | Derived from device private key | Authenticates local snapshot | Rotates on device cert renew |
| CRL signing key | HSM | Signs certificate revocation list | Quarterly |
| OTP seed key (per tenant owner) | HSM | Generates L14 OTP codes | On owner phone-number change; quarterly platform-wide |
| Broadcast signing key | HSM | Signs push-channel messages (kill, announcement) | Quarterly |

### 22.D — Operational Lockdown

- **HSM runbook** — quarterly rotation drill; emergency rotation procedure on suspected compromise; quorum-sealed root CA ceremony documented
- **CRL propagation** — CRL delta distributed in every handshake response; full CRL refreshed every 24h; compromised cert dies within 24h of next device handshake
- **Security audit** — external security audit annually; pen-test annually (Ghana/Nigeria firm); bug bounty program once platform has meaningful traffic (small GHS rewards for responsible disclosure)
- **Incident response** — documented runbook for: HSM compromise, signing-key leak, mass device-cert leak, canary-hit cluster, suspected piracy ring
- **Dependency hygiene** — crypto libraries pinned and reviewed; SBOM maintained; CVE watch with same-day patching for crypto-critical dependencies
- **Red-team drills** — internal quarterly attempt to break handshake from scratch; findings drive layer hardening

### 22.E — Offline Holiday Calendar (v1.4 — closes Gap 5)

> Peer review flagged: "The business-day anchor calculation needs to work fully offline — the client needs to carry its own calendar of public holidays, not fetch them."

**Problem:** Node 8 (business-day boundary) uses the tenant's configured anchor time (e.g., `06:00 Africa/Accra`) to invalidate tokens. But some tenants configure "skip Sundays" or "skip public holidays" — meaning the anchor only fires on business days. If the device is offline at boundary time, it must compute the next business day locally without fetching from the server.

**Solution: Bundled holiday calendar shipped in handshake response.**

Every morning handshake (Node 4 response) now includes:

```
holiday_calendar: {
  country:     "GH"
  year:        2026
  holidays:    [
    { date: "2026-01-01", name: "New Year's Day", type: "fixed" },
    { date: "2026-01-07", name: "Constitution Day", type: "fixed" },
    { date: "2026-03-06", name: "Independence Day", type: "fixed" },
    { date: "2026-04-03", name: "Good Friday", type: "movable" },
    { date: "2026-04-06", name: "Easter Monday", type: "movable" },
    { date: "2026-05-01", name: "May Day", type: "fixed" },
    { date: "2026-05-25", name: "African Unity Day", type: "fixed" },
    { date: "2026-06-29", name: "Eid al-Adha", type: "movable" },
    { date: "2026-07-01", name: "Republic Day", type: "fixed" },
    { date: "2026-09-21", name: "Kwame Nkrumah Memorial Day", type: "fixed" },
    { date: "2026-12-02", name: "Farmers' Day", type: "fixed_first_friday_dec" },
    { date: "2026-12-25", name: "Christmas Day", type: "fixed" },
    { date: "2026-12-26", name: "Boxing Day", type: "fixed" }
  ],
  weekly_rest:  [0],            // Sunday = 0 (ISO weekday)
  custom_rest:  [],             // tenant-specific rest days (e.g., Adventist shops close Saturday)
  calendar_hash: "sha256:...",  // integrity check
  valid_until:  "2026-12-31"    // calendar refresh forced at year boundary
}
```

**Device-side business-day computation (fully offline):**

```
function isBusinessDay(date, calendar, tenantConfig) {
  // 1. Check weekly rest days
  if (calendar.weekly_rest.includes(date.getDay())) return false
  
  // 2. Check tenant custom rest days
  if (calendar.custom_rest.includes(date.getDay())) return false
  
  // 3. Check public holidays
  const dateStr = date.toISOString().slice(0, 10)
  if (calendar.holidays.some(h => h.date === dateStr)) return false
  
  return true
}

function nextBusinessDayAnchor(now, calendar, tenantConfig) {
  let candidate = nextDayAtAnchorTime(now, tenantConfig.anchor_time, tenantConfig.timezone)
  
  // Skip non-business days (max 10 iterations covers any holiday cluster)
  let safety = 0
  while (!isBusinessDay(candidate, calendar, tenantConfig) && safety < 10) {
    candidate = addDays(candidate, 1)
    safety++
  }
  
  return candidate
}
```

**Calendar update rules:**
- **Fresh calendar:** shipped in every morning handshake response. Device stores it locally.
- **Stale calendar (year boundary):** if `valid_until` has passed and device is offline, device treats ALL days as business days (fail-open for business continuity, fail-strict for anti-piracy — the token still expires at the hard TTL regardless).
- **Movable holidays:** Eid dates are determined ~30 days before. Server pushes updated calendar in heartbeats as confirmed dates emerge. Device always uses the latest calendar it received.
- **Multi-country (future):** calendar keyed by `country` code. Phase 1 is Ghana-only. When Nigeria/Kenya launch, each tenant's country determines their calendar. The schema supports this without migration.

**Signed calendar:** The `calendar_hash` is included in the HSM-signed handshake response (L1), so a tampered calendar (skipping holidays to extend offline grace) is detectable at next online handshake.

**Ghana public holidays — source of truth:** Published annually by the Ministry of Interior. Fixed holidays are codified in law (Public Holidays Act, 2001 — Act 601). Movable holidays (Easter, Eid) computed from lunar calendar / announced by National Chief Imam's office. The server maintains the authoritative list; devices never compute holiday dates themselves — they only consume the shipped list.

---


---

# PART IV — PLATFORM CONCERNS

> The substrate beneath the flows — analytics, SEO, public surfaces.

## §41. Platform Concerns — the substrate beneath the flows

The 19 flows (§21–§40) describe what a user or system does. **Platform Concerns describe the substrate every flow runs on.** Not user journeys — policy and infrastructure spines that are cross-cutting. Without them, the flows sit on sand. Each subsection below treats its concern with the same audit rigor as a flow (scope, interlinks, failure modes, ops linkage), shaped to the concern's native form.

### §41.A — Analytics Spine

**Two tracks, never mixed:**

| Track | Audience | Source | Destination | Retention |
|---|---|---|---|---|
| **Product analytics** | Tenant owners + master-ops product team | Tenant app (operator actions, feature touches, funnel steps) | Warehouse (ClickHouse / BigQuery), tenant-scoped namespace | 24 months rolling |
| **Ops analytics** | Master-ops staff only | Server-side system events (handshakes, fraud signals, release health) | Same warehouse, `ops` namespace | 7 years (compliance) |

**Event schema discipline:**
- Every event: `event_name`, `ts`, `tenant_id`, `branch_id`, `session_id`, `device_id`, `event_version`, `properties{}`
- Schema versioned; breaking changes additive only (new field, never rename)
- **No PII in product events.** Operator names, customer names, phone numbers, card numbers, Ghana Card numbers excluded. Hash + reference-table lookup if needed ops-side.
- Event catalogue = code-generated registry; unknown events rejected at ingest
- Every flow's nodes declare which events fire — audit-phase task to verify coverage

**Instrumentation pattern:**
- Events piggyback on §40 DOH heartbeat when online
- Offline queue with idempotency keys; survives device restart; drains on reconnect
- Warehouse hot store: 90 days, real-time dashboards; cold store: Parquet on object storage

**Interlinks:** Every flow → Analytics. §27 Billing consumes metered usage events. §39 Release consumes feature-adoption events. §25 Tenant Lifecycle consumes funnel/onboarding events. §28 Compliance gets zero (privacy boundary).

**Failure modes:**
- Ingest endpoint down → events queue on device → drain later; no loss up to queue cap
- Schema drift → auto-migration mapper; unmappable events → `/ops/analytics/dead-letter`
- PII leak in event (developer bug) → ingest-layer detector blocks + alerts `/ops/security`

**Ops linkage:** `/ops/analytics/funnels`, `/ops/analytics/cohorts`, `/ops/analytics/dead-letter`, `/ops/analytics/catalogue`, + tenant-facing `/trade/analytics`, `/institute/analytics` scoped to own data.

### §41.B — Public Surface & SEO

**Public surfaces enumerated:**
- `dalxic.com` — parent brand, subsidiary routing
- `ops.dalxic.com` — DalxicOperations marketing + trade/institute entry
- `trade.dalxic.com/{signup, pricing, restaurants, retail}`
- `institute.dalxic.com/{signup, pricing}`
- `status.dalxic.com` — platform status page
- `docs.dalxic.com` — product + API docs (when API opens)
- `legal.dalxic.com` — terms, privacy, DPA notices

**SEO foundations (mandatory across all public surfaces):**

| Element | Requirement |
|---|---|
| `robots.txt` | Per-surface explicit allow/disallow; admin & ops routes blocked; reference to `sitemap.xml` |
| `sitemap.xml` | Auto-generated, all public URLs, `lastmod` timestamps; submitted to Google Search Console + Bing Webmaster |
| Meta tags | Unique `<title>`, `<meta description>` 150-160 chars, canonical URL, viewport, charset |
| Open Graph | Every page: `og:title`, `og:description`, `og:image` (1200×630), `og:url`, `og:type` |
| Twitter Card | `summary_large_image` default |
| Schema.org JSON-LD | `Organization`, `Product`, `SoftwareApplication`, `FAQPage`, `LocalBusiness` where applicable |
| Clean URLs | No query-string SEO pages; `/restaurants` not `/page?id=42` |
| Core Web Vitals | LCP < 2.5s, INP < 200ms, CLS < 0.1 — non-negotiable (Google 2024+ ranking signal) |
| `hreflang` | Multi-region: `en-GH`, `en-NG`, `en-KE`, `fr-CI`; later `tw-GH` (Twi), `ha-NG` (Hausa) |

**Bot policy:**
- Allow: Googlebot, Bingbot, DuckDuckBot, YandexBot, BaiduSpider, established AI crawlers (OAI-SearchBot, PerplexityBot — for LLM visibility)
- Block: aggressive scrapers, uncertified bots, mass-crawl IPs
- Rate-limit unknown user agents at edge (Cloudflare / Vercel edge rules)

**Trust surface (SEO + sales):** dedicated Security page (plain-language §40 explanation), Privacy page (DPA + GDPR statement), Reliability page (uptime feed from `status.dalxic.com`).

**Interlinks:** §25 Tenant Lifecycle (signup lives here, conversion → Analytics). §27 Billing (public pricing). §39 Release (coordinated marketing updates). §41.E Observability (public-site SLO).

**Failure modes:**
- SEO regression (broken canonical, sitemap) → weekly Search Console scrape → alert `/ops/marketing`
- Core Web Vitals regression on new release → caught in §39 canary gate
- Defacement / compromise → status-page failover + §41.C incident response

**Ops linkage:** `/ops/marketing/site-health`, `/ops/marketing/seo-dashboard`, `/ops/marketing/content-calendar`, `/ops/compliance` (privacy/terms versions).

### §41.C — Web Application Security

**Distinct from §40 DOH (device ↔ API) and §26 Auth (operator identity).** This layer is **browser ↔ server** — admin dashboards, tenant web UIs, master-ops console, signup flow.

**Mandatory headers (every surface):**

| Header | Value | Defends |
|---|---|---|
| `Content-Security-Policy` | Nonce-based, strict-dynamic, `default-src 'self'`; no `unsafe-inline`; explicit allowlist for analytics + CDN | XSS injection |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Protocol downgrade |
| `X-Frame-Options` | `DENY` (or `frame-ancestors` CSP directive) | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME confusion |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leaks |
| `Permissions-Policy` | Minimal; camera/geolocation/microphone explicit per feature | Feature abuse |
| `Cross-Origin-Opener-Policy` | `same-origin` | Spectre-class leaks |

**Input / output discipline:**
- All user input parameterized at DB layer (no string concatenation) → SQL injection defense
- All user output HTML-encoded at render → XSS defense
- CSRF tokens on state-changing requests (double-submit cookie or synchronized token)
- Secure cookie flags: `HttpOnly`, `Secure`, `SameSite=Lax` (strict on admin/ops surfaces)
- JSON-only APIs for SPA; no dual form/JSON endpoints
- File upload: magic-byte validation, size caps, virus scan for tenant uploads, separate domain for untrusted content

**Rate limiting + bot defense:**

| Endpoint class | Rate limit | Additional |
|---|---|---|
| Login / PIN auth | 5/min per IP + 10/min per account, progressive backoff | Captcha after 3 failures; account lockout at 10 |
| Signup | 3/hour per IP | Email + SMS verification before activation |
| Password reset | 3/hour per account | Email-send rate-limit; token 15-min TTL |
| Public marketing | 300/min per IP | Edge cache; WAF rules |
| API (authenticated) | 600/min per session, 10k/day per tenant | §40 DOH heartbeats exempt |
| Webhook receive (partners) | 100/min per partner | HMAC signature required |

**WAF rules (via Cloudflare / Vercel Firewall):**
- OWASP Core Rule Set — always on
- Country-level blocks for zero-legitimate-traffic regions (tenant-configurable)
- Known-bad-IP feeds (Spamhaus, AbuseIPDB)
- Managed bot-mitigation (allowlist search engines, block scrapers, challenge ambiguous)
- Custom rules: credential-stuffing signatures, slowloris, LFI/RFI attempts

**Dependency hygiene:**
- SBOM maintained (CycloneDX / SPDX)
- Weekly `npm audit` / Snyk / Dependabot runs
- Crypto libraries pinned + reviewed
- Same-day patching for critical CVEs on crypto/auth path
- Quarterly planned dependency upgrade cycle (not per-PR chaos)

**Interlinks:** §40 DOH (browser-originated API calls carry device-session AND/OR user-session token). §26 Auth (session cookies = web manifestation of §26 session tokens). §38 Break-Glass (web-layer kill switch mirrors device-layer). §41.D (scheduled security scans).

**Failure modes:**
- CSP violation reported → `/ops/security/csp-reports` → triaged (legitimate vs attack)
- Rate limit tripped repeatedly from one source → auto-ban 24h + forensic
- Dependency CVE: critical = same-day patch, high = 7 days, medium = 30 days, low = next release

**Ops linkage:** `/ops/security/incidents`, `/ops/security/csp-reports`, `/ops/security/waf-events`, `/ops/security/dependency-cves`, `/ops/security/pentest-findings`.

### §41.D — Scheduler / Worker Spine ("The Robots")

Every implicit cron across the 19 flows made explicit and auditable.

**Complete job catalogue:**

| Job | Frequency | Origin flow | Idempotency key | Critical path? |
|---|---|---|---|---|
| Heartbeat watchdog | Every 1 min | §40 DOH | `(tenant, branch, device, bucket)` | Yes — lockout enforcement |
| Missed-close detector | Daily 23:59 per tenant tz | §23 Day-Close | `(tenant, branch, date)` | No — alerts only |
| Day-lock issuer | Per next-morning handshake | §40 Node 9 | `(tenant, branch, date)` | Yes — immutable close |
| Dunning T+0/+3/+7/+14/+28/+60/+90 | Daily per tenant tz | §27 Billing | `(tenant, invoice, stage)` | Yes — billing cadence |
| Compliance filing scheduler | Monthly / quarterly / annual | §28 | `(tenant, filing_type, period)` | Yes — regulatory |
| CRL publisher | Hourly | §40 security | `(generation)` | Yes — security |
| HSM key-rotation runner | Quarterly | §40 security | `(key_id, generation)` | Yes — security |
| Audit-chain Merkle-root builder | Every 5 min | Every flow | `(tenant, interval)` | Yes — audit integrity |
| Report builder (daily/weekly/monthly) | On schedule | Various | `(tenant, report_id, period)` | No — retriable |
| Backup runner (incremental/full) | Hourly incr; daily full | §41.F | `(vault_id, ts)` | Yes — DR |
| Dead-letter queue processor | Every 10 min | Platform-wide | `(queue_id, message_id)` | No — retriable |
| Session-expiry sweeper | Every 1 min | §26 Auth | `(session_id)` | No — idempotent |
| Entitlement recomputer | On billing event + daily sweep | §25 | `(tenant, version)` | Yes |
| Notification dispatcher (email/SMS/WhatsApp/push) | Continuous | Platform-wide | `(message_id)` | Yes |
| Webhook retry daemon | Exponential backoff | Partners | `(webhook_id, attempt)` | No — retriable |
| Device-cert renewal nudger | Daily | §40 | `(device_id)` | No — alerts only |
| Late-sync reconciler | On reconnect | §40 Node 9 | `(event_id)` | Yes |
| Index vacuum / analyze | Weekly | §41.E DB health | `(table, ts)` | No — operational |
| Search index rebuilder | Daily incr, weekly full | Catalogue features | `(index_id, generation)` | No — retriable |
| Trial-expiry watchdog | Daily | §25 | `(tenant)` | Yes — conversion or suspend |
| Currency rate fetcher | Hourly | §24 Restock FX | `(base, ts)` | No — retriable |
| Canary-health prober | Every 30s during canary | §39 Release | `(release_id, bucket)` | Yes — rollback trigger |
| Analytics ingest cleaner | Daily | §41.A | `(date)` | No — retriable |

**Worker discipline (universal rules):**
- **Idempotency first.** Every job declares its key; re-run must be safe.
- **Distributed lock** (Redis / DB advisory) per key to prevent concurrent runs.
- **Exponential backoff** on failure: 1min, 5min, 15min, 1h, 6h, then dead-letter.
- **Dead-letter queue** surfaces at `/ops/scheduler/dead-letter`.
- **Audit trail** — every run logged: start, end, duration, outcome, key, trigger (auto vs manual).
- **Time-zone aware** — per-tenant tz respected for tz-relative jobs. No global UTC for business events.
- **Manual trigger** — every scheduled job has manual-trigger equivalent (master-ops, dual-approval + reason + audit).
- **Health endpoint** — every worker exposes `/health`; stale worker auto-restarted by orchestrator.
- **Critical-vs-non-critical shed policy** — under capacity pressure, non-critical (index rebuild, analytics cleaner) sheds first; critical (billing, compliance, audit, DOH heartbeat) never shed.

**Interlinks:** Every flow has ≥1 associated job. §41.E monitors success rates. §38 Break-Glass can pause tenant-wide.

**Failure modes:**
- Worker pool exhausted → queue-depth alarm; auto-scale; shed non-critical
- Stuck job (P99×2 duration) → watchdog kills → dead-letter → on-call
- Tz misconfiguration → dunning drift; caught by audit spot-check
- DB corruption affecting source data → fails closed; alerts `/ops/incident`; never silent-propagate

**Ops linkage:** `/ops/scheduler/jobs`, `/ops/scheduler/queue-depth`, `/ops/scheduler/dead-letter`, `/ops/scheduler/history`, `/ops/scheduler/manual-trigger`.

### §41.E — Observability & SRE

**Three pillars, all mandatory:**

| Pillar | Class | Retention |
|---|---|---|
| Structured logs | Correlation-ID threaded JSON | 30d hot / 1y warm / 7y cold (compliance) |
| Metrics | Time-series (Prometheus / Datadog) | 15 months rolling |
| Distributed traces | OpenTelemetry → Jaeger / Tempo / Honeycomb | 7d hot, sampled |

**Correlation IDs everywhere:**
- Every request gets `trace_id` at edge; propagated via headers through all services + jobs
- Logs, metrics, traces all queryable by `trace_id`
- §40 DOH `session_id` + `trace_id` = forensic tuple for any investigation

**SLO catalogue (initial targets — tuned after 90 days of baseline):**

| Surface / flow | SLI | Target |
|---|---|---|
| Sale Journey — checkout latency | P95 | < 2s |
| Sale Journey — availability | success rate | 99.9% monthly |
| DOH morning handshake | P99 | < 1.5s |
| DOH handshake availability | success rate | 99.95% |
| Billing dunning runs | on-schedule rate | 100% (zero misses) |
| Compliance filing | on-deadline rate | 100% |
| Public marketing site | availability | 99.9% |
| Master-ops console | availability | 99.9% |

**Alert discipline:**
- Fast-burn alerts (1h window) → page on-call
- Slow-burn alerts (6h window) → review queue
- No paging on non-actionable signals — informational → dashboards only
- Every alert has a runbook; no alert ships without one
- On-call rotation mandatory for every tier-1 surface before launch

**Incident response:**
- Severity ladder: SEV1 (customer-impacting major), SEV2 (customer-impacting minor), SEV3 (internal only)
- Declared via `/ops/incident/declare` → auto war-room channel, status page update, stakeholder notification
- Post-mortem required for SEV1 + SEV2 within 5 business days; blameless; published internally
- SEV1 post-mortems get external summary on `status.dalxic.com`

**Interlinks:** Monitors all 19 flows + all 6 Platform Concerns. Feeds `/ops/incident` + `/ops/support`. Post-mortems feed §39 (prevent-recurrence gates).

**Failure modes:**
- Observability stack itself down → flight-without-instruments → incident declared → secondary out-of-band alerting (PagerDuty → phone cascade) → **new deploys blocked during blind state** (integrity rule: can't deploy what you can't see)
- Metric cardinality explosion (bad instrumentation) → auto-throttle + alert author
- Log volume runaway → sampling kicks in; ERROR/FATAL preserved

**Ops linkage:** `/ops/infra/slo-dashboard`, `/ops/infra/alerts`, `/ops/incident`, `/ops/incident/post-mortems`, `/ops/infra/traces`, `/ops/infra/logs`.

### §41.F — Data Governance

**Legal frame:** Ghana Data Protection Act 2012 (Act 843) + DPC regulations; GDPR for any EU-resident data. Tighter applies.

**PII catalogue:**

| Class | Examples | Storage | Access |
|---|---|---|---|
| Direct identifiers | Ghana Card, phone, email, full name | Tenant DB, encrypted at rest | Operator (own), tenant owner, master-ops (dual-approval + reason) |
| Behavioural PII | Session patterns, device fingerprints | Security store, hashed where possible | Master-ops security team only |
| Financial PII | Card PAN last-4 (never full), MoMo numbers | Tokenized; full number never stored | Payment gateway only |
| Biometric | None collected (explicit exclusion) | N/A | N/A |
| DPA special category | None currently collected | N/A | N/A |

**Retention schedules:**

| Data | Retention | Why |
|---|---|---|
| Transactional records (sales, receipts) | 7 years | Ghana tax law |
| Audit chain | 7 years | Compliance + integrity |
| Device session records | 2 years | Security forensics |
| Customer contact data | Duration of relationship + 2 years | Legitimate interest |
| Product analytics events | 24 months rolling | Analytical purpose |
| Marketing leads (unconverted) | 2 years or withdrawal of consent | Consent-based |
| Deleted accounts — tombstoned metadata | 90 days then cryptographic shred | Right-to-erasure + audit |

**Data subject rights (operator / owner):**
- **Access** — profile-page export (JSON + CSV); delivered within 14 days
- **Correction** — self-service in profile; corrections logged
- **Deletion** — soft-delete 30 days (retrieval window) → cryptographic shred of PII; audit record retained with pseudo-id
- **Portability** — machine-readable export
- **Objection** — opt-out of marketing; limits elevated-verification scoring
- **Restriction** — pause processing during dispute
- Requested via `/trade/settings/privacy`, `/institute/settings/privacy`; master-ops queue at `/ops/compliance/dsr-queue`

**Disaster Recovery + Backup:**

| Tier | RPO | RTO | Strategy |
|---|---|---|---|
| Transactional DB | 1h | 4h | Streaming replica (separate region) + hourly snapshot + nightly full |
| Audit chain | 5 min | 1h | Multi-region write-through, append-only log, offsite daily |
| Blob storage (receipts, uploads) | 24h | 24h | Cross-region replication |
| Secrets / HSM | 1h | 1h | Multi-region HSM + quorum-sealed backup |
| Analytics warehouse | 24h | 48h | Daily snapshot (non-critical) |

**Restore drills:**
- Monthly automated restore-to-staging test
- Quarterly live drill (declared maintenance window, restore-from-scratch)
- Annual tabletop: full-regional-loss scenario

**Accessibility:**
- WCAG 2.1 Level AA target for all tenant-facing surfaces
- Keyboard navigation full coverage; screen-reader labels on every interactive element; color-contrast AA minimum
- Accessibility audit per major release (§39 canary gate)

**Internationalization (i18n):**
- Default: English (Ghana) `en-GH`
- Roadmap: English (Nigeria / Kenya), French (Côte d'Ivoire), Twi (Ghana), Yoruba (Nigeria), Hausa (Northern Nigeria), Swahili (Kenya / Tanzania)
- All strings externalized from day 1; translation files versioned
- Date/time/currency/number per locale
- Ghana baked in: GHS currency, African date formats, SSNIT ID shapes, Ghana Card patterns

**Interlinks:** Touches every flow (every flow processes data → retention implications). §27 Billing + §28 Compliance inherit tax retention. §40 DOH inherits security retention. §41.A inherits analytics retention.

**Failure modes:**
- Failed backup → alert `/ops/infra/backup-health`; manual investigation; **no "retry quietly"**
- Failed restore drill → post-mortem; RTO/RPO re-evaluated
- DSR request exceeds SLA → legal exposure; auto-escalate at T+10 days
- PII detected in analytics (filter miss) → event purged; incident declared

**Ops linkage:** `/ops/compliance/dsr-queue`, `/ops/compliance/retention-audit`, `/ops/infra/backup-health`, `/ops/infra/dr-drills`, `/ops/compliance/pii-catalogue`, `/ops/compliance/accessibility-audits`.

### §41.G — Platform Concerns × Flows interlink matrix

Each flow's audit row is unresolved until every ✓ traces to a concrete implementation decision.

| Flow | 23.A Analytics | 23.B Public/SEO | 23.C Web Sec | 23.D Scheduler | 23.E Observability | 23.F Governance |
|---|---|---|---|---|---|---|
| §21 Sale | ✓ (events) | — | ✓ (web UI) | ✓ (late-sync) | ✓ (SLO) | ✓ (7y retention) |
| §22 Reversal | ✓ | — | ✓ | — | ✓ | ✓ |
| §23 Day-Close | ✓ | — | ✓ | ✓ (missed-close watchdog) | ✓ | ✓ |
| §24 Restock | ✓ | — | ✓ | ✓ (FX, PO ageing) | ✓ | ✓ |
| §25 Tenant Lifecycle | ✓ (funnel) | ✓ (signup) | ✓ | ✓ (trial-expiry) | ✓ | ✓ |
| §26 Auth | ✓ (security) | ✓ (login surfaces) | ✓ (session) | ✓ (session-sweeper) | ✓ | ✓ |
| §27 Billing | ✓ (metering) | ✓ (pricing) | ✓ | ✓ (dunning cadence) | ✓ | ✓ |
| §28 Compliance | ✓ (ops only) | — | ✓ | ✓ (filing scheduler) | ✓ | ✓ |
| §11–13 Institute | ✓ | ✓ (signup) | ✓ | ✓ (term-boundary) | ✓ | ✓ |
| §32 Reservation | ✓ | ✓ (book widget) | ✓ | ✓ (reminder SMS) | ✓ | ✓ |
| §33 Expense | ✓ | — | ✓ | ✓ (approval reminders) | ✓ | ✓ |
| §34 Inventory Count | ✓ | — | ✓ | ✓ (scheduled counts) | ✓ | ✓ |
| §35 Multi-Branch Transfer | ✓ | — | ✓ | ✓ (in-transit watchdog) | ✓ | ✓ |
| §36 Support | ✓ (ticket metrics) | ✓ (help center) | ✓ | ✓ (SLA watchers) | ✓ | ✓ |
| §37 Remote Assistance | ✓ (security) | — | ✓ | — | ✓ | ✓ |
| §38 Break-Glass | ✓ (forensic) | — | ✓ | ✓ (kill propagator) | ✓ | ✓ |
| §39 Release Rollout | ✓ (adoption) | ✓ (release notes) | ✓ | ✓ (canary prober) | ✓ | ✓ |
| §40 DOH | ✓ (security) | — | ✓ | ✓ (heartbeat, CRL, HSM) | ✓ | ✓ |

---

## §42. Open questions for the audit phase

To stress-test before implementation begins:

1. **Concurrent inventory race** — is the optimistic-lock approach acceptable, or do we need hard reservations at cart-add time? (Critical for restaurant — "last steak" scenario with 3 tables ordering.)
2. **GRA E-VAT latency** — what is GRA's SLA? If their endpoint is slow/down, how long do we queue before surfacing to the tenant?
3. **Offline sync conflict resolution** — when prices changed while offline, should the sync automatically re-price, or surface for manager review each time?
4. **Commission accrual timing** — accrue on sale, on shift close, or on payroll run? Reversibility on refund?
5. **Loyalty/promo priority engine** — who defines the stacking rules: platform-wide default, tenant-overridable, or both?
6. **Partial tender abandonment** — cashier enters GHS 100 cash, customer changes mind before MoMo — what's the unwind path?
7. **Multi-branch sale** — can a sale be rung in one branch but delivered from another's stock? (Affects Restock Journey interlink.)
8. **First-day UX** — quick-add product during sale or force catalogue setup first? Tenant preference or platform policy?
9. **Tip-out distribution rules** — tenant-configurable (server 80%, runner 10%, kitchen 10%)? Per-shift or daily? Reversal on refund?
10. **Service charge vs tip** — are they both revenue, or is service charge revenue and tip liability? (Ghana practice check.)
11. **Recipe substitution on out-of-ingredient** — auto-substitute or force 86 + manual swap?
12. **Bar tab persistence** — how long can a tab stay open? Cross-shift? Cross-day? Identity requirements at open?
13. **Age verification storage** — scan ID once and reuse, or every alcohol purchase? DPA implications.
14. **Multi-device race policy** — same cashier on 2 devices: block, swap, or mirror? Configurable per tenant?
15. **Device storage quota** — how much local queue is "too much"? When to force sync?

---


---

# PART V — EXECUTION

> Audit gates, build phases, slot matrix, offline sync, changelog.

## §43. v1.3 audit and approval gate

All 19 flows (§21–§40), 6 Platform Concerns (§41.A–§41.F), and the Patchflow principle (§19 #2 + §19.A contract template) are now inked end-to-end. The §41.G interlink matrix binds every flow to every Platform Concern it depends on. No further flows or platform concerns are pending scope.

### 25.1 Audit checklist (original v1.2 expectations)

1. **Termination check** — every node terminates, no orphan states, no dangling branches.
2. **Merge-point symmetry** — every interlink declared in flow X.10 also appears in the partner flow's X.10 with matching direction and payload shape.
3. **Intersection slot sanity** — every slot has a default behaviour, not just vertical plug-ins; every plug-in names the slot it plugs into.
4. **Offline parity** — every flow has an offline variant OR an explicit "online-only, HARD BLOCK when offline" declaration.
5. **Ops linkage completeness** — every flow routes to at least the 4 mandatory `/ops` routes (audit, support, analytics, compliance) with explicit payload contracts.
6. **Integrity-rule consistency** — audit-pipeline-down HARD BLOCK, blind-count-then-reveal, contra-journal reversal, three-way match, idempotency keys — applied uniformly wherever relevant.
7. **Open question triage** — open questions from §42 resolved or explicitly deferred with owner.

### 25.2 v1.3 patchflow audit lens (new — 2026-04-16)

Added under §19 #2 and §19.A. The lens: *"every add-on path must flow through a slot, never through the spine."* Audit report covered below.

**Audit findings (2026-04-16):**

| Dimension | Status | Notes |
|---|---|---|
| Spine clarity (vertical-agnostic) | **PASS** | §21, §22, §23, §40 have neutral spines. Vertical-specific prose extracted to slot definitions in v1.3 sweep. |
| Slot catalogue completeness | **PASS** | All 19 flows have named, numbered slots. §21 expanded by 6 slots (S0, S5.5, S14.5, S15.0, S15.5, S17.5) in v1.3. |
| Slot contract discipline | **PARTIAL — Phase 1 COMPLETE, Phase 2 DEFERRED** | See §43.3. |
| Missing-slot coverage | **PASS** | 6 Phase 2 modules (loyalty pricing, QR-at-table, batch FIFO, multi-branch fulfilment, cold-chain, incentive-calc) that previously lacked slots now have S-series entries. |
| Spine leaks | **PASS** | Initial 13 leaks across §21, §22, §23, §24 rewritten in v1.3 first pass. Completionist sweep 2026-04-16 (second pass) scrubbed residual vertical-specific prose in §22 (R13/R14/S7/S14 references), §23 (C7/C11/S7/S12/S13/S14 references), §24 (P2/P7/P10/P11 references), §25 (T7/T1 slot references), §26 (A7/S14 references), §34 (P10 reference). Spine now vertical-neutral end-to-end; vertical prose exists only in comparative slot tables, §19.A examples, module ops tables, §29–§32 vertical-specific flow headers, and §43 deferred contract tracking. |
| Connection-type classification | **PARTIAL — Phase 1 COMPLETE, Phase 2 DEFERRED** | Phase 1 slots classified as N/HN/DN. Phase 2 slots carry catalogue defaults but classification closes with their owning module. |

### 25.3 Phase 1 vs Phase 2 contract closure

**Phase 1 (boutique-first) — spine + critical slots must ship contract-closed.** Done in v1.3:

- §21 Sale Journey: S0, S1, S3, S4, S5, S5.5, S7, S14, S14.5, S15.0, S15, S15.5, S16, S17, S17.5, S18, S21 — full contracts inked in §21.4.A
- §22 Reversal: R1, R3, R7, R8, R9, R10, R14, R15 — full contract cohort per §22.4.A
- §23 Day-Close: C1, C2, C3, C4, C5, C6, C12, C15 — full contract cohort per §23.4.A. **C7 contradiction resolved to De-normaled for tip-bearing verticals.**
- §24 Restock: P1, P2, P3, P4, P7, P8, P14, P15 — full contract cohort per §24.4.A
- §25 Tenant Lifecycle: T1, T5, T6, T7, T8, T11 — full contract cohort per §25.4.A
- §26 Auth: A1, A2, A3, A4, A7, A11, A12 — full contract cohort per §26.4.A
- §27 Billing: B1, B2, B3, B6, B7, B9 — full contract cohort per §27.4.A
- §28 Compliance: CP1, CP2, CP6, CP9, CP10 — full contract cohort per §28.4.A
- §40 DOH: DH1, DH2, DH3, DH4, DH5, DH7, DH9 — full contract cohort per §40.4.A

Phase 1 contract closure is sufficient for **boutique + basic POS + basic day-close + basic restock + tenant onboarding + auth + billing + GRA compliance + DOH** to ship. No spine surgery required for boutique go-live.

**Phase 2 contract closure — deferred to each module's build window.**

The following are slot-catalogue-complete with contracts pending. Until contracts close, spine treats each as normaled-passthrough with catalogue defaults. No third-party module plug-ins permitted until contracts close.

| Module | Owns slots | Phase 2 closure trigger |
|---|---|---|
| Camera Catalogue | S2 | Camera-first catalogue build |
| Restaurant KDS | S6 (fire-to-fulfilment) | Restaurant vertical build |
| CRM / Customers | S8 | CRM module build |
| Restaurant Menu & Recipes | S9, S10 | Restaurant vertical build |
| Restaurant Tabs | S11, S12, S13 | Restaurant vertical build |
| Age-Gate | S19 | Alcohol / regulated-sale tenant onboarding |
| Cart Hold | S20 | Queue-management add-on |
| §22 Reversal Phase 2 | R2, R4, R5, R6, R11, R12, R13 | When reversal module gets restaurant-aware variants |
| §23 Day-Close Phase 2 | C7 (restaurant tip-out), C8, C9, C10, C11, C13, C14 | Restaurant + Multi-shift builds |
| §24 Restock Phase 2 | P5, P6, P9, P10, P11, P12, P13 | Restaurant ingredient + storage routing |
| §25 Tenant Lifecycle Phase 2 | T2, T3, T4, T9, T10, T12 | Onboarding studio + export pipeline |
| §26 Auth Phase 2 | A5, A6, A8, A9, A10 | Restaurant + multi-role handoff |
| §27 Billing Phase 2 | B4, B5, B8, B10, B11, B12 | Add-on store + hardware marketplace |
| §28 Compliance Phase 2 | CP3, CP4, CP5, CP7, CP8, CP11 | Each regulated vertical (pharmacy, tourism, institute) |
| §29 Enrollment (E-series) | all | Institute vertical build |
| §30 Attendance (AT-series) | all | Institute vertical build |
| §31 Fees (FE-series) | all | Institute vertical build |
| §32 Reservation (RV-series) | all | Restaurant vertical build |
| §33 Expense (EX-series) | all | Petty-cash add-on |
| §34 Inventory Count (IC-series) | all | Inventory add-on |
| §35 Multi-Branch Transfer (MB-series) | all | Multi-branch tier |
| §36 Support (SP-series) | all | Support console build |
| §37 Remote Assistance (RA-series) | all | Remote-assist build |
| §38 Break-Glass (BG-series) | all | Incident-response readiness |
| §39 Release Rollout (RR-series) | all | CI/CD hardening |
| §40 DOH Phase 2 | DH6, DH8, DH10 | Broadcast module + starter-task theming |
| §41 Platform Concerns | all (as slot catalogues) | Each concern grows slots as modules stack |

This deferral is explicit, audited, and allowed under §19 Patchflow principle — **"Phase 1 = spine frozen + slot matrix open."** Add-ons are normal operating procedure, not exceptions.

### 25.4 Approval to commence Phase 1 build

Once §43.1 checklist passes AND §43.3 Phase 1 contracts are sign-off confirmed:

1. Gate opens for Phase 1 boutique-first coding.
2. Zero-cost stack applies (per `feedback_zero_cost_until_revenue`): Vercel Hobby + Neon free tier + software Ed25519 keys via `@noble/ed25519` + Pusher free + Vercel Cron + Brevo 300/day free + WhatsApp Cloud API 1000/mo free + pay-as-you-go SMS/MoMo.
3. Target market: simple boutiques (per `project_operations_boutique_first`) — 5-min signup, photo catalogue, Cash+MoMo, printed/WhatsApp receipts, simple stock, GHS 50–100/mo.
4. HSM migration (AWS CloudHSM / GCP Cloud KMS) deferred until first annual Tier B tenant signs.
5. Build order: Tenant Lifecycle + Auth + DOH foundation → Billing → Sale + Reversal + Day-Close commercial spine → Restock + Compliance. Phase 2 modules plug into pre-declared slots as tenants demand; no spine surgery.

Backend implementation remains gated on audit pass per `feedback_map_before_build`.

---

## §44. Execution Phases — Build Timeline

> Added v1.4 to close Gap 1 from peer review: "It's a blueprint, not a build plan."

### 26.1 Phase Overview

| Phase | Codename | Scope | Flows Active | Est. Duration | Gate |
|---|---|---|---|---|---|
| **P1** | Boutique | Simple retail POS for small shops (GHS 50–100/mo) | §21 Sale, §22 Return, §23 Day-Close, §24 Restock, §25 Tenant Lifecycle | 6–8 weeks | First paying tenant |
| **P2** | Foundation | Auth hardening, billing automation, compliance filings, offline sync | §26 Auth, §27 Billing, §28 Compliance, §40 DOH (software keys) | 4–6 weeks | 10 tenants stable |
| **P3** | Multi-Vertical | Restaurant plug-ins, Institute vertical, multi-branch | §29–§32 Institute+Restaurant, §33 Expense, §34 Inventory Count, §35 Multi-Branch Transfer | 8–12 weeks | Revenue covers Neon Pro |
| **P4** | Enterprise | Support console, remote assist, break-glass, release rollout, HSM migration | §36 Support, §37 Remote Assist, §38 Break-Glass, §39 Release Rollout, §40 DOH (HSM) | 6–8 weeks | First Tier B annual tenant |

Total runway: ~24–34 weeks from Phase 1 kickoff to full platform.

### 26.2 Phase 1 — Boutique (6–8 weeks)

**Goal:** A boutique in Osu can sign up, add products, sell via Cash + MoMo, close the day, restock, and get a WhatsApp receipt — all on a phone.

| Week | Deliverable | Flows | Acceptance |
|---|---|---|---|
| W1–2 | Tenant signup + operator auth + PIN login | §25 Nodes 1–4, §26 Nodes 1–5 (simplified) | Tenant signs up, operator logs in with PIN, session persists |
| W2–3 | Product catalogue + POS sale flow | §21 Nodes 1–4, §24 Node 1 (manual restock) | Add product → sell → Cash/MoMo tender → receipt prints/WhatsApp |
| W3–4 | Day-close + Z-report | §23 Nodes 1–8 | Blind count → variance → Z-report → day locked |
| W4–5 | Returns + refunds | §22 Nodes 1–7 | Void same-day, refund prior-day, exchange |
| W5–6 | Restock (PO → receive → GRN) | §24 Nodes 1–8 | Draft PO → goods arrive → inventory updated → landed cost |
| W6–7 | GRA E-VAT transmission | §28 Node 1 (E-VAT only) | Each receipt fires E-VAT; offline queue drains |
| W7–8 | Polish, demo data, field test | All P1 flows | End-to-end boutique journey, 3 real shops tested |

**Offline in Phase 1:** Cash-only offline mode with local journal queue and sync-on-reconnect. Full offline sync protocol (§46) ships in Phase 2 but the queue infrastructure is laid in Phase 1.

**Slots active in Phase 1:** See §45 Master Slot Matrix for the complete noop/impl marking.

### 26.3 Phase 2 — Foundation (4–6 weeks)

**Goal:** Platform can bill tenants, enforce compliance, and survive sustained offline.

| Week | Deliverable | Flows |
|---|---|---|
| W1–2 | Full auth (MFA, step-up, device enrolment) | §26 complete |
| W2–3 | Billing engine (metering, invoicing, dunning) | §27 complete |
| W3–4 | Compliance filings (monthly VAT, SSNIT, PAYE) | §28 complete |
| W4–5 | DOH handshake (software Ed25519, Tier A only) | §40 Nodes 1–9 (no HSM) |
| W5–6 | Offline sync protocol (§46) fully operational | Cross-cutting |

### 26.4 Phase 3 — Multi-Vertical (8–12 weeks)

**Goal:** Restaurant and Institute verticals ship; multi-branch tenants supported.

| Week | Deliverable | Flows |
|---|---|---|
| W1–3 | Restaurant plug-ins (KDS, tabs, reservations, tips) | §21 S6/S9–S13, §32 |
| W3–5 | Institute vertical (enrollment, attendance, fees) | §29, §30, §31 |
| W5–7 | Expense management + inventory count | §33, §34 |
| W7–9 | Multi-branch transfer with atomic inventory | §35 (expanded per §35.3) |
| W9–12 | Cross-vertical testing + migration tooling | All §29–§35 |

### 26.5 Phase 4 — Enterprise (6–8 weeks)

**Goal:** Ops console fully operational; Tier B DOH with HSM; enterprise-ready.

| Week | Deliverable | Flows |
|---|---|---|
| W1–2 | Support console + ticketing | §36 |
| W2–4 | Remote assistance (co-pilot + takeover) | §37 |
| W4–5 | Break-glass + device kill | §38 |
| W5–6 | Release rollout (canary, wave, rollback) | §39 |
| W6–8 | HSM migration for DOH (AWS CloudHSM / GCP Cloud KMS) | §40 Tier B |

### 26.6 Build Order Dependencies

```
§7 Tenant Lifecycle ──┐
§8 Auth ──────────────┤
                      ├──→ §21 Sale Journey ──→ §22 Return ──→ §23 Day-Close
                      │         │
§22 DOH (software) ───┘         ├──→ §24 Restock
                                └──→ §28 Compliance (E-VAT)
                                
§9 Billing ──→ (standalone, wires into §25 suspend interlink)

§28 Offline Sync ──→ gates Phase 3 multi-branch + restaurant

§29–§32 ──→ light up vertical-specific slots on §21–§28 spines

§36–§39 ──→ ops-layer, no spine dependency
```

---

## §45. Master Slot Implementation Matrix

> Added v1.4 to close Gap 2 from peer review: "19 flows × 21+ slots each = ~400 intersection points. Phase 1 should explicitly mark which slots are noop vs implemented."

**Legend:** `P1` = Phase 1 implemented (full contract) · `noop` = Phase 1 noop (normaled passthrough) · `P2` = Phase 2 · `P3` = Phase 3 · `P4` = Phase 4 · `—` = not applicable

### §3 Sale Journey (S-series: 21 slots)

| Slot | Name | Phase | Rationale |
|---|---|---|---|
| S0 | Cart initiation | **P1** | Every sale starts here |
| S1 | Item entry | **P1** | Core POS |
| S2 | Camera catalogue | noop | No camera hardware P1 |
| S3 | Tender method | **P1** | Cash + MoMo |
| S4 | Cart container | **P1** | Cart state management |
| S5 | Promo / discount | **P1** | Manual discount only |
| S5.5 | Loyalty price override | noop | No loyalty module P1 |
| S6 | Fulfilment (fire-to-kitchen) | noop | Restaurant P3 |
| S7 | Availability check | **P1** | Stock-level check |
| S8 | CRM / customer lookup | noop | No CRM P1 |
| S9 | Menu & recipes | noop | Restaurant P3 |
| S10 | Menu modifiers | noop | Restaurant P3 |
| S11 | Tab open | noop | Restaurant P3 |
| S12 | Tab accumulate | noop | Restaurant P3 |
| S13 | Tab close | noop | Restaurant P3 |
| S14 | Tax calculation (E-VAT) | **P1** | GRA mandatory |
| S14.5 | Cold-chain gate | noop | Pharmacy/perishables P3 |
| S15 | Inventory decrement | **P1** | Core stock |
| S15.0 | Fulfilment branch resolution | noop | Multi-branch P3 |
| S15.5 | Batch/FIFO picker | noop | Pharmacy/perishables P3 |
| S16 | Receipt | **P1** | Print + WhatsApp |
| S17 | Delivery / handoff | **P1** | Bag-and-go for retail |
| S17.5 | Commission / incentive | noop | No commission P1 |
| S18 | Post-sale ripple | **P1** | Analytics + audit |
| S19 | Age gate | noop | Alcohol/regulated P3 |
| S20 | Cart hold | noop | Queue-management add-on |
| S21 | Sale complete | **P1** | Terminal state |

**P1 total: 13 impl / 12 noop**

### §4 Return / Refund / Void (R-series: 15 slots)

| Slot | Name | Phase | Rationale |
|---|---|---|---|
| R1 | Reversal trigger | **P1** | Core return |
| R2 | Original-sale search method | noop | Advanced search P2 |
| R3 | Reversal scope | **P1** | Full/partial/exchange |
| R4 | Comp authorization | noop | Restaurant P3 |
| R5 | Kitchen void-after-fire | noop | Restaurant P3 |
| R6 | Ingredient reversal | noop | Restaurant P3 |
| R7 | Approval routing | **P1** | Manager PIN |
| R8 | Refund method | **P1** | Cash/MoMo reverse |
| R9 | Inventory re-instate | **P1** | Stock restored |
| R10 | GL posting | **P1** | Contra-journal |
| R11 | Tip reversal | noop | Restaurant P3 |
| R12 | Tab reversal | noop | Restaurant P3 |
| R13 | Vertical-specific reversal | noop | Per-vertical P3 |
| R14 | Compliance (E-VAT credit note) | **P1** | GRA mandatory |
| R15 | Fraud signal | **P1** | Core ops |

**P1 total: 8 impl / 7 noop**

### §5 Day-Close (C-series: 15 slots)

| Slot | Name | Phase | Rationale |
|---|---|---|---|
| C1 | Close scope (shift/till/branch) | **P1** | Single-till close |
| C2 | Denomination breakdown | **P1** | Cash count |
| C3 | Blind-count enforcement | **P1** | Integrity pattern |
| C4 | Variance threshold | **P1** | Configurable |
| C5 | Investigation workflow | **P1** | Mandatory above threshold |
| C6 | Cash drop method | **P1** | Banking prep |
| C7 | Tip-out reconciliation | noop | Restaurant P3 (De-normaled) |
| C8 | Service charge allocation | noop | Restaurant P3 |
| C9 | Multi-shift roll-up | noop | Multi-shift P3 |
| C10 | Kitchen waste reconciliation | noop | Restaurant P3 |
| C11 | Vertical close extras | noop | Per-vertical P3 |
| C12 | Z-report template | **P1** | Standard retail Z |
| C13 | Multi-branch roll-up | noop | Multi-branch P3 |
| C14 | Shift-handoff cash bridge | noop | Multi-shift P3 |
| C15 | Compliance filing trigger | **P1** | E-VAT daily |

**P1 total: 8 impl / 7 noop**

### §6 Restock (P-series: 15 slots)

| Slot | Name | Phase | Rationale |
|---|---|---|---|
| P1 | Reorder trigger | **P1** | Manual + low-stock alert |
| P2 | PO template | **P1** | Standard PO |
| P3 | Approval caps | **P1** | Role-based |
| P4 | Supplier catalogue | **P1** | Basic supplier list |
| P5 | Ingredient linking | noop | Restaurant P3 |
| P6 | Recipe cost cascade | noop | Restaurant P3 |
| P7 | GRN template | **P1** | Standard GRN |
| P8 | Landed cost method | **P1** | By-value default |
| P9 | Cold-chain receiving | noop | Perishables P3 |
| P10 | Batch/expiry | noop | Pharmacy P3 |
| P11 | Storage routing | noop | Restaurant P3 |
| P12 | Supplier payment method | noop | Advanced AP P3 |
| P13 | WHT / Input VAT | noop | Advanced compliance P3 |
| P14 | Compliance hook | **P1** | GRN → inventory valuation |
| P15 | Fraud signal | **P1** | Core ops |

**P1 total: 8 impl / 7 noop**

### §7 Tenant Lifecycle (T-series: 12 slots)

| Slot | Name | Phase | Rationale |
|---|---|---|---|
| T1 | Starter pack | **P1** | Demo data seeded |
| T2 | Onboarding tour | noop | Onboarding studio P2 |
| T3 | Day-1 tasks | noop | Starter-task theming P2 |
| T4 | Signup questions | noop | Onboarding studio P2 |
| T5 | Tier-module mapping | **P1** | Entitlement engine |
| T6 | Usage caps | **P1** | Products, operators, branches |
| T7 | Compliance pack | **P1** | GRA TIN, VAT |
| T8 | Export format | **P1** | CSV baseline |
| T9 | Retention class | noop | Export pipeline P2 |
| T10 | Merge/split | noop | Enterprise P4 |
| T11 | Ghana-specific KYC | **P1** | Ghana Card, TIN |
| T12 | Vertical onboarding | noop | Per-vertical P3 |

**P1 total: 6 impl / 6 noop**

### §8 Auth / Session (A-series: 12 slots)

| Slot | Name | Phase | Rationale |
|---|---|---|---|
| A1 | Session binding | **P1** | Operator → till → shift |
| A2 | Idle timeout | **P1** | 15/60 min |
| A3 | Hard timeout | **P1** | 4h/12h/24h |
| A4 | Step-up cap catalogue | **P1** | Retail cap list |
| A5 | Handoff pattern | noop | Multi-shift P3 |
| A6 | Role catalogue extensions | noop | Per-vertical P3 |
| A7 | MFA sensitivity | **P1** | Owner enforced |
| A8 | Approval routing | noop | Per-vertical P3 |
| A9 | Device-role affinity | noop | Device types P3 |
| A10 | Restricted-action identity | noop | Regulated verticals P3 |
| A11 | Session-bound context | **P1** | Shift + till + branch |
| A12 | Audit granularity | **P1** | Standard auth events |

**P1 total: 7 impl / 5 noop**

### §9 Billing (B-series: 12 slots)

| Slot | Name | Phase | Rationale |
|---|---|---|---|
| B1 | Metered units | **P2** | Billing ships P2 |
| B2 | Included-in-tier allotments | **P2** | Billing ships P2 |
| B3 | Overage rates | **P2** | Billing ships P2 |
| B4 | Add-on catalogue | noop | Add-on store P3 |
| B5 | Setup fee schedule | noop | Enterprise P4 |
| B6 | Pro-ration granularity | **P2** | Billing ships P2 |
| B7 | Tax treatment | **P2** | Billing ships P2 |
| B8 | Invoice template | noop | Custom templates P3 |
| B9 | Dunning cadence | **P2** | Billing ships P2 |
| B10 | Partner commission schema | noop | Partner programme P4 |
| B11 | Hardware pass-through | noop | Hardware marketplace P4 |
| B12 | Enterprise billing template | noop | Enterprise P4 |

**P2 total: 6 impl / 6 noop**

### §10 Compliance / Filing (CP-series: 11 slots)

| Slot | Name | Phase | Rationale |
|---|---|---|---|
| CP1 | Tax stack | **P1** | VAT/NHIL/GETFund/COVID |
| CP2 | E-VAT scope | **P1** | Per-receipt transmission |
| CP3 | Sector-specific filings | noop | Per-vertical P3 |
| CP4 | Employee class for SSNIT | noop | Payroll P3 |
| CP5 | Signatory class | noop | Enterprise P4 |
| CP6 | Deadline cadence | **P2** | Monthly filing ships P2 |
| CP7 | Refund cases | noop | Regulated verticals P3 |
| CP8 | Sector inspection logs | noop | Pharmacy/food P3 |
| CP9 | Threshold registration | **P2** | VAT registration check |
| CP10 | Payment channels to authority | **P2** | GRA payment |
| CP11 | Authority contact + escalation | noop | Support console P4 |

**P1 total: 2 impl / P2 total: 3 impl / 6 noop**

### §11 Enrollment (E-series: 8 slots) — ALL Phase 3

| Slot | Name | Phase |
|---|---|---|
| E1 | Application fields | **P3** |
| E2 | Decision authority | **P3** |
| E3 | Placement logic | **P3** |
| E4 | Assessment | **P3** |
| E5 | Fee template | **P3** |
| E6 | Guardian model | **P3** |
| E7 | MIS reporting | **P3** |
| E8 | Privacy + minors | **P3** |

### §12 Attendance (AT-series: 6 slots) — ALL Phase 3

| Slot | Name | Phase |
|---|---|---|
| AT1 | Session granularity | **P3** |
| AT2 | Capture method | **P3** |
| AT3 | Exception tags | **P3** |
| AT4 | Notification triggers | **P3** |
| AT5 | Reporting period | **P3** |
| AT6 | Compliance hook | **P3** |

### §13 Fees (FE-series: 8 slots) — ALL Phase 3

| Slot | Name | Phase |
|---|---|---|
| FE1 | Fee model | **P3** |
| FE2 | Discount catalogue | **P3** |
| FE3 | Delivery channels | **P3** |
| FE4 | Payment methods | **P3** |
| FE5 | Arrears policy | **P3** |
| FE6 | Sponsor linkage | **P3** |
| FE7 | Portal surfaces | **P3** |
| FE8 | Receipt template | **P3** |

### §14 Reservation (RV-series: 7 slots) — ALL Phase 3

| Slot | Name | Phase |
|---|---|---|
| RV1 | Booking channels | **P3** |
| RV2 | Deposit policy | **P3** |
| RV3 | Turn time | **P3** |
| RV4 | Preferred table | **P3** |
| RV5 | Special requests | **P3** |
| RV6 | Guest database | **P3** |
| RV7 | Walk-in queue | **P3** |

### §15 Expense (EX-series: 7 slots) — ALL Phase 3

| Slot | Name | Phase |
|---|---|---|
| EX1 | Category catalogue | **P3** |
| EX2 | Approval caps | **P3** |
| EX3 | Receipt requirement | **P3** |
| EX4 | Project / cost center | **P3** |
| EX5 | Reimbursement flow | **P3** |
| EX6 | Tax treatment | **P3** |
| EX7 | Fraud signals | **P3** |

### §16 Inventory Count (IC-series: 6 slots) — ALL Phase 3

| Slot | Name | Phase |
|---|---|---|
| IC1 | Count unit | **P3** |
| IC2 | Frequency norm | **P3** |
| IC3 | Blind enforcement | **P3** |
| IC4 | Variance threshold | **P3** |
| IC5 | Write-off routing | **P3** |
| IC6 | Dual sign-off | **P3** |

### §17 Multi-Branch Transfer (MB-series: 5 slots) — ALL Phase 3

| Slot | Name | Phase |
|---|---|---|
| MB1 | Transfer unit | **P3** |
| MB2 | Cold-chain tracking | **P3** |
| MB3 | Driver tracking | **P3** |
| MB4 | In-transit grace | **P3** |
| MB5 | Variance threshold | **P3** |

### §18 Support (SP-series: 5 slots) — ALL Phase 4

| Slot | Name | Phase |
|---|---|---|
| SP1 | Signal channels | **P4** |
| SP2 | Triage depth | **P4** |
| SP3 | SLA | **P4** |
| SP4 | Agent skill routing | **P4** |
| SP5 | Remote-assist default | **P4** |

### §19 Remote Assistance (RA-series: 5 slots) — ALL Phase 4

| Slot | Name | Phase |
|---|---|---|
| RA1 | Consent depth | **P4** |
| RA2 | Mode restriction | **P4** |
| RA3 | Masked fields | **P4** |
| RA4 | Recording | **P4** |
| RA5 | Agent identity | **P4** |

### §20 Break-Glass (BG-series: 4 slots) — ALL Phase 4

| Slot | Name | Phase |
|---|---|---|
| BG1 | Approval depth | **P4** |
| BG2 | Duration cap | **P4** |
| BG3 | Scope limitation | **P4** |
| BG4 | Wipe completeness | **P4** |

### §21 Release Rollout (RR-series: 5 slots) — ALL Phase 4

| Slot | Name | Phase |
|---|---|---|
| RR1 | Canary scope | **P4** |
| RR2 | Wave dwell | **P4** |
| RR3 | Rollback strategy | **P4** |
| RR4 | Tenant notice | **P4** |
| RR5 | Vertical scoping | **P4** |

### §22 DOH (DH-series: 10 slots)

| Slot | Name | Phase | Rationale |
|---|---|---|---|
| DH1 | Handshake policy tier | **P2** | DOH ships P2 |
| DH2 | Business-day anchor | **P2** | DOH ships P2 |
| DH3 | Heartbeat interval | **P2** | DOH ships P2 |
| DH4 | Offline grace thresholds | **P2** | DOH ships P2 |
| DH5 | Pre-handshake challenge | **P2** | DOH ships P2 |
| DH6 | Broadcast payload | noop | Broadcast module P4 |
| DH7 | Canary check set | **P2** | DOH ships P2 |
| DH8 | Post-handshake starter task | noop | Starter-task theming P4 |
| DH9 | Token TTL | **P2** | DOH ships P2 |
| DH10 | Event stream piggyback policy | noop | Full piggybacking P4 |

**P2 total: 7 impl / 3 noop**

### 27.1 Summary Counts

| Phase | Implemented | Noop/Deferred | Total |
|---|---|---|---|
| **P1** | 52 | 50 | 102 |
| **P2** (lights up) | 16 | — | 16 |
| **P3** (lights up) | 60 | — | 60 |
| **P4** (lights up) | 19 | — | 19 |
| **Grand total** | — | — | **197 slots** |

Phase 1 implements **52 of 197 slots** — the minimum viable surface for boutique POS. Every noop slot is a normaled passthrough with catalogue defaults; no spine surgery required to light them up later.

---

## §46. Offline Sync Protocol

> Added v1.4 to close Gap 3 from peer review: "Offline-first is mentioned everywhere but the offline sync protocol isn't specified. This is the hardest engineering problem in the whole system."

### 28.1 Design Decision: Server-Authoritative with Client Retry Queue

**Not CRDT.** Rationale: CRDTs are optimal for multi-writer collaborative documents (Google Docs, Figma). A POS is single-writer-per-device with clear ownership boundaries — the cashier on THIS device owns THIS cart. Conflict rate is low (same SKU sold on two devices simultaneously while both offline). CRDT complexity (vector clocks, merge functions, tombstones) is not justified.

**Not last-write-wins.** Rationale: LWW silently discards data. A sale that happened is a sale that happened — you cannot silently drop it because another device also sold the last unit.

**Server-authoritative with client retry queue:** The server is the single source of truth. Clients queue events locally when offline and replay them to the server on reconnect. The server validates each event against current state and either accepts, rejects, or flags for human review.

### 28.2 Client-Side Queue

Every user action that would normally hit the server is captured as an **Event Packet**:

```
EventPacket {
  id:          UUID v7 (time-sortable)
  device_id:   string
  tenant_id:   string
  branch_id:   string
  operator_id: string
  flow:        string          // "sale" | "return" | "day_close" | "restock" | ...
  action:      string          // "cart_open" | "item_add" | "tender_confirm" | ...
  payload:     JSON             // flow-specific data
  timestamp:   ISO 8601 (device clock)
  server_time: ISO 8601 | null  // last known server time (for clock-drift detection)
  seq:         uint64           // monotonic per-device sequence number (gap = lost packet)
  hash:        SHA-256          // hash of (prev_hash + payload) — tamper chain
  offline:     boolean          // true if generated while offline
  synced:      boolean          // false until server acknowledges
  attempts:    uint8            // retry count
}
```

**Storage:** IndexedDB (Web) with WAL-mode SQLite fallback if available. Queue is append-only during offline; only the sync daemon marks packets as synced.

**Capacity:** Queue holds up to 10,000 events (~72h of heavy trading at 1 event/26s). Beyond 10,000: oldest synced packets are purged first; if all are unsynced, UI shows hard warning "Storage full — reconnect to sync before continuing."

**Ordering:** Events replayed to server in strict `(device_id, seq)` order. No reordering. Server processes them sequentially per device.

### 28.3 Sync Daemon

Runs as a background service worker (Web) or background task (native).

```
[Network status changes to ONLINE]
     ▼
[Sync daemon wakes]
     ├── Step 1: Time sync — GET /api/time → compute clock offset
     │   → if offset > 30s, tag all queued events with corrected timestamps
     │   → if offset > 5min, BLOCK sync, show "Set your clock" warning
     ▼
     ├── Step 2: Auth check — verify session token still valid
     │   → if expired/revoked, force re-auth before sync
     ▼
     ├── Step 3: Drain queue — POST /api/sync/drain
     │   → send events in batches of 50, ordered by (device_id, seq)
     │   → each batch is a transaction: all-or-nothing per batch
     │   → server responds per-event: accepted | rejected(reason) | flagged(reason)
     ▼
     ├── Step 4: Process responses
     │   → accepted: mark synced=true, prune from queue
     │   → rejected: mark failed, surface to operator with reason
     │   → flagged: mark pending_review, surface to manager in /trade/sync
     ▼
     ├── Step 5: Pull server state
     │   → GET /api/sync/pull?since={last_sync_timestamp}
     │   → receive: updated products, prices, stock levels, operator changes
     │   → overwrite local cache with server state (server wins)
     ▼
     ├── Step 6: Conflict resolution (if any)
     │   → see §46.4
     ▼
[Daemon sleeps until next trigger: network change, 30s interval, or manual]
```

### 28.4 Conflict Resolution Rules

Conflicts occur when an offline event references state that changed server-side during the offline window. Resolution is deterministic — no human judgment required for most cases.

| Conflict Type | Detection | Resolution | Surface |
|---|---|---|---|
| **Inventory oversold** (sold 5 offline, server shows 2 remaining) | `queued_decrement > server_stock` | **Accept the sale** (it happened). Server stock goes negative. Flag for manager review. Restock auto-triggered. | `/trade/sync` amber alert |
| **Price changed** (sold at GHS 10, server price now GHS 12) | `event.price != server.product.price` | **Accept at offline price** (customer already paid). Flag for review. Margin variance logged. | `/trade/sync` info flag |
| **Product deactivated** (sold product that was disabled server-side) | `event.product_id` not in active catalogue | **Accept the sale** (it happened). Re-activate product temporarily. Flag for manager. | `/trade/sync` amber alert |
| **Operator revoked** (operator sold while their access was revoked server-side) | `event.operator_id` not in active operators | **Accept the sale** (it happened). Flag for security review. All operator's offline actions marked for audit. | `/trade/sync` + `/ops/audit` red flag |
| **Duplicate tender** (MoMo retry ambiguity) | Same reference appears twice | **Reject duplicate.** First occurrence accepted; subsequent rejected with `duplicate_reference`. | `/trade/sync` auto-resolved |
| **Day already closed** (offline events timestamped for a day that's been day-closed) | `event.date < last_closed_day` | **Land in current day** with `late_sync_original_date` metadata. Closed days are never reopened. Dual-date for reconciliation. | `/trade/sync` info flag |
| **Sequence gap** (device seq jumps from 47 to 50) | `event.seq != expected_seq` | **Accept events that arrived.** Flag gap. Possible data loss — surface to ops for investigation. | `/ops/audit` amber alert |
| **Hash chain broken** (event hash doesn't chain from previous) | `SHA-256(prev_hash + payload) != event.hash` | **Reject entire batch from break point onward.** Possible tamper. Surface to ops security. | `/ops/audit` red flag |

### 28.5 Conflict Review UI

`/trade/sync` — visible to manager role and above:

- **Queue depth gauge** — how many events pending sync
- **Conflict inbox** — each flagged event shows: what happened, what the server expected, the auto-resolution applied, and an "Override" button for manager-level correction
- **Sync history** — last 7 days of sync sessions with packet counts, conflict counts, resolution outcomes
- **Force sync** button — manually triggers sync daemon

### 28.6 Offline Boundaries by Flow

| Flow | Offline Capable? | What Works | What's Disabled | Queue Format |
|---|---|---|---|---|
| §21 Sale | **Yes** | Full sale except MoMo/Card tender | MoMo, Card, loyalty lookup, promo refresh | `sale.*` events |
| §22 Return | **Yes** | Returns against locally-cached sales | Returns against sales from other devices | `return.*` events |
| §23 Day-Close | **Partial** | Soft close (count + variance) | Day-lock hash (requires server), compliance filing | `day_close.*` events |
| §24 Restock | **Partial** | PO draft, GRN capture with provisional numbers | PO approval (if multi-approver), supplier payment | `restock.*` events |
| §25 Tenant Lifecycle | **No** | — | All state changes require server | — |
| §26 Auth | **Yes** | PIN login against cached hashes | Password login, MFA (except TOTP/hardware key) | `auth.*` events |
| §28 Compliance | **Queued** | E-VAT queued locally (48h cap per GRA policy) | Filing submissions | `compliance.*` events |
| §35 Multi-Branch | **Partial** | Dispatch + receive capture | Journal posting (both-sides atomic), in-transit reconciliation | `transfer.*` events |
| §40 DOH | **No** | Morning handshake cannot be offline | — | — |

### 28.7 Data Integrity Guarantees

1. **No silent data loss.** Every event that enters the queue is either synced, rejected with reason, or flagged for review. Nothing disappears.
2. **No silent overwrites.** Server never silently changes what the client recorded. If server state differs, the difference is surfaced.
3. **Append-only offline.** No deletes or updates to queued events. A "void" is a new event, not a deletion of the original sale event.
4. **Hash chain integrity.** Broken chain = possible tamper = hard reject from break point. This is intentionally strict.
5. **Clock-drift tolerance.** Up to 30s drift auto-corrected; 30s–5min corrected with warning; >5min blocks sync until clock fixed.

### 28.8 Implementation Priority

Phase 1 lays the queue infrastructure (IndexedDB store, event packet format, basic drain on reconnect) with Cash-only offline sales. Full protocol (conflict resolution, sync UI, cross-device reconciliation) ships in Phase 2 before any multi-device or multi-branch features go live.

---

## Changelog

| Date | Version | Change |
|---|---|---|
| 2026-04-15 | v0.1 | Initial draft. Sale Journey mapped in full. Other flows stubbed. |
| 2026-04-15 | v0.2 | Restructured around master principle **one tenant, many activations**. Sale Journey made vertical-agnostic. New Section 21.4 defines 21 intersection slots where vertical plug-ins activate. Restaurant folded in as plug-in set, not a forked spine. Fourth flow shape (intersection slot) added. Category A hardware capabilities (camera, scale, BT printer, BT cash drawer, NFC) folded into Node 2/3/4. Device context, clock sync, multi-device race added to preconditions and failure modes. Restaurant-specific modules added to ops linkage table. Six new open questions added (tip-out, service charge, recipe substitution, bar tab persistence, age-verification DPA, multi-device). |
| 2026-04-15 | v0.3 | **Return / Refund / Void Journey mapped in full** as Section 4 — the reverse spine of the Sale Journey. Seven-node structure (trigger → locate → scope → approve → post → deliver → ripple). Three reversal modes unified (void, refund, exchange) plus restaurant comp variant. 15 reverse intersection slots (R1–R15) defined parallel to Sale slots. Contra-journal structure specified with restaurant Comp-to-P&L variance. Offline variant, master-ops laterals (force-refund, reversal freeze, cap override), failure matrix, and fraud-signal bubbles to `/ops/analytics/fraud-signals` all mapped. Flow inventory updated: #4 marked Ink. Open questions / Next flows renumbered to Sections 5 / 6. |
| 2026-04-15 | v0.4 | **Day-Close Journey mapped in full** as Section 5. Nine-node structure (intent → freeze → blind count → reveal + variance → investigation → cash drop/banking → Z-report + filings → day lock → ripples). Three close levels defined (shift / till / branch) with nested roll-up. Blind-count-then-reveal integrity pattern enforced. 15 intersection slots (C1–C15) for vertical plug-ins. Variance threshold tiers (acceptable / review / hard). Day-lock cryptographic hash. Offline "soft close" pattern preserves integrity without network. Master-ops laterals: force-close, force-unlock, missed-close heartbeat, compliance retransmit. Fraud-signal ripples on variance outliers and void-then-close patterns. Flow inventory updated: #3 marked Ink. Open questions / Next flows renumbered to Sections 6 / 7. |
| 2026-04-15 | v0.5 | **Restock Journey mapped in full** as Section 6 — the supply-side spine. Ten-node structure (need → PO draft → approve → issue → receive → GRN → landed cost → inventory+AP → pay supplier → ripples). Three entry variants (PO-driven, direct receipt, standing order). 15 intersection slots (P1–P15) for vertical plug-ins. Landed cost allocation model (by value/weight/volume/qty/manual) with weighted-average update cascading to restaurant plate cost. 3-way match (PO ↔ GRN ↔ invoice). Batch/expiry, cold-chain, FX handling, WHT, input VAT recovery all mapped. Offline variant with provisional PO/GRN numbering. Master-ops laterals: supplier blocklist, bulk import assist, market-price reference, fraud alerts. 86-list unlock interlock with restaurant plug-in. Flow inventory updated: #2 marked Ink. Open questions / Next flows renumbered to Sections 7 / 8. |
| 2026-04-15 | v0.6 | **Tenant Lifecycle Journey mapped in full** as Section 7 — the foundational state-machine flow every other flow depends on. State graph: `signup_draft → trial → active ⇄ suspended_soft/hard → archived → purged`. Seven-node spine (signup → provision → trial → activate → live-ops → archive → purge) with **nine sub-transitions** under live-ops (upgrade, downgrade, add-on +/−, branch +/−, operator changes, soft-suspend, hard-suspend, reactivate). Entitlement engine resolution surfaced as the door-opener for every intersection slot on every other flow. 12 intersection slots (T1–T12) for vertical plug-ins (starter pack, onboarding tour, day-1 tasks, signup questions, tier-module mapping, usage caps, compliance pack, export format, retention class, merge/split). Offline entitlement snapshot + reconciliation with retroactive-suspend audit pattern. Ghana-specific compliance (TIN, KYC via Ghana Card, VAT rates, SSNIT, GRA) threaded throughout. Master-ops laterals: impersonate, bulk migration, emergency broadcast, merge tenants, legal hold, force-export. Purge requires cryptographic proof + dual-approval. Flow inventory updated: #11 marked Ink. Open questions / Next flows renumbered to Sections 8 / 9. |
| 2026-04-15 | v0.7 | **Auth / Session Journey mapped in full** as Section 8 — the universal gatekeeper. Seven-node structure (device enrolled → identity claimed → credentials verified → session issued → active with step-up → session ends → audit). Three identity models unified (operator, owner, ops-staff) + three session kinds (primary, step-up, supervisor). 12 intersection slots (A1–A12) cover session binding, timeouts, step-up cap catalogues, handoff patterns, role catalogues, MFA sensitivity, device-role affinity, restricted-action identity, audit granularity per vertical. Step-up catalogue enumerates every sensitive action across the platform and its approver class. Four session-end modes (explicit logout, timeout, revoke, shift-swap handoff). Offline auth with cached PIN hashes + retroactive-authority-conflict audit. Device kill-switch, break-glass, impersonation laterals. Audit pipeline-down HARD BLOCK (integrity rule). Token refresh replay detection. Risk scoring + concurrency policy (block/swap/mirror). Flow inventory updated: #12 marked Ink. Open questions / Next flows renumbered to Sections 9 / 10. |
| 2026-04-15 | v0.8 | **Billing Journey mapped in full** as Section 9 — how the platform gets paid. Nine-node structure (continuous metering → period boundary → invoice draft → issue+deliver → payment attempt → retry cadence → post-payment GL → suspend interlink → period close). Three revenue streams unified (recurring subscription, metered usage, one-off) + three invoice modes (standard, partner-billed, enterprise). 12 intersection slots (B1–B12) for vertical-specific metering (covers, students, room-nights). Ghana-specific dunning cadence (T+0 / +3 / +7 / +14 suspend / +28 hard-suspend / +60 collections / +90 archive) hands off to Tenant Lifecycle § T5.7/T5.8/§6. Platform-side GL (Dr AR / Cr Revenue / Cr Output VAT) with partner commission accrual. Metering idempotency keys + retroactive-sync policy (offline events land in next period, never reopen closed period). Master-ops laterals: manual credits, force-refund, hardship program, grace extension, write-off, rate-change propagation. Audit-pipeline-down HARD BLOCK on billing runs (matches Tenant Lifecycle + Auth integrity rule). MRR/ARR/churn/NRR reporting hooks. Flow inventory updated: #13 marked Ink. Open questions / Next flows renumbered to Sections 10 / 11. |
| 2026-04-15 | v0.9 | **Compliance / Filing Journey mapped in full** as Section 10 — Ghana regulatory spine. Eleven-node structure spanning real-time E-VAT transmission per receipt through monthly/quarterly/annual filings (VAT/NHIL/GETFund/COVID, SSNIT T1/T2, PAYE, WHT, corporate tax). 11 intersection slots (CP1–CP11) for vertical-specific filing packs. Offline E-VAT queue with legal-cap escalation. Master-ops laterals: filing override, rate-change propagation, portal-down advisory, legal hold on filings. Audit-pipeline-down HARD BLOCK extended to compliance submissions (integrity rule consistency). Flow inventory updated: #14 marked Ink. |
| 2026-04-15 | v1.0 | **Remaining 11 flows inked** — Enrollment (§29, Institute vertical root, E1–E8), Attendance (§30, AT1–AT6), Fees (§31, FE1–FE8) complete the Institute spine. Reservation Journey (§32, restaurant plug-in, RV1–RV7) feeds Sale Journey via table-state interlock. Expense Journey (§33, EX1–EX7) petty cash + approvals + attachments. Inventory Count / Adjustment (§34, IC1–IC6) blind-count integrity pattern reused from Day-Close. Multi-Branch Transfer (§35, MB1–MB5) preserves weighted-average cost across branches. Support (§36, SP1–SP5), Remote Assistance (§37, RA1–RA5), Break-Glass / Device Kill (§38, dual-flow BG1–BG4 with dual-approval), Release Rollout (§39, RR1–RR5) complete the cross-cutting ops surface. Flow inventory updated: #5, #6, #7, #15, #16, #17, #18 all marked Ink. Section 11 "Next flows" renamed and rewritten as Section 23 "v1.0 audit and approval gate" — all 18 flows now inked, no further flows pending scope. **Blueprint is now complete and ready for audit.** Backend implementation remains gated on audit pass per `feedback_map_before_build`. |
| 2026-04-15 | v1.2 | **Platform Concerns tier inked** as Section 23 — the substrate beneath the 19 flows. Single section, seven sub-sections (tight pass per George's preference over six separate sections). §41.A Analytics Spine (two tracks: product analytics tenant-side vs ops analytics master-side, never mixed; no PII in product events; event catalogue as code-generated registry; warehouse hot/cold with 24mo product / 7y ops retention). §41.B Public Surface & SEO (public surfaces enumerated across dalxic.com subdomain tree; mandatory robots.txt / sitemap / OG / Schema.org / hreflang / Core Web Vitals targets; bot policy allowing AI crawlers for LLM visibility; trust-surface pages: Security, Privacy, Reliability). §41.C Web Application Security (distinct from §40 DOH and §26 Auth — this is browser ↔ server layer; CSP nonce+strict-dynamic, HSTS preload, CSRF, XSS/SQLi discipline, rate-limit matrix per endpoint class, WAF with OWASP CRS + managed bot mitigation, dependency hygiene with same-day critical-CVE patching on crypto/auth paths). §41.D Scheduler / Worker Spine — "The Robots" — every implicit cron across 19 flows made explicit; 24-job catalogue with idempotency keys, critical-path flags; universal worker discipline (idempotency, distributed locks, exponential backoff, dead-letter queue, audit trail, tz-awareness, manual-trigger with dual-approval, critical-vs-non-critical shed policy). §41.E Observability & SRE (three pillars: structured logs / metrics / traces, all correlation-ID threaded; SLO catalogue with initial targets for Sale, DOH, Billing, Compliance, public site; alert discipline: fast-burn pages, slow-burn queues, every alert has runbook; incident-response severity ladder; **integrity rule: new deploys blocked when observability stack itself is blind**). §41.F Data Governance (Ghana DPA 2012 + GDPR — tighter-applies rule; PII catalogue with access tiers; retention schedule table spanning 7y tax records to 24mo rolling analytics; full DSR rights surface: access/correction/deletion/portability/objection/restriction with 14-day SLA; DR + backup with RPO/RTO per tier — audit chain 5min RPO / 1h RTO; monthly auto-restore + quarterly live drill + annual tabletop; WCAG 2.1 AA + pan-African i18n roadmap: en-GH default, then en-NG/KE, fr-CI, Twi, Yoruba, Hausa, Swahili). §41.G Platform Concerns × Flows interlink matrix — every flow row has a resolution requirement per Platform Concern column, audit-phase task. Sections 24 (Open questions) and 25 (audit gate, renamed to v1.2) renumbered. **Blueprint is now v1.2-complete and ready for audit.** Backend implementation remains gated on audit pass per `feedback_map_before_build`. |
| 2026-04-16 | v1.4 | **Peer review gap closure.** Five gaps flagged by external developer review, all addressed: (1) §44 Execution Phases — four-phase build timeline with week-by-week deliverables: P1 Boutique 6–8w, P2 Foundation 4–6w, P3 Multi-Vertical 8–12w, P4 Enterprise 6–8w. Dependency graph mapped. (2) §45 Master Slot Implementation Matrix — every slot across all 19 flows marked P1/P2/P3/P4/noop. 52 of 197 slots implemented in Phase 1. (3) §46 Offline Sync Protocol — server-authoritative with client retry queue. Full specification: EventPacket format, IndexedDB queue (10K cap), sync daemon 5-step drain, 8 conflict types with deterministic resolution, hash-chain integrity, conflict review UI at `/trade/sync`. Not CRDT (justified). Not LWW (justified). (4) §35.3 Multi-Branch Transfer expanded — atomic inventory operations at dispatch (N3) and posting (N6), pending-transfer state machine (DRAFT→APPROVED→PICKED→IN_TRANSIT→PENDING_RECEIVE→POSTED), reservation system prevents double-allocation, §35.5 offline variant expanded with three scenarios (source online/dest offline, source offline/dest online, both offline) and PENDING_MATCH server-side holding pattern. (5) §40.E Offline Holiday Calendar — Ghana public holidays bundled in handshake response, device-side `isBusinessDay()` + `nextBusinessDayAnchor()` computation, signed calendar (L1), yearly refresh, movable holiday (Eid) update via heartbeat, multi-country schema for Nigeria/Kenya expansion. Source: Public Holidays Act 2001 (Act 601). Blueprint is now v1.4-complete. |
| 2026-04-16 | v1.3.1 | **Completionist spine-leak sweep** (second pass, same day). Residual vertical-specific prose scrubbed from spine bodies across §22, §23, §24, §25, §26, §34 — all vertical tags now flow through slot references (R13/R14, C7/C11, P2/P7/P10/P11, T1/T7, A7/S7/S12/S13/S14). Spine prose is vertical-neutral end-to-end. Vertical terms survive only in: comparative slot tables (expected), §19.A contract examples, module ops tables, §29–§32 vertical-specific flow headers, §43 deferred contract tracking, and DOH configuration examples (§40). §43.2 audit findings updated to reflect closure. Phase 1 build readiness unaffected — slot contracts already closed in v1.3. |
| 2026-04-16 | v1.3 | **Patchflow principle formalized + full audit sweep.** (1) §19 Design Principle #2 inked (patchflow = stable spine + named slots with contracted shapes; normaled/half-normaled/de-normaled vocabulary; three legal moves for new capabilities — plug existing slot, declare new slot, or reject as wrong-flow; spine-surgery forbidden; Phase 1 reframed as "spine frozen + slot matrix open"). (2) §19.A contract template inked — every slot declares Input payload + Output callback + Failure semantics + Default behavior + Observer taps + Entitlement gate + Re-patch policy + Connection type. Universal contract-violation handling: log + fail per semantics + ops alert + 3-strikes auto-quarantine. (3) Patchflow audit run on all 19 flows. Findings: spine clarity PASS; slot catalogue PASS; missing-slot coverage PASS (6 Phase 2 slots added to §21 — S0 cart-initiation, S5.5 loyalty-price-override, S14.5 cold-chain-gate, S15.0 fulfilment-branch-resolution, S15.5 batch/FIFO-picker, S17.5 commission/incentive); 13 spine leaks across §21–§24 rewritten to slot references. (4) §21.4.A inked with full contracts for 17 Phase 1 Sale-Journey slots; 10 Phase 2 slots formally deferred to their owning modules' build windows. (5) §22.4.A, §23.4.A, §24.4.A, §25.4.A, §26.4.A, §27.4.A, §28.4.A, §40.4.A each summarise their Phase 1 full-contract cohort + Phase 2 deferred cohort. C7 tip-out contradiction resolved (De-normaled for tip-bearing verticals, not normaled-no-op). (6) §43 audit gate rewritten to v1.3 with explicit Phase 1 vs Phase 2 contract-closure table; zero-cost stack + boutique-first targeting bound into §43.4 approval gate. **Blueprint is now v1.3-complete and ready for audit.** Phase 2 slots are slot-catalogue-complete with contracts explicitly deferred per §19 patchflow convention — add-ons remain normal operating procedure. Source: George coined "patchflow" 2026-04-16 after patchbay-analogy research; crown-discretion audit sweep executed same session. |
| 2026-04-15 | v1.1 | **Daily Online Handshake & Heartbeat (DOH) Journey mapped in full** as Section 22 — the anti-piracy spine that gates every other flow. Nine-node structure (launch pre-flight → request assembly → 16-layer server validation → HSM-signed response → device verify + snapshot install → 5-min heartbeat loop → grace/lockout per tier → business-day boundary → late-sync drain). Two-tier policy matrix: **Tier A (Standard)** — required morning handshake + gating 5-min heartbeat + 60 min warning / 120 min lockout; **Tier B (Continuous Trade)** — required morning handshake only, opportunistic heartbeat, no mid-day lockout, qualified by annual payment cleared AND `reputable_ops_clearance` flag (dual qualification, master-ops dual-approval grant). No close handshake — day-lock cert issued at NEXT morning's handshake (prevents mangled-record risk). No emergency fallback (lockout = lockout, no back door). 10 intersection slots (DH1–DH10). Offline variant: morning handshake cannot be offline (hard rule); mid-day per tier. Master-ops laterals: force re-handshake, Tier B grant/revoke, hardship grace, device cert revoke, HSM rotation, broadcast, tenant-wide lockdown. **§22.B — 16-layer Handshake Security Architecture**: HSM-signed response (L1), hardware-bound device keypair in Secure Enclave/TPM (L2), mTLS + cert pinning (L3), fresh server nonce (L4), server-signed time (L5), signed entitlement snapshot (L6), binary self-integrity (L7), distributed validation logic (L8), anti-runtime-tamper (L9), root/jailbreak awareness (L10), silent canary checks (L11), behavioural fingerprinting (L12), honeypot tenant IDs (L13), out-of-band OTP on sensitive actions (L14), server-side truth on high-value ops (L15), push-channel kill switch (L16). Threat model + attacker-economics tables establish **economic unbreakability** target (no theoretical unbreakability claim — engineering for cost-to-break exceeding imaginable return). **§22.C — Cryptographic Inventory** documents every key, storage, rotation cadence. **§22.D — Operational Lockdown** covers HSM runbook, CRL propagation, annual pen-test, bug bounty, red-team drills. Marketing position for Tier B: "When your bank is down, you keep trading" — decouples operational continuity from local bank uptime (GCB, Ecobank, Stanbic, Fidelity, Cal Bank). Flow inventory updated: #19 (DOH) added as cross-cutting anti-piracy flow. Section 23 ("Open questions") and Section 24 ("audit gate", renamed to v1.1) renumbered. **Blueprint is now v1.1-complete and ready for audit.** Backend implementation remains gated on audit pass per `feedback_map_before_build`. |
