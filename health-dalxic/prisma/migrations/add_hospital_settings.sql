-- Add settings JSONB column to hospitals
-- Holds pricing blob and any other hospital-level configuration.
-- Shape: { pricing: { defaults, doctors, wards, services } }
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS settings JSONB;
