import { supabase } from '../src/config/supabaseClient';

// Get all funds
export const getFunds = async () => {
  const { data, error } = await supabase
    .from('funds')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
};

// Get fund by ID
export const getFundById = async (id) => {
  const { data, error } = await supabase
    .from('funds')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Get fund transactions
export const getFundTransactions = async (fundId = null, status = null) => {
  let query = supabase
    .from('fund_transactions')
    .select(`
      *,
      fund:funds!fund_id(name),
      to_fund:funds!to_fund_id(name)
    `)
    .order('transaction_date', { ascending: false });
  
  if (fundId) query = query.eq('fund_id', fundId);
  if (status) query = query.eq('status', status);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Create fund transaction
export const createFundTransaction = async (transaction) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('fund_transactions')
    .insert([{ ...transaction, created_by: user.id }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Approve transaction
export const approveTransaction = async (transactionId) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('fund_transactions')
    .update({
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString()
    })
    .eq('id', transactionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Reject transaction
export const rejectTransaction = async (transactionId, reason) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('fund_transactions')
    .update({
      status: 'rejected',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      rejection_reason: reason
    })
    .eq('id', transactionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Get member fund allocations
export const getMemberAllocations = async (fundId = null) => {
  let query = supabase
    .from('member_fund_allocations')
    .select(`
      *,
      fund:funds(name),
      member:members(name, share_amount)
    `)
    .order('allocated_amount', { ascending: false });
  
  if (fundId) query = query.eq('fund_id', fundId);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get fund balance history
export const getFundBalanceHistory = async (fundId, limit = 30) => {
  const { data, error } = await supabase
    .from('fund_balances')
    .select('*')
    .eq('fund_id', fundId)
    .order('calculated_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
};

// Get fund summary
export const getFundSummary = async () => {
  const { data: funds, error: fundsError } = await supabase
    .from('funds')
    .select('*');
  
  if (fundsError) throw fundsError;
  
  const { data: pending, error: pendingError } = await supabase
    .from('fund_transactions')
    .select('id')
    .eq('status', 'pending');
  
  if (pendingError) throw pendingError;
  
  const totalBalance = funds.reduce((sum, f) => sum + parseFloat(f.current_balance || 0), 0);
  
  return {
    funds,
    totalBalance,
    pendingTransactions: pending.length
  };
};

// Delete fund with validation
export const deleteFund = async (fundId) => {
  // Check for transactions
  const { data: txns, error: txnError } = await supabase
    .from('fund_transactions')
    .select('id')
    .or(`fund_id.eq.${fundId},to_fund_id.eq.${fundId}`);
  
  if (txnError) throw txnError;
  if (txns.length > 0) {
    throw new Error(`Cannot delete fund. It has ${txns.length} transaction(s). Please delete all transactions first.`);
  }
  
  // Check for allocations
  const { data: allocs, error: allocError } = await supabase
    .from('member_fund_allocations')
    .select('id')
    .eq('fund_id', fundId);
  
  if (allocError) throw allocError;
  if (allocs.length > 0) {
    throw new Error(`Cannot delete fund. It has ${allocs.length} member allocation(s). Please delete all allocations first.`);
  }
  
  // Delete fund
  const { error } = await supabase
    .from('funds')
    .delete()
    .eq('id', fundId);
  
  if (error) throw error;
};

// Create transfer between funds
export const createTransfer = async (fromFundId, toFundId, amount, description) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('fund_transactions')
    .insert([{
      fund_id: fromFundId,
      to_fund_id: toFundId,
      transaction_type: 'transfer',
      amount: parseFloat(amount),
      description: description || 'Fund transfer',
      transaction_date: new Date().toISOString().split('T')[0],
      created_by: user.id,
      status: 'pending'
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
