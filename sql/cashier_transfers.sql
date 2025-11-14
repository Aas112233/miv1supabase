-- Drop existing table if it exists
DROP TABLE IF EXISTS cashier_transfers;

-- Create cashier_transfers table to track money movement between cashiers and funds
CREATE TABLE cashier_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_cashier_name TEXT NOT NULL,
  to_cashier_name TEXT,
  to_fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (
    (to_cashier_name IS NOT NULL AND to_fund_id IS NULL) OR 
    (to_cashier_name IS NULL AND to_fund_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cashier_transfers_from ON cashier_transfers(from_cashier_name);
CREATE INDEX IF NOT EXISTS idx_cashier_transfers_to_cashier ON cashier_transfers(to_cashier_name);
CREATE INDEX IF NOT EXISTS idx_cashier_transfers_to_fund ON cashier_transfers(to_fund_id);
CREATE INDEX IF NOT EXISTS idx_cashier_transfers_date ON cashier_transfers(transfer_date);

-- Enable RLS
ALTER TABLE cashier_transfers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON cashier_transfers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON cashier_transfers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON cashier_transfers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON cashier_transfers
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add comment
COMMENT ON TABLE cashier_transfers IS 'Tracks transfers from cashiers to other cashiers or funds';
