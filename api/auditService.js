import { supabase } from '../src/config/supabaseClient';

class AuditService {
  async logAction(userId, action, tableName, recordId = null, oldValues = null, newValues = null) {
    try {
      // Get client IP and user agent
      const ipAddress = this.getClientIP();
      const userAgent = navigator?.userAgent || 'Unknown';

      const logEntry = {
        user_id: userId,
        action: action,
        table_name: tableName,
        record_id: recordId ? recordId.toString() : null,
        old_values: oldValues ? JSON.stringify(oldValues) : null,
        new_values: newValues ? JSON.stringify(newValues) : null,
        ip_address: ipAddress,
        user_agent: userAgent
      };

      const { data, error } = await supabase
        .from('audit_logs')
        .insert([logEntry]);

      if (error) {
        console.error('Failed to log audit action:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in audit logging:', error);
      return null;
    }
  }

  getClientIP() {
    // In a real application, you would get this from server-side headers
    // For client-side, we'll return a placeholder
    return 'CLIENT_IP';
  }

  // Log member creation
  async logMemberCreation(userId, memberId, memberData) {
    return this.logAction(
      userId,
      'CREATE',
      'members',
      memberId,
      null,
      memberData
    );
  }

  // Log member update
  async logMemberUpdate(userId, memberId, oldData, newData) {
    return this.logAction(
      userId,
      'UPDATE',
      'members',
      memberId,
      oldData,
      newData
    );
  }

  // Log member deletion
  async logMemberDeletion(userId, memberId, memberData) {
    return this.logAction(
      userId,
      'DELETE',
      'members',
      memberId,
      memberData,
      null
    );
  }

  // Log payment creation
  async logPaymentCreation(userId, paymentId, paymentData) {
    return this.logAction(
      userId,
      'CREATE',
      'payments',
      paymentId,
      null,
      paymentData
    );
  }

  // Log payment update
  async logPaymentUpdate(userId, paymentId, oldData, newData) {
    return this.logAction(
      userId,
      'UPDATE',
      'payments',
      paymentId,
      oldData,
      newData
    );
  }

  // Log payment deletion
  async logPaymentDeletion(userId, paymentId, paymentData) {
    return this.logAction(
      userId,
      'DELETE',
      'payments',
      paymentId,
      paymentData,
      null
    );
  }

  // Log transaction request creation
  async logRequestCreation(userId, requestId, requestData) {
    return this.logAction(
      userId,
      'CREATE',
      'transaction_requests',
      requestId,
      null,
      requestData
    );
  }

  // Log transaction request update
  async logRequestUpdate(userId, requestId, oldData, newData) {
    return this.logAction(
      userId,
      'UPDATE',
      'transaction_requests',
      requestId,
      oldData,
      newData
    );
  }

  // Log transaction request approval
  async logRequestApproval(userId, requestId, requestData) {
    return this.logAction(
      userId,
      'APPROVE',
      'transaction_requests',
      requestId,
      null,
      requestData
    );
  }

  // Log transaction request rejection
  async logRequestRejection(userId, requestId, requestData) {
    return this.logAction(
      userId,
      'REJECT',
      'transaction_requests',
      requestId,
      null,
      requestData
    );
  }

  // Log transaction request deletion
  async logRequestDeletion(userId, requestId, requestData) {
    return this.logAction(
      userId,
      'DELETE',
      'transaction_requests',
      requestId,
      requestData,
      null
    );
  }

  // Log user login
  async logUserLogin(userId) {
    return this.logAction(
      userId,
      'LOGIN',
      'users',
      userId,
      null,
      null
    );
  }

  // Log user logout
  async logUserLogout(userId) {
    return this.logAction(
      userId,
      'LOGOUT',
      'users',
      userId,
      null,
      null
    );
  }

  // Get audit logs for a specific user
  async getUserAuditLogs(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch user audit logs:', error);
      throw error;
    }
  }

  // Get all audit logs (for admins)
  async getAllAuditLogs(limit = 100) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }
  }
}

const auditService = new AuditService();
export default auditService;