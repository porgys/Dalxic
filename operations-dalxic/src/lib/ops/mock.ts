/* ═══════════════════════════════════════════════════════════════
   DALXIC OPERATIONS — MOCK DATA
   Realistic Ghana-flavoured demo data for every screen until the
   matching API is wired. Single source. Tweak here, screens follow.
   ═══════════════════════════════════════════════════════════════ */

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
  { slug: "dashboard",       group: "Sales",      status: "live",    title: "Dashboard",          blurb: "Today at a glance — revenue, alerts, low stock",   href: "/trade/workstation" },
  { slug: "pos",             group: "Sales",      status: "live",    title: "Point Of Sale",      blurb: "Charge customers in seconds — cash, MoMo, card",   href: "/trade/workstation" },
  { slug: "orders",          group: "Sales",      status: "live",    title: "Orders",             blurb: "Every receipt, every refund, fully searchable",    href: "/trade/workstation" },
  { slug: "receipts",        group: "Sales",      status: "preview", title: "Receipts",           blurb: "Reprint, resend, void — full audit trail",         href: "/trade/receipts" },
  { slug: "returns",         group: "Sales",      status: "preview", title: "Returns & Refunds",  blurb: "Refund flow with restock and reason codes",        href: "/trade/returns" },
  { slug: "customers",       group: "Sales",      status: "preview", title: "Customers",          blurb: "Profiles, credit, history, loyalty tier",          href: "/trade/customers" },
  { slug: "loyalty",         group: "Sales",      status: "preview", title: "Loyalty & Promos",   blurb: "Points, tiers, discount rules, BOGOF",             href: "/trade/loyalty" },

  { slug: "inventory",       group: "Inventory",  status: "live",    title: "Inventory",          blurb: "Photo-first catalogue, batches, expiry",           href: "/trade/workstation" },
  { slug: "stock",           group: "Inventory",  status: "preview", title: "Stock Operations",   blurb: "Transfers, counts, adjustments, reorder points",   href: "/trade/stock" },
  { slug: "branches",        group: "Inventory",  status: "preview", title: "Multi-Branch",       blurb: "Per-branch stock and consolidated view",           href: "/trade/branches" },
  { slug: "labels",          group: "Inventory",  status: "preview", title: "Barcode Labels",     blurb: "Designer, sheet preview, print queue",             href: "/trade/labels" },

  { slug: "suppliers",       group: "Purchasing", status: "preview", title: "Suppliers",          blurb: "Vendor master, ledgers, contact directory",        href: "/trade/suppliers" },
  { slug: "purchase-orders", group: "Purchasing", status: "preview", title: "Purchase Orders",    blurb: "Create POs, receive goods, landed cost",           href: "/trade/purchase-orders" },

  { slug: "accounting",      group: "Accounting", status: "preview", title: "Chart Of Accounts",  blurb: "Five-class GL tree, opening balances",             href: "/trade/accounting/coa" },
  { slug: "journals",        group: "Accounting", status: "preview", title: "Journals & Ledger",  blurb: "Double-entry posting, GL drill-down",              href: "/trade/accounting/journals" },
  { slug: "financials",      group: "Accounting", status: "preview", title: "Financial Reports",  blurb: "P&L, Balance Sheet, Cash Flow",                    href: "/trade/accounting/reports" },
  { slug: "expenses",        group: "Accounting", status: "preview", title: "Expenses",           blurb: "Petty cash, approvals, attached receipts",         href: "/trade/expenses" },
  { slug: "tax",             group: "Accounting", status: "preview", title: "Tax Engine",         blurb: "VAT + NHIL + GETFund + COVID, GRA E-VAT",          href: "/trade/tax" },
  { slug: "reconciliation",  group: "Accounting", status: "preview", title: "Bank & MoMo Recon",  blurb: "Match statement to ledger, find variances",        href: "/trade/reconciliation" },

  { slug: "shifts",          group: "Operations", status: "preview", title: "Shifts & Till",      blurb: "Open, close, declare cash, Z-report",              href: "/trade/shifts" },
  { slug: "payroll",         group: "Operations", status: "preview", title: "Payroll",            blurb: "SSNIT Tier 1/2/3, PAYE, payslips",                 href: "/trade/payroll" },
  { slug: "analytics",       group: "Operations", status: "live",    title: "Analytics",          blurb: "Revenue trends, top sellers, mix",                 href: "/trade/workstation" },
  { slug: "reports",         group: "Operations", status: "preview", title: "Reports Library",    blurb: "30+ pre-built reports, schedule, export",          href: "/trade/reports" },

  { slug: "audit",           group: "Admin",      status: "preview", title: "Audit Log",          blurb: "Who did what, immutable, exportable",              href: "/trade/audit" },
  { slug: "roles",           group: "Admin",      status: "preview", title: "Roles & Access",     blurb: "Granular module x action permissions",             href: "/trade/roles" },
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

export const MOCK_TIERS: MockLoyaltyTier[] = [
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




