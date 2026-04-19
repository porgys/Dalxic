# DALXIC — PROJECT MASTER
### Last Updated: 2026-04-18

> **Read this FIRST every session. This is the project's single source of truth.**
> Design language will be added separately by the founder.

---

## WHAT IS DALXIC

One universal business platform. One engine runs hospitals, retail, restaurants, schools, salons, gyms, mechanics, hotels, pharmacies, law firms — all on 6 identical behaviours with different labels. Competitors see separate products. The shared engine is invisible.

**V6 Truth:** The 6 behaviours ARE the codebase. Everything else is config.
**Engine:** Nexus-7 (never called "AI")
**CTA:** "Enter Platform"
**Currency:** GHS (pesewas internally)
**Market:** Ghana / Africa
**Repo:** `porgys/Dalxic` (private)

### V6 System Architecture

```
dalxic/
├── engine/        ← 5 frozen payment files (BUILT)
├── behaviours/    ← 6 universal modules (~200 lines each)
│   consultation · procedure · product · admission · recurring · admin
├── verticals/     ← Config files (~50 lines each)
│   health · trade · restaurant · institute · salon · law · mechanic · gym · pharmacy · hotel
└── ui/            ← One themed component kit
```

No separate subsidiaries. Each vertical is a JSON config (`id`, `name`, `theme`, `terminology`).
**DalxicMedia** — separate product (forensic verification, COMPLETE).

---

## THE BLUEPRINT — `BLUEPRINT.md` (7,774 lines, 46 sections)

One document, five parts. V6 is the backbone.

| Part | Sections | What It Covers |
|------|----------|---------------|
| **I — V6 Foundation** | §1–§17 | 6 behaviours, engine, V6 system architecture, data model, API, config |
| **II — Flow Architecture** | §18–§20 | How to read flows, design principles, patchflow contracts, inventory |
| **III — 19 Flows** | §21–§40 | Every flow mapped node-by-node with intersection slots |
| **IV — Platform Concerns** | §41 | Analytics, SEO, security, scheduler, observability, data governance |
| **V — Execution** | §42–§46 | Open questions, audit gate, build phases, slot matrix, offline sync |

### Part I — V6 Foundation (§1–§17)

| § | What It Covers |
|---|---------------|
| §1 | The core truth — 6 universal behaviours |
| §2 | Universal behaviour table (zero dashes) |
| §3 | Three stock types (physical/capacity/service) |
| §4 | Two payment gates (pay-before/pay-after) |
| §5 | The spine + entry points per vertical |
| §6 | Engine — 5 frozen files with function signatures |
| **§7** | **V6 system architecture — engine/ + behaviours/ + verticals/ + ui/** |
| §8 | Config-driven verticals |
| §9 | ServiceItem — universal product table |
| §10 | Universal Contact |
| §11 | Admission + RecurringCharge |
| §12 | Vertical-specific extensions (Health, Institute, Trade) |
| §13 | Ghana tax rates and payment methods |
| §14 | API structure — ONE spine endpoint for ALL verticals |
| §15 | Color system |
| §16 | The moat |
| §17 | Build priority |

### Part III — The 19 Flows (§21–§40)

| § | Flow | Key Concept |
|---|------|-------------|
| §21 | Sale Journey | 5 nodes, 21 slots (S0-S21), vertical-agnostic |
| §22 | Return/Refund/Void | 3 modes + comp, 15 slots (R1-R15) |
| §23 | Day-Close | 9 nodes, blind-count, 15 slots (C1-C15) |
| §24 | Restock | 10 nodes, PO→GRN→landed cost, 15 slots (P1-P15) |
| §25 | Tenant Lifecycle | draft→trial→active→suspended→archived→purged |
| §26 | Auth/Session | 3 identities, PIN-primary |
| §27 | Billing | Master ops invoices tenants, dunning |
| §28 | Compliance/Filing | GRA E-VAT, SSNIT, PAYE |
| §29 | Enrollment (Institute) | application→admission→placement→fees |
| §30 | Attendance (Institute) | Daily tracking, guardian notifications |
| §31 | Fees (Institute) | Fee schedule → cart → spine |
| §32 | Reservation (Restaurant) | Floor plan, table assignment |
| §33 | Expense | Operational expenses, approval routing |
| §34 | Inventory Count | Blind count, variance, adjustment |
| §35 | Multi-Branch Transfer | Atomic inventory, in-transit tracking |
| §36 | Support | Ticket lifecycle, SLA |
| §37 | Remote Assistance | Co-pilot + takeover |
| §38 | Break-Glass/Device Kill | Emergency access, remote wipe |
| §39 | Release Rollout | Canary, wave, rollback |
| §40 | DOH Heartbeat | Anti-piracy, software keys, keeps Neon warm |

### Build Phases (§44)

| Phase | Codename | Scope | Duration |
|-------|----------|-------|----------|
| P1 | Boutique | Simple retail POS — sale, return, day-close, restock | 6–8 weeks |
| P2 | Foundation | Auth, billing, compliance, offline sync | 4–6 weeks |
| P3 | Multi-Vertical | Restaurant + Institute + multi-branch | 8–12 weeks |
| P4 | Enterprise | Support, remote assist, break-glass, release rollout, HSM | 6–8 weeks |

**P1 target:** A boutique in Osu can sign up, add products, sell via Cash + MoMo, close the day, restock, and get a WhatsApp receipt — all on a phone.

---

## WHAT EXISTS IN THE CODEBASE (2026-04-18)

### App Routes

| Route | Contents | Status |
|-------|----------|--------|
| `/` | Landing page | HAS UNAUTHORIZED CHANGES — unresolved |
| `/health/*` | 15 workstation pages + launchpad | Wired to live APIs |
| `/trade/*` | 23 pages + workstation | Predates V6 — needs engine alignment |
| `/institute/*` | 12 sub-pages + launchpad | Rebuilt from monolith |
| `/ops/*` | 16 control plane screens | Shipped |

### Health Workstations (15)

| Tier | Workstations |
|------|-------------|
| T1 (Clinic, 6 devices) | Front Desk, Doctor, Pharmacy, Lab, Billing, Waiting Room |
| T2 (Medium, 15 devices) | + Nurse Station, Injection Room, Records |
| T3 (Large, 35 devices) | + Radiology, Ultrasound, Ward/IPD |
| T4 (Full Hospital, 999) | + ICU, Maternity, Blood Bank + Bookkeeping |

### API Routes (20 groups)

```
CORE:        auth, org, operators, branches, audit
CATALOGUE:   catalogue, categories
SPINE:       cart (create/items/tender/pay)
FINANCIAL:   receipts, returns, payroll, reports
STOCK:       stock (receive/adjust/transfer)
UNIVERSAL:   contacts, admissions, recurring
HEALTH:      health/queue, health/clinical, health/clinical/dispense, health/clinical/lab-result
INSTITUTE:   groups, schedule (fees/members/staff DELETED — need rebuild)
TRADE:       (analytics/categories/inventory/products/sales DELETED — need rebuild)
SYSTEM:      heartbeat, messages
```

### Engine Files (5 — FROZEN)

```
src/lib/engine/sale.ts, receipt.ts, returns.ts, reconcile.ts, payment-methods.ts
```

### Components

```
src/components/ops/
  Shell.tsx, OpsShell.tsx, HealthShell.tsx, InstituteShell.tsx
  Launchpad.tsx, HealthLaunchpad.tsx, InstituteLaunchpad.tsx
  Icon.tsx, primitives.tsx
```

### Seed Orgs

| Code | Type | PIN |
|------|------|-----|
| KBH | Hospital | 1234 |
| DEMO | Trade | — |
| ACAD | Academy | — |

### Git State (2026-04-18)

- 10 commits on main
- **95 uncommitted changes** in working tree
- Last commit: `fix(visit-state): expand queued + lab_results_ready forward transitions`

---

## WORK RULES

1. **NEVER modify public-facing UI without explicit founder approval**
2. **NEVER create self-prompts or execute unauthorized tasks**
3. **NEVER delete data** — seeds insert-only, only Owner can suspend
4. **NEVER run `git add -A`** — stage specific files only
5. **NEVER add Claude/Anthropic attribution** in commits
6. **NEVER signal "Coming Soon"** to visitors
7. **NEVER run `prisma db push`** — raw SQL migrations only
8. **NEVER build while dev server runs** — kill, clear .next, restart
9. Build everything then test — never stop for step-by-step confirmation
10. UI first, then wire — finish and approve UI before connecting APIs
11. Map every flow BEFORE code (reference BLUEPRINT.md)
12. Surface-first: design from what screens need, not what actors do
13. Test full E2E flows, not just tsc
14. Double-test each completed bundle
15. Founder pushes — give exact git command
16. Local dev: localhost:3000 (Vercel Hobby 100/day limit)
17. Zero cost until revenue
18. All design decisions come from the founder
19. Always explain WHERE, WHAT, HOW when creating/saving anything

---

## DESIGN LANGUAGE

> To be defined by the founder. No design directives until explicitly provided.

---

## REFERENCE DOCUMENTS

| File | Role | Lines |
|------|------|-------|
| `MASTER.md` | This file — read FIRST | — |
| `BLUEPRINT.md` | ONE document: architecture + 19 flows + execution | 7,705 |
| `CLAUDE.md` | Auto-loaded → points to AGENTS.md | 1 |
| `AGENTS.md` | Next.js agent rules | 5 |

### Memory System

```
/Users/thecreator/.claude/projects/-Users-thecreator-Projects-Health-Dalxic/memory/
  MEMORY.md      — index (points to MASTER.md first)
  MASTER.md      — memory mirror with key summaries
  45+ files      — individual memories (may be outdated)
```

### Desktop Copy

```
/Users/thecreator/Desktop/DALXIC-MEMORY-SUMMARY.md
```

---

## UNRESOLVED

- [ ] Landing page has unauthorized changes — needs founder decision
- [ ] 95 uncommitted changes need review
- [ ] Trade pages need V6 engine alignment
- [ ] Trade + Institute API routes partially deleted — need rebuild on spine
- [ ] Design language not yet defined for this project

---

## SESSION LOG

| Date | What Changed |
|------|-------------|
| 2026-04-18 | Project MASTER.md created. Blueprint summaries with section references added. Memory system consolidated. 15 health workstations confirmed wired. Landing page issue identified. Opus 4.7 auto-update caused mid-session context loss. |
