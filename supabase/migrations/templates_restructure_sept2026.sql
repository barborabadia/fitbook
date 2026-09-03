-- =============================================
-- Migrace: Kompletní restrukturalizace šablon od září 2026
-- Spusť v Supabase SQL Editoru
-- =============================================

-- 1. Deaktivovat všechny stávající šablony
UPDATE training_templates SET is_active = false;

-- 2. Vložit nové šablony
-- day_of_week: 0=Pondělí, 1=Úterý, 2=Středa, 3=Čtvrtek, 4=Pátek, 5=Sobota, 6=Neděle

INSERT INTO training_templates (name, day_of_week, start_time, duration_minutes, capacity, color, price, is_active)
VALUES

  -- PONDĚLÍ
  ('Posilování na hudbu - Zbůch', 0, '18:30', 60, 10, '#E74C3C', 130, true),
  ('FIT Orient - Zbůch',          0, '19:30', 60, 10, '#E74C3C', 130, true),

  -- ÚTERÝ – nic

  -- STŘEDA
  ('Osobní trénink',       2, '17:00', 60, 1,  '#C8516B', 300, true),
  ('XXL cvičení - Stod',   2, '18:15', 60, 10, '#E74C3C', 150, true),
  ('Tabata - Stod',        2, '19:15', 60, 10, '#E74C3C', 150, true),

  -- ČTVRTEK – nic

  -- PÁTEK
  ('Tabata - Březín', 4, '19:00', 60, 12, '#E74C3C', 150, true),

  -- SOBOTA – osobní tréninky každou hodinu 6:30–19:30
  ('Osobní trénink', 5, '06:30', 60, 1, '#C8516B', 300, true),
  ('Osobní trénink', 5, '07:30', 60, 1, '#C8516B', 300, true),
  ('Osobní trénink', 5, '08:30', 60, 1, '#C8516B', 300, true),
  ('Osobní trénink', 5, '09:30', 60, 1, '#C8516B', 300, true),
  ('Osobní trénink', 5, '10:30', 60, 1, '#C8516B', 300, true),
  ('Osobní trénink', 5, '11:30', 60, 1, '#C8516B', 300, true),
  ('Osobní trénink', 5, '12:30', 60, 1, '#C8516B', 300, true),
  ('Osobní trénink', 5, '13:30', 60, 1, '#C8516B', 300, true),
  ('Osobní trénink', 5, '14:30', 60, 1, '#C8516B', 300, true),
  ('Osobní trénink', 5, '15:30', 60, 1, '#C8516B', 300, true),
  ('Osobní trénink', 5, '16:30', 60, 1, '#C8516B', 300, true),
  ('Osobní trénink', 5, '17:30', 60, 1, '#C8516B', 300, true),
  ('Osobní trénink', 5, '18:30', 60, 1, '#C8516B', 300, true),
  ('Osobní trénink', 5, '19:30', 60, 1, '#C8516B', 300, true),

  -- NEDĚLE
  ('Osobní trénink',       6, '06:30', 60, 1,  '#C8516B', 300, true),
  ('XXL cvičení - Zbůch',  6, '08:00', 60, 10, '#E74C3C', 130, true),
  ('XXL cvičení - Nýřany', 6, '09:30', 60, 10, '#E74C3C', 135, true),
  ('Tabata - Nýřany',      6, '10:30', 60, 10, '#E74C3C', 135, true),
  ('Osobní trénink',       6, '12:30', 60, 1,  '#C8516B', 300, true),
  ('Osobní trénink',       6, '13:30', 60, 1,  '#C8516B', 300, true),
  ('Osobní trénink',       6, '14:30', 60, 1,  '#C8516B', 300, true),
  ('Osobní trénink',       6, '15:30', 60, 1,  '#C8516B', 300, true);
