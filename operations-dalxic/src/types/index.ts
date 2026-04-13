// DalxicOperations — Shared TypeScript Types

// ─── Organization ───

export interface Organization {
  id: string;
  code: string;
  name: string;
  logoUrl: string | null;
  tagline: string | null;
  type: "trade" | "institute";
  tier: string;
  activeModules: string[];
  maxOperators: number;
  whatsappBundle: number;
  active: boolean;
  meta: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Operator (PIN Auth) ───

export type OperatorRole = "cashier" | "manager" | "admin" | "teacher" | "accountant" | "registrar";

export interface Operator {
  id: string;
  orgId: string;
  name: string;
  phone: string | null;
  pin: string;
  role: OperatorRole;
  meta: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

// ─── Audit ───

export type ActorType = "operator" | "system" | "api";

export interface AuditLogEntry {
  id: string;
  actorType: ActorType;
  actorId: string;
  orgId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string;
  timestamp: Date;
}

// ─── Trade: Category ───

export interface Category {
  id: string;
  orgId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

// ─── Trade: Product ───

export interface Product {
  id: string;
  orgId: string;
  categoryId: string;
  name: string;
  sku: string | null;
  unit: string;
  costPrice: number;      // pesewas
  sellingPrice: number;    // pesewas
  stock: number;
  minStock: number;
  photoUrl: string | null;
  batchNo: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Trade: Sale ───

export type PaymentStatus = "PENDING" | "PAID" | "PARTIAL" | "REFUNDED";
export type PaymentMethod = "CASH" | "MOMO" | "CARD" | "BANK_TRANSFER" | "CREDIT";

export interface Sale {
  id: string;
  orgId: string;
  receiptCode: string;
  customerName: string | null;
  customerPhone: string | null;
  subtotal: number;        // pesewas
  discount: number;        // pesewas
  total: number;           // pesewas
  paymentMethod: PaymentMethod | null;
  paymentRef: string | null;
  paymentStatus: PaymentStatus;
  soldBy: string;
  soldByName: string;
  createdAt: Date;
  items: SaleItem[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  unitPrice: number;       // pesewas
  quantity: number;
  total: number;           // pesewas
}

// ─── Trade: Stock Movement ───

export type StockMovementType = "RECEIVED" | "SOLD" | "ADJUSTED" | "RETURNED" | "EXPIRED";

export interface StockMovement {
  id: string;
  orgId: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string | null;
  performedBy: string;
  notes: string | null;
  createdAt: Date;
}

// ─── Institute: Group ───

export type GroupType = "class" | "cohort" | "department" | "custom";

export interface Group {
  id: string;
  orgId: string;
  name: string;
  type: GroupType;
  isActive: boolean;
}

// ─── Institute: Member ───

export interface Member {
  id: string;
  orgId: string;
  name: string;
  role: string;
  status: string;
  groupId: string | null;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  enrolledAt: Date;
  meta: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Institute: Staff ───

export interface Staff {
  id: string;
  orgId: string;
  name: string;
  role: string;
  department: string;
  phone: string | null;
  email: string | null;
  status: string;
  meta: Record<string, unknown> | null;
  createdAt: Date;
}

// ─── Institute: Fee ───

export type FeeStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE" | "WAIVED";

export interface FeeRecord {
  id: string;
  orgId: string;
  memberId: string;
  description: string;
  amount: number;          // pesewas
  paid: number;            // pesewas
  balance: number;         // pesewas
  status: FeeStatus;
  dueDate: Date | null;
  createdAt: Date;
  payments: FeePayment[];
}

export interface FeePayment {
  id: string;
  feeRecordId: string;
  amount: number;          // pesewas
  paymentMethod: string;
  paymentRef: string | null;
  receivedBy: string;
  receivedAt: Date;
  notes: string | null;
}

// ─── Institute: Schedule ───

export interface ScheduleSlot {
  id: string;
  orgId: string;
  groupId: string;
  staffId: string | null;
  subject: string;
  dayOfWeek: number;       // 0=Mon, 1=Tue, ... 4=Fri
  startTime: string;       // "08:00"
  endTime: string;         // "09:00"
  room: string | null;
}

// ─── API Response Helpers ───

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Cart (Client-Side) ───

export interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;       // pesewas
  quantity: number;
  total: number;           // pesewas
}
