import { supabase } from '../src/config/supabaseClient';

// Delete fund transaction
export const deleteFundTransaction = async (transactionId) => {
  const { error } = await supabase
    .from('fund_transactions')
    .delete()
    .eq('id', transactionId);
  
  if (error) throw error;
};
