import { supabase } from '../src/config/supabaseClient';

class SessionService {
  async createSession(userId, ipAddress, userAgent) {
    try {
      const { data, error } = await supabase.rpc('create_user_session', {
        p_user_id: userId,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getUserSessions(userId) {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
  }

  async getAllActiveSessions() {
    try {
      const { data, error } = await supabase
        .from('v_active_sessions')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      return [];
    }
  }

  async terminateSession(sessionId, terminatedBy, blockDevice = false) {
    try {
      if (blockDevice) {
        const { data, error } = await supabase.rpc('terminate_and_block_device', {
          p_session_id: sessionId,
          p_terminated_by: terminatedBy,
          p_reason: 'Device access terminated by administrator'
        });
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.rpc('terminate_user_session', {
          p_session_id: sessionId,
          p_terminated_by: terminatedBy
        });
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error terminating session:', error);
      throw error;
    }
  }

  async blockUserAccess(userId, blockedBy, reason) {
    try {
      const { data, error } = await supabase.rpc('block_user_access', {
        p_user_id: userId,
        p_blocked_by: blockedBy,
        p_reason: reason
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  async unblockUserAccess(userId) {
    try {
      const { data, error } = await supabase.rpc('unblock_user_access', {
        p_user_id: userId
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  async checkDeviceBlocked(userId, ipAddress, userAgent) {
    try {
      // Direct query to check if device is blocked
      const { data, error } = await supabase
        .from('user_sessions')
        .select('device_blocked, block_reason')
        .eq('user_id', userId)
        .eq('ip_address', ipAddress)
        .eq('user_agent', userAgent)
        .eq('device_blocked', true)
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking device block:', error);
        return { blocked: false, reason: null };
      }
      
      if (data && data.device_blocked) {
        return { blocked: true, reason: data.block_reason };
      }
      
      return { blocked: false, reason: null };
    } catch (error) {
      console.error('Error checking device block:', error);
      return { blocked: false, reason: null };
    }
  }

  async unblockDevice(userId, ipAddress, userAgent) {
    try {
      const { data, error } = await supabase.rpc('unblock_device', {
        p_user_id: userId,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error unblocking device:', error);
      throw error;
    }
  }

  async updateSessionActivity(sessionId) {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', sessionId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  async checkSessionStatus(sessionId) {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('is_active')
        .eq('id', sessionId)
        .single();
      
      if (error) throw error;
      return data?.is_active || false;
    } catch (error) {
      console.error('Error checking session status:', error);
      return false;
    }
  }

  async getAllSessions(userId) {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all sessions:', error);
      return [];
    }
  }

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get IP:', error);
      return 'Unknown';
    }
  }

  getClientInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`
    };
  }

  startSessionMonitoring(onTerminated) {
    const sessionId = localStorage.getItem('current_session_id');
    if (!sessionId) return null;

    const intervalId = setInterval(async () => {
      const isActive = await this.checkSessionStatus(sessionId);
      if (!isActive) {
        clearInterval(intervalId);
        if (onTerminated) onTerminated();
      }
    }, 10000); // Check every 10 seconds

    return intervalId;
  }

  stopSessionMonitoring(intervalId) {
    if (intervalId) clearInterval(intervalId);
  }
}

const sessionService = new SessionService();
export default sessionService;
