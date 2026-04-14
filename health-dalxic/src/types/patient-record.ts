/**
 * Zod schemas for PatientRecord JSON columns.
 *
 * The Prisma schema stores clinical payloads (labOrders, imagingOrders,
 * consultations, prescriptions) as Json columns — fast and flexible but
 * unvalidated. Every API route mutating those blobs should parse the new
 * slice through the schemas here so malformed JSON never leaks to the DB.
 *
 * Usage in an API route:
 *   import { LabOrderSchema } from "@/types/patient-record";
 *   const parsed = LabOrderSchema.parse(body.labOrder);
 *   await db.patientRecord.update({ ... data: { labOrders: [...existing, parsed] } });
 */
import { z } from "zod";

/* ─── Lab orders ─── */

export const LabOrderStatusSchema = z.enum([
  "pending",
  "collected",
  "in_progress",
  "completed",
  "cancelled",
]);

export const LabTestResultSchema = z.object({
  name: z.string().min(1),
  value: z.union([z.string(), z.number()]),
  unit: z.string().optional(),
  reference: z.string().optional(),
  flag: z.enum(["normal", "high", "low", "critical"]).optional(),
});

export const LabOrderSchema = z.object({
  id: z.string().min(1),
  orderedBy: z.string().optional(),
  orderedAt: z.string().datetime().or(z.string()),
  testPanel: z.string().min(1),
  testCodes: z.array(z.string()).optional(),
  priority: z.enum(["routine", "urgent", "stat"]).default("routine"),
  status: LabOrderStatusSchema.default("pending"),
  collectedAt: z.string().datetime().or(z.string()).optional(),
  collectedBy: z.string().optional(),
  resultsReadyAt: z.string().datetime().or(z.string()).optional(),
  resultedBy: z.string().optional(),
  results: z.array(LabTestResultSchema).optional(),
  notes: z.string().optional(),
});

export type LabOrder = z.infer<typeof LabOrderSchema>;

/* ─── Imaging orders ─── */

export const ImagingModalitySchema = z.enum([
  "xray",
  "ultrasound",
  "ct",
  "mri",
  "echo",
  "doppler",
  "mammography",
  "fluoroscopy",
  "other",
]);

export const ImagingOrderSchema = z.object({
  id: z.string().min(1),
  modality: ImagingModalitySchema,
  bodyPart: z.string().min(1),
  clinicalQuestion: z.string().optional(),
  orderedBy: z.string().optional(),
  orderedAt: z.string().datetime().or(z.string()),
  priority: z.enum(["routine", "urgent", "stat"]).default("routine"),
  status: z.enum(["pending", "scheduled", "in_progress", "reported", "cancelled"]).default("pending"),
  scheduledAt: z.string().datetime().or(z.string()).optional(),
  reportedAt: z.string().datetime().or(z.string()).optional(),
  reportedBy: z.string().optional(),
  findings: z.string().optional(),
  impression: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  notes: z.string().optional(),
});

export type ImagingOrder = z.infer<typeof ImagingOrderSchema>;

/* ─── Consultations ─── */

export const VitalsSchema = z.object({
  hr: z.number().int().min(0).max(300).optional(),
  bp: z.string().regex(/^\d{1,3}\/\d{1,3}$/).optional(),
  spo2: z.number().int().min(0).max(100).optional(),
  temp: z.number().min(20).max(50).optional(),
  rr: z.number().int().min(0).max(100).optional(),
  gcs: z.number().int().min(3).max(15).optional(),
  weightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  bmi: z.number().positive().optional(),
});

export const ConsultationSchema = z.object({
  id: z.string().min(1),
  doctorId: z.string().optional(),
  doctorName: z.string().optional(),
  startedAt: z.string().datetime().or(z.string()),
  endedAt: z.string().datetime().or(z.string()).optional(),
  chiefComplaint: z.string().optional(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  vitals: VitalsSchema.optional(),
  diagnoses: z.array(z.string()).optional(),
  template: z.string().optional(),
});

export type Consultation = z.infer<typeof ConsultationSchema>;

/* ─── Prescriptions ─── */

export const PrescriptionItemSchema = z.object({
  drugId: z.string().optional(),
  drugName: z.string().min(1),
  strength: z.string().optional(),
  form: z.enum(["tablet", "capsule", "syrup", "injection", "cream", "drops", "other"]).optional(),
  dose: z.string().min(1),
  route: z.enum(["PO", "IV", "IM", "SC", "PR", "SL", "TOP", "INH", "OPH", "OTIC", "other"]).optional(),
  frequency: z.string().min(1),
  durationDays: z.number().int().positive().optional(),
  quantity: z.number().int().positive().optional(),
  instructions: z.string().optional(),
});

export const PrescriptionSchema = z.object({
  id: z.string().min(1),
  prescribedBy: z.string().optional(),
  prescribedAt: z.string().datetime().or(z.string()),
  items: z.array(PrescriptionItemSchema).min(1),
  status: z.enum(["pending", "partial", "dispensed", "cancelled"]).default("pending"),
  dispensedBy: z.string().optional(),
  dispensedAt: z.string().datetime().or(z.string()).optional(),
  notes: z.string().optional(),
});

export type Prescription = z.infer<typeof PrescriptionSchema>;

/* ─── Aggregate helpers ─── */

export const PatientRecordBlobsSchema = z.object({
  labOrders: z.array(LabOrderSchema).default([]),
  imagingOrders: z.array(ImagingOrderSchema).default([]),
  consultations: z.array(ConsultationSchema).default([]),
  prescriptions: z.array(PrescriptionSchema).default([]),
});

export type PatientRecordBlobs = z.infer<typeof PatientRecordBlobsSchema>;

/**
 * Safely append an item to one of the JSON columns. Returns the new array
 * without mutating the input. Throws if the new item fails schema validation.
 */
export function appendLabOrder(existing: unknown, incoming: unknown): LabOrder[] {
  const parsed = LabOrderSchema.parse(incoming);
  const base = z.array(LabOrderSchema).parse(existing ?? []);
  return [...base, parsed];
}

export function appendImagingOrder(existing: unknown, incoming: unknown): ImagingOrder[] {
  const parsed = ImagingOrderSchema.parse(incoming);
  const base = z.array(ImagingOrderSchema).parse(existing ?? []);
  return [...base, parsed];
}

export function appendConsultation(existing: unknown, incoming: unknown): Consultation[] {
  const parsed = ConsultationSchema.parse(incoming);
  const base = z.array(ConsultationSchema).parse(existing ?? []);
  return [...base, parsed];
}

export function appendPrescription(existing: unknown, incoming: unknown): Prescription[] {
  const parsed = PrescriptionSchema.parse(incoming);
  const base = z.array(PrescriptionSchema).parse(existing ?? []);
  return [...base, parsed];
}
