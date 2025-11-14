-- Add Investment Fund as deduct from option for expenses
-- This allows expenses to be deducted from project investment funds

-- Insert investment fund type into master_data
INSERT INTO master_data (category, value, display_order, is_active, created_at, updated_at) 
VALUES
('deduct_from_type', 'Investment Fund', 1, true, NOW(), NOW()),
('deduct_from_type', 'Savings Fund', 2, true, NOW(), NOW())
ON CONFLICT (category, value) DO NOTHING;

-- Note: The application will dynamically load:
-- 1. Regular funds from 'funds' table
-- 2. Project cashiers from 'projects' table (project_cashier_name column)
-- 
-- The deduct_from field in expenses table will store either:
-- - fund_id (for regular funds)
-- - 'project_cashier:{cashier_name}' (for project investment funds)
