-- Insert Club Name and Cashier Names into master_data table

-- Insert Club Name (you can add your actual club name)
INSERT INTO master_data (category, value, display_order, is_active)
VALUES 
  ('club_name', 'Investment Club', 1, true);

-- Insert Cashier Names
INSERT INTO master_data (category, value, display_order, is_active)
VALUES 
  ('cashier_name', 'Mamun', 1, true),
  ('cashier_name', 'Sufiyan', 2, true);
