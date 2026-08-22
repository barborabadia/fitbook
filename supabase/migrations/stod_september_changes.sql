-- Stod změny od září 2026
-- 1. XXL cvičení - Stod: čas 18:00 → 18:15
UPDATE training_templates
SET start_time = '18:15'
WHERE name = 'XXL cvičení - Stod';

-- 2. Posilování na hudbu - Stod → Tabata - Stod, cena 150 Kč
UPDATE training_templates
SET name = 'Tabata - Stod', price = 150
WHERE name = 'Posilování na hudbu - Stod';

-- 3. Přejmenovat budoucí sloty (od září) v training_slots
UPDATE training_slots
SET name = 'Tabata - Stod'
WHERE name = 'Posilování na hudbu - Stod'
  AND slot_date >= '2026-09-01';
