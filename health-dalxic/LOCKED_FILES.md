# LOCKED FILES REGISTRY — DalxicHealth
# Baseline: v1.0-presentation-ready (commit 55a4c34, 2026-04-13)
#
# RULE: Claude MUST NOT edit any file listed here without EXPLICIT user approval.
# If a task requires changing a locked file, Claude must:
#   1. Name the file and explain WHY it needs changing
#   2. Show the EXACT lines that would change
#   3. Wait for user to say "unlock [filename]" before proceeding
#   4. After the change, the file re-locks automatically
#
# The user (Owner) can unlock any file by saying "unlock [path]"
# Claude can NEVER self-unlock. No exceptions.

## CRITICAL — Security & Data Protection (NEVER touch without Owner approval)
- src/lib/data-protection.ts
- src/middleware.ts
- src/lib/rate-limit.ts
- src/lib/audit.ts
- src/lib/db.ts
- src/app/api/hospitals/route.ts
- src/app/api/system-config/route.ts
- src/app/api/operators/route.ts
- src/components/station-gate.tsx

## CRITICAL — Voice & Callout System (broke during presentation)
- src/lib/voice-callout.ts
- src/app/waiting-room/page.tsx
- src/app/api/callout/route.ts

## LOCKED — All Workstation Pages (UI complete, do not regress)
- src/app/page.tsx
- src/app/platform/page.tsx
- src/app/front-desk/page.tsx
- src/app/doctor/page.tsx
- src/app/pharmacy/page.tsx
- src/app/lab/page.tsx
- src/app/billing/page.tsx
- src/app/beds/page.tsx
- src/app/ward/page.tsx
- src/app/nurse-station/page.tsx
- src/app/icu/page.tsx
- src/app/maternity/page.tsx
- src/app/blood-bank/page.tsx
- src/app/radiology/page.tsx
- src/app/ultrasound/page.tsx
- src/app/injection-room/page.tsx
- src/app/emergency-override/page.tsx
- src/app/bookkeeping/page.tsx
- src/app/admin/page.tsx
- src/app/kiosk/page.tsx
- src/app/ops/page.tsx
- src/app/pricing/page.tsx
- src/app/print/ticket/page.tsx

## LOCKED — All API Routes (backend logic stable)
- src/app/api/queue/route.ts
- src/app/api/queue/emergency-admit/route.ts
- src/app/api/records/route.ts
- src/app/api/patients/search/route.ts
- src/app/api/cards/route.ts
- src/app/api/billing/route.ts
- src/app/api/beds/route.ts
- src/app/api/ward-ipd/route.ts
- src/app/api/lab-orders/route.ts
- src/app/api/lab-results/route.ts
- src/app/api/pharmacy/route.ts
- src/app/api/pharmacy/catalog/route.ts
- src/app/api/pharmacy/dispense/route.ts
- src/app/api/pharmacy/retail/route.ts
- src/app/api/pharmacy/stock/route.ts
- src/app/api/blood-bank/route.ts
- src/app/api/icu/route.ts
- src/app/api/imaging/route.ts
- src/app/api/injection-room/route.ts
- src/app/api/maternity/route.ts
- src/app/api/nurse-station/route.ts
- src/app/api/emergency/route.ts
- src/app/api/doctors/route.ts
- src/app/api/doctors/handover/route.ts
- src/app/api/doctors/route-patient/route.ts
- src/app/api/referrals/route.ts
- src/app/api/visit/route.ts
- src/app/api/books/route.ts
- src/app/api/bookkeeping/route.ts
- src/app/api/reports/route.ts
- src/app/api/chat/route.ts
- src/app/api/ai-summary/route.ts
- src/app/api/whatsapp/route.ts
- src/app/api/devices/route.ts
- src/app/api/access-grants/route.ts
- src/app/api/audit/route.ts
- src/app/api/groups/route.ts
- src/app/api/groups/dashboard/route.ts
- src/app/api/groups/patients/search/route.ts
- src/app/api/groups/referrals/route.ts
- src/app/api/heartbeat/route.ts
- src/app/api/parse/route.ts
- src/app/api/pusher/route.ts

## LOCKED — Library Files (core logic)
- src/lib/billing.ts
- src/lib/tokens.ts
- src/lib/tier-defaults.ts
- src/lib/whatsapp.ts
- src/lib/pusher-server.ts
- src/lib/pusher-client.ts
- src/lib/ai-summary.ts
- src/lib/book-autoclose.ts
- src/lib/parse-prompt.ts

## LOCKED — Components & UI System
- src/components/chat-panel.tsx
- src/components/intake/bulk-paste.tsx
- src/components/intake/quick-form.tsx
- src/components/ui/badge.tsx
- src/components/ui/button.tsx
- src/components/ui/card.tsx
- src/components/ui/input.tsx
- src/components/ui/motion.tsx
- src/components/ui/select.tsx
- src/components/ui/sidebar.tsx
- src/components/ui/tabs.tsx
- src/hooks/use-operator.ts
- src/hooks/use-station-theme.tsx
- src/types/index.ts

## LOCKED — Config (project foundation)
- next.config.mjs
- tailwind.config.ts
- prisma/schema.prisma
- package.json
- src/app/layout.tsx
- src/app/not-found.tsx
- src/app/robots.ts
- src/app/sitemap.ts

## LOCKED — v1.1 additions (new since v1.0 baseline)
- src/app/emergency-triage/page.tsx
- src/app/cards-bookings/page.tsx
- src/app/finance/page.tsx
- src/app/rates/page.tsx
- src/app/api/shifts/route.ts
- src/app/api/payouts/route.ts
- src/app/api/finance/revenue/route.ts
- src/app/api/pricing/route.ts
- src/lib/shifts.ts
- src/lib/payouts.ts
- src/lib/visit-state.ts
- src/types/patient-record.ts
- scripts/check-routes.ts
