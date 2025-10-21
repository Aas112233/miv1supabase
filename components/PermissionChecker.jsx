import React from 'react';

// Helper function to check if user has permission
export const hasPermission = (currentUser, screenName, permissionType = 'read') => {
  // If no user is logged in, no permission
  if (!currentUser) {
    return false;
  }

  // Admin users have access to all screens
  if (currentUser.role === 'admin') {
    return true;
  }

  // Check if user has permissions for this screen
  const userPermissions = currentUser.permissions || {};
  const screenPermissions = userPermissions[screenName] || {};
  
  // Check if user has the required permission level
  return screenPermissions[permissionType] || false;
};

// Helper function to check if user has write permission
export const hasWritePermission = (currentUser, screenName) => {
  return hasPermission(currentUser, screenName, 'write');
};

// Helper function to check if user has manage permission
export const hasManagePermission = (currentUser, screenName) => {
  return hasPermission(currentUser, screenName, 'manage');
};

// Permission-aware button component
export const PermissionButton = ({ 
  children, 
  currentUser, 
  screenName, 
  permissionType = 'write', 
  fallback = null,
  ...props 
}) => {
  const hasPerm = hasPermission(currentUser, screenName, permissionType);
  
  if (!hasPerm) {
    return fallback;
  }
  
  return (
    <button {...props}>
      {children}
    </button>
  );
};

export default {
  hasPermission,
  hasWritePermission,
  hasManagePermission,
  PermissionButton
};