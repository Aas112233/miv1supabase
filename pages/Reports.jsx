import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import './Reports.css';

const Reports = ({ members, payments, requests }) => {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [generatedReport, setGeneratedReport] = useState(null);
  
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
  const generatePaymentReport = () => {
    // Filter payments by date range if provided
    let filteredPayments = payments;
    if (dateRange.start && dateRange.end) {
      filteredPayments = payments.filter(payment => 
        payment.paymentDate >= dateRange.start && payment.paymentDate <= dateRange.end
      );
    }
    
    const paymentSummary = filteredPayments.reduce((acc, payment) => {
      acc.totalAmount += payment.amount;
      acc.count++;
      return acc;
    }, { totalAmount: 0, count: 0 });
    
    return {
      title: 'Payment Report',
      data: {
        totalAmount: paymentSummary.totalAmount.toFixed(2),
        transactionCount: paymentSummary.count,
        payments: filteredPayments
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

  const handleGenerateReport = () => {
    startLoading('generateReport');
    
    // Simulate API call delay
    setTimeout(() => {
      let report;
      
      switch (reportType) {
        case 'summary':
          report = generateSummaryReport();
          break;
        case 'payments':
          report = generatePaymentReport();
          break;
        case 'members':
          report = generateMemberReport();
          break;
        default:
          report = generateSummaryReport();
      }
      
      setGeneratedReport(report);
      addToast('Report generated successfully!', 'success');
      stopLoading('generateReport');
    }, 800);
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

  const handleExportReport = () => {
    if (!generatedReport) return;
    
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
          ['Total Amount', `BDT ${generatedReport.data.totalAmount}`],
          ['Transaction Count', generatedReport.data.transactionCount],
          [''],
          ['Member', 'Amount', 'Month', 'Date', 'Method'],
          ...generatedReport.data.payments.map(p => [
            p.memberName,
            p.amount.toFixed(2),
            p.paymentMonth,
            p.paymentDate,
            p.paymentMethod
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
    }
    
    exportToCSV(csvData, filename);
    addToast('Report exported successfully!', 'success');
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
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="summary">Summary Report</option>
            <option value="payments">Payment Report</option>
            <option value="members">Member Report</option>
          </select>
        </div>
        
        <div className="filter-group date-filters">
          <div className="date-input">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
          </div>
          
          <div className="date-input">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
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
            <button 
              className="btn btn--secondary"
              onClick={handleExportReport}
            >
              📥 Export to CSV
            </button>
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
                  <p className="stat-value">BDT {generatedReport.data.totalAmount}</p>
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
                      <th>Month</th>
                      <th>Date</th>
                      <th>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedReport.data.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.memberName}</td>
                        <td>BDT {payment.amount.toFixed(2)}</td>
                        <td>{payment.paymentMonth}</td>
                        <td>{payment.paymentDate}</td>
                        <td>{payment.paymentMethod}</td>
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