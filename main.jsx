import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastProvider } from './contexts/ToastContext'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import './index.css'
import './App.css'
import App from './App.jsx' // Regular app
// import AppTest from './App.test.jsx' // Test app for API verification

// Load saved color theme
const savedColorTheme = localStorage.getItem('colorTheme') || 'blue';
document.body.setAttribute('data-color-theme', savedColorTheme);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  </StrictMode>,
)