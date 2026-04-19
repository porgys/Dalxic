# BUILD BLUEPRINT — Dalxic

> Fresh build. No transfers. Operations-dalxic is REFERENCE ONLY.
> Every phase has checkboxes. Mark complete as each section ships.
> If anything breaks, this document tells you exactly where we are.
>
> **HOW TO USE THIS GUIDE:**
> Each phase lists the MASTER BLUEPRINT sections to READ FIRST.
> Read those sections. Get the exact specs. Then build to spec.
> Do NOT paraphrase or summarize — build from the source.

**Project:** `/Users/thecreator/Projects/dalxic/dalxic`
**Master Blueprint:** `/Users/thecreator/Projects/dalxic/operations-dalxic/BLUEPRINT.md` (7,774 lines)
**Design Guide:** `/Users/thecreator/Projects/dalxic/dalxic/DESIGN-GUIDE.md` (master design language)
**Reference Code:** `/Users/thecreator/Projects/dalxic/operations-dalxic/` (working backend)
**Date:** 2026-04-18

> **MANDATORY:** Every UI phase (15–21) MUST read DESIGN-GUIDE.md in full before building.
> The design guide defines color system, typography, layout, composition, component patterns,
> and dark theme rules. No UI ships without compliance to the design guide.

---

## MASTER BLUEPRINT — Section Index

For quick lookup. Every § below maps to a line range in BLUEPRINT.md.

| § | Lines | Title | What It Specifies |
|---|-------|-------|-------------------|
| §1 | 30–36 | The Core Truth | 6 behaviours are universal |
| §2 | 38–64 | Universal Behaviour Table | All 6 × 10 verticals mapped |
| §3 | 67–75 | Three Stock Types | Physical, Capacity, Service |
| §4 | 77–84 | Two Payment Gates | Pay-before vs pay-after |
| §5 | 86–108 | The Spine | Cart → Tender → Payment → Stock → Receipt → Done |
| §6 | 111–158 | The Engine (5 Frozen Files) | Exact function signatures for all engine files |
| §7 | 165–228 | V6 System Architecture | 4 pillars, vertical config shape |
| §8 | 231–253 | Config-Driven Verticals | Organization model, label config, active behaviours |
| §9 | 257–276 | ServiceItem | Universal product table spec |
| §10 | 279–291 | Universal Contact | Contact model spec |
| §11 | 294–322 | Admission + Recurring | Capacity occupancy + time-based billing |
| §12 | 325–350 | Vertical Extensions | Health, Institute, Trade extensions — how they feed spine |
| §13 | 353–371 | Ghana-Specific | Tax rates, currency, phone formats |
| §14 | 373–434 | API Structure | All endpoints, methods, contracts |
| §15 | 436–447 | Color System | Design tokens |
| §16 | 449–459 | The Moat | Competitive positioning |
| §17 | 461–471 | Build Priority | What ships first |
| §18 | 478–494 | How To Read Flows | Flow notation guide |
| §19 | 496–547 | Design Principles | Patchflow slot contracts |
| §20 | 549–596 | Flow Inventory | All 19 flows listed |
| §21 | 603–1415 | Sale Journey | 5 nodes, 21 S-slots, offline variant, failure modes |
| §22 | 1417–1884 | Return/Refund/Void | 7 nodes, 15 R-slots |
| §23 | 1886–2428 | Day-Close | 9 nodes, 15 C-slots, blind count, Z-report |
| §24 | 2430–3024 | Restock Journey | PO → GRN → landed cost, 15 P-slots |
| §25 | 3026–3752 | Tenant Lifecycle | State machine: draft→trial→active→suspended→archived→purged |
| §26 | 3754–4354 | Auth/Session | 3 identities, PIN-primary, session management |
| §27 | 4356–4958 | Billing | Master ops invoices tenants, metering, dunning |
| §28 | 4960–5479 | Compliance/Filing | GRA E-VAT, SSNIT, PAYE |
| §29 | 5481–5560 | Enrollment (Institute) | Application → admission → placement → fees |
| §30 | 5562–5609 | Attendance (Institute) | Daily tracking, guardian notifications |
| §31 | 5611–5663 | Fees (Institute) | Fee schedule → cart → spine |
| §32 | 5665–5714 | Reservation (Restaurant) | Floor plan, table assignment |
| §33 | 5716–5765 | Expense Journey | Operational expenses, approval routing |
| §34 | 5767–5815 | Inventory Count | Blind count, variance, adjustment |
| §35 | 5817–6014 | Multi-Branch Transfer | Atomic inventory, in-transit tracking |
| §36 | 6016–6063 | Support Journey | Ticket lifecycle, SLA |
| §37 | 6065–6112 | Remote Assistance | Co-pilot + takeover |
| §38 | 6114–6167 | Break-Glass/Device Kill | Emergency access, remote wipe |
| §39 | 6169–6216 | Release Rollout | Canary, wave, rollback |
| §40 | 6218–6738 | DOH Heartbeat | Anti-piracy, software keys |
| §41 | 6740–7077 | Platform Concerns | Analytics, SEO, security, scheduler, observability |
| §42 | 7079–7102 | Open Questions | Audit phase items |
| §43 | 7104–7201 | Audit/Approval Gate | v1.3 gate criteria |
| §44 | 7203–7291 | Execution Phases | P1–P4 build timeline |
| §45 | 7293–7624 | Slot Implementation Matrix | All slots across all flows |
| §46 | 7626–7774 | Offline Sync Protocol | Local queue + sync design |

---

## Architecture Summary

```
Two doors, one workspace:

/ops/                          Dalxic HQ — 16 internal screens
/ops/tenants/[code]/           Secret gateway — enter tenant's system as master
/kiosk/[code]/                 Client door — PIN login → same module workspace

Module workspace (shared):     Shows tenant's allocated modules
                               Each module = working screen
                               Same code regardless of entry door
```

---

## PHASE 0 — Project Scaffold

**READ FIRST:** Nothing from blueprint — this is infrastructure.
**Creates:** Fresh Next.js project with all dependencies and config.
**Verify:** `npm run dev` starts without errors.

- [x] `npx create-next-app` — TypeScript, Tailwind 4, App Router, src/ directory
- [x] Install deps (match versions from reference `package.json`)
- [x] Configure `tsconfig.json` — paths: `@/*` → `./src/*`
- [x] Configure `next.config.ts`
- [x] Configure `eslint.config.mjs`
- [x] Create `.env.example`
- [x] Create `.gitignore`

**Files:** 7

---

## PHASE 1 — Database Layer

**READ FIRST:**
- §9 lines 257–276 → ServiceItem model (fields, types, behaviours)
- §10 lines 279–291 → Contact model
- §11 lines 294–322 → Admission + RecurringCharge models
- §12 lines 325–350 → Health/Institute/Trade extension models
- §8 lines 231–253 → Organization model (config-driven fields)
- §13 lines 353–371 → Ghana-specific (currency, tax config shape)
- Reference: `operations-dalxic/prisma/schema.prisma` (789 lines, 30 models)

**Creates:** Prisma schema, migrations, seed data, DB client.
**Verify:** `npx prisma generate` succeeds.

- [x] `prisma/schema.prisma` — 30 models built to spec from §9–§12
- [ ] `prisma/migrations/001_init.sql`
- [ ] `prisma/migrations/002_returns.sql`
- [ ] `prisma/migrations/003_universal_engine.sql`
- [x] `prisma/seeds/seed.ts` — KBH (hospital), DEMO (trade), ACAD (academy)
- [ ] `prisma/seed.sql`
- [x] `src/lib/db.ts` — Prisma client with Neon adapter

**Files:** 7

---

## PHASE 2 — Core Lib

**READ FIRST:**
- §26 lines 3754–4354 → Auth/session flow (3 identities, PIN-primary, header auth)
- §13 lines 353–371 → Ghana tax rates, phone normalization
- §3 lines 67–75 → Three stock types (decrement/occupy/release rules)
- §15 lines 436–447 → Color system tokens
- Reference: `operations-dalxic/src/lib/auth.ts`, `api/tax.ts`, `api/stock.ts`

**Creates:** Auth, response helpers, audit, tax, stock, rate limiting, types.
**Verify:** `tsc --noEmit` passes.

- [x] `src/lib/auth.ts` — PIN auth from §26
- [x] `src/lib/api/response.ts` — ok() / fail() helpers
- [x] `src/lib/api/audit.ts` — logAudit()
- [x] `src/lib/api/tax.ts` — Ghana taxes from §13
- [x] `src/lib/api/stock.ts` — Stock operations from §3
- [x] `src/lib/rate-limit.ts` — Sliding window limiter
- [x] `src/lib/tier-defaults.ts` — T1–T4 gates from §27 (billing/tier context)
- [ ] `src/lib/tokens.ts` — Color tokens from §15
- [x] `src/lib/use-auth.ts` — Client-side auth hook
- [x] `src/types/index.ts` — Shared TypeScript interfaces

**Files:** 10

---

## PHASE 3 — Engine (5 Frozen Files)

**READ FIRST:**
- §6 lines 111–158 → EXACT function signatures, parameters, return types, stock effect rules
- §5 lines 86–108 → The spine flow
- §4 lines 77–84 → Payment gate logic
- §3 lines 67–75 → Stock type rules (physical=decrement, capacity=occupy, service=noop)

**Creates:** The 5 frozen engine files. NEVER modified after this phase.
**Verify:** Each function compiles. Signatures match §6 exactly.

- [x] `src/lib/engine/sale.ts` — §6 lines 124–133
- [x] `src/lib/engine/receipt.ts` — §6 lines 135–137
- [x] `src/lib/engine/returns.ts` — §6 lines 139–144
- [x] `src/lib/engine/reconcile.ts` — §6 lines 146–149
- [x] `src/lib/engine/payment-methods.ts` — §6 lines 151–158

**Files:** 5 — **FROZEN AFTER THIS PHASE**

---

## PHASE 4 — Integrations

**READ FIRST:**
- §13 lines 353–371 → Ghana phone normalization, MoMo providers
- Reference: `operations-dalxic/src/lib/paystack.ts`, `whatsapp.ts`, `pusher-*.ts`

**Creates:** External service connectors.
**Verify:** Files compile. Connections need env vars.

- [x] `src/lib/paystack.ts` — Payment gateway
- [x] `src/lib/whatsapp.ts` — Meta Cloud API messaging
- [x] `src/lib/pusher-server.ts` — Real-time server
- [x] `src/lib/pusher-client.ts` — Real-time client

**Files:** 4

---

## PHASE 5 — Middleware

**READ FIRST:**
- §26 lines 3754–4354 → Auth header enforcement
- §41 lines 6740–7077 → Security concerns (§41.C specifically)
- Reference: `operations-dalxic/src/middleware.ts`

**Creates:** Request-level security and auth.
**Verify:** API requests without headers get 401. Bots get 403.

- [x] `src/middleware.ts` — Bot wall, CORS, security headers, API auth enforcement

**Files:** 1

---

## PHASE 6 — Core API Routes

**READ FIRST:**
- §14 lines 373–434 → Full API endpoint list with methods
- §26 lines 3754–4354 → Auth/login flow (PIN, org code, session)
- §25 lines 3026–3752 → Tenant lifecycle (org states)
- Reference: `operations-dalxic/src/app/api/auth/`, `org/`, `operators/`, `branches/`, `audit/`

**Creates:** Auth, org, operators, branches, audit, heartbeat.
**Verify:** `POST /api/auth/login` with org code + PIN returns operator.

- [x] `src/app/api/auth/login/route.ts`
- [x] `src/app/api/org/route.ts`
- [x] `src/app/api/operators/route.ts`
- [x] `src/app/api/branches/route.ts`
- [x] `src/app/api/audit/route.ts`
- [x] `src/app/api/heartbeat/route.ts`

**Files:** 6

---

## PHASE 7 — Spine API Routes

**READ FIRST:**
- §21 lines 603–1415 → Sale Journey (5 nodes, 21 slots, full flow spec)
- §21.3 lines 637–908 → Node-by-node: cart creation, item entry, payment, receipt, exit
- §6 lines 111–158 → Engine function signatures (what the API calls)
- §14 lines 373–434 → Endpoint contracts

**Creates:** Cart → Tender → Pay pipeline.
**Verify:** Create cart → add item → tender → pay → receipt returned.

- [x] `src/app/api/cart/route.ts` — POST, GET
- [x] `src/app/api/cart/[id]/route.ts` — GET
- [x] `src/app/api/cart/[id]/items/route.ts` — POST
- [x] `src/app/api/cart/[id]/items/[itemId]/route.ts` — PATCH, DELETE
- [x] `src/app/api/cart/[id]/tender/route.ts` — POST
- [x] `src/app/api/cart/[id]/pay/route.ts` — POST

**Files:** 6

---

## PHASE 8 — Receipts & Returns API

**READ FIRST:**
- §22 lines 1417–1884 → Return/Refund/Void Journey (7 nodes, 15 R-slots)
- §22.3 lines 1456–1710 → Node-by-node: trigger, locate, scope, approve, reverse, refund, ripple
- §6 lines 135–144 → receipt.ts and returns.ts signatures

**Creates:** Receipt lookup and return processing.
**Verify:** Receipt retrievable by code. Return creates credit note.

- [x] `src/app/api/receipts/route.ts` — GET
- [x] `src/app/api/receipts/[code]/route.ts` — GET
- [x] `src/app/api/returns/route.ts` — POST, GET

**Files:** 3

---

## PHASE 9 — Stock API

**READ FIRST:**
- §24 lines 2430–3024 → Restock Journey (PO→GRN→landed cost, 15 P-slots)
- §34 lines 5767–5815 → Inventory Count/Adjustment Journey
- §35 lines 5817–6014 → Multi-Branch Transfer Journey
- §3 lines 67–75 → Stock type rules

**Creates:** Inventory management endpoints.
**Verify:** GET levels, POST receive increments, adjust creates movement.

- [x] `src/app/api/stock/route.ts` — GET
- [x] `src/app/api/stock/receive/route.ts` — POST
- [x] `src/app/api/stock/adjust/route.ts` — POST
- [x] `src/app/api/stock/transfer/route.ts` — POST

**Files:** 4

---

## PHASE 10 — Universal API Routes

**READ FIRST:**
- §10 lines 279–291 → Contact model
- §11 lines 294–322 → Admission + RecurringCharge
- §9 lines 257–276 → ServiceItem (catalogue)
- §14 lines 373–434 → Endpoint contracts
- §33 lines 5716–5765 → Expense Journey
- Reference: `operations-dalxic/src/app/api/contacts/`, `admissions/`, etc.

**Creates:** Contacts, admissions, recurring, catalogue, categories, messages, reports.
**Verify:** CRUD works on each entity.

- [x] `src/app/api/contacts/route.ts`
- [x] `src/app/api/admissions/route.ts`
- [x] `src/app/api/recurring/route.ts`
- [x] `src/app/api/recurring/process/route.ts`
- [x] `src/app/api/catalogue/route.ts`
- [x] `src/app/api/categories/route.ts`
- [x] `src/app/api/messages/route.ts`
- [x] `src/app/api/reports/revenue/route.ts`

**Files:** 8

---

## PHASE 11 — Payroll API

**READ FIRST:**
- §28 lines 4960–5479 → Compliance/Filing (SSNIT, PAYE context)
- §13 lines 353–371 → Ghana PAYE brackets, SSNIT tiers
- Reference: `operations-dalxic/src/app/api/payroll/`

**Creates:** Employee and payroll run management.
**Verify:** Process payroll, payslips with PAYE/SSNIT.

- [x] `src/app/api/payroll/employees/route.ts`
- [x] `src/app/api/payroll/runs/route.ts`

**Files:** 2

---

## PHASE 12 — Health Extension API

**READ FIRST:**
- §12 lines 329–336 → Health extensions spec (ClinicalRecord, QueueEntry, how they feed spine)
- §21.4 lines 909–1183 → Intersection slots S0–S21 (health-specific slot behaviour)
- Reference: `operations-dalxic/src/app/api/health/`

**Creates:** Clinical records, queue, dispensing, lab results.
**Verify:** Add patient to queue, create clinical record, dispense.

- [x] `src/app/api/health/clinical/route.ts`
- [x] `src/app/api/health/clinical/dispense/route.ts`
- [x] `src/app/api/health/clinical/lab-result/route.ts`
- [x] `src/app/api/health/queue/route.ts`

**Files:** 4

---

## PHASE 13 — Institute Extension API

**READ FIRST:**
- §12 lines 338–343 → Institute extensions spec
- §29 lines 5481–5560 → Enrollment Journey
- §30 lines 5562–5609 → Attendance Journey
- §31 lines 5611–5663 → Fees Journey (fee schedule → cart → spine)
- Reference: `operations-dalxic/src/app/api/institute/`

**Creates:** Groups, subjects, exams, grades, attendance, schedule, calendar, fees.
**Verify:** Create group, add subject, mark attendance, generate fees.

- [x] `src/app/api/institute/groups/route.ts`
- [x] `src/app/api/institute/subjects/route.ts`
- [x] `src/app/api/institute/attendance/route.ts`
- [x] `src/app/api/institute/exams/route.ts`
- [x] `src/app/api/institute/grades/route.ts`
- [x] `src/app/api/institute/schedule/route.ts`
- [x] `src/app/api/institute/calendar/route.ts`
- [x] `src/app/api/institute/fees/generate/route.ts`

**Files:** 8

---

## PHASE 14 — Trade Extension API

**READ FIRST:**
- §12 lines 345–350 → Trade extensions spec
- §24 lines 2430–3024 → Restock Journey (suppliers, POs)
- §23 lines 1886–2428 → Day-Close Journey (shifts, reconciliation)
- §33 lines 5716–5765 → Expense Journey
- Reference: `operations-dalxic/src/app/api/trade/`

**Creates:** Suppliers, purchase orders, shifts, expenses.
**Verify:** Create supplier, create PO, open/close shift.

- [x] `src/app/api/trade/suppliers/route.ts`
- [x] `src/app/api/trade/purchase-orders/route.ts`
- [x] `src/app/api/trade/shifts/route.ts`
- [x] `src/app/api/trade/expenses/route.ts`

**Files:** 4

---

## PHASE 14A — Security Hardening: Credential Fortress

**READ FIRST:**
- **SECURITY-BLUEPRINT.md** §S2 — Credential Fortress (PIN hashing, master access, brute-force)
- **SECURITY-BLUEPRINT.md** §S11.1 — PIN Hashing Gotchas (read BEFORE touching auth)
- **SECURITY-BLUEPRINT.md** §S11.2 — Master Access Gotchas
- §26 lines 3754–4354 → Auth/session (how auth currently works)

**Creates:** Hashed PINs, HMAC-signed master access, brute-force wiring.
**Verify:** Login works with hashed PINs. master_access requires valid HMAC signature. 6th failed PIN attempt locks org.

- [ ] Install `@node-rs/argon2`
- [ ] `src/lib/api/hash.ts` — hashPin(), verifyPin(), generateMasterSig(), timingSafeCompare()
- [ ] Modify `src/lib/auth.ts` — HMAC-verify master access (§S2.2)
- [ ] Modify `src/app/api/auth/login/route.ts` — hashed PIN verification + brute-force wiring (§S2.1, §S2.3)
- [ ] Modify `src/app/api/operators/route.ts` — hash PIN on create, strip PIN from response (§S5.2)
- [ ] Modify `prisma/seeds/seed.ts` — hash PINs in seed data (§S11.1)
- [ ] Update `.env.example` — add MASTER_SECRET

**Files:** 2 new, 5 modified

---

## PHASE 14B — Security Hardening: Input Fortress

**READ FIRST:**
- **SECURITY-BLUEPRINT.md** §S3 — Input Fortress (all Zod schemas)
- **SECURITY-BLUEPRINT.md** §S9 — Org Field Protection (whitelist rules)
- **SECURITY-BLUEPRINT.md** §S11.3 — Zod Validation Gotchas

**Creates:** Zod validation on every POST/PATCH route. Field whitelisting on org updates.
**Verify:** Sending invalid/missing fields returns 400. Extra fields rejected. Org PATCH only accepts whitelisted fields.

- [ ] `src/lib/api/schemas.ts` — All Zod schemas from §S3.2
- [ ] `src/lib/api/sanitize.ts` — Response helpers, SAFE_OPERATOR_SELECT (§S5)
- [ ] Modify all 45 route files — add validate() + schema per route (§S3.3)
- [ ] Modify `src/app/api/org/route.ts` — whitelist-only PATCH (§S9.1)
- [ ] Modify `src/app/api/contacts/route.ts` — field protection (§S9.2)

**Files:** 2 new, 45+ modified

---

## PHASE 14C — Security Hardening: Access Fortress

**READ FIRST:**
- **SECURITY-BLUEPRINT.md** §S4 — Role Fortress (role matrix)
- **SECURITY-BLUEPRINT.md** §S6 — Rate Limiting Matrix (which routes get which config)
- **SECURITY-BLUEPRINT.md** §S7 — Payment Integrity (amount verification, idempotency)

**Creates:** Role gates on sensitive routes. Rate limits on critical endpoints. Payment amount server-side verification.
**Verify:** Cashier cannot access payroll. Payment rejects mismatched amounts. 6th login attempt per minute returns 429.

- [ ] Add requireRole() to: payroll/*, health/clinical/*, stock/adjust, returns, recurring/process (§S4.1)
- [ ] Add rateLimit() to: auth/login, cart/*/pay, returns, recurring/process, payroll/*, stock/adjust (§S6)
- [ ] Modify `src/app/api/cart/[id]/pay/route.ts` — server-side amount verification (§S7.1)
- [ ] Modify `src/app/api/returns/route.ts` — return verification checks (§S7.3)
- [ ] Modify `src/app/api/recurring/process/route.ts` — idempotency guard (§S7.2)

**Files:** 15+ modified

---

## PHASE 14D — Security Hardening: Deception + SEO

**READ FIRST:**
- **SECURITY-BLUEPRINT.md** §S8 — Deception Layer (honeypots, misdirection, timing)
- **SECURITY-BLUEPRINT.md** §S10 — SEO Fortress (sitemap, robots, meta, JSON-LD)
- **SECURITY-BLUEPRINT.md** §S11.5 — Honeypot Gotchas
- §41 lines 6740–7077 → Platform Concerns (SEO section)

**Creates:** Honeypot trap endpoints. Deceptive headers. SEO infrastructure.
**Verify:** `/api/admin/users` logs IP silently. `curl -I` shows PHP/Cloudflare. `/sitemap.xml` returns valid XML. `/robots.txt` blocks API/ops paths.

- [ ] `src/lib/api/honeypot.ts` — silent audit logger for trap endpoints
- [ ] `src/app/api/admin/users/route.ts` — honeypot
- [ ] `src/app/api/admin/config/route.ts` — honeypot
- [ ] `src/app/api/admin/export/route.ts` — honeypot
- [ ] `src/app/api/v1/debug/route.ts` — honeypot
- [ ] `src/app/api/internal/health/route.ts` — honeypot
- [ ] Modify `src/middleware.ts` — deceptive headers, tighten CSP (§S8.2)
- [ ] Modify all route handlers — try/catch error wrapping (§S8.3)
- [ ] `src/app/sitemap.ts` — dynamic XML sitemap (§S10.1)
- [ ] `src/app/robots.ts` — block API/ops/kiosk paths (§S10.4)
- [ ] `src/app/manifest.ts` — PWA manifest
- [ ] Modify `src/app/layout.tsx` — metadata template, OG defaults, JSON-LD (§S10.2, §S10.3)

**Files:** 8 new, 47+ modified

---

## PHASE 15 — Ops UI Components

**READ FIRST:**
- **DESIGN-GUIDE.md** — Full document (Rules 1, 2.4, 9, 10 apply to ops)
- **UI-BLUEPRINT.md** §U1 (Design Tokens), §U2 (Icon System), §U3 (Primitives), §U4 (Format Utilities), §U5 (OpsShell), §U6 (OpsPage), §U7 (Mock Data)
- Code reference: `operations-dalxic/src/components/ops/OpsShell.tsx`, `primitives.tsx`, `Icon.tsx`
- Data reference: `operations-dalxic/src/lib/ops/mock.ts`, `format.ts`

**Creates:** Shared component kit for all 16 ops screens.
**Verify:** OpsShell renders sidebar + topbar. All primitives render.

- [ ] `src/components/ops/OpsShell.tsx` — Sidebar (240px fixed, 5 nav groups, verticals box), TopBar (Master Control badge, status, user pill), OpsPage wrapper — §U5, §U6
- [ ] `src/components/ops/primitives.tsx` — T tokens (§U1), Card, Stat, Pill, Button, Field/Input/TextArea/Select, SearchBar, DataTable, Modal, Drawer, Tabs, Section, Empty — §U3
- [ ] `src/components/ops/Icon.tsx` — 50+ named SVG icons, Icon component — §U2
- [ ] `src/lib/ops/format.ts` — money(), moneyShort(), dateShort(), dateTime(), relativeDays(), pct() — §U4
- [ ] `src/lib/ops/mock.ts` — All mock datasets: MOCK_TENANTS, MOCK_TIERS, MOCK_MODULES, MOCK_ADDONS, MOCK_INVOICES, MOCK_TICKETS, MOCK_PARTNERS, MOCK_STAFF, MOCK_RELEASES, MOCK_INFRA, MOCK_FILINGS, MOCK_PLATFORM_AUDIT, MOCK_MRR_SERIES, MOCK_REGIONS, MOCK_PLATFORM_SETTINGS, MOCK_FEATURE_FLAGS, TRADE_MODULES, HEALTH_MODULES, INSTITUTE_MODULES — §U7

**Files:** 5

---

## PHASE 16 — Ops UI Screens (16 pages)

**READ FIRST:**
- **DESIGN-GUIDE.md** — Full document (Rules 1, 2.4, 9, 10 apply to ops)
- **UI-BLUEPRINT.md** §U8–§U22 (one section per screen — layout, stat cards, tabs, filters, table columns, drawer sections, footer actions)
- Code reference: `operations-dalxic/src/app/ops/` (all 16 pages)

**Creates:** All 16 ops screens matching design.
**Verify:** Each page renders at `/ops/*` with layout, data, interactions.

- [ ] `src/app/ops/layout.tsx` — OpsShell wrapper
- [ ] `src/app/ops/page.tsx` — Master Command — §U8 (4 stats, MRR chart, tier mix, 16 nav tiles, activity, alerts)
- [ ] `src/app/ops/analytics/page.tsx` — §U9 (ARR, NRR, waterfall, geo, adoption bars)
- [ ] `src/app/ops/tenants/page.tsx` — §U10 (5 stats, 5 tabs, 3 filters, 8-col table, 620px drawer with hero+sections+footer)
- [ ] `src/app/ops/tiers/page.tsx` — §U11 (3 stats, 4 tier cards, module matrix, drawer)
- [ ] `src/app/ops/modules/page.tsx` — §U12 (4 stats, 6 tabs, 2 filters, 7-col table, drawer)
- [ ] `src/app/ops/addons/page.tsx` — §U13 (4 stats, 5 tabs, 3-col card grid, drawer)
- [ ] `src/app/ops/billing/page.tsx` — §U14 (4 stats, 5 tabs, method filter, 7-col table, drawer with dunning)
- [ ] `src/app/ops/partners/page.tsx` — §U15 (4 stats, 4 tabs, 7-col table, drawer with tier benefits)
- [ ] `src/app/ops/support/page.tsx` — §U16 (4 stats, 5 tabs, 2 filters, 7-col table, drawer with timeline)
- [ ] `src/app/ops/staff/page.tsx` — §U17 (4 stats, 4 tabs, 7-col table with avatar, drawer with activity)
- [ ] `src/app/ops/releases/page.tsx` — §U18 (4 stats, 5 tabs, 2-col card grid, feature flags, drawer)
- [ ] `src/app/ops/infra/page.tsx` — §U19 (4 stats, alert callout, 6 service categories, metric cards)
- [ ] `src/app/ops/compliance/page.tsx` — §U20 (4 stats, overdue alert, 5 filing cards, 5 tabs, 7-col table, drawer)
- [ ] `src/app/ops/audit/page.tsx` — §U21 (4 stats, immutable log callout, 4 tabs, actor filter, activity stream, drawer with SHA-256)
- [ ] `src/app/ops/settings/page.tsx` — §U22 (7-tab vertical rail: Brand, Contacts, Tax, Payments, Limits, Webhooks, Keys)

**Files:** 17

---

## PHASE 17 — Module Workspace (Shared Component)

**READ FIRST:**
- **DESIGN-GUIDE.md** — Full document (Rules 1, 2 vertical accents, 5 color inheritance, 9, 10)
- **UI-BLUEPRINT.md** §U23 (WorkspaceShell — vertical-themed header, PIN auth gate, Brand component), §U24 (Launchpad — hero, grouped module cards, ModuleCard)
- §8 lines 231–253 → Config-driven verticals (activeBehaviours, activeModules, labelConfig)
- Code reference: `operations-dalxic/src/components/ops/Shell.tsx`, `Launchpad.tsx`

**Creates:** Module dashboard component shared by ops gateway and kiosk.
**Verify:** Renders allocated modules for a given org. Locked modules show tier required.

- [ ] `src/components/workspace/WorkspaceShell.tsx` — Vertical-themed header (Brand + org name + status + operator + logout), PIN auth gate (centered card, ambient glow, PIN input) — §U23
- [ ] `src/components/workspace/Launchpad.tsx` — Hero section (center-aligned, vertical label, gradient headline, 4 HeroStats), grouped module grid (category sections, ModuleCard per module) — §U24
- [ ] `src/components/workspace/ModuleCard.tsx` — 280px card, icon badge, title+blurb, live/preview/locked states, hover animation — §U24

**Files:** 3

---

## PHASE 18 — Ops → Tenant Gateway

**READ FIRST:**
- **DESIGN-GUIDE.md** — Rules 1, 2 (vertical accent for tenant's type), 9, 10
- **UI-BLUEPRINT.md** §U25 (Ops Gateway — layout fetches org, determines accent, no PIN required, "Back to Ops" flag)
- Phase 17 components (WorkspaceShell, Launchpad)
- Phase 20 components (module screens)

**Creates:** Secret gateway from ops into any tenant's module workspace.
**Verify:** Click tenant in ops → lands in their module dashboard → can open modules.

- [ ] `src/app/ops/tenants/[code]/layout.tsx` — Fetches org by code, determines vertical accent, wraps in WorkspaceShell with "from-ops" flag, no PIN gate — §U25
- [ ] `src/app/ops/tenants/[code]/page.tsx` — Launchpad for this tenant's modules — §U25
- [ ] `src/app/ops/tenants/[code]/catalogue/page.tsx` — Renders CataloguePage — §U27
- [ ] `src/app/ops/tenants/[code]/stock/page.tsx` — Renders StockPage — §U28
- [ ] `src/app/ops/tenants/[code]/contacts/page.tsx` — Renders ContactsPage — §U29
- [ ] `src/app/ops/tenants/[code]/pos/page.tsx` — Renders POSPage — §U30

**Files:** 6

---

## PHASE 19 — Kiosk Entry

**READ FIRST:**
- **DESIGN-GUIDE.md** — Rules 1, 2 (tenant's vertical accent), 6 (center-aligned login), 10
- **UI-BLUEPRINT.md** §U26 (Kiosk Entry — org code in URL, PIN login flow, redirect to modules)
- §U23 (WorkspaceShell — PIN login screen spec)
- Phase 17 components (WorkspaceShell, Launchpad)
- Phase 20 components (module screens)

**Creates:** Client-facing door. PIN login → same module workspace.
**Verify:** `/kiosk/KBH` → PIN screen → login → module dashboard.

- [ ] `src/app/kiosk/[code]/layout.tsx` — Fetches org by code, wraps in WorkspaceShell (PIN gate active) — §U26
- [ ] `src/app/kiosk/[code]/page.tsx` — PIN login screen (org code pre-filled from URL, read-only) — §U23, §U26
- [ ] `src/app/kiosk/[code]/modules/page.tsx` — Launchpad after login — §U24
- [ ] `src/app/kiosk/[code]/modules/catalogue/page.tsx` — Renders CataloguePage — §U27
- [ ] `src/app/kiosk/[code]/modules/stock/page.tsx` — Renders StockPage — §U28
- [ ] `src/app/kiosk/[code]/modules/contacts/page.tsx` — Renders ContactsPage — §U29
- [ ] `src/app/kiosk/[code]/modules/pos/page.tsx` — Renders POSPage — §U30

**Files:** 7

---

## PHASE 20 — Core Module Screens (Universal)

**READ FIRST:**
- **DESIGN-GUIDE.md** — Rules 1, 2, 9 (glass cards, data tables, drawers), 10
- **UI-BLUEPRINT.md** §U27 (Catalogue — stats, behaviour tabs, filters, 8-col table, drawer, create modal), §U28 (Stock — 4 tabs: levels/receive/adjust/movements), §U29 (Contacts — stats, type tabs, 7-col table, drawer, create modal), §U30 (POS — 3 nodes: item picker+cart, payment, receipt)
- §9 lines 257–276 → ServiceItem spec (catalogue fields)
- §21 lines 603–1415 → Sale Journey (full POS flow)
- §5 lines 86–108 → The spine (cart → receipt)

**Creates:** 4 working module screens used in both gateway and kiosk.
**Verify:** Full flow: add catalogue item → stock it → create contact → sell via POS → receipt.

- [ ] `src/components/modules/CataloguePage.tsx` — 4 stats, behaviour tabs, category+stockType filters, 8-col DataTable, 560px drawer (name/SKU/pricing/stock), create modal — §U27
- [ ] `src/components/modules/StockPage.tsx` — 4 tabs (Levels table, Receive form, Adjust form, Movements table), stock status coloring — §U28
- [ ] `src/components/modules/ContactsPage.tsx` — 4 stats, type tabs, 7-col DataTable, 560px drawer (all contact fields), create modal — §U29
- [ ] `src/components/modules/POSPage.tsx` — Node 1: item picker (60%) + cart (40%) → tender. Node 2: payment method + amount → process. Node 3: receipt card + print/new sale — §U30

**Files:** 4

---

## PHASE 21 — Root Layout + Placeholder Pages

**READ FIRST:**
- **DESIGN-GUIDE.md** — ALL RULES apply. Landing page is the fullest expression of the design language.
- Rules 1–10: ops baseline, color system, TM terminology, premium vectors, text hierarchy, center-aligned, infographic poster, editorial layout, component patterns, dark theme.

**Creates:** App shell and placeholder banners.
**Verify:** `/` renders placeholder. `/trade`, `/health`, `/institute` render placeholders.

- [x] `src/app/layout.tsx` — Root layout, dark theme, fonts
- [x] `src/app/page.tsx` — Coming soon landing page
- [ ] `src/app/trade/page.tsx` — Placeholder banner
- [ ] `src/app/health/page.tsx` — Placeholder banner
- [ ] `src/app/institute/page.tsx` — Placeholder banner

**Files:** 5

---

## PHASE 22 — Build & Verify

**READ FIRST:** Nothing — this is validation.

**Creates:** Nothing new. Validates everything works end-to-end.

- [ ] `npx prisma generate` — client generated
- [ ] `tsc --noEmit` — zero type errors
- [ ] `npm run build` — clean build
- [ ] Dev server tests:
  - [ ] `/` → placeholder
  - [ ] `/ops` → Master Command loads
  - [ ] `/ops/tenants` → tenant list renders
  - [ ] `/ops/tenants/KBH` → enters KBH module workspace
  - [ ] `/ops/tenants/KBH/catalogue` → catalogue works
  - [ ] `/ops/tenants/KBH/pos` → sale flow completes end-to-end
  - [ ] `/kiosk/KBH` → PIN login renders
  - [ ] `/kiosk/KBH/modules` → module dashboard after login
  - [ ] API: `POST /api/auth/login` → returns operator
  - [ ] API: full spine → receipt generated

---

## FILE COUNT

| Phase | Files | What |
|-------|-------|------|
| 0 | 7 | Scaffold |
| 1 | 7 | Database |
| 2 | 10 | Core lib |
| 3 | 5 | Engine (FROZEN) |
| 4 | 4 | Integrations |
| 5 | 1 | Middleware |
| 6 | 6 | Core API |
| 7 | 6 | Spine API |
| 8 | 3 | Receipts/Returns API |
| 9 | 4 | Stock API |
| 10 | 8 | Universal API |
| 11 | 2 | Payroll API |
| 12 | 4 | Health API |
| 13 | 8 | Institute API |
| 14 | 4 | Trade API |
| 15 | 5 | Ops components |
| 16 | 17 | Ops screens |
| 17 | 3 | Workspace components |
| 18 | 6 | Ops gateway |
| 19 | 7 | Kiosk entry |
| 20 | 4 | Module screens |
| 21 | 5 | Root + placeholders |
| 22 | 0 | Verify |
| **TOTAL** | **~116** | |

---

## RULES DURING BUILD

1. Engine files (Phase 3) are FROZEN after completion — never touched again
2. Before building ANY phase → read the listed § sections first
3. Build to spec from the master blueprint, not from memory
4. Every API route uses `ok()` / `fail()` — no raw NextResponse
5. Every mutation calls `logAudit()` — no exceptions
6. All money in pesewas internally, GHS on display
7. All data scoped to orgId — no cross-tenant leaks
8. No features beyond what's mapped here
9. Each phase verified before starting the next
10. Founder pushes to git — exact commands provided
