-- Add meta JSON column to device_operators for operator-specific config
-- (ward assignment, preferences, etc.)
ALTER TABLE device_operators ADD COLUMN IF NOT EXISTS meta JSONB;
