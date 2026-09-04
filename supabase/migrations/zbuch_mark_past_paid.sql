-- =============================================
-- Migrace: Označit minulé Zbůch rezervace jako zaplacené
-- Zbůch přešel z hotovosti na QR platbu od 3.9.2026.
-- Všechny předchozí rezervace byly hrazeny hotovostí
-- přímo organizátorovi – v systému je označíme jako paid.
-- Spusť v Supabase SQL Editoru
-- =============================================

UPDATE bookings
SET paid = true
WHERE status = 'confirmed'
  AND paid = false
  AND slot_id IN (
    SELECT id FROM training_slots
    WHERE name ILIKE '%Zbůch%'
      AND slot_date < '2026-09-03'
  );
