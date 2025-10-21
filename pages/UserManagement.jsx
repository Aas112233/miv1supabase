import React, { useState } from 'react';
import './UserManagement.css';

const UserManagement = ({ members, setMembers, currentUser }) => {
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});

  // Check if current user is admin
  const isAdmin = currentUser && currentUser.role === 'admin';

  // Initialize permissions for each user if not already done
  const initializePermissions = (user) => {
    const defaultPermissions = {
      dashboard: { read: true, write: false, manage: false },
      members: { read: true, write: false, manage: false },
      payments: { read: true, write: false, manage: false },
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

  const handleManageAccess = (user) => {
    // Only admins can open the permission management modal
    if (!isAdmin) {
      return;
    }
    
    setSelectedUser(user);
    setUserPermissions(initializePermissions(user));
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
        ...prev[screen],
        [permissionType]: !prev[screen][permissionType]
      }
    }));
  };

  const handleSavePermissions = () => {
    // Only admins can save permissions
    if (!isAdmin) {
      return;
    }
    
    // Update the user's permissions in the members list
    const updatedMembers = members.map(member => 
      member.id === selectedUser.id 
        ? { ...member, permissions: userPermissions } 
        : member
    );
    setMembers(updatedMembers);
    
    // Update selected user state
    setSelectedUser({ ...selectedUser, permissions: userPermissions });
    setShowAccessModal(false);
  };

  const handleCancel = () => {
    setShowAccessModal(false);
    setSelectedUser(null);
    setUserPermissions({});
  };

  // Define available screens
  const screens = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'members', name: 'Members' },
    { id: 'payments', name: 'Payments' },
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

  return (
    <div className="user-management">
      <h1>User Management</h1>
      
      <div className="users-list">
        <div className="users-header">
          <h2>Users</h2>
        </div>
        
        <div className="users-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.id}</td>
                  <td>{member.name}</td>
                  <td>{member.contact}</td>
                  <td>
                    <span className={`role-badge ${member.role || 'member'}`}>
                      {member.role || 'member'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn--primary"
                      onClick={() => handleManageAccess(member)}
                      disabled={!isAdmin}
                    >
                      {isAdmin ? 'Manage Access' : 'View Permissions'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
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
                        checked={userPermissions[screen.id]?.[type.id] || false}
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