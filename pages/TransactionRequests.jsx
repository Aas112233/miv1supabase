import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import { hasWritePermission } from '../components/PermissionChecker';
import './TransactionRequests.css';

const TransactionRequests = ({ requests, setRequests, payments, setPayments, members, currentUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMonth, setPaymentMonth] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashierName, setCashierName] = useState('');
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef(null);
  
  const { addToast } = useToast();
  const { startLoading, stopLoading, isLoading } = useLoading();

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
        request.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requestType.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRequests(filtered);
    }
  }, [searchTerm, requests]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (memberId && amount && paymentMonth && paymentMethod && cashierName) {
      startLoading('addRequest');
      
      // Simulate API call delay
      setTimeout(() => {
        const selectedMember = members.find(m => m.id == memberId);
        const newRequest = {
          id: Date.now(),
          memberId,
          memberName: selectedMember ? selectedMember.name : 'Unknown',
          amount: parseFloat(amount),
          requestType: 'payment', // Fixed to payment only
          paymentMonth,
          paymentMethod,
          cashierName,
          requestDate: new Date().toISOString().split('T')[0],
          status: 'pending'
        };
        setRequests([...requests, newRequest]);
        setMemberId('');
        setAmount('');
        setPaymentMonth('');
        setPaymentMethod('');
        setCashierName('');
        setShowForm(false);
        
        // Show success toast
        addToast('Transaction request submitted successfully!', 'success');
        stopLoading('addRequest');
      }, 500);
    } else {
      // Show error toast
      addToast('Please fill in all required fields', 'error');
    }
  };

  const handleApprove = (requestId) => {
    startLoading(`approveRequest-${requestId}`);
    
    // Simulate API call delay
    setTimeout(() => {
      const requestToApprove = requests.find(req => req.id === requestId);
      if (requestToApprove) {
        // Add to payments
        const newPayment = {
          id: Date.now(),
          memberId: requestToApprove.memberId,
          memberName: requestToApprove.memberName,
          amount: requestToApprove.amount,
          paymentMonth: requestToApprove.paymentMonth,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: requestToApprove.paymentMethod,
          cashierName: requestToApprove.cashierName,
          status: 'completed'
        };
        setPayments([...payments, newPayment]);
        
        // Remove from requests
        setRequests(requests.filter(req => req.id !== requestId));
        
        // Show success toast
        addToast('Transaction request approved successfully!', 'success');
      }
      stopLoading(`approveRequest-${requestId}`);
    }, 500);
  };

  const handleReject = (requestId) => {
    startLoading(`rejectRequest-${requestId}`);
    
    // Simulate API call delay
    setTimeout(() => {
      setRequests(requests.filter(req => req.id !== requestId));
      // Show success toast
      addToast('Transaction request rejected!', 'success');
      stopLoading(`rejectRequest-${requestId}`);
    }, 500);
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
        <h2>Transaction Requests</h2>
        {hasWritePermission(currentUser, 'requests') && (
          <button 
            className="btn btn--primary" 
            onClick={() => setShowForm(true)}
          >
            Request Transaction
          </button>
        )}
      </div>

      <div className="requests-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search requests..."
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
                <th>Member</th>
                <th>Request Type</th>
                <th>Amount</th>
                <th>Month</th>
                <th>Method</th>
                <th>Cashier</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.memberName}</td>
                    <td>{request.requestType}</td>
                    <td>{request.amount.toFixed(2)}</td>
                    <td>{request.paymentMonth}</td>
                    <td>{request.paymentMethod}</td>
                    <td>{request.cashierName}</td>
                    <td>{request.requestDate}</td>
                    <td>
                      <span className={`status-badge status-badge--${request.status}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {isLoading(`approveRequest-${request.id}`) || isLoading(`rejectRequest-${request.id}`) ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <>
                            <button 
                              className="btn btn--success"
                              onClick={() => handleApprove(request.id)}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn btn--danger"
                              onClick={() => handleReject(request.id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="no-data">
                    No transaction requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Transaction Form */}
      {showForm && (
        <div className="overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <h2>Request New Transaction</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="memberId">Member:</label>
                <select
                  id="memberId"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
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
              
              <div className="form-group">
                <label htmlFor="amount">Amount (BDT):</label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="1"
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
                    <option value="Check">Check</option>
                    <option value="Mobile Payment">Mobile Payment</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="cashierName">Cashier Name:</label>
                <input
                  type="text"
                  id="cashierName"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  placeholder="Enter cashier name"
                  required
                />
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
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn--primary"
                    >
                      Submit Request
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

export default TransactionRequests;