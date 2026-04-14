-- Card template system for /cards-bookings module.
-- card_template: key of a built-in preset ("classic_copper", "photo_id",
--   "minimal_clinical", "premium_black") OR "custom" when the hospital has
--   uploaded its own template.
-- card_template_custom: JSONB blob for uploaded templates. Shape:
--   { bg: string (data URL or asset URL), fields: [{ key, x, y, fontSize, color, weight, align }] }
--   Coordinates are in mm on a 85.6×53.98mm CR80 canvas.

ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS card_template TEXT DEFAULT 'classic_copper',
  ADD COLUMN IF NOT EXISTS card_template_custom JSONB;
