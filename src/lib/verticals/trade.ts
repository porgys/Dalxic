import type { VerticalConfig } from "./types"

const TRADE_MODULES_ALL = [
  "pos", "inventory", "stock", "branches", "customers", "loyalty",
  "suppliers", "po", "accounting", "expenses", "tax", "shifts",
  "payroll", "reports", "audit", "roles", "labels",
]

export const TRADE: VerticalConfig = {
  type: "trade",
  label: "Trade",
  brand: "DalxicTrade",
  accent: "amber",
  paymentGate: "pay_after",
  defaultBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"],

  labelConfig: {
    consultation: "Customer Assist",
    procedure: "Warehouse Pick",
    product: "Goods",
    admission: "Product → Shelf",
    recurring: "Supplier Credit",
    admin: "Bookkeeping",
  },

  roles: {
    cashier:         { label: "Cashier",          modules: ["pos", "shifts", "customers"] },
    inventory_clerk: { label: "Inventory Clerk",  modules: ["inventory", "stock", "suppliers", "po", "labels"] },
    accountant:      { label: "Accountant",       modules: ["accounting", "expenses", "tax", "reports", "payroll"] },
    manager:         { label: "Manager",          modules: TRADE_MODULES_ALL },
    admin:           { label: "Administrator",    modules: TRADE_MODULES_ALL },
    owner:           { label: "Owner",            modules: TRADE_MODULES_ALL },
    super_admin:     { label: "Super Admin",      modules: TRADE_MODULES_ALL },
  },
}
