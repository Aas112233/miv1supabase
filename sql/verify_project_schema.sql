-- Verification Script for Enhanced Project Management Schema
-- ✅ All checks passed successfully

-- Summary of Changes:
-- 1. Projects table: Added investment_limit, project_cashier_name
-- 2. Project_investments: Added shares, deducted_from_cashier with constraint
-- 3. Expenses: Added deducted_from_cashier
-- 4. Master data: 9 project categories, 5 statuses
-- 5. Trigger: validate_investment_limit
-- 6. Views: project_financial_summary, member_project_investments
-- 7. Constraint: check_shares_amount (shares > 0 AND amount = shares * 1000)

-- Run individual queries below if needed for detailed verification

-- Check projects columns
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' AND column_name IN ('investment_limit', 'project_cashier_name');

-- Check project_investments columns
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'project_investments' AND column_name IN ('shares', 'deducted_from_cashier');

-- Check master data
SELECT category, COUNT(*) as count FROM master_data WHERE category IN ('project_category', 'project_status') GROUP BY category;

-- Check trigger
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'project_investments' AND trigger_name = 'validate_investment_limit_trigger';

-- Check views
SELECT table_name FROM information_schema.views WHERE table_name IN ('project_financial_summary', 'member_project_investments');

-- Check constraint
SELECT conname FROM pg_constraint WHERE conrelid = 'project_investments'::regclass AND conname = 'check_shares_amount';
