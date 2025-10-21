// src/api/testApi.js
// Simple test script to verify API connection

import apiClient from './apiClient';
import authService from './authService';

export const testApiConnection = async () => {
  console.log('Testing API connection...');
  
  try {
    // Test unauthenticated request
    console.log('Testing unauthenticated request to /api/members...');
    const members = await apiClient.get('/api/members');
    console.log('Unauthenticated request successful. Members:', members);
    
    // Test login
    console.log('Testing login...');
    const loginResponse = await authService.login('admin@munshiinvestment.com', 'admin123');
    console.log('Login successful. Response:', loginResponse);
    
    // Test authenticated request
    console.log('Testing authenticated request to /api/members...');
    const authMembers = await apiClient.get('/api/members');
    console.log('Authenticated request successful. Members:', authMembers);
    
    console.log('All tests passed!');
    return true;
  } catch (error) {
    console.error('API test failed:', error);
    return false;
  }
};

// Run the test if this file is executed directly
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Only run on localhost for development
  testApiConnection();
}