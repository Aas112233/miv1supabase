import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import { hasWritePermission } from '../components/PermissionChecker';
import paymentsService from '../api/paymentsService';
import './Payments.css';

const Payments = ({ payments, setPayments, members, currentUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [isSharePayment, setIsSharePayment] = useState(false);
  const [paymentMonth, setPaymentMonth] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashierName, setCashierName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef(null);
  
  const { addToast } = useToast();
  const { startLoading, stopLoading, isLoading } = useLoading();

  const handleShareAmountChange = (e) => {
    setIsSharePayment(e.target.checked);
    if (e.target.checked && members.length > 0) {
      // Set default amount based on first member's share
      const defaultShare = members[0]?.shareAmount || 1000;
      setAmount(defaultShare);
    }
  };

  const handleMemberChange = (e) => {
    const selectedMemberId = e.target.value;
    setMemberId(selectedMemberId);
    
    if (isSharePayment && selectedMemberId) {
      const member = members.find(m => m.id == selectedMemberId);
      if (member) {
        setAmount(member.shareAmount);
      }
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
        setIsSharePayment(false);
        setPaymentMonth('');
        setPaymentDate('');
        setPaymentMethod('');
        setCashierName('');
        setShowForm(false);
        
        // Show success toast
        addToast('Payment added successfully!', 'success');
      } catch (error) {
        addToast(error.message || 'Failed to add payment', 'error');
      } finally {
        stopLoading('addPayment');
      }
    } else {
      // Show error toast
      addToast('Please fill in all required fields', 'error');
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
            onClick={() => setShowForm(true)}
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
          <div className="stat-value">{totalPayments.toFixed(2)}</div>
          <div className="stat-label">Total Amount (BDT)</div>
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
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="memberId">Member:</label>
                  <select
                    id="memberId"
                    value={memberId}
                    onChange={handleMemberChange}
                    required
                  >
                    <option value="">Select Member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group checkbox-container">
                  <label>
                    <input
                      type="checkbox"
                      checked={isSharePayment}
                      onChange={handleShareAmountChange}
                    />
                    Amount as Share
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="amount">Amount (BDT):</label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  readOnly={isSharePayment}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paymentMonth">Payment Month:</label>
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
                  <label htmlFor="paymentDate">Payment Date:</label>
                  <input
                    type="date"
                    id="paymentDate"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method:</label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="">Select Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Mobile Banking">Mobile Banking</option>
                    <option value="Check">Check</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="cashierName">Cashier Name:</label>
                  <input
                    type="text"
                    id="cashierName"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    required
                  />
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
    </div>
  );
};

export default Payments;