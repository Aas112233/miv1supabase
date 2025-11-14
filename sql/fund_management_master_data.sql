-- =====================================================
-- FUND MANAGEMENT SYSTEM - MASTER DATA
-- =====================================================

-- Insert Fund Types
INSERT INTO master_data (category, value, display_order, is_active) VALUES
('fund_type', 'Savings Fund', 1, true),
('fund_type', 'Investment Fund', 2, true),
('fund_type', 'Revenue Fund', 3, true),
('fund_type', 'Expense Fund', 4, true),
('fund_type', 'Reserve Fund', 5, true),
('fund_type', 'Dividend Fund', 6, true)
ON CONFLICT (category, value) DO NOTHING;

-- Insert Transaction Types
INSERT INTO master_data (category, value, display_order, is_active) VALUES
('fund_transaction_type', 'Deposit', 1, true),
('fund_transaction_type', 'Withdrawal', 2, true),
('fund_transaction_type', 'Transfer', 3, true),
('fund_transaction_type', 'Allocation', 4, true),
('fund_transaction_type', 'Adjustment', 5, true),
('fund_transaction_type', 'Expense', 6, true),
('fund_transaction_type', 'Investment', 7, true)
ON CONFLICT (category, value) DO NOTHING;

-- Insert Transaction Status
INSERT INTO master_data (category, value, display_order, is_active) VALUES
('fund_transaction_status', 'Pending', 1, true),
('fund_transaction_status', 'Approved', 2, true),
('fund_transaction_status', 'Rejected', 3, true)
ON CONFLICT (category, value) DO NOTHING;

-- Insert Source Types
INSERT INTO master_data (category, value, display_order, is_active) VALUES
('fund_source_type', 'Payment', 1, true),
('fund_source_type', 'Investment', 2, true),
('fund_source_type', 'Revenue', 3, true),
('fund_source_type', 'Expense', 4, true),
('fund_source_type', 'Manual', 5, true)
ON CONFLICT (category, value) DO NOTHING;

-- Verification query
-- SELECT category, value, display_order, is_active FROM master_data WHERE category LIKE 'fund%' ORDER BY category, display_order;
