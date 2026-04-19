-- 003_universal_engine: Drop old trade/institute-specific tables, build universal 6-behaviour engine
-- Idempotent: safe to run multiple times

-- ═══════════════════════════════════════════════════════════════
-- DROP OLD TABLES
-- ═══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS fee_records CASCADE;
DROP TABLE IF EXISTS schedule_slots CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS return_items CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- ALTER EXISTING TABLES
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS active_behaviours TEXT[] DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS payment_gate TEXT DEFAULT 'pay_after';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS label_config JSONB;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tax_config JSONB;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GHS';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Africa/Accra';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_branches INT DEFAULT 1;

ALTER TABLE operators ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- Rebuild audit_log
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS actor_name TEXT DEFAULT '';
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS entity TEXT DEFAULT '';
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS before JSONB;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS after JSONB;
ALTER TABLE audit_log DROP COLUMN IF EXISTS actor_type;
ALTER TABLE audit_log DROP COLUMN IF EXISTS metadata;

-- ═══════════════════════════════════════════════════════════════
-- BRANCHES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- UNIVERSAL SERVICE CATALOGUE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS service_categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  parent_id TEXT REFERENCES service_categories(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(org_id, name)
);

CREATE TABLE IF NOT EXISTS service_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  category_id TEXT NOT NULL REFERENCES service_categories(id),
  name TEXT NOT NULL,
  sku TEXT,
  unit TEXT DEFAULT 'piece',
  description TEXT,
  behaviour TEXT NOT NULL,
  stock_type TEXT NOT NULL,
  cost_price INT DEFAULT 0,
  selling_price INT NOT NULL,
  stock INT DEFAULT 0,
  min_stock INT DEFAULT 0,
  max_stock INT,
  batch_no TEXT,
  expires_at TIMESTAMPTZ,
  storage_conditions TEXT,
  capacity_total INT,
  capacity_used INT DEFAULT 0,
  recurring_interval TEXT,
  photo_url TEXT,
  barcode TEXT,
  taxable BOOLEAN DEFAULT true,
  commission_rate INT DEFAULT 0,
  provider_id TEXT,
  is_active BOOLEAN DEFAULT true,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_si_org_behaviour ON service_items(org_id, behaviour);
CREATE INDEX IF NOT EXISTS idx_si_org_stock_type ON service_items(org_id, stock_type);
CREATE INDEX IF NOT EXISTS idx_si_org_category ON service_items(org_id, category_id);

-- ═══════════════════════════════════════════════════════════════
-- THE SPINE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  branch_id TEXT NOT NULL,
  operator_id TEXT NOT NULL,
  contact_id TEXT,
  status TEXT DEFAULT 'open',
  payment_gate TEXT NOT NULL,
  entry_behaviour TEXT,
  notes TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carts_org_status ON carts(org_id, status);

CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cart_id TEXT NOT NULL REFERENCES carts(id),
  service_item_id TEXT NOT NULL,
  behaviour TEXT NOT NULL,
  item_name TEXT NOT NULL,
  unit_price INT NOT NULL,
  quantity INT NOT NULL,
  discount INT DEFAULT 0,
  tax INT DEFAULT 0,
  total INT NOT NULL,
  meta JSONB
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  cart_id TEXT NOT NULL REFERENCES carts(id),
  receipt_code TEXT UNIQUE NOT NULL,
  method TEXT NOT NULL,
  amount INT NOT NULL,
  reference TEXT,
  status TEXT DEFAULT 'pending',
  processed_by TEXT NOT NULL,
  processed_by_name TEXT NOT NULL,
  processed_at TIMESTAMPTZ,
  meta JSONB
);

CREATE INDEX IF NOT EXISTS idx_payments_org_status ON payments(org_id, status);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  payment_id TEXT UNIQUE NOT NULL REFERENCES payments(id),
  cart_id TEXT NOT NULL REFERENCES carts(id),
  code TEXT UNIQUE NOT NULL,
  subtotal INT NOT NULL,
  discount_total INT NOT NULL,
  tax_total INT NOT NULL,
  grand_total INT NOT NULL,
  items JSONB NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  printed_at TIMESTAMPTZ,
  emailed_at TIMESTAMPTZ,
  whatsapped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- STOCK
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  service_item_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity INT NOT NULL,
  balance_before INT NOT NULL,
  balance_after INT NOT NULL,
  reference TEXT,
  batch_no TEXT,
  expires_at TIMESTAMPTZ,
  performed_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sm_org_item ON stock_movements(org_id, service_item_id);
CREATE INDEX IF NOT EXISTS idx_sm_org_type ON stock_movements(org_id, type);

CREATE TABLE IF NOT EXISTS stock_transfers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  from_branch_id TEXT NOT NULL,
  to_branch_id TEXT NOT NULL,
  service_item_id TEXT NOT NULL,
  quantity INT NOT NULL,
  status TEXT DEFAULT 'pending',
  initiated_by TEXT NOT NULL,
  received_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════════
-- RETURNS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS returns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  original_payment_id TEXT NOT NULL REFERENCES payments(id),
  credit_note_code TEXT UNIQUE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  reason TEXT NOT NULL,
  reason_text TEXT,
  refund_method TEXT NOT NULL,
  refund_amount INT NOT NULL,
  restock_items BOOLEAN DEFAULT true,
  approved_by TEXT,
  processed_by TEXT NOT NULL,
  processed_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_returns_org_created ON returns(org_id, created_at);

CREATE TABLE IF NOT EXISTS return_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  return_id TEXT NOT NULL REFERENCES returns(id),
  service_item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  unit_price INT NOT NULL,
  quantity INT NOT NULL,
  total INT NOT NULL,
  restock BOOLEAN DEFAULT true
);

-- ═══════════════════════════════════════════════════════════════
-- UNIVERSAL CONTACT
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  date_of_birth TEXT,
  gender TEXT,
  blood_group TEXT,
  allergies TEXT[] DEFAULT '{}',
  guardian_id TEXT REFERENCES contacts(id),
  group_id TEXT,
  insurance_type TEXT,
  insurance_id TEXT,
  loyalty_tier TEXT,
  loyalty_points INT DEFAULT 0,
  total_spent INT DEFAULT 0,
  visit_count INT DEFAULT 0,
  emergency_contact TEXT,
  emergency_phone TEXT,
  photo TEXT,
  meta JSONB,
  enrolled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_org_type ON contacts(org_id, type);
CREATE INDEX IF NOT EXISTS idx_contacts_org_status ON contacts(org_id, status);

-- ═══════════════════════════════════════════════════════════════
-- ADMISSION + RECURRING
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  contact_id TEXT NOT NULL,
  service_item_id TEXT NOT NULL,
  type TEXT NOT NULL,
  identifier TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  admitted_at TIMESTAMPTZ DEFAULT now(),
  discharged_at TIMESTAMPTZ,
  notes TEXT,
  meta JSONB
);

CREATE INDEX IF NOT EXISTS idx_admissions_org_status ON admissions(org_id, status);

CREATE TABLE IF NOT EXISTS recurring_charges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  contact_id TEXT NOT NULL,
  admission_id TEXT REFERENCES admissions(id),
  service_item_id TEXT NOT NULL,
  interval TEXT NOT NULL,
  amount INT NOT NULL,
  next_due_date TIMESTAMPTZ NOT NULL,
  auto_charge BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  charge_count INT DEFAULT 0,
  last_charged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rc_org_status ON recurring_charges(org_id, status);

-- ═══════════════════════════════════════════════════════════════
-- HEALTH EXTENSIONS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS clinical_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  contact_id TEXT NOT NULL,
  cart_id TEXT,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  status TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  performed_by_name TEXT NOT NULL,
  performed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cr_org_contact_type ON clinical_records(org_id, contact_id, type);
CREATE INDEX IF NOT EXISTS idx_cr_org_type_status ON clinical_records(org_id, type, status);

CREATE TABLE IF NOT EXISTS queue_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  contact_id TEXT NOT NULL,
  token TEXT NOT NULL,
  department TEXT,
  chief_complaint TEXT,
  symptom_severity INT DEFAULT 1,
  emergency_flag BOOLEAN DEFAULT false,
  visit_status TEXT DEFAULT 'waiting',
  assigned_doctor_id TEXT,
  checkout_pin TEXT,
  priority INT DEFAULT 0,
  queued_at TIMESTAMPTZ DEFAULT now(),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_qe_org_status ON queue_entries(org_id, visit_status);
CREATE INDEX IF NOT EXISTS idx_qe_org_queued ON queue_entries(org_id, queued_at);

-- ═══════════════════════════════════════════════════════════════
-- INSTITUTE EXTENSIONS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'class',
  academic_year TEXT,
  term TEXT,
  capacity INT,
  teacher_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, name)
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(org_id, name)
);

CREATE TABLE IF NOT EXISTS group_subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  teacher_id TEXT,
  UNIQUE(group_id, subject_id)
);

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  group_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  name TEXT NOT NULL,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  max_score INT NOT NULL,
  weight INT DEFAULT 100,
  date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grades (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  exam_id TEXT NOT NULL REFERENCES exams(id),
  student_id TEXT NOT NULL,
  score INT NOT NULL,
  grade TEXT NOT NULL,
  remarks TEXT,
  graded_by TEXT NOT NULL,
  graded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  group_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  marked_by TEXT NOT NULL,
  marked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_org_date ON attendance(org_id, date);

CREATE TABLE IF NOT EXISTS schedule_slots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  group_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  staff_id TEXT,
  day_of_week INT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT
);

CREATE INDEX IF NOT EXISTS idx_ss_org_group ON schedule_slots(org_id, group_id);

-- ═══════════════════════════════════════════════════════════════
-- TRADE EXTENSIONS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  contact_id TEXT,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_id TEXT,
  payment_terms TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  po_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  subtotal INT NOT NULL,
  tax INT DEFAULT 0,
  total INT NOT NULL,
  expected_date TIMESTAMPTZ,
  received_date TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, po_number)
);

CREATE TABLE IF NOT EXISTS po_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  po_id TEXT NOT NULL REFERENCES purchase_orders(id),
  service_item_id TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_cost INT NOT NULL,
  total INT NOT NULL,
  received_qty INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  branch_id TEXT NOT NULL,
  operator_id TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  opening_cash INT NOT NULL,
  closing_cash INT,
  sales_count INT DEFAULT 0,
  sales_total INT DEFAULT 0,
  returns_total INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_shifts_org_status ON shifts(org_id, status);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  branch_id TEXT,
  category TEXT NOT NULL,
  vendor TEXT,
  description TEXT NOT NULL,
  amount INT NOT NULL,
  tax_amount INT DEFAULT 0,
  payment_method TEXT NOT NULL,
  reference TEXT,
  approved_by TEXT,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_org_date ON expenses(org_id, date);

-- ═══════════════════════════════════════════════════════════════
-- PAYROLL
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  contact_id TEXT,
  employee_code TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  base_salary INT NOT NULL,
  ssnit_tier TEXT DEFAULT 'T1',
  bank_name TEXT,
  bank_account TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, employee_code)
);

CREATE TABLE IF NOT EXISTS pay_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  period TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  total_gross INT DEFAULT 0,
  total_deductions INT DEFAULT 0,
  total_net INT DEFAULT 0,
  employee_count INT DEFAULT 0,
  processed_by TEXT,
  processed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, period)
);

CREATE TABLE IF NOT EXISTS pay_slips (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  pay_run_id TEXT NOT NULL REFERENCES pay_runs(id),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  base_salary INT NOT NULL,
  allowances JSONB,
  gross_pay INT NOT NULL,
  ssnit_employee INT NOT NULL,
  ssnit_employer INT NOT NULL,
  paye INT NOT NULL,
  other_deductions JSONB,
  net_pay INT NOT NULL,
  status TEXT DEFAULT 'draft'
);

-- ═══════════════════════════════════════════════════════════════
-- COMMUNICATION
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS message_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL,
  recipient_type TEXT NOT NULL,
  recipient_id TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  title TEXT,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  sent_by TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  meta JSONB
);

CREATE INDEX IF NOT EXISTS idx_ml_org_type ON message_log(org_id, type);
