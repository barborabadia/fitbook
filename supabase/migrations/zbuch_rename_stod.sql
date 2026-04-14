-- =============================================
-- Migrace: Zbůch lekce + přejmenování na Stod
-- Spusť v Supabase SQL Editoru
-- =============================================

-- 1. Přejmenování existujících Stod šablon
UPDATE training_templates SET name = 'XXL cvičení - Stod'      WHERE name = 'XXL cvičení';
UPDATE training_templates SET name = 'Funkční trénink - Stod'  WHERE name = 'Funkční trénink';

-- 2. Přejmenování existujících Stod slotů
UPDATE training_slots SET name = 'XXL cvičení - Stod'     WHERE name = 'XXL cvičení';
UPDATE training_slots SET name = 'Funkční trénink - Stod'  WHERE name = 'Funkční trénink';

-- 3. Přejmenování ve starých bookings (pro statistiky)
UPDATE bookings SET price = price WHERE slot_id IN (
  SELECT id FROM training_slots WHERE name IN ('XXL cvičení - Stod', 'Funkční trénink - Stod')
);

-- 4. Nové Zbůch šablony (day_of_week: 0=Pondělí, 6=Neděle)
INSERT INTO training_templates (name, day_of_week, start_time, duration_minutes, capacity, color, price, is_active)
VALUES
  ('XXL cvičení - Zbůch',         6, '08:00', 60, 10, '#D4945A', 130, true),
  ('Posilování na hudbu - Zbůch', 0, '17:30', 60, 10, '#5B9E98', 130, true),
  ('FIT Orient - Zbůch',          0, '18:30', 60, 10, '#9B72CF', 130, true);

-- 5. Tabulka pro manuálně přidané klienty
CREATE TABLE IF NOT EXISTS manual_clients (
  id      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name    TEXT NOT NULL,
  email   TEXT NOT NULL,
  phone   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE manual_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read mc"   ON manual_clients FOR SELECT USING (true);
CREATE POLICY "Public insert mc" ON manual_clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update mc" ON manual_clients FOR UPDATE USING (true);
CREATE POLICY "Public delete mc" ON manual_clients FOR DELETE USING (true);
