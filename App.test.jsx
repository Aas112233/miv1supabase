// src/App.test.jsx
// Temporary test component to verify API integration
// Replace the regular App component with this one to test the API

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import ApiTestComponent from './components/ApiTestComponent';
import './App.css';

const AppTest = () => {
  return (
    <Router>
      <div className="app">
        <ToastProvider>
          <AuthProvider>
            <div style={{ padding: '20px' }}>
              <h1>Investment Club API Integration Test</h1>
              <p>This is a temporary test page to verify your Google Sheets API integration.</p>
              <ApiTestComponent />
            </div>
          </AuthProvider>
        </ToastProvider>
      </div>
    </Router>
  );
};

export default AppTest;