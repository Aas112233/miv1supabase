import React, { useState } from 'react';
import AuditLogViewer from '../components/AuditLogViewer';
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
  const [activeSection, setActiveSection] = useState('general');
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    paymentReminders: true,
    transactionAlerts: true
  });

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
      <h1>Settings</h1>
      
      <div className="settings-container">
        <div className="settings-sidebar">
          <ul>
            <li 
              className={activeSection === 'general' ? 'active' : ''} 
              onClick={() => setActiveSection('general')}
            >
              General
            </li>
            <li 
              className={activeSection === 'notifications' ? 'active' : ''} 
              onClick={() => setActiveSection('notifications')}
            >
              Notifications
            </li>
            <li 
              className={activeSection === 'data' ? 'active' : ''} 
              onClick={() => setActiveSection('data')}
            >
              Data Management
            </li>
            <li 
              className={activeSection === 'audit' ? 'active' : ''} 
              onClick={() => setActiveSection('audit')}
            >
              Audit Logs
            </li>
            <li 
              className={activeSection === 'appearance' ? 'active' : ''} 
              onClick={() => setActiveSection('appearance')}
            >
              Appearance
            </li>
          </ul>
        </div>
        
        <div className="settings-content">
          {activeSection === 'general' && (
            <div className="settings-section">
              <h2>General Settings</h2>
              <div className="setting-item">
                <label>Club Name</label>
                <input type="text" defaultValue="Investment Club" />
              </div>
              <div className="setting-item">
                <label>Currency</label>
                <select defaultValue="BDT">
                  <option value="BDT">BDT (Bangladeshi Taka)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Financial Year Start</label>
                <input type="date" defaultValue={new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]} />
              </div>
            </div>
          )}
          
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
          
          {activeSection === 'data' && (
            <div className="settings-section">
              <h2>Data Management</h2>
              <div className="setting-item">
                <button className="btn btn--primary" onClick={handleExportData}>
                  Export Data
                </button>
                <p>Download all your data as a JSON file</p>
              </div>
              <div className="setting-item">
                <label className="file-input-label">
                  Import Data
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleImportData}
                    style={{ display: 'none' }}
                  />
                </label>
                <p>Upload a JSON file to restore your data</p>
              </div>
              <div className="setting-item">
                <button className="btn btn--danger" onClick={handleClearData}>
                  Clear All Data
                </button>
                <p className="warning">Warning: This will permanently delete all data</p>
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
                <label>Theme</label>
                <select 
                  value={theme} 
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;