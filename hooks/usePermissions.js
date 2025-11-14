import { useMemo } from 'react';

/**
 * Custom hook to check user permissions
 * @param {Object} currentUser - The current user object with permissions
 * @param {string} screen - The screen/module name (e.g., 'members', 'payments')
 * @returns {Object} Permission checks for the screen
 */
export const usePermissions = (currentUser, screen) => {
  return useMemo(() => {
    if (!currentUser) {
      return { canRead: false, canWrite: false, canManage: false };
    }

    // Admin has all permissions
    if (currentUser.role === 'admin') {
      return { canRead: true, canWrite: true, canManage: true };
    }

    const permissions = currentUser.permissions?.[screen] || {};
    
    return {
      canRead: permissions.read || false,
      canWrite: permissions.write || false,
      canManage: permissions.manage || false
    };
  }, [currentUser, screen]);
};

export default usePermissions;
