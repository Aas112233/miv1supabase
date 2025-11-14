import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import { hasWritePermission, hasManagePermission } from '../components/PermissionChecker';
import transactionRequestsService from '../api/transactionRequestsService';
import './TransactionRequests.css';

const TransactionRequests = ({ requests, setRequests, payments, setPayments, members, currentUser }) => {
  const { t: translations } = useLanguage();
  const t = (key) => key.split('.').reduce((obj, k) => obj?.[k], translations) || key;
  
  const [showForm, setShowForm] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [isSharePayment, setIsSharePayment] = useState(true);
  const [paymentMonth, setPaymentMonth] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashierName, setCashierName] = useState('');
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cashierNames, setCashierNames] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const autocompleteRef = useRef(null);
  
  const { addToast } = useToast();
  const { startLoading, stopLoading, isLoading } = useLoading();

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      const masterDataService = (await import('../api/masterDataService')).default;
      const data = await masterDataService.getAllMasterData();
      const activeCashiers = data.filter(item => item.category === 'cashier_name' && item.is_active)
        .sort((a, b) => a.display_order - b.display_order);
      const activeMethods = data.filter(item => item.category === 'payment_method' && item.is_active)
        .sort((a, b) => a.display_order - b.display_order);
      setCashierNames(activeCashiers);
      setPaymentMethods(activeMethods);
    } catch (error) {
      console.error('Failed to load master data:', error);
    }
  };

  const handleMemberChange = (e) => {
    const selectedMemberId = e.target.value;
    setMemberId(selectedMemberId);
    
    if (isSharePayment && selectedMemberId) {
      const member = members.find(m => m.id == selectedMemberId);
      if (member) {
        setAmount(member.shareAmount * 1000);
      }
    }
  };
  
  const handleSharePaymentToggle = (e) => {
    const checked = e.target.checked;
    setIsSharePayment(checked);
    
    if (checked && memberId) {
      const member = members.find(m => m.id == memberId);
      if (member) {
        setAmount(member.shareAmount * 1000);
      }
    } else if (!checked) {
      setAmount('');
    }
  };

  // Generate month/year options from Jan 2025 to Dec 2028
  const generateMonthYearOptions = () => {
    const options = [];
    const startYear = 2025;
    const endYear = 2028;
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    for (let year = startYear; year <= endYear; year++) {
      months.forEach((month) => {
        options.push(`${month} ${year}`);
      });
    }
    
    return options;
  };

  // Simulate loading requests
  useEffect(() => {
    startLoading('fetchRequests');
    
    // Simulate API call delay
    setTimeout(() => {
      setFilteredRequests(requests);
      stopLoading('fetchRequests');
    }, 700);
  }, [requests]);

  // Filter requests based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredRequests(requests);
    } else {
      const filtered = requests.filter(request =>
        (request.memberName && request.memberName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (request.description && request.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (request.payment_method && request.payment_method.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (request.cashier_name && request.cashier_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRequests(filtered);
    }
  }, [searchTerm, requests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (memberId && amount && paymentMonth && paymentMethod && cashierName) {
      startLoading('addRequest');
      
      try {
        const newRequest = {
          memberId,
          amount: parseFloat(amount),
          requestDate: new Date().toISOString().split('T')[0],
          paymentMonth,
          paymentMethod,
          cashierName
        };
        
        const createdRequest = await transactionRequestsService.createRequest(newRequest);
        
        // Add the created request to the local state
        const selectedMember = members.find(m => m.id == memberId);
        const requestWithMemberName = {
          ...createdRequest,
          memberName: selectedMember ? selectedMember.name : 'Unknown',
          requestType: 'payment',
          status: 'pending'
        };
        
        setRequests([...requests, requestWithMemberName]);
        setMemberId('');
        setAmount('');
        setIsSharePayment(true);
        setPaymentMonth('');
        setPaymentMethod('');
        setCashierName('');
        setShowForm(false);
        
        // Show success toast
        addToast('Transaction request submitted successfully!', 'success');
      } catch (error) {
        addToast(error.message || 'Failed to submit transaction request', 'error');
      } finally {
        stopLoading('addRequest');
      }
    } else {
      // Show error toast
      addToast('Please fill in all required fields', 'error');
    }
  };

  const handleApprove = async (requestId) => {
    startLoading(`approveRequest-${requestId}`);
    
    try {
      const requestToApprove = requests.find(req => req.id === requestId);
      if (requestToApprove) {
        // Create payment in database with approved status
        const paymentData = {
          memberId: requestToApprove.member_id || requestToApprove.memberId,
          amount: requestToApprove.amount,
          paymentMonth: requestToApprove.description || requestToApprove.paymentMonth,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: requestToApprove.payment_method || requestToApprove.paymentMethod,
          cashierName: requestToApprove.cashier_name || requestToApprove.cashierName,
          status: 'approved'
        };
        
        const paymentsService = (await import('../api/paymentsService')).default;
        await paymentsService.createPayment(paymentData);
        
        // Update request status to approved
        await transactionRequestsService.approveRequest(requestId);
        
        // Remove from requests (realtime will update payments automatically)
        setRequests(requests.filter(req => req.id !== requestId));
        
        // Show success toast
        addToast('Transaction request approved and payment created!', 'success');
      }
    } catch (error) {
      addToast(error.message || 'Failed to approve transaction request', 'error');
    } finally {
      stopLoading(`approveRequest-${requestId}`);
    }
  };

  const handleReject = async (requestId) => {
    startLoading(`rejectRequest-${requestId}`);
    
    try {
      // Update request status to rejected
      await transactionRequestsService.rejectRequest(requestId);
      
      // Remove from requests
      setRequests(requests.filter(req => req.id !== requestId));
      
      // Show success toast
      addToast('Transaction request rejected!', 'success');
    } catch (error) {
      addToast(error.message || 'Failed to reject transaction request', 'error');
    } finally {
      stopLoading(`rejectRequest-${requestId}`);
    }
  };

  const handleRevertToPending = async (requestId) => {
    if (!window.confirm('Revert this approved request back to pending? The associated payment will be deleted.')) {
      return;
    }
    
    startLoading(`revertRequest-${requestId}`);
    
    try {
      const requestToRevert = requests.find(req => req.id === requestId);
      
      if (requestToRevert) {
        // Delete the associated payment
        const paymentsService = (await import('../api/paymentsService')).default;
        
        const matchingPayment = payments.find(p => 
          p.member_id === requestToRevert.member_id &&
          parseFloat(p.amount) === parseFloat(requestToRevert.amount) &&
          p.description === requestToRevert.description &&
          p.status === 'approved'
        );
        
        if (matchingPayment) {
          await paymentsService.deletePayment(matchingPayment.id);
        }
        
        // Update request status back to pending
        await transactionRequestsService.revertRequest(requestId);
        
        // Update local state
        setRequests(requests.map(req => 
          req.id === requestId ? { ...req, status: 'pending' } : req
        ));
        
        addToast('Request reverted to pending successfully!', 'success');
      }
    } catch (error) {
      addToast(error.message || 'Failed to revert request', 'error');
    } finally {
      stopLoading(`revertRequest-${requestId}`);
    }
  };

  const handleDelete = async (requestId) => {
    const requestToDelete = requests.find(req => req.id === requestId);
    
    // Check if request is approved
    if (requestToDelete.status === 'approved') {
      addToast('Cannot delete approved request! Please revert to pending first.', 'error');
      return;
    }
    
    // Find the member associated with current user
    const userMember = members.find(m => m.userId === currentUser.id || m.user_id === currentUser.id);
    const userMemberId = userMember?.id;
    
    // Check if user can delete this request
    const canDelete = hasManagePermission(currentUser, 'requests') || 
                     (requestToDelete.member_id === userMemberId || requestToDelete.memberId === userMemberId);
    
    if (!canDelete) {
      addToast('You can only delete your own transaction requests', 'error');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this transaction request?')) {
      return;
    }
    
    startLoading(`deleteRequest-${requestId}`);
    
    try {
      // Delete the request
      await transactionRequestsService.deleteRequest(requestId);
      
      // Remove from local state
      setRequests(requests.filter(req => req.id !== requestId));
      
      addToast('Transaction request deleted successfully!', 'success');
    } catch (error) {
      addToast(error.message || 'Failed to delete transaction request', 'error');
    } finally {
      stopLoading(`deleteRequest-${requestId}`);
    }
  };

  // Filter suggestions based on input
  const getSuggestions = (inputValue) => {
    const options = generateMonthYearOptions();
    if (!inputValue) return [];
    
    const filtered = options.filter(option =>
      option.toLowerCase().includes(inputValue.toLowerCase())
    );
    
    return filtered.slice(0, 10); // Limit to 10 suggestions
  };

  // Handle input change for autocomplete
  const handleInputChange = (e) => {
    const value = e.target.value;
    setPaymentMonth(value);
    
    if (value) {
      const newSuggestions = getSuggestions(value);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setPaymentMonth(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generate month/year options
  const monthYearOptions = generateMonthYearOptions();

  return (
    <div className="transaction-requests">
      <div className="requests-header">
        <h2>{t('transactionRequests.title')}</h2>
        <button 
          className="btn btn--primary" 
          onClick={() => setShowForm(true)}
        >
          {t('transactionRequests.requestTransaction')}
        </button>
      </div>

      <div className="requests-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('transactionRequests.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading('fetchRequests') ? (
        <div className="loading-container">
          <LoadingSpinner message="Loading requests..." />
        </div>
      ) : (
        <div className="requests-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('transactionRequests.member')}</th>
                <th>{t('transactionRequests.requestType')}</th>
                <th>{t('transactionRequests.amount')}</th>
                <th>{t('transactionRequests.month')}</th>
                <th>{t('transactionRequests.method')}</th>
                <th>{t('transactionRequests.cashier')}</th>
                <th>{t('transactionRequests.date')}</th>
                <th>{t('transactionRequests.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.memberName || 'Unknown'}</td>
                    <td>{request.requestType || 'payment'}</td>
                    <td>{request.amount ? request.amount.toFixed(2) : '0.00'}</td>
                    <td>{request.description || request.paymentMonth || 'N/A'}</td>
                    <td>{request.payment_method || request.paymentMethod || 'N/A'}</td>
                    <td>{request.cashier_name || request.cashierName || 'N/A'}</td>
                    <td>{request.request_date || request.requestDate || 'N/A'}</td>
                    <td>
                      <span className={`status-badge status-badge--${request.status || 'pending'}`}>
                        {t(`transactionRequests.${request.status || 'pending'}`)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {isLoading(`approveRequest-${request.id}`) || isLoading(`rejectRequest-${request.id}`) || isLoading(`deleteRequest-${request.id}`) || isLoading(`revertRequest-${request.id}`) ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <>
                            {request.status === 'pending' && hasManagePermission(currentUser, 'requests') && (
                              <>
                                <button 
                                  className="btn btn--success"
                                  onClick={() => handleApprove(request.id)}
                                >
                                  {t('transactionRequests.approve')}
                                </button>
                                <button 
                                  className="btn btn--danger"
                                  onClick={() => handleReject(request.id)}
                                >
                                  {t('transactionRequests.reject')}
                                </button>
                              </>
                            )}
                            {request.status === 'approved' && hasManagePermission(currentUser, 'requests') && (
                              <button 
                                className="btn btn--icon btn--secondary"
                                onClick={() => handleRevertToPending(request.id)}
                                title="Revert to Pending"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M3 21v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>Revert</span>
                              </button>
                            )}
                            {request.status === 'pending' && (() => {
                              const userMember = members.find(m => m.userId === currentUser.id || m.user_id === currentUser.id);
                              return hasManagePermission(currentUser, 'requests') || 
                                     request.member_id === userMember?.id || 
                                     request.memberId === userMember?.id;
                            })() && (
                              <button 
                                className="btn btn--icon btn--danger"
                                onClick={() => handleDelete(request.id)}
                                title="Delete Request"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="no-data">
                    {t('transactionRequests.noRequests')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Transaction Form */}
      {showForm && (() => {
        const userMember = members.find(m => m.userId === currentUser.id || m.user_id === currentUser.id);
        const canChangeMember = hasManagePermission(currentUser, 'requests') || currentUser.role === 'admin';
        
        // Auto-select member for non-admin/non-manager users
        if (userMember && !canChangeMember && !memberId) {
          setMemberId(userMember.id.toString());
          if (isSharePayment) {
            setAmount(userMember.shareAmount * 1000);
          }
        }
        
        return (
          <div className="overlay">
            <div className="overlay-content">
              <div className="overlay-header">
                <h2>{t('transactionRequests.requestNewTransaction')}</h2>
                <button 
                  className="close-btn" 
                  onClick={() => setShowForm(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="memberId">{t('transactionRequests.member')} *</label>
                  {canChangeMember ? (
                    <select
                      id="memberId"
                      value={memberId}
                      onChange={handleMemberChange}
                    >
                      <option value="">{t('transactionRequests.selectMember')}</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} (Shares: {member.shareAmount})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={userMember?.name || 'No member assigned'}
                      disabled
                      style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                    />
                  )}
                  {!canChangeMember && !userMember && (
                    <small style={{ color: '#dc3545' }}>You are not assigned to any member. Please contact admin.</small>
                  )}
                </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isSharePayment}
                    onChange={handleSharePaymentToggle}
                  />
                  <span>{t('transactionRequests.calculateAmount')}</span>
                </label>
                <div className="form-hint">{t('transactionRequests.autoCalculate')}</div>
              </div>
              
              <div className="form-group">
                <label htmlFor="amount">{t('transactionRequests.amount')} (BDT) *</label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter transaction amount"
                  readOnly={isSharePayment}
                  min="0"
                  step="0.01"
                />
                {isSharePayment && memberId && (
                  <div className="form-hint">Auto-calculated from member's shares</div>
                )}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paymentMonth">{t('transactionRequests.paymentMonth')} *</label>
                  <div className="autocomplete" ref={autocompleteRef}>
                    <input
                      type="text"
                      id="paymentMonth"
                      value={paymentMonth}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (paymentMonth) {
                          const newSuggestions = getSuggestions(paymentMonth);
                          setSuggestions(newSuggestions);
                        } else {
                          setSuggestions(generateMonthYearOptions().slice(0, 10));
                        }
                        setShowSuggestions(true);
                      }}
                      placeholder="Enter or select month and year"
                      required
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="suggestions-list">
                        {suggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="suggestion-item"
                          >
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="paymentMethod">{t('transactionRequests.paymentMethod')} *</label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="">{t('transactionRequests.selectMethod')}</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.value}>
                        {method.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="cashierName">{t('transactionRequests.cashierName')} *</label>
                <select
                  id="cashierName"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  required
                >
                  <option value="">{t('transactionRequests.selectCashier')}</option>
                  {cashierNames.map((cashier) => (
                    <option key={cashier.id} value={cashier.value}>
                      {cashier.value}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-actions">
                {isLoading('addRequest') ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <button 
                      type="button" 
                      onClick={() => setShowForm(false)}
                    >
                      {t('common.cancel')}
                    </button>
                    <button 
                      type="submit" 
                      className="btn--primary"
                    >
                      {t('transactionRequests.submitRequest')}
                    </button>
                  </>
                )}
              </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default TransactionRequests;