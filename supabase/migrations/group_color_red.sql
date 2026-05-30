-- Skupinové tréninky: světle červená místo světle růžové
UPDATE training_templates SET color = '#E74C3C' WHERE name IN (
  'XXL cvičení - Stod', 'Funkční trénink - Stod',
  'XXL cvičení - Zbůch', 'Posilování na hudbu - Zbůch', 'FIT Orient - Zbůch'
);
UPDATE training_slots SET color = '#E74C3C' WHERE name IN (
  'XXL cvičení - Stod', 'Funkční trénink - Stod',
  'XXL cvičení - Zbůch', 'Posilování na hudbu - Zbůch', 'FIT Orient - Zbůch'
);
