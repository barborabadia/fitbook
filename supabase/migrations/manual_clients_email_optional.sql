-- Umožní přidávat klienty bez emailu
ALTER TABLE manual_clients ALTER COLUMN email DROP NOT NULL;
