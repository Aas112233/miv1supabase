// src/api/authService.js
import apiClient from './apiClient';

class AuthService {
  async login(email, password) {
    try {
      // Use GET with URL parameters to avoid CORS preflight issues
      const url = `/api/auth/login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      const response = await apiClient.get(url);
      
      // Store token in apiClient for future requests
      if (response.token) {
        apiClient.setToken(response.token);
      }
      
      return response;
    } catch (error) {
      // Provide more specific error messages for common issues
      if (error.message.includes('connect')) {
        throw new Error('Unable to connect to the authentication server. Please check your internet connection.');
      } else if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        throw new Error('Connection to the authentication server failed. This may be due to CORS issues or network connectivity problems.');
      } else if (error.message.includes('HTTP 401') || error.message.includes('Invalid credentials')) {
        throw new Error('Invalid email or password. Please try again.');
      } else {
        throw new Error(error.message || 'Login failed. Please try again.');
      }
    }
  }

  async logout() {
    try {
      await apiClient.post('/api/auth/logout', {});
      apiClient.clearToken();
      return { message: 'Logged out successfully' };
    } catch (error) {
      // Even if logout fails on the server, clear the token locally
      apiClient.clearToken();
      throw new Error(error.message || 'Logout failed');
    }
  }

  // Store token in localStorage for persistence across sessions
  storeToken(token) {
    try {
      localStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Failed to store token in localStorage:', error);
    }
  }

  // Retrieve token from localStorage
  getToken() {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      console.error('Failed to retrieve token from localStorage:', error);
      return null;
    }
  }

  // Remove token from localStorage
  removeToken() {
    try {
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Failed to remove token from localStorage:', error);
    }
  }

  // Initialize the service with stored token
  init() {
    const token = this.getToken();
    if (token) {
      apiClient.setToken(token);
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;