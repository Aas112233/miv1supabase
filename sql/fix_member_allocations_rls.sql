-- Fix RLS policy for member_fund_allocations to allow trigger inserts

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view allocations" ON member_fund_allocations;

-- Create new policies
CREATE POLICY "Users can view allocations" 
ON member_fund_allocations FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert allocations" 
ON member_fund_allocations FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update allocations" 
ON member_fund_allocations FOR UPDATE 
USING (true);

CREATE POLICY "Admins can manage allocations" 
ON member_fund_allocations FOR ALL 
USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
