import React, { useState, useEffect, useMemo } from 'react';
import { FaUsers, FaMoneyBillWave, FaCreditCard, FaDollarSign } from 'react-icons/fa';
import { 
  LineChart, Line, BarChart, Bar, RadarChart, Radar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import './Dashboard.css';

const Dashboard = ({ members, payments }) => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalShares: 0,
    totalPayments: 0,
    totalAmount: 0
  });
  
  const { startLoading, stopLoading, isLoading } = useLoading();

  // Calculate stats with simulated loading
  useEffect(() => {
    startLoading('loadStats');
    
    // Simulate API call delay
    setTimeout(() => {
      const totalShares = members.reduce((sum, member) => sum + member.shareAmount, 0);
      const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      setStats({
        totalMembers: members.length,
        totalShares,
        totalPayments: payments.length,
        totalAmount
      });
      
      stopLoading('loadStats');
    }, 600);
  }, [members, payments]);

  // Prepare data for Total Savings Growth chart
  const savingsGrowthData = useMemo(() => {
    if (!payments.length) return [];
    
    // Sort payments by date
    const sortedPayments = [...payments].sort((a, b) => 
      new Date(a.paymentDate) - new Date(b.paymentDate)
    );
    
    // Calculate cumulative savings
    let cumulativeAmount = 0;
    return sortedPayments.map(payment => {
      cumulativeAmount += payment.amount;
      return {
        date: payment.paymentDate,
        amount: cumulativeAmount
      };
    });
  }, [payments]);

  // Prepare data for Monthly Savings Trends chart
  const monthlySavingsData = useMemo(() => {
    if (!payments.length) return [];
    
    // Group payments by month
    const monthlyData = {};
    payments.forEach(payment => {
      const date = new Date(payment.paymentDate);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthName, amount: 0 };
      }
      monthlyData[monthKey].amount += payment.amount;
    });
    
    // Convert to array and sort by date
    return Object.values(monthlyData).sort((a, b) => {
      // Extract year and month from the month string (e.g., "Jan 2025")
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      
      // Create date objects for comparison
      const dateA = new Date(`${aMonth} 1, ${aYear}`);
      const dateB = new Date(`${bMonth} 1, ${bYear}`);
      
      return dateA - dateB;
    });
  }, [payments]);

  // Prepare data for Member Contribution Distribution chart
  const memberContributionData = useMemo(() => {
    if (!payments.length || !members.length) return [];
    
    // Calculate total contributions per member
    const memberContributions = {};
    payments.forEach(payment => {
      if (!memberContributions[payment.memberId]) {
        memberContributions[payment.memberId] = {
          name: payment.memberName,
          amount: 0
        };
      }
      memberContributions[payment.memberId].amount += payment.amount;
    });
    
    // Convert to array
    return Object.values(memberContributions);
  }, [payments, members]);

  // Prepare data for Top Performing Payment Months chart
  const topPerformingMonthsData = useMemo(() => {
    if (!payments.length) return [];
    
    // Group payments by month
    const monthlyData = {};
    payments.forEach(payment => {
      const date = new Date(payment.paymentDate);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
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
    
    // Convert to array, sort by amount (descending), and take top 10
    return Object.values(monthlyData)
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
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
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
        <h2>Dashboard</h2>
      </div>

      {isLoading('loadStats') ? (
        <div className="loading-container">
          <LoadingSpinner message="Loading dashboard data..." />
        </div>
      ) : (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon stat-icon--members">
                <FaUsers />
              </div>
              <div className="stat-info">
                <h3>{stats.totalMembers}</h3>
                <p>Members</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon stat-icon--shares">
                <FaMoneyBillWave />
              </div>
              <div className="stat-info">
                <h3>{stats.totalShares}</h3>
                <p>Total Shares</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon stat-icon--payments">
                <FaCreditCard />
              </div>
              <div className="stat-info">
                <h3>{stats.totalPayments}</h3>
                <p>Payments</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon stat-icon--amount">
                <FaDollarSign />
              </div>
              <div className="stat-info">
                <h3>{stats.totalAmount.toFixed(2)}</h3>
                <p>Total Amount (BDT)</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="dashboard-charts">
            {/* Total Savings Growth Chart */}
            <div className="chart-container">
              <h3>Total Savings Growth Over Time</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={savingsGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
                      }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      name="Total Savings (BDT)" 
                      stroke="#007bff" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Savings Trends Chart */}
            <div className="chart-container">
              <h3>Monthly Savings Trends</h3>
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
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      name="Monthly Savings (BDT)" 
                      stroke="#28a745" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Member Contribution Distribution Chart */}
            <div className="chart-container">
              <h3>Member Contribution Distribution</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={memberContributionData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis 
                      tick={{ fontSize: 12 }} 
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Radar
                      name="Contribution (BDT)"
                      dataKey="amount"
                      stroke="#ffc107"
                      fill="#ffc107"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Performing Payment Months Chart */}
            <div className="chart-container">
              <h3>Top Performing Payment Months</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topPerformingMonthsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.toLocaleString()}
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
                      name="Total Amount (BDT)" 
                      fill="#17a2b8" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="dashboard-recent">
            <h3>Recent Payments</h3>
            {payments.length > 0 ? (
              <div className="recent-payments">
                {payments.slice(0, 5).map((payment) => (
                  <div className="payment-item" key={payment.id}>
                    <div className="payment-member">{payment.memberName}</div>
                    <div className="payment-amount">{payment.amount.toFixed(2)} BDT</div>
                    <div className="payment-date">{payment.paymentDate}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-payments">No payments recorded yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;