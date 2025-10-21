import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import { hasWritePermission } from '../components/PermissionChecker';
import membersService from '../api/membersService';
import authService from '../api/authService';
import userService from '../api/userService';
import './Members.css';

const Members = ({ members, setMembers, currentUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [shareAmount, setShareAmount] = useState('');
  const [createAccessUser, setCreateAccessUser] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { addToast } = useToast();
  const { startLoading, stopLoading, isLoading } = useLoading();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!name || !contact || !shareAmount) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    
    // If creating access user, validate email and password
    if (createAccessUser) {
      if (!userEmail || !userPassword) {
        addToast('Please provide email and password for access user', 'error');
        return;
      }
      
      // Check if passwords match
      if (userPassword !== confirmPassword) {
        addToast('Passwords do not match', 'error');
        return;
      }
      
      // Check password length
      if (userPassword.length < 6) {
        addToast('Password must be at least 6 characters long', 'error');
        return;
      }
    }
    
    startLoading('addMember');
    
    try {
      // First create the member
      const newMember = {
        name,
        contact,
        shareAmount: parseInt(shareAmount),
        joinDate: new Date().toISOString().split('T')[0],
        isActive: true
      };
      
      const createdMember = await membersService.createMember(newMember);
      
      // If requested, create access user
      if (createAccessUser) {
        try {
          // Create auth user
          const signupResponse = await authService.signup(userEmail, userPassword, {
            name: name
          });
          
          // Create user profile with member role by default
          if (signupResponse.user) {
            await userService.createUserProfile({
              id: signupResponse.user.id,
              email: userEmail,
              name: name,
              role: 'member' // Default to member role, not admin
            });
            
            // Update member with user_id
            await membersService.updateMember(createdMember.id, {
              ...newMember,
              userId: signupResponse.user.id
            });
            
            addToast(`Member ${name} and access user created successfully!`, 'success');
          }
        } catch (userError) {
          // If user creation fails, we should still add the member but show a warning
          console.error('Failed to create access user:', userError);
          addToast(`Member added but failed to create access user: ${userError.message}`, 'warning');
        }
      } else {
        addToast(`Member ${name} added successfully!`, 'success');
      }
      
      // Update state
      setMembers([...members, createdMember]);
      setName('');
      setContact('');
      setShareAmount('');
      setCreateAccessUser(false);
      setUserEmail('');
      setUserPassword('');
      setConfirmPassword('');
      setShowForm(false);
    } catch (error) {
      addToast(error.message || 'Failed to add member', 'error');
    } finally {
      stopLoading('addMember');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // If creating access user, validate email and password
    if (createAccessUser) {
      if (!userEmail || !userPassword) {
        addToast('Please provide email and password for access user', 'error');
        return;
      }
      
      // Check if passwords match
      if (userPassword !== confirmPassword) {
        addToast('Passwords do not match', 'error');
        return;
      }
      
      // Check password length
      if (userPassword.length < 6) {
        addToast('Password must be at least 6 characters long', 'error');
        return;
      }
    }
    
    if (name && contact && shareAmount) {
      startLoading('editMember');
      
      try {
        const updatedData = {
          name,
          contact,
          shareAmount: parseInt(shareAmount)
        };
        
        // If requested, create access user
        if (createAccessUser) {
          try {
            // Create auth user
            const signupResponse = await authService.signup(userEmail, userPassword, {
              name: name
            });
            
            // Create user profile with member role by default
            if (signupResponse.user) {
              await userService.createUserProfile({
                id: signupResponse.user.id,
                email: userEmail,
                name: name,
                role: 'member' // Default to member role, not admin
              });
              
              // Update member with user_id
              updatedData.userId = signupResponse.user.id;
            }
          } catch (userError) {
            // If user creation fails, we should still update the member but show a warning
            console.error('Failed to create access user:', userError);
            addToast(`Member updated but failed to create access user: ${userError.message}`, 'warning');
          }
        }
        
        await membersService.updateMember(editingMember.id, updatedData);
        
        const updatedMembers = members.map(member => 
          member.id === editingMember.id 
            ? { ...member, ...updatedData }
            : member
        );
        setMembers(updatedMembers);
        setName('');
        setContact('');
        setShareAmount('');
        setCreateAccessUser(false);
        setUserEmail('');
        setUserPassword('');
        setConfirmPassword('');
        setShowEditForm(false);
        setEditingMember(null);
        
        addToast(`Member ${name} updated successfully!`, 'success');
      } catch (error) {
        addToast(error.message || 'Failed to update member', 'error');
      } finally {
        stopLoading('editMember');
      }
    } else {
      addToast('Please fill in all required fields', 'error');
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setName(member.name);
    setContact(member.contact);
    setShareAmount(member.shareAmount.toString());
    setCreateAccessUser(false);
    setUserEmail('');
    setUserPassword('');
    setConfirmPassword('');
    setShowEditForm(true);
  };

  const handleDelete = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await membersService.deleteMember(memberId);
        const updatedMembers = members.filter(member => member.id !== memberId);
        setMembers(updatedMembers);
        addToast('Member deleted successfully!', 'success');
      } catch (error) {
        addToast(error.message || 'Failed to delete member', 'error');
      }
    }
  };

  const totalShares = members.reduce((sum, member) => sum + member.shareAmount, 0);
  const totalMembers = members.length;

  return (
    <div className="members">
      <div className="members-header">
        <div className="members-header-content">
          <h2>Members</h2>
          <p className="members-header-subtitle">Manage investment club members and their share information</p>
        </div>
        {hasWritePermission(currentUser, 'members') && (
          <button 
            className="btn btn--primary" 
            onClick={() => {
              setName('');
              setContact('');
              setShareAmount('');
              setCreateAccessUser(false);
              setUserEmail('');
              setUserPassword('');
              setConfirmPassword('');
              setShowForm(true);
            }}
          >
            Add Member
          </button>
        )}
      </div>

      <div className="members-stats">
        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon--members">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 3.13C17.8604 3.3503 18.623 3.8507 19.1676 4.55231C19.7122 5.25392 20.0078 6.11683 20.0078 7.005C20.0078 7.89317 19.7122 8.75608 19.1676 9.45769C18.623 10.1593 17.8604 10.6597 17 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-card-content">
            <h3>{totalMembers}</h3>
            <p>Total Members</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon--shares">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 7V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 16C16 16 14.5 14 12 14C9.5 14 8 16 8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-card-content">
            <h3>{totalShares}</h3>
            <p>Total Shares</p>
          </div>
        </div>
      </div>

      <div className="members-list-container">
        <div className="members-list-header">
          <h3>Member List</h3>
          <div className="members-list-actions">
            <div className="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="search-icon">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search members..." 
                className="search-input"
              />
            </div>
          </div>
        </div>
        
        <div className="members-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Share Amount</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.id}</td>
                  <td className="member-name">{member.name}</td>
                  <td>{member.contact}</td>
                  <td className="share-amount">{member.shareAmount}</td>
                  <td>{member.joinDate}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn--icon btn--secondary" 
                        title="Edit Member"
                        onClick={() => handleEdit(member)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        className="btn btn--icon btn--danger" 
                        title="Delete Member"
                        onClick={() => handleDelete(member.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {members.length === 0 && (
            <div className="no-members">
              <div className="no-members-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>No Members Found</h3>
              <p>Get started by adding your first member</p>
              <button 
                className="btn btn--primary" 
                onClick={() => setShowForm(true)}
              >
                Add Member
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Form */}
      {showForm && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h2>Add New Member</h2>
              <button 
                className="overlay-close" 
                onClick={() => setShowForm(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="member-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter member's full name"
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact">Contact Information *</label>
                  <input
                    type="text"
                    id="contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Email or phone number"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="shareAmount">Share Amount *</label>
                <input
                  type="number"
                  id="shareAmount"
                  value={shareAmount}
                  onChange={(e) => setShareAmount(e.target.value)}
                  placeholder="Number of shares"
                  min="1"
                  required
                  autoComplete="off"
                />
                <div className="form-hint">
                  Each share is worth 1000 BDT
                </div>
              </div>
              
              {/* Option to create access user */}
              <div className="form-group checkbox-container">
                <label>
                  <input
                    type="checkbox"
                    checked={createAccessUser}
                    onChange={(e) => setCreateAccessUser(e.target.checked)}
                  />
                  Create access user for this member
                </label>
              </div>
              
              {/* User credentials fields - shown when createAccessUser is checked */}
              {createAccessUser && (
                <>
                  <div className="form-group">
                    <label htmlFor="userEmail">User Email *</label>
                    <input
                      type="email"
                      id="userEmail"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Enter email for member login"
                      required={createAccessUser}
                      autoComplete="off"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="userPassword">Password *</label>
                    <input
                      type="password"
                      id="userPassword"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="Enter password for member login"
                      required={createAccessUser}
                      autoComplete="new-password"
                    />
                    <div className="form-hint">
                      Password must be at least 6 characters
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password *</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password for member login"
                      required={createAccessUser}
                      autoComplete="new-password"
                    />
                  </div>
                </>
              )}
              
              <div className="form-actions">
                {isLoading('addMember') ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <button type="submit" className="btn btn--primary">
                      Add Member
                    </button>
                    <button 
                      type="button" 
                      className="btn btn--secondary"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Form */}
      {showEditForm && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h2>Edit Member</h2>
              <button 
                className="overlay-close" 
                onClick={() => {
                  setShowEditForm(false);
                  setEditingMember(null);
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="member-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="editName">Full Name *</label>
                  <input
                    type="text"
                    id="editName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter member's full name"
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editContact">Contact Information *</label>
                  <input
                    type="text"
                    id="editContact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Email or phone number"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="editShareAmount">Share Amount *</label>
                <input
                  type="number"
                  id="editShareAmount"
                  value={shareAmount}
                  onChange={(e) => setShareAmount(e.target.value)}
                  placeholder="Number of shares"
                  min="1"
                  required
                  autoComplete="off"
                />
                <div className="form-hint">
                  Each share is worth 1000 BDT
                </div>
              </div>
              
              {/* Option to create access user */}
              <div className="form-group checkbox-container">
                <label>
                  <input
                    type="checkbox"
                    checked={createAccessUser}
                    onChange={(e) => setCreateAccessUser(e.target.checked)}
                  />
                  Create access user for this member
                </label>
              </div>
              
              {/* User credentials fields - shown when createAccessUser is checked */}
              {createAccessUser && (
                <>
                  <div className="form-group">
                    <label htmlFor="editUserEmail">User Email *</label>
                    <input
                      type="email"
                      id="editUserEmail"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Enter email for member login"
                      required={createAccessUser}
                      autoComplete="off"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="editUserPassword">Password *</label>
                    <input
                      type="password"
                      id="editUserPassword"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="Enter password for member login"
                      required={createAccessUser}
                      autoComplete="new-password"
                    />
                    <div className="form-hint">
                      Password must be at least 6 characters
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="editConfirmPassword">Confirm Password *</label>
                    <input
                      type="password"
                      id="editConfirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password for member login"
                      required={createAccessUser}
                      autoComplete="new-password"
                    />
                  </div>
                </>
              )}
              
              <div className="form-actions">
                {isLoading('editMember') ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <button type="submit" className="btn btn--primary">
                      Update Member
                    </button>
                    <button 
                      type="button" 
                      className="btn btn--secondary"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingMember(null);
                      }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;