-- =============================================
-- Migrace: Nové šablony osobních tréninků + světle růžová pro skupinové
-- Spusť v Supabase SQL Editoru
-- =============================================

-- 1. Smaž stávající šablony Osobní trénink pro upravované dny
--    (0=Po, 1=Út, 2=St, 3=Čt, 4=Pá, 5=So, 6=Ne)
DELETE FROM training_templates
WHERE name = 'Osobní trénink'
  AND day_of_week IN (1, 3, 4, 5, 6);

-- 2. Vlož nové šablony Osobní trénink

-- Úterý: 18:30 – 19:30
INSERT INTO training_templates (name, day_of_week, start_time, duration_minutes, capacity, color, price, is_active) VALUES
  ('Osobní trénink', 1, '18:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 1, '19:30', 60, 1, '#C8516B', 200, true);

-- Čtvrtek: 16:30 – 19:30
INSERT INTO training_templates (name, day_of_week, start_time, duration_minutes, capacity, color, price, is_active) VALUES
  ('Osobní trénink', 3, '16:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 3, '17:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 3, '18:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 3, '19:30', 60, 1, '#C8516B', 200, true);

-- Pátek: 18:30 – 19:30
INSERT INTO training_templates (name, day_of_week, start_time, duration_minutes, capacity, color, price, is_active) VALUES
  ('Osobní trénink', 4, '18:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 4, '19:30', 60, 1, '#C8516B', 200, true);

-- Sobota: 06:30 – 19:30
INSERT INTO training_templates (name, day_of_week, start_time, duration_minutes, capacity, color, price, is_active) VALUES
  ('Osobní trénink', 5, '06:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 5, '07:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 5, '08:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 5, '09:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 5, '10:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 5, '11:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 5, '12:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 5, '13:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 5, '14:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 5, '15:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 5, '16:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 5, '17:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 5, '18:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 5, '19:30', 60, 1, '#C8516B', 200, true);

-- Neděle: 09:30 – 19:30
INSERT INTO training_templates (name, day_of_week, start_time, duration_minutes, capacity, color, price, is_active) VALUES
  ('Osobní trénink', 6, '09:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 6, '10:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 6, '11:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 6, '12:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 6, '13:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 6, '14:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 6, '15:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 6, '16:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 6, '17:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 6, '18:30', 60, 1, '#C8516B', 200, true),
  ('Osobní trénink', 6, '19:30', 60, 1, '#C8516B', 200, true);

-- 3. Světle růžová pro skupinové tréninky (šablony i budoucí sloty)
UPDATE training_templates
SET color = '#E8779E'
WHERE name LIKE '% - Stod' OR name LIKE '% - Zbůch';

UPDATE training_slots
SET color = '#E8779E'
WHERE (name LIKE '% - Stod' OR name LIKE '% - Zbůch')
  AND slot_date >= CURRENT_DATE;
