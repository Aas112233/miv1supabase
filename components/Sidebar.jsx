import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
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
  FaChevronLeft,
  FaChevronRight,
  FaVial
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ currentUser, onLogout }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebarCollapsed', false);

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
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
        {currentUser && (
          <div className="user-info">
            <div className="user-avatar">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!isCollapsed && (
              <div className="user-details">
                <div className="username">
                  {currentUser.name || 'User'}
                  {currentUser.role === 'admin' && <span className="admin-badge">Admin</span>}
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
              {!isCollapsed && 'Dashboard'}
            </Link>
          </li>
          <li>
            <Link 
              to="/members" 
              className={isActive('/members') ? 'active' : ''}
            >
              <FaUsers className="nav-icon" />
              {!isCollapsed && 'Members'}
            </Link>
          </li>
          <li>
            <Link 
              to="/payments" 
              className={isActive('/payments') ? 'active' : ''}
            >
              <FaMoneyBillWave className="nav-icon" />
              {!isCollapsed && 'Payments'}
            </Link>
          </li>
          <li>
            <Link 
              to="/transactions" 
              className={isActive('/transactions') ? 'active' : ''}
            >
              <FaCreditCard className="nav-icon" />
              {!isCollapsed && 'Transactions'}
            </Link>
          </li>
          <li>
            <Link 
              to="/requests" 
              className={isActive('/requests') ? 'active' : ''}
            >
              <FaFileAlt className="nav-icon" />
              {!isCollapsed && 'Transaction Requests'}
            </Link>
          </li>
          <li>
            <Link 
              to="/profile" 
              className={isActive('/profile') ? 'active' : ''}
            >
              <FaUser className="nav-icon" />
              {!isCollapsed && 'User Management'}
            </Link>
          </li>
          <li>
            <Link 
              to="/reports" 
              className={isActive('/reports') ? 'active' : ''}
            >
              <FaChartLine className="nav-icon" />
              {!isCollapsed && 'Reports'}
            </Link>
          </li>
          <li>
            <Link 
              to="/dividends" 
              className={isActive('/dividends') ? 'active' : ''}
            >
              <FaMoneyBillAlt className="nav-icon" />
              {!isCollapsed && 'Dividends'}
            </Link>
          </li>
          <li>
            <Link 
              to="/budget" 
              className={isActive('/budget') ? 'active' : ''}
            >
              <FaClipboardList className="nav-icon" />
              {!isCollapsed && 'Goals'}
            </Link>
          </li>
          <li>
            <Link 
              to="/settings" 
              className={isActive('/settings') ? 'active' : ''}
            >
              <FaCog className="nav-icon" />
              {!isCollapsed && 'Settings'}
            </Link>
          </li>
          <li>
            <Link 
              to="/test" 
              className={isActive('/test') ? 'active' : ''}
            >
              <FaVial className="nav-icon" />
              {!isCollapsed && 'Supabase Test'}
            </Link>
          </li>
          {/* Removed Google Sheets Test link */}
        </ul>
      </nav>
      {currentUser && (
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            <FaSignOutAlt className="nav-icon" />
            {!isCollapsed && 'Logout'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;