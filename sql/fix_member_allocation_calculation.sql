-- Fix member allocation calculation to use share_amount × 1000
-- Each share is worth ৳1,000

CREATE OR REPLACE FUNCTION calculate_member_allocation(p_fund_id UUID, p_member_id BIGINT)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    v_member_share DECIMAL(15,2);
    v_allocation DECIMAL(15,2);
BEGIN
    -- Get member's share amount
    SELECT share_amount INTO v_member_share
    FROM members
    WHERE id = p_member_id;
    
    -- Calculate allocation: share_amount × 1000
    v_allocation := v_member_share * 1000;
    
    RETURN v_allocation;
END;
$$ LANGUAGE plpgsql;

-- Recalculate all member allocations
DO $$
DECLARE
    v_member RECORD;
    v_fund RECORD;
BEGIN
    FOR v_fund IN SELECT id FROM funds WHERE is_active = true LOOP
        FOR v_member IN SELECT id FROM members WHERE is_active = true LOOP
            INSERT INTO member_fund_allocations (fund_id, member_id, allocated_amount, allocation_percentage)
            VALUES (
                v_fund.id,
                v_member.id,
                calculate_member_allocation(v_fund.id, v_member.id),
                (SELECT share_amount FROM members WHERE id = v_member.id) * 100.0 / 
                    NULLIF((SELECT SUM(share_amount) FROM members WHERE is_active = true), 0)
            )
            ON CONFLICT (fund_id, member_id) 
            DO UPDATE SET
                allocated_amount = calculate_member_allocation(v_fund.id, v_member.id),
                allocation_percentage = (SELECT share_amount FROM members WHERE id = v_member.id) * 100.0 / 
                    NULLIF((SELECT SUM(share_amount) FROM members WHERE is_active = true), 0),
                last_calculated = NOW();
        END LOOP;
    END LOOP;
END $$;
