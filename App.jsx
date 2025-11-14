import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ToastProvider from './ToastProvider';
import { useLocalStorage } from './hooks/useLocalStorage';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Projects from './pages/Projects';
import Transactions from './pages/Transactions';
import TransactionRequests from './pages/TransactionRequests';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Dividends from './pages/Dividends';
import Login from './pages/Login';
import LoadingSpinner from './components/LoadingSpinner';
import UserManagement from './pages/UserManagement';
import SessionTimeout from './components/SessionTimeout';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import KeyboardShortcutsWrapper from './components/KeyboardShortcutsWrapper';
import ProtectedRoute from './components/ProtectedRoute';
import NotAuthorized from './pages/NotAuthorized';
import NotFound from './pages/NotFound';
import Goals from './pages/Goals';
import MasterData from './pages/MasterData';
import Funds from './pages/Funds';
import authService from './api/authService';
import membersService from './api/membersService';
import paymentsService from './api/paymentsService';
import expensesService from './api/expensesService';
import projectsService from './api/projectsService';
import transactionRequestsService from './api/transactionRequestsService';
import auditService from './api/auditService';
import userService from './api/userService';
import permissionsService from './api/permissionsService';
import sessionService from './api/sessionService';
import { supabase } from './src/config/supabaseClient';

import './App.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [dividends, setDividends] = useState([]);
  const [goals, setGoals] = useState([]);
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [loading, setLoading] = useState(true);
  const [sessionTerminated, setSessionTerminated] = useState(false);

  // Apply theme to body class
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
  }, [theme]);

  // Monitor session status
  useEffect(() => {
    if (!isLoggedIn) return;

    const intervalId = sessionService.startSessionMonitoring(async () => {
      // Immediately logout when session is terminated
      await handleLogout();
      setSessionTerminated(true);
    });

    return () => sessionService.stopSessionMonitoring(intervalId);
  }, [isLoggedIn]);



  // Setup realtime subscriptions for data changes
  useEffect(() => {
    if (!isLoggedIn) return;

    const membersChannel = supabase
      .channel('members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, async () => {
        const data = await membersService.getAllMembers();
        setMembers(data || []);
      })
      .subscribe();

    const paymentsChannel = supabase
      .channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, async () => {
        const data = await paymentsService.getAllPayments();
        setPayments(data || []);
      })
      .subscribe();

    const expensesChannel = supabase
      .channel('expenses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, async () => {
        const data = await expensesService.getAllExpenses();
        setExpenses(data || []);
      })
      .subscribe();

    const projectsChannel = supabase
      .channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, async () => {
        const data = await projectsService.getAllProjects();
        setProjects(data || []);
      })
      .subscribe();

    const requestsChannel = supabase
      .channel('requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_requests' }, async () => {
        const data = await transactionRequestsService.getAllRequests();
        setRequests(data || []);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, [isLoggedIn]);

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = authService.getSession();
        const currentUser = await authService.getCurrentUser();
        
        if (session && currentUser) {
          setIsLoggedIn(true);
          
          // Get user profile from database
          const profile = await userService.ensureUserProfileExists(currentUser);
          
          // Get user permissions from database
          const permissions = await permissionsService.getUserPermissions(currentUser.id);
          
          const user = {
            id: currentUser.id,
            name: profile?.name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email,
            role: profile?.role || 'member',
            permissions: permissions
          };
          
          setCurrentUser(user);
          
          // Fetch members, payments, expenses, projects, and requests
          try {
            const [fetchedMembers, fetchedPayments, fetchedExpenses, fetchedProjects, fetchedRequests] = await Promise.allSettled([
              membersService.getAllMembers(),
              paymentsService.getAllPayments(),
              expensesService.getAllExpenses(),
              projectsService.getAllProjects(),
              transactionRequestsService.getAllRequests()
            ]);
            setMembers(fetchedMembers.status === 'fulfilled' ? fetchedMembers.value || [] : []);
            setPayments(fetchedPayments.status === 'fulfilled' ? fetchedPayments.value || [] : []);
            setExpenses(fetchedExpenses.status === 'fulfilled' ? fetchedExpenses.value || [] : []);
            setProjects(fetchedProjects.status === 'fulfilled' ? fetchedProjects.value || [] : []);
            setRequests(fetchedRequests.status === 'fulfilled' ? fetchedRequests.value || [] : []);
          } catch (error) {
            console.error('Failed to fetch data:', error);
          }
        }
      } catch (error) {
        console.error('Failed to check session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);

  const handleLogin = async (user) => {
    // Load permissions from database
    const permissions = await permissionsService.getUserPermissions(user.id);
    const userWithPermissions = { ...user, permissions };
    
    setCurrentUser(userWithPermissions);
    
    try {
      const [fetchedMembers, fetchedPayments, fetchedExpenses, fetchedProjects, fetchedRequests] = await Promise.allSettled([
        membersService.getAllMembers(),
        paymentsService.getAllPayments(),
        expensesService.getAllExpenses(),
        projectsService.getAllProjects(),
        transactionRequestsService.getAllRequests()
      ]);
      setMembers(fetchedMembers.status === 'fulfilled' ? fetchedMembers.value || [] : []);
      setPayments(fetchedPayments.status === 'fulfilled' ? fetchedPayments.value || [] : []);
      setExpenses(fetchedExpenses.status === 'fulfilled' ? fetchedExpenses.value || [] : []);
      setProjects(fetchedProjects.status === 'fulfilled' ? fetchedProjects.value || [] : []);
      setRequests(fetchedRequests.status === 'fulfilled' ? fetchedRequests.value || [] : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMembers([]);
      setPayments([]);
      setExpenses([]);
      setProjects([]);
      setRequests([]);
    }
    
    // Add delay then set logged in to prevent 404 flash
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      // Log the logout action before signing out
      if (currentUser && currentUser.id) {
        await auditService.logUserLogout(currentUser.id);
      }
      
      await authService.logout();
      authService.removeSession();
      setIsLoggedIn(false);
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on the server, clear the local session
      authService.removeSession();
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner message="Loading application..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <OfflineIndicator />

      <ToastProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <KeyboardShortcutsWrapper>
        {isLoggedIn && <KeyboardShortcutsHelp />}
        <div className={`app ${isLoggedIn ? '' : 'login-page'} ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
        {isLoggedIn ? (
          <>
            <SessionTimeout onLogout={handleLogout} />
            <Sidebar currentUser={currentUser} onLogout={handleLogout} />
            <div className="main-content">
              <div className="content">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="dashboard">
                        <Dashboard members={members} payments={payments} expenses={expenses} projects={projects} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/members" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="members">
                        <Members members={members} setMembers={setMembers} payments={payments} currentUser={currentUser} />
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
                    path="/expenses" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="expenses">
                        <Expenses expenses={expenses} setExpenses={setExpenses} projects={projects} currentUser={currentUser} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/projects" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="projects">
                        <Projects projects={projects} setProjects={setProjects} members={members} currentUser={currentUser} />
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
                    path="/analytics" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="analytics">
                        <Analytics payments={payments} members={members} />
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
                        <UserManagement currentUser={currentUser} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/master-data" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="master_data">
                        <MasterData currentUser={currentUser} />
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
                      <ProtectedRoute currentUser={currentUser} screenName="goals">
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
                  <Route 
                    path="/funds" 
                    element={
                      <ProtectedRoute currentUser={currentUser} screenName="funds">
                        <Funds currentUser={currentUser} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/not-authorized" element={<NotAuthorized />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>

              </div>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} sessionTerminated={sessionTerminated} setSessionTerminated={setSessionTerminated} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
        </div>
        </KeyboardShortcutsWrapper>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;