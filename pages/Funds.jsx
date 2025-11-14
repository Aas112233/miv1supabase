import React, { useState, useEffect } from 'react';
import { getFunds, getFundTransactions, createFundTransaction, approveTransaction, rejectTransaction, getMemberAllocations, createTransfer, getFundSummary, deleteFund } from '../api/fundsService';
import { supabase } from '../src/config/supabaseClient';
import { deleteFundTransaction } from '../api/fundTransactionsService';
import membersService from '../api/membersService';
import masterDataService from '../api/masterDataService';
import { useLanguage } from '../contexts/LanguageContext';
import { FaWallet, FaExchangeAlt, FaUsers, FaCheckCircle, FaTimesCircle, FaPlus, FaPiggyBank } from 'react-icons/fa';
import './Funds.css';

const Funds = () => {
  const { t: translations } = useLanguage();
  const t = (key) => {
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };
  const [activeTab, setActiveTab] = useState('overview');
  const [funds, setFunds] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [cashierSavings, setCashierSavings] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [projectInvestments, setProjectInvestments] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab, filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const fundsData = await getFunds();
        const summaryData = await getFundSummary();
        const investmentsData = await getProjectInvestments();
        const investmentStats = calculateInvestmentStats(investmentsData);
        setSummary({...summaryData, ...investmentStats});
        setFunds(fundsData);
      } else if (activeTab === 'transactions') {
        const status = filterStatus === 'all' ? null : filterStatus;
        const txns = await getFundTransactions(null, status);
        setTransactions(txns);
      } else if (activeTab === 'members') {
        const allocs = await getMemberAllocations();
        setAllocations(allocs);
      } else if (activeTab === 'balances') {
        const fundsData = await getFunds();
        setFunds(fundsData);
      } else if (activeTab === 'transfers') {
        const transfers = await getFundTransactions();
        setTransactions(transfers);
      } else if (activeTab === 'approvals') {
        const pending = await getFundTransactions(null, 'pending');
        setTransactions(pending);
      } else if (activeTab === 'savings') {
        const savingsData = await getCashierSavings();
        setCashierSavings(savingsData);
      } else if (activeTab === 'investments') {
        const investmentsData = await getProjectInvestments();
        setProjectInvestments(investmentsData);
      }
      
      if (!members.length) {
        const membersData = await membersService.getAllMembers();
        setMembers(membersData);
      }
      if (!funds.length && activeTab !== 'overview') {
        const fundsData = await getFunds();
        setFunds(fundsData);
      }
      if (!transactionTypes.length) {
        const types = await masterDataService.getMasterDataByCategory('fund_transaction_type');
        setTransactionTypes(types);
      }
      if (!cashiers.length) {
        const cashiersList = await masterDataService.getMasterDataByCategory('cashier_name');
        setCashiers(cashiersList);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setFormData({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'transaction') {
        await createFundTransaction(formData);
      } else if (modalType === 'transfer') {
        await createTransfer(
          formData.from_fund_id, 
          formData.to_fund_id, 
          parseFloat(formData.amount), 
          formData.description
        );
      } else if (modalType === 'cashier_transfer') {
        await createCashierTransfer(formData);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    }
  };

  const createCashierTransfer = async (transferData) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('cashier_transfers')
      .insert([{
        from_cashier_name: transferData.from_cashier_name,
        to_cashier_name: transferData.to_cashier_name || null,
        to_fund_id: transferData.to_fund_id || null,
        amount: parseFloat(transferData.amount),
        description: transferData.description,
        transfer_date: transferData.transfer_date || new Date().toISOString().split('T')[0],
        created_by: user.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const getCashierSavings = async () => {
    // Get payments grouped by cashier
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('cashier_name, amount');
    
    if (paymentsError) throw paymentsError;
    
    // Get cashier transfers
    const { data: transfers, error: transfersError } = await supabase
      .from('cashier_transfers')
      .select('from_cashier_name, to_cashier_name, to_fund_id, amount');
    
    if (transfersError) throw transfersError;
    
    // Calculate total by cashier
    const cashierTotals = {};
    
    // Add payments
    payments?.forEach(payment => {
      const cashier = payment.cashier_name || 'Unknown';
      cashierTotals[cashier] = (cashierTotals[cashier] || 0) + parseFloat(payment.amount || 0);
    });
    
    // Subtract outgoing transfers
    transfers?.forEach(transfer => {
      if (transfer.from_cashier_name) {
        const cashier = transfer.from_cashier_name;
        cashierTotals[cashier] = (cashierTotals[cashier] || 0) - parseFloat(transfer.amount || 0);
      }
      // Add incoming transfers to cashier
      if (transfer.to_cashier_name) {
        const cashier = transfer.to_cashier_name;
        cashierTotals[cashier] = (cashierTotals[cashier] || 0) + parseFloat(transfer.amount || 0);
      }
    });
    
    // Convert to array format
    return Object.entries(cashierTotals).map(([name, amount]) => ({
      id: name,
      cashier_name: name,
      total_amount: amount
    }));
  };

  const getProjectInvestments = async () => {
    const { data, error } = await supabase
      .from('project_investments')
      .select(`
        *,
        project:projects(id, name, status),
        member:members(id, name)
      `)
      .order('investment_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  };

  const calculateInvestmentStats = (investments) => {
    const totalInvestment = investments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
    const activeProjects = [...new Set(investments.filter(inv => inv.project?.status === 'Active').map(inv => inv.project_id))].length;
    return {
      totalInvestment,
      activeProjects,
      totalInvestors: [...new Set(investments.map(inv => inv.member_id))].length
    };
  };



  const handleApprove = async (id) => {
    if (!window.confirm('Approve this transaction?')) return;
    try {
      await approveTransaction(id);
      loadData();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await rejectTransaction(id, reason);
      loadData();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDeleteFund = async (fundId, fundName) => {
    if (!window.confirm(`Are you sure you want to delete "${fundName}"? This action cannot be undone.`)) return;
    try {
      await deleteFund(fundId);
      loadData();
      alert('Fund deleted successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDeleteTransaction = async (txnId) => {
    if (!window.confirm('Are you sure you want to delete this transaction? Fund balances will be recalculated.')) return;
    try {
      await deleteFundTransaction(txnId);
      loadData();
      alert('Transaction deleted successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const formatCurrency = (amount) => {
    return `৳${parseFloat(amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedAllocations = () => {
    if (!sortConfig.key) return allocations;
    
    return [...allocations].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (sortConfig.key === 'member') {
        aVal = a.member?.name || '';
        bVal = b.member?.name || '';
      } else if (sortConfig.key === 'fund') {
        aVal = a.fund?.name || '';
        bVal = b.fund?.name || '';
      } else if (sortConfig.key === 'allocated_amount' || sortConfig.key === 'allocation_percentage') {
        aVal = parseFloat(aVal || 0);
        bVal = parseFloat(bVal || 0);
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  if (loading) {
    return (
      <div className="funds-container">
        <div className="funds-header">
          <h1>{t('funds.title')}</h1>
        </div>
        <div className="tabs">
          {['Overview', 'Fund Balances', 'Transactions', 'Transfers', 'Members', 'Approvals'].map((tab, i) => (
            <button key={i} className="skeleton skeleton-tab"></button>
          ))}
        </div>
        <div className="skeleton-cards">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton skeleton-card"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="funds-container">
      <div className="funds-header">
        <h1>{t('funds.title')}</h1>
      </div>

      <div className="tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          <FaWallet /> {t('funds.overview')}
        </button>
        <button className={activeTab === 'balances' ? 'active' : ''} onClick={() => setActiveTab('balances')}>
          {t('funds.fundBalances')}
        </button>
        <button className={activeTab === 'transactions' ? 'active' : ''} onClick={() => setActiveTab('transactions')}>
          {t('funds.transactions')}
        </button>
        <button className={activeTab === 'transfers' ? 'active' : ''} onClick={() => setActiveTab('transfers')}>
          <FaExchangeAlt /> Fund Transfers
        </button>
        <button className={activeTab === 'members' ? 'active' : ''} onClick={() => setActiveTab('members')}>
          <FaUsers /> {t('funds.members')}
        </button>
        <button className={activeTab === 'approvals' ? 'active' : ''} onClick={() => setActiveTab('approvals')}>
          <FaCheckCircle /> {t('funds.approvals')}
        </button>
        <button className={activeTab === 'savings' ? 'active' : ''} onClick={() => setActiveTab('savings')}>
          <FaPiggyBank /> Fund Savings
        </button>
        <button className={activeTab === 'investments' ? 'active' : ''} onClick={() => setActiveTab('investments')}>
          <FaWallet /> Project Investments
        </button>
      </div>

      {activeTab === 'overview' && summary && (
        <div className="overview-tab">
          <div className="summary-cards">
            <div className="summary-card">
              <h3>{t('funds.totalBalance')}</h3>
              <p className="amount">{formatCurrency(summary.totalBalance)}</p>
            </div>
            <div className="summary-card">
              <h3>{t('funds.activeFunds')}</h3>
              <p className="amount">{summary.funds.filter(f => f.is_active).length}</p>
            </div>
            <div className="summary-card">
              <h3>{t('funds.pendingApprovals')}</h3>
              <p className="amount">{summary.pendingTransactions}</p>
            </div>
            <div className="summary-card">
              <h3>Total Investments</h3>
              <p className="amount">{formatCurrency(summary.totalInvestment || 0)}</p>
            </div>
            <div className="summary-card">
              <h3>Active Projects</h3>
              <p className="amount">{summary.activeProjects || 0}</p>
            </div>
            <div className="summary-card">
              <h3>Total Investors</h3>
              <p className="amount">{summary.totalInvestors || 0}</p>
            </div>
          </div>

          <div className="funds-grid">
            {funds.map(fund => (
              <div key={fund.id} className="fund-card">
                <h3>{fund.name}</h3>
                <p className="fund-type">{fund.fund_type}</p>
                <p className="fund-balance">{formatCurrency(fund.current_balance)}</p>
                <p className="fund-desc">{fund.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="transactions-tab">
          <div className="tab-actions">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={() => openModal('transaction')} className="btn-primary">
              <FaPlus /> Add Transaction
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Fund</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => (
                <tr key={txn.id}>
                  <td>{new Date(txn.transaction_date).toLocaleDateString()}</td>
                  <td>{txn.fund?.name}</td>
                  <td>{txn.transaction_type}</td>
                  <td className={txn.transaction_type === 'deposit' ? 'positive' : 'negative'}>
                    {formatCurrency(txn.amount)}
                  </td>
                  <td>{txn.description}</td>
                  <td>
                    <span className={`status-badge ${txn.status}`}>{txn.status}</span>
                  </td>
                  <td>
                    {txn.transaction_type !== 'deposit' && (
                      <button onClick={() => handleDeleteTransaction(txn.id)} className="btn-reject">
                        <FaTimesCircle /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'balances' && (
        <div className="balances-tab">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('funds.fundName')}</th>
                <th>{t('funds.fundType')}</th>
                <th>{t('funds.currentBalance')}</th>
                <th>{t('funds.status')}</th>
                <th>{t('funds.description')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {funds.map(fund => (
                <tr key={fund.id}>
                  <td>{fund.name}</td>
                  <td><span className="fund-type">{fund.fund_type}</span></td>
                  <td className="fund-balance">{formatCurrency(fund.current_balance)}</td>
                  <td>{fund.is_active ? t('funds.active') : t('funds.inactive')}</td>
                  <td>{fund.description}</td>
                  <td>
                    <button onClick={() => handleDeleteFund(fund.id, fund.name)} className="btn-reject">
                      <FaTimesCircle /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="transfers-tab">
          <div className="tab-actions">
            <div></div>
            <button onClick={() => openModal('transfer')} className="btn-primary">
              <FaExchangeAlt /> New Transfer
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>From Fund</th>
                <th>To Fund</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.filter(t => t.transaction_type === 'transfer').map(txn => (
                <tr key={txn.id}>
                  <td>{new Date(txn.transaction_date).toLocaleDateString()}</td>
                  <td>{txn.fund?.name}</td>
                  <td>{txn.to_fund?.name}</td>
                  <td>{formatCurrency(txn.amount)}</td>
                  <td>{txn.description}</td>
                  <td>
                    <span className={`status-badge ${txn.status}`}>{txn.status}</span>
                  </td>
                  <td>
                    <button onClick={() => handleDeleteTransaction(txn.id)} className="btn-reject">
                      <FaTimesCircle /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="members-tab">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('member')} style={{ cursor: 'pointer' }}>
                  {t('funds.member')} {sortConfig.key === 'member' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('fund')} style={{ cursor: 'pointer' }}>
                  {t('funds.fund')} {sortConfig.key === 'fund' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('allocated_amount')} style={{ cursor: 'pointer' }}>
                  {t('funds.allocableAmount')} {sortConfig.key === 'allocated_amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('allocation_percentage')} style={{ cursor: 'pointer' }}>
                  {t('funds.percentage')} {sortConfig.key === 'allocation_percentage' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {getSortedAllocations().map(alloc => (
                <tr key={alloc.id}>
                  <td>{alloc.member?.name}</td>
                  <td>{alloc.fund?.name}</td>
                  <td>{formatCurrency(alloc.allocated_amount)}</td>
                  <td>{parseFloat(alloc.allocation_percentage || 0).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="approvals-tab">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Fund</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => (
                <tr key={txn.id}>
                  <td>{new Date(txn.transaction_date).toLocaleDateString()}</td>
                  <td>{txn.fund?.name}</td>
                  <td>{txn.transaction_type}</td>
                  <td>{formatCurrency(txn.amount)}</td>
                  <td>{txn.description}</td>
                  <td>
                    <button onClick={() => handleApprove(txn.id)} className="btn-approve">
                      <FaCheckCircle /> Approve
                    </button>
                    <button onClick={() => handleReject(txn.id)} className="btn-reject">
                      <FaTimesCircle /> Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'savings' && (
        <div className="savings-tab">
          <div className="tab-actions">
            <div></div>
            <button onClick={() => openModal('cashier_transfer')} className="btn-primary">
              <FaExchangeAlt /> Cashier Transfer
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Cashier Name</th>
                <th>Total Amount Held</th>
              </tr>
            </thead>
            <tbody>
              {cashierSavings.map(saving => (
                <tr key={saving.id}>
                  <td>{saving.cashier_name}</td>
                  <td className="positive">{formatCurrency(saving.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'investments' && (
        <div className="investments-tab">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th>Member</th>
                <th>Shares</th>
                <th>Amount</th>
                <th>Deducted From</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projectInvestments.map(inv => (
                <tr key={inv.id}>
                  <td>{new Date(inv.investment_date).toLocaleDateString()}</td>
                  <td>{inv.project?.name || 'N/A'}</td>
                  <td>{inv.member?.name || 'N/A'}</td>
                  <td>{inv.shares}</td>
                  <td className="positive">{formatCurrency(inv.amount)}</td>
                  <td>{inv.deducted_from_cashier}</td>
                  <td>
                    <span className={`status-badge ${inv.project?.status?.toLowerCase() || 'active'}`}>
                      {inv.project?.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modalType === 'transaction' ? 'Add Transaction' : modalType === 'transfer' ? 'Transfer Funds' : 'Cashier Transfer'}</h2>
            <form onSubmit={handleSubmit}>
              {modalType === 'transaction' ? (
                <>
                  <div className="form-group">
                    <label>Fund</label>
                    <select required value={formData.fund_id || ''} onChange={(e) => setFormData({...formData, fund_id: e.target.value})}>
                      <option value="">Select Fund</option>
                      {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select required value={formData.transaction_type || ''} onChange={(e) => setFormData({...formData, transaction_type: e.target.value})}>
                      <option value="">Select Type</option>
                      {transactionTypes.filter(t => !['transfer', 'expense', 'investment'].includes(t.value)).map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input type="number" step="0.01" required value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" required value={formData.transaction_date || ''} onChange={(e) => setFormData({...formData, transaction_date: e.target.value})} />
                  </div>
                </>
              ) : modalType === 'transfer' ? (
                <>
                  <div className="form-group">
                    <label>From Fund</label>
                    <select required value={formData.from_fund_id || ''} onChange={(e) => setFormData({...formData, from_fund_id: e.target.value})}>
                      <option value="">Select Fund</option>
                      {funds.map(f => <option key={f.id} value={f.id}>{f.name} ({formatCurrency(f.current_balance)})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>To Fund</label>
                    <select required value={formData.to_fund_id || ''} onChange={(e) => setFormData({...formData, to_fund_id: e.target.value})}>
                      <option value="">Select Fund</option>
                      {funds.filter(f => f.id !== formData.from_fund_id).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input type="number" step="0.01" required value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </div>
                </>
              ) : modalType === 'cashier_transfer' ? (
                <>
                  <div className="form-group">
                    <label>From Cashier</label>
                    <select required value={formData.from_cashier_name || ''} onChange={(e) => setFormData({...formData, from_cashier_name: e.target.value})}>
                      <option value="">Select Cashier</option>
                      {cashiers.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Transfer To</label>
                    <select required value={formData.transfer_to_type || ''} onChange={(e) => {
                      setFormData({...formData, transfer_to_type: e.target.value, to_cashier_id: '', to_fund_id: ''});
                    }}>
                      <option value="">Select Type</option>
                      <option value="cashier">Another Cashier</option>
                      <option value="fund">Fund</option>
                    </select>
                  </div>
                  {formData.transfer_to_type === 'cashier' && (
                    <div className="form-group">
                      <label>To Cashier</label>
                      <select required value={formData.to_cashier_name || ''} onChange={(e) => setFormData({...formData, to_cashier_name: e.target.value})}>
                        <option value="">Select Cashier</option>
                        {cashiers.filter(c => c.value !== formData.from_cashier_name).map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                      </select>
                    </div>
                  )}
                  {formData.transfer_to_type === 'fund' && (
                    <div className="form-group">
                      <label>To Fund</label>
                      <select required value={formData.to_fund_id || ''} onChange={(e) => setFormData({...formData, to_fund_id: e.target.value})}>
                        <option value="">Select Fund</option>
                        {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Amount</label>
                    <input type="number" step="0.01" required value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" required value={formData.transfer_date || ''} onChange={(e) => setFormData({...formData, transfer_date: e.target.value})} />
                  </div>
                </>
              ) : null}
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Submit</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Funds;
