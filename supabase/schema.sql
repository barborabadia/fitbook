-- =============================================
-- FITBOOK – Databázové schéma pro Supabase
-- Spusť tento SQL v Supabase SQL Editoru
-- =============================================

-- Tabulka tréninků (opakující se každý týden)
create table trainings (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Pondělí, 6=Neděle
  start_time text not null,           -- např. "07:00"
  duration_minutes integer default 60,
  capacity integer not null default 8,
  color text default '#FF4D00',
  description text,
  created_at timestamptz default now()
);

-- Tabulka rezervací
create table bookings (
  id uuid default gen_random_uuid() primary key,
  training_id uuid references trainings(id) on delete cascade not null,
  week_start date not null,           -- pondělí daného týdne, ke kterému rezervace patří
  client_name text not null,
  client_email text not null,
  client_phone text,
  status text default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz default now()
);

-- Index pro rychlé dotazy
create index bookings_training_week on bookings(training_id, week_start);
create index bookings_email on bookings(client_email);

-- =============================================
-- Row Level Security (RLS) – kdo co smí
-- =============================================

alter table trainings enable row level security;
alter table bookings enable row level security;

-- Klienti mohou číst tréninky
create policy "Veřejné čtení tréninků"
  on trainings for select using (true);

-- Klienti mohou číst rezervace (pro kontrolu obsazenosti)
create policy "Veřejné čtení rezervací"
  on bookings for select using (true);

-- Klienti mohou vytvářet rezervace
create policy "Veřejné vytváření rezervací"
  on bookings for insert with check (true);

-- Klienti mohou rušit své vlastní rezervace
create policy "Klient může rušit své rezervace"
  on bookings for update
  using (true)
  with check (status = 'cancelled');

-- =============================================
-- Ukázková data (volitelné)
-- =============================================

insert into trainings (name, day_of_week, start_time, duration_minutes, capacity, color, description) values
  ('Ranní HIIT', 0, '07:00', 45, 6, '#FF4D00', 'Intenzivní intervalový trénink na spalování tuků'),
  ('Silový trénink', 0, '10:00', 60, 4, '#00C2A8', 'Trénink zaměřený na budování svalové hmoty'),
  ('Ranní HIIT', 1, '08:00', 45, 6, '#FF4D00', 'Intenzivní intervalový trénink na spalování tuků'),
  ('Kruhový trénink', 1, '17:00', 50, 8, '#FFB800', 'Komplexní trénink celého těla'),
  ('Silový trénink', 3, '17:30', 60, 4, '#00C2A8', 'Trénink zaměřený na budování svalové hmoty'),
  ('Protahování', 2, '12:00', 30, 10, '#7C3AED', 'Regenerační protahovací lekce'),
  ('Ranní HIIT', 4, '07:00', 45, 6, '#FF4D00', 'Intenzivní intervalový trénink na spalování tuků'),
  ('Víkendová výzva', 5, '09:00', 75, 12, '#FFB800', 'Speciální sobotní trénink pro všechny úrovně');
