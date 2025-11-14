-- Create cashier_fund_savings table
CREATE TABLE IF NOT EXISTS cashier_fund_savings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  cashier_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  quantity DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fund_id, cashier_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cashier_fund_savings_fund ON cashier_fund_savings(fund_id);
CREATE INDEX IF NOT EXISTS idx_cashier_fund_savings_cashier ON cashier_fund_savings(cashier_id);

-- Enable RLS
ALTER TABLE cashier_fund_savings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON cashier_fund_savings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON cashier_fund_savings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON cashier_fund_savings
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON cashier_fund_savings
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_cashier_fund_savings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cashier_fund_savings_updated_at
  BEFORE UPDATE ON cashier_fund_savings
  FOR EACH ROW
  EXECUTE FUNCTION update_cashier_fund_savings_updated_at();

-- Add comment
COMMENT ON TABLE cashier_fund_savings IS 'Tracks fund savings quantities by cashier';
