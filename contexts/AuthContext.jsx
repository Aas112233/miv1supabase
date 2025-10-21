// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth service and check for stored token
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Optionally, you could validate the token with the server here
        // For now, we'll just check if a token exists
        const session = authService.getSession();
        if (session) {
          // In a more robust implementation, you might want to validate the token
          // with the server to ensure it's still valid
          setIsLoggedIn(true);
          // Set current user if needed
          const user = await authService.getCurrentUser();
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setCurrentUser(response.user);
      setIsLoggedIn(true);
      // Store session for persistence
      authService.storeSession(response.session);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
      setIsLoggedIn(false);
      authService.removeSession();
    } catch (error) {
      // Even if logout fails, clear local state
      setCurrentUser(null);
      setIsLoggedIn(false);
      authService.removeSession();
      throw error;
    }
  };

  const value = {
    currentUser,
    isLoggedIn,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};