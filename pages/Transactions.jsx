import React, { useState, useEffect } from 'react';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import './Transactions.css';

const Transactions = ({ payments }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('payment_date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  const { startLoading, stopLoading, isLoading } = useLoading();

  // Simulate loading transactions
  useEffect(() => {
    startLoading('fetchTransactions');
    
    // Simulate API call delay
    setTimeout(() => {
      setTransactions(payments);
      setFilteredTransactions(payments);
      stopLoading('fetchTransactions');
    }, 800);
  }, [payments]);

  // Filter transactions based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter(transaction =>
        (transaction.memberName && transaction.memberName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.payment_method && transaction.payment_method.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.description && transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.cashier_name && transaction.cashier_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredTransactions(filtered);
    }
  }, [searchTerm, transactions]);

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    // Handle different field names for sorting
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Fallback for fields that might have different names
    if (sortField === 'paymentMonth' && !aValue) {
      aValue = a.description;
      bValue = b.description;
    } else if (sortField === 'paymentDate' && !aValue) {
      aValue = a.payment_date;
      bValue = b.payment_date;
    } else if (sortField === 'paymentMethod' && !aValue) {
      aValue = a.payment_method;
      bValue = b.payment_method;
    } else if (sortField === 'cashierName' && !aValue) {
      aValue = a.cashier_name;
      bValue = b.cashier_name;
    }
    
    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const totalAmount = sortedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div className="transactions">
      <div className="transactions-header">
        <h2>Transactions</h2>
      </div>

      <div className="transactions-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading('fetchTransactions') ? (
        <div className="loading-container">
          <LoadingSpinner message="Loading transactions..." />
        </div>
      ) : (
        <>
          <div className="transactions-stats">
            <div className="stat-card">
              <h3>{sortedTransactions.length}</h3>
              <p>Total Transactions</p>
            </div>
            <div className="stat-card">
              <h3>{totalAmount.toFixed(2)}</h3>
              <p>Total Amount (BDT)</p>
            </div>
          </div>

          <div className="transactions-list">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')} className="sortable">
                    ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('memberName')} className="sortable">
                    Member {sortField === 'memberName' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('amount')} className="sortable">
                    Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('paymentMonth')} className="sortable">
                    Month {sortField === 'paymentMonth' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('paymentDate')} className="sortable">
                    Date {sortField === 'paymentDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('paymentMethod')} className="sortable">
                    Method {sortField === 'paymentMethod' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('cashierName')} className="sortable">
                    Cashier {sortField === 'cashierName' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.length > 0 ? (
                  sortedTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.id}</td>
                      <td>{transaction.memberName || 'Unknown'}</td>
                      <td>{transaction.amount ? transaction.amount.toFixed(2) : '0.00'}</td>
                      <td>{transaction.description || transaction.paymentMonth || 'N/A'}</td>
                      <td>{transaction.payment_date || transaction.paymentDate || 'N/A'}</td>
                      <td>{transaction.payment_method || transaction.paymentMethod || 'N/A'}</td>
                      <td>{transaction.cashier_name || transaction.cashierName || 'N/A'}</td>
                      <td>
                        <span className={`status-badge status-badge--${transaction.status || 'completed'}`}>
                          {transaction.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="no-data">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Transactions;