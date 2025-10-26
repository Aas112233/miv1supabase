import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import { hasWritePermission } from '../components/PermissionChecker';
import expensesService from '../api/expensesService';
import { getUserFriendlyError } from '../src/utils/errorHandler';
import './Expenses.css';

const Expenses = ({ expenses, setExpenses, projects, currentUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [expenseBy, setExpenseBy] = useState('');
  const [deductFrom, setDeductFrom] = useState('main_savings');
  const [expenseDate, setExpenseDate] = useState('');
  const [projectId, setProjectId] = useState('');
  
  const { addToast } = useToast();
  const { startLoading, stopLoading, isLoading } = useLoading();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      addToast('Please enter expense reason', 'error');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }
    
    if (!category) {
      addToast('Please select a category', 'error');
      return;
    }
    
    if (!expenseBy.trim()) {
      addToast('Please enter who made the expense', 'error');
      return;
    }
    
    if (!expenseDate) {
      addToast('Please select expense date', 'error');
      return;
    }
    
    startLoading('addExpense');
    
    try {
      const newExpense = {
        reason,
        amount: parseFloat(amount),
        category,
        expenseBy,
        deductFrom,
        expenseDate,
        projectId: projectId || null
      };
      
      const createdExpense = await expensesService.createExpense(newExpense);
      
      setExpenses([...expenses, createdExpense]);
      setReason('');
      setAmount('');
      setCategory('');
      setExpenseBy('');
      setDeductFrom('main_savings');
      setExpenseDate('');
      setProjectId('');
      setShowForm(false);
      
      addToast('Expense added successfully!', 'success');
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('addExpense');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setReason(expense.reason);
    setAmount(expense.amount);
    setCategory(expense.category);
    setExpenseBy(expense.expense_by || expense.expenseBy);
    setDeductFrom(expense.deduct_from || expense.deductFrom);
    setExpenseDate(expense.expense_date || expense.expenseDate);
    setProjectId(expense.project_id || '');
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim() || !amount || !category || !expenseBy.trim() || !expenseDate) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    
    startLoading('editExpense');
    
    try {
      const updatedExpense = {
        reason,
        amount: parseFloat(amount),
        category,
        expenseBy,
        deductFrom,
        expenseDate,
        projectId: projectId || null
      };
      
      await expensesService.updateExpense(editingExpense.id, updatedExpense);
      
      const updatedExpenses = expenses.map(e => 
        e.id === editingExpense.id 
          ? { ...e, ...updatedExpense }
          : e
      );
      
      setExpenses(updatedExpenses);
      setReason('');
      setAmount('');
      setCategory('');
      setExpenseBy('');
      setDeductFrom('main_savings');
      setExpenseDate('');
      setProjectId('');
      setShowEditForm(false);
      setEditingExpense(null);
      
      addToast('Expense updated successfully!', 'success');
    } catch (error) {
      addToast(getUserFriendlyError(error), 'error');
    } finally {
      stopLoading('editExpense');
    }
  };

  const handleDelete = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expensesService.deleteExpense(expenseId);
        setExpenses(expenses.filter(e => e.id !== expenseId));
        addToast('Expense deleted successfully!', 'success');
      } catch (error) {
        addToast(getUserFriendlyError(error), 'error');
      }
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalTransactions = expenses.length;

  return (
    <div className="expenses">
      <div className="expenses-header">
        <h2>Expenses</h2>
        {hasWritePermission(currentUser, 'expenses') && (
          <button 
            className="btn btn--primary" 
            onClick={() => {
              setReason('');
              setAmount('');
              setCategory('');
              setExpenseBy('');
              setDeductFrom('main_savings');
              setExpenseDate('');
              setProjectId('');
              setShowForm(true);
            }}
          >
            Add Expense
          </button>
        )}
      </div>

      <div className="expenses-stats">
        <div className="stat-card">
          <div className="stat-value">{totalTransactions}</div>
          <div className="stat-label">Total Expenses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">৳{totalExpenses.toFixed(2)}</div>
          <div className="stat-label">Total Amount</div>
        </div>
      </div>

      <div className="expenses-list">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Reason</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Expense By</th>
              <th>Deduct From</th>
              <th>Project</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td>{expense.id}</td>
                <td>{expense.reason}</td>
                <td>{expense.amount.toFixed(2)}</td>
                <td>{expense.category}</td>
                <td>{expense.expense_by || expense.expenseBy}</td>
                <td>{expense.deduct_from || expense.deductFrom}</td>
                <td>{expense.project_id ? projects.find(p => p.id === expense.project_id)?.name || 'N/A' : 'N/A'}</td>
                <td>{expense.expense_date || expense.expenseDate}</td>
                <td>
                  {hasWritePermission(currentUser, 'expenses') && (
                    <div className="action-buttons">
                      <button 
                        className="btn btn--icon btn--secondary" 
                        title="Edit Expense"
                        onClick={() => handleEdit(expense)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button 
                        className="btn btn--icon btn--danger" 
                        title="Delete Expense"
                        onClick={() => handleDelete(expense.id)}
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
              <h2>Add New Expense</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="expense-form">
              <div className="form-section">
                <h3 className="form-section-title">Expense Information</h3>
                <div className="form-group">
                  <label htmlFor="reason">Reason *</label>
                  <input
                    type="text"
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter expense reason"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="amount">Amount (৳) *</label>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter expense amount"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select category</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Professional Fees">Professional Fees</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="form-divider"></div>
              
              <div className="form-section">
                <h3 className="form-section-title">Expense Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="expenseBy">Expense By *</label>
                    <input
                      type="text"
                      id="expenseBy"
                      value={expenseBy}
                      onChange={(e) => setExpenseBy(e.target.value)}
                      placeholder="Enter person name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="deductFrom">Deduct From *</label>
                    <select
                      id="deductFrom"
                      value={deductFrom}
                      onChange={(e) => setDeductFrom(e.target.value)}
                    >
                      <option value="main_savings">Main Savings</option>
                      <option value="reserve_fund">Reserve Fund</option>
                      <option value="emergency_fund">Emergency Fund</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="expenseDate">Expense Date *</label>
                  <input
                    type="date"
                    id="expenseDate"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="projectId">Project (Optional)</label>
                  <select
                    id="projectId"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    <option value="">No Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                {isLoading('addExpense') ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <button type="submit" className="btn btn--primary">
                      Add Expense
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
              <h2>Edit Expense</h2>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowEditForm(false);
                  setEditingExpense(null);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="expense-form">
              <div className="form-section">
                <h3 className="form-section-title">Expense Information</h3>
                <div className="form-group">
                  <label htmlFor="editReason">Reason *</label>
                  <input
                    type="text"
                    id="editReason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter expense reason"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="editAmount">Amount (৳) *</label>
                  <input
                    type="number"
                    id="editAmount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter expense amount"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="editCategory">Category *</label>
                  <select
                    id="editCategory"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select category</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Professional Fees">Professional Fees</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="form-divider"></div>
              
              <div className="form-section">
                <h3 className="form-section-title">Expense Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="editExpenseBy">Expense By *</label>
                    <input
                      type="text"
                      id="editExpenseBy"
                      value={expenseBy}
                      onChange={(e) => setExpenseBy(e.target.value)}
                      placeholder="Enter person name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="editDeductFrom">Deduct From *</label>
                    <select
                      id="editDeductFrom"
                      value={deductFrom}
                      onChange={(e) => setDeductFrom(e.target.value)}
                    >
                      <option value="main_savings">Main Savings</option>
                      <option value="reserve_fund">Reserve Fund</option>
                      <option value="emergency_fund">Emergency Fund</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="editExpenseDate">Expense Date *</label>
                  <input
                    type="date"
                    id="editExpenseDate"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="editProjectId">Project (Optional)</label>
                  <select
                    id="editProjectId"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    <option value="">No Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                {isLoading('editExpense') ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <button type="submit" className="btn btn--primary">
                      Update Expense
                    </button>
                    <button 
                      type="button" 
                      className="btn btn--secondary"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingExpense(null);
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

export default Expenses;
