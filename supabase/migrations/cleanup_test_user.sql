-- Smazání testovacích dat pro knizektomas3@gmail.com

DELETE FROM bookings WHERE client_email = 'knizektomas3@gmail.com';
DELETE FROM manual_clients WHERE email = 'knizektomas3@gmail.com';
DELETE FROM client_profiles WHERE email = 'knizektomas3@gmail.com';
