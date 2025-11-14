-- Enhanced Project Management System Schema Migration
-- This migration enhances the project management system with investment limits,
-- cashier integration, share-based investments, and proper data connections

-- ============================================================================
-- STEP 1: Update projects table
-- ============================================================================

-- Add new columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS investment_limit DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS project_cashier_name TEXT;

-- Drop columns that are no longer needed
ALTER TABLE projects 
DROP COLUMN IF EXISTS initial_investment,
DROP COLUMN IF EXISTS monthly_revenue,
DROP COLUMN IF EXISTS assigned_member_id;

-- Add comment to table
COMMENT ON COLUMN projects.investment_limit IS 'Maximum allowed investment amount for this project';
COMMENT ON COLUMN projects.project_cashier_name IS 'Cashier who manages this project funds';

-- ============================================================================
-- STEP 2: Update project_investments table
-- ============================================================================

-- Add new columns to project_investments table
ALTER TABLE project_investments
ADD COLUMN IF NOT EXISTS shares INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS deducted_from_cashier TEXT NOT NULL DEFAULT '';

-- Add comment to columns
COMMENT ON COLUMN project_investments.shares IS 'Number of shares (1 share = 1000 BDT)';
COMMENT ON COLUMN project_investments.deducted_from_cashier IS 'Cashier fund from which investment was deducted';

-- NOTE: Constraint will be added AFTER data is fixed (see STEP 10)

-- ============================================================================
-- STEP 3: Update expenses table
-- ============================================================================

-- Add cashier tracking to expenses
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS deducted_from_cashier TEXT;

COMMENT ON COLUMN expenses.deducted_from_cashier IS 'Cashier fund from which expense was deducted';

-- ============================================================================
-- STEP 4: Add master data for project categories and statuses
-- ============================================================================

-- Insert project categories
INSERT INTO master_data (category, value, display_order, is_active, created_at, updated_at) 
VALUES
('project_category', 'Real Estate', 1, true, NOW(), NOW()),
('project_category', 'Stock Investment', 2, true, NOW(), NOW()),
('project_category', 'Business Venture', 3, true, NOW(), NOW()),
('project_category', 'Technology', 4, true, NOW(), NOW()),
('project_category', 'Agriculture', 5, true, NOW(), NOW()),
('project_category', 'Manufacturing', 6, true, NOW(), NOW()),
('project_category', 'Trading', 7, true, NOW(), NOW()),
('project_category', 'Services', 8, true, NOW(), NOW()),
('project_category', 'Other', 9, true, NOW(), NOW())
ON CONFLICT (category, value) DO NOTHING;

-- Insert project statuses
INSERT INTO master_data (category, value, display_order, is_active, created_at, updated_at) 
VALUES
('project_status', 'Planning', 1, true, NOW(), NOW()),
('project_status', 'Active', 2, true, NOW(), NOW()),
('project_status', 'On Hold', 3, true, NOW(), NOW()),
('project_status', 'Completed', 4, true, NOW(), NOW()),
('project_status', 'Cancelled', 5, true, NOW(), NOW())
ON CONFLICT (category, value) DO NOTHING;

-- ============================================================================
-- STEP 5: Create function to validate investment limit
-- ============================================================================

CREATE OR REPLACE FUNCTION check_project_investment_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_total DECIMAL(10,2);
    project_limit DECIMAL(10,2);
BEGIN
    -- Get current total investments for the project (excluding current record if updating)
    SELECT COALESCE(SUM(amount), 0) INTO current_total
    FROM project_investments
    WHERE project_id = NEW.project_id
    AND (TG_OP = 'INSERT' OR id != NEW.id);
    
    -- Get project investment limit
    SELECT investment_limit INTO project_limit
    FROM projects
    WHERE id = NEW.project_id;
    
    -- Check if adding this investment would exceed the limit
    IF (current_total + NEW.amount) > project_limit THEN
        RAISE EXCEPTION 'Investment amount exceeds project limit. Current: %, Limit: %, Attempting to add: %', 
            current_total, project_limit, NEW.amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS validate_investment_limit ON project_investments;

CREATE TRIGGER validate_investment_limit
    BEFORE INSERT OR UPDATE ON project_investments
    FOR EACH ROW
    EXECUTE FUNCTION check_project_investment_limit();

-- ============================================================================
-- STEP 6: Calculate investment percentage (removed trigger to avoid recursion)
-- ============================================================================

-- Investment percentage will be calculated dynamically in views and application layer
-- This avoids infinite recursion from UPDATE triggers
-- The percentage is: (member_investment / total_project_investment) * 100

-- ============================================================================
-- STEP 7: Create view for project financial summary
-- ============================================================================

CREATE OR REPLACE VIEW project_financial_summary AS
SELECT 
    p.id AS project_id,
    p.name AS project_name,
    p.investment_limit,
    p.project_cashier_name,
    COALESCE(SUM(pi.amount), 0) AS total_investment,
    COALESCE(SUM(pi.shares), 0) AS total_shares,
    p.investment_limit - COALESCE(SUM(pi.amount), 0) AS remaining_investment_capacity,
    COALESCE(rev.total_revenue, 0) AS total_revenue,
    COALESCE(exp.total_expenses, 0) AS total_expenses,
    COALESCE(rev.total_revenue, 0) - COALESCE(exp.total_expenses, 0) AS net_profit_loss,
    CASE 
        WHEN COALESCE(SUM(pi.amount), 0) > 0 
        THEN ((COALESCE(rev.total_revenue, 0) - COALESCE(exp.total_expenses, 0)) / SUM(pi.amount) * 100)
        ELSE 0 
    END AS roi_percentage
FROM projects p
LEFT JOIN project_investments pi ON p.id = pi.project_id
LEFT JOIN (
    SELECT project_id, SUM(amount) AS total_revenue
    FROM project_revenues
    GROUP BY project_id
) rev ON p.id = rev.project_id
LEFT JOIN (
    SELECT project_id, SUM(amount) AS total_expenses
    FROM expenses
    WHERE project_id IS NOT NULL
    GROUP BY project_id
) exp ON p.id = exp.project_id
GROUP BY p.id, p.name, p.investment_limit, p.project_cashier_name, rev.total_revenue, exp.total_expenses;

-- ============================================================================
-- STEP 8: Create view for member investment summary
-- ============================================================================

CREATE OR REPLACE VIEW member_project_investments AS
SELECT 
    pi.id,
    pi.project_id,
    p.name AS project_name,
    pi.member_id,
    m.name AS member_name,
    pi.amount,
    pi.shares,
    -- Calculate investment percentage dynamically
    CASE 
        WHEN pfs.total_investment > 0 
        THEN (pi.amount / pfs.total_investment * 100)
        ELSE 0 
    END AS investment_percentage,
    pi.deducted_from_cashier,
    pi.investment_date,
    pfs.net_profit_loss,
    pfs.total_shares,
    CASE 
        WHEN pfs.total_shares > 0 
        THEN (pfs.net_profit_loss / pfs.total_shares * pi.shares)
        ELSE 0 
    END AS member_profit_loss_share
FROM project_investments pi
JOIN projects p ON pi.project_id = p.id
JOIN members m ON pi.member_id = m.id
LEFT JOIN project_financial_summary pfs ON pi.project_id = pfs.project_id;

-- ============================================================================
-- STEP 9: Add indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_project_investments_project_id ON project_investments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_investments_member_id ON project_investments(member_id);
CREATE INDEX IF NOT EXISTS idx_project_investments_cashier ON project_investments(deducted_from_cashier);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_cashier ON expenses(deducted_from_cashier);
CREATE INDEX IF NOT EXISTS idx_projects_cashier ON projects(project_cashier_name);

-- ============================================================================
-- STEP 10: Update existing data (BEFORE adding constraint)
-- ============================================================================

-- Set default investment limit for existing projects (10x current investments or 1,000,000)
UPDATE projects
SET investment_limit = GREATEST(
    COALESCE((
        SELECT SUM(amount) * 10
        FROM project_investments
        WHERE project_id = projects.id
    ), 1000000),
    1000000
)
WHERE investment_limit = 0 OR investment_limit IS NULL;

-- Fix existing investments: Round amounts to nearest 1000 and calculate shares
-- This ensures all amounts are exact multiples of 1000
UPDATE project_investments
SET 
    shares = ROUND(amount / 1000)::INTEGER,
    amount = ROUND(amount / 1000) * 1000
WHERE shares = 0 OR shares IS NULL OR amount % 1000 != 0;

-- Set default cashier for existing investments (use first cashier from master_data)
UPDATE project_investments
SET deducted_from_cashier = COALESCE(
    (
        SELECT value 
        FROM master_data 
        WHERE category = 'cashier_name' 
        AND is_active = true 
        ORDER BY display_order 
        LIMIT 1
    ),
    'Default Cashier'
)
WHERE deducted_from_cashier = '' OR deducted_from_cashier IS NULL;

-- ============================================================================
-- STEP 11: Add constraint AFTER data is fixed
-- ============================================================================

-- Drop existing constraint if any
ALTER TABLE project_investments
DROP CONSTRAINT IF EXISTS check_shares_amount;

-- Add check constraint to ensure shares are whole numbers and amount is shares * 1000
-- This allows only exact multiples of 1000 (no fractional shares)
ALTER TABLE project_investments
ADD CONSTRAINT check_shares_amount 
CHECK (shares > 0 AND amount = shares * 1000);

-- ============================================================================
-- STEP 12: Grant permissions (adjust as needed for your RLS policies)
-- ============================================================================

-- Grant access to views
GRANT SELECT ON project_financial_summary TO authenticated;
GRANT SELECT ON member_project_investments TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (Uncomment to run)
-- ============================================================================

-- Check for any remaining invalid data before adding constraint
-- SELECT id, amount, shares, amount % 1000 AS remainder, shares * 1000 AS expected_amount
-- FROM project_investments
-- WHERE amount % 1000 != 0 OR shares * 1000 != amount;

-- Verify projects table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'projects' 
-- ORDER BY ordinal_position;

-- Verify project_investments table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'project_investments' 
-- ORDER BY ordinal_position;

-- Verify master data
-- SELECT * FROM master_data 
-- WHERE category IN ('project_category', 'project_status') 
-- ORDER BY category, display_order;

-- Test financial summary view
-- SELECT * FROM project_financial_summary;

-- Test member investments view
-- SELECT * FROM member_project_investments;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

/*
-- To rollback this migration, run:

DROP VIEW IF EXISTS member_project_investments;
DROP VIEW IF EXISTS project_financial_summary;
DROP TRIGGER IF EXISTS update_investment_percentage ON project_investments;
DROP TRIGGER IF EXISTS validate_investment_limit ON project_investments;
DROP FUNCTION IF EXISTS calculate_investment_percentage();
DROP FUNCTION IF EXISTS check_project_investment_limit();

ALTER TABLE expenses DROP COLUMN IF EXISTS deducted_from_cashier;
ALTER TABLE project_investments DROP CONSTRAINT IF EXISTS check_shares_amount;
ALTER TABLE project_investments DROP COLUMN IF EXISTS deducted_from_cashier;
ALTER TABLE project_investments DROP COLUMN IF EXISTS shares;
ALTER TABLE projects DROP COLUMN IF EXISTS project_cashier_name;
ALTER TABLE projects DROP COLUMN IF EXISTS investment_limit;

DELETE FROM master_data WHERE category IN ('project_category', 'project_status');
*/
