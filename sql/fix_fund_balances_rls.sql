-- Fix RLS policy for fund_balances to allow inserts from triggers

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view balances" ON fund_balances;

-- Recreate with proper permissions
CREATE POLICY "Users can view balances" 
ON fund_balances 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Add policy to allow inserts (needed for triggers)
CREATE POLICY "System can insert balances" 
ON fund_balances 
FOR INSERT 
WITH CHECK (true);

-- Verify policies
-- SELECT * FROM pg_policies WHERE tablename = 'fund_balances';
