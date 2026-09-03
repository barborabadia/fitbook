-- =============================================
-- Migrace: Šablony Nýřany (Neděle)
-- Spusť v Supabase SQL Editoru
-- =============================================

-- Neděle = day_of_week 6 (0=Pondělí, 6=Neděle)
-- Cena klientky: 135 Kč
-- Čistý zisk: 70 Kč/os. (65 Kč jde fitku)
INSERT INTO training_templates (name, day_of_week, start_time, duration_minutes, capacity, color, price, is_active)
VALUES
  ('XXL cvičení - Nýřany', 6, '09:30', 60, 10, '#E74C3C', 135, true),
  ('Tabata - Nýřany',      6, '10:30', 60, 10, '#E74C3C', 135, true);
