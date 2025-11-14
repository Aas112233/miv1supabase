-- Trigger to recalculate fund balances when transactions are deleted

CREATE OR REPLACE FUNCTION handle_fund_transaction_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Only recalculate if the deleted transaction was approved
    IF OLD.status = 'approved' THEN
        -- Update source fund balance
        UPDATE funds
        SET current_balance = calculate_fund_balance(OLD.fund_id),
            updated_at = NOW()
        WHERE id = OLD.fund_id;
        
        -- If it was a transfer, update destination fund too
        IF OLD.transaction_type = 'transfer' AND OLD.to_fund_id IS NOT NULL THEN
            UPDATE funds
            SET current_balance = calculate_fund_balance(OLD.to_fund_id),
                updated_at = NOW()
            WHERE id = OLD.to_fund_id;
        END IF;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_handle_fund_transaction_delete ON fund_transactions;
CREATE TRIGGER trigger_handle_fund_transaction_delete
    AFTER DELETE ON fund_transactions
    FOR EACH ROW
    EXECUTE FUNCTION handle_fund_transaction_delete();
