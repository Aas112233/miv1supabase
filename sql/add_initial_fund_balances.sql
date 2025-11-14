-- Add initial balances to funds by creating deposit transactions

-- Add initial balance to Operating Expense Fund (adjust amount as needed)
INSERT INTO fund_transactions (fund_id, transaction_type, amount, description, transaction_date, status, approved_at)
SELECT 
    id,
    'deposit',
    50000.00, -- Change this amount as needed
    'Initial fund balance',
    CURRENT_DATE,
    'approved',
    NOW()
FROM funds
WHERE name = 'Operating Expense Fund'
AND NOT EXISTS (
    SELECT 1 FROM fund_transactions 
    WHERE fund_id = funds.id 
    AND description = 'Initial fund balance'
);

-- Update fund balance
UPDATE funds 
SET current_balance = calculate_fund_balance(id)
WHERE name = 'Operating Expense Fund';

-- Verify
SELECT name, current_balance FROM funds WHERE name = 'Operating Expense Fund';
