-- Seed data for 3 demo organizations (INSERT ONLY, idempotent via ON CONFLICT)
-- Run: node run-seed.js

-- ═══════════════════════════════════════════════════════════
-- 1. DEMO STORE — Trade vertical
-- ═══════════════════════════════════════════════════════════

INSERT INTO organizations (id, code, name, type, tier, active_behaviours, active_modules, payment_gate, tax_config, max_operators, max_branches)
VALUES (gen_random_uuid(), 'DEMO', 'Demo Store', 'trade', 'T2',
  '{product,admin}',
  '{pos,inventory,stock,customers,receipts,returns,shifts,reports,expenses,suppliers,purchase-orders,labels,loyalty,payroll,branches,roles,audit,reconciliation,accounting,tax}',
  'pay_after', '{"vat":15,"nhil":2.5,"getfund":2.5,"covid":1}'::jsonb, 10, 3)
ON CONFLICT (code) DO NOTHING;

INSERT INTO branches (id, org_id, name, address, phone, is_default)
SELECT gen_random_uuid(), id, 'Main Branch', 'Accra Mall, Tetteh Quarshie', '0302-123456', true
FROM organizations WHERE code='DEMO'
ON CONFLICT DO NOTHING;

INSERT INTO operators (id, org_id, name, pin, role, permissions)
SELECT gen_random_uuid(), id, 'Kwame Asante', '1234', 'owner', ARRAY['*'] FROM organizations WHERE code='DEMO'
ON CONFLICT (org_id, pin) DO NOTHING;
INSERT INTO operators (id, org_id, name, pin, role, permissions)
SELECT gen_random_uuid(), id, 'Ama Mensah', '5678', 'manager', '{}' FROM organizations WHERE code='DEMO'
ON CONFLICT (org_id, pin) DO NOTHING;
INSERT INTO operators (id, org_id, name, pin, role, permissions)
SELECT gen_random_uuid(), id, 'Yaw Boateng', '9012', 'cashier', '{}' FROM organizations WHERE code='DEMO'
ON CONFLICT (org_id, pin) DO NOTHING;
INSERT INTO operators (id, org_id, name, pin, role, permissions)
SELECT gen_random_uuid(), id, 'Abena Osei', '3456', 'accountant', '{}' FROM organizations WHERE code='DEMO'
ON CONFLICT (org_id, pin) DO NOTHING;

-- Store categories
INSERT INTO service_categories (id, org_id, name, sort_order)
SELECT gen_random_uuid(), id, 'Electronics', 1 FROM organizations WHERE code='DEMO'
ON CONFLICT DO NOTHING;
INSERT INTO service_categories (id, org_id, name, sort_order)
SELECT gen_random_uuid(), id, 'Groceries', 2 FROM organizations WHERE code='DEMO'
ON CONFLICT DO NOTHING;
INSERT INTO service_categories (id, org_id, name, sort_order)
SELECT gen_random_uuid(), id, 'Beverages', 3 FROM organizations WHERE code='DEMO'
ON CONFLICT DO NOTHING;

-- Store products (Electronics)
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Samsung Galaxy A15', 'product', 'physical', 150000, 220000, 25, 5, 'piece'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Electronics' WHERE o.code='DEMO'
ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'iPhone Charger', 'product', 'physical', 3500, 6000, 50, 10, 'piece'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Electronics' WHERE o.code='DEMO'
ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Bluetooth Speaker', 'product', 'physical', 8000, 15000, 15, 3, 'piece'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Electronics' WHERE o.code='DEMO'
ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'USB Flash Drive 32GB', 'product', 'physical', 2000, 4500, 40, 10, 'piece'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Electronics' WHERE o.code='DEMO'
ON CONFLICT DO NOTHING;

-- Store products (Groceries)
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Indomie Noodles (Pack)', 'product', 'physical', 800, 1200, 200, 50, 'pack'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Groceries' WHERE o.code='DEMO'
ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Golden Tree Chocolate', 'product', 'physical', 500, 800, 100, 20, 'piece'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Groceries' WHERE o.code='DEMO'
ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Ideal Milk Tin', 'product', 'physical', 600, 950, 150, 30, 'tin'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Groceries' WHERE o.code='DEMO'
ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Rice (5kg bag)', 'product', 'physical', 4500, 6500, 30, 10, 'bag'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Groceries' WHERE o.code='DEMO'
ON CONFLICT DO NOTHING;

-- Store products (Beverages)
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Coca-Cola 500ml', 'product', 'physical', 300, 500, 120, 24, 'bottle'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Beverages' WHERE o.code='DEMO'
ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Voltic Water 1.5L', 'product', 'physical', 200, 350, 200, 48, 'bottle'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Beverages' WHERE o.code='DEMO'
ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Malta Guinness', 'product', 'physical', 350, 600, 80, 24, 'bottle'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Beverages' WHERE o.code='DEMO'
ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Bel-Aqua Sachet Water', 'product', 'physical', 30, 50, 500, 100, 'sachet'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Beverages' WHERE o.code='DEMO'
ON CONFLICT DO NOTHING;

-- Store customers
INSERT INTO contacts (id, org_id, name, phone, type, loyalty_tier, loyalty_points, total_spent, visit_count)
SELECT gen_random_uuid(), id, 'Kofi Mensah', '0244123456', 'customer', 'gold', 520, 450000, 15 FROM organizations WHERE code='DEMO'
ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, loyalty_tier, loyalty_points, total_spent, visit_count)
SELECT gen_random_uuid(), id, 'Efua Darko', '0201987654', 'customer', 'silver', 180, 120000, 8 FROM organizations WHERE code='DEMO'
ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, total_spent, visit_count)
SELECT gen_random_uuid(), id, 'Nana Agyemang', '0551234567', 'customer', 35000, 3 FROM organizations WHERE code='DEMO'
ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, total_spent, visit_count)
SELECT gen_random_uuid(), id, 'Adwoa Poku', '0277654321', 'customer', 80000, 6 FROM organizations WHERE code='DEMO'
ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, total_spent, visit_count)
SELECT gen_random_uuid(), id, 'Kweku Frimpong', '0208765432', 'customer', 15000, 2 FROM organizations WHERE code='DEMO'
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 2. KORLE BU HOSPITAL — Health vertical
-- ═══════════════════════════════════════════════════════════

INSERT INTO organizations (id, code, name, type, tier, active_behaviours, active_modules, payment_gate, tax_config, label_config, max_operators, max_branches)
VALUES (gen_random_uuid(), 'KBH', 'Korle Bu Hospital', 'health', 'T2',
  '{consultation,procedure,product,admission,recurring,admin}',
  '{front-desk,doctor,nurse-station,waiting-room,lab,pharmacy,radiology,ultrasound,ward,icu,maternity,blood-bank,injection-room,billing,bookkeeping}',
  'pay_before', '{"vat":15,"nhil":2.5,"getfund":2.5,"covid":1}'::jsonb,
  '{"consultation":"Doctor Visit","procedure":"Surgery/Procedure","product":"Drugs & Supplies","admission":"Ward Bed","recurring":"Ward Nightly","admin":"Registration"}'::jsonb,
  20, 1)
ON CONFLICT (code) DO NOTHING;

INSERT INTO branches (id, org_id, name, address, phone, is_default)
SELECT gen_random_uuid(), id, 'Main Campus', 'Korle Bu, Accra', '0302-671000', true
FROM organizations WHERE code='KBH'
ON CONFLICT DO NOTHING;

INSERT INTO operators (id, org_id, name, pin, role, permissions)
SELECT gen_random_uuid(), id, 'Dr. Adjei Mensah', '1234', 'doctor', ARRAY['consultation','prescribe','refer','lab_order'] FROM organizations WHERE code='KBH'
ON CONFLICT (org_id, pin) DO NOTHING;
INSERT INTO operators (id, org_id, name, pin, role, permissions)
SELECT gen_random_uuid(), id, 'Nurse Akua Sarpong', '5678', 'nurse', ARRAY['vitals','triage','injection'] FROM organizations WHERE code='KBH'
ON CONFLICT (org_id, pin) DO NOTHING;
INSERT INTO operators (id, org_id, name, pin, role, permissions)
SELECT gen_random_uuid(), id, 'Grace Owusu', '9012', 'cashier', ARRAY['billing','receipts'] FROM organizations WHERE code='KBH'
ON CONFLICT (org_id, pin) DO NOTHING;
INSERT INTO operators (id, org_id, name, pin, role, permissions)
SELECT gen_random_uuid(), id, 'Admin Osei', '3456', 'admin', ARRAY['*'] FROM organizations WHERE code='KBH'
ON CONFLICT (org_id, pin) DO NOTHING;

-- Hospital categories
INSERT INTO service_categories (id, org_id, name, sort_order)
SELECT gen_random_uuid(), id, 'Consultations', 1 FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_categories (id, org_id, name, sort_order)
SELECT gen_random_uuid(), id, 'Lab Tests', 2 FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_categories (id, org_id, name, sort_order)
SELECT gen_random_uuid(), id, 'Imaging', 3 FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_categories (id, org_id, name, sort_order)
SELECT gen_random_uuid(), id, 'Drugs', 4 FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_categories (id, org_id, name, sort_order)
SELECT gen_random_uuid(), id, 'Ward', 5 FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_categories (id, org_id, name, sort_order)
SELECT gen_random_uuid(), id, 'Procedures', 6 FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_categories (id, org_id, name, sort_order)
SELECT gen_random_uuid(), id, 'Emergency', 7 FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;

-- Hospital service items
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price)
SELECT gen_random_uuid(), o.id, c.id, 'General Consultation', 'consultation', 'service', 8000
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Consultations' WHERE o.code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price)
SELECT gen_random_uuid(), o.id, c.id, 'Specialist Consultation', 'consultation', 'service', 15000
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Consultations' WHERE o.code='KBH' ON CONFLICT DO NOTHING;

INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price)
SELECT gen_random_uuid(), o.id, c.id, 'Full Blood Count', 'procedure', 'service', 5000
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Lab Tests' WHERE o.code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price)
SELECT gen_random_uuid(), o.id, c.id, 'Malaria RDT', 'procedure', 'service', 3000
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Lab Tests' WHERE o.code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price)
SELECT gen_random_uuid(), o.id, c.id, 'Urinalysis', 'procedure', 'service', 2500
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Lab Tests' WHERE o.code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price)
SELECT gen_random_uuid(), o.id, c.id, 'Blood Sugar', 'procedure', 'service', 2000
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Lab Tests' WHERE o.code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price)
SELECT gen_random_uuid(), o.id, c.id, 'Liver Function Test', 'procedure', 'service', 8000
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Lab Tests' WHERE o.code='KBH' ON CONFLICT DO NOTHING;

INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price)
SELECT gen_random_uuid(), o.id, c.id, 'Chest X-Ray', 'procedure', 'service', 12000
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Imaging' WHERE o.code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price)
SELECT gen_random_uuid(), o.id, c.id, 'Abdominal Ultrasound', 'procedure', 'service', 15000
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Imaging' WHERE o.code='KBH' ON CONFLICT DO NOTHING;

INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Paracetamol 500mg (x20)', 'product', 'physical', 200, 500, 500, 100, 'pack'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Drugs' WHERE o.code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Amoxicillin 500mg (x21)', 'product', 'physical', 800, 1500, 300, 50, 'pack'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Drugs' WHERE o.code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Artemether/Lumefantrine', 'product', 'physical', 1200, 2500, 200, 40, 'pack'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Drugs' WHERE o.code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Metformin 500mg (x30)', 'product', 'physical', 500, 1000, 150, 30, 'pack'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Drugs' WHERE o.code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Amlodipine 5mg (x30)', 'product', 'physical', 400, 800, 180, 30, 'pack'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Drugs' WHERE o.code='KBH' ON CONFLICT DO NOTHING;

INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price, capacity_total, capacity_used, recurring_interval)
SELECT gen_random_uuid(), o.id, c.id, 'General Ward Bed (Night)', 'admission', 'capacity', 10000, 40, 12, 'daily'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Ward' WHERE o.code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price, capacity_total, capacity_used, recurring_interval)
SELECT gen_random_uuid(), o.id, c.id, 'ICU Bed (Night)', 'admission', 'capacity', 50000, 8, 3, 'daily'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Ward' WHERE o.code='KBH' ON CONFLICT DO NOTHING;

INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price)
SELECT gen_random_uuid(), o.id, c.id, 'Minor Surgery', 'procedure', 'service', 25000
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Procedures' WHERE o.code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price)
SELECT gen_random_uuid(), o.id, c.id, 'Major Surgery', 'procedure', 'service', 150000
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Procedures' WHERE o.code='KBH' ON CONFLICT DO NOTHING;

INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price)
SELECT gen_random_uuid(), o.id, c.id, 'Emergency Room Fee', 'consultation', 'service', 20000
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Emergency' WHERE o.code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price)
SELECT gen_random_uuid(), o.id, c.id, 'Emergency Registration', 'admin', 'service', 5000
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Emergency' WHERE o.code='KBH' ON CONFLICT DO NOTHING;

-- Hospital patients
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender, blood_group)
SELECT gen_random_uuid(), id, 'Kwame Mensah', '0244111222', 'patient', '1985-03-15', 'Male', 'O+' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender, blood_group)
SELECT gen_random_uuid(), id, 'Ama Serwaa', '0201222333', 'patient', '1990-07-22', 'Female', 'A+' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender, blood_group)
SELECT gen_random_uuid(), id, 'Yaw Boateng', '0551333444', 'patient', '1978-11-08', 'Male', 'B+' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender, blood_group)
SELECT gen_random_uuid(), id, 'Abena Konadu', '0277444555', 'patient', '1995-01-30', 'Female', 'AB+' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender, blood_group)
SELECT gen_random_uuid(), id, 'Kofi Asante', '0208555666', 'patient', '2000-06-12', 'Male', 'O-' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender, blood_group)
SELECT gen_random_uuid(), id, 'Akosua Mensah', '0244666777', 'patient', '1988-09-25', 'Female', 'A-' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender)
SELECT gen_random_uuid(), id, 'Kwaku Frimpong', '0201777888', 'patient', '1972-04-18', 'Male' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender, blood_group)
SELECT gen_random_uuid(), id, 'Efua Darkwah', '0551888999', 'patient', '1998-12-05', 'Female', 'B-' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender, blood_group)
SELECT gen_random_uuid(), id, 'Nana Agyemang', '0277999000', 'patient', '1965-08-20', 'Male', 'O+' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender)
SELECT gen_random_uuid(), id, 'Adwoa Poku', '0208000111', 'patient', '2005-02-14', 'Female' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender, blood_group)
SELECT gen_random_uuid(), id, 'Kwesi Owusu', '0244112233', 'patient', '1992-05-30', 'Male', 'AB-' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender, blood_group)
SELECT gen_random_uuid(), id, 'Afia Boateng', '0201223344', 'patient', '1983-10-11', 'Female', 'A+' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender)
SELECT gen_random_uuid(), id, 'Kojo Ampah', '0551334455', 'patient', '2010-07-03', 'Male' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender, blood_group)
SELECT gen_random_uuid(), id, 'Akua Sarpong', '0277445566', 'patient', '1975-01-19', 'Female', 'B+' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender, blood_group)
SELECT gen_random_uuid(), id, 'Yaw Mensah', '0208556677', 'patient', '1960-11-28', 'Male', 'O+' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender, blood_group)
SELECT gen_random_uuid(), id, 'Esi Bonsu', '0244778899', 'patient', '1997-03-07', 'Female', 'A+' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender)
SELECT gen_random_uuid(), id, 'Kwabena Asare', '0201889900', 'patient', '1980-08-14', 'Male' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender, blood_group)
SELECT gen_random_uuid(), id, 'Akosua Owusu', '0551990011', 'patient', '2002-12-22', 'Female', 'AB+' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender, blood_group)
SELECT gen_random_uuid(), id, 'Kofi Adomako', '0277001122', 'patient', '1955-06-09', 'Male', 'B-' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;
INSERT INTO contacts (id, org_id, name, phone, type, date_of_birth, gender)
SELECT gen_random_uuid(), id, 'Abena Nyarko', '0208223344', 'patient', '1993-04-16', 'Female' FROM organizations WHERE code='KBH' ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 3. DEMO ACADEMY — Institute vertical
-- ═══════════════════════════════════════════════════════════

INSERT INTO organizations (id, code, name, type, tier, active_behaviours, active_modules, payment_gate, tax_config, label_config, max_operators, max_branches)
VALUES (gen_random_uuid(), 'ACAD', 'Demo Academy', 'institute', 'T2',
  '{recurring,admin}',
  '{enrollment,groups,subjects,exams,gradebook,attendance,fees,payments,schedule,calendar,communication,staff}',
  'pay_before', '{"vat":15,"nhil":2.5,"getfund":2.5,"covid":1}'::jsonb,
  '{"recurring":"Term Fees","admin":"Administration"}'::jsonb,
  15, 1)
ON CONFLICT (code) DO NOTHING;

INSERT INTO branches (id, org_id, name, address, phone, is_default)
SELECT gen_random_uuid(), id, 'Main Campus', 'East Legon, Accra', '0302-555123', true
FROM organizations WHERE code='ACAD'
ON CONFLICT DO NOTHING;

INSERT INTO operators (id, org_id, name, pin, role, permissions)
SELECT gen_random_uuid(), id, 'Mrs. Ampomah', '1234', 'admin', ARRAY['*'] FROM organizations WHERE code='ACAD'
ON CONFLICT (org_id, pin) DO NOTHING;
INSERT INTO operators (id, org_id, name, pin, role, permissions)
SELECT gen_random_uuid(), id, 'Mr. Mensah', '5678', 'teacher', ARRAY['grades','attendance'] FROM organizations WHERE code='ACAD'
ON CONFLICT (org_id, pin) DO NOTHING;
INSERT INTO operators (id, org_id, name, pin, role, permissions)
SELECT gen_random_uuid(), id, 'Ms. Darko', '9012', 'registrar', ARRAY['enrollment','fees'] FROM organizations WHERE code='ACAD'
ON CONFLICT (org_id, pin) DO NOTHING;
INSERT INTO operators (id, org_id, name, pin, role, permissions)
SELECT gen_random_uuid(), id, 'Mr. Osei', '3456', 'accountant', ARRAY['fees','payments','reports'] FROM organizations WHERE code='ACAD'
ON CONFLICT (org_id, pin) DO NOTHING;

-- School categories
INSERT INTO service_categories (id, org_id, name, sort_order)
SELECT gen_random_uuid(), id, 'Tuition', 1 FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO service_categories (id, org_id, name, sort_order)
SELECT gen_random_uuid(), id, 'Miscellaneous', 2 FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;

-- School items
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price, recurring_interval)
SELECT gen_random_uuid(), o.id, c.id, 'Term Tuition Fee', 'recurring', 'service', 250000, 'termly'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Tuition' WHERE o.code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price, recurring_interval)
SELECT gen_random_uuid(), o.id, c.id, 'PTA Levy', 'recurring', 'service', 15000, 'termly'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Tuition' WHERE o.code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, selling_price, recurring_interval)
SELECT gen_random_uuid(), o.id, c.id, 'ICT Lab Fee', 'recurring', 'service', 8000, 'termly'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Tuition' WHERE o.code='ACAD' ON CONFLICT DO NOTHING;

INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'School Uniform', 'product', 'physical', 8000, 12000, 50, 10, 'set'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Miscellaneous' WHERE o.code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO service_items (id, org_id, category_id, name, behaviour, stock_type, cost_price, selling_price, stock, min_stock, unit)
SELECT gen_random_uuid(), o.id, c.id, 'Exercise Books (Pack of 10)', 'product', 'physical', 1500, 2500, 200, 50, 'pack'
FROM organizations o JOIN service_categories c ON c.org_id=o.id AND c.name='Miscellaneous' WHERE o.code='ACAD' ON CONFLICT DO NOTHING;

-- School groups
INSERT INTO groups (id, org_id, name, type, academic_year, term, capacity)
SELECT gen_random_uuid(), id, 'Class 1A', 'class', '2025/2026', 'Term 2', 35 FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO groups (id, org_id, name, type, academic_year, term, capacity)
SELECT gen_random_uuid(), id, 'Class 1B', 'class', '2025/2026', 'Term 2', 35 FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO groups (id, org_id, name, type, academic_year, term, capacity)
SELECT gen_random_uuid(), id, 'Class 2A', 'class', '2025/2026', 'Term 2', 30 FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO groups (id, org_id, name, type, academic_year, term, capacity)
SELECT gen_random_uuid(), id, 'Class 2B', 'class', '2025/2026', 'Term 2', 30 FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO groups (id, org_id, name, type, academic_year, term, capacity)
SELECT gen_random_uuid(), id, 'Class 3A', 'class', '2025/2026', 'Term 2', 30 FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO groups (id, org_id, name, type, academic_year, term, capacity)
SELECT gen_random_uuid(), id, 'Class 3B', 'class', '2025/2026', 'Term 2', 30 FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;

-- School subjects
INSERT INTO subjects (id, org_id, name, department)
SELECT gen_random_uuid(), id, 'Mathematics', 'Sciences' FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO subjects (id, org_id, name, department)
SELECT gen_random_uuid(), id, 'English Language', 'Languages' FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO subjects (id, org_id, name, department)
SELECT gen_random_uuid(), id, 'Science', 'Sciences' FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO subjects (id, org_id, name, department)
SELECT gen_random_uuid(), id, 'Social Studies', 'Humanities' FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO subjects (id, org_id, name, department)
SELECT gen_random_uuid(), id, 'ICT', 'Sciences' FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO subjects (id, org_id, name, department)
SELECT gen_random_uuid(), id, 'French', 'Languages' FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO subjects (id, org_id, name, department)
SELECT gen_random_uuid(), id, 'Creative Arts', 'Arts' FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO subjects (id, org_id, name, department)
SELECT gen_random_uuid(), id, 'Physical Education', 'Sports' FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO subjects (id, org_id, name, department)
SELECT gen_random_uuid(), id, 'Religious & Moral Education', 'Humanities' FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;
INSERT INTO subjects (id, org_id, name, department)
SELECT gen_random_uuid(), id, 'Ghanaian Language (Twi)', 'Languages' FROM organizations WHERE code='ACAD' ON CONFLICT DO NOTHING;

-- School students (assigned to groups round-robin)
INSERT INTO contacts (id, org_id, name, phone, type, group_id, date_of_birth, gender, enrolled_at)
SELECT gen_random_uuid(), o.id, s.name, s.phone, 'student', g.id, s.dob, s.gender, '2025-09-01'
FROM organizations o,
  (VALUES ('Kwame Adu','0244000000','2012-01-01','Male',0),('Ama Boateng','0244000001','2013-02-02','Female',1),
          ('Yaw Nkrumah','0244000002','2014-03-03','Male',2),('Abena Mensah','0244000003','2015-04-04','Female',3),
          ('Kofi Appiah','0244000004','2012-05-05','Male',4),('Akua Asante','0244000005','2013-06-06','Female',5),
          ('Kweku Owusu','0244000006','2014-07-07','Male',0),('Efua Darko','0244000007','2015-08-08','Female',1),
          ('Nana Osei','0244000008','2012-09-09','Male',2),('Adwoa Frimpong','0244000009','2013-10-10','Female',3),
          ('Kwesi Adomako','0244000010','2014-11-11','Male',4),('Afia Bonsu','0244000011','2015-12-12','Female',5),
          ('Kojo Sarpong','0244000012','2012-01-13','Male',0),('Akosua Nyarko','0244000013','2013-02-14','Female',1),
          ('Yaw Poku','0244000014','2014-03-15','Male',2)
  ) AS s(name, phone, dob, gender, gidx),
  LATERAL (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 AS rn FROM groups WHERE org_id = o.id) g
WHERE o.code='ACAD' AND g.rn = s.gidx
ON CONFLICT DO NOTHING;
