import React, { useState, useEffect } from 'react';
import { supabase } from '../src/config/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ExcelJS from 'exceljs';
import './Reports.css';

const Reports = ({ members, payments, requests }) => {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [generatedReport, setGeneratedReport] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv');
  
  const { addToast } = useToast();
  const { startLoading, stopLoading, isLoading } = useLoading();

  // Generate summary report data
  const generateSummaryReport = () => {
    const totalMembers = members.length;
    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalTransactions = payments.length;
    const pendingRequests = requests.filter(req => req.status === 'pending').length;
    const approvedRequests = requests.filter(req => req.status === 'approved').length;
    
    return {
      title: 'Summary Report',
      data: {
        totalMembers,
        totalPayments: totalPayments.toFixed(2),
        totalTransactions,
        pendingRequests,
        approvedRequests
      }
    };
  };

  // Generate payment report data
  const generatePaymentReport = async () => {
    let query = supabase
      .from('payments')
      .select('*, member:members(name)')
      .order('payment_date', { ascending: false });
    
    if (dateRange.start && dateRange.end) {
      query = query.gte('payment_date', dateRange.start).lte('payment_date', dateRange.end);
    }
    
    const { data: paymentsData } = await query;
    const totalAmount = paymentsData?.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) || 0;
    
    return {
      title: 'Payment Report',
      data: {
        totalAmount: totalAmount.toFixed(2),
        transactionCount: paymentsData?.length || 0,
        payments: paymentsData || []
      }
    };
  };

  // Generate investment report
  const generateInvestmentReport = async () => {
    let query = supabase
      .from('project_investments')
      .select('*, project:projects(name), member:members(name)')
      .order('investment_date', { ascending: false });
    
    if (dateRange.start && dateRange.end) {
      query = query.gte('investment_date', dateRange.start).lte('investment_date', dateRange.end);
    }
    
    const { data: investments } = await query;
    const totalInvested = investments?.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0) || 0;
    
    return {
      title: 'Investment Report',
      data: {
        totalInvested: totalInvested.toFixed(2),
        count: investments?.length || 0,
        investments: investments || []
      }
    };
  };

  // Generate transaction report
  const generateTransactionReport = async () => {
    let query = supabase
      .from('transactions')
      .select('*, member:members(name)')
      .order('transaction_date', { ascending: false });
    
    if (dateRange.start && dateRange.end) {
      query = query.gte('transaction_date', dateRange.start).lte('transaction_date', dateRange.end);
    }
    
    const { data: transactions } = await query;
    const totalAmount = transactions?.reduce((sum, txn) => sum + parseFloat(txn.amount || 0), 0) || 0;
    
    return {
      title: 'Transaction Report',
      data: {
        totalAmount: totalAmount.toFixed(2),
        count: transactions?.length || 0,
        transactions: transactions || []
      }
    };
  };

  // Generate expense report
  const generateExpenseReport = async () => {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });
    
    if (dateRange.start && dateRange.end) {
      query = query.gte('expense_date', dateRange.start).lte('expense_date', dateRange.end);
    }
    
    const { data: expenses } = await query;
    const totalExpenses = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0) || 0;
    
    return {
      title: 'Expense Report',
      data: {
        totalExpenses: totalExpenses.toFixed(2),
        count: expenses?.length || 0,
        expenses: expenses || []
      }
    };
  };

  // Generate cashier funds report
  const generateCashierReport = async () => {
    const { data: payments } = await supabase
      .from('payments')
      .select('cashier_name, amount');
    
    const { data: transfers } = await supabase
      .from('cashier_transfers')
      .select('from_cashier_name, to_cashier_name, to_fund_id, amount');
    
    const cashierTotals = {};
    
    payments?.forEach(payment => {
      const cashier = payment.cashier_name || 'Unknown';
      cashierTotals[cashier] = (cashierTotals[cashier] || 0) + parseFloat(payment.amount || 0);
    });
    
    transfers?.forEach(transfer => {
      if (transfer.from_cashier_name) {
        cashierTotals[transfer.from_cashier_name] = (cashierTotals[transfer.from_cashier_name] || 0) - parseFloat(transfer.amount || 0);
      }
      if (transfer.to_cashier_name) {
        cashierTotals[transfer.to_cashier_name] = (cashierTotals[transfer.to_cashier_name] || 0) + parseFloat(transfer.amount || 0);
      }
    });
    
    const cashiers = Object.entries(cashierTotals).map(([name, amount]) => ({ name, amount }));
    const totalHeld = cashiers.reduce((sum, c) => sum + c.amount, 0);
    
    return {
      title: 'Cashier Funds Report',
      data: {
        totalHeld: totalHeld.toFixed(2),
        count: cashiers.length,
        cashiers
      }
    };
  };

  // Generate member report data
  const generateMemberReport = () => {
    const memberStats = members.map(member => {
      const memberPayments = payments.filter(payment => payment.memberId === member.id);
      const totalPaid = memberPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      return {
        id: member.id,
        name: member.name,
        contact: member.contact,
        shareAmount: member.shareAmount,
        totalPaid: totalPaid.toFixed(2),
        paymentCount: memberPayments.length
      };
    });
    
    return {
      title: 'Member Report',
      data: {
        members: memberStats
      }
    };
  };

  const handleGenerateReport = async () => {
    startLoading('generateReport');
    
    try {
      let report;
      
      switch (reportType) {
        case 'summary':
          report = generateSummaryReport();
          break;
        case 'payments':
          report = await generatePaymentReport();
          break;
        case 'members':
          report = generateMemberReport();
          break;
        case 'investments':
          report = await generateInvestmentReport();
          break;
        case 'transactions':
          report = await generateTransactionReport();
          break;
        case 'expenses':
          report = await generateExpenseReport();
          break;
        case 'cashier':
          report = await generateCashierReport();
          break;
        default:
          report = generateSummaryReport();
      }
      
      setGeneratedReport(report);
      addToast('Report generated successfully!', 'success');
    } catch (error) {
      addToast('Error generating report: ' + error.message, 'error');
    } finally {
      stopLoading('generateReport');
    }
  };

  const exportToCSV = (data, filename) => {
    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = async (data, filename) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    worksheet.addRows(data);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    const element = document.querySelector('.report-content');
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToImage = async () => {
    const element = document.querySelector('.report-content');
    const canvas = await html2canvas(element);
    canvas.toBlob((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${new Date().toISOString().split('T')[0]}.jpg`;
      a.click();
      window.URL.revokeObjectURL(url);
    }, 'image/jpeg');
  };

  const handleExportReport = async () => {
    if (!generatedReport) return;
    
    if (exportFormat === 'pdf') {
      await exportToPDF();
      addToast('Report exported as PDF!', 'success');
      return;
    }
    
    if (exportFormat === 'jpeg') {
      await exportToImage();
      addToast('Report exported as JPEG!', 'success');
      return;
    }
    
    let csvData = [];
    let filename = '';
    
    switch (reportType) {
      case 'summary':
        filename = 'summary_report';
        csvData = [
          ['Investment Club Summary Report'],
          ['Generated on', new Date().toLocaleDateString()],
          [''],
          ['Metric', 'Value'],
          ['Total Members', generatedReport.data.totalMembers],
          ['Total Payments', `BDT ${generatedReport.data.totalPayments}`],
          ['Total Transactions', generatedReport.data.totalTransactions],
          ['Pending Requests', generatedReport.data.pendingRequests],
          ['Approved Requests', generatedReport.data.approvedRequests]
        ];
        break;
        
      case 'payments':
        filename = 'payment_report';
        csvData = [
          ['Payment Report'],
          ['Generated on', new Date().toLocaleDateString()],
          ['Date Range', `${dateRange.start || 'All'} to ${dateRange.end || 'All'}`],
          [''],
          ['Summary'],
          ['Total Amount', `৳${generatedReport.data.totalAmount}`],
          ['Transaction Count', generatedReport.data.transactionCount],
          [''],
          ['Member', 'Amount', 'Date', 'Method', 'Cashier'],
          ...generatedReport.data.payments.map(p => [
            p.member?.name || 'N/A',
            parseFloat(p.amount).toFixed(2),
            new Date(p.payment_date).toLocaleDateString(),
            p.payment_method || 'N/A',
            p.cashier_name || 'N/A'
          ])
        ];
        break;
        
      case 'members':
        filename = 'member_report';
        csvData = [
          ['Member Report'],
          ['Generated on', new Date().toLocaleDateString()],
          [''],
          ['Name', 'Contact', 'Share Amount', 'Total Paid', 'Payment Count'],
          ...generatedReport.data.members.map(m => [
            m.name,
            m.contact,
            m.shareAmount,
            `BDT ${m.totalPaid}`,
            m.paymentCount
          ])
        ];
        break;
        
      case 'investments':
        filename = 'investment_report';
        csvData = [
          ['Investment Report'],
          ['Generated on', new Date().toLocaleDateString()],
          ['Date Range', `${dateRange.start || 'All'} to ${dateRange.end || 'All'}`],
          [''],
          ['Summary'],
          ['Total Invested', `৳${generatedReport.data.totalInvested}`],
          ['Investment Count', generatedReport.data.count],
          [''],
          ['Project', 'Member', 'Amount', 'Date'],
          ...generatedReport.data.investments.map(inv => [
            inv.project?.name || 'N/A',
            inv.member?.name || 'N/A',
            parseFloat(inv.amount).toFixed(2),
            new Date(inv.investment_date).toLocaleDateString()
          ])
        ];
        break;
        
      case 'transactions':
        filename = 'transaction_report';
        csvData = [
          ['Transaction Report'],
          ['Generated on', new Date().toLocaleDateString()],
          ['Date Range', `${dateRange.start || 'All'} to ${dateRange.end || 'All'}`],
          [''],
          ['Summary'],
          ['Total Amount', `৳${generatedReport.data.totalAmount}`],
          ['Transaction Count', generatedReport.data.count],
          [''],
          ['Date', 'Member', 'Amount', 'Description', 'Status'],
          ...generatedReport.data.transactions.map(txn => [
            new Date(txn.transaction_date).toLocaleDateString(),
            txn.member?.name || 'N/A',
            parseFloat(txn.amount).toFixed(2),
            txn.description || 'N/A',
            txn.status
          ])
        ];
        break;
        
      case 'expenses':
        filename = 'expense_report';
        csvData = [
          ['Expense Report'],
          ['Generated on', new Date().toLocaleDateString()],
          ['Date Range', `${dateRange.start || 'All'} to ${dateRange.end || 'All'}`],
          [''],
          ['Summary'],
          ['Total Expenses', `৳${generatedReport.data.totalExpenses}`],
          ['Expense Count', generatedReport.data.count],
          [''],
          ['Date', 'Category', 'Amount', 'Description'],
          ...generatedReport.data.expenses.map(exp => [
            new Date(exp.expense_date).toLocaleDateString(),
            exp.category || 'N/A',
            parseFloat(exp.amount).toFixed(2),
            exp.description || ''
          ])
        ];
        break;
        
      case 'cashier':
        filename = 'cashier_report';
        csvData = [
          ['Cashier Funds Report'],
          ['Generated on', new Date().toLocaleDateString()],
          [''],
          ['Summary'],
          ['Total Held by Cashiers', `৳${generatedReport.data.totalHeld}`],
          ['Active Cashiers', generatedReport.data.count],
          [''],
          ['Cashier Name', 'Amount Held'],
          ...generatedReport.data.cashiers.map(c => [
            c.name,
            c.amount.toFixed(2)
          ])
        ];
        break;
    }
    
    if (exportFormat === 'excel') {
      exportToExcel(csvData, filename);
      addToast('Report exported as Excel!', 'success');
    } else {
      exportToCSV(csvData, filename);
      addToast('Report exported as CSV!', 'success');
    }
  };

  return (
    <div className="reports">
      <div className="reports-header">
        <h2>Reports</h2>
        <p className="reports-header-subtitle">Generate and export financial reports</p>
      </div>

      <div className="reports-filters">
        <div className="filter-group">
          <label htmlFor="reportType">Report Type:</label>
          <select
            id="reportType"
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value);
              setGeneratedReport(null);
            }}
          >
            <option value="summary">Summary Report</option>
            <option value="payments">Payment Report</option>
            <option value="members">Member Report</option>
            <option value="investments">Investment Report</option>
            <option value="transactions">Transaction Report</option>
            <option value="expenses">Expense Report</option>
            <option value="cashier">Cashier Funds Report</option>
          </select>
        </div>
        
        <div className="filter-group date-filters">
          <div className="date-input">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              value={dateRange.start}
              onChange={(e) => {
                setDateRange({...dateRange, start: e.target.value});
                setGeneratedReport(null);
              }}
            />
          </div>
          
          <div className="date-input">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              value={dateRange.end}
              onChange={(e) => {
                setDateRange({...dateRange, end: e.target.value});
                setGeneratedReport(null);
              }}
            />
          </div>
        </div>
        
        <div className="filter-actions">
          <button 
            className="btn btn--primary"
            onClick={handleGenerateReport}
            disabled={isLoading('generateReport')}
          >
            {isLoading('generateReport') ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {isLoading('generateReport') ? (
        <div className="loading-container">
          <LoadingSpinner message="Generating report..." />
        </div>
      ) : generatedReport ? (
        <div className="report-content">
          <div className="report-header">
            <h3>{generatedReport.title}</h3>
            <div className="export-controls">
              <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
                <option value="jpeg">JPEG</option>
              </select>
              <button 
                className="btn btn--secondary"
                onClick={handleExportReport}
              >
                📥 Export
              </button>
            </div>
          </div>
          
          {reportType === 'summary' && (
            <div className="report-summary">
              <div className="summary-cards">
                <div className="summary-card">
                  <h4>Total Members</h4>
                  <p className="summary-value">{generatedReport.data.totalMembers}</p>
                </div>
                <div className="summary-card">
                  <h4>Total Payments</h4>
                  <p className="summary-value">BDT {generatedReport.data.totalPayments}</p>
                </div>
                <div className="summary-card">
                  <h4>Total Transactions</h4>
                  <p className="summary-value">{generatedReport.data.totalTransactions}</p>
                </div>
                <div className="summary-card">
                  <h4>Pending Requests</h4>
                  <p className="summary-value">{generatedReport.data.pendingRequests}</p>
                </div>
                <div className="summary-card">
                  <h4>Approved Requests</h4>
                  <p className="summary-value">{generatedReport.data.approvedRequests}</p>
                </div>
              </div>
            </div>
          )}
          
          {reportType === 'payments' && (
            <div className="report-payments">
              <div className="report-stats">
                <div className="stat-card">
                  <h4>Total Amount</h4>
                  <p className="stat-value">৳{generatedReport.data.totalAmount}</p>
                </div>
                <div className="stat-card">
                  <h4>Transaction Count</h4>
                  <p className="stat-value">{generatedReport.data.transactionCount}</p>
                </div>
              </div>
              
              <div className="payments-list">
                <h4>Payment Details</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Cashier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedReport.data.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.member?.name || 'N/A'}</td>
                        <td>৳{parseFloat(payment.amount).toFixed(2)}</td>
                        <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                        <td>{payment.payment_method || 'N/A'}</td>
                        <td>{payment.cashier_name || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {reportType === 'members' && (
            <div className="report-members">
              <div className="members-list">
                <h4>Member Details</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Share Amount</th>
                      <th>Total Paid</th>
                      <th>Payments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedReport.data.members.map((member) => (
                      <tr key={member.id}>
                        <td>{member.name}</td>
                        <td>{member.contact}</td>
                        <td>{member.shareAmount}</td>
                        <td>BDT {member.totalPaid}</td>
                        <td>{member.paymentCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'investments' && (
            <div className="report-investments">
              <div className="report-stats">
                <div className="stat-card">
                  <h4>Total Invested</h4>
                  <p className="stat-value">৳{generatedReport.data.totalInvested}</p>
                </div>
                <div className="stat-card">
                  <h4>Investment Count</h4>
                  <p className="stat-value">{generatedReport.data.count}</p>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Member</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedReport.data.investments.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.project?.name}</td>
                      <td>{inv.member?.name}</td>
                      <td>৳{parseFloat(inv.amount).toFixed(2)}</td>
                      <td>{new Date(inv.investment_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'transactions' && (
            <div className="report-transactions">
              <div className="report-stats">
                <div className="stat-card">
                  <h4>Total Amount</h4>
                  <p className="stat-value">৳{generatedReport.data.totalAmount}</p>
                </div>
                <div className="stat-card">
                  <h4>Transaction Count</h4>
                  <p className="stat-value">{generatedReport.data.count}</p>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Member</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedReport.data.transactions.map((txn) => (
                    <tr key={txn.id}>
                      <td>{new Date(txn.transaction_date).toLocaleDateString()}</td>
                      <td>{txn.member?.name || 'N/A'}</td>
                      <td>৳{parseFloat(txn.amount).toFixed(2)}</td>
                      <td>{txn.description || 'N/A'}</td>
                      <td><span className={`status-badge ${txn.status}`}>{txn.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'expenses' && (
            <div className="report-expenses">
              <div className="report-stats">
                <div className="stat-card">
                  <h4>Total Expenses</h4>
                  <p className="stat-value">৳{generatedReport.data.totalExpenses}</p>
                </div>
                <div className="stat-card">
                  <h4>Expense Count</h4>
                  <p className="stat-value">{generatedReport.data.count}</p>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedReport.data.expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td>{new Date(exp.expense_date).toLocaleDateString()}</td>
                      <td>{exp.category}</td>
                      <td>৳{parseFloat(exp.amount).toFixed(2)}</td>
                      <td>{exp.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'cashier' && (
            <div className="report-cashier">
              <div className="report-stats">
                <div className="stat-card">
                  <h4>Total Held by Cashiers</h4>
                  <p className="stat-value">৳{generatedReport.data.totalHeld}</p>
                </div>
                <div className="stat-card">
                  <h4>Active Cashiers</h4>
                  <p className="stat-value">{generatedReport.data.count}</p>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cashier Name</th>
                    <th>Amount Held</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedReport.data.cashiers.map((cashier, idx) => (
                    <tr key={idx}>
                      <td>{cashier.name}</td>
                      <td className="positive">৳{cashier.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="no-report">
          <p>Select report type and click "Generate Report" to view data</p>
        </div>
      )}
    </div>
  );
};

export default Reports;