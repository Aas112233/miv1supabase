import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaSignInAlt, FaUserCircle, FaLock, FaEnvelope } from 'react-icons/fa';
import authService from '../api/authService';
import auditService from '../api/auditService';
import { supabase } from '../src/config/supabaseClient';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Attempt to login using the authService
      const response = await authService.login(email, password);
      
      // Store the session
      authService.storeSession(response.session);
      
      // Get user role from auth.users table
      let role = 'member'; // default role
      
      // Check if user is in the list of admins
      if (email === 'mhassantoha@gmail.com' || email === 'admin@munshiinvestment.com') {
        role = 'admin';
      }
      
      // Create user object from response
      const user = {
        id: response.user?.id || 1,
        name: response.user?.user_metadata?.name || response.user?.email?.split('@')[0] || 'User',
        email: response.user?.email || email,
        role: role
      };
      
      // Log the login action
      await auditService.logUserLogin(user.id);
      
      // Call the onLogin callback with the user object
      onLogin(user);
      
      // Redirect to dashboard after successful login
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
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
          <h1>Investment Club</h1>
          <p>Welcome back! Please sign in to continue.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="login-input"
                disabled={loading}
                autoComplete="username"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="login-input"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="spinner" style={{ marginRight: '8px' }}></span>
                Signing In...
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaSignInAlt className="button-icon" style={{ marginRight: '8px' }} />
                Sign In
              </div>
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <p className="demo-credentials">
            Demo Credentials:<br />
            Email: admin@munshiinvestment.com<br />
            Password: admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;