import { supabase } from '../src/config/supabaseClient';

class UserService {
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async createUserProfile(userData) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([userData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId, userData) {
    try {
      // For updating user profiles, we need to be careful about RLS policies
      const { data, error } = await supabase
        .from('user_profiles')
        .update(userData)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async getUserRole(userId) {
    try {
      const profile = await this.getUserProfile(userId);
      return profile ? profile.role : 'member';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'member';
    }
  }

  async isAdmin(userId) {
    try {
      const role = await this.getUserRole(userId);
      return role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  async ensureUserProfileExists(user) {
    try {
      // Check if profile already exists
      const existingProfile = await this.getUserProfile(user.id);
      
      if (!existingProfile) {
        // Create new profile
        const profileData = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          role: (user.email === 'mhassantoha@gmail.com' || user.email === 'admin@munshiinvestment.com') ? 'admin' : 'member'
        };
        
        await this.createUserProfile(profileData);
        return profileData;
      }
      
      return existingProfile;
    } catch (error) {
      console.error('Error ensuring user profile exists:', error);
      return null;
    }
  }

  // Get user role directly from auth.users table
  async getUserRoleFromAuth(userId) {
    try {
      // For now, we'll use our hardcoded list of admins
      // In a real implementation, you would query the auth.users table
      // or use the user_profiles table we created
      return 'member';
    } catch (error) {
      console.error('Error getting user role from auth:', error);
      return 'member';
    }
  }
}

const userService = new UserService();
export default userService;