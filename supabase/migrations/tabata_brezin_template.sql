-- =============================================
-- Migrace: Šablona Tabata - Březín (Pátek 18:00)
-- Spusť v Supabase SQL Editoru
-- =============================================

-- Pátek = day_of_week 4 (0=Pondělí, 4=Pátek)
-- Cena klientky: 150 Kč
-- Pronájem sálu: 250 Kč (odečítá se automaticky ve statistikách)
INSERT INTO training_templates (name, day_of_week, start_time, duration_minutes, capacity, color, price, is_active)
VALUES
  ('Tabata - Březín', 4, '18:00', 60, 12, '#E74C3C', 150, true);
