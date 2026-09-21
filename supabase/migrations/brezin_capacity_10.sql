-- =============================================
-- Migrace: Snížení kapacity Tabata - Březín na 10
-- Spusť v Supabase SQL Editoru
-- =============================================

-- 1. Šablona
UPDATE training_templates
SET capacity = 10
WHERE name = 'Tabata - Březín';

-- 2. Budoucí sloty
UPDATE training_slots
SET capacity = 10
WHERE name = 'Tabata - Březín'
  AND slot_date >= CURRENT_DATE;
