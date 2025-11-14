import React, { useState, useEffect, useMemo } from 'react';
import { FaUsers, FaMoneyBillWave, FaCreditCard, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import CurrencyBangladeshiIcon from '../components/CurrencyBangladeshiIcon';
import { 
  LineChart, Line, BarChart, Bar, RadarChart, Radar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import useLoading from '../hooks/useLoading';
import useCountUp from '../hooks/useCountUp';
import LoadingSpinner from '../components/LoadingSpinner';
import { parseDbDate, getMonthKey, getMonthName, formatDateDisplay } from '../utils/dateUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../src/config/supabaseClient';
import './Dashboard.css';

const Dashboard = ({ members, payments, expenses = [], projects = [] }) => {
  const { t: translations } = useLanguage();
  const t = (key) => key.split('.').reduce((obj, k) => obj?.[k], translations) || key;
  const { currentUser } = useAuth();
  
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalShares: 0,
    totalPayments: 0,
    totalAmount: 0,
    totalExpenses: 0,
    activeProjects: 0,
    netBalance: 0,
    pendingRequests: 0
  });
  
  const [oldRequestsCount, setOldRequestsCount] = useState(0);
  
  const { startLoading, stopLoading, isLoading } = useLoading();
  
  // Animated counters
  const animatedMembers = useCountUp(stats.totalMembers, 1000);
  const animatedShares = useCountUp(stats.totalShares, 1000);
  const animatedPayments = useCountUp(stats.totalPayments, 1000);
  const animatedAmount = useCountUp(stats.totalAmount, 1500, 2);
  const animatedExpenses = useCountUp(stats.totalExpenses, 1500, 2);
  const animatedProjects = useCountUp(stats.activeProjects, 1000);
  const animatedPendingRequests = useCountUp(stats.pendingRequests, 1000);

  // Check for old transaction requests
  useEffect(() => {
    const checkOldRequests = async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('transaction_requests')
        .select('id')
        .eq('status', 'pending')
        .lt('created_at', twentyFourHoursAgo);
      
      if (!error && data) {
        console.log('Old requests found:', data.length);
        setOldRequestsCount(data.length);
      } else if (error) {
        console.error('Error fetching old requests:', error);
      }
    };
    
    checkOldRequests();
    
    const subscription = supabase
      .channel('old_requests_check')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_requests' }, () => {
        checkOldRequests();
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Calculate stats with simulated loading
  useEffect(() => {
    startLoading('loadStats');
    
    // Simulate API call delay (2 seconds for skeleton)
    setTimeout(async () => {
      const totalShares = members.reduce((sum, member) => sum + (member.shareAmount || 0), 0);
      const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const activeProjects = projects.filter(p => p.status === 'Active').length;
      
      // Fetch pending requests count
      const { data: pendingData } = await supabase
        .from('transaction_requests')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');
      
      setStats({
        totalMembers: members.length,
        totalShares,
        totalPayments: payments.length,
        totalAmount,
        totalExpenses,
        activeProjects,
        netBalance: totalAmount - totalExpenses,
        pendingRequests: pendingData?.length || 0
      });
      
      stopLoading('loadStats');
    }, 2000);
  }, [members, payments, expenses, projects]);

  // Prepare data for Total Savings Growth chart
  const savingsGrowthData = useMemo(() => {
    if (!payments.length) return [];
    
    // Filter out payments with invalid dates and amounts
    const validPayments = payments.filter(payment => 
      payment.payment_date && payment.amount
    );
    
    // Sort payments by corrected date
    const sortedPayments = [...validPayments].sort((a, b) => {
      const dateA = parseDbDate(a.payment_date);
      const dateB = parseDbDate(b.payment_date);
      return dateA.localeCompare(dateB);
    });
    
    // Calculate cumulative savings
    let cumulativeAmount = 0;
    return sortedPayments.map(payment => {
      cumulativeAmount += payment.amount;
      return {
        date: parseDbDate(payment.payment_date),
        amount: parseFloat(cumulativeAmount.toFixed(2))
      };
    });
  }, [payments]);

  // Prepare data for Monthly Savings Trends chart
  const monthlySavingsData = useMemo(() => {
    if (!payments.length) return [];
    
    // Group payments by month
    const monthlyData = {};
    payments.forEach(payment => {
      // Check if payment has a valid date and amount
      if (!payment.payment_date || !payment.amount) return;
      
      const monthKey = getMonthKey(payment.payment_date);
      if (!monthKey) return;
      
      const monthName = getMonthName(payment.payment_date);
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthName, amount: 0, sortKey: monthKey };
      }
      monthlyData[monthKey].amount += payment.amount;
    });
    
    // Convert to array and sort by sortKey
    return Object.values(monthlyData)
      .filter(item => item.amount > 0)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [payments]);

  // Prepare data for Member Contribution Distribution chart
  const memberContributionData = useMemo(() => {
    if (!payments.length || !members.length) return [];
    
    // Calculate total contributions per member
    const memberContributions = {};
    payments.forEach(payment => {
      // Check if payment has required data
      if (!payment.member_id || !payment.amount) return;
      
      if (!memberContributions[payment.member_id]) {
        const member = members.find(m => m.id === payment.member_id);
        memberContributions[payment.member_id] = {
          name: member?.name || 'Unknown',
          amount: 0
        };
      }
      memberContributions[payment.member_id].amount += payment.amount;
    });
    
    // Convert to array and sort by amount (descending)
    return Object.values(memberContributions)
      .filter(item => item.name !== 'Unknown' && item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Show top 10 contributors
  }, [payments, members]);

  // Prepare data for Project Revenue/Loss chart
  const projectFinancialsData = useMemo(() => {
    if (!projects.length) return [];
    
    return projects
      .filter(project => project.name)
      .map(project => {
        const revenue = project.total_revenue || 0;
        const investment = project.initial_investment || 0;
        const profit = revenue - investment;
        
        return {
          name: project.name,
          revenue: parseFloat(revenue.toFixed(2)),
          investment: parseFloat(investment.toFixed(2)),
          profit: parseFloat(profit.toFixed(2))
        };
      })
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);
  }, [projects]);

  // Prepare data for Top Performing Payment Months chart
  const topPerformingMonthsData = useMemo(() => {
    if (!payments.length) return [];
    
    // Group payments by month
    const monthlyData = {};
    payments.forEach(payment => {
      // Check if payment has a valid date and amount
      if (!payment.payment_date || !payment.amount) return;
      
      const monthKey = getMonthKey(payment.payment_date);
      if (!monthKey) return;
      
      const monthName = getMonthName(payment.payment_date);
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { 
          month: monthName, 
          amount: 0, 
          count: 0 
        };
      }
      monthlyData[monthKey].amount += payment.amount;
      monthlyData[monthKey].count += 1;
    });
    
    // Convert to array, filter valid data, sort by amount (descending), and take top 10
    return Object.values(monthlyData)
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [payments]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? `৳${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>{t('dashboard.title')}</h2>
      </div>

      {oldRequestsCount > 0 && (
        <div className="alert-banner">
          <FaExclamationTriangle className="alert-icon" />
          <span className="alert-message">
            {oldRequestsCount} transaction request{oldRequestsCount > 1 ? 's' : ''} pending for more than 24 hours. Please review and update.
          </span>
        </div>
      )}

      {isLoading('loadStats') ? (
        <>
          <div className="dashboard-stats">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="skeleton skeleton-stat-card"></div>
            ))}
          </div>
          <div className="dashboard-charts">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton skeleton-chart"></div>
            ))}
          </div>
          <div className="skeleton skeleton-recent"></div>
        </>
      ) : (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon stat-icon--members">
                <FaUsers />
              </div>
              <div className="stat-info">
                <h3>{animatedMembers}</h3>
                <p>{t('dashboard.members')}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon stat-icon--shares">
                <FaMoneyBillWave />
              </div>
              <div className="stat-info">
                <h3>{animatedShares}</h3>
                <p>{t('dashboard.totalShares')}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon stat-icon--payments">
                <FaCreditCard />
              </div>
              <div className="stat-info">
                <h3>{animatedPayments}</h3>
                <p>{t('dashboard.payments')}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon stat-icon--amount">
                <CurrencyBangladeshiIcon size={32} color="currentColor" />
              </div>
              <div className="stat-info">
                <h3>৳{animatedAmount}</h3>
                <p>{t('dashboard.totalAmount')}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon stat-icon--expenses">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 14C20.49 12.54 22 10.79 22 8.5C22 7.04131 21.4205 5.64236 20.3891 4.61091C19.3576 3.57946 17.9587 3 16.5 3C14.74 3 13.5 3.5 12 5C10.5 3.5 9.26 3 7.5 3C6.04131 3 4.64236 3.57946 3.61091 4.61091C2.57946 5.64236 2 7.04131 2 8.5C2 10.8 3.5 12.55 5 14L12 21L19 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stat-info">
                <h3>৳{animatedExpenses}</h3>
                <p>{t('dashboard.totalExpenses')}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon stat-icon--projects">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stat-info">
                <h3>{animatedProjects}</h3>
                <p>{t('dashboard.activeProjects')}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon stat-icon--pending">
                <FaClock />
              </div>
              <div className="stat-info">
                <h3>{animatedPendingRequests}</h3>
                <p>Pending Requests</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="dashboard-charts">
            {/* Total Savings Growth Chart */}
            <div className="chart-container">
              <h3>{t('dashboard.totalSavingsGrowth')}</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={savingsGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (!value) return '';
                        const [year, month] = value.substring(0, 7).split('-');
                        const date = new Date(year, parseInt(month) - 1, 1);
                        return `${date.toLocaleString('default', { month: 'short' })} ${year}`;
                      }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `৳${value.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      name={t('dashboard.totalSavings')} 
                      stroke="#007bff" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6, stroke: '#007bff', strokeWidth: 2, fill: '#fff' }}
                      animationDuration={300}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Savings Trends Chart */}
            <div className="chart-container">
              <h3>{t('dashboard.monthlySavingsTrends')}</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlySavingsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `৳${value.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      name={t('dashboard.monthlySavings')} 
                      stroke="#28a745" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6, stroke: '#28a745', strokeWidth: 2, fill: '#fff' }}
                      animationDuration={300}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Member Contribution Distribution Chart */}
            <div className="chart-container">
              <h3>{t('dashboard.topMemberContributions')}</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={memberContributionData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} tick={{ fontSize: 10 }} tickFormatter={(value) => `৳${value.toLocaleString()}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Radar 
                      name={t('dashboard.contribution')} 
                      dataKey="amount" 
                      stroke="#ffc107" 
                      fill="#ffc107" 
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Project Revenue/Loss Chart */}
            <div className="chart-container">
              <h3>{t('dashboard.projectFinancialOverview')}</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projectFinancialsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `৳${value.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="revenue" 
                      name={t('dashboard.revenue')} 
                      fill="#28a745" 
                      animationDuration={300}
                    />
                    <Bar 
                      dataKey="investment" 
                      name={t('dashboard.investment')} 
                      fill="#ffc107" 
                      animationDuration={300}
                    />
                    <Bar 
                      dataKey="profit" 
                      name={t('dashboard.profitLoss')} 
                      fill={projectFinancialsData.map(item => item.profit >= 0 ? "#007bff" : "#dc3545")} 
                      animationDuration={300}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Performing Payment Months Chart */}
            <div className="chart-container">
              <h3>{t('dashboard.topPerformingMonths')}</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topPerformingMonthsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `৳${value.toLocaleString()}`}
                    />
                    <YAxis 
                      dataKey="month" 
                      type="category" 
                      tick={{ fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="amount" 
                      name={t('dashboard.totalAmount')} 
                      fill="#17a2b8" 
                      animationDuration={300}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="dashboard-recent">
            <h3>{t('dashboard.recentPayments')}</h3>
            {payments.length > 0 ? (
              <div className="recent-payments">
                {payments
                  .filter(payment => payment && payment.payment_date && payment.amount)
                  .slice(0, 5)
                  .map((payment) => (
                  <div className="payment-item" key={payment.id}>
                    <div className="payment-member">{payment.memberName || payment.members?.name || 'Unknown Member'}</div>
                    <div className="payment-amount">৳{payment.amount.toFixed(2)}</div>
                    <div className="payment-date">
                      {formatDateDisplay(payment.payment_date)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-payments">{t('dashboard.noPayments')}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;