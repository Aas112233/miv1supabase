-- Add expense categories to master data

INSERT INTO master_data (category, value, display_order, is_active) VALUES
('expense_category', 'Office Supplies', 1, true),
('expense_category', 'Utilities', 2, true),
('expense_category', 'Transportation', 3, true),
('expense_category', 'Marketing', 4, true),
('expense_category', 'Maintenance', 5, true),
('expense_category', 'Professional Fees', 6, true),
('expense_category', 'Other', 7, true)
ON CONFLICT (category, value) DO NOTHING;
