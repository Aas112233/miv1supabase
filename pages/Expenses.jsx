import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import { hasWritePermission } from '../components/PermissionChecker';
import expensesService from '../api/expensesService';
import { getFunds, createFundTransaction } from '../api/fundsService';
import membersService from '../api/membersService';
import masterDataService from '../api/masterDataService';
import { getUserFriendlyError } from '../src/utils/errorHandler';
import './Expenses.css';

const Expenses = ({ expenses, setExpenses, projects, currentUser }) => {
  const { t: translations } = useLanguage();
  const t = (key) => key.split('.').reduce((obj, k) => obj?.[k], translations) || key;
  
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [expenseBy, setExpenseBy] = useState('');
  const [deductFrom, setDeductFrom] = useState('');
  const [memberId, setMemberId] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [funds, setFunds] = useState([]);
  const [members, setMembers] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [projectCashiers, setProjectCashiers] = useState([]);
  
  const { addToast } = useToast();
  const { startLoading, stopLoading, isLoading } = useLoading();

  useEffect(() => {
    loadFundsAndMembers();
    loadExpenseCategories();
    loadProjectCashiers();
  }, []);

  const getFundName = (fundId) => {
    const fund = funds.find(f => f.id === fundId);
    return fund ? fund.name : fundId;
  };

  const loadFundsAndMembers = async () => {
    try {
      const [fundsData, membersData] = await Promise.all([
        getFunds(),
        membersService.getAllMembers()
      ]);
      setFunds(fundsData);
      setMembers(membersData);
      if (fundsData.length > 0) {
        const mainSavings = fundsData.find(f => f.name === 'Main Savings Fund');
        setDeductFrom(mainSavings?.id || fundsData[0].id);
      }
    } catch (error) {
      console.error('Error loading funds and members:', error);
    }
  };

  const loadExpenseCategories = async () => {
    try {
      const categories = await masterDataService.getMasterDataByCategory('expense_category');
      setExpenseCategories(categories);
    } catch (error) {
      console.error('Error loading expense categories:', error);
    }
  };

  const loadProjectCashiers = async () => {
    try {
      const projectsService = (await import('../api/projectsService')).default;
      const allProjects = await projectsService.getAllProjects();
      const uniqueCashiers = [...new Set(allProjects
        .filter(p => p.project_cashier_name)
        .map(p => p.project_cashier_name))];
      setProjectCashiers(uniqueCashiers);
    } catch (error) {
      console.error('Error loading project cashiers:', error);
    }
  };

  const isMainSavingsFund = () => {
    const selectedFund = funds.find(f => f.id === deductFrom);
    return selectedFund?.name === 'Main Savings Fund';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    
    const errors = {};
    
    if (!reason.trim()) errors.reason = 'Expense reason is required';
    if (!amount || parseFloat(amount) <= 0) errors.amount = 'Valid amount is required';
    if (!category) errors.category = 'Category is required';
    if (!expenseBy.trim()) errors.expenseBy = 'Expense by is required';
    if (!deductFrom) errors.deductFrom = 'Please select a fund';
    if (!expenseDate) errors.expenseDate = 'Expense date is required';
    if (!isMainSavingsFund() && !memberId) errors.memberId = 'Member is required';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      addToast('Please fix the errors in the form', 'error');
      return;
    }
    
    // Check fund balance
    const selectedFund = funds.find(f => f.id === deductFrom);
    const expenseAmount = parseFloat(amount);
    const currentBalance = parseFloat(selectedFund?.current_balance || 0);
    
    if (currentBalance < expenseAmount) {
      setFieldErrors({ 
        amount: `Insufficient funds! Available: ৳${currentBalance.toFixed(2)}`,
        deductFrom: 'Selected fund has insufficient balance'
      });
      addToast(
        `Insufficient funds! ${selectedFund?.name} has ৳${currentBalance.toFixed(2)} but expense is ৳${expenseAmount.toFixed(2)}`,
        'error'
      );
      return;
    }
    
    startLoading('addExpense');
    
    try {
      const newExpense = {
        reason,
        amount: expenseAmount,
        category,
        expenseBy,
        deductFrom,
        expenseDate,
        projectId: projectId || null
      };
      
      const createdExpense = await expensesService.createExpense(newExpense);
      
      // Create fund transaction
      try {
        await createFundTransaction({
          fund_id: deductFrom,
          transaction_type: 'expense',
          amount: expenseAmount,
          description: `Expense: ${reason} by ${expenseBy}`,
          transaction_date: expenseDate,
          status: 'approved',
          source_type: 'expense',
          source_id: createdExpense.id.toString()
        });
      } catch (fundError) {
        console.error('Fund transaction error:', fundError);
        // Expense created but fund transaction failed - still show success
        addToast('Expense added but fund transaction may need manual review', 'warning');
      }
      
      // Refresh funds to show updated balance
      const updatedFunds = await getFunds();
      setFunds(updatedFunds);
      
      setExpenses([...expenses, createdExpense]);
      setReason('');
      setAmount('');
      setCategory('');
      setExpenseBy('');
      setMemberId('');
      setExpenseDate('');
      setProjectId('');
      setFieldErrors({});
      setShowForm(false);
      
      addToast(`Expense added successfully! New ${selectedFund?.name} balance: ৳${(currentBalance - expenseAmount).toFixed(2)}`, 'success');
    } catch (error) {
      console.error('Expense creation error:', error);
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
    setDeductFrom(expense.deduct_from || expense.deductFrom || '');
    setMemberId('');
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
        <h2>{t('expenses.title')}</h2>
        {hasWritePermission(currentUser, 'expenses') && (
          <button 
            className="btn btn--primary" 
            onClick={() => {
              setReason('');
              setAmount('');
              setCategory('');
              setExpenseBy('');
              setMemberId('');
              setExpenseDate('');
              setProjectId('');
              if (funds.length > 0) {
                const mainSavings = funds.find(f => f.name === 'Main Savings Fund');
                setDeductFrom(mainSavings?.id || funds[0].id);
              }
              setShowForm(true);
            }}
          >
            {t('expenses.addExpense')}
          </button>
        )}
      </div>

      <div className="expenses-stats">
        <div className="stat-card">
          <div className="stat-value">{totalTransactions}</div>
          <div className="stat-label">{t('expenses.totalExpenses')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">৳{totalExpenses.toFixed(2)}</div>
          <div className="stat-label">{t('expenses.totalAmount')}</div>
        </div>
      </div>

      <div className="expenses-list">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{t('expenses.reason')}</th>
              <th>{t('expenses.amount')}</th>
              <th>{t('expenses.category')}</th>
              <th>{t('expenses.expenseBy')}</th>
              <th>{t('expenses.deductFrom')}</th>
              <th>{t('expenses.project')}</th>
              <th>{t('expenses.date')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} onClick={() => {
                setSelectedExpense(expense);
                setShowDetailsModal(true);
              }} style={{ cursor: 'pointer' }}>
                <td>{expense.id}</td>
                <td>{expense.reason}</td>
                <td>{expense.amount.toFixed(2)}</td>
                <td>{expense.category}</td>
                <td>{expense.expense_by || expense.expenseBy}</td>
                <td>{getFundName(expense.deduct_from || expense.deductFrom)}</td>
                <td>{expense.project_id ? projects.find(p => p.id === expense.project_id)?.name || 'N/A' : 'N/A'}</td>
                <td>{expense.expense_date || expense.expenseDate}</td>
                <td onClick={(e) => e.stopPropagation()}>
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
                        <span>{t('common.edit')}</span>
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
              <h2>{t('expenses.addExpense')}</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="expense-form">
              <div className="form-section">
                <h3 className="form-section-title">{t('expenses.expenseInfo')}</h3>
                <div className="form-group">
                  <label htmlFor="reason">{t('expenses.reason')} *</label>
                  <input
                    type="text"
                    id="reason"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setFieldErrors(prev => ({...prev, reason: ''}));
                    }}
                    placeholder="Enter expense reason"
                    className={fieldErrors.reason ? 'input-error' : ''}
                  />
                  {fieldErrors.reason && <span className="error-text">{fieldErrors.reason}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="amount">{t('expenses.amount')} (৳) *</label>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setFieldErrors(prev => ({...prev, amount: ''}));
                    }}
                    placeholder="Enter expense amount"
                    min="0"
                    step="0.01"
                    className={fieldErrors.amount ? 'input-error' : ''}
                  />
                  {fieldErrors.amount && <span className="error-text">{fieldErrors.amount}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="category">{t('expenses.category')} *</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setFieldErrors(prev => ({...prev, category: ''}));
                    }}
                    className={fieldErrors.category ? 'input-error' : ''}
                  >
                    <option value="">{t('expenses.selectCategory')}</option>
                    {expenseCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.value}</option>
                    ))}
                  </select>
                  {fieldErrors.category && <span className="error-text">{fieldErrors.category}</span>}
                </div>
              </div>
              
              <div className="form-divider"></div>
              
              <div className="form-section">
                <h3 className="form-section-title">{t('expenses.expenseDetails')}</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="expenseBy">{t('expenses.expenseBy')} *</label>
                    <input
                      type="text"
                      id="expenseBy"
                      value={expenseBy}
                      onChange={(e) => {
                        setExpenseBy(e.target.value);
                        setFieldErrors(prev => ({...prev, expenseBy: ''}));
                      }}
                      placeholder="Enter person name"
                      className={fieldErrors.expenseBy ? 'input-error' : ''}
                    />
                    {fieldErrors.expenseBy && <span className="error-text">{fieldErrors.expenseBy}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="deductFrom">{t('expenses.deductFrom')} *</label>
                    <select
                      id="deductFrom"
                      value={deductFrom}
                      onChange={(e) => {
                        setDeductFrom(e.target.value);
                        setFieldErrors(prev => ({...prev, deductFrom: '', memberId: ''}));
                      }}
                      className={fieldErrors.deductFrom ? 'input-error' : ''}
                    >
                      <option value="">{t('expenses.selectFund')}</option>
                      <optgroup label="Savings Funds">
                        {funds.map(fund => (
                          <option key={fund.id} value={fund.id}>
                            {fund.name} (৳{parseFloat(fund.current_balance || 0).toFixed(2)})
                          </option>
                        ))}
                      </optgroup>
                      {projectCashiers.length > 0 && (
                        <optgroup label="Investment Funds">
                          {projectCashiers.map(cashier => (
                            <option key={`project_${cashier}`} value={`project_cashier:${cashier}`}>
                              {cashier} (Investment Fund)
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    {fieldErrors.deductFrom && <span className="error-text">{fieldErrors.deductFrom}</span>}
                  </div>
                </div>
                
                {!isMainSavingsFund() && (
                  <div className="form-group">
                    <label htmlFor="memberId">{t('expenses.member')} *</label>
                    <select
                      id="memberId"
                      value={memberId}
                      onChange={(e) => {
                        setMemberId(e.target.value);
                        setFieldErrors(prev => ({...prev, memberId: ''}));
                      }}
                      className={fieldErrors.memberId ? 'input-error' : ''}
                    >
                      <option value="">{t('expenses.selectMember')}</option>
                      {members.filter(m => m.isActive).map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                    {fieldErrors.memberId && <span className="error-text">{fieldErrors.memberId}</span>}
                    {!fieldErrors.memberId && <small className="form-hint">Required for non-Main Savings fund expenses</small>}
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="expenseDate">{t('expenses.expenseDate')} *</label>
                  <input
                    type="date"
                    id="expenseDate"
                    value={expenseDate}
                    onChange={(e) => {
                      setExpenseDate(e.target.value);
                      setFieldErrors(prev => ({...prev, expenseDate: ''}));
                    }}
                    className={fieldErrors.expenseDate ? 'input-error' : ''}
                  />
                  {fieldErrors.expenseDate && <span className="error-text">{fieldErrors.expenseDate}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="projectId">{t('expenses.project')} ({t('expenses.optional')})</label>
                  <select
                    id="projectId"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    <option value="">{t('expenses.noProject')}</option>
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
                      {t('expenses.addExpense')}
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
              <h2>{t('expenses.editExpense')}</h2>
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
                    {expenseCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.value}</option>
                    ))}
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
                    <label htmlFor="editDeductFrom">Deduct From Fund *</label>
                    <select
                      id="editDeductFrom"
                      value={deductFrom}
                      onChange={(e) => setDeductFrom(e.target.value)}
                    >
                      <option value="">Select Fund</option>
                      <optgroup label="Savings Funds">
                        {funds.map(fund => (
                          <option key={fund.id} value={fund.id}>
                            {fund.name} (৳{parseFloat(fund.current_balance || 0).toFixed(2)})
                          </option>
                        ))}
                      </optgroup>
                      {projectCashiers.length > 0 && (
                        <optgroup label="Investment Funds">
                          {projectCashiers.map(cashier => (
                            <option key={`project_${cashier}`} value={`project_cashier:${cashier}`}>
                              {cashier} (Investment Fund)
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>
                
                {!isMainSavingsFund() && (
                  <div className="form-group">
                    <label htmlFor="editMemberId">Member *</label>
                    <select
                      id="editMemberId"
                      value={memberId}
                      onChange={(e) => setMemberId(e.target.value)}
                    >
                      <option value="">Select Member</option>
                      {members.filter(m => m.isActive).map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                    <small className="form-hint">Required for non-Main Savings fund expenses</small>
                  </div>
                )}
                
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
                      {t('common.update')}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn--secondary"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingExpense(null);
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

      {showDetailsModal && selectedExpense && (
        <div className="overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="overlay-content expense-details" onClick={(e) => e.stopPropagation()}>
            <div className="overlay-header">
              <h2>{t('expenses.expenseDetails')}</h2>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="details-body">
              <div className="detail-row">
                <span className="detail-label">ID:</span>
                <span className="detail-value">{selectedExpense.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('expenses.reason')}:</span>
                <span className="detail-value">{selectedExpense.reason}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('expenses.amount')}:</span>
                <span className="detail-value">৳{selectedExpense.amount.toFixed(2)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('expenses.category')}:</span>
                <span className="detail-value">{selectedExpense.category}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('expenses.expenseBy')}:</span>
                <span className="detail-value">{selectedExpense.expense_by || selectedExpense.expenseBy}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('expenses.deductFrom')}:</span>
                <span className="detail-value">{getFundName(selectedExpense.deduct_from || selectedExpense.deductFrom)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('expenses.project')}:</span>
                <span className="detail-value">{selectedExpense.project_id ? projects.find(p => p.id === selectedExpense.project_id)?.name || 'N/A' : 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('expenses.date')}:</span>
                <span className="detail-value">{selectedExpense.expense_date || selectedExpense.expenseDate}</span>
              </div>
            </div>
            {hasWritePermission(currentUser, 'expenses') && (
              <div className="details-actions">
                <button className="btn btn--secondary" onClick={() => {
                  setShowDetailsModal(false);
                  handleEdit(selectedExpense);
                }}>{t('common.edit')}</button>
                <button className="btn btn--danger" onClick={() => {
                  setShowDetailsModal(false);
                  handleDelete(selectedExpense.id);
                }}>{t('common.delete')}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
