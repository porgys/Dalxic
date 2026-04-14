-- Cards & Bookings module — appointment/booking tracking.
-- Card issuance fees are tracked via BillableItem (serviceType=CARD_FEE); no
-- separate table needed. Booking fees likewise write BillableItem with
-- serviceType=BOOKING_FEE so revenue flows into Bookkeeping/Finance/PDFs.

CREATE TABLE IF NOT EXISTS bookings (
  id                 TEXT PRIMARY KEY,
  hospital_id        TEXT NOT NULL REFERENCES hospitals(id),
  patient_id         TEXT NOT NULL,
  patient_name       TEXT NOT NULL,
  patient_phone      TEXT,
  doctor_id          TEXT,
  department_key     TEXT,
  scheduled_at       TIMESTAMP NOT NULL,
  duration_mins      INTEGER NOT NULL DEFAULT 30,
  status             TEXT NOT NULL DEFAULT 'PENDING',
  fee                DOUBLE PRECISION NOT NULL DEFAULT 0,
  fee_paid           BOOLEAN NOT NULL DEFAULT FALSE,
  billable_item_id   TEXT,
  notes              TEXT,
  created_by         TEXT NOT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_hospital_scheduled ON bookings(hospital_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_hospital_status ON bookings(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_patient ON bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_bookings_doctor_scheduled ON bookings(doctor_id, scheduled_at);
