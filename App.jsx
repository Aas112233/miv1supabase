import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { useLocalStorage } from './hooks/useLocalStorage';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Payments from './pages/Payments';
import Transactions from './pages/Transactions';
import TransactionRequests from './pages/TransactionRequests';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Dividends from './pages/Dividends';
import Login from './pages/Login';
import LoadingSpinner from './components/LoadingSpinner';
import UserManagement from './pages/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import NotAuthorized from './pages/NotAuthorized';
import NotFound from './pages/NotFound';
import Goals from './pages/Goals';
import membersService from './api/membersService';

import './App.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [dividends, setDividends] = useState([]);
  const [goals, setGoals] = useState([]);
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [loading, setLoading] = useState(true);

  // Apply theme to body class
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
  }, [theme]);

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = async () => {
      const storedUser = localStorage.getItem('currentUser');
      const loginTime = localStorage.getItem('loginTime');
      
      if (storedUser && loginTime) {
        const now = Date.now();
        const elapsed = now - parseInt(loginTime);
        const fifteenMinutes = 15 * 60 * 1000;
        
        // If less than 15 minutes, restore session
        if (elapsed < fifteenMinutes) {
          const user = JSON.parse(storedUser);
          setIsLoggedIn(true);
          setCurrentUser(user);
          
          // Fetch members
          try {
            const fetchedMembers = await membersService.getAllMembers();
            setMembers(fetchedMembers || []);
          } catch (error) {
            console.error('Failed to fetch members:', error);
          }
        } else {
          // Session expired, clear storage
          localStorage.removeItem('currentUser');
          localStorage.removeItem('loginTime');
          localStorage.removeItem('authToken');
        }
      }
      
      setLoading(false);
    };
    
    checkSession();
  }, []);

  const handleLogin = async (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    
    // Store user and login time in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('loginTime', Date.now().toString());
    
    // Fetch members from Google Sheets after login
    try {
      const fetchedMembers = await membersService.getAllMembers();
      setMembers(fetchedMembers || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      setMembers([]);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    
    // Clear localStorage on logout
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('authToken');
  };

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner message="Loading application..." />
      </div>
    );
  }

  return (
    <Router>
      <div className={`app ${isLoggedIn ? '' : 'login-page'} ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
        {isLoggedIn ? (
          <>
            <Sidebar currentUser={currentUser} onLogout={handleLogout} />
            <div className="main-content">
              <div className="content">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="dashboard">
                        <Dashboard members={members} payments={payments} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/members" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="members">
                        <Members members={members} setMembers={setMembers} currentUser={currentUser} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/payments" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="payments">
                        <Payments payments={payments} setPayments={setPayments} members={members} currentUser={currentUser} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/transactions" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="transactions">
                        <Transactions payments={payments} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/requests" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="requests">
                        <TransactionRequests requests={requests} setRequests={setRequests} payments={payments} setPayments={setPayments} members={members} currentUser={currentUser} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="profile">
                        <UserManagement members={members} setMembers={setMembers} currentUser={currentUser} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="settings">
                        <Settings 
                          members={members} 
                          setMembers={setMembers} 
                          payments={payments} 
                          setPayments={setPayments} 
                          transactions={payments} 
                          setTransactions={setPayments} 
                          transactionRequests={requests} 
                          setTransactionRequests={setRequests} 
                          currentUser={currentUser} 
                          theme={theme} 
                          setTheme={setTheme} 
                        />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/reports" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="reports">
                        <Reports members={members} payments={payments} requests={requests} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dividends" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="dividends">
                        <Dividends 
                          members={members} 
                          payments={payments} 
                          transactions={payments} 
                          dividends={dividends} 
                          setDividends={setDividends} 
                        />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/budget" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="budget">
                        <Goals 
                          members={members} 
                          payments={payments} 
                          transactions={payments} 
                          goals={goals} 
                          setGoals={setGoals} 
                          currentUser={currentUser}
                        />
                      </ProtectedRoute>
                    } 
                  />
                  {/* Removed Google Sheets test route */}
                  <Route path="/not-authorized" element={<NotAuthorized />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>

              </div>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
};

export default App;