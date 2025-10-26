import React, { useState, useEffect } from 'react';
import userService from '../api/userService';
import authService from '../api/authService';
import permissionsService from '../api/permissionsService';
import { useToast } from '../contexts/ToastContext';
import { getUserFriendlyError } from '../src/utils/errorHandler';
import './UserManagement.css';

const UserManagement = ({ currentUser }) => {
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [userRole, setUserRole] = useState('');
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'member' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { addToast } = useToast();

  const isAdmin = currentUser && currentUser.role === 'admin';

  // Fetch authorized users from user_profiles table
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const users = await userService.getAllUsers();
        setAuthorizedUsers(users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        addToast(getUserFriendlyError(error), 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Initialize permissions for each user if not already done
  const initializePermissions = (user) => {
    const defaultPermissions = {
      dashboard: { read: true, write: false, manage: false },
      members: { read: true, write: false, manage: false },
      payments: { read: true, write: false, manage: false },
      expenses: { read: true, write: false, manage: false },
      projects: { read: true, write: false, manage: false },
      transactions: { read: true, write: false, manage: false },
      requests: { read: true, write: false, manage: false },
      reports: { read: true, write: false, manage: false },
      dividends: { read: true, write: false, manage: false },
      budget: { read: true, write: false, manage: false },
      settings: { read: true, write: false, manage: false },
      profile: { read: true, write: false, manage: false }
    };

    if (!user.permissions) {
      return defaultPermissions;
    }
    return { ...defaultPermissions, ...user.permissions };
  };

  const handleManageAccess = async (user) => {
    if (!isAdmin) return;
    
    setSelectedUser(user);
    setUserRole(user.role || 'member');
    
    // Fetch permissions from database
    const perms = await permissionsService.getUserPermissions(user.id);
    setUserPermissions(Object.keys(perms).length > 0 ? perms : initializePermissions(user));
    setShowAccessModal(true);
  };

  const handlePermissionChange = (screen, permissionType) => {
    // Only admins can change permissions
    if (!isAdmin) {
      return;
    }
    
    setUserPermissions(prev => ({
      ...prev,
      [screen]: {
        ...(prev[screen] || { read: false, write: false, manage: false }),
        [permissionType]: !(prev[screen]?.[permissionType] ?? false)
      }
    }));
  };

  const handleRoleChange = (role) => {
    // Only admins can change roles
    if (!isAdmin) {
      return;
    }
    
    setUserRole(role);
  };

  const handleSavePermissions = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      // Save role
      await userService.updateUserRole(selectedUser.id, userRole);
      
      // Save permissions to database
      await permissionsService.saveUserPermissions(selectedUser.id, userPermissions);
      
      const updatedUsers = authorizedUsers.map(user => 
        user.id === selectedUser.id 
          ? { ...user, role: userRole } 
          : user
      );
      setAuthorizedUsers(updatedUsers);
      setShowAccessModal(false);
      
      addToast('User permissions updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving permissions:', error);
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowAccessModal(false);
    setSelectedUser(null);
    setUserPermissions({});
    setUserRole('');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (formData.password.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.signup(formData.email, formData.password, { name: formData.name });
      
      if (response.user) {
        await userService.createUserProfile({
          id: response.user.id,
          email: formData.email,
          name: formData.name,
          role: formData.role
        });

        const users = await userService.getAllUsers();
        setAuthorizedUsers(users || []);
        setShowCreateModal(false);
        setFormData({ name: '', email: '', password: '', role: 'member' });
        addToast('User created successfully!', 'success');
      }
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeCredentials = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      setLoading(true);
      // Note: Supabase requires admin API to change other users' passwords
      // For now, we'll show a message that user needs to reset via email
      await authService.resetPassword(selectedUser.email);
      setShowCredentialsModal(false);
      setNewPassword('');
      setConfirmPassword('');
      addToast('Password reset email sent to user', 'success');
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Define available screens
  const screens = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'members', name: 'Members' },
    { id: 'payments', name: 'Payments' },
    { id: 'expenses', name: 'Expenses' },
    { id: 'projects', name: 'Projects' },
    { id: 'transactions', name: 'Transactions' },
    { id: 'requests', name: 'Transaction Requests' },
    { id: 'reports', name: 'Reports' },
    { id: 'dividends', name: 'Dividends' },
    { id: 'budget', name: 'Budget' },
    { id: 'settings', name: 'Settings' },
    { id: 'profile', name: 'User Management' }
  ];

  // Define permission types
  const permissionTypes = [
    { id: 'read', name: 'Read' },
    { id: 'write', name: 'Write' },
    { id: 'manage', name: 'Manage' }
  ];

  // Define available roles
  const roles = [
    { id: 'member', name: 'Member' },
    { id: 'admin', name: 'Admin' }
  ];

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h1>User Management</h1>
        <p className="subtitle">Manage user roles and permissions</p>
      </div>
      
      <div className="users-list">
        <div className="users-header">
          <h2>Authorized Users ({authorizedUsers.length})</h2>
          {isAdmin && (
            <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
              + Create User
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="loading-container">
            <p>Loading users...</p>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {authorizedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-badge--${user.role || 'member'}`}>
                        {(user.role || 'member').toUpperCase()}
                      </span>
                    </td>
                    <td>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn--secondary btn--sm"
                          onClick={() => handleManageAccess(user)}
                          disabled={!isAdmin}
                        >
                          Manage Role
                        </button>
                        {isAdmin && (
                          <button 
                            className="btn btn--secondary btn--sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowCredentialsModal(true);
                            }}
                          >
                            Change Password
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {authorizedUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="no-data">
                      No authorized users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Create User Modal */}
      {showCreateModal && isAdmin && (
        <div className="overlay">
          <div className="overlay-content" style={{ maxWidth: '500px' }}>
            <div className="overlay-header">
              <h2>Create New User</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateUser} style={{ padding: '25px' }}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  className="role-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn--secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={loading}>Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Credentials Modal */}
      {showCredentialsModal && selectedUser && isAdmin && (
        <div className="overlay">
          <div className="overlay-content" style={{ maxWidth: '500px' }}>
            <div className="overlay-header">
              <h2>Change Password for {selectedUser.name}</h2>
              <button className="close-btn" onClick={() => setShowCredentialsModal(false)}>×</button>
            </div>
            <form onSubmit={handleChangeCredentials} style={{ padding: '25px' }}>
              <p style={{ marginBottom: '20px', color: '#6c757d' }}>A password reset link will be sent to {selectedUser.email}</p>
              <div className="form-actions">
                <button type="button" className="btn btn--secondary" onClick={() => setShowCredentialsModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={loading}>Send Reset Link</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Management Modal - Only shown to admins */}
      {showAccessModal && selectedUser && isAdmin && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h2>Manage Access for {selectedUser.name}</h2>
              <button 
                className="close-btn" 
                onClick={handleCancel}
              >
                ×
              </button>
            </div>
            
            {/* Role Selection */}
            <div className="form-group">
              <label htmlFor="userRole">User Role:</label>
              <select
                id="userRole"
                value={userRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="role-select"
              >
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="permissions-grid">
              <div className="permissions-header">
                <div className="screen-name">Screen</div>
                {permissionTypes.map(type => (
                  <div key={type.id} className="permission-type">
                    {type.name}
                  </div>
                ))}
              </div>
              
              {screens.map(screen => (
                <div key={screen.id} className="permissions-row">
                  <div className="screen-name">{screen.name}</div>
                  {permissionTypes.map(type => (
                    <div key={type.id} className="permission-toggle">
                      <input
                        type="checkbox"
                        id={`${screen.id}-${type.id}`}
                        checked={userPermissions[screen.id]?.[type.id] ?? false}
                        onChange={() => handlePermissionChange(screen.id, type.id)}
                        disabled={!isAdmin}
                      />
                      <label htmlFor={`${screen.id}-${type.id}`} className="toggle-label"></label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            <div className="form-actions">
              <button 
                className="btn btn--secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button 
                className="btn btn--primary"
                onClick={handleSavePermissions}
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;