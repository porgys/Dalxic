export interface Organization {
  id: string;
  code: string;
  name: string;
  logoUrl: string | null;
  tagline: string | null;
  type: string;
  tier: string;
  activeBehaviours: string[];
  activeModules: string[];
  paymentGate: string;
  labelConfig: Record<string, unknown> | null;
  taxConfig: Record<string, number> | null;
  currency: string;
  timezone: string;
  maxOperators: number;
  maxBranches: number;
  whatsappBundle: number;
  active: boolean;
  meta: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export type OperatorRole = "cashier" | "manager" | "admin" | "doctor" | "nurse" | "pharmacist" | "lab_tech" | "receptionist" | "teacher" | "accountant" | "registrar";

export interface Operator {
  id: string;
  orgId: string;
  name: string;
  phone: string | null;
  pin: string;
  role: OperatorRole;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface AuditLogEntry {
  id: string;
  orgId: string;
  actorId: string;
  actorName: string;
  action: string;
  entity: string;
  entityId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ipAddress: string;
  timestamp: Date;
}

export interface ServiceCategory {
  id: string;
  orgId: string;
  name: string;
  sortOrder: number;
  parentId: string | null;
  isActive: boolean;
}

export interface ServiceItem {
  id: string;
  orgId: string;
  categoryId: string;
  name: string;
  sku: string | null;
  unit: string;
  description: string | null;
  behaviour: string;
  stockType: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  maxStock: number | null;
  batchNo: string | null;
  expiresAt: Date | null;
  capacityTotal: number | null;
  capacityUsed: number;
  recurringInterval: string | null;
  photoUrl: string | null;
  barcode: string | null;
  taxable: boolean;
  commissionRate: number;
  providerId: string | null;
  isActive: boolean;
  meta: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentStatus = "pending" | "completed" | "refunded" | "failed";
export type PaymentMethod = "cash" | "momo" | "card" | "bank_transfer" | "credit" | "insurance";

export interface CartItem {
  id: string;
  cartId: string;
  serviceItemId: string;
  behaviour: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  tax: number;
  total: number;
  meta: Record<string, unknown> | null;
}

export interface StockMovement {
  id: string;
  orgId: string;
  serviceItemId: string;
  branchId: string;
  type: string;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string | null;
  performedBy: string;
  notes: string | null;
  createdAt: Date;
}

export interface Contact {
  id: string;
  orgId: string;
  name: string;
  phone: string | null;
  email: string | null;
  type: string;
  status: string;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  allergies: string[];
  guardianId: string | null;
  groupId: string | null;
  insuranceType: string | null;
  insuranceId: string | null;
  loyaltyTier: string | null;
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  meta: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
