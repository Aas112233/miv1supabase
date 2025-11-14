import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import { hasWritePermission } from '../components/PermissionChecker';
import membersService from '../api/membersService';
import authService from '../api/authService';
import userService from '../api/userService';
import { getUserFriendlyError } from '../src/utils/errorHandler';
import './Members.css';

const Members = ({ members, setMembers, payments, currentUser }) => {
  const { t: translations } = useLanguage();
  const t = (key) => key.split('.').reduce((obj, k) => obj?.[k], translations) || key;
  
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberFinancials, setMemberFinancials] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [originalMemberData, setOriginalMemberData] = useState(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [shareAmount, setShareAmount] = useState('');
  const [createAccessUser, setCreateAccessUser] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignExistingUser, setAssignExistingUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [checkingLinks, setCheckingLinks] = useState(false);
  const [hasLinks, setHasLinks] = useState(false);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  
  const { addToast } = useToast();
  const { startLoading, stopLoading, isLoading } = useLoading();

  // Simulate loading on mount
  useEffect(() => {
    startLoading('membersData');
    setTimeout(() => {
      stopLoading('membersData');
    }, 2000);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!name.trim()) {
      addToast('Please enter member name', 'error');
      return;
    }
    
    if (!contact.trim()) {
      addToast('Please enter contact information', 'error');
      return;
    }
    
    if (!shareAmount || parseInt(shareAmount) < 1) {
      addToast('Please enter a valid share amount (minimum 1)', 'error');
      return;
    }
    
    // If creating access user, validate email and password
    if (createAccessUser) {
      if (!userEmail.trim()) {
        addToast('Please enter email address', 'error');
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        addToast('Please enter a valid email address', 'error');
        return;
      }
      
      if (!userPassword) {
        addToast('Please enter password', 'error');
        return;
      }
      
      // Check password length
      if (userPassword.length < 6) {
        addToast('Password must be at least 6 characters', 'error');
        return;
      }
      
      // Check if passwords match
      if (userPassword !== confirmPassword) {
        addToast('Passwords do not match', 'error');
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
      addToast(getUserFriendlyError(error), 'error');
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
    
    // If assigning existing user, validate selection
    if (assignExistingUser && !selectedUserId) {
      addToast('Please select a user to assign', 'error');
      return;
    }
    
    if (name && contact && shareAmount) {
      startLoading('editMember');
      
      try {
        const updatedData = {
          name,
          contact,
          shareAmount: parseInt(shareAmount)
        };
        
        // If assigning existing user
        if (assignExistingUser && selectedUserId) {
          updatedData.userId = selectedUserId;
        }
        
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
        setAssignExistingUser(false);
        setSelectedUserId('');
        setUserEmail('');
        setUserPassword('');
        setConfirmPassword('');
        setShowEditForm(false);
        setEditingMember(null);
        
        addToast(`Member ${name} updated successfully!`, 'success');
      } catch (error) {
        addToast(getUserFriendlyError(error), 'error');
      } finally {
        stopLoading('editMember');
      }
    } else {
      addToast('Please fill in all required fields', 'error');
    }
  };

  const handleEdit = async (member) => {
    setEditingMember(member);
    setOriginalMemberData({
      name: member.name,
      contact: member.contact,
      shareAmount: member.shareAmount.toString()
    });
    setName(member.name);
    setContact(member.contact);
    setShareAmount(member.shareAmount.toString());
    
    // Check if member has assigned user
    let hasValidUser = false;
    if (member.userId) {
      const userProfile = await userService.getUserProfile(member.userId);
      if (userProfile) {
        setUserEmail(userProfile.email);
        hasValidUser = true;
      } else {
        // User was deleted, clear the userId from member
        setUserEmail('');
        // Update member to remove invalid userId
        await membersService.updateMember(member.id, { userId: null });
        // Update local state
        const updatedMembers = members.map(m => 
          m.id === member.id ? { ...m, userId: null } : m
        );
        setMembers(updatedMembers);
        setEditingMember({ ...member, userId: null });
      }
    }
    
    // Fetch available users (not assigned to any member)
    const allUsers = await userService.getAllUsers();
    const assignedUserIds = members.filter(m => m.userId).map(m => m.userId);
    const unassignedUsers = allUsers.filter(u => !assignedUserIds.includes(u.id));
    setAvailableUsers(unassignedUsers);
    
    setCreateAccessUser(false);
    setAssignExistingUser(false);
    setSelectedUserId('');
    setUserPassword('');
    setConfirmPassword('');
    setShowEditForm(true);
  };

  const handleDelete = async (memberId) => {
    const member = members.find(m => m.id === memberId);
    setMemberToDelete(member);
    setShowDeleteModal(true);
    setCheckingLinks(true);
    setHasLinks(false);
    
    // Simulate checking with animation
    setTimeout(() => {
      const hasTransactions = payments.some(payment => 
        payment.memberId == memberId || payment.member_id == memberId
      );
      setHasLinks(hasTransactions);
      setCheckingLinks(false);
    }, 1500);
  };

  const confirmDelete = async () => {
    if (hasLinks) {
      addToast('Cannot delete member with existing transactions', 'error');
      setShowDeleteModal(false);
      return;
    }

    try {
      // If member has a userId, delete the user account first
      if (memberToDelete?.userId) {
        try {
          await authService.deleteUser(memberToDelete.userId);
          await userService.deleteUserProfile(memberToDelete.userId);
        } catch (userError) {
          console.error('Failed to delete user account:', userError);
        }
      }
      
      await membersService.deleteMember(memberToDelete.id);
      const updatedMembers = members.filter(member => member.id !== memberToDelete.id);
      setMembers(updatedMembers);
      addToast('Member deleted successfully!', 'success');
      setShowDeleteModal(false);
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    }
  };

  const totalShares = members.reduce((sum, member) => sum + member.shareAmount, 0);
  const totalMembers = members.length;

  const getMemberBalance = (memberId) => {
    return payments
      .filter(p => p.memberId == memberId || p.member_id == memberId)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'balance') {
      aVal = getMemberBalance(a.id);
      bVal = getMemberBalance(b.id);
    }

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleViewDetails = async (member) => {
    setSelectedMember(member);
    startLoading('memberDetails');
    
    try {
      const memberPayments = payments.filter(p => p.memberId == member.id || p.member_id == member.id);
      const totalPayments = memberPayments.reduce((sum, p) => sum + p.amount, 0);
      
      setMemberFinancials({
        payments: memberPayments,
        totalPayments,
        investments: 0,
        profits: 0,
        losses: 0,
        expenses: 0
      });
      
      setShowDetailsModal(true);
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('memberDetails');
    }
  };

  if (isLoading('membersData')) {
    return (
      <div className="members">
        <div className="members-header">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-button"></div>
        </div>
        <div className="members-stats">
          <div className="skeleton skeleton-stat-card"></div>
          <div className="skeleton skeleton-stat-card"></div>
        </div>
        <div className="members-list-container">
          <div className="members-list-header">
            <div className="skeleton skeleton-subtitle"></div>
            <div className="skeleton skeleton-search"></div>
          </div>
          <div className="members-list">
            <div className="skeleton skeleton-table-header"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton skeleton-table-row"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="members">
      <div className="members-header">
        <div className="members-header-content">
          <h2>{t('members.title')}</h2>
          <p className="members-header-subtitle">{t('members.subtitle')}</p>
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
            {t('members.addMember')}
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
            <p>{t('members.title')}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon--shares">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.21 15.89C20.5738 17.3945 19.5788 18.7202 18.3119 19.7513C17.0449 20.7824 15.5447 21.4874 13.9424 21.8048C12.3401 22.1221 10.6844 22.0421 9.12012 21.5718C7.55585 21.1014 6.13305 20.2551 4.96893 19.1067C3.80481 17.9582 2.93553 16.5428 2.43746 14.9839C1.93938 13.4251 1.83045 11.7705 2.11954 10.1646C2.40863 8.55878 3.08525 7.04946 4.09254 5.76477C5.09983 4.48008 6.40729 3.46284 7.89999 2.79999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 12C22 10.6868 21.7413 9.38642 21.2388 8.17317C20.7362 6.95991 19.9997 5.85752 19.0711 4.92893C18.1425 4.00035 17.0401 3.26375 15.8268 2.7612C14.6136 2.25866 13.3132 2 12 2V12H22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-card-content">
            <h3>{totalShares}</h3>
            <p>{t('members.totalShares')}</p>
          </div>
        </div>
      </div>

      <div className="members-list-container">
        <div className="members-list-header">
          <h3>{t('members.memberList')}</h3>
          <div className="members-list-actions">
            <div className="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="search-icon">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input 
                type="text" 
                placeholder={t('common.search')} 
                className="search-input"
              />
            </div>
          </div>
        </div>
        
        <div className="members-list">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                  ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  {t('members.name')} {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('contact')} style={{ cursor: 'pointer' }}>
                  {t('members.contact')} {sortField === 'contact' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('shareAmount')} style={{ cursor: 'pointer' }}>
                  {t('members.shareAmount')} {sortField === 'shareAmount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('balance')} style={{ cursor: 'pointer' }}>
                  {t('members.totalBalance')} {sortField === 'balance' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('joinDate')} style={{ cursor: 'pointer' }}>
                  {t('members.joinDate')} {sortField === 'joinDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((member) => (
                <tr key={member.id}>
                  <td>{member.id}</td>
                  <td className="member-name">{member.name}</td>
                  <td>{member.contact}</td>
                  <td className="share-amount">{member.shareAmount}</td>
                  <td className="balance-amount">৳{getMemberBalance(member.id).toFixed(2)}</td>
                  <td>{member.joinDate}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn--icon btn--info" 
                        title="View Financial Details"
                        onClick={() => handleViewDetails(member)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="12" cy="8" r="1" fill="currentColor"/>
                        </svg>
                      </button>
                      {hasWritePermission(currentUser, 'members') && (
                        <>
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
                        </>
                      )}
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
              <h3>{t('members.noMembers')}</h3>
              <p>{t('members.getMemberStarted')}</p>
              <button 
                className="btn btn--primary" 
                onClick={() => setShowForm(true)}
              >
                {t('members.addMember')}
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
              <h2>{t('members.addMember')}</h2>
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
              <div className="form-section">
                <h3 className="form-section-title">{t('members.memberInfo')}</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">{t('members.fullName')} *</label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter member's full name"
                      autoComplete="off"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact">{t('members.contactInfo')} *</label>
                    <input
                      type="text"
                      id="contact"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="Email or phone number"
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="shareAmount">{t('members.shareAmount')} *</label>
                  <input
                    type="number"
                    id="shareAmount"
                    value={shareAmount}
                    onChange={(e) => setShareAmount(e.target.value)}
                    placeholder="Number of shares"
                    min="1"
                    autoComplete="off"
                  />
                  <div className="form-hint">
                    {t('members.shareHint')}
                  </div>
                </div>
              </div>
              
              <div className="form-divider"></div>
              
              <div className="form-section">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={createAccessUser}
                      onChange={(e) => setCreateAccessUser(e.target.checked)}
                    />
                    <span>{t('members.createLoginAccess')}</span>
                  </label>
                  <div className="form-hint">{t('members.allowAccess')}</div>
                </div>
                
                {createAccessUser && (
                  <div className="user-credentials-section">
                    <h3 className="form-section-title">{t('members.loginCredentials')}</h3>
                    <div className="form-group">
                      <label htmlFor="userEmail">{t('members.emailAddress')} *</label>
                      <input
                        type="email"
                        id="userEmail"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="member@example.com"
                        autoComplete="off"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="userPassword">{t('auth.password')} *</label>
                        <input
                          type="password"
                          id="userPassword"
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          placeholder={t('members.passwordHint')}
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="confirmPassword">{t('members.confirmPassword')} *</label>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="form-actions">
                {isLoading('addMember') ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <button 
                      type="submit" 
                      className="btn btn--primary"
                      disabled={!name.trim() || !contact.trim() || !shareAmount || parseInt(shareAmount) < 1}
                      title={!name.trim() || !contact.trim() || !shareAmount || parseInt(shareAmount) < 1 ? 'Please fill in all required fields' : ''}
                    >
                      {t('members.addMember')}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn--secondary"
                      onClick={() => setShowForm(false)}
                    >
                      {t('common.cancel')}
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
              <h2>{t('members.editMember')}</h2>
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
              
              {/* Show assigned user or option to create/assign access user */}
              {editingMember?.userId && userEmail ? (
                <div className="form-group">
                  <label>Assigned User Account</label>
                  <div style={{ padding: '10px', backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 4.17157 16.1716C3.42143 16.9217 3 17.9391 3 19V21" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ color: '#0369a1', fontWeight: '500' }}>{userEmail}</span>
                  </div>
                  <div className="form-hint">This member has an assigned user account. Manage it from User Management screen.</div>
                </div>
              ) : (
                <>
                  <div className="form-group checkbox-container">
                    <label>
                      <input
                        type="checkbox"
                        checked={assignExistingUser}
                        onChange={(e) => {
                          setAssignExistingUser(e.target.checked);
                          if (e.target.checked) setCreateAccessUser(false);
                        }}
                      />
                      Assign existing user
                    </label>
                  </div>
                  
                  {assignExistingUser && (
                    <div className="form-group">
                      <label htmlFor="selectUser">Select User *</label>
                      <select
                        id="selectUser"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        required={assignExistingUser}
                      >
                        <option value="">-- Select a user --</option>
                        {availableUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                      {availableUsers.length === 0 && (
                        <div className="form-hint" style={{ color: '#f59e0b' }}>
                          No unassigned users available. Create a new user instead.
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="form-group checkbox-container">
                    <label>
                      <input
                        type="checkbox"
                        checked={createAccessUser}
                        onChange={(e) => {
                          setCreateAccessUser(e.target.checked);
                          if (e.target.checked) setAssignExistingUser(false);
                        }}
                      />
                      Create new access user
                    </label>
                  </div>
                </>
              )}
              
              {/* User credentials fields - only show if no user is assigned */}
              {!editingMember?.userId && createAccessUser && (
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
                    <button 
                      type="submit" 
                      className="btn btn--primary"
                      disabled={
                        name === originalMemberData?.name &&
                        contact === originalMemberData?.contact &&
                        shareAmount === originalMemberData?.shareAmount &&
                        !createAccessUser &&
                        !assignExistingUser
                      }
                      title={
                        name === originalMemberData?.name &&
                        contact === originalMemberData?.contact &&
                        shareAmount === originalMemberData?.shareAmount &&
                        !createAccessUser &&
                        !assignExistingUser
                          ? 'Change data to update member'
                          : ''
                      }
                    >
                      {t('common.update')}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn--secondary"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingMember(null);
                        setOriginalMemberData(null);
                      }}
                    >
                      {t('common.cancel')}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && memberToDelete && (
        <div className="overlay">
          <div className="overlay-content overlay-content--small">
            <div className="overlay-header">
              <h2>Delete Member</h2>
              <button className="overlay-close" onClick={() => setShowDeleteModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="delete-modal-content">
              <div className="delete-member-info">
                <div className="delete-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>{memberToDelete.name}</h3>
                <p>Are you sure you want to delete this member?</p>
              </div>

              <div className="delete-check-section">
                <div className="check-item">
                  <div className={`check-icon ${checkingLinks ? 'checking' : hasLinks ? 'error' : 'success'}`}>
                    {checkingLinks ? (
                      <div className="spinner"></div>
                    ) : hasLinks ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="check-label">
                    <span>Checking data connections...</span>
                    {!checkingLinks && (
                      <span className={hasLinks ? 'check-result error' : 'check-result success'}>
                        {hasLinks ? 'Has existing transactions' : 'No data connections found'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {hasLinks && !checkingLinks && (
                <div className="delete-warning">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Cannot delete member with existing transactions. Please remove all transactions first.</span>
                </div>
              )}

              <div className="delete-actions">
                <button 
                  className="btn btn--secondary" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn--danger" 
                  onClick={confirmDelete}
                  disabled={checkingLinks || hasLinks}
                >
                  {checkingLinks ? 'Checking...' : 'Delete Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Financial Details Modal */}
      {showDetailsModal && selectedMember && (
        <div className="overlay">
          <div className="overlay-content overlay-content--large">
            <div className="overlay-header">
              <h2>{selectedMember.name} - Financial Details</h2>
              <button className="overlay-close" onClick={() => setShowDetailsModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            {isLoading('memberDetails') ? (
              <LoadingSpinner />
            ) : memberFinancials && (
              <div className="member-details">
                <div className="details-summary">
                  <div className="summary-card">
                    <div className="summary-label">Total Payments</div>
                    <div className="summary-value summary-value--success">৳{memberFinancials.totalPayments.toFixed(2)}</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-label">Investments</div>
                    <div className="summary-value">৳{memberFinancials.investments.toFixed(2)}</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-label">Profits</div>
                    <div className="summary-value summary-value--success">৳{memberFinancials.profits.toFixed(2)}</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-label">Losses</div>
                    <div className="summary-value summary-value--danger">৳{memberFinancials.losses.toFixed(2)}</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-label">Expenses</div>
                    <div className="summary-value summary-value--danger">৳{memberFinancials.expenses.toFixed(2)}</div>
                  </div>
                </div>

                <div className="details-section">
                  <h3>Payment History</h3>
                  {memberFinancials.payments.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Month</th>
                          <th>Amount</th>
                          <th>Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberFinancials.payments.map((payment, idx) => (
                          <tr key={idx}>
                            <td>{payment.payment_date || payment.paymentDate}</td>
                            <td>{payment.description || payment.paymentMonth}</td>
                            <td>৳{payment.amount.toFixed(2)}</td>
                            <td>{payment.payment_method || payment.paymentMethod}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-data">No payment records found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;