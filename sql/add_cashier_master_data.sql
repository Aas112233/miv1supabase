-- Add cashier entries to master_data table
INSERT INTO master_data (category, value, display_order, is_active) VALUES
('cashier', 'Cashier 1', 1, true),
('cashier', 'Cashier 2', 2, true),
('cashier', 'Cashier 3', 3, true),
('cashier', 'Cashier 4', 4, true),
('cashier', 'Cashier 5', 5, true)
ON CONFLICT (category, value) DO NOTHING;
