/* ═══════════════════════════════════════════════════════════════
   Sale Journey — shared types
   These are the contracts the spine components speak.
   Slot plug-ins must produce compatible shapes.
   ═══════════════════════════════════════════════════════════════ */

export interface Product {
  id: string
  name: string
  price: number          // GHS (not cents) — component-side representation
  stock: number
  category: string
  categoryId?: string
  photo?: string
  sku?: string
  expiresAt?: string
  batchNo?: string
  unit: string
}

export interface CartItem {
  product: Product
  qty: number
}

export type TenderMethod = "CASH" | "MOBILE_MONEY" | "CARD" | "CREDIT"

export interface TenderResult {
  method: TenderMethod
  amountTendered: number   // GHS
  change: number           // GHS
  reference?: string       // MoMo tx id, card auth, etc.
  customerPhone?: string
}

export interface CompletedSale {
  receiptCode: string
  total: number            // GHS
  items: { name: string; qty: number; price: number }[]
  method: TenderMethod
  customerName?: string
  customerPhone?: string
  change?: number
  timestamp: string        // ISO
  cashier: string
  orgName: string
}
