-- Tabulka pro historická data skupinových tréninků (import z Tabidoo)
CREATE TABLE historical_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_date DATE NOT NULL,
  session_name TEXT NOT NULL,
  attendance INT NOT NULL DEFAULT 0,
  revenue INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE historical_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON historical_sessions FOR SELECT USING (true);
CREATE POLICY "Public insert" ON historical_sessions FOR INSERT WITH CHECK (true);

-- Import skupinových tréninků z Tabidoo zálohy
-- (Zisk = čistý příjem trenérky, u Stod již po odečtení nákladů na sál)
INSERT INTO historical_sessions (session_date, session_name, attendance, revenue) VALUES
-- Duben 2026
('2026-04-12', 'XXL cvičení Zbůch',              4,  200),
('2026-04-08', 'XXL cvičení Stod',               6,  520),
('2026-04-01', 'XXL cvičení Stod',               5,  400),
-- Březen 2026
('2026-03-29', 'XXL cvičení Zbůch',              5,  200),
('2026-03-25', 'XXL cvičení Stod',               7,  640),
('2026-03-23', 'FIT Orient Zbůch',               3,  200),
('2026-03-22', 'XXL cvičení Zbůch',              6,  250),
('2026-03-18', 'XXL cvičení Stod',               5,  400),
('2026-03-15', 'XXL cvičení Zbůch',              5,  200),
('2026-03-11', 'XXL cvičení Stod',               7,  640),
('2026-03-09', 'FIT Orient Zbůch',               3,  200),
('2026-03-08', 'XXL cvičení Zbůch',              4,  200),
('2026-03-02', 'FIT Orient Zbůch',               2,  200),
('2026-03-01', 'XXL cvičení Zbůch',              6,  250),
-- Únor 2026
('2026-02-27', 'XXL cvičení Holýšov',            3,  240),
('2026-02-25', 'XXL cvičení Stod',               8,  760),
('2026-02-22', 'Cvičení Březín',                 7,  500),
('2026-02-22', 'XXL cvičení Zbůch',              7,  200),
('2026-02-20', 'XXL cvičení Holýšov',            4,  320),
('2026-02-18', 'Funkční trénink pro ženy Stod',  3,  160),
('2026-02-18', 'XXL cvičení Stod',               8,  760),
('2026-02-15', 'Cvičení Březín',                 4,  500),
('2026-02-13', 'XXL cvičení Holýšov',            3,  240),
('2026-02-11', 'Funkční trénink pro ženy Stod',  2,   40),
('2026-02-11', 'XXL cvičení Stod',               6,  520),
('2026-02-04', 'Funkční trénink pro ženy Stod',  3,  160),
('2026-02-04', 'XXL cvičení Stod',               8,  760),
('2026-02-02', 'FIT Orient Zbůch',               5,  200),
('2026-02-01', 'Cvičení Březín',                 8,  500),
('2026-02-01', 'XXL cvičení Zbůch',              8,  250),
-- Leden 2026
('2026-01-30', 'XXL cvičení Holýšov',            3,  240),
('2026-01-28', 'Funkční trénink pro ženy Stod',  5,  400),
('2026-01-28', 'XXL cvičení Stod',               9,  880),
('2026-01-26', 'FIT Orient Zbůch',               4,  150),
('2026-01-25', 'XXL cvičení Zbůch',              7,  200),
('2026-01-24', 'Cvičení Březín',                 8,  500),
('2026-01-21', 'Funkční trénink pro ženy Stod',  3,  160),
('2026-01-21', 'XXL cvičení Stod',              13, 1360),
('2026-01-18', 'XXL cvičení Zbůch',              9,  250),
('2026-01-14', 'XXL cvičení Stod',               7,  640),
('2026-01-11', 'XXL cvičení Zbůch',              7,  200),
('2026-01-07', 'XXL cvičení Stod',               6,  520),
('2026-01-05', 'FIT Orient Zbůch',               5,  200),
('2026-01-04', 'XXL cvičení Zbůch',              2,  150),
('2026-01-03', 'Cvičení Březín',                 6,  200),
('2026-01-02', 'XXL cvičení Holýšov',            4,  320),
-- Prosinec 2025
('2025-12-28', 'XXL cvičení Zbůch',              4,  150),
('2025-12-14', 'XXL cvičení Zbůch',              7,  200),
('2025-12-13', 'Cvičení Březín',                 6,  200),
('2025-12-10', 'Funkční trénink pro ženy Stod',  5,  400),
('2025-12-10', 'XXL cvičení Stod',               5,  400),
('2025-12-08', 'FIT Orient Zbůch',               5,  200),
('2025-12-07', 'XXL cvičení Zbůch',              5,  200),
('2025-12-05', 'XXL cvičení Holýšov',            4,  320),
('2025-12-03', 'Funkční trénink pro ženy Stod',  3,  160),
('2025-12-03', 'XXL cvičení Stod',               4,  280),
('2025-12-01', 'FIT Orient Zbůch',               4,  150),
-- Listopad 2025
('2025-11-30', 'Cvičení Březín',                 6,  200),
('2025-11-30', 'XXL cvičení Zbůch',              6,  200),
('2025-11-29', 'XXL cvičení Zbůch',              3,  150),
('2025-11-28', 'XXL cvičení Holýšov',            3,  240),
('2025-11-26', 'Funkční trénink pro ženy Stod',  3,  160),
('2025-11-26', 'XXL cvičení Stod',               5,  400),
('2025-11-23', 'XXL cvičení Zbůch',              7,  200),
('2025-11-17', 'FIT Orient Zbůch',               6,  200),
('2025-11-16', 'XXL cvičení Zbůch',              8,  250),
('2025-11-14', 'XXL cvičení Holýšov',            5,  400),
('2025-11-12', 'Funkční trénink pro ženy Stod',  7,  640),
('2025-11-12', 'XXL cvičení Stod',               7,  640),
('2025-11-10', 'FIT Orient Zbůch',               4,  150),
('2025-11-07', 'XXL cvičení Holýšov',            3,  240),
('2025-11-05', 'Funkční trénink pro ženy Stod',  5,  400),
('2025-11-05', 'XXL cvičení Stod',               3,  160),
('2025-11-03', 'FIT Orient Zbůch',               4,  150),
('2025-11-02', 'XXL cvičení Zbůch',              7,  200);
