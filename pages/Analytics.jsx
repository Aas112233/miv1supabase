import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getMonthKey, getMonthName } from '../utils/dateUtils';
import { useLanguage } from '../contexts/LanguageContext';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import html2canvas from 'html2canvas';
import './Analytics.css';

const Analytics = ({ payments, members: membersList }) => {
  const { t } = useLanguage();
  const { startLoading, stopLoading, isLoading } = useLoading();
  const [viewMode, setViewMode] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const reportRef = useRef(null);

  useEffect(() => {
    startLoading('analyticsData');
    setTimeout(() => {
      stopLoading('analyticsData');
    }, 2000);
  }, []);

  const getCashierColor = (cashierName) => {
    const colors = [
      '#007bff', '#FFD700', '#000000', '#FF6B35', '#9B59B6',
      '#E74C3C', '#16A085', '#F39C12', '#2C3E50', '#27AE60'
    ];
    let hash = 0;
    for (let i = 0; i < cashierName.length; i++) {
      hash = cashierName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const months = useMemo(() => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    const paymentMonths = new Set();
    payments.forEach(p => {
      const desc = p.description || p.paymentMonth;
      if (desc) paymentMonths.add(desc.trim());
    });
    
    let latestYear = 2025;
    let latestMonth = 0;
    
    paymentMonths.forEach(desc => {
      const lower = desc.toLowerCase();
      const yearMatch = lower.match(/(\d{4})/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        monthNames.forEach((m, i) => {
          if (lower.includes(m.toLowerCase())) {
            const monthNum = i + 1;
            if (year > latestYear || (year === latestYear && monthNum > latestMonth)) {
              latestYear = year;
              latestMonth = monthNum;
            }
          }
        });
      }
    });
    
    const result = [];
    const start = new Date(2025, 0, 1);
    const end = new Date(latestYear, latestMonth - 1, 1);
    
    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
      const monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      result.push({
        value: monthLabel,
        label: monthLabel
      });
    }
    
    return result;
  }, [payments]);

  const members = useMemo(() => {
    const uniqueMembers = [...new Set(payments.map(p => p.memberName))].filter(Boolean);
    return uniqueMembers.sort();
  }, [payments]);

  useEffect(() => {
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[months.length - 1].value);
    }
    if (members.length > 0 && !selectedMember) {
      setSelectedMember(members[0]);
    }
  }, [months, members, selectedMonth, selectedMember]);

  const getPaymentInfo = (memberName, monthValue) => {
    const payment = payments.find(p => {
      if (p.memberName !== memberName) return false;
      const desc = (p.description || p.paymentMonth || '').trim();
      return desc === monthValue;
    });
    
    return payment ? { 
      paid: true, 
      amount: payment.amount || 0,
      cashier: payment.cashier_name || payment.cashierName || 'N/A'
    } : { 
      paid: false, 
      amount: 0,
      cashier: ''
    };
  };

  const monthlyViewData = useMemo(() => {
    if (!selectedMonth || !members.length) return [];
    return members.map(memberName => {
      const paymentInfo = getPaymentInfo(memberName, selectedMonth);
      const member = membersList?.find(m => m.name === memberName);
      const shareCount = member?.shareAmount || 0;
      const expectedAmount = shareCount * 1000;
      const paidAmount = paymentInfo.amount;
      const percentage = expectedAmount > 0 ? Math.round((paidAmount / expectedAmount) * 100) : 0;
      const isFullyPaid = paidAmount >= expectedAmount;
      
      return {
        name: memberName,
        paid: paymentInfo.paid,
        amount: paidAmount,
        cashier: paymentInfo.cashier,
        percentage,
        isFullyPaid,
        expectedAmount
      };
    });
  }, [members, selectedMonth, payments, membersList]);

  const memberViewData = useMemo(() => {
    if (!selectedMember) return [];
    const member = membersList?.find(m => m.name === selectedMember);
    const shareCount = member?.shareAmount || 0;
    const expectedAmount = shareCount * 1000;
    
    return months.map(month => {
      const paymentInfo = getPaymentInfo(selectedMember, month.value);
      const paidAmount = paymentInfo.amount;
      const percentage = expectedAmount > 0 ? Math.round((paidAmount / expectedAmount) * 100) : 0;
      const isFullyPaid = paidAmount >= expectedAmount;
      
      return {
        month: month.label,
        monthValue: month.value,
        paid: paymentInfo.paid,
        amount: paidAmount,
        cashier: paymentInfo.cashier,
        percentage,
        isFullyPaid,
        expectedAmount
      };
    });
  }, [months, selectedMember, payments, membersList]);

  const paidCount = viewMode === 'monthly' 
    ? monthlyViewData.filter(d => d.paid).length 
    : memberViewData.filter(d => d.paid).length;
  
  const notPaidCount = viewMode === 'monthly'
    ? monthlyViewData.filter(d => !d.paid).length
    : memberViewData.filter(d => !d.paid).length;

  const topPaidMembers = useMemo(() => {
    if (viewMode === 'monthly' && monthlyViewData.length > 0) {
      const paidMembers = monthlyViewData.filter(d => d.paid && d.amount > 0);
      if (paidMembers.length === 0) return [];
      const maxAmount = Math.max(...paidMembers.map(m => m.amount));
      return paidMembers.filter(m => m.amount === maxAmount);
    }
    return [];
  }, [viewMode, monthlyViewData]);

  const monthTotalPaidAmount = useMemo(() => {
    if (viewMode === 'monthly' && monthlyViewData.length > 0) {
      return monthlyViewData.filter(d => d.paid).reduce((sum, d) => sum + d.amount, 0);
    }
    return 0;
  }, [viewMode, monthlyViewData]);

  const memberShareAmount = useMemo(() => {
    if (viewMode === 'member' && selectedMember && membersList) {
      const member = membersList.find(m => m.name === selectedMember);
      return member ? member.shareAmount : 0;
    }
    return 0;
  }, [viewMode, selectedMember, membersList]);

  const memberTotalPayment = useMemo(() => {
    if (viewMode === 'member' && selectedMember) {
      return payments
        .filter(p => p.memberName === selectedMember)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    }
    return 0;
  }, [viewMode, selectedMember, payments]);

  const handleDownloadImage = async () => {
    if (!reportRef.current) return;
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: document.body.classList.contains('theme-dark') ? '#121212' : '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const link = document.createElement('a');
      const fileName = viewMode === 'member' 
        ? `${selectedMember}_Payment_Report.png`
        : `${selectedMonth}_Payment_Report.png`;
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  if (isLoading('analyticsData')) {
    return (
      <div className="analytics">
        <div className="analytics-header">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-toggle"></div>
        </div>
        <div className="analytics-controls">
          <div className="skeleton skeleton-select"></div>
        </div>
        <div className="analytics-stats">
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
        </div>
        <div className="analytics-legend">
          <div className="skeleton skeleton-legend"></div>
        </div>
        <div className="analytics-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton skeleton-grid-item"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h2>{t.analytics.title}</h2>
      </div>
      
      <div className="view-toggle">
        <button 
          className={viewMode === 'monthly' ? 'active' : ''} 
          onClick={() => setViewMode('monthly')}
        >
          {t.analytics.monthlyView}
        </button>
        <button 
          className={viewMode === 'member' ? 'active' : ''} 
          onClick={() => setViewMode('member')}
        >
          {t.analytics.memberView}
        </button>
      </div>

      <div className="analytics-controls">
        {viewMode === 'monthly' ? (
          <div className="control-group">
            <label>{t.analytics.selectMonth}:</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="control-group">
            <label>{t.analytics.selectMember}:</label>
            <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)}>
              {members.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="analytics-report" ref={reportRef}>

        <div className="analytics-stats">
          {viewMode === 'member' && selectedMember && (
            <>
              <div className="stat-card stat-member">
                <h3>{selectedMember}</h3>
                <p>{t.analytics.selectedMember}</p>
              </div>
              <div className="stat-card stat-share">
                <h3>{memberShareAmount}</h3>
                <p>{t.analytics.shareAmount}</p>
              </div>
              <div className="stat-card stat-total">
                <h3>৳{memberTotalPayment.toFixed(2)}</h3>
                <p>{t.analytics.totalPayment}</p>
              </div>
            </>
          )}
          {viewMode === 'monthly' && selectedMonth && (
            <div className="stat-card stat-total">
              <h3>{selectedMonth}</h3>
              <p>{t.analytics.selectedMonth}</p>
            </div>
          )}
          {viewMode === 'monthly' && topPaidMembers.length > 0 && (
            <div className="stat-card stat-member">
              <h3 className="top-paid-names">{topPaidMembers.map(m => m.name).join(', ')}</h3>
              <p>{topPaidMembers.length > 1 ? t.analytics.topPaidMembers : t.analytics.topPaidMember}</p>
            </div>
          )}
          {viewMode === 'monthly' && (
            <div className="stat-card stat-share">
              <h3>৳{monthTotalPaidAmount.toFixed(2)}</h3>
              <p>{t.analytics.monthTotalPaid}</p>
            </div>
          )}
          <div className="stat-card stat-paid">
            <h3>{paidCount}</h3>
            <p>{t.analytics.paid}</p>
          </div>
          <div className="stat-card stat-not-paid">
            <h3>{notPaidCount}</h3>
            <p>{t.analytics.notPaid}</p>
          </div>
        </div>

        <div className="analytics-legend">
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-color paid"></span>
              <span>{t.analytics.paid}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color not-paid"></span>
              <span>{t.analytics.notPaid}</span>
            </div>
          </div>
        </div>

        {viewMode === 'monthly' ? (
          <div className="analytics-grid">
            {monthlyViewData.map(item => {
              const getBackgroundColor = () => {
                if (!item.paid) return '';
                if (item.isFullyPaid) return '';
                const p = item.percentage;
                if (p >= 75) return `rgba(255, 165, 0, 0.8)`;
                if (p >= 50) return `rgba(255, 100, 0, 0.8)`;
                if (p >= 25) return `rgba(255, 50, 0, 0.8)`;
                return `rgba(220, 53, 69, 0.8)`;
              };
              
              const getStatusLabel = () => {
                if (!item.paid) return `✗ ${t.analytics.notPaid}`;
                if (item.amount === 0) return '✗ Not Paid';
                if (item.isFullyPaid) return '✓ Full Paid';
                const p = item.percentage;
                if (p >= 75) return '✓ Semi Paid';
                if (p >= 50) return '✓ Half Paid';
                if (p >= 25) return '✓ Quarter Paid';
                return '✓ Partial Paid';
              };
              
              return (
                <div 
                  key={item.name} 
                  className={`analytics-card ${item.paid ? (item.isFullyPaid ? 'paid' : 'partial-paid') : 'not-paid'}`}
                  style={item.paid && !item.isFullyPaid ? { background: getBackgroundColor() } : {}}
                >
                  <div className="card-name">{item.name}</div>
                  {item.paid && <div className="card-amount">৳{item.amount.toFixed(2)}</div>}
                  <div className="card-status">
                    {getStatusLabel()}
                    {item.paid && (
                      <div className="card-percentage">
                        {item.amount === 0 ? '0% paid' : item.isFullyPaid ? '100% paid' : `${item.percentage}% paid`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="analytics-timeline">
            {memberViewData.map(item => {
              const getBackgroundColor = () => {
                if (!item.paid) return '';
                if (item.isFullyPaid) return '';
                const p = item.percentage;
                if (p >= 75) return `rgba(255, 165, 0, 0.8)`;
                if (p >= 50) return `rgba(255, 100, 0, 0.8)`;
                if (p >= 25) return `rgba(255, 50, 0, 0.8)`;
                return `rgba(220, 53, 69, 0.8)`;
              };
              
              const getStatusLabel = () => {
                if (!item.paid) return `✗ ${t.analytics.notPaid}`;
                if (item.amount === 0) return '✗ Not Paid';
                if (item.isFullyPaid) return '✓ Full Paid';
                const p = item.percentage;
                if (p >= 75) return '✓ Semi Paid';
                if (p >= 50) return '✓ Half Paid';
                if (p >= 25) return '✓ Quarter Paid';
                return '✓ Partial Paid';
              };
              
              return (
                <div 
                  key={item.monthValue} 
                  className={`timeline-item ${item.paid ? (item.isFullyPaid ? 'paid' : 'partial-paid') : 'not-paid'}`}
                  style={item.paid && !item.isFullyPaid ? { background: getBackgroundColor() } : {}}
                >
                  <div className="timeline-month">
                    {item.month}
                    {item.paid && (
                      <>
                        <span className="timeline-amount"> - ৳{item.amount.toFixed(2)}</span>
                        <span className="timeline-cashier"> - {t.analytics.receivedBy} <span className="cashier-name" style={{ color: getCashierColor(item.cashier) }}>({item.cashier})</span></span>
                        <span className="timeline-percentage"> - {item.amount === 0 ? '0% paid' : item.isFullyPaid ? '100% paid' : `${item.percentage}% paid`}</span>
                      </>
                    )}
                  </div>
                  <div className="timeline-status">{getStatusLabel()}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="download-section">
        <button className="btn btn--download" onClick={handleDownloadImage}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Download as Image
        </button>
      </div>
    </div>
  );
};

export default Analytics;
