// src/api/paymentsService.js
import { supabase } from '../src/config/supabaseClient';
import auditService from './auditService';
import authService from './authService';

class PaymentsService {
  async getCurrentUserId() {
    try {
      const user = await authService.getCurrentUser();
      return user ? user.id : null;
    } catch (error) {
      console.error('Failed to get current user ID:', error);
      return null;
    }
  }

  async getAllPayments() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          members (name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map the data to include member name
      return data.map(payment => ({
        ...payment,
        memberName: payment.members?.name || 'Unknown'
      }));
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch payments');
    }
  }

  async getPaymentById(id) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          members (name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Map the data to include member name
      return {
        ...data,
        memberName: data.members?.name || 'Unknown'
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch payment');
    }
  }

  async createPayment(paymentData) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          member_id: paymentData.memberId,
          amount: paymentData.amount,
          payment_date: paymentData.paymentDate,
          payment_method: paymentData.paymentMethod,
          description: paymentData.paymentMonth,
          cashier_name: paymentData.cashierName
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Log the creation action
      const userId = await this.getCurrentUserId();
      if (userId && data) {
        await auditService.logPaymentCreation(userId, data.id, data);
      }
      
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to create payment');
    }
  }

  async updatePayment(id, paymentData) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          member_id: paymentData.memberId,
          amount: paymentData.amount,
          payment_date: paymentData.paymentDate,
          payment_method: paymentData.paymentMethod,
          description: paymentData.paymentMonth,
          cashier_name: paymentData.cashierName
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log the update action
      const userId = await this.getCurrentUserId();
      if (userId && data) {
        await auditService.logPaymentUpdate(userId, id, data);
      }
      
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update payment');
    }
  }

  async deletePayment(id) {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Log the deletion action
      const userId = await this.getCurrentUserId();
      if (userId) {
        await auditService.logPaymentDeletion(userId, id);
      }
      
      return { message: 'Payment deleted successfully' };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete payment');
    }
  }
}

// Create and export a singleton instance
const paymentsService = new PaymentsService();
export default paymentsService;