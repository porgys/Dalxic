# UI BLUEPRINT — Dalxic

> Detailed specification for every UI surface in the platform.
> BUILD-BLUEPRINT.md phases 15–21 reference sections here.
> DESIGN-GUIDE.md governs visual language — this document governs structure and behaviour.
>
> **Reference implementation:** `operations-dalxic/src/` (read-only, never modified)
> **Design guide:** `dalxic/DESIGN-GUIDE.md` (8 founder rules)
> **Date:** 2026-04-18

---

## Section Index

| § | Title | What It Specifies |
|---|-------|-------------------|
| §U1 | Design Tokens | Color system, typography stack, spacing |
| §U2 | Icon System | SVG path-based icons, 50+ named icons |
| §U3 | Primitives | Card, Stat, Pill, Button, Field, DataTable, Drawer, Modal, Tabs, SearchBar, Section, Empty |
| §U4 | Format Utilities | money(), dateShort(), relativeDays(), pct() — Ghana defaults |
| §U5 | OpsShell | Fixed sidebar + sticky topbar, nav groups, emerald identity |
| §U6 | OpsPage | Page wrapper with title/subtitle/icon/action |
| §U7 | Mock Data | Ghana-realistic demo datasets for all screens |
| §U8 | Ops: Master Command | Platform dashboard — MRR, tenants, alerts, nav tiles |
| §U9 | Ops: Analytics | ARR, NRR, ARPA, waterfall chart, geo, adoption |
| §U10 | Ops: Tenants | Tenant registry + detail drawer + gateway button |
| §U11 | Ops: Tiers | Tier cards + module matrix + drawer |
| §U12 | Ops: Modules | Module catalogue, adoption bars, drawer |
| §U13 | Ops: Add-ons | Add-on marketplace cards, drawer |
| §U14 | Ops: Billing | Invoice table, payment methods, dunning, drawer |
| §U15 | Ops: Partners | Reseller network, commission, drawer |
| §U16 | Ops: Support | Ticket queue, SLA tracking, timeline, drawer |
| §U17 | Ops: Staff | Team directory, avatar, activity, drawer |
| §U18 | Ops: Releases | Release cards, canary rollout, feature flags, drawer |
| §U19 | Ops: Infra | Service health, uptime, latency, grouped by category |
| §U20 | Ops: Compliance | Tax/regulatory filings, filing cards, drawer |
| §U21 | Ops: Audit | Immutable log, SHA-256 chain, severity filtering, drawer |
| §U22 | Ops: Settings | Tab rail (Brand, Contacts, Tax, Payments, Limits, Webhooks, Keys) |
| §U23 | WorkspaceShell | Vertical-themed header + auth gate (PIN login) |
| §U24 | Launchpad | Module discovery grid — hero + grouped cards |
| §U25 | Ops Gateway | `/ops/tenants/[code]/` — enter tenant workspace as master |
| §U26 | Kiosk Entry | `/kiosk/[code]/` — PIN login → module dashboard |
| §U27 | Module: Catalogue | CRUD service items, categories, search, drawer |
| §U28 | Module: Stock | Levels, receive, adjust, movements, drawer |
| §U29 | Module: Contacts | CRUD contacts, type filter, drawer |
| §U30 | Module: POS | Cart builder → tender → pay → receipt (full sale flow) |

---

## §U1 — Design Tokens

All UI reads from a single `T` object. No raw color strings anywhere.

```typescript
export const T = {
  bg:        "#040A0F",          // Dark foundation
  surface:   "#081410",          // Card/elevated surface
  surface2:  "#0A1A14",          // Higher elevation
  border:    "rgba(16,185,129,0.10)",  // Subtle edge
  border2:   "rgba(16,185,129,0.18)",  // Brighter edge
  emerald:   "#10B981",          // Platform signature
  emeraldL:  "#34D399",          // Light emerald
  amber:     "#F59E0B",          // Trade accent
  amberL:    "#FBBF24",          // Light amber
  sky:       "#0EA5E9",          // Institute accent
  copper:    "#D97706",          // Health accent
  copperL:   "#E69A2E",          // Light copper
  tx:        "#ECF5F0",          // Primary text
  txM:       "#6B9B8A",          // Muted text
  txD:       "#3A6B5A",          // Dim text
  red:       "#EF4444",          // Danger
}
```

### Typography Stack

| Use | Font | Fallback |
|-----|------|----------|
| Headings | Space Grotesk | sans-serif |
| Body / UI | DM Sans | sans-serif |
| Mono / labels | DM Mono | monospace |

**Loading:** Google Fonts via `next/font/google` in root layout.

### Spacing

- Page padding: `32px` horizontal, `32px` top, `80px` bottom
- Section margin-bottom: `32px`
- Card padding: `24px` default
- Card border-radius: `16px`
- Max content width: `1480px`

---

## §U2 — Icon System

SVG path-based icon library. Single `<Icon>` component renders by name.

```typescript
export type IconName = "dashboard" | "pos" | "inventory" | ... (50+ names)

export function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.6, style }: Props)
```

**Rendering:** `<svg viewBox="0 0 24 24" fill="none" stroke={color}>` with `<path d={PATHS[name]} />`.

### Required Icons (minimum set)

**Ops nav:** dashboard, trending, tenants, partners, support, tiers, modules, addons, billing, staff, releases, infra, compliance, audit, settings
**Actions:** menu, close, search, plus, edit, trash, check, chevron-right, download, print, share, filter, logout, lock
**Data:** phone, mail, whatsapp, calendar, tag, user
**System:** globe, shield, database, flag, bolt, layers, code, sparkle
**Commerce:** pos, inventory, orders, stock, branches, suppliers, po, returns, receipts, labels
**Finance:** coa, journals, financials, expenses, tax, reconciliation, shifts, payroll, reports
**Roles:** customers, loyalty, roles, analytics

---

## §U3 — Primitives

Every component accepts an `accent` prop: `"emerald" | "amber" | "sky" | "copper"`.
All use inline styles referencing `T.*` tokens. No external CSS classes.

### Card

```typescript
Card({ children, padding = 24, style, hover = false, accent = "emerald" })
```
- Glass morphism: `backdrop-filter: blur(16px)`
- Background: `rgba({accent_rgb}, 0.03)`
- Border: `1px solid rgba({accent_rgb}, 0.10)`
- Hover (optional): border brightens to `0.25` opacity

### Stat (KPI Card)

```typescript
Stat({ label, value, sub?, accent = "emerald", icon? })
```
- Wraps `Card`. Label top (mono, uppercase, dim), value large (30px, Space Grotesk, bold), sub bottom (11px, muted).
- Optional icon badge top-right (28×28 rounded square, accent bg at 12%).

### Pill (Status Badge)

```typescript
Pill({ tone = "emerald", children, dot = false })
```
- 6 tones: emerald, amber, sky, copper, red, neutral
- Pill-shaped (radius 999), uppercase mono, tiny (10px)
- Optional dot indicator (6px circle)

### Button

```typescript
Button({ children, onClick, variant = "primary", size = "md", icon?, disabled?, full? })
```
- **primary:** emerald gradient fill, white text, glow shadow
- **ghost:** transparent, border, muted text
- **outline:** transparent, emerald border, emerald text
- **danger:** red gradient, white text
- 3 sizes: sm (7px 14px), md (10px 20px), lg (14px 28px)
- Scale animation on press (0.98)

### Field / Input / TextArea / Select

```typescript
Field({ label, children, hint? })  // Wrapper with mono label
Input(props)                        // Styled input
TextArea(props)                     // Styled textarea (min-height 96px)
Select(props)                       // Styled select
```
- All share `inputBase` style: full width, 11px padding, radius 10, subtle bg + border

### SearchBar

```typescript
SearchBar({ value, onChange, placeholder = "Search…" })
```
- Input with search icon positioned absolute left

### DataTable

```typescript
DataTable<T>({ rows, columns, empty?, onRowClick? })
```
- Wraps in `Card` with `padding: 0`
- Header row: mono, uppercase, dim, tiny (9px)
- Body rows: subtle bottom border, hover highlight (emerald 4%)
- Row click → call onRowClick handler (usually opens Drawer)
- Empty state: centered text in card

### Column interface

```typescript
interface Column<T> { key: string; label: string; render: (row: T) => ReactNode; width?; align? }
```

### Modal

```typescript
Modal({ open, onClose, title, children, width = 560 })
```
- Fixed overlay, centered, blur backdrop
- Escape key closes
- Header with title + close button, body with padding

### Drawer

```typescript
Drawer({ open, onClose, title, subtitle?, children, width = 480, footer? })
```
- Fixed right side, slide-in transition (translateX)
- Overlay with blur
- Header (title + subtitle + close), scrollable body, fixed footer
- Escape key closes
- **This is the primary detail view pattern** — row click → drawer opens

### Tabs

```typescript
Tabs<T>({ tabs, value, onChange, accent = "emerald" })
```
- Horizontal tab strip with bottom border
- Active tab: accent color, bold, 2px bottom border
- Each tab: `{ key, label, icon?, count? }`
- Count badge: small rounded pill (mono)

### Section

```typescript
Section({ title, sub?, action?, children })
```
- Header with h2 title (Space Grotesk, 18px) + optional subtitle + optional action button
- Children below

### Empty

```typescript
Empty({ icon = "search", title, sub?, action? })
```
- Centered card with icon badge, title, subtitle, optional action button

---

## §U4 — Format Utilities

Ghana-localized formatters. All monetary values in pesewas internally, displayed as GHS.

```typescript
money(value, { compact?, symbol? })    // "GHS 1,234.00" or "GHS 1.2K"
moneyShort(value)                       // Shorthand: compact + symbol
dateShort(iso)                          // "18 Apr 2026"
dateTime(iso)                           // "18 Apr, 14:30"
relativeDays(iso)                       // "Today" / "Yesterday" / "3 days ago"
pct(value, total)                       // "45.2%"
```

---

## §U5 — OpsShell

Master operations layout. Fixed sidebar (240px) + sticky topbar. Emerald platform identity.

### Sidebar

- **Position:** Fixed left, full height, 240px wide, z-index 40
- **Background:** `#02070A` (darker than page bg)
- **Brand:** DalxicOps logo (emerald gradient square + bolt icon) + "Master" label
- **Nav groups** (5 groups):

| Group | Items |
|-------|-------|
| Overview | Command, Analytics |
| Customers | Tenants, Partners, Support |
| Catalog | Tiers, Modules, Add-ons |
| Revenue | Billing |
| Platform | Staff, Releases, Infra, Compliance, Audit, Settings |

- Group labels: mono, uppercase, dim, tiny, spaced
- Items: icon + label, active state = emerald text + 2px left border + emerald bg 10%
- **Verticals box** at bottom: emerald-bordered card linking to DalxicTrade (amber), DalxicHealth (copper), DalxicInstitute (sky)

### TopBar

- **Position:** Sticky top, z-index 30, blur backdrop
- **Left:** "Master Control" badge (mono, border) + subtitle "Platform-wide · All tenants · All verticals"
- **Right:** Public Site link, "All Systems Operational" status (pulsing green dot), user avatar pill (initials + name + role)

---

## §U6 — OpsPage

Page wrapper for every ops screen.

```typescript
OpsPage({ children, title, subtitle?, action?, icon? })
```

- Max width 1480px, centered
- Header: emerald label "DalxicOperations · Master" + icon, h1 title (38px, Space Grotesk), subtitle (14px, muted), action button right-aligned
- Children below header

---

## §U7 — Mock Data

Ghana-realistic demo data. All in one file (`src/lib/ops/mock.ts`).

### Core Datasets

| Export | Type | Count | Purpose |
|--------|------|-------|---------|
| MOCK_TENANTS | MockTenant[] | 12-24 | Tenant registry (code, name, owner, type, tier, status, region, MRR, modules, behaviours) |
| MOCK_TIERS | MockTier[] | 4 | Starter, Growth, Pro, Enterprise (pricing, limits, behaviours, modules) |
| MOCK_MODULES | MockModule[] | 40+ | Module catalogue (name, category, vertical, status, adoption, minTier) |
| MOCK_ADDONS | MockAddon[] | 10-12 | Add-on marketplace (name, category, price, unit, activeCount) |
| MOCK_INVOICES | MockInvoice[] | 12-20 | Billing (tenantId, period, amount, status, method) |
| MOCK_TICKETS | MockTicket[] | 10-15 | Support (tenantId, subject, priority, status, category, assignee, SLA) |
| MOCK_PARTNERS | MockPartner[] | 6-8 | Reseller network (name, tier, region, tenants, commission) |
| MOCK_STAFF | MockStaff[] | 6-8 | Internal ops team (name, role, region, status, tenants, tickets) |
| MOCK_RELEASES | MockRelease[] | 6-8 | Deployments (version, title, stage, vertical, rollout%, modules) |
| MOCK_INFRA | MockService[] | 12-16 | Infrastructure (name, category, status, uptime, latency, throughput) |
| MOCK_FILINGS | MockFiling[] | 10-15 | Tax/regulatory (tenantId, type, period, amount, status, dueDate) |
| MOCK_PLATFORM_AUDIT | MockAuditEvent[] | 15-20 | Immutable log (actor, action, target, severity, timestamp, hash) |
| MOCK_MRR_SERIES | MRRPoint[] | 7 | Monthly MRR trend (month, mrr, newMrr, churn) |
| MOCK_REGIONS | Region[] | 5 | Geographic distribution (name, tenants, mrr) |
| MOCK_PLATFORM_SETTINGS | PlatformSettings | 1 | Brand, contacts, tax rates, payment config, limits, webhooks, apiKeys |
| MOCK_FEATURE_FLAGS | FeatureFlag[] | 5-6 | Feature toggles (name, scope, enabled, owner) |

### Vertical-Specific Datasets

| Export | Purpose |
|--------|---------|
| TRADE_MODULES | 25 modules across 6 groups (Sales, Inventory, Purchasing, Accounting, Operations, Admin) |
| HEALTH_MODULES | 14 clinical modules (Clinical, Diagnostics, Inpatient, Specialist, Admin) |
| INSTITUTE_MODULES | 15 academic modules (Enrollment, Academics, Finance, Scheduling, Admin) |

### Ghana Realism Requirements

- Names: Ghanaian (Kwame, Ama, Kofi, Akosua, etc.)
- Phone: +233 format
- Currency: GHS, pesewas
- Regions: Greater Accra, Ashanti, Western, Northern, Volta
- Tax: VAT 15%, NHIL 2.5%, GETFund 2.5%, COVID Levy 1%
- SSNIT: Tier 1 (13.5% employer, 5.5% employee), Tier 2 (same split)
- Org codes: 3-4 uppercase letters (KBH, DEMO, ACAD, etc.)

---

## §U8 — Ops: Master Command (`/ops`)

The platform dashboard. Everything-at-a-glance.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  4 STAT CARDS (row)                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │Tenants │ │  MRR   │ │Outstand│ │ Urgent │       │
│  └────────┘ └────────┘ └────────┘ └────────┘       │
├─────────────────────────────────────────────────────┤
│  2 COLUMNS                                           │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │ MRR Trajectory   │  │ Tier Mix          │         │
│  │ (bar chart, 7mo) │  │ (progress bars)   │         │
│  └──────────────────┘  └──────────────────┘         │
├─────────────────────────────────────────────────────┤
│  QUICK NAV — 16 tiles (4-column grid)               │
│  Each tile: icon + label + count → links to page    │
├─────────────────────────────────────────────────────┤
│  2 COLUMNS                                           │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │ Recent Activity  │  │ Alerts            │         │
│  │ (8 audit events) │  │ (6 action items)  │         │
│  └──────────────────┘  └──────────────────┘         │
└─────────────────────────────────────────────────────┘
```

### Stat Cards

1. **Active Tenants** — count, sub: "X trial · Y past due", icon: tenants, emerald
2. **MRR** — sum of active tenant MRR, sub: "ARR GHS X", icon: trending, emerald
3. **Outstanding** — sum of overdue+sent invoices, icon: billing, amber
4. **Urgent** — open urgent/high tickets + degraded services, icon: support, amber/red

### MRR Trajectory

- 7-month bar chart (CSS/SVG bars)
- Each bar: month label, MRR value, emerald gradient
- Height proportional to max MRR
- Latest month percentage growth label

### Tier Mix

- One row per tier: name, active tenant count, MRR, horizontal progress bar
- Bar width = tier_tenants / total_tenants %

### Quick Nav Tiles

16 tiles linking to all ops screens. Each: icon (emerald circle bg), label, count value.
4-column grid. Hover: translateY(-2px), border brightens.

### Recent Activity

- 8 most recent audit events
- Each row: severity-colored icon, actor name, action description, relative timestamp

### Alerts

- 6 items: overdue invoices, expiring trials, SLA breaches, degraded services, pending filings, etc.
- Each: icon, label, count, link arrow

---

## §U9 — Ops: Analytics (`/ops/analytics`)

Deep telemetry. Revenue, retention, adoption, geography.

### Stat Cards (4)

1. **ARR** — MRR × 12, emerald
2. **NRR** — Net Retention Rate %, sky
3. **ARPA** — Avg Revenue Per Account, emerald
4. **Active Operators** — total across tenants, amber

### MRR Waterfall

- 7 months, each month shows two bars: green (new MRR) and red (churn)
- Net change labeled above

### MRR Trend Line

- SVG area chart with gradient fill (emerald)
- 7 data points, smooth interpolation

### Geographic Distribution

- 5 regions (Greater Accra, Ashanti, etc.)
- Each: name, tenant count, MRR, horizontal progress bar (width = region_mrr / max_mrr %)

### Module Adoption

- Top 8 modules sorted by adoption %
- Each: name, adoption %, horizontal bar
- Color thresholds: 60%+ emerald, 30-60% amber, <30% red

---

## §U10 — Ops: Tenants (`/ops/tenants`)

Most complex screen. Full tenant directory with deep detail drawer.

### Stat Cards (5)

Total, Active, Trial, Past Due, MRR

### Tabs

All | Active | Trial | Past Due | Suspended (each with count)

### Filters (3 dropdowns + search)

- Type: All / Trade / Health / Institute / Restaurant / Salon
- Region: All / Greater Accra / Ashanti / Western / Northern / Volta
- Tier: All / Starter / Growth / Pro / Enterprise

### DataTable Columns (8)

| Column | Width | Content |
|--------|-------|---------|
| Code | 80px | Mono, uppercase |
| Tenant | flex | Name (bold) + owner name below (dim) |
| Type | 100px | Pill (amber for trade, copper for health, sky for institute) |
| Tier | 100px | Pill |
| Status | 100px | Pill (tone-mapped) |
| Region | 120px | Text |
| MRR | 100px, right | money() formatted |
| Health | 80px | HealthBar component (colored bar + %) |

### Drawer (620px) — on row click

**Hero header:**
- Tenant name (h3), code (mono), region
- Status/Tier/Type pills in row
- MRR highlight (large, emerald)

**4 mini stats:** Branches, Users, Health %, Modules count

**Sections:**
1. **Owner & Contact** — name, phone, email rows
2. **Behaviours** — 6 tag grid (active behaviours with payment gate pill)
3. **Label Config** — if custom labels, show overrides
4. **Active Modules** — tag grid of module names
5. **Add-ons** — if any, amber tags
6. **Billing Summary** — paid/outstanding amounts, last 4 invoices (date, amount, status pill)
7. **Support Tickets** — if any, category + assignee

**Footer actions:** Login as Owner, Change Tier, Suspend/Reactivate

---

## §U11 — Ops: Tiers (`/ops/tiers`)

### Stat Cards (3)

Active Tiers, Monthly Revenue (sum), Most Popular tier name

### Tier Card Grid (4 cards)

Each card:
- Icon badge (emerald gradient square)
- Tier ID (mono), name (h3), tagline
- Pricing: monthly (large, emerald) + annual
- Limits section: branches, users, transactions/mo, SLA response
- Behaviours checklist: 6 items with check/x icons
- Module count badge
- Active tenant count pill

Hover: translateY(-3px), border brightens

### Module Coverage Matrix

Horizontal scrolling table:
- Rows: each module (name + vertical pill)
- Columns: one per tier
- Cells: checkmark (included), price (add-on), dash (not available)

### Drawer (560px) — on tier card click

- Tier name, tagline, monthly price (highlight)
- Annual pricing card
- Limits card (branches, users, transactions, SLA)
- Behaviours section (6 toggles)
- Bundled modules list (with category)
- Subscribers section (top 5 tenants, +X more count)
- Footer: Preview Public, Duplicate, Save Changes

---

## §U12 — Ops: Modules (`/ops/modules`)

### Stat Cards (4)

Total Modules, GA count, Beta count, Avg Adoption %

### Tabs

All | Trade | Health | Institute | Restaurant | Universal (each with count)

### Filters (2 dropdowns + search)

Category (all categories), Min Tier (all tiers)

### DataTable Columns (7)

Module icon+name+ID, Category, Vertical pill, Behaviour, Min Tier, Adoption bar+%, Status pill

### Drawer (560px) — on row click

Name, ID, description, 3 mini stats (Status, Adoption, Min Tier), Available In (tier list), Dependencies, Add-on pricing, Active Tenants (top 5), Footer: Edit, API Docs, Save

---

## §U13 — Ops: Add-ons (`/ops/addons`)

### Stat Cards (4)

Catalog count, Monthly Recurring, One-Off MTD, Total Activations

### Tabs

All | Messaging | Capacity | Support | Integration (with counts)

### Card Grid (3 columns)

Each addon card: icon, category pill, name (h3), description, price+unit, active count badge
Hover: translateY(-2px)

### Drawer (520px) — on card click

Icon, name, ID, description, 3 mini stats (Price, Unit, Active), Subscribers (top 5), Footer: Edit, Sales CSV, Save

---

## §U14 — Ops: Billing (`/ops/billing`)

### Stat Cards (4)

Collected MTD, Outstanding, Overdue, MoMo Share %

### Tabs

All | Paid | Sent | Overdue | Draft (with counts)

### Filters (1 dropdown + search)

Method: All / Momo / Bank / Card

### DataTable Columns (7)

Invoice ID, Tenant name+ID, Period, Due date, Amount, Method (colored), Status pill

### Drawer (560px) — on row click

Status pill, Amount Due (large), Invoice details (number, period, issued, due), Tenant details (name, code, tier, contact), Payment details (method, reference), Overdue callout (if applicable, red dashed, dunning schedule), Footer: Print, PDF, Send Reminder / Mark Paid

---

## §U15 — Ops: Partners (`/ops/partners`)

### Stat Cards (4)

Partners count, Tenants Referred, Commission YTD, Platinum count

### Tabs

All | Active | Paused | Pending (with counts)

### DataTable Columns (7)

Code, Partner name+contact+phone, Tier pill, Region, Tenants count, YTD Commission, Status pill

### Drawer (520px)

Status/tier pills, name, joined date, 3 mini stats (Tenants, Commission, Rate), Primary Contact, Tier Benefits callout, Footer: Send Brief, Commission Statement, Save

---

## §U16 — Ops: Support (`/ops/support`)

### Stat Cards (4)

Total Tickets, Open count, Urgent count, SLA < 1h (breach count)

### Tabs

All | Open | Pending | Resolved | Closed (with counts)

### Filters (2 dropdowns + search)

Priority (All/Urgent/High/Normal/Low), Category

### DataTable Columns (7)

Ticket ID, Subject+tenant+messages, Category, Priority pill, Assignee, SLA time remaining (colored: <30m red, <2h amber, else emerald), Status pill

### Drawer (560px)

Priority/Status/Category pills, Subject, opened date, assignee, message count, Last Message section (full text), Timeline section (4-5 events: dots, connecting vertical line, title, subtitle, timestamp), Footer: Reassign, Reply, Mark Resolved

---

## §U17 — Ops: Staff (`/ops/staff`)

### Stat Cards (4)

Total Staff, Online Now, Open Tickets (sum), Tenants Covered (sum)

### Tabs

All | Online | Away | Offline (with counts)

### DataTable Columns (7)

Avatar+name+email, Role pill, Region, Tenants assigned, Open tickets, Last Active, Status pill

### Avatar component

- Initials in gradient circle (28×28)
- Status indicator dot: green (online), amber (away), grey (offline)

### Drawer (520px)

Avatar+name+email, status pill, 5 mini stats (Role, Region, Joined, Tenants, Tickets), Recent Actions section (6 latest audit events for this person), Footer: Message, Edit Role, Revoke Access

---

## §U18 — Ops: Releases (`/ops/releases`)

### Stat Cards (4)

Total Releases, Stable count, In Canary count, Breaking Changes count

### Tabs

All | Canary | Rolling | Stable | Draft (with counts)

### Release Card Grid (2 columns)

Each card: version ID (mono), title (h3), summary, stage/breaking pills, released date, vertical pill, rollout progress bar + %
Hover: translateY(-2px)

### Feature Flags Section

Table rows: flag name, scope, toggle switch (visual), last toggled, owner, ON/OFF pill

### Drawer (560px) — on card click

Stage/Vertical/Breaking pills, title, summary, Rollout section (%, date, progress bar), Affected Modules (pills), Breaking change callout (if any, red dashed), Footer: View PR, Release Notes, Promote/Complete Rollout

---

## §U19 — Ops: Infra (`/ops/infra`)

### Stat Cards (4)

Operational count, Degraded count, Down count, Avg Uptime 30d %

### Alert Callout

If any service degraded/down: amber dashed box with warning text

### Service Cards — Grouped by Category

6 categories: API, Database, Messaging, Payments, Storage, Queue
Each category: section header + 2-column grid of service cards

Each service card:
- Icon + name + provider
- Status pill (operational=emerald, degraded=amber, down=red)
- 3 metric boxes: Uptime 30d %, Latency ms, Throughput (req/s or msg/s)
- Region note (if applicable)

---

## §U20 — Ops: Compliance (`/ops/compliance`)

### Stat Cards (4)

Total Filings, Due This Period, Overdue, Outstanding GHS

### Overdue Alert

If any overdue: red dashed callout with GRA penalty context

### Filing Type Cards (5)

VAT-3, SSNIT, PAYE, DPA, GRA-Annual
Each: status pill, count active/total, brief description

### Tabs

All | Due | Overdue | Filed | Accepted (with counts)

### DataTable Columns (7)

Filing ID, Tenant name+ID, Type pill, Period, Due date (red if overdue), Amount, Status pill

### Drawer (540px)

Status/type pills, tenant name+ID, description, 4 mini stats (Period, Due, Filed, Amount), Authority Reference, Overdue callout, Footer: Notify Tenant, Download Proof, Mark Filed

---

## §U21 — Ops: Audit (`/ops/audit`)

### Stat Cards (4)

Total Events (7 days), Critical count, Warnings count, Staff Active (unique actors)

### Immutable Log Callout

Emerald dashed box explaining append-only, SHA-256 chain integrity

### Tabs

All | Critical | Warn | Info (with counts)

### Filters (1 dropdown + search)

Actor: All + unique actor names from data

### Activity Stream

Rows (not DataTable — custom layout):
- Severity-colored icon (left)
- Actor name + role + relative timestamp (top)
- Action → target · detail (bottom)
- Severity pill (right)
- Click opens drawer

### Drawer (520px)

Severity/role pills, action detail text, timestamp, 6 mini stats (Actor, Role, Action, Target, Tenant, IP), Integrity section (SHA-256 chain hash in mono), Footer: Copy ID, Export Row

---

## §U22 — Ops: Settings (`/ops/settings`)

### Layout: Vertical Tab Rail (left) + Panel (right)

**Tab rail** (200px fixed left):
7 tabs with icon + label + subtitle. Active: emerald bg, inverted icon.

| Tab | Icon | Subtitle |
|-----|------|----------|
| Brand | flag | Platform identity |
| Contacts | phone | Support & billing |
| Tax | tax | Ghana rates |
| Payments | billing | MoMo & card |
| Limits | shield | Free trial & session |
| Webhooks | bolt | Event delivery |
| Keys | lock | API credentials |

### Tab Panels

**Brand:** 4 rows — Platform Name, Parent Company, Legal Name, Accent Color (with color swatch)
**Contacts:** 4 rows — Support Email, Billing Email, Phone, WhatsApp
**Tax:** VAT/NHIL/GETFund/COVID Levy cards (4-column grid) + SSNIT tiers (employer/employee split)
**Payments:** MoMo providers (pills), Card providers (pills), Settlement Window (T+N days)
**Limits:** 4 rows — Free Trial days, Max File Upload MB, Session Timeout mins, PIN Attempts
**Webhooks:** Table of event/URL/active/pills + Add Webhook button
**Keys:** API key cards (label, created, last used, masked key, Copy/Rotate) + Danger Zone callout (red dashed)

---

## §U23 — WorkspaceShell

Vertical-themed header + PIN auth gate. Used by both kiosk and ops gateway.

### Pattern

```typescript
WorkspaceShell({ children, accent, verticalName, orgCode? })
```

- **Auth gate:** If no session → show PIN login screen. If session → show header + children.
- **Header:** Sticky top, blur backdrop. Left: Brand component (e.g. "Dalxic **Trade**" with vertical gradient). Right: All Modules link, Online status, operator name, End Session button.
- **Brand component:** "Dalxic" in light grey + vertical name in accent gradient.

### PIN Login Screen

- Centered card (400px), glass morphism
- Ambient glow circles (accent + emerald, blurred, behind card)
- Brand at top, "Workstation Sign-In" label
- Org Code field (uppercase)
- PIN field (4 digits, numeric, masked, large mono, centered)
- Error message (red, below PIN)
- "Enter Workstation" button (primary, full width, lg)
- "Powered By DalxicOperations" footer

### Accent by Vertical

| Vertical | Accent | Gradient |
|----------|--------|----------|
| Trade | amber (#F59E0B) | amber → #FBBF24 |
| Health | copper (#D97706) | copper → #E69A2E |
| Institute | sky (#0EA5E9) | sky → #38BDF8 |

---

## §U24 — Launchpad (Module Discovery Grid)

Module grid shown after login. Hero section + grouped module cards.

### Pattern

```typescript
Launchpad({ orgName, modules, accent, verticalLabel })
```

### Hero Section

- Center-aligned, generous spacing
- Label: mono, uppercase, accent color (e.g. "DalxicTrade Workstation")
- Headline: 56px, bold, two-line with gradient accent word
- Subtitle: 16px, muted, max-width 720px
- 4 HeroStat boxes: Modules Live, Modules In Preview, Currency (GHS), Branches

### Module Groups

Grouped by category. Each group:
- Section header: group name (mono, accent, uppercase) + blurb + "N modules"
- Card grid: `repeat(auto-fit, 280px)`, centered

### ModuleCard

- 280px min, 132px min-height
- Icon badge (40×40, accent bg 10%)
- Status: "Preview" pill (if preview) or lock icon (if locked)
- Title (15px, bold) + blurb (12px, muted)
- Hover: translateY(-2px), bg brightens, border brightens
- Locked: opacity 0.4, cursor not-allowed
- Click: navigates to module page

### Group Definitions per Vertical

**Trade:** Sales, Inventory, Purchasing, Accounting, Operations, Admin
**Health:** Clinical, Diagnostics, Inpatient, Specialist, Admin
**Institute:** Enrollment, Academics, Finance, Scheduling, Admin

---

## §U25 — Ops Gateway (`/ops/tenants/[code]/`)

Secret gateway from ops into any tenant's workspace. Master ops enters as observer/admin.

### Architecture

```
/ops/tenants/[code]/layout.tsx    → Fetches org by code, wraps in WorkspaceShell
/ops/tenants/[code]/page.tsx      → Launchpad (module grid) for this tenant
/ops/tenants/[code]/catalogue/    → Catalogue module
/ops/tenants/[code]/stock/        → Stock module
/ops/tenants/[code]/contacts/     → Contacts module
/ops/tenants/[code]/pos/          → POS module
```

### Layout

- Fetches tenant org from API by code
- Determines vertical accent from org type
- Sets "from-ops" context flag (shows "Back to Ops" navigation)
- Wraps children in WorkspaceShell with tenant's accent + name

### No PIN Required

Ops gateway does NOT require PIN — master ops is already authenticated via ops session.

---

## §U26 — Kiosk Entry (`/kiosk/[code]/`)

Client-facing door. PIN login → module dashboard.

### Architecture

```
/kiosk/[code]/layout.tsx          → Fetches org, PIN auth gate
/kiosk/[code]/page.tsx            → PIN login screen (WorkspaceShell handles)
/kiosk/[code]/modules/page.tsx    → Launchpad after login
/kiosk/[code]/modules/catalogue/  → Catalogue module
/kiosk/[code]/modules/stock/      → Stock module
/kiosk/[code]/modules/contacts/   → Contacts module
/kiosk/[code]/modules/pos/        → POS module
```

### Login Flow

1. User visits `/kiosk/KBH` (org code in URL)
2. System fetches org by code → determines vertical + accent
3. PIN login screen (from WorkspaceShell) → org code pre-filled, read-only
4. Enter PIN → API call to `/api/auth/login`
5. Success → redirect to `/kiosk/KBH/modules`
6. Fail → error message, retry

---

## §U27 — Module: Catalogue

CRUD for service items. Shared by ops gateway + kiosk.

### Layout

```
CataloguePage component (used in both entry points)
```

### Stat Cards (4)

Total Items, Physical Stock, Capacity, Service-type

### Tabs

All | Product | Consultation | Procedure | Admission | Recurring (by behaviour, with counts)

### Filters (2 dropdowns + search)

Category (from org's categories), Stock Type (physical/capacity/service)

### DataTable Columns (8)

Name+SKU, Category, Behaviour pill, Stock Type, Cost Price, Selling Price, Stock level (colored if below min), Status

### Drawer (560px) — on row click

Name, SKU, category, description, 4 mini stats (Behaviour, Stock Type, Cost, Selling), Stock section (current, min, max, reorder point), Pricing section, Meta fields (if any), Footer: Edit, Deactivate

### Create Modal (560px)

All fields from createServiceItemSchema: name, SKU, category, behaviour, stockType, unit, costPrice, sellingPrice, stock, minStock, maxStock, description, etc.

---

## §U28 — Module: Stock

Inventory management. Levels, receive, adjust, movements.

### Tabs

Levels | Receive | Adjust | Movements

### Levels Tab

DataTable: item name, current stock, min stock, status (green/amber/red), last movement date
Color: stock >= min = emerald, stock < min = amber, stock = 0 = red

### Receive Tab

Form: select service item, quantity, batch no, expiry date, reference
→ POST `/api/stock/receive`

### Adjust Tab

Form: select service item, new balance, notes
→ POST `/api/stock/adjust`

### Movements Tab

DataTable of recent stock movements: date, item, type pill (sale/receive/adjust/transfer), quantity (+/-), balance before/after, performed by

---

## §U29 — Module: Contacts

CRUD contacts. Universal across verticals (patients, customers, students, etc.).

### Stat Cards (4)

Total, type breakdown (e.g. Patients / Customers / Students depending on vertical)

### Tabs

By contact type (dynamic from vertical config) + All

### DataTable Columns (7)

Name, Phone, Email, Type pill, Gender, Group (if set), Created date

### Drawer (560px)

Name, phone, email, type, DOB, gender, blood group, allergies, guardian, group, insurance, emergency contact, meta, Footer: Edit, Create Cart

### Create Modal

Fields from createContactSchema

---

## §U30 — Module: POS (Sale Flow)

The spine in UI form. Cart → Tender → Pay → Receipt.

### Node 1: Item Picker (left) + Cart (right)

**Left panel (60%):**
- Category tabs across top
- Item grid: cards with name, price, stock badge
- Search bar
- Click item → adds to cart (or increments quantity)

**Right panel (40%):**
- Cart header: customer name (if set), item count
- Cart items list: name, quantity (editable ±), unit price, line total, remove button
- Subtotal, tax, discount, total
- Customer selector (search contacts)
- Notes field
- "Tender" button (primary, full width) → POST `/api/cart/{id}/tender`

### Node 2: Payment

After tender:
- Cart summary (read-only)
- Total due (large, prominent)
- Payment method selector: Cash, MoMo, Card, Bank Transfer, Insurance, Credit
- Amount field (pre-filled with total)
- Reference field (for MoMo/card/bank)
- "Process Payment" button → POST `/api/cart/{id}/pay`

### Node 3: Receipt

After payment:
- Receipt card: receipt code, date, items, totals, payment method, operator
- Print button, New Sale button

### States

- Empty cart → show empty state with "Start scanning" message
- Cart with items → show tender button
- Tendered → show payment screen
- Paid → show receipt

---

## BUILD CROSS-REFERENCE

Each BUILD-BLUEPRINT.md phase references these sections:

| Phase | UI Blueprint §§ |
|-------|-----------------|
| 15 — Ops Components | §U1, §U2, §U3, §U4, §U5, §U6 |
| 16 — Ops Screens | §U7, §U8–§U22 |
| 17 — Workspace | §U23, §U24 |
| 18 — Ops Gateway | §U25 |
| 19 — Kiosk Entry | §U26 |
| 20 — Module Screens | §U27, §U28, §U29, §U30 |
| 21 — Root/Placeholders | (design guide only) |
