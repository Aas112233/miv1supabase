import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SessionTimeout.css';

const SessionTimeout = ({ onLogout }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const timeoutRef = useRef(null);
  const countdownRef = useRef(null);

  const INACTIVITY_TIME = 4 * 60 * 1000; // 4 minutes
  const WARNING_TIME = 60 * 1000; // 1 minute

  const resetTimer = useCallback(() => {
    if (showWarning) return;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(60);
    }, INACTIVITY_TIME);
  }, [showWarning, INACTIVITY_TIME]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    clearInterval(countdownRef.current);
    resetTimer();
  };

  const handleLogout = async () => {
    clearTimeout(timeoutRef.current);
    clearInterval(countdownRef.current);
    await onLogout();
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => document.addEventListener(event, handleActivity));
    
    resetTimer();

    return () => {
      events.forEach(event => document.removeEventListener(event, handleActivity));
      clearTimeout(timeoutRef.current);
      clearInterval(countdownRef.current);
    };
  }, [handleActivity, resetTimer]);

  useEffect(() => {
    if (showWarning) {
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(countdownRef.current);
  }, [showWarning]);

  if (!showWarning) return null;

  return (
    <div className="session-timeout-overlay">
      <div className="session-timeout-modal">
        <h2>⏰ Session Timeout Warning</h2>
        <p>You've been inactive for a while.</p>
        <p className="countdown">
          Auto logout in <strong>{countdown}</strong> seconds
        </p>
        <div className="session-timeout-actions">
          <button onClick={handleStayLoggedIn} className="btn-stay">
            Stay Logged In
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeout;
