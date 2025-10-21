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

  // For member users, check if they have permissions for this screen
  // In a more complex app, you might check specific permissions here
  // For now, we'll allow members to access most screens except admin-only ones
  const adminOnlyScreens = []; // Add screen names that should be admin-only
  
  if (adminOnlyScreens.includes(screenName) && currentUser.role !== 'admin') {
    return <NotAuthorized />;
  }

  // Members can access all other screens
  return children;
};

export default ProtectedRoute;