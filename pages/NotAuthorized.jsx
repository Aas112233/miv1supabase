import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotAuthorized.css';

const NotAuthorized = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className="not-authorized">
      <div className="not-authorized-container">
        <div className="not-authorized-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h1>Access Denied</h1>
        <p className="not-authorized-message">
          You do not have the necessary permissions to access this page.
        </p>
        <p className="not-authorized-instructions">
          Please contact your administrator to request access to this resource.
        </p>
        <div className="not-authorized-actions">
          <button className="btn btn--secondary" onClick={handleGoBack}>
            Go Back
          </button>
          <button className="btn btn--primary" onClick={handleGoHome}>
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotAuthorized;