import type { VerticalConfig } from "./types"

const INSTITUTE_MODULES_ALL = [
  "enrollment", "gradebook", "fees", "attendance", "parents",
  "library", "exams", "timetable", "transport", "reports", "audit", "roles",
]

export const INSTITUTE: VerticalConfig = {
  type: "institute",
  label: "Institute",
  brand: "DalxicInstitute",
  accent: "sky",
  paymentGate: "pay_before",
  defaultBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"],

  labelConfig: {
    consultation: "Admissions",
    procedure: "Lessons",
    product: "Textbooks",
    admission: "Enrollment",
    recurring: "Term Fees",
    admin: "Grading",
  },

  roles: {
    teacher:    { label: "Teacher",    modules: ["gradebook", "attendance", "exams", "timetable"] },
    registrar:  { label: "Registrar",  modules: ["enrollment", "fees", "attendance", "reports"] },
    finance:    { label: "Finance",    modules: ["fees", "reports", "expenses"] },
    librarian:  { label: "Librarian",  modules: ["library"] },
    admin:      { label: "Administrator", modules: INSTITUTE_MODULES_ALL },
    owner:      { label: "Owner",         modules: INSTITUTE_MODULES_ALL },
    super_admin: { label: "Super Admin",  modules: INSTITUTE_MODULES_ALL },
  },
}
