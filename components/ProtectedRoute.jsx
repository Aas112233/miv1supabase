import React from 'react';
import { Navigate } from 'react-router-dom';
import NotAuthorized from '../pages/NotAuthorized';

const ProtectedRoute = ({ 
  children, 
  currentUser, 
  requiredPermission = 'read',
  screenName 
}) => {
  // If no user is logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Admin users have access to all screens
  if (currentUser.role === 'admin') {
    return children;
  }

  // Check if user has permissions for this screen
  const userPermissions = currentUser.permissions || {};
  const screenPermissions = userPermissions[screenName] || {};
  
  // Check if user has the required permission level
  if (screenPermissions[requiredPermission]) {
    return children;
  }

  // If user doesn't have permission, show not authorized screen
  return <NotAuthorized />;
};

export default ProtectedRoute;