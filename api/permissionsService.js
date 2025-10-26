import { supabase } from '../src/config/supabaseClient';

class PermissionsService {
  async getUserPermissions(userId) {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Convert array to object for easier access
      const permissions = {};
      data.forEach(perm => {
        permissions[perm.screen_name] = {
          read: perm.can_read,
          write: perm.can_write,
          manage: perm.can_manage
        };
      });
      
      return permissions;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return {};
    }
  }

  async saveUserPermissions(userId, permissions) {
    try {
      // Delete existing permissions
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId);

      // Insert new permissions
      const permissionsArray = Object.entries(permissions).map(([screenName, perms]) => ({
        user_id: userId,
        screen_name: screenName,
        can_read: perms.read || false,
        can_write: perms.write || false,
        can_manage: perms.manage || false
      }));

      const { error } = await supabase
        .from('user_permissions')
        .insert(permissionsArray);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error saving permissions:', error);
      throw error;
    }
  }

  async checkPermission(userId, screenName, permissionType = 'read') {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .eq('screen_name', screenName)
        .single();

      if (error || !data) return false;

      switch (permissionType) {
        case 'read':
          return data.can_read;
        case 'write':
          return data.can_write;
        case 'manage':
          return data.can_manage;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
}

const permissionsService = new PermissionsService();
export default permissionsService;
