# SECURITY BLUEPRINT — Dalxic

> This document specifies the full security architecture for the Dalxic backend.
> Every security phase in BUILD-BLUEPRINT.md references sections here.
> No security work starts without reading the relevant section first.
>
> **Authority:** Founder-approved. Security is non-negotiable.
> **Date:** 2026-04-18

---

## §S1 — THREAT MODEL

**What we protect:**
- Multi-tenant business data (financial, medical, educational)
- Payment processing (GHS via Paystack MoMo)
- PII (names, phones, medical records, salaries)
- Business operations (stock, receipts, payroll)

**Who attacks us:**
- Credential stuffing bots (PIN guessing)
- Competitor scrapers (data exfiltration)
- Rogue operators (privilege escalation from within)
- API abusers (zero-amount payments, fake returns)
- Curious developers (probing endpoints, reading source maps)

**Attack surface:**
- 45 API routes, PIN-based auth, header-based identity
- master_access backdoor (currently open)
- Unvalidated inputs on every POST/PATCH route
- PII in responses (PINs, phones, salaries, medical data)

---

## §S2 — CREDENTIAL FORTRESS

### §S2.1 — PIN Hashing (Argon2id)

**Why Argon2id:** Winner of the Password Hashing Competition. Resistant to GPU, ASIC, and side-channel attacks. Memory-hard — can't be parallelized cheaply.

**Implementation:**
- Install `@node-rs/argon2` (native Rust binding, fast on server)
- New lib file: `src/lib/api/hash.ts`
- Functions: `hashPin(pin: string): Promise<string>` and `verifyPin(pin: string, hash: string): Promise<boolean>`
- Config: memoryCost=65536 (64MB), timeCost=3, parallelism=1, hashLength=32
- Salt: auto-generated per hash (built into Argon2id output)

**Migration path:**
1. Hash all existing PINs in seed data
2. Login route: use `verifyPin()` instead of direct comparison
3. Operator create: hash before storage
4. Operator PIN update: hash before storage
5. Remove `@@unique([orgId, pin])` — can't index hashed values. Query by orgId, iterate and verify.

**DEVELOPER NOTE — Working with hashed PINs:**
- You can NO LONGER query `db.operator.findUnique({ where: { orgId_pin: ... } })`
- Login flow becomes: find all operators for org → iterate → verifyPin() on each
- This is intentional — makes PIN enumeration impossible at DB level
- Seed file must hash PINs before inserting
- PIN "1234" will look like `$argon2id$v=19$m=65536,t=3,p=1$...` in database

### §S2.2 — Master Access Hardening

**Current vulnerability:** Sending `x-operator-id: master_access` with any valid org code grants super_admin. No secret required.

**Fix:**
- Replace string comparison with HMAC-SHA256 signature verification
- New env var: `MASTER_SECRET` (32-byte random hex)
- Master access header becomes: `x-operator-id: master_access` + `x-master-sig: HMAC(orgCode, MASTER_SECRET)`
- `auth.ts` verifies: `timingSafeEqual(computedHmac, providedSig)`
- Without valid signature → treated as normal (failed) auth
- Timing-safe comparison prevents timing attacks on the signature

**DEVELOPER NOTE — Using master access in development:**
- Set `MASTER_SECRET` in `.env`
- Use helper: `generateMasterSig(orgCode)` exported from `src/lib/api/hash.ts`
- The ops gateway will compute this server-side — never exposed to client
- Kiosk NEVER uses master access — always PIN login

### §S2.3 — PIN Brute-Force Protection

**Current state:** `checkPinLockout()` exists but isn't wired to login.

**Fix — Wire to login route:**
1. Check lockout BEFORE any DB query
2. On failed PIN: `recordPinFailure(orgCode)`
3. On success: `clearPinFailures(orgCode)`
4. Lockout: 5 failures → 5 min lock, 10 → 10 min, 15 → 30 min, 20 → 60 min
5. Also apply `AUTH_RATE_LIMIT` (10 req/min per IP) on the login route

---

## §S3 — INPUT FORTRESS (Zod Validation)

### §S3.1 — Schema Registry

New file: `src/lib/api/schemas.ts`

Every POST/PATCH endpoint gets a Zod schema. Schemas enforce:
- Required fields are present
- Types are correct (string, number, boolean)
- Enums are validated (role can only be valid values)
- Numbers have bounds (price ≥ 0, quantity ≥ 1)
- Strings have length limits (name ≤ 200, notes ≤ 2000)
- No extra fields (`.strict()` mode)

### §S3.2 — Schema Definitions

```
Auth:
  loginSchema: { orgCode: string max(20), pin: string min(4) max(8) }

Operators:
  createOperatorSchema: {
    name: string min(2) max(200),
    phone: string max(20).optional(),
    pin: string min(4) max(8),
    role: enum("cashier","manager","admin","doctor","nurse","pharmacist","lab_tech","receptionist","teacher","accountant","registrar"),
    permissions: array(string).optional()
  }

Organization:
  updateOrgSchema: {
    name: string max(200).optional(),
    logoUrl: string url().optional(),
    tagline: string max(500).optional(),
    labelConfig: record.optional(),
    taxConfig: record.optional()
  }
  WHITELIST: Only these fields. Never paymentGate, tier, activeBehaviours, activeModules, active, maxOperators, maxBranches.

Branches:
  createBranchSchema: { name: string max(200), address: string max(500).optional(), phone: string max(20).optional() }

Categories:
  createCategorySchema: { name: string max(200), sortOrder: int min(0).optional(), parentId: string.optional() }

Catalogue (ServiceItem):
  createServiceItemSchema: {
    categoryId: string,
    name: string min(1) max(200),
    sku: string max(50).optional(),
    unit: string max(20).default("piece"),
    description: string max(2000).optional(),
    behaviour: enum("consultation","procedure","product","admission","recurring"),
    stockType: enum("physical","capacity","service"),
    costPrice: int min(0).default(0),
    sellingPrice: int min(0),
    stock: int min(0).default(0),
    minStock: int min(0).default(0),
    maxStock: int min(0).optional(),
    taxable: boolean.default(true),
    ...
  }

Cart:
  createCartSchema: { branchId: string, contactId: string.optional(), paymentGate: enum("pay_before","pay_after").optional() }
  addItemSchema: { serviceItemId: string, quantity: int min(1) max(9999), discount: int min(0).default(0) }
  updateItemSchema: { quantity: int min(1) max(9999) }

Payment:
  paySchema: {
    method: enum("cash","momo","card","bank_transfer","insurance"),
    amount: int min(1),
    reference: string max(200).optional()
  }
  RULE: amount MUST match tendered grandTotal (server validates, not client)

Returns:
  createReturnSchema: {
    paymentId: string,
    type: enum("void","refund"),
    reason: enum("defective","wrong_item","overcharge","customer_request","other"),
    reasonText: string max(2000).optional(),
    refundMethod: enum("cash","momo","credit"),
    items: array({ serviceItemId: string, itemName: string, unitPrice: int, quantity: int min(1), restock: boolean })
  }

Contacts:
  createContactSchema: {
    name: string min(1) max(200),
    phone: string max(20).optional(),
    email: string email().optional(),
    type: enum("patient","customer","student","member","guest"),
    dateOfBirth: string.optional(),
    gender: enum("male","female","other").optional(),
    ...
  }

Stock:
  receiveStockSchema: { serviceItemId: string, quantity: int min(1), batchNo: string.optional(), expiresAt: datetime.optional() }
  adjustStockSchema: { serviceItemId: string, newBalance: int min(0), reason: string min(1) max(500) }
  transferStockSchema: { serviceItemId: string, fromBranchId: string, toBranchId: string, quantity: int min(1) }

Admission:
  createAdmissionSchema: { contactId: string, serviceItemId: string, type: string, identifier: string }

Recurring:
  createRecurringSchema: { contactId: string, serviceItemId: string, interval: enum("daily","weekly","monthly","termly","yearly"), amount: int min(1), autoCharge: boolean.default(false) }

Clinical:
  createClinicalSchema: {
    contactId: string,
    type: enum("vitals","consultation","prescription","lab_order","lab_result","procedure_note","discharge"),
    data: object,
    status: enum("draft","active","completed")
  }

Health Queue:
  createQueueSchema: { contactId: string, department: string.optional(), chiefComplaint: string max(2000).optional(), symptomSeverity: int min(1) max(5).default(1), emergencyFlag: boolean.default(false) }

Institute:
  createGroupSchema: { name: string max(200), type: enum("class","cohort","department","custom").default("class"), academicYear: string.optional(), term: string.optional(), capacity: int.optional(), teacherId: string.optional() }
  createSubjectSchema: { name: string max(200), department: string.optional() }
  createExamSchema: { groupId: string, subjectId: string, name: string, term: string, academicYear: string, maxScore: int min(1), date: datetime }
  createGradeSchema: { examId: string, studentId: string, score: int min(0), grade: string, remarks: string.optional() }
  attendanceSchema: { groupId: string, date: datetime, records: array({ studentId: string, status: enum("present","absent","late","excused") }) }
  scheduleSchema: { groupId: string, subjectId: string, dayOfWeek: int min(0) max(6), startTime: string, endTime: string, room: string.optional() }

Trade:
  createSupplierSchema: { name: string, phone: string.optional(), email: string.optional(), address: string.optional() }
  createPOSchema: { supplierId: string, items: array({ serviceItemId: string, quantity: int min(1), unitCost: int min(0) }) }
  createShiftSchema: { branchId: string, openingCash: int min(0) }
  closeShiftSchema: { closingCash: int min(0) }
  createExpenseSchema: { category: string, description: string, amount: int min(1), paymentMethod: string, date: datetime }

Payroll:
  createPayRunSchema: { period: string regex(/^\d{4}-\d{2}$/) }
  createEmployeeSchema: { employeeCode: string, department: string, position: string, baseSalary: int min(0), ssnitTier: enum("T1","T2") }

Messages:
  sendMessageSchema: { type: enum("whatsapp","sms"), recipientId: string.optional(), recipientPhone: string, body: string max(2000) }
```

### §S3.3 — Validation Helper

```typescript
function validate<T>(schema: ZodSchema<T>, data: unknown): T | Response {
  const result = schema.safeParse(data)
  if (!result.success) return fail(result.error.issues[0].message)
  return result.data
}
```

Usage in every route:
```typescript
const body = validate(createOperatorSchema, await request.json())
if (body instanceof Response) return body
```

---

## §S4 — ROLE FORTRESS

### §S4.1 — Role Matrix

Every route gets explicit role requirements:

| Route | Allowed Roles | Why |
|-------|---------------|-----|
| POST /operators | owner, admin | Creating staff is admin-only |
| PATCH /org | owner, admin | Org settings are admin-only |
| POST /stock/adjust | owner, admin, manager | Stock adjustments need authority |
| POST /stock/receive | owner, admin, manager | Stock receiving needs authority |
| POST /stock/transfer | owner, admin, manager | Inter-branch transfers need authority |
| POST /returns | owner, admin, manager | Returns need authority (fraud risk) |
| POST /payroll/* | owner, admin, accountant | Payroll is financially sensitive |
| GET /payroll/* | owner, admin, accountant | Salary data is confidential |
| POST /health/clinical | owner, admin, doctor, nurse | Medical records need clinical role |
| POST /health/clinical/dispense | owner, admin, pharmacist | Dispensing needs pharmacy role |
| POST /health/clinical/lab-result | owner, admin, lab_tech | Lab results need lab role |
| POST /recurring/process | owner, admin | Triggering charges needs authority |
| GET /audit | owner, admin | Audit logs are sensitive |
| POST /cart | ALL | Any operator can start a sale |
| POST /cart/*/items | ALL | Any operator can add items |
| POST /cart/*/tender | ALL | Any operator can tender |
| POST /cart/*/pay | ALL | Any operator can process payment |
| GET /contacts | ALL | Any operator can look up contacts |
| POST /contacts | ALL | Any operator can register contacts |

### §S4.2 — Role Enum

Valid roles (enforced by Zod):
`cashier`, `manager`, `admin`, `owner`, `doctor`, `nurse`, `pharmacist`, `lab_tech`, `receptionist`, `teacher`, `accountant`, `registrar`

`super_admin` is NEVER assignable — only granted by verified master access.

---

## §S5 — RESPONSE SANITIZATION

### §S5.1 — Never Return These Fields

| Field | Why |
|-------|-----|
| `pin` | Credential — never exposed |
| `orgId` (internal) | Use `orgCode` instead for external references |
| `processedBy` (operator ID) | Internal reference — return name only |
| full `taxConfig` | Business configuration — internal |
| `meta` (unless needed) | May contain internal notes |

### §S5.2 — Operator Response Shape

```typescript
// ALWAYS use select, never return full operator
const SAFE_OPERATOR_SELECT = {
  id: true, name: true, phone: true, role: true,
  permissions: true, isActive: true, lastLoginAt: true, createdAt: true
}
```

### §S5.3 — Error Message Obfuscation

**NEVER reveal:**
- "Organization not found" → "Invalid credentials" (don't confirm org exists)
- "Operator not found" → "Invalid credentials"
- "PIN incorrect" → "Invalid credentials"
- Database errors → "An error occurred"
- Stack traces → never in production

**Login specifically:**
- Success: return operator + org
- Any failure: return exactly "Invalid credentials" with 401
- Same response time for valid org + wrong PIN vs invalid org (timing-safe)

---

## §S6 — RATE LIMITING MATRIX

| Endpoint | Config | Limit | Why |
|----------|--------|-------|-----|
| POST /auth/login | AUTH_RATE_LIMIT | 10/min per IP | Credential stuffing |
| POST /cart/*/pay | STRICT_RATE_LIMIT | 5/min per IP | Payment abuse |
| POST /returns | STRICT_RATE_LIMIT | 5/min per IP | Refund fraud |
| POST /recurring/process | STRICT_RATE_LIMIT | 5/min per IP | Double-charge prevention |
| POST /payroll/runs | STRICT_RATE_LIMIT | 5/min per IP | Payroll abuse |
| POST /stock/adjust | STRICT_RATE_LIMIT | 5/min per IP | Stock manipulation |
| ALL other POST/PATCH | DEFAULT | 30/min per IP | General abuse |
| ALL GET | DEFAULT | 30/min per IP | Scraping |

---

## §S7 — PAYMENT INTEGRITY

### §S7.1 — Amount Verification

The `POST /cart/[id]/pay` route MUST:
1. Re-calculate the cart total server-side (from cart items)
2. Compare against `body.amount`
3. Reject if they don't match (±0 tolerance)
4. For MoMo: verify with Paystack before marking complete

### §S7.2 — Idempotency

- Payment route accepts optional `idempotencyKey` header
- If same key seen within 24h, return cached result (don't double-charge)
- Store: in-memory Map with TTL (sufficient for single-instance Hobby tier)

### §S7.3 — Return Verification

Before creating a return:
1. Verify original payment exists and is "completed"
2. Verify return items exist in the original cart
3. Verify quantities don't exceed original quantities
4. Verify total refund ≤ original payment amount
5. Prevent double-return (check existing returns against same payment)

---

## §S8 — DECEPTION LAYER

### §S8.1 — Honeypot Endpoints

Create fake routes that look like admin panels. Any access triggers silent audit logging.

```
GET  /api/admin/users       → logs IP, returns empty 200
GET  /api/admin/config      → logs IP, returns fake config
POST /api/admin/export      → logs IP, returns fake CSV
GET  /api/v1/debug          → logs IP, returns 404
GET  /api/internal/health   → logs IP, returns 404
```

These look like typical admin endpoints that attackers probe for. Real endpoints don't follow this naming convention — so any hit is suspicious.

### §S8.2 — Misleading Server Identity

In middleware, set:
```
Server: cloudflare
X-Powered-By: PHP/8.2.0
```

Attackers scanning headers see PHP/Cloudflare, not Next.js/Vercel. They waste time trying PHP exploits.

### §S8.3 — Error Misdirection

All error responses follow the same shape:
```json
{ "success": false, "error": "..." }
```

Never:
- Stack traces
- File paths
- Library versions
- SQL error details
- "Cannot read property X of undefined"

Wrap all route handlers in try/catch returning generic errors.

### §S8.4 — Response Timing Normalization

Auth endpoints add random delay (50-150ms) to prevent timing attacks:
```typescript
await new Promise(r => setTimeout(r, 50 + Math.random() * 100))
```

Whether the org exists or not, whether the PIN is right or not — response time is the same window.

---

## §S9 — ORG FIELD PROTECTION

### §S9.1 — Whitelist-Only Updates

The `PATCH /org` route currently accepts `...body` — any field can be modified.

**Fix:** Explicit whitelist:
```typescript
const ALLOWED_ORG_UPDATES = ["name", "logoUrl", "tagline", "labelConfig", "taxConfig"]
```

Fields that NEVER accept client updates:
- `code` — immutable identity
- `type` — set at creation
- `tier` — only changed by billing system
- `paymentGate` — set at creation by vertical config
- `activeBehaviours` — set by vertical config
- `activeModules` — controlled by tier
- `active` — only changed by owner suspension flow
- `maxOperators` — controlled by tier
- `maxBranches` — controlled by tier
- `whatsappBundle` — controlled by tier
- `currency` — immutable
- `timezone` — immutable after creation

### §S9.2 — Contacts Field Protection

Similarly, `POST /contacts` should whitelist fields. Never allow client to set:
- `totalSpent` — calculated from payments
- `visitCount` — calculated from payments
- `loyaltyPoints` — calculated from system
- `loyaltyTier` — calculated from system

---

## §S10 — SEO FORTRESS

### §S10.1 — Technical SEO Infrastructure

| File | What It Does |
|------|-------------|
| `src/app/sitemap.ts` | Dynamic XML sitemap — auto-generates from page routes |
| `src/app/robots.ts` | robots.txt — allow indexing of marketing pages, block API/ops/kiosk |
| `src/app/layout.tsx` | Root metadata — title template, OG defaults, Twitter card defaults |
| `src/app/page.tsx` | Homepage meta — JSON-LD Organization schema, full OG tags |
| `src/app/manifest.ts` | PWA manifest with theme colors |

### §S10.2 — Meta Tag System

Every public page exports metadata:
```typescript
export const metadata: Metadata = {
  title: "Page Title | Dalxic",
  description: "...",
  openGraph: { title, description, images, type, url },
  twitter: { card: "summary_large_image", title, description, images },
  alternates: { canonical: "https://dalxic.com/..." }
}
```

### §S10.3 — JSON-LD Structured Data

Homepage includes Organization schema:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Dalxic",
  "description": "One universal business platform",
  "url": "https://dalxic.com",
  "logo": "https://dalxic.com/logo.png",
  "areaServed": { "@type": "Country", "name": "Ghana" },
  "sameAs": []
}
```

### §S10.4 — Sitemap Rules

```
ALLOW: /, /health, /trade, /institute, /pricing (marketing pages)
BLOCK: /api/*, /ops/*, /kiosk/*, /_next/*
```

### §S10.5 — Performance SEO

- Static generation for all marketing pages (no server-side rendering overhead)
- Image optimization via next/image
- Preconnect to critical origins (fonts, Pusher)
- Proper heading hierarchy (single h1 per page)
- Semantic HTML (main, section, article, nav)

---

## §S11 — DEVELOPER SELF-REFERENCE

> **READ THIS before touching any security code.**
> These are the traps you WILL fall into if you don't read this section.

### §S11.1 — PIN Hashing Gotchas

1. **You cannot search by PIN anymore.** Login must: query operators by org → iterate → verify each hash.
2. **Seed file must hash PINs.** Use `await hashPin("1234")` in seed, not raw "1234".
3. **Tests must hash PINs.** Any test that creates operators must hash.
4. **PIN comparison is async.** `verifyPin()` returns a Promise.
5. **Each hash is unique.** Same PIN produces different hash each time (salt). Don't compare hashes.

### §S11.2 — Master Access Gotchas

1. **You need MASTER_SECRET env var.** Without it, master access fails silently.
2. **Signature is per-orgCode.** Different org = different signature.
3. **Use the helper function.** Don't compute HMAC manually — use `generateMasterSig()`.
4. **Timing-safe comparison.** Never use `===` for signature comparison.

### §S11.3 — Zod Validation Gotchas

1. **`.strict()` rejects extra fields.** If client sends unknown fields, request fails.
2. **Numbers in JSON are already numbers.** Don't parse strings to ints — Zod handles type checking.
3. **The validate() helper returns `T | Response`.** Check `instanceof Response` before using data.
4. **Enums are case-sensitive.** "Admin" ≠ "admin".

### §S11.4 — Rate Limiting Gotchas

1. **In-memory store resets on deploy.** This is acceptable for Hobby tier — not persistent abuse protection.
2. **IP detection uses x-real-ip (Vercel sets this).** Cannot be spoofed on Vercel infrastructure.
3. **PIN lockout is per-orgCode, not per-IP.** Attacking one org doesn't lock others.

### §S11.5 — Honeypot Gotchas

1. **Don't add real functionality to honeypot routes.** They ONLY log and return fake data.
2. **Don't reference honeypots in any client code.** They should only be discovered by probing.
3. **Check honeypot logs regularly.** Hits = someone is scanning your API.

---

## §S12 — SECURITY FILE MAP

| File | What It Does | New/Modified |
|------|-------------|--------------|
| `src/lib/api/hash.ts` | hashPin, verifyPin, generateMasterSig, timingSafeCompare | NEW |
| `src/lib/api/schemas.ts` | All Zod schemas for every endpoint | NEW |
| `src/lib/api/sanitize.ts` | Response sanitization helpers, SAFE_OPERATOR_SELECT | NEW |
| `src/lib/api/honeypot.ts` | Honeypot logging helper | NEW |
| `src/lib/auth.ts` | Master access HMAC verification | MODIFIED |
| `src/lib/rate-limit.ts` | Already exists — no changes needed | EXISTING |
| `src/middleware.ts` | Add deceptive headers, tighten CSP | MODIFIED |
| `src/app/api/auth/login/route.ts` | Wire brute-force + hashed PIN verification | MODIFIED |
| `src/app/api/operators/route.ts` | Hash PIN on create, strip from response | MODIFIED |
| `src/app/api/org/route.ts` | Field whitelist on PATCH | MODIFIED |
| All 45 route files | Add Zod validation, role checks, rate limiting, try/catch | MODIFIED |
| `src/app/api/admin/users/route.ts` | Honeypot | NEW |
| `src/app/api/admin/config/route.ts` | Honeypot | NEW |
| `src/app/api/admin/export/route.ts` | Honeypot | NEW |
| `src/app/api/v1/debug/route.ts` | Honeypot | NEW |
| `src/app/api/internal/health/route.ts` | Honeypot | NEW |
| `src/app/sitemap.ts` | Dynamic XML sitemap | NEW |
| `src/app/robots.ts` | robots.txt generation | NEW |
| `src/app/manifest.ts` | PWA manifest | NEW |
| `prisma/seeds/seed.ts` | Hash PINs in seed data | MODIFIED |
| `.env.example` | Add MASTER_SECRET | MODIFIED |
