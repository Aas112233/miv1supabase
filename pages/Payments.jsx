import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import { hasWritePermission } from '../components/PermissionChecker';
import CloudinaryUpload from '../components/CloudinaryUpload';
import paymentsService from '../api/paymentsService';
import masterDataService from '../api/masterDataService';
import { getUserFriendlyError } from '../src/utils/errorHandler';
import './Payments.css';

const Payments = ({ payments, setPayments, members, currentUser }) => {
  const { t: translations } = useLanguage();
  const t = (key) => key.split('.').reduce((obj, k) => obj?.[k], translations) || key;
  
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [isSharePayment, setIsSharePayment] = useState(true);
  const [paymentMonth, setPaymentMonth] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashierName, setCashierName] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cashierNames, setCashierNames] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('desc');
  const autocompleteRef = useRef(null);
  
  const { addToast } = useToast();
  const { startLoading, stopLoading, isLoading } = useLoading();

  useEffect(() => {
    startLoading('paymentsData');
    setTimeout(() => {
      stopLoading('paymentsData');
    }, 2000);
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate fields
    if (!memberId) {
      addToast('Please select a member', 'error');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }
    
    if (!paymentMonth.trim()) {
      addToast('Please enter payment month', 'error');
      return;
    }
    
    if (!paymentDate) {
      addToast('Please select payment date', 'error');
      return;
    }
    
    if (!paymentMethod) {
      addToast('Please select payment method', 'error');
      return;
    }
    
    if (!cashierName.trim()) {
      addToast('Please enter cashier name', 'error');
      return;
    }
    
    if (memberId && amount && paymentMonth && paymentDate && paymentMethod && cashierName) {
      startLoading('addPayment');
      
      try {
        const newPayment = {
          memberId,
          amount: parseFloat(amount),
          paymentMonth,
          paymentDate,
          paymentMethod,
          cashierName,
          receiptUrl
        };
        
        const createdPayment = await paymentsService.createPayment(newPayment);
        
        // Add the created payment to the local state
        const selectedMember = members.find(m => m.id == memberId);
        const paymentWithMemberName = {
          ...createdPayment,
          memberName: selectedMember ? selectedMember.name : 'Unknown',
          status: 'completed'
        };
        
        setPayments([...payments, paymentWithMemberName]);
        setMemberId('');
        setAmount('');
        setIsSharePayment(true);
        setPaymentMonth('');
        setPaymentDate('');
        setPaymentMethod('');
        setCashierName('');
        setReceiptUrl('');
        setShowForm(false);
        
        // Show success toast
        addToast('Payment added successfully!', 'success');
      } catch (error) {
        addToast(getUserFriendlyError(error), 'error');
      } finally {
        stopLoading('addPayment');
      }
    } else {
      // Show error toast
      addToast('Please fill in all required fields', 'error');
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setMemberId(payment.memberId || payment.member_id);
    setAmount(payment.amount);
    setIsSharePayment(false);
    setPaymentMonth(payment.description || payment.paymentMonth);
    setPaymentDate(payment.payment_date || payment.paymentDate);
    setPaymentMethod(payment.payment_method || payment.paymentMethod);
    setCashierName(payment.cashier_name || payment.cashierName);
    setReceiptUrl(payment.receipt_url || '');
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!memberId || !amount || !paymentMonth || !paymentDate || !paymentMethod || !cashierName) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    
    startLoading('editPayment');
    
    try {
      const updatedPayment = {
        memberId,
        amount: parseFloat(amount),
        paymentMonth,
        paymentDate,
        paymentMethod,
        cashierName,
        receiptUrl
      };
      
      await paymentsService.updatePayment(editingPayment.id, updatedPayment);
      
      const selectedMember = members.find(m => m.id == memberId);
      const updatedPayments = payments.map(p => 
        p.id === editingPayment.id 
          ? { ...p, ...updatedPayment, memberName: selectedMember?.name || p.memberName }
          : p
      );
      
      setPayments(updatedPayments);
      setMemberId('');
      setAmount('');
      setIsSharePayment(true);
      setPaymentMonth('');
      setPaymentDate('');
      setPaymentMethod('');
      setCashierName('');
      setReceiptUrl('');
      setShowEditForm(false);
      setEditingPayment(null);
      
      addToast('Payment updated successfully!', 'success');
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('editPayment');
    }
  };

  const handleDelete = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await paymentsService.deletePayment(paymentId);
        setPayments(payments.filter(p => p.id !== paymentId));
        addToast('Payment deleted successfully!', 'success');
      } catch (error) {
        addToast(getUserFriendlyError(error), 'error');
      }
    }
  };

  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalTransactions = payments.length;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPayments = [...payments].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'paymentDate') {
      aVal = a.payment_date || a.paymentDate;
      bVal = b.payment_date || b.paymentDate;
    } else if (sortField === 'paymentMonth') {
      aVal = a.description || a.paymentMonth;
      bVal = b.description || b.paymentMonth;
    } else if (sortField === 'paymentMethod') {
      aVal = a.payment_method || a.paymentMethod;
      bVal = b.payment_method || b.paymentMethod;
    } else if (sortField === 'cashierName') {
      aVal = a.cashier_name || a.cashierName;
      bVal = b.cashier_name || b.cashierName;
    }

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (isLoading('paymentsData')) {
    return (
      <div className="payments">
        <div className="payments-header">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-button"></div>
        </div>
        <div className="payments-stats">
          <div className="skeleton skeleton-stat-card"></div>
          <div className="skeleton skeleton-stat-card"></div>
        </div>
        <div className="payments-list">
          <div className="skeleton skeleton-table-header"></div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton skeleton-table-row"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="payments">
      <div className="payments-header">
        <h2>{t('payments.title')}</h2>
        {hasWritePermission(currentUser, 'payments') && (
          <button 
            className="btn btn--primary" 
            onClick={() => {
              setMemberId('');
              setAmount('');
              setIsSharePayment(true);
              setPaymentMonth('');
              setPaymentDate('');
              setPaymentMethod('');
              setCashierName('');
              setReceiptUrl('');
              setShowForm(true);
            }}
          >
            {t('payments.addPayment')}
          </button>
        )}
      </div>

      <div className="payments-stats">
        <div className="stat-card">
          <div className="stat-value">{totalTransactions}</div>
          <div className="stat-label">{t('payments.totalTransactions')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">৳{totalPayments.toFixed(2)}</div>
          <div className="stat-label">{t('payments.totalAmount')}</div>
        </div>
      </div>

      {/* Keep the table view for all screens */}
      <div className="payments-list">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('memberName')} style={{ cursor: 'pointer' }}>
                {t('payments.member')} {sortField === 'memberName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>
                {t('payments.amount')} {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('paymentMonth')} style={{ cursor: 'pointer' }}>
                {t('payments.month')} {sortField === 'paymentMonth' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('paymentDate')} style={{ cursor: 'pointer' }}>
                {t('payments.date')} {sortField === 'paymentDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('paymentMethod')} style={{ cursor: 'pointer' }}>
                {t('payments.method')} {sortField === 'paymentMethod' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('cashierName')} style={{ cursor: 'pointer' }}>
                {t('payments.cashier')} {sortField === 'cashierName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                {t('payments.status')} {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Receipt</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedPayments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.id}</td>
                <td>{payment.memberName}</td>
                <td>{payment.amount.toFixed(2)}</td>
                <td>{payment.description || payment.paymentMonth}</td>
                <td>{payment.payment_date || payment.paymentDate}</td>
                <td>{payment.payment_method || payment.paymentMethod}</td>
                <td>{payment.cashier_name || payment.cashierName}</td>
                <td>
                  <span className={`status-badge status-badge--${payment.status}`}>
                    {t(`payments.${payment.status}`)}
                  </span>
                </td>
                <td>
                  {payment.receipt_url ? (
                    <a 
                      href={payment.receipt_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn--icon btn--view"
                      title="View Receipt"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>View</span>
                    </a>
                  ) : (
                    <span style={{color: '#999', fontSize: '0.85rem'}}>No receipt</span>
                  )}
                </td>
                <td>
                  {hasWritePermission(currentUser, 'payments') && (
                    <div className="action-buttons">
                      <button 
                        className="btn btn--icon btn--secondary" 
                        title="Edit Payment"
                        onClick={() => handleEdit(payment)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{t('common.edit')}</span>
                      </button>
                      <button 
                        className="btn btn--icon btn--danger" 
                        title="Delete Payment"
                        onClick={() => handleDelete(payment.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{t('common.delete')}</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h2>{t('payments.addPayment')}</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="payment-form">
              <div className="form-section">
                <h3 className="form-section-title">{t('payments.paymentInfo')}</h3>
                <div className="form-group">
                  <label htmlFor="memberId">{t('payments.member')} *</label>
                  <select
                    id="memberId"
                    value={memberId}
                    onChange={handleMemberChange}
                  >
                    <option value="">{t('payments.selectMember')}</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} (Shares: {member.shareAmount})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isSharePayment}
                      onChange={handleSharePaymentToggle}
                    />
                    <span>{t('payments.calculateAmount')}</span>
                  </label>
                  <div className="form-hint">{t('payments.autoCalculate')}</div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="amount">{t('payments.amount')} (৳) *</label>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter payment amount"
                    readOnly={isSharePayment}
                    min="0"
                    step="0.01"
                  />
                  {isSharePayment && memberId && (
                    <div className="form-hint">Auto-calculated from member's shares</div>
                  )}
                </div>
              </div>
              
              <div className="form-divider"></div>
              
              <div className="form-section">
                <h3 className="form-section-title">{t('payments.paymentDetails')}</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="paymentMonth">{t('payments.paymentMonth')} *</label>
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
                        placeholder="e.g., January 2025"
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
                    <label htmlFor="paymentDate">{t('payments.paymentDate')} *</label>
                    <input
                      type="date"
                      id="paymentDate"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="paymentMethod">{t('payments.paymentMethod')} *</label>
                    <select
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="">{t('payments.selectMethod')}</option>
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.value}>
                          {method.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="cashierName">{t('payments.cashierName')} *</label>
                    <select
                      id="cashierName"
                      value={cashierName}
                      onChange={(e) => setCashierName(e.target.value)}
                    >
                      <option value="">{t('payments.selectCashier')}</option>
                      {cashierNames.map((cashier) => (
                        <option key={cashier.id} value={cashier.value}>
                          {cashier.value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Receipt/Proof (Optional)</label>
                  <CloudinaryUpload 
                    onUploadSuccess={(url) => setReceiptUrl(url)}
                    onUploadError={(error) => addToast(error, 'error')}
                    onUploadStart={(uploading) => setIsUploading(uploading)}
                    customFilename={memberId && paymentMonth ? 
                      `receipt_${members.find(m => m.id == memberId)?.name.replace(/\s+/g, '_')}_${paymentMonth.replace(/\s+/g, '_')}` 
                      : null
                    }
                  />
                  <div className="form-hint">Upload payment receipt or proof (JPG, PNG, PDF)</div>
                </div>
              </div>
              
              <div className="form-actions">
                {isLoading('addPayment') ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <button type="submit" className="btn btn--primary" disabled={isUploading}>
                      {t('payments.addPayment')}
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

      {showEditForm && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h2>{t('payments.editPayment')}</h2>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowEditForm(false);
                  setEditingPayment(null);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="payment-form">
              <div className="form-section">
                <h3 className="form-section-title">Payment Information</h3>
                <div className="form-group">
                  <label htmlFor="editMemberId">Member *</label>
                  <select
                    id="editMemberId"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                  >
                    <option value="">Select a member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} (Shares: {member.shareAmount})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="editAmount">Amount (৳) *</label>
                  <input
                    type="number"
                    id="editAmount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter payment amount"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="form-divider"></div>
              
              <div className="form-section">
                <h3 className="form-section-title">Payment Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="editPaymentMonth">Payment Month *</label>
                    <input
                      type="text"
                      id="editPaymentMonth"
                      value={paymentMonth}
                      onChange={(e) => setPaymentMonth(e.target.value)}
                      placeholder="e.g., January 2025"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="editPaymentDate">Payment Date *</label>
                    <input
                      type="date"
                      id="editPaymentDate"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="editPaymentMethod">Payment Method *</label>
                    <select
                      id="editPaymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="">Select payment method</option>
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.value}>
                          {method.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="editCashierName">Cashier Name *</label>
                    <select
                      id="editCashierName"
                      value={cashierName}
                      onChange={(e) => setCashierName(e.target.value)}
                    >
                      <option value="">Select cashier</option>
                      {cashierNames.map((cashier) => (
                        <option key={cashier.id} value={cashier.value}>
                          {cashier.value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Receipt/Proof (Optional)</label>
                  <CloudinaryUpload 
                    onUploadSuccess={(url) => setReceiptUrl(url)}
                    onUploadError={(error) => addToast(error, 'error')}
                    onUploadStart={(uploading) => setIsUploading(uploading)}
                    customFilename={memberId && paymentMonth ? 
                      `receipt_${members.find(m => m.id == memberId)?.name.replace(/\s+/g, '_')}_${paymentMonth.replace(/\s+/g, '_')}` 
                      : null
                    }
                    existingUrl={receiptUrl}
                  />
                  <div className="form-hint">Upload payment receipt or proof (JPG, PNG, PDF)</div>
                </div>
              </div>
              
              <div className="form-actions">
                {isLoading('editPayment') ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <button type="submit" className="btn btn--primary" disabled={isUploading}>
                      {t('common.update')}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn--secondary"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingPayment(null);
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
    </div>
  );
};

export default Payments;