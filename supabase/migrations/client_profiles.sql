-- Profily klientů – datum narození (platí pro všechny klienty, i bez manuálního záznamu)
CREATE TABLE IF NOT EXISTS client_profiles (
  email      TEXT PRIMARY KEY,
  birth_date DATE
);

ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public all client_profiles" ON client_profiles USING (true) WITH CHECK (true);
