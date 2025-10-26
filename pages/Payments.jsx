import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import { hasWritePermission } from '../components/PermissionChecker';
import paymentsService from '../api/paymentsService';
import { getUserFriendlyError } from '../src/utils/errorHandler';
import './Payments.css';

const Payments = ({ payments, setPayments, members, currentUser }) => {
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
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef(null);
  
  const { addToast } = useToast();
  const { startLoading, stopLoading, isLoading } = useLoading();

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
          cashierName
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
        cashierName
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

  return (
    <div className="payments">
      <div className="payments-header">
        <h2>Payments</h2>
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
              setShowForm(true);
            }}
          >
            Add Payment
          </button>
        )}
      </div>

      <div className="payments-stats">
        <div className="stat-card">
          <div className="stat-value">{totalTransactions}</div>
          <div className="stat-label">Total Transactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">৳{totalPayments.toFixed(2)}</div>
          <div className="stat-label">Total Amount</div>
        </div>
      </div>

      {/* Keep the table view for all screens */}
      <div className="payments-list">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Member</th>
              <th>Amount</th>
              <th>Month</th>
              <th>Date</th>
              <th>Method</th>
              <th>Cashier</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
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
                    {payment.status}
                  </span>
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
                        <span>Edit</span>
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
                        <span>Delete</span>
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
              <h2>Add New Payment</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="payment-form">
              <div className="form-section">
                <h3 className="form-section-title">Payment Information</h3>
                <div className="form-group">
                  <label htmlFor="memberId">Member *</label>
                  <select
                    id="memberId"
                    value={memberId}
                    onChange={handleMemberChange}
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
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isSharePayment}
                      onChange={handleSharePaymentToggle}
                    />
                    <span>Calculate amount as share × ৳1000</span>
                  </label>
                  <div className="form-hint">When enabled, amount will be automatically calculated based on member's shares</div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="amount">Amount (৳) *</label>
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
                <h3 className="form-section-title">Payment Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="paymentMonth">Payment Month *</label>
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
                    <label htmlFor="paymentDate">Payment Date *</label>
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
                    <label htmlFor="paymentMethod">Payment Method *</label>
                    <select
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="">Select payment method</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Mobile Banking">Mobile Banking</option>
                      <option value="Check">Check</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="cashierName">Cashier Name *</label>
                    <input
                      type="text"
                      id="cashierName"
                      value={cashierName}
                      onChange={(e) => setCashierName(e.target.value)}
                      placeholder="Enter cashier name"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                {isLoading('addPayment') ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <button type="submit" className="btn btn--primary">
                      Add Payment
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

      {showEditForm && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h2>Edit Payment</h2>
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
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Mobile Banking">Mobile Banking</option>
                      <option value="Check">Check</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="editCashierName">Cashier Name *</label>
                    <input
                      type="text"
                      id="editCashierName"
                      value={cashierName}
                      onChange={(e) => setCashierName(e.target.value)}
                      placeholder="Enter cashier name"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                {isLoading('editPayment') ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <button type="submit" className="btn btn--primary">
                      Update Payment
                    </button>
                    <button 
                      type="button" 
                      className="btn btn--secondary"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingPayment(null);
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

export default Payments;