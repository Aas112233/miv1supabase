import React, { useState } from 'react';
import { FaCog, FaBell, FaDatabase, FaHistory, FaPalette, FaDownload, FaUpload, FaTrash, FaGlobe } from 'react-icons/fa';
import AuditLogViewer from '../components/AuditLogViewer';
import { useLanguage } from '../contexts/LanguageContext';
import './Settings.css';

const Settings = ({ 
  members, 
  setMembers, 
  payments, 
  setPayments, 
  transactions, 
  setTransactions,
  transactionRequests,
  setTransactionRequests,
  currentUser,
  theme,
  setTheme
}) => {
  const { language, setLanguage } = useLanguage();
  const [activeSection, setActiveSection] = useState('notifications');
  const [colorTheme, setColorTheme] = useState(localStorage.getItem('colorTheme') || 'blue');
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    paymentReminders: true,
    transactionAlerts: true
  });

  const handleColorThemeChange = (color) => {
    setColorTheme(color);
    localStorage.setItem('colorTheme', color);
    document.body.setAttribute('data-color-theme', color);
  };

  React.useEffect(() => {
    document.body.setAttribute('data-color-theme', colorTheme);
  }, []);

  const handleExportData = () => {
    const data = {
      members,
      payments,
      transactions,
      transactionRequests,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `investment-club-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          // Update state with imported data
          if (data.members) setMembers(data.members);
          if (data.payments) setPayments(data.payments);
          if (data.transactions) setTransactions(data.transactions);
          if (data.transactionRequests) setTransactionRequests(data.transactionRequests);
          
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      setMembers([]);
      setPayments([]);
      setTransactions([]);
      setTransactionRequests([]);
      alert('All data has been cleared.');
    }
  };

  const handleNotificationChange = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    });
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
        <p className="settings-subtitle">Manage your application preferences and configurations</p>
      </div>
      
      <div className="tabs">
        <button 
          className={`tab ${activeSection === 'notifications' ? 'tab--active' : ''}`}
          onClick={() => setActiveSection('notifications')}
        >
          <FaBell /> Notifications
        </button>
        {currentUser?.role === 'admin' && (
          <button 
            className={`tab ${activeSection === 'data' ? 'tab--active' : ''}`}
            onClick={() => setActiveSection('data')}
          >
            <FaDatabase /> Data Management
          </button>
        )}
        <button 
          className={`tab ${activeSection === 'audit' ? 'tab--active' : ''}`}
          onClick={() => setActiveSection('audit')}
        >
          <FaHistory /> Audit Logs
        </button>
        <button 
          className={`tab ${activeSection === 'appearance' ? 'tab--active' : ''}`}
          onClick={() => setActiveSection('appearance')}
        >
          <FaPalette /> Appearance
        </button>
      </div>
      
      <div className="settings-container">
        <div className="settings-content">
          {activeSection === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Settings</h2>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.emailNotifications}
                    onChange={() => handleNotificationChange('emailNotifications')}
                  />
                  Email Notifications
                </label>
              </div>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.paymentReminders}
                    onChange={() => handleNotificationChange('paymentReminders')}
                  />
                  Payment Reminders
                </label>
              </div>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.transactionAlerts}
                    onChange={() => handleNotificationChange('transactionAlerts')}
                  />
                  Transaction Alerts
                </label>
              </div>
            </div>
          )}
          
          {activeSection === 'data' && currentUser?.role === 'admin' && (
            <div className="settings-section">
              <h2>Data Management</h2>
              <div className="data-actions">
                <div className="action-card">
                  <div className="action-icon action-icon--primary">
                    <FaDownload />
                  </div>
                  <h3>Export Data</h3>
                  <p>Download all your data as a JSON file for backup</p>
                  <button className="btn btn--primary" onClick={handleExportData}>
                    <FaDownload /> Export
                  </button>
                </div>
                <div className="action-card">
                  <div className="action-icon action-icon--info">
                    <FaUpload />
                  </div>
                  <h3>Import Data</h3>
                  <p>Upload a JSON file to restore your data</p>
                  <label className="btn btn--secondary file-input-label">
                    <FaUpload /> Import
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportData}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                <div className="action-card">
                  <div className="action-icon action-icon--danger">
                    <FaTrash />
                  </div>
                  <h3>Clear All Data</h3>
                  <p className="warning">Permanently delete all data from the system</p>
                  <button className="btn btn--danger" onClick={handleClearData}>
                    <FaTrash /> Clear Data
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeSection === 'audit' && (
            <div className="settings-section">
              <h2>Audit Logs</h2>
              <p>View all system activities and user actions.</p>
              <AuditLogViewer currentUser={currentUser} />
            </div>
          )}
          
          {activeSection === 'appearance' && (
            <div className="settings-section">
              <h2>Appearance</h2>
              <div className="setting-item">
                <label>Theme Mode</label>
                <select 
                  value={theme} 
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Language</label>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="bn">বাংলা (Bengali)</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Color Theme</label>
                <div className="theme-colors">
                  <div className={`theme-color ${colorTheme === 'blue' ? 'active' : ''}`} onClick={() => handleColorThemeChange('blue')}>
                    <div className="color-preview" style={{background: 'linear-gradient(135deg, #007bff, #0056b3)'}}></div>
                    <span>Blue</span>
                  </div>
                  <div className={`theme-color ${colorTheme === 'red' ? 'active' : ''}`} onClick={() => handleColorThemeChange('red')}>
                    <div className="color-preview" style={{background: 'linear-gradient(135deg, #dc3545, #bd2130)'}}></div>
                    <span>Red</span>
                  </div>
                  <div className={`theme-color ${colorTheme === 'green' ? 'active' : ''}`} onClick={() => handleColorThemeChange('green')}>
                    <div className="color-preview" style={{background: 'linear-gradient(135deg, #28a745, #1e7e34)'}}></div>
                    <span>Green</span>
                  </div>
                  <div className={`theme-color ${colorTheme === 'purple' ? 'active' : ''}`} onClick={() => handleColorThemeChange('purple')}>
                    <div className="color-preview" style={{background: 'linear-gradient(135deg, #6f42c1, #5a32a3)'}}></div>
                    <span>Purple</span>
                  </div>
                  <div className={`theme-color ${colorTheme === 'orange' ? 'active' : ''}`} onClick={() => handleColorThemeChange('orange')}>
                    <div className="color-preview" style={{background: 'linear-gradient(135deg, #fd7e14, #e8590c)'}}></div>
                    <span>Orange</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;