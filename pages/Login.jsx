import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaSignInAlt, FaLock, FaEnvelope } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import authService from '../api/authService';
import auditService from '../api/auditService';
import userService from '../api/userService';
import permissionsService from '../api/permissionsService';
import masterDataService from '../api/masterDataService';
import './Login.css';

const Login = ({ onLogin }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [messageType, setMessageType] = useState('');
  const [messageText, setMessageText] = useState('');
  const [clubName, setClubName] = useState('Investment Club');
  const [fetchingData, setFetchingData] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadClubName();
  }, []);

  const loadClubName = async () => {
    try {
      const data = await masterDataService.getAllMasterData();
      const club = data.find(item => item.category === 'club_name' && item.is_active);
      if (club) setClubName(club.value);
    } catch (error) {
      console.error('Failed to load club name:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    setError('');
    setShowMessage(true);
    setMessageType('loading');
    setMessageText('Authenticating...');
    
    try {
      const response = await authService.login(email, password);
      authService.storeSession(response.session, rememberMe);
      
      // Ensure user profile exists and get role from database
      const profile = await userService.ensureUserProfileExists(response.user);
      
      // Get user permissions from database
      const permissions = await permissionsService.getUserPermissions(response.user.id);
      
      const user = {
        id: response.user.id,
        name: profile?.name || response.user.user_metadata?.name || response.user.email?.split('@')[0] || 'User',
        email: response.user.email,
        role: profile?.role || 'member',
        permissions: permissions
      };
      
      // Update last login
      await userService.updateLastLogin(user.id);
      await auditService.logUserLogin(user.id);
      
      setMessageType('success');
      setMessageText('Login successful!');
      
      // Show fetching data overlay
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowMessage(false);
      setFetchingData(true);
      
      // Wait for onLogin to complete
      await onLogin(user);
      
      // Navigate to dashboard after data is loaded
      navigate('/dashboard');
    } catch (err) {
      setMessageType('error');
      setMessageText(err.message || 'Invalid email or password');
      setError(err.message || 'Invalid email or password');
      setTimeout(() => setShowMessage(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetMessage('Please enter your email');
      return;
    }
    
    setLoading(true);
    setResetMessage('');
    
    try {
      await authService.resetPassword(resetEmail);
      setResetMessage('Password reset link sent to your email');
      setTimeout(() => setShowResetPassword(false), 3000);
    } catch (err) {
      setResetMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <FaUsers />
          </div>
          <h1>{clubName}</h1>
          <p>Welcome back! Please sign in to continue.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">{t.auth.email}:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.auth.email}
              className="login-input"
              disabled={loading}
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{t.auth.password}:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.auth.password}
              className="login-input"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          
          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              {t.auth.rememberMe}
            </label>
            <button
              type="button"
              className="forgot-password"
              onClick={() => {
                setShowMessage(true);
                setMessageType('info');
                setMessageText('Please contact your administrator for password reset.');
                setTimeout(() => setShowMessage(false), 4000);
              }}
            >
              {t.auth.forgotPassword}
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="spinner" style={{ marginRight: '8px' }}></span>
                {t.auth.loggingIn}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaSignInAlt className="button-icon" style={{ marginRight: '8px' }} />
                {t.auth.loginButton}
              </div>
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <p className="contact-admin">
            Need an account? Contact your administrator
          </p>
        </div>
      </div>

      {showMessage && (
        <div className="message-overlay">
          <div className={`message-box message-${messageType}`}>
            {messageType === 'loading' && <span className="spinner"></span>}
            {messageType === 'success' && <span className="icon-success">✓</span>}
            {messageType === 'error' && <span className="icon-error">✕</span>}
            {messageType === 'info' && <span className="icon-info">ℹ</span>}
            <p>{messageText}</p>
          </div>
        </div>
      )}

      {fetchingData && (
        <div className="message-overlay" style={{ background: 'rgba(0, 0, 0, 0.9)' }}>
          <div className="message-box message-loading" style={{ padding: '2rem 3rem' }}>
            <span className="spinner" style={{ width: '40px', height: '40px', marginBottom: '1rem' }}></span>
            <p style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>Fetching data from cloud...</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>Please wait</p>
          </div>
        </div>
      )}

      {showResetPassword && (
        <div className="overlay">
          <div className="overlay-content" style={{ maxWidth: '400px' }}>
            <div className="overlay-header">
              <h2>Reset Password</h2>
              <button className="overlay-close" onClick={() => setShowResetPassword(false)}>×</button>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="resetEmail">Email:</label>
                <input
                  type="email"
                  id="resetEmail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
              {resetMessage && <div className={resetMessage.includes('sent') ? 'success-message' : 'error-message'}>{resetMessage}</div>}
              <div className="form-actions">
                <button type="submit" className="btn btn--primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button type="button" className="btn btn--secondary" onClick={() => setShowResetPassword(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;