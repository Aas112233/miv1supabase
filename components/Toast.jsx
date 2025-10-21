import React from 'react';
import { FaCheck, FaTimes, FaExclamation, FaInfo } from 'react-icons/fa';
import './Toast.css';

const Toast = ({ id, message, type, onClose }) => {
  // Auto-close the toast after 5 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [id, onClose]);
  
  const getToastIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheck />;
      case 'error':
        return <FaTimes />;
      case 'warning':
        return <FaExclamation />;
      default:
        return <FaInfo />;
    }
  };
  
  return (
    <div className={`toast toast--${type}`}>
      <div className="toast-icon">{getToastIcon()}</div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={() => onClose(id)}>
        ×
      </button>
    </div>
  );
};

export default Toast;