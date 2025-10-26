-- Add initial_investment, monthly_revenue and total_revenue to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS initial_investment DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS monthly_revenue DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(15, 2) DEFAULT 0;
