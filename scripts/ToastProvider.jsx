import React from 'react';
import { ToastProvider as BaseToastProvider } from './contexts/ToastContext';

const ToastProvider = ({ children }) => {
  return <BaseToastProvider>{children}</BaseToastProvider>;
};

export default ToastProvider;
