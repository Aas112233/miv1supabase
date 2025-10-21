// src/api/transactionRequestsService.js
import { supabase } from '../src/config/supabaseClient';
import auditService from './auditService';
import authService from './authService';

class TransactionRequestsService {
  async getCurrentUserId() {
    try {
      const user = await authService.getCurrentUser();
      return user ? user.id : null;
    } catch (error) {
      console.error('Failed to get current user ID:', error);
      return null;
    }
  }

  async getAllRequests() {
    try {
      const { data, error } = await supabase
        .from('transaction_requests')
        .select(`
          *,
          members (name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map the data to include member name
      return data.map(request => ({
        ...request,
        memberName: request.members?.name || 'Unknown'
      }));
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch transaction requests');
    }
  }

  async getRequestById(id) {
    try {
      const { data, error } = await supabase
        .from('transaction_requests')
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
      throw new Error(error.message || 'Failed to fetch transaction request');
    }
  }

  async createRequest(requestData) {
    try {
      const { data, error } = await supabase
        .from('transaction_requests')
        .insert([{
          member_id: requestData.memberId,
          amount: requestData.amount,
          request_date: requestData.requestDate,
          description: requestData.paymentMonth,
          payment_method: requestData.paymentMethod,
          cashier_name: requestData.cashierName,
          status: 'pending'
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Log the creation action
      const userId = await this.getCurrentUserId();
      if (userId && data) {
        await auditService.logRequestCreation(userId, data.id, data);
      }
      
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to create transaction request');
    }
  }

  async updateRequest(id, requestData) {
    try {
      const { data, error } = await supabase
        .from('transaction_requests')
        .update({
          member_id: requestData.memberId,
          amount: requestData.amount,
          request_date: requestData.requestDate,
          description: requestData.paymentMonth,
          payment_method: requestData.paymentMethod,
          cashier_name: requestData.cashierName,
          status: requestData.status
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log the update action
      const userId = await this.getCurrentUserId();
      if (userId && data) {
        await auditService.logRequestUpdate(userId, id, data);
      }
      
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update transaction request');
    }
  }

  async deleteRequest(id) {
    try {
      const { error } = await supabase
        .from('transaction_requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Log the deletion action
      const userId = await this.getCurrentUserId();
      if (userId) {
        await auditService.logRequestDeletion(userId, id);
      }
      
      return { message: 'Transaction request deleted successfully' };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete transaction request');
    }
  }

  async approveRequest(id) {
    try {
      const { data, error } = await supabase
        .from('transaction_requests')
        .update({ status: 'approved' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log the approval action
      const userId = await this.getCurrentUserId();
      if (userId && data) {
        await auditService.logRequestApproval(userId, id, data);
      }
      
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to approve transaction request');
    }
  }

  async rejectRequest(id) {
    try {
      const { data, error } = await supabase
        .from('transaction_requests')
        .update({ status: 'rejected' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log the rejection action
      const userId = await this.getCurrentUserId();
      if (userId && data) {
        await auditService.logRequestRejection(userId, id, data);
      }
      
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to reject transaction request');
    }
  }
}

// Create and export a singleton instance
const transactionRequestsService = new TransactionRequestsService();
export default transactionRequestsService;