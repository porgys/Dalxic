import type { VerticalConfig } from "./types"

const RESTAURANT_MODULES_ALL = [
  "menu", "tables", "kds", "tips", "pos", "inventory",
  "customers", "loyalty", "shifts", "reports", "audit", "roles",
]

export const RESTAURANT: VerticalConfig = {
  type: "restaurant",
  label: "Dine",
  brand: "DalxicDine",
  accent: "amber",
  paymentGate: "pay_after",
  defaultBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"],

  labelConfig: {
    consultation: "Waiter Walks Menu",
    procedure: "Kitchen Prep",
    product: "Food & Drink",
    admission: "Diner → Table",
    recurring: "Tab / VIP",
    admin: "Staff Roles",
  },

  roles: {
    waiter:      { label: "Waiter",      modules: ["pos", "tables", "tips", "customers"] },
    kitchen:     { label: "Kitchen",     modules: ["kds", "menu", "inventory"] },
    bartender:   { label: "Bartender",   modules: ["pos", "inventory"] },
    host:        { label: "Host",        modules: ["tables", "customers"] },
    manager:     { label: "Manager",     modules: RESTAURANT_MODULES_ALL },
    admin:       { label: "Administrator", modules: RESTAURANT_MODULES_ALL },
    owner:       { label: "Owner",         modules: RESTAURANT_MODULES_ALL },
    super_admin: { label: "Super Admin",   modules: RESTAURANT_MODULES_ALL },
  },
}
