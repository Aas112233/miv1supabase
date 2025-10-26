import { supabase } from '../src/config/supabaseClient';
import auditService from './auditService';
import authService from './authService';

class ExpensesService {
  async getCurrentUserId() {
    try {
      const user = await authService.getCurrentUser();
      return user ? user.id : null;
    } catch (error) {
      console.error('Failed to get current user ID:', error);
      return null;
    }
  }

  async getAllExpenses() {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch expenses');
    }
  }

  async getExpenseById(id) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch expense');
    }
  }

  async createExpense(expenseData) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          reason: expenseData.reason,
          amount: expenseData.amount,
          category: expenseData.category,
          expense_by: expenseData.expenseBy,
          deduct_from: expenseData.deductFrom,
          expense_date: expenseData.expenseDate
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      const userId = await this.getCurrentUserId();
      if (userId && data) {
        await auditService.logAction(userId, 'CREATE', 'expenses', data.id, data);
      }
      
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to create expense');
    }
  }

  async updateExpense(id, expenseData) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          reason: expenseData.reason,
          amount: expenseData.amount,
          category: expenseData.category,
          expense_by: expenseData.expenseBy,
          deduct_from: expenseData.deductFrom,
          expense_date: expenseData.expenseDate
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const userId = await this.getCurrentUserId();
      if (userId && data) {
        await auditService.logAction(userId, 'UPDATE', 'expenses', id, data);
      }
      
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update expense');
    }
  }

  async deleteExpense(id) {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      const userId = await this.getCurrentUserId();
      if (userId) {
        await auditService.logAction(userId, 'DELETE', 'expenses', id, null);
      }
      
      return { message: 'Expense deleted successfully' };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete expense');
    }
  }
}

const expensesService = new ExpensesService();
export default expensesService;
