-- Oprava barev: osobní tréninky tmavě růžová, skupinové světle růžová

-- Šablony
UPDATE training_templates SET color = '#C8516B' WHERE name = 'Osobní trénink';
UPDATE training_templates SET color = '#E8779E' WHERE name IN (
  'XXL cvičení - Stod',
  'Funkční trénink - Stod',
  'XXL cvičení - Zbůch',
  'Posilování na hudbu - Zbůch',
  'FIT Orient - Zbůch'
);

-- Existující sloty (všechny, nejen budoucí)
UPDATE training_slots SET color = '#C8516B' WHERE name = 'Osobní trénink';
UPDATE training_slots SET color = '#E8779E' WHERE name IN (
  'XXL cvičení - Stod',
  'Funkční trénink - Stod',
  'XXL cvičení - Zbůch',
  'Posilování na hudbu - Zbůch',
  'FIT Orient - Zbůch'
);
