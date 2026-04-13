-- DalxicOperations — Initial Migration
-- 15 tables: Shared (4) + Trade (5) + Institute (6)
-- All monetary values in integer pesewas (1 GHS = 100 pesewas)

-- ═══════════════════════════════════════════════════════════════
-- SHARED — Multi-tenant core
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE organizations (
  id            TEXT PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  logo_url      TEXT,
  tagline       TEXT,
  type          TEXT NOT NULL,
  tier          TEXT NOT NULL DEFAULT 'T1',
  active_modules TEXT[] DEFAULT '{}',
  max_operators  INTEGER NOT NULL DEFAULT 3,
  whatsapp_bundle INTEGER NOT NULL DEFAULT 100,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  meta          JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE operators (
  id            TEXT PRIMARY KEY,
  org_id        TEXT NOT NULL REFERENCES organizations(id),
  name          TEXT NOT NULL,
  phone         TEXT,
  pin           TEXT NOT NULL,
  role          TEXT NOT NULL,
  meta          JSONB,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  UNIQUE(org_id, pin)
);
CREATE INDEX idx_operators_org_active ON operators(org_id, is_active);

CREATE TABLE system_config (
  id         TEXT PRIMARY KEY,
  key        TEXT UNIQUE NOT NULL,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_log (
  id         TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL,
  actor_id   TEXT NOT NULL,
  org_id     TEXT NOT NULL REFERENCES organizations(id),
  action     TEXT NOT NULL,
  metadata   JSONB,
  ip_address TEXT NOT NULL,
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_org_time ON audit_log(org_id, timestamp);
CREATE INDEX idx_audit_actor ON audit_log(actor_type, actor_id);

-- ═══════════════════════════════════════════════════════════════
-- TRADE — Retail / POS / Inventory
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE categories (
  id         TEXT PRIMARY KEY,
  org_id     TEXT NOT NULL REFERENCES organizations(id),
  name       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(org_id, name)
);

CREATE TABLE products (
  id            TEXT PRIMARY KEY,
  org_id        TEXT NOT NULL REFERENCES organizations(id),
  category_id   TEXT NOT NULL REFERENCES categories(id),
  name          TEXT NOT NULL,
  sku           TEXT,
  unit          TEXT NOT NULL DEFAULT 'piece',
  cost_price    INTEGER NOT NULL DEFAULT 0,
  selling_price INTEGER NOT NULL,
  stock         INTEGER NOT NULL DEFAULT 0,
  min_stock     INTEGER NOT NULL DEFAULT 5,
  photo_url     TEXT,
  batch_no      TEXT,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_org_cat ON products(org_id, category_id);
CREATE INDEX idx_products_org_name ON products(org_id, name);

CREATE TABLE sales (
  id             TEXT PRIMARY KEY,
  org_id         TEXT NOT NULL REFERENCES organizations(id),
  receipt_code   TEXT UNIQUE NOT NULL,
  customer_name  TEXT,
  customer_phone TEXT,
  subtotal       INTEGER NOT NULL,
  discount       INTEGER NOT NULL DEFAULT 0,
  total          INTEGER NOT NULL,
  payment_method TEXT,
  payment_ref    TEXT,
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  sold_by        TEXT NOT NULL,
  sold_by_name   TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sales_org_date ON sales(org_id, created_at);
CREATE INDEX idx_sales_org_status ON sales(org_id, payment_status);

CREATE TABLE sale_items (
  id           TEXT PRIMARY KEY,
  sale_id      TEXT NOT NULL REFERENCES sales(id),
  product_id   TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  unit_price   INTEGER NOT NULL,
  quantity     INTEGER NOT NULL,
  total        INTEGER NOT NULL
);

CREATE TABLE stock_movements (
  id             TEXT PRIMARY KEY,
  org_id         TEXT NOT NULL REFERENCES organizations(id),
  product_id     TEXT NOT NULL REFERENCES products(id),
  type           TEXT NOT NULL,
  quantity       INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after  INTEGER NOT NULL,
  reference      TEXT,
  performed_by   TEXT NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_stock_org_product ON stock_movements(org_id, product_id);
CREATE INDEX idx_stock_org_type ON stock_movements(org_id, type);

-- ═══════════════════════════════════════════════════════════════
-- INSTITUTE — Schools / NGOs / Training Centres
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE groups (
  id        TEXT PRIMARY KEY,
  org_id    TEXT NOT NULL REFERENCES organizations(id),
  name      TEXT NOT NULL,
  type      TEXT NOT NULL DEFAULT 'class',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(org_id, name)
);

CREATE TABLE members (
  id             TEXT PRIMARY KEY,
  org_id         TEXT NOT NULL REFERENCES organizations(id),
  name           TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'student',
  status         TEXT NOT NULL DEFAULT 'active',
  group_id       TEXT REFERENCES groups(id),
  phone          TEXT,
  email          TEXT,
  date_of_birth  TEXT,
  gender         TEXT,
  guardian_name   TEXT,
  guardian_phone  TEXT,
  enrolled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meta           JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_members_org_status ON members(org_id, status);
CREATE INDEX idx_members_org_group ON members(org_id, group_id);

CREATE TABLE staff (
  id         TEXT PRIMARY KEY,
  org_id     TEXT NOT NULL REFERENCES organizations(id),
  name       TEXT NOT NULL,
  role       TEXT NOT NULL,
  department TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  status     TEXT NOT NULL DEFAULT 'active',
  meta       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_staff_org_dept ON staff(org_id, department);

CREATE TABLE fee_records (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES organizations(id),
  member_id   TEXT NOT NULL REFERENCES members(id),
  description TEXT NOT NULL,
  amount      INTEGER NOT NULL,
  paid        INTEGER NOT NULL DEFAULT 0,
  balance     INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'UNPAID',
  due_date    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_fees_org_member ON fee_records(org_id, member_id);
CREATE INDEX idx_fees_org_status ON fee_records(org_id, status);

CREATE TABLE fee_payments (
  id             TEXT PRIMARY KEY,
  fee_record_id  TEXT NOT NULL REFERENCES fee_records(id),
  amount         INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_ref    TEXT,
  received_by    TEXT NOT NULL,
  received_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes          TEXT
);

CREATE TABLE schedule_slots (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES organizations(id),
  group_id    TEXT NOT NULL REFERENCES groups(id),
  staff_id    TEXT REFERENCES staff(id),
  subject     TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_time  TEXT NOT NULL,
  end_time    TEXT NOT NULL,
  room        TEXT
);
CREATE INDEX idx_schedule_org_group ON schedule_slots(org_id, group_id);
