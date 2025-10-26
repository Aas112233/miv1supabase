import { supabase } from '../src/config/supabaseClient';
import auditService from './auditService';

const masterDataService = {
  async getMasterDataByCategory(category) {
    const { data, error } = await supabase
      .from('master_data')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getAllMasterData() {
    const { data, error } = await supabase
      .from('master_data')
      .select('*')
      .order('category', { ascending: true })
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async createMasterData(masterData) {
    const { data, error } = await supabase
      .from('master_data')
      .insert([masterData])
      .select()
      .single();
    
    if (error) throw error;
    
    await auditService.logAction('master_data', 'create', data.id, { category: masterData.category, value: masterData.value });
    return data;
  },

  async updateMasterData(id, updates) {
    const { data, error } = await supabase
      .from('master_data')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    await auditService.logAction('master_data', 'update', id, updates);
    return data;
  },

  async deleteMasterData(id) {
    const { error } = await supabase
      .from('master_data')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    await auditService.logAction('master_data', 'delete', id);
  }
};

export default masterDataService;
