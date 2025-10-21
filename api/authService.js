// src/api/authService.js
import { supabase } from '../src/config/supabaseClient';

class AuthService {
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return {
        user: data.user,
        session: data.session
      };
    } catch (error) {
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  }

  async signup(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) throw error;
      
      return {
        user: data.user,
        session: data.session
      };
    } catch (error) {
      throw new Error(error.message || 'Signup failed. Please try again.');
    }
  }

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new Error(error.message || 'Logout failed');
    }
  }

  // Store user session
  storeSession(session) {
    try {
      localStorage.setItem('sb-session', JSON.stringify(session));
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  // Get stored session
  getSession() {
    try {
      const session = localStorage.getItem('sb-session');
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Failed to retrieve session:', error);
      return null;
    }
  }

  // Remove stored session
  removeSession() {
    try {
      localStorage.removeItem('sb-session');
    } catch (error) {
      console.error('Failed to remove session:', error);
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }
}

const authService = new AuthService();
export default authService;