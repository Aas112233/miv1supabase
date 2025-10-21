// src/components/ApiTestComponent.jsx
import React, { useState } from 'react';
import apiClient from '../api/apiClient';
import authService from '../api/authService';

const ApiTestComponent = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, result, isError = false) => {
    setTestResults(prev => [...prev, { test, result, isError, timestamp: new Date().toLocaleTimeString() }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testMembersApi = async () => {
    setLoading(true);
    try {
      addResult('Get Members', 'Sending request...');
      const members = await apiClient.get('/api/members');
      addResult('Get Members', `Success: ${Array.isArray(members) ? members.length : 0} members found`);
    } catch (error) {
      addResult('Get Members', `Error: ${error.message}`, true);
      console.error('Full error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      addResult('Login', 'Sending login request...');
      const response = await authService.login('admin@munshiinvestment.com', 'admin123');
      addResult('Login', `Success: Token received for user ${response.user.name}`);
    } catch (error) {
      addResult('Login', `Error: ${error.message}`, true);
      console.error('Full error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const testCreateMember = async () => {
    setLoading(true);
    try {
      addResult('Create Member', 'Sending create request...');
      const newMember = {
        name: 'Test User',
        contact: 'test@example.com',
        shareAmount: 100,
        joinDate: new Date().toISOString().split('T')[0],
        isActive: true
      };
      
      const member = await apiClient.post('/api/members', newMember);
      addResult('Create Member', `Success: Created member with ID ${member.id}`);
    } catch (error) {
      addResult('Create Member', `Error: ${error.message}`, true);
      console.error('Full error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      addResult('Connection Test', 'Testing basic connection...');
      
      // Test direct fetch to see raw response
      const response = await fetch('https://script.google.com/macros/s/AKfycbyh7aFbfqmhk-EfREmJA4tp2KguIOQCvZrAR1CiXAU8bM6DJDQ4DpBH1cbBKuy0Uw-f/exec?path=/api/members');
      const statusText = `Status: ${response.status} ${response.statusText}`;
      addResult('Connection Test', statusText);
      
      const headers = {};
      for (let [key, value] of response.headers.entries()) {
        headers[key] = value;
      }
      addResult('Connection Test', `Headers: ${JSON.stringify(headers, null, 2)}`);
      
      const text = await response.text();
      addResult('Connection Test', `Response (first 200 chars): ${text.substring(0, 200)}`);
      
    } catch (error) {
      addResult('Connection Test', `Error: ${error.message}`, true);
      console.error('Full error details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>API Test Component</h2>
      <p>Use this component to test your Google Sheets API integration</p>
      <p><strong>Note:</strong> Check the browser console (F12) for detailed error information</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testConnection} 
          disabled={loading}
          style={{ padding: '10px', margin: '5px', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
        
        <button 
          onClick={testMembersApi} 
          disabled={loading}
          style={{ padding: '10px', margin: '5px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Testing...' : 'Test Members API'}
        </button>
        
        <button 
          onClick={testLogin} 
          disabled={loading}
          style={{ padding: '10px', margin: '5px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>
        
        <button 
          onClick={testCreateMember} 
          disabled={loading}
          style={{ padding: '10px', margin: '5px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Testing...' : 'Test Create Member'}
        </button>
        
        <button 
          onClick={clearResults} 
          style={{ padding: '10px', margin: '5px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Clear Results
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Test Results</h3>
        {testResults.length === 0 ? (
          <p>No tests run yet</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
            {testResults.map((result, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: '10px', 
                  margin: '5px 0', 
                  backgroundColor: result.isError ? '#ffebee' : '#e8f5e8',
                  borderLeft: `4px solid ${result.isError ? '#f44336' : '#4CAF50'}`,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap'
                }}
              >
                <strong>[{result.timestamp}] {result.test}:</strong> {result.result}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196F3' }}>
        <h4>Troubleshooting Tips</h4>
        <ul>
          <li>Check browser console (F12) for detailed error information</li>
          <li>Verify Google Apps Script deployment is set to "Anyone" access</li>
          <li>Ensure sample data was added successfully</li>
          <li>Try accessing through the Vite development server instead of directly opening HTML files</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiTestComponent;