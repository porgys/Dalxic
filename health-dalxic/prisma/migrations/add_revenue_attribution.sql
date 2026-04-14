-- Revenue Attribution, Shifts, and Payouts
-- Additive migration — every new column is nullable, every new table is net-new.
-- Run this against Neon before deploying the code that depends on it.

-- 1. Doctor: fee + commission + department
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS consultation_fee DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS commission_rate DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS department TEXT;

-- 2. BillableItem: attribution FKs + commission snapshot
ALTER TABLE billable_items
  ADD COLUMN IF NOT EXISTS doctor_id TEXT,
  ADD COLUMN IF NOT EXISTS department_id TEXT,
  ADD COLUMN IF NOT EXISTS shift_id TEXT,
  ADD COLUMN IF NOT EXISTS commission_pct DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS staff_cut_cost DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS billable_items_hospital_doctor_rendered_idx
  ON billable_items (hospital_id, doctor_id, rendered_at);

CREATE INDEX IF NOT EXISTS billable_items_hospital_dept_rendered_idx
  ON billable_items (hospital_id, department_id, rendered_at);

CREATE INDEX IF NOT EXISTS billable_items_hospital_shift_idx
  ON billable_items (hospital_id, shift_id);

-- 3. DoctorShift: clock-in sessions
CREATE TABLE IF NOT EXISTS doctor_shifts (
  id              TEXT PRIMARY KEY,
  hospital_id     TEXT NOT NULL,
  doctor_id       TEXT NOT NULL,
  shift_type      TEXT NOT NULL,                   -- morning|afternoon|evening|night|custom
  clock_in_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  clock_out_at    TIMESTAMP(3),
  notes           TEXT,
  gross_revenue   DOUBLE PRECISION NOT NULL DEFAULT 0,
  patient_count   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS doctor_shifts_hospital_doctor_start_idx
  ON doctor_shifts (hospital_id, doctor_id, clock_in_at);

CREATE INDEX IF NOT EXISTS doctor_shifts_active_idx
  ON doctor_shifts (hospital_id, clock_in_at) WHERE clock_out_at IS NULL;

-- 4. StaffPayout: per-period settlement ledger
CREATE TABLE IF NOT EXISTS staff_payouts (
  id               TEXT PRIMARY KEY,
  hospital_id      TEXT NOT NULL,
  doctor_id        TEXT NOT NULL,
  period_start     TIMESTAMP(3) NOT NULL,
  period_end       TIMESTAMP(3) NOT NULL,
  gross_revenue    DOUBLE PRECISION NOT NULL,
  commission_rate  DOUBLE PRECISION NOT NULL,
  amount_due       DOUBLE PRECISION NOT NULL,
  status           TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING|PAID|CANCELLED
  paid_at          TIMESTAMP(3),
  paid_by          TEXT,
  payment_method   TEXT,                              -- CASH|MOMO|BANK
  payment_ref      TEXT,
  notes            TEXT,
  created_by       TEXT NOT NULL,
  created_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS staff_payouts_hospital_doctor_status_idx
  ON staff_payouts (hospital_id, doctor_id, status);

CREATE INDEX IF NOT EXISTS staff_payouts_period_idx
  ON staff_payouts (hospital_id, period_start, period_end);
