import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from '../contexts/LanguageContext';
import masterDataService from '../api/masterDataService';
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
  FaDatabase,
  FaChartPie,
  FaWallet
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ currentUser, onLogout }) => {
  const { t } = useLanguage();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebarCollapsed', false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useLocalStorage('welcomeModalShown', false);
  const [clubName, setClubName] = useState('Investment Club');

  useEffect(() => {
    loadClubName();
    if (currentUser && !showWelcomeModal && window.innerWidth <= 768) {
      const role = currentUser.role?.toLowerCase();
      if (role === 'admin' || role === 'accountant' || role === 'manager') {
        setShowWelcomeModal(true);
      }
    }
  }, [currentUser]);

  const loadClubName = async () => {
    try {
      const data = await masterDataService.getAllMasterData();
      const club = data.find(item => item.category === 'club_name' && item.is_active);
      if (club) setClubName(club.value);
    } catch (error) {
      console.error('Failed to load club name:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setIsCollapsed(true);
    }
  };

  const requestDesktopSite = () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=1024');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=1024';
      document.head.appendChild(meta);
    }
    setShowWelcomeModal(false);
    window.location.reload();
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <h2>{clubName}</h2>}
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
              onClick={handleNavClick}
            >
              <FaChartBar className="nav-icon" />
              {!isCollapsed && t.nav.dashboard}
            </Link>
          </li>
          <li>
            <Link 
              to="/members" 
              className={isActive('/members') ? 'active' : ''}
              onClick={handleNavClick}
            >
              <FaUsers className="nav-icon" />
              {!isCollapsed && t.nav.members}
            </Link>
          </li>
          <li>
            <Link 
              to="/payments" 
              className={isActive('/payments') ? 'active' : ''}
              onClick={handleNavClick}
            >
              <FaMoneyBillWave className="nav-icon" />
              {!isCollapsed && t.nav.payments}
            </Link>
          </li>
          <li>
            <Link 
              to="/expenses" 
              className={isActive('/expenses') ? 'active' : ''}
              onClick={handleNavClick}
            >
              <FaReceipt className="nav-icon" />
              {!isCollapsed && t.nav.expenses}
            </Link>
          </li>
          <li>
            <Link 
              to="/projects" 
              className={isActive('/projects') ? 'active' : ''}
              onClick={handleNavClick}
            >
              <FaProjectDiagram className="nav-icon" />
              {!isCollapsed && t.nav.projects}
            </Link>
          </li>
          <li>
            <Link 
              to="/transactions" 
              className={isActive('/transactions') ? 'active' : ''}
              onClick={handleNavClick}
            >
              <FaCreditCard className="nav-icon" />
              {!isCollapsed && t.nav.transactions}
            </Link>
          </li>
          <li>
            <Link 
              to="/analytics" 
              className={isActive('/analytics') ? 'active' : ''}
              onClick={handleNavClick}
            >
              <FaChartPie className="nav-icon" />
              {!isCollapsed && t.nav.analytics}
            </Link>
          </li>
          <li>
            <Link 
              to="/requests" 
              className={isActive('/requests') ? 'active' : ''}
              onClick={handleNavClick}
            >
              <FaFileAlt className="nav-icon" />
              {!isCollapsed && t.nav.transactionRequests}
            </Link>
          </li>
          <li>
            <Link 
              to="/profile" 
              className={isActive('/profile') ? 'active' : ''}
              onClick={handleNavClick}
            >
              <FaUser className="nav-icon" />
              {!isCollapsed && t.nav.userManagement}
            </Link>
          </li>
          <li>
            <Link 
              to="/reports" 
              className={isActive('/reports') ? 'active' : ''}
              onClick={handleNavClick}
            >
              <FaChartLine className="nav-icon" />
              {!isCollapsed && t.nav.reports}
            </Link>
          </li>
          <li>
            <Link 
              to="/dividends" 
              className={isActive('/dividends') ? 'active' : ''}
              onClick={handleNavClick}
            >
              <FaMoneyBillAlt className="nav-icon" />
              {!isCollapsed && t.nav.dividends}
            </Link>
          </li>
          <li>
            <Link 
              to="/budget" 
              className={isActive('/budget') ? 'active' : ''}
              onClick={handleNavClick}
            >
              <FaClipboardList className="nav-icon" />
              {!isCollapsed && t.nav.goals}
            </Link>
          </li>
          <li>
            <Link 
              to="/funds" 
              className={isActive('/funds') ? 'active' : ''}
              onClick={handleNavClick}
            >
              <FaWallet className="nav-icon" />
              {!isCollapsed && t.nav.funds}
            </Link>
          </li>
          <li>
            <Link 
              to="/master-data" 
              className={isActive('/master-data') ? 'active' : ''}
              onClick={handleNavClick}
            >
              <FaDatabase className="nav-icon" />
              {!isCollapsed && t.nav.masterData}
            </Link>
          </li>
          <li>
            <Link 
              to="/settings" 
              className={isActive('/settings') ? 'active' : ''}
              onClick={handleNavClick}
            >
              <FaCog className="nav-icon" />
              {!isCollapsed && t.nav.settings}
            </Link>
          </li>
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

      {showWelcomeModal && window.innerWidth <= 768 && (
        <div className="user-modal-overlay" onClick={() => setShowWelcomeModal(false)}>
          <div className="user-modal welcome-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-modal-header">
              <h3>Welcome!</h3>
              <button className="modal-close" onClick={() => setShowWelcomeModal(false)}>×</button>
            </div>
            <div className="user-modal-body">
              <div className="welcome-icon">👋</div>
              <div className="welcome-message">
                <p><strong>Hello {currentUser?.name}!</strong></p>
                <p>You are logged in as <strong>{currentUser?.role}</strong>.</p>
                <p style={{ marginTop: '15px', fontSize: '0.95rem' }}>
                  For the best experience with full features and easier management, 
                  please try to open this app on a <strong>desktop site or computer</strong>.
                </p>
              </div>
              <div className="welcome-buttons">
                <button 
                  className="welcome-btn welcome-btn-primary" 
                  onClick={requestDesktopSite}
                >
                  Switch to Desktop Mode
                </button>
                <button 
                  className="welcome-btn welcome-btn-secondary" 
                  onClick={() => setShowWelcomeModal(false)}
                >
                  Continue on Mobile
                </button>
              </div>
            </div>
          </div>
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