import React from 'react';
import { Navigate } from 'react-router-dom';
import NotAuthorized from '../pages/NotAuthorized';

const ProtectedRoute = ({ 
  children, 
  currentUser, 
  requiredPermission = 'read',
  screenName 
}) => {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Admin users have access to all screens
  if (currentUser.role === 'admin') {
    return children;
  }

  // Check permissions from database
  const userPermissions = currentUser.permissions || {};
  const screenPermissions = userPermissions[screenName];
  
  if (!screenPermissions || !screenPermissions[requiredPermission]) {
    return <NotAuthorized />;
  }

  return children;
};

export default ProtectedRoute;