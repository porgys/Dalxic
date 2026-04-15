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

export type Vertical = "trade" | "institute"
export type TenantStatus = "trial" | "active" | "past_due" | "suspended" | "churned"
export type TenantTier = "starter" | "growth" | "scale" | "enterprise"

export interface MockTenant {
  id: string
  code: string
  name: string
  vertical: Vertical
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
}

export const MOCK_TENANTS: MockTenant[] = [
  { id: "TN-0001", code: "KASOA-MART",    name: "Kasoa SuperMart",            vertical: "trade",     tier: "scale",      status: "active",   region: "Central",    country: "Ghana",   branches: 4, users: 22, mrr: 1450, joinedOn: "2024-09-12", renewsOn: "2026-09-12", lastSeen: "2026-04-15 09:14", ownerName: "Mr. Asante",      ownerPhone: "+233 24 555 0101", ownerEmail: "mr.asante@kasoa-mart.gh",     health: 92, activeModules: ["pos","inventory","stock","branches","customers","loyalty","suppliers","po","accounting","expenses","tax","shifts","reports","audit","roles"], activeAddons: ["sms-5k","whatsapp-3k"] },
  { id: "TN-0002", code: "TEMA-PHARM",    name: "Tema Community Pharmacy",    vertical: "trade",     tier: "growth",     status: "active",   region: "Greater Accra", country: "Ghana", branches: 2, users: 9,  mrr: 680,  joinedOn: "2025-02-04", renewsOn: "2026-08-04", lastSeen: "2026-04-15 08:42", ownerName: "Mrs. Mensah",     ownerPhone: "+233 55 111 0202", ownerEmail: "pharm@tema-pharm.gh",         health: 88, activeModules: ["pos","inventory","customers","loyalty","suppliers","reports"], activeAddons: ["sms-5k"] },
  { id: "TN-0003", code: "KUMASI-BLD",    name: "Ashanti Building Supplies",  vertical: "trade",     tier: "enterprise", status: "active",   region: "Ashanti",    country: "Ghana",   branches: 9, users: 58, mrr: 3200, joinedOn: "2024-03-22", renewsOn: "2027-03-22", lastSeen: "2026-04-15 09:02", ownerName: "Mr. Osei",        ownerPhone: "+233 20 333 0303", ownerEmail: "owner@ashanti-bld.gh",       health: 96, activeModules: ["pos","inventory","stock","branches","customers","loyalty","suppliers","po","accounting","expenses","tax","shifts","payroll","reports","audit","roles","labels"], activeAddons: ["sms-20k","whatsapp-10k","extra-branches-3","priority-support"] },
  { id: "TN-0004", code: "ACCRA-BOUTIQ",  name: "Osu Boutique Co.",           vertical: "trade",     tier: "growth",     status: "active",   region: "Greater Accra", country: "Ghana", branches: 2, users: 6,  mrr: 540,  joinedOn: "2025-07-14", renewsOn: "2026-07-14", lastSeen: "2026-04-14 22:18", ownerName: "Ms. Akosua",      ownerPhone: "+233 24 777 0404", ownerEmail: "akosua@osu-boutique.gh",     health: 79, activeModules: ["pos","inventory","customers","loyalty","reports"], activeAddons: [] },
  { id: "TN-0005", code: "LEGON-ACAD",    name: "Legon Preparatory School",   vertical: "institute", tier: "scale",      status: "active",   region: "Greater Accra", country: "Ghana", branches: 1, users: 34, mrr: 980,  joinedOn: "2024-08-01", renewsOn: "2026-08-01", lastSeen: "2026-04-15 07:30", ownerName: "Dr. Ofori",       ownerPhone: "+233 27 888 0505", ownerEmail: "head@legon-prep.edu.gh",     health: 94, activeModules: ["enrollment","gradebook","fees","attendance","parents","reports","audit","roles"], activeAddons: ["sms-10k","parent-portal"] },
  { id: "TN-0006", code: "CAPE-JUNIOR",   name: "Cape Coast Junior Academy",  vertical: "institute", tier: "growth",     status: "active",   region: "Central",    country: "Ghana",   branches: 1, users: 18, mrr: 420,  joinedOn: "2025-09-03", renewsOn: "2026-09-03", lastSeen: "2026-04-15 06:58", ownerName: "Mr. Quarshie",    ownerPhone: "+233 26 444 0606", ownerEmail: "admin@cape-junior.edu.gh",   health: 85, activeModules: ["enrollment","gradebook","fees","attendance"], activeAddons: ["sms-5k"] },
  { id: "TN-0007", code: "SUNYANI-NGO",   name: "Hope Sunyani Outreach",      vertical: "institute", tier: "starter",    status: "trial",    region: "Bono",       country: "Ghana",   branches: 1, users: 4,  mrr: 0,    joinedOn: "2026-04-01", renewsOn: "2026-04-30", lastSeen: "2026-04-14 15:10", ownerName: "Pastor Boateng",  ownerPhone: "+233 54 999 0707", ownerEmail: "boateng@hope-sunyani.org",   health: 62, activeModules: ["enrollment","attendance"], activeAddons: [] },
  { id: "TN-0008", code: "TAKORADI-FISH", name: "Takoradi Fish Market Co.",   vertical: "trade",     tier: "starter",    status: "active",   region: "Western",    country: "Ghana",   branches: 1, users: 3,  mrr: 180,  joinedOn: "2026-01-18", renewsOn: "2026-07-18", lastSeen: "2026-04-15 07:00", ownerName: "Mama Araba",      ownerPhone: "+233 50 222 0808", ownerEmail: "mama@takoradi-fish.gh",      health: 71, activeModules: ["pos","inventory","reports"], activeAddons: [] },
  { id: "TN-0009", code: "MADINA-AUTO",   name: "Madina Auto Spares",         vertical: "trade",     tier: "growth",     status: "past_due", region: "Greater Accra", country: "Ghana", branches: 1, users: 7,  mrr: 680,  joinedOn: "2024-11-02", renewsOn: "2026-04-02", lastSeen: "2026-04-13 18:44", ownerName: "Mr. Yeboah",      ownerPhone: "+233 20 666 0909", ownerEmail: "yeboah@madina-auto.gh",      health: 48, activeModules: ["pos","inventory","suppliers","po","reports"], activeAddons: ["sms-5k"] },
  { id: "TN-0010", code: "ELMINA-TOUR",   name: "Elmina Heritage Tours",      vertical: "trade",     tier: "scale",      status: "active",   region: "Central",    country: "Ghana",   branches: 3, users: 14, mrr: 1200, joinedOn: "2024-12-10", renewsOn: "2026-12-10", lastSeen: "2026-04-15 09:25", ownerName: "Ms. Efua",        ownerPhone: "+233 27 555 1010", ownerEmail: "efua@elmina-tours.gh",       health: 91, activeModules: ["pos","inventory","customers","loyalty","accounting","reports","audit","roles"], activeAddons: ["whatsapp-10k"] },
  { id: "TN-0011", code: "HO-WELLNESS",   name: "Ho Wellness Pharmacy",       vertical: "trade",     tier: "starter",    status: "suspended",region: "Volta",      country: "Ghana",   branches: 1, users: 2,  mrr: 0,    joinedOn: "2025-03-04", renewsOn: "2026-02-04", lastSeen: "2026-02-10 12:00", ownerName: "Mr. Agbeko",      ownerPhone: "+233 24 123 1111", ownerEmail: "agbeko@ho-wellness.gh",      health: 12, activeModules: [], activeAddons: [] },
  { id: "TN-0012", code: "TAMALE-TECH",   name: "Tamale Tech Hub School",     vertical: "institute", tier: "enterprise", status: "active",   region: "Northern",   country: "Ghana",   branches: 2, users: 42, mrr: 2400, joinedOn: "2024-02-18", renewsOn: "2027-02-18", lastSeen: "2026-04-15 08:10", ownerName: "Dr. Seidu",       ownerPhone: "+233 20 444 1212", ownerEmail: "seidu@tamale-tech.edu.gh",   health: 97, activeModules: ["enrollment","gradebook","fees","attendance","parents","library","exams","reports","audit","roles","timetable","transport"], activeAddons: ["sms-20k","parent-portal","priority-support","extra-users-20"] },
  { id: "TN-0013", code: "KOFORIDUA-MKT", name: "Koforidua Central Market",   vertical: "trade",     tier: "growth",     status: "active",   region: "Eastern",    country: "Ghana",   branches: 3, users: 11, mrr: 720,  joinedOn: "2025-06-22", renewsOn: "2026-06-22", lastSeen: "2026-04-15 08:55", ownerName: "Mr. Boateng",     ownerPhone: "+233 26 777 1313", ownerEmail: "boateng@kofo-market.gh",     health: 83, activeModules: ["pos","inventory","stock","branches","customers","suppliers","reports"], activeAddons: ["sms-5k"] },
  { id: "TN-0014", code: "WINNEBA-COL",   name: "Winneba Community College",  vertical: "institute", tier: "scale",      status: "trial",    region: "Central",    country: "Ghana",   branches: 1, users: 22, mrr: 0,    joinedOn: "2026-03-20", renewsOn: "2026-05-20", lastSeen: "2026-04-15 07:42", ownerName: "Prof. Nkrumah",   ownerPhone: "+233 55 888 1414", ownerEmail: "nkrumah@winneba-col.edu.gh", health: 76, activeModules: ["enrollment","gradebook","fees","attendance","exams"], activeAddons: [] },
  { id: "TN-0015", code: "DANSOMAN-CLIN", name: "Dansoman Clinical Store",    vertical: "trade",     tier: "growth",     status: "active",   region: "Greater Accra", country: "Ghana", branches: 1, users: 5,  mrr: 540,  joinedOn: "2025-05-11", renewsOn: "2026-05-11", lastSeen: "2026-04-15 09:30", ownerName: "Dr. Amponsah",    ownerPhone: "+233 24 999 1515", ownerEmail: "amponsah@dansoman-clin.gh",  health: 87, activeModules: ["pos","inventory","customers","suppliers","reports"], activeAddons: ["whatsapp-3k"] },
  { id: "TN-0016", code: "BOLGA-COOP",    name: "Bolgatanga Farmers Co-op",   vertical: "trade",     tier: "starter",    status: "active",   region: "Upper East", country: "Ghana",   branches: 1, users: 3,  mrr: 180,  joinedOn: "2026-02-12", renewsOn: "2026-08-12", lastSeen: "2026-04-14 17:30", ownerName: "Mr. Azure",       ownerPhone: "+233 27 666 1616", ownerEmail: "azure@bolga-coop.gh",        health: 74, activeModules: ["pos","inventory","reports"], activeAddons: [] },
  { id: "TN-0017", code: "ACCRA-MALL-KS", name: "Accra Mall Kids Store",      vertical: "trade",     tier: "growth",     status: "active",   region: "Greater Accra", country: "Ghana", branches: 1, users: 8,  mrr: 680,  joinedOn: "2025-08-19", renewsOn: "2026-08-19", lastSeen: "2026-04-15 08:20", ownerName: "Ms. Yaa",         ownerPhone: "+233 20 111 1717", ownerEmail: "yaa@accramall-kids.gh",      health: 89, activeModules: ["pos","inventory","customers","loyalty","reports"], activeAddons: ["sms-5k","whatsapp-3k"] },
  { id: "TN-0018", code: "AXIM-ACADEMY",  name: "Axim Seaside Academy",       vertical: "institute", tier: "growth",     status: "past_due", region: "Western",    country: "Ghana",   branches: 1, users: 12, mrr: 420,  joinedOn: "2025-01-07", renewsOn: "2026-03-07", lastSeen: "2026-04-12 09:10", ownerName: "Mr. Arhin",       ownerPhone: "+233 54 222 1818", ownerEmail: "arhin@axim-academy.edu.gh",  health: 51, activeModules: ["enrollment","gradebook","attendance"], activeAddons: [] },
  { id: "TN-0019", code: "OBUASI-FOOD",   name: "Obuasi Food Hall",           vertical: "trade",     tier: "scale",      status: "active",   region: "Ashanti",    country: "Ghana",   branches: 2, users: 16, mrr: 1200, joinedOn: "2024-10-30", renewsOn: "2026-10-30", lastSeen: "2026-04-15 09:00", ownerName: "Mr. Adusei",      ownerPhone: "+233 26 333 1919", ownerEmail: "adusei@obuasi-food.gh",      health: 90, activeModules: ["pos","inventory","stock","branches","customers","loyalty","suppliers","accounting","tax","shifts","reports","audit","roles"], activeAddons: ["sms-10k","extra-branches-2"] },
  { id: "TN-0020", code: "NAVRONGO-TECH", name: "Navrongo Technical Institute", vertical: "institute", tier: "scale",   status: "active",   region: "Upper East", country: "Ghana",   branches: 1, users: 28, mrr: 980,  joinedOn: "2024-05-15", renewsOn: "2026-05-15", lastSeen: "2026-04-15 08:02", ownerName: "Dr. Apaak",       ownerPhone: "+233 24 444 2020", ownerEmail: "apaak@navrongo-tech.edu.gh", health: 93, activeModules: ["enrollment","gradebook","fees","attendance","parents","exams","library","reports","roles"], activeAddons: ["parent-portal"] },
  { id: "TN-0021", code: "TECHIMAN-GEN",  name: "Techiman General Store",     vertical: "trade",     tier: "starter",    status: "churned",  region: "Bono East",  country: "Ghana",   branches: 1, users: 0,  mrr: 0,    joinedOn: "2025-04-18", renewsOn: "2026-01-18", lastSeen: "2025-12-28 14:22", ownerName: "Mr. Kofi",        ownerPhone: "+233 20 555 2121", ownerEmail: "—",                          health: 0,  activeModules: [], activeAddons: [] },
  { id: "TN-0022", code: "ABURI-GARDEN",  name: "Aburi Garden Café & Shop",   vertical: "trade",     tier: "growth",     status: "active",   region: "Eastern",    country: "Ghana",   branches: 1, users: 5,  mrr: 540,  joinedOn: "2025-11-08", renewsOn: "2026-11-08", lastSeen: "2026-04-15 08:48", ownerName: "Ms. Akua",        ownerPhone: "+233 55 333 2222", ownerEmail: "akua@aburi-garden.gh",       health: 86, activeModules: ["pos","inventory","customers","loyalty","reports"], activeAddons: ["whatsapp-3k"] },
  { id: "TN-0023", code: "LABONE-PREP",   name: "Labone Montessori",          vertical: "institute", tier: "growth",     status: "active",   region: "Greater Accra", country: "Ghana", branches: 1, users: 14, mrr: 420,  joinedOn: "2025-10-02", renewsOn: "2026-10-02", lastSeen: "2026-04-15 06:40", ownerName: "Ms. Adjoa",       ownerPhone: "+233 24 666 2323", ownerEmail: "adjoa@labone-mont.edu.gh",   health: 88, activeModules: ["enrollment","gradebook","attendance","parents"], activeAddons: ["sms-5k"] },
  { id: "TN-0024", code: "WA-WHOLESALE",  name: "Wa Wholesale Depot",         vertical: "trade",     tier: "scale",      status: "active",   region: "Upper West", country: "Ghana",   branches: 2, users: 12, mrr: 1200, joinedOn: "2025-03-28", renewsOn: "2026-03-28", lastSeen: "2026-04-15 08:12", ownerName: "Al-Hajj Musah",   ownerPhone: "+233 27 111 2424", ownerEmail: "musah@wa-wholesale.gh",      health: 84, activeModules: ["pos","inventory","stock","branches","suppliers","po","accounting","reports","roles"], activeAddons: ["sms-10k"] },
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
}

export const MOCK_TIERS: MockTier[] = [
  {
    id: "starter", name: "Starter", tagline: "Single counter. Solo trader. Just enough.",
    monthly: 180, annual: 1800,
    branchLimit: 1, userLimit: 3, txLimit: 3000,
    supportSLA: "Email · 72h",
    modules: ["pos", "inventory", "reports"],
    accent: "neutral",
  },
  {
    id: "growth", name: "Growth", tagline: "Two counters. Loyalty. First SMS blast.",
    monthly: 420, annual: 4200,
    branchLimit: 2, userLimit: 10, txLimit: 15000,
    supportSLA: "Email · 24h",
    modules: ["pos","inventory","customers","loyalty","suppliers","reports","audit"],
    accent: "sky",
    popular: true,
  },
  {
    id: "scale", name: "Scale", tagline: "Multi-branch. Payroll. Tax ready. The ERP.",
    monthly: 980, annual: 9800,
    branchLimit: 5, userLimit: 40, txLimit: 75000,
    supportSLA: "Phone · 4h",
    modules: ["pos","inventory","stock","branches","customers","loyalty","suppliers","po","accounting","expenses","tax","shifts","payroll","reports","audit","roles","labels"],
    accent: "emerald",
  },
  {
    id: "enterprise", name: "Enterprise", tagline: "Unlimited everything. Dedicated CSM.",
    monthly: 2400, annual: 24000,
    branchLimit: "unlimited", userLimit: "unlimited", txLimit: "unlimited",
    supportSLA: "24/7 · 1h · Named CSM",
    modules: ["pos","inventory","stock","branches","customers","loyalty","suppliers","po","accounting","expenses","tax","shifts","payroll","reports","audit","roles","labels"],
    accent: "amber",
  },
]

/* ───── Modules (catalog across both verticals) ───── */

export interface MockModule {
  id: string
  name: string
  vertical: Vertical | "both"
  category: string
  description: string
  icon: string
  minTier: TenantTier
  addonPrice?: number
  dependencies?: string[]
  adoption: number
  status: "ga" | "beta" | "preview"
}

export const MOCK_MODULES: MockModule[] = [
  // Trade
  { id: "pos",         name: "Point of Sale",      vertical: "trade",     category: "Storefront",   description: "Touch-first POS. Cash, MoMo, card. Offline fallback.",                  icon: "pos",         minTier: "starter",    adoption: 100, status: "ga" },
  { id: "inventory",   name: "Inventory",          vertical: "trade",     category: "Storefront",   description: "Products, variants, barcodes, reorder points.",                          icon: "inventory",   minTier: "starter",    adoption: 100, status: "ga" },
  { id: "stock",       name: "Stock Movements",    vertical: "trade",     category: "Operations",   description: "Transfers between branches, counts, adjustments.",                       icon: "stock",       minTier: "scale",      dependencies: ["inventory","branches"], adoption: 48, status: "ga" },
  { id: "branches",    name: "Multi-Branch",       vertical: "trade",     category: "Operations",   description: "Branches, registers, per-branch permissions.",                            icon: "branches",    minTier: "growth",     adoption: 62, status: "ga" },
  { id: "customers",   name: "Customer Book",      vertical: "trade",     category: "CRM",          description: "Profiles, purchase history, credit ledger.",                              icon: "customers",   minTier: "growth",     adoption: 78, status: "ga" },
  { id: "loyalty",     name: "Loyalty & Promos",   vertical: "trade",     category: "CRM",          description: "Tiers, points, BOGOF, coupons, promotions.",                               icon: "loyalty",     minTier: "growth",     dependencies: ["customers"], adoption: 54, status: "ga" },
  { id: "suppliers",   name: "Suppliers",          vertical: "trade",     category: "Procurement",  description: "Supplier directory, lead times, payables.",                               icon: "suppliers",   minTier: "growth",     adoption: 68, status: "ga" },
  { id: "po",          name: "Purchase Orders",    vertical: "trade",     category: "Procurement",  description: "PO creation, receipt, 3-way match.",                                       icon: "po",          minTier: "scale",      dependencies: ["suppliers","inventory"], adoption: 42, status: "ga" },
  { id: "accounting",  name: "Accounting",         vertical: "both",      category: "Finance",      description: "Chart of accounts, journals, general ledger.",                             icon: "coa",         minTier: "scale",      adoption: 38, status: "ga" },
  { id: "expenses",    name: "Expenses",           vertical: "both",      category: "Finance",      description: "Expense capture, categorisation, approval flow.",                          icon: "expenses",    minTier: "growth",     adoption: 58, status: "ga" },
  { id: "tax",         name: "Tax Engine",         vertical: "both",      category: "Finance",      description: "Ghana VAT, NHIL, GETFund, COVID Levy. GRA-ready.",                        icon: "tax",         minTier: "scale",      dependencies: ["accounting"], adoption: 34, status: "ga" },
  { id: "shifts",      name: "Shifts & Z-Report",  vertical: "trade",     category: "Operations",   description: "Open/close tills, cash reconciliation, Z-reports.",                        icon: "shifts",      minTier: "scale",      dependencies: ["pos"], adoption: 40, status: "ga" },
  { id: "payroll",     name: "Payroll",            vertical: "both",      category: "HR",           description: "SSNIT Tier 1 & 2, PAYE bands, payslips.",                                 icon: "payroll",     minTier: "scale",      addonPrice: 120, adoption: 28, status: "ga" },
  { id: "reports",     name: "Reports Library",    vertical: "both",      category: "Insights",     description: "33+ reports: sales, tax, inventory, payroll, audit.",                     icon: "reports",     minTier: "starter",    adoption: 100, status: "ga" },
  { id: "audit",       name: "Audit Log",          vertical: "both",      category: "Governance",   description: "Immutable event stream. Who did what, when.",                              icon: "audit",       minTier: "growth",     adoption: 72, status: "ga" },
  { id: "roles",       name: "Roles & Permissions",vertical: "both",      category: "Governance",   description: "Role matrix across modules, branch scoping.",                              icon: "roles",       minTier: "scale",      adoption: 46, status: "ga" },
  { id: "labels",      name: "Barcode Labels",     vertical: "trade",     category: "Operations",   description: "Shelf labels, price tags, thermal + A4 sheet.",                            icon: "labels",      minTier: "growth",     dependencies: ["inventory"], adoption: 32, status: "ga" },

  // Institute
  { id: "enrollment",  name: "Enrollment",         vertical: "institute", category: "Admissions",   description: "Student intake, application workflow, waitlist.",                          icon: "customers",   minTier: "starter",    adoption: 100, status: "ga" },
  { id: "gradebook",   name: "Gradebook",          vertical: "institute", category: "Academic",     description: "Scores, GPA, WAEC-style transcript.",                                      icon: "reports",     minTier: "growth",     adoption: 88, status: "ga" },
  { id: "fees",        name: "Fees & Billing",     vertical: "institute", category: "Finance",      description: "Term fees, instalments, MoMo collection.",                                icon: "billing",     minTier: "growth",     adoption: 78, status: "ga" },
  { id: "attendance",  name: "Attendance",         vertical: "institute", category: "Academic",     description: "Daily roll call, absence SMS to parents.",                                 icon: "check",       minTier: "starter",    adoption: 92, status: "ga" },
  { id: "parents",     name: "Parent Portal",      vertical: "institute", category: "Communication",description: "Parent login, fee balance, report cards.",                                icon: "customers",   minTier: "growth",     addonPrice: 80, dependencies: ["gradebook"], adoption: 44, status: "ga" },
  { id: "library",     name: "Library",            vertical: "institute", category: "Operations",   description: "Book catalog, check-out, fines.",                                          icon: "modules",     minTier: "scale",      adoption: 22, status: "beta" },
  { id: "exams",       name: "Exams",              vertical: "institute", category: "Academic",     description: "Timetable, seat plan, mark entry, reports.",                               icon: "calendar",    minTier: "growth",     adoption: 58, status: "ga" },
  { id: "timetable",   name: "Timetable",          vertical: "institute", category: "Academic",     description: "Class schedule, teacher workload, clash detection.",                       icon: "calendar",    minTier: "scale",      adoption: 32, status: "beta" },
  { id: "transport",   name: "Transport",          vertical: "institute", category: "Operations",   description: "Bus routes, stops, driver assignment.",                                    icon: "branches",    minTier: "enterprise", adoption: 14, status: "preview" },
]

/* ───── Add-ons ───── */

export interface MockAddon {
  id: string
  name: string
  description: string
  price: number
  unit: string
  category: "messaging" | "capacity" | "support" | "integration"
  icon: string
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
  vertical: Vertical | "both"
  releasedOn: string
  stage: ReleaseStage
  rolloutPct: number
  summary: string
  modules: string[]
  breaking: boolean
}

export const MOCK_RELEASES: MockRelease[] = [
  { id: "RL-042", version: "v4.2.0",  title: "WhatsApp bulk composer",          vertical: "both",      releasedOn: "2026-04-14", stage: "canary",     rolloutPct: 15,  summary: "Multi-recipient WhatsApp templates with preview. Meta rate-limit aware.", modules: ["whatsapp-3k","whatsapp-10k"], breaking: false },
  { id: "RL-041", version: "v4.1.0",  title: "Barcode label designer",          vertical: "trade",     releasedOn: "2026-04-11", stage: "rolling",    rolloutPct: 72,  summary: "30x20, 50x30, A4-24, A4-40 layouts. EAN-13 barcode. Preview + print.", modules: ["labels"], breaking: false },
  { id: "RL-040", version: "v4.0.0",  title: "Payroll engine — Ghana 2026",     vertical: "both",      releasedOn: "2026-04-05", stage: "stable",     rolloutPct: 100, summary: "SSNIT Tier 1 & 2, PAYE bands updated for 2026 tax year.",               modules: ["payroll"], breaking: true },
  { id: "RL-039", version: "v3.9.0",  title: "Tax engine — VAT-3 export",       vertical: "both",      releasedOn: "2026-03-28", stage: "stable",     rolloutPct: 100, summary: "One-click VAT-3 PDF export for GRA submission.",                        modules: ["tax"], breaking: false },
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

export const MOCK_MRR_SERIES = [
  { month: "Oct 25", mrr: 12840, newMrr: 1680, churnMrr: 280 },
  { month: "Nov 25", mrr: 14220, newMrr: 1580, churnMrr: 200 },
  { month: "Dec 25", mrr: 15680, newMrr: 1680, churnMrr: 220 },
  { month: "Jan 26", mrr: 17420, newMrr: 1920, churnMrr: 180 },
  { month: "Feb 26", mrr: 19100, newMrr: 1820, churnMrr: 140 },
  { month: "Mar 26", mrr: 20740, newMrr: 1760, churnMrr: 120 },
  { month: "Apr 26", mrr: 22420, newMrr: 1860, churnMrr: 180 },
]

export const MOCK_REGIONS = [
  { region: "Greater Accra", tenants: 7,  mrr: 5430 },
  { region: "Ashanti",       tenants: 3,  mrr: 5600 },
  { region: "Central",       tenants: 3,  mrr: 2600 },
  { region: "Northern",      tenants: 1,  mrr: 2400 },
  { region: "Upper East",    tenants: 2,  mrr: 1160 },
  { region: "Upper West",    tenants: 1,  mrr: 1200 },
  { region: "Western",       tenants: 2,  mrr: 600  },
  { region: "Eastern",       tenants: 2,  mrr: 1260 },
  { region: "Volta",         tenants: 1,  mrr: 0    },
  { region: "Bono",          tenants: 1,  mrr: 0    },
  { region: "Bono East",     tenants: 1,  mrr: 0    },
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
