import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  FaChartBar, 
  FaUsers, 
  FaMoneyBillWave, 
  FaCreditCard, 
  FaFileAlt, 
  FaUser, 
  FaChartLine, 
  FaMoneyBillAlt, 
  FaClipboardList, 
  FaCog, 
  FaSignOutAlt,
  FaBars,
  FaReceipt,
  FaProjectDiagram,
  FaDatabase
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ currentUser, onLogout }) => {
  const { t } = useLanguage();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebarCollapsed', false);
  const [showUserModal, setShowUserModal] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <h2>Investment Club</h2>}
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <FaBars />
        </button>
        {currentUser && (
          <div className="user-info">
            <div className="user-avatar">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!isCollapsed && (
              <div className="user-details" onClick={() => setShowUserModal(true)}>
                <div className="user-name">{currentUser.name || 'User'}</div>
                <div className="user-role">
                  <span className="role-badge">{currentUser.role === 'admin' ? 'Admin' : 'Member'}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <Link 
              to="/dashboard" 
              className={isActive('/dashboard') ? 'active' : ''}
            >
              <FaChartBar className="nav-icon" />
              {!isCollapsed && t.nav.dashboard}
            </Link>
          </li>
          <li>
            <Link 
              to="/members" 
              className={isActive('/members') ? 'active' : ''}
            >
              <FaUsers className="nav-icon" />
              {!isCollapsed && t.nav.members}
            </Link>
          </li>
          <li>
            <Link 
              to="/payments" 
              className={isActive('/payments') ? 'active' : ''}
            >
              <FaMoneyBillWave className="nav-icon" />
              {!isCollapsed && t.nav.payments}
            </Link>
          </li>
          <li>
            <Link 
              to="/expenses" 
              className={isActive('/expenses') ? 'active' : ''}
            >
              <FaReceipt className="nav-icon" />
              {!isCollapsed && t.nav.expenses}
            </Link>
          </li>
          <li>
            <Link 
              to="/projects" 
              className={isActive('/projects') ? 'active' : ''}
            >
              <FaProjectDiagram className="nav-icon" />
              {!isCollapsed && 'Projects'}
            </Link>
          </li>
          <li>
            <Link 
              to="/transactions" 
              className={isActive('/transactions') ? 'active' : ''}
            >
              <FaCreditCard className="nav-icon" />
              {!isCollapsed && t.nav.transactions}
            </Link>
          </li>
          <li>
            <Link 
              to="/requests" 
              className={isActive('/requests') ? 'active' : ''}
            >
              <FaFileAlt className="nav-icon" />
              {!isCollapsed && t.nav.transactionRequests}
            </Link>
          </li>
          <li>
            <Link 
              to="/profile" 
              className={isActive('/profile') ? 'active' : ''}
            >
              <FaUser className="nav-icon" />
              {!isCollapsed && t.nav.userManagement}
            </Link>
          </li>
          <li>
            <Link 
              to="/reports" 
              className={isActive('/reports') ? 'active' : ''}
            >
              <FaChartLine className="nav-icon" />
              {!isCollapsed && t.nav.reports}
            </Link>
          </li>
          <li>
            <Link 
              to="/dividends" 
              className={isActive('/dividends') ? 'active' : ''}
            >
              <FaMoneyBillAlt className="nav-icon" />
              {!isCollapsed && t.nav.dividends}
            </Link>
          </li>
          <li>
            <Link 
              to="/budget" 
              className={isActive('/budget') ? 'active' : ''}
            >
              <FaClipboardList className="nav-icon" />
              {!isCollapsed && t.nav.goals}
            </Link>
          </li>
          <li>
            <Link 
              to="/master-data" 
              className={isActive('/master-data') ? 'active' : ''}
            >
              <FaDatabase className="nav-icon" />
              {!isCollapsed && 'Master Data'}
            </Link>
          </li>
          <li>
            <Link 
              to="/settings" 
              className={isActive('/settings') ? 'active' : ''}
            >
              <FaCog className="nav-icon" />
              {!isCollapsed && t.nav.settings}
            </Link>
          </li>
          {/* Removed Google Sheets Test link */}
        </ul>
      </nav>
      {currentUser && (
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            <FaSignOutAlt className="nav-icon" />
            {!isCollapsed && t.nav.logout}
          </button>
        </div>
      )}

      {showUserModal && (
        <div className="user-modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-modal-header">
              <h3>User Details</h3>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>×</button>
            </div>
            <div className="user-modal-body">
              <div className="user-modal-avatar">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-modal-info">
                <div className="info-row">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{currentUser.name || 'User'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{currentUser.email || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Role:</span>
                  <span className="info-value">
                    <span className="role-badge">{currentUser.role === 'admin' ? 'Admin' : 'Member'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;