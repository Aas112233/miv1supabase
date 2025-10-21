-- Add missing columns to transaction_requests table
ALTER TABLE transaction_requests ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE transaction_requests ADD COLUMN IF NOT EXISTS cashier_name TEXT;

-- Add comments to describe the new columns
COMMENT ON COLUMN transaction_requests.payment_method IS 'Payment method for the transaction';
COMMENT ON COLUMN transaction_requests.cashier_name IS 'Name of the cashier who processed the transaction';