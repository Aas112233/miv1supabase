import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthTest = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      setUser(data.user);
      setMessage('Login successful!');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw error;
      setMessage('Sign up successful! Check your email for confirmation.');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setMessage('Logged out successfully!');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Supabase Auth Test</h2>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          margin: '10px 0', 
          borderRadius: '4px',
          backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e8',
          color: message.includes('Error') ? '#c62828' : '#2e7d32'
        }}>
          {message}
        </div>
      )}

      {user ? (
        <div>
          <p>Logged in as: <strong>{user.email}</strong></p>
          <button 
            onClick={handleLogout}
            disabled={loading}
            style={{
              padding: '10px 15px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 15px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                flex: 1
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              style={{
                padding: '10px 15px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                flex: 1
              }}
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AuthTest;