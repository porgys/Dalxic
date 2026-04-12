// DalxicHealth — Shared TypeScript Types

// ─── Hospital Group (Multi-Branch) ───

export interface HospitalGroup {
  id: string;
  groupCode: string;
  name: string;
  ownerName: string;
  subscriptionTier: string;
  isActive: boolean;
  createdAt: Date;
}

export type InterBranchReferralType = "OUTPATIENT" | "ADMISSION" | "EMERGENCY" | "BLOOD_REQUEST";
export type InterBranchReferralPriority = "ROUTINE" | "URGENT" | "CRITICAL";
export type InterBranchReferralStatus = "PENDING" | "ACCEPTED" | "IN_TRANSIT" | "COMPLETED" | "REJECTED" | "CANCELLED";

export interface InterBranchReferral {
  id: string;
  groupCode: string;
  fromHospitalCode: string;
  fromHospitalName: string;
  toHospitalCode: string;
  toHospitalName: string;
  patientRecordId: string;
  patientName: string;
  referringDoctorName: string;
  referralType: InterBranchReferralType;
  department: string;
  clinicalReason: string;
  priority: InterBranchReferralPriority;
  status: InterBranchReferralStatus;
  acceptedBy: string | null;
  rejectedReason: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
}

// ─── Hospital & Tenancy ───

export type HospitalTier = "T1" | "T2" | "T3" | "T4";

export interface Hospital {
  id: string;
  code: string;
  name: string;
  logoUrl: string | null;
  tagline: string | null;
  subdomain: string;
  tier: HospitalTier;
  active: boolean;
  groupId?: string | null;
  groupCode?: string | null;
}

// ─── Monthly Book System ───

export type BookStatus = "active" | "closed";

export interface MonthlyBook {
  id: string;
  hospitalId: string;
  year: number;
  month: number; // 1-12
  status: BookStatus;
  closedAt: Date | null;
  pdfUrl: string | null;
}

// ─── Patient & Visit ───

export interface Patient {
  fullName: string;
  dateOfBirth: string | null;
  gender: "male" | "female" | "other" | null;
  phone: string | null;
  address: string | null;
  insuranceId: string | null;
  emergencyContact: string | null;
}

export interface Visit {
  date: string; // ISO date
  chiefComplaint: string;
  department: string | null;
  assignedDoctor: string | null;
  queueToken: string | null;
  entryPoint: "front_desk" | "emergency" | "referral";
}

export interface Diagnosis {
  primary: string | null;
  secondary: string[];
  icdCodes: string[];
  notes: string | null;
}

export interface Treatment {
  prescriptions: Prescription[];
  procedures: string[];
  followUp: string | null;
  nextAppointment: string | null;
}

export interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string | null;
}

// ─── Lab ───

export type LabCategory =
  | "haematology"
  | "biochemistry"
  | "microbiology_serology"
  | "urine_stool"
  | "other";

export type LabResultFlag =
  | "normal"
  | "high"
  | "low"
  | "reactive"
  | "non_reactive";

export type LabOrderStatus = "pending" | "in_progress" | "complete";

export interface LabOrder {
  id: string;
  patientId: string;
  hospitalId: string;
  bookId: string;
  orderedBy: string;
  orderedAt: Date;
  tests: LabTestRequest[];
  customTests: string | null;
  clinicalNotes: string | null;
  status: LabOrderStatus;
  labToken: string; // e.g. LAB-KBH-006
}

export interface LabTestRequest {
  testName: string;
  category: LabCategory;
}

export interface LabResult {
  id: string;
  labOrderId: string;
  patientId: string;
  testName: string;
  resultValue: string;
  unit: string | null;
  referenceRange: string | null;
  flag: LabResultFlag;
  enteredBy: string;
  enteredAt: Date;
}

// ─── AI Summary ───

export interface AISummary {
  brief: string; // 20 words max
  clinicalSummary: string; // 2-4 sentences
  riskFlags: string[];
}

// ─── Patient Record (composite) ───

export interface PatientRecord {
  id: string;
  bookId: string;
  hospitalId: string;
  patient: Patient;
  visit: Visit;
  diagnosis: Diagnosis;
  treatment: Treatment;
  lab: {
    orders: LabOrder[];
    results: LabResult[];
  } | null;
  aiSummary: AISummary | null;
  entryPoint: "manual" | "bulk_paste" | "scan_upload";
  createdBy: string;
  createdAt: Date;
}

// ─── Device System ───

export type DeviceRole =
  | "front_desk"
  | "waiting_room"
  | "doctor"
  | "pharmacy"
  | "lab"
  | "injection"
  | "nurse"
  | "radiology"
  | "ward"
  | "billing"
  | "ultrasound"
  | "emergency"
  | "icu"
  | "maternity"
  | "blood_bank";

export interface Device {
  id: string;
  hospitalId: string;
  deviceCode: string; // e.g. KBH-FD-001
  deviceName: string;
  role: DeviceRole;
  isActive: boolean;
  isLocked: boolean;
  assignedBy: string;
  lastSeenAt: Date | null;
}

// ─── Device Operators ───

export type OperatorRole =
  | "front_desk"
  | "doctor"
  | "pharmacist"
  | "lab_tech"
  | "nurse"
  | "radiologist"
  | "admin"
  | "billing";

export interface DeviceOperator {
  id: string;
  hospitalId: string;
  name: string;
  phone: string | null;
  role: OperatorRole;
  isActive: boolean;
  lastLoginAt: Date | null;
}

/** Stored in localStorage after PIN login — no secrets, just identity */
export interface OperatorSession {
  operatorId: string;
  operatorName: string;
  operatorRole: OperatorRole;
  hospitalId: string;
  hospitalCode: string;
  meta?: Record<string, unknown> | null;
  loginAt: string; // ISO
}

// ─── Access & Auth ───

export type DalxicStaffRole = "super_admin" | "support" | "analyst";

export type ActorType =
  | "dalxic_super_admin"
  | "dalxic_staff"
  | "hospital_admin"
  | "device_operator"
  | "emergency_override"
  | "doctor";

export interface AccessGrant {
  id: string;
  dalxicStaffId: string;
  hospitalId: string;
  grantedRole: DeviceRole;
  grantedBy: string;
  grantedAt: Date;
  expiresAt: Date;
  reason: string;
  isActive: boolean;
  revokedAt: Date | null;
}

// ─── Queue System ───

export type QueueStatus = "waiting" | "in_progress" | "completed" | "no_show";

export interface QueueEntry {
  id: string;
  hospitalId: string;
  bookId: string;
  patientRecordId: string;
  token: string; // e.g. #003
  status: QueueStatus;
  department: string;
  assignedTo: string | null;
  createdAt: Date;
  calledAt: Date | null;
  completedAt: Date | null;
}

export interface ReferralSubToken {
  id: string;
  parentQueueId: string;
  token: string; // e.g. LAB-KBH-006
  targetStation: DeviceRole;
  status: QueueStatus;
  createdAt: Date;
  completedAt: Date | null;
}

// ─── Audit ───

export interface AuditEntry {
  id: string;
  actorType: ActorType;
  actorId: string;
  hospitalId: string;
  action: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  timestamp: Date;
}

// ─── Parsing (Nexus-7) ───

export interface ParsedPatientEntry {
  patient: Patient;
  visit: Visit;
  diagnosis: Diagnosis;
  treatment: Treatment;
  lab: LabTestRequest[] | null;
  targetMonth: number; // 1-12
  targetYear: number;
  confidence: "high" | "medium" | "low";
  rawText: string; // original text segment for review
}

export interface ParseRequest {
  rawText: string;
  hospitalCode: string;
  defaultYear?: number;
}

export interface ParseResponse {
  entries: ParsedPatientEntry[];
  totalDetected: number;
  warnings: string[];
}
