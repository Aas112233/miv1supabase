-- Add cashier_name column to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cashier_name TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN payments.cashier_name IS 'Name of the cashier who processed the payment';