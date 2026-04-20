import { z } from "zod"
import { fail } from "./response"

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T | Response {
  const result = schema.safeParse(data)
  if (!result.success) return fail(result.error.issues[0].message)
  return result.data
}

const VALID_ROLES = ["cashier", "manager", "admin", "owner", "doctor", "nurse", "pharmacist", "lab_tech", "receptionist", "teacher", "accountant", "registrar"] as const
const BEHAVIOURS = ["consultation", "procedure", "product", "admission", "recurring"] as const
const STOCK_TYPES = ["physical", "capacity", "service"] as const
const PAYMENT_METHODS = ["cash", "momo", "card", "bank_transfer", "insurance", "credit"] as const
const RETURN_TYPES = ["void", "refund"] as const
const RETURN_REASONS = ["defective", "wrong_item", "overcharge", "customer_request", "other"] as const
const REFUND_METHODS = ["cash", "momo", "credit"] as const
const CONTACT_TYPES = ["patient", "customer", "student", "member", "guest", "supplier"] as const
const GENDERS = ["male", "female", "other"] as const
const CLINICAL_TYPES = ["vitals", "consultation", "prescription", "lab_order", "lab_result", "procedure_note", "discharge"] as const
const CLINICAL_STATUSES = ["draft", "active", "completed"] as const
const GROUP_TYPES = ["class", "cohort", "department", "custom"] as const
const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"] as const
const RECURRING_INTERVALS = ["daily", "weekly", "monthly", "termly", "yearly"] as const
const SSNIT_TIERS = ["T1", "T2"] as const
const MESSAGE_TYPES = ["whatsapp", "sms"] as const

export const loginSchema = z.object({
  orgCode: z.string().min(1).max(20),
  pin: z.string().min(4).max(8),
}).strict()

export const createOperatorSchema = z.object({
  name: z.string().min(2).max(200),
  phone: z.string().max(20).optional(),
  pin: z.string().min(4).max(8),
  role: z.enum(VALID_ROLES),
  permissions: z.array(z.string()).optional(),
}).strict()

export const updateOrgSchema = z.object({
  name: z.string().max(200).optional(),
  logoUrl: z.string().url().optional().nullable(),
  tagline: z.string().max(500).optional().nullable(),
  labelConfig: z.any().optional().nullable(),
  taxConfig: z.any().optional().nullable(),
}).strict()

export const createBranchSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
}).strict()

export const createCategorySchema = z.object({
  name: z.string().min(1).max(200),
  sortOrder: z.number().int().min(0).optional(),
  parentId: z.string().optional(),
}).strict()

export const createServiceItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(200),
  sku: z.string().max(50).optional(),
  unit: z.string().max(20).default("piece"),
  description: z.string().max(2000).optional(),
  behaviour: z.enum(BEHAVIOURS),
  stockType: z.enum(STOCK_TYPES),
  costPrice: z.number().int().min(0).default(0),
  sellingPrice: z.number().int().min(0),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().min(0).optional(),
  batchNo: z.string().max(100).optional(),
  expiresAt: z.string().datetime().optional(),
  storageConditions: z.string().max(500).optional(),
  capacityTotal: z.number().int().min(0).optional(),
  recurringInterval: z.enum(RECURRING_INTERVALS).optional(),
  photoUrl: z.string().url().optional(),
  barcode: z.string().max(100).optional(),
  taxable: z.boolean().default(true),
  commissionRate: z.number().int().min(0).max(100).default(0),
  providerId: z.string().optional(),
  meta: z.any().optional(),
}).strict()

export const updateServiceItemSchema = createServiceItemSchema.partial().omit({ categoryId: true })

export const createCartSchema = z.object({
  branchId: z.string().min(1),
  contactId: z.string().optional(),
  paymentGate: z.enum(["pay_before", "pay_after"]).optional(),
  entryBehaviour: z.string().optional(),
  notes: z.string().max(2000).optional(),
}).strict()

export const addCartItemSchema = z.object({
  serviceItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(9999),
  discount: z.number().int().min(0).default(0),
}).strict()

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(9999),
}).strict()

export const paySchema = z.object({
  method: z.enum(PAYMENT_METHODS),
  amount: z.number().int().min(1),
  reference: z.string().max(200).optional(),
}).strict()

export const createReturnSchema = z.object({
  paymentId: z.string().min(1),
  branchId: z.string().min(1),
  type: z.enum(RETURN_TYPES),
  reason: z.enum(RETURN_REASONS),
  reasonText: z.string().max(2000).optional(),
  refundMethod: z.enum(REFUND_METHODS),
  items: z.array(z.object({
    serviceItemId: z.string().min(1),
    itemName: z.string().min(1).max(200),
    unitPrice: z.number().int().min(0),
    quantity: z.number().int().min(1),
    restock: z.boolean(),
  })).min(1),
}).strict()

export const createContactSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  type: z.enum(CONTACT_TYPES),
  dateOfBirth: z.string().optional(),
  gender: z.enum(GENDERS).optional(),
  bloodGroup: z.string().max(10).optional(),
  allergies: z.array(z.string()).optional(),
  guardianId: z.string().optional(),
  groupId: z.string().optional(),
  insuranceType: z.string().max(100).optional(),
  insuranceId: z.string().max(100).optional(),
  emergencyContact: z.string().max(200).optional(),
  emergencyPhone: z.string().max(20).optional(),
  meta: z.any().optional(),
}).strict()

export const createAdmissionSchema = z.object({
  contactId: z.string().min(1),
  serviceItemId: z.string().min(1),
  type: z.string().min(1).max(100),
  identifier: z.string().min(1).max(200),
  notes: z.string().max(2000).optional(),
  meta: z.any().optional(),
}).strict()

export const updateContactSchema = createContactSchema.partial()

export const updateAdmissionSchema = createAdmissionSchema.partial()

export const createRecurringSchema = z.object({
  contactId: z.string().min(1),
  serviceItemId: z.string().min(1),
  admissionId: z.string().optional(),
  interval: z.enum(RECURRING_INTERVALS),
  amount: z.number().int().min(1),
  nextDueDate: z.string().datetime(),
  autoCharge: z.boolean().default(false),
}).strict()

export const receiveStockSchema = z.object({
  serviceItemId: z.string().min(1),
  branchId: z.string().min(1),
  quantity: z.number().int().min(1),
  reference: z.string().max(200).optional(),
  batchNo: z.string().max(100).optional(),
  expiresAt: z.string().datetime().optional(),
}).strict()

export const adjustStockSchema = z.object({
  serviceItemId: z.string().min(1),
  branchId: z.string().min(1),
  newBalance: z.number().int().min(0),
  notes: z.string().max(500).optional(),
}).strict()

export const transferStockSchema = z.object({
  serviceItemId: z.string().min(1),
  fromBranchId: z.string().min(1),
  toBranchId: z.string().min(1),
  quantity: z.number().int().min(1),
}).strict()

export const createQueueSchema = z.object({
  contactId: z.string().min(1),
  department: z.string().max(200).optional(),
  chiefComplaint: z.string().max(2000).optional(),
  symptomSeverity: z.number().int().min(1).max(5).default(1),
  emergencyFlag: z.boolean().default(false),
}).strict()

export const updateQueueSchema = z.object({
  id: z.string().min(1),
  visitStatus: z.string().optional(),
  assignedDoctorId: z.string().optional(),
  priority: z.number().int().optional(),
}).strict()

export const createClinicalSchema = z.object({
  contactId: z.string().min(1),
  cartId: z.string().optional(),
  type: z.enum(CLINICAL_TYPES),
  data: z.any(),
  status: z.enum(CLINICAL_STATUSES),
}).strict()

export const dispenseSchema = z.object({
  contactId: z.string().min(1),
  clinicalRecordId: z.string().min(1),
  drug: z.string().min(1).max(200),
  outOfStock: z.boolean().optional(),
  serviceItemId: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
  cartId: z.string().optional(),
  branchId: z.string().optional(),
  dosage: z.string().max(500).optional(),
  duration: z.string().max(200).optional(),
  batchNo: z.string().max(100).optional(),
  expiresAt: z.string().optional(),
}).strict()

export const labResultSchema = z.object({
  contactId: z.string().min(1),
  clinicalRecordId: z.string().min(1),
  testName: z.string().min(1).max(200),
  action: z.enum(["start"]).optional(),
  result: z.string().max(5000).optional(),
  normalRange: z.string().max(500).optional(),
  abnormalFlag: z.boolean().optional(),
  criticalFlag: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
  tat: z.string().max(200).optional(),
  autoTransitionQueue: z.boolean().optional(),
}).strict()

export const createGroupSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(GROUP_TYPES).default("class"),
  academicYear: z.string().max(20).optional(),
  term: z.string().max(50).optional(),
  capacity: z.number().int().min(0).optional(),
  teacherId: z.string().optional(),
}).strict()

export const createSubjectSchema = z.object({
  name: z.string().min(1).max(200),
  department: z.string().max(200).optional(),
}).strict()

export const createExamSchema = z.object({
  groupId: z.string().min(1),
  subjectId: z.string().min(1),
  name: z.string().min(1).max(200),
  term: z.string().min(1).max(50),
  academicYear: z.string().min(1).max(20),
  maxScore: z.number().int().min(1),
  weight: z.number().int().min(1).max(100).default(100),
  date: z.string().datetime(),
}).strict()

export const createGradeSchema = z.object({
  examId: z.string().min(1),
  grades: z.array(z.object({
    studentId: z.string().min(1),
    score: z.number().int().min(0),
    grade: z.string().min(1).max(10),
    remarks: z.string().max(500).optional(),
  })).min(1),
}).strict()

export const attendanceSchema = z.object({
  groupId: z.string().min(1),
  date: z.string().datetime(),
  records: z.array(z.object({
    studentId: z.string().min(1),
    status: z.enum(ATTENDANCE_STATUSES),
  })).min(1),
}).strict()

export const scheduleSchema = z.object({
  groupId: z.string().min(1),
  subjectId: z.string().min(1),
  staffId: z.string().optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  room: z.string().max(100).optional(),
}).strict()

export const generateFeesSchema = z.object({
  serviceItemId: z.string().min(1),
  groupId: z.string().min(1),
  dueDate: z.string().datetime().optional(),
}).strict()

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  contactName: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  taxId: z.string().max(50).optional(),
  paymentTerms: z.string().max(200).optional(),
}).strict()

export const createPOSchema = z.object({
  supplierId: z.string().min(1),
  subtotal: z.number().int().min(0),
  tax: z.number().int().min(0).optional(),
  total: z.number().int().min(0),
  expectedDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(z.object({
    serviceItemId: z.string().min(1),
    quantity: z.number().int().min(1),
    unitCost: z.number().int().min(0),
  })).min(1),
}).strict()

export const createShiftSchema = z.object({
  branchId: z.string().min(1),
  openingCash: z.number().int().min(0),
}).strict()

export const closeShiftSchema = z.object({
  branchId: z.string().min(1),
  closingCash: z.number().int().min(0),
}).strict()

export const createExpenseSchema = z.object({
  branchId: z.string().optional(),
  category: z.string().min(1).max(200),
  vendor: z.string().max(200).optional(),
  description: z.string().min(1).max(2000),
  amount: z.number().int().min(1),
  taxAmount: z.number().int().min(0).default(0),
  paymentMethod: z.string().min(1).max(50),
  reference: z.string().max(200).optional(),
  date: z.string().datetime(),
}).strict()

export const createEmployeeSchema = z.object({
  contactId: z.string().optional(),
  employeeCode: z.string().min(1).max(50),
  department: z.string().min(1).max(200),
  position: z.string().min(1).max(200),
  baseSalary: z.number().int().min(0),
  ssnitTier: z.enum(SSNIT_TIERS).default("T1"),
  bankName: z.string().max(200).optional(),
  bankAccount: z.string().max(50).optional(),
  startDate: z.string().datetime(),
}).strict()

export const createPayRunSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
}).strict()

export const sendMessageSchema = z.object({
  type: z.enum(MESSAGE_TYPES),
  recipientType: z.string().min(1).max(50),
  recipientId: z.string().optional(),
  recipientName: z.string().max(200).optional(),
  recipientPhone: z.string().min(8).max(20),
  title: z.string().max(200).optional(),
  body: z.string().min(1).max(2000),
}).strict()

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const
const BLOOD_COMPONENTS = ["whole", "red_cells", "plasma", "platelets", "cryoprecipitate"] as const
const CROSSMATCH_STATUSES = ["pending", "matched", "issued", "rejected", "cancelled"] as const

export const bloodBankActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("crossmatch"),
    contactId: z.string().min(1).max(200),
    patientName: z.string().min(1).max(200),
    patientGroup: z.enum(BLOOD_GROUPS),
    requestedComponent: z.enum(BLOOD_COMPONENTS),
    units: z.number().int().min(1).max(20),
    operatorName: z.string().max(200).optional(),
  }).strict(),
  z.object({
    action: z.literal("update_match"),
    id: z.string().min(1).max(200),
    status: z.enum(CROSSMATCH_STATUSES),
  }).strict(),
  z.object({
    action: z.literal("register_donor"),
    contactId: z.string().min(1).max(200),
  }).strict(),
  z.object({
    action: z.literal("record_donation"),
    contactId: z.string().min(1).max(200),
  }).strict(),
])

export const clinicalImagingSchema = z.object({
  contactId: z.string().min(1).max(200),
  clinicalRecordId: z.string().min(1).max(200),
  modality: z.string().min(1).max(100),
  bodyPart: z.string().max(200).default(""),
  action: z.enum(["start", "complete"]).optional(),
  findings: z.string().max(5000).optional(),
  impression: z.string().max(2000).optional(),
  criticalFinding: z.boolean().default(false),
  notes: z.string().max(5000).optional(),
  autoTransitionQueue: z.boolean().default(false),
}).strict()

export const clinicalInjectionSchema = z.object({
  contactId: z.string().min(1).max(200),
  clinicalRecordId: z.string().min(1).max(200),
  drug: z.string().min(1).max(200),
  route: z.string().min(1).max(50).default("IM"),
  site: z.string().max(100).default(""),
  dosage: z.string().max(100).optional(),
  lotNumber: z.string().max(100).optional(),
  expiryDate: z.string().max(20).optional(),
  aefiReported: z.boolean().default(false),
  aefiDetails: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
}).strict()

export const dischargeSchema = z.object({
  dischargeNotes: z.string().max(5000).optional(),
  diagnosis: z.string().max(2000).optional(),
  conditionAtDischarge: z.string().max(200).optional(),
  instructions: z.string().max(5000).optional(),
  followUp: z.string().max(2000).optional(),
  medications: z.array(z.string().max(500)).max(50).optional(),
}).strict()

export const wardRoundSchema = z.object({
  vitals: z.any().optional(),
  notes: z.string().max(5000).optional(),
  plan: z.string().max(5000).optional(),
  diet: z.string().max(1000).optional(),
  ivFluids: z.string().max(1000).optional(),
  oxygenTherapy: z.string().max(1000).optional(),
}).strict()

export const updateRecurringSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("freeze") }).strict(),
  z.object({ action: z.literal("cancel") }).strict(),
  z.object({
    action: z.literal("reactivate"),
    nextDueDate: z.string().datetime().optional(),
  }).strict(),
  z.object({
    action: z.literal("update"),
    amount: z.number().int().min(0).optional(),
    interval: z.enum(RECURRING_INTERVALS).optional(),
    nextDueDate: z.string().datetime().optional(),
    autoCharge: z.boolean().optional(),
  }).strict(),
])

export const updateRoleSchema = z.object({
  operatorId: z.string().min(1).max(200),
  role: z.enum(VALID_ROLES).optional(),
  permissions: z.array(z.string().max(100)).max(100).optional(),
  isActive: z.boolean().optional(),
}).strict()
