-- =====================================================
-- FUND MANAGEMENT SYSTEM - DATABASE SCHEMA
-- =====================================================

-- 1. FUNDS TABLE
CREATE TABLE IF NOT EXISTS funds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    fund_type VARCHAR(50) NOT NULL,
    description TEXT,
    current_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. FUND TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS fund_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    source_type VARCHAR(50),
    source_id TEXT,
    to_fund_id UUID REFERENCES funds(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FUND BALANCES TABLE (Historical tracking)
CREATE TABLE IF NOT EXISTS fund_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    balance DECIMAL(15,2) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fund_id, calculated_at)
);

-- 4. MEMBER FUND ALLOCATIONS TABLE
CREATE TABLE IF NOT EXISTS member_fund_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    allocated_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    allocation_percentage DECIMAL(5,2),
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fund_id, member_id)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_fund_transactions_fund_id ON fund_transactions(fund_id);
CREATE INDEX idx_fund_transactions_status ON fund_transactions(status);
CREATE INDEX idx_fund_transactions_date ON fund_transactions(transaction_date);
CREATE INDEX idx_fund_transactions_source ON fund_transactions(source_type, source_id);
CREATE INDEX idx_fund_balances_fund_id ON fund_balances(fund_id);
CREATE INDEX idx_member_allocations_fund_id ON member_fund_allocations(fund_id);
CREATE INDEX idx_member_allocations_member_id ON member_fund_allocations(member_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate fund balance
CREATE OR REPLACE FUNCTION calculate_fund_balance(p_fund_id UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    v_balance DECIMAL(15,2);
BEGIN
    SELECT COALESCE(
        SUM(CASE 
            WHEN transaction_type IN ('deposit', 'allocation') THEN amount
            WHEN transaction_type IN ('withdrawal', 'expense', 'investment') THEN -amount
            WHEN transaction_type = 'transfer' AND fund_id = p_fund_id THEN -amount
            WHEN transaction_type = 'transfer' AND to_fund_id = p_fund_id THEN amount
            ELSE 0
        END), 0
    ) INTO v_balance
    FROM fund_transactions
    WHERE (fund_id = p_fund_id OR to_fund_id = p_fund_id)
    AND status = 'approved';
    
    RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate member allocation
CREATE OR REPLACE FUNCTION calculate_member_allocation(p_fund_id UUID, p_member_id BIGINT)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    v_member_share DECIMAL(15,2);
    v_total_shares DECIMAL(15,2);
    v_fund_balance DECIMAL(15,2);
    v_allocation DECIMAL(15,2);
BEGIN
    -- Get member's share amount
    SELECT share_amount INTO v_member_share
    FROM members
    WHERE id = p_member_id;
    
    -- Get total shares
    SELECT SUM(share_amount) INTO v_total_shares
    FROM members
    WHERE is_active = true;
    
    -- Get fund balance
    v_fund_balance := calculate_fund_balance(p_fund_id);
    
    -- Calculate allocation
    IF v_total_shares > 0 THEN
        v_allocation := (v_member_share / v_total_shares) * v_fund_balance;
    ELSE
        v_allocation := 0;
    END IF;
    
    RETURN v_allocation;
END;
$$ LANGUAGE plpgsql;

-- Function to update fund balance
CREATE OR REPLACE FUNCTION update_fund_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status != 'approved') OR
       (TG_OP = 'INSERT' AND NEW.status = 'approved') THEN
        
        -- Update fund balance
        UPDATE funds
        SET current_balance = calculate_fund_balance(NEW.fund_id),
            updated_at = NOW()
        WHERE id = NEW.fund_id;
        
        -- If transfer, update destination fund too
        IF NEW.transaction_type = 'transfer' AND NEW.to_fund_id IS NOT NULL THEN
            UPDATE funds
            SET current_balance = calculate_fund_balance(NEW.to_fund_id),
                updated_at = NOW()
            WHERE id = NEW.to_fund_id;
        END IF;
        
        -- Record balance snapshot (skip if duplicate)
        INSERT INTO fund_balances (fund_id, balance)
        VALUES (NEW.fund_id, calculate_fund_balance(NEW.fund_id))
        ON CONFLICT (fund_id, calculated_at) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update member allocations
CREATE OR REPLACE FUNCTION update_member_allocations()
RETURNS TRIGGER AS $$
DECLARE
    v_member RECORD;
BEGIN
    IF (TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status != 'approved') OR
       (TG_OP = 'INSERT' AND NEW.status = 'approved') THEN
        
        -- Update allocations for all active members
        FOR v_member IN SELECT id FROM members WHERE is_active = true LOOP
            INSERT INTO member_fund_allocations (fund_id, member_id, allocated_amount, allocation_percentage)
            VALUES (
                NEW.fund_id,
                v_member.id,
                calculate_member_allocation(NEW.fund_id, v_member.id),
                (SELECT share_amount FROM members WHERE id = v_member.id) * 100.0 / 
                    NULLIF((SELECT SUM(share_amount) FROM members WHERE is_active = true), 0)
            )
            ON CONFLICT (fund_id, member_id) 
            DO UPDATE SET
                allocated_amount = calculate_member_allocation(NEW.fund_id, v_member.id),
                allocation_percentage = (SELECT share_amount FROM members WHERE id = v_member.id) * 100.0 / 
                    NULLIF((SELECT SUM(share_amount) FROM members WHERE is_active = true), 0),
                last_calculated = NOW();
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER trigger_update_fund_balance
    AFTER INSERT OR UPDATE ON fund_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_fund_balance();

CREATE TRIGGER trigger_update_member_allocations
    AFTER INSERT OR UPDATE ON fund_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_member_allocations();

CREATE TRIGGER update_funds_updated_at
    BEFORE UPDATE ON funds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fund_transactions_updated_at
    BEFORE UPDATE ON fund_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_fund_allocations ENABLE ROW LEVEL SECURITY;

-- Policies for funds
CREATE POLICY "Users can view funds" ON funds FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage funds" ON funds FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for fund_transactions
CREATE POLICY "Users can view transactions" ON fund_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create transactions" ON fund_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage transactions" ON fund_transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for fund_balances
CREATE POLICY "Users can view balances" ON fund_balances FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies for member_fund_allocations
CREATE POLICY "Users can view allocations" ON member_fund_allocations FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default funds
INSERT INTO funds (name, fund_type, description) VALUES
('Main Savings Fund', 'savings', 'Primary savings account for member contributions'),
('Investment Fund', 'investment', 'Fund for making investments in projects and opportunities'),
('Project Revenue Fund', 'revenue', 'Revenue collected from completed projects'),
('Operating Expense Fund', 'expense', 'Fund for club operational expenses'),
('Reserve Fund', 'reserve', 'Emergency reserve fund'),
('Dividend Distribution Fund', 'dividend', 'Fund for distributing dividends to members')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- DATA MIGRATION
-- =====================================================

-- Link existing payments to Main Savings Fund
INSERT INTO fund_transactions (fund_id, transaction_type, amount, description, transaction_date, status, source_type, source_id, approved_at)
SELECT 
    (SELECT id FROM funds WHERE name = 'Main Savings Fund'),
    'deposit',
    amount,
    'Member payment: ' || COALESCE(description, 'Payment'),
    payment_date,
    'approved',
    'payment',
    id::TEXT,
    created_at
FROM payments
WHERE amount > 0;

-- Link existing investments to Investment Fund
INSERT INTO fund_transactions (fund_id, transaction_type, amount, description, transaction_date, status, source_type, source_id, approved_at)
SELECT 
    (SELECT id FROM funds WHERE name = 'Investment Fund'),
    'investment',
    amount,
    'Project investment: ' || (SELECT name FROM projects WHERE id = project_id),
    investment_date,
    'approved',
    'investment',
    id::TEXT,
    created_at
FROM project_investments;

-- Link existing project revenues to Project Revenue Fund
INSERT INTO fund_transactions (fund_id, transaction_type, amount, description, transaction_date, status, source_type, source_id, approved_at)
SELECT 
    (SELECT id FROM funds WHERE name = 'Project Revenue Fund'),
    'deposit',
    amount,
    'Project revenue: ' || COALESCE(description, 'Revenue'),
    revenue_date,
    'approved',
    'revenue',
    id::TEXT,
    created_at
FROM project_revenues;

-- Link existing expenses to Operating Expense Fund
INSERT INTO fund_transactions (fund_id, transaction_type, amount, description, transaction_date, status, source_type, source_id, approved_at)
SELECT 
    (SELECT id FROM funds WHERE name = 'Operating Expense Fund'),
    'expense',
    e.amount,
    e.category || ': Expense',
    e.expense_date,
    'approved',
    'expense',
    e.id::TEXT,
    e.created_at
FROM expenses e;

-- Update all fund balances
UPDATE funds SET current_balance = calculate_fund_balance(id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify funds created
-- SELECT * FROM funds ORDER BY name;

-- Verify transactions migrated
-- SELECT fund_id, transaction_type, COUNT(*), SUM(amount) FROM fund_transactions GROUP BY fund_id, transaction_type;

-- Verify balances
-- SELECT f.name, f.current_balance, calculate_fund_balance(f.id) as calculated FROM funds f;
