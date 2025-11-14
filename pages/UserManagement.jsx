import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import userService from '../api/userService';
import authService from '../api/authService';
import permissionsService from '../api/permissionsService';
import membersService from '../api/membersService';
import sessionService from '../api/sessionService';
import { useToast } from '../contexts/ToastContext';
import { getUserFriendlyError } from '../src/utils/errorHandler';
import './UserManagement.css';

const UserManagement = ({ currentUser }) => {
  const { t: translations } = useLanguage();
  const t = (key) => key.split('.').reduce((obj, k) => obj?.[k], translations) || key;
  
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSessions, setUserSessions] = useState([]);
  const [userPermissions, setUserPermissions] = useState({});
  const [userRole, setUserRole] = useState('');
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'member' });
  const [editFormData, setEditFormData] = useState({ name: '', email: '', role: 'member', memberId: null });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { addToast } = useToast();

  const hasManagePermission = currentUser?.permissions?.profile?.manage || currentUser?.role === 'admin';

  const isAdmin = currentUser && currentUser.role === 'admin';

  // Fetch authorized users and members
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setInitialLoading(true);
        const [users, membersList] = await Promise.all([
          userService.getAllUsers(),
          membersService.getAllMembers()
        ]);
        setAuthorizedUsers(users || []);
        setMembers(membersList || []);
        setTimeout(() => {
          setInitialLoading(false);
        }, 2000);
      } catch (error) {
        console.error('Error fetching data:', error);
        addToast(getUserFriendlyError(error), 'error');
        setInitialLoading(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
      master_data: { read: true, write: false, manage: false },
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

  const handleDeviceManagement = async (user) => {
    if (!hasManagePermission) return;
    
    setSelectedUser(user);
    setLoading(true);
    try {
      const sessions = await sessionService.getAllSessions(user.id);
      setUserSessions(sessions);
      setShowDeviceModal(true);
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId, blockDevice = false) => {
    if (!hasManagePermission) return;
    
    const message = blockDevice 
      ? 'Terminate and block this device? User will not be able to login from this device again.'
      : 'Terminate this session? User can login again from this device.';
    
    if (window.confirm(message)) {
      try {
        setLoading(true);
        await sessionService.terminateSession(sessionId, currentUser.id, blockDevice);
        const sessions = await sessionService.getAllSessions(selectedUser.id);
        setUserSessions(sessions);
        addToast(blockDevice ? 'Device blocked successfully' : 'Session terminated successfully', 'success');
      } catch (error) {
        addToast(getUserFriendlyError(error), 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUnblockDevice = async (session) => {
    if (!hasManagePermission) return;
    
    if (window.confirm('Restore access for this device?')) {
      try {
        setLoading(true);
        await sessionService.unblockDevice(session.user_id, session.ip_address, session.user_agent);
        const sessions = await sessionService.getAllSessions(selectedUser.id);
        setUserSessions(sessions);
        addToast('Device access restored', 'success');
      } catch (error) {
        addToast(getUserFriendlyError(error), 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBlockUser = async (user) => {
    if (!hasManagePermission) return;
    
    const reason = prompt('Enter reason for blocking user access:', 'Access terminated by administrator');
    if (!reason) return;
    
    try {
      setLoading(true);
      await sessionService.blockUserAccess(user.id, currentUser.id, reason);
      const users = await userService.getAllUsers();
      setAuthorizedUsers(users || []);
      addToast('User access blocked successfully', 'success');
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (userId) => {
    if (!hasManagePermission) return;
    
    if (window.confirm('Are you sure you want to restore access for this user?')) {
      try {
        setLoading(true);
        await sessionService.unblockUserAccess(userId);
        const sessions = await sessionService.getAllSessions(userId);
        setUserSessions(sessions);
        const users = await userService.getAllUsers();
        setAuthorizedUsers(users || []);
        addToast('User access restored successfully', 'success');
      } catch (error) {
        addToast(getUserFriendlyError(error), 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditUser = async (user) => {
    if (!hasManagePermission) {
      addToast('You do not have permission to edit users', 'error');
      return;
    }
    setSelectedUser(user);
    
    // Find if user is already assigned to a member
    const assignedMember = await userService.getMemberByUserId(user.id);
    
    setEditFormData({ 
      name: user.name, 
      email: user.email, 
      role: user.role || 'member',
      memberId: assignedMember ? assignedMember.id : null
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!hasManagePermission) return;

    try {
      setLoading(true);
      
      // Update user profile
      await userService.updateUserProfile(selectedUser.id, {
        name: editFormData.name,
        role: editFormData.role
      });

      // Assign user to member if selected
      if (editFormData.memberId) {
        await userService.assignUserToMember(selectedUser.id, editFormData.memberId);
      }

      const users = await userService.getAllUsers();
      setAuthorizedUsers(users || []);
      setShowEditModal(false);
      setEditFormData({ name: '', email: '', role: 'member', memberId: null });
      addToast('User updated successfully!', 'success');
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!hasManagePermission) {
      addToast('You do not have permission to delete users', 'error');
      return;
    }

    if (user.id === currentUser.id) {
      addToast('You cannot delete your own account', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      try {
        setLoading(true);
        await userService.deleteUser(user.id);
        const users = await userService.getAllUsers();
        setAuthorizedUsers(users || []);
        addToast('User deleted successfully!', 'success');
      } catch (error) {
        addToast(getUserFriendlyError(error), 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!hasManagePermission) return;

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
    { id: 'master_data', name: 'Master Data' },
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
        <h1>{t('userManagement.title')}</h1>
        <p className="subtitle">{t('userManagement.subtitle')}</p>
      </div>
      
      <div className="users-list">
        <div className="users-header">
          <h2>{t('userManagement.authorizedUsers')} ({authorizedUsers.length})</h2>
          {hasManagePermission && (
            <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
              + {t('userManagement.createUser')}
            </button>
          )}
        </div>
        
        {initialLoading ? (
          <div className="users-table-container">
            <div className="skeleton skeleton-table-header"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton skeleton-table-row"></div>
            ))}
          </div>
        ) : (
          <div className="users-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('userManagement.name')}</th>
                  <th>{t('userManagement.email')}</th>
                  <th>{t('userManagement.role')}</th>
                  <th>{t('userManagement.lastLogin')}</th>
                  <th>{t('common.actions')}</th>
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
                    <td>{user.last_login ? new Date(user.last_login).toLocaleString() : t('userManagement.never')}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn--secondary btn--sm"
                          onClick={() => handleManageAccess(user)}
                          disabled={!isAdmin}
                        >
                          {t('userManagement.manageAccess')}
                        </button>
                        {hasManagePermission && (
                          <>
                            <button 
                              className="btn btn--secondary btn--sm"
                              onClick={() => handleEditUser(user)}
                            >
                              {t('common.edit')}
                            </button>
                            <button 
                              className="btn btn--info btn--sm"
                              onClick={() => handleDeviceManagement(user)}
                            >
                              Devices
                            </button>
                            <button 
                              className="btn btn--secondary btn--sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowCredentialsModal(true);
                              }}
                            >
                              {t('userManagement.changePassword')}
                            </button>
                            <button 
                              className="btn btn--danger btn--sm"
                              onClick={() => handleDeleteUser(user)}
                              disabled={user.id === currentUser.id}
                            >
                              {t('common.delete')}
                            </button>
                          </>
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
      
      {/* Edit User Modal */}
      {showEditModal && selectedUser && hasManagePermission && (
        <div className="overlay">
          <div className="overlay-content" style={{ maxWidth: '500px' }}>
            <div className="overlay-header">
              <h2>{t('userManagement.editUser')}</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateUser} style={{ padding: '25px' }}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
                <small style={{ color: '#6c757d' }}>Email cannot be changed</small>
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  className="role-select"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Assign to Member</label>
                <select
                  className="role-select"
                  value={editFormData.memberId || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, memberId: e.target.value ? parseInt(e.target.value) : null })}
                >
                  <option value="">-- No Member Assigned --</option>
                  {members
                    .filter(member => !member.userId || member.userId === selectedUser.id)
                    .map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} {member.userId === selectedUser.id ? '(Currently Assigned)' : ''}
                      </option>
                    ))}
                </select>
                <small style={{ color: '#6c757d' }}>Link this user account to a member record</small>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn--secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={loading}>Update User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && hasManagePermission && (
        <div className="overlay">
          <div className="overlay-content" style={{ maxWidth: '500px' }}>
            <div className="overlay-header">
              <h2>{t('userManagement.createUser')}</h2>
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
      {showCredentialsModal && selectedUser && hasManagePermission && (
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

      {/* Device Management Modal */}
      {showDeviceModal && selectedUser && hasManagePermission && (
        <div className="overlay">
          <div className="overlay-content" style={{ maxWidth: '900px' }}>
            <div className="overlay-header">
              <h2>Device Management - {selectedUser.name}</h2>
              <button className="close-btn" onClick={() => setShowDeviceModal(false)}>×</button>
            </div>
            <div style={{ padding: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ margin: 0, color: '#6c757d' }}>All devices and sessions for {selectedUser.email}</p>
                {selectedUser.access_blocked ? (
                  <button 
                    className="btn btn--success btn--sm"
                    onClick={() => handleUnblockUser(selectedUser.id)}
                    disabled={loading}
                  >
                    Restore Access
                  </button>
                ) : (
                  <button 
                    className="btn btn--danger btn--sm"
                    onClick={() => handleBlockUser(selectedUser)}
                    disabled={loading}
                  >
                    Block User Access
                  </button>
                )}
              </div>
              
              {selectedUser.access_blocked && (
                <div style={{ padding: '12px', backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '4px', marginBottom: '20px' }}>
                  <p style={{ margin: 0, color: '#991b1b', fontWeight: '500' }}>⚠️ User access is currently blocked</p>
                  {selectedUser.block_reason && <p style={{ margin: '5px 0 0 0', color: '#991b1b', fontSize: '14px' }}>Reason: {selectedUser.block_reason}</p>}
                </div>
              )}
              
              {userSessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                  <p>No sessions found</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Device</th>
                      <th>Browser</th>
                      <th>OS</th>
                      <th>IP Address</th>
                      <th>Last Activity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSessions.map((session) => (
                      <tr key={session.id} style={!session.is_active ? { opacity: 0.6, backgroundColor: '#f9fafb' } : {}}>
                        <td>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '12px',
                            backgroundColor: session.is_active ? '#d1fae5' : '#fee2e2',
                            color: session.is_active ? '#065f46' : '#991b1b'
                          }}>
                            {session.is_active ? 'Active' : 'Terminated'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                              <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <span>{session.device_name || session.device_type}</span>
                          </div>
                        </td>
                        <td>{session.browser}</td>
                        <td>{session.os}</td>
                        <td>{session.ip_address}</td>
                        <td>{new Date(session.last_activity).toLocaleString()}</td>
                        <td>
                          {session.device_blocked ? (
                            <button 
                              className="btn btn--success btn--sm"
                              onClick={() => handleUnblockDevice(session)}
                              disabled={loading}
                            >
                              Unblock Device
                            </button>
                          ) : session.is_active ? (
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button 
                                className="btn btn--secondary btn--sm"
                                onClick={() => handleTerminateSession(session.id, false)}
                                disabled={loading}
                                title="Terminate session only"
                              >
                                Terminate
                              </button>
                              <button 
                                className="btn btn--danger btn--sm"
                                onClick={() => handleTerminateSession(session.id, true)}
                                disabled={loading}
                                title="Terminate and block device"
                              >
                                Block Device
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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