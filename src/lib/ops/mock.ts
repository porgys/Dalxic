/* ═══════════════════════════════════════════════════════════════
   DALXIC OPERATIONS — MOCK DATA
   Realistic Ghana-flavoured demo data for every screen until the
   matching API is wired. Single source. Tweak here, screens follow.
   ═══════════════════════════════════════════════════════════════ */

import { IconName } from "@/components/ops/Icon"

export type ModuleStatus = "live" | "preview" | "locked"

export interface ModuleDef {
  slug: string
  title: string
  group: "Sales" | "Inventory" | "Purchasing" | "Accounting" | "Operations" | "Admin"
  status: ModuleStatus
  blurb: string
  href: string
}

export const TRADE_MODULES: ModuleDef[] = [
  { slug: "dashboard",       group: "Sales",      status: "live",    title: "Dashboard",          blurb: "Today at a glance — revenue, alerts, low stock",   href: "/modules/workstation" },
  { slug: "pos",             group: "Sales",      status: "live",    title: "Point Of Sale",      blurb: "Charge customers in seconds — cash, MoMo, card",   href: "/modules/workstation" },
  { slug: "orders",          group: "Sales",      status: "live",    title: "Orders",             blurb: "Every receipt, every refund, fully searchable",    href: "/modules/workstation" },
  { slug: "receipts",        group: "Sales",      status: "preview", title: "Receipts",           blurb: "Reprint, resend, void — full audit trail",         href: "/modules/receipts" },
  { slug: "returns",         group: "Sales",      status: "preview", title: "Returns & Refunds",  blurb: "Refund flow with restock and reason codes",        href: "/modules/returns" },
  { slug: "customers",       group: "Sales",      status: "preview", title: "Customers",          blurb: "Profiles, credit, history, loyalty tier",          href: "/modules/customers" },
  { slug: "loyalty",         group: "Sales",      status: "preview", title: "Loyalty & Promos",   blurb: "Points, tiers, discount rules, BOGOF",             href: "/modules/loyalty" },

  { slug: "inventory",       group: "Inventory",  status: "live",    title: "Inventory",          blurb: "Photo-first catalogue, batches, expiry",           href: "/modules/workstation" },
  { slug: "stock",           group: "Inventory",  status: "preview", title: "Stock Operations",   blurb: "Transfers, counts, adjustments, reorder points",   href: "/modules/stock" },
  { slug: "branches",        group: "Inventory",  status: "preview", title: "Multi-Branch",       blurb: "Per-branch stock and consolidated view",           href: "/modules/branches" },
  { slug: "labels",          group: "Inventory",  status: "preview", title: "Barcode Labels",     blurb: "Designer, sheet preview, print queue",             href: "/modules/labels" },

  { slug: "suppliers",       group: "Purchasing", status: "preview", title: "Suppliers",          blurb: "Vendor master, ledgers, contact directory",        href: "/modules/suppliers" },
  { slug: "purchase-orders", group: "Purchasing", status: "preview", title: "Purchase Orders",    blurb: "Create POs, receive goods, landed cost",           href: "/modules/purchase-orders" },

  { slug: "accounting",      group: "Accounting", status: "preview", title: "Chart Of Accounts",  blurb: "Five-class GL tree, opening balances",             href: "/modules/accounting/coa" },
  { slug: "journals",        group: "Accounting", status: "preview", title: "Journals & Ledger",  blurb: "Double-entry posting, GL drill-down",              href: "/modules/accounting/journals" },
  { slug: "financials",      group: "Accounting", status: "preview", title: "Financial Reports",  blurb: "P&L, Balance Sheet, Cash Flow",                    href: "/modules/accounting/reports" },
  { slug: "expenses",        group: "Accounting", status: "preview", title: "Expenses",           blurb: "Petty cash, approvals, attached receipts",         href: "/modules/expenses" },
  { slug: "tax",             group: "Accounting", status: "preview", title: "Tax Engine",         blurb: "VAT + NHIL + GETFund + COVID, GRA E-VAT",          href: "/modules/tax" },
  { slug: "reconciliation",  group: "Accounting", status: "preview", title: "Bank & MoMo Recon",  blurb: "Match statement to ledger, find variances",        href: "/modules/reconciliation" },

  { slug: "shifts",          group: "Operations", status: "preview", title: "Shifts & Till",      blurb: "Open, close, declare cash, Z-report",              href: "/modules/shifts" },
  { slug: "payroll",         group: "Operations", status: "preview", title: "Payroll",            blurb: "SSNIT Tier 1/2/3, PAYE, payslips",                 href: "/modules/payroll" },
  { slug: "analytics",       group: "Operations", status: "live",    title: "Analytics",          blurb: "Revenue trends, top sellers, mix",                 href: "/modules/workstation" },
  { slug: "reports",         group: "Operations", status: "preview", title: "Reports Library",    blurb: "30+ pre-built reports, schedule, export",          href: "/modules/reports" },

  { slug: "audit",           group: "Admin",      status: "preview", title: "Audit Log",          blurb: "Who did what, immutable, exportable",              href: "/modules/audit" },
  { slug: "roles",           group: "Admin",      status: "preview", title: "Roles & Access",     blurb: "Granular module x action permissions",             href: "/modules/roles" },
]

/* ───── Customers ───── */
export interface MockCustomer {
  id: string
  name: string
  phone: string
  email?: string
  tier: "Bronze" | "Silver" | "Gold" | "Platinum"
  creditLimit: number
  balance: number
  lifetimeSpend: number
  visits: number
  lastVisit: string
  status: "active" | "dormant"
  joined: string
}

export const MOCK_CUSTOMERS: MockCustomer[] = [
  { id: "C001", name: "Akosua Mensah",       phone: "+233 24 555 0101", email: "akosua@example.com",      tier: "Platinum", creditLimit: 5000, balance:  240, lifetimeSpend: 48200, visits: 142, lastVisit: "2026-04-14", status: "active",  joined: "2024-01-22" },
  { id: "C002", name: "Kwame Asante",        phone: "+233 20 555 0102", email: "kwame.a@example.com",     tier: "Gold",     creditLimit: 2500, balance:    0, lifetimeSpend: 28100, visits:  88, lastVisit: "2026-04-13", status: "active",  joined: "2024-03-05" },
  { id: "C003", name: "Ama Owusu",           phone: "+233 26 555 0103",                                   tier: "Silver",   creditLimit: 1000, balance:  120, lifetimeSpend: 11400, visits:  41, lastVisit: "2026-04-11", status: "active",  joined: "2024-08-19" },
  { id: "C004", name: "Yaw Boateng",         phone: "+233 54 555 0104", email: "yawb@example.com",        tier: "Gold",     creditLimit: 3000, balance: 1450, lifetimeSpend: 31200, visits: 102, lastVisit: "2026-04-09", status: "active",  joined: "2023-11-02" },
  { id: "C005", name: "Esi Nyarko",          phone: "+233 27 555 0105",                                   tier: "Bronze",   creditLimit:  500, balance:    0, lifetimeSpend:  3200, visits:  18, lastVisit: "2026-03-22", status: "active",  joined: "2025-09-14" },
  { id: "C006", name: "Kojo Darko",          phone: "+233 24 555 0106",                                   tier: "Silver",   creditLimit: 1500, balance:  680, lifetimeSpend:  9700, visits:  33, lastVisit: "2026-04-12", status: "active",  joined: "2024-10-30" },
  { id: "C007", name: "Adwoa Pokuaa",        phone: "+233 50 555 0107", email: "adwoa.p@example.com",     tier: "Platinum", creditLimit: 7500, balance:    0, lifetimeSpend: 62800, visits: 188, lastVisit: "2026-04-15", status: "active",  joined: "2023-04-11" },
  { id: "C008", name: "Kofi Acquah",         phone: "+233 24 555 0108",                                   tier: "Bronze",   creditLimit:  500, balance:  220, lifetimeSpend:  1900, visits:   8, lastVisit: "2026-02-18", status: "dormant", joined: "2025-12-01" },
  { id: "C009", name: "Abena Sarpong",       phone: "+233 27 555 0109", email: "abena.s@example.com",     tier: "Gold",     creditLimit: 2000, balance:    0, lifetimeSpend: 22400, visits:  74, lastVisit: "2026-04-10", status: "active",  joined: "2024-06-08" },
  { id: "C010", name: "Nana Kweku Addo",     phone: "+233 24 555 0110",                                   tier: "Silver",   creditLimit: 1200, balance:    0, lifetimeSpend:  7800, visits:  29, lastVisit: "2026-04-08", status: "active",  joined: "2024-12-19" },
  { id: "C011", name: "Sister Comfort",      phone: "+233 24 555 0111",                                   tier: "Bronze",   creditLimit:  300, balance:   90, lifetimeSpend:  2200, visits:  14, lastVisit: "2026-04-05", status: "active",  joined: "2025-07-22" },
  { id: "C012", name: "Jessica Tetteh",      phone: "+233 50 555 0112", email: "jess@example.com",        tier: "Gold",     creditLimit: 2500, balance:  450, lifetimeSpend: 18900, visits:  62, lastVisit: "2026-04-14", status: "active",  joined: "2024-04-17" },
]

/* ───── Suppliers ───── */
export interface MockSupplier {
  id: string
  name: string
  contact: string
  phone: string
  email?: string
  category: string
  paymentTerms: string
  outstanding: number
  ytdPurchases: number
  status: "active" | "on_hold"
  rating: 1 | 2 | 3 | 4 | 5
}

export const MOCK_SUPPLIERS: MockSupplier[] = [
  { id: "S001", name: "Ashfoam Wholesale Ltd",  contact: "Mr. Frimpong",   phone: "+233 30 222 1100", email: "orders@ashfoam.gh",   category: "Bedding & Foam",      paymentTerms: "Net 30",       outstanding:  4200, ytdPurchases:  82400, status: "active",  rating: 5 },
  { id: "S002", name: "Melcom Distribution",    contact: "Ms. Akoto",      phone: "+233 30 222 1101", email: "trade@melcom.com",    category: "FMCG",                paymentTerms: "Net 14",       outstanding:     0, ytdPurchases: 142800, status: "active",  rating: 4 },
  { id: "S003", name: "Fan Milk Ghana",         contact: "Mr. Nketiah",    phone: "+233 30 277 0202",                               category: "Dairy & Frozen",      paymentTerms: "COD",          outstanding:     0, ytdPurchases:  38900, status: "active",  rating: 5 },
  { id: "S004", name: "Kasapreko Company Ltd",  contact: "Sales Desk",     phone: "+233 30 277 8800",                               category: "Beverages",           paymentTerms: "Net 30",       outstanding:  1850, ytdPurchases:  51200, status: "active",  rating: 4 },
  { id: "S005", name: "Unilever Ghana",         contact: "Trade Account",  phone: "+233 30 266 4400", email: "trade.gh@unilever.com", category: "FMCG",              paymentTerms: "Net 30",       outstanding:  6700, ytdPurchases: 118200, status: "active",  rating: 5 },
  { id: "S006", name: "Promasidor Ghana",       contact: "Mr. Otoo",       phone: "+233 30 222 5544",                               category: "FMCG",                paymentTerms: "Net 30",       outstanding:     0, ytdPurchases:  29400, status: "active",  rating: 4 },
  { id: "S007", name: "Tema Lubricants",        contact: "Mrs. Ofori",     phone: "+233 30 320 1188",                               category: "Hardware & Auto",     paymentTerms: "Net 14",       outstanding:   980, ytdPurchases:  14600, status: "active",  rating: 3 },
  { id: "S008", name: "GIHOC Distilleries",     contact: "Mr. Boadu",      phone: "+233 30 222 7766",                               category: "Beverages",           paymentTerms: "COD",          outstanding:     0, ytdPurchases:  19800, status: "on_hold", rating: 3 },
  { id: "S009", name: "Olam Ghana",             contact: "Mr. Mahama",     phone: "+233 30 222 9988", email: "trade.gh@olamnet.com", category: "Grains & Staples",   paymentTerms: "Net 45",       outstanding: 12400, ytdPurchases: 168900, status: "active",  rating: 5 },
  { id: "S010", name: "Cocoa Processing Co.",   contact: "Trade Desk",     phone: "+233 30 277 1144",                               category: "Confectionery",       paymentTerms: "Net 30",       outstanding:     0, ytdPurchases:  22100, status: "active",  rating: 4 },
]

/* ───── Purchase Orders ───── */
export interface MockPO {
  id: string
  poNumber: string
  supplierId: string
  supplier: string
  date: string
  expectedDate: string
  status: "draft" | "sent" | "partial" | "received" | "cancelled"
  total: number
  items: { name: string; qty: number; unit: string; cost: number }[]
}

export const MOCK_POS: MockPO[] = [
  { id: "PO001", poNumber: "PO-2026-0142", supplierId: "S005", supplier: "Unilever Ghana",       date: "2026-04-12", expectedDate: "2026-04-19", status: "sent",      total: 8400, items: [
    { name: "Omo Detergent 1kg",           qty: 120, unit: "carton",  cost: 35 },
    { name: "Geisha Soap 6-pack",          qty:  80, unit: "pack",    cost: 18 },
    { name: "Lipton Tea 100ct",            qty:  40, unit: "box",     cost: 24 },
  ]},
  { id: "PO002", poNumber: "PO-2026-0141", supplierId: "S001", supplier: "Ashfoam Wholesale",    date: "2026-04-10", expectedDate: "2026-04-17", status: "received",  total: 4200, items: [
    { name: "Ashfoam Pillow Standard",     qty:  50, unit: "piece",   cost: 38 },
    { name: "Ashfoam Mattress Cover Q",    qty:  30, unit: "piece",   cost: 75 },
  ]},
  { id: "PO003", poNumber: "PO-2026-0140", supplierId: "S009", supplier: "Olam Ghana",           date: "2026-04-08", expectedDate: "2026-04-22", status: "partial",   total: 12400, items: [
    { name: "Royal Aroma Rice 50kg",       qty:  60, unit: "bag",     cost: 180 },
    { name: "Cooking Oil 5L",              qty:  40, unit: "jerrycan", cost: 42 },
  ]},
  { id: "PO004", poNumber: "PO-2026-0139", supplierId: "S004", supplier: "Kasapreko Co. Ltd",    date: "2026-04-06", expectedDate: "2026-04-13", status: "received",  total: 1850, items: [
    { name: "Alomo Bitters 200ml",         qty: 144, unit: "bottle",  cost: 12 },
  ]},
  { id: "PO005", poNumber: "PO-2026-0138", supplierId: "S002", supplier: "Melcom Distribution",  date: "2026-04-04", expectedDate: "2026-04-11", status: "received",  total: 6800, items: [
    { name: "Pampers Diaper Maxi",         qty:  40, unit: "pack",    cost: 95 },
    { name: "Always Pads Mega",            qty:  60, unit: "pack",    cost: 28 },
  ]},
  { id: "PO006", poNumber: "PO-2026-0137", supplierId: "S007", supplier: "Tema Lubricants",      date: "2026-04-02", expectedDate: "2026-04-09", status: "received",  total:  980, items: [
    { name: "Engine Oil 5W-30 4L",         qty:  20, unit: "bottle",  cost: 49 },
  ]},
  { id: "PO007", poNumber: "PO-2026-0136", supplierId: "S003", supplier: "Fan Milk Ghana",       date: "2026-03-31", expectedDate: "2026-04-02", status: "received",  total: 2400, items: [
    { name: "FanIce Vanilla Tub",          qty:  60, unit: "tub",     cost: 18 },
    { name: "FanYogo Strawberry",          qty: 200, unit: "sachet",  cost:  3.2 },
  ]},
  { id: "PO008", poNumber: "PO-2026-0135", supplierId: "S001", supplier: "Ashfoam Wholesale",    date: "2026-03-28", expectedDate: "2026-04-04", status: "received",  total: 5800, items: [
    { name: "Ashfoam King Mattress",       qty:  10, unit: "piece",   cost: 580 },
  ]},
  { id: "PO009", poNumber: "PO-2026-0134", supplierId: "S010", supplier: "Cocoa Processing Co.", date: "2026-03-26", expectedDate: "2026-04-02", status: "cancelled", total: 1400, items: [
    { name: "Golden Tree Drinking Choc",   qty:  40, unit: "tin",     cost: 35 },
  ]},
  { id: "PO010", poNumber: "PO-2026-0143", supplierId: "S005", supplier: "Unilever Ghana",       date: "2026-04-15", expectedDate: "2026-04-22", status: "draft",     total: 3200, items: [
    { name: "Pepsodent 100g",              qty: 200, unit: "tube",    cost: 16 },
  ]},
]

/* ───── Returns ───── */
export interface MockReturn {
  id: string
  date: string
  receiptCode: string
  customer: string
  items: { name: string; qty: number; refund: number }[]
  reason: "Defective" | "Wrong Item" | "Customer Changed Mind" | "Expired" | "Damaged In Transit"
  total: number
  method: "Cash" | "Mobile Money" | "Card" | "Store Credit"
  restocked: boolean
  status: "completed" | "pending"
  approvedBy?: string
}

/* ───── Chart of Accounts ───── */
export type AccountClass = "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
export type AccountKind  = "Header" | "Detail"

export interface MockAccount {
  code: string
  name: string
  cls: AccountClass
  kind: AccountKind
  parent?: string
  balance: number
  ytdActivity: number
  active: boolean
  taxCode?: "VAT_OUT" | "VAT_IN" | "EXEMPT" | "ZERO"
  notes?: string
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  /* ─── Assets ─── */
  { code: "1000", name: "Assets",                       cls: "Asset",     kind: "Header", balance: 248600, ytdActivity:       0, active: true },
  { code: "1100", name: "Current Assets",               cls: "Asset",     kind: "Header", parent: "1000", balance: 168400, ytdActivity:       0, active: true },
  { code: "1110", name: "Cash on Hand",                 cls: "Asset",     kind: "Detail", parent: "1100", balance:  18400, ytdActivity:  82400, active: true, notes: "Till float across branches" },
  { code: "1120", name: "Bank — GCB Main",              cls: "Asset",     kind: "Detail", parent: "1100", balance:  62100, ytdActivity: 184200, active: true },
  { code: "1130", name: "Bank — Stanbic Operations",    cls: "Asset",     kind: "Detail", parent: "1100", balance:  24800, ytdActivity:  98400, active: true },
  { code: "1140", name: "MoMo Wallet — MTN Merchant",   cls: "Asset",     kind: "Detail", parent: "1100", balance:  14200, ytdActivity: 142800, active: true },
  { code: "1150", name: "MoMo Wallet — Vodafone Cash",  cls: "Asset",     kind: "Detail", parent: "1100", balance:   4900, ytdActivity:  38900, active: true },
  { code: "1200", name: "Accounts Receivable",          cls: "Asset",     kind: "Detail", parent: "1100", balance:  22400, ytdActivity:  64200, active: true },
  { code: "1300", name: "Inventory",                    cls: "Asset",     kind: "Detail", parent: "1100", balance:  21600, ytdActivity: 142000, active: true },
  { code: "1500", name: "Fixed Assets",                 cls: "Asset",     kind: "Header", parent: "1000", balance:  80200, ytdActivity:       0, active: true },
  { code: "1510", name: "Furniture & Fittings",         cls: "Asset",     kind: "Detail", parent: "1500", balance:  28000, ytdActivity:   8400, active: true },
  { code: "1520", name: "Equipment & POS Hardware",     cls: "Asset",     kind: "Detail", parent: "1500", balance:  42400, ytdActivity:  18200, active: true },
  { code: "1590", name: "Accumulated Depreciation",     cls: "Asset",     kind: "Detail", parent: "1500", balance: -10200, ytdActivity:   4200, active: true },

  /* ─── Liabilities ─── */
  { code: "2000", name: "Liabilities",                  cls: "Liability", kind: "Header", balance:  68400, ytdActivity:       0, active: true },
  { code: "2100", name: "Accounts Payable",             cls: "Liability", kind: "Detail", parent: "2000", balance:  26100, ytdActivity:  84200, active: true },
  { code: "2200", name: "VAT Payable",                  cls: "Liability", kind: "Detail", parent: "2000", balance:   8400, ytdActivity:  42100, active: true, taxCode: "VAT_OUT" },
  { code: "2210", name: "NHIL Payable",                 cls: "Liability", kind: "Detail", parent: "2000", balance:   1400, ytdActivity:   7020, active: true },
  { code: "2220", name: "GETFund Payable",              cls: "Liability", kind: "Detail", parent: "2000", balance:   1400, ytdActivity:   7020, active: true },
  { code: "2230", name: "COVID-19 Levy Payable",        cls: "Liability", kind: "Detail", parent: "2000", balance:    560, ytdActivity:   2810, active: true },
  { code: "2300", name: "PAYE Payable",                 cls: "Liability", kind: "Detail", parent: "2000", balance:   4200, ytdActivity:  18200, active: true },
  { code: "2310", name: "SSNIT Tier 1 Payable",         cls: "Liability", kind: "Detail", parent: "2000", balance:   2800, ytdActivity:  12400, active: true },
  { code: "2320", name: "SSNIT Tier 2 Payable",         cls: "Liability", kind: "Detail", parent: "2000", balance:   1100, ytdActivity:   4900, active: true },
  { code: "2400", name: "Customer Deposits",            cls: "Liability", kind: "Detail", parent: "2000", balance:   2240, ytdActivity:   8400, active: true },
  { code: "2900", name: "Long-Term Loan — Stanbic",     cls: "Liability", kind: "Detail", parent: "2000", balance:  20200, ytdActivity:   4800, active: true },

  /* ─── Equity ─── */
  { code: "3000", name: "Equity",                       cls: "Equity",    kind: "Header", balance: 124000, ytdActivity:       0, active: true },
  { code: "3100", name: "Owner's Capital",              cls: "Equity",    kind: "Detail", parent: "3000", balance:  80000, ytdActivity:       0, active: true },
  { code: "3200", name: "Retained Earnings",            cls: "Equity",    kind: "Detail", parent: "3000", balance:  28200, ytdActivity:       0, active: true },
  { code: "3300", name: "Owner's Drawings",             cls: "Equity",    kind: "Detail", parent: "3000", balance:  -4200, ytdActivity:   4200, active: true },
  { code: "3400", name: "Current Year Earnings",        cls: "Equity",    kind: "Detail", parent: "3000", balance:  20000, ytdActivity:  20000, active: true },

  /* ─── Revenue ─── */
  { code: "4000", name: "Revenue",                      cls: "Revenue",   kind: "Header", balance: 286400, ytdActivity:       0, active: true },
  { code: "4100", name: "Sales — Retail",               cls: "Revenue",   kind: "Detail", parent: "4000", balance: 184200, ytdActivity: 184200, active: true, taxCode: "VAT_OUT" },
  { code: "4110", name: "Sales — Wholesale",            cls: "Revenue",   kind: "Detail", parent: "4000", balance:  82400, ytdActivity:  82400, active: true, taxCode: "VAT_OUT" },
  { code: "4200", name: "Service Income",               cls: "Revenue",   kind: "Detail", parent: "4000", balance:  18400, ytdActivity:  18400, active: true, taxCode: "EXEMPT" },
  { code: "4900", name: "Other Income",                 cls: "Revenue",   kind: "Detail", parent: "4000", balance:   1400, ytdActivity:   1400, active: true },

  /* ─── Expense ─── */
  { code: "5000", name: "Cost & Expenses",              cls: "Expense",   kind: "Header", balance: 198400, ytdActivity:       0, active: true },
  { code: "5100", name: "Cost of Goods Sold",           cls: "Expense",   kind: "Detail", parent: "5000", balance: 124200, ytdActivity: 124200, active: true },
  { code: "5200", name: "Salaries & Wages",             cls: "Expense",   kind: "Detail", parent: "5000", balance:  32400, ytdActivity:  32400, active: true },
  { code: "5210", name: "SSNIT Employer Contribution",  cls: "Expense",   kind: "Detail", parent: "5000", balance:   3900, ytdActivity:   3900, active: true },
  { code: "5300", name: "Rent",                         cls: "Expense",   kind: "Detail", parent: "5000", balance:  12000, ytdActivity:  12000, active: true },
  { code: "5400", name: "Utilities — ECG & GWCL",       cls: "Expense",   kind: "Detail", parent: "5000", balance:   4800, ytdActivity:   4800, active: true },
  { code: "5410", name: "Internet & Telephony",         cls: "Expense",   kind: "Detail", parent: "5000", balance:   1800, ytdActivity:   1800, active: true },
  { code: "5500", name: "Fuel & Logistics",             cls: "Expense",   kind: "Detail", parent: "5000", balance:   6200, ytdActivity:   6200, active: true },
  { code: "5600", name: "Marketing & Promotions",       cls: "Expense",   kind: "Detail", parent: "5000", balance:   3800, ytdActivity:   3800, active: true },
  { code: "5700", name: "Bank Charges",                 cls: "Expense",   kind: "Detail", parent: "5000", balance:    920, ytdActivity:    920, active: true },
  { code: "5710", name: "MoMo Transaction Charges",     cls: "Expense",   kind: "Detail", parent: "5000", balance:   1180, ytdActivity:   1180, active: true },
  { code: "5800", name: "Depreciation Expense",         cls: "Expense",   kind: "Detail", parent: "5000", balance:   4200, ytdActivity:   4200, active: true },
  { code: "5900", name: "Office Supplies & Misc",       cls: "Expense",   kind: "Detail", parent: "5000", balance:   3000, ytdActivity:   3000, active: true },
]

/* ───── Journals & General Ledger ───── */
export interface MockJournalLine {
  accountCode: string
  accountName: string
  debit: number
  credit: number
  memo?: string
}

export interface MockJournal {
  id: string
  ref: string
  date: string
  source: "POS" | "PO" | "Refund" | "Manual" | "Payroll" | "Bank" | "MoMo" | "Adjustment"
  memo: string
  status: "posted" | "draft" | "void"
  postedBy?: string
  total: number
  lines: MockJournalLine[]
}

export const MOCK_JOURNALS: MockJournal[] = [
  { id: "J001", ref: "JE-2104", date: "2026-04-15", source: "POS",      status: "posted", postedBy: "Linda Sefa", memo: "POS shift close · Osu Main · 14:42", total: 169.4,
    lines: [
      { accountCode: "1110", accountName: "Cash on Hand",      debit: 169.4, credit:    0, memo: "Cash receipts" },
      { accountCode: "4100", accountName: "Sales — Retail",    debit:     0, credit:  140, memo: "Net sales" },
      { accountCode: "2200", accountName: "VAT Payable",       debit:     0, credit:   21 },
      { accountCode: "2210", accountName: "NHIL Payable",      debit:     0, credit:  3.5 },
      { accountCode: "2220", accountName: "GETFund Payable",   debit:     0, credit:  3.5 },
      { accountCode: "2230", accountName: "COVID-19 Levy",     debit:     0, credit:  1.4 },
    ]
  },
  { id: "J002", ref: "JE-2103", date: "2026-04-15", source: "MoMo",     status: "posted", postedBy: "Linda Sefa", memo: "MoMo settlement · MTN merchant", total: 229.9,
    lines: [
      { accountCode: "1140", accountName: "MoMo Wallet — MTN", debit: 229.9, credit:    0 },
      { accountCode: "4100", accountName: "Sales — Retail",    debit:     0, credit:  190 },
      { accountCode: "2200", accountName: "VAT Payable",       debit:     0, credit: 28.5 },
      { accountCode: "2210", accountName: "NHIL Payable",      debit:     0, credit: 4.75 },
      { accountCode: "2220", accountName: "GETFund Payable",   debit:     0, credit: 4.75 },
      { accountCode: "2230", accountName: "COVID-19 Levy",     debit:     0, credit:  1.9 },
    ]
  },
  { id: "J003", ref: "JE-2102", date: "2026-04-14", source: "PO",       status: "posted", postedBy: "Mr. Owusu",  memo: "Goods received · PO-2026-0141 · Ashfoam Wholesale", total: 4200,
    lines: [
      { accountCode: "1300", accountName: "Inventory",         debit:  4200, credit:    0, memo: "PO-2026-0141 received" },
      { accountCode: "2100", accountName: "Accounts Payable",  debit:     0, credit: 4200, memo: "Ashfoam Wholesale" },
    ]
  },
  { id: "J004", ref: "JE-2101", date: "2026-04-14", source: "Bank",     status: "posted", postedBy: "Mr. Owusu",  memo: "Supplier payment · Olam Ghana", total: 4200,
    lines: [
      { accountCode: "2100", accountName: "Accounts Payable",  debit:  4200, credit:    0, memo: "Settle Olam invoice" },
      { accountCode: "1120", accountName: "Bank — GCB Main",   debit:     0, credit: 4200 },
    ]
  },
  { id: "J005", ref: "JE-2100", date: "2026-04-13", source: "Refund",   status: "posted", postedBy: "Linda Sefa", memo: "Refund R001 · Akosua Mensah · Defective", total: 38,
    lines: [
      { accountCode: "4100", accountName: "Sales — Retail",    debit:    38, credit:    0 },
      { accountCode: "1110", accountName: "Cash on Hand",      debit:     0, credit:   38 },
    ]
  },
  { id: "J006", ref: "JE-2099", date: "2026-04-12", source: "Payroll",  status: "posted", postedBy: "Mr. Owusu",  memo: "March payroll · 6 staff", total: 8400,
    lines: [
      { accountCode: "5200", accountName: "Salaries & Wages",  debit:  8400, credit:    0 },
      { accountCode: "5210", accountName: "SSNIT Employer",    debit:  1071, credit:    0 },
      { accountCode: "1120", accountName: "Bank — GCB Main",   debit:     0, credit: 6720 },
      { accountCode: "2300", accountName: "PAYE Payable",      debit:     0, credit: 1260 },
      { accountCode: "2310", accountName: "SSNIT Tier 1",      debit:     0, credit:  840 },
      { accountCode: "2320", accountName: "SSNIT Tier 2",      debit:     0, credit:  651 },
    ]
  },
  { id: "J007", ref: "JE-2098", date: "2026-04-11", source: "Manual",   status: "posted", postedBy: "Mr. Owusu",  memo: "March rent payment · Osu Main", total: 4000,
    lines: [
      { accountCode: "5300", accountName: "Rent",              debit:  4000, credit:    0 },
      { accountCode: "1120", accountName: "Bank — GCB Main",   debit:     0, credit: 4000 },
    ]
  },
  { id: "J008", ref: "JE-2097", date: "2026-04-10", source: "Manual",   status: "posted", postedBy: "Mr. Owusu",  memo: "Utility bill · ECG + GWCL", total: 1640,
    lines: [
      { accountCode: "5400", accountName: "Utilities",         debit:  1640, credit:    0 },
      { accountCode: "1120", accountName: "Bank — GCB Main",   debit:     0, credit: 1640 },
    ]
  },
  { id: "J009", ref: "JE-2096", date: "2026-04-09", source: "Adjustment", status: "draft", memo: "Stock-take adjustment · Inventory shrinkage", total: 320,
    lines: [
      { accountCode: "5100", accountName: "Cost of Goods Sold", debit:   320, credit:    0 },
      { accountCode: "1300", accountName: "Inventory",         debit:     0, credit:  320 },
    ]
  },
  { id: "J010", ref: "JE-2095", date: "2026-04-08", source: "Bank",     status: "posted", postedBy: "Mr. Owusu",  memo: "Bank charges · Stanbic", total: 240,
    lines: [
      { accountCode: "5700", accountName: "Bank Charges",      debit:   240, credit:    0 },
      { accountCode: "1130", accountName: "Bank — Stanbic",    debit:     0, credit:  240 },
    ]
  },
  { id: "J011", ref: "JE-2094", date: "2026-04-07", source: "MoMo",     status: "posted", postedBy: "Mr. Owusu",  memo: "MoMo charges · Vodafone Cash", total: 84,
    lines: [
      { accountCode: "5710", accountName: "MoMo Charges",      debit:    84, credit:    0 },
      { accountCode: "1150", accountName: "MoMo — Vodafone",   debit:     0, credit:   84 },
    ]
  },
  { id: "J012", ref: "JE-2093", date: "2026-04-06", source: "Manual",   status: "void",   memo: "[VOIDED] Owner drawing", total: 1000, lines: [] },
]

/* ───── Expenses ───── */
export interface MockExpense {
  id: string
  date: string
  vendor: string
  category: "Rent" | "Utilities" | "Fuel" | "Supplies" | "Marketing" | "Repairs" | "Travel" | "Internet" | "Salary Advance" | "Misc"
  amount: number
  method: "Cash" | "Mobile Money" | "Bank Transfer" | "Petty Cash"
  account: string
  status: "approved" | "pending" | "rejected"
  hasReceipt: boolean
  notes?: string
  submittedBy: string
  approvedBy?: string
}

export const MOCK_EXPENSES: MockExpense[] = [
  { id: "EX001", date: "2026-04-15", vendor: "Total Fuel Station Osu",  category: "Fuel",         amount:   240, method: "Mobile Money", account: "5500", status: "approved", hasReceipt: true,  notes: "Delivery van weekly fill", submittedBy: "Driver Kojo", approvedBy: "Mr. Owusu" },
  { id: "EX002", date: "2026-04-15", vendor: "Sika Cleaning Services",  category: "Misc",         amount:   180, method: "Cash",         account: "5900", status: "approved", hasReceipt: true,  notes: "Monthly office cleaning",  submittedBy: "Linda Sefa",  approvedBy: "Mr. Owusu" },
  { id: "EX003", date: "2026-04-14", vendor: "Vodafone Ghana",          category: "Internet",     amount:   480, method: "Bank Transfer",account: "5410", status: "approved", hasReceipt: true,                                       submittedBy: "Mr. Owusu",   approvedBy: "Mr. Owusu" },
  { id: "EX004", date: "2026-04-14", vendor: "ECG (Electricity Co.)",   category: "Utilities",    amount:  1240, method: "Bank Transfer",account: "5400", status: "approved", hasReceipt: true,  notes: "March bill",               submittedBy: "Mr. Owusu",   approvedBy: "Mr. Owusu" },
  { id: "EX005", date: "2026-04-13", vendor: "Game Stationers",         category: "Supplies",     amount:   320, method: "Petty Cash",   account: "5900", status: "approved", hasReceipt: true,  notes: "Receipt rolls, ink",       submittedBy: "Linda Sefa",  approvedBy: "Mr. Owusu" },
  { id: "EX006", date: "2026-04-12", vendor: "Goil Filling Station",    category: "Fuel",         amount:   180, method: "Mobile Money", account: "5500", status: "approved", hasReceipt: true,                                       submittedBy: "Driver Kojo", approvedBy: "Mr. Owusu" },
  { id: "EX007", date: "2026-04-11", vendor: "Citi FM Radio Advert",    category: "Marketing",    amount:  1800, method: "Bank Transfer",account: "5600", status: "approved", hasReceipt: true,  notes: "30-second weekday spot",   submittedBy: "Mr. Owusu",   approvedBy: "Mr. Owusu" },
  { id: "EX008", date: "2026-04-10", vendor: "Auto Mechanic Tema",      category: "Repairs",      amount:   650, method: "Cash",         account: "5500", status: "pending",  hasReceipt: false, notes: "Van brake pads — receipt to come", submittedBy: "Driver Kojo" },
  { id: "EX009", date: "2026-04-10", vendor: "Vlisco Boutique",         category: "Misc",         amount:   240, method: "Mobile Money", account: "5900", status: "rejected", hasReceipt: false, notes: "Personal expense — denied", submittedBy: "Kweku Boa",   approvedBy: "Mr. Owusu" },
  { id: "EX010", date: "2026-04-09", vendor: "GWCL (Water Co.)",        category: "Utilities",    amount:   180, method: "Bank Transfer",account: "5400", status: "approved", hasReceipt: true,                                       submittedBy: "Mr. Owusu",   approvedBy: "Mr. Owusu" },
  { id: "EX011", date: "2026-04-08", vendor: "STC Bus Tema-Accra",      category: "Travel",       amount:    80, method: "Cash",         account: "5500", status: "approved", hasReceipt: false, notes: "Supplier visit",           submittedBy: "Mr. Owusu",   approvedBy: "Mr. Owusu" },
  { id: "EX012", date: "2026-04-07", vendor: "Linda Sefa (Cashier)",    category: "Salary Advance", amount: 400, method: "Cash",         account: "1110", status: "approved", hasReceipt: true,  notes: "Approved against next pay", submittedBy: "Linda Sefa",  approvedBy: "Mr. Owusu" },
]

/* ───── Branches ───── */
export interface MockBranch {
  id: string
  code: string
  name: string
  city: string
  manager: string
  phone: string
  staff: number
  registers: number
  inventoryValue: number
  todayRevenue: number
  ytdRevenue: number
  status: "active" | "renovating" | "closed"
  opened: string
}

export const MOCK_BRANCHES: MockBranch[] = [
  { id: "B001", code: "OSU",   name: "Osu Main",            city: "Accra",      manager: "Linda Sefa",  phone: "+233 24 555 1100", staff: 6, registers: 2, inventoryValue: 86200, todayRevenue: 4280, ytdRevenue: 142800, status: "active",     opened: "2023-04-12" },
  { id: "B002", code: "TEMA",  name: "Tema Community 2",    city: "Tema",       manager: "Mr. Owusu",   phone: "+233 24 555 1200", staff: 4, registers: 1, inventoryValue: 48400, todayRevenue: 2640, ytdRevenue:  82400, status: "active",     opened: "2024-01-08" },
  { id: "B003", code: "KAS",   name: "Kasoa Highway",       city: "Kasoa",      manager: "Ms. Boateng", phone: "+233 24 555 1300", staff: 3, registers: 1, inventoryValue: 32200, todayRevenue: 1840, ytdRevenue:  48200, status: "active",     opened: "2024-08-22" },
  { id: "B004", code: "KUM",   name: "Kumasi Adum",         city: "Kumasi",     manager: "Mr. Asante",  phone: "+233 24 555 1400", staff: 5, registers: 2, inventoryValue: 64800, todayRevenue: 3120, ytdRevenue: 102400, status: "active",     opened: "2024-04-30" },
  { id: "B005", code: "TAK",   name: "Takoradi Market",     city: "Takoradi",   manager: "Ms. Quaye",   phone: "+233 24 555 1500", staff: 3, registers: 1, inventoryValue: 22400, todayRevenue:    0, ytdRevenue:  18200, status: "renovating", opened: "2025-02-14" },
]

/* ───── Stock Operations ───── */
export interface MockStockTransfer {
  id: string
  date: string
  fromBranch: string
  toBranch: string
  itemCount: number
  units: number
  value: number
  status: "draft" | "in_transit" | "received" | "cancelled"
  createdBy: string
  receivedBy?: string
}

export const MOCK_TRANSFERS: MockStockTransfer[] = [
  { id: "T001", date: "2026-04-15", fromBranch: "Osu Main",       toBranch: "Tema Community 2", itemCount:  4, units:  82, value: 1840, status: "in_transit", createdBy: "Linda Sefa" },
  { id: "T002", date: "2026-04-14", fromBranch: "Osu Main",       toBranch: "Kumasi Adum",      itemCount:  6, units: 124, value: 3200, status: "received",   createdBy: "Linda Sefa", receivedBy: "Mr. Asante" },
  { id: "T003", date: "2026-04-13", fromBranch: "Kumasi Adum",    toBranch: "Kasoa Highway",    itemCount:  3, units:  48, value:  920, status: "received",   createdBy: "Mr. Asante", receivedBy: "Ms. Boateng" },
  { id: "T004", date: "2026-04-12", fromBranch: "Tema Community 2", toBranch: "Osu Main",       itemCount:  2, units:  24, value:  580, status: "received",   createdBy: "Mr. Owusu",  receivedBy: "Linda Sefa" },
  { id: "T005", date: "2026-04-11", fromBranch: "Osu Main",       toBranch: "Takoradi Market",  itemCount:  8, units: 168, value: 4200, status: "draft",      createdBy: "Linda Sefa" },
  { id: "T006", date: "2026-04-10", fromBranch: "Osu Main",       toBranch: "Kasoa Highway",    itemCount:  5, units:  96, value: 2400, status: "received",   createdBy: "Linda Sefa", receivedBy: "Ms. Boateng" },
]

export interface MockStockCount {
  id: string
  date: string
  branch: string
  scope: "Full" | "Cycle" | "Spot"
  itemsCounted: number
  variances: number
  variantValue: number
  status: "in_progress" | "completed" | "approved"
  countedBy: string
}

export const MOCK_COUNTS: MockStockCount[] = [
  { id: "SC001", date: "2026-04-14", branch: "Osu Main",         scope: "Cycle", itemsCounted: 142, variances:  4, variantValue:   180, status: "approved",    countedBy: "Linda Sefa" },
  { id: "SC002", date: "2026-04-12", branch: "Tema Community 2", scope: "Spot",  itemsCounted:  18, variances:  1, variantValue:    42, status: "approved",    countedBy: "Mr. Owusu"  },
  { id: "SC003", date: "2026-04-08", branch: "Kumasi Adum",      scope: "Full",  itemsCounted: 412, variances: 12, variantValue:   840, status: "approved",    countedBy: "Mr. Asante" },
  { id: "SC004", date: "2026-04-15", branch: "Osu Main",         scope: "Spot",  itemsCounted:  24, variances:  2, variantValue:    96, status: "in_progress", countedBy: "Linda Sefa" },
]

export interface MockStockAdjustment {
  id: string
  date: string
  branch: string
  item: string
  qtyChange: number
  reason: "Damage" | "Theft" | "Expiry" | "Found" | "Recount" | "Promo Giveaway"
  value: number
  approvedBy?: string
}

export const MOCK_ADJUSTMENTS: MockStockAdjustment[] = [
  { id: "A001", date: "2026-04-15", branch: "Osu Main",         item: "Omo Detergent 1kg",   qtyChange: -2, reason: "Damage",         value:  -84, approvedBy: "Mr. Owusu" },
  { id: "A002", date: "2026-04-14", branch: "Tema Community 2", item: "FanIce Vanilla Tub",   qtyChange: -6, reason: "Expiry",         value: -150, approvedBy: "Mr. Owusu" },
  { id: "A003", date: "2026-04-13", branch: "Kumasi Adum",      item: "Pepsodent 100g",       qtyChange: +3, reason: "Found",          value:   66 },
  { id: "A004", date: "2026-04-12", branch: "Osu Main",         item: "Geisha Soap 6-pack",   qtyChange: -4, reason: "Theft",          value:  -96, approvedBy: "Mr. Owusu" },
  { id: "A005", date: "2026-04-11", branch: "Osu Main",         item: "Lipton Tea 100ct",     qtyChange: -2, reason: "Promo Giveaway", value:  -64, approvedBy: "Mr. Owusu" },
]

/* ───── Receipts ───── */
export interface MockReceiptLine {
  name: string
  qty: number
  unit: string
  price: number
}

export interface MockReceipt {
  id: string
  code: string
  date: string
  time: string
  cashier: string
  branch: string
  customer?: string
  customerPhone?: string
  items: MockReceiptLine[]
  subtotal: number
  vat: number
  nhil: number
  getfund: number
  covid: number
  total: number
  paid: number
  change: number
  method: "Cash" | "Mobile Money" | "Card" | "Mixed"
  momoRef?: string
  status: "paid" | "voided" | "credit"
}

export const MOCK_RECEIPTS: MockReceipt[] = [
  { id: "RC001", code: "R-7831", date: "2026-04-15", time: "14:42", cashier: "Linda Sefa",  branch: "Osu Main",      customer: "Akosua Mensah", customerPhone: "+233 24 555 0101",
    items: [
      { name: "Omo Detergent 1kg",      qty: 2, unit: "pc",   price: 42 },
      { name: "Geisha Soap 6-pack",     qty: 1, unit: "pack", price: 24 },
      { name: "Lipton Tea 100ct",       qty: 1, unit: "box",  price: 32 },
    ],
    subtotal: 140, vat: 21, nhil: 3.5, getfund: 3.5, covid: 1.4, total: 169.4, paid: 170, change: 0.6, method: "Cash", status: "paid" },

  { id: "RC002", code: "R-7830", date: "2026-04-15", time: "14:18", cashier: "Linda Sefa",  branch: "Osu Main",
    items: [
      { name: "Pampers Diaper Maxi",    qty: 1, unit: "pack", price: 120 },
      { name: "Always Pads Mega",       qty: 2, unit: "pack", price: 35 },
    ],
    subtotal: 190, vat: 28.5, nhil: 4.75, getfund: 4.75, covid: 1.9, total: 229.9, paid: 229.9, change: 0, method: "Mobile Money", momoRef: "MTN-7745211", status: "paid" },

  { id: "RC003", code: "R-7829", date: "2026-04-15", time: "13:55", cashier: "Kweku Boa",   branch: "Osu Main",      customer: "Yaw Boateng",
    items: [
      { name: "Royal Aroma Rice 50kg",  qty: 1, unit: "bag",  price: 220 },
      { name: "Cooking Oil 5L",         qty: 2, unit: "jug",  price: 58 },
    ],
    subtotal: 336, vat: 50.4, nhil: 8.4, getfund: 8.4, covid: 3.36, total: 406.56, paid: 0, change: 0, method: "Cash", status: "credit" },

  { id: "RC004", code: "R-7828", date: "2026-04-15", time: "13:30", cashier: "Linda Sefa",  branch: "Osu Main",      customer: "Adwoa Pokuaa", customerPhone: "+233 50 555 0107",
    items: [
      { name: "Ashfoam Pillow Standard",qty: 2, unit: "pc",   price: 55 },
    ],
    subtotal: 110, vat: 16.5, nhil: 2.75, getfund: 2.75, covid: 1.1, total: 133.1, paid: 133.1, change: 0, method: "Card", status: "paid" },

  { id: "RC005", code: "R-7827", date: "2026-04-15", time: "12:48", cashier: "Kweku Boa",   branch: "Osu Main",
    items: [
      { name: "FanIce Vanilla Tub",     qty: 4, unit: "tub",  price: 25 },
      { name: "FanYogo Strawberry",     qty: 6, unit: "sach", price: 5 },
    ],
    subtotal: 130, vat: 19.5, nhil: 3.25, getfund: 3.25, covid: 1.3, total: 157.3, paid: 160, change: 2.7, method: "Cash", status: "paid" },

  { id: "RC006", code: "R-7826", date: "2026-04-15", time: "12:14", cashier: "Linda Sefa",  branch: "Osu Main",      customer: "Walk-in",
    items: [
      { name: "Alomo Bitters 200ml",    qty: 6, unit: "btl",  price: 18 },
    ],
    subtotal: 108, vat: 16.2, nhil: 2.7, getfund: 2.7, covid: 1.08, total: 130.68, paid: 130.68, change: 0, method: "Mobile Money", momoRef: "VOD-9921104", status: "paid" },

  { id: "RC007", code: "R-7825", date: "2026-04-15", time: "11:32", cashier: "Linda Sefa",  branch: "Osu Main",      customer: "Jessica Tetteh",
    items: [
      { name: "Pepsodent 100g",         qty: 3, unit: "tube", price: 22 },
      { name: "Always Pads Mega",       qty: 1, unit: "pack", price: 35 },
    ],
    subtotal: 101, vat: 15.15, nhil: 2.525, getfund: 2.525, covid: 1.01, total: 122.21, paid: 122.21, change: 0, method: "Card", status: "paid" },

  { id: "RC008", code: "R-7824", date: "2026-04-15", time: "10:55", cashier: "Kweku Boa",   branch: "Osu Main",
    items: [
      { name: "Engine Oil 5W-30 4L",    qty: 1, unit: "btl",  price: 62 },
    ],
    subtotal: 62, vat: 9.3, nhil: 1.55, getfund: 1.55, covid: 0.62, total: 75.02, paid: 75.02, change: 0, method: "Mobile Money", momoRef: "MTN-7745099", status: "voided" },

  { id: "RC009", code: "R-7823", date: "2026-04-15", time: "10:08", cashier: "Linda Sefa",  branch: "Osu Main",      customer: "Kwame Asante", customerPhone: "+233 20 555 0102",
    items: [
      { name: "Omo Detergent 1kg",      qty: 1, unit: "pc",   price: 42 },
      { name: "Lipton Tea 100ct",       qty: 1, unit: "box",  price: 32 },
      { name: "Geisha Soap 6-pack",     qty: 2, unit: "pack", price: 24 },
    ],
    subtotal: 122, vat: 18.3, nhil: 3.05, getfund: 3.05, covid: 1.22, total: 147.62, paid: 150, change: 2.38, method: "Cash", status: "paid" },

  { id: "RC010", code: "R-7822", date: "2026-04-15", time: "09:42", cashier: "Linda Sefa",  branch: "Osu Main",
    items: [
      { name: "Golden Tree Drink Choc", qty: 2, unit: "tin",  price: 48 },
    ],
    subtotal: 96, vat: 14.4, nhil: 2.4, getfund: 2.4, covid: 0.96, total: 116.16, paid: 116.16, change: 0, method: "Mobile Money", momoRef: "MTN-7744988", status: "paid" },
]

export const MOCK_RETURNS: MockReturn[] = [
  { id: "R001", date: "2026-04-14", receiptCode: "R-7821", customer: "Akosua Mensah", items: [{ name: "Omo Detergent 1kg", qty: 1, refund: 38 }],            reason: "Defective",            total:  38, method: "Cash",         restocked: false, status: "completed", approvedBy: "Linda Sefa" },
  { id: "R002", date: "2026-04-13", receiptCode: "R-7790", customer: "Kwame Asante",  items: [{ name: "Pampers Diaper Maxi", qty: 1, refund: 110 }],         reason: "Wrong Item",           total: 110, method: "Mobile Money", restocked: true,  status: "completed", approvedBy: "Linda Sefa" },
  { id: "R003", date: "2026-04-12", receiptCode: "R-7754", customer: "Walk-in",       items: [{ name: "FanIce Vanilla Tub", qty: 2, refund:  44 }],          reason: "Expired",              total:  44, method: "Cash",         restocked: false, status: "completed", approvedBy: "Linda Sefa" },
  { id: "R004", date: "2026-04-11", receiptCode: "R-7728", customer: "Adwoa Pokuaa",  items: [{ name: "Lipton Tea 100ct", qty: 1, refund: 28 }],             reason: "Customer Changed Mind",total:  28, method: "Store Credit", restocked: true,  status: "completed", approvedBy: "Linda Sefa" },
  { id: "R005", date: "2026-04-10", receiptCode: "R-7702", customer: "Yaw Boateng",   items: [{ name: "Engine Oil 5W-30 4L", qty: 1, refund: 62 }],          reason: "Damaged In Transit",   total:  62, method: "Mobile Money", restocked: false, status: "pending",   approvedBy: undefined },
  { id: "R006", date: "2026-04-08", receiptCode: "R-7660", customer: "Walk-in",       items: [{ name: "Geisha Soap 6-pack", qty: 1, refund: 22 }],           reason: "Defective",            total:  22, method: "Cash",         restocked: false, status: "completed", approvedBy: "Linda Sefa" },
]

/* ───── Shifts & Till ───── */
export interface MockShift {
  id: string
  code: string
  date: string
  branch: string
  register: string
  cashier: string
  openedAt: string
  closedAt?: string
  openingFloat: number
  countedCash: number
  expectedCash: number
  variance: number
  cashSales: number
  momoSales: number
  cardSales: number
  refunds: number
  voids: number
  receipts: number
  status: "open" | "closed" | "reconciled"
}

export const MOCK_SHIFTS: MockShift[] = [
  { id: "SH001", code: "S-2026-04-15-A", date: "2026-04-15", branch: "Osu Main",         register: "Till 1", cashier: "Linda Sefa", openedAt: "08:00", openingFloat: 200,
    countedCash: 0,    expectedCash: 0,    variance: 0,    cashSales: 1820, momoSales: 1480, cardSales:  640, refunds:  38, voids:  75, receipts: 32, status: "open" },
  { id: "SH002", code: "S-2026-04-14-A", date: "2026-04-14", branch: "Osu Main",         register: "Till 1", cashier: "Linda Sefa", openedAt: "08:00", closedAt: "20:12", openingFloat: 200,
    countedCash: 1990, expectedCash: 2020, variance: -30,  cashSales: 1820, momoSales: 1880, cardSales:  720, refunds: 110, voids:   0, receipts: 41, status: "reconciled" },
  { id: "SH003", code: "S-2026-04-14-B", date: "2026-04-14", branch: "Osu Main",         register: "Till 2", cashier: "Kweku Boa",  openedAt: "12:00", closedAt: "20:08", openingFloat: 150,
    countedCash: 1140, expectedCash: 1140, variance:   0,  cashSales:  990, momoSales: 1240, cardSales:  280, refunds:   0, voids:  44, receipts: 28, status: "reconciled" },
  { id: "SH004", code: "S-2026-04-13-A", date: "2026-04-13", branch: "Tema Community 2", register: "Till 1", cashier: "Mr. Owusu",  openedAt: "08:00", closedAt: "19:55", openingFloat: 200,
    countedCash: 1462, expectedCash: 1450, variance:  12,  cashSales: 1250, momoSales:  890, cardSales:  500, refunds:   0, voids:   0, receipts: 36, status: "reconciled" },
  { id: "SH005", code: "S-2026-04-13-B", date: "2026-04-13", branch: "Kumasi Adum",      register: "Till 1", cashier: "Mr. Asante", openedAt: "08:00", closedAt: "20:32", openingFloat: 250,
    countedCash: 1880, expectedCash: 1962, variance: -82,  cashSales: 1712, momoSales: 1490, cardSales:  420, refunds:  62, voids:   0, receipts: 44, status: "closed" },
  { id: "SH006", code: "S-2026-04-12-A", date: "2026-04-12", branch: "Osu Main",         register: "Till 1", cashier: "Linda Sefa", openedAt: "08:00", closedAt: "20:18", openingFloat: 200,
    countedCash: 2104, expectedCash: 2104, variance:   0,  cashSales: 1904, momoSales: 1640, cardSales:  580, refunds:  22, voids:   0, receipts: 38, status: "reconciled" },
]

/* ───── Loyalty Tiers ───── */
export interface MockLoyaltyTier {
  id: string
  name: string
  minSpend: number
  earnRate: number
  perkLine: string
  members: number
  color: string
}

export const MOCK_LOYALTY_TIERS: MockLoyaltyTier[] = [
  { id: "TBronze", name: "Bronze",   minSpend:    0, earnRate: 1, perkLine: "1 point per GHS · birthday discount",                  members: 412, color: "#A78B6F" },
  { id: "TSilver", name: "Silver",   minSpend: 1000, earnRate: 2, perkLine: "2 pts per GHS · early access to promos",               members: 168, color: "#9CA3AF" },
  { id: "TGold",   name: "Gold",     minSpend: 3000, earnRate: 3, perkLine: "3 pts per GHS · free delivery within Accra",           members:  72, color: "#F59E0B" },
  { id: "TPlat",   name: "Platinum", minSpend: 8000, earnRate: 4, perkLine: "4 pts per GHS · personal shopper, dedicated WhatsApp", members:  18, color: "#E5E7EB" },
]

/* ───── Loyalty Members (top customers) ───── */
export interface MockLoyaltyMember {
  id: string
  name: string
  phone: string
  tier: "Bronze" | "Silver" | "Gold" | "Platinum"
  points: number
  spendYTD: number
  joined: string
  lastVisit: string
}

export const MOCK_MEMBERS: MockLoyaltyMember[] = [
  { id: "M001", name: "Akosua Mensah",  phone: "+233 24 555 0101", tier: "Platinum", points: 1840, spendYTD: 9420, joined: "2024-08-12", lastVisit: "2026-04-15" },
  { id: "M002", name: "Kwame Asante",    phone: "+233 20 555 0102", tier: "Gold",     points:  920, spendYTD: 4220, joined: "2025-01-04", lastVisit: "2026-04-15" },
  { id: "M003", name: "Yaw Boateng",     phone: "+233 24 555 0104", tier: "Gold",     points:  812, spendYTD: 3680, joined: "2025-03-22", lastVisit: "2026-04-12" },
  { id: "M004", name: "Adwoa Pokuaa",    phone: "+233 50 555 0107", tier: "Silver",   points:  340, spendYTD: 1820, joined: "2025-06-10", lastVisit: "2026-04-15" },
  { id: "M005", name: "Jessica Tetteh",  phone: "+233 27 555 0108", tier: "Silver",   points:  280, spendYTD: 1240, joined: "2025-08-18", lastVisit: "2026-04-15" },
  { id: "M006", name: "Naa Ayikai",      phone: "+233 55 555 0110", tier: "Bronze",   points:  142, spendYTD:  680, joined: "2025-12-04", lastVisit: "2026-04-10" },
  { id: "M007", name: "Kojo Antwi",      phone: "+233 24 555 0111", tier: "Bronze",   points:   98, spendYTD:  420, joined: "2026-01-22", lastVisit: "2026-04-08" },
  { id: "M008", name: "Akua Dapaah",     phone: "+233 50 555 0112", tier: "Bronze",   points:   76, spendYTD:  340, joined: "2026-02-08", lastVisit: "2026-04-14" },
]

/* ───── Promotions ───── */
export type PromoType = "Percent Off" | "GHS Off" | "BOGOF" | "Bundle" | "Tier Upgrade"
export interface MockPromo {
  id: string
  code: string
  name: string
  type: PromoType
  scope: string
  startDate: string
  endDate: string
  used: number
  cap?: number
  revenue: number
  status: "scheduled" | "live" | "ended" | "paused"
}

export const MOCK_PROMOS: MockPromo[] = [
  { id: "P001", code: "EASTER25",      name: "Easter Sunday — 25% off snacks",      type: "Percent Off",  scope: "Snacks & Beverages",       startDate: "2026-04-10", endDate: "2026-04-20", used: 142, cap: 500, revenue: 4820, status: "live" },
  { id: "P002", code: "MOMOBOGOF",      name: "MoMo Buy 1 Get 1 — Geisha Soap",      type: "BOGOF",         scope: "Geisha Soap 6-pack",       startDate: "2026-04-01", endDate: "2026-04-30", used:  86, cap: 200, revenue: 2064, status: "live" },
  { id: "P003", code: "BUNDLERICE",     name: "Rice + Oil bundle 10% off",            type: "Bundle",        scope: "Royal Aroma + Cooking Oil",startDate: "2026-04-05", endDate: "2026-05-05", used:  48,           revenue: 1820, status: "live" },
  { id: "P004", code: "WELCOME10",      name: "New customer GHS 10 off",             type: "GHS Off",       scope: "Any first purchase",       startDate: "2026-01-01", endDate: "2026-12-31", used: 312,           revenue: 8640, status: "live" },
  { id: "P005", code: "MAYDAY30",       name: "May Day — 30% off detergents",         type: "Percent Off",   scope: "Detergents",                startDate: "2026-04-25", endDate: "2026-05-02", used:   0, cap: 400, revenue:    0, status: "scheduled" },
  { id: "P006", code: "INDDAY24",       name: "Independence Day promo (Mar 6)",       type: "Percent Off",   scope: "Storewide 15%",            startDate: "2026-03-04", endDate: "2026-03-08", used: 248,           revenue: 6420, status: "ended" },
  { id: "P007", code: "BIRTHDAY",       name: "Birthday tier gift — Gold & Platinum", type: "GHS Off",       scope: "Gold + Platinum members",  startDate: "2026-01-01", endDate: "2026-12-31", used:  42,           revenue:  840, status: "live" },
]

/* ───── Payroll — Employees ───── */
export interface MockEmployee {
  id: string
  staffNo: string
  name: string
  role: string
  branch: string
  ssnit: string
  tin: string
  bankAccount: string
  basic: number
  allowances: number
  status: "active" | "on_leave" | "suspended"
  joined: string
}

export const MOCK_EMPLOYEES: MockEmployee[] = [
  { id: "E001", staffNo: "TR-0001", name: "Linda Sefa",       role: "Branch Manager", branch: "Osu Main",         ssnit: "C012345678", tin: "P0001234567", bankAccount: "GCB · 1234001", basic: 3200, allowances: 600, status: "active", joined: "2024-01-08" },
  { id: "E002", staffNo: "TR-0002", name: "Kweku Boa",        role: "Senior Cashier", branch: "Osu Main",         ssnit: "C012345679", tin: "P0001234568", bankAccount: "GCB · 1234002", basic: 2200, allowances: 400, status: "active", joined: "2024-04-22" },
  { id: "E003", staffNo: "TR-0003", name: "Mr. Owusu",        role: "Branch Manager", branch: "Tema Community 2", ssnit: "C012345680", tin: "P0001234569", bankAccount: "Stanbic · 9876001", basic: 3200, allowances: 600, status: "active", joined: "2024-08-15" },
  { id: "E004", staffNo: "TR-0004", name: "Ms. Boateng",      role: "Branch Manager", branch: "Kasoa Highway",    ssnit: "C012345681", tin: "P0001234570", bankAccount: "Stanbic · 9876002", basic: 3000, allowances: 500, status: "active", joined: "2025-02-04" },
  { id: "E005", staffNo: "TR-0005", name: "Mr. Asante",       role: "Branch Manager", branch: "Kumasi Adum",      ssnit: "C012345682", tin: "P0001234571", bankAccount: "GCB · 1234003", basic: 3100, allowances: 550, status: "active", joined: "2024-11-12" },
  { id: "E006", staffNo: "TR-0006", name: "Ms. Quaye",        role: "Branch Manager", branch: "Takoradi Market",  ssnit: "C012345683", tin: "P0001234572", bankAccount: "GCB · 1234004", basic: 2800, allowances: 500, status: "on_leave", joined: "2025-04-18" },
  { id: "E007", staffNo: "TR-0007", name: "Akua Konadu",      role: "Cashier",        branch: "Osu Main",         ssnit: "C012345684", tin: "P0001234573", bankAccount: "GCB · 1234005", basic: 1800, allowances: 300, status: "active", joined: "2025-06-12" },
  { id: "E008", staffNo: "TR-0008", name: "Yaw Mensa",        role: "Stockroom Lead", branch: "Osu Main",         ssnit: "C012345685", tin: "P0001234574", bankAccount: "GCB · 1234006", basic: 2000, allowances: 350, status: "active", joined: "2024-09-01" },
  { id: "E009", staffNo: "TR-0009", name: "Esi Nyarko",       role: "Cashier",        branch: "Tema Community 2", ssnit: "C012345686", tin: "P0001234575", bankAccount: "Stanbic · 9876003", basic: 1750, allowances: 280, status: "active", joined: "2025-09-20" },
  { id: "E010", staffNo: "TR-0010", name: "Kojo Sarpong",     role: "Driver",         branch: "Osu Main",         ssnit: "C012345687", tin: "P0001234576", bankAccount: "GCB · 1234007", basic: 1600, allowances: 400, status: "active", joined: "2025-01-14" },
  { id: "E011", staffNo: "TR-0011", name: "Adjoa Tettey",     role: "Cashier",        branch: "Kumasi Adum",      ssnit: "C012345688", tin: "P0001234577", bankAccount: "GCB · 1234008", basic: 1750, allowances: 280, status: "active", joined: "2025-07-08" },
  { id: "E012", staffNo: "TR-0012", name: "Kwesi Pobee",      role: "Stockroom",      branch: "Kasoa Highway",    ssnit: "C012345689", tin: "P0001234578", bankAccount: "Stanbic · 9876004", basic: 1500, allowances: 250, status: "active", joined: "2025-11-02" },
]

/* ───── Payroll — Pay Runs ───── */
export interface MockPayRun {
  id: string
  code: string
  period: string
  status: "draft" | "approved" | "paid"
  employees: number
  gross: number
  ssnitTier1: number
  ssnitTier2: number
  paye: number
  net: number
  paidOn?: string
}

export const MOCK_PAY_RUNS: MockPayRun[] = [
  { id: "PR001", code: "PAY-2026-04", period: "April 2026",    status: "draft",    employees: 12, gross: 31100, ssnitTier1: 4042, ssnitTier2: 1555, paye: 4220, net: 21283 },
  { id: "PR002", code: "PAY-2026-03", period: "March 2026",    status: "paid",     employees: 12, gross: 31100, ssnitTier1: 4042, ssnitTier2: 1555, paye: 4220, net: 21283, paidOn: "2026-03-30" },
  { id: "PR003", code: "PAY-2026-02", period: "February 2026", status: "paid",     employees: 11, gross: 29350, ssnitTier1: 3815, ssnitTier2: 1467, paye: 3920, net: 20148, paidOn: "2026-02-28" },
  { id: "PR004", code: "PAY-2026-01", period: "January 2026",  status: "paid",     employees: 11, gross: 29350, ssnitTier1: 3815, ssnitTier2: 1467, paye: 3920, net: 20148, paidOn: "2026-01-31" },
  { id: "PR005", code: "PAY-2025-12", period: "December 2025", status: "paid",     employees: 10, gross: 26800, ssnitTier1: 3484, ssnitTier2: 1340, paye: 3520, net: 18456, paidOn: "2025-12-22" },
]

/* ───── Audit Log ───── */
export type AuditAction =
  | "login" | "logout" | "void" | "refund" | "discount" | "price_override"
  | "edit" | "delete" | "create" | "approve" | "post" | "import" | "export" | "settings"

export type AuditSeverity = "info" | "warn" | "critical"

export interface MockAuditEvent {
  id: string
  ts: string
  date: string
  actor: string
  role: string
  action: AuditAction
  module: string
  target: string
  branch: string
  severity: AuditSeverity
  detail: string
  ip?: string
}

export const MOCK_AUDIT: MockAuditEvent[] = [
  { id: "AU0050", ts: "2026-04-15 14:42:08", date: "2026-04-15", actor: "Linda Sefa", role: "Branch Manager", action: "post",          module: "POS",         target: "R-7831",          branch: "Osu Main",         severity: "info",     detail: "Receipt R-7831 posted, total GHS 169.40, cash" },
  { id: "AU0049", ts: "2026-04-15 14:18:12", date: "2026-04-15", actor: "Linda Sefa", role: "Branch Manager", action: "post",          module: "POS",         target: "R-7830",          branch: "Osu Main",         severity: "info",     detail: "Receipt R-7830 posted, total GHS 229.90, MoMo MTN-7745211" },
  { id: "AU0048", ts: "2026-04-15 13:55:34", date: "2026-04-15", actor: "Kweku Boa",  role: "Senior Cashier", action: "discount",      module: "POS",         target: "R-7829",          branch: "Osu Main",         severity: "warn",     detail: "Manual 5% discount applied — supervisor PIN entered" },
  { id: "AU0047", ts: "2026-04-15 13:30:08", date: "2026-04-15", actor: "Linda Sefa", role: "Branch Manager", action: "post",          module: "POS",         target: "R-7828",          branch: "Osu Main",         severity: "info",     detail: "Receipt R-7828 posted, total GHS 133.10, card" },
  { id: "AU0046", ts: "2026-04-15 12:48:22", date: "2026-04-15", actor: "Kweku Boa",  role: "Senior Cashier", action: "post",          module: "POS",         target: "R-7827",          branch: "Osu Main",         severity: "info",     detail: "Receipt R-7827 posted, total GHS 157.30, cash" },
  { id: "AU0045", ts: "2026-04-15 11:50:00", date: "2026-04-15", actor: "Mr. Owusu",  role: "Branch Manager", action: "approve",       module: "Adjustments", target: "A001",            branch: "Osu Main",         severity: "warn",     detail: "Adjustment A001 approved (Damage, -GHS 84)" },
  { id: "AU0044", ts: "2026-04-15 10:55:11", date: "2026-04-15", actor: "Kweku Boa",  role: "Senior Cashier", action: "void",          module: "POS",         target: "R-7824",          branch: "Osu Main",         severity: "critical", detail: "Receipt R-7824 voided after posting — supervisor PIN required" },
  { id: "AU0043", ts: "2026-04-15 09:14:00", date: "2026-04-15", actor: "Linda Sefa", role: "Branch Manager", action: "create",        module: "Transfers",   target: "T001",            branch: "Osu Main",         severity: "info",     detail: "Transfer T001 created — Osu → Tema, 4 SKUs, 82 units" },
  { id: "AU0042", ts: "2026-04-15 08:00:14", date: "2026-04-15", actor: "Linda Sefa", role: "Branch Manager", action: "login",         module: "Auth",        target: "Till 1",          branch: "Osu Main",         severity: "info",     detail: "Shift opened — opening float GHS 200", ip: "10.0.4.21" },
  { id: "AU0041", ts: "2026-04-14 20:12:48", date: "2026-04-14", actor: "Linda Sefa", role: "Branch Manager", action: "post",          module: "Shifts",      target: "S-2026-04-14-A",  branch: "Osu Main",         severity: "warn",     detail: "Shift closed with variance -GHS 30 — manager noted" },
  { id: "AU0040", ts: "2026-04-14 18:30:22", date: "2026-04-14", actor: "George Owner", role: "Owner",         action: "settings",      module: "Tax",         target: "GRA TIN",         branch: "—",                severity: "warn",     detail: "GRA TIN updated", ip: "102.176.40.21" },
  { id: "AU0039", ts: "2026-04-14 16:48:00", date: "2026-04-14", actor: "Mr. Asante", role: "Branch Manager", action: "approve",       module: "Adjustments", target: "A004",            branch: "Osu Main",         severity: "critical", detail: "Adjustment A004 approved (Theft, -GHS 96) — escalated to owner" },
  { id: "AU0038", ts: "2026-04-14 14:20:00", date: "2026-04-14", actor: "Akua Konadu",role: "Cashier",         action: "refund",        module: "Returns",     target: "R002",            branch: "Osu Main",         severity: "warn",     detail: "Refund R002 issued (Wrong Item, GHS 110) via MoMo" },
  { id: "AU0037", ts: "2026-04-13 11:15:44", date: "2026-04-13", actor: "George Owner", role: "Owner",         action: "post",          module: "Journals",    target: "JE-0011",         branch: "—",                severity: "info",     detail: "Manual journal JE-0011 posted to GL" },
  { id: "AU0036", ts: "2026-04-12 09:55:00", date: "2026-04-12", actor: "George Owner", role: "Owner",         action: "create",        module: "Employees",   target: "TR-0012",         branch: "Kasoa Highway",    severity: "info",     detail: "New employee Kwesi Pobee added" },
  { id: "AU0035", ts: "2026-04-12 08:00:00", date: "2026-04-12", actor: "Mr. Owusu",  role: "Branch Manager", action: "login",         module: "Auth",        target: "Till 1",          branch: "Tema Community 2", severity: "info",     detail: "Login from new device — verified", ip: "10.0.7.18" },
  { id: "AU0034", ts: "2026-04-11 16:42:00", date: "2026-04-11", actor: "Linda Sefa", role: "Branch Manager", action: "import",        module: "Reconciliation",target: "GCB-CSV",        branch: "—",                severity: "info",     detail: "GCB statement imported (32 transactions)" },
  { id: "AU0033", ts: "2026-04-11 14:00:00", date: "2026-04-11", actor: "George Owner", role: "Owner",         action: "settings",      module: "Roles",       target: "Cashier role",    branch: "—",                severity: "warn",     detail: "Cashier role permission changed: voids now require supervisor PIN" },
  { id: "AU0032", ts: "2026-04-10 18:15:00", date: "2026-04-10", actor: "Mr. Asante", role: "Branch Manager", action: "edit",          module: "Inventory",   target: "Pampers Diaper Maxi",branch: "Kumasi Adum",     severity: "info",     detail: "Reorder point raised from 12 to 20" },
  { id: "AU0031", ts: "2026-04-10 09:30:00", date: "2026-04-10", actor: "George Owner", role: "Owner",         action: "export",        module: "Reports",     target: "VAT Return",      branch: "—",                severity: "info",     detail: "March 2026 VAT-3 exported to PDF" },
]

/* ═══════════════════════════════════════════════════════════════
   MASTER OPS — platform-wide datasets.
   These sit above Trade + Institute. Not per-tenant.
   ═══════════════════════════════════════════════════════════════ */

export type OrgType = "trade" | "health" | "institute" | "restaurant" | "salon" | "gym" | "mechanic" | "pharmacy" | "law" | "hotel"
export type Behaviour = "consultation" | "procedure" | "product" | "admission" | "recurring" | "admin"
export type StockType = "physical" | "capacity" | "service"
export type PaymentGate = "pay_before" | "pay_after"
export type TenantStatus = "trial" | "active" | "past_due" | "suspended" | "churned"
export type TenantTier = "starter" | "growth" | "scale" | "enterprise"

export interface MockTenant {
  id: string
  code: string
  name: string
  type: OrgType
  tier: TenantTier
  status: TenantStatus
  region: string
  country: string
  branches: number
  users: number
  mrr: number
  joinedOn: string
  renewsOn: string
  lastSeen: string
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  health: number
  activeModules: string[]
  activeAddons: string[]
  activeBehaviours: Behaviour[]
  paymentGate: PaymentGate
  labelConfig: Partial<Record<Behaviour, string>>
}

export const MOCK_TENANTS: MockTenant[] = [
  { id: "TN-0001", code: "KASOA-MART",    name: "Kasoa SuperMart",            type: "trade",     tier: "scale",      status: "active",   region: "Central",    country: "Ghana",   branches: 4, users: 22, mrr: 1450, joinedOn: "2024-09-12", renewsOn: "2026-09-12", lastSeen: "2026-04-15 09:14", ownerName: "Mr. Asante",      ownerPhone: "+233 24 555 0101", ownerEmail: "mr.asante@kasoa-mart.gh",     health: 92, activeModules: ["pos","inventory","stock","branches","customers","loyalty","suppliers","po","accounting","expenses","tax","shifts","reports","audit","roles"], activeAddons: ["sms-5k","whatsapp-3k"], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_after", labelConfig: { consultation: "Customer Assist", procedure: "Warehouse Pick", product: "Goods", admission: "Product → Shelf", recurring: "Supplier Credit", admin: "Bookkeeping" } },
  { id: "TN-0002", code: "TEMA-PHARM",    name: "Tema Community Pharmacy",    type: "trade",     tier: "growth",     status: "active",   region: "Greater Accra", country: "Ghana", branches: 2, users: 9,  mrr: 680,  joinedOn: "2025-02-04", renewsOn: "2026-08-04", lastSeen: "2026-04-15 08:42", ownerName: "Mrs. Mensah",     ownerPhone: "+233 55 111 0202", ownerEmail: "pharm@tema-pharm.gh",         health: 88, activeModules: ["pos","inventory","customers","loyalty","suppliers","reports"], activeAddons: ["sms-5k"], activeBehaviours: ["consultation", "product", "admin"], paymentGate: "pay_after", labelConfig: { consultation: "Customer Assist", product: "Goods", admin: "Bookkeeping" } },
  { id: "TN-0003", code: "KUMASI-BLD",    name: "Ashanti Building Supplies",  type: "trade",     tier: "enterprise", status: "active",   region: "Ashanti",    country: "Ghana",   branches: 9, users: 58, mrr: 3200, joinedOn: "2024-03-22", renewsOn: "2027-03-22", lastSeen: "2026-04-15 09:02", ownerName: "Mr. Osei",        ownerPhone: "+233 20 333 0303", ownerEmail: "owner@ashanti-bld.gh",       health: 96, activeModules: ["pos","inventory","stock","branches","customers","loyalty","suppliers","po","accounting","expenses","tax","shifts","payroll","reports","audit","roles","labels"], activeAddons: ["sms-20k","whatsapp-10k","extra-branches-3","priority-support"], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_after", labelConfig: { consultation: "Customer Assist", procedure: "Warehouse Pick", product: "Goods", admission: "Product → Shelf", recurring: "Supplier Credit", admin: "Bookkeeping" } },
  { id: "TN-0004", code: "ACCRA-BOUTIQ",  name: "Osu Boutique Co.",           type: "trade",     tier: "growth",     status: "active",   region: "Greater Accra", country: "Ghana", branches: 2, users: 6,  mrr: 540,  joinedOn: "2025-07-14", renewsOn: "2026-07-14", lastSeen: "2026-04-14 22:18", ownerName: "Ms. Akosua",      ownerPhone: "+233 24 777 0404", ownerEmail: "akosua@osu-boutique.gh",     health: 79, activeModules: ["pos","inventory","customers","loyalty","reports"], activeAddons: [], activeBehaviours: ["consultation", "product", "admin"], paymentGate: "pay_after", labelConfig: { consultation: "Customer Assist", product: "Goods", admin: "Bookkeeping" } },
  { id: "TN-0005", code: "LEGON-ACAD",    name: "Legon Preparatory School",   type: "institute", tier: "scale",      status: "active",   region: "Greater Accra", country: "Ghana", branches: 1, users: 34, mrr: 980,  joinedOn: "2024-08-01", renewsOn: "2026-08-01", lastSeen: "2026-04-15 07:30", ownerName: "Dr. Ofori",       ownerPhone: "+233 27 888 0505", ownerEmail: "head@legon-prep.edu.gh",     health: 94, activeModules: ["enrollment","gradebook","fees","attendance","parents","reports","audit","roles"], activeAddons: ["sms-10k","parent-portal"], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_before", labelConfig: { consultation: "Admissions", procedure: "Lessons", product: "Textbooks", admission: "Enrollment", recurring: "Term Fees", admin: "Grading" } },
  { id: "TN-0006", code: "CAPE-JUNIOR",   name: "Cape Coast Junior Academy",  type: "institute", tier: "growth",     status: "active",   region: "Central",    country: "Ghana",   branches: 1, users: 18, mrr: 420,  joinedOn: "2025-09-03", renewsOn: "2026-09-03", lastSeen: "2026-04-15 06:58", ownerName: "Mr. Quarshie",    ownerPhone: "+233 26 444 0606", ownerEmail: "admin@cape-junior.edu.gh",   health: 85, activeModules: ["enrollment","gradebook","fees","attendance"], activeAddons: ["sms-5k"], activeBehaviours: ["consultation", "procedure", "admission", "recurring", "admin"], paymentGate: "pay_before", labelConfig: { consultation: "Admissions", procedure: "Lessons", admission: "Enrollment", recurring: "Term Fees", admin: "Grading" } },
  { id: "TN-0007", code: "SUNYANI-NGO",   name: "Hope Sunyani Outreach",      type: "institute", tier: "starter",    status: "trial",    region: "Bono",       country: "Ghana",   branches: 1, users: 4,  mrr: 0,    joinedOn: "2026-04-01", renewsOn: "2026-04-30", lastSeen: "2026-04-14 15:10", ownerName: "Pastor Boateng",  ownerPhone: "+233 54 999 0707", ownerEmail: "boateng@hope-sunyani.org",   health: 62, activeModules: ["enrollment","attendance"], activeAddons: [], activeBehaviours: ["consultation", "admin"], paymentGate: "pay_before", labelConfig: { consultation: "Admissions", admin: "Grading" } },
  { id: "TN-0008", code: "TAKORADI-FISH", name: "Takoradi Fish Market Co.",   type: "trade",     tier: "starter",    status: "active",   region: "Western",    country: "Ghana",   branches: 1, users: 3,  mrr: 180,  joinedOn: "2026-01-18", renewsOn: "2026-07-18", lastSeen: "2026-04-15 07:00", ownerName: "Mama Araba",      ownerPhone: "+233 50 222 0808", ownerEmail: "mama@takoradi-fish.gh",      health: 71, activeModules: ["pos","inventory","reports"], activeAddons: [], activeBehaviours: ["product", "admin"], paymentGate: "pay_after", labelConfig: { product: "Goods", admin: "Bookkeeping" } },
  { id: "TN-0009", code: "MADINA-AUTO",   name: "Madina Auto Spares",         type: "trade",     tier: "growth",     status: "past_due", region: "Greater Accra", country: "Ghana", branches: 1, users: 7,  mrr: 680,  joinedOn: "2024-11-02", renewsOn: "2026-04-02", lastSeen: "2026-04-13 18:44", ownerName: "Mr. Yeboah",      ownerPhone: "+233 20 666 0909", ownerEmail: "yeboah@madina-auto.gh",      health: 48, activeModules: ["pos","inventory","suppliers","po","reports"], activeAddons: ["sms-5k"], activeBehaviours: ["consultation", "product", "admin"], paymentGate: "pay_after", labelConfig: { consultation: "Customer Assist", product: "Goods", admin: "Bookkeeping" } },
  { id: "TN-0010", code: "ELMINA-TOUR",   name: "Elmina Heritage Tours",      type: "trade",     tier: "scale",      status: "active",   region: "Central",    country: "Ghana",   branches: 3, users: 14, mrr: 1200, joinedOn: "2024-12-10", renewsOn: "2026-12-10", lastSeen: "2026-04-15 09:25", ownerName: "Ms. Efua",        ownerPhone: "+233 27 555 1010", ownerEmail: "efua@elmina-tours.gh",       health: 91, activeModules: ["pos","inventory","customers","loyalty","accounting","reports","audit","roles"], activeAddons: ["whatsapp-10k"], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_after", labelConfig: { consultation: "Customer Assist", procedure: "Warehouse Pick", product: "Goods", admission: "Product → Shelf", recurring: "Supplier Credit", admin: "Bookkeeping" } },
  { id: "TN-0011", code: "HO-WELLNESS",   name: "Ho Wellness Pharmacy",       type: "trade",     tier: "starter",    status: "suspended",region: "Volta",      country: "Ghana",   branches: 1, users: 2,  mrr: 0,    joinedOn: "2025-03-04", renewsOn: "2026-02-04", lastSeen: "2026-02-10 12:00", ownerName: "Mr. Agbeko",      ownerPhone: "+233 24 123 1111", ownerEmail: "agbeko@ho-wellness.gh",      health: 12, activeModules: [], activeAddons: [], activeBehaviours: ["product", "admin"], paymentGate: "pay_after", labelConfig: { product: "Goods", admin: "Bookkeeping" } },
  { id: "TN-0012", code: "TAMALE-TECH",   name: "Tamale Tech Hub School",     type: "institute", tier: "enterprise", status: "active",   region: "Northern",   country: "Ghana",   branches: 2, users: 42, mrr: 2400, joinedOn: "2024-02-18", renewsOn: "2027-02-18", lastSeen: "2026-04-15 08:10", ownerName: "Dr. Seidu",       ownerPhone: "+233 20 444 1212", ownerEmail: "seidu@tamale-tech.edu.gh",   health: 97, activeModules: ["enrollment","gradebook","fees","attendance","parents","library","exams","reports","audit","roles","timetable","transport"], activeAddons: ["sms-20k","parent-portal","priority-support","extra-users-20"], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_before", labelConfig: { consultation: "Admissions", procedure: "Lessons", product: "Textbooks", admission: "Enrollment", recurring: "Term Fees", admin: "Grading" } },
  { id: "TN-0013", code: "KOFORIDUA-MKT", name: "Koforidua Central Market",   type: "trade",     tier: "growth",     status: "active",   region: "Eastern",    country: "Ghana",   branches: 3, users: 11, mrr: 720,  joinedOn: "2025-06-22", renewsOn: "2026-06-22", lastSeen: "2026-04-15 08:55", ownerName: "Mr. Boateng",     ownerPhone: "+233 26 777 1313", ownerEmail: "boateng@kofo-market.gh",     health: 83, activeModules: ["pos","inventory","stock","branches","customers","suppliers","reports"], activeAddons: ["sms-5k"], activeBehaviours: ["consultation", "product", "admission", "admin"], paymentGate: "pay_after", labelConfig: { consultation: "Customer Assist", product: "Goods", admission: "Product → Shelf", admin: "Bookkeeping" } },
  { id: "TN-0014", code: "WINNEBA-COL",   name: "Winneba Community College",  type: "institute", tier: "scale",      status: "trial",    region: "Central",    country: "Ghana",   branches: 1, users: 22, mrr: 0,    joinedOn: "2026-03-20", renewsOn: "2026-05-20", lastSeen: "2026-04-15 07:42", ownerName: "Prof. Nkrumah",   ownerPhone: "+233 55 888 1414", ownerEmail: "nkrumah@winneba-col.edu.gh", health: 76, activeModules: ["enrollment","gradebook","fees","attendance","exams"], activeAddons: [], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_before", labelConfig: { consultation: "Admissions", procedure: "Lessons", product: "Textbooks", admission: "Enrollment", recurring: "Term Fees", admin: "Grading" } },
  { id: "TN-0015", code: "DANSOMAN-CLIN", name: "Dansoman Clinical Store",    type: "trade",     tier: "growth",     status: "active",   region: "Greater Accra", country: "Ghana", branches: 1, users: 5,  mrr: 540,  joinedOn: "2025-05-11", renewsOn: "2026-05-11", lastSeen: "2026-04-15 09:30", ownerName: "Dr. Amponsah",    ownerPhone: "+233 24 999 1515", ownerEmail: "amponsah@dansoman-clin.gh",  health: 87, activeModules: ["pos","inventory","customers","suppliers","reports"], activeAddons: ["whatsapp-3k"], activeBehaviours: ["consultation", "product", "admin"], paymentGate: "pay_after", labelConfig: { consultation: "Customer Assist", product: "Goods", admin: "Bookkeeping" } },
  { id: "TN-0016", code: "BOLGA-COOP",    name: "Bolgatanga Farmers Co-op",   type: "trade",     tier: "starter",    status: "active",   region: "Upper East", country: "Ghana",   branches: 1, users: 3,  mrr: 180,  joinedOn: "2026-02-12", renewsOn: "2026-08-12", lastSeen: "2026-04-14 17:30", ownerName: "Mr. Azure",       ownerPhone: "+233 27 666 1616", ownerEmail: "azure@bolga-coop.gh",        health: 74, activeModules: ["pos","inventory","reports"], activeAddons: [], activeBehaviours: ["product", "admin"], paymentGate: "pay_after", labelConfig: { product: "Goods", admin: "Bookkeeping" } },
  { id: "TN-0017", code: "ACCRA-MALL-KS", name: "Accra Mall Kids Store",      type: "trade",     tier: "growth",     status: "active",   region: "Greater Accra", country: "Ghana", branches: 1, users: 8,  mrr: 680,  joinedOn: "2025-08-19", renewsOn: "2026-08-19", lastSeen: "2026-04-15 08:20", ownerName: "Ms. Yaa",         ownerPhone: "+233 20 111 1717", ownerEmail: "yaa@accramall-kids.gh",      health: 89, activeModules: ["pos","inventory","customers","loyalty","reports"], activeAddons: ["sms-5k","whatsapp-3k"], activeBehaviours: ["consultation", "product", "admin"], paymentGate: "pay_after", labelConfig: { consultation: "Customer Assist", product: "Goods", admin: "Bookkeeping" } },
  { id: "TN-0018", code: "AXIM-ACADEMY",  name: "Axim Seaside Academy",       type: "institute", tier: "growth",     status: "past_due", region: "Western",    country: "Ghana",   branches: 1, users: 12, mrr: 420,  joinedOn: "2025-01-07", renewsOn: "2026-03-07", lastSeen: "2026-04-12 09:10", ownerName: "Mr. Arhin",       ownerPhone: "+233 54 222 1818", ownerEmail: "arhin@axim-academy.edu.gh",  health: 51, activeModules: ["enrollment","gradebook","attendance"], activeAddons: [], activeBehaviours: ["consultation", "procedure", "admission", "admin"], paymentGate: "pay_before", labelConfig: { consultation: "Admissions", procedure: "Lessons", admission: "Enrollment", admin: "Grading" } },
  { id: "TN-0019", code: "OBUASI-FOOD",   name: "Obuasi Food Hall",           type: "trade",     tier: "scale",      status: "active",   region: "Ashanti",    country: "Ghana",   branches: 2, users: 16, mrr: 1200, joinedOn: "2024-10-30", renewsOn: "2026-10-30", lastSeen: "2026-04-15 09:00", ownerName: "Mr. Adusei",      ownerPhone: "+233 26 333 1919", ownerEmail: "adusei@obuasi-food.gh",      health: 90, activeModules: ["pos","inventory","stock","branches","customers","loyalty","suppliers","accounting","tax","shifts","reports","audit","roles"], activeAddons: ["sms-10k","extra-branches-2"], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_after", labelConfig: { consultation: "Customer Assist", procedure: "Warehouse Pick", product: "Goods", admission: "Product → Shelf", recurring: "Supplier Credit", admin: "Bookkeeping" } },
  { id: "TN-0020", code: "NAVRONGO-TECH", name: "Navrongo Technical Institute", type: "institute", tier: "scale",   status: "active",   region: "Upper East", country: "Ghana",   branches: 1, users: 28, mrr: 980,  joinedOn: "2024-05-15", renewsOn: "2026-05-15", lastSeen: "2026-04-15 08:02", ownerName: "Dr. Apaak",       ownerPhone: "+233 24 444 2020", ownerEmail: "apaak@navrongo-tech.edu.gh", health: 93, activeModules: ["enrollment","gradebook","fees","attendance","parents","exams","library","reports","roles"], activeAddons: ["parent-portal"], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_before", labelConfig: { consultation: "Admissions", procedure: "Lessons", product: "Textbooks", admission: "Enrollment", recurring: "Term Fees", admin: "Grading" } },
  { id: "TN-0021", code: "TECHIMAN-GEN",  name: "Techiman General Store",     type: "trade",     tier: "starter",    status: "churned",  region: "Bono East",  country: "Ghana",   branches: 1, users: 0,  mrr: 0,    joinedOn: "2025-04-18", renewsOn: "2026-01-18", lastSeen: "2025-12-28 14:22", ownerName: "Mr. Kofi",        ownerPhone: "+233 20 555 2121", ownerEmail: "—",                          health: 0,  activeModules: [], activeAddons: [], activeBehaviours: ["product", "admin"], paymentGate: "pay_after", labelConfig: { product: "Goods", admin: "Bookkeeping" } },
  { id: "TN-0022", code: "ABURI-GARDEN",  name: "Aburi Garden Café & Shop",   type: "trade",     tier: "growth",     status: "active",   region: "Eastern",    country: "Ghana",   branches: 1, users: 5,  mrr: 540,  joinedOn: "2025-11-08", renewsOn: "2026-11-08", lastSeen: "2026-04-15 08:48", ownerName: "Ms. Akua",        ownerPhone: "+233 55 333 2222", ownerEmail: "akua@aburi-garden.gh",       health: 86, activeModules: ["pos","inventory","customers","loyalty","reports"], activeAddons: ["whatsapp-3k"], activeBehaviours: ["consultation", "product", "admin"], paymentGate: "pay_after", labelConfig: { consultation: "Customer Assist", product: "Goods", admin: "Bookkeeping" } },
  { id: "TN-0023", code: "LABONE-PREP",   name: "Labone Montessori",          type: "institute", tier: "growth",     status: "active",   region: "Greater Accra", country: "Ghana", branches: 1, users: 14, mrr: 420,  joinedOn: "2025-10-02", renewsOn: "2026-10-02", lastSeen: "2026-04-15 06:40", ownerName: "Ms. Adjoa",       ownerPhone: "+233 24 666 2323", ownerEmail: "adjoa@labone-mont.edu.gh",   health: 88, activeModules: ["enrollment","gradebook","attendance","parents"], activeAddons: ["sms-5k"], activeBehaviours: ["consultation", "procedure", "admission", "recurring", "admin"], paymentGate: "pay_before", labelConfig: { consultation: "Admissions", procedure: "Lessons", admission: "Enrollment", recurring: "Term Fees", admin: "Grading" } },
  { id: "TN-0024", code: "WA-WHOLESALE",  name: "Wa Wholesale Depot",         type: "trade",     tier: "scale",      status: "active",   region: "Upper West", country: "Ghana",   branches: 2, users: 12, mrr: 1200, joinedOn: "2025-03-28", renewsOn: "2026-03-28", lastSeen: "2026-04-15 08:12", ownerName: "Al-Hajj Musah",   ownerPhone: "+233 27 111 2424", ownerEmail: "musah@wa-wholesale.gh",      health: 84, activeModules: ["pos","inventory","stock","branches","suppliers","po","accounting","reports","roles"], activeAddons: ["sms-10k"], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_after", labelConfig: { consultation: "Customer Assist", procedure: "Warehouse Pick", product: "Goods", admission: "Product → Shelf", recurring: "Supplier Credit", admin: "Bookkeeping" } },

  // Health tenants
  { id: "TN-0025", code: "KORLE-BU",     name: "Korle Bu Hospital",            type: "health",    tier: "scale",      status: "active",   region: "Greater Accra", country: "Ghana", branches: 3, users: 45, mrr: 4200, joinedOn: "2025-08-15", renewsOn: "2026-08-15", lastSeen: "2026-04-15 06:30", ownerName: "Dr. Kwame Asante",  ownerPhone: "+233 20 123 4567", ownerEmail: "admin@korlebu.gh",           health: 98, activeModules: ["front-desk","doctor","nurse-station","waiting-room","lab","pharmacy","billing-health","ward","injection-room"], activeAddons: ["whatsapp-10k","bookkeeping-h"], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_before", labelConfig: { consultation: "Doctor Visit", procedure: "Surgery", product: "Drugs", admission: "Ward Bed", recurring: "Ward Nightly", admin: "Patient Card" } },
  { id: "TN-0026", code: "RIDGE-HOSP",   name: "Ridge Hospital",               type: "health",    tier: "enterprise", status: "active",   region: "Greater Accra", country: "Ghana", branches: 2, users: 62, mrr: 5800, joinedOn: "2025-06-01", renewsOn: "2027-06-01", lastSeen: "2026-04-15 07:12", ownerName: "Dr. Ama Badu",     ownerPhone: "+233 24 876 5432", ownerEmail: "admin@ridge-hospital.gh",    health: 96, activeModules: ["front-desk","doctor","nurse-station","waiting-room","lab","pharmacy","billing-health","ward","icu","maternity","injection-room","radiology","ultrasound","bookkeeping-h"], activeAddons: ["whatsapp-10k","sms-20k","priority-support"], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_before", labelConfig: { consultation: "Doctor Visit", procedure: "Surgery", product: "Drugs", admission: "Ward Bed", recurring: "Ward Nightly", admin: "Patient Card" } },
  { id: "TN-0027", code: "KOMFO-ANOK",   name: "Komfo Anokye Teaching Hospital",type: "health",   tier: "scale",      status: "active",   region: "Ashanti",    country: "Ghana",   branches: 4, users: 52, mrr: 4200, joinedOn: "2025-07-20", renewsOn: "2026-07-20", lastSeen: "2026-04-15 06:45", ownerName: "Prof. Mensah",     ownerPhone: "+233 20 654 3210", ownerEmail: "admin@kath.edu.gh",          health: 94, activeModules: ["front-desk","doctor","nurse-station","waiting-room","lab","pharmacy","billing-health","ward","injection-room","radiology"], activeAddons: ["sms-20k","whatsapp-10k"], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_before", labelConfig: { consultation: "Doctor Visit", procedure: "Surgery", product: "Drugs", admission: "Ward Bed", recurring: "Ward Nightly", admin: "Patient Card" } },
  { id: "TN-0028", code: "CAPE-TEACH",   name: "Cape Coast Teaching Hospital",  type: "health",    tier: "scale",      status: "active",   region: "Central",    country: "Ghana",   branches: 2, users: 38, mrr: 3400, joinedOn: "2025-09-10", renewsOn: "2026-09-10", lastSeen: "2026-04-15 07:22", ownerName: "Dr. Kwesi Essien", ownerPhone: "+233 27 321 6543", ownerEmail: "admin@ccth.gh",              health: 91, activeModules: ["front-desk","doctor","nurse-station","waiting-room","lab","pharmacy","billing-health","ward","maternity"], activeAddons: ["sms-10k","whatsapp-3k"], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_before", labelConfig: { consultation: "Doctor Visit", procedure: "Surgery", product: "Drugs", admission: "Ward Bed", recurring: "Ward Nightly", admin: "Patient Card" } },
  { id: "TN-0029", code: "TAMALE-TEACH", name: "Tamale Teaching Hospital",      type: "health",    tier: "growth",     status: "trial",    region: "Northern",   country: "Ghana",   branches: 1, users: 18, mrr: 0,    joinedOn: "2026-04-02", renewsOn: "2026-05-02", lastSeen: "2026-04-15 08:10", ownerName: "Dr. Yakubu",       ownerPhone: "+233 26 789 1234", ownerEmail: "admin@tth.gh",               health: 72, activeModules: ["front-desk","doctor","lab","pharmacy","billing-health","waiting-room"], activeAddons: [], activeBehaviours: ["consultation", "procedure", "product", "admin"], paymentGate: "pay_before", labelConfig: { consultation: "Doctor Visit", procedure: "Surgery", product: "Drugs", admin: "Patient Card" } },
  { id: "TN-0030", code: "37-MILITARY",  name: "37 Military Hospital",          type: "health",    tier: "growth",     status: "past_due", region: "Greater Accra", country: "Ghana", branches: 1, users: 24, mrr: 1400, joinedOn: "2025-11-15", renewsOn: "2026-03-15", lastSeen: "2026-04-14 14:30", ownerName: "Col. Afrifa",      ownerPhone: "+233 20 555 3737", ownerEmail: "admin@37military.gh",        health: 58, activeModules: ["front-desk","doctor","nurse-station","lab","pharmacy","billing-health","waiting-room","injection-room"], activeAddons: ["sms-5k"], activeBehaviours: ["consultation", "procedure", "product", "admission", "admin"], paymentGate: "pay_before", labelConfig: { consultation: "Doctor Visit", procedure: "Surgery", product: "Drugs", admission: "Ward Bed", admin: "Patient Card" } },

  // Restaurant tenants
  { id: "TN-0031", code: "JOLLOF-REP",   name: "Jollof Republic",               type: "restaurant", tier: "growth",    status: "active",   region: "Greater Accra", country: "Ghana", branches: 2, users: 12, mrr: 680,  joinedOn: "2025-12-08", renewsOn: "2026-12-08", lastSeen: "2026-04-15 09:15", ownerName: "Chef Nii",         ownerPhone: "+233 50 123 3131", ownerEmail: "nii@jollof-republic.gh",     health: 87, activeModules: ["menu","tables","kds","tips","pos","inventory","reports"], activeAddons: ["whatsapp-3k"], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_after", labelConfig: { consultation: "Waiter Walks Menu", procedure: "Kitchen Prep", product: "Food & Drink", admission: "Diner \u2192 Table", recurring: "Tab / VIP", admin: "Staff Roles" } },
  { id: "TN-0032", code: "BUKA-ACC",     name: "Buka Accra",                    type: "restaurant", tier: "starter",   status: "active",   region: "Greater Accra", country: "Ghana", branches: 1, users: 6,  mrr: 180,  joinedOn: "2026-02-20", renewsOn: "2026-08-20", lastSeen: "2026-04-15 08:40", ownerName: "Mama Tina",        ownerPhone: "+233 24 888 3232", ownerEmail: "tina@buka-accra.gh",         health: 78, activeModules: ["menu","pos","inventory","reports"], activeAddons: [], activeBehaviours: ["product", "admin"], paymentGate: "pay_after", labelConfig: { product: "Food & Drink", admin: "Staff Roles" } },
  { id: "TN-0033", code: "KEMPINSKI-BA", name: "Kempinski Bar & Grill",         type: "restaurant", tier: "scale",     status: "active",   region: "Greater Accra", country: "Ghana", branches: 1, users: 18, mrr: 1200, joinedOn: "2025-10-14", renewsOn: "2026-10-14", lastSeen: "2026-04-15 09:05", ownerName: "Mr. Ofosu",        ownerPhone: "+233 20 444 3333", ownerEmail: "ofosu@kempinski-bar.gh",     health: 93, activeModules: ["menu","tables","kds","tips","pos","inventory","customers","loyalty","shifts","reports","audit","roles"], activeAddons: ["sms-5k","whatsapp-3k"], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_after", labelConfig: { consultation: "Waiter Walks Menu", procedure: "Kitchen Prep", product: "Food & Drink", admission: "Diner \u2192 Table", recurring: "Tab / VIP", admin: "Staff Roles" } },

  // Salon tenants
  { id: "TN-0034", code: "GLAM-OSU",     name: "Glam Studio Osu",               type: "salon",     tier: "growth",    status: "active",   region: "Greater Accra", country: "Ghana", branches: 1, users: 8,  mrr: 420,  joinedOn: "2026-01-10", renewsOn: "2026-07-10", lastSeen: "2026-04-15 08:50", ownerName: "Ms. Gifty",        ownerPhone: "+233 55 999 3434", ownerEmail: "gifty@glam-osu.gh",          health: 82, activeModules: ["pos","inventory","customers","loyalty","shifts","reports"], activeAddons: ["whatsapp-3k"], activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"], paymentGate: "pay_after", labelConfig: { consultation: "Style Consult", procedure: "Haircut", product: "Hair Products", admission: "Client \u2192 Chair", recurring: "Monthly Membership", admin: "Role Assignment" } },
  { id: "TN-0035", code: "KURL-KSI",     name: "Kurl Up Kumasi",                type: "salon",     tier: "starter",   status: "active",   region: "Ashanti",    country: "Ghana",   branches: 1, users: 4,  mrr: 180,  joinedOn: "2026-03-05", renewsOn: "2026-09-05", lastSeen: "2026-04-14 16:20", ownerName: "Ms. Abena",        ownerPhone: "+233 26 222 3535", ownerEmail: "abena@kurlup-ksi.gh",        health: 75, activeModules: ["pos","inventory","reports"], activeAddons: [], activeBehaviours: ["product", "admin"], paymentGate: "pay_after", labelConfig: { product: "Hair Products", admin: "Role Assignment" } },
]

/* ───── Tiers ───── */

export interface MockTier {
  id: TenantTier
  name: string
  tagline: string
  monthly: number
  annual: number
  branchLimit: number | "unlimited"
  userLimit: number | "unlimited"
  txLimit: number | "unlimited"
  supportSLA: string
  modules: string[]
  accent: "neutral" | "sky" | "emerald" | "amber"
  popular?: boolean
  behaviours: Behaviour[]
  stockTypes: StockType[]
  paymentGates: PaymentGate[]
}

export const MOCK_TIERS: MockTier[] = [
  {
    id: "starter", name: "Starter", tagline: "Single counter. Solo trader. Just enough.",
    monthly: 180, annual: 1800,
    branchLimit: 1, userLimit: 3, txLimit: 3000,
    supportSLA: "Email · 72h",
    modules: ["pos", "inventory", "reports"],
    accent: "neutral",
    behaviours: ["product", "admin"],
    stockTypes: ["physical"],
    paymentGates: ["pay_after"],
  },
  {
    id: "growth", name: "Growth", tagline: "Two counters. Loyalty. First SMS blast.",
    monthly: 420, annual: 4200,
    branchLimit: 2, userLimit: 10, txLimit: 15000,
    supportSLA: "Email · 24h",
    modules: ["pos","inventory","customers","loyalty","suppliers","reports","audit"],
    accent: "sky",
    popular: true,
    behaviours: ["consultation", "product", "admission", "admin"],
    stockTypes: ["physical", "service"],
    paymentGates: ["pay_after", "pay_before"],
  },
  {
    id: "scale", name: "Scale", tagline: "Multi-branch. Payroll. Tax ready. The ERP.",
    monthly: 980, annual: 9800,
    branchLimit: 5, userLimit: 40, txLimit: 75000,
    supportSLA: "Phone · 4h",
    modules: ["pos","inventory","stock","branches","customers","loyalty","suppliers","po","accounting","expenses","tax","shifts","payroll","reports","audit","roles","labels"],
    accent: "emerald",
    behaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"],
    stockTypes: ["physical", "capacity", "service"],
    paymentGates: ["pay_after", "pay_before"],
  },
  {
    id: "enterprise", name: "Enterprise", tagline: "Unlimited everything. Dedicated CSM.",
    monthly: 2400, annual: 24000,
    branchLimit: "unlimited", userLimit: "unlimited", txLimit: "unlimited",
    supportSLA: "24/7 · 1h · Named CSM",
    modules: ["pos","inventory","stock","branches","customers","loyalty","suppliers","po","accounting","expenses","tax","shifts","payroll","reports","audit","roles","labels"],
    accent: "amber",
    behaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"],
    stockTypes: ["physical", "capacity", "service"],
    paymentGates: ["pay_after", "pay_before"],
  },
]

/* ───── Modules (catalog across both verticals) ───── */

export interface MockModule {
  id: string
  name: string
  vertical: OrgType | "universal"
  category: string
  description: string
  icon: IconName
  minTier: TenantTier
  addonPrice?: number
  dependencies?: string[]
  adoption: number
  status: "ga" | "beta" | "preview"
  behaviour?: Behaviour
  stockType?: StockType
}

export const MOCK_MODULES: MockModule[] = [
  // Trade
  { id: "pos",         name: "Point Of Sale",      vertical: "trade",     category: "Storefront",   description: "Touch-first POS. Cash, MoMo, card. Offline fallback.",                  icon: "pos",         minTier: "starter",    behaviour: "product", stockType: "physical", adoption: 100, status: "ga" },
  { id: "inventory",   name: "Inventory",          vertical: "trade",     category: "Storefront",   description: "Products, variants, barcodes, reorder points.",                          icon: "inventory",   minTier: "starter",    behaviour: "product", stockType: "physical", adoption: 100, status: "ga" },
  { id: "stock",       name: "Stock Movements",    vertical: "trade",     category: "Operations",   description: "Transfers between branches, counts, adjustments.",                       icon: "stock",       minTier: "scale",      behaviour: "product", stockType: "physical", dependencies: ["inventory","branches"], adoption: 48, status: "ga" },
  { id: "branches",    name: "Multi-Branch",       vertical: "trade",     category: "Operations",   description: "Branches, registers, per-branch permissions.",                            icon: "branches",    minTier: "growth",     behaviour: "admin", adoption: 62, status: "ga" },
  { id: "customers",   name: "Customer Book",      vertical: "trade",     category: "CRM",          description: "Profiles, purchase history, credit ledger.",                              icon: "customers",   minTier: "growth",     behaviour: "consultation", adoption: 78, status: "ga" },
  { id: "loyalty",     name: "Loyalty & Promos",   vertical: "trade",     category: "CRM",          description: "Tiers, points, BOGOF, coupons, promotions.",                               icon: "loyalty",     minTier: "growth",     behaviour: "recurring", dependencies: ["customers"], adoption: 54, status: "ga" },
  { id: "suppliers",   name: "Suppliers",          vertical: "trade",     category: "Procurement",  description: "Supplier directory, lead times, payables.",                               icon: "suppliers",   minTier: "growth",     behaviour: "admin", adoption: 68, status: "ga" },
  { id: "po",          name: "Purchase Orders",    vertical: "trade",     category: "Procurement",  description: "PO creation, receipt, 3-way match.",                                       icon: "po",          minTier: "scale",      behaviour: "admin", dependencies: ["suppliers","inventory"], adoption: 42, status: "ga" },
  { id: "accounting",  name: "Accounting",         vertical: "universal", category: "Finance",      description: "Chart of accounts, journals, general ledger.",                             icon: "coa",         minTier: "scale",      behaviour: "admin", adoption: 38, status: "ga" },
  { id: "expenses",    name: "Expenses",           vertical: "universal", category: "Finance",      description: "Expense capture, categorisation, approval flow.",                          icon: "expenses",    minTier: "growth",     behaviour: "admin", adoption: 58, status: "ga" },
  { id: "tax",         name: "Tax Engine",         vertical: "universal", category: "Finance",      description: "Ghana VAT, NHIL, GETFund, COVID Levy. GRA-ready.",                        icon: "tax",         minTier: "scale",      behaviour: "admin", dependencies: ["accounting"], adoption: 34, status: "ga" },
  { id: "shifts",      name: "Shifts & Z-Report",  vertical: "trade",     category: "Operations",   description: "Open/close tills, cash reconciliation, Z-reports.",                        icon: "shifts",      minTier: "scale",      behaviour: "admin", dependencies: ["pos"], adoption: 40, status: "ga" },
  { id: "payroll",     name: "Payroll",            vertical: "universal", category: "HR",           description: "SSNIT Tier 1 & 2, PAYE bands, payslips.",                                 icon: "payroll",     minTier: "scale",      behaviour: "admin", addonPrice: 120, adoption: 28, status: "ga" },
  { id: "reports",     name: "Reports Library",    vertical: "universal", category: "Insights",     description: "33+ reports: sales, tax, inventory, payroll, audit.",                     icon: "reports",     minTier: "starter",    adoption: 100, status: "ga" },
  { id: "audit",       name: "Audit Log",          vertical: "universal", category: "Governance",   description: "Immutable event stream. Who did what, when.",                              icon: "audit",       minTier: "growth",     behaviour: "admin", adoption: 72, status: "ga" },
  { id: "roles",       name: "Roles & Permissions",vertical: "universal", category: "Governance",   description: "Role matrix across modules, branch scoping.",                              icon: "roles",       minTier: "scale",      behaviour: "admin", adoption: 46, status: "ga" },
  { id: "labels",      name: "Barcode Labels",     vertical: "trade",     category: "Operations",   description: "Shelf labels, price tags, thermal + A4 sheet.",                            icon: "labels",      minTier: "growth",     behaviour: "product", stockType: "physical", dependencies: ["inventory"], adoption: 32, status: "ga" },

  // Institute
  { id: "enrollment",  name: "Enrollment",         vertical: "institute", category: "Admissions",   description: "Student intake, application workflow, waitlist.",                          icon: "customers",   minTier: "starter",    behaviour: "admission", stockType: "capacity", adoption: 100, status: "ga" },
  { id: "gradebook",   name: "Gradebook",          vertical: "institute", category: "Academic",     description: "Scores, GPA, WAEC-style transcript.",                                      icon: "reports",     minTier: "growth",     behaviour: "admin", adoption: 88, status: "ga" },
  { id: "fees",        name: "Fees & Billing",     vertical: "institute", category: "Finance",      description: "Term fees, instalments, MoMo collection.",                                icon: "billing",     minTier: "growth",     behaviour: "recurring", adoption: 78, status: "ga" },
  { id: "attendance",  name: "Attendance",         vertical: "institute", category: "Academic",     description: "Daily roll call, absence SMS to parents.",                                 icon: "check",       minTier: "starter",    behaviour: "admin", adoption: 92, status: "ga" },
  { id: "parents",     name: "Parent Portal",      vertical: "institute", category: "Communication",description: "Parent login, fee balance, report cards.",                                icon: "customers",   minTier: "growth",     behaviour: "admin", addonPrice: 80, dependencies: ["gradebook"], adoption: 44, status: "ga" },
  { id: "library",     name: "Library",            vertical: "institute", category: "Operations",   description: "Book catalog, check-out, fines.",                                          icon: "modules",     minTier: "scale",      behaviour: "product", stockType: "physical", adoption: 22, status: "beta" },
  { id: "exams",       name: "Exams",              vertical: "institute", category: "Academic",     description: "Timetable, seat plan, mark entry, reports.",                               icon: "calendar",    minTier: "growth",     behaviour: "procedure", adoption: 58, status: "ga" },
  { id: "timetable",   name: "Timetable",          vertical: "institute", category: "Academic",     description: "Class schedule, teacher workload, clash detection.",                       icon: "calendar",    minTier: "scale",      behaviour: "admin", adoption: 32, status: "beta" },
  { id: "transport",   name: "Transport",          vertical: "institute", category: "Operations",   description: "Bus routes, stops, driver assignment.",                                    icon: "branches",    minTier: "enterprise", behaviour: "admin", adoption: 14, status: "preview" },

  // Health
  { id: "front-desk",     name: "Front Desk",       vertical: "health", category: "Clinical",    description: "Patient registration, queue, emergency admission.",          icon: "customers",  minTier: "starter",    behaviour: "consultation", adoption: 100, status: "ga" },
  { id: "doctor",         name: "Doctor Station",    vertical: "health", category: "Clinical",    description: "SOAP notes, diagnosis, prescriptions, referrals.",           icon: "user",       minTier: "starter",    behaviour: "consultation", adoption: 100, status: "ga" },
  { id: "pharmacy",       name: "Pharmacy",          vertical: "health", category: "Diagnostics", description: "Prescription queue, dispensing, stock tracking.",             icon: "inventory",  minTier: "starter",    behaviour: "product", stockType: "physical", adoption: 96, status: "ga" },
  { id: "lab",            name: "Laboratory",        vertical: "health", category: "Diagnostics", description: "Test orders, result entry, abnormal flagging.",              icon: "analytics",  minTier: "starter",    behaviour: "procedure", stockType: "service", adoption: 92, status: "ga" },
  { id: "billing-health", name: "Billing",           vertical: "health", category: "Finance",     description: "Revenue dashboard, patient billing, NHIS claims.",           icon: "billing",    minTier: "starter",    behaviour: "admin", adoption: 100, status: "ga" },
  { id: "nurse-station",  name: "Nurse Station",     vertical: "health", category: "Clinical",    description: "Vitals recording, task management, abnormal flagging.",      icon: "support",    minTier: "growth",     behaviour: "procedure", stockType: "service", adoption: 84, status: "ga" },
  { id: "waiting-room",   name: "Waiting Room",      vertical: "health", category: "Clinical",    description: "Real-time queue display, emergency alerts.",                 icon: "orders",     minTier: "starter",    behaviour: "admin", adoption: 88, status: "ga" },
  { id: "injection-room", name: "Injection Room",    vertical: "health", category: "Clinical",    description: "Injection orders, administration, completion.",              icon: "bolt",       minTier: "growth",     behaviour: "procedure", stockType: "service", adoption: 72, status: "ga" },
  { id: "ward",           name: "Ward / IPD",        vertical: "health", category: "Inpatient",   description: "Admissions, daily rounds, discharge summaries.",             icon: "tenants",    minTier: "scale",      behaviour: "admission", stockType: "capacity", adoption: 58, status: "ga" },
  { id: "icu",            name: "ICU",               vertical: "health", category: "Inpatient",   description: "7-column vitals grid, ventilator, hourly observation.",      icon: "bolt",       minTier: "scale",      behaviour: "admission", stockType: "capacity", adoption: 34, status: "ga" },
  { id: "maternity",      name: "Maternity",         vertical: "health", category: "Inpatient",   description: "Antenatal, labour, delivery, postnatal care.",               icon: "support",    minTier: "scale",      behaviour: "admission", stockType: "capacity", adoption: 42, status: "ga" },
  { id: "blood-bank",     name: "Blood Bank",        vertical: "health", category: "Inpatient",   description: "8-group inventory, cross-match, transfusion.",              icon: "database",   minTier: "enterprise", behaviour: "product", stockType: "physical", adoption: 18, status: "beta" },
  { id: "radiology",      name: "CT / Radiology",    vertical: "health", category: "Diagnostics", description: "Scan queue, report writing, imaging orders.",                icon: "layers",     minTier: "scale",      behaviour: "procedure", stockType: "service", adoption: 38, status: "ga" },
  { id: "ultrasound",     name: "Ultrasound",        vertical: "health", category: "Diagnostics", description: "Sonography queue, findings and reports.",                    icon: "layers",     minTier: "scale",      behaviour: "procedure", stockType: "service", adoption: 36, status: "ga" },
  { id: "bookkeeping-h",  name: "Bookkeeping",       vertical: "health", category: "Finance",     description: "Patient records, financials, assessments.",                  icon: "coa",        minTier: "scale",      behaviour: "admin", addonPrice: 200, adoption: 28, status: "ga" },

  // Restaurant
  { id: "menu",           name: "Menu & Recipes",    vertical: "restaurant", category: "Kitchen",  description: "Menu builder, recipes, modifiers, 86 list.",               icon: "orders",     minTier: "starter",    behaviour: "product", adoption: 100, status: "ga" },
  { id: "tables",         name: "Tables & Floor Plan",vertical: "restaurant", category: "Front",   description: "Table map, covers, reservations.",                          icon: "dashboard",  minTier: "starter",    behaviour: "admission", stockType: "capacity", adoption: 94, status: "ga" },
  { id: "kds",            name: "Kitchen Display",   vertical: "restaurant", category: "Kitchen",  description: "Order routing, course pacing, prep timers.",                icon: "orders",     minTier: "growth",     behaviour: "procedure", adoption: 68, status: "ga" },
  { id: "tips",           name: "Service & Tips",    vertical: "restaurant", category: "Front",    description: "Tip pooling, service charge, staff performance.",           icon: "trending",   minTier: "growth",     behaviour: "admin", adoption: 52, status: "ga" },
]

/* ───── Add-ons ───── */

export interface MockAddon {
  id: string
  name: string
  description: string
  price: number
  unit: "monthly" | "one-off"
  category: "messaging" | "capacity" | "support" | "integration"
  icon: IconName
  activeCount: number
}

export const MOCK_ADDONS: MockAddon[] = [
  { id: "sms-5k",           name: "SMS Pack · 5,000",     description: "5,000 SMS credits, expires in 12 months. Valid across Ghana.",      price: 80,  unit: "one-off",  category: "messaging",   icon: "phone",     activeCount: 11 },
  { id: "sms-10k",          name: "SMS Pack · 10,000",    description: "10,000 SMS credits, expires in 12 months.",                         price: 150, unit: "one-off",  category: "messaging",   icon: "phone",     activeCount: 4 },
  { id: "sms-20k",          name: "SMS Pack · 20,000",    description: "20,000 SMS credits, best-value bulk. Ideal for schools.",            price: 280, unit: "one-off",  category: "messaging",   icon: "phone",     activeCount: 2 },
  { id: "whatsapp-3k",      name: "WhatsApp · 3,000",     description: "3,000 WhatsApp template messages/mo via Meta Cloud API.",            price: 120, unit: "monthly",  category: "messaging",   icon: "whatsapp",  activeCount: 3 },
  { id: "whatsapp-10k",     name: "WhatsApp · 10,000",    description: "10,000 template messages/mo. Includes priority delivery.",           price: 320, unit: "monthly",  category: "messaging",   icon: "whatsapp",  activeCount: 2 },
  { id: "extra-branches-2", name: "Extra Branches · 2",   description: "Add 2 branches beyond your tier limit.",                              price: 240, unit: "monthly",  category: "capacity",    icon: "branches",  activeCount: 1 },
  { id: "extra-branches-3", name: "Extra Branches · 3",   description: "Add 3 branches beyond your tier limit.",                              price: 340, unit: "monthly",  category: "capacity",    icon: "branches",  activeCount: 1 },
  { id: "extra-users-20",   name: "Extra Users · 20",     description: "Add 20 operator seats beyond your tier limit.",                       price: 180, unit: "monthly",  category: "capacity",    icon: "staff",     activeCount: 1 },
  { id: "priority-support", name: "Priority Support",     description: "4h first-response SLA, phone line, named specialist.",                price: 400, unit: "monthly",  category: "support",     icon: "support",   activeCount: 2 },
  { id: "parent-portal",    name: "Parent Portal",        description: "Self-service parent login for grades, fees, attendance.",             price: 80,  unit: "monthly",  category: "integration", icon: "customers", activeCount: 2 },
  { id: "momo-direct",      name: "MoMo Direct Settle",   description: "Same-day settle from MoMo to linked bank account.",                    price: 60,  unit: "monthly",  category: "integration", icon: "phone",     activeCount: 0 },
  { id: "gra-efiling",      name: "GRA E-Filing",         description: "One-tap VAT-3 and NHIL file upload to GRA portal.",                    price: 90,  unit: "monthly",  category: "integration", icon: "tax",       activeCount: 0 },
]

/* ───── Invoices / Billing ───── */

export interface MockInvoice {
  id: string
  tenantId: string
  tenantName: string
  period: string
  issuedOn: string
  dueOn: string
  amount: number
  status: "draft" | "sent" | "paid" | "overdue" | "void"
  method?: "momo" | "bank" | "card"
  reference?: string
}

export const MOCK_INVOICES: MockInvoice[] = [
  { id: "INV-2604-0001", tenantId: "TN-0003", tenantName: "Ashanti Building Supplies",   period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 3200, status: "paid",    method: "bank", reference: "GCB-TRX-4422" },
  { id: "INV-2604-0002", tenantId: "TN-0001", tenantName: "Kasoa SuperMart",             period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 1450, status: "paid",    method: "momo", reference: "MTN-98237644" },
  { id: "INV-2604-0003", tenantId: "TN-0010", tenantName: "Elmina Heritage Tours",       period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 1200, status: "paid",    method: "momo", reference: "MTN-98237810" },
  { id: "INV-2604-0004", tenantId: "TN-0012", tenantName: "Tamale Tech Hub School",      period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 2400, status: "paid",    method: "bank", reference: "CAL-5598" },
  { id: "INV-2604-0005", tenantId: "TN-0019", tenantName: "Obuasi Food Hall",            period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 1200, status: "paid",    method: "momo", reference: "MTN-98238101" },
  { id: "INV-2604-0006", tenantId: "TN-0020", tenantName: "Navrongo Technical Institute",period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 980,  status: "paid",    method: "bank", reference: "GCB-TRX-4510" },
  { id: "INV-2604-0007", tenantId: "TN-0005", tenantName: "Legon Preparatory School",    period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 980,  status: "paid",    method: "bank", reference: "ZEN-7791" },
  { id: "INV-2604-0008", tenantId: "TN-0002", tenantName: "Tema Community Pharmacy",     period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 680,  status: "sent" },
  { id: "INV-2604-0009", tenantId: "TN-0004", tenantName: "Osu Boutique Co.",            period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 540,  status: "sent" },
  { id: "INV-2604-0010", tenantId: "TN-0009", tenantName: "Madina Auto Spares",          period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 680,  status: "overdue" },
  { id: "INV-2604-0011", tenantId: "TN-0018", tenantName: "Axim Seaside Academy",        period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 420,  status: "overdue" },
  { id: "INV-2604-0012", tenantId: "TN-0015", tenantName: "Dansoman Clinical Store",     period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 540,  status: "paid",    method: "momo", reference: "MTN-98239440" },
  { id: "INV-2604-0013", tenantId: "TN-0013", tenantName: "Koforidua Central Market",    period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 720,  status: "paid",    method: "momo", reference: "MTN-98239501" },
  { id: "INV-2604-0014", tenantId: "TN-0006", tenantName: "Cape Coast Junior Academy",   period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 420,  status: "paid",    method: "bank", reference: "CAL-5612" },
  { id: "INV-2604-0015", tenantId: "TN-0022", tenantName: "Aburi Garden Café & Shop",    period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 540,  status: "paid",    method: "momo", reference: "MTN-98240110" },
  { id: "INV-2604-0016", tenantId: "TN-0023", tenantName: "Labone Montessori",           period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 420,  status: "paid",    method: "momo", reference: "MTN-98240223" },
  { id: "INV-2604-0017", tenantId: "TN-0024", tenantName: "Wa Wholesale Depot",          period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 1200, status: "paid",    method: "bank", reference: "GCB-TRX-4588" },
  { id: "INV-2604-0018", tenantId: "TN-0017", tenantName: "Accra Mall Kids Store",       period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 680,  status: "sent" },
  { id: "INV-2604-0019", tenantId: "TN-0008", tenantName: "Takoradi Fish Market Co.",    period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 180,  status: "paid",    method: "momo", reference: "MTN-98240401" },
  { id: "INV-2604-0020", tenantId: "TN-0016", tenantName: "Bolgatanga Farmers Co-op",    period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 180,  status: "sent" },
  { id: "INV-2604-0021", tenantId: "TN-0025", tenantName: "Korle Bu Hospital",           period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 4200, status: "paid",    method: "bank", reference: "GCB-TRX-4601" },
  { id: "INV-2604-0022", tenantId: "TN-0026", tenantName: "Ridge Hospital",              period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 5800, status: "paid",    method: "bank", reference: "GCB-TRX-4602" },
  { id: "INV-2604-0023", tenantId: "TN-0027", tenantName: "Komfo Anokye Teaching Hospital",period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 4200, status: "paid",  method: "bank", reference: "GCB-TRX-4603" },
  { id: "INV-2604-0024", tenantId: "TN-0028", tenantName: "Cape Coast Teaching Hospital", period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 3400, status: "paid",   method: "bank", reference: "CAL-5620" },
  { id: "INV-2604-0025", tenantId: "TN-0030", tenantName: "37 Military Hospital",         period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 1400, status: "overdue" },
  { id: "INV-2604-0026", tenantId: "TN-0031", tenantName: "Jollof Republic",              period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 680,  status: "paid",    method: "momo", reference: "MTN-98241001" },
  { id: "INV-2604-0027", tenantId: "TN-0032", tenantName: "Buka Accra",                   period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 180,  status: "paid",    method: "momo", reference: "MTN-98241002" },
  { id: "INV-2604-0028", tenantId: "TN-0033", tenantName: "Kempinski Bar & Grill",        period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 1200, status: "paid",    method: "card", reference: "HUB-8890" },
  { id: "INV-2604-0029", tenantId: "TN-0034", tenantName: "Glam Studio Osu",              period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 420,  status: "paid",    method: "momo", reference: "MTN-98241003" },
  { id: "INV-2604-0030", tenantId: "TN-0035", tenantName: "Kurl Up Kumasi",               period: "Apr 2026", issuedOn: "2026-04-01", dueOn: "2026-04-15", amount: 180,  status: "sent" },
]

/* ───── Partners / Resellers ───── */

export interface MockPartner {
  id: string
  code: string
  name: string
  tier: "silver" | "gold" | "platinum"
  region: string
  contact: string
  phone: string
  email: string
  tenantsReferred: number
  commissionYTD: number
  commissionRate: number
  status: "active" | "paused" | "pending"
  joinedOn: string
}

export const MOCK_PARTNERS: MockPartner[] = [
  { id: "PT-01", code: "ACC-NORTH",  name: "Accra North Solutions",  tier: "gold",     region: "Greater Accra", contact: "Kofi Bediako",    phone: "+233 24 900 1001", email: "kofi@accranorth.gh",  tenantsReferred: 8,  commissionYTD: 3840, commissionRate: 15, status: "active",  joinedOn: "2024-06-14" },
  { id: "PT-02", code: "KUMASI-IT",  name: "Kumasi IT Co-lab",       tier: "platinum", region: "Ashanti",       contact: "Akua Frimpong",   phone: "+233 20 900 1002", email: "akua@kumasi-it.gh",   tenantsReferred: 14, commissionYTD: 8120, commissionRate: 20, status: "active",  joinedOn: "2024-02-28" },
  { id: "PT-03", code: "TAMALE-DIG", name: "Tamale Digital Partners",tier: "silver",   region: "Northern",      contact: "Issah Abdulai",   phone: "+233 27 900 1003", email: "issah@tamale-dig.gh", tenantsReferred: 4,  commissionYTD: 1200, commissionRate: 10, status: "active",  joinedOn: "2025-04-09" },
  { id: "PT-04", code: "CAPE-TECH",  name: "Cape Coast Tech Hub",    tier: "silver",   region: "Central",       contact: "Esi Mensah",      phone: "+233 55 900 1004", email: "esi@cape-tech.gh",    tenantsReferred: 3,  commissionYTD: 720,  commissionRate: 10, status: "active",  joinedOn: "2025-08-22" },
  { id: "PT-05", code: "HO-CONSULT", name: "Ho Business Consultants",tier: "silver",   region: "Volta",         contact: "Mawuli Kpodo",    phone: "+233 50 900 1005", email: "mawuli@ho-biz.gh",    tenantsReferred: 2,  commissionYTD: 480,  commissionRate: 10, status: "paused",  joinedOn: "2025-11-15" },
  { id: "PT-06", code: "WA-DIG",     name: "Wa Digital Services",    tier: "silver",   region: "Upper West",    contact: "Al-Hassan Bawa",  phone: "+233 54 900 1006", email: "hassan@wa-digital.gh",tenantsReferred: 1,  commissionYTD: 180,  commissionRate: 10, status: "pending", joinedOn: "2026-03-02" },
  { id: "PT-07", code: "TEMA-NET",   name: "Tema Harbour Networks",  tier: "gold",     region: "Greater Accra", contact: "Daniel Akoto",    phone: "+233 26 900 1007", email: "daniel@tema-net.gh",  tenantsReferred: 6,  commissionYTD: 2890, commissionRate: 15, status: "active",  joinedOn: "2024-11-30" },
  { id: "PT-08", code: "SUNY-CONN",  name: "Sunyani Connect",        tier: "silver",   region: "Bono",          contact: "Theresa Gyasi",   phone: "+233 24 900 1008", email: "theresa@sunyani.gh",  tenantsReferred: 2,  commissionYTD: 420,  commissionRate: 10, status: "active",  joinedOn: "2025-09-17" },
]

/* ───── Support tickets ───── */

export type TicketStatus = "open" | "pending" | "resolved" | "closed"
export type TicketPriority = "low" | "normal" | "high" | "urgent"

export interface MockTicket {
  id: string
  tenantId: string
  tenantName: string
  subject: string
  category: string
  priority: TicketPriority
  status: TicketStatus
  assignee: string
  openedOn: string
  lastMessage: string
  messages: number
  slaMins: number
}

export const MOCK_TICKETS: MockTicket[] = [
  { id: "TK-1084", tenantId: "TN-0009", tenantName: "Madina Auto Spares",       subject: "MoMo payment not reflecting on invoice",        category: "Billing",    priority: "urgent",  status: "open",     assignee: "Linda",   openedOn: "2026-04-15 08:22", lastMessage: "Screenshot attached showing MTN confirmation", messages: 3, slaMins: 45 },
  { id: "TK-1083", tenantId: "TN-0012", tenantName: "Tamale Tech Hub School",   subject: "Parent portal login failing after password reset",category: "Technical",  priority: "high",    status: "pending",  assignee: "Samuel",  openedOn: "2026-04-15 07:44", lastMessage: "Asked user to clear cache", messages: 4, slaMins: 120 },
  { id: "TK-1082", tenantId: "TN-0003", tenantName: "Ashanti Building Supplies",subject: "Need help onboarding Kumasi North branch",       category: "Onboarding", priority: "normal",  status: "open",     assignee: "Abena",   openedOn: "2026-04-15 06:10", lastMessage: "Scheduled session for Thursday", messages: 2, slaMins: 240 },
  { id: "TK-1081", tenantId: "TN-0018", tenantName: "Axim Seaside Academy",     subject: "Dunning emails ignored — need call",             category: "Billing",    priority: "high",    status: "open",     assignee: "Linda",   openedOn: "2026-04-14 16:30", lastMessage: "Owner requested call tomorrow", messages: 5, slaMins: 60 },
  { id: "TK-1080", tenantId: "TN-0005", tenantName: "Legon Preparatory School", subject: "Bulk SMS template rejection",                    category: "Messaging",  priority: "normal",  status: "pending",  assignee: "Samuel",  openedOn: "2026-04-14 11:18", lastMessage: "Submitted updated template to Meta", messages: 6, slaMins: 240 },
  { id: "TK-1079", tenantId: "TN-0001", tenantName: "Kasoa SuperMart",          subject: "Z-report cash variance GHS 12 across 3 tills",   category: "Technical",  priority: "normal",  status: "resolved", assignee: "Kwame",   openedOn: "2026-04-14 09:00", lastMessage: "Cause: float miscounted at open — training sent", messages: 8, slaMins: 0 },
  { id: "TK-1078", tenantId: "TN-0002", tenantName: "Tema Community Pharmacy",  subject: "Request NHIS-ready prescription field",          category: "Feature",    priority: "low",     status: "pending",  assignee: "Abena",   openedOn: "2026-04-13 14:22", lastMessage: "Added to Q3 roadmap", messages: 3, slaMins: 600 },
  { id: "TK-1077", tenantId: "TN-0020", tenantName: "Navrongo Technical Institute",subject:"Printer not connecting to receipt printer",    category: "Hardware",   priority: "normal",  status: "resolved", assignee: "Kwame",   openedOn: "2026-04-13 10:45", lastMessage: "Driver update resolved it", messages: 12, slaMins: 0 },
  { id: "TK-1076", tenantId: "TN-0007", tenantName: "Hope Sunyani Outreach",    subject: "How do I add volunteers as users?",              category: "Onboarding", priority: "low",     status: "closed",   assignee: "Abena",   openedOn: "2026-04-12 13:10", lastMessage: "Guide sent", messages: 2, slaMins: 0 },
  { id: "TK-1075", tenantId: "TN-0024", tenantName: "Wa Wholesale Depot",       subject: "Wholesale pricing tier missing",                category: "Feature",    priority: "normal",  status: "open",     assignee: "Samuel",  openedOn: "2026-04-12 09:00", lastMessage: "Gathering requirements", messages: 4, slaMins: 360 },
  { id: "TK-1074", tenantId: "TN-0011", tenantName: "Ho Wellness Pharmacy",     subject: "Suspension appeal — payment cleared",           category: "Billing",    priority: "urgent",  status: "open",     assignee: "Linda",   openedOn: "2026-04-12 08:30", lastMessage: "Awaiting Ops review", messages: 2, slaMins: 30 },
  { id: "TK-1073", tenantId: "TN-0019", tenantName: "Obuasi Food Hall",         subject: "Loyalty points not expiring correctly",          category: "Technical",  priority: "normal",  status: "pending",  assignee: "Kwame",   openedOn: "2026-04-11 15:00", lastMessage: "Reproduced, working on patch", messages: 7, slaMins: 180 },
]

/* ───── Platform staff (DalxicOps internal) ───── */

export type StaffRole = "founder" | "account_manager" | "support_l1" | "support_l2" | "billing" | "analyst" | "engineer"

export interface MockStaff {
  id: string
  name: string
  email: string
  role: StaffRole
  region: string
  tenantsAssigned: number
  openTickets: number
  lastActive: string
  status: "online" | "away" | "offline"
  joinedOn: string
}

export const MOCK_STAFF: MockStaff[] = [
  { id: "ST-01", name: "George Gaisie",    email: "george@dalxic.com",   role: "founder",         region: "All",           tenantsAssigned: 0,  openTickets: 0, lastActive: "Now",           status: "online",  joinedOn: "2024-01-01" },
  { id: "ST-02", name: "Abena Nyarko",     email: "abena@dalxic.com",    role: "account_manager", region: "Greater Accra", tenantsAssigned: 8,  openTickets: 2, lastActive: "2 mins ago",     status: "online",  joinedOn: "2024-03-14" },
  { id: "ST-03", name: "Kwame Appiah",     email: "kwame@dalxic.com",    role: "support_l2",      region: "Ashanti",       tenantsAssigned: 6,  openTickets: 3, lastActive: "Just now",       status: "online",  joinedOn: "2024-05-20" },
  { id: "ST-04", name: "Linda Sefa",       email: "linda@dalxic.com",    role: "billing",         region: "All",           tenantsAssigned: 0,  openTickets: 4, lastActive: "5 mins ago",     status: "online",  joinedOn: "2024-07-08" },
  { id: "ST-05", name: "Samuel Osei",      email: "samuel@dalxic.com",   role: "support_l1",      region: "Northern",      tenantsAssigned: 5,  openTickets: 3, lastActive: "1 hour ago",     status: "away",    joinedOn: "2025-01-12" },
  { id: "ST-06", name: "Akosua Ampomah",   email: "akosua@dalxic.com",   role: "analyst",         region: "All",           tenantsAssigned: 0,  openTickets: 0, lastActive: "3 hours ago",    status: "away",    joinedOn: "2024-11-02" },
  { id: "ST-07", name: "Yaw Boateng",      email: "yaw@dalxic.com",      role: "engineer",        region: "All",           tenantsAssigned: 0,  openTickets: 0, lastActive: "Yesterday 6:14",status: "offline", joinedOn: "2025-02-20" },
  { id: "ST-08", name: "Efua Darko",       email: "efua@dalxic.com",     role: "account_manager", region: "Western",       tenantsAssigned: 4,  openTickets: 1, lastActive: "20 mins ago",    status: "away",    joinedOn: "2025-06-04" },
]

/* ───── Releases / Feature flags ───── */

export type ReleaseStage = "draft" | "canary" | "rolling" | "stable" | "deprecated"

export interface MockRelease {
  id: string
  version: string
  title: string
  vertical: OrgType | "universal"
  releasedOn: string
  stage: ReleaseStage
  rolloutPct: number
  summary: string
  modules: string[]
  breaking: boolean
}

export const MOCK_RELEASES: MockRelease[] = [
  { id: "RL-042", version: "v4.2.0",  title: "WhatsApp bulk composer",          vertical: "universal",      releasedOn: "2026-04-14", stage: "canary",     rolloutPct: 15,  summary: "Multi-recipient WhatsApp templates with preview. Meta rate-limit aware.", modules: ["whatsapp-3k","whatsapp-10k"], breaking: false },
  { id: "RL-041", version: "v4.1.0",  title: "Barcode label designer",          vertical: "trade",     releasedOn: "2026-04-11", stage: "rolling",    rolloutPct: 72,  summary: "30x20, 50x30, A4-24, A4-40 layouts. EAN-13 barcode. Preview + print.", modules: ["labels"], breaking: false },
  { id: "RL-040", version: "v4.0.0",  title: "Payroll engine — Ghana 2026",     vertical: "universal",      releasedOn: "2026-04-05", stage: "stable",     rolloutPct: 100, summary: "SSNIT Tier 1 & 2, PAYE bands updated for 2026 tax year.",               modules: ["payroll"], breaking: true },
  { id: "RL-039", version: "v3.9.0",  title: "Tax engine — VAT-3 export",       vertical: "universal",      releasedOn: "2026-03-28", stage: "stable",     rolloutPct: 100, summary: "One-click VAT-3 PDF export for GRA submission.",                        modules: ["tax"], breaking: false },
  { id: "RL-038", version: "v3.8.0",  title: "Multi-branch stock transfers",    vertical: "trade",     releasedOn: "2026-03-15", stage: "stable",     rolloutPct: 100, summary: "Request/fulfil flow, transit ledger, auto-reconciliation.",            modules: ["stock","branches"], breaking: false },
  { id: "RL-037", version: "v3.7.0",  title: "Loyalty tiers + BOGOF",           vertical: "trade",     releasedOn: "2026-02-28", stage: "stable",     rolloutPct: 100, summary: "Bronze/Silver/Gold/Platinum, BOGOF promos, coupon caps.",              modules: ["loyalty"], breaking: false },
  { id: "RL-036", version: "v3.6.0",  title: "Parent portal v2",                 vertical: "institute", releasedOn: "2026-02-14", stage: "stable",     rolloutPct: 100, summary: "Self-service fee balance, term reports, attendance alerts.",          modules: ["parents"], breaking: false },
  { id: "RL-035", version: "v3.5.0",  title: "Z-Report + shift reconciliation", vertical: "trade",     releasedOn: "2026-01-30", stage: "stable",     rolloutPct: 100, summary: "Thermal Z-report, expected vs counted cash variance.",                 modules: ["shifts"], breaking: false },
  { id: "RL-034", version: "v3.4.0",  title: "Timetable module (beta)",         vertical: "institute", releasedOn: "2026-04-10", stage: "canary",     rolloutPct: 8,   summary: "Weekly timetable, clash detection, teacher workload.",                  modules: ["timetable"], breaking: false },
  { id: "RL-033", version: "v3.3.0",  title: "Transport routes (preview)",      vertical: "institute", releasedOn: "2026-04-08", stage: "draft",      rolloutPct: 0,   summary: "Bus routes, stops, driver assignment. Limited preview.",                 modules: ["transport"], breaking: false },
]

/* ───── Infrastructure health ───── */

export interface MockInfraService {
  id: string
  name: string
  category: "api" | "database" | "messaging" | "payments" | "storage" | "queue"
  status: "operational" | "degraded" | "down"
  uptime30d: number
  latencyMs: number
  throughput: string
  provider: string
  regionNote?: string
}

export const MOCK_INFRA: MockInfraService[] = [
  { id: "IS-01", name: "API Gateway",         category: "api",       status: "operational", uptime30d: 99.98, latencyMs: 82,  throughput: "1.2k req/min",  provider: "Vercel",         regionNote: "iad1 primary, fra1 secondary" },
  { id: "IS-02", name: "Tenant Database",     category: "database",  status: "operational", uptime30d: 99.95, latencyMs: 14,  throughput: "3.8k qps",      provider: "Neon Postgres",  regionNote: "eu-central-1, autoscaling" },
  { id: "IS-03", name: "Shared Cache",        category: "database",  status: "operational", uptime30d: 99.99, latencyMs: 2,   throughput: "22k ops/sec",   provider: "Upstash Redis",  regionNote: "eu-west-1" },
  { id: "IS-04", name: "Background Queue",    category: "queue",     status: "operational", uptime30d: 99.92, latencyMs: 180, throughput: "420 jobs/min",  provider: "QStash",         regionNote: "auto" },
  { id: "IS-05", name: "Object Storage",      category: "storage",   status: "operational", uptime30d: 99.99, latencyMs: 44,  throughput: "890 GB stored", provider: "Vercel Blob",    regionNote: "iad1" },
  { id: "IS-06", name: "SMS Gateway",         category: "messaging", status: "operational", uptime30d: 99.40, latencyMs: 1200,throughput: "84k SMS today", provider: "Africastalking", regionNote: "nrb1 · 12% balance" },
  { id: "IS-07", name: "WhatsApp Cloud API",  category: "messaging", status: "degraded",    uptime30d: 99.10, latencyMs: 2400,throughput: "12k msg today", provider: "Meta",           regionNote: "Template approvals delayed" },
  { id: "IS-08", name: "MoMo Collections",    category: "payments",  status: "operational", uptime30d: 99.80, latencyMs: 3200,throughput: "GHS 184k today",provider: "MTN + Vodafone", regionNote: "OTP flow stable" },
  { id: "IS-09", name: "Card Acquirer",       category: "payments",  status: "operational", uptime30d: 99.96, latencyMs: 1800,throughput: "GHS 92k today", provider: "Hubtel",         regionNote: "Visa + Mastercard" },
  { id: "IS-10", name: "Email Service",       category: "messaging", status: "operational", uptime30d: 99.99, latencyMs: 220, throughput: "4.2k sent today",provider: "Resend",        regionNote: "primary us-east" },
  { id: "IS-11", name: "Audit Log Stream",    category: "queue",     status: "operational", uptime30d: 100,   latencyMs: 12,  throughput: "184 events/min",provider: "Self-hosted",    regionNote: "append-only" },
  { id: "IS-12", name: "File Export Worker",  category: "queue",     status: "operational", uptime30d: 99.88, latencyMs: 340, throughput: "42 exports/day",provider: "Inngest",        regionNote: "auto" },
]

/* ───── Compliance filings ───── */

export type FilingType = "VAT-3" | "SSNIT" | "PAYE" | "DPA" | "GRA-Annual"
export type FilingStatus = "due" | "filed" | "overdue" | "accepted"

export interface MockFiling {
  id: string
  tenantId: string
  tenantName: string
  type: FilingType
  period: string
  dueOn: string
  filedOn?: string
  status: FilingStatus
  amount?: number
  reference?: string
}

export const MOCK_FILINGS: MockFiling[] = [
  { id: "FL-0001", tenantId: "TN-0003", tenantName: "Ashanti Building Supplies",   type: "VAT-3",    period: "Mar 2026",  dueOn: "2026-04-21", filedOn: "2026-04-14", status: "accepted", amount: 18420, reference: "GRA-VAT-448201" },
  { id: "FL-0002", tenantId: "TN-0001", tenantName: "Kasoa SuperMart",             type: "VAT-3",    period: "Mar 2026",  dueOn: "2026-04-21", filedOn: "2026-04-15", status: "filed",    amount: 8240,  reference: "GRA-VAT-448220" },
  { id: "FL-0003", tenantId: "TN-0010", tenantName: "Elmina Heritage Tours",       type: "VAT-3",    period: "Mar 2026",  dueOn: "2026-04-21", status: "due",      amount: 6220 },
  { id: "FL-0004", tenantId: "TN-0019", tenantName: "Obuasi Food Hall",            type: "VAT-3",    period: "Mar 2026",  dueOn: "2026-04-21", status: "due",      amount: 7100 },
  { id: "FL-0005", tenantId: "TN-0024", tenantName: "Wa Wholesale Depot",          type: "VAT-3",    period: "Mar 2026",  dueOn: "2026-04-21", filedOn: "2026-04-15", status: "filed",    amount: 9840,  reference: "GRA-VAT-448235" },
  { id: "FL-0006", tenantId: "TN-0003", tenantName: "Ashanti Building Supplies",   type: "SSNIT",    period: "Mar 2026",  dueOn: "2026-04-14", filedOn: "2026-04-13", status: "accepted", amount: 4520,  reference: "SSNIT-4810221" },
  { id: "FL-0007", tenantId: "TN-0003", tenantName: "Ashanti Building Supplies",   type: "PAYE",     period: "Mar 2026",  dueOn: "2026-04-14", filedOn: "2026-04-14", status: "accepted", amount: 6842,  reference: "GRA-PAYE-881422" },
  { id: "FL-0008", tenantId: "TN-0012", tenantName: "Tamale Tech Hub School",      type: "SSNIT",    period: "Mar 2026",  dueOn: "2026-04-14", filedOn: "2026-04-12", status: "accepted", amount: 2840,  reference: "SSNIT-4810299" },
  { id: "FL-0009", tenantId: "TN-0001", tenantName: "Kasoa SuperMart",             type: "PAYE",     period: "Mar 2026",  dueOn: "2026-04-14", filedOn: "2026-04-13", status: "accepted", amount: 2210,  reference: "GRA-PAYE-881500" },
  { id: "FL-0010", tenantId: "TN-0009", tenantName: "Madina Auto Spares",          type: "PAYE",     period: "Mar 2026",  dueOn: "2026-04-14", status: "overdue",  amount: 890 },
  { id: "FL-0011", tenantId: "TN-0018", tenantName: "Axim Seaside Academy",        type: "SSNIT",    period: "Mar 2026",  dueOn: "2026-04-14", status: "overdue",  amount: 620 },
  { id: "FL-0012", tenantId: "TN-0005", tenantName: "Legon Preparatory School",    type: "DPA",      period: "2026",      dueOn: "2026-06-30", status: "due" },
  { id: "FL-0013", tenantId: "TN-0003", tenantName: "Ashanti Building Supplies",   type: "DPA",      period: "2026",      dueOn: "2026-06-30", filedOn: "2026-02-14", status: "accepted", reference: "DPC-GH-44210" },
  { id: "FL-0014", tenantId: "TN-0020", tenantName: "Navrongo Technical Institute",type: "DPA",      period: "2026",      dueOn: "2026-06-30", filedOn: "2026-03-02", status: "accepted", reference: "DPC-GH-44298" },
  { id: "FL-0015", tenantId: "TN-0003", tenantName: "Ashanti Building Supplies",   type: "GRA-Annual",period:"FY 2025",    dueOn: "2026-06-30", status: "due",      amount: 42180 },
]

/* ───── Platform audit (ops staff actions) ───── */

export interface MockPlatformAudit {
  id: string
  ts: string
  actor: string
  actorRole: string
  action: string
  target: string
  tenantId?: string
  severity: "info" | "warn" | "critical"
  detail: string
  ip: string
}

export const MOCK_PLATFORM_AUDIT: MockPlatformAudit[] = [
  { id: "PA-0042", ts: "2026-04-15 09:12", actor: "Linda Sefa",    actorRole: "Billing",         action: "invoice_send",    target: "INV-2604-0010",  tenantId: "TN-0009", severity: "info",     detail: "Sent reminder to Madina Auto Spares (overdue)", ip: "10.0.0.14" },
  { id: "PA-0041", ts: "2026-04-15 08:55", actor: "Abena Nyarko",  actorRole: "Account Manager", action: "tenant_login_as", target: "TN-0003",        tenantId: "TN-0003", severity: "warn",     detail: "Logged into Ashanti Building Supplies as owner (debugging report export)", ip: "10.0.0.22" },
  { id: "PA-0040", ts: "2026-04-15 08:30", actor: "George Gaisie", actorRole: "Founder",         action: "tier_modify",     target: "Growth",         severity: "critical", detail: "Added 'tax' module to Growth tier (was Scale only)", ip: "10.0.0.1" },
  { id: "PA-0039", ts: "2026-04-15 08:02", actor: "Samuel Osei",   actorRole: "Support L1",      action: "ticket_assign",   target: "TK-1083",        tenantId: "TN-0012", severity: "info",     detail: "Assigned high-priority ticket to self", ip: "10.0.0.31" },
  { id: "PA-0038", ts: "2026-04-15 07:44", actor: "Yaw Boateng",   actorRole: "Engineer",        action: "release_promote", target: "v4.2.0 canary",  severity: "warn",     detail: "Promoted WhatsApp composer from 5% → 15% canary", ip: "10.0.0.44" },
  { id: "PA-0037", ts: "2026-04-14 17:00", actor: "Linda Sefa",    actorRole: "Billing",         action: "tenant_suspend",  target: "TN-0011",        tenantId: "TN-0011", severity: "critical", detail: "Suspended Ho Wellness Pharmacy — 65 days past due", ip: "10.0.0.14" },
  { id: "PA-0036", ts: "2026-04-14 15:22", actor: "George Gaisie", actorRole: "Founder",         action: "addon_publish",   target: "momo-direct",    severity: "info",     detail: "Published MoMo Direct Settle add-on", ip: "10.0.0.1" },
  { id: "PA-0035", ts: "2026-04-14 14:10", actor: "Kwame Appiah",  actorRole: "Support L2",      action: "tenant_refund",   target: "TN-0001",        tenantId: "TN-0001", severity: "warn",     detail: "Refunded GHS 80 SMS pack — duplicate purchase", ip: "10.0.0.28" },
  { id: "PA-0034", ts: "2026-04-14 11:30", actor: "Akosua Ampomah",actorRole: "Analyst",         action: "export",          target: "MRR Q1 2026",    severity: "info",     detail: "Exported MRR cohort report (CSV, 24 tenants)", ip: "10.0.0.18" },
  { id: "PA-0033", ts: "2026-04-14 10:05", actor: "Abena Nyarko",  actorRole: "Account Manager", action: "tenant_upgrade",  target: "TN-0013",        tenantId: "TN-0013", severity: "info",     detail: "Koforidua Central Market upgraded Starter → Growth", ip: "10.0.0.22" },
  { id: "PA-0032", ts: "2026-04-14 09:00", actor: "Linda Sefa",    actorRole: "Billing",         action: "invoice_void",    target: "INV-2603-0088",  tenantId: "TN-0007", severity: "warn",     detail: "Voided trial invoice — tenant still in trial", ip: "10.0.0.14" },
  { id: "PA-0031", ts: "2026-04-13 19:30", actor: "Yaw Boateng",   actorRole: "Engineer",        action: "flag_toggle",     target: "exp-new-dashboard", severity: "info",  detail: "Enabled experimental dashboard for 3 internal tenants", ip: "10.0.0.44" },
]

/* ───── Growth analytics series ───── */

export interface MockMRREntry {
  month: string
  mrr: number
  newMrr: number
  churnMrr: number
}

export const MOCK_MRR_SERIES: MockMRREntry[] = [
  { month: "Oct 25", mrr: 18840, newMrr: 2680, churnMrr: 380 },
  { month: "Nov 25", mrr: 21420, newMrr: 2880, churnMrr: 300 },
  { month: "Dec 25", mrr: 24680, newMrr: 3480, churnMrr: 220 },
  { month: "Jan 26", mrr: 28420, newMrr: 3920, churnMrr: 180 },
  { month: "Feb 26", mrr: 32100, newMrr: 3820, churnMrr: 140 },
  { month: "Mar 26", mrr: 35740, newMrr: 3760, churnMrr: 120 },
  { month: "Apr 26", mrr: 39420, newMrr: 3860, churnMrr: 180 },
]

export interface MockRegion {
  region: string
  tenants: number
  mrr: number
}

export const MOCK_REGIONS: MockRegion[] = [
  { region: "Greater Accra", tenants: 13, mrr: 16610 },
  { region: "Ashanti",       tenants: 5,  mrr: 10780 },
  { region: "Central",       tenants: 4,  mrr: 6000  },
  { region: "Northern",      tenants: 2,  mrr: 2400  },
  { region: "Upper East",    tenants: 2,  mrr: 1160  },
  { region: "Upper West",    tenants: 1,  mrr: 1200  },
  { region: "Western",       tenants: 2,  mrr: 600   },
  { region: "Eastern",       tenants: 2,  mrr: 1260  },
  { region: "Volta",         tenants: 1,  mrr: 0     },
  { region: "Bono",          tenants: 1,  mrr: 0     },
  { region: "Bono East",     tenants: 1,  mrr: 0     },
]

/* ───── Platform settings (defaults) ───── */

export const MOCK_PLATFORM_SETTINGS = {
  brand: { name: "DalxicOperations", parent: "Dalxic", accent: "#10B981", legalName: "Dalxic Operations Ltd." },
  contacts: { supportEmail: "help@dalxic.com", billingEmail: "billing@dalxic.com", phone: "+233 30 000 2025", whatsapp: "+233 55 200 2025" },
  tax: { vat: 15, nhil: 2.5, getfund: 2.5, covidLevy: 1, ssnitTier1Employer: 13, ssnitTier2Employer: 5, ssnitEmployee: 5.5 },
  payments: { momoProviders: ["MTN","Vodafone","AirtelTigo"], cardProviders: ["Visa","Mastercard","Hubtel"], settlementDays: 1 },
  limits: { freeTrialDays: 30, maxFileUploadMB: 25, sessionTimeoutMins: 30, pinAttempts: 3 },
  webhooks: [
    { id: "WH-01", url: "https://hooks.slack.com/services/T…/B…/…", event: "tenant.suspended", active: true },
    { id: "WH-02", url: "https://hooks.slack.com/services/T…/B…/…", event: "invoice.overdue",  active: true },
    { id: "WH-03", url: "https://api.segment.io/v1/track",          event: "tenant.created",   active: true },
    { id: "WH-04", url: "https://api.segment.io/v1/track",          event: "tenant.upgraded",  active: true },
  ],
  apiKeys: [
    { id: "AK-01", label: "Production",   keyMasked: "ops_live_••••••••8e4f", createdOn: "2024-03-01", lastUsed: "2 mins ago" },
    { id: "AK-02", label: "Staging",      keyMasked: "ops_test_••••••••22a0", createdOn: "2024-03-01", lastUsed: "1 hour ago" },
    { id: "AK-03", label: "Partner API",  keyMasked: "ops_ptnr_••••••••9ddc", createdOn: "2025-06-14", lastUsed: "Yesterday" },
  ],
}

/* ───── Org Type → Tone / Label / Brand mappings ───── */

export const VERTICAL_ACCENT: Record<OrgType, "amber" | "copper" | "sky" | "emerald"> = {
  trade: "amber",
  health: "copper",
  institute: "sky",
  restaurant: "amber",
  salon: "emerald",
  hotel: "sky",
  gym: "emerald",
  mechanic: "amber",
  pharmacy: "emerald",
  law: "emerald",
}

export const VERTICAL_LABEL: Record<OrgType, string> = {
  trade: "Trade",
  health: "Health",
  institute: "Institute",
  restaurant: "Dine",
  salon: "Style",
  hotel: "Hotel",
  gym: "Fitness",
  mechanic: "Auto",
  pharmacy: "Pharma",
  law: "Legal",
}

export const VERTICAL_BRAND: Record<OrgType, string> = {
  trade: "DalxicTrade",
  health: "DalxicHealth",
  institute: "DalxicInstitute",
  restaurant: "DalxicDine",
  salon: "DalxicStyle",
  hotel: "DalxicHotel",
  gym: "DalxicFitness",
  mechanic: "DalxicAuto",
  pharmacy: "DalxicPharma",
  law: "DalxicLegal",
}

export const ALL_BEHAVIOURS: Behaviour[] = ["consultation", "procedure", "product", "admission", "recurring", "admin"]

/* ═══════════════════════════════════════════════════════════════
   UNIVERSAL SERVICE-ITEM MODEL
   Every product/service/capacity across all verticals.
   ═══════════════════════════════════════════════════════════════ */

export interface MockServiceItem {
  id: string
  name: string
  sku?: string
  categoryId: string
  behaviour: Behaviour
  stockType: StockType
  costPrice: number
  sellingPrice: number
  stock: number
  minStock: number
  capacityTotal?: number
  capacityUsed?: number
  recurringInterval?: "daily" | "weekly" | "monthly" | "termly" | "yearly"
  unit: string
  taxable: boolean
  photoUrl?: string
  isActive: boolean
}

export interface MockOrg {
  id: string
  code: string
  name: string
  type: "trade" | "health" | "institute"
  tier: "T1" | "T2" | "T3" | "T4"
  activeBehaviours: Behaviour[]
  paymentGate: PaymentGate
  labelConfig: Record<Behaviour, string>
  activeModules: string[]
  currency: string
}

export const MOCK_ORGS: MockOrg[] = [
  {
    id: "org_trade", code: "DEMO", name: "Demo Store",
    type: "trade", tier: "T2",
    activeBehaviours: ["consultation", "product", "admin"],
    paymentGate: "pay_after",
    labelConfig: {
      consultation: "Customer Assist", procedure: "Warehouse Pick",
      product: "Goods", admission: "Product → Shelf",
      recurring: "Supplier Credit", admin: "Bookkeeping"
    },
    activeModules: ["pos","inventory","customers","suppliers","accounting","payroll","shifts","reports","audit","roles"],
    currency: "GHS"
  },
  {
    id: "org_health", code: "KBH", name: "Korle Bu Hospital",
    type: "health", tier: "T2",
    activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"],
    paymentGate: "pay_before",
    labelConfig: {
      consultation: "Doctor Visit", procedure: "Surgery",
      product: "Drugs", admission: "Ward Bed",
      recurring: "Ward Nightly", admin: "Patient Card"
    },
    activeModules: ["front-desk","doctor","nurse-station","waiting-room","lab","pharmacy","injection-room","billing","bookkeeping"],
    currency: "GHS"
  },
  {
    id: "org_inst", code: "ACAD", name: "Demo Academy",
    type: "institute", tier: "T2",
    activeBehaviours: ["consultation", "procedure", "admission", "recurring", "admin"],
    paymentGate: "pay_before",
    labelConfig: {
      consultation: "Admissions Counsel", procedure: "Lesson Delivery",
      product: "Textbooks", admission: "Enrollment",
      recurring: "Term Fees", admin: "Grading"
    },
    activeModules: ["enrollment","groups","subjects","exams","gradebook","attendance","fees","schedule","staff"],
    currency: "GHS"
  }
]

/* ───── Health Module Definitions ───── */

export type HealthModuleGroup = "Clinical" | "Diagnostics" | "Inpatient" | "Specialist" | "Admin"

export interface HealthModuleDef {
  slug: string
  title: string
  group: HealthModuleGroup
  status: ModuleStatus
  blurb: string
  href: string
}

export const HEALTH_MODULES: HealthModuleDef[] = [
  { slug: "front-desk",     group: "Clinical",    status: "live",    title: "Front Desk",       blurb: "Patient registration, queue management, emergency admission",    href: "/modules/front-desk" },
  { slug: "doctor",          group: "Clinical",    status: "live",    title: "Doctor",            blurb: "Consultation, diagnosis, SOAP notes, prescriptions, referrals", href: "/modules/doctor" },
  { slug: "nurse-station",   group: "Clinical",    status: "live",    title: "Nurse Station",     blurb: "Vitals recording, task management, abnormal flagging",           href: "/modules/nurse-station" },
  { slug: "waiting-room",    group: "Clinical",    status: "live",    title: "Waiting Room",      blurb: "Real-time queue display, now serving, emergency alerts",         href: "/modules/waiting-room" },
  { slug: "lab",             group: "Diagnostics", status: "live",    title: "Laboratory",        blurb: "Test orders, result entry, abnormal flagging",                   href: "/modules/lab" },
  { slug: "pharmacy",        group: "Diagnostics", status: "live",    title: "Pharmacy",          blurb: "Prescription queue, dispensing, stock tracking",                 href: "/modules/pharmacy" },
  { slug: "radiology",       group: "Diagnostics", status: "preview", title: "CT / Radiology",    blurb: "Scan queue, report writing",                                    href: "/modules/radiology" },
  { slug: "ultrasound",      group: "Diagnostics", status: "preview", title: "Ultrasound",        blurb: "Sonography queue, findings",                                    href: "/modules/ultrasound" },
  { slug: "ward",            group: "Inpatient",   status: "preview", title: "Ward / IPD",        blurb: "Admissions, daily rounds, discharge summaries",                  href: "/modules/ward" },
  { slug: "icu",             group: "Inpatient",   status: "preview", title: "ICU",               blurb: "Vital signs grid, ventilator tracking",                          href: "/modules/icu" },
  { slug: "maternity",       group: "Inpatient",   status: "preview", title: "Maternity",         blurb: "Antenatal, labour, delivery, postnatal",                         href: "/modules/maternity" },
  { slug: "blood-bank",      group: "Inpatient",   status: "preview", title: "Blood Bank",        blurb: "Inventory grid, cross-match, transfusion",                       href: "/modules/blood-bank" },
  { slug: "injection-room",  group: "Specialist",  status: "live",    title: "Injection Room",    blurb: "Injection orders, administration",                               href: "/modules/injection-room" },
  { slug: "billing",         group: "Admin",       status: "live",    title: "Billing",           blurb: "Revenue dashboard, patient billing, payments",                   href: "/modules/billing" },
  { slug: "bookkeeping",     group: "Admin",       status: "preview", title: "Bookkeeping",       blurb: "Patient records, financials, assessments",                       href: "/modules/bookkeeping" },
]

/* ───── Health Catalogue (ServiceItem) ───── */

export const MOCK_HEALTH_CATALOGUE: MockServiceItem[] = [
  { id: "HC-001", name: "General Consultation",        categoryId: "consultation",  behaviour: "consultation", stockType: "service",  costPrice: 0,   sellingPrice: 5000,  stock: 0, minStock: 0, unit: "visit",   taxable: false, isActive: true },
  { id: "HC-002", name: "Specialist Consultation",     categoryId: "consultation",  behaviour: "consultation", stockType: "service",  costPrice: 0,   sellingPrice: 8000,  stock: 0, minStock: 0, unit: "visit",   taxable: false, isActive: true },
  { id: "HC-003", name: "Emergency Consultation",      categoryId: "consultation",  behaviour: "consultation", stockType: "service",  costPrice: 0,   sellingPrice: 15000, stock: 0, minStock: 0, unit: "visit",   taxable: false, isActive: true },
  { id: "HC-004", name: "Full Blood Count",            categoryId: "lab",           behaviour: "procedure",    stockType: "service",  costPrice: 0,   sellingPrice: 2500,  stock: 0, minStock: 0, unit: "test",    taxable: false, isActive: true },
  { id: "HC-005", name: "Malaria RDT",                 categoryId: "lab",           behaviour: "procedure",    stockType: "service",  costPrice: 0,   sellingPrice: 1500,  stock: 0, minStock: 0, unit: "test",    taxable: false, isActive: true },
  { id: "HC-006", name: "Urinalysis",                  categoryId: "lab",           behaviour: "procedure",    stockType: "service",  costPrice: 0,   sellingPrice: 2000,  stock: 0, minStock: 0, unit: "test",    taxable: false, isActive: true },
  { id: "HC-007", name: "Blood Sugar",                 categoryId: "lab",           behaviour: "procedure",    stockType: "service",  costPrice: 0,   sellingPrice: 1500,  stock: 0, minStock: 0, unit: "test",    taxable: false, isActive: true },
  { id: "HC-008", name: "Liver Function",              categoryId: "lab",           behaviour: "procedure",    stockType: "service",  costPrice: 0,   sellingPrice: 3500,  stock: 0, minStock: 0, unit: "test",    taxable: false, isActive: true },
  { id: "HC-009", name: "Paracetamol 500mg",           categoryId: "pharmacy",      behaviour: "product",      stockType: "physical", costPrice: 200, sellingPrice: 500,   stock: 500, minStock: 50, unit: "tab",  taxable: false, isActive: true, sku: "PHR-001" },
  { id: "HC-010", name: "Amoxicillin 250mg",           categoryId: "pharmacy",      behaviour: "product",      stockType: "physical", costPrice: 300, sellingPrice: 800,   stock: 200, minStock: 30, unit: "cap",  taxable: false, isActive: true, sku: "PHR-002" },
  { id: "HC-011", name: "Metformin 500mg",             categoryId: "pharmacy",      behaviour: "product",      stockType: "physical", costPrice: 400, sellingPrice: 1000,  stock: 150, minStock: 20, unit: "tab",  taxable: false, isActive: true, sku: "PHR-003" },
  { id: "HC-012", name: "Artemether-Lumefantrine",     categoryId: "pharmacy",      behaviour: "product",      stockType: "physical", costPrice: 600, sellingPrice: 1500,  stock: 100, minStock: 20, unit: "pack", taxable: false, isActive: true, sku: "PHR-004" },
  { id: "HC-013", name: "Omeprazole 20mg",             categoryId: "pharmacy",      behaviour: "product",      stockType: "physical", costPrice: 250, sellingPrice: 600,   stock: 300, minStock: 30, unit: "cap",  taxable: false, isActive: true, sku: "PHR-005" },
  { id: "HC-014", name: "CT Scan",                     categoryId: "imaging",       behaviour: "procedure",    stockType: "service",  costPrice: 0,   sellingPrice: 20000, stock: 0, minStock: 0, unit: "scan",    taxable: false, isActive: true },
  { id: "HC-015", name: "Ultrasound",                  categoryId: "imaging",       behaviour: "procedure",    stockType: "service",  costPrice: 0,   sellingPrice: 8000,  stock: 0, minStock: 0, unit: "scan",    taxable: false, isActive: true },
  { id: "HC-016", name: "X-Ray",                       categoryId: "imaging",       behaviour: "procedure",    stockType: "service",  costPrice: 0,   sellingPrice: 5000,  stock: 0, minStock: 0, unit: "scan",    taxable: false, isActive: true },
  { id: "HC-017", name: "Ward Bed",                    categoryId: "ward",          behaviour: "admission",    stockType: "capacity", costPrice: 0,   sellingPrice: 0,     stock: 0, minStock: 0, capacityTotal: 40, capacityUsed: 28, unit: "bed", taxable: false, isActive: true },
  { id: "HC-018", name: "Ward Daily Rate",             categoryId: "ward",          behaviour: "recurring",    stockType: "service",  costPrice: 0,   sellingPrice: 10000, stock: 0, minStock: 0, recurringInterval: "daily", unit: "night", taxable: false, isActive: true },
  { id: "HC-019", name: "ICU Bed",                     categoryId: "icu",           behaviour: "admission",    stockType: "capacity", costPrice: 0,   sellingPrice: 0,     stock: 0, minStock: 0, capacityTotal: 8,  capacityUsed: 5,  unit: "bed", taxable: false, isActive: true },
  { id: "HC-020", name: "ICU Daily Rate",              categoryId: "icu",           behaviour: "recurring",    stockType: "service",  costPrice: 0,   sellingPrice: 50000, stock: 0, minStock: 0, recurringInterval: "daily", unit: "night", taxable: false, isActive: true },
  { id: "HC-021", name: "Injection Administration",    categoryId: "injection",     behaviour: "procedure",    stockType: "service",  costPrice: 0,   sellingPrice: 1000,  stock: 0, minStock: 0, unit: "dose",    taxable: false, isActive: true },
]

/* ───── Health — Patients ───── */

export interface MockContact {
  id: string
  name: string
  phone: string
  type: "patient" | "student"
  status: string
  dateOfBirth: string
  gender: "Male" | "Female"
  bloodGroup?: string
  allergies?: string[]
  insuranceType?: "NHIS" | "Private" | "None"
  emergencyContact?: string
  emergencyPhone?: string
  guardianName?: string
  guardianPhone?: string
  groupId?: string
  enrolledAt?: string
  registeredAt?: string
}

export const MOCK_PATIENTS: MockContact[] = [
  { id: "PT-001", name: "Kwame Asante",    phone: "+233 24 111 0001", type: "patient", status: "active",     dateOfBirth: "1985-03-12", gender: "Male",   bloodGroup: "O+",  allergies: ["Penicillin"], insuranceType: "NHIS",    emergencyContact: "Ama Asante",     emergencyPhone: "+233 24 111 0050", registeredAt: "2025-06-14" },
  { id: "PT-002", name: "Ama Mensah",      phone: "+233 20 111 0002", type: "patient", status: "active",     dateOfBirth: "1990-07-22", gender: "Female", bloodGroup: "A+",  insuranceType: "Private", emergencyContact: "Kofi Mensah",    emergencyPhone: "+233 20 111 0051", registeredAt: "2025-08-02" },
  { id: "PT-003", name: "Kofi Boateng",    phone: "+233 26 111 0003", type: "patient", status: "active",     dateOfBirth: "1978-11-05", gender: "Male",   bloodGroup: "B+",  allergies: ["Sulfa drugs"], insuranceType: "NHIS",   emergencyContact: "Akua Boateng",   emergencyPhone: "+233 26 111 0052", registeredAt: "2024-12-18" },
  { id: "PT-004", name: "Akua Darko",      phone: "+233 54 111 0004", type: "patient", status: "active",     dateOfBirth: "1995-01-30", gender: "Female", bloodGroup: "AB+", insuranceType: "None",    emergencyContact: "Yaw Darko",      emergencyPhone: "+233 54 111 0053", registeredAt: "2026-01-10" },
  { id: "PT-005", name: "Yaw Osei",        phone: "+233 27 111 0005", type: "patient", status: "active",     dateOfBirth: "1968-09-14", gender: "Male",   bloodGroup: "O-",  allergies: ["Aspirin", "Latex"], insuranceType: "NHIS", emergencyContact: "Esi Osei",     emergencyPhone: "+233 27 111 0054", registeredAt: "2024-03-22" },
  { id: "PT-006", name: "Abena Frimpong",  phone: "+233 50 111 0006", type: "patient", status: "active",     dateOfBirth: "2001-04-18", gender: "Female", bloodGroup: "A-",  insuranceType: "Private", emergencyContact: "Kofi Frimpong",  emergencyPhone: "+233 50 111 0055", registeredAt: "2025-11-28" },
  { id: "PT-007", name: "Kwesi Tetteh",    phone: "+233 24 111 0007", type: "patient", status: "discharged", dateOfBirth: "1972-06-08", gender: "Male",   bloodGroup: "B-",  insuranceType: "NHIS",    emergencyContact: "Efua Tetteh",    emergencyPhone: "+233 24 111 0056", registeredAt: "2025-02-14" },
  { id: "PT-008", name: "Efua Amoah",      phone: "+233 55 111 0008", type: "patient", status: "active",     dateOfBirth: "1988-12-25", gender: "Female", bloodGroup: "O+",  insuranceType: "None",    emergencyContact: "Nana Amoah",     emergencyPhone: "+233 55 111 0057", registeredAt: "2026-02-05" },
  { id: "PT-009", name: "Nana Adjei",      phone: "+233 24 111 0009", type: "patient", status: "active",     dateOfBirth: "1956-02-20", gender: "Male",   bloodGroup: "A+",  allergies: ["Codeine"],    insuranceType: "NHIS",   emergencyContact: "Adwoa Adjei",    emergencyPhone: "+233 24 111 0058", registeredAt: "2024-08-30" },
  { id: "PT-010", name: "Adwoa Owusu",     phone: "+233 20 111 0010", type: "patient", status: "active",     dateOfBirth: "1993-08-07", gender: "Female", bloodGroup: "AB-", insuranceType: "Private", emergencyContact: "Kojo Owusu",     emergencyPhone: "+233 20 111 0059", registeredAt: "2025-05-12" },
  { id: "PT-011", name: "Kojo Appiah",     phone: "+233 26 111 0011", type: "patient", status: "inactive",   dateOfBirth: "1980-10-15", gender: "Male",   bloodGroup: "O+",  insuranceType: "None",    emergencyContact: "Akosua Appiah",  emergencyPhone: "+233 26 111 0060", registeredAt: "2025-01-08" },
  { id: "PT-012", name: "Akosua Badu",     phone: "+233 54 111 0012", type: "patient", status: "active",     dateOfBirth: "1999-05-28", gender: "Female", bloodGroup: "B+",  insuranceType: "NHIS",    emergencyContact: "Kwabena Badu",   emergencyPhone: "+233 54 111 0061", registeredAt: "2026-03-01" },
  { id: "PT-013", name: "Kwabena Fosu",    phone: "+233 27 111 0013", type: "patient", status: "active",     dateOfBirth: "1975-07-19", gender: "Male",   bloodGroup: "A+",  insuranceType: "Private", emergencyContact: "Esi Fosu",       emergencyPhone: "+233 27 111 0062", registeredAt: "2025-09-20" },
  { id: "PT-014", name: "Esi Gyamfi",      phone: "+233 50 111 0014", type: "patient", status: "active",     dateOfBirth: "2003-03-03", gender: "Female", bloodGroup: "O+",  insuranceType: "NHIS",    emergencyContact: "Fiifi Gyamfi",   emergencyPhone: "+233 50 111 0063", registeredAt: "2026-01-22" },
  { id: "PT-015", name: "Fiifi Mensah",    phone: "+233 24 111 0015", type: "patient", status: "discharged", dateOfBirth: "1960-11-11", gender: "Male",   bloodGroup: "B-",  insuranceType: "NHIS",    emergencyContact: "Araba Mensah",   emergencyPhone: "+233 24 111 0064", registeredAt: "2024-11-04" },
  { id: "PT-016", name: "Araba Quaye",     phone: "+233 55 111 0016", type: "patient", status: "active",     dateOfBirth: "1997-09-26", gender: "Female", bloodGroup: "AB+", insuranceType: "None",    emergencyContact: "Papa Quaye",     emergencyPhone: "+233 55 111 0065", registeredAt: "2025-07-15" },
  { id: "PT-017", name: "Papa Ankrah",     phone: "+233 24 111 0017", type: "patient", status: "active",     dateOfBirth: "1982-01-14", gender: "Male",   bloodGroup: "O-",  insuranceType: "Private", emergencyContact: "Maame Ankrah",   emergencyPhone: "+233 24 111 0066", registeredAt: "2026-02-28" },
  { id: "PT-018", name: "Maame Serwaa",    phone: "+233 20 111 0018", type: "patient", status: "active",     dateOfBirth: "1991-06-02", gender: "Female", bloodGroup: "A-",  insuranceType: "NHIS",    emergencyContact: "Yaa Serwaa",     emergencyPhone: "+233 20 111 0067", registeredAt: "2025-04-09" },
  { id: "PT-019", name: "Yaa Asantewaa",   phone: "+233 26 111 0019", type: "patient", status: "active",     dateOfBirth: "2005-12-16", gender: "Female", bloodGroup: "B+",  insuranceType: "NHIS",    emergencyContact: "Kofi Asante",    emergencyPhone: "+233 26 111 0068", registeredAt: "2026-04-01" },
  { id: "PT-020", name: "Kofi Annan Jr",   phone: "+233 54 111 0020", type: "patient", status: "inactive",   dateOfBirth: "1970-04-08", gender: "Male",   bloodGroup: "O+",  insuranceType: "Private", emergencyContact: "Nane Annan",     emergencyPhone: "+233 54 111 0069", registeredAt: "2024-06-18" },
]

/* ───── Health — Queue ───── */

export type VisitStatus = "waiting" | "in_consultation" | "paused_for_lab" | "lab_results_ready" | "paused_for_pharmacy" | "awaiting_close" | "closed"

export interface MockQueueEntry {
  id: string
  patientId: string
  patientName: string
  token: string
  department: string
  chiefComplaint: string
  symptomSeverity: number
  emergencyFlag: boolean
  visitStatus: VisitStatus
  assignedDoctorId?: string
  assignedDoctorName?: string
  checkoutPin?: string
  priority: number
  queuedAt: string
}

export const MOCK_QUEUE: MockQueueEntry[] = [
  { id: "Q-001", patientId: "PT-005", patientName: "Yaw Osei",        token: "ER-KBH-001", department: "Emergency",     chiefComplaint: "Severe chest pain, shortness of breath",       symptomSeverity: 9,  emergencyFlag: true,  visitStatus: "in_consultation", assignedDoctorId: "DR-003", assignedDoctorName: "Dr. Kwaku Mensah",  priority: 100, queuedAt: "2026-04-17T07:15:00" },
  { id: "Q-002", patientId: "PT-009", patientName: "Nana Adjei",      token: "ER-KBH-002", department: "Emergency",     chiefComplaint: "Uncontrolled bleeding from laceration",        symptomSeverity: 8,  emergencyFlag: true,  visitStatus: "waiting",         priority: 100, queuedAt: "2026-04-17T07:42:00" },
  { id: "Q-003", patientId: "PT-001", patientName: "Kwame Asante",    token: "KBH-001",    department: "General",        chiefComplaint: "Persistent headache and fever for 3 days",     symptomSeverity: 6,  emergencyFlag: false, visitStatus: "in_consultation", assignedDoctorId: "DR-001", assignedDoctorName: "Dr. Ama Owusu",     priority: 6,  queuedAt: "2026-04-17T08:00:00" },
  { id: "Q-004", patientId: "PT-003", patientName: "Kofi Boateng",    token: "KBH-002",    department: "General",        chiefComplaint: "Knee pain after fall",                         symptomSeverity: 5,  emergencyFlag: false, visitStatus: "paused_for_lab",  assignedDoctorId: "DR-001", assignedDoctorName: "Dr. Ama Owusu",     priority: 5,  queuedAt: "2026-04-17T08:12:00" },
  { id: "Q-005", patientId: "PT-012", patientName: "Akosua Badu",     token: "KBH-003",    department: "General",        chiefComplaint: "Cough and cold symptoms",                      symptomSeverity: 3,  emergencyFlag: false, visitStatus: "lab_results_ready", assignedDoctorId: "DR-002", assignedDoctorName: "Dr. Kofi Asare",  priority: 50, queuedAt: "2026-04-17T08:25:00" },
  { id: "Q-006", patientId: "PT-002", patientName: "Ama Mensah",      token: "KBH-004",    department: "OB/GYN",         chiefComplaint: "Routine antenatal checkup",                    symptomSeverity: 2,  emergencyFlag: false, visitStatus: "waiting",         priority: 2,  queuedAt: "2026-04-17T08:40:00" },
  { id: "Q-007", patientId: "PT-008", patientName: "Efua Amoah",      token: "KBH-005",    department: "General",        chiefComplaint: "Abdominal pain, nausea",                       symptomSeverity: 7,  emergencyFlag: false, visitStatus: "waiting",         priority: 7,  queuedAt: "2026-04-17T08:55:00" },
  { id: "Q-008", patientId: "PT-014", patientName: "Esi Gyamfi",      token: "KBH-006",    department: "General",        chiefComplaint: "Skin rash on arms and legs",                   symptomSeverity: 4,  emergencyFlag: false, visitStatus: "paused_for_pharmacy", assignedDoctorId: "DR-002", assignedDoctorName: "Dr. Kofi Asare", priority: 4, queuedAt: "2026-04-17T09:10:00" },
  { id: "Q-009", patientId: "PT-010", patientName: "Adwoa Owusu",     token: "KBH-007",    department: "Pediatrics",     chiefComplaint: "Child with high fever and vomiting",           symptomSeverity: 7,  emergencyFlag: false, visitStatus: "waiting",         priority: 7,  queuedAt: "2026-04-17T09:22:00" },
  { id: "Q-010", patientId: "PT-006", patientName: "Abena Frimpong",  token: "KBH-008",    department: "General",        chiefComplaint: "Follow-up for diabetes management",            symptomSeverity: 3,  emergencyFlag: false, visitStatus: "awaiting_close",  assignedDoctorId: "DR-005", assignedDoctorName: "Dr. Nana Agyemang", priority: 3, queuedAt: "2026-04-17T09:35:00" },
  { id: "Q-011", patientId: "PT-018", patientName: "Maame Serwaa",    token: "KBH-009",    department: "General",        chiefComplaint: "Dizziness and fatigue",                        symptomSeverity: 5,  emergencyFlag: false, visitStatus: "waiting",         priority: 5,  queuedAt: "2026-04-17T09:48:00" },
  { id: "Q-012", patientId: "PT-004", patientName: "Akua Darko",      token: "KBH-010",    department: "General",        chiefComplaint: "Lower back pain",                              symptomSeverity: 4,  emergencyFlag: false, visitStatus: "closed",          assignedDoctorId: "DR-001", assignedDoctorName: "Dr. Ama Owusu", checkoutPin: "4821", priority: 4, queuedAt: "2026-04-17T07:50:00" },
]

/* ───── Health — Doctors ───── */

export interface MockDoctor {
  id: string
  name: string
  specialty: string
  operatorId: string
  status: "available" | "in_session" | "break"
}

export const MOCK_DOCTORS: MockDoctor[] = [
  { id: "DR-001", name: "Dr. Ama Owusu",       specialty: "General Practice",    operatorId: "OP-H01", status: "in_session" },
  { id: "DR-002", name: "Dr. Kofi Asare",      specialty: "Pediatrics",          operatorId: "OP-H02", status: "in_session" },
  { id: "DR-003", name: "Dr. Kwaku Mensah",    specialty: "Surgery",             operatorId: "OP-H03", status: "in_session" },
  { id: "DR-004", name: "Dr. Abena Sarpong",   specialty: "OB/GYN",              operatorId: "OP-H04", status: "available" },
  { id: "DR-005", name: "Dr. Nana Agyemang",   specialty: "Internal Medicine",   operatorId: "OP-H05", status: "break" },
]

/* ───── Health — Consultations ───── */

export interface MockConsultation {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  diagnosis: string
  secondaryDiagnosis: string[]
  soapNotes: { subjective: string; objective: string; assessment: string; plan: string }
  prescriptions: { drug: string; dosage: string; duration: string; quantity: number }[]
  labOrders: { testName: string; category: string; urgent: boolean }[]
  referrals: { targetStation: string; specialty: string; reason: string; urgency: "routine" | "urgent" | "stat" }[]
  status: "in_progress" | "completed" | "referred"
  startedAt: string
  completedAt?: string
}

export const MOCK_CONSULTATIONS: MockConsultation[] = [
  { id: "CON-001", patientId: "PT-001", patientName: "Kwame Asante", doctorId: "DR-001", doctorName: "Dr. Ama Owusu", diagnosis: "Malaria (suspected)", secondaryDiagnosis: ["Dehydration"],
    soapNotes: { subjective: "Patient reports 3-day fever with chills and body aches. No travel history.", objective: "Temp 38.8°C, mild pallor, no jaundice.", assessment: "Clinical malaria, rule out typhoid.", plan: "Malaria RDT + FBC, start artemether-lumefantrine if positive." },
    prescriptions: [{ drug: "Artemether-Lumefantrine", dosage: "4 tabs BD", duration: "3 days", quantity: 24 }, { drug: "Paracetamol 500mg", dosage: "2 tabs TDS", duration: "3 days", quantity: 18 }],
    labOrders: [{ testName: "Malaria RDT", category: "Serology", urgent: true }, { testName: "Full Blood Count", category: "Hematology", urgent: false }],
    referrals: [], status: "in_progress", startedAt: "2026-04-17T08:15:00" },
  { id: "CON-002", patientId: "PT-005", patientName: "Yaw Osei", doctorId: "DR-003", doctorName: "Dr. Kwaku Mensah", diagnosis: "Acute Coronary Syndrome", secondaryDiagnosis: ["Hypertension"],
    soapNotes: { subjective: "Severe substernal chest pain radiating to left arm. Onset 2 hours ago.", objective: "BP 180/110, HR 102, diaphoretic, ECG shows ST elevation.", assessment: "STEMI — urgent cardiology consult.", plan: "Aspirin 300mg stat, morphine PRN, urgent transfer to cath lab." },
    prescriptions: [{ drug: "Aspirin", dosage: "300mg stat", duration: "1 dose", quantity: 1 }],
    labOrders: [{ testName: "Full Blood Count", category: "Hematology", urgent: true }, { testName: "Blood Sugar", category: "Biochemistry", urgent: true }],
    referrals: [{ targetStation: "ICU", specialty: "Cardiology", reason: "STEMI for urgent intervention", urgency: "stat" }], status: "in_progress", startedAt: "2026-04-17T07:20:00" },
  { id: "CON-003", patientId: "PT-012", patientName: "Akosua Badu", doctorId: "DR-002", doctorName: "Dr. Kofi Asare", diagnosis: "Upper Respiratory Tract Infection", secondaryDiagnosis: [],
    soapNotes: { subjective: "Cough, runny nose, mild sore throat for 5 days.", objective: "Pharynx mildly erythematous, lungs clear.", assessment: "Viral URTI, no antibiotics needed.", plan: "Symptomatic treatment, reassess if worsens." },
    prescriptions: [{ drug: "Paracetamol 500mg", dosage: "2 tabs TDS", duration: "5 days", quantity: 30 }],
    labOrders: [{ testName: "Full Blood Count", category: "Hematology", urgent: false }],
    referrals: [], status: "completed", startedAt: "2026-04-17T08:30:00", completedAt: "2026-04-17T08:55:00" },
  { id: "CON-004", patientId: "PT-003", patientName: "Kofi Boateng", doctorId: "DR-001", doctorName: "Dr. Ama Owusu", diagnosis: "Knee Osteoarthritis", secondaryDiagnosis: ["Obesity"],
    soapNotes: { subjective: "Right knee pain worsening over 6 months, worse after climbing stairs.", objective: "BMI 32, right knee crepitus, limited flexion.", assessment: "Moderate OA right knee.", plan: "X-ray knee, physiotherapy referral, NSAIDs." },
    prescriptions: [{ drug: "Omeprazole 20mg", dosage: "1 cap daily", duration: "14 days", quantity: 14 }],
    labOrders: [], referrals: [{ targetStation: "Radiology", specialty: "Orthopedics", reason: "X-ray right knee for OA grading", urgency: "routine" }], status: "in_progress", startedAt: "2026-04-17T08:20:00" },
  { id: "CON-005", patientId: "PT-014", patientName: "Esi Gyamfi", doctorId: "DR-002", doctorName: "Dr. Kofi Asare", diagnosis: "Contact Dermatitis", secondaryDiagnosis: [],
    soapNotes: { subjective: "Itchy rash on both arms for 1 week, started after new soap.", objective: "Erythematous papular rash bilateral forearms.", assessment: "Contact dermatitis, likely soap allergy.", plan: "Topical hydrocortisone, avoid irritant." },
    prescriptions: [{ drug: "Hydrocortisone Cream 1%", dosage: "Apply BD", duration: "7 days", quantity: 1 }],
    labOrders: [], referrals: [], status: "completed", startedAt: "2026-04-17T09:15:00", completedAt: "2026-04-17T09:35:00" },
  { id: "CON-006", patientId: "PT-006", patientName: "Abena Frimpong", doctorId: "DR-005", doctorName: "Dr. Nana Agyemang", diagnosis: "Type 2 Diabetes Mellitus", secondaryDiagnosis: ["Dyslipidemia"],
    soapNotes: { subjective: "Follow-up visit. Reports good compliance, occasional dizziness.", objective: "FBS 7.2mmol/L, BP 128/82, weight stable.", assessment: "DM T2 fairly controlled, adjust metformin.", plan: "Continue metformin, recheck HbA1c in 3 months." },
    prescriptions: [{ drug: "Metformin 500mg", dosage: "1 tab BD", duration: "90 days", quantity: 180 }],
    labOrders: [{ testName: "Blood Sugar", category: "Biochemistry", urgent: false }],
    referrals: [], status: "completed", startedAt: "2026-04-17T09:40:00", completedAt: "2026-04-17T10:00:00" },
  { id: "CON-007", patientId: "PT-009", patientName: "Nana Adjei", doctorId: "DR-003", doctorName: "Dr. Kwaku Mensah", diagnosis: "Deep Laceration — Left Forearm", secondaryDiagnosis: [],
    soapNotes: { subjective: "Cut forearm on metal sheet 1 hour ago. Profuse bleeding.", objective: "5cm deep laceration, no tendon involvement, distal pulses intact.", assessment: "Deep lac requiring suturing under local anaesthesia.", plan: "Wound toilet, suture, tetanus booster, antibiotics." },
    prescriptions: [{ drug: "Amoxicillin 250mg", dosage: "1 cap TDS", duration: "7 days", quantity: 21 }],
    labOrders: [], referrals: [], status: "in_progress", startedAt: "2026-04-17T07:48:00" },
  { id: "CON-008", patientId: "PT-004", patientName: "Akua Darko", doctorId: "DR-001", doctorName: "Dr. Ama Owusu", diagnosis: "Mechanical Low Back Pain", secondaryDiagnosis: [],
    soapNotes: { subjective: "Lower back pain for 2 weeks, no radiation, worse with sitting.", objective: "Paraspinal tenderness L4-L5, no neurological deficit.", assessment: "Mechanical LBP, no red flags.", plan: "NSAIDs, physiotherapy, ergonomic advice." },
    prescriptions: [{ drug: "Paracetamol 500mg", dosage: "2 tabs TDS", duration: "5 days", quantity: 30 }],
    labOrders: [], referrals: [], status: "completed", startedAt: "2026-04-17T07:55:00", completedAt: "2026-04-17T08:10:00" },
]

/* ───── Health — Prescriptions ───── */

export interface MockPrescription {
  id: string
  patientId: string
  patientName: string
  doctorName: string
  drug: string
  dosage: string
  duration: string
  quantity: number
  status: "pending" | "dispensed" | "out_of_stock"
  dispensedBy?: string
  dispensedAt?: string
}

export const MOCK_PRESCRIPTIONS: MockPrescription[] = [
  { id: "RX-001", patientId: "PT-001", patientName: "Kwame Asante",    doctorName: "Dr. Ama Owusu",     drug: "Artemether-Lumefantrine",  dosage: "4 tabs BD",     duration: "3 days",  quantity: 24, status: "pending" },
  { id: "RX-002", patientId: "PT-001", patientName: "Kwame Asante",    doctorName: "Dr. Ama Owusu",     drug: "Paracetamol 500mg",        dosage: "2 tabs TDS",    duration: "3 days",  quantity: 18, status: "pending" },
  { id: "RX-003", patientId: "PT-005", patientName: "Yaw Osei",        doctorName: "Dr. Kwaku Mensah",  drug: "Aspirin",                  dosage: "300mg stat",    duration: "1 dose",  quantity: 1,  status: "dispensed", dispensedBy: "Pharm. Mensah", dispensedAt: "2026-04-17T07:25:00" },
  { id: "RX-004", patientId: "PT-012", patientName: "Akosua Badu",     doctorName: "Dr. Kofi Asare",    drug: "Paracetamol 500mg",        dosage: "2 tabs TDS",    duration: "5 days",  quantity: 30, status: "dispensed", dispensedBy: "Pharm. Mensah", dispensedAt: "2026-04-17T09:00:00" },
  { id: "RX-005", patientId: "PT-003", patientName: "Kofi Boateng",    doctorName: "Dr. Ama Owusu",     drug: "Omeprazole 20mg",          dosage: "1 cap daily",   duration: "14 days", quantity: 14, status: "pending" },
  { id: "RX-006", patientId: "PT-014", patientName: "Esi Gyamfi",      doctorName: "Dr. Kofi Asare",    drug: "Hydrocortisone Cream 1%",  dosage: "Apply BD",      duration: "7 days",  quantity: 1,  status: "dispensed", dispensedBy: "Pharm. Addai", dispensedAt: "2026-04-17T09:40:00" },
  { id: "RX-007", patientId: "PT-006", patientName: "Abena Frimpong",  doctorName: "Dr. Nana Agyemang", drug: "Metformin 500mg",          dosage: "1 tab BD",      duration: "90 days", quantity: 180, status: "pending" },
  { id: "RX-008", patientId: "PT-009", patientName: "Nana Adjei",      doctorName: "Dr. Kwaku Mensah",  drug: "Amoxicillin 250mg",        dosage: "1 cap TDS",     duration: "7 days",  quantity: 21, status: "pending" },
  { id: "RX-009", patientId: "PT-004", patientName: "Akua Darko",      doctorName: "Dr. Ama Owusu",     drug: "Paracetamol 500mg",        dosage: "2 tabs TDS",    duration: "5 days",  quantity: 30, status: "dispensed", dispensedBy: "Pharm. Mensah", dispensedAt: "2026-04-17T08:15:00" },
  { id: "RX-010", patientId: "PT-008", patientName: "Efua Amoah",      doctorName: "Dr. Ama Owusu",     drug: "Omeprazole 20mg",          dosage: "1 cap BD",      duration: "7 days",  quantity: 14, status: "pending" },
  { id: "RX-011", patientId: "PT-010", patientName: "Adwoa Owusu",     doctorName: "Dr. Kofi Asare",    drug: "Paracetamol Syrup",        dosage: "10ml TDS",      duration: "3 days",  quantity: 1,  status: "out_of_stock" },
  { id: "RX-012", patientId: "PT-018", patientName: "Maame Serwaa",    doctorName: "Dr. Ama Owusu",     drug: "Metformin 500mg",          dosage: "1 tab daily",   duration: "30 days", quantity: 30, status: "pending" },
  { id: "RX-013", patientId: "PT-019", patientName: "Yaa Asantewaa",   doctorName: "Dr. Kofi Asare",    drug: "Amoxicillin 250mg",        dosage: "1 cap TDS",     duration: "5 days",  quantity: 15, status: "pending" },
  { id: "RX-014", patientId: "PT-013", patientName: "Kwabena Fosu",    doctorName: "Dr. Nana Agyemang", drug: "Omeprazole 20mg",          dosage: "1 cap daily",   duration: "30 days", quantity: 30, status: "out_of_stock" },
  { id: "RX-015", patientId: "PT-017", patientName: "Papa Ankrah",     doctorName: "Dr. Ama Owusu",     drug: "Artemether-Lumefantrine",  dosage: "4 tabs BD",     duration: "3 days",  quantity: 24, status: "pending" },
]

/* ───── Health — Lab Orders ───── */

export interface MockLabOrder {
  id: string
  patientId: string
  patientName: string
  doctorName: string
  testName: string
  category: "Hematology" | "Biochemistry" | "Microbiology" | "Urinalysis" | "Serology"
  urgent: boolean
  status: "ordered" | "in_progress" | "completed"
  result?: string
  normalRange?: string
  abnormalFlag?: boolean
  orderedAt: string
  completedAt?: string
}

export const MOCK_LAB_ORDERS: MockLabOrder[] = [
  { id: "LB-001", patientId: "PT-001", patientName: "Kwame Asante",  doctorName: "Dr. Ama Owusu",     testName: "Malaria RDT",       category: "Serology",     urgent: true,  status: "in_progress", orderedAt: "2026-04-17T08:20:00" },
  { id: "LB-002", patientId: "PT-001", patientName: "Kwame Asante",  doctorName: "Dr. Ama Owusu",     testName: "Full Blood Count",  category: "Hematology",   urgent: false, status: "ordered",     orderedAt: "2026-04-17T08:20:00" },
  { id: "LB-003", patientId: "PT-005", patientName: "Yaw Osei",      doctorName: "Dr. Kwaku Mensah",  testName: "Full Blood Count",  category: "Hematology",   urgent: true,  status: "completed",   result: "WBC 12.4, RBC 4.2, Hb 13.1, Plt 240", normalRange: "WBC 4-11, Hb 12-17", abnormalFlag: true, orderedAt: "2026-04-17T07:25:00", completedAt: "2026-04-17T08:00:00" },
  { id: "LB-004", patientId: "PT-005", patientName: "Yaw Osei",      doctorName: "Dr. Kwaku Mensah",  testName: "Blood Sugar",       category: "Biochemistry", urgent: true,  status: "completed",   result: "6.8 mmol/L", normalRange: "3.9-5.5 mmol/L", abnormalFlag: true, orderedAt: "2026-04-17T07:25:00", completedAt: "2026-04-17T07:55:00" },
  { id: "LB-005", patientId: "PT-012", patientName: "Akosua Badu",   doctorName: "Dr. Kofi Asare",    testName: "Full Blood Count",  category: "Hematology",   urgent: false, status: "completed",   result: "WBC 8.2, RBC 4.6, Hb 12.8, Plt 280", normalRange: "WBC 4-11, Hb 12-17", abnormalFlag: false, orderedAt: "2026-04-17T08:35:00", completedAt: "2026-04-17T09:10:00" },
  { id: "LB-006", patientId: "PT-006", patientName: "Abena Frimpong",doctorName: "Dr. Nana Agyemang", testName: "Blood Sugar",       category: "Biochemistry", urgent: false, status: "completed",   result: "7.2 mmol/L", normalRange: "3.9-5.5 mmol/L", abnormalFlag: true, orderedAt: "2026-04-17T09:45:00", completedAt: "2026-04-17T10:15:00" },
  { id: "LB-007", patientId: "PT-003", patientName: "Kofi Boateng",  doctorName: "Dr. Ama Owusu",     testName: "Urinalysis",        category: "Urinalysis",   urgent: false, status: "ordered",     orderedAt: "2026-04-17T08:30:00" },
  { id: "LB-008", patientId: "PT-008", patientName: "Efua Amoah",    doctorName: "Dr. Ama Owusu",     testName: "Liver Function",    category: "Biochemistry", urgent: false, status: "ordered",     orderedAt: "2026-04-17T09:00:00" },
  { id: "LB-009", patientId: "PT-018", patientName: "Maame Serwaa",  doctorName: "Dr. Ama Owusu",     testName: "Full Blood Count",  category: "Hematology",   urgent: false, status: "ordered",     orderedAt: "2026-04-17T09:55:00" },
  { id: "LB-010", patientId: "PT-017", patientName: "Papa Ankrah",   doctorName: "Dr. Ama Owusu",     testName: "Malaria RDT",       category: "Serology",     urgent: true,  status: "in_progress", orderedAt: "2026-04-17T10:05:00" },
]

/* ───── Health — Vitals ───── */

export interface MockVitals {
  id: string
  patientId: string
  patientName: string
  temperature: number
  bpSystolic: number
  bpDiastolic: number
  pulse: number
  respiratoryRate: number
  spO2: number
  weight: number
  height: number
  bmi: number
  abnormalFlags: string[]
  recordedBy: string
  recordedAt: string
}

export const MOCK_VITALS: MockVitals[] = [
  { id: "VT-001", patientId: "PT-001", patientName: "Kwame Asante",    temperature: 38.8, bpSystolic: 130, bpDiastolic: 85, pulse: 92, respiratoryRate: 20, spO2: 97, weight: 78, height: 175, bmi: 25.5, abnormalFlags: ["Temp High"], recordedBy: "Nurse Adwoa", recordedAt: "2026-04-17T08:05:00" },
  { id: "VT-002", patientId: "PT-005", patientName: "Yaw Osei",        temperature: 37.2, bpSystolic: 180, bpDiastolic: 110, pulse: 102, respiratoryRate: 24, spO2: 94, weight: 85, height: 170, bmi: 29.4, abnormalFlags: ["BP High", "SpO2 Low", "Pulse High", "RR High"], recordedBy: "Nurse Adwoa", recordedAt: "2026-04-17T07:18:00" },
  { id: "VT-003", patientId: "PT-012", patientName: "Akosua Badu",     temperature: 37.0, bpSystolic: 118, bpDiastolic: 76, pulse: 78, respiratoryRate: 16, spO2: 99, weight: 62, height: 165, bmi: 22.8, abnormalFlags: [], recordedBy: "Nurse Konadu", recordedAt: "2026-04-17T08:28:00" },
  { id: "VT-004", patientId: "PT-003", patientName: "Kofi Boateng",    temperature: 36.8, bpSystolic: 142, bpDiastolic: 92, pulse: 80, respiratoryRate: 18, spO2: 98, weight: 95, height: 168, bmi: 33.7, abnormalFlags: ["BP High", "BMI High"], recordedBy: "Nurse Adwoa", recordedAt: "2026-04-17T08:15:00" },
  { id: "VT-005", patientId: "PT-002", patientName: "Ama Mensah",      temperature: 36.6, bpSystolic: 115, bpDiastolic: 72, pulse: 76, respiratoryRate: 16, spO2: 99, weight: 70, height: 162, bmi: 26.7, abnormalFlags: [], recordedBy: "Nurse Konadu", recordedAt: "2026-04-17T08:42:00" },
  { id: "VT-006", patientId: "PT-008", patientName: "Efua Amoah",      temperature: 37.4, bpSystolic: 125, bpDiastolic: 80, pulse: 88, respiratoryRate: 18, spO2: 98, weight: 58, height: 160, bmi: 22.7, abnormalFlags: [], recordedBy: "Nurse Adwoa", recordedAt: "2026-04-17T08:58:00" },
  { id: "VT-007", patientId: "PT-014", patientName: "Esi Gyamfi",      temperature: 36.9, bpSystolic: 110, bpDiastolic: 68, pulse: 72, respiratoryRate: 14, spO2: 99, weight: 55, height: 158, bmi: 22.0, abnormalFlags: [], recordedBy: "Nurse Konadu", recordedAt: "2026-04-17T09:12:00" },
  { id: "VT-008", patientId: "PT-010", patientName: "Adwoa Owusu",     temperature: 39.1, bpSystolic: 100, bpDiastolic: 65, pulse: 110, respiratoryRate: 22, spO2: 96, weight: 15, height: 95, bmi: 16.6, abnormalFlags: ["Temp High", "Pulse High", "RR High"], recordedBy: "Nurse Adwoa", recordedAt: "2026-04-17T09:25:00" },
  { id: "VT-009", patientId: "PT-006", patientName: "Abena Frimpong",  temperature: 36.5, bpSystolic: 128, bpDiastolic: 82, pulse: 74, respiratoryRate: 16, spO2: 98, weight: 68, height: 164, bmi: 25.3, abnormalFlags: [], recordedBy: "Nurse Konadu", recordedAt: "2026-04-17T09:38:00" },
  { id: "VT-010", patientId: "PT-009", patientName: "Nana Adjei",      temperature: 37.0, bpSystolic: 155, bpDiastolic: 95, pulse: 84, respiratoryRate: 18, spO2: 97, weight: 72, height: 172, bmi: 24.3, abnormalFlags: ["BP High"], recordedBy: "Nurse Adwoa", recordedAt: "2026-04-17T07:45:00" },
]

/* ───── Health — Ward Patients ───── */

export interface MockWardPatient {
  id: string
  patientId: string
  patientName: string
  ward: "General" | "Surgical" | "Pediatric" | "Maternity"
  bed: string
  admittedAt: string
  diagnosis: string
  dailyRounds: { date: string; notes: string; vitals: string; recordedBy: string }[]
  status: "admitted" | "discharged" | "transferred"
  dayCount: number
}

export const MOCK_WARD_PATIENTS: MockWardPatient[] = [
  { id: "WP-001", patientId: "PT-007", patientName: "Kwesi Tetteh",  ward: "Surgical",  bed: "S-04", admittedAt: "2026-04-14", diagnosis: "Post-appendectomy recovery", dailyRounds: [
    { date: "2026-04-15", notes: "Wound clean, minimal drainage. Tolerating fluids.", vitals: "T:36.8 BP:125/80 P:78", recordedBy: "Dr. Kwaku Mensah" },
    { date: "2026-04-16", notes: "Ambulating well. Soft diet started.", vitals: "T:36.6 BP:120/78 P:74", recordedBy: "Dr. Kwaku Mensah" },
    { date: "2026-04-17", notes: "Ready for discharge. Suture removal in 7 days.", vitals: "T:36.5 BP:118/76 P:72", recordedBy: "Dr. Kwaku Mensah" },
  ], status: "admitted", dayCount: 3 },
  { id: "WP-002", patientId: "PT-015", patientName: "Fiifi Mensah",  ward: "General",   bed: "G-12", admittedAt: "2026-04-12", diagnosis: "Pneumonia with dehydration", dailyRounds: [
    { date: "2026-04-13", notes: "IV antibiotics ongoing. Oxygen 2L/min.", vitals: "T:38.2 BP:135/88 P:96 SpO2:93%", recordedBy: "Dr. Nana Agyemang" },
    { date: "2026-04-14", notes: "Improving. Cough productive. SpO2 rising.", vitals: "T:37.6 BP:130/82 P:88 SpO2:95%", recordedBy: "Dr. Nana Agyemang" },
    { date: "2026-04-15", notes: "Off oxygen. Tolerating oral meds. Continue obs.", vitals: "T:37.0 BP:128/80 P:80 SpO2:97%", recordedBy: "Dr. Nana Agyemang" },
    { date: "2026-04-16", notes: "Clinically improved. Plan discharge tomorrow.", vitals: "T:36.8 BP:125/78 P:76 SpO2:98%", recordedBy: "Dr. Nana Agyemang" },
    { date: "2026-04-17", notes: "Discharged with oral antibiotics.", vitals: "T:36.6 BP:122/76 P:74 SpO2:99%", recordedBy: "Dr. Nana Agyemang" },
  ], status: "discharged", dayCount: 5 },
  { id: "WP-003", patientId: "PT-019", patientName: "Yaa Asantewaa", ward: "Pediatric", bed: "P-02", admittedAt: "2026-04-16", diagnosis: "Severe malaria with anaemia", dailyRounds: [
    { date: "2026-04-16", notes: "IV artesunate started. Blood transfusion ordered.", vitals: "T:39.5 BP:90/60 P:120 Hb:6.2", recordedBy: "Dr. Kofi Asare" },
    { date: "2026-04-17", notes: "Fever down. Hb post-transfusion 9.1. Continue IV.", vitals: "T:37.8 BP:100/65 P:98 Hb:9.1", recordedBy: "Dr. Kofi Asare" },
  ], status: "admitted", dayCount: 1 },
  { id: "WP-004", patientId: "PT-016", patientName: "Araba Quaye",   ward: "Maternity", bed: "M-06", admittedAt: "2026-04-16", diagnosis: "Spontaneous vaginal delivery", dailyRounds: [
    { date: "2026-04-16", notes: "Delivered healthy baby girl 3.2kg. Apgar 8/9.", vitals: "T:37.0 BP:115/72 P:80", recordedBy: "Dr. Abena Sarpong" },
    { date: "2026-04-17", notes: "Mother and baby well. Breastfeeding established.", vitals: "T:36.8 BP:112/70 P:76", recordedBy: "Dr. Abena Sarpong" },
  ], status: "admitted", dayCount: 1 },
  { id: "WP-005", patientId: "PT-013", patientName: "Kwabena Fosu",  ward: "General",   bed: "G-08", admittedAt: "2026-04-15", diagnosis: "Diabetic ketoacidosis", dailyRounds: [
    { date: "2026-04-15", notes: "IV insulin infusion started. Fluid resuscitation.", vitals: "T:37.4 BP:110/70 P:100 BS:22mmol", recordedBy: "Dr. Nana Agyemang" },
    { date: "2026-04-16", notes: "BS trending down. Switched to SC insulin.", vitals: "T:36.8 BP:118/74 P:84 BS:12mmol", recordedBy: "Dr. Nana Agyemang" },
    { date: "2026-04-17", notes: "Stable. Plan transition to oral meds.", vitals: "T:36.6 BP:120/76 P:78 BS:8mmol", recordedBy: "Dr. Nana Agyemang" },
  ], status: "admitted", dayCount: 2 },
]

/* ───── Health — Billing Items ───── */

export interface MockBillingItem {
  id: string
  patientId: string
  patientName: string
  serviceType: "CONSULTATION" | "LAB" | "IMAGING" | "DRUG" | "WARD_DAY" | "PROCEDURE" | "EMERGENCY" | "ICU_DAY"
  description: string
  amount: number
  status: "unbilled" | "billed" | "paid" | "waived"
  billedAt?: string
  paidAt?: string
  paymentMethod?: "Cash" | "MoMo" | "NHIS" | "Insurance" | "Waived"
}

export const MOCK_BILLING_ITEMS: MockBillingItem[] = [
  { id: "BI-001", patientId: "PT-001", patientName: "Kwame Asante",    serviceType: "CONSULTATION", description: "General Consultation",         amount: 5000,  status: "billed",   billedAt: "2026-04-17T08:15:00" },
  { id: "BI-002", patientId: "PT-001", patientName: "Kwame Asante",    serviceType: "LAB",          description: "Malaria RDT",                  amount: 1500,  status: "unbilled" },
  { id: "BI-003", patientId: "PT-001", patientName: "Kwame Asante",    serviceType: "LAB",          description: "Full Blood Count",              amount: 2500,  status: "unbilled" },
  { id: "BI-004", patientId: "PT-001", patientName: "Kwame Asante",    serviceType: "DRUG",         description: "Artemether-Lumefantrine × 24", amount: 3600,  status: "unbilled" },
  { id: "BI-005", patientId: "PT-005", patientName: "Yaw Osei",        serviceType: "EMERGENCY",    description: "Emergency Consultation",        amount: 15000, status: "billed",   billedAt: "2026-04-17T07:20:00" },
  { id: "BI-006", patientId: "PT-005", patientName: "Yaw Osei",        serviceType: "LAB",          description: "FBC + Blood Sugar (Urgent)",    amount: 4000,  status: "paid",     billedAt: "2026-04-17T07:25:00", paidAt: "2026-04-17T08:10:00", paymentMethod: "Insurance" },
  { id: "BI-007", patientId: "PT-012", patientName: "Akosua Badu",     serviceType: "CONSULTATION", description: "General Consultation",          amount: 5000,  status: "paid",     billedAt: "2026-04-17T08:30:00", paidAt: "2026-04-17T08:32:00", paymentMethod: "NHIS" },
  { id: "BI-008", patientId: "PT-012", patientName: "Akosua Badu",     serviceType: "LAB",          description: "Full Blood Count",              amount: 2500,  status: "paid",     billedAt: "2026-04-17T08:35:00", paidAt: "2026-04-17T09:12:00", paymentMethod: "NHIS" },
  { id: "BI-009", patientId: "PT-003", patientName: "Kofi Boateng",    serviceType: "CONSULTATION", description: "General Consultation",          amount: 5000,  status: "paid",     billedAt: "2026-04-17T08:20:00", paidAt: "2026-04-17T08:22:00", paymentMethod: "Cash" },
  { id: "BI-010", patientId: "PT-014", patientName: "Esi Gyamfi",      serviceType: "CONSULTATION", description: "General Consultation",          amount: 5000,  status: "paid",     billedAt: "2026-04-17T09:15:00", paidAt: "2026-04-17T09:16:00", paymentMethod: "MoMo" },
  { id: "BI-011", patientId: "PT-014", patientName: "Esi Gyamfi",      serviceType: "DRUG",         description: "Hydrocortisone Cream 1%",      amount: 1500,  status: "paid",     billedAt: "2026-04-17T09:40:00", paidAt: "2026-04-17T09:42:00", paymentMethod: "MoMo" },
  { id: "BI-012", patientId: "PT-006", patientName: "Abena Frimpong",  serviceType: "CONSULTATION", description: "Specialist Consultation",       amount: 8000,  status: "paid",     billedAt: "2026-04-17T09:40:00", paidAt: "2026-04-17T10:02:00", paymentMethod: "Insurance" },
  { id: "BI-013", patientId: "PT-006", patientName: "Abena Frimpong",  serviceType: "LAB",          description: "Blood Sugar",                  amount: 1500,  status: "paid",     billedAt: "2026-04-17T09:45:00", paidAt: "2026-04-17T10:20:00", paymentMethod: "Insurance" },
  { id: "BI-014", patientId: "PT-004", patientName: "Akua Darko",      serviceType: "CONSULTATION", description: "General Consultation",          amount: 5000,  status: "paid",     billedAt: "2026-04-17T07:55:00", paidAt: "2026-04-17T08:00:00", paymentMethod: "Cash" },
  { id: "BI-015", patientId: "PT-007", patientName: "Kwesi Tetteh",    serviceType: "WARD_DAY",     description: "Surgical Ward × 3 days",       amount: 30000, status: "billed",   billedAt: "2026-04-17T09:00:00" },
  { id: "BI-016", patientId: "PT-015", patientName: "Fiifi Mensah",    serviceType: "WARD_DAY",     description: "General Ward × 5 days",        amount: 50000, status: "paid",     billedAt: "2026-04-17T07:00:00", paidAt: "2026-04-17T08:30:00", paymentMethod: "NHIS" },
  { id: "BI-017", patientId: "PT-019", patientName: "Yaa Asantewaa",   serviceType: "WARD_DAY",     description: "Pediatric Ward × 1 day",       amount: 10000, status: "unbilled" },
  { id: "BI-018", patientId: "PT-009", patientName: "Nana Adjei",      serviceType: "PROCEDURE",    description: "Wound Suturing",               amount: 8000,  status: "unbilled" },
  { id: "BI-019", patientId: "PT-016", patientName: "Araba Quaye",     serviceType: "PROCEDURE",    description: "Normal Delivery",               amount: 20000, status: "waived",   billedAt: "2026-04-16T18:00:00", paymentMethod: "Waived" },
  { id: "BI-020", patientId: "PT-013", patientName: "Kwabena Fosu",    serviceType: "ICU_DAY",      description: "ICU × 2 days",                 amount: 100000, status: "billed",  billedAt: "2026-04-17T08:00:00" },
]

/* ───── Health — Injection Orders ───── */

export interface MockInjectionOrder {
  id: string
  patientId: string
  patientName: string
  doctorName: string
  medication: string
  dosage: string
  route: "IM" | "IV" | "SC"
  status: "pending" | "in_progress" | "completed"
  orderedAt: string
  completedAt?: string
  administeredBy?: string
}

export const MOCK_INJECTION_ORDERS: MockInjectionOrder[] = [
  { id: "INJ-001", patientId: "PT-005", patientName: "Yaw Osei",       doctorName: "Dr. Kwaku Mensah",  medication: "Morphine 10mg",        dosage: "10mg",   route: "IV", status: "completed",   orderedAt: "2026-04-17T07:22:00", completedAt: "2026-04-17T07:28:00", administeredBy: "Nurse Adwoa" },
  { id: "INJ-002", patientId: "PT-007", patientName: "Kwesi Tetteh",   doctorName: "Dr. Kwaku Mensah",  medication: "Ceftriaxone 1g",       dosage: "1g",     route: "IV", status: "completed",   orderedAt: "2026-04-17T08:00:00", completedAt: "2026-04-17T08:15:00", administeredBy: "Nurse Konadu" },
  { id: "INJ-003", patientId: "PT-019", patientName: "Yaa Asantewaa",  doctorName: "Dr. Kofi Asare",    medication: "IV Artesunate 60mg",   dosage: "60mg",   route: "IV", status: "in_progress", orderedAt: "2026-04-17T09:00:00" },
  { id: "INJ-004", patientId: "PT-009", patientName: "Nana Adjei",     doctorName: "Dr. Kwaku Mensah",  medication: "Tetanus Toxoid 0.5ml", dosage: "0.5ml",  route: "IM", status: "pending",     orderedAt: "2026-04-17T07:50:00" },
  { id: "INJ-005", patientId: "PT-013", patientName: "Kwabena Fosu",   doctorName: "Dr. Nana Agyemang", medication: "Insulin Glargine",      dosage: "20 IU",  route: "SC", status: "completed",   orderedAt: "2026-04-17T08:30:00", completedAt: "2026-04-17T08:40:00", administeredBy: "Nurse Adwoa" },
]

/* ───── Health — Audit ───── */

export interface MockHealthAudit {
  id: string
  actor: string
  actorRole: string
  action: string
  target: string
  details: string
  severity: "info" | "warn" | "critical"
  timestamp: string
}

export const MOCK_HEALTH_AUDIT: MockHealthAudit[] = [
  { id: "HA-001", actor: "Dr. Ama Owusu",     actorRole: "Doctor",      action: "consultation_start",  target: "PT-001", details: "Started consultation for Kwame Asante",              severity: "info",     timestamp: "2026-04-17T08:15:00" },
  { id: "HA-002", actor: "Dr. Kwaku Mensah",   actorRole: "Doctor",      action: "emergency_admit",     target: "PT-005", details: "Emergency admission — chest pain, STEMI suspected",   severity: "critical", timestamp: "2026-04-17T07:18:00" },
  { id: "HA-003", actor: "Nurse Adwoa",        actorRole: "Nurse",       action: "vitals_recorded",     target: "PT-005", details: "Abnormal vitals flagged: BP 180/110, SpO2 94%",       severity: "warn",     timestamp: "2026-04-17T07:18:00" },
  { id: "HA-004", actor: "Pharm. Mensah",      actorRole: "Pharmacist",  action: "drug_dispensed",      target: "RX-003", details: "Aspirin 300mg stat dispensed to Yaw Osei",            severity: "info",     timestamp: "2026-04-17T07:25:00" },
  { id: "HA-005", actor: "Lab Tech Ofori",     actorRole: "Lab Tech",    action: "result_entered",      target: "LB-003", details: "FBC result: WBC 12.4 (abnormal)",                     severity: "warn",     timestamp: "2026-04-17T08:00:00" },
  { id: "HA-006", actor: "Dr. Kofi Asare",     actorRole: "Doctor",      action: "consultation_close",  target: "PT-012", details: "Completed consultation — URTI diagnosed",             severity: "info",     timestamp: "2026-04-17T08:55:00" },
  { id: "HA-007", actor: "Billing Clerk",      actorRole: "Billing",     action: "payment_received",    target: "BI-007", details: "NHIS payment GHS 50.00 for Akosua Badu",             severity: "info",     timestamp: "2026-04-17T08:32:00" },
  { id: "HA-008", actor: "Dr. Nana Agyemang",  actorRole: "Doctor",      action: "prescription_sent",   target: "PT-006", details: "Metformin 500mg × 180 sent to pharmacy",             severity: "info",     timestamp: "2026-04-17T10:00:00" },
  { id: "HA-009", actor: "Nurse Konadu",       actorRole: "Nurse",       action: "injection_admin",     target: "INJ-002", details: "Ceftriaxone 1g IV administered to Kwesi Tetteh",     severity: "info",     timestamp: "2026-04-17T08:15:00" },
  { id: "HA-010", actor: "Dr. Abena Sarpong",  actorRole: "Doctor",      action: "delivery_recorded",   target: "PT-016", details: "SVD — baby girl 3.2kg, Apgar 8/9",                   severity: "info",     timestamp: "2026-04-16T18:00:00" },
]

/* ───── Health — SOAP Templates ───── */

export interface MockSoapTemplate {
  id: string
  name: string
  diagnosis: string
  notes: { subjective: string; objective: string; assessment: string; plan: string }
  suggestedLabs: string[]
  prescriptions: { drug: string; dosage: string; duration: string }[]
}

export const MOCK_SOAP_TEMPLATES: MockSoapTemplate[] = [
  { id: "TPL-001", name: "Malaria",        diagnosis: "Malaria (uncomplicated)", notes: { subjective: "Fever, chills, body aches, headache. Onset [X] days ago.", objective: "Temp elevated, mild pallor, no jaundice.", assessment: "Clinical malaria. Rule out co-infection.", plan: "Malaria RDT/smear, FBC. Start ACT if positive." }, suggestedLabs: ["Malaria RDT", "Full Blood Count"], prescriptions: [{ drug: "Artemether-Lumefantrine", dosage: "4 tabs BD", duration: "3 days" }, { drug: "Paracetamol 500mg", dosage: "2 tabs TDS", duration: "3 days" }] },
  { id: "TPL-002", name: "Hypertension",   diagnosis: "Essential Hypertension",  notes: { subjective: "Headache, occasional dizziness. Known hypertensive.", objective: "BP [X/Y], no papilledema, no focal deficit.", assessment: "Uncontrolled hypertension. Review medication.", plan: "Adjust antihypertensive. Lifestyle counseling. Follow-up 2 weeks." }, suggestedLabs: ["Blood Sugar", "Liver Function"], prescriptions: [{ drug: "Amlodipine 5mg", dosage: "1 tab daily", duration: "30 days" }] },
  { id: "TPL-003", name: "Diabetes T2",    diagnosis: "Type 2 Diabetes Mellitus", notes: { subjective: "Polyuria, polydipsia, weight changes. Known DM.", objective: "FBS [X] mmol/L, BMI [Y].", assessment: "DM T2 — assess control, complications.", plan: "Check HbA1c, renal function. Adjust metformin." }, suggestedLabs: ["Blood Sugar"], prescriptions: [{ drug: "Metformin 500mg", dosage: "1 tab BD", duration: "90 days" }] },
  { id: "TPL-004", name: "UTI",            diagnosis: "Urinary Tract Infection", notes: { subjective: "Dysuria, frequency, suprapubic pain. Onset [X] days.", objective: "Suprapubic tenderness, no flank pain.", assessment: "Lower UTI. Rule out upper tract involvement.", plan: "Urinalysis, urine C&S. Start empiric antibiotics." }, suggestedLabs: ["Urinalysis"], prescriptions: [{ drug: "Amoxicillin 250mg", dosage: "1 cap TDS", duration: "7 days" }] },
  { id: "TPL-005", name: "Pneumonia",      diagnosis: "Community-Acquired Pneumonia", notes: { subjective: "Productive cough, fever, chest pain, dyspnea.", objective: "Crackles [location], dull percussion. Temp [X]°C.", assessment: "CAP — moderate severity.", plan: "Chest X-ray, FBC, sputum C&S. Start antibiotics." }, suggestedLabs: ["Full Blood Count"], prescriptions: [{ drug: "Amoxicillin 250mg", dosage: "1 cap TDS", duration: "7 days" }, { drug: "Paracetamol 500mg", dosage: "2 tabs TDS", duration: "5 days" }] },
  { id: "TPL-006", name: "Gastroenteritis", diagnosis: "Acute Gastroenteritis", notes: { subjective: "Watery stools [X] times, vomiting, abdominal cramps.", objective: "Mild dehydration, abdomen soft, BS hyperactive.", assessment: "AGE — likely viral. Assess hydration.", plan: "ORS, zinc (if pediatric). Reassess if bloody stool." }, suggestedLabs: [], prescriptions: [{ drug: "ORS Sachets", dosage: "As directed", duration: "3 days" }] },
  { id: "TPL-007", name: "ANC Routine",    diagnosis: "Routine Antenatal Visit", notes: { subjective: "Routine ANC visit. GA [X] weeks. No complaints.", objective: "FH [X]cm, FHR [X]bpm, BP [X/Y], urine protein neg.", assessment: "Normal pregnancy progress.", plan: "Continue iron/folate. Next visit [date]. Ultrasound if due." }, suggestedLabs: ["Urinalysis", "Full Blood Count"], prescriptions: [{ drug: "Ferrous Sulphate + Folic Acid", dosage: "1 tab daily", duration: "30 days" }] },
  { id: "TPL-008", name: "Asthma",         diagnosis: "Bronchial Asthma",       notes: { subjective: "Wheeze, cough, chest tightness. Triggers: [X].", objective: "Bilateral wheeze, no crackles. RR [X], SpO2 [X]%.", assessment: "Acute exacerbation / chronic asthma.", plan: "Salbutamol nebulization. Review inhaler technique." }, suggestedLabs: [], prescriptions: [{ drug: "Salbutamol Inhaler", dosage: "2 puffs PRN", duration: "30 days" }] },
  { id: "TPL-009", name: "Typhoid",        diagnosis: "Typhoid Fever",           notes: { subjective: "Step-ladder fever, headache, constipation/diarrhea.", objective: "Temp [X]°C, coated tongue, hepatosplenomegaly.", assessment: "Suspected typhoid. Confirm with Widal/culture.", plan: "Blood culture, Widal test, FBC. Start antibiotics." }, suggestedLabs: ["Full Blood Count"], prescriptions: [{ drug: "Amoxicillin 250mg", dosage: "1 cap TDS", duration: "14 days" }, { drug: "Paracetamol 500mg", dosage: "2 tabs TDS", duration: "5 days" }] },
]

/* ═══════════════════════════════════════════════════════════════
   INSTITUTE MOCK DATA
   ═══════════════════════════════════════════════════════════════ */

export type InstModuleGroup = "Enrollment" | "Academics" | "Finance" | "Operations" | "Admin"

export interface InstModuleDef {
  slug: string
  title: string
  group: InstModuleGroup
  status: ModuleStatus
  blurb: string
  href: string
}

export const INSTITUTE_MODULES: InstModuleDef[] = [
  { slug: "enrollment",    group: "Enrollment",  status: "live",    title: "Enrollment",       blurb: "Student registration, guardians, groups",          href: "/modules/enrollment" },
  { slug: "groups",        group: "Enrollment",  status: "live",    title: "Groups / Classes", blurb: "Class management, teacher assignment",              href: "/modules/groups" },
  { slug: "subjects",      group: "Academics",   status: "live",    title: "Subjects",         blurb: "Subject catalog, teacher mapping",                  href: "/modules/subjects" },
  { slug: "exams",         group: "Academics",   status: "live",    title: "Exams",            blurb: "Exam scheduling, grading, analytics",               href: "/modules/exams" },
  { slug: "gradebook",     group: "Academics",   status: "live",    title: "Gradebook",        blurb: "Grades overview, report cards",                     href: "/modules/gradebook" },
  { slug: "attendance",    group: "Academics",   status: "live",    title: "Attendance",        blurb: "Daily attendance, trends, alerts",                 href: "/modules/attendance" },
  { slug: "fees",          group: "Finance",     status: "live",    title: "Fees",             blurb: "Fee management, billing, outstanding",              href: "/modules/fees" },
  { slug: "payments",      group: "Finance",     status: "live",    title: "Payments",         blurb: "Payment ledger, receipts, reconciliation",          href: "/modules/payments" },
  { slug: "schedule",      group: "Operations",  status: "live",    title: "Timetable",        blurb: "Weekly schedule, room allocation",                  href: "/modules/schedule" },
  { slug: "calendar",      group: "Operations",  status: "live",    title: "Calendar",         blurb: "Academic calendar, events, holidays",               href: "/modules/calendar" },
  { slug: "communication", group: "Operations",  status: "live",    title: "Communication",    blurb: "Notices, SMS, circulars to parents",                href: "/modules/communication" },
  { slug: "staff",         group: "Admin",       status: "live",    title: "Staff",            blurb: "Staff directory, roles, assignments",               href: "/modules/staff" },
]

/* ───── Institute Catalogue ───── */

export const MOCK_INST_CATALOGUE: MockServiceItem[] = [
  { id: "IC-001", name: "Tuition Term 1",       categoryId: "tuition",    behaviour: "recurring",     stockType: "service",  costPrice: 0,     sellingPrice: 150000, stock: 0,  minStock: 0, recurringInterval: "termly", unit: "term",  taxable: false, isActive: true },
  { id: "IC-002", name: "Tuition Term 2",       categoryId: "tuition",    behaviour: "recurring",     stockType: "service",  costPrice: 0,     sellingPrice: 150000, stock: 0,  minStock: 0, recurringInterval: "termly", unit: "term",  taxable: false, isActive: true },
  { id: "IC-003", name: "Tuition Term 3",       categoryId: "tuition",    behaviour: "recurring",     stockType: "service",  costPrice: 0,     sellingPrice: 150000, stock: 0,  minStock: 0, recurringInterval: "termly", unit: "term",  taxable: false, isActive: true },
  { id: "IC-004", name: "Exam Fee",             categoryId: "admin",      behaviour: "admin",         stockType: "service",  costPrice: 0,     sellingPrice: 5000,   stock: 0,  minStock: 0, unit: "exam",  taxable: false, isActive: true },
  { id: "IC-005", name: "Uniform",              categoryId: "products",   behaviour: "product",       stockType: "physical", costPrice: 8000,  sellingPrice: 15000,  stock: 50, minStock: 10, unit: "set",  taxable: false, isActive: true },
  { id: "IC-006", name: "Textbook Pack",        categoryId: "products",   behaviour: "product",       stockType: "physical", costPrice: 12000, sellingPrice: 25000,  stock: 30, minStock: 5,  unit: "pack", taxable: false, isActive: true },
  { id: "IC-007", name: "Class Seat",           categoryId: "enrollment", behaviour: "admission",     stockType: "capacity", costPrice: 0,     sellingPrice: 0,      stock: 0,  minStock: 0, capacityTotal: 35, capacityUsed: 28, unit: "seat", taxable: false, isActive: true },
  { id: "IC-008", name: "Admissions Counsel",   categoryId: "enrollment", behaviour: "consultation",  stockType: "service",  costPrice: 0,     sellingPrice: 2000,   stock: 0,  minStock: 0, unit: "session", taxable: false, isActive: true },
  { id: "IC-009", name: "Lesson Period",        categoryId: "academic",   behaviour: "procedure",     stockType: "service",  costPrice: 0,     sellingPrice: 0,      stock: 0,  minStock: 0, unit: "period", taxable: false, isActive: true },
  { id: "IC-010", name: "Report Card Fee",      categoryId: "admin",      behaviour: "admin",         stockType: "service",  costPrice: 0,     sellingPrice: 1000,   stock: 0,  minStock: 0, unit: "card",   taxable: false, isActive: true },
]

/* ───── Institute Students ───── */

export const MOCK_INST_STUDENTS: MockContact[] = [
  { id: "ST-001", name: "Kwame Mensah",     phone: "+233 24 222 0001", type: "student", status: "active",     dateOfBirth: "2015-03-12", gender: "Male",   guardianName: "Ama Mensah",     guardianPhone: "+233 24 222 0050", groupId: "GR-001", enrolledAt: "2024-09-01" },
  { id: "ST-002", name: "Akosua Boateng",   phone: "+233 20 222 0002", type: "student", status: "active",     dateOfBirth: "2015-07-22", gender: "Female", guardianName: "Kofi Boateng",   guardianPhone: "+233 20 222 0051", groupId: "GR-001", enrolledAt: "2024-09-01" },
  { id: "ST-003", name: "Yaw Darko",        phone: "+233 26 222 0003", type: "student", status: "active",     dateOfBirth: "2014-11-05", gender: "Male",   guardianName: "Akua Darko",     guardianPhone: "+233 26 222 0052", groupId: "GR-002", enrolledAt: "2023-09-01" },
  { id: "ST-004", name: "Esi Frimpong",     phone: "+233 54 222 0004", type: "student", status: "active",     dateOfBirth: "2014-01-30", gender: "Female", guardianName: "Yaw Frimpong",   guardianPhone: "+233 54 222 0053", groupId: "GR-002", enrolledAt: "2023-09-01" },
  { id: "ST-005", name: "Kofi Tetteh",      phone: "+233 27 222 0005", type: "student", status: "active",     dateOfBirth: "2013-09-14", gender: "Male",   guardianName: "Efua Tetteh",    guardianPhone: "+233 27 222 0054", groupId: "GR-003", enrolledAt: "2022-09-01" },
  { id: "ST-006", name: "Abena Amoah",      phone: "+233 50 222 0006", type: "student", status: "active",     dateOfBirth: "2013-04-18", gender: "Female", guardianName: "Nana Amoah",     guardianPhone: "+233 50 222 0055", groupId: "GR-003", enrolledAt: "2022-09-01" },
  { id: "ST-007", name: "Nana Adjei Jr",    phone: "+233 24 222 0007", type: "student", status: "active",     dateOfBirth: "2012-06-08", gender: "Male",   guardianName: "Nana Adjei Sr",  guardianPhone: "+233 24 222 0056", groupId: "GR-004", enrolledAt: "2021-09-01" },
  { id: "ST-008", name: "Adwoa Owusu",      phone: "+233 55 222 0008", type: "student", status: "inactive",   dateOfBirth: "2012-12-25", gender: "Female", guardianName: "Kojo Owusu",     guardianPhone: "+233 55 222 0057", groupId: "GR-004", enrolledAt: "2021-09-01" },
  { id: "ST-009", name: "Kojo Appiah",      phone: "+233 24 222 0009", type: "student", status: "active",     dateOfBirth: "2011-02-20", gender: "Male",   guardianName: "Akosua Appiah",  guardianPhone: "+233 24 222 0058", groupId: "GR-005", enrolledAt: "2020-09-01" },
  { id: "ST-010", name: "Akua Badu",        phone: "+233 20 222 0010", type: "student", status: "active",     dateOfBirth: "2011-08-07", gender: "Female", guardianName: "Kwabena Badu",   guardianPhone: "+233 20 222 0059", groupId: "GR-005", enrolledAt: "2020-09-01" },
  { id: "ST-011", name: "Kwabena Fosu Jr",  phone: "+233 26 222 0011", type: "student", status: "graduated",  dateOfBirth: "2010-10-15", gender: "Male",   guardianName: "Kwabena Fosu",   guardianPhone: "+233 26 222 0060", groupId: "GR-006", enrolledAt: "2019-09-01" },
  { id: "ST-012", name: "Esi Gyamfi",       phone: "+233 54 222 0012", type: "student", status: "graduated",  dateOfBirth: "2010-05-28", gender: "Female", guardianName: "Fiifi Gyamfi",   guardianPhone: "+233 54 222 0061", groupId: "GR-006", enrolledAt: "2019-09-01" },
  { id: "ST-013", name: "Fiifi Ankrah",     phone: "+233 27 222 0013", type: "student", status: "active",     dateOfBirth: "2015-07-19", gender: "Male",   guardianName: "Papa Ankrah",    guardianPhone: "+233 27 222 0062", groupId: "GR-001", enrolledAt: "2024-09-01" },
  { id: "ST-014", name: "Araba Serwaa",     phone: "+233 50 222 0014", type: "student", status: "suspended",  dateOfBirth: "2014-03-03", gender: "Female", guardianName: "Maame Serwaa",   guardianPhone: "+233 50 222 0063", groupId: "GR-002", enrolledAt: "2023-09-01" },
  { id: "ST-015", name: "Papa Quaye Jr",    phone: "+233 24 222 0015", type: "student", status: "active",     dateOfBirth: "2013-11-11", gender: "Male",   guardianName: "Araba Quaye",    guardianPhone: "+233 24 222 0064", groupId: "GR-003", enrolledAt: "2022-09-01" },
]

/* ───── Institute Groups ───── */

export interface MockGroup {
  id: string
  name: string
  type: "class"
  memberCount: number
  teacherName: string
  subjects: string[]
}

export const MOCK_INST_GROUPS: MockGroup[] = [
  { id: "GR-001", name: "Class 1", type: "class", memberCount: 3,  teacherName: "Mrs. Ama Konadu",  subjects: ["Math", "English", "Science", "Social Studies", "Creative Arts", "Physical Education", "Ghanaian Language"] },
  { id: "GR-002", name: "Class 2", type: "class", memberCount: 3,  teacherName: "Mr. Kofi Asante",  subjects: ["Math", "English", "Science", "Social Studies", "ICT", "French", "Creative Arts", "Physical Education"] },
  { id: "GR-003", name: "Class 3", type: "class", memberCount: 3,  teacherName: "Mrs. Efua Mensah", subjects: ["Math", "English", "Science", "Social Studies", "ICT", "French", "Religious & Moral Education"] },
  { id: "GR-004", name: "Class 4", type: "class", memberCount: 2,  teacherName: "Mr. Yaw Boateng",  subjects: ["Math", "English", "Science", "Social Studies", "ICT", "French", "Creative Arts", "Ghanaian Language"] },
  { id: "GR-005", name: "Class 5", type: "class", memberCount: 2,  teacherName: "Mrs. Abena Nyarko", subjects: ["Math", "English", "Science", "Social Studies", "ICT", "French", "Religious & Moral Education", "Physical Education"] },
  { id: "GR-006", name: "Class 6", type: "class", memberCount: 2,  teacherName: "Mr. Kwame Osei",   subjects: ["Math", "English", "Science", "Social Studies", "ICT", "French", "Creative Arts", "Religious & Moral Education", "Ghanaian Language", "Physical Education"] },
]

/* ───── Institute Subjects ───── */

export const MOCK_INST_SUBJECTS = [
  { id: "SUB-01", name: "Math" },
  { id: "SUB-02", name: "English" },
  { id: "SUB-03", name: "Science" },
  { id: "SUB-04", name: "Social Studies" },
  { id: "SUB-05", name: "ICT" },
  { id: "SUB-06", name: "French" },
  { id: "SUB-07", name: "Creative Arts" },
  { id: "SUB-08", name: "Physical Education" },
  { id: "SUB-09", name: "Religious & Moral Education" },
  { id: "SUB-10", name: "Ghanaian Language" },
]

/* ───── Institute Exams ───── */

export interface MockExam {
  id: string
  name: string
  term: "Term 1" | "Term 2" | "Term 3"
  year: string
  groupId: string
  date: string
  maxScore: number
  status: "upcoming" | "in_progress" | "completed" | "graded"
}

export const MOCK_INST_EXAMS: MockExam[] = [
  { id: "EX-001", name: "Mid-Term 1 Exam",   term: "Term 1", year: "2026", groupId: "GR-001", date: "2026-02-15", maxScore: 100, status: "graded" },
  { id: "EX-002", name: "End Of Term 1 Exam", term: "Term 1", year: "2026", groupId: "GR-001", date: "2026-04-05", maxScore: 100, status: "graded" },
  { id: "EX-003", name: "Mid-Term 1 Exam",   term: "Term 1", year: "2026", groupId: "GR-002", date: "2026-02-15", maxScore: 100, status: "graded" },
  { id: "EX-004", name: "End Of Term 1 Exam", term: "Term 1", year: "2026", groupId: "GR-002", date: "2026-04-05", maxScore: 100, status: "completed" },
  { id: "EX-005", name: "Mid-Term 2 Exam",   term: "Term 2", year: "2026", groupId: "GR-001", date: "2026-06-10", maxScore: 100, status: "upcoming" },
  { id: "EX-006", name: "Mid-Term 2 Exam",   term: "Term 2", year: "2026", groupId: "GR-003", date: "2026-06-10", maxScore: 100, status: "upcoming" },
  { id: "EX-007", name: "End Of Term 1 Exam", term: "Term 1", year: "2026", groupId: "GR-003", date: "2026-04-05", maxScore: 100, status: "in_progress" },
  { id: "EX-008", name: "BECE Mock",          term: "Term 1", year: "2026", groupId: "GR-006", date: "2026-03-20", maxScore: 100, status: "graded" },
]

/* ───── Institute Grades ───── */

export interface MockGrade {
  id: string
  studentId: string
  examId: string
  subjectId: string
  score: number
  grade: "A1" | "B2" | "B3" | "C4" | "C5" | "C6" | "D7" | "E8" | "F9"
  remarks: string
}

function calcGrade(s: number): MockGrade["grade"] {
  if (s >= 80) return "A1"; if (s >= 70) return "B2"; if (s >= 65) return "B3"; if (s >= 60) return "C4"; if (s >= 55) return "C5"; if (s >= 50) return "C6"; if (s >= 40) return "D7"; if (s >= 30) return "E8"; return "F9"
}

export const MOCK_INST_GRADES: MockGrade[] = [
  { id: "GD-01", studentId: "ST-001", examId: "EX-001", subjectId: "SUB-01", score: 85, grade: "A1", remarks: "Excellent" },
  { id: "GD-02", studentId: "ST-001", examId: "EX-001", subjectId: "SUB-02", score: 72, grade: "B2", remarks: "Good" },
  { id: "GD-03", studentId: "ST-001", examId: "EX-001", subjectId: "SUB-03", score: 68, grade: "B3", remarks: "Good" },
  { id: "GD-04", studentId: "ST-002", examId: "EX-001", subjectId: "SUB-01", score: 92, grade: "A1", remarks: "Outstanding" },
  { id: "GD-05", studentId: "ST-002", examId: "EX-001", subjectId: "SUB-02", score: 88, grade: "A1", remarks: "Excellent" },
  { id: "GD-06", studentId: "ST-002", examId: "EX-001", subjectId: "SUB-03", score: 55, grade: "C5", remarks: "Fair" },
  { id: "GD-07", studentId: "ST-003", examId: "EX-003", subjectId: "SUB-01", score: 62, grade: "C4", remarks: "Average" },
  { id: "GD-08", studentId: "ST-003", examId: "EX-003", subjectId: "SUB-02", score: 75, grade: "B2", remarks: "Good" },
  { id: "GD-09", studentId: "ST-004", examId: "EX-003", subjectId: "SUB-01", score: 78, grade: "B2", remarks: "Good" },
  { id: "GD-10", studentId: "ST-004", examId: "EX-003", subjectId: "SUB-02", score: 45, grade: "D7", remarks: "Below Average" },
  { id: "GD-11", studentId: "ST-005", examId: "EX-007", subjectId: "SUB-01", score: 90, grade: "A1", remarks: "Outstanding" },
  { id: "GD-12", studentId: "ST-005", examId: "EX-007", subjectId: "SUB-02", score: 82, grade: "A1", remarks: "Excellent" },
  { id: "GD-13", studentId: "ST-005", examId: "EX-007", subjectId: "SUB-03", score: 71, grade: "B2", remarks: "Good" },
  { id: "GD-14", studentId: "ST-006", examId: "EX-007", subjectId: "SUB-01", score: 58, grade: "C5", remarks: "Fair" },
  { id: "GD-15", studentId: "ST-006", examId: "EX-007", subjectId: "SUB-02", score: 63, grade: "C4", remarks: "Average" },
  { id: "GD-16", studentId: "ST-013", examId: "EX-002", subjectId: "SUB-01", score: 80, grade: "A1", remarks: "Excellent" },
  { id: "GD-17", studentId: "ST-013", examId: "EX-002", subjectId: "SUB-02", score: 67, grade: "B3", remarks: "Good" },
  { id: "GD-18", studentId: "ST-001", examId: "EX-002", subjectId: "SUB-01", score: 88, grade: "A1", remarks: "Excellent" },
  { id: "GD-19", studentId: "ST-001", examId: "EX-002", subjectId: "SUB-02", score: 76, grade: "B2", remarks: "Good" },
  { id: "GD-20", studentId: "ST-002", examId: "EX-002", subjectId: "SUB-01", score: 95, grade: "A1", remarks: "Outstanding" },
  { id: "GD-21", studentId: "ST-002", examId: "EX-002", subjectId: "SUB-02", score: 91, grade: "A1", remarks: "Outstanding" },
  { id: "GD-22", studentId: "ST-011", examId: "EX-008", subjectId: "SUB-01", score: 73, grade: "B2", remarks: "Good" },
  { id: "GD-23", studentId: "ST-011", examId: "EX-008", subjectId: "SUB-02", score: 68, grade: "B3", remarks: "Good" },
  { id: "GD-24", studentId: "ST-012", examId: "EX-008", subjectId: "SUB-01", score: 81, grade: "A1", remarks: "Excellent" },
  { id: "GD-25", studentId: "ST-012", examId: "EX-008", subjectId: "SUB-02", score: 77, grade: "B2", remarks: "Good" },
  { id: "GD-26", studentId: "ST-007", examId: "EX-001", subjectId: "SUB-01", score: 42, grade: "D7", remarks: "Needs Improvement" },
  { id: "GD-27", studentId: "ST-007", examId: "EX-001", subjectId: "SUB-02", score: 51, grade: "C6", remarks: "Fair" },
  { id: "GD-28", studentId: "ST-009", examId: "EX-001", subjectId: "SUB-01", score: 66, grade: "B3", remarks: "Good" },
  { id: "GD-29", studentId: "ST-009", examId: "EX-001", subjectId: "SUB-02", score: 59, grade: "C5", remarks: "Fair" },
  { id: "GD-30", studentId: "ST-010", examId: "EX-001", subjectId: "SUB-01", score: 74, grade: "B2", remarks: "Good" },
]

/* ───── Institute Attendance ───── */

export interface MockAttendance {
  id: string
  date: string
  groupId: string
  present: number
  absent: number
  late: number
  total: number
}

export const MOCK_INST_ATTENDANCE: MockAttendance[] = [
  { id: "AT-01", date: "2026-04-17", groupId: "GR-001", present: 25, absent: 2, late: 1, total: 28 },
  { id: "AT-02", date: "2026-04-17", groupId: "GR-002", present: 22, absent: 3, late: 2, total: 27 },
  { id: "AT-03", date: "2026-04-17", groupId: "GR-003", present: 28, absent: 1, late: 0, total: 29 },
  { id: "AT-04", date: "2026-04-16", groupId: "GR-001", present: 26, absent: 1, late: 1, total: 28 },
  { id: "AT-05", date: "2026-04-16", groupId: "GR-002", present: 24, absent: 2, late: 1, total: 27 },
  { id: "AT-06", date: "2026-04-16", groupId: "GR-003", present: 27, absent: 2, late: 0, total: 29 },
  { id: "AT-07", date: "2026-04-15", groupId: "GR-001", present: 24, absent: 3, late: 1, total: 28 },
  { id: "AT-08", date: "2026-04-15", groupId: "GR-002", present: 25, absent: 1, late: 1, total: 27 },
  { id: "AT-09", date: "2026-04-15", groupId: "GR-004", present: 20, absent: 4, late: 2, total: 26 },
  { id: "AT-10", date: "2026-04-14", groupId: "GR-001", present: 27, absent: 1, late: 0, total: 28 },
  { id: "AT-11", date: "2026-04-14", groupId: "GR-005", present: 23, absent: 2, late: 1, total: 26 },
  { id: "AT-12", date: "2026-04-14", groupId: "GR-006", present: 18, absent: 1, late: 0, total: 19 },
  { id: "AT-13", date: "2026-04-13", groupId: "GR-001", present: 26, absent: 2, late: 0, total: 28 },
  { id: "AT-14", date: "2026-04-13", groupId: "GR-003", present: 29, absent: 0, late: 0, total: 29 },
  { id: "AT-15", date: "2026-04-13", groupId: "GR-004", present: 22, absent: 3, late: 1, total: 26 },
]

/* ───── Institute Fees ───── */

export interface MockFee {
  id: string
  studentId: string
  studentName: string
  description: string
  amount: number
  paid: number
  balance: number
  status: "UNPAID" | "PARTIAL" | "PAID"
  dueDate: string
  term: "Term 1" | "Term 2" | "Term 3"
}

export const MOCK_INST_FEES: MockFee[] = [
  { id: "FE-01", studentId: "ST-001", studentName: "Kwame Mensah",    description: "Tuition Term 1",  amount: 150000, paid: 150000, balance: 0,      status: "PAID",    dueDate: "2026-01-15", term: "Term 1" },
  { id: "FE-02", studentId: "ST-002", studentName: "Akosua Boateng",  description: "Tuition Term 1",  amount: 150000, paid: 150000, balance: 0,      status: "PAID",    dueDate: "2026-01-15", term: "Term 1" },
  { id: "FE-03", studentId: "ST-003", studentName: "Yaw Darko",       description: "Tuition Term 1",  amount: 150000, paid: 100000, balance: 50000,  status: "PARTIAL", dueDate: "2026-01-15", term: "Term 1" },
  { id: "FE-04", studentId: "ST-004", studentName: "Esi Frimpong",    description: "Tuition Term 1",  amount: 150000, paid: 150000, balance: 0,      status: "PAID",    dueDate: "2026-01-15", term: "Term 1" },
  { id: "FE-05", studentId: "ST-005", studentName: "Kofi Tetteh",     description: "Tuition Term 1",  amount: 150000, paid: 0,      balance: 150000, status: "UNPAID",  dueDate: "2026-01-15", term: "Term 1" },
  { id: "FE-06", studentId: "ST-006", studentName: "Abena Amoah",     description: "Tuition Term 1",  amount: 150000, paid: 75000,  balance: 75000,  status: "PARTIAL", dueDate: "2026-01-15", term: "Term 1" },
  { id: "FE-07", studentId: "ST-007", studentName: "Nana Adjei Jr",   description: "Tuition Term 1",  amount: 150000, paid: 150000, balance: 0,      status: "PAID",    dueDate: "2026-01-15", term: "Term 1" },
  { id: "FE-08", studentId: "ST-009", studentName: "Kojo Appiah",     description: "Tuition Term 1",  amount: 150000, paid: 150000, balance: 0,      status: "PAID",    dueDate: "2026-01-15", term: "Term 1" },
  { id: "FE-09", studentId: "ST-010", studentName: "Akua Badu",       description: "Tuition Term 1",  amount: 150000, paid: 120000, balance: 30000,  status: "PARTIAL", dueDate: "2026-01-15", term: "Term 1" },
  { id: "FE-10", studentId: "ST-013", studentName: "Fiifi Ankrah",    description: "Tuition Term 1",  amount: 150000, paid: 150000, balance: 0,      status: "PAID",    dueDate: "2026-01-15", term: "Term 1" },
  { id: "FE-11", studentId: "ST-015", studentName: "Papa Quaye Jr",   description: "Tuition Term 1",  amount: 150000, paid: 0,      balance: 150000, status: "UNPAID",  dueDate: "2026-01-15", term: "Term 1" },
  { id: "FE-12", studentId: "ST-001", studentName: "Kwame Mensah",    description: "Exam Fee",        amount: 5000,   paid: 5000,   balance: 0,      status: "PAID",    dueDate: "2026-02-01", term: "Term 1" },
  { id: "FE-13", studentId: "ST-002", studentName: "Akosua Boateng",  description: "Exam Fee",        amount: 5000,   paid: 5000,   balance: 0,      status: "PAID",    dueDate: "2026-02-01", term: "Term 1" },
  { id: "FE-14", studentId: "ST-003", studentName: "Yaw Darko",       description: "Uniform",         amount: 15000,  paid: 15000,  balance: 0,      status: "PAID",    dueDate: "2026-01-20", term: "Term 1" },
  { id: "FE-15", studentId: "ST-005", studentName: "Kofi Tetteh",     description: "Textbook Pack",   amount: 25000,  paid: 0,      balance: 25000,  status: "UNPAID",  dueDate: "2026-01-20", term: "Term 1" },
]

/* ───── Institute Payments ───── */

export interface MockInstPayment {
  id: string
  feeId: string
  studentId: string
  studentName: string
  amount: number
  method: "Cash" | "MoMo" | "Bank"
  reference: string
  receivedBy: string
  date: string
}

export const MOCK_INST_PAYMENTS: MockInstPayment[] = [
  { id: "PAY-01", feeId: "FE-01", studentId: "ST-001", studentName: "Kwame Mensah",   amount: 150000, method: "MoMo", reference: "MTN-88010", receivedBy: "Mrs. Asantewaa", date: "2026-01-10" },
  { id: "PAY-02", feeId: "FE-02", studentId: "ST-002", studentName: "Akosua Boateng", amount: 150000, method: "Bank", reference: "GCB-44210", receivedBy: "Mrs. Asantewaa", date: "2026-01-12" },
  { id: "PAY-03", feeId: "FE-03", studentId: "ST-003", studentName: "Yaw Darko",      amount: 100000, method: "Cash", reference: "RCPT-001",  receivedBy: "Mrs. Asantewaa", date: "2026-01-14" },
  { id: "PAY-04", feeId: "FE-04", studentId: "ST-004", studentName: "Esi Frimpong",   amount: 150000, method: "MoMo", reference: "MTN-88022", receivedBy: "Mrs. Asantewaa", date: "2026-01-08" },
  { id: "PAY-05", feeId: "FE-06", studentId: "ST-006", studentName: "Abena Amoah",    amount: 75000,  method: "Cash", reference: "RCPT-002",  receivedBy: "Mr. Osei",       date: "2026-01-16" },
  { id: "PAY-06", feeId: "FE-07", studentId: "ST-007", studentName: "Nana Adjei Jr",  amount: 150000, method: "Bank", reference: "GCB-44225", receivedBy: "Mrs. Asantewaa", date: "2026-01-11" },
  { id: "PAY-07", feeId: "FE-08", studentId: "ST-009", studentName: "Kojo Appiah",    amount: 150000, method: "MoMo", reference: "MTN-88044", receivedBy: "Mrs. Asantewaa", date: "2026-01-09" },
  { id: "PAY-08", feeId: "FE-09", studentId: "ST-010", studentName: "Akua Badu",      amount: 120000, method: "Bank", reference: "GCB-44230", receivedBy: "Mr. Osei",       date: "2026-01-18" },
  { id: "PAY-09", feeId: "FE-10", studentId: "ST-013", studentName: "Fiifi Ankrah",   amount: 150000, method: "Cash", reference: "RCPT-003",  receivedBy: "Mrs. Asantewaa", date: "2026-01-13" },
  { id: "PAY-10", feeId: "FE-14", studentId: "ST-003", studentName: "Yaw Darko",      amount: 15000,  method: "Cash", reference: "RCPT-004",  receivedBy: "Mr. Osei",       date: "2026-01-20" },
]

/* ───── Institute Schedule ───── */

export interface MockScheduleSlot {
  id: string
  groupId: string
  subjectId: string
  subjectName: string
  staffName: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string
}

export const MOCK_INST_SCHEDULE: MockScheduleSlot[] = [
  { id: "SCH-01", groupId: "GR-001", subjectId: "SUB-01", subjectName: "Math",               staffName: "Mrs. Ama Konadu",  dayOfWeek: 0, startTime: "08:00", endTime: "09:00", room: "Room 1A" },
  { id: "SCH-02", groupId: "GR-001", subjectId: "SUB-02", subjectName: "English",             staffName: "Mrs. Ama Konadu",  dayOfWeek: 0, startTime: "09:00", endTime: "10:00", room: "Room 1A" },
  { id: "SCH-03", groupId: "GR-001", subjectId: "SUB-03", subjectName: "Science",             staffName: "Mr. Kwame Osei",   dayOfWeek: 0, startTime: "10:30", endTime: "11:30", room: "Lab 1" },
  { id: "SCH-04", groupId: "GR-001", subjectId: "SUB-08", subjectName: "Physical Education",  staffName: "Coach Mensah",     dayOfWeek: 0, startTime: "11:30", endTime: "12:30", room: "Field" },
  { id: "SCH-05", groupId: "GR-001", subjectId: "SUB-01", subjectName: "Math",               staffName: "Mrs. Ama Konadu",  dayOfWeek: 1, startTime: "08:00", endTime: "09:00", room: "Room 1A" },
  { id: "SCH-06", groupId: "GR-001", subjectId: "SUB-04", subjectName: "Social Studies",      staffName: "Mrs. Ama Konadu",  dayOfWeek: 1, startTime: "09:00", endTime: "10:00", room: "Room 1A" },
  { id: "SCH-07", groupId: "GR-002", subjectId: "SUB-01", subjectName: "Math",               staffName: "Mr. Kofi Asante",  dayOfWeek: 0, startTime: "08:00", endTime: "09:00", room: "Room 2A" },
  { id: "SCH-08", groupId: "GR-002", subjectId: "SUB-02", subjectName: "English",             staffName: "Mr. Kofi Asante",  dayOfWeek: 0, startTime: "09:00", endTime: "10:00", room: "Room 2A" },
  { id: "SCH-09", groupId: "GR-002", subjectId: "SUB-05", subjectName: "ICT",                 staffName: "Mr. Yaw Boateng",  dayOfWeek: 0, startTime: "10:30", endTime: "11:30", room: "ICT Lab" },
  { id: "SCH-10", groupId: "GR-002", subjectId: "SUB-06", subjectName: "French",              staffName: "Mme. Adjoa Tettey", dayOfWeek: 0, startTime: "11:30", endTime: "12:30", room: "Room 2A" },
  { id: "SCH-11", groupId: "GR-003", subjectId: "SUB-01", subjectName: "Math",               staffName: "Mrs. Efua Mensah", dayOfWeek: 0, startTime: "08:00", endTime: "09:00", room: "Room 3A" },
  { id: "SCH-12", groupId: "GR-003", subjectId: "SUB-02", subjectName: "English",             staffName: "Mrs. Efua Mensah", dayOfWeek: 0, startTime: "09:00", endTime: "10:00", room: "Room 3A" },
  { id: "SCH-13", groupId: "GR-001", subjectId: "SUB-07", subjectName: "Creative Arts",       staffName: "Mrs. Abena Nyarko", dayOfWeek: 2, startTime: "08:00", endTime: "09:00", room: "Art Room" },
  { id: "SCH-14", groupId: "GR-001", subjectId: "SUB-10", subjectName: "Ghanaian Language",   staffName: "Mr. Kwame Osei",   dayOfWeek: 2, startTime: "09:00", endTime: "10:00", room: "Room 1A" },
  { id: "SCH-15", groupId: "GR-002", subjectId: "SUB-07", subjectName: "Creative Arts",       staffName: "Mrs. Abena Nyarko", dayOfWeek: 1, startTime: "08:00", endTime: "09:00", room: "Art Room" },
  { id: "SCH-16", groupId: "GR-002", subjectId: "SUB-01", subjectName: "Math",               staffName: "Mr. Kofi Asante",  dayOfWeek: 1, startTime: "09:00", endTime: "10:00", room: "Room 2A" },
  { id: "SCH-17", groupId: "GR-003", subjectId: "SUB-09", subjectName: "Religious & Moral Ed", staffName: "Mrs. Efua Mensah", dayOfWeek: 1, startTime: "08:00", endTime: "09:00", room: "Room 3A" },
  { id: "SCH-18", groupId: "GR-003", subjectId: "SUB-05", subjectName: "ICT",                 staffName: "Mr. Yaw Boateng",  dayOfWeek: 1, startTime: "10:30", endTime: "11:30", room: "ICT Lab" },
  { id: "SCH-19", groupId: "GR-004", subjectId: "SUB-01", subjectName: "Math",               staffName: "Mr. Yaw Boateng",  dayOfWeek: 0, startTime: "08:00", endTime: "09:00", room: "Room 4A" },
  { id: "SCH-20", groupId: "GR-004", subjectId: "SUB-02", subjectName: "English",             staffName: "Mr. Yaw Boateng",  dayOfWeek: 0, startTime: "09:00", endTime: "10:00", room: "Room 4A" },
  { id: "SCH-21", groupId: "GR-005", subjectId: "SUB-01", subjectName: "Math",               staffName: "Mrs. Abena Nyarko", dayOfWeek: 0, startTime: "08:00", endTime: "09:00", room: "Room 5A" },
  { id: "SCH-22", groupId: "GR-005", subjectId: "SUB-02", subjectName: "English",             staffName: "Mrs. Abena Nyarko", dayOfWeek: 0, startTime: "09:00", endTime: "10:00", room: "Room 5A" },
  { id: "SCH-23", groupId: "GR-006", subjectId: "SUB-01", subjectName: "Math",               staffName: "Mr. Kwame Osei",   dayOfWeek: 0, startTime: "08:00", endTime: "09:00", room: "Room 6A" },
  { id: "SCH-24", groupId: "GR-006", subjectId: "SUB-02", subjectName: "English",             staffName: "Mr. Kwame Osei",   dayOfWeek: 0, startTime: "09:00", endTime: "10:00", room: "Room 6A" },
  { id: "SCH-25", groupId: "GR-001", subjectId: "SUB-02", subjectName: "English",             staffName: "Mrs. Ama Konadu",  dayOfWeek: 2, startTime: "10:30", endTime: "11:30", room: "Room 1A" },
  { id: "SCH-26", groupId: "GR-004", subjectId: "SUB-05", subjectName: "ICT",                 staffName: "Mr. Yaw Boateng",  dayOfWeek: 2, startTime: "10:30", endTime: "11:30", room: "ICT Lab" },
  { id: "SCH-27", groupId: "GR-005", subjectId: "SUB-06", subjectName: "French",              staffName: "Mme. Adjoa Tettey", dayOfWeek: 2, startTime: "08:00", endTime: "09:00", room: "Room 5A" },
  { id: "SCH-28", groupId: "GR-006", subjectId: "SUB-03", subjectName: "Science",             staffName: "Mr. Kwame Osei",   dayOfWeek: 1, startTime: "10:30", endTime: "11:30", room: "Lab 1" },
  { id: "SCH-29", groupId: "GR-003", subjectId: "SUB-06", subjectName: "French",              staffName: "Mme. Adjoa Tettey", dayOfWeek: 3, startTime: "08:00", endTime: "09:00", room: "Room 3A" },
  { id: "SCH-30", groupId: "GR-006", subjectId: "SUB-09", subjectName: "Religious & Moral Ed", staffName: "Mrs. Efua Mensah", dayOfWeek: 3, startTime: "09:00", endTime: "10:00", room: "Room 6A" },
]

/* ───── Institute Calendar ───── */

export interface MockCalendarEvent {
  id: string
  title: string
  type: "holiday" | "exam" | "meeting" | "event" | "deadline"
  date: string
  description: string
}

export const MOCK_INST_CALENDAR: MockCalendarEvent[] = [
  { id: "CAL-01", title: "Term 2 Begins",           type: "event",    date: "2026-05-04", description: "All students report by 8:00 AM" },
  { id: "CAL-02", title: "Mid-Term Break",           type: "holiday",  date: "2026-06-08", description: "One week break" },
  { id: "CAL-03", title: "Mid-Term 2 Exams",         type: "exam",     date: "2026-06-10", description: "All classes, exam hall" },
  { id: "CAL-04", title: "PTA Meeting",              type: "meeting",  date: "2026-05-15", description: "Annual parents-teacher meeting in assembly hall" },
  { id: "CAL-05", title: "Independence Day",         type: "holiday",  date: "2026-03-06", description: "National holiday — school closed" },
  { id: "CAL-06", title: "End Of Term 2 Exams",      type: "exam",     date: "2026-07-15", description: "Final exams for Term 2" },
  { id: "CAL-07", title: "Staff Development Day",    type: "meeting",  date: "2026-05-22", description: "Professional development workshop" },
  { id: "CAL-08", title: "Report Card Deadline",     type: "deadline", date: "2026-04-25", description: "All Term 1 report cards must be submitted" },
]

/* ───── Institute Staff ───── */

export interface MockInstStaff {
  id: string
  name: string
  role: "teacher" | "admin" | "accountant" | "head_teacher"
  department: string
  phone: string
  email: string
  subjects: string[]
  status: "active" | "on_leave" | "resigned"
}

export const MOCK_INST_STAFF: MockInstStaff[] = [
  { id: "IS-01", name: "Mr. Daniel Amankwah",  role: "head_teacher", department: "Administration", phone: "+233 24 333 0001", email: "daniel@demoacademy.gh", subjects: [],                                       status: "active" },
  { id: "IS-02", name: "Mrs. Ama Konadu",      role: "teacher",      department: "Lower Primary",  phone: "+233 20 333 0002", email: "ama@demoacademy.gh",    subjects: ["Math", "English", "Social Studies"],     status: "active" },
  { id: "IS-03", name: "Mr. Kofi Asante",      role: "teacher",      department: "Lower Primary",  phone: "+233 26 333 0003", email: "kofi@demoacademy.gh",   subjects: ["Math", "English"],                       status: "active" },
  { id: "IS-04", name: "Mrs. Efua Mensah",     role: "teacher",      department: "Upper Primary",  phone: "+233 54 333 0004", email: "efua@demoacademy.gh",   subjects: ["Math", "English", "Religious & Moral Education"], status: "active" },
  { id: "IS-05", name: "Mr. Yaw Boateng",      role: "teacher",      department: "Upper Primary",  phone: "+233 27 333 0005", email: "yaw@demoacademy.gh",    subjects: ["Math", "English", "ICT"],                status: "active" },
  { id: "IS-06", name: "Mrs. Abena Nyarko",    role: "teacher",      department: "Upper Primary",  phone: "+233 50 333 0006", email: "abena@demoacademy.gh",  subjects: ["Math", "English", "Creative Arts", "French"], status: "active" },
  { id: "IS-07", name: "Mr. Kwame Osei",       role: "teacher",      department: "JHS",            phone: "+233 24 333 0007", email: "kwame@demoacademy.gh",  subjects: ["Math", "English", "Science", "Ghanaian Language"], status: "active" },
  { id: "IS-08", name: "Mme. Adjoa Tettey",    role: "teacher",      department: "Languages",      phone: "+233 55 333 0008", email: "adjoa@demoacademy.gh",  subjects: ["French"],                                status: "active" },
  { id: "IS-09", name: "Coach Mensah",         role: "teacher",      department: "Sports",         phone: "+233 24 333 0009", email: "coach@demoacademy.gh",  subjects: ["Physical Education"],                     status: "active" },
  { id: "IS-10", name: "Mrs. Asantewaa",       role: "accountant",   department: "Finance",        phone: "+233 20 333 0010", email: "finance@demoacademy.gh", subjects: [],                                       status: "active" },
]

/* ───── Institute Communication ───── */

export interface MockMessage {
  id: string
  title: string
  body: string
  type: "notice" | "sms" | "circular"
  recipients: "all" | "group" | "individual"
  sentBy: string
  sentAt: string
  status: "sent" | "draft" | "scheduled"
}

export const MOCK_INST_COMMUNICATION: MockMessage[] = [
  { id: "MSG-01", title: "Term 1 Report Cards Ready",        body: "Dear parents, Term 1 report cards are available for collection at the school office from Monday 21st April.", type: "notice",   recipients: "all",        sentBy: "Mr. Daniel Amankwah", sentAt: "2026-04-17T08:00:00", status: "sent" },
  { id: "MSG-02", title: "PTA Meeting Reminder",             body: "This is a reminder that the PTA meeting will hold on May 15th at 10:00 AM in the assembly hall.",            type: "sms",      recipients: "all",        sentBy: "Mrs. Asantewaa",      sentAt: "2026-04-16T10:00:00", status: "sent" },
  { id: "MSG-03", title: "Class 2 Field Trip Permission",    body: "Class 2 students will visit the National Museum on April 25th. Please sign and return the attached form.",   type: "circular", recipients: "group",      sentBy: "Mr. Kofi Asante",     sentAt: "2026-04-15T14:00:00", status: "sent" },
  { id: "MSG-04", title: "Fee Payment Reminder",             body: "Kindly note that outstanding fees for Term 1 must be settled before Term 2 begins on May 4th.",              type: "sms",      recipients: "individual", sentBy: "Mrs. Asantewaa",      sentAt: "2026-04-14T09:00:00", status: "sent" },
  { id: "MSG-05", title: "Sports Day Announcement",          body: "Annual sports day will be held on May 30th. All parents are welcome to attend and support their wards.",     type: "notice",   recipients: "all",        sentBy: "Coach Mensah",        sentAt: "2026-04-13T11:00:00", status: "sent" },
  { id: "MSG-06", title: "Term 2 Book List",                 body: "Please find attached the book list for Term 2. Books can be purchased from the school bookshop.",            type: "circular", recipients: "all",        sentBy: "Mr. Daniel Amankwah", sentAt: "2026-04-12T08:00:00", status: "sent" },
  { id: "MSG-07", title: "Mid-Term 2 Exam Timetable",        body: "The mid-term exam timetable for Term 2 has been finalized. See attached schedule.",                          type: "notice",   recipients: "all",        sentBy: "Mr. Daniel Amankwah", sentAt: "2026-05-20T08:00:00", status: "scheduled" },
  { id: "MSG-08", title: "Uniform Policy Update",            body: "Starting Term 2, all students must wear black shoes. Brown shoes will no longer be accepted.",                type: "circular", recipients: "all",        sentBy: "Mr. Daniel Amankwah", sentAt: "",                     status: "draft" },
]

/* ───── Trade Catalogue (ServiceItem wrapper) ───── */

export const MOCK_TRADE_CATALOGUE: MockServiceItem[] = [
  { id: "TC-001", name: "Coca-Cola 500ml",            sku: "BEV-001", categoryId: "beverages",     behaviour: "product", stockType: "physical", costPrice: 350,  sellingPrice: 600,   stock: 240, minStock: 48, unit: "bottle", taxable: true, isActive: true },
  { id: "TC-002", name: "Indomie Instant Noodles",    sku: "FD-001",  categoryId: "food",          behaviour: "product", stockType: "physical", costPrice: 200,  sellingPrice: 400,   stock: 300, minStock: 60, unit: "pack",   taxable: true, isActive: true },
  { id: "TC-003", name: "Golden Tree Chocolate",      sku: "CNF-001", categoryId: "confectionery", behaviour: "product", stockType: "physical", costPrice: 1800, sellingPrice: 3200,  stock: 85,  minStock: 20, unit: "bar",    taxable: true, isActive: true },
  { id: "TC-004", name: "Peak Milk 400g",             sku: "DRY-001", categoryId: "dairy",         behaviour: "product", stockType: "physical", costPrice: 1200, sellingPrice: 2000,  stock: 120, minStock: 24, unit: "tin",    taxable: true, isActive: true },
  { id: "TC-005", name: "Nescafe 3in1",               sku: "BEV-002", categoryId: "beverages",     behaviour: "product", stockType: "physical", costPrice: 150,  sellingPrice: 300,   stock: 400, minStock: 80, unit: "sachet", taxable: true, isActive: true },
  { id: "TC-006", name: "Voltic Water 1.5L",          sku: "BEV-003", categoryId: "beverages",     behaviour: "product", stockType: "physical", costPrice: 180,  sellingPrice: 350,   stock: 500, minStock: 100, unit: "bottle", taxable: false, isActive: true },
  { id: "TC-007", name: "Gino Tomato Paste",          sku: "FD-002",  categoryId: "food",          behaviour: "product", stockType: "physical", costPrice: 250,  sellingPrice: 500,   stock: 180, minStock: 36, unit: "tin",    taxable: true, isActive: true },
  { id: "TC-008", name: "Pepsodent Toothpaste",       sku: "HH-001", categoryId: "household",     behaviour: "product", stockType: "physical", costPrice: 600,  sellingPrice: 1200,  stock: 100, minStock: 20, unit: "tube",   taxable: true, isActive: true },
  { id: "TC-009", name: "Key Soap",                   sku: "HH-002", categoryId: "household",     behaviour: "product", stockType: "physical", costPrice: 400,  sellingPrice: 800,   stock: 220, minStock: 40, unit: "bar",    taxable: true, isActive: true },
  { id: "TC-010", name: "Royal Aroma Rice 5kg",       sku: "GR-001", categoryId: "grains",        behaviour: "product", stockType: "physical", costPrice: 4500, sellingPrice: 7500,  stock: 60,  minStock: 12, unit: "bag",    taxable: true, isActive: true },
  { id: "TC-011", name: "TropiCool Ice Cream",        sku: "FRZ-001", categoryId: "frozen",        behaviour: "product", stockType: "physical", costPrice: 800,  sellingPrice: 1500,  stock: 40,  minStock: 10, unit: "tub",    taxable: true, isActive: true },
  { id: "TC-012", name: "Golden Morn Cereal",         sku: "FD-003",  categoryId: "food",          behaviour: "product", stockType: "physical", costPrice: 1000, sellingPrice: 1800,  stock: 90,  minStock: 18, unit: "pack",   taxable: true, isActive: true },
]
