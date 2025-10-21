import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className="not-found">
      <div className="not-found-container">
        <div className="not-found-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h1>Page Not Found</h1>
        <p className="not-found-message">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <p className="not-found-instructions">
          The URL might be incorrect, or the page may have been removed.
        </p>
        <div className="not-found-actions">
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

export default NotFound;